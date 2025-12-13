# Référence API : Vecteurs (p5.Vector)

## Fonction : createVector([x], [y])
Crée un nouvel objet <a href="#/p5.Vector">p5.Vector</a>.

@param {Number} [x] x component of the vector.
@param {Number} [y] y component of the vector.
@return {p5.Vector} new <a href="#/p5.Vector">p5.Vector</a> object.

---

## Classe : p5.Vector
Une classe pour décrire un vecteur bidimensionnel.

@class p5.Vector
@constructor
@param {Number} [x] x component of the vector.
@param {Number} [y] y component of the vector.

### Propriétés
- x: Number (Composante X)
- y: Number (Composante Y)

### Méthodes d'Instance

## Méthode : p5.Vector.toString()
Retourne une représentation textuelle d'un vecteur.

@method  toString
@for p5.Vector
@return {String} string representation of the vector.

---

## Méthode : p5.Vector.set([x], [y])
Définit les composantes `x` et `y` du vecteur.

@method set
@for p5.Vector
@param {Number} [x] x component of the vector.
@param {Number} [y] y component of the vector.
@chainable

## Méthode : p5.Vector.set(value)
Définit les composantes du vecteur à partir d'un autre vecteur ou d'un tableau.

@method set
@for p5.Vector
@param {p5.Vector|Number[]} value vector to set.
@chainable

---

## Méthode : p5.Vector.copy()
Retourne une copie de l'objet <a href="#/p5.Vector">p5.Vector</a>.

@method copy
@for p5.Vector
@return {p5.Vector} copy of the <a href="#/p5.Vector">p5.Vector</a> object.

---

## Méthode : p5.Vector.add(x, [y])
Ajoute aux composantes `x` et `y` d'un vecteur.

@method add
@for p5.Vector
@param  {Number} x   x component of the vector to be added.
@param  {Number} [y] y component of the vector to be added.
@chainable

## Méthode : p5.Vector.add(value)
Ajoute un autre vecteur ou un tableau de nombres.

@method add
@for p5.Vector
@param  {p5.Vector|Number[]} value The vector to add
@chainable

---

## Méthode : p5.Vector.sub(x, [y])
Soustrait des composantes `x` et `y` d'un vecteur.

@method sub
@for p5.Vector
@param  {Number} x   x component of the vector to subtract.
@param  {Number} [y] y component of the vector to subtract.
@chainable

## Méthode : p5.Vector.sub(value)
Soustrait un autre vecteur ou un tableau de nombres.

@method sub
@for p5.Vector
@param  {p5.Vector|Number[]} value the vector to subtract
@chainable

---

## Méthode : p5.Vector.mult(n)
Multiplie les composantes `x` et `y` d'un vecteur par un scalaire.

@method mult
@for p5.Vector
@param  {Number} n The number to multiply with the vector
@chainable

---

## Méthode : p5.Vector.div(n)
Divise les composantes `x` et `y` d'un vecteur par un scalaire.

@method div
@for p5.Vector
@param  {number}    n The number to divide the vector by
@chainable

---

## Méthode : p5.Vector.mag()
Calcule la magnitude (longueur) du vecteur.

@method mag
@for p5.Vector
@return {Number} magnitude of the vector.

---

## Méthode : p5.Vector.dot(v)
Calcule le produit scalaire avec un autre vecteur.

@method dot
@for p5.Vector
@param  {p5.Vector} v <a href="#/p5.Vector">p5.Vector</a> to be dotted.
@return {Number}     dot product.

---

## Méthode : p5.Vector.dist(v)
Calcule la distance entre deux points représentés par des vecteurs.

@method dist
@for p5.Vector
@param  {p5.Vector} v x and y coordinates of a <a href="#/p5.Vector">p5.Vector</a>.
@return {Number}      distance.

---

## Méthode : p5.Vector.normalize()
Met à l'échelle les composantes d'un vecteur pour que sa magnitude soit 1.

@method normalize
@for p5.Vector
@return {p5.Vector} normalized <a href="#/p5.Vector">p5.Vector</a>.

---

## Méthode : p5.Vector.limit(max)
Limite la magnitude d'un vecteur à une valeur maximale.

@method limit
@for p5.Vector
@param  {Number}    max maximum magnitude for the vector.
@chainable

---

## Méthode : p5.Vector.setMag(len)
Définit la magnitude d'un vecteur à une valeur donnée.

@method setMag
@for p5.Vector
@param  {number}    len new length for this vector.
@chainable

---

## Méthode : p5.Vector.heading()
Calcule l'angle que forme un vecteur 2D avec l'axe des x positif.

@method heading
@for p5.Vector
@return {Number} angle of rotation.

---

## Méthode : p5.Vector.setHeading(angle)
Fait pivoter un vecteur 2D à un angle spécifique sans changer sa magnitude.

@method setHeading
@for p5.Vector
@param  {number}    angle angle of rotation.
@chainable

---

## Méthode : p5.Vector.rotate(angle)
Fait pivoter un vecteur 2D d'un angle sans changer sa magnitude.

@method rotate
@for p5.Vector
@param  {number}    angle angle of rotation.
@chainable

---

## Méthode : p5.Vector.angleBetween(v)
Calcule l'angle entre deux vecteurs.

@method angleBetween
@for p5.Vector
@param  {p5.Vector}    value x and y components of a <a href="#/p5.Vector">p5.Vector</a>.
@return {Number}       angle between the vectors.

---

## Méthode : p5.Vector.lerp(v, amt)
Calcule de nouvelles composantes en interpolant vers un autre vecteur.

@method lerp
@for p5.Vector
@param  {p5.Vector} v  <a href="#/p5.Vector">p5.Vector</a> to lerp toward.
@param  {Number}    amt amount of interpolation between 0.0 (old vector)
                         and 1.0 (new vector). 0.5 is halfway between.
@chainable

---

## Méthode : p5.Vector.reflect(surfaceNormal)
Réfléchit un vecteur par rapport à une ligne (2D).

@method reflect
@for p5.Vector
@param  {p5.Vector} surfaceNormal  <a href="#/p5.Vector">p5.Vector</a>
                                    to reflect about.
@chainable

---

## Méthode : p5.Vector.array()
Retourne les composantes du vecteur sous forme de tableau de nombres.

@method array
@for p5.Vector
@return {Number[]} array with the vector's components.

---

## Méthode : p5.Vector.equals(x, [y])
Vérifie si toutes les composantes du vecteur sont égales à celles d'un autre vecteur ou de nombres.

@method equals
@for p5.Vector
@param {Number} [x] x component of the vector.
@param {Number} [y] y component of the vector.
@return {Boolean} whether the vectors are equal.

## Méthode : p5.Vector.equals(value)
Vérifie si le vecteur est égal à un autre vecteur ou un tableau.

@method equals
@for p5.Vector
@param {p5.Vector|Array} value vector to compare.
@return {Boolean}

---

## Méthode Statique : p5.Vector.fromAngle(angle, [length])
Crée un nouveau vecteur 2D à partir d'un angle.

@method fromAngle
@static
@for p5.Vector
@param {Number}     angle desired angle, in radians. Unaffected by <a href="#/p5/angleMode">angleMode()</a>.
@param {Number}     [length] length of the new vector (defaults to 1).
@return {p5.Vector}       new <a href="#/p5.Vector">p5.Vector</a> object.

---

## Méthode Statique : p5.Vector.random2D()
Crée un nouveau vecteur unitaire 2D avec une direction aléatoire.

@method random2D
@static
@for p5.Vector
@return {p5.Vector} new <a href="#/p5.Vector">p5.Vector</a> object.