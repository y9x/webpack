'use strict';

var Utils = require('./Utils'),
	Request = require('./Request'),
	EventLite = require('event-lite'),
	utils = new Utils();

class GameLoader {
	gconsts = {
		playerHeight: 11,
		cameraHeight: 1.5,
		headScale: 2,
		armScale: 1.3,
		armInset: 0.1,
		chestWidth: 2.6,
		hitBoxPad: 1,
		crouchDst: 3,
		recoilMlt: 0.3,
		nameOffset: 0.6,
		nameOffsetHat: 0.8,
	};
	constructor(matchmaker_url, api_url){
		this.matchmaker = matchmaker_url,
		this.api = /*CHANGE*/0 ? 'http://localhost:7300/' : api_url,
		
		this.stacks = new Set();
		
		this.api_v2 = new URL('v2/', this.api);
		
		this.meta = utils.promise();
		
		this.patches = new Map();
		this.variables = new Map();
		
		// outcome of above maps
		this.vars = {};
		
		this.context = {
			key: '_' + Math.random().toString().substr(2),
		};
		
		this.badge = '[GameLoader]';
	}
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
				
				new MutationObserver(() => setTimeout(() => this.emit('instruct', this.has_instruct.bind(this)), 200)).observe(this.instruction_holder, {
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
			target: this.api_v2,
			endpoint: 'error',
			data: body,
		});
	}
	async show_error(title, message){
		await this.load;
		
		var holder = document.querySelector('#instructionHolder'),
			instructions = document.querySelector('#instructions');
		
		holder.style.display = 'block';
		holder.style.pointerEvents = 'all';
		
		instructions.innerHTML = `<div style='color:#FFF9'>${title}</div><div style='margin-top:10px;font-size:20px;color:#FFF6'>${message}</div>`;
	}
	async token(){
		await this.meta;
		
		return await Request({
			target: this.api_v2,
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
		var meta = await Request({
			target: this.api_v2,
			endpoint: 'meta',
			data: {
				...input_meta,
				needs_key: true,
			},
			result: 'json',
		});
		
		if(meta.error){
			this.show_error(meta.error.title, meta.error.message);
			this.meta.reject();
		}else this.meta.resolve(this.meta = meta);
	}
	async source(){
		await this.meta;
		
		return await Request({
			target: this.api_v2,
			endpoint: 'source',
			query: {
				build: this.meta.build,
			},
			result: 'text',
			cache: true,
		});
	}
	async load(add_args = {}, add_context = {}){
		var args = {
				...add_args,
				[this.context.key]: this.context,
				WP_fetchMMToken: this.token(),
			},
			source = this.apply_patches(await this.source());
		
		Object.assign(this.context, add_context);
		
		try{
			await this.loadp;
			new Function(...Object.keys(args), source)(...Object.values(args));
		}catch(err){
			this.report_error('loading', err);
			this.show_error(err.message, `Post a screenshot of this error on <a href='https://forum.sys32.dev/'>the forums</a> or <a href='/'>click here</a> to try again.`);
		}
	}
};

EventLite.mixin(GameLoader.prototype);

module.exports = GameLoader;