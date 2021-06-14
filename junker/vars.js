'use strict';

module.exports = (add_var, add_patch, key) => {
	// set render(orender){
	// return hooked function
	add_patch('Render', /}},(\w+)\.render=/, (set, overlay) => `${set}0;({set _(_){${key}.render(_,${overlay})}})._=`);
	
	add_patch('Socket', /(\w+\.exports={ahNum:)/, (match, set) => `${key}.socket=${set}`);
	
	add_patch('isHacker', /(window\.\w+=)!0\)/, `$1!1)`);
	
	add_patch('respawnT', /\w+:1e3\*/g, `respawnT:0*`);
	
	add_patch('anticheat1', /&&\w+\(\),window\.utilities&&\(\w+\(null,null,null,!0\),\w+\(\)\)/, '');
	
	add_patch('anticheat3', /windows\.length>\d+.*?37/, `37`);
	
	add_patch('commandline', /Object\.defineProperty\(console.*?\),/, '');
};