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
	set(x, y, z){
		this.x = x;
		this.y = y;
		this.z = z;
		
		return this;
	}
	set_x(x){
		this.x = x;
		return this;
	}
	set_y(y){
		this.y = y;
		return this;
	}
	set_z(z){
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
		return Math.hypot(this.x - point.x, this.y - point.y, this.z - point.z)
	}
};

Vector3.Blank = new Vector3();

exports.Vector3 = Vector3;