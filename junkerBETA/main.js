 'use strict';

var CRC2d = CanvasRenderingContext2D.prototype,
	{ api, meta, utils } = require('../libs/consts'),
	vars = require('../libs/vars'),
	Input = require('../libs/input'),
	Player = require('../libs/player'),
	Visual = require('./visual');

vars.load(require('./vars'));

class Main {
	constructor(){
		this.hooked = Symbol();
		
		this.utils = utils;
		
		this.eventHandlers();
		
		this.menu = require('./settings.js');
		
		this.skins = [...Array(5000)].map((e, i) => ({ ind: i, cnt: 1 }));
	}
	add(entity){
		return entity[this.hooked] || (entity[this.hooked] = new Player(this, entity));
	}
	async load(){
		utils.add_ele('style', document.documentElement, { textContent: require('./index.css') });
		
		var self = this;
		
		this.input = new Input(this);
		
		this.visual = new Visual(this);
		
		this.y_offset_types = ['head', 'torso', 'legs'];
		
		this.y_offset_rand = 'head';
		
		setInterval(() => this.y_offset_rand = this.y_offset_types[~~(Math.random() * this.y_offset_types.length)], 2000);
		
		var token_promise = api.token(),
			config_promise = this.menu.load_config(),
			game_arg = {
				game: game => {
					this.game = utils.game = game;
					Object.defineProperty(game, 'controls', {
						configurable: true,
						set: controls => {
							// delete definition
							delete game.controls;
							
							var timer = 0;
							
							Object.defineProperty(controls, 'idleTimer', {
								get: _ => this.config.game.inactivity ? 0 : timer,
								set: value => timer = value,
							});
							
							return this.controls = utils.controls = game.controls = controls;
						},
					});
				},
				three(three){
					utils.three = three;
					
					self.mesh = new Proxy({}, {
						get(target, prop){
							if(!target[prop]) {
								target[prop] = new three.MeshBasicMaterial({
									transparent: true,
									fog: false,
									depthTest: false,
									color: prop,
								});
							}
							return target[prop] ;
						},
					});
				},
				set socket(socket){
					self.socket = socket;
					
					socket.send = new Proxy(socket.send, {
						apply(target, that, [type, ...msg]){
							if (type=="ah2") return;
							if (type=="en") {
								let data = msg[0];
								if (data) {
									main.skinData = Object.assign({}, {
										main: data[2][0],
										secondary: data[2][1],
										hat: data[3],
										body: data[4],
										knife: data[9],
										dye: data[14],
										waist: data[17],
									});
								}
							}

							return target.apply(that, [type, ...msg]);
						}
					})

					socket._dispatchEvent = new Proxy(socket._dispatchEvent, {
						apply(target, that, [type, ...msg]){
							if (type =="init") {
								let pInfo = msg[0];
								if(pInfo[10] && pInfo[10].bill && main.settings && main.settings.customBillboard.val.length > 1) {
									pInfo[10].bill.txt = main.settings.customBillboard.val;
								}
							}

							if (type=="0") {
								let pData = msg[0][0];
								let pSize = 39;
								while (pData.length % pSize !== 0) pSize++;
								for(let i = 0; i < pData.length; i += pSize) {
									if (pData[i] === socket.socketId||0) {
										pData[i + 12] = [main.skinData.main, main.skinData.secondary];
										pData[i + 13] = main.skinData.hat;
										pData[i + 14] = main.skinData.body;
										pData[i + 19] = main.skinData.knife;
										pData[i + 24] = main.skinData.dye;
										pData[i + 33] = main.skinData.waist;
									}
								}
							}
							
							return target.apply(that, [type, ...msg]);
						}
					});
				},
				world: world => utils.world = this.world = world,
				can_see: inview => this.config.esp.status == 'full' ? false : (this.config.esp.nametags || inview),
				skins: ent => this.config.game.skins && typeof ent == 'object' && ent != null && ent.stats ? this.skins : ent.skins,
				timer: (object, property, timer) => Object.defineProperty(object, property, {
					get: _ => this.config.game.inactivity ? 0 : timer,
					set: value => this.config.game.inactivity ? Infinity : timer,
				}),
				input: this.input.push.bind(this.input),
				render(orig, overlay){
					self.overlay = overlay;
					
					self.visual.canvas = utils.canvas = document.querySelector('#game-overlay');
					
					self.visual.ctx = self.ctx = utils.canvas.getContext('2d');
					
					orig = orig.bind(overlay);
					
					overlay.render = function(...args){
						orig(...args);
						self.overlayRender(...args);
					};
				}
			};
		
		await config_promise;
		
		new Function('WP_fetchMMToken', vars.key, vars.patch(await api.source()))(token_promise, game_arg);
	}
	get config(){
		return this.menu.config;
	}
	overlayRender(scale){
		let width = utils.canvas.width / scale;
		let height = utils.canvas.height / scale;
		
		this.scale = scale;
		
		// this.ctx.scale(scale, scale);
		// this.ctx.clearRect(0, 0, width, height);
		this.visual.tick();
		
		if(this.config.aim.fov_box)this.visual.fov(this.config.aim.fov);
	
		if(this.game && this.world)for(let ent of this.game.players.list){
			let player = this.add(ent);
			
			if(player.is_you)this.player = player;
			
			if(!player.active)continue;
			
			player.tick();
			
			if(!player.frustum || player.is_you)continue;
			
			if(this.config.esp.tracers)this.visual.tracer(player);
			
			if(['box', 'box_chams', 'full'].includes(this.config.esp.status))this.visual.box(player);
			
			if(this.config.esp.status == 'full'){
				this.visual.health(player);
				this.visual.text(player);
			}
			
			this.visual.cham(player);
		}
		
		if(this.config.auto_nuke && this.player && this.player.streaks.length == 25)this.socket.send("k", 0);
		
		if(this.config.game.auto_start && window.endUI.style.display == "none" && window.windowHolder.style.display == 'none')controls.toggle(true);
	}
	dist2d(p1, p2){
		return utils.dist_center(p1.rect) - utils.dist_center(p2.rect);
	}
	pick_target(){
		return this.game.players.list.map(ent => this.add(ent)).filter(player => player.can_target).sort((p1, p2) => this.dist2d(p1, p2) * (p1.frustum ? 1 : 0.5))[0]
	}
	eventHandlers(){
		api.on_instruct = () => {
			if(this.config.game.auto_lobby){
				if(['Kicked', 'Banned', 'Disconnected', 'Error', 'Game is full'].some(text => target && target.innerHTML.includes(text))){
					location = document.location.origin;
				}
			}
		};
	}
};

var main = module.exports = new Main();

main.load();

window.main = main;