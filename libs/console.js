'use strict';

for(let prop of ['log','warn','info','error','trace','table','debug','group','groupCollapsed','groupEnd']){
	exports[prop] = console[prop].bind(console);
}