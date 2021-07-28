'use strict';

var { utils, store } = require('../consts'),
	EventLite  = require('event-lite');

class Panel {
	constructor(frame, type = ''){
		this.frame = frame;
		
		this.frame.css('panel', require('./index.css'));
		
		this.type = type;
		this.visible = true;
		this.hover = true;
		this.node = utils.add_ele('main', this.frame, { className: this.type });
		
		this.frame.panels.add(this);
		
		this.node.addEventListener('mousedown', () => this.focus());
	}
	focus(){
		for(let panel of this.frame.panels)if(panel != this)panel.blur();
		this.node.classList.add('focus');
		this.node.style['z-index'] = 3;
	}
	blur(){
		this.node.classList.remove('focus');
		this.node.style['z-index'] = 2;
	}
	show(){
		this.focus();
		this.visible = true;
		this.node.classList.add('visible');
	}
	hide(){
		this.visible = false;
		this.node.classList.remove('visible');
	}
	remove(){
		this.frame.panels.delete(this);
		this.hide();
		this.node.remove();
	}
};

EventLite.mixin(Panel.prototype);

module.exports = Panel;