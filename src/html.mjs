// The helpers every page writes its markup with: words that change by stage, and pictures.
import { scenes } from './scenes.mjs';

export const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
// A stage's words go in data-sN. One that is checked (see checked() below) also names its test in data-ifN and carries
// the plain line to show instead in data-elseN.
const A = (alts, checks) => Object.entries(alts || {}).map(([k, v]) => ` data-s${k}="${esc(v)}"` + (checks?.[k] ? ` data-if${k}="${checks[k][0]}" data-else${k}="${esc(checks[k][1])}"` : '')).join('');
// t(): inline text with per-stage alternates. el(): the same on a block element.
export const t = (pair) => { const [base, alts, checks] = Array.isArray(pair) ? pair : [pair, null]; return `<span class="t"${A(alts, checks)}>${esc(base)}</span>`; };
export const el = (tag, cls, pair, extra = '') => { const [base, alts, checks] = Array.isArray(pair) ? pair : [pair, null]; return `<${tag} class="${cls ? cls + ' ' : ''}t"${A(alts, checks)}${extra}>${esc(base)}</${tag}>`; };
// A line that says what the reader did (bible 10.6): a piece's words at `stage` are shown only if the test named `test`
// is true when that stage is applied, and `fallback` is shown otherwise. The tests are in src/runtime.js (SAID), with
// the clock's other rules; build.mjs stops if a page names one that is not there. Both wordings go into the page, so
// nothing has to be fetched to decide. Gives the piece back with the check added, for t() and el().
export const checked = (pair, stage, test, fallback) => {
  const [base, alts = {}, checks = {}] = Array.isArray(pair) ? pair : [pair];
  if (alts?.[stage] === undefined) throw new Error(`checked(): "${base}" has no words at stage ${stage} to check`);
  if (typeof fallback !== 'string' || !/^\w+$/.test(test)) throw new Error(`checked(): the stage ${stage} line of "${base}" needs a test name and a fallback line`);
  return [base, alts, { ...checks, [stage]: [test, fallback] }];
};
// Words that are staged only if they need to be: t() for a piece that changes by stage or carries one of the reader's
// own facts, which the script fills in ({date}, {time}, {now}, {m}), and plain text for anything else.
const OWN = /\{(date|time|now|m)\}/;
export const w = x => Array.isArray(x) || OWN.test(x) ? t(x) : esc(x);

// The attributes that put an element on the page only from stage `from` through stage `until` (either may be left
// out). One that is not there at stage 0 starts hidden, so the page reads right before the script has run.
export const during = ({ from = 0, until = 6 } = {}) => (from > 0 ? ` data-from="${from}"` : '') + (until < 6 ? ` data-until="${until}"` : '') + (from > 0 ? ' style="display:none"' : '');
// A table row of plain cells. A row is [cells...], or [[cells...], { from, until }] for one that is on the page only
// from stage `from` through stage `until` (the trail register's lines: bible 9.4).
export const row = r => { const [cells, when] = Array.isArray(r[0]) ? r : [r, {}]; return `<tr${during(when)}>${cells.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`; };

// A picture is shown one stage behind the site until the reader reaches its marker (bible 10.4).
// mark: [line, at] puts that marker 'line' of the way down the picture (0 the top edge, 1 the bottom). It is reached
//   when that line comes up the window as far as 'at' (0 the top of the window, 1 the bottom), or with at = 'head',
//   when it goes under the page header. Every picture has one: [0.5, 0.5] unless given, which is reached when the
//   middle of the picture comes to the middle of the window. mark: false leaves it out, and the picture then catches
//   up once it has been looked at for a few seconds, as one in the first screen of a page does.
// lag: false shows the picture at the site's stage from the start (the dock: see bible 10.4).
// ending: true makes its marker the ending's (bible 10.5): at stage 5 it fires stage 6, and below that it does nothing.
// point: the name the picture scores its point under, its own unless given. Small cards read together as one figure
//   share a name, so that looking at them earns one point between them, as one picture would (the three cards on
//   the Conditions page). Each still has its own time on screen, for the lines that say what the reader looked at.
// narrow: the widest window, in pixels, at which the picture's second layout is used (700 unless given).
// label: what the picture says, for readers who cannot see it (the drawings themselves are hidden from screen readers).
//   One that changes by stage, [base, { stage: words }], is kept in a hidden staged line inside the figure and named
//   from there, so it follows the picture's own stage as its caption does.
// When the marker that catches a picture up is also the one that fires a due stage, the picture catches up first and
// the stage follows a few seconds later, so the reader sees both (src/runtime.js).
export const plate = (name, opts) => plateOf(name, scenes[name](), opts);

// The same for a picture that may not be registered in src/scenes.mjs yet: drawn if it is, and otherwise a plain
// placeholder of the shape it will have, with its name in it. The placeholder is an ordinary picture frame with the
// same caption, label and marker, so the page reads, scores and changes stage exactly as it will with the drawing in
// it, and nothing on the page has to change when the picture is registered. ar and arm are its two shapes, as for
// plate(); give arm whenever the picture has a phone layout, since that is what the placeholder is cut to.
export const plateOr = (name, opts = {}) => scenes[name] ? plate(name, opts) : plateOf(name, pending(name, opts), opts);
function pending(name, { ar = '16/9', arm }){
  const size = s => String(s).split('/').map(Number);
  const n = v => +v.toFixed(1);
  const card = (y, [w, h]) => { const k = Math.min(w, h); return `<rect x="0" y="${y}" width="${w}" height="${h}" fill="#E4DCC8"/><rect x="${n(k * 0.03)}" y="${n(y + k * 0.03)}" width="${n(w - k * 0.06)}" height="${n(h - k * 0.06)}" fill="none" stroke="#8F8676" stroke-width="${n(Math.max(1, k * 0.006))}" stroke-dasharray="${n(k * 0.03)} ${n(k * 0.02)}"/><text x="${n(w / 2)}" y="${n(y + h / 2)}" text-anchor="middle" dominant-baseline="middle" font-family="'Source Sans 3', sans-serif" font-weight="600" font-size="${n(k * 0.07)}" fill="#6F6758">${esc(name)}</text>`; };
  // the phone layout sits below the wide one, as twoLayouts() in infokit.mjs places it, and is cut out by its own viewBox
  const wide = size(ar), tall = arm ? size(arm) : null, y2 = wide[1] * 2;
  return { svg: card(0, wide) + (tall ? card(y2, tall) : ''), vb: [0, 0, ...wide], ...(tall ? { vbm: [0, y2, ...tall] } : {}), flat: true };
}

// The same for a picture already drawn: sc is what a scene function returns, { svg, vb, vbm?, layers?, flat? }, and
// name is what the page calls it. plate() is this for a picture registered in src/scenes.mjs; preview.mjs uses it for
// one that is not registered yet.
export function plateOf(name, sc, { cls = '', ar, arm, cap, eyes, mark = [0.5, 0.5], lag = true, ending = false, narrow, label, point } = {}){
  const vb = sc.vb.join(' ');
  const svgs = sc.layers ? sc.layers.join('') : `<svg class="ly"${sc.flat ? ' data-flat' : ''} viewBox="${vb}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${sc.svg}</svg>`;
  const marker = mark ? `<i class="plate__mark" style="top:${mark[0] * 100}%" data-mark="${mark[1]}"${ending ? ' data-ending' : ''} aria-hidden="true"></i>` : '';
  const staged = Array.isArray(label), named = staged ? ` aria-labelledby="${esc(name)}-label"` : label ? ` aria-label="${esc(label)}"` : '';
  return `<figure class="plate ${cls}" data-scene="${name}"${lag ? '' : ' data-lag="0"'}${point ? ` data-point="${esc(point)}"` : ''}${eyes ? ` data-eyes="${eyes}"` : ''}${named}><div class="plate__frame"><div class="plate__img" style="--ar:${ar};--arm:${arm || ar}" data-vb="${vb}"${sc.vbm ? ` data-vbm="${sc.vbm.join(' ')}"` : ''}${narrow ? ` data-vbm-max="${narrow}"` : ''}>${svgs}</div>${marker}</div>${cap ? el('figcaption', '', cap) : ''}${staged ? el('span', '', label, ` id="${esc(name)}-label" hidden`) : ''}</figure>`;
}
