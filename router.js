(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.returnExports = factory();
  }
}(this, function () {
	
	let location = window.location;
	
	return class Router {
		constructor(sel, routes) {
			this.currentRoute = null;			
			this.routes = [];
			this.updatePageTitle = true;
			this.updateHistory = true;
			this._callbacks = [];
			this._renderView = document.querySelector(sel);
			this._pageTitlePlaceHolder = document.title;
			routes.forEach(route => this.add(route));
			window.addEventListener("popstate", event => this._request(event));
		}
		
		on(name, callback) {
			this._callbacks.push({name: name, callback: callback});
			return this;
		}
		
		add(route) { this.routes.push(route); }	
		
		request(name) { return this._request(name); }
		
		onResponse(callback) {
			this._callbacks.push({name: "_end", callback: callback});
			return this;
		}
		/*onRequest(callback) { this._callbacks.push({name: "_start", callback: callback}); return this; }*/
		/*onInserted(callback) { this._callbacks.push({name: "_inserted", callback: callback}); return this; }*/

		load() {
			return this.request(this.getRoute().name);
		}

		getRoute(name = location.pathname) {
			var route = this.routes.filter(r => r.name === name || (Array.isArray(r.path) ? r.path.indexOf(name) > -1 : r.path === name));
			return route.length ? route[0] : (this.getRoute("/404") || null );
		}	

		_request(name) {
			if ( name && name !== window.location.pathname) {
				let route = typeof name !== "string" && name.type === "popstate" ? this.getRoute() : this.getRoute(name);

				if ( typeof name === "string" && this.updateHistory ) { 
					this._updateHistory(route);
				}
				
				if ( this.currentRoute !== route ) {
					this._getContent(route).then(route => this._processRoute(route));			
					this.currentRoute = route;
				}
			}

			return this;
		}

		_getContent(route) {
			return new Promise((resolve, reject) => {
				if ( !route.cache ) {
					let http = new XMLHttpRequest();
					http.addEventListener("load", res => {
						if ( http.status === 200 ) {
							route.cache = http.responseText;
							resolve(route);
						}
					});
					http.open("GET", route.filepath);
					http.send();
				} else {
					resolve(route);
				}
			})
		}

		_processRoute(route) {
			let wrapper = document.createElement('div'),
				current = this._renderView.querySelector(".render-item");

			wrapper.addEventListener("animationend", (event) => {
				if ( wrapper.nextElementSibling ) {
					wrapper.parentNode && wrapper.parentNode.removeChild(wrapper);
				}
			});			
	
			if ( current ) {
				current.classList.add('render-view-leave');
				current.classList.remove('render-view-enter');
			}

			wrapper.classList.add("render-item", "render-view-enter");
			wrapper.innerHTML = route.cache;		

			this._renderView.appendChild(wrapper);
			
			if ( this.updatePageTitle ) { 
				this._updatePageTitle(route);
			}

			this._processClbks(route, wrapper);
			this._processClbks({ name: "_end" }, wrapper);	
			if ( !location.hash ) window.scrollTo(0,0);
		}

		_processClbks(current, wrapper = null) {
			return this._callbacks.filter(c => c.name === current.name).forEach(c => c.callback(this.getRoute(), current, wrapper));
		}

		_updatePageTitle(route) {
			let title = route.name.charAt(0).toUpperCase() + route.name.slice(1);
			document.title = this._pageTitlePlaceHolder + ":  " + title;		
		}
		
		_updateHistory(route) {
			var path = Array.isArray(route.path) ? route.path[0] : route.path;
			history.pushState({page: path}, route.name, path);
		}		
	}
}));