'use strict';

/*
Source: https://api.sys32.dev/v2/source

Notes:
	- Versions past 3.9.2 don't have variable randomization
	- Keep regexes updated
*/

var vars = new Map(),
	patches = new Map(),
	add_var = (label, regex, index) => vars.set(label, [ regex, index ]),
	add_patch = (label, regex, replacement) => patches.set(label, [ regex, replacement ]),
	key = '_' + Math.random().toString().substr(2);

add_var('build', /\.exports='(\w{5})'/, 1);

add_var('inView', /&&!\w\.\w+&&\w\.\w+&&\w\.(\w+)\){/, 1);

add_var('spectating', /team:window\.(\w+)/, 1);

add_var('nAuto', /'Single Fire',varN:'(\w+)'/, 1);

add_var('xDire', /this\.(\w+)=Math\.lerpAngle\(this\.\w+\[1\]\.xD/, 1);

add_var('yDire', /this\.(\w+)=Math\.lerpAngle\(this\.\w+\[1\]\.yD/, 1);

add_var('procInputs', /this\.(\w+)=function\(\w+,\w+,\w+,\w+\){this\.recon/, 1);

add_var('isYou', /this\.accid=0,this\.(\w+)=\w+,this\.isPlayer/, 1);

add_var('pchObjc', /0,this\.(\w+)=new \w+\.Object3D,this/, 1);

add_var('aimVal', /this\.(\w+)-=1\/\(this\.weapon\.aimSpd/, 1),

add_var('crouchVal', /this\.(\w+)\+=\w\.crouchSpd\*\w+,1<=this\.\w+/, 1),

add_var('didShoot', /--,\w+\.(\w+)=!0/, 1);

add_var('ammos', /length;for\(\w+=0;\w+<\w+\.(\w+)\.length/, 1);

add_var('weaponIndex', /\.weaponConfig\[\w+]\.secondary&&\(\w+\.(\w+)==\w+/, 1);

add_var('maxHealth', /\.regenDelay,this\.(\w+)=\w+\.mode&&\w+\.mode\.\1/, 1),

add_var('yVel', /\w+\.(\w+)&&\(\w+\.y\+=\w+\.\1\*/, 1);

add_var('mouseDownR', /this\.(\w+)=0,this\.keys=/, 1);

add_var('recoilAnimY', /\.\w+=0,this\.(\w+)=0,this\.\w+=0,this\.\w+=1,this\.slide/, 1),

add_var('objInstances', /lowerBody\),\w+\|\|\w+\.(\w+)\./, 1),

add_var('getWorldPosition', /var \w+=\w+\.camera\.(\w+)\(\);/, 1);

add_patch('Skins', /((?:[a-zA-Z]+(?:\.|(?=\.skins)))+)\.skins(?!=)/g, (match, player) => `${key}.skins(${player})`);

add_patch('Nametags', /(&&)((\w+)\.canBSeen)/, (match, start, can_see) => `${start}${key}.can_see(${can_see})`);

add_patch('Game', /(\w+)\.moveObj=func/, (match, game) => `${key}.game(${game}),${match}`);

add_patch('World', /(\w+)\.backgroundScene=/, (match, world) => `${key}.world(${world}),${match}`);

add_patch('Input', /((\w+\.\w+)\[\2\._push\?'_push':'push']\()(\w+)(\),)/, (match, func, array, input, end) => `${func}${key}.input(${input})${end}`);

add_patch('Timer', /(\w+\.exports)\.(kickTimer)=([\dex]+)/, (match, object, property, value) => `${key}.timer(${object},"${property}",${value})`);

add_patch('ThreeJS', /\(\w+,(\w+),\w+\){(?=[a-z ';\.\(\),]+ACESFilmic)/, (match, three) => `${match}${key}.three(${three});`);

exports.patch = source => {
	var found = {},
		missing = {};
	
	for(var [ label, [ regex, index ] ] of vars){
		var value = (source.match(regex) || 0)[index];
		
		if(value)exports[label] = found[label] = value;
		else missing[label] = [ regex, index ];
	}
	
	console.log('Found:');
	console.table(found);
	
	console.log('Missing:');
	console.table(missing);
	
	for(var [ label, [ input, replacement ] ] of patches){
		if(!source.match(input))console.error('Could not patch', label);
		
		source = source.replace(input, replacement);
	}
	
	return source;
};

exports.key = key;

// Input keys
/*
[
	controls.getISN(),
	Math.round(delta * game.config.deltaMlt),
	Math.round(1000 * controls.yDr.round(3)),
	Math.round(1000 * xDr.round(3)),
	game.moveLock ? -1 : config.movDirs.indexOf(controls.moveDir),
	controls.mouseDownL || controls.keys[controls.binds.shoot.val] ? 1 : 0,
	controls.mouseDownR || controls.keys[controls.binds.aim.val] ? 1 : 0,
	!Q.moveLock && controls.keys[controls.binds.jump.val] ? 1 : 0,
	controls.keys[controls.binds.reload.val] ? 1 : 0,
	controls.keys[controls.binds.crouch.val] ? 1 : 0,
	controls.scrollToSwap ? controls.scrollDelta * ue.tmp.scrollDir : 0,
	controls.wSwap,
	1 - controls.speedLmt.round(1),
	controls.keys[controls.binds.reset.val] ? 1 : 0,
	controls.keys[controls.binds.interact.val] ? 1 : 0
];
*/

exports.keys = { frame: 0, delta: 1, xdir: 2, ydir: 3, moveDir: 4, shoot: 5, scope: 6, jump: 7, reload: 8, crouch: 9, weaponScroll: 10, weaponSwap: 11, moveLock: 12, speed_limit: 13, reset: 14, interact: 15 };

exports.consts = {
	twoPI: Math.PI * 2,
	halfPI: Math.PI / 2,
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

exports.load = loader => {
	loader(add_var, add_patch, exports.key);
};