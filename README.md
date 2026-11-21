# Echo Basin

A website for a national park that doesn't exist. It opens like any park site, with trails, rangers and a lodge, and gets stranger the further down you scroll.

The whole site is one HTML file. The pictures are SVG drawn by code and the fonts are packed in, so it works offline. To see it, open `dist/index.html` in a browser.

## Build

    node build.mjs

That writes `dist/index.html`. It needs Node 18 or newer and nothing else.

Where things are:

- `src/content.mjs` has all the text, and how it changes as you scroll
- `src/scene-*.mjs` draw the pictures
- `src/site.css` and `src/runtime.js` are the layout and the scroll behavior
- `fonts/` has Fraunces and Source Sans 3 (SIL Open Font License) and Special Elite (Apache 2.0)

Echo Basin National Park isn't real, and neither is anyone in it.
