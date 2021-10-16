'use strict';

var Panel = require('../Panel'),
	utils = require('../../Utils');

class Actions {
	constructor(frame){
		this.frame = frame;
	}
	alert(desc){
		this.frame.css('panel', require('../Panel/index.css'));
		this.frame.css('action', require('./index.css'));
		
		var panel = new Panel(this.frame, 'prompt');
		
		utils.add_ele('div', panel.node, { innerHTML: desc, className: 'description' });
		
		var form = utils.add_ele('form', panel.node);
		
		utils.add_ele('button', form, { textContent: 'OK', className: 'submit single' });
		
		panel.show();
		
		panel.focus();
		
		return new Promise(resolve => form.addEventListener('submit', event => (event.preventDefault(), panel.remove(), resolve()), { once: true }));
	}
	prompt(desc, default_text = ''){
		this.frame.css('panel', require('../Panel/index.css'));
		this.frame.css('action', require('./index.css'));
		
		var panel = new Panel(this.frame, 'prompt');
		
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
	}
	options(title, options){
		var panel = new Panel(this.frame, {}, 'options'),
			title = utils.add_ele('div', panel.node, { textContent: title, className: 'title' });
		
		panel.focus();
		
		return new Promise(resolve => {
			options.forEach((option, index) => utils.add_ele('div', panel.node, { className: 'control', textContent: option[0] }).addEventListener('click', () => (panel.hide(), resolve(option[1]))));
		});
	}
}
module.exports = Actions;