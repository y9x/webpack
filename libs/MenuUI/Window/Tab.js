'use strict';

var { tick, select } = require('../consts'),
	utils = require('../../Utils'),
	Category = require('./Category');

class Tab {
	constructor(window, label){
		this.window = window;
		
		this.button = utils.add_ele('div', this.window.tab_layout, {
			className: 'settingTab',
			textContent: label,
			events: {
				click: () => this.show(),
			},
		});
		
		tick(this.button);
		select(this.button);
		
		this.categories = new Set();
		
		this.content = utils.add_ele('div', window.container, { id: 'settHolder' });
		
		this.hide();
	}
	category(label){
		var category = this.last_category = new Category(this, label);
		
		this.categories.add(category);
		
		return category;
	}
	control(...args){
		var category = this.last_category;
		
		if(!category || !category.is_default){
			category = this.category();
			category.is_default = true;
		}
		
		return category.control(...args);
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