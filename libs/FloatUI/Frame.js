'use strict';

var utils = require('../Utils');

class Frame {
	container = utils.add_ele('div', () => document.documentElement, { style: {
		top: 0,
		left: 0,
		'z-index': 9999999999,
		border: 'none',
		position: 'absolute',
		background: '#0000',
		width: '100vw',
		height: '100vh',
		overflow: 'hidden',
	} });
	content = this.container.attachShadow({ mode: 'open' });
	constructor(){
		this.update = this.update.bind(this);
		window.addEventListener('mousemove', this.update);
		window.addEventListener('mousedown', this.update);
		window.addEventListener('mouseup', this.update);
	}
	panels = new Set();
	update(event){
		for(let panel of this.panels){
			if(!panel.visible)continue;
			
			let rect = panel.node.getBoundingClientRect(),
				hover = event.clientX >= rect.x && event.clientY >= rect.y && (event.clientX - rect.x) <= rect.width && (event.clientY - rect.y) <= rect.height;
			
			if(hover)return this.container.style['pointer-events'] = 'all';
		}
		
		this.container.style['pointer-events'] = 'none';
		
		if(event.type == 'mousedown')for(let panel of this.panels)panel.blur();
	}
	added_css = new Set();
	css(label, css){
		if(this.added_css.has(label))return false;
		
		this.added_css.add(label);
		utils.add_ele('style', this, { textContent: css });
		
		return true;
	}
	append(element){
		this.content.append(element);
	}
};

module.exports = Frame;