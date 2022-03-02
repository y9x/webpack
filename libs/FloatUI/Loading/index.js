'use strict';

var utils = require('../../Utils'),
	Panel = require('../Panel');

class Loading extends Panel {
	constructor(frame, discord, icon){
		super(frame, 'loading');
		
		this.frame.css('loading', require('./index.css'));
		
		utils.add_ele('img', this.node, { src: icon });
		
		utils.add_ele('a', this.node, { href: discord, draggable: false, target: '_blank' });
		
		this.show();
	}
	update(){
		this.node.classList[this.visible ? 'remove' : 'add']('hidden');
	}
};

module.exports = Loading;