'use strict';

var main = require('./main'),
	vars = require('../libs/vars'),
	{ utils } = require('../libs/consts'),
	{ Vector3 } = require('../libs/space');

class Player {
	constructor(entity){
		this.entity = typeof entity == 'object' && entity != null ? entity : {};
		this.velocity = new Vector3();
		this.position = new Vector3();
		
		this.parts = {
			hitbox_head: new Vector3(),
			head: new Vector3(),
			torso: new Vector3(),
			legs: new Vector3(),
		};
	}
	get x(){ console.warn('get X'); return this.position.x }
	get y(){ console.warn('get Y'); return this.position.y }
	get z(){ console.warn('get Z'); return this.position.z }
	scale_rect(sx, sy){
		var out = {},
			horiz = [ 'y', 'height', 'top', 'bottom' ];
		
		for(var key in this.rect)out[key] = this.rect[key] / (horiz.includes(key) ? sy : sx);
		
		return out;
	}
	get in_fov(){
		if(!this.active)return false;
		if(cheat.config.aim.fov == 110)return true;
		
		var fov_bak = utils.world.camera.fov;
		
		// config fov is percentage of current fov
		utils.world.camera.fov = cheat.config.aim.fov / fov_bak * 100;
		utils.world.camera.updateProjectionMatrix();
		
		utils.update_frustum();
		var ret = this.frustum;
		
		utils.world.camera.fov = fov_bak;
		utils.world.camera.updateProjectionMatrix();
		
		return ret;
	}
	get can_target(){
		return this.active && this.can_see && this.enemy && this.in_fov;
	}
	get frustum(){
		return this.is_you || this.active && utils.contains_point(this.aim_point);
	}
	get hp_color(){
		var hp_perc = (this.health / this.max_health) * 100,
			hp_red = hp_perc < 50 ? 255 : Math.round(510 - 5.10 * hp_perc),
			hp_green = hp_perc < 50 ? Math.round(5.1 * hp_perc) : 255;
		
		return '#' + ('000000' + (hp_red * 65536 + hp_green * 256 + 0 * 1).toString(16)).slice(-6);
	}
	get esp_color(){
		// teammate = green, enemy = red, risk + enemy = orange
		var hex = this.enemy ? this.risk ? [ 0xFF, 0x77, 0x00 ] : [ 0xFF, 0x00, 0x00 ] : [ 0x00, 0xFF, 0x00 ],
			inc = this.can_see ? 0x00 : -0x77,
			part_str = part => Math.max(Math.min(part + inc, 0xFF), 0).toString(16).padStart(2, 0);
		
		return '#' + hex.map(part_str).join('');
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
		return cheat.target && this.entity == cheat.target.entity;
	}
	get can_melee(){
		return this.weapon.melee && cheat.target && cheat.target.active && this.position.distance_to(cheat.target) <= 18 || false;
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
	get aim_press(){ return cheat.controls[vars.mouseDownR] || cheat.controls.keys[cheat.controls.binds.aim.val] }
	get crouch(){ return this.entity[vars.crouchVal] || 0 }
	get box_scale(){
		var view = utils.camera_world(),	
			center = this.box.getCenter(),
			a = side => Math.min(1, (this.rect[side] / utils.canvas[side]) * 10);
		
		return [ a('width'), a('height') ];
	}
	get dist_scale(){
		var view = utils.camera_world(),	
			center = this.box.getCenter(),
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
	get active(){ return this.entity.active && this.entity.x != null && this.health > 0 && (this.is_you ? true : this.chest && this.leg) }
	get teammate(){ return this.is_you || cheat.player && this.team && this.team == cheat.player.team }
	get enemy(){ return !this.teammate }
	get team(){ return this.entity.team }
	get did_shoot(){ return this.entity[vars.didShoot] }
	get chest(){
		return this.entity.lowerBody ? this.entity.lowerBody.children[0] : null;
	}
	get leg(){
		for(var mesh of this.entity.legMeshes)if(mesh.visible)return mesh;
		return this.chest;
	}
	tick(){
		this.position.set(this.entity.x, this.entity.y, this.entity.z);
		this.velocity.set(this.entity.xVel, this.entity.yVel, this.entity.zVel);
		
		this.parts.hitbox_head.copy(this.position).set_y(this.position.y + this.height - (this.crouch * vars.consts.crouchDst));
		
		if(this.is_you)return;
		
		var box = this.box = new utils.three.Box3();
		
		box.expandByObject(this.chest);
		
		var add_obj = obj => obj.visible && obj.traverse(obj => {
			if(obj.type == 'Mesh' && obj.visible)box.expandByObject(obj);
		});
		
		for(var obj of this.entity.legMeshes)add_obj(obj);
		for(var obj of this.entity.upperBody.children)add_obj(obj);
		
		var bounds = {
			center: utils.pos2d(box.getCenter()),
			min: {
				x:  Infinity,
				y: Infinity,
			},
			max: {
				x: -Infinity,
				y: -Infinity,
			},
		};
		
		for(var vec of [
			{ x: box.min.x, y: box.min.y, z: box.min.z },
			{ x: box.min.x, y: box.min.y, z: box.max.z },
			{ x: box.min.x, y: box.max.y, z: box.min.z },
			{ x: box.min.x, y: box.max.y, z: box.max.z },
			{ x: box.max.x, y: box.min.y, z: box.min.z },
			{ x: box.max.x, y: box.min.y, z: box.max.z },
			{ x: box.max.x, y: box.max.y, z: box.min.z },
			{ x: box.max.x, y: box.max.y, z: box.max.z },
		]){
			if(!utils.contains_point(vec))continue;
			
			var td  = utils.pos2d(vec);
			
			if(td.x < bounds.min.x)bounds.min.x = td.x;
			else if(td.x > bounds.max.x)bounds.max.x = td.x;
			
			if(td.y < bounds.min.y)bounds.min.y = td.y;
			else if(td.y > bounds.max.y)bounds.max.y = td.y;
		}
		
		this.rect = {
			x: bounds.center.x,
			y: bounds.center.y,
			left: bounds.min.x,
			top: bounds.min.y,
			right: bounds.max.x,
			bottom: bounds.max.y,
			width: bounds.max.x - bounds.min.x,
			height: bounds.max.y - bounds.min.y,
		};
		
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
		
		this.aim_point = cheat.aim_part == 'head' ? this.parts.hitbox_head : (this.parts[cheat.aim_part] || (console.error(cheat.aim_part, 'not registered'), Vector3.Blank));
		
		this.world_pos = this.active ? this.obj[vars.getWorldPosition]() : { x: 0, y: 0, z: 0 };
		
		var camera_world = utils.camera_world();
		
		this.can_see = cheat.player &&
			utils.obstructing(camera_world, this.aim_point, (!cheat.player || cheat.player.weapon && cheat.player.weapon.pierce) && cheat.config.aim.wallbangs)
		== null ? true : false;
	}
};

module.exports = Player;