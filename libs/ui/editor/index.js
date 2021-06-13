'use strict';

var { utils, store } = require('../consts'),
	PanelDraggable = require('../paneldraggable'),
	Tab = require('./tab'),
	svg = require('./svg'),
	Write = require('./write'),
	{ alert, prompt } = require('../actions');

class Editor extends PanelDraggable {
	constructor(data){
		super(data, 'editor');
		
		this.sheet = utils.add_ele('style', document.documentElement);
		
		this.title = utils.add_ele('div', this.node, { textContent: this.data.title, className: 'title' });
		
		this.actions = this.listen_dragging(utils.add_ele('div', this.title, { className: 'actions' }));
		
		this.actions.insertAdjacentHTML('beforeend', svg.add_file);
		this.actions.lastElementChild.addEventListener('click', async () => this.new_tab());
		
		this.actions.insertAdjacentHTML('beforeend', svg.web);
		this.actions.lastElementChild.addEventListener('click', () => prompt('Enter a CSS link', 'https://').then(async input => {
			var style = await(await fetch(new URL(input, location))).text(),
				name = input.split('/').slice(-1)[0],
				tab = new Tab({ id: Tab.ID(), name: name, active: true }, this);
			
			await tab.set_value(style);
			await tab.save();
			
			tab.focus();
		}).catch(err => (alert('Loading failed: ' + err), 1)));
		
		this.actions.insertAdjacentHTML('beforeend', svg.save);
		this.saven = this.actions.lastElementChild;
		
		this.saven.addEventListener('click', () => this.save_doc());
		
		/*this.actions.insertAdjacentHTML('beforeend', svg.reload);
		this.actions.lastElementChild.addEventListener('click', () => this.load());*/
		
		this.data.help = this.data.help.replace(/svg\.(\w+)/g, (match, prop) => svg[prop]);
		
		utils.add_ele('div', this.actions, { textContent: '?', className: 'help button' }).addEventListener('click', event => alert(this.data.help));
		
		utils.add_ele('div', this.actions, { className: 'hide button' }).addEventListener('click', event => this.hide());
		
		this.tab_con = utils.add_ele('div', this.title, { className: 'tabs' });
		
		this.tabs = new Set();
		
		this.editor = new Write(this.node);
		
		this.editor.on('ctrl+s', () => this.save_doc());
		this.editor.on('ctrl+r', () => this.load());
		
		this.editor.on('change', () => {
			this.saved = false;
			this.update();
		});
		
		this.footer = utils.add_ele('footer', this.node, { className: 'left' });
		
		this.update();
		
		this.load_config();
		
		this.pos = { x: this.center_side('width'), y: this.center_side('height') };
		this.apply_bounds();
		this.load_ui_data();
		
		this.hide();
	}
	async focus_first(){
		var first;
		
		for(let tab of this.tabs)return tab.focus();
		
		this.new_tab();
	}
	async new_tab(){
		var tab = await new Tab({ id: Tab.ID(), name: 'new.css', active: true, value: '' }, this);
		
		await tab.save();
		
		tab.focus()
	}
	update(){
		this.saven.classList[this.saved ? 'add' : 'remove']('saved');
		
		this.footer.innerHTML = this.saved == null ? 'Editor loaded' : this.saved ? 'All changes saved' : `Warning: unsaved changes, press the ${svg.save} icon`;
		
		this.apply_bounds();
	}
	async save_doc(){
		for(let tab of this.tabs)if(tab.focused)await store.set_raw(tab.id, this.editor.getValue());
		
		this.saved = true;
		await this.update();
		await this.load();
	}
	async load(){
		this.sheet.textContent = '';
		for(let tab of this.tabs)if(tab.active)this.sheet.textContent += await tab.get_value();
	}
	async load_config(){
		for(let data of await store.get('css', 'array')){
			let tab = new Tab(data, this);
			
			if(tab.active)this.sheet.textContent += await tab.get_value();
		}
		
		await this.focus_first();
	}
	async save_config(){
		await store.set('css', [...this.tabs].map(tab => ({
			id: tab.id,
			name: tab.name,
			active: tab.active,
		})));
	}
};

module.exports = Editor;