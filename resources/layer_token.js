"use strict";

const gridSize = 100.0;
var m_tokenSelected = -1;
var m_tokenCount = 0;
var m_tokenImage = [];
var m_tokenX = [];
var m_tokenY = [];
var m_tokenNextX = [];
var m_tokenNextY = [];
var m_tokenW = [];
var m_tokenH = [];
var m_tokenTargetX;
var m_tokenTargetY;
var m_selectOffset = [0, 0];
var m_tokenMoved = false;

function layerToken_create(glContext, imagePath, x, y, w, h)
{
	var id = m_tokenCount;
	m_tokenCount++;
	
	m_tokenImage.push(getTexture(glContext, imagePath));
	m_tokenX.push(x);
	m_tokenY.push(y);
	m_tokenW.push(w);
	m_tokenH.push(h);
	m_tokenNextX.push(x);
	m_tokenNextY.push(y);
		
	return id;
}

function layerToken_update()
{
	for (let i = 0; i < m_tokenCount; i++)
	{
		if (m_tokenSelected == i)
		{
			tile_addQuad((m_tokenX[i])*gridSize-4, (m_tokenY[i])*gridSize-4, (m_tokenX[i]+1.0)*gridSize+4, (m_tokenY[i]+1.0)*gridSize+4, 4.0, 4.0, 0.0, 1.0, m_tokenImage[i]);
		}
		tile_addQuad((m_tokenX[i])*gridSize, (m_tokenY[i])*gridSize, (m_tokenX[i]+1.0)*gridSize, (m_tokenY[i]+1.0)*gridSize, 1.0, 1.0, 1.0, 1.0, m_tokenImage[i]);
		
		if (m_tokenSelected == i && m_tokenMoved)
		{
			tile_addQuad((m_tokenTargetX)*gridSize, (m_tokenTargetY)*gridSize, (m_tokenTargetX+1.0)*gridSize, (m_tokenTargetY+1.0)*gridSize, 1.0, 1.0, 1.0, 1.0, m_tokenImage[i]);
		}
		else
		{
			// Move.
			var dx = m_tokenNextX[i] - m_tokenX[i];
			var dy = m_tokenNextY[i] - m_tokenY[i];
			if (dx || dy)
			{
				var len = Math.sqrt(dx*dx + dy*dy);
				if (len <= 0.1)
				{
					m_tokenX[i] = m_tokenNextX[i];
					m_tokenY[i] = m_tokenNextY[i];
					m_tokenTargetX = m_tokenX[i];
					m_tokenTargetY = m_tokenY[i];
				}
				else
				{
					var clampedLen = Math.min(0.1, len);
					var lenRatio = clampedLen / len;
					
					m_tokenX[i] += dx * lenRatio;
					m_tokenY[i] += dy * lenRatio;
				}
			}
		}
	}
}

function token_moveFinish()
{
	if (m_tokenSelected < 0 || !m_tokenMoved) return;
	m_tokenNextX[m_tokenSelected] = Math.floor(m_tokenTargetX + 0.5);
	m_tokenNextY[m_tokenSelected] = Math.floor(m_tokenTargetY + 0.5);
	m_tokenMoved = false;
}

function token_select(x, y)
{
	m_tokenSelected = -1;
	
	x /= gridSize;
	y /= gridSize;
	for (let i = 0; i < m_tokenCount; i++)
	{
		if (x >= m_tokenX[i] && x < m_tokenX[i] + m_tokenW[i] && y >= m_tokenY[i] && y < m_tokenY[i] + m_tokenH[i])
		{
			m_selectOffset[0] = x - m_tokenX[i];
			m_selectOffset[1] = y - m_tokenY[i];
			
			m_tokenSelected = i;
			return;
		}
	}
}

function token_clearSelection()
{
	m_tokenSelected = -1;
}

function token_getSelected()
{
	return m_tokenSelected;
}

function token_getX(id)
{
	return m_tokenX[id];
}

function token_getY(id)
{
	return m_tokenY[id];
}

function token_move(dx, dy)
{
	var id = m_tokenSelected;
	if (id >= 0 && m_tokenTargetX == m_tokenX[id] && m_tokenTargetY == m_tokenY[id])
	{
		m_tokenTargetX += dx;
		m_tokenTargetY += dy;
		m_tokenMoved = true;
	}
}

function token_setTargetPos(x, y)
{
	m_tokenTargetX = x - m_selectOffset[0];
	m_tokenTargetY = y - m_selectOffset[1];
	m_tokenMoved = true;
}
