// Application Copyright (c) 2012 Hard Data Factory. All rights reserved.
var showinggrid = 0;        // Displaying the grid calendar (or the list)?
var selected_date;          // the selected date in YYYY-MM-DD format
var todaydate;              // today's date in YYYY-MM-DD format

var month_names = Array( "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" );
var days_abbrev = Array( "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" );

var app_is_still_initializing = true;  // Allow no clicks while app loads
var current_event = null;    // The event currently displayed on detail page

var citylist;  // List of city URL and written names
var citydata;  // City-specific info like tagline and sponsor HTML
var hdf_strings; // All stings needed for event listings
var hdf_events; // An array of events that index into hdf_strings
var current_city = "";

var has_a_city_ever_been_selected = 0;

//----------------------------------------------------------------------
// Set up which elements of the calendar grid can and cannot be clicked on
function initialize_app( )
{
    // Click event website and it opens in the device's browser
    // DEVICE SPECIFIC CODE GOES HERE, use var current_event
    // $(".external-link").live('click', function(e) {
    //   return false;
    // });

    // Click "add to calendar" and event is added to device's calendar
    // DEVICE SPECIFIC CODE GOES HERE, use var current_event
    // $(".calendar-link").live('click', function(e) {
    // return false;
    // });

    // Click "email this event" and an email is built in device's emailer
    // DEVICE SPECIFIC CODE GOES HERE, use var current_event
    // $(".email-link").live('click', function(e) {
    //   return false;
    // });

    var today = new Date( );
    todaydate = date_to_string(today);
    initialize_iScroll();   // Allows vertical middle to scroll up & down

    // Use HTML5 local storage to see if city already selected
    if(localStorage && localStorage.currentcity) {
	select_city(localStorage.currentcity);
    } else {
	change_city('boston');
    }
};

//----------------------------------------------------------------------
// Extract whatever is being shown and replace it with a new city's data
function select_city( new_city )
{
   has_a_city_ever_been_selected = 1;
   change_city( new_city );
}


function change_city( new_city )
{
   // But not if more recent than one day
    if( localStorage.last_update == todaydate
	&& localStorage.currentcity == new_city ) {
	citylist = jQuery.parseJSON(localStorage.citylist);
	citydata = jQuery.parseJSON(localStorage.citydata);
	hdf_strings = jQuery.parseJSON(localStorage.hdf_strings);
	hdf_events = jQuery.parseJSON(localStorage.hdf_events);
	insert_city_events( );
    } else {
      $("#mytodaylist").empty();
      $("#monthcal").empty();
      $("#ajax-loader").show();             // Hide the spinning 'wait' wheel
      current_city = new_city;
      localStorage.currentcity = new_city;

      $.getScript("http://harddatafactory.com/techcal/" + current_city + "/event_data.js")
	  .done(function(data, textStatus, jqxhr) {
		  insert_city_events( );
	      })
	  .fail(function(jqxhr, settings, exception) {
		  alert( jqxhr.status + ": " + exception );
	      });
  }
}

//----------------------------------------------------------------------
function insert_city_events( )
{
    // Store this load of data in local cache
    localStorage.last_update = todaydate;
    localStorage.citylist = JSON.stringify(citylist);
    localStorage.citydata = JSON.stringify(citydata);
    localStorage.hdf_strings = JSON.stringify(hdf_strings);
    localStorage.hdf_events = JSON.stringify(hdf_events);

    // Create the flat list HTML and insert it into the DOM
    var html_str = make_flat_list( );
    $("#ajax-loader").hide();             // Hide the spinning 'wait' wheel

    // Display the city's name in the top bar
    var tmp = citydata[0].split('-');
    if( has_a_city_ever_been_selected ) {
	$("#pagetitle").text( 'TechCal: ' + tmp[1] );
    } else {
	$("#pagetitle").text( 'Select a City Below' );
    }
    $("#aboutsponsor").html( citydata[3] );
    $("#sponsorname").text( citydata[4] );

    if( citydata[1] != '' ) {
	$("#mytodaylist").append( "<tr class='listitem'><td colspan=2 onclick='showabout( );' style='padding: 5px;'>"
				  + citydata[1] + "</td></tr>" );
    }
    if( citydata[2] != '' ) {
	$("#mytodaylist").append( "<tr class='listitem'><td colspan=2 onclick='showabout( );' style='padding: 5px;'>"
				  + citydata[2] + "</td></tr>" );
    }
    $("#mytodaylist").append( html_str ); // Insert into the DOM

    // Set the click for each event in the flat list to open the detail page
    var sel = $('a.detail');
    sel.live('click', function() {
        // Highlight the link that was clicked. See .css file for class.
        var sel2 = $(this).parent().parent().addClass('selected_event_link');
        loaddetail( $(this).attr('eventid') );
        sel2.removeClass('selected_event_link');
    });
    sel.width($(window).width() - sel.parent().siblings().width());

    // Create the grid calendar HTML and inser it into the DOM
    html_str = make_grid_cal( );
    $("#monthcal").append( html_str );

    $(".dom td").click( setgriddate );
    $(".unclickable").unbind('click');

    // Flesh out the 'select a city' options page
    var str = "";
    for(var i=0; i<citylist.length; i=i+2) {
	str += '<div onclick="select_city(\'' + citylist[i] + '\')">'
	    + citylist[i+1] + '</div>';
    }
    $("#optiontable").html( str );

    app_is_still_initializing = false;  // Safe to allow user clicks now

    if( has_a_city_ever_been_selected ) {
	hidedetail( );
	myScroll.scrollTo( 0, 0, 0 );   // Must scroll to top or does
    } else {
	showoptions( );
    }
}

//----------------------------------------------------------------------
// In calendar grid mode, flip from showing one month to another
function shownewmonth( tohide, toshow) {
   $("#month" + tohide).css("display", "none");
   $("#month" + toshow).css("display", "table-cell");

   setHeight();
   if(myScroll){
     myScroll.refresh();
     myScroll.scrollTo( 0, 0, 0 );   // Must scroll to top or does not show
   }
}

//----------------------------------------------------------------------
function set_date_to_first_day_of_this_month( toshow )
{
   // Grab 1st date in shown month that has some events and set current date
   var clickables = $("#month" + toshow).find("td:not(.unclickable):not(.enotthismonth)");
   var newday = clickables.find("div").parent();  // not header bar cells
   var id = newday.first().attr("id");
   id = id.substr( 4 ); // transform grid2011-04-05 to 2011-04-05
   setdate( id );
}

//----------------------------------------------------------------------
function togglelist() {
   if( app_is_still_initializing ) {
       return;  // Never mind! Already showing list view.
   }
   if( showinggrid ) {  // Showing the grid
       $("#mbutton").removeClass('newbluebutton').addClass('newbutton');
       $("#mbutton").text("Month");
       $("#monthcal").css("display", "none");
       $(".daydate").css("display", "table-row" );  // Show all rows in the list
       $(".listitem").css("display", "table-row" );  // Show all rows in the list
       $(".noevents").css("display", "none" );  // Hide no event rows in the list
   } else {            // Showing the grid
       $("#mbutton").removeClass('newbutton').addClass('newbluebutton');
       $("#mbutton").text("List");
       $("#monthcal").css("display", "block");
       $(".daydate").css("display", "none" );  // Hide all rows in the list
       $(".listitem").css("display", "none" );  // Hide all rows in the list
       // But show the rows associated with the selected date in grid calendar
       $(".list" + selected_date).css("display", "table-row" );
   }

   showinggrid = !showinggrid;   // Toggle what we're showing
   scroll_list( );  // Reset iScroll vertical height whenever DOM changes
}

//----------------------------------------------------------------------
// Sometimes event descriptions contain a very long word like a URL that
// contains no whitespace, and the browser can't figure out to linebreak
// the word. So please a break in every 30 character run of non-whitespace.
function crop_string( str )
{
   var newstr = "";
   var cnt_non_whitespace = 0;
   for( var x = 0; x < str.length; x++ ) {
       if( str[x] == ' ' )
	   cnt_non_whitespace = 0;
       else
	   cnt_non_whitespace++;
       if( cnt_non_whitespace > 30 ) {
	   newstr += ' ';
	   cnt_non_whitespace = 0;
       }

       newstr += str[x];
   }

   return newstr;
}

//----------------------------------------------------------------------
// The user has clicked on an event! Fill the fields in the "details" DIV
// and show that and hide everything else. Also sets the selected date to
// the start date of whatever was clicked.
//----------------------------------------------------------------------
// Event Data fields come in the following order:
// 0:Title, 1:Date, 2:Venue, 3:Address, 4:Desc, 5:URL, 6:Source,
// 7:Image, 8:Date Start, 9:Date End, 10:Start Time, 11:AM/PM
function loaddetail( eventid ) {
   var e = hdf_events[ eventid ];
   setdate( hdf_strings[ e[8] ] );  // The Start Date
   $("#detail-Title").html( crop_string( hdf_strings[ e[0] ] ) );
   $("#detail-Date").html( crop_string( hdf_strings[ e[1] ] ) );
   $("#detail-Address").html( crop_string( hdf_strings[ e[2] ] )
	      + "<br>" + crop_string( hdf_strings[ e[3] ] ) );
   $("#detail-Desc").html( crop_string( hdf_strings[ e[4] ] ) );
   if( e[7] == undefined ) {
      $("#detail-Image").css( "display", 'none');
   } else {
      $("#detail-Image").load(function(){setHeight(); if(myScroll) myScroll.refresh();});
      $("#detail-Image").attr( "src", "http://harddatafactory.com/techcal/" + current_city + "/thumbs/i" + e[7] + ".jpg" );
      $("#detail-Image").css( "display", 'inline');
   }

   $("#detail-URL").attr( "href", hdf_strings[ e[5] ] );
   $("#detail-Source").attr( "href", hdf_strings[ e[6] ] );
   var domain = hdf_strings[ e[6] ];
   domain = domain.replace(/www\./i, '');  // Lop off www.
   domain = domain.replace(/https?\:\/\//i, '');  // Lop off http://
   domain = domain.replace(/\.com.*/i, '.com');   // Lop off trailer
   domain = domain.replace(/\.org.*/i, '.org');   // Lop off trailer
   var crop_at = domain.indexOf("?");
   if( crop_at > -1 ) {
       domain = domain.substr( 0, crop_at );
   }
   crop_at = domain.indexOf("#");
   if( crop_at > -1 ) {
       domain = domain.substr( 0, crop_at );
   }
   crop_at = domain.indexOf("/");
   if( crop_at > -1 ) {
       domain = domain.substr( 0, crop_at );
   }
   if( domain.length > 25 ) {
       domain = domain.substr( 0, 25 );
   }
   $("#detail-Source").text( "On " + domain );

   // On a website (not mobile device) set up the link to auto-fill an email.
   //----------------------------------------------------------------------
   var emailAddress = "";
   var emailDate = $('#detail-Date').html();
   var emailTitle = $('#detail-Title').html();
   var linkURL = $('#detail-URL').attr('href');
   var location = $('#detail-Address').html();
   location = location.replace(/\<br\>/, '');
   var srcURL = $('#detail-Source').attr('href');
   var description = $("#detail-Desc").html();
   var subject = escape(emailTitle + " on " + emailDate);
   var body = escape("Event: " + emailTitle + "\n" + "Date: " + emailDate + "\n" + "Location: " +  location + "\n" + "URL: " + linkURL + "\n" + "Source: " + srcURL + "\n" + description );
   $(".email-link").attr("href", "mailto:" + emailAddress + "?" + "subject=" + subject + "&" + "body=" + body );
   //----------------------------------------------------------------------
   
   $("#monthcal").css("display", "none");
   $("#mytodaylist").css("display", "none");
   $("#aboutthisapp").css("display", "none");
   $("#options").css("display", "none");
   $("#eventdetail").css("display", "inline");
   $("#footer").css("display", "none");
   $("#pagetitle").text("Event Details");
   $("#backbutton").css("display", "inline");
   current_event = e;   // Use this when sending email or adding to calendar
   setHeight();     // Reset vertical height of middle space when DOM changes
   if(myScroll){    // Is iScroll initialized?
       myScroll.refresh();
       myScroll.scrollTo( 0, 0, 0 );   // Scroll to top to show text
   } else {
       // for show detail also top off the window
       $('#wrapper').scrollTop(0);
       window.scroll(0,0);
   }
}

//----------------------------------------------------------------------
// Hide the event details DIV and show whatever was most recently open,
// either the grid calendar or the flat list view.
function hidedetail( ) {
   $("#mytodaylist").css("display", "inline");
   $("#eventdetail").css("display", "none");
   $("#footer").css("display", "block");
   $("#backbutton").css("display", "none");
   $("#aboutthisapp").css("display", "none");
   $("#options").css("display", "none");

   // Display the city's name in the top bar
   var tmp = citydata[0].split('-');
   $("#pagetitle").text( 'TechCal: ' + tmp[1] );
   if( showinggrid ) {
      $("#monthcal").css("display", "inline");
   }

   scroll_list( );
}

//----------------------------------------------------------------------
// Display the 'options' page
function showoptions( ) {
   // Hide the grid calendar and flat list views
   $("#monthcal").css("display", "none");
   $("#mytodaylist").css("display", "none");
   $("#eventdetail").css("display", "none");
   $("#footer").css("display", "none");
   $("#aboutthisapp").css("display", "none");

   // Show the About This App page
   $("#options").css("display", "inline");
   $("#pagetitle").text("Pick a Metro");
   $("#backbutton").css("display", "inline");

   scroll_list( );
}

//----------------------------------------------------------------------
// Display the "About this App" page that includes the sponsor description
function showabout( ) {

   // Hide the grid calendar and flat list views
   $("#monthcal").css("display", "none");
   $("#mytodaylist").css("display", "none");
   $("#eventdetail").css("display", "none");
   $("#footer").css("display", "none");
   $("#options").css("display", "none");

   // Show the About This App page
   $("#aboutthisapp").css("display", "inline");
   $("#pagetitle").text( citydata[4] );
   $("#backbutton").css("display", "inline");
   scroll_list( );
}

//----------------------------------------------------------------------
// The user clicks on a cell in the grid calendar. Set it to current date.
function setgriddate( )
{
   var id = $(this).attr("id");
   id = id.substr( 4 ); // transform grid2011-4-5 to 2011-4-5
   setdate( id );

   if(myScroll)
       myScroll.scrollTo( 0, 0, 0 );   // Scroll to top or does not show
   else
       window.scroll(0,0);  // Handles if iScroll did not initialize
}

//----------------------------------------------------------------------
function setdate( id )
{
   if( id < todaydate ) {
       id = todaydate;
   }
   if( id == selected_date ) {
       if( !showinggrid ) {
	   scroll_list( );  // Scroll the flat list to the top, "today".
       }
       return;
   }

   // If grid calendar, show only the part of the list for current selection
   if( showinggrid ) {   
       $(".list" + selected_date).css("display", "none" );  // Hide prev rows
       $(".list" + id).css("display", "table-row" );  // Show current pick
   }

   // Every month displayed has bits of the previous and next months.
   // If the month has changed, change the currently showing month
   var idmonth = $("#grid" + id).parents(".monthgrid").attr("id").substr(5);
   var selectedmonth  = $("#grid" + selected_date).parents(".monthgrid").attr("id").substr( 5 );
   if( idmonth != selectedmonth ) {
       shownewmonth( selectedmonth, idmonth );
   }

   // Change on the grid calendar, highlighting current selection
   if( selected_date == todaydate ) {   // selection is today's date
       $("#grid" + selected_date).removeClass("etodayandcurrent");
       $("#grid" + selected_date).addClass("etoday");
   } else {
       $("#grid" + selected_date).removeClass("ecurrent");
   }
   if( id == todaydate ) {
       $("#grid" + id).removeClass("etoday");
       $("#grid" + id).addClass("etodayandcurrent");
   } else {
       $("#grid" + id).addClass("ecurrent");
   }
   selected_date = id;

   scroll_list( );
}

//----------------------------------------------------------------------
// Set the date to today's date
function showtoday( )
{
    if( app_is_still_initializing )
	return;
    if(todaydate == selected_date && !showinggrid)
      myScroll.scrollTo( 0, 0, 1000 );   // Must scroll to top or does not show
    else
        setdate( todaydate );
}

//----------------------------------------------------------------------
function scroll_list( )
{
   // Now scroll the list so that the current selection is at the top
   setHeight();
   if(myScroll){    // Was iScroll properly initialized?
       myScroll.refresh();

       if( showinggrid ) {
	   myScroll.scrollTo( 0, 0, 0 );   // Must scroll to top or does
	   // not show
       } else {
	   myScroll.scrollToElement( "#list" + selected_date, 0 );
       }
   }
   else   // Handle case that iScroll was not initialized properly
      if(!showinggrid && selected_date)
         window.scroll(0,$("#list" + selected_date).offset().top);
      else
        window.scroll(0,0);
}

//----------------------------------------------------------------------
function get_date_from_text( str )
{
    var parts = str.split('-');  // YYYY-MM-DD
    var date = new Date( parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0 );
    return date;
}


//----------------------------------------------------------------------
// Fill out the flat list of events by adding table rows
//----------------------------------------------------------------------
// Event Data fields come in the following order:
// 0:Title, 1:Date, 2:Venue, 3:Address, 4:Desc, 5:URL, 6:Source,
// 7:Image, 8:Date Start, 9:Date End, 10:Start Time, 11:AM/PM

var flat_list;
function make_flat_list( )
{
    // Initialize the current date to today's date
    selected_date = todaydate;

    // First, loop through all the events and "assign them" to the date
    // or multiple dates they will actually appear in the flat list.
    // "flat_list" is an associative array, indexed by date, of strings
    // with each day's table rows
    flat_list = new Array( );
    var last_date_seen = 0;
    var current_date = new Date( );
    jQuery.each( hdf_events, function( i, event ) {
	    current_date = get_date_from_text( hdf_strings[ event[8] ] );
	    var end_date = get_date_from_text( hdf_strings[ event[9] ] );
	    // Put date into format   Apr 4 2011
	    var compute_date_str = date_to_string( current_date );
	    
	    if( end_date > last_date_seen ) {
		last_date_seen = end_date;   // The very last date of all events
	    }
	    while( current_date <= end_date ) {    // Loop until this event is over
		var table_row = "<tr class='listitem list" + compute_date_str + "'>";
		if( event[8] == event[9] ) {  // Don't list time unless single-day event
		    table_row += "<td class='etime'>" + hdf_strings[ event[10] ] + "<span class='am'>" + event[11] + "&nbsp;</span></td>";
		} else {
		    table_row += "<td></td>";
		}
		var short_title = hdf_strings[ event[0] ];

		table_row += "<td class='ititle'><a class='detail' eventid='" + i + "'>"
		    + short_title + "</a></td></tr>\n";

		// Now add a table row for this entry
                if( !flat_list[ compute_date_str ] ) {
		    flat_list[ compute_date_str ] = "";
		}
		flat_list[ compute_date_str ] += table_row;
		current_date.setDate( current_date.getDate( ) + 1 );  // add a day		   
		compute_date_str = date_to_string( current_date );
	    }
	});

    // Now, go through each date from today through 90 days out and build
    // the flat list view, but don't include any trailing dates that are empty
    var html_str = "";
    current_date = new Date( );     // defaults to today's date
    // List the next 90 days but disallow trailing list of days with no events 
    for( var i = 0; i < 90 && current_date <= last_date_seen ; i++ ) {
	// Put date into format   Apr 4 2011
	var print_date_str = month_names[ current_date.getMonth( ) ] + " "
	    + current_date.getDate( ) + " " + current_date.getFullYear( );
        var compute_date_str = date_to_string( current_date );

        if( flat_list[ compute_date_str ] ) {   // has events? list it!
            // Add the table row representing the current date
   	    html_str += "<tr id='list" + compute_date_str + "' class='daydate'><td>"
	    + days_abbrev[ current_date.getDay( ) ] + "</td><td>" + print_date_str + "&nbsp;</td></tr>\n";

	    html_str += flat_list[ compute_date_str ];
	} else {
            html_str += "<tr id='list" + compute_date_str + "' class='noevents list" + compute_date_str + "'><td></td><td><td style='width: 100%;'>No events</td></tr>";
	}

	current_date.setDate( current_date.getDate( ) + 1 );  // add a day		   
    }

    return html_str;
}

//----------------------------------------------------------------------
// Create the HTML code that displays events in grid calendar format.
// Returns a string to be inserted into the DOM
function make_grid_cal( )
{
    var html_str = "<tr>\n";
    var today = new Date( );
    today.setHours(0);    // Ensure it is less than 1:30am for comparisons
    var current_month = new Date( );
    var last_month = new Date( );
    last_month.setDate( current_month.getDate( ) + 95 );  // 3 months
    var month_cnt = 0;

    while( current_month < last_month ) {
	html_str += "<td class='monthgrid' id='month" + month_cnt + "'";
        if( month_cnt > 0 ) {   // Not today? Hide.
           html_str += " style='display:none;'";
        }

	html_str += ">";

	//----------------------------------------------------------------------
	// Name of the month and next / prev buttons
	html_str += "<table class='gridcal' border=0 cellpadding=0 cellspacing=0>";
	html_str += "<tr class='monthname'>\n";
	html_str += "<td>";

	if( month_cnt > 0 ) {   // No left arrow if this is 1st month
	    html_str += "<img border=0 onclick='set_date_to_first_day_of_this_month(" + (month_cnt-1) + ");' src='img/arrow_left.png'>";
	}

	html_str +="</td>\n<td colspan=5>" + month_names[ current_month.getMonth( ) ]
	    + " " + current_month.getFullYear( ) + "</td>\n<td>\n";

	if( month_cnt < 2 ) { // No right arrow if this is last month
	    html_str += "<img border=0 onclick='set_date_to_first_day_of_this_month(" + (month_cnt+1) + ");' src='img/arrow_right.png'>";
	}

	//--------------------------------------------------------------------
	// 7 columns, one for each day of the week
	html_str += "</td></tr>\n";
	html_str += "<tr class='dayofweek'>\n";
	html_str += "<td>Sun</td><td>Mon</td><td>Tue</td><td>Wed</td><td>Thu</td><td>Fri</td><td>Sat</td>\n";
	html_str += "</tr>\n";

	//--------------------------------------------------------------------
	// Grab the first day of the month and extrapolate back one Sunday
	// because a calendar grid SMTWRFS always begins with that date.
        // syntax: new Date(year, month, day, hours, minutes, seconds, ms);
	var first_day_of_the_month = new Date( current_month.getFullYear( ),    // 1:30am
					       current_month.getMonth( ), 1, 1, 30, 0, 0 );
	// Subtract days-of-week until you get to Sunday!
        first_day_of_the_month.setDate( first_day_of_the_month.getDate( )
					- first_day_of_the_month.getDay( ) ); 
        var current_day = first_day_of_the_month;

        // Print weekly rows til the current day iterates off end of the month
	while( current_day.getFullYear( ) <= current_month.getFullYear( ) && current_day.getMonth( ) <= current_month.getMonth( )) {
	    html_str += "\n<tr class='dom'>\n";
            // For each weekly row, print all the days of the week
	    for( var wday = 0; wday < 7; wday++ ) {
		var classes = "";
                var inthismonth = "grid";
                var date_str = date_to_string( current_day );

		// Is today's date part of the currently displayed month?
		if( current_day.getMonth( ) == current_month.getMonth( ) ) {
		    // Set special CSS if this date is TODAY
		    if ( current_day.getMonth( ) == today.getMonth( )
			 && current_day.getDate( ) == today.getDate( ) ) {
			classes = "etodayandcurrent";
		    }
		} else { // Set special CSS if this date is not in current month
                    // Special case if we slip into month 3
		    if( month_cnt < 2 || current_day.getDate() > 7 ) {
			classes = "enotthismonth";
			// Avoid conflicting cells with same ID in two months
			inthismonth = "enot"; 
		    } else {
			classes = "unclickable";
		    }
		}

		// Set days earlier than today to a class that is unclickable
		if( current_day < today ) {
		    if( classes == "" ) {
			classes = "unclickable";
		    } else {
			classes += " unclickable";
		    }
		}

                // Now print out today's cell in the grid calendar
		html_str += "    <td id='" + inthismonth + date_str + "'";
		if( classes != "" ) {
		    html_str += " class='" + classes + "'";
		}
		html_str += "><div>" + current_day.getDate( ) + "</div><span>";

	        // Are there any events on the current date? Add a dot to note.
		if( flat_list[ date_str ] ) {
		    html_str += "\&bull;";
		} else {
		    html_str += "\&nbsp;";
		}

		html_str += "</span></td>\n";
		current_day.setDate( current_day.getDate( ) + 1 );  // add a day
	    }
	    html_str += "</tr>\n\n";

	}
	html_str += "\n</table></td>\n";

        // Add a month
	var myyear = current_month.getFullYear( );
	var mymonth = current_month.getMonth( ) + 1;
	if( mymonth > 11 ) {
	    mymonth = 0;
	    myyear++;
	}
	current_month = new Date( myyear, mymonth, 1, 1, 15, 0, 0 );
	month_cnt++;
    }

    html_str += "\n</tr>\n";
    return html_str;
}

//----------------------------------------------------------------------
// Format the date properly so that I can do a string comparison
function date_to_string( d )
{
    var month = d.getMonth( ) + 1;
    var mday = d.getDate( );
    var str = d.getFullYear( ) + "-";
    if( month < 10 ) {
	str += "0";
    }
    str += month + "-";
    if( mday < 10 ) {
	str += "0";
    }
    str += mday;

    return str;
}