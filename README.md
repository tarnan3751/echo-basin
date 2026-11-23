# Echo Basin

![The top of the Echo Basin National Park website](docs/screenshot.jpg)

This is the website for Echo Basin National Park. The park doesn't exist, but the site is built to look like it does, with trail tables, lodge hours, a staff page and everything else you'd expect.

There's a story hidden in it, but the site plays it completely straight and never lets on. As you scroll, the alerts get reworded and the rules get stricter, and a few people on the staff page stop turning up. Nothing explains what's going on in the basin. You work it out from the details, the way you would if you'd found the page by accident.

I'm still adding to it, so expect things to change.

## Looking at it

Open `dist/index.html` in a browser. Everything is inside that one file, so it works offline.

## Working on it

    node build.mjs

That rebuilds `dist/index.html`. There's nothing to install. It's been built with Node 22, and older versions probably work.

- `src/content.mjs` is all the writing, including what each line turns into further down the page
- `src/scene-*.mjs` draw the pictures. They're SVG made by code, so there are no image files
- `src/site.css` and `src/runtime.js` handle the layout and the scrolling
- `echo-check.mjs` checks that the echo diagram still agrees with the park map

The fonts are Fraunces and Source Sans 3 (SIL Open Font License) and Special Elite (Apache 2.0).
