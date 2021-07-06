'use strict';

var Utils = require('../utils'),
	utils = new Utils();

exports.utils = utils;

exports.tick = node => node.addEventListener('mouseenter', () => {
	try{
		playTick();
	}catch(err){}
});

exports.select = node => node.addEventListener('click', () => {
	try{
		SOUND.play('select_0', 0.1);
	}catch(err){}
});