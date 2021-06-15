'use strict';

var vars = require('../libs/vars'),
	main = require('./main'),
	InputData = require('../libs/inputdata'),
	{ Vector3 } = require('../libs/space'),
	{ api, utils } = require('../libs/consts');

class Input {
	push(array){
		if(main.player && main.controls)try{
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
		main.controls[vars.pchObjc].rotation.x = rot.x;
		main.controls.object.rotation.y = rot.y;
		
		this.aim_input(rot, data);
	}
	correct_aim(rot, data){
		if(data.shoot)data.shoot = !main.me.shot;
		
		if(!data.reload && main.me.has_ammo && data.shoot && !main.me.shot)this.aim_input(rot, data);
	}
	enemy_sight(){
		if(main.me.shot)return;
		
		var raycaster = new utils.three.Raycaster();
		
		raycaster.setFromCamera({ x: 0, y: 0 }, main.world.camera);
		
		if(main.me.aimed && raycaster.intersectObjects(main.game.players.list.map(ent => main.add(ent)).filter(ent => ent.can_target).map(ent => ent.obj), true).length)return true;
	}
	calc_rot(player){
		var camera = utils.camera_world(),
			target = player.aim_point;
		
		// target.add(player.velocity);
		
		var x_dire = utils.getXDire(camera.x, camera.y, camera.z, target.x, target.y
			- main.me.jump_bob_y
			, target.z)
			- main.me.land_bob_y * 0.1
			- main.me.recoil_y * vars.consts.recoilMlt,
			y_dire = utils.getDir(camera.z, camera.x, target.z, target.x);
		
		return {
			x: x_dire || 0,
			y: y_dire || 0,
		};
	}
	smooth(target, amount){
		var mov = 17,
			// default 0.0022
			div = 10000,
			turn = amount / div,
			speed = amount / div,
			x_ang = utils.getAngleDst(main.controls[vars.pchObjc].rotation.x, target.xD),
			y_ang = utils.getAngleDst(main.controls.object.rotation.y, target.yD);
		
		return {
			y: main.controls.object.rotation.y + y_ang * mov * turn,
			x: main.controls[vars.pchObjc].rotation.x + x_ang * mov * turn,
		};
	}
	modify(data){
		// bhop
		if(data.focused && main.config.player.bhop != 'off' && (data.keys.Space || main.config.player.bhop.startsWith('auto'))){
			main.controls.keys[main.controls.binds.jump.val] ^= 1;
			if(main.controls.keys[main.controls.binds.jump.val])main.controls.didPressed[main.controls.binds.jump.val] = 1;
			
			if((main.config.player.bhop == 'keyslide' && data.keys.Space || main.config.player.bhop == 'autoslide') && main.me.velocity.y < -0.02 && main.me.can_slide)setTimeout(() => main.controls.keys[main.controls.binds.crouch.val] = 0, 325), main.controls.keys[main.controls.binds.crouch.val] = 1;
		}
		
		// auto reload
		if(!main.me.has_ammo && (main.config.aim.status == 'auto' || main.config.aim.auto_reload))data.reload = true;
		
		// TODO: target once on aim
		
		data.could_shoot = main.me.can_shoot;
		
		var nauto = main.me.weapon_auto || main.me.weapon.burst || !data.shoot || !InputData.previous.could_shoot || !InputData.previous.shoot,
			hitchance = (Math.random() * 100) < main.config.aim.hitchance,
			can_target = main.config.aim.status == 'auto' || data.scope || data.shoot;
		
		if(main.me.weapon.burst)main.me.shot = main.me.did_shoot;
		
		if(can_target)main.target = main.pick_target();
		
		if(main.me.can_shoot)if(main.config.aim.status == 'trigger')data.shoot = this.enemy_sight() || data.shoot;
		else if(main.config.aim.status != 'off' && main.target && main.me.health){
			var rot = this.calc_rot(main.target);
			
			if(hitchance)if(main.config.aim.status == 'correction' && nauto)this.correct_aim(rot, data);
			else if(main.config.aim.status == 'auto'){
				if(main.me.can_aim)data.scope = 1;
				
				if(main.me.aimed)data.shoot = !main.me.shot;
				
				this.correct_aim(rot, data);
			}
			
			if(main.config.aim.status == 'assist' && main.me.aim_press){
				if(main.config.aim.smooth)rot = this.smooth({ xD: rot.x, yD: rot.y }, 50 -main.config.aim.smooth);
				
				this.aim_camera(rot, data);
				
				// offset aim rather than revert to any previous camera rotation
				if(data.shoot && !main.me.shot && !hitchance)data.ydir = 0;
			}
		}
		
		if(main.me.can_shoot && data.shoot && !main.me.shot){
			main.me.shot = true;
			setTimeout(() => main.me.shot = false, main.me.weapon.rate + 2);
		}
	}
};

module.exports = Input;