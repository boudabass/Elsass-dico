# Référence API : Formes Complexes (Vertices et Courbes)

## Fonction : beginContour()
Starts a new contour within a shape.

@method beginContour
@chainable

---

## Fonction : beginShape([kind])
Starts recording vertices for a shape.

@method beginShape
@param {Constant} [kind] either POINTS, LINES, TRIANGLES, TRIANGLE_FAN, TRIANGLE_STRIP, QUADS, or QUAD_STRIP.
@chainable

---

## Fonction : bezierVertex(x2, y2, x3, y3, x4, y4)
Specifies a cubic Bezier curve vertex.

@method bezierVertex
@param {Number} x2 x-coordinate of the first control point.
@param {Number} y2 y-coordinate of the first control point.
@param {Number} x3 x-coordinate of the second control point.
@param {Number} y3 y-coordinate of the second control point.
@param {Number} x4 x-coordinate of the anchor point.
@param {Number} y4 y-coordinate of the anchor point.
@chainable

---

## Fonction : curveVertex(x, y)
Specifies a Catmull-Rom curve vertex.

@method curveVertex
@param {Number} x x-coordinate of the vertex.
@param {Number} y y-coordinate of the vertex.
@chainable

---

## Fonction : endContour()
Ends the current contour started with <a href="#/p5/beginContour">beginContour()</a>.

@method endContour
@chainable

---

## Fonction : endShape([mode])
Stops recording vertices and draws the shape.

@method endShape
@param {Constant} [mode] either CLOSE or OPEN.
@chainable

---

## Fonction : quadraticVertex(cx, cy, x3, y3)
Specifies a quadratic Bezier curve vertex.

@method quadraticVertex
@param {Number} cx x-coordinate of the control point.
@param {Number} cy y-coordinate of the control point.
@param {Number} x3 x-coordinate of the anchor point.
@param {Number} y3 y-coordinate of the anchor point.
@chainable

---

## Fonction : vertex(x, y)
Specifies a vertex coordinate.

@method vertex
@param {Number} x x-coordinate of the vertex.
@param {Number} y y-coordinate of the vertex.
@chainable

---

## Fonction : bezier(x1, y1, x2, y2, x3, y3, x4, y4)
Draws a cubic Bezier curve.

@method bezier
@param {Number} x1 x-coordinate of the first anchor point.
@param {Number} y1 y-coordinate of the first anchor point.
@param {Number} x2 x-coordinate of the first control point.
@param {Number} y2 y-coordinate of the first control point.
@param {Number} x3 x-coordinate of the second control point.
@param {Number} y3 y-coordinate of the second control point.
@param {Number} x4 x-coordinate of the second anchor point.
@param {Number} y4 y-coordinate of the second anchor point.
@chainable

---

## Fonction : bezierDetail(d)
Sets the resolution of the Bezier curve.

@method bezierDetail
@param {Number} d resolution of the curve.
@chainable

---

## Fonction : bezierPoint(a, b, c, d, t)
Calculates the coordinate of a point on a cubic Bezier curve.

@method bezierPoint
@param {Number} a coordinate of the first anchor point.
@param {Number} b coordinate of the first control point.
@param {Number} c coordinate of the second control point.
@param {Number} d coordinate of the second anchor point.
@param {Number} t value between 0 and 1.
@return {Number} coordinate of the point.

---

## Fonction : bezierTangent(a, b, c, d, t)
Calculates the tangent of a point on a cubic Bezier curve.

@method bezierTangent
@param {Number} a coordinate of the first anchor point.
@param {Number} b coordinate of the first control point.
@param {Number} c coordinate of the second control point.
@param {Number} d coordinate of the second anchor point.
@param {Number} t value between 0 and 1.
@return {Number} tangent of the point.

---

## Fonction : curve(x1, y1, x2, y2, x3, y3, x4, y4)
Draws a Catmull-Rom curve.

@method curve
@param {Number} x1 x-coordinate of the first control point.
@param {Number} y1 y-coordinate of the first control point.
@param {Number} x2 x-coordinate of the first anchor point.
@param {Number} y2 y-coordinate of the first anchor point.
@param {Number} x3 x-coordinate of the second anchor point.
@param {Number} y3 y-coordinate of the second anchor point.
@param {Number} x4 x-coordinate of the second control point.
@param {Number} y4 y-coordinate of the second control point.
@chainable

---

## Fonction : curveDetail(d)
Sets the resolution of the Catmull-Rom curve.

@method curveDetail
@param {Number} d resolution of the curve.
@chainable

---

## Fonction : curveTightness(t)
Sets the tightness of the Catmull-Rom curve.

@method curveTightness
@param {Number} t tightness value (0 is normal, 1 is tight, -1 is loose).
@chainable

---

## Fonction : curvePoint(a, b, c, d, t)
Calculates the coordinate of a point on a Catmull-Rom curve.

@method curvePoint
@param {Number} a coordinate of the first control point.
@param {Number} b coordinate of the first anchor point.
@param {Number} c coordinate of the second anchor point.
@param {Number} d coordinate of the second control point.
@param {Number} t value between 0 and 1.
@return {Number} coordinate of the point.

---

## Fonction : curveTangent(a, b, c, d, t)
Calculates the tangent of a point on a Catmull-Rom curve.

@method curveTangent
@param {Number} a coordinate of the first control point.
@param {Number} b coordinate of the first anchor point.
@param {Number} c coordinate of the second anchor point.
@param {Number} d coordinate of the second control point.
@param {Number} t value between 0 and 1.
@return {Number} tangent of the point.