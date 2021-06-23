'use strict';

var meta = require('./meta'),
	UIMenu = require('../libs/uimenu'),
	DiscordAddon = require('../libs/uimenu/addons/discord'),
	SettingsAddon = require('../libs/uimenu/addons/settings'),
	menu = new UIMenu('Junk', meta.icon, 'config'),
	{ api, utils, meta } = require('../libs/consts'),
	doc_body = utils.wait_for(() => document.body);

UIMenu.keybinds.add({
	code: 'F1',
	interact(){
		document.exitPointerLock();
		menu.window.show();
	},
});

menu.load_addon(DiscordAddon, fetch(new URL('code.txt', meta.discord), { cache: 'no-store' }).then(res => res.text()));
menu.load_addon(SettingsAddon);

menu.add_preset('Default', {
	esp: {
		status: 'off',
		tracers: false,
		wireframe: false,
		rainbow: false,
	},
	color: {
		risk: '#FF7700',
		hostile: '#FF0000',
		friendly: '#00FF00',
	},
	aim: {
		status: 'off',
		auto_reload: false,
		fov: 60,
		hitchance: 100,
		offset: 'random',
		smooth: 0,
		wallbangs: false,
		force_auto: false,
	},
	player: {
		bhop: 'off',
		skins: false,
	},
	ui: {
		show_adverts: false,
		show_streams: true,
		show_merch: true,
		show_news: true,
		show_cookie: true,
		show_button: true,
		css: '',
	},
	game: {
		auto_nuke: false,
		auto_lobby: false,
		auto_start: false,
		inactivity: true,
	},
	radio: {
		stream: 'off',
		volume: 0.5,
	},
});

menu.add_preset('Assist', {
	aim: {
		status: 'assist',
		fov: 70,
		offset: 'random',
		smooth: 0.6,
	},
	player: {
		bhop: 'keyslide',
	},
});

menu.add_preset('Rage', {
	esp: {
		status: 'full',
		tracers: true,
	},
	aim: {
		status: 'auto',
		fov: 0,
		smooth: 0,
		auto_reload: true,
		wallbangs: true,
		offset: 'head',
	},
	player: {
		bhop: 'autoslide',
	},
});

var render = menu.window.add_tab('Render');

render.add_control('Draw FOV box', {
	type: 'boolean',
	walk: 'aim.fov_box',
});

var esp = render.add_category('ESP');

esp.add_control('Mode', {
	type: 'rotate',
	walk: 'esp.status',
	value: {
		off: 'Off',
		box: 'Box',
		chams: 'Chams',
		box_chams: 'Box & Chams',
		full: 'Full',
	},
});

esp.add_control('Hostile Color', {
	type: 'color',
	walk: 'color.hostile',
});

esp.add_control('Risk Color', {
	type: 'color',
	walk: 'color.risk',
});

esp.add_control('Friendly Color', {
	type: 'color',
	walk: 'color.friendly',
});

esp.add_control('Tracers', {
	type: 'boolean',
	walk: 'esp.tracers',
});

esp.add_control('Wireframe', {
	type: 'boolean',
	walk: 'esp.wireframe',
});

esp.add_control('Rainbow Color', {
	type: 'boolean',
	walk: 'esp.rainbow',
});

var ui = render.add_category('UI');

var css = utils.add_ele('link', () => document.documentElement, { rel: 'stylesheet' }); 

ui.add_control('Custom CSS', {
	type: 'textbox',
	walk: 'ui.css',
	placeholder: 'CSS Url',
}).on('change', value => {
	if(value != '')css.href = value;
});

ui.add_control('Show Menu Button ( [F1] to show )', {
	type: 'boolean',
	walk: 'ui.show_button',
}).on('change', value => {
	if(value)menu.button.show();
	else menu.button.hide();
});

ui.add_control('Show Advertisments', {
	type: 'boolean',
	walk: 'ui.show_adverts',
}).on('change', async value => (await doc_body).classList[value ? 'remove' : 'add']('hide-adverts'));

ui.add_control('Show Streams', {
	type: 'boolean',
	walk: 'ui.show_streams',
}).on('change', async value => (await doc_body).classList[value ? 'remove' : 'add']('hide-streams'));

ui.add_control('Show Merch', {
	type: 'boolean',
	walk: 'ui.show_merch',
}).on('change', async value => (await doc_body).classList[value ? 'remove' : 'add']('hide-merch'));

ui.add_control('Show News Console', {
	type: 'boolean',
	walk: 'ui.show_news',
}).on('change', async value => (await doc_body).classList[value ? 'remove' : 'add']('hide-news'));

ui.add_control('Show Security Button', {
	type: 'boolean',
	walk: 'ui.show_cookie',
}).on('change', async value => (await doc_body).classList[value ? 'remove' : 'add']('hide-security'));

var weapon = menu.window.add_tab('Weapon');

weapon.add_control('Auto Reload', {
	type: 'boolean',
	walk: 'aim.auto_reload',
});

weapon.add_control('Force auto-fire', {
	type: 'boolean',
	walk: 'aim.force_auto',
});

var aimbot = weapon.add_category('Aimbot');

aimbot.add_control('Mode', {
	type: 'rotate',
	walk: 'aim.status',
	value: {
		off: 'Off',
		trigger: 'Triggerbot',
		correction: 'Correction',
		assist: 'Assist',
		auto: 'Automatic',
	},
});

aimbot.add_control('Offset', {
	type: 'rotate',
	walk: 'aim.offset',
	value: {
		head: 'Head',
		torso: 'Torso',
		legs: 'Legs',
		random: 'Random',
	},
});

aimbot.add_control('Smoothness', {
	type: 'slider',
	walk: 'aim.smooth',
	min: 0,
	max: 1,
	step: 0.2,
});

aimbot.add_control('Hitchance', {
	type: 'slider',
	walk: 'aim.hitchance',
	min: 10,
	max: 100,
	step: 10,
});

aimbot.add_control('FOV', {
	type: 'slider',
	walk: 'aim.fov',
	min: 10,
	max: 110,
	step: 10,
	labels: { 110: 'Inf' },
});

aimbot.add_control('Wallbangs', {
	type: 'boolean',
	walk: 'aim.wallbangs',
});

var player = menu.window.add_tab('Player');

player.add_control('Auto Bhop Mode', {
	type: 'rotate',
	walk: 'player.bhop',
	value: {
		off: 'Off',
		keyjump: 'Key Jump',
		keyslide: 'Key Slide',
		autoslide: 'Auto Slide',
		autojump: 'Auto Jump',
	},
});

player.add_control('Unlock Skins', {
	type: 'boolean',
	walk: 'player.skins',
});

var game = menu.window.add_tab('Game');

game.add_control('Auto Activate Nuke', {
	type: 'boolean',
	walk: 'game.auto_nuke',
});

game.add_control('Auto Start Match', {
	type: 'boolean',
	walk: 'game.auto_start',
});

game.add_control('New Lobby Finder', {
	type: 'boolean',
	walk: 'game.auto_lobby',
});

game.add_control('No Inactivity kick', {
	type: 'boolean',
	walk: 'game.inactivity',
});

var radio = menu.window.add_tab('Radio');

radio.add_control('Stream', {
	type: 'rotate',
	walk: 'radio.stream',
	value: {
		'off': 'Off',
		'http://0n-2000s.radionetz.de/0n-2000s.aac': 'General German/English',
		'https://stream-mixtape-geo.ntslive.net/mixtape2': 'Hip Hop / RNB',
		'https://live.wostreaming.net/direct/wboc-waaifmmp3-ibc2': 'Country',
		'http://streaming.radionomy.com/A-RADIO-TOP-40': 'Dance',
		'http://bigrradio.cdnstream1.com/5106_128': 'Pop',
		'http://strm112.1.fm/ajazz_mobile_mp3': 'Jazz',
		'http://strm112.1.fm/60s_70s_mobile_mp3': 'Golden Oldies',
		'http://strm112.1.fm/club_mobile_mp3': 'Club',
		'https://freshgrass.streamguys1.com/irish-128mp3': 'Folk',
		'http://1a-classicrock.radionetz.de/1a-classicrock.mp3': 'Classic Rock',
		'http://streams.radiobob.de/metalcore/mp3-192': 'Heavy Metal',
		'http://stream.laut.fm/beatdownx': 'Death Metal',
		'http://live-radio01.mediahubaustralia.com/FM2W/aac/': 'Classical',
		'http://bigrradio.cdnstream1.com/5187_128': 'Alternative',
		'http://streaming.radionomy.com/R1Dubstep?lang=en': 'DubStep',
		'http://streams.fluxfm.de/Chillhop/mp3-256': 'LoFi HipHop',
		'http://streams.90s90s.de/hiphop/mp3-128/': 'Hip Hop Oldskool',
	},
}).on('change', function(value){
	if(value == 'off'){
		if(this.audio){
			this.audio.pause();
			this.audio.currentTime = 0;
			delete this.audio;
		}
		
		return;
	}
	
	if(!this.audio){
		this.audio = new Audio(value);
		console.log(menu.config);
		this.audio.volume = menu.config.radio.volume;
	}else{
		this.audio.src = value;
	}
	
	this.audio.load();
	this.audio.play();
});

radio.add_control('Radio Volume', {
	type: 'slider',
	walk: 'radio.volume',
	min: 0,
	max: 1,
	step: 0.05,
});

var dev = menu.window.add_tab('Dev');

dev.add_control('Save Game Script', {
	type: 'function',
	value(){
		var link = utils.add_ele('a', document.documentElement, { href: api.resolve({
			target: api.api_v2,
			endpoint: 'source',
			query: { download: true },
		}) });

		link.click();

		link.remove();
	},
});

module.exports = menu;