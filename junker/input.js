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
		if(main.config.aim.auto_reload){
			//let capacity = main.me.weapon.ammo;
			//if (ammoLeft < capacity)
			if (isMelee) {
				if (!main.me.canThrow) {
					//main.me.refillKnife();
				}
			} else if (!ammoLeft) {
				main.game.players.reload(main.me);
				data.reload = 1;
				// main.me[vars.reloadTimer] = 1;
				//main.me.resetAmmo();
			}
		}
		
		//Auto Bhop
		if(main.config.player.bhop != 'off') {
			if(main.downKeys.has('Space') || main.config.player.bhop.startsWith('auto')){
				main.controls.keys[main.controls.binds.jump.val] ^= 1;
				
				if(main.controls.keys[main.controls.binds.jump.val])main.controls.didPressed[main.controls.binds.jump.val] = 1;
				
				if(main.downKeys.has('Space') || main.config.player.bhop == 'autoslide') {
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
			let ray = new utils.three.Raycaster();
			
			ray.setFromCamera({ x: 0, y: 0 }, main.world.fpsCamera);
			
			const playerMaps = []
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
				let yDire = (utils.getDir(main.me.z, main.me.x, pos.z||target.z, pos.x||target.x) || 0) * 1000;
				let xDire = ((utils.getXDire(main.me.x, main.me.y, main.me.z, pos.x||target.x, pos.y||target.y - target[vars.crouchVal] * vars.consts.crouchDst + main.me[vars.crouchVal] * vars.consts.crouchDst /*FIX AIMOFFSET + main.config.aim.offset*/, pos.z||target.z) || 0) - vars.consts.recoilMlt * main.me[vars.recoilAnimY]) * 1000;
				let inCast = ray.intersectObjects(playerMaps, true).length;
				
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
				else if (!visible && main.config.aim.frustrum_check) main.resetLookAt();
				else if (ammoLeft||isMelee) {
					switch (main.config.aim.status) {
						case "assist":
							if (data.scope) {
								if (!main.me.aimDir && visible) {
									if(!main.me.canThrow||!isMelee)main.lookDir(xDire, yDire);
									
									data.ydir = yDire
									data.xdir = xDire
								}
							}
							break;
						case "auto":
							data.scope = (!visible && main.config.aim.frustrum_check)?0:1;
							
							if (!main.me[vars.aimVal]||main.me.weapon.noAim) {
								if (!main.me.canThrow||!isMelee) data.shoot = 1;
							} else data.scope = 1;
							
							data.ydir = yDire
							data.xdir = xDire
							break;
						case "trigger":
							if (data.scope && inCast) {
								data.shoot = 1;
								data.ydir = yDire
								data.xdir = xDire
							}
							break;
						case "correction":
							if (data.shoot == 1) {
								data.ydir = yDire
								data.xdir = xDire
							}
							break;
						default:
							main.resetLookAt();
							break;
					}
				}
			} else {
				main.resetLookAt();
			}
		}
	}
};

module.exports = Input;