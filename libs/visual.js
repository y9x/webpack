'use strict';

var vars = require('../libs/vars'),
	{ utils } = require('../libs/consts');

class Visual {
	constructor(data){
		this.data = data;
		this.materials = new Map();
	}
	esp_mat(color){
		if(!this.materials.has(color))this.materials.set(color, new utils.three.MeshBasicMaterial({
			transparent: true,
			fog: false,
			depthTest: false,
			color: color,
		}));
		
		return this.materials.get(color);
	}
	tick(UI){
		this.canvas = UI.canvas;
		this.ctx = UI.ctx;
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}
	draw_text(text_x, text_y, font_size, lines){
		for(var text_index = 0; text_index < lines.length; text_index++){
			var line = lines[text_index], xoffset = 0;
			
			for(var sub_ind = 0; sub_ind < line.length; sub_ind++){
				var color = line[sub_ind][0],
					text = line[sub_ind][1],
					text_args = [ text, text_x + xoffset, text_y + text_index * (font_size + 2) ];
				
				this.ctx.fillStyle = color;
				this.ctx.strokeText(...text_args);
				this.ctx.fillText(...text_args);
				
				xoffset += this.ctx.measureText(text).width + 2;
			}
		}
	}
	fov(fov){
		var width = (this.canvas.width * fov) / 100,
			height = (this.canvas.height * fov) / 100;
		
		this.ctx.strokeStyle = '#000';
		this.ctx.lineWidth = 2;
		this.ctx.strokeRect((this.canvas.width - width) / 2, (this.canvas.height - height) / 2, width, height);
	}
	walls(){
		utils.world.scene.children.forEach(obj => {
			if(obj.type != 'Mesh' || !obj.dSrc || obj.material[Visual.hooked])return;
			
			obj.material[Visual.hooked] = true;
			
			var otra = obj.material.transparent,
				opac = obj.material.opacity;
			
			Object.defineProperties(obj.material, {
				opacity: {
					get: _ => opac * this.data.walls / 100,
					set: _ => opac = _,
				},
				transparent: {
					get: _ => this.data.walls != 100 ? true : otra,
					set: _ => otra = _,
				},
			});
		});
	}
	axis_join(player){
		return player ? ['x', 'y', 'z'].map(axis => axis + ': ' + player[axis].toFixed(2)).join(', ') : null;
	}
	overlay(){
		this.ctx.strokeStyle = '#000'
		this.ctx.font = '14px monospace';
		this.ctx.textAlign = 'start';
		this.ctx.lineWidth = 2.6;
		
		var data = {
			Player: this.data.player ? this.axis_join(this.data.player.position) : null,
			Target: this.data.target ? this.axis_join(this.data.target.position) : null,
			/*'Target FOV': this.data.target && this.data.target.in_fov,
			'Target Frustrum': this.data.target && this.data.target.frustum,
			'Target Active': this.data.target && this.data.target.active,
			'Target Can Target': this.data.target && this.data.target._can_target,*/
		};
		
		var lines = [];
		
		for(var key in data){
			var color = '#FFF',
				value = data[key];
			
			switch(typeof value){
				case'boolean':
					
					color = value ? '#0F0' : '#F00';
					value = value ? 'Yes' : 'No';
					
					break;
				case'number':
					
					color = '#00F';
					value = value.toFixed(2);
					
					break;
				case'object':
					
					value = 'N/A';
					
					break;
			}
			
			lines.push([ [ '#BBB', key + ': ' ], [ color, value ] ]);
		}
		
		this.draw_text(15, ((this.canvas.height / 2) - (lines.length * 14)  / 2), 14, lines);
	}
	box(player){
		this.ctx.strokeStyle = player.esp_color;
		this.ctx.lineWidth = 1.5;
		this.ctx.strokeRect(player.rect.left, player.rect.top, player.rect.width, player.rect.height);
	}
	tracer(player){
		this.ctx.strokeStyle = player.esp_color;
		this.ctx.lineWidth = 1.75;
		this.ctx.lineCap = 'round';
		
		this.ctx.beginPath();
		// bottom center
		this.ctx.moveTo(this.canvas.width / 2, this.canvas.height);
		// target center
		this.ctx.lineTo(player.rect.x, player.rect.bottom);
		this.ctx.stroke();
	}
	get can_draw_chams(){
		return ['chams', 'box_chams', 'full'].includes(this.data.esp);
	}
	cham(player){
		if(!player.obj[Visual.hooked]){
			player.obj[Visual.hooked] = true;
			
			let visible = true;
			
			Object.defineProperty(player.obj, 'visible', {
				get: _ => this.can_draw_chams || visible,
				set: _ => visible = _,
			});
		}
		
		player.obj.traverse(obj => {
			if(obj.type != 'Mesh' || obj[Visual.hooked])return;
			
			obj[Visual.hooked] = true;
			
			var orig_mat = obj.material;
			
			Object.defineProperty(obj, 'material', {
				get: _ => {
					var material = this.can_draw_chams ? this.esp_mat(player.esp_color) : orig_mat;
					
					material.wireframe = this.data.wireframe;
					
					return material;
				},
				set: _ => orig_mat = _,
			});
		});
	}
	label(player){
		for(var part in player.parts){
			var srcp = utils.pos2d(player.parts[part]);
			this.ctx.fillStyle = '#FFF';
			this.ctx.font = '13px monospace thin';
			this.ctx.fillRect(srcp.x - 2, srcp.y - 2, 4, 4);
			this.ctx.fillText(part, srcp.x, srcp.y - 6);
		}
	}
	health(player){
		this.ctx.save();
		this.ctx.scale(...player.box_scale);
		
		var rect = player.scale_rect(...player.box_scale);
		
		this.ctx.fillStyle = player.hp_color;
		this.ctx.fillRect(rect.left - 30, rect.top, 25, rect.height);
		
		this.ctx.restore();
	}
	text(player){
		this.ctx.save();
		this.ctx.scale(...player.dist_scale);
		
		var rect = player.scale_rect(...player.dist_scale),
			font_size = 13;
		
		this.ctx.font = 'Bold ' + font_size + 'px Tahoma';
		this.ctx.strokeStyle = '#000';
		this.ctx.lineWidth = 2.5;
		this.ctx.textBaseline = 'top';
		
		var text = [
			[
				[ '#FB8', player.alias ],
				[ '#FFF', player.clan ? ' [' + player.clan + ']' : '' ],
			],
			[
				[ player.hp_color, player.health + '/' + player.max_health + ' HP' ],
			],
			[
				[ '#FFF', player.weapon.name ],
			],
		]
		
		if(player.target)text.push([ [ '#00F', 'Target' ] ]);
		
		this.draw_text(rect.right + 4, rect.top, font_size, text);
		
		this.ctx.restore();
	}
};

Visual.hooked = Symbol();

module.exports = Visual;