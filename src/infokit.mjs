// Shared parts for the information graphics (the echo diagram, the track card, the conditions panel, the daylight
// chart). They are printed matter, like the park map: the same paper and ink, the same two typefaces as the page,
// a ruled border, a little wear. Words that change with the stage are ordinary staged text (class "t" with a
// data-s attribute for each stage that rewords it), so the page rewrites them the way it rewrites its own copy.
import * as L from './lib.mjs';
const { f, mix, grain, GR } = L;

export const PAPER = '#F3EAD3', INK = '#2A2438', INK2 = '#625B6E', BROWN = '#A8755F', DEEP = '#12303B', BONE = '#F5F1E3';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const alts = a => a ? Object.entries(a).map(([k, v]) => ` data-s${k}="${esc(v)}"`).join('') : '';
const SANS = `font-family="'Source Sans 3', sans-serif"`;
// The display face follows the page: it hardens and goes off its axis stage by stage (the --fv variable).
const SERIF = opsz => `font-family="Fraunces, serif" style="font-variation-settings:var(--fv,'SOFT' 100,'WONK' 0,'wght' 640),'opsz' ${opsz}"`;

// One line of lettering. o: size, weight, anchor, fill, font ('sans' | 'serif'), alts {stage: words}, halo (a colour
// to back the letters with, for lettering laid over a drawing), ls (letter-spacing), italic, rot, opacity, num (tabular figures).
export function T(x, y, s, o = {}){
  const { size = 16, weight = 600, anchor = 'start', fill = INK, font = 'sans', halo, ls, italic, rot, opacity, num, cls = true } = o;
  const face = font === 'serif' ? SERIF(Math.max(14, Math.min(60, Math.round(size * 1.4)))) : SANS + (num ? ' style="font-variant-numeric:tabular-nums"' : '');
  return `<text${cls ? ' class="t"' : ''} x="${f(x)}" y="${f(y)}"${anchor !== 'start' ? ` text-anchor="${anchor}"` : ''} ${face} font-size="${size}"${font === 'serif' ? '' : ` font-weight="${weight}"`} fill="${fill}"`
    + (halo ? ` stroke="${halo}" stroke-width="${f(Math.max(3, size * 0.26))}" stroke-linejoin="round" paint-order="stroke"` : '') + (ls ? ` letter-spacing="${ls}"` : '') + (italic ? ' font-style="italic"' : '')
    + (rot ? ` transform="rotate(${rot} ${f(x)} ${f(y)})"` : '') + (opacity !== undefined ? ` opacity="${opacity}"` : '') + alts(o.alts) + `>${esc(s)}</text>`;
}
// The sheet a graphic is printed on: paper, and a ruled border a little way in from the edge.
export function sheet(W, H, { inset = 9, fill = PAPER, rule = INK } = {}){
  return `<rect width="${W}" height="${H}" fill="${fill}"/><rect x="${inset}" y="${inset}" width="${W - inset * 2}" height="${H - inset * 2}" rx="5" fill="none" stroke="${rule}" stroke-width="1.3"/>`;
}
// The paper's tooth: speckle that thickens toward the edges, as on the map.
export const tooth = (W, H, seed, k = 1) => grain(0, 0, W, H, GR(W / 2, H / 2, Math.hypot(W, H) * 0.6, [[0, 0], [0.55, 0.05 * k], [1, 0.3 * k]]), '#B9A27C', { seed });
// A thin rule.
export const rule = (x1, y1, x2, y2, o = {}) => `<path d="M${f(x1)},${f(y1)} L${f(x2)},${f(y2)}" stroke="${o.stroke || INK}" stroke-width="${o.w || 1}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.opacity ? ` opacity="${o.opacity}"` : ''} fill="none" stroke-linecap="${o.cap || 'butt'}"/>`;
// A measured length: a line with a tick at each end.
export const span = (x1, x2, y, o = {}) => `<path d="M${f(x1)},${f(y)} H${f(x2)} M${f(x1)},${f(y - 5)} v10 M${f(x2)},${f(y - 5)} v10" stroke="${o.stroke || INK}" stroke-width="${o.w || 1.3}" fill="none"/>`;

// Lettering that may need two lines where the card is narrow. Every stage's wording is split the same way, so each of
// the two lines carries its own wording for each stage. max: the most characters a line may hold.
export function lines2(x, y, lh, s, o = {}, max = 48){
  const split = str => { if (str.length <= max) return [str, '']; let k = str.lastIndexOf(' ', max); if (k < max * 0.4) k = max; return [str.slice(0, k), str.slice(k + 1)]; };
  const [a, b] = split(s), A = {}, B = {};
  for (const [k, v] of Object.entries(o.alts || {})) { const [va, vb] = split(v); A[k] = va; B[k] = vb; }
  return T(x, y, a, { ...o, alts: A }) + T(x, y + lh, b, { ...o, alts: B });
}
// Two layouts of one graphic in one drawing: the wide one at the top, the narrow one a thousand units below it.
// The page shows whichever suits the screen, by changing the picture's viewBox.
export const twoLayouts = (wide, tall, [w, h], [wm, hm]) => ({ svg: `<defs>${L.defs.join('\n')}</defs><g>${wide}</g><g transform="translate(0,1000)">${tall}</g>`, vb: [0, 0, w, h], vbm: [0, 1000, wm, hm], flat: true });
