'use strict';

module.exports = (add_var, add_patch, key) => {
	add_patch('ThreeJS', /\(\w+,(\w+),\w+\){(?=[a-z ';\.\(\),]+ACESFilmic)/, (match, three) => `${match}${key}.three(${three});`);
};