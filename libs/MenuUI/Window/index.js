'use strict';

var Tab = require('./Tab'),
	utils = require('../../Utils'),
	console = require('../../console');

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
		
		this.styles = new Set();
		
		new MutationObserver((mutations, observer) => {
			for(let mutation of mutations)for(let node of mutation.addedNodes)if(['LINK', 'STYLE'].includes(node.tagName))this.update_styles();
		}).observe(document, { childList: true, subtree: true });
		
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
	update_styles(){
		for(let style of this.styles)style.remove(), this.styles.delete(style);
		
		for(let sheet of document.styleSheets){
			let style = utils.add_ele('style', this.node);
			
			this.styles.add(style);
			
			if(sheet.href)style.textContent += '@import url(' + JSON.stringify(sheet.href) + ');\n';
			else try{
				for(let rule of sheet.cssRules)style.textContent += rule.cssText + '\n';
			}catch(err){
				console.error(err);
			}
		}
	}
	tab(label){
		var tab = new Tab(this, label);
		
		this.tabs.add(tab);
		
		return tab;
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
	get main_tab(){
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
			if(tab != this.main_tab)tab.hide();
		}
		
		this.main_tab.show();
	}
};

module.exports = Window;