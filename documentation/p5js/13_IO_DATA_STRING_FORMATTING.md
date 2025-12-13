# Référence API : Manipulation de Chaînes de Caractères

## Fonction : join(list, separator)
Combines an array of strings into one string.

The first parameter, `list`, is the array of strings to join.

The second parameter, `separator`, is the character(s) that should be used
to separate the combined strings. For example, calling
`join(myWords, ' : ')` would return a string of words each separated by a
colon and spaces.

@method join
@param  {Array}  list array of strings to combine.
@param  {String} separator character(s) to place between strings when they're combined.
@return {String} combined string.

---

## Fonction : match(str, regexp)
Applies a regular expression to a string and returns an array with the
first match.

`match()` uses regular expressions (regex) to match patterns in text. For
example, the regex `abc` can be used to search a string for the exact
sequence of characters `abc`. See
<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#tools" target="_blank">MDN</a>.
for more information about regexes.

The first parameter, `str`, is the string to search.

The second parameter, `regex`, is a string with the regular expression to
apply. For example, calling `match('Hello, p5*js!', '[a-z][0-9]')` would
return the array `['p5']`.

Note: If no matches are found, `null` is returned.

@method match
@param  {String} str string to search.
@param  {String} regexp regular expression to match.
@return {String[]} match if found.

---

## Fonction : matchAll(str, regexp)
Applies a regular expression to a string and returns an array of matches.

`match()` uses regular expressions (regex) to match patterns in text. For
example, the regex `abc` can be used to search a string for the exact
sequence of characters `abc`. See
<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#tools" target="_blank">MDN</a>.
for more information about regexes. `matchAll()` is different from
<a href="#/p5/match">match()</a> because it returns every match, not just
the first.

The first parameter, `str`, is the string to search.

The second parameter, `regex`, is a string with the regular expression to
apply. For example, calling
`matchAll('p5*js is easier than abc123', '[a-z][0-9]')` would return the
2D array `[['p5'], ['c1']]`.

Note: If no matches are found, an empty array `[]` is returned.

@method matchAll
@param  {String} str string to search.
@param  {String} regexp regular expression to match.
@return {String[]} matches found.

---

## Fonction : nf(num, [left], [right])
Converts a `Number` into a `String` with a given number of digits.

`nf()` converts numbers such as `123.45` into strings formatted with a set
number of digits, as in `'123.4500'`.

The first parameter, `num`, is the number to convert to a string. For
example, calling `nf(123.45)` returns the string `'123.45'`. If an array of
numbers is passed, as in `nf([123.45, 67.89])`, an array of formatted
strings will be returned.

The second parameter, `left`, is optional. If a number is passed, as in
`nf(123.45, 4)`, it sets the minimum number of digits to include to the
left of the decimal place. If `left` is larger than the number of digits in
`num`, then unused digits will be set to 0. For example, calling
`nf(123.45, 4)` returns the string `'0123.45'`.

The third parameter, `right`, is also optional. If a number is passed, as
in `nf(123.45, 4, 1)`, it sets the minimum number of digits to include to
the right of the decimal place. If `right` is smaller than the number of
decimal places in `num`, then `num` will be rounded to the given number of
decimal places. For example, calling `nf(123.45, 4, 1)` returns the string
`'0123.5'`. If right is larger than the number of decimal places in `num`,
then unused decimal places will be set to 0. For example, calling
`nf(123.45, 4, 3)` returns the string `'0123.450'`.

When the number is negative, for example, calling `nf(-123.45, 5, 2)`
returns the string `'-00123.45'`.

@method nf
@param {Number|String} num number to format.
@param {Integer|String} [left] number of digits to include to the left of
                                the decimal point.
@param {Integer|String} [right] number of digits to include to the right
                                 of the decimal point.
@return {String} formatted string.

---

## Fonction : nfc(num, [right])
Converts a `Number` into a `String` with commas to mark units of 1,000.

`nfc()` converts numbers such as 12345 into strings formatted with commas
to mark the thousands place, as in `'12,345'`.

The first parameter, `num`, is the number to convert to a string. For
example, calling `nfc(12345)` returns the string `'12,345'`.

The second parameter, `right`, is optional. If a number is passed, as in
`nfc(12345, 1)`, it sets the minimum number of digits to include to the
right of the decimal place. If `right` is smaller than the number of
decimal places in `num`, then `num` will be rounded to the given number of
decimal places. For example, calling `nfc(12345.67, 1)` returns the string
`'12,345.7'`. If `right` is larger than the number of decimal places in
`num`, then unused decimal places will be set to 0. For example, calling
`nfc(12345.67, 3)` returns the string `'12,345.670'`.

@method nfc
@param  {Number|String} num number to format.
@param  {Integer|String} [right] number of digits to include to the right
                                  of the decimal point.
@return {String} formatted string.

---

## Fonction : nfp(num, [left], [right])
Converts a `Number` into a `String` with a plus or minus sign.

`nfp()` converts numbers such as 123 into strings formatted with a `+` or
`-` symbol to mark whether they're positive or negative, as in `'+123'`.

The first parameter, `num`, is the number to convert to a string. For
example, calling `nfp(123.45)` returns the string `'+123.45'`. If an array
of numbers is passed, as in `nfp([123.45, -6.78])`, an array of formatted
strings will be returned.

The second parameter, `left`, is optional. If a number is passed, as in
`nfp(123.45, 4)`, it sets the minimum number of digits to include to the
left of the decimal place. If `left` is larger than the number of digits in
`num`, then unused digits will be set to 0. For example, calling
`nfp(123.45, 4)` returns the string `'+0123.45'`.

The third parameter, `right`, is also optional. If a number is passed, as
in `nfp(123.45, 4, 1)`, it sets the minimum number of digits to include to
the right of the decimal place. If `right` is smaller than the number of
decimal places in `num`, then `num` will be rounded to the given number of
decimal places. For example, calling `nfp(123.45, 4, 1)` returns the
string `'+0123.5'`. If `right` is larger than the number of decimal places
in `num`, then unused decimal places will be set to 0. For example,
calling `nfp(123.45, 4, 3)` returns the string `'+0123.450'`.

@method nfp
@param {Number} num number to format.
@param {Integer} [left] number of digits to include to the left of the
                         decimal point.
@param {Integer} [right] number of digits to include to the right of the
                          decimal point.
@return {String} formatted string.

---

## Fonction : nfs(num, [left], [right])
Converts a positive `Number` into a `String` with an extra space in front.

`nfs()` converts positive numbers such as 123.45 into strings formatted
with an extra space in front, as in ' 123.45'. Doing so can be helpful for
aligning positive and negative numbers.

The first parameter, `num`, is the number to convert to a string. For
example, calling `nfs(123.45)` returns the string `' 123.45'`.

The second parameter, `left`, is optional. If a number is passed, as in
`nfs(123.45, 4)`, it sets the minimum number of digits to include to the
left of the decimal place. If `left` is larger than the number of digits in
`num`, then unused digits will be set to 0. For example, calling
`nfs(123.45, 4)` returns the string `' 0123.45'`.

The third parameter, `right`, is also optional. If a number is passed, as
in `nfs(123.45, 4, 1)`, it sets the minimum number of digits to include to
the right of the decimal place. If `right` is smaller than the number of
decimal places in `num`, then `num` will be rounded to the given number of
decimal places. For example, calling `nfs(123.45, 4, 1)` returns the
string `' 0123.5'`. If `right` is larger than the number of decimal places
in `num`, then unused decimal places will be set to 0. For example,
calling `nfs(123.45, 4, 3)` returns the string `' 0123.450'`.

@method nfs
@param {Number} num number to format.
@param {Integer} [left] number of digits to include to the left of the
                         decimal point.
@param {Integer} [right] number of digits to include to the right of the
                          decimal point.
@return {String} formatted string.

---

## Fonction : split(value, delim)
Splits a `String` into pieces and returns an array containing the pieces.

The first parameter, `value`, is the string to split.

The second parameter, `delim`, is the character(s) that should be used to
split the string. For example, calling
`split('rock...paper...scissors', '...')` would return the array
`['rock', 'paper', 'scissors']` because there are three periods `...`
between each word.

@method split
@param  {String} value the String to be split
@param  {String} delim the String used to separate the data
@return {String[]}  Array of Strings

---

## Fonction : splitTokens(value, [delim])
Splits a `String` into pieces and returns an array containing the pieces.

`splitTokens()` is an enhanced version of
<a href="#/p5/split">split()</a>. It can split a string when any characters
from a list are detected.

The first parameter, `value`, is the string to split.

The second parameter, `delim`, is optional. It sets the character(s) that
should be used to split the string. `delim` can be a single string, as in
`splitTokens('rock...paper...scissors...shoot', '...')`, or an array of
strings, as in
`splitTokens('rock;paper,scissors...shoot, [';', ',', '...'])`. By default,
if no `delim` characters are specified, then any whitespace character is
used to split. Whitespace characters include tab (`\t`), line feed (`\n`),
carriage return (`\r`), form feed (`\f`), and space.

@method splitTokens
@param  {String} value string to split.
@param  {String} [delim] character(s) to use for splitting the string.
@return {String[]} separated strings.

---

## Fonction : trim(str)
Removes whitespace from the start and end of a `String` without changing the middle.

`trim()` trims
<a href="https://developer.mozilla.org/en-US/docs/Glossary/whitespace" target="_blank">whitespace characters</a>
such as spaces, carriage returns, tabs, Unicode "nbsp" character.

The parameter, `str`, is the string to trim. If a single string is passed,
as in `trim('   pad   ')`, a single string is returned. If an array of
strings is passed, as in `trim(['    pad   ', '\n space \n'])`, an array of
strings is returned.

@method trim
@param  {String} str string to trim.
@return {String} trimmed string.