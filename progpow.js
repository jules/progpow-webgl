const FNV_PRIME = 16777619;
const CACHE_SIZE = 1000;
const CACHE_ROUNDS = 3;
const KECCAK_512_SIZE = 64;
const WORD_BYTES = 4;
const DATA_SET_PARENTS = 256;

var gl;

function fnv_hash(v1, v2) {
	return ((v1 * FNV_PRIME) ^ v2) % 2**32;
}

function make_cache(seed) {
	let n = Math.floor(CACHE_SIZE / KECCAK_512_SIZE);

	// Produce initial data set
	let cache = [];
	cache.push(keccak_512(seed));
	for (let i = 1; i < n; i++) {
		cache.push(keccak_512(cache[i-1]));
	}

	// randmemohash
	for (let i = 0; i < CACHE_ROUNDS; i++) {
		for (let j = 0; j < n; j++) {
			let value = cache[j][0] % n;
			cache[j] = keccak_512(cache[(i-1+value) % value] ^ cache[value]);
		}
	}

	return cache;
}

function calculate_data_set_item(cache, i) {
	let n = cache.length();
	let r = Math.floor(KECCAK_512_SIZE / WORD_BYTES);
	
	// TODO: This needs to be a copy, not a ref
	let mix = cache[i % n];
	mix[0] ^= i;
	mix = keccak_512(mix);

	for (let j = 0; j < DATA_SET_PARENTS; j++) {
		let cache_index = fnv(i ^ j, mix[j % r]);
		mix.map(b => fnv(b, cache[cache_index % n]);
	}

	return keccak_512(mix);
}

function calculate_data_set(cache) {
	let data_set = [];
	let n = Math.floor(CACHE_SIZE / KECCAK_512_SIZE);
	for (let i = 0; i < n; i++) {
		data_set.push(calculate_data_set_item(cache, i);
	}

	return data_set;
}

function init(threads) {
	canvas = document.createElement('canvas');
	canvas.height = 1;
	canvas.width = threads;
	
	// Try for both WebGL2 contexts.
	let names = [ "webgl2", "experimental-webgl2" ];
	for (let i=0; i<names.length; i++) {
		gl = canvas.getContext(names[i]);
		if (gl) { 
			break; 
		}
	}
	
	if(!gl) {
		console.log("Could not initialize WebGL2 context");
		return;
	}
	
	let program = gl.createProgram();

	let vertex_shader = create_shader(gl, gl.VERTEX_SHADER, vs_shader);
	let fragment_shader = create_shader(gl, gl.FRAGMENT_SHADER, fs_shader);

	gl.attachShader(program, vertex_shader);
	gl.attachShader(program, fragment_shader);
	gl.linkProgram(program);
	if !(gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.log("oops");
		return;
	}
}

function create_shader(gl, type, source) {
	var shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
	if (success) {
		return shader;
	}
 
	console.log(gl.getShaderInfoLog(shader));
	gl.deleteShader(shader);
}

/////////////// SHADER SOURCES ///////////////////

let vs_shader = `#version 300 es

void main() {

}
`;

let fs_shader = `#version 300 es

uniform uint fnv_prime;
uniform uint cache_len;
uniform uint full_size;
uniform uint word_bytes;
uniform uint hash_bytes;
uniform uint mix_bytes;

uint fnv_hash(uint v1, uint v2) {
	return ((v1 * fnv_prime) ^ v2);
}

void main() {
	uint n = full_size / hash_bytes;
	

}
`;
