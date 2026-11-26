// node shots.mjs : photographs every built page at every stage, so a change can be looked at before it is kept.
// It opens each .html file under dist/ in a headless Chrome, forces each stage in turn with ?stage=N (which changes
// the words and pictures without any scrolling), and saves the whole page as one image in shots/. The "not found"
// page, whose addresses only work on a server, is opened through serve.mjs at an address that is not on the site.
//
//   node shots.mjs                      every page, stages 0 to 6, desktop width
//   node shots.mjs --stages 0,4,6       only those stages
//   node shots.mjs --phone              a phone's width as well
//   node shots.mjs --only index         only pages whose path contains "index"
//   node shots.mjs --wear --at .3,.7    with the wear on, one screen each at those points down the page
//
// Nothing to install: it drives the Chrome already on the machine over its debugging socket. Set CHROME to the
// program's path if it is not in the usual place.
// The clock is held at one moment (2:07 pm on June 20) and everything that moves by itself is stopped, so the same
// page gives the same image, byte for byte, on every run, and two sets can be compared file by file.
// The pictures are taken with the page at the top and the wear (darkening, colour draining, misregistration, grain)
// turned off with ?wear=0, so they show only what each stage says and draws, which is what needs checking. --wear
// leaves it on, and --at takes the screen part-way down instead of the whole page, to see the wear at a stage. To see
// pictures one stage behind the words as a reader meets them, use node walk.mjs --shots.
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { serve } from './serve.mjs';

const ROOT = fileURLToPath(new URL('.', import.meta.url)), DIST = join(ROOT, 'dist'), OUT = join(ROOT, 'shots');
const arg = (name, dflt) => { const i = process.argv.indexOf('--' + name); return i < 0 ? dflt : (process.argv[i + 1] ?? true); };
const stages = String(arg('stages', '0,1,2,3,4,5,6')).split(',').map(Number);
const widths = [[1280, 900, 'desktop'], ...(process.argv.includes('--phone') ? [[390, 800, 'phone']] : [])];
const only = arg('only', ''), WEAR = process.argv.includes('--wear'), AT = arg('at', '') ? String(arg('at')).split(',').map(Number) : null;
const CHROME = process.env.CHROME || ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium', '/usr/bin/google-chrome', '/usr/bin/chromium'].find(existsSync);
if (!CHROME) { console.error('No Chrome found. Set CHROME to its path.'); process.exit(1); }

const pages = (function walk(dir) { return readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith('.html') ? [join(dir, e.name)] : []); })(DIST)
  .filter(p => !only || relative(DIST, p).includes(only)).sort();
if (!pages.length) { console.error('No pages under dist/. Run node build.mjs first.'); process.exit(1); }

const profile = mkdtempSync(join(tmpdir(), 'echo-shots-'));
const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
// Chrome is given a moment to exit before its profile is removed, or it can write into the folder as it goes.
// The "not found" page is the one page whose addresses are not relative to itself (its stylesheet and script are found
// from the site's base path), so it is photographed as a reader meets it: served, at an address that is not on the site.
let site = null;
const addressOf = async file => {
  if (relative(DIST, file) !== '404.html') return pathToFileURL(file).href;
  site = site || await serve();
  return site.url + 'trails/no-such-trail/';
};
const quit = async code => {
  try { if (chrome.exitCode === null) { const gone = new Promise(r => chrome.once('exit', r)); chrome.kill(); await Promise.race([gone, new Promise(r => setTimeout(r, 3000))]); } } catch {}
  try { rmSync(profile, { recursive: true, force: true, maxRetries: 5 }); } catch {}
  if (site) await site.close();
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
await send('Page.enable', {}, S);
// From stage 5 the pages write the visitor's own date and time into themselves, so the clock is held still here:
// the same page photographs the same way on every run, and two sets of pictures can be compared file for file.
await send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { const D = Date, T = new D(2026, 5, 20, 14, 7, 0).getTime(); const F = function (...a) { return a.length ? new D(...a) : new D(T); }; F.now = () => T; F.parse = D.parse; F.UTC = D.UTC; F.prototype = D.prototype; window.Date = F; })();` }, S);
const run = async expr => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }, S); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };

mkdirSync(OUT, { recursive: true });
let count = 0;
try {
  for (const file of pages) for (const [w, h, label] of widths) for (const stage of stages) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: label === 'phone' }, S);
    const loaded = once('Page.loadEventFired', S);
    await send('Page.navigate', { url: await addressOf(file) + '?stage=' + stage + (WEAR ? '' : '&wear=0') }, S);
    await loaded;
    // every picture's grain, not only the ones near the top; then wait for fonts and for the grain to finish
    const got = await run(`(async () => {
      await document.fonts.ready;
      // stop everything that moves by itself (the ticker, the stars, the cursor), so two runs give the same picture
      document.head.appendChild(Object.assign(document.createElement('style'), { textContent: '*,*::before,*::after{animation:none!important;transition:none!important}' }));
      document.querySelectorAll('.plate').forEach(p => p.classList.add('in'));
      if (window.Grain) { window.Grain.fillAll(document); const t0 = Date.now(); while (window.Grain.pending() > 0 && Date.now() - t0 < 30000) await new Promise(r => setTimeout(r, 60)); }
      // the grain arrives as images that still have to be decoded, and the page needs a moment to settle its layers
      await Promise.all([...document.querySelectorAll('image.gr')].map(i => i.decode ? i.decode().catch(() => {}) : null));
      await new Promise(r => setTimeout(r, 350));
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      return { stage: +document.body.getAttribute('data-stage'), height: document.documentElement.scrollHeight, title: document.title };
    })()`);
    if (got.stage !== stage) throw new Error(`${relative(DIST, file)} is at stage ${got.stage}, not ${stage}`);
    const base = relative(DIST, file).replace(/\.html$/, '').replace(/[\\/]/g, '_') + `-${label}-s${stage}`;
    if (AT) {
      // the screen at each point, once the eased wear has caught up with the scroll
      for (const at of AT) {
        await run(`(async () => { window.scrollTo(0, ${at} * (document.documentElement.scrollHeight - innerHeight)); await new Promise(r => setTimeout(r, 1500)); })()`);
        const { data } = await send('Page.captureScreenshot', { format: 'png' }, S);
        const name = `${base}-at${Math.round(at * 100)}.png`;
        writeFileSync(join(OUT, name), Buffer.from(data, 'base64')); count++;
        console.log(`${name}   ${w} x ${h}`);
      }
      continue;
    }
    const scale = Math.min(1, 15000 / got.height);                       // one image; a very long page is scaled to fit
    const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: w, height: got.height, scale } }, S);
    const name = base + '.png';
    writeFileSync(join(OUT, name), Buffer.from(data, 'base64')); count++;
    console.log(`${name}   ${w} x ${got.height}${scale < 1 ? `, saved at ${Math.round(scale * 100)}%` : ''}   "${got.title}"`);
  }
  console.log(`\n${count} images in shots/`);
} catch (e) { console.error('\n' + e.message); await quit(1); }
await quit(0);
