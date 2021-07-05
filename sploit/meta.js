'use strict';

module.exports = {
	name: 'Sploit',
	author: 'The Gaming Gurus',
	description: 'Powerful Krunker mod',
	version: '1.6.5',
	license: 'gpl-3.0',
	namespace: 'https://e9x.github.io/',
	icon: 'https://y9x.github.io/webpack/libs/gg.gif?',
	// GM_getValue is sync, loader needs to run instantly
	grant: [ 'GM.setValue', 'GM_getValue' ],
	match: [ 'https://krunker.io/*', 'https://*.browserfps.com/*' ],
};