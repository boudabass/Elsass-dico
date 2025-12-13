# Référence API : Environnement

## Variable : frameCount
A `Number` system variable that tracks the number of frames displayed since the sketch started.

@property {Integer} frameCount
@readOnly

---

## Variable : deltaTime
A `Number` system variable that tracks the time elapsed since the last frame was drawn.

@property {Number} deltaTime
@readOnly

---

## Variable : focused
A `Boolean` system variable that's `true` if the sketch is focused and `false` if not.

@property {Boolean} focused
@readOnly

---

## Fonction : cursor([type], [x], [y])
Sets the cursor's appearance.

@method cursor
@param {Constant|String} [type] either ARROW, CROSS, HAND, MOVE, TEXT, WAIT,
                                 or a URL string for a custom cursor.
@param {Number} [x] x-coordinate of the cursor's hotspot.
@param {Number} [y] y-coordinate of the cursor's hotspot.

---

## Fonction : frameRate([fps])
Sets the number of frames to display per second.

@method frameRate
@param {Number} [fps] frames per second.
@return {p5}

---

## Fonction : getFrameRate()
Returns the current frame rate.

@method getFrameRate
@return {Number} current frame rate.

---

## Fonction : setFrameRate(fps)
Sets the number of frames to display per second.

@method setFrameRate
@param {Number} fps frames per second.
@return {p5}

---

## Fonction : getTargetFrameRate()
Returns the target frame rate.

@method getTargetFrameRate
@return {Number} target frame rate.

---

## Fonction : noCursor()
Hides the cursor.

@method noCursor

---

## Variable : displayWidth
The width of the entire screen in pixels.

@property {Number} displayWidth
@readOnly

---

## Variable : displayHeight
The height of the entire screen in pixels.

@property {Number} displayHeight
@readOnly

---

## Variable : windowWidth
The width of the browser window in pixels.

@property {Number} windowWidth
@readOnly

---

## Variable : windowHeight
The height of the browser window in pixels.

@property {Number} windowHeight
@readOnly

---

## Variable : width
The width of the drawing canvas in pixels.

@property {Number} width
@readOnly

---

## Variable : height
The height of the drawing canvas in pixels.

@property {Number} height
@readOnly

---

## Fonction : fullscreen([val])
Sets or returns the fullscreen status of the sketch.

@method fullscreen
@param {Boolean} [val] whether to enter or exit fullscreen mode.
@return {Boolean} whether the sketch is in fullscreen mode.

---

## Fonction : pixelDensity([val])
Gets or sets the pixel density for high pixel density displays.

@method pixelDensity
@param {Number} [val] A scaling factor for the number of pixels per side.
@return {Number} The current density if called without arguments, or the instance for chaining if setting density.

---

## Fonction : displayDensity()
Returns the pixel density of the display.

@method displayDensity
@return {Number} pixel density of the display.

---

## Fonction : getURL()
Returns the current URL as a string.

@method getURL
@return {String} current URL.

---

## Fonction : getURLPath()
Returns the current URL path as an array of strings.

@method getURLPath
@return {String[]} current URL path.

---

## Fonction : getURLParams()
Returns the current URL parameters as an object.

@method getURLParams
@return {Object} current URL parameters.

---

## Fonction : print(...args)
Writes to the console.

@method print
@param {...any} args values to print.