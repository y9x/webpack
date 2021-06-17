'use strict';

var { utils, tick } = require('./consts'),
	EventLite  = require('event-lite');

class Control {
	constructor(data, category){
		this.data = data;
		this.name = this.data.name;
		this.category = category;
		this.menu = this.category.tab.window.menu;
		
		this.content = utils.add_ele('div', this.category.content, { className: 'settName' });
		this.label = utils.add_ele('text', this.content);
		
		this.create();
		
		this.menu.emit('control', this);
	}
	label_text(text){
		this.label.nodeValue = text;
	}
	remove(){
		this.container.remove();
	}
	walk(data){
		var state = this.menu.config,
			last_state,
			last_key;
		
		data.split('.').forEach(key => state = ((last_state = state)[last_key = key] || {}));
		
		return [ last_state, last_key ];
	}
	get value(){
		if(this.data.hasOwnProperty('value'))return this.data.value;
		
		var walked = this.walk(this.data.walk);
		
		return walked[0][walked[1]];
	}
	set value(value){
		var walked = this.walk(this.data.walk);
		
		walked[0][walked[1]] = value;
		
		this.menu.save_config();
		
		this.emit('change', value);
		
		return value;
	}
	create(){}
	interact(){
		console.warn('No defined interaction for', this);
	}
	update(init){
		if(init)this.emit('change', this.value, true);
		this.label_text(this.name);
	}
	show_content(){
		this.content.style.display = 'block';
	}
	hide_content(){
		this.content.style.display = 'none';
	}
};

EventLite.mixin(Control.prototype);

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
	create(){
		this.switch = utils.add_ele('label', this.content, {
			className: 'switch',
			textContent: 'Run',
			style: {
				'margin-left': '10px',
			},
		});
		
		this.checkbox = utils.add_ele('input', this.switch, { type: 'checkbox' });
		
		this.checkbox.addEventListener('change', () => this.value = this.checkbox.checked);
		
		utils.add_ele('span', this.switch, { className: 'slider' });
	}
	update(init){
		super.update(init);
		if(init)this.checkbox.checked = this.value;
	}
}

class RotateControl extends Control {
	static id = 'rotate';
	create(){
		this.select = utils.add_ele('select', this.content, { className: 'inputGrey2' });
		
		this.select.addEventListener('change', () => this.value = this.select.value);
		
		for(let [ value, label ] of this.data.vals)utils.add_ele('option', this.select, {
			value: value,
			textContent: label,
		});
	}
	update(init){
		super.update(init);
		
		if(init)this.select.value = this.value;
	}
};

class LinkControl extends Control {
	static id = 'link';
	interact(){
		window.open(this.value, '_blank');
	}
};

class FunctionControl extends Control {
	static id = 'function';
	create(){
		utils.add_ele('div', this.content, {
			className: 'settingsBtn',
			textContent: 'Run',
		}).addEventListener('click', () => this.interact());
	}
	interact(){
		this.value();
	}
};

class KeybindControl extends Control {
	static id = 'keybind';
	create(){
		this.input = utils.add_ele('input', this.content, {
			className: 'inputGrey2',
			placeholder: 'Press a key',
			style: {
				display: 'inline-block',
				width: '220px',
			},
		});
		
		this.input.addEventListener('focus', () => {
			this.input.value = '';
		});
		
		this.input.addEventListener('keydown', event => {
			event.preventDefault();
			this.value = event.code == 'Escape' ? null : event.code;
			this.input.blur();
		});

		this.input.addEventListener('blur', () => {
			this.category.update();
			this.update();
		});
	}
	update(init){
		super.update(init);
		
		this.input.value = utils.string_key(this.value);
	}
};

class TextBoxControl extends Control {
	static id = 'textbox';
	create(){
		this.input = utils.add_ele('input', this.content, {
			className: 'inputGrey2',
			placeholder: this.data.placeholder || '',
			style: {
				display: 'inline-block',
				width: '220px',
			},
		});
		
		this.input.addEventListener('change', () => this.value = this.input.value);
	}
	update(init){
		super.update(init);
		
		if(init)this.input.value = this.value;
	}
};

class SliderControl extends Control {
	static id = 'slider';
	create(){
		this.input = utils.add_ele('input', this.content, {
			className: 'sliderVal',
			type: 'number',
			min: this.data.range[0],
			max: this.data.range[1],
		});
		
		this.slider = utils.add_ele('input', utils.add_ele('div', this.content, {
			className: 'slidecontainer',
			style: {
				'margin-top': '-8px',
			},
		}), {
			className: 'sliderM',
			type: 'range',
			min: this.data.range[0],
			max: this.data.range[1],
			step: this.data.range[2],
		});
		
		this.input.addEventListener('focus', () => (this.input_focused = true, this.interact()));
		this.input.addEventListener('blur', () => (this.input_focused = false, this.interact()));
		
		this.slider.addEventListener('input', () => this.interact(this.value = this.slider.value));
		this.input.addEventListener('input', () => this.interact(this.value = +this.input.value));
	}
	interact(){
		var label = !this.input_focused && this.data.labels && this.data.labels[this.value] || this.value;
		
		this.input.type = typeof label == 'string' ? 'text' : 'number';
		
		this.input.value = label;
		
		this.slider.value = this.value;
	}
	update(init){
		super.update(init);
		
		this.interact();
	}
};

class ColorControl extends Control {
	static id = 'color';
	create(){
		this.input = utils.add_ele('input', this.content, {
			name: 'color',
			type: 'color',
			style: {
				float: 'right',
			},
		});
		
		this.input.addEventListener('change', () => this.value = this.input.value);
	}
	update(init){
		super.update(init);
		
		if(init)this.input.value = this.value;
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
	ColorControl,
];

module.exports = Control;