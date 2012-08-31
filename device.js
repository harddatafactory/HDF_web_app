// Device-specific code for the Android and iPhone
function device_initialize( )
{
    initialize_iScroll();   // Allows vertical middle to scroll up & down
}

function device_get_json( url )
{    
    $.getScript( url )
	.done(function(data, textStatus, jqxhr) {
		insert_city_events( );
	    })
	.fail(function(jqxhr, settings, exception) {
		alert( jqxhr.status + ": " + exception );
	    });
}

function device_add_event_to_calendar( data )
{
    alert('Webapp adding event to calendar!');
}

function device_open_url(newUrl)
{
    alert('Webapp open url' + newUrl );
}

function device_call_phone_number( number )
{
    alert('Webapp, I call ' + number );
}

function device_send_email(emailAddress, subject, body)
{
    alert('Webapp, I send to ' + emailAddress + ', ' + subject + ', ' + body);
}
