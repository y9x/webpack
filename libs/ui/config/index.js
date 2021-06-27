'use strict';

var { utils, store } = require('../consts'),
	DataStore = require('../../datastore'),
	PanelDraggable = require('../paneldraggable'),
	Control = require('./control'),
	Tab = require('./tab'),
	clone_obj = obj => JSON.parse(JSON.stringify(obj)),
	assign_deep = (target, ...objects) => {
		for(let ind in objects)for(let key in objects[ind]){
			if(typeof objects[ind][key] == 'object' && objects[ind][key] != null && key in target)assign_deep(target[key], objects[ind][key]);
			else if(typeof target == 'object' && target != null)Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(objects[ind], key))
		}
		
		return target;
	};

class Config extends PanelDraggable {
	constructor(title, key, store = new DataStore()){
		super('config');	
		
		this.store = store;
		
		this.config_key = key;
		
		this.presets = new Map();
		
		this.sections = new Set();
		
		this.title = this.listen_dragging(utils.add_ele('div', this.node, { textContent: title, className: 'title' }));
		
		this.title_right = utils.add_ele('div', this.title, { className: 'right' });
		
		this.sidebar_con = utils.add_ele('div', this.node, { className: 'tabs' });
		this.sections_con = utils.add_ele('div', this.node, { className: 'sections' });
		
		this.apply_bounds();
	}
	get default_section(){
		var first;
		
		for(let section of this.sections){
			if(section.visible)return section;
			if(!first)first = section;
			if(section.name == this.config.section)return section;
		}
		
		return first;
	}
	update(init){
		this.apply_bounds();
		
		for(let section of this.sections){
			section.update(init);
			
			if(section == this.default_section)section.show(init);
			else section.hide();
		}
		
		this.title_right.textContent = [ 'F1', this.config.binds.toggle ].map(utils.string_key).join(' / ');
	}
	add_tab(name){
		var tab = new Tab(name, this);
		
		this.sections.add(tab);
		
		return tab;
	}
	add_preset(label, value){
		this.presets.set(label, value);
		this.emit('add-preset', label, value);
	}
	async insert_config(data, save = false, addon = {}){
		this.config = utils.assign_deep(utils.clone_obj(this.presets.get('Default')), data, addon);
		
		if(save)await this.save_config();
		
		this.emit('config', save);
		
		this.update(true);
	}
	async load_preset(preset, addon = {}){
		if(!this.presets.has(preset))throw new Error('Invalid preset:', preset);
		
		this.insert_config(this.presets.get(preset), true, addon);
	}
	async save_config(){
		this.emit('config');
		
		await this.store.set(this.config_key, this.config);
	}
	async load_config(){
		this.insert_config(await this.store.get(this.config_key, 'object'));
		
		this.pos = { x: 1, y: this.center_side('height') };
		this.apply_bounds();
		this.load_ui_data();
	}
};

module.exports = Config;