'use strict';

var OVisual = require('../libs/visual');

class Visual extends OVisual {
	tick(){}
	text(player){
		this.ctx.save();
		this.ctx.scale(...player.dist_scale);
		
		var rect = player.scale_rect(...player.dist_scale);
		
		this.ctx.font = 'Bold 17px Tahoma';
		this.ctx.fillStyle = 'white';
		this.ctx.strokeStyle = 'black';
		this.ctx.lineWidth = 1;
		
		let x = rect.right + 7,
			y = rect.top,
			name = player.name || player.alias;
		
		this.ctx.fillText(name, x, y);
		this.ctx.strokeText(name, x, y);
		
		y += 16;
		
		this.ctx.font = `Bold 15px Tahoma`;
		this.ctx.fillStyle = "#cccccc";
		
		this.ctx.fillText(player.weapon.name, x, y);
		this.ctx.strokeText(player.weapon.name, x, y);
		
		y += 16;
		
		this.ctx.fillStyle = player.hp_color;
		this.ctx.fillText(player.health + ' HP', x, y);
		this.ctx.strokeText(player.health + ' HP', x, y);
		
		this.ctx.restore();
	}
};

module.exports = Visual;