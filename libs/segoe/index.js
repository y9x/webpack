'use strict';

var Utils = require('../Utils'),
	utils = new Utils();

utils.add_ele('style', () => document.documentElement, { textContent: require('./index.css') });