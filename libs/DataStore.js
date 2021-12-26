'use strict';

var console = require('./console');

class DataStore {
	ls_prefix = 'ss';
	gm = typeof GM_getValue == 'function';
	get(key, expect){
		var data = this.get_raw(key);
		
		if(typeof data == 'string')try{
			return JSON.parse(data);
		}catch(err){
			console.error('DATASTORE ERROR', err, data);
			
			// might be earlier data
			return data;
		}
		
		switch(expect){
			case'object':
				
				return {};
				
				break;
			case'array':
				
				return [];
				
				break;
		}
	}
	set(key, value){
		if(value instanceof Set)value = [...value];
		
		return this.set_raw(key, JSON.stringify(value));
	}
	get_raw(key){
		return this.gm ? GM_getValue(key) : localStorage.getItem(this.ls_prefix + key);
	}
	set_raw(key, value){
		return this.gm ? GM.setValue(key, value) : localStorage.setItem(this.ls_prefix + key, value);
	}
};

module.exports = DataStore;