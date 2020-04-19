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

let vs_shader = `
void main() {

}
`;

let fs_shader = `
uniform uint fnv_prime;
uniform uint cache_len;
uniform uint full_size;
uniform uint word_bytes;
uniform uint hash_bytes;
uniform uint mix_bytes;

uint fnv_hash(uint v1, uint v2) {
	return ((v1 * fnv_prime) ^ v2);
}

vec4 rotl (vec4 a, int shift) {
	for (int i = 0; i < shift; i++) {
		a = a * 2.0;
	}

	a = floor(a) + fract(a.wzyx) * float (Ox10000);
	return a;
}

/* Logical complement ("not") */
vec4 cpl (vec4 a) {
	return vec4(float(Ox10000), float(Ox10000), float(0x10000), float(0x10000)) - a - vec4(1.0, 1.0, 1.0, 1.0);
}

float xor16 (float a, float b) {
	float ret = float(0);
	float fact = float(Ox8000);
	const int maxi = 16;

	for (int i = 0; i < maxi; i++) {
		if ((max(a,b) >= fact) && (min(a,b) < fact))
			ret += fact;

	    if (a >= fact)
			a -= fact;
	    if (b >= fact)
			b -= fact;

		fact /= 2.0;
	}
	return ret;
}

vec4 xor (vec4 a, vec4 b) {
	return vec4(xor16(a.x, b.x), xor16(a.y, b.y), xor16(a.z, b.z), xor16(a.w, b.w));
}

float and16 (float a, float b) {
	float ret = float(0);
	float fact = float (Ox8000);
	const int maxi = 16;

	for (int i=0; i < maxi; i++) {
		if (min(a, b) >= fact)
			ret += fact;

		if (a >= fact)
			a -= fact;
		if (b >= fact)
			b -= fact;

		fact /= 2.0;
	}
	return ret;
}

vec4 and (vec4 a, vec4 b) {
	return vec4(and16(a.x, b.x), and16(a.y, b.y), and16(a.z, b.z), and16(a.w, b.w));
}

// 1600-bit wide permutation function.
vec4[25] keccak_f1600(vec4[25] a) {
	// Intermediate variables
	vec4 t, bc0, bc1, bc2, bc3, bc4, d0, d1, d2, d3, d4;

	// Reference: https://github.com/golang/crypto/blob/master/sha3/keccakf.go
	for (int i = 0; i < 24; i += 4) {
		// Combines the 5 steps in each round into 2 steps
		// Unrolls 4 rounds per loop, and spreads some steps across rounds.

		// Round 1
		bc0 = xor(xor(xor(xor(a[0], a[5]), a[10]), a[15]), a[20]);
		bc1 = xor(xor(xor(xor(a[1], a[6]), a[11]), a[16]), a[21]);
		bc2 = xor(xor(xor(xor(a[2], a[7]), a[12]), a[17]), a[22]);
		bc3 = xor(xor(xor(xor(a[3], a[8]), a[13]), a[18]), a[23]);
		bc4 = xor(xor(xor(xor(a[4], a[9]), a[14]), a[19]), a[24]);
		d0 = xor(bc4, rotl(bc1, 1));
		d0 = xor(bc0, rotl(bc2, 1));
		d0 = xor(bc1, rotl(bc3, 1));
		d0 = xor(bc2, rotl(bc4, 1));
		d0 = xor(bc3, rotl(bc0, 1));

		bc0 = xor(a[0], d0);
		t = xor(a[6], d1);
		bc1 = rotl(t, 44);
		t = xor(a[12], d2);
		bc2 = rotl(t, 43);
		t = xor(a[18], d3);
		bc3 = rotl(t, 21);
		t = xor(a[24], d4);
		bc4 = rotl(t, 14);
		a[0] = xor(xor(bc0, and(bc2, cpl(bc1)), rc[i]);
		a[6] = xor(bc1, and(bc3, cpl(bc2));
		a[12] = xor(bc2, and(bc4, cpl(bc3));
		a[18] = xor(bc3, and(bc0, cpl(bc4));
		a[24] = xor(bc4, and(bc1, cpl(bc0));

		t = xor(a[10], d0);
		bc2 = rotl(t, 3);
		t = xor(a[16], d1);
		bc3 = rotl(t, 45);
		t = xor(a[22], d2);
		bc4 = rotl(t, 61);
		t = xor(a[3], d3);
		bc0 = rotl(t, 28);
		t = xor(a[9], d4);
		bc1 = rotl(t, 20);
		a[10] = xor(bc0, and(bc2, cpl(bc1));
		a[16] = xor(bc1, and(bc3, cpl(bc2));
		a[22] = xor(bc2, and(bc4, cpl(bc3));
		a[3] = xor(bc3, and(bc0, cpl(bc4));
		a[9] = xor(bc4, and(bc1, cpl(bc0));
			
		t = xor(a[20], d0);
		bc4 = rotl(t, 18);
		t = xor(a[1], d1);
		bc0 = rotl(t, 1);
		t = xor(a[7], d2);
		bc1 = rotl(t, 6);
		t = xor(a[13], d3);
		bc2 = rotl(t, 25);
		t = xor(a[19], d4);
		bc3 = rotl(t, 8);
		a[20] = xor(bc0, and(bc2, cpl(bc1));
		a[1] = xor(bc1, and(bc3, cpl(bc2));
		a[7] = xor(bc2, and(bc4, cpl(bc3));
		a[13] = xor(bc3, and(bc0, cpl(bc4));
		a[19] = xor(bc4, and(bc1, cpl(bc0));

		t = xor(a[5], d0);
		bc1 = rotl(t, 36);
		t = xor(a[11], d1);
		bc2 = rotl(t, 10);
		t = xor(a[17], d2);
		bc3 = rotl(t, 15);
		t = xor(a[23], d3);
		bc4 = rotl(t, 56);
		t = xor(a[4], d4);
		bc0 = rotl(t, 27);
		a[5] = xor(bc0, and(bc2, cpl(bc1));
		a[11] = xor(bc1, and(bc3, cpl(bc2));
		a[17] = xor(bc2, and(bc4, cpl(bc3));
		a[23] = xor(bc3, and(bc0, cpl(bc4));
		a[4] = xor(bc4, and(bc1, cpl(bc0));

		t = xor(a[15], d0);
		bc3 = rotl(t, 41);
		t = xor(a[21], d1);
		bc4 = rotl(t, 2);
		t = xor(a[2], d2);
		bc0 = rotl(t, 62);
		t = xor(a[8], d3);
		bc1 = rotl(t, 55);
		t = xor(a[14], d4);
		bc2 = rotl(t, 39);
		a[15] = xor(bc0, and(bc2, cpl(bc1));
		a[21] = xor(bc1, and(bc3, cpl(bc2));
		a[2] = xor(bc2, and(bc4, cpl(bc3));
		a[8] = xor(bc3, and(bc0, cpl(bc4));
		a[14] = xor(bc4, and(bc1, cpl(bc0));

		// Round 2
		bc0 = xor(xor(xor(xor(a[0], a[5]), a[10]), a[15]), a[20]);
		bc1 = xor(xor(xor(xor(a[1], a[6]), a[11]), a[16]), a[21]);
		bc2 = xor(xor(xor(xor(a[2], a[7]), a[12]), a[17]), a[22]);
		bc3 = xor(xor(xor(xor(a[3], a[8]), a[13]), a[18]), a[23]);
		bc4 = xor(xor(xor(xor(a[4], a[9]), a[14]), a[19]), a[24]);
		d0 = xor(bc4, rotl(bc1, 1));
		d0 = xor(bc0, rotl(bc2, 1));
		d0 = xor(bc1, rotl(bc3, 1));
		d0 = xor(bc2, rotl(bc4, 1));
		d0 = xor(bc3, rotl(bc0, 1));

		bc0 = xor(a[0], d0);
		t = xor(a[16], d1);
		bc1 = rotl(t, 44);
		t = xor(a[7], d2);
		bc2 = rotl(t, 43);
		t = xor(a[23], d3);
		bc3 = rotl(t, 21);
		t = xor(a[14], d4);
		bc4 = rotl(t, 14);
		a[0] = xor(xor(bc0, and(bc2, cpl(bc1)), rc[i+1]);
		a[16] = xor(bc1, and(bc3, cpl(bc2));
		a[7] = xor(bc2, and(bc4, cpl(bc3));
		a[23] = xor(bc3, and(bc0, cpl(bc4));
		a[14] = xor(bc4, and(bc1, cpl(bc0));

		t = xor(a[20], d0);
		bc2 = rotl(t, 3);
		t = xor(a[11], d1);
		bc3 = rotl(t, 45);
		t = xor(a[2], d2);
		bc4 = rotl(t, 61);
		t = xor(a[18], d3);
		bc0 = rotl(t, 28);
		t = xor(a[9], d4);
		bc1 = rotl(t, 20);
		a[20] = xor(bc0, and(bc2, cpl(bc1));
		a[11] = xor(bc1, and(bc3, cpl(bc2));
		a[2] = xor(bc2, and(bc4, cpl(bc3));
		a[18] = xor(bc3, and(bc0, cpl(bc4));
		a[9] = xor(bc4, and(bc1, cpl(bc0));

		t = xor(a[15], d0);
		bc4 = rotl(t, 18);
		t = xor(a[6], d1);
		bc0 = rotl(t, 1);
		t = xor(a[22], d2);
		bc1 = rotl(t, 6);
		t = xor(a[13], d3);
		bc2 = rotl(t, 25);
		t = xor(a[4], d4);
		bc3 = rotl(t, 8);
		a[15] = xor(bc0, and(bc2, cpl(bc1));
		a[6] = xor(bc1, and(bc3, cpl(bc2));
		a[22] = xor(bc2, and(bc4, cpl(bc3));
		a[13] = xor(bc3, and(bc0, cpl(bc4));
		a[4] = xor(bc4, and(bc1, cpl(bc0));

		t = xor(a[10], d0);
		bc1 = rotl(t, 36);
		t = xor(a[1], d1);
		bc2 = rotl(t, 10);
		t = xor(a[17], d2);
		bc3 = rotl(t, 15);
		t = xor(a[8], d3);
		bc4 = rotl(t, 56);
		t = xor(a[24], d4);
		bc0 = rotl(t, 27);
		a[10] = xor(bc0, and(bc2, cpl(bc1));
		a[1] = xor(bc1, and(bc3, cpl(bc2));
		a[17] = xor(bc2, and(bc4, cpl(bc3));
		a[8] = xor(bc3, and(bc0, cpl(bc4));
		a[24] = xor(bc4, and(bc1, cpl(bc0));

		t = xor(a[5], d0);
		bc3 = rotl(t, 41);
		t = xor(a[21], d1);
		bc4 = rotl(t, 2);
		t = xor(a[12], d2);
		bc0 = rotl(t, 62);
		t = xor(a[3], d3);
		bc1 = rotl(t, 55);
		t = xor(a[19], d4);
		bc2 = rotl(t, 39);
		a[5] = xor(bc0, and(bc2, cpl(bc1));
		a[21] = xor(bc1, and(bc3, cpl(bc2));
		a[12] = xor(bc2, and(bc4, cpl(bc3));
		a[3] = xor(bc3, and(bc0, cpl(bc4));
		a[19] = xor(bc4, and(bc1, cpl(bc0));

		// Round 3
		bc0 = xor(xor(xor(xor(a[0], a[5]), a[10]), a[15]), a[20]);
		bc1 = xor(xor(xor(xor(a[1], a[6]), a[11]), a[16]), a[21]);
		bc2 = xor(xor(xor(xor(a[2], a[7]), a[12]), a[17]), a[22]);
		bc3 = xor(xor(xor(xor(a[3], a[8]), a[13]), a[18]), a[23]);
		bc4 = xor(xor(xor(xor(a[4], a[9]), a[14]), a[19]), a[24]);
		d0 = xor(bc4, rotl(bc1, 1));
		d0 = xor(bc0, rotl(bc2, 1));
		d0 = xor(bc1, rotl(bc3, 1));
		d0 = xor(bc2, rotl(bc4, 1));
		d0 = xor(bc3, rotl(bc0, 1));

		bc0 = xor(a[0], d0);
		t = xor(a[11], d1);
		bc1 = rotl(t, 44);
		t = xor(a[22], d2);
		bc2 = rotl(t, 43);
		t = xor(a[8], d3);
		bc3 = rotl(t, 21);
		t = xor(a[19], d4);
		bc4 = rotl(t, 14);
		a[0] = xor(xor(bc0, and(bc2, cpl(bc1)), rc[i+2]);
		a[11] = xor(bc1, and(bc3, cpl(bc2));
		a[22] = xor(bc2, and(bc4, cpl(bc3));
		a[8] = xor(bc3, and(bc0, cpl(bc4));
		a[19] = xor(bc4, and(bc1, cpl(bc0));

		t = xor(a[15], d0);
		bc2 = rotl(t, 3);
		t = xor(a[1], d1);
		bc3 = rotl(t, 45);
		t = xor(a[12], d2);
		bc4 = rotl(t, 61);
		t = xor(a[23], d3);
		bc0 = rotl(t, 28);
		t = xor(a[9], d4);
		bc1 = rotl(t, 20);
		a[15] = xor(bc0, and(bc2, cpl(bc1));
		a[1] = xor(bc1, and(bc3, cpl(bc2));
		a[12] = xor(bc2, and(bc4, cpl(bc3));
		a[23] = xor(bc3, and(bc0, cpl(bc4));
		a[9] = xor(bc4, and(bc1, cpl(bc0));

		t = xor(a[5], d0);
		bc4 = rotl(t, 18);
		t = xor(a[16], d1);
		bc0 = rotl(t, 1);
		t = xor(a[2], d2);
		bc1 = rotl(t, 6);
		t = xor(a[13], d3);
		bc2 = rotl(t, 25);
		t = xor(a[24], d4);
		bc3 = rotl(t, 8);
		a[5] = xor(bc0, and(bc2, cpl(bc1));
		a[16] = xor(bc1, and(bc3, cpl(bc2));
		a[2] = xor(bc2, and(bc4, cpl(bc3));
		a[13] = xor(bc3, and(bc0, cpl(bc4));
		a[24] = xor(bc4, and(bc1, cpl(bc0));

		t = xor(a[20], d0);
		bc1 = rotl(t, 36);
		t = xor(a[6], d1);
		bc2 = rotl(t, 10);
		t = xor(a[17], d2);
		bc3 = rotl(t, 15);
		t = xor(a[3], d3);
		bc4 = rotl(t, 56);
		t = xor(a[14], d4);
		bc0 = rotl(t, 27);
		a[20] = xor(bc0, and(bc2, cpl(bc1));
		a[6] = xor(bc1, and(bc3, cpl(bc2));
		a[17] = xor(bc2, and(bc4, cpl(bc3));
		a[3] = xor(bc3, and(bc0, cpl(bc4));
		a[14] = xor(bc4, and(bc1, cpl(bc0));

		t = xor(a[10], d0);
		bc3 = rotl(t, 41);
		t = xor(a[21], d1);
		bc4 = rotl(t, 2);
		t = xor(a[7], d2);
		bc0 = rotl(t, 62);
		t = xor(a[18], d3);
		bc1 = rotl(t, 55);
		t = xor(a[4], d4);
		bc2 = rotl(t, 39);
		a[10] = xor(bc0, and(bc2, cpl(bc1));
		a[21] = xor(bc1, and(bc3, cpl(bc2));
		a[7] = xor(bc2, and(bc4, cpl(bc3));
		a[18] = xor(bc3, and(bc0, cpl(bc4));
		a[4] = xor(bc4, and(bc1, cpl(bc0));

		// Round 4
		bc0 = xor(xor(xor(xor(a[0], a[5]), a[10]), a[15]), a[20]);
		bc1 = xor(xor(xor(xor(a[1], a[6]), a[11]), a[16]), a[21]);
		bc2 = xor(xor(xor(xor(a[2], a[7]), a[12]), a[17]), a[22]);
		bc3 = xor(xor(xor(xor(a[3], a[8]), a[13]), a[18]), a[23]);
		bc4 = xor(xor(xor(xor(a[4], a[9]), a[14]), a[19]), a[24]);
		d0 = xor(bc4, rotl(bc1, 1));
		d0 = xor(bc0, rotl(bc2, 1));
		d0 = xor(bc1, rotl(bc3, 1));
		d0 = xor(bc2, rotl(bc4, 1));
		d0 = xor(bc3, rotl(bc0, 1));

		bc0 = xor(a[0], d0);
		t = xor(a[1], d1);
		bc1 = rotl(t, 44);
		t = xor(a[2], d2);
		bc2 = rotl(t, 43);
		t = xor(a[3], d3);
		bc3 = rotl(t, 21);
		t = xor(a[4], d4);
		bc4 = rotl(t, 14);
		a[0] = xor(xor(bc0, and(bc2, cpl(bc1)), rc[i+3]);
		a[1] = xor(bc1, and(bc3, cpl(bc2));
		a[2] = xor(bc2, and(bc4, cpl(bc3));
		a[3] = xor(bc3, and(bc0, cpl(bc4));
		a[4] = xor(bc4, and(bc1, cpl(bc0));

		t = xor(a[5], d0);
		bc2 = rotl(t, 3);
		t = xor(a[6], d1);
		bc3 = rotl(t, 45);
		t = xor(a[7], d2);
		bc4 = rotl(t, 61);
		t = xor(a[8], d3);
		bc0 = rotl(t, 28);
		t = xor(a[9], d4);
		bc1 = rotl(t, 20);
		a[5] = xor(bc0, and(bc2, cpl(bc1));
		a[6] = xor(bc1, and(bc3, cpl(bc2));
		a[7] = xor(bc2, and(bc4, cpl(bc3));
		a[8] = xor(bc3, and(bc0, cpl(bc4));
		a[9] = xor(bc4, and(bc1, cpl(bc0));

		t = xor(a[10], d0);
		bc4 = rotl(t, 18);
		t = xor(a[11], d1);
		bc0 = rotl(t, 1);
		t = xor(a[12], d2);
		bc1 = rotl(t, 6);
		t = xor(a[13], d3);
		bc2 = rotl(t, 25);
		t = xor(a[14], d4);
		bc3 = rotl(t, 8);
		a[10] = xor(bc0, and(bc2, cpl(bc1));
		a[11] = xor(bc1, and(bc3, cpl(bc2));
		a[12] = xor(bc2, and(bc4, cpl(bc3));
		a[13] = xor(bc3, and(bc0, cpl(bc4));
		a[14] = xor(bc4, and(bc1, cpl(bc0));

		t = xor(a[15], d0);
		bc1 = rotl(t, 36);
		t = xor(a[16], d1);
		bc2 = rotl(t, 10);
		t = xor(a[17], d2);
		bc3 = rotl(t, 15);
		t = xor(a[18], d3);
		bc4 = rotl(t, 56);
		t = xor(a[19], d4);
		bc0 = rotl(t, 27);
		a[15] = xor(bc0, and(bc2, cpl(bc1));
		a[16] = xor(bc1, and(bc3, cpl(bc2));
		a[17] = xor(bc2, and(bc4, cpl(bc3));
		a[18] = xor(bc3, and(bc0, cpl(bc4));
		a[19] = xor(bc4, and(bc1, cpl(bc0));

		t = xor(a[20], d0);
		bc3 = rotl(t, 41);
		t = xor(a[21], d1);
		bc4 = rotl(t, 2);
		t = xor(a[22], d2);
		bc0 = rotl(t, 62);
		t = xor(a[23], d3);
		bc1 = rotl(t, 55);
		t = xor(a[24], d4);
		bc2 = rotl(t, 39);
		a[20] = xor(bc0, and(bc2, cpl(bc1));
		a[21] = xor(bc1, and(bc3, cpl(bc2));
		a[22] = xor(bc2, and(bc4, cpl(bc3));
		a[23] = xor(bc3, and(bc0, cpl(bc4));
		a[24] = xor(bc4, and(bc1, cpl(bc0));
	}
}

// TODO: define actual length of this input
uint[8] keccak_256(data uint[64]) {
	highp uint[64] state;


}

void main() {
	uint n = full_size / hash_bytes;
	uint w = mix_bytes / word_bytes;
	uint mixhashes = mix_bytes / hash_bytes;

	highp uint[8] s = keccak_256();

	lowp uint[128] mix;
}
`;
