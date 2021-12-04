'use strict';

var keys = new Set(),
	/* Input keys
	[
		controls.getISN(),
		Math.round(delta * game.config.deltaMlt),
		Math.round(controls.yDr.round(3) * 1000),
		Math.round(xDr.round(3) * 1000),
		game.moveLock ? -1 : config.movDirs.indexOf(controls.moveDir),
		controls.mouseDownL || controls.keys[controls.binds.shoot.val] ? 1 : 0,
		controls.mouseDownR || controls.keys[controls.binds.aim.val] ? 1 : 0,
		!config.moveLock && controls.keys[controls.binds.jump.val] ? 1 : 0,
		controls.keys[controls.binds.reload.val] ? 1 : 0,
		controls.keys[controls.binds.crouch.val] ? 1 : 0,
		controls.scrollToSwap ? controls.scrollDelta * controls.getSetByWep(null, "scroll") : 0,
		controls.wSwap,
		controls.speedLmt.round(1) - 1,
		controls.keys[controls.binds.reset.val] ? 1 : 0,
		controls.keys[controls.binds.interact.val] ? 1 : 0
	] */
	inputs = { frame: 0, delta: 1, xdir_r: 2, ydir_r: 3, move: 4, shoot: 5, scope: 6, jump: 7, reload: 8, crouch: 9, weapon_scroll: 10, weapon_swap: 11, move_lock: 12, speed_limit: 13, reset: 14, tween_time: 15, tween_progress: 16 };

class InputData {
	static next = [];
	constructor(array){
		this.array = array;
		
		var next = InputData.next.shift();
		
		if(typeof next == 'function')next(this);
	}
	get previous(){
		return InputData.previous;
	}
	next(callback){
		InputData.next.push(callback);
	}
	done(){
		InputData.previous = this;
	}
	get keys(){
		return document.activeElement.tagName == 'INPUT' ? new Set() : keys;
	}
	get focused(){
		return document.pointerLockElement != null;
	}
	get xdir(){
		return this.xdir_r / 1000;
	}
	set xdir(value){
		this.xdir_r = value * 1000;
		return value;
	}
	get ydir(){
		return this.ydir_r / 1000;
	}
	set ydir(value){
		this.ydir_r = value * 1000;
		return value;
	}
};

document.addEventListener('keydown', event => keys.add(event.code));

document.addEventListener('keyup', event => keys.delete(event.code));

window.addEventListener('blur', () => keys = new Set());

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