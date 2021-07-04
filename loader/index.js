'use strict';

var TMHeaders = require('../libs/tmheaders'),
	request = require('../libs/request'),
	meta = require('./meta'),
	Utils = require('../libs/utils'),
	utils = new Utils();

class SelectControl {
	constructor(controls, name, data){
		this.name = name;
		this.data = data;
		this.controls = controls;
		
		this.content = utils.crt_ele('div', { className: 'setBodH' });
		
		this.sub = utils.add_ele('div', this.content, { className: 'settName' });
		
		this.label = utils.add_ele('text', this.sub, { nodeValue: this.name });
		
		this.select = utils.add_ele('select', this.sub, {
			className: 'inputGrey2',
			events: { change: () => this.change() },
		});
		
		for(let key in this.data.value)utils.add_ele('option', this.select, {
			value: key,
			textContent: key,
		});
		
		this.init = true;
		this.value = this.data.value;
		this.init = false;
		
		this.controls.list.push(this);
	}
	get value(){
		return this.data.value[this.select.value];
	}
	set value(value){
		for(let prop in this.data.value)if(this.data.value[prop] == value)this.select.value = prop;
		this.select.value = value;
		this.change();
		return value;
	}
	change(){
		if(typeof this.data.change == 'function')this.data.change(this.init, this.value, value => this.select.value = value);
	}
};

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
}

class Loader {
	version = meta.version;
	og_loaders = {
		doge: 'DogeWare',
		skid: 'SkidFest',
		shit: 'Sploit',
		sploit: 'Sploit',
		junk: 'Junker',
	};
	constructor(url, logs = false){
		this.url = url;
		this.logs = logs;
		this.active = null;
		
		this.controls = new Controls();
		
		utils.wait_for(() => typeof windows == 'object' && windows).then(arr => {
			var settings = arr[0],
				index = settings.tabs.length,
				get = settings.getSettings;
			
			settings.tabs.push({ name: 'Cheats', categories: [] });
			
			settings.getSettings = () => settings.tabIndex == index ? this.controls.html() : get.call(settings);
		});
	}
	log(...text){
		if(this.logs)console.log('[LOADER]', ...text);
	}
	warn(...text){
		if(this.logs)console.warn('[LOADER]', ...text);
	}
	get script(){
		if(!this.active)return tnull;
		
		if(!this.serve.scripts[this.active])throw new Error(`'${this.active}' is invalid`);
		
		return this.serve.scripts[this.active];
	}
	save(){
		localStorage.setItem('scriptinfo', !this.active ? '' : JSON.stringify({
			name: this.active,
			data: this.script,
		}));
		
		return this;
	}
	pick(name){
		this.active = name;
		this.save();
		location.assign('/');
	}
	// all requests sync but awaited for compatibility
	async load(){
		this.log('Loading...');
		
		this.serve = await request({
			target: this.url,
			result: 'json',
			cache: 'query',
			sync: true,
		});
		
		if(meta.version != this.serve.loader.version){
			this.warn('The loader is outdated!');
			
			return location.assign(this.serve.loader.url + '?' + this.serve.loader.version);
		}
		
		var { name, data } = JSON.parse(localStorage.getItem('scriptinfo') || '[]'),
			og = localStorage.getItem('userScripts');
		
		if(og && !name)name = this.og_loaders[og];
		
		this.active = name;
		
		
		var vals = {
			None: null,
		};
		
		for(let name in this.serve.scripts)vals[name] = name;
		
		var select = new SelectControl(this.controls, 'Script', {
			value: vals,
			change: (init, value, set_val) => {
				if(init)set_val(this.active || 'None');
				else this.pick(value);
			},
		});
		
		
		if(!this.active)return this.log('No script active, skipping loading...');
		
		var cache_invalidated = false,
			code = null;
		
		try{
			this.script;
		}catch(err){
			// the selected script is invalid
			return this.log('Invalid script selected, returning...');
		}
		
		if(JSON.stringify(data) != JSON.stringify(this.script)){
			this.warn('Script data changed, cache invalidated.');
			cache_invalidated = true;
		}else if(!(code = sessionStorage.getItem(this.script.url))){
			this.warn('No script in sessionStorage, cache invalidated.');
			cache_invalidated = true;
		}else this.log('Loading cache...');
			
		if(cache_invalidated){
			this.save();
			
			this.log('Requesting new script...');
			
			sessionStorage.setItem(this.script.url, code = await request({
				target: this.script.url + '?' + this.serve.loader.version,
				sync: true,
				result: 'text',
			}));
		}
		
		new Function('LOADER', code)(this)
	}
};

var loader = new Loader(SCRIPTS_URL, true);

loader.load();