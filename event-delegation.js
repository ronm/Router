//element closest polyfill
if (window.Element && !Element.prototype.closest) {
	Element.prototype.closest = function(s) {
	    var matches = (this.document || this.ownerDocument).querySelectorAll(s),i,el = this;
	    do { i = matches.length; while (--i >= 0 && matches.item(i) !== el) {}; } while ((i < 0) && (el = el.parentElement));return el;
	};
}

(function() {
	var on = function(type, sel, clbk) {
		var el = this, callback;
		if ( !clbk ) { clbk = sel; sel = null; }
		if ( !sel ) {
			callback = clbk;
		} else {
			callback = function(event) {
				if ( event.target.matches(sel) ) {
					clbk.call(el, event);
				} else {
					var closest = event.target.closest(sel);
					if ( el.contains(closest) ) {
						clbk.call(el, event);
					}
				}
			};
		}

		this.addEventListener(type, callback);
		this.eventList = this.eventList ? this.eventList : {};
		this.eventList[getKey(clbk)] = callback;
	},
	off = function(type, clbk) {
		var callback = this.eventList[getKey(clbk)];
		this.removeEventListener(type, callback);
	},
	getKey = function(func) {
		return btoa(func.toString()).substring(0,20)
	};
	
	Element.prototype.on = on;
	Element.prototype.off = off;
})();