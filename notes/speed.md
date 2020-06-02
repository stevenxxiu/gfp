# Speed
`.querySelector()` is faster than `XPath`. Use when possible.

`'a' + 'b'` is faster than `['a', 'b'].join('')`, even if array is large.

Styles are faster than having a Base64 src for each image.

Creating nodes once then using `cloneNode()` is faster than creating nodes each time.

Matching element IDs is faster than their classes in selectors.
