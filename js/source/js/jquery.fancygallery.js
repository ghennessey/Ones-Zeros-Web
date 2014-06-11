/*
 * Fancy Gallery v2.0.12
 *
 * Copyright 2011, Rafael Dery
 *
 * Only for sale at the envato marketplaces
 */

;(function($) {

	jQuery.fn.fancygallery = function(arg){

		//global variables

		var $elem,
			$albums,
			currentAlbum,
			currentMedias,
			currentThumbnails,
			currentTitles,
			currentDescriptions,
			albumSelector,
			$nav,
			$thumbWrapper,
			$inlineGallery,
			$inlineMediaContainer,
			currentPageIndex = -1,
			currentAlbumPageIndex = -1,
			currentAlbumIndex = -1,
			albumView = false,
			hoverImageWidth,
			hoverImageHeight,
			iconImage,
			themeClass;

		function init(element) {

			$elem = $(element).addClass('fg-panel');
			$albums = $elem.children('div').remove();
			themeClass = 'fg-theme-'+options.theme;

			//check if css transitions are supported
			if(!_supportsTransitions()) {
				if(options.thumbnailHoverEffect == 'scale') {
					options.thumbnailHoverEffect = 'fadeIn';
				}
				if(options.titleHoverEffect == 'scale') {
					options.titleHoverEffect = 'slide';
				}
			}

			if(options.directionAwareHoverEffect) {
				options.thumbnailHoverEffect = 'overlay';
				options.titlePlacement = 'none';
			}

			if(options.thumbnailHoverEffect == 'icon') {
				iconImage = new Image();
				iconImage.src = options.thumbnailEffectOptions.iconUrl ? options.thumbnailEffectOptions.iconUrl : 'images/fancygallery/hover_icon_cm_white.png';
				iconImage.onload = function() {
					var $this = $(this);
					hoverImageWidth = $this.width() == 0 ? this.width : $this.width();
					hoverImageHeight = $this.height() == 0 ? this.height : $this.height();
				};
			}

			//append an album with all media files
			if(/\S/.test(options.allMediasSelector)) {
				var thumbnailUrl = $albums.eq(0).data('thumbnail') ? $albums.eq(0).data('thumbnail') : $albums.eq(0).children('a:first').attr('href');
				var $allAlbums = $($.parseHTML('<div title="'+options.allMediasSelector+'" data-thumbnail="'+thumbnailUrl+'"></div>'));
				$allAlbums.append($albums.children('a').clone());
				$.merge($allAlbums, $albums);
				$albums = $allAlbums;
			}

			//create markup for the inline gallery
			if(options.lightbox == 'inline') {
				$inlineGallery = $elem.append('<div class="fg-inline-gallery" style="width: '+options.inlineGalleryOptions.width+'px;"><h2 class="fg-inline-gallery-title"></h2><div class="fg-inline-gallery-media" style="height: '+options.inlineGalleryOptions.height+'px;"></div><p class="fg-inline-gallery-description"></p></div>').children('.fg-inline-gallery');
				$inlineMediaContainer = $inlineGallery.children('.fg-inline-gallery-media');
			}

			//calculate the column offset
			var listItemTotalWidth = 1 + options.thumbWidth + (options.borderThickness*2),
				originColumnOffset = options.columnOffset;

			if(options.columns > 0) {
				options.columnOffset =  ($elem.width() - (options.columns * listItemTotalWidth)) / (options.columns-1);
			}
			else {
				options.columns = Math.round(($elem.width() - options.columnOffset) / (listItemTotalWidth + options.columnOffset));
			}
			options.columnOffset = options.columnOffset < originColumnOffset ? originColumnOffset : options.columnOffset;

			//create holder for the navigation
			$nav = $("<div class='fg-navigation radykal-clearfix' style='text-align: "+options.navAlignment+"'></div>");

			//create album selection
			if(options.albumSelection == 'dropdown') {

				albumSelector = $elem.append('<div class="fg-dropdown-selection"><div class="fg-current-album '+themeClass+'"><span></span><i class="icon-caret-down"></i></div><ul class="fg-dropdown-selection-list '+themeClass+'"></ul></div>').children('.fg-dropdown-selection');

				$albums.each(function(i, albumItem){
					if(options.selectAlbum == '') {
						if(i == 0) { albumSelector.children('.fg-current-album').children('span').text(albumItem.title); }
					}
					else {
						if(options.selectAlbum == albumItem.title) { albumSelector.children('.fg-current-album').children('span').text(albumItem.title); }
					}

					albumSelector.children('.fg-dropdown-selection-list').append("<li>"+albumItem.title+"</li>");
				});

				//toggle dropdown
				albumSelector.on('click', '.fg-current-album', function() {
					albumSelector.children('.fg-dropdown-selection-list').stop().fadeToggle(200);
				});

				//load album by index
				albumSelector.on('click', 'li', function() {
					albumSelector.children('.fg-dropdown-selection-list').stop().fadeOut(200);
					albumSelector.children('.fg-current-album').children('span').text($(this).text());
					_loadAlbum(albumSelector.children('.fg-dropdown-selection-list').children('li').index(this));
				});


				if($albums.length == 1) {
					albumSelector.hide();
				}

			}
			else if(options.albumSelection == 'menu') {

				albumSelector = $elem.append("<ul class='fg-menu-selection radykal-clearfix'></ul>").children(".fg-menu-selection");

				var selected = '';
				$albums.each(function(i, albumItem){
					selected = albumItem.title == options.selectAlbum ? 'fg-selected' : '';
					if(i == 0 && options.selectAlbum == '') {
						selected = 'fg-selected';
					}

					albumSelector.append('<li><a href="'+i+'" class="'+themeClass+' '+selected+'">'+albumItem.title+'</a></li>');

				});

				albumSelector.children('li').children('a').click(function() {
					var $this = $(this);
					if($this.hasClass('fg-selected')) { return false; }
					albumSelector.find('a').removeClass('fg-selected');
					$this.addClass('fg-selected');
					_loadAlbum($this.attr('href'));
					return false;
				});
			}
			else {

				albumSelector = $elem.append("<ul class='fg-thumbail-selection radykal-clearfix'></ul>").children(".fg-thumbail-selection");

				var amountOfAlbumThumbnails = options.thumbnailSelectionOptions.albumsPerPage == 0 ? $albums.length : options.thumbnailSelectionOptions.albumsPerPage;
				for(var i =0; i < amountOfAlbumThumbnails; ++i) {
					_createAlbumThumbnail();
				}

				if(options.thumbnailSelectionOptions.albumsPerPage > 0) {
					albumView = true;
					_updateNavigation(Math.ceil($albums.length / options.thumbnailSelectionOptions.albumsPerPage));
				}

				_updateAlbumThumbnails(0);

			}

			//create holder for the images
			$thumbWrapper = $elem.append("<ul class='fg-thumbHolder radykal-clearfix'></ul>").children('.fg-thumbHolder');

			//add album description
			if(options.albumDescriptionPosition == 'top') {
				$thumbWrapper.before('<p class="fg-album-description"></p>');
			}
			else {
				$thumbWrapper.after('<p class="fg-album-description"></p>');
			}

			options.navPosition == 'top' ? $elem.prepend($nav) : $elem.append($nav);

			//first check if gallery has albums
			if($albums.length > 0) {
				//trigger change event for album selecter
				if(options.albumSelection == 'dropdown') {

					$albums.each(function(i, album) {
						if(albumSelector.children('.fg-current-album').text() == album.title) {
							_loadAlbum(i);
						}
					});
				}
				else if(options.albumSelection == 'menu') {
					_loadAlbum(albumSelector.find('.fg-selected').attr('href'));
				}

			}

		};

		//create a new album thumbnail container
		function _createAlbumThumbnail() {

			if(options.thumbnailSelectionOptions.layout == 'default') {
				albumSelector.append('<li class="fg-album-thumbnail"><a href="#" style="width: '+options.thumbnailSelectionOptions.width+'px; height: '+options.thumbnailSelectionOptions.height+'px;"><img src="" /></a><div style="background: '+options.backgroundColor+';"><div class="fg-album-thumbnail-title"></div><div class="fg-album-thumbnail-length"></div></div></li>');
			}
			else {
				albumSelector.append('<li class="fg-album-polaroid"><a href="#"><img src="" /><span class="fg-album-thumbnail-length"></span></a><p class="fg-album-thumbnail-title"></p></li>');
			}

			albumSelector.children('li:last').show().children('a').click(function() {

				_loadAlbum($(this).attr('href'));

				if(options.showOnlyFirstThumbnail) {
					$nav.hide();
					$thumbWrapper.hide().children('li:first').find('.fg-thumbnail-container').click();
				}
				else {
					albumSelector.hide();
				}

				return false;
			});
		};

		//update the album thumbnail containers
		function _updateAlbumThumbnails(pageIndex) {

			if(currentAlbumPageIndex == pageIndex) {return false;}
			currentAlbumPageIndex = pageIndex;
			albumView = true;

			_selectPaginationNumber(pageIndex);

			//how many albums per page
			var app = albumSelector.children('li').length;

			for(var i=0; i<app; ++i) {
				var index = (app * pageIndex) + i,
					album = $albums.eq(index),
					$albumItem = albumSelector.children('li').eq(i);

				if(album.size() == 0) {
					$albumItem.hide();
				}
				else {
					$albumItem.show().children('a:first').attr('href', index);
					$albumItem.find('img').attr('src', album.data('thumbnail') ? album.data('thumbnail') : album.children('a:first').attr('href'));
					$albumItem.find('.fg-album-thumbnail-title').text(album.attr('title'));
					$albumItem.find('.fg-album-thumbnail-length').text(album.children('a').length);
				}

			}

		};

		//load an album by index
		function _loadAlbum(index){

			albumView = false;

			currentMedias = [], currentThumbnails = [], currentTitles = [], currentDescriptions = [];

			$elem.children('.fg-album-description').hide().html('');

			currentPageIndex = -1;
			//save current album index
			currentAlbumIndex = index;

			currentAlbum = $albums.eq(currentAlbumIndex).children('a');
			if(albumHtml = $albums.eq(currentAlbumIndex).children('div:first').html()) {

				$elem.children('.fg-album-description').html(albumHtml).stop().fadeIn(500);
			}

			//empty the thumb holder
			$thumbWrapper.empty();

			//check if album has media
			if(currentAlbum.length == 0) {
				$thumbWrapper.append("<p>This album has no media files!</p>");
				return false;
			}

			_updateNavigation(options.imagesPerPage == 0 ? 1 : Math.ceil(currentAlbum.length / options.imagesPerPage));

			currentAlbum.each(function(i, item) {
				var $item = $(item);
				currentMedias.push(item.href);
				currentThumbnails.push($item.data('thumbnail'));
				currentTitles.push($item.attr('title') ? $item.attr('title') : '');
				currentDescriptions.push($item.data('description'));
			});

			//how many thumbnail containers per page
			var amountOfThumbnails = options.imagesPerPage == 0 ? currentAlbum.length : options.imagesPerPage;
			for(var i =0; i < amountOfThumbnails; ++i) {
				_createThumbnailContainer();
			}

			//no margin-right for the last list item
			$thumbWrapper.children('li:visible:last').css('marginRight', 0);

			//update the content in the thumbnail containers
			_updateThumbailContainers(0);

			if(options.lightbox == 'inline' && options.inlineGalleryOptions.showFirstMedia) {
				$inlineGallery.css('display', 'block');
				$thumbWrapper.children('li:first').find('.fg-thumbnail-container').click();
			}

		};

		//create a thumbnail container
		function _createThumbnailContainer() {

			$thumbWrapper.append('<li class="fg-listItem"><div><div class="fg-thumbnail-container" style="height: '+options.thumbHeight+'px;"><img class="fg-thumb" src="" alt="" /></div></div></li>');

			//get last added list item
			var lastListItem = $elem.find('.fg-listItem:last').css({
				width: options.thumbWidth+options.borderThickness*2,
				height: options.thumbHeight+options.borderThickness*2,
				'marginBottom': options.rowOffset,
				'marginRight': options.columnOffset
			});

			var $thumbnailContainer = lastListItem.children('div').css({
				overflow: options.thumbnailEffectOptions.overflow ? 'visible' : 'hidden'
			}).children('.fg-thumbnail-container').css({
				overflow: options.thumbnailEffectOptions.overflow ? 'visible' : 'hidden'
			});

			//add a second thumbnail which be will created with timthumb for hover effects
			if(options.thumbnailHoverEffect == 'secondThumb') {
				$thumbnailContainer.append('<img class="fg-second-thumb" src="" alt=""/>');
			}

			var $imageElements = $thumbnailContainer.children('.fg-thumb, .fg-second-thumb');

			//scale thumbnail
			if(options.scaleMode == 'prop') {
			  var ratio = options.thumbHeight / options.thumbWidth;
			  if ($imageElements.first().height() / $imageElements.first().width() > ratio){
				if ($imageElements.first().height() > options.thumbHeight){
				  $imageElements.css('width', Math.round($imageElements.first().width()*(options.thumbHeight / $imageElements.first().height())) );
				  $imageElements.css('height', options.thumbHeight);
				}
			  } else {
				if ($imageElements.first().width() > options.thumbHeight){
				  $imageElements.css('height', Math.round($imageElements.first().height()*(options.thumbWidth / $imageElements.first().width())) );
				  $imageElements.css('width', options.thumbWidth);
				}
			  }
			}
			else if(options.scaleMode == 'stretch') {
			  $imageElements.css('width', options.thumbWidth);
			  $imageElements.css('height', options.thumbHeight);
			}
			else {
			  $imageElements.css('width', options.thumbWidth);
			}

			var totalRowWidth = (options.thumbWidth + options.borderThickness*2 + options.columnOffset) * options.columns - options.columnOffset;
			if($thumbWrapper.children('li').size() > 1 && ($thumbWrapper.children('li').size()-1) % options.columns == 0 &&  totalRowWidth <= $elem.width()) {
				lastListItem.css('clear', 'both').prev('li').css('marginRight', 0);
			}

			//get width and height of the hover image
			if(options.thumbnailHoverEffect == 'icon') {
				$thumbnailContainer.append('<img src="'+iconImage.src+'" class="fg-hover-image" />');
			}

			//add an overlay
			if(options.thumbnailHoverEffect == 'overlay') {
				$thumbnailContainer.append('<div class="fg-overlay"><div class="fg-overlay-background" style="background: '+(options.thumbnailEffectOptions.color ? options.thumbnailEffectOptions.color : '#ffffff')+'"></div></div>');
				$thumbnailContainer.find('.fg-overlay-background').css('opacity', options.thumbnailEffectOptions.opacity ? options.thumbnailEffectOptions.opacity : 0.6);
			}

			if(options.directionAwareHoverEffect) {
				$thumbnailContainer.children('.fg-overlay').css('left', -options.thumbWidth).show().append('<p class="fg-overlay-title" style="color: '+options.titleOptions.color+';"></p>');
			}

			//place title
			if(options.titlePlacement == 'outside' || options.titlePlacement == 'inside') {
				lastListItem.children('div').append('<div class="fg-title fg-title-'+options.titlePlacement+'"></div>');
			}

			var $title = lastListItem.find('.fg-title').css({
				background: options.titleOptions.background,
				color: options.titleOptions.color,
				width: options.titleOptions.stretchToWidth ? '100%' : 'auto'
			});

			if(options.shadowImage && options.shadowImage.length > 0) {
				lastListItem.append('<img src="'+options.shadowImage+'" class="fg-shadow" />');
			}

			//fade in thumb container and add a mouse hover
			lastListItem.children('div:first').css({
				'background-color': options.backgroundColor,
				'border-color': options.borderColor,
				padding: options.borderThickness
			}).hover(
				//mouse over function
				function(evt){

					var $this = $(this),
						$thumbnail = $this.find('.fg-thumb'),
						animationObject = {};

					//thumbnail effects on mouse over
					switch(options.thumbnailHoverEffect) {
						case 'fadeIn':
							$thumbnail.stop().animate($.extend({}, {opacity: 0.6}, options.thumbnailEffectOptions), 200);
						break;
						case 'fadeOut':
							$thumbnail.stop().animate({opacity: 1}, 200);
						break;
						case 'secondThumb':
							$thumbnail.next('.fg-second-thumb').stop().fadeTo(200, 0);
						break;
						case 'icon':
							$thumbnail.stop().animate($.extend({}, {opacity: 0.6}, options.thumbnailEffectOptions), 200);
						break;
						case 'slide':
							if($this.find('.fg-title').text().length) {
								$thumbnail.stop().animate({top: '-40px'}, 200);
							}
						break;
						case 'scale':
							if(options.thumbnailEffectOptions.direction == 'down') {
								$thumbnail.removeClass('fg-scale-normal').addClass('fg-scale-down');
							}
							else {
								$thumbnail.removeClass('fg-scale-normal').addClass('fg-scale-up');
							}
						break;
						case 'overlay':
							if(options.directionAwareHoverEffect) {
								var coordinates = _getAwareHoverEffectCoordinates($this, evt);
								$thumbnail.next('.fg-overlay').stop().css(coordinates.from).animate(coordinates.to, 200);
							}
							else {
								$thumbnail.next('.fg-overlay').stop().fadeIn(200);
							}

						break;
					}

					//icon transition
					if(options.thumbnailHoverEffect == 'icon' && hoverImageWidth) {

						var animationObject, startObject, currentThumbWidth = $thumbnail.width();
						switch(options.thumbnailEffectOptions.transition) {
							case 'l2r':
								startObject = {display: 'block', left: -hoverImageWidth, top: (options.thumbHeight * 0.5) - (hoverImageHeight * 0.5)};
								animationObject = {left: (currentThumbWidth * 0.5) - (hoverImageWidth * 0.5)};
							break;
							case 'r2l':
								startObject = {display: 'block', left: currentThumbWidth + hoverImageWidth, top: (options.thumbHeight * 0.5) - (hoverImageHeight * 0.5)};
								animationObject = {left: (currentThumbWidth * 0.5) - (hoverImageWidth * 0.5)};
							break;
							case 't2b':
								startObject = {display: 'block', left: (currentThumbWidth * 0.5) - (hoverImageWidth * 0.5), top: -hoverImageHeight};
								animationObject = {top: (options.thumbHeight * 0.5) - (hoverImageHeight * 0.5)};
							break;
							case 'b2t':
								startObject = {display: 'block', left: (currentThumbWidth * 0.5) - (hoverImageWidth * 0.5), top: options.thumbHeight + hoverImageHeight};
								animationObject = {top: (options.thumbHeight * 0.5) - (hoverImageHeight * 0.5)};
							break;
							default:
								startObject = {display: 'block', opacity: 0, left: (currentThumbWidth * 0.5) - (hoverImageWidth * 0.5), top: (options.thumbHeight * 0.5) - (hoverImageHeight * 0.5)};
								animationObject = {opacity: 1};
						}

						$thumbnail.next('.fg-hover-image').css(startObject).stop().animate(animationObject, 400);
					}

					if($this.find('.fg-title').text().length) {

						//thumbnail effects on mouse over
						var $title = $this.children('.fg-title');

						switch(options.titleHoverEffect) {
							case 'slide':
								if(options.titlePlacement == 'inside') {
									$title.stop().css({
										bottom: -$title.outerHeight(),
										display: 'block'
									}).animate({bottom: 0}, 200);
								}
								else if(options.titlePlacement == 'outside') {
									$title.slideDown(200);
								}
							break;
							case 'fade':
								$title.stop().fadeIn(200);
							break;
							case 'scale':
								$title.removeClass('fg-scale-title-down').addClass('fg-scale-normal');
							break;
						}

					}


				},
				//mouse out function
				function(evt){

					var $this = $(this),
						$thumbnail = $this.find('.fg-thumb'),
						animationObject = {};

					//thumbnail effects on mouse out
					switch(options.thumbnailHoverEffect) {
						case 'fadeIn':
							$thumbnail.stop().animate({opacity: 1}, 200);
						break;
						case 'fadeOut':
							var animationObject = $.extend({}, {opacity: 0.6}, options.thumbnailEffectOptions);
							$thumbnail.stop().animate(animationObject, 200);
						break;
						case 'secondThumb':
							$thumbnail.next('.fg-second-thumb').stop().fadeTo(200, 1);
						break;
						case 'icon':
							$thumbnail.stop().animate({opacity: 1}, 200);
						break;
						case 'slide':
							$thumbnail.stop().animate({top: 0}, 200);
						break;
						case 'scale':
							$thumbnail.stop().animate({opacity: 1}, 200);
							if(options.thumbnailEffectOptions.direction == 'down') {
								$thumbnail.removeClass('fg-scale-down').addClass('fg-scale-normal');
							}
							else {
								$thumbnail.removeClass('fg-scale-up').addClass('fg-scale-normal');
							}
						break;
						case 'overlay':
							if(options.directionAwareHoverEffect) {
								var coordinates = _getAwareHoverEffectCoordinates($this, evt);
								$thumbnail.next('.fg-overlay').stop().animate(coordinates.to, 200);
							}
							else {
								$thumbnail.next('.fg-overlay').stop().fadeOut(200);
							}
						break;
					}

					//icon transition
					if(options.thumbnailHoverEffect == 'icon' && hoverImageWidth) {

						var animationObject;
						switch(options.thumbnailEffectOptions.transition) {
							case 'l2r':
								animationObject = {left: options.thumbWidth + hoverImageWidth};
							break;
							case 'r2l':
								animationObject = {left: -hoverImageWidth};
							break;
							case 't2b':
								animationObject = {top: options.thumbHeight + hoverImageHeight};
							break;
							case 'b2t':
								animationObject = {top: -hoverImageHeight};
							break;
							default:
								animationObject = {opacity: 0};

						}

						$thumbnail.next('.fg-hover-image').stop().animate(animationObject, 200);
					}

					if($this.find('.fg-title').text().length) {
						var $title = $this.children('.fg-title');

						switch(options.titleHoverEffect) {
							case 'slide':
								if(options.titlePlacement == 'inside') {
									$title.stop().animate({bottom: -$title.outerHeight()}, 200);
								}
								else if(options.titlePlacement == 'outside') {
									$title.slideUp(200);
								}
							break;
							case 'fade':
								$title.stop().fadeOut(200);
							break;
							case 'scale':
								$title.removeClass('fg-scale-normal').addClass('fg-scale-title-down');
							break;
						}
					}

				}

			);


			$thumbnailContainer.click(function() {

				var $this = $(this),
					index = $this.data('index');

				//use inline gallery
				if(options.lightbox == 'inline') {

					var media = currentMedias[index],
						type = _getFileType(media);

					//empty media container and append preloder
					$inlineMediaContainer.empty().append('<div class="fg-inline-gallery-preloader"></div>');

					//function for adding new media to the media container
					var _appendMedia = function(mediaHtml) {
						$inlineMediaContainer.empty().append(mediaHtml);
						$inlineGallery.children('.fg-inline-gallery-title').text(currentTitles[index]);
						$inlineGallery.children('.fg-inline-gallery-description').html(currentDescriptions[index]);
						$inlineMediaContainer.children().css({'background': options.backgroundColor, 'borderColor': options.borderColor}).fadeIn(500);

						if($inlineGallery.is(':hidden')) {
							$inlineGallery.slideDown(500);
						}
					};

					//check media type and create corresponding html markup
					var mediaHtml;
					if(type == 'image') {
						var image = new Image();
						image.src = media;
						image.onload = function() {
							mediaHtml = '<img style="height: '+options.inlineGalleryOptions.height+'px;" src="'+media+'" title="'+currentTitles[index]+'" />';
							_appendMedia(mediaHtml);
						};

					}
					else if(type == 'youtube') {
						var ytId = _getParam(media, 'v'),
							mediaHtml = '<iframe width="100%" height="'+options.inlineGalleryOptions.height+'" src="http://www.youtube.com/embed/'+ytId+'?'+options.inlineGalleryOptions.youtubeParameters+'" frameborder="0" allowfullscreen></iframe>';

					}
					else if(type == 'vimeo') {
						var vimeoId = media.match(/http:\/\/(www\.)?vimeo.com\/(\d+)($|\/)/),
							vimeoId = vimeoId[2],
							mediaHtml = '<iframe src="http://player.vimeo.com/video/'+vimeoId+'?'+options.inlineGalleryOptions.vimeoParameters+'" width="100%" height="'+options.inlineGalleryOptions.height+'" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>';

					}
					else if(type == 'mp4') {
							mediaHtml = '<video id="fg-mp4-video" src="'+media+'" autoplay></video>';
					}
					else {
						window.open(media, '_blank');
						return false;
					}

					$inlineMediaContainer.height(options.inlineGalleryOptions.height);


					if(type != 'image') {
						_appendMedia(mediaHtml);
					}

					if(type == 'mp4') {

						$inlineMediaContainer.children('video').mediaelementplayer({
							videoWidth: '100%',
							videoHeight: '100%',
							features: ['playpause','progress','current','duration','tracks','volume'],
							success: function(mediaElement, domObject) {
								$inlineMediaContainer.height($inlineMediaContainer.children('div').height());
							}
						});

						$inlineMediaContainer.children('.mejs-container').addClass('mejs-yellow');
					}

				}
				//use lightbox
				else {

					//call the lightbox
					if(options.lightbox == 'prettyphoto') {

						var defaultLightboxOpts = {
							social_tools: '<div class="twitter"><a href="http://twitter.com/share" class="twitter-share-button" data-count="none">Tweet</a><script type="text/javascript" src="http://platform.twitter.com/widgets.js"></script></div><div class="pinterest"><a href="" class="pin-it-button" count-layout="horizontal" target="_blank"><img border="0" src="http://assets.pinterest.com/images/PinExt.png" title="Pin It" /></a></div><div class="facebook"><iframe src="//www.facebook.com/plugins/like.php?locale=en_US&href={location_href}&amp;layout=button_count&amp;show_faces=true&amp;width=500&amp;action=like&amp;font&amp;colorscheme=light&amp;height=23" scrolling="no" frameborder="0" style="border:none; overflow:hidden; width:500px; height:23px;" allowTransparency="true"></iframe></div>',
							changepicturecallback: function() {
								var img = $('#fullResImage').attr('src');
								var title = $('.pp_pic_holder .ppt').text();
								$('.pp_pic_holder .pin-it-button').attr('href', 'http://pinterest.com/pin/create/button/?url='+encodeURIComponent(document.URL)+'&media='+encodeURIComponent(img)+'&description='+encodeURIComponent(title)+'');
							}
						};
						options.prettyphotoOptions = $.extend({}, defaultLightboxOpts, options.prettyphotoOptions);

						$.fn.prettyPhoto(options.prettyphotoOptions);

						$.prettyPhoto.open(currentMedias, currentTitles, currentDescriptions);
						$.prettyPhoto.changePage(index);

					}
					else if(options.lightbox == 'fancybox') {

						var fancyboxOpts = {};

						//add social buttons to fancybox
						fancyboxOpts.beforeShow = function () {

			                // New line
			                if(currentTitles[this.index].length) {
			                	this.title = '<p class="fancybox-description-title">'+currentTitles[this.index]+'</p>';
			                }

			                if(currentDescriptions[this.index]) {
				                this.title += currentDescriptions[this.index]+'<br /><br />';
			                }

			                var href = encodeURIComponent(currentMedias[this.index].href);

			                // Add tweet button
			                this.title += '<a href="https://twitter.com/share" class="twitter-share-button" data-count="none" data-url="' + href + '">Tweet</a>  ';

			                //Add pinterest button
			                this.title += '<a href="http://pinterest.com/pin/create/button/?url='+encodeURIComponent(window.location.href)+'&media='+href+'" class="pin-it-button" count-layout="horizontal" target="_blank"><img border="0" src="http://assets.pinterest.com/images/PinExt.png" title="Pin It" style="margin-right: 5px;" /></a>';

			                // Add FaceBook like button
			                this.title += '<iframe src="//www.facebook.com/plugins/like.php?href=' + href+ '&amp;layout=button_count&amp;show_faces=true&amp;width=500&amp;action=like&amp;font&amp;colorscheme=light&amp;height=23" scrolling="no" frameborder="0" style="border:none; overflow:hidden; width:150px; height:23px;" allowTransparency="true"></iframe>';

				        };

						fancyboxOpts.afterShow = function() {
				            // Render tweet button
				            twttr.widgets.load();
				        };

				        fancyboxOpts.helpers = {
				        	media: {},
				            title : {
				                type: 'inside'
				            }
				        };

				        fancyboxOpts.index = index;

						$.fancybox.open(currentMedias, fancyboxOpts);
					}
					else {
						window.open(currentMedias[index], '_blank');
					}
					return false;
				}
			});

		}

		//update the thumbnail containers
		function _updateThumbailContainers(pageIndex){

			pageIndex = Number(pageIndex);
			if(currentPageIndex == pageIndex) { return false; }
			currentPageIndex = pageIndex;

			var ipp = options.imagesPerPage == 0 ? currentAlbum.length : options.imagesPerPage;
			if(options.showOnlyFirstThumbnail) {
				ipp = 1;
				$thumbWrapper.children('li:not(:first)').hide();
			}
			for(var i=0; i<ipp; ++i) {
				var index = (options.imagesPerPage * pageIndex) + i,
					media = currentAlbum[index],
					$listItem = $thumbWrapper.children('li').eq(i),
					$thumbnailContainer = $listItem .children('div').children('.fg-thumbnail-container').addClass('fg-loading');

				if(currentThumbnails[index]) {
					var $img = $thumbnailContainer.data('index', index)
						.children('.fg-thumb, .fg-second-thumb').hide()
						.attr('alt', currentTitles[index])
						.attr('src', currentThumbnails[index]);

					var opacity = 1;
					if(options.thumbnailHoverEffect == 'fadeOut') {
						if(options.thumbnailEffectOptions.opacity) {
							opacity = options.thumbnailEffectOptions.opacity;
						}
						else {
							opacity = 0.6;
						}
					}


					if(_cached(currentThumbnails[index])) {
						$img.fadeTo(300, opacity );
						$thumbnailContainer.removeClass('fg-loading');
					}
					else {
						$img.load(function() {
							//set thumbnail opacity
							$(this).fadeTo(300, opacity )
							.parents('.fg-thumbnail-container').removeClass('fg-loading');
						});
					}

					var $title = $listItem.find('.fg-title').text('');
					if(currentTitles[index].length > 0) {
						$title.text(currentTitles[index]);
						$listItem.find('.fg-overlay-title').text(currentTitles[index]);
						switch(options.titleHoverEffect) {
							case 'slide':
								$title.hide();
							break;
							case 'fade':
								$title.fadeOut(0);
							break;
							case 'scale':
								$title.addClass('fg-scale-title-down');
							break;
							case 'visible':
								$title.show();
							break;
							default:
								$title.hide();
						}
					}
					else {
						$title.hide();
					}


					//add a second thumbnail which be will created with timthumb for hover effects
					if(options.thumbnailHoverEffect == 'secondThumb') {

						options.thumbnailEffectOptions.timthumbUrl = options.thumbnailEffectOptions.timthumbUrl ? options.thumbnailEffectOptions.timthumbUrl : 'php/timthumb.php';
						options.thumbnailEffectOptions.timthumbParameters = options.thumbnailEffectOptions.timthumbParameters ? options.thumbnailEffectOptions.timthumbParameters : '&zc=1&s=1&f=2';

						var thumbnailUrl = options.thumbnailEffectOptions.timthumbUrl+'?src='+currentThumbnails[index]+options.thumbnailEffectOptions.timthumbParameters+'&q=100&&h='+options.thumbHeight+'&w='+options.thumbWidth;
						if(currentThumbnails[index].indexOf('timthumb.php') != -1) {
							thumbnailUrl = currentThumbnails[index]+options.thumbnailEffectOptions.timthumbParameters;
						}
						$thumbnailContainer.children('.fg-second-thumb').attr('src', thumbnailUrl).attr('alt', currentTitles[index]);
					}

					$listItem.show();
				}
				else {
					$listItem.hide();
				}

			}

			_selectPaginationNumber(pageIndex);

		};

		//update navigation
		function _updateNavigation(numOfPages) {

			$nav.show().empty();

			//add back-to-albums button
			if(!albumView && options.albumSelection == 'thumbnails') {
				$nav.prepend('<a href="#" class="fg-pagination fg-back-to-albums '+themeClass+'">'+options.navBackText+'</a>').children('.fg-back-to-albums')
				.data('app', numOfPages)
				.click(function() {
					$nav.hide();
					$thumbWrapper.empty();
					albumSelector.show();

					if($inlineGallery) {
						$inlineGallery.slideUp(200).children('.fg-inline-gallery-media').empty();
					}

					if(options.thumbnailSelectionOptions.albumsPerPage > 0) {
						albumView = true;
						_updateNavigation(Math.ceil($albums.length / options.thumbnailSelectionOptions.albumsPerPage));
						_selectPaginationNumber(currentAlbumPageIndex);
					}

					return false;
				});
			}

			if(numOfPages == 1) {
				return false;
			}

			//append arrows to navigation
			if(options.navigation != 'dots') {

				$nav.append('<a class="fg-pagination fg-pagination-prev '+themeClass+'" href="" title="Previous">'+options.navPreviousText+'</a>').find('.fg-pagination-prev').click(function(evt){
					if(albumView) {
						if(currentAlbumPageIndex == 0) { _updateAlbumThumbnails(numOfPages-1); }
						else { _updateAlbumThumbnails(currentAlbumPageIndex-1); }
					}
					else {
						if(currentPageIndex == 0) { _updateThumbailContainers(numOfPages-1); }
						else { _updateThumbailContainers(currentPageIndex-1); }
					}

					return false;
				});

				$nav.append('<a class="fg-pagination fg-pagination-next '+themeClass+'" href="#" title="Next">'+options.navNextText+'</a>').find('.fg-pagination-next').click(function(evt){
					if(albumView) {
						if(currentAlbumPageIndex == numOfPages-1) { _updateAlbumThumbnails(0); }
						else { _updateAlbumThumbnails(currentAlbumPageIndex+1); }
					}
					else {
						if(currentPageIndex == numOfPages-1) { _updateThumbailContainers(0); }
						else { _updateThumbailContainers(currentPageIndex+1); }
					}

					return false;
				});

			}

			//append dots or pagination to navigation
			if(options.navigation == 'dots' || options.navigation == 'pagination') {

				for(var i=0; i < numOfPages; ++i) {
					//dots
					if(options.navigation == 'dots') {
						$nav.append('<a href="'+i+'" class="fg-navigation-dot '+themeClass+'"></a>');
					}
					//pagination
					else {
						$nav.children('a:last').before('<a href="'+i+'" class="fg-pagination fg-pagination-number '+themeClass+'">'+(i+1)+'</a>');
					}

					if(i == 0) { _selectPaginationNumber(0); }
				}

				$nav.children('.fg-navigation-dot, .fg-pagination-number').click(function() {
					var index = $(this).attr('href');
					if(albumView) {
						_updateAlbumThumbnails(index);

					}
					else {
						_updateThumbailContainers(index);
					}
					return false;
				});

			}

		};

		//select pagination number by the index
		function _selectPaginationNumber(index) {

			$nav.children('a').removeClass('fg-selected').
			filter('.fg-pagination-number, .fg-navigation-dot').eq(index).addClass('fg-selected');

		};

		//returns the file type
		function _getFileType(media){

			if (media.match(/youtube\.com\/watch/i) || media.match(/youtu\.be/i)) {
				return 'youtube';
			}else if (media.match(/vimeo\.com/i)) {
				return 'vimeo';
			}else if(media.match(/\b.mp4\b/i)){
				return 'mp4';
			}else if(media.match(/\.(gif|jpg|jpeg|png)$/i)){
				return 'image';
			};

		};

		//returns the value of a parameter in the url
		function _getParam(url,key){

			key = key.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
			var regexS = "[\\?&]"+key+"=([^&#]*)";
			var regex = new RegExp( regexS );
			var results = regex.exec( url );
			return ( results == null ) ? "" : results[1];

		};

		function _cached(url){
		    var test = document.createElement("img");
		    test.src = url;
		    return test.complete || test.width+test.height > 0;
		};

		function _supportsTransitions() {
		    var b = document.body || document.documentElement;
		    var s = b.style;
		    var p = 'transition';
		    if(typeof s[p] == 'string') {return true; }

		    // Tests for vendor specific prop
		    v = ['Moz', 'Webkit', 'Khtml', 'O', 'ms'],
		    p = p.charAt(0).toUpperCase() + p.substr(1);
		    for(var i=0; i<v.length; i++) {
		      if(typeof s[v[i] + p] == 'string') { return true; }
		    }
		    return false;
		};

		function _getAwareHoverEffectCoordinates($el, evt) {

			var direction = _getDir($el, {x: evt.pageX, y: evt.pageY}),
				from = {},
				to = {};

			if(evt.type == 'mouseenter') {
				switch (direction) {
					//top
					case 0:
						from.top = -options.thumbHeight;
						from.left = 0;
						to.top = 0;
					break;
					//right
					case 1:
						from.left = options.thumbWidth;
						from.top = 0;
						to.left = 0;
					break;
					//bottom
					case 2:
						from.top = options.thumbHeight;
						from.left = 0;
						to.top = 0;
					break;
					//left
					case 3:
						from.left = -options.thumbWidth;
						from.top = 0;
						to.left = 0;
					break;

				}
			}
			else {
				switch (direction) {
					//top
					case 0:
						to.top = -options.thumbHeight;
					break;
					//right
					case 1:
						to.left = options.thumbWidth;
					break;
					//bottom
					case 2:
						to.top = options.thumbHeight;
					break;
					//left
					case 3:
						to.left = -options.thumbWidth;
					break;

				}
			}

			return {from: from, to: to};
		};

		function _getDir($el, coordinates) {

			var w = $el.width(),
				h = $el.height(),

				// calculate the x and y to get an angle to the center of the div from that x and y.
				// gets the x value relative to the center of the DIV and "normalize" it
				x = ( coordinates.x - $el.offset().left - ( w/2 )) * ( w > h ? ( h/w ) : 1 ),
				y = ( coordinates.y - $el.offset().top  - ( h/2 )) * ( h > w ? ( w/h ) : 1 ),

				// the angle and the direction from where the mouse came in/went out clockwise (TRBL=0123);
				direction = Math.round( ( ( ( Math.atan2(y, x) * (180 / Math.PI) ) + 180 ) / 90 ) + 3 ) % 4;

			return direction;
		};

		if(arg == undefined || typeof arg == 'object') {
			var options = $.extend({}, $.fn.fancygallery.defaults, arg);
			options.thumbnailSelectionOptions = $.extend({}, $.fn.fancygallery.defaults.thumbnailSelectionOptions, options.thumbnailSelectionOptions);
			options.inlineGalleryOptions = $.extend({}, $.fn.fancygallery.defaults.inlineGalleryOptions, options.inlineGalleryOptions);
			options.titleOptions = $.extend({}, $.fn.fancygallery.defaults.titleOptions, options.titleOptions);
			return this.each(function() {init(this)});
		}

	};

	//array shuffle
	function arrayShuffle(){
	  var tmp, rand;
	  for(var i =0; i < this.length; i++){
		rand = Math.floor(Math.random() * this.length);
		tmp = this[i];
		this[i] = this[rand];
		this[rand] = tmp;
	  }
	};
	Array.prototype.shuffle = arrayShuffle;

	$.fn.fancygallery.defaults = {
		thumbWidth: 200, //width of the thumbnail
		thumbHeight: 150, //height of the thumbnail
		backgroundColor: '#F5F5F5', //the color of background for every thumbnail
		borderThickness: 3, //the thickness of the border
		shadowOffset: 0, //the offset of the shadow (only for the standard view)
		rowOffset: 50, //the offset of the row
		columnOffset: 30, //the offset of the column
		imagesPerPage: 8, //number of thumbnails per page, if 0 all thumbnails of an album will be loaded on the first page
		scaleMode: 'stretch', //prop, stretch, crop
		shadowImage: 'images/fancygallery/shadow.png', //shaodw image url
		navPosition: 'bottom', //the position of the arrows
		selectAlbum: '', //load an album by its title
		allMediasSelector: '', //empty or custom label for showing all medias of an album
		albumSelection: 'dropdown', //menu, thumbnails or dropdown
		navigation: 'pagination', //dots, pagination, arrows
		theme: 'white', //white,black or a custom CSS class
		navAlignment: 'left', //the alignment of the navigation - left, center, right
		navPreviousText: '<', //text for the previous button
		navNextText: '>', //text for the next button
		navBackText: '&crarr;', //text for the back to album overview button
		lightbox: 'prettyphoto', //choice between prettyphoto, fancybox, inline or none
		prettyphotoOptions: {}, //the prettyphoto options
		columns: 0, //1.5.1 - the number of columns
		mediaText: 'Media', //1.5.2 - the text for the media, only when using thumbnails as album selection
		showOnlyFirstThumbnail: false, //1.5.2 - show only the first thumbnail of an album
		borderColor: '#bdc3c7', //1.6 - the color for the border
		inlineGalleryOptions: {width: '100%', height: 500, youtubeParameters: '&showinfo=1&autoplay=1', vimeoParameters: 'autoplay=1', showFirstMedia: false},//1.6 - The options for the inline gallery
		thumbnailSelectionOptions : {layout: 'default', width: 250, height: 150, albumsPerPage: 0}, // options for the thumbnail selection
		albumDescriptionPosition: 'top', //1.6 - the position of the album description - 'top' or 'bottom',
		thumbnailHoverEffect: 'fadeIn', //fadeIn, fadeOut, icon, secondThumb, slide, scale, overlay none
		thumbnailEffectOptions: {},
		titlePlacement: 'outside', //outside, inside
		titleOptions: {background: '#F5F5F5', color: '#2C3E50', stretchToWidth: true},
		titleHoverEffect: 'slide', //slide, scale ('inside'), fade, visible, hidden
		directionAwareHoverEffect: false // 2.0 - enable the direction hover effect
	};

})(jQuery);

//load twitter widget
!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src="https://platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");

//load pinterest widget
(function(d){
  var f = d.getElementsByTagName('SCRIPT')[0], p = d.createElement('SCRIPT');
  p.type = 'text/javascript';
  p.async = true;
  p.src = '//assets.pinterest.com/js/pinit.js';
  f.parentNode.insertBefore(p, f);
}(document));