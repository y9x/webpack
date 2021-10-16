'use strict';

var { store } = require('../consts'),
	utils = require('../../Utils'),
	svg = require('./svg');

class Tab {
	static ID(){
		return Math.random().toString();
	}
	constructor(data, panel){
		this.panel = panel;
		
		this.panel.tabs.add(this);
		
		this.name = data.name;
		this.id = data.id;
		this.active = data.active;
		
		this.focused = false;
		
		this.node = utils.add_ele('div', panel.tab_con, { className: 'tab' });
		
		this.namen = utils.add_ele('div', this.node, { className: 'name' });
		
		utils.add_ele('raw', this.node, {
			html: svg.close,
			className: 'close button',
			events: {
				click: event => {
					event.stopImmediatePropagation();
					this.remove();
				},
			},
		});
		
		this.node.addEventListener('click', () => this.focus());
		
		this.update();
	}
	async save(){
		await this.panel.save_config();
		
		return this;
	}
	async get_value(){
		return await store.get_raw(this.id) || '';
	}
	async set_value(data = this.panel.editor.getValue()){
		await store.set_raw(this.id, data);
	}
	async rename(name){
		if(!name.replace(/\s/g, '').length)return;
		
		this.name = this.namen.textContent = name;
		
		await this.save();
		
		this.update();
	}
	update(){
		this.namen.textContent = this.name;
		this.panel.update_overflow();
		// this.activen.className = 'active ' + this.active;
	}
	async focus(){
		if(this.focused)return this;
		
		for(let tab of this.panel.tabs)tab.blur();
		this.focused = true;
		this.node.classList.add('active');
		this.panel.editor.setValue(await this.get_value());
		this.panel.filename.value = this.name;
		this.panel.fileactive.checked = this.active;
		this.panel.saved = true;
		this.panel.update();
		
		return this;
	}
	blur(){
		this.focused = false;
		this.node.classList.remove('active');
	}
	async remove(){
		this.node.remove();
		this.panel.tabs.delete(this);
		await store.set_raw(this.id, '');
		await this.save();
		await this.panel.load();
		(await this.panel.first_tab()).focus();
	}
	async toggle_active(){
		this.active = !this.active;
		
		await this.save();
		
		this.update();
		
		this.panel.load();
	}
};

module.exports = Tab;