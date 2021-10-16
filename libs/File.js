'use strict';

var utils = require('./Utils');

class File {
	utf8_dec = new TextDecoder('utf8');
	constructor(data){
		this.data = data;
		this.name = data.name || '';
		this.size = data.size || 0;
	}
	read(result){
		var reader = new FileReader();
		
		return new Promise((resolve, reject) => {
			reader.addEventListener('load', () => {
				switch(result){
					case'text':
					default:
						
						resolve(this.utf8_dec.decode(reader.result));
						
						break;
					case'buffer':
						
						resolve(reader.result);
						
						break;
				}
			}, { once: true });
			
			reader.readAsArrayBuffer(this.data);
		});
	}
	static pick(options = {}){
		var picker = utils.add_ele('input', document.documentElement, {
			type: 'file',
			style: { display: 'none' },
		});
		
		if(Array.isArray(options.accept))picker.setAttribute('accept', options.accept.join(', '));
		if(options.multipe)picker.setAttribute('multiple', '');
		
		return new Promise((resolve, reject) => {
			picker.addEventListener('change', () => {
				var files = [];
				
				for(let file of picker.files)files.push(new File(file));
				
				resolve(options.multiple ? files : files[0]);
			}, { once: true });
			
			picker.click();
		});
	}
	static save(options = {}){
		var link = utils.add_ele('a', document.documentElement, {
			href: URL.createObjectURL(new Blob([ options.data ])),
			download: options.name || '',
			type: 'file',
		});
		
		link.click();
		
		link.remove();
	}
};

module.exports = File;