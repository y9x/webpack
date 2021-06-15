'use strict';

var { krunker, extracted } = require('../libs/consts'),
	Updater = require('../libs/updater'),
	updater = new Updater('https://y9x.github.io/userscripts/junker.user.js', extracted);

if(krunker){
	if(typeof DO_UPDATES != 'boolean' || DO_UPDATES == true)window.addEventListener('load', () => updater.watch(() => {
		if(confirm('A new Junker version is available, do you wish to update?'))updater.update();
	}, 60e3 * 3));
	
	require('./main');
}