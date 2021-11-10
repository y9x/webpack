'use strict';

var { loader } = require('./consts'),
	{ vars } = loader,
	{ Vector3 } = require('./Space');

class KrunkerUtils {
	constructor(data){
		this.data = data;
	}
	rgbToHex(e, t, i){
		for (var s = (e << 16 | t << 8 | i).toString(16); 6 > s.length;)s = "0" + s;
		return "#" + s;
	}
	hexFromHue(t){
		var i = t / 60;
		var s = 255 * (1 - Math.abs(i % 2 - 1));
		var n = Math.floor(i);
		return this.rgbToHex(1 > n || 4 < n ? 255 : 1 == n || 4 == n ? s : 0, 0 == n || 3 == n ? s : 1 == n || 2 == n ? 255 : 0, 0 == n || 1 == n ? 0 : 3 == n || 4 == n ? 255 : s);
	}
	deg2rad(deg){
		return deg * Math.PI / 180;
	}
	dist_center(pos){
		return Math.hypot((window.innerWidth / 2) - pos.x, (window.innerHeight / 2) - pos.y);
	}
	distanceTo(vec1, vec2){
		return Math.hypot(vec1.x - vec2.x, vec1.y - vec2.y, vec1.z - vec2.z);
	}
	applyMatrix4(pos, t){var e=pos.x,n=pos.y,r=pos.z,i=t.elements,a=1/(i[3]*e+i[7]*n+i[11]*r+i[15]);return pos.x=(i[0]*e+i[4]*n+i[8]*r+i[12])*a,pos.y=(i[1]*e+i[5]*n+i[9]*r+i[13])*a,pos.z=(i[2]*e+i[6]*n+i[10]*r+i[14])*a,pos}
	project3d(pos, camera){
		return this.applyMatrix4(this.applyMatrix4(pos, camera.matrixWorldInverse), camera.projectionMatrix);
	}
	update_frustum(){
		this.data.world.frustum.setFromProjectionMatrix(new this.data.three.Matrix4().multiplyMatrices(this.data.world.camera.projectionMatrix, this.data.world.camera.matrixWorldInverse));
	}
	update_camera(){
		this.data.world.camera.updateMatrix();
		this.data.world.camera.updateMatrixWorld();
	}
	pos2d(pos, offset_y = 0){
		if(isNaN(pos.x) || isNaN(pos.y) || isNaN(pos.z))return { x: 0, y: 0 };
		
		pos = { x: pos.x, y: pos.y, z: pos.z };
		
		pos.y += offset_y;
		
		this.update_camera();
		
		this.project3d(pos, this.data.world.camera);
		
		return {
			x: (pos.x + 1) / 2 * this.data.ctx.canvas.width,
			y: (-pos.y + 1) / 2 * this.data.ctx.canvas.height,
		}
	}
	obstructing(target){
		var wallbang = this.data.wallbangs && (!this.data.player || this.data.player.weapon && this.data.player.weapon.pierce),
			view = this.camera_world() || new Vector3(),
			d3d = this.getD3D(view.x, view.y, view.z, target.x, target.y, target.z),
			dir = this.getDir(view.z, view.x, target.z, target.x),
			dist_dir = this.getDir(this.getDistance(view.x, view.z, target.x, target.z), target.y, 0, view.y),
			ad = 1 / (d3d * Math.sin(dir - Math.PI) * Math.cos(dist_dir)),
			ae = 1 / (d3d * Math.cos(dir - Math.PI) * Math.cos(dist_dir)),
			af = 1 / (d3d * Math.sin(dist_dir));
			// comments were for if the player object wasnt a camera
			// view_y = player.y + (player.height || 0) - 1.15; // 1.15 = config.cameraHeight
		
		// iterate through game objects
		for(let obj of this.data.game.map.manager.objects)if(!obj.noShoot && obj.active && (wallbang ? !obj.penetrable : true)){
			var in_rect = this.lineInRect(view.x, view.z, view.y, ad, ae, af,
				obj.x - Math.max(0, obj.width),
				obj.z - Math.max(0, obj.length),
				obj.y - Math.max(0, obj.height),
				obj.x + Math.max(0, obj.width),
				obj.z + Math.max(0, obj.length),
				obj.y + Math.max(0, obj.height)
			);
			
			if(in_rect && 1 > in_rect)return in_rect;
		}
		
		// iterate through game terrain
		if(this.data.game.map.terrain){
			var ray = this.data.game.map.terrain.raycast(view.x, -view.z, view.y, 1 / ad, -1 / ae, 1 / af);
			if(ray)return this.getD3D(view.x, view.y, view.z, ray.x, ray.z, -ray.y);
		}
	}
	getDistance(x1, y1, x2, y2){
		return Math.sqrt((x2 -= x1) * x2 + (y2 -= y1) * y2);
	}
	getD3D(x1, y1, z1, x2, y2, z2){
		var dx = x1 - x2,
			dy = y1 - y2,
			dz = z1 - z2;
		
		return Math.sqrt(dx * dx + dy * dy + dz * dz);
	}
	getXDire(x1, y1, z1, x2, y2, z2){
		return Math.asin(Math.abs(y1 - y2) / this.getD3D(x1, y1, z1, x2, y2, z2)) * ((y1 > y2) ? -1 : 1);
	}
	getDir(x1, y1, x2, y2){
		return Math.atan2(y1 - y2, x1 - x2)
	}
	lineInRect(lx1, lz1, ly1, dx, dz, dy, x1, z1, y1, x2, z2, y2){
		var t1 = (x1 - lx1) * dx,
			t2 = (x2 - lx1) * dx,
			t3 = (y1 - ly1) * dy,
			t4 = (y2 - ly1) * dy,
			t5 = (z1 - lz1) * dz,
			t6 = (z2 - lz1) * dz,
			tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6)),
			tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));
		
		return (tmax < 0 || tmin > tmax) ? false : tmin;
	}
	getAngleDst(a1, a2){
		return Math.atan2(Math.sin(a2 - a1), Math.cos(a1 - a2));
	}
	contains_point(point){
		for(let plane of this.data.world.frustum.planes)if(plane.distanceToPoint(point) < 0)return false;
		return true;
	}
	camera_world(){
		var matrix_copy = this.data.world.camera.matrixWorld.clone(),
			pos = this.data.world.camera[vars.getWorldPosition]();
		
		this.data.world.camera.matrixWorld.copy(matrix_copy);
		this.data.world.camera.matrixWorldInverse.copy(matrix_copy).invert();
		
		return pos.clone();
	}
	request_frame(callback){
		requestAnimationFrame(callback);
	}
};

module.exports = KrunkerUtils;