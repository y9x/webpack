'use strict';

class Keybind {
	static keybinds = new Set();
	constructor(key, callback){
		this.keys = new Set();
		this.callbacks = new Set();
		Keybind.keybinds.add(this);
		
		if(typeof key == 'string'){
			this.key(key);
			key = callback;
		}
		
		if(typeof key == 'function')this.callback(callback);
	}
	delete(){
		Keybind.keybinds.delete(this);
	}
	set_key(...args){
		return this.keys = new Set(), this.key(...args);
	}
	set_callback(...args){
		return this.callbacks = new Set(), this.key(...args);
	}
	key(...keys){
		for(let key of keys)this.keys.add(key);
		return this;
	}
	callback(...funcs){
		for(let func of funcs)this.callbacks.add(func);
		return this;
	}
};

window.addEventListener('keydown', event => {
	if(event.repeat)return;
	for(let node of [...event.composedPath()])if(node.tagName)for(let part of ['INPUT', 'TEXTAREA'])if(node.tagName.includes(part))return;
	
	//  || keybind.repeat
	for(let keybind of Keybind.keybinds)if((!event.repeat) && keybind.keys.has(event.code)){
		event.preventDefault();
		for(let callback of keybind.callbacks)callback(event);
	}
});

module.exports = Keybind;