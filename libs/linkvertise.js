'use strict';

// utils.wait_for
var Utils = require('./utils'),
	utils = new Utils();

class LinkvertiseBypass {
	constructor(){
		this.debug_redirect = true;
		
		this.beacon = new Set();
		
		this.debug = console.debug;
		this.start = performance.now();
		
		this.force_all_tasks = true;
		
		this.pick_tasks();
		
		this.debug('Will do', this.will_do.length, 'tasks:', this.will_do);
	}
	debug_list(title, obj){
		var props = [];
		
		for(let prop in obj){
			let sub_str = `${prop}:\n`;
			
			let lines = [];
			
			for(let item of [].concat(obj[prop]))lines.push('\t' + item);
			
			sub_str += lines.join('\n');
			
			props.push(sub_str);
		}
		
		this.debug(`${title}\n\n${props.join('\n\n')}`);
	}
	pick_tasks(){
		// video gives no impressions 6/14/2021
		var tasks = [ 'web', /*'video',*/ 'addon', 'notifications' ],
			amount = this.random(2, tasks.length);
		
		this.meta = {
			require_countdown: false,
			require_captcha: false,
			require_og_ads: false,
			shouldPromoteOpera: true,
		};
		
		this.will_do = [];
		
		if(this.force_all_tasks){
			for(let task of tasks)this.will_do.push(task), this.meta['require_' + task] = true;
			
			return;
		}
		
		for(let task of tasks)this.meta['require_' + task] = false;
		
		while((amount -= 1) != -1)while(true){
			let task = this.random(tasks),
				id = 'require_' + task;
			
			if(this.meta[id])continue;
			
			this.meta[id] = true;
			
			will_do.push(task);
			
			break;
		}
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
				self.adblock(this.adblockService);
				self.web(this.webService);
				self.addon(this.addonService);
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
				try{
					let furl = new URL(url, location);
					
					if(furl.host == 'publisher.linkvertise.com'){
						let promise = new Promise(resolve => request.addEventListener('readystatechange', () => {
							if(request.readyState >= XMLHttpRequest.HEADERS_RECEIVED)resolve();
						}));
						
						promise.url = furl.pathname;
						
						this.beacon.add(promise);
					}
				}catch(err){
					console.error(err);
				}
				
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
				if(this.debug_redirect)this.debug_list(`Redirect called.`, {
					Tasks: this.will_do.map(task => '\t' + task),
					URLs: [...this.beacon].map(promise => promise.url).map(url => '\t' + url),
					'Total time': performance.now() - this.start + ' MS',
				});
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
		};
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