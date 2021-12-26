'use strict';

// Implements the settings bar (search, presets, export, import, reset) found in the settings menu

var Addon = require('../Addon'),
	File = require('../../File'),
	utils = require('../../Utils'),
	console = require('../../console');

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
			events: {
				click: () => this.menu.load_preset('Default'),
			},
		});
		
		utils.add_ele('div', this.config, {
			className: 'settingsBtn',
			textContent: 'Export',
			events: {
				click: () => File.save({
					name: 'menu.json',
					data: JSON.stringify(this.menu.config),
				}),
			},
		});
		
		utils.add_ele('div', this.config, {
			className: 'settingsBtn',
			textContent: 'Import',
			events: {
				click: () => File.pick({
					accept: 'menu.json',
				}).then(async file => {
					var data = await file.read();
					
					try{
						await this.menu.insert_config(JSON.parse(data), true);
					}catch(err){
						console.error(err);
						alert('Invalid config');
					}
				}),
			},
		});
		
		this.preset = utils.add_ele('select', this.config, {
			id: 'settingsPreset',
			className: 'inputGrey2',
			style: {
				'margin-left': '0px',
				'font-size': '14px',
			},
			events: {
				change: () => {
					if(this.preset.value == 'Custom')return;
					
					this.menu.load_preset(this.preset.value);
				},
			},
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
			events: {
				input: () => {
					if(!this.search.value)return [...this.menu.window.tabs][0].show();
						
					for(let tab of this.menu.window.tabs){
						tab.hide();
						
						for(let category of tab.categories){
							category.hide();
							
							for(let control of category.controls){
								control.hide_content();
								
								if(control.name.toLowerCase().includes(this.search.value.toLowerCase())){
									control.show_content();
									tab.show_content();
									category.show();
								}
							}
						}
					}
				},
			},
		});
		
		this.menu.on('preset', label => utils.add_ele('option', this.preset, {
			value: label,
			textContent: label,
		}));
		
		this.menu.on('config', () => this.handle_config());
		
		this.menu.on('control', control => control.on('change', (value, init) => {
			if(!init)this.handle_config();
		}));
		
		this.menu.on('tab-shown', () => this.search.value = '');
		
		this.menu.window.header.prepend(this.config);
		this.menu.window.header.prepend(this.search);
		
		this.ready();
	}
	handle_config(){
		var string = JSON.stringify(this.menu.config);
		
		for(let [ preset, value ] of this.menu.presets)if(JSON.stringify(utils.assign_deep(utils.clone_obj(this.menu.presets.get('Default')), value)) == string)return this.preset.value = preset;
		
		this.preset.value = 'Custom';
	}
};

module.exports = SettingsAddon;