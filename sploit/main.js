'use strict';

var UI = require('../libs/ui/'),
	vars = require('../libs/vars'),
	Visual = require('../libs/visual'),
	Input = require('../libs/input'),
	Socket = require('../libs/socket'),
	Player = require('../libs/player'),
	{ utils, proxy_addons, supported_store, addon_url, meta, api, store } = require('../libs/consts');

class Main {
	constructor(){
		this.hooked = Symbol();
		this.skins = [...Array(5000)].map((e, i) => ({ ind: i, cnt: 1 }));
		
		var self = this;
		
		this.interface = {
			get game(){
				return self.game;
			},
			get force_auto(){
				return self.config.aim.force_auto;
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
				self.target = self.players.filter(player => player.can_target).sort((ent_1, ent_2) => self.sorts[ent_1.rect && ent_2.rect ? self.config.aim.target_sorting || 'dist2d' : 'dist3d'](ent_1, ent_2) * (ent_1.frustum ? 1 : 0.5))[0];
			},
		};
		
		this.sorts = {
			dist3d: (ent_1, ent_2) => {
				return ent_1.distance_camera - ent_2.distance_camera;
			},
			dist2d: (ent_1, ent_2) => {
				return utils.dist_center(ent_1.rect) - utils.dist_center(ent_2.rect);
			},
			hp: (ent_1, ent_2) => {
				return ent_1.health - ent_2.health;
			},
		};
	}
	async load(){
		var source = api.source(),
			token = api.token();
		
		utils.canvas = UI.canvas;
		
		this.ui = require('./settings');
		
		await this.ui.load_config();
		
		// migrate
		if(typeof this.config.aim.smooth == 'object')this.config.aim.smooth = this.config.aim.smooth.value;
		if(this.config.aim.smooth > 1)this.config.aim.smooth = 0;
		if(typeof this.config.esp.walls == 'object')this.config.esp.walls = 100;
		
		if(this.config.aim.target == 'feet')this.config.aim.target == 'legs';
		else if(this.config.aim.target == 'chest')this.config.aim.target == 'torso';
		
		/*if(this.config.game.custom_loading){
			var loading = new UI.Loading(meta.discord, 'https://y9x.github.io/webpack/libs/gg.gif');
			
			token.then(() => loading.hide()).catch(() => loading.hide());
		}*/
		
		api.on_instruct = () => {
			if(this.config.game.error_tips){
				if(api.has_instruct('connection banned 0x2'))localStorage.removeItem('krunker_token'), UI.alert([
					`<p>You were IP banned, Sploit has signed you out.\nSpoof your IP to bypass this ban with one of the following:</p>`,
					`<ul>`,
						`<li>Using your mobile hotspot</li>`,
						...proxy_addons.filter(data => data[supported_store]).map(data => `<li><a target='_blank' href=${JSON.stringify(data[supported_store])}>${data.name}</a></li>`),
						`<li>Use a <a target="_blank" href=${JSON.stringify(addon_url('Proxy VPN'))}>Search for a VPN</a></li>`,
					`</ul>`,
				].join(''));
				else if(api.has_instruct('banned - '))UI.alert(
					`<p>You were banned from this match. Find a new game to bypass this.</p>`,
				);
				else if(api.has_instruct('banned'))localStorage.removeItem('krunker_token'), UI.alert(
					`<p>You were banned, Sploit has signed you out.\nCreate a new account to bypass this ban.</p>`,
				);
			}
			
			if(this.config.game.auto_lobby && api.has_instruct('connection error', 'game is full', 'kicked by vote', 'disconnected'))location.href = '/';
			else if(this.config.game.auto_start && api.has_instruct('to play') && (!this.player || !this.player.active)){
				this.controls.locklessChange(true);
				this.controls.locklessChange(false);
			}
		};
		
		this.visual = new Visual(this.interface);
		
		var self = this,
			socket = Socket(this.interface),
			input = new Input(this.interface),
			args = {
			[ vars.key ]: {
				three(three){ utils.three = three },
				game: game => Object.defineProperty(this.game = utils.game = game, 'controls', {
					configurable: true,
					set(controls){
						// delete definition
						delete game.controls;
						
						var timer = 0;
						
						Object.defineProperty(controls, 'idleTimer', {
							get: _ => self.config.game.inactivity ? 0 : timer,
							set: value => timer = value,
						});
						
						return self.controls = game.controls = controls;
					},
				}),
				world: world => this.world = utils.world = world,
				can_see: inview => this.config.esp.status == 'full' ? false : (this.config.esp.nametags || inview),
				skins: ent => this.config.player.skins && typeof ent == 'object' && ent != null && ent.stats ? this.skins : ent.skins,
				input: input.push.bind(input),
				timer: (object, property, timer) => Object.defineProperty(object, property, {
					get: _ => this.config.game.inactivity ? 0 : timer,
					set: value => this.config.game.inactivity ? Infinity : timer,
				}),
			},
			WebSocket: socket,
			WP_fetchMMToken: token,
		};
		
		this.process();
		
		await api.load;
		
		new Function(...Object.keys(args), vars.patch(await source))(...Object.values(args));
	}
	process(){
		try{
			this.visual.tick(UI);
			
			if(this.config.game.overlay)this.visual.overlay();
			
			if(this.config.aim.fov_box)this.visual.fov(this.config.aim.fov);
			
			if(this.game && this.world){
				this.visual.walls();
				
				for(let player of this.players){
					if(player.is_you)this.player = player;
					
					if(!player.active)continue;
					
					player.tick();
					
					if(!player.frustum || player.is_you)continue;
					
					this.visual.cham(player);
					
					if(['box', 'box_chams', 'full'].includes(this.config.esp.status))this.visual.box(player);
					
					if(this.config.esp.status == 'full'){
						this.visual.health(player);
						this.visual.text(player);
					}
					
					if(this.config.esp.tracers)this.visual.tracer(player);
				}
			}
		}catch(err){
			api.report_error('frame', err);
		}
		
		utils.request_frame(() => this.process());
	}
	get config(){
		return this.ui.config;
	}
	get players(){
		return this.game.players.list.map(ent => this.add(ent));
	}
	add(entity){
		return entity[this.hooked] || (entity[this.hooked] = new Player(this, entity));
	}
};

var main = module.exports = new Main();

main.load();