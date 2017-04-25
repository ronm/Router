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
	
	onRequest(callback) {
		this._callbacks.push({name: "_start", callback: callback});
		return this;		
	}
	
	onResponse(callback) {
		this._callbacks.push({name: "_end", callback: callback});
		return this;
	}
	
	onInserted(callback) {
		this._callbacks.push({name: "_inserted", callback: callback});
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
			
			this._processClbks({ name: "_start" });

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
			[].forEach.call(current, c => {
				c.addEventListener("animationend", () => { 
					c.parentNode && c.parentNode.removeChild(c);
				});
				c.classList.add('render-view-leave');
				c.classList.remove('render-view-enter');
			});
			
			wrapper.addEventListener("animationend", () => { 
				if (wrapper.classList.contains("render-view-enter") ) {
					this._processClbks({ name: "_inserted" });
				}
			});
			
			wrapperClass.add("render-view-enter");
		}
		this.renderView.appendChild(wrapper);
		this._updatePageTitle(route);
		this._processClbks(route);
		this._processClbks({ name: "_end" });		
		if ( !location.hash ) window.scrollTo(0,0);
	}
	
	_getCurrent() { 
		let current = this._routes.filter(function(r) {
			return Array.isArray(r.path) ? r.path.indexOf(location.pathname) > -1 : r.path === location.pathname;
		});
		
		return current.length ? current[0] : null;
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

module.exports = Router;