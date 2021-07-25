'use striict';

var Control = require('./Control');

class Controls {
	constructor(){
		var list = this.list = [];
		
		this.id = 'a-' + Math.random().toString().slice(2);
		
		customElements.define(this.id, class extends HTMLElement {
			connectedCallback(){
				this.replaceWith(list[this.id].content);
			}
		});
	}
	html(){
		var html = '';
		
		for(let control in this.list)html += `<${this.id} id="${control}"></${this.id}>`;
		
		return html;
	}
	control(name, data){
		for(let type of Control.Types)if(type.id == data.type){
			let control = new type(name, data);
			
			this.list.push(control);
			
			return control;
		}
		
		throw new TypeError('Unknown type: ' + data.type);
	}
};

module.exports = Controls;