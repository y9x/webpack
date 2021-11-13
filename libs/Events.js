'use strict';

class Events {
	static original = Symbol();
	static events = new WeakMap();
	static resolve(event){
		if(!Events.events.has(this)){
			Events.events.set(this, new Map());
		}
		
		var events = Events.events.get(this),
			callbacks = events.get(event);
		
		if(!callbacks){
			callbacks = new Set();
			events.set(event, callbacks);
		}
		
		return callbacks;
	};
	on(event, callback){
		if(typeof callback != 'function')throw new TypeError('Callback is not a function.');
		
		Events.resolve.call(this, event).add(callback);
		
		return this;
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
		
		var list = Events.resolve.call(this, event);
		
		return list.delete(callback);
	}
	emit(event, ...data){
		var set = Events.resolve.call(this, event);
		
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