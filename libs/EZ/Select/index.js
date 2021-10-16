'use strict';

var utils = require('../../Utils');

class Select extends HTMLElement {
	constructor(){
		super();
		
		var shadow = this.attachShadow({ mode: 'open' });
		
		this.wrapper = utils.add_ele('main', shadow);
		
		this.label = utils.add_ele('text', this.wrapper);
		
		utils.add_ele('style', shadow, { textContent: require('./index.css') });
		
		utils.add_ele('raw', this.wrapper, {
			html: `<svg width="16px" height="16px" viewBox="0 0 12 7"><path d="M11.85.65c.2.2.2.5 0 .7L6.4 6.84a.55.55 0 01-.78 0L.14 1.35a.5.5 0 11.71-.7L6 5.8 11.15.65c.2-.2.5-.2.7 0z"></path></svg>`,
		});
		
		this.nslot = utils.add_ele('slot', this.wrapper);
		
		window.addEventListener('mousedown', event => {
			var path = event.composedPath();
			
			for(let node of path)if(node instanceof Option)return;
			
			if(path.includes(this.wrapper))this.toggle_dropdown();
			else this.hide_dropdown();
			
			this.set_pos();
		});
		
		window.addEventListener('resize', () => this.set_pos());
		window.addEventListener('blur', () => this.wrapper.classList.remove('active'));
	}
	toggle_dropdown(){
		this.wrapper.classList.toggle('active');
	}
	hide_dropdown(){
		this.wrapper.classList.remove('active');
	}
	changed(){
		this.hide_dropdown();
		this.dispatchEvent(new Event('change'));
	}
	set_pos(){
		this.wrapper.classList.remove('bottom');
		
		if(this.wrapper.classList.contains('active')){
			var bounds = this.nslot.getBoundingClientRect();
			
			if(bounds.bottom > window.innerHeight)this.wrapper.classList.add('bottom');
		}
	}
	get options(){
		return [...(this.querySelectorAll('ez-option') || [])];
	}
	get value(){
		for(let node of this.options)if(node.selected)return node.value;
	}
	set value(value){
		for(let node of this.options)if(node.value == value)node.selected = true;
		
		return value;
	}
};

class Option extends HTMLElement {
	constructor(){
		super();
		
		this.addEventListener('mousedown', () => {
			this.selected = true;
			this.parentNode.changed();
		});
	}
	get value(){
		return this.getAttribute('value');
	}
	set value(value){
		this.setAttribute('value', value);
		
		if(!this.textContent)this.textContent = this.getAttribute('value');
		
		return value;
	}
	get selected(){
		return this.hasAttribute('selected');
	}
	set selected(value){
		if(value){
			this.setAttribute('selected', '');
			for(let option of this.parentNode.options)if(option != this && option.selected)option.selected = false;
			this.parentNode.label.nodeValue = this.textContent;
		}else this.removeAttribute('selected');
	}
	connectedCallback(){
		this.selected = this.selected;
	}
}

exports.Select = Select;
exports.Option = Option;