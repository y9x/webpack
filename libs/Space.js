'use strict';

class Vector3 {
	constructor(x = 0, y = 0, z = 0){
		this.x = x;
		this.y = y;
		this.z = z;
	}
	clone(){
		return new Vector3(this.x, this.y, this.z);
	}
	mps(){
		return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2)) * 1000;
	}
	set(x, y, z){
		this.x = x;
		this.y = y;
		this.z = z;
		return this;
	}
	copy(vector){
		this.x = vector.x;
		this.y = vector.y;
		this.z = vector.z;
		return this;
	}
	add(vector){
		this.x += vector.x;
		this.y += vector.y;
		this.z += vector.z;
		return this;
	}
	add_vectors(x = 0, y = 0, z = 0){
		this.x += x;
		this.y += y;
		this.z += z;
		return this;
	}
	add_scalar(scalar){
		this.x += scalar;
		this.y += scalar;
		this.z += scalar;
		return this;
	}
	sub(vector){
		this.x += vector.x;
		this.y += vector.y;
		this.z += vector.z;
		return this;
	}
	sub_vectors(x = 0, y = 0, z = 0){
		this.x -= x;
		this.y -= y;
		this.z -= z;
		return this;
	}
	sub_scalar(scalar){
		this.x -= scalar;
		this.y -= scalar;
		this.z -= scalar;
		return this;
	}
	multiply(vector){
		this.x *= vector.x;
		this.y *= vector.y;
		this.z *= vector.z;
		return this;
	}
	multiply_vectors(x = 0, y = 0, z = 0){
		this.x *= x;
		this.y *= y;
		this.z *= z;
		return this;
	}
	multiply_scalar(scalar){
		this.x *= scalar;
		this.y *= scalar;
		this.z *= scalar;
		return this;
	}
	divide(vector){
		this.x /= vector.x;
		this.y /= vector.y;
		this.z /= vector.z;
		return this;
	}
	divide_vectors(x = 0, y = 0, z = 0){
		this.x /= x;
		this.y /= y;
		this.z /= z;
		return this;
	}
	divide_scalar(scalar){
		this.x /= scalar;
		this.y /= scalar;
		this.z /= scalar;
		return this;
	}
	apply_quaternion(q) {
		const x = this.x, y = this.y, z = this.z;
		const qx = q.x, qy = q.y, qz = q.z, qw = q.w;
		const ix = qw * x + qy * z - qz * y;
		const iy = qw * y + qz * x - qx * z;
		const iz = qw * z + qx * y - qy * x;
		const iw = -qx * x - qy * y - qz * z;
		this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
		this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
		this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
		return this;
	}
	translate_quaternion(quaternion, vector){
		for(var axis in vector){
			var vec = new Vector3();
			
			vec[axis] = 1;
			
			var pos = vec.apply_quaternion(quaternion).multiply_scalar(vector[axis]);
			
			this.add(pos);
		}
		
		return this;
	}
	distance_to(point){
		return Math.hypot(this.x - point.x, this.y - point.y, this.z - point.z);
	}
};

Vector3.Blank = new Vector3();

class Box3 {
	min = new Vector3();
	max = new Vector3();
	points(){
		return [
			new Vector3(this.min.x, this.min.y, this.min.z), // 000
			new Vector3(this.min.x, this.min.y, this.max.z), // 001
			new Vector3(this.min.x, this.max.y, this.min.z), // 010
			new Vector3(this.min.x, this.max.y, this.max.z), // 011
			new Vector3(this.max.x, this.min.y, this.min.z), // 100
			new Vector3(this.max.x, this.min.y, this.max.z), // 101
			new Vector3(this.max.x, this.max.y, this.min.z), // 110
			new Vector3(this.max.x, this.max.y, this.max.z), // 111
		];
	}
}

class Hex3 {
	hex = [ 0, 0, 0 ];
	constructor(string = '#000'){
		this.set_style(string);
	}
	add_scalar(scalar){
		for(let ind in this.hex)this.hex[ind] += scalar;
		return this.normalize();
	}
	sub_scalar(scalar){
		for(let ind in this.hex)this.hex[ind] -= scalar;
		return this.normalize();
	}
	normalize(){
		for(let ind in this.hex)this.hex[ind] = Math.max(Math.min(this.hex[ind], 255), 0);
		return this;
	}
	set(r, g, b){
		this.hex[0] = r;
		this.hex[1] = g;
		this.hex[2] = b;
		
		return this;
	}
	set_style(string){
		let hex_index = 0,
			offset = string[0] == '#' ? 1 : 0,
			chunk = string.length - offset < 5 ? 1 : 2;
		
		for(let index = offset; index < string.length; index += chunk){
			let part = string.substr(index, chunk);
			
			if(chunk == 1)part += part;	
			
			this.hex[hex_index++] = parseInt(part, 16);
		}
		
		return this;
	}
	toString(){
		var string = '#';
		
		for(let color of this.hex)string += color.toString(16).padStart(2, 0);
		
		return string;
	}
};

exports.Box3 = Box3;
exports.Hex3 = Hex3;
exports.Vector3 = Vector3;