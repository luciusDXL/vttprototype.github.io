"use strict";

var m_backgroundImage;

function layerBackground_loadImage(glContext, path)
{
	m_backgroundImage = getTexture(glContext, path);
}

function layerBackground_update()
{
	tile_addQuad(0, 0, m_canvasSize[0], m_canvasSize[1], 1.0, 1.0, 1.0, 1.0, m_backgroundImage);
}
