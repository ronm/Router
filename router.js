(function(){
// need fetch polyfill
// wrapper class
// animation or transitionend
// base path

	let location = window.location;

	class Router {
		constructor(sel, routes) {
			this.currentPath = null;			
			this._routes = [];
			this._callbacks = [];
			this.renderView = document.querySelector(sel);
			this.pageTitlePlaceHolder = this._getPageTitle().textContent;
			this.routes(routes);
			this.update();	
			this._init();
		}
		
		on(name, callback) {
			this._callbacks.push({name: name, callback: callback});
			return this;
		}
		
		update() {
			this._update();
		}		

		routes(routes) {
			routes.forEach(route => this._routes.push(route));
		}
		
		_init() {
			window.addEventListener("popstate", () => this.update());
		}
		
		_update() {
			if ( this.currentPath !== location.pathname ) {	
				this.currentPath = location.pathname;
				let current = this._getCurrent();
				
				if ( !current.cache ) {
					/*fetch('/partials/' + current.name + '.html').then(res => res.text()).then(res => { current.cache = res; this._onRouteLoad(current); });*/

					let http = new XMLHttpRequest();
					http.addEventListener("load", res => {
						if ( http.status === 200 ) {
							current.cache = http.responseText;
							this._onRouteLoad(current);
						}
					});
					http.open("GET", '/partials/' + current.name + '.html');
					http.send();
				} else {
					this._onRouteLoad(current);
				}
			}
		}		
		
		_onRouteLoad(route) {
			let wrapper = document.createElement('div'),
				wrapperClass = wrapper.classList,
				current = this.renderView.children;

			wrapperClass.add("render-item");
			wrapper.innerHTML = route.cache;			

			if ( current.length ) {
				[].forEach.call(current, function(c) {
					c.addEventListener("animationend", function() { c.parentNode && c.parentNode.removeChild(c); });
					c.classList.add('render-view-leave');
					c.classList.remove('render-view-enter');
				});
				wrapperClass.add("render-view-enter");
			}
			this.renderView.appendChild(wrapper);
			this._updatePageTitle(route);
			this._processClbks(route);
			window.scrollTo(0,0);
		}
		
		_getCurrent() { 
			return this._routes.find(function(r) {
				return Array.isArray(r.path) ? r.path.indexOf(location.pathname) > -1 : r.path === location.pathname;
			});
		}
		
		_processClbks(current) {
			return this._callbacks.filter(function(c) { return c.name === current.name; }).forEach(c => {
				c.callback(current);
			});
		}
		
		_getPageTitle() {
			return document.head.querySelector('title');
		}
		
		_updatePageTitle(route) {
			let title = route.name.charAt(0).toUpperCase() + route.name.slice(1);
			this._getPageTitle().textContent = this.pageTitlePlaceHolder.replace('{{title}}', title);
		}
	}

	self.Router = Router;

})(typeof self !== 'undefined' ? self : this);