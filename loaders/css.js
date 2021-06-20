'use strict';

var fs = require('fs'),
	path = require('path'),
	parser = require('css-tree'),
	sass = require('sass');

module.exports = function(source){
	source += '';
	
	if(path.extname(this.resource) != '.css')source = sass.renderSync({ file: this.resource, data: source }).css + '';
	
	return 'module.exports=' + JSON.stringify(parser.generate(parser.parse(source)));
};