'use strict';

var EventLite  = require('event-lite');

class Addon {
	constructor(menu, args){
		this.menu = menu;
		this.window = menu.window;
		
		this.create(...args);
	}
	ready(){
		console.info(this.name, 'loaded');
		this.emit('ready');
	}
	create(){}
};

EventLite.mixin(Addon.prototype);

module.exports = Addon;