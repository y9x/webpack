'use strict';

var vars = require('./vars'),
	InputData = require('./inputdata'),
	{ Vector3 } = require('./space'),
	{ api, utils } = require('./consts');

class Input {
	constructor(cheat){
		this.cheat = cheat;
	}
	push(array){
		if(this.cheat.player && this.cheat.controls)try{
			var data = new InputData(array);
			
			this.modify(data);
			
			InputData.previous = data;
		}catch(err){
			api.report_error('input', err);
		}
		
		return array;
	}
	aim_input(rot, data){
		data.xdir = rot.x * 1000;
		data.ydir = rot.y * 1000;
	}
	aim_camera(rot, data){
		// updating camera will make a difference next tick, update current tick with aim_input
		this.cheat.controls[vars.pchObjc].rotation.x = rot.x;
		this.cheat.controls.object.rotation.y = rot.y;
		
		this.aim_input(rot, data);
	}
	correct_aim(rot, data){
		if(data.shoot)data.shoot = !this.cheat.player.shot;
		
		if(!data.reload && this.cheat.player.has_ammo && data.shoot && !this.cheat.player.shot)this.aim_input(rot, data);
	}
	enemy_sight(){
		if(this.cheat.player.shot)return;
		
		var raycaster = new utils.three.Raycaster();
		
		raycaster.setFromCamera({ x: 0, y: 0 }, this.cheat.world.camera);
		
		if(this.cheat.player.aimed && raycaster.intersectObjects(this.cheat.game.players.list.map(ent => this.cheat.add(ent)).filter(ent => ent.can_target).map(ent => ent.obj), true).length)return true;
	}
	calc_rot(player){
		var camera = utils.camera_world(),
			target = player.aim_point;
		
		// target.add(player.velocity);
		
		var x_dire = utils.getXDire(camera.x, camera.y, camera.z, target.x, target.y
			- this.cheat.player.jump_bob_y
			, target.z)
			- this.cheat.player.land_bob_y * 0.1
			- this.cheat.player.recoil_y * vars.consts.recoilMlt,
			y_dire = utils.getDir(camera.z, camera.x, target.z, target.x);
		
		return {
			x: x_dire || 0,
			y: y_dire || 0,
		};
	}
	smooth(target, setup){
		var x_ang = utils.getAngleDst(this.cheat.controls[vars.pchObjc].rotation.x, target.x),
			y_ang = utils.getAngleDst(this.cheat.controls.object.rotation.y, target.y);
		
		// camChaseSpd used on .object
		
		return {
			y: this.cheat.controls.object.rotation.y + y_ang * setup.speed,
			x: this.cheat.controls[vars.pchObjc].rotation.x + x_ang * setup.turn,
		};
	}
	bhop(data){
		var status = this.cheat.config.player.bhop,
			auto = status.startsWith('auto'),
			key = status.startsWith('key'),
			slide = status.endsWith('slide'),
			jump = slide || status.endsWith('jump');
		
		if(!data.focused)return;
		
		if(jump && (auto || data.keys.Space)){
			this.cheat.controls.keys[this.cheat.controls.binds.jump.val] ^= 1;
			if(this.cheat.controls.keys[this.cheat.controls.binds.jump.val])this.cheat.controls.didPressed[this.cheat.controls.binds.jump.val] = 1;
		}
		
		if(slide && (auto || data.keys.Space) && this.cheat.player.velocity.y < -0.02 && this.cheat.player.can_slide)setTimeout(() => this.cheat.controls.keys[this.cheat.controls.binds.crouch.val] = 0, 325), this.cheat.controls.keys[this.cheat.controls.binds.crouch.val] = 1;
	}
	modify(data){
		// bhop
		this.bhop(data);
		
		// auto reload
		if(!this.cheat.player.has_ammo && (this.cheat.config.aim.status == 'auto' || this.cheat.config.aim.auto_reload))data.reload = true;
		
		// TODO: target once on aim
		
		data.could_shoot = this.cheat.player.can_shoot;
		
		var nauto = this.cheat.player.weapon_auto || this.cheat.player.weapon.burst || !data.shoot || !InputData.previous.could_shoot || !InputData.previous.shoot,
			hitchance = (Math.random() * 100) < this.cheat.config.aim.hitchance,
			can_target = this.cheat.config.aim.status == 'auto' || data.scope || data.shoot;
		
		if(this.cheat.player.weapon.burst)this.cheat.player.shot = this.cheat.player.did_shoot;
		
		if(can_target)this.cheat.target = this.cheat.pick_target();
		
		if(this.cheat.player.can_shoot)if(this.cheat.config.aim.status == 'trigger')data.shoot = this.enemy_sight() || data.shoot;
		else if(this.cheat.config.aim.status != 'off' && this.cheat.target && this.cheat.player.health){
			var rot = this.calc_rot(this.cheat.target);
			
			if(hitchance)if(this.cheat.config.aim.status == 'correction' && nauto)this.correct_aim(rot, data);
			else if(this.cheat.config.aim.status == 'auto'){
				if(this.cheat.player.can_aim)data.scope = 1;
				
				if(this.cheat.player.aimed)data.shoot = !this.cheat.player.shot;
				
				this.correct_aim(rot, data);
			}
			
			if(this.cheat.config.aim.status == 'assist' && this.cheat.player.aim_press){
				var smooth_map = {
					// step: 2
					// min: 0
					// max: 1
					0: 1, // off
					0.1: 0.05,
					0.2: 0.1, // instant
					0.3: 0.08,
					0.4: 0.07, // faster
					0.5: 0.06,
					0.6: 0.05, // fast
					0.7: 0.04,
					0.8: 0.03, // light
					0.9: 0.02,
					1: 0.01, // light
				};
				
				let spd = smooth_map[this.cheat.config.aim.smooth] || (console.warn(this.cheat.config.aim.smooth, 'not registered'), 1);
				
				/*
				50 => 0.005
				
				DEFAULT:
				turn: 0.0022,
				speed: 0.0012,
				*/
				
				rot = this.smooth(rot, {
					turn: spd,
					speed: spd,
				});
				
				this.aim_camera(rot, data);
				
				// offset aim rather than revert to any previous camera rotation
				if(data.shoot && !this.cheat.player.shot && !hitchance)data.ydir = 0;
			}
		}
		
		if(this.cheat.player.can_shoot && data.shoot && !this.cheat.player.shot){
			this.cheat.player.shot = true;
			setTimeout(() => this.cheat.player.shot = false, this.cheat.player.weapon.rate + 2);
		}
	}
};

module.exports = Input;