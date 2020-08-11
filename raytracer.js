/* Ray class:
 * o: origin (THREE.Vector3)
 * d: normalized direction (THREE.Vector3)
 */
class Ray {
	constructor(origin, direction) {
		this.o = origin.clone();
		this.d = direction.clone();
		this.d.normalize();
	}
	pointAt(t) {
		// P(t) = o + t*d
		let point = this.o.clone();
		point.addScaledVector(this.d, t);
		return point;
	}
	direction() { return this.d; }
	origin() { return this.o; }
}

function render(aa=false) {
	// create canvas of size imageWidth x imageHeight and add to DOM
	let canvas = document.createElement('canvas');
	canvas.width = imageWidth;
	canvas.height = imageHeight;
	canvas.style = 'background-color:red';
	document.body.appendChild(canvas);
	let ctx2d = canvas.getContext('2d'); // get 2d context
	let image = ctx2d.getImageData(0, 0, imageWidth, imageHeight); // get image data
	let pixels = image.data; // get pixel array

	let row=0;
	let idx=0;
	let chunksize=10; // render 10 rows at a time
	console.log('Raytracing started...');
	(function chunk() {
		// render a chunk of rows
		for(let j=row;j<row+chunksize && j<imageHeight;j++) {
			for(let i=0;i<imageWidth;i++,idx+=4) { // i loop
				// compute normalized pixel coordinate (x,y)
				let x = i/imageWidth;
				let y = (imageHeight-1-j)/imageHeight;
				let ray = camera.getCameraRay(x,y);
				let color = raytracing(ray, 0);
				if(aa){
					x = (i+0.25)/imageWidth;
					y = (imageHeight-1-j)/imageHeight;
					ray = camera.getCameraRay(x,y);
					color.add(raytracing(ray, 0));

					x = (i)/imageWidth;
					y = (imageHeight-1-j+0.25)/imageHeight;
					ray = camera.getCameraRay(x,y);
					color.add(raytracing(ray, 0));

					x = (i+0.25)/imageWidth;
					y = (imageHeight-1-j+0.25)/imageHeight;
					ray = camera.getCameraRay(x,y);
					color.add(raytracing(ray, 0));

					setPixelColor(pixels, idx, color.multiplyScalar(1/4));
				}
				else{
					setPixelColor(pixels, idx, color);
				}
			}
		}
		row+=chunksize;  // non-blocking j loop
		if(row<imageHeight) {
			setTimeout(chunk, 0);
			ctx2d.putImageData(image, 0, 0); // display intermediate image
		} else {
			ctx2d.putImageData(image, 0, 0); // display final image
			console.log('Done.')
		}
	})();
}
let maxBounce = 1;
/* Trace ray in the scene and return color of ray. 'depth' is the current recursion depth.
 * If intersection material has non-null kr or kt, perform recursive ray tracing. */
function raytracing(ray, depth,bounce) {
	let color = new THREE.Color(0,0,0);
// ===YOUR CODE STARTS HERE===
	let isect = rayIntersectScene(ray);
	if (isect){
		if ((isect.material.kr || isect.material.kt)&& depth<maxDepth){
			if(isect.material.kr){
				let l = ray.d.clone().multiplyScalar(-1); // ray direction
				let reflect_ray = new Ray(isect.position, reflect(l.clone(), isect.normal.clone()));
				color.add(isect.material.kr.clone().multiply(raytracing(reflect_ray, depth+1)));
			}
			if (isect.material.kt){
				let l = ray.d.clone(); // ray direction
				let refr = refract(l.clone(), isect.normal.clone(), isect.material.ior);
				let refract_ray = new Ray(isect.position, refr);
				let x = raytracing(refract_ray, depth+1);
				let v = isect.material.kt.clone().multiply(x);
				color.add(v);
			}
		}
		else {
			if(bounce<maxBounce){
				let pathColor = pathtracing(isect, 100, depth, bounce)
				color.add(pathColor);
			}

			color.add(shading(ray, isect));
			//color.add(ambientOcclusion(isect));
		}
	}
	else {
		color.add(backgroundColor);
	}
// ---YOUR CODE ENDS HERE---
	return color;
}


/* Compute and return shading color given a ray and the intersection point structure. */
function shading(ray, isect) {
	let color = new THREE.Color(0,0,0);
// ===YOUR CODE STARTS HERE===

	for(let i = 0; i<lights.length; i++){
		let ls = lights[i].getLight(isect.position);

		let shadowRay = new Ray(isect.position, ls.direction);
		let distToLight = ls.position.clone().distanceTo(isect.position);//(ls.position - isect.position).length();
		let shadow_isect = rayIntersectScene(shadowRay);

		if (shadow_isect && shadow_isect.t < distToLight){
			continue;
		}
		let l = ls.direction.clone();
		let n = isect.normal.clone();
		let v = ray.d.clone().multiplyScalar(-1); 
		let r = reflect(l.normalize(),n.normalize());

		if (isect.material.ka) {
			color.add(ambientLight.clone().multiply(isect.material.ka));
		}
        let kd = isect.material.kd || new THREE.Color(0,0,0);
		let ks = isect.material.ks || new THREE.Color(0,0,0);
		//let ka = isect.material.ka || new THREE.Color(0,0,0);
		if (isect.material.imgName){
			//isect.material.imgName.
			color.add(isect.material.imgName);
		}
		//let diffuse = new THREE.Color(1,1,1);
		let il = ls.intensity.clone();
		let diffuse = kd.clone().multiply(ls.intensity).multiplyScalar(Math.max(isect.normal.clone().dot(ls.direction), 0));
		color.add(diffuse);

		if(isect.material.p != null){
			let spec = il.clone().multiply(ks.clone().multiplyScalar(Math.max(r.clone().dot(v), 0)** isect.material.p)); 
			color.add(spec);
		}
		
	}
	
	//Ip = Il . ka + Sum(Ij . kd . max(n . lj, 0)+ Ij . ks . max(rj . v,0)**p)
// ---YOUR CODE ENDS HERE---
	return color;
}

function ambientOcclusion(isect){
	let color = new THREE.Color(0,0,0);
	for(let i = 0; i<lights.length; i++){
		let ls = lights[i].getLight(isect.position);

		let shadowRay = new Ray(isect.position, ls.direction);
		let distToLight = ls.position.clone().distanceTo(isect.position);//(ls.position - isect.position).length();
		let shadow_isect = rayIntersectScene(shadowRay);

		if (shadow_isect && shadow_isect.t < distToLight){
			continue;
		}
		let samples = [];
		let sum = 0;
		for (let j =0; j<100; j++){
			let e1 = Math.random();
			let e2 = Math.random();
			let theta = Math.acos(1-2*e1); //angle away
			let phi = 2*Math.PI*e2; //angle around
			let dx = Math.sin(theta)*Math.cos(phi);
			let dy = Math.cos(theta);
			let dz = Math.sin(theta)*Math.sin(phi);
			let sampDir = new THREE.Vector3(dx,dy,dz);
			// let N;
			if (sampDir.clone().dot(isect.normal)>0){
				samples[j] = new Ray(isect.position, sampDir);
				if(rayIntersectScene(samples[j])){
					sum += Math.cos(samples[j].d.clone().dot(isect.normal));
				}
			}
		}
		sum = (sum/100)*2;
		console.log(sum);
		color.multiplyScalar(sum);
	}
		return color;
}


function pathtracing(isect, samples, depth, bounce){
	let bounceColor = new THREE.Color(0,0,0);
	let inputSamples;

	for (inputSamples= 0; inputSamples < samples;){
		let theta = Math.acos(1-2*Math.random());
		let phi = 2*Math.PI*Math.random();
		let randx = Math.cos(theta);
		let randy = Math.sin(theta)*Math.cos(phi);
		let randz = Math.sin(theta)*Math.sin(phi);
		let randDir = new THREE.Vector3(randx, randy, randz);

		if(randDir.clone().dot(isect.normal)<0){
			continue;
		}
		else{
			inputSamples +=1;
		}

		let bRay = new Ray(isect.position, randDir);
		let li = new THREE.Color(0,0,0);

		if(rayIntersectScene(bRay)){
			li = raytracing(bRay, depth, bounce+1);
		}
		let diffuse = new THREE.Color(0,0,0);
		if(isect.material.kd){
			// diffuse = kd.clone().multiply(ls.intensity).multiplyScalar(Math.max(isect.normal.clone().dot(ls.direction), 0));
			diffuse = li.clone().multiply(isect.material.kd).multiplyScalar(randDir.clone().dot(isect.normal));
		}
		bounceColor.add(diffuse);
		let spec = new THREE.Color(0,0,0);
		if(isect.material.p != null && isect.material.ks){
			//let spec = il.clone().multiply(ks.clone().multiplyScalar(Math.max(r.clone().dot(v), 0)** isect.material.p)); 
			spec = li.clone().multiply(isect.material.ks).multiplyScalar(reflect(randDir.clone(), isect.normal));
		}
		bounceColor.add(spec);
	}
	bounceColor.multiplyScalar(2/inputSamples);
	return bounceColor;
}


/* Compute intersection of ray with scene shapes.
 * Return intersection structure (null if no intersection). */
function rayIntersectScene(ray) {
	let tmax = Number.MAX_VALUE;
	let isect = null;
	for(let i=0;i<shapes.length;i++) {
		let hit = shapes[i].intersect(ray, 0.0001, tmax);
		if(hit != null) {
			tmax = hit.t;
			if(isect == null) isect = hit; // if this is the first time intersection is found
			else isect.set(hit); // update intersection point
		}
	}
	return isect;
}

/* Compute reflected vector, by mirroring l around n. */
function reflect(l, n) {
	// r = 2(n.l)*n-l
	let r = n.clone();
	r.multiplyScalar(2*n.dot(l));
	r.sub(l);
	return r;
}

/* Compute refracted vector, given l, n and index_of_refraction. */
function refract(l, n, ior) {
	let mu = (n.dot(l) < 0) ? 1/ior:ior;
	let cosI = l.dot(n);
	let sinI2 = 1 - cosI*cosI;
	if(mu*mu*sinI2>1) return null;
	let sinR = mu*Math.sqrt(sinI2);
	let cosR = Math.sqrt(1-sinR*sinR);
	let r = n.clone();
	if(cosI > 0) {
		r.multiplyScalar(-mu*cosI+cosR);
		r.addScaledVector(l, mu);
	} else {
		r.multiplyScalar(-mu*cosI-cosR);
		r.addScaledVector(l, mu);
	}
	r.normalize();
	return r;
}

/* Convert floating-point color to integer color and assign it to the pixel array. */
function setPixelColor(pixels, index, color) {
	pixels[index+0]=pixelProcess(color.r);
	pixels[index+1]=pixelProcess(color.g);
	pixels[index+2]=pixelProcess(color.b);
	pixels[index+3]=255; // alpha channel is always 255*/
}

/* Multiply exposure, clamp pixel value, then apply gamma correction. */
function pixelProcess(value) {
	value*=exposure; // apply exposure
	value=(value>1)?1:value;
	value = Math.pow(value, 1/2.2);	// 2.2 gamma correction
	return value*255;
}
