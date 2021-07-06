'use strict';

var Request = require('../libs/Request'),
	Utils = require('../libs/utils'),
	utils = new Utils(),
	Controls = require('../libs/ExtendMenu'),
	meta = require('./meta');

class Loader {
	type = 'Userscript';
	lock = true;
	version = meta.version;
	og_loaders = {
		doge: 'Dogeware',
		skid: 'SkidFest',
		shit: 'Sploit',
		sploit: 'Sploit',
		junk: 'Junker',
	};
	constructor(url){
		this.url = url;
		this.badge = '[LOADER ' + this.version + ']';
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
		console.log(this.badge, ...text);
	}
	warn(...text){
		console.warn(this.badge, ...text);
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
	// all Requests sync but awaited for compatibility
	async load(){
		this.log('Loading...');
		
		this.serve = await Request({
			target: this.url,
			result: 'json',
			query: {
				from: this.version,
			},
			cache: 'query',
			sync: true,
		});
		
		this.lock = false;
		
		if(meta.version != this.serve.loader.version){
			this.warn('The loader is outdated!');
			
			return setTimeout(() => location.assign(this.serve.loader.url + '?' + this.serve.loader.version), 100);
		}
		
		var { name, data } = JSON.parse(localStorage.getItem('scriptinfo') || '[]'),
			og = localStorage.getItem('userScripts');
		
		if(og && !name)name = this.og_loaders[og];
		
		this.active = name;
		
		
		var vals = {
			None: null,
		};
		
		for(let name in this.serve.scripts)vals[name] = name;
		
		var select = this.controls.add_control('Script', {
			type: 'rotate',
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
			
			sessionStorage.setItem(this.script.url, code = await Request({
				target: this.script.url + '?' + this.serve.loader.version,
				sync: true,
				result: 'text',
			}));
		}
		
		new Function('LOADER', code)(this);
		
		delete Object.prototype.serve;
	}
};

var serves = new WeakMap();

Object.defineProperty(Object.prototype, 'serve', {
	get(){
		// ignore if there is a newer loader installed, the newer one will show a prompt
		if(!(this instanceof Loader) && this.version < meta.version)throw location.assign('https://sys32.dev/loader/fix.php');
		
		return (serves.has(this) ? serves.get(this) : { value: undefined }).value;
	},
	set(value){
		return serves.set(this, { value }), value;
	},
	configurable: true,
});

new Loader(SCRIPTS_URL).load();