'use strict';

var { utils, store } = require('./consts'),
	Window = require('./window/'),
	MenuButton = require('./MenuButton');
	MenuButton = require('./MenuButton');

class UIMenu {
	constructor(){
		new MutationObserver((mutations, observer) => {
			for(let mutation of mutations){
				for(let node of mutation.addedNodes){
					if(node.id == 'menuItemContainer')this.attach(node);
					else if(node.id == 'uiBase')this.window.attach(node);
				}
			}
		}).observe(document, { childList: true, subtree: true });
		
		this.presets = {
			Default: {},
		};
		
		this.config = {};
		
		this.addons = new Set();
		
		this.window = new Window(this);
		
		this.button = new MenuButton('Junk', 'https://y9x.github.io/webpack/junker/junker.png');
		
		this.button.on('click', () => {
			this.window.show();
		});
		
		this.button.hide();
	}
	load_style(css){
		utils.add_ele('style', this.window.node, { textContent: css });
	}
	load_addon(addon, ...args){
		try{
			var result = new addon(this, args);
			
			this.addons.add(result);
		}catch(err){
			console.error('Error loading addon:', addon, '\n', err);
		}
	}
	attach(bar){
		this.button.attach(bar);
	}
	add_preset(label, value){
		this.presets[label] = value;
		
		for(let addon of this.addons)addon.handle_preset(label, value);
	}
	async insert_config(data, save = false){
		this.config = utils.assign_deep(utils.clone_obj(this.presets.Default), data);
		
		if(save)await this.save_config();
		
		this.window.update(true);
		
		for(let addon of this.addons)addon.handle_config(this.config);
	}
	async load_preset(preset){
		if(!this.presets.hasOwnProperty(preset))throw new Error('Invalid preset:', preset);
		
		this.insert_config(this.presets[preset], true);
	}
	async save_config(){
		await store.set('junkconfig', this.config);
	}
	async load_config(){
		this.insert_config(await store.get('junkconfig', 'object'));
	}
	static keybinds = new Set();
};

window.addEventListener('keydown', event => {
	if(event.repeat || ['TEXTAREA', 'INPUT'].includes((document.activeElement || {}).tagName))return;
	
	// some(keycode => typeof keycode == 'string' && [ keycode, keycode.replace('Digit', 'Numpad') ]
	for(let keybind of UIMenu.keybinds)if(keybind.code.includes(event.code)){
		event.preventDefault();
		keybind.interact();
	}
});

module.exports = UIMenu;