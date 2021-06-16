'use strict';

var { utils, tick } = require('../consts'),
	Control = require('../control');

class Category {
	constructor(tab, label){
		this.tab = tab;
		
		this.controls = new Set();
		
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
	update(init = false){
		for(let control of this.controls)control.update(init);
	}
	toggle(){
		if(this.collapsed)this.expand();
		else this.collapse();
	}
	collapse(){
		this.collapsed = true;
		this.update();
	}
	expand(){
		this.collapsed = false;
		this.update();
	}
	update(init){
		this.content.style.display = this.collapsed ? 'none' : 'block';
		
		if(this.header){
			this.header.style.display = 'block';
			this.header_status.textContent = 'keyboard_arrow_' + (this.collapsed ? 'right' : 'down');
		}
		
		for(let control of this.controls)control.update(init);
	}
	show(){
		this.expand();
		if(this.header)this.header.style.display = 'block';
	}
	hide(){
		this.content.style.display = 'none';
		if(this.header)this.header.style.display = 'none';
	}
	fix(){
		this.update();
		for(let control of this.controls)control.show_content();
	}
	add_control(data){
		for(let type of Control.Types)if(type.id == data.type){
			let control = new type(data, this);
			
			this.controls.add(control);
			
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
		
		this.categories = new Set();
		
		this.content = utils.add_ele('div', window.container, { id: 'settHolder' });
		
		this.hide();
		
		this.button.addEventListener('click', () => this.show());
	}
	add_category(label){
		var category = this.last_category = new Category(this, label);
		
		this.categories.add(category);
		
		return category;
	}
	add_control(data){
		var category = this.last_category;
		
		if(!category || !category.is_default){
			category = this.add_category();
			category.is_default = true;
		}
		
		return category.add_control(data);
	}
	update(init){
		for(let category of this.categories)category.update(init);
	}
	show(){
		this.visible = true;
		for(let tab of this.window.tabs)if(tab != this)tab.hide();
		this.button.classList.add('tabANew');
		this.show_content();
		this.window.menu.emit('tab-shown');
		
		for(let category of this.categories)category.fix();
	}
	hide(){
		this.visible = false;
		this.button.classList.remove('tabANew');
		this.hide_content();
	}
	show_content(){
		this.content.style.display = 'block';
	}
	hide_content(){
		this.content.style.display = 'none';
	}
};

module.exports = Tab;