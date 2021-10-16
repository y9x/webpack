'use strict';

var utils = require('../Utils');

utils.add_ele('style', () => document.documentElement, { textContent: require('./index.css') });