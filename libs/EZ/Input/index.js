'use strict';

var utils = require('../../Utils');

class Input extends HTMLElement {
	constructor(){
		super();
		
		var shadow = this.attachShadow({ mode: 'closed' });
		
		utils.add_ele('style', shadow, { textContent: require('./index.css') });
		this.main = utils.add_ele('main', shadow);
		
		this.input = utils.add_ele('input', this.main);
		
		for(let event of ['focus', 'blur', 'keydown', 'change'])utils.redirect(event, this.input, this);
		
		this.addEventListener('mousedown', () => this.input.focus());
	}
	blur(){
		this.input.blur();
	}
	focus(){
		this.input.focus();
	}
	get value(){
		return this.input.value;
	}
	set value(value){
		return this.input.value = value;
	}
	get placeholder(){
		return this.input.placeholder;
	}
	set placeholder(value){
		return this.input.placeholder = value;
	}
};

exports.Input = Input;