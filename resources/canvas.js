"use strict";

var m_glContext;
var m_offsetScale = [0.0, 0.0, 0.25, 0.25];
var m_viewportSize = [1.0, 1.0];
var m_viewportPos = [0.0, 0.0];
var m_canvasSize = [2800, 2100];

const KeyInput = {
	W: 0,
	S: 1,
	A: 2,
	D: 3,
	Count: 4
};

const MouseButton = {
	Left:   0,
	Middle: 1,
	Right:  2,
	Count : 3
};
var m_mousePos = [0, 0];
var m_mouseClick = [false, false, false];
var m_mouseDown = [false, false, false];
var m_keyDown = [false, false, false, false];

function canvas_updateViewport() {
  // Resize the canvas to the webpage.
  webglUtils.resizeCanvasToDisplaySize(m_glContext.canvas);

  // Setup the viewport based on the canvas size.
  m_glContext.viewport(0, 0, m_glContext.canvas.width, m_glContext.canvas.height);
  m_viewportSize = [m_glContext.canvas.width, m_glContext.canvas.height];
}

var prevRightPos = [0.0, 0.0];

function canvas_update() {
  canvas_updateViewport();

  var selected = token_getSelected();  
  var moveX = 0;
  var moveY = 0;
  if (m_keyDown[KeyInput.W] && selected >= 0)
  {
	  moveY = -1;
  }
  else if (m_keyDown[KeyInput.S] && selected >= 0)
  {
	  moveY = 1;
  }
  if (m_keyDown[KeyInput.A] && selected >= 0)
  {
	  moveX = -1;
  }
  else if (m_keyDown[KeyInput.D] && selected >= 0)
  {
	  moveX = 1;
  }
  if (moveX || moveY)
  {
	token_move(moveX, moveY);
  }
  
  if (m_mouseClick[MouseButton.Left])
  {
	  token_select(m_mousePos[0] - m_viewportPos[0], m_mousePos[1] - m_viewportPos[1]);
  }
  else if (m_mouseDown[MouseButton.Left])
  {
	  if (selected >= 0)
	  {
		  token_setTargetPos((m_mousePos[0] - m_viewportPos[0])/100.0, (m_mousePos[1] - m_viewportPos[1])/100.0);
	  }
  }
  else
  {
	  token_moveFinish();
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
   // Clear the canvas
  m_glContext.clearColor(0.5, 0.5, 0.5, 1.0);
  m_glContext.clear(m_glContext.COLOR_BUFFER_BIT);
  
  // Draw the background.
  tile_clearQuads();
  layerBackground_update();
  
  // Draw the quads.
  tile_updateQuadBuffer();
  tile_quadDraw();
  
  // Draw layers.
  layerGrid_update(m_viewportPos[0], m_viewportPos[1]);
  	
  // Draw tokens.
  tile_clearQuads();
  layerToken_update();
  tile_updateQuadBuffer();
  tile_quadDraw();
      
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

function onKeyDown(e) {
  if (e.key == "w")
  {
	  m_keyDown[KeyInput.W] = true;
  }
  if (e.key == "s")
  {
	  m_keyDown[KeyInput.S] = true;
  }
  
  if (e.key == "a")
  {
	  m_keyDown[KeyInput.A] = true;
  }
  if (e.key == "d")
  {
	  m_keyDown[KeyInput.D] = true;
  }
}

function onKeyUp(e) {
  if (e.key == "w")
  {
	  m_keyDown[KeyInput.W] = false;
  }
  if (e.key == "s")
  {
	  m_keyDown[KeyInput.S] = false;
  }
  
  if (e.key == "a")
  {
	  m_keyDown[KeyInput.A] = false;
  }
  if (e.key == "d")
  {
	  m_keyDown[KeyInput.D] = false;
  }
}

function canvas_create() {
  // Get A WebGL context
  var canvas = document.querySelector("#c");
  m_glContext = canvas.getContext("webgl2", { alpha: false });
  if (!m_glContext) {
    return;
  }
  m_viewportSize = [m_glContext.canvas.width, m_glContext.canvas.height];
  layerToken_create(m_glContext, "assets/tokens/Tavros_Token_v1.png", 10, 10, 1, 1);
  layerToken_create(m_glContext, "assets/tokens/Psyclonnen Reborn Token Small.png", 20, 20, 1, 1);
  
  // Layers	  
  canvas_createLayers();
  
  // Events...
  canvas.onmousemove = onMouseMove;
  canvas.onmousedown = onMouseDown;
  canvas.onmouseup = onMouseUp;
  canvas.oncontextmenu = onContextMenu;
  
  window.addEventListener("keydown",onKeyDown);
  window.addEventListener("keyup",onKeyUp);
}
