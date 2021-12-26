'use strict';

var Control = require('./Control'),
	utils = require('../../Utils'),
	console = require('../../console');

class Tab {
	constructor(name, panel){
		this.panel = panel;
		
		this.node = utils.add_ele('section', this.panel.sections_con);
		
		this.name = name;
		
		this.controls = new Set();
		
		this.button = utils.add_ele('div', this.panel.sidebar_con, {
			className: 'open',
			textContent: this.name,
			events: {
				click: () => {
					this.interact();
				},
			},
		});
		
		this.hide();
	}
	interact(){
		this.show();
		
		for(let section of this.panel.tabs)if(section != this)section.hide();
	}
	get visible(){
		return !this.node.classList.contains('hidden');
	}
	update(init){
		for(let control of this.controls)try{
			control.emit('change', control.value, init);
			
			control.update(init);
		}catch(err){
			console.error(err);
		}
	}
	show(init){
		this.button.classList.add('active');
		
		this.node.classList.remove('hidden');
		this.update(init);
		
		this.panel.config.section = this.name;
		// save secton change
		if(!init)this.panel.save_config();
	}
	hide(){
		this.button.classList.remove('active');
		
		this.node.classList.add('hidden');
	}
	control(name, data){
		if(typeof data == 'undefined' && typeof name == 'object')data = name, name = '';
		
		for(let type of Control.Types)if(type.id == data.type){
			let control = new type(name, data, this);
			
			this.controls.add(control);
			
			return control;
		}
		
		throw new TypeError('Unknown type: ' + data.type);
	}
};

module.exports = Tab;