( function (global, factory) {

	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	( global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.SEMICOLON = factory() );

} ( this, ( () => {

	// USE STRICT
	"use strict";

	const options = {
		pageTransition: false,
		cursor: false,
		headerSticky: true,
		headerMobileSticky: false,
		menuBreakpoint: 992,
		pageMenuBreakpoint: 992,
		gmapAPI: '',
		scrollOffset: 60,
		scrollExternalLinks: true,
		jsFolder: 'js/',
		cssFolder: 'css/',
		jsLoadType: 'fn',
	};

	const vars = {
		baseEl: document,
		elRoot: document.documentElement,
		elHead: document.head,
		elBody: document.body,
		hash: window.location.hash,
		topScrollOffset: 0,
		elWrapper: document.getElementById('wrapper'),
		elHeader: document.getElementById('header'),
		headerClasses: '',
		elHeaderWrap: document.getElementById('header-wrap'),
		headerWrapClasses: '',
		headerHeight: 0,
		headerOffset: 0,
		headerWrapHeight: 0,
		headerWrapOffset: 0,
		elPrimaryMenus: document.querySelectorAll('.primary-menu'),
		elPrimaryMenuTriggers: document.querySelectorAll('.primary-menu-trigger'),
		elPageMenu: document.getElementById('page-menu'),
		pageMenuOffset: 0,
		elSlider: document.getElementById('slider'),
		elFooter: document.getElementById('footer'),
		portfolioAjax: {},
		sliderParallax: {
			el: document.querySelector('.slider-parallax'),
			caption: document.querySelector('.slider-parallax .slider-caption'),
			inner: document.querySelector('.slider-inner'),
			offset: 0,
		},
		get menuBreakpoint() {
			return this.elBody.getAttribute('data-menu-breakpoint') || options.menuBreakpoint;
		},
		get pageMenuBreakpoint() {
			return this.elBody.getAttribute('data-pagemenu-breakpoint') || options.pageMenuBreakpoint;
		},
		get customCursor() {
			let value = this.elBody.getAttribute('data-custom-cursor') || options.cursor;
			return value == 'true' || value === true ? true : false;
		},
		get pageTransition() {
			let value = this.elBody.classList.contains('page-transition') || options.pageTransition;
			return value == 'true' || value === true ? true : false;
		},
		scrollPos: {
			x: 0,
			y: 0,
		},
		$jq: typeof jQuery !== "undefined" ? jQuery.noConflict() : '',
		resizers: {},
		recalls: {},
		debounced: false,
		events: {},
		modules: {},
		fn: {},
		required: {
			jQuery: {
				plugin: 'jquery',
				fn: () => typeof jQuery !== 'undefined',
				file: options.jsFolder+'jquery.js',
				id: 'canvas-jquery',
			}
		},
		fnInit: () => {
			DocumentOnReady.init();
			DocumentOnLoad.init();
			DocumentOnResize.init();
		}
	};

	const Core = function() {
		return {
			getOptions: options,
			getVars: vars,

			run: obj => {
				Object.values(obj).map(fn => typeof fn === 'function' && fn.call() );
			},

			runBase: () => {
				Core.run( Base );
			},

			runModules: () => {
				Core.run( Modules );
			},

			runContainerModules: parent => {
				if( typeof parent === 'undefined' ) {
					return false;
				}

				Core.getVars.baseEl = parent;
				Core.runModules();
				Core.getVars.baseEl = document;
			},

			breakpoints: () => {
				let viewWidth = Core.viewport().width;

				const breakpoint = {
					xxl: {
						enter: 1400,
						exit: 99999
					},
					xl: {
						enter: 1200,
						exit: 1399
					},
					lg: {
						enter: 992,
						exit: 1199.98
					},
					md: {
						enter: 768,
						exit: 991.98
					},
					sm: {
						enter: 576,
						exit: 767.98
					},
					xs: {
						enter: 0,
						exit: 575.98
					}
				};

				let previous = '';

				Object.keys( breakpoint ).forEach( key => {
					if ( (viewWidth > breakpoint[key].enter) && (viewWidth <= breakpoint[key].exit) ) {
						vars.elBody.classList.add( 'device-'+key );
					} else {
						vars.elBody.classList.remove( 'device-'+key );
						if( previous != '' ) {
							vars.elBody.classList.remove( 'device-down-'+previous );
						}
					}

					if ( viewWidth <= breakpoint[key].exit ) {
						if( previous != '' ) {
							vars.elBody.classList.add( 'device-down-'+previous );
						}
					}

					previous = key;

					if ( viewWidth > breakpoint[key].enter ) {
						vars.elBody.classList.add( 'device-up-'+key );
						return;
					} else {
						vars.elBody.classList.remove( 'device-up-'+key );
					}
				});
			},

			colorScheme: () => {
				if( vars.elBody.classList.contains('adaptive-color-scheme') ) {
					window.matchMedia('(prefers-color-scheme: dark)').matches ? vars.elBody.classList.add( 'dark' ) : vars.elBody.classList.remove('dark');
				}

				const bodyColorScheme = localStorage.getItem('cnvsBodyColorScheme');

				if( bodyColorScheme && bodyColorScheme != '' ) {
					bodyColorScheme.split(" ").includes('dark') ? vars.elBody.classList.add( 'dark' ) : vars.elBody.classList.remove( 'dark' );
				}
			},

			throttle: (callback, delay) => {
				let throttle = false;
				if (throttle) {
					return;
				}

				callback();
				throttle = true;

				setTimeout(function () {
					throttle = false;
				}, delay);
			},

			debounce: (callback, delay) => {
				clearTimeout(vars.debounced);
				vars.debounced = setTimeout(callback, delay);
			},

			debouncedResize: (func, delay) => {
				let timeoutId;
				return function () {
					const context = this;
					const args = arguments;
					clearTimeout(timeoutId);
					timeoutId = setTimeout(() => {
						func.apply(context, args);
					}, delay);
				};
			},

			addEvent: ( el, event, args = {} ) => {
				if( typeof el === "undefined" || typeof event === "undefined" ) {
					return;
				}

				var createEvent = new CustomEvent( event, {
					detail: args
				});

				el.dispatchEvent( createEvent );
				vars.events[event] = true;
			},

			scrollEnd: (callback, refresh = 199) => {
				if (!callback || typeof callback !== 'function') return;

				window.addEventListener( 'scroll', () => {
					Core.debounce( callback, refresh );
				}, { passive: true });
			},

			viewport: () => {
				const viewport = {
					width: window.innerWidth || vars.elRoot.clientWidth,
					height: window.innerHeight || vars.elRoot.clientHeight
				};

				return viewport;
			},

			getSelector: ( selector, jquery = true, customjs = true ) => {
				if( jquery ) {
					if( Core.getVars.baseEl !== document ) {
						selector = jQuery(Core.getVars.baseEl).find(selector);
					} else {
						selector = jQuery(selector);
					}

					if( customjs ) {
						if( typeof customjs == 'string' ) {
							selector = selector.filter(':not('+ customjs +')');
						} else {
							selector = selector.filter(':not(.customjs)');
						}
					}
				} else {
					if( customjs ) {
						if( typeof customjs == 'string' ) {
							selector = Core.getVars.baseEl.querySelectorAll(selector+':not('+customjs+')');
						} else {
							selector = Core.getVars.baseEl.querySelectorAll(selector+':not(.customjs)');
						}
					} else {
						selector = Core.getVars.baseEl.querySelectorAll(selector);
					}
				}

				return selector;
			},

			onResize: (callback, refresh = 333) => {
				if (!callback || typeof callback !== 'function') return;

				window.onresize = () => {
					Core.debounce( callback, refresh );
				};
			},

			imagesLoaded: el => {
				let imgs = el.getElementsByTagName('img') || document.images,
					len = imgs.length,
					counter = 0;

				if( len < 1 ) {
					Core.addEvent( el, 'CanvasImagesLoaded' );
				}

				const incrementCounter = async function() {
					counter++;
					if ( counter === len ) {
						Core.addEvent( el, 'CanvasImagesLoaded' );
					}
				};

				[].forEach.call( imgs, function( img ) {
					if( img.complete ) {
						incrementCounter();
					} else {
						img.addEventListener( 'load', incrementCounter, false );
					}
				});
			},

			contains: (classes, selector) => {
				let classArray = classes.split(" ");
				let hasClass = false;

				classArray.forEach( classTxt => {
					if( vars.elBody.classList.contains(classTxt) ) {
						hasClass = true;
					}
				});

				return hasClass;
			},

			has: (nodeList, selector) => {
				return [...nodeList]?.filter(e => e.querySelector(selector));
			},

			filtered: (nodeList, selector) => {
				return [...nodeList]?.filter(e => e.matches(selector));
			},

			parents: (elem, selector) => {
				if (!Element.prototype.matches) {
					Element.prototype.matches =
						Element.prototype.matchesSelector ||
						Element.prototype.mozMatchesSelector ||
						Element.prototype.msMatchesSelector ||
						Element.prototype.oMatchesSelector ||
						Element.prototype.webkitMatchesSelector ||
						function(s) {
							let matches = (this.document || this.ownerDocument).querySelectorAll(s),
								i = matches.length;
							while (--i >= 0 && matches.item(i) !== this) {}
							return i > -1;
						};
				}

				let parents = [];

				for ( ; elem && elem !== document; elem = elem.parentNode ) {
					if (selector) {
						if (elem.matches(selector)) {
							parents.push(elem);
						}
						continue;
					}
					parents.push(elem);
				}

				return parents;
			},

			siblings: (elem, nodes = false) => {
				if( nodes ) {
					return [...nodes].filter( sibling => {
						return sibling !== elem;
					});
				} else {
					return [...elem.parentNode.children].filter( sibling => {
						return sibling !== elem;
					});
				}
			},

			getNext: (elem, selector) => {
				let nextElem = elem.nextElementSibling;

				if( !selector ) {
					return nextElem;
				}

				if( nextElem && nextElem.matches(selector) ) {
					return nextElem;
				}

				return null;
			},

			offset: el => {
				let rect = el.getBoundingClientRect(),
					scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
					scrollTop = window.pageYOffset || document.documentElement.scrollTop;

				return { top: rect.top + scrollTop, left: rect.left + scrollLeft }
			},

			isHidden: el => {
				return (el.offsetParent === null);
			},

			classesFn: (func, classes, selector) => {
				let classArray = classes.split(" ");
				classArray.forEach( classTxt => {
					if( func == 'add' ) {
						selector.classList.add(classTxt);
					} else if( func == 'toggle' ) {
						selector.classList.toggle(classTxt);
					} else {
						selector.classList.remove(classTxt);
					}
				});
			},

			loadCSS: params => {
				const file = params.file;
				const htmlID = params.id || false;
				const cssFolder = params.cssFolder || false;

				if( !file ) {
					return false;
				}

				if( htmlID && document.getElementById(htmlID) ) {
					return false;
				}

				const htmlStyle = document.createElement('link');

				htmlStyle.id = htmlID;
				htmlStyle.href = cssFolder ? options.cssFolder+file : file;
				htmlStyle.rel = 'stylesheet';
				htmlStyle.type = 'text/css';

				vars.elHead.appendChild(htmlStyle);
				return true;
			},

			loadJS: params => {
				const file = params.file;
				const htmlID = params.id || false;
				const type = params.type || false;
				const callback = params.callback;
				const async = params.async || true;
				const defer = params.defer || true;
				const jsFolder = params.jsFolder || false;

				if( ! file ) {
					return false;
				}

				if( htmlID && document.getElementById(htmlID) ) {
					return false;
				}

				const htmlScript = document.createElement('script');

				if ( typeof callback !== 'undefined' ) {
					if( typeof callback != 'function' ) {
						throw new Error('Not a valid callback!');
					} else {
						htmlScript.onload = callback;
					}
				}

				htmlScript.id = htmlID;
				htmlScript.src = jsFolder ? options.jsFolder+file : file;
				if( type ) {
					htmlScript.type = type;
				}
				htmlScript.async = async ? true : false;
				htmlScript.defer = defer ? true : false;

				vars.elBody.appendChild(htmlScript);
				return true;
			},

			isFuncTrue: async fn => {
				if( 'function' !== typeof fn ) {
					return false;
				}

				var counter = 0;

				return new Promise((resolve, reject) => {
					if( fn() ) {
						resolve(true);
					} else {
						var int = setInterval( () => {
							if( fn() ) {
								clearInterval( int );
								resolve(true);
							} else {
								if( counter > 30 ) {
									clearInterval( int );
									reject(true);
								}
							}
							counter++;
						}, 333);
					}
				}).catch( error => console.log('Function does not exist: ' + fn) );
			},

			initFunction: params => {
				vars.elBody.classList.add( params.class );
				Core.addEvent( window, params.event );
				vars.events[params.event] = true;
			},

			runModule: params => {
				let type = (window.location.protocol == 'http:' || window.location.protocol == 'https:') ? 'module' : 'fn';

				if( options.jsLoadType && (options.jsLoadType == 'fn' || options.jsLoadType == 'module') ) {
					type = options.jsLoadType;
				}

				let moduleFile = (type == 'fn' ? options.jsFolder : './')+ type +'.' + params.plugin + '.js';

				if( params.file ) {
					moduleFile = params.file;
				}

				if( type == 'module' ) {
					import( moduleFile )
					.then( module => module.default(params.selector))
					.catch( error => {
						console.log( params.plugin + ': Module could not be loaded' );
						console.log( error );
					});
				} else {
					let pluginCheck = () => typeof Core.getVars.fn[params.plugin] !== 'undefined';
					if( !pluginCheck() ) {
						Core.loadJS({ file: moduleFile, id: 'canvas-'+params.plugin+'-fn' });
						Core.isFuncTrue(pluginCheck).then( cond => {
							if( !cond ) {
								return false;
							}
							Core.getVars.fn[params.plugin](params.selector);
						});
					} else {
						Core.getVars.fn[params.plugin](params.selector);
					}
				}

				return true;
			},

			initModule: params => {
				if( 'dependent' != params.selector ) {
					if( typeof params.selector === 'object' ) {
						if( params.selector instanceof jQuery ){
							params.selector = params.selector[0];
						}

						var _el = params.selector;
					} else {
						var _el = Core.getVars.baseEl.querySelectorAll( params.selector );
					}

					if( _el.length < 1 ) {
						return false;
					}
				}

				var required = true;
				var dependentActive = true;

				if( params.required && Array.isArray( params.required ) ) {
					var requireAll = {};
					params.required.forEach( req => requireAll[req.plugin] = !req.fn() ? false : true );

					params.required.forEach( req => {
						if( !req.fn() ) {
							required = false;
							const getjQuery = async function() {
								Core.loadJS({ file: req.file, id: req.id });

								var funcAvailable = new Promise( resolve => {
									var int = setInterval( () => {
										if( req.fn() ) {
											requireAll[req.plugin] = true;
											const allTrue = Object.values(requireAll).every( value => value === true );
											if( allTrue ) {
												clearInterval(int);
												resolve(true);
											}
										}
									}, 333);
								});

								required = await funcAvailable;
								Core.runModule( params );
							}();
						}
					});
				}

				if( typeof params.dependency !== 'undefined' && typeof params.dependency === 'function' ) {
					dependentActive = false;
					const runDependent = async function() {
						let depAvailable = new Promise( resolve => {
							if( params.dependency.call( params, 'dependent' ) == true ) {
								resolve(true);
							}
						});
						return await depAvailable;
					};
					dependentActive = runDependent();
				}

				if( required && dependentActive ) {
					Core.runModule( params );
				}

				return true;
			},

			topScrollOffset: () =>  {
				let topOffsetScroll = 0;
				let pageMenuOffset = vars.elPageMenu?.querySelector('#page-menu-wrap')?.offsetHeight || 0;

				if( vars.elBody.classList.contains('is-expanded-menu') ) {
					if( vars.elHeader?.classList.contains('sticky-header') ) {
						topOffsetScroll = vars.elHeaderWrap.offsetHeight;
					}

					if( vars.elPageMenu?.classList.contains('dots-menu') ) {
						pageMenuOffset = 0;
					}
				}

				topOffsetScroll = topOffsetScroll + pageMenuOffset;

				Core.getVars.topScrollOffset = topOffsetScroll + options.scrollOffset;
			},
		};
	}();

	const Base = function() {
		return {
			init: () => {
				SEMICOLON.Mobile.any() && vars.elBody.classList.add('device-touch');
			},

			menuBreakpoint: () => {
				if( Core.getVars.menuBreakpoint <= Core.viewport().width ) {
					vars.elBody.classList.add( 'is-expanded-menu' );
				} else {
					vars.elBody.classList.remove( 'is-expanded-menu' );
				}

				if( vars.elPageMenu ) {
					if( typeof Core.getVars.pageMenuBreakpoint === 'undefined' ) {
						Core.getVars.pageMenuBreakpoint = Core.getVars.menuBreakpoint;
					}

					if( Core.getVars.pageMenuBreakpoint <= Core.viewport().width ) {
						vars.elBody.classList.add( 'is-expanded-pagemenu' );
					} else {
						vars.elBody.classList.remove( 'is-expanded-pagemenu' );
					}
				}
			},

			goToTop: () => {
				return Core.initModule({ selector: '#gotoTop', plugin: 'gototop' });
			},

			stickFooterOnSmall: () => {
				return Core.initModule({ selector: '#footer', plugin: 'stickfooteronsmall' });
			},

			logo: () => {
				return Core.initModule({ selector: '#logo', plugin: 'logo' });
			},

			setHeaderClasses: () => {
				Core.getVars.headerClasses = vars.elHeader?.className || '';
				Core.getVars.headerWrapClasses = vars.elHeaderWrap?.className || '';
			},

			headers: () => {
				return Core.initModule({ selector: '#header', plugin: 'headers' });
			},

			menus: () => {
				return Core.initModule({ selector: '#header', plugin: 'menus' });
			},

			pageMenu: () => {
				return Core.initModule({ selector: '#page-menu', plugin: 'pagemenu' });
			},

			sliderDimensions: () => {
				return Core.initModule({ selector: '.slider-element', plugin: 'sliderdimensions' });
			},

			sliderMenuClass: () => {
				return Core.initModule({ selector: '.transparent-header + .swiper_wrapper,.swiper_wrapper + .transparent-header,.transparent-header + .revslider-wrap,.revslider-wrap + .transparent-header', plugin: 'slidermenuclass' });
			},

			topSearch: () => {
				return Core.initModule({ selector: '#top-search-trigger', plugin: 'search' });
			},

			topCart: () => {
				return Core.initModule({ selector: '#top-cart', plugin: 'topcart' });
			},

			sidePanel: () => {
				return Core.initModule({ selector: '#side-panel', plugin: 'sidepanel' });
			},

			adaptiveColorScheme: () => {
				return Core.initModule({ selector: '.adaptive-color-scheme', plugin: 'adaptivecolorscheme' });
			},

			portfolioAjax: () => {
				return Core.initModule({ selector: '.portfolio-ajax', plugin: 'ajaxportfolio' });
			},

			cursor: () => {
				if( vars.customCursor ) {
					return Core.initModule({ selector: 'body', plugin: 'cursor' });
				}
			},

			setBSTheme: () => {
				if( vars.elBody.classList.contains('dark') ) {
					document.querySelector('html').setAttribute('data-bs-theme', 'dark');
				} else {
					document.querySelector('html').removeAttribute('data-bs-theme');
					document.querySelectorAll('.dark')?.forEach(el => el.setAttribute('data-bs-theme', 'dark'));
				}

				vars.elBody.querySelectorAll('.not-dark')?.forEach(el => el.setAttribute('data-bs-theme', 'light'));
			}
		}
	}();

	const Modules = function() {
		return {
			easing: () => {
				return Core.initModule({ selector: '[data-easing]', plugin: 'easing', required: [ vars.required.jQuery ] });
			},

			bootstrap: () => {
				let notExec = true;
				document.querySelectorAll('*').forEach( el => notExec && el.getAttributeNames().some( text => {
					if( text.includes('data-bs') ) {
						notExec = false;
						return Core.initModule({ selector: 'body', plugin: 'bootstrap' });
					}
				}));
			},

			resizeVideos: element => {
				return Core.initModule({ selector: element ? element : 'iframe[src*="youtube"],iframe[src*="vimeo"],iframe[src*="dailymotion"],iframe[src*="maps.google.com"],iframe[src*="google.com/maps"]', plugin: 'fitvids', required: [ vars.required.jQuery ] });
			},

			pageTransition: () => {
				if( vars.pageTransition ) {
					return Core.initModule({ selector: 'body', plugin: 'pagetransition' });
				}
			},

			lazyLoad: element => {
				return Core.initModule({ selector: element ? element : '.lazy:not(.lazy-loaded)', plugin: 'lazyload' });
			},

			dataClasses: () => {
				return Core.initModule({ selector: '[data-class]', plugin: 'dataclasses' });
			},

			dataHeights: () => {
				return Core.initModule({ selector: '[data-height-xxl],[data-height-xl],[data-height-lg],[data-height-md],[data-height-sm],[data-height-xs]', plugin: 'dataheights' });
			},

			lightbox: element => {
				return Core.initModule({ selector: element ? element : '[data-lightbox]', plugin: 'lightbox', required: [ vars.required.jQuery ] });
			},

			modal: element => {
				return Core.initModule({ selector: element ? element : '.modal-on-load', plugin: 'modal', required: [ vars.required.jQuery ] });
			},

			parallax: element => {
				return Core.initModule({ selector: element ? element : '.parallax .parallax-bg,.parallax .parallax-element', plugin: 'parallax' });
			},

			animations: element => {
				return Core.initModule({ selector: element ? element : '[data-animate]', plugin: 'animations' });
			},

			hoverAnimations: element => {
				return Core.initModule({ selector: element ? element : '[data-hover-animate]', plugin: 'hoveranimation' });
			},

			gridInit: element => {
				return Core.initModule({ selector: element ? element : '.grid-container', plugin: 'isotope', required: [ vars.required.jQuery ] });
			},

			filterInit: element => {
				return Core.initModule({ selector: element ? element : '.grid-filter,.custom-filter', plugin: 'gridfilter', required: [ vars.required.jQuery ] });
			},

			canvasSlider: element => {
				return Core.initModule({ selector: element ? element : '.swiper_wrapper', plugin: 'swiper' });
			},

			sliderParallax: () => {
				return Core.initModule({ selector: '.slider-parallax', plugin: 'sliderparallax' });
			},

			flexSlider: element => {
				return Core.initModule({ selector: element ? element : '.fslider', plugin: 'flexslider', required: [ vars.required.jQuery ] });
			},

			html5Video: element => {
				return Core.initModule({ selector: element ? element : '.video-wrap', plugin: 'html5video' });
			},

			youtubeBgVideo: element => {
				return Core.initModule({ selector: element ? element : '.yt-bg-player', plugin: 'youtube', required: [ vars.required.jQuery ] });
			},

			toggle: element => {
				return Core.initModule({ selector: element ? element : '.toggle', plugin: 'toggles' });
			},

			accordion: element => {
				return Core.initModule({ selector: element ? element : '.accordion', plugin: 'accordions', required: [ vars.required.jQuery ] });
			},

			counter: element => {
				return Core.initModule({ selector: element ? element : '.counter', plugin: 'counter', required: [ vars.required.jQuery ] });
			},

			countdown: element => {
				return Core.initModule({ selector: element ? element : '.countdown', plugin: 'countdown', required: [ vars.required.jQuery ] });
			},

			gmap: element => {
				return Core.initModule({ selector: element ? element : '.gmap', plugin: 'gmap', required: [ vars.required.jQuery ] });
			},

			roundedSkill: element => {
				return Core.initModule({ selector: element ? element : '.rounded-skill', plugin: 'piechart', required: [ vars.required.jQuery ] });
			},

			progress: element => {
				return Core.initModule({ selector: element ? element : '.skill-progress', plugin: 'progress' });
			},

			twitterFeed: element => {
				return Core.initModule({ selector: element ? element : '.twitter-feed', plugin: 'twitter', required: [ vars.required.jQuery ] });
			},

			flickrFeed: element => {
				return Core.initModule({ selector: element ? element : '.flickr-feed', plugin: 'flickrfeed', required: [ vars.required.jQuery ] });
			},

			instagram: element => {
				return Core.initModule({ selector: element ? element : '.instagram-photos', plugin: 'instagram' });
			},

			// Dribbble Pending

			navTree: element => {
				return Core.initModule({ selector: element ? element : '.nav-tree', plugin: 'navtree', required: [ vars.required.jQuery ] });
			},

			carousel: element => {
				return Core.initModule({ selector: element ? element : '.carousel-widget', plugin: 'carousel', required: [ vars.required.jQuery ] });
			},

			masonryThumbs: element => {
				return Core.initModule({ selector: element ? element : '.masonry-thumbs', plugin: 'masonrythumbs', required: [ vars.required.jQuery ] });
			},

			notifications: element => {
				return Core.initModule({ selector: element ? element : false, plugin: 'notify', required: [ vars.required.jQuery ] });
			},

			textRotator: element => {
				return Core.initModule({ selector: element ? element : '.text-rotater', plugin: 'textrotator', required: [ vars.required.jQuery ] });
			},

			onePage: element => {
				return Core.initModule({ selector: element ? element : '[data-scrollto],.one-page-menu', plugin: 'onepage' });
			},

			ajaxForm: element => {
				return Core.initModule({ selector: element ? element : '.form-widget', plugin: 'ajaxform', required: [ vars.required.jQuery ] });
			},

			subscribe: element => {
				return Core.initModule({ selector: element ? element : '.subscribe-widget', plugin: 'subscribe', required: [ vars.required.jQuery ] });
			},

			conditional: element => {
				return Core.initModule({ selector: element ? element : '.form-group[data-condition],.form-group[data-conditions]', plugin: 'conditional' });
			},

			shapeDivider: element => {
				return Core.initModule({ selector: element ? element : '.shape-divider', plugin: 'shapedivider' });
			},

			stickySidebar: element => {
				return Core.initModule({ selector: element ? element : '.sticky-sidebar-wrap', plugin: 'stickysidebar', required: [ vars.required.jQuery ] });
			},

			cookies: element => {
				return Core.initModule({ selector: element ? element : '.gdpr-settings,[data-cookies]', plugin: 'cookie' });
			},

			quantity: element => {
				return Core.initModule({ selector: element ? element : '.quantity', plugin: 'quantity' });
			},

			readmore: element => {
				return Core.initModule({ selector: element ? element : '[data-readmore]', plugin: 'readmore' });
			},

			pricingSwitcher: element => {
				return Core.initModule({ selector: element ? element : '.pts-switcher', plugin: 'pricingswitcher' });
			},

			ajaxButton: element => {
				return Core.initModule({ selector: element ? element : '[data-ajax-loader]', plugin: 'ajaxbutton' });
			},

			videoFacade: element => {
				return Core.initModule({ selector: element ? element : '.video-facade', plugin: 'videofacade' });
			},

			schemeToggler: element => {
				return Core.initModule({ selector: element ? element : '.body-scheme-toggle', plugin: 'schemetoggler' });
			},

			clipboardCopy: element => {
				return Core.initModule({ selector: element ? element : '.clipboard-copy', plugin: 'clipboard' });
			},

			codeHighlight: element => {
				return Core.initModule({ selector: element ? element : '.code-highlight', plugin: 'codehighlight' });
			},

			viewportDetect: element => {
				return Core.initModule({ selector: element ? element : '.viewport-detect', plugin: 'viewportdetect' });
			},

			bsComponents: element => {
				return Core.initModule({ selector: element ? element : '[data-bs-toggle="tooltip"],[data-bs-toggle="popover"],[data-bs-toggle="tab"],[data-bs-toggle="pill"],.style-msg', plugin: 'bscomponents' });
			}
		};
	}();

	const Mobile = function() {
		return {
			Android: () =>  {
				return navigator.userAgent.match(/Android/i);
			},
			BlackBerry: () =>  {
				return navigator.userAgent.match(/BlackBerry/i);
			},
			iOS: () =>  {
				return navigator.userAgent.match(/iPhone|iPad|iPod/i);
			},
			Opera: () =>  {
				return navigator.userAgent.match(/Opera Mini/i);
			},
			Windows: () =>  {
				return navigator.userAgent.match(/IEMobile/i);
			},
			any: () =>  {
				return (Mobile.Android() || Mobile.BlackBerry() || Mobile.iOS() || Mobile.Opera() || Mobile.Windows());
			}
		}
	}();

	// Add your Custom JS Codes here
	const Custom = function() {
		return {
			onReady: () => {
				// Add JS Codes here to Run on Document Ready
			},

			onLoad: () => {
				// Add JS Codes here to Run on Window Load
			},

			onResize: () => {
				// Add JS Codes here to Run on Window Resize
			}
		}
	}();

	const DocumentOnResize = function() {
		return {
			init: () => {
				Core.viewport();
				Core.breakpoints();
				Base.menuBreakpoint();

				Core.run( vars.resizers );

				Custom.onResize();

				Core.addEvent( window, 'cnvsResize' );
			}
		}
	}();

	const DocumentOnReady = function() {
		return {
			init: () => {
				Core.breakpoints();
				Core.colorScheme();
				Core.runBase();
				Core.runModules();
				Core.topScrollOffset();

				DocumentOnReady.windowscroll();

				Custom.onReady();
			},

			windowscroll: () => {
				Core.scrollEnd( () => {
					Base.pageMenu();
				});
			}
		}
	}();

	const DocumentOnLoad = function() {
		return {
			init: () => {
				Custom.onLoad();
			}
		};
	}();

	document.addEventListener( 'DOMContentLoaded', () => {
		DocumentOnReady.init();
	});

	window.onload = () => {
		DocumentOnLoad.init();
	};

	const resizeFunctions = Core.debouncedResize(() => {
		DocumentOnResize.init();
	}, 250);

	window.addEventListener('resize', () => {
		resizeFunctions();
	});

	const canvas_umd = {
		Core,
		Base,
		Modules,
		Mobile,
		Custom,
	};

	return canvas_umd;
})));

/*!
  * Bootstrap v5.3.0-alpha3 (https://getbootstrap.com/)
  * Copyright 2011-2023 The Bootstrap Authors (https://github.com/twbs/bootstrap/graphs/contributors)
  * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
  */
!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?module.exports=e():"function"==typeof define&&define.amd?define(e):(t="undefined"!=typeof globalThis?globalThis:t||self).bootstrap=e()}(this,(function(){"use strict";const t=new Map,e={set(e,i,n){t.has(e)||t.set(e,new Map);const s=t.get(e);s.has(i)||0===s.size?s.set(i,n):console.error(`Bootstrap doesn't allow more than one instance per element. Bound instance: ${Array.from(s.keys())[0]}.`)},get:(e,i)=>t.has(e)&&t.get(e).get(i)||null,remove(e,i){if(!t.has(e))return;const n=t.get(e);n.delete(i),0===n.size&&t.delete(e)}},i="transitionend",n=t=>(t&&window.CSS&&window.CSS.escape&&(t=t.replace(/#([^\s"#']+)/g,((t,e)=>`#${CSS.escape(e)}`))),t),s=t=>{t.dispatchEvent(new Event(i))},o=t=>!(!t||"object"!=typeof t)&&(void 0!==t.jquery&&(t=t[0]),void 0!==t.nodeType),r=t=>o(t)?t.jquery?t[0]:t:"string"==typeof t&&t.length>0?document.querySelector(n(t)):null,a=t=>{if(!o(t)||0===t.getClientRects().length)return!1;const e="visible"===getComputedStyle(t).getPropertyValue("visibility"),i=t.closest("details:not([open])");if(!i)return e;if(i!==t){const e=t.closest("summary");if(e&&e.parentNode!==i)return!1;if(null===e)return!1}return e},l=t=>!t||t.nodeType!==Node.ELEMENT_NODE||!!t.classList.contains("disabled")||(void 0!==t.disabled?t.disabled:t.hasAttribute("disabled")&&"false"!==t.getAttribute("disabled")),c=t=>{if(!document.documentElement.attachShadow)return null;if("function"==typeof t.getRootNode){const e=t.getRootNode();return e instanceof ShadowRoot?e:null}return t instanceof ShadowRoot?t:t.parentNode?c(t.parentNode):null},h=()=>{},d=t=>{t.offsetHeight},u=()=>window.jQuery&&!document.body.hasAttribute("data-bs-no-jquery")?window.jQuery:null,f=[],p=()=>"rtl"===document.documentElement.dir,m=t=>{var e;e=()=>{const e=u();if(e){const i=t.NAME,n=e.fn[i];e.fn[i]=t.jQueryInterface,e.fn[i].Constructor=t,e.fn[i].noConflict=()=>(e.fn[i]=n,t.jQueryInterface)}},"loading"===document.readyState?(f.length||document.addEventListener("DOMContentLoaded",(()=>{for(const t of f)t()})),f.push(e)):e()},g=(t,e=[],i=t)=>"function"==typeof t?t(...e):i,_=(t,e,n=!0)=>{if(!n)return void g(t);const o=(t=>{if(!t)return 0;let{transitionDuration:e,transitionDelay:i}=window.getComputedStyle(t);const n=Number.parseFloat(e),s=Number.parseFloat(i);return n||s?(e=e.split(",")[0],i=i.split(",")[0],1e3*(Number.parseFloat(e)+Number.parseFloat(i))):0})(e)+5;let r=!1;const a=({target:n})=>{n===e&&(r=!0,e.removeEventListener(i,a),g(t))};e.addEventListener(i,a),setTimeout((()=>{r||s(e)}),o)},b=(t,e,i,n)=>{const s=t.length;let o=t.indexOf(e);return-1===o?!i&&n?t[s-1]:t[0]:(o+=i?1:-1,n&&(o=(o+s)%s),t[Math.max(0,Math.min(o,s-1))])},v=/[^.]*(?=\..*)\.|.*/,y=/\..*/,w=/::\d+$/,A={};let E=1;const T={mouseenter:"mouseover",mouseleave:"mouseout"},C=new Set(["click","dblclick","mouseup","mousedown","contextmenu","mousewheel","DOMMouseScroll","mouseover","mouseout","mousemove","selectstart","selectend","keydown","keypress","keyup","orientationchange","touchstart","touchmove","touchend","touchcancel","pointerdown","pointermove","pointerup","pointerleave","pointercancel","gesturestart","gesturechange","gestureend","focus","blur","change","reset","select","submit","focusin","focusout","load","unload","beforeunload","resize","move","DOMContentLoaded","readystatechange","error","abort","scroll"]);function O(t,e){return e&&`${e}::${E++}`||t.uidEvent||E++}function x(t){const e=O(t);return t.uidEvent=e,A[e]=A[e]||{},A[e]}function k(t,e,i=null){return Object.values(t).find((t=>t.callable===e&&t.delegationSelector===i))}function L(t,e,i){const n="string"==typeof e,s=n?i:e||i;let o=N(t);return C.has(o)||(o=t),[n,s,o]}function S(t,e,i,n,s){if("string"!=typeof e||!t)return;let[o,r,a]=L(e,i,n);if(e in T){const t=t=>function(e){if(!e.relatedTarget||e.relatedTarget!==e.delegateTarget&&!e.delegateTarget.contains(e.relatedTarget))return t.call(this,e)};r=t(r)}const l=x(t),c=l[a]||(l[a]={}),h=k(c,r,o?i:null);if(h)return void(h.oneOff=h.oneOff&&s);const d=O(r,e.replace(v,"")),u=o?function(t,e,i){return function n(s){const o=t.querySelectorAll(e);for(let{target:r}=s;r&&r!==this;r=r.parentNode)for(const a of o)if(a===r)return j(s,{delegateTarget:r}),n.oneOff&&P.off(t,s.type,e,i),i.apply(r,[s])}}(t,i,r):function(t,e){return function i(n){return j(n,{delegateTarget:t}),i.oneOff&&P.off(t,n.type,e),e.apply(t,[n])}}(t,r);u.delegationSelector=o?i:null,u.callable=r,u.oneOff=s,u.uidEvent=d,c[d]=u,t.addEventListener(a,u,o)}function D(t,e,i,n,s){const o=k(e[i],n,s);o&&(t.removeEventListener(i,o,Boolean(s)),delete e[i][o.uidEvent])}function I(t,e,i,n){const s=e[i]||{};for(const[o,r]of Object.entries(s))o.includes(n)&&D(t,e,i,r.callable,r.delegationSelector)}function N(t){return t=t.replace(y,""),T[t]||t}const P={on(t,e,i,n){S(t,e,i,n,!1)},one(t,e,i,n){S(t,e,i,n,!0)},off(t,e,i,n){if("string"!=typeof e||!t)return;const[s,o,r]=L(e,i,n),a=r!==e,l=x(t),c=l[r]||{},h=e.startsWith(".");if(void 0===o){if(h)for(const i of Object.keys(l))I(t,l,i,e.slice(1));for(const[i,n]of Object.entries(c)){const s=i.replace(w,"");a&&!e.includes(s)||D(t,l,r,n.callable,n.delegationSelector)}}else{if(!Object.keys(c).length)return;D(t,l,r,o,s?i:null)}},trigger(t,e,i){if("string"!=typeof e||!t)return null;const n=u();let s=null,o=!0,r=!0,a=!1;e!==N(e)&&n&&(s=n.Event(e,i),n(t).trigger(s),o=!s.isPropagationStopped(),r=!s.isImmediatePropagationStopped(),a=s.isDefaultPrevented());const l=j(new Event(e,{bubbles:o,cancelable:!0}),i);return a&&l.preventDefault(),r&&t.dispatchEvent(l),l.defaultPrevented&&s&&s.preventDefault(),l}};function j(t,e={}){for(const[i,n]of Object.entries(e))try{t[i]=n}catch(e){Object.defineProperty(t,i,{configurable:!0,get:()=>n})}return t}function M(t){if("true"===t)return!0;if("false"===t)return!1;if(t===Number(t).toString())return Number(t);if(""===t||"null"===t)return null;if("string"!=typeof t)return t;try{return JSON.parse(decodeURIComponent(t))}catch(e){return t}}function F(t){return t.replace(/[A-Z]/g,(t=>`-${t.toLowerCase()}`))}const H={setDataAttribute(t,e,i){t.setAttribute(`data-bs-${F(e)}`,i)},removeDataAttribute(t,e){t.removeAttribute(`data-bs-${F(e)}`)},getDataAttributes(t){if(!t)return{};const e={},i=Object.keys(t.dataset).filter((t=>t.startsWith("bs")&&!t.startsWith("bsConfig")));for(const n of i){let i=n.replace(/^bs/,"");i=i.charAt(0).toLowerCase()+i.slice(1,i.length),e[i]=M(t.dataset[n])}return e},getDataAttribute:(t,e)=>M(t.getAttribute(`data-bs-${F(e)}`))};class ${static get Default(){return{}}static get DefaultType(){return{}}static get NAME(){throw new Error('You have to implement the static method "NAME", for each component!')}_getConfig(t){return t=this._mergeConfigObj(t),t=this._configAfterMerge(t),this._typeCheckConfig(t),t}_configAfterMerge(t){return t}_mergeConfigObj(t,e){const i=o(e)?H.getDataAttribute(e,"config"):{};return{...this.constructor.Default,..."object"==typeof i?i:{},...o(e)?H.getDataAttributes(e):{},..."object"==typeof t?t:{}}}_typeCheckConfig(t,e=this.constructor.DefaultType){for(const[n,s]of Object.entries(e)){const e=t[n],r=o(e)?"element":null==(i=e)?`${i}`:Object.prototype.toString.call(i).match(/\s([a-z]+)/i)[1].toLowerCase();if(!new RegExp(s).test(r))throw new TypeError(`${this.constructor.NAME.toUpperCase()}: Option "${n}" provided type "${r}" but expected type "${s}".`)}var i}}class W extends ${constructor(t,i){super(),(t=r(t))&&(this._element=t,this._config=this._getConfig(i),e.set(this._element,this.constructor.DATA_KEY,this))}dispose(){e.remove(this._element,this.constructor.DATA_KEY),P.off(this._element,this.constructor.EVENT_KEY);for(const t of Object.getOwnPropertyNames(this))this[t]=null}_queueCallback(t,e,i=!0){_(t,e,i)}_getConfig(t){return t=this._mergeConfigObj(t,this._element),t=this._configAfterMerge(t),this._typeCheckConfig(t),t}static getInstance(t){return e.get(r(t),this.DATA_KEY)}static getOrCreateInstance(t,e={}){return this.getInstance(t)||new this(t,"object"==typeof e?e:null)}static get VERSION(){return"5.3.0-alpha2"}static get DATA_KEY(){return`bs.${this.NAME}`}static get EVENT_KEY(){return`.${this.DATA_KEY}`}static eventName(t){return`${t}${this.EVENT_KEY}`}}const B=t=>{let e=t.getAttribute("data-bs-target");if(!e||"#"===e){let i=t.getAttribute("href");if(!i||!i.includes("#")&&!i.startsWith("."))return null;i.includes("#")&&!i.startsWith("#")&&(i=`#${i.split("#")[1]}`),e=i&&"#"!==i?i.trim():null}return n(e)},z={find:(t,e=document.documentElement)=>[].concat(...Element.prototype.querySelectorAll.call(e,t)),findOne:(t,e=document.documentElement)=>Element.prototype.querySelector.call(e,t),children:(t,e)=>[].concat(...t.children).filter((t=>t.matches(e))),parents(t,e){const i=[];let n=t.parentNode.closest(e);for(;n;)i.push(n),n=n.parentNode.closest(e);return i},prev(t,e){let i=t.previousElementSibling;for(;i;){if(i.matches(e))return[i];i=i.previousElementSibling}return[]},next(t,e){let i=t.nextElementSibling;for(;i;){if(i.matches(e))return[i];i=i.nextElementSibling}return[]},focusableChildren(t){const e=["a","button","input","textarea","select","details","[tabindex]",'[contenteditable="true"]'].map((t=>`${t}:not([tabindex^="-"])`)).join(",");return this.find(e,t).filter((t=>!l(t)&&a(t)))},getSelectorFromElement(t){const e=B(t);return e&&z.findOne(e)?e:null},getElementFromSelector(t){const e=B(t);return e?z.findOne(e):null},getMultipleElementsFromSelector(t){const e=B(t);return e?z.find(e):[]}},R=(t,e="hide")=>{const i=`click.dismiss${t.EVENT_KEY}`,n=t.NAME;P.on(document,i,`[data-bs-dismiss="${n}"]`,(function(i){if(["A","AREA"].includes(this.tagName)&&i.preventDefault(),l(this))return;const s=z.getElementFromSelector(this)||this.closest(`.${n}`);t.getOrCreateInstance(s)[e]()}))};class q extends W{static get NAME(){return"alert"}close(){if(P.trigger(this._element,"close.bs.alert").defaultPrevented)return;this._element.classList.remove("show");const t=this._element.classList.contains("fade");this._queueCallback((()=>this._destroyElement()),this._element,t)}_destroyElement(){this._element.remove(),P.trigger(this._element,"closed.bs.alert"),this.dispose()}static jQueryInterface(t){return this.each((function(){const e=q.getOrCreateInstance(this);if("string"==typeof t){if(void 0===e[t]||t.startsWith("_")||"constructor"===t)throw new TypeError(`No method named "${t}"`);e[t](this)}}))}}R(q,"close"),m(q);const V='[data-bs-toggle="button"]';class K extends W{static get NAME(){return"button"}toggle(){this._element.setAttribute("aria-pressed",this._element.classList.toggle("active"))}static jQueryInterface(t){return this.each((function(){const e=K.getOrCreateInstance(this);"toggle"===t&&e[t]()}))}}P.on(document,"click.bs.button.data-api",V,(t=>{t.preventDefault();const e=t.target.closest(V);K.getOrCreateInstance(e).toggle()})),m(K);const Q={endCallback:null,leftCallback:null,rightCallback:null},X={endCallback:"(function|null)",leftCallback:"(function|null)",rightCallback:"(function|null)"};class Y extends ${constructor(t,e){super(),this._element=t,t&&Y.isSupported()&&(this._config=this._getConfig(e),this._deltaX=0,this._supportPointerEvents=Boolean(window.PointerEvent),this._initEvents())}static get Default(){return Q}static get DefaultType(){return X}static get NAME(){return"swipe"}dispose(){P.off(this._element,".bs.swipe")}_start(t){this._supportPointerEvents?this._eventIsPointerPenTouch(t)&&(this._deltaX=t.clientX):this._deltaX=t.touches[0].clientX}_end(t){this._eventIsPointerPenTouch(t)&&(this._deltaX=t.clientX-this._deltaX),this._handleSwipe(),g(this._config.endCallback)}_move(t){this._deltaX=t.touches&&t.touches.length>1?0:t.touches[0].clientX-this._deltaX}_handleSwipe(){const t=Math.abs(this._deltaX);if(t<=40)return;const e=t/this._deltaX;this._deltaX=0,e&&g(e>0?this._config.rightCallback:this._config.leftCallback)}_initEvents(){this._supportPointerEvents?(P.on(this._element,"pointerdown.bs.swipe",(t=>this._start(t))),P.on(this._element,"pointerup.bs.swipe",(t=>this._end(t))),this._element.classList.add("pointer-event")):(P.on(this._element,"touchstart.bs.swipe",(t=>this._start(t))),P.on(this._element,"touchmove.bs.swipe",(t=>this._move(t))),P.on(this._element,"touchend.bs.swipe",(t=>this._end(t))))}_eventIsPointerPenTouch(t){return this._supportPointerEvents&&("pen"===t.pointerType||"touch"===t.pointerType)}static isSupported(){return"ontouchstart"in document.documentElement||navigator.maxTouchPoints>0}}const U="next",G="prev",J="left",Z="right",tt="slid.bs.carousel",et="carousel",it="active",nt={ArrowLeft:Z,ArrowRight:J},st={interval:5e3,keyboard:!0,pause:"hover",ride:!1,touch:!0,wrap:!0},ot={interval:"(number|boolean)",keyboard:"boolean",pause:"(string|boolean)",ride:"(boolean|string)",touch:"boolean",wrap:"boolean"};class rt extends W{constructor(t,e){super(t,e),this._interval=null,this._activeElement=null,this._isSliding=!1,this.touchTimeout=null,this._swipeHelper=null,this._indicatorsElement=z.findOne(".carousel-indicators",this._element),this._addEventListeners(),this._config.ride===et&&this.cycle()}static get Default(){return st}static get DefaultType(){return ot}static get NAME(){return"carousel"}next(){this._slide(U)}nextWhenVisible(){!document.hidden&&a(this._element)&&this.next()}prev(){this._slide(G)}pause(){this._isSliding&&s(this._element),this._clearInterval()}cycle(){this._clearInterval(),this._updateInterval(),this._interval=setInterval((()=>this.nextWhenVisible()),this._config.interval)}_maybeEnableCycle(){this._config.ride&&(this._isSliding?P.one(this._element,tt,(()=>this.cycle())):this.cycle())}to(t){const e=this._getItems();if(t>e.length-1||t<0)return;if(this._isSliding)return void P.one(this._element,tt,(()=>this.to(t)));const i=this._getItemIndex(this._getActive());if(i===t)return;const n=t>i?U:G;this._slide(n,e[t])}dispose(){this._swipeHelper&&this._swipeHelper.dispose(),super.dispose()}_configAfterMerge(t){return t.defaultInterval=t.interval,t}_addEventListeners(){this._config.keyboard&&P.on(this._element,"keydown.bs.carousel",(t=>this._keydown(t))),"hover"===this._config.pause&&(P.on(this._element,"mouseenter.bs.carousel",(()=>this.pause())),P.on(this._element,"mouseleave.bs.carousel",(()=>this._maybeEnableCycle()))),this._config.touch&&Y.isSupported()&&this._addTouchEventListeners()}_addTouchEventListeners(){for(const t of z.find(".carousel-item img",this._element))P.on(t,"dragstart.bs.carousel",(t=>t.preventDefault()));const t={leftCallback:()=>this._slide(this._directionToOrder(J)),rightCallback:()=>this._slide(this._directionToOrder(Z)),endCallback:()=>{"hover"===this._config.pause&&(this.pause(),this.touchTimeout&&clearTimeout(this.touchTimeout),this.touchTimeout=setTimeout((()=>this._maybeEnableCycle()),500+this._config.interval))}};this._swipeHelper=new Y(this._element,t)}_keydown(t){if(/input|textarea/i.test(t.target.tagName))return;const e=nt[t.key];e&&(t.preventDefault(),this._slide(this._directionToOrder(e)))}_getItemIndex(t){return this._getItems().indexOf(t)}_setActiveIndicatorElement(t){if(!this._indicatorsElement)return;const e=z.findOne(".active",this._indicatorsElement);e.classList.remove(it),e.removeAttribute("aria-current");const i=z.findOne(`[data-bs-slide-to="${t}"]`,this._indicatorsElement);i&&(i.classList.add(it),i.setAttribute("aria-current","true"))}_updateInterval(){const t=this._activeElement||this._getActive();if(!t)return;const e=Number.parseInt(t.getAttribute("data-bs-interval"),10);this._config.interval=e||this._config.defaultInterval}_slide(t,e=null){if(this._isSliding)return;const i=this._getActive(),n=t===U,s=e||b(this._getItems(),i,n,this._config.wrap);if(s===i)return;const o=this._getItemIndex(s),r=e=>P.trigger(this._element,e,{relatedTarget:s,direction:this._orderToDirection(t),from:this._getItemIndex(i),to:o});if(r("slide.bs.carousel").defaultPrevented)return;if(!i||!s)return;const a=Boolean(this._interval);this.pause(),this._isSliding=!0,this._setActiveIndicatorElement(o),this._activeElement=s;const l=n?"carousel-item-start":"carousel-item-end",c=n?"carousel-item-next":"carousel-item-prev";s.classList.add(c),d(s),i.classList.add(l),s.classList.add(l),this._queueCallback((()=>{s.classList.remove(l,c),s.classList.add(it),i.classList.remove(it,c,l),this._isSliding=!1,r(tt)}),i,this._isAnimated()),a&&this.cycle()}_isAnimated(){return this._element.classList.contains("slide")}_getActive(){return z.findOne(".active.carousel-item",this._element)}_getItems(){return z.find(".carousel-item",this._element)}_clearInterval(){this._interval&&(clearInterval(this._interval),this._interval=null)}_directionToOrder(t){return p()?t===J?G:U:t===J?U:G}_orderToDirection(t){return p()?t===G?J:Z:t===G?Z:J}static jQueryInterface(t){return this.each((function(){const e=rt.getOrCreateInstance(this,t);if("number"!=typeof t){if("string"==typeof t){if(void 0===e[t]||t.startsWith("_")||"constructor"===t)throw new TypeError(`No method named "${t}"`);e[t]()}}else e.to(t)}))}}P.on(document,"click.bs.carousel.data-api","[data-bs-slide], [data-bs-slide-to]",(function(t){const e=z.getElementFromSelector(this);if(!e||!e.classList.contains(et))return;t.preventDefault();const i=rt.getOrCreateInstance(e),n=this.getAttribute("data-bs-slide-to");return n?(i.to(n),void i._maybeEnableCycle()):"next"===H.getDataAttribute(this,"slide")?(i.next(),void i._maybeEnableCycle()):(i.prev(),void i._maybeEnableCycle())})),P.on(window,"load.bs.carousel.data-api",(()=>{const t=z.find('[data-bs-ride="carousel"]');for(const e of t)rt.getOrCreateInstance(e)})),m(rt);const at="show",lt="collapse",ct="collapsing",ht='[data-bs-toggle="collapse"]',dt={parent:null,toggle:!0},ut={parent:"(null|element)",toggle:"boolean"};class ft extends W{constructor(t,e){super(t,e),this._isTransitioning=!1,this._triggerArray=[];const i=z.find(ht);for(const t of i){const e=z.getSelectorFromElement(t),i=z.find(e).filter((t=>t===this._element));null!==e&&i.length&&this._triggerArray.push(t)}this._initializeChildren(),this._config.parent||this._addAriaAndCollapsedClass(this._triggerArray,this._isShown()),this._config.toggle&&this.toggle()}static get Default(){return dt}static get DefaultType(){return ut}static get NAME(){return"collapse"}toggle(){this._isShown()?this.hide():this.show()}show(){if(this._isTransitioning||this._isShown())return;let t=[];if(this._config.parent&&(t=this._getFirstLevelChildren(".collapse.show, .collapse.collapsing").filter((t=>t!==this._element)).map((t=>ft.getOrCreateInstance(t,{toggle:!1})))),t.length&&t[0]._isTransitioning)return;if(P.trigger(this._element,"show.bs.collapse").defaultPrevented)return;for(const e of t)e.hide();const e=this._getDimension();this._element.classList.remove(lt),this._element.classList.add(ct),this._element.style[e]=0,this._addAriaAndCollapsedClass(this._triggerArray,!0),this._isTransitioning=!0;const i=`scroll${e[0].toUpperCase()+e.slice(1)}`;this._queueCallback((()=>{this._isTransitioning=!1,this._element.classList.remove(ct),this._element.classList.add(lt,at),this._element.style[e]="",P.trigger(this._element,"shown.bs.collapse")}),this._element,!0),this._element.style[e]=`${this._element[i]}px`}hide(){if(this._isTransitioning||!this._isShown())return;if(P.trigger(this._element,"hide.bs.collapse").defaultPrevented)return;const t=this._getDimension();this._element.style[t]=`${this._element.getBoundingClientRect()[t]}px`,d(this._element),this._element.classList.add(ct),this._element.classList.remove(lt,at);for(const t of this._triggerArray){const e=z.getElementFromSelector(t);e&&!this._isShown(e)&&this._addAriaAndCollapsedClass([t],!1)}this._isTransitioning=!0,this._element.style[t]="",this._queueCallback((()=>{this._isTransitioning=!1,this._element.classList.remove(ct),this._element.classList.add(lt),P.trigger(this._element,"hidden.bs.collapse")}),this._element,!0)}_isShown(t=this._element){return t.classList.contains(at)}_configAfterMerge(t){return t.toggle=Boolean(t.toggle),t.parent=r(t.parent),t}_getDimension(){return this._element.classList.contains("collapse-horizontal")?"width":"height"}_initializeChildren(){if(!this._config.parent)return;const t=this._getFirstLevelChildren(ht);for(const e of t){const t=z.getElementFromSelector(e);t&&this._addAriaAndCollapsedClass([e],this._isShown(t))}}_getFirstLevelChildren(t){const e=z.find(":scope .collapse .collapse",this._config.parent);return z.find(t,this._config.parent).filter((t=>!e.includes(t)))}_addAriaAndCollapsedClass(t,e){if(t.length)for(const i of t)i.classList.toggle("collapsed",!e),i.setAttribute("aria-expanded",e)}static jQueryInterface(t){const e={};return"string"==typeof t&&/show|hide/.test(t)&&(e.toggle=!1),this.each((function(){const i=ft.getOrCreateInstance(this,e);if("string"==typeof t){if(void 0===i[t])throw new TypeError(`No method named "${t}"`);i[t]()}}))}}P.on(document,"click.bs.collapse.data-api",ht,(function(t){("A"===t.target.tagName||t.delegateTarget&&"A"===t.delegateTarget.tagName)&&t.preventDefault();for(const t of z.getMultipleElementsFromSelector(this))ft.getOrCreateInstance(t,{toggle:!1}).toggle()})),m(ft);var pt="top",mt="bottom",gt="right",_t="left",bt="auto",vt=[pt,mt,gt,_t],yt="start",wt="end",At="clippingParents",Et="viewport",Tt="popper",Ct="reference",Ot=vt.reduce((function(t,e){return t.concat([e+"-"+yt,e+"-"+wt])}),[]),xt=[].concat(vt,[bt]).reduce((function(t,e){return t.concat([e,e+"-"+yt,e+"-"+wt])}),[]),kt="beforeRead",Lt="read",St="afterRead",Dt="beforeMain",It="main",Nt="afterMain",Pt="beforeWrite",jt="write",Mt="afterWrite",Ft=[kt,Lt,St,Dt,It,Nt,Pt,jt,Mt];function Ht(t){return t?(t.nodeName||"").toLowerCase():null}function $t(t){if(null==t)return window;if("[object Window]"!==t.toString()){var e=t.ownerDocument;return e&&e.defaultView||window}return t}function Wt(t){return t instanceof $t(t).Element||t instanceof Element}function Bt(t){return t instanceof $t(t).HTMLElement||t instanceof HTMLElement}function zt(t){return"undefined"!=typeof ShadowRoot&&(t instanceof $t(t).ShadowRoot||t instanceof ShadowRoot)}const Rt={name:"applyStyles",enabled:!0,phase:"write",fn:function(t){var e=t.state;Object.keys(e.elements).forEach((function(t){var i=e.styles[t]||{},n=e.attributes[t]||{},s=e.elements[t];Bt(s)&&Ht(s)&&(Object.assign(s.style,i),Object.keys(n).forEach((function(t){var e=n[t];!1===e?s.removeAttribute(t):s.setAttribute(t,!0===e?"":e)})))}))},effect:function(t){var e=t.state,i={popper:{position:e.options.strategy,left:"0",top:"0",margin:"0"},arrow:{position:"absolute"},reference:{}};return Object.assign(e.elements.popper.style,i.popper),e.styles=i,e.elements.arrow&&Object.assign(e.elements.arrow.style,i.arrow),function(){Object.keys(e.elements).forEach((function(t){var n=e.elements[t],s=e.attributes[t]||{},o=Object.keys(e.styles.hasOwnProperty(t)?e.styles[t]:i[t]).reduce((function(t,e){return t[e]="",t}),{});Bt(n)&&Ht(n)&&(Object.assign(n.style,o),Object.keys(s).forEach((function(t){n.removeAttribute(t)})))}))}},requires:["computeStyles"]};function qt(t){return t.split("-")[0]}var Vt=Math.max,Kt=Math.min,Qt=Math.round;function Xt(){var t=navigator.userAgentData;return null!=t&&t.brands&&Array.isArray(t.brands)?t.brands.map((function(t){return t.brand+"/"+t.version})).join(" "):navigator.userAgent}function Yt(){return!/^((?!chrome|android).)*safari/i.test(Xt())}function Ut(t,e,i){void 0===e&&(e=!1),void 0===i&&(i=!1);var n=t.getBoundingClientRect(),s=1,o=1;e&&Bt(t)&&(s=t.offsetWidth>0&&Qt(n.width)/t.offsetWidth||1,o=t.offsetHeight>0&&Qt(n.height)/t.offsetHeight||1);var r=(Wt(t)?$t(t):window).visualViewport,a=!Yt()&&i,l=(n.left+(a&&r?r.offsetLeft:0))/s,c=(n.top+(a&&r?r.offsetTop:0))/o,h=n.width/s,d=n.height/o;return{width:h,height:d,top:c,right:l+h,bottom:c+d,left:l,x:l,y:c}}function Gt(t){var e=Ut(t),i=t.offsetWidth,n=t.offsetHeight;return Math.abs(e.width-i)<=1&&(i=e.width),Math.abs(e.height-n)<=1&&(n=e.height),{x:t.offsetLeft,y:t.offsetTop,width:i,height:n}}function Jt(t,e){var i=e.getRootNode&&e.getRootNode();if(t.contains(e))return!0;if(i&&zt(i)){var n=e;do{if(n&&t.isSameNode(n))return!0;n=n.parentNode||n.host}while(n)}return!1}function Zt(t){return $t(t).getComputedStyle(t)}function te(t){return["table","td","th"].indexOf(Ht(t))>=0}function ee(t){return((Wt(t)?t.ownerDocument:t.document)||window.document).documentElement}function ie(t){return"html"===Ht(t)?t:t.assignedSlot||t.parentNode||(zt(t)?t.host:null)||ee(t)}function ne(t){return Bt(t)&&"fixed"!==Zt(t).position?t.offsetParent:null}function se(t){for(var e=$t(t),i=ne(t);i&&te(i)&&"static"===Zt(i).position;)i=ne(i);return i&&("html"===Ht(i)||"body"===Ht(i)&&"static"===Zt(i).position)?e:i||function(t){var e=/firefox/i.test(Xt());if(/Trident/i.test(Xt())&&Bt(t)&&"fixed"===Zt(t).position)return null;var i=ie(t);for(zt(i)&&(i=i.host);Bt(i)&&["html","body"].indexOf(Ht(i))<0;){var n=Zt(i);if("none"!==n.transform||"none"!==n.perspective||"paint"===n.contain||-1!==["transform","perspective"].indexOf(n.willChange)||e&&"filter"===n.willChange||e&&n.filter&&"none"!==n.filter)return i;i=i.parentNode}return null}(t)||e}function oe(t){return["top","bottom"].indexOf(t)>=0?"x":"y"}function re(t,e,i){return Vt(t,Kt(e,i))}function ae(t){return Object.assign({},{top:0,right:0,bottom:0,left:0},t)}function le(t,e){return e.reduce((function(e,i){return e[i]=t,e}),{})}const ce={name:"arrow",enabled:!0,phase:"main",fn:function(t){var e,i=t.state,n=t.name,s=t.options,o=i.elements.arrow,r=i.modifiersData.popperOffsets,a=qt(i.placement),l=oe(a),c=[_t,gt].indexOf(a)>=0?"height":"width";if(o&&r){var h=function(t,e){return ae("number"!=typeof(t="function"==typeof t?t(Object.assign({},e.rects,{placement:e.placement})):t)?t:le(t,vt))}(s.padding,i),d=Gt(o),u="y"===l?pt:_t,f="y"===l?mt:gt,p=i.rects.reference[c]+i.rects.reference[l]-r[l]-i.rects.popper[c],m=r[l]-i.rects.reference[l],g=se(o),_=g?"y"===l?g.clientHeight||0:g.clientWidth||0:0,b=p/2-m/2,v=h[u],y=_-d[c]-h[f],w=_/2-d[c]/2+b,A=re(v,w,y),E=l;i.modifiersData[n]=((e={})[E]=A,e.centerOffset=A-w,e)}},effect:function(t){var e=t.state,i=t.options.element,n=void 0===i?"[data-popper-arrow]":i;null!=n&&("string"!=typeof n||(n=e.elements.popper.querySelector(n)))&&Jt(e.elements.popper,n)&&(e.elements.arrow=n)},requires:["popperOffsets"],requiresIfExists:["preventOverflow"]};function he(t){return t.split("-")[1]}var de={top:"auto",right:"auto",bottom:"auto",left:"auto"};function ue(t){var e,i=t.popper,n=t.popperRect,s=t.placement,o=t.variation,r=t.offsets,a=t.position,l=t.gpuAcceleration,c=t.adaptive,h=t.roundOffsets,d=t.isFixed,u=r.x,f=void 0===u?0:u,p=r.y,m=void 0===p?0:p,g="function"==typeof h?h({x:f,y:m}):{x:f,y:m};f=g.x,m=g.y;var _=r.hasOwnProperty("x"),b=r.hasOwnProperty("y"),v=_t,y=pt,w=window;if(c){var A=se(i),E="clientHeight",T="clientWidth";A===$t(i)&&"static"!==Zt(A=ee(i)).position&&"absolute"===a&&(E="scrollHeight",T="scrollWidth"),(s===pt||(s===_t||s===gt)&&o===wt)&&(y=mt,m-=(d&&A===w&&w.visualViewport?w.visualViewport.height:A[E])-n.height,m*=l?1:-1),s!==_t&&(s!==pt&&s!==mt||o!==wt)||(v=gt,f-=(d&&A===w&&w.visualViewport?w.visualViewport.width:A[T])-n.width,f*=l?1:-1)}var C,O=Object.assign({position:a},c&&de),x=!0===h?function(t,e){var i=t.x,n=t.y,s=e.devicePixelRatio||1;return{x:Qt(i*s)/s||0,y:Qt(n*s)/s||0}}({x:f,y:m},$t(i)):{x:f,y:m};return f=x.x,m=x.y,l?Object.assign({},O,((C={})[y]=b?"0":"",C[v]=_?"0":"",C.transform=(w.devicePixelRatio||1)<=1?"translate("+f+"px, "+m+"px)":"translate3d("+f+"px, "+m+"px, 0)",C)):Object.assign({},O,((e={})[y]=b?m+"px":"",e[v]=_?f+"px":"",e.transform="",e))}const fe={name:"computeStyles",enabled:!0,phase:"beforeWrite",fn:function(t){var e=t.state,i=t.options,n=i.gpuAcceleration,s=void 0===n||n,o=i.adaptive,r=void 0===o||o,a=i.roundOffsets,l=void 0===a||a,c={placement:qt(e.placement),variation:he(e.placement),popper:e.elements.popper,popperRect:e.rects.popper,gpuAcceleration:s,isFixed:"fixed"===e.options.strategy};null!=e.modifiersData.popperOffsets&&(e.styles.popper=Object.assign({},e.styles.popper,ue(Object.assign({},c,{offsets:e.modifiersData.popperOffsets,position:e.options.strategy,adaptive:r,roundOffsets:l})))),null!=e.modifiersData.arrow&&(e.styles.arrow=Object.assign({},e.styles.arrow,ue(Object.assign({},c,{offsets:e.modifiersData.arrow,position:"absolute",adaptive:!1,roundOffsets:l})))),e.attributes.popper=Object.assign({},e.attributes.popper,{"data-popper-placement":e.placement})},data:{}};var pe={passive:!0};const me={name:"eventListeners",enabled:!0,phase:"write",fn:function(){},effect:function(t){var e=t.state,i=t.instance,n=t.options,s=n.scroll,o=void 0===s||s,r=n.resize,a=void 0===r||r,l=$t(e.elements.popper),c=[].concat(e.scrollParents.reference,e.scrollParents.popper);return o&&c.forEach((function(t){t.addEventListener("scroll",i.update,pe)})),a&&l.addEventListener("resize",i.update,pe),function(){o&&c.forEach((function(t){t.removeEventListener("scroll",i.update,pe)})),a&&l.removeEventListener("resize",i.update,pe)}},data:{}};var ge={left:"right",right:"left",bottom:"top",top:"bottom"};function _e(t){return t.replace(/left|right|bottom|top/g,(function(t){return ge[t]}))}var be={start:"end",end:"start"};function ve(t){return t.replace(/start|end/g,(function(t){return be[t]}))}function ye(t){var e=$t(t);return{scrollLeft:e.pageXOffset,scrollTop:e.pageYOffset}}function we(t){return Ut(ee(t)).left+ye(t).scrollLeft}function Ae(t){var e=Zt(t),i=e.overflow,n=e.overflowX,s=e.overflowY;return/auto|scroll|overlay|hidden/.test(i+s+n)}function Ee(t){return["html","body","#document"].indexOf(Ht(t))>=0?t.ownerDocument.body:Bt(t)&&Ae(t)?t:Ee(ie(t))}function Te(t,e){var i;void 0===e&&(e=[]);var n=Ee(t),s=n===(null==(i=t.ownerDocument)?void 0:i.body),o=$t(n),r=s?[o].concat(o.visualViewport||[],Ae(n)?n:[]):n,a=e.concat(r);return s?a:a.concat(Te(ie(r)))}function Ce(t){return Object.assign({},t,{left:t.x,top:t.y,right:t.x+t.width,bottom:t.y+t.height})}function Oe(t,e,i){return e===Et?Ce(function(t,e){var i=$t(t),n=ee(t),s=i.visualViewport,o=n.clientWidth,r=n.clientHeight,a=0,l=0;if(s){o=s.width,r=s.height;var c=Yt();(c||!c&&"fixed"===e)&&(a=s.offsetLeft,l=s.offsetTop)}return{width:o,height:r,x:a+we(t),y:l}}(t,i)):Wt(e)?function(t,e){var i=Ut(t,!1,"fixed"===e);return i.top=i.top+t.clientTop,i.left=i.left+t.clientLeft,i.bottom=i.top+t.clientHeight,i.right=i.left+t.clientWidth,i.width=t.clientWidth,i.height=t.clientHeight,i.x=i.left,i.y=i.top,i}(e,i):Ce(function(t){var e,i=ee(t),n=ye(t),s=null==(e=t.ownerDocument)?void 0:e.body,o=Vt(i.scrollWidth,i.clientWidth,s?s.scrollWidth:0,s?s.clientWidth:0),r=Vt(i.scrollHeight,i.clientHeight,s?s.scrollHeight:0,s?s.clientHeight:0),a=-n.scrollLeft+we(t),l=-n.scrollTop;return"rtl"===Zt(s||i).direction&&(a+=Vt(i.clientWidth,s?s.clientWidth:0)-o),{width:o,height:r,x:a,y:l}}(ee(t)))}function xe(t){var e,i=t.reference,n=t.element,s=t.placement,o=s?qt(s):null,r=s?he(s):null,a=i.x+i.width/2-n.width/2,l=i.y+i.height/2-n.height/2;switch(o){case pt:e={x:a,y:i.y-n.height};break;case mt:e={x:a,y:i.y+i.height};break;case gt:e={x:i.x+i.width,y:l};break;case _t:e={x:i.x-n.width,y:l};break;default:e={x:i.x,y:i.y}}var c=o?oe(o):null;if(null!=c){var h="y"===c?"height":"width";switch(r){case yt:e[c]=e[c]-(i[h]/2-n[h]/2);break;case wt:e[c]=e[c]+(i[h]/2-n[h]/2)}}return e}function ke(t,e){void 0===e&&(e={});var i=e,n=i.placement,s=void 0===n?t.placement:n,o=i.strategy,r=void 0===o?t.strategy:o,a=i.boundary,l=void 0===a?At:a,c=i.rootBoundary,h=void 0===c?Et:c,d=i.elementContext,u=void 0===d?Tt:d,f=i.altBoundary,p=void 0!==f&&f,m=i.padding,g=void 0===m?0:m,_=ae("number"!=typeof g?g:le(g,vt)),b=u===Tt?Ct:Tt,v=t.rects.popper,y=t.elements[p?b:u],w=function(t,e,i,n){var s="clippingParents"===e?function(t){var e=Te(ie(t)),i=["absolute","fixed"].indexOf(Zt(t).position)>=0&&Bt(t)?se(t):t;return Wt(i)?e.filter((function(t){return Wt(t)&&Jt(t,i)&&"body"!==Ht(t)})):[]}(t):[].concat(e),o=[].concat(s,[i]),r=o[0],a=o.reduce((function(e,i){var s=Oe(t,i,n);return e.top=Vt(s.top,e.top),e.right=Kt(s.right,e.right),e.bottom=Kt(s.bottom,e.bottom),e.left=Vt(s.left,e.left),e}),Oe(t,r,n));return a.width=a.right-a.left,a.height=a.bottom-a.top,a.x=a.left,a.y=a.top,a}(Wt(y)?y:y.contextElement||ee(t.elements.popper),l,h,r),A=Ut(t.elements.reference),E=xe({reference:A,element:v,strategy:"absolute",placement:s}),T=Ce(Object.assign({},v,E)),C=u===Tt?T:A,O={top:w.top-C.top+_.top,bottom:C.bottom-w.bottom+_.bottom,left:w.left-C.left+_.left,right:C.right-w.right+_.right},x=t.modifiersData.offset;if(u===Tt&&x){var k=x[s];Object.keys(O).forEach((function(t){var e=[gt,mt].indexOf(t)>=0?1:-1,i=[pt,mt].indexOf(t)>=0?"y":"x";O[t]+=k[i]*e}))}return O}function Le(t,e){void 0===e&&(e={});var i=e,n=i.placement,s=i.boundary,o=i.rootBoundary,r=i.padding,a=i.flipVariations,l=i.allowedAutoPlacements,c=void 0===l?xt:l,h=he(n),d=h?a?Ot:Ot.filter((function(t){return he(t)===h})):vt,u=d.filter((function(t){return c.indexOf(t)>=0}));0===u.length&&(u=d);var f=u.reduce((function(e,i){return e[i]=ke(t,{placement:i,boundary:s,rootBoundary:o,padding:r})[qt(i)],e}),{});return Object.keys(f).sort((function(t,e){return f[t]-f[e]}))}const Se={name:"flip",enabled:!0,phase:"main",fn:function(t){var e=t.state,i=t.options,n=t.name;if(!e.modifiersData[n]._skip){for(var s=i.mainAxis,o=void 0===s||s,r=i.altAxis,a=void 0===r||r,l=i.fallbackPlacements,c=i.padding,h=i.boundary,d=i.rootBoundary,u=i.altBoundary,f=i.flipVariations,p=void 0===f||f,m=i.allowedAutoPlacements,g=e.options.placement,_=qt(g),b=l||(_!==g&&p?function(t){if(qt(t)===bt)return[];var e=_e(t);return[ve(t),e,ve(e)]}(g):[_e(g)]),v=[g].concat(b).reduce((function(t,i){return t.concat(qt(i)===bt?Le(e,{placement:i,boundary:h,rootBoundary:d,padding:c,flipVariations:p,allowedAutoPlacements:m}):i)}),[]),y=e.rects.reference,w=e.rects.popper,A=new Map,E=!0,T=v[0],C=0;C<v.length;C++){var O=v[C],x=qt(O),k=he(O)===yt,L=[pt,mt].indexOf(x)>=0,S=L?"width":"height",D=ke(e,{placement:O,boundary:h,rootBoundary:d,altBoundary:u,padding:c}),I=L?k?gt:_t:k?mt:pt;y[S]>w[S]&&(I=_e(I));var N=_e(I),P=[];if(o&&P.push(D[x]<=0),a&&P.push(D[I]<=0,D[N]<=0),P.every((function(t){return t}))){T=O,E=!1;break}A.set(O,P)}if(E)for(var j=function(t){var e=v.find((function(e){var i=A.get(e);if(i)return i.slice(0,t).every((function(t){return t}))}));if(e)return T=e,"break"},M=p?3:1;M>0&&"break"!==j(M);M--);e.placement!==T&&(e.modifiersData[n]._skip=!0,e.placement=T,e.reset=!0)}},requiresIfExists:["offset"],data:{_skip:!1}};function De(t,e,i){return void 0===i&&(i={x:0,y:0}),{top:t.top-e.height-i.y,right:t.right-e.width+i.x,bottom:t.bottom-e.height+i.y,left:t.left-e.width-i.x}}function Ie(t){return[pt,gt,mt,_t].some((function(e){return t[e]>=0}))}const Ne={name:"hide",enabled:!0,phase:"main",requiresIfExists:["preventOverflow"],fn:function(t){var e=t.state,i=t.name,n=e.rects.reference,s=e.rects.popper,o=e.modifiersData.preventOverflow,r=ke(e,{elementContext:"reference"}),a=ke(e,{altBoundary:!0}),l=De(r,n),c=De(a,s,o),h=Ie(l),d=Ie(c);e.modifiersData[i]={referenceClippingOffsets:l,popperEscapeOffsets:c,isReferenceHidden:h,hasPopperEscaped:d},e.attributes.popper=Object.assign({},e.attributes.popper,{"data-popper-reference-hidden":h,"data-popper-escaped":d})}},Pe={name:"offset",enabled:!0,phase:"main",requires:["popperOffsets"],fn:function(t){var e=t.state,i=t.options,n=t.name,s=i.offset,o=void 0===s?[0,0]:s,r=xt.reduce((function(t,i){return t[i]=function(t,e,i){var n=qt(t),s=[_t,pt].indexOf(n)>=0?-1:1,o="function"==typeof i?i(Object.assign({},e,{placement:t})):i,r=o[0],a=o[1];return r=r||0,a=(a||0)*s,[_t,gt].indexOf(n)>=0?{x:a,y:r}:{x:r,y:a}}(i,e.rects,o),t}),{}),a=r[e.placement],l=a.x,c=a.y;null!=e.modifiersData.popperOffsets&&(e.modifiersData.popperOffsets.x+=l,e.modifiersData.popperOffsets.y+=c),e.modifiersData[n]=r}},je={name:"popperOffsets",enabled:!0,phase:"read",fn:function(t){var e=t.state,i=t.name;e.modifiersData[i]=xe({reference:e.rects.reference,element:e.rects.popper,strategy:"absolute",placement:e.placement})},data:{}},Me={name:"preventOverflow",enabled:!0,phase:"main",fn:function(t){var e=t.state,i=t.options,n=t.name,s=i.mainAxis,o=void 0===s||s,r=i.altAxis,a=void 0!==r&&r,l=i.boundary,c=i.rootBoundary,h=i.altBoundary,d=i.padding,u=i.tether,f=void 0===u||u,p=i.tetherOffset,m=void 0===p?0:p,g=ke(e,{boundary:l,rootBoundary:c,padding:d,altBoundary:h}),_=qt(e.placement),b=he(e.placement),v=!b,y=oe(_),w="x"===y?"y":"x",A=e.modifiersData.popperOffsets,E=e.rects.reference,T=e.rects.popper,C="function"==typeof m?m(Object.assign({},e.rects,{placement:e.placement})):m,O="number"==typeof C?{mainAxis:C,altAxis:C}:Object.assign({mainAxis:0,altAxis:0},C),x=e.modifiersData.offset?e.modifiersData.offset[e.placement]:null,k={x:0,y:0};if(A){if(o){var L,S="y"===y?pt:_t,D="y"===y?mt:gt,I="y"===y?"height":"width",N=A[y],P=N+g[S],j=N-g[D],M=f?-T[I]/2:0,F=b===yt?E[I]:T[I],H=b===yt?-T[I]:-E[I],$=e.elements.arrow,W=f&&$?Gt($):{width:0,height:0},B=e.modifiersData["arrow#persistent"]?e.modifiersData["arrow#persistent"].padding:{top:0,right:0,bottom:0,left:0},z=B[S],R=B[D],q=re(0,E[I],W[I]),V=v?E[I]/2-M-q-z-O.mainAxis:F-q-z-O.mainAxis,K=v?-E[I]/2+M+q+R+O.mainAxis:H+q+R+O.mainAxis,Q=e.elements.arrow&&se(e.elements.arrow),X=Q?"y"===y?Q.clientTop||0:Q.clientLeft||0:0,Y=null!=(L=null==x?void 0:x[y])?L:0,U=N+K-Y,G=re(f?Kt(P,N+V-Y-X):P,N,f?Vt(j,U):j);A[y]=G,k[y]=G-N}if(a){var J,Z="x"===y?pt:_t,tt="x"===y?mt:gt,et=A[w],it="y"===w?"height":"width",nt=et+g[Z],st=et-g[tt],ot=-1!==[pt,_t].indexOf(_),rt=null!=(J=null==x?void 0:x[w])?J:0,at=ot?nt:et-E[it]-T[it]-rt+O.altAxis,lt=ot?et+E[it]+T[it]-rt-O.altAxis:st,ct=f&&ot?function(t,e,i){var n=re(t,e,i);return n>i?i:n}(at,et,lt):re(f?at:nt,et,f?lt:st);A[w]=ct,k[w]=ct-et}e.modifiersData[n]=k}},requiresIfExists:["offset"]};function Fe(t,e,i){void 0===i&&(i=!1);var n,s,o=Bt(e),r=Bt(e)&&function(t){var e=t.getBoundingClientRect(),i=Qt(e.width)/t.offsetWidth||1,n=Qt(e.height)/t.offsetHeight||1;return 1!==i||1!==n}(e),a=ee(e),l=Ut(t,r,i),c={scrollLeft:0,scrollTop:0},h={x:0,y:0};return(o||!o&&!i)&&(("body"!==Ht(e)||Ae(a))&&(c=(n=e)!==$t(n)&&Bt(n)?{scrollLeft:(s=n).scrollLeft,scrollTop:s.scrollTop}:ye(n)),Bt(e)?((h=Ut(e,!0)).x+=e.clientLeft,h.y+=e.clientTop):a&&(h.x=we(a))),{x:l.left+c.scrollLeft-h.x,y:l.top+c.scrollTop-h.y,width:l.width,height:l.height}}function He(t){var e=new Map,i=new Set,n=[];function s(t){i.add(t.name),[].concat(t.requires||[],t.requiresIfExists||[]).forEach((function(t){if(!i.has(t)){var n=e.get(t);n&&s(n)}})),n.push(t)}return t.forEach((function(t){e.set(t.name,t)})),t.forEach((function(t){i.has(t.name)||s(t)})),n}var $e={placement:"bottom",modifiers:[],strategy:"absolute"};function We(){for(var t=arguments.length,e=new Array(t),i=0;i<t;i++)e[i]=arguments[i];return!e.some((function(t){return!(t&&"function"==typeof t.getBoundingClientRect)}))}function Be(t){void 0===t&&(t={});var e=t,i=e.defaultModifiers,n=void 0===i?[]:i,s=e.defaultOptions,o=void 0===s?$e:s;return function(t,e,i){void 0===i&&(i=o);var s,r,a={placement:"bottom",orderedModifiers:[],options:Object.assign({},$e,o),modifiersData:{},elements:{reference:t,popper:e},attributes:{},styles:{}},l=[],c=!1,h={state:a,setOptions:function(i){var s="function"==typeof i?i(a.options):i;d(),a.options=Object.assign({},o,a.options,s),a.scrollParents={reference:Wt(t)?Te(t):t.contextElement?Te(t.contextElement):[],popper:Te(e)};var r,c,u=function(t){var e=He(t);return Ft.reduce((function(t,i){return t.concat(e.filter((function(t){return t.phase===i})))}),[])}((r=[].concat(n,a.options.modifiers),c=r.reduce((function(t,e){var i=t[e.name];return t[e.name]=i?Object.assign({},i,e,{options:Object.assign({},i.options,e.options),data:Object.assign({},i.data,e.data)}):e,t}),{}),Object.keys(c).map((function(t){return c[t]}))));return a.orderedModifiers=u.filter((function(t){return t.enabled})),a.orderedModifiers.forEach((function(t){var e=t.name,i=t.options,n=void 0===i?{}:i,s=t.effect;if("function"==typeof s){var o=s({state:a,name:e,instance:h,options:n});l.push(o||function(){})}})),h.update()},forceUpdate:function(){if(!c){var t=a.elements,e=t.reference,i=t.popper;if(We(e,i)){a.rects={reference:Fe(e,se(i),"fixed"===a.options.strategy),popper:Gt(i)},a.reset=!1,a.placement=a.options.placement,a.orderedModifiers.forEach((function(t){return a.modifiersData[t.name]=Object.assign({},t.data)}));for(var n=0;n<a.orderedModifiers.length;n++)if(!0!==a.reset){var s=a.orderedModifiers[n],o=s.fn,r=s.options,l=void 0===r?{}:r,d=s.name;"function"==typeof o&&(a=o({state:a,options:l,name:d,instance:h})||a)}else a.reset=!1,n=-1}}},update:(s=function(){return new Promise((function(t){h.forceUpdate(),t(a)}))},function(){return r||(r=new Promise((function(t){Promise.resolve().then((function(){r=void 0,t(s())}))}))),r}),destroy:function(){d(),c=!0}};if(!We(t,e))return h;function d(){l.forEach((function(t){return t()})),l=[]}return h.setOptions(i).then((function(t){!c&&i.onFirstUpdate&&i.onFirstUpdate(t)})),h}}var ze=Be(),Re=Be({defaultModifiers:[me,je,fe,Rt]}),qe=Be({defaultModifiers:[me,je,fe,Rt,Pe,Se,Me,ce,Ne]});const Ve=Object.freeze(Object.defineProperty({__proto__:null,afterMain:Nt,afterRead:St,afterWrite:Mt,applyStyles:Rt,arrow:ce,auto:bt,basePlacements:vt,beforeMain:Dt,beforeRead:kt,beforeWrite:Pt,bottom:mt,clippingParents:At,computeStyles:fe,createPopper:qe,createPopperBase:ze,createPopperLite:Re,detectOverflow:ke,end:wt,eventListeners:me,flip:Se,hide:Ne,left:_t,main:It,modifierPhases:Ft,offset:Pe,placements:xt,popper:Tt,popperGenerator:Be,popperOffsets:je,preventOverflow:Me,read:Lt,reference:Ct,right:gt,start:yt,top:pt,variationPlacements:Ot,viewport:Et,write:jt},Symbol.toStringTag,{value:"Module"})),Ke="dropdown",Qe="ArrowUp",Xe="ArrowDown",Ye="click.bs.dropdown.data-api",Ue="keydown.bs.dropdown.data-api",Ge="show",Je='[data-bs-toggle="dropdown"]:not(.disabled):not(:disabled)',Ze=`${Je}.show`,ti=".dropdown-menu",ei=p()?"top-end":"top-start",ii=p()?"top-start":"top-end",ni=p()?"bottom-end":"bottom-start",si=p()?"bottom-start":"bottom-end",oi=p()?"left-start":"right-start",ri=p()?"right-start":"left-start",ai={autoClose:!0,boundary:"clippingParents",display:"dynamic",offset:[0,2],popperConfig:null,reference:"toggle"},li={autoClose:"(boolean|string)",boundary:"(string|element)",display:"string",offset:"(array|string|function)",popperConfig:"(null|object|function)",reference:"(string|element|object)"};class ci extends W{constructor(t,e){super(t,e),this._popper=null,this._parent=this._element.parentNode,this._menu=z.next(this._element,ti)[0]||z.prev(this._element,ti)[0]||z.findOne(ti,this._parent),this._inNavbar=this._detectNavbar()}static get Default(){return ai}static get DefaultType(){return li}static get NAME(){return Ke}toggle(){return this._isShown()?this.hide():this.show()}show(){if(l(this._element)||this._isShown())return;const t={relatedTarget:this._element};if(!P.trigger(this._element,"show.bs.dropdown",t).defaultPrevented){if(this._createPopper(),"ontouchstart"in document.documentElement&&!this._parent.closest(".navbar-nav"))for(const t of[].concat(...document.body.children))P.on(t,"mouseover",h);this._element.focus(),this._element.setAttribute("aria-expanded",!0),this._menu.classList.add(Ge),this._element.classList.add(Ge),P.trigger(this._element,"shown.bs.dropdown",t)}}hide(){if(l(this._element)||!this._isShown())return;const t={relatedTarget:this._element};this._completeHide(t)}dispose(){this._popper&&this._popper.destroy(),super.dispose()}update(){this._inNavbar=this._detectNavbar(),this._popper&&this._popper.update()}_completeHide(t){if(!P.trigger(this._element,"hide.bs.dropdown",t).defaultPrevented){if("ontouchstart"in document.documentElement)for(const t of[].concat(...document.body.children))P.off(t,"mouseover",h);this._popper&&this._popper.destroy(),this._menu.classList.remove(Ge),this._element.classList.remove(Ge),this._element.setAttribute("aria-expanded","false"),H.removeDataAttribute(this._menu,"popper"),P.trigger(this._element,"hidden.bs.dropdown",t)}}_getConfig(t){if("object"==typeof(t=super._getConfig(t)).reference&&!o(t.reference)&&"function"!=typeof t.reference.getBoundingClientRect)throw new TypeError(`${Ke.toUpperCase()}: Option "reference" provided type "object" without a required "getBoundingClientRect" method.`);return t}_createPopper(){if(void 0===Ve)throw new TypeError("Bootstrap's dropdowns require Popper (https://popper.js.org)");let t=this._element;"parent"===this._config.reference?t=this._parent:o(this._config.reference)?t=r(this._config.reference):"object"==typeof this._config.reference&&(t=this._config.reference);const e=this._getPopperConfig();this._popper=qe(t,this._menu,e)}_isShown(){return this._menu.classList.contains(Ge)}_getPlacement(){const t=this._parent;if(t.classList.contains("dropend"))return oi;if(t.classList.contains("dropstart"))return ri;if(t.classList.contains("dropup-center"))return"top";if(t.classList.contains("dropdown-center"))return"bottom";const e="end"===getComputedStyle(this._menu).getPropertyValue("--bs-position").trim();return t.classList.contains("dropup")?e?ii:ei:e?si:ni}_detectNavbar(){return null!==this._element.closest(".navbar")}_getOffset(){const{offset:t}=this._config;return"string"==typeof t?t.split(",").map((t=>Number.parseInt(t,10))):"function"==typeof t?e=>t(e,this._element):t}_getPopperConfig(){const t={placement:this._getPlacement(),modifiers:[{name:"preventOverflow",options:{boundary:this._config.boundary}},{name:"offset",options:{offset:this._getOffset()}}]};return(this._inNavbar||"static"===this._config.display)&&(H.setDataAttribute(this._menu,"popper","static"),t.modifiers=[{name:"applyStyles",enabled:!1}]),{...t,...g(this._config.popperConfig,[t])}}_selectMenuItem({key:t,target:e}){const i=z.find(".dropdown-menu .dropdown-item:not(.disabled):not(:disabled)",this._menu).filter((t=>a(t)));i.length&&b(i,e,t===Xe,!i.includes(e)).focus()}static jQueryInterface(t){return this.each((function(){const e=ci.getOrCreateInstance(this,t);if("string"==typeof t){if(void 0===e[t])throw new TypeError(`No method named "${t}"`);e[t]()}}))}static clearMenus(t){if(2===t.button||"keyup"===t.type&&"Tab"!==t.key)return;const e=z.find(Ze);for(const i of e){const e=ci.getInstance(i);if(!e||!1===e._config.autoClose)continue;const n=t.composedPath(),s=n.includes(e._menu);if(n.includes(e._element)||"inside"===e._config.autoClose&&!s||"outside"===e._config.autoClose&&s)continue;if(e._menu.contains(t.target)&&("keyup"===t.type&&"Tab"===t.key||/input|select|option|textarea|form/i.test(t.target.tagName)))continue;const o={relatedTarget:e._element};"click"===t.type&&(o.clickEvent=t),e._completeHide(o)}}static dataApiKeydownHandler(t){const e=/input|textarea/i.test(t.target.tagName),i="Escape"===t.key,n=[Qe,Xe].includes(t.key);if(!n&&!i)return;if(e&&!i)return;t.preventDefault();const s=this.matches(Je)?this:z.prev(this,Je)[0]||z.next(this,Je)[0]||z.findOne(Je,t.delegateTarget.parentNode),o=ci.getOrCreateInstance(s);if(n)return t.stopPropagation(),o.show(),void o._selectMenuItem(t);o._isShown()&&(t.stopPropagation(),o.hide(),s.focus())}}P.on(document,Ue,Je,ci.dataApiKeydownHandler),P.on(document,Ue,ti,ci.dataApiKeydownHandler),P.on(document,Ye,ci.clearMenus),P.on(document,"keyup.bs.dropdown.data-api",ci.clearMenus),P.on(document,Ye,Je,(function(t){t.preventDefault(),ci.getOrCreateInstance(this).toggle()})),m(ci);const hi="show",di="mousedown.bs.backdrop",ui={className:"modal-backdrop",clickCallback:null,isAnimated:!1,isVisible:!0,rootElement:"body"},fi={className:"string",clickCallback:"(function|null)",isAnimated:"boolean",isVisible:"boolean",rootElement:"(element|string)"};class pi extends ${constructor(t){super(),this._config=this._getConfig(t),this._isAppended=!1,this._element=null}static get Default(){return ui}static get DefaultType(){return fi}static get NAME(){return"backdrop"}show(t){if(!this._config.isVisible)return void g(t);this._append();const e=this._getElement();this._config.isAnimated&&d(e),e.classList.add(hi),this._emulateAnimation((()=>{g(t)}))}hide(t){this._config.isVisible?(this._getElement().classList.remove(hi),this._emulateAnimation((()=>{this.dispose(),g(t)}))):g(t)}dispose(){this._isAppended&&(P.off(this._element,di),this._element.remove(),this._isAppended=!1)}_getElement(){if(!this._element){const t=document.createElement("div");t.className=this._config.className,this._config.isAnimated&&t.classList.add("fade"),this._element=t}return this._element}_configAfterMerge(t){return t.rootElement=r(t.rootElement),t}_append(){if(this._isAppended)return;const t=this._getElement();this._config.rootElement.append(t),P.on(t,di,(()=>{g(this._config.clickCallback)})),this._isAppended=!0}_emulateAnimation(t){_(t,this._getElement(),this._config.isAnimated)}}const mi=".bs.focustrap",gi="backward",_i={autofocus:!0,trapElement:null},bi={autofocus:"boolean",trapElement:"element"};class vi extends ${constructor(t){super(),this._config=this._getConfig(t),this._isActive=!1,this._lastTabNavDirection=null}static get Default(){return _i}static get DefaultType(){return bi}static get NAME(){return"focustrap"}activate(){this._isActive||(this._config.autofocus&&this._config.trapElement.focus(),P.off(document,mi),P.on(document,"focusin.bs.focustrap",(t=>this._handleFocusin(t))),P.on(document,"keydown.tab.bs.focustrap",(t=>this._handleKeydown(t))),this._isActive=!0)}deactivate(){this._isActive&&(this._isActive=!1,P.off(document,mi))}_handleFocusin(t){const{trapElement:e}=this._config;if(t.target===document||t.target===e||e.contains(t.target))return;const i=z.focusableChildren(e);0===i.length?e.focus():this._lastTabNavDirection===gi?i[i.length-1].focus():i[0].focus()}_handleKeydown(t){"Tab"===t.key&&(this._lastTabNavDirection=t.shiftKey?gi:"forward")}}const yi=".fixed-top, .fixed-bottom, .is-fixed, .sticky-top",wi=".sticky-top",Ai="padding-right",Ei="margin-right";class Ti{constructor(){this._element=document.body}getWidth(){const t=document.documentElement.clientWidth;return Math.abs(window.innerWidth-t)}hide(){const t=this.getWidth();this._disableOverFlow(),this._setElementAttributes(this._element,Ai,(e=>e+t)),this._setElementAttributes(yi,Ai,(e=>e+t)),this._setElementAttributes(wi,Ei,(e=>e-t))}reset(){this._resetElementAttributes(this._element,"overflow"),this._resetElementAttributes(this._element,Ai),this._resetElementAttributes(yi,Ai),this._resetElementAttributes(wi,Ei)}isOverflowing(){return this.getWidth()>0}_disableOverFlow(){this._saveInitialAttribute(this._element,"overflow"),this._element.style.overflow="hidden"}_setElementAttributes(t,e,i){const n=this.getWidth();this._applyManipulationCallback(t,(t=>{if(t!==this._element&&window.innerWidth>t.clientWidth+n)return;this._saveInitialAttribute(t,e);const s=window.getComputedStyle(t).getPropertyValue(e);t.style.setProperty(e,`${i(Number.parseFloat(s))}px`)}))}_saveInitialAttribute(t,e){const i=t.style.getPropertyValue(e);i&&H.setDataAttribute(t,e,i)}_resetElementAttributes(t,e){this._applyManipulationCallback(t,(t=>{const i=H.getDataAttribute(t,e);null!==i?(H.removeDataAttribute(t,e),t.style.setProperty(e,i)):t.style.removeProperty(e)}))}_applyManipulationCallback(t,e){if(o(t))e(t);else for(const i of z.find(t,this._element))e(i)}}const Ci=".bs.modal",Oi="hidden.bs.modal",xi="show.bs.modal",ki="modal-open",Li="show",Si="modal-static",Di={backdrop:!0,focus:!0,keyboard:!0},Ii={backdrop:"(boolean|string)",focus:"boolean",keyboard:"boolean"};class Ni extends W{constructor(t,e){super(t,e),this._dialog=z.findOne(".modal-dialog",this._element),this._backdrop=this._initializeBackDrop(),this._focustrap=this._initializeFocusTrap(),this._isShown=!1,this._isTransitioning=!1,this._scrollBar=new Ti,this._addEventListeners()}static get Default(){return Di}static get DefaultType(){return Ii}static get NAME(){return"modal"}toggle(t){return this._isShown?this.hide():this.show(t)}show(t){this._isShown||this._isTransitioning||P.trigger(this._element,xi,{relatedTarget:t}).defaultPrevented||(this._isShown=!0,this._isTransitioning=!0,this._scrollBar.hide(),document.body.classList.add(ki),this._adjustDialog(),this._backdrop.show((()=>this._showElement(t))))}hide(){this._isShown&&!this._isTransitioning&&(P.trigger(this._element,"hide.bs.modal").defaultPrevented||(this._isShown=!1,this._isTransitioning=!0,this._focustrap.deactivate(),this._element.classList.remove(Li),this._queueCallback((()=>this._hideModal()),this._element,this._isAnimated())))}dispose(){P.off(window,Ci),P.off(this._dialog,Ci),this._backdrop.dispose(),this._focustrap.deactivate(),super.dispose()}handleUpdate(){this._adjustDialog()}_initializeBackDrop(){return new pi({isVisible:Boolean(this._config.backdrop),isAnimated:this._isAnimated()})}_initializeFocusTrap(){return new vi({trapElement:this._element})}_showElement(t){document.body.contains(this._element)||document.body.append(this._element),this._element.style.display="block",this._element.removeAttribute("aria-hidden"),this._element.setAttribute("aria-modal",!0),this._element.setAttribute("role","dialog"),this._element.scrollTop=0;const e=z.findOne(".modal-body",this._dialog);e&&(e.scrollTop=0),d(this._element),this._element.classList.add(Li),this._queueCallback((()=>{this._config.focus&&this._focustrap.activate(),this._isTransitioning=!1,P.trigger(this._element,"shown.bs.modal",{relatedTarget:t})}),this._dialog,this._isAnimated())}_addEventListeners(){P.on(this._element,"keydown.dismiss.bs.modal",(t=>{"Escape"===t.key&&(this._config.keyboard?this.hide():this._triggerBackdropTransition())})),P.on(window,"resize.bs.modal",(()=>{this._isShown&&!this._isTransitioning&&this._adjustDialog()})),P.on(this._element,"mousedown.dismiss.bs.modal",(t=>{P.one(this._element,"click.dismiss.bs.modal",(e=>{this._element===t.target&&this._element===e.target&&("static"!==this._config.backdrop?this._config.backdrop&&this.hide():this._triggerBackdropTransition())}))}))}_hideModal(){this._element.style.display="none",this._element.setAttribute("aria-hidden",!0),this._element.removeAttribute("aria-modal"),this._element.removeAttribute("role"),this._isTransitioning=!1,this._backdrop.hide((()=>{document.body.classList.remove(ki),this._resetAdjustments(),this._scrollBar.reset(),P.trigger(this._element,Oi)}))}_isAnimated(){return this._element.classList.contains("fade")}_triggerBackdropTransition(){if(P.trigger(this._element,"hidePrevented.bs.modal").defaultPrevented)return;const t=this._element.scrollHeight>document.documentElement.clientHeight,e=this._element.style.overflowY;"hidden"===e||this._element.classList.contains(Si)||(t||(this._element.style.overflowY="hidden"),this._element.classList.add(Si),this._queueCallback((()=>{this._element.classList.remove(Si),this._queueCallback((()=>{this._element.style.overflowY=e}),this._dialog)}),this._dialog),this._element.focus())}_adjustDialog(){const t=this._element.scrollHeight>document.documentElement.clientHeight,e=this._scrollBar.getWidth(),i=e>0;if(i&&!t){const t=p()?"paddingLeft":"paddingRight";this._element.style[t]=`${e}px`}if(!i&&t){const t=p()?"paddingRight":"paddingLeft";this._element.style[t]=`${e}px`}}_resetAdjustments(){this._element.style.paddingLeft="",this._element.style.paddingRight=""}static jQueryInterface(t,e){return this.each((function(){const i=Ni.getOrCreateInstance(this,t);if("string"==typeof t){if(void 0===i[t])throw new TypeError(`No method named "${t}"`);i[t](e)}}))}}P.on(document,"click.bs.modal.data-api",'[data-bs-toggle="modal"]',(function(t){const e=z.getElementFromSelector(this);["A","AREA"].includes(this.tagName)&&t.preventDefault(),P.one(e,xi,(t=>{t.defaultPrevented||P.one(e,Oi,(()=>{a(this)&&this.focus()}))}));const i=z.findOne(".modal.show");i&&Ni.getInstance(i).hide(),Ni.getOrCreateInstance(e).toggle(this)})),R(Ni),m(Ni);const Pi="show",ji="showing",Mi="hiding",Fi=".offcanvas.show",Hi="hidePrevented.bs.offcanvas",$i="hidden.bs.offcanvas",Wi={backdrop:!0,keyboard:!0,scroll:!1},Bi={backdrop:"(boolean|string)",keyboard:"boolean",scroll:"boolean"};class zi extends W{constructor(t,e){super(t,e),this._isShown=!1,this._backdrop=this._initializeBackDrop(),this._focustrap=this._initializeFocusTrap(),this._addEventListeners()}static get Default(){return Wi}static get DefaultType(){return Bi}static get NAME(){return"offcanvas"}toggle(t){return this._isShown?this.hide():this.show(t)}show(t){this._isShown||P.trigger(this._element,"show.bs.offcanvas",{relatedTarget:t}).defaultPrevented||(this._isShown=!0,this._backdrop.show(),this._config.scroll||(new Ti).hide(),this._element.setAttribute("aria-modal",!0),this._element.setAttribute("role","dialog"),this._element.classList.add(ji),this._queueCallback((()=>{this._config.scroll&&!this._config.backdrop||this._focustrap.activate(),this._element.classList.add(Pi),this._element.classList.remove(ji),P.trigger(this._element,"shown.bs.offcanvas",{relatedTarget:t})}),this._element,!0))}hide(){this._isShown&&(P.trigger(this._element,"hide.bs.offcanvas").defaultPrevented||(this._focustrap.deactivate(),this._element.blur(),this._isShown=!1,this._element.classList.add(Mi),this._backdrop.hide(),this._queueCallback((()=>{this._element.classList.remove(Pi,Mi),this._element.removeAttribute("aria-modal"),this._element.removeAttribute("role"),this._config.scroll||(new Ti).reset(),P.trigger(this._element,$i)}),this._element,!0)))}dispose(){this._backdrop.dispose(),this._focustrap.deactivate(),super.dispose()}_initializeBackDrop(){const t=Boolean(this._config.backdrop);return new pi({className:"offcanvas-backdrop",isVisible:t,isAnimated:!0,rootElement:this._element.parentNode,clickCallback:t?()=>{"static"!==this._config.backdrop?this.hide():P.trigger(this._element,Hi)}:null})}_initializeFocusTrap(){return new vi({trapElement:this._element})}_addEventListeners(){P.on(this._element,"keydown.dismiss.bs.offcanvas",(t=>{"Escape"===t.key&&(this._config.keyboard?this.hide():P.trigger(this._element,Hi))}))}static jQueryInterface(t){return this.each((function(){const e=zi.getOrCreateInstance(this,t);if("string"==typeof t){if(void 0===e[t]||t.startsWith("_")||"constructor"===t)throw new TypeError(`No method named "${t}"`);e[t](this)}}))}}P.on(document,"click.bs.offcanvas.data-api",'[data-bs-toggle="offcanvas"]',(function(t){const e=z.getElementFromSelector(this);if(["A","AREA"].includes(this.tagName)&&t.preventDefault(),l(this))return;P.one(e,$i,(()=>{a(this)&&this.focus()}));const i=z.findOne(Fi);i&&i!==e&&zi.getInstance(i).hide(),zi.getOrCreateInstance(e).toggle(this)})),P.on(window,"load.bs.offcanvas.data-api",(()=>{for(const t of z.find(Fi))zi.getOrCreateInstance(t).show()})),P.on(window,"resize.bs.offcanvas",(()=>{for(const t of z.find("[aria-modal][class*=show][class*=offcanvas-]"))"fixed"!==getComputedStyle(t).position&&zi.getOrCreateInstance(t).hide()})),R(zi),m(zi);const Ri=new Set(["background","cite","href","itemtype","longdesc","poster","src","xlink:href"]),qi=/^(?:(?:https?|mailto|ftp|tel|file|sms):|[^#&/:?]*(?:[#/?]|$))/i,Vi=/^data:(?:image\/(?:bmp|gif|jpeg|jpg|png|tiff|webp)|video\/(?:mpeg|mp4|ogg|webm)|audio\/(?:mp3|oga|ogg|opus));base64,[\d+/a-z]+=*$/i,Ki=(t,e)=>{const i=t.nodeName.toLowerCase();return e.includes(i)?!Ri.has(i)||Boolean(qi.test(t.nodeValue)||Vi.test(t.nodeValue)):e.filter((t=>t instanceof RegExp)).some((t=>t.test(i)))},Qi={"*":["class","dir","id","lang","role",/^aria-[\w-]*$/i],a:["target","href","title","rel"],area:[],b:[],br:[],col:[],code:[],div:[],em:[],hr:[],h1:[],h2:[],h3:[],h4:[],h5:[],h6:[],i:[],img:["src","srcset","alt","title","width","height"],li:[],ol:[],p:[],pre:[],s:[],small:[],span:[],sub:[],sup:[],strong:[],u:[],ul:[]},Xi={allowList:Qi,content:{},extraClass:"",html:!1,sanitize:!0,sanitizeFn:null,template:"<div></div>"},Yi={allowList:"object",content:"object",extraClass:"(string|function)",html:"boolean",sanitize:"boolean",sanitizeFn:"(null|function)",template:"string"},Ui={entry:"(string|element|function|null)",selector:"(string|element)"};class Gi extends ${constructor(t){super(),this._config=this._getConfig(t)}static get Default(){return Xi}static get DefaultType(){return Yi}static get NAME(){return"TemplateFactory"}getContent(){return Object.values(this._config.content).map((t=>this._resolvePossibleFunction(t))).filter(Boolean)}hasContent(){return this.getContent().length>0}changeContent(t){return this._checkContent(t),this._config.content={...this._config.content,...t},this}toHtml(){const t=document.createElement("div");t.innerHTML=this._maybeSanitize(this._config.template);for(const[e,i]of Object.entries(this._config.content))this._setContent(t,i,e);const e=t.children[0],i=this._resolvePossibleFunction(this._config.extraClass);return i&&e.classList.add(...i.split(" ")),e}_typeCheckConfig(t){super._typeCheckConfig(t),this._checkContent(t.content)}_checkContent(t){for(const[e,i]of Object.entries(t))super._typeCheckConfig({selector:e,entry:i},Ui)}_setContent(t,e,i){const n=z.findOne(i,t);n&&((e=this._resolvePossibleFunction(e))?o(e)?this._putElementInTemplate(r(e),n):this._config.html?n.innerHTML=this._maybeSanitize(e):n.textContent=e:n.remove())}_maybeSanitize(t){return this._config.sanitize?function(t,e,i){if(!t.length)return t;if(i&&"function"==typeof i)return i(t);const n=(new window.DOMParser).parseFromString(t,"text/html"),s=[].concat(...n.body.querySelectorAll("*"));for(const t of s){const i=t.nodeName.toLowerCase();if(!Object.keys(e).includes(i)){t.remove();continue}const n=[].concat(...t.attributes),s=[].concat(e["*"]||[],e[i]||[]);for(const e of n)Ki(e,s)||t.removeAttribute(e.nodeName)}return n.body.innerHTML}(t,this._config.allowList,this._config.sanitizeFn):t}_resolvePossibleFunction(t){return g(t,[this])}_putElementInTemplate(t,e){if(this._config.html)return e.innerHTML="",void e.append(t);e.textContent=t.textContent}}const Ji=new Set(["sanitize","allowList","sanitizeFn"]),Zi="fade",tn="show",en=".modal",nn="hide.bs.modal",sn="hover",on="focus",rn={AUTO:"auto",TOP:"top",RIGHT:p()?"left":"right",BOTTOM:"bottom",LEFT:p()?"right":"left"},an={allowList:Qi,animation:!0,boundary:"clippingParents",container:!1,customClass:"",delay:0,fallbackPlacements:["top","right","bottom","left"],html:!1,offset:[0,6],placement:"top",popperConfig:null,sanitize:!0,sanitizeFn:null,selector:!1,template:'<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',title:"",trigger:"hover focus"},ln={allowList:"object",animation:"boolean",boundary:"(string|element)",container:"(string|element|boolean)",customClass:"(string|function)",delay:"(number|object)",fallbackPlacements:"array",html:"boolean",offset:"(array|string|function)",placement:"(string|function)",popperConfig:"(null|object|function)",sanitize:"boolean",sanitizeFn:"(null|function)",selector:"(string|boolean)",template:"string",title:"(string|element|function)",trigger:"string"};class cn extends W{constructor(t,e){if(void 0===Ve)throw new TypeError("Bootstrap's tooltips require Popper (https://popper.js.org)");super(t,e),this._isEnabled=!0,this._timeout=0,this._isHovered=null,this._activeTrigger={},this._popper=null,this._templateFactory=null,this._newContent=null,this.tip=null,this._setListeners(),this._config.selector||this._fixTitle()}static get Default(){return an}static get DefaultType(){return ln}static get NAME(){return"tooltip"}enable(){this._isEnabled=!0}disable(){this._isEnabled=!1}toggleEnabled(){this._isEnabled=!this._isEnabled}toggle(){this._isEnabled&&(this._activeTrigger.click=!this._activeTrigger.click,this._isShown()?this._leave():this._enter())}dispose(){clearTimeout(this._timeout),P.off(this._element.closest(en),nn,this._hideModalHandler),this._element.getAttribute("data-bs-original-title")&&this._element.setAttribute("title",this._element.getAttribute("data-bs-original-title")),this._disposePopper(),super.dispose()}show(){if("none"===this._element.style.display)throw new Error("Please use show on visible elements");if(!this._isWithContent()||!this._isEnabled)return;const t=P.trigger(this._element,this.constructor.eventName("show")),e=(c(this._element)||this._element.ownerDocument.documentElement).contains(this._element);if(t.defaultPrevented||!e)return;this._disposePopper();const i=this._getTipElement();this._element.setAttribute("aria-describedby",i.getAttribute("id"));const{container:n}=this._config;if(this._element.ownerDocument.documentElement.contains(this.tip)||(n.append(i),P.trigger(this._element,this.constructor.eventName("inserted"))),this._popper=this._createPopper(i),i.classList.add(tn),"ontouchstart"in document.documentElement)for(const t of[].concat(...document.body.children))P.on(t,"mouseover",h);this._queueCallback((()=>{P.trigger(this._element,this.constructor.eventName("shown")),!1===this._isHovered&&this._leave(),this._isHovered=!1}),this.tip,this._isAnimated())}hide(){if(this._isShown()&&!P.trigger(this._element,this.constructor.eventName("hide")).defaultPrevented){if(this._getTipElement().classList.remove(tn),"ontouchstart"in document.documentElement)for(const t of[].concat(...document.body.children))P.off(t,"mouseover",h);this._activeTrigger.click=!1,this._activeTrigger.focus=!1,this._activeTrigger.hover=!1,this._isHovered=null,this._queueCallback((()=>{this._isWithActiveTrigger()||(this._isHovered||this._disposePopper(),this._element.removeAttribute("aria-describedby"),P.trigger(this._element,this.constructor.eventName("hidden")))}),this.tip,this._isAnimated())}}update(){this._popper&&this._popper.update()}_isWithContent(){return Boolean(this._getTitle())}_getTipElement(){return this.tip||(this.tip=this._createTipElement(this._newContent||this._getContentForTemplate())),this.tip}_createTipElement(t){const e=this._getTemplateFactory(t).toHtml();if(!e)return null;e.classList.remove(Zi,tn),e.classList.add(`bs-${this.constructor.NAME}-auto`);const i=(t=>{do{t+=Math.floor(1e6*Math.random())}while(document.getElementById(t));return t})(this.constructor.NAME).toString();return e.setAttribute("id",i),this._isAnimated()&&e.classList.add(Zi),e}setContent(t){this._newContent=t,this._isShown()&&(this._disposePopper(),this.show())}_getTemplateFactory(t){return this._templateFactory?this._templateFactory.changeContent(t):this._templateFactory=new Gi({...this._config,content:t,extraClass:this._resolvePossibleFunction(this._config.customClass)}),this._templateFactory}_getContentForTemplate(){return{".tooltip-inner":this._getTitle()}}_getTitle(){return this._resolvePossibleFunction(this._config.title)||this._element.getAttribute("data-bs-original-title")}_initializeOnDelegatedTarget(t){return this.constructor.getOrCreateInstance(t.delegateTarget,this._getDelegateConfig())}_isAnimated(){return this._config.animation||this.tip&&this.tip.classList.contains(Zi)}_isShown(){return this.tip&&this.tip.classList.contains(tn)}_createPopper(t){const e=g(this._config.placement,[this,t,this._element]),i=rn[e.toUpperCase()];return qe(this._element,t,this._getPopperConfig(i))}_getOffset(){const{offset:t}=this._config;return"string"==typeof t?t.split(",").map((t=>Number.parseInt(t,10))):"function"==typeof t?e=>t(e,this._element):t}_resolvePossibleFunction(t){return g(t,[this._element])}_getPopperConfig(t){const e={placement:t,modifiers:[{name:"flip",options:{fallbackPlacements:this._config.fallbackPlacements}},{name:"offset",options:{offset:this._getOffset()}},{name:"preventOverflow",options:{boundary:this._config.boundary}},{name:"arrow",options:{element:`.${this.constructor.NAME}-arrow`}},{name:"preSetPlacement",enabled:!0,phase:"beforeMain",fn:t=>{this._getTipElement().setAttribute("data-popper-placement",t.state.placement)}}]};return{...e,...g(this._config.popperConfig,[e])}}_setListeners(){const t=this._config.trigger.split(" ");for(const e of t)if("click"===e)P.on(this._element,this.constructor.eventName("click"),this._config.selector,(t=>{this._initializeOnDelegatedTarget(t).toggle()}));else if("manual"!==e){const t=e===sn?this.constructor.eventName("mouseenter"):this.constructor.eventName("focusin"),i=e===sn?this.constructor.eventName("mouseleave"):this.constructor.eventName("focusout");P.on(this._element,t,this._config.selector,(t=>{const e=this._initializeOnDelegatedTarget(t);e._activeTrigger["focusin"===t.type?on:sn]=!0,e._enter()})),P.on(this._element,i,this._config.selector,(t=>{const e=this._initializeOnDelegatedTarget(t);e._activeTrigger["focusout"===t.type?on:sn]=e._element.contains(t.relatedTarget),e._leave()}))}this._hideModalHandler=()=>{this._element&&this.hide()},P.on(this._element.closest(en),nn,this._hideModalHandler)}_fixTitle(){const t=this._element.getAttribute("title");t&&(this._element.getAttribute("aria-label")||this._element.textContent.trim()||this._element.setAttribute("aria-label",t),this._element.setAttribute("data-bs-original-title",t),this._element.removeAttribute("title"))}_enter(){this._isShown()||this._isHovered?this._isHovered=!0:(this._isHovered=!0,this._setTimeout((()=>{this._isHovered&&this.show()}),this._config.delay.show))}_leave(){this._isWithActiveTrigger()||(this._isHovered=!1,this._setTimeout((()=>{this._isHovered||this.hide()}),this._config.delay.hide))}_setTimeout(t,e){clearTimeout(this._timeout),this._timeout=setTimeout(t,e)}_isWithActiveTrigger(){return Object.values(this._activeTrigger).includes(!0)}_getConfig(t){const e=H.getDataAttributes(this._element);for(const t of Object.keys(e))Ji.has(t)&&delete e[t];return t={...e,..."object"==typeof t&&t?t:{}},t=this._mergeConfigObj(t),t=this._configAfterMerge(t),this._typeCheckConfig(t),t}_configAfterMerge(t){return t.container=!1===t.container?document.body:r(t.container),"number"==typeof t.delay&&(t.delay={show:t.delay,hide:t.delay}),"number"==typeof t.title&&(t.title=t.title.toString()),"number"==typeof t.content&&(t.content=t.content.toString()),t}_getDelegateConfig(){const t={};for(const[e,i]of Object.entries(this._config))this.constructor.Default[e]!==i&&(t[e]=i);return t.selector=!1,t.trigger="manual",t}_disposePopper(){this._popper&&(this._popper.destroy(),this._popper=null),this.tip&&(this.tip.remove(),this.tip=null)}static jQueryInterface(t){return this.each((function(){const e=cn.getOrCreateInstance(this,t);if("string"==typeof t){if(void 0===e[t])throw new TypeError(`No method named "${t}"`);e[t]()}}))}}m(cn);const hn={...cn.Default,content:"",offset:[0,8],placement:"right",template:'<div class="popover" role="tooltip"><div class="popover-arrow"></div><h3 class="popover-header"></h3><div class="popover-body"></div></div>',trigger:"click"},dn={...cn.DefaultType,content:"(null|string|element|function)"};class un extends cn{static get Default(){return hn}static get DefaultType(){return dn}static get NAME(){return"popover"}_isWithContent(){return this._getTitle()||this._getContent()}_getContentForTemplate(){return{".popover-header":this._getTitle(),".popover-body":this._getContent()}}_getContent(){return this._resolvePossibleFunction(this._config.content)}static jQueryInterface(t){return this.each((function(){const e=un.getOrCreateInstance(this,t);if("string"==typeof t){if(void 0===e[t])throw new TypeError(`No method named "${t}"`);e[t]()}}))}}m(un);const fn="click.bs.scrollspy",pn="active",mn="[href]",gn={offset:null,rootMargin:"0px 0px -25%",smoothScroll:!1,target:null,threshold:[.1,.5,1]},_n={offset:"(number|null)",rootMargin:"string",smoothScroll:"boolean",target:"element",threshold:"array"};class bn extends W{constructor(t,e){super(t,e),this._targetLinks=new Map,this._observableSections=new Map,this._rootElement="visible"===getComputedStyle(this._element).overflowY?null:this._element,this._activeTarget=null,this._observer=null,this._previousScrollData={visibleEntryTop:0,parentScrollTop:0},this.refresh()}static get Default(){return gn}static get DefaultType(){return _n}static get NAME(){return"scrollspy"}refresh(){this._initializeTargetsAndObservables(),this._maybeEnableSmoothScroll(),this._observer?this._observer.disconnect():this._observer=this._getNewObserver();for(const t of this._observableSections.values())this._observer.observe(t)}dispose(){this._observer.disconnect(),super.dispose()}_configAfterMerge(t){return t.target=r(t.target)||document.body,t.rootMargin=t.offset?`${t.offset}px 0px -30%`:t.rootMargin,"string"==typeof t.threshold&&(t.threshold=t.threshold.split(",").map((t=>Number.parseFloat(t)))),t}_maybeEnableSmoothScroll(){this._config.smoothScroll&&(P.off(this._config.target,fn),P.on(this._config.target,fn,mn,(t=>{const e=this._observableSections.get(t.target.hash);if(e){t.preventDefault();const i=this._rootElement||window,n=e.offsetTop-this._element.offsetTop;if(i.scrollTo)return void i.scrollTo({top:n,behavior:"smooth"});i.scrollTop=n}})))}_getNewObserver(){const t={root:this._rootElement,threshold:this._config.threshold,rootMargin:this._config.rootMargin};return new IntersectionObserver((t=>this._observerCallback(t)),t)}_observerCallback(t){const e=t=>this._targetLinks.get(`#${t.target.id}`),i=t=>{this._previousScrollData.visibleEntryTop=t.target.offsetTop,this._process(e(t))},n=(this._rootElement||document.documentElement).scrollTop,s=n>=this._previousScrollData.parentScrollTop;this._previousScrollData.parentScrollTop=n;for(const o of t){if(!o.isIntersecting){this._activeTarget=null,this._clearActiveClass(e(o));continue}const t=o.target.offsetTop>=this._previousScrollData.visibleEntryTop;if(s&&t){if(i(o),!n)return}else s||t||i(o)}}_initializeTargetsAndObservables(){this._targetLinks=new Map,this._observableSections=new Map;const t=z.find(mn,this._config.target);for(const e of t){if(!e.hash||l(e))continue;const t=z.findOne(e.hash,this._element);a(t)&&(this._targetLinks.set(e.hash,e),this._observableSections.set(e.hash,t))}}_process(t){this._activeTarget!==t&&(this._clearActiveClass(this._config.target),this._activeTarget=t,t.classList.add(pn),this._activateParents(t),P.trigger(this._element,"activate.bs.scrollspy",{relatedTarget:t}))}_activateParents(t){if(t.classList.contains("dropdown-item"))z.findOne(".dropdown-toggle",t.closest(".dropdown")).classList.add(pn);else for(const e of z.parents(t,".nav, .list-group"))for(const t of z.prev(e,".nav-link, .nav-item > .nav-link, .list-group-item"))t.classList.add(pn)}_clearActiveClass(t){t.classList.remove(pn);const e=z.find("[href].active",t);for(const t of e)t.classList.remove(pn)}static jQueryInterface(t){return this.each((function(){const e=bn.getOrCreateInstance(this,t);if("string"==typeof t){if(void 0===e[t]||t.startsWith("_")||"constructor"===t)throw new TypeError(`No method named "${t}"`);e[t]()}}))}}P.on(window,"load.bs.scrollspy.data-api",(()=>{for(const t of z.find('[data-bs-spy="scroll"]'))bn.getOrCreateInstance(t)})),m(bn);const vn="ArrowLeft",yn="ArrowRight",wn="ArrowUp",An="ArrowDown",En="active",Tn="fade",Cn="show",On='[data-bs-toggle="tab"], [data-bs-toggle="pill"], [data-bs-toggle="list"]',xn=`.nav-link:not(.dropdown-toggle), .list-group-item:not(.dropdown-toggle), [role="tab"]:not(.dropdown-toggle), ${On}`;class kn extends W{constructor(t){super(t),this._parent=this._element.closest('.list-group, .nav, [role="tablist"]'),this._parent&&(this._setInitialAttributes(this._parent,this._getChildren()),P.on(this._element,"keydown.bs.tab",(t=>this._keydown(t))))}static get NAME(){return"tab"}show(){const t=this._element;if(this._elemIsActive(t))return;const e=this._getActiveElem(),i=e?P.trigger(e,"hide.bs.tab",{relatedTarget:t}):null;P.trigger(t,"show.bs.tab",{relatedTarget:e}).defaultPrevented||i&&i.defaultPrevented||(this._deactivate(e,t),this._activate(t,e))}_activate(t,e){t&&(t.classList.add(En),this._activate(z.getElementFromSelector(t)),this._queueCallback((()=>{"tab"===t.getAttribute("role")?(t.removeAttribute("tabindex"),t.setAttribute("aria-selected",!0),this._toggleDropDown(t,!0),P.trigger(t,"shown.bs.tab",{relatedTarget:e})):t.classList.add(Cn)}),t,t.classList.contains(Tn)))}_deactivate(t,e){t&&(t.classList.remove(En),t.blur(),this._deactivate(z.getElementFromSelector(t)),this._queueCallback((()=>{"tab"===t.getAttribute("role")?(t.setAttribute("aria-selected",!1),t.setAttribute("tabindex","-1"),this._toggleDropDown(t,!1),P.trigger(t,"hidden.bs.tab",{relatedTarget:e})):t.classList.remove(Cn)}),t,t.classList.contains(Tn)))}_keydown(t){if(![vn,yn,wn,An].includes(t.key))return;t.stopPropagation(),t.preventDefault();const e=[yn,An].includes(t.key),i=b(this._getChildren().filter((t=>!l(t))),t.target,e,!0);i&&(i.focus({preventScroll:!0}),kn.getOrCreateInstance(i).show())}_getChildren(){return z.find(xn,this._parent)}_getActiveElem(){return this._getChildren().find((t=>this._elemIsActive(t)))||null}_setInitialAttributes(t,e){this._setAttributeIfNotExists(t,"role","tablist");for(const t of e)this._setInitialAttributesOnChild(t)}_setInitialAttributesOnChild(t){t=this._getInnerElement(t);const e=this._elemIsActive(t),i=this._getOuterElement(t);t.setAttribute("aria-selected",e),i!==t&&this._setAttributeIfNotExists(i,"role","presentation"),e||t.setAttribute("tabindex","-1"),this._setAttributeIfNotExists(t,"role","tab"),this._setInitialAttributesOnTargetPanel(t)}_setInitialAttributesOnTargetPanel(t){const e=z.getElementFromSelector(t);e&&(this._setAttributeIfNotExists(e,"role","tabpanel"),t.id&&this._setAttributeIfNotExists(e,"aria-labelledby",`${t.id}`))}_toggleDropDown(t,e){const i=this._getOuterElement(t);if(!i.classList.contains("dropdown"))return;const n=(t,n)=>{const s=z.findOne(t,i);s&&s.classList.toggle(n,e)};n(".dropdown-toggle",En),n(".dropdown-menu",Cn),i.setAttribute("aria-expanded",e)}_setAttributeIfNotExists(t,e,i){t.hasAttribute(e)||t.setAttribute(e,i)}_elemIsActive(t){return t.classList.contains(En)}_getInnerElement(t){return t.matches(xn)?t:z.findOne(xn,t)}_getOuterElement(t){return t.closest(".nav-item, .list-group-item")||t}static jQueryInterface(t){return this.each((function(){const e=kn.getOrCreateInstance(this);if("string"==typeof t){if(void 0===e[t]||t.startsWith("_")||"constructor"===t)throw new TypeError(`No method named "${t}"`);e[t]()}}))}}P.on(document,"click.bs.tab",On,(function(t){["A","AREA"].includes(this.tagName)&&t.preventDefault(),l(this)||kn.getOrCreateInstance(this).show()})),P.on(window,"load.bs.tab",(()=>{for(const t of z.find('.active[data-bs-toggle="tab"], .active[data-bs-toggle="pill"], .active[data-bs-toggle="list"]'))kn.getOrCreateInstance(t)})),m(kn);const Ln="hide",Sn="show",Dn="showing",In={animation:"boolean",autohide:"boolean",delay:"number"},Nn={animation:!0,autohide:!0,delay:5e3};class Pn extends W{constructor(t,e){super(t,e),this._timeout=null,this._hasMouseInteraction=!1,this._hasKeyboardInteraction=!1,this._setListeners()}static get Default(){return Nn}static get DefaultType(){return In}static get NAME(){return"toast"}show(){P.trigger(this._element,"show.bs.toast").defaultPrevented||(this._clearTimeout(),this._config.animation&&this._element.classList.add("fade"),this._element.classList.remove(Ln),d(this._element),this._element.classList.add(Sn,Dn),this._queueCallback((()=>{this._element.classList.remove(Dn),P.trigger(this._element,"shown.bs.toast"),this._maybeScheduleHide()}),this._element,this._config.animation))}hide(){this.isShown()&&(P.trigger(this._element,"hide.bs.toast").defaultPrevented||(this._element.classList.add(Dn),this._queueCallback((()=>{this._element.classList.add(Ln),this._element.classList.remove(Dn,Sn),P.trigger(this._element,"hidden.bs.toast")}),this._element,this._config.animation)))}dispose(){this._clearTimeout(),this.isShown()&&this._element.classList.remove(Sn),super.dispose()}isShown(){return this._element.classList.contains(Sn)}_maybeScheduleHide(){this._config.autohide&&(this._hasMouseInteraction||this._hasKeyboardInteraction||(this._timeout=setTimeout((()=>{this.hide()}),this._config.delay)))}_onInteraction(t,e){switch(t.type){case"mouseover":case"mouseout":this._hasMouseInteraction=e;break;case"focusin":case"focusout":this._hasKeyboardInteraction=e}if(e)return void this._clearTimeout();const i=t.relatedTarget;this._element===i||this._element.contains(i)||this._maybeScheduleHide()}_setListeners(){P.on(this._element,"mouseover.bs.toast",(t=>this._onInteraction(t,!0))),P.on(this._element,"mouseout.bs.toast",(t=>this._onInteraction(t,!1))),P.on(this._element,"focusin.bs.toast",(t=>this._onInteraction(t,!0))),P.on(this._element,"focusout.bs.toast",(t=>this._onInteraction(t,!1)))}_clearTimeout(){clearTimeout(this._timeout),this._timeout=null}static jQueryInterface(t){return this.each((function(){const e=Pn.getOrCreateInstance(this,t);if("string"==typeof t){if(void 0===e[t])throw new TypeError(`No method named "${t}"`);e[t](this)}}))}}return R(Pn),m(Pn),{Alert:q,Button:K,Carousel:rt,Collapse:ft,Dropdown:ci,Modal:Ni,Offcanvas:zi,Popover:un,ScrollSpy:bn,Tab:kn,Toast:Pn,Tooltip:cn}}));

/**
 * Owl Carousel v2.3.4
 * Copyright 2013-2018 David Deutsch
 * Licensed under: SEE LICENSE IN https://github.com/OwlCarousel2/OwlCarousel2/blob/master/LICENSE
 */
!function(a,b,c,d){function e(b,c){this.settings=null,this.options=a.extend({},e.Defaults,c),this.$element=a(b),this._handlers={},this._plugins={},this._supress={},this._current=null,this._speed=null,this._coordinates=[],this._breakpoint=null,this._width=null,this._items=[],this._clones=[],this._mergers=[],this._widths=[],this._invalidated={},this._pipe=[],this._drag={time:null,target:null,pointer:null,stage:{start:null,current:null},direction:null},this._states={current:{},tags:{initializing:["busy"],animating:["busy"],dragging:["interacting"]}},a.each(["onResize","onThrottledResize"],a.proxy(function(b,c){this._handlers[c]=a.proxy(this[c],this)},this)),a.each(e.Plugins,a.proxy(function(a,b){this._plugins[a.charAt(0).toLowerCase()+a.slice(1)]=new b(this)},this)),a.each(e.Workers,a.proxy(function(b,c){this._pipe.push({filter:c.filter,run:a.proxy(c.run,this)})},this)),this.setup(),this.initialize()}e.Defaults={items:3,loop:!1,center:!1,rewind:!1,checkVisibility:!0,mouseDrag:!0,touchDrag:!0,pullDrag:!0,freeDrag:!1,margin:0,stagePadding:0,merge:!1,mergeFit:!0,autoWidth:!1,startPosition:0,rtl:!1,smartSpeed:250,fluidSpeed:!1,dragEndSpeed:!1,responsive:{},responsiveRefreshRate:200,responsiveBaseElement:b,fallbackEasing:"swing",slideTransition:"",info:!1,nestedItemSelector:!1,itemElement:"div",stageElement:"div",refreshClass:"owl-refresh",loadedClass:"owl-loaded",loadingClass:"owl-loading",rtlClass:"owl-rtl",responsiveClass:"owl-responsive",dragClass:"owl-drag",itemClass:"owl-item",stageClass:"owl-stage",stageOuterClass:"owl-stage-outer",grabClass:"owl-grab"},e.Width={Default:"default",Inner:"inner",Outer:"outer"},e.Type={Event:"event",State:"state"},e.Plugins={},e.Workers=[{filter:["width","settings"],run:function(){this._width=this.$element.width()}},{filter:["width","items","settings"],run:function(a){a.current=this._items&&this._items[this.relative(this._current)]}},{filter:["items","settings"],run:function(){this.$stage.children(".cloned").remove()}},{filter:["width","items","settings"],run:function(a){var b=this.settings.margin||"",c=!this.settings.autoWidth,d=this.settings.rtl,e={width:"auto","margin-left":d?b:"","margin-right":d?"":b};!c&&this.$stage.children().css(e),a.css=e}},{filter:["width","items","settings"],run:function(a){var b=(this.width()/this.settings.items).toFixed(3)-this.settings.margin,c=null,d=this._items.length,e=!this.settings.autoWidth,f=[];for(a.items={merge:!1,width:b};d--;)c=this._mergers[d],c=this.settings.mergeFit&&Math.min(c,this.settings.items)||c,a.items.merge=c>1||a.items.merge,f[d]=e?b*c:this._items[d].width();this._widths=f}},{filter:["items","settings"],run:function(){var b=[],c=this._items,d=this.settings,e=Math.max(2*d.items,4),f=2*Math.ceil(c.length/2),g=d.loop&&c.length?d.rewind?e:Math.max(e,f):0,h="",i="";for(g/=2;g>0;)b.push(this.normalize(b.length/2,!0)),h+=c[b[b.length-1]][0].outerHTML,b.push(this.normalize(c.length-1-(b.length-1)/2,!0)),i=c[b[b.length-1]][0].outerHTML+i,g-=1;this._clones=b,a(h).addClass("cloned").appendTo(this.$stage),a(i).addClass("cloned").prependTo(this.$stage)}},{filter:["width","items","settings"],run:function(){for(var a=this.settings.rtl?1:-1,b=this._clones.length+this._items.length,c=-1,d=0,e=0,f=[];++c<b;)d=f[c-1]||0,e=this._widths[this.relative(c)]+this.settings.margin,f.push(d+e*a);this._coordinates=f}},{filter:["width","items","settings"],run:function(){var a=this.settings.stagePadding,b=this._coordinates,c={width:Math.ceil(Math.abs(b[b.length-1]))+2*a,"padding-left":a||"","padding-right":a||""};this.$stage.css(c)}},{filter:["width","items","settings"],run:function(a){var b=this._coordinates.length,c=!this.settings.autoWidth,d=this.$stage.children();if(c&&a.items.merge)for(;b--;)a.css.width=this._widths[this.relative(b)],d.eq(b).css(a.css);else c&&(a.css.width=a.items.width,d.css(a.css))}},{filter:["items"],run:function(){this._coordinates.length<1&&this.$stage.removeAttr("style")}},{filter:["width","items","settings"],run:function(a){a.current=a.current?this.$stage.children().index(a.current):0,a.current=Math.max(this.minimum(),Math.min(this.maximum(),a.current)),this.reset(a.current)}},{filter:["position"],run:function(){this.animate(this.coordinates(this._current))}},{filter:["width","position","items","settings"],run:function(){var a,b,c,d,e=this.settings.rtl?1:-1,f=2*this.settings.stagePadding,g=this.coordinates(this.current())+f,h=g+this.width()*e,i=[];for(c=0,d=this._coordinates.length;c<d;c++)a=this._coordinates[c-1]||0,b=Math.abs(this._coordinates[c])+f*e,(this.op(a,"<=",g)&&this.op(a,">",h)||this.op(b,"<",g)&&this.op(b,">",h))&&i.push(c);this.$stage.children(".active").removeClass("active"),this.$stage.children(":eq("+i.join("), :eq(")+")").addClass("active"),this.$stage.children(".center").removeClass("center"),this.settings.center&&this.$stage.children().eq(this.current()).addClass("center")}}],e.prototype.initializeStage=function(){this.$stage=this.$element.find("."+this.settings.stageClass),this.$stage.length||(this.$element.addClass(this.options.loadingClass),this.$stage=a("<"+this.settings.stageElement+">",{class:this.settings.stageClass}).wrap(a("<div/>",{class:this.settings.stageOuterClass})),this.$element.append(this.$stage.parent()))},e.prototype.initializeItems=function(){var b=this.$element.find(".owl-item");if(b.length)return this._items=b.get().map(function(b){return a(b)}),this._mergers=this._items.map(function(){return 1}),void this.refresh();this.replace(this.$element.children().not(this.$stage.parent())),this.isVisible()?this.refresh():this.invalidate("width"),this.$element.removeClass(this.options.loadingClass).addClass(this.options.loadedClass)},e.prototype.initialize=function(){if(this.enter("initializing"),this.trigger("initialize"),this.$element.toggleClass(this.settings.rtlClass,this.settings.rtl),this.settings.autoWidth&&!this.is("pre-loading")){var a,b,c;a=this.$element.find("img"),b=this.settings.nestedItemSelector?"."+this.settings.nestedItemSelector:d,c=this.$element.children(b).width(),a.length&&c<=0&&this.preloadAutoWidthImages(a)}this.initializeStage(),this.initializeItems(),this.registerEventHandlers(),this.leave("initializing"),this.trigger("initialized")},e.prototype.isVisible=function(){return!this.settings.checkVisibility||this.$element.is(":visible")},e.prototype.setup=function(){var b=this.viewport(),c=this.options.responsive,d=-1,e=null;c?(a.each(c,function(a){a<=b&&a>d&&(d=Number(a))}),e=a.extend({},this.options,c[d]),"function"==typeof e.stagePadding&&(e.stagePadding=e.stagePadding()),delete e.responsive,e.responsiveClass&&this.$element.attr("class",this.$element.attr("class").replace(new RegExp("("+this.options.responsiveClass+"-)\\S+\\s","g"),"$1"+d))):e=a.extend({},this.options),this.trigger("change",{property:{name:"settings",value:e}}),this._breakpoint=d,this.settings=e,this.invalidate("settings"),this.trigger("changed",{property:{name:"settings",value:this.settings}})},e.prototype.optionsLogic=function(){this.settings.autoWidth&&(this.settings.stagePadding=!1,this.settings.merge=!1)},e.prototype.prepare=function(b){var c=this.trigger("prepare",{content:b});return c.data||(c.data=a("<"+this.settings.itemElement+"/>").addClass(this.options.itemClass).append(b)),this.trigger("prepared",{content:c.data}),c.data},e.prototype.update=function(){for(var b=0,c=this._pipe.length,d=a.proxy(function(a){return this[a]},this._invalidated),e={};b<c;)(this._invalidated.all||a.grep(this._pipe[b].filter,d).length>0)&&this._pipe[b].run(e),b++;this._invalidated={},!this.is("valid")&&this.enter("valid")},e.prototype.width=function(a){switch(a=a||e.Width.Default){case e.Width.Inner:case e.Width.Outer:return this._width;default:return this._width-2*this.settings.stagePadding+this.settings.margin}},e.prototype.refresh=function(){this.enter("refreshing"),this.trigger("refresh"),this.setup(),this.optionsLogic(),this.$element.addClass(this.options.refreshClass),this.update(),this.$element.removeClass(this.options.refreshClass),this.leave("refreshing"),this.trigger("refreshed")},e.prototype.onThrottledResize=function(){b.clearTimeout(this.resizeTimer),this.resizeTimer=b.setTimeout(this._handlers.onResize,this.settings.responsiveRefreshRate)},e.prototype.onResize=function(){return!!this._items.length&&(this._width!==this.$element.width()&&(!!this.isVisible()&&(this.enter("resizing"),this.trigger("resize").isDefaultPrevented()?(this.leave("resizing"),!1):(this.invalidate("width"),this.refresh(),this.leave("resizing"),void this.trigger("resized")))))},e.prototype.registerEventHandlers=function(){a.support.transition&&this.$stage.on(a.support.transition.end+".owl.core",a.proxy(this.onTransitionEnd,this)),!1!==this.settings.responsive&&this.on(b,"resize",this._handlers.onThrottledResize),this.settings.mouseDrag&&(this.$element.addClass(this.options.dragClass),this.$stage.on("mousedown.owl.core",a.proxy(this.onDragStart,this)),this.$stage.on("dragstart.owl.core selectstart.owl.core",function(){return!1})),this.settings.touchDrag&&(this.$stage.on("touchstart.owl.core",a.proxy(this.onDragStart,this)),this.$stage.on("touchcancel.owl.core",a.proxy(this.onDragEnd,this)))},e.prototype.onDragStart=function(b){var d=null;3!==b.which&&(a.support.transform?(d=this.$stage.css("transform").replace(/.*\(|\)| /g,"").split(","),d={x:d[16===d.length?12:4],y:d[16===d.length?13:5]}):(d=this.$stage.position(),d={x:this.settings.rtl?d.left+this.$stage.width()-this.width()+this.settings.margin:d.left,y:d.top}),this.is("animating")&&(a.support.transform?this.animate(d.x):this.$stage.stop(),this.invalidate("position")),this.$element.toggleClass(this.options.grabClass,"mousedown"===b.type),this.speed(0),this._drag.time=(new Date).getTime(),this._drag.target=a(b.target),this._drag.stage.start=d,this._drag.stage.current=d,this._drag.pointer=this.pointer(b),a(c).on("mouseup.owl.core touchend.owl.core",a.proxy(this.onDragEnd,this)),a(c).one("mousemove.owl.core touchmove.owl.core",a.proxy(function(b){var d=this.difference(this._drag.pointer,this.pointer(b));a(c).on("mousemove.owl.core touchmove.owl.core",a.proxy(this.onDragMove,this)),Math.abs(d.x)<Math.abs(d.y)&&this.is("valid")||(b.preventDefault(),this.enter("dragging"),this.trigger("drag"))},this)))},e.prototype.onDragMove=function(a){var b=null,c=null,d=null,e=this.difference(this._drag.pointer,this.pointer(a)),f=this.difference(this._drag.stage.start,e);this.is("dragging")&&(a.preventDefault(),this.settings.loop?(b=this.coordinates(this.minimum()),c=this.coordinates(this.maximum()+1)-b,f.x=((f.x-b)%c+c)%c+b):(b=this.settings.rtl?this.coordinates(this.maximum()):this.coordinates(this.minimum()),c=this.settings.rtl?this.coordinates(this.minimum()):this.coordinates(this.maximum()),d=this.settings.pullDrag?-1*e.x/5:0,f.x=Math.max(Math.min(f.x,b+d),c+d)),this._drag.stage.current=f,this.animate(f.x))},e.prototype.onDragEnd=function(b){var d=this.difference(this._drag.pointer,this.pointer(b)),e=this._drag.stage.current,f=d.x>0^this.settings.rtl?"left":"right";a(c).off(".owl.core"),this.$element.removeClass(this.options.grabClass),(0!==d.x&&this.is("dragging")||!this.is("valid"))&&(this.speed(this.settings.dragEndSpeed||this.settings.smartSpeed),this.current(this.closest(e.x,0!==d.x?f:this._drag.direction)),this.invalidate("position"),this.update(),this._drag.direction=f,(Math.abs(d.x)>3||(new Date).getTime()-this._drag.time>300)&&this._drag.target.one("click.owl.core",function(){return!1})),this.is("dragging")&&(this.leave("dragging"),this.trigger("dragged"))},e.prototype.closest=function(b,c){var e=-1,f=30,g=this.width(),h=this.coordinates();return this.settings.freeDrag||a.each(h,a.proxy(function(a,i){return"left"===c&&b>i-f&&b<i+f?e=a:"right"===c&&b>i-g-f&&b<i-g+f?e=a+1:this.op(b,"<",i)&&this.op(b,">",h[a+1]!==d?h[a+1]:i-g)&&(e="left"===c?a+1:a),-1===e},this)),this.settings.loop||(this.op(b,">",h[this.minimum()])?e=b=this.minimum():this.op(b,"<",h[this.maximum()])&&(e=b=this.maximum())),e},e.prototype.animate=function(b){var c=this.speed()>0;this.is("animating")&&this.onTransitionEnd(),c&&(this.enter("animating"),this.trigger("translate")),a.support.transform3d&&a.support.transition?this.$stage.css({transform:"translate3d("+b+"px,0px,0px)",transition:this.speed()/1e3+"s"+(this.settings.slideTransition?" "+this.settings.slideTransition:"")}):c?this.$stage.animate({left:b+"px"},this.speed(),this.settings.fallbackEasing,a.proxy(this.onTransitionEnd,this)):this.$stage.css({left:b+"px"})},e.prototype.is=function(a){return this._states.current[a]&&this._states.current[a]>0},e.prototype.current=function(a){if(a===d)return this._current;if(0===this._items.length)return d;if(a=this.normalize(a),this._current!==a){var b=this.trigger("change",{property:{name:"position",value:a}});b.data!==d&&(a=this.normalize(b.data)),this._current=a,this.invalidate("position"),this.trigger("changed",{property:{name:"position",value:this._current}})}return this._current},e.prototype.invalidate=function(b){return"string"===a.type(b)&&(this._invalidated[b]=!0,this.is("valid")&&this.leave("valid")),a.map(this._invalidated,function(a,b){return b})},e.prototype.reset=function(a){(a=this.normalize(a))!==d&&(this._speed=0,this._current=a,this.suppress(["translate","translated"]),this.animate(this.coordinates(a)),this.release(["translate","translated"]))},e.prototype.normalize=function(a,b){var c=this._items.length,e=b?0:this._clones.length;return!this.isNumeric(a)||c<1?a=d:(a<0||a>=c+e)&&(a=((a-e/2)%c+c)%c+e/2),a},e.prototype.relative=function(a){return a-=this._clones.length/2,this.normalize(a,!0)},e.prototype.maximum=function(a){var b,c,d,e=this.settings,f=this._coordinates.length;if(e.loop)f=this._clones.length/2+this._items.length-1;else if(e.autoWidth||e.merge){if(b=this._items.length)for(c=this._items[--b].width(),d=this.$element.width();b--&&!((c+=this._items[b].width()+this.settings.margin)>d););f=b+1}else f=e.center?this._items.length-1:this._items.length-e.items;return a&&(f-=this._clones.length/2),Math.max(f,0)},e.prototype.minimum=function(a){return a?0:this._clones.length/2},e.prototype.items=function(a){return a===d?this._items.slice():(a=this.normalize(a,!0),this._items[a])},e.prototype.mergers=function(a){return a===d?this._mergers.slice():(a=this.normalize(a,!0),this._mergers[a])},e.prototype.clones=function(b){var c=this._clones.length/2,e=c+this._items.length,f=function(a){return a%2==0?e+a/2:c-(a+1)/2};return b===d?a.map(this._clones,function(a,b){return f(b)}):a.map(this._clones,function(a,c){return a===b?f(c):null})},e.prototype.speed=function(a){return a!==d&&(this._speed=a),this._speed},e.prototype.coordinates=function(b){var c,e=1,f=b-1;return b===d?a.map(this._coordinates,a.proxy(function(a,b){return this.coordinates(b)},this)):(this.settings.center?(this.settings.rtl&&(e=-1,f=b+1),c=this._coordinates[b],c+=(this.width()-c+(this._coordinates[f]||0))/2*e):c=this._coordinates[f]||0,c=Math.ceil(c))},e.prototype.duration=function(a,b,c){return 0===c?0:Math.min(Math.max(Math.abs(b-a),1),6)*Math.abs(c||this.settings.smartSpeed)},e.prototype.to=function(a,b){var c=this.current(),d=null,e=a-this.relative(c),f=(e>0)-(e<0),g=this._items.length,h=this.minimum(),i=this.maximum();this.settings.loop?(!this.settings.rewind&&Math.abs(e)>g/2&&(e+=-1*f*g),a=c+e,(d=((a-h)%g+g)%g+h)!==a&&d-e<=i&&d-e>0&&(c=d-e,a=d,this.reset(c))):this.settings.rewind?(i+=1,a=(a%i+i)%i):a=Math.max(h,Math.min(i,a)),this.speed(this.duration(c,a,b)),this.current(a),this.isVisible()&&this.update()},e.prototype.next=function(a){a=a||!1,this.to(this.relative(this.current())+1,a)},e.prototype.prev=function(a){a=a||!1,this.to(this.relative(this.current())-1,a)},e.prototype.onTransitionEnd=function(a){if(a!==d&&(a.stopPropagation(),(a.target||a.srcElement||a.originalTarget)!==this.$stage.get(0)))return!1;this.leave("animating"),this.trigger("translated")},e.prototype.viewport=function(){var d;return this.options.responsiveBaseElement!==b?d=a(this.options.responsiveBaseElement).width():b.innerWidth?d=b.innerWidth:c.documentElement&&c.documentElement.clientWidth?d=c.documentElement.clientWidth:console.warn("Can not detect viewport width."),d},e.prototype.replace=function(b){this.$stage.empty(),this._items=[],b&&(b=b instanceof jQuery?b:a(b)),this.settings.nestedItemSelector&&(b=b.find("."+this.settings.nestedItemSelector)),b.filter(function(){return 1===this.nodeType}).each(a.proxy(function(a,b){b=this.prepare(b),this.$stage.append(b),this._items.push(b),this._mergers.push(1*b.find("[data-merge]").addBack("[data-merge]").attr("data-merge")||1)},this)),this.reset(this.isNumeric(this.settings.startPosition)?this.settings.startPosition:0),this.invalidate("items")},e.prototype.add=function(b,c){var e=this.relative(this._current);c=c===d?this._items.length:this.normalize(c,!0),b=b instanceof jQuery?b:a(b),this.trigger("add",{content:b,position:c}),b=this.prepare(b),0===this._items.length||c===this._items.length?(0===this._items.length&&this.$stage.append(b),0!==this._items.length&&this._items[c-1].after(b),this._items.push(b),this._mergers.push(1*b.find("[data-merge]").addBack("[data-merge]").attr("data-merge")||1)):(this._items[c].before(b),this._items.splice(c,0,b),this._mergers.splice(c,0,1*b.find("[data-merge]").addBack("[data-merge]").attr("data-merge")||1)),this._items[e]&&this.reset(this._items[e].index()),this.invalidate("items"),this.trigger("added",{content:b,position:c})},e.prototype.remove=function(a){(a=this.normalize(a,!0))!==d&&(this.trigger("remove",{content:this._items[a],position:a}),this._items[a].remove(),this._items.splice(a,1),this._mergers.splice(a,1),this.invalidate("items"),this.trigger("removed",{content:null,position:a}))},e.prototype.preloadAutoWidthImages=function(b){b.each(a.proxy(function(b,c){this.enter("pre-loading"),c=a(c),a(new Image).one("load",a.proxy(function(a){c.attr("src",a.target.src),c.css("opacity",1),this.leave("pre-loading"),!this.is("pre-loading")&&!this.is("initializing")&&this.refresh()},this)).attr("src",c.attr("src")||c.attr("data-src")||c.attr("data-src-retina"))},this))},e.prototype.destroy=function(){this.$element.off(".owl.core"),this.$stage.off(".owl.core"),a(c).off(".owl.core"),!1!==this.settings.responsive&&(b.clearTimeout(this.resizeTimer),this.off(b,"resize",this._handlers.onThrottledResize));for(var d in this._plugins)this._plugins[d].destroy();this.$stage.children(".cloned").remove(),this.$stage.unwrap(),this.$stage.children().contents().unwrap(),this.$stage.children().unwrap(),this.$stage.remove(),this.$element.removeClass(this.options.refreshClass).removeClass(this.options.loadingClass).removeClass(this.options.loadedClass).removeClass(this.options.rtlClass).removeClass(this.options.dragClass).removeClass(this.options.grabClass).attr("class",this.$element.attr("class").replace(new RegExp(this.options.responsiveClass+"-\\S+\\s","g"),"")).removeData("owl.carousel")},e.prototype.op=function(a,b,c){var d=this.settings.rtl;switch(b){case"<":return d?a>c:a<c;case">":return d?a<c:a>c;case">=":return d?a<=c:a>=c;case"<=":return d?a>=c:a<=c}},e.prototype.on=function(a,b,c,d){a.addEventListener?a.addEventListener(b,c,d):a.attachEvent&&a.attachEvent("on"+b,c)},e.prototype.off=function(a,b,c,d){a.removeEventListener?a.removeEventListener(b,c,d):a.detachEvent&&a.detachEvent("on"+b,c)},e.prototype.trigger=function(b,c,d,f,g){var h={item:{count:this._items.length,index:this.current()}},i=a.camelCase(a.grep(["on",b,d],function(a){return a}).join("-").toLowerCase()),j=a.Event([b,"owl",d||"carousel"].join(".").toLowerCase(),a.extend({relatedTarget:this},h,c));return this._supress[b]||(a.each(this._plugins,function(a,b){b.onTrigger&&b.onTrigger(j)}),this.register({type:e.Type.Event,name:b}),this.$element.trigger(j),this.settings&&"function"==typeof this.settings[i]&&this.settings[i].call(this,j)),j},e.prototype.enter=function(b){a.each([b].concat(this._states.tags[b]||[]),a.proxy(function(a,b){this._states.current[b]===d&&(this._states.current[b]=0),this._states.current[b]++},this))},e.prototype.leave=function(b){a.each([b].concat(this._states.tags[b]||[]),a.proxy(function(a,b){this._states.current[b]--},this))},e.prototype.register=function(b){if(b.type===e.Type.Event){if(a.event.special[b.name]||(a.event.special[b.name]={}),!a.event.special[b.name].owl){var c=a.event.special[b.name]._default;a.event.special[b.name]._default=function(a){return!c||!c.apply||a.namespace&&-1!==a.namespace.indexOf("owl")?a.namespace&&a.namespace.indexOf("owl")>-1:c.apply(this,arguments)},a.event.special[b.name].owl=!0}}else b.type===e.Type.State&&(this._states.tags[b.name]?this._states.tags[b.name]=this._states.tags[b.name].concat(b.tags):this._states.tags[b.name]=b.tags,this._states.tags[b.name]=a.grep(this._states.tags[b.name],a.proxy(function(c,d){return a.inArray(c,this._states.tags[b.name])===d},this)))},e.prototype.suppress=function(b){a.each(b,a.proxy(function(a,b){this._supress[b]=!0},this))},e.prototype.release=function(b){a.each(b,a.proxy(function(a,b){delete this._supress[b]},this))},e.prototype.pointer=function(a){var c={x:null,y:null};return a=a.originalEvent||a||b.event,a=a.touches&&a.touches.length?a.touches[0]:a.changedTouches&&a.changedTouches.length?a.changedTouches[0]:a,a.pageX?(c.x=a.pageX,c.y=a.pageY):(c.x=a.clientX,c.y=a.clientY),c},e.prototype.isNumeric=function(a){return!isNaN(parseFloat(a))},e.prototype.difference=function(a,b){return{x:a.x-b.x,y:a.y-b.y}},a.fn.owlCarousel=function(b){var c=Array.prototype.slice.call(arguments,1);return this.each(function(){var d=a(this),f=d.data("owl.carousel");f||(f=new e(this,"object"==typeof b&&b),d.data("owl.carousel",f),a.each(["next","prev","to","destroy","refresh","replace","add","remove"],function(b,c){f.register({type:e.Type.Event,name:c}),f.$element.on(c+".owl.carousel.core",a.proxy(function(a){a.namespace&&a.relatedTarget!==this&&(this.suppress([c]),f[c].apply(this,[].slice.call(arguments,1)),this.release([c]))},f))})),"string"==typeof b&&"_"!==b.charAt(0)&&f[b].apply(f,c)})},a.fn.owlCarousel.Constructor=e}(window.Zepto||window.jQuery,window,document),function(a,b,c,d){var e=function(b){this._core=b,this._interval=null,this._visible=null,this._handlers={"initialized.owl.carousel":a.proxy(function(a){a.namespace&&this._core.settings.autoRefresh&&this.watch()},this)},this._core.options=a.extend({},e.Defaults,this._core.options),this._core.$element.on(this._handlers)};e.Defaults={autoRefresh:!0,autoRefreshInterval:500},e.prototype.watch=function(){this._interval||(this._visible=this._core.isVisible(),this._interval=b.setInterval(a.proxy(this.refresh,this),this._core.settings.autoRefreshInterval))},e.prototype.refresh=function(){this._core.isVisible()!==this._visible&&(this._visible=!this._visible,this._core.$element.toggleClass("owl-hidden",!this._visible),this._visible&&this._core.invalidate("width")&&this._core.refresh())},e.prototype.destroy=function(){var a,c;b.clearInterval(this._interval);for(a in this._handlers)this._core.$element.off(a,this._handlers[a]);for(c in Object.getOwnPropertyNames(this))"function"!=typeof this[c]&&(this[c]=null)},a.fn.owlCarousel.Constructor.Plugins.AutoRefresh=e}(window.Zepto||window.jQuery,window,document),function(a,b,c,d){var e=function(b){this._core=b,this._loaded=[],this._handlers={"initialized.owl.carousel change.owl.carousel resized.owl.carousel":a.proxy(function(b){if(b.namespace&&this._core.settings&&this._core.settings.lazyLoad&&(b.property&&"position"==b.property.name||"initialized"==b.type)){var c=this._core.settings,e=c.center&&Math.ceil(c.items/2)||c.items,f=c.center&&-1*e||0,g=(b.property&&b.property.value!==d?b.property.value:this._core.current())+f,h=this._core.clones().length,i=a.proxy(function(a,b){this.load(b)},this);for(c.lazyLoadEager>0&&(e+=c.lazyLoadEager,c.loop&&(g-=c.lazyLoadEager,e++));f++<e;)this.load(h/2+this._core.relative(g)),h&&a.each(this._core.clones(this._core.relative(g)),i),g++}},this)},this._core.options=a.extend({},e.Defaults,this._core.options),this._core.$element.on(this._handlers)};e.Defaults={lazyLoad:!1,lazyLoadEager:0},e.prototype.load=function(c){var d=this._core.$stage.children().eq(c),e=d&&d.find(".owl-lazy");!e||a.inArray(d.get(0),this._loaded)>-1||(e.each(a.proxy(function(c,d){var e,f=a(d),g=b.devicePixelRatio>1&&f.attr("data-src-retina")||f.attr("data-src")||f.attr("data-srcset");this._core.trigger("load",{element:f,url:g},"lazy"),f.is("img")?f.one("load.owl.lazy",a.proxy(function(){f.css("opacity",1),this._core.trigger("loaded",{element:f,url:g},"lazy")},this)).attr("src",g):f.is("source")?f.one("load.owl.lazy",a.proxy(function(){this._core.trigger("loaded",{element:f,url:g},"lazy")},this)).attr("srcset",g):(e=new Image,e.onload=a.proxy(function(){f.css({"background-image":'url("'+g+'")',opacity:"1"}),this._core.trigger("loaded",{element:f,url:g},"lazy")},this),e.src=g)},this)),this._loaded.push(d.get(0)))},e.prototype.destroy=function(){var a,b;for(a in this.handlers)this._core.$element.off(a,this.handlers[a]);for(b in Object.getOwnPropertyNames(this))"function"!=typeof this[b]&&(this[b]=null)},a.fn.owlCarousel.Constructor.Plugins.Lazy=e}(window.Zepto||window.jQuery,window,document),function(a,b,c,d){var e=function(c){this._core=c,this._previousHeight=null,this._handlers={"initialized.owl.carousel refreshed.owl.carousel":a.proxy(function(a){a.namespace&&this._core.settings.autoHeight&&this.update()},this),"changed.owl.carousel":a.proxy(function(a){a.namespace&&this._core.settings.autoHeight&&"position"===a.property.name&&this.update()},this),"loaded.owl.lazy":a.proxy(function(a){a.namespace&&this._core.settings.autoHeight&&a.element.closest("."+this._core.settings.itemClass).index()===this._core.current()&&this.update()},this)},this._core.options=a.extend({},e.Defaults,this._core.options),this._core.$element.on(this._handlers),this._intervalId=null;var d=this;a(b).on("load",function(){d._core.settings.autoHeight&&d.update()}),a(b).resize(function(){d._core.settings.autoHeight&&(null!=d._intervalId&&clearTimeout(d._intervalId),d._intervalId=setTimeout(function(){d.update()},250))})};e.Defaults={autoHeight:!1,autoHeightClass:"owl-height"},e.prototype.update=function(){var b=this._core._current,c=b+this._core.settings.items,d=this._core.settings.lazyLoad,e=this._core.$stage.children().toArray().slice(b,c),f=[],g=0;a.each(e,function(b,c){f.push(a(c).height())}),g=Math.max.apply(null,f),g<=1&&d&&this._previousHeight&&(g=this._previousHeight),this._previousHeight=g,this._core.$stage.parent().height(g).addClass(this._core.settings.autoHeightClass)},e.prototype.destroy=function(){var a,b;for(a in this._handlers)this._core.$element.off(a,this._handlers[a]);for(b in Object.getOwnPropertyNames(this))"function"!=typeof this[b]&&(this[b]=null)},a.fn.owlCarousel.Constructor.Plugins.AutoHeight=e}(window.Zepto||window.jQuery,window,document),function(a,b,c,d){var e=function(b){this._core=b,this._videos={},this._playing=null,this._handlers={"initialized.owl.carousel":a.proxy(function(a){a.namespace&&this._core.register({type:"state",name:"playing",tags:["interacting"]})},this),"resize.owl.carousel":a.proxy(function(a){a.namespace&&this._core.settings.video&&this.isInFullScreen()&&a.preventDefault()},this),"refreshed.owl.carousel":a.proxy(function(a){a.namespace&&this._core.is("resizing")&&this._core.$stage.find(".cloned .owl-video-frame").remove()},this),"changed.owl.carousel":a.proxy(function(a){a.namespace&&"position"===a.property.name&&this._playing&&this.stop()},this),"prepared.owl.carousel":a.proxy(function(b){if(b.namespace){var c=a(b.content).find(".owl-video");c.length&&(c.css("display","none"),this.fetch(c,a(b.content)))}},this)},this._core.options=a.extend({},e.Defaults,this._core.options),this._core.$element.on(this._handlers),this._core.$element.on("click.owl.video",".owl-video-play-icon",a.proxy(function(a){this.play(a)},this))};e.Defaults={video:!1,videoHeight:!1,videoWidth:!1},e.prototype.fetch=function(a,b){var c=function(){return a.attr("data-vimeo-id")?"vimeo":a.attr("data-vzaar-id")?"vzaar":"youtube"}(),d=a.attr("data-vimeo-id")||a.attr("data-youtube-id")||a.attr("data-vzaar-id"),e=a.attr("data-width")||this._core.settings.videoWidth,f=a.attr("data-height")||this._core.settings.videoHeight,g=a.attr("href");if(!g)throw new Error("Missing video URL.");if(d=g.match(/(http:|https:|)\/\/(player.|www.|app.)?(vimeo\.com|youtu(be\.com|\.be|be\.googleapis\.com|be\-nocookie\.com)|vzaar\.com)\/(video\/|videos\/|embed\/|channels\/.+\/|groups\/.+\/|watch\?v=|v\/)?([A-Za-z0-9._%-]*)(\&\S+)?/),d[3].indexOf("youtu")>-1)c="youtube";else if(d[3].indexOf("vimeo")>-1)c="vimeo";else{if(!(d[3].indexOf("vzaar")>-1))throw new Error("Video URL not supported.");c="vzaar"}d=d[6],this._videos[g]={type:c,id:d,width:e,height:f},b.attr("data-video",g),this.thumbnail(a,this._videos[g])},e.prototype.thumbnail=function(b,c){var d,e,f,g=c.width&&c.height?"width:"+c.width+"px;height:"+c.height+"px;":"",h=b.find("img"),i="src",j="",k=this._core.settings,l=function(c){e='<div class="owl-video-play-icon"></div>',d=k.lazyLoad?a("<div/>",{class:"owl-video-tn "+j,srcType:c}):a("<div/>",{class:"owl-video-tn",style:"opacity:1;background-image:url("+c+")"}),b.after(d),b.after(e)};if(b.wrap(a("<div/>",{class:"owl-video-wrapper",style:g})),this._core.settings.lazyLoad&&(i="data-src",j="owl-lazy"),h.length)return l(h.attr(i)),h.remove(),!1;"youtube"===c.type?(f="//img.youtube.com/vi/"+c.id+"/hqdefault.jpg",l(f)):"vimeo"===c.type?a.ajax({type:"GET",url:"//vimeo.com/api/v2/video/"+c.id+".json",jsonp:"callback",dataType:"jsonp",success:function(a){f=a[0].thumbnail_large,l(f)}}):"vzaar"===c.type&&a.ajax({type:"GET",url:"//vzaar.com/api/videos/"+c.id+".json",jsonp:"callback",dataType:"jsonp",success:function(a){f=a.framegrab_url,l(f)}})},e.prototype.stop=function(){this._core.trigger("stop",null,"video"),this._playing.find(".owl-video-frame").remove(),this._playing.removeClass("owl-video-playing"),this._playing=null,this._core.leave("playing"),this._core.trigger("stopped",null,"video")},e.prototype.play=function(b){var c,d=a(b.target),e=d.closest("."+this._core.settings.itemClass),f=this._videos[e.attr("data-video")],g=f.width||"100%",h=f.height||this._core.$stage.height();this._playing||(this._core.enter("playing"),this._core.trigger("play",null,"video"),e=this._core.items(this._core.relative(e.index())),this._core.reset(e.index()),c=a('<iframe frameborder="0" allowfullscreen mozallowfullscreen webkitAllowFullScreen ></iframe>'),c.attr("height",h),c.attr("width",g),"youtube"===f.type?c.attr("src","//www.youtube.com/embed/"+f.id+"?autoplay=1&rel=0&v="+f.id):"vimeo"===f.type?c.attr("src","//player.vimeo.com/video/"+f.id+"?autoplay=1"):"vzaar"===f.type&&c.attr("src","//view.vzaar.com/"+f.id+"/player?autoplay=true"),a(c).wrap('<div class="owl-video-frame" />').insertAfter(e.find(".owl-video")),this._playing=e.addClass("owl-video-playing"))},e.prototype.isInFullScreen=function(){var b=c.fullscreenElement||c.mozFullScreenElement||c.webkitFullscreenElement;return b&&a(b).parent().hasClass("owl-video-frame")},e.prototype.destroy=function(){var a,b;this._core.$element.off("click.owl.video");for(a in this._handlers)this._core.$element.off(a,this._handlers[a]);for(b in Object.getOwnPropertyNames(this))"function"!=typeof this[b]&&(this[b]=null)},a.fn.owlCarousel.Constructor.Plugins.Video=e}(window.Zepto||window.jQuery,window,document),function(a,b,c,d){var e=function(b){this.core=b,this.core.options=a.extend({},e.Defaults,this.core.options),this.swapping=!0,this.previous=d,this.next=d,this.handlers={"change.owl.carousel":a.proxy(function(a){a.namespace&&"position"==a.property.name&&(this.previous=this.core.current(),this.next=a.property.value)},this),"drag.owl.carousel dragged.owl.carousel translated.owl.carousel":a.proxy(function(a){a.namespace&&(this.swapping="translated"==a.type)},this),"translate.owl.carousel":a.proxy(function(a){a.namespace&&this.swapping&&(this.core.options.animateOut||this.core.options.animateIn)&&this.swap()},this)},this.core.$element.on(this.handlers)};e.Defaults={animateOut:!1,animateIn:!1},e.prototype.swap=function(){if(1===this.core.settings.items&&a.support.animation&&a.support.transition){this.core.speed(0);var b,c=a.proxy(this.clear,this),d=this.core.$stage.children().eq(this.previous),e=this.core.$stage.children().eq(this.next),f=this.core.settings.animateIn,g=this.core.settings.animateOut;this.core.current()!==this.previous&&(g&&(b=this.core.coordinates(this.previous)-this.core.coordinates(this.next),d.one(a.support.animation.end,c).css({left:b+"px"}).addClass("animated owl-animated-out").addClass(g)),f&&e.one(a.support.animation.end,c).addClass("animated owl-animated-in").addClass(f))}},e.prototype.clear=function(b){a(b.target).css({left:""}).removeClass("animated owl-animated-out owl-animated-in").removeClass(this.core.settings.animateIn).removeClass(this.core.settings.animateOut),this.core.onTransitionEnd()},e.prototype.destroy=function(){var a,b;for(a in this.handlers)this.core.$element.off(a,this.handlers[a]);for(b in Object.getOwnPropertyNames(this))"function"!=typeof this[b]&&(this[b]=null)},a.fn.owlCarousel.Constructor.Plugins.Animate=e}(window.Zepto||window.jQuery,window,document),function(a,b,c,d){var e=function(b){this._core=b,this._call=null,this._time=0,this._timeout=0,this._paused=!0,this._handlers={"changed.owl.carousel":a.proxy(function(a){a.namespace&&"settings"===a.property.name?this._core.settings.autoplay?this.play():this.stop():a.namespace&&"position"===a.property.name&&this._paused&&(this._time=0)},this),"initialized.owl.carousel":a.proxy(function(a){a.namespace&&this._core.settings.autoplay&&this.play()},this),"play.owl.autoplay":a.proxy(function(a,b,c){a.namespace&&this.play(b,c)},this),"stop.owl.autoplay":a.proxy(function(a){a.namespace&&this.stop()},this),"mouseover.owl.autoplay":a.proxy(function(){this._core.settings.autoplayHoverPause&&this._core.is("rotating")&&this.pause()},this),"mouseleave.owl.autoplay":a.proxy(function(){this._core.settings.autoplayHoverPause&&this._core.is("rotating")&&this.play()},this),"touchstart.owl.core":a.proxy(function(){this._core.settings.autoplayHoverPause&&this._core.is("rotating")&&this.pause()},this),"touchend.owl.core":a.proxy(function(){this._core.settings.autoplayHoverPause&&this.play()},this)},this._core.$element.on(this._handlers),this._core.options=a.extend({},e.Defaults,this._core.options)};e.Defaults={autoplay:!1,autoplayTimeout:5e3,autoplayHoverPause:!1,autoplaySpeed:!1},e.prototype._next=function(d){this._call=b.setTimeout(a.proxy(this._next,this,d),this._timeout*(Math.round(this.read()/this._timeout)+1)-this.read()),this._core.is("interacting")||c.hidden||this._core.next(d||this._core.settings.autoplaySpeed)},e.prototype.read=function(){return(new Date).getTime()-this._time},e.prototype.play=function(c,d){var e;this._core.is("rotating")||this._core.enter("rotating"),c=c||this._core.settings.autoplayTimeout,e=Math.min(this._time%(this._timeout||c),c),this._paused?(this._time=this.read(),this._paused=!1):b.clearTimeout(this._call),this._time+=this.read()%c-e,this._timeout=c,this._call=b.setTimeout(a.proxy(this._next,this,d),c-e)},e.prototype.stop=function(){this._core.is("rotating")&&(this._time=0,this._paused=!0,b.clearTimeout(this._call),this._core.leave("rotating"))},e.prototype.pause=function(){this._core.is("rotating")&&!this._paused&&(this._time=this.read(),this._paused=!0,b.clearTimeout(this._call))},e.prototype.destroy=function(){var a,b;this.stop();for(a in this._handlers)this._core.$element.off(a,this._handlers[a]);for(b in Object.getOwnPropertyNames(this))"function"!=typeof this[b]&&(this[b]=null)},a.fn.owlCarousel.Constructor.Plugins.autoplay=e}(window.Zepto||window.jQuery,window,document),function(a,b,c,d){"use strict";var e=function(b){this._core=b,this._initialized=!1,this._pages=[],this._controls={},this._templates=[],this.$element=this._core.$element,this._overrides={next:this._core.next,prev:this._core.prev,to:this._core.to},this._handlers={"prepared.owl.carousel":a.proxy(function(b){b.namespace&&this._core.settings.dotsData&&this._templates.push('<div class="'+this._core.settings.dotClass+'">'+a(b.content).find("[data-dot]").addBack("[data-dot]").attr("data-dot")+"</div>")},this),"added.owl.carousel":a.proxy(function(a){a.namespace&&this._core.settings.dotsData&&this._templates.splice(a.position,0,this._templates.pop())},this),"remove.owl.carousel":a.proxy(function(a){a.namespace&&this._core.settings.dotsData&&this._templates.splice(a.position,1)},this),"changed.owl.carousel":a.proxy(function(a){a.namespace&&"position"==a.property.name&&this.draw()},this),"initialized.owl.carousel":a.proxy(function(a){a.namespace&&!this._initialized&&(this._core.trigger("initialize",null,"navigation"),this.initialize(),this.update(),this.draw(),this._initialized=!0,this._core.trigger("initialized",null,"navigation"))},this),"refreshed.owl.carousel":a.proxy(function(a){a.namespace&&this._initialized&&(this._core.trigger("refresh",null,"navigation"),this.update(),this.draw(),this._core.trigger("refreshed",null,"navigation"))},this)},this._core.options=a.extend({},e.Defaults,this._core.options),this.$element.on(this._handlers)};e.Defaults={nav:!1,navText:['<span aria-label="Previous">&#x2039;</span>','<span aria-label="Next">&#x203a;</span>'],navSpeed:!1,navElement:'button type="button" role="presentation"',navContainer:!1,navContainerClass:"owl-nav",navClass:["owl-prev","owl-next"],slideBy:1,dotClass:"owl-dot",dotsClass:"owl-dots",dots:!0,dotsEach:!1,dotsData:!1,dotsSpeed:!1,dotsContainer:!1},e.prototype.initialize=function(){var b,c=this._core.settings;this._controls.$relative=(c.navContainer?a(c.navContainer):a("<div>").addClass(c.navContainerClass).appendTo(this.$element)).addClass("disabled"),this._controls.$previous=a("<"+c.navElement+">").addClass(c.navClass[0]).html(c.navText[0]).prependTo(this._controls.$relative).on("click",a.proxy(function(a){this.prev(c.navSpeed)},this)),this._controls.$next=a("<"+c.navElement+">").addClass(c.navClass[1]).html(c.navText[1]).appendTo(this._controls.$relative).on("click",a.proxy(function(a){this.next(c.navSpeed)},this)),c.dotsData||(this._templates=[a('<button role="button">').addClass(c.dotClass).append(a("<span>")).prop("outerHTML")]),this._controls.$absolute=(c.dotsContainer?a(c.dotsContainer):a("<div>").addClass(c.dotsClass).appendTo(this.$element)).addClass("disabled"),this._controls.$absolute.on("click","button",a.proxy(function(b){var d=a(b.target).parent().is(this._controls.$absolute)?a(b.target).index():a(b.target).parent().index();b.preventDefault(),this.to(d,c.dotsSpeed)},this));for(b in this._overrides)this._core[b]=a.proxy(this[b],this)},e.prototype.destroy=function(){var a,b,c,d,e;e=this._core.settings;for(a in this._handlers)this.$element.off(a,this._handlers[a]);for(b in this._controls)"$relative"===b&&e.navContainer?this._controls[b].html(""):this._controls[b].remove();for(d in this.overides)this._core[d]=this._overrides[d];for(c in Object.getOwnPropertyNames(this))"function"!=typeof this[c]&&(this[c]=null)},e.prototype.update=function(){var a,b,c,d=this._core.clones().length/2,e=d+this._core.items().length,f=this._core.maximum(!0),g=this._core.settings,h=g.center||g.autoWidth||g.dotsData?1:g.dotsEach||g.items;if("page"!==g.slideBy&&(g.slideBy=Math.min(g.slideBy,g.items)),g.dots||"page"==g.slideBy)for(this._pages=[],a=d,b=0,c=0;a<e;a++){if(b>=h||0===b){if(this._pages.push({start:Math.min(f,a-d),end:a-d+h-1}),Math.min(f,a-d)===f)break;b=0,++c}b+=this._core.mergers(this._core.relative(a))}},e.prototype.draw=function(){var b,c=this._core.settings,d=this._core.items().length<=c.items,e=this._core.relative(this._core.current()),f=c.loop||c.rewind;this._controls.$relative.toggleClass("disabled",!c.nav||d),c.nav&&(this._controls.$previous.toggleClass("disabled",!f&&e<=this._core.minimum(!0)),this._controls.$next.toggleClass("disabled",!f&&e>=this._core.maximum(!0))),this._controls.$absolute.toggleClass("disabled",!c.dots||d),c.dots&&(b=this._pages.length-this._controls.$absolute.children().length,c.dotsData&&0!==b?this._controls.$absolute.html(this._templates.join("")):b>0?this._controls.$absolute.append(new Array(b+1).join(this._templates[0])):b<0&&this._controls.$absolute.children().slice(b).remove(),this._controls.$absolute.find(".active").removeClass("active"),this._controls.$absolute.children().eq(a.inArray(this.current(),this._pages)).addClass("active"))},e.prototype.onTrigger=function(b){var c=this._core.settings;b.page={index:a.inArray(this.current(),this._pages),count:this._pages.length,size:c&&(c.center||c.autoWidth||c.dotsData?1:c.dotsEach||c.items)}},e.prototype.current=function(){var b=this._core.relative(this._core.current());return a.grep(this._pages,a.proxy(function(a,c){return a.start<=b&&a.end>=b},this)).pop()},e.prototype.getPosition=function(b){var c,d,e=this._core.settings;return"page"==e.slideBy?(c=a.inArray(this.current(),this._pages),d=this._pages.length,b?++c:--c,c=this._pages[(c%d+d)%d].start):(c=this._core.relative(this._core.current()),d=this._core.items().length,b?c+=e.slideBy:c-=e.slideBy),c},e.prototype.next=function(b){a.proxy(this._overrides.to,this._core)(this.getPosition(!0),b)},e.prototype.prev=function(b){a.proxy(this._overrides.to,this._core)(this.getPosition(!1),b)},e.prototype.to=function(b,c,d){var e;!d&&this._pages.length?(e=this._pages.length,a.proxy(this._overrides.to,this._core)(this._pages[(b%e+e)%e].start,c)):a.proxy(this._overrides.to,this._core)(b,c)},a.fn.owlCarousel.Constructor.Plugins.Navigation=e}(window.Zepto||window.jQuery,window,document),function(a,b,c,d){"use strict";var e=function(c){this._core=c,this._hashes={},this.$element=this._core.$element,this._handlers={"initialized.owl.carousel":a.proxy(function(c){c.namespace&&"URLHash"===this._core.settings.startPosition&&a(b).trigger("hashchange.owl.navigation")},this),"prepared.owl.carousel":a.proxy(function(b){if(b.namespace){var c=a(b.content).find("[data-hash]").addBack("[data-hash]").attr("data-hash");if(!c)return;this._hashes[c]=b.content}},this),"changed.owl.carousel":a.proxy(function(c){if(c.namespace&&"position"===c.property.name){var d=this._core.items(this._core.relative(this._core.current())),e=a.map(this._hashes,function(a,b){return a===d?b:null}).join();if(!e||b.location.hash.slice(1)===e)return;b.location.hash=e}},this)},this._core.options=a.extend({},e.Defaults,this._core.options),this.$element.on(this._handlers),a(b).on("hashchange.owl.navigation",a.proxy(function(a){var c=b.location.hash.substring(1),e=this._core.$stage.children(),f=this._hashes[c]&&e.index(this._hashes[c]);f!==d&&f!==this._core.current()&&this._core.to(this._core.relative(f),!1,!0)},this))};e.Defaults={URLhashListener:!1},e.prototype.destroy=function(){var c,d;a(b).off("hashchange.owl.navigation");for(c in this._handlers)this._core.$element.off(c,this._handlers[c]);for(d in Object.getOwnPropertyNames(this))"function"!=typeof this[d]&&(this[d]=null)},a.fn.owlCarousel.Constructor.Plugins.Hash=e}(window.Zepto||window.jQuery,window,document),function(a,b,c,d){function e(b,c){var e=!1,f=b.charAt(0).toUpperCase()+b.slice(1);return a.each((b+" "+h.join(f+" ")+f).split(" "),function(a,b){if(g[b]!==d)return e=!c||b,!1}),e}function f(a){return e(a,!0)}var g=a("<support>").get(0).style,h="Webkit Moz O ms".split(" "),i={transition:{end:{WebkitTransition:"webkitTransitionEnd",MozTransition:"transitionend",OTransition:"oTransitionEnd",transition:"transitionend"}},animation:{end:{WebkitAnimation:"webkitAnimationEnd",MozAnimation:"animationend",OAnimation:"oAnimationEnd",animation:"animationend"}}},j={csstransforms:function(){return!!e("transform")},csstransforms3d:function(){return!!e("perspective")},csstransitions:function(){return!!e("transition")},cssanimations:function(){return!!e("animation")}};j.csstransitions()&&(a.support.transition=new String(f("transition")),a.support.transition.end=i.transition.end[a.support.transition]),j.cssanimations()&&(a.support.animation=new String(f("animation")),a.support.animation.end=i.animation.end[a.support.animation]),j.csstransforms()&&(a.support.transform=new String(f("transform")),a.support.transform3d=j.csstransforms3d())}(window.Zepto||window.jQuery,window,document);

/*!
 * clipboard.js v2.0.11
 * https://clipboardjs.com/
 *
 * Licensed MIT © Zeno Rocha
 */
!function(t,e){"object"==typeof exports&&"object"==typeof module?module.exports=e():"function"==typeof define&&define.amd?define([],e):"object"==typeof exports?exports.ClipboardJS=e():t.ClipboardJS=e()}(this,function(){return n={686:function(t,e,n){"use strict";n.d(e,{default:function(){return b}});var e=n(279),i=n.n(e),e=n(370),u=n.n(e),e=n(817),r=n.n(e);function c(t){try{return document.execCommand(t)}catch(t){return}}var a=function(t){t=r()(t);return c("cut"),t};function o(t,e){var n,o,t=(n=t,o="rtl"===document.documentElement.getAttribute("dir"),(t=document.createElement("textarea")).style.fontSize="12pt",t.style.border="0",t.style.padding="0",t.style.margin="0",t.style.position="absolute",t.style[o?"right":"left"]="-9999px",o=window.pageYOffset||document.documentElement.scrollTop,t.style.top="".concat(o,"px"),t.setAttribute("readonly",""),t.value=n,t);return e.container.appendChild(t),e=r()(t),c("copy"),t.remove(),e}var f=function(t){var e=1<arguments.length&&void 0!==arguments[1]?arguments[1]:{container:document.body},n="";return"string"==typeof t?n=o(t,e):t instanceof HTMLInputElement&&!["text","search","url","tel","password"].includes(null==t?void 0:t.type)?n=o(t.value,e):(n=r()(t),c("copy")),n};function l(t){return(l="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t})(t)}var s=function(){var t=0<arguments.length&&void 0!==arguments[0]?arguments[0]:{},e=t.action,n=void 0===e?"copy":e,o=t.container,e=t.target,t=t.text;if("copy"!==n&&"cut"!==n)throw new Error('Invalid "action" value, use either "copy" or "cut"');if(void 0!==e){if(!e||"object"!==l(e)||1!==e.nodeType)throw new Error('Invalid "target" value, use a valid Element');if("copy"===n&&e.hasAttribute("disabled"))throw new Error('Invalid "target" attribute. Please use "readonly" instead of "disabled" attribute');if("cut"===n&&(e.hasAttribute("readonly")||e.hasAttribute("disabled")))throw new Error('Invalid "target" attribute. You can\'t cut text from elements with "readonly" or "disabled" attributes')}return t?f(t,{container:o}):e?"cut"===n?a(e):f(e,{container:o}):void 0};function p(t){return(p="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t})(t)}function d(t,e){for(var n=0;n<e.length;n++){var o=e[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(t,o.key,o)}}function y(t,e){return(y=Object.setPrototypeOf||function(t,e){return t.__proto__=e,t})(t,e)}function h(n){var o=function(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Date.prototype.toString.call(Reflect.construct(Date,[],function(){})),!0}catch(t){return!1}}();return function(){var t,e=v(n);return t=o?(t=v(this).constructor,Reflect.construct(e,arguments,t)):e.apply(this,arguments),e=this,!(t=t)||"object"!==p(t)&&"function"!=typeof t?function(t){if(void 0!==t)return t;throw new ReferenceError("this hasn't been initialised - super() hasn't been called")}(e):t}}function v(t){return(v=Object.setPrototypeOf?Object.getPrototypeOf:function(t){return t.__proto__||Object.getPrototypeOf(t)})(t)}function m(t,e){t="data-clipboard-".concat(t);if(e.hasAttribute(t))return e.getAttribute(t)}var b=function(){!function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function");t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,writable:!0,configurable:!0}}),e&&y(t,e)}(r,i());var t,e,n,o=h(r);function r(t,e){var n;return function(t){if(!(t instanceof r))throw new TypeError("Cannot call a class as a function")}(this),(n=o.call(this)).resolveOptions(e),n.listenClick(t),n}return t=r,n=[{key:"copy",value:function(t){var e=1<arguments.length&&void 0!==arguments[1]?arguments[1]:{container:document.body};return f(t,e)}},{key:"cut",value:function(t){return a(t)}},{key:"isSupported",value:function(){var t=0<arguments.length&&void 0!==arguments[0]?arguments[0]:["copy","cut"],t="string"==typeof t?[t]:t,e=!!document.queryCommandSupported;return t.forEach(function(t){e=e&&!!document.queryCommandSupported(t)}),e}}],(e=[{key:"resolveOptions",value:function(){var t=0<arguments.length&&void 0!==arguments[0]?arguments[0]:{};this.action="function"==typeof t.action?t.action:this.defaultAction,this.target="function"==typeof t.target?t.target:this.defaultTarget,this.text="function"==typeof t.text?t.text:this.defaultText,this.container="object"===p(t.container)?t.container:document.body}},{key:"listenClick",value:function(t){var e=this;this.listener=u()(t,"click",function(t){return e.onClick(t)})}},{key:"onClick",value:function(t){var e=t.delegateTarget||t.currentTarget,n=this.action(e)||"copy",t=s({action:n,container:this.container,target:this.target(e),text:this.text(e)});this.emit(t?"success":"error",{action:n,text:t,trigger:e,clearSelection:function(){e&&e.focus(),window.getSelection().removeAllRanges()}})}},{key:"defaultAction",value:function(t){return m("action",t)}},{key:"defaultTarget",value:function(t){t=m("target",t);if(t)return document.querySelector(t)}},{key:"defaultText",value:function(t){return m("text",t)}},{key:"destroy",value:function(){this.listener.destroy()}}])&&d(t.prototype,e),n&&d(t,n),r}()},828:function(t){var e;"undefined"==typeof Element||Element.prototype.matches||((e=Element.prototype).matches=e.matchesSelector||e.mozMatchesSelector||e.msMatchesSelector||e.oMatchesSelector||e.webkitMatchesSelector),t.exports=function(t,e){for(;t&&9!==t.nodeType;){if("function"==typeof t.matches&&t.matches(e))return t;t=t.parentNode}}},438:function(t,e,n){var u=n(828);function i(t,e,n,o,r){var i=function(e,n,t,o){return function(t){t.delegateTarget=u(t.target,n),t.delegateTarget&&o.call(e,t)}}.apply(this,arguments);return t.addEventListener(n,i,r),{destroy:function(){t.removeEventListener(n,i,r)}}}t.exports=function(t,e,n,o,r){return"function"==typeof t.addEventListener?i.apply(null,arguments):"function"==typeof n?i.bind(null,document).apply(null,arguments):("string"==typeof t&&(t=document.querySelectorAll(t)),Array.prototype.map.call(t,function(t){return i(t,e,n,o,r)}))}},879:function(t,n){n.node=function(t){return void 0!==t&&t instanceof HTMLElement&&1===t.nodeType},n.nodeList=function(t){var e=Object.prototype.toString.call(t);return void 0!==t&&("[object NodeList]"===e||"[object HTMLCollection]"===e)&&"length"in t&&(0===t.length||n.node(t[0]))},n.string=function(t){return"string"==typeof t||t instanceof String},n.fn=function(t){return"[object Function]"===Object.prototype.toString.call(t)}},370:function(t,e,n){var f=n(879),l=n(438);t.exports=function(t,e,n){if(!t&&!e&&!n)throw new Error("Missing required arguments");if(!f.string(e))throw new TypeError("Second argument must be a String");if(!f.fn(n))throw new TypeError("Third argument must be a Function");if(f.node(t))return c=e,a=n,(u=t).addEventListener(c,a),{destroy:function(){u.removeEventListener(c,a)}};if(f.nodeList(t))return o=t,r=e,i=n,Array.prototype.forEach.call(o,function(t){t.addEventListener(r,i)}),{destroy:function(){Array.prototype.forEach.call(o,function(t){t.removeEventListener(r,i)})}};if(f.string(t))return t=t,e=e,n=n,l(document.body,t,e,n);throw new TypeError("First argument must be a String, HTMLElement, HTMLCollection, or NodeList");var o,r,i,u,c,a}},817:function(t){t.exports=function(t){var e,n="SELECT"===t.nodeName?(t.focus(),t.value):"INPUT"===t.nodeName||"TEXTAREA"===t.nodeName?((e=t.hasAttribute("readonly"))||t.setAttribute("readonly",""),t.select(),t.setSelectionRange(0,t.value.length),e||t.removeAttribute("readonly"),t.value):(t.hasAttribute("contenteditable")&&t.focus(),n=window.getSelection(),(e=document.createRange()).selectNodeContents(t),n.removeAllRanges(),n.addRange(e),n.toString());return n}},279:function(t){function e(){}e.prototype={on:function(t,e,n){var o=this.e||(this.e={});return(o[t]||(o[t]=[])).push({fn:e,ctx:n}),this},once:function(t,e,n){var o=this;function r(){o.off(t,r),e.apply(n,arguments)}return r._=e,this.on(t,r,n)},emit:function(t){for(var e=[].slice.call(arguments,1),n=((this.e||(this.e={}))[t]||[]).slice(),o=0,r=n.length;o<r;o++)n[o].fn.apply(n[o].ctx,e);return this},off:function(t,e){var n=this.e||(this.e={}),o=n[t],r=[];if(o&&e)for(var i=0,u=o.length;i<u;i++)o[i].fn!==e&&o[i].fn._!==e&&r.push(o[i]);return r.length?n[t]=r:delete n[t],this}},t.exports=e,t.exports.TinyEmitter=e}},r={},o.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return o.d(e,{a:e}),e},o.d=function(t,e){for(var n in e)o.o(e,n)&&!o.o(t,n)&&Object.defineProperty(t,n,{enumerable:!0,get:e[n]})},o.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},o(686).default;function o(t){if(r[t])return r[t].exports;var e=r[t]={exports:{}};return n[t](e,e.exports,o),e.exports}var n,r});

/*! js-cookie v3.0.1 | MIT */
!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?module.exports=t():"function"==typeof define&&define.amd?define(t):(e=e||self,function(){var n=e.Cookies,o=e.Cookies=t();o.noConflict=function(){return e.Cookies=n,o}}())}(this,(function(){"use strict";function e(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var o in n)e[o]=n[o]}return e}return function t(n,o){function r(t,r,i){if("undefined"!=typeof document){"number"==typeof(i=e({},o,i)).expires&&(i.expires=new Date(Date.now()+864e5*i.expires)),i.expires&&(i.expires=i.expires.toUTCString()),t=encodeURIComponent(t).replace(/%(2[346B]|5E|60|7C)/g,decodeURIComponent).replace(/[()]/g,escape);var c="";for(var u in i)i[u]&&(c+="; "+u,!0!==i[u]&&(c+="="+i[u].split(";")[0]));return document.cookie=t+"="+n.write(r,t)+c}}return Object.create({set:r,get:function(e){if("undefined"!=typeof document&&(!arguments.length||e)){for(var t=document.cookie?document.cookie.split("; "):[],o={},r=0;r<t.length;r++){var i=t[r].split("="),c=i.slice(1).join("=");try{var u=decodeURIComponent(i[0]);if(o[u]=n.read(c,u),e===u)break}catch(e){}}return e?o[e]:o}},remove:function(t,n){r(t,"",e({},n,{expires:-1}))},withAttributes:function(n){return t(this.converter,e({},this.attributes,n))},withConverter:function(n){return t(e({},this.converter,n),this.attributes)}},{attributes:{value:Object.freeze(o)},converter:{value:Object.freeze(n)}})}({read:function(e){return'"'===e[0]&&(e=e.slice(1,-1)),e.replace(/(%[\dA-F]{2})+/gi,decodeURIComponent)},write:function(e){return encodeURIComponent(e).replace(/%(2[346BF]|3[AC-F]|40|5[BDE]|60|7[BCD])/g,decodeURIComponent)}},{path:"/"})}));
/** Abstract base class for collection plugins.
	Written by Keith Wood (kbwood{at}iinet.com.au) December 2013.
	Licensed under the MIT (https://github.com/jquery/jquery/blob/master/MIT-LICENSE.txt) license. */
(function(){var j=false;window.JQClass=function(){};JQClass.classes={};JQClass.extend=function extender(f){var g=this.prototype;j=true;var h=new this();j=false;for(var i in f){h[i]=typeof f[i]=='function'&&typeof g[i]=='function'?(function(d,e){return function(){var b=this._super;this._super=function(a){return g[d].apply(this,a)};var c=e.apply(this,arguments);this._super=b;return c}})(i,f[i]):f[i]}function JQClass(){if(!j&&this._init){this._init.apply(this,arguments)}}JQClass.prototype=h;JQClass.prototype.constructor=JQClass;JQClass.extend=extender;return JQClass}})();(function($){JQClass.classes.JQPlugin=JQClass.extend({name:'plugin',defaultOptions:{},regionalOptions:{},_getters:[],_getMarker:function(){return'is-'+this.name},_init:function(){$.extend(this.defaultOptions,(this.regionalOptions&&this.regionalOptions[''])||{});var c=camelCase(this.name);$[c]=this;$.fn[c]=function(a){var b=Array.prototype.slice.call(arguments,1);if($[c]._isNotChained(a,b)){return $[c][a].apply($[c],[this[0]].concat(b))}return this.each(function(){if(typeof a==='string'){if(a[0]==='_'||!$[c][a]){throw'Unknown method: '+a;}$[c][a].apply($[c],[this].concat(b))}else{$[c]._attach(this,a)}})}},setDefaults:function(a){$.extend(this.defaultOptions,a||{})},_isNotChained:function(a,b){if(a==='option'&&(b.length===0||(b.length===1&&typeof b[0]==='string'))){return true}return $.inArray(a,this._getters)>-1},_attach:function(a,b){a=$(a);if(a.hasClass(this._getMarker())){return}a.addClass(this._getMarker());b=$.extend({},this.defaultOptions,this._getMetadata(a),b||{});var c=$.extend({name:this.name,elem:a,options:b},this._instSettings(a,b));a.data(this.name,c);this._postAttach(a,c);this.option(a,b)},_instSettings:function(a,b){return{}},_postAttach:function(a,b){},_getMetadata:function(d){try{var f=d.data(this.name.toLowerCase())||'';f=f.replace(/'/g,'"');f=f.replace(/([a-zA-Z0-9]+):/g,function(a,b,i){var c=f.substring(0,i).match(/"/g);return(!c||c.length%2===0?'"'+b+'":':b+':')});f=$.parseJSON('{'+f+'}');for(var g in f){var h=f[g];if(typeof h==='string'&&h.match(/^new Date\((.*)\)$/)){f[g]=eval(h)}}return f}catch(e){return{}}},_getInst:function(a){return $(a).data(this.name)||{}},option:function(a,b,c){a=$(a);var d=a.data(this.name);if(!b||(typeof b==='string'&&c==null)){var e=(d||{}).options;return(e&&b?e[b]:e)}if(!a.hasClass(this._getMarker())){return}var e=b||{};if(typeof b==='string'){e={};e[b]=c}this._optionsChanged(a,d,e);$.extend(d.options,e)},_optionsChanged:function(a,b,c){},destroy:function(a){a=$(a);if(!a.hasClass(this._getMarker())){return}this._preDestroy(a,this._getInst(a));a.removeData(this.name).removeClass(this._getMarker())},_preDestroy:function(a,b){}});function camelCase(c){return c.replace(/-([a-z])/g,function(a,b){return b.toUpperCase()})}$.JQPlugin={createPlugin:function(a,b){if(typeof a==='object'){b=a;a='JQPlugin'}a=camelCase(a);var c=camelCase(b.name);JQClass.classes[c]=JQClass.classes[a].extend(b);new JQClass.classes[c]()}}})(jQuery);


/*! http://keith-wood.name/countdown.html
	Countdown for jQuery v2.1.0.
	Written by Keith Wood (wood.keith{at}optusnet.com.au) January 2008.
	Available under the MIT (http://keith-wood.name/licence.html) license.
	Please attribute the author if you use it.
*/
!function(a){"use strict";var b="countdown",c=0,d=1,e=2,f=3,g=4,h=5,i=6;a.JQPlugin.createPlugin({name:b,defaultOptions:{until:null,since:null,timezone:null,serverSync:null,format:"dHMS",layout:"",compact:!1,padZeroes:!1,significant:0,description:"",expiryUrl:"",expiryText:"",alwaysExpire:!1,onExpiry:null,onTick:null,tickInterval:1},regionalOptions:{"":{labels:["Years","Months","Weeks","Days","Hours","Minutes","Seconds"],labels1:["Year","Month","Week","Day","Hour","Minute","Second"],compactLabels:["y","m","w","d"],whichLabels:null,digits:["0","1","2","3","4","5","6","7","8","9"],timeSeparator:":",isRTL:!1}},_rtlClass:b+"-rtl",_sectionClass:b+"-section",_amountClass:b+"-amount",_periodClass:b+"-period",_rowClass:b+"-row",_holdingClass:b+"-holding",_showClass:b+"-show",_descrClass:b+"-descr",_timerElems:[],_init:function(){function b(a){var h=a<1e12?e?window.performance.now()+window.performance.timing.navigationStart:d():a||d();h-g>=1e3&&(c._updateElems(),g=h),f(b)}var c=this;this._super(),this._serverSyncs=[];var d="function"==typeof Date.now?Date.now:function(){return(new Date).getTime()},e=window.performance&&"function"==typeof window.performance.now,f=window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||window.oRequestAnimationFrame||window.msRequestAnimationFrame||null,g=0;!f||a.noRequestAnimationFrame?(a.noRequestAnimationFrame=null,a.countdown._timer=setInterval(function(){c._updateElems()},1e3)):(g=window.animationStartTime||window.webkitAnimationStartTime||window.mozAnimationStartTime||window.oAnimationStartTime||window.msAnimationStartTime||d(),f(b))},UTCDate:function(a,b,c,d,e,f,g,h){"object"==typeof b&&b instanceof Date&&(h=b.getMilliseconds(),g=b.getSeconds(),f=b.getMinutes(),e=b.getHours(),d=b.getDate(),c=b.getMonth(),b=b.getFullYear());var i=new Date;return i.setUTCFullYear(b),i.setUTCDate(1),i.setUTCMonth(c||0),i.setUTCDate(d||1),i.setUTCHours(e||0),i.setUTCMinutes((f||0)-(Math.abs(a)<30?60*a:a)),i.setUTCSeconds(g||0),i.setUTCMilliseconds(h||0),i},periodsToSeconds:function(a){return 31557600*a[0]+2629800*a[1]+604800*a[2]+86400*a[3]+3600*a[4]+60*a[5]+a[6]},resync:function(){var b=this;a("."+this._getMarker()).each(function(){var c=a.data(this,b.name);if(c.options.serverSync){for(var d=null,e=0;e<b._serverSyncs.length;e++)if(b._serverSyncs[e][0]===c.options.serverSync){d=b._serverSyncs[e];break}if(b._eqNull(d[2])){var f=a.isFunction(c.options.serverSync)?c.options.serverSync.apply(this,[]):null;d[2]=(f?(new Date).getTime()-f.getTime():0)-d[1]}c._since&&c._since.setMilliseconds(c._since.getMilliseconds()+d[2]),c._until.setMilliseconds(c._until.getMilliseconds()+d[2])}});for(var c=0;c<b._serverSyncs.length;c++)b._eqNull(b._serverSyncs[c][2])||(b._serverSyncs[c][1]+=b._serverSyncs[c][2],delete b._serverSyncs[c][2])},_instSettings:function(a,b){return{_periods:[0,0,0,0,0,0,0]}},_addElem:function(a){this._hasElem(a)||this._timerElems.push(a)},_hasElem:function(b){return a.inArray(b,this._timerElems)>-1},_removeElem:function(b){this._timerElems=a.map(this._timerElems,function(a){return a===b?null:a})},_updateElems:function(){for(var a=this._timerElems.length-1;a>=0;a--)this._updateCountdown(this._timerElems[a])},_optionsChanged:function(b,c,d){d.layout&&(d.layout=d.layout.replace(/&lt;/g,"<").replace(/&gt;/g,">")),this._resetExtraLabels(c.options,d);var e=c.options.timezone!==d.timezone;a.extend(c.options,d),this._adjustSettings(b,c,!this._eqNull(d.until)||!this._eqNull(d.since)||e);var f=new Date;(c._since&&c._since<f||c._until&&c._until>f)&&this._addElem(b[0]),this._updateCountdown(b,c)},_updateCountdown:function(b,c){if(b=b.jquery?b:a(b),c=c||this._getInst(b)){if(b.html(this._generateHTML(c)).toggleClass(this._rtlClass,c.options.isRTL),"pause"!==c._hold&&a.isFunction(c.options.onTick)){var d="lap"!==c._hold?c._periods:this._calculatePeriods(c,c._show,c.options.significant,new Date);1!==c.options.tickInterval&&this.periodsToSeconds(d)%c.options.tickInterval!==0||c.options.onTick.apply(b[0],[d])}var e="pause"!==c._hold&&(c._since?c._now.getTime()<c._since.getTime():c._now.getTime()>=c._until.getTime());if(e&&!c._expiring){if(c._expiring=!0,this._hasElem(b[0])||c.options.alwaysExpire){if(this._removeElem(b[0]),a.isFunction(c.options.onExpiry)&&c.options.onExpiry.apply(b[0],[]),c.options.expiryText){var f=c.options.layout;c.options.layout=c.options.expiryText,this._updateCountdown(b[0],c),c.options.layout=f}c.options.expiryUrl&&(window.location=c.options.expiryUrl)}c._expiring=!1}else"pause"===c._hold&&this._removeElem(b[0])}},_resetExtraLabels:function(a,b){var c=null;for(c in b)c.match(/[Ll]abels[02-9]|compactLabels1/)&&(a[c]=b[c]);for(c in a)c.match(/[Ll]abels[02-9]|compactLabels1/)&&"undefined"==typeof b[c]&&(a[c]=null)},_eqNull:function(a){return"undefined"==typeof a||null===a},_adjustSettings:function(b,c,d){for(var e=null,f=0;f<this._serverSyncs.length;f++)if(this._serverSyncs[f][0]===c.options.serverSync){e=this._serverSyncs[f][1];break}var g=null,h=null;if(this._eqNull(e)){var i=a.isFunction(c.options.serverSync)?c.options.serverSync.apply(b[0],[]):null;g=new Date,h=i?g.getTime()-i.getTime():0,this._serverSyncs.push([c.options.serverSync,h])}else g=new Date,h=c.options.serverSync?e:0;var j=c.options.timezone;j=this._eqNull(j)?-g.getTimezoneOffset():j,(d||!d&&this._eqNull(c._until)&&this._eqNull(c._since))&&(c._since=c.options.since,this._eqNull(c._since)||(c._since=this.UTCDate(j,this._determineTime(c._since,null)),c._since&&h&&c._since.setMilliseconds(c._since.getMilliseconds()+h)),c._until=this.UTCDate(j,this._determineTime(c.options.until,g)),h&&c._until.setMilliseconds(c._until.getMilliseconds()+h)),c._show=this._determineShow(c)},_preDestroy:function(a,b){this._removeElem(a[0]),a.empty()},pause:function(a){this._hold(a,"pause")},lap:function(a){this._hold(a,"lap")},resume:function(a){this._hold(a,null)},toggle:function(b){var c=a.data(b,this.name)||{};this[c._hold?"resume":"pause"](b)},toggleLap:function(b){var c=a.data(b,this.name)||{};this[c._hold?"resume":"lap"](b)},_hold:function(b,c){var d=a.data(b,this.name);if(d){if("pause"===d._hold&&!c){d._periods=d._savePeriods;var e=d._since?"-":"+";d[d._since?"_since":"_until"]=this._determineTime(e+d._periods[0]+"y"+e+d._periods[1]+"o"+e+d._periods[2]+"w"+e+d._periods[3]+"d"+e+d._periods[4]+"h"+e+d._periods[5]+"m"+e+d._periods[6]+"s"),this._addElem(b)}d._hold=c,d._savePeriods="pause"===c?d._periods:null,a.data(b,this.name,d),this._updateCountdown(b,d)}},getTimes:function(b){var c=a.data(b,this.name);return c?"pause"===c._hold?c._savePeriods:c._hold?this._calculatePeriods(c,c._show,c.options.significant,new Date):c._periods:null},_determineTime:function(a,b){var c=this,d=function(a){var b=new Date;return b.setTime(b.getTime()+1e3*a),b},e=function(a){a=a.toLowerCase();for(var b=new Date,d=b.getFullYear(),e=b.getMonth(),f=b.getDate(),g=b.getHours(),h=b.getMinutes(),i=b.getSeconds(),j=/([+-]?[0-9]+)\s*(s|m|h|d|w|o|y)?/g,k=j.exec(a);k;){switch(k[2]||"s"){case"s":i+=parseInt(k[1],10);break;case"m":h+=parseInt(k[1],10);break;case"h":g+=parseInt(k[1],10);break;case"d":f+=parseInt(k[1],10);break;case"w":f+=7*parseInt(k[1],10);break;case"o":e+=parseInt(k[1],10),f=Math.min(f,c._getDaysInMonth(d,e));break;case"y":d+=parseInt(k[1],10),f=Math.min(f,c._getDaysInMonth(d,e))}k=j.exec(a)}return new Date(d,e,f,g,h,i,0)},f=this._eqNull(a)?b:"string"==typeof a?e(a):"number"==typeof a?d(a):a;return f&&f.setMilliseconds(0),f},_getDaysInMonth:function(a,b){return 32-new Date(a,b,32).getDate()},_normalLabels:function(a){return a},_generateHTML:function(b){var j=this;b._periods=b._hold?b._periods:this._calculatePeriods(b,b._show,b.options.significant,new Date);var k=!1,l=0,m=b.options.significant,n=a.extend({},b._show),o=null;for(o=c;o<=i;o++)k=k||"?"===b._show[o]&&b._periods[o]>0,n[o]="?"!==b._show[o]||k?b._show[o]:null,l+=n[o]?1:0,m-=b._periods[o]>0?1:0;var p=[!1,!1,!1,!1,!1,!1,!1];for(o=i;o>=c;o--)b._show[o]&&(b._periods[o]?p[o]=!0:(p[o]=m>0,m--));var q=b.options.compact?b.options.compactLabels:b.options.labels,r=b.options.whichLabels||this._normalLabels,s=function(a){var c=b.options["compactLabels"+r(b._periods[a])];return n[a]?j._translateDigits(b,b._periods[a])+(c?c[a]:q[a])+" ":""},t=b.options.padZeroes?2:1,u=function(a){var c=b.options["labels"+r(b._periods[a])];return!b.options.significant&&n[a]||b.options.significant&&p[a]?'<span class="'+j._sectionClass+'"><span class="'+j._amountClass+'">'+j._minDigits(b,b._periods[a],t)+'</span><span class="'+j._periodClass+'">'+(c?c[a]:q[a])+"</span></span>":""};return b.options.layout?this._buildLayout(b,n,b.options.layout,b.options.compact,b.options.significant,p):(b.options.compact?'<span class="'+this._rowClass+" "+this._amountClass+(b._hold?" "+this._holdingClass:"")+'">'+s(c)+s(d)+s(e)+s(f)+(n[g]?this._minDigits(b,b._periods[g],2):"")+(n[h]?(n[g]?b.options.timeSeparator:"")+this._minDigits(b,b._periods[h],2):"")+(n[i]?(n[g]||n[h]?b.options.timeSeparator:"")+this._minDigits(b,b._periods[i],2):""):'<span class="'+this._rowClass+" "+this._showClass+(b.options.significant||l)+(b._hold?" "+this._holdingClass:"")+'">'+u(c)+u(d)+u(e)+u(f)+u(g)+u(h)+u(i))+"</span>"+(b.options.description?'<span class="'+this._rowClass+" "+this._descrClass+'">'+b.options.description+"</span>":"")},_buildLayout:function(b,j,k,l,m,n){for(var o=b.options[l?"compactLabels":"labels"],p=b.options.whichLabels||this._normalLabels,q=function(a){return(b.options[(l?"compactLabels":"labels")+p(b._periods[a])]||o)[a]},r=function(a,c){return b.options.digits[Math.floor(a/c)%10]},s={desc:b.options.description,sep:b.options.timeSeparator,yl:q(c),yn:this._minDigits(b,b._periods[c],1),ynn:this._minDigits(b,b._periods[c],2),ynnn:this._minDigits(b,b._periods[c],3),y1:r(b._periods[c],1),y10:r(b._periods[c],10),y100:r(b._periods[c],100),y1000:r(b._periods[c],1e3),ol:q(d),on:this._minDigits(b,b._periods[d],1),onn:this._minDigits(b,b._periods[d],2),onnn:this._minDigits(b,b._periods[d],3),o1:r(b._periods[d],1),o10:r(b._periods[d],10),o100:r(b._periods[d],100),o1000:r(b._periods[d],1e3),wl:q(e),wn:this._minDigits(b,b._periods[e],1),wnn:this._minDigits(b,b._periods[e],2),wnnn:this._minDigits(b,b._periods[e],3),w1:r(b._periods[e],1),w10:r(b._periods[e],10),w100:r(b._periods[e],100),w1000:r(b._periods[e],1e3),dl:q(f),dn:this._minDigits(b,b._periods[f],1),dnn:this._minDigits(b,b._periods[f],2),dnnn:this._minDigits(b,b._periods[f],3),d1:r(b._periods[f],1),d10:r(b._periods[f],10),d100:r(b._periods[f],100),d1000:r(b._periods[f],1e3),hl:q(g),hn:this._minDigits(b,b._periods[g],1),hnn:this._minDigits(b,b._periods[g],2),hnnn:this._minDigits(b,b._periods[g],3),h1:r(b._periods[g],1),h10:r(b._periods[g],10),h100:r(b._periods[g],100),h1000:r(b._periods[g],1e3),ml:q(h),mn:this._minDigits(b,b._periods[h],1),mnn:this._minDigits(b,b._periods[h],2),mnnn:this._minDigits(b,b._periods[h],3),m1:r(b._periods[h],1),m10:r(b._periods[h],10),m100:r(b._periods[h],100),m1000:r(b._periods[h],1e3),sl:q(i),sn:this._minDigits(b,b._periods[i],1),snn:this._minDigits(b,b._periods[i],2),snnn:this._minDigits(b,b._periods[i],3),s1:r(b._periods[i],1),s10:r(b._periods[i],10),s100:r(b._periods[i],100),s1000:r(b._periods[i],1e3)},t=k,u=c;u<=i;u++){var v="yowdhms".charAt(u),w=new RegExp("\\{"+v+"<\\}([\\s\\S]*)\\{"+v+">\\}","g");t=t.replace(w,!m&&j[u]||m&&n[u]?"$1":"")}return a.each(s,function(a,b){var c=new RegExp("\\{"+a+"\\}","g");t=t.replace(c,b)}),t},_minDigits:function(a,b,c){return b=""+b,b.length>=c?this._translateDigits(a,b):(b="0000000000"+b,this._translateDigits(a,b.substr(b.length-c)))},_translateDigits:function(a,b){return(""+b).replace(/[0-9]/g,function(b){return a.options.digits[b]})},_determineShow:function(a){var b=a.options.format,j=[];return j[c]=b.match("y")?"?":b.match("Y")?"!":null,j[d]=b.match("o")?"?":b.match("O")?"!":null,j[e]=b.match("w")?"?":b.match("W")?"!":null,j[f]=b.match("d")?"?":b.match("D")?"!":null,j[g]=b.match("h")?"?":b.match("H")?"!":null,j[h]=b.match("m")?"?":b.match("M")?"!":null,j[i]=b.match("s")?"?":b.match("S")?"!":null,j},_calculatePeriods:function(a,b,j,k){a._now=k,a._now.setMilliseconds(0);var l=new Date(a._now.getTime());a._since?k.getTime()<a._since.getTime()?a._now=k=l:k=a._since:(l.setTime(a._until.getTime()),k.getTime()>a._until.getTime()&&(a._now=k=l));var m=[0,0,0,0,0,0,0];if(b[c]||b[d]){var n=this._getDaysInMonth(k.getFullYear(),k.getMonth()),o=this._getDaysInMonth(l.getFullYear(),l.getMonth()),p=l.getDate()===k.getDate()||l.getDate()>=Math.min(n,o)&&k.getDate()>=Math.min(n,o),q=function(a){return 60*(60*a.getHours()+a.getMinutes())+a.getSeconds()},r=Math.max(0,12*(l.getFullYear()-k.getFullYear())+l.getMonth()-k.getMonth()+(l.getDate()<k.getDate()&&!p||p&&q(l)<q(k)?-1:0));m[c]=b[c]?Math.floor(r/12):0,m[d]=b[d]?r-12*m[c]:0,k=new Date(k.getTime());var s=k.getDate()===n,t=this._getDaysInMonth(k.getFullYear()+m[c],k.getMonth()+m[d]);k.getDate()>t&&k.setDate(t),k.setFullYear(k.getFullYear()+m[c]),k.setMonth(k.getMonth()+m[d]),s&&k.setDate(t)}var u=Math.floor((l.getTime()-k.getTime())/1e3),v=null,w=function(a,c){m[a]=b[a]?Math.floor(u/c):0,u-=m[a]*c};if(w(e,604800),w(f,86400),w(g,3600),w(h,60),w(i,1),u>0&&!a._since){var x=[1,12,4.3482,7,24,60,60],y=i,z=1;for(v=i;v>=c;v--)b[v]&&(m[y]>=z&&(m[y]=0,u=1),u>0&&(m[v]++,u=0,y=v,z=1)),z*=x[v]}if(j)for(v=c;v<=i;v++)j&&m[v]?j--:j||(m[v]=0);return m}})}(jQuery);

/* https://github.com/mhuggins/jquery-countTo
   CountTo */
(function(e){function t(e,t){return e.toFixed(t.decimals)}e.fn.countTo=function(t){t=t||{};return e(this).each(function(){function l(){a+=i;u++;c(a);if(typeof n.onUpdate=="function"){n.onUpdate.call(s,a)}if(u>=r){o.removeData("countTo");clearInterval(f.interval);a=n.to;if(typeof n.onComplete=="function"){n.onComplete.call(s,a)}}}function c(e){var t=n.formatter.call(s,e,n);o.text(t)}var n=e.extend({},e.fn.countTo.defaults,{from:e(this).data("from"),to:e(this).data("to"),speed:e(this).data("speed"),refreshInterval:e(this).data("refresh-interval"),decimals:e(this).data("decimals")},t);var r=Math.ceil(n.speed/n.refreshInterval),i=(n.to-n.from)/r;var s=this,o=e(this),u=0,a=n.from,f=o.data("countTo")||{};o.data("countTo",f);if(f.interval){clearInterval(f.interval)}f.interval=setInterval(l,n.refreshInterval);c(a)})};e.fn.countTo.defaults={from:0,to:0,speed:1e3,refreshInterval:100,decimals:0,formatter:t,onUpdate:null,onComplete:null}})(jQuery);

/**
 * @preserve
 * Jribbble v2.0.4 | Thu Jun 4 01:49:29 2015 -0400
 * Copyright (c) 2015, Tyler Gaw me@tylergaw.com
 * Released under the ISC-LICENSE
 */
!function(e,t,r,s){"use strict";e.jribbble={};var n=null,o="https://api.dribbble.com/v1",i=["animated","attachments","debuts","playoffs","rebounds","teams"],u={token:"Jribbble: Missing Dribbble access token. Set one with $.jribbble.accessToken = YOUR_ACCESS_TOKEN. If you do not have an access token, you must register a new application at https://dribbble.com/account/applications/new",singular:function(e){return e.substr(0,e.length-1)},idRequired:function(e){return"Jribbble: You have to provide a "+this.singular(e)+' ID. ex: $.jribbble.%@("1234").'.replace(/%@/g,e)},subResource:function(e){return"Jribbble: You have to provide a "+this.singular(e)+' ID to get %@. ex: $.jribbble.%@("1234").%@()'.replace(/%@/g,e)},shotId:function(e){return"Jribbble: You have to provide a shot ID to get %@. ex: "+' $.jribbble.shots("1234").%@()'.replace(/%@/g,e)},commentLikes:'Jribbble: You have to provide a comment ID to get likes. ex:  $.jribbble.shots("1234").comments("456").likes()'},c=function(e,t){if(e&&"object"!=typeof e)return e;throw new Error(u.idRequired(t))},l=function(e){var t={};return e.forEach(function(e){t[e]=d.call(this,e)}.bind(this)),t},h=function(t){var r=e.param(t);return r?"?"+r:""},a=function(e){if(0!==e.length){var t=e[0],r=typeof t,s={};if("number"===r||"string"===r){var n=i.indexOf(t);n>-1?s.list=t:s.resource=t}else"object"===r&&(s=t);return s}},b=function(){var t=e.extend({},e.Deferred()),r=function(){return this.methods=[],this.response=null,this.flushed=!1,this.add=function(e){this.flushed?e(this.scope):this.methods.push(e)},this.flush=function(e){if(!this.flushed){for(this.scope=e,this.flushed=!0;this.methods[0];)this.methods.shift()(e);return e}},this};return t.queue=new r,t.url=o,t.get=function(){return n?(e.ajax({type:"GET",url:this.url,beforeSend:function(e){e.setRequestHeader("Authorization","Bearer "+n)},success:function(e){this.resolve(e)}.bind(this),error:function(e){this.reject(e)}.bind(this)}),this):(console.error(u.token),!1)},t},f=function(t){return function(r){return e.extend(this,b()),this.queue.add(function(e){e.url+="/"+t+"/"+r}),setTimeout(function(){this.queue.flush(this).get()}.bind(this)),this}},d=function(e){return function(t){return this.queue.add(function(r){r.url+="/"+e+"/"+h(t||{})}),this}};e.jribbble.shots=function(t,r){var s=a([].slice.call(arguments))||{},n=r||{},o=function(t){return function(r,s){var n=a([].slice.call(arguments))||{},o=s||{};return this.queue.add(function(r){if(!r.shotId)throw new Error(u.shotId(t));r.url+="/"+t+"/",n.resource&&(r.url+=n.resource,delete n.resource),r.url+=h(e.extend(n,o))}),this}},i=function(){return e.extend(this,b()),this.url+="/shots/",this.queue.add(function(t){s.resource&&(t.shotId=s.resource,t.url+=s.resource,delete s.resource),t.url+=h(e.extend(s,n))}),setTimeout(function(){this.queue.flush(this).get()}.bind(this)),this};return i.prototype.attachments=o("attachments"),i.prototype.buckets=o("buckets"),i.prototype.likes=o("likes"),i.prototype.projects=o("projects"),i.prototype.rebounds=o("rebounds"),i.prototype.comments=function(t,r){var s=a([].slice.call(arguments))||{},n=r||{};return this.queue.add(function(t){if(!t.shotId)throw new Error(u.shotId("comments"));t.url+="/comments/",s.resource&&(t.commentId=s.resource,t.url+=s.resource+"/",delete s.resource),t.url+=h(e.extend(s,n))}),this.likes=function(e){var t=e||{};return this.queue.add(function(e){if(!e.commentId)throw new Error(u.commentLikes);e.url+="likes/"+h(t)}),this},this},new i},e.jribbble.teams=function(e){var t="teams",r=c(e,t),s=f.call(this,t);return s.prototype=l.call(this,["members","shots"]),new s(r)},e.jribbble.users=function(e){var t="users",r=c(e,t),s=f.call(this,t);return s.prototype=l.call(this,["buckets","followers","following","likes","projects","shots","teams"]),s.prototype.isFollowing=function(e){return this.queue.add(function(t){t.url+="/following/"+e}),this},new s(r)},e.jribbble.buckets=function(e){var t="buckets",r=c(e,t),s=f.call(this,t);return s.prototype=l.call(this,["shots"]),new s(r)},e.jribbble.projects=function(e){var t="projects",r=c(e,t),s=f.call(this,t);return s.prototype=l.call(this,["shots"]),new s(r)},e.jribbble.setToken=function(e){return n=e,this}}(jQuery,window,document);

/*
 * jQuery Easing v1.4.1 - http://gsgd.co.uk/sandbox/jquery/easing/
 * Open source under the BSD License.
 * Copyright © 2008 George McGinley Smith
 * All rights reserved.
 * https://raw.github.com/gdsmith/jquery.easing/master/LICENSE
*/
!function(n){"function"==typeof define&&define.amd?define(["jquery"],function(e){return n(e)}):"object"==typeof module&&"object"==typeof module.exports?module.exports=n(require("jquery")):n(jQuery)}(function(n){function e(n){var e=7.5625,t=2.75;return n<1/t?e*n*n:n<2/t?e*(n-=1.5/t)*n+.75:n<2.5/t?e*(n-=2.25/t)*n+.9375:e*(n-=2.625/t)*n+.984375}void 0!==n.easing&&(n.easing.jswing=n.easing.swing);var t=Math.pow,u=Math.sqrt,r=Math.sin,i=Math.cos,a=Math.PI,o=1.70158,c=1.525*o,s=2*a/3,f=2*a/4.5;return n.extend(n.easing,{def:"easeOutQuad",swing:function(e){return n.easing[n.easing.def](e)},easeInQuad:function(n){return n*n},easeOutQuad:function(n){return 1-(1-n)*(1-n)},easeInOutQuad:function(n){return n<.5?2*n*n:1-t(-2*n+2,2)/2},easeInCubic:function(n){return n*n*n},easeOutCubic:function(n){return 1-t(1-n,3)},easeInOutCubic:function(n){return n<.5?4*n*n*n:1-t(-2*n+2,3)/2},easeInQuart:function(n){return n*n*n*n},easeOutQuart:function(n){return 1-t(1-n,4)},easeInOutQuart:function(n){return n<.5?8*n*n*n*n:1-t(-2*n+2,4)/2},easeInQuint:function(n){return n*n*n*n*n},easeOutQuint:function(n){return 1-t(1-n,5)},easeInOutQuint:function(n){return n<.5?16*n*n*n*n*n:1-t(-2*n+2,5)/2},easeInSine:function(n){return 1-i(n*a/2)},easeOutSine:function(n){return r(n*a/2)},easeInOutSine:function(n){return-(i(a*n)-1)/2},easeInExpo:function(n){return 0===n?0:t(2,10*n-10)},easeOutExpo:function(n){return 1===n?1:1-t(2,-10*n)},easeInOutExpo:function(n){return 0===n?0:1===n?1:n<.5?t(2,20*n-10)/2:(2-t(2,-20*n+10))/2},easeInCirc:function(n){return 1-u(1-t(n,2))},easeOutCirc:function(n){return u(1-t(n-1,2))},easeInOutCirc:function(n){return n<.5?(1-u(1-t(2*n,2)))/2:(u(1-t(-2*n+2,2))+1)/2},easeInElastic:function(n){return 0===n?0:1===n?1:-t(2,10*n-10)*r((10*n-10.75)*s)},easeOutElastic:function(n){return 0===n?0:1===n?1:t(2,-10*n)*r((10*n-.75)*s)+1},easeInOutElastic:function(n){return 0===n?0:1===n?1:n<.5?-t(2,20*n-10)*r((20*n-11.125)*f)/2:t(2,-20*n+10)*r((20*n-11.125)*f)/2+1},easeInBack:function(n){return 2.70158*n*n*n-o*n*n},easeOutBack:function(n){return 1+2.70158*t(n-1,3)+o*t(n-1,2)},easeInOutBack:function(n){return n<.5?t(2*n,2)*(7.189819*n-c)/2:(t(2*n-2,2)*((c+1)*(2*n-2)+c)+2)/2},easeInBounce:function(n){return 1-e(1-n)},easeOutBounce:e,easeInOutBounce:function(n){return n<.5?(1-e(1-2*n))/2:(1+e(2*n-1))/2}}),n});

/*!
* FitVids 1.1
*
* Copyright 2013, Chris Coyier - http://css-tricks.com + Dave Rupert - http://daverupert.com
* Credit to Thierry Koblentz - http://www.alistapart.com/articles/creating-intrinsic-ratios-for-video/
* Released under the WTFPL license - http://sam.zoy.org/wtfpl/
*
*/
!function(t){"use strict";t.fn.fitVids=function(e){var i={customSelector:null,ignore:null};if(!document.getElementById("fit-vids-style")){var r=document.head||document.getElementsByTagName("head")[0],a=".fluid-width-video-wrapper{width:100%;position:relative;padding:0;}.fluid-width-video-wrapper iframe,.fluid-width-video-wrapper object,.fluid-width-video-wrapper embed {position:absolute;top:0;left:0;width:100%;height:100%;}",d=document.createElement("div");d.innerHTML='<p>x</p><style id="fit-vids-style">'+a+"</style>",r.appendChild(d.childNodes[1])}return e&&t.extend(i,e),this.each(function(){var e=['iframe[src*="player.vimeo.com"]','iframe[src*="youtube.com"]','iframe[src*="youtube-nocookie.com"]','iframe[src*="kickstarter.com"][src*="video.html"]',"object","embed"];i.customSelector&&e.push(i.customSelector);var r=".fitvidsignore";i.ignore&&(r=r+", "+i.ignore);var a=t(this).find(e.join(","));a=a.not("object object"),a=a.not(r),a.each(function(e){var i=t(this);if(!(i.parents(r).length>0||"embed"===this.tagName.toLowerCase()&&i.parent("object").length||i.parent(".fluid-width-video-wrapper").length)){i.css("height")||i.css("width")||!isNaN(i.attr("height"))&&!isNaN(i.attr("width"))||(i.attr("height",9),i.attr("width",16));var a="object"===this.tagName.toLowerCase()||i.attr("height")&&!isNaN(parseInt(i.attr("height"),10))?parseInt(i.attr("height"),10):i.height(),d=isNaN(parseInt(i.attr("width"),10))?i.width():parseInt(i.attr("width"),10),o=a/d;if(!i.attr("id")){var h="fitvid"+e;i.attr("id",h)}i.wrap('<div class="fluid-width-video-wrapper"></div>').parent(".fluid-width-video-wrapper").css("padding-top",100*o+"%"),i.removeAttr("height").removeAttr("width")}})})}}(window.jQuery||window.Zepto);

/*
 * jQuery FlexSlider v2.7.2
 * Copyright 2012 WooThemes
 * Contributing Author: Tyler Smith
 */
!function($){var e=!0;$.flexslider=function(t,a){var n=$(t);void 0===a.rtl&&"rtl"==$("html").attr("dir")&&(a.rtl=!0),n.vars=$.extend({},$.flexslider.defaults,a);var i=n.vars.namespace,r=window.navigator&&window.navigator.msPointerEnabled&&window.MSGesture,s=("ontouchstart"in window||r||window.DocumentTouch&&document instanceof DocumentTouch)&&n.vars.touch,o="click touchend MSPointerUp keyup",l="",c,d="vertical"===n.vars.direction,u=n.vars.reverse,v=n.vars.itemWidth>0,p="fade"===n.vars.animation,m=""!==n.vars.asNavFor,f={};$.data(t,"flexslider",n),f={init:function(){n.animating=!1,n.currentSlide=parseInt(n.vars.startAt?n.vars.startAt:0,10),isNaN(n.currentSlide)&&(n.currentSlide=0),n.animatingTo=n.currentSlide,n.atEnd=0===n.currentSlide||n.currentSlide===n.last,n.containerSelector=n.vars.selector.substr(0,n.vars.selector.search(" ")),n.slides=$(n.vars.selector,n),n.container=$(n.containerSelector,n),n.count=n.slides.length,n.syncExists=$(n.vars.sync).length>0,"slide"===n.vars.animation&&(n.vars.animation="swing"),n.prop=d?"top":n.vars.rtl?"marginRight":"marginLeft",n.args={},n.manualPause=!1,n.stopped=!1,n.started=!1,n.startTimeout=null,n.transitions=!n.vars.video&&!p&&n.vars.useCSS&&function(){var e=document.createElement("div"),t=["perspectiveProperty","WebkitPerspective","MozPerspective","OPerspective","msPerspective"];for(var a in t)if(void 0!==e.style[t[a]])return n.pfx=t[a].replace("Perspective","").toLowerCase(),n.prop="-"+n.pfx+"-transform",!0;return!1}(),n.isFirefox=navigator.userAgent.toLowerCase().indexOf("firefox")>-1,n.ensureAnimationEnd="",""!==n.vars.controlsContainer&&(n.controlsContainer=$(n.vars.controlsContainer).length>0&&$(n.vars.controlsContainer)),""!==n.vars.manualControls&&(n.manualControls=$(n.vars.manualControls).length>0&&$(n.vars.manualControls)),""!==n.vars.customDirectionNav&&(n.customDirectionNav=2===$(n.vars.customDirectionNav).length&&$(n.vars.customDirectionNav)),n.vars.randomize&&(n.slides.sort(function(){return Math.round(Math.random())-.5}),n.container.empty().append(n.slides)),n.doMath(),n.setup("init"),n.vars.controlNav&&f.controlNav.setup(),n.vars.directionNav&&f.directionNav.setup(),n.vars.keyboard&&(1===$(n.containerSelector).length||n.vars.multipleKeyboard)&&$(document).bind("keyup",function(e){var t=e.keyCode;if(!n.animating&&(39===t||37===t)){var a=n.vars.rtl?37===t?n.getTarget("next"):39===t&&n.getTarget("prev"):39===t?n.getTarget("next"):37===t&&n.getTarget("prev");n.flexAnimate(a,n.vars.pauseOnAction)}}),n.vars.mousewheel&&n.bind("mousewheel",function(e,t,a,i){e.preventDefault();var r=t<0?n.getTarget("next"):n.getTarget("prev");n.flexAnimate(r,n.vars.pauseOnAction)}),n.vars.pausePlay&&f.pausePlay.setup(),n.vars.slideshow&&n.vars.pauseInvisible&&f.pauseInvisible.init(),n.vars.slideshow&&(n.vars.pauseOnHover&&n.hover(function(){n.manualPlay||n.manualPause||n.pause()},function(){n.manualPause||n.manualPlay||n.stopped||n.play()}),n.vars.pauseInvisible&&f.pauseInvisible.isHidden()||(n.vars.initDelay>0?n.startTimeout=setTimeout(n.play,n.vars.initDelay):n.play())),m&&f.asNav.setup(),s&&n.vars.touch&&f.touch(),(!p||p&&n.vars.smoothHeight)&&$(window).bind("resize orientationchange focus",f.resize),n.find("img").attr("draggable","false"),setTimeout(function(){n.vars.start(n)},200)},asNav:{setup:function(){n.asNav=!0,n.animatingTo=Math.floor(n.currentSlide/n.move),n.currentItem=n.currentSlide,n.slides.removeClass(i+"active-slide").eq(n.currentItem).addClass(i+"active-slide"),r?(t._slider=n,n.slides.each(function(){var e=this;e._gesture=new MSGesture,e._gesture.target=e,e.addEventListener("MSPointerDown",function(e){e.preventDefault(),e.currentTarget._gesture&&e.currentTarget._gesture.addPointer(e.pointerId)},!1),e.addEventListener("MSGestureTap",function(e){e.preventDefault();var t=$(this),a=t.index();$(n.vars.asNavFor).data("flexslider").animating||t.hasClass("active")||(n.direction=n.currentItem<a?"next":"prev",n.flexAnimate(a,n.vars.pauseOnAction,!1,!0,!0))})})):n.slides.on(o,function(e){e.preventDefault();var t=$(this),a=t.index(),r;r=n.vars.rtl?-1*(t.offset().right-$(n).scrollLeft()):t.offset().left-$(n).scrollLeft(),r<=0&&t.hasClass(i+"active-slide")?n.flexAnimate(n.getTarget("prev"),!0):$(n.vars.asNavFor).data("flexslider").animating||t.hasClass(i+"active-slide")||(n.direction=n.currentItem<a?"next":"prev",n.flexAnimate(a,n.vars.pauseOnAction,!1,!0,!0))})}},controlNav:{setup:function(){n.manualControls?f.controlNav.setupManual():f.controlNav.setupPaging()},setupPaging:function(){var e="thumbnails"===n.vars.controlNav?"control-thumbs":"control-paging",t=1,a,r;if(n.controlNavScaffold=$('<ol class="'+i+"control-nav "+i+e+'"></ol>'),n.pagingCount>1)for(var s=0;s<n.pagingCount;s++){if(r=n.slides.eq(s),void 0===r.attr("data-thumb-alt")&&r.attr("data-thumb-alt",""),a=$("<a></a>").attr("href","#").text(t),"thumbnails"===n.vars.controlNav&&(a=$("<img/>").attr("src",r.attr("data-thumb"))),""!==r.attr("data-thumb-alt")&&a.attr("alt",r.attr("data-thumb-alt")),"thumbnails"===n.vars.controlNav&&!0===n.vars.thumbCaptions){var c=r.attr("data-thumbcaption");if(""!==c&&void 0!==c){var d=$("<span></span>").addClass(i+"caption").text(c);a.append(d)}}var u=$("<li>");a.appendTo(u),u.append("</li>"),n.controlNavScaffold.append(u),t++}n.controlsContainer?$(n.controlsContainer).append(n.controlNavScaffold):n.append(n.controlNavScaffold),f.controlNav.set(),f.controlNav.active(),n.controlNavScaffold.delegate("a, img",o,function(e){if(e.preventDefault(),""===l||l===e.type){var t=$(this),a=n.controlNav.index(t);t.hasClass(i+"active")||(n.direction=a>n.currentSlide?"next":"prev",n.flexAnimate(a,n.vars.pauseOnAction))}""===l&&(l=e.type),f.setToClearWatchedEvent()})},setupManual:function(){n.controlNav=n.manualControls,f.controlNav.active(),n.controlNav.bind(o,function(e){if(e.preventDefault(),""===l||l===e.type){var t=$(this),a=n.controlNav.index(t);t.hasClass(i+"active")||(a>n.currentSlide?n.direction="next":n.direction="prev",n.flexAnimate(a,n.vars.pauseOnAction))}""===l&&(l=e.type),f.setToClearWatchedEvent()})},set:function(){var e="thumbnails"===n.vars.controlNav?"img":"a";n.controlNav=$("."+i+"control-nav li "+e,n.controlsContainer?n.controlsContainer:n)},active:function(){n.controlNav.removeClass(i+"active").eq(n.animatingTo).addClass(i+"active")},update:function(e,t){n.pagingCount>1&&"add"===e?n.controlNavScaffold.append($('<li><a href="#">'+n.count+"</a></li>")):1===n.pagingCount?n.controlNavScaffold.find("li").remove():n.controlNav.eq(t).closest("li").remove(),f.controlNav.set(),n.pagingCount>1&&n.pagingCount!==n.controlNav.length?n.update(t,e):f.controlNav.active()}},directionNav:{setup:function(){var e=$('<ul class="'+i+'direction-nav"><li class="'+i+'nav-prev"><a class="'+i+'prev" href="#">'+n.vars.prevText+'</a></li><li class="'+i+'nav-next"><a class="'+i+'next" href="#">'+n.vars.nextText+"</a></li></ul>");n.customDirectionNav?n.directionNav=n.customDirectionNav:n.controlsContainer?($(n.controlsContainer).append(e),n.directionNav=$("."+i+"direction-nav li a",n.controlsContainer)):(n.append(e),n.directionNav=$("."+i+"direction-nav li a",n)),f.directionNav.update(),n.directionNav.bind(o,function(e){e.preventDefault();var t;""!==l&&l!==e.type||(t=$(this).hasClass(i+"next")?n.getTarget("next"):n.getTarget("prev"),n.flexAnimate(t,n.vars.pauseOnAction)),""===l&&(l=e.type),f.setToClearWatchedEvent()})},update:function(){var e=i+"disabled";1===n.pagingCount?n.directionNav.addClass(e).attr("tabindex","-1"):n.vars.animationLoop?n.directionNav.removeClass(e).removeAttr("tabindex"):0===n.animatingTo?n.directionNav.removeClass(e).filter("."+i+"prev").addClass(e).attr("tabindex","-1"):n.animatingTo===n.last?n.directionNav.removeClass(e).filter("."+i+"next").addClass(e).attr("tabindex","-1"):n.directionNav.removeClass(e).removeAttr("tabindex")}},pausePlay:{setup:function(){var e=$('<div class="'+i+'pauseplay"><a href="#"></a></div>');n.controlsContainer?(n.controlsContainer.append(e),n.pausePlay=$("."+i+"pauseplay a",n.controlsContainer)):(n.append(e),n.pausePlay=$("."+i+"pauseplay a",n)),f.pausePlay.update(n.vars.slideshow?i+"pause":i+"play"),n.pausePlay.bind(o,function(e){e.preventDefault(),""!==l&&l!==e.type||($(this).hasClass(i+"pause")?(n.manualPause=!0,n.manualPlay=!1,n.pause()):(n.manualPause=!1,n.manualPlay=!0,n.play())),""===l&&(l=e.type),f.setToClearWatchedEvent()})},update:function(e){"play"===e?n.pausePlay.removeClass(i+"pause").addClass(i+"play").html(n.vars.playText):n.pausePlay.removeClass(i+"play").addClass(i+"pause").html(n.vars.pauseText)}},touch:function(){function e(e){e.stopPropagation(),n.animating?e.preventDefault():(n.pause(),t._gesture.addPointer(e.pointerId),w=0,c=d?n.h:n.w,f=Number(new Date),l=v&&u&&n.animatingTo===n.last?0:v&&u?n.limit-(n.itemW+n.vars.itemMargin)*n.move*n.animatingTo:v&&n.currentSlide===n.last?n.limit:v?(n.itemW+n.vars.itemMargin)*n.move*n.currentSlide:u?(n.last-n.currentSlide+n.cloneOffset)*c:(n.currentSlide+n.cloneOffset)*c)}function a(e){e.stopPropagation();var a=e.target._slider;if(a){var n=-e.translationX,i=-e.translationY;if(w+=d?i:n,m=(a.vars.rtl?-1:1)*w,x=d?Math.abs(w)<Math.abs(-n):Math.abs(w)<Math.abs(-i),e.detail===e.MSGESTURE_FLAG_INERTIA)return void setImmediate(function(){t._gesture.stop()});(!x||Number(new Date)-f>500)&&(e.preventDefault(),!p&&a.transitions&&(a.vars.animationLoop||(m=w/(0===a.currentSlide&&w<0||a.currentSlide===a.last&&w>0?Math.abs(w)/c+2:1)),a.setProps(l+m,"setTouch")))}}function i(e){e.stopPropagation();var t=e.target._slider;if(t){if(t.animatingTo===t.currentSlide&&!x&&null!==m){var a=u?-m:m,n=a>0?t.getTarget("next"):t.getTarget("prev");t.canAdvance(n)&&(Number(new Date)-f<550&&Math.abs(a)>50||Math.abs(a)>c/2)?t.flexAnimate(n,t.vars.pauseOnAction):p||t.flexAnimate(t.currentSlide,t.vars.pauseOnAction,!0)}s=null,o=null,m=null,l=null,w=0}}var s,o,l,c,m,f,g,h,S,x=!1,y=0,b=0,w=0;r?(t.style.msTouchAction="none",t._gesture=new MSGesture,t._gesture.target=t,t.addEventListener("MSPointerDown",e,!1),t._slider=n,t.addEventListener("MSGestureChange",a,!1),t.addEventListener("MSGestureEnd",i,!1)):(g=function(e){n.animating?e.preventDefault():(window.navigator.msPointerEnabled||1===e.touches.length)&&(n.pause(),c=d?n.h:n.w,f=Number(new Date),y=e.touches[0].pageX,b=e.touches[0].pageY,l=v&&u&&n.animatingTo===n.last?0:v&&u?n.limit-(n.itemW+n.vars.itemMargin)*n.move*n.animatingTo:v&&n.currentSlide===n.last?n.limit:v?(n.itemW+n.vars.itemMargin)*n.move*n.currentSlide:u?(n.last-n.currentSlide+n.cloneOffset)*c:(n.currentSlide+n.cloneOffset)*c,s=d?b:y,o=d?y:b,t.addEventListener("touchmove",h,!1),t.addEventListener("touchend",S,!1))},h=function(e){y=e.touches[0].pageX,b=e.touches[0].pageY,m=d?s-b:(n.vars.rtl?-1:1)*(s-y),x=d?Math.abs(m)<Math.abs(y-o):Math.abs(m)<Math.abs(b-o);var t=500;(!x||Number(new Date)-f>500)&&(e.preventDefault(),!p&&n.transitions&&(n.vars.animationLoop||(m/=0===n.currentSlide&&m<0||n.currentSlide===n.last&&m>0?Math.abs(m)/c+2:1),n.setProps(l+m,"setTouch")))},S=function(e){if(t.removeEventListener("touchmove",h,!1),n.animatingTo===n.currentSlide&&!x&&null!==m){var a=u?-m:m,i=a>0?n.getTarget("next"):n.getTarget("prev");n.canAdvance(i)&&(Number(new Date)-f<550&&Math.abs(a)>50||Math.abs(a)>c/2)?n.flexAnimate(i,n.vars.pauseOnAction):p||n.flexAnimate(n.currentSlide,n.vars.pauseOnAction,!0)}t.removeEventListener("touchend",S,!1),s=null,o=null,m=null,l=null},t.addEventListener("touchstart",g,!1))},resize:function(){!n.animating&&n.is(":visible")&&(v||n.doMath(),p?f.smoothHeight():v?(n.slides.width(n.computedW),n.update(n.pagingCount),n.setProps()):d?(n.viewport.height(n.h),n.setProps(n.h,"setTotal")):(n.vars.smoothHeight&&f.smoothHeight(),n.newSlides.width(n.computedW),n.setProps(n.computedW,"setTotal")))},smoothHeight:function(e){if(!d||p){var t=p?n:n.viewport;e?t.animate({height:n.slides.eq(n.animatingTo).innerHeight()},e):t.innerHeight(n.slides.eq(n.animatingTo).innerHeight())}},sync:function(e){var t=$(n.vars.sync).data("flexslider"),a=n.animatingTo;switch(e){case"animate":t.flexAnimate(a,n.vars.pauseOnAction,!1,!0);break;case"play":t.playing||t.asNav||t.play();break;case"pause":t.pause();break}},uniqueID:function(e){return e.filter("[id]").add(e.find("[id]")).each(function(){var e=$(this);e.attr("id",e.attr("id")+"_clone")}),e},pauseInvisible:{visProp:null,init:function(){var e=f.pauseInvisible.getHiddenProp();if(e){var t=e.replace(/[H|h]idden/,"")+"visibilitychange";document.addEventListener(t,function(){f.pauseInvisible.isHidden()?n.startTimeout?clearTimeout(n.startTimeout):n.pause():n.started?n.play():n.vars.initDelay>0?setTimeout(n.play,n.vars.initDelay):n.play()})}},isHidden:function(){var e=f.pauseInvisible.getHiddenProp();return!!e&&document[e]},getHiddenProp:function(){var e=["webkit","moz","ms","o"];if("hidden"in document)return"hidden";for(var t=0;t<e.length;t++)if(e[t]+"Hidden"in document)return e[t]+"Hidden";return null}},setToClearWatchedEvent:function(){clearTimeout(c),c=setTimeout(function(){l=""},3e3)}},n.flexAnimate=function(e,t,a,r,o){if(n.vars.animationLoop||e===n.currentSlide||(n.direction=e>n.currentSlide?"next":"prev"),m&&1===n.pagingCount&&(n.direction=n.currentItem<e?"next":"prev"),!n.animating&&(n.canAdvance(e,o)||a)&&n.is(":visible")){if(m&&r){var l=$(n.vars.asNavFor).data("flexslider");if(n.atEnd=0===e||e===n.count-1,l.flexAnimate(e,!0,!1,!0,o),n.direction=n.currentItem<e?"next":"prev",l.direction=n.direction,Math.ceil((e+1)/n.visible)-1===n.currentSlide||0===e)return n.currentItem=e,n.slides.removeClass(i+"active-slide").eq(e).addClass(i+"active-slide"),!1;n.currentItem=e,n.slides.removeClass(i+"active-slide").eq(e).addClass(i+"active-slide"),e=Math.floor(e/n.visible)}if(n.animating=!0,n.animatingTo=e,t&&n.pause(),n.vars.before(n),n.syncExists&&!o&&f.sync("animate"),n.vars.controlNav&&f.controlNav.active(),v||n.slides.removeClass(i+"active-slide").eq(e).addClass(i+"active-slide"),n.atEnd=0===e||e===n.last,n.vars.directionNav&&f.directionNav.update(),e===n.last&&(n.vars.end(n),n.vars.animationLoop||n.pause()),p)s?(n.slides.eq(n.currentSlide).css({opacity:0,zIndex:1}),n.slides.eq(e).css({opacity:1,zIndex:2}),n.wrapup(c)):(n.slides.eq(n.currentSlide).css({zIndex:1}).animate({opacity:0},n.vars.animationSpeed,n.vars.easing),n.slides.eq(e).css({zIndex:2}).animate({opacity:1},n.vars.animationSpeed,n.vars.easing,n.wrapup));else{var c=d?n.slides.filter(":first").height():n.computedW,g,h,S;v?(g=n.vars.itemMargin,S=(n.itemW+g)*n.move*n.animatingTo,h=S>n.limit&&1!==n.visible?n.limit:S):h=0===n.currentSlide&&e===n.count-1&&n.vars.animationLoop&&"next"!==n.direction?u?(n.count+n.cloneOffset)*c:0:n.currentSlide===n.last&&0===e&&n.vars.animationLoop&&"prev"!==n.direction?u?0:(n.count+1)*c:u?(n.count-1-e+n.cloneOffset)*c:(e+n.cloneOffset)*c,n.setProps(h,"",n.vars.animationSpeed),n.transitions?(n.vars.animationLoop&&n.atEnd||(n.animating=!1,n.currentSlide=n.animatingTo),n.container.unbind("webkitTransitionEnd transitionend"),n.container.bind("webkitTransitionEnd transitionend",function(){clearTimeout(n.ensureAnimationEnd),n.wrapup(c)}),clearTimeout(n.ensureAnimationEnd),n.ensureAnimationEnd=setTimeout(function(){n.wrapup(c)},n.vars.animationSpeed+100)):n.container.animate(n.args,n.vars.animationSpeed,n.vars.easing,function(){n.wrapup(c)})}n.vars.smoothHeight&&f.smoothHeight(n.vars.animationSpeed)}},n.wrapup=function(e){p||v||(0===n.currentSlide&&n.animatingTo===n.last&&n.vars.animationLoop?n.setProps(e,"jumpEnd"):n.currentSlide===n.last&&0===n.animatingTo&&n.vars.animationLoop&&n.setProps(e,"jumpStart")),n.animating=!1,n.currentSlide=n.animatingTo,n.vars.after(n)},n.animateSlides=function(){!n.animating&&e&&n.flexAnimate(n.getTarget("next"))},n.pause=function(){clearInterval(n.animatedSlides),n.animatedSlides=null,n.playing=!1,n.vars.pausePlay&&f.pausePlay.update("play"),n.syncExists&&f.sync("pause")},n.play=function(){n.playing&&clearInterval(n.animatedSlides),n.animatedSlides=n.animatedSlides||setInterval(n.animateSlides,n.vars.slideshowSpeed),n.started=n.playing=!0,n.vars.pausePlay&&f.pausePlay.update("pause"),n.syncExists&&f.sync("play")},n.stop=function(){n.pause(),n.stopped=!0},n.canAdvance=function(e,t){var a=m?n.pagingCount-1:n.last;return!!t||(!(!m||n.currentItem!==n.count-1||0!==e||"prev"!==n.direction)||(!m||0!==n.currentItem||e!==n.pagingCount-1||"next"===n.direction)&&(!(e===n.currentSlide&&!m)&&(!!n.vars.animationLoop||(!n.atEnd||0!==n.currentSlide||e!==a||"next"===n.direction)&&(!n.atEnd||n.currentSlide!==a||0!==e||"next"!==n.direction))))},n.getTarget=function(e){return n.direction=e,"next"===e?n.currentSlide===n.last?0:n.currentSlide+1:0===n.currentSlide?n.last:n.currentSlide-1},n.setProps=function(e,t,a){var i=function(){var a=e||(n.itemW+n.vars.itemMargin)*n.move*n.animatingTo;return function(){if(v)return"setTouch"===t?e:u&&n.animatingTo===n.last?0:u?n.limit-(n.itemW+n.vars.itemMargin)*n.move*n.animatingTo:n.animatingTo===n.last?n.limit:a;switch(t){case"setTotal":return u?(n.count-1-n.currentSlide+n.cloneOffset)*e:(n.currentSlide+n.cloneOffset)*e;case"setTouch":return e;case"jumpEnd":return u?e:n.count*e;case"jumpStart":return u?n.count*e:e;default:return e}}()*(n.vars.rtl?1:-1)+"px"}();n.transitions&&(i=n.isFirefox?d?"translate3d(0,"+i+",0)":"translate3d("+parseInt(i)+"px,0,0)":d?"translate3d(0,"+i+",0)":"translate3d("+(n.vars.rtl?-1:1)*parseInt(i)+"px,0,0)",a=void 0!==a?a/1e3+"s":"0s",n.container.css("-"+n.pfx+"-transition-duration",a),n.container.css("transition-duration",a)),n.args[n.prop]=i,(n.transitions||void 0===a)&&n.container.css(n.args),n.container.css("transform",i)},n.setup=function(e){if(p)n.vars.rtl?n.slides.css({width:"100%",float:"right",marginLeft:"-100%",position:"relative"}):n.slides.css({width:"100%",float:"left",marginRight:"-100%",position:"relative"}),"init"===e&&(s?n.slides.css({opacity:0,display:"block",webkitTransition:"opacity "+n.vars.animationSpeed/1e3+"s ease",zIndex:1}).eq(n.currentSlide).css({opacity:1,zIndex:2}):0==n.vars.fadeFirstSlide?n.slides.css({opacity:0,display:"block",zIndex:1}).eq(n.currentSlide).css({zIndex:2}).css({opacity:1}):n.slides.css({opacity:0,display:"block",zIndex:1}).eq(n.currentSlide).css({zIndex:2}).animate({opacity:1},n.vars.animationSpeed,n.vars.easing)),n.vars.smoothHeight&&f.smoothHeight();else{var t,a;"init"===e&&(n.viewport=$('<div class="'+i+'viewport"></div>').css({overflow:"hidden",position:"relative"}).appendTo(n).append(n.container),n.cloneCount=0,n.cloneOffset=0,u&&(a=$.makeArray(n.slides).reverse(),n.slides=$(a),n.container.empty().append(n.slides))),n.vars.animationLoop&&!v&&(n.cloneCount=2,n.cloneOffset=1,"init"!==e&&n.container.find(".clone").remove(),n.container.append(f.uniqueID(n.slides.first().clone().addClass("clone")).attr("aria-hidden","true")).prepend(f.uniqueID(n.slides.last().clone().addClass("clone")).attr("aria-hidden","true"))),n.newSlides=$(n.vars.selector,n),t=u?n.count-1-n.currentSlide+n.cloneOffset:n.currentSlide+n.cloneOffset,d&&!v?(n.container.height(200*(n.count+n.cloneCount)+"%").css("position","absolute").width("100%"),setTimeout(function(){n.newSlides.css({display:"block"}),n.doMath(),n.viewport.height(n.h),n.setProps(t*n.h,"init")},"init"===e?100:0)):(n.container.width(200*(n.count+n.cloneCount)+"%"),n.setProps(t*n.computedW,"init"),setTimeout(function(){n.doMath(),n.vars.rtl&&n.isFirefox?n.newSlides.css({width:n.computedW,marginRight:n.computedM,float:"right",display:"block"}):n.newSlides.css({width:n.computedW,marginRight:n.computedM,float:"left",display:"block"}),n.vars.smoothHeight&&f.smoothHeight()},"init"===e?100:0))}v||n.slides.removeClass(i+"active-slide").eq(n.currentSlide).addClass(i+"active-slide"),n.vars.init(n)},n.doMath=function(){var e=n.slides.first(),t=n.vars.itemMargin,a=n.vars.minItems,i=n.vars.maxItems;n.w=void 0===n.viewport?n.width():n.viewport.width(),n.isFirefox&&(n.w=n.width()),n.h=e.height(),n.boxPadding=e.outerWidth()-e.width(),v?(n.itemT=n.vars.itemWidth+t,n.itemM=t,n.minW=a?a*n.itemT:n.w,n.maxW=i?i*n.itemT-t:n.w,n.itemW=n.minW>n.w?(n.w-t*(a-1))/a:n.maxW<n.w?(n.w-t*(i-1))/i:n.vars.itemWidth>n.w?n.w:n.vars.itemWidth,n.visible=Math.floor(n.w/n.itemW),n.move=n.vars.move>0&&n.vars.move<n.visible?n.vars.move:n.visible,n.pagingCount=Math.ceil((n.count-n.visible)/n.move+1),n.last=n.pagingCount-1,n.limit=1===n.pagingCount?0:n.vars.itemWidth>n.w?n.itemW*(n.count-1)+t*(n.count-1):(n.itemW+t)*n.count-n.w-t):(n.itemW=n.w,n.itemM=t,n.pagingCount=n.count,n.last=n.count-1),n.computedW=n.itemW-n.boxPadding,n.computedM=n.itemM},n.update=function(e,t){n.doMath(),v||(e<n.currentSlide?n.currentSlide+=1:e<=n.currentSlide&&0!==e&&(n.currentSlide-=1),n.animatingTo=n.currentSlide),n.vars.controlNav&&!n.manualControls&&("add"===t&&!v||n.pagingCount>n.controlNav.length?f.controlNav.update("add"):("remove"===t&&!v||n.pagingCount<n.controlNav.length)&&(v&&n.currentSlide>n.last&&(n.currentSlide-=1,n.animatingTo-=1),f.controlNav.update("remove",n.last))),n.vars.directionNav&&f.directionNav.update()},n.addSlide=function(e,t){var a=$(e);n.count+=1,n.last=n.count-1,d&&u?void 0!==t?n.slides.eq(n.count-t).after(a):n.container.prepend(a):void 0!==t?n.slides.eq(t).before(a):n.container.append(a),n.update(t,"add"),n.slides=$(n.vars.selector+":not(.clone)",n),n.setup(),n.vars.added(n)},n.removeSlide=function(e){var t=isNaN(e)?n.slides.index($(e)):e;n.count-=1,n.last=n.count-1,isNaN(e)?$(e,n.slides).remove():d&&u?n.slides.eq(n.last).remove():n.slides.eq(e).remove(),n.doMath(),n.update(t,"remove"),n.slides=$(n.vars.selector+":not(.clone)",n),n.setup(),n.vars.removed(n)},f.init()},$(window).blur(function(t){e=!1}).focus(function(t){e=!0}),$.flexslider.defaults={namespace:"flex-",selector:".slides > li",animation:"fade",easing:"swing",direction:"horizontal",reverse:!1,animationLoop:!0,smoothHeight:!1,startAt:0,slideshow:!0,slideshowSpeed:7e3,animationSpeed:600,initDelay:0,randomize:!1,fadeFirstSlide:!0,thumbCaptions:!1,pauseOnAction:!0,pauseOnHover:!1,pauseInvisible:!0,useCSS:!0,touch:!0,video:!1,controlNav:!0,directionNav:!0,prevText:"Previous",nextText:"Next",keyboard:!0,multipleKeyboard:!1,mousewheel:!1,pausePlay:!1,pauseText:"Pause",playText:"Play",controlsContainer:"",manualControls:"",customDirectionNav:"",sync:"",asNavFor:"",itemWidth:0,itemMargin:0,minItems:1,maxItems:0,move:0,allowOneSlide:!0,isFirefox:!1,start:function(){},before:function(){},after:function(){},end:function(){},added:function(){},removed:function(){},init:function(){},rtl:!1},$.fn.flexslider=function(e){if(void 0===e&&(e={}),"object"==typeof e)return this.each(function(){var t=$(this),a=e.selector?e.selector:".slides > li",n=t.find(a);1===n.length&&!1===e.allowOneSlide||0===n.length?(n.fadeIn(400),e.start&&e.start(t)):void 0===t.data("flexslider")&&new $.flexslider(this,e)});var t=$(this).data("flexslider");switch(e){case"play":t.play();break;case"pause":t.pause();break;case"stop":t.stop();break;case"next":t.flexAnimate(t.getTarget("next"),!0);break;case"prev":case"previous":t.flexAnimate(t.getTarget("prev"),!0);break;default:"number"==typeof e&&t.flexAnimate(e,!0)}}}(jQuery);

/*!
 * Original copyright:
 *
 * Copyright (C) 2009 Joel Sutherland
 * Licenced under the MIT license
 * http://www.newmediacampaigns.com/page/jquery-flickr-plugin
 *
 * Available tags for templates:
 * title, link, date_taken, description, published, author, author_id, tags, image*
 */
!function(a){a.fn.jflickrfeed=function(b,c){b=a.extend(!0,{flickrbase:"https://api.flickr.com/services/feeds/",feedapi:"photos_public.gne",limit:20,qstrings:{lang:"en-us",format:"json",jsoncallback:"?"},cleanDescription:!0,useTemplate:!0,itemTemplate:"",itemCallback:function(){}},b);var d,e=b.flickrbase+b.feedapi+"?",f=!0;for(d in b.qstrings)f||(e+="&"),e+=d+"="+b.qstrings[d],f=!1;return a(this).each(function(){var d=a(this),f=this;a.getJSON(e,function(e){a.each(e.items,function(a,c){var e,g,h,i;if(a<b.limit){if(b.cleanDescription&&(e=/<p>(.*?)<\/p>/g,g=c.description,e.test(g)&&(c.description=g.match(e)[2],void 0!==c.description&&(c.description=c.description.replace("<p>","").replace("</p>","")))),c.image_s=c.media.m.replace("_m","_s"),c.image_t=c.media.m.replace("_m","_t"),c.image_m=c.media.m.replace("_m","_m"),c.image=c.media.m.replace("_m",""),c.image_b=c.media.m.replace("_m","_b"),c.image_q=c.media.m.replace("_m","_q"),delete c.media,b.useTemplate){i=b.itemTemplate;for(h in c)e=new RegExp("{{"+h+"}}","g"),i=i.replace(e,c[h]);d.append(i)}b.itemCallback.call(f,c)}}),a.isFunction(c)&&c.call(f,e)})})}}(jQuery);

/*! jQuery Validation Plugin - v1.19.5 - 7/1/2022
 * https://jqueryvalidation.org/
 * Copyright (c) 2022 Jörn Zaefferer; Licensed MIT */
!function(a){"function"==typeof define&&define.amd?define(["jquery"],a):"object"==typeof module&&module.exports?module.exports=a(require("jquery")):a(jQuery)}(function(a){a.extend(a.fn,{validate:function(b){if(!this.length)return void(b&&b.debug&&window.console&&console.warn("Nothing selected, can't validate, returning nothing."));var c=a.data(this[0],"validator");return c?c:(this.attr("novalidate","novalidate"),c=new a.validator(b,this[0]),a.data(this[0],"validator",c),c.settings.onsubmit&&(this.on("click.validate",":submit",function(b){c.submitButton=b.currentTarget,a(this).hasClass("cancel")&&(c.cancelSubmit=!0),void 0!==a(this).attr("formnovalidate")&&(c.cancelSubmit=!0)}),this.on("submit.validate",function(b){function d(){var d,e;return c.submitButton&&(c.settings.submitHandler||c.formSubmitted)&&(d=a("<input type='hidden'/>").attr("name",c.submitButton.name).val(a(c.submitButton).val()).appendTo(c.currentForm)),!(c.settings.submitHandler&&!c.settings.debug)||(e=c.settings.submitHandler.call(c,c.currentForm,b),d&&d.remove(),void 0!==e&&e)}return c.settings.debug&&b.preventDefault(),c.cancelSubmit?(c.cancelSubmit=!1,d()):c.form()?c.pendingRequest?(c.formSubmitted=!0,!1):d():(c.focusInvalid(),!1)})),c)},valid:function(){var b,c,d;return a(this[0]).is("form")?b=this.validate().form():(d=[],b=!0,c=a(this[0].form).validate(),this.each(function(){b=c.element(this)&&b,b||(d=d.concat(c.errorList))}),c.errorList=d),b},rules:function(b,c){var d,e,f,g,h,i,j=this[0],k="undefined"!=typeof this.attr("contenteditable")&&"false"!==this.attr("contenteditable");if(null!=j&&(!j.form&&k&&(j.form=this.closest("form")[0],j.name=this.attr("name")),null!=j.form)){if(b)switch(d=a.data(j.form,"validator").settings,e=d.rules,f=a.validator.staticRules(j),b){case"add":a.extend(f,a.validator.normalizeRule(c)),delete f.messages,e[j.name]=f,c.messages&&(d.messages[j.name]=a.extend(d.messages[j.name],c.messages));break;case"remove":return c?(i={},a.each(c.split(/\s/),function(a,b){i[b]=f[b],delete f[b]}),i):(delete e[j.name],f)}return g=a.validator.normalizeRules(a.extend({},a.validator.classRules(j),a.validator.attributeRules(j),a.validator.dataRules(j),a.validator.staticRules(j)),j),g.required&&(h=g.required,delete g.required,g=a.extend({required:h},g)),g.remote&&(h=g.remote,delete g.remote,g=a.extend(g,{remote:h})),g}}});var b=function(a){return a.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,"")};a.extend(a.expr.pseudos||a.expr[":"],{blank:function(c){return!b(""+a(c).val())},filled:function(c){var d=a(c).val();return null!==d&&!!b(""+d)},unchecked:function(b){return!a(b).prop("checked")}}),a.validator=function(b,c){this.settings=a.extend(!0,{},a.validator.defaults,b),this.currentForm=c,this.init()},a.validator.format=function(b,c){return 1===arguments.length?function(){var c=a.makeArray(arguments);return c.unshift(b),a.validator.format.apply(this,c)}:void 0===c?b:(arguments.length>2&&c.constructor!==Array&&(c=a.makeArray(arguments).slice(1)),c.constructor!==Array&&(c=[c]),a.each(c,function(a,c){b=b.replace(new RegExp("\\{"+a+"\\}","g"),function(){return c})}),b)},a.extend(a.validator,{defaults:{messages:{},groups:{},rules:{},errorClass:"error",pendingClass:"pending",validClass:"valid",errorElement:"label",focusCleanup:!1,focusInvalid:!0,errorContainer:a([]),errorLabelContainer:a([]),onsubmit:!0,ignore:":hidden",ignoreTitle:!1,onfocusin:function(a){this.lastActive=a,this.settings.focusCleanup&&(this.settings.unhighlight&&this.settings.unhighlight.call(this,a,this.settings.errorClass,this.settings.validClass),this.hideThese(this.errorsFor(a)))},onfocusout:function(a){this.checkable(a)||!(a.name in this.submitted)&&this.optional(a)||this.element(a)},onkeyup:function(b,c){var d=[16,17,18,20,35,36,37,38,39,40,45,144,225];9===c.which&&""===this.elementValue(b)||a.inArray(c.keyCode,d)!==-1||(b.name in this.submitted||b.name in this.invalid)&&this.element(b)},onclick:function(a){a.name in this.submitted?this.element(a):a.parentNode.name in this.submitted&&this.element(a.parentNode)},highlight:function(b,c,d){"radio"===b.type?this.findByName(b.name).addClass(c).removeClass(d):a(b).addClass(c).removeClass(d)},unhighlight:function(b,c,d){"radio"===b.type?this.findByName(b.name).removeClass(c).addClass(d):a(b).removeClass(c).addClass(d)}},setDefaults:function(b){a.extend(a.validator.defaults,b)},messages:{required:"This field is required.",remote:"Please fix this field.",email:"Please enter a valid email address.",url:"Please enter a valid URL.",date:"Please enter a valid date.",dateISO:"Please enter a valid date (ISO).",number:"Please enter a valid number.",digits:"Please enter only digits.",equalTo:"Please enter the same value again.",maxlength:a.validator.format("Please enter no more than {0} characters."),minlength:a.validator.format("Please enter at least {0} characters."),rangelength:a.validator.format("Please enter a value between {0} and {1} characters long."),range:a.validator.format("Please enter a value between {0} and {1}."),max:a.validator.format("Please enter a value less than or equal to {0}."),min:a.validator.format("Please enter a value greater than or equal to {0}."),step:a.validator.format("Please enter a multiple of {0}.")},autoCreateRanges:!1,prototype:{init:function(){function b(b){var c="undefined"!=typeof a(this).attr("contenteditable")&&"false"!==a(this).attr("contenteditable");if(!this.form&&c&&(this.form=a(this).closest("form")[0],this.name=a(this).attr("name")),d===this.form){var e=a.data(this.form,"validator"),f="on"+b.type.replace(/^validate/,""),g=e.settings;g[f]&&!a(this).is(g.ignore)&&g[f].call(e,this,b)}}this.labelContainer=a(this.settings.errorLabelContainer),this.errorContext=this.labelContainer.length&&this.labelContainer||a(this.currentForm),this.containers=a(this.settings.errorContainer).add(this.settings.errorLabelContainer),this.submitted={},this.valueCache={},this.pendingRequest=0,this.pending={},this.invalid={},this.reset();var c,d=this.currentForm,e=this.groups={};a.each(this.settings.groups,function(b,c){"string"==typeof c&&(c=c.split(/\s/)),a.each(c,function(a,c){e[c]=b})}),c=this.settings.rules,a.each(c,function(b,d){c[b]=a.validator.normalizeRule(d)}),a(this.currentForm).on("focusin.validate focusout.validate keyup.validate",":text, [type='password'], [type='file'], select, textarea, [type='number'], [type='search'], [type='tel'], [type='url'], [type='email'], [type='datetime'], [type='date'], [type='month'], [type='week'], [type='time'], [type='datetime-local'], [type='range'], [type='color'], [type='radio'], [type='checkbox'], [contenteditable], [type='button']",b).on("click.validate","select, option, [type='radio'], [type='checkbox']",b),this.settings.invalidHandler&&a(this.currentForm).on("invalid-form.validate",this.settings.invalidHandler)},form:function(){return this.checkForm(),a.extend(this.submitted,this.errorMap),this.invalid=a.extend({},this.errorMap),this.valid()||a(this.currentForm).triggerHandler("invalid-form",[this]),this.showErrors(),this.valid()},checkForm:function(){this.prepareForm();for(var a=0,b=this.currentElements=this.elements();b[a];a++)this.check(b[a]);return this.valid()},element:function(b){var c,d,e=this.clean(b),f=this.validationTargetFor(e),g=this,h=!0;return void 0===f?delete this.invalid[e.name]:(this.prepareElement(f),this.currentElements=a(f),d=this.groups[f.name],d&&a.each(this.groups,function(a,b){b===d&&a!==f.name&&(e=g.validationTargetFor(g.clean(g.findByName(a))),e&&e.name in g.invalid&&(g.currentElements.push(e),h=g.check(e)&&h))}),c=this.check(f)!==!1,h=h&&c,c?this.invalid[f.name]=!1:this.invalid[f.name]=!0,this.numberOfInvalids()||(this.toHide=this.toHide.add(this.containers)),this.showErrors(),a(b).attr("aria-invalid",!c)),h},showErrors:function(b){if(b){var c=this;a.extend(this.errorMap,b),this.errorList=a.map(this.errorMap,function(a,b){return{message:a,element:c.findByName(b)[0]}}),this.successList=a.grep(this.successList,function(a){return!(a.name in b)})}this.settings.showErrors?this.settings.showErrors.call(this,this.errorMap,this.errorList):this.defaultShowErrors()},resetForm:function(){a.fn.resetForm&&a(this.currentForm).resetForm(),this.invalid={},this.submitted={},this.prepareForm(),this.hideErrors();var b=this.elements().removeData("previousValue").removeAttr("aria-invalid");this.resetElements(b)},resetElements:function(a){var b;if(this.settings.unhighlight)for(b=0;a[b];b++)this.settings.unhighlight.call(this,a[b],this.settings.errorClass,""),this.findByName(a[b].name).removeClass(this.settings.validClass);else a.removeClass(this.settings.errorClass).removeClass(this.settings.validClass)},numberOfInvalids:function(){return this.objectLength(this.invalid)},objectLength:function(a){var b,c=0;for(b in a)void 0!==a[b]&&null!==a[b]&&a[b]!==!1&&c++;return c},hideErrors:function(){this.hideThese(this.toHide)},hideThese:function(a){a.not(this.containers).text(""),this.addWrapper(a).hide()},valid:function(){return 0===this.size()},size:function(){return this.errorList.length},focusInvalid:function(){if(this.settings.focusInvalid)try{a(this.findLastActive()||this.errorList.length&&this.errorList[0].element||[]).filter(":visible").trigger("focus").trigger("focusin")}catch(b){}},findLastActive:function(){var b=this.lastActive;return b&&1===a.grep(this.errorList,function(a){return a.element.name===b.name}).length&&b},elements:function(){var b=this,c={};return a(this.currentForm).find("input, select, textarea, [contenteditable]").not(":submit, :reset, :image, :disabled").not(this.settings.ignore).filter(function(){var d=this.name||a(this).attr("name"),e="undefined"!=typeof a(this).attr("contenteditable")&&"false"!==a(this).attr("contenteditable");return!d&&b.settings.debug&&window.console&&console.error("%o has no name assigned",this),e&&(this.form=a(this).closest("form")[0],this.name=d),this.form===b.currentForm&&(!(d in c||!b.objectLength(a(this).rules()))&&(c[d]=!0,!0))})},clean:function(b){return a(b)[0]},errors:function(){var b=this.settings.errorClass.split(" ").join(".");return a(this.settings.errorElement+"."+b,this.errorContext)},resetInternals:function(){this.successList=[],this.errorList=[],this.errorMap={},this.toShow=a([]),this.toHide=a([])},reset:function(){this.resetInternals(),this.currentElements=a([])},prepareForm:function(){this.reset(),this.toHide=this.errors().add(this.containers)},prepareElement:function(a){this.reset(),this.toHide=this.errorsFor(a)},elementValue:function(b){var c,d,e=a(b),f=b.type,g="undefined"!=typeof e.attr("contenteditable")&&"false"!==e.attr("contenteditable");return"radio"===f||"checkbox"===f?this.findByName(b.name).filter(":checked").val():"number"===f&&"undefined"!=typeof b.validity?b.validity.badInput?"NaN":e.val():(c=g?e.text():e.val(),"file"===f?"C:\\fakepath\\"===c.substr(0,12)?c.substr(12):(d=c.lastIndexOf("/"),d>=0?c.substr(d+1):(d=c.lastIndexOf("\\"),d>=0?c.substr(d+1):c)):"string"==typeof c?c.replace(/\r/g,""):c)},check:function(b){b=this.validationTargetFor(this.clean(b));var c,d,e,f,g=a(b).rules(),h=a.map(g,function(a,b){return b}).length,i=!1,j=this.elementValue(b);"function"==typeof g.normalizer?f=g.normalizer:"function"==typeof this.settings.normalizer&&(f=this.settings.normalizer),f&&(j=f.call(b,j),delete g.normalizer);for(d in g){e={method:d,parameters:g[d]};try{if(c=a.validator.methods[d].call(this,j,b,e.parameters),"dependency-mismatch"===c&&1===h){i=!0;continue}if(i=!1,"pending"===c)return void(this.toHide=this.toHide.not(this.errorsFor(b)));if(!c)return this.formatAndAdd(b,e),!1}catch(k){throw this.settings.debug&&window.console&&console.log("Exception occurred when checking element "+b.id+", check the '"+e.method+"' method.",k),k instanceof TypeError&&(k.message+=".  Exception occurred when checking element "+b.id+", check the '"+e.method+"' method."),k}}if(!i)return this.objectLength(g)&&this.successList.push(b),!0},customDataMessage:function(b,c){return a(b).data("msg"+c.charAt(0).toUpperCase()+c.substring(1).toLowerCase())||a(b).data("msg")},customMessage:function(a,b){var c=this.settings.messages[a];return c&&(c.constructor===String?c:c[b])},findDefined:function(){for(var a=0;a<arguments.length;a++)if(void 0!==arguments[a])return arguments[a]},defaultMessage:function(b,c){"string"==typeof c&&(c={method:c});var d=this.findDefined(this.customMessage(b.name,c.method),this.customDataMessage(b,c.method),!this.settings.ignoreTitle&&b.title||void 0,a.validator.messages[c.method],"<strong>Warning: No message defined for "+b.name+"</strong>"),e=/\$?\{(\d+)\}/g;return"function"==typeof d?d=d.call(this,c.parameters,b):e.test(d)&&(d=a.validator.format(d.replace(e,"{$1}"),c.parameters)),d},formatAndAdd:function(a,b){var c=this.defaultMessage(a,b);this.errorList.push({message:c,element:a,method:b.method}),this.errorMap[a.name]=c,this.submitted[a.name]=c},addWrapper:function(a){return this.settings.wrapper&&(a=a.add(a.parent(this.settings.wrapper))),a},defaultShowErrors:function(){var a,b,c;for(a=0;this.errorList[a];a++)c=this.errorList[a],this.settings.highlight&&this.settings.highlight.call(this,c.element,this.settings.errorClass,this.settings.validClass),this.showLabel(c.element,c.message);if(this.errorList.length&&(this.toShow=this.toShow.add(this.containers)),this.settings.success)for(a=0;this.successList[a];a++)this.showLabel(this.successList[a]);if(this.settings.unhighlight)for(a=0,b=this.validElements();b[a];a++)this.settings.unhighlight.call(this,b[a],this.settings.errorClass,this.settings.validClass);this.toHide=this.toHide.not(this.toShow),this.hideErrors(),this.addWrapper(this.toShow).show()},validElements:function(){return this.currentElements.not(this.invalidElements())},invalidElements:function(){return a(this.errorList).map(function(){return this.element})},showLabel:function(b,c){var d,e,f,g,h=this.errorsFor(b),i=this.idOrName(b),j=a(b).attr("aria-describedby");h.length?(h.removeClass(this.settings.validClass).addClass(this.settings.errorClass),h.html(c)):(h=a("<"+this.settings.errorElement+">").attr("id",i+"-error").addClass(this.settings.errorClass).html(c||""),d=h,this.settings.wrapper&&(d=h.hide().show().wrap("<"+this.settings.wrapper+"/>").parent()),this.labelContainer.length?this.labelContainer.append(d):this.settings.errorPlacement?this.settings.errorPlacement.call(this,d,a(b)):d.insertAfter(b),h.is("label")?h.attr("for",i):0===h.parents("label[for='"+this.escapeCssMeta(i)+"']").length&&(f=h.attr("id"),j?j.match(new RegExp("\\b"+this.escapeCssMeta(f)+"\\b"))||(j+=" "+f):j=f,a(b).attr("aria-describedby",j),e=this.groups[b.name],e&&(g=this,a.each(g.groups,function(b,c){c===e&&a("[name='"+g.escapeCssMeta(b)+"']",g.currentForm).attr("aria-describedby",h.attr("id"))})))),!c&&this.settings.success&&(h.text(""),"string"==typeof this.settings.success?h.addClass(this.settings.success):this.settings.success(h,b)),this.toShow=this.toShow.add(h)},errorsFor:function(b){var c=this.escapeCssMeta(this.idOrName(b)),d=a(b).attr("aria-describedby"),e="label[for='"+c+"'], label[for='"+c+"'] *";return d&&(e=e+", #"+this.escapeCssMeta(d).replace(/\s+/g,", #")),this.errors().filter(e)},escapeCssMeta:function(a){return void 0===a?"":a.replace(/([\\!"#$%&'()*+,./:;<=>?@\[\]^`{|}~])/g,"\\$1")},idOrName:function(a){return this.groups[a.name]||(this.checkable(a)?a.name:a.id||a.name)},validationTargetFor:function(b){return this.checkable(b)&&(b=this.findByName(b.name)),a(b).not(this.settings.ignore)[0]},checkable:function(a){return/radio|checkbox/i.test(a.type)},findByName:function(b){return a(this.currentForm).find("[name='"+this.escapeCssMeta(b)+"']")},getLength:function(b,c){switch(c.nodeName.toLowerCase()){case"select":return a("option:selected",c).length;case"input":if(this.checkable(c))return this.findByName(c.name).filter(":checked").length}return b.length},depend:function(a,b){return!this.dependTypes[typeof a]||this.dependTypes[typeof a](a,b)},dependTypes:{"boolean":function(a){return a},string:function(b,c){return!!a(b,c.form).length},"function":function(a,b){return a(b)}},optional:function(b){var c=this.elementValue(b);return!a.validator.methods.required.call(this,c,b)&&"dependency-mismatch"},startRequest:function(b){this.pending[b.name]||(this.pendingRequest++,a(b).addClass(this.settings.pendingClass),this.pending[b.name]=!0)},stopRequest:function(b,c){this.pendingRequest--,this.pendingRequest<0&&(this.pendingRequest=0),delete this.pending[b.name],a(b).removeClass(this.settings.pendingClass),c&&0===this.pendingRequest&&this.formSubmitted&&this.form()&&0===this.pendingRequest?(a(this.currentForm).trigger("submit"),this.submitButton&&a("input:hidden[name='"+this.submitButton.name+"']",this.currentForm).remove(),this.formSubmitted=!1):!c&&0===this.pendingRequest&&this.formSubmitted&&(a(this.currentForm).triggerHandler("invalid-form",[this]),this.formSubmitted=!1)},previousValue:function(b,c){return c="string"==typeof c&&c||"remote",a.data(b,"previousValue")||a.data(b,"previousValue",{old:null,valid:!0,message:this.defaultMessage(b,{method:c})})},destroy:function(){this.resetForm(),a(this.currentForm).off(".validate").removeData("validator").find(".validate-equalTo-blur").off(".validate-equalTo").removeClass("validate-equalTo-blur").find(".validate-lessThan-blur").off(".validate-lessThan").removeClass("validate-lessThan-blur").find(".validate-lessThanEqual-blur").off(".validate-lessThanEqual").removeClass("validate-lessThanEqual-blur").find(".validate-greaterThanEqual-blur").off(".validate-greaterThanEqual").removeClass("validate-greaterThanEqual-blur").find(".validate-greaterThan-blur").off(".validate-greaterThan").removeClass("validate-greaterThan-blur")}},classRuleSettings:{required:{required:!0},email:{email:!0},url:{url:!0},date:{date:!0},dateISO:{dateISO:!0},number:{number:!0},digits:{digits:!0},creditcard:{creditcard:!0}},addClassRules:function(b,c){b.constructor===String?this.classRuleSettings[b]=c:a.extend(this.classRuleSettings,b)},classRules:function(b){var c={},d=a(b).attr("class");return d&&a.each(d.split(" "),function(){this in a.validator.classRuleSettings&&a.extend(c,a.validator.classRuleSettings[this])}),c},normalizeAttributeRule:function(a,b,c,d){/min|max|step/.test(c)&&(null===b||/number|range|text/.test(b))&&(d=Number(d),isNaN(d)&&(d=void 0)),d||0===d?a[c]=d:b===c&&"range"!==b&&(a["date"===b?"dateISO":c]=!0)},attributeRules:function(b){var c,d,e={},f=a(b),g=b.getAttribute("type");for(c in a.validator.methods)"required"===c?(d=b.getAttribute(c),""===d&&(d=!0),d=!!d):d=f.attr(c),this.normalizeAttributeRule(e,g,c,d);return e.maxlength&&/-1|2147483647|524288/.test(e.maxlength)&&delete e.maxlength,e},dataRules:function(b){var c,d,e={},f=a(b),g=b.getAttribute("type");for(c in a.validator.methods)d=f.data("rule"+c.charAt(0).toUpperCase()+c.substring(1).toLowerCase()),""===d&&(d=!0),this.normalizeAttributeRule(e,g,c,d);return e},staticRules:function(b){var c={},d=a.data(b.form,"validator");return d.settings.rules&&(c=a.validator.normalizeRule(d.settings.rules[b.name])||{}),c},normalizeRules:function(b,c){return a.each(b,function(d,e){if(e===!1)return void delete b[d];if(e.param||e.depends){var f=!0;switch(typeof e.depends){case"string":f=!!a(e.depends,c.form).length;break;case"function":f=e.depends.call(c,c)}f?b[d]=void 0===e.param||e.param:(a.data(c.form,"validator").resetElements(a(c)),delete b[d])}}),a.each(b,function(a,d){b[a]="function"==typeof d&&"normalizer"!==a?d(c):d}),a.each(["minlength","maxlength"],function(){b[this]&&(b[this]=Number(b[this]))}),a.each(["rangelength","range"],function(){var a;b[this]&&(Array.isArray(b[this])?b[this]=[Number(b[this][0]),Number(b[this][1])]:"string"==typeof b[this]&&(a=b[this].replace(/[\[\]]/g,"").split(/[\s,]+/),b[this]=[Number(a[0]),Number(a[1])]))}),a.validator.autoCreateRanges&&(null!=b.min&&null!=b.max&&(b.range=[b.min,b.max],delete b.min,delete b.max),null!=b.minlength&&null!=b.maxlength&&(b.rangelength=[b.minlength,b.maxlength],delete b.minlength,delete b.maxlength)),b},normalizeRule:function(b){if("string"==typeof b){var c={};a.each(b.split(/\s/),function(){c[this]=!0}),b=c}return b},addMethod:function(b,c,d){a.validator.methods[b]=c,a.validator.messages[b]=void 0!==d?d:a.validator.messages[b],c.length<3&&a.validator.addClassRules(b,a.validator.normalizeRule(b))},methods:{required:function(b,c,d){if(!this.depend(d,c))return"dependency-mismatch";if("select"===c.nodeName.toLowerCase()){var e=a(c).val();return e&&e.length>0}return this.checkable(c)?this.getLength(b,c)>0:void 0!==b&&null!==b&&b.length>0},email:function(a,b){return this.optional(b)||/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(a)},url:function(a,b){return this.optional(b)||/^(?:(?:(?:https?|ftp):)?\/\/)(?:(?:[^\]\[?\/<~#`!@$^&*()+=}|:";',>{ ]|%[0-9A-Fa-f]{2})+(?::(?:[^\]\[?\/<~#`!@$^&*()+=}|:";',>{ ]|%[0-9A-Fa-f]{2})*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(a)},date:function(){var a=!1;return function(b,c){return a||(a=!0,this.settings.debug&&window.console&&console.warn("The `date` method is deprecated and will be removed in version '2.0.0'.\nPlease don't use it, since it relies on the Date constructor, which\nbehaves very differently across browsers and locales. Use `dateISO`\ninstead or one of the locale specific methods in `localizations/`\nand `additional-methods.js`.")),this.optional(c)||!/Invalid|NaN/.test(new Date(b).toString())}}(),dateISO:function(a,b){return this.optional(b)||/^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/.test(a)},number:function(a,b){return this.optional(b)||/^(?:-?\d+|-?\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test(a)},digits:function(a,b){return this.optional(b)||/^\d+$/.test(a)},minlength:function(a,b,c){var d=Array.isArray(a)?a.length:this.getLength(a,b);return this.optional(b)||d>=c},maxlength:function(a,b,c){var d=Array.isArray(a)?a.length:this.getLength(a,b);return this.optional(b)||d<=c},rangelength:function(a,b,c){var d=Array.isArray(a)?a.length:this.getLength(a,b);return this.optional(b)||d>=c[0]&&d<=c[1]},min:function(a,b,c){return this.optional(b)||a>=c},max:function(a,b,c){return this.optional(b)||a<=c},range:function(a,b,c){return this.optional(b)||a>=c[0]&&a<=c[1]},step:function(b,c,d){var e,f=a(c).attr("type"),g="Step attribute on input type "+f+" is not supported.",h=["text","number","range"],i=new RegExp("\\b"+f+"\\b"),j=f&&!i.test(h.join()),k=function(a){var b=(""+a).match(/(?:\.(\d+))?$/);return b&&b[1]?b[1].length:0},l=function(a){return Math.round(a*Math.pow(10,e))},m=!0;if(j)throw new Error(g);return e=k(d),(k(b)>e||l(b)%l(d)!==0)&&(m=!1),this.optional(c)||m},equalTo:function(b,c,d){var e=a(d);return this.settings.onfocusout&&e.not(".validate-equalTo-blur").length&&e.addClass("validate-equalTo-blur").on("blur.validate-equalTo",function(){a(c).valid()}),b===e.val()},remote:function(b,c,d,e){if(this.optional(c))return"dependency-mismatch";e="string"==typeof e&&e||"remote";var f,g,h,i=this.previousValue(c,e);return this.settings.messages[c.name]||(this.settings.messages[c.name]={}),i.originalMessage=i.originalMessage||this.settings.messages[c.name][e],this.settings.messages[c.name][e]=i.message,d="string"==typeof d&&{url:d}||d,h=a.param(a.extend({data:b},d.data)),i.old===h?i.valid:(i.old=h,f=this,this.startRequest(c),g={},g[c.name]=b,a.ajax(a.extend(!0,{mode:"abort",port:"validate"+c.name,dataType:"json",data:g,context:f.currentForm,success:function(a){var d,g,h,j=a===!0||"true"===a;f.settings.messages[c.name][e]=i.originalMessage,j?(h=f.formSubmitted,f.resetInternals(),f.toHide=f.errorsFor(c),f.formSubmitted=h,f.successList.push(c),f.invalid[c.name]=!1,f.showErrors()):(d={},g=a||f.defaultMessage(c,{method:e,parameters:b}),d[c.name]=i.message=g,f.invalid[c.name]=!0,f.showErrors(d)),i.valid=j,f.stopRequest(c,j)}},d)),"pending")}}});var c,d={};return a.ajaxPrefilter?a.ajaxPrefilter(function(a,b,c){var e=a.port;"abort"===a.mode&&(d[e]&&d[e].abort(),d[e]=c)}):(c=a.ajax,a.ajax=function(b){var e=("mode"in b?b:a.ajaxSettings).mode,f=("port"in b?b:a.ajaxSettings).port;return"abort"===e?(d[f]&&d[f].abort(),d[f]=c.apply(this,arguments),d[f]):c.apply(this,arguments)}),a});

/*!
 * jQuery Form Plugin
 * version: 4.3.0
 * Requires jQuery v1.7.2 or later
 * Project repository: https://github.com/jquery-form/form

 * Copyright 2017 Kevin Morris
 * Copyright 2006 M. Alsup

 * Dual licensed under the LGPL-2.1+ or MIT licenses
 * https://github.com/jquery-form/form#license

 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 */
!function(r){"function"==typeof define&&define.amd?define(["jquery"],r):"object"==typeof module&&module.exports?module.exports=function(e,t){return void 0===t&&(t="undefined"!=typeof window?require("jquery"):require("jquery")(e)),r(t),t}:r(jQuery)}(function(q){"use strict";var m=/\r?\n/g,S={};S.fileapi=void 0!==q('<input type="file">').get(0).files,S.formdata=void 0!==window.FormData;var _=!!q.fn.prop;function o(e){var t=e.data;e.isDefaultPrevented()||(e.preventDefault(),q(e.target).closest("form").ajaxSubmit(t))}function i(e){var t=e.target,r=q(t);if(!r.is("[type=submit],[type=image]")){var a=r.closest("[type=submit]");if(0===a.length)return;t=a[0]}var n,o=t.form;"image"===(o.clk=t).type&&(void 0!==e.offsetX?(o.clk_x=e.offsetX,o.clk_y=e.offsetY):"function"==typeof q.fn.offset?(n=r.offset(),o.clk_x=e.pageX-n.left,o.clk_y=e.pageY-n.top):(o.clk_x=e.pageX-t.offsetLeft,o.clk_y=e.pageY-t.offsetTop)),setTimeout(function(){o.clk=o.clk_x=o.clk_y=null},100)}function N(){var e;q.fn.ajaxSubmit.debug&&(e="[jquery.form] "+Array.prototype.join.call(arguments,""),window.console&&window.console.log?window.console.log(e):window.opera&&window.opera.postError&&window.opera.postError(e))}q.fn.attr2=function(){if(!_)return this.attr.apply(this,arguments);var e=this.prop.apply(this,arguments);return e&&e.jquery||"string"==typeof e?e:this.attr.apply(this,arguments)},q.fn.ajaxSubmit=function(M,e,t,r){if(!this.length)return N("ajaxSubmit: skipping submit process - no element selected"),this;var O,a,n,o,X=this;"function"==typeof M?M={success:M}:"string"==typeof M||!1===M&&0<arguments.length?(M={url:M,data:e,dataType:t},"function"==typeof r&&(M.success=r)):void 0===M&&(M={}),O=M.method||M.type||this.attr2("method"),n=(n=(n="string"==typeof(a=M.url||this.attr2("action"))?q.trim(a):"")||window.location.href||"")&&(n.match(/^([^#]+)/)||[])[1],o=/(MSIE|Trident)/.test(navigator.userAgent||"")&&/^https/i.test(window.location.href||"")?"javascript:false":"about:blank",M=q.extend(!0,{url:n,success:q.ajaxSettings.success,type:O||q.ajaxSettings.type,iframeSrc:o},M);var i={};if(this.trigger("form-pre-serialize",[this,M,i]),i.veto)return N("ajaxSubmit: submit vetoed via form-pre-serialize trigger"),this;if(M.beforeSerialize&&!1===M.beforeSerialize(this,M))return N("ajaxSubmit: submit aborted via beforeSerialize callback"),this;var s=M.traditional;void 0===s&&(s=q.ajaxSettings.traditional);var u,c,C=[],l=this.formToArray(M.semantic,C,M.filtering);if(M.data&&(c=q.isFunction(M.data)?M.data(l):M.data,M.extraData=c,u=q.param(c,s)),M.beforeSubmit&&!1===M.beforeSubmit(l,this,M))return N("ajaxSubmit: submit aborted via beforeSubmit callback"),this;if(this.trigger("form-submit-validate",[l,this,M,i]),i.veto)return N("ajaxSubmit: submit vetoed via form-submit-validate trigger"),this;var f=q.param(l,s);u&&(f=f?f+"&"+u:u),"GET"===M.type.toUpperCase()?(M.url+=(0<=M.url.indexOf("?")?"&":"?")+f,M.data=null):M.data=f;var d,m,p,h=[];M.resetForm&&h.push(function(){X.resetForm()}),M.clearForm&&h.push(function(){X.clearForm(M.includeHidden)}),!M.dataType&&M.target?(d=M.success||function(){},h.push(function(e,t,r){var a=arguments,n=M.replaceTarget?"replaceWith":"html";q(M.target)[n](e).each(function(){d.apply(this,a)})})):M.success&&(q.isArray(M.success)?q.merge(h,M.success):h.push(M.success)),M.success=function(e,t,r){for(var a=M.context||this,n=0,o=h.length;n<o;n++)h[n].apply(a,[e,t,r||X,X])},M.error&&(m=M.error,M.error=function(e,t,r){var a=M.context||this;m.apply(a,[e,t,r,X])}),M.complete&&(p=M.complete,M.complete=function(e,t){var r=M.context||this;p.apply(r,[e,t,X])});var v=0<q("input[type=file]:enabled",this).filter(function(){return""!==q(this).val()}).length,g="multipart/form-data",x=X.attr("enctype")===g||X.attr("encoding")===g,y=S.fileapi&&S.formdata;N("fileAPI :"+y);var b,T=(v||x)&&!y;!1!==M.iframe&&(M.iframe||T)?M.closeKeepAlive?q.get(M.closeKeepAlive,function(){b=w(l)}):b=w(l):b=(v||x)&&y?function(e){for(var r=new FormData,t=0;t<e.length;t++)r.append(e[t].name,e[t].value);if(M.extraData){var a=function(e){var t,r,a=q.param(e,M.traditional).split("&"),n=a.length,o=[];for(t=0;t<n;t++)a[t]=a[t].replace(/\+/g," "),r=a[t].split("="),o.push([decodeURIComponent(r[0]),decodeURIComponent(r[1])]);return o}(M.extraData);for(t=0;t<a.length;t++)a[t]&&r.append(a[t][0],a[t][1])}M.data=null;var n=q.extend(!0,{},q.ajaxSettings,M,{contentType:!1,processData:!1,cache:!1,type:O||"POST"});M.uploadProgress&&(n.xhr=function(){var e=q.ajaxSettings.xhr();return e.upload&&e.upload.addEventListener("progress",function(e){var t=0,r=e.loaded||e.position,a=e.total;e.lengthComputable&&(t=Math.ceil(r/a*100)),M.uploadProgress(e,r,a,t)},!1),e});n.data=null;var o=n.beforeSend;return n.beforeSend=function(e,t){M.formData?t.data=M.formData:t.data=r,o&&o.call(this,e,t)},q.ajax(n)}(l):q.ajax(M),X.removeData("jqxhr").data("jqxhr",b);for(var j=0;j<C.length;j++)C[j]=null;return this.trigger("form-submit-notify",[this,M]),this;function w(e){var t,r,l,f,o,d,m,p,a,n,h,v,i=X[0],g=q.Deferred();if(g.abort=function(e){p.abort(e)},e)for(r=0;r<C.length;r++)t=q(C[r]),_?t.prop("disabled",!1):t.removeAttr("disabled");(l=q.extend(!0,{},q.ajaxSettings,M)).context=l.context||l,o="jqFormIO"+(new Date).getTime();var s=i.ownerDocument,u=X.closest("body");if(l.iframeTarget?(n=(d=q(l.iframeTarget,s)).attr2("name"))?o=n:d.attr2("name",o):(d=q('<iframe name="'+o+'" src="'+l.iframeSrc+'" />',s)).css({position:"absolute",top:"-1000px",left:"-1000px"}),m=d[0],p={aborted:0,responseText:null,responseXML:null,status:0,statusText:"n/a",getAllResponseHeaders:function(){},getResponseHeader:function(){},setRequestHeader:function(){},abort:function(e){var t="timeout"===e?"timeout":"aborted";N("aborting upload... "+t),this.aborted=1;try{m.contentWindow.document.execCommand&&m.contentWindow.document.execCommand("Stop")}catch(e){}d.attr("src",l.iframeSrc),p.error=t,l.error&&l.error.call(l.context,p,t,e),f&&q.event.trigger("ajaxError",[p,l,t]),l.complete&&l.complete.call(l.context,p,t)}},(f=l.global)&&0==q.active++&&q.event.trigger("ajaxStart"),f&&q.event.trigger("ajaxSend",[p,l]),l.beforeSend&&!1===l.beforeSend.call(l.context,p,l))return l.global&&q.active--,g.reject(),g;if(p.aborted)return g.reject(),g;(a=i.clk)&&(n=a.name)&&!a.disabled&&(l.extraData=l.extraData||{},l.extraData[n]=a.value,"image"===a.type&&(l.extraData[n+".x"]=i.clk_x,l.extraData[n+".y"]=i.clk_y));var x=1,y=2;function b(t){var r=null;try{t.contentWindow&&(r=t.contentWindow.document)}catch(e){N("cannot get iframe.contentWindow document: "+e)}if(r)return r;try{r=t.contentDocument?t.contentDocument:t.document}catch(e){N("cannot get iframe.contentDocument: "+e),r=t.document}return r}var c=q("meta[name=csrf-token]").attr("content"),T=q("meta[name=csrf-param]").attr("content");function j(){var e=X.attr2("target"),t=X.attr2("action"),r=X.attr("enctype")||X.attr("encoding")||"multipart/form-data";i.setAttribute("target",o),O&&!/post/i.test(O)||i.setAttribute("method","POST"),t!==l.url&&i.setAttribute("action",l.url),l.skipEncodingOverride||O&&!/post/i.test(O)||X.attr({encoding:"multipart/form-data",enctype:"multipart/form-data"}),l.timeout&&(v=setTimeout(function(){h=!0,A(x)},l.timeout));var a=[];try{if(l.extraData)for(var n in l.extraData)l.extraData.hasOwnProperty(n)&&(q.isPlainObject(l.extraData[n])&&l.extraData[n].hasOwnProperty("name")&&l.extraData[n].hasOwnProperty("value")?a.push(q('<input type="hidden" name="'+l.extraData[n].name+'">',s).val(l.extraData[n].value).appendTo(i)[0]):a.push(q('<input type="hidden" name="'+n+'">',s).val(l.extraData[n]).appendTo(i)[0]));l.iframeTarget||d.appendTo(u),m.attachEvent?m.attachEvent("onload",A):m.addEventListener("load",A,!1),setTimeout(function e(){try{var t=b(m).readyState;N("state = "+t),t&&"uninitialized"===t.toLowerCase()&&setTimeout(e,50)}catch(e){N("Server abort: ",e," (",e.name,")"),A(y),v&&clearTimeout(v),v=void 0}},15);try{i.submit()}catch(e){document.createElement("form").submit.apply(i)}}finally{i.setAttribute("action",t),i.setAttribute("enctype",r),e?i.setAttribute("target",e):X.removeAttr("target"),q(a).remove()}}T&&c&&(l.extraData=l.extraData||{},l.extraData[T]=c),l.forceSync?j():setTimeout(j,10);var w,S,k,D=50;function A(e){if(!p.aborted&&!k){if((S=b(m))||(N("cannot access response document"),e=y),e===x&&p)return p.abort("timeout"),void g.reject(p,"timeout");if(e===y&&p)return p.abort("server abort"),void g.reject(p,"error","server abort");if(S&&S.location.href!==l.iframeSrc||h){m.detachEvent?m.detachEvent("onload",A):m.removeEventListener("load",A,!1);var t,r="success";try{if(h)throw"timeout";var a="xml"===l.dataType||S.XMLDocument||q.isXMLDoc(S);if(N("isXml="+a),!a&&window.opera&&(null===S.body||!S.body.innerHTML)&&--D)return N("requeing onLoad callback, DOM not available"),void setTimeout(A,250);var n=S.body?S.body:S.documentElement;p.responseText=n?n.innerHTML:null,p.responseXML=S.XMLDocument?S.XMLDocument:S,a&&(l.dataType="xml"),p.getResponseHeader=function(e){return{"content-type":l.dataType}[e.toLowerCase()]},n&&(p.status=Number(n.getAttribute("status"))||p.status,p.statusText=n.getAttribute("statusText")||p.statusText);var o,i,s,u=(l.dataType||"").toLowerCase(),c=/(json|script|text)/.test(u);c||l.textarea?(o=S.getElementsByTagName("textarea")[0])?(p.responseText=o.value,p.status=Number(o.getAttribute("status"))||p.status,p.statusText=o.getAttribute("statusText")||p.statusText):c&&(i=S.getElementsByTagName("pre")[0],s=S.getElementsByTagName("body")[0],i?p.responseText=i.textContent?i.textContent:i.innerText:s&&(p.responseText=s.textContent?s.textContent:s.innerText)):"xml"===u&&!p.responseXML&&p.responseText&&(p.responseXML=F(p.responseText));try{w=E(p,u,l)}catch(e){r="parsererror",p.error=t=e||r}}catch(e){N("error caught: ",e),r="error",p.error=t=e||r}p.aborted&&(N("upload aborted"),r=null),p.status&&(r=200<=p.status&&p.status<300||304===p.status?"success":"error"),"success"===r?(l.success&&l.success.call(l.context,w,"success",p),g.resolve(p.responseText,"success",p),f&&q.event.trigger("ajaxSuccess",[p,l])):r&&(void 0===t&&(t=p.statusText),l.error&&l.error.call(l.context,p,r,t),g.reject(p,"error",t),f&&q.event.trigger("ajaxError",[p,l,t])),f&&q.event.trigger("ajaxComplete",[p,l]),f&&!--q.active&&q.event.trigger("ajaxStop"),l.complete&&l.complete.call(l.context,p,r),k=!0,l.timeout&&clearTimeout(v),setTimeout(function(){l.iframeTarget?d.attr("src",l.iframeSrc):d.remove(),p.responseXML=null},100)}}}var F=q.parseXML||function(e,t){return window.ActiveXObject?((t=new ActiveXObject("Microsoft.XMLDOM")).async="false",t.loadXML(e)):t=(new DOMParser).parseFromString(e,"text/xml"),t&&t.documentElement&&"parsererror"!==t.documentElement.nodeName?t:null},L=q.parseJSON||function(e){return window.eval("("+e+")")},E=function(e,t,r){var a=e.getResponseHeader("content-type")||"",n=("xml"===t||!t)&&0<=a.indexOf("xml"),o=n?e.responseXML:e.responseText;return n&&"parsererror"===o.documentElement.nodeName&&q.error&&q.error("parsererror"),r&&r.dataFilter&&(o=r.dataFilter(o,t)),"string"==typeof o&&(("json"===t||!t)&&0<=a.indexOf("json")?o=L(o):("script"===t||!t)&&0<=a.indexOf("javascript")&&q.globalEval(o)),o};return g}},q.fn.ajaxForm=function(e,t,r,a){if(("string"==typeof e||!1===e&&0<arguments.length)&&(e={url:e,data:t,dataType:r},"function"==typeof a&&(e.success=a)),(e=e||{}).delegation=e.delegation&&q.isFunction(q.fn.on),e.delegation||0!==this.length)return e.delegation?(q(document).off("submit.form-plugin",this.selector,o).off("click.form-plugin",this.selector,i).on("submit.form-plugin",this.selector,e,o).on("click.form-plugin",this.selector,e,i),this):(e.beforeFormUnbind&&e.beforeFormUnbind(this,e),this.ajaxFormUnbind().on("submit.form-plugin",e,o).on("click.form-plugin",e,i));var n={s:this.selector,c:this.context};return!q.isReady&&n.s?(N("DOM not ready, queuing ajaxForm"),q(function(){q(n.s,n.c).ajaxForm(e)})):N("terminating; zero elements found by selector"+(q.isReady?"":" (DOM not ready)")),this},q.fn.ajaxFormUnbind=function(){return this.off("submit.form-plugin click.form-plugin")},q.fn.formToArray=function(e,t,r){var a=[];if(0===this.length)return a;var n,o,i,s,u,c,l,f,d,m,p=this[0],h=this.attr("id"),v=(v=e||void 0===p.elements?p.getElementsByTagName("*"):p.elements)&&q.makeArray(v);if(h&&(e||/(Edge|Trident)\//.test(navigator.userAgent))&&(n=q(':input[form="'+h+'"]').get()).length&&(v=(v||[]).concat(n)),!v||!v.length)return a;for(q.isFunction(r)&&(v=q.map(v,r)),o=0,c=v.length;o<c;o++)if((m=(u=v[o]).name)&&!u.disabled)if(e&&p.clk&&"image"===u.type)p.clk===u&&(a.push({name:m,value:q(u).val(),type:u.type}),a.push({name:m+".x",value:p.clk_x},{name:m+".y",value:p.clk_y}));else if((s=q.fieldValue(u,!0))&&s.constructor===Array)for(t&&t.push(u),i=0,l=s.length;i<l;i++)a.push({name:m,value:s[i]});else if(S.fileapi&&"file"===u.type){t&&t.push(u);var g=u.files;if(g.length)for(i=0;i<g.length;i++)a.push({name:m,value:g[i],type:u.type});else a.push({name:m,value:"",type:u.type})}else null!=s&&(t&&t.push(u),a.push({name:m,value:s,type:u.type,required:u.required}));return e||!p.clk||(m=(d=(f=q(p.clk))[0]).name)&&!d.disabled&&"image"===d.type&&(a.push({name:m,value:f.val()}),a.push({name:m+".x",value:p.clk_x},{name:m+".y",value:p.clk_y})),a},q.fn.formSerialize=function(e){return q.param(this.formToArray(e))},q.fn.fieldSerialize=function(n){var o=[];return this.each(function(){var e=this.name;if(e){var t=q.fieldValue(this,n);if(t&&t.constructor===Array)for(var r=0,a=t.length;r<a;r++)o.push({name:e,value:t[r]});else null!=t&&o.push({name:this.name,value:t})}}),q.param(o)},q.fn.fieldValue=function(e){for(var t=[],r=0,a=this.length;r<a;r++){var n=this[r],o=q.fieldValue(n,e);null==o||o.constructor===Array&&!o.length||(o.constructor===Array?q.merge(t,o):t.push(o))}return t},q.fieldValue=function(e,t){var r=e.name,a=e.type,n=e.tagName.toLowerCase();if(void 0===t&&(t=!0),t&&(!r||e.disabled||"reset"===a||"button"===a||("checkbox"===a||"radio"===a)&&!e.checked||("submit"===a||"image"===a)&&e.form&&e.form.clk!==e||"select"===n&&-1===e.selectedIndex))return null;if("select"!==n)return q(e).val().replace(m,"\r\n");var o=e.selectedIndex;if(o<0)return null;for(var i=[],s=e.options,u="select-one"===a,c=u?o+1:s.length,l=u?o:0;l<c;l++){var f=s[l];if(f.selected&&!f.disabled){var d=(d=f.value)||(f.attributes&&f.attributes.value&&!f.attributes.value.specified?f.text:f.value);if(u)return d;i.push(d)}}return i},q.fn.clearForm=function(e){return this.each(function(){q("input,select,textarea",this).clearFields(e)})},q.fn.clearFields=q.fn.clearInputs=function(r){var a=/^(?:color|date|datetime|email|month|number|password|range|search|tel|text|time|url|week)$/i;return this.each(function(){var e=this.type,t=this.tagName.toLowerCase();a.test(e)||"textarea"===t?this.value="":"checkbox"===e||"radio"===e?this.checked=!1:"select"===t?this.selectedIndex=-1:"file"===e?/MSIE/.test(navigator.userAgent)?q(this).replaceWith(q(this).clone(!0)):q(this).val(""):r&&(!0===r&&/hidden/.test(e)||"string"==typeof r&&q(this).is(r))&&(this.value="")})},q.fn.resetForm=function(){return this.each(function(){var t=q(this),e=this.tagName.toLowerCase();switch(e){case"input":this.checked=this.defaultChecked;case"textarea":return this.value=this.defaultValue,!0;case"option":case"optgroup":var r=t.parents("select");return r.length&&r[0].multiple?"option"===e?this.selected=this.defaultSelected:t.find("option").resetForm():r.resetForm(),!0;case"select":return t.find("option").each(function(e){if(this.selected=this.defaultSelected,this.defaultSelected&&!t[0].multiple)return t[0].selectedIndex=e,!1}),!0;case"label":var a=q(t.attr("for")),n=t.find("input,select,textarea");return a[0]&&n.unshift(a[0]),n.resetForm(),!0;case"form":return"function"!=typeof this.reset&&("object"!=typeof this.reset||this.reset.nodeType)||this.reset(),!0;default:return t.find("form,input,label,select,textarea").resetForm(),!0}})},q.fn.enable=function(e){return void 0===e&&(e=!0),this.each(function(){this.disabled=!e})},q.fn.selected=function(r){return void 0===r&&(r=!0),this.each(function(){var e,t=this.type;"checkbox"===t||"radio"===t?this.checked=r:"option"===this.tagName.toLowerCase()&&(e=q(this).parent("select"),r&&e[0]&&"select-one"===e[0].type&&e.find("option").selected(!1),this.selected=r)})},q.fn.ajaxSubmit.debug=!1});

/**
 * jQuery gMap - Google Maps API V3
 *
 * @license MIT License; https://www.opensource.org/licenses/mit-license.php
 * @url   https://github.com/marioestrada/jQuery-gMap
 * @author  Mario Estrada <me@mario.ec> based on original plugin by Cedric Kastner <cedric@nur-text.de>
 * @version 2.2
 */
/* global google */
!function(e){e.fn.gMap=function(o,a){switch(o){case"addMarker":return e(this).trigger("gMap.addMarker",[a.latitude,a.longitude,a.content,a.icon,a.popup]);case"centerAt":return e(this).trigger("gMap.centerAt",[a.latitude,a.longitude,a.zoom]);case"clearMarkers":return e(this).trigger("gMap.clearMarkers")}var n=e.extend({},e.fn.gMap.defaults,o);return this.each(function(){var o=new google.maps.Map(this);e(this).data("gMap.reference",o);var a=new google.maps.Geocoder;n.address?a.geocode({address:n.address},function(e){e&&e.length&&o.setCenter(e[0].geometry.location)}):n.latitude&&n.longitude?o.setCenter(new google.maps.LatLng(n.latitude,n.longitude)):e.isArray(n.markers)&&n.markers.length>0?n.markers[0].address?a.geocode({address:n.markers[0].address},function(e){e&&e.length>0&&o.setCenter(e[0].geometry.location)}):o.setCenter(new google.maps.LatLng(n.markers[0].latitude,n.markers[0].longitude)):o.setCenter(new google.maps.LatLng(34.885931,9.84375)),o.setZoom(n.zoom),o.setMapTypeId(google.maps.MapTypeId[n.maptype]);var s={scrollwheel:n.scrollwheel,disableDoubleClickZoom:!n.doubleclickzoom};n.controls===!1?e.extend(s,{disableDefaultUI:!0}):0!==n.controls.length&&e.extend(s,n.controls,{disableDefaultUI:!0}),o.setOptions(s),o.setOptions({styles:n.styles});var t,r,i=new google.maps.Marker;t=new google.maps.MarkerImage(n.icon.image),t.size=new google.maps.Size(n.icon.iconsize[0],n.icon.iconsize[1]),t.anchor=new google.maps.Point(n.icon.iconanchor[0],n.icon.iconanchor[1]),i.setIcon(t),n.icon.shadow&&(r=new google.maps.MarkerImage(n.icon.shadow),r.size=new google.maps.Size(n.icon.shadowsize[0],n.icon.shadowsize[1]),r.anchor=new google.maps.Point(n.icon.shadowanchor[0],n.icon.shadowanchor[1]),i.setShadow(r)),e(this).bind("gMap.centerAt",function(e,a,n,s){s&&o.setZoom(s),o.panTo(new google.maps.LatLng(parseFloat(a),parseFloat(n)))});var g=[];e(this).bind("gMap.clearMarkers",function(){for(;g[0];)g.pop().setMap(null)});var l;e(this).bind("gMap.addMarker",function(e,a,s,t,r,d){var c,p,m=new google.maps.LatLng(parseFloat(a),parseFloat(s)),h=new google.maps.Marker({position:m});if(r?(c=new google.maps.MarkerImage(r.image),c.size=new google.maps.Size(r.iconsize[0],r.iconsize[1]),c.anchor=new google.maps.Point(r.iconanchor[0],r.iconanchor[1]),h.setIcon(c),r.shadow&&(p=new google.maps.MarkerImage(r.shadow),p.size=new google.maps.Size(r.shadowsize[0],r.shadowsize[1]),p.anchor=new google.maps.Point(r.shadowanchor[0],r.shadowanchor[1]),i.setShadow(p))):(h.setIcon(i.getIcon()),h.setShadow(i.getShadow())),t){"_latlng"===t&&(t=a+", "+s);var w=new google.maps.InfoWindow({content:n.html_prepend+t+n.html_append});google.maps.event.addListener(h,"click",function(){l&&l.close(),w.open(o,h),l=w}),d&&google.maps.event.addListenerOnce(o,"tilesloaded",function(){w.open(o,h)})}h.setMap(o),g.push(h)});for(var d,c=this,p=function(o){return function(a){a&&a.length>0&&e(c).trigger("gMap.addMarker",[a[0].geometry.location.lat(),a[0].geometry.location.lng(),o.html,o.icon,o.popup])}},m=0;m<n.markers.length;m++)d=n.markers[m],d.address?("_address"===d.html&&(d.html=d.address),a.geocode({address:d.address},p(d))):e(this).trigger("gMap.addMarker",[d.latitude,d.longitude,d.html,d.icon,d.popup])})},e.fn.gMap.defaults={address:"",latitude:0,longitude:0,zoom:1,markers:[],controls:[],styles:[],scrollwheel:!1,doubleclickzoom:!0,maptype:"ROADMAP",html_prepend:'<div class="gmap_marker">',html_append:"</div>",icon:{image:"https://www.google.com/mapfiles/marker.png",shadow:"https://www.google.com/mapfiles/shadow50.png",iconsize:[20,34],shadowsize:[37,34],iconanchor:[9,34],shadowanchor:[6,34]}}}(jQuery);

/*
 * jQuery BBQ: Back Button & Query Library - v1.2.1 - 2/17/2010
 * http://benalman.com/projects/jquery-bbq-plugin/
 *
 * Copyright (c) 2010 "Cowboy" Ben Alman
 * Dual licensed under the MIT and GPL licenses.
 * http://benalman.com/about/license/
 */
(function($,r){var h,n=Array.prototype.slice,t=decodeURIComponent,a=$.param,j,c,m,y,b=$.bbq=$.bbq||{},s,x,k,e=$.event.special,d="hashchange",B="querystring",F="fragment",z="elemUrlAttr",l="href",w="src",p=/^.*\?|#.*$/g,u,H,g,i,C,E={};function G(I){return typeof I==="string"}function D(J){var I=n.call(arguments,1);return function(){return J.apply(this,I.concat(n.call(arguments)))}}function o(I){return I.replace(H,"$2")}function q(I){return I.replace(/(?:^[^?#]*\?([^#]*).*$)?.*/,"$1")}function f(K,P,I,L,J){var R,O,N,Q,M;if(L!==h){N=I.match(K?H:/^([^#?]*)\??([^#]*)(#?.*)/);M=N[3]||"";if(J===2&&G(L)){O=L.replace(K?u:p,"")}else{Q=m(N[2]);L=G(L)?m[K?F:B](L):L;O=J===2?L:J===1?$.extend({},L,Q):$.extend({},Q,L);O=j(O);if(K){O=O.replace(g,t)}}R=N[1]+(K?C:O||!N[1]?"?":"")+O+M}else{R=P(I!==h?I:location.href)}return R}a[B]=D(f,0,q);a[F]=c=D(f,1,o);a.sorted=j=function(J,K){var I=[],L={};$.each(a(J,K).split("&"),function(P,M){var O=M.replace(/(?:%5B|=).*$/,""),N=L[O];if(!N){N=L[O]=[];I.push(O)}N.push(M)});return $.map(I.sort(),function(M){return L[M]}).join("&")};c.noEscape=function(J){J=J||"";var I=$.map(J.split(""),encodeURIComponent);g=new RegExp(I.join("|"),"g")};c.noEscape(",/");c.ajaxCrawlable=function(I){if(I!==h){if(I){u=/^.*(?:#!|#)/;H=/^([^#]*)(?:#!|#)?(.*)$/;C="#!"}else{u=/^.*#/;H=/^([^#]*)#?(.*)$/;C="#"}i=!!I}return i};c.ajaxCrawlable(0);$.deparam=m=function(L,I){var K={},J={"true":!0,"false":!1,"null":null};$.each(L.replace(/\+/g," ").split("&"),function(O,T){var N=T.split("="),S=t(N[0]),M,R=K,P=0,U=S.split("]["),Q=U.length-1;if(/\[/.test(U[0])&&/\]$/.test(U[Q])){U[Q]=U[Q].replace(/\]$/,"");U=U.shift().split("[").concat(U);Q=U.length-1}else{Q=0}if(N.length===2){M=t(N[1]);if(I){M=M&&!isNaN(M)?+M:M==="undefined"?h:J[M]!==h?J[M]:M}if(Q){for(;P<=Q;P++){S=U[P]===""?R.length:U[P];R=R[S]=P<Q?R[S]||(U[P+1]&&isNaN(U[P+1])?{}:[]):M}}else{if($.isArray(K[S])){K[S].push(M)}else{if(K[S]!==h){K[S]=[K[S],M]}else{K[S]=M}}}}else{if(S){K[S]=I?h:""}}});return K};function A(K,I,J){if(I===h||typeof I==="boolean"){J=I;I=a[K?F:B]()}else{I=G(I)?I.replace(K?u:p,""):I}return m(I,J)}m[B]=D(A,0);m[F]=y=D(A,1);$[z]||($[z]=function(I){return $.extend(E,I)})({a:l,base:l,iframe:w,img:w,input:w,form:"action",link:l,script:w});k=$[z];function v(L,J,K,I){if(!G(K)&&typeof K!=="object"){I=K;K=J;J=h}return this.each(function(){var O=$(this),M=J||k()[(this.nodeName||"").toLowerCase()]||"",N=M&&O.attr(M)||"";O.attr(M,a[L](N,K,I))})}$.fn[B]=D(v,B);$.fn[F]=D(v,F);b.pushState=s=function(L,I){if(G(L)&&/^#/.test(L)&&I===h){I=2}var K=L!==h,J=c(location.href,K?L:{},K?I:2);location.href=J};b.getState=x=function(I,J){return I===h||typeof I==="boolean"?y(I):y(J)[I]};b.removeState=function(I){var J={};if(I!==h){J=x();$.each($.isArray(I)?I:arguments,function(L,K){delete J[K]})}s(J,2)};e[d]=$.extend(e[d],{add:function(I){var K;function J(M){var L=M[F]=c();M.getState=function(N,O){return N===h||typeof N==="boolean"?m(L,N):m(L,O)[N]};K.apply(this,arguments)}if($.isFunction(I)){K=I;return J}else{K=I.handler;I.handler=J}}})})(jQuery,this);
/*
 * jQuery hashchange event - v1.3 - 7/21/2010
 * http://benalman.com/projects/jquery-hashchange-plugin/
 *
 * Copyright (c) 2010 "Cowboy" Ben Alman
 * Dual licensed under the MIT and GPL licenses.
 * http://benalman.com/about/license/
 */
(function(e,t,n){"$:nomunge";function f(e){e=e||location.href;return"#"+e.replace(/^[^#]*#?(.*)$/,"$1")}var r="hashchange",i=document,s,o=e.event.special,u=i.documentMode,a="on"+r in t&&(u===n||u>7);e.fn[r]=function(e){return e?this.bind(r,e):this.trigger(r)};e.fn[r].delay=50;o[r]=e.extend(o[r],{setup:function(){if(a){return false}e(s.start)},teardown:function(){if(a){return false}e(s.stop)}});s=function(){function p(){var n=f(),i=h(u);if(n!==u){c(u=n,i);e(t).trigger(r)}else if(i!==u){location.href=location.href.replace(/#.*/,"")+i}o=setTimeout(p,e.fn[r].delay)}var s={},o,u=f(),l=function(e){return e},c=l,h=l;s.start=function(){o||p()};s.stop=function(){o&&clearTimeout(o);o=n};navigator.appName==="Microsoft Internet Explorer"&&!a&&function(){var t,n;s.start=function(){if(!t){n=e.fn[r].src;n=n&&n+f();t=e('<iframe tabindex="-1" title="empty"/>').hide().one("load",function(){n||c(f());p()}).attr("src",n||"javascript:0").insertAfter("body")[0].contentWindow;i.onpropertychange=function(){try{if(event.propertyName==="title"){t.document.title=i.title}}catch(e){}}}};s.stop=l;h=function(){return f(t.location.href)};c=function(n,s){var o=t.document,u=e.fn[r].domain;if(n!==s){o.title=i.title;o.open();u&&o.write('<script>document.domain="'+u+'"</script>');o.close();t.location.hash=n}}}();return s}()})(jQuery,this);

/*!
 * imagesLoaded PACKAGED v4.1.4
 * JavaScript is all like "You images are done yet or what?"
 * MIT License
 */

!function(e,t){"function"==typeof define&&define.amd?define("ev-emitter/ev-emitter",t):"object"==typeof module&&module.exports?module.exports=t():e.EvEmitter=t()}("undefined"!=typeof window?window:this,function(){function e(){}var t=e.prototype;return t.on=function(e,t){if(e&&t){var i=this._events=this._events||{},n=i[e]=i[e]||[];return n.indexOf(t)==-1&&n.push(t),this}},t.once=function(e,t){if(e&&t){this.on(e,t);var i=this._onceEvents=this._onceEvents||{},n=i[e]=i[e]||{};return n[t]=!0,this}},t.off=function(e,t){var i=this._events&&this._events[e];if(i&&i.length){var n=i.indexOf(t);return n!=-1&&i.splice(n,1),this}},t.emitEvent=function(e,t){var i=this._events&&this._events[e];if(i&&i.length){i=i.slice(0),t=t||[];for(var n=this._onceEvents&&this._onceEvents[e],o=0;o<i.length;o++){var r=i[o],s=n&&n[r];s&&(this.off(e,r),delete n[r]),r.apply(this,t)}return this}},t.allOff=function(){delete this._events,delete this._onceEvents},e}),function(e,t){"use strict";"function"==typeof define&&define.amd?define(["ev-emitter/ev-emitter"],function(i){return t(e,i)}):"object"==typeof module&&module.exports?module.exports=t(e,require("ev-emitter")):e.imagesLoaded=t(e,e.EvEmitter)}("undefined"!=typeof window?window:this,function(e,t){function i(e,t){for(var i in t)e[i]=t[i];return e}function n(e){if(Array.isArray(e))return e;var t="object"==typeof e&&"number"==typeof e.length;return t?d.call(e):[e]}function o(e,t,r){if(!(this instanceof o))return new o(e,t,r);var s=e;return"string"==typeof e&&(s=document.querySelectorAll(e)),s?(this.elements=n(s),this.options=i({},this.options),"function"==typeof t?r=t:i(this.options,t),r&&this.on("always",r),this.getImages(),h&&(this.jqDeferred=new h.Deferred),void setTimeout(this.check.bind(this))):void a.error("Bad element for imagesLoaded "+(s||e))}function r(e){this.img=e}function s(e,t){this.url=e,this.element=t,this.img=new Image}var h=e.jQuery,a=e.console,d=Array.prototype.slice;o.prototype=Object.create(t.prototype),o.prototype.options={},o.prototype.getImages=function(){this.images=[],this.elements.forEach(this.addElementImages,this)},o.prototype.addElementImages=function(e){"IMG"==e.nodeName&&this.addImage(e),this.options.background===!0&&this.addElementBackgroundImages(e);var t=e.nodeType;if(t&&u[t]){for(var i=e.querySelectorAll("img"),n=0;n<i.length;n++){var o=i[n];this.addImage(o)}if("string"==typeof this.options.background){var r=e.querySelectorAll(this.options.background);for(n=0;n<r.length;n++){var s=r[n];this.addElementBackgroundImages(s)}}}};var u={1:!0,9:!0,11:!0};return o.prototype.addElementBackgroundImages=function(e){var t=getComputedStyle(e);if(t)for(var i=/url\((['"])?(.*?)\1\)/gi,n=i.exec(t.backgroundImage);null!==n;){var o=n&&n[2];o&&this.addBackground(o,e),n=i.exec(t.backgroundImage)}},o.prototype.addImage=function(e){var t=new r(e);this.images.push(t)},o.prototype.addBackground=function(e,t){var i=new s(e,t);this.images.push(i)},o.prototype.check=function(){function e(e,i,n){setTimeout(function(){t.progress(e,i,n)})}var t=this;return this.progressedCount=0,this.hasAnyBroken=!1,this.images.length?void this.images.forEach(function(t){t.once("progress",e),t.check()}):void this.complete()},o.prototype.progress=function(e,t,i){this.progressedCount++,this.hasAnyBroken=this.hasAnyBroken||!e.isLoaded,this.emitEvent("progress",[this,e,t]),this.jqDeferred&&this.jqDeferred.notify&&this.jqDeferred.notify(this,e),this.progressedCount==this.images.length&&this.complete(),this.options.debug&&a&&a.log("progress: "+i,e,t)},o.prototype.complete=function(){var e=this.hasAnyBroken?"fail":"done";if(this.isComplete=!0,this.emitEvent(e,[this]),this.emitEvent("always",[this]),this.jqDeferred){var t=this.hasAnyBroken?"reject":"resolve";this.jqDeferred[t](this)}},r.prototype=Object.create(t.prototype),r.prototype.check=function(){var e=this.getIsImageComplete();return e?void this.confirm(0!==this.img.naturalWidth,"naturalWidth"):(this.proxyImage=new Image,this.proxyImage.addEventListener("load",this),this.proxyImage.addEventListener("error",this),this.img.addEventListener("load",this),this.img.addEventListener("error",this),void(this.proxyImage.src=this.img.src))},r.prototype.getIsImageComplete=function(){return this.img.complete&&this.img.naturalWidth},r.prototype.confirm=function(e,t){this.isLoaded=e,this.emitEvent("progress",[this,this.img,t])},r.prototype.handleEvent=function(e){var t="on"+e.type;this[t]&&this[t](e)},r.prototype.onload=function(){this.confirm(!0,"onload"),this.unbindEvents()},r.prototype.onerror=function(){this.confirm(!1,"onerror"),this.unbindEvents()},r.prototype.unbindEvents=function(){this.proxyImage.removeEventListener("load",this),this.proxyImage.removeEventListener("error",this),this.img.removeEventListener("load",this),this.img.removeEventListener("error",this)},s.prototype=Object.create(r.prototype),s.prototype.check=function(){this.img.addEventListener("load",this),this.img.addEventListener("error",this),this.img.src=this.url;var e=this.getIsImageComplete();e&&(this.confirm(0!==this.img.naturalWidth,"naturalWidth"),this.unbindEvents())},s.prototype.unbindEvents=function(){this.img.removeEventListener("load",this),this.img.removeEventListener("error",this)},s.prototype.confirm=function(e,t){this.isLoaded=e,this.emitEvent("progress",[this,this.element,t])},o.makeJQueryPlugin=function(t){t=t||e.jQuery,t&&(h=t,h.fn.imagesLoaded=function(e,t){var i=new o(this,e,t);return i.jqDeferred.promise(h(this))})},o.makeJQueryPlugin(),o});

/*!
 * Infinite Scroll PACKAGED v3.0.5
 * Automatically add next page
 *
 * Licensed GPLv3 for open source use
 * or Infinite Scroll Commercial License for commercial use
 *
 * https://infinite-scroll.com
 * Copyright 2018 Metafizzy
 */

!function(t,e){"function"==typeof define&&define.amd?define("jquery-bridget/jquery-bridget",["jquery"],function(i){return e(t,i)}):"object"==typeof module&&module.exports?module.exports=e(t,require("jquery")):t.jQueryBridget=e(t,t.jQuery)}(window,function(t,e){"use strict";function i(i,r,l){function a(t,e,n){var o,r="$()."+i+'("'+e+'")';return t.each(function(t,a){var h=l.data(a,i);if(!h)return void s(i+" not initialized. Cannot call methods, i.e. "+r);var c=h[e];if(!c||"_"==e.charAt(0))return void s(r+" is not a valid method");var u=c.apply(h,n);o=void 0===o?u:o}),void 0!==o?o:t}function h(t,e){t.each(function(t,n){var o=l.data(n,i);o?(o.option(e),o._init()):(o=new r(n,e),l.data(n,i,o))})}l=l||e||t.jQuery,l&&(r.prototype.option||(r.prototype.option=function(t){l.isPlainObject(t)&&(this.options=l.extend(!0,this.options,t))}),l.fn[i]=function(t){if("string"==typeof t){var e=o.call(arguments,1);return a(this,t,e)}return h(this,t),this},n(l))}function n(t){!t||t&&t.bridget||(t.bridget=i)}var o=Array.prototype.slice,r=t.console,s="undefined"==typeof r?function(){}:function(t){r.error(t)};return n(e||t.jQuery),i}),function(t,e){"function"==typeof define&&define.amd?define("ev-emitter/ev-emitter",e):"object"==typeof module&&module.exports?module.exports=e():t.EvEmitter=e()}("undefined"!=typeof window?window:this,function(){function t(){}var e=t.prototype;return e.on=function(t,e){if(t&&e){var i=this._events=this._events||{},n=i[t]=i[t]||[];return n.indexOf(e)==-1&&n.push(e),this}},e.once=function(t,e){if(t&&e){this.on(t,e);var i=this._onceEvents=this._onceEvents||{},n=i[t]=i[t]||{};return n[e]=!0,this}},e.off=function(t,e){var i=this._events&&this._events[t];if(i&&i.length){var n=i.indexOf(e);return n!=-1&&i.splice(n,1),this}},e.emitEvent=function(t,e){var i=this._events&&this._events[t];if(i&&i.length){i=i.slice(0),e=e||[];for(var n=this._onceEvents&&this._onceEvents[t],o=0;o<i.length;o++){var r=i[o],s=n&&n[r];s&&(this.off(t,r),delete n[r]),r.apply(this,e)}return this}},e.allOff=function(){delete this._events,delete this._onceEvents},t}),function(t,e){"use strict";"function"==typeof define&&define.amd?define("desandro-matches-selector/matches-selector",e):"object"==typeof module&&module.exports?module.exports=e():t.matchesSelector=e()}(window,function(){"use strict";var t=function(){var t=window.Element.prototype;if(t.matches)return"matches";if(t.matchesSelector)return"matchesSelector";for(var e=["webkit","moz","ms","o"],i=0;i<e.length;i++){var n=e[i],o=n+"MatchesSelector";if(t[o])return o}}();return function(e,i){return e[t](i)}}),function(t,e){"function"==typeof define&&define.amd?define("fizzy-ui-utils/utils",["desandro-matches-selector/matches-selector"],function(i){return e(t,i)}):"object"==typeof module&&module.exports?module.exports=e(t,require("desandro-matches-selector")):t.fizzyUIUtils=e(t,t.matchesSelector)}(window,function(t,e){var i={};i.extend=function(t,e){for(var i in e)t[i]=e[i];return t},i.modulo=function(t,e){return(t%e+e)%e};var n=Array.prototype.slice;i.makeArray=function(t){if(Array.isArray(t))return t;if(null===t||void 0===t)return[];var e="object"==typeof t&&"number"==typeof t.length;return e?n.call(t):[t]},i.removeFrom=function(t,e){var i=t.indexOf(e);i!=-1&&t.splice(i,1)},i.getParent=function(t,i){for(;t.parentNode&&t!=document.body;)if(t=t.parentNode,e(t,i))return t},i.getQueryElement=function(t){return"string"==typeof t?document.querySelector(t):t},i.handleEvent=function(t){var e="on"+t.type;this[e]&&this[e](t)},i.filterFindElements=function(t,n){t=i.makeArray(t);var o=[];return t.forEach(function(t){if(t instanceof HTMLElement){if(!n)return void o.push(t);e(t,n)&&o.push(t);for(var i=t.querySelectorAll(n),r=0;r<i.length;r++)o.push(i[r])}}),o},i.debounceMethod=function(t,e,i){i=i||100;var n=t.prototype[e],o=e+"Timeout";t.prototype[e]=function(){var t=this[o];clearTimeout(t);var e=arguments,r=this;this[o]=setTimeout(function(){n.apply(r,e),delete r[o]},i)}},i.docReady=function(t){var e=document.readyState;"complete"==e||"interactive"==e?setTimeout(t):document.addEventListener("DOMContentLoaded",t)},i.toDashed=function(t){return t.replace(/(.)([A-Z])/g,function(t,e,i){return e+"-"+i}).toLowerCase()};var o=t.console;return i.htmlInit=function(e,n){i.docReady(function(){var r=i.toDashed(n),s="data-"+r,l=document.querySelectorAll("["+s+"]"),a=document.querySelectorAll(".js-"+r),h=i.makeArray(l).concat(i.makeArray(a)),c=s+"-options",u=t.jQuery;h.forEach(function(t){var i,r=t.getAttribute(s)||t.getAttribute(c);try{i=r&&JSON.parse(r)}catch(l){return void(o&&o.error("Error parsing "+s+" on "+t.className+": "+l))}var a=new e(t,i);u&&u.data(t,n,a)})})},i}),function(t,e){"function"==typeof define&&define.amd?define("infinite-scroll/js/core",["ev-emitter/ev-emitter","fizzy-ui-utils/utils"],function(i,n){return e(t,i,n)}):"object"==typeof module&&module.exports?module.exports=e(t,require("ev-emitter"),require("fizzy-ui-utils")):t.InfiniteScroll=e(t,t.EvEmitter,t.fizzyUIUtils)}(window,function(t,e,i){function n(t,e){var s=i.getQueryElement(t);if(!s)return void console.error("Bad element for InfiniteScroll: "+(s||t));if(t=s,t.infiniteScrollGUID){var l=r[t.infiniteScrollGUID];return l.option(e),l}this.element=t,this.options=i.extend({},n.defaults),this.option(e),o&&(this.$element=o(this.element)),this.create()}var o=t.jQuery,r={};n.defaults={},n.create={},n.destroy={};var s=n.prototype;i.extend(s,e.prototype);var l=0;s.create=function(){var t=this.guid=++l;this.element.infiniteScrollGUID=t,r[t]=this,this.pageIndex=1,this.loadCount=0,this.updateGetPath();var e=this.getPath&&this.getPath();if(!e)return void console.error("Disabling InfiniteScroll");this.updateGetAbsolutePath(),this.log("initialized",[this.element.className]),this.callOnInit();for(var i in n.create)n.create[i].call(this)},s.option=function(t){i.extend(this.options,t)},s.callOnInit=function(){var t=this.options.onInit;t&&t.call(this,this)},s.dispatchEvent=function(t,e,i){this.log(t,i);var n=e?[e].concat(i):i;if(this.emitEvent(t,n),o&&this.$element){t+=".infiniteScroll";var r=t;if(e){var s=o.Event(e);s.type=t,r=s}this.$element.trigger(r,i)}};var a={initialized:function(t){return"on "+t},request:function(t){return"URL: "+t},load:function(t,e){return(t.title||"")+". URL: "+e},error:function(t,e){return t+". URL: "+e},append:function(t,e,i){return i.length+" items. URL: "+e},last:function(t,e){return"URL: "+e},history:function(t,e){return"URL: "+e},pageIndex:function(t,e){return"current page determined to be: "+t+" from "+e}};s.log=function(t,e){if(this.options.debug){var i="[InfiniteScroll] "+t,n=a[t];n&&(i+=". "+n.apply(this,e)),console.log(i)}},s.updateMeasurements=function(){this.windowHeight=t.innerHeight;var e=this.element.getBoundingClientRect();this.top=e.top+t.pageYOffset},s.updateScroller=function(){var e=this.options.elementScroll;if(!e)return void(this.scroller=t);if(this.scroller=e===!0?this.element:i.getQueryElement(e),!this.scroller)throw"Unable to find elementScroll: "+e},s.updateGetPath=function(){var t=this.options.path;if(!t)return void console.error("InfiniteScroll path option required. Set as: "+t);var e=typeof t;if("function"==e)return void(this.getPath=t);var i="string"==e&&t.match("{{#}}");return i?void this.updateGetPathTemplate(t):void this.updateGetPathSelector(t)},s.updateGetPathTemplate=function(t){this.getPath=function(){var e=this.pageIndex+1;return t.replace("{{#}}",e)}.bind(this);var e=t.replace("{{#}}","(\\d\\d?\\d?)"),i=new RegExp(e),n=location.href.match(i);n&&(this.pageIndex=parseInt(n[1],10),this.log("pageIndex",[this.pageIndex,"template string"]))};var h=[/^(.*?\/?page\/?)(\d\d?\d?)(.*?$)/,/^(.*?\/?\?page=)(\d\d?\d?)(.*?$)/,/(.*?)(\d\d?\d?)(?!.*\d)(.*?$)/];return s.updateGetPathSelector=function(t){var e=document.querySelector(t);if(!e)return void console.error("Bad InfiniteScroll path option. Next link not found: "+t);for(var i,n,o=e.getAttribute("href"),r=0;o&&r<h.length;r++){n=h[r];var s=o.match(n);if(s){i=s.slice(1);break}}return i?(this.isPathSelector=!0,this.getPath=function(){var t=this.pageIndex+1;return i[0]+t+i[2]}.bind(this),this.pageIndex=parseInt(i[1],10)-1,void this.log("pageIndex",[this.pageIndex,"next link"])):void console.error("InfiniteScroll unable to parse next link href: "+o)},s.updateGetAbsolutePath=function(){var t=this.getPath(),e=t.match(/^http/)||t.match(/^\//);if(e)return void(this.getAbsolutePath=this.getPath);var i=location.pathname,n=i.substring(0,i.lastIndexOf("/"));this.getAbsolutePath=function(){return n+"/"+this.getPath()}},n.create.hideNav=function(){var t=i.getQueryElement(this.options.hideNav);t&&(t.style.display="none",this.nav=t)},n.destroy.hideNav=function(){this.nav&&(this.nav.style.display="")},s.destroy=function(){this.allOff();for(var t in n.destroy)n.destroy[t].call(this);delete this.element.infiniteScrollGUID,delete r[this.guid],o&&this.$element&&o.removeData(this.element,"infiniteScroll")},n.throttle=function(t,e){e=e||200;var i,n;return function(){var o=+new Date,r=arguments,s=function(){i=o,t.apply(this,r)}.bind(this);i&&o<i+e?(clearTimeout(n),n=setTimeout(s,e)):s()}},n.data=function(t){t=i.getQueryElement(t);var e=t&&t.infiniteScrollGUID;return e&&r[e]},n.setJQuery=function(t){o=t},i.htmlInit(n,"infinite-scroll"),s._init=function(){},o&&o.bridget&&o.bridget("infiniteScroll",n),n}),function(t,e){"function"==typeof define&&define.amd?define("infinite-scroll/js/page-load",["./core"],function(i){return e(t,i)}):"object"==typeof module&&module.exports?module.exports=e(t,require("./core")):e(t,t.InfiniteScroll)}(window,function(t,e){function i(t){for(var e=document.createDocumentFragment(),i=0;t&&i<t.length;i++)e.appendChild(t[i]);return e}function n(t){for(var e=t.querySelectorAll("script"),i=0;i<e.length;i++){var n=e[i],r=document.createElement("script");o(n,r),r.innerHTML=n.innerHTML,n.parentNode.replaceChild(r,n)}}function o(t,e){for(var i=t.attributes,n=0;n<i.length;n++){var o=i[n];e.setAttribute(o.name,o.value)}}function r(t,e,i,n){var o=new XMLHttpRequest;o.open("GET",t,!0),o.responseType=e||"",o.setRequestHeader("X-Requested-With","XMLHttpRequest"),o.onload=function(){if(200==o.status)i(o.response);else{var t=new Error(o.statusText);n(t)}},o.onerror=function(){var e=new Error("Network error requesting "+t);n(e)},o.send()}var s=e.prototype;return e.defaults.loadOnScroll=!0,e.defaults.checkLastPage=!0,e.defaults.responseType="document",e.create.pageLoad=function(){this.canLoad=!0,this.on("scrollThreshold",this.onScrollThresholdLoad),this.on("load",this.checkLastPage),this.options.outlayer&&this.on("append",this.onAppendOutlayer)},s.onScrollThresholdLoad=function(){this.options.loadOnScroll&&this.loadNextPage()},s.loadNextPage=function(){if(!this.isLoading&&this.canLoad){var t=this.getAbsolutePath();this.isLoading=!0;var e=function(e){this.onPageLoad(e,t)}.bind(this),i=function(e){this.onPageError(e,t)}.bind(this);r(t,this.options.responseType,e,i),this.dispatchEvent("request",null,[t])}},s.onPageLoad=function(t,e){return this.options.append||(this.isLoading=!1),this.pageIndex++,this.loadCount++,this.dispatchEvent("load",null,[t,e]),this.appendNextPage(t,e),t},s.appendNextPage=function(t,e){var n=this.options.append,o="document"==this.options.responseType;if(o&&n){var r=t.querySelectorAll(n),s=i(r),l=function(){this.appendItems(r,s),this.isLoading=!1,this.dispatchEvent("append",null,[t,e,r])}.bind(this);this.options.outlayer?this.appendOutlayerItems(s,l):l()}},s.appendItems=function(t,e){t&&t.length&&(e=e||i(t),n(e),this.element.appendChild(e))},s.appendOutlayerItems=function(i,n){var o=e.imagesLoaded||t.imagesLoaded;return o?void o(i,n):(console.error("[InfiniteScroll] imagesLoaded required for outlayer option"),void(this.isLoading=!1))},s.onAppendOutlayer=function(t,e,i){this.options.outlayer.appended(i)},s.checkLastPage=function(t,e){var i=this.options.checkLastPage;if(i){var n=this.options.path;if("function"==typeof n){var o=this.getPath();if(!o)return void this.lastPageReached(t,e)}var r;if("string"==typeof i?r=i:this.isPathSelector&&(r=n),r&&t.querySelector){var s=t.querySelector(r);s||this.lastPageReached(t,e)}}},s.lastPageReached=function(t,e){this.canLoad=!1,this.dispatchEvent("last",null,[t,e])},s.onPageError=function(t,e){return this.isLoading=!1,this.canLoad=!1,this.dispatchEvent("error",null,[t,e]),t},e.create.prefill=function(){if(this.options.prefill){var t=this.options.append;if(!t)return void console.error("append option required for prefill. Set as :"+t);this.updateMeasurements(),this.updateScroller(),this.isPrefilling=!0,this.on("append",this.prefill),this.once("error",this.stopPrefill),this.once("last",this.stopPrefill),this.prefill()}},s.prefill=function(){var t=this.getPrefillDistance();this.isPrefilling=t>=0,this.isPrefilling?(this.log("prefill"),this.loadNextPage()):this.stopPrefill()},s.getPrefillDistance=function(){return this.options.elementScroll?this.scroller.clientHeight-this.scroller.scrollHeight:this.windowHeight-this.element.clientHeight},s.stopPrefill=function(){this.log("stopPrefill"),this.off("append",this.prefill)},e}),function(t,e){"function"==typeof define&&define.amd?define("infinite-scroll/js/scroll-watch",["./core","fizzy-ui-utils/utils"],function(i,n){return e(t,i,n)}):"object"==typeof module&&module.exports?module.exports=e(t,require("./core"),require("fizzy-ui-utils")):e(t,t.InfiniteScroll,t.fizzyUIUtils)}(window,function(t,e,i){var n=e.prototype;return e.defaults.scrollThreshold=400,e.create.scrollWatch=function(){this.pageScrollHandler=this.onPageScroll.bind(this),this.resizeHandler=this.onResize.bind(this);var t=this.options.scrollThreshold,e=t||0===t;e&&this.enableScrollWatch()},e.destroy.scrollWatch=function(){this.disableScrollWatch()},n.enableScrollWatch=function(){this.isScrollWatching||(this.isScrollWatching=!0,this.updateMeasurements(),this.updateScroller(),this.on("last",this.disableScrollWatch),this.bindScrollWatchEvents(!0))},n.disableScrollWatch=function(){this.isScrollWatching&&(this.bindScrollWatchEvents(!1),delete this.isScrollWatching)},n.bindScrollWatchEvents=function(e){var i=e?"addEventListener":"removeEventListener";this.scroller[i]("scroll",this.pageScrollHandler),t[i]("resize",this.resizeHandler)},n.onPageScroll=e.throttle(function(){var t=this.getBottomDistance();t<=this.options.scrollThreshold&&this.dispatchEvent("scrollThreshold")}),n.getBottomDistance=function(){return this.options.elementScroll?this.getElementBottomDistance():this.getWindowBottomDistance()},n.getWindowBottomDistance=function(){var e=this.top+this.element.clientHeight,i=t.pageYOffset+this.windowHeight;return e-i},n.getElementBottomDistance=function(){var t=this.scroller.scrollHeight,e=this.scroller.scrollTop+this.scroller.clientHeight;return t-e},n.onResize=function(){this.updateMeasurements()},i.debounceMethod(e,"onResize",150),e}),function(t,e){"function"==typeof define&&define.amd?define("infinite-scroll/js/history",["./core","fizzy-ui-utils/utils"],function(i,n){return e(t,i,n)}):"object"==typeof module&&module.exports?module.exports=e(t,require("./core"),require("fizzy-ui-utils")):e(t,t.InfiniteScroll,t.fizzyUIUtils)}(window,function(t,e,i){var n=e.prototype;e.defaults.history="replace";var o=document.createElement("a");return e.create.history=function(){if(this.options.history){o.href=this.getAbsolutePath();var t=o.origin||o.protocol+"//"+o.host,e=t==location.origin;return e?void(this.options.append?this.createHistoryAppend():this.createHistoryPageLoad()):void console.error("[InfiniteScroll] cannot set history with different origin: "+o.origin+" on "+location.origin+" . History behavior disabled.")}},n.createHistoryAppend=function(){this.updateMeasurements(),this.updateScroller(),this.scrollPages=[{top:0,path:location.href,title:document.title}],this.scrollPageIndex=0,this.scrollHistoryHandler=this.onScrollHistory.bind(this),this.unloadHandler=this.onUnload.bind(this),this.scroller.addEventListener("scroll",this.scrollHistoryHandler),this.on("append",this.onAppendHistory),this.bindHistoryAppendEvents(!0)},n.bindHistoryAppendEvents=function(e){var i=e?"addEventListener":"removeEventListener";this.scroller[i]("scroll",this.scrollHistoryHandler),t[i]("unload",this.unloadHandler)},n.createHistoryPageLoad=function(){this.on("load",this.onPageLoadHistory)},e.destroy.history=n.destroyHistory=function(){var t=this.options.history&&this.options.append;t&&this.bindHistoryAppendEvents(!1)},n.onAppendHistory=function(t,e,i){if(i&&i.length){var n=i[0],r=this.getElementScrollY(n);o.href=e,this.scrollPages.push({top:r,path:o.href,title:t.title})}},n.getElementScrollY=function(t){return this.options.elementScroll?this.getElementElementScrollY(t):this.getElementWindowScrollY(t)},n.getElementWindowScrollY=function(e){var i=e.getBoundingClientRect();return i.top+t.pageYOffset},n.getElementElementScrollY=function(t){return t.offsetTop-this.top},n.onScrollHistory=function(){for(var t,e,i=this.getScrollViewY(),n=0;n<this.scrollPages.length;n++){var o=this.scrollPages[n];if(o.top>=i)break;t=n,e=o}t!=this.scrollPageIndex&&(this.scrollPageIndex=t,this.setHistory(e.title,e.path))},i.debounceMethod(e,"onScrollHistory",150),n.getScrollViewY=function(){return this.options.elementScroll?this.scroller.scrollTop+this.scroller.clientHeight/2:t.pageYOffset+this.windowHeight/2},n.setHistory=function(t,e){var i=this.options.history,n=i&&history[i+"State"];n&&(history[i+"State"](null,t,e),this.options.historyTitle&&(document.title=t),this.dispatchEvent("history",null,[t,e]))},n.onUnload=function(){var e=this.scrollPageIndex;if(0!==e){var i=this.scrollPages[e],n=t.pageYOffset-i.top+this.top;this.destroyHistory(),scrollTo(0,n)}},n.onPageLoadHistory=function(t,e){this.setHistory(t.title,e)},e}),function(t,e){"function"==typeof define&&define.amd?define("infinite-scroll/js/button",["./core","fizzy-ui-utils/utils"],function(i,n){return e(t,i,n)}):"object"==typeof module&&module.exports?module.exports=e(t,require("./core"),require("fizzy-ui-utils")):e(t,t.InfiniteScroll,t.fizzyUIUtils)}(window,function(t,e,i){function n(t,e){this.element=t,this.infScroll=e,this.clickHandler=this.onClick.bind(this),this.element.addEventListener("click",this.clickHandler),e.on("request",this.disable.bind(this)),e.on("load",this.enable.bind(this)),e.on("error",this.hide.bind(this)),e.on("last",this.hide.bind(this))}return e.create.button=function(){var t=i.getQueryElement(this.options.button);if(t)return void(this.button=new n(t,this))},e.destroy.button=function(){this.button&&this.button.destroy()},n.prototype.onClick=function(t){t.preventDefault(),this.infScroll.loadNextPage()},n.prototype.enable=function(){this.element.removeAttribute("disabled")},n.prototype.disable=function(){this.element.disabled="disabled"},n.prototype.hide=function(){this.element.style.display="none"},n.prototype.destroy=function(){this.element.removeEventListener("click",this.clickHandler)},e.Button=n,e}),function(t,e){"function"==typeof define&&define.amd?define("infinite-scroll/js/status",["./core","fizzy-ui-utils/utils"],function(i,n){return e(t,i,n)}):"object"==typeof module&&module.exports?module.exports=e(t,require("./core"),require("fizzy-ui-utils")):e(t,t.InfiniteScroll,t.fizzyUIUtils)}(window,function(t,e,i){function n(t){r(t,"none")}function o(t){r(t,"block")}function r(t,e){t&&(t.style.display=e)}var s=e.prototype;return e.create.status=function(){var t=i.getQueryElement(this.options.status);t&&(this.statusElement=t,this.statusEventElements={request:t.querySelector(".infinite-scroll-request"),error:t.querySelector(".infinite-scroll-error"),last:t.querySelector(".infinite-scroll-last")},this.on("request",this.showRequestStatus),this.on("error",this.showErrorStatus),this.on("last",this.showLastStatus),this.bindHideStatus("on"))},s.bindHideStatus=function(t){var e=this.options.append?"append":"load";this[t](e,this.hideAllStatus)},s.showRequestStatus=function(){this.showStatus("request")},s.showErrorStatus=function(){this.showStatus("error")},s.showLastStatus=function(){this.showStatus("last"),this.bindHideStatus("off")},s.showStatus=function(t){o(this.statusElement),this.hideStatusEventElements();var e=this.statusEventElements[t];o(e)},s.hideAllStatus=function(){n(this.statusElement),this.hideStatusEventElements()},s.hideStatusEventElements=function(){for(var t in this.statusEventElements){var e=this.statusEventElements[t];n(e)}},e}),function(t,e){"function"==typeof define&&define.amd?define(["infinite-scroll/js/core","infinite-scroll/js/page-load","infinite-scroll/js/scroll-watch","infinite-scroll/js/history","infinite-scroll/js/button","infinite-scroll/js/status"],e):"object"==typeof module&&module.exports&&(module.exports=e(require("./core"),require("./page-load"),require("./scroll-watch"),require("./history"),require("./button"),require("./status")))}(window,function(t){return t}),function(t,e){"use strict";"function"==typeof define&&define.amd?define("imagesloaded/imagesloaded",["ev-emitter/ev-emitter"],function(i){return e(t,i)}):"object"==typeof module&&module.exports?module.exports=e(t,require("ev-emitter")):t.imagesLoaded=e(t,t.EvEmitter)}("undefined"!=typeof window?window:this,function(t,e){function i(t,e){for(var i in e)t[i]=e[i];return t}function n(t){if(Array.isArray(t))return t;var e="object"==typeof t&&"number"==typeof t.length;return e?h.call(t):[t]}function o(t,e,r){if(!(this instanceof o))return new o(t,e,r);var s=t;return"string"==typeof t&&(s=document.querySelectorAll(t)),s?(this.elements=n(s),this.options=i({},this.options),"function"==typeof e?r=e:i(this.options,e),r&&this.on("always",r),this.getImages(),l&&(this.jqDeferred=new l.Deferred),void setTimeout(this.check.bind(this))):void a.error("Bad element for imagesLoaded "+(s||t))}function r(t){this.img=t}function s(t,e){this.url=t,this.element=e,this.img=new Image}var l=t.jQuery,a=t.console,h=Array.prototype.slice;o.prototype=Object.create(e.prototype),o.prototype.options={},o.prototype.getImages=function(){this.images=[],this.elements.forEach(this.addElementImages,this)},o.prototype.addElementImages=function(t){"IMG"==t.nodeName&&this.addImage(t),this.options.background===!0&&this.addElementBackgroundImages(t);var e=t.nodeType;if(e&&c[e]){for(var i=t.querySelectorAll("img"),n=0;n<i.length;n++){var o=i[n];this.addImage(o)}if("string"==typeof this.options.background){var r=t.querySelectorAll(this.options.background);for(n=0;n<r.length;n++){var s=r[n];this.addElementBackgroundImages(s)}}}};var c={1:!0,9:!0,11:!0};return o.prototype.addElementBackgroundImages=function(t){var e=getComputedStyle(t);if(e)for(var i=/url\((['"])?(.*?)\1\)/gi,n=i.exec(e.backgroundImage);null!==n;){var o=n&&n[2];o&&this.addBackground(o,t),n=i.exec(e.backgroundImage)}},o.prototype.addImage=function(t){var e=new r(t);this.images.push(e)},o.prototype.addBackground=function(t,e){var i=new s(t,e);this.images.push(i)},o.prototype.check=function(){function t(t,i,n){setTimeout(function(){e.progress(t,i,n)})}var e=this;return this.progressedCount=0,this.hasAnyBroken=!1,this.images.length?void this.images.forEach(function(e){e.once("progress",t),e.check()}):void this.complete()},o.prototype.progress=function(t,e,i){this.progressedCount++,this.hasAnyBroken=this.hasAnyBroken||!t.isLoaded,this.emitEvent("progress",[this,t,e]),this.jqDeferred&&this.jqDeferred.notify&&this.jqDeferred.notify(this,t),this.progressedCount==this.images.length&&this.complete(),this.options.debug&&a&&a.log("progress: "+i,t,e)},o.prototype.complete=function(){var t=this.hasAnyBroken?"fail":"done";if(this.isComplete=!0,this.emitEvent(t,[this]),this.emitEvent("always",[this]),this.jqDeferred){var e=this.hasAnyBroken?"reject":"resolve";this.jqDeferred[e](this)}},r.prototype=Object.create(e.prototype),r.prototype.check=function(){var t=this.getIsImageComplete();return t?void this.confirm(0!==this.img.naturalWidth,"naturalWidth"):(this.proxyImage=new Image,this.proxyImage.addEventListener("load",this),this.proxyImage.addEventListener("error",this),this.img.addEventListener("load",this),this.img.addEventListener("error",this),void(this.proxyImage.src=this.img.src))},r.prototype.getIsImageComplete=function(){return this.img.complete&&this.img.naturalWidth},r.prototype.confirm=function(t,e){this.isLoaded=t,this.emitEvent("progress",[this,this.img,e])},r.prototype.handleEvent=function(t){var e="on"+t.type;this[e]&&this[e](t)},r.prototype.onload=function(){this.confirm(!0,"onload"),this.unbindEvents()},r.prototype.onerror=function(){this.confirm(!1,"onerror"),this.unbindEvents()},r.prototype.unbindEvents=function(){this.proxyImage.removeEventListener("load",this),this.proxyImage.removeEventListener("error",this),this.img.removeEventListener("load",this),this.img.removeEventListener("error",this)},s.prototype=Object.create(r.prototype),s.prototype.check=function(){this.img.addEventListener("load",this),this.img.addEventListener("error",this),this.img.src=this.url;var t=this.getIsImageComplete();t&&(this.confirm(0!==this.img.naturalWidth,"naturalWidth"),this.unbindEvents())},s.prototype.unbindEvents=function(){this.img.removeEventListener("load",this),this.img.removeEventListener("error",this)},s.prototype.confirm=function(t,e){this.isLoaded=t,this.emitEvent("progress",[this,this.element,e])},o.makeJQueryPlugin=function(e){e=e||t.jQuery,e&&(l=e,l.fn.imagesLoaded=function(t,e){var i=new o(this,t,e);return i.jqDeferred.promise(l(this))})},o.makeJQueryPlugin(),o});

/*!
 * Isotope PACKAGED v3.0.6
 *
 * Licensed GPLv3 for open source use
 * or Isotope Commercial License for commercial use
 *
 * https://isotope.metafizzy.co
 * Copyright 2010-2018 Metafizzy
 */

!function(t,e){"function"==typeof define&&define.amd?define("jquery-bridget/jquery-bridget",["jquery"],function(i){return e(t,i)}):"object"==typeof module&&module.exports?module.exports=e(t,require("jquery")):t.jQueryBridget=e(t,t.jQuery)}(window,function(t,e){"use strict";function i(i,s,a){function u(t,e,o){var n,s="$()."+i+'("'+e+'")';return t.each(function(t,u){var h=a.data(u,i);if(!h)return void r(i+" not initialized. Cannot call methods, i.e. "+s);var d=h[e];if(!d||"_"==e.charAt(0))return void r(s+" is not a valid method");var l=d.apply(h,o);n=void 0===n?l:n}),void 0!==n?n:t}function h(t,e){t.each(function(t,o){var n=a.data(o,i);n?(n.option(e),n._init()):(n=new s(o,e),a.data(o,i,n))})}a=a||e||t.jQuery,a&&(s.prototype.option||(s.prototype.option=function(t){a.isPlainObject(t)&&(this.options=a.extend(!0,this.options,t))}),a.fn[i]=function(t){if("string"==typeof t){var e=n.call(arguments,1);return u(this,t,e)}return h(this,t),this},o(a))}function o(t){!t||t&&t.bridget||(t.bridget=i)}var n=Array.prototype.slice,s=t.console,r="undefined"==typeof s?function(){}:function(t){s.error(t)};return o(e||t.jQuery),i}),function(t,e){"function"==typeof define&&define.amd?define("ev-emitter/ev-emitter",e):"object"==typeof module&&module.exports?module.exports=e():t.EvEmitter=e()}("undefined"!=typeof window?window:this,function(){function t(){}var e=t.prototype;return e.on=function(t,e){if(t&&e){var i=this._events=this._events||{},o=i[t]=i[t]||[];return o.indexOf(e)==-1&&o.push(e),this}},e.once=function(t,e){if(t&&e){this.on(t,e);var i=this._onceEvents=this._onceEvents||{},o=i[t]=i[t]||{};return o[e]=!0,this}},e.off=function(t,e){var i=this._events&&this._events[t];if(i&&i.length){var o=i.indexOf(e);return o!=-1&&i.splice(o,1),this}},e.emitEvent=function(t,e){var i=this._events&&this._events[t];if(i&&i.length){i=i.slice(0),e=e||[];for(var o=this._onceEvents&&this._onceEvents[t],n=0;n<i.length;n++){var s=i[n],r=o&&o[s];r&&(this.off(t,s),delete o[s]),s.apply(this,e)}return this}},e.allOff=function(){delete this._events,delete this._onceEvents},t}),function(t,e){"function"==typeof define&&define.amd?define("get-size/get-size",e):"object"==typeof module&&module.exports?module.exports=e():t.getSize=e()}(window,function(){"use strict";function t(t){var e=parseFloat(t),i=t.indexOf("%")==-1&&!isNaN(e);return i&&e}function e(){}function i(){for(var t={width:0,height:0,innerWidth:0,innerHeight:0,outerWidth:0,outerHeight:0},e=0;e<h;e++){var i=u[e];t[i]=0}return t}function o(t){var e=getComputedStyle(t);return e||a("Style returned "+e+". Are you running this code in a hidden iframe on Firefox? See https://bit.ly/getsizebug1"),e}function n(){if(!d){d=!0;var e=document.createElement("div");e.style.width="200px",e.style.padding="1px 2px 3px 4px",e.style.borderStyle="solid",e.style.borderWidth="1px 2px 3px 4px",e.style.boxSizing="border-box";var i=document.body||document.documentElement;i.appendChild(e);var n=o(e);r=200==Math.round(t(n.width)),s.isBoxSizeOuter=r,i.removeChild(e)}}function s(e){if(n(),"string"==typeof e&&(e=document.querySelector(e)),e&&"object"==typeof e&&e.nodeType){var s=o(e);if("none"==s.display)return i();var a={};a.width=e.offsetWidth,a.height=e.offsetHeight;for(var d=a.isBorderBox="border-box"==s.boxSizing,l=0;l<h;l++){var f=u[l],c=s[f],m=parseFloat(c);a[f]=isNaN(m)?0:m}var p=a.paddingLeft+a.paddingRight,y=a.paddingTop+a.paddingBottom,g=a.marginLeft+a.marginRight,v=a.marginTop+a.marginBottom,_=a.borderLeftWidth+a.borderRightWidth,z=a.borderTopWidth+a.borderBottomWidth,I=d&&r,x=t(s.width);x!==!1&&(a.width=x+(I?0:p+_));var S=t(s.height);return S!==!1&&(a.height=S+(I?0:y+z)),a.innerWidth=a.width-(p+_),a.innerHeight=a.height-(y+z),a.outerWidth=a.width+g,a.outerHeight=a.height+v,a}}var r,a="undefined"==typeof console?e:function(t){console.error(t)},u=["paddingLeft","paddingRight","paddingTop","paddingBottom","marginLeft","marginRight","marginTop","marginBottom","borderLeftWidth","borderRightWidth","borderTopWidth","borderBottomWidth"],h=u.length,d=!1;return s}),function(t,e){"use strict";"function"==typeof define&&define.amd?define("desandro-matches-selector/matches-selector",e):"object"==typeof module&&module.exports?module.exports=e():t.matchesSelector=e()}(window,function(){"use strict";var t=function(){var t=window.Element.prototype;if(t.matches)return"matches";if(t.matchesSelector)return"matchesSelector";for(var e=["webkit","moz","ms","o"],i=0;i<e.length;i++){var o=e[i],n=o+"MatchesSelector";if(t[n])return n}}();return function(e,i){return e[t](i)}}),function(t,e){"function"==typeof define&&define.amd?define("fizzy-ui-utils/utils",["desandro-matches-selector/matches-selector"],function(i){return e(t,i)}):"object"==typeof module&&module.exports?module.exports=e(t,require("desandro-matches-selector")):t.fizzyUIUtils=e(t,t.matchesSelector)}(window,function(t,e){var i={};i.extend=function(t,e){for(var i in e)t[i]=e[i];return t},i.modulo=function(t,e){return(t%e+e)%e};var o=Array.prototype.slice;i.makeArray=function(t){if(Array.isArray(t))return t;if(null===t||void 0===t)return[];var e="object"==typeof t&&"number"==typeof t.length;return e?o.call(t):[t]},i.removeFrom=function(t,e){var i=t.indexOf(e);i!=-1&&t.splice(i,1)},i.getParent=function(t,i){for(;t.parentNode&&t!=document.body;)if(t=t.parentNode,e(t,i))return t},i.getQueryElement=function(t){return"string"==typeof t?document.querySelector(t):t},i.handleEvent=function(t){var e="on"+t.type;this[e]&&this[e](t)},i.filterFindElements=function(t,o){t=i.makeArray(t);var n=[];return t.forEach(function(t){if(t instanceof HTMLElement){if(!o)return void n.push(t);e(t,o)&&n.push(t);for(var i=t.querySelectorAll(o),s=0;s<i.length;s++)n.push(i[s])}}),n},i.debounceMethod=function(t,e,i){i=i||100;var o=t.prototype[e],n=e+"Timeout";t.prototype[e]=function(){var t=this[n];clearTimeout(t);var e=arguments,s=this;this[n]=setTimeout(function(){o.apply(s,e),delete s[n]},i)}},i.docReady=function(t){var e=document.readyState;"complete"==e||"interactive"==e?setTimeout(t):document.addEventListener("DOMContentLoaded",t)},i.toDashed=function(t){return t.replace(/(.)([A-Z])/g,function(t,e,i){return e+"-"+i}).toLowerCase()};var n=t.console;return i.htmlInit=function(e,o){i.docReady(function(){var s=i.toDashed(o),r="data-"+s,a=document.querySelectorAll("["+r+"]"),u=document.querySelectorAll(".js-"+s),h=i.makeArray(a).concat(i.makeArray(u)),d=r+"-options",l=t.jQuery;h.forEach(function(t){var i,s=t.getAttribute(r)||t.getAttribute(d);try{i=s&&JSON.parse(s)}catch(a){return void(n&&n.error("Error parsing "+r+" on "+t.className+": "+a))}var u=new e(t,i);l&&l.data(t,o,u)})})},i}),function(t,e){"function"==typeof define&&define.amd?define("outlayer/item",["ev-emitter/ev-emitter","get-size/get-size"],e):"object"==typeof module&&module.exports?module.exports=e(require("ev-emitter"),require("get-size")):(t.Outlayer={},t.Outlayer.Item=e(t.EvEmitter,t.getSize))}(window,function(t,e){"use strict";function i(t){for(var e in t)return!1;return e=null,!0}function o(t,e){t&&(this.element=t,this.layout=e,this.position={x:0,y:0},this._create())}function n(t){return t.replace(/([A-Z])/g,function(t){return"-"+t.toLowerCase()})}var s=document.documentElement.style,r="string"==typeof s.transition?"transition":"WebkitTransition",a="string"==typeof s.transform?"transform":"WebkitTransform",u={WebkitTransition:"webkitTransitionEnd",transition:"transitionend"}[r],h={transform:a,transition:r,transitionDuration:r+"Duration",transitionProperty:r+"Property",transitionDelay:r+"Delay"},d=o.prototype=Object.create(t.prototype);d.constructor=o,d._create=function(){this._transn={ingProperties:{},clean:{},onEnd:{}},this.css({position:"absolute"})},d.handleEvent=function(t){var e="on"+t.type;this[e]&&this[e](t)},d.getSize=function(){this.size=e(this.element)},d.css=function(t){var e=this.element.style;for(var i in t){var o=h[i]||i;e[o]=t[i]}},d.getPosition=function(){var t=getComputedStyle(this.element),e=this.layout._getOption("originLeft"),i=this.layout._getOption("originTop"),o=t[e?"left":"right"],n=t[i?"top":"bottom"],s=parseFloat(o),r=parseFloat(n),a=this.layout.size;o.indexOf("%")!=-1&&(s=s/100*a.width),n.indexOf("%")!=-1&&(r=r/100*a.height),s=isNaN(s)?0:s,r=isNaN(r)?0:r,s-=e?a.paddingLeft:a.paddingRight,r-=i?a.paddingTop:a.paddingBottom,this.position.x=s,this.position.y=r},d.layoutPosition=function(){var t=this.layout.size,e={},i=this.layout._getOption("originLeft"),o=this.layout._getOption("originTop"),n=i?"paddingLeft":"paddingRight",s=i?"left":"right",r=i?"right":"left",a=this.position.x+t[n];e[s]=this.getXValue(a),e[r]="";var u=o?"paddingTop":"paddingBottom",h=o?"top":"bottom",d=o?"bottom":"top",l=this.position.y+t[u];e[h]=this.getYValue(l),e[d]="",this.css(e),this.emitEvent("layout",[this])},d.getXValue=function(t){var e=this.layout._getOption("horizontal");return this.layout.options.percentPosition&&!e?t/this.layout.size.width*100+"%":t+"px"},d.getYValue=function(t){var e=this.layout._getOption("horizontal");return this.layout.options.percentPosition&&e?t/this.layout.size.height*100+"%":t+"px"},d._transitionTo=function(t,e){this.getPosition();var i=this.position.x,o=this.position.y,n=t==this.position.x&&e==this.position.y;if(this.setPosition(t,e),n&&!this.isTransitioning)return void this.layoutPosition();var s=t-i,r=e-o,a={};a.transform=this.getTranslate(s,r),this.transition({to:a,onTransitionEnd:{transform:this.layoutPosition},isCleaning:!0})},d.getTranslate=function(t,e){var i=this.layout._getOption("originLeft"),o=this.layout._getOption("originTop");return t=i?t:-t,e=o?e:-e,"translate3d("+t+"px, "+e+"px, 0)"},d.goTo=function(t,e){this.setPosition(t,e),this.layoutPosition()},d.moveTo=d._transitionTo,d.setPosition=function(t,e){this.position.x=parseFloat(t),this.position.y=parseFloat(e)},d._nonTransition=function(t){this.css(t.to),t.isCleaning&&this._removeStyles(t.to);for(var e in t.onTransitionEnd)t.onTransitionEnd[e].call(this)},d.transition=function(t){if(!parseFloat(this.layout.options.transitionDuration))return void this._nonTransition(t);var e=this._transn;for(var i in t.onTransitionEnd)e.onEnd[i]=t.onTransitionEnd[i];for(i in t.to)e.ingProperties[i]=!0,t.isCleaning&&(e.clean[i]=!0);if(t.from){this.css(t.from);var o=this.element.offsetHeight;o=null}this.enableTransition(t.to),this.css(t.to),this.isTransitioning=!0};var l="opacity,"+n(a);d.enableTransition=function(){if(!this.isTransitioning){var t=this.layout.options.transitionDuration;t="number"==typeof t?t+"ms":t,this.css({transitionProperty:l,transitionDuration:t,transitionDelay:this.staggerDelay||0}),this.element.addEventListener(u,this,!1)}},d.onwebkitTransitionEnd=function(t){this.ontransitionend(t)},d.onotransitionend=function(t){this.ontransitionend(t)};var f={"-webkit-transform":"transform"};d.ontransitionend=function(t){if(t.target===this.element){var e=this._transn,o=f[t.propertyName]||t.propertyName;if(delete e.ingProperties[o],i(e.ingProperties)&&this.disableTransition(),o in e.clean&&(this.element.style[t.propertyName]="",delete e.clean[o]),o in e.onEnd){var n=e.onEnd[o];n.call(this),delete e.onEnd[o]}this.emitEvent("transitionEnd",[this])}},d.disableTransition=function(){this.removeTransitionStyles(),this.element.removeEventListener(u,this,!1),this.isTransitioning=!1},d._removeStyles=function(t){var e={};for(var i in t)e[i]="";this.css(e)};var c={transitionProperty:"",transitionDuration:"",transitionDelay:""};return d.removeTransitionStyles=function(){this.css(c)},d.stagger=function(t){t=isNaN(t)?0:t,this.staggerDelay=t+"ms"},d.removeElem=function(){this.element.parentNode.removeChild(this.element),this.css({display:""}),this.emitEvent("remove",[this])},d.remove=function(){return r&&parseFloat(this.layout.options.transitionDuration)?(this.once("transitionEnd",function(){this.removeElem()}),void this.hide()):void this.removeElem()},d.reveal=function(){delete this.isHidden,this.css({display:""});var t=this.layout.options,e={},i=this.getHideRevealTransitionEndProperty("visibleStyle");e[i]=this.onRevealTransitionEnd,this.transition({from:t.hiddenStyle,to:t.visibleStyle,isCleaning:!0,onTransitionEnd:e})},d.onRevealTransitionEnd=function(){this.isHidden||this.emitEvent("reveal")},d.getHideRevealTransitionEndProperty=function(t){var e=this.layout.options[t];if(e.opacity)return"opacity";for(var i in e)return i},d.hide=function(){this.isHidden=!0,this.css({display:""});var t=this.layout.options,e={},i=this.getHideRevealTransitionEndProperty("hiddenStyle");e[i]=this.onHideTransitionEnd,this.transition({from:t.visibleStyle,to:t.hiddenStyle,isCleaning:!0,onTransitionEnd:e})},d.onHideTransitionEnd=function(){this.isHidden&&(this.css({display:"none"}),this.emitEvent("hide"))},d.destroy=function(){this.css({position:"",left:"",right:"",top:"",bottom:"",transition:"",transform:""})},o}),function(t,e){"use strict";"function"==typeof define&&define.amd?define("outlayer/outlayer",["ev-emitter/ev-emitter","get-size/get-size","fizzy-ui-utils/utils","./item"],function(i,o,n,s){return e(t,i,o,n,s)}):"object"==typeof module&&module.exports?module.exports=e(t,require("ev-emitter"),require("get-size"),require("fizzy-ui-utils"),require("./item")):t.Outlayer=e(t,t.EvEmitter,t.getSize,t.fizzyUIUtils,t.Outlayer.Item)}(window,function(t,e,i,o,n){"use strict";function s(t,e){var i=o.getQueryElement(t);if(!i)return void(u&&u.error("Bad element for "+this.constructor.namespace+": "+(i||t)));this.element=i,h&&(this.$element=h(this.element)),this.options=o.extend({},this.constructor.defaults),this.option(e);var n=++l;this.element.outlayerGUID=n,f[n]=this,this._create();var s=this._getOption("initLayout");s&&this.layout()}function r(t){function e(){t.apply(this,arguments)}return e.prototype=Object.create(t.prototype),e.prototype.constructor=e,e}function a(t){if("number"==typeof t)return t;var e=t.match(/(^\d*\.?\d*)(\w*)/),i=e&&e[1],o=e&&e[2];if(!i.length)return 0;i=parseFloat(i);var n=m[o]||1;return i*n}var u=t.console,h=t.jQuery,d=function(){},l=0,f={};s.namespace="outlayer",s.Item=n,s.defaults={containerStyle:{position:"relative"},initLayout:!0,originLeft:!0,originTop:!0,resize:!0,resizeContainer:!0,transitionDuration:"0.4s",hiddenStyle:{opacity:0,transform:"scale(0.001)"},visibleStyle:{opacity:1,transform:"scale(1)"}};var c=s.prototype;o.extend(c,e.prototype),c.option=function(t){o.extend(this.options,t)},c._getOption=function(t){var e=this.constructor.compatOptions[t];return e&&void 0!==this.options[e]?this.options[e]:this.options[t]},s.compatOptions={initLayout:"isInitLayout",horizontal:"isHorizontal",layoutInstant:"isLayoutInstant",originLeft:"isOriginLeft",originTop:"isOriginTop",resize:"isResizeBound",resizeContainer:"isResizingContainer"},c._create=function(){this.reloadItems(),this.stamps=[],this.stamp(this.options.stamp),o.extend(this.element.style,this.options.containerStyle);var t=this._getOption("resize");t&&this.bindResize()},c.reloadItems=function(){this.items=this._itemize(this.element.children)},c._itemize=function(t){for(var e=this._filterFindItemElements(t),i=this.constructor.Item,o=[],n=0;n<e.length;n++){var s=e[n],r=new i(s,this);o.push(r)}return o},c._filterFindItemElements=function(t){return o.filterFindElements(t,this.options.itemSelector)},c.getItemElements=function(){return this.items.map(function(t){return t.element})},c.layout=function(){this._resetLayout(),this._manageStamps();var t=this._getOption("layoutInstant"),e=void 0!==t?t:!this._isLayoutInited;this.layoutItems(this.items,e),this._isLayoutInited=!0},c._init=c.layout,c._resetLayout=function(){this.getSize()},c.getSize=function(){this.size=i(this.element)},c._getMeasurement=function(t,e){var o,n=this.options[t];n?("string"==typeof n?o=this.element.querySelector(n):n instanceof HTMLElement&&(o=n),this[t]=o?i(o)[e]:n):this[t]=0},c.layoutItems=function(t,e){t=this._getItemsForLayout(t),this._layoutItems(t,e),this._postLayout()},c._getItemsForLayout=function(t){return t.filter(function(t){return!t.isIgnored})},c._layoutItems=function(t,e){if(this._emitCompleteOnItems("layout",t),t&&t.length){var i=[];t.forEach(function(t){var o=this._getItemLayoutPosition(t);o.item=t,o.isInstant=e||t.isLayoutInstant,i.push(o)},this),this._processLayoutQueue(i)}},c._getItemLayoutPosition=function(){return{x:0,y:0}},c._processLayoutQueue=function(t){this.updateStagger(),t.forEach(function(t,e){this._positionItem(t.item,t.x,t.y,t.isInstant,e)},this)},c.updateStagger=function(){var t=this.options.stagger;return null===t||void 0===t?void(this.stagger=0):(this.stagger=a(t),this.stagger)},c._positionItem=function(t,e,i,o,n){o?t.goTo(e,i):(t.stagger(n*this.stagger),t.moveTo(e,i))},c._postLayout=function(){this.resizeContainer()},c.resizeContainer=function(){var t=this._getOption("resizeContainer");if(t){var e=this._getContainerSize();e&&(this._setContainerMeasure(e.width,!0),this._setContainerMeasure(e.height,!1))}},c._getContainerSize=d,c._setContainerMeasure=function(t,e){if(void 0!==t){var i=this.size;i.isBorderBox&&(t+=e?i.paddingLeft+i.paddingRight+i.borderLeftWidth+i.borderRightWidth:i.paddingBottom+i.paddingTop+i.borderTopWidth+i.borderBottomWidth),t=Math.max(t,0),this.element.style[e?"width":"height"]=t+"px"}},c._emitCompleteOnItems=function(t,e){function i(){n.dispatchEvent(t+"Complete",null,[e])}function o(){r++,r==s&&i()}var n=this,s=e.length;if(!e||!s)return void i();var r=0;e.forEach(function(e){e.once(t,o)})},c.dispatchEvent=function(t,e,i){var o=e?[e].concat(i):i;if(this.emitEvent(t,o),h)if(this.$element=this.$element||h(this.element),e){var n=h.Event(e);n.type=t,this.$element.trigger(n,i)}else this.$element.trigger(t,i)},c.ignore=function(t){var e=this.getItem(t);e&&(e.isIgnored=!0)},c.unignore=function(t){var e=this.getItem(t);e&&delete e.isIgnored},c.stamp=function(t){t=this._find(t),t&&(this.stamps=this.stamps.concat(t),t.forEach(this.ignore,this))},c.unstamp=function(t){t=this._find(t),t&&t.forEach(function(t){o.removeFrom(this.stamps,t),this.unignore(t)},this)},c._find=function(t){if(t)return"string"==typeof t&&(t=this.element.querySelectorAll(t)),t=o.makeArray(t)},c._manageStamps=function(){this.stamps&&this.stamps.length&&(this._getBoundingRect(),this.stamps.forEach(this._manageStamp,this))},c._getBoundingRect=function(){var t=this.element.getBoundingClientRect(),e=this.size;this._boundingRect={left:t.left+e.paddingLeft+e.borderLeftWidth,top:t.top+e.paddingTop+e.borderTopWidth,right:t.right-(e.paddingRight+e.borderRightWidth),bottom:t.bottom-(e.paddingBottom+e.borderBottomWidth)}},c._manageStamp=d,c._getElementOffset=function(t){var e=t.getBoundingClientRect(),o=this._boundingRect,n=i(t),s={left:e.left-o.left-n.marginLeft,top:e.top-o.top-n.marginTop,right:o.right-e.right-n.marginRight,bottom:o.bottom-e.bottom-n.marginBottom};return s},c.handleEvent=o.handleEvent,c.bindResize=function(){t.addEventListener("resize",this),this.isResizeBound=!0},c.unbindResize=function(){t.removeEventListener("resize",this),this.isResizeBound=!1},c.onresize=function(){this.resize()},o.debounceMethod(s,"onresize",100),c.resize=function(){this.isResizeBound&&this.needsResizeLayout()&&this.layout()},c.needsResizeLayout=function(){var t=i(this.element),e=this.size&&t;return e&&t.innerWidth!==this.size.innerWidth},c.addItems=function(t){var e=this._itemize(t);return e.length&&(this.items=this.items.concat(e)),e},c.appended=function(t){var e=this.addItems(t);e.length&&(this.layoutItems(e,!0),this.reveal(e))},c.prepended=function(t){var e=this._itemize(t);if(e.length){var i=this.items.slice(0);this.items=e.concat(i),this._resetLayout(),this._manageStamps(),this.layoutItems(e,!0),this.reveal(e),this.layoutItems(i)}},c.reveal=function(t){if(this._emitCompleteOnItems("reveal",t),t&&t.length){var e=this.updateStagger();t.forEach(function(t,i){t.stagger(i*e),t.reveal()})}},c.hide=function(t){if(this._emitCompleteOnItems("hide",t),t&&t.length){var e=this.updateStagger();t.forEach(function(t,i){t.stagger(i*e),t.hide()})}},c.revealItemElements=function(t){var e=this.getItems(t);this.reveal(e)},c.hideItemElements=function(t){var e=this.getItems(t);this.hide(e)},c.getItem=function(t){for(var e=0;e<this.items.length;e++){var i=this.items[e];if(i.element==t)return i}},c.getItems=function(t){t=o.makeArray(t);var e=[];return t.forEach(function(t){var i=this.getItem(t);i&&e.push(i)},this),e},c.remove=function(t){var e=this.getItems(t);this._emitCompleteOnItems("remove",e),e&&e.length&&e.forEach(function(t){t.remove(),o.removeFrom(this.items,t)},this)},c.destroy=function(){var t=this.element.style;t.height="",t.position="",t.width="",this.items.forEach(function(t){t.destroy()}),this.unbindResize();var e=this.element.outlayerGUID;delete f[e],delete this.element.outlayerGUID,h&&h.removeData(this.element,this.constructor.namespace)},s.data=function(t){t=o.getQueryElement(t);var e=t&&t.outlayerGUID;return e&&f[e]},s.create=function(t,e){var i=r(s);return i.defaults=o.extend({},s.defaults),o.extend(i.defaults,e),i.compatOptions=o.extend({},s.compatOptions),i.namespace=t,i.data=s.data,i.Item=r(n),o.htmlInit(i,t),h&&h.bridget&&h.bridget(t,i),i};var m={ms:1,s:1e3};return s.Item=n,s}),function(t,e){"function"==typeof define&&define.amd?define("isotope-layout/js/item",["outlayer/outlayer"],e):"object"==typeof module&&module.exports?module.exports=e(require("outlayer")):(t.Isotope=t.Isotope||{},t.Isotope.Item=e(t.Outlayer))}(window,function(t){"use strict";function e(){t.Item.apply(this,arguments)}var i=e.prototype=Object.create(t.Item.prototype),o=i._create;i._create=function(){this.id=this.layout.itemGUID++,o.call(this),this.sortData={}},i.updateSortData=function(){if(!this.isIgnored){this.sortData.id=this.id,this.sortData["original-order"]=this.id,this.sortData.random=Math.random();var t=this.layout.options.getSortData,e=this.layout._sorters;for(var i in t){var o=e[i];this.sortData[i]=o(this.element,this)}}};var n=i.destroy;return i.destroy=function(){n.apply(this,arguments),this.css({display:""})},e}),function(t,e){"function"==typeof define&&define.amd?define("isotope-layout/js/layout-mode",["get-size/get-size","outlayer/outlayer"],e):"object"==typeof module&&module.exports?module.exports=e(require("get-size"),require("outlayer")):(t.Isotope=t.Isotope||{},t.Isotope.LayoutMode=e(t.getSize,t.Outlayer))}(window,function(t,e){"use strict";function i(t){this.isotope=t,t&&(this.options=t.options[this.namespace],this.element=t.element,this.items=t.filteredItems,this.size=t.size)}var o=i.prototype,n=["_resetLayout","_getItemLayoutPosition","_manageStamp","_getContainerSize","_getElementOffset","needsResizeLayout","_getOption"];return n.forEach(function(t){o[t]=function(){return e.prototype[t].apply(this.isotope,arguments)}}),o.needsVerticalResizeLayout=function(){var e=t(this.isotope.element),i=this.isotope.size&&e;return i&&e.innerHeight!=this.isotope.size.innerHeight},o._getMeasurement=function(){this.isotope._getMeasurement.apply(this,arguments)},o.getColumnWidth=function(){this.getSegmentSize("column","Width")},o.getRowHeight=function(){this.getSegmentSize("row","Height")},o.getSegmentSize=function(t,e){var i=t+e,o="outer"+e;if(this._getMeasurement(i,o),!this[i]){var n=this.getFirstItemSize();this[i]=n&&n[o]||this.isotope.size["inner"+e]}},o.getFirstItemSize=function(){var e=this.isotope.filteredItems[0];return e&&e.element&&t(e.element)},o.layout=function(){this.isotope.layout.apply(this.isotope,arguments)},o.getSize=function(){this.isotope.getSize(),this.size=this.isotope.size},i.modes={},i.create=function(t,e){function n(){i.apply(this,arguments)}return n.prototype=Object.create(o),n.prototype.constructor=n,e&&(n.options=e),n.prototype.namespace=t,i.modes[t]=n,n},i}),function(t,e){"function"==typeof define&&define.amd?define("masonry-layout/masonry",["outlayer/outlayer","get-size/get-size"],e):"object"==typeof module&&module.exports?module.exports=e(require("outlayer"),require("get-size")):t.Masonry=e(t.Outlayer,t.getSize)}(window,function(t,e){var i=t.create("masonry");i.compatOptions.fitWidth="isFitWidth";var o=i.prototype;return o._resetLayout=function(){this.getSize(),this._getMeasurement("columnWidth","outerWidth"),this._getMeasurement("gutter","outerWidth"),this.measureColumns(),this.colYs=[];for(var t=0;t<this.cols;t++)this.colYs.push(0);this.maxY=0,this.horizontalColIndex=0},o.measureColumns=function(){if(this.getContainerWidth(),!this.columnWidth){var t=this.items[0],i=t&&t.element;this.columnWidth=i&&e(i).outerWidth||this.containerWidth}var o=this.columnWidth+=this.gutter,n=this.containerWidth+this.gutter,s=n/o,r=o-n%o,a=r&&r<1?"round":"floor";s=Math[a](s),this.cols=Math.max(s,1)},o.getContainerWidth=function(){var t=this._getOption("fitWidth"),i=t?this.element.parentNode:this.element,o=e(i);this.containerWidth=o&&o.innerWidth},o._getItemLayoutPosition=function(t){t.getSize();var e=t.size.outerWidth%this.columnWidth,i=e&&e<1?"round":"ceil",o=Math[i](t.size.outerWidth/this.columnWidth);o=Math.min(o,this.cols);for(var n=this.options.horizontalOrder?"_getHorizontalColPosition":"_getTopColPosition",s=this[n](o,t),r={x:this.columnWidth*s.col,y:s.y},a=s.y+t.size.outerHeight,u=o+s.col,h=s.col;h<u;h++)this.colYs[h]=a;return r},o._getTopColPosition=function(t){var e=this._getTopColGroup(t),i=Math.min.apply(Math,e);return{col:e.indexOf(i),y:i}},o._getTopColGroup=function(t){if(t<2)return this.colYs;for(var e=[],i=this.cols+1-t,o=0;o<i;o++)e[o]=this._getColGroupY(o,t);return e},o._getColGroupY=function(t,e){if(e<2)return this.colYs[t];var i=this.colYs.slice(t,t+e);return Math.max.apply(Math,i)},o._getHorizontalColPosition=function(t,e){var i=this.horizontalColIndex%this.cols,o=t>1&&i+t>this.cols;i=o?0:i;var n=e.size.outerWidth&&e.size.outerHeight;return this.horizontalColIndex=n?i+t:this.horizontalColIndex,{col:i,y:this._getColGroupY(i,t)}},o._manageStamp=function(t){var i=e(t),o=this._getElementOffset(t),n=this._getOption("originLeft"),s=n?o.left:o.right,r=s+i.outerWidth,a=Math.floor(s/this.columnWidth);a=Math.max(0,a);var u=Math.floor(r/this.columnWidth);u-=r%this.columnWidth?0:1,u=Math.min(this.cols-1,u);for(var h=this._getOption("originTop"),d=(h?o.top:o.bottom)+i.outerHeight,l=a;l<=u;l++)this.colYs[l]=Math.max(d,this.colYs[l])},o._getContainerSize=function(){this.maxY=Math.max.apply(Math,this.colYs);var t={height:this.maxY};return this._getOption("fitWidth")&&(t.width=this._getContainerFitWidth()),t},o._getContainerFitWidth=function(){for(var t=0,e=this.cols;--e&&0===this.colYs[e];)t++;return(this.cols-t)*this.columnWidth-this.gutter},o.needsResizeLayout=function(){var t=this.containerWidth;return this.getContainerWidth(),t!=this.containerWidth},i}),function(t,e){"function"==typeof define&&define.amd?define("isotope-layout/js/layout-modes/masonry",["../layout-mode","masonry-layout/masonry"],e):"object"==typeof module&&module.exports?module.exports=e(require("../layout-mode"),require("masonry-layout")):e(t.Isotope.LayoutMode,t.Masonry)}(window,function(t,e){"use strict";var i=t.create("masonry"),o=i.prototype,n={_getElementOffset:!0,layout:!0,_getMeasurement:!0};for(var s in e.prototype)n[s]||(o[s]=e.prototype[s]);var r=o.measureColumns;o.measureColumns=function(){this.items=this.isotope.filteredItems,r.call(this)};var a=o._getOption;return o._getOption=function(t){return"fitWidth"==t?void 0!==this.options.isFitWidth?this.options.isFitWidth:this.options.fitWidth:a.apply(this.isotope,arguments)},i}),function(t,e){"function"==typeof define&&define.amd?define("isotope-layout/js/layout-modes/fit-rows",["../layout-mode"],e):"object"==typeof exports?module.exports=e(require("../layout-mode")):e(t.Isotope.LayoutMode)}(window,function(t){"use strict";var e=t.create("fitRows"),i=e.prototype;return i._resetLayout=function(){this.x=0,this.y=0,this.maxY=0,this._getMeasurement("gutter","outerWidth")},i._getItemLayoutPosition=function(t){t.getSize();var e=t.size.outerWidth+this.gutter,i=this.isotope.size.innerWidth+this.gutter;0!==this.x&&e+this.x>i&&(this.x=0,this.y=this.maxY);var o={x:this.x,y:this.y};return this.maxY=Math.max(this.maxY,this.y+t.size.outerHeight),this.x+=e,o},i._getContainerSize=function(){return{height:this.maxY}},e}),function(t,e){"function"==typeof define&&define.amd?define("isotope-layout/js/layout-modes/vertical",["../layout-mode"],e):"object"==typeof module&&module.exports?module.exports=e(require("../layout-mode")):e(t.Isotope.LayoutMode)}(window,function(t){"use strict";var e=t.create("vertical",{horizontalAlignment:0}),i=e.prototype;return i._resetLayout=function(){this.y=0},i._getItemLayoutPosition=function(t){t.getSize();var e=(this.isotope.size.innerWidth-t.size.outerWidth)*this.options.horizontalAlignment,i=this.y;return this.y+=t.size.outerHeight,{x:e,y:i}},i._getContainerSize=function(){return{height:this.y}},e}),function(t,e){"function"==typeof define&&define.amd?define(["outlayer/outlayer","get-size/get-size","desandro-matches-selector/matches-selector","fizzy-ui-utils/utils","isotope-layout/js/item","isotope-layout/js/layout-mode","isotope-layout/js/layout-modes/masonry","isotope-layout/js/layout-modes/fit-rows","isotope-layout/js/layout-modes/vertical"],function(i,o,n,s,r,a){return e(t,i,o,n,s,r,a)}):"object"==typeof module&&module.exports?module.exports=e(t,require("outlayer"),require("get-size"),require("desandro-matches-selector"),require("fizzy-ui-utils"),require("isotope-layout/js/item"),require("isotope-layout/js/layout-mode"),require("isotope-layout/js/layout-modes/masonry"),require("isotope-layout/js/layout-modes/fit-rows"),require("isotope-layout/js/layout-modes/vertical")):t.Isotope=e(t,t.Outlayer,t.getSize,t.matchesSelector,t.fizzyUIUtils,t.Isotope.Item,t.Isotope.LayoutMode)}(window,function(t,e,i,o,n,s,r){function a(t,e){return function(i,o){for(var n=0;n<t.length;n++){var s=t[n],r=i.sortData[s],a=o.sortData[s];if(r>a||r<a){var u=void 0!==e[s]?e[s]:e,h=u?1:-1;return(r>a?1:-1)*h}}return 0}}var u=t.jQuery,h=String.prototype.trim?function(t){return t.trim()}:function(t){return t.replace(/^\s+|\s+$/g,"")},d=e.create("isotope",{layoutMode:"masonry",isJQueryFiltering:!0,sortAscending:!0});d.Item=s,d.LayoutMode=r;var l=d.prototype;l._create=function(){this.itemGUID=0,this._sorters={},this._getSorters(),e.prototype._create.call(this),this.modes={},this.filteredItems=this.items,this.sortHistory=["original-order"];for(var t in r.modes)this._initLayoutMode(t)},l.reloadItems=function(){this.itemGUID=0,e.prototype.reloadItems.call(this)},l._itemize=function(){for(var t=e.prototype._itemize.apply(this,arguments),i=0;i<t.length;i++){var o=t[i];o.id=this.itemGUID++}return this._updateItemsSortData(t),t},l._initLayoutMode=function(t){var e=r.modes[t],i=this.options[t]||{};this.options[t]=e.options?n.extend(e.options,i):i,this.modes[t]=new e(this)},l.layout=function(){return!this._isLayoutInited&&this._getOption("initLayout")?void this.arrange():void this._layout()},l._layout=function(){var t=this._getIsInstant();this._resetLayout(),this._manageStamps(),this.layoutItems(this.filteredItems,t),this._isLayoutInited=!0},l.arrange=function(t){this.option(t),this._getIsInstant();var e=this._filter(this.items);this.filteredItems=e.matches,this._bindArrangeComplete(),this._isInstant?this._noTransition(this._hideReveal,[e]):this._hideReveal(e),this._sort(),this._layout()},l._init=l.arrange,l._hideReveal=function(t){this.reveal(t.needReveal),this.hide(t.needHide)},l._getIsInstant=function(){var t=this._getOption("layoutInstant"),e=void 0!==t?t:!this._isLayoutInited;return this._isInstant=e,e},l._bindArrangeComplete=function(){function t(){e&&i&&o&&n.dispatchEvent("arrangeComplete",null,[n.filteredItems])}var e,i,o,n=this;this.once("layoutComplete",function(){e=!0,t()}),this.once("hideComplete",function(){i=!0,t()}),this.once("revealComplete",function(){o=!0,t()})},l._filter=function(t){var e=this.options.filter;e=e||"*";for(var i=[],o=[],n=[],s=this._getFilterTest(e),r=0;r<t.length;r++){var a=t[r];if(!a.isIgnored){var u=s(a);u&&i.push(a),u&&a.isHidden?o.push(a):u||a.isHidden||n.push(a)}}return{matches:i,needReveal:o,needHide:n}},l._getFilterTest=function(t){return u&&this.options.isJQueryFiltering?function(e){return u(e.element).is(t);}:"function"==typeof t?function(e){return t(e.element)}:function(e){return o(e.element,t)}},l.updateSortData=function(t){var e;t?(t=n.makeArray(t),e=this.getItems(t)):e=this.items,this._getSorters(),this._updateItemsSortData(e)},l._getSorters=function(){var t=this.options.getSortData;for(var e in t){var i=t[e];this._sorters[e]=f(i)}},l._updateItemsSortData=function(t){for(var e=t&&t.length,i=0;e&&i<e;i++){var o=t[i];o.updateSortData()}};var f=function(){function t(t){if("string"!=typeof t)return t;var i=h(t).split(" "),o=i[0],n=o.match(/^\[(.+)\]$/),s=n&&n[1],r=e(s,o),a=d.sortDataParsers[i[1]];return t=a?function(t){return t&&a(r(t))}:function(t){return t&&r(t)}}function e(t,e){return t?function(e){return e.getAttribute(t)}:function(t){var i=t.querySelector(e);return i&&i.textContent}}return t}();d.sortDataParsers={parseInt:function(t){return parseInt(t,10)},parseFloat:function(t){return parseFloat(t)}},l._sort=function(){if(this.options.sortBy){var t=n.makeArray(this.options.sortBy);this._getIsSameSortBy(t)||(this.sortHistory=t.concat(this.sortHistory));var e=a(this.sortHistory,this.options.sortAscending);this.filteredItems.sort(e)}},l._getIsSameSortBy=function(t){for(var e=0;e<t.length;e++)if(t[e]!=this.sortHistory[e])return!1;return!0},l._mode=function(){var t=this.options.layoutMode,e=this.modes[t];if(!e)throw new Error("No layout mode: "+t);return e.options=this.options[t],e},l._resetLayout=function(){e.prototype._resetLayout.call(this),this._mode()._resetLayout()},l._getItemLayoutPosition=function(t){return this._mode()._getItemLayoutPosition(t)},l._manageStamp=function(t){this._mode()._manageStamp(t)},l._getContainerSize=function(){return this._mode()._getContainerSize()},l.needsResizeLayout=function(){return this._mode().needsResizeLayout()},l.appended=function(t){var e=this.addItems(t);if(e.length){var i=this._filterRevealAdded(e);this.filteredItems=this.filteredItems.concat(i)}},l.prepended=function(t){var e=this._itemize(t);if(e.length){this._resetLayout(),this._manageStamps();var i=this._filterRevealAdded(e);this.layoutItems(this.filteredItems),this.filteredItems=i.concat(this.filteredItems),this.items=e.concat(this.items)}},l._filterRevealAdded=function(t){var e=this._filter(t);return this.hide(e.needHide),this.reveal(e.matches),this.layoutItems(e.matches,!0),e.matches},l.insert=function(t){var e=this.addItems(t);if(e.length){var i,o,n=e.length;for(i=0;i<n;i++)o=e[i],this.element.appendChild(o.element);var s=this._filter(e).matches;for(i=0;i<n;i++)e[i].isLayoutInstant=!0;for(this.arrange(),i=0;i<n;i++)delete e[i].isLayoutInstant;this.reveal(s)}};var c=l.remove;return l.remove=function(t){t=n.makeArray(t);var e=this.getItems(t);c.call(this,t);for(var i=e&&e.length,o=0;i&&o<i;o++){var s=e[o];n.removeFrom(this.filteredItems,s)}},l.shuffle=function(){for(var t=0;t<this.items.length;t++){var e=this.items[t];e.sortData.random=Math.random()}this.options.sortBy="random",this._sort(),this._layout()},l._noTransition=function(t,e){var i=this.options.transitionDuration;this.options.transitionDuration=0;var o=t.apply(this,e);return this.options.transitionDuration=i,o},l.getFilteredItemElements=function(){return this.filteredItems.map(function(t){return t.element})},d});

// jQuery Paginate v0.4
;(function($){$.fn.pajinate=function(options){var current_page="current_page";var items_per_page="items_per_page";var meta;var defaults={item_container_id:".content",items_per_page:10,nav_panel_id:".page_navigation",nav_info_id:".info_text",num_page_links_to_display:20,start_page:0,wrap_around:false,nav_label_first:"First",nav_label_prev:"Prev",nav_label_next:"Next",nav_label_last:"Last",nav_order:["first","prev","num","next","last"],nav_label_info:"Showing {0}-{1} of {2} results",show_first_last:true,abort_on_small_lists:false,jquery_ui:false,jquery_ui_active:"ui-state-highlight",jquery_ui_default:"ui-state-default",jquery_ui_disabled:"ui-state-disabled"};var options=$.extend(defaults,options);var $item_container;var $page_container;var $items;var $nav_panels;var total_page_no_links;var jquery_ui_default_class=options.jquery_ui?options.jquery_ui_default:"";var jquery_ui_active_class=options.jquery_ui?options.jquery_ui_active:"";var jquery_ui_disabled_class=options.jquery_ui?options.jquery_ui_disabled:"";return this.each(function(){$page_container=$(this);$item_container=$(this).find(options.item_container_id);$items=$page_container.find(options.item_container_id).children();if(options.abort_on_small_lists&&options.items_per_page>=$items.size()){return $page_container}meta=$page_container;meta.data(current_page,0);meta.data(items_per_page,options.items_per_page);var total_items=$item_container.children().length;var number_of_pages=Math.ceil(total_items/options.items_per_page);var more='<li class="page-item disabled ellipse more"><a class="page-link" href="#">...</a></li>';var less='<li class="page-item disabled ellipse less"><a class="page-link" href="#">...</a></li>';var first=!options.show_first_last?"":'<li class="page-item first_link '+jquery_ui_default_class+'"><a class="page-link" href="#">'+options.nav_label_first+"</a></li>";var last=!options.show_first_last?"":'<li class="page-item last_link '+jquery_ui_default_class+'"><a class="page-link" href="#">'+options.nav_label_last+"</a></li>";var navigation_html="";for(var i=0;i<options.nav_order.length;i++){switch(options.nav_order[i]){case"first":navigation_html+=first;break;case"last":navigation_html+=last;break;case"next":navigation_html+='<li class="page-item next_link '+jquery_ui_default_class+'"><a class="page-link" href="#">'+options.nav_label_next+"</a></li>";break;case"prev":navigation_html+='<li class="page-item previous_link '+jquery_ui_default_class+'"><a class="page-link" href="#">'+options.nav_label_prev+"</a></li>";break;case"num":navigation_html+=less;var current_link=0;while(number_of_pages>current_link){navigation_html+='<li class="page-item page_link '+jquery_ui_default_class+'" longdesc="'+current_link+'"><a class="page-link" href="#">'+(current_link+1)+"</a></li>";current_link++}navigation_html+=more;break;default:break}}$nav_panels=$page_container.find(options.nav_panel_id);$nav_panels.html(navigation_html).each(function(){$(this).find(".page_link:first").addClass("first");$(this).find(".page_link:last").addClass("last")});$nav_panels.children(".ellipse").hide();$nav_panels.find(".previous_link").next().next().addClass("active "+jquery_ui_active_class);$items.hide();$items.slice(0,meta.data(items_per_page)).show();total_page_no_links=$page_container.find(options.nav_panel_id+":first").children(".page_link").length;options.num_page_links_to_display=Math.min(options.num_page_links_to_display,total_page_no_links);$nav_panels.children(".page_link").hide();$nav_panels.each(function(){$(this).children(".page_link").slice(0,options.num_page_links_to_display).show()});$page_container.find(".first_link").click(function(e){e.preventDefault();movePageNumbersRight($(this),0);gotopage(0)});$page_container.find(".last_link").click(function(e){e.preventDefault();var lastPage=total_page_no_links-1;movePageNumbersLeft($(this),lastPage);gotopage(lastPage)});$page_container.find(".previous_link").click(function(e){e.preventDefault();showPrevPage($(this))});$page_container.find(".next_link").click(function(e){e.preventDefault();showNextPage($(this))});$page_container.find(".page_link").click(function(e){e.preventDefault();gotopage($(this).attr("longdesc"))});gotopage(parseInt(options.start_page));toggleMoreLess();if(!options.wrap_around){tagNextPrev()}});function showPrevPage(e){new_page=parseInt(meta.data(current_page))-1;if($(e).siblings(".active").prev(".page_link").length==true){movePageNumbersRight(e,new_page);gotopage(new_page)}else{if(options.wrap_around){gotopage(total_page_no_links-1)}}}function showNextPage(e){new_page=parseInt(meta.data(current_page))+1;if($(e).siblings(".active").next(".page_link").length==true){movePageNumbersLeft(e,new_page);gotopage(new_page)}else{if(options.wrap_around){gotopage(0)}}}function gotopage(page_num){page_num=parseInt(page_num,10);var ipp=parseInt(meta.data(items_per_page));start_from=page_num*ipp;end_on=start_from+ipp;var items=$items.hide().slice(start_from,end_on);items.fadeIn(700);$page_container.find(options.nav_panel_id).children(".page_link[longdesc="+page_num+"]").addClass("active "+jquery_ui_active_class).siblings(".active").removeClass("active "+jquery_ui_active_class);meta.data(current_page,page_num);var $current_page=parseInt(meta.data(current_page)+1);var total_items=$item_container.children().length;var $number_of_pages=Math.ceil(total_items/options.items_per_page);$page_container.find(options.nav_info_id).html(options.nav_label_info.replace("{0}",start_from+1).replace("{1}",start_from+items.length).replace("{2}",$items.length).replace("{3}",$current_page).replace("{4}",$number_of_pages));toggleMoreLess();tagNextPrev();if(typeof(options.onPageDisplayed)!=="undefined"){options.onPageDisplayed.call(this,page_num+1)}}function movePageNumbersLeft(e,new_p){var new_page=new_p;var $current_active_link=$(e).siblings(".active");if($current_active_link.siblings(".page_link[longdesc="+new_page+"]").css("display")=="none"){$nav_panels.each(function(){$(this).children(".page_link").hide().slice(parseInt(new_page-options.num_page_links_to_display+1),new_page+1).show()})}}function movePageNumbersRight(e,new_p){var new_page=new_p;var $current_active_link=$(e).siblings(".active");if($current_active_link.siblings(".page_link[longdesc="+new_page+"]").css("display")=="none"){$nav_panels.each(function(){$(this).children(".page_link").hide().slice(new_page,new_page+parseInt(options.num_page_links_to_display)).show()})}}function toggleMoreLess(){}function tagNextPrev(){if($nav_panels.children(".last").hasClass("active")){$nav_panels.children(".next_link").add(".last_link").addClass("no_more "+jquery_ui_disabled_class)}else{$nav_panels.children(".next_link").add(".last_link").removeClass("no_more "+jquery_ui_disabled_class)}if($nav_panels.children(".first").hasClass("active")){$nav_panels.children(".previous_link").add(".first_link").addClass("no_more "+jquery_ui_disabled_class)}else{$nav_panels.children(".previous_link").add(".first_link").removeClass("no_more "+jquery_ui_disabled_class)}}}})(jQuery);

// Lazyload v17.8.3
!function(n,t){"object"==typeof exports&&"undefined"!=typeof module?module.exports=t():"function"==typeof define&&define.amd?define(t):(n="undefined"!=typeof globalThis?globalThis:n||self).LazyLoad=t()}(this,(function(){"use strict";function n(){return n=Object.assign||function(n){for(var t=1;t<arguments.length;t++){var e=arguments[t];for(var i in e)Object.prototype.hasOwnProperty.call(e,i)&&(n[i]=e[i])}return n},n.apply(this,arguments)}var t="undefined"!=typeof window,e=t&&!("onscroll"in window)||"undefined"!=typeof navigator&&/(gle|ing|ro)bot|crawl|spider/i.test(navigator.userAgent),i=t&&"IntersectionObserver"in window,o=t&&"classList"in document.createElement("p"),a=t&&window.devicePixelRatio>1,r={elements_selector:".lazy",container:e||t?document:null,threshold:300,thresholds:null,data_src:"src",data_srcset:"srcset",data_sizes:"sizes",data_bg:"bg",data_bg_hidpi:"bg-hidpi",data_bg_multi:"bg-multi",data_bg_multi_hidpi:"bg-multi-hidpi",data_bg_set:"bg-set",data_poster:"poster",class_applied:"applied",class_loading:"loading",class_loaded:"loaded",class_error:"error",class_entered:"entered",class_exited:"exited",unobserve_completed:!0,unobserve_entered:!1,cancel_on_exit:!0,callback_enter:null,callback_exit:null,callback_applied:null,callback_loading:null,callback_loaded:null,callback_error:null,callback_finish:null,callback_cancel:null,use_native:!1,restore_on_error:!1},c=function(t){return n({},r,t)},l=function(n,t){var e,i="LazyLoad::Initialized",o=new n(t);try{e=new CustomEvent(i,{detail:{instance:o}})}catch(n){(e=document.createEvent("CustomEvent")).initCustomEvent(i,!1,!1,{instance:o})}window.dispatchEvent(e)},u="src",s="srcset",d="sizes",f="poster",_="llOriginalAttrs",g="data",v="loading",b="loaded",m="applied",p="error",h="native",E="data-",I="ll-status",y=function(n,t){return n.getAttribute(E+t)},k=function(n){return y(n,I)},w=function(n,t){return function(n,t,e){var i="data-ll-status";null!==e?n.setAttribute(i,e):n.removeAttribute(i)}(n,0,t)},A=function(n){return w(n,null)},L=function(n){return null===k(n)},O=function(n){return k(n)===h},x=[v,b,m,p],C=function(n,t,e,i){n&&(void 0===i?void 0===e?n(t):n(t,e):n(t,e,i))},N=function(n,t){o?n.classList.add(t):n.className+=(n.className?" ":"")+t},M=function(n,t){o?n.classList.remove(t):n.className=n.className.replace(new RegExp("(^|\\s+)"+t+"(\\s+|$)")," ").replace(/^\s+/,"").replace(/\s+$/,"")},z=function(n){return n.llTempImage},T=function(n,t){if(t){var e=t._observer;e&&e.unobserve(n)}},R=function(n,t){n&&(n.loadingCount+=t)},G=function(n,t){n&&(n.toLoadCount=t)},j=function(n){for(var t,e=[],i=0;t=n.children[i];i+=1)"SOURCE"===t.tagName&&e.push(t);return e},D=function(n,t){var e=n.parentNode;e&&"PICTURE"===e.tagName&&j(e).forEach(t)},H=function(n,t){j(n).forEach(t)},V=[u],F=[u,f],B=[u,s,d],J=[g],P=function(n){return!!n[_]},S=function(n){return n[_]},U=function(n){return delete n[_]},$=function(n,t){if(!P(n)){var e={};t.forEach((function(t){e[t]=n.getAttribute(t)})),n[_]=e}},q=function(n,t){if(P(n)){var e=S(n);t.forEach((function(t){!function(n,t,e){e?n.setAttribute(t,e):n.removeAttribute(t)}(n,t,e[t])}))}},K=function(n,t,e){N(n,t.class_applied),w(n,m),e&&(t.unobserve_completed&&T(n,t),C(t.callback_applied,n,e))},Q=function(n,t,e){N(n,t.class_loading),w(n,v),e&&(R(e,1),C(t.callback_loading,n,e))},W=function(n,t,e){e&&n.setAttribute(t,e)},X=function(n,t){W(n,d,y(n,t.data_sizes)),W(n,s,y(n,t.data_srcset)),W(n,u,y(n,t.data_src))},Y={IMG:function(n,t){D(n,(function(n){$(n,B),X(n,t)})),$(n,B),X(n,t)},IFRAME:function(n,t){$(n,V),W(n,u,y(n,t.data_src))},VIDEO:function(n,t){H(n,(function(n){$(n,V),W(n,u,y(n,t.data_src))})),$(n,F),W(n,f,y(n,t.data_poster)),W(n,u,y(n,t.data_src)),n.load()},OBJECT:function(n,t){$(n,J),W(n,g,y(n,t.data_src))}},Z=["IMG","IFRAME","VIDEO","OBJECT"],nn=function(n,t){!t||function(n){return n.loadingCount>0}(t)||function(n){return n.toLoadCount>0}(t)||C(n.callback_finish,t)},tn=function(n,t,e){n.addEventListener(t,e),n.llEvLisnrs[t]=e},en=function(n,t,e){n.removeEventListener(t,e)},on=function(n){return!!n.llEvLisnrs},an=function(n){if(on(n)){var t=n.llEvLisnrs;for(var e in t){var i=t[e];en(n,e,i)}delete n.llEvLisnrs}},rn=function(n,t,e){!function(n){delete n.llTempImage}(n),R(e,-1),function(n){n&&(n.toLoadCount-=1)}(e),M(n,t.class_loading),t.unobserve_completed&&T(n,e)},cn=function(n,t,e){var i=z(n)||n;on(i)||function(n,t,e){on(n)||(n.llEvLisnrs={});var i="VIDEO"===n.tagName?"loadeddata":"load";tn(n,i,t),tn(n,"error",e)}(i,(function(o){!function(n,t,e,i){var o=O(t);rn(t,e,i),N(t,e.class_loaded),w(t,b),C(e.callback_loaded,t,i),o||nn(e,i)}(0,n,t,e),an(i)}),(function(o){!function(n,t,e,i){var o=O(t);rn(t,e,i),N(t,e.class_error),w(t,p),C(e.callback_error,t,i),e.restore_on_error&&q(t,B),o||nn(e,i)}(0,n,t,e),an(i)}))},ln=function(n,t,e){!function(n){return Z.indexOf(n.tagName)>-1}(n)?function(n,t,e){!function(n){n.llTempImage=document.createElement("IMG")}(n),cn(n,t,e),function(n){P(n)||(n[_]={backgroundImage:n.style.backgroundImage})}(n),function(n,t,e){var i=y(n,t.data_bg),o=y(n,t.data_bg_hidpi),r=a&&o?o:i;r&&(n.style.backgroundImage='url("'.concat(r,'")'),z(n).setAttribute(u,r),Q(n,t,e))}(n,t,e),function(n,t,e){var i=y(n,t.data_bg_multi),o=y(n,t.data_bg_multi_hidpi),r=a&&o?o:i;r&&(n.style.backgroundImage=r,K(n,t,e))}(n,t,e),function(n,t,e){var i=y(n,t.data_bg_set);if(i){var o=i.split("|"),a=o.map((function(n){return"image-set(".concat(n,")")}));n.style.backgroundImage=a.join(),""===n.style.backgroundImage&&(a=o.map((function(n){return"-webkit-image-set(".concat(n,")")})),n.style.backgroundImage=a.join()),K(n,t,e)}}(n,t,e)}(n,t,e):function(n,t,e){cn(n,t,e),function(n,t,e){var i=Y[n.tagName];i&&(i(n,t),Q(n,t,e))}(n,t,e)}(n,t,e)},un=function(n){n.removeAttribute(u),n.removeAttribute(s),n.removeAttribute(d)},sn=function(n){D(n,(function(n){q(n,B)})),q(n,B)},dn={IMG:sn,IFRAME:function(n){q(n,V)},VIDEO:function(n){H(n,(function(n){q(n,V)})),q(n,F),n.load()},OBJECT:function(n){q(n,J)}},fn=function(n,t){(function(n){var t=dn[n.tagName];t?t(n):function(n){if(P(n)){var t=S(n);n.style.backgroundImage=t.backgroundImage}}(n)})(n),function(n,t){L(n)||O(n)||(M(n,t.class_entered),M(n,t.class_exited),M(n,t.class_applied),M(n,t.class_loading),M(n,t.class_loaded),M(n,t.class_error))}(n,t),A(n),U(n)},_n=["IMG","IFRAME","VIDEO"],gn=function(n){return n.use_native&&"loading"in HTMLImageElement.prototype},vn=function(n,t,e){n.forEach((function(n){return function(n){return n.isIntersecting||n.intersectionRatio>0}(n)?function(n,t,e,i){var o=function(n){return x.indexOf(k(n))>=0}(n);w(n,"entered"),N(n,e.class_entered),M(n,e.class_exited),function(n,t,e){t.unobserve_entered&&T(n,e)}(n,e,i),C(e.callback_enter,n,t,i),o||ln(n,e,i)}(n.target,n,t,e):function(n,t,e,i){L(n)||(N(n,e.class_exited),function(n,t,e,i){e.cancel_on_exit&&function(n){return k(n)===v}(n)&&"IMG"===n.tagName&&(an(n),function(n){D(n,(function(n){un(n)})),un(n)}(n),sn(n),M(n,e.class_loading),R(i,-1),A(n),C(e.callback_cancel,n,t,i))}(n,t,e,i),C(e.callback_exit,n,t,i))}(n.target,n,t,e)}))},bn=function(n){return Array.prototype.slice.call(n)},mn=function(n){return n.container.querySelectorAll(n.elements_selector)},pn=function(n){return function(n){return k(n)===p}(n)},hn=function(n,t){return function(n){return bn(n).filter(L)}(n||mn(t))},En=function(n,e){var o=c(n);this._settings=o,this.loadingCount=0,function(n,t){i&&!gn(n)&&(t._observer=new IntersectionObserver((function(e){vn(e,n,t)}),function(n){return{root:n.container===document?null:n.container,rootMargin:n.thresholds||n.threshold+"px"}}(n)))}(o,this),function(n,e){t&&(e._onlineHandler=function(){!function(n,t){var e;(e=mn(n),bn(e).filter(pn)).forEach((function(t){M(t,n.class_error),A(t)})),t.update()}(n,e)},window.addEventListener("online",e._onlineHandler))}(o,this),this.update(e)};return En.prototype={update:function(n){var t,o,a=this._settings,r=hn(n,a);G(this,r.length),!e&&i?gn(a)?function(n,t,e){n.forEach((function(n){-1!==_n.indexOf(n.tagName)&&function(n,t,e){n.setAttribute("loading","lazy"),cn(n,t,e),function(n,t){var e=Y[n.tagName];e&&e(n,t)}(n,t),w(n,h)}(n,t,e)})),G(e,0)}(r,a,this):(o=r,function(n){n.disconnect()}(t=this._observer),function(n,t){t.forEach((function(t){n.observe(t)}))}(t,o)):this.loadAll(r)},destroy:function(){this._observer&&this._observer.disconnect(),t&&window.removeEventListener("online",this._onlineHandler),mn(this._settings).forEach((function(n){U(n)})),delete this._observer,delete this._settings,delete this._onlineHandler,delete this.loadingCount,delete this.toLoadCount},loadAll:function(n){var t=this,e=this._settings;hn(n,e).forEach((function(n){T(n,t),ln(n,e,t)}))},restoreAll:function(){var n=this._settings;mn(n).forEach((function(t){fn(t,n)}))}},En.load=function(n,t){var e=c(t);ln(n,e)},En.resetStatus=function(n){A(n)},t&&function(n,t){if(t)if(t.length)for(var e,i=0;e=t[i];i+=1)l(n,e);else l(n,t)}(En,window.lazyLoadOptions),En}));

/*! Magnific Popup - v1.1.0 - 2016-02-20
* http://dimsemenov.com/plugins/magnific-popup/
* Copyright (c) 2016 Dmitry Semenov; */
!function(e){"function"==typeof define&&define.amd?define(["jquery"],e):"object"==typeof exports?e(require("jquery")):e(window.jQuery||window.Zepto)}(function(e){var t,i,n,o,a,r,s=function(){},l=!!window.jQuery,c=e(window),d=function(e,i){t.ev.on("mfp"+e+".mfp",i)},p=function(t,i,n,o){var a=document.createElement("div");return a.className="mfp-"+t,n&&(a.innerHTML=n),o?i&&i.appendChild(a):(a=e(a),i&&a.appendTo(i)),a},u=function(i,n){t.ev.triggerHandler("mfp"+i,n),t.st.callbacks&&(i=i.charAt(0).toLowerCase()+i.slice(1),t.st.callbacks[i]&&t.st.callbacks[i].apply(t,e.isArray(n)?n:[n]))},f=function(i){return i===r&&t.currTemplate.closeBtn||(t.currTemplate.closeBtn=e(t.st.closeMarkup.replace("%title%",t.st.tClose)),t.currTemplate.closeBtn.html(t.st.closeIcon),r=i),t.currTemplate.closeBtn},m=function(){e.magnificPopup.instance||((t=new s).init(),e.magnificPopup.instance=t)};s.prototype={constructor:s,init:function(){var i=navigator.appVersion;t.isLowIE=t.isIE8=document.all&&!document.addEventListener,t.isAndroid=/android/gi.test(i),t.isIOS=/iphone|ipad|ipod/gi.test(i),t.supportsTransition=function(){var e=document.createElement("p").style,t=["ms","O","Moz","Webkit"];if(void 0!==e.transition)return!0;for(;t.length;)if(t.pop()+"Transition"in e)return!0;return!1}(),t.probablyMobile=t.isAndroid||t.isIOS||/(Opera Mini)|Kindle|webOS|BlackBerry|(Opera Mobi)|(Windows Phone)|IEMobile/i.test(navigator.userAgent),n=e(document),t.popupsCache={}},open:function(i){var o;if(!1===i.isObj){t.items=i.items.toArray(),t.index=0;var r,s=i.items;for(o=0;o<s.length;o++)if((r=s[o]).parsed&&(r=r.el[0]),r===i.el[0]){t.index=o;break}}else t.items=e.isArray(i.items)?i.items:[i.items],t.index=i.index||0;if(!t.isOpen){t.types=[],a="",i.mainEl&&i.mainEl.length?t.ev=i.mainEl.eq(0):t.ev=n,i.key?(t.popupsCache[i.key]||(t.popupsCache[i.key]={}),t.currTemplate=t.popupsCache[i.key]):t.currTemplate={},t.st=e.extend(!0,{},e.magnificPopup.defaults,i),t.fixedContentPos="auto"===t.st.fixedContentPos?!t.probablyMobile:t.st.fixedContentPos,t.st.modal&&(t.st.closeOnContentClick=!1,t.st.closeOnBgClick=!1,t.st.showCloseBtn=!1,t.st.enableEscapeKey=!1),t.bgOverlay||(t.bgOverlay=p("bg").on("click.mfp",function(){t.close()}),t.wrap=p("wrap").attr("tabindex",-1).on("click.mfp",function(e){t._checkIfClose(e.target)&&t.close()}),t.container=p("container",t.wrap)),t.contentContainer=p("content"),t.st.preloader&&(t.preloader=p("preloader",t.container,t.st.tLoading));var l=e.magnificPopup.modules;for(o=0;o<l.length;o++){var m=l[o];m=m.charAt(0).toUpperCase()+m.slice(1),t["init"+m].call(t)}u("BeforeOpen"),t.st.showCloseBtn&&(t.st.closeBtnInside?(d("MarkupParse",function(e,t,i,n){i.close_replaceWith=f(n.type)}),a+=" mfp-close-btn-in"):t.wrap.append(f())),t.st.alignTop&&(a+=" mfp-align-top"),t.fixedContentPos?t.wrap.css({overflow:t.st.overflowY,overflowX:"hidden",overflowY:t.st.overflowY}):t.wrap.css({top:c.scrollTop(),position:"absolute"}),(!1===t.st.fixedBgPos||"auto"===t.st.fixedBgPos&&!t.fixedContentPos)&&t.bgOverlay.css({height:n.height(),position:"absolute"}),t.st.enableEscapeKey&&n.on("keyup.mfp",function(e){27===e.keyCode&&t.close()}),c.on("resize.mfp",function(){t.updateSize()}),t.st.closeOnContentClick||(a+=" mfp-auto-cursor"),a&&t.wrap.addClass(a);var g=t.wH=c.height(),v={};if(t.fixedContentPos&&t._hasScrollBar(g)){var h=t._getScrollbarSize();h&&(v.marginRight=h)}t.fixedContentPos&&(t.isIE7?e("body, html").css("overflow","hidden"):v.overflow="hidden");var C=t.st.mainClass;return t.isIE7&&(C+=" mfp-ie7"),C&&t._addClassToMFP(C),t.updateItemHTML(),u("BuildControls"),e("html").css(v),t.bgOverlay.add(t.wrap).prependTo(t.st.prependTo||e(document.body)),t._lastFocusedEl=document.activeElement,setTimeout(function(){t.content?(t._addClassToMFP("mfp-ready"),t._setFocus()):t.bgOverlay.addClass("mfp-ready"),n.on("focusin.mfp",t._onFocusIn)},16),t.isOpen=!0,t.updateSize(g),u("Open"),i}t.updateItemHTML()},close:function(){t.isOpen&&(u("BeforeClose"),t.isOpen=!1,t.st.removalDelay&&!t.isLowIE&&t.supportsTransition?(t._addClassToMFP("mfp-removing"),setTimeout(function(){t._close()},t.st.removalDelay)):t._close())},_close:function(){u("Close");var i="mfp-removing mfp-ready ";if(t.bgOverlay.detach(),t.wrap.detach(),t.container.empty(),t.st.mainClass&&(i+=t.st.mainClass+" "),t._removeClassFromMFP(i),t.fixedContentPos){var o={marginRight:""};t.isIE7?e("body, html").css("overflow",""):o.overflow="",e("html").css(o)}n.off("keyup.mfp focusin.mfp"),t.ev.off(".mfp"),t.wrap.attr("class","mfp-wrap").removeAttr("style"),t.bgOverlay.attr("class","mfp-bg"),t.container.attr("class","mfp-container"),!t.st.showCloseBtn||t.st.closeBtnInside&&!0!==t.currTemplate[t.currItem.type]||t.currTemplate.closeBtn&&t.currTemplate.closeBtn.detach(),t.st.autoFocusLast&&t._lastFocusedEl&&e(t._lastFocusedEl).focus(),t.currItem=null,t.content=null,t.currTemplate=null,t.prevHeight=0,u("AfterClose")},updateSize:function(e){if(t.isIOS){var i=document.documentElement.clientWidth/window.innerWidth,n=window.innerHeight*i;t.wrap.css("height",n),t.wH=n}else t.wH=e||c.height();t.fixedContentPos||t.wrap.css("height",t.wH),u("Resize")},updateItemHTML:function(){var i=t.items[t.index];t.contentContainer.detach(),t.content&&t.content.detach(),i.parsed||(i=t.parseEl(t.index));var n=i.type;if(u("BeforeChange",[t.currItem?t.currItem.type:"",n]),t.currItem=i,!t.currTemplate[n]){var a=!!t.st[n]&&t.st[n].markup;u("FirstMarkupParse",a),t.currTemplate[n]=!a||e(a)}o&&o!==i.type&&t.container.removeClass("mfp-"+o+"-holder");var r=t["get"+n.charAt(0).toUpperCase()+n.slice(1)](i,t.currTemplate[n]);t.appendContent(r,n),i.preloaded=!0,u("Change",i),o=i.type,t.container.prepend(t.contentContainer),u("AfterChange")},appendContent:function(e,i){t.content=e,e?t.st.showCloseBtn&&t.st.closeBtnInside&&!0===t.currTemplate[i]?t.content.find(".mfp-close").length||t.content.append(f()):t.content=e:t.content="",u("BeforeAppend"),t.container.addClass("mfp-"+i+"-holder"),t.contentContainer.append(t.content)},parseEl:function(i){var n,o=t.items[i];if(o.tagName?o={el:e(o)}:(n=o.type,o={data:o,src:o.src}),o.el){for(var a=t.types,r=0;r<a.length;r++)if(o.el.hasClass("mfp-"+a[r])){n=a[r];break}o.src=o.el.attr("data-mfp-src"),o.src||(o.src=o.el.attr("href")),o.srcset=o.el.attr("data-srcset")||"",o.sizes=o.el.attr("data-sizes")||""}return o.type=n||t.st.type||"inline",o.index=i,o.parsed=!0,t.items[i]=o,u("ElementParse",o),t.items[i]},addGroup:function(e,i){var n=function(n){n.mfpEl=this,t._openClick(n,e,i)};i||(i={});var o="click.magnificPopup";i.mainEl=e,i.items?(i.isObj=!0,e.off(o).on(o,n)):(i.isObj=!1,i.delegate?e.off(o).on(o,i.delegate,n):(i.items=e,e.off(o).on(o,n)))},_openClick:function(i,n,o){if((void 0!==o.midClick?o.midClick:e.magnificPopup.defaults.midClick)||!(2===i.which||i.ctrlKey||i.metaKey||i.altKey||i.shiftKey)){var a=void 0!==o.disableOn?o.disableOn:e.magnificPopup.defaults.disableOn;if(a)if(e.isFunction(a)){if(!a.call(t))return!0}else if(c.width()<a)return!0;i.type&&(i.preventDefault(),t.isOpen&&i.stopPropagation()),o.el=e(i.mfpEl),o.delegate&&(o.items=n.find(o.delegate)),t.open(o)}},updateStatus:function(e,n){if(t.preloader){i!==e&&t.container.removeClass("mfp-s-"+i),n||"loading"!==e||(n=t.st.tLoading);var o={status:e,text:n};u("UpdateStatus",o),e=o.status,n=o.text,t.preloader.html(n),t.preloader.find("a").on("click",function(e){e.stopImmediatePropagation()}),t.container.addClass("mfp-s-"+e),i=e}},_checkIfClose:function(i){if(!e(i).hasClass("mfp-prevent-close")){var n=t.st.closeOnContentClick,o=t.st.closeOnBgClick;if(n&&o)return!0;if(!t.content||e(i).hasClass("mfp-close")||t.preloader&&i===t.preloader[0])return!0;if(i===t.content[0]||e.contains(t.content[0],i)){if(n)return!0}else if(o&&e.contains(document,i))return!0;return!1}},_addClassToMFP:function(e){t.bgOverlay.addClass(e),t.wrap.addClass(e)},_removeClassFromMFP:function(e){this.bgOverlay.removeClass(e),t.wrap.removeClass(e)},_hasScrollBar:function(e){return(t.isIE7?n.height():document.body.scrollHeight)>(e||c.height())},_setFocus:function(){(t.st.focus?t.content.find(t.st.focus).eq(0):t.wrap).focus()},_onFocusIn:function(i){if(i.target!==t.wrap[0]&&!e.contains(t.wrap[0],i.target))return t._setFocus(),!1},_parseMarkup:function(t,i,n){var o;n.data&&(i=e.extend(n.data,i)),u("MarkupParse",[t,i,n]),e.each(i,function(i,n){if(void 0===n||!1===n)return!0;if((o=i.split("_")).length>1){var a=t.find(".mfp-"+o[0]);if(a.length>0){var r=o[1];"replaceWith"===r?a[0]!==n[0]&&a.replaceWith(n):"img"===r?a.is("img")?a.attr("src",n):a.replaceWith(e("<img>").attr("src",n).attr("class",a.attr("class"))):a.attr(o[1],n)}}else t.find(".mfp-"+i).html(n)})},_getScrollbarSize:function(){if(void 0===t.scrollbarSize){var e=document.createElement("div");e.style.cssText="width: 99px; height: 99px; overflow: scroll; position: absolute; top: -9999px;",document.body.appendChild(e),t.scrollbarSize=e.offsetWidth-e.clientWidth,document.body.removeChild(e)}return t.scrollbarSize}},e.magnificPopup={instance:null,proto:s.prototype,modules:[],open:function(t,i){return m(),(t=t?e.extend(!0,{},t):{}).isObj=!0,t.index=i||0,this.instance.open(t)},close:function(){return e.magnificPopup.instance&&e.magnificPopup.instance.close()},registerModule:function(t,i){i.options&&(e.magnificPopup.defaults[t]=i.options),e.extend(this.proto,i.proto),this.modules.push(t)},defaults:{disableOn:0,key:null,midClick:!1,mainClass:"",preloader:!0,focus:"",closeOnContentClick:!1,closeOnBgClick:!0,closeBtnInside:!0,showCloseBtn:!0,enableEscapeKey:!0,modal:!1,alignTop:!1,removalDelay:0,prependTo:null,fixedContentPos:"auto",fixedBgPos:"auto",overflowY:"auto",closeIcon:"&#215;",closeMarkup:'<button title="%title%" type="button" class="mfp-close"></button>',tClose:"Close (Esc)",tLoading:"Loading...",autoFocusLast:!0}},e.fn.magnificPopup=function(i){m();var n=e(this);if("string"==typeof i)if("open"===i){var o,a=l?n.data("magnificPopup"):n[0].magnificPopup,r=parseInt(arguments[1],10)||0;a.items?o=a.items[r]:(o=n,a.delegate&&(o=o.find(a.delegate)),o=o.eq(r)),t._openClick({mfpEl:o},n,a)}else t.isOpen&&t[i].apply(t,Array.prototype.slice.call(arguments,1));else i=e.extend(!0,{},i),l?n.data("magnificPopup",i):n[0].magnificPopup=i,t.addGroup(n,i);return n};var g,v,h,C=function(){h&&(v.after(h.addClass(g)).detach(),h=null)};e.magnificPopup.registerModule("inline",{options:{hiddenClass:"hide",markup:"",tNotFound:"Content not found"},proto:{initInline:function(){t.types.push("inline"),d("Close.inline",function(){C()})},getInline:function(i,n){if(C(),i.src){var o=t.st.inline,a=e(i.src);if(a.length){var r=a[0].parentNode;r&&r.tagName&&(v||(g=o.hiddenClass,v=p(g),g="mfp-"+g),h=a.after(v).detach().removeClass(g)),t.updateStatus("ready")}else t.updateStatus("error",o.tNotFound),a=e("<div>");return i.inlineElement=a,a}return t.updateStatus("ready"),t._parseMarkup(n,{},i),n}}});var y,w=function(){y&&e(document.body).removeClass(y)},b=function(){w(),t.req&&t.req.abort()};e.magnificPopup.registerModule("ajax",{options:{settings:null,cursor:"mfp-ajax-cur",tError:'<a href="%url%">The content</a> could not be loaded.'},proto:{initAjax:function(){t.types.push("ajax"),y=t.st.ajax.cursor,d("Close.ajax",b),d("BeforeChange.ajax",b)},getAjax:function(i){y&&e(document.body).addClass(y),t.updateStatus("loading");var n=e.extend({url:i.src,success:function(n,o,a){var r={data:n,xhr:a};u("ParseAjax",r),t.appendContent(e(r.data),"ajax"),i.finished=!0,w(),t._setFocus(),setTimeout(function(){t.wrap.addClass("mfp-ready")},16),t.updateStatus("ready"),u("AjaxContentAdded")},error:function(){w(),i.finished=i.loadError=!0,t.updateStatus("error",t.st.ajax.tError.replace("%url%",i.src))}},t.st.ajax.settings);return t.req=e.ajax(n),""}}});var I,x=function(i){if(i.data&&void 0!==i.data.title)return i.data.title;var n=t.st.image.titleSrc;if(n){if(e.isFunction(n))return n.call(t,i);if(i.el)return i.el.attr(n)||""}return""};e.magnificPopup.registerModule("image",{options:{markup:'<div class="mfp-figure"><div class="mfp-close"></div><figure><div class="mfp-img"></div><figcaption><div class="mfp-bottom-bar"><div class="mfp-title"></div><div class="mfp-counter"></div></div></figcaption></figure></div>',cursor:"mfp-zoom-out-cur",titleSrc:"title",verticalFit:!0,tError:'<a href="%url%">The image</a> could not be loaded.'},proto:{initImage:function(){var i=t.st.image,n=".image";t.types.push("image"),d("Open"+n,function(){"image"===t.currItem.type&&i.cursor&&e(document.body).addClass(i.cursor)}),d("Close"+n,function(){i.cursor&&e(document.body).removeClass(i.cursor),c.off("resize.mfp")}),d("Resize"+n,t.resizeImage),t.isLowIE&&d("AfterChange",t.resizeImage)},resizeImage:function(){var e=t.currItem;if(e&&e.img&&t.st.image.verticalFit){var i=0;t.isLowIE&&(i=parseInt(e.img.css("padding-top"),10)+parseInt(e.img.css("padding-bottom"),10)),e.img.css("max-height",t.wH-i)}},_onImageHasSize:function(e){e.img&&(e.hasSize=!0,I&&clearInterval(I),e.isCheckingImgSize=!1,u("ImageHasSize",e),e.imgHidden&&(t.content&&t.content.removeClass("mfp-loading"),e.imgHidden=!1))},findImageSize:function(e){var i=0,n=e.img[0],o=function(a){I&&clearInterval(I),I=setInterval(function(){n.naturalWidth>0?t._onImageHasSize(e):(i>200&&clearInterval(I),3===++i?o(10):40===i?o(50):100===i&&o(500))},a)};o(1)},getImage:function(i,n){var o=0,a=function(){i&&(i.img[0].complete?(i.img.off(".mfploader"),i===t.currItem&&(t._onImageHasSize(i),t.updateStatus("ready")),i.hasSize=!0,i.loaded=!0,u("ImageLoadComplete")):++o<200?setTimeout(a,100):r())},r=function(){i&&(i.img.off(".mfploader"),i===t.currItem&&(t._onImageHasSize(i),t.updateStatus("error",s.tError.replace("%url%",i.src))),i.hasSize=!0,i.loaded=!0,i.loadError=!0)},s=t.st.image,l=n.find(".mfp-img");if(l.length){var c=document.createElement("img");c.className="mfp-img",i.el&&i.el.find("img").length&&(c.alt=i.el.find("img").attr("alt")),i.img=e(c).on("load.mfploader",a).on("error.mfploader",r),c.src=i.src,c.srcset=i.srcset,c.sizes=i.sizes,l.is("img")&&(i.img=i.img.clone()),(c=i.img[0]).naturalWidth>0?i.hasSize=!0:c.width||(i.hasSize=!1)}return t._parseMarkup(n,{title:x(i),img_replaceWith:i.img},i),t.resizeImage(),i.hasSize?(I&&clearInterval(I),i.loadError?(n.addClass("mfp-loading"),t.updateStatus("error",s.tError.replace("%url%",i.src))):(n.removeClass("mfp-loading"),t.updateStatus("ready")),n):(t.updateStatus("loading"),i.loading=!0,i.hasSize||(i.imgHidden=!0,n.addClass("mfp-loading"),t.findImageSize(i)),n)}}});var k;e.magnificPopup.registerModule("zoom",{options:{enabled:!1,easing:"ease-in-out",duration:300,opener:function(e){return e.is("img")?e:e.find("img")}},proto:{initZoom:function(){var e,i=t.st.zoom,n=".zoom";if(i.enabled&&t.supportsTransition){var o,a,r=i.duration,s=function(e){var t=e.clone().removeAttr("style").removeAttr("class").addClass("mfp-animated-image"),n="all "+i.duration/1e3+"s "+i.easing,o={position:"fixed",zIndex:9999,left:0,top:0,"-webkit-backface-visibility":"hidden"},a="transition";return o["-webkit-"+a]=o["-moz-"+a]=o["-o-"+a]=o[a]=n,t.css(o),t},l=function(){t.content.css("visibility","visible")};d("BuildControls"+n,function(){if(t._allowZoom()){if(clearTimeout(o),t.content.css("visibility","hidden"),!(e=t._getItemToZoom()))return void l();(a=s(e)).css(t._getOffset()),t.wrap.append(a),o=setTimeout(function(){a.css(t._getOffset(!0)),o=setTimeout(function(){l(),setTimeout(function(){a.remove(),e=a=null,u("ZoomAnimationEnded")},16)},r)},16)}}),d("BeforeClose"+n,function(){if(t._allowZoom()){if(clearTimeout(o),t.st.removalDelay=r,!e){if(!(e=t._getItemToZoom()))return;a=s(e)}a.css(t._getOffset(!0)),t.wrap.append(a),t.content.css("visibility","hidden"),setTimeout(function(){a.css(t._getOffset())},16)}}),d("Close"+n,function(){t._allowZoom()&&(l(),a&&a.remove(),e=null)})}},_allowZoom:function(){return"image"===t.currItem.type},_getItemToZoom:function(){return!!t.currItem.hasSize&&t.currItem.img},_getOffset:function(i){var n,o=(n=i?t.currItem.img:t.st.zoom.opener(t.currItem.el||t.currItem)).offset(),a=parseInt(n.css("padding-top"),10),r=parseInt(n.css("padding-bottom"),10);o.top-=e(window).scrollTop()-a;var s={width:n.width(),height:(l?n.innerHeight():n[0].offsetHeight)-r-a};return void 0===k&&(k=void 0!==document.createElement("p").style.MozTransform),k?s["-moz-transform"]=s.transform="translate("+o.left+"px,"+o.top+"px)":(s.left=o.left,s.top=o.top),s}}});var T=function(e){if(t.currTemplate.iframe){var i=t.currTemplate.iframe.find("iframe");i.length&&(e||(i[0].src="//about:blank"),t.isIE8&&i.css("display",e?"block":"none"))}};e.magnificPopup.registerModule("iframe",{options:{markup:'<div class="mfp-iframe-scaler"><div class="mfp-close"></div><iframe class="mfp-iframe" src="//about:blank" frameborder="0" allowfullscreen></iframe></div>',srcAction:"iframe_src",patterns:{youtube:{index:"youtube.com",id:"v=",src:"//www.youtube.com/embed/%id%?autoplay=1"},vimeo:{index:"vimeo.com/",id:"/",src:"//player.vimeo.com/video/%id%?autoplay=1"},gmaps:{index:"//maps.google.",src:"%id%&output=embed"}}},proto:{initIframe:function(){t.types.push("iframe"),d("BeforeChange",function(e,t,i){t!==i&&("iframe"===t?T():"iframe"===i&&T(!0))}),d("Close.iframe",function(){T()})},getIframe:function(i,n){var o=i.src,a=t.st.iframe;e.each(a.patterns,function(){if(o.indexOf(this.index)>-1)return this.id&&(o="string"==typeof this.id?o.substr(o.lastIndexOf(this.id)+this.id.length,o.length):this.id.call(this,o)),o=this.src.replace("%id%",o),!1});var r={};return a.srcAction&&(r[a.srcAction]=o),t._parseMarkup(n,r,i),t.updateStatus("ready"),n}}});var _=function(e){var i=t.items.length;return e>i-1?e-i:e<0?i+e:e},P=function(e,t,i){return e.replace(/%curr%/gi,t+1).replace(/%total%/gi,i)};e.magnificPopup.registerModule("gallery",{options:{enabled:!1,arrowMarkup:'<button title="%title%" type="button" class="mfp-arrow mfp-arrow-%dir%"></button>',preload:[0,2],navigateByImgClick:!0,arrows:!0,tPrev:"Previous (Left arrow key)",tNext:"Next (Right arrow key)",tCounter:"%curr% of %total%"},proto:{initGallery:function(){var i=t.st.gallery,o=".mfp-gallery";if(t.direction=!0,!i||!i.enabled)return!1;a+=" mfp-gallery",d("Open"+o,function(){i.navigateByImgClick&&t.wrap.on("click"+o,".mfp-img",function(){if(t.items.length>1)return t.next(),!1}),n.on("keydown"+o,function(e){37===e.keyCode?t.prev():39===e.keyCode&&t.next()})}),d("UpdateStatus"+o,function(e,i){i.text&&(i.text=P(i.text,t.currItem.index,t.items.length))}),d("MarkupParse"+o,function(e,n,o,a){var r=t.items.length;o.counter=r>1?P(i.tCounter,a.index,r):""}),d("BuildControls"+o,function(){if(t.items.length>1&&i.arrows&&!t.arrowLeft){var n=i.arrowMarkup,o=t.arrowLeft=e(n.replace(/%title%/gi,i.tPrev).replace(/%dir%/gi,"left")).addClass("mfp-prevent-close"),a=t.arrowRight=e(n.replace(/%title%/gi,i.tNext).replace(/%dir%/gi,"right")).addClass("mfp-prevent-close");o.click(function(){t.prev()}),a.click(function(){t.next()}),t.container.append(o.add(a))}}),d("Change"+o,function(){t._preloadTimeout&&clearTimeout(t._preloadTimeout),t._preloadTimeout=setTimeout(function(){t.preloadNearbyImages(),t._preloadTimeout=null},16)}),d("Close"+o,function(){n.off(o),t.wrap.off("click"+o),t.arrowRight=t.arrowLeft=null})},next:function(){t.direction=!0,t.index=_(t.index+1),t.updateItemHTML()},prev:function(){t.direction=!1,t.index=_(t.index-1),t.updateItemHTML()},goTo:function(e){t.direction=e>=t.index,t.index=e,t.updateItemHTML()},preloadNearbyImages:function(){var e,i=t.st.gallery.preload,n=Math.min(i[0],t.items.length),o=Math.min(i[1],t.items.length);for(e=1;e<=(t.direction?o:n);e++)t._preloadItem(t.index+e);for(e=1;e<=(t.direction?n:o);e++)t._preloadItem(t.index-e)},_preloadItem:function(i){if(i=_(i),!t.items[i].preloaded){var n=t.items[i];n.parsed||(n=t.parseEl(i)),u("LazyLoad",n),"image"===n.type&&(n.img=e('<img class="mfp-img" />').on("load.mfploader",function(){n.hasSize=!0}).on("error.mfploader",function(){n.hasSize=!0,n.loadError=!0,u("LazyLoadError",n)}).attr("src",n.src).attr("srcset",n.srcset).attr("sizes",n.sizes)),n.preloaded=!0}}}});e.magnificPopup.registerModule("retina",{options:{replaceSrc:function(e){return e.src.replace(/\.\w+$/,function(e){return"@2x"+e})},ratio:1},proto:{initRetina:function(){if(window.devicePixelRatio>1){var e=t.st.retina,i=e.ratio;(i=isNaN(i)?i():i)>1&&(d("ImageHasSize.retina",function(e,t){t.img.css({"max-width":t.img[0].naturalWidth/i,width:"100%"})}),d("ElementParse.retina",function(t,n){n.src=e.replaceSrc(n,i)}))}}}}),m()});

/*!
 * Packery layout mode PACKAGED v2.0.1
 * sub-classes Packery
 */

!function(a,b){"function"==typeof define&&define.amd?define("packery/js/rect",b):"object"==typeof module&&module.exports?module.exports=b():(a.Packery=a.Packery||{},a.Packery.Rect=b())}(window,function(){function a(b){for(var c in a.defaults)this[c]=a.defaults[c];for(c in b)this[c]=b[c]}a.defaults={x:0,y:0,width:0,height:0};var b=a.prototype;return b.contains=function(a){var b=a.width||0,c=a.height||0;return this.x<=a.x&&this.y<=a.y&&this.x+this.width>=a.x+b&&this.y+this.height>=a.y+c},b.overlaps=function(a){var b=this.x+this.width,c=this.y+this.height,d=a.x+a.width,e=a.y+a.height;return this.x<d&&b>a.x&&this.y<e&&c>a.y},b.getMaximalFreeRects=function(b){if(!this.overlaps(b))return!1;var c,d=[],e=this.x+this.width,f=this.y+this.height,g=b.x+b.width,h=b.y+b.height;return this.y<b.y&&(c=new a({x:this.x,y:this.y,width:this.width,height:b.y-this.y}),d.push(c)),e>g&&(c=new a({x:g,y:this.y,width:e-g,height:this.height}),d.push(c)),f>h&&(c=new a({x:this.x,y:h,width:this.width,height:f-h}),d.push(c)),this.x<b.x&&(c=new a({x:this.x,y:this.y,width:b.x-this.x,height:this.height}),d.push(c)),d},b.canFit=function(a){return this.width>=a.width&&this.height>=a.height},a}),function(a,b){if("function"==typeof define&&define.amd)define("packery/js/packer",["./rect"],b);else if("object"==typeof module&&module.exports)module.exports=b(require("./rect"));else{var c=a.Packery=a.Packery||{};c.Packer=b(c.Rect)}}(window,function(a){function b(a,b,c){this.width=a||0,this.height=b||0,this.sortDirection=c||"downwardLeftToRight",this.reset()}var c=b.prototype;c.reset=function(){this.spaces=[];var b=new a({x:0,y:0,width:this.width,height:this.height});this.spaces.push(b),this.sorter=d[this.sortDirection]||d.downwardLeftToRight},c.pack=function(a){for(var b=0;b<this.spaces.length;b++){var c=this.spaces[b];if(c.canFit(a)){this.placeInSpace(a,c);break}}},c.columnPack=function(a){for(var b=0;b<this.spaces.length;b++){var c=this.spaces[b],d=c.x<=a.x&&c.x+c.width>=a.x+a.width&&c.height>=a.height-.01;if(d){a.y=c.y,this.placed(a);break}}},c.rowPack=function(a){for(var b=0;b<this.spaces.length;b++){var c=this.spaces[b],d=c.y<=a.y&&c.y+c.height>=a.y+a.height&&c.width>=a.width-.01;if(d){a.x=c.x,this.placed(a);break}}},c.placeInSpace=function(a,b){a.x=b.x,a.y=b.y,this.placed(a)},c.placed=function(a){for(var b=[],c=0;c<this.spaces.length;c++){var d=this.spaces[c],e=d.getMaximalFreeRects(a);e?b.push.apply(b,e):b.push(d)}this.spaces=b,this.mergeSortSpaces()},c.mergeSortSpaces=function(){b.mergeRects(this.spaces),this.spaces.sort(this.sorter)},c.addSpace=function(a){this.spaces.push(a),this.mergeSortSpaces()},b.mergeRects=function(a){var b=0,c=a[b];a:for(;c;){for(var d=0,e=a[b+d];e;){if(e==c)d++;else{if(e.contains(c)){a.splice(b,1),c=a[b];continue a}c.contains(e)?a.splice(b+d,1):d++}e=a[b+d]}b++,c=a[b]}return a};var d={downwardLeftToRight:function(a,b){return a.y-b.y||a.x-b.x},rightwardTopToBottom:function(a,b){return a.x-b.x||a.y-b.y}};return b}),function(a,b){"function"==typeof define&&define.amd?define("packery/js/item",["outlayer/outlayer","./rect"],b):"object"==typeof module&&module.exports?module.exports=b(require("outlayer"),require("./rect")):a.Packery.Item=b(a.Outlayer,a.Packery.Rect)}(window,function(a,b){var c=document.documentElement.style,d="string"==typeof c.transform?"transform":"WebkitTransform",e=function(){a.Item.apply(this,arguments)},f=e.prototype=Object.create(a.Item.prototype),g=f._create;f._create=function(){g.call(this),this.rect=new b};var h=f.moveTo;return f.moveTo=function(a,b){var c=Math.abs(this.position.x-a),d=Math.abs(this.position.y-b),e=this.layout.dragItemCount&&!this.isPlacing&&!this.isTransitioning&&1>c&&1>d;return e?void this.goTo(a,b):void h.apply(this,arguments)},f.enablePlacing=function(){this.removeTransitionStyles(),this.isTransitioning&&d&&(this.element.style[d]="none"),this.isTransitioning=!1,this.getSize(),this.layout._setRectSize(this.element,this.rect),this.isPlacing=!0},f.disablePlacing=function(){this.isPlacing=!1},f.removeElem=function(){this.element.parentNode.removeChild(this.element),this.layout.packer.addSpace(this.rect),this.emitEvent("remove",[this])},f.showDropPlaceholder=function(){var a=this.dropPlaceholder;a||(a=this.dropPlaceholder=document.createElement("div"),a.className="packery-drop-placeholder",a.style.position="absolute"),a.style.width=this.size.width+"px",a.style.height=this.size.height+"px",this.positionDropPlaceholder(),this.layout.element.appendChild(a)},f.positionDropPlaceholder=function(){this.dropPlaceholder.style[d]="translate("+this.rect.x+"px, "+this.rect.y+"px)"},f.hideDropPlaceholder=function(){this.layout.element.removeChild(this.dropPlaceholder)},e}),function(a,b){"function"==typeof define&&define.amd?define("packery/js/packery",["get-size/get-size","outlayer/outlayer","./rect","./packer","./item"],b):"object"==typeof module&&module.exports?module.exports=b(require("get-size"),require("outlayer"),require("./rect"),require("./packer"),require("./item")):a.Packery=b(a.getSize,a.Outlayer,a.Packery.Rect,a.Packery.Packer,a.Packery.Item)}(window,function(a,b,c,d,e){function f(a,b){return a.position.y-b.position.y||a.position.x-b.position.x}function g(a,b){return a.position.x-b.position.x||a.position.y-b.position.y}function h(a,b){var c=b.x-a.x,d=b.y-a.y;return Math.sqrt(c*c+d*d)}c.prototype.canFit=function(a){return this.width>=a.width-1&&this.height>=a.height-1};var i=b.create("packery");i.Item=e;var j=i.prototype;j._create=function(){b.prototype._create.call(this),this.packer=new d,this.shiftPacker=new d,this.isEnabled=!0,this.dragItemCount=0;var a=this;this.handleDraggabilly={dragStart:function(){a.itemDragStart(this.element)},dragMove:function(){a.itemDragMove(this.element,this.position.x,this.position.y)},dragEnd:function(){a.itemDragEnd(this.element)}},this.handleUIDraggable={start:function(b,c){c&&a.itemDragStart(b.currentTarget)},drag:function(b,c){c&&a.itemDragMove(b.currentTarget,c.position.left,c.position.top)},stop:function(b,c){c&&a.itemDragEnd(b.currentTarget)}}},j._resetLayout=function(){this.getSize(),this._getMeasurements();var a,b,c;this._getOption("horizontal")?(a=1/0,b=this.size.innerHeight+this.gutter,c="rightwardTopToBottom"):(a=this.size.innerWidth+this.gutter,b=1/0,c="downwardLeftToRight"),this.packer.width=this.shiftPacker.width=a,this.packer.height=this.shiftPacker.height=b,this.packer.sortDirection=this.shiftPacker.sortDirection=c,this.packer.reset(),this.maxY=0,this.maxX=0},j._getMeasurements=function(){this._getMeasurement("columnWidth","width"),this._getMeasurement("rowHeight","height"),this._getMeasurement("gutter","width")},j._getItemLayoutPosition=function(a){if(this._setRectSize(a.element,a.rect),this.isShifting||this.dragItemCount>0){var b=this._getPackMethod();this.packer[b](a.rect)}else this.packer.pack(a.rect);return this._setMaxXY(a.rect),a.rect},j.shiftLayout=function(){this.isShifting=!0,this.layout(),delete this.isShifting},j._getPackMethod=function(){return this._getOption("horizontal")?"rowPack":"columnPack"},j._setMaxXY=function(a){this.maxX=Math.max(a.x+a.width,this.maxX),this.maxY=Math.max(a.y+a.height,this.maxY)},j._setRectSize=function(b,c){var d=a(b),e=d.outerWidth,f=d.outerHeight;(e||f)&&(e=this._applyGridGutter(e,this.columnWidth),f=this._applyGridGutter(f,this.rowHeight)),c.width=Math.min(e,this.packer.width),c.height=Math.min(f,this.packer.height)},j._applyGridGutter=function(a,b){if(!b)return a+this.gutter;b+=this.gutter;var c=a%b,d=c&&1>c?"round":"ceil";return a=Math[d](a/b)*b},j._getContainerSize=function(){return this._getOption("horizontal")?{width:this.maxX-this.gutter}:{height:this.maxY-this.gutter}},j._manageStamp=function(a){var b,d=this.getItem(a);if(d&&d.isPlacing)b=d.rect;else{var e=this._getElementOffset(a);b=new c({x:this._getOption("originLeft")?e.left:e.right,y:this._getOption("originTop")?e.top:e.bottom})}this._setRectSize(a,b),this.packer.placed(b),this._setMaxXY(b)},j.sortItemsByPosition=function(){var a=this._getOption("horizontal")?g:f;this.items.sort(a)},j.fit=function(a,b,c){var d=this.getItem(a);d&&(this.stamp(d.element),d.enablePlacing(),this.updateShiftTargets(d),b=void 0===b?d.rect.x:b,c=void 0===c?d.rect.y:c,this.shift(d,b,c),this._bindFitEvents(d),d.moveTo(d.rect.x,d.rect.y),this.shiftLayout(),this.unstamp(d.element),this.sortItemsByPosition(),d.disablePlacing())},j._bindFitEvents=function(a){function b(){d++,2==d&&c.dispatchEvent("fitComplete",null,[a])}var c=this,d=0;a.once("layout",b),this.once("layoutComplete",b)},j.resize=function(){this.isResizeBound&&this.needsResizeLayout()&&(this.options.shiftPercentResize?this.resizeShiftPercentLayout():this.layout())},j.needsResizeLayout=function(){var b=a(this.element),c=this._getOption("horizontal")?"innerHeight":"innerWidth";return b[c]!=this.size[c]},j.resizeShiftPercentLayout=function(){var b=this._getItemsForLayout(this.items),c=this._getOption("horizontal"),d=c?"y":"x",e=c?"height":"width",f=c?"rowHeight":"columnWidth",g=c?"innerHeight":"innerWidth",h=this[f];if(h=h&&h+this.gutter){this._getMeasurements();var i=this[f]+this.gutter;b.forEach(function(a){var b=Math.round(a.rect[d]/h);a.rect[d]=b*i})}else{var j=a(this.element)[g]+this.gutter,k=this.packer[e];b.forEach(function(a){a.rect[d]=a.rect[d]/k*j})}this.shiftLayout()},j.itemDragStart=function(a){if(this.isEnabled){this.stamp(a);var b=this.getItem(a);b&&(b.enablePlacing(),b.showDropPlaceholder(),this.dragItemCount++,this.updateShiftTargets(b))}},j.updateShiftTargets=function(a){this.shiftPacker.reset(),this._getBoundingRect();var b=this._getOption("originLeft"),d=this._getOption("originTop");this.stamps.forEach(function(a){var e=this.getItem(a);if(!e||!e.isPlacing){var f=this._getElementOffset(a),g=new c({x:b?f.left:f.right,y:d?f.top:f.bottom});this._setRectSize(a,g),this.shiftPacker.placed(g)}},this);var e=this._getOption("horizontal"),f=e?"rowHeight":"columnWidth",g=e?"height":"width";this.shiftTargetKeys=[],this.shiftTargets=[];var h,i=this[f];if(i=i&&i+this.gutter){var j=Math.ceil(a.rect[g]/i),k=Math.floor((this.shiftPacker[g]+this.gutter)/i);h=(k-j)*i;for(var l=0;k>l;l++)this._addShiftTarget(l*i,0,h)}else h=this.shiftPacker[g]+this.gutter-a.rect[g],this._addShiftTarget(0,0,h);var m=this._getItemsForLayout(this.items),n=this._getPackMethod();m.forEach(function(a){var b=a.rect;this._setRectSize(a.element,b),this.shiftPacker[n](b),this._addShiftTarget(b.x,b.y,h);var c=e?b.x+b.width:b.x,d=e?b.y:b.y+b.height;if(this._addShiftTarget(c,d,h),i)for(var f=Math.round(b[g]/i),j=1;f>j;j++){var k=e?c:b.x+i*j,l=e?b.y+i*j:d;this._addShiftTarget(k,l,h)}},this)},j._addShiftTarget=function(a,b,c){var d=this._getOption("horizontal")?b:a;if(!(0!==d&&d>c)){var e=a+","+b,f=-1!=this.shiftTargetKeys.indexOf(e);f||(this.shiftTargetKeys.push(e),this.shiftTargets.push({x:a,y:b}))}},j.shift=function(a,b,c){var d,e=1/0,f={x:b,y:c};this.shiftTargets.forEach(function(a){var b=h(a,f);e>b&&(d=a,e=b)}),a.rect.x=d.x,a.rect.y=d.y};var k=120;j.itemDragMove=function(a,b,c){function d(){f.shift(e,b,c),e.positionDropPlaceholder(),f.layout()}var e=this.isEnabled&&this.getItem(a);if(e){b-=this.size.paddingLeft,c-=this.size.paddingTop;var f=this,g=new Date;this._itemDragTime&&g-this._itemDragTime<k?(clearTimeout(this.dragTimeout),this.dragTimeout=setTimeout(d,k)):(d(),this._itemDragTime=g)}},j.itemDragEnd=function(a){function b(){d++,2==d&&(c.element.classList.remove("is-positioning-post-drag"),c.hideDropPlaceholder(),e.dispatchEvent("dragItemPositioned",null,[c]))}var c=this.isEnabled&&this.getItem(a);if(c){clearTimeout(this.dragTimeout),c.element.classList.add("is-positioning-post-drag");var d=0,e=this;c.once("layout",b),this.once("layoutComplete",b),c.moveTo(c.rect.x,c.rect.y),this.layout(),this.dragItemCount=Math.max(0,this.dragItemCount-1),this.sortItemsByPosition(),c.disablePlacing(),this.unstamp(c.element)}},j.bindDraggabillyEvents=function(a){this._bindDraggabillyEvents(a,"on")},j.unbindDraggabillyEvents=function(a){this._bindDraggabillyEvents(a,"off")},j._bindDraggabillyEvents=function(a,b){var c=this.handleDraggabilly;a[b]("dragStart",c.dragStart),a[b]("dragMove",c.dragMove),a[b]("dragEnd",c.dragEnd)},j.bindUIDraggableEvents=function(a){this._bindUIDraggableEvents(a,"on")},j.unbindUIDraggableEvents=function(a){this._bindUIDraggableEvents(a,"off")},j._bindUIDraggableEvents=function(a,b){var c=this.handleUIDraggable;a[b]("dragstart",c.start)[b]("drag",c.drag)[b]("dragstop",c.stop)};var l=j.destroy;return j.destroy=function(){l.apply(this,arguments),this.isEnabled=!1},i.Rect=c,i.Packer=d,i}),function(a,b){"function"==typeof define&&define.amd?define(["isotope-layout/js/layout-mode","packery/js/packery"],b):"object"==typeof module&&module.exports?module.exports=b(require("isotope-layout/js/layout-mode"),require("packery")):b(a.Isotope.LayoutMode,a.Packery)}(window,function(a,b){var c=a.create("packery"),d=c.prototype,e={_getElementOffset:!0,_getMeasurement:!0};for(var f in b.prototype)e[f]||(d[f]=b.prototype[f]);var g=d._resetLayout;d._resetLayout=function(){this.packer=this.packer||new b.Packer,this.shiftPacker=this.shiftPacker||new b.Packer,g.apply(this,arguments)};var h=d._getItemLayoutPosition;d._getItemLayoutPosition=function(a){return a.rect=a.rect||new b.Rect,h.call(this,a)};var i=d.needsResizeLayout;d.needsResizeLayout=function(){return this._getOption("horizontal")?this.needsVerticalResizeLayout():i.call(this)};var j=d._getOption;return d._getOption=function(a){return"horizontal"==a?void 0!==this.options.isHorizontal?this.options.isHorizontal:this.options.horizontal:j.apply(this.isotope,arguments)},c});

/*!
 * simpleParallax.min - simpleParallax is a simple JavaScript library that gives your website parallax animations on any images or videos, 
 * @date: 09-06-2020 12:9:37, 
 * @version: 5.5.1,
 * @link: https://simpleparallax.com/
 */
!function(t,e){"object"==typeof exports&&"object"==typeof module?module.exports=e():"function"==typeof define&&define.amd?define("simpleParallax",[],e):"object"==typeof exports?exports.simpleParallax=e():t.simpleParallax=e()}(window,(function(){return function(t){var e={};function n(i){if(e[i])return e[i].exports;var o=e[i]={i:i,l:!1,exports:{}};return t[i].call(o.exports,o,o.exports,n),o.l=!0,o.exports}return n.m=t,n.c=e,n.d=function(t,e,i){n.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:i})},n.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},n.t=function(t,e){if(1&e&&(t=n(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var i=Object.create(null);if(n.r(i),Object.defineProperty(i,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var o in t)n.d(i,o,function(e){return t[e]}.bind(null,o));return i},n.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return n.d(e,"a",e),e},n.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},n.p="",n(n.s=0)}([function(t,e,n){"use strict";n.r(e),n.d(e,"default",(function(){return x}));var i=function(){return Element.prototype.closest&&"IntersectionObserver"in window};function o(t,e){for(var n=0;n<e.length;n++){var i=e[n];i.enumerable=i.enumerable||!1,i.configurable=!0,"value"in i&&(i.writable=!0),Object.defineProperty(t,i.key,i)}}var s=new(function(){function t(){!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),this.positions={top:0,bottom:0,height:0}}var e,n,i;return e=t,(n=[{key:"setViewportTop",value:function(t){return this.positions.top=t?t.scrollTop:window.pageYOffset,this.positions}},{key:"setViewportBottom",value:function(){return this.positions.bottom=this.positions.top+this.positions.height,this.positions}},{key:"setViewportAll",value:function(t){return this.positions.top=t?t.scrollTop:window.pageYOffset,this.positions.height=t?t.clientHeight:document.documentElement.clientHeight,this.positions.bottom=this.positions.top+this.positions.height,this.positions}}])&&o(e.prototype,n),i&&o(e,i),t}()),r=function(t){return NodeList.prototype.isPrototypeOf(t)||HTMLCollection.prototype.isPrototypeOf(t)?Array.from(t):"string"==typeof t||t instanceof String?document.querySelectorAll(t):[t]},a=function(){for(var t,e="transform webkitTransform mozTransform oTransform msTransform".split(" "),n=0;void 0===t;)t=void 0!==document.createElement("div").style[e[n]]?e[n]:void 0,n+=1;return t}(),l=function(t){return"video"===t.tagName.toLowerCase()||!!t&&(!!t.complete&&(void 0===t.naturalWidth||0!==t.naturalWidth))};function u(t){return function(t){if(Array.isArray(t))return c(t)}(t)||function(t){if("undefined"!=typeof Symbol&&Symbol.iterator in Object(t))return Array.from(t)}(t)||function(t,e){if(!t)return;if("string"==typeof t)return c(t,e);var n=Object.prototype.toString.call(t).slice(8,-1);"Object"===n&&t.constructor&&(n=t.constructor.name);if("Map"===n||"Set"===n)return Array.from(t);if("Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))return c(t,e)}(t)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function c(t,e){(null==e||e>t.length)&&(e=t.length);for(var n=0,i=new Array(e);n<e;n++)i[n]=t[n];return i}function h(t,e){for(var n=0;n<e.length;n++){var i=e[n];i.enumerable=i.enumerable||!1,i.configurable=!0,"value"in i&&(i.writable=!0),Object.defineProperty(t,i.key,i)}}var f=function(){function t(e,n){var i=this;!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),this.element=e,this.elementContainer=e,this.settings=n,this.isVisible=!0,this.isInit=!1,this.oldTranslateValue=-1,this.init=this.init.bind(this),l(e)?this.init():this.element.addEventListener("load",(function(){setTimeout((function(){i.init(!0)}),50)}))}var e,n,i;return e=t,(n=[{key:"init",value:function(t){var e=this;this.isInit||(t&&(this.rangeMax=null),this.element.closest(".simpleParallax")||(!1===this.settings.overflow&&this.wrapElement(this.element),this.setTransformCSS(),this.getElementOffset(),this.intersectionObserver(),this.getTranslateValue(),this.animate(),this.settings.delay>0&&setTimeout((function(){e.setTransitionCSS()}),10),this.isInit=!0))}},{key:"wrapElement",value:function(){var t=this.settings.customWrapper&&this.element.closest(this.settings.customWrapper),e=this.element.closest("picture")||this.element,n=document.createElement("div");t&&(n=this.element.closest(this.settings.customWrapper)),n.classList.add("simpleParallax"),n.style.overflow="hidden",t||(e.parentNode.insertBefore(n,e),n.appendChild(e)),this.elementContainer=n}},{key:"unWrapElement",value:function(){var t=this.elementContainer;this.settings.customWrapper&&this.element.closest(this.settings.customWrapper)?(t.classList.remove("simpleParallax"),t.style.overflow=""):t.replaceWith.apply(t,u(t.childNodes))}},{key:"setTransformCSS",value:function(){!1===this.settings.overflow&&(this.element.style[a]="scale(".concat(this.settings.scale,")")),this.element.style.willChange="transform"}},{key:"setTransitionCSS",value:function(){this.element.style.transition="transform ".concat(this.settings.delay,"s ").concat(this.settings.transition)}},{key:"unSetStyle",value:function(){this.element.style.willChange="",this.element.style[a]="",this.element.style.transition=""}},{key:"getElementOffset",value:function(){var t=this.elementContainer.getBoundingClientRect();if(this.elementHeight=t.height,this.elementTop=t.top+s.positions.top,this.settings.customContainer){var e=this.settings.customContainer.getBoundingClientRect();this.elementTop=t.top-e.top+s.positions.top}this.elementBottom=this.elementHeight+this.elementTop}},{key:"buildThresholdList",value:function(){for(var t=[],e=1;e<=this.elementHeight;e++){var n=e/this.elementHeight;t.push(n)}return t}},{key:"intersectionObserver",value:function(){var t={root:null,threshold:this.buildThresholdList()};this.observer=new IntersectionObserver(this.intersectionObserverCallback.bind(this),t),this.observer.observe(this.element)}},{key:"intersectionObserverCallback",value:function(t){var e=this;t.forEach((function(t){t.isIntersecting?e.isVisible=!0:e.isVisible=!1}))}},{key:"checkIfVisible",value:function(){return this.elementBottom>s.positions.top&&this.elementTop<s.positions.bottom}},{key:"getRangeMax",value:function(){var t=this.element.clientHeight;this.rangeMax=t*this.settings.scale-t}},{key:"getTranslateValue",value:function(){var t=((s.positions.bottom-this.elementTop)/((s.positions.height+this.elementHeight)/100)).toFixed(1);return t=Math.min(100,Math.max(0,t)),0!==this.settings.maxTransition&&t>this.settings.maxTransition&&(t=this.settings.maxTransition),this.oldPercentage!==t&&(this.rangeMax||this.getRangeMax(),this.translateValue=(t/100*this.rangeMax-this.rangeMax/2).toFixed(0),this.oldTranslateValue!==this.translateValue&&(this.oldPercentage=t,this.oldTranslateValue=this.translateValue,!0))}},{key:"animate",value:function(){var t,e=0,n=0;(this.settings.orientation.includes("left")||this.settings.orientation.includes("right"))&&(n="".concat(this.settings.orientation.includes("left")?-1*this.translateValue:this.translateValue,"px")),(this.settings.orientation.includes("up")||this.settings.orientation.includes("down"))&&(e="".concat(this.settings.orientation.includes("up")?-1*this.translateValue:this.translateValue,"px")),t=!1===this.settings.overflow?"translate3d(".concat(n,", ").concat(e,", 0) scale(").concat(this.settings.scale,")"):"translate3d(".concat(n,", ").concat(e,", 0)"),this.element.style[a]=t}}])&&h(e.prototype,n),i&&h(e,i),t}();function m(t){return function(t){if(Array.isArray(t))return y(t)}(t)||function(t){if("undefined"!=typeof Symbol&&Symbol.iterator in Object(t))return Array.from(t)}(t)||d(t)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function p(t,e){return function(t){if(Array.isArray(t))return t}(t)||function(t,e){if("undefined"==typeof Symbol||!(Symbol.iterator in Object(t)))return;var n=[],i=!0,o=!1,s=void 0;try{for(var r,a=t[Symbol.iterator]();!(i=(r=a.next()).done)&&(n.push(r.value),!e||n.length!==e);i=!0);}catch(t){o=!0,s=t}finally{try{i||null==a.return||a.return()}finally{if(o)throw s}}return n}(t,e)||d(t,e)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function d(t,e){if(t){if("string"==typeof t)return y(t,e);var n=Object.prototype.toString.call(t).slice(8,-1);return"Object"===n&&t.constructor&&(n=t.constructor.name),"Map"===n||"Set"===n?Array.from(t):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?y(t,e):void 0}}function y(t,e){(null==e||e>t.length)&&(e=t.length);for(var n=0,i=new Array(e);n<e;n++)i[n]=t[n];return i}function v(t,e){for(var n=0;n<e.length;n++){var i=e[n];i.enumerable=i.enumerable||!1,i.configurable=!0,"value"in i&&(i.writable=!0),Object.defineProperty(t,i.key,i)}}var g,b,w=!1,T=[],x=function(){function t(e,n){if(function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),e&&i()){if(this.elements=r(e),this.defaults={delay:0,orientation:"up",scale:1.3,overflow:!1,transition:"cubic-bezier(0,0,0,1)",customContainer:!1,customWrapper:!1,maxTransition:0},this.settings=Object.assign(this.defaults,n),this.settings.customContainer){var o=p(r(this.settings.customContainer),1);this.customContainer=o[0]}this.lastPosition=-1,this.resizeIsDone=this.resizeIsDone.bind(this),this.refresh=this.refresh.bind(this),this.proceedRequestAnimationFrame=this.proceedRequestAnimationFrame.bind(this),this.init()}}var e,n,o;return e=t,(n=[{key:"init",value:function(){var t=this;s.setViewportAll(this.customContainer),T=[].concat(m(this.elements.map((function(e){return new f(e,t.settings)}))),m(T)),w||(this.proceedRequestAnimationFrame(),window.addEventListener("resize",this.resizeIsDone),w=!0)}},{key:"resizeIsDone",value:function(){clearTimeout(b),b=setTimeout(this.refresh,200)}},{key:"proceedRequestAnimationFrame",value:function(){var t=this;s.setViewportTop(this.customContainer),this.lastPosition!==s.positions.top?(s.setViewportBottom(),T.forEach((function(e){t.proceedElement(e)})),g=window.requestAnimationFrame(this.proceedRequestAnimationFrame),this.lastPosition=s.positions.top):g=window.requestAnimationFrame(this.proceedRequestAnimationFrame)}},{key:"proceedElement",value:function(t){(this.customContainer?t.checkIfVisible():t.isVisible)&&t.getTranslateValue()&&t.animate()}},{key:"refresh",value:function(){s.setViewportAll(this.customContainer),T.forEach((function(t){t.getElementOffset(),t.getRangeMax()})),this.lastPosition=-1}},{key:"destroy",value:function(){var t=this,e=[];T=T.filter((function(n){return t.elements.includes(n.element)?(e.push(n),!1):n})),e.forEach((function(e){e.unSetStyle(),!1===t.settings.overflow&&e.unWrapElement()})),T.length||(window.cancelAnimationFrame(g),window.removeEventListener("resize",this.refresh))}}])&&v(e.prototype,n),o&&v(e,o),t}()}]).default}));

/**!
 * easy-pie-chart
 * Lightweight plugin to render simple, animated and retina optimized pie charts
 *
 * @license
 * @author Robert Fleischmann <rendro87@gmail.com> (http://robert-fleischmann.de)
 * @version 2.1.7
 **/
!function(a,b){"function"==typeof define&&define.amd?define(["jquery"],function(a){return b(a)}):"object"==typeof exports?module.exports=b(require("jquery")):b(jQuery)}(this,function(a){var b=function(a,b){var c,d=document.createElement("canvas");a.appendChild(d),"object"==typeof G_vmlCanvasManager&&G_vmlCanvasManager.initElement(d);var e=d.getContext("2d");d.width=d.height=b.size;var f=1;window.devicePixelRatio>1&&(f=window.devicePixelRatio,d.style.width=d.style.height=[b.size,"px"].join(""),d.width=d.height=b.size*f,e.scale(f,f)),e.translate(b.size/2,b.size/2),e.rotate((-0.5+b.rotate/180)*Math.PI);var g=(b.size-b.lineWidth)/2;b.scaleColor&&b.scaleLength&&(g-=b.scaleLength+2),Date.now=Date.now||function(){return+new Date};var h=function(a,b,c){c=Math.min(Math.max(-1,c||0),1);var d=0>=c?!0:!1;e.beginPath(),e.arc(0,0,g,0,2*Math.PI*c,d),e.strokeStyle=a,e.lineWidth=b,e.stroke()},i=function(){var a,c;e.lineWidth=1,e.fillStyle=b.scaleColor,e.save();for(var d=24;d>0;--d)d%6===0?(c=b.scaleLength,a=0):(c=.6*b.scaleLength,a=b.scaleLength-c),e.fillRect(-b.size/2+a,0,c,1),e.rotate(Math.PI/12);e.restore()},j=function(){return window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||function(a){window.setTimeout(a,1e3/60)}}(),k=function(){b.scaleColor&&i(),b.trackColor&&h(b.trackColor,b.trackWidth||b.lineWidth,1)};this.getCanvas=function(){return d},this.getCtx=function(){return e},this.clear=function(){e.clearRect(b.size/-2,b.size/-2,b.size,b.size)},this.draw=function(a){b.scaleColor||b.trackColor?e.getImageData&&e.putImageData?c?e.putImageData(c,0,0):(k(),c=e.getImageData(0,0,b.size*f,b.size*f)):(this.clear(),k()):this.clear(),e.lineCap=b.lineCap;var d;d="function"==typeof b.barColor?b.barColor(a):b.barColor,h(d,b.lineWidth,a/100)}.bind(this),this.animate=function(a,c){var d=Date.now();b.onStart(a,c);var e=function(){var f=Math.min(Date.now()-d,b.animate.duration),g=b.easing(this,f,a,c-a,b.animate.duration);this.draw(g),b.onStep(a,c,g),f>=b.animate.duration?b.onStop(a,c):j(e)}.bind(this);j(e)}.bind(this)},c=function(a,c){var d={barColor:"#ef1e25",trackColor:"#f9f9f9",scaleColor:"#dfe0e0",scaleLength:5,lineCap:"round",lineWidth:3,trackWidth:void 0,size:110,rotate:0,animate:{duration:1e3,enabled:!0},easing:function(a,b,c,d,e){return b/=e/2,1>b?d/2*b*b+c:-d/2*(--b*(b-2)-1)+c},onStart:function(a,b){},onStep:function(a,b,c){},onStop:function(a,b){}};if("undefined"!=typeof b)d.renderer=b;else{if("undefined"==typeof SVGRenderer)throw new Error("Please load either the SVG- or the CanvasRenderer");d.renderer=SVGRenderer}var e={},f=0,g=function(){this.el=a,this.options=e;for(var b in d)d.hasOwnProperty(b)&&(e[b]=c&&"undefined"!=typeof c[b]?c[b]:d[b],"function"==typeof e[b]&&(e[b]=e[b].bind(this)));"string"==typeof e.easing&&"undefined"!=typeof jQuery&&jQuery.isFunction(jQuery.easing[e.easing])?e.easing=jQuery.easing[e.easing]:e.easing=d.easing,"number"==typeof e.animate&&(e.animate={duration:e.animate,enabled:!0}),"boolean"!=typeof e.animate||e.animate||(e.animate={duration:1e3,enabled:e.animate}),this.renderer=new e.renderer(a,e),this.renderer.draw(f),a.dataset&&a.dataset.percent?this.update(parseFloat(a.dataset.percent)):a.getAttribute&&a.getAttribute("data-percent")&&this.update(parseFloat(a.getAttribute("data-percent")))}.bind(this);this.update=function(a){return a=parseFloat(a),e.animate.enabled?this.renderer.animate(f,a):this.renderer.draw(a),f=a,this}.bind(this),this.disableAnimation=function(){return e.animate.enabled=!1,this},this.enableAnimation=function(){return e.animate.enabled=!0,this},g()};a.fn.easyPieChart=function(b){return this.each(function(){var d;a.data(this,"easyPieChart")||(d=a.extend({},b,a(this).data()),a.data(this,"easyPieChart",new c(this,d)))})}});

// PrismJS 1.29.0
var _self="undefined"!=typeof window?window:"undefined"!=typeof WorkerGlobalScope&&self instanceof WorkerGlobalScope?self:{},Prism=function(l){var n=/(?:^|\s)lang(?:uage)?-([\w-]+)(?=\s|$)/i,t=0,e={},j={manual:l.Prism&&l.Prism.manual,disableWorkerMessageHandler:l.Prism&&l.Prism.disableWorkerMessageHandler,util:{encode:function e(t){return t instanceof C?new C(t.type,e(t.content),t.alias):Array.isArray(t)?t.map(e):t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/\u00a0/g," ")},type:function(e){return Object.prototype.toString.call(e).slice(8,-1)},objId:function(e){return e.__id||Object.defineProperty(e,"__id",{value:++t}),e.__id},clone:function n(e,a){var r,t;switch(a=a||{},j.util.type(e)){case"Object":if(t=j.util.objId(e),a[t])return a[t];for(var s in r={},a[t]=r,e)e.hasOwnProperty(s)&&(r[s]=n(e[s],a));return r;case"Array":return(t=j.util.objId(e),a[t])?a[t]:(r=[],a[t]=r,e.forEach(function(e,t){r[t]=n(e,a)}),r);default:return e}},getLanguage:function(e){for(;e;){var t=n.exec(e.className);if(t)return t[1].toLowerCase();e=e.parentElement}return"none"},setLanguage:function(e,t){e.className=e.className.replace(RegExp(n,"gi"),""),e.classList.add("language-"+t)},currentScript:function(){if("undefined"==typeof document)return null;if("currentScript"in document)return document.currentScript;try{throw new Error}catch(e){var t=(/at [^(\r\n]*\((.*):[^:]+:[^:]+\)$/i.exec(e.stack)||[])[1];if(t){var n,a=document.getElementsByTagName("script");for(n in a)if(a[n].src==t)return a[n]}return null}},isActive:function(e,t,n){for(var a="no-"+t;e;){var r=e.classList;if(r.contains(t))return!0;if(r.contains(a))return!1;e=e.parentElement}return!!n}},languages:{plain:e,plaintext:e,text:e,txt:e,extend:function(e,t){var n,a=j.util.clone(j.languages[e]);for(n in t)a[n]=t[n];return a},insertBefore:function(n,e,t,a){var r,s=(a=a||j.languages)[n],i={};for(r in s)if(s.hasOwnProperty(r)){if(r==e)for(var o in t)t.hasOwnProperty(o)&&(i[o]=t[o]);t.hasOwnProperty(r)||(i[r]=s[r])}var l=a[n];return a[n]=i,j.languages.DFS(j.languages,function(e,t){t===l&&e!=n&&(this[e]=i)}),i},DFS:function e(t,n,a,r){r=r||{};var s,i,o,l=j.util.objId;for(s in t)t.hasOwnProperty(s)&&(n.call(t,s,t[s],a||s),i=t[s],"Object"!==(o=j.util.type(i))||r[l(i)]?"Array"!==o||r[l(i)]||(r[l(i)]=!0,e(i,n,s,r)):(r[l(i)]=!0,e(i,n,null,r)))}},plugins:{},highlightAll:function(e,t){j.highlightAllUnder(document,e,t)},highlightAllUnder:function(e,t,n){var a={callback:n,container:e,selector:'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'};j.hooks.run("before-highlightall",a),a.elements=Array.prototype.slice.apply(a.container.querySelectorAll(a.selector)),j.hooks.run("before-all-elements-highlight",a);for(var r,s=0;r=a.elements[s++];)j.highlightElement(r,!0===t,a.callback)},highlightElement:function(e,t,n){var a=j.util.getLanguage(e),r=j.languages[a],s=(j.util.setLanguage(e,a),e.parentElement);s&&"pre"===s.nodeName.toLowerCase()&&j.util.setLanguage(s,a);var i={element:e,language:a,grammar:r,code:e.textContent};function o(e){i.highlightedCode=e,j.hooks.run("before-insert",i),i.element.innerHTML=i.highlightedCode,j.hooks.run("after-highlight",i),j.hooks.run("complete",i),n&&n.call(i.element)}if(j.hooks.run("before-sanity-check",i),(s=i.element.parentElement)&&"pre"===s.nodeName.toLowerCase()&&!s.hasAttribute("tabindex")&&s.setAttribute("tabindex","0"),!i.code)return j.hooks.run("complete",i),void(n&&n.call(i.element));j.hooks.run("before-highlight",i),i.grammar?t&&l.Worker?((a=new Worker(j.filename)).onmessage=function(e){o(e.data)},a.postMessage(JSON.stringify({language:i.language,code:i.code,immediateClose:!0}))):o(j.highlight(i.code,i.grammar,i.language)):o(j.util.encode(i.code))},highlight:function(e,t,n){e={code:e,grammar:t,language:n};if(j.hooks.run("before-tokenize",e),e.grammar)return e.tokens=j.tokenize(e.code,e.grammar),j.hooks.run("after-tokenize",e),C.stringify(j.util.encode(e.tokens),e.language);throw new Error('The language "'+e.language+'" has no grammar.')},tokenize:function(e,t){var n=t.rest;if(n){for(var a in n)t[a]=n[a];delete t.rest}for(var r=new u,s=(z(r,r.head,e),!function e(t,n,a,r,s,i){for(var o in a)if(a.hasOwnProperty(o)&&a[o]){var l=a[o];l=Array.isArray(l)?l:[l];for(var u=0;u<l.length;++u){if(i&&i.cause==o+","+u)return;for(var g,c=l[u],d=c.inside,p=!!c.lookbehind,m=!!c.greedy,h=c.alias,f=(m&&!c.pattern.global&&(g=c.pattern.toString().match(/[imsuy]*$/)[0],c.pattern=RegExp(c.pattern.source,g+"g")),c.pattern||c),b=r.next,y=s;b!==n.tail&&!(i&&y>=i.reach);y+=b.value.length,b=b.next){var v=b.value;if(n.length>t.length)return;if(!(v instanceof C)){var F,x=1;if(m){if(!(F=L(f,y,t,p))||F.index>=t.length)break;var k=F.index,w=F.index+F[0].length,A=y;for(A+=b.value.length;A<=k;)b=b.next,A+=b.value.length;if(A-=b.value.length,y=A,b.value instanceof C)continue;for(var P=b;P!==n.tail&&(A<w||"string"==typeof P.value);P=P.next)x++,A+=P.value.length;x--,v=t.slice(y,A),F.index-=y}else if(!(F=L(f,0,v,p)))continue;var k=F.index,$=F[0],S=v.slice(0,k),E=v.slice(k+$.length),v=y+v.length,_=(i&&v>i.reach&&(i.reach=v),b.prev),S=(S&&(_=z(n,_,S),y+=S.length),O(n,_,x),new C(o,d?j.tokenize($,d):$,h,$));b=z(n,_,S),E&&z(n,b,E),1<x&&($={cause:o+","+u,reach:v},e(t,n,a,b.prev,y,$),i&&$.reach>i.reach&&(i.reach=$.reach))}}}}}(e,r,t,r.head,0),r),i=[],o=s.head.next;o!==s.tail;)i.push(o.value),o=o.next;return i},hooks:{all:{},add:function(e,t){var n=j.hooks.all;n[e]=n[e]||[],n[e].push(t)},run:function(e,t){var n=j.hooks.all[e];if(n&&n.length)for(var a,r=0;a=n[r++];)a(t)}},Token:C};function C(e,t,n,a){this.type=e,this.content=t,this.alias=n,this.length=0|(a||"").length}function L(e,t,n,a){e.lastIndex=t;t=e.exec(n);return t&&a&&t[1]&&(e=t[1].length,t.index+=e,t[0]=t[0].slice(e)),t}function u(){var e={value:null,prev:null,next:null},t={value:null,prev:e,next:null};e.next=t,this.head=e,this.tail=t,this.length=0}function z(e,t,n){var a=t.next,n={value:n,prev:t,next:a};return t.next=n,a.prev=n,e.length++,n}function O(e,t,n){for(var a=t.next,r=0;r<n&&a!==e.tail;r++)a=a.next;(t.next=a).prev=t,e.length-=r}if(l.Prism=j,C.stringify=function t(e,n){if("string"==typeof e)return e;var a;if(Array.isArray(e))return a="",e.forEach(function(e){a+=t(e,n)}),a;var r,s={type:e.type,content:t(e.content,n),tag:"span",classes:["token",e.type],attributes:{},language:n},e=e.alias,i=(e&&(Array.isArray(e)?Array.prototype.push.apply(s.classes,e):s.classes.push(e)),j.hooks.run("wrap",s),"");for(r in s.attributes)i+=" "+r+'="'+(s.attributes[r]||"").replace(/"/g,"&quot;")+'"';return"<"+s.tag+' class="'+s.classes.join(" ")+'"'+i+">"+s.content+"</"+s.tag+">"},!l.document)return l.addEventListener&&(j.disableWorkerMessageHandler||l.addEventListener("message",function(e){var e=JSON.parse(e.data),t=e.language,n=e.code,e=e.immediateClose;l.postMessage(j.highlight(n,j.languages[t],t)),e&&l.close()},!1)),j;var a,e=j.util.currentScript();function r(){j.manual||j.highlightAll()}return e&&(j.filename=e.src,e.hasAttribute("data-manual")&&(j.manual=!0)),j.manual||("loading"===(a=document.readyState)||"interactive"===a&&e&&e.defer?document.addEventListener("DOMContentLoaded",r):window.requestAnimationFrame?window.requestAnimationFrame(r):window.setTimeout(r,16)),j}(_self);"undefined"!=typeof module&&module.exports&&(module.exports=Prism),"undefined"!=typeof global&&(global.Prism=Prism),Prism.languages.markup={comment:{pattern:/<!--(?:(?!<!--)[\s\S])*?-->/,greedy:!0},prolog:{pattern:/<\?[\s\S]+?\?>/,greedy:!0},doctype:{pattern:/<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:[^<"'\]]|"[^"]*"|'[^']*'|<(?!!--)|<!--(?:[^-]|-(?!->))*-->)*\]\s*)?>/i,greedy:!0,inside:{"internal-subset":{pattern:/(^[^\[]*\[)[\s\S]+(?=\]>$)/,lookbehind:!0,greedy:!0,inside:null},string:{pattern:/"[^"]*"|'[^']*'/,greedy:!0},punctuation:/^<!|>$|[[\]]/,"doctype-tag":/^DOCTYPE/i,name:/[^\s<>'"]+/}},cdata:{pattern:/<!\[CDATA\[[\s\S]*?\]\]>/i,greedy:!0},tag:{pattern:/<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/,greedy:!0,inside:{tag:{pattern:/^<\/?[^\s>\/]+/,inside:{punctuation:/^<\/?/,namespace:/^[^\s>\/:]+:/}},"special-attr":[],"attr-value":{pattern:/=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/,inside:{punctuation:[{pattern:/^=/,alias:"attr-equals"},{pattern:/^(\s*)["']|["']$/,lookbehind:!0}]}},punctuation:/\/?>/,"attr-name":{pattern:/[^\s>\/]+/,inside:{namespace:/^[^\s>\/:]+:/}}}},entity:[{pattern:/&[\da-z]{1,8};/i,alias:"named-entity"},/&#x?[\da-f]{1,8};/i]},Prism.languages.markup.tag.inside["attr-value"].inside.entity=Prism.languages.markup.entity,Prism.languages.markup.doctype.inside["internal-subset"].inside=Prism.languages.markup,Prism.hooks.add("wrap",function(e){"entity"===e.type&&(e.attributes.title=e.content.replace(/&amp;/,"&"))}),Object.defineProperty(Prism.languages.markup.tag,"addInlined",{value:function(e,t){var n={},n=(n["language-"+t]={pattern:/(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i,lookbehind:!0,inside:Prism.languages[t]},n.cdata=/^<!\[CDATA\[|\]\]>$/i,{"included-cdata":{pattern:/<!\[CDATA\[[\s\S]*?\]\]>/i,inside:n}}),t=(n["language-"+t]={pattern:/[\s\S]+/,inside:Prism.languages[t]},{});t[e]={pattern:RegExp(/(<__[^>]*>)(?:<!\[CDATA\[(?:[^\]]|\](?!\]>))*\]\]>|(?!<!\[CDATA\[)[\s\S])*?(?=<\/__>)/.source.replace(/__/g,function(){return e}),"i"),lookbehind:!0,greedy:!0,inside:n},Prism.languages.insertBefore("markup","cdata",t)}}),Object.defineProperty(Prism.languages.markup.tag,"addAttribute",{value:function(e,t){Prism.languages.markup.tag.inside["special-attr"].push({pattern:RegExp(/(^|["'\s])/.source+"(?:"+e+")"+/\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))/.source,"i"),lookbehind:!0,inside:{"attr-name":/^[^\s=]+/,"attr-value":{pattern:/=[\s\S]+/,inside:{value:{pattern:/(^=\s*(["']|(?!["'])))\S[\s\S]*(?=\2$)/,lookbehind:!0,alias:[t,"language-"+t],inside:Prism.languages[t]},punctuation:[{pattern:/^=/,alias:"attr-equals"},/"|'/]}}}})}}),Prism.languages.html=Prism.languages.markup,Prism.languages.mathml=Prism.languages.markup,Prism.languages.svg=Prism.languages.markup,Prism.languages.xml=Prism.languages.extend("markup",{}),Prism.languages.ssml=Prism.languages.xml,Prism.languages.atom=Prism.languages.xml,Prism.languages.rss=Prism.languages.xml,function(e){var t=/(?:"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"|'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n])*')/,t=(e.languages.css={comment:/\/\*[\s\S]*?\*\//,atrule:{pattern:RegExp("@[\\w-](?:"+/[^;{\s"']|\s+(?!\s)/.source+"|"+t.source+")*?"+/(?:;|(?=\s*\{))/.source),inside:{rule:/^@[\w-]+/,"selector-function-argument":{pattern:/(\bselector\s*\(\s*(?![\s)]))(?:[^()\s]|\s+(?![\s)])|\((?:[^()]|\([^()]*\))*\))+(?=\s*\))/,lookbehind:!0,alias:"selector"},keyword:{pattern:/(^|[^\w-])(?:and|not|only|or)(?![\w-])/,lookbehind:!0}}},url:{pattern:RegExp("\\burl\\((?:"+t.source+"|"+/(?:[^\\\r\n()"']|\\[\s\S])*/.source+")\\)","i"),greedy:!0,inside:{function:/^url/i,punctuation:/^\(|\)$/,string:{pattern:RegExp("^"+t.source+"$"),alias:"url"}}},selector:{pattern:RegExp("(^|[{}\\s])[^{}\\s](?:[^{};\"'\\s]|\\s+(?![\\s{])|"+t.source+")*(?=\\s*\\{)"),lookbehind:!0},string:{pattern:t,greedy:!0},property:{pattern:/(^|[^-\w\xA0-\uFFFF])(?!\s)[-_a-z\xA0-\uFFFF](?:(?!\s)[-\w\xA0-\uFFFF])*(?=\s*:)/i,lookbehind:!0},important:/!important\b/i,function:{pattern:/(^|[^-a-z0-9])[-a-z0-9]+(?=\()/i,lookbehind:!0},punctuation:/[(){};:,]/},e.languages.css.atrule.inside.rest=e.languages.css,e.languages.markup);t&&(t.tag.addInlined("style","css"),t.tag.addAttribute("style","css"))}(Prism),Prism.languages.clike={comment:[{pattern:/(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,lookbehind:!0,greedy:!0},{pattern:/(^|[^\\:])\/\/.*/,lookbehind:!0,greedy:!0}],string:{pattern:/(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,greedy:!0},"class-name":{pattern:/(\b(?:class|extends|implements|instanceof|interface|new|trait)\s+|\bcatch\s+\()[\w.\\]+/i,lookbehind:!0,inside:{punctuation:/[.\\]/}},keyword:/\b(?:break|catch|continue|do|else|finally|for|function|if|in|instanceof|new|null|return|throw|try|while)\b/,boolean:/\b(?:false|true)\b/,function:/\b\w+(?=\()/,number:/\b0x[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?/i,operator:/[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/,punctuation:/[{}[\];(),.:]/},Prism.languages.javascript=Prism.languages.extend("clike",{"class-name":[Prism.languages.clike["class-name"],{pattern:/(^|[^$\w\xA0-\uFFFF])(?!\s)[_$A-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\.(?:constructor|prototype))/,lookbehind:!0}],keyword:[{pattern:/((?:^|\})\s*)catch\b/,lookbehind:!0},{pattern:/(^|[^.]|\.\.\.\s*)\b(?:as|assert(?=\s*\{)|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally(?=\s*(?:\{|$))|for|from(?=\s*(?:['"]|$))|function|(?:get|set)(?=\s*(?:[#\[$\w\xA0-\uFFFF]|$))|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,lookbehind:!0}],function:/#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/,number:{pattern:RegExp(/(^|[^\w$])/.source+"(?:"+/NaN|Infinity/.source+"|"+/0[bB][01]+(?:_[01]+)*n?/.source+"|"+/0[oO][0-7]+(?:_[0-7]+)*n?/.source+"|"+/0[xX][\dA-Fa-f]+(?:_[\dA-Fa-f]+)*n?/.source+"|"+/\d+(?:_\d+)*n/.source+"|"+/(?:\d+(?:_\d+)*(?:\.(?:\d+(?:_\d+)*)?)?|\.\d+(?:_\d+)*)(?:[Ee][+-]?\d+(?:_\d+)*)?/.source+")"+/(?![\w$])/.source),lookbehind:!0},operator:/--|\+\+|\*\*=?|=>|&&=?|\|\|=?|[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?\?=?|\?\.?|[~:]/}),Prism.languages.javascript["class-name"][0].pattern=/(\b(?:class|extends|implements|instanceof|interface|new)\s+)[\w.\\]+/,Prism.languages.insertBefore("javascript","keyword",{regex:{pattern:RegExp(/((?:^|[^$\w\xA0-\uFFFF."'\])\s]|\b(?:return|yield))\s*)/.source+/\//.source+"(?:"+/(?:\[(?:[^\]\\\r\n]|\\.)*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}/.source+"|"+/(?:\[(?:[^[\]\\\r\n]|\\.|\[(?:[^[\]\\\r\n]|\\.|\[(?:[^[\]\\\r\n]|\\.)*\])*\])*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}v[dgimyus]{0,7}/.source+")"+/(?=(?:\s|\/\*(?:[^*]|\*(?!\/))*\*\/)*(?:$|[\r\n,.;:})\]]|\/\/))/.source),lookbehind:!0,greedy:!0,inside:{"regex-source":{pattern:/^(\/)[\s\S]+(?=\/[a-z]*$)/,lookbehind:!0,alias:"language-regex",inside:Prism.languages.regex},"regex-delimiter":/^\/|\/$/,"regex-flags":/^[a-z]+$/}},"function-variable":{pattern:/#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)\s*=>))/,alias:"function"},parameter:[{pattern:/(function(?:\s+(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)?\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\))/,lookbehind:!0,inside:Prism.languages.javascript},{pattern:/(^|[^$\w\xA0-\uFFFF])(?!\s)[_$a-z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*=>)/i,lookbehind:!0,inside:Prism.languages.javascript},{pattern:/(\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*=>)/,lookbehind:!0,inside:Prism.languages.javascript},{pattern:/((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*)\(\s*|\]\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*\{)/,lookbehind:!0,inside:Prism.languages.javascript}],constant:/\b[A-Z](?:[A-Z_]|\dx?)*\b/}),Prism.languages.insertBefore("javascript","string",{hashbang:{pattern:/^#!.*/,greedy:!0,alias:"comment"},"template-string":{pattern:/`(?:\\[\s\S]|\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}|(?!\$\{)[^\\`])*`/,greedy:!0,inside:{"template-punctuation":{pattern:/^`|`$/,alias:"string"},interpolation:{pattern:/((?:^|[^\\])(?:\\{2})*)\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}/,lookbehind:!0,inside:{"interpolation-punctuation":{pattern:/^\$\{|\}$/,alias:"punctuation"},rest:Prism.languages.javascript}},string:/[\s\S]+/}},"string-property":{pattern:/((?:^|[,{])[ \t]*)(["'])(?:\\(?:\r\n|[\s\S])|(?!\2)[^\\\r\n])*\2(?=\s*:)/m,lookbehind:!0,greedy:!0,alias:"property"}}),Prism.languages.insertBefore("javascript","operator",{"literal-property":{pattern:/((?:^|[,{])[ \t]*)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*:)/m,lookbehind:!0,alias:"property"}}),Prism.languages.markup&&(Prism.languages.markup.tag.addInlined("script","javascript"),Prism.languages.markup.tag.addAttribute(/on(?:abort|blur|change|click|composition(?:end|start|update)|dblclick|error|focus(?:in|out)?|key(?:down|up)|load|mouse(?:down|enter|leave|move|out|over|up)|reset|resize|scroll|select|slotchange|submit|unload|wheel)/.source,"javascript")),Prism.languages.js=Prism.languages.javascript,function(){var l,u,g,c,e;void 0!==Prism&&"undefined"!=typeof document&&(Element.prototype.matches||(Element.prototype.matches=Element.prototype.msMatchesSelector||Element.prototype.webkitMatchesSelector),l={js:"javascript",py:"python",rb:"ruby",ps1:"powershell",psm1:"powershell",sh:"bash",bat:"batch",h:"c",tex:"latex"},c="pre[data-src]:not(["+(u="data-src-status")+'="loaded"]):not(['+u+'="'+(g="loading")+'"])',Prism.hooks.add("before-highlightall",function(e){e.selector+=", "+c}),Prism.hooks.add("before-sanity-check",function(e){var r,t,n,a,s,i,o=e.element;o.matches(c)&&(e.code="",o.setAttribute(u,g),(r=o.appendChild(document.createElement("CODE"))).textContent="Loading…",t=o.getAttribute("data-src"),"none"===(e=e.language)&&(n=(/\.(\w+)$/.exec(t)||[,"none"])[1],e=l[n]||n),Prism.util.setLanguage(r,e),Prism.util.setLanguage(o,e),(n=Prism.plugins.autoloader)&&n.loadLanguages(e),n=t,a=function(e){o.setAttribute(u,"loaded");var t,n,a=function(e){var t,n;if(e=/^\s*(\d+)\s*(?:(,)\s*(?:(\d+)\s*)?)?$/.exec(e||""))return t=Number(e[1]),n=e[2],e=e[3],n?e?[t,Number(e)]:[t,void 0]:[t,t]}(o.getAttribute("data-range"));a&&(t=e.split(/\r\n?|\n/g),n=a[0],a=null==a[1]?t.length:a[1],n<0&&(n+=t.length),n=Math.max(0,Math.min(n-1,t.length)),a<0&&(a+=t.length),a=Math.max(0,Math.min(a,t.length)),e=t.slice(n,a).join("\n"),o.hasAttribute("data-start")||o.setAttribute("data-start",String(n+1))),r.textContent=e,Prism.highlightElement(r)},s=function(e){o.setAttribute(u,"failed"),r.textContent=e},(i=new XMLHttpRequest).open("GET",n,!0),i.onreadystatechange=function(){4==i.readyState&&(i.status<400&&i.responseText?a(i.responseText):400<=i.status?s("✖ Error "+i.status+" while fetching file: "+i.statusText):s("✖ Error: File does not exist or is empty"))},i.send(null))}),e=!(Prism.plugins.fileHighlight={highlight:function(e){for(var t,n=(e||document).querySelectorAll(c),a=0;t=n[a++];)Prism.highlightElement(t)}}),Prism.fileHighlight=function(){e||(console.warn("Prism.fileHighlight is deprecated. Use `Prism.plugins.fileHighlight.highlight` instead."),e=!0),Prism.plugins.fileHighlight.highlight.apply(this,arguments)})}();

!function(){if("undefined"!=typeof Prism&&"undefined"!=typeof document){var e={javascript:"clike",actionscript:"javascript",apex:["clike","sql"],arduino:"cpp",aspnet:["markup","csharp"],birb:"clike",bison:"c",c:"clike",csharp:"clike",cpp:"c",cfscript:"clike",chaiscript:["clike","cpp"],cilkc:"c",cilkcpp:"cpp",coffeescript:"javascript",crystal:"ruby","css-extras":"css",d:"clike",dart:"clike",django:"markup-templating",ejs:["javascript","markup-templating"],etlua:["lua","markup-templating"],erb:["ruby","markup-templating"],fsharp:"clike","firestore-security-rules":"clike",flow:"javascript",ftl:"markup-templating",gml:"clike",glsl:"c",go:"clike",gradle:"clike",groovy:"clike",haml:"ruby",handlebars:"markup-templating",haxe:"clike",hlsl:"c",idris:"haskell",java:"clike",javadoc:["markup","java","javadoclike"],jolie:"clike",jsdoc:["javascript","javadoclike","typescript"],"js-extras":"javascript",json5:"json",jsonp:"json","js-templates":"javascript",kotlin:"clike",latte:["clike","markup-templating","php"],less:"css",lilypond:"scheme",liquid:"markup-templating",markdown:"markup","markup-templating":"markup",mongodb:"javascript",n4js:"javascript",objectivec:"c",opencl:"c",parser:"markup",php:"markup-templating",phpdoc:["php","javadoclike"],"php-extras":"php",plsql:"sql",processing:"clike",protobuf:"clike",pug:["markup","javascript"],purebasic:"clike",purescript:"haskell",qsharp:"clike",qml:"javascript",qore:"clike",racket:"scheme",cshtml:["markup","csharp"],jsx:["markup","javascript"],tsx:["jsx","typescript"],reason:"clike",ruby:"clike",sass:"css",scss:"css",scala:"java","shell-session":"bash",smarty:"markup-templating",solidity:"clike",soy:"markup-templating",sparql:"turtle",sqf:"clike",squirrel:"clike",stata:["mata","java","python"],"t4-cs":["t4-templating","csharp"],"t4-vb":["t4-templating","vbnet"],tap:"yaml",tt2:["clike","markup-templating"],textile:"markup",twig:"markup-templating",typescript:"javascript",v:"clike",vala:"clike",vbnet:"basic",velocity:"markup",wiki:"markup",xeora:"markup","xml-doc":"markup",xquery:"markup"},a={html:"markup",xml:"markup",svg:"markup",mathml:"markup",ssml:"markup",atom:"markup",rss:"markup",js:"javascript",g4:"antlr4",ino:"arduino","arm-asm":"armasm",art:"arturo",adoc:"asciidoc",avs:"avisynth",avdl:"avro-idl",gawk:"awk",sh:"bash",shell:"bash",shortcode:"bbcode",rbnf:"bnf",oscript:"bsl",cs:"csharp",dotnet:"csharp",cfc:"cfscript","cilk-c":"cilkc","cilk-cpp":"cilkcpp",cilk:"cilkcpp",coffee:"coffeescript",conc:"concurnas",jinja2:"django","dns-zone":"dns-zone-file",dockerfile:"docker",gv:"dot",eta:"ejs",xlsx:"excel-formula",xls:"excel-formula",gamemakerlanguage:"gml",po:"gettext",gni:"gn",ld:"linker-script","go-mod":"go-module",hbs:"handlebars",mustache:"handlebars",hs:"haskell",idr:"idris",gitignore:"ignore",hgignore:"ignore",npmignore:"ignore",webmanifest:"json",kt:"kotlin",kts:"kotlin",kum:"kumir",tex:"latex",context:"latex",ly:"lilypond",emacs:"lisp",elisp:"lisp","emacs-lisp":"lisp",md:"markdown",moon:"moonscript",n4jsd:"n4js",nani:"naniscript",objc:"objectivec",qasm:"openqasm",objectpascal:"pascal",px:"pcaxis",pcode:"peoplecode",plantuml:"plant-uml",pq:"powerquery",mscript:"powerquery",pbfasm:"purebasic",purs:"purescript",py:"python",qs:"qsharp",rkt:"racket",razor:"cshtml",rpy:"renpy",res:"rescript",robot:"robotframework",rb:"ruby","sh-session":"shell-session",shellsession:"shell-session",smlnj:"sml",sol:"solidity",sln:"solution-file",rq:"sparql",sclang:"supercollider",t4:"t4-cs",trickle:"tremor",troy:"tremor",trig:"turtle",ts:"typescript",tsconfig:"typoscript",uscript:"unrealscript",uc:"unrealscript",url:"uri",vb:"visual-basic",vba:"visual-basic",webidl:"web-idl",mathematica:"wolfram",nb:"wolfram",wl:"wolfram",xeoracube:"xeora",yml:"yaml"},r={},s="components/",i=Prism.util.currentScript();if(i){var t=/\bplugins\/autoloader\/prism-autoloader\.(?:min\.)?js(?:\?[^\r\n/]*)?$/i,c=/(^|\/)[\w-]+\.(?:min\.)?js(?:\?[^\r\n/]*)?$/i,l=i.getAttribute("data-autoloader-path");if(null!=l)s=l.trim().replace(/\/?$/,"/");else{var p=i.src;t.test(p)?s=p.replace(t,"components/"):c.test(p)&&(s=p.replace(c,"$1components/"))}}var n=Prism.plugins.autoloader={languages_path:s,use_minified:!0,loadLanguages:m};Prism.hooks.add("complete",(function(e){var a=e.element,r=e.language;if(a&&r&&"none"!==r){var s=function(e){var a=(e.getAttribute("data-dependencies")||"").trim();if(!a){var r=e.parentElement;r&&"pre"===r.tagName.toLowerCase()&&(a=(r.getAttribute("data-dependencies")||"").trim())}return a?a.split(/\s*,\s*/g):[]}(a);/^diff-./i.test(r)?(s.push("diff"),s.push(r.substr("diff-".length))):s.push(r),s.every(o)||m(s,(function(){Prism.highlightElement(a)}))}}))}function o(e){if(e.indexOf("!")>=0)return!1;if((e=a[e]||e)in Prism.languages)return!0;var s=r[e];return s&&!s.error&&!1===s.loading}function m(s,i,t){"string"==typeof s&&(s=[s]);var c=s.length,l=0,p=!1;function k(){p||++l===c&&i&&i(s)}0!==c?s.forEach((function(s){!function(s,i,t){var c=s.indexOf("!")>=0;function l(){var e=r[s];e||(e=r[s]={callbacks:[]}),e.callbacks.push({success:i,error:t}),!c&&o(s)?u(s,"success"):!c&&e.error?u(s,"error"):!c&&e.loading||(e.loading=!0,e.error=!1,function(e,a,r){var s=document.createElement("script");s.src=e,s.async=!0,s.onload=function(){document.body.removeChild(s),a&&a()},s.onerror=function(){document.body.removeChild(s),r&&r()},document.body.appendChild(s)}(function(e){return n.languages_path+"prism-"+e+(n.use_minified?".min":"")+".js"}(s),(function(){e.loading=!1,u(s,"success")}),(function(){e.loading=!1,e.error=!0,u(s,"error")})))}s=s.replace("!","");var p=e[s=a[s]||s];p&&p.length?m(p,l,t):l()}(s,k,(function(){p||(p=!0,t&&t(s))}))})):i&&setTimeout(i,0)}function u(e,a){if(r[e]){for(var s=r[e].callbacks,i=0,t=s.length;i<t;i++){var c=s[i][a];c&&setTimeout(c,0)}s.length=0}}}();
/*!
 * Theia Sticky Sidebar v1.7.0
 * https://github.com/WeCodePixels/theia-sticky-sidebar
 */
!function(i){i.fn.scwStickySidebar=function(t){function e(t,e){var a=o(t,e);a||(console.log("TSS: Body width smaller than options.minWidth. Init is delayed."),i(document).on("scroll."+t.namespace,function(t,e){return function(a){var n=o(t,e);n&&i(this).unbind(a)}}(t,e)),i(window).on("resize."+t.namespace,function(t,e){return function(a){var n=o(t,e);n&&i(this).unbind(a)}}(t,e)))}function o(t,e){return t.initialized===!0||!(i("body").width()<t.minWidth)&&(a(t,e),!0)}function a(t,e){t.initialized=!0;var o=i("#scw-sticky-sidebar-stylesheet-"+t.namespace);0===o.length&&i("head").append(i('<style id="scw-sticky-sidebar-stylesheet-'+t.namespace+'">.scwStickySidebar:after {content: ""; display: table; clear: both;}</style>')),e.each(function(){function e(){a.fixedScrollTop=0,a.sidebar.css({"min-height":"1px"}),a.stickySidebar.css({position:"static",width:"",transform:"none"})}function o(t){var e=t.height();return t.children().each(function(){e=Math.max(e,i(this).height())}),e}var a={};if(a.sidebar=i(this),a.options=t||{},a.container=i(a.options.containerSelector),0==a.container.length&&(a.container=a.sidebar.parent()),a.sidebar.parents().css("-webkit-transform","none"),a.sidebar.css({position:a.options.defaultPosition,overflow:"visible","-webkit-box-sizing":"border-box","-moz-box-sizing":"border-box","box-sizing":"border-box"}),a.stickySidebar=a.sidebar.find(".scwStickySidebar"),0==a.stickySidebar.length){var s=/(?:text|application)\/(?:x-)?(?:javascript|ecmascript)/i;a.sidebar.find("script").filter(function(i,t){return 0===t.type.length||t.type.match(s)}).remove(),a.stickySidebar=i("<div>").addClass("scwStickySidebar").append(a.sidebar.children()),a.sidebar.append(a.stickySidebar)}a.marginBottom=parseInt(a.sidebar.css("margin-bottom")),a.paddingTop=parseInt(a.sidebar.css("padding-top")),a.paddingBottom=parseInt(a.sidebar.css("padding-bottom"));var r=a.stickySidebar.offset().top,d=a.stickySidebar.outerHeight();a.stickySidebar.css("padding-top",1),a.stickySidebar.css("padding-bottom",1),r-=a.stickySidebar.offset().top,d=a.stickySidebar.outerHeight()-d-r,0==r?(a.stickySidebar.css("padding-top",0),a.stickySidebarPaddingTop=0):a.stickySidebarPaddingTop=1,0==d?(a.stickySidebar.css("padding-bottom",0),a.stickySidebarPaddingBottom=0):a.stickySidebarPaddingBottom=1,a.previousScrollTop=null,a.fixedScrollTop=0,e(),a.onScroll=function(a){if(a.stickySidebar.is(":visible")){if(i("body").width()<a.options.minWidth)return void e();if(a.options.disableOnResponsiveLayouts){var s=a.sidebar.outerWidth("none"==a.sidebar.css("float"));if(s+50>a.container.width())return void e()}var r=i(document).scrollTop(),d="static";if(r>=a.sidebar.offset().top+(a.paddingTop-a.options.additionalMarginTop)){var c,p=a.paddingTop+t.additionalMarginTop,b=a.paddingBottom+a.marginBottom+t.additionalMarginBottom,l=a.sidebar.offset().top,f=a.sidebar.offset().top+o(a.container),h=0+t.additionalMarginTop,g=a.stickySidebar.outerHeight()+p+b<i(window).height();c=g?h+a.stickySidebar.outerHeight():i(window).height()-a.marginBottom-a.paddingBottom-t.additionalMarginBottom;var u=l-r+a.paddingTop,S=f-r-a.paddingBottom-a.marginBottom,y=a.stickySidebar.offset().top-r,m=a.previousScrollTop-r;"fixed"==a.stickySidebar.css("position")&&"modern"==a.options.sidebarBehavior&&(y+=m),"stick-to-top"==a.options.sidebarBehavior&&(y=t.additionalMarginTop),"stick-to-bottom"==a.options.sidebarBehavior&&(y=c-a.stickySidebar.outerHeight()),y=m>0?Math.min(y,h):Math.max(y,c-a.stickySidebar.outerHeight()),y=Math.max(y,u),y=Math.min(y,S-a.stickySidebar.outerHeight());var k=a.container.height()==a.stickySidebar.outerHeight();d=(k||y!=h)&&(k||y!=c-a.stickySidebar.outerHeight())?r+y-a.sidebar.offset().top-a.paddingTop<=t.additionalMarginTop?"static":"absolute":"fixed"}if("fixed"==d){var v=i(document).scrollLeft();a.stickySidebar.css({position:"fixed",width:n(a.stickySidebar)+"px",transform:"translateY("+y+"px)",left:a.sidebar.offset().left+parseInt(a.sidebar.css("padding-left"))-v+"px",top:"0px"})}else if("absolute"==d){var x={};"absolute"!=a.stickySidebar.css("position")&&(x.position="absolute",x.transform="translateY("+(r+y-a.sidebar.offset().top-a.stickySidebarPaddingTop-a.stickySidebarPaddingBottom)+"px)",x.top="0px"),x.width=n(a.stickySidebar)+"px",x.left="",a.stickySidebar.css(x)}else"static"==d&&e();"static"!=d&&1==a.options.updateSidebarHeight&&a.sidebar.css({"min-height":a.stickySidebar.outerHeight()+a.stickySidebar.offset().top-a.sidebar.offset().top+a.paddingBottom}),a.previousScrollTop=r}},a.onScroll(a),i(document).on("scroll."+a.options.namespace,function(i){return function(){i.onScroll(i)}}(a)),i(window).on("resize."+a.options.namespace,function(i){return function(){i.stickySidebar.css({position:"static"}),i.onScroll(i)}}(a)),"undefined"!=typeof ResizeSensor&&new ResizeSensor(a.stickySidebar[0],function(i){return function(){i.onScroll(i)}}(a))})}function n(i){var t;try{t=i[0].getBoundingClientRect().width}catch(i){}return"undefined"==typeof t&&(t=i.width()),t}var s={containerSelector:"",additionalMarginTop:0,additionalMarginBottom:0,updateSidebarHeight:!0,minWidth:0,disableOnResponsiveLayouts:!0,sidebarBehavior:"modern",defaultPosition:"relative",namespace:"TSS"};return t=i.extend(s,t),t.additionalMarginTop=parseInt(t.additionalMarginTop)||0,t.additionalMarginBottom=parseInt(t.additionalMarginBottom)||0,e(t,this),this}}(jQuery);
!function(){var e=function(t,i){function s(){this.q=[],this.add=function(e){this.q.push(e)};var e,t;this.call=function(){for(e=0,t=this.q.length;e<t;e++)this.q[e].call()}}function o(e,t){return e.currentStyle?e.currentStyle[t]:window.getComputedStyle?window.getComputedStyle(e,null).getPropertyValue(t):e.style[t]}function n(e,t){if(e.resizedAttached){if(e.resizedAttached)return void e.resizedAttached.add(t)}else e.resizedAttached=new s,e.resizedAttached.add(t);e.resizeSensor=document.createElement("div"),e.resizeSensor.className="resize-sensor";var i="position: absolute; left: 0; top: 0; right: 0; bottom: 0; overflow: hidden; z-index: -1; visibility: hidden;",n="position: absolute; left: 0; top: 0; transition: 0s;";e.resizeSensor.style.cssText=i,e.resizeSensor.innerHTML='<div class="resize-sensor-expand" style="'+i+'"><div style="'+n+'"></div></div><div class="resize-sensor-shrink" style="'+i+'"><div style="'+n+' width: 200%; height: 200%"></div></div>',e.appendChild(e.resizeSensor),{fixed:1,absolute:1}[o(e,"position")]||(e.style.position="relative");var d,r,l=e.resizeSensor.childNodes[0],c=l.childNodes[0],h=e.resizeSensor.childNodes[1],a=(h.childNodes[0],function(){c.style.width=l.offsetWidth+10+"px",c.style.height=l.offsetHeight+10+"px",l.scrollLeft=l.scrollWidth,l.scrollTop=l.scrollHeight,h.scrollLeft=h.scrollWidth,h.scrollTop=h.scrollHeight,d=e.offsetWidth,r=e.offsetHeight});a();var f=function(){e.resizedAttached&&e.resizedAttached.call()},u=function(e,t,i){e.attachEvent?e.attachEvent("on"+t,i):e.addEventListener(t,i)},p=function(){e.offsetWidth==d&&e.offsetHeight==r||f(),a()};u(l,"scroll",p),u(h,"scroll",p)}var d=Object.prototype.toString.call(t),r="[object Array]"===d||"[object NodeList]"===d||"[object HTMLCollection]"===d||"undefined"!=typeof jQuery&&t instanceof jQuery||"undefined"!=typeof Elements&&t instanceof Elements;if(r)for(var l=0,c=t.length;l<c;l++)n(t[l],i);else n(t,i);this.detach=function(){if(r)for(var i=0,s=t.length;i<s;i++)e.detach(t[i]);else e.detach(t)}};e.detach=function(e){e.resizeSensor&&(e.removeChild(e.resizeSensor),delete e.resizeSensor,delete e.resizedAttached)},"undefined"!=typeof module&&"undefined"!=typeof module.exports?module.exports=e:window.ResizeSensor=e}();

/**
 * Swiper 9.2.4
 * Most modern mobile touch slider and framework with hardware accelerated transitions
 * https://swiperjs.com
 *
 * Copyright 2014-2023 Vladimir Kharlampidi
 *
 * Released under the MIT License
 *
 * Released on: April 21, 2023
 */

!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?module.exports=t():"function"==typeof define&&define.amd?define(t):(e="undefined"!=typeof globalThis?globalThis:e||self).Swiper=t()}(this,(function(){"use strict";function e(e){return null!==e&&"object"==typeof e&&"constructor"in e&&e.constructor===Object}function t(s,a){void 0===s&&(s={}),void 0===a&&(a={}),Object.keys(a).forEach((i=>{void 0===s[i]?s[i]=a[i]:e(a[i])&&e(s[i])&&Object.keys(a[i]).length>0&&t(s[i],a[i])}))}const s={body:{},addEventListener(){},removeEventListener(){},activeElement:{blur(){},nodeName:""},querySelector:()=>null,querySelectorAll:()=>[],getElementById:()=>null,createEvent:()=>({initEvent(){}}),createElement:()=>({children:[],childNodes:[],style:{},setAttribute(){},getElementsByTagName:()=>[]}),createElementNS:()=>({}),importNode:()=>null,location:{hash:"",host:"",hostname:"",href:"",origin:"",pathname:"",protocol:"",search:""}};function a(){const e="undefined"!=typeof document?document:{};return t(e,s),e}const i={document:s,navigator:{userAgent:""},location:{hash:"",host:"",hostname:"",href:"",origin:"",pathname:"",protocol:"",search:""},history:{replaceState(){},pushState(){},go(){},back(){}},CustomEvent:function(){return this},addEventListener(){},removeEventListener(){},getComputedStyle:()=>({getPropertyValue:()=>""}),Image(){},Date(){},screen:{},setTimeout(){},clearTimeout(){},matchMedia:()=>({}),requestAnimationFrame:e=>"undefined"==typeof setTimeout?(e(),null):setTimeout(e,0),cancelAnimationFrame(e){"undefined"!=typeof setTimeout&&clearTimeout(e)}};function r(){const e="undefined"!=typeof window?window:{};return t(e,i),e}function n(e,t){return void 0===t&&(t=0),setTimeout(e,t)}function l(){return Date.now()}function o(e,t){void 0===t&&(t="x");const s=r();let a,i,n;const l=function(e){const t=r();let s;return t.getComputedStyle&&(s=t.getComputedStyle(e,null)),!s&&e.currentStyle&&(s=e.currentStyle),s||(s=e.style),s}(e);return sKitCSSMatrix?(i=l.transform||l.webkitTransform,i.split(",").length>6&&(i=i.split(", ").map((e=>e.replace(",","."))).join(", ")),n=new sKitCSSMatrix("none"===i?"":i)):(n=l.MozTransform||l.OTransform||l.MsTransform||l.msTransform||l.transform||l.getPropertyValue("transform").replace("translate(","matrix(1, 0, 0, 1,"),a=n.toString().split(",")),"x"===t&&(i=sKitCSSMatrix?n.m41:16===a.length?parseFloat(a[12]):parseFloat(a[4])),"y"===t&&(i=sKitCSSMatrix?n.m42:16===a.length?parseFloat(a[13]):parseFloat(a[5])),i||0}function d(e){return"object"==typeof e&&null!==e&&e.constructor&&"Object"===Object.prototype.toString.call(e).slice(8,-1)}function c(e){return"undefined"!=typeof window&&void 0!==window.HTMLElement?e instanceof HTMLElement:e&&(1===e.nodeType||11===e.nodeType)}function p(){const e=Object(arguments.length<=0?void 0:arguments[0]),t=["__proto__","constructor","prototype"];for(let s=1;s<arguments.length;s+=1){const a=s<0||arguments.length<=s?void 0:arguments[s];if(null!=a&&!c(a)){const s=Object.keys(Object(a)).filter((e=>t.indexOf(e)<0));for(let t=0,i=s.length;t<i;t+=1){const i=s[t],r=Object.getOwnPropertyDescriptor(a,i);void 0!==r&&r.enumerable&&(d(e[i])&&d(a[i])?a[i].__swiper__?e[i]=a[i]:p(e[i],a[i]):!d(e[i])&&d(a[i])?(e[i]={},a[i].__swiper__?e[i]=a[i]:p(e[i],a[i])):e[i]=a[i])}}}return e}function u(e,t,s){e.style.setProperty(t,s)}function m(e){let{swiper:t,targetPosition:s,side:a}=e;const i=r(),n=-t.translate;let l,o=null;const d=t.params.speed;t.wrapperEl.style.scrollSnapType="none",i.cancelAnimationFrame(t.cssModeFrameID);const c=s>n?"next":"prev",p=(e,t)=>"next"===c&&e>=t||"prev"===c&&e<=t,u=()=>{l=(new Date).getTime(),null===o&&(o=l);const e=Math.max(Math.min((l-o)/d,1),0),r=.5-Math.cos(e*Math.PI)/2;let c=n+r*(s-n);if(p(c,s)&&(c=s),t.wrapperEl.scrollTo({[a]:c}),p(c,s))return t.wrapperEl.style.overflow="hidden",t.wrapperEl.style.scrollSnapType="",setTimeout((()=>{t.wrapperEl.style.overflow="",t.wrapperEl.scrollTo({[a]:c})})),void i.cancelAnimationFrame(t.cssModeFrameID);t.cssModeFrameID=i.requestAnimationFrame(u)};u()}function h(e){return e.querySelector(".swiper-slide-transform")||e.shadowEl&&e.shadowEl.querySelector(".swiper-slide-transform")||e}function f(e,t){return void 0===t&&(t=""),[...e.children].filter((e=>e.matches(t)))}function g(e,t){void 0===t&&(t=[]);const s=document.createElement(e);return s.classList.add(...Array.isArray(t)?t:[t]),s}function v(e){const t=r(),s=a(),i=e.getBoundingClientRect(),n=s.body,l=e.clientTop||n.clientTop||0,o=e.clientLeft||n.clientLeft||0,d=e===t?t.scrollY:e.scrollTop,c=e===t?t.scrollX:e.scrollLeft;return{top:i.top+d-l,left:i.left+c-o}}function w(e,t){return r().getComputedStyle(e,null).getPropertyValue(t)}function b(e){let t,s=e;if(s){for(t=0;null!==(s=s.previousSibling);)1===s.nodeType&&(t+=1);return t}}function y(e,t){const s=[];let a=e.parentElement;for(;a;)t?a.matches(t)&&s.push(a):s.push(a),a=a.parentElement;return s}function E(e,t){t&&e.addEventListener("transitionend",(function s(a){a.target===e&&(t.call(e,a),e.removeEventListener("transitionend",s))}))}function x(e,t,s){const a=r();return s?e["width"===t?"offsetWidth":"offsetHeight"]+parseFloat(a.getComputedStyle(e,null).getPropertyValue("width"===t?"margin-right":"margin-top"))+parseFloat(a.getComputedStyle(e,null).getPropertyValue("width"===t?"margin-left":"margin-bottom")):e.offsetWidth}let S,T,M;function C(){return S||(S=function(){const e=r(),t=a();return{smoothScroll:t.documentElement&&"scrollBehavior"in t.documentElement.style,touch:!!("ontouchstart"in e||e.DocumentTouch&&t instanceof e.DocumentTouch)}}()),S}function P(e){return void 0===e&&(e={}),T||(T=function(e){let{userAgent:t}=void 0===e?{}:e;const s=C(),a=r(),i=a.navigator.platform,n=t||a.navigator.userAgent,l={ios:!1,android:!1},o=a.screen.width,d=a.screen.height,c=n.match(/(Android);?[\s\/]+([\d.]+)?/);let p=n.match(/(iPad).*OS\s([\d_]+)/);const u=n.match(/(iPod)(.*OS\s([\d_]+))?/),m=!p&&n.match(/(iPhone\sOS|iOS)\s([\d_]+)/),h="Win32"===i;let f="MacIntel"===i;return!p&&f&&s.touch&&["1024x1366","1366x1024","834x1194","1194x834","834x1112","1112x834","768x1024","1024x768","820x1180","1180x820","810x1080","1080x810"].indexOf(`${o}x${d}`)>=0&&(p=n.match(/(Version)\/([\d.]+)/),p||(p=[0,1,"13_0_0"]),f=!1),c&&!h&&(l.os="android",l.android=!0),(p||m||u)&&(l.os="ios",l.ios=!0),l}(e)),T}function L(){return M||(M=function(){const e=r();let t=!1;function s(){const t=e.navigator.userAgent.toLowerCase();return t.indexOf("safari")>=0&&t.indexOf("chrome")<0&&t.indexOf("android")<0}if(s()){const s=String(e.navigator.userAgent);if(s.includes("Version/")){const[e,a]=s.split("Version/")[1].split(" ")[0].split(".").map((e=>Number(e)));t=e<16||16===e&&a<2}}return{isSafari:t||s(),needPerspectiveFix:t,isWebView:/(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(e.navigator.userAgent)}}()),M}var z={on(e,t,s){const a=this;if(!a.eventsListeners||a.destroyed)return a;if("function"!=typeof t)return a;const i=s?"unshift":"push";return e.split(" ").forEach((e=>{a.eventsListeners[e]||(a.eventsListeners[e]=[]),a.eventsListeners[e][i](t)})),a},once(e,t,s){const a=this;if(!a.eventsListeners||a.destroyed)return a;if("function"!=typeof t)return a;function i(){a.off(e,i),i.__emitterProxy&&delete i.__emitterProxy;for(var s=arguments.length,r=new Array(s),n=0;n<s;n++)r[n]=arguments[n];t.apply(a,r)}return i.__emitterProxy=t,a.on(e,i,s)},onAny(e,t){const s=this;if(!s.eventsListeners||s.destroyed)return s;if("function"!=typeof e)return s;const a=t?"unshift":"push";return s.eventsAnyListeners.indexOf(e)<0&&s.eventsAnyListeners[a](e),s},offAny(e){const t=this;if(!t.eventsListeners||t.destroyed)return t;if(!t.eventsAnyListeners)return t;const s=t.eventsAnyListeners.indexOf(e);return s>=0&&t.eventsAnyListeners.splice(s,1),t},off(e,t){const s=this;return!s.eventsListeners||s.destroyed?s:s.eventsListeners?(e.split(" ").forEach((e=>{void 0===t?s.eventsListeners[e]=[]:s.eventsListeners[e]&&s.eventsListeners[e].forEach(((a,i)=>{(a===t||a.__emitterProxy&&a.__emitterProxy===t)&&s.eventsListeners[e].splice(i,1)}))})),s):s},emit(){const e=this;if(!e.eventsListeners||e.destroyed)return e;if(!e.eventsListeners)return e;let t,s,a;for(var i=arguments.length,r=new Array(i),n=0;n<i;n++)r[n]=arguments[n];"string"==typeof r[0]||Array.isArray(r[0])?(t=r[0],s=r.slice(1,r.length),a=e):(t=r[0].events,s=r[0].data,a=r[0].context||e),s.unshift(a);return(Array.isArray(t)?t:t.split(" ")).forEach((t=>{e.eventsAnyListeners&&e.eventsAnyListeners.length&&e.eventsAnyListeners.forEach((e=>{e.apply(a,[t,...s])})),e.eventsListeners&&e.eventsListeners[t]&&e.eventsListeners[t].forEach((e=>{e.apply(a,s)}))})),e}};const A=(e,t)=>{if(!e||e.destroyed||!e.params)return;const s=t.closest(e.isElement?"swiper-slide":`.${e.params.slideClass}`);if(s){const t=s.querySelector(`.${e.params.lazyPreloaderClass}`);t&&t.remove()}},$=(e,t)=>{if(!e.slides[t])return;const s=e.slides[t].querySelector('[loading="lazy"]');s&&s.removeAttribute("loading")},I=e=>{if(!e||e.destroyed||!e.params)return;let t=e.params.lazyPreloadPrevNext;const s=e.slides.length;if(!s||!t||t<0)return;t=Math.min(t,s);const a="auto"===e.params.slidesPerView?e.slidesPerViewDynamic():Math.ceil(e.params.slidesPerView),i=e.activeIndex,r=i+a-1;if(e.params.rewind)for(let a=i-t;a<=r+t;a+=1){const t=(a%s+s)%s;t!==i&&t>r&&$(e,t)}else for(let a=Math.max(r-t,0);a<=Math.min(r+t,s-1);a+=1)a!==i&&a>r&&$(e,a)};var k={updateSize:function(){const e=this;let t,s;const a=e.el;t=void 0!==e.params.width&&null!==e.params.width?e.params.width:a.clientWidth,s=void 0!==e.params.height&&null!==e.params.height?e.params.height:a.clientHeight,0===t&&e.isHorizontal()||0===s&&e.isVertical()||(t=t-parseInt(w(a,"padding-left")||0,10)-parseInt(w(a,"padding-right")||0,10),s=s-parseInt(w(a,"padding-top")||0,10)-parseInt(w(a,"padding-bottom")||0,10),Number.isNaN(t)&&(t=0),Number.isNaN(s)&&(s=0),Object.assign(e,{width:t,height:s,size:e.isHorizontal()?t:s}))},updateSlides:function(){const e=this;function t(t){return e.isHorizontal()?t:{width:"height","margin-top":"margin-left","margin-bottom ":"margin-right","margin-left":"margin-top","margin-right":"margin-bottom","padding-left":"padding-top","padding-right":"padding-bottom",marginRight:"marginBottom"}[t]}function s(e,s){return parseFloat(e.getPropertyValue(t(s))||0)}const a=e.params,{wrapperEl:i,slidesEl:r,size:n,rtlTranslate:l,wrongRTL:o}=e,d=e.virtual&&a.virtual.enabled,c=d?e.virtual.slides.length:e.slides.length,p=f(r,`.${e.params.slideClass}, swiper-slide`),m=d?e.virtual.slides.length:p.length;let h=[];const g=[],v=[];let b=a.slidesOffsetBefore;"function"==typeof b&&(b=a.slidesOffsetBefore.call(e));let y=a.slidesOffsetAfter;"function"==typeof y&&(y=a.slidesOffsetAfter.call(e));const E=e.snapGrid.length,S=e.slidesGrid.length;let T=a.spaceBetween,M=-b,C=0,P=0;if(void 0===n)return;"string"==typeof T&&T.indexOf("%")>=0&&(T=parseFloat(T.replace("%",""))/100*n),e.virtualSize=-T,p.forEach((e=>{l?e.style.marginLeft="":e.style.marginRight="",e.style.marginBottom="",e.style.marginTop=""})),a.centeredSlides&&a.cssMode&&(u(i,"--swiper-centered-offset-before",""),u(i,"--swiper-centered-offset-after",""));const L=a.grid&&a.grid.rows>1&&e.grid;let z;L&&e.grid.initSlides(m);const A="auto"===a.slidesPerView&&a.breakpoints&&Object.keys(a.breakpoints).filter((e=>void 0!==a.breakpoints[e].slidesPerView)).length>0;for(let i=0;i<m;i+=1){let r;if(z=0,p[i]&&(r=p[i]),L&&e.grid.updateSlide(i,r,m,t),!p[i]||"none"!==w(r,"display")){if("auto"===a.slidesPerView){A&&(p[i].style[t("width")]="");const n=getComputedStyle(r),l=r.style.transform,o=r.style.webkitTransform;if(l&&(r.style.transform="none"),o&&(r.style.webkitTransform="none"),a.roundLengths)z=e.isHorizontal()?x(r,"width",!0):x(r,"height",!0);else{const e=s(n,"width"),t=s(n,"padding-left"),a=s(n,"padding-right"),i=s(n,"margin-left"),l=s(n,"margin-right"),o=n.getPropertyValue("box-sizing");if(o&&"border-box"===o)z=e+i+l;else{const{clientWidth:s,offsetWidth:n}=r;z=e+t+a+i+l+(n-s)}}l&&(r.style.transform=l),o&&(r.style.webkitTransform=o),a.roundLengths&&(z=Math.floor(z))}else z=(n-(a.slidesPerView-1)*T)/a.slidesPerView,a.roundLengths&&(z=Math.floor(z)),p[i]&&(p[i].style[t("width")]=`${z}px`);p[i]&&(p[i].swiperSlideSize=z),v.push(z),a.centeredSlides?(M=M+z/2+C/2+T,0===C&&0!==i&&(M=M-n/2-T),0===i&&(M=M-n/2-T),Math.abs(M)<.001&&(M=0),a.roundLengths&&(M=Math.floor(M)),P%a.slidesPerGroup==0&&h.push(M),g.push(M)):(a.roundLengths&&(M=Math.floor(M)),(P-Math.min(e.params.slidesPerGroupSkip,P))%e.params.slidesPerGroup==0&&h.push(M),g.push(M),M=M+z+T),e.virtualSize+=z+T,C=z,P+=1}}if(e.virtualSize=Math.max(e.virtualSize,n)+y,l&&o&&("slide"===a.effect||"coverflow"===a.effect)&&(i.style.width=`${e.virtualSize+a.spaceBetween}px`),a.setWrapperSize&&(i.style[t("width")]=`${e.virtualSize+a.spaceBetween}px`),L&&e.grid.updateWrapperSize(z,h,t),!a.centeredSlides){const t=[];for(let s=0;s<h.length;s+=1){let i=h[s];a.roundLengths&&(i=Math.floor(i)),h[s]<=e.virtualSize-n&&t.push(i)}h=t,Math.floor(e.virtualSize-n)-Math.floor(h[h.length-1])>1&&h.push(e.virtualSize-n)}if(d&&a.loop){const t=v[0]+T;if(a.slidesPerGroup>1){const s=Math.ceil((e.virtual.slidesBefore+e.virtual.slidesAfter)/a.slidesPerGroup),i=t*a.slidesPerGroup;for(let e=0;e<s;e+=1)h.push(h[h.length-1]+i)}for(let s=0;s<e.virtual.slidesBefore+e.virtual.slidesAfter;s+=1)1===a.slidesPerGroup&&h.push(h[h.length-1]+t),g.push(g[g.length-1]+t),e.virtualSize+=t}if(0===h.length&&(h=[0]),0!==a.spaceBetween){const s=e.isHorizontal()&&l?"marginLeft":t("marginRight");p.filter(((e,t)=>!(a.cssMode&&!a.loop)||t!==p.length-1)).forEach((e=>{e.style[s]=`${T}px`}))}if(a.centeredSlides&&a.centeredSlidesBounds){let e=0;v.forEach((t=>{e+=t+(a.spaceBetween?a.spaceBetween:0)})),e-=a.spaceBetween;const t=e-n;h=h.map((e=>e<0?-b:e>t?t+y:e))}if(a.centerInsufficientSlides){let e=0;if(v.forEach((t=>{e+=t+(a.spaceBetween?a.spaceBetween:0)})),e-=a.spaceBetween,e<n){const t=(n-e)/2;h.forEach(((e,s)=>{h[s]=e-t})),g.forEach(((e,s)=>{g[s]=e+t}))}}if(Object.assign(e,{slides:p,snapGrid:h,slidesGrid:g,slidesSizesGrid:v}),a.centeredSlides&&a.cssMode&&!a.centeredSlidesBounds){u(i,"--swiper-centered-offset-before",-h[0]+"px"),u(i,"--swiper-centered-offset-after",e.size/2-v[v.length-1]/2+"px");const t=-e.snapGrid[0],s=-e.slidesGrid[0];e.snapGrid=e.snapGrid.map((e=>e+t)),e.slidesGrid=e.slidesGrid.map((e=>e+s))}if(m!==c&&e.emit("slidesLengthChange"),h.length!==E&&(e.params.watchOverflow&&e.checkOverflow(),e.emit("snapGridLengthChange")),g.length!==S&&e.emit("slidesGridLengthChange"),a.watchSlidesProgress&&e.updateSlidesOffset(),!(d||a.cssMode||"slide"!==a.effect&&"fade"!==a.effect)){const t=`${a.containerModifierClass}backface-hidden`,s=e.el.classList.contains(t);m<=a.maxBackfaceHiddenSlides?s||e.el.classList.add(t):s&&e.el.classList.remove(t)}},updateAutoHeight:function(e){const t=this,s=[],a=t.virtual&&t.params.virtual.enabled;let i,r=0;"number"==typeof e?t.setTransition(e):!0===e&&t.setTransition(t.params.speed);const n=e=>a?t.slides[t.getSlideIndexByData(e)]:t.slides[e];if("auto"!==t.params.slidesPerView&&t.params.slidesPerView>1)if(t.params.centeredSlides)(t.visibleSlides||[]).forEach((e=>{s.push(e)}));else for(i=0;i<Math.ceil(t.params.slidesPerView);i+=1){const e=t.activeIndex+i;if(e>t.slides.length&&!a)break;s.push(n(e))}else s.push(n(t.activeIndex));for(i=0;i<s.length;i+=1)if(void 0!==s[i]){const e=s[i].offsetHeight;r=e>r?e:r}(r||0===r)&&(t.wrapperEl.style.height=`${r}px`)},updateSlidesOffset:function(){const e=this,t=e.slides,s=e.isElement?e.isHorizontal()?e.wrapperEl.offsetLeft:e.wrapperEl.offsetTop:0;for(let a=0;a<t.length;a+=1)t[a].swiperSlideOffset=(e.isHorizontal()?t[a].offsetLeft:t[a].offsetTop)-s-e.cssOverflowAdjustment()},updateSlidesProgress:function(e){void 0===e&&(e=this&&this.translate||0);const t=this,s=t.params,{slides:a,rtlTranslate:i,snapGrid:r}=t;if(0===a.length)return;void 0===a[0].swiperSlideOffset&&t.updateSlidesOffset();let n=-e;i&&(n=e),a.forEach((e=>{e.classList.remove(s.slideVisibleClass)})),t.visibleSlidesIndexes=[],t.visibleSlides=[];for(let e=0;e<a.length;e+=1){const l=a[e];let o=l.swiperSlideOffset;s.cssMode&&s.centeredSlides&&(o-=a[0].swiperSlideOffset);const d=(n+(s.centeredSlides?t.minTranslate():0)-o)/(l.swiperSlideSize+s.spaceBetween),c=(n-r[0]+(s.centeredSlides?t.minTranslate():0)-o)/(l.swiperSlideSize+s.spaceBetween),p=-(n-o),u=p+t.slidesSizesGrid[e];(p>=0&&p<t.size-1||u>1&&u<=t.size||p<=0&&u>=t.size)&&(t.visibleSlides.push(l),t.visibleSlidesIndexes.push(e),a[e].classList.add(s.slideVisibleClass)),l.progress=i?-d:d,l.originalProgress=i?-c:c}},updateProgress:function(e){const t=this;if(void 0===e){const s=t.rtlTranslate?-1:1;e=t&&t.translate&&t.translate*s||0}const s=t.params,a=t.maxTranslate()-t.minTranslate();let{progress:i,isBeginning:r,isEnd:n,progressLoop:l}=t;const o=r,d=n;if(0===a)i=0,r=!0,n=!0;else{i=(e-t.minTranslate())/a;const s=Math.abs(e-t.minTranslate())<1,l=Math.abs(e-t.maxTranslate())<1;r=s||i<=0,n=l||i>=1,s&&(i=0),l&&(i=1)}if(s.loop){const s=t.getSlideIndexByData(0),a=t.getSlideIndexByData(t.slides.length-1),i=t.slidesGrid[s],r=t.slidesGrid[a],n=t.slidesGrid[t.slidesGrid.length-1],o=Math.abs(e);l=o>=i?(o-i)/n:(o+n-r)/n,l>1&&(l-=1)}Object.assign(t,{progress:i,progressLoop:l,isBeginning:r,isEnd:n}),(s.watchSlidesProgress||s.centeredSlides&&s.autoHeight)&&t.updateSlidesProgress(e),r&&!o&&t.emit("reachBeginning toEdge"),n&&!d&&t.emit("reachEnd toEdge"),(o&&!r||d&&!n)&&t.emit("fromEdge"),t.emit("progress",i)},updateSlidesClasses:function(){const e=this,{slides:t,params:s,slidesEl:a,activeIndex:i}=e,r=e.virtual&&s.virtual.enabled,n=e=>f(a,`.${s.slideClass}${e}, swiper-slide${e}`)[0];let l;if(t.forEach((e=>{e.classList.remove(s.slideActiveClass,s.slideNextClass,s.slidePrevClass)})),r)if(s.loop){let t=i-e.virtual.slidesBefore;t<0&&(t=e.virtual.slides.length+t),t>=e.virtual.slides.length&&(t-=e.virtual.slides.length),l=n(`[data-swiper-slide-index="${t}"]`)}else l=n(`[data-swiper-slide-index="${i}"]`);else l=t[i];if(l){l.classList.add(s.slideActiveClass);let e=function(e,t){const s=[];for(;e.nextElementSibling;){const a=e.nextElementSibling;t?a.matches(t)&&s.push(a):s.push(a),e=a}return s}(l,`.${s.slideClass}, swiper-slide`)[0];s.loop&&!e&&(e=t[0]),e&&e.classList.add(s.slideNextClass);let a=function(e,t){const s=[];for(;e.previousElementSibling;){const a=e.previousElementSibling;t?a.matches(t)&&s.push(a):s.push(a),e=a}return s}(l,`.${s.slideClass}, swiper-slide`)[0];s.loop&&0===!a&&(a=t[t.length-1]),a&&a.classList.add(s.slidePrevClass)}e.emitSlidesClasses()},updateActiveIndex:function(e){const t=this,s=t.rtlTranslate?t.translate:-t.translate,{snapGrid:a,params:i,activeIndex:r,realIndex:n,snapIndex:l}=t;let o,d=e;const c=e=>{let s=e-t.virtual.slidesBefore;return s<0&&(s=t.virtual.slides.length+s),s>=t.virtual.slides.length&&(s-=t.virtual.slides.length),s};if(void 0===d&&(d=function(e){const{slidesGrid:t,params:s}=e,a=e.rtlTranslate?e.translate:-e.translate;let i;for(let e=0;e<t.length;e+=1)void 0!==t[e+1]?a>=t[e]&&a<t[e+1]-(t[e+1]-t[e])/2?i=e:a>=t[e]&&a<t[e+1]&&(i=e+1):a>=t[e]&&(i=e);return s.normalizeSlideIndex&&(i<0||void 0===i)&&(i=0),i}(t)),a.indexOf(s)>=0)o=a.indexOf(s);else{const e=Math.min(i.slidesPerGroupSkip,d);o=e+Math.floor((d-e)/i.slidesPerGroup)}if(o>=a.length&&(o=a.length-1),d===r)return o!==l&&(t.snapIndex=o,t.emit("snapIndexChange")),void(t.params.loop&&t.virtual&&t.params.virtual.enabled&&(t.realIndex=c(d)));let p;p=t.virtual&&i.virtual.enabled&&i.loop?c(d):t.slides[d]?parseInt(t.slides[d].getAttribute("data-swiper-slide-index")||d,10):d,Object.assign(t,{previousSnapIndex:l,snapIndex:o,previousRealIndex:n,realIndex:p,previousIndex:r,activeIndex:d}),t.initialized&&I(t),t.emit("activeIndexChange"),t.emit("snapIndexChange"),n!==p&&t.emit("realIndexChange"),(t.initialized||t.params.runCallbacksOnInit)&&t.emit("slideChange")},updateClickedSlide:function(e){const t=this,s=t.params,a=e.closest(`.${s.slideClass}, swiper-slide`);let i,r=!1;if(a)for(let e=0;e<t.slides.length;e+=1)if(t.slides[e]===a){r=!0,i=e;break}if(!a||!r)return t.clickedSlide=void 0,void(t.clickedIndex=void 0);t.clickedSlide=a,t.virtual&&t.params.virtual.enabled?t.clickedIndex=parseInt(a.getAttribute("data-swiper-slide-index"),10):t.clickedIndex=i,s.slideToClickedSlide&&void 0!==t.clickedIndex&&t.clickedIndex!==t.activeIndex&&t.slideToClickedSlide()}};var O={getTranslate:function(e){void 0===e&&(e=this.isHorizontal()?"x":"y");const{params:t,rtlTranslate:s,translate:a,wrapperEl:i}=this;if(t.virtualTranslate)return s?-a:a;if(t.cssMode)return a;let r=o(i,e);return r+=this.cssOverflowAdjustment(),s&&(r=-r),r||0},setTranslate:function(e,t){const s=this,{rtlTranslate:a,params:i,wrapperEl:r,progress:n}=s;let l,o=0,d=0;s.isHorizontal()?o=a?-e:e:d=e,i.roundLengths&&(o=Math.floor(o),d=Math.floor(d)),s.previousTranslate=s.translate,s.translate=s.isHorizontal()?o:d,i.cssMode?r[s.isHorizontal()?"scrollLeft":"scrollTop"]=s.isHorizontal()?-o:-d:i.virtualTranslate||(s.isHorizontal()?o-=s.cssOverflowAdjustment():d-=s.cssOverflowAdjustment(),r.style.transform=`translate3d(${o}px, ${d}px, 0px)`);const c=s.maxTranslate()-s.minTranslate();l=0===c?0:(e-s.minTranslate())/c,l!==n&&s.updateProgress(e),s.emit("setTranslate",s.translate,t)},minTranslate:function(){return-this.snapGrid[0]},maxTranslate:function(){return-this.snapGrid[this.snapGrid.length-1]},translateTo:function(e,t,s,a,i){void 0===e&&(e=0),void 0===t&&(t=this.params.speed),void 0===s&&(s=!0),void 0===a&&(a=!0);const r=this,{params:n,wrapperEl:l}=r;if(r.animating&&n.preventInteractionOnTransition)return!1;const o=r.minTranslate(),d=r.maxTranslate();let c;if(c=a&&e>o?o:a&&e<d?d:e,r.updateProgress(c),n.cssMode){const e=r.isHorizontal();if(0===t)l[e?"scrollLeft":"scrollTop"]=-c;else{if(!r.support.smoothScroll)return m({swiper:r,targetPosition:-c,side:e?"left":"top"}),!0;l.scrollTo({[e?"left":"top"]:-c,behavior:"smooth"})}return!0}return 0===t?(r.setTransition(0),r.setTranslate(c),s&&(r.emit("beforeTransitionStart",t,i),r.emit("transitionEnd"))):(r.setTransition(t),r.setTranslate(c),s&&(r.emit("beforeTransitionStart",t,i),r.emit("transitionStart")),r.animating||(r.animating=!0,r.onTranslateToWrapperTransitionEnd||(r.onTranslateToWrapperTransitionEnd=function(e){r&&!r.destroyed&&e.target===this&&(r.wrapperEl.removeEventListener("transitionend",r.onTranslateToWrapperTransitionEnd),r.onTranslateToWrapperTransitionEnd=null,delete r.onTranslateToWrapperTransitionEnd,s&&r.emit("transitionEnd"))}),r.wrapperEl.addEventListener("transitionend",r.onTranslateToWrapperTransitionEnd))),!0}};function D(e){let{swiper:t,runCallbacks:s,direction:a,step:i}=e;const{activeIndex:r,previousIndex:n}=t;let l=a;if(l||(l=r>n?"next":r<n?"prev":"reset"),t.emit(`transition${i}`),s&&r!==n){if("reset"===l)return void t.emit(`slideResetTransition${i}`);t.emit(`slideChangeTransition${i}`),"next"===l?t.emit(`slideNextTransition${i}`):t.emit(`slidePrevTransition${i}`)}}var G={slideTo:function(e,t,s,a,i){void 0===e&&(e=0),void 0===t&&(t=this.params.speed),void 0===s&&(s=!0),"string"==typeof e&&(e=parseInt(e,10));const r=this;let n=e;n<0&&(n=0);const{params:l,snapGrid:o,slidesGrid:d,previousIndex:c,activeIndex:p,rtlTranslate:u,wrapperEl:h,enabled:f}=r;if(r.animating&&l.preventInteractionOnTransition||!f&&!a&&!i)return!1;const g=Math.min(r.params.slidesPerGroupSkip,n);let v=g+Math.floor((n-g)/r.params.slidesPerGroup);v>=o.length&&(v=o.length-1);const w=-o[v];if(l.normalizeSlideIndex)for(let e=0;e<d.length;e+=1){const t=-Math.floor(100*w),s=Math.floor(100*d[e]),a=Math.floor(100*d[e+1]);void 0!==d[e+1]?t>=s&&t<a-(a-s)/2?n=e:t>=s&&t<a&&(n=e+1):t>=s&&(n=e)}if(r.initialized&&n!==p){if(!r.allowSlideNext&&w<r.translate&&w<r.minTranslate())return!1;if(!r.allowSlidePrev&&w>r.translate&&w>r.maxTranslate()&&(p||0)!==n)return!1}let b;if(n!==(c||0)&&s&&r.emit("beforeSlideChangeStart"),r.updateProgress(w),b=n>p?"next":n<p?"prev":"reset",u&&-w===r.translate||!u&&w===r.translate)return r.updateActiveIndex(n),l.autoHeight&&r.updateAutoHeight(),r.updateSlidesClasses(),"slide"!==l.effect&&r.setTranslate(w),"reset"!==b&&(r.transitionStart(s,b),r.transitionEnd(s,b)),!1;if(l.cssMode){const e=r.isHorizontal(),s=u?w:-w;if(0===t){const t=r.virtual&&r.params.virtual.enabled;t&&(r.wrapperEl.style.scrollSnapType="none",r._immediateVirtual=!0),t&&!r._cssModeVirtualInitialSet&&r.params.initialSlide>0?(r._cssModeVirtualInitialSet=!0,requestAnimationFrame((()=>{h[e?"scrollLeft":"scrollTop"]=s}))):h[e?"scrollLeft":"scrollTop"]=s,t&&requestAnimationFrame((()=>{r.wrapperEl.style.scrollSnapType="",r._immediateVirtual=!1}))}else{if(!r.support.smoothScroll)return m({swiper:r,targetPosition:s,side:e?"left":"top"}),!0;h.scrollTo({[e?"left":"top"]:s,behavior:"smooth"})}return!0}return r.setTransition(t),r.setTranslate(w),r.updateActiveIndex(n),r.updateSlidesClasses(),r.emit("beforeTransitionStart",t,a),r.transitionStart(s,b),0===t?r.transitionEnd(s,b):r.animating||(r.animating=!0,r.onSlideToWrapperTransitionEnd||(r.onSlideToWrapperTransitionEnd=function(e){r&&!r.destroyed&&e.target===this&&(r.wrapperEl.removeEventListener("transitionend",r.onSlideToWrapperTransitionEnd),r.onSlideToWrapperTransitionEnd=null,delete r.onSlideToWrapperTransitionEnd,r.transitionEnd(s,b))}),r.wrapperEl.addEventListener("transitionend",r.onSlideToWrapperTransitionEnd)),!0},slideToLoop:function(e,t,s,a){if(void 0===e&&(e=0),void 0===t&&(t=this.params.speed),void 0===s&&(s=!0),"string"==typeof e){e=parseInt(e,10)}const i=this;let r=e;return i.params.loop&&(i.virtual&&i.params.virtual.enabled?r+=i.virtual.slidesBefore:r=i.getSlideIndexByData(r)),i.slideTo(r,t,s,a)},slideNext:function(e,t,s){void 0===e&&(e=this.params.speed),void 0===t&&(t=!0);const a=this,{enabled:i,params:r,animating:n}=a;if(!i)return a;let l=r.slidesPerGroup;"auto"===r.slidesPerView&&1===r.slidesPerGroup&&r.slidesPerGroupAuto&&(l=Math.max(a.slidesPerViewDynamic("current",!0),1));const o=a.activeIndex<r.slidesPerGroupSkip?1:l,d=a.virtual&&r.virtual.enabled;if(r.loop){if(n&&!d&&r.loopPreventsSliding)return!1;a.loopFix({direction:"next"}),a._clientLeft=a.wrapperEl.clientLeft}return r.rewind&&a.isEnd?a.slideTo(0,e,t,s):a.slideTo(a.activeIndex+o,e,t,s)},slidePrev:function(e,t,s){void 0===e&&(e=this.params.speed),void 0===t&&(t=!0);const a=this,{params:i,snapGrid:r,slidesGrid:n,rtlTranslate:l,enabled:o,animating:d}=a;if(!o)return a;const c=a.virtual&&i.virtual.enabled;if(i.loop){if(d&&!c&&i.loopPreventsSliding)return!1;a.loopFix({direction:"prev"}),a._clientLeft=a.wrapperEl.clientLeft}function p(e){return e<0?-Math.floor(Math.abs(e)):Math.floor(e)}const u=p(l?a.translate:-a.translate),m=r.map((e=>p(e)));let h=r[m.indexOf(u)-1];if(void 0===h&&i.cssMode){let e;r.forEach(((t,s)=>{u>=t&&(e=s)})),void 0!==e&&(h=r[e>0?e-1:e])}let f=0;if(void 0!==h&&(f=n.indexOf(h),f<0&&(f=a.activeIndex-1),"auto"===i.slidesPerView&&1===i.slidesPerGroup&&i.slidesPerGroupAuto&&(f=f-a.slidesPerViewDynamic("previous",!0)+1,f=Math.max(f,0))),i.rewind&&a.isBeginning){const i=a.params.virtual&&a.params.virtual.enabled&&a.virtual?a.virtual.slides.length-1:a.slides.length-1;return a.slideTo(i,e,t,s)}return a.slideTo(f,e,t,s)},slideReset:function(e,t,s){return void 0===e&&(e=this.params.speed),void 0===t&&(t=!0),this.slideTo(this.activeIndex,e,t,s)},slideToClosest:function(e,t,s,a){void 0===e&&(e=this.params.speed),void 0===t&&(t=!0),void 0===a&&(a=.5);const i=this;let r=i.activeIndex;const n=Math.min(i.params.slidesPerGroupSkip,r),l=n+Math.floor((r-n)/i.params.slidesPerGroup),o=i.rtlTranslate?i.translate:-i.translate;if(o>=i.snapGrid[l]){const e=i.snapGrid[l];o-e>(i.snapGrid[l+1]-e)*a&&(r+=i.params.slidesPerGroup)}else{const e=i.snapGrid[l-1];o-e<=(i.snapGrid[l]-e)*a&&(r-=i.params.slidesPerGroup)}return r=Math.max(r,0),r=Math.min(r,i.slidesGrid.length-1),i.slideTo(r,e,t,s)},slideToClickedSlide:function(){const e=this,{params:t,slidesEl:s}=e,a="auto"===t.slidesPerView?e.slidesPerViewDynamic():t.slidesPerView;let i,r=e.clickedIndex;const l=e.isElement?"swiper-slide":`.${t.slideClass}`;if(t.loop){if(e.animating)return;i=parseInt(e.clickedSlide.getAttribute("data-swiper-slide-index"),10),t.centeredSlides?r<e.loopedSlides-a/2||r>e.slides.length-e.loopedSlides+a/2?(e.loopFix(),r=e.getSlideIndex(f(s,`${l}[data-swiper-slide-index="${i}"]`)[0]),n((()=>{e.slideTo(r)}))):e.slideTo(r):r>e.slides.length-a?(e.loopFix(),r=e.getSlideIndex(f(s,`${l}[data-swiper-slide-index="${i}"]`)[0]),n((()=>{e.slideTo(r)}))):e.slideTo(r)}else e.slideTo(r)}};var B={loopCreate:function(e){const t=this,{params:s,slidesEl:a}=t;if(!s.loop||t.virtual&&t.params.virtual.enabled)return;f(a,`.${s.slideClass}, swiper-slide`).forEach(((e,t)=>{e.setAttribute("data-swiper-slide-index",t)})),t.loopFix({slideRealIndex:e,direction:s.centeredSlides?void 0:"next"})},loopFix:function(e){let{slideRealIndex:t,slideTo:s=!0,direction:a,setTranslate:i,activeSlideIndex:r,byController:n,byMousewheel:l}=void 0===e?{}:e;const o=this;if(!o.params.loop)return;o.emit("beforeLoopFix");const{slides:d,allowSlidePrev:c,allowSlideNext:p,slidesEl:u,params:m}=o;if(o.allowSlidePrev=!0,o.allowSlideNext=!0,o.virtual&&m.virtual.enabled)return s&&(m.centeredSlides||0!==o.snapIndex?m.centeredSlides&&o.snapIndex<m.slidesPerView?o.slideTo(o.virtual.slides.length+o.snapIndex,0,!1,!0):o.snapIndex===o.snapGrid.length-1&&o.slideTo(o.virtual.slidesBefore,0,!1,!0):o.slideTo(o.virtual.slides.length,0,!1,!0)),o.allowSlidePrev=c,o.allowSlideNext=p,void o.emit("loopFix");const h="auto"===m.slidesPerView?o.slidesPerViewDynamic():Math.ceil(parseFloat(m.slidesPerView,10));let f=m.loopedSlides||h;f%m.slidesPerGroup!=0&&(f+=m.slidesPerGroup-f%m.slidesPerGroup),o.loopedSlides=f;const g=[],v=[];let w=o.activeIndex;void 0===r?r=o.getSlideIndex(o.slides.filter((e=>e.classList.contains(m.slideActiveClass)))[0]):w=r;const b="next"===a||!a,y="prev"===a||!a;let E=0,x=0;if(r<f){E=Math.max(f-r,m.slidesPerGroup);for(let e=0;e<f-r;e+=1){const t=e-Math.floor(e/d.length)*d.length;g.push(d.length-t-1)}}else if(r>o.slides.length-2*f){x=Math.max(r-(o.slides.length-2*f),m.slidesPerGroup);for(let e=0;e<x;e+=1){const t=e-Math.floor(e/d.length)*d.length;v.push(t)}}if(y&&g.forEach((e=>{u.prepend(o.slides[e])})),b&&v.forEach((e=>{u.append(o.slides[e])})),o.recalcSlides(),"auto"===m.slidesPerView&&o.updateSlides(),m.watchSlidesProgress&&o.updateSlidesOffset(),s)if(g.length>0&&y)if(void 0===t){const e=o.slidesGrid[w],t=o.slidesGrid[w+E]-e;l?o.setTranslate(o.translate-t):(o.slideTo(w+E,0,!1,!0),i&&(o.touches[o.isHorizontal()?"startX":"startY"]+=t))}else i&&o.slideToLoop(t,0,!1,!0);else if(v.length>0&&b)if(void 0===t){const e=o.slidesGrid[w],t=o.slidesGrid[w-x]-e;l?o.setTranslate(o.translate-t):(o.slideTo(w-x,0,!1,!0),i&&(o.touches[o.isHorizontal()?"startX":"startY"]+=t))}else o.slideToLoop(t,0,!1,!0);if(o.allowSlidePrev=c,o.allowSlideNext=p,o.controller&&o.controller.control&&!n){const e={slideRealIndex:t,slideTo:!1,direction:a,setTranslate:i,activeSlideIndex:r,byController:!0};Array.isArray(o.controller.control)?o.controller.control.forEach((t=>{!t.destroyed&&t.params.loop&&t.loopFix(e)})):o.controller.control instanceof o.constructor&&o.controller.control.params.loop&&o.controller.control.loopFix(e)}o.emit("loopFix")},loopDestroy:function(){const e=this,{params:t,slidesEl:s}=e;if(!t.loop||e.virtual&&e.params.virtual.enabled)return;e.recalcSlides();const a=[];e.slides.forEach((e=>{const t=void 0===e.swiperSlideIndex?1*e.getAttribute("data-swiper-slide-index"):e.swiperSlideIndex;a[t]=e})),e.slides.forEach((e=>{e.removeAttribute("data-swiper-slide-index")})),a.forEach((e=>{s.append(e)})),e.recalcSlides(),e.slideTo(e.realIndex,0)}};function H(e){const t=this,s=a(),i=r(),n=t.touchEventsData;n.evCache.push(e);const{params:o,touches:d,enabled:c}=t;if(!c)return;if(!o.simulateTouch&&"mouse"===e.pointerType)return;if(t.animating&&o.preventInteractionOnTransition)return;!t.animating&&o.cssMode&&o.loop&&t.loopFix();let p=e;p.originalEvent&&(p=p.originalEvent);let u=p.target;if("wrapper"===o.touchEventsTarget&&!t.wrapperEl.contains(u))return;if("which"in p&&3===p.which)return;if("button"in p&&p.button>0)return;if(n.isTouched&&n.isMoved)return;const m=!!o.noSwipingClass&&""!==o.noSwipingClass,h=e.composedPath?e.composedPath():e.path;m&&p.target&&p.target.shadowRoot&&h&&(u=h[0]);const f=o.noSwipingSelector?o.noSwipingSelector:`.${o.noSwipingClass}`,g=!(!p.target||!p.target.shadowRoot);if(o.noSwiping&&(g?function(e,t){return void 0===t&&(t=this),function t(s){if(!s||s===a()||s===r())return null;s.assignedSlot&&(s=s.assignedSlot);const i=s.closest(e);return i||s.getRootNode?i||t(s.getRootNode().host):null}(t)}(f,u):u.closest(f)))return void(t.allowClick=!0);if(o.swipeHandler&&!u.closest(o.swipeHandler))return;d.currentX=p.pageX,d.currentY=p.pageY;const v=d.currentX,w=d.currentY,b=o.edgeSwipeDetection||o.iOSEdgeSwipeDetection,y=o.edgeSwipeThreshold||o.iOSEdgeSwipeThreshold;if(b&&(v<=y||v>=i.innerWidth-y)){if("prevent"!==b)return;e.preventDefault()}Object.assign(n,{isTouched:!0,isMoved:!1,allowTouchCallbacks:!0,isScrolling:void 0,startMoving:void 0}),d.startX=v,d.startY=w,n.touchStartTime=l(),t.allowClick=!0,t.updateSize(),t.swipeDirection=void 0,o.threshold>0&&(n.allowThresholdMove=!1);let E=!0;u.matches(n.focusableElements)&&(E=!1,"SELECT"===u.nodeName&&(n.isTouched=!1)),s.activeElement&&s.activeElement.matches(n.focusableElements)&&s.activeElement!==u&&s.activeElement.blur();const x=E&&t.allowTouchMove&&o.touchStartPreventDefault;!o.touchStartForcePreventDefault&&!x||u.isContentEditable||p.preventDefault(),t.params.freeMode&&t.params.freeMode.enabled&&t.freeMode&&t.animating&&!o.cssMode&&t.freeMode.onTouchStart(),t.emit("touchStart",p)}function X(e){const t=a(),s=this,i=s.touchEventsData,{params:r,touches:n,rtlTranslate:o,enabled:d}=s;if(!d)return;if(!r.simulateTouch&&"mouse"===e.pointerType)return;let c=e;if(c.originalEvent&&(c=c.originalEvent),!i.isTouched)return void(i.startMoving&&i.isScrolling&&s.emit("touchMoveOpposite",c));const p=i.evCache.findIndex((e=>e.pointerId===c.pointerId));p>=0&&(i.evCache[p]=c);const u=i.evCache.length>1?i.evCache[0]:c,m=u.pageX,h=u.pageY;if(c.preventedByNestedSwiper)return n.startX=m,void(n.startY=h);if(!s.allowTouchMove)return c.target.matches(i.focusableElements)||(s.allowClick=!1),void(i.isTouched&&(Object.assign(n,{startX:m,startY:h,prevX:s.touches.currentX,prevY:s.touches.currentY,currentX:m,currentY:h}),i.touchStartTime=l()));if(r.touchReleaseOnEdges&&!r.loop)if(s.isVertical()){if(h<n.startY&&s.translate<=s.maxTranslate()||h>n.startY&&s.translate>=s.minTranslate())return i.isTouched=!1,void(i.isMoved=!1)}else if(m<n.startX&&s.translate<=s.maxTranslate()||m>n.startX&&s.translate>=s.minTranslate())return;if(t.activeElement&&c.target===t.activeElement&&c.target.matches(i.focusableElements))return i.isMoved=!0,void(s.allowClick=!1);if(i.allowTouchCallbacks&&s.emit("touchMove",c),c.targetTouches&&c.targetTouches.length>1)return;n.currentX=m,n.currentY=h;const f=n.currentX-n.startX,g=n.currentY-n.startY;if(s.params.threshold&&Math.sqrt(f**2+g**2)<s.params.threshold)return;if(void 0===i.isScrolling){let e;s.isHorizontal()&&n.currentY===n.startY||s.isVertical()&&n.currentX===n.startX?i.isScrolling=!1:f*f+g*g>=25&&(e=180*Math.atan2(Math.abs(g),Math.abs(f))/Math.PI,i.isScrolling=s.isHorizontal()?e>r.touchAngle:90-e>r.touchAngle)}if(i.isScrolling&&s.emit("touchMoveOpposite",c),void 0===i.startMoving&&(n.currentX===n.startX&&n.currentY===n.startY||(i.startMoving=!0)),i.isScrolling||s.zoom&&s.params.zoom&&s.params.zoom.enabled&&i.evCache.length>1)return void(i.isTouched=!1);if(!i.startMoving)return;s.allowClick=!1,!r.cssMode&&c.cancelable&&c.preventDefault(),r.touchMoveStopPropagation&&!r.nested&&c.stopPropagation();let v=s.isHorizontal()?f:g,w=s.isHorizontal()?n.currentX-n.previousX:n.currentY-n.previousY;r.oneWayMovement&&(v=Math.abs(v)*(o?1:-1),w=Math.abs(w)*(o?1:-1)),n.diff=v,v*=r.touchRatio,o&&(v=-v,w=-w);const b=s.touchesDirection;s.swipeDirection=v>0?"prev":"next",s.touchesDirection=w>0?"prev":"next";const y=s.params.loop&&!r.cssMode;if(!i.isMoved){if(y&&s.loopFix({direction:s.swipeDirection}),i.startTranslate=s.getTranslate(),s.setTransition(0),s.animating){const e=new window.CustomEvent("transitionend",{bubbles:!0,cancelable:!0});s.wrapperEl.dispatchEvent(e)}i.allowMomentumBounce=!1,!r.grabCursor||!0!==s.allowSlideNext&&!0!==s.allowSlidePrev||s.setGrabCursor(!0),s.emit("sliderFirstMove",c)}let E;i.isMoved&&b!==s.touchesDirection&&y&&Math.abs(v)>=1&&(s.loopFix({direction:s.swipeDirection,setTranslate:!0}),E=!0),s.emit("sliderMove",c),i.isMoved=!0,i.currentTranslate=v+i.startTranslate;let x=!0,S=r.resistanceRatio;if(r.touchReleaseOnEdges&&(S=0),v>0?(y&&!E&&i.currentTranslate>(r.centeredSlides?s.minTranslate()-s.size/2:s.minTranslate())&&s.loopFix({direction:"prev",setTranslate:!0,activeSlideIndex:0}),i.currentTranslate>s.minTranslate()&&(x=!1,r.resistance&&(i.currentTranslate=s.minTranslate()-1+(-s.minTranslate()+i.startTranslate+v)**S))):v<0&&(y&&!E&&i.currentTranslate<(r.centeredSlides?s.maxTranslate()+s.size/2:s.maxTranslate())&&s.loopFix({direction:"next",setTranslate:!0,activeSlideIndex:s.slides.length-("auto"===r.slidesPerView?s.slidesPerViewDynamic():Math.ceil(parseFloat(r.slidesPerView,10)))}),i.currentTranslate<s.maxTranslate()&&(x=!1,r.resistance&&(i.currentTranslate=s.maxTranslate()+1-(s.maxTranslate()-i.startTranslate-v)**S))),x&&(c.preventedByNestedSwiper=!0),!s.allowSlideNext&&"next"===s.swipeDirection&&i.currentTranslate<i.startTranslate&&(i.currentTranslate=i.startTranslate),!s.allowSlidePrev&&"prev"===s.swipeDirection&&i.currentTranslate>i.startTranslate&&(i.currentTranslate=i.startTranslate),s.allowSlidePrev||s.allowSlideNext||(i.currentTranslate=i.startTranslate),r.threshold>0){if(!(Math.abs(v)>r.threshold||i.allowThresholdMove))return void(i.currentTranslate=i.startTranslate);if(!i.allowThresholdMove)return i.allowThresholdMove=!0,n.startX=n.currentX,n.startY=n.currentY,i.currentTranslate=i.startTranslate,void(n.diff=s.isHorizontal()?n.currentX-n.startX:n.currentY-n.startY)}r.followFinger&&!r.cssMode&&((r.freeMode&&r.freeMode.enabled&&s.freeMode||r.watchSlidesProgress)&&(s.updateActiveIndex(),s.updateSlidesClasses()),s.params.freeMode&&r.freeMode.enabled&&s.freeMode&&s.freeMode.onTouchMove(),s.updateProgress(i.currentTranslate),s.setTranslate(i.currentTranslate))}function Y(e){const t=this,s=t.touchEventsData,a=s.evCache.findIndex((t=>t.pointerId===e.pointerId));if(a>=0&&s.evCache.splice(a,1),["pointercancel","pointerout","pointerleave"].includes(e.type)){if(!("pointercancel"===e.type&&(t.browser.isSafari||t.browser.isWebView)))return}const{params:i,touches:r,rtlTranslate:o,slidesGrid:d,enabled:c}=t;if(!c)return;if(!i.simulateTouch&&"mouse"===e.pointerType)return;let p=e;if(p.originalEvent&&(p=p.originalEvent),s.allowTouchCallbacks&&t.emit("touchEnd",p),s.allowTouchCallbacks=!1,!s.isTouched)return s.isMoved&&i.grabCursor&&t.setGrabCursor(!1),s.isMoved=!1,void(s.startMoving=!1);i.grabCursor&&s.isMoved&&s.isTouched&&(!0===t.allowSlideNext||!0===t.allowSlidePrev)&&t.setGrabCursor(!1);const u=l(),m=u-s.touchStartTime;if(t.allowClick){const e=p.path||p.composedPath&&p.composedPath();t.updateClickedSlide(e&&e[0]||p.target),t.emit("tap click",p),m<300&&u-s.lastClickTime<300&&t.emit("doubleTap doubleClick",p)}if(s.lastClickTime=l(),n((()=>{t.destroyed||(t.allowClick=!0)})),!s.isTouched||!s.isMoved||!t.swipeDirection||0===r.diff||s.currentTranslate===s.startTranslate)return s.isTouched=!1,s.isMoved=!1,void(s.startMoving=!1);let h;if(s.isTouched=!1,s.isMoved=!1,s.startMoving=!1,h=i.followFinger?o?t.translate:-t.translate:-s.currentTranslate,i.cssMode)return;if(t.params.freeMode&&i.freeMode.enabled)return void t.freeMode.onTouchEnd({currentPos:h});let f=0,g=t.slidesSizesGrid[0];for(let e=0;e<d.length;e+=e<i.slidesPerGroupSkip?1:i.slidesPerGroup){const t=e<i.slidesPerGroupSkip-1?1:i.slidesPerGroup;void 0!==d[e+t]?h>=d[e]&&h<d[e+t]&&(f=e,g=d[e+t]-d[e]):h>=d[e]&&(f=e,g=d[d.length-1]-d[d.length-2])}let v=null,w=null;i.rewind&&(t.isBeginning?w=t.params.virtual&&t.params.virtual.enabled&&t.virtual?t.virtual.slides.length-1:t.slides.length-1:t.isEnd&&(v=0));const b=(h-d[f])/g,y=f<i.slidesPerGroupSkip-1?1:i.slidesPerGroup;if(m>i.longSwipesMs){if(!i.longSwipes)return void t.slideTo(t.activeIndex);"next"===t.swipeDirection&&(b>=i.longSwipesRatio?t.slideTo(i.rewind&&t.isEnd?v:f+y):t.slideTo(f)),"prev"===t.swipeDirection&&(b>1-i.longSwipesRatio?t.slideTo(f+y):null!==w&&b<0&&Math.abs(b)>i.longSwipesRatio?t.slideTo(w):t.slideTo(f))}else{if(!i.shortSwipes)return void t.slideTo(t.activeIndex);t.navigation&&(p.target===t.navigation.nextEl||p.target===t.navigation.prevEl)?p.target===t.navigation.nextEl?t.slideTo(f+y):t.slideTo(f):("next"===t.swipeDirection&&t.slideTo(null!==v?v:f+y),"prev"===t.swipeDirection&&t.slideTo(null!==w?w:f))}}function N(){const e=this,{params:t,el:s}=e;if(s&&0===s.offsetWidth)return;t.breakpoints&&e.setBreakpoint();const{allowSlideNext:a,allowSlidePrev:i,snapGrid:r}=e,n=e.virtual&&e.params.virtual.enabled;e.allowSlideNext=!0,e.allowSlidePrev=!0,e.updateSize(),e.updateSlides(),e.updateSlidesClasses();const l=n&&t.loop;!("auto"===t.slidesPerView||t.slidesPerView>1)||!e.isEnd||e.isBeginning||e.params.centeredSlides||l?e.params.loop&&!n?e.slideToLoop(e.realIndex,0,!1,!0):e.slideTo(e.activeIndex,0,!1,!0):e.slideTo(e.slides.length-1,0,!1,!0),e.autoplay&&e.autoplay.running&&e.autoplay.paused&&(clearTimeout(e.autoplay.resizeTimeout),e.autoplay.resizeTimeout=setTimeout((()=>{e.autoplay&&e.autoplay.running&&e.autoplay.paused&&e.autoplay.resume()}),500)),e.allowSlidePrev=i,e.allowSlideNext=a,e.params.watchOverflow&&r!==e.snapGrid&&e.checkOverflow()}function q(e){const t=this;t.enabled&&(t.allowClick||(t.params.preventClicks&&e.preventDefault(),t.params.preventClicksPropagation&&t.animating&&(e.stopPropagation(),e.stopImmediatePropagation())))}function R(){const e=this,{wrapperEl:t,rtlTranslate:s,enabled:a}=e;if(!a)return;let i;e.previousTranslate=e.translate,e.isHorizontal()?e.translate=-t.scrollLeft:e.translate=-t.scrollTop,0===e.translate&&(e.translate=0),e.updateActiveIndex(),e.updateSlidesClasses();const r=e.maxTranslate()-e.minTranslate();i=0===r?0:(e.translate-e.minTranslate())/r,i!==e.progress&&e.updateProgress(s?-e.translate:e.translate),e.emit("setTranslate",e.translate,!1)}function _(e){A(this,e.target),this.update()}let V=!1;function F(){}const j=(e,t)=>{const s=a(),{params:i,el:r,wrapperEl:n,device:l}=e,o=!!i.nested,d="on"===t?"addEventListener":"removeEventListener",c=t;r[d]("pointerdown",e.onTouchStart,{passive:!1}),s[d]("pointermove",e.onTouchMove,{passive:!1,capture:o}),s[d]("pointerup",e.onTouchEnd,{passive:!0}),s[d]("pointercancel",e.onTouchEnd,{passive:!0}),s[d]("pointerout",e.onTouchEnd,{passive:!0}),s[d]("pointerleave",e.onTouchEnd,{passive:!0}),(i.preventClicks||i.preventClicksPropagation)&&r[d]("click",e.onClick,!0),i.cssMode&&n[d]("scroll",e.onScroll),i.updateOnWindowResize?e[c](l.ios||l.android?"resize orientationchange observerUpdate":"resize observerUpdate",N,!0):e[c]("observerUpdate",N,!0),r[d]("load",e.onLoad,{capture:!0})};const W=(e,t)=>e.grid&&t.grid&&t.grid.rows>1;var U={init:!0,direction:"horizontal",oneWayMovement:!1,touchEventsTarget:"wrapper",initialSlide:0,speed:300,cssMode:!1,updateOnWindowResize:!0,resizeObserver:!0,nested:!1,createElements:!1,enabled:!0,focusableElements:"input, select, option, textarea, button, video, label",width:null,height:null,preventInteractionOnTransition:!1,userAgent:null,url:null,edgeSwipeDetection:!1,edgeSwipeThreshold:20,autoHeight:!1,setWrapperSize:!1,virtualTranslate:!1,effect:"slide",breakpoints:void 0,breakpointsBase:"window",spaceBetween:0,slidesPerView:1,slidesPerGroup:1,slidesPerGroupSkip:0,slidesPerGroupAuto:!1,centeredSlides:!1,centeredSlidesBounds:!1,slidesOffsetBefore:0,slidesOffsetAfter:0,normalizeSlideIndex:!0,centerInsufficientSlides:!1,watchOverflow:!0,roundLengths:!1,touchRatio:1,touchAngle:45,simulateTouch:!0,shortSwipes:!0,longSwipes:!0,longSwipesRatio:.5,longSwipesMs:300,followFinger:!0,allowTouchMove:!0,threshold:5,touchMoveStopPropagation:!1,touchStartPreventDefault:!0,touchStartForcePreventDefault:!1,touchReleaseOnEdges:!1,uniqueNavElements:!0,resistance:!0,resistanceRatio:.85,watchSlidesProgress:!1,grabCursor:!1,preventClicks:!0,preventClicksPropagation:!0,slideToClickedSlide:!1,loop:!1,loopedSlides:null,loopPreventsSliding:!0,rewind:!1,allowSlidePrev:!0,allowSlideNext:!0,swipeHandler:null,noSwiping:!0,noSwipingClass:"swiper-no-swiping",noSwipingSelector:null,passiveListeners:!0,maxBackfaceHiddenSlides:10,containerModifierClass:"swiper-",slideClass:"swiper-slide",slideActiveClass:"swiper-slide-active",slideVisibleClass:"swiper-slide-visible",slideNextClass:"swiper-slide-next",slidePrevClass:"swiper-slide-prev",wrapperClass:"swiper-wrapper",lazyPreloaderClass:"swiper-lazy-preloader",lazyPreloadPrevNext:0,runCallbacksOnInit:!0,_emitClasses:!1};function K(e,t){return function(s){void 0===s&&(s={});const a=Object.keys(s)[0],i=s[a];"object"==typeof i&&null!==i?(["navigation","pagination","scrollbar"].indexOf(a)>=0&&!0===e[a]&&(e[a]={auto:!0}),a in e&&"enabled"in i?(!0===e[a]&&(e[a]={enabled:!0}),"object"!=typeof e[a]||"enabled"in e[a]||(e[a].enabled=!0),e[a]||(e[a]={enabled:!1}),p(t,s)):p(t,s)):p(t,s)}}const Z={eventsEmitter:z,update:k,translate:O,transition:{setTransition:function(e,t){const s=this;s.params.cssMode||(s.wrapperEl.style.transitionDuration=`${e}ms`),s.emit("setTransition",e,t)},transitionStart:function(e,t){void 0===e&&(e=!0);const s=this,{params:a}=s;a.cssMode||(a.autoHeight&&s.updateAutoHeight(),D({swiper:s,runCallbacks:e,direction:t,step:"Start"}))},transitionEnd:function(e,t){void 0===e&&(e=!0);const s=this,{params:a}=s;s.animating=!1,a.cssMode||(s.setTransition(0),D({swiper:s,runCallbacks:e,direction:t,step:"End"}))}},slide:G,loop:B,grabCursor:{setGrabCursor:function(e){const t=this;if(!t.params.simulateTouch||t.params.watchOverflow&&t.isLocked||t.params.cssMode)return;const s="container"===t.params.touchEventsTarget?t.el:t.wrapperEl;t.isElement&&(t.__preventObserver__=!0),s.style.cursor="move",s.style.cursor=e?"grabbing":"grab",t.isElement&&requestAnimationFrame((()=>{t.__preventObserver__=!1}))},unsetGrabCursor:function(){const e=this;e.params.watchOverflow&&e.isLocked||e.params.cssMode||(e.isElement&&(e.__preventObserver__=!0),e["container"===e.params.touchEventsTarget?"el":"wrapperEl"].style.cursor="",e.isElement&&requestAnimationFrame((()=>{e.__preventObserver__=!1})))}},events:{attachEvents:function(){const e=this,t=a(),{params:s}=e;e.onTouchStart=H.bind(e),e.onTouchMove=X.bind(e),e.onTouchEnd=Y.bind(e),s.cssMode&&(e.onScroll=R.bind(e)),e.onClick=q.bind(e),e.onLoad=_.bind(e),V||(t.addEventListener("touchstart",F),V=!0),j(e,"on")},detachEvents:function(){j(this,"off")}},breakpoints:{setBreakpoint:function(){const e=this,{realIndex:t,initialized:s,params:a,el:i}=e,r=a.breakpoints;if(!r||r&&0===Object.keys(r).length)return;const n=e.getBreakpoint(r,e.params.breakpointsBase,e.el);if(!n||e.currentBreakpoint===n)return;const l=(n in r?r[n]:void 0)||e.originalParams,o=W(e,a),d=W(e,l),c=a.enabled;o&&!d?(i.classList.remove(`${a.containerModifierClass}grid`,`${a.containerModifierClass}grid-column`),e.emitContainerClasses()):!o&&d&&(i.classList.add(`${a.containerModifierClass}grid`),(l.grid.fill&&"column"===l.grid.fill||!l.grid.fill&&"column"===a.grid.fill)&&i.classList.add(`${a.containerModifierClass}grid-column`),e.emitContainerClasses()),["navigation","pagination","scrollbar"].forEach((t=>{const s=a[t]&&a[t].enabled,i=l[t]&&l[t].enabled;s&&!i&&e[t].disable(),!s&&i&&e[t].enable()}));const u=l.direction&&l.direction!==a.direction,m=a.loop&&(l.slidesPerView!==a.slidesPerView||u);u&&s&&e.changeDirection(),p(e.params,l);const h=e.params.enabled;Object.assign(e,{allowTouchMove:e.params.allowTouchMove,allowSlideNext:e.params.allowSlideNext,allowSlidePrev:e.params.allowSlidePrev}),c&&!h?e.disable():!c&&h&&e.enable(),e.currentBreakpoint=n,e.emit("_beforeBreakpoint",l),m&&s&&(e.loopDestroy(),e.loopCreate(t),e.updateSlides()),e.emit("breakpoint",l)},getBreakpoint:function(e,t,s){if(void 0===t&&(t="window"),!e||"container"===t&&!s)return;let a=!1;const i=r(),n="window"===t?i.innerHeight:s.clientHeight,l=Object.keys(e).map((e=>{if("string"==typeof e&&0===e.indexOf("@")){const t=parseFloat(e.substr(1));return{value:n*t,point:e}}return{value:e,point:e}}));l.sort(((e,t)=>parseInt(e.value,10)-parseInt(t.value,10)));for(let e=0;e<l.length;e+=1){const{point:r,value:n}=l[e];"window"===t?i.matchMedia(`(min-width: ${n}px)`).matches&&(a=r):n<=s.clientWidth&&(a=r)}return a||"max"}},checkOverflow:{checkOverflow:function(){const e=this,{isLocked:t,params:s}=e,{slidesOffsetBefore:a}=s;if(a){const t=e.slides.length-1,s=e.slidesGrid[t]+e.slidesSizesGrid[t]+2*a;e.isLocked=e.size>s}else e.isLocked=1===e.snapGrid.length;!0===s.allowSlideNext&&(e.allowSlideNext=!e.isLocked),!0===s.allowSlidePrev&&(e.allowSlidePrev=!e.isLocked),t&&t!==e.isLocked&&(e.isEnd=!1),t!==e.isLocked&&e.emit(e.isLocked?"lock":"unlock")}},classes:{addClasses:function(){const e=this,{classNames:t,params:s,rtl:a,el:i,device:r}=e,n=function(e,t){const s=[];return e.forEach((e=>{"object"==typeof e?Object.keys(e).forEach((a=>{e[a]&&s.push(t+a)})):"string"==typeof e&&s.push(t+e)})),s}(["initialized",s.direction,{"free-mode":e.params.freeMode&&s.freeMode.enabled},{autoheight:s.autoHeight},{rtl:a},{grid:s.grid&&s.grid.rows>1},{"grid-column":s.grid&&s.grid.rows>1&&"column"===s.grid.fill},{android:r.android},{ios:r.ios},{"css-mode":s.cssMode},{centered:s.cssMode&&s.centeredSlides},{"watch-progress":s.watchSlidesProgress}],s.containerModifierClass);t.push(...n),i.classList.add(...t),e.emitContainerClasses()},removeClasses:function(){const{el:e,classNames:t}=this;e.classList.remove(...t),this.emitContainerClasses()}}},Q={};class J{constructor(){let e,t;for(var s=arguments.length,i=new Array(s),r=0;r<s;r++)i[r]=arguments[r];1===i.length&&i[0].constructor&&"Object"===Object.prototype.toString.call(i[0]).slice(8,-1)?t=i[0]:[e,t]=i,t||(t={}),t=p({},t),e&&!t.el&&(t.el=e);const n=a();if(t.el&&"string"==typeof t.el&&n.querySelectorAll(t.el).length>1){const e=[];return n.querySelectorAll(t.el).forEach((s=>{const a=p({},t,{el:s});e.push(new J(a))})),e}const l=this;l.__swiper__=!0,l.support=C(),l.device=P({userAgent:t.userAgent}),l.browser=L(),l.eventsListeners={},l.eventsAnyListeners=[],l.modules=[...l.__modules__],t.modules&&Array.isArray(t.modules)&&l.modules.push(...t.modules);const o={};l.modules.forEach((e=>{e({params:t,swiper:l,extendParams:K(t,o),on:l.on.bind(l),once:l.once.bind(l),off:l.off.bind(l),emit:l.emit.bind(l)})}));const d=p({},U,o);return l.params=p({},d,Q,t),l.originalParams=p({},l.params),l.passedParams=p({},t),l.params&&l.params.on&&Object.keys(l.params.on).forEach((e=>{l.on(e,l.params.on[e])})),l.params&&l.params.onAny&&l.onAny(l.params.onAny),Object.assign(l,{enabled:l.params.enabled,el:e,classNames:[],slides:[],slidesGrid:[],snapGrid:[],slidesSizesGrid:[],isHorizontal:()=>"horizontal"===l.params.direction,isVertical:()=>"vertical"===l.params.direction,activeIndex:0,realIndex:0,isBeginning:!0,isEnd:!1,translate:0,previousTranslate:0,progress:0,velocity:0,animating:!1,cssOverflowAdjustment(){return Math.trunc(this.translate/2**23)*2**23},allowSlideNext:l.params.allowSlideNext,allowSlidePrev:l.params.allowSlidePrev,touchEventsData:{isTouched:void 0,isMoved:void 0,allowTouchCallbacks:void 0,touchStartTime:void 0,isScrolling:void 0,currentTranslate:void 0,startTranslate:void 0,allowThresholdMove:void 0,focusableElements:l.params.focusableElements,lastClickTime:0,clickTimeout:void 0,velocities:[],allowMomentumBounce:void 0,startMoving:void 0,evCache:[]},allowClick:!0,allowTouchMove:l.params.allowTouchMove,touches:{startX:0,startY:0,currentX:0,currentY:0,diff:0},imagesToLoad:[],imagesLoaded:0}),l.emit("_swiper"),l.params.init&&l.init(),l}getSlideIndex(e){const{slidesEl:t,params:s}=this,a=b(f(t,`.${s.slideClass}, swiper-slide`)[0]);return b(e)-a}getSlideIndexByData(e){return this.getSlideIndex(this.slides.filter((t=>1*t.getAttribute("data-swiper-slide-index")===e))[0])}recalcSlides(){const{slidesEl:e,params:t}=this;this.slides=f(e,`.${t.slideClass}, swiper-slide`)}enable(){const e=this;e.enabled||(e.enabled=!0,e.params.grabCursor&&e.setGrabCursor(),e.emit("enable"))}disable(){const e=this;e.enabled&&(e.enabled=!1,e.params.grabCursor&&e.unsetGrabCursor(),e.emit("disable"))}setProgress(e,t){const s=this;e=Math.min(Math.max(e,0),1);const a=s.minTranslate(),i=(s.maxTranslate()-a)*e+a;s.translateTo(i,void 0===t?0:t),s.updateActiveIndex(),s.updateSlidesClasses()}emitContainerClasses(){const e=this;if(!e.params._emitClasses||!e.el)return;const t=e.el.className.split(" ").filter((t=>0===t.indexOf("swiper")||0===t.indexOf(e.params.containerModifierClass)));e.emit("_containerClasses",t.join(" "))}getSlideClasses(e){const t=this;return t.destroyed?"":e.className.split(" ").filter((e=>0===e.indexOf("swiper-slide")||0===e.indexOf(t.params.slideClass))).join(" ")}emitSlidesClasses(){const e=this;if(!e.params._emitClasses||!e.el)return;const t=[];e.slides.forEach((s=>{const a=e.getSlideClasses(s);t.push({slideEl:s,classNames:a}),e.emit("_slideClass",s,a)})),e.emit("_slideClasses",t)}slidesPerViewDynamic(e,t){void 0===e&&(e="current"),void 0===t&&(t=!1);const{params:s,slides:a,slidesGrid:i,slidesSizesGrid:r,size:n,activeIndex:l}=this;let o=1;if(s.centeredSlides){let e,t=a[l].swiperSlideSize;for(let s=l+1;s<a.length;s+=1)a[s]&&!e&&(t+=a[s].swiperSlideSize,o+=1,t>n&&(e=!0));for(let s=l-1;s>=0;s-=1)a[s]&&!e&&(t+=a[s].swiperSlideSize,o+=1,t>n&&(e=!0))}else if("current"===e)for(let e=l+1;e<a.length;e+=1){(t?i[e]+r[e]-i[l]<n:i[e]-i[l]<n)&&(o+=1)}else for(let e=l-1;e>=0;e-=1){i[l]-i[e]<n&&(o+=1)}return o}update(){const e=this;if(!e||e.destroyed)return;const{snapGrid:t,params:s}=e;function a(){const t=e.rtlTranslate?-1*e.translate:e.translate,s=Math.min(Math.max(t,e.maxTranslate()),e.minTranslate());e.setTranslate(s),e.updateActiveIndex(),e.updateSlidesClasses()}let i;if(s.breakpoints&&e.setBreakpoint(),[...e.el.querySelectorAll('[loading="lazy"]')].forEach((t=>{t.complete&&A(e,t)})),e.updateSize(),e.updateSlides(),e.updateProgress(),e.updateSlidesClasses(),e.params.freeMode&&e.params.freeMode.enabled)a(),e.params.autoHeight&&e.updateAutoHeight();else{if(("auto"===e.params.slidesPerView||e.params.slidesPerView>1)&&e.isEnd&&!e.params.centeredSlides){const t=e.virtual&&e.params.virtual.enabled?e.virtual.slides:e.slides;i=e.slideTo(t.length-1,0,!1,!0)}else i=e.slideTo(e.activeIndex,0,!1,!0);i||a()}s.watchOverflow&&t!==e.snapGrid&&e.checkOverflow(),e.emit("update")}changeDirection(e,t){void 0===t&&(t=!0);const s=this,a=s.params.direction;return e||(e="horizontal"===a?"vertical":"horizontal"),e===a||"horizontal"!==e&&"vertical"!==e||(s.el.classList.remove(`${s.params.containerModifierClass}${a}`),s.el.classList.add(`${s.params.containerModifierClass}${e}`),s.emitContainerClasses(),s.params.direction=e,s.slides.forEach((t=>{"vertical"===e?t.style.width="":t.style.height=""})),s.emit("changeDirection"),t&&s.update()),s}changeLanguageDirection(e){const t=this;t.rtl&&"rtl"===e||!t.rtl&&"ltr"===e||(t.rtl="rtl"===e,t.rtlTranslate="horizontal"===t.params.direction&&t.rtl,t.rtl?(t.el.classList.add(`${t.params.containerModifierClass}rtl`),t.el.dir="rtl"):(t.el.classList.remove(`${t.params.containerModifierClass}rtl`),t.el.dir="ltr"),t.update())}mount(e){const t=this;if(t.mounted)return!0;let s=e||t.params.el;if("string"==typeof s&&(s=document.querySelector(s)),!s)return!1;s.swiper=t,s.shadowEl&&(t.isElement=!0);const a=()=>`.${(t.params.wrapperClass||"").trim().split(" ").join(".")}`;let i=(()=>{if(s&&s.shadowRoot&&s.shadowRoot.querySelector){return s.shadowRoot.querySelector(a())}return f(s,a())[0]})();return!i&&t.params.createElements&&(i=g("div",t.params.wrapperClass),s.append(i),f(s,`.${t.params.slideClass}`).forEach((e=>{i.append(e)}))),Object.assign(t,{el:s,wrapperEl:i,slidesEl:t.isElement?s:i,mounted:!0,rtl:"rtl"===s.dir.toLowerCase()||"rtl"===w(s,"direction"),rtlTranslate:"horizontal"===t.params.direction&&("rtl"===s.dir.toLowerCase()||"rtl"===w(s,"direction")),wrongRTL:"-webkit-box"===w(i,"display")}),!0}init(e){const t=this;if(t.initialized)return t;return!1===t.mount(e)||(t.emit("beforeInit"),t.params.breakpoints&&t.setBreakpoint(),t.addClasses(),t.updateSize(),t.updateSlides(),t.params.watchOverflow&&t.checkOverflow(),t.params.grabCursor&&t.enabled&&t.setGrabCursor(),t.params.loop&&t.virtual&&t.params.virtual.enabled?t.slideTo(t.params.initialSlide+t.virtual.slidesBefore,0,t.params.runCallbacksOnInit,!1,!0):t.slideTo(t.params.initialSlide,0,t.params.runCallbacksOnInit,!1,!0),t.params.loop&&t.loopCreate(),t.attachEvents(),[...t.el.querySelectorAll('[loading="lazy"]')].forEach((e=>{e.complete?A(t,e):e.addEventListener("load",(e=>{A(t,e.target)}))})),I(t),t.initialized=!0,I(t),t.emit("init"),t.emit("afterInit")),t}destroy(e,t){void 0===e&&(e=!0),void 0===t&&(t=!0);const s=this,{params:a,el:i,wrapperEl:r,slides:n}=s;return void 0===s.params||s.destroyed||(s.emit("beforeDestroy"),s.initialized=!1,s.detachEvents(),a.loop&&s.loopDestroy(),t&&(s.removeClasses(),i.removeAttribute("style"),r.removeAttribute("style"),n&&n.length&&n.forEach((e=>{e.classList.remove(a.slideVisibleClass,a.slideActiveClass,a.slideNextClass,a.slidePrevClass),e.removeAttribute("style"),e.removeAttribute("data-swiper-slide-index")}))),s.emit("destroy"),Object.keys(s.eventsListeners).forEach((e=>{s.off(e)})),!1!==e&&(s.el.swiper=null,function(e){const t=e;Object.keys(t).forEach((e=>{try{t[e]=null}catch(e){}try{delete t[e]}catch(e){}}))}(s)),s.destroyed=!0),null}static extendDefaults(e){p(Q,e)}static get extendedDefaults(){return Q}static get defaults(){return U}static installModule(e){J.prototype.__modules__||(J.prototype.__modules__=[]);const t=J.prototype.__modules__;"function"==typeof e&&t.indexOf(e)<0&&t.push(e)}static use(e){return Array.isArray(e)?(e.forEach((e=>J.installModule(e))),J):(J.installModule(e),J)}}function ee(e,t,s,a){return e.params.createElements&&Object.keys(a).forEach((i=>{if(!s[i]&&!0===s.auto){let r=f(e.el,`.${a[i]}`)[0];r||(r=g("div",a[i]),r.className=a[i],e.el.append(r)),s[i]=r,t[i]=r}})),s}function te(e){return void 0===e&&(e=""),`.${e.trim().replace(/([\.:!+\/])/g,"\\$1").replace(/ /g,".")}`}function se(e){const t=this,{params:s,slidesEl:a}=t;s.loop&&t.loopDestroy();const i=e=>{if("string"==typeof e){const t=document.createElement("div");t.innerHTML=e,a.append(t.children[0]),t.innerHTML=""}else a.append(e)};if("object"==typeof e&&"length"in e)for(let t=0;t<e.length;t+=1)e[t]&&i(e[t]);else i(e);t.recalcSlides(),s.loop&&t.loopCreate(),s.observer&&!t.isElement||t.update()}function ae(e){const t=this,{params:s,activeIndex:a,slidesEl:i}=t;s.loop&&t.loopDestroy();let r=a+1;const n=e=>{if("string"==typeof e){const t=document.createElement("div");t.innerHTML=e,i.prepend(t.children[0]),t.innerHTML=""}else i.prepend(e)};if("object"==typeof e&&"length"in e){for(let t=0;t<e.length;t+=1)e[t]&&n(e[t]);r=a+e.length}else n(e);t.recalcSlides(),s.loop&&t.loopCreate(),s.observer&&!t.isElement||t.update(),t.slideTo(r,0,!1)}function ie(e,t){const s=this,{params:a,activeIndex:i,slidesEl:r}=s;let n=i;a.loop&&(n-=s.loopedSlides,s.loopDestroy(),s.recalcSlides());const l=s.slides.length;if(e<=0)return void s.prependSlide(t);if(e>=l)return void s.appendSlide(t);let o=n>e?n+1:n;const d=[];for(let t=l-1;t>=e;t-=1){const e=s.slides[t];e.remove(),d.unshift(e)}if("object"==typeof t&&"length"in t){for(let e=0;e<t.length;e+=1)t[e]&&r.append(t[e]);o=n>e?n+t.length:n}else r.append(t);for(let e=0;e<d.length;e+=1)r.append(d[e]);s.recalcSlides(),a.loop&&s.loopCreate(),a.observer&&!s.isElement||s.update(),a.loop?s.slideTo(o+s.loopedSlides,0,!1):s.slideTo(o,0,!1)}function re(e){const t=this,{params:s,activeIndex:a}=t;let i=a;s.loop&&(i-=t.loopedSlides,t.loopDestroy());let r,n=i;if("object"==typeof e&&"length"in e){for(let s=0;s<e.length;s+=1)r=e[s],t.slides[r]&&t.slides[r].remove(),r<n&&(n-=1);n=Math.max(n,0)}else r=e,t.slides[r]&&t.slides[r].remove(),r<n&&(n-=1),n=Math.max(n,0);t.recalcSlides(),s.loop&&t.loopCreate(),s.observer&&!t.isElement||t.update(),s.loop?t.slideTo(n+t.loopedSlides,0,!1):t.slideTo(n,0,!1)}function ne(){const e=this,t=[];for(let s=0;s<e.slides.length;s+=1)t.push(s);e.removeSlide(t)}function le(e){const{effect:t,swiper:s,on:a,setTranslate:i,setTransition:r,overwriteParams:n,perspective:l,recreateShadows:o,getEffectParams:d}=e;let c;a("beforeInit",(()=>{if(s.params.effect!==t)return;s.classNames.push(`${s.params.containerModifierClass}${t}`),l&&l()&&s.classNames.push(`${s.params.containerModifierClass}3d`);const e=n?n():{};Object.assign(s.params,e),Object.assign(s.originalParams,e)})),a("setTranslate",(()=>{s.params.effect===t&&i()})),a("setTransition",((e,a)=>{s.params.effect===t&&r(a)})),a("transitionEnd",(()=>{if(s.params.effect===t&&o){if(!d||!d().slideShadows)return;s.slides.forEach((e=>{e.querySelectorAll(".swiper-slide-shadow-top, .swiper-slide-shadow-right, .swiper-slide-shadow-bottom, .swiper-slide-shadow-left").forEach((e=>e.remove()))})),o()}})),a("virtualUpdate",(()=>{s.params.effect===t&&(s.slides.length||(c=!0),requestAnimationFrame((()=>{c&&s.slides&&s.slides.length&&(i(),c=!1)})))}))}function oe(e,t){const s=h(t);return s!==t&&(s.style.backfaceVisibility="hidden",s.style["-webkit-backface-visibility"]="hidden"),s}function de(e){let{swiper:t,duration:s,transformElements:a,allSlides:i}=e;const{activeIndex:r}=t;if(t.params.virtualTranslate&&0!==s){let e,s=!1;e=i?a:a.filter((e=>{const s=e.classList.contains("swiper-slide-transform")?(e=>{if(!e.parentElement)return t.slides.filter((t=>t.shadowEl&&t.shadowEl===e.parentNode))[0];return e.parentElement})(e):e;return t.getSlideIndex(s)===r})),e.forEach((e=>{E(e,(()=>{if(s)return;if(!t||t.destroyed)return;s=!0,t.animating=!1;const e=new window.CustomEvent("transitionend",{bubbles:!0,cancelable:!0});t.wrapperEl.dispatchEvent(e)}))}))}}function ce(e,t,s){const a="swiper-slide-shadow"+(s?`-${s}`:""),i=h(t);let r=i.querySelector(`.${a}`);return r||(r=g("div","swiper-slide-shadow"+(s?`-${s}`:"")),i.append(r)),r}Object.keys(Z).forEach((e=>{Object.keys(Z[e]).forEach((t=>{J.prototype[t]=Z[e][t]}))})),J.use([function(e){let{swiper:t,on:s,emit:a}=e;const i=r();let n=null,l=null;const o=()=>{t&&!t.destroyed&&t.initialized&&(a("beforeResize"),a("resize"))},d=()=>{t&&!t.destroyed&&t.initialized&&a("orientationchange")};s("init",(()=>{t.params.resizeObserver&&void 0!==i.ResizeObserver?t&&!t.destroyed&&t.initialized&&(n=new ResizeObserver((e=>{l=i.requestAnimationFrame((()=>{const{width:s,height:a}=t;let i=s,r=a;e.forEach((e=>{let{contentBoxSize:s,contentRect:a,target:n}=e;n&&n!==t.el||(i=a?a.width:(s[0]||s).inlineSize,r=a?a.height:(s[0]||s).blockSize)})),i===s&&r===a||o()}))})),n.observe(t.el)):(i.addEventListener("resize",o),i.addEventListener("orientationchange",d))})),s("destroy",(()=>{l&&i.cancelAnimationFrame(l),n&&n.unobserve&&t.el&&(n.unobserve(t.el),n=null),i.removeEventListener("resize",o),i.removeEventListener("orientationchange",d)}))},function(e){let{swiper:t,extendParams:s,on:a,emit:i}=e;const n=[],l=r(),o=function(e,s){void 0===s&&(s={});const a=new(l.MutationObserver||lkitMutationObserver)((e=>{if(t.__preventObserver__)return;if(1===e.length)return void i("observerUpdate",e[0]);const s=function(){i("observerUpdate",e[0])};l.requestAnimationFrame?l.requestAnimationFrame(s):l.setTimeout(s,0)}));a.observe(e,{attributes:void 0===s.attributes||s.attributes,childList:void 0===s.childList||s.childList,characterData:void 0===s.characterData||s.characterData}),n.push(a)};s({observer:!1,observeParents:!1,observeSlideChildren:!1}),a("init",(()=>{if(t.params.observer){if(t.params.observeParents){const e=y(t.el);for(let t=0;t<e.length;t+=1)o(e[t])}o(t.el,{childList:t.params.observeSlideChildren}),o(t.wrapperEl,{attributes:!1})}})),a("destroy",(()=>{n.forEach((e=>{e.disconnect()})),n.splice(0,n.length)}))}]);const pe=[function(e){let t,{swiper:s,extendParams:i,on:r,emit:n}=e;i({virtual:{enabled:!1,slides:[],cache:!0,renderSlide:null,renderExternal:null,renderExternalUpdate:!0,addSlidesBefore:0,addSlidesAfter:0}});const l=a();s.virtual={cache:{},from:void 0,to:void 0,slides:[],offset:0,slidesGrid:[]};const o=l.createElement("div");function d(e,t){const a=s.params.virtual;if(a.cache&&s.virtual.cache[t])return s.virtual.cache[t];let i;return a.renderSlide?(i=a.renderSlide.call(s,e,t),"string"==typeof i&&(o.innerHTML=i,i=o.children[0])):i=s.isElement?g("swiper-slide"):g("div",s.params.slideClass),i.setAttribute("data-swiper-slide-index",t),a.renderSlide||(i.innerHTML=e),a.cache&&(s.virtual.cache[t]=i),i}function c(e){const{slidesPerView:t,slidesPerGroup:a,centeredSlides:i,loop:r}=s.params,{addSlidesBefore:l,addSlidesAfter:o}=s.params.virtual,{from:c,to:p,slides:u,slidesGrid:m,offset:h}=s.virtual;s.params.cssMode||s.updateActiveIndex();const g=s.activeIndex||0;let v,w,b;v=s.rtlTranslate?"right":s.isHorizontal()?"left":"top",i?(w=Math.floor(t/2)+a+o,b=Math.floor(t/2)+a+l):(w=t+(a-1)+o,b=(r?t:a)+l);let y=g-b,E=g+w;r||(y=Math.max(y,0),E=Math.min(E,u.length-1));let x=(s.slidesGrid[y]||0)-(s.slidesGrid[0]||0);function S(){s.updateSlides(),s.updateProgress(),s.updateSlidesClasses(),n("virtualUpdate")}if(r&&g>=b?(y-=b,i||(x+=s.slidesGrid[0])):r&&g<b&&(y=-b,i&&(x+=s.slidesGrid[0])),Object.assign(s.virtual,{from:y,to:E,offset:x,slidesGrid:s.slidesGrid,slidesBefore:b,slidesAfter:w}),c===y&&p===E&&!e)return s.slidesGrid!==m&&x!==h&&s.slides.forEach((e=>{e.style[v]=x-Math.abs(s.cssOverflowAdjustment())+"px"})),s.updateProgress(),void n("virtualUpdate");if(s.params.virtual.renderExternal)return s.params.virtual.renderExternal.call(s,{offset:x,from:y,to:E,slides:function(){const e=[];for(let t=y;t<=E;t+=1)e.push(u[t]);return e}()}),void(s.params.virtual.renderExternalUpdate?S():n("virtualUpdate"));const T=[],M=[],C=e=>{let t=e;return e<0?t=u.length+e:t>=u.length&&(t-=u.length),t};if(e)s.slidesEl.querySelectorAll(`.${s.params.slideClass}, swiper-slide`).forEach((e=>{e.remove()}));else for(let e=c;e<=p;e+=1)if(e<y||e>E){const t=C(e);s.slidesEl.querySelectorAll(`.${s.params.slideClass}[data-swiper-slide-index="${t}"], swiper-slide[data-swiper-slide-index="${t}"]`).forEach((e=>{e.remove()}))}const P=r?-u.length:0,L=r?2*u.length:u.length;for(let t=P;t<L;t+=1)if(t>=y&&t<=E){const s=C(t);void 0===p||e?M.push(s):(t>p&&M.push(s),t<c&&T.push(s))}if(M.forEach((e=>{s.slidesEl.append(d(u[e],e))})),r)for(let e=T.length-1;e>=0;e-=1){const t=T[e];s.slidesEl.prepend(d(u[t],t))}else T.sort(((e,t)=>t-e)),T.forEach((e=>{s.slidesEl.prepend(d(u[e],e))}));f(s.slidesEl,".swiper-slide, swiper-slide").forEach((e=>{e.style[v]=x-Math.abs(s.cssOverflowAdjustment())+"px"})),S()}r("beforeInit",(()=>{if(!s.params.virtual.enabled)return;let e;if(void 0===s.passedParams.virtual.slides){const t=[...s.slidesEl.children].filter((e=>e.matches(`.${s.params.slideClass}, swiper-slide`)));t&&t.length&&(s.virtual.slides=[...t],e=!0,t.forEach(((e,t)=>{e.setAttribute("data-swiper-slide-index",t),s.virtual.cache[t]=e,e.remove()})))}e||(s.virtual.slides=s.params.virtual.slides),s.classNames.push(`${s.params.containerModifierClass}virtual`),s.params.watchSlidesProgress=!0,s.originalParams.watchSlidesProgress=!0,s.params.initialSlide||c()})),r("setTranslate",(()=>{s.params.virtual.enabled&&(s.params.cssMode&&!s._immediateVirtual?(clearTimeout(t),t=setTimeout((()=>{c()}),100)):c())})),r("init update resize",(()=>{s.params.virtual.enabled&&s.params.cssMode&&u(s.wrapperEl,"--swiper-virtual-size",`${s.virtualSize}px`)})),Object.assign(s.virtual,{appendSlide:function(e){if("object"==typeof e&&"length"in e)for(let t=0;t<e.length;t+=1)e[t]&&s.virtual.slides.push(e[t]);else s.virtual.slides.push(e);c(!0)},prependSlide:function(e){const t=s.activeIndex;let a=t+1,i=1;if(Array.isArray(e)){for(let t=0;t<e.length;t+=1)e[t]&&s.virtual.slides.unshift(e[t]);a=t+e.length,i=e.length}else s.virtual.slides.unshift(e);if(s.params.virtual.cache){const e=s.virtual.cache,t={};Object.keys(e).forEach((s=>{const a=e[s],r=a.getAttribute("data-swiper-slide-index");r&&a.setAttribute("data-swiper-slide-index",parseInt(r,10)+i),t[parseInt(s,10)+i]=a})),s.virtual.cache=t}c(!0),s.slideTo(a,0)},removeSlide:function(e){if(null==e)return;let t=s.activeIndex;if(Array.isArray(e))for(let a=e.length-1;a>=0;a-=1)s.virtual.slides.splice(e[a],1),s.params.virtual.cache&&delete s.virtual.cache[e[a]],e[a]<t&&(t-=1),t=Math.max(t,0);else s.virtual.slides.splice(e,1),s.params.virtual.cache&&delete s.virtual.cache[e],e<t&&(t-=1),t=Math.max(t,0);c(!0),s.slideTo(t,0)},removeAllSlides:function(){s.virtual.slides=[],s.params.virtual.cache&&(s.virtual.cache={}),c(!0),s.slideTo(0,0)},update:c})},function(e){let{swiper:t,extendParams:s,on:i,emit:n}=e;const l=a(),o=r();function d(e){if(!t.enabled)return;const{rtlTranslate:s}=t;let a=e;a.originalEvent&&(a=a.originalEvent);const i=a.keyCode||a.charCode,r=t.params.keyboard.pageUpDown,d=r&&33===i,c=r&&34===i,p=37===i,u=39===i,m=38===i,h=40===i;if(!t.allowSlideNext&&(t.isHorizontal()&&u||t.isVertical()&&h||c))return!1;if(!t.allowSlidePrev&&(t.isHorizontal()&&p||t.isVertical()&&m||d))return!1;if(!(a.shiftKey||a.altKey||a.ctrlKey||a.metaKey||l.activeElement&&l.activeElement.nodeName&&("input"===l.activeElement.nodeName.toLowerCase()||"textarea"===l.activeElement.nodeName.toLowerCase()))){if(t.params.keyboard.onlyInViewport&&(d||c||p||u||m||h)){let e=!1;if(y(t.el,`.${t.params.slideClass}, swiper-slide`).length>0&&0===y(t.el,`.${t.params.slideActiveClass}`).length)return;const a=t.el,i=a.clientWidth,r=a.clientHeight,n=o.innerWidth,l=o.innerHeight,d=v(a);s&&(d.left-=a.scrollLeft);const c=[[d.left,d.top],[d.left+i,d.top],[d.left,d.top+r],[d.left+i,d.top+r]];for(let t=0;t<c.length;t+=1){const s=c[t];if(s[0]>=0&&s[0]<=n&&s[1]>=0&&s[1]<=l){if(0===s[0]&&0===s[1])continue;e=!0}}if(!e)return}t.isHorizontal()?((d||c||p||u)&&(a.preventDefault?a.preventDefault():a.returnValue=!1),((c||u)&&!s||(d||p)&&s)&&t.slideNext(),((d||p)&&!s||(c||u)&&s)&&t.slidePrev()):((d||c||m||h)&&(a.preventDefault?a.preventDefault():a.returnValue=!1),(c||h)&&t.slideNext(),(d||m)&&t.slidePrev()),n("keyPress",i)}}function c(){t.keyboard.enabled||(l.addEventListener("keydown",d),t.keyboard.enabled=!0)}function p(){t.keyboard.enabled&&(l.removeEventListener("keydown",d),t.keyboard.enabled=!1)}t.keyboard={enabled:!1},s({keyboard:{enabled:!1,onlyInViewport:!0,pageUpDown:!0}}),i("init",(()=>{t.params.keyboard.enabled&&c()})),i("destroy",(()=>{t.keyboard.enabled&&p()})),Object.assign(t.keyboard,{enable:c,disable:p})},function(e){let{swiper:t,extendParams:s,on:a,emit:i}=e;const o=r();let d;s({mousewheel:{enabled:!1,releaseOnEdges:!1,invert:!1,forceToAxis:!1,sensitivity:1,eventsTarget:"container",thresholdDelta:null,thresholdTime:null}}),t.mousewheel={enabled:!1};let c,p=l();const u=[];function m(){t.enabled&&(t.mouseEntered=!0)}function h(){t.enabled&&(t.mouseEntered=!1)}function f(e){return!(t.params.mousewheel.thresholdDelta&&e.delta<t.params.mousewheel.thresholdDelta)&&(!(t.params.mousewheel.thresholdTime&&l()-p<t.params.mousewheel.thresholdTime)&&(e.delta>=6&&l()-p<60||(e.direction<0?t.isEnd&&!t.params.loop||t.animating||(t.slideNext(),i("scroll",e.raw)):t.isBeginning&&!t.params.loop||t.animating||(t.slidePrev(),i("scroll",e.raw)),p=(new o.Date).getTime(),!1)))}function g(e){let s=e,a=!0;if(!t.enabled)return;const r=t.params.mousewheel;t.params.cssMode&&s.preventDefault();let o=t.el;"container"!==t.params.mousewheel.eventsTarget&&(o=document.querySelector(t.params.mousewheel.eventsTarget));const p=o&&o.contains(s.target);if(!t.mouseEntered&&!p&&!r.releaseOnEdges)return!0;s.originalEvent&&(s=s.originalEvent);let m=0;const h=t.rtlTranslate?-1:1,g=function(e){let t=0,s=0,a=0,i=0;return"detail"in e&&(s=e.detail),"wheelDelta"in e&&(s=-e.wheelDelta/120),"wheelDeltaY"in e&&(s=-e.wheelDeltaY/120),"wheelDeltaX"in e&&(t=-e.wheelDeltaX/120),"axis"in e&&e.axis===e.HORIZONTAL_AXIS&&(t=s,s=0),a=10*t,i=10*s,"deltaY"in e&&(i=e.deltaY),"deltaX"in e&&(a=e.deltaX),e.shiftKey&&!a&&(a=i,i=0),(a||i)&&e.deltaMode&&(1===e.deltaMode?(a*=40,i*=40):(a*=800,i*=800)),a&&!t&&(t=a<1?-1:1),i&&!s&&(s=i<1?-1:1),{spinX:t,spinY:s,pixelX:a,pixelY:i}}(s);if(r.forceToAxis)if(t.isHorizontal()){if(!(Math.abs(g.pixelX)>Math.abs(g.pixelY)))return!0;m=-g.pixelX*h}else{if(!(Math.abs(g.pixelY)>Math.abs(g.pixelX)))return!0;m=-g.pixelY}else m=Math.abs(g.pixelX)>Math.abs(g.pixelY)?-g.pixelX*h:-g.pixelY;if(0===m)return!0;r.invert&&(m=-m);let v=t.getTranslate()+m*r.sensitivity;if(v>=t.minTranslate()&&(v=t.minTranslate()),v<=t.maxTranslate()&&(v=t.maxTranslate()),a=!!t.params.loop||!(v===t.minTranslate()||v===t.maxTranslate()),a&&t.params.nested&&s.stopPropagation(),t.params.freeMode&&t.params.freeMode.enabled){const e={time:l(),delta:Math.abs(m),direction:Math.sign(m)},a=c&&e.time<c.time+500&&e.delta<=c.delta&&e.direction===c.direction;if(!a){c=void 0;let l=t.getTranslate()+m*r.sensitivity;const o=t.isBeginning,p=t.isEnd;if(l>=t.minTranslate()&&(l=t.minTranslate()),l<=t.maxTranslate()&&(l=t.maxTranslate()),t.setTransition(0),t.setTranslate(l),t.updateProgress(),t.updateActiveIndex(),t.updateSlidesClasses(),(!o&&t.isBeginning||!p&&t.isEnd)&&t.updateSlidesClasses(),t.params.loop&&t.loopFix({direction:e.direction<0?"next":"prev",byMousewheel:!0}),t.params.freeMode.sticky){clearTimeout(d),d=void 0,u.length>=15&&u.shift();const s=u.length?u[u.length-1]:void 0,a=u[0];if(u.push(e),s&&(e.delta>s.delta||e.direction!==s.direction))u.splice(0);else if(u.length>=15&&e.time-a.time<500&&a.delta-e.delta>=1&&e.delta<=6){const s=m>0?.8:.2;c=e,u.splice(0),d=n((()=>{t.slideToClosest(t.params.speed,!0,void 0,s)}),0)}d||(d=n((()=>{c=e,u.splice(0),t.slideToClosest(t.params.speed,!0,void 0,.5)}),500))}if(a||i("scroll",s),t.params.autoplay&&t.params.autoplayDisableOnInteraction&&t.autoplay.stop(),l===t.minTranslate()||l===t.maxTranslate())return!0}}else{const s={time:l(),delta:Math.abs(m),direction:Math.sign(m),raw:e};u.length>=2&&u.shift();const a=u.length?u[u.length-1]:void 0;if(u.push(s),a?(s.direction!==a.direction||s.delta>a.delta||s.time>a.time+150)&&f(s):f(s),function(e){const s=t.params.mousewheel;if(e.direction<0){if(t.isEnd&&!t.params.loop&&s.releaseOnEdges)return!0}else if(t.isBeginning&&!t.params.loop&&s.releaseOnEdges)return!0;return!1}(s))return!0}return s.preventDefault?s.preventDefault():s.returnValue=!1,!1}function v(e){let s=t.el;"container"!==t.params.mousewheel.eventsTarget&&(s=document.querySelector(t.params.mousewheel.eventsTarget)),s[e]("mouseenter",m),s[e]("mouseleave",h),s[e]("wheel",g)}function w(){return t.params.cssMode?(t.wrapperEl.removeEventListener("wheel",g),!0):!t.mousewheel.enabled&&(v("addEventListener"),t.mousewheel.enabled=!0,!0)}function b(){return t.params.cssMode?(t.wrapperEl.addEventListener(event,g),!0):!!t.mousewheel.enabled&&(v("removeEventListener"),t.mousewheel.enabled=!1,!0)}a("init",(()=>{!t.params.mousewheel.enabled&&t.params.cssMode&&b(),t.params.mousewheel.enabled&&w()})),a("destroy",(()=>{t.params.cssMode&&w(),t.mousewheel.enabled&&b()})),Object.assign(t.mousewheel,{enable:w,disable:b})},function(e){let{swiper:t,extendParams:s,on:a,emit:i}=e;s({navigation:{nextEl:null,prevEl:null,hideOnClick:!1,disabledClass:"swiper-button-disabled",hiddenClass:"swiper-button-hidden",lockClass:"swiper-button-lock",navigationDisabledClass:"swiper-navigation-disabled"}}),t.navigation={nextEl:null,prevEl:null};const r=e=>(Array.isArray(e)||(e=[e].filter((e=>!!e))),e);function n(e){let s;return e&&"string"==typeof e&&t.isElement&&(s=t.el.shadowRoot.querySelector(e),s)?s:(e&&("string"==typeof e&&(s=[...document.querySelectorAll(e)]),t.params.uniqueNavElements&&"string"==typeof e&&s.length>1&&1===t.el.querySelectorAll(e).length&&(s=t.el.querySelector(e))),e&&!s?e:s)}function l(e,s){const a=t.params.navigation;(e=r(e)).forEach((e=>{e&&(e.classList[s?"add":"remove"](...a.disabledClass.split(" ")),"BUTTON"===e.tagName&&(e.disabled=s),t.params.watchOverflow&&t.enabled&&e.classList[t.isLocked?"add":"remove"](a.lockClass))}))}function o(){const{nextEl:e,prevEl:s}=t.navigation;if(t.params.loop)return l(s,!1),void l(e,!1);l(s,t.isBeginning&&!t.params.rewind),l(e,t.isEnd&&!t.params.rewind)}function d(e){e.preventDefault(),(!t.isBeginning||t.params.loop||t.params.rewind)&&(t.slidePrev(),i("navigationPrev"))}function c(e){e.preventDefault(),(!t.isEnd||t.params.loop||t.params.rewind)&&(t.slideNext(),i("navigationNext"))}function p(){const e=t.params.navigation;if(t.params.navigation=ee(t,t.originalParams.navigation,t.params.navigation,{nextEl:"swiper-button-next",prevEl:"swiper-button-prev"}),!e.nextEl&&!e.prevEl)return;let s=n(e.nextEl),a=n(e.prevEl);Object.assign(t.navigation,{nextEl:s,prevEl:a}),s=r(s),a=r(a);const i=(s,a)=>{s&&s.addEventListener("click","next"===a?c:d),!t.enabled&&s&&s.classList.add(...e.lockClass.split(" "))};s.forEach((e=>i(e,"next"))),a.forEach((e=>i(e,"prev")))}function u(){let{nextEl:e,prevEl:s}=t.navigation;e=r(e),s=r(s);const a=(e,s)=>{e.removeEventListener("click","next"===s?c:d),e.classList.remove(...t.params.navigation.disabledClass.split(" "))};e.forEach((e=>a(e,"next"))),s.forEach((e=>a(e,"prev")))}a("init",(()=>{!1===t.params.navigation.enabled?m():(p(),o())})),a("toEdge fromEdge lock unlock",(()=>{o()})),a("destroy",(()=>{u()})),a("enable disable",(()=>{let{nextEl:e,prevEl:s}=t.navigation;e=r(e),s=r(s),[...e,...s].filter((e=>!!e)).forEach((e=>e.classList[t.enabled?"remove":"add"](t.params.navigation.lockClass)))})),a("click",((e,s)=>{let{nextEl:a,prevEl:n}=t.navigation;a=r(a),n=r(n);const l=s.target;if(t.params.navigation.hideOnClick&&!n.includes(l)&&!a.includes(l)){if(t.pagination&&t.params.pagination&&t.params.pagination.clickable&&(t.pagination.el===l||t.pagination.el.contains(l)))return;let e;a.length?e=a[0].classList.contains(t.params.navigation.hiddenClass):n.length&&(e=n[0].classList.contains(t.params.navigation.hiddenClass)),i(!0===e?"navigationShow":"navigationHide"),[...a,...n].filter((e=>!!e)).forEach((e=>e.classList.toggle(t.params.navigation.hiddenClass)))}}));const m=()=>{t.el.classList.add(...t.params.navigation.navigationDisabledClass.split(" ")),u()};Object.assign(t.navigation,{enable:()=>{t.el.classList.remove(...t.params.navigation.navigationDisabledClass.split(" ")),p(),o()},disable:m,update:o,init:p,destroy:u})},function(e){let{swiper:t,extendParams:s,on:a,emit:i}=e;const r="swiper-pagination";let n;s({pagination:{el:null,bulletElement:"span",clickable:!1,hideOnClick:!1,renderBullet:null,renderProgressbar:null,renderFraction:null,renderCustom:null,progressbarOpposite:!1,type:"bullets",dynamicBullets:!1,dynamicMainBullets:1,formatFractionCurrent:e=>e,formatFractionTotal:e=>e,bulletClass:`${r}-bullet`,bulletActiveClass:`${r}-bullet-active`,modifierClass:`${r}-`,currentClass:`${r}-current`,totalClass:`${r}-total`,hiddenClass:`${r}-hidden`,progressbarFillClass:`${r}-progressbar-fill`,progressbarOppositeClass:`${r}-progressbar-opposite`,clickableClass:`${r}-clickable`,lockClass:`${r}-lock`,horizontalClass:`${r}-horizontal`,verticalClass:`${r}-vertical`,paginationDisabledClass:`${r}-disabled`}}),t.pagination={el:null,bullets:[]};let l=0;const o=e=>(Array.isArray(e)||(e=[e].filter((e=>!!e))),e);function d(){return!t.params.pagination.el||!t.pagination.el||Array.isArray(t.pagination.el)&&0===t.pagination.el.length}function c(e,s){const{bulletActiveClass:a}=t.params.pagination;e&&(e=e[("prev"===s?"previous":"next")+"ElementSibling"])&&(e.classList.add(`${a}-${s}`),(e=e[("prev"===s?"previous":"next")+"ElementSibling"])&&e.classList.add(`${a}-${s}-${s}`))}function p(e){const s=e.target.closest(te(t.params.pagination.bulletClass));if(!s)return;e.preventDefault();const a=b(s)*t.params.slidesPerGroup;if(t.params.loop){if(t.realIndex===a)return;const e=t.getSlideIndexByData(a),s=t.getSlideIndexByData(t.realIndex);e>t.slides.length-t.loopedSlides&&t.loopFix({direction:e>s?"next":"prev",activeSlideIndex:e,slideTo:!1}),t.slideToLoop(a)}else t.slideTo(a)}function u(){const e=t.rtl,s=t.params.pagination;if(d())return;let a,r,p=t.pagination.el;p=o(p);const u=t.virtual&&t.params.virtual.enabled?t.virtual.slides.length:t.slides.length,m=t.params.loop?Math.ceil(u/t.params.slidesPerGroup):t.snapGrid.length;if(t.params.loop?(r=t.previousRealIndex||0,a=t.params.slidesPerGroup>1?Math.floor(t.realIndex/t.params.slidesPerGroup):t.realIndex):void 0!==t.snapIndex?(a=t.snapIndex,r=t.previousSnapIndex):(r=t.previousIndex||0,a=t.activeIndex||0),"bullets"===s.type&&t.pagination.bullets&&t.pagination.bullets.length>0){const i=t.pagination.bullets;let o,d,u;if(s.dynamicBullets&&(n=x(i[0],t.isHorizontal()?"width":"height",!0),p.forEach((e=>{e.style[t.isHorizontal()?"width":"height"]=n*(s.dynamicMainBullets+4)+"px"})),s.dynamicMainBullets>1&&void 0!==r&&(l+=a-(r||0),l>s.dynamicMainBullets-1?l=s.dynamicMainBullets-1:l<0&&(l=0)),o=Math.max(a-l,0),d=o+(Math.min(i.length,s.dynamicMainBullets)-1),u=(d+o)/2),i.forEach((e=>{const t=[...["","-next","-next-next","-prev","-prev-prev","-main"].map((e=>`${s.bulletActiveClass}${e}`))].map((e=>"string"==typeof e&&e.includes(" ")?e.split(" "):e)).flat();e.classList.remove(...t)})),p.length>1)i.forEach((e=>{const t=b(e);t===a&&e.classList.add(...s.bulletActiveClass.split(" ")),s.dynamicBullets&&(t>=o&&t<=d&&e.classList.add(...`${s.bulletActiveClass}-main`.split(" ")),t===o&&c(e,"prev"),t===d&&c(e,"next"))}));else{const e=i[a];if(e&&e.classList.add(...s.bulletActiveClass.split(" ")),s.dynamicBullets){const e=i[o],t=i[d];for(let e=o;e<=d;e+=1)i[e]&&i[e].classList.add(...`${s.bulletActiveClass}-main`.split(" "));c(e,"prev"),c(t,"next")}}if(s.dynamicBullets){const a=Math.min(i.length,s.dynamicMainBullets+4),r=(n*a-n)/2-u*n,l=e?"right":"left";i.forEach((e=>{e.style[t.isHorizontal()?l:"top"]=`${r}px`}))}}p.forEach(((e,r)=>{if("fraction"===s.type&&(e.querySelectorAll(te(s.currentClass)).forEach((e=>{e.textContent=s.formatFractionCurrent(a+1)})),e.querySelectorAll(te(s.totalClass)).forEach((e=>{e.textContent=s.formatFractionTotal(m)}))),"progressbar"===s.type){let i;i=s.progressbarOpposite?t.isHorizontal()?"vertical":"horizontal":t.isHorizontal()?"horizontal":"vertical";const r=(a+1)/m;let n=1,l=1;"horizontal"===i?n=r:l=r,e.querySelectorAll(te(s.progressbarFillClass)).forEach((e=>{e.style.transform=`translate3d(0,0,0) scaleX(${n}) scaleY(${l})`,e.style.transitionDuration=`${t.params.speed}ms`}))}"custom"===s.type&&s.renderCustom?(e.innerHTML=s.renderCustom(t,a+1,m),0===r&&i("paginationRender",e)):(0===r&&i("paginationRender",e),i("paginationUpdate",e)),t.params.watchOverflow&&t.enabled&&e.classList[t.isLocked?"add":"remove"](s.lockClass)}))}function m(){const e=t.params.pagination;if(d())return;const s=t.virtual&&t.params.virtual.enabled?t.virtual.slides.length:t.slides.length;let a=t.pagination.el;a=o(a);let r="";if("bullets"===e.type){let a=t.params.loop?Math.ceil(s/t.params.slidesPerGroup):t.snapGrid.length;t.params.freeMode&&t.params.freeMode.enabled&&a>s&&(a=s);for(let s=0;s<a;s+=1)e.renderBullet?r+=e.renderBullet.call(t,s,e.bulletClass):r+=`<${e.bulletElement} class="${e.bulletClass}"></${e.bulletElement}>`}"fraction"===e.type&&(r=e.renderFraction?e.renderFraction.call(t,e.currentClass,e.totalClass):`<span class="${e.currentClass}"></span> / <span class="${e.totalClass}"></span>`),"progressbar"===e.type&&(r=e.renderProgressbar?e.renderProgressbar.call(t,e.progressbarFillClass):`<span class="${e.progressbarFillClass}"></span>`),t.pagination.bullets=[],a.forEach((s=>{"custom"!==e.type&&(s.innerHTML=r||""),"bullets"===e.type&&t.pagination.bullets.push(...s.querySelectorAll(te(e.bulletClass)))})),"custom"!==e.type&&i("paginationRender",a[0])}function h(){t.params.pagination=ee(t,t.originalParams.pagination,t.params.pagination,{el:"swiper-pagination"});const e=t.params.pagination;if(!e.el)return;let s;"string"==typeof e.el&&t.isElement&&(s=t.el.shadowRoot.querySelector(e.el)),s||"string"!=typeof e.el||(s=[...document.querySelectorAll(e.el)]),s||(s=e.el),s&&0!==s.length&&(t.params.uniqueNavElements&&"string"==typeof e.el&&Array.isArray(s)&&s.length>1&&(s=[...t.el.querySelectorAll(e.el)],s.length>1&&(s=s.filter((e=>y(e,".swiper")[0]===t.el))[0])),Array.isArray(s)&&1===s.length&&(s=s[0]),Object.assign(t.pagination,{el:s}),s=o(s),s.forEach((s=>{"bullets"===e.type&&e.clickable&&s.classList.add(e.clickableClass),s.classList.add(e.modifierClass+e.type),s.classList.add(t.isHorizontal()?e.horizontalClass:e.verticalClass),"bullets"===e.type&&e.dynamicBullets&&(s.classList.add(`${e.modifierClass}${e.type}-dynamic`),l=0,e.dynamicMainBullets<1&&(e.dynamicMainBullets=1)),"progressbar"===e.type&&e.progressbarOpposite&&s.classList.add(e.progressbarOppositeClass),e.clickable&&s.addEventListener("click",p),t.enabled||s.classList.add(e.lockClass)})))}function f(){const e=t.params.pagination;if(d())return;let s=t.pagination.el;s&&(s=o(s),s.forEach((s=>{s.classList.remove(e.hiddenClass),s.classList.remove(e.modifierClass+e.type),s.classList.remove(t.isHorizontal()?e.horizontalClass:e.verticalClass),e.clickable&&s.removeEventListener("click",p)}))),t.pagination.bullets&&t.pagination.bullets.forEach((t=>t.classList.remove(...e.bulletActiveClass.split(" "))))}a("changeDirection",(()=>{if(!t.pagination||!t.pagination.el)return;const e=t.params.pagination;let{el:s}=t.pagination;s=o(s),s.forEach((s=>{s.classList.remove(e.horizontalClass,e.verticalClass),s.classList.add(t.isHorizontal()?e.horizontalClass:e.verticalClass)}))})),a("init",(()=>{!1===t.params.pagination.enabled?g():(h(),m(),u())})),a("activeIndexChange",(()=>{void 0===t.snapIndex&&u()})),a("snapIndexChange",(()=>{u()})),a("snapGridLengthChange",(()=>{m(),u()})),a("destroy",(()=>{f()})),a("enable disable",(()=>{let{el:e}=t.pagination;e&&(e=o(e),e.forEach((e=>e.classList[t.enabled?"remove":"add"](t.params.pagination.lockClass))))})),a("lock unlock",(()=>{u()})),a("click",((e,s)=>{const a=s.target;let{el:r}=t.pagination;if(Array.isArray(r)||(r=[r].filter((e=>!!e))),t.params.pagination.el&&t.params.pagination.hideOnClick&&r&&r.length>0&&!a.classList.contains(t.params.pagination.bulletClass)){if(t.navigation&&(t.navigation.nextEl&&a===t.navigation.nextEl||t.navigation.prevEl&&a===t.navigation.prevEl))return;const e=r[0].classList.contains(t.params.pagination.hiddenClass);i(!0===e?"paginationShow":"paginationHide"),r.forEach((e=>e.classList.toggle(t.params.pagination.hiddenClass)))}}));const g=()=>{t.el.classList.add(t.params.pagination.paginationDisabledClass);let{el:e}=t.pagination;e&&(e=o(e),e.forEach((e=>e.classList.add(t.params.pagination.paginationDisabledClass)))),f()};Object.assign(t.pagination,{enable:()=>{t.el.classList.remove(t.params.pagination.paginationDisabledClass);let{el:e}=t.pagination;e&&(e=o(e),e.forEach((e=>e.classList.remove(t.params.pagination.paginationDisabledClass)))),h(),m(),u()},disable:g,render:m,update:u,init:h,destroy:f})},function(e){let{swiper:t,extendParams:s,on:i,emit:r}=e;const l=a();let o,d,c,p,u=!1,m=null,h=null;function f(){if(!t.params.scrollbar.el||!t.scrollbar.el)return;const{scrollbar:e,rtlTranslate:s}=t,{dragEl:a,el:i}=e,r=t.params.scrollbar,n=t.params.loop?t.progressLoop:t.progress;let l=d,o=(c-d)*n;s?(o=-o,o>0?(l=d-o,o=0):-o+d>c&&(l=c+o)):o<0?(l=d+o,o=0):o+d>c&&(l=c-o),t.isHorizontal()?(a.style.transform=`translate3d(${o}px, 0, 0)`,a.style.width=`${l}px`):(a.style.transform=`translate3d(0px, ${o}px, 0)`,a.style.height=`${l}px`),r.hide&&(clearTimeout(m),i.style.opacity=1,m=setTimeout((()=>{i.style.opacity=0,i.style.transitionDuration="400ms"}),1e3))}function w(){if(!t.params.scrollbar.el||!t.scrollbar.el)return;const{scrollbar:e}=t,{dragEl:s,el:a}=e;s.style.width="",s.style.height="",c=t.isHorizontal()?a.offsetWidth:a.offsetHeight,p=t.size/(t.virtualSize+t.params.slidesOffsetBefore-(t.params.centeredSlides?t.snapGrid[0]:0)),d="auto"===t.params.scrollbar.dragSize?c*p:parseInt(t.params.scrollbar.dragSize,10),t.isHorizontal()?s.style.width=`${d}px`:s.style.height=`${d}px`,a.style.display=p>=1?"none":"",t.params.scrollbar.hide&&(a.style.opacity=0),t.params.watchOverflow&&t.enabled&&e.el.classList[t.isLocked?"add":"remove"](t.params.scrollbar.lockClass)}function b(e){return t.isHorizontal()?e.clientX:e.clientY}function y(e){const{scrollbar:s,rtlTranslate:a}=t,{el:i}=s;let r;r=(b(e)-v(i)[t.isHorizontal()?"left":"top"]-(null!==o?o:d/2))/(c-d),r=Math.max(Math.min(r,1),0),a&&(r=1-r);const n=t.minTranslate()+(t.maxTranslate()-t.minTranslate())*r;t.updateProgress(n),t.setTranslate(n),t.updateActiveIndex(),t.updateSlidesClasses()}function E(e){const s=t.params.scrollbar,{scrollbar:a,wrapperEl:i}=t,{el:n,dragEl:l}=a;u=!0,o=e.target===l?b(e)-e.target.getBoundingClientRect()[t.isHorizontal()?"left":"top"]:null,e.preventDefault(),e.stopPropagation(),i.style.transitionDuration="100ms",l.style.transitionDuration="100ms",y(e),clearTimeout(h),n.style.transitionDuration="0ms",s.hide&&(n.style.opacity=1),t.params.cssMode&&(t.wrapperEl.style["scroll-snap-type"]="none"),r("scrollbarDragStart",e)}function x(e){const{scrollbar:s,wrapperEl:a}=t,{el:i,dragEl:n}=s;u&&(e.preventDefault?e.preventDefault():e.returnValue=!1,y(e),a.style.transitionDuration="0ms",i.style.transitionDuration="0ms",n.style.transitionDuration="0ms",r("scrollbarDragMove",e))}function S(e){const s=t.params.scrollbar,{scrollbar:a,wrapperEl:i}=t,{el:l}=a;u&&(u=!1,t.params.cssMode&&(t.wrapperEl.style["scroll-snap-type"]="",i.style.transitionDuration=""),s.hide&&(clearTimeout(h),h=n((()=>{l.style.opacity=0,l.style.transitionDuration="400ms"}),1e3)),r("scrollbarDragEnd",e),s.snapOnRelease&&t.slideToClosest())}function T(e){const{scrollbar:s,params:a}=t,i=s.el;if(!i)return;const r=i,n=!!a.passiveListeners&&{passive:!1,capture:!1},o=!!a.passiveListeners&&{passive:!0,capture:!1};if(!r)return;const d="on"===e?"addEventListener":"removeEventListener";r[d]("pointerdown",E,n),l[d]("pointermove",x,n),l[d]("pointerup",S,o)}function M(){const{scrollbar:e,el:s}=t;t.params.scrollbar=ee(t,t.originalParams.scrollbar,t.params.scrollbar,{el:"swiper-scrollbar"});const a=t.params.scrollbar;if(!a.el)return;let i,r;"string"==typeof a.el&&t.isElement&&(i=t.el.shadowRoot.querySelector(a.el)),i||"string"!=typeof a.el?i||(i=a.el):i=l.querySelectorAll(a.el),t.params.uniqueNavElements&&"string"==typeof a.el&&i.length>1&&1===s.querySelectorAll(a.el).length&&(i=s.querySelector(a.el)),i.length>0&&(i=i[0]),i.classList.add(t.isHorizontal()?a.horizontalClass:a.verticalClass),i&&(r=i.querySelector(`.${t.params.scrollbar.dragClass}`),r||(r=g("div",t.params.scrollbar.dragClass),i.append(r))),Object.assign(e,{el:i,dragEl:r}),a.draggable&&t.params.scrollbar.el&&t.scrollbar.el&&T("on"),i&&i.classList[t.enabled?"remove":"add"](t.params.scrollbar.lockClass)}function C(){const e=t.params.scrollbar,s=t.scrollbar.el;s&&s.classList.remove(t.isHorizontal()?e.horizontalClass:e.verticalClass),t.params.scrollbar.el&&t.scrollbar.el&&T("off")}s({scrollbar:{el:null,dragSize:"auto",hide:!1,draggable:!1,snapOnRelease:!0,lockClass:"swiper-scrollbar-lock",dragClass:"swiper-scrollbar-drag",scrollbarDisabledClass:"swiper-scrollbar-disabled",horizontalClass:"swiper-scrollbar-horizontal",verticalClass:"swiper-scrollbar-vertical"}}),t.scrollbar={el:null,dragEl:null},i("init",(()=>{!1===t.params.scrollbar.enabled?P():(M(),w(),f())})),i("update resize observerUpdate lock unlock",(()=>{w()})),i("setTranslate",(()=>{f()})),i("setTransition",((e,s)=>{!function(e){t.params.scrollbar.el&&t.scrollbar.el&&(t.scrollbar.dragEl.style.transitionDuration=`${e}ms`)}(s)})),i("enable disable",(()=>{const{el:e}=t.scrollbar;e&&e.classList[t.enabled?"remove":"add"](t.params.scrollbar.lockClass)})),i("destroy",(()=>{C()}));const P=()=>{t.el.classList.add(t.params.scrollbar.scrollbarDisabledClass),t.scrollbar.el&&t.scrollbar.el.classList.add(t.params.scrollbar.scrollbarDisabledClass),C()};Object.assign(t.scrollbar,{enable:()=>{t.el.classList.remove(t.params.scrollbar.scrollbarDisabledClass),t.scrollbar.el&&t.scrollbar.el.classList.remove(t.params.scrollbar.scrollbarDisabledClass),M(),w(),f()},disable:P,updateSize:w,setTranslate:f,init:M,destroy:C})},function(e){let{swiper:t,extendParams:s,on:a}=e;s({parallax:{enabled:!1}});const i=(e,s)=>{const{rtl:a}=t,i=a?-1:1,r=e.getAttribute("data-swiper-parallax")||"0";let n=e.getAttribute("data-swiper-parallax-x"),l=e.getAttribute("data-swiper-parallax-y");const o=e.getAttribute("data-swiper-parallax-scale"),d=e.getAttribute("data-swiper-parallax-opacity"),c=e.getAttribute("data-swiper-parallax-rotate");if(n||l?(n=n||"0",l=l||"0"):t.isHorizontal()?(n=r,l="0"):(l=r,n="0"),n=n.indexOf("%")>=0?parseInt(n,10)*s*i+"%":n*s*i+"px",l=l.indexOf("%")>=0?parseInt(l,10)*s+"%":l*s+"px",null!=d){const t=d-(d-1)*(1-Math.abs(s));e.style.opacity=t}let p=`translate3d(${n}, ${l}, 0px)`;if(null!=o){p+=` scale(${o-(o-1)*(1-Math.abs(s))})`}if(c&&null!=c){p+=` rotate(${c*s*-1}deg)`}e.style.transform=p},r=()=>{const{el:e,slides:s,progress:a,snapGrid:r}=t;f(e,"[data-swiper-parallax], [data-swiper-parallax-x], [data-swiper-parallax-y], [data-swiper-parallax-opacity], [data-swiper-parallax-scale]").forEach((e=>{i(e,a)})),s.forEach(((e,s)=>{let n=e.progress;t.params.slidesPerGroup>1&&"auto"!==t.params.slidesPerView&&(n+=Math.ceil(s/2)-a*(r.length-1)),n=Math.min(Math.max(n,-1),1),e.querySelectorAll("[data-swiper-parallax], [data-swiper-parallax-x], [data-swiper-parallax-y], [data-swiper-parallax-opacity], [data-swiper-parallax-scale], [data-swiper-parallax-rotate]").forEach((e=>{i(e,n)}))}))};a("beforeInit",(()=>{t.params.parallax.enabled&&(t.params.watchSlidesProgress=!0,t.originalParams.watchSlidesProgress=!0)})),a("init",(()=>{t.params.parallax.enabled&&r()})),a("setTranslate",(()=>{t.params.parallax.enabled&&r()})),a("setTransition",((e,s)=>{t.params.parallax.enabled&&function(e){void 0===e&&(e=t.params.speed);const{el:s}=t;s.querySelectorAll("[data-swiper-parallax], [data-swiper-parallax-x], [data-swiper-parallax-y], [data-swiper-parallax-opacity], [data-swiper-parallax-scale]").forEach((t=>{let s=parseInt(t.getAttribute("data-swiper-parallax-duration"),10)||e;0===e&&(s=0),t.style.transitionDuration=`${s}ms`}))}(s)}))},function(e){let{swiper:t,extendParams:s,on:a,emit:i}=e;const n=r();s({zoom:{enabled:!1,maxRatio:3,minRatio:1,toggle:!0,containerClass:"swiper-zoom-container",zoomedSlideClass:"swiper-slide-zoomed"}}),t.zoom={enabled:!1};let l,d,c=1,p=!1;const u=[],m={originX:0,originY:0,slideEl:void 0,slideWidth:void 0,slideHeight:void 0,imageEl:void 0,imageWrapEl:void 0,maxRatio:3},h={isTouched:void 0,isMoved:void 0,currentX:void 0,currentY:void 0,minX:void 0,minY:void 0,maxX:void 0,maxY:void 0,width:void 0,height:void 0,startX:void 0,startY:void 0,touchesStart:{},touchesCurrent:{}},g={x:void 0,y:void 0,prevPositionX:void 0,prevPositionY:void 0,prevTime:void 0};let w=1;function b(){if(u.length<2)return 1;const e=u[0].pageX,t=u[0].pageY,s=u[1].pageX,a=u[1].pageY;return Math.sqrt((s-e)**2+(a-t)**2)}function E(e){const s=t.isElement?"swiper-slide":`.${t.params.slideClass}`;return!!e.target.matches(s)||t.slides.filter((t=>t.contains(e.target))).length>0}function x(e){if("mouse"===e.pointerType&&u.splice(0,u.length),!E(e))return;const s=t.params.zoom;if(l=!1,d=!1,u.push(e),!(u.length<2)){if(l=!0,m.scaleStart=b(),!m.slideEl){m.slideEl=e.target.closest(`.${t.params.slideClass}, swiper-slide`),m.slideEl||(m.slideEl=t.slides[t.activeIndex]);let a=m.slideEl.querySelector(`.${s.containerClass}`);if(a&&(a=a.querySelectorAll("picture, img, svg, canvas, .swiper-zoom-target")[0]),m.imageEl=a,m.imageWrapEl=a?y(m.imageEl,`.${s.containerClass}`)[0]:void 0,!m.imageWrapEl)return void(m.imageEl=void 0);m.maxRatio=m.imageWrapEl.getAttribute("data-swiper-zoom")||s.maxRatio}if(m.imageEl){const[e,t]=function(){if(u.length<2)return{x:null,y:null};const e=m.imageEl.getBoundingClientRect();return[(u[0].pageX+(u[1].pageX-u[0].pageX)/2-e.x)/c,(u[0].pageY+(u[1].pageY-u[0].pageY)/2-e.y)/c]}();m.originX=e,m.originY=t,m.imageEl.style.transitionDuration="0ms"}p=!0}}function S(e){if(!E(e))return;const s=t.params.zoom,a=t.zoom,i=u.findIndex((t=>t.pointerId===e.pointerId));i>=0&&(u[i]=e),u.length<2||(d=!0,m.scaleMove=b(),m.imageEl&&(a.scale=m.scaleMove/m.scaleStart*c,a.scale>m.maxRatio&&(a.scale=m.maxRatio-1+(a.scale-m.maxRatio+1)**.5),a.scale<s.minRatio&&(a.scale=s.minRatio+1-(s.minRatio-a.scale+1)**.5),m.imageEl.style.transform=`translate3d(0,0,0) scale(${a.scale})`))}function T(e){if(!E(e))return;if("mouse"===e.pointerType&&"pointerout"===e.type)return;const s=t.params.zoom,a=t.zoom,i=u.findIndex((t=>t.pointerId===e.pointerId));i>=0&&u.splice(i,1),l&&d&&(l=!1,d=!1,m.imageEl&&(a.scale=Math.max(Math.min(a.scale,m.maxRatio),s.minRatio),m.imageEl.style.transitionDuration=`${t.params.speed}ms`,m.imageEl.style.transform=`translate3d(0,0,0) scale(${a.scale})`,c=a.scale,p=!1,a.scale>1&&m.slideEl?m.slideEl.classList.add(`${s.zoomedSlideClass}`):a.scale<=1&&m.slideEl&&m.slideEl.classList.remove(`${s.zoomedSlideClass}`),1===a.scale&&(m.originX=0,m.originY=0,m.slideEl=void 0)))}function M(e){if(!E(e)||!function(e){const s=`.${t.params.zoom.containerClass}`;return!!e.target.matches(s)||[...t.el.querySelectorAll(s)].filter((t=>t.contains(e.target))).length>0}(e))return;const s=t.zoom;if(!m.imageEl)return;if(!h.isTouched||!m.slideEl)return;h.isMoved||(h.width=m.imageEl.offsetWidth,h.height=m.imageEl.offsetHeight,h.startX=o(m.imageWrapEl,"x")||0,h.startY=o(m.imageWrapEl,"y")||0,m.slideWidth=m.slideEl.offsetWidth,m.slideHeight=m.slideEl.offsetHeight,m.imageWrapEl.style.transitionDuration="0ms");const a=h.width*s.scale,i=h.height*s.scale;if(a<m.slideWidth&&i<m.slideHeight)return;h.minX=Math.min(m.slideWidth/2-a/2,0),h.maxX=-h.minX,h.minY=Math.min(m.slideHeight/2-i/2,0),h.maxY=-h.minY,h.touchesCurrent.x=u.length>0?u[0].pageX:e.pageX,h.touchesCurrent.y=u.length>0?u[0].pageY:e.pageY;if(Math.max(Math.abs(h.touchesCurrent.x-h.touchesStart.x),Math.abs(h.touchesCurrent.y-h.touchesStart.y))>5&&(t.allowClick=!1),!h.isMoved&&!p){if(t.isHorizontal()&&(Math.floor(h.minX)===Math.floor(h.startX)&&h.touchesCurrent.x<h.touchesStart.x||Math.floor(h.maxX)===Math.floor(h.startX)&&h.touchesCurrent.x>h.touchesStart.x))return void(h.isTouched=!1);if(!t.isHorizontal()&&(Math.floor(h.minY)===Math.floor(h.startY)&&h.touchesCurrent.y<h.touchesStart.y||Math.floor(h.maxY)===Math.floor(h.startY)&&h.touchesCurrent.y>h.touchesStart.y))return void(h.isTouched=!1)}e.cancelable&&e.preventDefault(),e.stopPropagation(),h.isMoved=!0;const r=(s.scale-c)/(m.maxRatio-t.params.zoom.minRatio),{originX:n,originY:l}=m;h.currentX=h.touchesCurrent.x-h.touchesStart.x+h.startX+r*(h.width-2*n),h.currentY=h.touchesCurrent.y-h.touchesStart.y+h.startY+r*(h.height-2*l),h.currentX<h.minX&&(h.currentX=h.minX+1-(h.minX-h.currentX+1)**.8),h.currentX>h.maxX&&(h.currentX=h.maxX-1+(h.currentX-h.maxX+1)**.8),h.currentY<h.minY&&(h.currentY=h.minY+1-(h.minY-h.currentY+1)**.8),h.currentY>h.maxY&&(h.currentY=h.maxY-1+(h.currentY-h.maxY+1)**.8),g.prevPositionX||(g.prevPositionX=h.touchesCurrent.x),g.prevPositionY||(g.prevPositionY=h.touchesCurrent.y),g.prevTime||(g.prevTime=Date.now()),g.x=(h.touchesCurrent.x-g.prevPositionX)/(Date.now()-g.prevTime)/2,g.y=(h.touchesCurrent.y-g.prevPositionY)/(Date.now()-g.prevTime)/2,Math.abs(h.touchesCurrent.x-g.prevPositionX)<2&&(g.x=0),Math.abs(h.touchesCurrent.y-g.prevPositionY)<2&&(g.y=0),g.prevPositionX=h.touchesCurrent.x,g.prevPositionY=h.touchesCurrent.y,g.prevTime=Date.now(),m.imageWrapEl.style.transform=`translate3d(${h.currentX}px, ${h.currentY}px,0)`}function C(){const e=t.zoom;m.slideEl&&t.activeIndex!==t.slides.indexOf(m.slideEl)&&(m.imageEl&&(m.imageEl.style.transform="translate3d(0,0,0) scale(1)"),m.imageWrapEl&&(m.imageWrapEl.style.transform="translate3d(0,0,0)"),m.slideEl.classList.remove(`${t.params.zoom.zoomedSlideClass}`),e.scale=1,c=1,m.slideEl=void 0,m.imageEl=void 0,m.imageWrapEl=void 0,m.originX=0,m.originY=0)}function P(e){const s=t.zoom,a=t.params.zoom;if(!m.slideEl){e&&e.target&&(m.slideEl=e.target.closest(`.${t.params.slideClass}, swiper-slide`)),m.slideEl||(t.params.virtual&&t.params.virtual.enabled&&t.virtual?m.slideEl=f(t.slidesEl,`.${t.params.slideActiveClass}`)[0]:m.slideEl=t.slides[t.activeIndex]);let s=m.slideEl.querySelector(`.${a.containerClass}`);s&&(s=s.querySelectorAll("picture, img, svg, canvas, .swiper-zoom-target")[0]),m.imageEl=s,m.imageWrapEl=s?y(m.imageEl,`.${a.containerClass}`)[0]:void 0}if(!m.imageEl||!m.imageWrapEl)return;let i,r,l,o,d,p,u,g,w,b,E,x,S,T,M,C,P,L;t.params.cssMode&&(t.wrapperEl.style.overflow="hidden",t.wrapperEl.style.touchAction="none"),m.slideEl.classList.add(`${a.zoomedSlideClass}`),void 0===h.touchesStart.x&&e?(i=e.pageX,r=e.pageY):(i=h.touchesStart.x,r=h.touchesStart.y);const z="number"==typeof e?e:null;1===c&&z&&(i=void 0,r=void 0),s.scale=z||m.imageWrapEl.getAttribute("data-swiper-zoom")||a.maxRatio,c=z||m.imageWrapEl.getAttribute("data-swiper-zoom")||a.maxRatio,!e||1===c&&z?(u=0,g=0):(P=m.slideEl.offsetWidth,L=m.slideEl.offsetHeight,l=v(m.slideEl).left+n.scrollX,o=v(m.slideEl).top+n.scrollY,d=l+P/2-i,p=o+L/2-r,w=m.imageEl.offsetWidth,b=m.imageEl.offsetHeight,E=w*s.scale,x=b*s.scale,S=Math.min(P/2-E/2,0),T=Math.min(L/2-x/2,0),M=-S,C=-T,u=d*s.scale,g=p*s.scale,u<S&&(u=S),u>M&&(u=M),g<T&&(g=T),g>C&&(g=C)),z&&1===s.scale&&(m.originX=0,m.originY=0),m.imageWrapEl.style.transitionDuration="300ms",m.imageWrapEl.style.transform=`translate3d(${u}px, ${g}px,0)`,m.imageEl.style.transitionDuration="300ms",m.imageEl.style.transform=`translate3d(0,0,0) scale(${s.scale})`}function L(){const e=t.zoom,s=t.params.zoom;if(!m.slideEl){t.params.virtual&&t.params.virtual.enabled&&t.virtual?m.slideEl=f(t.slidesEl,`.${t.params.slideActiveClass}`)[0]:m.slideEl=t.slides[t.activeIndex];let e=m.slideEl.querySelector(`.${s.containerClass}`);e&&(e=e.querySelectorAll("picture, img, svg, canvas, .swiper-zoom-target")[0]),m.imageEl=e,m.imageWrapEl=e?y(m.imageEl,`.${s.containerClass}`)[0]:void 0}m.imageEl&&m.imageWrapEl&&(t.params.cssMode&&(t.wrapperEl.style.overflow="",t.wrapperEl.style.touchAction=""),e.scale=1,c=1,m.imageWrapEl.style.transitionDuration="300ms",m.imageWrapEl.style.transform="translate3d(0,0,0)",m.imageEl.style.transitionDuration="300ms",m.imageEl.style.transform="translate3d(0,0,0) scale(1)",m.slideEl.classList.remove(`${s.zoomedSlideClass}`),m.slideEl=void 0,m.originX=0,m.originY=0)}function z(e){const s=t.zoom;s.scale&&1!==s.scale?L():P(e)}function A(){return{passiveListener:!!t.params.passiveListeners&&{passive:!0,capture:!1},activeListenerWithCapture:!t.params.passiveListeners||{passive:!1,capture:!0}}}function $(){const e=t.zoom;if(e.enabled)return;e.enabled=!0;const{passiveListener:s,activeListenerWithCapture:a}=A();t.wrapperEl.addEventListener("pointerdown",x,s),t.wrapperEl.addEventListener("pointermove",S,a),["pointerup","pointercancel","pointerout"].forEach((e=>{t.wrapperEl.addEventListener(e,T,s)})),t.wrapperEl.addEventListener("pointermove",M,a)}function I(){const e=t.zoom;if(!e.enabled)return;e.enabled=!1;const{passiveListener:s,activeListenerWithCapture:a}=A();t.wrapperEl.removeEventListener("pointerdown",x,s),t.wrapperEl.removeEventListener("pointermove",S,a),["pointerup","pointercancel","pointerout"].forEach((e=>{t.wrapperEl.removeEventListener(e,T,s)})),t.wrapperEl.removeEventListener("pointermove",M,a)}Object.defineProperty(t.zoom,"scale",{get:()=>w,set(e){if(w!==e){const t=m.imageEl,s=m.slideEl;i("zoomChange",e,t,s)}w=e}}),a("init",(()=>{t.params.zoom.enabled&&$()})),a("destroy",(()=>{I()})),a("touchStart",((e,s)=>{t.zoom.enabled&&function(e){const s=t.device;if(!m.imageEl)return;if(h.isTouched)return;s.android&&e.cancelable&&e.preventDefault(),h.isTouched=!0;const a=u.length>0?u[0]:e;h.touchesStart.x=a.pageX,h.touchesStart.y=a.pageY}(s)})),a("touchEnd",((e,s)=>{t.zoom.enabled&&function(){const e=t.zoom;if(!m.imageEl)return;if(!h.isTouched||!h.isMoved)return h.isTouched=!1,void(h.isMoved=!1);h.isTouched=!1,h.isMoved=!1;let s=300,a=300;const i=g.x*s,r=h.currentX+i,n=g.y*a,l=h.currentY+n;0!==g.x&&(s=Math.abs((r-h.currentX)/g.x)),0!==g.y&&(a=Math.abs((l-h.currentY)/g.y));const o=Math.max(s,a);h.currentX=r,h.currentY=l;const d=h.width*e.scale,c=h.height*e.scale;h.minX=Math.min(m.slideWidth/2-d/2,0),h.maxX=-h.minX,h.minY=Math.min(m.slideHeight/2-c/2,0),h.maxY=-h.minY,h.currentX=Math.max(Math.min(h.currentX,h.maxX),h.minX),h.currentY=Math.max(Math.min(h.currentY,h.maxY),h.minY),m.imageWrapEl.style.transitionDuration=`${o}ms`,m.imageWrapEl.style.transform=`translate3d(${h.currentX}px, ${h.currentY}px,0)`}()})),a("doubleTap",((e,s)=>{!t.animating&&t.params.zoom.enabled&&t.zoom.enabled&&t.params.zoom.toggle&&z(s)})),a("transitionEnd",(()=>{t.zoom.enabled&&t.params.zoom.enabled&&C()})),a("slideChange",(()=>{t.zoom.enabled&&t.params.zoom.enabled&&t.params.cssMode&&C()})),Object.assign(t.zoom,{enable:$,disable:I,in:P,out:L,toggle:z})},function(e){let{swiper:t,extendParams:s,on:a}=e;function i(e,t){const s=function(){let e,t,s;return(a,i)=>{for(t=-1,e=a.length;e-t>1;)s=e+t>>1,a[s]<=i?t=s:e=s;return e}}();let a,i;return this.x=e,this.y=t,this.lastIndex=e.length-1,this.interpolate=function(e){return e?(i=s(this.x,e),a=i-1,(e-this.x[a])*(this.y[i]-this.y[a])/(this.x[i]-this.x[a])+this.y[a]):0},this}function r(){t.controller.control&&t.controller.spline&&(t.controller.spline=void 0,delete t.controller.spline)}s({controller:{control:void 0,inverse:!1,by:"slide"}}),t.controller={control:void 0},a("beforeInit",(()=>{if("undefined"!=typeof window&&("string"==typeof t.params.controller.control||t.params.controller.control instanceof HTMLElement)){const e=document.querySelector(t.params.controller.control);if(e&&e.swiper)t.controller.control=e.swiper;else if(e){const s=a=>{t.controller.control=a.detail[0],t.update(),e.removeEventListener("init",s)};e.addEventListener("init",s)}}else t.controller.control=t.params.controller.control})),a("update",(()=>{r()})),a("resize",(()=>{r()})),a("observerUpdate",(()=>{r()})),a("setTranslate",((e,s,a)=>{t.controller.control&&!t.controller.control.destroyed&&t.controller.setTranslate(s,a)})),a("setTransition",((e,s,a)=>{t.controller.control&&!t.controller.control.destroyed&&t.controller.setTransition(s,a)})),Object.assign(t.controller,{setTranslate:function(e,s){const a=t.controller.control;let r,n;const l=t.constructor;function o(e){if(e.destroyed)return;const s=t.rtlTranslate?-t.translate:t.translate;"slide"===t.params.controller.by&&(!function(e){t.controller.spline=t.params.loop?new i(t.slidesGrid,e.slidesGrid):new i(t.snapGrid,e.snapGrid)}(e),n=-t.controller.spline.interpolate(-s)),n&&"container"!==t.params.controller.by||(r=(e.maxTranslate()-e.minTranslate())/(t.maxTranslate()-t.minTranslate()),!Number.isNaN(r)&&Number.isFinite(r)||(r=1),n=(s-t.minTranslate())*r+e.minTranslate()),t.params.controller.inverse&&(n=e.maxTranslate()-n),e.updateProgress(n),e.setTranslate(n,t),e.updateActiveIndex(),e.updateSlidesClasses()}if(Array.isArray(a))for(let e=0;e<a.length;e+=1)a[e]!==s&&a[e]instanceof l&&o(a[e]);else a instanceof l&&s!==a&&o(a)},setTransition:function(e,s){const a=t.constructor,i=t.controller.control;let r;function l(s){s.destroyed||(s.setTransition(e,t),0!==e&&(s.transitionStart(),s.params.autoHeight&&n((()=>{s.updateAutoHeight()})),E(s.wrapperEl,(()=>{i&&s.transitionEnd()}))))}if(Array.isArray(i))for(r=0;r<i.length;r+=1)i[r]!==s&&i[r]instanceof a&&l(i[r]);else i instanceof a&&s!==i&&l(i)}})},function(e){let{swiper:t,extendParams:s,on:a}=e;s({a11y:{enabled:!0,notificationClass:"swiper-notification",prevSlideMessage:"Previous slide",nextSlideMessage:"Next slide",firstSlideMessage:"This is the first slide",lastSlideMessage:"This is the last slide",paginationBulletMessage:"Go to slide {{index}}",slideLabelMessage:"{{index}} / {{slidesLength}}",containerMessage:null,containerRoleDescriptionMessage:null,itemRoleDescriptionMessage:null,slideRole:"group",id:null}}),t.a11y={clicked:!1};let i=null;function r(e){const t=i;0!==t.length&&(t.innerHTML="",t.innerHTML=e)}const n=e=>(Array.isArray(e)||(e=[e].filter((e=>!!e))),e);function l(e){(e=n(e)).forEach((e=>{e.setAttribute("tabIndex","0")}))}function o(e){(e=n(e)).forEach((e=>{e.setAttribute("tabIndex","-1")}))}function d(e,t){(e=n(e)).forEach((e=>{e.setAttribute("role",t)}))}function c(e,t){(e=n(e)).forEach((e=>{e.setAttribute("aria-roledescription",t)}))}function p(e,t){(e=n(e)).forEach((e=>{e.setAttribute("aria-label",t)}))}function u(e){(e=n(e)).forEach((e=>{e.setAttribute("aria-disabled",!0)}))}function m(e){(e=n(e)).forEach((e=>{e.setAttribute("aria-disabled",!1)}))}function h(e){if(13!==e.keyCode&&32!==e.keyCode)return;const s=t.params.a11y,a=e.target;t.pagination&&t.pagination.el&&(a===t.pagination.el||t.pagination.el.contains(e.target))&&!e.target.matches(te(t.params.pagination.bulletClass))||(t.navigation&&t.navigation.nextEl&&a===t.navigation.nextEl&&(t.isEnd&&!t.params.loop||t.slideNext(),t.isEnd?r(s.lastSlideMessage):r(s.nextSlideMessage)),t.navigation&&t.navigation.prevEl&&a===t.navigation.prevEl&&(t.isBeginning&&!t.params.loop||t.slidePrev(),t.isBeginning?r(s.firstSlideMessage):r(s.prevSlideMessage)),t.pagination&&a.matches(te(t.params.pagination.bulletClass))&&a.click())}function f(){return t.pagination&&t.pagination.bullets&&t.pagination.bullets.length}function v(){return f()&&t.params.pagination.clickable}const w=(e,t,s)=>{l(e),"BUTTON"!==e.tagName&&(d(e,"button"),e.addEventListener("keydown",h)),p(e,s),function(e,t){(e=n(e)).forEach((e=>{e.setAttribute("aria-controls",t)}))}(e,t)},y=()=>{t.a11y.clicked=!0},E=()=>{requestAnimationFrame((()=>{requestAnimationFrame((()=>{t.destroyed||(t.a11y.clicked=!1)}))}))},x=e=>{if(t.a11y.clicked)return;const s=e.target.closest(`.${t.params.slideClass}, swiper-slide`);if(!s||!t.slides.includes(s))return;const a=t.slides.indexOf(s)===t.activeIndex,i=t.params.watchSlidesProgress&&t.visibleSlides&&t.visibleSlides.includes(s);a||i||e.sourceCapabilities&&e.sourceCapabilities.firesTouchEvents||(t.isHorizontal()?t.el.scrollLeft=0:t.el.scrollTop=0,t.slideTo(t.slides.indexOf(s),0))},S=()=>{const e=t.params.a11y;e.itemRoleDescriptionMessage&&c(t.slides,e.itemRoleDescriptionMessage),e.slideRole&&d(t.slides,e.slideRole);const s=t.slides.length;e.slideLabelMessage&&t.slides.forEach(((a,i)=>{const r=t.params.loop?parseInt(a.getAttribute("data-swiper-slide-index"),10):i;p(a,e.slideLabelMessage.replace(/\{\{index\}\}/,r+1).replace(/\{\{slidesLength\}\}/,s))}))},T=()=>{const e=t.params.a11y;t.el.append(i);const s=t.el;e.containerRoleDescriptionMessage&&c(s,e.containerRoleDescriptionMessage),e.containerMessage&&p(s,e.containerMessage);const a=t.wrapperEl,r=e.id||a.getAttribute("id")||`swiper-wrapper-${l=16,void 0===l&&(l=16),"x".repeat(l).replace(/x/g,(()=>Math.round(16*Math.random()).toString(16)))}`;var l;const o=t.params.autoplay&&t.params.autoplay.enabled?"off":"polite";var d;d=r,n(a).forEach((e=>{e.setAttribute("id",d)})),function(e,t){(e=n(e)).forEach((e=>{e.setAttribute("aria-live",t)}))}(a,o),S();let{nextEl:u,prevEl:m}=t.navigation?t.navigation:{};if(u=n(u),m=n(m),u&&u.forEach((t=>w(t,r,e.nextSlideMessage))),m&&m.forEach((t=>w(t,r,e.prevSlideMessage))),v()){(Array.isArray(t.pagination.el)?t.pagination.el:[t.pagination.el]).forEach((e=>{e.addEventListener("keydown",h)}))}t.el.addEventListener("focus",x,!0),t.el.addEventListener("pointerdown",y,!0),t.el.addEventListener("pointerup",E,!0)};a("beforeInit",(()=>{i=g("span",t.params.a11y.notificationClass),i.setAttribute("aria-live","assertive"),i.setAttribute("aria-atomic","true"),t.isElement&&i.setAttribute("slot","container-end")})),a("afterInit",(()=>{t.params.a11y.enabled&&T()})),a("slidesLengthChange snapGridLengthChange slidesGridLengthChange",(()=>{t.params.a11y.enabled&&S()})),a("fromEdge toEdge afterInit lock unlock",(()=>{t.params.a11y.enabled&&function(){if(t.params.loop||t.params.rewind||!t.navigation)return;const{nextEl:e,prevEl:s}=t.navigation;s&&(t.isBeginning?(u(s),o(s)):(m(s),l(s))),e&&(t.isEnd?(u(e),o(e)):(m(e),l(e)))}()})),a("paginationUpdate",(()=>{t.params.a11y.enabled&&function(){const e=t.params.a11y;f()&&t.pagination.bullets.forEach((s=>{t.params.pagination.clickable&&(l(s),t.params.pagination.renderBullet||(d(s,"button"),p(s,e.paginationBulletMessage.replace(/\{\{index\}\}/,b(s)+1)))),s.matches(te(t.params.pagination.bulletActiveClass))?s.setAttribute("aria-current","true"):s.removeAttribute("aria-current")}))}()})),a("destroy",(()=>{t.params.a11y.enabled&&function(){i&&i.length>0&&i.remove();let{nextEl:e,prevEl:s}=t.navigation?t.navigation:{};e=n(e),s=n(s),e&&e.forEach((e=>e.removeEventListener("keydown",h))),s&&s.forEach((e=>e.removeEventListener("keydown",h))),v()&&(Array.isArray(t.pagination.el)?t.pagination.el:[t.pagination.el]).forEach((e=>{e.removeEventListener("keydown",h)}));t.el.removeEventListener("focus",x,!0),t.el.removeEventListener("pointerdown",y,!0),t.el.removeEventListener("pointerup",E,!0)}()}))},function(e){let{swiper:t,extendParams:s,on:a}=e;s({history:{enabled:!1,root:"",replaceState:!1,key:"slides",keepQuery:!1}});let i=!1,n={};const l=e=>e.toString().replace(/\s+/g,"-").replace(/[^\w-]+/g,"").replace(/--+/g,"-").replace(/^-+/,"").replace(/-+$/,""),o=e=>{const t=r();let s;s=e?new URL(e):t.location;const a=s.pathname.slice(1).split("/").filter((e=>""!==e)),i=a.length;return{key:a[i-2],value:a[i-1]}},d=(e,s)=>{const a=r();if(!i||!t.params.history.enabled)return;let n;n=t.params.url?new URL(t.params.url):a.location;const o=t.slides[s];let d=l(o.getAttribute("data-history"));if(t.params.history.root.length>0){let s=t.params.history.root;"/"===s[s.length-1]&&(s=s.slice(0,s.length-1)),d=`${s}/${e?`${e}/`:""}${d}`}else n.pathname.includes(e)||(d=`${e?`${e}/`:""}${d}`);t.params.history.keepQuery&&(d+=n.search);const c=a.history.state;c&&c.value===d||(t.params.history.replaceState?a.history.replaceState({value:d},null,d):a.history.pushState({value:d},null,d))},c=(e,s,a)=>{if(s)for(let i=0,r=t.slides.length;i<r;i+=1){const r=t.slides[i];if(l(r.getAttribute("data-history"))===s){const s=t.getSlideIndex(r);t.slideTo(s,e,a)}}else t.slideTo(0,e,a)},p=()=>{n=o(t.params.url),c(t.params.speed,n.value,!1)};a("init",(()=>{t.params.history.enabled&&(()=>{const e=r();if(t.params.history){if(!e.history||!e.history.pushState)return t.params.history.enabled=!1,void(t.params.hashNavigation.enabled=!0);i=!0,n=o(t.params.url),n.key||n.value?(c(0,n.value,t.params.runCallbacksOnInit),t.params.history.replaceState||e.addEventListener("popstate",p)):t.params.history.replaceState||e.addEventListener("popstate",p)}})()})),a("destroy",(()=>{t.params.history.enabled&&(()=>{const e=r();t.params.history.replaceState||e.removeEventListener("popstate",p)})()})),a("transitionEnd _freeModeNoMomentumRelease",(()=>{i&&d(t.params.history.key,t.activeIndex)})),a("slideChange",(()=>{i&&t.params.cssMode&&d(t.params.history.key,t.activeIndex)}))},function(e){let{swiper:t,extendParams:s,emit:i,on:n}=e,l=!1;const o=a(),d=r();s({hashNavigation:{enabled:!1,replaceState:!1,watchState:!1,getSlideIndex(e,s){if(t.virtual&&t.params.virtual.enabled){const e=t.slides.filter((e=>e.getAttribute("data-hash")===s))[0];if(!e)return 0;return parseInt(e.getAttribute("data-swiper-slide-index"),10)}return t.getSlideIndex(f(t.slidesEl,`.${t.params.slideClass}[data-hash="${s}"], swiper-slide[data-hash="${s}"]`)[0])}}});const c=()=>{i("hashChange");const e=o.location.hash.replace("#",""),s=t.slidesEl.querySelector(`[data-swiper-slide-index="${t.activeIndex}"]`);if(e!==(s?s.getAttribute("data-hash"):"")){const s=t.params.hashNavigation.getSlideIndex(t,e);if(console.log(s),void 0===s)return;t.slideTo(s)}},p=()=>{if(!l||!t.params.hashNavigation.enabled)return;const e=t.slidesEl.querySelector(`[data-swiper-slide-index="${t.activeIndex}"]`),s=e?e.getAttribute("data-hash")||e.getAttribute("data-history"):"";t.params.hashNavigation.replaceState&&d.history&&d.history.replaceState?(d.history.replaceState(null,null,`#${s}`||""),i("hashSet")):(o.location.hash=s||"",i("hashSet"))};n("init",(()=>{t.params.hashNavigation.enabled&&(()=>{if(!t.params.hashNavigation.enabled||t.params.history&&t.params.history.enabled)return;l=!0;const e=o.location.hash.replace("#","");if(e){const s=0,a=t.params.hashNavigation.getSlideIndex(t,e);t.slideTo(a||0,s,t.params.runCallbacksOnInit,!0)}t.params.hashNavigation.watchState&&d.addEventListener("hashchange",c)})()})),n("destroy",(()=>{t.params.hashNavigation.enabled&&t.params.hashNavigation.watchState&&d.removeEventListener("hashchange",c)})),n("transitionEnd _freeModeNoMomentumRelease",(()=>{l&&p()})),n("slideChange",(()=>{l&&t.params.cssMode&&p()}))},function(e){let t,s,{swiper:i,extendParams:r,on:n,emit:l,params:o}=e;i.autoplay={running:!1,paused:!1,timeLeft:0},r({autoplay:{enabled:!1,delay:3e3,waitForTransition:!0,disableOnInteraction:!0,stopOnLastSlide:!1,reverseDirection:!1,pauseOnMouseEnter:!1}});let d,c,p,u,m,h,f,g=o&&o.autoplay?o.autoplay.delay:3e3,v=o&&o.autoplay?o.autoplay.delay:3e3,w=(new Date).getTime;function b(e){i&&!i.destroyed&&i.wrapperEl&&e.target===i.wrapperEl&&(i.wrapperEl.removeEventListener("transitionend",b),M())}const y=()=>{if(i.destroyed||!i.autoplay.running)return;i.autoplay.paused?c=!0:c&&(v=d,c=!1);const e=i.autoplay.paused?d:w+v-(new Date).getTime();i.autoplay.timeLeft=e,l("autoplayTimeLeft",e,e/g),s=requestAnimationFrame((()=>{y()}))},E=e=>{if(i.destroyed||!i.autoplay.running)return;cancelAnimationFrame(s),y();let a=void 0===e?i.params.autoplay.delay:e;g=i.params.autoplay.delay,v=i.params.autoplay.delay;const r=(()=>{let e;if(e=i.virtual&&i.params.virtual.enabled?i.slides.filter((e=>e.classList.contains("swiper-slide-active")))[0]:i.slides[i.activeIndex],!e)return;return parseInt(e.getAttribute("data-swiper-autoplay"),10)})();!Number.isNaN(r)&&r>0&&void 0===e&&(a=r,g=r,v=r),d=a;const n=i.params.speed,o=()=>{i&&!i.destroyed&&(i.params.autoplay.reverseDirection?!i.isBeginning||i.params.loop||i.params.rewind?(i.slidePrev(n,!0,!0),l("autoplay")):i.params.autoplay.stopOnLastSlide||(i.slideTo(i.slides.length-1,n,!0,!0),l("autoplay")):!i.isEnd||i.params.loop||i.params.rewind?(i.slideNext(n,!0,!0),l("autoplay")):i.params.autoplay.stopOnLastSlide||(i.slideTo(0,n,!0,!0),l("autoplay")),i.params.cssMode&&(w=(new Date).getTime(),requestAnimationFrame((()=>{E()}))))};return a>0?(clearTimeout(t),t=setTimeout((()=>{o()}),a)):requestAnimationFrame((()=>{o()})),a},x=()=>{i.autoplay.running=!0,E(),l("autoplayStart")},S=()=>{i.autoplay.running=!1,clearTimeout(t),cancelAnimationFrame(s),l("autoplayStop")},T=(e,s)=>{if(i.destroyed||!i.autoplay.running)return;clearTimeout(t),e||(f=!0);const a=()=>{l("autoplayPause"),i.params.autoplay.waitForTransition?i.wrapperEl.addEventListener("transitionend",b):M()};if(i.autoplay.paused=!0,s)return h&&(d=i.params.autoplay.delay),h=!1,void a();const r=d||i.params.autoplay.delay;d=r-((new Date).getTime()-w),i.isEnd&&d<0&&!i.params.loop||(d<0&&(d=0),a())},M=()=>{i.isEnd&&d<0&&!i.params.loop||i.destroyed||!i.autoplay.running||(w=(new Date).getTime(),f?(f=!1,E(d)):E(),i.autoplay.paused=!1,l("autoplayResume"))},C=()=>{if(i.destroyed||!i.autoplay.running)return;const e=a();"hidden"===e.visibilityState&&(f=!0,T(!0)),"visible"===e.visibilityState&&M()},P=e=>{"mouse"===e.pointerType&&(f=!0,T(!0))},L=e=>{"mouse"===e.pointerType&&i.autoplay.paused&&M()};n("init",(()=>{i.params.autoplay.enabled&&(i.params.autoplay.pauseOnMouseEnter&&(i.el.addEventListener("pointerenter",P),i.el.addEventListener("pointerleave",L)),a().addEventListener("visibilitychange",C),w=(new Date).getTime(),x())})),n("destroy",(()=>{i.el.removeEventListener("pointerenter",P),i.el.removeEventListener("pointerleave",L),a().removeEventListener("visibilitychange",C),i.autoplay.running&&S()})),n("beforeTransitionStart",((e,t,s)=>{!i.destroyed&&i.autoplay.running&&(s||!i.params.autoplay.disableOnInteraction?T(!0,!0):S())})),n("sliderFirstMove",(()=>{!i.destroyed&&i.autoplay.running&&(i.params.autoplay.disableOnInteraction?S():(p=!0,u=!1,f=!1,m=setTimeout((()=>{f=!0,u=!0,T(!0)}),200)))})),n("touchEnd",(()=>{if(!i.destroyed&&i.autoplay.running&&p){if(clearTimeout(m),clearTimeout(t),i.params.autoplay.disableOnInteraction)return u=!1,void(p=!1);u&&i.params.cssMode&&M(),u=!1,p=!1}})),n("slideChange",(()=>{!i.destroyed&&i.autoplay.running&&(h=!0)})),Object.assign(i.autoplay,{start:x,stop:S,pause:T,resume:M})},function(e){let{swiper:t,extendParams:s,on:i}=e;s({thumbs:{swiper:null,multipleActiveThumbs:!0,autoScrollOffset:0,slideThumbActiveClass:"swiper-slide-thumb-active",thumbsContainerClass:"swiper-thumbs"}});let r=!1,n=!1;function l(){const e=t.thumbs.swiper;if(!e||e.destroyed)return;const s=e.clickedIndex,a=e.clickedSlide;if(a&&a.classList.contains(t.params.thumbs.slideThumbActiveClass))return;if(null==s)return;let i;i=e.params.loop?parseInt(e.clickedSlide.getAttribute("data-swiper-slide-index"),10):s,t.params.loop?t.slideToLoop(i):t.slideTo(i)}function o(){const{thumbs:e}=t.params;if(r)return!1;r=!0;const s=t.constructor;if(e.swiper instanceof s)t.thumbs.swiper=e.swiper,Object.assign(t.thumbs.swiper.originalParams,{watchSlidesProgress:!0,slideToClickedSlide:!1}),Object.assign(t.thumbs.swiper.params,{watchSlidesProgress:!0,slideToClickedSlide:!1}),t.thumbs.swiper.update();else if(d(e.swiper)){const a=Object.assign({},e.swiper);Object.assign(a,{watchSlidesProgress:!0,slideToClickedSlide:!1}),t.thumbs.swiper=new s(a),n=!0}return t.thumbs.swiper.el.classList.add(t.params.thumbs.thumbsContainerClass),t.thumbs.swiper.on("tap",l),!0}function c(e){const s=t.thumbs.swiper;if(!s||s.destroyed)return;const a="auto"===s.params.slidesPerView?s.slidesPerViewDynamic():s.params.slidesPerView;let i=1;const r=t.params.thumbs.slideThumbActiveClass;if(t.params.slidesPerView>1&&!t.params.centeredSlides&&(i=t.params.slidesPerView),t.params.thumbs.multipleActiveThumbs||(i=1),i=Math.floor(i),s.slides.forEach((e=>e.classList.remove(r))),s.params.loop||s.params.virtual&&s.params.virtual.enabled)for(let e=0;e<i;e+=1)f(s.slidesEl,`[data-swiper-slide-index="${t.realIndex+e}"]`).forEach((e=>{e.classList.add(r)}));else for(let e=0;e<i;e+=1)s.slides[t.realIndex+e]&&s.slides[t.realIndex+e].classList.add(r);const n=t.params.thumbs.autoScrollOffset,l=n&&!s.params.loop;if(t.realIndex!==s.realIndex||l){const i=s.activeIndex;let r,o;if(s.params.loop){const e=s.slides.filter((e=>e.getAttribute("data-swiper-slide-index")===`${t.realIndex}`))[0];r=s.slides.indexOf(e),o=t.activeIndex>t.previousIndex?"next":"prev"}else r=t.realIndex,o=r>t.previousIndex?"next":"prev";l&&(r+="next"===o?n:-1*n),s.visibleSlidesIndexes&&s.visibleSlidesIndexes.indexOf(r)<0&&(s.params.centeredSlides?r=r>i?r-Math.floor(a/2)+1:r+Math.floor(a/2)-1:r>i&&s.params.slidesPerGroup,s.slideTo(r,e?0:void 0))}}t.thumbs={swiper:null},i("beforeInit",(()=>{const{thumbs:e}=t.params;if(e&&e.swiper)if("string"==typeof e.swiper||e.swiper instanceof HTMLElement){const s=a(),i=()=>{const a="string"==typeof e.swiper?s.querySelector(e.swiper):e.swiper;if(a&&a.swiper)e.swiper=a.swiper,o(),c(!0);else if(a){const s=i=>{e.swiper=i.detail[0],a.removeEventListener("init",s),o(),c(!0),e.swiper.update(),t.update()};a.addEventListener("init",s)}return a},r=()=>{if(t.destroyed)return;i()||requestAnimationFrame(r)};requestAnimationFrame(r)}else o(),c(!0)})),i("slideChange update resize observerUpdate",(()=>{c()})),i("setTransition",((e,s)=>{const a=t.thumbs.swiper;a&&!a.destroyed&&a.setTransition(s)})),i("beforeDestroy",(()=>{const e=t.thumbs.swiper;e&&!e.destroyed&&n&&e.destroy()})),Object.assign(t.thumbs,{init:o,update:c})},function(e){let{swiper:t,extendParams:s,emit:a,once:i}=e;s({freeMode:{enabled:!1,momentum:!0,momentumRatio:1,momentumBounce:!0,momentumBounceRatio:1,momentumVelocityRatio:1,sticky:!1,minimumVelocity:.02}}),Object.assign(t,{freeMode:{onTouchStart:function(){const e=t.getTranslate();t.setTranslate(e),t.setTransition(0),t.touchEventsData.velocities.length=0,t.freeMode.onTouchEnd({currentPos:t.rtl?t.translate:-t.translate})},onTouchMove:function(){const{touchEventsData:e,touches:s}=t;0===e.velocities.length&&e.velocities.push({position:s[t.isHorizontal()?"startX":"startY"],time:e.touchStartTime}),e.velocities.push({position:s[t.isHorizontal()?"currentX":"currentY"],time:l()})},onTouchEnd:function(e){let{currentPos:s}=e;const{params:r,wrapperEl:n,rtlTranslate:o,snapGrid:d,touchEventsData:c}=t,p=l()-c.touchStartTime;if(s<-t.minTranslate())t.slideTo(t.activeIndex);else if(s>-t.maxTranslate())t.slides.length<d.length?t.slideTo(d.length-1):t.slideTo(t.slides.length-1);else{if(r.freeMode.momentum){if(c.velocities.length>1){const e=c.velocities.pop(),s=c.velocities.pop(),a=e.position-s.position,i=e.time-s.time;t.velocity=a/i,t.velocity/=2,Math.abs(t.velocity)<r.freeMode.minimumVelocity&&(t.velocity=0),(i>150||l()-e.time>300)&&(t.velocity=0)}else t.velocity=0;t.velocity*=r.freeMode.momentumVelocityRatio,c.velocities.length=0;let e=1e3*r.freeMode.momentumRatio;const s=t.velocity*e;let p=t.translate+s;o&&(p=-p);let u,m=!1;const h=20*Math.abs(t.velocity)*r.freeMode.momentumBounceRatio;let f;if(p<t.maxTranslate())r.freeMode.momentumBounce?(p+t.maxTranslate()<-h&&(p=t.maxTranslate()-h),u=t.maxTranslate(),m=!0,c.allowMomentumBounce=!0):p=t.maxTranslate(),r.loop&&r.centeredSlides&&(f=!0);else if(p>t.minTranslate())r.freeMode.momentumBounce?(p-t.minTranslate()>h&&(p=t.minTranslate()+h),u=t.minTranslate(),m=!0,c.allowMomentumBounce=!0):p=t.minTranslate(),r.loop&&r.centeredSlides&&(f=!0);else if(r.freeMode.sticky){let e;for(let t=0;t<d.length;t+=1)if(d[t]>-p){e=t;break}p=Math.abs(d[e]-p)<Math.abs(d[e-1]-p)||"next"===t.swipeDirection?d[e]:d[e-1],p=-p}if(f&&i("transitionEnd",(()=>{t.loopFix()})),0!==t.velocity){if(e=o?Math.abs((-p-t.translate)/t.velocity):Math.abs((p-t.translate)/t.velocity),r.freeMode.sticky){const s=Math.abs((o?-p:p)-t.translate),a=t.slidesSizesGrid[t.activeIndex];e=s<a?r.speed:s<2*a?1.5*r.speed:2.5*r.speed}}else if(r.freeMode.sticky)return void t.slideToClosest();r.freeMode.momentumBounce&&m?(t.updateProgress(u),t.setTransition(e),t.setTranslate(p),t.transitionStart(!0,t.swipeDirection),t.animating=!0,E(n,(()=>{t&&!t.destroyed&&c.allowMomentumBounce&&(a("momentumBounce"),t.setTransition(r.speed),setTimeout((()=>{t.setTranslate(u),E(n,(()=>{t&&!t.destroyed&&t.transitionEnd()}))}),0))}))):t.velocity?(a("_freeModeNoMomentumRelease"),t.updateProgress(p),t.setTransition(e),t.setTranslate(p),t.transitionStart(!0,t.swipeDirection),t.animating||(t.animating=!0,E(n,(()=>{t&&!t.destroyed&&t.transitionEnd()})))):t.updateProgress(p),t.updateActiveIndex(),t.updateSlidesClasses()}else{if(r.freeMode.sticky)return void t.slideToClosest();r.freeMode&&a("_freeModeNoMomentumRelease")}(!r.freeMode.momentum||p>=r.longSwipesMs)&&(t.updateProgress(),t.updateActiveIndex(),t.updateSlidesClasses())}}}})},function(e){let t,s,a,{swiper:i,extendParams:r}=e;r({grid:{rows:1,fill:"column"}}),i.grid={initSlides:e=>{const{slidesPerView:r}=i.params,{rows:n,fill:l}=i.params.grid;s=t/n,a=Math.floor(e/n),t=Math.floor(e/n)===e/n?e:Math.ceil(e/n)*n,"auto"!==r&&"row"===l&&(t=Math.max(t,r*n))},updateSlide:(e,r,n,l)=>{const{slidesPerGroup:o,spaceBetween:d}=i.params,{rows:c,fill:p}=i.params.grid;let u,m,h;if("row"===p&&o>1){const s=Math.floor(e/(o*c)),a=e-c*o*s,i=0===s?o:Math.min(Math.ceil((n-s*c*o)/c),o);h=Math.floor(a/i),m=a-h*i+s*o,u=m+h*t/c,r.style.order=u}else"column"===p?(m=Math.floor(e/c),h=e-m*c,(m>a||m===a&&h===c-1)&&(h+=1,h>=c&&(h=0,m+=1))):(h=Math.floor(e/s),m=e-h*s);r.style[l("margin-top")]=0!==h?d&&`${d}px`:""},updateWrapperSize:(e,s,a)=>{const{spaceBetween:r,centeredSlides:n,roundLengths:l}=i.params,{rows:o}=i.params.grid;if(i.virtualSize=(e+r)*t,i.virtualSize=Math.ceil(i.virtualSize/o)-r,i.wrapperEl.style[a("width")]=`${i.virtualSize+r}px`,n){const e=[];for(let t=0;t<s.length;t+=1){let a=s[t];l&&(a=Math.floor(a)),s[t]<i.virtualSize+s[0]&&e.push(a)}s.splice(0,s.length),s.push(...e)}}}},function(e){let{swiper:t}=e;Object.assign(t,{appendSlide:se.bind(t),prependSlide:ae.bind(t),addSlide:ie.bind(t),removeSlide:re.bind(t),removeAllSlides:ne.bind(t)})},function(e){let{swiper:t,extendParams:s,on:a}=e;s({fadeEffect:{crossFade:!1}}),le({effect:"fade",swiper:t,on:a,setTranslate:()=>{const{slides:e}=t;t.params.fadeEffect;for(let s=0;s<e.length;s+=1){const e=t.slides[s];let a=-e.swiperSlideOffset;t.params.virtualTranslate||(a-=t.translate);let i=0;t.isHorizontal()||(i=a,a=0);const r=t.params.fadeEffect.crossFade?Math.max(1-Math.abs(e.progress),0):1+Math.min(Math.max(e.progress,-1),0),n=oe(0,e);n.style.opacity=r,n.style.transform=`translate3d(${a}px, ${i}px, 0px)`}},setTransition:e=>{const s=t.slides.map((e=>h(e)));s.forEach((t=>{t.style.transitionDuration=`${e}ms`})),de({swiper:t,duration:e,transformElements:s,allSlides:!0})},overwriteParams:()=>({slidesPerView:1,slidesPerGroup:1,watchSlidesProgress:!0,spaceBetween:0,virtualTranslate:!t.params.cssMode})})},function(e){let{swiper:t,extendParams:s,on:a}=e;s({cubeEffect:{slideShadows:!0,shadow:!0,shadowOffset:20,shadowScale:.94}});const i=(e,t,s)=>{let a=s?e.querySelector(".swiper-slide-shadow-left"):e.querySelector(".swiper-slide-shadow-top"),i=s?e.querySelector(".swiper-slide-shadow-right"):e.querySelector(".swiper-slide-shadow-bottom");a||(a=g("div","swiper-slide-shadow-"+(s?"left":"top")),e.append(a)),i||(i=g("div","swiper-slide-shadow-"+(s?"right":"bottom")),e.append(i)),a&&(a.style.opacity=Math.max(-t,0)),i&&(i.style.opacity=Math.max(t,0))};le({effect:"cube",swiper:t,on:a,setTranslate:()=>{const{el:e,wrapperEl:s,slides:a,width:r,height:n,rtlTranslate:l,size:o,browser:d}=t,c=t.params.cubeEffect,p=t.isHorizontal(),u=t.virtual&&t.params.virtual.enabled;let m,h=0;c.shadow&&(p?(m=t.slidesEl.querySelector(".swiper-cube-shadow"),m||(m=g("div","swiper-cube-shadow"),t.slidesEl.append(m)),m.style.height=`${r}px`):(m=e.querySelector(".swiper-cube-shadow"),m||(m=g("div","swiper-cube-shadow"),e.append(m))));for(let e=0;e<a.length;e+=1){const t=a[e];let s=e;u&&(s=parseInt(t.getAttribute("data-swiper-slide-index"),10));let r=90*s,n=Math.floor(r/360);l&&(r=-r,n=Math.floor(-r/360));const d=Math.max(Math.min(t.progress,1),-1);let m=0,f=0,g=0;s%4==0?(m=4*-n*o,g=0):(s-1)%4==0?(m=0,g=4*-n*o):(s-2)%4==0?(m=o+4*n*o,g=o):(s-3)%4==0&&(m=-o,g=3*o+4*o*n),l&&(m=-m),p||(f=m,m=0);const v=`rotateX(${p?0:-r}deg) rotateY(${p?r:0}deg) translate3d(${m}px, ${f}px, ${g}px)`;d<=1&&d>-1&&(h=90*s+90*d,l&&(h=90*-s-90*d)),t.style.transform=v,c.slideShadows&&i(t,d,p)}if(s.style.transformOrigin=`50% 50% -${o/2}px`,s.style["-webkit-transform-origin"]=`50% 50% -${o/2}px`,c.shadow)if(p)m.style.transform=`translate3d(0px, ${r/2+c.shadowOffset}px, ${-r/2}px) rotateX(90deg) rotateZ(0deg) scale(${c.shadowScale})`;else{const e=Math.abs(h)-90*Math.floor(Math.abs(h)/90),t=1.5-(Math.sin(2*e*Math.PI/360)/2+Math.cos(2*e*Math.PI/360)/2),s=c.shadowScale,a=c.shadowScale/t,i=c.shadowOffset;m.style.transform=`scale3d(${s}, 1, ${a}) translate3d(0px, ${n/2+i}px, ${-n/2/a}px) rotateX(-90deg)`}const f=(d.isSafari||d.isWebView)&&d.needPerspectiveFix?-o/2:0;s.style.transform=`translate3d(0px,0,${f}px) rotateX(${t.isHorizontal()?0:h}deg) rotateY(${t.isHorizontal()?-h:0}deg)`,s.style.setProperty("--swiper-cube-translate-z",`${f}px`)},setTransition:e=>{const{el:s,slides:a}=t;if(a.forEach((t=>{t.style.transitionDuration=`${e}ms`,t.querySelectorAll(".swiper-slide-shadow-top, .swiper-slide-shadow-right, .swiper-slide-shadow-bottom, .swiper-slide-shadow-left").forEach((t=>{t.style.transitionDuration=`${e}ms`}))})),t.params.cubeEffect.shadow&&!t.isHorizontal()){const t=s.querySelector(".swiper-cube-shadow");t&&(t.style.transitionDuration=`${e}ms`)}},recreateShadows:()=>{const e=t.isHorizontal();t.slides.forEach((t=>{const s=Math.max(Math.min(t.progress,1),-1);i(t,s,e)}))},getEffectParams:()=>t.params.cubeEffect,perspective:()=>!0,overwriteParams:()=>({slidesPerView:1,slidesPerGroup:1,watchSlidesProgress:!0,resistanceRatio:0,spaceBetween:0,centeredSlides:!1,virtualTranslate:!0})})},function(e){let{swiper:t,extendParams:s,on:a}=e;s({flipEffect:{slideShadows:!0,limitRotation:!0}});const i=(e,s,a)=>{let i=t.isHorizontal()?e.querySelector(".swiper-slide-shadow-left"):e.querySelector(".swiper-slide-shadow-top"),r=t.isHorizontal()?e.querySelector(".swiper-slide-shadow-right"):e.querySelector(".swiper-slide-shadow-bottom");i||(i=ce(0,e,t.isHorizontal()?"left":"top")),r||(r=ce(0,e,t.isHorizontal()?"right":"bottom")),i&&(i.style.opacity=Math.max(-s,0)),r&&(r.style.opacity=Math.max(s,0))};le({effect:"flip",swiper:t,on:a,setTranslate:()=>{const{slides:e,rtlTranslate:s}=t,a=t.params.flipEffect;for(let r=0;r<e.length;r+=1){const n=e[r];let l=n.progress;t.params.flipEffect.limitRotation&&(l=Math.max(Math.min(n.progress,1),-1));const o=n.swiperSlideOffset;let d=-180*l,c=0,p=t.params.cssMode?-o-t.translate:-o,u=0;t.isHorizontal()?s&&(d=-d):(u=p,p=0,c=-d,d=0),n.style.zIndex=-Math.abs(Math.round(l))+e.length,a.slideShadows&&i(n,l);const m=`translate3d(${p}px, ${u}px, 0px) rotateX(${c}deg) rotateY(${d}deg)`;oe(0,n).style.transform=m}},setTransition:e=>{const s=t.slides.map((e=>h(e)));s.forEach((t=>{t.style.transitionDuration=`${e}ms`,t.querySelectorAll(".swiper-slide-shadow-top, .swiper-slide-shadow-right, .swiper-slide-shadow-bottom, .swiper-slide-shadow-left").forEach((t=>{t.style.transitionDuration=`${e}ms`}))})),de({swiper:t,duration:e,transformElements:s})},recreateShadows:()=>{t.params.flipEffect;t.slides.forEach((e=>{let s=e.progress;t.params.flipEffect.limitRotation&&(s=Math.max(Math.min(e.progress,1),-1)),i(e,s)}))},getEffectParams:()=>t.params.flipEffect,perspective:()=>!0,overwriteParams:()=>({slidesPerView:1,slidesPerGroup:1,watchSlidesProgress:!0,spaceBetween:0,virtualTranslate:!t.params.cssMode})})},function(e){let{swiper:t,extendParams:s,on:a}=e;s({coverflowEffect:{rotate:50,stretch:0,depth:100,scale:1,modifier:1,slideShadows:!0}}),le({effect:"coverflow",swiper:t,on:a,setTranslate:()=>{const{width:e,height:s,slides:a,slidesSizesGrid:i}=t,r=t.params.coverflowEffect,n=t.isHorizontal(),l=t.translate,o=n?e/2-l:s/2-l,d=n?r.rotate:-r.rotate,c=r.depth;for(let e=0,t=a.length;e<t;e+=1){const t=a[e],s=i[e],l=(o-t.swiperSlideOffset-s/2)/s,p="function"==typeof r.modifier?r.modifier(l):l*r.modifier;let u=n?d*p:0,m=n?0:d*p,h=-c*Math.abs(p),f=r.stretch;"string"==typeof f&&-1!==f.indexOf("%")&&(f=parseFloat(r.stretch)/100*s);let g=n?0:f*p,v=n?f*p:0,w=1-(1-r.scale)*Math.abs(p);Math.abs(v)<.001&&(v=0),Math.abs(g)<.001&&(g=0),Math.abs(h)<.001&&(h=0),Math.abs(u)<.001&&(u=0),Math.abs(m)<.001&&(m=0),Math.abs(w)<.001&&(w=0);const b=`translate3d(${v}px,${g}px,${h}px)  rotateX(${m}deg) rotateY(${u}deg) scale(${w})`;if(oe(0,t).style.transform=b,t.style.zIndex=1-Math.abs(Math.round(p)),r.slideShadows){let e=n?t.querySelector(".swiper-slide-shadow-left"):t.querySelector(".swiper-slide-shadow-top"),s=n?t.querySelector(".swiper-slide-shadow-right"):t.querySelector(".swiper-slide-shadow-bottom");e||(e=ce(0,t,n?"left":"top")),s||(s=ce(0,t,n?"right":"bottom")),e&&(e.style.opacity=p>0?p:0),s&&(s.style.opacity=-p>0?-p:0)}}},setTransition:e=>{t.slides.map((e=>h(e))).forEach((t=>{t.style.transitionDuration=`${e}ms`,t.querySelectorAll(".swiper-slide-shadow-top, .swiper-slide-shadow-right, .swiper-slide-shadow-bottom, .swiper-slide-shadow-left").forEach((t=>{t.style.transitionDuration=`${e}ms`}))}))},perspective:()=>!0,overwriteParams:()=>({watchSlidesProgress:!0})})},function(e){let{swiper:t,extendParams:s,on:a}=e;s({creativeEffect:{limitProgress:1,shadowPerProgress:!1,progressMultiplier:1,perspective:!0,prev:{translate:[0,0,0],rotate:[0,0,0],opacity:1,scale:1},next:{translate:[0,0,0],rotate:[0,0,0],opacity:1,scale:1}}});const i=e=>"string"==typeof e?e:`${e}px`;le({effect:"creative",swiper:t,on:a,setTranslate:()=>{const{slides:e,wrapperEl:s,slidesSizesGrid:a}=t,r=t.params.creativeEffect,{progressMultiplier:n}=r,l=t.params.centeredSlides;if(l){const e=a[0]/2-t.params.slidesOffsetBefore||0;s.style.transform=`translateX(calc(50% - ${e}px))`}for(let s=0;s<e.length;s+=1){const a=e[s],o=a.progress,d=Math.min(Math.max(a.progress,-r.limitProgress),r.limitProgress);let c=d;l||(c=Math.min(Math.max(a.originalProgress,-r.limitProgress),r.limitProgress));const p=a.swiperSlideOffset,u=[t.params.cssMode?-p-t.translate:-p,0,0],m=[0,0,0];let h=!1;t.isHorizontal()||(u[1]=u[0],u[0]=0);let f={translate:[0,0,0],rotate:[0,0,0],scale:1,opacity:1};d<0?(f=r.next,h=!0):d>0&&(f=r.prev,h=!0),u.forEach(((e,t)=>{u[t]=`calc(${e}px + (${i(f.translate[t])} * ${Math.abs(d*n)}))`})),m.forEach(((e,t)=>{m[t]=f.rotate[t]*Math.abs(d*n)})),a.style.zIndex=-Math.abs(Math.round(o))+e.length;const g=u.join(", "),v=`rotateX(${m[0]}deg) rotateY(${m[1]}deg) rotateZ(${m[2]}deg)`,w=c<0?`scale(${1+(1-f.scale)*c*n})`:`scale(${1-(1-f.scale)*c*n})`,b=c<0?1+(1-f.opacity)*c*n:1-(1-f.opacity)*c*n,y=`translate3d(${g}) ${v} ${w}`;if(h&&f.shadow||!h){let e=a.querySelector(".swiper-slide-shadow");if(!e&&f.shadow&&(e=ce(0,a)),e){const t=r.shadowPerProgress?d*(1/r.limitProgress):d;e.style.opacity=Math.min(Math.max(Math.abs(t),0),1)}}const E=oe(0,a);E.style.transform=y,E.style.opacity=b,f.origin&&(E.style.transformOrigin=f.origin)}},setTransition:e=>{const s=t.slides.map((e=>h(e)));s.forEach((t=>{t.style.transitionDuration=`${e}ms`,t.querySelectorAll(".swiper-slide-shadow").forEach((t=>{t.style.transitionDuration=`${e}ms`}))})),de({swiper:t,duration:e,transformElements:s,allSlides:!0})},perspective:()=>t.params.creativeEffect.perspective,overwriteParams:()=>({watchSlidesProgress:!0,virtualTranslate:!t.params.cssMode})})},function(e){let{swiper:t,extendParams:s,on:a}=e;s({cardsEffect:{slideShadows:!0,rotate:!0,perSlideRotate:2,perSlideOffset:8}}),le({effect:"cards",swiper:t,on:a,setTranslate:()=>{const{slides:e,activeIndex:s}=t,a=t.params.cardsEffect,{startTranslate:i,isTouched:r}=t.touchEventsData,n=t.translate;for(let l=0;l<e.length;l+=1){const o=e[l],d=o.progress,c=Math.min(Math.max(d,-4),4);let p=o.swiperSlideOffset;t.params.centeredSlides&&!t.params.cssMode&&(t.wrapperEl.style.transform=`translateX(${t.minTranslate()}px)`),t.params.centeredSlides&&t.params.cssMode&&(p-=e[0].swiperSlideOffset);let u=t.params.cssMode?-p-t.translate:-p,m=0;const h=-100*Math.abs(c);let f=1,g=-a.perSlideRotate*c,v=a.perSlideOffset-.75*Math.abs(c);const w=t.virtual&&t.params.virtual.enabled?t.virtual.from+l:l,b=(w===s||w===s-1)&&c>0&&c<1&&(r||t.params.cssMode)&&n<i,y=(w===s||w===s+1)&&c<0&&c>-1&&(r||t.params.cssMode)&&n>i;if(b||y){const e=(1-Math.abs((Math.abs(c)-.5)/.5))**.5;g+=-28*c*e,f+=-.5*e,v+=96*e,m=-25*e*Math.abs(c)+"%"}if(u=c<0?`calc(${u}px + (${v*Math.abs(c)}%))`:c>0?`calc(${u}px + (-${v*Math.abs(c)}%))`:`${u}px`,!t.isHorizontal()){const e=m;m=u,u=e}const E=c<0?""+(1+(1-f)*c):""+(1-(1-f)*c),x=`\n        translate3d(${u}, ${m}, ${h}px)\n        rotateZ(${a.rotate?g:0}deg)\n        scale(${E})\n      `;if(a.slideShadows){let e=o.querySelector(".swiper-slide-shadow");e||(e=ce(0,o)),e&&(e.style.opacity=Math.min(Math.max((Math.abs(c)-.5)/.5,0),1))}o.style.zIndex=-Math.abs(Math.round(d))+e.length;oe(0,o).style.transform=x}},setTransition:e=>{const s=t.slides.map((e=>h(e)));s.forEach((t=>{t.style.transitionDuration=`${e}ms`,t.querySelectorAll(".swiper-slide-shadow").forEach((t=>{t.style.transitionDuration=`${e}ms`}))})),de({swiper:t,duration:e,transformElements:s})},perspective:()=>!0,overwriteParams:()=>({watchSlidesProgress:!0,virtualTranslate:!t.params.cssMode})})}];return J.use(pe),J}));

/*! Morphext - v2.4.7 - 2016-11-04 */
!function(a){"use strict";function b(b,c){this.element=a(b),this.settings=a.extend({},d,c),this._defaults=d,this._init()}var c="Morphext",d={animation:"bounceIn",separator:",",speed:2e3,complete:a.noop};b.prototype={_init:function(){var b=this;this.phrases=[],this.element.addClass("morphext"),a.each(this.element.text().split(this.settings.separator),function(c,d){b.phrases.push(a.trim(d))}),this.index=-1,this.animate(),this.start()},animate:function(){this.index=++this.index%this.phrases.length,this.element[0].innerHTML='<span class="animated '+this.settings.animation+'">'+this.phrases[this.index]+"</span>",a.isFunction(this.settings.complete)&&this.settings.complete.call(this)},start:function(){var a=this;this._interval=setInterval(function(){a.animate()},this.settings.speed)},stop:function(){this._interval=clearInterval(this._interval)}},a.fn[c]=function(d){return this.each(function(){a.data(this,"plugin_"+c)||a.data(this,"plugin_"+c,new b(this,d))})}}(jQuery);

/*!
 *
 *   typed.js - A JavaScript Typing Animation Library
 *   Author: Matt Boldt <me@mattboldt.com>
 *   Version: v2.0.12
 *   Url: https://github.com/mattboldt/typed.js
 *   License(s): MIT
 *
 */
(function(t,e){"object"==typeof exports&&"object"==typeof module?module.exports=e():"function"==typeof define&&define.amd?define([],e):"object"==typeof exports?exports.Typed=e():t.Typed=e()})(this,function(){return function(t){function e(n){if(s[n])return s[n].exports;var i=s[n]={exports:{},id:n,loaded:!1};return t[n].call(i.exports,i,i.exports,e),i.loaded=!0,i.exports}var s={};return e.m=t,e.c=s,e.p="",e(0)}([function(t,e,s){"use strict";function n(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}Object.defineProperty(e,"__esModule",{value:!0});var i=function(){function t(t,e){for(var s=0;s<e.length;s++){var n=e[s];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}return function(e,s,n){return s&&t(e.prototype,s),n&&t(e,n),e}}(),r=s(1),o=s(3),a=function(){function t(e,s){n(this,t),r.initializer.load(this,s,e),this.begin()}return i(t,[{key:"toggle",value:function(){this.pause.status?this.start():this.stop()}},{key:"stop",value:function(){this.typingComplete||this.pause.status||(this.toggleBlinking(!0),this.pause.status=!0,this.options.onStop(this.arrayPos,this))}},{key:"start",value:function(){this.typingComplete||this.pause.status&&(this.pause.status=!1,this.pause.typewrite?this.typewrite(this.pause.curString,this.pause.curStrPos):this.backspace(this.pause.curString,this.pause.curStrPos),this.options.onStart(this.arrayPos,this))}},{key:"destroy",value:function(){this.reset(!1),this.options.onDestroy(this)}},{key:"reset",value:function(){var t=arguments.length<=0||void 0===arguments[0]||arguments[0];clearInterval(this.timeout),this.replaceText(""),this.cursor&&this.cursor.parentNode&&(this.cursor.parentNode.removeChild(this.cursor),this.cursor=null),this.strPos=0,this.arrayPos=0,this.curLoop=0,t&&(this.insertCursor(),this.options.onReset(this),this.begin())}},{key:"begin",value:function(){var t=this;this.options.onBegin(this),this.typingComplete=!1,this.shuffleStringsIfNeeded(this),this.insertCursor(),this.bindInputFocusEvents&&this.bindFocusEvents(),this.timeout=setTimeout(function(){t.currentElContent&&0!==t.currentElContent.length?t.backspace(t.currentElContent,t.currentElContent.length):t.typewrite(t.strings[t.sequence[t.arrayPos]],t.strPos)},this.startDelay)}},{key:"typewrite",value:function(t,e){var s=this;this.fadeOut&&this.el.classList.contains(this.fadeOutClass)&&(this.el.classList.remove(this.fadeOutClass),this.cursor&&this.cursor.classList.remove(this.fadeOutClass));var n=this.humanizer(this.typeSpeed),i=1;return this.pause.status===!0?void this.setPauseStatus(t,e,!0):void(this.timeout=setTimeout(function(){e=o.htmlParser.typeHtmlChars(t,e,s);var n=0,r=t.substr(e);if("^"===r.charAt(0)&&/^\^\d+/.test(r)){var a=1;r=/\d+/.exec(r)[0],a+=r.length,n=parseInt(r),s.temporaryPause=!0,s.options.onTypingPaused(s.arrayPos,s),t=t.substring(0,e)+t.substring(e+a),s.toggleBlinking(!0)}if("`"===r.charAt(0)){for(;"`"!==t.substr(e+i).charAt(0)&&(i++,!(e+i>t.length)););var u=t.substring(0,e),l=t.substring(u.length+1,e+i),c=t.substring(e+i+1);t=u+l+c,i--}s.timeout=setTimeout(function(){s.toggleBlinking(!1),e>=t.length?s.doneTyping(t,e):s.keepTyping(t,e,i),s.temporaryPause&&(s.temporaryPause=!1,s.options.onTypingResumed(s.arrayPos,s))},n)},n))}},{key:"keepTyping",value:function(t,e,s){0===e&&(this.toggleBlinking(!1),this.options.preStringTyped(this.arrayPos,this)),e+=s;var n=t.substr(0,e);this.replaceText(n),this.typewrite(t,e)}},{key:"doneTyping",value:function(t,e){var s=this;this.options.onStringTyped(this.arrayPos,this),this.toggleBlinking(!0),this.arrayPos===this.strings.length-1&&(this.complete(),this.loop===!1||this.curLoop===this.loopCount)||(this.timeout=setTimeout(function(){s.backspace(t,e)},this.backDelay))}},{key:"backspace",value:function(t,e){var s=this;if(this.pause.status===!0)return void this.setPauseStatus(t,e,!1);if(this.fadeOut)return this.initFadeOut();this.toggleBlinking(!1);var n=this.humanizer(this.backSpeed);this.timeout=setTimeout(function(){e=o.htmlParser.backSpaceHtmlChars(t,e,s);var n=t.substr(0,e);if(s.replaceText(n),s.smartBackspace){var i=s.strings[s.arrayPos+1];i&&n===i.substr(0,e)?s.stopNum=e:s.stopNum=0}e>s.stopNum?(e--,s.backspace(t,e)):e<=s.stopNum&&(s.arrayPos++,s.arrayPos===s.strings.length?(s.arrayPos=0,s.options.onLastStringBackspaced(),s.shuffleStringsIfNeeded(),s.begin()):s.typewrite(s.strings[s.sequence[s.arrayPos]],e))},n)}},{key:"complete",value:function(){this.options.onComplete(this),this.loop?this.curLoop++:this.typingComplete=!0}},{key:"setPauseStatus",value:function(t,e,s){this.pause.typewrite=s,this.pause.curString=t,this.pause.curStrPos=e}},{key:"toggleBlinking",value:function(t){this.cursor&&(this.pause.status||this.cursorBlinking!==t&&(this.cursorBlinking=t,t?this.cursor.classList.add("typed-cursor--blink"):this.cursor.classList.remove("typed-cursor--blink")))}},{key:"humanizer",value:function(t){return Math.round(Math.random()*t/2)+t}},{key:"shuffleStringsIfNeeded",value:function(){this.shuffle&&(this.sequence=this.sequence.sort(function(){return Math.random()-.5}))}},{key:"initFadeOut",value:function(){var t=this;return this.el.className+=" "+this.fadeOutClass,this.cursor&&(this.cursor.className+=" "+this.fadeOutClass),setTimeout(function(){t.arrayPos++,t.replaceText(""),t.strings.length>t.arrayPos?t.typewrite(t.strings[t.sequence[t.arrayPos]],0):(t.typewrite(t.strings[0],0),t.arrayPos=0)},this.fadeOutDelay)}},{key:"replaceText",value:function(t){this.attr?this.el.setAttribute(this.attr,t):this.isInput?this.el.value=t:"html"===this.contentType?this.el.innerHTML=t:this.el.textContent=t}},{key:"bindFocusEvents",value:function(){var t=this;this.isInput&&(this.el.addEventListener("focus",function(e){t.stop()}),this.el.addEventListener("blur",function(e){t.el.value&&0!==t.el.value.length||t.start()}))}},{key:"insertCursor",value:function(){this.showCursor&&(this.cursor||(this.cursor=document.createElement("span"),this.cursor.className="typed-cursor",this.cursor.setAttribute("aria-hidden",!0),this.cursor.innerHTML=this.cursorChar,this.el.parentNode&&this.el.parentNode.insertBefore(this.cursor,this.el.nextSibling)))}}]),t}();e["default"]=a,t.exports=e["default"]},function(t,e,s){"use strict";function n(t){return t&&t.__esModule?t:{"default":t}}function i(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}Object.defineProperty(e,"__esModule",{value:!0});var r=Object.assign||function(t){for(var e=1;e<arguments.length;e++){var s=arguments[e];for(var n in s)Object.prototype.hasOwnProperty.call(s,n)&&(t[n]=s[n])}return t},o=function(){function t(t,e){for(var s=0;s<e.length;s++){var n=e[s];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}return function(e,s,n){return s&&t(e.prototype,s),n&&t(e,n),e}}(),a=s(2),u=n(a),l=function(){function t(){i(this,t)}return o(t,[{key:"load",value:function(t,e,s){if("string"==typeof s?t.el=document.querySelector(s):t.el=s,t.options=r({},u["default"],e),t.isInput="input"===t.el.tagName.toLowerCase(),t.attr=t.options.attr,t.bindInputFocusEvents=t.options.bindInputFocusEvents,t.showCursor=!t.isInput&&t.options.showCursor,t.cursorChar=t.options.cursorChar,t.cursorBlinking=!0,t.elContent=t.attr?t.el.getAttribute(t.attr):t.el.textContent,t.contentType=t.options.contentType,t.typeSpeed=t.options.typeSpeed,t.startDelay=t.options.startDelay,t.backSpeed=t.options.backSpeed,t.smartBackspace=t.options.smartBackspace,t.backDelay=t.options.backDelay,t.fadeOut=t.options.fadeOut,t.fadeOutClass=t.options.fadeOutClass,t.fadeOutDelay=t.options.fadeOutDelay,t.isPaused=!1,t.strings=t.options.strings.map(function(t){return t.trim()}),"string"==typeof t.options.stringsElement?t.stringsElement=document.querySelector(t.options.stringsElement):t.stringsElement=t.options.stringsElement,t.stringsElement){t.strings=[],t.stringsElement.style.display="none";var n=Array.prototype.slice.apply(t.stringsElement.children),i=n.length;if(i)for(var o=0;o<i;o+=1){var a=n[o];t.strings.push(a.innerHTML.trim())}}t.strPos=0,t.arrayPos=0,t.stopNum=0,t.loop=t.options.loop,t.loopCount=t.options.loopCount,t.curLoop=0,t.shuffle=t.options.shuffle,t.sequence=[],t.pause={status:!1,typewrite:!0,curString:"",curStrPos:0},t.typingComplete=!1;for(var o in t.strings)t.sequence[o]=o;t.currentElContent=this.getCurrentElContent(t),t.autoInsertCss=t.options.autoInsertCss,this.appendAnimationCss(t)}},{key:"getCurrentElContent",value:function(t){var e="";return e=t.attr?t.el.getAttribute(t.attr):t.isInput?t.el.value:"html"===t.contentType?t.el.innerHTML:t.el.textContent}},{key:"appendAnimationCss",value:function(t){var e="data-typed-js-css";if(t.autoInsertCss&&(t.showCursor||t.fadeOut)&&!document.querySelector("["+e+"]")){var s=document.createElement("style");s.type="text/css",s.setAttribute(e,!0);var n="";t.showCursor&&(n+="\n        .typed-cursor{\n          opacity: 1;\n        }\n        .typed-cursor.typed-cursor--blink{\n          animation: typedjsBlink 0.7s infinite;\n          -webkit-animation: typedjsBlink 0.7s infinite;\n                  animation: typedjsBlink 0.7s infinite;\n        }\n        @keyframes typedjsBlink{\n          50% { opacity: 0.0; }\n        }\n        @-webkit-keyframes typedjsBlink{\n          0% { opacity: 1; }\n          50% { opacity: 0.0; }\n          100% { opacity: 1; }\n        }\n      "),t.fadeOut&&(n+="\n        .typed-fade-out{\n          opacity: 0;\n          transition: opacity .25s;\n        }\n        .typed-cursor.typed-cursor--blink.typed-fade-out{\n          -webkit-animation: 0;\n          animation: 0;\n        }\n      "),0!==s.length&&(s.innerHTML=n,document.body.appendChild(s))}}}]),t}();e["default"]=l;var c=new l;e.initializer=c},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var s={strings:["These are the default values...","You know what you should do?","Use your own!","Have a great day!"],stringsElement:null,typeSpeed:0,startDelay:0,backSpeed:0,smartBackspace:!0,shuffle:!1,backDelay:700,fadeOut:!1,fadeOutClass:"typed-fade-out",fadeOutDelay:500,loop:!1,loopCount:1/0,showCursor:!0,cursorChar:"|",autoInsertCss:!0,attr:null,bindInputFocusEvents:!1,contentType:"html",onBegin:function(t){},onComplete:function(t){},preStringTyped:function(t,e){},onStringTyped:function(t,e){},onLastStringBackspaced:function(t){},onTypingPaused:function(t,e){},onTypingResumed:function(t,e){},onReset:function(t){},onStop:function(t,e){},onStart:function(t,e){},onDestroy:function(t){}};e["default"]=s,t.exports=e["default"]},function(t,e){"use strict";function s(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}Object.defineProperty(e,"__esModule",{value:!0});var n=function(){function t(t,e){for(var s=0;s<e.length;s++){var n=e[s];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}return function(e,s,n){return s&&t(e.prototype,s),n&&t(e,n),e}}(),i=function(){function t(){s(this,t)}return n(t,[{key:"typeHtmlChars",value:function(t,e,s){if("html"!==s.contentType)return e;var n=t.substr(e).charAt(0);if("<"===n||"&"===n){var i="";for(i="<"===n?">":";";t.substr(e+1).charAt(0)!==i&&(e++,!(e+1>t.length)););e++}return e}},{key:"backSpaceHtmlChars",value:function(t,e,s){if("html"!==s.contentType)return e;var n=t.substr(e).charAt(0);if(">"===n||";"===n){var i="";for(i=">"===n?"<":"&";t.substr(e-1).charAt(0)!==i&&(e--,!(e<0)););e--}return e}}]),t}();e["default"]=i;var r=new i;e.htmlParser=r}])});

/*jquery.mb.YTPlayer 23-01-2021
 _ jquery.mb.components
 _ email: matbicoc@gmail.com
 _ Copyright (c) 2001-2021. Matteo Bicocchi (Pupunzi);
 _ blog: http://pupunzi.open-lab.com
 _ Open Lab s.r.l., Florence - Italy
 */

var ytp=ytp||{};let YTPRndSuffix=(new Date).getTime(),YTPTimerLabels={init:"YTPlayerInit_"+YTPRndSuffix,startPlaying:"YTPlayerStartPlay_"+YTPRndSuffix};function onYouTubeIframeAPIReady(){ytp.YTAPIReady||(ytp.YTAPIReady=!0,jQuery(document).trigger("YTAPIReady"))}let getYTPVideoID=function(e){let r,t;return e.indexOf("youtu.be")>0||e.indexOf("youtube.com/embed")>0?r=(t=(r=e.substr(e.lastIndexOf("/")+1,e.length)).indexOf("?list=")>0?r.substr(r.lastIndexOf("="),r.length):null)?r.substr(0,r.lastIndexOf("?")):r:e.indexOf("http")>-1?(r=e.match(/[\\?&]v=([^&#]*)/)[1],t=e.indexOf("list=")>0?e.match(/[\\?&]list=([^&#]*)/)[1]:null):t=(r=e.length>15?null:e)?null:e,{videoID:r,playlistID:t}};!function(jQuery,ytp){jQuery.mbYTPlayer={name:"jquery.mb.YTPlayer",version:"3.3.9",build:"7581",author:"Matteo Bicocchi (pupunzi)",apiKey:"",defaults:{videoURL:null,containment:"body",ratio:"auto",fadeOnStartTime:1e3,startAt:0,stopAt:0,autoPlay:!0,delayAtStart:1e3,coverImage:!1,loop:!0,addRaster:!1,mask:!1,opacity:1,quality:"hd1080",vol:50,mute:!1,showControls:!0,anchor:"center,center",showAnnotations:!1,cc_load_policy:!1,showYTLogo:!0,useOnMobile:!0,playOnlyIfVisible:!1,onScreenPercentage:30,goFullScreenOnPlay:!1,stopMovieOnBlur:!0,realFullscreen:!0,optimizeDisplay:!0,abundance:.3,gaTrack:!0,remember_last_time:!1,addFilters:!1,useNoCookie:!0,onReady:function(e){},onError:function(e,r){},onEnd:function(){}},controls:{play:"P",pause:"p",mute:"M",unmute:"A",onlyYT:"O",showSite:"R",ytLogo:"Y"},controlBar:null,locationProtocol:"https:",defaultFilters:{grayscale:{value:0,unit:"%"},hue_rotate:{value:0,unit:"deg"},invert:{value:0,unit:"%"},opacity:{value:0,unit:"%"},saturate:{value:0,unit:"%"},sepia:{value:0,unit:"%"},brightness:{value:0,unit:"%"},contrast:{value:0,unit:"%"},blur:{value:0,unit:"px"}},buildPlayer:function(options){if(ytp.YTAPIReady||void 0!==window.YT)setTimeout(function(){jQuery(document).trigger("YTAPIReady"),ytp.YTAPIReady=!0},100);else{jQuery("#YTAPI").remove();let e=jQuery("<script>").attr({src:"https://www.youtube.com/iframe_api?v="+jQuery.mbYTPlayer.version,id:"YTAPI"});jQuery("head").prepend(e)}function isIframe(){let e=!1;try{self.location.href!==top.location.href&&(e=!0)}catch(r){e=!0}return e}return this.each(function(){let YTPlayer=this,$YTPlayer=jQuery(YTPlayer);$YTPlayer.hide(),YTPlayer.loop=0,YTPlayer.state=0,YTPlayer.filters=jQuery.extend(!0,{},jQuery.mbYTPlayer.defaultFilters),YTPlayer.filtersEnabled=!0,YTPlayer.id=YTPlayer.id||"YTP_"+(new Date).getTime(),$YTPlayer.addClass("mb_YTPlayer");let property=$YTPlayer.data("property")&&"string"==typeof $YTPlayer.data("property")?eval("("+$YTPlayer.data("property")+")"):$YTPlayer.data("property");"object"!=typeof property&&(property={}),YTPlayer.opt=jQuery.extend(!0,{},jQuery.mbYTPlayer.defaults,YTPlayer.opt,options,property),YTPRndSuffix=getYTPVideoID(YTPlayer.opt.videoURL).videoID,YTPTimerLabels={init:"YTPlayerInit_"+YTPRndSuffix,startPlaying:"YTPlayerStartPlay_"+YTPRndSuffix},console.time(YTPTimerLabels.init),console.time(YTPTimerLabels.startPlaying),YTPlayer.opt.elementId=YTPlayer.id,0===YTPlayer.opt.vol&&(YTPlayer.opt.vol=1,YTPlayer.opt.mute=!0),YTPlayer.opt.loop&&"boolean"==typeof YTPlayer.opt.loop&&(YTPlayer.opt.loop=9999);let fullScreenAvailable=document.fullscreenEnabled||document.webkitFullscreenEnabled||document.mozFullScreenEnabled||document.msFullscreenEnabled;YTPlayer.opt.realFullscreen=!(isIframe()||!fullScreenAvailable)&&YTPlayer.opt.realFullscreen,YTPlayer.opt.showAnnotations=YTPlayer.opt.showAnnotations?"1":"3",YTPlayer.opt.cc_load_policy=YTPlayer.opt.cc_load_policy?"1":"0",YTPlayer.opt.coverImage=YTPlayer.opt.coverImage||YTPlayer.opt.backgroundImage,YTPlayer.opt.quality="hd1080",jQuery.mbBrowser.msie&&jQuery.mbBrowser.version<9&&(YTPlayer.opt.opacity=1),YTPlayer.opt.containment="self"===YTPlayer.opt.containment?$YTPlayer:jQuery(YTPlayer.opt.containment),YTPlayer.isRetina=window.retina||window.devicePixelRatio>1,YTPlayer.opt.ratio="auto"===YTPlayer.opt.ratio?16/9:YTPlayer.opt.ratio,YTPlayer.opt.ratio=eval(YTPlayer.opt.ratio);let origContainmentBackground=YTPlayer.opt.containment.css("background-image");origContainmentBackground="none"===origContainmentBackground?null:origContainmentBackground,YTPlayer.orig_containment_background=origContainmentBackground,$YTPlayer.attr("id")||$YTPlayer.attr("id","ytp_"+(new Date).getTime()),YTPlayer.playerID="iframe_"+YTPlayer.id,YTPlayer.isAlone=!1,YTPlayer.hasFocus=!0,YTPlayer.videoID=YTPlayer.opt.videoURL?getYTPVideoID(YTPlayer.opt.videoURL).videoID:!!$YTPlayer.attr("href")&&getYTPVideoID($YTPlayer.attr("href")).videoID,YTPlayer.playlistID=YTPlayer.opt.videoURL?getYTPVideoID(YTPlayer.opt.videoURL).playlistID:!!$YTPlayer.attr("href")&&getYTPVideoID($YTPlayer.attr("href")).playlistID;let start_from_last=0;if(jQuery.mbCookie.get("YTPlayer_start_from"+YTPlayer.videoID)&&(start_from_last=parseFloat(jQuery.mbCookie.get("YTPlayer_start_from"+YTPlayer.videoID))),YTPlayer.opt.remember_last_time&&start_from_last&&(YTPlayer.start_from_last=start_from_last,jQuery.mbCookie.remove("YTPlayer_start_from"+YTPlayer.videoID)),YTPlayer.isPlayer=$YTPlayer.is(YTPlayer.opt.containment),YTPlayer.isBackground=YTPlayer.opt.containment.is("body"),YTPlayer.isBackground&&ytp.backgroundIsInited)return;if(YTPlayer.isPlayer&&$YTPlayer.show(),YTPlayer.overlay=jQuery("<div/>").css({position:"absolute",top:0,left:0,width:"100%",height:"100%"}).addClass("YTPOverlay"),$YTPlayer.changeCoverImage(),YTPlayer.wrapper=jQuery("<div/>").attr("id","wrapper_"+YTPlayer.id).css({position:"absolute",zIndex:0,minWidth:"100%",minHeight:"100%",left:0,top:0,overflow:"hidden",opacity:0}).addClass("mbYTP_wrapper"),YTPlayer.isPlayer){let e=jQuery.mbBrowser.mobile?"inlinePlayButtonMobile":"inlinePlayButton";YTPlayer.inlinePlayButton=jQuery("<div/>").addClass("inlinePlayButton").html(jQuery.mbYTPlayer.controls.play),$YTPlayer.append(YTPlayer.inlinePlayButton),YTPlayer.inlinePlayButton.on("click",function(e){$YTPlayer.YTPPlay(),YTPlayer.inlinePlayButton.hide(),YTPlayer.opt.goFullScreenOnPlay&&$YTPlayer.YTPFullscreen(),e.stopPropagation()}),YTPlayer.opt.autoPlay&&YTPlayer.inlinePlayButton.hide(),YTPlayer.overlay.on("click",function(){$YTPlayer.YTPTogglePlay(),YTPlayer.opt.goFullScreenOnPlay&&$YTPlayer.YTPFullscreen()}).css({cursor:"pointer"})}let playerBox=jQuery("<div/>").attr("id",YTPlayer.playerID).addClass("playerBox");if(playerBox.css({position:"absolute",zIndex:0,width:"100%",height:"100%",top:0,left:0,overflow:"hidden",opacity:1}),YTPlayer.wrapper.append(playerBox),playerBox.after(YTPlayer.overlay),YTPlayer.isPlayer&&(YTPlayer.inlineWrapper=jQuery("<div/>").addClass("inline-YTPlayer"),YTPlayer.inlineWrapper.css({position:"relative",maxWidth:YTPlayer.opt.containment.css("width")}),YTPlayer.opt.containment.css({position:"relative",paddingBottom:"56.25%",overflow:"hidden",height:0}),YTPlayer.opt.containment.wrap(YTPlayer.inlineWrapper)),YTPlayer.opt.containment.children().not("script, style").each(function(){"static"===jQuery(this).css("position")&&jQuery(this).css("position","relative")}),YTPlayer.isBackground?(jQuery("body").css({boxSizing:"border-box"}),YTPlayer.wrapper.css({position:"fixed",top:0,left:0,zIndex:0})):"static"===YTPlayer.opt.containment.css("position")&&(YTPlayer.opt.containment.css({position:"relative"}),$YTPlayer.show()),YTPlayer.opt.containment.prepend(YTPlayer.wrapper),YTPlayer.isBackground||YTPlayer.overlay.on("mouseenter",function(){YTPlayer.controlBar&&YTPlayer.controlBar.length&&YTPlayer.controlBar.addClass("visible")}).on("mouseleave",function(){YTPlayer.controlBar&&YTPlayer.controlBar.length&&YTPlayer.controlBar.removeClass("visible")}),jQuery.mbBrowser.mobile&&!YTPlayer.opt.useOnMobile)return YTPlayer.opt.coverImage&&(YTPlayer.wrapper.css({backgroundImage:"url("+YTPlayer.opt.coverImage+")",backgroundPosition:"center center",backgroundSize:"cover",backgroundRepeat:"no-repeat",opacity:1}),YTPlayer.wrapper.css({opacity:1})),$YTPlayer;jQuery.mbBrowser.mobile&&YTPlayer.opt.autoPlay&&YTPlayer.opt.useOnMobile&&jQuery("body").one("touchstart",function(){YTPlayer.player.playVideo()}),jQuery(document).one("YTAPIReady",function(){$YTPlayer.trigger("YTAPIReady_"+YTPlayer.id),ytp.YTAPIReady=!0}),YTPlayer.isOnScreen=jQuery.mbYTPlayer.isOnScreen(YTPlayer,YTPlayer.opt.onScreenPercentage),$YTPlayer.one("YTAPIReady_"+YTPlayer.id,function(){let e=this,r=jQuery(e);e.isBackground&&ytp.backgroundIsInited||e.isInit||(e.isBackground&&(ytp.backgroundIsInited=!0),e.opt.autoPlay=void 0===e.opt.autoPlay?!!e.isBackground:e.opt.autoPlay,e.opt.vol=e.opt.vol?e.opt.vol:100,jQuery.mbYTPlayer.getDataFromAPI(e),jQuery(e).on("YTPChanged",function(t){if(e.isInit)return;e.isInit=!0;let a={modestbranding:1,autoplay:0,controls:0,showinfo:0,rel:0,enablejsapi:1,version:3,playerapiid:e.playerID,origin:"*",allowfullscreen:!0,wmode:"transparent",iv_load_policy:e.opt.showAnnotations,cc_load_policy:e.opt.cc_load_policy,playsinline:jQuery.mbBrowser.mobile&&!e.isPlayer?1:0,html5:document.createElement("video").canPlayType?1:0};new YT.Player(e.playerID,{host:e.opt.useNoCookie?"https://www.youtube-nocookie.com":"https://www.youtube.com",playerVars:a,events:{onReady:function(t){e.player=t.target,e.player.loadVideoById({videoId:e.videoID.toString(),suggestedQuality:e.opt.quality}),r.trigger("YTPlayerIsReady_"+e.id)},onStateChange:function(r){if("function"!=typeof r.target.getPlayerState)return;let t,a=r.target.getPlayerState();if(e.preventTrigger||e.isStarting)return void(e.preventTrigger=!1);switch(e.state=a,r.data===YT.PlayerState.PLAYING&&r.target.setPlaybackQuality(e.opt.quality),a){case-1:t="YTPUnstarted";break;case 0:t="YTPRealEnd";break;case 1:t="YTPPlay",e.controlBar.length&&e.controlBar.find(".mb_YTPPlayPause").html(jQuery.mbYTPlayer.controls.pause),e.isPlayer&&e.inlinePlayButton.hide(),jQuery(document).off("mousedown.YTPstart");break;case 2:t="YTPPause",e.controlBar.length&&e.controlBar.find(".mb_YTPPlayPause").html(jQuery.mbYTPlayer.controls.play),e.isPlayer&&e.inlinePlayButton.show();break;case 3:e.player.setPlaybackQuality(e.opt.quality),t="YTPBuffering",e.controlBar.length&&e.controlBar.find(".mb_YTPPlayPause").html(jQuery.mbYTPlayer.controls.play);break;case 5:t="YTPCued"}let o=jQuery.Event(t);o.time=e.currentTime,jQuery(e).trigger(o)},onPlaybackQualityChange:function(r){let t=r.target.getPlaybackQuality(),a=jQuery.Event("YTPQualityChange");a.quality=t,jQuery(e).trigger(a)},onError:function(t){switch("function"==typeof e.opt.onError&&e.opt.onError(r,t),console.debug("error:",t),t.data){case 2:console.error("video ID:: "+e.videoID+": The request contains an invalid parameter value. For example, this error occurs if you specify a video ID that does not have 11 characters, or if the video ID contains invalid characters, such as exclamation points or asterisks.");break;case 5:console.error("video ID:: "+e.videoID+": The requested content cannot be played in an HTML5 player or another error related to the HTML5 player has occurred.");break;case 100:console.error("video ID:: "+e.videoID+": The video requested was not found. This error occurs when a video has been removed (for any reason) or has been marked as private.");break;case 101:case 150:console.error("video ID:: "+e.videoID+": The video doesn't exist or The owner does not allow it to be played in embedded players.")}e.isList&&jQuery(e).YTPPlayNext()}}}),r.on("YTPlayerIsReady_"+e.id,function(){if(e.isReady)return this;e.playerEl=e.player.getIframe(),jQuery(e.playerEl).unselectable(),r.optimizeDisplay(),jQuery(window).off("resize.YTP_"+e.id).on("resize.YTP_"+e.id,function(){r.optimizeDisplay()}),jQuery(window).off("orientationchange.YTP_"+e.id).on("orientationchange.YTP_"+e.id,function(){r.optimizeDisplay()}),e.opt.remember_last_time&&jQuery(window).on("unload.YTP_"+e.id,function(){let r=e.player.getCurrentTime();jQuery.mbCookie.set("YTPlayer_start_from"+e.videoID,r,0)}),r.YTPCheckForState()})}))}),$YTPlayer.off("YTPTime.mask"),jQuery.mbYTPlayer.applyMask(YTPlayer),console.timeEnd(YTPTimerLabels.init),setTimeout(function(){ytp.YTAPIReady||"object"!=typeof window.YT||(jQuery(document).trigger("YTAPIReady"),ytp.YTAPIReady=!0,console.error("YTPlayer: More then a call to the YT API has been detected"))},YTPlayer.opt.delayAtStart)})},isOnScreen:function(e,r){r=r||10;let t=e.wrapper,a=jQuery(window).scrollTop(),o=a+jQuery(window).height(),n=t.height()*r/100,i=t.offset().top+n;return t.offset().top+(t.height()-n)<=o&&i>=a},getDataFromAPI:function(e){e.videoData=jQuery.mbStorage.get("YTPlayer_data_"+e.videoID),e.videoData?(setTimeout(function(){e.dataReceived=!0;let r=jQuery.Event("YTPChanged");r.time=e.currentTime,r.videoId=e.videoID,r.opt=e.opt,jQuery(e).trigger(r);let t=jQuery.Event("YTPData");t.prop={};for(let r in e.videoData)e.videoData.hasOwnProperty(r)&&(t.prop[r]=e.videoData[r]);jQuery(e).trigger(t)},e.opt.fadeOnStartTime),e.hasData=!0):jQuery.mbYTPlayer.apiKey?jQuery.getJSON("https://www.googleapis.com/youtube/v3/videos?id="+e.videoID+"&key="+jQuery.mbYTPlayer.apiKey+"&part=snippet",function(r){e.dataReceived=!0;let t=jQuery.Event("YTPChanged");t.time=e.currentTime,t.videoId=e.videoID,jQuery(e).trigger(t),r.items[0]?(!function(r){e.videoData={},e.videoData.id=e.videoID,e.videoData.channelTitle=r.channelTitle,e.videoData.title=r.title,e.videoData.description=r.description.length<400?r.description:r.description.substring(0,400)+" ...",e.videoData.thumb_max=r.thumbnails.maxres?r.thumbnails.maxres.url:null,e.videoData.thumb_high=r.thumbnails.high?r.thumbnails.high.url:null,e.videoData.thumb_medium=r.thumbnails.medium?r.thumbnails.medium.url:null,jQuery.mbStorage.set("YTPlayer_data_"+e.videoID,e.videoData)}(r.items[0].snippet),e.hasData=!0):(e.videoData={},e.hasData=!1);let a=jQuery.Event("YTPData");a.prop={};for(let r in e.videoData)a.prop[r]=e.videoData[r];jQuery(e).trigger(a)}).fail(function(r){console.error("YT data error:: ",r),e.hasData=!1;let t=jQuery.Event("YTPChanged");t.time=e.currentTime,t.videoId=e.videoID,jQuery(e).trigger(t)}):(setTimeout(function(){let r=jQuery.Event("YTPChanged");r.time=e.currentTime,r.videoId=e.videoID,jQuery(e).trigger(r)},10),e.videoData=null),e.opt.ratio="auto"==e.opt.ratio?16/9:e.opt.ratio,e.isPlayer&&!e.opt.autoPlay&&(e.loading=jQuery("<div/>").addClass("loading").html("Loading").hide(),jQuery(e).append(e.loading),e.loading.fadeIn())},removeStoredData:function(){jQuery.mbStorage.remove()},getVideoData:function(){return this.get(0).videoData},getVideoID:function(){return this.get(0).videoID||!1},getPlaylistID:function(){return this.get(0).playlistID||!1},setVideoQuality:function(e){let r=this.get(0),t=r.player.getCurrentTime();return jQuery(r).YTPPause(),r.opt.quality=e,r.player.setPlaybackQuality(e),r.player.seekTo(t),jQuery(r).YTPPlay(),this},getVideoQuality:function(){return this.get(0).player.getPlaybackQuality()},playlist:function(e,r,t){let a=this.get(0);return a.isList=!0,r&&(e=jQuery.shuffle(e)),a.videoID||(a.videos=e,a.videoCounter=1,a.videoLength=e.length,jQuery(a).data("property",e[0]),jQuery(a).YTPlayer()),"function"==typeof t&&jQuery(a).on("YTPChanged",function(){t(a)}),jQuery(a).on("YTPEnd",function(){jQuery(a).YTPPlayNext()}),this},playNext:function(){let e=this.get(0);return e.videoCounter++,e.videoCounter>e.videoLength&&(e.videoCounter=1),jQuery(e).YTPPlayIndex(e.videoCounter),this},playPrev:function(){let e=this.get(0);return e.videoCounter--,e.videoCounter<=0&&(e.videoCounter=e.videoLength),jQuery(e).YTPPlayIndex(e.videoCounter),this},playIndex:function(e){let r=this.get(0);r.checkForStartAt&&(clearInterval(r.checkForStartAt),clearInterval(r.getState)),r.videoCounter=e,r.videoCounter>=r.videoLength&&(r.videoCounter=r.videoLength);let t=r.videos[r.videoCounter-1];return jQuery(r).YTPChangeVideo(t),this},changeVideo:function(e){let r=this,t=r.get(0);t.opt.startAt=0,t.opt.stopAt=0,t.opt.mask=!1,t.opt.mute=!0,t.opt.autoPlay=!0,t.opt.addFilters=!1,t.opt.coverImage=!1,t.hasData=!1,t.hasChanged=!0,t.player.loopTime=void 0,e&&jQuery.extend(t.opt,e),t.videoID=getYTPVideoID(t.opt.videoURL).videoID,t.opt.loop&&"boolean"==typeof t.opt.loop&&(t.opt.loop=9999),t.wrapper.css({background:"none"}),jQuery(t.playerEl).CSSAnimate({opacity:0},t.opt.fadeOnStartTime,function(){jQuery.mbYTPlayer.getDataFromAPI(t),r.YTPGetPlayer().loadVideoById({videoId:t.videoID,suggestedQuality:t.opt.quality}),r.YTPPause(),r.optimizeDisplay(),t.checkForStartAt&&(clearInterval(t.checkForStartAt),clearInterval(t.getState)),r.YTPCheckForState()});let a=jQuery.Event("YTPChangeVideo");return a.time=t.currentTime,jQuery(t).trigger(a),jQuery.mbYTPlayer.applyMask(t),this},getPlayer:function(){let e=this.get(0);return e.isReady?e.player:null},playerDestroy:function(){let e=this.get(0);return e.isReady?(ytp.YTAPIReady=!0,ytp.backgroundIsInited=!1,e.isInit=!1,e.videoID=null,e.isReady=!1,e.wrapper.remove(),jQuery("#controlBar_"+e.id).remove(),clearInterval(e.checkForStartAt),clearInterval(e.getState),this):this},fullscreen:function(real){let YTPlayer=this.get(0);void 0===real&&(real=eval(YTPlayer.opt.realFullscreen));let controls=jQuery("#controlBar_"+YTPlayer.id),fullScreenBtn=controls.find(".mb_OnlyYT"),videoWrapper=YTPlayer.isPlayer?YTPlayer.opt.containment:YTPlayer.wrapper;if(real){let e=jQuery.mbBrowser.mozilla?"mozfullscreenchange":jQuery.mbBrowser.webkit?"webkitfullscreenchange":"fullscreenchange";jQuery(document).off(e).on(e,function(){RunPrefixMethod(document,"IsFullScreen")||RunPrefixMethod(document,"FullScreen")?jQuery(YTPlayer).trigger("YTPFullScreenStart"):(YTPlayer.isAlone=!1,fullScreenBtn.html(jQuery.mbYTPlayer.controls.onlyYT),jQuery(YTPlayer).YTPSetVideoQuality(YTPlayer.opt.quality),videoWrapper.removeClass("YTPFullscreen"),videoWrapper.CSSAnimate({opacity:YTPlayer.opt.opacity},YTPlayer.opt.fadeOnStartTime),videoWrapper.css({zIndex:0}),YTPlayer.isBackground?jQuery("body").after(controls):YTPlayer.wrapper.before(controls),jQuery(window).resize(),jQuery(YTPlayer).trigger("YTPFullScreenEnd"))})}if(YTPlayer.isAlone)jQuery(document).off("mousemove.YTPlayer"),clearTimeout(YTPlayer.hideCursor),YTPlayer.overlay.css({cursor:"auto"}),real?cancelFullscreen():(videoWrapper.CSSAnimate({opacity:YTPlayer.opt.opacity},YTPlayer.opt.fadeOnStartTime),videoWrapper.css({zIndex:0})),fullScreenBtn.html(jQuery.mbYTPlayer.controls.onlyYT),YTPlayer.isAlone=!1;else{function hideMouse(){YTPlayer.overlay.css({cursor:"none"})}jQuery(document).on("mousemove.YTPlayer",function(e){YTPlayer.overlay.css({cursor:"auto"}),clearTimeout(YTPlayer.hideCursor),jQuery(e.target).parents().is(".mb_YTPBar")||(YTPlayer.hideCursor=setTimeout(hideMouse,3e3))}),hideMouse(),real?(videoWrapper.css({opacity:0}),videoWrapper.addClass("YTPFullscreen"),launchFullscreen(videoWrapper.get(0)),setTimeout(function(){videoWrapper.CSSAnimate({opacity:1},2*YTPlayer.opt.fadeOnStartTime),videoWrapper.append(controls),jQuery(YTPlayer).optimizeDisplay(),YTPlayer.player.seekTo(YTPlayer.player.getCurrentTime()+.1,!0)},YTPlayer.opt.fadeOnStartTime)):videoWrapper.css({zIndex:1e4}).CSSAnimate({opacity:1},2*YTPlayer.opt.fadeOnStartTime),fullScreenBtn.html(jQuery.mbYTPlayer.controls.showSite),YTPlayer.isAlone=!0}function RunPrefixMethod(e,r){let t,a,o=["webkit","moz","ms","o",""],n=0;for(;n<o.length&&!e[t];){if(t=r,""===o[n]&&(t=t.substr(0,1).toLowerCase()+t.substr(1)),"undefined"!=(a=typeof e[t=o[n]+t]))return o=[o[n]],"function"==a?e[t]():e[t];n++}}function launchFullscreen(e){RunPrefixMethod(e,"RequestFullScreen")}function cancelFullscreen(){(RunPrefixMethod(document,"FullScreen")||RunPrefixMethod(document,"IsFullScreen"))&&RunPrefixMethod(document,"CancelFullScreen")}return this},toggleLoops:function(){let e=this.get(0),r=e.opt;return 1==r.loop?r.loop=0:(r.startAt?e.player.seekTo(r.startAt):e.player.playVideo(),r.loop=1),this},play:function(){let e=this.get(0),r=jQuery(e);return e.isReady?(setTimeout(function(){r.YTPSetAbundance(e.opt.abundance)},300),e.player.playVideo(),jQuery(e.playerEl).css({opacity:1}),e.wrapper.css({backgroundImage:"none"}),e.wrapper.CSSAnimate({opacity:e.isAlone?1:e.opt.opacity},e.opt.fadeOnStartTime),jQuery("#controlBar_"+e.id).find(".mb_YTPPlayPause").html(jQuery.mbYTPlayer.controls.pause),e.state=1,this):this},togglePlay:function(e){let r=this.get(0);return r.isReady?(1===r.state?this.YTPPause():this.YTPPlay(),"function"==typeof e&&e(r.state),this):this},stop:function(){let e=this.get(0);return e.isReady?(jQuery("#controlBar_"+e.id).find(".mb_YTPPlayPause").html(jQuery.mbYTPlayer.controls.play),e.player.stopVideo(),this):this},pause:function(){let e=this.get(0);return e.isReady?(e.opt.abundance<.2&&this.YTPSetAbundance(.2),e.player.pauseVideo(),e.state=2,this):this},seekTo:function(e){let r=this.get(0);return r.isReady?(r.player.seekTo(e,!0),this):this},getPlaybackRate:function(){let e=this.get(0);return e.isReady?e.player.getPlaybackRate():this},setPlaybackRate:function(e){let r=this.get(0);return r.isReady?(r.player.setPlaybackRate(e),this):this},setVolume:function(e){let r=this.get(0);return r.isReady?(r.opt.vol=e,this.YTPUnmute(),r.player.setVolume(r.opt.vol),r.volumeBar&&r.volumeBar.length&&r.volumeBar.updateSliderVal(e),this):this},getVolume:function(){let e=this.get(0);return e.isReady?e.player.getVolume():this},toggleVolume:function(){let e=this.get(0);return e.isReady?(e.isMute?(jQuery.mbBrowser.mobile||this.YTPSetVolume(e.opt.vol),this.YTPUnmute()):this.YTPMute(),this):this},mute:function(){let e=this.get(0);if(!e.isReady)return this;if(e.isMute)return this;e.player.mute(),e.isMute=!0,e.player.setVolume(0),e.volumeBar&&e.volumeBar.length&&e.volumeBar.width()>10&&e.volumeBar.updateSliderVal(0),jQuery("#controlBar_"+e.id).find(".mb_YTPMuteUnmute").html(jQuery.mbYTPlayer.controls.unmute),jQuery(e).addClass("isMuted"),e.volumeBar&&e.volumeBar.length&&e.volumeBar.addClass("muted");let r=jQuery.Event("YTPMuted");return r.time=e.currentTime,e.preventTrigger||jQuery(e).trigger(r),this},unmute:function(){let e=this.get(0);if(!e.isReady)return this;if(!e.isMute)return this;e.player.unMute(),e.isMute=!1,jQuery(e).YTPSetVolume(e.opt.vol),e.volumeBar&&e.volumeBar.length&&e.volumeBar.updateSliderVal(e.opt.vol>10?e.opt.vol:10),jQuery("#controlBar_"+e.id).find(".mb_YTPMuteUnmute").html(jQuery.mbYTPlayer.controls.mute),jQuery(e).removeClass("isMuted"),e.volumeBar&&e.volumeBar.length&&e.volumeBar.removeClass("muted");let r=jQuery.Event("YTPUnmuted");return r.time=e.currentTime,e.preventTrigger||jQuery(e).trigger(r),this},applyFilter:function(e,r){let t=this.get(0);if(!t.isReady)return this;t.filters[e].value=r,t.filtersEnabled&&this.YTPEnableFilters()},applyFilters:function(e){let r=this,t=r.get(0);if(!t.isReady)return jQuery(t).on("YTPReady",function(){r.YTPApplyFilters(e)}),this;for(let t in e)r.YTPApplyFilter(t,e[t]);r.trigger("YTPFiltersApplied")},toggleFilter:function(e,r){let t=this.get(0);return t.isReady?(t.filters[e].value?t.filters[e].value=0:t.filters[e].value=r,t.filtersEnabled&&jQuery(t).YTPEnableFilters(),this):this},toggleFilters:function(e){let r=this.get(0);return r.isReady?(r.filtersEnabled?(jQuery(r).trigger("YTPDisableFilters"),jQuery(r).YTPDisableFilters()):(jQuery(r).YTPEnableFilters(),jQuery(r).trigger("YTPEnableFilters")),"function"==typeof e&&e(r.filtersEnabled),this):this},disableFilters:function(){let e=this.get(0);if(!e.isReady)return this;let r=jQuery(e.playerEl);return r.css("-webkit-filter",""),r.css("filter",""),e.filtersEnabled=!1,this},enableFilters:function(){let e=this.get(0);if(!e.isReady)return this;let r=jQuery(e.playerEl),t="";for(let r in e.filters)e.filters[r].value&&(t+=r.replace("_","-")+"("+e.filters[r].value+e.filters[r].unit+") ");return r.css("-webkit-filter",t),r.css("filter",t),e.filtersEnabled=!0,this},removeFilter:function(e,r){let t=this,a=t.get(0);if(!a.isReady)return this;if("function"==typeof e&&(r=e,e=null),e)t.YTPApplyFilter(e,0),"function"==typeof r&&r(e);else{for(let e in a.filters)a.filters.hasOwnProperty(e)&&(t.YTPApplyFilter(e,0),"function"==typeof r&&r(e));a.filters=jQuery.extend(!0,{},jQuery.mbYTPlayer.defaultFilters)}let o=jQuery.Event("YTPFiltersApplied");return t.trigger(o),this},getFilters:function(){let e=this.get(0);return e.isReady?e.filters:this},addMask:function(e){let r=this.get(0);e||(e=r.actualMask);let t=jQuery("<img/>").attr("src",e).on("load",function(){r.overlay.CSSAnimate({opacity:0},r.opt.fadeOnStartTime,function(){r.hasMask=!0,t.remove(),r.overlay.css({backgroundImage:"url("+e+")",backgroundRepeat:"no-repeat",backgroundPosition:"center center",backgroundSize:"cover"}),r.overlay.CSSAnimate({opacity:1},r.opt.fadeOnStartTime)})});return this},removeMask:function(){let e=this.get(0);return e.overlay.CSSAnimate({opacity:0},e.opt.fadeOnStartTime,function(){e.hasMask=!1,e.overlay.css({backgroundImage:"",backgroundRepeat:"",backgroundPosition:"",backgroundSize:""}),e.overlay.CSSAnimate({opacity:1},e.opt.fadeOnStartTime)}),this},applyMask:function(e){let r=jQuery(e);if(r.off("YTPTime.mask"),e.opt.mask)if("string"==typeof e.opt.mask)r.YTPAddMask(e.opt.mask),e.actualMask=e.opt.mask;else if("object"==typeof e.opt.mask){for(let r in e.opt.mask)e.opt.mask[r]&&(img=jQuery("<img/>").attr("src",e.opt.mask[r]));e.opt.mask[0]&&r.YTPAddMask(e.opt.mask[0]),r.on("YTPTime.mask",function(t){for(let a in e.opt.mask)t.time===a&&(e.opt.mask[a]?(r.YTPAddMask(e.opt.mask[a]),e.actualMask=e.opt.mask[a]):r.YTPRemoveMask())})}},toggleMask:function(){let e=this.get(0),r=jQuery(e);return e.hasMask?r.YTPRemoveMask():r.YTPAddMask(),this},manageProgress:function(){let e=this.get(0),r=jQuery("#controlBar_"+e.id),t=r.find(".mb_YTPProgress"),a=r.find(".mb_YTPLoaded"),o=r.find(".mb_YTPseekbar"),n=t.outerWidth(),i=Math.floor(e.player.getCurrentTime()),l=Math.floor(e.player.getDuration()),s=i*n/l,u=100*e.player.getVideoLoadedFraction();return a.css({left:0,width:u+"%"}),o.css({left:0,width:s}),{totalTime:l,currentTime:i}},buildControls:function(YTPlayer){if(jQuery("#controlBar_"+YTPlayer.id).remove(),!YTPlayer.opt.showControls)return void(YTPlayer.controlBar=!1);if(YTPlayer.opt.showYTLogo=YTPlayer.opt.showYTLogo||YTPlayer.opt.printUrl,jQuery("#controlBar_"+YTPlayer.id).length)return;YTPlayer.controlBar=jQuery("<div/>").attr("id","controlBar_"+YTPlayer.id).addClass("mb_YTPBar").css({whiteSpace:"noWrap",position:YTPlayer.isBackground?"fixed":"absolute",zIndex:YTPlayer.isBackground?1e4:1e3}).hide().on("click",function(e){e.stopPropagation()});let buttonBar=jQuery("<div/>").addClass("buttonBar"),playpause=jQuery("<span>"+jQuery.mbYTPlayer.controls.play+"</span>").addClass("mb_YTPPlayPause ytpicon").on("click",function(e){e.stopPropagation(),jQuery(YTPlayer).YTPTogglePlay()}),MuteUnmute=jQuery("<span>"+jQuery.mbYTPlayer.controls.mute+"</span>").addClass("mb_YTPMuteUnmute ytpicon").on("click",function(e){e.stopPropagation(),jQuery(YTPlayer).YTPToggleVolume()}),volumeBar=jQuery("<div/>").addClass("mb_YTPVolumeBar").css({display:"inline-block"});YTPlayer.volumeBar=volumeBar;let idx=jQuery("<span/>").addClass("mb_YTPTime"),vURL=YTPlayer.opt.videoURL?YTPlayer.opt.videoURL:"";vURL.indexOf("http")<0&&(vURL="https://www.youtube.com/watch?v="+YTPlayer.opt.videoURL);let movieUrl=jQuery("<span/>").html(jQuery.mbYTPlayer.controls.ytLogo).addClass("mb_YTPUrl ytpicon").attr("title","view on YouTube").on("click",function(){window.open(vURL,"viewOnYT")}),onlyVideo=jQuery("<span/>").html(jQuery.mbYTPlayer.controls.onlyYT).addClass("mb_OnlyYT ytpicon").on("click",function(e){e.stopPropagation(),jQuery(YTPlayer).YTPFullscreen(YTPlayer.opt.realFullscreen)}),progressBar=jQuery("<div/>").addClass("mb_YTPProgress").css("position","absolute").on("click",function(e){e.stopPropagation(),timeBar.css({width:e.clientX-timeBar.offset().left}),YTPlayer.timeW=e.clientX-timeBar.offset().left,YTPlayer.controlBar.find(".mb_YTPLoaded").css({width:0});let r=Math.floor(YTPlayer.player.getDuration());YTPlayer.goto=timeBar.outerWidth()*r/progressBar.outerWidth(),YTPlayer.player.seekTo(parseFloat(YTPlayer.goto),!0),YTPlayer.controlBar.find(".mb_YTPLoaded").css({width:0})}),loadedBar=jQuery("<div/>").addClass("mb_YTPLoaded").css("position","absolute"),timeBar=jQuery("<div/>").addClass("mb_YTPseekbar").css("position","absolute");progressBar.append(loadedBar).append(timeBar),buttonBar.append(playpause).append(MuteUnmute).append(volumeBar).append(idx),YTPlayer.opt.showYTLogo&&buttonBar.append(movieUrl),(YTPlayer.isBackground||eval(YTPlayer.opt.realFullscreen)&&!YTPlayer.isBackground)&&buttonBar.append(onlyVideo),YTPlayer.controlBar.append(buttonBar).append(progressBar),YTPlayer.isBackground?jQuery("body").after(YTPlayer.controlBar):(YTPlayer.controlBar.addClass("inlinePlayer"),YTPlayer.wrapper.before(YTPlayer.controlBar)),volumeBar.simpleSlider({initialval:YTPlayer.opt.vol,scale:100,orientation:"h",callback:function(e){0==e.value?jQuery(YTPlayer).YTPMute():jQuery(YTPlayer).YTPUnmute(),YTPlayer.player.setVolume(e.value),YTPlayer.isMute||(YTPlayer.opt.vol=e.value)}})},changeCoverImage:function(e){let r=this.get(0);if(r.opt.coverImage||r.orig_containment_background){let t=e||(r.opt.coverImage?"url("+r.opt.coverImage+") center center":r.orig_containment_background);t&&r.opt.containment.css({background:t,backgroundSize:"cover",backgroundRepeat:"no-repeat",backgroundAttachment:"fixed"})}return this},checkForState:function(){let YTPlayer=this.get(0),$YTPlayer=jQuery(YTPlayer);clearInterval(YTPlayer.getState);let interval=100;if(!jQuery.contains(document,YTPlayer))return $YTPlayer.YTPPlayerDestroy(),clearInterval(YTPlayer.getState),void clearInterval(YTPlayer.checkForStartAt);jQuery.mbYTPlayer.checkForStart(YTPlayer),YTPlayer.getState=setInterval(function(){let $YTPlayer=jQuery(YTPlayer);if(!YTPlayer.isReady)return;let prog=jQuery(YTPlayer).YTPManageProgress(),stopAt=YTPlayer.opt.stopAt>YTPlayer.opt.startAt?YTPlayer.opt.stopAt:0;if(stopAt=stopAt<YTPlayer.player.getDuration()?stopAt:0,YTPlayer.currentTime!=prog.currentTime){let e=jQuery.Event("YTPTime");e.time=YTPlayer.currentTime,jQuery(YTPlayer).trigger(e)}if(YTPlayer.currentTime=prog.currentTime,YTPlayer.totalTime=YTPlayer.player.getDuration(),0==YTPlayer.player.getVolume()?$YTPlayer.addClass("isMuted"):$YTPlayer.removeClass("isMuted"),YTPlayer.opt.showControls&&(prog.totalTime?YTPlayer.controlBar.find(".mb_YTPTime").html(jQuery.mbYTPlayer.formatTime(prog.currentTime)+" / "+jQuery.mbYTPlayer.formatTime(prog.totalTime)):YTPlayer.controlBar.find(".mb_YTPTime").html("-- : -- / -- : --")),eval(YTPlayer.opt.stopMovieOnBlur)&&(document.hasFocus()?document.hasFocus()&&!YTPlayer.hasFocus&&-1!=YTPlayer.state&&0!=YTPlayer.state&&(YTPlayer.hasFocus=!0,YTPlayer.preventTrigger=!0,$YTPlayer.YTPPlay()):1==YTPlayer.state&&(YTPlayer.hasFocus=!1,YTPlayer.preventTrigger=!0,$YTPlayer.YTPPause())),YTPlayer.opt.playOnlyIfVisible){let e=jQuery.mbYTPlayer.isOnScreen(YTPlayer,YTPlayer.opt.onScreenPercentage);e||1!=YTPlayer.state?e&&!YTPlayer.isOnScreen&&(YTPlayer.isOnScreen=!0,YTPlayer.player.playVideo()):(YTPlayer.isOnScreen=!1,$YTPlayer.YTPPause())}if(YTPlayer.controlBar.length&&YTPlayer.controlBar.outerWidth()<=400&&!YTPlayer.isCompact?(YTPlayer.controlBar.addClass("compact"),YTPlayer.isCompact=!0,!YTPlayer.isMute&&YTPlayer.volumeBar&&YTPlayer.volumeBar.updateSliderVal(YTPlayer.opt.vol)):YTPlayer.controlBar.length&&YTPlayer.controlBar.outerWidth()>400&&YTPlayer.isCompact&&(YTPlayer.controlBar.removeClass("compact"),YTPlayer.isCompact=!1,!YTPlayer.isMute&&YTPlayer.volumeBar&&YTPlayer.volumeBar.updateSliderVal(YTPlayer.opt.vol)),YTPlayer.player.getPlayerState()>0&&(parseFloat(YTPlayer.player.getDuration()-YTPlayer.opt.fadeOnStartTime/1e3)<YTPlayer.player.getCurrentTime()||stopAt>0&&parseFloat(YTPlayer.player.getCurrentTime())>=stopAt)){if(YTPlayer.isEnded)return;if(YTPlayer.isEnded=!0,setTimeout(function(){YTPlayer.isEnded=!1},1e3),YTPlayer.isList){if(!YTPlayer.opt.loop||YTPlayer.opt.loop>0&&YTPlayer.player.loopTime===YTPlayer.opt.loop-1){YTPlayer.player.loopTime=void 0,clearInterval(YTPlayer.getState);let e=jQuery.Event("YTPEnd");return e.time=YTPlayer.currentTime,void jQuery(YTPlayer).trigger(e)}}else if(!YTPlayer.opt.loop||YTPlayer.opt.loop>0&&YTPlayer.player.loopTime===YTPlayer.opt.loop-1)return YTPlayer.player.loopTime=void 0,YTPlayer.state=2,$YTPlayer.changeCoverImage(YTPlayer),jQuery(YTPlayer).YTPPause(),void YTPlayer.wrapper.CSSAnimate({opacity:0},YTPlayer.opt.fadeOnStartTime,function(){YTPlayer.controlBar.length&&YTPlayer.controlBar.find(".mb_YTPPlayPause").html(jQuery.mbYTPlayer.controls.play),$YTPlayer.changeCoverImage();let e=jQuery.Event("YTPEnd");e.time=YTPlayer.currentTime,jQuery(YTPlayer).trigger(e),YTPlayer.player.seekTo(YTPlayer.opt.startAt,!0)});YTPlayer.player.loopTime=YTPlayer.player.loopTime?++YTPlayer.player.loopTime:1,YTPlayer.opt.startAt=YTPlayer.opt.startAt||1,YTPlayer.preventTrigger=!0,YTPlayer.state=2,YTPlayer.player.seekTo(YTPlayer.opt.startAt,!0)}},interval)},checkForStart:function(YTPlayer){let $YTPlayer=jQuery(YTPlayer);if(!jQuery.contains(document,YTPlayer))return void $YTPlayer.YTPPlayerDestroy();if(jQuery.mbYTPlayer.buildControls(YTPlayer),YTPlayer.overlay)if(YTPlayer.opt.addRaster){let e="dot"==YTPlayer.opt.addRaster?"raster-dot":"raster";YTPlayer.overlay.addClass(YTPlayer.isRetina?e+" retina":e)}else YTPlayer.overlay.removeClass(function(e,r){let t=r.split(" "),a=[];return jQuery.each(t,function(e,r){/raster.*/.test(r)&&a.push(r)}),a.push("retina"),a.join(" ")});YTPlayer.preventTrigger=!0,YTPlayer.state=2,YTPlayer.preventTrigger=!0,YTPlayer.player.mute(),YTPlayer.player.playVideo(),YTPlayer.isStarting=!0;let startAt=YTPlayer.start_from_last?YTPlayer.start_from_last:YTPlayer.opt.startAt?YTPlayer.opt.startAt:1;return YTPlayer.preventTrigger=!0,YTPlayer.checkForStartAt=setInterval(function(){YTPlayer.player.mute(),YTPlayer.player.seekTo(startAt,!0);let canPlayVideo=YTPlayer.player.getVideoLoadedFraction()>=startAt/YTPlayer.player.getDuration();if(jQuery.mbBrowser.mobile&&(canPlayVideo=!0),YTPlayer.player.getDuration()>0&&YTPlayer.player.getCurrentTime()>=startAt&&canPlayVideo){YTPlayer.start_from_last=null,YTPlayer.preventTrigger=!0,$YTPlayer.YTPPause(),clearInterval(YTPlayer.checkForStartAt),"function"==typeof YTPlayer.opt.onReady&&YTPlayer.opt.onReady(YTPlayer),YTPlayer.isReady=!0,$YTPlayer.YTPRemoveFilter(),YTPlayer.opt.addFilters?$YTPlayer.YTPApplyFilters(YTPlayer.opt.addFilters):$YTPlayer.YTPApplyFilters(),$YTPlayer.YTPEnableFilters();let YTPready=jQuery.Event("YTPReady");if(YTPready.time=YTPlayer.currentTime,$YTPlayer.trigger(YTPready),YTPlayer.state=2,YTPlayer.opt.mute?$YTPlayer.YTPMute():YTPlayer.opt.autoPlay?(console.debug("We muted the audio to make the video 'auto-play' according with the latest vendor policy. The audio will unmute at the first user interaction with the page"),YTPlayer.player.mute(),YTPlayer.forcedMuted=!0,jQuery(document).on("mousedown.YTPstartAudio",function(){YTPlayer.forcedMuted&&(console.debug("AAAAAAA"),YTPlayer.player.unMute(),YTPlayer.forcedMuted=!1,jQuery(document).off("mousedown.YTPstartAudio"))}),jQuery(window).on("scroll",function(){console.debug("AAAAA")})):YTPlayer.player.unMute(),"undefined"!=typeof _gaq&&eval(YTPlayer.opt.gaTrack)?_gaq.push(["_trackEvent","YTPlayer","Play",YTPlayer.hasData?YTPlayer.videoData.title:YTPlayer.videoID.toString()]):"undefined"!=typeof ga&&eval(YTPlayer.opt.gaTrack)&&ga("send","event","YTPlayer","play",YTPlayer.hasData?YTPlayer.videoData.title:YTPlayer.videoID.toString()),YTPlayer.opt.autoPlay){let e=jQuery.Event("YTPStart");e.time=YTPlayer.currentTime,jQuery(YTPlayer).trigger(e),YTPlayer.isStarting=!1,"mac"===jQuery.mbBrowser.os.name&&jQuery.mbBrowser.safari&&jQuery("body").one("mousedown.YTPstart",function(){$YTPlayer.YTPPlay()}),$YTPlayer.YTPPlay(),console.timeEnd(YTPTimerLabels.startPlaying)}else YTPlayer.preventTrigger=!0,$YTPlayer.YTPPause(),YTPlayer.start_from_last&&YTPlayer.player.seekTo(startAt,!0),setTimeout(function(){YTPlayer.preventTrigger=!0,$YTPlayer.YTPPause(),YTPlayer.isPlayer||(YTPlayer.opt.coverImage?(YTPlayer.wrapper.css({opacity:0}),setTimeout(function(){$YTPlayer.changeCoverImage()},YTPlayer.opt.fadeOnStartTime)):(jQuery(YTPlayer.playerEl).CSSAnimate({opacity:1},YTPlayer.opt.fadeOnStartTime),YTPlayer.wrapper.CSSAnimate({opacity:YTPlayer.isAlone?1:YTPlayer.opt.opacity},YTPlayer.opt.fadeOnStartTime))),YTPlayer.isStarting=!1},500),YTPlayer.controlBar.length&&YTPlayer.controlBar.find(".mb_YTPPlayPause").html(jQuery.mbYTPlayer.controls.play);YTPlayer.isPlayer&&!YTPlayer.opt.autoPlay&&YTPlayer.loading&&YTPlayer.loading.length&&(YTPlayer.loading.html("Ready"),setTimeout(function(){YTPlayer.loading.fadeOut()},100)),YTPlayer.controlBar&&YTPlayer.controlBar.length&&YTPlayer.controlBar.slideDown(1e3)}"mac"===jQuery.mbBrowser.os.name&&jQuery.mbBrowser.safari&&(YTPlayer.player.playVideo(),startAt>=0&&YTPlayer.player.seekTo(startAt,!0))},100),$YTPlayer},getTime:function(){let e=this.get(0);return jQuery.mbYTPlayer.formatTime(e.currentTime)},getTotalTime:function(){let e=this.get(0);return jQuery.mbYTPlayer.formatTime(e.totalTime)},formatTime:function(e){let r=Math.floor(e/60),t=Math.floor(e-60*r);return(r<=9?"0"+r:r)+" : "+(t<=9?"0"+t:t)},setAnchor:function(e){this.optimizeDisplay(e)},getAnchor:function(){return this.get(0).opt.anchor},setAbundance:function(e,r){let t=this.get(0);return r&&(t.opt.abundance=e),this.optimizeDisplay(t.opt.anchor,e),this},getAbundance:function(){return this.get(0).opt.abundance},setOption:function(e,r){return this.get(0).opt[e]=r,this}},jQuery.fn.optimizeDisplay=function(anchor,abundanceX){let YTPlayer=this.get(0),vid={},el=YTPlayer.wrapper,iframe=jQuery(YTPlayer.playerEl);YTPlayer.opt.anchor=anchor||YTPlayer.opt.anchor,YTPlayer.opt.anchor="undefined "!=typeof YTPlayer.opt.anchor?YTPlayer.opt.anchor:"center,center";let YTPAlign=YTPlayer.opt.anchor.split(","),ab=abundanceX||YTPlayer.opt.abundance;if(YTPlayer.opt.optimizeDisplay){let abundance=el.height()*ab,win={};win.width=el.outerWidth(),win.height=el.outerHeight()+abundance,YTPlayer.opt.ratio="auto"===YTPlayer.opt.ratio?16/9:YTPlayer.opt.ratio,YTPlayer.opt.ratio=eval(YTPlayer.opt.ratio),vid.width=win.width+abundance,vid.height=Math.ceil(vid.width/YTPlayer.opt.ratio),vid.marginTop=Math.ceil(-(vid.height-win.height+abundance)/2),vid.marginLeft=-abundance/2;let lowest=vid.height<win.height;lowest&&(vid.height=win.height+abundance,vid.width=Math.ceil(vid.height*YTPlayer.opt.ratio),vid.marginTop=-abundance/2,vid.marginLeft=Math.ceil(-(vid.width-win.width)/2));for(let e in YTPAlign)if(YTPAlign.hasOwnProperty(e)){let r=YTPAlign[e].replace(/ /g,"");switch(r){case"top":vid.marginTop=-abundance;break;case"bottom":vid.marginTop=Math.ceil(-(vid.height-win.height)-abundance/2);break;case"left":vid.marginLeft=-abundance;break;case"right":vid.marginLeft=Math.ceil(-(vid.width-win.width)+abundance/2)}}}else vid.width="100%",vid.height="100%",vid.marginTop=0,vid.marginLeft=0;iframe.css({width:vid.width,height:vid.height,marginTop:vid.marginTop,marginLeft:vid.marginLeft,maxWidth:"initial"})},jQuery.shuffle=function(e){let r=e.slice(),t=r.length,a=t;for(;a--;){let e=parseInt(Math.random()*t),o=r[a];r[a]=r[e],r[e]=o}return r},jQuery.fn.unselectable=function(){return this.each(function(){jQuery(this).css({"-moz-user-select":"none","-webkit-user-select":"none","user-select":"none"}).attr("unselectable","on")})},jQuery.fn.YTPlayer=jQuery.mbYTPlayer.buildPlayer,jQuery.fn.mb_YTPlayer=jQuery.mbYTPlayer.buildPlayer,jQuery.fn.YTPCheckForState=jQuery.mbYTPlayer.checkForState,jQuery.fn.YTPGetPlayer=jQuery.mbYTPlayer.getPlayer,jQuery.fn.YTPGetVideoID=jQuery.mbYTPlayer.getVideoID,jQuery.fn.YTPGetPlaylistID=jQuery.mbYTPlayer.getPlaylistID,jQuery.fn.YTPChangeVideo=jQuery.fn.YTPChangeMovie=jQuery.mbYTPlayer.changeVideo,jQuery.fn.YTPPlayerDestroy=jQuery.mbYTPlayer.playerDestroy,jQuery.fn.YTPPlay=jQuery.mbYTPlayer.play,jQuery.fn.YTPTogglePlay=jQuery.mbYTPlayer.togglePlay,jQuery.fn.YTPStop=jQuery.mbYTPlayer.stop,jQuery.fn.YTPPause=jQuery.mbYTPlayer.pause,jQuery.fn.YTPSeekTo=jQuery.mbYTPlayer.seekTo,jQuery.fn.YTPGetPlaybackRate=jQuery.mbYTPlayer.getPlaybackRate,jQuery.fn.YTPSetPlaybackRate=jQuery.mbYTPlayer.setPlaybackRate,jQuery.fn.changeCoverImage=jQuery.mbYTPlayer.changeCoverImage,jQuery.fn.YTPlaylist=jQuery.mbYTPlayer.playlist,jQuery.fn.YTPPlayNext=jQuery.mbYTPlayer.playNext,jQuery.fn.YTPPlayPrev=jQuery.mbYTPlayer.playPrev,jQuery.fn.YTPPlayIndex=jQuery.mbYTPlayer.playIndex,jQuery.fn.YTPMute=jQuery.mbYTPlayer.mute,jQuery.fn.YTPUnmute=jQuery.mbYTPlayer.unmute,jQuery.fn.YTPToggleVolume=jQuery.mbYTPlayer.toggleVolume,jQuery.fn.YTPSetVolume=jQuery.mbYTPlayer.setVolume,jQuery.fn.YTPGetVolume=jQuery.mbYTPlayer.getVolume,jQuery.fn.YTPGetVideoData=jQuery.mbYTPlayer.getVideoData,jQuery.fn.YTPFullscreen=jQuery.mbYTPlayer.fullscreen,jQuery.fn.YTPToggleLoops=jQuery.mbYTPlayer.toggleLoops,jQuery.fn.YTPManageProgress=jQuery.mbYTPlayer.manageProgress,jQuery.fn.YTPSetVideoQuality=jQuery.mbYTPlayer.setVideoQuality,jQuery.fn.YTPGetVideoQuality=jQuery.mbYTPlayer.getVideoQuality,jQuery.fn.YTPApplyFilter=jQuery.mbYTPlayer.applyFilter,jQuery.fn.YTPApplyFilters=jQuery.mbYTPlayer.applyFilters,jQuery.fn.YTPToggleFilter=jQuery.mbYTPlayer.toggleFilter,jQuery.fn.YTPToggleFilters=jQuery.mbYTPlayer.toggleFilters,jQuery.fn.YTPRemoveFilter=jQuery.mbYTPlayer.removeFilter,jQuery.fn.YTPDisableFilters=jQuery.mbYTPlayer.disableFilters,jQuery.fn.YTPEnableFilters=jQuery.mbYTPlayer.enableFilters,jQuery.fn.YTPGetFilters=jQuery.mbYTPlayer.getFilters,jQuery.fn.YTPGetTime=jQuery.mbYTPlayer.getTime,jQuery.fn.YTPGetTotalTime=jQuery.mbYTPlayer.getTotalTime,jQuery.fn.YTPAddMask=jQuery.mbYTPlayer.addMask,jQuery.fn.YTPRemoveMask=jQuery.mbYTPlayer.removeMask,jQuery.fn.YTPToggleMask=jQuery.mbYTPlayer.toggleMask,jQuery.fn.YTPGetAbundance=jQuery.mbYTPlayer.getAbundance,jQuery.fn.YTPSetAbundance=jQuery.mbYTPlayer.setAbundance,jQuery.fn.YTPSetAnchor=jQuery.mbYTPlayer.setAnchor,jQuery.fn.YTPGetAnchor=jQuery.mbYTPlayer.getAnchor,jQuery.fn.YTPSetOption=jQuery.mbYTPlayer.setOption}(jQuery,ytp);var nAgt=navigator.userAgent;function isTouchSupported(){var e=nAgt.msMaxTouchPoints,r="ontouchstart"in document.createElement("div");return!(!e&&!r)}jQuery.browser=jQuery.browser||{},jQuery.browser.mozilla=!1,jQuery.browser.webkit=!1,jQuery.browser.opera=!1,jQuery.browser.safari=!1,jQuery.browser.chrome=!1,jQuery.browser.androidStock=!1,jQuery.browser.msie=!1,jQuery.browser.edge=!1,jQuery.browser.ua=nAgt;var getOS=function(){var e={version:"Unknown version",name:"Unknown OS"};return-1!=navigator.appVersion.indexOf("Win")&&(e.name="Windows"),-1!=navigator.appVersion.indexOf("Mac")&&0>navigator.appVersion.indexOf("Mobile")&&(e.name="Mac"),-1!=navigator.appVersion.indexOf("Linux")&&(e.name="Linux"),/Mac OS X/.test(nAgt)&&!/Mobile/.test(nAgt)&&(e.version=/Mac OS X ([\._\d]+)/.exec(nAgt)[1],e.version=e.version.replace(/_/g,".").substring(0,5)),/Windows/.test(nAgt)&&(e.version="Unknown.Unknown"),/Windows NT 5.1/.test(nAgt)&&(e.version="5.1"),/Windows NT 6.0/.test(nAgt)&&(e.version="6.0"),/Windows NT 6.1/.test(nAgt)&&(e.version="6.1"),/Windows NT 6.2/.test(nAgt)&&(e.version="6.2"),/Windows NT 10.0/.test(nAgt)&&(e.version="10.0"),/Linux/.test(nAgt)&&/Linux/.test(nAgt)&&(e.version="Unknown.Unknown"),e.name=e.name.toLowerCase(),e.major_version="Unknown",e.minor_version="Unknown","Unknown.Unknown"!=e.version&&(e.major_version=parseFloat(e.version.split(".")[0]),e.minor_version=parseFloat(e.version.split(".")[1])),e},nameOffset,verOffset,ix;if(jQuery.browser.os=getOS(),jQuery.browser.hasTouch=isTouchSupported(),jQuery.browser.name=navigator.appName,jQuery.browser.fullVersion=""+parseFloat(navigator.appVersion),jQuery.browser.majorVersion=parseInt(navigator.appVersion,10),-1!=(verOffset=nAgt.indexOf("Opera")))jQuery.browser.opera=!0,jQuery.browser.name="Opera",jQuery.browser.fullVersion=nAgt.substring(verOffset+6),-1!=(verOffset=nAgt.indexOf("Version"))&&(jQuery.browser.fullVersion=nAgt.substring(verOffset+8));else if(-1!=(verOffset=nAgt.indexOf("OPR")))jQuery.browser.opera=!0,jQuery.browser.name="Opera",jQuery.browser.fullVersion=nAgt.substring(verOffset+4);else if(-1!=(verOffset=nAgt.indexOf("MSIE")))jQuery.browser.msie=!0,jQuery.browser.name="Microsoft Internet Explorer",jQuery.browser.fullVersion=nAgt.substring(verOffset+5);else if(-1!=nAgt.indexOf("Trident")){jQuery.browser.msie=!0,jQuery.browser.name="Microsoft Internet Explorer";var start=nAgt.indexOf("rv:")+3,end=start+4;jQuery.browser.fullVersion=nAgt.substring(start,end)}else-1!=(verOffset=nAgt.indexOf("Edge"))?(jQuery.browser.edge=!0,jQuery.browser.name="Microsoft Edge",jQuery.browser.fullVersion=nAgt.substring(verOffset+5)):-1!=(verOffset=nAgt.indexOf("Chrome"))?(jQuery.browser.webkit=!0,jQuery.browser.chrome=!0,jQuery.browser.name="Chrome",jQuery.browser.fullVersion=nAgt.substring(verOffset+7)):-1<nAgt.indexOf("mozilla/5.0")&&-1<nAgt.indexOf("android ")&&-1<nAgt.indexOf("applewebkit")&&!(-1<nAgt.indexOf("chrome"))?(verOffset=nAgt.indexOf("Chrome"),jQuery.browser.webkit=!0,jQuery.browser.androidStock=!0,jQuery.browser.name="androidStock",jQuery.browser.fullVersion=nAgt.substring(verOffset+7)):-1!=(verOffset=nAgt.indexOf("Safari"))?(jQuery.browser.webkit=!0,jQuery.browser.safari=!0,jQuery.browser.name="Safari",jQuery.browser.fullVersion=nAgt.substring(verOffset+7),-1!=(verOffset=nAgt.indexOf("Version"))&&(jQuery.browser.fullVersion=nAgt.substring(verOffset+8))):-1!=(verOffset=nAgt.indexOf("AppleWebkit"))?(jQuery.browser.webkit=!0,jQuery.browser.safari=!0,jQuery.browser.name="Safari",jQuery.browser.fullVersion=nAgt.substring(verOffset+7),-1!=(verOffset=nAgt.indexOf("Version"))&&(jQuery.browser.fullVersion=nAgt.substring(verOffset+8))):-1!=(verOffset=nAgt.indexOf("Firefox"))?(jQuery.browser.mozilla=!0,jQuery.browser.name="Firefox",jQuery.browser.fullVersion=nAgt.substring(verOffset+8)):(nameOffset=nAgt.lastIndexOf(" ")+1)<(verOffset=nAgt.lastIndexOf("/"))&&(jQuery.browser.name=nAgt.substring(nameOffset,verOffset),jQuery.browser.fullVersion=nAgt.substring(verOffset+1),jQuery.browser.name.toLowerCase()==jQuery.browser.name.toUpperCase()&&(jQuery.browser.name=navigator.appName));function uncamel(e){return e.replace(/([A-Z])/g,function(e){return"-"+e.toLowerCase()})}function setUnit(e,r){return"string"!=typeof e||e.match(/^[\-0-9\.]+jQuery/)?""+e+r:e}function setFilter(e,r,t){var a=uncamel(r),o=jQuery.browser.mozilla?"":jQuery.CSS.sfx;e[o+"filter"]=e[o+"filter"]||"",t=setUnit(t>jQuery.CSS.filters[r].max?jQuery.CSS.filters[r].max:t,jQuery.CSS.filters[r].unit),e[o+"filter"]+=a+"("+t+") ",delete e[r]}-1!=(ix=jQuery.browser.fullVersion.indexOf(";"))&&(jQuery.browser.fullVersion=jQuery.browser.fullVersion.substring(0,ix)),-1!=(ix=jQuery.browser.fullVersion.indexOf(" "))&&(jQuery.browser.fullVersion=jQuery.browser.fullVersion.substring(0,ix)),jQuery.browser.majorVersion=parseInt(""+jQuery.browser.fullVersion,10),isNaN(jQuery.browser.majorVersion)&&(jQuery.browser.fullVersion=""+parseFloat(navigator.appVersion),jQuery.browser.majorVersion=parseInt(navigator.appVersion,10)),jQuery.browser.version=jQuery.browser.majorVersion,jQuery.browser.android=/Android/i.test(nAgt),jQuery.browser.blackberry=/BlackBerry|BB|PlayBook/i.test(nAgt),jQuery.browser.ios=/iPhone|iPad|iPod|webOS/i.test(nAgt),jQuery.browser.operaMobile=/Opera Mini/i.test(nAgt),jQuery.browser.windowsMobile=/IEMobile|Windows Phone/i.test(nAgt),jQuery.browser.kindle=/Kindle|Silk/i.test(nAgt),jQuery.browser.mobile=jQuery.browser.android||jQuery.browser.blackberry||jQuery.browser.ios||jQuery.browser.windowsMobile||jQuery.browser.operaMobile||jQuery.browser.kindle,jQuery.isMobile=jQuery.browser.mobile,jQuery.isTablet=jQuery.browser.mobile&&765<jQuery(window).width(),jQuery.isAndroidDefault=jQuery.browser.android&&!/chrome/i.test(nAgt),jQuery.mbBrowser=jQuery.browser,jQuery.browser.versionCompare=function(e,r){if("stringstring"!=typeof e+typeof r)return!1;for(var t=e.split("."),a=r.split("."),o=0,n=Math.max(t.length,a.length);o<n;o++){if(t[o]&&!a[o]&&0<parseInt(t[o])||parseInt(t[o])>parseInt(a[o]))return 1;if(a[o]&&!t[o]&&0<parseInt(a[o])||parseInt(t[o])<parseInt(a[o]))return-1}return 0},jQuery.support.CSStransition=function(){var e=(document.body||document.documentElement).style;return void 0!==e.transition||void 0!==ekitTransition||void 0!==e.MozTransition||void 0!==e.MsTransition||void 0!==e.OTransition}(),jQuery.CSS={name:"mb.CSSAnimate",author:"Matteo Bicocchi",version:"2.0.0",transitionEnd:"transitionEnd",sfx:"",filters:{blur:{min:0,max:100,unit:"px"},brightness:{min:0,max:400,unit:"%"},contrast:{min:0,max:400,unit:"%"},grayscale:{min:0,max:100,unit:"%"},hueRotate:{min:0,max:360,unit:"deg"},invert:{min:0,max:100,unit:"%"},saturate:{min:0,max:400,unit:"%"},sepia:{min:0,max:100,unit:"%"}},normalizeCss:function(e){var r=jQuery.extend(!0,{},e);for(var t in jQuery.browser.webkit||jQuery.browser.opera?jQuery.CSS.sfx="-webkit-":jQuery.browser.mozilla?jQuery.CSS.sfx="-moz-":jQuery.browser.msie&&(jQuery.CSS.sfx="-ms-"),jQuery.CSS.sfx="",r){if("transform"===t&&(r[jQuery.CSS.sfx+"transform"]=r[t],delete r[t]),"transform-origin"===t&&(r[jQuery.CSS.sfx+"transform-origin"]=e[t],delete r[t]),"filter"!==t||jQuery.browser.mozilla||(r[jQuery.CSS.sfx+"filter"]=e[t],delete r[t]),"blur"===t&&setFilter(r,"blur",e[t]),"brightness"===t&&setFilter(r,"brightness",e[t]),"contrast"===t&&setFilter(r,"contrast",e[t]),"grayscale"===t&&setFilter(r,"grayscale",e[t]),"hueRotate"===t&&setFilter(r,"hueRotate",e[t]),"invert"===t&&setFilter(r,"invert",e[t]),"saturate"===t&&setFilter(r,"saturate",e[t]),"sepia"===t&&setFilter(r,"sepia",e[t]),"x"===t){var a=jQuery.CSS.sfx+"transform";r[a]=r[a]||"",r[a]+=" translateX("+setUnit(e[t],"px")+")",delete r[t]}"y"===t&&(r[a=jQuery.CSS.sfx+"transform"]=r[a]||"",r[a]+=" translateY("+setUnit(e[t],"px")+")",delete r[t]),"z"===t&&(r[a=jQuery.CSS.sfx+"transform"]=r[a]||"",r[a]+=" translateZ("+setUnit(e[t],"px")+")",delete r[t]),"rotate"===t&&(r[a=jQuery.CSS.sfx+"transform"]=r[a]||"",r[a]+=" rotate("+setUnit(e[t],"deg")+")",delete r[t]),"rotateX"===t&&(r[a=jQuery.CSS.sfx+"transform"]=r[a]||"",r[a]+=" rotateX("+setUnit(e[t],"deg")+")",delete r[t]),"rotateY"===t&&(r[a=jQuery.CSS.sfx+"transform"]=r[a]||"",r[a]+=" rotateY("+setUnit(e[t],"deg")+")",delete r[t]),"rotateZ"===t&&(r[a=jQuery.CSS.sfx+"transform"]=r[a]||"",r[a]+=" rotateZ("+setUnit(e[t],"deg")+")",delete r[t]),"scale"===t&&(r[a=jQuery.CSS.sfx+"transform"]=r[a]||"",r[a]+=" scale("+setUnit(e[t],"")+")",delete r[t]),"scaleX"===t&&(r[a=jQuery.CSS.sfx+"transform"]=r[a]||"",r[a]+=" scaleX("+setUnit(e[t],"")+")",delete r[t]),"scaleY"===t&&(r[a=jQuery.CSS.sfx+"transform"]=r[a]||"",r[a]+=" scaleY("+setUnit(e[t],"")+")",delete r[t]),"scaleZ"===t&&(r[a=jQuery.CSS.sfx+"transform"]=r[a]||"",r[a]+=" scaleZ("+setUnit(e[t],"")+")",delete r[t]),"skew"===t&&(r[a=jQuery.CSS.sfx+"transform"]=r[a]||"",r[a]+=" skew("+setUnit(e[t],"deg")+")",delete r[t]),"skewX"===t&&(r[a=jQuery.CSS.sfx+"transform"]=r[a]||"",r[a]+=" skewX("+setUnit(e[t],"deg")+")",delete r[t]),"skewY"===t&&(r[a=jQuery.CSS.sfx+"transform"]=r[a]||"",r[a]+=" skewY("+setUnit(e[t],"deg")+")",delete r[t]),"perspective"===t&&(r[a=jQuery.CSS.sfx+"transform"]=r[a]||"",r[a]+=" perspective("+setUnit(e[t],"px")+")",delete r[t])}return r},getProp:function(e){var r,t=[];for(r in e)0>t.indexOf(r)&&t.push(uncamel(r));return t.join(",")},animate:function(e,r,t,a,o){return this.each(function(){function n(){i.called=!0,i.CSSAIsRunning=!1,l.off(jQuery.CSS.transitionEnd+"."+i.id),clearTimeout(i.timeout),l.css(jQuery.CSS.sfx+"transition",""),"function"==typeof o&&o.apply(i),"function"==typeof i.CSSqueue&&(i.CSSqueue(),i.CSSqueue=null)}var i=this,l=jQuery(this);i.id=i.id||"CSSA_"+(new Date).getTime();var s=s||{type:"noEvent"};if(i.CSSAIsRunning&&i.eventType==s.type&&!jQuery.browser.msie&&9>=jQuery.browser.version)i.CSSqueue=function(){l.CSSAnimate(e,r,t,a,o)};else if(i.CSSqueue=null,i.eventType=s.type,0!==l.length&&e){if(e=jQuery.normalizeCss(e),i.CSSAIsRunning=!0,"function"==typeof r&&(o=r,r=jQuery.fx.speeds._default),"function"==typeof t&&(a=t,t=0),"string"==typeof t&&(o=t,t=0),"function"==typeof a&&(o=a,a="cubic-bezier(0.65,0.03,0.36,0.72)"),"string"==typeof r)for(var u in jQuery.fx.speeds){if(r==u){r=jQuery.fx.speeds[u];break}r=jQuery.fx.speeds._default}if(r||(r=jQuery.fx.speeds._default),"string"==typeof o&&(a=o,o=null),jQuery.support.CSStransition){var y={default:"ease",in:"ease-in",out:"ease-out","in-out":"ease-in-out",snap:"cubic-bezier(0,1,.5,1)",easeOutCubic:"cubic-bezier(.215,.61,.355,1)",easeInOutCubic:"cubic-bezier(.645,.045,.355,1)",easeInCirc:"cubic-bezier(.6,.04,.98,.335)",easeOutCirc:"cubic-bezier(.075,.82,.165,1)",easeInOutCirc:"cubic-bezier(.785,.135,.15,.86)",easeInExpo:"cubic-bezier(.95,.05,.795,.035)",easeOutExpo:"cubic-bezier(.19,1,.22,1)",easeInOutExpo:"cubic-bezier(1,0,0,1)",easeInQuad:"cubic-bezier(.55,.085,.68,.53)",easeOutQuad:"cubic-bezier(.25,.46,.45,.94)",easeInOutQuad:"cubic-bezier(.455,.03,.515,.955)",easeInQuart:"cubic-bezier(.895,.03,.685,.22)",easeOutQuart:"cubic-bezier(.165,.84,.44,1)",easeInOutQuart:"cubic-bezier(.77,0,.175,1)",easeInQuint:"cubic-bezier(.755,.05,.855,.06)",easeOutQuint:"cubic-bezier(.23,1,.32,1)",easeInOutQuint:"cubic-bezier(.86,0,.07,1)",easeInSine:"cubic-bezier(.47,0,.745,.715)",easeOutSine:"cubic-bezier(.39,.575,.565,1)",easeInOutSine:"cubic-bezier(.445,.05,.55,.95)",easeInBack:"cubic-bezier(.6,-.28,.735,.045)",easeOutBack:"cubic-bezier(.175, .885,.32,1.275)",easeInOutBack:"cubic-bezier(.68,-.55,.265,1.55)"};y[a]&&(a=y[a]),l.off(jQuery.CSS.transitionEnd+"."+i.id),y=jQuery.CSS.getProp(e);var d={};jQuery.extend(d,e),d[jQuery.CSS.sfx+"transition-property"]=y,d[jQuery.CSS.sfx+"transition-duration"]=r+"ms",d[jQuery.CSS.sfx+"transition-delay"]=t+"ms",d[jQuery.CSS.sfx+"transition-timing-function"]=a,setTimeout(function(){l.one(jQuery.CSS.transitionEnd+"."+i.id,n),l.css(d)},1),i.timeout=setTimeout(function(){i.called||!o?(i.called=!1,i.CSSAIsRunning=!1):(l.css(jQuery.CSS.sfx+"transition",""),o.apply(i),i.CSSAIsRunning=!1,"function"==typeof i.CSSqueue&&(i.CSSqueue(),i.CSSqueue=null))},r+t+10)}else{for(y in e)"transform"===y&&delete e[y],"filter"===y&&delete e[y],"transform-origin"===y&&delete e[y],"auto"===e[y]&&delete e[y],"x"===y&&(s=e[y],e[u="left"]=s,delete e[y]),"y"===y&&(s=e[y],e[u="top"]=s,delete e[y]),"-ms-transform"!==y&&"-ms-filter"!==y||delete e[y];l.delay(t).animate(e,r,o)}}})}},jQuery.fn.CSSAnimate=jQuery.CSS.animate,jQuery.normalizeCss=jQuery.CSS.normalizeCss,jQuery.fn.css3=function(e){return this.each(function(){var r=jQuery(this),t=jQuery.normalizeCss(e);r.css(t)})},function(e){e.simpleSlider={defaults:{initialval:0,maxval:100,orientation:"h",readonly:!1,callback:!1},events:{start:e.browser.mobile?"touchstart":"mousedown",end:e.browser.mobile?"touchend":"mouseup",move:e.browser.mobile?"touchmove":"mousemove"},init:function(r){return this.each(function(){var t=this,a=e(t);a.addClass("simpleSlider"),t.opt={},e.extend(t.opt,e.simpleSlider.defaults,r),e.extend(t.opt,a.data());var o="h"===t.opt.orientation?"horizontal":"vertical";o=e("<div/>").addClass("level").addClass(o),a.prepend(o),t.level=o,a.css({cursor:"default"}),"auto"==t.opt.maxval&&(t.opt.maxval=e(t).outerWidth()),a.updateSliderVal(),t.opt.readonly||(a.on(e.simpleSlider.events.start,function(r){e.browser.mobile&&(r=r.changedTouches[0]),t.canSlide=!0,a.updateSliderVal(r),"h"===t.opt.orientation?a.css({cursor:"col-resize"}):a.css({cursor:"row-resize"}),t.lastVal=t.val,e.browser.mobile||(r.preventDefault(),r.stopPropagation())}),e(document).on(e.simpleSlider.events.move,function(r){e.browser.mobile&&(r=r.changedTouches[0]),t.canSlide&&(e(document).css({cursor:"default"}),a.updateSliderVal(r),e.browser.mobile||(r.preventDefault(),r.stopPropagation()))}).on(e.simpleSlider.events.end,function(){e(document).css({cursor:"auto"}),t.canSlide=!1,a.css({cursor:"auto"})}))})},updateSliderVal:function(r){var t=this.get(0);if(t.opt){t.opt.initialval="number"==typeof t.opt.initialval?t.opt.initialval:t.opt.initialval(t);var a=e(t).outerWidth(),o=e(t).outerHeight();t.x="object"==typeof r?r.clientX+document.body.scrollLeft-this.offset().left:"number"==typeof r?r*a/t.opt.maxval:t.opt.initialval*a/t.opt.maxval,t.y="object"==typeof r?r.clientY+document.body.scrollTop-this.offset().top:"number"==typeof r?(t.opt.maxval-t.opt.initialval-r)*o/t.opt.maxval:t.opt.initialval*o/t.opt.maxval,t.y=this.outerHeight()-t.y,t.scaleX=t.x*t.opt.maxval/a,t.scaleY=t.y*t.opt.maxval/o,t.outOfRangeX=t.scaleX>t.opt.maxval?t.scaleX-t.opt.maxval:0>t.scaleX?t.scaleX:0,t.outOfRangeY=t.scaleY>t.opt.maxval?t.scaleY-t.opt.maxval:0>t.scaleY?t.scaleY:0,t.outOfRange="h"===t.opt.orientation?t.outOfRangeX:t.outOfRangeY,t.value=void 0!==r?"h"===t.opt.orientation?t.x>=this.outerWidth()?t.opt.maxval:0>=t.x?0:t.scaleX:t.y>=this.outerHeight()?t.opt.maxval:0>=t.y?0:t.scaleY:"h"===t.opt.orientation?t.scaleX:t.scaleY,"h"===t.opt.orientation?t.level.width(Math.floor(100*t.x/a)+"%"):t.level.height(Math.floor(100*t.y/o)),t.lastVal===t.value&&("h"===t.opt.orientation&&(t.x>=this.outerWidth()||0>=t.x)||"h"!==t.opt.orientation&&(t.y>=this.outerHeight()||0>=t.y))||("function"==typeof t.opt.callback&&t.opt.callback(t),t.lastVal=t.value)}}},e.fn.simpleSlider=e.simpleSlider.init,e.fn.updateSliderVal=e.simpleSlider.updateSliderVal}(jQuery),function(e){e.mbCookie={set:function(e,r,t,a){"object"==typeof r&&(r=JSON.stringify(r)),a=a?"; domain="+a:"";var o=new Date,n="";0<t&&(o.setTime(o.getTime()+864e5*t),n="; expires="+o.toGMTString()),document.cookie=e+"="+r+n+"; path=/"+a},get:function(e){e+="=";for(var r=document.cookie.split(";"),t=0;t<r.length;t++){for(var a=r[t];" "==a.charAt(0);)a=a.substring(1,a.length);if(0==a.indexOf(e))try{return JSON.parse(a.substring(e.length,a.length))}catch(r){return a.substring(e.length,a.length)}}return null},remove:function(r){e.mbCookie.set(r,"",-1)}},e.mbStorage={set:function(e,r){"object"==typeof r&&(r=JSON.stringify(r)),localStorage.setItem(e,r)},get:function(e){if(!localStorage[e])return null;try{return JSON.parse(localStorage[e])}catch(r){return localStorage[e]}},remove:function(e){e?localStorage.removeItem(e):localStorage.clear()}}}(jQuery);var nAgt=navigator.userAgent;function isTouchSupported(){var e=nAgt.msMaxTouchPoints,r="ontouchstart"in document.createElement("div");return!(!e&&!r)}jQuery.mbBrowser={},jQuery.mbBrowser.mozilla=!1,jQuery.mbBrowser.webkit=!1,jQuery.mbBrowser.opera=!1,jQuery.mbBrowser.safari=!1,jQuery.mbBrowser.chrome=!1,jQuery.mbBrowser.androidStock=!1,jQuery.mbBrowser.msie=!1,jQuery.mbBrowser.edge=!1,jQuery.mbBrowser.ua=nAgt;var getOS=function(){var e={version:"Unknown version",name:"Unknown OS"};return-1!=navigator.appVersion.indexOf("Win")&&(e.name="Windows"),-1!=navigator.appVersion.indexOf("Mac")&&0>navigator.appVersion.indexOf("Mobile")&&(e.name="Mac"),-1!=navigator.appVersion.indexOf("Linux")&&(e.name="Linux"),/Mac OS X/.test(nAgt)&&!/Mobile/.test(nAgt)&&(e.version=/Mac OS X ([\._\d]+)/.exec(nAgt)[1],e.version=e.version.replace(/_/g,".").substring(0,5)),/Windows/.test(nAgt)&&(e.version="Unknown.Unknown"),/Windows NT 5.1/.test(nAgt)&&(e.version="5.1"),/Windows NT 6.0/.test(nAgt)&&(e.version="6.0"),/Windows NT 6.1/.test(nAgt)&&(e.version="6.1"),/Windows NT 6.2/.test(nAgt)&&(e.version="6.2"),/Windows NT 10.0/.test(nAgt)&&(e.version="10.0"),/Linux/.test(nAgt)&&/Linux/.test(nAgt)&&(e.version="Unknown.Unknown"),e.name=e.name.toLowerCase(),e.major_version="Unknown",e.minor_version="Unknown","Unknown.Unknown"!=e.version&&(e.major_version=parseFloat(e.version.split(".")[0]),e.minor_version=parseFloat(e.version.split(".")[1])),e},nameOffset,verOffset,ix;if(jQuery.mbBrowser.os=getOS(),jQuery.mbBrowser.hasTouch=isTouchSupported(),jQuery.mbBrowser.name=navigator.appName,jQuery.mbBrowser.fullVersion=""+parseFloat(navigator.appVersion),jQuery.mbBrowser.majorVersion=parseInt(navigator.appVersion,10),-1!=(verOffset=nAgt.indexOf("Opera")))jQuery.mbBrowser.opera=!0,jQuery.mbBrowser.name="Opera",jQuery.mbBrowser.fullVersion=nAgt.substring(verOffset+6),-1!=(verOffset=nAgt.indexOf("Version"))&&(jQuery.mbBrowser.fullVersion=nAgt.substring(verOffset+8));else if(-1!=(verOffset=nAgt.indexOf("OPR")))jQuery.mbBrowser.opera=!0,jQuery.mbBrowser.name="Opera",jQuery.mbBrowser.fullVersion=nAgt.substring(verOffset+4);else if(-1!=(verOffset=nAgt.indexOf("MSIE")))jQuery.mbBrowser.msie=!0,jQuery.mbBrowser.name="Microsoft Internet Explorer",jQuery.mbBrowser.fullVersion=nAgt.substring(verOffset+5);else if(-1!=nAgt.indexOf("Trident")){jQuery.mbBrowser.msie=!0,jQuery.mbBrowser.name="Microsoft Internet Explorer";var start=nAgt.indexOf("rv:")+3,end=start+4;jQuery.mbBrowser.fullVersion=nAgt.substring(start,end)}else-1!=(verOffset=nAgt.indexOf("Edge"))?(jQuery.mbBrowser.edge=!0,jQuery.mbBrowser.name="Microsoft Edge",jQuery.mbBrowser.fullVersion=nAgt.substring(verOffset+5)):-1!=(verOffset=nAgt.indexOf("Chrome"))?(jQuery.mbBrowser.webkit=!0,jQuery.mbBrowser.chrome=!0,jQuery.mbBrowser.name="Chrome",jQuery.mbBrowser.fullVersion=nAgt.substring(verOffset+7)):-1<nAgt.indexOf("mozilla/5.0")&&-1<nAgt.indexOf("android ")&&-1<nAgt.indexOf("applewebkit")&&!(-1<nAgt.indexOf("chrome"))?(verOffset=nAgt.indexOf("Chrome"),jQuery.mbBrowser.webkit=!0,jQuery.mbBrowser.androidStock=!0,jQuery.mbBrowser.name="androidStock",jQuery.mbBrowser.fullVersion=nAgt.substring(verOffset+7)):-1!=(verOffset=nAgt.indexOf("Safari"))?(jQuery.mbBrowser.webkit=!0,jQuery.mbBrowser.safari=!0,jQuery.mbBrowser.name="Safari",jQuery.mbBrowser.fullVersion=nAgt.substring(verOffset+7),-1!=(verOffset=nAgt.indexOf("Version"))&&(jQuery.mbBrowser.fullVersion=nAgt.substring(verOffset+8))):-1!=(verOffset=nAgt.indexOf("AppleWebkit"))?(jQuery.mbBrowser.webkit=!0,jQuery.mbBrowser.safari=!0,jQuery.mbBrowser.name="Safari",jQuery.mbBrowser.fullVersion=nAgt.substring(verOffset+7),-1!=(verOffset=nAgt.indexOf("Version"))&&(jQuery.mbBrowser.fullVersion=nAgt.substring(verOffset+8))):-1!=(verOffset=nAgt.indexOf("Firefox"))?(jQuery.mbBrowser.mozilla=!0,jQuery.mbBrowser.name="Firefox",jQuery.mbBrowser.fullVersion=nAgt.substring(verOffset+8)):(nameOffset=nAgt.lastIndexOf(" ")+1)<(verOffset=nAgt.lastIndexOf("/"))&&(jQuery.mbBrowser.name=nAgt.substring(nameOffset,verOffset),jQuery.mbBrowser.fullVersion=nAgt.substring(verOffset+1),jQuery.mbBrowser.name.toLowerCase()==jQuery.mbBrowser.name.toUpperCase()&&(jQuery.mbBrowser.name=navigator.appName));-1!=(ix=jQuery.mbBrowser.fullVersion.indexOf(";"))&&(jQuery.mbBrowser.fullVersion=jQuery.mbBrowser.fullVersion.substring(0,ix)),-1!=(ix=jQuery.mbBrowser.fullVersion.indexOf(" "))&&(jQuery.mbBrowser.fullVersion=jQuery.mbBrowser.fullVersion.substring(0,ix)),jQuery.mbBrowser.majorVersion=parseInt(""+jQuery.mbBrowser.fullVersion,10),isNaN(jQuery.mbBrowser.majorVersion)&&(jQuery.mbBrowser.fullVersion=""+parseFloat(navigator.appVersion),jQuery.mbBrowser.majorVersion=parseInt(navigator.appVersion,10)),jQuery.mbBrowser.version=jQuery.mbBrowser.majorVersion,jQuery.mbBrowser.android=/Android/i.test(nAgt),jQuery.mbBrowser.blackberry=/BlackBerry|BB|PlayBook/i.test(nAgt),jQuery.mbBrowser.ios=/iPhone|iPad|iPod|webOS/i.test(nAgt),jQuery.mbBrowser.operaMobile=/Opera Mini/i.test(nAgt),jQuery.mbBrowser.windowsMobile=/IEMobile|Windows Phone/i.test(nAgt),jQuery.mbBrowser.kindle=/Kindle|Silk/i.test(nAgt),jQuery.mbBrowser.mobile=jQuery.mbBrowser.android||jQuery.mbBrowser.blackberry||jQuery.mbBrowser.ios||jQuery.mbBrowser.windowsMobile||jQuery.mbBrowser.operaMobile||jQuery.mbBrowser.kindle,jQuery.isMobile=jQuery.mbBrowser.mobile,jQuery.isTablet=jQuery.mbBrowser.mobile&&765<jQuery(window).width(),jQuery.isAndroidDefault=jQuery.mbBrowser.android&&!/chrome/i.test(nAgt),jQuery.mbBrowser=jQuery.mbBrowser,jQuery.mbBrowser.versionCompare=function(e,r){if("stringstring"!=typeof e+typeof r)return!1;for(var t=e.split("."),a=r.split("."),o=0,n=Math.max(t.length,a.length);o<n;o++){if(t[o]&&!a[o]&&0<parseInt(t[o])||parseInt(t[o])>parseInt(a[o]))return 1;if(a[o]&&!t[o]&&0<parseInt(a[o])||parseInt(t[o])<parseInt(a[o]))return-1}return 0};

SEMICOLON.Core.getVars.fn.accordions = selector => {
	const core = SEMICOLON.Core;
	core.initFunction({ class: 'has-plugin-accordions', event: 'pluginAccordionsReady' });

	selector = core.getSelector( selector );
	if( selector.length < 1 ){
		return true;
	}

	selector.each( function(){
		let element = jQuery(this),
			elState = element.attr('data-state'),
			elActive = element.attr('data-active') || 1,
			elActiveClass = element.attr('data-active-class') || '',
			elCollapsible = element.attr('data-collapsible') || 'false',
			windowHash = location.hash,
			accActive;

		elActive = Number( elActive ) - 1;

		if( typeof windowHash !== 'undefined' && windowHash != '' ) {
			accActive = element.find('.accordion-header'+ windowHash);
			if( accActive.length > 0 ) {
				elActive = accActive.index() / 2;
			}
		}

		element.find('.accordion-content').hide();

		if( elState != 'closed' ) {
			element.find('.accordion-header:eq('+ Number(elActive) +')').addClass('accordion-active ' + elActiveClass).next().show();
		}

		element.find('.accordion-header').off( 'click' ).on( 'click', function(){
			let clickTarget = jQuery(this);
			if( clickTarget.next().is(':hidden') ) {
				element.find('.accordion-header').removeClass('accordion-active ' + elActiveClass).next().slideUp("normal");
				clickTarget.toggleClass('accordion-active ' + elActiveClass, true).next().stop(true,true).slideDown("normal", function(){
					if( ( jQuery('body').hasClass('device-sm') || jQuery('body').hasClass('device-xs') ) && element.hasClass('scroll-on-open') ) {
						jQuery('html,body').stop(true,true).animate({
							'scrollTop': clickTarget.offset().top - ( SEMICOLON.initialize.topScrollOffset() - 40 )
						}, 800, 'easeOutQuad' );
					}

					core.runContainerModules( clickTarget.next()[0] );
				});
			} else {
				if( elCollapsible == 'true' ) {
					clickTarget.toggleClass('accordion-active ' + elActiveClass, false).next().stop(true,true).slideUp("normal");
				}
			}
			return false;
		});
	});
};

SEMICOLON.Core.getVars.fn.adaptivecolorscheme = selector => {
	const core = SEMICOLON.Core;
	core.initFunction({ class: 'has-plugin-adaptivecolorscheme', event: 'pluginAdaptiveColorSchemeReady' });

	selector = core.getSelector( selector, false );
	if( selector.length < 1 ){
		return true;
	}

	const adaptiveEl = document.querySelector('[data-adaptive-light-class],[data-adaptive-dark-class]');
	let adaptLightClass;
	let adaptDarkClass;

	if( core.getVars.elBody.contains(adaptiveEl) ) {
		adaptLightClass = adaptiveEl.getAttribute( 'data-adaptive-light-class' );
		adaptDarkClass = adaptiveEl.getAttribute( 'data-adaptive-dark-class' );
	}

	const adaptClasses = dark => {
		if( dark ) {
			core.getVars.elBody.classList.add( 'dark' );
		} else {
			core.getVars.elBody.classList.remove('dark');
		}

		if( core.getVars.elBody.contains(adaptiveEl) ) {
			if( dark ) {
				adaptiveEl.classList.remove( adaptLightClass );
				adaptiveEl.classList.add( adaptDarkClass );
			} else {
				adaptiveEl.classList.remove( adaptDarkClass );
				adaptiveEl.classList.add( adaptLightClass );
			}
		}

		SEMICOLON.Base.setBSTheme();
	};

	if( window.matchMedia ) {
		adaptClasses( window.matchMedia('(prefers-color-scheme: dark)').matches );

		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
			adaptClasses( e.matches );
		});
	}
};

SEMICOLON.Core.getVars.fn.ajaxbutton = selector => {
	const core = SEMICOLON.Core;
	core.initFunction({ class: 'has-plugin-ajaxbutton', event: 'pluginAjaxButtonReady' });

	selector = core.getSelector( selector, false );
	if( selector.length < 1 ){
		return true;
	}

	selector.forEach( el => {
		el.onclick = e => {
			let trigger = el,
				elLoader = el.getAttribute('data-ajax-loader'),
				elContainer = document.querySelector( el.getAttribute('data-ajax-container') ),
				elContentPlacement = el.getAttribute('data-ajax-insertion') || 'append',
				elTriggerHide = el.getAttribute('data-ajax-trigger-hide') || 'true',
				elTriggerDisable = el.getAttribute('data-ajax-trigger-disable') || 'true';

			fetch( elLoader ).then( response => {
				return response.text();
			}).then( html => {
				let domParser = new DOMParser();
				let parsedHTML = domParser.parseFromString(html, 'text/html');

				if( elContentPlacement == 'append' ) {
					elContainer?.insertAdjacentHTML('beforeend', parsedHTML.body.innerHTML);
				} else {
					elContainer?.insertAdjacentHTML('afterbegin', parsedHTML.body.innerHTML);
				}

				if( elTriggerHide == 'true' ) {
					el.classList.add('d-none');
				}

				core.runContainerModules( elContainer );

				if( elTriggerDisable == 'true' ) {
					setTimeout( () => {
						trigger.onclick = e => {
							e.stopPropagation();
							return false;
						};
					}, 1000);
				}
			}).catch( err => {
				let errorDIV = document.createElement("div");
				errorDIV.classList.add( 'd-inline-block', 'text-danger', 'me-3' );
				errorDIV.innerText = 'Content Cannot be Loaded!';
				elContainer?.prepend( errorDIV, ': ' + err );
			});

			e.preventDefault();
		};
	});
};

SEMICOLON.Core.getVars.fn.ajaxform = selector => {
	const core = SEMICOLON.Core;
	//core.loadJS({ file: 'plugins.form.js', id: 'canvas-form-js', jsFolder: true });
	core.isFuncTrue( () => jQuery().validate && jQuery().ajaxSubmit ).then( cond => {
		if( !cond ) {
			return false;
		}

		core.initFunction({ class: 'has-plugin-form', event: 'pluginFormReady' });

		selector = core.getSelector( selector );
		if( selector.length < 1 ){
			return true;
		}

		selector.each( function(){
			let element = jQuery(this),
				$body = jQuery('body'),
				elForm = element.find('form'),
				elFormId = elForm.attr('id'),
				elAlert = element.attr('data-alert-type'),
				elLoader = element.attr('data-loader'),
				elResult = element.find('.form-result'),
				elRedirect = element.attr('data-redirect'),
				defButton, alertType;

			if( !elAlert ) {
				elAlert = 'notify';
			}

			if( elFormId ) {
				$body.addClass( elFormId + '-ready' );
			}

			element.find('form').validate({
				errorPlacement: function(error, elementItem) {
					if( elementItem.parents('.form-group').length > 0 ) {
						error.appendTo( elementItem.parents('.form-group') );
					} else {
						error.insertAfter( elementItem );
					}
				},
				focusCleanup: true,
				submitHandler: function(form) {

					if( element.hasClass( 'custom-submit' ) ) {
						jQuery(form).submit();
						return true;
					}

					elResult.hide();

					if( elLoader == 'button' ) {
						defButton = jQuery(form).find('button');
						defButtonText = defButton.html();

						defButton.html('<i class="bi-arrow-repeat icon-spin m-0"></i>');
					} else {
						jQuery(form).find('.form-process').fadeIn();
					}

					if( elFormId ) {
						$body.removeClass( elFormId + '-ready ' + elFormId + '-complete ' + elFormId + '-success ' + elFormId + '-error' ).addClass( elFormId + '-processing' );
					}

					jQuery(form).ajaxSubmit({
						target: elResult,
						dataType: 'json',
						success: function( data ) {
							if( elLoader == 'button' ) {
								defButton.html( defButtonText );
							} else {
								jQuery(form).find('.form-process').fadeOut();
							}

							if( data.alert != 'error' && elRedirect ){
								window.location.replace( elRedirect );
								return true;
							}

							if( elAlert == 'inline' ) {
								if( data.alert == 'error' ) {
									alertType = 'alert-danger';
								} else {
									alertType = 'alert-success';
								}

								elResult.removeClass( 'alert-danger alert-success' ).addClass( 'alert ' + alertType ).html( data.message ).slideDown( 400 );
							} else if( elAlert == 'notify' ) {
								elResult.attr( 'data-notify-type', data.alert ).attr( 'data-notify-msg', data.message ).html('');
								SEMICOLON.Modules.notifications(elResult);
							}

							if( data.alert != 'error' ) {
								jQuery(form).resetForm();
								jQuery(form).find('.btn-group > .btn').removeClass('active');

								if( (typeof tinyMCE != 'undefined') && tinyMCE.activeEditor && !tinyMCE.activeEditor.isHidden() ){
									tinymce.activeEditor.setContent('');
								}

								let rangeSlider = jQuery(form).find('.input-range-slider');
								if( rangeSlider.length > 0 ) {
									rangeSlider.each( function(){
										let range = jQuery(this).data('ionRangeSlider');
										range.reset();
									});
								}

								let ratings = jQuery(form).find('.input-rating');
								if( ratings.length > 0 ) {
									ratings.each( function(){
										jQuery(this).rating('reset');
									});
								}

								let selectPicker = jQuery(form).find('.selectpicker');
								if( selectPicker.length > 0 ) {
									selectPicker.each( function(){
										jQuery(this).selectpicker('val', '');
										jQuery(this).selectpicker('deselectAll');
									});
								}

								jQuery(form).find('.input-select2,select[data-selectsplitter-firstselect-selector]').change();

								jQuery(form).trigger( 'formSubmitSuccess', data );
								$body.removeClass( elFormId + '-error' ).addClass( elFormId + '-success' );
							} else {
								jQuery(form).trigger( 'formSubmitError', data );
								$body.removeClass( elFormId + '-success' ).addClass( elFormId + '-error' );
							}

							if( elFormId ) {
								$body.removeClass( elFormId + '-processing' ).addClass( elFormId + '-complete' );
							}

							if( jQuery(form).find('.g-recaptcha').children('div').length > 0 ) {
								grecaptcha.reset();
							}
						}
					});
				}
			});

		});
	});
};

SEMICOLON.Core.getVars.fn.ajaxportfolio = selector => {
	const core = SEMICOLON.Core;
	core.initFunction({ class: 'has-plugin-ajaxportfolio', event: 'pluginAjaxPortfolioReady' });

	selector = core.getSelector( selector, false );
	if( selector.length < 1 ){
		return true;
	}

	core.getVars.portfolioAjax.items = selector[0].querySelectorAll('.portfolio-item');
	core.getVars.portfolioAjax.wrapper = document.getElementById('portfolio-ajax-wrap');
	core.getVars.portfolioAjax.wrapperOffset = core.offset(core.getVars.portfolioAjax.wrapper).top;
	core.getVars.portfolioAjax.container = document.getElementById('portfolio-ajax-container');
	core.getVars.portfolioAjax.loader = document.getElementById('portfolio-ajax-loader');
	core.getVars.portfolioAjax.prevItem = '';

	selector[0].querySelectorAll('.portfolio-ajax-trigger').forEach( el => {
		if( !el.querySelector('i:nth-child(2)') ) {
			el.innerHTML += '<i class="bi-arrow-repeat icon-spin"></i>';
		}

		el.onclick = e => {
			let portPostId = e.target.closest('.portfolio-item').getAttribute('id');

			if( !e.target.closest('.portfolio-item').classList.contains('portfolio-active') ) {
				CanvasPortfolioLoadItem(portPostId, core.getVars.portfolioAjax.prevItem);
			}

			e.preventDefault();
		};
	});
};

const CanvasPortfolioNewNextPrev = portPostId => {
	let portNext = CanvasPortfolioGetNextItem(portPostId);
	let portPrev = CanvasPortfolioGetPrevItem(portPostId);
	let portNav = document.getElementById('portfolio-navigation');

	if( !document.getElementById('prev-portfolio') && portPrev ) {
		var prevPortItem = document.createElement('a');
		prevPortItem.setAttribute('href', '#');
		prevPortItem.setAttribute('id', 'prev-portfolio');
		prevPortItem.setAttribute('data-id', portPrev);
		prevPortItem.innerHTML = '<i class="bi-arrow-left"></i>';
		portNav.insertBefore( prevPortItem, document.getElementById('close-portfolio'));
	}

	if( !document.getElementById('next-portfolio') && portNext ) {
		var nextPortItem = document.createElement('a');
		nextPortItem.setAttribute('href', '#');
		nextPortItem.setAttribute('id', 'next-portfolio');
		nextPortItem.setAttribute('data-id', portNext);
		nextPortItem.innerHTML = '<i class="bi-arrow-right"></i>';
		portNav.insertBefore( nextPortItem, document.getElementById('close-portfolio'));
	}
};

const CanvasPortfolioLoadItem = (portPostId, prevPostPortId, getIt) => {
	const core = SEMICOLON.Core;
	if(!getIt) { getIt = false; }
	let portNext = CanvasPortfolioGetNextItem(portPostId);
	let portPrev = CanvasPortfolioGetPrevItem(portPostId);
	if(getIt == false) {
		CanvasPortfolioCloseItem();
		core.getVars.elBody.classList.add('portfolio-ajax-loading');
		// core.getVars.portfolioAjax.loader.classList.add('loader-overlay-display');
		let portfolioDataLoader = document.getElementById(portPostId).getAttribute('data-loader');

		fetch( portfolioDataLoader ).then( response => {
			return response.text();
		}).then( html => {
			core.getVars.portfolioAjax.container.innerHTML = html;

			let nextPortfolio = document.getElementById('next-portfolio'),
				prevPortfolio = document.getElementById('prev-portfolio');

			nextPortfolio.classList.add('d-none');
			prevPortfolio.classList.add('d-none');

			if( portNext ) {
				nextPortfolio.setAttribute('data-id', portNext);
				nextPortfolio.classList.remove('d-none');
			}

			if( portPrev ) {
				prevPortfolio.setAttribute('data-id', portPrev);
				prevPortfolio.classList.remove('d-none');
			}

			CanvasPortfolioInitializeAjax(portPostId);
			CanvasPortfolioOpenItem();
			core.getVars.portfolioAjax.items.forEach( item => {
				item.classList.remove('portfolio-active');
			});
			document.getElementById(portPostId).classList.add('portfolio-active');
		}).catch( error => {
			console.warn('Something went wrong.', error);
		});
	}
};

const CanvasPortfolioCloseItem = () => {
	const core = SEMICOLON.Core;
	if( core.getVars.portfolioAjax.wrapper && core.getVars.portfolioAjax.wrapper.offsetHeight > 32 ) {
		core.getVars.elBody.classList.remove('portfolio-ajax-loading');
		// core.getVars.portfolioAjax.loader.classList.add('loader-overlay-display');
		core.getVars.portfolioAjax.wrapper.classList.remove('portfolio-ajax-opened');
		core.getVars.portfolioAjax.wrapper.querySelector('#portfolio-ajax-single').ontransitionend = () => {
			core.getVars.portfolioAjax.wrapper.querySelector('#portfolio-ajax-single').remove();
		};

		core.getVars.portfolioAjax.items.forEach( item => {
			item.classList.remove('portfolio-active');
		});
	}
};

const CanvasPortfolioOpenItem = () => {
	const core = SEMICOLON.Core;
	let countImages = core.getVars.portfolioAjax.container.querySelectorAll('img').length;

	if( countImages < 1 ) {
		CanvasPortfolioDisplayItem();
	} else {
		core.imagesLoaded(core.getVars.portfolioAjax.container);
		core.getVars.portfolioAjax.container.addEventListener( 'CanvasImagesLoaded', () => {
			CanvasPortfolioDisplayItem();
		});
	}
};

const CanvasPortfolioDisplayItem = () => {
	const core = SEMICOLON.Core;

	core.getVars.portfolioAjax.container.style.display = 'block';
	core.getVars.portfolioAjax.wrapper.classList.add('portfolio-ajax-opened');
	core.getVars.elBody.classList.remove('portfolio-ajax-loading');
	// core.getVars.portfolioAjax.loader.classList.remove('loader-overlay-display');
	setTimeout( () => {
		core.runContainerModules( core.getVars.portfolioAjax.wrapper );
		window.scrollTo({
			top: core.getVars.portfolioAjax.wrapperOffset - core.getVars.topScrollOffset - 60,
			behavior: 'smooth'
		});
	}, 500);
}

const CanvasPortfolioGetNextItem = portPostId => {
	let portNext = false;
	let hasNext = document.getElementById(portPostId).nextElementSibling;
	if( hasNext ) {
		portNext = hasNext.getAttribute('id');
	}
	return portNext;
};

const CanvasPortfolioGetPrevItem = portPostId => {
	let portPrev = false;
	let hasPrev = document.getElementById(portPostId).previousElementSibling;
	if( hasPrev ) {
		portPrev = hasPrev.getAttribute('id');
	}
	return portPrev;
};

const CanvasPortfolioInitializeAjax = portPostId => {
	const core = SEMICOLON.Core;
	core.getVars.portfolioAjax.prevItem = document.getElementById(portPostId);

	CanvasPortfolioNewNextPrev(portPostId);

	document.querySelectorAll('#next-portfolio, #prev-portfolio').forEach( el => {
		el.onclick = e => {
			CanvasPortfolioCloseItem();

			let portPostId = el.getAttribute('data-id');
			document.getElementById(portPostId).classList.add('portfolio-active');
			CanvasPortfolioLoadItem(portPostId, core.getVars.portfolioAjax.prevItem);
			e.preventDefault();
		};
	})

	document.getElementById('close-portfolio').onclick = e => {
		CanvasPortfolioCloseItem();
		e.preventDefault();
	};
};

SEMICOLON.Core.getVars.fn.animations = selector => {
	const core = SEMICOLON.Core;
	core.initFunction({ class: 'has-plugin-animations', event: 'pluginAnimationsReady' });

	selector = core.getSelector( selector, false );
	if( selector.length < 1 ){
		return true;
	}

	let SELECTOR = '[data-animate]',
		ANIMATE_CLASS_NAME = 'animated';

	let isAnimated = function(element) {
		element.classList.contains(ANIMATE_CLASS_NAME)
	};

	let intersectionObserver = new IntersectionObserver(
		function(entries, observer) {
			entries.forEach( entry => {
				let element = entry.target,
					elAnimation = element.getAttribute('data-animate'),
					elAnimOut = element.getAttribute('data-animate-out'),
					elAnimDelay = element.getAttribute('data-delay'),
					elAnimDelayOut = element.getAttribute('data-delay-out'),
					elAnimDelayTime = 0,
					elAnimDelayOutTime = 3000,
					elAnimations = elAnimation.split(' ');

				if( element.closest('.fslider.no-thumbs-animate') ) {
					return true;
				}

				if( element.closest('.swiper-slide') ) {
					return true;
				}

				if( elAnimDelay ) {
					elAnimDelayTime = Number( elAnimDelay ) + 500;
				} else {
					elAnimDelayTime = 500;
				}

				if( elAnimOut && elAnimDelayOut ) {
					elAnimDelayOutTime = Number( elAnimDelayOut ) + elAnimDelayTime;
				}

				if( !element.classList.contains('animated') ) {
					element.classList.add('not-animated');
					if( entry.intersectionRatio > 0 ) {
						setTimeout(() => {
							element.classList.remove('not-animated');
							elAnimations.forEach(item => element.classList.add(item));
							element.classList.add('animated');
						}, elAnimDelayTime);

						if( elAnimOut ) {
							setTimeout(() => {
								elAnimations.forEach(item => element.classList.remove(item));
								elAnimOut.split(' ').forEach(item => element.classList.add(item));
							}, elAnimDelayOutTime);
						}
					}
				}

				if( !element.classList.contains('not-animated') ) {
					observer.unobserve(element);
				}
			});
		}
	);

	let elements = [].filter.call(
		document.querySelectorAll(SELECTOR), element => {
			return !isAnimated(element, ANIMATE_CLASS_NAME);
		});

	elements.forEach( element => {
		return intersectionObserver.observe(element)
	});
};

SEMICOLON.Core.getVars.fn.bootstrap = selector => {
	const core = SEMICOLON.Core;
    //core.loadJS({ file: 'plugins.bootstrap.js', id: 'canvas-bootstrap-js', jsFolder: true });
    core.isFuncTrue( () => typeof bootstrap !== 'undefined' ).then( cond => {
        if( !cond ) {
            return false;
        }

        SEMICOLON.Core.initFunction({ class: 'has-plugin-bootstrap', event: 'pluginBootstrapReady' });
    });
};

SEMICOLON.Core.getVars.fn.bscomponents = selector => {
	const core = SEMICOLON.Core;
	//core.loadJS({ file: 'plugins.bootstrap.js', id: 'canvas-bootstrap-js', jsFolder: true });
	core.isFuncTrue( () => typeof bootstrap !== 'undefined' ).then( cond => {
		if( !cond ) {
			return false;
		}

		core.initFunction({ class: 'has-plugin-bscomponents', event: 'pluginBsComponentsReady' });

		selector = core.getSelector( selector, false );
		if( selector.length < 1 ){
			return true;
		}

		let tooltips = [].slice.call(core.getVars.baseEl.querySelectorAll('[data-bs-toggle="tooltip"]'));
		let tooltipList = tooltips.map( tooltipEl => {
			return new bootstrap.Tooltip(tooltipEl, { container: 'body' });
		});

		let popovers = [].slice.call(core.getVars.baseEl.querySelectorAll('[data-bs-toggle="popover"]'));
		let popoverList = popovers.map( popoverEl => {
			return new bootstrap.Popover(popoverEl, { container: 'body' });
		});

		let tabs = document.querySelectorAll('[data-bs-toggle="tab"],[data-bs-toggle="pill"]');

		const tabTargetShow = target => {
			const tabTrigger = new bootstrap.Tab(target);
			tabTrigger.show();
		};

		document.querySelectorAll('.canvas-tabs').forEach(el => {
			let activeTab = el.getAttribute('data-active');

			if( activeTab ) {
				activeTab = Number(activeTab) - 1;
				tabTargetShow(el.querySelectorAll('[data-bs-target]')[activeTab]);
			}
		});

		document.querySelectorAll('.tab-hover').forEach(el => {
			el.querySelectorAll('[data-bs-target]').forEach(tab => {
				tab.addEventListener( 'mouseover', () => {
					tabTargetShow(tab);
				});
			});
		});

		if( core.getVars.hash && document.querySelector('[data-bs-target="'+core.getVars.hash+'"]') ) {
			tabTargetShow(document.querySelector('[data-bs-target="'+core.getVars.hash+'"]'));
		}

		tabs.forEach(el => {
			el.addEventListener('shown.bs.tab', e => {
				if( !el.classList.contains('container-modules-loaded') ) {
					let tabContent = el.getAttribute('data-bs-target') ? el.getAttribute('data-bs-target') : el.getAttribute('href');
					core.runContainerModules( document.querySelector(tabContent) );
					document.querySelector(tabContent).querySelectorAll('.flexslider').forEach(flex => {
						setTimeout(() => {
							jQuery(flex).find('.slide').resize();
						}, 500 );
					});
					el.classList.add('container-modules-loaded');
				}
			});
		});

		document.querySelectorAll('.style-msg .btn-close').forEach( el => {
			el.onclick = e => {
				el.closest( '.style-msg' ).classList.add('d-none');
				e.preventDefault();
			};
		});
	});
};

SEMICOLON.Core.getVars.fn.carousel = selector => {
    const core = SEMICOLON.Core;
    //core.loadJS({ file: 'plugins.carousel.js', id: 'canvas-carousel-js', jsFolder: true });
    core.isFuncTrue( () => jQuery().owlCarousel ).then( cond => {
        if( !cond ) {
            return false;
        }

        core.initFunction({ class: 'has-plugin-carousel', event: 'pluginCarouselReady' });

        selector = core.getSelector( selector );
    	if( selector.length < 1 ){
    		return true;
    	}

    	selector.each( function(){
    		let element = jQuery(this),
    			elItems = element.attr('data-items') || 4,
    			elItemsXs = element.attr('data-items-xs') || Number( elItems ),
    			elItemsSm = element.attr('data-items-sm') || Number( elItemsXs ),
    			elItemsMd = element.attr('data-items-md') || Number( elItemsSm ),
    			elItemsLg = element.attr('data-items-lg') || Number( elItemsMd ),
    			elItemsXl = element.attr('data-items-xl') || Number( elItemsLg ),
    			elLoop = element.attr('data-loop'),
    			elAutoPlay = element.attr('data-autoplay'),
    			elSpeed = element.attr('data-speed') || 250,
    			elAnimateIn = element.attr('data-animate-in'),
                elAnimateOut = element.attr('data-animate-out'),
    			elAutoWidth = element.attr('data-auto-width'),
    			elNav = element.attr('data-nav'),
    			elNavPrev = element.attr('data-nav-prev') || '<i class="uil uil-angle-left-b"></i>',
    			elNavNext = element.attr('data-nav-next') || '<i class="uil uil-angle-right-b"></i>',
    			elPagi = element.attr('data-pagi'),
    			elMargin = element.attr('data-margin') || 20,
    			elStage = element.attr('data-stage-padding') || 0,
    			elMerge = element.attr('data-merge'),
    			elStart = element.attr('data-start') || 0,
    			elRewind = element.attr('data-rewind'),
    			elSlideBy = element.attr('data-slideby') || 1,
    			elCenter = element.attr('data-center'),
    			elLazy = element.attr('data-lazyload'),
    			elVideo = element.attr('data-video'),
    			elRTL = element.attr('data-rtl'),
    			elAutoPlayTime = 5000,
    			elAutoPlayHoverP = true;

    		if( elSlideBy == 'page' ) {
    			elSlideBy = 'page';
    		} else {
    			elSlideBy = Number(elSlideBy);
    		}

    		if( elLoop == 'true' ){ elLoop = true; } else { elLoop = false; }
    		if( !elAutoPlay ){
    			elAutoPlay = false;
    			elAutoPlayHoverP = false;
    		} else {
    			elAutoPlayTime = Number(elAutoPlay);
    			elAutoPlay = true;
    		}
    		if( !elAnimateIn ) { elAnimateIn = false; }
    		if( !elAnimateOut ) { elAnimateOut = false; }
    		if( elAutoWidth == 'true' ){ elAutoWidth = true; } else { elAutoWidth = false; }
            if( elNav == 'false' ){ elNav = false; } else { elNav = true; }
    		if( elPagi == 'false' ){ elPagi = false; } else { elPagi = true; }
    		if( elRewind == 'true' ){ elRewind = true; } else { elRewind = false; }
    		if( elMerge == 'true' ){ elMerge = true; } else { elMerge = false; }
    		if( elCenter == 'true' ){ elCenter = true; } else { elCenter = false; }
    		if( elLazy == 'true' ){ elLazy = true; } else { elLazy = false; }
    		if( elVideo == 'true' ){ elVideo = true; } else { elVideo = false; }
    		if( elRTL == 'true' || jQuery('body').hasClass('rtl') ){ elRTL = true; } else { elRTL = false; }

    		let carousel = element.owlCarousel({
    			margin: Number(elMargin),
    			loop: elLoop,
    			stagePadding: Number(elStage),
    			merge: elMerge,
    			startPosition: Number(elStart),
    			rewind: elRewind,
    			slideBy: elSlideBy,
    			center: elCenter,
    			lazyLoad: elLazy,
                autoWidth: elAutoWidth,
    			nav: elNav,
    			navText: [elNavPrev,elNavNext],
    			autoplay: elAutoPlay,
    			autoplayTimeout: elAutoPlayTime,
    			autoplayHoverPause: elAutoPlayHoverP,
    			dots: elPagi,
    			smartSpeed: Number(elSpeed),
    			fluidSpeed: Number(elSpeed),
    			video: elVideo,
    			animateIn: elAnimateIn,
    			animateOut: elAnimateOut,
    			rtl: elRTL,
    			responsive:{
    				0:{ items: elItemsXs },
    				576:{ items: elItemsSm },
    				768:{ items: elItemsMd },
    				992:{ items: elItemsLg },
    				1200:{ items: elItemsXl }
    			},
    			onInitialized: function(){
    				SEMICOLON.Base.sliderDimensions( element.parents('.slider-element')[0] );
    				SEMICOLON.Modules.lightbox();
    				SEMICOLON.Modules.hoverAnimations();
    				SEMICOLON.Modules.flexSlider();
    				SEMICOLON.Modules.counter();
    				SEMICOLON.Modules.progress();
    				SEMICOLON.Modules.resizeVideos();
    				if( element.find('.owl-dot').length > 0 ) {
    					element.addClass('with-carousel-dots');
    				}
    			}
    		});

    		jQuery(window).on( 'lazyLoadLoaded', function(){
    			if( element.find('.lazy').length == element.find('.lazy.lazy-loaded').length ) {
    				lazyLoadInstance.update();
    				setTimeout( function(){
    					carousel.trigger( 'refresh.owl.carousel' );
    				}, 500 );
    			}
    		});

    	});
    });
};

SEMICOLON.Core.getVars.fn.clipboard = selector => {
	const core = SEMICOLON.Core;
	//core.loadJS({ file: 'plugins.clipboard.js', id: 'canvas-clipboard-js', jsFolder: true });
    core.isFuncTrue( () => typeof ClipboardJS !== 'undefined' ).then( cond => {
        if( !cond ) {
            return false;
        }

		core.initFunction({ class: 'has-plugin-clipboard', event: 'pluginClipboardReady' });

		selector = core.getSelector( selector, false );
		if( selector.length < 1 ){
			return true;
		}

		let clipboards = [],
			count = 0;

		selector.forEach( el => {
			let trigger = el.querySelector('button'),
				triggerText = trigger.innerHTML,
				copiedtext = trigger.getAttribute('data-copied') || 'Copied',
				copiedTimeout = trigger.getAttribute('data-copied-timeout') || 5000;

			clipboards[count] = new ClipboardJS( trigger, {
				target: function(content) {
					return content.closest('.clipboard-copy').querySelector('code');
				}
			});

			clipboards[count].on('success', function(e) {
				trigger.innerHTML = copiedtext;
				trigger.disabled = true;

				setTimeout(() => {
					trigger.innerHTML = triggerText;
					trigger.disabled = false;
				}, Number(copiedTimeout));
			});

			count++;
		});
	});
};

SEMICOLON.Core.getVars.fn.codehighlight = selector => {
	const core = SEMICOLON.Core;
	core.loadCSS({ file: 'components/prism.css', id: 'canvas-prism-css', cssFolder: true });
	//core.loadJS({ file: 'plugins.prism.js', id: 'canvas-prism-js', jsFolder: true });
    core.isFuncTrue( () => typeof Prism !== 'undefined' ).then( cond => {
        if( !cond ) {
            return false;
        }

		core.initFunction({ class: 'has-plugin-codehighlight', event: 'pluginCodeHighlightReady' });

		selector = core.getSelector( selector, false );
		if( selector.length < 1 ){
			return true;
		}

		selector.forEach(el => {
			Prism.highlightElement( el.querySelector('code') );
		});
	});
};

SEMICOLON.Core.getVars.fn.conditional = selector => {
	const core = SEMICOLON.Core;
	core.initFunction({ class: 'has-plugin-conditional', event: 'pluginConditionalReady' });

	selector = core.getSelector( selector, false );
	if( selector.length < 1 ){
		return true;
	}

	selector.forEach( el => {
		let field = el,
			condition = field.getAttribute( 'data-condition' ) || '==',
			conditionTarget = field.getAttribute( 'data-condition-target' ),
			conditionValue = field.getAttribute( 'data-condition-value' ),
			conditionCheck = field.getAttribute( 'data-condition-check' ) || 'value',
			target = document.querySelector('[id*="'+conditionTarget+'"]'),
			value = target.value,
			targetType = target.type,
			eventType;

		let conditions = {
			operator: condition,
			field: conditionTarget,
			value: conditionValue
		}

		let targetTag = target.tagName.toLowerCase();

		// if( targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select' ) {
		// 	targetType = target.type || targetTag;
		// }

		if( targetType == 'checkbox' || targetTag == 'select' || targetType == 'radio' ) {
			eventType = 'change';
		} else {
			eventType = 'input';
		}

		if( targetType == 'checkbox' ) {
			value = target.checked ? target.value : 0;
		}

		if( targetType == 'radio' ) {
			value = target.checked ? target.value : '';
		}

		CanvasConditionsEval( field, value, conditions, conditionCheck, target );

		target.addEventListener( eventType, () => {
			if( targetType == 'checkbox' ) {
				value = target.checked ? target.value : 0;
			} else if( targetType == 'radio' ) {
				value = target.checked ? target.value : '';
			} else {
				value = target.value;
			}

			CanvasConditionsEval( field, value, conditions, conditionCheck, target );
		});

		if( conditionCheck == 'validate' ) {
			let mutationObserver = new MutationObserver(mutations => {
				mutations.forEach(mutation => {
					CanvasConditionsEval( field, value, conditions, conditionCheck, target );
				});
			});

			mutationObserver.observe( target, {
				attributes: true,
				characterData: true,
				childList: true,
				subtree: true,
				attributeOldValue: true,
				characterDataOldValue: true
			});
		}
	});
};

const CanvasConditionsEval = ( field, value, conditions, check, target ) => {
	if( ! field || ! conditions ) {
		return false;
	}

	let fulfilled = false;

	if( check == 'validate' ) {
		if( value ) {
			if ( target.getAttribute('aria-invalid') == 'false' ) {
				fulfilled = true;
			} else {
				fulfilled = false;
			}
		}
	} else {
		switch( conditions.operator ) {
			case '==':
				if( value == conditions.value ) {
					fulfilled = true;
				}
				break;

			case '!=':
				if( value != conditions.value ) {
					fulfilled = true;
				}
				break;

			case '>':
				if( value > conditions.value ) {
					fulfilled = true;
				}
				break;

			case '<':
				if( value < conditions.value ) {
					fulfilled = true;
				}
				break;

			case '<=':
				if( value <= conditions.value ) {
					fulfilled = true;
				}
				break;

			case '>=':
				if( value >= conditions.value ) {
					fulfilled = true;
				}
				break;

			case 'in':
				if( conditions.value.includes( value ) ) {
					fulfilled = true;
				}
				break;

			default:
				fulfilled = false;
				break;
		}
	}

	if( fulfilled ) {
		field.classList.add('condition-fulfilled');
		field.querySelectorAll('input,select,textarea,button').forEach(el => el.disabled = false);
	} else {
		field.classList.remove('condition-fulfilled');
		field.querySelectorAll('input,select,textarea,button').forEach(el => el.disabled = true);
	}
};

SEMICOLON.Core.getVars.fn.cookie = selector => {
	const core = SEMICOLON.Core;
	//core.loadJS({ file: 'plugins.cookie.js', id: 'canvas-cookie-js', jsFolder: true });
	core.isFuncTrue( () => typeof Cookies !== "undefined" ).then( cond => {
		if( !cond ) {
			return false;
		}

		core.initFunction({ class: 'has-plugin-cookie', event: 'pluginCookieReady' });

		selector = core.getSelector( selector, false );
		if( selector.length < 1 ){
			return true;
		}

		let cookieBar = document.querySelector('.gdpr-settings'),
			elSpeed = cookieBar?.getAttribute('data-speed') || 300,
			elExpire = cookieBar?.getAttribute('data-expire') || 30,
			elDelay = cookieBar?.getAttribute('data-delay') || 1500,
			elPersist = cookieBar?.getAttribute('data-persistent'),
			elDirection = 'bottom',
			elHeight = cookieBar?.offsetHeight + 100,
			elWidth = cookieBar?.offsetWidth + 100,
			elSize,
			elSettings = document.querySelector('.gdpr-cookie-settings'),
			elSwitches = elSettings?.querySelectorAll('[data-cookie-name]');

		if( !cookieBar && !elSettings ) {
			return true;
		}

		if( cookieBar ) {
			if( elPersist == 'true' ) {
				Cookies.set('websiteUsesCookies', '');
			}

			if( cookieBar?.classList.contains('gdpr-settings-sm') && cookieBar?.classList.contains('gdpr-settings-right') ) {
				elDirection = 'right';
			} else if( cookieBar?.classList.contains('gdpr-settings-sm') ) {
				elDirection = 'left';
			}

			if( elDirection == 'left' ) {
				elSize = -elWidth;
				cookieBar.style.right = 'auto';
				cookieBar.style.marginLeft = '1rem';
			} else if( elDirection == 'right' ) {
				elSize = -elWidth;
				cookieBar.style.left = 'auto';
				cookieBar.style.marginRight = '1rem';
			} else {
				elSize = -elHeight;
			}

			cookieBar.style[elDirection] = elSize + 'px';

			if( Cookies.get('websiteUsesCookies') != 'yesConfirmed' ) {
				setTimeout(() => {
					cookieBar.style[elDirection] = 0;
					cookieBar.style.opacity = 1;
				}, Number( elDelay ) );
			}

			document.querySelector('.gdpr-accept').onclick = e => {
				e.preventDefault();
				cookieBar.style[elDirection] = elSize + 'px';
				cookieBar.style.opacity = 0;
				Cookies.set('websiteUsesCookies', 'yesConfirmed', { expires: Number( elExpire ) });
			};
		}

		elSwitches.forEach( el => {
			let elCookie = el.getAttribute( 'data-cookie-name' ),
				getCookie = Cookies.get( elCookie );

			if( typeof getCookie !== 'undefined' && getCookie == '1' ) {
				el.checked = true;
			} else {
				el.checked = false;
			}
		});

		document.querySelector('.gdpr-save-cookies').onclick = e => {
			e.preventDefault();
			elSwitches.forEach( el => {
				let elCookie = el.getAttribute( 'data-cookie-name' );

				if( el.checked == true ) {
					Cookies.set( elCookie, '1', { expires: Number( elExpire ) });
				} else {
					Cookies.remove( elCookie, '' );
				}
			});

			if( elSettings.closest( '.mfp-content' ).length > 0 ) {
				$.magnificPopup.close();
			}

			setTimeout(() => {
				window.location.reload();
			}, 500);
		};

		document.querySelectorAll('.gdpr-container').forEach( element => {
			let elCookie = element.getAttribute('data-cookie-name'),
				elContent = element.getAttribute('data-cookie-content'),
				elContentAjax = element.getAttribute('data-cookie-content-ajax'),
				getCookie = Cookies.get( elCookie );

			if( typeof getCookie !== 'undefined' && getCookie == '1' ) {
				element.classList.add('gdpr-content-active');
				if( elContentAjax ) {
					fetch( elContentAjax ).then( response => {
						return response.text();
					}).then( html => {
						let domParser = new DOMParser();
						let parsedHTML = domParser.parseFromString(html, 'text/html');

						element?.insertAdjacentHTML('beforeend', parsedHTML.body.innerHTML);
					}).catch( err => {
						console.log(err);
					});
				} else {
					if( elContent ) {
						element.innerHTML += elContent;
					}
				}
				core.runContainerModules( element );
			} else {
				element.classList.add('gdpr-content-blocked');
			}
		});
	});
};

SEMICOLON.Core.getVars.fn.countdown = selector => {
	const core = SEMICOLON.Core;
	//core.loadJS({ file: 'plugins.countdown.js', id: 'canvas-countdown-js', jsFolder: true });
	core.loadJS({ file: 'components/moment.js', id: 'canvas-moment-js', jsFolder: true });
	core.isFuncTrue( () => typeof moment !== "undefined" && jQuery().countdown ).then( cond => {
		if( !cond ) {
			return false;
		}

		core.initFunction({ class: 'has-plugin-countdown', event: 'pluginCountdownReady' });

		selector = core.getSelector( selector );
		if( selector.length < 1 ){
			return true;
		}

		selector.each(function(){
			let element = jQuery(this),
				elFormat = element.attr( 'data-format' ) || 'dHMS',
				elSince = element.attr( 'data-since' ),
				elYear = element.attr( 'data-year' ),
				elMonth = element.attr( 'data-month' ),
				elDay = element.attr( 'data-day' ),
				elHour = element.attr( 'data-hour' ),
				elMin = element.attr( 'data-minute' ),
				elSec = element.attr( 'data-second' ),
				elRedirect = element.attr( 'data-redirect' ),
				dateFormat, setDate;

			if( elYear ){
				dateFormat = elYear;
			}

			if( elMonth && elMonth < 13 ){
				dateFormat = dateFormat +"-"+ ( elMonth < 10 ? '0'+elMonth : elMonth);
			} else {
				if( elYear ) {
					dateFormat = dateFormat +"-01";
				}
			}

			if( elDay && elDay < 32 ){
				dateFormat = dateFormat +"-"+ ( elDay < 10 ? '0'+elDay : elDay);
			} else {
				if( elYear ) {
					dateFormat = dateFormat +"-01";
				}
			}

			setDate = dateFormat != '' ? new Date( moment( dateFormat ) ) : new Date();

			if( elHour && elHour < 25 ){
				setDate.setHours( setDate.getHours() + Number( elHour ) );
			}

			if( elMin && elMin < 60 ){
				setDate.setMinutes( setDate.getMinutes() + Number( elMin ) );
			}

			if( elSec && elSec < 60 ){
				setDate.setSeconds( setDate.getSeconds() + Number( elSec ) );
			}

			if( !elRedirect ) {
				elRedirect = false;
			}

			if( elSince == 'true' ) {
				element.countdown({
					since: setDate,
					format: elFormat,
					expiryUrl: elRedirect,
				});
			} else {
				element.countdown({
					until: setDate,
					format: elFormat,
					expiryUrl: elRedirect,
				});
			}

		});
	});
};

SEMICOLON.Core.getVars.fn.counter = selector => {
	const core = SEMICOLON.Core;
	//core.loadJS({ file: 'plugins.counter.js', id: 'canvas-counter-js', jsFolder: true });
	core.isFuncTrue( () => jQuery().countTo ).then( cond => {
		if( !cond ) {
			return false;
		}

		core.initFunction({ class: 'has-plugin-counter', event: 'pluginCounterReady' });

		selector = core.getSelector( selector );
		if( selector.length < 1 ){
			return true;
		}

		selector.each(function(){
			let element = jQuery(this),
				elComma = element.find('span').attr('data-comma'),
				elSep = element.find('span').attr('data-sep') || ',',
				elPlaces = element.find('span').attr('data-places') || 3;

			let elCommaObj = {
				comma: elComma,
				sep: elSep,
				places: Number( elPlaces )
			}

			if( element.hasClass('counter-instant') ) {
				CanvasRunCounter( element, elCommaObj );
				return;
			}

			let observer = new IntersectionObserver( (entries, observer) => {
				entries.forEach( entry => {
					if (entry.isIntersecting) {
						CanvasRunCounter( element, elCommaObj );
						observer.unobserve( entry.target );
					}
				});
			}, {rootMargin: '-50px'});
			observer.observe( element[0] );
		});
	});
};

const CanvasRunCounter = ( elCounter, elFormat ) => {
	if( elFormat.comma == 'true' ) {

		let reFormat = '\\B(?=(\\d{'+ elFormat.places +'})+(?!\\d))',
			regExp = new RegExp( reFormat, "g" );

		elCounter.find('span').countTo({
			formatter: (value, options) => {
				value = value.toFixed( options.decimals );
				value = value.replace( regExp, elFormat.sep );
				return value;
			}
		});
	} else {
		elCounter.find('span').countTo();
	}
};

SEMICOLON.Core.getVars.fn.cursor = selector => {
	const core = SEMICOLON.Core;
	core.initFunction({ class: 'has-plugin-cursor', event: 'pluginCursorReady' });

	let cursor = document.querySelector('.cnvs-cursor');
	let cursorFollower = document.querySelector('.cnvs-cursor-follower');
	let cursorDot = document.querySelector('.cnvs-cursor-dot');

	const addCursorEl = (selector, parent) => {
		let el = document.createElement('div');
		el.classList.add(selector.split('.')[1]);

		parent.prepend( el );
		return document.querySelector(selector);
	};

	if( !cursor ) {
		cursor = addCursorEl('.cnvs-cursor', core.getVars.elWrapper);
	}

	if( !cursorFollower ) {
		cursorFollower = addCursorEl('.cnvs-cursor-follower', cursor);
	}

	if( !cursorDot ) {
		cursorDot = addCursorEl('.cnvs-cursor-dot', cursor);
	}

	const onMouseMove = event => {
		cursor.style.transform = "translate3d("+ event.clientX + 'px'+","+event.clientY+'px'+",0px)";
	}

	document.addEventListener('mousemove', onMouseMove);

	document.querySelectorAll('a,button').forEach( el => {
		el.addEventListener('mouseenter', () => {
			cursor.classList.add('cnvs-cursor-action');
		});

		el.addEventListener('mouseleave', () => {
			cursor.classList.remove('cnvs-cursor-action');
		});
	});
};

SEMICOLON.Core.getVars.fn.dataclasses = selector => {
	const core = SEMICOLON.Core;
	core.initFunction({ class: 'has-plugin-dataclasses', event: 'pluginDataClassesReady' });

	selector = core.getSelector( selector, false, false );
	if( selector.length < 1 ){
		return true;
	}

	selector.forEach(el => {
		let classes = el.getAttribute('data-class');

		classes = classes.split(/ +/);
		if( classes.length > 0 ) {
			classes.forEach(_class => {
				let deviceClass = _class.split(":");
				if( core.getVars.elBody.classList.contains(deviceClass[0] == 'dark' ? deviceClass[0] : 'device-' + deviceClass[0]) ) {
					el.classList.add(deviceClass[1]);
				} else {
					el.classList.remove(deviceClass[1]);
				}
			});
		}
	});

	core.getVars.resizers.dataClasses = () => SEMICOLON.Modules.dataClasses();
};

SEMICOLON.Core.getVars.fn.dataheights = selector => {
	const core = SEMICOLON.Core;
	core.initFunction({ class: 'has-plugin-dataheights', event: 'pluginDataHeightsReady' });

	selector = core.getSelector( selector, false, false );
	if( selector.length < 1 ){
		return true;
	}

	selector.forEach(el => {
		let heightXs = el.getAttribute('data-height-xs') || 'auto',
			heightSm = el.getAttribute('data-height-sm') || heightXs,
			heightMd = el.getAttribute('data-height-md') || heightSm,
			heightLg = el.getAttribute('data-height-lg') || heightMd,
			heightXl = el.getAttribute('data-height-xl') || heightLg,
			heightXxl = el.getAttribute('data-height-xxl') || heightXl,
			body = core.getVars.elBody.classList,
			elHeight;

		if( body.contains('device-xs') ) {
			elHeight = heightXs;
		} else if( body.contains('device-sm') ) {
			elHeight = heightSm;
		} else if( body.contains('device-md') ) {
			elHeight = heightMd;
		} else if( body.contains('device-lg') ) {
			elHeight = heightLg;
		} else if( body.contains('device-xl') ) {
			elHeight = heightXl;
		} else if( body.contains('device-xxl') ) {
			elHeight = heightXxl;
		}

		if( elHeight ) {
			el.style.height = !isNaN( elHeight ) ? elHeight + 'px' : elHeight;
		}
	});

	core.getVars.resizers.dataHeights = () => SEMICOLON.Modules.dataHeights();
};

SEMICOLON.Core.getVars.fn.easing = selector => {
	const core = SEMICOLON.Core;
	//core.loadJS({ file: 'plugins.easing.js', id: 'canvas-easing-js', jsFolder: true });
	core.isFuncTrue( () => typeof jQuery !== 'undefined' && typeof jQuery.easing["easeOutQuad"] !== 'undefined' ).then( cond => {
		if( !cond ) {
			return false;
		}

		SEMICOLON.Core.initFunction({ class: 'has-plugin-easing', event: 'pluginEasingReady' });
	});
};

SEMICOLON.Core.getVars.fn.fitvids = selector => {
	const core = SEMICOLON.Core;
	//core.loadJS({ file: 'plugins.fitvids.js', id: 'canvas-fitvids-js', jsFolder: true });
	core.isFuncTrue( () => jQuery().fitVids ).then( cond => {
		if( !cond ) {
			return false;
		}

		core.initFunction({ class: 'has-plugin-fitvids', event: 'pluginFitVidsReady' });

		selector = core.getSelector( selector );
		if( selector.length < 1 ){
			return true;
		}

		selector.parent().fitVids({
			customSelector: 'iframe[src*="youtube"],iframe[src*="vimeo"],iframe[src*="dailymotion"],iframe[src*="maps.google.com"],iframe[src*="google.com/maps"]',
			ignore: '.no-fv'
		});
	});
};

SEMICOLON.Core.getVars.fn.flexslider = selector => {
    const core = SEMICOLON.Core;
    //core.loadJS({ file: 'plugins.flexslider.js', id: 'canvas-flexslider-js', jsFolder: true });
    core.isFuncTrue( () => jQuery().flexslider ).then( cond => {
        if( !cond ) {
            return false;
        }

        core.initFunction({ class: 'has-plugin-flexslider', event: 'pluginFlexSliderReady' });

    	selector = core.getSelector( selector );
    	if( selector.length < 1 ){
    		return true;
    	}

    	selector.each(function() {
    		let element = jQuery(this),
    			elLazy = element.find('.lazy'),
    			elAnimation = element.attr('data-animation') || 'slide',
    			elEasing = element.attr('data-easing') || 'swing',
    			elDirection = element.attr('data-direction') || 'horizontal',
    			elReverse = element.attr('data-reverse'),
    			elSlideshow = element.attr('data-slideshow'),
    			elPause = element.attr('data-pause') || 5000,
    			elSpeed = element.attr('data-speed') || 600,
    			elVideo = element.attr('data-video'),
    			elPagi = element.attr('data-pagi'),
    			elArrows = element.attr('data-arrows'),
    			elArrowLeft = element.attr('data-arrow-left') || 'uil uil-angle-left-b',
    			elArrowRight = element.attr('data-arrow-right') || 'uil uil-angle-right-b',
    			elThumbs = element.attr('data-thumbs'),
    			elHover = element.attr('data-hover'),
    			elSheight = element.attr('data-smooth-height'),
    			elTouch = element.attr('data-touch'),
    			elUseCSS = false;

    		if( elEasing == 'swing' ) {
    			elEasing = 'swing';
    			elUseCSS = true;
    		}
    		if( elReverse == 'true' ) { elReverse = true; } else { elReverse = false; }
    		if( elSlideshow == "false" ) { elSlideshow = false; } else { elSlideshow = true; }
    		if( !elVideo ) { elVideo = false; }
    		if( elSheight == 'false' ) { elSheight = false; } else { elSheight = true; }
    		if( elDirection == 'vertical' ) { elSheight = false; }
    		if( elPagi == 'false' ) { elPagi = false; } else { elPagi = true; }
    		if( elThumbs == 'true' ) { elPagi = 'thumbnails'; } else { elPagi = elPagi; }
    		if( elArrows == 'false' ) { elArrows = false; } else { elArrows = true; }
    		if( elHover == 'false' ) { elHover = false; } else { elHover = true; }
    		if( elTouch == 'false' ) { elTouch = false; } else { elTouch = true; }

    		element.find('.flexslider').flexslider({
    			selector: ".slider-wrap > .slide",
    			animation: elAnimation,
    			easing: elEasing,
    			direction: elDirection,
    			reverse: elReverse,
    			slideshow: elSlideshow,
    			slideshowSpeed: Number(elPause),
    			animationSpeed: Number(elSpeed),
    			pauseOnHover: elHover,
    			video: elVideo,
    			controlNav: elPagi,
    			directionNav: elArrows,
    			smoothHeight: elSheight,
    			useCSS: elUseCSS,
    			touch: elTouch,
    			start: function( slider ){
    				SEMICOLON.Modules.animations();
    				SEMICOLON.Modules.lightbox();
    				jQuery('.flex-prev').html('<i class="'+ elArrowLeft +'"></i>');
    				jQuery('.flex-next').html('<i class="'+ elArrowRight +'"></i>');
    				setTimeout( function(){
    					if( slider.parents( '.grid-container.has-init-isotope' ).length > 0 ) {
    						slider.parents( '.grid-container.has-init-isotope' ).isotope('layout');
    					}
    				}, 1200 );
    				if( typeof skrollrInstance !== "undefined" ) {
    					skrollrInstance.refresh();
    				}
    			},
    			after: function( slider ){
    				if( slider.parents( '.grid-container.has-init-isotope' ).length > 0 ) {
    					slider.parents( '.grid-container.has-init-isotope' ).isotope('layout');
    				}
    				jQuery('.menu-item:visible').find( '.flexslider .slide' ).resize();
    			}
    		});

    		// jQuery(window).on( 'lazyLoadLoaded', function(){
    		// 	if( elLazy.length == element.find('.lazy.lazy-loaded').length ) {
    		// 		lazyLoadInstance.update();
    		// 		setTimeout(() => {
    		// 			element.find('.flexslider .slide').resize();
    		// 		}, 500 );
    		// 	}
    		// });

    	});
    });
};

SEMICOLON.Core.getVars.fn.flickrfeed = selector => {
	const core = SEMICOLON.Core;
	//core.loadJS({ file: 'plugins.flickrfeed.js', id: 'canvas-flickrfeed-js', jsFolder: true });
	core.isFuncTrue( () => jQuery().jflickrfeed ).then( cond => {
		if( !cond ) {
			return false;
		}

		core.initFunction({ class: 'has-plugin-flickr', event: 'pluginFlickrFeedReady' });

		selector = core.getSelector( selector, true, false );
		if( selector.length < 1 ){
			return true;
		}

		selector.each(function() {
			let element = jQuery(this),
				elID = element.attr('data-id'),
				elCount = element.attr('data-count') || 9,
				elType = element.attr('data-type'),
				elTypeGet = 'photos_public.gne';

			if( elType == 'group' ) { elTypeGet = 'groups_pool.gne'; }

			element.jflickrfeed({
				feedapi: elTypeGet,
				limit: Number(elCount),
				qstrings: {
					id: elID
				},
				itemTemplate: '<a class="grid-item" href="{{image_b}}" title="{{title}}" data-lightbox="gallery-item">' +
									'<img src="{{image_s}}" alt="{{title}}" />' +
							  '</a>'
			}, function(data) {
				SEMICOLON.Core.imagesLoaded(element[0]);
				SEMICOLON.Modules.lightbox();

				element[0].addEventListener( 'CanvasImagesLoaded', function() {
					element.removeClass('customjs');
					SEMICOLON.Modules.gridInit();
					SEMICOLON.Modules.masonryThumbs();
				});
			});
		});
	});
};

SEMICOLON.Core.getVars.fn.gmap = selector => {
	const core = SEMICOLON.Core;

	if( !core.getOptions.gmapAPI ) {
		console.warn( 'No API Key defined for Google Maps! Please set an API Key in js/functions.js File!' );
		return true;
	}

	core.loadJS({ file: 'https://maps.google.com/maps/api/js?key='+core.getOptions.gmapAPI, id: 'canvas-gmapapi-js' });
	//core.loadJS({ file: 'plugins.gmap.js', id: 'canvas-gmap-js', jsFolder: true });
	core.isFuncTrue( () => typeof google !== "undefined" && jQuery().gMap ).then( cond => {
		if( !cond ) {
			return false;
		}

		core.initFunction({ class: 'has-plugin-gmap', event: 'pluginGmapReady' });

		selector = core.getSelector( selector );
		if( selector.length < 1 ){
			return true;
		}

		selector.each( function(){
			let element = jQuery(this),
				elLat = element.attr( 'data-latitude' ),
				elLon = element.attr( 'data-longitude' ),
				elAdd = element.attr( 'data-address' ),
				elCon = element.attr( 'data-content' ),
				elScroll = element.attr( 'data-scrollwheel' ) || true,
				elType = element.attr( 'data-maptype' ) || 'ROADMAP',
				elZoom = element.attr( 'data-zoom' ) || 12,
				elStyles = element.attr( 'data-styles' ),
				elMarkers = element.attr( 'data-markers' ),
				elIcon = element.attr( 'data-icon' ),
				elConPan = element.attr( 'data-control-pan' ) || false,
				elConZoom = element.attr( 'data-control-zoom' )|| false,
				elConMapT = element.attr( 'data-control-maptype' )|| false,
				elConScale = element.attr( 'data-control-scale' )|| false,
				elConStreetV = element.attr( 'data-control-streetview' )|| false,
				elConOverview = element.attr( 'data-control-overview' )|| false;

			if( elAdd ) {
				elLat = elLon = false;
			} else {
				if( !elLat && !elLon ) {
					console.log( 'Google Map co-ordinates not entered.' );
					return true;
				}
			}

			if( elStyles ) { elStyles = JSON.parse( elStyles ); }
			if( elScroll == 'false' ) { elScroll = false; }
			if( elConPan == 'true' ) { elConPan = true; }
			if( elConZoom == 'true' ) { elConZoom = true; }
			if( elConMapT == 'true' ) { elConMapT = true; }
			if( elConScale == 'true' ) { elConScale = true; }
			if( elConStreetV == 'true' ) { elConStreetV = true; }
			if( elConOverview == 'true' ) { elConOverview = true; }

			if( elMarkers ) {
				elMarkers = Function( 'return ' + elMarkers )();
			} else {
				if( elAdd ) {
					elMarkers = [
						{
							address: elAdd,
							html: elCon ? elCon : elAdd
						}
					]
				} else {
					elMarkers = [
						{
							latitude: elLat,
							longitude: elLon,
							html: elCon ? elCon : false
						}
					]
				}
			}

			if( elIcon ) {
				elIcon = Function( 'return ' + elIcon )();
			} else {
				elIcon = {
					image: "https://www.google.com/mapfiles/marker.png",
					shadow: "https://www.google.com/mapfiles/shadow50.png",
					iconsize: [20, 34],
					shadowsize: [37, 34],
					iconanchor: [9, 34],
					shadowanchor: [19, 34]
				};
			}

			element.gMap({
				controls: {
					panControl: elConPan,
					zoomControl: elConZoom,
					mapTypeControl: elConMapT,
					scaleControl: elConScale,
					streetViewControl: elConStreetV,
					overviewMapControl: elConOverview
				},
				scrollwheel: elScroll,
				maptype: elType,
				markers: elMarkers,
				icon: elIcon,
				latitude: elLat,
				longitude: elLon,
				address: elAdd,
				zoom: Number( elZoom ),
				styles: elStyles
			});


		});
	});
};

SEMICOLON.Core.getVars.fn.gototop = selector => {
	const core = SEMICOLON.Core;
	selector = core.getSelector( selector, false );
	if( selector.length < 1 ){
		return true;
	}

	CanvasGoToTop( selector[0] );
	CanvasGoToTopScroll( selector[0] );

	window.addEventListener( 'scroll', () =>  {
		CanvasGoToTopScroll( selector[0] );
	}, { passive: true });
};

const CanvasGoToTop = element => {
	const core = SEMICOLON.Core;

	let elSpeed = element.getAttribute('data-speed') || 700,
		elEasing = element.getAttribute('data-easing');

	element.onclick = e => {
		if( elEasing ) {
			jQuery('body,html').stop(true).animate({
				'scrollTop': 0
			}, Number( elSpeed ), elEasing );
		} else {
			window.scrollTo({
				top: 0,
				behavior: 'smooth'
			});
		}

		e.preventDefault();
	};
};

const CanvasGoToTopScroll = element => {
	const core = SEMICOLON.Core;
	let body = core.getVars.elBody.classList;

	let elMobile = element.getAttribute('data-mobile') || 'false',
		elOffset = element.getAttribute('data-offset') || 450;

	if( elMobile == 'false' && ( body.contains('device-xs') || body.contains('device-sm') || body.contains('device-md') ) ) {
		return true;
	}

	if( window.scrollY > Number(elOffset) ) {
		body.add('gototop-active');
	} else {
		body.remove('gototop-active');
	}
};


SEMICOLON.Core.getVars.fn.gridfilter = selector => {
	const core = SEMICOLON.Core;
	core.isFuncTrue( () => typeof Isotope !== 'undefined' ).then( cond => {
		if( !cond ) {
			return false;
		}

		core.initFunction({ class: 'has-plugin-isotope-filter', event: 'pluginGridFilterReady' });

		selector = core.getSelector( selector );
		if( selector.length < 1 ){
			return true;
		}

		selector.each( function(){
			let element = jQuery(this),
				elCon = element.attr('data-container'),
				elActClass = element.attr('data-active-class'),
				elDefFilter = element.attr('data-default');

			if( !elActClass ) {
				elActClass = 'activeFilter';
			}

			if( !jQuery(elCon).hasClass('grid-container') ) {
				return false;
			}

			element.find('a').off( 'click' ).on( 'click', function(){
				element.find('li').removeClass( elActClass );
				jQuery(this).parent('li').addClass( elActClass );
				let selector = jQuery(this).attr('data-filter');
				jQuery(elCon).isotope({ filter: selector });
				return false;
			});

			if( elDefFilter ) {
				element.find('li').removeClass( elActClass );
				element.find('[data-filter="'+ elDefFilter +'"]').parent('li').addClass( elActClass );
				jQuery(elCon).isotope({ filter: elDefFilter });
			}

			jQuery(elCon).on( 'arrangeComplete layoutComplete', function(event, filteredItems) {
				jQuery(elCon).addClass('grid-container-filterable');
				if( jQuery(elCon).attr('data-lightbox') == 'gallery' ) {
					jQuery(elCon).find("[data-lightbox]").removeClass('grid-lightbox-filtered');
					filteredItems.forEach(item => jQuery(item.element).find("[data-lightbox]").addClass('grid-lightbox-filtered'));
				}
				SEMICOLON.Modules.lightbox();
			});
		});

		jQuery('.grid-shuffle').off( 'click' ).on( 'click', function(){
			let element = jQuery(this),
				elCon = element.attr('data-container');

			if( !jQuery(elCon).hasClass('grid-container') ) {
				return false;
			}

			jQuery(elCon).isotope('shuffle');
		});
	});
};

SEMICOLON.Core.getVars.fn.headers = selector => {
	const core = SEMICOLON.Core;
	selector = core.getSelector( selector, false );
	if( selector.length < 1 ){
		return true;
	}

	let elHeader = core.getVars.elHeader;
	let isSticky = elHeader.classList.contains('no-sticky') ? false : true;
	let headerWrapClone = elHeader.querySelector('.header-wrap-clone');

	core.getVars.stickyHeaderClasses = elHeader.getAttribute('data-sticky-class');
	core.getVars.mobileHeaderClasses = elHeader.getAttribute('data-responsive-class');
	core.getVars.stickyShrink = elHeader.getAttribute('data-sticky-shrink') || 'true';
	core.getVars.stickyShrinkOffset = elHeader.getAttribute('data-sticky-shrink-offset') || 300;
	core.getVars.mobileSticky = elHeader.getAttribute('data-mobile-sticky') || 'false';
	core.getVars.headerHeight = elHeader.offsetHeight;

	if( !headerWrapClone ) {
		headerWrapClone = document.createElement('div');
		headerWrapClone.classList = 'header-wrap-clone';

		core.getVars.elHeaderWrap?.parentNode.insertBefore( headerWrapClone, core.getVars.elHeaderWrap?.nextSibling);
		headerWrapClone = elHeader.querySelector('.header-wrap-clone');
	}

	if( isSticky ) {
		setTimeout(() => {
			CanvasHeaderOffset();
			CanvasStickyMenu( core.getVars.headerWrapOffset );
			CanvasChangeMenuClass('sticky');
		}, 500);

		window.addEventListener( 'scroll', function(){
			CanvasStickyMenu( core.getVars.headerWrapOffset );
		}, { passive: true });
	}

	CanvasChangeMenuClass('responsive');
	CanvasIncludeHeader();
	CanvasSideHeader();

	core.getVars.resizers.headers = () => {
		setTimeout( () => {
			CanvasRemoveStickyness();
			if( isSticky ) {
				CanvasHeaderOffset();
				CanvasStickyMenu( core.getVars.headerWrapOffset );
				CanvasChangeMenuClass('sticky');
			}
			CanvasChangeMenuClass('responsive');
			CanvasIncludeHeader();
		}, 250);
	};
};

const CanvasHeaderOffset = () => {
	const core = SEMICOLON.Core;
	let elHeader = core.getVars.elHeader;
	let elHeaderInc = document.querySelector('.include-header');

	core.getVars.headerOffset = elHeader.offsetTop;
	if( core.getVars.elHeader?.classList.contains('floating-header') || elHeaderInc?.classList.contains('include-topbar') ) {
		core.getVars.headerOffset = core.offset(elHeader).top;
	}
	core.getVars.elHeaderWrap?.classList.add('position-absolute');
	core.getVars.headerWrapOffset = core.getVars.headerOffset + core.getVars.elHeaderWrap?.offsetTop;
	core.getVars.elHeaderWrap?.classList.remove('position-absolute');

	if( elHeader.hasAttribute('data-sticky-offset') ) {
		let headerDefinedOffset = elHeader.getAttribute('data-sticky-offset');
		if( headerDefinedOffset == 'full' ) {
			core.getVars.headerWrapOffset = core.viewport().height;
			let headerOffsetNegative = elHeader.getAttribute('data-sticky-offset-negative');
			if( typeof headerOffsetNegative !== 'undefined' ) {
				if( headerOffsetNegative == 'auto' ) {
					core.getVars.headerWrapOffset = core.getVars.headerWrapOffset - elHeader.offsetHeight - 1;
				} else {
					core.getVars.headerWrapOffset = core.getVars.headerWrapOffset - Number(headerOffsetNegative) - 1;
				}
			}
		} else {
			core.getVars.headerWrapOffset = Number(headerDefinedOffset);
		}
	}
};

const CanvasStickyMenu = stickyOffset => {
	const core = SEMICOLON.Core;

	if( !core.getVars.elBody.classList.contains('is-expanded-menu') && core.getVars.mobileSticky != 'true' ) {
		return true;
	}

	if( window.pageYOffset > stickyOffset ) {
		if( !core.getVars.elBody.classList.contains('side-header') ) {
			core.getVars.elHeader.classList.add('sticky-header');
			CanvasChangeMenuClass('sticky');

			if( core.getVars.elBody.classList.contains('is-expanded-menu') && core.getVars.stickyShrink == 'true' && !core.getVars.elHeader.classList.contains('no-sticky') ) {
				if( ( window.pageYOffset - stickyOffset ) > Number( core.getVars.stickyShrinkOffset ) ) {
					core.getVars.elHeader.classList.add('sticky-header-shrink');
				} else {
					core.getVars.elHeader.classList.remove('sticky-header-shrink');
				}
			}
		}
	} else {
		CanvasRemoveStickyness();
		if( core.getVars.mobileSticky == 'true' ) {
			CanvasChangeMenuClass('responsive');
		}
	}
};

const CanvasRemoveStickyness = () => {
	const core = SEMICOLON.Core;

	core.getVars.elHeader.className = core.getVars.headerClasses;
	core.getVars.elHeader.classList.remove('sticky-header', 'sticky-header-shrink');

	if( core.getVars.elHeaderWrap ) {
		core.getVars.elHeaderWrap.className = core.getVars.headerWrapClasses;
	}
	if( !core.getVars.elHeaderWrap?.classList.contains('force-not-dark') ) {
		core.getVars.elHeaderWrap?.classList.remove('not-dark');
	}

	SEMICOLON.Base.sliderMenuClass();
};

const CanvasChangeMenuClass = type => {
	const core = SEMICOLON.Core;
	let newClassesArray = '';

	if( 'responsive' == type ) {
		if( core.getVars.elBody.classList.contains('device-up-lg') ){
			return true;
		}

		if( core.getVars.mobileHeaderClasses ) {
			newClassesArray = core.getVars.mobileHeaderClasses.split(/ +/);
		}
	} else {
		if( !core.getVars.elHeader.classList.contains('sticky-header') ){
			return true;
		}

		if( core.getVars.stickyHeaderClasses ) {
			newClassesArray = core.getVars.stickyHeaderClasses.split(/ +/);
		}
	}

	let noOfNewClasses = newClassesArray.length;

	if( noOfNewClasses > 0 ) {
		let i = 0;
		for( i=0; i<noOfNewClasses; i++ ) {
			if( newClassesArray[i] == 'not-dark' ) {
				core.getVars.elHeader.classList.remove('dark');
				if( !core.getVars.elHeaderWrap?.classList.contains('.not-dark') ) {
					core.getVars.elHeaderWrap?.classList.add('not-dark');
				}
			} else if( newClassesArray[i] == 'dark' ) {
				core.getVars.elHeaderWrap?.classList.remove('not-dark force-not-dark');
				if( !core.getVars.elHeader.classList.contains( newClassesArray[i] ) ) {
					core.getVars.elHeader.classList.add( newClassesArray[i] );
				}
			} else if( !core.getVars.elHeader.classList.contains( newClassesArray[i] ) ) {
				core.getVars.elHeader.classList.add( newClassesArray[i] );
			}
		}
	}

	SEMICOLON.Base.setBSTheme();
};

const CanvasIncludeHeader = () => {
	const core = SEMICOLON.Core;
	let elHeaderInc = document.querySelector('.include-header');

	if( !elHeaderInc ) {
		return true;
	}

	elHeaderInc.style.marginTop = '';

	if( !core.getVars.elBody.classList.contains('is-expanded-menu') ) {
		return true;
	}

	if( core.getVars.elHeader.classList.contains('floating-header') || elHeaderInc.classList.contains('include-topbar') ) {
		core.getVars.headerHeight = core.getVars.elHeader.offsetHeight + core.offset(core.getVars.elHeader).top;
	}

	elHeaderInc.style.marginTop = (core.getVars.headerHeight * -1) + 'px';
	SEMICOLON.Modules.sliderParallax();
}

const CanvasSideHeader = () => {
	let headerTrigger = document.getElementById("header-trigger");
	if( headerTrigger ) {
		headerTrigger.onclick = e => {
			SEMICOLON.Core.getVars.elBody.classList.contains('open-header') && SEMICOLON.Core.getVars.elBody.classList.toggle("side-header-open");
			e.preventDefault();
		};
	}
};

SEMICOLON.Core.getVars.fn.hoveranimation = selector => {
	const core = SEMICOLON.Core;
	core.initFunction({ class: 'has-plugin-hoveranimation', event: 'pluginHoverAnimationReady' });

	selector = core.getSelector( selector, false );
	if( selector.length < 1 ){
		return true;
	}

	selector.forEach( element => {
		let elAnimate = element.getAttribute( 'data-hover-animate' ),
			elAnimateOut = element.getAttribute( 'data-hover-animate-out' ) || 'fadeOut',
			elSpeed = element.getAttribute( 'data-hover-speed' ) || 600,
			elDelay = element.getAttribute( 'data-hover-delay' ),
			elParent = element.getAttribute( 'data-hover-parent' ),
			elReset = element.getAttribute( 'data-hover-reset' ) || 'false',
			elMobile = element.getAttribute( 'data-hover-mobile' ) || 'true';

		if( elMobile != 'true' ) {
			if( elMobile == 'false' ) {
				if( !core.getVars.elBody.classList.contains('device-up-lg') ) {
					return true;
				}
			} else {
				if( !core.getVars.elBody.classList.contains('device-up-' + elMobile) ) {
					return true;
				}
			}
		}

		element.classList.add( 'not-animated' );

		if( !elParent ) {
			if( element.closest( '.bg-overlay' ) ) {
				elParent = element.closest( '.bg-overlay' );
			} else {
				elParent = element;
			}
		} else {
			if( elParent == 'self' ) {
				elParent = element;
			} else {
				elParent = element.closest( elParent );
			}
		}

		let elDelayT = 0;

		if( elDelay ) {
			elDelayT = Number( elDelay );
		}

		if( elSpeed ) {
			element.style.animationDuration = Number( elSpeed ) + 'ms';
		}

		let t, x;

		elParent.addEventListener( 'mouseover', e => {
			clearTimeout( x );

			t = setTimeout(() => {
					element.classList.add( 'not-animated' );
					(elAnimateOut + ' not-animated').split(" ").forEach(_class => element.classList.remove(_class));
					(elAnimate + ' animated').split(" ").forEach(_class => element.classList.add(_class));
				}, elDelayT );
		}, false);

		elParent.addEventListener( 'mouseleave', e => {
			element.classList.add( 'not-animated' );
			(elAnimate + ' not-animated').split(" ").forEach(_class => element.classList.remove(_class));
			(elAnimateOut + ' animated').split(" ").forEach(_class => element.classList.add(_class));

			if( elReset == 'true' ) {
				x = setTimeout(() => {
					(elAnimateOut + ' animated').split(" ").forEach(_class => element.classList.remove(_class));
					element.classList.add( 'not-animated' );
				}, Number( elSpeed ) );
			}

			clearTimeout( t );
		}, false);
	});
};

SEMICOLON.Core.getVars.fn.html5video = selector => {
	const core = SEMICOLON.Core;
	core.initFunction({ class: 'has-plugin-html5video', event: 'pluginHtml5VideoReady' });

	selector = core.getSelector( selector, false, false );
	if( selector.length < 1 ){
		return true;
	}

	selector.forEach( element => {
		let elVideo = element.querySelector('video'),
			elRatio = element.getAttribute('data-ratio') || '16/9';

		if( !elVideo ) {
			return true;
		}

		elRatio = elRatio.split('/');

		elVideo.style.left = '';
		elVideo.style.top = '';

		let divWidth = element.offsetWidth,
			divHeight = element.offsetHeight,
			elWidth = ( Number(elRatio[0])*divHeight)/Number(elRatio[1]),
			elHeight = divHeight;

		if( elWidth < divWidth ) {
			elWidth = divWidth;
			elHeight = (Number(elRatio[1])*divWidth)/Number(elRatio[0]);
		}

		elVideo.style.width = elWidth + 'px';
		elVideo.style.height = elHeight + 'px';

		if( elHeight > divHeight ) {
			elVideo.style.left = '';
			elVideo.style.top = -( ( elHeight - divHeight )/2 ) + 'px';
		}

		if( elWidth > divWidth ) {
			elVideo.style.left = -( ( elWidth - divWidth )/2 ) + 'px';
			elVideo.style.top = '';
		}

		if( SEMICOLON.Mobile.any() && !element.classList.contains('no-placeholder') ) {
			let placeholderImg = elVideo.getAttribute('poster');

			if( placeholderImg != '' ) {
				element.innerHTML += '<div class="video-placeholder" style="background-image: url('+ placeholderImg +');"></div>';
			}

			elVideo.classList.add('d-none');
		}
	});

	core.getVars.resizers.html5video = () => SEMICOLON.Modules.html5Video();
};

const CanvasGetInstagramPhotos = ( element, loader, limit, fetchAlert ) => {
	let newimages = '';
	let alert = element.closest('.instagram-widget-alert');

	if( !alert ) {
		alert = document.createElement('div');
		alert.classList.add( 'alert', 'alert-warning', 'instagram-widget-alert', 'text-center' );
		element.insertAdjacentElement( 'beforebegin', alert );
		alert.innerHTML = '<div class="spinner-grow spinner-grow-sm me-2" role="status"><span class="visually-hidden">Loading...</span></div> ' + fetchAlert;
	}

	fetch( loader ).then( response => response.json() ).then( images => {
		if( images.length > 0 ) {
			alert.remove();
			let html = '';
			for (let i = 0; i < limit; i++) {
				if ( i === limit )
					continue;

				let photo = images[i],
					thumb = photo.media_url;
				if( photo.media_type === 'VIDEO' ) {
					thumb = photo.thumbnail_url;
				}

				element.innerHTML += '<a class="grid-item" href="'+ photo.permalink +'" target="_blank"><img src="'+ thumb +'" alt="Image"></a>';
			}
		}

		// SEMICOLON.Modules.lazyLoad();
		SEMICOLON.Core.imagesLoaded(element);

		element.addEventListener( 'CanvasImagesLoaded', function() {
			element.classList.remove('customjs');
			SEMICOLON.Modules.masonryThumbs();
			SEMICOLON.Modules.lightbox();
		});
	}).catch( err => {
		console.log(err);
		alert.classList.remove( 'alert-warning' );
		alert.classList.add( 'alert-danger' );
		alert.innerHTML = 'Could not fetch Photos from Instagram API. Please try again later.';
	});
};

SEMICOLON.Core.getVars.fn.instagram = selector => {
	const core = SEMICOLON.Core;
	core.initFunction({ class: 'has-plugin-instagram', event: 'pluginInstagramReady' });

	selector = core.getSelector( selector, false, false );
	if( selector.length < 1 ){
		return true;
	}

	selector.forEach( element => {
		let elLimit = element.getAttribute('data-count') || 12,
			elLoader = element.getAttribute('data-loader') || 'include/instagram/instagram.php',
			elFetch = element.getAttribute('data-fetch-message') || 'Fetching Photos from Instagram...';

		if( Number( elLimit ) > 12 ) {
			elLimit = 12;
		}

		CanvasGetInstagramPhotos( element, elLoader, elLimit, elFetch );
	});
};

SEMICOLON.Core.getVars.fn.isotope = selector => {
    const core = SEMICOLON.Core;
    //core.loadJS({ file: 'plugins.isotope.js', id: 'canvas-isotope-js', jsFolder: true });
    core.isFuncTrue( () => typeof Isotope !== 'undefined' ).then( cond => {
        if( !cond ) {
            return false;
        }

        core.initFunction({ class: 'has-plugin-isotope', event: 'pluginIsotopeReady' });

    	selector = core.getSelector( selector );
    	if( selector.length < 1 ){
    		return true;
    	}

    	selector.each( function(){
    		let element = jQuery(this),
    			elTransition = element.attr('data-transition') || '0.65s',
    			elLayoutMode = element.attr('data-layout') || 'masonry',
    			elStagger = element.attr('data-stagger') || 0,
    			elBase = element.attr('data-basewidth') || '.portfolio-item:not(.wide):eq(0)',
    			elOriginLeft = true,
    			elGrid;

    		if( jQuery('body').hasClass('rtl') ) {
                elOriginLeft = false;
            }

    		if( element.hasClass('portfolio') || element.hasClass('post-timeline') ){
    			elGrid = element.isotope({
    				layoutMode: elLayoutMode,
    				isOriginLeft: elOriginLeft,
    				transitionDuration: elTransition,
    				stagger: Number( elStagger ),
    				percentPosition: true,
    				masonry: {
    					columnWidth: element.find( elBase )[0]
    				}
    			});
    		} else {
    			elGrid = element.isotope({
    				layoutMode: elLayoutMode,
    				isOriginLeft: elOriginLeft,
    				transitionDuration: elTransition,
    				stagger: Number( elStagger ),
    				percentPosition: true,
    			});
    		}

    		if( element.data('isotope') ) {
    			element.addClass('has-init-isotope');
    		}

    		let elementInterval = setInterval( function(){
    			if( element.find('.lazy.lazy-loaded').length == element.find('.lazy').length ) {
    				setTimeout( function(){
    					element.filter('.has-init-isotope').isotope('layout');
    				}, 800 );
    				clearInterval( elementInterval );
    			}
    		}, 1000);

    		jQuery(window).on( 'lazyLoadLoaded', function(){
    			element.filter('.has-init-isotope').isotope('layout');
    		});

			core.getVars.resizers.isotope = () => {
				element.filter('.has-init-isotope').isotope('layout');
			};
    	});
    });
};

SEMICOLON.Core.getVars.fn.lazyload = selector => {
	const core = SEMICOLON.Core;
	//core.loadJS({ file: 'plugins.lazyload.js', id: 'canvas-lazyload-js', jsFolder: true });
	core.isFuncTrue( () => typeof LazyLoad !== "undefined" ).then( cond => {
		if( !cond ) {
			return false;
		}

		core.initFunction({ class: 'has-plugin-lazyload', event: 'pluginlazyLoadReady' });

		window.lazyLoadInstance = new LazyLoad({
			threshold: 150,
			elements_selector: '.lazy:not(.lazy-loaded)',
			class_loading: 'lazy-loading',
			class_loaded: 'lazy-loaded',
			class_error: 'lazy-error',
			callback_loaded: el => {
				core.addEvent( window, 'lazyLoadLoaded' );
				if( el.parentNode.getAttribute('data-lazy-container') == 'true' ) {
					core.runContainerModules( el.parentNode );
				}
				SEMICOLON.Modules.parallax();
			}
		});
	});
};

SEMICOLON.Core.getVars.fn.lightbox = selector => {
	const core = SEMICOLON.Core;
	//core.loadJS({ file: 'plugins.lightbox.js', id: 'canvas-lightbox-js', jsFolder: true });
	core.isFuncTrue( () => jQuery().magnificPopup ).then( cond => {
		if( !cond ) {
			return false;
		}

		core.initFunction({ class: 'has-plugin-lightbox', event: 'pluginLightboxReady' });

		selector = core.getSelector( selector );
		if( selector.length < 1 ){
			return true;
		}

		let closeButtonIcon = '<i class="bi-x-lg"></i>';

		selector.each( function(){
			let element = jQuery(this),
				elType = element.attr('data-lightbox'),
				elCloseButton = element.attr('data-close-button') || 'outside',
				elDisableUnder = element.attr('data-disable-under') || 600,
				elFixedContent = element.attr('data-content-position') || 'auto',
				elZoom = element.attr('data-zoom'),
				$body = jQuery('body');

			elCloseButton = elCloseButton == 'inside' ? true : false;
			elFixedContent = elFixedContent == 'fixed' ? true : false;

			if( elType == 'image' ) {
				let settings = {
					type: 'image',
					tLoading: '',
					closeOnContentClick: true,
					closeBtnInside: elCloseButton,
					fixedContentPos: true,
					mainClass: 'mfp-no-margins mfp-fade',
					image: {
						verticalFit: true
					},
					closeIcon: closeButtonIcon,
				};

				if( elZoom == 'true' ) {
					settings.zoom = {
						enabled: true,
						duration: 300,
						easing: 'ease-in-out',
						opener: function(openerElement) {
							return openerElement.is('img') ? openerElement : openerElement.find('img');
						}
					};
				}

				element.magnificPopup(settings);
			}

			if( elType == 'gallery' ) {
				if( element.find('a[data-lightbox="gallery-item"]').parent('.clone').hasClass('clone') ) {
					element.find('a[data-lightbox="gallery-item"]').parent('.clone').find('a[data-lightbox="gallery-item"]').attr('data-lightbox','');
				}

				if( element.find('a[data-lightbox="gallery-item"]').parents('.cloned').hasClass('cloned') ) {
					element.find('a[data-lightbox="gallery-item"]').parents('.cloned').find('a[data-lightbox="gallery-item"]').attr('data-lightbox','');
				}

				element.magnificPopup({
					delegate: element.hasClass('grid-container-filterable') ? 'a.grid-lightbox-filtered[data-lightbox="gallery-item"]' : 'a[data-lightbox="gallery-item"]',
					type: 'image',
					tLoading: '',
					closeOnContentClick: true,
					closeBtnInside: elCloseButton,
					fixedContentPos: true,
					mainClass: 'mfp-no-margins mfp-fade', // class to remove default margin from left and right side
					image: {
						verticalFit: true
					},
					gallery: {
						enabled: true,
						navigateByImgClick: true,
						preload: [0,1] // Will preload 0 - before current, and 1 after the current image
					},
					closeIcon: closeButtonIcon,
				});
			}

			if( elType == 'iframe' ) {
				element.magnificPopup({
					disableOn: Number( elDisableUnder ),
					type: 'iframe',
					tLoading: '',
					removalDelay: 160,
					preloader: false,
					closeBtnInside: elCloseButton,
					fixedContentPos: elFixedContent,
					closeIcon: closeButtonIcon,
				});
			}

			if( elType == 'inline' ) {
				element.magnificPopup({
					type: 'inline',
					tLoading: '',
					mainClass: 'mfp-no-margins mfp-fade',
					closeBtnInside: elCloseButton,
					fixedContentPos: true,
					overflowY: 'scroll',
					closeIcon: closeButtonIcon,
				});
			}

			if( elType == 'ajax' ) {
				element.magnificPopup({
					type: 'ajax',
					tLoading: '',
					closeBtnInside: elCloseButton,
					autoFocusLast: false,
					closeIcon: closeButtonIcon,
					callbacks: {
						ajaxContentAdded: function(mfpResponse) {
							core.runContainerModules( document.querySelector('.mfp-content') );
						},
						open: function() {
							$body.addClass('ohidden');
						},
						close: function() {
							$body.removeClass('ohidden');
						}
					}
				});
			}

			if( elType == 'ajax-gallery' ) {
				element.magnificPopup({
					delegate: 'a[data-lightbox="ajax-gallery-item"]',
					type: 'ajax',
					tLoading: '',
					closeBtnInside: elCloseButton,
					closeIcon: closeButtonIcon,
					autoFocusLast: false,
					gallery: {
						enabled: true,
						preload: 0,
						navigateByImgClick: false
					},
					callbacks: {
						ajaxContentAdded: function(mfpResponse) {
							core.runContainerModules( document.querySelector('.mfp-content') );
						},
						open: function() {
							$body.addClass('ohidden');
						},
						close: function() {
							$body.removeClass('ohidden');
						}
					}
				});
			}

			element.on( 'mfpOpen', function(){
				let lightboxItem = jQuery.magnificPopup.instance.currItem.el,
					lightboxClass = jQuery( lightboxItem ).attr('data-lightbox-class'),
					lightboxBgClass = jQuery( lightboxItem ).attr('data-lightbox-bg-class');

				if( lightboxClass != '' ) {
					jQuery( jQuery.magnificPopup.instance.container ).addClass( lightboxClass );
				}

				if( lightboxBgClass != '' ) {
					jQuery( jQuery.magnificPopup.instance.bgOverlay ).addClass( lightboxBgClass );
				}
			});
		});
	});
};

SEMICOLON.Core.getVars.fn.logo = selector => {
	const core = SEMICOLON.Core;

	selector = core.getSelector( selector, false );
	if( selector.length < 1 ){
		return true;
	}

	let head = core.getVars.elHead;

	if( selector[0].querySelector('.logo-dark') ) {
		let style = document.createElement('style');
		head.appendChild(style);
		let css = '.dark #header-wrap:not(.not-dark) #logo [class^="logo-"], .dark .header-row:not(.not-dark) #logo [class^="logo-"] { display: none; } .dark #header-wrap:not(.not-dark) #logo .logo-dark, .dark .header-row:not(.not-dark) #logo .logo-dark { display: flex; }';
		style.appendChild(document.createTextNode(css));
	}

	if( selector[0].querySelector('.logo-sticky') ) {
		let style = document.createElement('style');
		head.appendChild(style);
		let css = '.sticky-header #logo [class^="logo-"] { display: none; } .sticky-header #logo .logo-sticky { display: flex; }';
		style.appendChild(document.createTextNode(css));
	}

	if( selector[0].querySelector('.logo-sticky-shrink') ) {
		let style = document.createElement('style');
		head.appendChild(style);
		let css = '.sticky-header-shrink #logo [class^="logo-"] { display: none; } .sticky-header-shrink #logo .logo-sticky-shrink { display: flex; }';
		style.appendChild(document.createTextNode(css));
	}

	if( selector[0].querySelector('.logo-mobile') ) {
		let style = document.createElement('style');
		head.appendChild(style);
		let css = 'body:not(.is-expanded-menu) #logo [class^="logo-"] { display: none; } body:not(.is-expanded-menu) #logo .logo-mobile { display: flex; }';
		style.appendChild(document.createTextNode(css));
	}
};

SEMICOLON.Core.getVars.fn.masonrythumbs = selector => {
	const core = SEMICOLON.Core;
    core.isFuncTrue( () => typeof Isotope !== 'undefined' ).then( cond => {
        if( !cond ) {
            return false;
        }

		core.initFunction({ class: 'has-plugin-masonrythumbs', event: 'pluginMasonryThumbsReady' });

		selector = core.getSelector( selector );
		if( selector.length < 1 ){
			return true;
		}

		let $body = jQuery('body');

		selector.each( function() {
			let element = jQuery(this),
				elChildren = element.children(),
				elBig = element.attr('data-big');

			if( elChildren.length < 1 ) {
				return false;
			}

			elChildren.removeClass('grid-item-big').css({ 'width': '' });

			let compStyle = window.getComputedStyle( elChildren.eq(0)[0] );
			let firstElementWidth = Number(compStyle.getPropertyValue('width').split('px')[0]);

			if( element.filter('.has-init-isotope').length > 0 ) {
				element.isotope({
					masonry: {
						columnWidth: firstElementWidth
					}
				});
			}

			if( elBig ) {
				elBig = elBig.split(",");

				let elBigNum = '',
					bigi = '';

				for( bigi = 0; bigi < elBig.length; bigi++ ){
					elBigNum = Number(elBig[bigi]) - 1;
					elChildren.eq(elBigNum).addClass('grid-item-big');
				}
			}

			setTimeout( () => {
				element.find('.grid-item-big').css({ width: (firstElementWidth * 2) + 'px' });
			}, 500);

			setTimeout( () => {
				element.filter('.has-init-isotope').isotope( 'layout' );
			}, 1000);

			element[0].addEventListener( 'transitionend', () => {
				SEMICOLON.Modules.readmore();
			});
		});

		core.getVars.resizers.masonryThumbs = () => SEMICOLON.Modules.masonryThumbs();
	});
};

SEMICOLON.Core.getVars.fn.menus = selector => {
	const core = SEMICOLON.Core;
	selector = core.getSelector( selector, false );
	if( selector.length < 1 ){
		return true;
	}

	CanvasMenuInit();
	CanvasMenuReset();
	CanvasMenuArrows();
	CanvasMenuInvert();
	CanvasMenuFunctions();
	CanvasMenuTrigger();
	CanvasMenuFullWidth();

	let windowWidth = core.viewport().width;
	core.getVars.resizers.menus = () => {
		if( windowWidth != core.viewport().width ) {
			SEMICOLON.Base.menus();
		}
	};

	core.getVars.recalls.menureset = () => {
		CanvasMenuReset();
		CanvasMenuFunctions();
	};
};

const CanvasMenuInit = () => {
	const core = SEMICOLON.Core;
	core.getVars.headerWrapHeight = core.getVars.elHeaderWrap?.offsetHeight;

	document.addEventListener('click', e => {
		if( !e.target.closest('.primary-menu-trigger') && !e.target.closest('.primary-menu') ) {
			CanvasMenuReset();
			CanvasMenuFunctions();
		}

		if ( !e.target.closest('.top-links.on-click') ) {
			document.querySelectorAll('.top-links.on-click').forEach(item => item.querySelectorAll('.top-links-sub-menu,.top-links-section').forEach(el => el.classList.remove('d-block')));
			document.querySelectorAll('.top-links.on-click').forEach(item => item.querySelectorAll('.top-links-item').forEach(el => el.classList.remove('current')));
		}
	}, false);

	document.querySelectorAll( '.menu-item' ).forEach( el => {
		if( el.querySelectorAll('.sub-menu-container').length > 0 ) {
			el.classList.add('sub-menu');
		}

		if( !el.classList.contains('mega-menu-title') && el.querySelectorAll('.sub-menu-container').length > 0 && el.querySelectorAll('.sub-menu-trigger').length < 1 ) {
			let subMenuTrigger = document.createElement('button');
			subMenuTrigger.classList = 'sub-menu-trigger fa-solid fa-chevron-right';
			subMenuTrigger.innerHTML = '<span class="visually-hidden">Open Sub-Menu</span>';
			el.append( subMenuTrigger );
		}
	});
};

const CanvasMenuReset = () => {
	const core = SEMICOLON.Core;
	let body = core.getVars.elBody,
		subMenusSel = '.mega-menu-content, .sub-menu-container',
		menuItemSel = '.menu-item';

	document.querySelectorAll('.primary-menu-trigger').forEach(el => el.classList.remove('primary-menu-trigger-active'));

	core.getVars.elPrimaryMenus.forEach(el => {
		if( !body.classList.contains('is-expanded-menu') ) {
			el.querySelector('.menu-container').classList.remove('d-block');
		} else {
			el.querySelector('.menu-container').classList.remove('d-block', 'd-none');
			el.querySelectorAll(subMenusSel)?.forEach(item => item.classList.remove('d-none'));
			document.querySelectorAll('.menu-container:not(.mobile-primary-menu)').forEach(el => el.style.display = '');
			core.getVars.elPrimaryMenus.forEach(el => el.querySelectorAll('.mobile-primary-menu')?.forEach(elem => elem.classList.remove('d-block')));
		}

		el.querySelectorAll(subMenusSel)?.forEach(item => item.classList.remove('d-block'));
		// el.querySelectorAll(menuItemSel).forEach(item => item.classList.remove('current'));

		el.classList.remove('primary-menu-active');

		const classes = body.className.split(" ").filter(c => !c.startsWith('primary-menu-open'));
		body.className = classes.join(" ").trim();
	});
};

const CanvasMenuArrows = () => {
	const addArrow = menuItemDiv => {
		if( !menuItemDiv.querySelector('.sub-menu-indicator') ) {
			let arrow = document.createElement("i");
			arrow.classList.add('sub-menu-indicator');

			let customArrow = menuItemDiv.closest('.primary-menu')?.getAttribute('data-arrow-class') || 'fa-solid fa-caret-down';
			customArrow && customArrow.split(" ").forEach(className => arrow.classList.add(className));

			menuItemDiv.append(arrow);
		}
	};

	// Arrows for Top Links Items
	document.querySelectorAll( '.top-links-item' ).forEach( menuItem => {
		let menuItemDiv = menuItem.querySelector(':scope > a');
		menuItem.querySelector(':scope > .top-links-sub-menu, :scope > .top-links-section') && addArrow( menuItemDiv );
	});

	// Arrows for Primary Menu Items
	document.querySelectorAll( '.menu-item' ).forEach( menuItem => {
		let menuItemDiv = menuItem.querySelector(':scope > .menu-link > div');
		( !menuItem.classList.contains('mega-menu-title') && menuItem.querySelector(':scope > .sub-menu-container, :scope > .mega-menu-content') ) && addArrow( menuItemDiv );
	});

	// Arrows for Page Menu Items
	document.querySelectorAll( '.page-menu-item' ).forEach( menuItem => {
		let menuItemDiv = menuItem.querySelector(':scope > a > div');
		menuItem.querySelector(':scope > .page-menu-sub-menu') && addArrow( menuItemDiv );
	});
};

const CanvasMenuInvert = subMenuEl => {
	const core = SEMICOLON.Core;
	let subMenus = subMenuEl || document.querySelectorAll( '.mega-menu-content, .sub-menu-container, .top-links-section' );

	if( !core.getVars.elBody.classList.contains('is-expanded-menu') ) {
		return false;
	}

	subMenus.forEach( el => {
		el.classList.remove('menu-pos-invert');
		let elChildren = el.querySelectorAll(':scope > *');

		elChildren.forEach( elChild => elChild.style.display = 'block' );
		el.style.display = 'block';

		let viewportOffset = el.getBoundingClientRect();

		if( el.closest('.mega-menu-small') ) {
			let outside = core.viewport().width - (viewportOffset.left + viewportOffset.width);
			if( outside < 0 ) {
				el.style.left = outside + 'px';
			}
		}

		if( core.getVars.elBody.classList.contains('rtl') ) {
			if( viewportOffset.left < 0 ) {
				el.classList.add('menu-pos-invert');
			}
		}

		if( core.viewport().width - (viewportOffset.left + viewportOffset.width) < 0 ) {
			el.classList.add('menu-pos-invert');
		}
	});

	subMenus.forEach( el => {
		let elChildren = el.querySelectorAll(':scope > *');
		elChildren.forEach(elChild => elChild.style.display = '');
		el.style.display = '';
	});
};

const CanvasMenuFunctions = () => {
	const core = SEMICOLON.Core;

	let subMenusSel = '.mega-menu-content, .sub-menu-container',
		menuItemSel = '.menu-item',
		subMenuSel = '.sub-menu',
		subMenuTriggerSel = '.sub-menu-trigger',
		body = core.getVars.elBody.classList;

	let triggersBtn = document.querySelectorAll( subMenuTriggerSel );
	let triggerLinks = new Array;

	triggersBtn.forEach( el => {
		let triggerLink = el.closest('.menu-item').querySelector('.menu-link[href^="#"]');
		if( triggerLink ) {
			triggerLinks.push(triggerLink);
		}
	});

	let triggers = [...triggersBtn, ...triggerLinks];

	document.querySelectorAll(subMenuTriggerSel).forEach(el => el.classList.remove('icon-rotate-90'));

	/**
	 * Mobile Menu Functionality
	 */
	if( !body.contains('is-expanded-menu') ) {
		// Reset Menus to their Closed State
		core.getVars.elPrimaryMenus.forEach(el => el.querySelectorAll(subMenusSel).forEach(elem => {
			elem.classList.add('d-none');
			body.remove("primary-menu-open");
		}));

		triggers.forEach( trigger => {
			trigger.onclick = e => {
				e.preventDefault();

				let triggerEl = trigger;

				if( !trigger.classList.contains('sub-menu-trigger') ) {
					triggerEl = trigger.closest(menuItemSel).querySelector(':scope > ' + subMenuTriggerSel);
				}

				core.siblings(triggerEl.closest(menuItemSel)).forEach(item => item.querySelectorAll(subMenusSel).forEach(item => item.classList.add('d-none')));

				if( triggerEl.closest('.mega-menu-content') ) {
					let parentSubMenuContainers = [];
					core.parents(triggerEl, menuItemSel).forEach(item => parentSubMenuContainers.push(item.querySelector(':scope > ' + subMenusSel)));
					[...triggerEl.closest('.mega-menu-content').querySelectorAll(subMenusSel)].filter(item => !parentSubMenuContainers.includes(item)).forEach(item => item.classList.add('d-none'));
				}

				CanvasMenuTriggerState(triggerEl, menuItemSel, subMenusSel, subMenuTriggerSel, 'd-none');
			};
		});
	}

	/**
	 * On-Click Menu Functionality
	 */
	if( body.contains('is-expanded-menu') ) {
		if( body.contains('side-header') || body.contains('overlay-menu') ) {
			core.getVars.elPrimaryMenus.forEach(pMenu => {
				pMenu.classList.add('on-click');
				pMenu.querySelectorAll(subMenuTriggerSel).forEach(item => item.style.zIndex = '-1');
			});
		}

		[...core.getVars.elPrimaryMenus].filter(elem => elem.matches('.on-click')).forEach(pMenu => {
			let menuItemSubs = core.has( pMenu.querySelectorAll(menuItemSel), subMenuTriggerSel );

			menuItemSubs.forEach(el => {
				let triggerEl = el.querySelector(':scope > .menu-link');

				triggerEl.onclick = e => {
					e.preventDefault();

					core.siblings(triggerEl.closest(menuItemSel)).forEach(item => item.querySelectorAll(subMenusSel).forEach(item => item.classList.remove('d-block')));

					if( triggerEl.closest('.mega-menu-content') ) {
						let parentSubMenuContainers = [];
						core.parents(triggerEl, menuItemSel).forEach(item => parentSubMenuContainers.push(item.querySelector(':scope > ' + subMenusSel)));
						[...triggerEl.closest('.mega-menu-content').querySelectorAll(subMenusSel)].filter(item => !parentSubMenuContainers.includes(item)).forEach(item => item.classList.remove('d-block'));
					}

					CanvasMenuTriggerState(triggerEl, menuItemSel, subMenusSel, subMenuTriggerSel, 'd-block');
				};
			});
		});
	}

	/**
	 * Top-Links On-Click Functionality
	 */
	document.querySelectorAll('.top-links').forEach(item => {
		if( item.classList.contains('on-click') || !body.contains('device-up-lg') ) {
			item.querySelectorAll('.top-links-item').forEach(menuItem => {
				if( menuItem.querySelectorAll('.top-links-sub-menu,.top-links-section').length > 0 ) {
					let triggerEl = menuItem.querySelector(':scope > a');

					triggerEl.onclick = e => {
						e.preventDefault();

						core.siblings(menuItem).forEach(item => item.querySelectorAll('.top-links-sub-menu, .top-links-section').forEach(item => item.classList.remove('d-block')));
						menuItem.querySelector(':scope > .top-links-sub-menu, :scope > .top-links-section').classList.toggle('d-block');
						core.siblings(menuItem).forEach(item => item.classList.remove('current'));
						menuItem.classList.toggle('current');
					};
				}
			})
		}
	});

	CanvasMenuInvert( document.querySelectorAll('.top-links-section') );

};

const CanvasMenuTriggerState = (triggerEl, menuItemSel, subMenusSel, subMenuTriggerSel, classCheck) => {
	const core = SEMICOLON.Core;

	triggerEl.closest('.menu-container').querySelectorAll(subMenuTriggerSel).forEach(el => el.classList.remove('icon-rotate-90'));

	let triggerredSubMenus = triggerEl.closest(menuItemSel).querySelector( ':scope > ' + subMenusSel );
	let childSubMenus = triggerEl.closest(menuItemSel).querySelectorAll( subMenusSel );

	if( classCheck == 'd-none' ) {
		if( triggerredSubMenus.classList.contains('d-none') ) {
			triggerredSubMenus.classList.remove('d-none');
		} else {
			childSubMenus.forEach(item => item.classList.add('d-none'));
		}
	} else {
		if( triggerredSubMenus.classList.contains('d-block') ) {
			childSubMenus.forEach(item => item.classList.remove('d-block'));
		} else {
			triggerredSubMenus.classList.add('d-block');
		}
	}

	CanvasMenuCurrent(triggerEl, menuItemSel, subMenusSel, subMenuTriggerSel);
}

const CanvasMenuCurrent = (triggerEl, menuItemSel, subMenusSel, subMenuTriggerSel) => {
	const core = SEMICOLON.Core;

	[...triggerEl.closest('.menu-container').querySelectorAll(menuItemSel)].forEach(item => item.classList.remove('current'));

	const setCurrent = (item, menuItemSel, subMenusSel) => {
		if( !core.isHidden(item.closest(menuItemSel).querySelector(':scope > ' + subMenusSel)) ) {
			item.closest(menuItemSel).classList.add('current');
			item.closest(menuItemSel).querySelector(':scope > ' + subMenuTriggerSel)?.classList.add('icon-rotate-90');
		} else {
			item.closest(menuItemSel).classList.remove('current');
			item.closest(menuItemSel).querySelector(':scope > ' + subMenuTriggerSel)?.classList.remove('icon-rotate-90');
		}
	};

	setCurrent(triggerEl, menuItemSel, subMenusSel, subMenuTriggerSel);
	core.parents(triggerEl, menuItemSel).forEach(item => setCurrent(item, menuItemSel, subMenusSel, subMenuTriggerSel));
};

const CanvasMenuTrigger = () => {
	const core = SEMICOLON.Core;
	let body = core.getVars.elBody.classList;

	document.querySelectorAll('.primary-menu-trigger').forEach( menuTrigger => {
		menuTrigger.onclick = e => {
			var elTarget = menuTrigger.getAttribute( 'data-target' ) || '*';

			if( core.filtered( core.getVars.elPrimaryMenus, elTarget ).length < 1 ) {
				return;
			}

			if( !body.contains('is-expanded-menu') ) {
				core.getVars.elPrimaryMenus.forEach( el => {
					if( el.querySelectorAll('.mobile-primary-menu').length > 0 ) {
						el.matches(elTarget) && el.querySelectorAll('.mobile-primary-menu').forEach( elem => elem.classList.toggle('d-block') );
					} else {
						el.matches(elTarget) && el.querySelectorAll('.menu-container').forEach( elem => elem.classList.toggle('d-block') );
					}
				});
			}

			menuTrigger.classList.toggle('primary-menu-trigger-active');
			core.getVars.elPrimaryMenus.forEach(elem => elem.matches(elTarget) && elem.classList.toggle('primary-menu-active'));

			body.toggle('primary-menu-open');

			if( elTarget != '*' ) {
				body.toggle('primary-menu-open-' + elTarget.replace(/[^a-zA-Z0-9-]/g, ""));
			} else {
				body.toggle('primary-menu-open-all');
			}

			e.preventDefault();
		};
	});
};

const CanvasMenuFullWidth = () => {
	const core = SEMICOLON.Core;
	let body = core.getVars.elBody.classList;

	if( !body.contains('is-expanded-menu') ) {
		document.querySelectorAll('.mega-menu-content, .top-search-form').forEach( el => el.style.width = '' );
		return true;
	}

	let headerWidth = document.querySelector('.mega-menu:not(.mega-menu-full):not(.mega-menu-small) .mega-menu-content')?.closest('.header-row').offsetWidth;

	if( core.getVars.elHeader.querySelectorAll('.container-fullwidth').length > 0 ) {
		document.querySelectorAll('.mega-menu:not(.mega-menu-full):not(.mega-menu-small) .mega-menu-content').forEach( el => el.style.width = headerWidth + 'px' );
	}

	document.querySelectorAll('.mega-menu:not(.mega-menu-full):not(.mega-menu-small) .mega-menu-content, .top-search-form').forEach( el => el.style.width = headerWidth + 'px' );

	if( core.getVars.elHeader.classList.contains('full-header') ) {
		document.querySelectorAll('.mega-menu:not(.mega-menu-full):not(.mega-menu-small) .mega-menu-content').forEach(el => el.style.width = headerWidth + 'px');
	}

	if( core.getVars.elHeader.classList.contains('floating-header') ) {
		let floatingHeaderPadding = getComputedStyle(document.querySelector('#header')).getPropertyValue('--cnvs-header-floating-padding');
		document.querySelectorAll('.mega-menu:not(.mega-menu-full):not(.mega-menu-small) .mega-menu-content').forEach(el => el.style.width = (headerWidth + (Number(floatingHeaderPadding.split('px')[0]) *2)) + 'px');
	}
};

SEMICOLON.Core.getVars.fn.modal = selector => {
	const core = SEMICOLON.Core;

	let hasCookies = false;
	core.getSelector( selector, false ).forEach(el => {
		if( el.hasAttribute('data-cookies') ) {
			hasCookies = true;
			return true;
		}
	});

	const checkCookies = () => {
		if( hasCookies ) {
			if( typeof Cookies !== "undefined" ) {
				return true;
			}

			return false;
		} else {
			return true;
		}
	};

	//core.loadJS({ file: 'plugins.lightbox.js', id: 'canvas-lightbox-js', jsFolder: true });
	core.isFuncTrue( () => jQuery().magnificPopup && checkCookies ).then( cond => {
		if( !cond ) {
			return false;
		}

		core.initFunction({ class: 'has-plugin-modal', event: 'pluginModalReady' });

		selector = core.getSelector( selector );
		if( selector.length < 1 ){
			return true;
		}

		selector.each( function(){
			let element = jQuery(this),
				elTarget = element.attr('data-target'),
				elTargetValue = elTarget.split('#')[1],
				elDelay = element.attr('data-delay') || 500,
				elTimeout = element.attr('data-timeout'),
				elAnimateIn = element.attr('data-animate-in'),
				elAnimateOut = element.attr('data-animate-out'),
				elBgClick = element.attr('data-bg-click'),
				elCloseBtn = element.attr('data-close-btn'),
				elCookies = element.attr('data-cookies'),
				elCookiePath = element.attr('data-cookie-path'),
				elCookieExp = element.attr('data-cookie-expire');

			if( elCookies == "false" ) { Cookies.remove( elTargetValue ); }

			if( elCookies == 'true' ) {
				let elementCookie = Cookies.get( elTargetValue );

				if( typeof elementCookie !== 'undefined' && elementCookie == '0' ) {
					return true;
				}
			}

			if( elBgClick == 'false' ) {
				elBgClick = false;
			} else {
				elBgClick = true;
			}

			if( elCloseBtn == 'false' ) {
				elCloseBtn = false;
			} else {
				elCloseBtn = true;
			}

			elDelay = Number(elDelay) + 500;

			setTimeout(function() {
				jQuery.magnificPopup.open({
					items: { src: elTarget },
					type: 'inline',
					mainClass: 'mfp-no-margins mfp-fade',
					closeBtnInside: false,
					fixedContentPos: true,
					closeOnBgClick: elBgClick,
					showCloseBtn: elCloseBtn,
					removalDelay: 500,
					callbacks: {
						open: function(){
							if( elAnimateIn != '' ) {
								jQuery(elTarget).addClass( elAnimateIn + ' animated' );
							}
						},
						beforeClose: function(){
							if( elAnimateOut != '' ) {
								jQuery(elTarget).removeClass( elAnimateIn ).addClass( elAnimateOut );
							}
						},
						afterClose: function() {
							if( elAnimateIn != '' || elAnimateOut != '' ) {
								jQuery(elTarget).removeClass( elAnimateIn + ' ' + elAnimateOut + ' animated' );
							}
							if( elCookies == 'true' ) {
								let cookieOps = {};

								if( elCookieExp ) {
									cookieOps.expires = Number( elCookieExp );
								}

								if( elCookiePath ) {
									cookieOps.path = elCookiePath;
								}

								Cookies.set( elTargetValue, '0', cookieOps );
							}
						}
					}
				}, 0);
			}, elDelay );

			if( elTimeout != '' ) {
				setTimeout(function() {
					jQuery.magnificPopup.close();
				}, elDelay + Number(elTimeout) );
			}
		});
	});
};

SEMICOLON.Core.getVars.fn.navtree = selector => {
	const core = SEMICOLON.Core;
	core.initFunction({ class: 'has-plugin-navtree', event: 'pluginNavTreeReady' });

    selector = core.getSelector( selector );
	if( selector.length < 1 ){
		return true;
	}

	selector.each( function(){
		let element = jQuery(this),
			elSpeed = element.attr('data-speed') || 250,
			elEasing = element.attr('data-easing') || 'swing';

		element.find( 'ul li:has(ul)' ).addClass('sub-menu');
		element.find( 'ul li:has(ul) > a' ).filter(':not(:has(.fa-caret-right))').append( '<i class="fa-solid fa-caret-right"></i>' );

		if( element.hasClass('on-hover') ){
			element.find( 'ul li:has(ul):not(.active)' ).hover( function(e){
				jQuery(this).children('ul').stop(true, true).slideDown( Number(elSpeed), elEasing);
			}, function(){
				jQuery(this).children('ul').delay(250).slideUp( Number(elSpeed), elEasing);
			});
		} else {
			element.find( 'ul li:has(ul) > a' ).off( 'click' ).on( 'click', function(e){
				let childElement = jQuery(this);
				element.find( 'ul li' ).not(childElement.parents()).removeClass('active');
				childElement.parent().children('ul').slideToggle( Number(elSpeed), elEasing, function(){
					jQuery(this).find('ul').hide();
					jQuery(this).find('li.active').removeClass('active');
				});
				element.find( 'ul li > ul' ).not(childElement.parent().children('ul')).not(childElement.parents('ul')).slideUp( Number(elSpeed), elEasing );
				childElement.parent('li:has(ul)').toggleClass('active');
				e.preventDefault();
			});
		}
	});
};

SEMICOLON.Core.getVars.fn.notify = selector => {
	const core = SEMICOLON.Core;
	core.initFunction({ class: 'has-plugin-notify', event: 'pluginNotifyReady' });

	selector = core.getSelector( selector );
	if( selector.length < 1 ){
		return true;
	}

	let element = selector,
		elPosition = element.attr('data-notify-position') || 'top-right',
		elType = element.attr('data-notify-type'),
		elMsg = element.attr('data-notify-msg') || 'Please set a message!',
		elTimeout = element.attr('data-notify-timeout') || 5000,
		elClose = element.attr('data-notify-close') || 'true',
		elAutoHide = element.attr('data-notify-autohide') || 'true',
		elId = 'toast-' + Math.floor( Math.random() * 10000 ),
		elTrigger = element.attr('data-notify-trigger') || 'self',
		elTarget = element.attr('data-notify-target'),
		elCloseHtml	= '',
		elPosClass, elTypeClass, elCloseClass;

	if( jQuery(elTarget).length > 0 && elTrigger == 'self' ) {
		let toast = bootstrap.Toast.getOrCreateInstance(jQuery(elTarget).get(0));
		toast.hide();

		jQuery(elTarget).get(0).addEventListener('hidden.bs.toast', () => {
			core.getVars.fn.notify( selector );
		});
	}

	switch( elType ){

		case 'primary':
			elTypeClass = 'text-white bg-primary border-0';
			break;

		case 'warning':
			elTypeClass = 'text-dark bg-warning border-0';
			break;

		case 'error':
			elTypeClass = 'text-white bg-danger border-0';
			break;

		case 'success':
			elTypeClass = 'text-white bg-success border-0';
			break;

		case 'info':
			elTypeClass = 'bg-info text-dark border-0';
			break;

		case 'dark':
			elTypeClass = 'text-white bg-dark border-0';
			break;

		default:
			elTypeClass = '';
			break;
	}

	switch( elPosition ){

		case 'top-left':
			elPosClass = 'top-0 start-0';
			break;

		case 'top-center':
			elPosClass = 'top-0 start-50 translate-middle-x';
			break;

		case 'middle-left':
			elPosClass = 'top-50 start-0 translate-middle-y';
			break;

		case 'middle-center':
			elPosClass = 'top-50 start-50 translate-middle';
			break;

		case 'middle-right':
			elPosClass = 'top-50 end-0 translate-middle-y';
			break;

		case 'bottom-left':
			elPosClass = 'bottom-0 start-0';
			break;

		case 'bottom-center':
			elPosClass = 'bottom-0 start-50 translate-middle-x';
			break;

		case 'bottom-right':
			elPosClass = 'bottom-0 end-0';
			break;

		default:
			elPosClass = 'top-0 end-0';
			break;
	}

	if( elType == 'info' || elType == 'warning' || !elType ) {
		elCloseClass = '';
	} else {
		elCloseClass = 'btn-close-white';
	}

	if( elClose == 'true' ) {
		elCloseHtml = '<button type="button" class="btn-close '+ elCloseClass +' btn-sm me-2 mt-2 ms-auto" data-bs-dismiss="toast" aria-label="Close"></button>';
	}

	if( elAutoHide != 'true' ) {
		elAutoHide = false;
	} else {
		elAutoHide = true;
	}

	let	elTemplate = '<div class="position-fixed '+ elPosClass +' p-3" style="z-index: 999999;">'+
	'<div id="'+ elId +'" class="toast p-2 hide '+ elTypeClass +'" role="alert" aria-live="assertive" aria-atomic="true">'+
		'<div class="d-flex">'+
			'<div class="toast-body">'+
				elMsg +
			'</div>'+
			elCloseHtml +
		'</div>'+
	'</div>';
'</div>';

	if( elTrigger == 'self' ) {
		if( !elTarget ) {
			element.attr( 'data-notify-target', '#'+elId );
			jQuery('body').append( elTemplate );
		}
	}

	let toastElList = [].slice.call(document.querySelectorAll('.toast'));
	let toastList = toastElList.map( toastEl => {
		return new bootstrap.Toast(toastEl);
	});

	toastList.forEach(toast => {
		toast.hide();
	});

	let toastElement = element.attr('data-notify-target'),
		toastInstance = jQuery(toastElement),
		elMsgOld = toastInstance.find('.toast-body');

	if( jQuery(toastElement).length > 0 ) {
		let toast = new bootstrap.Toast( toastInstance.get(0) , {
			delay: Number(elTimeout),
			autohide: elAutoHide,
		});

		toast.show();

		if( elTrigger == 'self' ) {
			toastInstance.get(0).addEventListener('hidden.bs.toast', () => {
				toastInstance.parent().remove();
				element.get(0).removeAttribute( 'data-notify-target' );
			});
		}
	}

	return false;
};

SEMICOLON.Core.getVars.fn.onepage = selector => {
	const core = SEMICOLON.Core;
	core.initFunction({ class: 'has-plugin-onepage', event: 'pluginOnePageReady' });

	selector = core.getSelector( selector, false );
	if( selector.length < 1 ){
		return true;
	}

	let scrollToLinks = core.filtered( selector, '[data-scrollto]' ),
		onePageLinks = core.filtered( selector, '.one-page-menu' );

	if( scrollToLinks.length > 0 ) {
		core.getVars.elLinkScrolls = scrollToLinks;
	}

	if( onePageLinks.length > 0 ) {
		core.getVars.elOnePageMenus = onePageLinks;
	}

	CanvasOnePageModuleInit(selector);
	CanvasPageScrollPosition();

	window.addEventListener('scroll', () => {
		CanvasPageScrollPosition();
	},{passive: true});

	core.getVars.resizers.onepage = () => SEMICOLON.Modules.onePage();
}

const CanvasOnePageModuleInit = selector => {
	const core = SEMICOLON.Core;

	CanvasOnePageScrollerHash();

	if( core.getVars.elLinkScrolls ) {
		core.getVars.elLinkScrolls.forEach( el => {
			CanvasPageScrollerGetSettings( el, 'scrollTo' );

			el.onclick = e => {
				e.preventDefault();
				CanvasPageScroller( el, 'scrollTo' );
			};
		});
	}

	if( core.getVars.elOnePageMenus ) {
		core.getVars.elOnePageMenus.forEach( onePageMenu => {
			core.getVars.elOnePageActiveClass = onePageMenu.getAttribute('data-active-class') || 'current';
			core.getVars.elOnePageParentSelector = onePageMenu.getAttribute('data-parent') || 'li';
			core.getVars.elOnePageActiveOnClick = onePageMenu.getAttribute('data-onclick-active') || 'false';

			onePageMenu.querySelectorAll('[data-href]').forEach( el => {
				CanvasPageScrollerGetSettings( el, 'onePage' );

				el.onclick = e => {
					e.preventDefault();
					CanvasPageScroller( el, 'onePage' );
				};
			});
		});
	}
};

const CanvasOnePageScrollerHash = () => {
	const core = SEMICOLON.Core;

	if( core.getOptions.scrollExternalLinks != true ) {
		return false;
	}

	if( document.querySelector('a[data-href="'+ core.getVars.hash +'"]') || document.querySelector('a[data-scrollto="'+ core.getVars.hash +'"]') ) {
		window.onbeforeunload = () =>  {
			window.scrollTo({
				top: 0,
				behavior: 'auto'
			});
		};

		window.scrollTo({
			top: 0,
			behavior: 'auto'
		});

		let section = document.querySelector(core.getVars.hash);

		if( section ) {
			let int = setInterval( () => {
				let settings = section.getAttribute('data-onepage-settings') && JSON.parse( section.getAttribute('data-onepage-settings') );

				if( settings ) {
					CanvasPageScrollAnimation(section, settings, 0);
					clearInterval(int);
				}
			}, 250);
		}
	}
};

const CanvasPageScrollerSection = (el, type) => {
	const core = SEMICOLON.Core;
	let anchor;

	if( type == 'scrollTo' ) {
		anchor = el.getAttribute('data-scrollto');
	} else {
		anchor = el.getAttribute('data-href');
	}

	let section = document.querySelector( anchor );

	return section;
};

const CanvasPageScrollerGetSettings = (el, type) => {
	const core = SEMICOLON.Core;
	let section = CanvasPageScrollerSection(el, type);

	if( !section ) {
		return false;
	}

	section.removeAttribute('data-onepage-settings');

	let settings = CanvasPageScrollerSettings( section, el );

	setTimeout( () => {
		if( !section.hasAttribute('data-onepage-settings') ) {
			section.setAttribute( 'data-onepage-settings', JSON.stringify( settings ) );
		}
		core.getVars.pageSectionEls = document.querySelectorAll('[data-onepage-settings]');
	}, 1000);
};

const CanvasPageScroller = (el, type) => {
	const core = SEMICOLON.Core;
	let section = CanvasPageScrollerSection(el, type),
		sectionId = section.getAttribute('id');

	if( !section ) {
		return false;
	}

	let settings = JSON.parse( section.getAttribute('data-onepage-settings') );

	if( type != 'scrollTo' && core.getVars.elOnePageActiveOnClick == 'true' ) {
		parent = el.closest('.one-page-menu');
		parent.querySelectorAll(core.getVars.elOnePageParentSelector).forEach( el => el.classList.remove( core.getVars.elOnePageActiveClass ) );
		parent.querySelector('a[data-href="#' + sectionId + '"]').closest(core.getVars.elOnePageParentSelector).classList.add( core.getVars.elOnePageActiveClass );
	}

	if( !core.getVars.elBody.classList.contains('is-expanded-menu') || core.getVars.elBody.classList.contains('overlay-menu') ) {
		core.getVars.recalls.menureset();
	}

	CanvasPageScrollAnimation(section, settings, 250);
};

const CanvasPageScrollAnimation = (section, settings, timeout) => {
	const core = SEMICOLON.Core;

	setTimeout( () => {
		let sectionOffset = core.offset(section).top;

		if( !settings ) {
			return false;
		}

		if( settings.easing ) {
			jQuery('html,body').stop(true, true).animate({
				'scrollTop': sectionOffset - Number( settings.offset )
			}, Number(settings.speed), settings.easing);
		} else {
			window.scrollTo({
				top: sectionOffset - Number( settings.offset ),
				behavior: 'smooth'
			});
		}
	}, Number(timeout));
};

const CanvasPageScrollPosition = () => {
	const core = SEMICOLON.Core;
	core.getVars.elOnePageMenus && core.getVars.elOnePageMenus.forEach( el => el.querySelectorAll('[data-href]').forEach( item => item.closest(core.getVars.elOnePageParentSelector).classList.remove( core.getVars.elOnePageActiveClass )));
	core.getVars.elOnePageMenus && core.getVars.elOnePageMenus.forEach( el => el.querySelector('[data-href="#' + CanvasOnePageCurrentSection() + '"]')?.closest(core.getVars.elOnePageParentSelector).classList.add( core.getVars.elOnePageActiveClass ));
};

const CanvasOnePageCurrentSection = () => {
	const core = SEMICOLON.Core;
	let currentOnePageSection;

	if( typeof core.getVars.pageSectionEls === 'undefined' ) {
		return true;
	}

	core.getVars.pageSectionEls.forEach( el => {
		let settings = el.getAttribute('data-onepage-settings') && JSON.parse( el.getAttribute('data-onepage-settings') );

		if( settings ) {
			let h = core.offset(el).top - settings.offset - 5,
				y = window.pageYOffset;

			if( ( y >= h ) && ( y < h + el.offsetHeight ) && el.getAttribute('id') != currentOnePageSection && el.getAttribute('id') ) {
				currentOnePageSection = el.getAttribute('id');
			}
		}
	});

	return currentOnePageSection;
};

const CanvasPageScrollerSettings = (section, element) => {
	const core = SEMICOLON.Core;
	let body = core.getVars.elBody.classList;

	if( typeof section === 'undefined' || element.length < 1 ) {
		return true;
	}

	if( section.hasAttribute('data-onepage-settings') ) {
		return true;
	}

	const options = {
		offset: core.getVars.topScrollOffset,
		speed: 1250,
		easing: false
	};

	let settings = {},
		parentSettings = {},
		parent = element.closest( '.one-page-menu' );

	parentSettings.offset = parent?.getAttribute( 'data-offset' ) || options.offset;
	parentSettings.speed = parent?.getAttribute( 'data-speed' ) || options.speed;
	parentSettings.easing = parent?.getAttribute( 'data-easing' ) || options.easing;

	let elementSettings = {
		offset: element.getAttribute( 'data-offset' ) || parentSettings.offset,
		speed: element.getAttribute( 'data-speed' ) || parentSettings.speed,
		easing: element.getAttribute( 'data-easing' ) || parentSettings.easing,
	};

	let elOffsetXXL = element.getAttribute( 'data-offset-xxl' ),
		elOffsetXL = element.getAttribute( 'data-offset-xl' ),
		elOffsetLG = element.getAttribute( 'data-offset-lg' ),
		elOffsetMD = element.getAttribute( 'data-offset-md' ),
		elOffsetSM = element.getAttribute( 'data-offset-sm' ),
		elOffsetXS = element.getAttribute( 'data-offset-xs' );

	if( !elOffsetXS ) {
		elOffsetXS = Number(elementSettings.offset);
	}

	if( !elOffsetSM ) {
		elOffsetSM = Number(elOffsetXS);
	}

	if( !elOffsetMD ) {
		elOffsetMD = Number(elOffsetSM);
	}

	if( !elOffsetLG ) {
		elOffsetLG = Number(elOffsetMD);
	}

	if( !elOffsetXL ) {
		elOffsetXL = Number(elOffsetLG);
	}

	if( !elOffsetXXL ) {
		elOffsetXXL = Number(elOffsetXL);
	}

	if( body.contains('device-xs') ) {
		elementSettings.offset = elOffsetXS;
	} else if( body.contains('device-sm') ) {
		elementSettings.offset = elOffsetSM;
	} else if( body.contains('device-md') ) {
		elementSettings.offset = elOffsetMD;
	} else if( body.contains('device-lg') ) {
		elementSettings.offset = elOffsetLG;
	} else if( body.contains('device-xl') ) {
		elementSettings.offset = elOffsetXL;
	} else if( body.contains('device-xxl') ) {
		elementSettings.offset = elOffsetXXL;
	}

	settings.offset = elementSettings.offset;
	settings.speed = elementSettings.speed;
	settings.easing = elementSettings.easing;

	return settings;
};

SEMICOLON.Core.getVars.fn.pagemenu = selector => {
	const core = SEMICOLON.Core;
	selector = core.getSelector( selector, false );
	if( selector.length < 1 ){
		return true;
	}

	let pageMenu = core.getVars.elPageMenu,
		pageMenuWrap = pageMenu.querySelector('#page-menu-wrap'),
		pageMenuClone = pageMenu.querySelector('.page-menu-wrap-clone'),
		head = document.head || document.getElementsByTagName('head')[0],
		style = document.createElement('style'),
		css;

	if( !pageMenuClone ) {
		pageMenuClone = document.createElement('div');
		pageMenuClone.classList = 'page-menu-wrap-clone';

		pageMenuWrap.parentNode.insertBefore( pageMenuClone, pageMenuWrap.nextSibling);
		pageMenuClone = pageMenu.querySelector('.page-menu-wrap-clone');
	}

	pageMenuClone.style.height = pageMenu.querySelector('#page-menu-wrap').offsetHeight + 'px';

	pageMenu.querySelector('#page-menu-trigger').onclick = e => {
		core.getVars.elBody.classList.remove('top-search-open');
		pageMenu.classList.toggle('page-menu-open');

		e.preventDefault();
	};

	pageMenu.querySelector('nav').onclick = e => {
		core.getVars.elBody.classList.remove('top-search-open');
		document.getElementById('top-cart').classList.remove('top-cart-open');
	};

	document.addEventListener('click', e => {
		if( !e.target.closest('#page-menu') ) {
			pageMenu.classList.remove('page-menu-open');
		}
	}, false);

	if( pageMenu.classList.contains('no-sticky') || pageMenu.classList.contains('dots-menu') ) {
		return true;
	}

	let headerHeight;

	if( core.getVars.elHeader.classList.contains('no-sticky') || core.getVars.elHeader.getAttribute('data-sticky-shrink') == 'false' ) {
		headerHeight = getComputedStyle(core.getVars.elHeader).getPropertyValue('--cnvs-header-height').split('px')[0];
	} else {
		headerHeight = getComputedStyle(core.getVars.elHeader).getPropertyValue('--cnvs-header-height-shrink').split('px')[0];
	}

	if( core.getVars.elHeader.getAttribute('data-sticky-shrink') == 'false' ) {
		pageMenu.style.setProperty("--cnvs-page-submenu-sticky-offset", headerHeight+'px');
	}

	setTimeout( () => {
		core.getVars.pageMenuOffset = core.offset(pageMenu).top - headerHeight;
		CanvasStickyPageMenu( core.getVars.pageMenuOffset );
	}, 500);

	window.addEventListener( 'scroll', function(){
		CanvasStickyPageMenu( core.getVars.pageMenuOffset );
	}, { passive: true });

	core.getVars.resizers.pagemenu = () => {
		setTimeout( () => {
			core.getVars.pageMenuOffset = core.offset(pageMenu).top - headerHeight;
			CanvasStickyPageMenu( core.getVars.pageMenuOffset );
		}, 250);
	};
};

const CanvasStickyPageMenu = stickyOffset => {
	const core = SEMICOLON.Core;
	const pageMenu = core.getVars.elPageMenu;

	if( window.pageYOffset > stickyOffset ) {
		if( core.getVars.elBody.classList.contains('device-up-lg') ) {
			pageMenu.classList.add('sticky-page-menu');
		} else {
			if( pageMenu.getAttribute('data-mobile-sticky') == 'true' ) {
				pageMenu.classList.add('sticky-page-menu');
			}
		}
	} else {
		pageMenu.classList.remove('sticky-page-menu');
	}
};

SEMICOLON.Core.getVars.fn.pagetransition = selector => {
	const core = SEMICOLON.Core,
		elBody = core.getVars.elBody;

	core.initFunction({ class: 'has-plugin-pagetransition', event: 'pluginPageTransitionReady' });

	if( elBody.classList.contains('no-transition') ) {
		return true;
	}

	if( !elBody.classList.contains('page-transition') ) {
		elBody.classList.add('page-transition');
	}

	window.onpageshow = event => {
		if(event.persisted) {
			window.location.reload();
		}
	};

	var pageTransition = document.querySelector('.page-transition-wrap');

	let elAnimIn = elBody.getAttribute('data-animation-in') || 'fadeIn',
		elSpeedIn = elBody.getAttribute('data-speed-in') || 1000,
		elTimeoutActive = false,
		elTimeout = elBody.getAttribute('data-loader-timeout'),
		elLoader = elBody.getAttribute('data-loader'),
		elLoaderColor = elBody.getAttribute('data-loader-color'),
		elLoaderHtml = elBody.getAttribute('data-loader-html'),
		elLoaderAppend = '',
		elLoaderCSSVar = '';

	if( !elTimeout ) {
		elTimeoutActive = false;
		elTimeout = false;
	} else {
		elTimeoutActive = true;
		elTimeout = Number(elTimeout);
	}

	if( elLoaderColor ) {
		if( elLoaderColor == 'theme' ) {
			elLoaderCSSVar = ' style="--cnvs-loader-color:var(--cnvs-themecolor);"';
		} else {
			elLoaderCSSVar = ' style="--cnvs-loader-color:'+elLoaderColor+';"';
		}
	}

	let elLoaderBefore = '<div class="css3-spinner"'+elLoaderCSSVar+'>',
		elLoaderAfter = '</div>';

	if( elLoader == '2' ) {
		elLoaderAppend = '<div class="css3-spinner-flipper"></div>';
	} else if( elLoader == '3' ) {
		elLoaderAppend = '<div class="css3-spinner-double-bounce1"></div><div class="css3-spinner-double-bounce2"></div>';
	} else if( elLoader == '4' ) {
		elLoaderAppend = '<div class="css3-spinner-rect1"></div><div class="css3-spinner-rect2"></div><div class="css3-spinner-rect3"></div><div class="css3-spinner-rect4"></div><div class="css3-spinner-rect5"></div>';
	} else if( elLoader == '5' ) {
		elLoaderAppend = '<div class="css3-spinner-cube1"></div><div class="css3-spinner-cube2"></div>';
	} else if( elLoader == '6' ) {
		elLoaderAppend = '<div class="css3-spinner-scaler"></div>';
	} else if( elLoader == '7' ) {
		elLoaderAppend = '<div class="css3-spinner-grid-pulse"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>';
	} else if( elLoader == '8' ) {
		elLoaderAppend = '<div class="css3-spinner-clip-rotate"><div></div></div>';
	} else if( elLoader == '9' ) {
		elLoaderAppend = '<div class="css3-spinner-ball-rotate"><div></div><div></div><div></div></div>';
	} else if( elLoader == '10' ) {
		elLoaderAppend = '<div class="css3-spinner-zig-zag"><div></div><div></div></div>';
	} else if( elLoader == '11' ) {
		elLoaderAppend = '<div class="css3-spinner-triangle-path"><div></div><div></div><div></div></div>';
	} else if( elLoader == '12' ) {
		elLoaderAppend = '<div class="css3-spinner-ball-scale-multiple"><div></div><div></div><div></div></div>';
	} else if( elLoader == '13' ) {
		elLoaderAppend = '<div class="css3-spinner-ball-pulse-sync"><div></div><div></div><div></div></div>';
	} else if( elLoader == '14' ) {
		elLoaderAppend = '<div class="css3-spinner-scale-ripple"><div></div><div></div><div></div></div>';
	} else {
		elLoaderAppend = '<div class="css3-spinner-bounce1"></div><div class="css3-spinner-bounce2"></div><div class="css3-spinner-bounce3"></div>';
	}

	if( !elLoaderHtml ) {
		elLoaderHtml = elLoaderAppend;
	}

	elLoaderHtml = elLoaderBefore + elLoaderHtml + elLoaderAfter;

	if( elSpeedIn ) {
		core.getVars.elWrapper.style.setProperty('--cnvs-animate-duration', Number(elSpeedIn)+'ms');
	}

	if( elAnimIn == 'fadeIn' ) {
		core.getVars.elWrapper.classList.add('op-1');
	}

	if( !pageTransition ) {
		let divPT = document.createElement('div');
		divPT.classList.add('page-transition-wrap');
		divPT.innerHTML = elLoaderHtml;
		elBody.prepend( divPT );
		pageTransition = document.querySelector('.page-transition-wrap');
	}

	const endPageTransition = () => {
		elAnimIn.split(" ").forEach(className => pageTransition.classList.remove(className));
		pageTransition.classList.add('fadeOut', 'animated');

		const removePageTransition = () => {
			pageTransition.remove();
			(elAnimIn + ' animated').split(" ").forEach(className => core.getVars.elWrapper.classList.add(className));
		};

		const displayContent = () => {
			core.getVars.elBody.classList.remove('page-transition');
			setTimeout(() => {
				(elAnimIn + ' animated').split(" ").forEach(className => core.getVars.elWrapper.classList.remove(className));
			}, 333);
		};

		pageTransition.addEventListener('transitionend', removePageTransition);
		pageTransition.addEventListener('animationend', removePageTransition);
		core.getVars.elWrapper.addEventListener('transitionend', displayContent);
		core.getVars.elWrapper.addEventListener('animationend', displayContent);

		return true;
	};

	if( document.readyState === 'complete' ) {
		endPageTransition();
	}

	if( elTimeoutActive ) {
		setTimeout( endPageTransition, elTimeout );
	}

	window.onload = () => endPageTransition();
};

SEMICOLON.Core.getVars.fn.parallax = selector => {
	const core = SEMICOLON.Core;
	//core.loadJS({ file: 'plugins.parallax.js', id: 'canvas-parallax-js', jsFolder: true });
	core.isFuncTrue( () => typeof simpleParallax !== "undefined" ).then( cond => {
		if( !cond ) {
			return false;
		}

		core.initFunction({ class: 'has-plugin-parallax', event: 'pluginParallaxReady' });

		selector = core.getSelector( selector, false );
		if( selector.length < 1 ){
			return true;
		}

		let instances = [],
			i = 0;

		selector.forEach( el => {
			let speed = el.getAttribute('data-parallax-speed') || 0.4,
				scale = el.getAttribute('data-parallax-scale') || 1.25,
				overflow = el.getAttribute('data-parallax-overflow') || false,
				maxTrans = el.getAttribute('data-parallax-max-transition') || 0,
				mobile = el.getAttribute('data-mobile') || 'false',
				direction = el.getAttribute('data-direction') || 'up';

			if( overflow == "true" ) {
				overflow = true;
			}

			if( SEMICOLON.Mobile.any() && mobile == 'false' ) {
				el.classList.add('mobile-parallax');
			} else {
				instances[i] = new simpleParallax(el, {
					orientation: direction,
					scale: Number(scale),
					overflow: overflow,
					delay: Number(speed),
					maxTransition: Number(maxTrans)
				});
			}

			i++;
		});

		core.getVars.resizers.parallax = () => SEMICOLON.Modules.parallax();
	});
};

SEMICOLON.Core.getVars.fn.piechart = selector => {
	const core = SEMICOLON.Core;
	//core.loadJS({ file: 'plugins.piechart.js', id: 'canvas-piechart-js', jsFolder: true });
	core.isFuncTrue( () => jQuery().easyPieChart ).then( cond => {
		if( !cond ) {
			return false;
		}

		core.initFunction({ class: 'has-plugin-piechart', event: 'pluginRoundedSkillReady' });

		selector = core.getSelector( selector );
		if( selector.length < 1 ){
			return true;
		}

		selector.each(function(){
			let element = jQuery(this),
				elSize = element.attr('data-size') || 140,
				elSpeed = element.attr('data-speed') || 2000,
				elWidth = element.attr('data-width') || 4,
				elColor = element.attr('data-color') || '#0093BF',
				elTrackColor = element.attr('data-trackcolor') || 'rgba(0,0,0,0.04)';

			let properties = {
				size: Number( elSize ),
				speed: Number( elSpeed ),
				width: Number( elWidth ),
				color: elColor,
				trackcolor:	elTrackColor
			};

			element.css({ 'width': elSize+'px', 'height': elSize+'px', 'line-height': elSize+'px' });

			if( jQuery('body').hasClass('device-xl') || jQuery('body').hasClass('device-lg') ){
				element.animate({opacity:0}, 10);
				let observer = new IntersectionObserver( function(entries, observer){
					entries.forEach( function(entry){
						if (entry.isIntersecting) {
							if (!element.hasClass('skills-animated')) {
								var t = setTimeout( function(){ element.css({opacity: 1}); }, 100 );
								CanvasRunSkills( element, properties );
								element.addClass('skills-animated');
							}
							observer.unobserve( entry.target );
						}
					});
				}, {rootMargin: '-50px'});
				observer.observe( element[0] );
			} else {
				CanvasRunSkills( element, properties );
			}
		});
	});
};

const CanvasRunSkills = ( element, properties ) => {
	element.easyPieChart({
		size: properties.size,
		animate: properties.speed,
		scaleColor: false,
		trackColor: properties.trackcolor,
		lineWidth: properties.width,
		lineCap: 'square',
		barColor: properties.color
	});
};

const CanvasPricingSwitcher = (checkbox, parent, pricing, defClass, actClass) => {
	parent.querySelectorAll('.pts-left,.pts-right').forEach(el => {
		actClass.split(" ").forEach(_class => el.classList.remove(_class));
		defClass.split(" ").forEach(_class => el.classList.add(_class));
	});

	pricing.querySelectorAll('.pts-switch-content-left,.pts-switch-content-right').forEach(el => el.classList.add('d-none'));

	if( checkbox.checked == true ) {
		defClass.split(" ").forEach(_class => parent.querySelector('.pts-right').classList.remove(_class));
		actClass.split(" ").forEach(_class => parent.querySelector('.pts-right').classList.add(_class));
		pricing.querySelectorAll('.pts-switch-content-right').forEach(el => el.classList.remove('d-none'));
	} else {
		defClass.split(" ").forEach(_class => parent.querySelector('.pts-left').classList.remove(_class));
		actClass.split(" ").forEach(_class => parent.querySelector('.pts-left').classList.add(_class));
		pricing.querySelectorAll('.pts-switch-content-left').forEach(el => el.classList.remove('d-none'));
	}
};

SEMICOLON.Core.getVars.fn.pricingswitcher = selector => {
	const core = SEMICOLON.Core;
	core.initFunction({ class: 'has-plugin-pricing-switcher', event: 'pluginPricingSwitcherReady' });

	selector = core.getSelector( selector, false );
	if( selector.length < 1 ){
		return true;
	}

	selector.forEach( element => {
		let elCheck = element.querySelector('[type="checkbox"]'),
			elParent = element.closest('.pricing-tenure-switcher'),
			elDefClass = element.getAttribute('data-default-class') || 'text-muted op-05',
			elActClass = element.getAttribute('data-active-class') || 'fw-bold',
			elPricing = document.querySelector( elParent.getAttribute('data-container') );

		CanvasPricingSwitcher(elCheck, elParent, elPricing, elDefClass, elActClass);

		elCheck.addEventListener( 'change', () => {
			CanvasPricingSwitcher(elCheck, elParent, elPricing, elDefClass, elActClass);
		});
	});
};


SEMICOLON.Core.getVars.fn.progress = selector => {
    const core = SEMICOLON.Core;
    core.initFunction({ class: 'has-plugin-progress', event: 'pluginProgressReady' });

	selector = core.getSelector( selector, false );
	if( selector.length < 1 ){
		return true;
	}

	selector.forEach( element => {
		let elValue	= element.getAttribute('data-percent') || 90,
			elSpeed	= element.getAttribute('data-speed') || 1200,
			elBar = element.querySelector('.skill-progress-percent');

		elSpeed = Number(elSpeed) + 'ms';

		elBar.style.setProperty( '--cnvs-progress-speed', elSpeed );

		let observer = new IntersectionObserver( function(entries, observer){
			entries.forEach( entry => {
				if (entry.isIntersecting) {
					if (!elBar.classList.contains('skill-animated')) {
						SEMICOLON.Modules.counter(element.querySelector('.counter'));

						if ( element.classList.contains('skill-progress-vertical') ) {
							elBar.style.height = elValue + "%";
							elBar.classList.add('skill-animated');
						} else {
							elBar.style.width = elValue + "%";
							elBar.classList.add('skill-animated');
						}
					}
					observer.unobserve( entry.target );
				}
			});
		});

		observer.observe( elBar );
	});
};

SEMICOLON.Core.getVars.fn.quantity = selector => {
	const core = SEMICOLON.Core;
	core.initFunction({ class: 'has-plugin-quantity', event: 'pluginQuantityReady' });

	selector = core.getSelector( selector, false );
	if( selector.length < 1 ){
		return true;
	}

	selector.forEach( element => {
		let plus = element.querySelector('.plus'),
			minus = element.querySelector('.minus'),
			input = element.querySelector('.qty');

		const eChange = new Event("change");

		plus.onclick = e => {
			let value = input.value,
				step = input.getAttribute('step') || 1,
				max = input.getAttribute('max'),
				intRegex = /^\d+$/;

			if( max && ( Number(elValue) >= Number( max ) ) ) {
				return false;
			}

			if( intRegex.test( value ) ) {
				let valuePlus = Number(value) + Number(step);
				input.value = valuePlus;
			} else {
				input.value = Number(step);
			}

			input.dispatchEvent(eChange);

			e.preventDefault();
		};

		minus.onclick = e => {
			let value = input.value,
				step = input.getAttribute('step') || 1,
				min = input.getAttribute('min'),
				intRegex = /^\d+$/;

			if( !min || min < 0 ) {
				min = 1;
			}

			if( intRegex.test( value ) ) {
				if( Number(value) > Number(min) ) {
					let valueMinus = Number(value) - Number(step);
					input.value = valueMinus;
				}
			} else {
				input.value = Number(step);
			}

			input.dispatchEvent(eChange);

			e.preventDefault();
		};
	});
};

SEMICOLON.Core.getVars.fn.readmore = selector => {
	const core = SEMICOLON.Core;
	core.initFunction({ class: 'has-plugin-readmore', event: 'pluginReadMoreReady' });

	selector = core.getSelector( selector, false );
	if( selector.length < 1 ){
		return true;
	}

	selector.forEach( el => {
		let element = el,
			elSize = element.getAttribute('data-readmore-size') || '10rem',
			elSpeed = element.getAttribute('data-readmore-speed') || 500,
			elScrollUp = element.getAttribute('data-readmore-scrollup') || 'false',
			elTrigger = element.getAttribute('data-readmore-trigger') || '.read-more-trigger',
			elTriggerO = element.getAttribute('data-readmore-trigger-open') || 'Read More',
			elTriggerC = element.getAttribute('data-readmore-trigger-close') || 'Read Less',
			elMask;

		element.style.height = '';
		element.classList.remove('read-more-wrap-open');

		let elHeight = element.offsetHeight;

		let elTriggerElement = element.querySelector( elTrigger );
		elTriggerElement.classList.remove('d-none');
		let elHeightN = elHeight + elTriggerElement.offsetHeight;

		elTriggerElement.innerHTML = elTriggerO;
		elSpeed = Number( elSpeed );

		element.classList.add('read-more-wrap');
		element.style.height = elSize;
		element.style.transitionDuration = elSpeed + 'ms';

		if( !element.querySelector('.read-more-mask') ) {
			element.innerHTML += '<div class="read-more-mask"></div>';
		}

		elMask = element.querySelector('.read-more-mask');

		let elMaskD = element.getAttribute('data-readmore-mask') || 'true',
			elMaskColor = element.getAttribute('data-readmore-maskcolor') || '#FFF',
			elMaskSize = element.getAttribute('data-readmore-masksize') || '100%';

		if( elMaskD == 'true' ) {
			elMask.style.height = elMaskSize;
			elMask.style.backgroundImage = 'linear-gradient( '+ CanvasHEXtoRGBA( elMaskColor, 0 ) +', '+ CanvasHEXtoRGBA( elMaskColor, 1 ) +' )';
			elMask.classList.add('op-ts', 'op-1');
		} else {
			elMask.classList.add('d-none');
		}

		let elTriggerEl = element.querySelector(elTrigger);

		// console.log( (element.getBoundingClientRect().top + document.body.scrollTop - core.getVars.topScrollOffset) );

		elTriggerEl.onclick = e => {
			if( element.classList.contains('read-more-wrap-open') ) {
				element.style.height = elSize;
				element.classList.remove('read-more-wrap-open');
				elTriggerEl.innerHTML = elTriggerO;
				setTimeout( () => {
					if( elScrollUp == 'true' ) {
						window.scrollTo({
							top: (element.offsetTop - core.getVars.topScrollOffset),
							behavior: 'smooth'
						});
					}
				}, elSpeed );
				if( elMaskD == 'true' ) {
					elMask.classList.add('op-ts', 'op-1');
				}
			} else {
				if( elTriggerC == 'false' ) {
					elTriggerEl.classList.add('d-none');
				}
				element.style.height = elHeightN + 'px';
				element.style.overflow = '';
				element.classList.add('read-more-wrap-open');
				if( elTriggerEl ) {
					elTriggerEl.innerHTML = elTriggerC;
				}
				if( elMaskD == 'true' ) {
					elMask.classList.remove('op-1');
					elMask.classList.add('op-0');
				}
			}

			elTriggerEl = element.querySelector(elTrigger);

			e.preventDefault();
		};
	});

	core.getVars.resizers.readmore = () => SEMICOLON.Modules.readmore();
};

const CanvasHEXtoRGBA = function( hex, op ){
	let c;
	if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
		c= hex.substring(1).split('');
		if(c.length==3){
			c= [c[0], c[0], c[1], c[1], c[2], c[2]];
		}
		c= '0x'+c.join('');
		return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+op+')';
	}
	console.log('Bad Hex');
};

SEMICOLON.Core.getVars.fn.schemetoggler = selector => {
	const core = SEMICOLON.Core;

	core.initFunction({ class: 'has-plugin-schemetoggler', event: 'pluginSchemeTogglerReady' });

	selector = core.getSelector( selector, false );
	if( selector.length < 1 ) {
		return false;
	}

	selector.forEach(element => {
		const bodyClassToggle = element.getAttribute('data-bodyclass-toggle') || 'dark';
		const toggleType = element.getAttribute('data-type') || 'trigger';
		CanvasBodyToggle(element);

		if( 'checkbox' == toggleType ) {
			let elementCheck = element.querySelector('input[type=checkbox]');

			elementCheck.addEventListener( 'change', () => {
				core.classesFn( 'toggle', bodyClassToggle, core.getVars.elBody );
				CanvasBodyToggle(element, false, true);
				core.siblings(element, selector).forEach(el => CanvasBodyToggle(el, true));
			});
		} else {
			element.onclick = e => {
				e.preventDefault();

				core.classesFn( 'toggle', bodyClassToggle, core.getVars.elBody );
				CanvasBodyToggle(element, false, true);
				core.siblings(element, selector).forEach(el => CanvasBodyToggle(el, true));
			};
		}
	});
};

const CanvasBodyToggle = (element, sibling=false, action=false) => {
	const core = SEMICOLON.Core;

	const bodyClassToggle = element.getAttribute('data-bodyclass-toggle') || 'dark';
	const classAdd = element.getAttribute('data-add-class') || 'scheme-toggler-active';
	const classRemove = element.getAttribute('data-remove-class') || 'scheme-toggler-active';
	const htmlAdd = element.getAttribute('data-add-html');
	const htmlRemove = element.getAttribute('data-remove-html');
	const toggleType = element.getAttribute('data-type') || 'trigger';
	const remember = element.getAttribute('data-remember') || 'false';

	if( core.contains( bodyClassToggle, core.getVars.elBody ) ) {
		core.classesFn( 'add', classAdd, element );
		core.classesFn( 'remove', classRemove, element );
		element.classList.add('body-state-toggled');

		// Set Storage
		if( remember == "true" && action ) {
			localStorage.setItem('cnvsBodyColorScheme', 'dark');
		}

		if( 'checkbox' == toggleType && sibling ) {
			element.querySelector('input[type=checkbox]').checked = true;
		} else {
			if( htmlAdd ) {
				element.innerHTML = htmlAdd;
			}
		}
	} else {
		core.classesFn( 'add', classRemove, element );
		core.classesFn( 'remove', classAdd, element );
		element.classList.remove('body-state-toggled');

		// Remove Storage
		if( remember == "true" && action ) {
			localStorage.removeItem('cnvsBodyColorScheme');
		}

		if( 'checkbox' == toggleType && sibling ) {
			element.querySelector('input[type=checkbox]').checked = false;
		} else {
			if( htmlRemove ) {
				element.innerHTML = htmlRemove;
			}
		}
	}

	SEMICOLON.Base.setBSTheme();
	SEMICOLON.Modules.dataClasses();
};

SEMICOLON.Core.getVars.fn.search = selector => {
	const core = SEMICOLON.Core;
	selector = core.getSelector( selector, false );
	if( selector.length < 1 ){
		return true;
	}

	// let x = document.querySelectorAll("div, p");
	// let divs = [...x].filter(elem => elem.matches(":not(#primary-menu-trigger)"));
	// console.log( divs );

	let searchForm = document.querySelector('.top-search-form');

	if( !searchForm ) {
		return true;
	}

	searchForm.closest('.header-row').classList.add( 'top-search-parent' );

	let topSearchParent = document.querySelector('.top-search-parent'),
		timeout;

	selector[0].onclick = e => {
		clearTimeout( timeout );

		core.getVars.elBody.classList.toggle('top-search-open');
		document.getElementById('top-cart')?.classList.remove('top-cart-open');

		core.getVars.recalls.menureset();

		if( core.getVars.elBody.classList.contains('top-search-open') ) {
			topSearchParent.classList.add('position-relative');
		} else {
			timeout = setTimeout( () => {
				topSearchParent.classList.remove('position-relative');
			}, 500);
		}

		core.getVars.elBody.classList.remove("primary-menu-open");
		core.getVars.elPageMenu && core.getVars.elPageMenu.classList.remove('page-menu-open');

		if (core.getVars.elBody.classList.contains('top-search-open')){
			searchForm.querySelector('input').focus();
		}

		e.stopPropagation();
		e.preventDefault();
	};

	document.addEventListener( 'click', e => {
		if (!e.target.closest('.top-search-form')) {
			core.getVars.elBody.classList.remove('top-search-open');
			timeout = setTimeout( () => {
				topSearchParent.classList.remove('position-relative');
			}, 500);
		}
	}, false);
};

SEMICOLON.Core.getVars.fn.shapedivider = selector => {
	const core = SEMICOLON.Core;
	core.initFunction({ class: 'has-plugin-shapedivider', event: 'pluginShapeDividerReady' });

	selector = core.getSelector( selector, false );
	if( selector.length < 1 ){
		return true;
	}

	selector.forEach( element => {
		let elShape = element.getAttribute('data-shape') || 'valley',
			elWidth = element.getAttribute('data-width') || 100,
			elHeight = element.getAttribute('data-height') || 100,
			elFill = element.getAttribute('data-fill'),
			elOut = element.getAttribute('data-outside') || 'false',
			elPos = element.getAttribute('data-position') || 'top',
			elId = 'shape-divider-' + Math.floor( Math.random() * 10000 ),
			shape = '',
			width, height, fill,
			outside = '';

		if( element.classList.contains('shape-divider-complete') ) {
			return true;
		}

		if( elWidth < 100 ) {
			elWidth = 100;
		}

		width = 'width: calc( '+ Number( elWidth ) +'% + 1.5px );';
		height = 'height: '+ Number( elHeight ) +'px;';
		fill = 'fill: '+elFill+';';

		if( elOut == 'true' ) {
			if( elPos == 'bottom' ) {
				outside = '#'+ elId +'.shape-divider { bottom: -'+( Number( elHeight ) - 1 ) +'px; } ';
			} else {
				outside = '#'+ elId +'.shape-divider { top: -'+( Number( elHeight ) - 1 ) +'px; } ';
			}
		}

		let css = outside + '#'+ elId +'.shape-divider svg { '+ width + height +' } #'+ elId +'.shape-divider .shape-divider-fill { '+ fill +' }',
			style = document.createElement('style');

		core.getVars.elHead.appendChild(style);

		style.appendChild(document.createTextNode(css));

		element.setAttribute( 'id', elId );

		switch( elShape ){

			case 'valley':
				shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 355" preserveAspectRatio="none"><defs><style>.b{opacity:.5}.c{opacity:.3}</style></defs><path fill="none" d="M999.45 0H0v165.72l379.95 132.46L999.45 0z"></path><path class="b shape-divider-fill" d="M379.95 298.18l28.47 9.92L1000 118.75V0h-.55l-619.5 298.18zM492.04 337.25L1000 252.63V118.75L408.42 308.1l83.62 29.15z"></path><path class="b shape-divider-fill" d="M492.04 337.25L1000 252.63V118.75L408.42 308.1l83.62 29.15z"></path><path class="shape-divider-fill" d="M530.01 350.49l20.22 4.51H1000V252.63l-507.96 84.62 37.97 13.24z"></path><path class="b shape-divider-fill" d="M530.01 350.49l20.22 4.51H1000V252.63l-507.96 84.62 37.97 13.24z"></path><path class="b shape-divider-fill" d="M530.01 350.49l20.22 4.51H1000V252.63l-507.96 84.62 37.97 13.24z"></path><path class="shape-divider-fill" d="M542.94 355h7.29l-20.22-4.51 12.93 4.51z"></path><path class="b shape-divider-fill" d="M542.94 355h7.29l-20.22-4.51 12.93 4.51z"></path><path class="c shape-divider-fill" d="M542.94 355h7.29l-20.22-4.51 12.93 4.51z"></path><path class="b shape-divider-fill" d="M542.94 355h7.29l-20.22-4.51 12.93 4.51z"></path><path class="c shape-divider-fill" d="M379.95 298.18L0 165.72v66.59l353.18 78.75 26.77-12.88z"></path><path class="c shape-divider-fill" d="M353.18 311.06L0 232.31v71.86l288.42 38.06 64.76-31.17z"></path><path class="c shape-divider-fill" d="M353.18 311.06L0 232.31v71.86l288.42 38.06 64.76-31.17z"></path><path class="b shape-divider-fill" d="M380.28 317.11l28.14-9.01-28.47-9.92-26.77 12.88 27.1 6.05z"></path><path class="c shape-divider-fill" d="M380.28 317.11l28.14-9.01-28.47-9.92-26.77 12.88 27.1 6.05z"></path><path class="b shape-divider-fill" d="M479.79 339.29l12.25-2.04-83.62-29.15-28.14 9.01 99.51 22.18z"></path><path class="b shape-divider-fill" d="M479.79 339.29l12.25-2.04-83.62-29.15-28.14 9.01 99.51 22.18z"></path><path class="c shape-divider-fill" d="M479.79 339.29l12.25-2.04-83.62-29.15-28.14 9.01 99.51 22.18z"></path><path class="shape-divider-fill" d="M530.01 350.49l-37.97-13.24-12.25 2.04 50.22 11.2z"></path><path class="b shape-divider-fill" d="M530.01 350.49l-37.97-13.24-12.25 2.04 50.22 11.2z"></path><path class="b shape-divider-fill" d="M530.01 350.49l-37.97-13.24-12.25 2.04 50.22 11.2z"></path><path class="c shape-divider-fill" d="M530.01 350.49l-37.97-13.24-12.25 2.04 50.22 11.2zM288.42 342.23l9.46 1.25 82.4-26.37-27.1-6.05-64.76 31.17z"></path><path class="b shape-divider-fill" d="M288.42 342.23l9.46 1.25 82.4-26.37-27.1-6.05-64.76 31.17z"></path><path class="c shape-divider-fill" d="M288.42 342.23l9.46 1.25 82.4-26.37-27.1-6.05-64.76 31.17z"></path><path class="b shape-divider-fill" d="M380.28 317.11l-82.4 26.37 87.3 11.52h.34l94.27-15.71-99.51-22.18z"></path><path class="c shape-divider-fill" d="M380.28 317.11l-82.4 26.37 87.3 11.52h.34l94.27-15.71-99.51-22.18z"></path><path class="b shape-divider-fill" d="M380.28 317.11l-82.4 26.37 87.3 11.52h.34l94.27-15.71-99.51-22.18z"></path><path class="c shape-divider-fill" d="M380.28 317.11l-82.4 26.37 87.3 11.52h.34l94.27-15.71-99.51-22.18z"></path><path class="shape-divider-fill" d="M479.79 339.29L385.52 355h157.42l-12.93-4.51-50.22-11.2z"></path><path class="b shape-divider-fill" d="M479.79 339.29L385.52 355h157.42l-12.93-4.51-50.22-11.2z"></path><path class="c shape-divider-fill" d="M479.79 339.29L385.52 355h157.42l-12.93-4.51-50.22-11.2z"></path><path class="b shape-divider-fill" d="M479.79 339.29L385.52 355h157.42l-12.93-4.51-50.22-11.2z"></path><path class="c shape-divider-fill" d="M479.79 339.29L385.52 355h157.42l-12.93-4.51-50.22-11.2z"></path><path class="shape-divider-fill" d="M288.42 342.23L0 304.17V355h385.18l-87.3-11.52-9.46-1.25z"></path></svg>';
				break;

			case 'valley-2':
				shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100" preserveAspectRatio="none"><path class="shape-divider-fill" d="M194,99c186.7,0.7,305-78.3,306-97.2c1,18.9,119.3,97.9,306,97.2c114.3-0.3,194,0.3,194,0.3s0-91.7,0-100c0,0,0,0,0-0 L0,0v99.3C0,99.3,79.7,98.7,194,99z"></path></svg>';
				break;

			case 'valley-3':
				shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 140" preserveAspectRatio="none"><path class="shape-divider-fill" d="M1280 0L640 70 0 0v140l640-70 640 70V0z" opacity="0.5"></path><path class="shape-divider-fill" d="M1280 0H0l640 70 640-70z"></path></svg>';
				break;

			case 'mountain':
				shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100" preserveAspectRatio="none"><path class="shape-divider-fill" d="M500,98.9L0,6.1V0h1000v6.1L500,98.9z"></path></svg>';
				break;

			case 'mountain-2':
				shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 140" preserveAspectRatio="none"><path class="shape-divider-fill" d="M640 140L1280 0H0z" opacity="0.5"/><path class="shape-divider-fill" d="M640 98l640-98H0z"/></svg>';
				break;

			case 'mountain-3':
				shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 491.58" preserveAspectRatio="none"><g style="isolation:isolate"><path class="shape-divider-fill" d="M1000 479.4v-87.96L500 0 0 391.46v87.96l500-335.94 500 335.92z" opacity="0.12" mix-blend-mode="overlay"/><path class="shape-divider-fill" d="M1000 487.31v-7.91L500 143.48 0 479.42v7.91l500-297.96 500 297.94z" opacity="0.25" mix-blend-mode="overlay"/><path class="shape-divider-fill" d="M1000 487.31L500 189.37 0 487.33v4.25h1000v-4.27z"/></g></svg>';
				break;

			case 'mountain-4':
				shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100" preserveAspectRatio="none"><path class="shape-divider-fill" d="M738,99l262-93V0H0v5.6L738,99z"></path></svg>';
				break;

			case 'mountain-5':
				shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 140" preserveAspectRatio="none"><path class="shape-divider-fill" d="M978.81 122.25L0 0h1280l-262.1 116.26a73.29 73.29 0 0 1-39.09 5.99z" opacity="0.5"></path><path class="shape-divider-fill" d="M983.19 95.23L0 0h1280l-266 91.52a72.58 72.58 0 0 1-30.81 3.71z"></path></svg>';
				break;

			case 'mountains':
				shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100" preserveAspectRatio="none"><path class="shape-divider-fill" opacity="0.33" d="M473,67.3c-203.9,88.3-263.1-34-320.3,0C66,119.1,0,59.7,0,59.7V0h1000v59.7 c0,0-62.1,26.1-94.9,29.3c-32.8,3.3-62.8-12.3-75.8-22.1C806,49.6,745.3,8.7,694.9,4.7S492.4,59,473,67.3z"></path><path class="shape-divider-fill" opacity="0.66" d="M734,67.3c-45.5,0-77.2-23.2-129.1-39.1c-28.6-8.7-150.3-10.1-254,39.1 s-91.7-34.4-149.2,0C115.7,118.3,0,39.8,0,39.8V0h1000v36.5c0,0-28.2-18.5-92.1-18.5C810.2,18.1,775.7,67.3,734,67.3z"></path><path class="shape-divider-fill" d="M766.1,28.9c-200-57.5-266,65.5-395.1,19.5C242,1.8,242,5.4,184.8,20.6C128,35.8,132.3,44.9,89.9,52.5C28.6,63.7,0,0,0,0 h1000c0,0-9.9,40.9-83.6,48.1S829.6,47,766.1,28.9z"></path></svg>';
				break;

			case 'mountains-2':
				shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 247" preserveAspectRatio="none"><path class="shape-divider-fill" d="M0 200.92v.26l.75-.77-.75.51z"></path><path class="shape-divider-fill" d="M279.29 208.39c0-4.49 74.71-29.88 74.71-29.88l61.71 61.26L550 153.1l134.14 88.17L874.28 50 1000 178.51v-.33L874.28 0 684.14 191.27 550 103.1l-134.29 86.67L354 128.51s-74.71 25.39-74.71 29.88S144.23 52.08 144.23 52.08L.75 200.41l143.48-98.33s135.06 110.8 135.06 106.31z" opacity="0.25" isolation="isolate"></path><path class="shape-divider-fill" d="M1000 178.51L874.28 50 684.14 241.27 550 153.1l-134.29 86.67L354 178.51s-74.71 25.39-74.71 29.88-135.06-106.31-135.06-106.31L.75 200.41l-.75.77V247h1000z"></path><path class="shape-divider-fill" d="M1000 178.51L874.28 50 684.14 241.27 550 153.1l-134.29 86.67L354 178.51s-74.71 25.39-74.71 29.88-135.06-106.31-135.06-106.31L.75 200.41l-.75.77V247h1000z" opacity="0.25" isolation="isolate"></path></svg>';
				break;

			case 'mountains-3':
				shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100" preserveAspectRatio="none"><path class="shape-divider-fill" d="M761.9,44.1L643.1,27.2L333.8,98L0,3.8V0l1000,0v3.9"></path></svg>';
				break;

			case 'mountains-4':
				shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 140" preserveAspectRatio="none"><path class="shape-divider-fill" d="M0 90.72l140-28.28 315.52 24.14L796.48 65.8 1140 104.89l140-14.17V0H0v90.72z" opacity="0.5"></path><path class="shape-divider-fill" d="M0 0v47.44L170 0l626.48 94.89L1110 87.11l170-39.67V0H0z"></path></svg>';
				break;

			case 'plataeu':
				shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 140" preserveAspectRatio="none"><path class="shape-divider-fill" d="M1280 0l-131.81 111.68c-16.47 14-35.47 21-54.71 20.17L173 94a76.85 76.85 0 0 1-36.79-11.46L0 0z"></path></svg>';
				break;

			case 'plataeu-2':
				shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 140" preserveAspectRatio="none"><path class="shape-divider-fill" d="M1093.48 131.85L173 94a76.85 76.85 0 0 1-36.79-11.46L0 0h1280l-131.81 111.68c-16.47 13.96-35.47 20.96-54.71 20.17z" opacity="0.5"></path><path class="shape-divider-fill" d="M1094.44 119L172.7 68.72a74.54 74.54 0 0 1-25.19-5.95L0 0h1280l-133.85 102c-15.84 12.09-33.7 17.95-51.71 17z"></path></svg>';
				break;

			case 'hills':
				shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 140" preserveAspectRatio="none"><path class="shape-divider-fill" d="M156.258 127.903l86.363-18.654 78.684 13.079L411.441 99.4l94.454 10.303L582.82 93.8l82.664 18.728 76.961-11.39L816.109 71.4l97.602 9.849L997.383 50.4l66.285 14.694 70.793-24.494h79.863L1280 0H0v122.138l60.613 9.965z"/></svg>';
				break;

			case 'hills-2':
				shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 140" preserveAspectRatio="none"><path class="shape-divider-fill" d="M1214.323 66.051h-79.863l-70.793 18.224-66.285-10.933-83.672 22.953-97.601-7.328-73.664 22.125-76.961 8.475-82.664-13.934-76.926 11.832-94.453-7.666-90.137 17.059-78.684-9.731-86.363 13.879-95.644 3.125L0 126.717V0h1280l-.001 35.844z" opacity="0.5"></path><path class="shape-divider-fill" d="M0 0h1280v.006l-70.676 36.578-74.863 4.641-70.793 23.334-66.285-11.678-83.672 29.618-97.602-7.07-63.664 21.421-76.961 12.649-91.664-20.798-77.926 17.66-94.453-7.574-90.137 21.595-78.683-9.884-86.363 16.074-95.645 6.211L0 127.905z"></path></svg>';
				break;

			case 'hills-3':
				shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 140" preserveAspectRatio="none"><path class="shape-divider-fill" d="M156 35.51l95.46 34.84 120.04.24 71.5 33.35 90.09-3.91L640 137.65l102.39-37.17 85.55 10.65 88.11-7.19L992 65.28l73.21 5.31 66.79-22.1 77-.42L1280 0H0l64.8 38.69 91.2-3.18z"/></svg>';
				break;

			case 'hills-4':
				shape = '<svg viewBox="0 0 1280 140" preserveAspectRatio="none"><path class="shape-divider-fill" d="M156 35.41l95.46 34.73 120.04.25 71.5 33.24 90.09-3.89L640 137.25l102.39-37.06 85.55 10.61 88.11-7.17L992 65.08l73.21 5.31L1132 48.35l77-.42L1280 0H0l64.8 38.57 91.2-3.16z" opacity="0.5"/><path class="shape-divider-fill" d="M156 28.32l95.46 27.79 120.04.2L443 82.9l90.09-3.11L640 109.8l102.39-29.65 85.55 8.49 88.11-5.74L992 52.07l73.21 4.24L1132 38.68l77-.34L1280 0H0l64.8 30.86 91.2-2.54z"/></svg>';
				break;

			case 'cloud':
				shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 283.5 27.8" preserveAspectRatio="xMidYMax slice"><path class="shape-divider-fill" d="M0 0v6.7c1.9-.8 4.7-1.4 8.5-1 9.5 1.1 11.1 6 11.1 6s2.1-.7 4.3-.2c2.1.5 2.8 2.6 2.8 2.6s.2-.5 1.4-.7c1.2-.2 1.7.2 1.7.2s0-2.1 1.9-2.8c1.9-.7 3.6.7 3.6.7s.7-2.9 3.1-4.1 4.7 0 4.7 0 1.2-.5 2.4 0 1.7 1.4 1.7 1.4h1.4c.7 0 1.2.7 1.2.7s.8-1.8 4-2.2c3.5-.4 5.3 2.4 6.2 4.4.4-.4 1-.7 1.8-.9 2.8-.7 4 .7 4 .7s1.7-5 11.1-6c9.5-1.1 12.3 3.9 12.3 3.9s1.2-4.8 5.7-5.7c4.5-.9 6.8 1.8 6.8 1.8s.6-.6 1.5-.9c.9-.2 1.9-.2 1.9-.2s5.2-6.4 12.6-3.3c7.3 3.1 4.7 9 4.7 9s1.9-.9 4 0 2.8 2.4 2.8 2.4 1.9-1.2 4.5-1.2 4.3 1.2 4.3 1.2.2-1 1.4-1.7 2.1-.7 2.1-.7-.5-3.1 2.1-5.5 5.7-1.4 5.7-1.4 1.5-2.3 4.2-1.1c2.7 1.2 1.7 5.2 1.7 5.2s.3-.1 1.3.5c.5.4.8.8.9 1.1.5-1.4 2.4-5.8 8.4-4 7.1 2.1 3.5 8.9 3.5 8.9s.8-.4 2 0 1.1 1.1 1.1 1.1 1.1-1.1 2.3-1.1 2.1.5 2.1.5 1.9-3.6 6.2-1.2 1.9 6.4 1.9 6.4 2.6-2.4 7.4 0c3.4 1.7 3.9 4.9 3.9 4.9s3.3-6.9 10.4-7.9 11.5 2.6 11.5 2.6.8 0 1.2.2c.4.2.9.9.9.9s4.4-3.1 8.3.2c1.9 1.7 1.5 5 1.5 5s.3-1.1 1.6-1.4c1.3-.3 2.3.2 2.3.2s-.1-1.2.5-1.9 1.9-.9 1.9-.9-4.7-9.3 4.4-13.4c5.6-2.5 9.2.9 9.2.9s5-6.2 15.9-6.2 16.1 8.1 16.1 8.1.7-.2 1.6-.4V0H0z"></path></svg>';
				break;

			case 'cloud-2':
				shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 86" preserveAspectRatio="xMidYMid slice"><path class="shape-divider-fill" d="M1280 0H0v65.2c6.8 0 13.5.9 20.1 2.6 14-21.8 43.1-28 64.8-14 5.6 3.6 10.3 8.3 14 13.9 7.3-1.2 14.8-.6 21.8 1.6 2.1-37.3 34.1-65.8 71.4-63.7 24.3 1.4 46 15.7 56.8 37.6 19-17.6 48.6-16.5 66.3 2.4C323 54 327.4 65 327.7 76.5c.4.2.8.4 1.2.7 3.3 1.9 6.3 4.2 8.9 6.9 15.9-23.8 46.1-33.4 72.8-23.3 11.6-31.9 46.9-48.3 78.8-36.6 9.1 3.3 17.2 8.7 23.8 15.7 6.7-6.6 16.7-8.4 25.4-4.8 29.3-37.4 83.3-44 120.7-14.8 14 11 24.3 26.1 29.4 43.1 4.7.6 9.3 1.8 13.6 3.8 7.8-24.7 34.2-38.3 58.9-30.5 14.4 4.6 25.6 15.7 30.3 30 14.2 1.2 27.7 6.9 38.5 16.2 11.1-35.7 49-55.7 84.7-44.7 14.1 4.4 26.4 13.3 35 25.3 12-5.7 26.1-5.5 37.9.6 3.9-11.6 15.5-18.9 27.7-17.5.2-.3.3-.6.5-.9 23.3-41.4 75.8-56 117.2-32.6 14.1 7.9 25.6 19.7 33.3 33.8 28.8-23.8 71.5-19.8 95.3 9 2.6 3.1 4.9 6.5 6.9 10 3.8-.5 7.6-.8 11.4-.8L1280 0z"/></svg>';
				break;

			case 'cloud-3':
				shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 86" preserveAspectRatio="xMidYMid slice"><path class="shape-divider-fill" d="M833.9 27.5c-5.8 3.2-11 7.3-15.5 12.2-7.1-6.9-17.5-8.8-26.6-5-30.6-39.2-87.3-46.1-126.5-15.5-1.4 1.1-2.8 2.2-4.1 3.4C674.4 33.4 684 48 688.8 64.3c4.7.6 9.3 1.8 13.6 3.8 7.8-24.7 34.2-38.3 58.9-30.5 14.4 4.6 25.6 15.7 30.3 30 14.2 1.2 27.7 6.9 38.5 16.2C840.6 49.6 876 29.5 910.8 38c-20.4-20.3-51.8-24.6-76.9-10.5zM384 43.9c-9 5-16.7 11.9-22.7 20.3 15.4-7.8 33.3-8.7 49.4-2.6 3.7-10.1 9.9-19.1 18.1-26-15.4-2.3-31.2.6-44.8 8.3zm560.2 13.6c2 2.2 3.9 4.5 5.7 6.9 5.6-2.6 11.6-4 17.8-4.1-7.6-2.4-15.6-3.3-23.5-2.8zM178.7 7c29-4.2 57.3 10.8 70.3 37 8.9-8.3 20.7-12.8 32.9-12.5C256.4 1.8 214.7-8.1 178.7 7zm146.5 56.3c1.5 4.5 2.4 9.2 2.5 14 .4.2.8.4 1.2.7 3.3 1.9 6.3 4.2 8.9 6.9 5.8-8.7 13.7-15.7 22.9-20.5-11.1-5.2-23.9-5.6-35.5-1.1zM33.5 54.9c21.6-14.4 50.7-8.5 65 13 .1.2.2.3.3.5 7.3-1.2 14.8-.6 21.8 1.6.6-10.3 3.5-20.4 8.6-29.4.3-.6.7-1.2 1.1-1.8-32.1-17.2-71.9-10.6-96.8 16.1zm1228.9 2.7c2.3 2.9 4.4 5.9 6.2 9.1 3.8-.5 7.6-.8 11.4-.8V48.3c-6.4 1.8-12.4 5-17.6 9.3zM1127.3 11c1.9.9 3.7 1.8 5.6 2.8 14.2 7.9 25.8 19.7 33.5 34 13.9-11.4 31.7-16.9 49.6-15.3-20.5-27.7-57.8-36.8-88.7-21.5z" opacity="0.5"/><path class="shape-divider-fill" d="M0 0v66c6.8 0 13.5.9 20.1 2.6 3.5-5.4 8.1-10.1 13.4-13.6 24.9-26.8 64.7-33.4 96.8-16 10.5-17.4 28.2-29.1 48.3-32 36.1-15.1 77.7-5.2 103.2 24.5 19.7.4 37.1 13.1 43.4 31.8 11.5-4.5 24.4-4.2 35.6 1.1l.4-.2c15.4-21.4 41.5-32.4 67.6-28.6 25-21 62.1-18.8 84.4 5.1 6.7-6.6 16.7-8.4 25.4-4.8 29.2-37.4 83.3-44.1 120.7-14.8l1.8 1.5c37.3-32.9 94.3-29.3 127.2 8 1.2 1.3 2.3 2.7 3.4 4.1 9.1-3.8 19.5-1.9 26.6 5 24.3-26 65-27.3 91-3.1.5.5 1 .9 1.5 1.4 12.8 3.1 24.4 9.9 33.4 19.5 7.9-.5 15.9.4 23.5 2.8 7-.1 13.9 1.5 20.1 4.7 3.9-11.6 15.5-18.9 27.7-17.5.2-.3.3-.6.5-.9 22.1-39.2 70.7-54.7 111.4-35.6 30.8-15.3 68.2-6.2 88.6 21.5 18.3 1.7 35 10.8 46.5 25.1 5.2-4.3 11.1-7.4 17.6-9.3V0H0z"/></svg>';
				break;

			case 'wave':
				shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100" preserveAspectRatio="none"><path class="shape-divider-fill" d="M421.9,6.5c22.6-2.5,51.5,0.4,75.5,5.3c23.6,4.9,70.9,23.5,100.5,35.7c75.8,32.2,133.7,44.5,192.6,49.7c23.6,2.1,48.7,3.5,103.4-2.5c54.7-6,106.2-25.6,106.2-25.6V0H0v30.3c0,0,72,32.6,158.4,30.5c39.2-0.7,92.8-6.7,134-22.4c21.2-8.1,52.2-18.2,79.7-24.2C399.3,7.9,411.6,7.5,421.9,6.5z"></path></svg>';
				break;

			case 'wave-2':
				shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 283.5 27.8" preserveAspectRatio="none"><path class="shape-divider-fill" d="M283.5,9.7c0,0-7.3,4.3-14,4.6c-6.8,0.3-12.6,0-20.9-1.5c-11.3-2-33.1-10.1-44.7-5.7	s-12.1,4.6-18,7.4c-6.6,3.2-20,9.6-36.6,9.3C131.6,23.5,99.5,7.2,86.3,8c-1.4,0.1-6.6,0.8-10.5,2c-3.8,1.2-9.4,3.8-17,4.7 c-3.2,0.4-8.3,1.1-14.2,0.9c-1.5-0.1-6.3-0.4-12-1.6c-5.7-1.2-11-3.1-15.8-3.7C6.5,9.2,0,10.8,0,10.8V0h283.5V9.7z M260.8,11.3 c-0.7-1-2-0.4-4.3-0.4c-2.3,0-6.1-1.2-5.8-1.1c0.3,0.1,3.1,1.5,6,1.9C259.7,12.2,261.4,12.3,260.8,11.3z M242.4,8.6 c0,0-2.4-0.2-5.6-0.9c-3.2-0.8-10.3-2.8-15.1-3.5c-8.2-1.1-15.8,0-15.1,0.1c0.8,0.1,9.6-0.6,17.6,1.1c3.3,0.7,9.3,2.2,12.4,2.7	C239.9,8.7,242.4,8.6,242.4,8.6z M185.2,8.5c1.7-0.7-13.3,4.7-18.5,6.1c-2.1,0.6-6.2,1.6-10,2c-3.9,0.4-8.9,0.4-8.8,0.5	c0,0.2,5.8,0.8,11.2,0c5.4-0.8,5.2-1.1,7.6-1.6C170.5,14.7,183.5,9.2,185.2,8.5z M199.1,6.9c0.2,0-0.8-0.4-4.8,1.1 c-4,1.5-6.7,3.5-6.9,3.7c-0.2,0.1,3.5-1.8,6.6-3C197,7.5,199,6.9,199.1,6.9z M283,6c-0.1,0.1-1.9,1.1-4.8,2.5s-6.9,2.8-6.7,2.7	c0.2,0,3.5-0.6,7.4-2.5C282.8,6.8,283.1,5.9,283,6z M31.3,11.6c0.1-0.2-1.9-0.2-4.5-1.2s-5.4-1.6-7.8-2C15,7.6,7.3,8.5,7.7,8.6	C8,8.7,15.9,8.3,20.2,9.3c2.2,0.5,2.4,0.5,5.7,1.6S31.2,11.9,31.3,11.6z M73,9.2c0.4-0.1,3.5-1.6,8.4-2.6c4.9-1.1,8.9-0.5,8.9-0.8 c0-0.3-1-0.9-6.2-0.3S72.6,9.3,73,9.2z M71.6,6.7C71.8,6.8,75,5.4,77.3,5c2.3-0.3,1.9-0.5,1.9-0.6c0-0.1-1.1-0.2-2.7,0.2	C74.8,5.1,71.4,6.6,71.6,6.7z M93.6,4.4c0.1,0.2,3.5,0.8,5.6,1.8c2.1,1,1.8,0.6,1.9,0.5c0.1-0.1-0.8-0.8-2.4-1.3	C97.1,4.8,93.5,4.2,93.6,4.4z M65.4,11.1c-0.1,0.3,0.3,0.5,1.9-0.2s2.6-1.3,2.2-1.2s-0.9,0.4-2.5,0.8C65.3,10.9,65.5,10.8,65.4,11.1 z M34.5,12.4c-0.2,0,2.1,0.8,3.3,0.9c1.2,0.1,2,0.1,2-0.2c0-0.3-0.1-0.5-1.6-0.4C36.6,12.8,34.7,12.4,34.5,12.4z M152.2,21.1 c-0.1,0.1-2.4-0.3-7.5-0.3c-5,0-13.6-2.4-17.2-3.5c-3.6-1.1,10,3.9,16.5,4.1C150.5,21.6,152.3,21,152.2,21.1z"></path><path class="shape-divider-fill" d="M269.6,18c-0.1-0.1-4.6,0.3-7.2,0c-7.3-0.7-17-3.2-16.6-2.9c0.4,0.3,13.7,3.1,17,3.3	C267.7,18.8,269.7,18,269.6,18z"></path><path class="shape-divider-fill" d="M227.4,9.8c-0.2-0.1-4.5-1-9.5-1.2c-5-0.2-12.7,0.6-12.3,0.5c0.3-0.1,5.9-1.8,13.3-1.2	S227.6,9.9,227.4,9.8z"></path><path class="shape-divider-fill" d="M204.5,13.4c-0.1-0.1,2-1,3.2-1.1c1.2-0.1,2,0,2,0.3c0,0.3-0.1,0.5-1.6,0.4	C206.4,12.9,204.6,13.5,204.5,13.4z"></path><path class="shape-divider-fill" d="M201,10.6c0-0.1-4.4,1.2-6.3,2.2c-1.9,0.9-6.2,3.1-6.1,3.1c0.1,0.1,4.2-1.6,6.3-2.6	S201,10.7,201,10.6z"></path><path class="shape-divider-fill" d="M154.5,26.7c-0.1-0.1-4.6,0.3-7.2,0c-7.3-0.7-17-3.2-16.6-2.9c0.4,0.3,13.7,3.1,17,3.3	C152.6,27.5,154.6,26.8,154.5,26.7z"></path><path class="shape-divider-fill" d="M41.9,19.3c0,0,1.2-0.3,2.9-0.1c1.7,0.2,5.8,0.9,8.2,0.7c4.2-0.4,7.4-2.7,7-2.6	c-0.4,0-4.3,2.2-8.6,1.9c-1.8-0.1-5.1-0.5-6.7-0.4S41.9,19.3,41.9,19.3z"></path><path class="shape-divider-fill" d="M75.5,12.6c0.2,0.1,2-0.8,4.3-1.1c2.3-0.2,2.1-0.3,2.1-0.5c0-0.1-1.8-0.4-3.4,0	C76.9,11.5,75.3,12.5,75.5,12.6z"></path><path class="shape-divider-fill" d="M15.6,13.2c0-0.1,4.3,0,6.7,0.5c2.4,0.5,5,1.9,5,2c0,0.1-2.7-0.8-5.1-1.4	C19.9,13.7,15.7,13.3,15.6,13.2z"></path></svg>';
				break;

			case 'wave-3':
				shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1047.1 3.7" preserveAspectRatio="xMidYMin slice"><path class="shape-divider-fill" d="M1047.1,0C557,0,8.9,0,0,0v1.6c0,0,0.6-1.5,2.7-0.3C3.9,2,6.1,4.1,8.3,3.5c0.9-0.2,1.5-1.9,1.5-1.9	s0.6-1.5,2.7-0.3C13.8,2,16,4.1,18.2,3.5c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3C23.6,2,25.9,4.1,28,3.5c0.9-0.2,1.5-1.9,1.5-1.9	c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2	c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3C63,2,65.3,4.1,67.4,3.5	C68.3,3.3,69,1.6,69,1.6s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3	C82.7,2,85,4.1,87.1,3.5c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3C92.6,2,94.8,4.1,97,3.5c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3	c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9	c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2	c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3	c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9	c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2	c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3	c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9	c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2	c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3	c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9	s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2	c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3	c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9	s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2	c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3	c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9	s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2	c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3	c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9	s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2	c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3	c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9	s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2	c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3	c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9	s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2	c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3	c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9	c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2	c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3	c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9	c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2	c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3	c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9	c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2	c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3	c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9	s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2	c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3	c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9	s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2	c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3	c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9	s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2	c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3	c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9	s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2	c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3	c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9	s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2	c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3	c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9	s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2	c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3	c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9	c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2	c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3	c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.6-0.4V0z M2.5,1.2C2.5,1.2,2.5,1.2,2.5,1.2C2.5,1.2,2.5,1.2,2.5,1.2z M2.7,1.4c0.1,0,0.1,0.1,0.1,0.1C2.8,1.4,2.8,1.4,2.7,1.4z"></path></svg>';
				break;

			case 'wave-4':
				shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 140" preserveAspectRatio="none"><path class="shape-divider-fill" d="M0 51.76c36.21-2.25 77.57-3.58 126.42-3.58 320 0 320 57 640 57 271.15 0 312.58-40.91 513.58-53.4V0H0z" opacity="0.3"></path><path class="shape-divider-fill" d="M0 24.31c43.46-5.69 94.56-9.25 158.42-9.25 320 0 320 89.24 640 89.24 256.13 0 307.28-57.16 481.58-80V0H0z" opacity="0.5"></path><path class="shape-divider-fill" d="M0 0v3.4C28.2 1.6 59.4.59 94.42.59c320 0 320 84.3 640 84.3 285 0 316.17-66.85 545.58-81.49V0z"></path></svg>';
				break;

			case 'wave-5':
				shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 140" preserveAspectRatio="none"><path class="shape-divider-fill" d="M0 0v100c20 17.3 40 29.51 80 29.51 51.79 0 74.69-48.57 151.75-48.57 73.72 0 91 54.88 191.56 54.88C543.95 135.8 554 14 665.69 14c109.46 0 98.85 87 188.2 87 70.37 0 69.81-33.73 115.6-33.73 55.85 0 62 39.62 115.6 39.62 58.08 0 57.52-46.59 115-46.59 39.8 0 60 22.48 79.89 39.69V0z"></path></svg>';
				break;

			case 'wave-6':
				shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 140" preserveAspectRatio="none"><path class="shape-divider-fill" d="M504.854,80.066c7.812,0,14.893,0.318,21.41,0.879 c-25.925,22.475-56.093,40.852-102.946,40.852c-20.779,0-37.996-2.349-52.898-6.07C413.517,107.295,434.056,80.066,504.854,80.066z M775.938,51.947c19.145,18.596,39.097,35.051,77.956,35.051c46.907,0,62.299-14.986,80.912-24.98 c-21.357-15.783-46.804-28.348-85.489-28.348C816.829,33.671,794.233,41.411,775.938,51.947z" opacity="0.3"></path><path class="shape-divider-fill" d="M1200.112,46.292c39.804,0,59.986,22.479,79.888,39.69v16.805 c-19.903-10.835-40.084-21.777-79.888-21.777c-72.014,0-78.715,43.559-147.964,43.559c-56.84,0-81.247-35.876-117.342-62.552 c9.309-4.998,19.423-8.749,34.69-8.749c55.846,0,61.99,39.617,115.602,39.617C1143.177,92.887,1142.618,46.292,1200.112,46.292z M80.011,115.488c-40.006,0-60.008-12.206-80.011-29.506v16.806c20.003,10.891,40.005,21.782,80.011,21.782 c80.004,0,78.597-30.407,137.669-30.407c55.971,0,62.526,24.026,126.337,24.026c9.858,0,18.509-0.916,26.404-2.461 c-57.186-14.278-80.177-48.808-138.66-48.808C154.698,66.919,131.801,115.488,80.011,115.488z M526.265,80.945 c56.848,4.902,70.056,28.726,137.193,28.726c54.001,0,73.43-35.237,112.48-57.724C751.06,27.782,727.548,0,665.691,0 C597.381,0,567.086,45.555,526.265,80.945z" opacity="0.5"></path><path class="shape-divider-fill" d="M0,0v85.982c20.003,17.3,40.005,29.506,80.011,29.506c51.791,0,74.688-48.569,151.751-48.569 c58.482,0,81.473,34.531,138.66,48.808c43.096-8.432,63.634-35.662,134.433-35.662c7.812,0,14.893,0.318,21.41,0.879 C567.086,45.555,597.381,0,665.691,0c61.856,0,85.369,27.782,110.246,51.947c18.295-10.536,40.891-18.276,73.378-18.276 c38.685,0,64.132,12.564,85.489,28.348c9.309-4.998,19.423-8.749,34.69-8.749c55.846,0,61.99,39.617,115.602,39.617 c58.08,0,57.521-46.595,115.015-46.595c39.804,0,59.986,22.479,79.888,39.69V0H0z"></path></svg>';
				break;

			case 'slant':
				shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100" preserveAspectRatio="none"><path class="shape-divider-fill" d="M0,6V0h1000v100L0,6z"></path></svg>';
				break;

			case 'slant-2':
				shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2600 131.1" preserveAspectRatio="none"><path class="shape-divider-fill" d="M0 0L2600 0 2600 69.1 0 0z"></path><path class="shape-divider-fill" opacity="0.5" d="M0 0L2600 0 2600 69.1 0 69.1z"></path><path class="shape-divider-fill" opacity="0.25" d="M2600 0L0 0 0 130.1 2600 69.1z"></path></svg>';
				break;

			case 'slant-3':
				shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 140" preserveAspectRatio="none"><path class="shape-divider-fill" d="M1280 140V0H0l1280 140z" opacity="0.5"></path><path class="shape-divider-fill" d="M1280 98V0H0l1280 98z"></path></svg>';
				break;

			case 'rounded':
				shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100" preserveAspectRatio="none"><path class="shape-divider-fill" d="M1000,4.3V0H0v4.3C0.9,23.1,126.7,99.2,500,100S1000,22.7,1000,4.3z"></path></svg>';
				break;

			case 'rounded-2':
				shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100" preserveAspectRatio="none"><path class="shape-divider-fill" d="M0,0c0,0,0,6,0,6.7c0,18,240.2,93.6,615.2,92.6C989.8,98.5,1000,25,1000,6.7c0-0.7,0-6.7,0-6.7H0z"></path></svg>';
				break;

			case 'rounded-3':
				shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 140" preserveAspectRatio="none"><path class="shape-divider-fill" d="M0 0s573.08 140 1280 140V0z"></path></svg>';
				break;

			case 'rounded-4':
				shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 140" preserveAspectRatio="none"><path class="shape-divider-fill" d="M0 0v60s573.09 80 1280 80V0z" opacity="0.3"></path><path class="shape-divider-fill" d="M0 0v30s573.09 110 1280 110V0z" opacity="0.5"></path><path class="shape-divider-fill" d="M0 0s573.09 140 1280 140V0z"></path></svg>';
				break;

			case 'rounded-5':
				shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 140" preserveAspectRatio="none"><path class="shape-divider-fill" d="M0 0v.48C18.62 9.38 297.81 140 639.5 140 993.24 140 1280 0 1280 0z" opacity="0.3"></path><path class="shape-divider-fill" d="M0 .6c14 8.28 176.54 99.8 555.45 119.14C952.41 140 1280 0 1280 0H0z" opacity="0.5"></path><path class="shape-divider-fill" d="M726.29 101.2C1126.36 79.92 1281 0 1281 0H1c.05 0 325.25 122.48 725.29 101.2z"></path></svg>';
				break;

			case 'triangle':
				shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 10" preserveAspectRatio="none"><path class="shape-divider-fill" d="M350,10L340,0h20L350,10z"></path></svg>';
				break;

			case 'drops':
				shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 283.5 27.8" preserveAspectRatio="xMidYMax slice"><path class="shape-divider-fill" d="M0 0v1.4c.6.7 1.1 1.4 1.4 2 2 3.8 2.2 6.6 1.8 10.8-.3 3.3-2.4 9.4 0 12.3 1.7 2 3.7 1.4 4.6-.9 1.4-3.8-.7-8.2-.6-12 .1-3.7 3.2-5.5 6.9-4.9 4 .6 4.8 4 4.9 7.4.1 1.8-1.1 7 0 8.5.6.8 1.6 1.2 2.4.5 1.4-1.1.1-5.4.1-6.9.1-3.7.3-8.6 4.1-10.5 5-2.5 6.2 1.6 5.4 5.6-.4 1.7-1 9.2 2.9 6.3 1.5-1.1.7-3.5.5-4.9-.4-2.4-.4-4.3 1-6.5.9-1.4 2.4-3.1 4.2-3 2.4.1 2.7 2.2 4 3.7 1.5 1.8 1.8 2.2 3 .1 1.1-1.9 1.2-2.8 3.6-3.3 1.3-.3 4.8-1.4 5.9-.5 1.5 1.1.6 2.8.4 4.3-.2 1.1-.6 4 1.8 3.4 1.7-.4-.3-4.1.6-5.6 1.3-2.2 5.8-1.4 7 .5 1.3 2.1.5 5.8.1 8.1s-1.2 5-.6 7.4c1.3 5.1 4.4.9 4.3-2.4-.1-4.4-2-8.8-.5-13 .9-2.4 4.6-6.6 7.7-4.5 2.7 1.8.5 7.8.2 10.3-.2 1.7-.8 4.6.2 6.2.9 1.4 2 1.5 2.6-.3.5-1.5-.9-4.5-1-6.1-.2-1.7-.4-3.7.2-5.4 1.8-5.6 3.5 2.4 6.3.6 1.4-.9 4.3-9.4 6.1-3.1.6 2.2-1.3 7.8.7 8.9 4.2 2.3 1.5-7.1 2.2-8 3.1-4 4.7 3.8 6.1 4.1 3.1.7 2.8-7.9 8.1-4.5 1.7 1.1 2.9 3.3 3.2 5.2.4 2.2-1 4.5-.6 6.6 1 4.3 4.4 1.5 4.4-1.7 0-2.7-3-8.3 1.4-9.1 4.4-.9 7.3 3.5 7.8 6.9.3 2-1.5 10.9 1.3 11.3 4.1.6-3.2-15.7 4.8-15.8 4.7-.1 2.8 4.1 3.9 6.6 1 2.4 2.1 1 2.3-.8.3-1.9-.9-3.2 1.3-4.3 5.9-2.9 5.9 5.4 5.5 8.5-.3 2-1.7 8.4 2 8.1 6.9-.5-2.8-16.9 4.8-18.7 4.7-1.2 6.1 3.6 6.3 7.1.1 1.7-1.2 8.1.6 9.1 3.5 2 1.9-7 2-8.4.2-4 1.2-9.6 6.4-9.8 4.7-.2 3.2 4.6 2.7 7.5-.4 2.2 1.3 8.6 3.8 4.4 1.1-1.9-.3-4.1-.3-6 0-1.7.4-3.2 1.3-4.6 1-1.6 2.9-3.5 5.1-2.9 2.5.6 2.3 4.1 4.1 4.9 1.9.8 1.6-.9 2.3-2.1 1.2-2.1 2.1-2.1 4.4-2.4 1.4-.2 3.6-1.5 4.9-.5 2.3 1.7-.7 4.4.1 6.5.6 1.5 2.1 1.7 2.8.3.7-1.4-1.1-3.4-.3-4.8 1.4-2.5 6.2-1.2 7.2 1 2.3 4.8-3.3 12-.2 16.3 3 4.1 3.9-2.8 3.8-4.8-.4-4.3-2.1-8.9 0-13.1 1.3-2.5 5.9-5.7 7.9-2.4 2 3.2-1.3 9.8-.8 13.4.5 4.4 3.5 3.3 2.7-.8-.4-1.9-2.4-10 .6-11.1 3.7-1.4 2.8 7.2 6.5.4 2.2-4.1 4.9-3.1 5.2 1.2.1 1.5-.6 3.1-.4 4.6.2 1.9 1.8 3.7 3.3 1.3 1-1.6-2.6-10.4 2.9-7.3 2.6 1.5 1.6 6.5 4.8 2.7 1.3-1.5 1.7-3.6 4-3.7 2.2-.1 4 2.3 4.8 4.1 1.3 2.9-1.5 8.4.9 10.3 4.2 3.3 3-5.5 2.7-6.9-.6-3.9 1-7.2 5.5-5 4.1 2.1 4.3 7.7 4.1 11.6 0 .8-.6 9.5 2.5 5.2 1.2-1.7-.1-7.7.1-9.6.3-2.9 1.2-5.5 4.3-6.2 4.5-1 7.7 1.5 7.4 5.8-.2 3.5-1.8 7.7-.5 11.1 1 2.7 3.6 2.8 5 .2 1.6-3.1 0-8.3-.4-11.6-.4-4.2-.2-7 1.8-10.8 0 0-.1.1-.1.2-.2.4-.3.7-.4.8v.1c-.1.2-.1.2 0 0v-.1l.4-.8c0-.1.1-.1.1-.2.2-.4.5-.8.8-1.2V0H0zM282.7 3.4z"></path></svg>';
				break;

			case 'cliff':
				shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 279.24" preserveAspectRatio="none"><path class="shape-divider-fill" d="M1000 0S331.54-4.18 0 279.24h1000z" opacity="0.25"></path><path class="shape-divider-fill" d="M1000 279.24s-339.56-44.3-522.95-109.6S132.86 23.76 0 25.15v254.09z"></path></svg>';
				break;

			case 'zigzag':
				shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1800 5.8" preserveAspectRatio="none"><path class="shape-divider-fill" d="M5.4.4l5.4 5.3L16.5.4l5.4 5.3L27.5.4 33 5.7 38.6.4l5.5 5.4h.1L49.9.4l5.4 5.3L60.9.4l5.5 5.3L72 .4l5.5 5.3L83.1.4l5.4 5.3L94.1.4l5.5 5.4h.2l5.6-5.4 5.5 5.3 5.6-5.3 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.4h.2l5.6-5.4 5.4 5.3L161 .4l5.4 5.3L172 .4l5.5 5.3 5.6-5.3 5.4 5.3 5.7-5.3 5.4 5.4h.2l5.6-5.4 5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.4 5.3 5.6-5.3 5.5 5.4h.2l5.6-5.4 5.5 5.3L261 .4l5.4 5.3L272 .4l5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.4h.1l5.7-5.4 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.4 5.3 5.7-5.3 5.4 5.4h.2l5.6-5.4 5.5 5.3L361 .4l5.5 5.3 5.6-5.3 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.4h.1l5.7-5.4 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.4h.1l5.6-5.4 5.5 5.3L461 .4l5.5 5.3 5.6-5.3 5.4 5.3 5.7-5.3 5.4 5.3 5.6-5.3 5.5 5.4h.2l5.6-5.4 5.5 5.3 5.6-5.3 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.4h.1L550 .4l5.4 5.3L561 .4l5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.4 5.3 5.6-5.3 5.5 5.4h.2l5.6-5.4 5.5 5.3 5.6-5.3 5.4 5.3 5.7-5.3 5.4 5.3 5.6-5.3 5.5 5.4h.2L650 .4l5.5 5.3 5.6-5.3 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.4 5.4h.2l5.6-5.4 5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.4 5.3 5.6-5.3 5.5 5.4h.2L750 .4l5.5 5.3 5.6-5.3 5.4 5.3 5.7-5.3 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.4h.1l5.7-5.4 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.4 5.4h.2L850 .4l5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.4h.2l5.6-5.4 5.4 5.3 5.7-5.3 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.4h.1l5.7-5.4 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.4 5.3 5.6-5.3 5.5 5.4h.2l5.6-5.4 5.5 5.3 5.6-5.3 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.4h.2l5.6-5.4 5.4 5.3 5.7-5.3 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.4 5.4h.2l5.6-5.4 5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.4 5.3 5.6-5.3 5.5 5.4h.2l5.6-5.4 5.5 5.3 5.6-5.3 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.4h.1l5.7-5.4 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.4 5.4h.2l5.6-5.4 5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.4h.2l5.6-5.4 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.4h.1l5.7-5.4 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.4 5.3 5.6-5.3 5.5 5.4h.2l5.6-5.4 5.5 5.3 5.6-5.3 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.4h.2l5.6-5.4 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.4 5.3 5.7-5.3 5.4 5.4h.2l5.6-5.4 5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.4 5.3 5.6-5.3 5.5 5.4h.2l5.6-5.4 5.5 5.3 5.6-5.3 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.4h.1l5.6-5.4 5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.4 5.3 5.7-5.3 5.4 5.4h.2l5.6-5.4 5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.4h.1l5.7-5.4 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.4h.1l5.6-5.4 5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.4 5.3 5.7-5.3 5.4 5.3 5.6-5.3 5.5 5.4V0H-.2v5.8z"></path></svg>';
				break;

			case 'illusion':
				shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 283.5 19.6" preserveAspectRatio="none"><path class="shape-divider-fill" opacity="0.33" d="M0 0L0 18.8 141.8 4.1 283.5 18.8 283.5 0z"></path><path class="shape-divider-fill" opacity="0.33" d="M0 0L0 12.6 141.8 4 283.5 12.6 283.5 0z"></path><path class="shape-divider-fill" opacity="0.33" d="M0 0L0 6.4 141.8 4 283.5 6.4 283.5 0z"></path><path class="shape-divider-fill" d="M0 0L0 1.2 141.8 4 283.5 1.2 283.5 0z"></path></svg>';
				break;

			default:
				shape = '';
				break;

		}

		element.innerHTML = shape;
		element.querySelector('svg').classList.add( 'op-ts' );

		setTimeout(() => {
			element.querySelector('svg').classList.add( 'op-1' );
		}, 500);

		element.classList.add('shape-divider-complete');
	});
};

SEMICOLON.Core.getVars.fn.sidepanel = selector => {
	const core = SEMICOLON.Core;
	selector = core.getSelector( selector, false );
	if( selector.length < 1 ){
		return true;
	}

	let body = core.getVars.elBody.classList;

	document.addEventListener('click', e => {
		if( !e.target.closest('#side-panel') && !e.target.closest('.side-panel-trigger') ) {
			body.remove('side-panel-open');
		}
	}, false);

	document.querySelectorAll('.side-panel-trigger').forEach( el => {
		el.onclick = e => {
			body.toggle('side-panel-open');
			if( body.contains('device-touch') && body.contains('side-push-panel') ) {
				body.toggle('ohidden');
			}

			e.preventDefault();
		};
	});
};


SEMICOLON.Core.getVars.fn.sliderdimensions = selector => {
	const core = SEMICOLON.Core;

	let slider = document.querySelector('.slider-element'),
		sliderParallaxEl = document.querySelector('.slider-parallax'),
		body = core.getVars.elBody,
		parallaxElHeight = sliderParallaxEl?.offsetHeight,
		parallaxElWidth = sliderParallaxEl?.offsetWidth,
		slInner = sliderParallaxEl?.querySelector('.slider-inner'),
		slSwiperW = slider.querySelector('.swiper-wrapper'),
		slSwiperS = slider.querySelector('.swiper-slide'),
		slFlexHeight = slider.classList.contains('h-auto') || slider.classList.contains('min-vh-0');

	if( body.classList.contains('device-up-lg') ) {
		setTimeout(() => {
			if( slInner ) {
				slInner.style.height = parallaxElHeight + 'px';
			}
			if( slFlexHeight ) {
				parallaxElHeight = slider.querySelector('.slider-inner')?.querySelector('*').offsetHeight;
				slider.style.height = parallaxElHeight + 'px';
				if( slInner ) {
					slInner.style.height = parallaxElHeight + 'px';
				}
			}
		}, 500);

		if( slFlexHeight && slSwiperS ) {
			let slSwiperFC = slSwiperS.querySelector('*');
			if( slSwiperFC.classList.contains('container') || slSwiperFC.classList.contains('container-fluid') ) {
				slSwiperFC = slSwiperFC.querySelector('*');
			}
			if( slSwiperFC.offsetHeight > slSwiperW.offsetHeight ) {
				slSwiperW.style.height = 'auto';
			}
		}

		if( body.classList.contains('side-header') && slInner ) {
			slInner.style.width = parallaxElWidth + 'px';
		}

		if( !body.classList.contains('stretched') ) {
			parallaxElWidth = core.getVars.elWrapper.offsetWidth;
			if( slInner ) {
				slInner.style.width = parallaxElWidth + 'px';
			}
		}
	} else {
		if( slSwiperW ) {
			slSwiperW.style.height = '';
		}

		if( sliderParallaxEl ) {
			sliderParallaxEl.style.height = '';
		}

		if( slInner ) {
			slInner.style.width = '';
			slInner.style.height = '';
		}
	}

	core.getVars.resizers.sliderdimensions = () => SEMICOLON.Base.sliderDimensions();
};

SEMICOLON.Core.getVars.fn.slidermenuclass = selector => {
	const core = SEMICOLON.Core;
	selector = core.getSelector( selector, false );
	if( selector.length < 1 ){
		return true;
	}

	CanvasSwiperSliderMenu();
	CanvasRevolutionSliderMenu();
	SEMICOLON.Base.setBSTheme();

	core.getVars.resizers.slidermenuclass = () => SEMICOLON.Base.sliderMenuClass();
};

const CanvasSwiperSliderMenu = () => {
	const core = SEMICOLON.Core;
	// onWinLoad = typeof onWinLoad !== 'undefined' ? onWinLoad : false;
	if( core.getVars.elBody.classList.contains('is-expanded-menu') || ( core.getVars.elHeader.classList.contains('transparent-header-responsive') && !core.getVars.elBody.classList.contains('primary-menu-open') ) ) {
		let activeSlide = core.getVars.elSlider.querySelector('.swiper-slide-active');
		CanvasHeaderSchemeChanger(activeSlide);
	}
};

const CanvasRevolutionSliderMenu = () => {
	const core = SEMICOLON.Core;
	// onWinLoad = typeof onWinLoad !== 'undefined' ? onWinLoad : false;
	if( core.getVars.elBody.classList.contains('is-expanded-menu') || ( core.getVars.elHeader.classList.contains('transparent-header-responsive') && !core.getVars.elBody.classList.contains('primary-menu-open') ) ) {
		let activeSlide = core.getVars.elSlider.querySelector('.active-revslide');
		CanvasHeaderSchemeChanger(activeSlide);
	}
};

const CanvasHeaderSchemeChanger = activeSlide => {
	const core = SEMICOLON.Core;

	if( !activeSlide ) {
		return;
	}

	let darkExists = false,
		oldClassesArray, noOfOldClasses;
	if( activeSlide.classList.contains('dark') ){
		if( core.getVars.headerClasses ) {
			oldClassesArray = core.getVars.headerClasses;
		} else {
			oldClassesArray = '';
		}

		noOfOldClasses = oldClassesArray.length;

		if( noOfOldClasses > 0 ) {
			for( let i=0; i<noOfOldClasses; i++ ) {
				if( oldClassesArray[i] == 'dark' ) {
					darkExists = true;
					break;
				}
			}
		}

		let headerToChange = document.querySelector('#header.transparent-header:not(.sticky-header,.semi-transparent,.floating-header)');
		if( headerToChange ) {
			headerToChange.classList.add('dark');
		}

		if( !darkExists ) {
			let headerToChange = document.querySelector('#header.transparent-header.sticky-header,#header.transparent-header.semi-transparent.sticky-header,#header.transparent-header.floating-header.sticky-header');
			if( headerToChange ) {
				headerToChange.classList.remove('dark');
			}
		}
		core.getVars.elHeaderWrap.classList.remove('not-dark');
	} else {
		if( core.getVars.elBody.classList.contains('dark') ) {
			activeSlide.classList.add('not-dark');
			document.querySelector('#header.transparent-header:not(.semi-transparent,.floating-header)').classList.remove('dark');
			document.querySelector('#header.transparent-header:not(.sticky-header,.semi-transparent,.floating-header)').querySelector('#header-wrap').classList.add('not-dark');
		} else {
			document.querySelector('#header.transparent-header:not(.semi-transparent,.floating-header)').classList.remove('dark');
			core.getVars.elHeaderWrap.classList.remove('not-dark');
		}
	}

	if( core.getVars.elHeader.classList.contains('sticky-header') ) {
		SEMICOLON.Base.headers();
	}
};

SEMICOLON.Core.getVars.fn.sliderparallax = () => {
	CanvasAnimationFrame();

	window.addEventListener( 'scroll', () => {
		CanvasSliderParallax();
		CanvasSliderElementsFade();
	}, { passive: true });

	SEMICOLON.Core.getVars.resizers.sliderparallax = () => SEMICOLON.Modules.sliderParallax();
}

const CanvasAnimationFrame = () => {
	let lastTime = 0;
	let vendors = ['ms', 'moz', 'webkit', 'o'];
	for(let x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
									|| window[vendors[x]+'CancelRequestAnimationFrame'];
	}

	if (!window.requestAnimationFrame)
		window.requestAnimationFrame = function(callback, element) {
			let currTime = new Date().getTime();
			let timeToCall = Math.max(0, 16 - (currTime - lastTime));
			let id = window.setTimeout(function() { callback(currTime + timeToCall); },
			  timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};

	if (!window.cancelAnimationFrame)
		window.cancelAnimationFrame = function(id) {
			clearTimeout(id);
		};
};

const CanvasSliderParallax = () => {
	let vars = SEMICOLON.Core.getVars,
		sliderPx = vars.sliderParallax;

	if( typeof sliderPx.el !== 'object' ) {
		return true;
	}

	let el = sliderPx.el,
		elHeight = el.offsetHeight,
		elClasses = el.classList,
		transform, transform2;

	vars.scrollPos.y = window.pageYOffset;

	if( vars.elBody.classList.contains('device-up-lg') && !SEMICOLON.Mobile.any() ) {
		if( ( elHeight + sliderPx.offset + 50 ) > vars.scrollPos.y ){
			elClasses.add('slider-parallax-visible');
			elClasses.remove('slider-parallax-invisible');
			if ( vars.scrollPos.y > sliderPx.offset ) {
				if( typeof el.querySelector('.slider-inner') === 'object' ) {

					transform = ((vars.scrollPos.y-sliderPx.offset) * -.4 );
					transform2 = ((vars.scrollPos.y-sliderPx.offset) * -.15 );

					CanvasSliderParallaxSet( 0, transform, sliderPx.inner );
					CanvasSliderParallaxSet( 0, transform2, sliderPx.caption );
				} else {
					transform = ((vars.scrollPos.y-sliderPx.offset) / 1.5 );
					transform2 = ((vars.scrollPos.y-sliderPx.offset) / 7 );

					CanvasSliderParallaxSet( 0, transform, el );
					CanvasSliderParallaxSet( 0, transform2, sliderPx.caption );
				}
			} else {
				if( typeof el.querySelector('.slider-inner') === 'object' ) {
					CanvasSliderParallaxSet( 0, 0, sliderPx.inner );
					CanvasSliderParallaxSet( 0, 0, sliderPx.caption );
				} else {
					CanvasSliderParallaxSet( 0, 0, el );
					CanvasSliderParallaxSet( 0, 0, sliderPx.caption );
				}
			}
		} else {
			elClasses.add('slider-parallax-invisible');
			elClasses.remove('slider-parallax-visible');
		}

		requestAnimationFrame(function(){
			CanvasSliderParallax();
			CanvasSliderElementsFade();
		});
	} else {
		if( typeof el.querySelector('.slider-inner') === 'object' ) {
			CanvasSliderParallaxSet( 0, 0, sliderPx.inner );
			CanvasSliderParallaxSet( 0, 0, sliderPx.caption );
		} else {
			CanvasSliderParallaxSet( 0, 0, el );
			CanvasSliderParallaxSet( 0, 0, sliderPx.caption );
		}
		elClasses.add('slider-parallax-visible');
		elClasses.remove('slider-parallax-invisible');
	}
};

const CanvasSliderParallaxOffset = () => {
	let core = SEMICOLON.Core,
		sliderPx = core.getVars.sliderParallax;

	let sliderParallaxOffsetTop = 0,
		headerHeight = core.getVars.elHeader?.offsetHeight || 0;

	if( core.getVars.elBody.classList.contains('side-header') || (core.getVars.elHeader && core.getNext(core.getVars.elHeader, '.include-header').length > 0) ) {
		headerHeight = 0;
	}

	// if( $pageTitle.length > 0 ) {
	// 	sliderParallaxOffsetTop = $pageTitle.outerHeight() + headerHeight - 20;
	// } else {
	// 	sliderParallaxOffsetTop = headerHeight - 20;
	// }

	if( core.getNext(core.getVars.elSlider, '#header').length > 0 ) {
		sliderParallaxOffsetTop = 0;
	}

	sliderPx.offset = sliderParallaxOffsetTop;
};

const CanvasSliderParallaxSet = ( xPos, yPos, el ) => {
	if( el ) {
		el.style.transform = "translate3d(" + xPos + ", " + yPos + "px, 0)";
	}
};

const CanvasSliderElementsFade = () => {
	let core = SEMICOLON.Core,
		sliderPx = core.getVars.sliderParallax;

	if( sliderPx.el.length < 1 ) {
		return true;
	}

	if( core.getVars.elBody.classList.contains('device-up-lg') && !SEMICOLON.Mobile.any() ) {
		let elHeight = sliderPx.el.offsetHeight,
			tHeaderOffset;

		if( (core.getVars.elHeader && core.getVars.elHeader.classList.contains('transparent-header')) || core.getVars.elBody.classList.contains('side-header') ) {
			tHeaderOffset = 100;
		} else {
			tHeaderOffset = 0;
		}

		if( sliderPx.el.classList.contains('slider-parallax-visible') ) {
			sliderPx.el.querySelectorAll('.slider-arrow-left,.slider-arrow-right,.slider-caption,.slider-element-fade').forEach( el => {
				el.style.opacity = 1 - ( ( ( core.getVars.scrollPos.y - tHeaderOffset ) * 1.85 ) / elHeight )
			});
		}
	} else {
		sliderPx.el.querySelectorAll('.slider-arrow-left,.slider-arrow-right,.slider-caption,.slider-element-fade').forEach(
			el => el.style.opacity = 1
		);
	}
};

SEMICOLON.Core.getVars.fn.stickfooteronsmall = selector => {
	const core = SEMICOLON.Core;
	selector = core.getSelector( selector, false );
	if( selector.length < 1 ){
		return true;
	}

	core.getVars.elFooter.style.marginTop = '';

	const windowH = core.viewport().height,
		wrapperH = core.getVars.elWrapper.offsetHeight;

	if( !core.getVars.elBody.classList.contains('sticky-footer') && core.getVars.elFooter !== 'undefined' && core.getVars.elWrapper.contains( core.getVars.elFooter ) ) {
		if( windowH > wrapperH ) {
			core.getVars.elFooter.style.marginTop = (windowH - wrapperH)+'px';
		}
	}

	core.getVars.resizers.stickfooter = () => SEMICOLON.Base.stickFooterOnSmall();
};

SEMICOLON.Core.getVars.fn.stickysidebar = selector => {
	const core = SEMICOLON.Core;
	//core.loadJS({ file: 'plugins.stickysidebar.js', id: 'canvas-stickysidebar-js', jsFolder: true });
	core.isFuncTrue( () => jQuery().scwStickySidebar ).then( cond => {
		if( !cond ) {
			return false;
		}

		core.initFunction({ class: 'has-plugin-stickysidebar', event: 'pluginStickySidebarReady' });

		selector = core.getSelector( selector );
		if( selector.length < 1 ){
			return false;
		}

		selector.each( function(){
			let element = jQuery(this),
				elTop = element.attr('data-offset-top') || 110,
				elBottom = element.attr('data-offset-bottom') || 50;

			element.scwStickySidebar({
				additionalMarginTop: Number( elTop ),
				additionalMarginBottom: Number( elBottom )
			});
		});
	});
};

SEMICOLON.Core.getVars.fn.subscribe = selector => {
	const core = SEMICOLON.Core;
	//core.loadJS({ file: 'plugins.form.js', id: 'canvas-form-js', jsFolder: true });
	core.isFuncTrue( () => jQuery().validate && jQuery().ajaxSubmit ).then( cond => {
		if( !cond ) {
			return false;
		}

		core.initFunction({ class: 'has-plugin-form', event: 'pluginFormReady' });

		selector = core.getSelector( selector );
		if( selector.length < 1 ){
			return true;
		}

		selector.each( function(){
			let element = jQuery(this),
				elAlert = element.attr('data-alert-type'),
				elLoader = element.attr('data-loader'),
				elResult = element.find('.widget-subscribe-form-result'),
				elRedirect = element.attr('data-redirect'),
				defButton, defButtonText, alertType;

			element.find('form').validate({
				submitHandler: function(form) {

					elResult.hide();

					if( elLoader == 'button' ) {
						defButton = jQuery(form).find('button');
						defButtonText = defButton.html();

						defButton.html('<i class="bi-arrow-repeat icon-spin nomargin"></i>');
					} else {
						jQuery(form).find('.bi-envelope-plus').removeClass('bi-envelope-plus').addClass('bi-arrow-repeat icon-spin');
					}

					jQuery(form).ajaxSubmit({
						target: elResult,
						dataType: 'json',
						resetForm: true,
						success: function( data ) {
							if( elLoader == 'button' ) {
								defButton.html( defButtonText );
							} else {
								jQuery(form).find('.bi-arrow-repeat').removeClass('bi-arrow-repeat icon-spin').addClass('bi-envelope-plus');
							}
							if( data.alert != 'error' && elRedirect ){
								window.location.replace( elRedirect );
								return true;
							}
							if( elAlert == 'inline' ) {
								if( data.alert == 'error' ) {
									alertType = 'alert-danger';
								} else {
									alertType = 'alert-success';
								}

								elResult.addClass( 'alert ' + alertType ).html( data.message ).slideDown( 400 );
							} else {
								elResult.attr( 'data-notify-type', data.alert ).attr( 'data-notify-msg', data.message ).html('');
								SEMICOLON.Modules.notifications(elResult);
							}
						}
					});
				}
			});

		});
	});
};

SEMICOLON.Core.getVars.fn.swiper = selector => {
    const core = SEMICOLON.Core;
    //core.loadJS({ file: 'plugins.swiper.js', id: 'canvas-swiper-js', jsFolder: true });
    core.isFuncTrue( () => typeof Swiper !== "undefined" ).then( cond => {
        if( !cond ) {
            return false;
        }

        core.initFunction({ class: 'has-plugin-swiper', event: 'pluginSwiperReady' });

    	selector = core.getSelector( selector, false );
    	if( selector.length < 1 ){
    		return true;
    	}

    	selector.forEach( element => {
            if( !element.classList.contains('swiper_wrapper') ) {
    			 return true;
    		}

    		if( element.querySelectorAll('.swiper-slide').length < 1 ) {
    			return true;
    		}

    		let elDirection = element.getAttribute('data-direction') || 'horizontal',
    			elSpeed = element.getAttribute('data-speed') || 300,
                elAutoPlay = element.getAttribute('data-autoplay'),
    			elAutoPlayDisableOnInteraction = element.getAttribute('data-autoplay-disable-on-interaction') || true,
                elPauseOnHover = element.getAttribute('data-hover'),
    			elLoop = element.getAttribute('data-loop'),
    			elStart = element.getAttribute('data-start') || 1,
    			elEffect = element.getAttribute('data-effect') || 'slide',
    			elGrabCursor = element.getAttribute('data-grab'),
    			elParallax = element.getAttribute('data-parallax'),
				elAutoHeight = element.getAttribute('data-autoheight'),
    			slideNumberTotal = element.querySelector('.slide-number-total'),
    			slideNumberCurrent = element.querySelector('.slide-number-current'),
    			elVideoAutoPlay = element.getAttribute('data-video-autoplay'),
    			elSettings = element.getAttribute('data-settings'),
    			elPagination, elPaginationClickable;

    		if( elAutoPlay ) { elAutoPlay = Number( elAutoPlay ); } else { elAutoPlay = 999999999; }
            if( elPauseOnHover == 'true' ) { elPauseOnHover = true; } else { elPauseOnHover = false; }
            if( elAutoPlayDisableOnInteraction == 'false' ) { elAutoPlayDisableOnInteraction = false; }
    		if( elLoop == 'true' ) { elLoop = true; } else { elLoop = false; }
    		if( elParallax == 'true' ) { elParallax = true; } else { elParallax = false; }
    		if( elGrabCursor == 'false' ) { elGrabCursor = false; } else { elGrabCursor = true; }
    		if( elAutoHeight == 'true' ) { elAutoHeight = true; } else { elAutoHeight = false; }
            if( elVideoAutoPlay == 'false' ) { elVideoAutoPlay = false; } else { elVideoAutoPlay = true; }

    		if( elStart === 'random' ) {
    			elStart = Math.floor( Math.random() * element.querySelectorAll('.swiper-slide:not(.swiper-slide-duplicate)').length );
    		} else {
    			elStart = Number( elStart ) - 1;
    		}

    		if( element.querySelector('.swiper-pagination') ) {
    			elPagination = element.querySelector('.swiper-pagination');
    			elPaginationClickable = true;
    		} else {
    			elPagination = '';
    			elPaginationClickable = false;
    		}

    		let elementNavNext = element.querySelector('.slider-arrow-right'),
    			elementNavPrev = element.querySelector('.slider-arrow-left'),
    			elementScollBar = element.querySelector('.swiper-scrollbar');

    		let cnvsSwiper = new Swiper( element.querySelector('.swiper-parent') ,{
    			direction: elDirection,
    			speed: Number( elSpeed ),
    			autoplay: {
    				delay: elAutoPlay,
                    pauseOnMouseEnter: elPauseOnHover,
                    disableOnInteraction: elAutoPlayDisableOnInteraction
    			},
    			loop: elLoop,
    			initialSlide: elStart,
    			effect: elEffect,
    			parallax: elParallax,
    			slidesPerView: 1,
    			grabCursor: elGrabCursor,
				autoHeight: elAutoHeight,
    			pagination: {
    				el: elPagination,
    				clickable: elPaginationClickable
    			},
    			navigation: {
    				prevEl: elementNavPrev,
    				nextEl: elementNavNext
    			},
    			scrollbar: {
    				el: elementScollBar
    			},
    			on: {
    				afterInit: swiper => {
    					SEMICOLON.Base.sliderDimensions();

						if( element.querySelectorAll('.yt-bg-player').length > 0 ) {
							element.querySelectorAll('.yt-bg-player').forEach(el => {
								el.setAttribute('data-autoplay', 'false');
								el.classList.remove('customjs');
							});

							SEMICOLON.Modules.youtubeBgVideo();

							let activeYTVideo = jQuery('.swiper-slide-active').find('.yt-bg-player:not(.customjs)');
							activeYTVideo.on( 'YTPReady', function(){
								setTimeout( () => {
									activeYTVideo.filter('.mb_YTPlayer').YTPPlay();
								}, 1200);
							});
						}

    					document.querySelectorAll('.swiper-slide-active [data-animate]').forEach(el => {
    						let toAnimateDelay = el.getAttribute('data-delay'),
    							toAnimateDelayTime = 0;

    						if( toAnimateDelay ) {
								toAnimateDelayTime = Number( toAnimateDelay ) + 750;
							} else {
								toAnimateDelayTime = 750;
							}

    						if( !el.classList.contains('animated') ) {
    							el.classList.add('not-animated');

    							let elementAnimation = el.getAttribute('data-animate');
    							setTimeout(() => {
    								el.classList.remove('not-animated');
									( elementAnimation + ' animated').split(" ").forEach(_class => el.classList.add(_class));
    							}, toAnimateDelayTime);
    						}
    					});

    					element.querySelectorAll('[data-animate]').forEach(el => {
    						let elementAnimation = el.getAttribute('data-animate');

    						if( el.closest('.swiper-slide').classList.contains('swiper-slide-active') ) {
								return true;
							}

    						( elementAnimation + ' animated').split(" ").forEach(_class => el.classList.remove(_class));
							el.classList.add('not-animated');
    					});

						if( elAutoHeight ) {
							setTimeout( () => {
								swiper.updateAutoHeight(300);
							}, 1000);
						}
    				},
    				transitionStart: swiper => {
    					element.querySelectorAll('[data-animate]').forEach(el => {
    						let elementAnimation = el.getAttribute('data-animate');

    						if( el.closest('.swiper-slide').classList.contains('swiper-slide-active') ) {
								return true;
							}

							( elementAnimation + ' animated').split(" ").forEach(_class => el.classList.remove(_class));
							el.classList.add('not-animated');
    					});

    					SEMICOLON.Base.sliderMenuClass();
    				},
    				transitionEnd: swiper => {
						if( slideNumberCurrent ){
    						if( elLoop == true ) {
    							slideNumberCurrent.innerHTML = Number( element.querySelector('.swiper-slide.swiper-slide-active').getAttribute('data-swiper-slide-index') ) + 1;
    						} else {
    							slideNumberCurrent.innerHTML = swiper.activeIndex + 1;
    						}
    					}

    					element.querySelectorAll('.swiper-slide').forEach(slide => {
    						if( slide.querySelector('video') && elVideoAutoPlay == true ) {
    							slide.querySelector('video').pause();
    						}

    						if( slide.querySelector('.yt-bg-player.mb_YTPlayer:not(.customjs)') ) {
    							jQuery(slide).find('.yt-bg-player.mb_YTPlayer:not(.customjs)').YTPPause();
    						}
    					});

    					element.querySelectorAll('.swiper-slide:not(.swiper-slide-active)').forEach(slide => {
    						if( slide.querySelector('video') ) {
    							if( slide.querySelector('video').currentTime != 0 ) {
    								slide.querySelector('video').currentTime = 0;
    							}
    						}

							let activeYTPlayer = slide.querySelector('.yt-bg-player.mb_YTPlayer:not(.customjs)');

    						if( activeYTPlayer ) {
    							jQuery(activeYTPlayer).YTPSeekTo( activeYTPlayer.getAttribute('data-start') );
    						}
    					});

    					if( element.querySelector('.swiper-slide.swiper-slide-active').querySelector('video') && elVideoAutoPlay == true ) {
    						element.querySelector('.swiper-slide.swiper-slide-active').querySelector('video').play();
    					}

    					if( element.querySelector('.swiper-slide.swiper-slide-active').querySelector('.yt-bg-player.mb_YTPlayer:not(.customjs)') && elVideoAutoPlay == true ) {
    						jQuery(element).find('.swiper-slide.swiper-slide-active').find('.yt-bg-player.mb_YTPlayer:not(.customjs)').YTPPlay();
    					}

    					element.querySelectorAll('.swiper-slide.swiper-slide-active [data-animate]').forEach(el => {
    						let toAnimateDelay = el.getAttribute('data-delay'),
    							toAnimateDelayTime = 0;

    						if( toAnimateDelay ) {
								toAnimateDelayTime = Number( toAnimateDelay ) + 300;
							} else {
								toAnimateDelayTime = 300;
							}

    						if( !el.classList.contains('animated') ) {
    							el.classList.add('not-animated');

								let elementAnimation = el.getAttribute('data-animate');

    							setTimeout(() => {
    								el.classList.remove('not-animated');
									( elementAnimation + ' animated').split(" ").forEach(_class => el.classList.add(_class));
    							}, toAnimateDelayTime);
    						}
    					});
    				}
    			}
    		});

    		if( slideNumberCurrent ) {
    			if( elLoop == true ) {
    				slideNumberCurrent.innerHTML = cnvsSwiper.realIndex + 1;
    			} else {
    				slideNumberCurrent.innerHTML = cnvsSwiper.activeIndex + 1;
    			}
    		}

    		if( slideNumberTotal ) {
    			slideNumberTotal.innerHTML = element.querySelectorAll('.swiper-slide:not(.swiper-slide-duplicate)').length;
    		}

    		// if( elSettings ){
    		// 	elSettings = Function( 'return ' + elSettings )();
    		// 	Object.keys(elSettings).forEach( function( key, index ){
    		// 		cnvsSwiper.params[key] = elSettings[key];
    		// 		cnvsSwiper.update();
    		// 	});
    		// }
    	});
    });
};

SEMICOLON.Core.getVars.fn.textrotator = selector => {
    const core = SEMICOLON.Core;
	//core.loadJS({ file: 'plugins.textrotator.js', id: 'canvas-textrotator-js', jsFolder: true });
	core.isFuncTrue( () => jQuery().Morphext && typeof Typed !== 'undefined' ).then( cond => {
		if( !cond ) {
			return false;
		}

		core.initFunction({ class: 'has-plugin-textrotator', event: 'pluginTextRotatorReady' });

		selector = core.getSelector( selector );
		if( selector.length < 1 ){
			return true;
		}

		selector.each(function(){
			let element = jQuery(this),
				elTyped = element.attr('data-typed') || 'false',
				elRotator = element.find('.t-rotate'),
				elAnimation = element.attr('data-rotate') || 'fade',
				elSpeed = element.attr('data-speed') || 1200,
				elSep = element.attr('data-separator') || ',';

			if( elTyped == 'true' ) {
				let elTexts = elRotator.html().split( elSep ),
					elLoop = element.attr('data-loop') || 'true',
					elShuffle = element.attr('data-shuffle'),
					elCur = element.attr('data-cursor') || 'true',
					elSpeed = element.attr('data-speed') || 50,
					elBackSpeed = element.attr('data-backspeed') || 30,
					elBackDelay = element.attr('data-backdelay');

				if( elLoop == 'true' ) { elLoop = true; } else { elLoop = false; }
				if( elShuffle == 'true' ) { elShuffle = true; } else { elShuffle = false; }
				if( elCur == 'true' ) { elCur = true; } else { elCur = false; }

				elRotator.html( '' ).addClass('plugin-typed-init');

				let typed = new Typed( elRotator.get(0) , {
					strings: elTexts,
					typeSpeed: Number( elSpeed ),
					loop: elLoop,
					shuffle: elShuffle,
					showCursor: elCur,
					backSpeed: Number( elBackSpeed ),
					backDelay: Number( elBackDelay )
				});
			} else {
				let pluginData = elRotator.Morphext({
					animation: elAnimation,
					separator: elSep,
					speed: Number(elSpeed)
				});
			}
		});
	});
};

SEMICOLON.Core.getVars.fn.toggles = selector => {
	const core = SEMICOLON.Core;
	core.initFunction({ class: 'has-plugin-toggles', event: 'pluginTogglesReady' });

	selector = core.getSelector( selector, false );
	if( selector.length < 1 ){
		return true;
	}

	selector.forEach( element => {
		let elSpeed = element.getAttribute('data-speed') || 300,
			elState = element.getAttribute('data-state');

		if( elState != 'open' ){
			element.querySelector('.toggle-content').classList.add('d-none');
		} else {
			element.classList.add('toggle-active');
			CanvasAnimSlideDown( element.querySelector('.toggle-content'), Number(elSpeed) );
		}

		element.querySelector('.toggle-header').onclick = e => {
			if( element.classList.contains('toggle-active') ) {
				element.classList.remove('toggle-active');
				CanvasAnimSlideUp( element.querySelector('.toggle-content'), Number(elSpeed), () => {
					element.querySelector('.toggle-content').classList.add('d-none');
				});
			} else {
				element.classList.add('toggle-active');
				element.querySelector('.toggle-content').classList.remove('d-none');
				CanvasAnimSlideDown( element.querySelector('.toggle-content'), Number(elSpeed) );
			}
			e.preventDefault();
		};
	});
};

const CanvasAnimSlideUp = (target, duration=500, callback=false) => {
	target.style.transitionProperty = 'height, margin, padding';
	target.style.transitionDuration = duration + 'ms';
	target.style.boxSizing = 'border-box';
	target.style.height = target.offsetHeight + 'px';
	target.offsetHeight;
	target.style.overflow = 'hidden';
	target.style.height = 0;
	target.style.paddingTop = 0;
	target.style.paddingBottom = 0;
	target.style.marginTop = 0;
	target.style.marginBottom = 0;
	window.setTimeout( () => {
		target.style.display = 'none';
		target.style.removeProperty('height');
		target.style.removeProperty('padding-top');
		target.style.removeProperty('padding-bottom');
		target.style.removeProperty('margin-top');
		target.style.removeProperty('margin-bottom');
		target.style.removeProperty('overflow');
		target.style.removeProperty('transition-duration');
		target.style.removeProperty('transition-property');
		typeof callback === 'function' && callback();
	}, duration);
};

const CanvasAnimSlideDown = (target, duration=500, callback=false) => {
	target.style.removeProperty('display');
	let display = window.getComputedStyle(target).display;

	if (display === 'none') {
		display = 'block';
	}

	target.style.display = display;
	let height = target.offsetHeight;
	target.style.overflow = 'hidden';
	target.style.height = 0;
	target.style.paddingTop = 0;
	target.style.paddingBottom = 0;
	target.style.marginTop = 0;
	target.style.marginBottom = 0;
	target.offsetHeight;
	target.style.boxSizing = 'border-box';
	target.style.transitionProperty = "height, margin, padding";
	target.style.transitionDuration = duration + 'ms';
	target.style.height = height + 'px';
	target.style.removeProperty('padding-top');
	target.style.removeProperty('padding-bottom');
	target.style.removeProperty('margin-top');
	target.style.removeProperty('margin-bottom');
	window.setTimeout( () => {
		target.style.removeProperty('height');
		target.style.removeProperty('overflow');
		target.style.removeProperty('transition-duration');
		target.style.removeProperty('transition-property');
		typeof callback === 'function' && callback();
	}, duration);
};

const CanvasAnimSlideToggle = (target, duration = 500, callback=false) => {
	if (window.getComputedStyle(target).display === 'none') {
		return CanvasAnimSlideDown(target, duration, callback);
	} else {
		return CanvasAnimSlideUp(target, duration, callback);
	}
};

SEMICOLON.Core.getVars.fn.topcart = selector => {
	const core = SEMICOLON.Core;
	selector = core.getSelector( selector, false );
	if( selector.length < 1 ){
		return true;
	}

	if( !document.getElementById('top-cart-trigger') ) {
		return false;
	}

	let body = core.getVars.elBody.classList;

	document.getElementById('top-cart-trigger').onclick = e => {
		selector[0].classList.toggle('top-cart-open');

		// if( ( body.contains('device-md') || body.contains('device-sm') || body.contains('device-xs') ) && selector[0].classList.contains('top-cart-open') ) {
		// 	body.add('overflow-hidden');
		// } else {
		// 	body.remove('overflow-hidden');
		// }
		// jQuery('#page-menu').toggleClass('page-menu-open', false);

		e.stopPropagation();
		e.preventDefault();
	};

	document.addEventListener('click', e => {
		if( !e.target.closest('#top-cart') ) {
			selector[0].classList.remove('top-cart-open');
			// body.remove('overflow-hidden');
		}
	}, false);
};


SEMICOLON.Core.getVars.fn.twitter = selector => {
	const core = SEMICOLON.Core;
	core.initFunction({ class: 'has-plugin-twitter', event: 'pluginTwitterFeedReady' });

	selector = core.getSelector( selector, false, false );
	if( selector.length < 1 ){
		return true;
	}

	selector.forEach(element => {
		let elUser = element.getAttribute('data-username') || 'twitter',
			elCount = element.getAttribute('data-count') || 3,
			elLoader = element.getAttribute('data-loader') || 'include/twitter/tweets.php',
			elFetch = element.getAttribute('data-fetch-message') || 'Fetching Tweets from Twitter...';

		let alert = element.querySelector('.twitter-widget-alert');

		if( !alert ) {
			alert = document.createElement('div');
			alert.classList.add( 'alert', 'alert-warning', 'twitter-widget-alert', 'text-center' );
			element.prepend(alert);
			alert.innerHTML = '<div class="spinner-grow spinner-grow-sm me-2" role="status"><span class="visually-hidden">Loading...</span></div> ' + elFetch;
		}

		fetch( elLoader + '?username='+ elUser ).then( response => response.json() ).then( tweets => {
			alert.remove();
			let i = 0;
			tweets.data?.some(tw => {
				if( i == Number(elCount) ) {
					return;
				}
				CanvasTweetBuild(tw, element, elUser);
				i++;
			});

			if( element.classList.contains('fslider') ) {
				let timer = setInterval(() => {
					if( element.querySelectorAll('.slide').length > 1 ) {
						element.classList.remove('customjs');
						setTimeout(() => {
							SEMICOLON.Modules.flexSlider();
							jQuery(element).find( '.flexslider .slide' ).resize();
						}, 500);
						clearInterval(timer);
					}
				}, 1000);
			}
		}).catch( err => {
			console.log(err);
			alert.classList.remove( 'alert-warning' );
			alert.classList.add( 'alert-danger' );
			alert.innerHTML = 'Could not fetch Tweets from Twitter API. Please try again later.';
		});
	});
};

const CanvasTweetBuild = (tweet, element, username) => {
	let elFontClass = element.getAttribute('data-font-class') || 'font-body';

	let status = tweet.text.replace(/((https?|s?ftp|ssh)\:\/\/[^"\s\<\>]*[^.,;'">\:\s\<\>\)\]\!])/g, url => {
		return '<a href="'+url+'" target="_blank">'+url+'</a>';
	}).replace(/\B@([_a-z0-9]+)/ig, reply => {
		return reply.charAt(0)+'<a href="https://twitter.com/'+reply.substring(1)+'" target="_blank">'+reply.substring(1)+'</a>';
	});

	if( element.classList.contains('fslider') ) {
		let slide = document.createElement('div');
		slide.classList.add('slide');
		slide.innerHTML += '<p class="mb-3 '+elFontClass+'">'+status+'</p><small class="d-block"><a href="https://twitter.com/'+username+'/statuses/'+tweet.id+'" target="_blank">'+CanvasRelativeTime(tweet.created_at)+'</a></small>';
		element.querySelector('.slider-wrap').append(slide);
	} else {
		element.innerHTML += '<li><i class="fa-brands fa-twitter"></i><div><span>'+status+'</span><small><a href="https://twitter.com/'+username+'/statuses/'+tweet.id+'" target="_blank">'+CanvasRelativeTime(tweet.created_at)+'</a></small></div></li>';
	}
}

const CanvasRelativeTime = time_value => {
	let parsed_date = new Date(time_value);
	let relative_to = new Date();
	let delta = parseInt((relative_to.getTime() - parsed_date) / 1000);
	delta = delta + (relative_to.getTimezoneOffset() * 60);

	if (delta < 60) {
		return 'less than a minute ago';
	} else if(delta < 120) {
		return 'about a minute ago';
	} else if(delta < (60*60)) {
		return (parseInt(delta / 60)).toString() + ' minutes ago';
	} else if(delta < (120*60)) {
		return 'about an hour ago';
	} else if(delta < (24*60*60)) {
		return 'about ' + (parseInt(delta / 3600)).toString() + ' hours ago';
	} else if(delta < (48*60*60)) {
		return '1 day ago';
	} else {
		return (parseInt(delta / 86400)).toString() + ' days ago';
	}
}

SEMICOLON.Core.getVars.fn.videofacade = selector => {
	const core = SEMICOLON.Core;
	core.initFunction({ class: 'has-plugin-videofacade', event: 'pluginVideoFacadeReady' });

	selector = core.getSelector( selector, false );

	selector.forEach( element => {
		element.onclick = e => {
			const videoContent = element.getAttribute('data-video-html');
			element.querySelector('.video-facade-preview').classList.add('d-none');
			element.querySelector('.video-facade-content').innerHTML += videoContent;
			element.querySelector('.video-facade-content').classList += ' ratio ratio-16x9';

			e.preventDefault();
		};
	});
};

SEMICOLON.Core.getVars.fn.viewportdetect = selector => {
	const core = SEMICOLON.Core;
	core.initFunction({ class: 'has-plugin-viewportdetect', event: 'pluginViewportDetectReady' });

	selector = core.getSelector( selector, false );
	if( selector.length < 1 ){
		return true;
	}

	const observer = new window.IntersectionObserver(([entry]) => {
		entry.isIntersecting ? entry.target.classList.add('is-in-viewport') : entry.target.classList.remove('is-in-viewport');
	}, { root: null, threshold: 0, });

	selector.forEach(el => {
		observer.observe(el);
	});
};

SEMICOLON.Core.getVars.fn.youtube = selector => {
    const core = SEMICOLON.Core;
    //core.loadJS({ file: 'plugins.youtube.js', id: 'canvas-youtube-js', jsFolder: true });
    core.isFuncTrue( () => jQuery().YTPlayer ).then( cond => {
        if( !cond ) {
            return false;
        }

        core.initFunction({ class: 'has-plugin-youtubebg', event: 'pluginYoutubeBgVideoReady' });

    	selector = core.getSelector( selector, true, '.mb_YTPlayer,.customjs' );
    	if( selector.length < 1 ){
    		return true;
    	}

    	selector.each( function(){
    		let element = jQuery(this),
    			elVideo = element.attr('data-video'),
    			elMute = element.attr('data-mute') || true,
    			elRatio = element.attr('data-ratio') || '16/9',
    			elQuality = element.attr('data-quality') || 'hd720',
    			elOpacity = element.attr('data-opacity') || 1,
    			elContainer = element.attr('data-container') || 'parent',
    			elOptimize = element.attr('data-optimize') || true,
    			elLoop = element.attr('data-loop') || true,
    			elControls = element.attr('data-controls') || false,
    			elVolume = element.attr('data-volume') || 50,
    			elStart = element.attr('data-start') || 0,
    			elStop = element.attr('data-stop') || 0,
    			elAutoPlay = element.attr('data-autoplay') || true,
                elFullScreen = element.attr('data-fullscreen') || false,
                elCoverImage = element.attr('data-coverimage') || '',
                elPauseOnBlur = element.attr('data-pauseonblur') || true,
    			elPlayIfVisible = element.attr('data-playifvisible') || false;

    		if( elMute == 'false' ) {
    			elMute = false;
    		}

    		if( elContainer == 'parent' ) {
    			let parent = element.parent();
    			if( parent.attr('id') ) {
    				elContainer = '#' + parent.attr('id');
    			} else {
    				let ytPid = 'yt-bg-player-parent-' + Math.floor( Math.random() * 10000 );
    				parent.attr( 'id', ytPid );
    				elContainer = '#' + ytPid;
    			}
    		}

    		if( elOptimize == 'false' ) {
    			elOptimize = false;
    		}

    		if( elLoop == 'false' ) {
    			elLoop = false;
    		}

    		if( elControls == 'true' ) {
    			elControls = true;
    		}

    		if( elAutoPlay == 'false' ) {
    			elAutoPlay = false;
    		}

    		if( elFullScreen == 'true' ) {
    			elFullScreen = true;
    		}

            if( elPauseOnBlur == 'true' ) {
                elPauseOnBlur = true;
            }

            if( elPlayIfVisible == 'true' ) {
                elPlayIfVisible = true;
            }

    		element.YTPlayer({
    			videoURL: elVideo,
    			mute: elMute,
    			ratio: elRatio,
    			quality: elQuality,
    			opacity: Number(elOpacity),
    			containment: elContainer,
    			optimizeDisplay: elOptimize,
    			loop: elLoop,
    			vol: Number(elVolume),
    			startAt: Number(elStart),
    			stopAt: Number(elStop),
    			autoPlay: elAutoPlay,
    			realfullscreen: elFullScreen,
    			showYTLogo: false,
    			showControls: false,
                coverImage: elCoverImage,
                stopMovieOnBlur: elPauseOnBlur,
                playOnlyIfVisible: elPlayIfVisible,
    		});

    	});
    });
};
