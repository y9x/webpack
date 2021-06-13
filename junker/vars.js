'use strict';

module.exports = (add_var, add_patch, key) => {
	add_patch('Exports', /(,(\w+)\(\2\.s=\d+\))(}\(\[)/, `$1,${key}.exports=$2.c$3`);
	
	add_patch('Inputs', /(\w+\.\w+\.\w+\?'\w+':'push'\]\()(\w+)\),/, `$1${key}.onInput($2)),`);
	
	add_patch('inView', /&&(\w+\.\w+)\){(if\(\(\w+=\w+\.\w+\.\w+\.\w+)/, `){if(void 0!==${key}.noNameTags||!$1&&void 0 == ${key}.nameTags)continue;$2`);
	
	add_patch('Socket', /this\.\w+=new WebSocket\(\w+\)/, `${key}.ws=this;$&`);
	
	add_patch('isHacker', /(window\.\w+=)!0\)/, `$1!1)`);
	
	add_patch('respawnT', /\w+:1e3\*/g, `respawnT:0*`);
	
	add_patch('anticheat1', /&&\w+\(\),window\.utilities&&\(\w+\(null,null,null,!0\),\w+\(\)\)/, '');
	
	add_patch('anticheat3', /windows\.length>\d+.*?37/, `37`);
	
	add_patch('commandline', /Object\.defineProperty\(console.*?\),/, '');
};