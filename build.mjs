// node build.mjs : writes the site into dist/. Each page in src/pages.mjs becomes its own HTML file, with its pictures
// inline. What every page shares is written once, under dist/assets/: the stylesheet with the fonts beside it, and one
// script made of the grain, sound and stage engines, in that order. dist/ is emptied first so nothing stale survives.
// Every address in a page is relative to that page, so the site works under any base path and opened straight from disk.
// The document around each page and the shared files are made in src/site.mjs, which preview.mjs uses as well.
import fs from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as registry from './src/pages.mjs';
import { page, shared } from './src/site.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url)), DIST = join(ROOT, 'dist');
// Where the site sits on its server, from the root of the domain. GitHub Pages serves this repository at /echo-basin/.
// Only the "not found" page uses it: the server sends that page for a bad address at any depth, so its addresses are
// written from here instead of relative to itself (see absolute in src/pages.mjs). Every other page stays relative.
// node build.mjs --base /other/ (or --base=/other/), or ECHO_BASE=/other/ node build.mjs, changes it; --base / for a
// site at the root of its domain.
const BASE = (() => {
  const i = process.argv.findIndex(a => a === '--base' || a.startsWith('--base='));
  const given = i < 0 ? process.env.ECHO_BASE : process.argv[i].includes('=') ? process.argv[i].slice(7) : process.argv[i + 1];
  const b = ('/' + (given ?? '/echo-basin/') + '/').replace(/\/{2,}/g, '/');
  if (!/^[\w\-./~%]+$/.test(b) || b.split('/').includes('..')) { console.error(`--base ${given}: give a path such as /echo-basin/`); process.exit(1); }
  return b;
})();
const written = [];
const write = (f, data) => { const out = join(DIST, f); fs.mkdirSync(dirname(out), { recursive: true }); fs.writeFileSync(out, data); written.push([f, fs.statSync(out).size]); };

const pages = Object.values(registry);
const seen = new Set(), GO = ['plan', 'conditions', 'last'];
for (const p of pages) {
  const name = p.path || '(a page with no path)';
  const fault = typeof p.path !== 'string' || !p.path.endsWith('.html') || p.path.startsWith('/') || p.path.split('/').includes('..') ? 'needs a path under dist/ ending in .html'
    : seen.has(p.path) ? 'is written by two pages'
    : !Array.isArray(p.titles) || p.titles.length !== 7 ? 'needs seven tab titles, one for each stage'
    : typeof p.description !== 'string' ? 'needs a meta description'
    : typeof p.main !== 'function' ? 'needs a main() that returns the HTML for <main>'
    : p.go !== undefined && !(p.go && Object.keys(p.go).every(k => GO.includes(k)) && GO.every(k => p.go[k] === undefined || typeof p.go[k] === 'string')) ? 'has a go that is not { plan, conditions, last } addresses'
    : p.score !== undefined && p.score !== false ? 'has a score that is not false (a page that scores leaves it out)'
    : p.absolute !== undefined && p.absolute !== true ? 'has an absolute that is not true (a page with relative addresses leaves it out)' : '';
  if (fault) { console.error(`${name} ${fault}`); process.exit(1); }
  seen.add(p.path);
}

// Everything is made before dist/ is emptied, so a page that fails to build leaves the last good site in place.
const out = [...shared(), ...pages.map(p => [p.path, page(p, { base: BASE })])];
// A line that says what the reader did names the test that decides it (checked() in src/html.mjs). One that names a
// test the script does not have would always show its fallback, so the build stops instead.
const SAID = /var SAID = \{([\s\S]*?)\n {2}\};/.exec(fs.readFileSync(join(ROOT, 'src/runtime.js'), 'utf8'));
const tests = new Set(SAID ? [...SAID[1].matchAll(/^ {4}(\w+): function/gm)].map(m => m[1]) : []);
for (const [f, html] of out) for (const m of typeof html === 'string' ? html.matchAll(/ data-if\d="([^"]*)"/g) : []) {
  if (!tests.has(m[1])) { console.error(`${f} has a line checked by "${m[1]}", and SAID in src/runtime.js has no test of that name`); process.exit(1); }
}
fs.rmSync(DIST, { recursive: true, force: true });
for (const [f, data] of out) write(f, data);
const rooted = new Set(pages.filter(p => p.absolute).map(p => p.path));
for (const [f, size] of written) console.log(`dist/${f}`.padEnd(46) + (size / 1024).toFixed(0).padStart(6) + ' KB' + (rooted.has(f) ? `   (addresses from ${BASE})` : ''));
