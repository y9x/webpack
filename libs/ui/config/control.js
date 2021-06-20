'use strict';

require('../../ez');

var { keybinds, utils } = require('../consts'),
	EventLite  = require('event-lite');

class Control {
	static content_tag = 'div';
	constructor(name, data, section){
		this.name = name;
		this.data = data;
		this.panel = section.panel;
		this.section = section;
		this.content = utils.add_ele(this.constructor.content_tag, this.section.node, { className: 'control' });
		this.label = utils.add_ele('text', this.content);
		
		this.create();
		
		/*if(!this.data.menu_hidden && !this.panel.visible)return;
		
		this.interact();
		this.update();*/
	}
	create(){}
	remove(){
		this.content.remove();
	}
	get key(){
		if(!this.data.key)return null;
		
		var walked = this.walk(this.data.key);
		return walked[0][walked[1]];
	}
	walk(data){
		var state = this.panel.config,
			last_state,
			last_key;
		
		data.split('.').forEach(key => state = ((last_state = state)[last_key = key] || {}));
		
		return [ last_state, last_key ];
	}
	get value(){
		if(!this.data.walk || this.data.value && typeof this.data.value != 'object')return this.data.value;
		
		var walked = this.walk(this.data.walk);
		
		return walked[0][walked[1]];
	}
	set value(value){
		var walked = this.walk(this.data.walk);
		
		walked[0][walked[1]] = value;
		
		this.panel.save_config();
		
		this.emit('change', value);
		
		return value;
	}
	interact(){
		console.warn('No defined interaction for', this);
	}
	update(){}
	label_text(){
		this.label.nodeValue = this.name;
	}
};

EventLite.mixin(Control.prototype);

class BooleanControl extends Control {
	static id = 'boolean';
	static content_tag = 'label';
	create(){
		this.input = utils.add_ele('ez-checkbox', this.content);
		this.input.addEventListener('change', () => this.value = this.input.checked);
	}
	interact(){
		this.value = !this.value;
	}
	update(init){
		super.label_text(this.name);
		if(init)this.input.checked = this.value;
	}
};

class RotateControl extends Control {
	static id = 'rotate';
	create(){
		this.select = utils.add_ele('ez-select', this.content);
		
		this.select.addEventListener('change', () => this.value = this.select.value);
		
		for(let value in this.data.value)utils.add_ele('ez-option', this.select, {
			textContent: this.data.value[value],
			value: value,
		});
	}
	interact(){
		var keys = Object.keys(this.data.value),
			ind = keys.indexOf(this.value);
		
		this.select.value = this.value = keys[ind + 1] || keys[0];
	}
	update(init){
		this.label_text(this.name);
		if(init)this.select.value = this.value;
	}
};

class LinkControl extends Control {
	static id = 'link';
	static content_tag = 'a';
	interact(){
		this.content.click();
	}
	update(){
		super.label_text(this.name);
		this.content.href = this.value;
	}
};

class FunctionControl extends Control {
	static id = 'function';
	static content_tag = 'a';
	create(){
		this.content.addEventListener('click', () => this.interact());
	}
	interact(){
		this.value();
	}
	update(){
		super.label_text(this.name);
	}
};

class KeybindControl extends Control {
	static id = 'keybind';
	create(){
		this.input = utils.add_ele('ez-input', this.content, { placeholder: 'Press a key' });
		
		this.input.addEventListener('focus', () => {
			this.input.value = '';
		});
		
		this.input.addEventListener('blur', () => {
			this.update();
		});
		
		this.input.addEventListener('keydown', event => {
			event.stopImmediatePropagation();
			this.value = event.code == 'Escape' ? null : event.code;
			this.input.blur();
		});
	}
	update(init){
		this.label_text(this.name);
		this.input.value = this.value ? utils.string_key(this.value) : 'Unset';
	}
};

class TextBoxControl extends Control {
	static id = 'textbox';
	update(){
		this.button.style.display = 'none';
		this.input.value = ('' + this.value).substr(0, this.data.max_length);
	}
};

class SliderControl extends Control {
	static id = 'slider';
	create(){
		this.input = utils.add_ele('ez-slider', this.content, {
			min: this.data.min,
			max: this.data.max,
			step: this.data.step,
		});
		
		this.input.labels = this.data.labels;
		
		this.input.addEventListener('change', () => this.value = this.input.value);
	}
	update(init){
		this.label_text(this.name);
		if(init)this.input.value = this.value;
		else this.input.render();
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
];

module.exports = Control;