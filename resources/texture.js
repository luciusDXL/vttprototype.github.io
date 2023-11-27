var m_textures = new Map();

function getTexture(glContext, path) {
  if (m_textures.has(path))
  {
	return m_textures.get(path);
  }
  var texture = createTexture(glContext, path);
  m_textures.set(path, texture);
  return texture;
}

function requestCORSIfNotSameOrigin(img, url)
{
	if ((new URL(url, window.location.href)).origin !== window.location.origin) {
	  img.crossOrigin = "";
	}
}

function createTexture(glContext, path) {
	// Create a texture.
	var texture = glContext.createTexture();
	glContext.bindTexture(glContext.TEXTURE_2D, texture);

	// Fill the texture with a 1x1 blue pixel.
	glContext.texImage2D(glContext.TEXTURE_2D, 0, glContext.RGBA, 1, 1, 0, glContext.RGBA, glContext.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));
	
	// Asynchronously load an image
	var image = new Image();
	image.src = path;
	requestCORSIfNotSameOrigin(image, path);
	image.addEventListener('load', function() {
		// Now that the image has loaded make copy it to the texture.
		glContext.bindTexture(glContext.TEXTURE_2D, texture);
		glContext.texImage2D(glContext.TEXTURE_2D, 0, glContext.RGBA, glContext.RGBA, glContext.UNSIGNED_BYTE, image);
		glContext.generateMipmap(glContext.TEXTURE_2D);
		
		glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_WRAP_S, glContext.CLAMP_TO_EDGE);
		glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_WRAP_T, glContext.CLAMP_TO_EDGE);
		glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_MIN_FILTER, glContext.LINEAR);
	});
	
	return texture;
}
