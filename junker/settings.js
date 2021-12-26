'use strict';

if(localStorage.ssconfig && !localStorage.ssjunkerconfig)localStorage.ssjunkerconfig = localStorage.ssconfig;

var meta = require('./meta'),
	MenuUI = require('../libs/MenuUI'),
	DiscordAddon = require('../libs/MenuUI/addons/discord'),
	SettingsAddon = require('../libs/MenuUI/addons/settings'),
	Keybind = require('../libs/Keybind'),
	menu = new MenuUI('Junk', meta.icon, 'junkerconfig'),
	{ meta } = require('../libs/consts'),
	utils = require('../libs/Utils'),
	doc_body = utils.wait_for(() => document.body);

new Keybind('F1', () => {
	document.exitPointerLock();
	menu.window.show();
});

menu.load_addon(DiscordAddon, fetch(new URL('code.txt', meta.discord), { cache: 'no-store' }).then(res => res.text()));
menu.load_addon(SettingsAddon);

menu.add_preset('Default', {
	esp: {
		status: 'off',
		tracers: false,
		nametags: false,
		wireframe: false,
		rainbow: false,
	},
	colors: {
		rainbow: false,
		risk: '#FF7700',
		hostile: '#FF0000',
		friendly: '#00FF00',
	},
	aim: {
		status: 'off',
		auto_reload: false,
		fov: 60,
		offset: 'random',
		smooth: 0,
		wallbangs: false,
		force_auto: false,
		force_auto_rate: 0.2,
		spinbot: false,
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
		proxy: false,
		auto_nuke: false,
		auto_lobby: false,
		auto_start: false,
		inactivity: false,
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
		fov: 110,
		smooth: 0,
		auto_reload: true,
		wallbangs: true,
		offset: 'multi',
		spinbot: true,
	},
	player: {
		bhop: 'autoslide',
	},
});

{
	let render = menu.window.tab('Render');

	render.control('Draw FOV box', {
		type: 'boolean',
		walk: 'aim.fov_box',
	});

	{
		let ESP = render.category('ESP');
		
		ESP.control('Mode', {
			type: 'dropdown',
			walk: 'esp.status',
			value: {
				Off: 'off',
				Box: 'box',
				Chams: 'chams',
				'Box & Chams': 'box_chams',
				Full: 'full',
			},
		});

		ESP.control('Tracers', {
			type: 'boolean',
			walk: 'esp.tracers',
		});
		
		ESP.control('Nametags', {
			type: 'boolean',
			walk: 'esp.nametags',
		});
		
		ESP.control('Wireframe', {
			type: 'boolean',
			walk: 'esp.wireframe',
		});

		ESP.control('Hostile Color', {
			type: 'color',
			walk: 'colors.hostile',
		});

		ESP.control('Risk Color', {
			type: 'color',
			walk: 'colors.risk',
		});

		ESP.control('Friendly Color', {
			type: 'color',
			walk: 'colors.friendly',
		});

		ESP.control('Rainbow Color', {
			type: 'boolean',
			walk: 'colors.rainbow',
		});
	}

	{
		let UI = render.category('UI');

		let css = utils.add_ele('link', () => document.documentElement, { rel: 'stylesheet' }); 

		UI.control('Custom CSS', {
			type: 'textbox',
			walk: 'ui.css',
			placeholder: 'CSS Url',
		}).on('change', value => {
			if(value != '')css.href = value;
		});

		UI.control('Show Menu Button ( [F1] to show )', {
			type: 'boolean',
			walk: 'ui.show_button',
		}).on('change', value => {
			if(value)menu.button.show();
			else menu.button.hide();
		});

		UI.control('Show Advertisments', {
			type: 'boolean',
			walk: 'ui.show_adverts',
		}).on('change', async value => (await doc_body).classList[value ? 'remove' : 'add']('hide-adverts'));

		UI.control('Show Streams', {
			type: 'boolean',
			walk: 'ui.show_streams',
		}).on('change', async value => (await doc_body).classList[value ? 'remove' : 'add']('hide-streams'));

		UI.control('Show Merch', {
			type: 'boolean',
			walk: 'ui.show_merch',
		}).on('change', async value => (await doc_body).classList[value ? 'remove' : 'add']('hide-merch'));

		UI.control('Show News Console', {
			type: 'boolean',
			walk: 'ui.show_news',
		}).on('change', async value => (await doc_body).classList[value ? 'remove' : 'add']('hide-news'));

		UI.control('Show Security Button', {
			type: 'boolean',
			walk: 'ui.show_cookie',
		}).on('change', async value => (await doc_body).classList[value ? 'remove' : 'add']('hide-security'));
	}
}

{
	let Weapon = menu.window.tab('Weapon');

	{
		let Patches = Weapon.category('Patches');

		Patches.control('Auto Reload', {
			type: 'boolean',
			walk: 'aim.auto_reload',
		});

		Patches.control('Force auto-fire', {
			type: 'boolean',
			walk: 'aim.force_auto',
		});

		Patches.control('Auto-fire rate', {
			type: 'slider',
			walk: 'aim.force_auto_rate',
			min: 0,
			max: 2,
			step: 0.1,
		});
	}
	
	{
		let Aimbot = Weapon.category('Aimbot');

		Aimbot.control('Mode', {
			type: 'dropdown',
			walk: 'aim.status',
			value: {
				Off: 'off',
				Triggerbot: 'trigger',
				Correction: 'correction',
				Assist: 'assist',
				Automatic: 'auto',
			},
		});

		Aimbot.control('Offset', {
			type: 'dropdown',
			walk: 'aim.offset',
			value: {
				Head: 'head',
				Chest: 'chest',
				Legs: 'legs',
				Random: 'random',
				Multi: 'multi',
			},
		});

		Aimbot.control('Smoothness', {
			type: 'slider',
			walk: 'aim.smooth',
			min: 0,
			max: 1,
			step: 0.1,
		});
		
		Aimbot.control('FOV', {
			type: 'slider',
			walk: 'aim.fov',
			min: 10,
			max: 110,
			step: 10,
			labels: { 110: 'Inf' },
		});

		Aimbot.control('Wallbangs', {
			type: 'boolean',
			walk: 'aim.wallbangs',
		});

		Aimbot.control('Spinbot', {
			type: 'boolean',
			walk: 'aim.spinbot',
		});
	}
}

{
	let Player = menu.window.tab('Player');

	Player.control('Auto Bhop Mode', {
		type: 'dropdown',
		walk: 'player.bhop',
		value: {
			Off: 'off',
			'Key Jump': 'keyjump',
			'Key Slide': 'keyslide',
			'Auto Slide': 'autoslide',
			'Auto Jump': 'autojump',
		},
	});

	Player.control('Unlock Skins', {
		type: 'boolean',
		walk: 'player.skins',
	});
}

{
	let Game = menu.window.tab('Game');

	Game.control('Proxy', {
		type: 'boolean',
		walk: 'game.proxy',
	}).on('change', (value, init) => !init && location.assign('/'));

	Game.control('Auto Activate Nuke', {
		type: 'boolean',
		walk: 'game.auto_nuke',
	});

	Game.control('Auto Start Match', {
		type: 'boolean',
		walk: 'game.auto_start',
	});

	Game.control('New Lobby Finder', {
		type: 'boolean',
		walk: 'game.auto_lobby',
	});

	Game.control('No Inactivity kick', {
		type: 'boolean',
		walk: 'game.inactivity',
	});
}

{
	let Radio = menu.window.tab('Radio');

	Radio.control('Stream', {
		type: 'select',
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

	Radio.control('Radio Volume', {
		type: 'slider',
		walk: 'radio.volume',
		min: 0,
		max: 1,
		step: 0.05,
	});
}

module.exports = menu;