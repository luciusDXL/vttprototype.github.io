"use strict";

var m_backgroundImage;

function layerBackground_loadImage(glContext, path)
{
	m_backgroundImage = getTexture(glContext, path);
}

function layerBackground_update()
{
	tile_addQuad(0, 0, 2800, 2100, 1.0, 1.0, 1.0, 1.0, m_backgroundImage);
}
