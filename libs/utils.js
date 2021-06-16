'use strict';

var vars = require('./vars');

class Utils {
	constructor(canvas, three, game, world){
		this.canvas = canvas;
		this.three = three;
		this.game = game;
		this.world = world;
		
		this.pi2 = Math.PI * 2;
		this.halfpi = Math.PI / 2;
		// planned mobile client
		this.mobile = [ 'android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'iemobile', 'opera mini' ].some(ua => navigator.userAgent.includes(ua));
	}
	dist_center(pos){
		return Math.hypot((window.innerWidth / 2) - pos.x, (window.innerHeight / 2) - pos.y);
	}
	is_host(url, ...hosts){
		return hosts.some(host => url.hostname == host || url.hostname.endsWith('.' + host));
	}
	normal_radian(radian){
		radian = radian % this.pi2;
		
		if(radian < 0)radian += this.pi2;
					
		return radian;
	}
	distanceTo(vec1, vec2){
		return Math.hypot(vec1.x - vec2.x, vec1.y - vec2.y, vec1.z - vec2.z);
	}
	applyMatrix4(pos, t){var e=pos.x,n=pos.y,r=pos.z,i=t.elements,a=1/(i[3]*e+i[7]*n+i[11]*r+i[15]);return pos.x=(i[0]*e+i[4]*n+i[8]*r+i[12])*a,pos.y=(i[1]*e+i[5]*n+i[9]*r+i[13])*a,pos.z=(i[2]*e+i[6]*n+i[10]*r+i[14])*a,pos}
	project3d(pos, camera){
		return this.applyMatrix4(this.applyMatrix4(pos, camera.matrixWorldInverse), camera.projectionMatrix);
	}
	update_frustum(){
		this.world.frustum.setFromProjectionMatrix(new this.three.Matrix4().multiplyMatrices(this.world.camera.projectionMatrix, this.world.camera.matrixWorldInverse));
	}
	update_camera(){
		this.world.camera.updateMatrix();
		this.world.camera.updateMatrixWorld();
	}
	pos2d(pos, offset_y = 0){
		if(isNaN(pos.x) || isNaN(pos.y) || isNaN(pos.z))return { x: 0, y: 0 };
		
		pos = { x: pos.x, y: pos.y, z: pos.z };
		
		pos.y += offset_y;
		
		this.update_camera();
		
		this.project3d(pos, this.world.camera);
		
		return {
			x: (pos.x + 1) / 2 * this.canvas.width,
			y: (-pos.y + 1) / 2 * this.canvas.height,
		}
	}
	obstructing(player, target, wallbangs, offset = 0){
		var d3d = this.getD3D(player.x, player.y, player.z, target.x, target.y, target.z),
			dir = this.getDir(player.z, player.x, target.z, target.x),
			dist_dir = this.getDir(this.getDistance(player.x, player.z, target.x, target.z), target.y, 0, player.y),
			ad = 1 / (d3d * Math.sin(dir - Math.PI) * Math.cos(dist_dir)),
			ae = 1 / (d3d * Math.cos(dir - Math.PI) * Math.cos(dist_dir)),
			af = 1 / (d3d * Math.sin(dist_dir)),
			view_y = player.y + (player.height || 0) - 1.15; // 1.15 = config.cameraHeight
		
		// iterate through game objects
		for(var ind in this.game.map.manager.objects){
			var obj = this.game.map.manager.objects[ind];
			
			if(!obj.noShoot && obj.active && (wallbangs ? !obj.penetrable : true)){
				var in_rect = this.lineInRect(player.x, player.z, view_y, ad, ae, af, obj.x - Math.max(0, obj.width - offset), obj.z - Math.max(0, obj.length - offset), obj.y - Math.max(0, obj.height - offset), obj.x + Math.max(0, obj.width - offset), obj.z + Math.max(0, obj.length - offset), obj.y + Math.max(0, obj.height - offset));
				
				if(in_rect && 1 > in_rect)return in_rect;
			}
		}
		
		// iterate through game terrain
		if(this.game.map.terrain){
			var al = this.game.map.terrain.raycast(player.x, -player.z, view_y, 1 / ad, -1 / ae, 1 / af);
			if(al)return this.getD3D(player.x, player.y, player.z, al.x, al.z, -al.y);
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
	// box = Box3
	box_size(obj, box){
		var vFOV = this.world.camera.fov * Math.PI / 180;
		var h = 2 * Math.tan( vFOV / 2 ) * this.world.camera.position.z;
		var aspect = this.canvas.width / this.canvas.height;
		var w = h * aspect;
		
		return { width: width, height: height};
	}
	contains_point(point){
		for(var ind = 0; ind < 6; ind++)if(this.world.frustum.planes[ind].distanceToPoint(point) < 0)return false;
		return true;
	}
	camera_world(){
		var matrix_copy = this.world.camera.matrixWorld.clone(),
			pos = this.world.camera[vars.getWorldPosition]();
		
		this.world.camera.matrixWorld.copy(matrix_copy);
		this.world.camera.matrixWorldInverse.copy(matrix_copy).invert();
		
		return pos.clone();
	}
	request_frame(callback){
		requestAnimationFrame(callback);
	}
	round(n, r){
		return Math.round(n * Math.pow(10, r)) / Math.pow(10, r);
	}
	wait_for(check, time){
		return new Promise(resolve => {
			var interval,
				run = () => {
					try{
						var result = check();
						
						if(result){
							if(interval)clearInterval(interval);
							resolve(result);
							
							return true;
						}
					}catch(err){console.log(err)}
				};
			
			interval = run() || setInterval(run, time || 50);
		});
	}
	css(obj){
		var string = [];
		
		for(var name in obj)string.push(name + ':' + obj[name] + ';');
		
		return string.join('\n');
	}
	sanitize(string){
		var node = document.createElement('div');
		
		node.textContent = string;
		
		return node.innerHTML;
	}
	unsanitize(string){
		var node = document.createElement('div');
		
		node.innerHTML = string;
		
		return node.textContent;
	}
	// 0.003 ms once v8 optimized
	parse_color(string){
		var hex = [];
		var offset = string[0] == '#' ? 1 : 0;
		var chunk = string.length - offset < 5 ? 1 : 2;
		
		for(let index = offset; index < string.length; index += chunk){
			let part = string.substr(index, chunk);
			
			if(chunk == 1)part += part;	
			
			hex.push(parseInt(part, 16));
		}

		return hex;
	}
	format_color(colors){
		var string = '#';
		
		for(let color of colors)string += color.toString(16).padStart(2, 0);
		
		return string;
	}
	node_tree(nodes, parent = document){
		var output = {
				parent: parent,
			},
			match_container = /^\$\s+>?/g,
			match_parent = /^\^\s+>?/g;
		
		for(var label in nodes){
			var value = nodes[label];
			
			if(value instanceof Node)output[label] = value;
			else if(typeof value == 'object')output[label] = this.node_tree(value, output.container);
			else if(match_container.test(nodes[label])){
				if(!output.container){
					console.warn('No container is available, could not access', value);
					continue;
				}
				
				output[label] = output.container.querySelector(nodes[label].replace(match_container, ''));
			}else if(match_parent.test(nodes[label])){
				if(!output.parent){
					console.warn('No parent is available, could not access', value);
					continue;
				}
				
				output[label] = output.parent.querySelector(nodes[label].replace(match_parent, ''));
			}else output[label] = parent.querySelector(nodes[label]);
			
			if(!output[label])console.warn('No node found, could not access', value);
		}
		
		return output;
	}
	add_ele(node_name, parent, attributes = {}){
		if(node_name == 'text')return parent.appendChild(Object.assign(document.createTextNode(''), attributes));
		
		if(attributes.style != null && typeof attributes.style == 'object')attributes.style = this.css(attributes.style);
		
		return Object.assign(parent.appendChild(document.createElement(node_name)), attributes);
	}
	crt_ele(node_name, attributes = {}){
		if(attributes.style != null && typeof attributes.style == 'object')attributes.style = this.css(attributes.style);
		
		return Object.assign(document.createElement(node_name), attributes);
	}
	string_key(key){
		return key.replace(/^(Key|Digit|Numpad)/, '');
	}
	// Junker
	
	isType(item, type){
		return typeof item === type;
	}
	isDefined(object){
		return !this.isType(object, "undefined") && object !== null;
	}
	isURL(str){
		return /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/gm.test(str);
	}
	objectHas(obj, arr){
		return arr.some(prop => obj.hasOwnProperty(prop));
	}
	createObserver(elm, check, callback, onshow = true){
		return new MutationObserver((mutationsList, observer) => {
			if (check == 'src' || onshow && mutationsList[0].target.style.display == 'block' || !onshow) {
				callback(mutationsList[0].target);
			}
		}).observe(elm, check == 'childList' ? {childList: true} : {attributes: true, attributeFilter: [check]});
	}
	createElement(element, attribute, inner){
		if (!this.isDefined(element)) {
			return null;
		}
		if (!this.isDefined(inner)) {
			inner = "";
		}
		let el = document.createElement(element);
		if (this.isType(attribute, 'object')) {
			for (let key in attribute) {
				el.setAttribute(key, attribute[key]);
			}
		}
		if (!Array.isArray(inner)) {
			inner = [inner];
		}
		for (let i = 0; i < inner.length; i++) {
			if (inner[i].tagName) {
				el.appendChild(inner[i]);
			} else {
				el.appendChild(document.createTextNode(inner[i]));
			}
		}
		return el;
	}
	clone_obj(obj){
		return JSON.parse(JSON.stringify(obj));
	}
	assign_deep(target, ...objects){
		for(let ind in objects)for(let key in objects[ind]){
			if(typeof objects[ind][key] == 'object' && objects[ind][key] != null && key in target)this.assign_deep(target[key], objects[ind][key]);
			else if(typeof target == 'object' && target != null)Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(objects[ind], key))
		}
		
		return target;
	}
}

module.exports = Utils;