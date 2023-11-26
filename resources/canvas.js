"use strict";

var vertexShaderSource = `#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec4 a_position;
in vec4 a_color;
out vec4 frag_color;

uniform vec4 offsetScale;

// all shaders have a main function
void main() {

  // gl_Position is a special variable a vertex shader
  // is responsible for setting
  vec2 pos = a_position.xy * offsetScale.zw + offsetScale.xy;
  gl_Position = vec4(pos.xy, a_position.zw);
  
  frag_color = a_color;
}
`;

var fragmentShaderSource = `#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

in vec4 frag_color;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
  outColor = frag_color;
}
`;

function createShader(gl, type, source) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }

  console.log(gl.getShaderInfoLog(shader));  // eslint-disable-line
  gl.deleteShader(shader);
  return undefined;
}

function createProgram(gl, vertexShader, fragmentShader) {
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }

  console.log(gl.getProgramInfoLog(program));  // eslint-disable-line
  gl.deleteProgram(program);
  return undefined;
}

var m_program;
var m_vao;
var m_glContext;
var m_offsetScale = [0.0, 0.0, 0.25, 0.25];
var m_viewportSize = [1.0, 1.0];
var m_shaderVar_offsetScale;
var m_positionBuffer;

var m_quadCount = 0;
var m_quadVtxStride = 6;
var m_quad = new Float32Array(1024 * m_quadVtxStride * 6);

function canvas_clearQuads()
{
	m_quadCount = 0;
}

function setVertex(vtxIndex, x, y, r, g, b, a)
{
	var index = vtxIndex * m_quadVtxStride;
	m_quad[index + 0] = x;
	m_quad[index + 1] = y;
	m_quad[index + 2] = r;
	m_quad[index + 3] = g;
	m_quad[index + 4] = b;
	m_quad[index + 5] = a;
}

function canvas_addQuad(x0, y0, x1, y1, r, g, b, a)
{
	var index = m_quadCount * 6;
	m_quadCount++;
	
	setVertex(index + 0, x0, y0, r, g, b, a);
	setVertex(index + 1, x1, y0, r, g, b, a);
	setVertex(index + 2, x1, y1, r, g, b, a);
	
	setVertex(index + 3, x0, y0, r, g, b, a);
	setVertex(index + 4, x1, y1, r, g, b, a);
	setVertex(index + 5, x0, y1, r, g, b, a);
}

function canvas_updateQuadBuffer()
{
	m_glContext.bindBuffer(m_glContext.ARRAY_BUFFER, m_positionBuffer);
	m_glContext.bufferSubData(m_glContext.ARRAY_BUFFER, 0, m_quad, 0, m_quadCount * 12 * 4);
}

function canvas_update() {
  // Test
  canvas_clearQuads();
  canvas_addQuad(0, 0, 255, 255, 1.0, 0.0, 0.0, 1.0);
  canvas_addQuad(256, 256, 511, 511, 0.0, 1.0, 0.0, 1.0);
  canvas_addQuad(512, 512, 767, 767, 0.0, 0.0, 1.0, 1.0);
  canvas_updateQuadBuffer();
	
  webglUtils.resizeCanvasToDisplaySize(m_glContext.canvas);

  // Tell WebGL how to convert from clip space to pixels
  m_glContext.viewport(0, 0, m_glContext.canvas.width, m_glContext.canvas.height);
  m_viewportSize = [m_glContext.canvas.width, m_glContext.canvas.height];
  
  // Clear the canvas
  m_glContext.clearColor(0, 0, 0, 0);
  m_glContext.clear(m_glContext.COLOR_BUFFER_BIT);

  // Tell it to use our program (pair of shaders)
  m_glContext.useProgram(m_program);

  m_offsetScale[0] = -1.0;  
  m_offsetScale[1] =  1.0;
  m_offsetScale[2] =  2.0 / m_viewportSize[0];
  m_offsetScale[3] = -2.0 / m_viewportSize[1];
  m_glContext.uniform4fv(m_shaderVar_offsetScale, m_offsetScale);

  // Bind the attribute/buffer set we want.
  m_glContext.bindVertexArray(m_vao);

  // draw
  var primitiveType = m_glContext.TRIANGLES;
  var offset = 0;
  var count = m_quadCount * 6;
  m_glContext.drawArrays(primitiveType, offset, count);
  
  // Keep updating...
  requestAnimationFrame(canvas_update);
}

function canvas_create() {
  // Get A WebGL context
  var canvas = document.querySelector("#c");
  m_glContext = canvas.getContext("webgl2");
  if (!m_glContext) {
    return;
  }
  m_viewportSize = [m_glContext.canvas.width, m_glContext.canvas.height];

  // create GLSL shaders, upload the GLSL source, compile the shaders
  var vertexShader = createShader(m_glContext, m_glContext.VERTEX_SHADER, vertexShaderSource);
  var fragmentShader = createShader(m_glContext, m_glContext.FRAGMENT_SHADER, fragmentShaderSource);

  // Link the two shaders into a program
  m_program = createProgram(m_glContext, vertexShader, fragmentShader);
  
  // Lookup the shader variables.
  m_shaderVar_offsetScale = m_glContext.getUniformLocation(m_program, "offsetScale");
  
  // look up where the vertex data needs to go.
  var positionAttributeLocation = m_glContext.getAttribLocation(m_program, "a_position");
  var colorAttributeLocation = m_glContext.getAttribLocation(m_program, "a_color");

  // Create a buffer and put three 2d clip space points in it
  m_positionBuffer = m_glContext.createBuffer();

  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  m_glContext.bindBuffer(m_glContext.ARRAY_BUFFER, m_positionBuffer);

  m_glContext.bufferData(m_glContext.ARRAY_BUFFER, m_quad, m_glContext.DYNAMIC_DRAW);

  // Create a vertex array object (attribute state)
  m_vao = m_glContext.createVertexArray();

  // and make it the one we're currently working with
  m_glContext.bindVertexArray(m_vao);

  // Turn on the attribute
  m_glContext.enableVertexAttribArray(positionAttributeLocation);
  m_glContext.enableVertexAttribArray(colorAttributeLocation);

  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var stride = 6 * 4;        // 6 * sizeof(float)
  m_glContext.vertexAttribPointer(
      positionAttributeLocation, 2/*size*/, m_glContext.FLOAT, false/*normalize*/, stride, 0/*offset*/);
	  
  m_glContext.vertexAttribPointer(
      colorAttributeLocation, 4/*size*/, m_glContext.FLOAT, false/*normalize*/, stride, 2 * 4/*offset*/);
}
