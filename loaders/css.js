'use strict';

var fs = require('fs'),
	path = require('path'),
	parser = require('css-tree');

module.exports = source => {
	var tree = parser.parse(source + ''),
		read_string = str => {
			if(["'", '"'].includes(str[0])){
				let quote = str[0];
				
				str = [...str.slice(1, -1)].map((char, ind, arr) => char == '\\' && arr[ind + 1] == quote ? null : char).filter(val => val != null).join('');
			}
			
			return str;
		};
	
	parser.walk(tree, node => {
		if(node.type != 'Url' || node.value.type != 'String')return;
		
		var read = read_string(node.value.value);
		
		if(read.startsWith('assets:'))node.value.value = JSON.stringify('data:application/octet-stream;base64,' + fs.readFileSync(path.join(__dirname, '..', 'libs', read.substr(7)), 'base64'));
	});
	
	return 'module.exports=' + JSON.stringify(parser.generate(tree));
};