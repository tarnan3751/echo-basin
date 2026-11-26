// node preview.mjs : photographs one picture on its own, at each stage, at the wide layout and at the phone layout, for
// whoever is drawing it. The picture need not be registered anywhere first: it is drawn straight from its own module
// and put on a throwaway page, in a temporary folder outside the repo, inside an ordinary picture frame made by the
// site's own markup (plateOf() in src/html.mjs), with the site's own stylesheet, script and fonts (src/site.mjs). So it
// is drawn, stippled and staged exactly as the site will do it, nothing shared has to be edited to see it, and any
// number of people can use it at once.
//
//   node preview.mjs src/scene-depth.mjs depth --start 2000,100
//       a picture that is not registered yet: its module, the name of the function it exports (which returns
//       { svg, vb, vbm?, layers?, flat? } like the others), and the two counters it numbers itself from, ids and grain
//       patterns (see START in src/scenes.mjs). The grain numbers decide where its stipple falls, so give it the row it
//       is going to have.
//   node preview.mjs meadow
//       a registered picture, drawn as src/scenes.mjs draws it, with the shape and classes it has on the built site
//
//   --stages 0,3,5     only these stages (all seven unless given)
//   --ar 560/692       its shape at the wide layout (the shape of its viewBox unless given)
//   --arm 360/860      its shape at the phone layout (the shape of its phone viewBox, vbm, unless given)
//   --narrow 700       the window width below which its phone layout is used (700 unless given)
//   --cls plate--info  its classes on the page: plate--info for a printed card or diagram, plate--bleed for a picture
//                      that runs the full width of the screen
//   --width 560        its width in pixels at the wide layout (its viewBox's width unless given, and never wider than
//                      the page's column). On a phone it takes the column's width, as on the site.
//
// For each stage it writes shots/preview/<name>-desktop-s<N>.png (in a 1280-pixel window) and <name>-phone-s<N>.png
// (390 pixels), each cropped to the picture, and prints how many of the picture's staged groups are showing. It exits
// with 1 if the picture throws while being drawn, or the page throws while showing it.
// The pictures are taken the way shots.mjs takes pages: the stage forced with ?stage=N, the wear off, the clock held at
// one moment, everything that moves by itself stopped, and all the grain filled in first. The picture is photographed
// in the middle of the screen, where its layers sit as drawn, without the drift that scrolling gives them.
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { scenes, START } from './src/scenes.mjs';
import { startAt, counters } from './src/lib.mjs';
import { plateOf } from './src/html.mjs';
import { page, shared } from './src/site.mjs';

const ROOT = fileURLToPath(new URL('.', import.meta.url)), DIST = join(ROOT, 'dist'), OUT = join(ROOT, 'shots', 'preview');
const USAGE = `usage: node preview.mjs src/scene-x.mjs <function> --start ids,grains [--stages 0,3,5] [--ar w/h] [--arm w/h] [--narrow px] [--cls classes] [--width px]
       node preview.mjs <registered picture> [the same options, without --start]`;
const stop = msg => { console.error(msg); process.exit(1); };

// ---------- what to draw ----------
// options are --name value or --name=value, and all of them take a value
const o = {}, args = [], argv = process.argv.slice(2), OPTIONS = ['start', 'stages', 'ar', 'arm', 'narrow', 'cls', 'width'];
for (let i = 0; i < argv.length; i++) {
  if (!argv[i].startsWith('--')) { args.push(argv[i]); continue; }
  const k = argv[i].slice(2), eq = k.indexOf('=');
  if (eq >= 0) o[k.slice(0, eq)] = k.slice(eq + 1); else o[k] = argv[++i];
}
if (!args.length) stop(USAGE);
for (const k in o) if (!OPTIONS.includes(k)) stop(`there is no option --${k}\n${USAGE}`); else if (o[k] === undefined) stop(`--${k} needs a value\n${USAGE}`);
const stages = String(o.stages ?? '0,1,2,3,4,5,6').split(',').map(Number);
if (!stages.every(s => Number.isInteger(s) && s >= 0 && s <= 6)) stop('--stages takes stages from 0 to 6, such as 0,3,5');

const fromModule = /\.m?js$/.test(args[0]) || /[\\/]/.test(args[0]);
let name, start, sc;
if (fromModule) {
  name = args[1];
  if (!name) stop(`Name the function ${args[0]} exports that draws the picture.\n${USAGE}`);
  start = String(o.start ?? '').split(',').map(Number);
  if (o.start === undefined || start.length !== 2 || !start.every(n => Number.isInteger(n) && n >= 0)) stop(`--start ids,grains is needed: the two counters ${name} numbers itself from (see START in src/scenes.mjs).`);
} else {
  name = args[0];
  if (!START[name]) stop(`"${name}" is not a registered picture. Registered: ${Object.keys(START).join(', ')}.\nOne that is not registered yet is given as its module and function:\n${USAGE}`);
  if (o.start !== undefined) console.log(`(--start left out: a registered picture starts where src/scenes.mjs says, at ${START[name].join(', ')})`);
  start = START[name];
}
try {
  if (fromModule) {
    const file = resolve(args[0]);
    if (!existsSync(file)) stop(`${args[0]} does not exist.`);
    const mod = await import(pathToFileURL(file).href);
    if (typeof mod[name] !== 'function') stop(`${args[0]} exports no function called ${name}. It exports: ${Object.keys(mod).filter(k => typeof mod[k] === 'function').join(', ') || 'no functions'}.`);
    startAt(start);
    sc = mod[name]();
  } else sc = scenes[name]();
} catch (e) { console.error(`${name} threw while being drawn:\n`); console.error(e); process.exit(1); }
const now = counters(), used = [now[0] - start[0], now[1] - start[1]];
const box4 = v => Array.isArray(v) && v.length === 4 && v.every(Number.isFinite);
if (!sc || !box4(sc.vb) || (sc.vbm !== undefined && !box4(sc.vbm)) || !(typeof sc.svg === 'string' || (Array.isArray(sc.layers) && sc.layers.length && sc.layers.every(l => typeof l === 'string'))))
  stop(`${name} returned ${sc && typeof sc === 'object' ? `{ ${Object.keys(sc).join(', ')} }` : String(sc)}, not { svg, vb, vbm?, layers?, flat? } with vb and vbm as four numbers.`);

// A registered picture keeps the shape, classes and narrow width it is given on the built site, where it can be found.
const site = {};
if (!fromModule && existsSync(DIST)) {
  const html = (function walk(dir) { return readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith('.html') ? [join(dir, e.name)] : []); })(DIST);
  const re = new RegExp(`<figure class="plate ?([^"]*)" data-scene="${name}"[^>]*><div class="plate__frame"><div class="plate__img" style="--ar:([^;"]*);--arm:([^"]*)"([^>]*)>`);
  for (const f of html) { const m = re.exec(readFileSync(f, 'utf8')); if (m) { Object.assign(site, { cls: m[1].trim(), ar: m[2], arm: m[3], narrow: /data-vbm-max="(\d+)"/.exec(m[4])?.[1], page: relative(ROOT, f) }); break; } }
}
const ar = o.ar ?? site.ar ?? `${sc.vb[2]}/${sc.vb[3]}`;
const arm = o.arm ?? site.arm ?? (sc.vbm ? `${sc.vbm[2]}/${sc.vbm[3]}` : ar);
const narrow = o.narrow ?? site.narrow, cls = o.cls ?? site.cls ?? '', width = +(o.width ?? sc.vb[2]);
const bleed = /(^|\s)plate--bleed(\s|$)/.test(cls);

const fig = plateOf(name, sc, { cls, ar, arm, narrow, mark: false });
console.log(`${name}${fromModule ? ` from ${args[0]}` : ''}: ${(Buffer.byteLength(fig) / 1024).toFixed(0)} KB on the page. Numbered from ${start.join(', ')}: uses ${used[0]} ids and ${used[1]} grain patterns.`);
console.log(`Shape ${ar}, and ${arm} below ${narrow || 700} px` + (cls ? `; classes ${cls}` : '') + (bleed ? '; the full width of the screen' : `; at most ${width} px wide`) + (site.page ? `   (as on ${site.page})` : ''));
// A new picture's numbers must not run into a registered one's (pictures.lock.json has how many each uses).
const LOCK = join(ROOT, 'pictures.lock.json');
if (fromModule && existsSync(LOCK)) {
  const lock = JSON.parse(readFileSync(LOCK, 'utf8')), mine = Object.keys(START).filter(n => lock[n] && n !== name);
  const free = [0, 1].map(k => Math.max(...mine.map(n => START[n][k] + lock[n][k ? 'grains' : 'ids'])));
  for (const n of mine) for (const [k, key, what] of [[0, 'ids', 'ids'], [1, 'grains', 'grain patterns']]) {
    const s = START[n][k], len = lock[n][key];
    if (used[k] > 0 && len > 0 && start[k] < s + len && s < start[k] + used[k]) console.log(`  warning: its ${what} (${start[k]} to ${start[k] + used[k] - 1}) overlap those of ${n} (${s} to ${s + len - 1}). The registered pictures leave ${free.join(', ')} free.`);
  }
}

// ---------- the throwaway page ----------
// Room above and below the picture, so that it can be scrolled to the middle of the screen. A picture that runs the
// full width sits straight in the page, as on the site; any other sits in the page's column.
const room = '<div style="height:100vh" aria-hidden="true"></div>';
const body = bleed ? fig : `<div class="wrap"><div style="max-width:${width}px;margin-inline:auto">${fig}</div></div>`;
const tmp = mkdtempSync(join(tmpdir(), 'echo-preview-'));
for (const [f, data] of [...shared(), ['index.html', page({ path: 'index.html', titles: Array(7).fill(`${name} (preview)`), description: `${name}, previewed`, score: false, main: () => room + body + room })]]) {
  mkdirSync(dirname(join(tmp, f)), { recursive: true }); writeFileSync(join(tmp, f), data);
}

// ---------- the browser, as in shots.mjs ----------
const CHROME = process.env.CHROME || ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium', '/usr/bin/google-chrome', '/usr/bin/chromium'].find(existsSync);
if (!CHROME) { rmSync(tmp, { recursive: true, force: true }); stop('No Chrome found. Set CHROME to its path.'); }
const profile = mkdtempSync(join(tmpdir(), 'echo-preview-chrome-'));
const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
// Chrome is given a moment to exit before its profile is removed, or it can write into the folder as it goes.
const quit = async code => {
  try { if (chrome.exitCode === null) { const gone = new Promise(r => chrome.once('exit', r)); chrome.kill(); await Promise.race([gone, new Promise(r => setTimeout(r, 3000))]); } } catch {}
  for (const d of [profile, tmp]) try { rmSync(d, { recursive: true, force: true, maxRetries: 5 }); } catch {}
  process.exit(code);
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
const threw = [];
listeners.add(m => { if (m.method === 'Runtime.exceptionThrown' && m.sessionId === S) threw.push((m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).split('\n')[0]); });
// the clock held at one moment, as in shots.mjs, for the stages that write the reader's own date and time
await send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { const D = Date, T = new D(2026, 5, 20, 14, 7, 0).getTime(); const F = function (...a) { return a.length ? new D(...a) : new D(T); }; F.now = () => T; F.parse = D.parse; F.UTC = D.UTC; F.prototype = D.prototype; window.Date = F; })();` }, S);
const run = async expr => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }, S); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };

// ---------- the photographs ----------
const SIZES = [[1280, 900, 'desktop'], [390, 800, 'phone']], url = pathToFileURL(join(tmp, 'index.html')).href;
mkdirSync(OUT, { recursive: true });
const written = [];
try {
  for (const stage of stages) {
    const got = [];
    for (const [w, h, label] of SIZES) {
      const metrics = height => send('Emulation.setDeviceMetricsOverride', { width: w, height, deviceScaleFactor: 1, mobile: label === 'phone' }, S);
      await metrics(h);
      const loaded = once('Page.loadEventFired', S);
      await send('Page.navigate', { url: `${url}?stage=${stage}&wear=0` }, S);
      await loaded;
      const g = await run(`(async () => {
        await document.fonts.ready;
        document.head.appendChild(Object.assign(document.createElement('style'), { textContent: '*,*::before,*::after{animation:none!important;transition:none!important}' }));
        const fig = document.querySelector('#main .plate');
        fig.classList.add('in');
        if (window.Grain) { window.Grain.fillAll(document); const t0 = Date.now(); while (window.Grain.pending() > 0 && Date.now() - t0 < 30000) await new Promise(r => setTimeout(r, 60)); }
        await Promise.all([...document.querySelectorAll('image.gr')].map(i => i.decode ? i.decode().catch(() => {}) : null));
        // a staged group is showing when neither it nor any group it sits in is hidden at this stage
        const groups = [...fig.querySelectorAll('[data-from],[data-until]')];
        const showing = groups.filter(el => { for (let e = el; e && e !== fig; e = e.parentElement) if (e.style && e.style.display === 'none') return false; return true; }).length;
        return { stage: +document.body.getAttribute('data-stage'), groups: groups.length, showing, h: fig.getBoundingClientRect().height, head: document.querySelector('.top').getBoundingClientRect().height };
      })()`);
      if (g.stage !== stage) throw new Error(`the page is at stage ${g.stage}, not ${stage}`);
      // a window tall enough to hold the whole picture clear of the header, with the picture in the middle of it
      const tall = Math.max(h, Math.ceil(g.h + 2 * (g.head + 24)));
      if (tall !== h) await metrics(tall);
      const b = await run(`(async () => {
        const fig = document.querySelector('#main .plate'), r0 = fig.getBoundingClientRect();
        window.scrollTo(0, scrollY + r0.top + r0.height / 2 - innerHeight / 2);
        await new Promise(r => setTimeout(r, 350));
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        const r = fig.getBoundingClientRect();
        return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height, page: document.documentElement.clientWidth };
      })()`);
      // a little room around the frame for the coloured plate behind it, which sits a few pixels off
      const pad = bleed ? 0 : 18, x0 = Math.max(0, Math.floor(b.x - pad)), x1 = Math.min(b.page, Math.ceil(b.x + b.w + pad));
      const { data } = await send('Page.captureScreenshot', { format: 'png', clip: { x: x0, y: Math.floor(b.y - pad), width: x1 - x0, height: Math.ceil(b.h + 2 * pad), scale: 1 } }, S);
      const file = `${name}-${label}-s${stage}.png`;
      writeFileSync(join(OUT, file), Buffer.from(data, 'base64')); written.push(file);
      got.push({ ...g, label, w: Math.round(b.w), h: Math.round(b.h) });
    }
    const [d, p] = got;
    console.log(`stage ${stage}   ${d.showing} of ${d.groups} staged groups showing` + (p.showing !== d.showing ? ` (${p.showing} on the phone)` : '') + `   desktop ${d.w} x ${d.h}, phone ${p.w} x ${p.h}`);
  }
  console.log(`\n${written.length} images in shots/preview/: ${name}-desktop-s<N>.png and ${name}-phone-s<N>.png`);
} catch (e) { console.error('\n' + e.message); await quit(1); }
if (threw.length) { console.error(`\nThe page threw while showing ${name}:\n  ${[...new Set(threw)].join('\n  ')}`); await quit(1); }
await quit(0);
