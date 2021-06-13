'use strict';

var doc_input_active = doc => doc.activeElement && ['TEXTAREA', 'INPUT'].includes(doc.activeElement.tagName),
	{ global_listen, keybinds, panels, utils, frame } = require('./consts.js'),
	update_pe = event => {
		for(let ind in panels){
			if(!panels[ind].visible)continue;
			
			let rect = panels[ind].node.getBoundingClientRect(),
				hover = event.clientX >= rect.x && event.clientY >= rect.y && (event.clientX - rect.x) <= rect.width && (event.clientY - rect.y) <= rect.height;
			
			if(hover)return frame.style['pointer-events'] = 'all';
		}
		
		frame.style['pointer-events'] = 'none';
	},
	resize_canvas = () => {
		exports.canvas.width = frame.contentWindow.innerWidth;
		exports.canvas.height = frame.contentWindow.innerHeight;
	},
	resolve_ready;

exports.ready = new Promise(resolve => frame.addEventListener('load', resolve));

exports.ready.then(() => {
	exports.canvas = utils.add_ele('canvas', frame.contentWindow.document.documentElement);
	
	exports.ctx = exports.canvas.getContext('2d', { alpha: true });
	
	resize_canvas();

	frame.contentWindow.document.head.remove();
	frame.contentWindow.document.body.remove();

	global_listen('mousemove', update_pe);
	global_listen('mousedown', update_pe);
	global_listen('mouseup', update_pe);
	
	global_listen('keydown', event => {
		if(event.repeat || doc_input_active(document) || doc_input_active(frame.contentWindow.document))return;
		
		// some(keycode => typeof keycode == 'string' && [ keycode, keycode.replace('Digit', 'Numpad') ]
		for(let keybind of keybinds)if(keybind.code.includes(event.code)){
			event.preventDefault();
			keybind.interact();
		}
	});
	
	frame.contentWindow.addEventListener('contextmenu', event => !(event.target != null && event.target instanceof frame.contentWindow.HTMLTextAreaElement) && event.preventDefault());
	
	window.addEventListener('resize', resize_canvas);
	
	utils.add_ele('style', frame.contentWindow.document.documentElement, { textContent: require('./ui.css') });
});

utils.wait_for(() => document.documentElement).then(() => document.documentElement.appendChild(frame));

var actions = require('./actions');

exports.alert = actions.alert;
exports.prompt = actions.prompt;
exports.options = actions.options;
exports.frame = frame;
exports.keybinds = keybinds;
exports.panels = panels;
exports.Loading = require('./loading');
exports.Config = require('./config/');
exports.Editor = require('./editor/');