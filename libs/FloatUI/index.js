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
	};

window.addEventListener('mousemove', update_pe);
window.addEventListener('mousedown', update_pe);
window.addEventListener('mouseup', update_pe);

require('../Segoe');

var actions = require('./Actions');

exports.frame = frame;
exports.alert = actions.alert;
exports.prompt = actions.prompt;
exports.options = actions.options;
exports.Loading = require('./Loading/');
exports.Config = require('./Config/');
exports.Editor = require('./Editor/');