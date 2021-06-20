'use strict';

var { frame, utils } = require('./consts'),
	Panel = require('./panel');

class Loading extends Panel {
	constructor(discord, icon){
		super('loading');
		
		utils.add_ele('img', this.node, { src: icon });
		
		utils.add_ele('a', this.node, { href: discord, draggable: false, target: '_blank' });
		
		this.show();
	}
	update(){
		this.node.classList[this.visible ? 'remove' : 'add']('hidden');
	}
};

module.exports = Loading;