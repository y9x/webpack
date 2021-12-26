'use strict';

var Events  = require('../Events'),
	console = require('../console');

class Addon extends Events {
	constructor(menu, args){
		super();
		
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

module.exports = Addon;