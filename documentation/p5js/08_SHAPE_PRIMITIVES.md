# Référence API : Primitives 2D

## Fonction : arc(x, y, w, h, start, stop, [mode])
Draws an arc.

@method arc
@param {Number} x x-coordinate of the arc's center.
@param {Number} y y-coordinate of the arc's center.
@param {Number} w width of the arc's bounding box.
@param {Number} h height of the arc's bounding box.
@param {Number} start angle to start the arc, in radians by default.
@param {Number} stop angle to stop the arc, in radians by default.
@param {Constant} [mode] either CHORD, PIE, or OPEN.
@chainable

---

## Fonction : ellipse(x, y, w, h)
Draws an ellipse.

@method ellipse
@param {Number} x x-coordinate of the ellipse.
@param {Number} y y-coordinate of the ellipse.
@param {Number} w width of the ellipse.
@param {Number} h height of the ellipse.
@chainable

---

## Fonction : circle(x, y, d)
Draws a circle.

@method circle
@param {Number} x x-coordinate of the circle.
@param {Number} y y-coordinate of the circle.
@param {Number} d diameter of the circle.
@chainable

---

## Fonction : line(x1, y1, x2, y2)
Draws a line.

@method line
@param {Number} x1 x-coordinate of the first point.
@param {Number} y1 y-coordinate of the first point.
@param {Number} x2 x-coordinate of the second point.
@param {Number} y2 y-coordinate of the second point.
@chainable

---

## Fonction : point(x, y)
Draws a point.

@method point
@param {Number} x x-coordinate of the point.
@param {Number} y y-coordinate of the point.
@chainable

---

## Fonction : quad(x1, y1, x2, y2, x3, y3, x4, y4)
Draws a quadrilateral.

@method quad
@param {Number} x1 x-coordinate of the first point.
@param {Number} y1 y-coordinate of the first point.
@param {Number} x2 x-coordinate of the second point.
@param {Number} y2 y-coordinate of the second point.
@param {Number} x3 x-coordinate of the third point.
@param {Number} y3 y-coordinate of the third point.
@param {Number} x4 x-coordinate of the fourth point.
@param {Number} y4 y-coordinate of the fourth point.
@chainable

---

## Fonction : rect(x, y, w, h, [tl], [tr], [br], [bl])
Draws a rectangle.

@method rect
@param {Number} x x-coordinate of the rectangle.
@param {Number} y y-coordinate of the rectangle.
@param {Number} w width of the rectangle.
@param {Number} h height of the rectangle.
@param {Number} [tl] optional radius for top-left corner.
@param {Number} [tr] optional radius for top-right corner.
@param {Number} [br] optional radius for bottom-right corner.
@param {Number} [bl] optional radius for bottom-left corner.
@chainable

---

## Fonction : square(x, y, s, [tl], [tr], [br], [bl])
Draws a square.

@method square
@param {Number} x x-coordinate of the square.
@param {Number} y y-coordinate of the square.
@param {Number} s side length of the square.
@param {Number} [tl] optional radius for top-left corner.
@param {Number} [tr] optional radius for top-right corner.
@param {Number} [br] optional radius for bottom-right corner.
@param {Number} [bl] optional radius for bottom-left corner.
@chainable

---

## Fonction : triangle(x1, y1, x2, y2, x3, y3)
Draws a triangle.

@method triangle
@param {Number} x1 x-coordinate of the first point.
@param {Number} y1 y-coordinate of the first point.
@param {Number} x2 x-coordinate of the second point.
@param {Number} y2 y-coordinate of the second point.
@param {Number} x3 x-coordinate of the third point.
@param {Number} y3 y-coordinate of the third point.
@chainable