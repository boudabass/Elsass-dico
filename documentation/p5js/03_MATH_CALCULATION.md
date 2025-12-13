# Référence API : Mathématiques de Base

## Fonction : abs(n)
Calcule la valeur absolue d'un nombre.

@param {Number} n number to compute.
@return {Number} absolute value of given number.

---

## Fonction : ceil(n)
Calcule l'entier le plus proche supérieur ou égal à un nombre.

@param {Number} n number to round up.
@return {Integer} rounded up number.

---

## Fonction : constrain(n, low, high)
Contraint un nombre entre une valeur minimale et maximale.

@param {Number} n number to constrain.
@param {Number} low minimum limit.
@param {Number} high maximum limit.
@return {Number} constrained number.

---

## Fonction : dist(x1, y1, x2, y2)
Calcule la distance entre deux points (2D).

@param {Number} x1 x-coordinate of the first point.
@param {Number} y1 y-coordinate of the first point.
@param {Number} x2 x-coordinate of the second point.
@param {Number} y2 y-coordinate of the second point.
@return {Number} distance between the two points.

---

## Fonction : exp(n)
Calcule la valeur de e (2.71828...) élevée à la puissance de n.

@param {Number} n exponent to raise.
@return {Number} e^n

---

## Fonction : floor(n)
Calcule l'entier le plus proche inférieur ou égal à un nombre.

@param {Number} n number to round down.
@return {Integer} rounded down number.

---

## Fonction : lerp(start, stop, amt)
Calcule un nombre entre deux nombres à un incrément spécifique.

@param {Number} start first value.
@param {Number} stop second value.
@param {Number} amt number.
@return {Number} lerped value.

---

## Fonction : log(n)
Calcule le logarithme naturel (base-e) d'un nombre.

@param {Number} n number greater than 0.
@return {Number} natural logarithm of n.

---

## Fonction : mag(x, y)
Calcule la magnitude (longueur) d'un vecteur 2D.

@param {Number} x first component.
@param {Number} y second component.
@return {Number} magnitude of vector.

---

## Fonction : map(value, start1, stop1, start2, stop2, [withinBounds])
Re-map un nombre d'une plage à une autre.

@param {Number} value the value to be remapped.
@param {Number} start1 lower bound of the value's current range.
@param {Number} stop1 upper bound of the value's current range.
@param {Number} start2 lower bound of the value's target range.
@param {Number} stop2 upper bound of the value's target range.
@param {Boolean} [withinBounds] constrain the value to the newly mapped range.
@return {Number} remapped number.

---

## Fonction : max(n0, n1, ...)
Retourne la plus grande valeur dans une séquence de nombres.

@param {Number} n0 first number to compare.
@param {Number} n1 second number to compare.
@return {Number} maximum number.

## Fonction : max(nums)
Retourne la plus grande valeur dans un tableau de nombres.

@param {Number[]} nums numbers to compare.
@return {Number} maximum number.

---

## Fonction : min(n0, n1, ...)
Retourne la plus petite valeur dans une séquence de nombres.

@param {Number} n0 first number to compare.
@param {Number} n1 second number to compare.
@return {Number} minimum number.

## Fonction : min(nums)
Retourne la plus petite valeur dans un tableau de nombres.

@param {Number[]} nums numbers to compare.
@return {Number} minimum number.

---

## Fonction : norm(value, start, stop)
Mappe un nombre d'une plage à une valeur entre 0 et 1.

@param {Number} value incoming value to be normalized.
@param {Number} start lower bound of the value's current range.
@param {Number} stop upper bound of the value's current range.
@return {Number} normalized number.

---

## Fonction : pow(n, e)
Calcule les expressions exponentielles.

@param {Number} n base of the exponential expression.
@param {Number} e power by which to raise the base.
@return {Number} n^e.

---

## Fonction : round(n, [decimals])
Calcule l'entier le plus proche d'un nombre.

@param {Number} n number to round.
@param {Number} [decimals] number of decimal places to round to, default is 0.
@return {Integer} rounded number.

---

## Fonction : sq(n)
Calcule le carré d'un nombre.

@param {Number} n number to square.
@return {Number} squared number.

---

## Fonction : sqrt(n)
Calcule la racine carrée d'un nombre.

@param {Number} n non-negative number to square root.
@return {Number} square root of number.

---

## Fonction : fract(n)
Calcule la partie fractionnaire d'un nombre.

@param {Number} n number whose fractional part will be found.
@return {Number} fractional part of n.