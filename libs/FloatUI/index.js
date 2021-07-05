'use strict';

var { utils, frame, content } = require('./consts.js'),
	Panel = require('./Panel'),
	update_pe = event => {
		for(let panel of Panel.panels){
			if(!panel.visible)continue;
			
			let rect = panel.node.getBoundingClientRect(),
				hover = event.clientX >= rect.x && event.clientY >= rect.y && (event.clientX - rect.x) <= rect.width && (event.clientY - rect.y) <= rect.height;
			
			if(hover)return content.style['pointer-events'] = 'all';
		}
		
		content.style['pointer-events'] = 'none';
		
		if(event.type == 'mousedown')for(let panel of Panel.panels)panel.blur();
	},
	resize_canvas = () => {
		exports.canvas.width = window.innerWidth;
		exports.canvas.height = window.innerHeight;
	};

window.addEventListener('mousemove', update_pe);
window.addEventListener('mousedown', update_pe);
window.addEventListener('mouseup', update_pe);

require('../Segoe');

exports.canvas = utils.add_ele('canvas', frame);

exports.ctx = exports.canvas.getContext('2d', { alpha: true });

resize_canvas();

window.addEventListener('contextmenu', event => !(event.target != null && event.target instanceof HTMLTextAreaElement) && event.preventDefault());

window.addEventListener('resize', resize_canvas);

var actions = require('./Actions');

exports.alert = actions.alert;
exports.prompt = actions.prompt;
exports.options = actions.options;
exports.Loading = require('./Loading/');
exports.Config = require('./Config/');
exports.Editor = require('./Editor/');