'use strict';

class LinkvertiseBypass {
	constructor(){
		this.beacon = new Set();
		this.todo = this.ext_promise();
		this.continue = this.ext_promise();
	}
	ext_promise(){
		var res, rej,
			promise = new Promise((resolve, reject) => {
				res = resolve;
				rej = reject;
			});
		
		promise.resolve = res;
		promise.reject = rej;
		
		promise.resolve_in = (time = 0, data) => setTimeout(() => promise.resolve(data), time);
		
		return promise;
	}
	setup(){
		this.countdown();
		// this.observe();
		this.xmlhttp();
		this.hook();
	}
	countdown(){
		var interval = setInterval;
		
		eval('window').setInterval = (callback, delay) => interval(callback, delay == 1e3 ? 0 : delay);
	}
	on_set(obj, prop, callback){
		if(obj[prop])return callback(obj[prop]);
		
		Object.defineProperty(obj, prop, {
			set(value){
				Object.defineProperty(obj, prop, { value: value, writable: true });
				callback(value);
				return value;
			},
			configurable: true,
		});
	}
	xmlhttp(){
		// navigator.beacon should have been used for impressions
		XMLHttpRequest.prototype.open = new Proxy(XMLHttpRequest.prototype.open, {
			apply: (target, request, [ method, url, ...args ]) => {
				try{
					var url = new URL(url, location);
					
					if(url.hostname == 'publisher.linkvertise.com')this.beacon.add(new Promise(resolve => request.addEventListener('readystatechange', () => {
						if(request.readyState >= XMLHttpRequest.HEADERS_RECEIVED)resolve();
					})));
				}catch(err){}
				
				return Reflect.apply(target, request, [ method, url, ...args ]);
			}
		});
	}
	observe(){
		new MutationObserver(async mutations => {
			for(let mutation of mutations){
				for(let node of mutation.addedNodes){
					if(node.rel == 'icon')node.href = 'https://krunker.io/img/favicon.png';
					
					if(!node.classList)continue;
					
					let is_progress = node.tagName == 'A',
						is_access = is_progress && node.textContent.includes('Free'),
						is_continue = is_progress && node.textContent.includes('Continue'),
						is_todo = node.classList.contains('todo'),
						is_web = is_todo && node.classList.contains('web');
					
					if(is_todo || is_continue || is_access){
						if(is_access)console.log('will we access?', node), this.todo.resolve_in(200);
						else if(is_todo){
							await this.todo;
							this.continue.resolve_in(200);
						}else if(is_continue){
							await this.continue;
						}else if(is_web)setInterval(() => {
							for(var node of document.querySelectorAll('.modal .web-close-btn'))node.click();
						}, 100);
						
						node.click();
					}else if(node.textContent.includes('Free Access'))console.log(node);
				}
			}
		}).observe(document, { childList: true, subtree: true });
	}
	service(service){
		Object.defineProperty(service, 'vpn', {
			get: _ => false,
			set: _ => _,
			configurable: true,
		});

		this.on_set(service, 'webService', web => web.webCounter = 0);

		this.on_set(service, 'ogadsCountdown', () => {
			var oredir = service.redirect;
			
			service.redirect = () => Promise.all(this.beacon).then(() => {
				service.link.type = 'DYNAMIC';
				oredir.call(service);
			});
		});

		this.on_set(service, 'addonService', addon => {
			var installed = false;
			
			addon.alreadyInstalled = installed;
			addon.addonIsInstalled = () => installed;
			addon.handleAddon = () => {
				installed = true;
				addon.addonState = 'PENDING_USER';
				addon.checkAddon();
			};
		});

		this.on_set(service, 'adblockService', adblock => {
			Object.defineProperty(adblock, 'adblock', { get: _ => false, set: _ => _ });
		});

		this.on_set(service, 'videoService', video => {
			video.addPlayer = () => video.videoState = 'DONE';
		});

		this.on_set(service, 'notificationsService', notif => {
			var level = 'default';
			
			notif.getPermissionLevel = () => level;
			notif.ask = () => {
				level = 'granted';
				notif.linkvertiseService.postAction('notification');
			};
		});
	}
	hook(){
		var self = this;
		
		Object.defineProperty(Object.prototype, 'linkvertiseService', {
			set(value){
				Object.defineProperty(this, 'linkvertiseService', { value: value, configurable: true });
				
				self.service(this);
				
				return value;
			},
			configurable: true,
		});
	}
};

module.exports = LinkvertiseBypass;