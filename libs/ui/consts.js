'use strict';

var DataStore = require('../datastore'),
	Utils = require('../utils'),
	utils = new Utils();

exports.utils = utils;
exports.keybinds = [];
exports.panels = [];
exports.frame = utils.crt_ele('iframe', { style: utils.css({
	top: 0,
	left: 0,
	'z-index': 9999999999,
	border: 'none',
	position: 'absolute',
	background: '#0000',
	width: '100vw',
	height: '100vh',
}) });

exports.global_listen = (event, callback, options) => {
	window.addEventListener(event, callback, options);
	exports.frame.contentWindow.addEventListener(event, callback, options);
};


exports.store = new DataStore();
