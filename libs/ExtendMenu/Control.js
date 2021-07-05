'use strict';

var Utils = require('../Utils'),
	utils = new Utils();

class Control {};

class RotateControl {
	static id = 'rotate';
	constructor(name, data){
		this.name = name;
		this.data = data;
		
		this.content = utils.crt_ele('div', { className: 'setBodH' });
		
		this.sub = utils.add_ele('div', this.content, { className: 'settName' });
		
		this.label = utils.add_ele('text', this.sub, { nodeValue: this.name });
		
		this.select = utils.add_ele('select', this.sub, {
			className: 'inputGrey2',
			events: { change: () => this.change() },
		});
		
		for(let key in this.data.value)utils.add_ele('option', this.select, {
			value: key,
			textContent: key,
		});
		
		this.init = true;
		this.value = this.data.value;
		this.init = false;
	}
	get value(){
		return this.data.value[this.select.value];
	}
	set value(value){
		for(let prop in this.data.value)if(this.data.value[prop] == value)this.select.value = prop;
		this.select.value = value;
		this.change();
		return value;
	}
	change(){
		if(typeof this.data.change == 'function')this.data.change(this.init, this.value, value => this.select.value = value);
	}
};

Control.Types = [
	RotateControl,
];

module.exports = Control;