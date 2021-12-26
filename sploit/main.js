'use strict';

var UI = require('../libs/FloatUI'),
	Visual = require('../libs/Visual'),
	Input = require('../libs/Input'),
	Socket = require('../libs/Socket'),
	Player = require('../libs/Player'),
	Keybind = require('../libs/Keybind'),
	KrunkerUtils = require('../libs/KrunkerUtils'),
	{ frame, proxy_addons, supported_store, addon_url, meta, store, loader, init } = require('../libs/consts'),
	utils = require('../libs/Utils'),
	actions = new UI.Actions(frame);

class Main {
	hooked = Symbol();
	skins = [...Array(5000)].map((e, i) => ({ ind: i, cnt: 1 }));
	canvas = utils.add_ele('canvas', frame);
	ctx = this.canvas.getContext('2d');
	sorts = {
		dist3d: (ent_1, ent_2) => {
			return ent_1.distance_camera - ent_2.distance_camera;
		},
		dist2d: (ent_1, ent_2) => {
			return this.utils.dist_center(ent_1.rect) - this.utils.dist_center(ent_2.rect);
		},
		hp: (ent_1, ent_2) => {
			return ent_1.health - ent_2.health;
		},
	};
	constructor(){
		this.resize_canvas();
		window.addEventListener('resize', () => this.resize_canvas());
		
		this.init_interface();
		
		this.utils = new KrunkerUtils(this.interface);
		this.visual = new Visual(this.interface);
		this.input = new Input(this.interface);
	}
	resize_canvas(){
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
	}
	init_interface(){
		var self = this;
		
		this.interface = {
			get ctx(){
				return self.ctx;
			},
			get utils(){
				return self.utils;
			},
			get visual(){
				return self.visual;
			},
			get game(){
				return self.game;
			},
			get socket(){
				return self.socket;
			},
			get three(){
				return self.three;
			},
			get world(){
				return self.world;
			},
			get force_auto(){
				return self.config.aim.force_auto;
			},
			get force_auto_rate(){
				return self.config.aim.force_auto_rate;
			},
			get color(){
				return self.config.colors;
			},
			get controls(){
				return self.controls;
			},
			get player(){
				return self.player;
			},
			get players(){
				return self.players;
			},
			get target(){
				return self.target;
			},
			get inactivity(){
				return self.config.game.inactivity;
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
			get spinbot(){
				return self.config.aim.spinbot;
			},
			get aim(){
				return self.config.aim.status;
			},
			get aim_offset(){
				return self.config.aim.offset;
			},
			get wallbangs(){
				return self.config.aim.wallbangs;
			},
			get aim_fov(){
				return self.config.aim.fov;
			},
			get aim_smooth(){
				return self.config.aim.smooth;
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
			get proxy(){
				return self.config.game.proxy;
			},
		};
	}
	async load(){
		this.ui = require('./settings');
		
		init.call(this);
		
		await this.ui.load_config();
		
		// migrate
		if(typeof this.config.aim.smooth == 'object')this.config.aim.smooth = this.config.aim.smooth.value;
		if(this.config.aim.smooth > 1)this.config.aim.smooth = 0;
		if(typeof this.config.esp.walls == 'object')this.config.esp.walls = 100;
		
		if(this.config.aim.target == 'feet')this.config.aim.target = 'legs';
		// chest was the more accurate description
		// else if(this.config.aim.target == 'chest')this.config.aim.target = 'torso';
		else if(this.config.aim.target == 'torso')this.config.aim.target = 'chest';
		
		/*if(this.config.game.custom_loading){
			var loading = new UI.Loading(meta.discord, 'https://y9x.github.io/webpack/libs/gg.gif');
			
			token.then(() => loading.hide()).catch(() => loading.hide());
		}*/
		
		loader.on('instruct', has => {
			if(this.config.game.error_tips){
				if(has('connection banned')){
					if(this.config.game.proxy)actions.alert(
						`<p>Your region's proxy was banned.</p>
						<p>To bypass this ban, try one of the following:</p>
						<ul>
							<li><a href='/'>Find a new match</a></li>
							<li><a href='#' onclick='showWindow(1)'>Change your region</a></li>
						</ul>`
					);
					else{
						let proxy_list = proxy_addons.filter(data => data[supported_store]).map(data => 
							`<li><a target='_blank' href=${JSON.stringify(data[supported_store])}>${data.name}</a></li>`
						).join('');
						
						localStorage.removeItem('krunker_token');
						
						actions.alert(
							`<p>You were IP banned, Sploit has signed you out.\nSpoof your IP to bypass this ban with one of the following:</p>
							<ul>
								<li>Using your mobile hotspot</li>
								${proxy_list}
								<li>Use a <a target="_blank" href=${JSON.stringify(addon_url('Proxy VPN'))}>Search for a VPN</a></li>
							</ul>`
						);
					}
				}else if(has('banned - '))actions.alert(
					`<p>You were banned from the match.</p>
					<p>Find a new game to bypass this.</p>`
				).then(() => location.assign('/'));
				else if(has('banned'))localStorage.removeItem('krunker_token'), actions.alert(
					`<p>You were banned. Sploit has signed you out.</p>
					<p>Create a new account to bypass this ban.</p>`
				).then(() => location.assign('/'));
			}
			
			if(this.config.game.auto_lobby && has('connection error', 'game is full', 'kicked by vote', 'disconnected'))location.href = '/';
			else if(this.config.game.auto_start && has('to play') && (!this.player || !this.player.active)){
				this.utils.wait_for(() => {
					var active = this.player && this.player.active;
					
					if(!active){
						this.controls.locklessChange(true);
						this.controls.locklessChange(false);
					}
					
					return active;
				});
			}
		});
		
		this.process = this.process.bind(this);
		this.process();
		
		var $skins = Symbol(),
			self = this;
		
		await loader.load({
			WebSocket: Socket(this.interface),
		}, {
			three: three => this.three = three,
			game: game => this.game = game,
			controls: controls => this.controls = controls,
			time: time => this.config.game.inactivity ? Infinity : time,
			world: world => this.world = world,
			can_see: inview => this.config.esp.status == 'full' ? false : (this.config.esp.nametags || inview),
			skins: ent => Object.defineProperty(ent, 'skins', {
				get(){
					return self.config.player.skins ? self.skins : this[$skins];
				},
				set(value){
					return this[$skins] = value;
				},
			}),
			input: this.input,
			socket: socket => this.socket = socket,
		});
	}
	process(){
		try{
			this.visual.tick();
			
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
			
			if(this.config.game.auto_nuke && this.player && this.player.streaks.length == 25)this.socket.send('k', 0);
		}catch(err){
			loader.report_error('frame', err);
		}
		
		this.utils.request_frame(this.process);
	}
	get config(){
		return this.ui.config;
	}
	get players(){
		return this.game.players.list.map(ent => this.add(ent));
	}
	add(entity){
		return entity[this.hooked] || (entity[this.hooked] = new Player(this.interface, entity));
	}
};

var main = module.exports = new Main();

main.load();