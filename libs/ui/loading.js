'use strict';

var { frame, utils, panels } = require('./consts');

class Loading {
	constructor(discord){
		this.node = utils.add_ele('div', frame.contentWindow.document.documentElement, { className: 'loading' });
		
		utils.add_ele('div', this.node);
		
		utils.add_ele('a', this.node, { href: discord, draggable: false, target: '_blank' });
		
		panels.push(this);
		
		this.show();
	}
	show(){
		this.visible = true;
		this.update();
	}
	hide(){
		this.visible = false;
		this.update();
	}
	blur(){}
	focus(){}
	update(){
		this.node.classList[this.visible ? 'remove' : 'add']('hidden');
	}
};

module.exports = Loading;