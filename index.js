'use strict';

var production = true;

var SCRIPTS_URL = 'https://y9x.github.io/userscripts/serve.json';

var path = require('path'),
	webpack = require('webpack'),
	TerserPlugin = require('terser-webpack-plugin'),
	dist = path.join(__dirname, 'dist'),
	serve = path.join(dist, 'serve'),
	wp_mode = production ? 'production' : 'development',
	{ ModifyPlugin, errors } = require('./webpack/ModifyPlugin'),
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
	TMHeaders = require('./libs/TMHeaders');

var create_script = (basename, served) => {
	var folder = path.join(__dirname, basename),
		meta = require(path.join(folder, 'meta.js'));
	
	var compiler = webpack({
		entry: folder,
		output: { path: served ? serve : dist, filename: basename + '.user.js' },
		context: folder,
		module: { rules: [
			{ test: /\.css$/, use: [ { loader: path.join(__dirname, 'webpack', 'css.js') } ] },
			{ test: /\.json$/, use: [ { loader: path.join(__dirname, 'webpack', 'json.js') } ], type: 'javascript/auto' },
		] },
		devtool: false,
		mode: wp_mode,
		plugins: [
			new ModifyPlugin({
				file: basename + '.user.js',
				stage: 'result',
				prefix(){
					var addon = served ? {
						description: 'This script is served by the auto updater, do not use it outside of development.',
						extracted: new Date().toGMTString(),	
					} : {};
					
					return new TMHeaders({
						...meta,
						...addon,
						'run-at': 'document-start',
						noframes: null,
					}) + '\n\n';
				},
				replace: [
					[ /SCRIPTS_URL/g, JSON.stringify(SCRIPTS_URL) ],
				],
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

create_script('sploit', true);
create_script('junker', true);
create_script('loader', false);