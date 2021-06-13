'use strict';

var { utils, store, frame } = require('../consts'),
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
		
		this.node.insertAdjacentHTML('beforeend', svg.rename);
		
		this.node.lastElementChild.addEventListener('click', event => {
			event.stopImmediatePropagation();
			this.rename_input.textContent = this.name;
			this.node.classList.add('rename');
			this.rename_input.focus();
		});
		
		this.activen = utils.add_ele('div', this.node, { className: 'active' });
		
		this.activen.addEventListener('click', async () => {
			this.active = !this.active;
			
			await this.save();
			
			this.update();
			
			this.panel.load();
		});
		
		this.node.insertAdjacentHTML('beforeend', svg.close);
		
		this.node.lastElementChild.addEventListener('click', event => {
			event.stopImmediatePropagation();
			this.remove();
		});
		
		this.rename_input = utils.add_ele('span', this.node, { className: 'rename-input' });
		
		this.rename_input.setAttribute('contenteditable', '');
		
		this.rename_input.addEventListener('focus', () => {
			console.log('focus');
			
			var range = document.createRange();
			
			range.selectNodeContents(this.rename_input);
			
			var selection = frame.contentWindow.getSelection();
			
			selection.removeAllRanges();
			
			selection.addRange(range);
		});
		
		this.rename_input.addEventListener('keydown', event => {
			if(event.code == 'Enter')event.preventDefault(), this.rename_input.blur();
		});
		
		this.rename_input.addEventListener('blur', () => {
			this.node.classList.remove('rename');
			this.rename(this.rename_input.textContent);
			this.rename_input.textContent = '';
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
		this.activen.className = 'active ' + this.active;
	}
	async focus(){
		if(this.focused)return;
		
		for(let tab of this.panel.tabs)tab.blur();
		this.focused = true;
		this.node.classList.add('active');
		this.panel.editor.setValue(await this.get_value());
		this.panel.saved = true;
		this.panel.update();
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
		await this.panel.focus_first();
	}
};

module.exports = Tab;