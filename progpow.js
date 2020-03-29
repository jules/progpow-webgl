const FNV_PRIME = 16777619;

var gl;

function fnv_hash(v1, v2) {
	return ((v1 * FNV_PRIME) ^ v2) % 2**32;
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
