'use strict';

var { tick, select } = require('./consts'),
	utils = require('../Utils'),
	Events = require('../Events');

class MenuButton extends Events {
	constructor(label, icon){
		super();
		
		this.node = utils.crt_ele('div', {
			className: 'menuItem',
		});
		
		this.icon = utils.add_ele('div', this.node, {
			className: 'menuItemIcon',
			style: {
				'background-image': 'url(' + JSON.stringify(icon) + ')',
			},
		});
		
		this.label = utils.add_ele('div', this.node, {
			className: 'menuItemTitle',
			textContent: label,
		});
		
		this.node.addEventListener('click', () => this.emit('click'));
		
		tick(this.node);
		select(this.node);
		
		this.hide();
	}
	attach(bar){
		bar.append(this.node);
	}
	show(){
		this.node.style.display = 'flex';
	}
	hide(){
		this.node.style.display = 'none';
	}
};

module.exports = MenuButton;