'use strict';

var UI = require('../libs/ui/'),
	vars = require('../libs/vars'),
	main = require('./main'),
	{ utils } = require('../libs/consts');

class Visual {
	constructor(){
		this.materials = {};
	}
	tick(){
		
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
	fov(fov){
		var width = (this.canvas.width * fov) / 100,
			height = (this.canvas.height * fov) / 100;
		
		this.ctx.fillStyle = '#F00';
		this.ctx.globalAlpha = 0.4;
		this.ctx.fillRect((this.canvas.width - width) / 2, (this.canvas.height - height) / 2, width, height);
		this.ctx.globalAlpha = 1;
	}
};

Visual.hooked = Symbol();

module.exports = Visual;