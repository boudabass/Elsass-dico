# Référence API : Temps et Date

## Fonction : day()
Returns the current day as a number from 1–31.

@method day
@return {Integer} current day between 1 and 31.

---

## Fonction : hour()
Returns the current hour as a number from 0–23.

@method hour
@return {Integer} current hour between 0 and 23.

---

## Fonction : minute()
Returns the current minute as a number from 0–59.

@method minute
@return {Integer} current minute between 0 and 59.

---

## Fonction : millis()
Returns the number of milliseconds since a sketch started running.

`millis()` keeps track of how long a sketch has been running in
milliseconds (thousandths of a second). This information is often
helpful for timing events and animations.

If a sketch has a
<a href="#/p5/setup">setup()</a> function, then `millis()` begins tracking
time before the code in <a href="#/p5/setup">setup()</a> runs. If a
sketch includes a <a href="#/p5/preload">preload()</a> function, then
`millis()` begins tracking time as soon as the code in
<a href="#/p5/preload">preload()</a> starts running.

@method millis
@return {Number} number of milliseconds since starting the sketch.

---

## Fonction : month()
Returns the current month as a number from 1–12.

@method month
@return {Integer} current month between 1 and 12.

---

## Fonction : second()
Returns the current second as a number from 0–59.

@method second
@return {Integer} current second between 0 and 59.

---

## Fonction : year()
Returns the current year as a number such as 1999.

@method year
@return {Integer} current year.