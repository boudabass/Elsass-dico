# Référence API : Manipulation du DOM

## Fonction : select(selectors, [container])
Searches the page for the first element that matches the given
<a href="https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/CSS_basics#different_types_of_selectors" target="_blank">CSS selector string</a>.

The selector string can be an ID, class, tag name, or a combination.
`select()` returns a <a href="#/p5.Element">p5.Element</a> object if it
finds a match and `null` if not.

The second parameter, `container`, is optional. It specifies a container to
search within. `container` can be CSS selector string, a
<a href="#/p5.Element">p5.Element</a> object, or an
<a href="https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement" target="_blank">HTMLElement</a> object.

@method select
@param  {String} selectors CSS selector string of element to search for.
@param  {String|p5.Element|HTMLElement} [container] CSS selector string, <a href="#/p5.Element">p5.Element</a>, or
                                             <a href="https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement" target="_blank">HTMLElement</a> to search within.
@return {p5.Element|null} <a href="#/p5.Element">p5.Element</a> containing the element.

---

## Fonction : selectAll(selectors, [container])
Searches the page for all elements that matches the given
<a href="https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/CSS_basics#different_types_of_selectors" target="_blank">CSS selector string</a>.

The selector string can be an ID, class, tag name, or a combination.
`selectAll()` returns an array of <a href="#/p5.Element">p5.Element</a>
objects if it finds any matches and an empty array if none are found.

The second parameter, `container`, is optional. It specifies a container to
search within. `container` can be CSS selector string, a
<a href="#/p5.Element">p5.Element</a> object, or an
<a href="https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement" target="_blank">HTMLElement</a> object.

@method selectAll
@param  {String} selectors CSS selector string of element to search for.
@param  {String|p5.Element|HTMLElement} [container] CSS selector string, <a href="#/p5.Element">p5.Element</a>, or
                                             <a href="https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement" target="_blank">HTMLElement</a> to search within.
@return {p5.Element[]} array of <a href="#/p5.Element">p5.Element</a>s containing any elements found.

---

## Fonction : removeElements()
Removes all elements created by p5.js, including any event handlers.

There are two exceptions:
canvas elements created by <a href="#/p5/createCanvas">createCanvas()</a>
and <a href="#/p5.Renderer">p5.Render</a> objects created by
<a href="#/p5/createGraphics">createGraphics()</a>.

@method removeElements

---

## Méthode : p5.Element.changed(fxn)
Calls a function when the element changes.

Calling `myElement.changed(false)` disables the function.

@method changed
@param  {Function|Boolean} fxn function to call when the element changes.
                                `false` disables the function.
@chainable
@for p5.Element

---

## Méthode : p5.Element.input(fxn)
Calls a function when the element receives input.

`myElement.input()` is often used to with text inputs and sliders. Calling
`myElement.input(false)` disables the function.

@method input
@param  {Function|Boolean} fxn function to call when input is detected within
                                the element.
                                `false` disables the function.
@chainable
@for p5.Element

---

## Fonction : createDiv([html])
Creates a `&lt;div&gt;&lt;/div&gt;` element.

`&lt;div&gt;&lt;/div&gt;` elements are commonly used as containers for
other elements.

The parameter `html` is optional. It accepts a string that sets the
inner HTML of the new `&lt;div&gt;&lt;/div&gt;`.

@method createDiv
@param  {String} [html] inner HTML for the new `&lt;div&gt;&lt;/div&gt;` element.
@return {p5.Element} new <a href="#/p5.Element">p5.Element</a> object.

---

## Fonction : createP([html])
Creates a paragraph element.

`&lt;p&gt;&lt;/p&gt;` elements are commonly used for paragraph-length text.

The parameter `html` is optional. It accepts a string that sets the
inner HTML of the new `&lt;p&gt;&lt;/p&gt;`.

@method createP
@param  {String} [html] inner HTML for the new `&lt;p&gt;&lt;/p&gt;` element.
@return {p5.Element} new <a href="#/p5.Element">p5.Element</a> object.

---

## Fonction : createSpan([html])
Creates a `&lt;span&gt;&lt;/span&gt;` element.

`&lt;span&gt;&lt;/span&gt;` elements are commonly used as containers
for inline elements. For example, a `&lt;span&gt;&lt;/span&gt;`
can hold part of a sentence that's a
<span style="color: deeppink;">different</span> style.

The parameter `html` is optional. It accepts a string that sets the
inner HTML of the new `&lt;span&gt;&lt;/span&gt;`.

@method createSpan
@param  {String} [html] inner HTML for the new `&lt;span&gt;&lt;/span&gt;` element.
@return {p5.Element} new <a href="#/p5.Element">p5.Element</a> object.

---

## Fonction : createImg(src, alt, [crossOrigin], [successCallback])
Creates an `&lt;img&gt;` element that can appear outside of the canvas.

The first parameter, `src`, is a string with the path to the image file.
`src` should be a relative path, as in `'assets/image.png'`, or a URL, as
in `'https://example.com/image.png'`.

The second parameter, `alt`, is a string with the
<a href="https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/alt#usage_notes" target="_blank">alternate text</a>
for the image. An empty string `''` can be used for images that aren't displayed.

The third parameter, `crossOrigin`, is optional. It's a string that sets the
<a href="https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_settings_attributes" target="_blank">crossOrigin property</a>
of the image. Use `'anonymous'` or `'use-credentials'` to fetch the image
with cross-origin access.

The fourth parameter, `callback`, is also optional. It sets a function to
call after the image loads. The new image is passed to the callback
function as a <a href="#/p5.Element">p5.Element</a> object.

@method createImg
@param  {String} src relative path or URL for the image.
@param  {String} alt alternate text for the image.
@param  {String} [crossOrigin] crossOrigin property to use when fetching the image.
@param  {Function} [successCallback] function to call once the image loads. The new image will be passed
                                      to the function as a <a href="#/p5.Element">p5.Element</a> object.
@return {p5.Element} new <a href="#/p5.Element">p5.Element</a> object.

---

## Fonction : createA(href, html, [target])
Creates an `&lt;a&gt;&lt;/a&gt;` element that links to another web page.

The first parmeter, `href`, is a string that sets the URL of the linked
page.

The second parameter, `html`, is a string that sets the inner HTML of the
link. It's common to use text, images, or buttons as links.

The third parameter, `target`, is optional. It's a string that tells the
web browser where to open the link. By default, links open in the current
browser tab. Passing `'_blank'` will cause the link to open in a new
browser tab. MDN describes a few
<a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#target" target="_blank">other options</a>.

@method createA
@param  {String} href       URL of linked page.
@param  {String} html       inner HTML of link element to display.
@param  {String} [target]   target where the new link should open,
                             either `'_blank'`, `'_self'`, `'_parent'`, or `'_top'`.
@return {p5.Element} new <a href="#/p5.Element">p5.Element</a> object.

---

## Fonction : createSlider(min, max, [value], [step])
Creates a slider `&lt;input&gt;&lt;/input&gt;` element.

Range sliders are useful for quickly selecting numbers from a given range.

The first two parameters, `min` and `max`, are numbers that set the
slider's minimum and maximum.

The third parameter, `value`, is optional. It's a number that sets the
slider's default value.

The fourth parameter, `step`, is also optional. It's a number that sets the
spacing between each value in the slider's range. Setting `step` to 0
allows the slider to move smoothly from `min` to `max`.

@method createSlider
@param  {Number} min minimum value of the slider.
@param  {Number} max maximum value of the slider.
@param  {Number} [value] default value of the slider.
@param  {Number} [step] size for each step in the slider's range.
@return {p5.Element} new <a href="#/p5.Element">p5.Element</a> object.

---

## Fonction : createButton(label, [value])
Creates a `&lt;button&gt;&lt;/button&gt;` element.

The first parameter, `label`, is a string that sets the label displayed on
the button.

The second parameter, `value`, is optional. It's a string that sets the
button's value. See
<a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#value" target="_blank">MDN</a>
for more details.

@method createButton
@param  {String} label label displayed on the button.
@param  {String} [value] value of the button.
@return {p5.Element} new <a href="#/p5.Element">p5.Element</a> object.

---

## Fonction : createCheckbox([label], [value])
Creates a checkbox `&lt;input&gt;&lt;/input&gt;` element.

Checkboxes extend the <a href="#/p5.Element">p5.Element</a> class with a
`checked()` method. Calling `myBox.checked()` returns `true` if it the box
is checked and `false` if not.

The first parameter, `label`, is optional. It's a string that sets the label
to display next to the checkbox.

The second parameter, `value`, is also optional. It's a boolean that sets the
checkbox's value.

@method createCheckbox
@param  {String} [label] label displayed after the checkbox.
@param  {boolean} [value] value of the checkbox. Checked is `true` and unchecked is `false`.
@return {p5.Element} new <a href="#/p5.Element">p5.Element</a> object.

---

## Fonction : createSelect([multiple])
Creates a dropdown menu `&lt;select&gt;&lt;/select&gt;` element.

The parameter is optional. If `true` is passed, as in
`let mySelect = createSelect(true)`, then the dropdown will support
multiple selections. If an existing `&lt;select&gt;&lt;/select&gt;` element
is passed, as in `let mySelect = createSelect(otherSelect)`, the existing
element will be wrapped in a new <a href="#/p5.Element">p5.Element</a>
object.

Dropdowns extend the <a href="#/p5.Element">p5.Element</a> class with a few
helpful methods for managing options:
- `mySelect.option(name, [value])` adds an option to the menu. The first paremeter, `name`, is a string that sets the option's name and value. The second parameter, `value`, is optional. If provided, it sets the value that corresponds to the key `name`. If an option with `name` already exists, its value is changed to `value`.
- `mySelect.value()` returns the currently-selected option's value.
- `mySelect.selected()` returns the currently-selected option.
- `mySelect.selected(option)` selects the given option by default.
- `mySelect.disable()` marks the whole dropdown element as disabled.
- `mySelect.disable(option)` marks a given option as disabled.
- `mySelect.enable()` marks the whole dropdown element as enabled.
- `mySelect.enable(option)` marks a given option as enabled.

@method createSelect
@param {boolean} [multiple] support multiple selections.
@return {p5.Element} new <a href="#/p5.Element">p5.Element</a> object.

## Fonction : createSelect(existing)
@method createSelect
@param {Object} existing select element to wrap, either as a <a href="#/p5.Element">p5.Element</a> or
                          a <a href="https://developer.mozilla.org/en-US/docs/Web/API/HTMLSelectElement" target="_blank">HTMLSelectElement</a>.
@return {p5.Element}

---

## Fonction : createRadio([containerElement])
Creates a radio button element.

The parameter is optional. If a string is passed, as in
`let myRadio = createSelect('food')`, then each radio option will
have `"food"` as its `name` parameter: `&lt;input name="food"&gt;`.
If an existing `&lt;div&gt;&lt;/div&gt;` or `&lt;span&gt;&lt;/span&gt;`
element is passed, as in `let myRadio = createSelect(container)`, it will
become the radio button's parent element.

Radio buttons extend the <a href="#/p5.Element">p5.Element</a> class with a few
helpful methods for managing options:
- `myRadio.option(value, [label])` adds an option to the menu. The first parameter, `value`, is a string that sets the option's value and label. The second parameter, `label`, is optional. If provided, it sets the label displayed for the `value`. If an option with `value` already exists, its label is changed and its value is returned.
- `myRadio.value()` returns the currently-selected option's value.
- `myRadio.selected()` returns the currently-selected option.
- `myRadio.selected(value)` selects the given option and returns it as an <a href="https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement" target="_blank">`HTMLInputElement`</a>.
- `myRadio.disable(shouldDisable)` Disables the radio button if `true` is passed, and enables it if `false` is passed.

@method createRadio
@param  {Object} [containerElement] container HTML Element, either a `&lt;div&gt;&lt;/div&gt;`
or `&lt;span&gt;&lt;/span&gt;`.
@return {p5.Element} new <a href="#/p5.Element">p5.Element</a> object.

## Fonction : createRadio([name])
@method createRadio
@param {String} [name] name parameter assigned to each option's `&lt;input&gt;&lt;/input&gt;` element.
@return {p5.Element} new <a href="#/p5.Element">p5.Element</a> object.

## Fonction : createRadio()
@method createRadio
@return {p5.Element} new <a href="#/p5.Element">p5.Element</a> object.

---

## Fonction : createColorPicker([value])
Creates a color picker element.

The parameter, `value`, is optional. If a color string or
<a href="#/p5.Color">p5.Color</a> object is passed, it will set the default
color.

Color pickers extend the <a href="#/p5.Element">p5.Element</a> class with a
couple of helpful methods for managing colors:
- `myPicker.value()` returns the current color as a hex string in the format `'#rrggbb'`.
- `myPicker.color()` returns the current color as a <a href="#/p5.Color">p5.Color</a> object.

@method createColorPicker
@param {String|p5.Color} [value] default color as a <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/color" target="_blank">CSS color string</a>.
@return {p5.Element} new <a href="#/p5.Element">p5.Element</a> object.

---

## Fonction : createInput([value], [type])
Creates a text `&lt;input&gt;&lt;/input&gt;` element.

Call `myInput.size()` to set the length of the text box.

The first parameter, `value`, is optional. It's a string that sets the
input's default value. The input is blank by default.

The second parameter, `type`, is also optional. It's a string that
specifies the type of text being input. See MDN for a full
<a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Input" target="_blank">list of options</a>.
The default is `'text'`.

@method createInput
@param {String} [value] default value of the input box. Defaults to an empty string `''`.
@param {String} [type] type of input. Defaults to `'text'`.
@return {p5.Element} new <a href="#/p5.Element">p5.Element</a> object.

## Fonction : createInput([value])
@method createInput
@param {String} [value]
@return {p5.Element}

---

## Fonction : createFileInput(callback, [multiple])
Creates an `&lt;input&gt;&lt;/input&gt;` element of type `'file'`.

`createFileInput()` allows users to select local files for use in a sketch.
It returns a <a href="#/p5.File">p5.File</a> object.

The first parameter, `callback`, is a function that's called when the file
loads. The callback function should have one parameter, `file`, that's a
<a href="#/p5.File">p5.File</a> object.

The second parameter, `multiple`, is optional. It's a boolean value that
allows loading multiple files if set to `true`. If `true`, `callback`
will be called once per file.

@method createFileInput
@param  {Function} callback function to call once the file loads.
@param  {Boolean} [multiple] allow multiple files to be selected.
@return {p5.File} new <a href="#/p5.File">p5.File</a> object.

---

## Fonction : createVideo(src, [callback])
Creates a `&lt;video&gt;` element for simple audio/video playback.

`createVideo()` returns a new
<a href="#/p5.MediaElement">p5.MediaElement</a> object. Videos are shown by
default. They can be hidden by calling `video.hide()` and drawn to the
canvas using <a href="#/p5/image">image()</a>.

The first parameter, `src`, is the path the video. If a single string is
passed, as in `'assets/topsecret.mp4'`, a single video is loaded. An array
of strings can be used to load the same video in different formats. For
example, `['assets/topsecret.mp4', 'assets/topsecret.ogv', 'assets/topsecret.webm']`.
This is useful for ensuring that the video can play across different browsers with
different capabilities. See
<a href='https://developer.mozilla.org/en-US/docs/Web/HTML/Supported_media_formats'>MDN</a>
for more information about supported formats.

The second parameter, `callback`, is optional. It's a function to call once
the video is ready to play.

@method createVideo
@param  {String|String[]} src path to a video file, or an array of paths for
                               supporting different browsers.
@param  {Function} [callback] function to call once the video is ready to play.
@return {p5.MediaElement}   new <a href="#/p5.MediaElement">p5.MediaElement</a> object.

---

## Fonction : createAudio([src], [callback])
Creates a hidden `&lt;audio&gt;` element for simple audio playback.

`createAudio()` returns a new
<a href="#/p5.MediaElement">p5.MediaElement</a> object.

The first parameter, `src`, is the path the video. If a single string is
passed, as in `'assets/video.mp4'`, a single video is loaded. An array
of strings can be used to load the same video in different formats. For
example, `['assets/video.mp4', 'assets/video.ogv', 'assets/video.webm']`.
This is useful for ensuring that the video can play across different
browsers with different capabilities. See
<a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Supported_media_formats" target="_blank">MDN</a>
for more information about supported formats.

The second parameter, `callback`, is optional. It's a function to call once
the audio is ready to play.

@method createAudio
@param  {String|String[]} [src] path to an audio file, or an array of paths
                                 for supporting different browsers.
@param  {Function} [callback]   function to call once the audio is ready to play.
@return {p5.MediaElement}       new <a href="#/p5.MediaElement">p5.MediaElement</a> object.

---

## Fonction : createCapture([type], [flipped], [callback])
Creates a `&lt;video&gt;` element that "captures" the audio/video stream from
the webcam and microphone.

`createCapture()` returns a new
<a href="#/p5.MediaElement">p5.MediaElement</a> object. Videos are shown by
default. They can be hidden by calling `capture.hide()` and drawn to the
canvas using <a href="#/p5/image">image()</a>.

The first parameter, `type`, is optional. It sets the type of capture to
use. By default, `createCapture()` captures both audio and video. If `VIDEO`
is passed, as in `createCapture(VIDEO)`, only video will be captured.
If `AUDIO` is passed, as in `createCapture(AUDIO)`, only audio will be
captured. A constraints object can also be passed to customize the stream.
See the <a href="http://w3c.github.io/mediacapture-main/getusermedia.html#media-track-constraints" target="_blank">
W3C documentation</a> for possible properties. Different browsers support different
properties.

The 'flipped' property is an optional property which can be set to `{flipped:true}`
to mirror the video output.If it is true then it means that video will be mirrored
or flipped and if nothing is mentioned then by default it will be `false`.

The second parameter,`callback`, is optional. It's a function to call once
the capture is ready for use. The callback function should have one
parameter, `stream`, that's a
<a href="https://developer.mozilla.org/en-US/docs/Web/API/MediaStream" target="_blank">MediaStream</a> object.

Note: `createCapture()` only works when running a sketch locally or using HTTPS. Learn more
<a href="http://stackoverflow.com/questions/34197653/getusermedia-in-chrome-47-without-using-https" target="_blank">here</a>
and <a href="https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia" target="_blank">here</a>.

@method createCapture
@param  {String|Constant|Object}  [type] type of capture, either AUDIO or VIDEO,
                                   or a constraints object. Both video and audio
                                   audio streams are captured by default.
@param  {Object}                  [flipped] flip the capturing video and mirror the output with `{flipped:true}`. By
                                   default it is false.
@param  {Function}                [callback] function to call once the stream
                                   has loaded.
@return {p5.MediaElement} new <a href="#/p5.MediaElement">p5.MediaElement</a> object.

---

## Fonction : createElement(tag, [content])
Creates a new <a href="#/p5.Element">p5.Element</a> object.

The first parameter, `tag`, is a string an HTML tag such as `'h5'`.

The second parameter, `content`, is optional. It's a string that sets the
HTML content to insert into the new element. New elements have no content
by default.

@method createElement
@param  {String} tag tag for the new element.
@param  {String} [content] HTML content to insert into the element.
@return {p5.Element} new <a href="#/p5.Element">p5.Element</a> object.

---

## Méthode : p5.Element.addClass(class)
Adds a class to the element.

@for p5.Element
@method addClass
@param  {String} class name of class to add.
@chainable

---

## Méthode : p5.Element.removeClass(class)
Removes a class from the element.

@method removeClass
@param  {String} class name of class to remove.
@chainable
@for p5.Element

---

## Méthode : p5.Element.hasClass(c)
Checks if a class is already applied to element.

@method hasClass
@returns {boolean} a boolean value if element has specified class.
@param c {String} name of class to check.
@for p5.Element

---

## Méthode : p5.Element.toggleClass(c)
Toggles whether a class is applied to the element.

@method toggleClass
@param c {String} class name to toggle.
@chainable
@for p5.Element

---

## Méthode : p5.Element.child([child])
Attaches the element as a child of another element.

`myElement.child()` accepts either a string ID, DOM node, or
<a href="#/p5.Element">p5.Element</a>. For example,
`myElement.child(otherElement)`. If no argument is provided, an array of
children DOM nodes is returned.

@method child
@returns {Node[]} an array of child nodes.
@for p5.Element

## Méthode : p5.Element.child([child])
@method child
@param  {String|p5.Element} [child] the ID, DOM node, or <a href="#/p5.Element">p5.Element</a>
                         to add to the current element
@chainable
@for p5.Element

---

## Méthode : p5.Element.center([align])
Centers the element either vertically, horizontally, or both.

`center()` will center the element relative to its parent or according to
the page's body if the element has no parent.

If no argument is passed, as in `myElement.center()` the element is aligned
both vertically and horizontally.

@method center
@param  {String} [align] passing 'vertical', 'horizontal' aligns element accordingly
@chainable
@for p5.Element

---

## Méthode : p5.Element.html([html], [append])
Sets the inner HTML of the element, replacing any existing HTML.

The second parameter, `append`, is optional. If `true` is passed, as in
`myElement.html('hi', true)`, the HTML is appended instead of replacing
existing HTML.

If no arguments are passed, as in `myElement.html()`, the element's inner
HTML is returned.

@for p5.Element
@method html
@returns {String} the inner HTML of the element

## Méthode : p5.Element.html([html], [append])
@method html
@param  {String} [html] the HTML to be placed inside the element
@param  {boolean} [append] whether to append HTML to existing
@chainable
@for p5.Element

---

## Méthode : p5.Element.position([x], [y], [positionType])
Sets the element's position.

The first two parameters, `x` and `y`, set the element's position relative
to the top-left corner of the web page.

The third parameter, `positionType`, is optional. It sets the element's
<a target="_blank"
href="https://developer.mozilla.org/en-US/docs/Web/CSS/position">positioning scheme</a>.
`positionType` is a string that can be either `'static'`, `'fixed'`,
`'relative'`, `'sticky'`, `'initial'`, or `'inherit'`.

If no arguments passed, as in `myElement.position()`, the method returns
the element's position in an object, as in `{ x: 0, y: 0 }`.

@method position
@returns {Object} object of form `{ x: 0, y: 0 }` containing the element's position.
@for p5.Element

## Méthode : p5.Element.position([x], [y], [positionType])
@method position
@param  {Number} [x] x-position relative to top-left of window (optional)
@param  {Number} [y] y-position relative to top-left of window (optional)
@param  {String} [positionType] it can be static, fixed, relative, sticky, initial or inherit (optional)
@chainable
@for p5.Element

---

## Méthode : p5.Element.style(property, [value])
Applies a style to the element by adding a
<a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Syntax" target="_blank">CSS declaration</a>.

The first parameter, `property`, is a string. If the name of a style
property is passed, as in `myElement.style('color')`, the method returns
the current value as a string or `null` if it hasn't been set. If a
`property:style` string is passed, as in
`myElement.style('color:deeppink')`, the method sets the style `property`
to `value`.

The second parameter, `value`, is optional. It sets the property's value.
`value` can be a string, as in
`myElement.style('color', 'deeppink')`, or a
<a href="#/p5.Color">p5.Color</a> object, as in
`myElement.style('color', myColor)`.

@method style
@param  {String} property style property to set.
@returns {String} value of the property.
@for p5.Element

## Méthode : p5.Element.style(property, [value])
@method style
@param  {String} property
@param  {String|p5.Color} value value to assign to the property.
@chainable
@for p5.Element

---

## Méthode : p5.Element.attribute(attr, [value])
Adds an
<a href="https://developer.mozilla.org/en-US/docs/Learn/HTML/Introduction_to_HTML/Getting_started#attributes" target="_blank">attribute</a>
to the element.

This method is useful for advanced tasks. Most commonly-used attributes,
such as `id`, can be set with their dedicated methods. For example,
`nextButton.id('next')` sets an element's `id` attribute. Calling
`nextButton.attribute('id', 'next')` has the same effect.

The first parameter, `attr`, is the attribute's name as a string. Calling
`myElement.attribute('align')` returns the attribute's current value as a
string or `null` if it hasn't been set.

The second parameter, `value`, is optional. It's a string used to set the
attribute's value. For example, calling
`myElement.attribute('align', 'center')` sets the element's horizontal
alignment to `center`.

@method attribute
@return {String} value of the attribute.
@for p5.Element

## Méthode : p5.Element.attribute(attr, [value])
@method attribute
@param  {String} attr       attribute to set.
@param  {String} value      value to assign to the attribute.
@chainable
@for p5.Element

---

## Méthode : p5.Element.removeAttribute(attr)
Removes an attribute from the element.

The parameter, `attr`, is the attribute's name as a string. For example,
calling `myElement.removeAttribute('align')` removes its `align`
attribute if it's been set.

@method removeAttribute
@param  {String} attr       attribute to remove.
@chainable
@for p5.Element

---

## Méthode : p5.Element.value([value])
Returns or sets the element's value.

Calling `myElement.value()` returns the element's current value.

The parameter, `value`, is an optional number or string. If provided,
as in `myElement.value(123)`, it's used to set the element's value.

@method value
@return {String|Number} value of the element.
@for p5.Element

## Méthode : p5.Element.value([value])
@method value
@param  {String|Number}     value
@chainable
@for p5.Element

---

## Méthode : p5.Element.show()
Shows the current element.

@method show
@chainable
@for p5.Element

---

## Méthode : p5.Element.hide()
Hides the current element.

@method hide
@chainable
@for p5.Element

---

## Méthode : p5.Element.size([w], [h])
Sets the element's width and height.

Calling `myElement.size()` without an argument returns the element's size
as an object with the properties `width` and `height`. For example,
 `{ width: 20, height: 10 }`.

The first parameter, `width`, is optional. It's a number used to set the
element's width. Calling `myElement.size(10)`

The second parameter, 'height`, is also optional. It's a
number used to set the element's height. For example, calling
`myElement.size(20, 10)` sets the element's width to 20 pixels and height
to 10 pixels.

The constant `AUTO` can be used to adjust one dimension at a time while
maintaining the aspect ratio, which is `width / height`. For example,
consider an element that's 200 pixels wide and 100 pixels tall. Calling
`myElement.size(20, AUTO)` sets the width to 20 pixels and height to 10
pixels.

Note: In the case of elements that need to load data, such as images, wait
to call `myElement.size()` until after the data loads.

@method size
@return {Object} width and height of the element in an object.
@for p5.Element

## Méthode : p5.Element.size([w], [h])
@method size
@param  {Number|Constant} [w]   width of the element, either AUTO, or a number.
@param  {Number|Constant} [h] height of the element, either AUTO, or a number.
@chainable
@for p5.Element

---

## Méthode : p5.Element.remove()
Removes the element, stops all audio/video streams, and removes all
callback functions.

@method remove
@for p5.Element

---

## Méthode : p5.Element.drop(callback, [fxn])
Calls a function when the user drops a file on the element.

The first parameter, `callback`, is a function to call once the file loads.
The callback function should have one parameter, `file`, that's a
<a href="#/p5.File">p5.File</a> object. If the user drops multiple files on
the element, `callback`, is called once for each file dropped.

The second parameter, `fxn`, is a function to call when the browser detects
one or more dropped files. The callback function should have one
parameter, `event`, that's a
<a href="https://developer.mozilla.org/en-US/docs/Web/API/DragEvent">DragEvent</a>.

@method drop
@param  {Function} callback  called when a file loads. Called once for each file dropped.
@param  {Function} [fxn]     called once when any files are dropped.
@chainable
@for p5.Element

---

## Méthode : p5.Element.draggable([elmnt])
Makes the element draggable.

The parameter, `elmnt`, is optional. If another
<a href="#/p5.Element">p5.Element</a> object is passed, as in
`myElement.draggable(otherElement)`, the other element will become draggable.

@method draggable
@param  {p5.Element} [elmnt]  another <a href="#/p5.Element">p5.Element</a>.
@chainable
@for p5.Element

---

## Classe : p5.MediaElement
A class to handle audio and video.

`p5.MediaElement` extends <a href="#/p5.Element">p5.Element</a> with
methods to handle audio and video. `p5.MediaElement` objects are created by
calling <a href="#/p5/createVideo">createVideo</a>,
<a href="#/p5/createAudio">createAudio</a>, and
<a href="#/p5/createCapture">createCapture</a>.

@class p5.MediaElement
@constructor
@param {String} elt DOM node that is wrapped
@extends p5.Element

---

## Méthode : p5.MediaElement.play()
Plays audio or video from a media element.

@method play
@chainable

---

## Méthode : p5.MediaElement.stop()
Stops a media element and sets its current time to 0.

Calling `media.play()` will restart playing audio/video from the beginning.

@method stop
@chainable

---

## Méthode : p5.MediaElement.pause()
Pauses a media element.

Calling `media.play()` will resume playing audio/video from the moment it paused.

@method pause
@chainable

---

## Méthode : p5.MediaElement.loop()
Plays the audio/video repeatedly in a loop.

@method loop
@chainable

---

## Méthode : p5.MediaElement.noLoop()
Stops the audio/video from playing in a loop.

The media will stop when it finishes playing.

@method noLoop
@chainable

---

## Méthode : p5.MediaElement.autoplay([shouldAutoplay])
Sets the audio/video to play once it's loaded.

The parameter, `shouldAutoplay`, is optional. Calling
`media.autoplay()` without an argument causes the media to play
automatically. If `true` is passed, as in `media.autoplay(true)`, the
media will automatically play. If `false` is passed, as in
`media.autoPlay(false)`, it won't play automatically.

@method autoplay
@param {Boolean} [shouldAutoplay] whether the element should autoplay.
@chainable

---

## Méthode : p5.MediaElement.volume([val])
Sets the audio/video volume.

Calling `media.volume()` without an argument returns the current volume
as a number in the range 0 (off) to 1 (maximum).

The parameter, `val`, is optional. It's a number that sets the volume
from 0 (off) to 1 (maximum). For example, calling `media.volume(0.5)`
sets the volume to half of its maximum.

@method volume
@return {Number} current volume.

## Méthode : p5.MediaElement.volume(val)
@method volume
@param {Number}            val volume between 0.0 and 1.0.
@chainable

---

## Méthode : p5.MediaElement.speed([val])
Sets the audio/video playback speed.

The parameter, `val`, is optional. It's a number that sets the playback
speed. 1 plays the media at normal speed, 0.5 plays it at half speed, 2
plays it at double speed, and so on. -1 plays the media at normal speed
in reverse.

Calling `media.speed()` returns the current speed as a number.

Note: Not all browsers support backward playback. Even if they do,
playback might not be smooth.

@method speed
@return {Number} current playback speed.

## Méthode : p5.MediaElement.speed(speed)
@method speed
@param {Number} speed  speed multiplier for playback.
@chainable

---

## Méthode : p5.MediaElement.time([time])
Sets the media element's playback time.

The parameter, `time`, is optional. It's a number that specifies the
time, in seconds, to jump to when playback begins.

Calling `media.time()` without an argument returns the number of seconds
the audio/video has played.

Note: Time resets to 0 when looping media restarts.

@method time
@return {Number} current time (in seconds).

## Méthode : p5.MediaElement.time(time)
@method time
@param {Number} time time to jump to (in seconds).
@chainable

---

## Méthode : p5.MediaElement.duration()
Returns the audio/video's duration in seconds.

@method duration
@return {Number} duration (in seconds).

---

## Méthode : p5.MediaElement.onended(callback)
Calls a function when the audio/video reaches the end of its playback.

The element is passed as an argument to the callback function.

Note: The function won't be called if the media is looping.

@method  onended
@param  {Function} callback function to call when playback ends.
                             The `p5.MediaElement` is passed as
                             the argument.
@chainable

---

## Méthode : p5.MediaElement.connect(audioNode)
Sends the element's audio to an output.

The parameter, `audioNode`, can be an `AudioNode` or an object from the
`p5.sound` library.

If no element is provided, as in `myElement.connect()`, the element
connects to the main output. All connections are removed by the
`.disconnect()` method.

Note: This method is meant to be used with the p5.sound.js addon library.

@method  connect
@param  {AudioNode|Object} audioNode AudioNode from the Web Audio API,
or an object from the p5.sound library

---

## Méthode : p5.MediaElement.disconnect()
Disconects all Web Audio routing, including to the main output.

This is useful if you want to re-route the output through audio effects,
for example.

@method  disconnect

---

## Méthode : p5.MediaElement.showControls()
Show the default
<a href="https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement" target="_blank">HTMLMediaElement</a>
controls.

Note: The controls vary between web browsers.

@method  showControls

---

## Méthode : p5.MediaElement.hideControls()
Hide the default
<a href="https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement" target="_blank">HTMLMediaElement</a>
controls.

@method hideControls

---

## Méthode : p5.MediaElement.addCue(time, callback, [value])
Schedules a function to call when the audio/video reaches a specific time
during its playback.

The first parameter, `time`, is the time, in seconds, when the function
should run. This value is passed to `callback` as its first argument.

The second parameter, `callback`, is the function to call at the specified
cue time.

The third parameter, `value`, is optional and can be any type of value.
`value` is passed to `callback`.

Calling `media.addCue()` returns an ID as a string. This is useful for
removing the cue later.

@method  addCue
@param {Number}   time     cue time to run the callback function.
@param {Function} callback function to call at the cue time.
@param {Object} [value]    object to pass as the argument to
                            `callback`.
@return {Number} id ID of this cue,
                     useful for `media.removeCue(id)`.

---

## Méthode : p5.MediaElement.removeCue(id)
Removes a callback based on its ID.

@method removeCue
@param  {Number} id ID of the cue, created by `media.addCue()`.

---

## Méthode : p5.MediaElement.clearCues()
Removes all functions scheduled with `media.addCue()`.

@method  clearCues

---

## Classe : p5.File
A class to describe a file.

`p5.File` objects are used by
<a href="#/p5.Element/drop">myElement.drop()</a> and
created by
<a href="#/p5/createFileInput">createFileInput</a>.

@class p5.File
@constructor
@param {File} file wrapped file.

### Propriétés
- file: File (Underlying File object.)
- type: String (The file MIME type as a string.)
- subtype: String (The file subtype as a string.)
- name: String (The file name as a string.)
- size: Number (The number of bytes in the file.)
- data: String (A string containing the file's data.)