'use strict';

var DataStore = require('../datastore'),
	Utils = require('../utils'),
	utils = new Utils();

exports.utils = utils;

exports.store = new DataStore();

exports.tick = node => node.addEventListener('mouseenter', () => {
	try{
		playTick();
	}catch(err){}
});