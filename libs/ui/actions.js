'use strict';

var Panel = require('./panel'),
	{ utils, frame } = require('./consts');

utils.add_ele('style', frame, { textContent: require('./actions.css') });

exports.alert = desc => {
	var panel = new Panel('prompt');
	
	utils.add_ele('div', panel.node, { innerHTML: desc, className: 'description' });
	
	var form = utils.add_ele('form', panel.node);
	
	utils.add_ele('button', form, { textContent: 'OK', className: 'submit single' });
	
	panel.show();
	
	panel.focus();
	
	return new Promise(resolve => form.addEventListener('submit', event => (event.preventDefault(), panel.remove(), resolve()), { once: true }));
};

exports.prompt = (desc, default_text = '') => {
	var panel = new Panel('prompt');
	
	utils.add_ele('div', panel.node, { textContent: desc, className: 'description' });
	
	var form = utils.add_ele('form', panel.node),
		input = utils.add_ele('input', form, {
			className: 'input',
			value: default_text,
		});
	
	utils.add_ele('button', form, { textContent: 'OK', className: 'submit' });
	
	var cancel = utils.add_ele('button', form, { textContent: 'Cancel', className: 'cancel' });
	
	panel.show();
	
	panel.focus();
	
	input.focus();
	input.select();
	
	return new Promise((resolve, reject) => form.addEventListener('submit', event => {
		event.preventDefault();
		
		(event.submitter == cancel ? reject : resolve)(input.value);
		
		panel.remove();
	}));
};

exports.options = (title, options) => {
	var panel = new Panel({}, 'options'),
		title = utils.add_ele('div', panel.node, { textContent: title, className: 'title' });
	
	panel.focus();
	
	return new Promise(resolve => {
		options.forEach((option, index) => utils.add_ele('div', panel.node, { className: 'control', textContent: option[0] }).addEventListener('click', () => (panel.hide(), resolve(option[1]))));
	});
};