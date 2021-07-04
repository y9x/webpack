'use strict';

var fs = require('fs'),
	path = require('path'),
	parser = require('css-tree');

module.exports = function(source){
	source += '';
	
	return 'module.exports=' + JSON.stringify(parser.generate(parser.parse(source)));
};