'use strict';

var { utils, frame, content } = require('./consts.js'),
	Panel = require('./panel'),
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

utils.add_ele('style', () => document.documentElement, {
	textContent: `
@font-face {
	font-family: 'SegoeUI';
	src: local('Segoe UI'), url('https://sys32.dev//assets/segoe-ui400.woff2') format('woff2');
	font-weight: 400;
}

@font-face {
	font-family: 'SegoeUI';
	src: local('Segoe UI'), url('https://sys32.dev//assets/segoe-ui100.woff2') format('woff2');
	font-weight: 100;
}

@font-face {
	font-family: 'SegoeUI';
	src: local('Segoe UI'), url('https://sys32.dev//assets/segoe-ui200.woff2') format('woff2');
	font-weight: 200;
}

@font-face {
	font-family: 'SegoeUI';
	src: local('Segoe UI'), url('https://sys32.dev//assets/segoe-ui600.woff2') format('woff2');
	font-weight: 600;
}

@font-face {
	font-family: 'SegoeUI';
	src: local('Segoe UI'), url('https://sys32.dev//assets/segoe-ui700.woff2') format('woff2');
	font-weight: 700;
}`,
});

window.addEventListener('mousemove', update_pe);
window.addEventListener('mousedown', update_pe);
window.addEventListener('mouseup', update_pe);

exports.canvas = utils.add_ele('canvas', frame);

exports.ctx = exports.canvas.getContext('2d', { alpha: true });

resize_canvas();

window.addEventListener('contextmenu', event => !(event.target != null && event.target instanceof HTMLTextAreaElement) && event.preventDefault());

window.addEventListener('resize', resize_canvas);

utils.add_ele('style', frame, { textContent: require('./ui.css') });

var actions = require('./actions');

exports.alert = actions.alert;
exports.prompt = actions.prompt;
exports.options = actions.options;
exports.frame = frame;
exports.Loading = require('./loading');
exports.Config = require('./config/');
exports.Editor = require('./editor/');