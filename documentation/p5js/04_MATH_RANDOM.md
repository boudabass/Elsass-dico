# Référence API : Aléatoire et Bruit (Random & Noise)

## Fonction : randomSeed(seed)
Définit la valeur de graine pour les fonctions <a href="#/p5/random">random()</a> et <a href="#/p5/randomGaussian">randomGaussian()</a>.

@param {Number} seed seed value.

---

## Fonction : random([min], [max])
Retourne un nombre aléatoire ou un élément aléatoire d'un tableau.

@param {Number} [min] lower bound (inclusive).
@param {Number} [max] upper bound (exclusive).
@return {Number} random number.

## Fonction : random(choices)
Retourne un élément aléatoire d'un tableau.

@param {Array} choices array to choose from.
@return {*} random element from the array.

---

## Fonction : randomGaussian([mean], [sd])
Retourne un nombre aléatoire suivant une distribution Gaussienne (normale).

@param {Number} [mean] mean.
@param {Number} [sd] standard deviation.
@return {Number} random number.

---

## Fonction : noise(x, [y])
Retourne des nombres aléatoires qui peuvent être ajustés pour paraître organiques (Perlin Noise).

@param {Number} x x-coordinate in noise space.
@param {Number} [y] y-coordinate in noise space.
@return {Number} Perlin noise value at specified coordinates.

---

## Fonction : noiseDetail(lod, falloff)
Ajuste le caractère du bruit produit par la fonction <a href="#/p5/noise">noise()</a>.

@param {Number} lod number of octaves to be used by the noise.
@param {Number} falloff falloff factor for each octave.

---

## Fonction : noiseSeed(seed)
Définit la valeur de graine pour la fonction <a href="#/p5/noise">noise()</a>.

@param {Number} seed seed value.