'use strict';

var utils = require('./Utils'),
	Request = require('./Request'),
	Events = require('./Events'),
	console = require('./console');

class Loader extends Events {
	api = 0 ? 'http://127.0.0.1:7300/v3/' : 'https://api.sys32.dev/v3/';
	matchmaker = 'https://matchmaker.krunker.io/';
	badge = '[GameLoader]';
		// outcome of above maps
	vars = {};
	context = {
		key: '_' + Math.random().toString().substr(2),
	};
	has_instruct = this.has_instruct.bind(this);
	stacks = new Set();
	meta = utils.promise();
	patches = new Map();
	variables = new Map();
	log(...text){
		console.log(this.badge, ...text);
	}
	var(label, regex, index){
		return this.variables.set(label, [ regex, index ]), this;
	}
	patch(label, regex, replacement){
		return this.patches.set(label, [ regex, replacement ]), this;
	}
	observe(){
		this.loadp = new Promise(resolve => new MutationObserver((muts, observer) => muts.forEach(mut => [...mut.addedNodes].forEach(node => {
			if(node.tagName == 'DIV' && node.id == 'instructionHolder'){
				this.instruction_holder = node;
				
				new MutationObserver(() => setTimeout(() => this.emit('instruct', this.has_instruct), 200)).observe(this.instruction_holder, {
					attributes: true,
					attributeFilter: [ 'style' ],
				});
			}
			
			if(node.tagName == 'SCRIPT' && node.textContent.includes('Yendis Entertainment')){
				node.textContent = '';
				resolve();
			}
		}))).observe(document, { childList: true, subtree: true }));
	}
	has_instruct(...test){
		if(!this.instruction_holder)return false
		var instruction = this.instruction_holder.textContent.trim().toLowerCase();
		for(let string of test)if(instruction.includes(test))return true;
		return false;
	}
	async report_error(where, err){
		if(typeof err != 'object')return;
		
		var body = {
			name: err.name,
			message: err.message,
			stack: err.stack,
			where: where,
		};
		
		if(this.stacks.has(err.stack))return;
		
		console.error('Where:', where, '\nUncaught', err);
		
		this.stacks.add(err.stack);
		
		await Request({
			target: this.api,
			endpoint: 'error',
			data: body,
		});
	}
	async show_error(title, message){
		await this.load;
		
		var holder = await utils.wait_for(() => document.querySelector('#instructionHolder')),
			instructions = await utils.wait_for(() => document.querySelector('#instructions'));
		
		holder.style.display = 'block';
		holder.style.pointerEvents = 'all';
		
		for(let node of document.querySelectorAll('#loadingBg, #initLoader'))node.style.display = 'none';
	
		instructions.innerHTML = `<div style='color:#FFF9'>${title}</div><div style='margin-top:10px;font-size:20px;color:#FFF6'>${message}</div>`;
	}
	async token(){
		await this.meta;
		
		return await Request({
			target: this.api,
			endpoint: 'token',
			data: await Request({
				target: this.matchmaker,
				endpoint: 'generate-token',
				headers: {
					'client-key': this.meta.key,
				},
				result: 'json',
			}),
			result: 'json',
		});
	}
	apply_patches(source){
		var missing;
		
		for(var [ label, [ regex, index ] ] of this.variables){
			var value = (source.match(regex) || 0)[index];
			
			if(value)this.vars[label] = value;
			else (missing || (missing = {}))[label] = [ regex, index ];
		}
		
		console.log('Game Variables:');
		console.table(this.vars);
		
		if(missing){
			console.log('Missing:');
			console.table(missing);
		}
		
		for(var [ label, [ input, replacement ] ] of this.patches){
			if(!source.match(input))console.error('Could not patch', label);
			
			source = source.replace(input, replacement);
		}
		
		return source;
	}
	async license(input_meta){
		var meta;
		
		try{
			meta = await Request({
				target: this.api,
				endpoint: 'meta',
				data: {
					...input_meta,
					needs_key: true,
				},
				method: 'POST',
				result: 'json',
			});
		}catch(err){
			console.log(err);
			meta = {
				error: {
					title: err.message,
					message: `Post a screenshot of this error on <a href='https://forum.sys32.dev/'>the forums</a> or <a href='/'>click here</a> to try again.`,
				},
			};
		}
		
		if(meta.error){
			utils.add_ele('style', document.documentElement, {
				textContent: '#initLoader,#instructionsUpdate{display:none!IMPORTANT}',
			});
			
			this.show_error(meta.error.title, meta.error.message);
			this.meta.reject();
		}else this.meta.resolve(this.meta = meta);
	}
	async source(){
		await this.meta;
		
		return await Request({
			target: this.api,
			endpoint: 'source',
			query: {
				build: this.meta.build,
			},
			result: 'text',
			cache: true,
		});
	}
	async load(add_args = {}, add_context = {}, before_load = () => {}){
		var args = {
				...add_args,
				[this.context.key]: this.context,
				WP_fetchMMToken: this.token(),
			},
			source = this.apply_patches(await this.source());
		
		Object.assign(this.context, add_context);
		
		try{
			await this.loadp;
			before_load();
			new Function(...Object.keys(args), source)(...Object.values(args));
		}catch(err){
			this.report_error('loading', err);
			this.show_error(err.message, `Post a screenshot of this error on <a href='https://forum.sys32.dev/'>the forums</a> or <a href='/'>click here</a> to try again.`);
		}
	}
};

module.exports = Loader;