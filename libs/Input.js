'use strict';

var InputData = require('./InputData'),
	{ Vector3 } = require('./Space'),
	{ loader, api } = require('./consts'),
	{ vars } = loader,
	GConsts = require('./GConsts'),
	full_360 = Math.PI * 2,
	console = require('./console');

class Input {
	smooth_map = {
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
	can_auto_fire = true;
	constructor(data){
		this.data = data;
	}
	push(array){
		if(this.data.player && this.data.controls)try{
			var data = new InputData(array);
			
			this.modify(data);
			this.timers(data);
			
			data.done();
		}catch(err){
			loader.report_error('input', err);
		}
		
		return array;
	}
	aim_input(rot, data){
		data.xdir = rot.x;
		data.ydir = rot.y;
	}
	aim_camera(rot, data){
		this.data.controls[vars.pchObjc].rotation.x = rot.x;
		this.data.controls.object.rotation.y = rot.y;
		
		// this.aim_input(rot, data);
	}
	correct_aim(rot, data){
		if(data.shoot)data.shoot = !this.data.player.shot;
		
		if(!data.reload && this.data.player.has_ammo && data.shoot && !this.data.player.shot)this.aim_input(rot, data);
	}
	enemy_sight(){
		if(this.data.player.shot)return;
		
		var raycaster = new this.data.three.Raycaster();
		
		raycaster.setFromCamera({ x: 0, y: 0 }, this.data.world.camera);
		
		if(this.data.player.aimed && raycaster.intersectObjects(this.data.players.filter(ent => ent.can_target).map(ent => ent.obj), true).length)return true;
	}
	smooth(data, target, speed, turn){
		var x_ang = this.data.utils.getAngleDst(data.xdir, target.x),
			y_ang = this.data.utils.getAngleDst(data.ydir, target.y);
		
		return {
			y: data.ydir + y_ang * speed,
			x: data.xdir + x_ang * turn,
		};
	}
	bhop(data){
		if(data.move == -1)return;
		
		var status = this.data.bhop,
			auto = status.startsWith('auto'),
			key = status.startsWith('key'),
			slide = status.endsWith('slide'),
			jump = slide || status.endsWith('jump');
		
		if(!data.focused)return;
		
		if(jump && (auto || data.keys.has('Space'))){
			this.data.controls.keys[this.data.controls.binds.jump.val] ^= 1;
			if(this.data.controls.keys[this.data.controls.binds.jump.val])this.data.controls.didPressed[this.data.controls.binds.jump.val] = 1;
		}
		
		if(slide && (auto || data.keys.has('Space')) && this.data.player.velocity.y < -0.02 && this.data.player.can_slide)setTimeout(() => this.data.controls.keys[this.data.controls.binds.crouch.val] = 0, 325), this.data.controls.keys[this.data.controls.binds.crouch.val] = 1;
	}
	spin_count = 0;
	spinbot(data){
		data.xdir = this.data.utils.deg2rad(-90);
		
		return; // until radian fuckery is patched
		
		this.spin_count = this.spin_count || 0;
		
		if(data.move != -1)data.move = (data.move + this.spin_count - Math.round(7 * (data.ydir / (Math.PI * 2)))) % 7;
		
		data.ydir = this.spin_count / 7 * (Math.PI * 2);
		
		if(data.frame % 1 == 0){
			this.spin_count = (this.spin_count + 1) % 7;
		}
	}
	spinbot_pre(data){
		data.crouch = data.move == -1;
		data.scope = data.scope || data.crouch;
		
		data.ydir += full_360 * ((this.spin_count ^= 1 ? 1 : -1) * 1e9);
	}
	anti_offset(rot){
		rot.x -= this.data.world.shakeY;
		rot.x -= this.data.player.entity.recoilAnimY * GConsts.recoilMlt;
		rot.x -= this.data.player.entity.landBobY * 0.1;
	}
	move = 0;
	timers(data){
		if(this.data.player.can_shoot && data.shoot && !this.data.player.shot){
			this.data.player.shot = true;
			
			setTimeout(() => this.data.player.shot = false, this.data.player.weapon.rate + 1);
		}else if(this.data.spinbot)this.spinbot(data);
	}
	move_ticks(data, amount, move){
		while(amount--)data.next(data => (data.move = move, data.xdir += 0.002));
	}
	modify(data){
		if(this.data.inactivity && data.move == -1){
			if(this.move++ % 200 == 0){
				this.move_ticks(data, 4, 1);
				this.move_ticks(data, 4, 5);
			}
		}
		
		if(this.data.spinbot)this.spinbot_pre(data);
		
		// bhop
		this.bhop(data);
		
		// auto reload
		if(!this.data.player.has_ammo && (this.data.aim == 'auto' || this.data.auto_reload))data.reload = true;
		
		data.could_shoot = this.data.player.can_shoot;
		
		if(data.shoot && !this.data.player.did_shoot){
			this.can_auto_fire = false;
			
			setTimeout(() => {
				this.can_auto_fire = true;
			}, this.data.force_auto_rate * 1000);
		}
		
		if(this.data.force_auto && this.can_auto_fire && this.data.player.did_shoot && data.shoot){
			this.can_auto_fire = false;
			data.shoot = false;
		}
		
		var nauto = this.data.player.weapon_auto || this.data.player.weapon.burst || !data.shoot || !data.previous.could_shoot || !data.previous.shoot,
			can_target = this.data.aim == 'auto' || data.scope || data.shoot;
		
		if(this.data.player.weapon.burst)this.data.player.shot = this.data.player.did_shoot;
		
		for(let player of this.data.players)player.calc_parts();
		
		if(can_target)this.data.pick_target();
		
		if(this.data.player.can_shoot)if(this.data.aim == 'trigger')data.shoot = this.enemy_sight() || data.shoot;
		else if(this.data.aim != 'off' && this.data.target && this.data.player.health){
			let rot = this.data.target.calc_rot();
			
			this.anti_offset(rot);
			
			if(this.data.aim == 'correction' && nauto)this.correct_aim(rot, data);
			else if(this.data.aim == 'auto'){
				if(this.data.player.can_aim)data.scope = true;
				
				if(this.data.player.aimed)data.shoot = !this.data.player.shot;
				
				this.correct_aim(rot, data);
			}
			
			if(this.data.aim == 'assist' && this.data.player.aim_press){
				let speed = this.smooth_map[this.data.aim_smooth] || (console.warn(this.data.aim_smooth, 'not registered'), 1);
				
				/*
				50 => 0.005
				
				DEFAULT:
				turn: 0.0022,
				speed: 0.0012,
				*/
				
				let turn = this.smooth_map[+Math.min(this.data.aim_smooth * 3, 1).toFixed(1)];
				
				// todo: switch from in out quad to more natural easing
				rot = this.smooth(data, rot, speed, turn);
				
				this.aim_camera(rot, data);
			}
		}
		
		if(data.shoot && this.data.player.shot)data.shoot = !nauto;
	}
};

module.exports = Input;