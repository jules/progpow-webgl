const FNV_PRIME = 16777619;
const CACHE_SIZE = 1000;
const CACHE_ROUNDS = 3;
const KECCAK_256_SIZE = 64;

var gl;

function fnv_hash(v1, v2) {
	return ((v1 * FNV_PRIME) ^ v2) % 2**32;
}

function make_cache(seed) {
	let n = CACHE_SIZE / KECCAK_256_SIZE;

	// Produce initial data set
	let data_set = [];
	data_set.push(keccak_512(seed));
	for (let i = 1; i < n; i++) {
		data_set.push(keccak_512(data_set[i-1]));
	}

	// randmemohash
	for (let i = 0; i < CACHE_ROUNDS; i++) {
		for (let j = 0; j < n; j++) {
			let value = data_set[j][0] % n;
			data_set[j] = keccak_512(data_set[(i-1+value) % value] ^ data_set[value]);
		}
	}

	return data_set;
}

function init(threads) {
	canvas = document.createElement('canvas');
    canvas.height = 1;
    canvas.width = threads;

	// Try for both WebGL2 contexts.
    var names = [ "webgl2", "experimental-webgl2" ];
    for (var i=0; i<names.length; i++) {
        gl = canvas.getContext(names[i]);
        if (gl) { break; }
    }

    if(!gl) {
        console.log("Could not initialize WebGL2 context");
		return;
    }

	var program = gl.createProgram();
	
	// Shader stuff goes here
}
