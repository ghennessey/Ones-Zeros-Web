var pageData = {
	page: {
		home: null,
		music: null,
		live: null,
		about: null,
		contact: null
	},
	currentPage: 'home',
	transitioning: false,
	hiddenXPos: 9000,
	sparkleList: []
};

var initPage = function() {

	//Galery
	$('#fancyGallery').fancygallery({
		theme: 'white',
		scaleMode: 'crop',
		navAlignment: 'center',
		columnOffset: 10,
		rowOffset: 10,
		imagesPerPage: 6,
		thumbnailHoverEffect: 'fadeIn',
		thumbnailEffectOptions: {opacity: 0.6},
		shadowImage: 'images/fancygallery/shadows/shadow2.png',
		directionAwareHoverEffect : true,
		inlineGalleryOptions: {},
		thumbHeight: 120
	});
	//Setup Social Bar
	init_socialBar();

	//Animate the Menu In
	$('#menu').css('top', '-=200').animate({top: '50px'}, 1000, function() {
		anim_socialBarIn();
	});

	//Move the Menu Selector to Home
	moveSelector(pageData.currentPage);

	//Hide all unused windows off to the left
	$('#music, #live, #about, #contact, #media').css({left: pageData.hiddenXPos, display: 'none'});

	//Make Bokeh Effect
	makeBokeh('#bokeh_1', 25, 5, 1);
	makeBokeh('#bokeh_2', 25, 1, 1);
	$("#bokeh_2").css({opacity: '0'});

	//Setup the Screens
	make_liveScreen();
	make_aboutScreen();

	//Init the Menu System
	$('#menu a').click(function() {
		var clickClass = $(this).attr('class');
		moveBokeh(clickClass);
		if(clickClass !== pageData.currentPage && !pageData.transitioning) {
			//Move the Menu Selector
			moveSelector(clickClass);

			pageData.transitioning = true;
			var distance = $(window).width();

			//transition current page out
			$('#'+pageData.currentPage).animate({left: '-='+distance}, 800, function() {
				var thisID = $(this).attr('id');
				$(this).css({left: pageData.hiddenXPos, display: 'none'});
				pageData.transitioning = false;
			});

			//add the new page and transition it in
			pageData.currentPage = clickClass;
			$('#'+pageData.currentPage).css({left: $(window).width(), display: 'inline-block'}).animate({left: 0});
		}
	});
}

var init_socialBar = function() {
	var kids = $('#socialBar').children();

	console.log(kids);

	//Set the Social Bar Size
	var sBarHeight = ($('#socialBar img').height()) + 'px';
	var sBarWidth = ($('#socialBar img').height() * kids.length)  + 'px';
	//$('#socialBar').css({height: sBarHeight, width: sBarWidth});

	//Put the Kids In Line
	for(var i=0; i < kids.length; i++) {
		var kWidth = $(kids[i]).width();
		var leftPos = i * 70;
		$(kids[i]).css({left: leftPos+'px'});
		//Move them Down
		$(kids[i]).css({top: "200px"});
	}
}
var anim_socialBarIn = function() {
	var kids = $('#socialBar').children();

	var delayAmt =  200;
	for(var i=0; i < kids.length; i++) {
		var leftPos = i * $(kids[i]).width();
		$(kids[i]).delay((delayAmt * i)).animate({top: '0px'}, 2000, 'easeOutBack');
	}
}

var make_liveScreen = function() {
	//Make Live Scrollbar
	make_scrollbar('#live');
}

var make_aboutScreen = function() {
	//Make About Scrollbar
	make_scrollbar('#about');
}

//Create Scroll Bar
//build slider
var make_scrollbar = function(element) {
	$(element+' .scroll-bar').slider({
	orientation: "vertical",
	min: 0,
		max: 100,
		value: 100,
		slide: function( event, ui ) {
			if( $(element+' .scroll-content').height() > $(element+' .scroll-pane').height() ) {
				var diffHeight = $(element+' .scroll-pane').height() - $(element+' .scroll-content').height()
				$(element+' .scroll-content').css( "margin-top", Math.round(
					(ui.value / 100 * (diffHeight) + (diffHeight * -1) ) * -1
				) + "px" );
			} else {
				$(element+' .scroll-content').css( "margin-top", 0 );
			}
		}
	});
}


//Check if content is overflowing
function isOverflowed(element){
    var eHeight = $(element).height();
    var eOffset = $(element).position();
    var wHeight = $(window).height();
    var combinedHeight = eHeight + eOffset.top;
  	if (combinedHeight > wHeight) {
  		return true;
  	} else {
  		return false;
  	}
}

var moveSelector = function(clickClass) {
	var position = $('#menu .'+clickClass).parent().position();
	var pWidth = $('#menu .'+clickClass).parent().width() + 20;
	$('#menu .'+clickClass).parent().children().animate({color: '#000000'}, 200);
	$('#selector').animate({left: position.left, width: pWidth}, 300);
	$('#menu a').css( { color: '#ffffff' } );	
}

var moveBokeh = function(clickClass) {

	var animLength = 3000;
	var xPos;
	var yPos;
	var yOffset = 0.1;
	var randAlpha = 0.3 * Math.random();
	var randAlpha2 =  0.3 * Math.random();

	var moveAmt = -10;

	$("#bokeh_1, #bokeh_2").stop();

	if(clickClass === 'home') {
		xPos = 0;
		yPos = 0;
		randAlpha = 1;
		randAlpha2 = 0;
		bokeh_goHome("#bokeh_1", animLength);
		bokeh_goHome("#bokeh_2", animLength);
	} else if(clickClass === 'music') {
		xPos = moveAmt * 2;
		yPos = xPos * yOffset;
		randAlpha2 = 1;
		bokeh_randDir("#bokeh_1", animLength);
		bokeh_randDir("#bokeh_2", animLength);
	} else if(clickClass === 'live') {
		xPos = moveAmt * 3;
		yPos = xPos * yOffset;
		randAlpha2 = 1;
		bokeh_randDir("#bokeh_1", animLength);
		bokeh_randDir("#bokeh_2", animLength);
	} else if(clickClass === 'media') {
		xPos = moveAmt * 4;
		yPos = xPos * yOffset;
		randAlpha2 = 1;
		bokeh_randDir("#bokeh_1", animLength);
		bokeh_randDir("#bokeh_2", animLength);
	} else if(clickClass === 'about') {
		xPos = moveAmt * 5;
		yPos = xPos * yOffset;
		randAlpha2 = 1;
		bokeh_randDir("#bokeh_1", animLength);
		bokeh_randDir("#bokeh_2", animLength);
	} else if(clickClass === 'contact') {
		xPos = moveAmt * 6;
		yPos = xPos * yOffset;
		randAlpha2 = 1;
		bokeh_randDir("#bokeh_1", animLength);
		bokeh_randDir("#bokeh_2", animLength);
	}
	$('#bokeh_1').animate({left: xPos, top: yPos}, animLength, 'easeInOutSine');

	var xPos2 = xPos * 3;
	var yPos2 = yPos * 3;
	$('#bokeh_2').animate({left: xPos2, top: yPos2, opacity: randAlpha2}, animLength, 'easeInOutSine');
}

var bokeh_goHome = function(id, animLength) {
	this.animLength = animLength / 2;
	var kids0 = $(id).children();
	for(var i=0; i < kids0.length; i++) {
		var origTop = $(kids0[i]).data('origTop');
		var origLeft = $(kids0[i]).data('origLeft');
		$(kids0[i]).animate({top: origTop, left: origLeft}, animLength);
	}
}

var bokeh_randDir = function(id, animLength) {
	var kids0 = $(id).children();

	// var randDir = 1;;
	// if(Math.random() < 0.5) {
	// 	randDir = 1;
	// } else {
	// 	randDir = -1;
	// }
	//animLength = animLength / 2;
	for(var i=0; i < kids0.length; i++) {
		var randAlpha2 = Math.random() * 0.9;
		//var randTop = parseFloat($(kids0[i]).css('top')) + ((Math.random() * 500) * randDir);
		//var randLeft = parseFloat($(kids0[i]).css('left')) + ((Math.random() * 500) * randDir);
		//$(kids0[i]).animate({top: randTop, left: randLeft, opacity: randAlpha2}, animLength, 'easeInOutSine');
		//$(kids0[i]).animate({opacity: randAlpha2}, {duration: animLength, easing: 'easeInOutBounce', queue: false });
		//$(kids0[i]).effect({effect: 'scale', duration: animLength, percent: '50'});
	}
}

var makeBokeh = function(id, num, blr, alpha) {
	//var blurAmt = blr;
	var blurAmt = Math.random() * blr;
	for(var i=0; i<num; i++) {

		var className = 'bokeh' + i;
		$(id).append( '<div class="'+className+' bokehColour"></div>' );
		var randX = Math.random() * $(id).width();
		var randY = Math.random() * $(id).height();
		var randSize = (300 * Math.random() + 20) + "px";

		var randAlpha0 = (Math.random() * 0.5) + 0.3;
		$(id+' .'+className).css({
			opacity: randAlpha0,
			filter: 'blur('+blurAmt+'px)',
			'-webkit-filter': 'blur('+blurAmt+'px)',
			'-moz-filter': 'blur('+blurAmt+'px)',
			'-o-filter': 'blur('+blurAmt+'px)',
			'-ms-filter': 'blur('+blurAmt+'px)'
		});
		$('.'+className).css({
			position: 'absolute',
			border: '1px solid #fff',
			height: randSize,
			width: randSize,
			borderRadius: randSize,
			top: randY,
			left: randX,
		});


		$('.'+className).data('origTop', $('.'+className).css('top'));
		$('.'+className).data('origLeft', $('.'+className).css('left'));
	}

	var randAlpha = alpha;
	$(id).css({opacity: randAlpha});
}

var multiSparkleFX = function(amt) {
	console.log('multiSparkleFX is running');
	for(var i=0; i < amt; i++) {
		makeSparkleFX('#sparkle_1');
	}
}

var makeSparkleFX = function(id) {
		var className = 'sparkle'+Math.floor(Math.random() * 1000);
		//console.log("making " + className);
		$(id).append( '<div class="'+className+' sparkle"></div>' );
		//var randX = (Math.random() * $('#logo').width()) - 100;
		//var randY = (Math.random() * $('#logo').height()) - 100;
		var randX = 0;
		var randY = 0;
		var randSize = (2 * Math.random() + 2) + "px";
		var blurAmt = 0.2;

		var randAlpha0 = 1;

		$(id+' .'+className).css({
			opacity: randAlpha0,
			filter: 'blur('+blurAmt+'px)',
			'-webkit-filter': 'blur('+blurAmt+'px)',
			'-moz-filter': 'blur('+blurAmt+'px)',
			'-o-filter': 'blur('+blurAmt+'px)',
			'-ms-filter': 'blur('+blurAmt+'px)'
		});
		$('.'+className).css({
			position: 'fixed',
			backgroundColor: '#ffffff',
			height: randSize,
			width: randSize,
			borderRadius: randSize,
			top: randY,
			left: randX,
		});

		pageData.sparkleList.push($('.'+className));
		moveSparkleFX('.'+className, id);

		sparkleShadeFlutter('.'+className);
}

var moveSparkleFX = function(sparkleClass, baseID) {

	var randSpeed = (Math.random() * 5000) + 8000;

	var currentPos = $(sparkleClass).position();

	var randX = ($(baseID).width() * Math.random()) + (Math.random() * 500);
	var randY = ($(baseID).height() * Math.random()) + (Math.random() * 500);
	//console.log("MoveTO - sparkleClass: " + sparkleClass + ", randX: " + randX + ", randY: " + randY);
	//console.log("Sparkle moving: randSpeed - " + randSpeed + ", randX - " + randX + ", randY - " + randY);
	var randDelay = Math.random() * 5000;
	// $(sparkleClass).animate({top: -1, left: -1}, randDelay, function() {
	// 	$(sparkleClass).animate({top: randY, left: randX}, randSpeed, function() {
	// 		resetSparklePos(sparkleClass, baseID);
	// 	});
	// });
	

	$(sparkleClass).animate().delay(randDelay).animate({top: randY, left: randX}, { 
		duration: randSpeed, 
		complete: function() { resetSparklePos(sparkleClass, baseID); }, 
		queue: false });

	
}

var sparkleShadeFlutter = function(sparkleClass) {

	var sparkleBGColor = $(sparkleClass).css('background-color');
	if(sparkleBGColor === rgb(255,255,255)) {
		console.log(sparkleBGColor);
	}
	//$(sparkleClass).animate().delay((randDelay + (randSpeed * 0.2))).animate({backgroundColor: '#000000'}, {duration: randSpeed, queue: false})
}

var resetSparklePos = function(sparkleClass, baseID) {
	
	//var randX = (Math.random() * $('#logo').width()) - 100;
	//var randY = (Math.random() * $('#logo').height()) - 100;

	//console.log("resetSparklePos on " + sparkleClass + ", baseID: " + baseID + ", randX: " + randX + ", randY: " + randY);
	$(sparkleClass).css({top: 0, left: 0, backgroundColor: '#ffffff'});
	moveSparkleFX(sparkleClass, baseID);
}

$(document).ready(function() {
	initPage();
});

(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){ (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o), m=s.getElementsByTagName(o)
[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m) })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
 ga('create', 'UA-51729085-1', 'onesandzerosmusic.com');
 ga('send', 'pageview');