var myScroll;
var a = 0;
function initialize_iScroll() {
	setHeight();	// Set the wrapper height. Not strictly needed, see setHeight() function below.

	// Please note that the following is the only line needed by iScroll to work. Everything else here is to make this demo fancier.
	myScroll = new iScroll('wrapper', {hScrollbar:false});
}

// Change wrapper height based on device orientation. Not strictly needed by iScroll, you may also use pure CSS techniques.
function setHeight() {
    var headerH = $('#header').is(":visible") ? $('#header').height() : 0;
    var footerH = $('#footer').is(":visible") ? $('#footer').height() : 0;
    var wrapperH = $(window).height() - headerH - footerH;
    $('#wrapper').height( wrapperH );
}

// Prevent the whole screen to scroll when dragging elements outside of the scroller (ie:header/footer).
// If you want to use iScroll in a portion of the screen and still be able to use the native scrolling, do *not* preventDefault on touchmove.
$(document).bind('touchmove', function (e) { e.preventDefault(); });
