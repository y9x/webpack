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

var request = input => {
	if(!is_obj(input))throw new TypeError('Input must be an object');
	
	var opts = {
		cache: input.cache ? 'force-cache' : 'no-cache',
		headers: headers_obj(input.headers),
	};
	
	if(is_obj(input.data)){
		opts.method = 'POST';
		opts.body = JSON.stringify(input.data);
		opts.headers['content-type'] = 'application/json';
	}
	
	if(typeof input.method == 'string')opts.method = input.method;
	
	var result = ['text', 'json', 'arrayBuffer'].includes(input.result) ? input.result : 'text',
		url = request.resolve(input);
	
	return request.fetch(url, opts).then(res => res[result]());
};

request.fetch = window.fetch.bind(window);

request.resolve = input => {
	if(!is_url(input.target))throw new TypeError('Target must be specified');
	
	var url = new URL(input.target);
	
	if(is_url(input.endpoint))url = new URL(input.endpoint, url);
	
	if(typeof input.query == 'object' && input.query != null)url.search = '?' + new URLSearchParams(Object.entries(input.query));
	
	return url;
};

module.exports = request;