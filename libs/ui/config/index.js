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

class TextElement {
	static id = 'text';
	constructor(data, section){
		this.data = data;
		this.panel = section.ui;
		this.container = utils.add_ele('div', section.node, { className: 'control' });
		this.node = utils.add_ele('div', this.container, { className: 'text' });
	}
	update(){
		this.node.textContent = this.data.name;
		
		this.node.innerHTML = this.node.innerHTML
		.replace(/\[([^\[]+)\]\(([^\)]+)\)/g, (match, text, link) => `<a href=${JSON.stringify(link)}>${text}</a>`)
		.replace(/(\*\*|__)(.*?)\1/g, (match, part, text) => `<strong>${text}</strong>`)
		.replace(/(\*|_)(.*?)\1/g, (match, part, text) => `<em>${text}</em>`)
		.replace(/\~\~(.*?)\~\~/g, (match, part, text) => `<del>${text}</del>`)
		;
	}
}

class BooleanControl extends Control {
	static id = 'boolean';
	interact(){
		this.value = !this.value;
	}
	update(){
		super.update();
		this.button.className = 'toggle ' + !!this.value;
	}
}

class RotateControl extends Control {
	static id = 'rotate';
	get value_index(){
		return this.data.vals.findIndex(([ data ]) => data == this.value);
	}
	set value_index(value){
		this.value = this.data.vals[value][0];
	}
	interact(){
		this.value_index = (this.value_index + 1) % this.data.vals.length
	}
	update(){
		super.update();
		if(!this.data.vals[this.value_index])this.value_index = 0;
		this.label.textContent = this.name + ': ' + this.data.vals[this.value_index][1];
	}
}

class LinkControl extends Control {
	static id = 'link';
	interact(){
		window.open(this.value, '_blank');
	}
}

class FunctionControl extends Control {
	static id = 'function';
	interact(){
		this.value();
	}
}

class KeybindControl extends Control {
	static id = 'keybind';
	constructor(...args){
		super(...args);
		
		this.input = utils.add_ele('input', this.container, { className: 'keybind', placeholder: 'Press a key' });
		
		this.input.addEventListener('focus', () => {
			this.input.value = '';
		});
		
		this.input.addEventListener('blur', () => {
			this.panel.update();
			this.update();
		});
		
		this.input.addEventListener('keydown', event => {
			event.preventDefault();
			this.value = event.code == 'Escape' ? null : event.code;
			this.input.blur();
		});
	}
	update(){
		super.update();
		this.button.style.display = 'none';
		this.label.textContent = this.name + ':';
		this.input.value = this.value ? utils.string_key(this.value) : 'Unset';
	}
}

class TextBoxControl extends Control {
	static id = 'textbox';
	update(){
		this.button.style.display = 'none';
		this.input.value = ('' + this.value).substr(0, this.data.max_length);
	}
}

class SliderControl extends Control {
	static id = 'slider';
	constructor(...args){
		super(...args);
		
		var movement = { held: false, x: 0, y: 0 },
			rtn = (number, unit) => (number / unit).toFixed() * unit,
			update_slider = event => {
				if(!movement.held)return;
				
				var slider_box = this.slider.getBoundingClientRect(),
					min_val = this.data.range[0],
					max_val = this.data.range[1],
					unit = this.data.range[2],
					perc = ((event.pageX - slider_box.x) / slider_box.width) * 100,
					value = Math.max((((max_val)*perc/100)).toFixed(2), min_val);
				
				if(unit)value = rtn(value, unit);
				
				if(event.clientX <= slider_box.x)value = perc = min_val;
				else if(event.clientX >= slider_box.x + slider_box.width)value = max_val, perc = 100;
				
				this.value = value;
				this.update();
			};
		
		this.slider = utils.add_ele('div', this.container, { className: 'slider' });
		this.background = utils.add_ele('div', this.slider, { className: 'background' });
		
		this.slider.addEventListener('mousedown', event=>{
			movement = { held: true, x: event.layerX, y: event.layerY }
			update_slider(event);
		});
		
		global_listen('mouseup', () => movement.held = false );
		
		global_listen('mousemove', event => update_slider(event));
	}
	update(){
		super.update();
		this.button.style.display = 'none';
		this.background.style.width = ((this.value / this.data.range[1]) * 100) + '%';
		this.slider.dataset.value = this.data.labels && this.data.labels[this.value] || this.value + (this.data.unit == null ? '%' : this.data.unit);
		this.label.textContent = this.name + ':';
	}
};

Control.Types = [
	KeybindControl,
	RotateControl,
	BooleanControl,
	FunctionControl,
	LinkControl,
	TextBoxControl,
	SliderControl,
	TextElement,
];

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