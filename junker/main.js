 'use strict';

var CRC2d = CanvasRenderingContext2D.prototype,
	{ api, meta, utils } = require('../libs/consts'),
	vars = require('../libs/vars');

vars.load(require('./vars'));

class Main {
	constructor() {
		global[vars.key] = this;
		
		this.utils = utils;
		
		this.tabs = ['Render','Weapon','Player','GamePlay','Radio','Dev'];

		this.downKeys = new Set();
		this.nameTags = undefined;
		
		this.eventHandlers();
		
		this.menu = require('./settings.js');
		
		var token_promise = api.token(),
			config_promise = this.menu.load_config();
		
		api.source().then(async source => {
			await config_promise;
			if(this.config.ui.show_button)this.menu.button.show();
			
			new Function('WP_fetchMMToken', vars.key, vars.patch(source))(token_promise, this);
			this.gameHooks();
		});
		
		this.skin_array = [...Array(5000)].map((e, i) => ({ ind: i, cnt: 1 }));
	}
	get config(){
		return this.menu.config;
	}
	onInput(input) {
		if (!this.settings || !utils.isDefined(this.me)) return input;
		let isMelee = utils.isDefined(this.me.weapon.melee)&&this.me.weapon.melee||utils.isDefined(this.me.weapon.canThrow)&&this.me.weapon.canThrow;
		let ammoLeft = this.me[vars.ammos][this.me[vars.weaponIndex]];

		// autoReload
		if(this.config.aim.auto_reload){
			//let capacity = this.me.weapon.ammo;
			//if (ammoLeft < capacity)
			if (isMelee) {
				if (!this.me.canThrow) {
					//this.me.refillKnife();
				}
			} else if (!ammoLeft) {
				this.game.players.reload(this.me);
				input[vars.keys.reload] = 1;
				// this.me[vars.reloadTimer] = 1;
				//this.me.resetAmmo();
			}
		}

		//Auto Bhop
		if(this.config.player.bhop != 'off') {
			if(this.downKeys.has('Space') || this.config.player.bhop.startsWith('auto')){
				this.controls.keys[this.controls.binds.jump.val] ^= 1;
				
				if(this.controls.keys[this.controls.binds.jump.val])this.controls.didPressed[this.controls.binds.jump.val] = 1;
				
				if(this.downKeys.has('Space') || this.config.player.bhop == 'autoslide') {
					if (this.me[vars.yVel] < -0.03 && this.me.canSlide) {
						setTimeout(() => {
							this.controls.keys[this.controls.binds.crouch.val] = 0;
						}, this.me.slideTimer||325);
						this.controls.keys[this.controls.binds.crouch.val] = 1;
						this.controls.didPressed[this.controls.binds.crouch.val] = 1;
					}
				}
			}
		}

		//Autoaim
		if (this.config.aim.status !== "off") {
			this.ray.setFromCamera(this.vec2, this.renderer.fpsCamera);
			const playerMaps = []
			let target = null, targets = this.game.players.list.filter(enemy => {
				let hostile = undefined !== enemy[vars.objInstances] && enemy[vars.objInstances] && !enemy[vars.isYou] && !this.getIsFriendly(enemy) && enemy.health > 0 && this.getInView(enemy);
				if (hostile) playerMaps.push( enemy[vars.objInstances] );
				return hostile
			})

			if(this.config.aim.fov != 'off') {
				let scaledWidth = this.ctx.canvas.width / this.scale;
				let scaledHeight = this.ctx.canvas.height / this.scale;
				for (let i = 0; i < targets.length; i++) {
					const t = targets[i];
					const sp = utils.pos2d(new this.three.Vector3(t.x, t.y, t.z), scaledWidth, scaledHeight, t.height / 2);
					let fov_box = this.fov_box;
					
					if (sp.x >= fov_box[0] && sp.x <= (fov_box[0] + fov_box[2]) && sp.y >= fov_box[1] && sp.y < (fov_box[1] + fov_box[3])) {
						target = targets[i]
						break
					}
				}
			}

			else target = targets.sort((p1, p2) => utils.getD3D(this.me.x, this.me.z, p1.x, p1.z) - utils.getD3D(this.me.x, this.me.z, p2.x, p2.z)).shift();

			if (target) {
				let obj = target[vars.objInstances];
				let pos = obj.position.clone();
				let yDire = (utils.getDir(this.me.z, this.me.x, pos.z||target.z, pos.x||target.x) || 0) * 1000;
				let xDire = ((utils.getXDire(this.me.x, this.me.y, this.me.z, pos.x||target.x, pos.y||target.y - target[vars.crouchVal] * vars.consts.crouchDst + this.me[vars.crouchVal] * vars.consts.crouchDst /*FIX AIMOFFSET + this.config.aim.offset*/, pos.z||target.z) || 0) - vars.consts.recoilMlt * this.me[vars.recoilAnimY]) * 1000;
				let inCast = this.ray.intersectObjects(playerMaps, true).length//this.ray.intersectObjects(this.game.map.objects, true, obj) == obj;

				let vis = pos.clone();
				vis.y += vars.consts.playerHeight + vars.consts.nameOffset - (target[vars.crouchVal] * vars.consts.crouchDst);
				if (target.hatIndex >= 0) vis.y += vars.consts.nameOffsetHat;
				let dstDiv = Math.max(0.3, (1 - (utils.getD3D(this.me.x, this.me.y, this.me.z, vis.x, vis.y, vis.z) / 600)));
				let fSize = (20 * dstDiv);
				let visible = (fSize >= 1 && utils.contains_point(vis));

				if (this.me.weapon[vars.nAuto] && this.me[vars.didShoot]) {
					input[vars.keys.shoot] = 0;
					input[vars.keys.scope] = 0;
					this.me.inspecting = false;
					this.me.inspectX = 0;
				}
				else if (!visible && this.config.aim.frustrum_check) this.resetLookAt();
				else if (ammoLeft||isMelee) {
					switch (this.config.aim.status) {
						case "quickScope":
							input[vars.keys.scope] = (!visible && this.config.aim.frustrum_check)?0:1;
							if (!this.me[vars.aimVal]||this.me.weapon.noAim) {
								if (!this.me.canThrow||!isMelee) {
									this.lookDir(xDire, yDire);
									input[vars.keys.shoot] = 1;
								}
								input[vars.keys.ydir] = yDire
								input[vars.keys.xdir] = xDire
							}
							break;
						case "assist": case "easyassist":
							if (input[vars.keys.scope] || this.config.aim.status === "easyassist") {
								if (!this.me.aimDir && visible || this.config.aim.status === "easyassist") {
									if(!this.me.canThrow||!isMelee){
										this.lookDir(xDire, yDire);
									}
									if (this.config.aim.status === "easyassist" && this.controls[vars.mouseDownR]) input[vars.keys.scope] = 1;
									input[vars.keys.ydir] = yDire
									input[vars.keys.xdir] = xDire
								}
							}
							break;
						case "silent":
							input[vars.keys.scope] = (!visible && this.config.aim.frustrum_check)?0:1;
							if (!this.me[vars.aimVal]||this.me.weapon.noAim) {
								if (!this.me.canThrow||!isMelee) input[vars.keys.shoot] = 1;
							} else input[vars.keys.scope] = 1;
							input[vars.keys.ydir] = yDire
							input[vars.keys.xdir] = xDire
							break;
						case "trigger":
							if (input[vars.keys.scope] && inCast) {
								input[vars.keys.shoot] = 1;
								input[vars.keys.ydir] = yDire
								input[vars.keys.xdir] = xDire
							}
							break;
						case "correction":
							if (input[vars.keys.shoot] == 1) {
								input[vars.keys.ydir] = yDire
								input[vars.keys.xdir] = xDire
							}
							break;
						default:
							this.resetLookAt();
							break;
					}
				}
			} else {
				this.resetLookAt();
			}
		}
		
		return input;
	}
	get fov_box(){
		switch(this.config.aim.fov){
			case'large':
				return [scaledWidth / 3, scaledHeight / 4, scaledWidth * (1 / 3), scaledHeight / 2];
				
				break;
			case'medium':
				return [scaledWidth * 0.4, scaledHeight / 3, scaledWidth * 0.2, scaledHeight / 3];
				
				break;
			case'small':
				return [scaledWidth * 0.45, scaledHeight * 0.4, scaledWidth * 0.1, scaledHeight * 0.2];
				
				break;
		}
	}
	onRender() {
		let main = this;
		let scaledWidth = this.ctx.canvas.width / this.scale;
		let scaledHeight = this.ctx.canvas.height / this.scale;
		let playerScale = (2 * vars.consts.armScale + vars.consts.chestWidth + vars.consts.armInset) / 2
		let worldPosition = this.renderer.camera[vars.getWorldPosition]();
		let espVal = this.config.esp.status;
		
		for(let player of this.game.players.list){
			if(!player || player[vars.isYou] || !player.active || !utils.isDefined(player[vars.objInstances]))continue;
			
			let isEnemy = !this.me.team || this.me.team != player.team;
			let isRisky = player.isDev || player.isMod || player.isMapMod || player.canGlobalKick || player.canViewReports || player.partnerApp || player.canVerify || player.canTeleport || player.kpdData || player.fakeName || player.level >= 100;

			// Chams
			if (!player[vars.objInstances].visible) {
				Object.defineProperty(player[vars.objInstances], 'visible', {
					value: true,
					writable: false
				});
			} else {
				player[vars.objInstances].traverse(obj => {
					if (obj && obj.type=='Mesh' && obj.hasOwnProperty('material')) {
						if (!obj.hasOwnProperty('_material')) {
							obj._material = obj.material;
						} else {
							Object.defineProperty(obj, 'material', {
								get() {
									if (utils.isDefined(main.mesh) && main.config.esp.chams) {
										return main.mesh[ isEnemy ? isRisky ? "#FFFF00" : main.config.esp.rainbow ? main.overlay.rainbow.col : main.config.esp.hostile_col : main.config.esp.friendly_col];
									}
									return this._material;
								}, set(val) {return this._material}
							});
						}

						obj.material.wireframe = main.config.esp.wireframe;
					}
				})
			}
			
			//ESP
			// the below variables correspond to the 2d box esps corners
			let xmin = Infinity;
			let xmax = -Infinity;
			let ymin = Infinity;
			let ymax = -Infinity;
			let position = null;
			let br = false;
			for (let j = -1; !br && j < 2; j+=2) {
				for (let k = -1; !br && k < 2; k+=2) {
					for (let l = 0; !br && l < 2; l++) {
						if (position = player[vars.objInstances].position.clone()) {
							position.x += j * playerScale;
							position.z += k * playerScale;
							position.y += l * (player.height - player[vars.crouchVal] * vars.consts.crouchDst);
							if (!utils.contains_point(position)) {
								br = true;
								break;
							}
							position.project(this.renderer.camera);
							xmin = Math.min(xmin, position.x);
							xmax = Math.max(xmax, position.x);
							ymin = Math.min(ymin, position.y);
							ymax = Math.max(ymax, position.y);
						}
					}
				}
			}

			if (br) {
				continue;
			}

			xmin = (xmin + 1) / 2;
			ymin = (ymin + 1) / 2;
			xmax = (xmax + 1) / 2;
			ymax = (ymax + 1) / 2;

			// save and restore these variables later so they got nothing on us
			const original_strokeStyle = this.ctx.strokeStyle;
			const original_lineWidth = this.ctx.lineWidth;
			const original_font = this.ctx.font;
			const original_fillStyle = this.ctx.fillStyle;

			//Tracers
			if(this.config.esp.tracers){
				CRC2d.save.apply(this.ctx, []);
				let screenPos = utils.pos2d(player[vars.objInstances].position);
				this.ctx.lineWidth = 1;
				this.ctx.beginPath();
				this.ctx.moveTo(this.ctx.canvas.width/2, this.ctx.canvas.height - (this.ctx.canvas.height - scaledHeight));
				this.ctx.lineTo(screenPos.x, screenPos.y);
				this.ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
				this.ctx.stroke();
				this.ctx.lineWidth = 1;
				this.ctx.strokeStyle = isEnemy ? isRisky ? "#FFFF00" : main.config.esp.hostile_col||"#ff0000" : main.config.esp.friendly_col||"#00ff00"//this.settings.rainbowColor.val ? this.overlay.rainbow.col : "#eb5656"
				this.ctx.stroke();
				CRC2d.restore.apply(this.ctx, []);
			}

			CRC2d.save.apply(this.ctx, []);
			if (espVal == "box" || espVal == "full") {
				// perfect box esp
				this.ctx.lineWidth = 5;
				this.ctx.strokeStyle = isEnemy ? isRisky ? "#FFFF00" : main.config.esp.hostile_col||"#ff0000" : main.config.esp.friendly_col;
				let distanceScale = Math.max(.3, 1 - utils.getD3D(worldPosition.x, worldPosition.y, worldPosition.z, player.x, player.y, player.z) / 600);
				CRC2d.scale.apply(this.ctx, [distanceScale, distanceScale]);
				let xScale = scaledWidth / distanceScale;
				let yScale = scaledHeight / distanceScale;
				CRC2d.beginPath.apply(this.ctx, []);
				ymin = yScale * (1 - ymin);
				ymax = yScale * (1 - ymax);
				xmin = xScale * xmin;
				xmax = xScale * xmax;
				CRC2d.moveTo.apply(this.ctx, [xmin, ymin]);
				CRC2d.lineTo.apply(this.ctx, [xmin, ymax]);
				CRC2d.lineTo.apply(this.ctx, [xmax, ymax]);
				CRC2d.lineTo.apply(this.ctx, [xmax, ymin]);
				CRC2d.lineTo.apply(this.ctx, [xmin, ymin]);
				CRC2d.stroke.apply(this.ctx, []);

				if (espVal == "full") {
					// health bar
					this.ctx.fillStyle = "#000000";
					let barMaxHeight = ymax - ymin;
					CRC2d.fillRect.apply(this.ctx, [xmin - 7, ymin, -10, barMaxHeight]);
					this.ctx.fillStyle = player.health > 75 ? "green" : player.health > 40 ? "orange" : "red";
					CRC2d.fillRect.apply(this.ctx, [xmin - 7, ymin, -10, barMaxHeight * (player.health / player[vars.maxHealth])]);
					// info
					this.ctx.font = "Bold 48px Tahoma";
					this.ctx.fillStyle = "white";
					this.ctx.strokeStyle='black';
					this.ctx.lineWidth = 1;
					let x = xmax + 7;
					let y = ymax;
					CRC2d.fillText.apply(this.ctx, [player.name||player.alias, x, y]);
					CRC2d.strokeText.apply(this.ctx, [player.name||player.alias, x, y]);
					this.ctx.font = "Bold 30px Tahoma";
					this.ctx.fillStyle = "#cccccc";
					y += 35;
					CRC2d.fillText.apply(this.ctx, [player.weapon.name, x, y]);
					CRC2d.strokeText.apply(this.ctx, [player.weapon.name, x, y]);
					y += 35;
					this.ctx.fillStyle = player.health > 75 ? "green" : player.health > 40 ? "orange" : "red";
					CRC2d.fillText.apply(this.ctx, [player.health + ' HP', x, y]);
					CRC2d.strokeText.apply(this.ctx, [player.health + ' HP', x, y]);
				}
			}

			CRC2d.restore.apply(this.ctx, []);
			this.ctx.strokeStyle = original_strokeStyle;
			this.ctx.lineWidth = original_lineWidth;
			this.ctx.font = original_font;
			this.ctx.fillStyle = original_fillStyle;
		}

		if (this.config.aim.fov != 'off') {
			CRC2d.save.apply(this.ctx, []);
			this.ctx.strokeStyle = "red"
			this.ctx.strokeRect(...this.fov_box)
			CRC2d.restore.apply(this.ctx, []);
		}
	}
	async gameHooks() {
		let main = this;
		
		let exports = await utils.wait_for(() => this.exports);
		
		let toFind = {
			overlay: ["render", "canvas"],
			gconfig: ["accAnnounce", "availableRegions", "assetCat"],
			three: ["ACESFilmicToneMapping", "TextureLoader", "ObjectLoader"],
		};
		
		for (let rootKey in exports) {
			let exp = exports[rootKey].exports;
			for (let name in toFind) {
				if (utils.objectHas(exp, toFind[name])) {
					console.info("Found Export ", name);
					delete toFind[name];
					this[name] = exp;
				}
			}
		}
		
		utils.three = this.three;
		
		if (!(Object.keys(toFind).length === 0 && toFind.constructor === Object)) {
			for (let name in toFind) {
				alert("Failed To Find Export " + name);
			}
		} else {
			Object.defineProperties(this.gconfig, {
				nameVisRate: {
					value: 0,
					writable: false
				},
				//serverBrowserRate: {
				//    value: 0,
				//    writable: false
				//},
				serverTickFrequency: {
					value: 60,
					writable: false
				},
				syncRate: {
					value: 0,
					writable: false
				},
				hitBoxPad: {
					value: 0,
					writable: false
				},
			});

			this.ray = new this.three.Raycaster();
			this.vec2 = new this.three.Vector2(0, 0);
			this.mesh = new Proxy({}, {
				get(target, prop){
					if(!target[prop]) {
						target[prop] = new main.three.MeshBasicMaterial({
							transparent: true,
							fog: false,
							depthTest: false,
							color: prop,
						});
					}
					return target[prop] ;
				},
			});
			
			utils.canvas = this.overlay.canvas;
			this.ctx = this.overlay.canvas.getContext('2d');
			this.overlay.render = new Proxy(this.overlay.render, {
				apply: (target, that, args) => {
					return [target.apply(that, args), this.overlayRender(args, ...args)]
				}
			});
		}
		utils.wait_for(() => this.ws).then(() => {
			this.wsEvent = this.ws._dispatchEvent.bind(this.ws);
			this.wsSend = this.ws.send.bind(this.ws);
			this.ws.send = new Proxy(this.ws.send, {
				apply: function(target, that, [type, ...msg]) {
					if (type=="ah2") return;
					if (type=="en") {
						let data = msg[0];
						if (data) {
							main.skinData = Object.assign({}, {
								main: data[2][0],
								secondary: data[2][1],
								hat: data[3],
								body: data[4],
								knife: data[9],
								dye: data[14],
								waist: data[17],
							});
						}
					}

					return target.apply(that, [type, ...msg]);
				}
			})

			this.ws._dispatchEvent = new Proxy(this.ws._dispatchEvent, {
				apply: function(target, that, [type, ...msg]) {
					if (type =="init") {
						let pInfo = msg[0];
						if(pInfo[10] && pInfo[10].bill && main.settings && main.settings.customBillboard.val.length > 1) {
							pInfo[10].bill.txt = main.settings.customBillboard.val;
						}
					}

					if (type=="0") {
						let pData = msg[0][0];
						let pSize = 39;
						while (pData.length % pSize !== 0) pSize++;
						for(let i = 0; i < pData.length; i += pSize) {
							if (pData[i] === main.ws.socketId||0) {
								pData[i + 12] = [main.skinData.main, main.skinData.secondary];
								pData[i + 13] = main.skinData.hat;
								pData[i + 14] = main.skinData.body;
								pData[i + 19] = main.skinData.knife;
								pData[i + 24] = main.skinData.dye;
								pData[i + 33] = main.skinData.waist;
							}
						}
					}
					if (type=="3") {
						if (msg[0][4]) {
							msg[0][4].wId=0;
							msg[0][4].hs=true;
							 msg[0][4].dst=Infinity
							msg[0][4].wb=true;
						}

					}
					
					return target.apply(that, [type, ...msg]);
				}
			})
		})
	}
	overlayRender(renderArgs, scale, game, controls, renderer, me){
		let width = this.overlay.canvas.width / scale;
		let height = this.overlay.canvas.height / scale;
		
		if (controls && typeof this.settings == "object" && this.___config.game.inactivity) {
			controls.idleTimer = 0;
			if (utils.isDefined(this.gconfig))this.gconfig.kickTimer = Infinity;
		}
		if (me) {
			if (me.active && me.health) controls.update();
			if (me.banned) Object.assign(me, {banned: false});
			if (me.isHacker) Object.assign(me, {isHacker: 0});
			if (me.kicked) Object.assign(me, {kicked: false});
			if (me.kickedByVote) Object.assign(me, {kickedByVote: false});
			me.account = Object.assign(me, {premiumT: true});
			
			this.renderer = utils.world = renderer;
			this.scale = scale;
			this.game = utils.game = game;
			this.controls = controls;
			this.me = me;
			
			this.ctx.save();
			this.ctx.scale(scale, scale);
			// this.ctx.clearRect(0, 0, width, height);
			this.onRender();
			this.ctx.restore();
		}
		
		if(this.config.auto_nuke && this.me && Object.keys(this.me.streaks).length == 25)this.wsSend("k", 0);
		
		if(this.config.game.auto_start){
			if(window.endUI.style.display == "none" && window.windowHolder.style.display == 'none')controls.toggle(true);
		}
	}
	skins(ent){
		return this.config.player.skins && ent != null && ent.stats ? this.skin_array : ent.skins;
	}
	eventHandlers() {
		window.addEventListener('load', (event) => {
			console.log('page is fully loaded');
			
			utils.add_ele('style', document.documentElement, { textContent: require('./index.css') });
			
			api.on_instruct = () => {
				if(this.config.game.auto_lobby){
					if(['Kicked', 'Banned', 'Disconnected', 'Error', 'Game is full'].some(text => target && target.innerHTML.includes(text))){
						location = document.location.origin;
					}
				}
			};
			
			window.addEventListener('keyup', event =>{
				if (this.downKeys.has(event.code)) this.downKeys.delete(event.code)
			});
			
			window.addEventListener('keydown', event =>{
				if ('INPUT' == document.activeElement.tagName) return;
				switch (event.code) {
					case 'F1':
						event.preventDefault();
						this.toggleMenu();
						break;

					case 'NumpadSubtract':
						document.exitPointerLock();
						console.dir(window)
						console.dir(this)
						break;
					default:
						if (!this.downKeys.has(event.code)) this.downKeys.add(event.code);
						break;
				}
			});
		});
	}
	lookDir(xDire, yDire) {
		xDire = xDire / 1000
		yDire = yDire / 1000
		this.controls.object.rotation.y = yDire
		this.controls[vars.pchObjc].rotation.x = xDire;
		this.controls[vars.pchObjc].rotation.x = Math.max(-vars.consts.halfPI, Math.min(vars.consts.halfPI, this.controls[vars.pchObjc].rotation.x));
		this.controls.yDr = (this.controls[vars.pchObjc].rotation.x % Math.PI).round(3);
		this.controls.xDr = (this.controls.object.rotation.y % Math.PI).round(3);
		this.renderer.camera.updateProjectionMatrix();
		this.renderer.updateFrustum();
	}
	resetLookAt() {
		this.controls.yDr = this.controls[vars.pchObjc].rotation.x;
		this.controls.xDr = this.controls.object.rotation.y;
		this.renderer.camera.updateProjectionMatrix();
		this.renderer.updateFrustum();
	}
	getInView(entity){
		return null == utils.obstructing(this.me, entity, (!this.me || this.me.weapon && this.me.weapon.pierce) && this.config.aim.wallbangs);
	}
	getIsFriendly(entity) {
		return (this.me && this.me.team ? this.me.team : this.me.spectating ? 0x1 : 0x0) == entity.team
	}
};

module.exports = new Main();