'use strict';

var { store } = require('./consts'),
	Window = require('./Window/'),
	MenuButton = require('./MenuButton'),
	utils = require('../Utils'),
	DataStore = require('../DataStore'),
	Events  = require('../Events'),
	console = require('../console');

class MenuUI extends Events {
	constructor(label, icon, key, store = new DataStore()){
		super();
		
		this.store = store;
		
		this.config_key = key;
		
		// utils.wait_for(() => document.querySelector('#menuItemContainer')).then(node => this.button.attach(node));
		// utils.wait_for(() => document.querySelector('#uiBase')).then(node => this.window.attach(node));
		
		new MutationObserver((mutations, observer) => {
			for(let mutation of mutations)for(let node of mutation.addedNodes){
				if(node.id == 'menuItemContainer')this.button.attach(node);
				else if(node.id == 'uiBase')this.window.attach(node);
			}
		}).observe(document, { childList: true, subtree: true });
		
		this.presets = new Map();
		
		this.presets.set('Default', {});
		
		this.config = {};
		
		this.addons = new Set();
		
		this.window = new Window(this);
		
		this.button = new MenuButton(label, icon);
		
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
	add_preset(label, value){
		this.presets.set(label, value);
		this.emit('preset', label, value);
	}
	async insert_config(data, save = false){
		this.config = utils.assign_deep(utils.clone_obj(this.presets.get('Default')), data);
		
		if(save)await this.save_config();
		
		this.window.update(true);
		
		this.emit('config');
	}
	async load_preset(preset){
		if(!this.presets.has(preset))throw new Error('Invalid preset:', preset);
		
		this.insert_config(this.presets.get(preset), true);
	}
	async save_config(){
		await this.store.set(this.config_key, this.config);
	}
	async load_config(){
		this.insert_config(await this.store.get(this.config_key, 'object'));
	}
};

module.exports = MenuUI;