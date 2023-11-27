"use strict";

var vertexShaderSourceTile = `#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec4 a_position;
in vec4 a_color;
in vec2 a_uv;
out vec4 frag_color;
out vec2 frag_uv;

uniform vec4 offsetScale;

// all shaders have a main function
void main() {

  // gl_Position is a special variable a vertex shader
  // is responsible for setting
  vec2 pos = a_position.xy * offsetScale.zw + offsetScale.xy;
  gl_Position = vec4(pos.xy, a_position.zw);
  
  frag_color = a_color;
  frag_uv = a_uv;
}
`;

var fragmentShaderSourceTile = `#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

in vec4 frag_color;
in vec2 frag_uv;

uniform sampler2D imageSampler;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
  outColor = texture(imageSampler, frag_uv) * frag_color;
}
`;

var m_program;
var m_vao;
var m_glContext;
var m_shaderVar_offsetScale;
var m_shaderVar_texture;
var m_positionBuffer;

var m_quadCount = 0;
var m_quadVtxStride = 8;
var m_quad = new Float32Array(1024 * m_quadVtxStride * 6);
var m_quadTex;

function tile_clearQuads()
{
	m_quadCount = 0;
}

function tile_setVertex(vtxIndex, x, y, r, g, b, a, u, v)
{
	var index = vtxIndex * m_quadVtxStride;
	m_quad[index + 0] = x;
	m_quad[index + 1] = y;
	m_quad[index + 2] = r;
	m_quad[index + 3] = g;
	m_quad[index + 4] = b;
	m_quad[index + 5] = a;
	m_quad[index + 6] = u;
	m_quad[index + 7] = v;
}

function tile_addQuad(x0, y0, x1, y1, r, g, b, a, texture)
{
	var index = m_quadCount * 6;
	m_quadCount++;
	
	tile_setVertex(index + 0, x0, y0, r, g, b, a, 0.0, 0.0);
	tile_setVertex(index + 1, x1, y0, r, g, b, a, 1.0, 0.0);
	tile_setVertex(index + 2, x1, y1, r, g, b, a, 1.0, 1.0);
	
	tile_setVertex(index + 3, x0, y0, r, g, b, a, 0.0, 0.0);
	tile_setVertex(index + 4, x1, y1, r, g, b, a, 1.0, 1.0);
	tile_setVertex(index + 5, x0, y1, r, g, b, a, 0.0, 1.0);
	
	m_quadTex = texture;
}

function tile_updateQuadBuffer()
{
	var floatsPerQuad = 6/*vtxPerQuad*/ * m_quadVtxStride/*floatsPerVertex*/;
	
	m_glContext.bindBuffer(m_glContext.ARRAY_BUFFER, m_positionBuffer);
	m_glContext.bufferSubData(m_glContext.ARRAY_BUFFER, 0, m_quad, 0, m_quadCount * floatsPerQuad);
}

function tile_quadDraw()
{
	// Tell it to use our program (pair of shaders)
  m_glContext.useProgram(m_program);

  m_offsetScale[0] = -1.0;  
  m_offsetScale[1] =  1.0;
  m_offsetScale[2] =  2.0 / m_viewportSize[0];
  m_offsetScale[3] = -2.0 / m_viewportSize[1];
  // Offset
  m_offsetScale[0] += m_viewportPos[0] * m_offsetScale[2];
  m_offsetScale[1] += m_viewportPos[1] * m_offsetScale[3];
  m_glContext.uniform4fv(m_shaderVar_offsetScale, m_offsetScale);

  // Bind the attribute/buffer set we want.
  m_glContext.bindVertexArray(m_vao);
  
  // For now just bind a single texture.
  

  // draw
  var count = m_quadCount * 6;
  m_glContext.drawArrays(m_glContext.TRIANGLES, 0/*offset*/, count);
}

function tile_create(glContext) {
  m_glContext = glContext;
  
  // create GLSL shaders, upload the GLSL source, compile the shaders
  var vertexShader = createShader(m_glContext, m_glContext.VERTEX_SHADER, vertexShaderSourceTile);
  var fragmentShader = createShader(m_glContext, m_glContext.FRAGMENT_SHADER, fragmentShaderSourceTile);

  // Link the two shaders into a program
  m_program = createProgram(m_glContext, vertexShader, fragmentShader);
   m_glContext.useProgram(m_program);
  
  // Lookup the shader variables.
  m_shaderVar_offsetScale = m_glContext.getUniformLocation(m_program, "offsetScale");
  m_shaderVar_texture = m_glContext.getUniformLocation(m_program, "imageSampler");
  
  m_glContext.uniform1i(m_shaderVar_texture, 0);
  
  // Look up where the vertex data needs to go.
  var positionAttributeLocation = m_glContext.getAttribLocation(m_program, "a_position");
  var colorAttributeLocation = m_glContext.getAttribLocation(m_program, "a_color");
  var uvAttributeLocation = m_glContext.getAttribLocation(m_program, "a_uv");

  // Create a buffer and put three 2d clip space points in it
  m_positionBuffer = m_glContext.createBuffer();

  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  m_glContext.bindBuffer(m_glContext.ARRAY_BUFFER, m_positionBuffer);
  m_glContext.bufferData(m_glContext.ARRAY_BUFFER, m_quad, m_glContext.DYNAMIC_DRAW);

  // Create a vertex array object (attribute state)
  m_vao = m_glContext.createVertexArray();
  m_glContext.bindVertexArray(m_vao);

  // Turn on the attribute
  m_glContext.enableVertexAttribArray(positionAttributeLocation);
  m_glContext.enableVertexAttribArray(colorAttributeLocation);
  m_glContext.enableVertexAttribArray(uvAttributeLocation);

  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var stride = m_quadVtxStride * 4;        // floatsPerVertex * sizeof(float)
  m_glContext.vertexAttribPointer(
      positionAttributeLocation, 2/*size*/, m_glContext.FLOAT, false/*normalize*/, stride, 0/*offset*/);
	  
  m_glContext.vertexAttribPointer(
      colorAttributeLocation, 4/*size*/, m_glContext.FLOAT, false/*normalize*/, stride, 2 * 4/*offset*/);
	  
  m_glContext.vertexAttribPointer(
      uvAttributeLocation, 2/*size*/, m_glContext.FLOAT, false/*normalize*/, stride, 6 * 4/*offset*/);
}
