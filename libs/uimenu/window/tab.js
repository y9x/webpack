'use strict';

var { utils, tick } = require('../consts'),
	Control = require('../control');

class Category {
	constructor(tab, label){
		this.tab = tab;
		
		if(label){
			this.header = utils.add_ele('div', this.tab.content, {
				className: 'setHed',
			});
			
			this.header_status = utils.add_ele('span', this.header, { className: 'material-icons plusOrMinus' });
			
			utils.add_ele('text', this.header, { nodeValue: label });
			
			this.header.addEventListener('click', () => this.toggle());
		}
		
		this.content = utils.add_ele('div', this.tab.content, {
			className: 'setBodH',
		});
		
		if(label)this.expand();
	}
	toggle(){
		if(this.collapsed)this.expand();
		else this.collapse();
	}
	collapse(){
		this.collapsed = true;
		this.content.style.display = 'none';
		this.header_status.textContent = 'keyboard_arrow_right';
	}
	expand(){
		this.collapsed = false;
		this.content.style.display = 'block';
		this.header_status.textContent = 'keyboard_arrow_down';
	}
	add_control(data){
		for(let type of Control.Types)if(type.id == data.type){
			let control = new type(data, this);
			
			this.tab.controls.add(control);
			
			return control;
		}
		
		throw new TypeError('Unknown type: ' + data.type);
	}
}

class Tab {
	constructor(window, label){
		this.window = window;
		
		this.button = utils.add_ele('div', this.window.tab_layout, {
			className: 'settingTab',
			textContent: label,
		});
		
		tick(this.button);
		
		this.controls = new Set();
		
		this.content = utils.add_ele('div', window.container, { id: 'settHolder' });
		
		this.hide();
		
		this.button.addEventListener('click', () => this.show());
	}
	add_category(label){
		return this.last_category = new Category(this, label);
	}
	add_control(data){
		if(!this.last_category || !this.last_category.is_default){
			this.last_category = this.add_category();
			this.last_category.is_default = true;
		}
		
		return this.last_category.add_control(data);
	}
	update(init = false){
		for(let control of this.controls)control.update(init);
	}
	show(){
		this.visible = true;
		for(let tab of this.window.tabs)if(tab != this)tab.hide();
		this.button.classList.add('tabANew');
		this.content.style.display = 'block';
	}
	hide(){
		this.visible = false;
		this.button.classList.remove('tabANew');
		this.content.style.display = 'none';
	}
};

module.exports = Tab;