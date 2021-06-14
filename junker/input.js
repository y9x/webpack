'use strict';

var main = require('./main'),
	vars = require('../libs/vars'),
	InputData = require('../libs/inputdata'),
	{ Vector3 } = require('../libs/space'),
	{ api, utils } = require('../libs/consts');

class Input {
	push(array){
		if(main.me && main.controls)try{
			var data = new InputData(array);
			
			this.modify(data);
			
			InputData.previous = data;
		}catch(err){
			api.report_error('input', err);
		}
		
		return array;
	}
	modify(data){
		let isMelee = utils.isDefined(main.me.weapon.melee)&&main.me.weapon.melee||utils.isDefined(main.me.weapon.canThrow)&&main.me.weapon.canThrow;
		let ammoLeft = main.me[vars.ammos][main.me[vars.weaponIndex]];

		// autoReload
		if(main.config.aim.auto_reload && !ammoLeft){
			main.game.players.reload(main.me);
			data.reload = 1;
		}
		
		//Auto Bhop
		if(data.focused && main.config.player.bhop != 'off') {
			if(data.keys.Space || main.config.player.bhop.startsWith('auto')){
				main.controls.keys[main.controls.binds.jump.val] ^= 1;
				
				if(main.controls.keys[main.controls.binds.jump.val])main.controls.didPressed[main.controls.binds.jump.val] = 1;
				
				if(data.keys.Space || main.config.player.bhop == 'autoslide') {
					if (main.me[vars.yVel] < -0.03 && main.me.canSlide) {
						setTimeout(() => {
							main.controls.keys[main.controls.binds.crouch.val] = 0;
						}, main.me.slideTimer||325);
						main.controls.keys[main.controls.binds.crouch.val] = 1;
						main.controls.didPressed[main.controls.binds.crouch.val] = 1;
					}
				}
			}
		}

		//Autoaim
		if (main.config.aim.status !== "off") {
			let playerMaps = []
			
			let target = null, targets = main.game.players.list.filter(enemy => {
				let hostile = undefined !== enemy[vars.objInstances] && enemy[vars.objInstances] && !enemy[vars.isYou] && !main.getIsFriendly(enemy) && enemy.health > 0 && main.getInView(enemy);
				if (hostile) playerMaps.push( enemy[vars.objInstances] );
				return hostile
			})

			if(main.config.aim.fov != 'off') {
				let scaledWidth = main.ctx.canvas.width / main.scale;
				let scaledHeight = main.ctx.canvas.height / main.scale;
				for (let i = 0; i < targets.length; i++) {
					const t = targets[i];
					const sp = utils.pos2d(new Vector3(t.x, t.y, t.z), scaledWidth, scaledHeight, t.height / 2);
					let fov_box = main.fov_box;
					
					if (sp.x >= fov_box[0] && sp.x <= (fov_box[0] + fov_box[2]) && sp.y >= fov_box[1] && sp.y < (fov_box[1] + fov_box[3])) {
						target = targets[i]
						break
					}
				}
			}

			else target = targets.sort((p1, p2) => utils.getD3D(main.me.x, main.me.z, p1.x, p1.z) - utils.getD3D(main.me.x, main.me.z, p2.x, p2.z)).shift();

			if (target) {
				let obj = target[vars.objInstances];
				let pos = obj.position.clone();
				let rot = {
					y: utils.getDir(main.me.z, main.me.x, pos.z||target.z, pos.x||target.x) || 0,
					x: (utils.getXDire(main.me.x, main.me.y, main.me.z, pos.x||target.x, pos.y||target.y - target[vars.crouchVal] * vars.consts.crouchDst + main.me[vars.crouchVal] * vars.consts.crouchDst + main.config.aim.offset, pos.z||target.z) || 0) - vars.consts.recoilMlt * main.me[vars.recoilAnimY],
				};
				
				let vis = pos.clone();
				vis.y += vars.consts.playerHeight + vars.consts.nameOffset - (target[vars.crouchVal] * vars.consts.crouchDst);
				if (target.hatIndex >= 0) vis.y += vars.consts.nameOffsetHat;
				let dstDiv = Math.max(0.3, (1 - (utils.getD3D(main.me.x, main.me.y, main.me.z, vis.x, vis.y, vis.z) / 600)));
				let fSize = (20 * dstDiv);
				let visible = (fSize >= 1 && utils.contains_point(vis));

				if (main.me.weapon[vars.nAuto] && main.me[vars.didShoot]) {
					data.shoot = 0;
					data.scope = 0;
					main.me.inspecting = false;
					main.me.inspectX = 0;
				}
				else if (!visible && main.config.aim.frustrum_check)1;
				else if (ammoLeft||isMelee) {
					switch (main.config.aim.status) {
						case'assist':
							if(data.scope) {
								if(!main.me.aimDir && visible){
									if(main.config.aim.smooth)rot = this.smooth({ xD: rot.x, yD: rot.y });
									
									// if(!main.me.canThrow||!isMelee)this.aim_camera(rot);
									
									this.aim_camera(rot, data);
								}
							}
							break;
						case'auto':
							
							data.scope = (!visible && main.config.aim.frustrum_check)?0:1;
							
							if (!main.me[vars.aimVal]||main.me.weapon.noAim){
								if (!main.me.canThrow||!isMelee)data.shoot = 1;
							} else data.scope = 1;
							
							this.aim_input(rot, data);
							
							break;
						case'trigger':
							
							let ray = new utils.three.Raycaster();
							
							ray.setFromCamera({ x: 0, y: 0 }, utils.world.fpsCamera);
							
							let inCast = ray.intersectObjects(playerMaps, true).length;
							
							if (data.scope && inCast) {
								data.shoot = 1;
								this.aim_input(rot);
							}
							
							break;
						case'correction':
						
							if (data.shoot == 1)this.aim_input(rot);
							
							break;
					}
				}
			}
		}
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
	lookDir(xDire, yDire) {
		xDire = xDire / 1000
		yDire = yDire / 1000
		main.controls.object.rotation.y = yDire
		main.controls[vars.pchObjc].rotation.x = xDire;
		main.controls[vars.pchObjc].rotation.x = Math.max(-vars.consts.halfPI, Math.min(vars.consts.halfPI, main.controls[vars.pchObjc].rotation.x));
		main.controls.yDr = (main.controls[vars.pchObjc].rotation.x % Math.PI).round(3);
		main.controls.xDr = (main.controls.object.rotation.y % Math.PI).round(3);
		utils.world.camera.updateProjectionMatrix();
		utils.world.updateFrustum();
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
};

module.exports = Input;