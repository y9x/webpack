'use strict';

// Implements the settings bar (search, presets, export, import, reset) found in the settings menu


var Addon = require('./addon'),
	File = require('../../file'),
	{ utils, consts } = require('../consts');

class SettingsAddon extends Addon {
	async create(input){
		this.name = 'Krunker Settings';
		
		
		this.config = utils.crt_ele('div', { style: {
			'text-align': 'right',
			display: 'inline-block',
			float: 'right',
		} });
		
		utils.add_ele('div', this.config, {
			className: 'settingsBtn',
			textContent: 'Reset',
		}).addEventListener('click', () => this.menu.reset_config());
		
		utils.add_ele('div', this.config, {
			className: 'settingsBtn',
			textContent: 'Export',
		}).addEventListener('click', () => File.save({
			name: 'junker.json',
			data: JSON.stringify(this.menu.config),
		}));
		
		utils.add_ele('div', this.config, {
			className: 'settingsBtn',
			textContent: 'Import',
		}).addEventListener('click', () => File.pick({
			accept: 'junker.json',
		}).then(async file => {
			var data = await file.read();
			
			try{
				await this.menu.insert_config(JSON.parse(data), true);
			}catch(err){
				console.error(err);
				alert('Invalid config');
			}
		}));
		
		this.preset = utils.add_ele('select', this.config, {
			id: 'settingsPreset',
			className: 'inputGrey2',
			style: {
				'margin-left': '0px',
				'font-size': '14px',
			},
		});
		
		this.preset.addEventListener('change', () => {
			if(this.preset.value == 'Custom')return;
			
			this.menu.load_preset(this.preset.value);
		});
		
		utils.add_ele('option', this.preset, {
			value: 'Custom',
			textContent: 'Custom',
		});
		
		this.search = utils.crt_ele('input', {
			id: 'settSearch',
			type: 'text',
			placeholder: 'Search',
			style: {
				display: 'inline-block',
				width: '220px',
			},
		});
		
		this.ready();
	}
	handle_preset(label){
		utils.add_ele('option', this.preset, {
			value: label,
			textContent: label,
		});
	}
	handle_config(config){
		var string = JSON.stringify(config);
		
		for(let preset in this.menu.presets)if(JSON.stringify(this.menu.presets[preset]) == string)return this.preset.value = preset;
		
		this.preset.value = 'Custom';
	}
	handle_header(header){
		header.prepend(this.config);
		header.prepend(this.search);
	}
	handle_control(control){
		control.on('change', (value, init) => {
			if(!init)this.handle_config(this.menu.config);
		});
	}
};

module.exports = SettingsAddon;