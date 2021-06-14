'use strict';

var UI = require('../libs/ui/'),
	vars = require('../libs/vars'),
	cheat = require('./cheat'),
	Visual = require('./visual'),
	Input = require('./input'),
	Socket = require('./socket'),
	input = new Input(),
	visual = new Visual(),
	{ utils, proxy_addons, supported_store, addon_url, meta, api, store } = require('../libs/consts'),
	process = () => {
		try{
			visual.tick();
			
			if(cheat.config.game.overlay)visual.overlay();
			
			if(cheat.config.aim.fov_box)visual.fov(cheat.config.aim.fov);
			
			if(cheat.game && cheat.world)for(let ent of cheat.game.players.list){
				let player = cheat.add(ent);
				
				if(player.is_you)cheat.player = player;
				
				if(!player.active)continue;
				
				player.tick();
				
				if(!player.frustum || player.is_you)continue;
				
				visual.cham(player);
				
				if(['box', 'box_chams', 'full'].includes(cheat.config.esp.status))visual.box(player);
				
				if(cheat.config.esp.status == 'full'){
					visual.health(player);
					visual.text(player);
				}
				
				if(cheat.config.esp.tracers)visual.tracer(player);
				
				if(cheat.config.esp.labels)visual.label(player);
			};
		}catch(err){
			api.report_error('frame', err);
		}
		
		utils.request_frame(process);
	},
	source = api.source(),
	token = api.token();

api.on_instruct = () => {
	if(api.has_instruct('connection banned 0x2'))localStorage.removeItem('krunker_token'), UI.alert([
		`<p>You were IP banned, Sploit has signed you out.\nSpoof your IP to bypass this ban with one of the following:</p>`,
		`<ul>`,
			`<li>Using your mobile hotspot</li>`,
			...proxy_addons.filter(data => data[supported_store]).map(data => `<li><a target='_blank' href=${JSON.stringify(data[supported_store])}>${data.name}</a></li>`),
			`<li>Use a <a target="_blank" href=${JSON.stringify(addon_url('Proxy VPN'))}>Search for a VPN</a></li>`,
		`</ul>`,
	].join(''));
	else if(api.has_instruct('banned'))localStorage.removeItem('krunker_token'), UI.alert(
		`<p>You were banned, Sploit has signed you out.\nCreate a new account to bypass this ban.</p>`,
	);
	
	if(cheat.config.game.auto_respawn){
		if(api.has_instruct('connection error', 'game is full', 'kicked by vote', 'disconnected'))location.assign('https://krunker.io');
		else if(api.has_instruct('to play') && (!cheat.player || !cheat.player.active)){
			cheat.controls.locklessChange(true);
			cheat.controls.locklessChange(false);
		}
	}
};

UI.ready.then(async () => {
	utils.canvas = UI.canvas;
	
	cheat.ui = require('./entries');
	
	await cheat.ui.load_config();
	
	// migrate
	if(typeof cheat.config.aim.smooth == 'object')cheat.config.aim.smooth = cheat.config.aim.smooth.value;
	if(typeof cheat.config.esp.walls == 'object')cheat.config.esp.walls = 100;
	
	if(cheat.config.aim.target == 'feet')cheat.config.aim.target == 'legs';
	else if(cheat.config.aim.target == 'chest')cheat.config.aim.target == 'torso';
	
	if(cheat.config.game.custom_loading){
		var loading = new UI.Loading(meta.discord);
		
		token.finally(() => loading.hide());
	}
	
	process();
	
	var krunker = vars.patch(await source);
	
	var args = {
		[ vars.key ]: {
			three(three){ utils.three = three },
			game(game){
				cheat.game = utils.game = game;
				Object.defineProperty(game, 'controls', {
					configurable: true,
					set(controls){
						// delete definition
						delete game.controls;
						
						var timer = 0;
						
						Object.defineProperty(controls, 'idleTimer', {
							get: _ => cheat.config.game.inactivity ? 0 : timer,
							set: value => timer = value,
						});
						
						return cheat.controls = game.controls = controls;
					},
				});
			},
			world(world){ cheat.world = utils.world = world },
			can_see: inview => cheat.config.esp.status == 'full' ? false : (cheat.config.esp.nametags || inview),
			skins: ent => cheat.config.game.skins && typeof ent == 'object' && ent != null && ent.stats ? cheat.skins : ent.skins,
			input: input.push.bind(input),
			timer: (object, property, timer) => Object.defineProperty(object, property, {
				get: _ => cheat.config.game.inactivity ? 0 : timer,
				set: value => cheat.config.game.inactivity ? Infinity : timer,
			}),
		},
		WebSocket: Socket,
		WP_fetchMMToken: token,
	};
	
	await api.load;
	
	new Function(...Object.keys(args), krunker)(...Object.values(args));
});