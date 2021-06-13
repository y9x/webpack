'use strict';

var msgpack = require('msgpack-lite'),
	cheat = require('./cheat'),
	stores = new Map(),
	retrieve_store = socket => (!stores.has(socket) && stores.set(socket, {}), stores.get(socket));

class Socket extends WebSocket {
	constructor(url, proto){
		var store = retrieve_store(super(url, proto));
		
		this.addEventListener('message', event => {
			var [ label, ...data ] = msgpack.decode(new Uint8Array(event.data)), client;
			
			if(label == 'io-init')store.socket_id = data[0];
			else if(cheat.config.game.skins && label == 0 && store.skin_cache && (client = data[0].indexOf(store.socket_id)) != -1){
				// loadout
				data[0][client + 12] = store.skin_cache[2];
				
				// hat
				data[0][client + 13] = store.skin_cache[3];
				
				// body
				data[0][client + 14] = store.skin_cache[4];
				
				// knife
				data[0][client + 19] = store.skin_cache[9];
				
				// dye
				data[0][client + 24] = store.skin_cache[14];
				
				// waist
				data[0][client + 33] = store.skin_cache[17];
				
				// event.data is non-writable but configurable
				// concat message signature ( 2 bytes )
				var encoded = msgpack.encode([ label, ...data ]),
					final = new Uint8Array(encoded.byteLength + 2);
				
				final.set(encoded, 0);
				final.set(event.data.slice(-2), encoded.byteLength);
				
				Object.defineProperty(event, 'data', { value: final.buffer });
			}
		});
	}
	send(data){
		var [ label, ...sdata ] = msgpack.decode(data.slice(0, -2));
		
		if(label == 'en')retrieve_store(this).skin_cache = sdata[0];
		
		super.send(data);
	}
};

module.exports = Socket;