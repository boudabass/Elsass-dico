# Référence API : Structure de Base

## Fonction : noLoop()
Stops the continuous execution of the code within <a href="#/p5/draw">draw()</a>.

If <a href="#/p5/draw">draw()</a> is called, it will run once and then stop. Code in <a href="#/p5/draw">draw()</a> will continue to run until the end of the current iteration.

@method noLoop

---

## Fonction : loop()
Restarts the continuous execution of the code within <a href="#/p5/draw">draw()</a>.

@method loop

---

## Fonction : isLooping()
Returns `true` if the sketch is looping and `false` if not.

@method isLooping
@return {Boolean} whether the sketch is looping.

---

## Fonction : push()
Saves the current drawing style settings and transformations.

@method push

---

## Fonction : pop()
Restores the previous drawing style settings and transformations.

@method pop

---

## Fonction : redraw([n])
Executes the code within <a href="#/p5/draw">draw()</a> once.

@method redraw
@param {Integer} [n] number of times to execute <a href="#/p5/draw">draw()</a>.