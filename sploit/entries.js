'use strict';

var { api, utils, meta } = require('../libs/consts.js'),
	UI = require('../libs/ui'),
	meta = require('./meta'),
	config = new UI.Config({
		version: meta.version,
		title: 'Sploit',
	});

config.add_section({
	name: 'Main',
	type: 'control',
	default: true,
	value: [{
		name: 'Aimbot Type',
		type: 'rotate',
		walk: 'aim.status',
		vals: [
			[ 'off', 'Off' ],
			[ 'trigger', 'Triggerbot' ],
			[ 'correction', 'Correction' ],
			[ 'assist', 'Assist' ],
			[ 'auto', 'Automatic' ],
		],
		key: 'binds.aim',
	},{
		name: 'Auto Bhop',
		type: 'rotate',
		walk: 'game.bhop',
		key: 'binds.bhop',
		vals: [
			[ 'off', 'Off' ],
			[ 'keyjump', 'Key jump' ],
			[ 'keyslide', 'Key slide' ],
			[ 'autoslide', 'Auto slide' ],
			[ 'autojump', 'Auto jump' ],
		],
	},{
		name: 'ESP Mode',
		type: 'rotate',
		walk: 'esp.status',
		key: 'binds.esp',
		vals: [
			[ 'off', 'Off' ],
			[ 'box', 'Box' ],
			[ 'chams', 'Chams' ],
			[ 'box_chams', 'Box & chams' ],
			[ 'full', 'Full' ],
		],
	},{
		name: 'Tracers',
		type: 'boolean',
		walk: 'esp.tracers',
		key: 'binds.tracers',
	},{
		name: 'Nametags',
		type: 'boolean',
		walk: 'esp.nametags',
		key: 'binds.nametags',
	},{
		name: 'Overlay',
		type: 'boolean',
		walk: 'game.overlay',
		key: 'binds.overlay',
	}],
});

config.add_section({
	name: 'Game',
	type: 'control',
	value: [{
		name: 'Custom CSS',
		type: 'function',
		value: () => config.css_editor.show(),
	},{
		name: 'Custom Loading Screen',
		type: 'boolean',
		walk: 'game.custom_loading',
	},{
		name: 'Unlock Skins',
		type: 'boolean',
		walk: 'game.skins',
	},{
		name: 'Wireframe',
		type: 'boolean',
		walk: 'game.wireframe',
	},{
		name: 'Auto respawn',
		type: 'boolean',
		walk: 'game.auto_respawn',
	},{
		name: 'Remove inactivity',
		type: 'boolean',
		walk: 'game.inactivity',
	}],
});

config.add_section({
	name: 'Aim',
	type: 'control',
	value: [{
		name: 'Smoothness',
		type: 'slider',
		walk: 'aim.smooth',
		unit: 'U',
		range: [ 0, 50, 2 ],
		labels: { 0: 'Off' },
	},{
		name: 'Target FOV',
		type: 'slider',
		walk: 'aim.fov',
		range: [ 10, 110, 10 ],
		labels: { 110: 'Ignore FOV' },
	},{
		name: 'Hitchance',
		type: 'slider',
		walk: 'aim.hitchance',
		range: [ 10, 100, 5 ],
	},{
		name: 'Target sort',
		type: 'rotate',
		walk: 'aim.target_sorting',
		vals: [
			[ 'dist2d', 'Distance 2D' ],
			[ 'dist3d', 'Distance 3D' ],
			[ 'hp', 'Health' ],
		],
	},{
		name: 'Offset',
		type: 'rotate',
		walk: 'aim.offset',
		vals: [
			[ 'head', 'Head' ],
			[ 'torso', 'Torso' ],
			[ 'legs', 'Legs' ],
			[ 'random', 'Random' ],
		],
	},{
		name: 'Draw FOV box',
		type: 'boolean',
		walk: 'aim.fov_box',
	},{
		name: 'Auto reload',
		type: 'boolean',
		walk: 'aim.auto_reload',
	},{
		name: 'Wallbangs',
		type: 'boolean',
		walk: 'aim.wallbangs',
	}],
});

config.add_section({
	name: 'Esp',
	type: 'control',
	value: [{
		name: 'Wall opacity',
		type: 'slider',
		walk: 'esp.walls',
		range: [ 0, 100, 5 ],
	},{
		name: 'Labels',
		type: 'boolean',
		walk: 'esp.labels',
	}]
});

config.add_section({
	name: 'Binds',
	type: 'control',
	value: [{
		name: 'Toggle',
		type: 'keybind',
		walk: 'binds.toggle',
	},{
		name: 'Auto aim',
		type: 'keybind',
		walk: 'binds.aim',
	},{
		name: 'Auto bhop',
		type: 'keybind',
		walk: 'binds.bhop',
	},{
		name: 'ESP mode',
		type: 'keybind',
		walk: 'binds.esp',
	},{
		name: 'Tracers',
		type: 'keybind',
		walk: 'binds.tracers',
	},{
		name: 'Nametags',
		type: 'keybind',
		walk: 'binds.nametags',
	},{
		name: 'Overlay',
		type: 'keybind',
		walk: 'binds.overlay',
	},
	{
		name: 'Reset',
		type: 'keybind',
		walk: 'binds.reset',
	}],
});

config.add_section({
	name: 'Settings',
	type: 'control',
	value: [{
		name: 'GitHub',
		type: 'link',
		value: meta.github,
	},{
		name: 'Discord',
		type: 'link',
		value: meta.discord,
	},{
		name: 'Forum',
		type: 'link',
		value: meta.forum,
	},{
		name: 'Save Krunker script',
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
	},{
		name: 'Reset Settings',
		type: 'function',
		async value(){
			config.reset_config();
		},
		bind: 'binds.reset',
	}],
});

config.default_config = {
	binds: {
		reverse_cam: 'KeyF',
		toggle: 'KeyC',
		aim: 'Digit3',
		bhop: 'Digit4',
		esp: 'Digit5',
		tracers: 'Digit6',
		nametags: 'Digit7',
		overlay: 'Digit8',
	},
	aim: {
		status: 'off',
		offset: 'random',
		target_sorting: 'dist2d',
		smooth: 15,
		hitchance: 100,
		// percentage of screen
		fov_box: false,
		fov: 60,
	},
	esp: {
		status: 'off',
		walls: 100,
		labels: false,
		tracers: false,
	},
	game: {
		bhop: 'off',
		wireframe: false,
		auto_respawn: false,
		adblock: true,
		custom_loading: true,
		inactivity: true,
	},
};

config.css_editor = new UI.Editor({
	help: [
		`<h3>Glossary:</h3><ul>`,
			`<li>Menu bar - set of buttons found in the top left of the panel.</li>`,
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


module.exports = config;