'use strict';

var DataStore = require('../DataStore'),
	Utils = require('../Utils'),
	utils = new Utils();

exports.utils = utils;

exports.store = new DataStore();