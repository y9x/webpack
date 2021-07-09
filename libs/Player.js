'use strict';

var { Vector3, Hex } = require('../libs/Space'),
	{ loader, utils } = require('../libs/consts'),
	{ vars, gconsts } = loader,
	random_target = 0;

setInterval(() => random_target = Math.random(), 2000);

class Player {
	// every x ticks calculate heavy pos data
	part_keys = [ 'head', 'torso', 'legs' ];
	calc_ticks = 4;
	constructor(data, entity){
		this.data = data;
		this.entity = typeof entity == 'object' && entity != null ? entity : {};
		this.velocity = new Vector3();
		this.position = new Vector3();
		this.esp_hex = new Hex();
		this.hp_hex = new Hex();
		
		this.dont_calc = 0;
		
		this.parts = {
			hitbox_head: new Vector3(),
			head: new Vector3(),
			torso: new Vector3(),
			legs: new Vector3(),
		};
	}
	get ground(){
		return this.entity.onGround;
	}
	get distance_scale(){
		var world_pos = utils.camera_world();
		
		return Math.max(.3, 1 - utils.getD3D(world_pos.x, world_pos.y, world_pos.z, this.position.x, this.position.y, this.position.z) / 600);
	}
	calc_rect(){
		let playerScale = (2 * gconsts.armScale + gconsts.chestWidth + gconsts.armInset) / 2;
		let xmin = Infinity;
		let xmax = -Infinity;
		let ymin = Infinity;
		let ymax = -Infinity;
		let position = null;
		let broken = false;
		
		for(let var1 = -1; !broken && var1 < 2; var1+=2){
			for(let var2 = -1; !broken && var2 < 2; var2+=2){
				for(let var3 = 0; !broken && var3 < 2; var3++){
					if (position = this.obj.position.clone()) {
						position.x += var1 * playerScale;
						position.z += var2 * playerScale;
						position.y += var3 * (this.height - this.crouch * gconsts.crouchDst);
						if(!utils.contains_point(position)){
							broken = true;
							break;
						}
						position.project(this.data.world.camera);
						xmin = Math.min(xmin, position.x);
						xmax = Math.max(xmax, position.x);
						ymin = Math.min(ymin, position.y);
						ymax = Math.max(ymax, position.y);
					}
				}
			}
		}

		// if(broken)continue;
		
		xmin = (xmin + 1) / 2;
		xmax = (xmax + 1) / 2;
		
		ymin = (ymin + 1) / 2;
		ymax = (ymax + 1) / 2;
		
		ymin = -(ymin - 0.5) + 0.5;
		ymax = -(ymax - 0.5) + 0.5;
		
		xmin *= this.data.ctx.canvas.width;
		xmax *= this.data.ctx.canvas.width;
		ymin *= this.data.ctx.canvas.height;
		ymax *= this.data.ctx.canvas.height;
		
		var obj = {
			left: xmin,
			top: ymax,
			right: xmax,
			bottom: ymin,
			width: xmax - xmin,
			height: ymin - ymax,
		};
		
		obj.x = obj.left + obj.width / 2;
		obj.y = obj.top + obj.height / 2;
		
		return obj;
	}
	scale_rect(sx, sy){
		var out = {},
			horiz = [ 'y', 'height', 'top', 'bottom' ];
		
		for(var key in this.rect)out[key] = this.rect[key] / (horiz.includes(key) ? sy : sx);
		
		return out;
	}
	calc_in_fov(){
		if(!this.active)return false;
		if(this.data.aim_fov == 110)return true;
		if(!this.frustum)return false;
		
		var fov_bak = utils.world.camera.fov;
		
		// config fov is percentage of current fov
		utils.world.camera.fov = this.data.aim_fov / fov_bak * 100;
		utils.world.camera.updateProjectionMatrix();
		
		utils.update_frustum();
		var ret = utils.contains_point(this.aim_point);
		
		utils.world.camera.fov = fov_bak;
		utils.world.camera.updateProjectionMatrix();
		utils.update_frustum();
		
		return ret;
	}
	get ping(){ return this.entity.ping }
	get jump_bob_y(){ return this.entity.jumpBobY }
	get clan(){ return this.entity.clan }
	get alias(){ return this.entity.alias }
	get weapon(){ return this.entity.weapon }
	get weapon_auto(){ return !this.weapon.nAuto }
	get can_slide(){ return this.entity.canSlide }
	get risk(){ return this.entity.level >= 30 || this.entity.account && (this.entity.account.featured || this.entity.account.premiumT) }
	get is_you(){ return this.entity[vars.isYou] }
	get target(){
		return this.data.target && this.entity == this.data.target.entity;
	}
	get can_melee(){
		return this.weapon.melee && this.data.target && this.data.target.active && this.position.distance_to(this.data.target) <= 18 || false;
	}
	get reloading(){
		// reloadTimer in var randomization array
		return this.entity.reloadTimer != 0;
	}
	get can_aim(){
		return !this.can_melee;
	}
	get can_throw(){
		return this.entity.canThrow && this.weapon.canThrow;
	}
	get aimed(){
		var aim_val = this.can_throw
			? 1 - this.entity.chargeTime / this.entity.throwCharge
			: this.weapon.melee ? 1 : this.entity[vars.aimVal];
		
		return this.weapon.noAim || aim_val == 0 || this.can_melee || false;
	}
	get can_shoot(){
		return !this.reloading && this.has_ammo && (this.can_throw || !this.weapon.melee || this.can_melee);
	}
	get aim_press(){ return this.data.controls[vars.mouseDownR] || this.data.controls.keys[this.data.controls.binds.aim.val] }
	get crouch(){ return this.entity[vars.crouchVal] || 0 }
	get box_scale(){
		var view = utils.camera_world(),	
			a = side => Math.min(1, (this.rect[side] / this.data.ctx.canvas[side]) * 10);
		
		return [ a('width'), a('height') ];
	}
	get dist_scale(){
		var view = utils.camera_world(),	
			scale = Math.max(0.65, 1 - utils.getD3D(view.x, view.y, view.z, this.position.x, this.position.y, this.position.z) / 600);
		
		return [ scale, scale ];
	}
	get distance_camera(){
		return utils.camera_world().distanceTo(this.position);
	}
	get obj(){ return this.is_ai ? this.enity.dat : this.entity[vars.objInstances] }
	get land_bob_y(){ return this.entity.landBobY || 0 }
	get recoil_y(){ return this.entity[vars.recoilAnimY] || 0 }
	get has_ammo(){ return this.ammo || this.ammo == this.max_ammo }
	get ammo(){ return this.entity[vars.ammos][this.entity[vars.weaponIndex]] || 0 }
	get max_ammo(){ return this.weapon.ammo || 0 }
	get height(){ return this.entity.height || 0 } // (this.entity.height || 0) - this.crouch * 3 }
	get health(){ return this.entity.health || 0 }
	get scale(){ return this.entity.scale }
	get max_health(){ return this.entity[vars.maxHealth] || 100 }
	//  && (this.is_you ? true : this.chest && this.leg)
	get active(){ return this.entity.active && this.entity.x != null && this.health > 0 && (this.is_you ? true : this.chest && this.leg) && true }
	get teammate(){ return this.is_you || this.data.player && this.team && this.team == this.data.player.team }
	get enemy(){ return !this.teammate }
	get team(){ return this.entity.team }
	get streaks(){ return Object.keys(this.entity.streaks || {}) }
	get did_shoot(){ return this.entity[vars.didShoot] }
	get chest(){
		return this.entity.lowerBody ? this.entity.lowerBody.children[0] : null;
	}
	get leg(){
		for(var mesh of this.entity.legMeshes)if(mesh.visible)return mesh;
		return this.chest;
	}
	// Rotation to look at aim_point
	calc_rot(){
		var camera = utils.camera_world(),
			target = this.aim_point;
		
		// add velocity * scale / 10
		// target.add(this.velocity);
		
		var x_dire = utils.getXDire(camera.x, camera.y, camera.z, target.x, target.y
			- this.data.player.jump_bob_y
			, target.z)
			- this.data.player.land_bob_y * 0.1
			- this.data.player.recoil_y * gconsts.recoilMlt,
			y_dire = utils.getDir(camera.z, camera.x, target.z, target.x);
		
		return {
			x: x_dire || 0,
			y: y_dire || 0,
		};
	}
	calc_parts(){
		if(!this.active || this.is_you)return this.can_target = false;
		
		if(this.aim_point && (this.dont_calc++) % (this.calc_ticks + 1) != 0)return;
		
		var head_size = 1.5,
			chest_box = new utils.three.Box3().setFromObject(this.chest),
			chest_size = chest_box.getSize(),
			chest_pos = chest_box.getCenter();
		
		// parts centered
		this.parts.torso.copy(chest_pos).translate_quaternion(this.chest.getWorldQuaternion(), new Vector3().copy({
			x: 0,
			y: -head_size / 2,
			z: 0,
		}));
		
		this.parts.torso_height = chest_size.y - head_size;
		
		this.parts.head.copy(chest_pos).translate_quaternion(this.chest.getWorldQuaternion(), new Vector3().copy({
			x: 0,
			y: this.parts.torso_height / 2,
			z: 0,
		}));
		
		var leg_pos = this.leg[vars.getWorldPosition](),
			leg_scale = this.leg.getWorldScale();
		
		this.parts.legs = new Vector3().copy(leg_pos).translate_quaternion(this.leg.getWorldQuaternion(), new Vector3().copy({
			x: -leg_scale.x / 2,
			y: -leg_scale.y / 2,
			z: 0,
		}));
		
		var part = this.data.aim_offset == 'random' ? this.part_keys[~~(random_target * this.part_keys.length)] : this.data.aim_offset;
		
		this.aim_point = part == 'head' ? this.parts.hitbox_head : (this.parts[part] || (console.error(part, 'not registered'), Vector3.Blank));
		
		this.frustum = utils.contains_point(this.aim_point);
		this.in_fov = this.calc_in_fov();
		
		this.world_pos = this.active ? this.obj[vars.getWorldPosition]() : { x: 0, y: 0, z: 0 };
		
		this.can_see = this.data.player &&
			utils.obstructing(utils.camera_world(), this.aim_point, (!this.data.player || this.data.player.weapon && this.data.player.weapon.pierce) && this.data.wallbangs)
		== null ? true : false;
		
		this.can_target = this.active && this.can_see && this.enemy && this.in_fov;
	}
	tick(){
		this.position.set(this.entity.x, this.entity.y, this.entity.z);
		this.velocity.set(this.entity.xVel, this.entity.yVel, this.entity.zVel);
		
		this.parts.hitbox_head.copy(this.position).set_y(this.position.y + this.height - (this.crouch * gconsts.crouchDst));
		
		if(this.is_you)return;
		
		if(this.frustum)this.rect = this.calc_rect();
		
		this.esp_hex.set_style(this.data.rainbow ? this.data.visual.rainbow.col : this.data.color[this.enemy ? this.risk ? 'risk' : 'hostile' : 'friendly']);
		
		if(!this.can_see)this.esp_hex.sub_scalar(0x77);
		
		this.esp_color = this.esp_hex.toString();
		
		var hp_perc = (this.health / this.max_health) * 100,
			hp_red = hp_perc < 50 ? 255 : Math.round(510 - 5.10 * hp_perc),
			hp_green = hp_perc < 50 ? Math.round(5.1 * hp_perc) : 255,
			hp_blue = 0;

		this.hp_hex.set(hp_red, hp_green, hp_blue);
		
		this.hp_color = this.hp_hex.toString();
	}
};

module.exports = Player;