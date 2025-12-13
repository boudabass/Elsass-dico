# Référence API : Événements d'Entrée

## Variable : movedX
A `Number` system variable that tracks the mouse's horizontal movement.

`movedX` tracks how many pixels the mouse moves left or right between
frames. `movedX` will have a negative value if the mouse moves left between
frames and a positive value if it moves right. `movedX` can be calculated
as `mouseX - pmouseX`.

Note: `movedX` continues updating even when
<a href="#/p5/requestPointerLock">requestPointerLock()</a> is active.
But keep in mind that during an active pointer lock, mouseX and pmouseX
are locked, so `movedX` is based on
<a href="https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/movementX">the MouseEvent's movementX value</a>
(which may behave differently in different browsers when the user
is zoomed in or out).

@property {Number} movedX
@readOnly

### Exemple
<div>
<code>
function setup() {
  createCanvas(100, 100);

  describe(
    'A gray square. The text ">>" appears when the user moves the mouse to the right. The text "<<" appears when the user moves the mouse to the left.'
  );
}

function draw() {
  background(200);

  // Style the text.
  textAlign(CENTER);
  textSize(16);

  // Display >> when movedX is positive and
  // << when it's negative.
  if (movedX > 0) {
    text('>>', 50, 50);
  } else if (movedX < 0) {
    text('<<', 50, 50);
  }
}
</code>
</div>

---

## Variable : movedY
A `Number` system variable that tracks the mouse's vertical movement.

`movedY` tracks how many pixels the mouse moves up or down between
frames. `movedY` will have a negative value if the mouse moves up between
frames and a positive value if it moves down. `movedY` can be calculated
as `mouseY - pmouseY`.

Note: `movedY` continues updating even when
<a href="#/p5/requestPointerLock">requestPointerLock()</a> is active.
But keep in mind that during an active pointer lock, mouseX and pmouseX
are locked, so `movedX` is based on
<a href="https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/movementX">the MouseEvent's movementX value</a>
(which may behave differently in different browsers when the user
is zoomed in or out).

@property {Number} movedY
@readOnly

### Exemple
<div>
<code>
function setup() {
  createCanvas(100, 100);

  describe(
    'A gray square. The text "▲" appears when the user moves the mouse upward. The text "▼" appears when the user moves the mouse downward.'
  );
}

function draw() {
  background(200);

  // Style the text.
  textAlign(CENTER);
  textSize(16);

  // Display ▼ when movedY is positive and
  // ▲ when it's negative.
  if (movedY > 0) {
    text('▼', 50, 50);
  } else if (movedY < 0) {
    text('▲', 50, 50);
  }
}
</code>
</div>

---

## Variable : mouseX
A `Number` system variable that tracks the mouse's horizontal position.

`mouseX` keeps track of the mouse's position relative to the
top-left corner of the canvas. For example, if the mouse is 50 pixels from
the left edge of the canvas, then `mouseX` will be 50.

If touch is used instead of the mouse, then `mouseX` will hold the
x-coordinate of the most recent touch point.

@property {Number} mouseX
@readOnly

### Exemple
<div>
<code>
function setup() {
  createCanvas(100, 100);

  describe("A vertical black line moves left and right following the mouse's x-position.");
}

function draw() {
  background(200);

  // Draw a vertical line that follows the mouse's x-coordinate.
  line(mouseX, 0, mouseX, 100);
}
</code>
</div>

<div>
<code>
function setup() {
  createCanvas(100, 100);

  describe("A gray square. The mouse's x- and y-coordinates are displayed as the user moves the mouse.");
}

function draw() {
  background(200);

  // Style the text.
  textAlign(CENTER);
  textSize(16);

  // Display the mouse's coordinates.
  text(`x: ${mouseX} y: ${mouseY}`, 50, 50);
}
</code>
</div>

---

## Variable : mouseY
A `Number` system variable that tracks the mouse's vertical position.

`mouseY` keeps track of the mouse's position relative to the
top-left corner of the canvas. For example, if the mouse is 50 pixels from
the top edge of the canvas, then `mouseY` will be 50.

If touch is used instead of the mouse, then `mouseY` will hold the
y-coordinate of the most recent touch point.

@property {Number} mouseY
@readOnly

### Exemple
<div>
<code>
function setup() {
  createCanvas(100, 100);

  describe("A horizontal black line moves up and down following the mouse's y-position.");
}

function draw() {
  background(200);

  // Draw a horizontal line that follows the mouse's y-coordinate.
  line(0, mouseY, 100, mouseY);
}
</code>
</div>

<div>
<code>
function setup() {
  createCanvas(100, 100);

  describe("A gray square. The mouse's x- and y-coordinates are displayed as the user moves the mouse.");
}

function draw() {
  background(200);

  // Style the text.
  textAlign(CENTER);
  textSize(16);

  // Display the mouse's coordinates.
  text(`x: ${mouseX} y: ${mouseY}`, 50, 50);
}
</code>
</div>

---

## Variable : pmouseX
A `Number` system variable that tracks the mouse's previous horizontal
position.

`pmouseX` keeps track of the mouse's position relative to the
top-left corner of the canvas. Its value is
<a href="#/p5/mouseX">mouseX</a> from the previous frame. For example, if
the mouse was 50 pixels from the left edge of the canvas during the last
frame, then `pmouseX` will be 50.

If touch is used instead of the mouse, then `pmouseX` will hold the
x-coordinate of the most recent touch point.

Note: `pmouseX` is reset to the current <a href="#/p5/mouseX">mouseX</a>
value at the start of each touch event.

@property {Number} pmouseX
@readOnly

### Exemple
<div>
<code>
function setup() {
  createCanvas(100, 100);

  // Slow the frame rate.
  frameRate(10);

  describe('A line follows the mouse as it moves. The line grows longer with faster movements.');
}

function draw() {
  background(200);

  line(pmouseX, pmouseY, mouseX, mouseY);
}
</code>
</div>

---

## Variable : pmouseY
A `Number` system variable that tracks the mouse's previous vertical
position.

`pmouseY` keeps track of the mouse's position relative to the
top-left corner of the canvas. Its value is
<a href="#/p5/mouseY">mouseY</a> from the previous frame. For example, if
the mouse was 50 pixels from the top edge of the canvas during the last
frame, then `pmouseY` will be 50.

If touch is used instead of the mouse, then `pmouseY` will hold the
y-coordinate of the last touch point.

Note: `pmouseY` is reset to the current <a href="#/p5/mouseY">mouseY</a>
value at the start of each touch event.

@property {Number} pmouseY
@readOnly

### Exemple
<div>
<code>
function setup() {
  createCanvas(100, 100);

  // Slow the frame rate.
  frameRate(10);

  describe('A line follows the mouse as it moves. The line grows longer with faster movements.');
}

function draw() {
  background(200);

  line(pmouseX, pmouseY, mouseX, mouseY);
}
</code>
</div>

---

## Variable : winMouseX
A `Number` variable that tracks the mouse's horizontal position within the
browser.

`winMouseX` keeps track of the mouse's position relative to the top-left
corner of the browser window. For example, if the mouse is 50 pixels from
the left edge of the browser, then `winMouseX` will be 50.

On a touchscreen device, `winMouseX` will hold the x-coordinate of the most
recent touch point.

Note: Use <a href="#/p5/mouseX">mouseX</a> to track the mouse’s
x-coordinate within the canvas.

@property {Number} winMouseX
@readOnly

### Exemple
<div>
<code>
function setup() {
  createCanvas(100, 100);

  describe("A gray square. The mouse's x- and y-coordinates are displayed as the user moves the mouse.");
}

function draw() {
  background(200);

  // Style the text.
  textAlign(CENTER);
  textSize(16);

  // Display the mouse's coordinates within the browser window.
  text(`x: ${winMouseX} y: ${winMouseY}`, 50, 50);
}
</code>
</div>

---

## Variable : winMouseY
A `Number` variable that tracks the mouse's vertical position within the
browser.

`winMouseY` keeps track of the mouse's position relative to the top-left
corner of the browser window. For example, if the mouse is 50 pixels from
the top edge of the browser, then `winMouseY` will be 50.

On a touchscreen device, `winMouseY` will hold the y-coordinate of the most
recent touch point.

Note: Use <a href="#/p5/mouseY">mouseY</a> to track the mouse’s
y-coordinate within the canvas.

@property {Number} winMouseY
@readOnly

### Exemple
<div>
<code>
function setup() {
  createCanvas(100, 100);

  describe("A gray square. The mouse's x- and y-coordinates are displayed as the user moves the mouse.");
}

function draw() {
  background(200);

  // Style the text.
  textAlign(CENTER);
  textSize(16);

  // Display the mouse's coordinates within the browser window.
  text(`x: ${winMouseX} y: ${winMouseY}`, 50, 50);
}
</code>
</div>

---

## Variable : pwinMouseX
A `Number` variable that tracks the mouse's previous horizontal position
within the browser.

`pwinMouseX` keeps track of the mouse's position relative to the top-left
corner of the browser window. Its value is
<a href="#/p5/winMouseX">winMouseX</a> from the previous frame. For
example, if the mouse was 50 pixels from
the left edge of the browser during the last frame, then `pwinMouseX` will
be 50.

On a touchscreen device, `pwinMouseX` will hold the x-coordinate of the most
recent touch point. `pwinMouseX` is reset to the current
<a href="#/p5/winMouseX">winMouseX</a> value at the start of each touch
event.

Note: Use <a href="#/p5/pmouseX">pmouseX</a> to track the mouse’s previous
x-coordinate within the canvas.

@property {Number} pwinMouseX
@readOnly

### Exemple
<div>
<code>
function setup() {
  createCanvas(100, 100);

  // Slow the frame rate.
  frameRate(10);

  describe('A gray square. A white circle at its center grows larger when the mouse moves horizontally.');
}

function draw() {
  background(200);

  // Calculate the circle's diameter.
  let d = winMouseX - pwinMouseX;

  // Draw the circle.
  circle(50, 50, d);
}
</code>
</div>

<div>
<code>
function setup() {
  // Create the canvas and set its position.
  let cnv = createCanvas(100, 100);
  cnv.position(20, 20);

  describe('A gray square with a number at its center. The number changes as the user moves the mouse vertically.');
}

function draw() {
  background(200);

  // Style the text.
  textAlign(CENTER);
  textSize(16);

  // Display pwinMouseX.
  text(pwinMouseX, 50, 50);
}
</code>
</div>

---

## Variable : pwinMouseY
A `Number` variable that tracks the mouse's previous vertical position
within the browser.

`pwinMouseY` keeps track of the mouse's position relative to the top-left
corner of the browser window. Its value is
<a href="#/p5/winMouseY">winMouseY</a> from the previous frame. For
example, if the mouse was 50 pixels from
the top edge of the browser during the last frame, then `pwinMouseY` will
be 50.

On a touchscreen device, `pwinMouseY` will hold the y-coordinate of the most
recent touch point. `pwinMouseY` is reset to the current
<a href="#/p5/winMouseY">winMouseY</a> value at the start of each touch
event.

Note: Use <a href="#/p5/pmouseY">pmouseY</a> to track the mouse’s previous
y-coordinate within the canvas.

@property {Number} pwinMouseY
@readOnly

### Exemple
<div>
<code>
function setup() {
  createCanvas(100, 100);

  // Slow the frame rate.
  frameRate(10);

  describe('A gray square. A white circle at its center grows larger when the mouse moves vertically.');
}

function draw() {
  background(200);

  // Calculate the circle's diameter.
  let d = winMouseY - pwinMouseY;

  // Draw the circle.
  circle(50, 50, d);
}
</code>
</div>

<div>
<code>
function setup() {
  // Create the canvas and set its position.
  let cnv = createCanvas(100, 100);
  cnv.position(20, 20);

  describe('A gray square with a number at its center. The number changes as the user moves the mouse vertically.');
}

function draw() {
  background(200);

  // Style the text.
  textAlign(CENTER);
  textSize(16);

  // Display pwinMouseY.
  text(pwinMouseY, 50, 50);
}
</code>
</div>

---

## Variable : mouseButton
A String system variable that contains the value of the last mouse button
pressed.

The `mouseButton` variable is either `LEFT`, `RIGHT`, or `CENTER`,
depending on which button was pressed last.

Note: Different browsers may track `mouseButton` differently. See
<a href="https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons" target="_blank">MDN</a>
for more information.

@property {Constant} mouseButton
@readOnly

### Exemple
<div>
<code>
function setup() {
  createCanvas(100, 100);

  describe(
    'A gray square with black text at its center. The text changes from 0 to either "left" or "right" when the user clicks a mouse button.'
  );
}

function draw() {
  background(200);

  // Style the text.
  textAlign(CENTER);
  textSize(16);

  // Display the mouse button.
  text(mouseButton, 50, 50);
}
</code>
</div>

<div>
<code>
function setup() {
  createCanvas(100, 100);

  describe(
    "A gray square. Different shapes appear at its center depending on the mouse button that's clicked."
  );
}

function draw() {
  background(200);

  if (mouseIsPressed === true) {
    if (mouseButton === LEFT) {
      circle(50, 50, 50);
    }
    if (mouseButton === RIGHT) {
      square(25, 25, 50);
    }
    if (mouseButton === CENTER) {
      triangle(23, 75, 50, 20, 78, 75);
    }
  }
}
</code>
</div>

---

## Variable : mouseIsPressed
A `Boolean` system variable that's `true` if the mouse is pressed and
`false` if not.

@property {Boolean} mouseIsPressed
@readOnly

### Exemple
<div>
<code>
function setup() {
  createCanvas(100, 100);

  describe(
    'A gray square with the word "false" at its center. The word changes to "true" when the user presses a mouse button.'
  );
}

function draw() {
  background(200);

  // Style the text.
  textAlign(CENTER);
  textSize(16);

  // Display the mouseIsPressed variable.
  text(mouseIsPressed, 25, 50);
}
</code>
</div>

<div>
<code>
function setup() {
  createCanvas(100, 100);

  describe(
    'A gray square with a white square at its center. The inner square turns black when the user presses the mouse.'
  );
  }

function draw() {
  background(200);

  // Style the square.
  if (mouseIsPressed === true) {
    fill(0);
  } else {
    fill(255);
  }

  // Draw the square.
  square(25, 25, 50);
}
</code>
</div>

---

## Fonction : mouseMoved()
A function that's called when the mouse moves.

Declaring the function `mouseMoved()` sets a code block to run
automatically when the user moves the mouse without clicking any mouse
buttons:

```js
function mouseMoved() {
  // Code to run.
}
```

The mouse system variables, such as <a href="#/p5/mouseX">mouseX</a> and
<a href="#/p5/mouseY">mouseY</a>, will be updated with their most recent
value when `mouseMoved()` is called by p5.js:

```js
function mouseMoved() {
  if (mouseX < 50) {
    // Code to run if the mouse is on the left.
  }

  if (mouseY > 50) {
    // Code to run if the mouse is near the bottom.
  }
}
```

The parameter, `event`, is optional. `mouseMoved()` is always passed a
<a href="https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent" target="_blank">MouseEvent</a>
object with properties that describe the mouse move event:

```js
function mouseMoved(event) {
  // Code to run that uses the event.
  console.log(event);
}
```

Browsers may have default behaviors attached to various mouse events. For
example, some browsers highlight text when the user moves the mouse while
pressing a mouse button. To prevent any default behavior for this event,
add `return false;` to the end of the function.

@method mouseMoved
@param  {MouseEvent} [event] optional `MouseEvent` argument.

### Exemple
<div>
<code>
let value = 0;

function setup() {
  createCanvas(100, 100);

  describe(
    'A gray square with a black square at its center. The inner square becomes lighter as the mouse moves.'
  );
}

function draw() {
  background(200);

  // Style the square.
  fill(value);

  // Draw the square.
  square(25, 25, 50);
}

function mouseMoved() {
  // Update the grayscale value.
  value += 5;

  // Reset the grayscale value.
  if (value > 255) {
    value = 0;
  }
  // Uncomment to prevent any default behavior.
  // return false;
}
</code>
</div>

---

## Fonction : mouseDragged()
A function that's called when the mouse moves while a button is pressed.

Declaring the function `mouseDragged()` sets a code block to run
automatically when the user clicks and drags the mouse:

```js
function mouseDragged() {
  // Code to run.
}
```

The mouse system variables, such as <a href="#/p5/mouseX">mouseX</a> and
<a href="#/p5/mouseY">mouseY</a>, will be updated with their most recent
value when `mouseDragged()` is called by p5.js:

```js
function mouseDragged() {
  if (mouseX < 50) {
    // Code to run if the mouse is on the left.
  }

  if (mouseY > 50) {
    // Code to run if the mouse is near the bottom.
  }
}
```

The parameter, `event`, is optional. `mouseDragged()` is always passed a
<a href="https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent" target="_blank">MouseEvent</a>
object with properties that describe the mouse drag event:

```js
function mouseDragged(event) {
  // Code to run that uses the event.
  console.log(event);
}
```

On touchscreen devices, `mouseDragged()` will run when a user moves a touch
point if <a href="#/p5/touchMoved">touchMoved()</a> isn’t declared. If
<a href="#/p5/touchMoved">touchMoved()</a> is declared, then
<a href="#/p5/touchMoved">touchMoved()</a> will run when a user moves a
touch point and `mouseDragged()` won’t.

Browsers may have default behaviors attached to various mouse events. For
example, some browsers highlight text when the user moves the mouse while
pressing a mouse button. To prevent any default behavior for this event,
add `return false;` to the end of the function.

@method mouseDragged
@param  {MouseEvent} [event] optional `MouseEvent` argument.

### Exemple
<div>
<code>
let value = 0;

function setup() {
  createCanvas(100, 100);

  describe(
    'A gray square with a black square at its center. The inner square becomes lighter as the user drags the mouse.'
  );
}

function draw() {
  background(200);

  // Style the square.
  fill(value);

  // Draw the square.
  square(25, 25, 50);
}

function mouseDragged() {
  // Update the grayscale value.
  value += 5;

  // Reset the grayscale value.
  if (value > 255) {
    value = 0;
  }
  // Uncomment to prevent any default behavior.
  // return false;
}
</code>
</div>

---

## Fonction : mousePressed()
A function that's called once when a mouse button is pressed.

Declaring the function `mousePressed()` sets a code block to run
automatically when the user presses a mouse button:

```js
function mousePressed() {
  // Code to run.
}
```

The mouse system variables, such as <a href="#/p5/mouseX">mouseX</a> and
<a href="#/p5/mouseY">mouseY</a>, will be updated with their most recent
value when `mousePressed()` is called by p5.js:

```js
function mousePressed() {
  if (mouseX < 50) {
    // Code to run if the mouse is on the left.
  }

  if (mouseY > 50) {
    // Code to run if the mouse is near the bottom.
  }
}
```

The parameter, `event`, is optional. `mousePressed()` is always passed a
<a href="https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent" target="_blank">MouseEvent</a>
object with properties that describe the mouse press event:

```js
function mousePressed(event) {
  // Code to run that uses the event.
  console.log(event);
}
```

On touchscreen devices, `mousePressed()` will run when a user’s touch
begins if <a href="#/p5/touchStarted">touchStarted()</a> isn’t declared. If
<a href="#/p5/touchStarted">touchStarted()</a> is declared, then
<a href="#/p5/touchStarted">touchStarted()</a> will run when a user’s touch
begins and `mousePressed()` won’t.

Browsers may have default behaviors attached to various mouse events. For
example, some browsers highlight text when the user moves the mouse while
pressing a mouse button. To prevent any default behavior for this event,
add `return false;` to the end of the function.

Note: `mousePressed()`, <a href="#/p5/mouseReleased">mouseReleased()</a>,
and <a href="#/p5/mouseClicked">mouseClicked()</a> are all related.
`mousePressed()` runs as soon as the user clicks the mouse.
<a href="#/p5/mouseReleased">mouseReleased()</a> runs as soon as the user
releases the mouse click. <a href="#/p5/mouseClicked">mouseClicked()</a>
runs immediately after <a href="#/p5/mouseReleased">mouseReleased()</a>.

@method mousePressed
@param  {MouseEvent} [event] optional `MouseEvent` argument.

### Exemple
<div>
<code>
let value = 0;

function setup() {
  createCanvas(100, 100);

  describe(
    'A gray square with a black square at its center. The inner square becomes lighter when the user presses a mouse button.'
  );
}

function draw() {
  background(200);

  // Style the square.
  fill(value);

  // Draw the square.
  square(25, 25, 50);
}

function mousePressed() {
  // Update the grayscale value.
  value += 5;

  // Reset the grayscale value.
  if (value > 255) {
    value = 0;
  }
  // Uncomment to prevent any default behavior.
  // return false;
}
</code>
</div>

<div>
<code>
function setup() {
  createCanvas(100, 100);

  // Style the circle.
  fill('orange');
  stroke('royalblue');
  strokeWeight(10);

  describe(
    'An orange circle with a thick, blue border drawn on a gray background. When the user presses and holds the mouse, the border becomes thin and pink. When the user releases the mouse, the border becomes thicker and changes color to blue.'
  );
}

function draw() {
  background(220);

  // Draw the circle.
  circle(50, 50, 20);
}

// Set the stroke color and weight as soon as the user clicks.
function mousePressed() {
  stroke('deeppink');
  strokeWeight(3);
}

// Set the stroke and fill colors as soon as the user releases
// the mouse.
function mouseReleased() {
  stroke('royalblue');

  // This is never visible because fill() is called
  // in mouseClicked() which runs immediately after
  // mouseReleased();
  fill('limegreen');
}

// Set the fill color and stroke weight after
// mousePressed() and mouseReleased() are called.
function mouseClicked() {
  fill('orange');
  strokeWeight(10);
}
</code>
</div>

---

## Fonction : mouseReleased()
A function that's called once when a mouse button is released.

Declaring the function `mouseReleased()` sets a code block to run
automatically when the user releases a mouse button after having pressed
it:

```js
function mouseReleased() {
  // Code to run.
}
```

The mouse system variables, such as <a href="#/p5/mouseX">mouseX</a> and
<a href="#/p5/mouseY">mouseY</a>, will be updated with their most recent
value when `mouseReleased()` is called by p5.js:

```js
function mouseReleased() {
  if (mouseX < 50) {
    // Code to run if the mouse is on the left.
  }

  if (mouseY > 50) {
    // Code to run if the mouse is near the bottom.
  }
}
```

The parameter, `event`, is optional. `mouseReleased()` is always passed a
<a href="https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent" target="_blank">MouseEvent</a>
object with properties that describe the mouse release event:

```js
function mouseReleased(event) {
  // Code to run that uses the event.
  console.log(event);
}
```

On touchscreen devices, `mouseReleased()` will run when a user’s touch
ends if <a href="#/p5/touchEnded">touchEnded()</a> isn’t declared. If
<a href="#/p5/touchEnded">touchEnded()</a> is declared, then
<a href="#/p5/touchEnded">touchEnded()</a> will run when a user’s touch
ends and `mouseReleased()` won’t.

Browsers may have default behaviors attached to various mouse events. For
example, some browsers highlight text when the user moves the mouse while
pressing a mouse button. To prevent any default behavior for this event,
add `return false;` to the end of the function.

Note: <a href="#/p5/mousePressed">mousePressed()</a>, `mouseReleased()`,
and <a href="#/p5/mouseClicked">mouseClicked()</a> are all related.
<a href="#/p5/mousePressed">mousePressed()</a> runs as soon as the user
clicks the mouse. `mouseReleased()` runs as soon as the user releases the
mouse click. <a href="#/p5/mouseClicked">mouseClicked()</a> runs
immediately after `mouseReleased()`.

@method mouseReleased
@param  {MouseEvent} [event] optional `MouseEvent` argument.

### Exemple
<div>
<code>
let value = 0;

function setup() {
  createCanvas(100, 100);

  describe(
    'A gray square with a black square at its center. The inner square becomes lighter when the user presses and releases a mouse button.'
  );
}

function draw() {
  background(200);

  // Style the square.
  fill(value);

  // Draw the square.
  square(25, 25, 50);
}

function mouseReleased() {
  // Update the grayscale value.
  value += 5;

  // Reset the grayscale value.
  if (value > 255) {
    value = 0;
  }
  // Uncomment to prevent any default behavior.
  // return false;
}
</code>
</div>

<div>
<code>
function setup() {
  createCanvas(100, 100);

  // Style the circle.
  fill('orange');
  stroke('royalblue');
  strokeWeight(10);

  describe(
    'An orange circle with a thick, blue border drawn on a gray background. When the user presses and holds the mouse, the border becomes thin and pink. When the user releases the mouse, the border becomes thicker and changes color to blue.'
  );
}

function draw() {
  background(220);

  // Draw the circle.
  circle(50, 50, 20);
}

// Set the stroke color and weight as soon as the user clicks.
function mousePressed() {
  stroke('deeppink');
  strokeWeight(3);
}

// Set the stroke and fill colors as soon as the user releases
// the mouse.
function mouseReleased() {
  stroke('royalblue');

  // This is never visible because fill() is called
  // in mouseClicked() which runs immediately after
  // mouseReleased();
  fill('limegreen');
}

// Set the fill color and stroke weight after
// mousePressed() and mouseReleased() are called.
function mouseClicked() {
  fill('orange');
  strokeWeight(10);
}
</code>
</div>

---

## Fonction : mouseClicked()
A function that's called once after a mouse button is pressed and released.

Declaring the function `mouseClicked()` sets a code block to run
automatically when the user releases a mouse button after having pressed
it:

```js
function mouseClicked() {
  // Code to run.
}
```

The mouse system variables, such as <a href="#/p5/mouseX">mouseX</a> and
<a href="#/p5/mouseY">mouseY</a>, will be updated with their most recent
value when `mouseClicked()` is called by p5.js:

```js
function mouseClicked() {
  if (mouseX < 50) {
    // Code to run if the mouse is on the left.
  }

  if (mouseY > 50) {
    // Code to run if the mouse is near the bottom.
  }
}
```

The parameter, `event`, is optional. `mouseClicked()` is always passed a
<a href="https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent" target="_blank">MouseEvent</a>
object with properties that describe the mouse click event:

```js
function mouseClicked(event) {
  // Code to run that uses the event.
  console.log(event);
}
```

On touchscreen devices, `mouseClicked()` will run when a user’s touch
ends if <a href="#/p5/touchEnded">touchEnded()</a> isn’t declared. If
<a href="#/p5/touchEnded">touchEnded()</a> is declared, then
<a href="#/p5/touchEnded">touchEnded()</a> will run when a user’s touch
ends and `mouseClicked()` won’t.

Browsers may have default behaviors attached to various mouse events. For
example, some browsers highlight text when the user moves the mouse while
pressing a mouse button. To prevent any default behavior for this event,
add `return false;` to the end of the function.

Note: <a href="#/p5/mousePressed">mousePressed()</a>,
<a href="#/p5/mouseReleased">mouseReleased()</a>,
and `mouseClicked()` are all related.
<a href="#/p5/mousePressed">mousePressed()</a> runs as soon as the user
clicks the mouse. <a href="#/p5/mouseReleased">mouseReleased()</a> runs as
soon as the user releases the mouse click. `mouseClicked()` runs
immediately after <a href="#/p5/mouseReleased">mouseReleased()</a>.

@method mouseClicked
@param  {MouseEvent} [event] optional `MouseEvent` argument.

### Exemple
<div>
<code>
let value = 0;

function setup() {
  createCanvas(100, 100);

  describe(
    'A gray square with a black square at its center. The inner square changes color when the user presses and releases a mouse button.'
  );
}

function draw() {
  background(200);

  // Style the square.
  fill(value);

  // Draw the square.
  square(25, 25, 50);
}

// Toggle the square's color when the user clicks.
function mouseClicked() {
  if (value === 0) {
    value = 255;
  } else {
    value = 0;
  }
  // Uncomment to prevent any default behavior.
  // return false;
}
</code>
</div>

<div>
<code>
function setup() {
  createCanvas(100, 100);

  // Style the circle.
  fill('orange');
  stroke('royalblue');
  strokeWeight(10);

  describe(
    'An orange circle with a thick, blue border drawn on a gray background. When the user presses and holds the mouse, the border becomes thin and pink. When the user releases the mouse, the border becomes thicker and changes color to blue.'
  );
}

function draw() {
  background(220);

  // Draw the circle.
  circle(50, 50, 20);
}

// Set the stroke color and weight as soon as the user clicks.
function mousePressed() {
  stroke('deeppink');
  strokeWeight(3);
}

// Set the stroke and fill colors as soon as the user releases
// the mouse.
function mouseReleased() {
  stroke('royalblue');

  // This is never visible because fill() is called
  // in mouseClicked() which runs immediately after
  // mouseReleased();
  fill('limegreen');
}

// Set the fill color and stroke weight after
// mousePressed() and mouseReleased() are called.
function mouseClicked() {
  fill('orange');
  strokeWeight(10);
}
</code>
</div>

---

## Fonction : doubleClicked()
A function that's called once when a mouse button is clicked twice quickly.

Declaring the function `doubleClicked()` sets a code block to run
automatically when the user presses and releases the mouse button twice
quickly:

```js
function doubleClicked() {
  // Code to run.
}
```

The mouse system variables, such as <a href="#/p5/mouseX">mouseX</a> and
<a href="#/p5/mouseY">mouseY</a>, will be updated with their most recent
value when `doubleClicked()` is called by p5.js:

```js
function doubleClicked() {
  if (mouseX < 50) {
    // Code to run if the mouse is on the left.
  }

  if (mouseY > 50) {
    // Code to run if the mouse is near the bottom.
  }
}
```

The parameter, `event`, is optional. `doubleClicked()` is always passed a
<a href="https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent" target="_blank">MouseEvent</a>
object with properties that describe the double-click event:

```js
function doubleClicked(event) {
  // Code to run that uses the event.
  console.log(event);
}
```

On touchscreen devices, code placed in `doubleClicked()` will run after two
touches that occur within a short time.

Browsers may have default behaviors attached to various mouse events. For
example, some browsers highlight text when the user moves the mouse while
pressing a mouse button. To prevent any default behavior for this event,
add `return false;` to the end of the function.

@method doubleClicked
@param  {MouseEvent} [event] optional `MouseEvent` argument.

### Exemple
<div>
<code>
let value = 0;

function setup() {
  createCanvas(100, 100);

  describe(
    'A gray square with a black square at its center. The inner square changes color when the user double-clicks.'
  );
}

function draw() {
  background(200);

  // Style the square.
  fill(value);

  // Draw the square.
  square(25, 25, 50);
}

// Toggle the square's color when the user double-clicks.
function doubleClicked() {
  if (value === 0) {
    value = 255;
  } else {
    value = 0;
  }
  // Uncomment to prevent any default behavior.
  // return false;
}
</code>
</div>

<div>
<code>
let value = 0;

function setup() {
  createCanvas(100, 100);

  describe(
    'A gray square with a black circle at its center. When the user double-clicks on the circle, it changes color to white.'
  );
}

function draw() {
  background(200);

  // Style the circle.
  fill(value);

  // Draw the circle.
  circle(50, 50, 80);
}

// Reassign value to 255 when the user double-clicks on the circle.
function doubleClicked() {
  if (dist(50, 50, mouseX, mouseY) < 40) {
    value = 255;
  }
  // Uncomment to prevent any default behavior.
  // return false;
}
</code>
</div>

---

## Fonction : mouseWheel()
A function that's called once when the mouse wheel moves.

Declaring the function `mouseWheel()` sets a code block to run
automatically when the user scrolls with the mouse wheel:

```js
function mouseWheel() {
  // Code to run.
}
```

The mouse system variables, such as <a href="#/p5/mouseX">mouseX</a> and
<a href="#/p5/mouseY">mouseY</a>, will be updated with their most recent
value when `mouseWheel()` is called by p5.js:

```js
function mouseWheel() {
  if (mouseX < 50) {
    // Code to run if the mouse is on the left.
  }

  if (mouseY > 50) {
    // Code to run if the mouse is near the bottom.
  }
}
```

The parameter, `event`, is optional. `mouseWheel()` is always passed a
<a href="https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent" target="_blank">MouseEvent</a>
object with properties that describe the mouse scroll event:

```js
function mouseWheel(event) {
  // Code to run that uses the event.
  console.log(event);
}
```

The `event` object has many properties including `delta`, a `Number`
containing the distance that the user scrolled. For example, `event.delta`
might have the value 5 when the user scrolls up. `event.delta` is positive
if the user scrolls up and negative if they scroll down. The signs are
opposite on macOS with "natural" scrolling enabled.

Browsers may have default behaviors attached to various mouse events. For
example, some browsers highlight text when the user moves the mouse while
pressing a mouse button. To prevent any default behavior for this event,
add `return false;` to the end of the function.

Note: On Safari, `mouseWheel()` may only work as expected if
`return false;` is added at the end of the function.

@method mouseWheel
@param  {WheelEvent} [event] optional `WheelEvent` argument.

### Exemple
<div>
<code>
let circleSize = 0;

function setup() {
  createCanvas(100, 100);

  describe(
    'A gray square. A white circle at its center grows up when the user scrolls the mouse wheel.'
  );
}

function draw() {
  background(200);

  // Draw the circle
  circle(50, 50, circleSize);
}

// Increment circleSize when the user scrolls the mouse wheel.
function mouseWheel() {
  circleSize += 1;
  // Uncomment to prevent any default behavior.
  // return false;
}
</code>
</div>

<div>
<code>
let direction = '';

function setup() {
  createCanvas(100, 100);

  describe(
    'A gray square. An arrow at its center points up when the user scrolls up. The arrow points down when the user scrolls down.'
  );
}

function draw() {
  background(200);

  // Style the text.
  textAlign(CENTER);
  textSize(16);

  // Draw an arrow that points where
  // the mouse last scrolled.
  text(direction, 50, 50);
}

// Change direction when the user scrolls the mouse wheel.
function mouseWheel(event) {
  if (event.delta > 0) {
    direction = '▲';
  } else {
    direction = '▼';
  }
  // Uncomment to prevent any default behavior.
  // return false;
}
</code>
</div>

---

## Fonction : requestPointerLock()
Locks the mouse pointer to its current position and makes it invisible.

`requestPointerLock()` allows the mouse to move forever without leaving the
screen. Calling `requestPointerLock()` locks the values of
<a href="#/p5/mouseX">mouseX</a>, <a href="#/p5/mouseY">mouseY</a>,
<a href="#/p5/pmouseX">pmouseX</a>, and <a href="#/p5/pmouseY">pmouseY</a>.
<a href="#/p5/movedX">movedX</a> and <a href="#/p5/movedY">movedY</a>
continue updating and can be used to get the distance the mouse moved since
the last frame was drawn. Calling
<a href="#/p5/exitPointerLock">exitPointerLock()</a> resumes updating the
mouse system variables.

Note: Most browsers require an input, such as a click, before calling
`requestPointerLock()`. It’s recommended to call `requestPointerLock()` in
an event function such as <a href="#/p5/doubleClicked">doubleClicked()</a>.

@method requestPointerLock

### Exemple
<div>
<code>
let score = 0;

function setup() {
  createCanvas(100, 100);

  describe(
    'A gray square with the text "Score: X" at its center. The score increases when the user moves the mouse upward. It decreases when the user moves the mouse downward.'
  );
}

function draw() {
  background(200);

  // Update the score.
  score -= movedY;

  // Style the text.
  textAlign(CENTER);
  textSize(16);

  // Display the score.
  text(`Score: ${score}`, 50, 50);
}

// Lock the pointer when the user double-clicks.
function doubleClicked() {
  requestPointerLock();
}
</code>
</div>

---

## Fonction : exitPointerLock()
Exits a pointer lock started with
<a href="#/p5/requestPointerLock">requestPointerLock</a>.

Calling `requestPointerLock()` locks the values of
<a href="#/p5/mouseX">mouseX</a>, <a href="#/p5/mouseY">mouseY</a>,
<a href="#/p5/pmouseX">pmouseX</a>, and <a href="#/p5/pmouseY">pmouseY</a>.
Calling `exitPointerLock()` resumes updating the mouse system variables.

Note: Most browsers require an input, such as a click, before calling
`requestPointerLock()`. It’s recommended to call `requestPointerLock()` in
an event function such as <a href="#/p5/doubleClicked">doubleClicked()</a>.

@method exitPointerLock

### Exemple
<div>
<code>
let isLocked = false;

function setup() {
  createCanvas(100, 100);

  describe(
    'A gray square with a word at its center. The word changes between "Unlocked" and "Locked" when the user double-clicks.'
  );
}

function draw() {
  background(200);

  // Style the text.
  textAlign(CENTER);
  textSize(16);

  // Tell the user whether the pointer is locked.
  if (isLocked === true) {
    text('Locked', 50, 50);
  } else {
    text('Unlocked', 50, 50);
  }
}

// Toggle the pointer lock when the user double-clicks.
function doubleClicked() {
  if (isLocked === true) {
    exitPointerLock();
    isLocked = false;
  } else {
    requestPointerLock();
    isLocked = true;
  }
}
</code>
</div>

---

## Variable : keyIsPressed
A `Boolean` system variable that's `true` if any key is currently pressed
and `false` if not.

@property {Boolean} keyIsPressed
@readOnly

### Exemple
<div>
<code>
// Click on the canvas to begin detecting key presses.

function setup() {
  createCanvas(100, 100);

  describe(
    'A gray square with a white square at its center. The white square turns black when the user presses a key.'
  );
}

function draw() {
  background(200);

  // Style the square.
  if (keyIsPressed === true) {
    fill(0);
  } else {
    fill(255);
  }

  // Draw the square.
  square(25, 25, 50);
}
</code>
</div>

<div>
<code>
// Click on the canvas to begin detecting key presses.

function setup() {
  createCanvas(100, 100);

  describe(
    'A gray square with a white square at its center. The white square turns black when the user presses a key.'
  );
}

function draw() {
  background(200);

  // Style the square.
  if (keyIsPressed) {
    fill(0);
  } else {
    fill(255);
  }

  // Draw the square.
  square(25, 25, 50);
}
</code>
</div>

<div>
<code>
// Click on the canvas to begin detecting key presses.

function setup() {
  createCanvas(100, 100);

  describe(
    'A gray square with the word "false" at its center. The word switches to "true" when the user presses a key.'
  );
}

function draw() {
  background(200);

  // Style the text.
  textAlign(CENTER);
  textSize(16);

  // Display the value of keyIsPressed.
  text(keyIsPressed, 50, 50);
}
</code>
</div>

---

## Variable : key
A `String` system variable that contains the value of the last key typed.

The key variable is helpful for checking whether an
<a href="https://en.wikipedia.org/wiki/ASCII#Printable_characters" target="_blank">ASCII</a>
key has been typed. For example, the expression `key === "a"` evaluates to
`true` if the `a` key was typed and `false` if not. `key` doesn’t update
for special keys such as `LEFT_ARROW` and `ENTER`. Use keyCode instead for
special keys. The <a href="#/p5/keyIsDown">keyIsDown()</a> function should
be used to check for multiple different key presses at the same time.

@property {String} key
@readOnly

### Exemple
<div>
<code>
// Click on the canvas to begin detecting key presses.

function setup() {
  createCanvas(100, 100);

  describe(
    'A gray square. The last key pressed is displayed at the center.'
  );
}

function draw() {
  background(200);

  // Style the text.
  textAlign(CENTER);
  textSize(16);

  // Display the last key pressed.
  text(key, 50, 50);
}
</code>
</div>

<div>
<code>
// Click on the canvas to begin detecting key presses.

let x = 50;
let y = 50;

function setup() {
  createCanvas(100, 100);

  background(200);

  describe(
    'A gray square with a black circle at its center. The circle moves when the user presses the keys "w", "a", "s", or "d". It leaves a trail as it moves.'
  );
}

function draw() {
  // Update x and y if a key is pressed.
  if (keyIsPressed === true) {
    if (key === 'w') {
      y -= 1;
    } else if (key === 's') {
      y += 1;
    } else if (key === 'a') {
      x -= 1;
    } else if (key === 'd') {
      x += 1;
    }
  }

  // Style the circle.
  fill(0);

  // Draw the circle at (x, y).
  circle(x, y, 5);
}
</code>
</div>

---

## Variable : keyCode
A `Number` system variable that contains the code of the last key typed.

All keys have a `keyCode`. For example, the `a` key has the `keyCode` 65.
The `keyCode` variable is helpful for checking whether a special key has
been typed. For example, the following conditional checks whether the enter
key has been typed:

```js
if (keyCode === 13) {
  // Code to run if the enter key was pressed.
}
```

The same code can be written more clearly using the system variable `ENTER`
which has a value of 13:

```js
if (keyCode === ENTER) {
  // Code to run if the enter key was pressed.
}
```

The system variables `BACKSPACE`, `DELETE`, `ENTER`, `RETURN`, `TAB`,
`ESCAPE`, `SHIFT`, `CONTROL`, `OPTION`, `ALT`, `UP_ARROW`, `DOWN_ARROW`,
`LEFT_ARROW`, and `RIGHT_ARROW` are all helpful shorthands the key codes of
special keys. Key codes can be found on websites such as
<a href="http://keycode.info/">keycode.info</a>.

@property {Integer} keyCode
@readOnly

### Exemple
<div>
<code>
// Click on the canvas to begin detecting key presses.

function setup() {
  createCanvas(100, 100);

  describe(
    'A gray square. The last key pressed and its code are displayed at the center.'
  );
}

function draw() {
  background(200);

  // Style the text.
  textAlign(CENTER);
  textSize(16);

  // Display the last key pressed and its code.
  text(`${key} : ${keyCode}`, 50, 50);
}
</code>
</div>

<div>
<code>
// Click on the canvas to begin detecting key presses.

let x = 50;
let y = 50;

function setup() {
  createCanvas(100, 100);

  background(200);

  describe(
    'A gray square with a black circle at its center. The circle moves when the user presses an arrow key. It leaves a trail as it moves.'
  );
}

function draw() {
  // Update x and y if an arrow key is pressed.
  if (keyIsPressed === true) {
    if (keyCode === UP_ARROW) {
      y -= 1;
    } else if (keyCode === DOWN_ARROW) {
      y += 1;
    } else if (keyCode === LEFT_ARROW) {
      x -= 1;
    } else if (keyCode === RIGHT_ARROW) {
      x += 1;
    }
  }

  // Style the circle.
  fill(0);

  // Draw the circle at (x, y).
  circle(x, y, 5);
}
</code>
</div>

---

## Fonction : keyPressed()
A function that's called once when any key is pressed.

Declaring the function `keyPressed()` sets a code block to run once
automatically when the user presses any key:

```js
function keyPressed() {
  // Code to run.
}
```

The <a href="#/p5/key">key</a> and <a href="#/p5/keyCode">keyCode</a>
variables will be updated with the most recently typed value when
`keyPressed()` is called by p5.js:

```js
function keyPressed() {
  if (key === 'c') {
    // Code to run.
  }

  if (keyCode === ENTER) {
    // Code to run.
  }
}
```

The parameter, `event`, is optional. `keyPressed()` is always passed a
<a href="https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent" target="_blank">KeyboardEvent</a>
object with properties that describe the key press event:

```js
function keyPressed(event) {
  // Code to run that uses the event.
  console.log(event);
}
```

Browsers may have default behaviors attached to various key events. For
example, some browsers jump to the bottom of a web page when the
`SPACE` key is pressed. To prevent any default behavior for this event, add
`return false;` to the end of the function.

@method keyPressed
@param  {KeyboardEvent} [event] optional `KeyboardEvent` callback argument.

### Exemple
<div>
<code>
// Click on the canvas to begin detecting key presses.

let value = 0;

function setup() {
  createCanvas(100, 100);

  describe(
    'A gray square with a black square at its center. The inner square changes color when the user presses a key.'
  );
}

function draw() {
  background(200);

  // Style the square.
  fill(value);

  // Draw the square.
  square(25, 25, 50);
}

// Toggle the background color when the user presses a key.
function keyPressed() {
  if (value === 0) {
    value = 255;
  } else {
    value = 0;
  }
  // Uncomment to prevent any default behavior.
  // return false;
}
</code>
</div>

<div>
<code>
// Click on the canvas to begin detecting key presses.

let value = 0;

function setup() {
  createCanvas(100, 100);

  describe(
    'A gray square with a white square at its center. The inner square turns black when the user presses the "b" key. It turns white when the user presses the "a" key.'
  );
}

function draw() {
  background(200);

  // Style the square.
  fill(value);

  // Draw the square.
  square(25, 25, 50);
}

// Reassign value when the user presses the 'a' or 'b' key.
function keyPressed() {
  if (key === 'a') {
    value = 255;
  } else if (key === 'b') {
    value = 0;
  }
  // Uncomment to prevent any default behavior.
  // return false;
}
</code>
</div>

<div>
<code>
// Click on the canvas to begin detecting key presses.

let value = 0;

function setup() {
  createCanvas(100, 100);

  describe(
    'A gray square with a black square at its center. The inner square turns white when the user presses the left arrow key. It turns black when the user presses the right arrow key.'
  );
}

function draw() {
  background(200);

  // Style the square.
  fill(value);

  // Draw the square.
  square(25, 25, 50);
}

// Toggle the background color when the user presses an arrow key.
function keyPressed() {
  if (keyCode === LEFT_ARROW) {
    value = 255;
  } else if (keyCode === RIGHT_ARROW) {
    value = 0;
  }
  // Uncomment to prevent any default behavior.
  // return false;
}
</code>
</div>

---

## Fonction : keyReleased()
A function that's called once when any key is released.

Declaring the function `keyReleased()` sets a code block to run once
automatically when the user releases any key:

```js
function keyReleased() {
  // Code to run.
}
```

The <a href="#/p5/key">key</a> and <a href="#/p5/keyCode">keyCode</a>
variables will be updated with the most recently released value when
`keyReleased()` is called by p5.js:

```js
function keyReleased() {
  if (key === 'c') {
    // Code to run.
  }

  if (keyCode === ENTER) {
    // Code to run.
  }
}
```

The parameter, `event`, is optional. `keyReleased()` is always passed a
<a href="https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent" target="_blank">KeyboardEvent</a>
object with properties that describe the key press event:

```js
function keyReleased(event) {
  // Code to run that uses the event.
  console.log(event);
}
```

Browsers may have default behaviors attached to various key events. To
prevent any default behavior for this event, add `return false;` to the end
of the function.

@method keyReleased
@param  {KeyboardEvent} [event] optional `KeyboardEvent` callback argument.

### Exemple
<div>
<code>
// Click on the canvas to begin detecting key presses.

let value = 0;

function setup() {
  createCanvas(100, 100);

  describe(
    'A gray square with a black square at its center. The inner square changes color when the user releases a key.'
  );
}

function draw() {
  background(200);

  // Style the square.
  fill(value);

  // Draw the square.
  square(25, 25, 50);
}

// Toggle value when the user releases a key.
function keyReleased() {
  if (value === 0) {
    value = 255;
  } else {
    value = 0;
  }
  // Uncomment to prevent any default behavior.
  // return false;
}
</code>
</div>

<div>
<code>
// Click on the canvas to begin detecting key presses.

let value = 0;

function setup() {
  createCanvas(100, 100);

  describe(
    'A gray square with a black square at its center. The inner square becomes white when the user releases the "w" key.'
  );
}

function draw() {
  background(200);

  // Style the square.
  fill(value);

  // Draw the square.
  square(25, 25, 50);
}

// Set value to 255 the user releases the 'w' key.
function keyReleased() {
  if (key === 'w') {
    value = 255;
  }
  // Uncomment to prevent any default behavior.
  // return false;
}
</code>
</div>

<div>
<code>
// Click on the canvas to begin detecting key presses.

let value = 0;

function setup() {
  createCanvas(100, 100);

  describe(
    'A gray square with a black square at its center. The inner square turns white when the user presses and releases the left arrow key. It turns black when the user presses and releases the right arrow key.'
  );
}

function draw() {
  background(200);

  // Style the square.
  fill(value);

  // Draw the square.
  square(25, 25, 50);
}

// Toggle the background color when the user releases an arrow key.
function keyReleased() {
  if (keyCode === LEFT_ARROW) {
    value = 255;
  } else if (keyCode === RIGHT_ARROW) {
    value = 0;
  }
  // Uncomment to prevent any default behavior.
  // return false;
}
</code>
</div>

---

## Fonction : keyTyped()
A function that's called once when keys with printable characters are pressed.

Declaring the function `keyTyped()` sets a code block to run once
automatically when the user presses any key with a printable character such
as `a` or 1. Modifier keys such as `SHIFT`, `CONTROL`, and the arrow keys
will be ignored:

```js
function keyTyped() {
  // Code to run.
}
```

The <a href="#/p5/key">key</a> and <a href="#/p5/keyCode">keyCode</a>
variables will be updated with the most recently released value when
`keyTyped()` is called by p5.js:

```js
function keyTyped() {
  // Check for the "c" character using key.
  if (key === 'c') {
    // Code to run.
  }

  // Check for "c" using keyCode.
  if (keyCode === 67) {
    // Code to run.
  }
}
```

The parameter, `event`, is optional. `keyTyped()` is always passed a
<a href="https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent" target="_blank">KeyboardEvent</a>
object with properties that describe the key press event:

```js
function keyReleased(event) {
  // Code to run that uses the event.
  console.log(event);
}
```

Note: Use the <a href="#/p5/keyPressed">keyPressed()</a> function and
<a href="#/p5/keyCode">keyCode</a> system variable to respond to modifier
keys such as `ALT`.

Browsers may have default behaviors attached to various key events. To
prevent any default behavior for this event, add `return false;` to the end
of the function.

@method keyTyped
@param  {KeyboardEvent} [event] optional `KeyboardEvent` callback argument.

### Exemple
<div>
<code>
// Click on the canvas to begin detecting key presses.
// Note: Pressing special keys such as SPACE have no effect.

let value = 0;

function setup() {
  createCanvas(100, 100);

  describe(
    'A gray square with a white square at its center. The inner square changes color when the user presses a key.'
  );
}

function draw() {
  background(200);

  // Style the square.
  fill(value);

  // Draw the square.
  square(25, 25, 50);
}

// Toggle the square's color when the user types a printable key.
function keyTyped() {
  if (value === 0) {
    value = 255;
  } else {
    value = 0;
  }
  // Uncomment to prevent any default behavior.
  // return false;
}
</code>
</div>

<div>
<code>
// Click on the canvas to begin detecting key presses.

let value = 0;

function setup() {
  createCanvas(100, 100);

  describe(
    'A gray square with a white square at its center. The inner square turns black when the user types the "b" key. It turns white when the user types the "a" key.'
  );
}

function draw() {
  background(200);

  // Style the square.
  fill(value);

  // Draw the square.
  square(25, 25, 50);
}

// Reassign value when the user types the 'a' or 'b' key.
function keyTyped() {
  if (key === 'a') {
    value = 255;
  } else if (key === 'b') {
    value = 0;
  }
  // Uncomment to prevent any default behavior.
  // return false;
}
</code>
</div>

---

## Fonction : keyIsDown(code)
Returns `true` if the key it’s checking is pressed and `false` if not.

`keyIsDown()` is helpful when checking for multiple different key presses.
For example, `keyIsDown()` can be used to check if both `LEFT_ARROW` and
`UP_ARROW` are pressed:

```js
if (keyIsDown(LEFT_ARROW) && keyIsDown(UP_ARROW)) {
  // Move diagonally.
}
```

`keyIsDown()` can check for key presses using
<a href="#/p5/keyCode">keyCode</a> values, as in `keyIsDown(37)` or
`keyIsDown(LEFT_ARROW)`. Key codes can be found on websites such as
<a href="https://keycode.info" target="_blank">keycode.info</a>.

@method keyIsDown
@param {Number}          code key to check.
@return {Boolean}        whether the key is down or not.

### Exemple
<div>
<code>
// Click on the canvas to begin detecting key presses.

let x = 50;
let y = 50;

function setup() {
  createCanvas(100, 100);

  background(200);

  describe(
    'A gray square with a black circle at its center. The circle moves when the user presses an arrow key. It leaves a trail as it moves.'
  );
}

function draw() {
  // Update x and y if an arrow key is pressed.
  if (keyIsDown(LEFT_ARROW) === true) {
    x -= 1;
  }

  if (keyIsDown(RIGHT_ARROW) === true) {
    x += 1;
  }

  if (keyIsDown(UP_ARROW) === true) {
    y -= 1;
  }

  if (keyIsDown(DOWN_ARROW) === true) {
    y += 1;
  }

  // Style the circle.
  fill(0);

  // Draw the circle.
  circle(x, y, 5);
}
</code>
</div>

<div>
<code>
// Click on the canvas to begin detecting key presses.

let x = 50;
let y = 50;

function setup() {
  createCanvas(100, 100);

  background(200);

  describe(
    'A gray square with a black circle at its center. The circle moves when the user presses an arrow key. It leaves a trail as it moves.'
  );
}

function draw() {
  // Update x and y if an arrow key is pressed.
  if (keyIsDown(37) === true) {
    x -= 1;
  }

  if (keyIsDown(39) === true) {
    x += 1;
  }

  if (keyIsDown(38) === true) {
    y -= 1;
  }

  if (keyIsDown(40) === true) {
    y += 1;
  }

  // Style the circle.
  fill(0);

  // Draw the circle.
  circle(x, y, 5);
}
</code>
</div>

---

## Variable : touches
An `Array` of all the current touch points on a touchscreen device.

The `touches` array is empty by default. When the user touches their
screen, a new touch point is tracked and added to the array. Touch points
are `Objects` with the following properties:

```js
// Iterate over the touches array.
for (let touch of touches) {
  // x-coordinate relative to the top-left
  // corner of the canvas.
  console.log(touch.x);

  // y-coordinate relative to the top-left
  // corner of the canvas.
  console.log(touch.y);

  // x-coordinate relative to the top-left
  // corner of the browser.
  console.log(touch.winX);

  // y-coordinate relative to the top-left
  // corner of the browser.
  console.log(touch.winY);

  // ID number
  console.log(touch.id);
}
```

@property {Object[]} touches
@readOnly

### Exemple
<div>
<code>
// On a touchscreen device, touch the canvas using one or more fingers
// at the same time.

function setup() {
  createCanvas(100, 100);

  describe(
    'A gray square. White circles appear where the user touches the square.'
  );
}

function draw() {
  background(200);

  // Draw a circle at each touch point.
  for (let touch of touches) {
    circle(touch.x, touch.y, 40);
  }
}
</code>
</div>

<div>
<code>
// On a touchscreen device, touch the canvas using one or more fingers
// at the same time.

function setup() {
  createCanvas(100, 100);

  describe(
    'A gray square. Labels appear where the user touches the square, displaying the coordinates.'
  );
}

function draw() {
  background(200);

  // Draw a label above each touch point.
  for (let touch of touches) {
    text(`${touch.x}, ${touch.y}`, touch.x, touch.y - 40);
  }
}
</code>
</div>

---

## Fonction : touchStarted()
A function that's called once each time the user touches the screen.

Declaring a function called `touchStarted()` sets a code block to run
automatically each time the user begins touching a touchscreen device:

```js
function touchStarted() {
  // Code to run.
}
```

The <a href="#/p5/touches">touches</a> array will be updated with the most
recent touch points when `touchStarted()` is called by p5.js:

```js
function touchStarted() {
  // Paint over the background.
  background(200);

  // Mark each touch point once with a circle.
  for (let touch of touches) {
    circle(touch.x, touch.y, 40);
  }
}
```

The parameter, event, is optional. `touchStarted()` will be passed a
<a href="https://developer.mozilla.org/en-US/docs/Web/API/TouchEvent" target="_blank">TouchEvent</a>
object with properties that describe the touch event:

```js
function touchStarted(event) {
  // Code to run that uses the event.
  console.log(event);
}
```

On touchscreen devices, <a href="#/p5/mousePressed">mousePressed()</a> will
run when a user’s touch starts if `touchStarted()` isn’t declared. If
`touchStarted()` is declared, then `touchStarted()` will run when a user’s
touch starts and <a href="#/p5/mousePressed">mousePressed()</a> won’t.

Note: `touchStarted()`, <a href="#/p5/touchEnded">touchEnded()</a>, and
<a href="#/p5/touchMoved">touchMoved()</a> are all related.
`touchStarted()` runs as soon as the user touches a touchscreen device.
<a href="#/p5/touchEnded">touchEnded()</a> runs as soon as the user ends a
touch. <a href="#/p5/touchMoved">touchMoved()</a> runs repeatedly as the
user moves any touch points.

@method touchStarted
@param  {TouchEvent} [event] optional `TouchEvent` argument.

### Exemple
<div>
<code>
// On a touchscreen device, touch the canvas using one or more fingers
// at the same time.

let value = 0;

function setup() {
  createCanvas(100, 100);

  describe(
    'A gray square with a black square at its center. The inner square switches color between black and white each time the user touches the screen.'
  );
}

function draw() {
  background(200);

  // Style the square.
  fill(value);

  // Draw the square.
  square(25, 25, 50);
}

// Toggle colors with each touch.
function touchStarted() {
  value = value === 0 ? 255 : 0;
}
</code>
</div>

<div>
<code>
// On a touchscreen device, touch the canvas using one or more fingers
// at the same time.

let bgColor = 50;
let fillColor = 255;
let borderWidth = 0.5;

function setup() {
  createCanvas(100, 100);

  describe(
    'A gray square with the number 0 at the top-center. The number tracks the number of places the user is touching the screen. Circles appear at each touch point and change style in response to events.'
  );
}

function draw() {
  background(bgColor);

  // Style the text.
  textAlign(CENTER);
  textSize(16);
  fill(0);
  noStroke();

  // Display the number of touch points.
  text(touches.length, 50, 20);

  // Style the touch points.
  fill(fillColor);
  stroke(0);
  strokeWeight(borderWidth);

  // Display the touch points as circles.
  for (let touch of touches) {
    circle(touch.x, touch.y, 40);
  }
}

// Set the background color to a random grayscale value.
function touchStarted() {
  bgColor = random(80, 255);
}

// Set the fill color to a random grayscale value.
function touchEnded() {
  fillColor = random(0, 255);
}

// Set the stroke weight.
function touchMoved() {
  // Increment the border width.
  borderWidth += 0.1;

  // Reset the border width once it's too thick.
  if (borderWidth > 20) {
    borderWidth = 0.5;
  }
}
</code>
</div>

---

## Fonction : touchMoved()
A function that's called when the user touches the screen and moves.

Declaring the function `touchMoved()` sets a code block to run
automatically when the user touches a touchscreen device and moves:

```js
function touchMoved() {
  // Code to run.
}
```

The <a href="#/p5/touches">touches</a> array will be updated with the most
recent touch points when `touchMoved()` is called by p5.js:

```js
function touchMoved() {
  // Paint over the background.
  background(200);

  // Mark each touch point while the user moves.
  for (let touch of touches) {
    circle(touch.x, touch.y, 40);
  }
}
```

The parameter, event, is optional. `touchMoved()` will be passed a
<a href="https://developer.mozilla.org/en-US/docs/Web/API/TouchEvent" target="_blank">TouchEvent</a>
object with properties that describe the touch event:

```js
function touchMoved(event) {
  // Code to run that uses the event.
  console.log(event);
}
```

On touchscreen devices, <a href="#/p5/mouseDragged">mouseDragged()</a> will
run when the user’s touch points move if `touchMoved()` isn’t declared. If
`touchMoved()` is declared, then `touchMoved()` will run when a user’s
touch points move and <a href="#/p5/mouseDragged">mouseDragged()</a> won’t.

Note: <a href="#/p5/touchStarted">touchStarted()</a>,
<a href="#/p5/touchEnded">touchEnded()</a>, and
`touchMoved()` are all related.
<a href="#/p5/touchStarted">touchStarted()</a> runs as soon as the user
touches a touchscreen device. <a href="#/p5/touchEnded">touchEnded()</a>
runs as soon as the user ends a touch. `touchMoved()` runs repeatedly as
the user moves any touch points.

@method touchMoved
@param  {TouchEvent} [event] optional TouchEvent argument.

### Exemple
<div>
<code>
// On a touchscreen device, touch the canvas using one or more fingers
// at the same time.

let value = 0;

function setup() {
  createCanvas(100, 100);

  describe(
    'A gray square with a black square at its center. The inner square becomes lighter when the user touches the screen and moves.'
  );
}

function draw() {
  background(200);

  // Style the square.
  fill(value);

  // Draw the square.
  square(25, 25, 50);
}

function touchMoved() {
  // Update the grayscale value.
  value += 5;

  // Reset the grayscale value.
  if (value > 255) {
    value = 0;
  }
}
</code>
</div>

<div>
<code>
// On a touchscreen device, touch the canvas using one or more fingers
// at the same time.

let bgColor = 50;
let fillColor = 255;
let borderWidth = 0.5;

function setup() {
  createCanvas(100, 100);

  describe(
    'A gray square with the number 0 at the top-center. The number tracks the number of places the user is touching the screen. Circles appear at each touch point and change style in response to events.'
  );
}

function draw() {
  background(bgColor);

  // Style the text.
  textAlign(CENTER);
  textSize(16);
  fill(0);
  noStroke();

  // Display the number of touch points.
  text(touches.length, 50, 20);

  // Style the touch points.
  fill(fillColor);
  stroke(0);
  strokeWeight(borderWidth);

  // Display the touch points as circles.
  for (let touch of touches) {
    circle(touch.x, touch.y, 40);
  }
}

// Set the background color to a random grayscale value.
function touchStarted() {
  bgColor = random(80, 255);
}

// Set the fill color to a random grayscale value.
function touchEnded() {
  fillColor = random(0, 255);
}

// Set the stroke weight.
function touchMoved() {
  // Increment the border width.
  borderWidth += 0.1;

  // Reset the border width once it's too thick.
  if (borderWidth > 20) {
    borderWidth = 0.5;
  }
}
</code>
</div>

---

## Fonction : touchEnded()
A function that's called once each time a screen touch ends.

Declaring the function `touchEnded()` sets a code block to run
automatically when the user stops touching a touchscreen device:

```js
function touchEnded() {
  // Code to run.
}
```

The <a href="#/p5/touches">touches</a> array will be updated with the most
recent touch points when `touchEnded()` is called by p5.js:

```js
function touchEnded() {
  // Paint over the background.
  background(200);

  // Mark each remaining touch point when the user stops
  // a touch.
  for (let touch of touches) {
    circle(touch.x, touch.y, 40);
  }
}
```

The parameter, event, is optional. `touchEnded()` will be passed a
<a href="https://developer.mozilla.org/en-US/docs/Web/API/TouchEvent" target="_blank">TouchEvent</a>
object with properties that describe the touch event:

```js
function touchEnded(event) {
  // Code to run that uses the event.
  console.log(event);
}
```

On touchscreen devices, <a href="#/p5/mouseReleased">mouseReleased()</a> will
run when the user’s touch ends if `touchEnded()` isn’t declared. If
`touchEnded()` is declared, then `touchEnded()` will run when a user’s
touch ends and <a href="#/p5/mouseReleased">mouseReleased()</a> won’t.

Note: <a href="#/p5/touchStarted">touchStarted()</a>,
`touchEnded()`, and <a href="#/p5/touchMoved">touchMoved()</a> are all
related. <a href="#/p5/touchStarted">touchStarted()</a> runs as soon as the
user touches a touchscreen device. `touchEnded()` runs as soon as the user
ends a touch. <a href="#/p5/touchMoved">touchMoved()</a> runs repeatedly as
the user moves any touch points.

@method touchEnded
@param  {TouchEvent} [event] optional `TouchEvent` argument.

### Exemple
<div>
<code>
// On a touchscreen device, touch the canvas using one or plus fingers
// at the same time.

let value = 0;

function setup() {
  createCanvas(100, 100);

  describe(
    'A gray square with a black square at its center. The inner square switches color between black and white each time the user stops touching the screen.'
  );
}

function draw() {
  background(200);

  // Style the square.
  fill(value);

  // Draw the square.
  square(25, 25, 50);
}

// Toggle colors when a touch ends.
function touchEnded() {
  value = value === 0 ? 255 : 0;
}
</code>
</div>

<div>
<code>
// On a touchscreen device, touch the canvas using one or more fingers
// at the same time.

let bgColor = 50;
let fillColor = 255;
let borderWidth = 0.5;

function setup() {
  createCanvas(100, 100);

  describe(
    'A gray square with the number 0 at the top-center. The number tracks the number of places the user is touching the screen. Circles appear at each touch point and change style in response to events.'
  );
}

function draw() {
  background(bgColor);

  // Style the text.
  textAlign(CENTER);
  textSize(16);
  fill(0);
  noStroke();

  // Display the number of touch points.
  text(touches.length, 50, 20);

  // Style the touch points.
  fill(fillColor);
  stroke(0);
  strokeWeight(borderWidth);

  // Display the touch points as circles.
  for (let touch of touches) {
    circle(touch.x, touch.y, 40);
  }
}

// Set the background color to a random grayscale value.
function touchStarted() {
  bgColor = random(80, 255);
}

// Set the fill color to a random grayscale value.
function touchEnded() {
  fillColor = random(0, 255);
}

// Set the stroke weight.
function touchMoved() {
  // Increment the border width.
  borderWidth += 0.1;

  // Reset the border width once it's too thick.
  if (borderWidth > 20) {
    borderWidth = 0.5;
  }
}
</code>
</div>

---

## Variable : deviceOrientation
The system variable deviceOrientation always contains the orientation of
the device. The value of this variable will either be set 'landscape'
or 'portrait'. If no data is available it will be set to 'undefined'.
either LANDSCAPE or PORTRAIT.

@property {Constant} deviceOrientation
@readOnly

---

## Fonction : setMoveThreshold(value)
The <a href="#/p5/setMoveThreshold">setMoveThreshold()</a> function is used to set the movement threshold for
the <a href="#/p5/deviceMoved">deviceMoved()</a> function. The default threshold is set to 0.5.

@method setMoveThreshold
@param {number} value The threshold value
@example
<div class="norender">
<code>
// Run this example on a mobile device
// You will need to move the device incrementally further
// the closer the square's color gets to white in order to change the value.

let value = 0;
let threshold = 0.5;
function setup() {
  setMoveThreshold(threshold);
}
function draw() {
  fill(value);
  rect(25, 25, 50, 50);
  describe(`50-by-50 black rect in center of canvas.
    turns white on mobile when device moves`);
}
function deviceMoved() {
  value = value + 5;
  threshold = threshold + 0.1;
  if (value > 255) {
    value = 0;
    threshold = 30;
  }
  setMoveThreshold(threshold);
}
</code>
</div>

---

## Fonction : setShakeThreshold(value)
The <a href="#/p5/setShakeThreshold">setShakeThreshold()</a> function is used to set the movement threshold for
the <a href="#/p5/deviceShaken">deviceShaken()</a> function. The default threshold is set to 30.

@method setShakeThreshold
@param {number} value The threshold value
@example
<div class="norender">
<code>
// Run this example on a mobile device
// You will need to shake the device more firmly
// the closer the box's fill gets to white in order to change the value.

let value = 0;
let threshold = 30;
function setup() {
  setShakeThreshold(threshold);
}
function draw() {
  fill(value);
  rect(25, 25, 50, 50);
  describe(`50-by-50 black rect in center of canvas.
    turns white on mobile when device is being shaked`);
}
function deviceMoved() {
  value = value + 5;
  threshold = threshold + 5;
  if (value > 255) {
    value = 0;
    threshold = 30;
  }
  setShakeThreshold(threshold);
}
</code>
</div>

---

## Fonction : deviceMoved()
The <a href="#/p5/deviceMoved">deviceMoved()</a> function is called when the device is moved by more than
the threshold value along X, Y or Z axis. The default threshold is set to 0.5.
The threshold value can be changed using <a href="#/p5/setMoveThreshold">setMoveThreshold()</a>.

@method deviceMoved
@example
<div class="norender">
<code>
// Run this example on a mobile device
// Move the device around
// to change the value.

let value = 0;
function draw() {
  fill(value);
  rect(25, 25, 50, 50);
  describe(`50-by-50 black rect in center of canvas.
    turns white on mobile when device moves`);
}
function deviceMoved() {
  value = value + 5;
  if (value > 255) {
    value = 0;
  }
}
</code>
</div>

---

## Fonction : deviceTurned()
The <a href="#/p5/deviceTurned">deviceTurned()</a> function is called when the device rotates by
more than 90 degrees continuously.

The axis that triggers the <a href="#/p5/deviceTurned">deviceTurned()</a> method is stored in the turnAxis
variable. The <a href="#/p5/deviceTurned">deviceTurned()</a> method can be locked to trigger on any axis:
X, Y or Z by comparing the turnAxis variable to 'X', 'Y' or 'Z'.

@method deviceTurned
@example
<div class="norender">
<code>
// Run this example on a mobile device
// Rotate the device by 90 degrees
// to change the value.

let value = 0;
function draw() {
  fill(value);
  rect(25, 25, 50, 50);
  describe(`50-by-50 black rect in center of canvas.
    turns white on mobile when device turns`);
}
function deviceTurned() {
  if (value === 0) {
    value = 255;
  } else if (value === 255) {
    value = 0;
  }
}
</code>
</div>
<div>
<code>
// Run this example on a mobile device
// Rotate the device by 90 degrees in the
// X-axis to change the value.

let value = 0;
function draw() {
  fill(value);
  rect(25, 25, 50, 50);
  describe(`50-by-50 black rect in center of canvas.
    turns white on mobile when x-axis turns`);
}
function deviceTurned() {
  if (turnAxis === 'X') {
    if (value === 0) {
      value = 255;
    } else if (value === 255) {
      value = 0;
    }
  }
}
</code>
</div>

---

## Fonction : deviceShaken()
The <a href="#/p5/deviceShaken">deviceShaken()</a> function is called when the device total acceleration
changes of accelerationX and accelerationY values is more than
the threshold value. The default threshold is set to 30.
The threshold value can be changed using <a href="#/p5/setShakeThreshold">setShakeThreshold()</a>.

@method deviceShaken
@example
<div class="norender">
<code>
// Run this example on a mobile device
// Shake the device to change the value.

let value = 0;
function draw() {
  fill(value);
  rect(25, 25, 50, 50);
  describe(`50-by-50 black rect in center of canvas.
    turns white on mobile when device shakes`);
}
function deviceShaken() {
  value = value + 5;
  if (value > 255) {
    value = 0;
  }
}
</code>
</div>