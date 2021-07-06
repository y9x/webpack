'use strict';

var DataStore = require('./DataStore'),
	GameLoader = require('./GameLoader');

exports.store = new DataStore();

exports.meta = {
	github: 'https://github.com/y9x/',
	discord: 'https://y9x.github.io/discord/',
	forum: 'https://forum.sys32.dev/',
};

exports.api_url = 'https://api.sys32.dev/';
exports.mm_url = 'https://matchmaker.krunker.io/';

var loader = new GameLoader(exports.mm_url, exports.api_url);

exports.loader = loader;

var KUtils = require('./KUtils'),
	utils = new KUtils();

exports.is_frame = window != window.top;

// .htaccess for ui testing
exports.krunker = utils.is_host(location, 'krunker.io', 'browserfps.com') && ['/.htaccess', '/'].includes(location.pathname);

exports.proxy_addons = [
	{
		name: 'Browser VPN',
		chrome: 'https://chrome.google.com/webstore/detail/ppajinakbfocjfnijggfndbdmjggcmde',
		firefox: 'https://addons.mozilla.org/en-US/firefox/addon/mybrowser-vpn/',
	},
	{
		name: 'Hola VPN',
		chrome: 'https://chrome.google.com/webstore/detail/gkojfkhlekighikafcpjkiklfbnlmeio',
		firefox: 'https://addons.mozilla.org/en-US/firefox/addon/hola-unblocker/',
	},
	{
		name: 'Windscribe',
		chrome: 'https://chrome.google.com/webstore/detail/hnmpcagpplmpfojmgmnngilcnanddlhb',
		firefox: 'https://addons.mozilla.org/en-US/firefox/addon/windscribe/?utm_source=addons.mozilla.org&utm_medium=referral&utm_content=search',
	},
	{
		name: 'UltraSurf',
		chrome: 'https://chrome.google.com/webstore/detail/mjnbclmflcpookeapghfhapeffmpodij',
	},
];

exports.firefox = navigator.userAgent.includes('Firefox');

exports.supported_store = exports.firefox ? 'firefox' : 'chrome';

exports.addon_url = query => exports.firefox ? 'https://addons.mozilla.org/en-US/firefox/search/?q=' + encodeURIComponent(query) : 'https://chrome.google.com/webstore/search/' + encodeURI(query);

require('./vars');

if(exports.krunker && !exports.is_frame){
	loader.observe();
	
	loader.license(exports.meta);
}

exports.utils = utils;

// old loader compatibility
// 
if(!navigator.userAgent.includes('Electron') && typeof LOADER != 'object' && document.currentScript && document.currentScript.nodeName == 'SCRIPT'){
	alert('The new loader will update/install.');
	throw setTimeout(() => location.assign('https://y9x.github.io/userscripts/loader.user.js'), 200);
}