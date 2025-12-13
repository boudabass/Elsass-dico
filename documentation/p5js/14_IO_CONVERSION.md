# Référence API : Conversion de Types

## Fonction : float(str)
Convertit une `String` en un `Number` à virgule flottante (décimal).

@method float
@param {String}  str string to convert.
@return {Number} converted number.

## Fonction : float(ns)
Convertit un tableau de chaînes en un tableau de nombres à virgule flottante.

@method float
@param {String[]} ns array of strings to convert.
@return {Number[]} converted numbers.

---

## Fonction : int(n, [radix])
Convertit un `Boolean`, `String`, ou `Number` décimal en un entier.

@method int
@param {String|Boolean|Number} n value to convert.
@param {Number} [radix] base to use for parsing strings (default is 10).
@return {Number} converted number.

## Fonction : int(ns, [radix])
Convertit un tableau de valeurs en un tableau d'entiers.

@method int
@param {Array} ns values to convert.
@param {Number} [radix] base to use for parsing strings (default is 10).
@return {Number[]} converted numbers.

---

## Fonction : str(n)
Convertit un `Boolean` ou `Number` en `String`.

@method str
@param {String|Boolean|Number} n value to convert.
@return {String} converted string.

## Fonction : str(ns)
Convertit un tableau de valeurs en un tableau de chaînes.

@method str
@param {Array} ns values to convert.
@return {String[]} converted strings.

---

## Fonction : boolean(n)
Convertit une `String` ou `Number` en `Boolean`.

@method boolean
@param {String|Boolean|Number} n value to convert.
@return {Boolean} converted Boolean value.

## Fonction : boolean(ns)
Convertit un tableau de valeurs en un tableau de booléens.

@method boolean
@param {Array} ns values to convert.
@return {Boolean[]} converted Boolean values.

---

## Fonction : byte(n)
Convertit une valeur en sa valeur d'octet (entier entre -128 et 127).

@method byte
@param {String|Boolean|Number} n value to convert.
@return {Number} converted byte value.

## Fonction : byte(ns)
Convertit un tableau de valeurs en un tableau d'octets.

@method byte
@param {Array} ns values to convert.
@return {Number[]} converted byte values.

---

## Fonction : char(n)
Convertit un `Number` ou `String` en une `String` à caractère unique.

@method char
@param {String|Number} n value to convert.
@return {String} converted single-character string.

## Fonction : char(ns)
Convertit un tableau de valeurs en un tableau de chaînes à caractère unique.

@method char
@param {Array} ns values to convert.
@return {String[]} converted single-character strings.

---

## Fonction : unchar(n)
Convertit une `String` à caractère unique en un `Number` (code ASCII/Unicode).

@method unchar
@param {String} n value to convert.
@return {Number} converted number.

## Fonction : unchar(ns)
Convertit un tableau de chaînes à caractère unique en un tableau de nombres.

@method unchar
@param {String[]} ns values to convert.
@return {Number[]} converted numbers.

---

## Fonction : hex(n, [digits])
Convertit un `Number` en une `String` avec sa valeur hexadécimale.

@method hex
@param {Number} n value to convert.
@param {Number} [digits] number of digits to include.
@return {String} converted hexadecimal value.

## Fonction : hex(ns, [digits])
Convertit un tableau de nombres en un tableau de chaînes hexadécimales.

@method hex
@param {Number[]} ns values to convert.
@param {Number} [digits]
@return {String[]} converted hexadecimal values.

---

## Fonction : unhex(n)
Convertit une `String` avec une valeur hexadécimale en un `Number`.

@method unhex
@param {String} n value to convert.
@return {Number} converted number.

## Fonction : unhex(ns)
Convertit un tableau de chaînes hexadécimales en un tableau de nombres.

@method unhex
@param {String[]} ns values to convert.
@return {Number[]} converted numbers.