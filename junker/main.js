 'use strict';

var { api, meta, utils, loader } = require('../libs/consts'),
	{ vars } = loader,
	Input = require('../libs/Input'),
	Player = require('../libs/Player'),
	Visual = require('../libs/visual'),
	Socket = require('../libs/Socket');

loader.patch('Socket', /(\w+\.exports={ahNum:)/, (match, set) => `${loader.context.key}.socket=${set}`);

class Main {
	constructor(){
		this.hooked = Symbol();
		
		this.overlay = utils.add_ele('div', () => document.documentElement, {
			style: {
				top: 0,
				left: 0,
				'z-index': 9999999999,
				border: 'none',
				position: 'absolute',
				background: '#0000',
				width: '100vw',
				height: '100vh',
				overflow: 'hidden',
				'pointer-events': 'none',
			},
		}).attachShadow({ mode: 'closed' });
		
		this.canvas = utils.add_ele('canvas', this.overlay);
		this.ctx = this.canvas.getContext('2d');
		
		this.init_interface();
		
		this.input = new Input(this.interface);
		this.visual = new Visual(this.interface);
		
		window.addEventListener('resize', () => this.resize_canvas());
		this.resize_canvas();
		
		this.skins = [...Array(5000)].map((e, i) => ({ ind: i, cnt: 1 }));
		
		this.menu = require('./settings.js');
		
		loader.on('instruct', has => {	
			if(this.config.game.auto_lobby && has('connection error', 'game is full', 'kicked by vote', 'disconnected'))location.href = '/';
			else if(this.config.game.auto_start && has('to play') && (!this.player || !this.player.active)){
				this.controls.locklessChange(true);
				this.controls.locklessChange(false);
			}
		});
	}
	get players(){
		return this.game.players.list.map(ent => this.add(ent));
	}
	add(entity){
		return entity[this.hooked] || (entity[this.hooked] = new Player(this.interface, entity));
	}
	init_interface(){
		var self = this;
		
		this.interface = {
			get ctx(){
				return self.ctx;
			},
			get visual(){
				return self.visual;
			},
			get game(){
				return self.game;
			},
			get world(){
				return self.world;
			},
			get force_auto(){
				return self.config.aim.force_auto;
			},
			get color(){
				return self.config.color;
			},
			get rainbow(){
				return self.config.esp.rainbow;
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
				self.target = self.players.filter(player => player.can_target && player.rect).sort((p1, p2) => self.dist2d(p1, p2) * (p1.frustum ? 1 : 0.5))[0];
			},
		};		
	}
	async load(){
		utils.add_ele('style', () => document.documentElement, { textContent: require('./index.css') });
		
		var ls = localStorage.getItem('ssjunkconfig');
		
		if(typeof GM_setValue == 'function' && typeof GM == 'object' && !GM_getValue('config') && ls)await GM.setValue('config', ls);
		
		await this.menu.load_config();
		
		var $skins = Symbol(),
			self = this;
		
		await loader.load({
			WebSocket: Socket(this.interface),
		}, {
			three: three => utils.three = three,
			game: game => this.game = utils.game = game,
			controls: controls => {
				var timer = 0;
				
				Object.defineProperty(controls, 'idleTimer', {
					get: _ => this.config.game.inactivity ? 0 : timer,
					set: value => timer = value,
				});
				
				this.controls = controls;
			},
			world: world => utils.world = this.world = world,
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
			timer: (object, property, timer) => Object.defineProperty(object, property, {
				get: _ => this.config.game.inactivity ? 0 : timer,
				set: value => this.config.game.inactivity ? Infinity : timer,
			}),
			socket: socket => this.socket = socket,
		});
		
		this.process = this.process.bind(this);
		this.process();
	}
	resize_canvas(){
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
	}
	process(){
		try{
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
					this.visual.text_clean(player);
				}
				
				this.visual.cham(player);
			}

			if(this.config.auto_nuke && this.player && this.player.streaks.length == 25)this.socket.send('k', 0);
		}catch(err){
			loader.report_error('frame', err);
		}
		
		utils.request_frame(this.process);
	}
	get config(){
		return this.menu.config;
	}
	dist2d(p1, p2){
		return utils.dist_center(p1.rect) - utils.dist_center(p2.rect);
	}
};

var main = module.exports = new Main();

main.load();