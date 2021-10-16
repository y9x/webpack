'use strict';

var utils = require('../../Utils');

class Checkbox extends HTMLElement {
	constructor(){
		super();
		
		var shadow = this.attachShadow({ mode: 'closed' });
		
		this.main = utils.add_ele('main', shadow);
		
		utils.add_ele('style', shadow, { textContent: require('./index.css') });
		
		utils.add_ele('raw', this.main, {
			html: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="20.48709 9.38972 347.419817 323.510251"><path fill="#FFF" d="M20.4870895 204.5433142L77.52349 147.5069859l121.370786 121.3709088-46.520215 60.4916464L20.4870895 204.5433142z"/><path fill="#FFF" d="M93.1260928 273.3565085L304.6042249 9.3897157l63.3026884 50.7152387L156.428781 324.0717471z"/></svg>',
		});
		
		this.addEventListener('click', () => (this.checked ^= 1, this.dispatchEvent(new Event('change'))));
	}
	get checked(){
		return this.main.hasAttribute('checked');
	}
	set checked(value){
		return this.main[(value ? 'set' : 'remove') + 'Attribute']('checked', ''), this;
	}
};

exports.Checkbox = Checkbox;