'use strict';

module.exports = (add_var, add_patch, key) => {
	add_patch('Nametags', /(&&)((\w+)\.cnBSeen)(?=\){if\(\(\w+=\3\.objInstances)/, (match, start, can_see) => `${start}${key}.can_see(${can_see})`);
	
	add_patch('Game', /(\w+)\.moveObj=func/, (match, game) => `${key}.game(${game}),${match}`);
	
	add_patch('World', /(\w+)\.backgroundScene=/, (match, world) => `${key}.world(${world}),${match}`);
	
	add_patch('ThreeJS', /\(\w+,(\w+),\w+\){(?=[a-z ';\.\(\),]+ACESFilmic)/, (match, three) => `${match}${key}.three(${three});`);
	
	add_patch('Skins', /((?:[a-zA-Z]+(?:\.|(?=\.skins)))+)\.skins(?!=)/g, (match, player) => `${key}.skins(${player})`);
	
	add_patch('Socket', /(\w+)(\.exports={ahNum:)/, (match, mod, other) => `({set exports(socket){${key}.socket(socket);return ${mod}.exports=socket}})${other}`);
	
	add_patch('Input', /((\w+\.\w+)\[\2\._push\?'_push':'push']\()(\w+)(\),)/, (match, func, array, input, end) => `${func}${key}.input(${input})${end}`);
	
	add_patch('Timer', /(\w+\.exports)\.(kickTimer)=([\dex]+)/, (match, object, property, value) => `${key}.timer(${object},"${property}",${value})`);
};