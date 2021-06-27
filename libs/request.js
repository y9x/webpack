'use strict';

var promise = () => {
	var res, rej,
		promise = new Promise((resolve, reject) => {
			res = resolve;
			rej = reject;
		});
	
	promise.resolve = res;
	promise.reject = rej;
	
	promise.resolve_in = (time = 0, data) => setTimeout(() => promise.resolve(data), time);
	
	return promise;
};

var is_obj = data => typeof data == 'object' && data != null;

var is_url = data => typeof data == 'string' || data instanceof Location || data instanceof URL;

var headers_obj = headers => {
	if(!is_obj(headers))return {};
	else if(headers instanceof Headers){
		let out = {};
		
		for(let [ key, value ] of headers)out[key] = value;
		
		return out;
	}else return headers;
};

class GMResponse {
	constructor(){
		this.headers = new Headers();
	}
	static request_xhr(opts){
		var req = new XMLHttpRequest();
		
		req.open(opts.method, opts.url, !opts.synchronous);
		
		for(let prop in opts.headers)req.setRequestHeader(prop, opts.headers[prop]);
		
		req.send(opts.data);
		
		return req;
	}
	static gen_opts(url, req){
		if(!is_obj(req))req = {};
		
		var opts = {
			headers: headers_obj(req.headers),
			url: new URL(url, location).href,
			method: typeof req.method == 'string' ? req.method : 'GET',
		};
		
		if(typeof req.cache == 'string' && req.cache != 'default')opts.headers.pragma = opts.headers['cache-control'] = req.cache;
		
		if(req.body)opts.data = req.body;
		
		return opts;
	}
	run(opts){
		this.text_promise = promise();
		
		return new Promise((resolve, reject) => {
			opts.onreadystatechange = res => {
				switch(res.readyState){
					case res.DONE:
						
						this.text_promise.resolve(res.responseText);
						
						break;
					case res.HEADERS_RECEIVED:
					
						resolve(this.parse_headers(res.responseHeaders));
						
						break;
					}
			};
			
			opts.onerror = res => reject('Unknown error');
			
			GM.xmlHttpRequest(opts);
		});
	}
	async text(){
		return await this.text_promise;
	}
	async json(){
		return JSON.parse(await this.text());
	}
	async arrayBuffer(){
		return new TextEncoder().encode(await this.text()).buffer;
	}
	parse_headers(data){
		for(let line of data.split('\r\n')){
			if(!line)continue;
			
			let split = line.split(':');
			
			this.headers.append(split.splice(0, 1)[0], split.join(':').replace(/^\s+/, ''));
		}
		
		return this;
	}
};

class ResponseSync extends GMResponse {
	constructor(res){
		super();
		this.res = res;
		this.parse_headers(this.res.responseHeaders);
	}
	json(){
		return JSON.parse(this.text());
	}
	arrayBuffer(){
		return new TextEncoder().encode(this.text()).buffer;
	}
	text(){
		return this.res.responseText;
	}
};

var request = input => {
	if(!is_obj(input))throw new TypeError('Input must be an object');
	
	var opts = {
		cache: input.cache ? 'default' : 'no-cache',
		headers: headers_obj(input.headers),
	};
	
	if(is_obj(input.data)){
		opts.method = 'POST';
		opts.body = JSON.stringify(input.data);
		opts.headers['content-type'] = 'application/json';
	}
	
	var result = ['text', 'json', 'arrayBuffer'].includes(input.result) ? input.result : 'text',
		url = request.resolve(input);
	
	if(input.sync){
		let genned = GMResponse.gen_opts(url, opts);
		
		genned.synchronous = true;
		
		delete genned.headers;
		
		let req = GMResponse.request_xhr(genned);
		
		return new ResponseSync(req)[result]();
	}else{
		return request.fetch(url, opts).then(res => res[result]());
	}
};

request.is_gm = typeof GM == 'object' && typeof GM.xmlHttpRequest == 'function';

request.resolve = input => {
	if(!is_url(input.target))throw new TypeError('Target must be specified');
	
	var url = new URL(input.target);
	
	if(is_url(input.endpoint))url = new URL(input.endpoint, url);
	
	if(typeof input.query == 'object' && input.query != null)url.search = '?' + new URLSearchParams(Object.entries(input.query));
	
	return url;
};

request.fetch = exports.is_gm ? (async (url, req) => {
	return new GMResponse().run(GMResponse.gen_opts(url, req));
}) : window.fetch.bind(window);

module.exports = request;