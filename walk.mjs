// node walk.mjs [page ...] : a scripted reader, for checking the clock (story bible section 10).
// It serves dist/ itself, opens a headless Chrome with nothing saved, and reads the pages it is given in that order
// (the home page if none), each from top to bottom at a steady pace, stopping at each picture and staying a while at
// the bottom. It goes from one page to the next the way a reader does, by clicking a link to it on the page it is on,
// so that the next page is swapped in place (bible 10.8); --load loads each address directly instead. As it goes it
// prints what the clock does: each point scored and why, each stage fired and at which marker, each picture catching
// up, and each line that says what the reader did with the wording it was given. Then a summary, and it exits with 1 if
// any rule was broken:
//   a stage went down; two stages fired at one marker; a stage fired with nothing due; a stage fired, or a picture
//   caught up, in a page's first moments (the rules' settle); two stages fired closer together than the rules' space;
//   stage 6 fired below stage 5; a page opened below the saved stage; a picture did not start one stage behind the
//   words (the dock: at the same stage); a picture's stage rose by more than one at a time, or changed without the clock
//   saying so; a page that scores nothing scored a point or was recorded as a page opened (or a page that scores was
//   not recorded); the clock reported something for a page other than the one being read; the page did not have
//   exactly its own markers live, one <main>, one page's data, one clock timer and its two observers; the tab title was
//   not the page's own for the stage; a line that says what the reader did showed neither of its wordings, or not the
//   one the clock chose; the page's script threw an error; a pacing check given with --expect, or a wording given with
//   --said, failed.
//   Across a swap, also: the link was followed the ordinary way instead of swapped in; the header was rebuilt; the
//   address, or a link in the header, or its current-page mark, is not what loading the page gives; focus did not move
//   to the new page's heading, or the change was not announced; the sound stopped (the walk turns it on at the start,
//   and checks it is still on, on the same audio context, running).
//
//   node walk.mjs                                 reads the home page
//   node walk.mjs index.html trails/index.html    reads these pages, in this order (paths under dist/)
//   --load        loads each page's address directly, instead of clicking a link to it on the page before. Where the
//                 page before has no link to the next, the walk loads it directly anyway and says so. A link to it
//                 with a #place is used if there is no plain one.
//   --fast N      the clock's timers run N times faster (default 6), so twelve seconds at a picture take two
//   --pace PX     scrolling speed in pixels per second (default 800)
//   --pause S     clock seconds to stop at each picture (default 13: long enough for its point; 0 for a reader who
//                 does not stop)
//   --linger S    clock seconds to stay at the bottom of each page before leaving (default 10: the last screen read)
//   --expect L    pacing checks, comma separated, pages counted from 1 in the order given:
//                   4@3     stage 4 has been reached by the end of page 3
//                   4@3-3   stage 4 was reached on page 3: not before it, and by its end
//                   3@2-    stage 3 was not reached before page 2 (it may never be)
//   --said L      the wording each line that says what the reader did ended up with, comma separated, by the name of
//                 the test that decides it (SAID in src/runtime.js): lake=yes,every=no,map=yes. "yes" is the line
//                 itself, "no" the plain line shown when it is not true. The last time the walk was shown that line is
//                 the one checked; a line never shown fails.
//   --phone       a 390 x 800 phone instead of a 1280 x 900 window
//   --reduce      as a browser set to reduce motion
//   --shots       also saves the screen at each stop, each stage and each picture catching up, in shots/walk/
//                 (--shots=DIR for another folder)
//
//   The orders the pacing was tuned on (bible 10.2), on the finished site of seventeen pages. Each gives the same
//   stages at the same markers with or without --load.
//   the menu's order, then the Plan page
//   node walk.mjs index.html explore/index.html trails/index.html wildlife/index.html safety/index.html \
//     lodging/index.html plan/index.html --expect 3@1-1,4@3-3,5@4-6,6@7
//   the home page, then the Plan page, then four others
//   node walk.mjs index.html plan/index.html explore/index.html trails/index.html wildlife/index.html \
//     safety/index.html --expect 3@1-1,4@3-3,5@4-6
//   a trail-heavy read: the home page, Trails, the five trail pages, then the Plan page
//   node walk.mjs index.html trails/index.html trails/lakeshore-loop/index.html trails/cathedral-stand/index.html \
//     trails/echo-point/index.html trails/halloran-meadows/index.html trails/echo-pass/index.html plan/index.html \
//     --expect 3@1-1,4@3-3,5@4-6,6@8
//   a reader who starts on a trail page and never opens the home page
//   node walk.mjs trails/echo-pass/index.html trails/halloran-meadows/index.html trails/index.html explore/index.html \
//     wildlife/index.html conditions/index.html plan/index.html --expect 2@1,4@3-3,5@4-6,6@7
//   a short visit, which ends at stage 4 a point short of stage 5, and so before the ending can happen
//   node walk.mjs index.html conditions/index.html lost-and-found/index.html plan/index.html --expect 3@1-1,4@3-4
//   and the home page alone, for a reader who does not stop at its pictures:
//   node walk.mjs --pause 0 --expect 2@1,3@2-
//
//   Two reads that show both wordings of every line that says what the reader did (bible 10.6). Both reach stage 5,
//   then go back to the Explore page, the Wildlife page and the home page, and end on the Plan page with stage 6.
//   A reader who stops half a minute at every picture and opens the Trails page earns all four:
//   node walk.mjs index.html trails/index.html safety/index.html lodging/index.html conditions/index.html \
//     explore/index.html wildlife/index.html index.html plan/index.html --pause 31 --said lake=yes,every=yes,map=yes
//   (the same read at the usual 13 seconds a picture earns every=yes and map=yes, but lake=no: about 18 s on the lake)
//   a reader who glances at each picture for five seconds and never sees the park map or the Cedar Flats plan earns none:
//   node walk.mjs index.html explore/index.html trails/echo-pass/index.html trails/halloran-meadows/index.html \
//     trails/echo-point/index.html explore/index.html wildlife/index.html index.html plan/index.html --pause 5 \
//     --said lake=no,every=no,map=no
//
// Reading the trace: "y" is how far down the page the top of the screen is, in pixels and as a share of the page, and
// "t" the clock seconds the reader has been on the page. "point" lines give the score after the point and the score at
// which the next stage is due. A point in brackets, "over the page's 7", is one the page earned after it had added all
// it can (the rules' cap): it is kept in the save, and the score stays where it was. "STAGE" lines give the marker that
// fired it, numbered in page order as window.__echo.status() numbers them (the last is the page's own end), and under
// it every picture that moved with the stage. "catch up" lines are pictures moving from the stage behind to the site's,
// at their marker or after being looked at ("a look"). When a picture's marker is also the one that fires a stage, the
// picture catches up first and the stage follows a few clock seconds later (the rules' gap), at that same marker: the
// STAGE line then says how long after the catch-up it came. That is the rule working, not two stages at one marker.
// "said" lines are a line that says what the reader did, as its stage reached it: the test that decided it, yes or no,
// and the words shown.
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
// options are --name value or --name=value; --phone, --reduce, --load and --shots stand alone (--shots=DIR names the folder)
const o = {}, pages = [], argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (!argv[i].startsWith('--')) { pages.push(argv[i]); continue; }
  const [k, v] = argv[i].slice(2).split('=');
  o[k] = v !== undefined ? argv[i].slice(3 + k.length) : ['fast', 'pace', 'pause', 'linger', 'expect', 'said'].includes(k) ? argv[++i] : true;
}
if (!pages.length) pages.push('index.html');
const FAST = +(o.fast || 6), PACE = +(o.pace || 800), PAUSE = +(o.pause ?? 13), LINGER = +(o.linger ?? 10), PHONE = !!o.phone, REDUCE = !!o.reduce, CLICK = !o.load;
// --expect: [stage, first page it may be reached on, last page it must be reached by (Infinity: need not be)]
const EXPECT = String(o.expect || '').split(',').filter(Boolean).map(x => {
  const m = /^([1-6])@(\d+)(-(\d*))?$/.exec(x.trim());
  if (!m) { console.error(`--expect ${x}: write it as stage@page, stage@from-to or stage@from-`); process.exit(1); }
  return { text: x.trim(), stage: +m[1], from: m[3] ? +m[2] : 1, by: m[3] ? (m[4] ? +m[4] : Infinity) : +m[2] };
});
// --said: [test, true for the line itself, false for the plain one]
const SAID = String(o.said || '').split(',').filter(Boolean).map(x => {
  const m = /^(\w+)=(yes|no)$/.exec(x.trim());
  if (!m) { console.error(`--said ${x}: write it as test=yes or test=no`); process.exit(1); }
  return { text: x.trim(), test: m[1], yes: m[2] === 'yes' };
});
const SHOTS = o.shots ? join(ROOT, o.shots === true ? 'shots/walk' : o.shots) : null;
const [W, H] = PHONE ? [390, 800] : [1280, 900];
for (const p of pages) if (!existsSync(join(ROOT, 'dist', p))) { console.error(`dist/${p} does not exist. Run node build.mjs first.`); process.exit(1); }
const CHROME = process.env.CHROME || ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium', '/usr/bin/google-chrome', '/usr/bin/chromium'].find(existsSync);
if (!CHROME) { console.error('No Chrome found. Set CHROME to its path.'); process.exit(1); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

// What loading a page gives, read from its file: its data (path, tab titles), how many markers its content carries,
// and the header's links as written for it (where each leads, and the current-page mark). The header button (go) is
// moved by the stage, to where the page's data says.
const unesc = s => s == null ? null : s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
const built = page => {
  const html = readFileSync(join(ROOT, 'dist', page), 'utf8');
  const data = JSON.parse(/<script type="application\/json" data-page>([\s\S]*?)<\/script>/.exec(html)[1]);
  const main = /<main id="main">([\s\S]*)<\/main>/.exec(html)[1];
  const head = /<header class="top">([\s\S]*?)<\/header>/.exec(html)[1];
  const links = [...head.matchAll(/<a\b([^>]*)>/g)].map(m => ({ href: unesc(/\shref="([^"]*)"/.exec(m[1])?.[1]), current: unesc(/\saria-current="([^"]*)"/.exec(m[1])?.[1]), go: /\sdata-go(?=\s|$)/.test(m[1]) }));
  return { data, marks: (main.match(/\sdata-mark(?=[\s=>])/g) || []).length, links };
};

// ---------- the site and the browser, as in shots.mjs ----------
const site = await serve();
const profile = mkdtempSync(join(tmpdir(), 'echo-walk-'));
// Sound is allowed to start without a gesture, in case the click on the sound button is not taken as one.
const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio', '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
// Chrome is given a moment to exit before its profile is removed, or it can write into the folder as it goes.
const quit = async code => {
  try { if (chrome.exitCode === null) { const gone = new Promise(r => chrome.once('exit', r)); chrome.kill(); await Promise.race([gone, new Promise(r => setTimeout(r, 3000))]); } } catch {}
  try { rmSync(profile, { recursive: true, force: true, maxRetries: 5 }); } catch {}
  await site.close(); process.exit(code);
};
const wsUrl = await new Promise((resolve, reject) => {
  let buf = ''; const t = setTimeout(() => reject(new Error('Chrome did not start')), 20000);
  chrome.stderr.on('data', d => { buf += d; const m = buf.match(/DevTools listening on (ws:\/\/\S+)/); if (m) { clearTimeout(t); resolve(m[1]); } });
  chrome.on('exit', () => reject(new Error('Chrome exited: ' + buf.slice(-400))));
}).catch(e => { console.error(e.message); return quit(1); });
const ws = new WebSocket(wsUrl); await new Promise(r => ws.addEventListener('open', r, { once: true }));
let seq = 0; const waiting = new Map(), listeners = new Set();
ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && waiting.has(m.id)) { const [res, rej] = waiting.get(m.id); waiting.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); } else for (const l of listeners) l(m); });
const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const id = ++seq; waiting.set(id, [res, rej]); ws.send(JSON.stringify({ id, method, params, sessionId })); });
const once = (method, sessionId) => new Promise(res => { const l = m => { if (m.method === method && m.sessionId === sessionId) { listeners.delete(l); res(m.params); } }; listeners.add(l); });
const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId: S } = await send('Target.attachToTarget', { targetId, flatten: true });
await send('Page.enable', {}, S); await send('Runtime.enable', {}, S);
const run = async expr => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }, S); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: PHONE }, S);
if (REDUCE) await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }, S);
// Counted from outside the site's script, in every document: the repeating timers running and the intersection
// observers not disconnected, so that the walk can tell whether a page that has gone left any of its own behind.
await send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => {
  const si = window.setInterval, ci = window.clearInterval, live = new Map(), IO = window.IntersectionObserver, obs = new Set();
  window.setInterval = function (fn, ms, ...a) { const id = si(fn, ms, ...a); live.set(id, ms); return id; };
  window.clearInterval = function (id) { live.delete(id); return ci(id); };
  window.IntersectionObserver = class extends IO { constructor(cb, opt) { super(cb, opt); obs.add(this); } disconnect() { obs.delete(this); return super.disconnect(); } };
  window.__walk = { live: () => ({ intervals: [...live.values()], observers: obs.size }) };
})();` }, S);
const click = async (x, y) => {
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }, S);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 }, S);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 }, S);
};

// ---------- what the walk keeps track of ----------
const broken = [];
const breakRule = msg => { broken.push(msg); console.log(`   !! RULE BROKEN: ${msg}`); };
listeners.add(m => { if (m.method === 'Runtime.exceptionThrown' && m.sessionId === S) breakRule('the page threw: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).split('\n')[0]); });
let points = 0, over = 0, sections = 0, pictures = 0, high = 0, rules = null, shot = 0, lastStage = null;
// reachedOn[s]: the page, counted from 1, on which stage s was first reached
const fired = [], steps = [], byMarker = new Map(), visits = [], followed = [], reachedOn = [], said = [];
// n: the last of the clock's log entries reported. A swapped-in page shares the log of the document it came into.
let n = 0, tab = 0, sound = false, leaving = null, hidden = false;
if (SHOTS) { rmSync(SHOTS, { recursive: true, force: true }); mkdirSync(SHOTS, { recursive: true }); }
const snap = async label => {
  if (!SHOTS) return;
  const { data } = await send('Page.captureScreenshot', { format: 'png' }, S);
  const name = `${String(++shot).padStart(3, '0')}-${label}.png`;
  writeFileSync(join(SHOTS, name), Buffer.from(data, 'base64'));
  console.log(`   [screen saved: ${name}]`);
};
// Loads an address, as a new document: its own log, timers and sound, all from nothing.
const load = async url => {
  const loaded = once('Page.loadEventFired', S);
  await send('Page.navigate', { url }, S);
  await loaded;
  n = 0; tab++; sound = false;
  await run(`window.__walkTab = ${tab}`);
};
const settled = `(async () => { await document.fonts.ready; const t0 = Date.now(); while (!(window.__echo && __echo.status().page && __echo.status().page.settled) && Date.now() - t0 < 5000) await new Promise(r => setTimeout(r, 30)); })()`;

// A link on the page to the next one, as a reader would find it: a plain link to it if there is one, else one that
// names a place on it. One on screen, and not under anything, is clicked with the mouse; otherwise by script.
const findLink = to => run(`(() => {
  const to = ${JSON.stringify(to)}, all = [...document.querySelectorAll('a[href]')].filter(a => a instanceof HTMLAnchorElement);
  const where = a => a.closest('header') ? 'in the header' : a.closest('footer') ? 'in the footer' : 'on the page';
  const at = a => { for (const r of a.getClientRects()) { if (r.bottom <= 0 || r.top >= innerHeight || r.right <= 0 || r.left >= innerWidth) continue; const x = Math.min(Math.max(r.left + r.width / 2, 1), innerWidth - 1), y = Math.min(Math.max(r.top + r.height / 2, 1), innerHeight - 1), hit = document.elementFromPoint(x, y); if (hit && (hit === a || a.contains(hit))) return { x, y }; } return null; };
  for (const list of [all.filter(a => a.href === to), all.filter(a => a.href.split('#')[0] === to && a.hash)]) {
    for (const a of list) { const p = at(a); if (p) return { ...p, href: a.href, words: a.innerText.replace(/\\s+/g, ' ').trim(), where: where(a) }; }
    if (list.length) { window.__walkLink = list[0]; return { x: null, href: list[0].href, words: list[0].textContent.replace(/\\s+/g, ' ').trim(), where: where(list[0]) }; }
  }
  return null;
})()`);

// Everything about the page as it stands that should be the same however it was reached: one <main> with one page's
// data, exactly the page's own markers live, the clock's one timer and its two observers, the tab title.
const sameAsLoaded = async (page, want, stage) => {
  const r = await run(`(() => ({ mains: document.querySelectorAll('main').length, data: document.querySelectorAll('script[data-page]').length, marks: document.querySelectorAll('[data-mark]').length,
    clock: __echo.status().page.marks.length, title: document.title, live: window.__walk.live() }))()`);
  if (r.mains !== 1 || r.data !== 1) breakRule(`${page}: ${r.mains} <main> and ${r.data} sets of page data on the page`);
  if (r.marks !== want.marks || r.clock !== want.marks + 1) breakRule(`${page}: ${r.marks} markers on the page and ${r.clock - 1} in the clock, and the page has ${want.marks}`);
  const watches = r.live.intervals.filter(ms => ms === 250).length;
  if (watches !== 1 || r.live.observers !== 2) breakRule(`${page}: ${watches} clock timers and ${r.live.observers} observers running, and one page has 1 and 2`);
  if (r.title !== want.data.titles[stage]) breakRule(`${page}: the tab says "${r.title}", and the page's title at stage ${stage} is "${want.data.titles[stage]}"`);
  return r;
};

// The lines that say what the reader did, as they stand on the page: each must show one of its two wordings, and the
// one the clock chose for it.
const wordings = async page => {
  const look = () => run(`(() => { const st = +document.body.getAttribute('data-stage'); return [...document.querySelectorAll('.t')].filter(el => !el.closest('.plate')).map(el => {
    let s = st; while (s >= 1 && !el.hasAttribute('data-s' + s)) s--;
    if (s < 1 || !el.hasAttribute('data-if' + s)) return null;
    const text = el.textContent; return { test: el.getAttribute('data-if' + s), s, yes: text === el.getAttribute('data-s' + s), no: text === el.getAttribute('data-else' + s), text };
  }).filter(Boolean); })()`);
  let lines = await look();
  if (lines.some(l => !l.yes && !l.no)) { await sleep(1500); lines = await look(); }   // still scrambling into place
  for (const l of lines) {
    const chosen = [...said].reverse().find(d => d.test === l.test && d.page === page) || [...said].reverse().find(d => d.test === l.test);
    if (!l.yes && !l.no) breakRule(`${page}: the line checked by "${l.test}" reads "${l.text}", which is neither of its wordings`);
    else if (chosen && chosen.ok !== l.yes) breakRule(`${page}: the line checked by "${l.test}" shows its ${l.yes ? 'own' : 'plain'} wording, and the clock chose the other`);
  }
  return lines;
};

console.log(`Walking ${pages.join(', ')} at ${W} x ${H}, ${PACE} px/s, ${PAUSE} s at each picture, ${LINGER} s at the bottom, clock ${FAST}x fast, ${REDUCE ? 'reduced motion, ' : ''}`
  + `${CLICK ? 'clicking a link to each page' : 'loading each address'}, from a clean save.\n`);
try {
  for (let pi = 0; pi < pages.length; pi++) {
    const page = pages[pi], slug = page.replace(/\.html$/, '').replace(/[\\/]/g, '_'), want = built(page), target = site.url + page;
    let how = 'loaded';
    if (pi === 0 || !CLICK) await load(target + `?fast=${FAST}` + (pi === 0 ? '&reset' : ''));
    else {
      const link = await findLink(target);
      if (!link) { how = 'loaded: no link to it on the page before'; await load(target + `?fast=${FAST}`); }
      else {
        // across the swap: the header must be the same element, the sound still on and the old page's log finished
        await run(`window.__walkHead = document.querySelector('header.top')`);
        const before = await run(`__echo.status().page.path`);
        if (link.x !== null) await click(link.x, link.y); else await run(`window.__walkLink.click()`);
        how = `clicked "${link.words}" ${link.where}${link.x === null ? ' (by script: it is off the screen)' : ''}` + (link.href !== target ? `, which leads to ${link.href.slice(site.url.length)}` : '');
        const t0 = Date.now();
        let r = null;
        while (Date.now() - t0 < 10000) {
          r = await run(`({ tab: window.__walkTab, path: window.__echo && __echo.status().page && __echo.status().page.path })`).catch(() => null);
          if (r && (r.tab !== tab || r.path === want.data.path)) break;
          await sleep(30);
        }
        if (!r || r.tab !== tab) {
          breakRule(`the link to ${page} was followed the ordinary way, not swapped in`);
          await load(target + `?fast=${FAST}`);
        } else {
          await run(settled);
          const x = await run(`(async () => { await new Promise(r => setTimeout(r, 150)); const a = document.activeElement, h = document.querySelector('header.top');
            return { same: h === window.__walkHead, href: location.href, links: [...h.querySelectorAll('a')].map(a => ({ href: a.getAttribute('href'), current: a.getAttribute('aria-current') })),
              focus: a && a !== document.body ? a.tagName + (a.id ? '#' + a.id : '') + (a.closest('#main') ? ' in <main>' : '') : 'nothing', heading: !!(a && /^H[1-3]$/.test(a.tagName) && a.closest('#main')),
              told: [...document.querySelectorAll('[aria-live]')].map(e => e.textContent).filter(Boolean), title: document.title, stage: __echo.stage,
              sound: window.__sound && { on: __sound.on(), same: __sound.context() === window.__walkCtx, state: __sound.context() && __sound.context().state } }; })()`);
          const placed = link.href.includes('#');
          console.log(`   (${before} -> ${want.data.path}: header kept ${x.same ? 'yes' : 'NO'}, address ${x.href.slice(site.url.length - 1)}, focus on ${x.focus}, said "${x.told.join(' / ')}"` + (x.sound ? `, sound ${x.sound.on ? 'on' : 'off'}, ${x.sound.same ? 'same' : 'another'} audio context, ${x.sound.state}` : '') + ')');
          if (!x.same) breakRule(`${page}: the header is not the element it was before the swap`);
          if (x.href !== link.href) breakRule(`${page}: the address is ${x.href}, and the link was to ${link.href}`);
          const wanted = want.links.map(l => ({ href: l.go ? want.data.go[x.stage] : l.href, current: l.current }));
          const off = wanted.findIndex((l, k) => !x.links[k] || x.links[k].href !== l.href || x.links[k].current !== l.current);
          if (x.links.length !== wanted.length || off >= 0) breakRule(`${page}: the header's link ${off + 1} is ${JSON.stringify(x.links[off])}, and loading the page gives ${JSON.stringify(wanted[off])}`);
          if (!x.heading) breakRule(`${page}: focus is on ${x.focus}, not the new page's heading`);
          if (!x.told.includes(x.title)) breakRule(`${page}: the change of page was not announced (the live region says "${x.told.join(' / ')}")`);
          if (sound && (!x.sound || !x.sound.on || !x.sound.same || x.sound.state !== 'running')) breakRule(`${page}: the sound did not carry over the swap`);
          if (placed) console.log(`   (the link names a place on the page: the reader lands there, not at the top)`);
        }
      }
    }
    await run(settled);
    // In a new document, the sound is turned on the way a reader does, with the button in the header; a swapped-in page
    // must keep it going.
    if (CLICK && !sound) {
      const b = await run(`(() => { const b = document.getElementById('snd'), r = b && b.getBoundingClientRect(); return r && r.width ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null; })()`);
      if (b) await click(b.x, b.y); else await run(`document.getElementById('snd').click()`);
      const s = await run(`(async () => { await new Promise(r => setTimeout(r, 300)); window.__walkCtx = __sound.context(); return { on: __sound.on(), state: __walkCtx && __walkCtx.state }; })()`);
      console.log(`   (sound turned on: ${s.on ? 'on' : 'off'}, audio context ${s.state})`);
      if (!s.on || s.state !== 'running') breakRule(`${page}: the sound would not start`); else sound = true;
    }
    // where each marker is before any scrolling, for the trace: those in the first screen wait out the page's first moments
    const start = await run(`(() => { const st = __echo.status(); const log = __echo.log; return { st, rules: __echo.rules, seen: log.length ? log[log.length - 1].n : 0, first: [...document.querySelectorAll('#main [data-mark]')].map(el => el.getClientRects().length > 0 && el.getBoundingClientRect().top < innerHeight) }; })()`);
    rules = start.rules;
    const st = start.st, arrived = st.stage, firstScreen = start.first, known = start.seen;   // what the clock did before it was asked is in st already
    console.log(`== ${page}   ${how}; opened at stage ${arrived}, score ${st.score}` + (st.next !== null ? `, stage ${st.due + 1} due at ${st.next}` : '') + (st.due > arrived ? `   (stage ${st.due} is due and waiting for a marker)` : '') + (st.page.scores ? '' : '   (this page scores nothing)'));
    if (st.page.path !== want.data.path) breakRule(`${page}: the clock says it is reading ${st.page.path}`);
    if (arrived < high) breakRule(`${page} opened at stage ${arrived}, below the stage already reached (${high})`);
    high = Math.max(high, arrived);
    const behind = st.page.pictures.map(p => `${p.name} ${p.stage}${p.stepped ? ' (never behind)' : ''}`);
    console.log(`   pictures: ${behind.join(', ')}`);
    for (const p of st.page.pictures) { const want = p.stepped ? arrived : Math.max(0, arrived - 1); if (p.stage !== want) breakRule(`${page}: picture "${p.name}" opened at stage ${p.stage}, not ${want}`); }
    await sameAsLoaded(page, want, arrived);
    // Each picture's stage from here on, as the clock reports each change. Opening the page may put a picture at any
    // stage; after that it rises one stage at a time, whether catching up or moving with a stage.
    const at = new Map(st.page.pictures.map(p => [p.name, p.stage])), caught = new Map();
    const rise = (name, from, to, how) => {
      if (at.get(name) !== from) breakRule(`${page}: picture "${name}" was at stage ${at.get(name)}, and the clock says it went from ${from}`);
      if (to < from) breakRule(`${page}: picture "${name}" went down from stage ${from} to ${to} ${how}`);
      if (to > from + 1) breakRule(`${page}: picture "${name}" went from stage ${from} to ${to} at once, ${how}`);
      at.set(name, to);
    };
    console.log(`   markers: ${st.page.marks.map(m => `${m.i} ${m.name}${firstScreen[m.i] ? ' (first screen)' : ''}${m.end ? ' (the ending)' : ''}`).join(', ')}`);
    for (let k = 0; k <= arrived; k++) if (reachedOn[k] === undefined) reachedOn[k] = pi + 1;
    await snap(`${slug}-opened-s${arrived}`);

    let y = 0, max = 1;
    const paused = new Set(), visit = { page, how, arrived, left: arrived, points: 0, over: 0, scores: st.page.scores };
    visits.push(visit);
    const report = async (events) => {
      let shotOf = null;
      for (const e of events) {
        // the page before may have logged something between the walk's last look at it and the swap
        if (e.page !== want.data.path && leaving && e.page === leaving.path && e.n <= known) { await leaving.report([e]); continue; }
        if (e.page !== want.data.path) { breakRule(`the clock logged ${e.type} "${e.name || e.test || e.to || ''}" for ${e.page} while ${page} was being read`); continue; }
        const where = `y ${String(e.y).padStart(6)} ${String(Math.round(e.y / max * 100)).padStart(3)}%  t ${String(e.age ?? '').padStart(5)}`;
        if (e.type === 'point' && e.over) {
          // the page has added all it can (the rules' cap): the point is kept in the save and the score stays put
          over++; visit.over++;
          console.log(`   ${where}   (point   ${e.why} "${e.name}", over the page's ${rules.cap})`.padEnd(73) + `score ${e.score}`);
          if (e.score !== points) breakRule(`the page's score (${e.score}) and the points it reported (${points}) disagree`);
          if (!visit.scores) breakRule(`${page} scores nothing, and scored a point for ${e.why} "${e.name}"`);
        } else if (e.type === 'point') {
          points++; visit.points++; e.why === 'section' ? sections++ : pictures++;
          console.log(`   ${where}   point    ${e.why} "${e.name}"`.padEnd(73) + `score ${e.score}` + (e.due < rules.due.length ? `, stage ${e.due + 1} due at ${rules.due[e.due]}` : ''));
          if (e.score !== points) breakRule(`the page's score (${e.score}) and the points it reported (${points}) disagree`);
          if (!visit.scores) breakRule(`${page} scores nothing, and scored a point for ${e.why} "${e.name}"`);
        } else if (e.type === 'stage') {
          // the same marker caught its picture up a moment before: the stage was held back so both could be seen
          const before = e.mark !== null ? caught.get(e.mark) : null, gap = before ? (e.t - before.t) / 1000 * FAST : 0;
          const apart = lastStage ? (e.t - lastStage) / 1000 * FAST : null;
          console.log(`   ${where}   STAGE ${e.from} -> ${e.to}`.padEnd(55) + (e.mark !== null ? `at marker ${e.mark} (${e.at})` : `by ${e.why}`) + `, score ${e.score}` + (before ? `, ${gap.toFixed(1)} s after its picture caught up there` : '') + (apart !== null ? `, ${apart.toFixed(1)} s after the last stage` : ''));
          if (before) followed.push({ page, name: before.name, gap });
          if (e.pictures.length) console.log(`   ${''.padStart(13)}   with it: ${e.pictures.map(([name, a, b]) => `${name} ${a}->${b}`).join(', ')}`);
          if (e.n > known) for (const [name, a, b] of e.pictures) rise(name, a, b, `with stage ${e.to}`);
          fired.push({ page, ...e });
          if (e.to < e.from || e.to < high) breakRule(`stage went down to ${e.to}`);
          if (e.to !== e.from + 1) breakRule(`stage jumped from ${e.from} to ${e.to}`);
          if (e.mark !== null) { const k = page + ' ' + pi + ' ' + e.mark; byMarker.set(k, (byMarker.get(k) || 0) + 1); if (byMarker.get(k) > 1) breakRule(`two stages fired at marker ${e.mark} on ${page}`); }
          if (e.age !== null && e.age < rules.settle) breakRule(`stage ${e.to} fired ${e.age} s after ${page} opened, inside its first ${rules.settle} s`);
          if (apart !== null && apart < rules.space - 0.05) breakRule(`stage ${e.to} fired ${apart.toFixed(1)} s after the last, closer than ${rules.space} s`);
          if (e.to === 6 && e.from < 5) breakRule(`stage 6 fired at stage ${e.from}`);
          if (e.to <= 5 && points < rules.due[e.to - 1]) breakRule(`stage ${e.to} fired with ${points} points, and it is due at ${rules.due[e.to - 1]}`);
          if (e.to <= 5 && e.why !== 'marker' && e.why !== 'the end of the page') breakRule(`stage ${e.to} came from ${e.why}, not a marker`);
          lastStage = e.t; if (reachedOn[e.to] === undefined) reachedOn[e.to] = pi + 1;
          high = Math.max(high, e.to); visit.left = e.to; shotOf = `stage${e.to}-at-${(e.at || e.why).replace(/[^a-z0-9]+/gi, '_')}`;
        } else if (e.type === 'step') {
          console.log(`   ${where}   catch up picture "${e.name}" ${e.from} -> ${e.to}`.padEnd(73) + (e.how === 'marker' ? `at its marker (${e.mark})` : 'after a look'));
          if (e.n > known) rise(e.name, e.from, e.to, 'catching up');
          if (e.age !== null && e.age < rules.settle) breakRule(`picture "${e.name}" caught up ${e.age} s after ${page} opened, inside its first ${rules.settle} s`);
          if (e.mark !== null) caught.set(e.mark, e);
          steps.push({ page, ...e }); shotOf = shotOf || `${e.name}-caught-up-${e.from}to${e.to}`;
        } else if (e.type === 'said') {
          console.log(`   ${where}   said     "${e.test}" at stage ${e.stage}: ${e.ok ? 'yes' : 'no '}`.padEnd(73) + `"${e.text}"`);
          said.push({ page, ...e });
        }
      }
      // the screen a moment later, once the words have finished changing
      if (shotOf && SHOTS) { await sleep(1400); await snap(`${slug}-${shotOf}`); }
    };
    const poll = async (scroll = 0) => {
      const r = await run(`(() => { if (${scroll}) window.scrollBy(0, ${scroll}); const vh = innerHeight; return { y: Math.round(scrollY), max: document.documentElement.scrollHeight - vh, vh, stage: __echo.stage, hidden: document.hidden,
        events: __echo.since(${n}), shown: __echo.status().page.pictures.map(p => [p.name, p.stage]),
        plates: [...document.querySelectorAll('#main .plate')].map(p => { const b = (p.querySelector('.plate__img') || p).getBoundingClientRect(); return [p.getAttribute('data-scene'), b.top, b.height]; }) }; })()`);
      if (r.events.length) n = r.events[r.events.length - 1].n;
      y = r.y; max = Math.max(1, r.max);
      if (r.stage < high) breakRule(`stage went down from ${high} to ${r.stage}`);
      // a page the browser has hidden keeps no time and sees no scrolling, so nothing after this can be measured
      if (r.hidden && !hidden) { hidden = true; breakRule(`${page}: the browser hid the page (did the machine sleep?), so the clock stopped and this walk measures nothing from here`); }
      await report(r.events);
      // what each picture shows now, against what the clock has said about it
      for (const [name, s] of r.shown) if (at.get(name) !== s) { breakRule(`${page}: picture "${name}" is showing stage ${s}, and the clock last said ${at.get(name)}`); at.set(name, s); }
      return r;
    };
    const step = Math.max(1, Math.round(PACE / 20));
    for (let r = await poll(); ; ) {
      // stop at a picture once its top is a little over halfway up the screen, before the usual marker
      const stop = r.plates.find(([name, top, h]) => !paused.has(name) && top <= r.vh * 0.55 && top + h > r.vh * 0.2);
      if (stop) {
        paused.add(stop[0]);
        const info = await run(`(() => { const p = __echo.status().page.pictures.find(p => p.name === ${JSON.stringify(stop[0])}); return p && [p.stage, __echo.stage]; })()`);
        console.log(`   y ${String(y).padStart(6)} ${String(Math.round(y / max * 100)).padStart(3)}%           stop at  picture "${stop[0]}"` + (info ? `, showing stage ${info[0]} with the words at ${info[1]}` : ''));
        if (info) await snap(`${slug}-at-${stop[0]}-picture-s${info[0]}-words-s${info[1]}`);
        const until = Date.now() + PAUSE / FAST * 1000;
        while (Date.now() < until) { await sleep(150); r = await poll(); }
        continue;
      }
      if (y >= max - 1) {
        // at the bottom: read the last screen, which gives the last section, any look and the page's end their time
        const until = Date.now() + LINGER / FAST * 1000;
        while (Date.now() < until) { await sleep(150); r = await poll(); }
        break;
      }
      await sleep(50);
      r = await poll(step);
    }
    const end = await run('__echo.status()');
    const lines = await wordings(want.data.path);
    console.log(`   left at stage ${end.stage}, score ${end.score}` + (end.next !== null ? `, stage ${end.due + 1} due at ${end.next}` : '') + `; ${end.page.sections.filter(s => s.read).length} of ${end.page.sections.length} sections read` + (end.page.coming ? '; a stage was on its way, and stays due' : '') + '\n'
      + `   markers: ${end.page.marks.map(m => `${m.i} ${m.spent ? (m.early ? 'spent on arrival' : 'used') : m.waiting ? 'armed' : 'not reached'}`).join(', ')}`
      + (lines.length ? `\n   lines that say what the reader did, as they stand: ${lines.map(l => `"${l.test}" ${l.yes ? 'yes' : l.no ? 'no' : '?'}`).join(', ')}` : '') + '\n');
    await snap(`${slug}-bottom-s${end.stage}`);
    leaving = { path: want.data.path, report };
  }

  // ---------- summary ----------
  const final = await run('__echo.status()');
  console.log('Summary');
  for (const v of visits) console.log(`  ${v.page.padEnd(36)} opened at stage ${v.arrived}, left at ${v.left}, ${v.points} points` + (v.over ? ` (and ${v.over} over the page's ${rules.cap})` : '') + `   ${v.how}`);
  console.log(`  points: ${points} (${sections} sections, ${pictures} pictures)` + (over ? `, and ${over} more over a page's ${rules.cap}` : '') + `; the page's own score ${final.score}`);
  console.log(`  stages fired: ${fired.map(f => `${f.to} on ${f.page} at ${f.mark !== null ? `marker ${f.mark} (${f.at})` : f.why}`).join('; ') || 'none'}`);
  console.log(`  pictures caught up: ${steps.filter(s => s.how === 'marker').length} at their marker, ${steps.filter(s => s.how !== 'marker').length} after a look`);
  console.log(`  stages that followed their marker's picture catching up: ${followed.map(f => `"${f.name}" ${f.gap.toFixed(1)} s`).join(', ') || 'none'}`);
  console.log(`  saved: stage ${final.stage}, ${final.read.length} sections read, pictures looked at (seconds): ${Object.entries(final.seen).map(([k, v]) => `${k} ${Math.round(v)}`).join(', ')}`);
  const opened = final.pages.map(p => p[0]);
  console.log(`  pages opened: ${opened.join(', ') || 'none'}`);
  for (const v of visits) {
    const path = built(v.page).data.path;
    if (v.scores && !opened.includes(path)) breakRule(`${v.page} was not recorded as a page opened`);
    if (!v.scores && opened.includes(path)) breakRule(`${v.page} scores nothing, and was recorded as a page opened`);
  }
  if (final.score !== points) breakRule(`the saved score (${final.score}) is not the ${points} points scored`);
  console.log(`  stage reached on page: ${reachedOn.map((p, k) => p !== undefined ? `${k} on ${p}` : null).filter(Boolean).join(', ')}`);
  // each line that says what the reader did, each time a stage reached it (the ticker's twice: it runs as two copies)
  const tests = [...new Set(said.map(d => d.test))];
  console.log(`  lines that say what the reader did: ${tests.map(t => `"${t}" ${said.filter(d => d.test === t).map(d => `${d.ok ? 'yes' : 'no'} on ${d.page}`).filter((x, i, a) => a.indexOf(x) === i).join(', ')}`).join('; ') || 'none shown'}`);
  for (const x of EXPECT) {
    const on = reachedOn[x.stage], ok = on === undefined ? x.by === Infinity : on >= x.from && on <= x.by;
    const want = x.by === Infinity ? `not before page ${x.from}` : x.from > 1 ? `on page ${x.from === x.by ? x.from : `${x.from} to ${x.by}`}` : `by page ${x.by}`;
    console.log(`  pacing ${x.text.padEnd(8)} stage ${x.stage} ${want}: ${on === undefined ? 'never reached' : `reached on page ${on}`}  ${ok ? 'ok' : 'FAILED'}`);
    if (!ok) broken.push(`pacing check ${x.text} failed`);
  }
  for (const x of SAID) {
    const last = [...said].reverse().find(d => d.test === x.test), ok = !!last && last.ok === x.yes;
    console.log(`  wording ${x.text.padEnd(10)} ${last ? `ended up ${last.ok ? 'yes' : 'no'}, on ${last.page}: "${last.text}"` : 'never shown'}  ${ok ? 'ok' : 'FAILED'}`);
    if (!ok) broken.push(`wording check ${x.text} failed`);
  }
  console.log(broken.length ? `\n${broken.length} rule${broken.length > 1 ? 's' : ''} broken` : '\nNo rule broken.');
} catch (e) { console.error('\n' + e.message); await quit(1); }
await quit(broken.length ? 1 : 0);
