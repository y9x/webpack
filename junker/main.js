 'use strict';

var CRC2d = CanvasRenderingContext2D.prototype,
	{ api, meta, utils } = require('../libs/consts'),
	vars = require('../libs/vars');

vars.load(require('./vars'));

class Main {
	constructor() {
		global[vars.key] = this;
		
		this.utils = utils;
		
		this.downKeys = new Set();
		
		this.eventHandlers();
		
		this.menu = require('./settings.js');
		
		this.skins = [...Array(5000)].map((e, i) => ({ ind: i, cnt: 1 }));
	}
	async load(){
		var Input = require('./input'),
			self = this;
		
		this.input = new Input();
		
		var token_promise = api.token(),
			config_promise = this.menu.load_config(),
			game_arg = {
				game: game => {
					this.game = utils.game = game;
					Object.defineProperty(game, 'controls', {
						configurable: true,
						set: controls => {
							// delete definition
							delete game.controls;
							
							var timer = 0;
							
							Object.defineProperty(controls, 'idleTimer', {
								get: _ => this.config.game.inactivity ? 0 : timer,
								set: value => timer = value,
							});
							
							return this.controls = utils.controls = game.controls = controls;
						},
					});
				},
				three(three){
					utils.three = three;
					
					self.mesh = new Proxy({}, {
						get(target, prop){
							if(!target[prop]) {
								target[prop] = new three.MeshBasicMaterial({
									transparent: true,
									fog: false,
									depthTest: false,
									color: prop,
								});
							}
							return target[prop] ;
						},
					});
				},
				set socket(socket){
					self.wsEvent = socket._dispatchEvent.bind(socket);
					self.wsSend = socket.send.bind(socket);
					
					socket.send = new Proxy(socket.send, {
						apply(target, that, [type, ...msg]){
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

					socket._dispatchEvent = new Proxy(socket._dispatchEvent, {
						apply(target, that, [type, ...msg]){
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
									if (pData[i] === socket.socketId||0) {
										pData[i + 12] = [main.skinData.main, main.skinData.secondary];
										pData[i + 13] = main.skinData.hat;
										pData[i + 14] = main.skinData.body;
										pData[i + 19] = main.skinData.knife;
										pData[i + 24] = main.skinData.dye;
										pData[i + 33] = main.skinData.waist;
									}
								}
							}
							
							return target.apply(that, [type, ...msg]);
						}
					});
				},
				world: world => utils.world = this.world = world,
				can_see: inview => this.config.esp.status == 'full' ? false : (this.config.esp.nametags || inview),
				skins: ent => this.config.game.skins && typeof ent == 'object' && ent != null && ent.stats ? this.skins : ent.skins,
				timer: (object, property, timer) => Object.defineProperty(object, property, {
					get: _ => this.config.game.inactivity ? 0 : timer,
					set: value => this.config.game.inactivity ? Infinity : timer,
				}),
				input: this.input.push.bind(this.input),
				render(orig, overlay){
					self.overlay = overlay;
					
					utils.canvas = document.querySelector('#game-overlay');
					
					self.ctx = utils.canvas.getContext('2d');
					
					overlay.render = function(...args){
						var ret = orig.call(this, ...args);
						
						self.overlayRender(...args);
						
						return ret;
					}
				}
			};
		
		await config_promise;
		if(this.config.ui.show_button)this.menu.button.show();
		
		new Function('WP_fetchMMToken', vars.key, vars.patch(await api.source()))(token_promise, game_arg);
	}
	get config(){
		return this.menu.config;
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
		let scaledWidth = utils.canvas.width / this.scale;
		let scaledHeight = utils.canvas.height / this.scale;
		let playerScale = (2 * vars.consts.armScale + vars.consts.chestWidth + vars.consts.armInset) / 2
		let worldPosition = this.world.camera[vars.getWorldPosition]();
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
							position.project(this.world.camera);
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
				this.ctx.moveTo(utils.canvas.width/2, utils.canvas.height - (utils.canvas.height - scaledHeight));
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
	overlayRender(scale, game, controls, world, me){
		let width = utils.canvas.width / scale;
		let height = utils.canvas.height / scale;
		
		if (me) {
			/*if (me.active && me.health) controls.update();
			if (me.banned) Object.assign(me, {banned: false});
			if (me.isHacker) Object.assign(me, {isHacker: 0});
			if (me.kicked) Object.assign(me, {kicked: false});
			if (me.kickedByVote) Object.assign(me, {kickedByVote: false});
			me.account = Object.assign(me, {premiumT: true});*/
			
			this.scale = scale;
			this.me = me;
			
			this.ctx.save();
			this.ctx.scale(scale, scale);
			// this.ctx.clearRect(0, 0, width, height);
			this.onRender();
			this.ctx.restore();
		}
		
		if(this.config.auto_nuke && this.me && Object.keys(this.me.streaks).length == 25)this.wsSend("k", 0);
		
		if(this.config.game.auto_start && window.endUI.style.display == "none" && window.windowHolder.style.display == 'none')controls.toggle(true);
	}
	eventHandlers(){
		api.on_instruct = () => {
			if(this.config.game.auto_lobby){
				if(['Kicked', 'Banned', 'Disconnected', 'Error', 'Game is full'].some(text => target && target.innerHTML.includes(text))){
					location = document.location.origin;
				}
			}
		};
		window.addEventListener('load', event => {
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
		this.world.camera.updateProjectionMatrix();
		this.world.updateFrustum();
	}
	resetLookAt() {
		this.controls.yDr = this.controls[vars.pchObjc].rotation.x;
		this.controls.xDr = this.controls.object.rotation.y;
		this.world.camera.updateProjectionMatrix();
		this.world.updateFrustum();
	}
	getInView(entity){
		return null == utils.obstructing(this.me, entity, (!this.me || this.me.weapon && this.me.weapon.pierce) && this.config.aim.wallbangs);
	}
	getIsFriendly(entity) {
		return (this.me && this.me.team ? this.me.team : this.me.spectating ? 0x1 : 0x0) == entity.team
	}
};

var main = module.exports = new Main();

window.main = main;

main.load();