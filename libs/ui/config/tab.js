'use strict';

var { utils } = require('../consts'),
	Control = require('./control');

class Tab {
	constructor(name, panel){
		this.panel = panel;
		
		this.node = utils.add_ele('section', this.panel.sections_con);
		
		this.name = name;
		
		this.controls = new Set();
		
		this.button = utils.add_ele('div', this.panel.sidebar_con, { className: 'open', textContent: this.name });
		
		this.button.addEventListener('click', () => this.interact());
		
		this.hide();
	}
	interact(){
		this.show();
		
		for(let section of this.panel.sections)if(section != this)section.hide();
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
		if(!init)this.panel.save_config();
	}
	hide(){
		this.button.classList.remove('active');
		
		this.node.classList.add('hidden');
	}
	add_control(name, data){
		for(let type of Control.Types)if(type.id == data.type){
			let control = new type(name, data, this);
			
			this.controls.add(control);
			
			return control;
		}
		
		throw new TypeError('Unknown type: ' + data.type);
	}
};

module.exports = Tab;