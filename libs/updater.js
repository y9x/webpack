'use strict';

class Updater {
	constructor(script, extracted, show_logs = false){
		this.script = script;
		this.extracted = extracted;
		this.show_logs = show_logs;
		
		this.log('Initialized');
	}
	log(...args){
		if(this.show_logs)console.info('[UPDATER]', ...args);
	}
	warn(...args){
		if(this.show_logs)console.warn('[UPDATER]', ...args);
	}
	parse_headers(script){
		var out = {},
			close = '==/UserScript==',
			header = script.slice(0, script.indexOf(close));
		
		header.replace(/@(\S+)(?: +(.*))?$/gm, (match, label, value) => {
			out[label] = label in out ? [].concat(out[label], value) : value;
		});
		
		return out;
	}
	async update(){
		location.assign(this.script);
	}
	async check(){
		var script = await(await fetch(this.script)).text();
		
		this.log('Latest script fetched from', this.script);
		
		var parsed = this.parse_headers(script),
			latest = new Date(parsed.extracted).getTime();
		
		this.log(parsed);
		
		this.log('Parsed headers:', parsed, '\nCurrent script:', this.extracted, '\nLatest script:', latest);
		
		var will_update = this.extracted < latest;
		
		if(will_update)this.log('Script will update, current script is', latest - this.extracted, ' MS behind latest');
		else this.warn('Script will NOT update');
		
		// if updated, wait 3 minutes
		return will_update;
	}
	watch(callback, interval = 60e3 * 3){
		this.log('Polling at an interval of', interval, 'MS');
		
		var run = async () => {
			if(await this.check())callback();
			else setTimeout(run, interval);
		};
		
		run();
	}
}

module.exports = Updater;