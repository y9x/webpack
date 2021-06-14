'use strict';

var vars = require('./vars');

class InputData {
	constructor(array){
		this.array = array;
	}
	get focused(){
		return document.pointerLockElement != null;
	}
};

InputData.prototype.keys = {};

window.addEventListener('keydown', event => InputData.prototype.keys[event.code] = true);

window.addEventListener('keyup', event => delete InputData.prototype.keys[event.code]);

window.addEventListener('blur', InputData.prototype.keys = {});

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