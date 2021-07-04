'use strict';

class TMHeaders {
	constructor(data){
		this.load(data);
	}
	get(key){
		return this.data[key];
	}
	set(key, value){
		return this.data[key] = value, this;
	}
	delete(key){
		return delete this.data[key];
	}
	load(data = {}){
		return this.data = Object.setPrototypeOf(data, null), this;
	}
	parse(script){
		var out = {},
			close = '==/UserScript==',
			header = script.slice(0, script.indexOf(close));
		
		header.replace(/@(\S+)(?: +(.*))?$/gm, (match, label, value) => {
			out[label] = label in out ? [].concat(out[label], value) : value;
		});
		
		this.data = out;
		
		return this;
	}
	toString(){
		var whitespace = 0;
		
		for(let key in this.data)if(key.length > whitespace)whitespace = key.length;
		
		var headers = '// ==UserScript==\n';
		
		for(let key in this.data)for(let value of [].concat(this.data[key]))headers += '// @' + (value ? key.padEnd(whitespace + 4, ' ') + value : key) + '\n';
		
		headers += '// ==/UserScript==';
		
		return headers;
	}
	toJSON(){
		return this.data;
	}
};

module.exports = TMHeaders;