// Winter kit for the high-country pictures: snow-loaded conifers of several kinds, drifts, boulders under snow,
// and people in winter clothes seen from behind. Everything here draws from its own random source, so changing
// one tree never moves another.
import * as L from './lib.mjs';
const { f, lerp, mix, poly } = L;

export const source = seed => { let a = seed | 0; return (lo = 0, hi = 1) => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return lo + ((t ^ t >>> 14) >>> 0) / 4294967296 * (hi - lo); }; };

// A smooth curve through a list of points, closed unless told otherwise.
export function smooth(pts, closed = true, k = 1){
  const n = pts.length, at = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const a = at(i - 1), b = at(i), c = at(i + 1), e = at(i + 2);
    d += ` C${f(b[0] + (c[0] - a[0]) * k / 6)},${f(b[1] + (c[1] - a[1]) * k / 6)} ${f(c[0] - (e[0] - b[0]) * k / 6)},${f(c[1] - (e[1] - b[1]) * k / 6)} ${f(c[0])},${f(c[1])}`;
  }
  return d + (closed ? 'Z' : '');
}
const bez = (A, C, T, u) => [(1 - u) * (1 - u) * A[0] + 2 * u * (1 - u) * C[0] + u * u * T[0], (1 - u) * (1 - u) * A[1] + 2 * u * (1 - u) * C[1] + u * u * T[1]];

// ---------- trees ----------
// A conifer carrying snow. It is built the way the tree grows: a dark core of trunk and inner needles, then whorls
// of boughs from the bottom up. Snow lies on the upper side of every bough and bends it down, so from the side each
// bough shows as a thick white shelf, lumpy along its lower edge, with the needles hanging out from under it in
// dark points. The bough above shelters the part nearest the trunk, which leaves a dark gap between one shelf and
// the next. Snow on the sunward (left) boughs is lit; on the others it is in shade.
// w is the half-width at the bottom whorl. taper above 1 gives a narrow spire, below 1 a broad cone. load is how
// much snow. flag strips the windward boughs toward the top, as on a tree out in the open. bury hides the foot of
// the tree in a drift, for a young tree most of the way under. C: { fol, snow, shade, trunk, ground }.
export function snowTree(x, yb, h, C, o = {}){
  const { w = h * 0.15, tiers = Math.max(3, Math.round(h / 25)), seed = 1, taper = 1.05, droop = 0.42, load = 1, lean = 0, sway = 0.16, flag = 0, fine = h > 110, bury = 0 } = o;
  // drawn about its own foot and then moved into place, which keeps the numbers short
  const X = x, Y = yb; x = 0; yb = 0;
  if (h < 26 && !bury) return `<g transform="translate(${f(X)},${f(Y)})">${tinyTree(h, w, C, seed)}</g>`;
  // the lowest boughs hang about one whorl's height below where they leave the trunk, so they start that far up it
  const bare = o.bare ?? (1 - 1 / (1 + 1.2 / (tiers + 0.2))) * 0.6;
  const r = source(seed * 7919 + 13), top = yb - h, base = yb - h * bare, th = (base - top) / (tiers + 0.2), tw = Math.max(1.2, h * 0.018), out = [], rows = [];
  // whorls sit closer together toward the top of the tree
  { const wt = []; let sum = 0; for (let i = 1; i < tiers; i++) { wt.push(lerp(0.7, 1.3, tiers > 2 ? (i - 1) / (tiers - 2) : 0.5)); sum += wt[i - 1]; }
    let y = top + th * 0.9; const span = base - y;
    for (let i = 0; i < tiers; i++) { const t = (i + 1) / tiers, sp = i ? wt[i - 1] / sum * span : th * 0.8; if (i) y += sp; rows.push({ t, cy: y, th: Math.max(sp, th * 0.7), rad: w * (0.2 + 0.8 * Math.pow(t, taper)), cx: x + lean * h * (1 - t) * (1 - t) }); } }
  // the core
  const cl = [], cr = [];
  for (const q of rows) { cl.push([q.cx - q.rad * 0.4, q.cy - q.th * 0.6], [q.cx - q.rad * 0.74, q.cy + q.th * 0.14]); cr.unshift([q.cx + q.rad * 0.74, q.cy + q.th * 0.14], [q.cx + q.rad * 0.4, q.cy - q.th * 0.6]); }
  out.push(`<path d="M${f(x - tw)},${f(base)} L${f(x + tw)},${f(base)} L${f(x + tw * 1.3)},${f(yb + 1)} L${f(x - tw * 1.3)},${f(yb + 1)}Z" fill="${C.trunk}"/><path d="${poly([[x + lean * h, top + th * 0.2], ...cl, [x - w * 0.3, base + th * 0.12], [x + w * 0.3, base + th * 0.12], ...cr])}" fill="${C.fol}"/>`);
  for (let i = tiers - 1; i >= 0; i--) {
    const q = rows[i], th = q.th;
    let dark = '', lit = '', shd = '', front = '';
    for (const s of [-1, 1]) {
      const rr = q.rad * r(1 - sway, 1 + sway * 0.8) * (s < 0 ? 1 - flag * (1 - q.t * 0.7) : 1), cy = q.cy + r(-0.18, 0.18) * th, dr = th * droop * r(0.6, 1.3);
      const A = [q.cx - s * rr * 0.05, cy - th * 0.8], T = [q.cx + s * rr, cy + dr], Cc = [q.cx + s * rr * r(0.5, 0.68), cy - th * r(0.56, 0.78)], tk = th * 0.44 * load;
      const us = fine ? [0, 0.2, 0.4, 0.6, 0.8, 0.95] : [0, 0.34, 0.68, 0.95], n = us.length;
      const lump = us.map((u, j) => (j % 2 ? 1.14 : 0.72) * r(0.86, 1.14));
      const upper = us.map(u => { const p = bez(A, Cc, T, u); return [p[0], p[1] - th * 0.05 * load]; });
      const lower = us.map((u, j) => { const p = bez(A, Cc, T, u); return [p[0], p[1] + tk * lump[j]]; });
      // needles: a ragged edge hanging below the snow
      const fr = [[A[0], A[1] + tk * 0.4]];
      for (const u of us.slice(1)) { const p = bez(A, Cc, T, u); fr.push([p[0], p[1] + tk * 0.4]); }
      fr.push([T[0] - s * rr * 0.02, T[1] + tk * 0.5]);
      for (let j = n - 1; j >= 1; j--) {
        const um = (us[j] + us[j - 1]) / 2, pm = bez(A, Cc, T, um), p0 = bez(A, Cc, T, us[j - 1]);
        fr.push([pm[0] + s * rr * 0.03, pm[1] + tk * 0.95 + th * r(0.2, 0.44)], [p0[0], p0[1] + tk * lump[j - 1] * 0.8]);
      }
      dark += poly(fr) + ' ';
      const tipA = [T[0] + s * Math.max(0.5, th * 0.07), T[1] + tk * 0.1], tipB = [T[0] - s * rr * 0.03, T[1] + tk * 0.78];
      const pts = [...upper, tipA, tipB, ...lower.slice().reverse()], sd = smooth(pts) + ' ';
      if (s < 0) lit += sd; else shd += sd;
    }
    // a bough that comes straight toward us, seen end-on: a tongue of needles under a round pillow of snow
    const low = i === tiers - 1 && tiers > 1;
    if (low || (fine && i >= 2 && r() < 0.8)) {
      // on the bottom whorl this bough hangs to the snow and hides the trunk, with only a small pillow on its shoulder
      const fw = q.rad * (low ? r(0.34, 0.44) : r(0.26, 0.4)), fx = q.cx + (low ? r(-0.1, 0.08) : r(-0.3, 0.12)) * q.rad, fy = q.cy + (low ? r(-0.1, 0.05) : r(-0.05, 0.25)) * th, k = low ? 2 : 1, P = (a, b) => [fx + fw * a, fy + th * b];
      dark += poly([P(-1, -0.3), P(1, -0.3), P(0.84, 0.5 * k), P(0.36, 0.36 * k), P(0.06, 0.72 * k), P(-0.4, 0.4 * k), P(-0.86, 0.56 * k)]) + ' ';
      const m = low ? 0.74 : 1, B = (a, b) => [fx + fw * a * m, fy + th * (b * m - (low ? 0.08 : 0))];
      const blob = [B(-1.06, 0.16), B(-0.82, -0.3), B(-0.12, -0.54), B(0.7, -0.36), B(1.06, 0.12), B(0.46, 0.3), B(-0.2, 0.18), B(-0.62, 0.34)];
      lit += smooth(blob) + ' ';
      front = `<path d="${smooth([B(0.3, -0.46), B(0.7, -0.36), B(1.06, 0.12), B(0.46, 0.3), B(0.56, -0.08)])}" fill="${C.shade}"/>`;
    }
    // under each lit shelf, the same shape again a little lower in the shade tone: the thickness of the snow
    const id = L.shared(lit);
    out.push(`<path d="${dark}" fill="${C.fol}"/><use href="#${id}" fill="${C.shade}" transform="translate(0,${f(Math.max(0.8, th * 0.09))})"/><path d="${shd}" fill="${C.shade}"/><use href="#${id}" fill="${C.snow}"/>${front}`);
  }
  // the leader, with a cap of snow leaning off its sunward side
  const lx = x + lean * h;
  out.push(`<path d="M${f(lx - tw * 0.9)},${f(top + th * 0.5)} L${f(lx)},${f(top - th * 0.1)} L${f(lx + tw * 0.9)},${f(top + th * 0.5)}Z" fill="${C.fol}"/>`);
  out.push(`<path d="${smooth([[lx - tw * 1.3, top + th * 0.46], [lx - tw * 0.9, top + th * 0.08], [lx - tw * 0.1, top - th * 0.2], [lx + tw * 0.4, top + th * 0.1], [lx - tw * 0.1, top + th * 0.4]])}" fill="${C.snow}"/>`);
  // whatever hangs lower than the snow is under it; and the snow lies up against the foot of the tree in a low swell,
  // higher for a young tree that is most of the way buried
  const bh = bury ? h * bury : Math.max(2.4, h * 0.026), bw = w * (bury ? 1.8 : 1.25), by = yb - bh, Q = (a, b) => [x + bw * a, by + bh * b];
  const foot = `<path d="${smooth([Q(-1.1, 1.04), Q(-0.74, 0.6), Q(-0.24, 0.06), Q(0.3, 0.02), Q(0.8, 0.52), Q(1.12, 1.04), Q(0.5, 1.5), Q(-0.5, 1.5)])}" fill="${C.ground}"/><path d="M${f(Q(-0.86, 0.72)[0])},${f(Q(-0.86, 0.72)[1])} Q${f(Q(-0.5, 0.14)[0])},${f(Q(-0.5, 0.14)[1])} ${f(Q(0.06, 0)[0])},${f(Q(0.06, 0)[1])}" fill="none" stroke="${C.groundLit || C.snow}" stroke-width="${f(Math.max(1, bh * 0.1))}" stroke-linecap="round"/>`;
  return `<g transform="translate(${f(X)},${f(Y)})"><g clip-path="url(#${L.clipRect(x - w * 2.4 - 6, top - h * 0.1, w * 4.8 + 12, h * 1.1 + 1.6)})">${out.join('')}</g>${foot}</g>`;
}
// The same tree far off, where only its outline and the light on it can be made out.
function tinyTree(h, w, C, seed){
  const r = source(seed * 131 + 7), n = 3; let dark = '', lit = '', shd = '';
  for (let i = n - 1; i >= 0; i--) {
    const t = (i + 1) / n, y = -h * (1 - t * 0.9), rr = w * (0.3 + 0.7 * t) * r(0.9, 1.1), th = h * 0.9 / n, ax = r(-0.4, 0.4);
    dark += `M${f(ax)},${f(y - th * 1.1)} L${f(rr)},${f(y + th * 0.2)} L${f(rr * 0.4)},${f(y)} L${f(0)},${f(y + th * 0.3)} L${f(-rr * 0.4)},${f(y)} L${f(-rr)},${f(y + th * 0.2)}Z `;
    lit += `M${f(ax)},${f(y - th * 1.1)} L${f(-rr)},${f(y + th * 0.2)} L${f(-rr * 0.5)},${f(y - th * 0.16)} L${f(ax)},${f(y - th * 0.5)}Z `;
    shd += `M${f(ax)},${f(y - th * 1.1)} L${f(rr)},${f(y + th * 0.2)} L${f(rr * 0.5)},${f(y - th * 0.16)} L${f(ax)},${f(y - th * 0.5)}Z `;
  }
  return `<path d="M-0.7,${f(-h * 0.2)} h1.4 V0.6 h-1.4Z" fill="${C.trunk}"/><path d="${dark}" fill="${C.fol}"/><path d="${shd}" fill="${C.shade}"/><path d="${lit}" fill="${C.snow}"/>`;
}
// The shadow such a tree lays along the ground: a long ragged spire. dir is the shadow of one unit of height.
export function spireShadow(x, yb, h, w, dir = [1.3, 0.19], rag = 1){
  const n = Math.max(4, Math.round(h / 16)), up = [], dn = [];
  for (let i = 0; i <= n; i++) { const t = i / n, px = x + dir[0] * h * t, py = yb + dir[1] * h * t, hw = w * 0.42 * (1 - t) * (i % 2 ? 1 : 1 - 0.4 * rag) + 0.7; up.push([px, py - hw * 0.34]); dn.unshift([px + dir[0] * h / n * 0.4, py + hw * 0.34 + 0.4]); }
  return poly([[x - w * 0.1, yb - 0.6], ...up, ...dn, [x - w * 0.1, yb + 1.4]]);
}
// A small tree that the winter has buried: no branches show, only a leaning stack of rounded snow, with a little
// dark where the load has slipped.
export function snowGhost(x, yb, h, C, { w = h * 0.34, seed = 1, lean = 0.2, lobes = 3 } = {}){
  const r = source(seed * 4099 + 7), out = [];
  for (let i = 0; i < lobes; i++) {
    const t = i / (lobes - 1 || 1), a = w * lerp(1, 0.3, Math.pow(t, 0.8)) * r(0.9, 1.1), b = h / lobes * lerp(0.9, 0.7, t), cy = yb - h * lerp(0.16, 0.84, t), cx = x + lean * h * t * t * 1.3 + r(-1, 1) * w * 0.05, P = (u, v) => [cx + a * u, cy + b * v];
    if (i) out.push(`<path d="${poly([P(-0.5, 0.5), P(0.9, 0.36), P(0.7, 0.96), P(0.34, 0.74), P(0.1, 1.02), P(-0.2, 0.7)])}" fill="${C.fol}"/>`);
    out.push(`<path d="${smooth([P(-1, 0.52), P(-0.9, -0.1), P(-0.36, -0.66), P(0.36, -0.6), P(0.96, 0), P(1.02, 0.5), P(0.5, 0.66), P(0.06, 0.52), P(-0.5, 0.72)])}" fill="${C.snow}"/><path d="${smooth([P(0.2, -0.64), P(0.96, 0), P(1.02, 0.5), P(0.5, 0.66), P(0.4, 0.1)])}" fill="${C.shade}"/>`);
  }
  return out.join('');
}
// A dead tree left standing: a bare silvered trunk snapped off at the top, a few stubs of limb, and snow plastered
// down the side the weather comes from.
export function snag(x, yb, h, C, { seed = 1, lean = 0.04 } = {}){
  const r = source(seed * 911 + 3), tw = Math.max(1.6, h * 0.035), tx = x + lean * h, top = yb - h, wood = C.wood, dark = C.woodSh, out = [];
  const at = t => [lerp(x, tx, t), lerp(yb, top, t)], wd = t => tw * lerp(1.15, 0.5, t);
  let limbs = '', caps = '';
  for (let i = 0, n = 3 + Math.floor(r(0, 3)); i < n; i++) {
    const t = lerp(0.3, 0.9, (i + r(0.1, 0.9)) / n), s = i % 2 ? 1 : -1, [bx, by] = at(t), len = h * r(0.07, 0.17) * (1.2 - t * 0.5), ex = bx + s * len, ey = by - len * r(-0.12, 0.42);
    limbs += `M${f(bx)},${f(by)} L${f(ex)},${f(ey)} `;
    caps += `M${f(bx + s * wd(t))},${f(by - 1.1)} L${f(ex)},${f(ey - 1.1)} `;
  }
  out.push(`<path d="${limbs}" stroke="${dark}" stroke-width="${f(Math.max(1, tw * 0.5))}" stroke-linecap="round" fill="none"/><path d="${caps}" stroke="${C.snow}" stroke-width="${f(Math.max(0.9, tw * 0.45))}" stroke-linecap="round" fill="none"/>`);
  const a = at(0), b = at(1), w0 = wd(0), w1 = wd(1);
  out.push(`<path d="M${f(a[0] - w0)},${f(a[1] + 1)} L${f(b[0] - w1)},${f(b[1] + w1)} L${f(b[0] - w1 * 0.2)},${f(b[1] - w1 * 1.4)} L${f(b[0] + w1 * 0.3)},${f(b[1] + w1 * 0.6)} L${f(b[0] + w1)},${f(b[1] - w1 * 0.2)} L${f(a[0] + w0)},${f(a[1] + 1)}Z" fill="${wood}"/>`);
  out.push(`<path d="M${f(a[0] + w0 * 0.1)},${f(a[1] + 1)} L${f(b[0] + w1 * 0.3)},${f(b[1] + w1 * 0.6)} L${f(b[0] + w1)},${f(b[1] - w1 * 0.2)} L${f(a[0] + w0)},${f(a[1] + 1)}Z" fill="${dark}"/>`);
  const side = []; for (let k = 0; k <= 6; k++) { const t = lerp(0.04, 0.97, k / 6), p = at(t); side.push([p[0] - wd(t) - (k % 2 ? 0.9 : 0.2) * tw * 0.5, p[1]]); }
  for (let k = 6; k >= 0; k--) { const t = lerp(0.04, 0.97, k / 6), p = at(t); side.push([p[0] - wd(t) * 0.35, p[1]]); }
  out.push(`<path d="${smooth(side)}" fill="${C.snow}"/>`);
  return out.join('');
}

// ---------- ground ----------
// A drift: snow the wind has piled into a long low back. The wind and the sun both come from the left here, so the
// drift climbs gently from that side to a crest and drops away steeply beyond it. Its top is brighter than the
// ground, fading out toward its foot so that no edge shows where it meets the snow in front. The steep side beyond
// the crest is in shade, and that shade carries on across the ground past its foot to a rounded end. The shade is
// returned separately, so that every shadow on the snow can be drawn as one shape in one tone.
export function mound(cx, cy, w, ht, C, { d = w * 0.22, cast = 1, solid = '' } = {}){
  const Ls = ht * 1.3 * cast, q = (a, b) => [cx + w * a, b >= 0 ? cy + d * b : cy + ht * b];
  const dome = [q(-1, 0.1), q(-0.52, -0.42), q(-0.02, -0.84), q(0.4, -1), q(0.76, -0.56), q(1, 0.2), q(0.55, 0.9), q(-0.1, 1), q(-0.7, 0.7)];
  const shade = [q(0.43, -0.98), q(0.76, -0.56), q(0.97, -0.02), [cx + w + Ls * 0.6, cy + d * 0.1 + Ls * 0.11], [cx + w + Ls, cy + d * 0.5 + Ls * 0.19], [cx + w + Ls * 0.4, cy + d * 0.98 + Ls * 0.1], q(0.72, 0.95), q(0.36, 0.98), q(0.56, 0.2), q(0.52, -0.5)];
  const g = L.linGrad(cx - w * 0.1, cy - ht, cx + w * 0.04, cy + d * 0.5, [[0, C.lit, 0.95], [0.4, C.lit, 0.6], [1, C.lit, 0]]);
  // solid: paint the mound in that colour first, for a drift lying against something that is not snow
  return { shadow: smooth(shade), body: `${solid ? `<path d="${smooth(dome)}" fill="${solid}"/>` : ''}<path d="${smooth(dome)}" fill="url(#${g})"/>` };
}
// A boulder under a thick cap of snow, bedded in the snow around it.
export function boulder(x, y, w, h, C, { seed = 1 } = {}){
  const r = source(seed * 53 + 11), q = (a, b) => [x + w * a, y - h * b];
  const rock = [q(-0.5, 0), q(-0.47, 0.4), q(-0.3, 0.78), q(0.02, 0.92), q(0.3, 0.7), q(0.48, 0.34), q(0.52, 0)];
  const face = [q(-0.47, 0.4), q(-0.3, 0.78), q(0.02, 0.92), q(-0.04, 0.46), q(-0.2, 0.2), q(-0.5, 0)];
  const cap = [q(-0.52, 0.42), q(-0.44, 0.72 * r(0.95, 1.05)), q(-0.2, 1.02), q(0.1, 1.08), q(0.34, 0.86), q(0.5, 0.52), q(0.5, 0.3), q(0.34, 0.42), q(0.2, 0.34), q(0.04, 0.52), q(-0.14, 0.4), q(-0.3, 0.5), q(-0.44, 0.3)];
  const capSh = [q(0.1, 1.08), q(0.34, 0.86), q(0.5, 0.52), q(0.5, 0.3), q(0.34, 0.42), q(0.2, 0.34), q(0.12, 0.6)];
  const apron = [q(-0.7, -0.06), q(-0.5, 0.12), q(-0.22, 0.05), q(0.1, 0.13), q(0.4, 0.04), q(0.62, 0.1), q(0.78, -0.06), q(0.2, -0.2), q(-0.3, -0.2)];
  return `<path d="${poly(rock)}" fill="${C.rock}"/><path d="${poly(face)}" fill="${C.rockLit}"/><path d="${smooth(cap.map(p => [p[0], p[1] + Math.max(1.2, h * 0.07)]))}" fill="${C.rock}" fill-opacity="0.55"/><path d="${smooth(cap)}" fill="${C.snow}"/><path d="${smooth(capSh)}" fill="${C.shade}"/><path d="${smooth(apron)}" fill="${C.ground}"/>`;
}

// ---------- people ----------
// A day pack seen from behind, bottom centre at the origin. roll: a rolled mat strapped across the 'top' or under
// the 'bottom'. small: a shorter pack.
function daypack(C, { roll = '', small = false } = {}){
  const H = small ? 24 : 28;
  let s = `<rect x="-9.2" y="${-H}" width="18.4" height="${H}" rx="4.6" fill="${C.bag}"/><path d="M3.6,${-H} H4.6 q4.6,0 4.6,4.6 v${H - 9.2} q0,4.6 -4.6,4.6 H3.6Z" fill="${C.bagSh}"/>`;
  s += `<rect x="-5.8" y="-13.4" width="11.6" height="9.6" rx="2.4" fill="${C.bagSh}" fill-opacity="0.55"/><path d="M-5.8,-10.2 h11.6" stroke="${C.strap}" stroke-width="0.9"/>`;
  s += `<path d="M-9.8,${-H + 5.6} q0,-9.6 3.6,-9.6 h12.4 q3.6,0 3.6,9.6Z" fill="${C.lid}"/><path d="M4.4,${-H - 4} h1.8 q3.6,0 3.6,9.6 H6.2 Q6,${-H - 0.6} 4.4,${-H - 4}Z" fill="${C.bag}"/><path d="M0,${-H + 5.6} v6" stroke="${C.strap}" stroke-width="1.1"/><rect x="-1.5" y="${-H + 10}" width="3" height="2.4" rx="0.6" fill="${C.strap}"/>`;
  const mat = y => `<rect x="-11.4" y="${y}" width="22.8" height="6.4" rx="3.2" fill="${C.rollSh}"/><rect x="-11.4" y="${y}" width="17" height="6.4" rx="3.2" fill="${C.roll}"/><path d="M-5.6,${y - 0.2} v6.8 M5.6,${y - 0.2} v6.8" stroke="${C.bagSh}" stroke-width="1.3"/>`;
  if (roll === 'bottom') s += mat(-2.2);
  if (roll === 'top') s += mat(-H - 9.6);
  return s;
}
// A snowshoe from behind and a little above: a rounded frame wider than the boot, its deck paler, toed out a little.
const snowshoe = (x, y, k, C) => `<g transform="translate(${f(x)},${f(y)}) rotate(${k * 9})"><ellipse cx="0" cy="1.6" rx="6.4" ry="3.3" fill="${C.frame}"/><ellipse cx="0" cy="1.4" rx="4.7" ry="2.1" fill="${C.deck}"/><path d="M-4.6,1.4 h9.2" stroke="${C.frame}" stroke-width="0.9"/></g>`;
// The pair of snowshoes on their own, as they would be left standing in the snow.
export const snowshoes = C => snowshoe(-6.9, 0.4, -1, C) + snowshoe(6.9, 0.4, 1, C);
// Somebody in winter clothes, seen from behind and lit from the left. Origin on the snow between the feet; about
// 100 tall. Nothing bare shows: a hat or a hood covers the head and a scarf fills the collar, so there is no neck
// or hairline to get wrong. Built back to front: snowshoes, boots, legs, poles, arms, jacket, head, then the pack
// on top of the jacket.
// o.head: 'hat' (knitted, with a scarf) or 'hood'. o.poles: both poles planted. o.raise: the right arm lifted to
// point, with its pole if there are poles. o.pack: false, or the options for the pack.
export function winterBack(C, o = {}){
  const { head = 'hat', poles = true, raise = false, pack = {}, shoes = true } = o, jk = C.jacket, jkSh = C.jacketSh;
  let s = '';
  if (shoes) s += snowshoes(C);
  const boot = x => `<path d="M${x - 4.1},1.2 v-8.6 q0,-2 2,-2 h4.2 q2,0 2,2 v8.6Z" fill="${C.boot}"/><rect x="${f(x - 4.5)}" y="-10.4" width="9" height="2.6" rx="1.2" fill="${C.cuff}"/>`;
  s += boot(-6.6) + boot(6.6);
  s += `<path d="M-11,-42 H11 L10.6,-8.6 H2.6 L1,-32 H-1 L-2.6,-8.6 H-10.6Z" fill="${C.legs}"/><path d="M6.2,-42 H11 L10.6,-8.6 H7Z M-2.2,-32 H-1 L-2.6,-8.6 H-4.6Z" fill="${C.legsSh}"/>`;
  // poles stand a little ahead of the feet and lean in to the hands
  const pole = (hx, hy, bx, by) => `<path d="M${hx},${hy} L${bx},${by}" stroke="${C.pole}" stroke-width="1.5" stroke-linecap="round"/><ellipse cx="${bx}" cy="${f(by - 2.4)}" rx="3.1" ry="1.1" fill="none" stroke="${C.pole}" stroke-width="1"/>`;
  const mitt = (x, y, tone) => `<ellipse cx="${x}" cy="${y}" rx="3.2" ry="3.7" fill="${tone}"/>`;
  // left arm, on the lit side
  if (poles) s += pole(-18.2, -50, -23.4, 0.4);
  s += `<path d="${L.limb([-13.2, -68.4], 4.9, [-16.6, -55.6], 4.4, [-17.6, -46.6], 3.8)}" fill="${jk}"/><rect x="-21.4" y="-47.4" width="7.8" height="2.8" rx="1.3" fill="${jkSh}"/>` + mitt(-17.9, -42.4, C.mitt);
  // right arm, in shade: down with its pole, or lifted to point up the slope
  const armSh = mix(jkSh, C.legsSh, 0.18);
  if (raise) {
    if (poles) s += `<path d="M28,-83 L49.6,-104.6" stroke="${C.pole}" stroke-width="1.5" stroke-linecap="round"/><ellipse cx="46.6" cy="-101.4" rx="2.9" ry="1.3" transform="rotate(-45 46.6 -101.4)" fill="none" stroke="${C.pole}" stroke-width="1"/>`;
    s += `<path d="${L.limb([13.4, -68.6], 4.9, [22.4, -72.6], 4.3, [28.6, -81.6], 3.7)}" fill="${armSh}"/><rect x="-3.9" y="-1.4" width="7.8" height="2.8" rx="1.3" transform="translate(28,-80.6) rotate(-56)" fill="${mix(armSh, C.legsSh, 0.4)}"/>` + mitt(30.6, -84.6, C.mittSh);
  } else {
    if (poles) s += pole(18.4, -50, 24, 0.2);
    s += `<path d="${L.limb([13.2, -68.4], 4.9, [16.8, -55.6], 4.4, [17.8, -46.6], 3.8)}" fill="${armSh}"/><rect x="13.8" y="-47.4" width="7.8" height="2.8" rx="1.3" fill="${mix(armSh, C.legsSh, 0.4)}"/>` + mitt(18.1, -42.4, C.mittSh);
  }
  // the jacket: padded, so the shoulders are round and the hem stands off the legs
  const body = 'M-13.6,-67 C-13.6,-74 -7,-76.4 0,-76.4 C7,-76.4 13.6,-74 13.6,-67 L13,-41 Q0,-37.6 -13,-41Z';
  s += `<path d="${body}" fill="${jk}"/><path d="M5.6,-75.8 C10.2,-74.8 13.6,-72.2 13.6,-67 L13,-41 Q9.8,-39.8 6.6,-39.4Z" fill="${jkSh}"/>`;
  s += `<path d="M-12.9,-66.4 Q-13.9,-55 -12.7,-43.4" fill="none" stroke="${jkSh}" stroke-width="1.1" stroke-opacity="0.7"/>`;
  s += `<path d="M-13.4,-61 Q0,-58.8 13.4,-61 M-13.2,-53.4 Q0,-51.2 13.2,-53.4 M-13.1,-45.8 Q0,-43.4 13.1,-45.8" fill="none" stroke="${jkSh}" stroke-width="0.9" stroke-opacity="0.75"/>`;
  if (head === 'hood') {
    // hood up: one rounded shape running straight into the shoulders, with a seam over the crown
    s += `<path d="M-10.6,-72.4 C-8.6,-76.4 -10.2,-80 -10.2,-87 C-10.2,-100 10.2,-100 10.2,-87 C10.2,-80 8.6,-76.4 10.6,-72.4 Q0,-69.6 -10.6,-72.4Z" fill="${jk}"/><path d="M3.6,-96.4 C10.4,-95 10.2,-84 10.2,-87 C10.2,-80 8.6,-76.4 10.6,-72.4 Q7.8,-71.4 5.2,-71.2 C5.2,-76 6.6,-80 6.6,-86 C6.6,-90.6 5.6,-94 3.6,-96.4Z" fill="${jkSh}"/><path d="M0,-96.6 V-71.4" stroke="${jkSh}" stroke-width="0.9" stroke-opacity="0.8"/>`;
  } else {
    // scarf in the collar, hair under the hat, the hat pulled down over the ears
    s += `<rect x="-8.4" y="-79.6" width="16.8" height="6.6" rx="3.2" fill="${C.scarf}"/><path d="M3,-79.6 h2.2 q3.2,0 3.2,3.3 q0,3.3 -3.2,3.3 h-1.4Z" fill="${C.scarfSh}"/>`;
    s += `<path d="M-8.2,-86 h16.4 v4.2 q0,3.4 -3.4,3.4 h-9.6 q-3.4,0 -3.4,-3.4Z" fill="${C.hair}"/>`;
    s += `<path d="M-9.2,-85 C-9.2,-98.6 9.2,-98.6 9.2,-85Z" fill="${C.hat}"/><path d="M3,-94.8 C7,-93.2 9.2,-90 9.2,-85 H4.6Z" fill="${C.hatSh}"/><rect x="-9.8" y="-88.4" width="19.6" height="4.2" rx="1.8" fill="${C.hatBand}"/><rect x="4.4" y="-88.4" width="5.4" height="4.2" rx="1.8" fill="${mix(C.hatBand, C.hatSh, 0.45)}"/><circle cx="0" cy="-97.2" r="2.7" fill="${C.pom}"/>`;
  }
  if (pack) s += `<rect x="-13.2" y="-45.4" width="26.4" height="2.9" rx="1.2" fill="${C.belt}"/><g transform="translate(0,-43.6)">${daypack(C, pack)}</g>`;
  return s;
}
// The shadow such a person lays on the snow. The sun is off to the left, so what falls on the ground is the outline
// of the figure seen side-on: narrow, with the pack standing out behind. Points are [height, how far toward us].
export function figureShadow(x, y, s, dir = [1.3, 0.19], { pack = true } = {}){
  const side = [[0, -3.4], [10, -3.6], [40, -4.6], [46, pack ? -5.4 : -5], [72, pack ? -5.6 : -5.2], [77, -3.6], [80, -4.6], [90, -5.2], [96, -3.6], [98.6, 0], [96, 3.6], [90, 5], [81, 4.4], [77, 3.4], [74, pack ? 9 : 5.4], [58, pack ? 10.4 : 5.6], [44, pack ? 9.4 : 5], [40, 4.6], [10, 3.8], [0, 3.6]];
  return poly(side.map(([hgt, z]) => [x + s * (hgt * dir[0]), y + s * (hgt * dir[1] + z * 0.42)]));
}
