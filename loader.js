'use strict';

var TMHeaders = require('./libs/tmheaders'),
	DataStore = require('./libs/datastore');

class Updater {
	constructor(url, logs = false){
		this.url = url;
		this.logs = logs;
		this.store = new DataStore();
	}
	log(...text){
		if(this.logs)console.log('[UPDATER]', ...text);
	}
	warn(...text){
		if(this.logs)console.warn('[UPDATER]', ...text);
	}
	async check_latest(script){
		var text = await(await fetch(this.url, { cache: 'no-store' })).text(),
			current = new Date(new TMHeaders().parse(script).get('extracted')).getTime(),
			fetched = new Date(new TMHeaders().parse(text).get('extracted')).getTime(),
			will_update = current < fetched;
		
		if(will_update){
			this.log('Script will update, current script is', fetched - current, ' MS behind latest');
			
			this.store.set(this.url, text);
			
			this.log('Update complete, a refresh is required');
		}else this.warn('Script will NOT update', fetched, current);
	}
	request(){
		this.log('Requesting latest script...');
		
		var req = new XMLHttpRequest();
		
		req.open('GET', this.url, false);
		
		req.send();
		
		var script = req.responseText;
		
		this.store.set(this.url, script);
		
		return script;
	}
	load(){
		this.log('Loading...');
		
		var script = this.store.get(this.url);
		
		if(script){
			this.log('Script cache loaded');
			this.check_latest(script);
		}else script = this.request();
		
		new Function('GM_getValue', 'GM_setValue', script)(
			typeof GM_getValue == 'function' && GM_getValue, 
			typeof GM_setValue == 'function' && GM_setValue, 
		);
	}
};

new Updater(SCRIPT_URL, true).load();