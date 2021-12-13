'use strict';

var is_obj = data => typeof data == 'object' && data != null,
	is_url = data => typeof data == 'string' || data instanceof Location || data instanceof URL,
	headers_obj = headers => {
		if(!is_obj(headers))return {};
		else if(headers instanceof Headers){
			let out = {};
			
			for(let [ key, value ] of headers)out[key] = value;
			
			return out;
		}else return headers;
	};

/*var ofetch = window.fetch;
window.fetch = (url, opts) => {
	if((url + '').endsWith('/meta'))return Promise.reject(new Error('test'));
	else return ofetch(url, opts);
};*/

var request = input => {
	if(!is_obj(input))throw new TypeError('Input must be an object');
	
	var opts = {
			cache: 'no-cache',
			headers: headers_obj(input.headers),
		},
		url = request.resolve(input);
	
	switch(input.cache){
		case true:
			opts.cache = 'force-cache';
			break;
		case'query':	
			url.search += '?' + Date.now();
			break;
	}
	if(input.cache == true)opts.cache = 'force-cache';
	
	if(is_obj(input.data)){
		opts.method = 'POST';
		opts.body = JSON.stringify(input.data);
		opts.headers['content-type'] = 'application/json';
	}
	
	if(typeof input.method == 'string')opts.method = input.method;
	
	if(input.sync){
		opts.xhr = true;
		opts.synchronous = true;
	}
	
	var result = ['text', 'json', 'arrayBuffer'].includes(input.result) ? input.result : 'text';
	
	return (opts.xhr ? request.fetch_xhr : window.fetch.bind(window))(url, opts).then(res => res[result]());
};

// request.fetch = window.fetch.bind(window);

request.fetch_xhr = (url, opts = {}) => {
	if(!is_url(url))throw new TypeError('url param is not resolvable');
	
	var url = new URL(url, location).href,
		method = typeof opts.method == 'string' ? opts.method : 'GET';
	
	// if(opts.cache == 'no-cache')url += '?' + Date.now();
	
	var req = new XMLHttpRequest();
	
	req.open(method, url, !opts.synchronous);
	
	return new Promise((resolve, reject) => {
		req.addEventListener('load', () => resolve({
			async text(){
				return req.responseText;
			},
			async json(){
				return JSON.parse(req.responseText);
			},
			headers: new Headers(),
		}));
		
		req.addEventListener('error', event => reject(event.error));
		
		req.send(opts.body);
	});
};

request.resolve = input => {
	if(!is_url(input.target))throw new TypeError('Target must be specified');
	
	var url = new URL(input.target);
	
	if(is_url(input.endpoint))url = new URL(input.endpoint, url);
	
	if(typeof input.query == 'object' && input.query != null)url.search = '?' + new URLSearchParams(Object.entries(input.query));
	
	return url;
};

module.exports = request;