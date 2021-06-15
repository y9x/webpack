'use strict';

var vars = require('../libs/vars'),
	{ utils } = require('../libs/consts'),
	Player;

class Cheat {
	constructor(){
		this.hooked = Symbol();
		this.skins = [...Array(5000)].map((e, i) => ({ ind: i, cnt: 1 }));
		this.socket_id = 0;
		
		this.sorts = {
			dist3d: (ent_1, ent_2) => {
				return ent_1.distance_camera - ent_2.distance_camera;
			},
			dist2d: (ent_1, ent_2) => {
				return utils.dist_center(ent_1.rect) - utils.dist_center(ent_2.rect);
			},
			hp: (ent_1, ent_2) => {
				return ent_1.health - ent_2.health;
			},
		};
		
		this.y_offset_types = ['head', 'torso', 'legs'];
		
		this.y_offset_rand = 'head';
		
		setInterval(() => this.y_offset_rand = this.y_offset_types[~~(Math.random() * this.y_offset_types.length)], 2000);
	}
	get config(){
		return this.ui.config;
	}
	add(entity){
		return entity[this.hooked] || (entity[this.hooked] = new Player(this, entity));
	}
	pick_target(){
		return this.game.players.list.map(ent => this.add(ent)).filter(player => player.can_target).sort((ent_1, ent_2) => this.sorts[this.config.aim.target_sorting || 'dist2d'](ent_1, ent_2) * (ent_1.frustum ? 1 : 0.5))[0]
	}
	get aim_part(){
		return this.config.aim.offset != 'random' ? this.config.aim.offset : this.y_offset_rand;
	}
};

module.exports = new Cheat();

Player = require('../libs/player');

/*Object.assign(window.eval('window'), {
	cheat: exports,
	cheat_vars: vars,
	cheat_utils: utils,
	cheat_consts: require('../libs/consts'),
});*/