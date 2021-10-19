'use strict';

var utils = require('../libs/utils'),
	Events = require('./Events'),
	HTMLProxy = require('./HTMLProxy'),
	Category = require('./MenuUI/Window/Category');

class ExtendMenu extends Events {
	html = new HTMLProxy();
	async save_config(){
		console.error('save_config() not implemented');
	}
	async load_config(){
		console.error('load_config() not implemented');
	}
	tab = {
		content: this.html,
		window: {
			menu: this,
		},
	};
	async insert(label){
		var array = await utils.wait_for(() => typeof windows == 'object' && windows),
			settings = array[0],
			index = settings.tabs.length,
			get = settings.getSettings;
	
		settings.tabs.push({
			name: label,
			categories: [],
		});
		
		settings.getSettings = () => settings.tabIndex == index ? this.html.get() : get.call(settings);
	}
	categories = new Set();
	category(label){
		var cat = new Category(this.tab, label);
		this.categories.add(cat);
		return cat;
	}
	update(init = false){
		for(let category of this.categories)category.update(init);	
	}
	constructor(){
		super();
	}
};

module.exports = ExtendMenu;