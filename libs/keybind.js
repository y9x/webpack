'use strict';

class Keybind {
	static keybinds = new Set();
	constructor(repeat = false){
		this.repeat = repeat;
		this.keys = new Set();
		this.callbacks = new Set();
		Keybind.keybinds.add(this);
	}
	delete(){
		Keybind.keybinds.delete(this);
	}
	set_key(...args){
		return this.keys = new Set(), this.add_key(...args);
	}
	set_callback(...args){
		return this.callbacks = new Set(), this.add_key(...args);
	}
	add_key(...keys){
		for(let key of keys)this.keys.add(key);
		return this;
	}
	add_callback(...funcs){
		for(let func of funcs)this.callbacks.add(func);
		return this;
	}
};

window.addEventListener('keydown', event => {
	if(document.activeElement && ['TEXTAREA', 'INPUT'].includes(document.activeElement.tagName))return;
	
	for(let keybind of Keybind.keybinds)if((!event.repeat || keybind.repeat) && keybind.keys.has(event.code)){
		event.preventDefault();
		for(let callback of keybind.callbacks)callback();
	}
});

module.exports = Keybind;