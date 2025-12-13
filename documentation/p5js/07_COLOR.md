# Référence API : Couleur

## Classe : p5.Color
A class to describe an image.

@class p5.Color
@constructor
@param {p5} pInst pointer to p5 instance.
@param {Array} vals color values.

### Propriétés
- levels: Number[] (Array containing the color components [R, G, B, A] or equivalent based on colorMode.)

### Méthodes d'Instance (Internes/Avancées)
- toString(format: String): String
- setRed(new_red: Number): void
- setGreen(new_green: Number): void
- setBlue(new_blue: Number): void
- setAlpha(new_alpha: Number): void
- _getRed(): Number
- _getGreen(): Number
- _getBlue(): Number
- _getAlpha(): Number
- _getHue(): Number
- _getSaturation(): Number
- _getBrightness(): Number
- _getLightness(): Number

---

## Fonction : alpha(c)
Extracts the alpha value from a color.

@method alpha
@param {p5.Color|Number[]|String} c <a href="#/p5.Color">p5.Color</a> object, array of color components, or CSS color string.
@return {Number} alpha value.

---

## Fonction : blue(c)
Extracts the blue value from a color.

@method blue
@param {p5.Color|Number[]|String} c <a href="#/p5.Color">p5.Color</a> object, array of color components, or CSS color string.
@return {Number} blue value.

---

## Fonction : brightness(c)
Extracts the brightness value from a color.

@method brightness
@param {p5.Color|Number[]|String} c <a href="#/p5.Color">p5.Color</a> object, array of color components, or CSS color string.
@return {Number} brightness value.

---

## Fonction : color(...args)
Creates a <a href="#/p5.Color">p5.Color</a> object.

@method color
@param {Number} v1 red or hue value.
@param {Number} v2 green or saturation value.
@param {Number} v3 blue or brightness value.
@param {Number} [alpha] alpha value.
@return {p5.Color} <a href="#/p5.Color">p5.Color</a> object.

### Exemple
<div>
<code>
function setup() {
  createCanvas(100, 100);

  background(200);

  // Create a p5.Color object.
  let c = color(255, 0, 0);

  // Style the circle.
  fill(c);

  // Draw the circle.
  circle(50, 50, 50);

  describe('A red circle drawn in the middle of a gray square.');
}
</code>
</div>

---

## Fonction : green(c)
Extracts the green value from a color.

@method green
@param {p5.Color|Number[]|String} c <a href="#/p5.Color">p5.Color</a> object, array of color components, or CSS color string.
@return {Number} green value.

---

## Fonction : hue(c)
Extracts the hue value from a color.

@method hue
@param {p5.Color|Number[]|String} c <a href="#/p5.Color">p5.Color</a> object, array of color components, or CSS color string.
@return {Number} hue value.

---

## Fonction : lerpColor(c1, c2, amt)
Calculates a color between two colors at a specific increment.

@method lerpColor
@param {p5.Color|Number[]|String} c1 first color.
@param {p5.Color|Number[]|String} c2 second color.
@param {Number} amt amount of interpolation between 0.0 (first color) and 1.0 (second color).
@return {p5.Color} interpolated color.

### Exemple
<div>
<code>
function setup() {
  createCanvas(100, 100);

  background(200);

  // Define two colors.
  let c1 = color(255, 0, 0);
  let c2 = color(0, 0, 255);

  // Interpolate between them.
  let c = lerpColor(c1, c2, 0.5);

  // Style the circle.
  fill(c);

  // Draw the circle.
  circle(50, 50, 50);

  describe('A purple circle drawn in the middle of a gray square.');
}
</code>
</div>

---

## Fonction : paletteLerp(color_stops, amt)
Calculates a color based on a palette of color stops and an interpolation amount.

@method paletteLerp
@param {Array} color_stops array of [color, position] pairs.
@param {Number} amt amount of interpolation between 0.0 and 1.0.
@return {p5.Color} interpolated color.

---

## Fonction : lightness(c)
Extracts the lightness value from a color.

@method lightness
@param {p5.Color|Number[]|String} c <a href="#/p5.Color">p5.Color</a> object, array of color components, or CSS color string.
@return {Number} lightness value.

---

## Fonction : red(c)
Extracts the red value from a color.

@method red
@param {p5.Color|Number[]|String} c <a href="#/p5.Color">p5.Color</a> object, array of color components, or CSS color string.
@return {Number} red value.

---

## Fonction : saturation(c)
Extracts the saturation value from a color.

@method saturation
@param {p5.Color|Number[]|String} c <a href="#/p5.Color">p5.Color</a> object, array of color components, or CSS color string.
@return {Number} saturation value.

---

## Fonction : background(...args)
Sets the background color of the canvas.

@method background
@param {Number} v1 red or hue value.
@param {Number} v2 green or saturation value.
@param {Number} v3 blue or brightness value.
@param {Number} [alpha] alpha value.
@chainable

### Exemple
<div>
<code>
function setup() {
  createCanvas(100, 100);

  // Set the background to red.
  background(255, 0, 0);

  describe('A red square.');
}
</code>
</div>

---

## Fonction : clear(...args)
Clears the canvas with a transparent color.

@method clear
@param {Number} [r] red value.
@param {Number} [g] green value.
@param {Number} [b] blue value.
@param {Number} [a] alpha value.
@chainable

---

## Fonction : colorMode(mode, max1, max2, max3, maxA)
Changes the way p5.js interprets color data.

@method colorMode
@param {Constant} mode either RGB, HSB, or HSL.
@param {Number} [max1] maximum value for the first color component.
@param {Number} [max2] maximum value for the second color component.
@param {Number} [max3] maximum value for the third color component.
@param {Number} [maxA] maximum value for the alpha component.
@chainable

### Exemple
<div>
<code>
function setup() {
  createCanvas(100, 100);

  // Use HSB mode with custom ranges.
  colorMode(HSB, 360, 100, 100, 1);

  // Set the background to a bright red hue.
  background(0, 100, 100, 1);

  describe('A bright red square.');
}
</code>
</div>

---

## Fonction : fill(...args)
Sets the color used to fill shapes.

@method fill
@param {Number} v1 red or hue value.
@param {Number} v2 green or saturation value.
@param {Number} v3 blue or brightness value.
@param {Number} [alpha] alpha value.
@chainable

### Exemple
<div>
<code>
function setup() {
  createCanvas(100, 100);

  // Set the fill color to blue.
  fill(0, 0, 255);

  // Draw the circle.
  circle(50, 50, 50);

  describe('A blue circle drawn in the middle of a white square.');
}
</code>
</div>

---

## Fonction : noFill()
Disables filling geometry.

@method noFill
@chainable

### Exemple
<div>
<code>
function setup() {
  createCanvas(100, 100);

  // Disable fill.
  noFill();

  // Draw the circle (only stroke visible).
  circle(50, 50, 50);

  describe('A black outline of a circle drawn in the middle of a white square.');
}
</code>
</div>

---

## Fonction : noStroke()
Disables drawing the stroke (outline) for shapes.

@method noStroke
@chainable

### Exemple
<div>
<code>
function setup() {
  createCanvas(100, 100);

  // Disable stroke.
  noStroke();

  // Draw the circle (only fill visible).
  fill(0);
  circle(50, 50, 50);

  describe('A black circle drawn in the middle of a white square.');
}
</code>
</div>

---

## Fonction : stroke(...args)
Sets the color used to draw the stroke (outline) for shapes.

@method stroke
@param {Number} v1 red or hue value.
@param {Number} v2 green or saturation value.
@param {Number} v3 blue or brightness value.
@param {Number} [alpha] alpha value.
@chainable

### Exemple
<div>
<code>
function setup() {
  createCanvas(100, 100);

  // Set the stroke color to red.
  stroke(255, 0, 0);
  strokeWeight(5);

  // Draw the circle.
  circle(50, 50, 50);

  describe('A white circle with a thick red outline drawn in the middle of a white square.');
}
</code>
</div>

---

## Fonction : erase(opacityFill, opacityStroke)
Erases pixels drawn after this function is called.

@method erase
@param {Number} [opacityFill] opacity of the fill erase (0-255).
@param {Number} [opacityStroke] opacity of the stroke erase (0-255).
@chainable

---

## Fonction : noErase()
Stops erasing pixels.

@method noErase
@chainable

---

## Fonction : beginClip(options)
Starts a clipping mask definition.

@method beginClip
@param {Object} [options] options object, e.g., { invert: true }.
@chainable

---

## Fonction : endClip()
Applies the defined clipping mask and ends the clipping state.

@method endClip
@chainable

---

## Fonction : clip(callback, options)
Defines and applies a clipping mask using a callback function.

@method clip
@param {Function} callback function containing drawing commands to define the clip shape.
@param {Object} [options] options object.
@chainable