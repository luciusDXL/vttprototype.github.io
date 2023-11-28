"use strict";

var m_glContext;
var m_offsetScale = [0.0, 0.0, 0.25, 0.25];
var m_viewportSize = [1.0, 1.0];
var m_viewportPos = [0.0, 0.0];

const MouseButton = {
	Left:   0,
	Middle: 1,
	Right:  2,
	Count : 3
};
var m_mousePos = [0, 0];
var m_mouseClick = [false, false, false];
var m_mouseDown = [false, false, false];

function canvas_updateViewport() {
  // Resize the canvas to the webpage.
  webglUtils.resizeCanvasToDisplaySize(m_glContext.canvas);

  // Setup the viewport based on the canvas size.
  m_glContext.viewport(0, 0, m_glContext.canvas.width, m_glContext.canvas.height);
  m_viewportSize = [m_glContext.canvas.width, m_glContext.canvas.height];
}

var tokenPos0 = [0.0, 0.0];
var tokenPos1 = [3.0, 3.0];
var prevRightPos = [0.0, 0.0];
var m_testToken0;
var m_testToken1;

function canvas_update() {
  canvas_updateViewport();
  
  if (m_mouseClick[MouseButton.Left])
  {
	  tokenPos0[0] = Math.floor((m_mousePos[0] - m_viewportPos[0]) / 100.0);
	  tokenPos0[1] = Math.floor((m_mousePos[1] - m_viewportPos[1]) / 100.0);
  }
  if (m_mouseDown[MouseButton.Right])
  {
	  if (m_mouseClick[MouseButton.Right])
	  {
		  prevRightPos[0] = m_mousePos[0];
		  prevRightPos[1] = m_mousePos[1];
	  }
	  
	  m_viewportPos[0] += (m_mousePos[0] - prevRightPos[0]);
	  m_viewportPos[1] += (m_mousePos[1] - prevRightPos[1]);
	  
	  prevRightPos[0] = m_mousePos[0];
	  prevRightPos[1] = m_mousePos[1];
  }
  tile_clearQuads();
  
  // Draw the background.
  layerBackground_update();
  	
  // Test
  tile_addQuad((tokenPos0[0]) * 100.0, (tokenPos0[1])*100.0, (tokenPos0[0]+1.0)*100.0, (tokenPos0[1]+1.0)*100.0, 1.0, 1.0, 1.0, 1.0, m_testToken0);
  tile_addQuad((tokenPos1[0]) * 100.0, (tokenPos1[1])*100.0, (tokenPos1[0]+1.0)*100.0, (tokenPos1[1]+1.0)*100.0, 1.0, 1.0, 1.0, 1.0, m_testToken1);
  	    
  // Clear the canvas
  m_glContext.clearColor(0.5, 0.5, 0.5, 1.0);
  m_glContext.clear(m_glContext.COLOR_BUFFER_BIT);
    
  // Draw the quads.
  tile_updateQuadBuffer();
  tile_quadDraw();
  
  // Draw layers.
  layerGrid_update(m_viewportPos[0], m_viewportPos[1]);
  
  // Keep updating...
  requestAnimationFrame(canvas_update);
  // Clear out mouse clicks.
  for (let i = 0; i < MouseButton.Count; i++) {
	m_mouseClick[i] = false;
  }
}

function canvas_createLayers() {
  tile_create(m_glContext);
  layerGrid_create(m_glContext);
  layerBackground_loadImage(m_glContext, "assets/maps/JungleEncounterCave.jpg");
}

function onMouseMove(e) {
  m_mousePos[0] = e.clientX;
  m_mousePos[1] = e.clientY;
}

function onMouseDown(e) {
  m_mouseClick[e.button] = true;
  m_mouseDown[e.button] = true;
}

function onMouseUp(e) {
  m_mouseClick[e.button] = false;
  m_mouseDown[e.button] = false;
}

function onContextMenu(e) {
  e.preventDefault();
  return false;
}

function canvas_create() {
  // Get A WebGL context
  var canvas = document.querySelector("#c");
  m_glContext = canvas.getContext("webgl2", { alpha: false });
  if (!m_glContext) {
    return;
  }
  m_viewportSize = [m_glContext.canvas.width, m_glContext.canvas.height];
  m_testToken0 = getTexture(m_glContext, "assets/tokens/Tavros_Token_v1.png");
  m_testToken1 = getTexture(m_glContext, "assets/tokens/Psyclonnen Reborn Token Small.png");
  
  // Layers	  
  canvas_createLayers();
  
  // Events...
  canvas.onmousemove = onMouseMove;
  canvas.onmousedown = onMouseDown;
  canvas.onmouseup = onMouseUp;
  canvas.oncontextmenu = onContextMenu;
}
