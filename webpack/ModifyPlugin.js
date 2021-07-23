'use strict';

var webpack = require('webpack');

class ModifyPlugin {
	static ModifyPlugin = this;
	static errors(error, stats = { compilation: { errors: [] } }){
		var had = false;
		
		for(var ind = 0; ind < stats.compilation.errors.length; ind++)had = true, console.error(stats.compilation.errors[ind]);
		
		if(error){
			had = true;
			console.error(error);
		}
		
		return had;
	}
	stages = {
		raw: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
		process: webpack.Compilation.PROCESS_ASSETS_STAGE_PRE_DERIVED,
		optimize: webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE,
		devtools: webpack.Compilation.PROCESS_ASSETS_STAGE_DEV_TOOLING,
		result: webpack.Compilation.PROCESS_ASSETS_STAGE_REPORT,
	};
	stage = 'result';
	suffix = '';
	prefix = '';
	constructor({ stage, replace, file, suffix, prefix }){
		if(typeof file != 'string' && !(file instanceof RegExp))throw new Error(`File must be a String or RegExp, recieved ${typeof file}.`);
		
		this.file = file;
		
		if(typeof stage == 'string'){
			if(!this.stages.hasOwnProperty(stage))throw new TypeError(`Stage '${stage}' is invalid. Valid stages are:\n${Object.keys(this.stages).join(', ')}`);
			
			this.stage = stage;
		}
		
		if(typeof replace == 'object'){
			this.replace = replace[Symbol.iterator] ? replace : Object.entries(replace);
		}else this.replace = new Map();
		
		if(prefix)this.prefix = prefix;
		if(suffix)this.suffix = suffix;
	}
	apply(compiler){
		compiler.hooks.thisCompilation.tap('Replace', compilation => {
			compilation.hooks.processAssets.tap({
				name: 'Replace',
				stage: this.stages[this.stage],
			}, () => {
				for(let file of compilation.getAssets()){
					if(!file.name.match(this.file))continue;
					
					var source = file.source.source().replace(/^/, this.prefix).replace(/$/, this.suffix);
					
					if(this.replace){
						for(let [ find, replace ] of this.replace)source = source.replace(find, replace);
					}
					
					compilation.updateAsset(file.name, new webpack.sources.RawSource(source));
				}
			});
		});
	}
};

module.exports = ModifyPlugin;