# Référence API : Attributs de Forme

## Fonction : ellipseMode(mode)
Modifies the location from which ellipses are drawn.

@method ellipseMode
@param {Constant} mode either CENTER, RADIUS, CORNER, or CORNERS.
@chainable

---

## Fonction : noSmooth()
Disables smoothing of geometry and images.

@method noSmooth
@chainable

---

## Fonction : rectMode(mode)
Modifies the location from which rectangles are drawn.

@method rectMode
@param {Constant} mode either CORNER, CORNERS, CENTER, or RADIUS.
@chainable

---

## Fonction : smooth()
Enables smoothing of geometry and images.

@method smooth
@chainable

---

## Fonction : strokeCap(cap)
Sets the style for the ends of lines.

@method strokeCap
@param {Constant} cap either ROUND, SQUARE, or PROJECT.
@chainable

---

## Fonction : strokeJoin(join)
Sets the style for the joints between connected line segments.

@method strokeJoin
@param {Constant} join either MITER, BEVEL, or ROUND.
@chainable

---

## Fonction : strokeWeight(w)
Sets the width of the stroke (outline) for shapes.

@method strokeWeight
@param {Number} w width of the stroke in pixels.
@chainable