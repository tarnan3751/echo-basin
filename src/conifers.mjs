// Trees for the lake pictures, so that a stand is a mixture and not one tree repeated: three conifers built whorl by
// whorl (a slim fir, a broad ragged spruce, a hemlock with hanging boughs and a nodding top), a pine with a bare
// trunk and its needles in pads, and an aspen. Each tree draws from a random source of its own, seeded by the caller,
// so changing one tree never moves another and the shared sequence is left alone.
import * as L from './lib.mjs';
import { smooth } from './snowkit.mjs';
const { f, lerp, mix, poly, grain, GL } = L;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const bez = (A, C, T, u) => [(1 - u) * (1 - u) * A[0] + 2 * u * (1 - u) * C[0] + u * u * T[0], (1 - u) * (1 - u) * A[1] + 2 * u * (1 - u) * C[1] + u * u * T[1]];
// Every outline is made to run the same way round. Outlines of one tree are put together in a single path, and two
// that ran opposite ways would cancel where they overlap and leave a hole.
const turn = p => { let a = 0; for (let i = 0; i < p.length; i++) { const q = p[(i + 1) % p.length]; a += p[i][0] * q[1] - q[0] * p[i][1]; } return a < 0 ? p.slice().reverse() : p; };

// hw: half-width at the lowest boughs, as a share of the height. n: whorls on a tree 100 tall. taper: above 1 a spire,
// below 1 a cone. droop: how far the tips hang. thick: depth of a bough against the gap to the next. core: how far out
// the tree is solid. curl: boughs that sag and turn up at the tip. soft: rounded outlines. nod: a leader that bends over.
const KIND = {
  fir:     { hw: 0.145, n: 8.2, taper: 1.14, droop: 0.3,  thick: 0.98, core: 1,    sway: 0.1,  bare: 0.04, curl: 0,    rag: 0.9, soft: false, nod: 0, broken: 0 },
  spruce:  { hw: 0.215, n: 6,   taper: 0.9,  droop: 0.44, thick: 0.62, core: 0.5,  sway: 0.22, bare: 0.075, curl: 0.4, rag: 1.25, soft: false, nod: 0, broken: 0.12 },
  hemlock: { hw: 0.185, n: 6.6, taper: 0.8,  droop: 0.95, thick: 0.74, core: 0.78, sway: 0.2,  bare: 0.06, curl: 0,    rag: 0.75, soft: true,  nod: 1, broken: 0.05 },
};

// C: { tone, lit, mid, deep, trunk, rim, rimW }. rim is a thin edge of light on the side toward the sun.
// o.ref, if given, is handed the tree's outline (ref.shape, about its foot) so the caller can lay its shadow.
// o.grainy adds two stippled passes for a tree seen close: the light on the boughs breaking up toward the trunk, and
// the shade each whorl throws on the one below.
export function conifer(x, yb, h, C, o = {}){
  const K = KIND[o.kind] || KIND.fir, r = L.source((o.seed ?? 1) * 7919 + 101), sun = o.sun ?? (x < L.SUN.x ? 1 : -1);
  const w = o.w ?? h * K.hw * r(0.9, 1.1), tiers = o.tiers ?? clamp(Math.round(K.n * Math.sqrt(h / 100) * r(0.92, 1.08)), 3, 19), fine = !!o.grainy || h > 150, soft = K.soft && !!o.grainy, rimW = C.rimW ?? 2;
  const top = -h, base = -h * K.bare * r(0.7, 1.35), lean = o.lean ?? r(-0.018, 0.018), th0 = (base - top) / (tiers + 0.3), tw = Math.max(1, h * 0.015), rows = [];
  { const wt = []; let sum = 0; for (let i = 1; i < tiers; i++) { const v = lerp(0.62, 1.38, (i - 1) / Math.max(1, tiers - 2)) * r(0.86, 1.14); wt.push(v); sum += v; }
    let y = top + th0 * 0.85; const span = base - y;
    for (let i = 0; i < tiers; i++) { const t = (i + 1) / tiers, sp = i ? wt[i - 1] / sum * span : th0 * 0.7; if (i) y += sp; rows.push({ t, cy: y, th: Math.max(sp, th0 * 0.6), rad: w * (0.15 + 0.85 * Math.pow(t, K.taper)), cx: lean * h * Math.pow(1 - t, 1.6) }); } }
  let body = '', lit = '', mid = '', deep = '';
  // rounded outlines only on a tree seen close; farther off the hanging shape is enough to tell a hemlock
  const add = pts => { body += soft ? smooth(turn(pts), true, 0.72) + ' ' : poly(turn(pts)) + ' '; };
  // the solid middle of the tree, following the whorls in and out
  { const cl = [], cr = [];
    for (const q of rows) { cr.push([q.cx + q.rad * 0.4 * K.core, q.cy - q.th * 0.6], [q.cx + q.rad * 0.74 * K.core, q.cy + q.th * 0.14]); cl.unshift([q.cx - q.rad * 0.74 * K.core, q.cy + q.th * 0.14], [q.cx - q.rad * 0.4 * K.core, q.cy - q.th * 0.6]); }
    const end = rows[tiers - 1]; body += poly(turn([[lean * h, top + th0 * 0.25], ...cr, [end.cx + w * 0.26 * K.core, base + th0 * 0.1], [end.cx - w * 0.26 * K.core, base + th0 * 0.1], ...cl])) + ' '; }
  for (let i = tiers - 1; i >= 0; i--) {
    const q = rows[i], th = q.th;
    for (const s of [-1, 1]) {
      let rr = q.rad * r(1 - K.sway, 1 + K.sway * 0.7); if (r() < K.broken && i > 1) rr *= r(0.45, 0.7);
      const cy = q.cy + r(-0.14, 0.14) * th, tk = th * K.thick * 0.5, ya = cy - th * 0.7, yt = cy - th * 0.3 + th * K.droop * r(0.7, 1.3) - th * K.curl * 0.3;
      const A = [q.cx - s * rr * 0.04, ya], T = [q.cx + s * rr, yt], Cc = [q.cx + s * rr * r(0.45, 0.62), K.curl ? lerp(ya, yt, 0.8) + th * K.curl * 0.55 : lerp(ya, yt, r(0.05, 0.25))];
      const us = fine ? [0, 0.3 + r(-0.06, 0.06), 0.58 + r(-0.06, 0.06), 0.82 + r(-0.05, 0.05), 1] : [0, 0.5, 1], up = us.map(u => bez(A, Cc, T, u)), fr = [...up];
      if (K.soft) fr.push([T[0] - s * rr * 0.03, T[1] + tk * 0.9]);
      // back along the underside, where the branchlets hang in points of uneven length; now and then two run together
      for (let j = us.length - 1; j >= 1; j--) { const pm = bez(A, Cc, T, (us[j] + us[j - 1]) / 2 + r(-0.05, 0.05)), p0 = up[j - 1]; fr.push([pm[0] + s * rr * r(0, 0.05), pm[1] + tk + th * r(0.1, 0.5) * K.rag]); if (j === 1 || r() > 0.3) fr.push([p0[0], p0[1] + tk * r(0.7, 1)]); }
      add(fr);
      // light lying along the top of the bough: strong on the side toward the sun, faint on the other
      const cap = k => poly([...up, ...up.map((p, m) => [p[0], p[1] + tk * k * (0.3 + 0.7 * Math.sin(Math.PI * us[m])) * (m % 2 ? 1.12 : 0.74)]).reverse()]) + ' ';
      if (s === sun) lit += cap(o.grainy ? 1.25 : 0.78); else if (o.grainy) mid += cap(0.8);
    }
    // the shade a whorl throws on the one below, close in to the trunk
    if (i < tiers - 1) { const g = q.rad * 0.4, c = q.cx - sun * q.rad * 0.12; deep += poly([[c - g, q.cy + th * 0.12], [c + g, q.cy + th * 0.12], [c + g * 0.62, q.cy + th * 0.5], [c, q.cy + th * 0.62], [c - g * 0.62, q.cy + th * 0.5]]) + ' '; }
  }
  // the leader: a spike, or on a hemlock a tip that has bent over
  { const lx = lean * h, nd = K.nod ? (r() < 0.5 ? -1 : 1) * h * r(0.03, 0.05) : 0;
    body += K.nod ? `M${f(lx - tw)},${f(top + th0 * 0.95)} Q${f(lx - tw * 0.5)},${f(top + th0 * 0.05)} ${f(lx + nd)},${f(top + th0 * 0.34)} Q${f(lx + tw * 0.4)},${f(top + th0 * 0.3)} ${f(lx + tw)},${f(top + th0 * 0.95)}Z ` : poly([[lx - tw * 0.95, top + th0 * 0.9], [lx, top], [lx + tw * 0.95, top + th0 * 0.9]]) + ' '; }
  const trunkD = poly([[-tw, base - th0 * 0.6], [tw, base - th0 * 0.6], [tw * 1.25, 1], [-tw * 1.25, 1]]);
  // dead twigs left on the trunk below the lowest boughs
  let twigs = '';
  if (o.grainy) for (let k = 0, n = 2 + Math.floor(r(0, 3)); k < n; k++) { const y = lerp(base - th0 * 0.2, -h * 0.012, (k + r(0.2, 0.8)) / n), s = k % 2 ? 1 : -1, len = w * r(0.16, 0.34); twigs += `M${f(s * tw * 0.8)},${f(y)} l${f(s * len)},${f(-len * r(0.02, 0.3))} `; }
  const id = L.shared(body);
  let extra = '';
  if (o.grainy) {
    const cid = L.clipTo(id), stops = [[0, 0]], y0 = top, yr = -top;
    for (const q of rows) { const a = (q.cy + q.th * 0.08 - y0) / yr, b = (q.cy + q.th * 0.66 - y0) / yr; stops.push([+Math.max(0, a - 0.001).toFixed(3), 0], [+a.toFixed(3), 0.8], [+Math.min(1, b).toFixed(3), 0]); }
    extra = `<g clip-path="url(#${cid})">${grain(Math.min(0, sun * w * 1.2), top, w * 1.2, h + 4, GL(0, 0, sun * w * 0.8, 0, [[0, 0.7], [0.45, 0.32], [1, 0]]), C.tone)}${grain(-w * 1.25, top, w * 2.5, h + 4, GL(0, y0, 0, 0, stops), C.deep)}</g>`;
  }
  if (o.ref) o.ref.shape = `<path d="${trunkD}"/><use href="#${id}"/>`;
  const inner = `<path d="${trunkD}" fill="${C.trunk}"/>${twigs ? `<path d="${twigs}" fill="none" stroke="${C.trunk}" stroke-width="${f(tw * 0.5)}" stroke-linecap="round"/>` : ''}<use href="#${id}" fill="${C.tone}"/>${mid ? `<path d="${mid}" fill="${C.mid}"/>` : ''}<path d="${lit}" fill="${C.lit}"/>${o.grainy ? '' : `<path d="${deep}" fill="${C.deep}"/>`}${extra}`;
  return `<g transform="translate(${f(x)},${f(yb)})">${C.rim ? `<path d="${trunkD}" fill="${C.rim}"/><use href="#${id}" fill="${C.rim}"/><g transform="translate(${f(-sun * rimW)},${f(rimW * 0.35)})">${inner}</g>` : inner}</g>`;
}

// A pine: a tall bare trunk, and the needles carried in flat pads at the ends of a few upswept branches, with sky
// between them. Nothing else in the stand has this outline.
export function pineTree(x, yb, h, C, o = {}){
  const r = L.source((o.seed ?? 1) * 6007 + 59), sun = o.sun ?? (x < L.SUN.x ? 1 : -1), rimW = C.rimW ?? 2, big = h > 105;
  const crown = o.crown ?? r(0.44, 0.6), lean = o.lean ?? r(-0.04, 0.04), bend = r(-1, 1) * 0.018, cxAt = t => (lean * t + bend * Math.sin(Math.PI * t)) * h, twAt = t => lerp(h * 0.02, h * 0.007, t);
  const tl = [], tr = []; for (let k = 0; k <= 8; k++) { const t = k / 8 * 0.97; tl.unshift([cxAt(t) - twAt(t), -h * t + (k ? 0 : 1)]); tr.push([cxAt(t) + twAt(t), -h * t + (k ? 0 : 1)]); }
  const trunkD = poly(turn([...tr, ...tl]));
  let body = '', lit = '', deep = '', limbs = '';
  // a pad of needles: a low dome with a toothed top, where the tufts stand up, and a ragged underside
  const pad = (px, py, a, b) => {
    const m = clamp(Math.round(a / Math.max(1.5, h * 0.013)), 3, 8), top = [], env = [];
    for (let k = 0; k <= m * 2; k++) { const u = k / (m * 2), e = Math.pow(Math.sin(Math.PI * (0.05 + 0.9 * u)), 0.7) * (k % 2 ? 1 : 0.68) * r(0.86, 1.1); env.push(e); top.push([px + a * (u * 2 - 1), k === 0 || k === m * 2 ? py + b * 0.12 : py - b * e]); }
    const lo = [[px + a * 0.6, py + b * 0.46 * r(0.8, 1.2)], [px + a * 0.2, py + b * 0.2], [px - a * 0.15, py + b * 0.5 * r(0.8, 1.2)], [px - a * 0.62, py + b * 0.3]];
    body += poly(turn([...top, ...lo])) + ' ';
    // light along the top of the pad, on the part of it that faces the sun
    const k0 = sun > 0 ? Math.floor(m * 0.5) : 0, k1 = sun > 0 ? m * 2 : Math.ceil(m * 1.5), part = top.slice(k0, k1 + 1);
    lit += poly([...part, ...part.map((q, j) => [q[0], Math.min(py + b * 0.1, q[1] + b * 0.4 * (0.4 + 0.6 * Math.sin(Math.PI * j / (part.length - 1))))]).reverse()]) + ' ';
    if (big) deep += poly([[px - a * 0.62, py + b * 0.3], [px - a * 0.3, py + b * 0.02], [px + a * 0.3, py - b * 0.02], [px + a * 0.6, py + b * 0.46], [px + a * 0.2, py + b * 0.2], [px - a * 0.15, py + b * 0.5]]) + ' ';
  };
  const n = clamp(Math.round(3.4 + h / 46), 4, 9);
  for (let i = 0; i < n; i++) {
    const t = lerp(crown, 0.92, (i + r(0.1, 0.9)) / n), s = (i % 2 ? 1 : -1) * (r() < 0.15 ? -1 : 1), reach = h * lerp(0.15, 0.055, (t - crown) / (1 - crown)) * r(0.7, 1.25), bx = cxAt(t), by = -h * t, px = bx + s * reach, py = by - reach * r(0.2, 0.5), a = reach * r(0.5, 0.82);
    limbs += `M${f(bx)},${f(by)} Q${f(bx + s * reach * 0.5)},${f(by - reach * 0.04)} ${f(px)},${f(py)} `;
    pad(px, py, a, a * r(0.44, 0.62));
    if (big && r() < 0.5) pad(bx + s * reach * 0.42, by - reach * r(0.2, 0.34), a * 0.55, a * 0.3);
  }
  pad(cxAt(1), -h * 0.975, h * r(0.05, 0.075), h * r(0.04, 0.055));
  // a dead stub or two below the crown
  for (let k = 0, m = 1 + Math.floor(r(0, 2)); k < m; k++) { const t = crown * r(0.55, 0.92), s = k % 2 ? 1 : -1, len = h * r(0.03, 0.06); limbs += `M${f(cxAt(t))},${f(-h * t)} l${f(s * len)},${f(-len * r(0.2, 0.5))} `; }
  const id = L.shared(body), sw = f(Math.max(0.8, h * 0.009));
  // seen close: the light on each pad breaks up toward the trunk, and the crown darkens downward
  const extra = o.grainy ? `<g clip-path="url(#${L.clipTo(id)})">${grain(-h * 0.3, -h * 1.05, h * 0.6, h * 0.7, GL(-sun * h * 0.22, 0, sun * h * 0.2, 0, [[0, 0.75], [0.5, 0.4], [1, 0.05]]), C.tone)}${grain(-h * 0.3, -h * 1.05, h * 0.6, h * 0.7, GL(0, -h, 0, -h * crown, [[0, 0], [0.5, 0.2], [1, 0.5]]), C.deep)}</g>` : '';
  if (o.ref) o.ref.shape = `<path d="${trunkD}"/><use href="#${id}"/>`;
  const inner = `<path d="${limbs}" fill="none" stroke="${C.trunk}" stroke-width="${sw}" stroke-linecap="round"/><path d="${trunkD}" fill="${C.trunk}"/><use href="#${id}" fill="${C.tone}"/><path d="${lit}" fill="${C.lit}"/>${deep ? `<path d="${deep}" fill="${C.deep}"/>` : ''}${extra}`;
  return `<g transform="translate(${f(x)},${f(yb)})">${C.rim ? `<path d="${trunkD}" fill="${C.rim}"/><use href="#${id}" fill="${C.rim}"/><g transform="translate(${f(-sun * rimW)},${f(rimW * 0.35)})">${inner}</g>` : inner}</g>`;
}

// An aspen: a thin pale trunk and a loose oval crown of small rounded masses of leaf, turned gold.
// C: { bark, barkSh, leaf, leafLit, leafSh }.
export function aspen(x, yb, h, C, o = {}){
  const r = L.source((o.seed ?? 1) * 3331 + 17), sun = o.sun ?? (x < L.SUN.x ? 1 : -1), lean = (o.lean ?? r(-0.05, 0.05)) * h, tw = Math.max(0.9, h * 0.014);
  const cx = lean * 0.75, cy = -h * 0.62, rx = h * r(0.13, 0.17), ry = h * r(0.3, 0.36);
  const disc = (px, py, rad) => `M${f(px - rad)},${f(py)}a${f(rad)},${f(rad * 0.92)} 0 1 0 ${f(rad * 2)},0a${f(rad)},${f(rad * 0.92)} 0 1 0 ${f(-rad * 2)},0Z`;
  let leaf = '', lit = '', sh = '';
  for (let k = 0, n = clamp(Math.round(8 + h / 12), 9, 14); k < n; k++) {
    const a = k / n * 6.283 + r(-0.3, 0.3), q = k < n * 0.7 ? r(0.5, 0.82) : r(0, 0.4), px = cx + Math.cos(a) * rx * q, py = cy + Math.sin(a) * ry * q, rad = h * r(0.075, 0.115);
    leaf += disc(px, py, rad);
    if (Math.cos(a) * sun > -0.5 || Math.sin(a) < 0) lit += disc(px + sun * rad * 0.24, py - rad * 0.26, rad * 0.62);
    if (Math.sin(a) > 0.1) sh += disc(px - sun * rad * 0.2, py + rad * 0.34, rad * 0.6);
  }
  if (o.ref) o.ref.shape = `<path d="${leaf}"/><path d="M${f(-tw)},1 L${f(tw)},1 L${f(lean * 0.8 + tw * 0.7)},${f(-h * 0.8)} L${f(lean * 0.8 - tw * 0.7)},${f(-h * 0.8)}Z"/>`;
  const marks = h > 46 ? `<path d="${[0.16, 0.27, 0.36].map(t => `M${f(lean * t * 0.6 - tw)},${f(-h * t)} h${f(tw * 1.3)}`).join(' ')}" stroke="${C.barkSh}" stroke-width="${f(Math.max(0.7, h * 0.008))}" fill="none"/>` : '';
  return `<g transform="translate(${f(x)},${f(yb)})"><path d="M0,1 Q${f(lean * 0.2)},${f(-h * 0.4)} ${f(lean * 0.8)},${f(-h * 0.8)}" fill="none" stroke="${C.bark}" stroke-width="${f(tw * 2)}" stroke-linecap="round"/><path d="M${f(tw * 0.5 * -sun)},1 Q${f(lean * 0.2 - sun * tw * 0.5)},${f(-h * 0.4)} ${f(lean * 0.8 - sun * tw * 0.5)},${f(-h * 0.8)}" fill="none" stroke="${C.barkSh}" stroke-width="${f(tw * 0.8)}" stroke-linecap="round"/>${marks}<path d="${leaf}" fill="${C.leaf}"/><path d="${sh}" fill="${C.leafSh}"/><path d="${lit}" fill="${C.leafLit}"/></g>`;
}
