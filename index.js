'use strict';
var os = require('os'),
	fs = require('fs'),
	path = require('path'),
	https = require('https'),
	webpack = require('webpack'),
	dist = path.join(__dirname, 'dist'),
	hosts = [ 'krunker.io', '*.browserfps.com' ],
	targets = [ 'sploit', 'junker' ];

var create_script = basename => {
	var folder = path.join(__dirname, basename),
		meta = require(path.join(folder, 'meta.js'));
	
	var compiler = webpack({
		entry: folder,
		output: {
			path: dist,
			filename: basename + '.user.js',
		},
		context: folder,
		module: { rules: [
			{ test: /\.css$/, use: [ { loader: path.join(__dirname, 'loaders', 'css.js') } ] },
			{ test: /\.json$/, use: [ { loader: path.join(__dirname, 'loaders', 'json.js') } ], type: 'javascript/auto' },
		] },
		mode: 'development', // minimize ? 'production' : 'development',
		devtool: false,
		plugins: [
			{ apply: compiler => compiler.hooks.thisCompilation.tap('Replace', compilation => compilation.hooks.processAssets.tap({ name: 'Replace', stage: webpack.Compilation.PROCESS_ASSETS_STAGE_REPORT }, () => {
				var file = compilation.getAsset(compiler.options.output.filename),
					extracted = new Date(),
					rmeta = {
						...meta,
						source: 'https://github.com/y9x/webpack/',
						supportURL: 'https://y9x.github.io/discord/',
						extracted: extracted.toGMTString(),
						match: hosts.map(host => '*://' + host + '/*'),
						'run-at': 'document-start',
						// use gm_xmlhttprequest again?
						// connect: [ 'sys32.dev', 'githubusercontent.com' ],
						noframes: '',
					};
				
				var whitespace = 0;
				
				for(let key in rmeta)if(key.length > whitespace)whitespace = key.length;
				
				var headers = '// ==UserScript==\n';
				
				for(let key in rmeta)for(let value of [].concat(rmeta[key]))headers += '// @' + key.padEnd(value ? whitespace + 4 : 0, ' ') + value + '\n';
				
				headers += '// ==/UserScript==\n';
				
				var source = file.source.source().replace(/Date\.now\('build_extracted'\)/g, extracted.getTime());
				
				compilation.updateAsset(file.name, new webpack.sources.RawSource(`${headers}\n${source}`));
			})) },
		],
	}, (err, stats) => {
		if(err)return console.error(err);
		
		var callback = (err, stats) => {
			var error = !!(err || stats.compilation.errors.length);
			
			for(var ind = 0; ind < stats.compilation.errors.length; ind++)error = true, console.error(stats.compilation.errors[ind]);
			if(err)console.error(err);
			
			if(error)return console.error('Build of', basename, 'fail');
			else console.log('Build of', basename, 'success');
		};
		
		if(process.argv.includes('-once'))compiler.run(callback);
		else compiler.watch({}, callback);
	});
};

for(let target of targets)create_script(target);