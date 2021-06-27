'use strict';

var production = true;

var path = require('path'),
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
	wp_mode = production ? 'production' : 'development',
	{ errors, ModifyPlugin } = require('./loaders/utils'),
	terser = {
		optimization: {
			minimize: production,
			minimizer: [ new TerserPlugin({
				terserOptions: {
					mangle: {
						eval: true, 
					},
					format: {
						quote_style: 1,
					},
				},
			}) ],
		},
	},
	TMHeaders = require('./libs/tmheaders');

var create_script = (basename, url) => {
	var folder = path.join(__dirname, basename),
		meta = require(path.join(folder, 'meta.js'));
	
	var loader_compiler = webpack({
		entry: path.join(__dirname, 'loader.js'),
		output: { path: dist, filename: basename + '.user.js' },
		context: folder,
		module: { rules: [
			{ test: /\.css$/, use: [ { loader: path.join(__dirname, 'loaders', 'css.js') } ] },
			{ test: /\.json$/, use: [ { loader: path.join(__dirname, 'loaders', 'json.js') } ], type: 'javascript/auto' },
		] },
		devtool: false,
		mode: wp_mode,
		plugins: [
			new ModifyPlugin({
				file: basename + '.user.js',
				get prefix(){
					return new TMHeaders({
						...meta,
						extracted: new Date().toGMTString(),
						...metaaddon,
					}) + '\n\n';
				},
				replace: {
					SCRIPT_URL: JSON.stringify(url),
				},
			}),
		],
		...terser,
	}, (err, stats) => {
		if(errors(err, stats))return console.error('Creating loader compiler', basename, 'fail');
		
		var callback = (err, stats) => {
			if(errors(err, stats))return console.error('Build of loader', basename, 'fail');
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
		mode: wp_mode,
		plugins: [
			new ModifyPlugin({
				file: basename + '.user.js',
				get prefix(){
					return new TMHeaders({
						...meta,
					description: 'This script is served by the auto updater, do not use it outside of development.',
					extracted: new Date().toGMTString(),
					...metaaddon,
					}) + '\n\n';
				},
			}),
		],
		...terser,
	}, (err, stats) => {
		if(errors(err, stats))return console.error('Creating compiler', basename, 'fail');
		
		var callback = (err, stats) => {
			if(errors(err, stats))return console.error('Build of', basename, 'fail');
			else console.log('Build of', basename, 'success');
		};
		
		if(process.argv.includes('-once'))compiler.run(callback);
		else compiler.watch({}, callback);
	});
};

for(let target in targets)create_script(target, targets[target]);