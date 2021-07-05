'use strict';

var vars = require('./Vars'),
	keys = new Set();

class InputData {
	constructor(array){
		this.array = array;
	}
	get keys(){
		return document.activeElement.tagName == 'INPUT' ? new Set() : keys;
	}
	get focused(){
		return document.pointerLockElement != null;
	}
};

document.addEventListener('keydown', event => keys.add(event.code));

document.addEventListener('keyup', event => keys.delete(event.code));

window.addEventListener('blur', () => keys = new Set());

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