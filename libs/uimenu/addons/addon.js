'use strict';

class Addon {
	constructor(menu, args){
		this.menu = menu;
		this.window = menu.window;
		
		this.create(...args);
	}
	ready(){
		this.handle_header(this.window.header);
		console.info(this.name, 'loaded');
	}
	create(){}
	handle_preset(){}
	handle_config(){}
	handle_header(){}
	handle_tab(){}
	handle_preset(){}
	handle_control(){}
};

module.exports = Addon;