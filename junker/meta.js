'use strict';

module.exports = {
	name: 'Krunker Junker',
	author: 'The Gaming Gurus',
	description: 'Junk in Your Krunk Guaranteed',
	version: '1.1',
	license: 'gpl-3.0',
	namespace: 'https://greasyfork.org/users/704479',
	icon: 'https://y9x.github.io/webpack/junker/junker.png',
	// GM_getValue is sync, loader needs to run instantly
	grant: [ 'GM.setValue', 'GM_getValue' ],
	match: [ 'https://krunker.io/*', 'https://*.browserfps.com/*' ],
};