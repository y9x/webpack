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
			console.log(file, await file.read());
			// this.menu.reset_config();
		}));
		
		this.preset = utils.add_ele('div', this.config, {
			id: 'settingsPreset',
			className: 'inputGrey2',
			style: {
				'margin-left': '0px',
				'font-size': '14px',
			},
		});
		
		// TODO: ADD PRESETS
		
		this.preset.addEventListener('change', () => {
			// this.preset.value
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
	handle_header(header){
		header.prepend(this.config);
		header.prepend(this.search);
	}
};

module.exports = SettingsAddon;