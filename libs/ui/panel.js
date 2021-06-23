'use strict';

var { frame, utils, store } = require('./consts');

utils.add_ele('style', frame, { textContent: require('./panel.css') });

class Panel {
	static panels = new Set();
	constructor(type = ''){
		this.type = type;
		this.visible = true;
		this.hover = true;
		this.node = utils.add_ele('main', frame, { className: this.type });
		
		Panel.panels.add(this);
		
		this.node.addEventListener('mousedown', () => this.focus());
	}
	focus(){
		for(let panel of Panel.panels)if(panel != this)panel.blur();
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
		Panel.panels.delete(this);
		this.hide();
		this.node.remove();
	}
};

module.exports = Panel;