'use strict';

var vars = require('./vars');

class InputData {
	constructor(array){
		this.array = array;
	}
};

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