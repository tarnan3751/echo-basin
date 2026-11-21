// Old-growth stand (portrait). Its trunks, moss, ferns and boughs are also used by the trailhead picture.
import * as L from './lib.mjs';
import { fernlet, tuft, rosette, flower, clover, toadstools } from './groundcover.mjs';
const { f, rnd, pick, lerp, mix, poly, curveFn, grain, GL, GR, from, until, between, linGrad, radGrad, clip } = L;

// Outline of a giant trunk with a root flare. shape: { fl: how far the foot spreads (1 doubles the width), fh: how tall
// the spread is, top: where the outline starts, taper: width at the top as a share of the width lower down }.
export const trunkD = (cx, w, baseY, { fl = 1, fh = 92, top = -40, taper = 0.84 } = {}) => {
  const wt = w * taper, a = 0.53 + 0.07 * fl, b = 0.53 + 0.27 * fl, c = 0.53 + 0.47 * fl, y1 = baseY - fh, ya = baseY - fh * 40 / 92, yb = baseY - fh * 8 / 92, yc = baseY - 170 * fh / 92;
  return `M${f(cx - wt / 2)},${top} L${f(cx + wt / 2)},${top} C${f(cx + w * 0.49)},${f(baseY * 0.5)} ${f(cx + w * 0.5)},${f(yc)} ${f(cx + w * 0.53)},${f(y1)} C${f(cx + w * a)},${f(ya)} ${f(cx + w * b)},${f(yb)} ${f(cx + w * c)},${f(baseY + 6)} L${f(cx - w * c)},${f(baseY + 6)} C${f(cx - w * b)},${f(yb)} ${f(cx - w * a)},${f(ya)} ${f(cx - w * 0.53)},${f(y1)} C${f(cx - w * 0.5)},${f(yc)} ${f(cx - w * 0.49)},${f(baseY * 0.5)} ${f(cx - wt / 2)},${top}Z`;
};
// Half the width of that outline at height y. The flare makes the edge a curve, so walk it.
export function trunkHalf(w, baseY, y, { fl = 1, fh = 92, top = -40, taper = 0.84 } = {}){
  const cub = (a, b, c, d, t) => { const u = 1 - t; return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d; };
  const seg = y <= baseY - fh
    ? [[taper / 2 * w, top], [0.49 * w, baseY * 0.5], [0.5 * w, baseY - 170 * fh / 92], [0.53 * w, baseY - fh]]
    : [[0.53 * w, baseY - fh], [(0.53 + 0.07 * fl) * w, baseY - fh * 40 / 92], [(0.53 + 0.27 * fl) * w, baseY - fh * 8 / 92], [(0.53 + 0.47 * fl) * w, baseY + 6]];
  let lo = 0, hi = 1;
  for (let i = 0; i < 22; i++) { const m = (lo + hi) / 2; if (cub(seg[0][1], seg[1][1], seg[2][1], seg[3][1], m) < y) lo = m; else hi = m; }
  return cub(seg[0][0], seg[1][0], seg[2][0], seg[3][0], (lo + hi) / 2);
}
// Giant trunk; lit from the left with a thin warm rim. bark is how many furrows to draw; barkLen their length.
export function trunk(cx, w, baseY, tone, rim, { bark = 0, rimW = 3, shade, shape, barkLen = [60, 240], barkW = [1.2, 3.2], flat = false, litGrain = true } = {}){
  const top = (shape && shape.top !== undefined) ? shape.top : -40, d = trunkD(cx, w, baseY, shape);
  let s = `<path d="${d}" fill="${rim}"/><path d="${d}" fill="${tone}" transform="translate(${rimW},0)"/>`;
  if (bark) {
    const cid = clip(d); let b = '';
    for (let k = 0; k < bark; k++) { const x = cx + rnd(-0.44, 0.46) * w, y = rnd(-30, baseY - 120), h = rnd(barkLen[0], barkLen[1]); b += `<path d="M${f(x)},${f(y)} q${f(rnd(-3, 3))},${f(h / 2)} ${f(rnd(-2, 2))},${f(h)}" stroke-width="${f(rnd(barkW[0], barkW[1]))}"/>`; }
    s += `<g clip-path="url(#${cid})" transform="translate(${rimW},0)"><g stroke="${shade}" fill="none" stroke-linecap="round" ${flat ? 'stroke-opacity' : 'opacity'}="0.7">${b}</g>${grain(cx, top, w * 0.6, baseY + 50, GL(cx + w * 0.55, 0, cx + w * 0.02, 0, [[0, 0.6], [0.5, 0.25], [1, 0]]), shade)}${litGrain ? grain(cx - w * 0.56, top, w * 0.4, baseY + 50, GL(cx - w * 0.52, 0, cx - w * 0.2, 0, [[0, 0.5], [1, 0]]), mix(tone, L.P.peach, 0.45)) : ''}</g>`;
  }
  return s;
}
export const shared = L.shared, clipTo = L.clipTo;      // (defined in the library; exported here for the scenes that take them from this file)
// Smooth curve through points (x ascending): cubic Hermite with averaged slopes.
export function spline(pts){
  const n = pts.length, m = pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)]; return (b[1] - a[1]) / (b[0] - a[0]); });
  return x => {
    let i = 1; while (i < n - 1 && x > pts[i][0]) i++;
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], h = x1 - x0, t = Math.max(-0.2, Math.min(1.2, (x - x0) / h)), t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * h * m[i - 1] + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * h * m[i];
  };
}
// Repeatable 0..1 value for item i, for variation that must not disturb the shared random sequence.
export const hash = i => { const v = Math.sin(i * 127.1 + 31.7) * 43758.5453; return v - Math.floor(v); };

// A patch where the bark has been torn off. Several shapes give it depth: the cut edge of the bark catching light
// along the bottom and right, wood lying in shadow under the upper lip, lit wood below that, its grain, a deeper
// furrow or two, and slabs of bark that held on and still reach in over the wood. The outline is broken in short
// level runs, the way bark comes away in slabs. Shape, size, tilt and position vary from tree to tree; only the
// height is shared.
function scar(cx, w, y, { size = 1, bark, lipTone, haze = null, chip = true } = {}){
  const P = L.P, fade = c => haze ? mix(c, haze[0], haze[1]) : c, ws = w * size;
  const wood = fade(mix(P.cream, P.peach, 0.3)), woodSh = fade(mix(P.peach, P.plumDeep, 0.62)), grainTone = fade(mix(P.peach, P.plum, 0.4)), furrow = fade(mix(P.plum, P.peach, 0.3));
  const ww = ws * rnd(0.44, 0.88), hh = Math.max(5, ws * rnd(0.24, 0.5));
  const x0 = cx - ww / 2 + ws * rnd(-0.1, 0.1), tilt = rnd(-0.16, 0.16), mid = x => y + (x - cx) * tilt;
  const kind = Math.floor(rnd(0, 4));                           // 0 even, 1 heavier on the left, 2 heavier on the right, 3 two lobes
  const env = t => Math.pow(Math.sin(Math.PI * (0.05 + 0.9 * t)), 0.5) * (kind === 1 ? 1.25 - 0.7 * t : kind === 2 ? 0.55 + 0.7 * t : kind === 3 ? 0.6 + 0.4 * Math.abs(Math.cos(Math.PI * (t * 1.15 + 0.1))) : 1);
  const cw = Math.max(2.4, ws * 0.07), n = Math.max(4, Math.round(ww / cw));
  const edge = sgn => {
    const pts = []; let run = 0, lvl = 0.8;
    for (let i = 0; i < n; i++) {
      const xa = x0 + ww * i / n, xb = x0 + ww * (i + 1) / n, reach = hh * 0.5 * env((i + 0.5) / n);
      if (run-- <= 0) { lvl = rnd(0.62, 1.05); run = Math.floor(rnd(0, 2.4)); }
      pts.push([xa + cw * 0.14, mid(xa) + sgn * reach * lvl * rnd(0.95, 1.05)], [xb - cw * 0.14, mid(xb) + sgn * reach * lvl * rnd(0.95, 1.05)]);
    }
    return pts;
  };
  const d = poly([[x0 - cw * 0.3, mid(x0)], ...edge(-1), [x0 + ww + cw * 0.3, mid(x0 + ww)], ...edge(1).reverse()]), cid = clip(d), lip = Math.max(0.8, ws * 0.02);
  let s = `<path d="${d}" fill="${lipTone}" transform="translate(${f(lip * 1.1)},${f(lip * 1.5)})"/><path d="${d}" fill="${woodSh}"/>`;
  s += `<g clip-path="url(#${cid})"><path d="${d}" fill="${wood}" transform="translate(${f(lip * 1.4)},${f(Math.max(2, hh * 0.24))})"/>`;
  let g = '';
  for (let i = 0, gn = Math.round(n * 0.8); i < gn; i++) { const x = x0 + ww * rnd(0.05, 0.95); g += `M${f(x)},${f(mid(x) - hh)} l${f(rnd(-1, 1))},${f(hh * 2)} `; }
  s += `<path d="${g}" stroke="${grainTone}" stroke-width="${f(Math.max(0.5, ws * 0.008))}" fill="none" opacity="0.4"/>`;
  for (let i = 0, k = ww > 14 ? Math.floor(rnd(0, 2.6)) : 0; i < k; i++) {
    const x = x0 + ww * rnd(0.15, 0.85), fw = Math.max(0.8, cw * rnd(0.16, 0.3)), ya = mid(x) - hh * rnd(0.02, 0.2), yb = mid(x) + hh * rnd(0.1, 0.3);
    s += `<path d="M${f(x)},${f(ya)} Q${f(x + fw)},${f((ya + yb) / 2)} ${f(x + rnd(-1, 1) * fw)},${f(yb)} Q${f(x - fw)},${f((ya + yb) / 2)} ${f(x)},${f(ya)}Z" fill="${furrow}" opacity="0.75"/>`;
  }
  for (let i = 0, k = ww > 12 ? Math.floor(rnd(0.4, 2.4)) : 0; i < k; i++) {
    const t = rnd(0.16, 0.84), x = x0 + ww * t, sgn = rnd() < 0.65 ? -1 : 1, reach = hh * 0.5 * env(t), fw = cw * rnd(0.5, 1);
    const ye = mid(x) + sgn * reach * 1.2, yt = ye - sgn * reach * rnd(0.55, 1.1), slant = rnd(-0.35, 0.35) * fw;
    const slab = `M${f(x - fw)},${f(ye)} L${f(x + fw)},${f(ye)} L${f(x + fw * 0.8)},${f(yt + slant)} L${f(x + fw * 0.1)},${f(yt + sgn * fw * 0.3)} L${f(x - fw * 0.75)},${f(yt - slant)}Z`;
    s += `<path d="${slab}" fill="${woodSh}" transform="translate(${f(lip * 1.4)},${f(lip * 1.2)})"/><path d="${slab}" fill="${bark}"/>`;
  }
  s += '</g>';
  // sometimes a second, smaller piece has come away beside it
  if (chip && ws > 18 && rnd() < 0.5) s += scar(cx + (rnd() < 0.5 ? -1 : 1) * ws * rnd(0.16, 0.3), w, y + (rnd() < 0.5 ? -1 : 1) * hh * rnd(0.8, 1.2), { size: size * rnd(0.26, 0.4), bark, lipTone, haze, chip: false });
  return s;
}

// Moss. Three things together: growth up the bark, drawn as stipple that is dense at the foot on the side the moss
// favours and breaks up with height (each speck has a dark twin just below it, so the growth sits proud of the bark);
// a low carpet over the foot, built from overlapping rounds so its edge is lumpy, with a dark underside and a lit
// rim; and a few small mats just above the carpet. Everything is held inside the trunk.
// ground is the height of the ground line, or a function of x where the ground slopes.
export function moss(cx, w, baseY, ground, { top = 140, lean = -1, size = 1, tone, dark, hi, seed = 1, xmin = -20, xmax = 820, shape, twin = true, carpetGrain = true } = {}){
  const r0 = Math.max(3, w * 0.075) * size, blobs = [], gy = typeof ground === 'function' ? ground : () => ground;
  const span = trunkHalf(w, baseY, Math.min(baseY, gy(cx)) - 2, shape), ph = rnd(0, 6);
  const put = (x, y, r) => { if (x > xmin && x < xmax) blobs.push([x, y, r * rnd(0.9, 1.25), r * rnd(0.7, 1)]); };
  for (let x = cx - span; x <= cx + span; x += r0 * 0.7) {
    const heavy = Math.max(0, Math.min(1, 0.5 + 0.5 * lean * (x - cx) / span));
    const hgt = r0 * (0.5 + 2.6 * Math.pow(heavy, 1.4)) * (0.8 + 0.3 * Math.sin(x / (r0 * 2.3) + ph) + 0.16 * Math.sin(x / (r0 * 0.9) + ph * 2));
    for (let h = -r0; h < hgt; h += r0 * 0.7) put(x + rnd(-1, 1), gy(x) - h, r0);
  }
  for (let i = 0, n = 3 + Math.round(w / 45); i < n; i++) {
    const x = cx + (rnd() < 0.8 ? lean : -lean) * span * rnd(0.05, 0.8), y = gy(x) - r0 * rnd(3.4, 7), r = r0 * rnd(0.7, 1.05);
    for (let j = 0, m = 2 + Math.floor(rnd(0, 4)); j < m; j++) put(x + (j - m / 2) * r * 1.1 + rnd(-0.3, 0.3) * r, y + rnd(-0.5, 0.5) * r, r);
  }
  const ell = ([x, y, rx, ry]) => `M${f(x - rx)},${f(y)} a${f(rx)},${f(ry)} 0 1,0 ${f(rx * 2)},0 a${f(rx)},${f(ry)} 0 1,0 ${f(-rx * 2)},0Z`;
  const id = shared(blobs.map(ell).join(' '));
  const fx = Math.max(xmin + 20, Math.min(xmax - 20, cx + lean * span * 0.5)), fy = gy(fx);
  const bx = Math.max(xmin, cx - span - 6), bw = Math.min(xmax, cx + span + 6) - bx, by = fy - top * 1.05, bh = top * 1.05 + r0 * 2;
  const growth = (color, sd) => grain(bx, by, bw, bh, GR(fx, fy, top, [[0, 0.9], [0.3, 0.56], [0.6, 0.2], [1, 0]]), color, { seed: sd });
  return `<g clip-path="url(#${clip(trunkD(cx, w, baseY, shape))})">${twin ? `<g transform="translate(${f(r0 * 0.12)},${f(r0 * 0.2)})">${growth(dark, seed)}</g>` : ''}${growth(tone, seed)}`
    + `<use href="#${id}" fill="${dark}" transform="translate(${f(r0 * 0.3)},${f(r0 * 0.5)})"/><use href="#${id}" fill="${hi}"/><use href="#${id}" fill="${tone}" transform="translate(${f(r0 * 0.14)},${f(r0 * 0.26)})"/>`
    + (carpetGrain ? grain(bx, fy - r0 * 9, bw, r0 * 11, GL(0, fy - r0 * 8, 0, fy, [[0, 0.1], [1, 0.4]]), dark, { clipId: clipTo(id), seed: seed + 40 }) : '') + `</g>`;
}

// One fern frond: a midrib that arches over and droops toward its tip, with the leaflets drawn as a single
// saw-edged blade around it. a is the angle it leaves the ground at, from upright (radians, positive leans right).
export function frond(x, y, len, a, { droop = 1, wide = 0.2, step = 3.6 } = {}){
  const dir = a >= 0 ? 1 : -1, N = 22, seg = len / N, R = [];
  let px = x, py = y, ang = a;
  for (let i = 0; i <= N; i++) { R.push([px, py, ang]); const t = i / N; ang += dir * droop * 0.055 * (0.3 + 2.3 * t * t); px += Math.sin(ang) * seg; py -= Math.cos(ang) * seg; }
  const at = t => { const u = Math.max(0, Math.min(N - 0.001, t * N)), i = Math.floor(u), k = u - i, A = R[i], B = R[i + 1]; return [lerp(A[0], B[0], k), lerp(A[1], B[1], k), lerp(A[2], B[2], k)]; };
  const n = Math.max(6, Math.round(len / step));
  const side = sgn => { const pts = [];
    for (let i = 0; i < n; i++) {
      const t = 0.07 + 0.9 * i / n, [qx, qy, qa] = at(t), l = len * wide * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.6)), 0.85) * rnd(0.85, 1.12) + 0.6;
      const tx = Math.sin(qa), ty = -Math.cos(qa);
      pts.push([qx - ty * sgn * l + tx * l * 0.3, qy + tx * sgn * l + ty * l * 0.3]);          // leaflet tip, swept toward the end of the frond
      const [rx, ry, ra] = at(t + 0.5 / n), l2 = l * 0.16;
      pts.push([rx + Math.cos(ra) * sgn * l2, ry + Math.sin(ra) * sgn * l2]);                    // notch before the next leaflet
    }
    return pts; };
  const [ex, ey] = at(1);
  return { d: poly([[x, y], ...side(-1), [ex, ey], ...side(1).reverse()]), rib: 'M' + R.filter((_, i) => i % 2 === 0).map(p => `${f(p[0])},${f(p[1])}`).join(' L') };
}
// A fern: a fan of fronds from one crown. The outer fronds are longer and lie lower, the middle ones stand up; some
// sit behind in the shade tone. Count, spread, lean, width and droop all vary, so no two clumps match.
export function fern(x, y, s, tone, shade, { n = 0, spread = 1.2, lean = 0, wide = 0.2, droop = 1, step = 3.6 } = {}){
  n = n || 5 + Math.floor(rnd(0, 4));
  const fr = [];
  for (let k = 0; k < n; k++) {
    const u = n === 1 ? 0 : (k / (n - 1)) * 2 - 1;
    fr.push({ a: u * spread + lean + rnd(-0.14, 0.14), len: s * (0.6 + 0.45 * Math.pow(Math.abs(u), 0.8)) * rnd(0.82, 1.15), droop: droop * (1 - 0.4 * Math.abs(u)) * rnd(0.7, 1.25), back: rnd() < 0.45 });
  }
  const draw = (q, fill, rib) => { const g = frond(x + rnd(-1.5, 1.5), y, q.len, q.a, { droop: q.droop, wide: wide * rnd(0.85, 1.15), step }); return `<path d="${g.d}" fill="${fill}"/><path d="${g.rib}" fill="none" stroke="${rib}" stroke-width="${f(Math.max(0.5, s * 0.016))}" stroke-linecap="round" opacity="0.8"/>`; };
  return fr.filter(q => q.back).map(q => draw(q, shade, tone)).join('') + fr.filter(q => !q.back).map(q => draw(q, tone, shade)).join('');
}

// A conifer bough seen side-on. The limb leaves the trunk at (x, y), sags under its own weight and lifts a little at
// the tip. Sprays hang beneath it in an uneven fringe, long and short alternating, each one dropping almost straight
// down on its outer side with its underside climbing back toward the trunk. dir = 1 reaches right, -1 reaches left. Returns the path data for one closed silhouette.
export function bough(x, y, len, dir, { sag = 0.26, hang = 0.22, lift = 0.07, n = 0, th = 0, bare = 0.1 } = {}){
  n = n || Math.max(5, Math.round(len / 24)); th = th || Math.max(2, len * 0.03);
  const sp = t => [x + dir * len * t, y + len * (sag * Math.pow(t, 1.5) - lift * Math.pow(t, 5))];
  // how far the foliage hangs at each point: nothing on the first stretch by the trunk, fullest before the middle
  const dep = t => { const u = Math.max(0, (t - bare) / (1 - bare)); return len * hang * Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(u, 0.72))), 0.8); };
  const thick = t => th * Math.pow(1 - t, 0.7);
  // upper edge: short twigs standing off the limb, leaning toward its tip, uneven in height
  const m = Math.max(5, Math.round(len / 9)), step = len / m;
  let d = `M${f(x)},${f(y - th)}`, px = x, py = y - th;
  for (let i = 1; i <= m; i++) {
    const t1 = i / m, [bx, by] = sp(t1), ey = i === m ? by : by - thick(t1);
    const h = (len * 0.012 + dep(t1 - 0.5 / m) * 0.2) * rnd(0.45, 1.1);
    const tipx = bx + dir * step * rnd(0.15, 0.5), tipy = ey - h;
    d += ` Q${f(lerp(px, tipx, 0.5))},${f(lerp(py, tipy, 0.62))} ${f(tipx)},${f(tipy)} L${f(bx)},${f(ey)}`;
    px = bx; py = ey;
  }
  const notch = t => { const [qx, qy] = sp(t); return [qx, qy + thick(t) + dep(t) * 0.26]; };
  for (let i = n - 1; i >= 0; i--) {
    const t0 = i / n, t1 = (i + 1) / n;
    const dd = dep(lerp(t0, t1, 0.5)) * rnd(0.55, 1.25) + len * 0.03;
    const [sx, sy] = sp(lerp(t0, t1, 0.8));
    const tx = sx + dir * dd * 0.14, ty = sy + thick(t0) + dd;
    const [nx, ny] = notch(t0);
    // main spray
    d += ` Q${f(lerp(px, tx, 0.15))},${f(lerp(py, ty, 0.72))} ${f(tx)},${f(ty)}`;
    // step back up, then a shorter spray tucked behind it
    const s1x = lerp(tx, nx, 0.46), s1y = ty - dd * rnd(0.4, 0.56);
    const d2 = dd * rnd(0.22, 0.4), t2x = lerp(tx, nx, 0.5), t2y = Math.max(s1y + d2, ny + 2);
    d += ` Q${f(lerp(tx, s1x, 0.55))},${f(ty - dd * 0.1)} ${f(s1x)},${f(s1y)} Q${f(lerp(s1x, t2x, 0.2))},${f(lerp(s1y, t2y, 0.7))} ${f(t2x)},${f(t2y)} Q${f(lerp(t2x, nx, 0.5))},${f(t2y - d2 * 0.25)} ${f(nx)},${f(ny)}`;
    px = nx; py = ny;
  }
  return d + 'Z';
}

// Convex outline of a set of points.
const hull = pts => {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const q of p) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.slice().reverse()) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
};
// A fallen log, built in the picture's own perspective: a cylinder lying on the ground from a (its far end) to b (its
// near end), both given as ground positions [X, Z], with radius r. at3(X, Z, h) gives the point in the picture for a
// ground position and a height above the ground; eye is the viewer's height. Because it is a real cylinder seen from
// where the viewer stands, it thickens toward the near end, and the cut face there is the ellipse that end really
// shows. crossShadow is the outline of whatever shadows lie across it.
// Returns the log, the outline of its own shadow on the ground, where it sits in depth, and the box it covers.
function fallenLog(at3, eye, a, b, r, C, crossShadow){
  const ux = b[0] - a[0], uz = b[1] - a[1], len = Math.hypot(ux, uz), u = [ux / len, uz / len];
  let v = [u[1], -u[0]]; if (v[1] > 0) v = [-v[0], -v[1]];                                  // level, across the log, toward the viewer
  // a point on the log: t along it (0 far, 1 near), phi round it (0 facing the viewer, a quarter-turn on top), k out from the middle
  const S = (t, phi, k = 1) => { const c = Math.cos(phi) * r * k; return at3(a[0] + ux * t + v[0] * c, a[1] + uz * t + v[1] * c, r + Math.sin(phi) * r * k); };
  // where the log's outline runs, seen from the eye: along its underside and along its top
  const under = t => Math.atan((v[0] * (a[0] + ux * t) + v[1] * (a[1] + uz * t)) / (eye - r)), over = t => under(t) + Math.PI;
  const ts = (n, t0 = 0, t1 = 1) => Array.from({ length: n + 1 }, (_, i) => lerp(t0, t1, i / n)), arc = (t, p0, p1, n, k = 1) => ts(n).map(q => S(t, lerp(p0, p1, q), k));
  const along = (phi, t0 = 0, t1 = 1, n = 8) => ts(n, t0, t1).map(t => S(t, typeof phi === 'function' ? phi(t) : phi));
  const outline = [...along(over), ...arc(1, over(1), over(1) + Math.PI, 16), ...along(under).reverse()], body = poly(outline), bc = clip(body);
  // the dark line where it rests on the ground, so it sits instead of floating
  const rest = ts(8).map(t => at3(a[0] + ux * t + v[0] * r * 3, a[1] + uz * t + v[1] * r * 3, 0));
  let s = `<path d="${poly([...along(under), ...rest.reverse()])}" fill="${C.shade}" fill-opacity="0.5"/><path d="${body}" fill="${C.barkDark}"/><g clip-path="url(#${bc})">`;
  // bark: the upper side catches some light; furrows run along the grain
  s += `<path d="${poly([...along(over), ...arc(1, over(1), 0.3, 6), ...along(0.3).reverse()])}" fill="${C.bark}"/>`;
  let fur = ''; [-0.98, -0.62, -0.3, 0.02, 0.5].forEach((phi, i) => { for (const [t0, t1] of [[0.56 + 0.1 * hash(i + 3), 0.74 + 0.08 * hash(i + 11)], [0.82 + 0.05 * hash(i + 19), 0.9 + 0.075 * hash(i + 27)]]) { const p = S(t0, phi), q = S(t1, phi); fur += `M${f(p[0])},${f(p[1])} L${f(q[0])},${f(q[1])} `; } });
  s += `<path d="${fur}" stroke="${C.furrow}" stroke-width="1.3" stroke-linecap="round" fill="none" stroke-opacity="0.7"/>`;
  // moss along the top, its lower edge wandering, giving out before the cut end
  const fade = t => { const q = Math.max(0, Math.min(1, (t - 0.86) / 0.11)); return q * q * (3 - 2 * q); };
  const edge = t => lerp(0.6 + 0.3 * Math.sin(t * 37 + 1) + 0.16 * Math.sin(t * 83), over(t), fade(t));
  const mossD = poly([...along(over, 0, 0.975, 10), ...along(edge, 0, 0.975, 40).reverse()]);
  s += `<path d="${mossD}" fill="${C.mossDark}" transform="translate(0.8,2.4)"/><path d="${mossD}" fill="${C.moss}"/>`;
  s += `<path d="${poly([...along(over, 0, 0.93, 8), ...along(t => over(t) - 0.34 - 0.12 * Math.sin(t * 61), 0, 0.93, 24).reverse()])}" fill="${C.mossHi}" fill-opacity="0.75"/>`;
  s += `<path d="${crossShadow}" fill="${C.shade}" fill-opacity="0.34"/></g>`;
  // the stub of a branch, snapped off short
  { const t = 0.86, phi = 1.2, c = Math.cos(phi) * r, cx = a[0] + ux * t, cz = a[1] + uz * t, tip = (d, h) => at3(cx + v[0] * c * 1.05 + u[0] * d, cz + v[1] * c * 1.05 + u[1] * d, r + Math.sin(phi) * r + h);
    s += `<path d="${poly([S(t - 0.012, phi), tip(-0.1, 0.13), tip(-0.082, 0.118), S(t + 0.01, phi)])}" fill="${C.barkDark}"/><path d="${poly([S(t - 0.012, phi), tip(-0.1, 0.13), tip(-0.094, 0.126), S(t - 0.004, phi)])}" fill="${C.barkLit}"/>`; }
  // the cut end: a rim of bark, the wood, its rings and a drying crack
  const ring = k => poly(arc(1, 0, Math.PI * 2, 30, k).slice(0, -1)), mid = S(1, 0, 0), rim = S(1, 2.2, 0.83);
  s += `<path d="${ring(1)}" fill="${C.barkEdge}"/><path d="${ring(0.88)}" fill="${C.wood}"/><path d="${poly([...arc(1, 0.9, 3.5, 12, 0.88), ...arc(1, 3.5, 0.9, 12, 0.7)])}" fill="${C.woodLit}" fill-opacity="0.6"/>`;
  s += `<g fill="none" stroke="${C.ring}"><path d="${ring(0.66)}" stroke-width="1.1"/><path d="${ring(0.42)}" stroke-width="1.1"/><path d="${ring(0.2)}" stroke-width="1"/><path d="M${f(mid[0])},${f(mid[1])} L${f(rim[0])},${f(rim[1])}" stroke-width="1" stroke-linecap="round"/></g><path d="${ring(0.07)}" fill="${C.ring}"/>`;
  // its shadow on the ground: the strip it lies on, carried off in the direction the trunk shadows run
  const sd = [0.793, -0.609], Ls = r * 4.4, foot = [[a, 1], [a, -1], [b, 1], [b, -1]].map(([p, k]) => [p[0] + v[0] * r * k, p[1] + v[1] * r * k]);
  let sh = hull([...foot, ...foot.map(p => [p[0] + sd[0] * Ls, p[1] + sd[1] * Ls])]).map(p => at3(p[0], p[1], 0));
  { let area = 0; for (let i = 0; i < sh.length; i++) { const q = sh[(i + 1) % sh.length]; area += sh[i][0] * q[1] - q[0] * sh[i][1]; } if (area < 0) sh.reverse(); }     // wound the same way as the trunk shadows, so they merge
  const seen = outline.filter(p => p[0] > 100), xs = seen.map(p => p[0]), ys = seen.map(p => p[1]);
  return { svg: s, shadow: poly(sh), key: at3(b[0], b[1], 0)[1], box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] };
}

// A cushion of moss on the ground: a few low domes run together, lit along the top, with its shadow beside it.
function cushion(x, y, w, h, tone, hi, dark){
  let d = ''; const n = 2 + Math.floor(rnd(0, 2.6));
  for (let i = 0; i < n; i++) { const t = i / (n - 1), rx = w / n * rnd(0.72, 1), cx = x - w / 2 + rx + (w - 2 * rx) * t, ry = h * rnd(0.7, 1.1); d += `M${f(cx - rx)},${f(y)} a${f(rx)},${f(ry)} 0 0 1 ${f(rx * 2)},0Z `; }
  const id = L.shared(d);
  return `<ellipse cx="${f(x + w * 0.16)}" cy="${f(y + 0.6)}" rx="${f(w * 0.56)}" ry="${f(Math.max(1, h * 0.16))}" fill="${dark}" opacity="0.4"/><use href="#${id}" fill="${hi}" transform="translate(-0.8,-1.1)"/><use href="#${id}" fill="${tone}"/>`;
}

// The hiker's pack, seen square-on: the bag, its lid, a bedroll strapped across the top, a bottle in the side pocket.
// Origin: the middle of its bottom edge. It stands about 40 tall.
function pack(P){
  const bag = P.tealDeep, dark = P.ink, strap = mix(P.tealLight, P.cream, 0.3);
  return `<rect x="-12.7" y="-18" width="3.8" height="11" rx="1.6" fill="${mix(P.haze, P.cream, 0.55)}"/><rect x="-12.2" y="-20" width="2.8" height="2.6" rx="0.8" fill="${P.coral}"/>`
    + `<rect x="-9.4" y="-29.4" width="18.8" height="29.4" rx="4.4" fill="${bag}"/><path d="M3.4,-29.4 H5 q4.4,0 4.4,4.4 v20.6 q0,4.4 -4.4,4.4 H3.4Z" fill="${dark}"/>`
    + `<rect x="-6" y="-14.8" width="12" height="10.6" rx="2.4" fill="none" stroke="${strap}" stroke-width="1" opacity="0.8"/><path d="M-6,-11.2 h12" stroke="${strap}" stroke-width="1" opacity="0.8"/>`
    + `<path d="M-10,-26.4 q0,-7.6 3.4,-7.6 h13.2 q3.4,0 3.4,7.6Z" fill="${P.teal}"/><path d="M4,-34 h2.6 q3.4,0 3.4,7.6 H5.6 Q5.4,-31 4,-34Z" fill="${bag}"/><path d="M0,-26.4 v8" stroke="${strap}" stroke-width="1.2"/><rect x="-1.5" y="-21.4" width="3" height="2.6" rx="0.6" fill="${strap}"/>`
    + `<rect x="-11" y="-40.4" width="22" height="7" rx="3.5" fill="${P.creamSh}"/><rect x="-11" y="-40.4" width="16.4" height="7" rx="3.5" fill="${P.cream}"/><path d="M-6,-40.6 v7.4 M6,-40.6 v7.4" stroke="${bag}" stroke-width="1.4"/>`;
}
// A hiker seen from behind, walking away up the boardwalk: boots, trousers, jacket, the pack, a knitted hat, a pole in
// the right hand. The bedroll hides his neck, so his head shows from the ears up. Lit from the left. Origin: on the ground between the feet. About 100 tall.
function hikerBack(P){
  const sk = '#EDB08C', skSh = '#C98A70', jk = P.coral, jkSh = P.coralSh, tr = P.plum, trSh = P.plumDeep, cap = P.tealLight;
  const boot = (x, y) => `<path d="M${x - 3.9},${y + 0.6} v-6 q0,-2.2 2.2,-2.2 h3.4 q2.2,0 2.2,2.2 v6Z" fill="${P.ink}"/><rect x="${x - 4.1}" y="${f(y - 0.9)}" width="8.2" height="1.7" rx="0.8" fill="${mix(P.ink, P.haze, 0.5)}"/>`;
  let s = boot(-6.2, 0) + boot(6.4, -1.8);                                                   // the right foot is a step ahead, so it sits a little higher
  s += `<path d="M-10.4,-41 H10.4 L9.8,-9.2 H3 L1.2,-33 H-1.2 L-2.6,-7.4 H-9.6Z" fill="${tr}"/><path d="M6,-41 H10.4 L9.8,-9.2 H6.8Z M-2.4,-33 H-1.2 L-2.6,-7.4 H-4.4Z" fill="${trSh}"/>`;
  // the arm on the lit side, the jacket, then the pole and the arm that holds it
  s += `<path d="${L.limb([-13, -68.6], 4.5, [-15.8, -55], 4, [-15, -44.6], 3.4)}" fill="${jk}"/><ellipse cx="-14.9" cy="-40.4" rx="2.9" ry="3.3" fill="${sk}"/><rect x="-18.6" y="-45.6" width="7.2" height="2.8" rx="1.3" fill="${jkSh}"/>`;
  s += `<path d="M-12.8,-68 C-12.8,-73.6 -6.4,-75.6 0,-75.6 C6.4,-75.6 12.8,-73.6 12.8,-68 L11.8,-39 Q0,-37 -11.8,-39Z" fill="${jk}"/><path d="M5.4,-75 C9.6,-74 12.8,-72 12.8,-68 L11.8,-39 Q9.2,-38.2 6.6,-38Z" fill="${jkSh}"/><path d="M-11.8,-41.8 Q0,-39.8 11.8,-41.8" fill="none" stroke="${jkSh}" stroke-width="1.2"/>`;
  s += `<path d="M17,-51 L21.6,1" stroke="${P.cream}" stroke-width="1.6" stroke-linecap="round"/><path d="M19.6,-3.6 h3.6" stroke="${P.cream}" stroke-width="1.2" stroke-linecap="round"/>`;
  s += `<path d="${L.limb([13, -68.6], 4.5, [16.2, -55.4], 4, [17.4, -46], 3.4)}" fill="${jkSh}"/><ellipse cx="17.7" cy="-42.2" rx="2.9" ry="3.2" fill="${skSh}"/><rect x="13.8" y="-47.4" width="7.2" height="2.8" rx="1.3" fill="${mix(jkSh, P.plumDeep, 0.35)}"/>`;
  // The head: hair, ears, a knitted hat. It is drawn before the pack, because the bedroll rides behind his neck and
  // hides everything below the ears, so no neck shows. Then the hip belt and the pack.
  s += `<g transform="translate(0,-0.9)"><circle cx="0" cy="-85" r="8.6" fill="${P.plumDeep}"/><ellipse cx="-8.5" cy="-83.8" rx="1.9" ry="2.5" fill="${sk}"/><ellipse cx="8.5" cy="-83.8" rx="1.9" ry="2.5" fill="${skSh}"/>`
    + `<path d="M-9.1,-86.4 C-9.1,-98 9.1,-98 9.1,-86.4Z" fill="${cap}"/><path d="M2.8,-94.6 C6.8,-93.2 9.1,-90.6 9.1,-86.4 H4.2Z" fill="${P.teal}"/><rect x="-9.7" y="-89.6" width="19.4" height="3.8" rx="1.7" fill="${mix(cap, P.cream, 0.5)}"/><circle cx="0" cy="-96.8" r="2.5" fill="${P.cream}"/></g>`;
  s += `<rect x="-12" y="-44.6" width="24" height="2.8" rx="1" fill="${P.ink}"/><g transform="translate(0,-41)">${pack(P)}</g>`;
  return s;
}

export function oldgrowth(){
  L.usePalette('gold'); L.begin(); L.reseed(23); L.setSun({ x: -400, y: -200, r: 0 }); L.setWater(1000);
  const P = L.P, W = 800, H = 1000, o = [];
  const slot = () => { o.push(''); return o.length - 1; };      // a place in the drawing order, filled in at the end
  o.push(`<rect x="0" y="-60" width="${W}" height="${H + 150}" fill="url(#${linGrad(0, 0, 0, H, [[0, P.skyHorizon], [0.3, P.peach], [0.62, mix(P.haze, P.peach, 0.3)], [1, P.tealDeep]])})"/>`);
  o.push(`<circle cx="150" cy="60" r="620" fill="url(#${radGrad(150, 60, 620, [[0, P.sun, 0.9], [0.4, P.cream, 0.4], [1, P.cream, 0]])})"/>`);
  o.push(grain(0, -60, W, 700, GR(150, 60, 700, [[0, 0.3], [0.5, 0.18], [1, 0]]), P.sun));
  // far trunks dissolve into the haze
  const far = [[60, 20], [128, 15], [214, 24], [296, 17], [372, 26], [452, 16], [528, 22], [600, 18], [668, 25], [742, 16]];
  const farTone = mix(P.peach, P.haze, 0.42);
  const farAt = [];
  o.push(far.map(([x, w]) => { const fx = x + rnd(-8, 8); farAt.push([fx, w]); return trunk(fx, w, 690 + rnd(-10, 14), farTone, mix(farTone, P.cream, 0.5), { rimW: 1.4 }); }).join(''));
  const slotFar = slot();
  o.push(`<rect x="0" y="380" width="${W}" height="380" fill="url(#${linGrad(0, 380, 0, 760, [[0, P.cream, 0], [0.75, P.cream, 0.5], [1, P.cream, 0.2]])})"/>`);

  // ----- the boardwalk's geometry. It is laid out on the ground and then projected, so it keeps one real width all
  // the way along, its planks turn with it, and it shrinks with distance the same way the trunks do. Distances are
  // in eye-heights: the viewer's eye is 1 above the ground, and the horizon sits just over the hiker's head. -----
  const EYE_Y = 742, FOCAL = 1000, MID_X = 400;
  const climb = Z => Z > 34 ? Math.pow((Z - 34) / 42, 1.6) : 0;                    // past the big trunks the floor rises gently
  const project = (X, Z, below = 0) => [MID_X + X * FOCAL / Z, EYE_Y + (1 - climb(Z) + below) * FOCAL / Z];
  const onGround = (x, y) => [(x - MID_X) / (y - EYE_Y), FOCAL / (y - EYE_Y)];      // a screen point on the level part -> ground
  const DECK_W = 0.62, DECK_H = 0.11, CURB = 0.07;
  // where the walk goes: up from the bottom edge, through an S-bend, under the hiker's feet, then away to the left
  // between the trunks and up the far slope
  const route = [onGround(560, 1016), onGround(440, 930), onGround(482, 868), onGround(424, 824), onGround(392, 798), onGround(368, 783), onGround(357, 774.3), [-2.2, 46], [-4.33, 76], [-8.3, 126], [-12.7, 182], [-16.3, 245], [-20, 300], [-26, 380]];
  const sideways = spline(route.map(([X, Z]) => [Math.log(Z), X]));
  const walk = [];                                                                   // cross-sections, nearest first
  {
    const q0 = Math.log(route[0][1]), q1 = Math.log(route[route.length - 1][1]), n = 260;
    let along = 0, pX = null, pZ = null;
    for (let i = 0; i <= n; i++) {
      const q = q0 + (q1 - q0) * i / n, Z = Math.exp(q), X = sideways(q);
      const turn = (sideways(q + 0.002) - sideways(q - 0.002)) / 0.004 / Z, k = 1 / Math.hypot(1, turn), nx = k, nz = -turn * k;   // unit vector across the walk
      if (pX !== null) along += Math.hypot(X - pX, Z - pZ);
      pX = X; pZ = Z;
      const at = (off, below, dX = 0, dZ = 0) => project(X + nx * off + dX, Z + nz * off + dZ, below);
      walk.push({ Z, along, L: at(-DECK_W / 2, 0), R: at(DECK_W / 2, 0), l: at(-DECK_W / 2 + CURB, 0), r: at(DECK_W / 2 - CURB, 0),
        gl: at(-DECK_W / 2, DECK_H), gr: at(DECK_W / 2, DECK_H), sl: at(-DECK_W / 2, DECK_H, 0.13, -0.1), sr: at(DECK_W / 2, DECK_H, 0.13, -0.1) });
    }
  }
  const band = (part, a, b) => poly([...part.map(p => p[a]), ...part.map(p => p[b]).reverse()]);
  const deckTone = mix(P.peach, P.haze, 0.34);
  // far floor: a hazier stretch of forest floor behind the big trunks, with the far trunks standing along its crest.
  // The boardwalk carries on across it, climbing away and thinning until that crest takes it.
  {
    const g0 = curveFn([[0, 684], [140, 678], [300, 686], [430, 679], [560, 686], [700, 678], [800, 684]]);
    const fp = [[0, 800]]; for (let x = 0; x <= W; x += 10) fp.push([x, g0(x)]); fp.push([W, 800]);
    const floorD = poly(fp), floorFar = mix(farTone, P.teal, 0.3), floorNear = mix(mix(P.teal, P.haze, 0.25), farTone, 0.35), farPart = walk.filter(p => p.Z >= 26);
    o.push(`<path d="${floorD}" fill="url(#${linGrad(0, 680, 0, 782, [[0, floorFar], [1, floorNear]])})"/>`);
    o.push(`<g clip-path="url(#${clip(floorD)})"><path d="${band(farPart, 'L', 'gl')} ${band(farPart, 'R', 'gr')}" fill="${mix(P.plum, floorFar, 0.45)}"/><path d="${band(farPart, 'L', 'R')}" fill="url(#${linGrad(0, 680, 0, 782, [[0, mix(deckTone, floorFar, 0.5)], [1, deckTone]])})"/></g>`);
  }
  // light shafts
  const shaft = (x0, w0, x1, w1, a) => `<path d="M${x0},-60 L${x0 + w0},-60 L${x1 + w1},800 L${x1},800Z" fill="${P.sun}" opacity="${a}"/>`;
  o.push(shaft(120, 70, 430, 150, 0.16) + shaft(300, 40, 560, 90, 0.12) + shaft(-20, 60, 240, 120, 0.13));

  // mid trunks
  const midTone = mix(P.haze, P.plum, 0.38), midSh = mix(P.plum, P.plumDeep, 0.5);
  const mids = [[178, 46, 770], [455, 88, 800], [590, 54, 782], [300, 38, 768]];
  o.push(mids.map(([x, w, by]) => trunk(x, w, by, midTone, mix(midTone, P.peach, 0.6), { bark: 7, shade: midSh, rimW: 2.4 })).join(''));
  const slotMidMoss = slot();
  const slotMid = slot();
  o.push(shaft(200, 50, 470, 120, 0.1));
  // far ground, a little hazier toward its crest
  const g1 = curveFn([[0, 772], [160, 756], [330, 770], [480, 790], [640, 768], [800, 780]]);
  const gp = [[0, H + 90]]; for (let x = 0; x <= W; x += 10) gp.push([x, g1(x)]); gp.push([W, H + 90]);
  const groundD = poly(gp), gc = clip(groundD);
  o.push(`<path d="${groundD}" fill="${mix(P.teal, P.haze, 0.25)}"/><rect x="0" y="750" width="${W}" height="110" fill="url(#${linGrad(0, 758, 0, 850, [[0, P.cream, 0.24], [1, P.cream, 0]])})" clip-path="url(#${gc})"/>`);
  // trunk shadows lying across the ground toward us. The ground's crest hides the last few pixels of each trunk, so
  // a trunk meets the ground along that crest, and there it is wider than its stem because it flares at the root.
  // Each shadow therefore starts on the crest, right across the foot of its trunk, draws in to the width of the stem
  // a little way out, and from there runs on down the picture, widening as it nears us. It is begun a few pixels
  // above the crest and trimmed by the ground's own outline, so no gap can open between a trunk and its shadow.
  const SHADOW_END = H + 90, ROOT = 0.15;                                 // ROOT: how far along the shadow the flare of the root reaches
  const casts = mids.map(([x, w, by]) => {
    const h0 = trunkHalf(w, by, g1(x)), hl = trunkHalf(w, by, g1(x - h0)) + 1, hr = trunkHalf(w, by, g1(x + h0)) + 3.4;       // half-widths at the crest; the trunk's dark copy sits 2.4 to the right of its rim
    const left = k => [lerp(x - w / 2, x + 60, k), lerp(by, SHADOW_END, k)], right = k => [lerp(x + w / 2, x + w * 1.6 + 150, k), lerp(by, SHADOW_END, k)];
    return { x, w, by, hl, hr, left, right };
  });
  const trunkShadows = casts.map(({ x, by, hl, hr, left, right }) => {
    const top = []; for (let i = 0, n = Math.ceil((hl + hr) / 9); i <= n; i++) { const xx = lerp(x - hl, x + hr, i / n); top.push(`${f(xx)},${f(g1(xx) - 4)}`); }
    const r0 = right(0), r1 = right(ROOT), l0 = left(0), l1 = left(ROOT);
    return `M${top.join(' L')} Q${f(r0[0])},${f(r0[1])} ${f(r1[0])},${f(r1[1])} L${f(right(1)[0])},${SHADOW_END} L${f(left(1)[0])},${SHADOW_END} L${f(l1[0])},${f(l1[1])} Q${f(l0[0])},${f(l0[1])} ${top[0]}Z`;
  }).join(' ');
  // a fallen log on the left, lying with its cut end toward us. Its shadow goes in with the trunk shadows, as one shape.
  const at3 = (X, Z, h) => project(X, Z, DECK_H - h);                    // ground position and height above the ground -> the picture
  const mossTone = mix(P.tealLight, P.window, 0.16), mossDark = mix(P.tealDeep, P.plumDeep, 0.35);
  const log = fallenLog(at3, 1 + DECK_H, [-6.5, 13.5], [-1.47, 10.67], 0.17, { barkDark: midSh, bark: mix(P.plum, P.haze, 0.22), barkLit: mix(P.haze, P.peach, 0.35), barkEdge: mix(P.plum, P.haze, 0.3), furrow: P.plumDeep,
    moss: mossTone, mossDark, mossHi: mix(P.tealLight, P.window, 0.4), wood: mix(P.peach, P.haze, 0.3), woodLit: mix(P.cream, P.peach, 0.5), ring: mix(P.plum, P.haze, 0.3), shade: mix(P.plum, P.tealDeep, 0.5) }, trunkShadows);
  const shadowD = trunkShadows + ' ' + log.shadow;
  o.push(`<path d="${shadowD}" fill="${P.tealDeep}" opacity="0.4" clip-path="url(#${gc})"/>`);
  const slotFloor = slot();          // the floor's own variety: needle litter, sun between the shadows, a stipple
  // the boardwalk on this side of the crest: its shadow on the ground, the side of the raised deck, the deck, the
  // planks, the trunk shadows carrying on across it, and a curb down each edge. The ground's own outline trims it,
  // so the crest cuts across it the way it cuts across everything else.
  {
    const near = walk.filter(p => p.Z <= 36), did = shared(band(near, 'L', 'R')), dc = clipTo(did);
    let s = `<path d="${band(near, 'gl', 'gr')} ${band(near, 'sl', 'sr')}" fill="${P.tealDeep}" opacity="0.5"/>`;
    s += `<path d="${band(near, 'L', 'gl')} ${band(near, 'R', 'gr')}" fill="${midSh}"/><use href="#${did}" fill="${deckTone}"/>`;
    // one line per plank, drawn across between the curbs; they close up with distance and are dropped once they
    // would merge. A few boards are a shade lighter or darker than their neighbours.
    const PLANK = 0.27; let lines = '', tints = '', next = near[0].along + PLANK * 0.5, prev = null, count = 0;
    for (let i = 1; i < near.length; i++) {
      while (near[i].along >= next) {
        const a = near[i - 1], b = near[i], t = (next - a.along) / (b.along - a.along), Z = lerp(a.Z, b.Z, t);
        const p0 = [lerp(a.l[0], b.l[0], t), lerp(a.l[1], b.l[1], t)], p1 = [lerp(a.r[0], b.r[0], t), lerp(a.r[1], b.r[1], t)];
        const gap = PLANK * FOCAL / (Z * Z), show = Math.max(0, Math.min(1, (gap - 1.5) / 3));     // spacing on screen here
        if (show > 0) {
          lines += `<path d="M${f(p0[0])},${f(p0[1])} L${f(p1[0])},${f(p1[1])}" stroke-width="${f(Math.max(0.6, Math.min(2, gap * 0.14)))}" opacity="${f(show * 0.8)}"/>`;
          const h = hash(count);
          if (prev && gap > 4 && h < 0.42) tints += `<path d="${poly([prev[0], prev[1], p1, p0])}" fill="${h < 0.2 ? P.cream : P.plum}" opacity="${h < 0.2 ? 0.16 : 0.07}"/>`;
        }
        prev = [p0, p1]; count++; next += PLANK;
      }
    }
    s += `<g clip-path="url(#${dc})">${tints}<g stroke="${mix(P.haze, P.plum, 0.5)}" fill="none">${lines}</g><path d="${shadowD}" fill="${mix(P.plum, P.tealDeep, 0.5)}" opacity="0.3"/>${until(3, `<path d="${poly([[-9, 0], [-10.4, 41], [-18.5, 46], [-17.5, 68], [-12, 75], [-11, 81], [-9.4, 84], [-9.4, 91], [-5, 96.4], [0, 99], [5, 96.4], [9.4, 91], [9.4, 84], [11, 81], [12, 75], [17.5, 68], [21, 46], [10.4, 41], [9.6, 0]].map(([x, h]) => [424 + 0.88 * (x + h * 0.28), 822 + 0.88 * h * 0.64]))}" fill="${P.plumDeep}" opacity="0.26"/>`)}</g>`;
    s += `<path d="${band(near, 'L', 'l')} ${band(near, 'R', 'r')}" fill="${mix(deckTone, P.plum, 0.36)}"/>`;
    s += grain(300, 760, 420, 280, GL(0, 790, 0, 1000, [[0, 0.1], [0.5, 0.06], [1, 0.2]]), mix(P.haze, P.plum, 0.4), { clipId: dc });
    o.push(`<g clip-path="url(#${gc})">${s}</g>`);
  }
  const slotMidFerns = slot();
  for (let i = 0; i < 64; i++) rnd();      // step the shared sequence on, so the bark and dust drawn below keep their places
  // the hiker, for scale: seen from behind, walking away. Gone at stage 4, with the pack and the pole left on the boards.
  o.push(until(3, `<g transform="translate(424,822) scale(0.88)">${hikerBack(P)}</g>`));
  o.push(from(4, `<ellipse cx="431" cy="828.8" rx="24" ry="4.4" fill="${P.plumDeep}" opacity="0.32"/><g transform="translate(408,818.4) rotate(80) scale(0.88)">${pack(P)}</g><path d="M452,836 L486,859" stroke="${P.cream}" stroke-width="1.5" stroke-linecap="round"/>`));
  // near trunks frame the view
  const slotNear = slot();
  const nearTone = mix(P.plum, P.plumDeep, 0.35), nearSh = mix(P.plumDeep, '#000000', 0.3);
  o.push(trunk(28, 214, 968, nearTone, P.rim, { bark: 16, shade: nearSh, rimW: 4 }));
  o.push(trunk(742, 250, 990, nearTone, P.rim, { bark: 18, shade: nearSh, rimW: 4 }));
  const slotNearMoss = slot();
  { let m = ''; for (let k = 0; k < 70; k++) { const t = rnd(), x = lerp(150, 520, t) + rnd(-60, 60), y = lerp(20, 760, t) + rnd(-30, 30); m += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rnd(0.8, 2.2))}" opacity="${f(rnd(0.3, 0.8))}"/>`; } o.push(`<g fill="${P.sun}">${m}</g>`); }
  // stage 3: every trunk carries a fresh wound at the same height
  const slotScars = slot();
  // stage 5: something coral, very high up, on a stub of the tall trunk behind where the hiker stood
  o.push(from(5, `<g transform="translate(497,96)"><path d="M-2,0 L22,-5" stroke="${midSh}" stroke-width="5" stroke-linecap="round"/><path d="M6,-4 C2,6 3,22 7,34 L12,32 L12,14 L16,36 L22,34 C24,20 22,6 18,-5Z" fill="${P.coral}"/><path d="M14,-5 C18,6 20,20 22,34 L18,35 L15,12Z" fill="${P.coralSh}"/></g>`));
  // boughs across the top of the frame
  const slotTop = slot();
  // near ground
  const g2 = curveFn([[0, 900], [140, 884], [300, 930], [420, 968], [560, 962], [680, 920], [800, 904]]);
  const gq = [[0, H + 90]]; for (let x = 0; x <= W; x += 10) gq.push([x, g2(x)]); gq.push([W, H + 90]);
  const near = poly(gq);
  o.push(`<path d="${near}" fill="${P.tealLight}"/><path d="${near}" fill="${P.ink}" transform="translate(0,4)"/>`);
  o.push(grain(0, 880, W, 200, GL(0, 884, 0, 1000, [[0, 0.4], [1, 0]]), P.teal, { clipId: clip(near) }));
  const slotNearFerns = slot();
  o.push(`<rect x="0" y="-60" width="${W}" height="${H + 150}" fill="url(#${radGrad(W / 2, H * 0.45, 780, [[0.55, '#2A1B33', 0], [1, '#2A1B33', 0.4]])})"/>`);

  // ===== everything below is generated last, each kind from its own seed, so changing one never moves another =====

  // ----- boughs -----
  L.reseed(57);
  // one bough = a deeper rank of sprays showing beneath in a quieter tone, a thin lit edge, then the body
  const soft = 'stroke-width="1.6" stroke-linejoin="round"';
  const spray = (x, y, len, dir, opt, tone, rim, behind) => {
    const b = bough(x + dir * len * 0.05, y + len * 0.02, len * 0.9, dir, { ...opt, hang: (opt.hang || 0.22) * 1.3, bare: 0.16 }), id = shared(bough(x, y, len, dir, opt));
    return `<path d="${b}" fill="${behind}" stroke="${behind}" ${soft}/><use href="#${id}" fill="${rim}" stroke="${rim}" ${soft}/><use href="#${id}" fill="${tone}" stroke="${tone}" ${soft} transform="translate(0.8,1.8)"/>`;
  };
  {
    // far trunks: small, pale, lost in the haze, all high up
    const tone = mix(farTone, P.teal, 0.16);
    let fb = '';
    farAt.forEach(([x, w], i) => { for (let k = 0; k < 2; k++) { const dir = (i + k) % 2 ? 1 : -1; fb += `<path d="${bough(x + dir * w * 0.3, rnd(8, 60) + k * 70, rnd(40, 70), dir, { sag: 0.34, hang: 0.3 })}"/>`; } });
    o[slotFar] = `<g fill="${tone}" stroke="${tone}" ${soft}>${fb}</g>`;
  }
  {
    // mid trunks: each limb starts at the edge of its trunk, on the side it reaches toward
    const tone = mix(mix(P.tealDeep, P.teal, 0.55), P.haze, 0.2), rim = mix(tone, P.peach, 0.3), behind = mix(tone, P.tealDeep, 0.45);
    o[slotMid] = [[198, 40, 124, 1], [160, 104, 76, -1], [285, 20, 90, -1], [317, 84, 100, 1], [419, 84, 120, -1], [419, 164, 88, -1], [494, 24, 116, 1], [494, 176, 84, 1], [568, 70, 54, -1], [614, 46, 70, 1]]
      .map(([x, y, len, dir]) => spray(x, y, len, dir, { sag: 0.36, hang: 0.3 }, tone, rim, behind)).join('');
  }
  const frontRim = mix(P.ink, P.teal, 0.55), frontBehind = mix(P.ink, P.tealDeep, 0.6);
  // the two framing trunks: these sit behind their trunks, so the trunk hides where each limb starts
  o[slotNear] = [[100, 44, 262, 1], [100, 172, 128, 1], [660, -10, 250, -1], [660, 140, 150, -1]]
    .map(([x, y, len, dir]) => spray(x, y, len, dir, { sag: 0.3, hang: 0.22 }, P.ink, frontRim, frontBehind)).join('');
  {
    // nearest of all: limbs above the frame, with only their sprays hanging into view. Two ranks, overlapped so
    // that no sky shows along the top edge.
    const backTone = mix(P.tealDeep, P.teal, 0.4), backRim = mix(backTone, P.tealLight, 0.45), backBehind = mix(backTone, P.haze, 0.3);
    const back = [[-30, 2, 300, 1, 0.12, 0.26], [250, -6, 250, 1, 0.14, 0.24], [830, 4, 330, -1, 0.12, 0.25], [520, -12, 240, -1, 0.18, 0.24], [120, -14, 260, 1, 0.14, 0.26], [480, -16, 250, -1, 0.14, 0.26]];
    const front = [[-40, -20, 260, 1, 0.1, 0.2], [840, -22, 300, -1, 0.09, 0.2], [300, -24, 280, 1, 0.12, 0.16]];
    o[slotTop] = back.map(([x, y, len, dir, sag, hang]) => spray(x, y, len, dir, { sag, hang }, backTone, backRim, backBehind)).join('')
      + `<rect x="-20" y="-80" width="${W + 40}" height="84" fill="${P.ink}"/>`
      + front.map(([x, y, len, dir, sag, hang]) => spray(x, y, len, dir, { sag, hang }, P.ink, frontRim, frontBehind)).join('');
  }

  // ----- moss on the trunks -----
  L.reseed(67);
  {
    const tone = mix(P.tealLight, P.window, 0.16), dark = mix(P.tealDeep, P.plumDeep, 0.35), hi = mix(P.tealLight, P.window, 0.4), hz = c => mix(c, P.haze, 0.2);
    o[slotMidMoss] = mids.map(([x, w, by], i) => moss(x, w, by, xx => g1(xx) + 3, { top: 70 + w * 1.2, lean: i % 2 ? 1 : -1, tone: hz(tone), dark: hz(dark), hi: hz(hi), seed: 9100 + i })).join('');
    o[slotNearMoss] = moss(28, 214, 968, xx => g2(xx) + 6, { top: 215, lean: 1, size: 0.5, tone, dark, hi, seed: 9110 })
      + moss(742, 250, 990, xx => g2(xx) + 6, { top: 225, lean: -1, size: 0.46, tone, dark, hi, seed: 9111 });
  }

  // ----- ferns: x, y, size, lean -----
  const G = [[log.key, log.svg]], put = (y, svg) => G.push([y, svg]);            // everything standing on the forest floor, to be drawn from the back to the front
  L.reseed(71);
  {
    const lit = P.tealLight, dim = mix(P.tealLight, P.teal, 0.6);
    const clump = (list, shade) => list.map(([x, y, s, lean], i) => [y, fern(x, y, s, i % 2 ? dim : lit, shade, { lean, spread: rnd(0.95, 1.35), wide: rnd(0.17, 0.25), droop: rnd(0.8, 1.15) })]);
    G.push(...clump([[250, 792, 30, 0.1], [226, 800, 20, -0.25], [562, 803, 28, -0.1], [590, 797, 19, 0.3], [118, 790, 24, 0.2], [690, 797, 26, -0.15], [660, 806, 17, 0.2], [314, 820, 22, 0]], P.teal));
    o[slotNearFerns] = clump([[92, 902, 62, 0], [56, 916, 40, -0.3], [196, 916, 46, 0.15], [30, 936, 50, 0.1], [150, 930, 30, -0.1], [640, 936, 56, 0], [730, 922, 44, 0.2], [692, 944, 34, -0.2], [772, 934, 38, 0.1], [300, 944, 28, 0]], P.teal).map(e => e[1]).join('');
  }

  // ----- the forest floor between the trunks: what grows and lies on it. Sizes follow distance: a thing on the ground
  // at height y in the picture is drawn at unit(y) pixels per eye-height. Anything standing in a trunk's shadow is darker. -----
  L.reseed(83);
  {
    const unit = y => (y - EYE_Y) / (1 + DECK_H), END = H + 90, floorTone = mix(P.teal, P.haze, 0.25);
    // the same shapes as the shadows drawn above: the foot of each trunk on the crest, then the long run toward us
    const inShade = (x, y) => casts.some(c => { if (y < c.by) return y > g1(x) - 4 && x > c.x - c.hl && x < c.x + c.hr; const k = (y - c.by) / (END - c.by); return x > c.left(k)[0] && x < c.right(k)[0]; });
    const dim = (c, x, y) => inShade(x, y) ? mix(c, P.tealDeep, 0.42) : c;
    // the stretch of boardwalk level with a point on the ground, and whether that point is under or beside it
    const beside = y => { const Z = (1 + DECK_H) * FOCAL / (y - EYE_Y); let best = walk[0]; for (const p of walk) if (Math.abs(p.Z - Z) < Math.abs(best.Z - Z)) best = p; return best; };
    const onWalk = (x, y, m) => { const p = beside(y); return x > p.L[0] - m && x < p.R[0] + m; };
    const leftEdge = y => 28 + trunkHalf(214, 968, Math.min(y, 968)), rightEdge = y => 742 - trunkHalf(250, 990, Math.min(y, 990));
    const free = (x, y, m = 10) => y > g1(x) + 7 && y < g2(x) + 2 && x > leftEdge(y) + 4 && x < rightEdge(y) - 4 && !onWalk(x, y, m + unit(y) * 0.14)
      && !(x > log.box[0] - 8 && x < log.box[2] + 12 && y > log.box[1] - 2 && y < log.box[3] + 8);
    const spot = (bias = 0.9) => { for (let i = 0; i < 50; i++) { const y = lerp(772, 962, Math.pow(rnd(), bias)), x = rnd(128, 630); if (free(x, y)) return [x, y, unit(y)]; } return null; };
    // tone: darker drifts of needle litter, sun lying where no trunk shadows it, and a stipple over all of it
    let litter = '', sun = '';
    for (let i = 0; i < 8; i++) { const p = spot(); if (p) litter += `<ellipse cx="${f(p[0])}" cy="${f(p[1])}" rx="${f(p[2] * rnd(0.45, 1))}" ry="${f(p[2] * rnd(0.05, 0.1))}"/>`; }
    for (let i = 0; i < 16; i++) { const p = spot(); if (p && !inShade(p[0], p[1])) { const w = p[2] * rnd(0.3, 0.7); if (!inShade(p[0] - w, p[1]) && !inShade(p[0] + w, p[1])) sun += `<ellipse cx="${f(p[0])}" cy="${f(p[1])}" rx="${f(w)}" ry="${f(w * 0.17)}"/>`; } }
    o[slotFloor] = `<g clip-path="url(#${gc})"><g fill="${mix(floorTone, P.plum, 0.45)}" fill-opacity="0.5">${litter}</g><g fill="${P.sun}" fill-opacity="0.13">${sun}</g>${grain(120, 752, 520, 240, GL(0, 760, 0, 990, [[0, 0.05], [1, 0.3]]), P.tealDeep, { seed: 9400 })}</g>`;
    // cushions of moss, kept clear of the log so none sits across its cut end
    for (let i = 0; i < 9; i++) { const p = spot(); if (!p) continue; const w = p[2] * rnd(0.18, 0.34), byLog = p[0] > log.box[0] - 30 && p[0] < log.box[2] + 44 && p[1] > log.box[1] && p[1] < log.box[3] + 34;
      if (!byLog && free(p[0] - w / 2, p[1]) && free(p[0] + w / 2, p[1])) { const t = dim(mix(P.tealLight, P.window, 0.14), p[0], p[1]); put(p[1], cushion(p[0], p[1], w, w * rnd(0.2, 0.3), t, mix(t, P.cream, 0.28), P.tealDeep)); } }
    // grass, broad-leaved weeds, clover
    const gD = [mix(P.teal, P.tealDeep, 0.3), P.teal, mix(P.teal, P.tealLight, 0.5)], gL = [mix(P.tealLight, P.cream, 0.25), mix(P.tealLight, P.window, 0.3)], straw = mix(P.tealLight, P.cream, 0.6);
    for (let i = 0; i < 54; i++) { const p = spot(); if (p) put(p[1], tuft(p[0], p[1], p[2] * rnd(0.08, 0.16), dim(pick(gD), p[0], p[1]), dim(pick(gL), p[0], p[1]), i % 3 ? null : straw)); }
    for (let i = 0; i < 9; i++) { const p = spot(); if (p) put(p[1], rosette(p[0], p[1], p[2] * rnd(0.07, 0.11), dim(mix(P.tealLight, P.cream, 0.2), p[0], p[1]), P.teal)); }
    const C = { stem: P.teal, cream: '#FFF8EA', gold: '#F2B441', goldSh: '#C98E2B', coral: P.coral, coralSh: P.coralSh, ink: P.plumDeep, violet: '#9C7DB8', lilac: '#D3B4D6', leaf: mix(P.tealLight, P.cream, 0.25), leafDark: P.teal, clover: '#F6DDE0' };
    for (let i = 0; i < 7; i++) { const p = spot(); if (p) put(p[1], clover(p[0], p[1], p[2] * 0.07, C)); }
    // a few drifts of small flowers, small ferns, stones with their shadows, fallen twigs, toadstools by the end of the log
    for (const kind of ['daisy', 'daisy', 'buttercup', 'umbel', 'daisy']) {
      const c = spot(0.8); if (!c) continue;
      for (let j = 0, n = 2 + Math.floor(rnd(0, 4)); j < n; j++) { const x = c[0] + rnd(-0.25, 0.25) * c[2], y = c[1] + rnd(-0.05, 0.05) * c[2]; if (free(x, y)) put(y, flower(kind, x, y, unit(y) * (kind === 'umbel' ? rnd(0.15, 0.2) : rnd(0.08, 0.12)), C)); }
    }
    for (let i = 0; i < 9; i++) { const p = spot(); if (p) put(p[1], fernlet(p[0], p[1], p[2] * rnd(0.16, 0.24), dim(P.tealLight, p[0], p[1]), dim(P.teal, p[0], p[1]))); }
    for (let i = 0; i < 4; i++) { const p = spot(); if (p) { const w = p[2] * rnd(0.16, 0.3); put(p[1], `<ellipse cx="${f(p[0] + w * 0.4)}" cy="${f(p[1] + 1)}" rx="${f(w * 0.75)}" ry="${f(w * 0.13)}" fill="${P.tealDeep}" opacity="0.45"/>` + L.rock(p[0], p[1], w, w * 0.52, dim(mix(P.haze, P.teal, 0.5), p[0], p[1]), dim(mix(P.haze, P.cream, 0.22), p[0], p[1]))); } }
    for (let i = 0; i < 6; i++) { const p = spot(); if (p) { const l = p[2] * rnd(0.25, 0.5), ang = rnd(-0.5, 0.5), dx = Math.cos(ang) * l, dy = Math.sin(ang) * l * 0.3, k = rnd(0.4, 0.7); put(p[1], `<path d="M${f(p[0])},${f(p[1])} l${f(dx)},${f(dy)} M${f(p[0] + dx * k)},${f(p[1] + dy * k)} l${f(l * 0.2)},${f(-l * 0.09)}" stroke="${mix(P.plum, P.haze, 0.25)}" stroke-width="${f(Math.max(0.9, p[2] * 0.016))}" stroke-linecap="round" fill="none"/>`); } }
    put(log.key + 6, toadstools(log.box[2] + 16, log.box[3] + 4, 11, C));
    { const p = spot(); if (p) put(p[1], toadstools(p[0], p[1], p[2] * 0.1, C)); }
    // grass standing along the top of the dark ground nearest to us
    o[slotNearFerns] = L.grass(0, W, x => g2(x) - 3, { dark: P.ink, light: mix(P.tealLight, P.teal, 0.3), h: [8, 28], step: [12, 36] }) + o[slotNearFerns];
  }
  G.sort((a, b) => a[0] - b[0]);
  o[slotMidFerns] = G.map(g => g[1]).join('');

  // ----- stage 3: the wounds. Far, middle and near trunks are marked at the same height above the ground -----
  L.reseed(79);
  o[slotScars] = from(3,
    farAt.slice(2, 9).map(([x, w]) => scar(x, w, 392, { bark: farTone, lipTone: mix(farTone, P.cream, 0.4), haze: [farTone, 0.35] })).join('')
    + mids.map(([x, w]) => scar(x, w, 352, { bark: midTone, lipTone: mix(midTone, P.rim, 0.62) })).join('')
    + scar(58, 214, 286, { size: 0.5, bark: nearTone, lipTone: mix(nearTone, P.rim, 0.58) })
    + scar(716, 250, 280, { size: 0.46, bark: nearTone, lipTone: mix(nearTone, P.rim, 0.58) }));

  return { svg: `<defs>${L.defs.join('\n')}</defs>${o.join('\n')}`, vb: [0, 0, W, H] };
}
