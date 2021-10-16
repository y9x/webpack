'use strict';

var utils = require('../../Utils');

class Switch extends HTMLElement {
	constructor(){
		super();
		
		var shadow = this.attachShadow({ mode: 'closed' });
		
		this.main = utils.add_ele('main', shadow);
		
		utils.add_ele('style', shadow, { textContent: require('./index.css') });
		
		this.addEventListener('click', () => (this.checked ^= 1, this.dispatchEvent(new Event('change'))));
	}
	get checked(){
		return this.main.hasAttribute('checked');
	}
	set checked(value){
		return this.main[(value ? 'set' : 'remove') + 'Attribute']('checked', ''), this;
	}
};

exports.Switch = Switch;