'use strict';

var vars = require('./vars'),
	InputData = require('./inputdata'),
	{ Vector3 } = require('./space'),
	{ api, utils } = require('./consts');

class Input {
	constructor(data){
		this.data = data;
	}
	push(array){
		if(this.data.player && this.data.controls)try{
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
		this.data.controls[vars.pchObjc].rotation.x = rot.x;
		this.data.controls.object.rotation.y = rot.y;
		
		this.aim_input(rot, data);
	}
	correct_aim(rot, data){
		if(data.shoot)data.shoot = !this.data.player.shot;
		
		if(!data.reload && this.data.player.has_ammo && data.shoot && !this.data.player.shot)this.aim_input(rot, data);
	}
	enemy_sight(){
		if(this.data.player.shot)return;
		
		var raycaster = new utils.three.Raycaster();
		
		raycaster.setFromCamera({ x: 0, y: 0 }, utils.world.camera);
		
		if(this.data.player.aimed && raycaster.intersectObjects(this.data.players.filter(ent => ent.can_target).map(ent => ent.obj), true).length)return true;
	}
	calc_rot(player){
		var camera = utils.camera_world(),
			target = player.aim_point;
		
		// target.position.add(player.velocity);
		
		var x_dire = utils.getXDire(camera.x, camera.y, camera.z, target.x, target.y
			- this.data.player.jump_bob_y
			, target.z)
			- this.data.player.land_bob_y * 0.1
			- this.data.player.recoil_y * vars.consts.recoilMlt,
			y_dire = utils.getDir(camera.z, camera.x, target.z, target.x);
		
		return {
			x: x_dire || 0,
			y: y_dire || 0,
		};
	}
	smooth(target, setup){
		var x_ang = utils.getAngleDst(this.data.controls[vars.pchObjc].rotation.x, target.x),
			y_ang = utils.getAngleDst(this.data.controls.object.rotation.y, target.y);
		
		// camChaseSpd used on .object
		
		return {
			y: this.data.controls.object.rotation.y + y_ang * setup.speed,
			x: this.data.controls[vars.pchObjc].rotation.x + x_ang * setup.turn,
		};
	}
	bhop(data){
		var status = this.data.bhop,
			auto = status.startsWith('auto'),
			key = status.startsWith('key'),
			slide = status.endsWith('slide'),
			jump = slide || status.endsWith('jump');
		
		if(!data.focused)return;
		
		if(jump && (auto || data.keys.Space)){
			this.data.controls.keys[this.data.controls.binds.jump.val] ^= 1;
			if(this.data.controls.keys[this.data.controls.binds.jump.val])this.data.controls.didPressed[this.data.controls.binds.jump.val] = 1;
		}
		
		if(slide && (auto || data.keys.Space) && this.data.player.velocity.y < -0.02 && this.data.player.can_slide)setTimeout(() => this.data.controls.keys[this.data.controls.binds.crouch.val] = 0, 325), this.data.controls.keys[this.data.controls.binds.crouch.val] = 1;
	}
	modify(data){
		// bhop
		this.bhop(data);
		
		// auto reload
		if(!this.data.player.has_ammo && (this.data.aim == 'auto' || this.data.auto_reload))data.reload = true;
		
		// TODO: target once on aim
		
		data.could_shoot = this.data.player.can_shoot;
		
		var nauto = this.data.player.weapon_auto || this.data.player.weapon.burst || !data.shoot || !InputData.previous.could_shoot || !InputData.previous.shoot,
			hitchance = (Math.random() * 100) < this.data.hitchance,
			can_target = this.data.aim == 'auto' || data.scope || data.shoot;
		
		if(this.data.player.weapon.burst)this.data.player.shot = this.data.player.did_shoot;
		
		if(can_target)this.data.pick_target();
		
		if(this.data.player.can_shoot)if(this.data.aim == 'trigger')data.shoot = this.enemy_sight() || data.shoot;
		else if(this.data.aim != 'off' && this.data.target && this.data.player.health){
			var rot = this.calc_rot(this.data.target);
			
			if(hitchance)if(this.data.aim == 'correction' && nauto)this.correct_aim(rot, data);
			else if(this.data.aim == 'auto'){
				if(this.data.player.can_aim)data.scope = 1;
				
				if(this.data.player.aimed)data.shoot = !this.data.player.shot;
				
				this.correct_aim(rot, data);
			}
			
			if(this.data.aim == 'assist' && this.data.player.aim_press){
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
				
				let spd = smooth_map[this.data.aim_smooth] || (console.warn(this.data.aim_smooth, 'not registered'), 1);
				
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
				
				if(data.shoot && !this.data.player.shot && !hitchance)data.xdir = 0;
			}
		}
		
		if(this.data.player.can_shoot && data.shoot && !this.data.player.shot){
			this.data.player.shot = true;
			setTimeout(() => this.data.player.shot = false, this.data.player.weapon.rate + 2);
		}
	}
};

module.exports = Input;