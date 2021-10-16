'use strict';

class Events {
	static original = Symbol();
	#events = new Map();
	#resolve(event){
		var callbacks = this.#events.get(event);
		
		if(!callbacks){
			callbacks = new Set();
			this.#events.set(event, callbacks);
		}
		
		return callbacks;
	};
	on(event, callback){
		if(typeof callback != 'function')throw new TypeError('Callback is not a function.');
		
		this.#resolve(event).add(callback);
	}
	once(event, callback){
		var cb = function(...data){
			this.off(event, callback);
			callback.call(this, ...data);
		};
		
		callback[Events.original] = cb;
		
		return this.on(event, cb);
	}
	off(event, callback){
		if(typeof callback != 'function')throw new TypeError('Callback is not a function.');
		
		if(callback[Events.original])callback = callback[Events.original];
		
		var list = this.#resolve(event);
		
		return list.delete(callback);
	}
	emit(event, ...data){
		var set = this.#resolve(event);
		
		if(!set.size){
			if(event == 'error')throw data[0];
			return false;
		}else for(let item of set)try{
			item.call(this, ...data);
		}catch(err){
			this.emit('error', err);
		}
		
		return true;
	}
};

module.exports = Events;