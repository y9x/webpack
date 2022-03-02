'use strict';

var { Vector3, Hex3, Box3 } = require('./Space'),
	{ loader } = require('./consts'),
	{ vars } = loader,
	GConsts = require('./GConsts'),
	random_target = 0;

setInterval(() => random_target = Math.random(), 2000);

class Player {
	part_keys = [ 'head', 'chest', 'legs' ];
	// every x ticks calculate heavy pos data
	calc_ticks = 2;
	constructor(data, entity){
		this.data = data;
		this.entity = typeof entity == 'object' && entity != null ? entity : {};
		this.velocity = new Vector3();
		this.position = new Vector3();
		this.esp_hex = new Hex3();
		this.hp_hex = new Hex3();
		
		this.dont_calc = 0;
		
		this.hitbox = new Box3();
		this.hitbox.head = new Box3();
		
		this.parts = {
			hitbox_head: new Vector3(),
			head: new Vector3(),
			chest: new Vector3(),
			legs: new Vector3(),
		};
	}
	get ground(){
		return this.entity.onGround;
	}
	calc_rect(){
		var playerScale = (2 * GConsts.armScale + GConsts.chestWidth + GConsts.armInset) / 2,
			xmin = Infinity,
			xmax = -Infinity,
			ymin = Infinity,
			ymax = -Infinity,
			position = null;
		
		this.frustum = true;
		
		for(let var1 = -1; this.frustum && var1 < 2; var1+=2){
			for(let var2 = -1; this.frustum && var2 < 2; var2+=2){
				for(let var3 = 0; this.frustum && var3 < 2; var3++){
					if (position = this.obj.position.clone()) {
						position.x += var1 * playerScale;
						position.z += var2 * playerScale;
						position.y += var3 * this.height;
						if(!this.data.utils.contains_point(position))return this.frustum = false;
						position.project(this.data.world.camera);
						xmin = Math.min(xmin, position.x);
						xmax = Math.max(xmax, position.x);
						ymin = Math.min(ymin, position.y);
						ymax = Math.max(ymax, position.y);
					}
				}
			}
		}

		// if(!this.frustum)continue;
		
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
		if(this.data.aim_fov == 110)return true;
		if(!this.frustum)return false;
		
		var fov_bak = this.data.world.camera.fov;
		
		// config fov is percentage of current fov
		this.data.world.camera.fov = this.data.aim_fov / fov_bak * 100;
		this.data.world.camera.updateProjectionMatrix();
		
		this.data.utils.update_frustum();
		var ret = this.data.utils.contains_point(this.aim_point);
		
		this.data.world.camera.fov = fov_bak;
		this.data.world.camera.updateProjectionMatrix();
		this.data.utils.update_frustum();
		
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
	get hitbox_pad(){
		return this.data.game.config.hitBoxPad - 0.2;
	}
	get hitbox_scale(){
		return this.entity.scale + this.hitbox_pad - 0.2;
	}
	get aim_press(){ return this.data.controls[vars.adsToggled] || this.data.controls.keys[this.data.controls.binds.aim.val] }
	get crouch(){ return this.entity[vars.crouchVal] || 0 }
	get box_scale(){
		var view = this.data.utils.camera_world(),	
			a = side => Math.min(1, (this.rect[side] / this.data.ctx.canvas[side]) * 10);
		
		return [ a('width'), a('height') ];
	}
	get dist_scale(){
		var view = this.data.utils.camera_world(),	
			scale = Math.max(0.65, 1 - this.data.utils.getD3D(view.x, view.y, view.z, this.position.x, this.position.y, this.position.z) / 600);
		
		return [ scale, scale ];
	}
	get distance_camera(){
		return this.data.utils.camera_world().distanceTo(this.position);
	}
	get obj(){ return this.is_ai ? this.enity.dat : this.entity[vars.objInstances] }
	get land_bob_y(){ return this.entity.landBobY || 0 }
	get recoil_y(){ return this.entity[vars.recoilAnimY] || 0 }
	get has_ammo(){ return this.ammo || this.ammo == this.max_ammo }
	get ammo(){ return this.entity[vars.ammos][this.entity[vars.weaponIndex]] || 0 }
	get max_ammo(){ return this.weapon.ammo || 0 }
	get height(){ return this.entity.height - this.crouch * GConsts.crouchDst }
	get health(){ return this.entity.health || 0 }
	get scale(){ return this.entity.scale }
	get max_health(){ return this.entity[vars.maxHealth] || 100 }
	get active(){ return this.entity.active && this.entity.x != null && this.health > 0 && (this.is_you ? true : this.leg) && true }
	get teammate(){ return this.is_you || this.data.player && this.team && this.team == this.data.player.team }
	get enemy(){ return !this.teammate }
	get team(){ return this.entity.team }
	get streaks(){ return Object.keys(this.entity.streaks || {}) }
	get did_shoot(){ return this.entity[vars.didShoot] }
	get leg(){
		/*this.entity.objInstances.traverse(obj => {
			if(obj.visible)switch(obj.name){
				case'leg':
					this.leg = obj;
					break;
				case'head':
					this.head = obj;
					break;
				case'body':
					this.body = body;
					break;
		});*/
		for(let mesh of this.entity.legMeshes)if(mesh.visible)return mesh;
		
		var base = this.entity.lowerBody;
		
		return {
			getWorldQuaternion(){
				return base.getWorldQuaternion();
			},
			[vars.getWorldPosition]: () => {
				return new Vector3().copy(base[vars.getWorldPosition]()).translate_quaternion(base.getWorldQuaternion(), new Vector3().copy({
					x: GConsts.legScale / 2,
					y: GConsts.legHeight / 2,
					z: 0,
				}));
			},
		};
	}
	// Rotation to look at aim_point
	calc_rot(){
		var camera = this.data.utils.camera_world(),
			target = this.aim_point;
		
		// add velocity * scale / 10
		// target.add(this.velocity);
		
		var x_dire = this.data.utils.getXDire(camera.x, camera.y, camera.z, target.x, target.y
			- this.data.player.jump_bob_y
			, target.z),
			y_dire = this.data.utils.getDir(camera.z, camera.x, target.z, target.x);
		
		return {
			x: x_dire || 0,
			y: y_dire || 0,
		};
	}
	calc_parts(){
		if(!this.active || this.is_you)return this.can_target = false;
		
		if(this.data.aim_smooth && this.aim_point && (this.dont_calc++) % (this.calc_ticks + 1) != 0)return;
		
		var head_size = 1.5,
			torso = this.entity.lowerBody.getWorldPosition(),
			torso_quaternion = this.entity.lowerBody.getWorldQuaternion();
		
		// accurate center of head
		// player.entity.upperBody.getWorldPosition()
		
		this.parts.chest.copy(torso).translate_quaternion(torso_quaternion, new Vector3().copy({
			x: 0,
			y: GConsts.chestHeight / 2,
			z: 0,
		}));
		
		// head can be p.parts.torso_real = p.entity.upperBody.getWorldPosition();
		this.parts.head.copy(torso).translate_quaternion(torso_quaternion, new Vector3().copy({
			x: 0,
			y: GConsts.chestHeight + GConsts.headScale / 2,
			z: 0,
		}));
		
		var leg_pos = this.leg[vars.getWorldPosition]();
		
		this.parts.legs.copy(leg_pos).translate_quaternion(this.leg.getWorldQuaternion(), new Vector3().copy({
			x: -GConsts.legScale / 2,
			y: -GConsts.legHeight / 2,
			z: 0,
		}));
		
		var part = this.data.aim_offset == 'random' ? this.part_keys[~~(random_target * this.part_keys.length)] : this.data.aim_offset;
		
		switch(part){
			case'head':
				
				this.set_aim_point(this.parts.head);
				
				break;
			case'multi':
				
				if(!this.set_aim_point(this.parts.hitbox_head)){
					let view = this.data.utils.camera_world();
					
					// pick closest point to gurantee hit
					// prefer highest point for headshots
					let points = this.visible_points(this.hitbox.head.points())
					.sort((p1, p2) => (p1.distance_to(view) - p2.distance_to(view)) + (p2.y - p1.y));
					
					for(let point of points)if(this.set_aim_point(point))break;
				}
				
				break;
			case'chest':
			
				this.set_aim_point(this.parts.chest);
				
				break;
			case'legs':
			
				this.set_aim_point(this.parts.legs);
				
				break;
			case'head':
			
				this.set_aim_point(this.parts.head);
				
				break;
			default:
				
				throw 'unknown part ' + part;
				
				break;
		}
		
		this.in_fov = this.calc_in_fov();
		
		this.can_target = this.can_see && this.enemy && this.in_fov;
	}
	visible_points(points){
		var face_points = [
			[ 0, 3 ],
			[ 3, 5 ],
			[ 5, 6 ],
			[ 6, 0 ],
		];
		
		var faces = [];
		
		for(let fp of face_points){
			let box = new this.data.three.Box3();
			
			for(let index of fp)box.expandByPoint(points[index]);
			
			let size = box.getSize(),
				center = box.getCenter();
			
			faces.push({
				width: size.x,
				length: size.z,
				height: size.y,
				x: center.x,
				y: center.y - (size.y / 2), // bottom
				z: center.z,
			});
		}
		
		return points.filter(point => {
			// remove ! to unbreak
			if(!this.point_obstructing(point, faces)){
				return false;
			}
			
			return true;
		});
	}
	point_obstructing(point, faces){
		var view = this.data.utils.camera_world(),
			d3d = this.data.utils.getD3D(view.x, view.y, view.z, point.x, point.y, point.z),
			dir = this.data.utils.getDir(view.z, view.x, point.z, point.x),
			dist_dir = this.data.utils.getDir(this.data.utils.getDistance(view.x, view.z, point.x, point.z), point.y, 0, view.y),
			ad = 1 / (d3d * Math.sin(dir - Math.PI) * Math.cos(dist_dir)),
			ae = 1 / (d3d * Math.cos(dir - Math.PI) * Math.cos(dist_dir)),
			af = 1 / (d3d * Math.sin(dist_dir));
		
		for(let obj of faces){
			var in_rect = this.data.utils.lineInRect(view.x, view.z, view.y, ad, ae, af,
				obj.x - Math.max(0, obj.width),
				obj.z - Math.max(0, obj.length),
				obj.y - Math.max(0, obj.height),
				obj.x + Math.max(0, obj.width),
				obj.z + Math.max(0, obj.length),
				obj.y + Math.max(0, obj.height)
			);
			
			if(in_rect && 1 > in_rect)return in_rect;
		}
	}
	set_aim_point(aim_point){
		this.aim_point = aim_point;
		
		return this.can_see = this.data.utils.obstructing(aim_point) == null ? true : false;
	}
	tick(){
		this.position.set(this.entity.x, this.entity.y, this.entity.z);
		this.velocity.set(this.entity.velocity.x, this.entity.velocity.y, this.entity.velocity.z);
		
		this.hitbox.min.set(
			this.position.x - this.hitbox_scale,
			this.position.y,
			this.position.z - this.hitbox_scale,
		);
		
		this.hitbox.max.set(
			this.position.x + this.hitbox_scale,
			this.position.y + this.height + this.hitbox_pad,
			this.position.z + this.hitbox_scale,
		);
		
		this.hitbox.head.max.copy(this.hitbox.max);
		this.hitbox.head.min.copy(this.hitbox.min);
		
		// precise offset is 1.5
		// offset of 1 makes multi aim more accurate
		this.hitbox.head.min.y = this.hitbox.max.y - this.entity.headScale - 0.5;
		
		this.parts.hitbox_head.copy(this.position).y = this.position.y + this.height;
		
		if(this.is_you)return;
		
		this.rect = this.calc_rect();
		
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