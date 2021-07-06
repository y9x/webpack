'use strict';

var { api, utils, meta, loader } = require('../libs/consts.js'),
	UI = require('../libs/FloatUI'),
	File = require('../libs/File'),
	Keybind = require('../libs/Keybind'),
	Request = require('../libs/Request'),
	menu = new UI.Config('Sploit', 'config'),
	binds = {
		toggle: new Keybind().add_callback(() => {
			if(menu.visible)menu.hide();
			else document.exitPointerLock(), menu.show();
		}),
		reset: new Keybind().add_callback(() => menu.load_preset('Default', {
			binds: menu.menu.binds,
		})),
	};

var render = menu.add_tab('Render');

render.add_control('ESP Mode', {
	name: 'ESP Mode',
	type: 'rotate',
	walk: 'esp.status',
	key: 'binds.esp',
	value: {
		off: 'Off',
		box: 'Box',
		chams: 'Chams',
		box_chams: 'Box & Chams',
		full: 'Full',
	},
});

render.add_control('Nametags', {
	type: 'boolean',
	walk: 'esp.nametags',
});

render.add_control('Tracers', {
	type: 'boolean',
	walk: 'esp.tracers',
});

render.add_control('Wireframe', {
	type: 'boolean',
	walk: 'esp.wireframe',
});

render.add_control('Wall Opacity', {
	type: 'slider',
	walk: 'esp.walls',
	min: 0,
	max: 100,
	step: 10,
});

render.add_control('Overlay', {
	type: 'boolean',
	walk: 'game.overlay',
	key: 'binds.overlay',
});

render.add_control('Custom CSS', {
	type: 'function',
	value(){ menu.css_editor.show() },
});

var weapon = menu.add_tab('Weapon');

weapon.add_control('Aimbot Mode', {
	type: 'rotate',
	walk: 'aim.status',
	value: {
		off: 'Off',
		trigger: 'Triggerbot',
		correction: 'Correction',
		assist: 'Assist',
		auto: 'Automatic',
	},
	key: 'binds.aim',
});

weapon.add_control('Target', {
	type: 'rotate',
	walk: 'aim.offset',
	value: {
		head: 'Head',
		torso: 'Torso',
		legs: 'Legs',
		random: 'Random',
	},
});

weapon.add_control('Target Sorting', {
	type: 'rotate',
	walk: 'aim.target_sorting',
	value: {
		dist2d: 'Crosshair',
		dist3d: 'Distance',
		hp: 'Health',
	},
});

weapon.add_control('Draw Target FOV', {
	type: 'boolean',
	walk: 'aim.fov_box',
});

weapon.add_control('Target FOV', {
	type: 'slider',
	walk: 'aim.fov',
	min: 5,
	max: 110,
	step: 5,
	labels: {
		110: 'Inf',
	},
});

weapon.add_control('Smoothness', {
	type: 'slider',
	walk: 'aim.smooth',
	min: 0,
	max: 1,
	step: 0.1,
	labels: { 0: 'Off' },
});

weapon.add_control('Hitchance', {
	type: 'slider',
	walk: 'aim.hitchance',
	min: 10,
	max: 100,
	step: 10,
});

weapon.add_control('Wallbangs', {
	type: 'boolean',
	walk: 'aim.wallbangs',
});

weapon.add_control('Force auto-fire', {
	type: 'boolean',
	walk: 'aim.force_auto',
});

weapon.add_control('Auto reload', {
	type: 'boolean',
	walk: 'aim.auto_reload',
});

var player = menu.add_tab('Player');

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
	key: 'binds.bhop',
});

player.add_control('Unlock Skins', {
	type: 'boolean',
	walk: 'player.skins',
});

var game = menu.add_tab('Game');

/*game.add_control('Custom Loading Screen', {
	type: 'boolean',
	walk: 'game.custom_loading',
});*/

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

game.add_control('Error code tips', {
	type: 'boolean',
	walk: 'game.error_tips',
});

var info = menu.add_tab('Info');

info.add_control('GitHub', {
	type: 'link',
	value: meta.github,
});

info.add_control('Discord', {
	type: 'link',
	value: meta.discord,
});

info.add_control('Forum', {
	type: 'link',
	value: meta.forum,
});

info.add_control('Download Game', {
	type: 'link',
	value: Request.resolve({
		target: loader.api_v2,
		endpoint: 'source',
		query: { download: true },
	}),
});

var interf = menu.add_tab('Interface');

interf.add_control({
	type: 'functions',
	value: {
		Reset(){
			menu.load_preset('Default');
		},
		async Import(){
			var file = await File.pick({
					accept: 'menu.json',
				}),
				data = await file.read();
			
			try{
				await menu.insert_config(JSON.parse(data), true);
			}catch(err){
				console.error(err);
				alert('Invalid config');
			}
		},
		Export(){
			File.save({
				name: 'menu.json',
				data: JSON.stringify(menu.config),
			})
		},
	},
});

var preset = interf.add_control('Preset', {
	type: 'rotate',
	value: {},
}).select;

preset.addEventListener('change', () => {
	if(preset.value == 'Custom')return;
	
	menu.load_preset(preset.value, { section: menu.config.section });
});

utils.add_ele('ez-option', preset, { value: 'Custom' });

menu.on('add-preset', label => utils.add_ele('ez-option', preset, { value: label }));

menu.on('config', () => {
	var Default = menu.presets.get('Default'),
		// remove excess such as .section
		string = JSON.stringify(utils.filter_deep(utils.clone_obj(menu.config), Default));
	
	for(let [ label, value ] of menu.presets){
		if(JSON.stringify(utils.assign_deep(utils.clone_obj(Default), value)) == string)return preset.value = label;
	}
	
	preset.value = 'Custom';
});

interf.add_control('Menu Toggle', {
	type: 'keybind',
	walk: 'binds.toggle',
}).on('change', value => binds.toggle.set_key('F1', value));

interf.add_control('Reset settings', {
	type: 'keybind',
	walk: 'binds.reset',
}).on('change', value => binds.reset.set_key(value));

menu.css_editor = new UI.Editor({
	help: [
		`<h3>Glossary:</h3><ul>`,
			`<li>Menu bar - set of buttons found in the top left of the menu.</li>`,
		`</ul>`,
		`<h3>What does this menu do?</h3>`,
		`<p>This is a CSS manager/ide for Krunker.</p>`,
		`<h3>How do I add my CSS?</h3>`,
		`<p>1. Press the svg.web button found in the menu bar.</p>`,
		`<p>2. In the new window, input the link to your CSS then press OK.</p>`,
		// `<p>3. Reload by pressing the svg.reload button in the menu bar.</p>`,
		`<h3>How do I manually add CSS?</h3>`,
		`<p>1. Create a new file with the svg.add_file button found in the top right of the CSS manager.<p>`,
		`<p>2. In the text editor, input your CSS.<p>`,
		`<p>3. When you are finished, press the svg.save button to save changes.<p>`,
		// `<p>4. Reload by pressing the svg.reload button in the menu bar.</p>`,
		'<h3>How do I turn on/off my CSS?</h3>',
		`<p>Pressing the square icon in your CSS's tab will toggle the visibility. When the square is filled, the tab is enabled, when the square is empty, the tab is disabled.<p>`,
		'<h3>How do I rename my CSS?</h3>',
		`<p>Pressing the svg.rename icon in your CSS's tab will change the tab to renaming mode. Type in the new name then press enter to save changes.<p>`,
		'<h3>How do I remove my CSS?</h3>',
		`<p>Pressing the svg.close icon in your CSS's tab will remove your CSS.<p>`,
		`<p>For further help, search or post on the forum found by <a target="_blank" href="${meta.forum}">clicking here</a>.<p>`,
	].join(''),
});

menu.add_preset('Default', {
	binds: {
		toggle: 'KeyC',
		reset: null,
	},
	aim: {
		status: 'off',
		offset: 'random',
		target_sorting: 'dist2d',
		smooth: 0.2,
		hitchance: 100,
		// percentage of screen
		fov_box: false,
		fov: 60,
		wallbangs: false,
		auto_reload: false,
		force_auto: false,
	},
	color: {
		risk: '#FF7700',
		hostile: '#FF0000',
		friendly: '#00FF00',
	},
	esp: {
		wireframe: false,
		status: 'off',
		walls: 100,
		labels: false,
		tracers: false,
	},
	game: {
		auto_nuke: false,
		auto_lobby: false,
		auto_start: false,
		inactivity: true,
		custom_loading: true,
		inactivity: true,
		error_tips: true,
	},
	player: {
		bhop: 'off',
		skins: false,
	},
});

menu.add_preset('Assist', {
	aim: {
		status: 'assist',
		fov: 25,
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
		force_auto: true,
		auto_reload: true,
		wallbangs: true,
		offset: 'head',
	},
	player: {
		bhop: 'autoslide',
	},
});

module.exports = menu;