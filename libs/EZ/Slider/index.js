'use strict';

var utils = require('../../Utils');

class Slider extends HTMLElement {
	constructor(){
		super();
		
		this._value = 0;
		
		this.labels = {};
		
		var shadow = this.attachShadow({ mode: 'open' });
		
		this.wrapper = utils.add_ele('main', shadow);
		
		this.background = utils.add_ele('div', this.wrapper, { className: 'background' });
		this.thumb = utils.add_ele('div', this.wrapper, { className: 'thumb' });
		
		utils.add_ele('style', shadow, { textContent: require('./index.css') });
		
		this.movement = { held: false, x: 0, y: 0 };
		
		this.addEventListener('mousedown', event=> {
			this.movement = { held: true, x: event.layerX, y: event.layerY };
			this.update_slider(event);
		});
		
		window.addEventListener('mouseup', () => this.movement.held = false );
		
		window.addEventListener('mousemove', event => this.update_slider(event));
	}
	get min(){
		return this.getAttribute('min');
	}
	set min(value){
		return this.setAttribute('min', value), value;
	}
	get max(){
		return this.getAttribute('max');
	}
	set max(value){
		return this.setAttribute('max', value), value;
	}
	get step(){
		return this.getAttribute('step');
	}
	set step(value){
		return this.setAttribute('step', value), value;
	}
	get value(){
		return this._value;
	}
	set value(value){
		this._value = value;
		this.render();
		return value;
	}
	update_slider(event){
		if(!this.movement.held)return;
		
		var slider_box = this.getBoundingClientRect(),
			min_val = this.min,
			max_val = this.max,
			unit = this.step,
			perc = ((event.pageX - slider_box.x) / slider_box.width) * 100,
			value = Math.max((((max_val)*perc/100)), min_val);
		
		if(unit)value = utils.rtn(value, unit);
		
		value = +value.toFixed(2);
		
		if(event.clientX <= slider_box.x)value = perc = min_val;
		else if(event.clientX >= slider_box.x + slider_box.width)value = max_val, perc = 100;
		
		this.value = value;
		
		this.dispatchEvent(new Event('change'));
	}
	render(){
		var bg_perc = (this.value / this.max) * 100;
		
		this.background.style.width = bg_perc + '%';
		this.thumb.dataset.label = this.labels && this.labels[this.value] || this.value;
		
		var thumb_bounds = this.thumb.getBoundingClientRect(),
			slider_bounds = this.wrapper.getBoundingClientRect();
		
		this.thumb.style.left = Math.min(Math.max((slider_bounds.width * bg_perc / 100) - (thumb_bounds.width / 2), 0), slider_bounds.width) + 'px';
	}
	connectedCallback(){
		
	}
};

exports.Slider = Slider;