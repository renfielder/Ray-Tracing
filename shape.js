/* Intersection structure:
 * t:        ray parameter (float), i.e. distance of intersection point to ray's origin
 * position: position (THREE.Vector3) of intersection point
 * normal:   normal (THREE.Vector3) of intersection point
 * material: material of the intersection object
 */
class Intersection {
	constructor() {
		this.t = 0;
		this.position = new THREE.Vector3();
		this.normal = new THREE.Vector3();
		this.material = null;
		this.uv = new THREE.Vector2();
	}
	set(isect) {
		this.t = isect.t;
		this.position = isect.position;
		this.normal = isect.normal;
		this.material = isect.material;
		this.uv = isect.uv;
	}
}

/* Plane shape
 * P0: a point (THREE.Vector3) that the plane passes through
 * n:  plane's normal (THREE.Vector3)
 */
class Plane {
	constructor(P0, n, material) {
		this.P0 = P0.clone();
		this.n = n.clone();
		this.n.normalize();
		this.material = material;
	}
	// Given ray and range [tmin,tmax], return intersection point.
	// Return null if no intersection.
	intersect(ray, tmin, tmax) {
		let temp = this.P0.clone();
		temp.sub(ray.o); // (P0-O)
		let denom = ray.d.dot(this.n); // d.n
		if(denom==0) { return null;	}
		let t = temp.dot(this.n)/denom; // (P0-O).n / d.n
		if(t<tmin || t>tmax) return null; // check range
		let isect = new Intersection();   // create intersection structure
		isect.t = t;
		isect.position = ray.pointAt(t);
		isect.normal = this.n;
		isect.material = this.material;
		return isect;
	}
}

/* Sphere shape
 * C: center of sphere (type THREE.Vector3)
 * r: radius
 */
class Sphere {
	constructor(C, r, material) {
		this.C = C.clone();
		this.r = r;
		this.r2 = r*r;
		this.material = material;
	}
	intersect(ray, tmin, tmax) {
// ===YOUR CODE STARTS HERE===
		//let temp = this.C.clone();
		let test = ray.o.clone().addScaledVector(this.C, -1)
		//test.normalize();

		// let mag = this.C.distanceTo(ray.o);
		// let r2 = this.r2;

		let A = 1;
		let B = ((test.clone().multiplyScalar(2)).dot(ray.d));
		let C =  test.length()**2 - this.r2;
		
		let delta = (B**2) - (4*A*C);

		//if(delta<tmin || delta>tmax) return null; // check range
		if (delta<0) return null;
		
		let t1 = ((-1 * B) + Math.sqrt(delta))/(2*A);
		let t2 = ((-1 * B) - Math.sqrt(delta))/(2*A);
		var t = null;
		if (delta == 0) {
			if (t1 > 0 && t1 >= tmin && t1 <= tmax) t = t1;
			else if (t2 > 0 && t2 >= tmin && t2 <= tmax) t = t2;
		}
		else { // delta > 0
			if (t1 > 0 && t2 > 0 && t1 >= tmin && t1 <= tmax && t2 >= tmin && t2 <= tmax) {
				t = (t1 > t2) ? t2 : t1;
			}
			else if (t1 > 0 && t1 >= tmin && t1 <= tmax) {
				t = t1;
			}
			else if (t2 > 0 && t2 >= tmin && t2 <= tmax) {
				t = t2;
			}
		}
		if (t) {
			
			let isect = new Intersection();
			isect.t = t;
			isect.position = ray.pointAt(t);
			isect.normal.add(isect.position).addScaledVector(this.C, -1).normalize();
			isect.material = this.material;
			let u = (0.5)+(Math.atan2(isect.position.x, isect.position.z)/(2*Math.PI));
			let v = (0.5)- (Math.asin(isect.position.y)/Math.PI);
			isect.uv = new THREE.Vector2(u, v);
			return isect;
		}
// ---YOUR CODE ENDS HERE---
		return null;
	}
}

class Triangle {
	/* P0, P1, P2: three vertices (type THREE.Vector3) that define the triangle
	 * n0, n1, n2: normal (type THREE.Vector3) of each vertex */
	constructor(P0, P1, P2, material, n0, n1, n2) {
		this.P0 = P0.clone();
		this.P1 = P1.clone();
		this.P2 = P2.clone();
		this.material = material;
		if(n0) this.n0 = n0.clone();
		if(n1) this.n1 = n1.clone();
		if(n2) this.n2 = n2.clone();

		// below you may pre-compute any variables that are needed for intersect function
		// such as the triangle normal etc.
// ===YOUR CODE STARTS HERE===
		this.triNorm = this.P1.clone().addScaledVector(this.P0, -1).cross(this.P2.clone().addScaledVector(this.P0, -1));
		this.thing = this.triNorm.clone().dot(this.triNorm);
// ---YOUR CODE ENDS HERE---
	} 

	intersect(ray, tmin, tmax) {
// ===YOUR CODE STARTS HERE===
		if ((this.triNorm.clone().dot(ray.d)) == 0) {
			return null;
		}
		let plane = new Plane(this.P0, this.triNorm, this.material);
		let pIsect = plane.intersect(ray, tmin, tmax);
		if (pIsect && pIsect.t > 0 && pIsect.t >= tmin && pIsect.t <= tmax) {
			let e0 = this.P1.clone().addScaledVector(this.P0, -1);
			let e1 = this.P2.clone().addScaledVector(this.P1, -1);
			let e2 = this.P0.clone().addScaledVector(this.P2, -1);
			let c0 = pIsect.position.clone().addScaledVector(this.P0, -1);
			let c1 = pIsect.position.clone().addScaledVector(this.P1, -1);
			let c2 = pIsect.position.clone().addScaledVector(this.P2, -1);
			let alpha = this.triNorm.clone().dot(e1.clone().cross(c1));
			let beta = this.triNorm.clone().dot(e2.clone().cross(c2));
			if (this.triNorm.clone().dot(e0.clone().cross(c0)) > 0 && alpha > 0 && beta > 0) {
				let isect = new Intersection();
				isect.t = pIsect.t;
				isect.position = pIsect.position;
				isect.material = this.material;
				if(this.n0 && this.n1 && this.n2){
					alpha /= this.thing;
					beta /= this.thing;
					let gamma = 1-alpha-beta;
					isect.normal = this.n0.clone().multiplyScalar(alpha).addScaledVector(this.n1, beta).addScaledVector(this.n2, gamma).normalize();
				}
				else{
					isect.normal = this.triNorm.normalize();
				}
				return isect;
			}
		}
		return null;
	}
}


function shapeLoadOBJ(objname, material, smoothnormal) {
	loadOBJAsMesh(objname, function(mesh) { // callback function for non-blocking load
		if(smoothnormal) mesh.computeVertexNormals();
		for(let i=0;i<mesh.faces.length;i++) {
			let p0 = mesh.vertices[mesh.faces[i].a];
			let p1 = mesh.vertices[mesh.faces[i].b];
			let p2 = mesh.vertices[mesh.faces[i].c];
			if(smoothnormal) {
				let n0 = mesh.faces[i].vertexNormals[0];
				let n1 = mesh.faces[i].vertexNormals[1];
				let n2 = mesh.faces[i].vertexNormals[2];
				shapes.push(new Triangle(p0, p1, p2, material, n0, n1, n2));
			} else {
				shapes.push(new Triangle(p0, p1, p2, material));
			}
		}
	}, function() {}, function() {});
}

/* ========================================
 * You can define additional Shape classes,
 * as long as each implements intersect function.
 * ======================================== */
