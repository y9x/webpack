'use strict';

var { store } = require('../consts'),
	utils = require('../../Utils'),
	DragPanel = require('../Panel/Drag'),
	Tab = require('./Tab'),
	svg = require('./svg'),
	Write = require('../Write'),
	Actions = require('../Actions');

class Editor extends DragPanel {
	constructor(frame, data){
		super(frame, 'editor');
		
		this.frame.css('editor', require('./index.css'));
		
		this.actions = new Actions(this.frame);
		
		this.data = data;
		
		// user stylesheets
		this.sheet = utils.add_ele('style', () => document.documentElement);
		
		this.title = utils.add_ele('div', this.node, { textContent: this.data.title, className: 'bar' });
		
		this.scroll_by = 0;
		
		setInterval(() => {
			if(this.scroll_by)this.tab_con.scrollBy(25 * this.scroll_by, 0), this.update_overflow();
		}, 50);
		
		window.addEventListener('blur', () => this.scroll_by = 0);
		window.addEventListener('mouseup', () => this.scroll_by = 0);
		
		this.back = utils.add_ele('button', this.title, {
			className: 'scroll back',
			textContent: '<',
			events: {
				mousedown: () => this.scroll_by = -1,
			},
		});
		
		this.tab_con = utils.add_ele('div', this.title, { className: 'files' });
		
		this.forward = utils.add_ele('button', this.title, {
			className: 'scroll forward',
			textContent: '>',
			events: {
				mousedown: () => this.scroll_by = 1,
			},
		});
		
		this.controls = this.listen_dragging(utils.add_ele('div', this.title, { className: 'actions' }));
		
		utils.add_ele('button', this.controls, { className: 'new' }).addEventListener('click', async () => this.new_tab());
		
		this.saven = utils.add_ele('button', this.controls, {
			innerHTML: svg.save,
			className: 'save',
			events: {
				click: () => this.save_doc(),
			},
		});
		
		utils.add_ele('button', this.controls, {
			innerHTML: svg.web,
			className: 'web',
			events: {
				click: () => this.actions.prompt('Enter a CSS link', 'https://').then(async input => {
					try{
						var style = await(await fetch(new URL(input, location))).text(),
							name = input.split('/').slice(-1)[0],
							tab = new Tab({ id: Tab.ID(), name: name, active: true }, this);
						
						await tab.set_value(style);
						await tab.save();
						
						tab.focus();
						
						await this.load();
					}catch(err){
						if(err.message == "Failed to construct 'URL': Invalid URL")this.actions.alert('Invalid URL');
						else this.actions.alert('Loading failed: ' + err.message);
					}
				}).catch(() => {}),
			},
		});
		
		this.data.help = this.data.help.replace(/svg\.(\w+)/g, (match, prop) => svg[prop]);
		
		utils.add_ele('button', this.controls, {
			textContent: '?',
			events: {
				click: event => this.actions.alert(this.data.help),
			},
		});
		
		utils.add_ele('button', this.controls, {
			innerHTML: svg.close,
			className: 'hide',
			events: {
				click: event => this.hide(),
			},
		});
		
		this.tabs = new Set();
		
		this.editor = new Write(this.node);
		
		this.editor.on('ctrl+s', () => this.save_doc());
		this.editor.on('ctrl+r', () => this.load());
		
		this.editor.on('change', () => {
			this.saved = false;
			this.update();
		});
		
		this.footer = utils.add_ele('footer', this.node);
		this.footer_text = utils.add_ele('div', this.footer, {
			className: 'text',
		});
		
		var holder = utils.add_ele('div', this.footer, {
			className: 'file-opt',
			textContent: 'Name:',
		});
		
		this.filename = utils.add_ele('ez-input', holder, {
			spellcheck: false,
			events: {
				change: async () => {
					(await this.focused_tab()).rename(this.filename.value);
				},
				focus: async () => {
					var range = document.createRange();
					
					range.selectNodeContents(this.filename.main);
					
					var selection = window.getSelection();
					
					selection.removeAllRanges();
					
					selection.addRange(range);
				},
			},
		});
		
		var holder1 = utils.add_ele('div', this.footer, {
			className: 'file-opt',
			textContent: 'Active:',
		});
		
		this.fileactive = utils.add_ele('ez-checkbox', holder1, {
			events: {
				change: async () => (await this.focused_tab()).toggle_active(),
			},
		});
		
		this.update();
		
		this.load_config();
		
		this.pos = { x: this.center_side('width'), y: this.center_side('height') };
		this.apply_bounds();
		this.load_ui_data();
		
		this.hide();
	}
	update_overflow(){
		var overflow = this.tab_con.scrollWidth > this.tab_con.offsetWidth;
		
		if(overflow){
			this.title.classList.add('overflow');
			
			this.back.disabled = this.tab_con.scrollLeft == 0;
			this.forward.disabled = this.tab_con.scrollLeft + this.tab_con.offsetWidth == this.tab_con.scrollWidth;
		}else this.title.classList.remove('overflow');
	}
	async new_tab(){
		var tab = await new Tab({ id: Tab.ID(), name: 'New Style', active: true, value: '' }, this);
		
		await tab.save();
		
		tab.focus();
		
		return tab;
	}
	async focused_tab(){
		for(let tab of this.tabs)if(tab.focused)return tab;
		
		return (await this.new_tab()).focus();
	}
	async first_tab(){
		for(let tab of this.tabs)return tab;
		
		return await this.new_tab();
	}
	update(){
		this.saven.classList[this.saved ? 'add' : 'remove']('saved');
		
		this.footer_text.innerHTML = this.saved == null ? 'Editor loaded' : this.saved ? 'All changes saved' : `Unsaved changes, press ${svg.save}`;
		
		this.apply_bounds();
	}
	async save_doc(){
		for(let tab of this.tabs)if(tab.focused)await store.set_raw(tab.id, this.editor.getValue());
		
		this.saved = true;
		await this.update();
		await this.load();
	}
	async load(){
		this.update_overflow();
		this.sheet.textContent = '';
		for(let tab of this.tabs)if(tab.active)this.sheet.textContent += await tab.get_value();
	}
	async load_config(){
		for(let data of await store.get('css', 'array')){
			let tab = new Tab(data, this);
			
			if(tab.active)this.sheet.textContent += await tab.get_value();
		}
		
		(await this.first_tab()).focus();
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