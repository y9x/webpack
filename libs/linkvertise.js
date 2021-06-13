'use strict';

// utils.wait_for
var Utils = require('./utils'),
	utils = new Utils();

class LinkvertiseBypass {
	constructor(){
		this.debug_redirect = false;
		this.console = false;
		
		this.beacon = new Set();
		
		this.log = this.console ? console.log : () => {};
		this.log_time = this.console ? console.time : () => {};
		this.log_time_end = this.console ? console.timeEnd : () => {};
		
		this.pick_tasks();
		
		if(this.debug_redirect)this.log_time('Redirect');
	}
	pick_tasks(){
		var tasks = [ 'web', /*'video',*/ 'addon', 'notifications' ].map(task => 'require_' + task),
			amount = this.random(2, tasks.length);
		
		this.meta = {
			require_countdown: false,
			require_captcha: false,
			require_og_ads: false,
			shouldPromoteOpera: true,
		};
		
		for(let task of tasks)this.meta[task] = false;
		
		var will_do = [];
		
		while((amount -= 1) != -1){
			while(true){
				let task = this.random(tasks);
				
				if(this.meta[task])continue;
				
				this.meta[task] = true;
				
				will_do.push(task);
				
				break;
			}
		}
		
		this.log('Will do', will_do.length, 'tasks:', will_do);
	}
	random(min, max){
		if(Array.isArray(min))return min[~~(Math.random() * min.length)];
		
		if(isNaN(max))return Math.random() * (min + 1);
		
		return ~~(Math.random() * ((max + 1) - min)) + min;
	}
	setup(discord){
		this.hook();
		this.setup_beacon();
		this.observe();
		this.page_cover(discord);
	}
	page_cover(discord){
		var UI = require('./ui');
		
		UI.ready.then(() => new UI.Loading(discord));
		
		document.documentElement.style.overflow = 'hidden';
		
		var set_title = document.title;
		
		document.title = 'Krunker';
		
		Object.defineProperty(document, 'title', {
			get: _ => set_title,
			set: _ => set_title = _,
			configurable: true,
			enumerable: true,
		});
	}
	is_done(){
		return false;
	}
	hook(){
		var self = this;
		
		Object.defineProperty(Object.prototype, 'ogadsCountdown', {
			set(value){
				Object.defineProperty(this, 'ogadsCountdown', { value: value, configurable: true });
				
				self.main(this);
				self.linkvertise(this.linkvertiseService);
				self.web(this.webService);
				self.addon(this.addonService);
				self.adblock(this.adblockService);
				self.video(this.videoService);
				self.notifications(this.notificationsService);
				
				return value;
			},
			configurable: true,
		});
	}
	observe(){
		new MutationObserver(async mutations => {
			for(let mutation of mutations){
				for(let node of mutation.addedNodes){
					if(node.rel == 'icon')node.href = 'https://krunker.io/img/favicon.png';
					
					if(!node.classList)continue;
					
					let is_progress = node.tagName == 'A',
						is_access = is_progress && node.textContent.includes('Free Access'),
						is_continue = is_progress && !node.classList.contains('d-none') && node.textContent.includes('Continue'),
						is_todo = node.classList.contains('todo');
					
					if(is_todo || is_continue || is_access){
						if(is_continue)await utils.wait_for(() => this.is_done());
						node.click();
					}
				}
			}
		}).observe(document, { childList: true, subtree: true });
	}
	setup_beacon(){
		// navigator.beacon should have been used for impressions
		XMLHttpRequest.prototype.open = new Proxy(XMLHttpRequest.prototype.open, {
			apply: (target, request, [ method, url, ...args ]) => {
				if((url + '').startsWith('https://publisher.linkvertise.com/'))this.beacon.add(new Promise(resolve => request.addEventListener('readystatechange', () => {
					if(request.readyState >= XMLHttpRequest.HEADERS_RECEIVED)resolve();
				})));
				
				return Reflect.apply(target, request, [ method, url, ...args ]);
			}
		});
	}
	main(service){
		this.is_done = service.isDone.bind(service);
		
		var meta;
		
		Object.defineProperty(service, 'meta', {
			get: _ => meta,
			set: value => meta = Object.assign(value, this.meta),
		});
		
		var oredir = service.redirect;

		service.redirect = () => {
			service.link.type = 'DYNAMIC';
			
			Promise.all(this.beacon).then(() => {
				if(this.debug_redirect)this.log_time_end('Redirect');
				else oredir.call(service)
			});
		};
	}
	notifications(service){
		var notif_level = 'default';

		service.getPermissionLevel = () => notif_level;

		service.ask = () => {
			notif_level = 'granted';
			service.linkvertiseService.postAction('notification');
		};
	}
	adblock(service){
		Object.defineProperty(service, 'adblock', {
			get: _ => false,
			set: _ => _,
		});
	}
	video(service){
		service.addPlayer = () => {
			if(service.videoState != 'PENDING')return;
			service.videoState = 'DONE';
		}
	}
	addon(service){
		var addon_installed = false;

		service.alreadyInstalled = addon_installed;
		service.addonIsInstalled = () => addon_installed;
		service.handleAddon = () => {
			if(service.addonState != 'PENDING')return;
			addon_installed = true;
			service.addonState = 'PENDING_USER';
			service.checkAddon();
		};
	}
	linkvertise(service){
		Object.defineProperty(service, 'vpn', {
			get: _ => false,
			set: _ => _,
			configurable: true,
		});
	}
	web(service){
		var ohandl = service.handleWeb.bind(service);
		
		service.handleWeb =  () => {
			if(service.webState != 'PENDING')return;
			ohandl();
			service.pauseCountdown = false;
			service.webCounter = 0;
			service.handleWebClose();
		};
	}
};

module.exports = LinkvertiseBypass;