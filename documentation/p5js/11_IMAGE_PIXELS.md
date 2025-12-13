# Référence API : Images, Pixels et Filtres

## Fonction : createImage(width, height)
Creates a new <a href="#/p5.Image">p5.Image</a> object.

@method createImage
@param  {Integer} width  width in pixels.
@param  {Integer} height height in pixels.
@return {p5.Image}       new <a href="#/p5.Image">p5.Image</a> object.

---

## Fonction : saveCanvas(selectedCanvas, [filename], [extension])
Saves the current canvas as an image.

 @method saveCanvas
 @param  {p5.Framebuffer|p5.Element|HTMLCanvasElement} selectedCanvas   reference to a
                                                         specific HTML5 canvas element.
 @param  {String} [filename]  file name. Defaults to 'untitled'.
 @param  {String} [extension] file extension, either 'png', 'webp', or 'jpg'. Defaults to 'png'.

## Fonction : saveCanvas([filename], [extension])
 @method saveCanvas
 @param  {String} [filename]
 @param  {String} [extension]

---

## Fonction : loadImage(path, [successCallback], [failureCallback])
Loads an image to create a <a href="#/p5.Image">p5.Image</a> object.

@method loadImage
@param  {String} path path of the image to be loaded or base64 encoded image.
@param  {function(p5.Image)} [successCallback] function called with
                               <a href="#/p5.Image">p5.Image</a> once it
                               loads.
@param  {function(Event)}    [failureCallback] function called with event
                               error if the image fails to load.
@return {p5.Image}            the <a href="#/p5.Image">p5.Image</a> object.

---

## Fonction : image(img, x, y, [width], [height], [sx], [sy], [sWidth], [sHeight], [fit], [xAlign], [yAlign])
Draws an image to the canvas.

@method image
@param  {p5.Image|p5.Element} img image to display.
@param  {Number}   x x-coordinate of the top-left corner of the image.
@param  {Number}   y y-coordinate of the top-left corner of the image.
@param  {Number}   [width]  width to draw the image.
@param  {Number}   [height] height to draw the image.
@param  {Number}   sx     the x-coordinate of the subsection of the source
image to draw into the destination rectangle
@param  {Number}   sy     the y-coordinate of the subsection of the source
image to draw into the destination rectangle
@param {Number}    [sWidth] the width of the subsection of the
                           source image to draw into the destination
                           rectangle
@param {Number}    [sHeight] the height of the subsection of the
                            source image to draw into the destination rectangle
@param {Constant} [fit] either CONTAIN or COVER
@param {Constant} [xAlign] either LEFT, RIGHT or CENTER default is CENTER
@param {Constant} [yAlign] either TOP, BOTTOM or CENTER default is CENTER

---

## Fonction : tint(v1, v2, v3, [alpha])
Tints images using a color.

@method tint
@param  {Number}        v1      red or hue value.
@param  {Number}        v2      green or saturation value.
@param  {Number}        v3      blue or brightness.
@param  {Number}        [alpha]

## Fonction : tint(value)
@method tint
@param  {String}        value   CSS color string.

## Fonction : tint(gray, [alpha])
@method tint
@param  {Number}        gray   grayscale value.
@param  {Number}        [alpha]

## Fonction : tint(values)
@method tint
@param  {Number[]}      values  array containing the red, green, blue &
                                 alpha components of the color.

## Fonction : tint(color)
@method tint
@param  {p5.Color}      color   the tint color

---

## Fonction : noTint()
Removes the current tint set by <a href="#/p5/tint">tint()</a>.

@method noTint

---

## Fonction : imageMode(mode)
Changes the location from which images are drawn when
<a href="#/p5/image">image()</a> is called.

@method imageMode
@param {Constant} mode either CORNER, CORNERS, or CENTER.

---

## Classe : p5.Image
A class to describe an image.

@class p5.Image
@constructor
@param {Number} width
@param {Number} height

### Propriétés
- width: Number (The image's width in pixels.)
- height: Number (The image's height in pixels.)
- pixels: Number[] (An array containing the color of each pixel in the image.)

### Méthodes d'Instance

## Méthode : p5.Image.loadPixels()
Loads the current value of each pixel in the image into the `img.pixels`
array.

@method loadPixels

---

## Méthode : p5.Image.updatePixels([x], [y], [w], [h])
Updates the canvas with the RGBA values in the
<a href="#/p5.Image/pixels">img.pixels</a> array.

@method updatePixels
@param {Integer} x x-coordinate of the upper-left corner
                    of the subsection to update.
@param {Integer} y y-coordinate of the upper-left corner
                    of the subsection to update.
@param {Integer} w width of the subsection to update.
@param {Integer} h height of the subsection to update.

## Méthode : p5.Image.updatePixels()
@method updatePixels

---

## Fonction : get([x], [y], [w], [h])
Gets a pixel or a region of pixels from the canvas.

@method get
@param  {Number}         x x-coordinate of the pixel.
@param  {Number}         y y-coordinate of the pixel.
@param  {Number}         w width of the subsection to be returned.
@param  {Number}         h height of the subsection to be returned.
@return {p5.Image}       subsection as a <a href="#/p5.Image">p5.Image</a> object.

## Fonction : get()
@method get
@return {p5.Image}      whole canvas as a <a href="#/p5.Image">p5.Image</a>.

## Fonction : get(x, y)
@method get
@param  {Number}        x
@param  {Number}        y
@return {Number[]}      color of the pixel at (x, y) in array format `[R, G, B, A]`.

---

## Méthode : p5.Image.get([x], [y], [w], [h])
Gets a pixel or a region of pixels from the image.

@method get
@param  {Number}               x x-coordinate of the pixel.
@param  {Number}               y y-coordinate of the pixel.
@param  {Number}               w width of the subsection to be returned.
@param  {Number}               h height of the subsection to be returned.
@return {p5.Image}             subsection as a <a href="#/p5.Image">p5.Image</a> object.

## Méthode : p5.Image.get()
@method get
@return {p5.Image}      whole <a href="#/p5.Image">p5.Image</a>

## Méthode : p5.Image.get(x, y)
@method get
@param  {Number}        x
@param  {Number}        y
@return {Number[]}      color of the pixel at (x, y) in array format `[R, G, B, A]`.

---

## Fonction : loadPixels()
Loads the current value of each pixel on the canvas into the
<a href="#/p5/pixels">pixels</a> array.

@method loadPixels

---

## Fonction : set(x, y, c)
Sets the color of a pixel or draws an image to the canvas.

@method set
@param {Number}              x x-coordinate of the pixel.
@param {Number}              y y-coordinate of the pixel.
@param {Number|Number[]|Object} c grayscale value | pixel array |
                                <a href="#/p5.Color">p5.Color</a> object | <a href="#/p5.Image">p5.Image</a> to copy.

---

## Méthode : p5.Image.set(x, y, imgOrCol)
Sets the color of one or more pixels within an image.

@method set
@param {Number}              x x-coordinate of the pixel.
@param {Number}              y y-coordinate of the pixel.
@param {Number|Number[]|Object}   a grayscale value | pixel array |
                                   <a href="#/p5.Color">p5.Color</a> object |
                                   <a href="#/p5.Image">p5.Image</a> to copy.

---

## Fonction : updatePixels([x], [y], [w], [h])
Updates the canvas with the RGBA values in the
<a href="#/p5/pixels">pixels</a> array.

@method updatePixels
@param  {Number} [x]    x-coordinate of the upper-left corner of region
                         to update.
@param  {Number} [y]    y-coordinate of the upper-left corner of region
                         to update.
@param  {Number} [w]    width of region to update.
@param  {Number} [h]    height of region to update.

---

## Variable : pixels
An array containing the color of each pixel on the canvas.

@property {Number[]} pixels

---

## Fonction : blend(srcImage, sx, sy, sw, sh, dx, dy, dw, dh, blendMode)
Copies pixels from a source image to a region of the canvas.

@method blend
@param  {p5.Image} srcImage source image.
@param  {Integer} sx x-coordinate of the source's upper-left corner.
@param  {Integer} sy y-coordinate of the source's upper-left corner.
@param  {Integer} sw source image width.
@param  {Integer} sh source image height.
@param  {Integer} dx x-coordinate of the destination's upper-left corner.
@param  {Integer} dy y-coordinate of the destination's upper-left corner.
@param  {Integer} dw destination image width.
@param  {Integer} dh destination image height.
@param  {Constant} blendMode the blend mode. either
     BLEND, DARKEST, LIGHTEST, DIFFERENCE,
     MULTIPLY, EXCLUSION, SCREEN, REPLACE, OVERLAY, HARD_LIGHT,
     SOFT_LIGHT, DODGE, BURN, ADD or NORMAL.

---

## Méthode : p5.Image.blend(srcImage, sx, sy, sw, sh, dx, dy, dw, dh, blendMode)
Copies a region of pixels from another image into this one.

@method blend
@param  {p5.Image} srcImage source image
@param  {Integer} sx x-coordinate of the source's upper-left corner.
@param  {Integer} sy y-coordinate of the source's upper-left corner.
@param  {Integer} sw source image width.
@param  {Integer} sh source image height.
@param  {Integer} dx x-coordinate of the destination's upper-left corner.
@param  {Integer} dy y-coordinate of the destination's upper-left corner.
@param  {Integer} dw destination image width.
@param  {Integer} dh destination image height.
@param  {Constant} blendMode the blend mode. either
     BLEND, DARKEST, LIGHTEST, DIFFERENCE,
     MULTIPLY, EXCLUSION, SCREEN, REPLACE, OVERLAY, HARD_LIGHT,
     SOFT_LIGHT, DODGE, BURN, ADD or NORMAL.

---

## Fonction : copy(srcImage, sx, sy, sw, sh, dx, dy, dw, dh)
Copies pixels from a source image to a region of the canvas.

@method copy
@param  {p5.Image|p5.Element} srcImage source image.
@param  {Integer} sx x-coordinate of the source's upper-left corner.
@param  {Integer} sy y-coordinate of the source's upper-left corner.
@param  {Integer} sw source image width.
@param  {Integer} sh source image height.
@param  {Integer} dx x-coordinate of the destination's upper-left corner.
@param  {Integer} dy y-coordinate of the destination's upper-left corner.
@param  {Integer} dw destination image width.
@param  {Integer} dh destination image height.

---

## Méthode : p5.Image.copy([srcImage], sx, sy, sw, sh, dx, dy, dw, dh)
Copies pixels from a source image to this image.

@method copy
@param  {p5.Image|p5.Element} srcImage source image.
@param  {Integer} sx x-coordinate of the source's upper-left corner.
@param  {Integer} sy y-coordinate of the source's upper-left corner.
@param  {Integer} sw source image width.
@param  {Integer} sh source image height.
@param  {Integer} dx x-coordinate of the destination's upper-left corner.
@param  {Integer} dy y-coordinate of the destination's upper-left corner.
@param  {Integer} dw destination image width.
@param  {Integer} dh destination image height.

## Méthode : p5.Image.copy(sx, sy, sw, sh, dx, dy, dw, dh)
@method copy
@param  {Integer} sx
@param  {Integer} sy
@param  {Integer} sw
@param  {Integer} sh
@param  {Integer} dx
@param  {Integer} dy
@param  {Integer} dw
@param  {Integer} dh

---

## Méthode : p5.Image.mask(srcImage)
Masks part of the image with another.

@method mask
@param {p5.Image} srcImage source image.

---

## Fonction : filter(filterType, [filterParam])
Applies an image filter to the canvas.

@method filter
@param  {Constant} filterType  either THRESHOLD, GRAY, OPAQUE, INVERT,
                                POSTERIZE, BLUR, ERODE, DILATE or BLUR.
@param  {Number} [filterParam] parameter unique to each filter.

---

## Méthode : p5.Image.filter(filterType, [filterParam])
Applies an image filter to the image.

@method filter
@param  {Constant} filterType  either THRESHOLD, GRAY, OPAQUE, INVERT,
                                POSTERIZE, ERODE, DILATE or BLUR.
@param  {Number} [filterParam] parameter unique to each filter.

---

## Méthode : p5.Image.resize(width, height)
Resizes the image to a given width and height.

@method resize
@param {Number} width resized image width.
@param {Number} height resized image height.

---

## Méthode : p5.Image.save(filename, [extension])
Saves the image to a file.

@method save
@param {String} filename filename. Defaults to 'untitled'.
@param  {String} [extension] file extension, either 'png' or 'jpg'.
                            Defaults to 'png'.

---

## Méthode : p5.Image.reset()
Restarts an animated GIF at its first frame.

@method reset

---

## Méthode : p5.Image.getCurrentFrame()
Gets the index of the current frame in an animated GIF.

@method getCurrentFrame
@return {Number}       index of the GIF's current frame.

---

## Méthode : p5.Image.setFrame(index)
Sets the current frame in an animated GIF.

@method setFrame
@param {Number} index index of the frame to display.

---

## Méthode : p5.Image.numFrames()
Returns the number of frames in an animated GIF.

@method numFrames
@return {Number} number of frames in the GIF.

---

## Méthode : p5.Image.play()
Plays an animated GIF that was paused with
<a href="#/p5.Image/pause">img.pause()</a>.

@method play

---

## Méthode : p5.Image.pause()
Pauses an animated GIF.

The GIF can be resumed by calling
<a href="#/p5.Image/play">img.play()</a>.

@method pause

---

## Méthode : p5.Image.delay(d, [index])
Changes the delay between frames in an animated GIF.

@method delay
@param {Number} d delay in milliseconds between switching frames.
@param {Number} [index] index of the frame that will have its delay modified.