# Echo Basin

![The top of the Echo Basin National Park website](docs/screenshot.jpg)

This is the visitor website for Echo Basin National Park. I built it for the park authority over the summer and I've looked after it since.

None of the text is mine. Staff send in the trail conditions, alerts and closures, and the site posts whatever comes in. Since about the middle of September the updates have been getting strange, and I can't get anyone at the park office to pick up the phone. I've left everything exactly as it was sent. Read down the page and you'll see what I mean. A few of the people on the staff page stop being mentioned.

Updates are still coming in from somewhere, so this will keep changing. If you've been up to the basin lately, I'd like to hear from you.

## Looking at it

Open `dist/index.html` in a browser. Everything is inside that one file, so it works offline.

## Working on it

    node build.mjs

That rebuilds `dist/index.html`. There's nothing to install. It's been built with Node 22, and older versions probably work.

- `src/content.mjs` is all the text, with every version of each line in the order it came in
- `src/scene-*.mjs` draw the pictures. They're SVG made by code, so there are no image files
- `src/site.css` and `src/runtime.js` handle the layout and the scrolling
- `echo-check.mjs` checks that the echo diagram still agrees with the park map

The fonts are Fraunces and Source Sans 3 (SIL Open Font License) and Special Elite (Apache 2.0).
