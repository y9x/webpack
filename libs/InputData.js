'use strict';

var keys = new Set(),
	/* Input keys
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
	] */
	inputs = { frame: 0, delta: 1, xdir: 2, ydir: 3, move_dir: 4, shoot: 5, scope: 6, jump: 7, reload: 8, crouch: 9, weapon_scroll: 10, weapon_swap: 11, move_lock: 12, speed_limit: 13, reset: 14, interact: 15 };

class InputData {
	constructor(array){
		this.array = array;
	}
	get keys(){
		return document.activeElement.tagName == 'INPUT' ? new Set() : keys;
	}
	get focused(){
		return document.pointerLockElement != null;
	}
	get xdir_n(){
		return this.xdir / 1000;
	}
	set xdir_n(value){
		this.xdir = value * 1000;
		return value;
	}
	get ydir_n(){
		return this.ydir / 1000;
	}
	set ydir_n(value){
		this.ydir = value * 1000;
		return value;
	}
};

document.addEventListener('keydown', event => keys.add(event.code));

document.addEventListener('keyup', event => keys.delete(event.code));

window.addEventListener('blur', () => keys = new Set());

InputData.previous = {};

for(let prop in inputs){
	let key = inputs[prop];
	
	Object.defineProperty(InputData.prototype, prop, {
		get(){
			return this.array[key];
		},
		set(value){
			return this.array[key] = typeof value == 'boolean' ? +value : value;
		},
	});
}

module.exports = InputData;

window.InputData = InputData;