'use strict';

var Request = require('../libs/Request'),
	ExtendMenu = require('../libs/ExtendMenu'),
	Keybind = require('../libs/Keybind'),
	utils = require('../libs/Utils'),
	meta = require('./meta');

class Loader extends ExtendMenu {
	type = 'Userscript';
	lock = true;
	version = meta.version;
	key = 'krl';
	save_config(){
		localStorage[this.key] = JSON.stringify(this.config);
	}
	async load_config(){
		this.config = utils.assign_deep({
			script: {
				url: false,
				name: '',
				version: 0,
			},
			gui: {
				show: true,
			},
		}, JSON.parse(localStorage[this.key] || '{}'));
		
		try{
			this.legacy();
		}catch(err){
			console.error(err);
		}
		
		this.save_config();
	}
	og_names = {
		doge: 'Dogeware',
		skid: 'SkidFest',
		shit: 'Sploit',
		sploit: 'Sploit',
		junk: 'Junker',
	};
	legacy(){
		var script_info = localStorage.scriptinfo,
			name,
			og = localStorage.userScripts;
		
		if(og){
			delete localStorage.userScripts;
			name = this.og_names[og];
		}
		
		if(script_info){
			delete localStorage.scriptinfo;
			
			var sc = JSON.parse(script_info || '{}');
			
			name = sc.name;
			
			if(sc && sc.data && sc.data.url){
				this.config.script.url = sc.data.url;
				this.config.script.name = sc.name;
			}
		}
	}
	constructor(url){
		super();
		this.url = url;
		this.badge = '[LOADER ' + this.version + ']';
		this.log = console.log.bind(console, this.badge);
		this.warn = console.warn.bind(console, this.badge);
		this.active = null;
	}
	async main(){
		var serve = await Request({
			target: this.url,
			result: 'json',
			cache: 'query',
			sync: true,
		});
		
		// if(meta.version != serve.loader.version){
		if(meta.version < serve.loader.version){
			this.warn('The loader is outdated!');
			
			if(navigator.userAgent.includes('Electron')){
				alert(`A new version of the Krunker Cheat Loader is available. Open GG Client's forum post and download the new loader. Replace this script with the new latest version.`);
				window.open('https://forum.sys32.dev/d/3-gg-client');
			}else return this.redirect(Request.resolve({
				target: serve.loader.url,
				query: { v: serve.loader.version },
			}));
		}
		
		this.load_config();
		
		try{
			this.menu(serve);
		}catch(err){
			this.warn(err);
		}
		
		if(this.config.script.url)try{
			this.load_script(serve);
		}catch(err){
			this.warn(err);
		}else this.log('No script selected');
	}
	async load_script(serve){
		var cache_invalidated = false,
			serving = serve.scripts[this.config.script.name];
		
		if(!serving || !this.config.script.name)return this.log('Invalid script selected, returning...');
		
		var code;
		
		if(serving.version != this.config.script.version){
			this.warn('Script data changed, cache invalidated.');
			cache_invalidated = true;
		}else if(!(code = sessionStorage.getItem(this.config.script.url))){
			this.warn('No script in sessionStorage, cache invalidated.');
			cache_invalidated = true;
		}else this.log('Loading cache...');
		
		this.config.script.version = serving.version;
		this.save_config();
		
		if(cache_invalidated){
			this.log('Requesting new script...');
			
			sessionStorage[this.config.script.url] = code = await Request({
				target: this.config.script.url,
				query: {
					v: this.config.script.version,
				},
				sync: true,
				result: 'text',
			});
		}
		
		new Function('LOADER', code)(this);
	}
	menu(serve){
		var Main = this.category();
		
		// todo: make {key:value}, leverage json value
		// not just string value
		// dropdown = new
		// select = legacy
		
		var scriptl = {
			None: false,
		};
		
		// just have the value
		// { version, url }
		// ?
		for(let [ name, { url } ] of Object.entries(serve.scripts))scriptl[name] = url;
		
		this.dropdown = Main.control('Script', {
			type: 'dropdown',
			walk: 'script.url',
			value: scriptl,
		}).on('change', (value, init) => {
			if(init)return;
			
			this.config.script.name = this.dropdown.key;
			
			this.save_config();
			location.reload();
		});
		
		Main.control('Show tab [F10 to enable]', {
			type: 'boolean',
			walk: 'gui.show',
		}).on('change', (value, init) => !init && location.reload());
		
		for(let category of this.categories)category.update(true);
		
		if(this.config.gui.show)this.insert('Cheats');
		else new Keybind('F10', () => {
			this.config.gui.show = true;
			this.save_config();
			location.reload();
		});
	}
	async redirect(url){
		await utils.wait_for(() => document.readyState == 'complete');
		location.assign(url);
	}
	get script(){
		if(!this.active)return null;
		
		if(!this.serve.scripts[this.active])throw new Error(`'${this.active}' is invalid`);
		
		return this.serve.scripts[this.active];
	}
};

var loader = new Loader(SCRIPTS_URL);
loader.main();