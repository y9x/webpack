'use strict';

var production = true;

var os = require('os'),
	fs = require('fs'),
	path = require('path'),
	https = require('https'),
	webpack = require('webpack'),
	TerserPlugin = require('terser-webpack-plugin'),
	serve = path.join(__dirname, 'dist', 'serve'),
	dist = path.join(__dirname, 'dist'),
	hosts = [ 'krunker.io', '*.browserfps.com' ],
	targets = {
		sploit: 'https://y9x.github.io/userscripts/serve/sploit.user.js',
		junker: 'https://y9x.github.io/userscripts/serve/junker.user.js',
	},
	metaaddon = {
		connect: [ 'sys32.dev', 'github.io', 'krunker.io' ],
		// GM_getValue is sync, loader needs to run instantly
		grant: [ 'GM.setValue', 'GM_getValue', 'GM.xmlHttpRequest' ],
		source: 'https://github.com/y9x/webpack/',
		supportURL: 'https://y9x.github.io/discord/',
		match: hosts.map(host => '*://' + host + '/*'),
		'run-at': 'document-start',
		noframes: '',
	},
	terser = {
		optimization: {
			minimize: true,
			minimizer: [ new TerserPlugin({
				terserOptions: {
					mangle: {
						eval: true, 
					},
				},
			}) ],
			concatenateModules: true,
		},
	},
	TMHeaders = require('./libs/tmheaders');

var create_script = (basename, url) => {
	var folder = path.join(__dirname, basename),
		meta = require(path.join(folder, 'meta.js'));
	
	var get_errs = (err, stats = { compilation: { errors: [] } }) => {
		var error = !!(err || stats.compilation.errors.length);
		
		for(var ind = 0; ind < stats.compilation.errors.length; ind++)error = true, console.error(stats.compilation.errors[ind]);
		
		if(err)console.error(err);
		
		return error;
	};
	
	var loader_compiler = webpack({
		entry: path.join(__dirname, 'loader.js'),
		output: { path: dist, filename: basename + '.user.js' },
		context: folder,
		module: { rules: [
			{ test: /\.css$/, use: [ { loader: path.join(__dirname, 'loaders', 'css.js') } ] },
			{ test: /\.json$/, use: [ { loader: path.join(__dirname, 'loaders', 'json.js') } ], type: 'javascript/auto' },
		] },
		devtool: false,
		mode: production ? 'production' : 'development',
		plugins: [
			{ apply: compiler => compiler.hooks.thisCompilation.tap('Replace', compilation => compilation.hooks.processAssets.tap({ name: 'Replace', stage: webpack.Compilation.PROCESS_ASSETS_STAGE_REPORT }, () => {
				var file = compilation.getAsset(compiler.options.output.filename),
					headers = new TMHeaders({
						...meta,
						extracted: new Date().toGMTString(),
						...metaaddon,
					}),
					source = file.source.source().replace(/SCRIPT_URL/g, JSON.stringify(url));
				
				compilation.updateAsset(file.name, new webpack.sources.RawSource(`${headers}\n${source}`));
			})) },
		],
		...terser,
	}, (err, stats) => {
		if(get_errs(err, stats))return console.error('Creating loader compiler', basename, 'fail');
		
		var callback = (err, stats) => {
			if(get_errs(err, stats))return console.error('Build of loader', basename, 'fail');
			else console.log('Build of loader', basename, 'success');
		};
		
		if(process.argv.includes('-once'))loader_compiler.run(callback);
		else loader_compiler.watch({}, callback);
	});
	
	var compiler = webpack({
		entry: folder,
		output: { path: serve, filename: basename + '.user.js' },
		context: folder,
		module: { rules: [
			{ test: /\.css$/, use: [ { loader: path.join(__dirname, 'loaders', 'css.js') } ] },
			{ test: /\.json$/, use: [ { loader: path.join(__dirname, 'loaders', 'json.js') } ], type: 'javascript/auto' },
		] },
		devtool: false,
		mode: production ? 'production' : 'development',
		plugins: [
			{ apply: compiler => compiler.hooks.thisCompilation.tap('Replace', compilation => compilation.hooks.processAssets.tap({ name: 'Replace', stage: webpack.Compilation.PROCESS_ASSETS_STAGE_REPORT }, () => {
				var file = compilation.getAsset(compiler.options.output.filename),
					extracted = new Date(),
					headers = new TMHeaders({
						...meta,
						description: 'This script is served by the auto updater, do not use it outside of development.',
						extracted: extracted.toGMTString(),
						...metaaddon,
					}),
					source = file.source.source().replace(/Date\.now\('build_extracted'\)/g, extracted.getTime());
				
				compilation.updateAsset(file.name, new webpack.sources.RawSource(`${headers}\n${source}`));
			})) },
		],
		...terser,
	}, (err, stats) => {
		if(get_errs(err, stats))return console.error('Creating compiler', basename, 'fail');
		
		var callback = (err, stats) => {
			if(get_errs(err, stats))return console.error('Build of', basename, 'fail');
			else console.log('Build of', basename, 'success');
		};
		
		if(process.argv.includes('-once'))compiler.run(callback);
		else compiler.watch({}, callback);
	});
};

for(let target in targets)create_script(target, targets[target]);