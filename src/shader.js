export default function (GL, vertexSource, fragmentSource) {
  function createShader (source, type) {
		var shader = GL.createShader(type);
		GL.shaderSource(shader, source);
		GL.compileShader(shader);

		if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS))
		{
			alert("shader failed to compile: " + GL.getShaderInfoLog(shader));
			return null;
		}

		return shader;
	}

	if (vertexSource == undefined || fragmentSource == undefined) {
		debugger;
	}

	this._program = GL.createProgram();
	var vertexShader = createShader(vertexSource, GL.VERTEX_SHADER);
	if (!vertexShader) {
		return null;
	}

	var fragmentShader = createShader(fragmentSource, GL.FRAGMENT_SHADER);
	if (!fragmentShader) {
		return null;
	}

	GL.attachShader(this._program, vertexShader);
	GL.attachShader(this._program, fragmentShader);
	GL.linkProgram(this._program);

	GL.deleteShader(vertexShader);
	GL.deleteShader(fragmentShader);

	if (!GL.getProgramParameter(this._program, GL.LINK_STATUS)) {
		alert("failed to link program: " + GL.getProgramInfoLog(this._program));
	}

	var attributesCount = GL.getProgramParameter(this._program, GL.ACTIVE_ATTRIBUTES);
	for (var i = 0; i < attributesCount; i++) {
		var name = GL.getActiveAttrib(this._program, i).name;
		this[name] = GL.getAttribLocation(this._program, name);
	}

	var uniformsCount = GL.getProgramParameter(this._program, GL.ACTIVE_UNIFORMS);
	for (var i = 0; i < uniformsCount; i++) {
		var uniform = GL.getActiveUniform(this._program, i);
		this[uniform.name] = GL.getUniformLocation(this._program, uniform.name);
	}

  this.use = function() {
    GL.useProgram(this._program);
  }
}
