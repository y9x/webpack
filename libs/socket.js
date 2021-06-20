'use strict';

var msgpack = require('msgpack-lite'),
	data = Symbol();

module.exports = inter => {
	var socket_id, skin_cache;
	
	class HWebSocket extends WebSocket {
		constructor(url, proto){
			super(url, proto);
			
			this.addEventListener('message', event => {
				var [ label, ...data ] = msgpack.decode(new Uint8Array(event.data)),
					client;
				
				if(label == 'io-init')socket_id = data[0];
				else if(inter.unlock_skins && label == 0 && skin_cache && socket_id && (client = data[0].indexOf(socket_id)) != -1){
					// loadout
					data[0][client + 12] = skin_cache[2];
					
					// hat
					data[0][client + 13] = skin_cache[3];
					
					// body
					data[0][client + 14] = skin_cache[4];
					
					// knife
					data[0][client + 19] = skin_cache[9];
					
					// dye
					data[0][client + 24] = skin_cache[14];
					
					// waist
					data[0][client + 33] = skin_cache[17];
					
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
			
			if(label == 'en')skin_cache = sdata[0];
			
			super.send(data);
		}
	};
	
	return HWebSocket;
};