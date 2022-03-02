'use strict';

var msgpack = require('msgpack-lite'),
	console = require('./console');

module.exports = inter => {
	var socket_id, skin_cache;
	
	var proxy_regions = {
		sgp: 'sin',
		'au-syd': 'syd',
		'de-fra': 'fra',
		'jb-hnd': 'tok',
		'us-ca-sv': 'sv',
		'us-fl': 'mia',
		'us-nj': 'ny',
	};
	
	class HWebSocket extends WebSocket {
		constructor(url, proto){
			if(inter.proxy)url = 'wss://' + (proxy_regions[localStorage.kro_setngss_defaultRegion] || 'mia') + '.browserfps.com/ws?redirect=' + btoa(url);
			
			super(url, proto);
			
			this.addEventListener('message', event => {
				var [ label, ...data ] = msgpack.decode(new Uint8Array(event.data)),
					client;
				
				// console.log('Incoming <=', [ label, ...data ]);
				
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
		set onmessage(callback){
			this.addEventListener('message', event => {
				try{
					return callback.call(this, event);
				}catch(err){
					console.error('Socket error:', err);
				}
			});
			
			return callback;
		}
		send(binary){
			var [ label, ...data ] = msgpack.decode(binary.slice(0, -2));
			
			if(label == 'en')skin_cache = data[0];
			
			// console.log('Outgoing =>', [ label, ...data ]);
			
			super.send(binary);
		}
	};
	
	return HWebSocket;
};