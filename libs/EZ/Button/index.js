'use strict';

var utils = require('../../Utils');

class Button extends HTMLElement {
	constructor(){
		super();
		
		var shadow = this.attachShadow({ mode: 'closed' });
		
		this.main = utils.add_ele('main', shadow);
		
		utils.add_ele('style', shadow, { textContent: require('./index.css') });
		
		utils.add_ele('slot', this.main);
	}
};

exports.Button = Button;