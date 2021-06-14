'use strict';

var { keybinds, global_listen, utils, store } = require('../consts'),
	PanelDraggable = require('../paneldraggable'),
	Control = require('./control'),
	clone_obj = obj => JSON.parse(JSON.stringify(obj)),
	assign_deep = (target, ...objects) => {
		for(let ind in objects)for(let key in objects[ind]){
			if(typeof objects[ind][key] == 'object' && objects[ind][key] != null && key in target)assign_deep(target[key], objects[ind][key]);
			else if(typeof target == 'object' && target != null)Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(objects[ind], key))
		}
		
		return target;
	};

class Section {
	constructor(data, panel){
		this.data = data;
		
		this.panel = panel;
		
		this.node = utils.add_ele('section', this.panel.sections_con);
		
		this.default = data.default || false;
		this.type = data.type;
		this.name = data.name;
		
		this.controls = new Set();
		
		this.data = data;
		
		utils.add_ele('div', this.panel.sidebar_con, { className: 'open-section', textContent: this.name }).addEventListener('click', () => this.interact());
		
		this.create_ui();
		
		this.hide();
	}
	interact(){
		this.show();
		
		for(let section of this.panel.sections)if(section != this)section.hide();
	}
	get visible(){
		return !this.node.classList.contains('hidden');
	}
	update(){
		for(let control of this.controls)try{
			control.update();
		}catch(err){
			console.error(err);
		}
	}
	show(dont_save){
		this.node.classList.remove('hidden');
		this.update();
		
		this.panel.config.section = this.name;
		if(!dont_save)this.panel.save_config();
	}
	hide(){
		this.node.classList.add('hidden');
	}
};

class ControlSection extends Section {
	static id = 'control';
	create_ui(){
		for(let data of this.data.value)this.add_control(data);
	}
	add_control(data){
		for(let type of Control.Types)if(type.id == data.type)return this.controls.add(new type(data, this));
		throw new TypeError('Unknown type: ' + data.type);
	}
};

class FunctionSection extends Section {
	static id = 'function';
	interact(){
		this.data.value();
	}
};

Section.Types = [
	ControlSection,
	FunctionSection,
];

class Config extends PanelDraggable {
	constructor(data){
		super(data, 'config');	
		
		this.default_config = {};
		
		this.sections = new Set();
		
		this.title = this.listen_dragging(utils.add_ele('div', this.node, { textContent: data.title, className: 'title' }));
		
		utils.add_ele('div', this.title, { className: 'version', textContent: 'v' + data.version });
		
		this.sections_con = utils.add_ele('div', this.node, { className: 'sections' });
		this.sidebar_con = utils.add_ele('div', this.sections_con, { className: 'sidebar' });
		
		keybinds.push(this.toggle_bind = {
			code: [ 'F1' ],
			interact: () => {
				// this.save_config();
				
				if(this.visible)this.hide();
				else this.show();
			},
		});
		
		this.footer = utils.add_ele('footer', this.node);
		
		this.apply_bounds();
	}
	get default_section(){
		var defaults,
			active_config;
		
		for(let section of this.sections)if(section.visible)return section;
		else if(section.default)defaults = section;
		else if(section.name == this.config.section)active_config = section;
		
		return active_config || defaults;
	}
	update(start){
		this.apply_bounds();
		
		this.default_section.show(start);
		
		for(let section of this.sections)if(section != this.default_section)section.hide();
		
		this.toggle_bind.code = [ 'F1', this.config.binds.toggle ];
		
		var bind = this.toggle_bind.code.map(utils.string_key).map(x => '[' + x + ']').join(' or ');
		
		this.footer.textContent = `Press ${bind} to toggle`;
	}
	add_section(data){
		for(let type of Section.Types)if(type.id == data.type)return this.sections.add(new type(data, this));
		throw new TypeError('Unknown type: ' + data.type);
	}
	async reset_config(){
		this.config = clone_obj(this.default_config);
		this.update(false);
		
		await this.save_config();
	}
	async save_config(){
		await store.set('config', this.config);
	}
	async load_config(){
		this.config = assign_deep(clone_obj(this.default_config), await store.get('config', 'object'));
		this.update(true);
		
		setTimeout(() => {
			this.pos = { x: 1, y: this.center_side('height') };
			this.apply_bounds();
			this.load_ui_data();
		});
	}
};

module.exports = Config;