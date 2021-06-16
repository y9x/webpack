'use strict';

var MenuUI = require('../libs/uimenu'),
	DiscordAddon = require('../libs/uimenu/addons/discord'),
	SettingsAddon = require('../libs/uimenu/addons/settings'),
	menu = new MenuUI('Junk', 'https://y9x.github.io/webpack/junkerBETA/junker.png'),
	{ api, utils, meta } = require('../libs/consts'),
	doc_body = utils.wait_for(() => document.body);

MenuUI.keybinds.add({
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
		custom_billboard: '',
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
		bhop: 'keyjump',
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

render.add_control({
	name: 'Draw FOV box',
	type: 'boolean',
	walk: 'aim.fov_box',
});

var esp = render.add_category('ESP');

esp.add_control({
	name: 'Mode',
	type: 'rotate',
	walk: 'esp.status',
	vals: [
		[ 'off', 'Off' ],
		[ 'box', 'Box' ],
		[ 'chams', 'Chams' ],
		[ 'box_chams', 'Box & chams' ],
		[ 'full', 'Full' ],
	],
});

esp.add_control({
	name: 'Hostile Color',
	type: 'color',
	walk: 'color.hostile',
});

esp.add_control({
	name: 'Risk Color',
	type: 'color',
	walk: 'color.risk',
});

esp.add_control({
	name: 'Friendly Color',
	type: 'color',
	walk: 'color.friendly',
});

esp.add_control({
	name: 'Tracers',
	type: 'boolean',
	walk: 'esp.tracers',
});

esp.add_control({
	name: 'Wireframe',
	type: 'boolean',
	walk: 'esp.wireframe',
});

esp.add_control({
	name: 'Rainbow Color',
	type: 'boolean',
	walk: 'esp.rainbow',
});

var ui = render.add_category('UI');

var css = utils.add_ele('link', document.documentElement, {
	rel: 'stylesheet',
});

ui.add_control({
	name: 'Custom CSS',
	type: 'textbox',
	walk: 'ui.css',
	placeholder: 'CSS Url',
}).on('change', value => {
	if(value != '')css.href = value;
});

ui.add_control({
	name: 'Show Menu Button ( [F1] to show )',
	type: 'boolean',
	walk: 'ui.show_button',
}).on('change', value => {
	if(value)menu.button.show();
	else menu.button.hide();
});

ui.add_control({
	name: 'Show Advertisments',
	type: 'boolean',
	walk: 'ui.show_adverts',
}).on('change', async value => (await doc_body).classList[value ? 'remove' : 'add']('hide-adverts'));

ui.add_control({
	name: 'Show Streams',
	type: 'boolean',
	walk: 'ui.show_streams',
}).on('change', async value => (await doc_body).classList[value ? 'remove' : 'add']('hide-streams'));

ui.add_control({
	name: 'Show Merch',
	type: 'boolean',
	walk: 'ui.show_merch',
}).on('change', async value => (await doc_body).classList[value ? 'remove' : 'add']('hide-merch'));

ui.add_control({
	name: 'Show News Console',
	type: 'boolean',
	walk: 'ui.show_news',
}).on('change', async value => (await doc_body).classList[value ? 'remove' : 'add']('hide-news'));

ui.add_control({
	name: 'Show Security Button',
	type: 'boolean',
	walk: 'ui.show_cookie',
}).on('change', async value => (await doc_body).classList[value ? 'remove' : 'add']('hide-security'));

var weapon = menu.window.add_tab('Weapon');

weapon.add_control({
	name: 'Auto Reload',
	type: 'boolean',
	walk: 'aim.auto_reload',
});

var aimbot = weapon.add_category('Aimbot');

aimbot.add_control({
	name: 'Mode',
	type: 'rotate',
	walk: 'aim.status',
	vals: [
		[ 'off', 'Off' ],
		[ 'trigger', 'Triggerbot' ],
		[ 'correction', 'Correction' ],
		[ 'assist', 'Assist' ],
		[ 'auto', 'Automatic' ],
	],
});

aimbot.add_control({
	name: 'Offset',
	type: 'rotate',
	walk: 'aim.offset',
	vals: [
		[ 'head', 'Head' ],
		[ 'torso', 'Torso' ],
		[ 'legs', 'Legs' ],
		[ 'random', 'Random' ],
	],
});

aimbot.add_control({
	name: 'Smoothness',
	type: 'slider',
	walk: 'aim.smooth',
	range: [ 0, 1, 0.2 ],
});

aimbot.add_control({
	name: 'Hitchance',
	type: 'slider',
	walk: 'aim.hitchance',
	range: [ 10, 100, 5 ],
});

aimbot.add_control({
	name: 'FOV',
	type: 'slider',
	walk: 'aim.fov',
	range: [ 10, 110, 10 ],
	labels: { 110: 'Inf' },
});

aimbot.add_control({
	name: 'Wallbangs',
	type: 'boolean',
	walk: 'aim.wallbangs',
});

var player = menu.window.add_tab('Player');

player.add_control({
	name: 'Auto Bhop Mode',
	type: 'rotate',
	walk: 'player.bhop',
	vals: [
		[ 'off', 'Off' ],
		[ 'keyjump', 'Key jump' ],
		[ 'keyslide', 'Key slide' ],
		[ 'autoslide', 'Auto slide' ],
		[ 'autojump', 'Auto jump' ],
	],
});

player.add_control({
	name: 'Unlock Skins',
	type: 'boolean',
	walk: 'player.skins',
});

var game = menu.window.add_tab('Game');

game.add_control({
	name: 'Auto Activate Nuke',
	type: 'boolean',
	walk: 'game.auto_nuke',
});

game.add_control({
	name: 'Auto Start Match',
	type: 'boolean',
	walk: 'game.auto_start',
});

game.add_control({
	name: 'New Lobby Finder',
	type: 'boolean',
	walk: 'game.auto_lobby',
});

game.add_control({
	name: 'No Inactivity kick',
	type: 'boolean',
	walk: 'game.inactivity',
});

var radio = menu.window.add_tab('Radio');

radio.add_control({
	name: 'Stream',
	type: 'rotate',
	walk: 'radio.stream',
	vals: [
		[ 'off', 'Off' ],
		[ 'http://0n-2000s.radionetz.de/0n-2000s.aac', 'General German/English' ],
		[ 'https://stream-mixtape-geo.ntslive.net/mixtape2', 'Hip Hop / RNB' ],
		[ 'https://live.wostreaming.net/direct/wboc-waaifmmp3-ibc2', 'Country' ],
		[ 'http://streaming.radionomy.com/A-RADIO-TOP-40', 'Dance' ],
		[ 'http://bigrradio.cdnstream1.com/5106_128', 'Pop' ],
		[ 'http://strm112.1.fm/ajazz_mobile_mp3', 'Jazz' ],
		[ 'http://strm112.1.fm/60s_70s_mobile_mp3', 'Golden Oldies' ],
		[ 'http://strm112.1.fm/club_mobile_mp3', 'Club' ],
		[ 'https://freshgrass.streamguys1.com/irish-128mp3', 'Folk' ],
		[ 'http://1a-classicrock.radionetz.de/1a-classicrock.mp3', 'Classic Rock' ],
		[ 'http://streams.radiobob.de/metalcore/mp3-192', 'Heavy Metal' ],
		[ 'http://stream.laut.fm/beatdownx', 'Death Metal' ],
		[ 'http://live-radio01.mediahubaustralia.com/FM2W/aac/', 'Classical' ],
		[ 'http://bigrradio.cdnstream1.com/5187_128', 'Alternative' ],
		[ 'http://streaming.radionomy.com/R1Dubstep?lang=en', 'DubStep' ],
		[ 'http://streams.fluxfm.de/Chillhop/mp3-256', 'LoFi HipHop' ],
		[ 'http://streams.90s90s.de/hiphop/mp3-128/', 'Hip Hop Oldskool' ],
	],
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

radio.add_control({
	name: 'Radio Volume',
	type: 'slider',
	walk: 'radio.volume',
	range: [ 0, 1, 0.05 ],
});

var dev = menu.window.add_tab('Dev');

dev.add_control({
	name: 'Save Game Script',
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

/*Render: {
	ESP: {
		name: 'Player ESP Type',
		value: [ 'off', 'walls', '2d', 'Full' ],
		default: 'off',
		type: 'select',
		set: (value) => {
			// move to main class
			this.nameTags = value != 'off';
			this.noNameTags = value == 'full';
		},
	},
	Tracers: {
		name: "Player Tracers",
		val: false,
		html: () => this.generateSetting("checkbox", "renderTracers"),
	},
	espHostileCol: {
		name: "Hostile Color",
		val: "#ff0000",
		html: () => this.generateSetting("color", "espHostileCol"),
	},
	espFriendlyCol: {
		name: "Friendly Color",
		val: "#00ff00",
		html: () => this.generateSetting("color", "espFriendlyCol"),
	},
	Chams: {
		pre: "<div class='separator'>Color Chams</div>",
		name: "Player Chams",
		val: false,
		html: () => this.generateSetting("checkbox", "renderChams") //+
	},
	WireFrame: {
		name: "Player Wireframe",
		val: false,
		html: () => this.generateSetting("checkbox", "renderWireFrame"),
	},
	rainbowColor: {
		name: "Rainbow Color",
		val: false,
		html: () => this.generateSetting("checkbox", "rainbowColor"),
	},
	chamHostileCol: {
		name: "Hostile Color",
		val: "#ff0000",
		html: () => this.generateSetting("color", "chamHostileCol"),
	},
	chamFriendlyCol: {
		name: "Friendly Color",
		val: "#00ff00",
		html: () => this.generateSetting("color", "chamFriendlyCol"),
	},
	hideAdverts: {
		pre: "<div class='separator'>Krunker UI</div>",
		name: "Hide Advertisments",
		val: true,
		html: () => this.generateSetting("checkbox", "hideAdverts"),
		set: value => document.body.classList[value ? 'add' : 'remove']('hide-adverts'),
	},
	hideStreams: {
		name: "Hide Streams",
		val: false,
		html: () => this.generateSetting("checkbox", "hideStreams"),
		set: value => document.body.classList[value ? 'add' : 'remove']('hide-streams'),
	},
	hideMerch: {
		name: "Hide Merch",
		val: false,
		html: () => this.generateSetting("checkbox", "hideMerch"),
		set: value => document.body.classList[value ? 'add' : 'remove']('hide-merch'),
	},
	hideNewsConsole: {
		name: "Hide News Console",
		val: false,
		html: () => this.generateSetting("checkbox", "hideNewsConsole"),
		set: value => document.body.classList[value ? 'add' : 'remove']('hide-news'),
	},
	hideCookieButton: {
		name: "Hide Security Manage Button",
		val: false,
		html: () => this.generateSetting("checkbox", "hideCookieButton"),
		set: value => document.body.classList[value ? 'add' : 'remove']('hide-security'),
	},
	showSkidBtn: {
		pre: "<hr>",
		name: "Show Menu Button",
		val: true,
		html: () => this.generateSetting("checkbox", "showSkidBtn"),
		set: (value, init) => {
			let button = document.getElementById("mainButton");
			if (!utils.isDefined(button)) utils.create_button("Junk", "https://i.imgur.com/pA5e8hy.png", this.toggleMenu, value)
			utils.wait_for(() => document.getElementById("mainButton")).then(button => { button.style.display = value ? "inherit" : "none" })
		}
	},
	customCSS: {
		pre: "<hr>",
		name: "Custom CSS",
		val: "",
		html: () => this.generateSetting("url", "customCSS", "URL to CSS file"),
		css: document.createElement("link"),
		set: (value, init) => {
			if (value && value.startsWith("http")&&value.endsWith(".css")) {
				this.settings.customCSS.css.href = value
			} else this.settings.customCSS.css.href = null
			if (init && this.settings.customCSS.css) {
				this.settings.customCSS.css.rel = "stylesheet"
				try {
					document.getElementsByTagName('head')[0].appendChild(this.settings.customCSS.css)
				} catch(e) {
					console.error(e)
					this.settings.customCSS.css = null
				}
			}
		}
	},
	customBillboard: {
		name: "Custom Billboard Text",
		val: "",
		html: () =>
		this.generateSetting(
			"text",
			"customBillboard",
			"Custom Billboard Text"
		),
	},
},
Weapon: {
	autoReload: {
		//pre: "<br><div class='setHed'>Weapon</div>",
		name: "Auto Reload",
		val: false,
		html: () => this.generateSetting("checkbox", "autoReload"),
	},
	weaponZoom: {
		name: "Weapon Zoom",
		val: 1.0,
		min: 0,
		max: 50.0,
		step: 0.01,
		html: () => this.generateSetting("slider", "weaponZoom"),
		set: (value) => utils.wait_for(() => this.renderer).then(renderer => renderer.adsFovMlt.fill(value))
	},
	weaponTrails: {
		name: "Weapon Trails",
		val: false,
		html: () => this.generateSetting("checkbox", "weaponTrails"),
		set: (value) => utils.wait_for(() => this.me).then(me => { me.weapon.trail = value })
	},
	autoAim: {
		pre: "<div class='separator'>Auto Aim</div>",
		name: "Auto Aim Type",
		val: "off",
		html: () =>
		this.generateSetting("select", "autoAim", {
			off: "Off",
			correction: "Aim Correction",
			assist: "Legit Aim Assist",
			easyassist: "Easy Aim Assist",
			silent: "Silent Aim",
			trigger: "Trigger Bot",
			quickScope: "Quick Scope"
		}),
	},
	fovBoxSize: {
		name: "FOV Box Type",
		val: "off",
		html: () =>
		this.generateSetting("select", "fovBoxSize", {
			off: "Off",
			small: "Small",
			medium: "Medium",
			large: "Large"
		})
	},
	aimOffset: {
		name: "Aim Offset",
		val: 0,
		min: -4,
		max: 1,
		step: 0.01,
		html: () => this.generateSetting("slider", "aimOffset"),
		set: (value) => { if (this.settings.playStream.audio) this.settings.playStream.audio.volume = value;}
	},
	frustrumCheck: {
		name: "Player Visible Check",
		val: false,
		html: () => this.generateSetting("checkbox", "frustrumCheck"),
	},
	wallPenetrate: {
		name: "Aim through Penetratables",
		val: false,
		html: () => this.generateSetting("checkbox", "wallPenetrate"),
	},
},
Player: {
	autoBhop: {
		name: "Auto Bhop Type",
		val: "off",
		html: () => this.generateSetting("select", "autoBhop", {
			off: "Off",
			autoJump: "Auto Jump",
			keyJump: "Key Jump",
			autoSlide: "Auto Slide",
			keySlide: "Key Slide"
		}),
	},
	skinUnlock: {
		name: "Unlock Skins",
		val: false,
		html: () => this.generateSetting("checkbox", "skinUnlock"),
	},
},
GamePlay: {
	autoActivateNuke: {
		tab: "GamePlay",
		name: "Auto Activate Nuke",
		val: false,
		html: () => this.generateSetting("checkbox", "autoActivateNuke"),
	},
	autoFindNew: {
		tab: "GamePlay",
		name: "New Lobby Finder",
		val: false,
		html: () => this.generateSetting("checkbox", "autoFindNew"),
	},
	autoClick: {
		tab: "GamePlay",
		name: "Auto Start Game",
		val: false,
		html: () => this.generateSetting("checkbox", "autoClick"),
	},
	noInActivity: {
		tab: "GamePlay",
		name: "No InActivity Kick",
		val: true,
		html: () => this.generateSetting("checkbox", "noInActivity"),
	},
},
Radio: {
	playStream: {
		tab: "",
		//pre: "<br><div class='setHed'>Radio Stream Player</div>",
		name: "Stream Select",
		val: "off",
		html: () => this.generateSetting("select", "playStream", {
			off: 'Off',
			_2000s: 'General German/English',
			_HipHopRNB: 'Hip Hop / RNB',
			_Oldskool: 'Hip Hop Oldskool',
			_Country: 'Country',
			_Pop: 'Pop',
			_Dance: 'Dance',
			_Dubstep: 'DubStep',
			_Lowfi: 'LoFi HipHop',
			_Jazz: 'Jazz',
			_Oldies: 'Golden Oldies',
			_Club: 'Club',
			_Folk: 'Folk',
			_ClassicRock: 'Classic Rock',
			_Metal: 'Heavy Metal',
			_DeathMetal: 'Death Metal',
			_Classical: 'Classical',
			_Alternative: 'Alternative',
		}),
		set: (value) => {
			if (value == "off") {
				if ( this.settings.playStream.audio ) {
					this.settings.playStream.audio.pause();
					this.settings.playStream.audio.currentTime = 0;
					this.settings.playStream.audio = null;
				}
				return;
			}
			let url = this.settings.playStream.urls[value];
			if (!this.settings.playStream.audio) {
				this.settings.playStream.audio = new Audio(url);
				this.settings.playStream.audio.volume = this.settings.audioVolume.val||0.5
			} else {
				this.settings.playStream.audio.src = url;
			}
			this.settings.playStream.audio.load();
			this.settings.playStream.audio.play();
		},
		urls: {
			_2000s: 'http://0n-2000s.radionetz.de/0n-2000s.aac',
			_HipHopRNB: 'https://stream-mixtape-geo.ntslive.net/mixtape2',
			_Country: 'https://live.wostreaming.net/direct/wboc-waaifmmp3-ibc2',
			_Dance: 'http://streaming.radionomy.com/A-RADIO-TOP-40',
			_Pop: 'http://bigrradio.cdnstream1.com/5106_128',
			_Jazz: 'http://strm112.1.fm/ajazz_mobile_mp3',
			_Oldies: 'http://strm112.1.fm/60s_70s_mobile_mp3',
			_Club: 'http://strm112.1.fm/club_mobile_mp3',
			_Folk: 'https://freshgrass.streamguys1.com/irish-128mp3',
			_ClassicRock: 'http://1a-classicrock.radionetz.de/1a-classicrock.mp3',
			_Metal: 'http://streams.radiobob.de/metalcore/mp3-192',
			_DeathMetal: 'http://stream.laut.fm/beatdownx',
			_Classical: 'http://live-radio01.mediahubaustralia.com/FM2W/aac/',
			_Alternative: 'http://bigrradio.cdnstream1.com/5187_128',
			_Dubstep: 'http://streaming.radionomy.com/R1Dubstep?lang=en',
			_Lowfi: 'http://streams.fluxfm.de/Chillhop/mp3-256',
			_Oldskool: 'http://streams.90s90s.de/hiphop/mp3-128/',
		},
		audio: null,
	},
	audioVolume: {
		tab: "Radio",
		name: "Radio Volume",
		val: 0.5,
		min: 0,
		max: 1,
		step: 0.01,
		html: () => this.generateSetting("slider", "audioVolume"),
		set: (value) => { if (this.settings.playStream.audio) this.settings.playStream.audio.volume = value;}
	},
},*/

module.exports = menu;