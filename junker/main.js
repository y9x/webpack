 'use strict';

var { api, meta, utils } = require('../libs/consts'),
	vars = require('../libs/vars'),
	Input = require('../libs/input'),
	Player = require('../libs/player'),
	Visual = require('./visual'),
	Socket = require('../libs/socket');

vars.load(require('./vars'));

class Main {
	constructor(){
		this.hooked = Symbol();
		
		this.skins = [...Array(5000)].map((e, i) => ({ ind: i, cnt: 1 }));
		
		this.menu = require('./settings.js');
		
		var self = this;
		
		this.interface = {
			get game(){
				return self.game;
			},
			get controls(){
				return self.controls;
			},
			get player(){
				return self.player;
			},
			get target(){
				return self.target;
			},
			get players(){
				return self.players;
			},
			get esp(){
				return self.config.esp.status;
			},
			get wireframe(){
				return self.config.player.wireframe;
			},
			get walls(){
				return self.config.esp.walls;
			},
			get bhop(){
				return self.config.player.bhop;
			},
			get aim(){
				return self.config.aim.status;
			},
			get aim_smooth(){
				return self.config.aim.smooth;
			},
			get hitchance(){
				return self.config.aim.hitchance;
			},
			get auto_reload(){
				return self.config.aim.auto_reload;
			},
			get unlock_skins(){
				return self.config.player.skins;
			},
			pick_target(){
				self.target = self.players.filter(player => player.can_target).sort((p1, p2) => self.dist2d(p1, p2) * (p1.frustum ? 1 : 0.5))[0];
			},
		};
		
		api.on_instruct = () => {	
			if(this.config.game.auto_lobby && api.has_instruct('connection error', 'game is full', 'kicked by vote', 'disconnected'))location.href = '/';
			else if(this.config.game.auto_start && api.has_instruct('to play') && (!this.player || !this.player.active)){
				this.controls.locklessChange(true);
				this.controls.locklessChange(false);
			}
		};
	}
	get players(){
		return this.game.players.list.map(ent => this.add(ent));
	}
	add(entity){
		return entity[this.hooked] || (entity[this.hooked] = new Player(this, entity));
	}
	async load(){
		utils.add_ele('style', () => document.documentElement, { textContent: require('./index.css') });
		
		window.main = this;
		
		var self = this,
			socket = Socket(this.interface),
			input = new Input(this.interface);
		
		this.visual = new Visual(this.interface);
		
		var token_promise = api.token(),
			args = {
				[vars.key]: {
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
					},
					world: world => utils.world = this.world = world,
					can_see: inview => this.config.esp.status == 'full' ? false : (this.config.esp.nametags || inview),
					skins: ent => this.config.player.skins && typeof ent == 'object' && ent != null && ent.stats ? this.skins : ent.skins,
					timer: (object, property, timer) => Object.defineProperty(object, property, {
						get: _ => this.config.game.inactivity ? 0 : timer,
						set: value => this.config.game.inactivity ? Infinity : timer,
					}),
					input: input.push.bind(input),
					render(orig, overlay){
						self.overlay = overlay;
						
						self.visual.canvas = utils.canvas = document.querySelector('#game-overlay');
						
						self.visual.ctx = self.ctx = utils.canvas.getContext('2d');
						
						orig = orig.bind(overlay);
						
						overlay.render = function(...args){
							orig(...args);
							self.overlayRender(...args);
						};
					},
				},
				WebSocket: socket,
				WP_fetchMMToken: api.token(),
			};
		
		await this.menu.load_config();
		
		new Function(...Object.keys(args), vars.patch(await api.source()))(...Object.values(args));
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
		
		if(this.config.auto_nuke && this.player && this.player.streaks.length == 25)this.socket.send('k', 0);
	}
	dist2d(p1, p2){
		return utils.dist_center(p1.rect) - utils.dist_center(p2.rect);
	}
};

var main = module.exports = new Main();

main.load();