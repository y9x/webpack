'use strict';

var DataStore = require('../datastore'),
	Utils = require('../utils'),
	utils = new Utils();

exports.utils = utils;

exports.content = utils.add_ele('div', () => document.documentElement, { style: {
	top: 0,
	left: 0,
	'z-index': 9999999999,
	border: 'none',
	position: 'absolute',
	background: '#0000',
	width: '100vw',
	height: '100vh',
} });

exports.frame = exports.content.attachShadow({ mode: 'open' });

exports.store = new DataStore();