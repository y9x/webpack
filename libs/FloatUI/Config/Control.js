'use strict';

require('../../EZ');

var { keybinds } = require('../consts'),
	utils = require('../../Utils'),
	Events  = require('../../Events'),
	console = require('../../console');

class Control extends Events {
	constructor(name, data, section){
		super();
		
		this.name = name;
		this.data = data;
		this.panel = section.panel;
		this.section = section;
		this.content = utils.add_ele('div', this.section.node, { className: 'control' });
		this.label = utils.add_ele('text', this.content, {
			nodeValue: this.name,
		});
		
		this.content.addEventListener('click', event => {
			// wait for stack to clear (changes set on event)
			if(!([ this.content, this.label ].includes(event.target)))setTimeout(() => this.emit('click'));
		});
		
		this.create();
	}
	create(){}
	remove(){
		this.content.remove();
	}
	walk(data){
		var state = this.panel.config,
			last_state,
			last_key;
		
		for(let key of data.split('.'))state = (last_state = state)[last_key = key] || {};
		
		return [ last_state, last_key ];
	}
	get value(){
		if(!this.data.walk || this.data.value && typeof this.data.value != 'object')return this.data.value;
		
		var walked = this.walk(this.data.walk);
		
		return walked[0][walked[1]];
	}
	set value(value){
		if(!this.data.walk)return this.emit('change', value);
		
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
};

class BooleanControl extends Control {
	static id = 'boolean';
	create(){
		this.input = utils.add_ele('ez-checkbox', this.content, {
			events: {
				change: () => this.value = this.input.checked,
			},
		});
	}
	interact(){
		this.value = !this.value;
	}
	update(init){
		if(init)this.input.checked = this.value;
	}
};

class SelectControl extends Control {
	static id = 'select';
	create(){
		this.select = utils.add_ele('ez-select', this.content, {
			events: {
				change: () => this.value = this.select.value,
			},
		});
		
		for(let value in this.data.value)utils.add_ele('ez-option', this.select, {
			textContent: this.data.value[value],
			value: value,
		});
	}
	update(init){
		if(init)this.select.value = this.value;
	}
};

class DropdownControl extends Control {
	static id = 'dropdown';
	create(){
		this.select = utils.add_ele('ez-select', this.content, {
			events: {
				change: () => {
					this.key = this.select.value;
					this.value = this.data.value[this.select.value];
				},
			},
		});
		
		for(let key in this.data.value)utils.add_ele('ez-option', this.select, {
			textContent: key,
			value: key,
		});
	}
	update(init){
		if(init)for(let [ key, value ] of Object.entries(this.data.value)){
			if(value == this.value){
				this.select.value = key;
				this.key = key;
			}
		}
	}
};

class LinkControl extends Control {
	static id = 'link';
	create(){
		this.link = utils.add_ele('a', this.content);
		this.link.append(this.label);
	}
	interact(){
		this.link.click();
	}
	update(){
		this.link.href = this.value;
	}
};

class FunctionControl extends Control {
	static id = 'function';
	create(){
		this.button = utils.add_ele('ez-button', this.content);
		this.button.append(this.label);
		this.button.addEventListener('click', () => this.data.value());
	}
};

class ManyFunctionsControl extends Control {
	static id = 'functions';
	create(){
		for(let label in this.value)utils.add_ele('ez-button', this.content, {
			textContent: label,
			events: {
				click: this.value[label],
			},
		});
	}
}

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
			event.preventDefault();
			this.value = event.code == 'Escape' ? null : event.code;
			this.input.blur();
		});
	}
	update(init){
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
		if(init)this.input.value = this.value;
		else this.input.render();
	}
};

class ColorControl extends Control {
	static id = 'color';
	create(){
		this.input = utils.add_ele('input', this.content, {
			type: 'color',
			events: {
				change: () => this.value = this.input.value,
			},
		});
	}
	update(init){
		super.update(init);
		
		if(init)this.input.value = this.value;
	}
};

Control.Types = [
	KeybindControl,
	SelectControl,
	DropdownControl,
	BooleanControl,
	FunctionControl,
	ManyFunctionsControl,
	LinkControl,
	TextBoxControl,
	SliderControl,
	ColorControl,
];

module.exports = Control;