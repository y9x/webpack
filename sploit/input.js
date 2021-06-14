'use strict';

var vars = require('../libs/vars'),
	cheat = require('./cheat'),
	InputData = require('../libs/inputdata'),
	{ Vector3 } = require('../libs/space'),
	{ api, utils } = require('../libs/consts');

class Input {
	push(array){
		if(cheat.player && cheat.controls)try{
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
		cheat.controls[vars.pchObjc].rotation.x = rot.x;
		cheat.controls.object.rotation.y = rot.y;
		
		this.aim_input(rot, data);
	}
	correct_aim(rot, data){
		if(data.shoot)data.shoot = !cheat.player.shot;
		
		if(!data.reload && cheat.player.has_ammo && data.shoot && !cheat.player.shot)this.aim_input(rot, data);
	}
	enemy_sight(){
		if(cheat.player.shot)return;
		
		var raycaster = new utils.three.Raycaster();
		
		raycaster.setFromCamera({ x: 0, y: 0 }, cheat.world.camera);
		
		if(cheat.player.aimed && raycaster.intersectObjects(cheat.game.players.list.map(ent => cheat.add(ent)).filter(ent => ent.can_target).map(ent => ent.obj), true).length)return true;
	}
	calc_rot(player){
		var camera = utils.camera_world(),
			target = player.aim_point;
		
		// target.add(player.velocity);
		
		var x_dire = utils.getXDire(camera.x, camera.y, camera.z, target.x, target.y
			- cheat.player.jump_bob_y
			, target.z)
			- cheat.player.land_bob_y * 0.1
			- cheat.player.recoil_y * vars.consts.recoilMlt,
			y_dire = utils.getDir(camera.z, camera.x, target.z, target.x);
		
		return {
			x: x_dire || 0,
			y: y_dire || 0,
		};
	}
	smooth(target){
		var mov = 17,
			// default 0.0022
			div = 10000,
			turn = (50 - cheat.config.aim.smooth) / div,
			speed = (50 - cheat.config.aim.smooth) / div,
			x_ang = utils.getAngleDst(cheat.controls[vars.pchObjc].rotation.x, target.xD),
			y_ang = utils.getAngleDst(cheat.controls.object.rotation.y, target.yD);
		
		return {
			y: cheat.controls.object.rotation.y + y_ang * mov * turn,
			x: cheat.controls[vars.pchObjc].rotation.x + x_ang * mov * turn,
		};
	}
	modify(data){
		// bhop
		if(data.focused && cheat.config.game.bhop != 'off' && (data.keys.Space || cheat.config.game.bhop == 'autojump' || cheat.config.game.bhop == 'autoslide')){
			cheat.controls.keys[cheat.controls.binds.jump.val] ^= 1;
			if(cheat.controls.keys[cheat.controls.binds.jump.val])cheat.controls.didPressed[cheat.controls.binds.jump.val] = 1;
			
			if((cheat.config.game.bhop == 'keyslide' && data.keys.Space || cheat.config.game.bhop == 'autoslide') && cheat.player.velocity.y < -0.02 && cheat.player.can_slide)setTimeout(() => cheat.controls.keys[cheat.controls.binds.crouch.val] = 0, 325), cheat.controls.keys[cheat.controls.binds.crouch.val] = 1;
		}
		
		// auto reload
		if(!cheat.player.has_ammo && (cheat.config.aim.status == 'auto' || cheat.config.aim.auto_reload))data.reload = 1;
		
		// TODO: target once on aim
		
		data.could_shoot = cheat.player.can_shoot;
		
		var nauto = cheat.player.weapon_auto || cheat.player.weapon.burst || !data.shoot || !InputData.previous.could_shoot || !InputData.previous.shoot,
			hitchance = (Math.random() * 100) < cheat.config.aim.hitchance,
			can_target = cheat.config.aim.status == 'auto' || data.scope || data.shoot;
		
		if(cheat.player.weapon.burst)cheat.player.shot = cheat.player.did_shoot;
		
		if(can_target)cheat.target = cheat.pick_target();
		
		if(cheat.player.can_shoot)if(cheat.config.aim.status == 'trigger')data.shoot = this.enemy_sight() || data.shoot;
		else if(cheat.config.aim.status != 'off' && cheat.target && cheat.player.health){
			var rot = this.calc_rot(cheat.target);
			
			if(hitchance)if(cheat.config.aim.status == 'correction' && nauto)this.correct_aim(rot, data);
			else if(cheat.config.aim.status == 'auto'){
				if(cheat.player.can_aim)data.scope = 1;
				
				if(cheat.player.aimed)data.shoot = !cheat.player.shot;
				
				this.correct_aim(rot, data);
			}
			
			if(cheat.config.aim.status == 'assist' && cheat.player.aim_press){
				if(cheat.config.aim.smooth)rot = this.smooth({ xD: rot.x, yD: rot.y });
				
				this.aim_camera(rot, data);
				
				// offset aim rather than revert to any previous camera rotation
				if(data.shoot && !cheat.player.shot && !hitchance)data.ydir = 0;
			}
		}
		
		if(cheat.player.can_shoot && data.shoot && !cheat.player.shot){
			cheat.player.shot = true;
			setTimeout(() => cheat.player.shot = false, cheat.player.weapon.rate + 2);
		}
	}
};

module.exports = Input;