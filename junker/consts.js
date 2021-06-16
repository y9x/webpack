'use strict';

var Utils = require('../libs/utils'),
	API = require('../libs/api'),
	Updater = require('../libs/updater.js'),
	Main = require('./main'),
	utils = new Utils();

exports.meta = {
	script: 'https://y9x.github.io/userscripts/junker.user.js',
	github: 'https://github.com/e9x/kru/',
	discord: 'https://y9x.github.io/discord/',
	forum: 'https://forum.sys32.dev/',
};

exports.api_url = 'https://api.sys32.dev/';
exports.mm_url = 'https://matchmaker.krunker.io/';

exports.is_frame = window != window.top;
exports.extracted = typeof build_extracted != 'number' ? Date.now() : build_extracted;

exports.krunker = utils.is_host(location, 'krunker.io', 'browserfps.com') && location.pathname == '/';

var main = new Main(exports.meta),
	updater = new Updater(exports.meta.script, exports.extracted),
	api = new API(exports.mm_url, exports.api_url);

if(!exports.is_frame){
	if(exports.krunker){
		// alerts shown prior to the window load event are cancelled
		if(typeof DO_UPDATES != 'boolean' || DO_UPDATES == true)window.addEventListener('load', () => updater.watch(() => {
			if(confirm('A new Sploit version is available, do you wish to update?'))updater.update();
		}, 60e3 * 3));
		
		api.observe();
	}

	api.license(exports.meta, typeof LICENSE_KEY == 'string' && LICENSE_KEY);
}

exports.main = main
exports.utils = utils;
exports.api = api;
exports.updater = updater;