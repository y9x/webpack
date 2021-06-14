'use strict';

var { utils } = require('../consts'),
	Tab = require('./tab');

class Window {
	constructor(menu){
		this.menu = menu;
		
		this.content = utils.crt_ele('div', {
			style: {
				position: 'absolute',
				width: '100%',
				height: '100%',
				left: 0,
				top: 0,
				'z-index': 1e9,
			},
		});
		
		this.node = this.content.attachShadow({ mode: 'closed' });
		
		this.style = utils.add_ele('style', this.node);
		
		this.appended = new WeakSet();
		
		this.update_style();
		
		setInterval(() => this.update_style(), 100);
		
		this.holder = utils.add_ele('div', this.node, {
			id: 'windowHolder',
			className: 'popupWin',
			style: {
				'pointer-events': 'all',
			},
		});
		
		this.container = utils.add_ele('div', this.holder, {
			id: 'menuWindow',
			className: 'stickyHeader dark',
			style: {
				'overflow-y': 'auto',
				width: '1200px',
				'max-height': 'calc(100% - 250px)',
				top: '50%',
				transform: 'translate(-50%, -50%)',
			},
		});
		
		this.header = utils.add_ele('div', this.container, { className: 'settingsHeader' });
		
		this.holder.addEventListener('click', event => {
			if(event.target == this.holder)this.hide();
		});
		
		this.tabs = new Set();
		
		this.tab_layout = utils.add_ele('div', this.header, { id: 'settingsTabLayout' });
		
		this.hide();
	}
	add_tab(label){
		var tab = new Tab(this, label);
		
		this.tabs.add(tab);
		
		return tab;
	}
	update_style(){
		for(let node of document.querySelectorAll('link, style'))if(!this.appended.has(node)){
			this.appended.add(node);
			this.node.append(node.cloneNode(true));
		}
	}
	attach(ui_base){
		ui_base.appendChild(this.content);
	}
	show(){
		this.content.style.display = 'block';
	}
	hide(){
		this.content.style.display = 'none';
	}
	get tab(){
		var first;
		
		for(let tab of this.tabs){
			first = first || tab;
			if(tab.visible)return tab;
		}
		
		return first;
	}
	update(init){
		for(let tab of this.tabs){
			tab.update(init);
			if(tab != this.tab)tab.hide();
		}
		
		this.tab.show();
	}
};

module.exports = Window;