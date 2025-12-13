# Référence API : Typographie

## Fonction : textAlign(horizAlign, [vertAlign])
Sets the way text is aligned when <a href="#/p5/text">text()</a> is called.

@method textAlign
@param {Constant} horizAlign horizontal alignment, either LEFT,
                            CENTER, or RIGHT.
@param {Constant} [vertAlign] vertical alignment, either TOP,
                            BOTTOM, CENTER, or BASELINE.
@chainable

## Fonction : textAlign()
@method textAlign
@return {Object}

---

## Fonction : textLeading(leading)
Sets the spacing between lines of text when
<a href="#/p5/text">text()</a> is called.

@method textLeading
@param {Number} leading spacing between lines of text in units of pixels.
@chainable

## Fonction : textLeading()
@method textLeading
@return {Number}

---

## Fonction : textSize(size)
Sets the font size when
<a href="#/p5/text">text()</a> is called.

@method textSize
@param {Number} size size of the letters in units of pixels.
@chainable

## Fonction : textSize()
@method textSize
@return {Number}

---

## Fonction : textStyle(style)
Sets the style for system fonts when
<a href="#/p5/text">text()</a> is called.

@method textStyle
@param {Constant} style styling for text, either NORMAL,
                            ITALIC, BOLD or BOLDITALIC.
@chainable

## Fonction : textStyle()
@method textStyle
@return {String}

---

## Fonction : textWidth(str)
Calculates the maximum width of a string of text drawn when
<a href="#/p5/text">text()</a> is called.

@method textWidth
@param {String} str string of text to measure.
@return {Number} width measured in units of pixels.

---

## Fonction : textAscent()
Calculates the ascent of the current font at its current size.

@method textAscent
@return {Number} ascent measured in units of pixels.

---

## Fonction : textDescent()
Calculates the descent of the current font at its current size.

@method textDescent
@return {Number} descent measured in units of pixels.

---

## Fonction : textWrap(wrapStyle)
Sets the style for wrapping text when
<a href="#/p5/text">text()</a> is called.

@method textWrap
@param {Constant} style text wrapping style, either WORD or CHAR.
@return {String} style

---

## Fonction : loadFont(path, [successCallback], [failureCallback])
Loads a font and creates a <a href="#/p5.Font">p5.Font</a> object.

@method loadFont
@param  {String}        path              path of the font to be loaded.
@param  {Function}      [successCallback] function called with the
                                           <a href="#/p5.Font">p5.Font</a> object after it
                                           loads.
@param  {Function}      [failureCallback] function called with the error
                                           <a href="https://developer.mozilla.org/en-US/docs/Web/API/Event" target="_blank">Event</a>
                                           object if the font fails to load.
@return {p5.Font}                         <a href="#/p5.Font">p5.Font</a> object.

---

## Fonction : text(str, x, y, [maxWidth], [maxHeight])
Draws text to the canvas.

@method text
@param {String|Object|Array|Number|Boolean} str text to be displayed.
@param {Number} x          x-coordinate of the text box.
@param {Number} y          y-coordinate of the text box.
@param {Number} [maxWidth] maximum width of the text box. See
                            <a href="#/p5/rectMode">rectMode()</a> for
                            other options.
@param {Number} [maxHeight] maximum height of the text box. See
                            <a href="#/p5/rectMode">rectMode()</a> for
                            other options.
@chainable

---

## Fonction : textFont(font, [size])
Sets the font used by the <a href="#/p5/text">text()</a> function.

@method textFont
@return {Object} current font or p5 Object.

## Fonction : textFont(font, [size])
@method textFont
@param {Object|String} font font as a <a href="#/p5.Font">p5.Font</a> object or a string.
@param {Number} [size] font size in pixels.
@chainable

---

## Classe : p5.Font
A class to describe fonts.

@class p5.Font
@constructor
@param {p5} [pInst] pointer to p5 instance.

### Propriétés
- font: Object (The font's underlying opentype.js font object.)

## Méthode : p5.Font.textBounds(str, x, y, [fontSize], [opts])
Returns the bounding box for a string of text written using the font.

@method textBounds
@param  {String} str        string of text.
@param  {Number} x          x-coordinate of the text.
@param  {Number} y          y-coordinate of the text.
@param  {Number} [fontSize] font size. Defaults to the current
                             <a href="#/p5/textSize">textSize()</a>.
@return {Object}            object describing the bounding box with
                             properties x, y, w, and h.

---

## Méthode : p5.Font.textToPoints(str, x, y, [fontSize], [options])
Returns an array of points outlining a string of text written using the
font.

@method textToPoints
@param  {String} str        string of text.
@param  {Number} x          x-coordinate of the text.
@param  {Number} y          y-coordinate of the text.
@param  {Number} [fontSize] font size. Defaults to the current
                             <a href="#/p5/textSize">textSize()</a>.
@param  {Object} [options]  object with sampleFactor and simplifyThreshold
                             properties.
@return {Array} array of point objects, each with x, y, and alpha (path angle) properties.