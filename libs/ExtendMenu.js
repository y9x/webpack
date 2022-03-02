'use strict';

var utils = require('../libs/Utils'),
	Events = require('./Events'),
	HTMLProxy = require('./HTMLProxy'),
	Category = require('./MenuUI/Window/Category'),
	console = require('./console');

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
			indexes = {},
			get = settings.getSettings;

		
		for(let i in settings.tabs){
			indexes[i] = settings.tabs[i].length;
			
			settings.tabs[i].push({
				name: label,
				categories: [],
			});
		}

		settings.getSettings = () => settings.tabIndex == indexes[settings.settingType] ? this.html.get() : get.call(settings);
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