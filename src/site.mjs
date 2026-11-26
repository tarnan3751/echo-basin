// What a page is written as: a whole HTML document around the page's own content, and the files every page shares.
// build.mjs writes these into dist/ for every page on the site; preview.mjs writes the same into a throwaway folder
// around a single picture, so that a picture can be seen exactly as the site will show it before it is on any page.
import fs from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { esc } from './html.mjs';
import { header, footer, goes, lastGo } from './layout.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = f => fs.readFileSync(join(ROOT, f), 'utf8');

// The fonts sit in a folder beside the stylesheet, which names them relative to itself.
const FONTS = [['Fraunces', 'fraunces.woff2', 'font-weight:100 900;'], ['Source Sans 3', 'sourcesans3.woff2', 'font-weight:200 900;'], ['Special Elite', 'specialelite.woff2', 'font-weight:400;']];
const font = (family, file, extra) => `@font-face{font-family:"${family}";src:url(fonts/${file}) format("woff2");font-display:swap;${extra}}`;

// The files every page shares, as [path, contents]: the stylesheet with the fonts beside it, and one script made of
// the grain, sound and stage engines, in that order.
export const shared = () => [
  ['assets/site.css', FONTS.map(f => font(...f)).join('\n') + '\n' + read('src/site.css')],
  ['assets/site.js', ['src/grain.js', 'src/sound.js', 'src/runtime.js'].map(read).join('\n')],
  ...FONTS.map(([, file]) => ['assets/fonts/' + file, fs.readFileSync(join(ROOT, 'fonts', file))]),
];

// One page module (see src/pages.mjs) as the document written at its path. base is where the site sits on its server
// ('/echo-basin/'), which only a page marked absolute uses: the "not found" page, which the server sends for a bad
// address at any depth, so that an address relative to it could point anywhere.
export function page(p, { base = '/' } = {}) {
  const depth = p.path.split('/').length - 1, root = p.absolute ? base : '../'.repeat(depth);
  // A path ending in / is a page. Opened from disk a folder does not open its index.html, so the file is named.
  const url = to => root + (to === '' || to.endsWith('/') ? to + 'index.html' : to);
  const ctx = { url, go: p.go, path: p.path };
  ctx.last = lastGo(ctx);
  const foot = footer(ctx), main = p.main({ ...ctx, foot });
  // What the script needs to know about the page goes inside <main>, so that it travels with the content when one page
  // is swapped for another in place: where the page is, its tab titles, where the header button goes by stage, and
  // whether the page scores.
  const data = JSON.stringify({ path: p.path, titles: p.titles, go: goes(ctx), ...(p.score === false ? { score: false } : {}) }).replace(/</g, '\\u003c');
  // a page that ends in a closing screen has put the footer in it; on any other page it follows the content
  const after = main.includes(foot) ? '' : foot + '\n';
  // The fonts are not preloaded: opened from disk, Chrome refuses a preload of a font (it asks for it cross-origin) and
  // then fetches it again for the stylesheet, with an error in the console each time.
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.titles[0])}</title>
<link rel="icon" id="fav" href="data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2040%2040%27%3E%3Crect%20width=%2740%27%20height=%2740%27%20rx=%278%27%20fill=%27%2312303B%27/%3E%3Cg%20transform=%27translate%284.4,4.4%29%20scale%280.78%29%27%3E%3Cpath%20d=%27M4,20.6%20L15.5,4.6%20L21.5,13.2%20L25.5,9.4%20L36,20.6Z%27%20fill=%27%23F5F1E3%27/%3E%3Cpath%20d=%27M8.2,25.4%20H31.8%20M12.8,30%20H27.2%20M17.4,34.6%20H22.6%27%20fill=%27none%27%20stroke=%27%23F5F1E3%27%20stroke-width=%272.5%27%20stroke-linecap=%27round%27/%3E%3Ccircle%20cx=%2731.6%27%20cy=%276.4%27%20r=%273.3%27%20fill=%27%23F2B441%27/%3E%3C/g%3E%3C/svg%3E">
<meta name="description" content="${esc(p.description)}">
<link rel="stylesheet" href="${url('assets/site.css')}">
</head>
<body data-stage="0">
<a class="skip" href="#main">Skip to content</a>
${header(ctx)}
<main id="main">
<script type="application/json" data-page>${data}</script>
${main}
</main>
${after}<div id="cast" aria-hidden="true"></div>
<div id="tint" aria-hidden="true"></div>
<div id="flash" aria-hidden="true"></div>
<div id="paper" aria-hidden="true"></div>
<div id="grit" aria-hidden="true"></div>
<script src="${url('assets/site.js')}"></script>
</body>
</html>`;
}
