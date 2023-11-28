"use strict";

var vertexShaderSourceLine = `#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec4 a_position;

uniform vec4 offsetScale;

// all shaders have a main function
void main() {

  // gl_Position is a special variable a vertex shader
  // is responsible for setting
  vec2 pos = a_position.xy * offsetScale.zw + offsetScale.xy;
  gl_Position = vec4(pos.xy, a_position.zw);
}
`;

var fragmentShaderSourceLine = `#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

uniform vec4 color;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
  outColor = color;
}
`;

var m_programLine;
var m_vaoLine;
var m_glContext;
var m_offsetScaleLine = [0.0, 0.0, 0.25, 0.25];
var m_lineColor = [0.0, 0.0, 0.0, 0.5];
var m_viewportSize = [1.0, 1.0];
var m_viewportPos = [0.0, 0.0];
var m_shaderVar_offsetScaleLine;
var m_shaderVar_colorLine;
var m_lineBuffer;

var m_lineCount = 0;
var m_lineVtxStride = 2;
var m_line = new Float32Array(1024 * m_lineVtxStride * 2);

function layerGrid_clearLines()
{
	m_lineCount = 0;
}

function layerGrid_setVertex(vtxIndex, x, y)
{
	var index = vtxIndex * m_lineVtxStride;
	m_line[index + 0] = x;
	m_line[index + 1] = y;
}

function layerGrid_addLine(x0, y0, x1, y1)
{
	var index = m_lineCount * 2;
	m_lineCount++;
	
	layerGrid_setVertex(index + 0, x0, y0);
	layerGrid_setVertex(index + 1, x1, y1);
}

function layerGrid_updateLineBuffer()
{
	var floatsPerLine = 2/*vtxPerLine*/ * m_lineVtxStride/*floatsPerVertex*/;
	
	m_glContext.bindBuffer(m_glContext.ARRAY_BUFFER, m_lineBuffer);
	m_glContext.bufferSubData(m_glContext.ARRAY_BUFFER, 0, m_line, 0, m_lineCount * floatsPerLine);
}

function layerGrid_lineDraw()
{
  // Blending
  m_glContext.enable(m_glContext.BLEND);
  m_glContext.blendFunc(m_glContext.SRC_ALPHA, m_glContext.ONE_MINUS_SRC_ALPHA);
	
  m_glContext.useProgram(m_programLine);

  m_offsetScaleLine[0] = -1.0;  
  m_offsetScaleLine[1] =  1.0;
  m_offsetScaleLine[2] =  2.0 / m_viewportSize[0];
  m_offsetScaleLine[3] = -2.0 / m_viewportSize[1];
  // Offset
  m_offsetScaleLine[0] += m_viewportPos[0] * m_offsetScaleLine[2];
  m_offsetScaleLine[1] += m_viewportPos[1] * m_offsetScaleLine[3];
  
  m_glContext.uniform4fv(m_shaderVar_offsetScaleLine, m_offsetScaleLine);
  
  m_glContext.uniform4fv(m_shaderVar_colorLine, m_lineColor);

  // Bind the attribute/buffer set we want.
  m_glContext.bindVertexArray(m_vaoLine);

  // draw
  var count = m_lineCount * 2;
  m_glContext.drawArrays(m_glContext.LINES, 0/*offset*/, count);
  
  // Restore
  m_glContext.disable(m_glContext.BLEND);
}

function layerGrid_setViewport(x, y) {
  m_viewportSize = [m_glContext.canvas.width, m_glContext.canvas.height];
  m_viewportPos = [x, y];
}

function layerGrid_update(x, y) {
  layerGrid_setViewport(x, y);
	
  layerGrid_clearLines();
  const gridSize = 100;

// columns  
  const gy0 = 0;
  const gy1 = 2100;
  for (let i = 0; i < 28; i++)
  {
	  var gx = i * gridSize;
	  layerGrid_addLine(gx, gy0, gx, gy1);
  }
  // rows
  const gx0 = 0;
  const gx1 = 2800;
  for (let i = 0; i < 21; i++)
  {
	  var gy = i * gridSize;
	  layerGrid_addLine(gx0, gy, gx1, gy);
  }
  
  layerGrid_updateLineBuffer();
  layerGrid_lineDraw();
}

function layerGrid_create(glContext) {
  m_glContext = glContext;	

  // create GLSL shaders, upload the GLSL source, compile the shaders
  var vertexShader = createShader(m_glContext, m_glContext.VERTEX_SHADER, vertexShaderSourceLine);
  var fragmentShader = createShader(m_glContext, m_glContext.FRAGMENT_SHADER, fragmentShaderSourceLine);

  // Link the two shaders into a program
  m_programLine = createProgram(m_glContext, vertexShader, fragmentShader);
  
  // Lookup the shader variables.
  m_shaderVar_offsetScaleLine = m_glContext.getUniformLocation(m_programLine, "offsetScale");
  m_shaderVar_colorLine = m_glContext.getUniformLocation(m_programLine, "color");
  
  // Look up where the vertex data needs to go.
  var positionAttributeLocation = m_glContext.getAttribLocation(m_programLine, "a_position");

  // Create a buffer and put three 2d clip space points in it
  m_lineBuffer = m_glContext.createBuffer();

  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  m_glContext.bindBuffer(m_glContext.ARRAY_BUFFER, m_lineBuffer);
  m_glContext.bufferData(m_glContext.ARRAY_BUFFER, m_line, m_glContext.DYNAMIC_DRAW);

  // Create a vertex array object (attribute state)
  m_vaoLine = m_glContext.createVertexArray();
  m_glContext.bindVertexArray(m_vaoLine);

  // Turn on the attribute
  m_glContext.enableVertexAttribArray(positionAttributeLocation);

  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var stride = m_lineVtxStride * 4;        // floatsPerVertex * sizeof(float)
  m_glContext.vertexAttribPointer(
      positionAttributeLocation, 2/*size*/, m_glContext.FLOAT, false/*normalize*/, stride, 0/*offset*/);
}
