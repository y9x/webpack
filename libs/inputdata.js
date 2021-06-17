'use strict';

var vars = require('./vars'),
	keys = {};

class InputData {
	constructor(array){
		this.array = array;
	}
	get keys(){
		return document.activeElement.tagName == 'INPUT' ? {} : keys;
	}
	get focused(){
		return document.pointerLockElement != null;
	}
};

document.addEventListener('keydown', event => keys[event.code] = true);

document.addEventListener('keyup', event => delete keys[event.code]);

window.addEventListener('blur', () => keys = {});

InputData.previous = {};

for(let prop in vars.keys){
	let key = vars.keys[prop];
	
	Object.defineProperty(InputData.prototype, prop, {
		get(){
			return this.array[key];
		},
		set(value){
			return this.array[key] = typeof value == 'boolean' ? +value : value;
		},
	});
}

module.exports = InputData;

window.InputData = InputData;