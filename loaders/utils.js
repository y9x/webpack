'use strict';

var webpack = require('webpack');

class ModifyPlugin {
	constructor({ file, replace = {}, prefix = '' }){
		this.replace = replace;
		this.prefix = prefix;
		this.file = file;
	}
	to_regex(string, flags){
		return new RegExp(string.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), flags);
	}
	apply(compiler){
		compiler.hooks.thisCompilation.tap('Replace', compilation => {
			compilation.hooks.processAssets.tap({
				name: 'Replace',
				stage: webpack.Compilation.PROCESS_ASSETS_STAGE_REPORT,
			}, () => {
				var asset = compilation.getAsset(this.file),
					source = this.prefix + asset.source.source();
				
				for(let data in this.replace)source = source.replace(this.to_regex(data, 'g'), this.replace[data]);
				
				compilation.updateAsset(asset.name, new webpack.sources.RawSource(source));
			});
		});
	}
}

exports.errors = (err, stats = { compilation: { errors: [] } }) => {
	var error = !!(err || stats.compilation.errors.length);
	
	for(var ind = 0; ind < stats.compilation.errors.length; ind++)error = true, console.error(stats.compilation.errors[ind]);
	
	if(err)console.error(err);
	
	return error;
};

exports.ModifyPlugin = ModifyPlugin;