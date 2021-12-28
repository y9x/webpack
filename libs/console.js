'use strict';

for(let prop of ['log','warn','error','trace','table','debug','group','groupCollapsed','groupEnd']){
	exports[prop] = console[prop].bind(console);
}