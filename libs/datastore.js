'use strict';

var GM = {
	get_value: typeof GM_getValue == 'function' && GM_getValue,
	set_value: typeof GM_setValue == 'function' && GM_setValue,
};

class DataStore {
	ls_prefix = 'ss';
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
		return GM.get_value ? GM.get_value(key) : localStorage.getItem(this.ls_prefix + key);
	}
	set_raw(key, value){
		return GM.set_value ? GM.set_value(key, value) : localStorage.setItem(this.ls_prefix + key, value);
	}
};

module.exports = DataStore;