'use strict';

/*
Source: https://api.sys32.dev/v3/source

Notes:
	- Versions past 3.9.2 don't have variable randomization
	- Keep regexes updated
*/

var { loader } = require('./consts');

// loader.var('build', /\.exports='(\w{5})'/, 1);

loader.var('inView', /&&!\w\.\w+&&\w\.\w+&&\w\.(\w+)\){/, 1);

loader.var('spectating', /team:window\.(\w+)/, 1);

loader.var('nAuto', /'Single Fire',varN:'(\w+)'/, 1);

loader.var('xDire', /this\.(\w+)=Math\.lerpAngle\(this\.\w+\[1\]\.xD/, 1);

loader.var('yDire', /this\.(\w+)=Math\.lerpAngle\(this\.\w+\[1\]\.yD/, 1);

loader.var('procInputs', /this\.(\w+)=function\(\w+,\w+,\w+,\w+\){this\.recon/, 1);

loader.var('isYou', /this\.accid=0,this\.(\w+)=\w+,this\.isPlayer/, 1);

// loader.var('pchObjc', /0,this\.(\w+)=new \w+\.Object3D,this/, 1);
loader.var('pchObjc', /this\.mouseX=0,this\.mouseY=0\,this\.(\w+)=new /, 1);

loader.var('aimVal', /this\.(\w+)-=1\/\(this\.weapon\.aimSpd/, 1),

loader.var('crouchVal', /this\.(\w+)\+=\w\.crouchSpd\*\w+,1<=this\.\w+/, 1),

loader.var('didShoot', /--,\w+\.(\w+)=!0/, 1);

loader.var('ammos', /length;for\(\w+=0;\w+<\w+\.(\w+)\.length/, 1);

loader.var('weaponIndex', /\.weaponConfig\[\w+]\.secondary&&\(\w+\.(\w+)==\w+/, 1);

loader.var('maxHealth', /\.regenDelay,this\.(\w+)=\w+\.mode&&\w+\.mode\.\1/, 1),

// loader.var('yVel', /\w+\.(\w+)&&\(\w+\.y\+=\w+\.\1\*/, 1);

// loader.var('mouseDownR', /this\.(\w+)=0,this\.keys=/, 1);

loader.var('adsToggled', /this\.(\w+)=!1,this\.keys=/, 1);

loader.var('recoilAnimY', /\.\w+=0,this\.(\w+)=0,this\.\w+=0,this\.\w+=1,this\.slide/, 1),

loader.var('objInstances', /objInstances/, 0);
// /lowerBody\),\w+\|\|\w+\.(\w+)\./, 1);

loader.var('getWorldPosition', /var \w+=\w+\.camera\.(\w+)\(\);/, 1);

loader.patch('Skins', /(this\.name=\w+,)(this\.score=)/g, (match, start, end) => `${start}${loader.context.key}.skins(this),${end}`);

loader.patch('Nametags', /&&((\w+)\.\w+Seen)(?=\){if\(\(\w+=\2\.objInstances)/, (match, can_see) => `&& ${loader.context.key}.can_see(${can_see})`);

loader.patch('Game', /(\w+)\.moveObj=func/, (match, game) => `${loader.context.key}.game(${game}),${match}`);

loader.patch('Controls', /\.controls=(\w+);/, (match, controls) => `${match}${loader.context.key}.controls(${controls});`);

loader.patch('World', /(\w+)\.backgroundScene=/, (match, world) => `${loader.context.key}.world(${world}),${match}`);

loader.patch('Input', /((\w+\.\w+)\[\2\._push\?'_push':'push']\()(\w+)(\),)/, (match, func, array, input, end) => `${func}${loader.context.key}.input.push(${input})${end}`);

loader.patch('ThreeJS', /\(\w+,(\w+),\w+\){(?=[a-z ';\.\(\),]+ACESFilmic)/, (match, three) => `${match}${loader.context.key}.three(${three});`);

loader.patch('Socket', /(\w+\.exports={ahNum:)/, (match, set) => `${loader.context.key}.socket=${set}`);

loader.patch('Inactivity', />=(\w+\.kickTimer)/g, (match, time) => `>=${loader.context.key}.kick_timer(${time})`);