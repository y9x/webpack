'use strict';

var { Vector3 } = require('./Space');

class Visual {
	constructor(data){
		this.data = data;
		this.materials = new Map();
		this.rainbow = {
			col: '#ffffff',
			val: 0,
		};
	}
	tick_rainbow(){
		this.rainbow.val += 0.6;
		this.rainbow.val %= 360;
		this.rainbow.col = this.data.utils.hexFromHue(Math.round(this.rainbow.val));
	}
	esp_mat(color){
		if(!this.materials.has(color))this.materials.set(color, new this.data.three.MeshBasicMaterial({
			transparent: true,
			fog: false,
			depthTest: false,
			color: color,
		}));
		
		return this.materials.get(color);
	}
	tick(){
		this.data.ctx.clearRect(0, 0, this.data.ctx.canvas.width, this.data.ctx.canvas.height);
		this.tick_rainbow();
	}
	draw_text(text_x, text_y, font_size, lines){
		for(var text_index = 0; text_index < lines.length; text_index++){
			var line = lines[text_index], xoffset = 0;
			
			for(var sub_ind = 0; sub_ind < line.length; sub_ind++){
				var color = line[sub_ind][0],
					text = line[sub_ind][1],
					text_args = [ text, text_x + xoffset, text_y + text_index * (font_size + 2) ];
				
				this.data.ctx.fillStyle = color;
				this.data.ctx.strokeText(...text_args);
				this.data.ctx.fillText(...text_args);
				
				xoffset += this.data.ctx.measureText(text).width + 2;
			}
		}
	}
	fov(fov){
		var width = (this.data.ctx.canvas.width * fov) / 100,
			height = (this.data.ctx.canvas.height * fov) / 100;
		
		this.data.ctx.strokeStyle = '#000';
		this.data.ctx.lineWidth = 2;
		this.data.ctx.strokeRect((this.data.ctx.canvas.width - width) / 2, (this.data.ctx.canvas.height - height) / 2, width, height);
	}
	walls(){
		this.data.world.scene.children.forEach(obj => {
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
		this.data.ctx.strokeStyle = '#000'
		this.data.ctx.font = '14px monospace';
		this.data.ctx.textAlign = 'start';
		this.data.ctx.lineWidth = 2.6;
		
		var data = {
			Player: this.data.player ? this.axis_join(this.data.player.position) : null,
			Target: this.data.target ? this.axis_join(this.data.target.position) : null,
			/*
			PlayerV: this.data.player ? this.axis_join(this.data.player.velocity) : null,
			'Target FOV': this.data.target && this.data.target.in_fov,
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
		
		this.draw_text(15, ((this.data.ctx.canvas.height / 2) - (lines.length * 14)  / 2), 14, lines);
	}
	p2a(point){
		var pos = this.data.utils.pos2d(point);
		
		return [ pos.x, pos.y ];
	}
	hitbox(box){
		var points = box.points();
		
		this.data.ctx.fillStyle = 'red';
		this.data.ctx.lineWidth = 1.5;
		
		this.data.ctx.moveTo(...this.p2a(points[0]));
		this.data.ctx.lineTo(...this.p2a(points[2]));
		this.data.ctx.lineTo(...this.p2a(points[4]));
		this.data.ctx.lineTo(...this.p2a(points[6]));
		this.data.ctx.lineTo(...this.p2a(points[5]));
		this.data.ctx.lineTo(...this.p2a(points[7]));
		this.data.ctx.lineTo(...this.p2a(points[1]));
		this.data.ctx.lineTo(...this.p2a(points[3]));
		this.data.ctx.lineTo(...this.p2a(points[0]));
		this.data.ctx.lineTo(...this.p2a(points[1]));
		this.data.ctx.lineTo(...this.p2a(points[5]));
		this.data.ctx.lineTo(...this.p2a(points[4]));
		this.data.ctx.lineTo(...this.p2a(points[0]));
		this.data.ctx.lineTo(...this.p2a(points[2]));
		this.data.ctx.lineTo(...this.p2a(points[3]));
		this.data.ctx.lineTo(...this.p2a(points[7]));
		this.data.ctx.lineTo(...this.p2a(points[6]));
		this.data.ctx.lineTo(...this.p2a(points[2]));
		
		this.data.ctx.stroke();
	}
	box(player){
		// return this.hitbox(player.hitbox.head);
		
		this.data.ctx.strokeStyle = player.esp_color;
		this.data.ctx.lineWidth = 1.5;
		this.data.ctx.strokeRect(player.rect.left, player.rect.top, player.rect.width, player.rect.height);
		
		// this.labels(player);
	}
	labels(player){
		for(let [label, part] of Object.entries(player.parts)){
			let {x,y} = this.data.utils.pos2d(part);
			this.data.ctx.fillStyle = '#FFF';
			this.data.ctx.font = '13px monospace thin';
			this.data.ctx.fillRect(x - 2, y - 2, 4, 4);
			this.data.ctx.fillText(label, x, y - 6);
		}
	}
	tracer(player){
		this.data.ctx.strokeStyle = player.esp_color;
		this.data.ctx.lineWidth = 1.75;
		this.data.ctx.lineCap = 'round';
		
		this.data.ctx.beginPath();
		// bottom center
		this.data.ctx.moveTo(this.data.ctx.canvas.width / 2, this.data.ctx.canvas.height);
		// target center
		this.data.ctx.lineTo(player.rect.x, player.rect.bottom);
		this.data.ctx.stroke();
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
	health(player){
		this.data.ctx.save();
		this.data.ctx.scale(...player.box_scale);
		
		var rect = player.scale_rect(...player.box_scale);
		
		this.data.ctx.fillStyle = player.hp_color;
		this.data.ctx.fillRect(rect.left - 30, rect.top, 25, rect.height);
		
		this.data.ctx.restore();
	}
	text(player){
		this.data.ctx.save();
		this.data.ctx.scale(...player.dist_scale);
		
		var rect = player.scale_rect(...player.dist_scale),
			font_size = 13;
		
		this.data.ctx.font = 'Bold ' + font_size + 'px Tahoma';
		this.data.ctx.strokeStyle = '#000';
		this.data.ctx.lineWidth = 2.5;
		this.data.ctx.textBaseline = 'top';
		
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
		
		this.data.ctx.restore();
	}
	text_clean(player){
		this.data.ctx.save();
		this.data.ctx.scale(...player.dist_scale);
		
		var rect = player.scale_rect(...player.dist_scale);
		
		this.data.ctx.font = 'Bold 17px Tahoma';
		this.data.ctx.fillStyle = 'white';
		this.data.ctx.strokeStyle = 'black';
		this.data.ctx.lineWidth = 1;
		
		let x = rect.right + 7,
			y = rect.top,
			name = player.name || player.alias;
		
		this.data.ctx.fillText(name, x, y);
		this.data.ctx.strokeText(name, x, y);
		
		y += 16;
		
		this.data.ctx.font = `Bold 15px Tahoma`;
		this.data.ctx.fillStyle = "#cccccc";
		
		this.data.ctx.fillText(player.weapon.name, x, y);
		this.data.ctx.strokeText(player.weapon.name, x, y);
		
		y += 16;
		
		this.data.ctx.fillStyle = player.hp_color;
		this.data.ctx.fillText(player.health + ' HP', x, y);
		this.data.ctx.strokeText(player.health + ' HP', x, y);
		
		this.data.ctx.restore();
	}
};

Visual.hooked = Symbol();

module.exports = Visual;