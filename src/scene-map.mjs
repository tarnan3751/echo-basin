// The park map. Everything on it comes from one terrain model: a grid of heights built from ridge lines and valley
// lines. The contours, the lake shore, the streams, the forest edge, the snow line and the relief shading are all
// read off that grid, so they agree with one another. The closures and the plotted path that appear at later stages
// are drawn from the same grid and in the same line work, as revisions to the sheet.
import * as L from './lib.mjs';
const { f, lerp, mix, grain, GR, from, between, clip } = L;

const W = 1000, H = 700, CELL = 4, PAD = 40;
const GX = Math.round((W + 2 * PAD) / CELL) + 1, GY = Math.round((H + 2 * PAD) / CELL) + 1;
const gx = i => -PAD + i * CELL, gy = j => -PAD + j * CELL;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const U_PER_MILE = 60;                                       // map units to the mile

// ---------- small tools ----------
// repeatable noise that never touches the shared random sequence
const hash2 = (i, j, s) => { let h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ Math.imul(s, 1442695041); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const vnoise = (x, y, s) => { const i = Math.floor(x), j = Math.floor(y), u = x - i, v = y - j, a = u * u * (3 - 2 * u), b = v * v * (3 - 2 * v); return lerp(lerp(hash2(i, j, s), hash2(i + 1, j, s), a), lerp(hash2(i, j + 1, s), hash2(i + 1, j + 1, s), a), b) * 2 - 1; };
const fbm = (x, y, s, oct = 3) => { let v = 0, a = 1, n = 0; for (let o = 0; o < oct; o++) { v += a * vnoise(x, y, s + o * 17); n += a; x *= 2.03; y *= 2.03; a *= 0.5; } return v / n; };
// a smooth line through control points (Catmull-Rom on every component), resampled about every `step` units
function smoothLine(pts, step = 6){
  const out = [], n = pts.length, dim = pts[0].length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
    const m = Math.max(1, Math.round(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
    for (let k = 0; k < m; k++) { const t = k / m, t2 = t * t, t3 = t2 * t, q = []; for (let c = 0; c < dim; c++) q.push(0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3)); out.push(q); }
  }
  out.push(pts[n - 1].slice());
  return out;
}
// nearest point on a line: distance, where along it, and which side
function nearest(px, py, pts){
  let bd = 1e18, bi = 0, bt = 0, bc = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const ax = pts[i][0], ay = pts[i][1], vx = pts[i + 1][0] - ax, vy = pts[i + 1][1] - ay, t = clamp(((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy || 1), 0, 1), dx = px - ax - vx * t, dy = py - ay - vy * t, d = dx * dx + dy * dy;
    if (d < bd) { bd = d; bi = i; bt = t; bc = vx * (py - ay) - vy * (px - ax); }
  }
  return { d: Math.sqrt(bd), i: bi, t: bt, side: bc };
}
const attr = (pts, n, k) => lerp(pts[n.i][k], pts[n.i + 1][k], n.t);
const softmin = (a, b, k) => { const m = Math.min(a, b); return m - k * Math.log(Math.exp(-(a - m) / k) + Math.exp(-(b - m) / k)); };
const softmax = (a, b, k) => -softmin(-a, -b, k);

// ---------- the land ----------
// Heights are in feet. Ridge lines carry the height of their crest; the ground falls away from them. Valley lines
// carry the height of their floor and its half-width; the ground rises away from them. The land is whichever of the
// two is lower at each place, and the lake is the part of the main valley that lies below 3,540 ft.
const LAKE_FT = 3540;
const PATH_A = [812, 96], PATH_DIR = [-0.669, 0.743];                     // the pass, and the bearing the path holds (222 degrees)
export const onPath = t => [PATH_A[0] + PATH_DIR[0] * t, PATH_A[1] + PATH_DIR[1] * t];   // t in map units from the pass
const PLACE = { pass: 0, hut: 60, meadows: 138, point: 208, lodge: 238, shoreN: 246, shoreS: 336, flats: 345 };    // named places, all on that line; the two shores are where it meets the lake

const ridges = [
  // the main divide: along the north edge, over Corrie Peak, down to Echo Pass, up to Mt. Tolliver and away south-east
  [[-60, 156, 6600], [90, 122, 7000], [210, 94, 7350], [330, 72, 7700], [450, 58, 8050], [560, 46, 8400], [650, 50, 8900], [705, 58, 9330], [762, 78, 8950], [812, 96, 8650], [852, 118, 9250], [892, 150, 9810], [926, 206, 9150], [956, 282, 8500], [986, 372, 8100], [1060, 470, 7900]],
  // Corrie Peak's south spur, ending in the bluff of Echo Point above the lodge
  [[705, 58, 9330], [676, 116, 8300], [650, 172, 7300], [640, 214, 6400], [648, 240, 5300], [656, 256, 4500]],
  // Tolliver's south-west spur: the east wall of the Halloran valley and of the lake head
  [[892, 150, 9810], [852, 208, 8500], [816, 258, 7500], [796, 318, 6800], [806, 392, 6900], [866, 430, 7300]],
  // the south wall of the lake, with the gap the south road comes through, and Low Knob
  [[1060, 470, 7900], [940, 452, 7600], [866, 430, 7300], [770, 446, 7000], [690, 474, 6500], [636, 500, 5500], [612, 512, 5080], [584, 528, 5700], [520, 548, 6300], [430, 578, 6050], [330, 604, 5940], [210, 612, 5500], [90, 602, 5200], [-60, 590, 4900]],
  // spurs off the divide on the north side of the lake, with side valleys between them
  [[560, 46, 8400], [552, 130, 7500], [540, 206, 6600], [518, 276, 5400], [506, 322, 4300]],
  [[330, 72, 7700], [352, 150, 7000], [384, 226, 6300], [392, 300, 5400], [386, 362, 4300]],
  [[384, 226, 6300], [330, 270, 5700], [296, 330, 4900], [282, 392, 4000]],
  [[210, 94, 7350], [214, 190, 6500], [190, 280, 5600], [176, 370, 4600], [172, 424, 3900]],
  [[90, 122, 7000], [74, 230, 6100], [60, 340, 5000], [40, 430, 4000]],
  // a spur south from Low Knob and one in the south-east, so the southern slope is not one plain face
  [[330, 604, 5940], [318, 690, 5000], [300, 760, 4500]],
  [[866, 430, 7300], [880, 540, 6700], [900, 650, 6100], [910, 760, 5700]],
].map(r => smoothLine(r, 8));

// valleys: [x, y, floor height, floor half-width]
const lakeAxis = smoothLine([[88, 470, LAKE_FT, 0], [124, 465, LAKE_FT, 17], [250, 440, LAKE_FT, 27], [430, 385, LAKE_FT, 30], [612, 318, LAKE_FT, 25], [700, 284, LAKE_FT, 19], [736, 268, LAKE_FT, 0]], 5);
const creeks = {
  halloran: [[802, 110, 8350, 3], [772, 141, 7800, 5], [748, 168, 7050, 6], [731, 187, 6440, 14], [718, 204, 6300, 22], [712, 226, 6230, 12], [720, 246, 5000, 3], [730, 262, 3600, 3], [735, 268, 3545, 3]],
  cathedral: [[470, 96, 6500, 3], [458, 170, 5400, 4], [448, 240, 4600, 6], [440, 300, 4270, 13], [434, 348, 3820, 6], [431, 384, 3545, 4]],
  cedar: [[606, 492, 4980, 3], [600, 440, 4300, 4], [590, 388, 3760, 6], [581, 352, 3548, 9]],
  outlet: [[88, 470, 3536, 5], [44, 484, 3500, 5], [-60, 508, 3420, 5]],
  south: [[616, 524, 4950, 3], [640, 600, 4350, 4], [656, 680, 3950, 5], [664, 770, 3600, 5]],
  west1: [[300, 150, 6300, 3], [282, 230, 5300, 4], [250, 310, 4400, 5], [236, 380, 3800, 5], [232, 436, 3548, 4]],
  west2: [[140, 140, 6200, 3], [128, 250, 5100, 4], [112, 360, 4100, 5], [104, 452, 3548, 4]],
  west3: [[352, 300, 4900, 3], [340, 350, 4100, 4], [334, 402, 3548, 4]],
  knob: [[452, 540, 5400, 3], [440, 480, 4500, 4], [430, 430, 3548, 4]],
};
const creekLines = Object.fromEntries(Object.entries(creeks).map(([k, v]) => [k, smoothLine(v, 5)]));

// the lake's outline: its trough, made less regular, pushed out where creeks have built deltas and where the lodge
// stands on its point, with one small island
const deltas = [[581, 352, 13, 17], [431, 384, 9, 14], [232, 436, 8, 13], [735, 268, 8, 14], [334, 402, 6, 11]];
const field = new Float32Array(GX * GY), lakeIn = new Float32Array(GX * GY);
for (let j = 0; j < GY; j++) for (let i = 0; i < GX; i++) {
  const x = gx(i), y = gy(j);
  // mountains: the highest of (crest height minus the fall away from that crest)
  let m = 3000;
  for (const r of ridges) { const n = nearest(x, y, r); m = softmax(m, attr(r, n, 2) - 15 * Math.pow(n.d, 0.9) - 240 * (1 - Math.exp(-n.d / 13)), 90); }
  // the lake's trough, and the side valleys
  const nl = nearest(x, y, lakeAxis), wl = attr(lakeAxis, nl, 3);
  let li = wl - nl.d + wl * 0.2 * fbm(x / 46, y / 46, 41, 2) + 2.4 * fbm(x / 13, y / 13, 43, 2);
  for (const [dx, dy, amt, rad] of deltas) li -= amt * Math.exp(-((x - dx) ** 2 + (y - dy) ** 2) / (rad * rad));
  li -= 52 * Math.exp(-((x - 250) ** 2 + (y - 440) ** 2) / 44);                                    // the island
  lakeIn[j * GX + i] = li;                                                                          // positive in the water
  const off = Math.max(0, nl.d - wl);                                                            // a bench by the water, then the wall of the valley
  let v = LAKE_FT + 1.7 * Math.pow(off, 1.5) + 5 * Math.pow(Math.max(0, off - 28), 1.42);
  for (const k in creekLines) { const c = creekLines[k], n = nearest(x, y, c); v = softmin(v, attr(c, n, 2) + 10.5 * Math.pow(Math.max(0, n.d - attr(c, n, 3)), 1.3), 50); }
  let e = softmin(m, v, 70);
  // roughness, more of it higher up and none at the shore; gullies cut by a second, ridged noise
  const up = clamp((e - LAKE_FT) / 2500, 0, 1.4);
  e += up * (150 * fbm(x / 70, y / 70, 3) + 60 * fbm(x / 26, y / 26, 9, 2)) - up * 130 * Math.pow(1 - Math.abs(fbm(x / 48, y / 48, 21, 2)), 3);
  field[j * GX + i] = e;
}
// named heights the page states: nudge the ground to meet them where the model has come out a little off
const SPOT = [[812, 96, 8560, 20], [892, 150, 9650, 22], [705, 58, 9180, 22], [440, 300, 4270, 24], [330, 604, 5940, 20], [...onPath(PLACE.point), 4330, 13], [...onPath(PLACE.meadows), 6170, 26]];
const rawAt = (x, y) => field[Math.round((y + PAD) / CELL) * GX + Math.round((x + PAD) / CELL)];
const fix = SPOT.map(([x, y, ft, rad]) => [x, y, ft - rawAt(x, y), rad]);
for (let j = 0; j < GY; j++) for (let i = 0; i < GX; i++) {
  const x = gx(i), y = gy(j), k = j * GX + i; let e = field[k];
  for (const [fx, fy, df, rad] of fix) e += df * Math.exp(-((x - fx) ** 2 + (y - fy) ** 2) / (rad * rad));
  const li = lakeIn[k];
  field[k] = li > 0 ? LAKE_FT - 2 - 16 * Math.pow(li, 1.08) : Math.max(e, LAKE_FT + 5 + 3 * Math.pow(-li, 1.1));     // water below the lake's level, land above it
}
// a smoothed copy of the ground, for finding which way water runs
const calm = (() => { let S = new Float32Array(field); for (let pass = 0; pass < 3; pass++) { const T = new Float32Array(S); for (let j = 1; j < GY - 1; j++) for (let i = 1; i < GX - 1; i++) { let a = 0; for (let v = -1; v <= 1; v++) for (let u = -1; u <= 1; u++) a += S[(j + v) * GX + i + u]; T[j * GX + i] = a / 9; } S = T; } return S; })();
const sample = (G, x, y) => { const u = clamp((x + PAD) / CELL, 0, GX - 1.001), v = clamp((y + PAD) / CELL, 0, GY - 1.001), i = Math.floor(u), j = Math.floor(v), a = u - i, b = v - j; return lerp(lerp(G[j * GX + i], G[j * GX + i + 1], a), lerp(G[(j + 1) * GX + i], G[(j + 1) * GX + i + 1], a), b); };
// a creek: start at a spring and keep stepping the steepest way down until it meets the lake or leaves the sheet
function creekFrom(x, y){
  const pts = [[x, y]];
  for (let k = 0; k < 900; k++) {
    const gxv = sample(calm, x + 1.5, y) - sample(calm, x - 1.5, y), gyv = sample(calm, x, y + 1.5) - sample(calm, x, y - 1.5), g = Math.hypot(gxv, gyv);
    if (g < 0.4) return null;                                             // a hollow with no way out: not a creek
    x -= gxv / g * 2; y -= gyv / g * 2; pts.push([x, y]);
    if (sample(lakeIn, x, y) > 1.5) return pts;
    if (x < 22 || x > 978 || y < 22 || y > 678) return pts;
  }
  return null;
}
export const heightAt = (x, y) => { const u = clamp((x + PAD) / CELL, 0, GX - 1.001), v = clamp((y + PAD) / CELL, 0, GY - 1.001), i = Math.floor(u), j = Math.floor(v), a = u - i, b = v - j; return lerp(lerp(field[j * GX + i], field[j * GX + i + 1], a), lerp(field[(j + 1) * GX + i], field[(j + 1) * GX + i + 1], a), b); };

// ---------- reading lines off the grid ----------
// Every line where a grid of values crosses `level`, as closed loops. The edge of the grid counts as below the level,
// so nothing is left open; the map's frame hides that edge.
function isoLoops(F, level){
  const val = (i, j) => (i <= 0 || j <= 0 || i >= GX - 1 || j >= GY - 1) ? level - 1e7 : F[j * GX + i];
  const segs = [], at = new Map();
  const cross = (i0, j0, i1, j1) => { const a = val(i0, j0), b = val(i1, j1), t = clamp((level - a) / (b - a), 0.001, 0.999); return [lerp(gx(i0), gx(i1), t), lerp(gy(j0), gy(j1), t)]; };
  const add = (k1, p1, k2, p2) => { const id = segs.length; segs.push([k1, p1, k2, p2, false]); for (const k of [k1, k2]) { if (!at.has(k)) at.set(k, []); at.get(k).push(id); } };
  for (let j = 0; j < GY - 1; j++) for (let i = 0; i < GX - 1; i++) {
    const a = val(i, j) > level, b = val(i + 1, j) > level, c = val(i + 1, j + 1) > level, d = val(i, j + 1) > level, code = (a ? 1 : 0) | (b ? 2 : 0) | (c ? 4 : 0) | (d ? 8 : 0);
    if (code === 0 || code === 15) continue;
    const T = ['h' + i + '_' + j, () => cross(i, j, i + 1, j)], R = ['v' + (i + 1) + '_' + j, () => cross(i + 1, j, i + 1, j + 1)], B = ['h' + i + '_' + (j + 1), () => cross(i, j + 1, i + 1, j + 1)], Lf = ['v' + i + '_' + j, () => cross(i, j, i, j + 1)];
    const link = (e1, e2) => add(e1[0], e1[1](), e2[0], e2[1]());
    const mid = (val(i, j) + val(i + 1, j) + val(i + 1, j + 1) + val(i, j + 1)) / 4 > level;
    switch (code) {
      case 1: case 14: link(Lf, T); break;
      case 2: case 13: link(T, R); break;
      case 3: case 12: link(Lf, R); break;
      case 4: case 11: link(R, B); break;
      case 6: case 9: link(T, B); break;
      case 7: case 8: link(Lf, B); break;
      case 5: if (mid) { link(T, R); link(Lf, B); } else { link(Lf, T); link(R, B); } break;
      case 10: if (mid) { link(Lf, T); link(R, B); } else { link(T, R); link(Lf, B); } break;
    }
  }
  const loops = [];
  for (let s = 0; s < segs.length; s++) {
    if (segs[s][4]) continue;
    const loop = [segs[s][1]]; let cur = s, key = segs[s][2]; segs[s][4] = true; loop.push(segs[s][3]);
    for (;;) {
      const nxt = at.get(key).find(id => !segs[id][4]);
      if (nxt === undefined) break;
      segs[nxt][4] = true;
      if (segs[nxt][0] === key) { loop.push(segs[nxt][3]); key = segs[nxt][2]; } else { loop.push(segs[nxt][1]); key = segs[nxt][0]; }
      cur = nxt;
    }
    loops.push(loop);
  }
  return loops;
}
const lengthOf = pts => { let s = 0; for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return s; };
// thin a loop to points at least `gap` apart, then draw it as one smooth closed curve through them. `q` is the step
// the coordinates are rounded to: a whole unit is plenty for tints and fine lines, and takes far less room.
function loopPath(loop, gap = 5, q = 1){
  const p = [loop[0]];
  for (let i = 1; i < loop.length; i++) { const v = loop[i], l = p[p.length - 1]; if (Math.hypot(v[0] - l[0], v[1] - l[1]) >= gap) p.push(v); }
  if (p.length > 3 && Math.hypot(p[0][0] - p[p.length - 1][0], p[0][1] - p[p.length - 1][1]) < gap * 0.6) p.pop();
  if (p.length < 4) return '';
  const n = p.length, r = v => f(Math.round(v / q) * q), mid = k => [(p[k % n][0] + p[(k + 1) % n][0]) / 2, (p[k % n][1] + p[(k + 1) % n][1]) / 2];
  // written as steps from the previous point, which takes about a third less room than full coordinates
  let cx = r(mid(0)[0]), cy = r(mid(0)[1]), d = `M${cx},${cy}`;
  for (let k = 1; k <= n; k++) { const m = mid(k), qx = r(p[k % n][0]), qy = r(p[k % n][1]), mx = r(m[0]), my = r(m[1]); d += `q${f(qx - cx)},${f(qy - cy)} ${f(mx - cx)},${f(my - cy)}`; cx = mx; cy = my; }
  return d + 'Z';
}
const region = (F, level, { gap = 5, min = 30, q = 1 } = {}) => isoLoops(F, level).filter(l => lengthOf(l) > min).map(l => loopPath(l, gap, q)).join('');
// a new grid from a function of place and height
const gridOf = fn => { const G = new Float32Array(GX * GY); for (let j = 0; j < GY; j++) for (let i = 0; i < GX; i++) G[j * GX + i] = fn(gx(i), gy(j), field[j * GX + i], i, j); return G; };

// the longest loop at one level, as points: used to run roads and paths at a set distance from the shore
const ringAt = (F, level) => isoLoops(F, level).sort((a, b) => lengthOf(b) - lengthOf(a))[0];
// the stretch of a closed ring from the point nearest `a` to the point nearest `b`, going round by way of `via`
function ringPart(ring, a, b, via){
  const idx = q => { let bi = 0, bd = 1e18; ring.forEach((p, i) => { const d = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2; if (d < bd) { bd = d; bi = i; } }); return bi; };
  const ia = idx(a), ib = idx(b), iv = idx(via), n = ring.length, fwd = [], back = [];
  for (let i = ia; ; i = (i + 1) % n) { fwd.push(ring[i]); if (i === ib) break; }
  for (let i = ia; ; i = (i - 1 + n) % n) { back.push(ring[i]); if (i === ib) break; }
  const has = (arr) => arr.some(p => p === ring[iv]);
  return has(fwd) ? fwd : back;
}
// thin a line to points at least `gap` apart, and draw it as a smooth open curve
const thinned = (pts, gap) => { const out = [pts[0]]; for (let i = 1; i < pts.length - 1; i++) { const l = out[out.length - 1]; if (Math.hypot(pts[i][0] - l[0], pts[i][1] - l[1]) >= gap) out.push(pts[i]); } out.push(pts[pts.length - 1]); return out; };
const curve = pts => { if (pts.length < 3) return 'M' + pts.map(p => `${f(p[0])},${f(p[1])}`).join(' L'); let d = `M${f(pts[0][0])},${f(pts[0][1])}`; for (let i = 1; i < pts.length - 1; i++) d += ` Q${f(pts[i][0])},${f(pts[i][1])} ${f((pts[i][0] + pts[i + 1][0]) / 2)},${f((pts[i][1] + pts[i + 1][1]) / 2)}`; const e = pts[pts.length - 1]; return d + ` L${f(e[0])},${f(e[1])}`; };
// the point a given distance along a line, with the direction of the line there
function walk(pts, dist){
  let s = 0;
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (s + l >= dist) { const t = (dist - s) / (l || 1); return [lerp(pts[i - 1][0], pts[i][0], t), lerp(pts[i - 1][1], pts[i][1], t), Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0])]; } s += l; }
  const e = pts[pts.length - 1], q = pts[pts.length - 2]; return [e[0], e[1], Math.atan2(e[1] - q[1], e[0] - q[0])];
}

// ---------- a piece of the sheet, for other graphics that show where they stand on it ----------
// The lake's shore and the contour lines that cross a window, as lists of points in sheet coordinates. Lines are cut
// where they leave the window; the shore is left whole, for whoever draws it to fill and clip.
export function sheetPart(x0, y0, x1, y1, step = 200){
  const inside = p => p[0] >= x0 && p[0] <= x1 && p[1] >= y0 && p[1] <= y1, lines = [];
  for (let lv = 3400; lv <= 9600; lv += step) for (const loop of isoLoops(field, lv)) {
    let run = [];
    for (const p of [...loop, loop[0]]) { if (inside(p)) run.push(p); else { if (run.length > 1) lines.push([lv, run]); run = []; } }
    if (run.length > 1) lines.push([lv, run]);
  }
  return { lines, shore: isoLoops(lakeIn, 0).filter(l => l.some(inside)) };
}

export function map(){
  L.usePalette('gold'); L.begin();
  const P = L.P, o = [], m = [], top = [];
  const paper = '#F3EAD3', ink = '#2A2438', brown = '#A8755F', water = P.teal, waterFill = mix(P.tealLight, '#FFFFFF', 0.6), red = P.coral, redDeep = P.coralSh;
  const sans = `font-family="'Source Sans 3', sans-serif"`, serif = `font-family="Fraunces, serif" style="font-variation-settings:'SOFT' 60,'opsz' 20,'wght' 500,'WONK' 0"`;
  const halo = `stroke="${paper}" stroke-width="3" stroke-linejoin="round" paint-order="stroke"`;
  o.push(`<rect width="${W}" height="${H}" fill="${paper}"/>`);
  const frame = clip(`M28,28 H972 V672 H28Z`);
  const at = t => onPath(t), [LODGE, FLATS, POINT, HUT, MEADOW, PASS] = [PLACE.lodge, PLACE.flats, PLACE.point, PLACE.hut, PLACE.meadows, PLACE.pass].map(at);

  // ---- ground cover, read off the heights: forest below the tree line, open ground above it, snow on the highest
  // and the north-facing slopes, and the wet meadows on their bench
  const treeline = gridOf((x, y, e) => 6750 + 260 * fbm(x / 60, y / 60, 5, 2) - e);
  m.push(`<path d="${region(treeline, 0, { gap: 6 })}" fill="${mix(P.tealLight, paper, 0.74)}" fill-rule="evenodd"/>`);
  const meadowLine = smoothLine([[733, 184], [720, 200], [713, 224]], 4);
  const meadow = gridOf((x, y, e) => 21 - nearest(x, y, meadowLine).d - Math.abs(e - 6240) / 26 + 3 * fbm(x / 14, y / 14, 61, 2));
  const meadowD = region(meadow, 0, { gap: 4, min: 20 });
  m.push(`<path d="${meadowD}" fill="${mix(P.tealLight, P.cream, 0.74)}"/>`);
  const fallN = gridOf((x, y, e, i, j) => (i > 0 && j > 0 && i < GX - 1 && j < GY - 1) ? clamp((field[(j + 1) * GX + i] - field[(j - 1) * GX + i]) / 400, -1, 1) : 0);     // positive where the ground falls to the north
  const snow = gridOf((x, y, e, i, j) => e - 8300 + 420 * fallN[j * GX + i] + 140 * fbm(x / 40, y / 40, 31, 2));
  const share = d => { const id = L.nid('mp'); L.defs.push(`<path id="${id}" d="${d}"/>`); return id; };       // a shape stored once, drawn as often as needed
  const snowId = share(region(snow, 0, { gap: 5 }));
  m.push(`<use href="#${snowId}" fill="#FFFDF6" fill-rule="evenodd"/>`);

  // ---- relief: the slopes that face away from a light in the north-west are tinted, in two flat steps
  {
    let S = gridOf((x, y, e, i, j) => { if (i < 1 || j < 1 || i > GX - 2 || j > GY - 2) return 0.7; const sx = (field[j * GX + i + 1] - field[j * GX + i - 1]) / (2 * CELL * 88) * 2.2, sy = (field[(j + 1) * GX + i] - field[(j - 1) * GX + i]) / (2 * CELL * 88) * 2.2; return (0.5 * sx + 0.5 * sy + 0.707) / Math.sqrt(sx * sx + sy * sy + 1); });
    for (let pass = 0; pass < 2; pass++) { const T = new Float32Array(S); for (let j = 1; j < GY - 1; j++) for (let i = 1; i < GX - 1; i++) { let a = 0; for (let v = -1; v <= 1; v++) for (let u = -1; u <= 1; u++) a += S[(j + v) * GX + i + u]; T[j * GX + i] = a / 9; } S = T; }
    const dark = lv => region(gridOf((x, y, e, i, j) => lv - S[j * GX + i]), 0, { gap: 8, min: 50 });
    m.push(`<g fill="${P.plum}" fill-rule="evenodd"><path d="${dark(0.56)}" opacity="0.085"/><path d="${dark(0.4)}" opacity="0.085"/></g>`);
  }
  m.push(`<use href="#${snowId}" fill="none" stroke="#9DA9C4" stroke-width="0.9" stroke-dasharray="4 3"/>`);

  // ---- contours every 200 ft, every fifth one heavier
  let thin = '', heavy = ''; const indexLoops = [];
  for (let lv = 3400; lv <= 9600; lv += 200) {
    const loops = isoLoops(field, lv).filter(l => lengthOf(l) > 26), d = loops.map(l => loopPath(l, 6.2, 0.5)).join('');
    if (lv % 1000 === 0) { heavy += d; loops.forEach(l => indexLoops.push([lv, l])); } else thin += d;
  }
  m.push(`<g fill="none" stroke="${brown}" stroke-linejoin="round"><path d="${thin}" stroke-width="0.55" opacity="0.6"/><path d="${heavy}" stroke-width="1.15" opacity="0.82"/></g>`);

  // ---- water: creeks down the valley lines, the lake with two depth lines, a fall where Halloran Creek leaves its bench
  const springs = { halloran: [790, 124], cathedral: [466, 120], cedar: [606, 486], south: [620, 530], west1: [298, 170], west2: [138, 160], west3: [350, 306], knob: [450, 536], tolliver: [850, 250], east: [768, 380], far: [70, 250], south2: [240, 640], south3: [820, 560], north2: [610, 150] };
  const creekPts = {}; for (const k in springs) { const c = creekFrom(...springs[k]); if (c && lengthOf(c) > 40) creekPts[k] = thinned(c, 6); }
  m.push(`<g fill="none" stroke="${water}" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"><path d="${Object.values(creekPts).map(curve).join(' ')}" stroke-width="0.9"/><path d="${curve(smoothLine([[92, 468], [44, 484], [20, 492]], 6))}" stroke-width="2.2"/></g>`);
  const lakeD = region(lakeIn, 0, { gap: 4.5, q: 0.1 });
  const lakeId = share(lakeD);
  m.push(`<use href="#${lakeId}" fill="${waterFill}" fill-rule="evenodd"/><g fill="none" stroke="${water}" opacity="0.4" stroke-width="0.6"><path d="${region(lakeIn, 9, { gap: 6 })}"/><path d="${region(lakeIn, 18, { gap: 6 })}"/></g><use href="#${lakeId}" fill="none" stroke="${water}" stroke-width="1.2"/>`);
  m.push(`<path d="M716,244 l7,2.4 M717.4,247.6 l7,2.4" stroke="${water}" stroke-width="1.1"/>`);

  // ---- index contour labels, set where the heavy contours cross three straight ladders so the figures stack up a slope
  {
    let lab = '';
    const ladders = [[[548, 420], [556, 640]], [[196, 410], [196, 120]], [[930, 440], [790, 330]], [[528, 266], [548, 40]]];
    for (const [a, b] of ladders) for (const [lv, loop] of indexLoops) {
      for (let i = 1; i < loop.length; i++) {
        const p = loop[i - 1], q = loop[i], d1 = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]), d2 = (b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0]);
        if (d1 * d2 > 0) continue;
        const t = d1 / (d1 - d2), x = lerp(p[0], q[0], t), y = lerp(p[1], q[1], t), u = ((x - a[0]) * (b[0] - a[0]) + (y - a[1]) * (b[1] - a[1])) / ((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2);
        if (u < 0 || u > 1 || x < 50 || x > 950 || y < 46 || y > 654) continue;
        let ang = Math.atan2(q[1] - p[1], q[0] - p[0]) * 180 / Math.PI; if (ang > 90) ang -= 180; if (ang < -90) ang += 180;
        lab += `<text x="${f(x)}" y="${f(y + 2.6)}" text-anchor="middle" transform="rotate(${f(ang)} ${f(x)} ${f(y)})">${lv.toLocaleString('en-US')}</text>`;
        break;
      }
    }
    m.push(`<g ${sans} font-size="7.6" font-weight="600" fill="${mix(brown, ink, 0.35)}" stroke="${paper}" stroke-width="2.6" stroke-linejoin="round" paint-order="stroke">${lab}</g>`);
  }

  // ---- roads. Lakeshore Rd keeps a set distance back from the water, so it is read off the same grid as the shore.
  const ring = ringAt(lakeIn, -11);
  const lakeshore = thinned([[20, 470], [60, 462], ...ringPart(ring, [104, 450], [596, 362], [700, 262])], 7);
  const southRd = smoothLine([[650, 690], [644, 640], [632, 590], [620, 548], [612, 514], [604, 484], [606, 446], [598, 408], [600, 378], [596, 362]], 6);
  const standRd = smoothLine([[427, 374], [431, 358], [436, 342]], 4);
  const roadId = share(curve(lakeshore) + ' ' + curve(southRd)), spurId = share(curve(standRd));
  m.push(`<g fill="none" stroke-linecap="round" stroke-linejoin="round"><use href="#${roadId}" stroke="${ink}" stroke-width="3.5"/><use href="#${spurId}" stroke="${ink}" stroke-width="2.6"/><use href="#${roadId}" stroke="#FFFDF6" stroke-width="1.9"/><use href="#${spurId}" stroke="#FFFDF6" stroke-width="1.2"/></g>`);

  // ---- trails. Each is a line of points, so closures can be marked along it later.
  const shorePath = ringAt(lakeIn, -4), bench = ringAt(lakeIn, -25);
  const T = {
    1: smoothLine([LODGE, ...thinned(ringPart(shorePath, [LODGE[0] - 14, LODGE[1] + 9], [566, 326], [600, 312]), 12), ...thinned(ringPart(bench, [562, 304], [LODGE[0] - 22, LODGE[1] - 16], [600, 286]), 12), LODGE], 3),
    2: smoothLine([[436, 340], [433, 326], [431, 312], [428, 298], [431, 282], [440, 272], [450, 280], [452, 296], [446, 310], [438, 318], [433, 326]], 3),
    3: smoothLine([LODGE, [LODGE[0] + 10, LODGE[1] - 4], [LODGE[0] + 6, LODGE[1] - 12], [POINT[0] + 5, POINT[1] + 6], POINT], 3),
    4: smoothLine([POINT, [POINT[0] - 7, POINT[1] - 9], [POINT[0] + 6, POINT[1] - 14], [POINT[0] - 4, POINT[1] - 23], [POINT[0] + 12, POINT[1] - 27], [POINT[0] + 6, POINT[1] - 37], [696, 206], [708, 204], MEADOW], 3),
    5: smoothLine([MEADOW, [733, 196], [747, 188], [749, 172], [763, 168], [765, 151], HUT, [786, 138], [779, 127], [796, 123], [789, 112], [806, 108], PASS], 3),
  };
  const trailId = share(Object.values(T).map(t => 'M' + t.map(q => `${f(q[0])},${f(q[1])}`).join(' L')).join(' '));
  top.push(`<g fill="none" stroke-linecap="round" stroke-linejoin="round"><use href="#${trailId}" stroke="${paper}" stroke-width="3.4" opacity="0.85"/><use href="#${trailId}" stroke="${red}" stroke-width="1.7" stroke-dasharray="5 2.6"/></g>`);

  // ---- revisions. From stage 3 the sheet is overprinted: closed ground in red, following the contours, with closed
  // trails crossed out; from stage 4 the path that was plotted across it, in black. Same grid, same line work.
  const divide = smoothLine([[-60, 508], [44, 484], [88, 470], [250, 440], [430, 385], [612, 318], [736, 268], [790, 312], [806, 392], [866, 430], [1060, 470]], 8);     // north of this line is the high side of the basin
  const northSide = (x, y) => { const n = nearest(x, y, divide); return n.side < 0 ? n.d : -n.d; };
  const northGrid = gridOf((x, y) => northSide(x, y));
  const closure = ft => region(gridOf((x, y, e, i, j) => Math.min((e - ft) / 40, northGrid[j * GX + i])), 0, { gap: 5, min: 60 });
  L.defs.push(`<pattern id="mapHatch" width="7.2" height="7.2" patternUnits="userSpaceOnUse" patternTransform="rotate(-42)"><rect width="1" height="7.2" fill="${redDeep}" opacity="0.36"/></pattern>`);
  const closed = d => { const id = share(d); return `<use href="#${id}" fill="url(#mapHatch)" fill-rule="evenodd"/><use href="#${id}" fill="none" stroke="${redDeep}" stroke-width="1.3" stroke-dasharray="7 2.4 1.4 2.4" stroke-linejoin="round"/>`; };
  const rev = [];
  rev.push(between(3, 3, closed(closure(7500))) + from(4, closed(closure(3760))));
  // crosses along a closed trail
  const crosses = pts => { let d = ''; for (let s0 = 6, n = lengthOf(pts); s0 < n - 3; s0 += 11) { const [x, y] = walk(pts, s0); d += `M${f(x - 2.3)},${f(y - 2.3)} l4.6,4.6 M${f(x - 2.3)},${f(y + 2.3)} l4.6,-4.6 `; } return d; };
  const hutAt = T[5].findIndex(q => Math.hypot(q[0] - HUT[0], q[1] - HUT[1]) < 2);
  const crossStyle = d => { const id = share(d); return `<use href="#${id}" fill="none" stroke="${paper}" stroke-width="3" stroke-linecap="round" opacity="0.8"/><use href="#${id}" fill="none" stroke="${redDeep}" stroke-width="1.4" stroke-linecap="round"/>`; };

  // the plotted path: one straight line on a bearing of 222 degrees, with a mark of direction every so often. Drawn
  // solid over ground, where the marks were found, and broken over the lake, where it can only be inferred.
  const bearing = Math.atan2(PATH_DIR[1], PATH_DIR[0]) * 180 / Math.PI;
  const plotted = (t0, t1) => {
    const line = (u, v) => `M${f(at(u)[0])},${f(at(u)[1])} L${f(at(v)[0])},${f(at(v)[1])}`;
    const dry = [[t0, Math.min(t1, PLACE.shoreN)], [Math.max(t0, PLACE.shoreS), t1]].filter(([u, v]) => v > u).map(([u, v]) => line(u, v)).join(' ');
    const wet = [[Math.max(t0, PLACE.shoreN), Math.min(t1, PLACE.shoreS)]].filter(([u, v]) => v > u).map(([u, v]) => line(u, v)).join(' ');
    let ch = '';
    for (let t = Math.ceil((t0 + 4) / 13) * 13; t <= t1 - 5; t += 13) { if (t > PLACE.shoreN - 3 && t < PLACE.shoreS + 3) continue; const [x, y] = at(t); ch += `<path d="M-2.8,-3.5 L1.5,0 L-2.8,3.5" transform="translate(${f(x)},${f(y)}) rotate(${f(bearing)})"/>`; }
    return `<g fill="none"><path d="${line(t0, t1)}" stroke="${paper}" stroke-width="5.4" opacity="0.9"/>${dry ? `<path d="${dry}" stroke="${ink}" stroke-width="1.7"/>` : ''}${wet ? `<path d="${wet}" stroke="${ink}" stroke-width="1.7" stroke-dasharray="4.2 3.2"/>` : ''}<g stroke="${paper}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" opacity="0.9">${ch}</g><g stroke="${ink}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${ch}</g></g>`;
  };
  const head = t => { const [x, y] = at(t); return `<path d="M-6,-4.6 L4,0 L-6,4.6 L-3.6,0Z" transform="translate(${f(x)},${f(y)}) rotate(${f(bearing)})" fill="${ink}" stroke="${paper}" stroke-width="1.2" stroke-linejoin="round" paint-order="stroke"/>`; };
  const alongPath = (t, off, txt, extra = '') => { const [x, y] = at(t), nx = -PATH_DIR[1], ny = PATH_DIR[0]; return `<text class="t" x="${f(x + nx * off)}" y="${f(y + ny * off)}" text-anchor="middle" transform="rotate(${f(bearing + 180)} ${f(x + nx * off)} ${f(y + ny * off)})" ${sans} font-size="8.6" font-weight="700" letter-spacing="0.7" fill="${ink}" ${halo}${extra}>${txt}</text>`; };
  const EDGE = (672 - PATH_A[1]) / PATH_DIR[1], OUT = (691 - PATH_A[1]) / PATH_DIR[1];            // where the line meets the bottom of the frame, and where it stops in the margin
  const S4 = 170, S5 = 470;

  // ---- point symbols: one family, pale pictograms on dark tiles
  const tile = (x, y, d) => `<g transform="translate(${f(x)},${f(y)})"><rect x="-7.4" y="-7.4" width="14.8" height="14.8" rx="2.6" fill="${paper}"/><rect x="-6.3" y="-6.3" width="12.6" height="12.6" rx="2" fill="${ink}"/><g fill="${paper}">${d}</g></g>`;
  const PIC = {
    lodge: `<path d="M-4.6,4.6 V-0.6 L0,-4.8 L4.6,-0.6 V4.6 H1.4 V1.2 H-1.4 V4.6Z"/>`,
    camp: `<path d="M-5,4.4 L0,-4.6 L5,4.4 H1.9 L0,0.6 L-1.9,4.4Z"/>`,
    ranger: `<path d="M-3.6,4.8 V-4.8 H-2.3 V4.8Z M-2.3,-4.8 L4.6,-2.2 L-2.3,0.4Z"/>`,
    hut: `<path d="M-5,2 L0,-4.4 L5,2 H3.4 V4.6 H-3.4 V2Z"/>`,
    view: `<circle cx="0" cy="1.6" r="1.7"/><path d="M-4.8,1.6 A4.8,4.8 0 0 1 4.8,1.6" fill="none" stroke="${paper}" stroke-width="1.5"/>`,
    gate: `<path d="M-4.6,4.6 V-1.4 H4.6 V4.6 H2.4 V1 H-2.4 V4.6Z M-5.4,-1.4 L0,-4.8 L5.4,-1.4Z"/>`,
    park: `<path d="M-2.6,4.6 V-4.6 H1 A3,3 0 0 1 1,1.4 H-0.9 V4.6Z M-0.9,-3 V-0.2 H0.8 A1.4,1.4 0 0 0 0.8,-3Z" fill-rule="evenodd"/>`,
  };
  const peak = (x, y) => `<path d="M${x},${y - 4.4} L${x + 4.2},${y + 3} L${x - 4.2},${y + 3}Z" fill="${ink}" stroke="${paper}" stroke-width="1.2" paint-order="stroke" stroke-linejoin="round"/>`;
  const sym = [];
  sym.push(peak(892, 150) + peak(705, 58) + peak(330, 604));
  { const d = `M-5.4,-5 Q-1.6,0 -5.4,5 M5.4,-5 Q1.6,0 5.4,5`, tr = `transform="translate(${PASS[0]},${PASS[1]}) rotate(-48)"`; sym.push(`<path d="${d}" ${tr} fill="none" stroke="${paper}" stroke-width="3.6" stroke-linecap="round"/><path d="${d}" ${tr} fill="none" stroke="${ink}" stroke-width="1.6" stroke-linecap="round"/>`); }
  sym.push(tile(...LODGE, PIC.lodge) + tile(...FLATS, PIC.camp) + tile(...HUT, PIC.hut) + tile(...POINT, PIC.view) + tile(613, 430, PIC.ranger) + tile(436, 338, PIC.park) + tile(47, 452, PIC.gate) + tile(634, 650, PIC.gate));
  // trail numbers
  const badge = (x, y, n) => `<circle cx="${x}" cy="${y}" r="6.6" fill="${paper}" stroke="${red}" stroke-width="1.5"/><text x="${x}" y="${y + 3.3}" text-anchor="middle" ${sans} font-size="9.4" font-weight="700" fill="${redDeep}">${n}</text>`;
  sym.push(badge(604, 267, 1) + badge(417, 296, 2) + badge(668, 276, 3) + badge(654, 222, 4) + badge(762, 180, 5));

  // ---- lettering. Every label carries a halo in the colour of what lies under it, so no line runs through a word.
  const lab = (x, y, t, { extra = '', size = 11.2, anchor = 'start', weight = 600, fill = ink, on = paper, cls = true } = {}) => `<text${cls ? ' class="t"' : ''} x="${x}" y="${y}" text-anchor="${anchor}" ${sans} font-size="${size}" font-weight="${weight}" fill="${fill}" stroke="${on}" stroke-width="3" stroke-linejoin="round" paint-order="stroke"${extra}>${t}</text>`;
  const ital = (x, y, t, rot = 0, size = 8.8) => `<text x="${x}" y="${y}" ${sans} font-size="${size}" font-style="italic" font-weight="600" fill="${water}" stroke="${paper}" stroke-width="2.6" stroke-linejoin="round" paint-order="stroke" letter-spacing="0.4"${rot ? ` transform="rotate(${rot} ${x} ${y})"` : ''}>${t}</text>`;
  const txt = [];
  L.defs.push(`<path id="lakeName" d="M288,443 Q410,414 560,354"/>`);
  txt.push(`<text ${serif} font-size="19" font-style="italic" fill="${water}" letter-spacing="5"><textPath href="#lakeName" startOffset="50%" text-anchor="middle" class="t" data-s6="Crossed here">Echo Lake</textPath></text>`);
  txt.push(`<text x="186" y="462" ${sans} font-size="8.4" font-style="italic" font-weight="600" fill="${water}" transform="rotate(-11 186 462)">3,540 ft</text>`);
  txt.push(ital(36, 507, 'Echo River', -12) + ital(461, 214, 'Cathedral Creek', -84) + ital(741, 240, 'Halloran Cr.', 0));
  { const [x, y, a] = walk(lakeshore, 330); txt.push(`<text x="${f(x)}" y="${f(y - 4.6)}" text-anchor="middle" transform="rotate(${f(a * 180 / Math.PI)} ${f(x)} ${f(y - 4.6)})" ${sans} font-size="8.6" font-weight="600" letter-spacing="0.6" fill="${ink}" stroke="${paper}" stroke-width="2.6" stroke-linejoin="round" paint-order="stroke">Lakeshore Rd</text>`); }
  txt.push(lab(LODGE[0] + 4, LODGE[1] + 19, 'Basin Lodge', { on: waterFill }) + lab(FLATS[0] - 11, FLATS[1] + 1, 'Cedar Flats', { anchor: 'end', on: waterFill, extra: ` data-s4="Cedar Flats (closed)"` }));
  txt.push(lab(624, 434, 'Ranger station', { extra: ` data-s5="Ranger station (1 staff)"` }) + lab(HUT[0] - 10, HUT[1] - 6, 'Pass Hut', { anchor: 'end', extra: ` data-s4="Pass Hut (do not enter)"` }) + lab(POINT[0] + 11, POINT[1] + 4, 'Echo Point', { extra: ` data-s3="Echo Point (no shouting)"` }));
  txt.push(lab(MEADOW[0] + 18, MEADOW[1] + 22, 'Halloran Meadows', { extra: ` data-s4="Halloran Meadows (no elk)"` }) + lab(458, 290, 'Cathedral Stand'));
  txt.push(lab(PASS[0] - 9, PASS[1] - 7, 'Echo Pass 8,560 ft', { anchor: 'end', size: 10.4 }) + lab(883, 148, 'Mt. Tolliver', { anchor: 'end' }) + lab(883, 159, '9,650 ft', { size: 9, weight: 500, anchor: 'end' }) + lab(713, 57, 'Corrie Peak') + lab(713, 68, '9,180 ft', { size: 9, weight: 500 }) + lab(322, 603, 'Low Knob', { anchor: 'end' }) + lab(322, 614, '5,940 ft', { size: 9, weight: 500, anchor: 'end' }));
  txt.push(lab(604, 510, 'Cedar Gap', { anchor: 'end', size: 9.4, weight: 500 }) + lab(58, 448, 'West Entrance', { size: 10 }) + lab(624, 654, 'South Entrance', { size: 10, anchor: 'end' }));

  // ---- the revisions go between the ground and the symbols, so the plotted line runs under each place it passes through
  rev.push(from(3, crossStyle(crosses(T[5].slice(hutAt)))) + from(4, crossStyle(crosses(T[5].slice(0, hutAt + 1)) + crosses(T[4]) + crosses(T[3]) + crosses(T[2]))));
  rev.push(from(4, plotted(0, S4)) + between(4, 4, head(S4 + 4)) + from(5, plotted(S4, S5)) + between(5, 5, head(S5 + 4)) + from(6, plotted(S5, EDGE + 0.5)));
  rev.push(between(3, 3, lab(428, 51, 'Seasonal closure above 7,500 ft', { anchor: 'middle', size: 10.4, weight: 700, fill: redDeep })) + from(4, lab(566, 203, 'Closure extended Sept. 14', { anchor: 'middle', size: 10.4, weight: 700, fill: redDeep, extra: ` data-s5="Closed until further notice"` })));
  rev.push(from(4, alongPath(120, 8.5, 'OBSERVED PATH')) + from(5, alongPath(424, 8.5, 'MARKS 40 FT APART')));

  // ---- legend, with a second panel for the revisions once there are any
  const LX = 658, LY = 492, LW = 206;
  const row = (k, sw, label, extra = '') => `<g transform="translate(${LX + 12},${LY + 16 + k * 14.4})">${sw}<text x="40" y="3.6" ${sans} font-size="9.6" font-weight="600" fill="${ink}"${extra}>${label}</text></g>`;
  const mini = (x, d) => `<g transform="translate(${x},0) scale(0.78)"><rect x="-6.3" y="-6.3" width="12.6" height="12.6" rx="2" fill="${ink}"/><g fill="${paper}">${d}</g></g>`;
  const leg = [`<rect x="${LX}" y="${LY}" width="${LW}" height="118" rx="3" fill="${paper}" stroke="${ink}" stroke-width="1"/>`];
  leg.push(row(0, `<path d="M0,0 h30" stroke="${ink}" stroke-width="3.5"/><path d="M0,0 h30" stroke="#FFFDF6" stroke-width="1.9"/>`, 'Park road'));
  leg.push(row(1, `<path d="M0,0 h30" stroke="${red}" stroke-width="1.7" stroke-dasharray="5 2.6"/>`, 'Maintained trail, numbered'));
  leg.push(row(2, `<path d="M0,-2.4 q8,-3 15,0 t15,0" fill="none" stroke="${brown}" stroke-width="0.6"/><path d="M0,2.6 q8,-3 15,0 t15,0" fill="none" stroke="${brown}" stroke-width="1.15"/>`, 'Contours, 200 ft and 1,000 ft'));
  leg.push(row(3, `<path d="M0,1 q8,-5 15,-1 t15,-1" fill="none" stroke="${water}" stroke-width="0.9"/>`, 'Creek'));
  leg.push(row(4, `<rect x="0" y="-4.6" width="14" height="9.2" fill="${mix(P.tealLight, paper, 0.74)}" stroke="${brown}" stroke-width="0.4"/><rect x="16" y="-4.6" width="14" height="9.2" fill="#FFFDF6" stroke="#9DA9C4" stroke-width="0.9" stroke-dasharray="3 2"/>`, 'Forest · permanent snow'));
  leg.push(`<g transform="translate(${LX + 18},${LY + 91})" ${sans} font-size="8.8" font-weight="600" fill="${ink}">${[['lodge', 'Lodge', 0, 0], ['camp', 'Campground', 52, 0], ['ranger', 'Ranger station', 120, 0], ['hut', 'Hut', 0, 14.4], ['view', 'Viewpoint', 52, 14.4], ['park', 'Parking', 120, 14.4]].map(([k, t, x, y]) => `<g transform="translate(${x},${y})">${mini(0, PIC[k])}<text x="8.4" y="3.2">${t}</text></g>`).join('')}</g>`);
  const RY = LY + 121;
  leg.push(between(3, 3, `<rect x="${LX}" y="${RY}" width="${LW}" height="35" rx="3" fill="${paper}" stroke="${ink}" stroke-width="1"/>`) + from(4, `<rect x="${LX}" y="${RY}" width="${LW}" height="49.4" rx="3" fill="${paper}" stroke="${ink}" stroke-width="1"/>`));
  const rrow = (k, sw, label, extra = '') => `<g transform="translate(${LX + 12},${RY + 11 + k * 14.4})">${sw}<text class="t" x="40" y="3.6" ${sans} font-size="9.6" font-weight="600" fill="${ink}"${extra}>${label}</text></g>`;
  leg.push(from(3, rrow(0, `<rect x="0" y="-4.8" width="30" height="9.6" fill="url(#mapHatch)" stroke="${redDeep}" stroke-width="1.1" stroke-dasharray="7 2.4 1.4 2.4"/>`, 'Closed area') + rrow(1, `<path d="M0,0 h30" stroke="${red}" stroke-width="1.7" stroke-dasharray="5 2.6"/><path d="M5.7,-2.3 l4.6,4.6 M5.7,2.3 l4.6,-4.6 M19.7,-2.3 l4.6,4.6 M19.7,2.3 l4.6,-4.6" stroke="${redDeep}" stroke-width="1.4" stroke-linecap="round"/>`, 'Trail closed')));
  leg.push(from(4, rrow(2, `<path d="M30,0 h-30" stroke="${ink}" stroke-width="1.7"/><path d="M19.8,-3.5 L15.5,0 L19.8,3.5 M9.8,-3.5 L5.5,0 L9.8,3.5" fill="none" stroke="${ink}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`, 'Observed path, conditions', ` data-s5="Observed path (not a trail)" data-s6="The way it left"`)));

  // ---- title, scale and north
  const furn = [];
  furn.push(`<rect x="42" y="42" width="196" height="62" rx="3" fill="${paper}" stroke="${ink}" stroke-width="1"/><text x="54" y="69" ${serif} font-size="24" fill="${ink}">Echo Basin</text><text x="55" y="84" ${sans} font-size="9.6" font-weight="700" letter-spacing="2.2" fill="${ink}">NATIONAL PARK</text><path d="M54,90 h172" stroke="${ink}" stroke-width="0.7"/><text x="55" y="99" ${sans} font-size="7.8" font-weight="600" fill="${ink}" letter-spacing="0.3">Visitor map · 1 inch to the mile · heights in feet</text>`);
  { const sx = 48, sy = 646; let bar = ''; for (let k = 0; k < 3; k++) bar += `<rect x="${sx + k * U_PER_MILE}" y="${sy}" width="${U_PER_MILE}" height="4.6" fill="${k % 2 ? paper : ink}" stroke="${ink}" stroke-width="0.9"/>`;
    furn.push(`<rect x="38" y="612" width="250" height="50" rx="3" fill="${paper}" stroke="${ink}" stroke-width="1"/>${bar}<g ${sans} font-size="8.6" font-weight="600" fill="${ink}">${[0, 1, 2, 3].map(k => `<text x="${sx + k * U_PER_MILE}" y="${sy - 4}" text-anchor="middle">${k}</text>`).join('')}<text x="${sx + 3 * U_PER_MILE + 8}" y="${sy + 4.4}">mi</text><text x="${sx - 2}" y="${sy - 20}">Contour interval 200 ft</text></g>`);
    furn.push(`<g transform="translate(267,640)"><path d="M0,-13 L4.6,8 L0,4.2 L-4.6,8Z" fill="${ink}"/><text x="0" y="-16" text-anchor="middle" ${sans} font-size="9.4" font-weight="700" fill="${ink}">N</text></g>`); }

  o.push(`<g clip-path="url(#${frame})">${m.join('\n')}${top.join('\n')}${rev.join('\n')}${sym.join('\n')}${txt.join('\n')}${leg.join('\n')}${furn.join('\n')}</g>`);
  // ---- the sheet: neatline, ticks, the title line in the top margin
  o.push(`<path d="M28,28 H972 V672 H28Z" fill="none" stroke="${ink}" stroke-width="1.6"/><path d="M22,22 H978 V678 H22Z" fill="none" stroke="${ink}" stroke-width="0.6"/>`);
  let ticks = ''; for (let x = 128; x < 972; x += 100) ticks += `M${x},22 v6 M${x},672 v6 `; for (let y = 128; y < 672; y += 100) ticks += `M22,${y} h6 M972,${y} h6 `;
  o.push(`<path d="${ticks}" stroke="${ink}" stroke-width="0.9"/>`);
  o.push(`<text class="t" x="540" y="16.5" text-anchor="middle" ${sans} font-size="10" font-weight="600" fill="${ink}" letter-spacing="0.4" data-s4="Echo Basin National Park visitor map. Reprinted Sept. 16." data-s6="Echo Basin. You are past the edge of this map.">Echo Basin National Park visitor map. Summer season.</text>`);
  // stage 6: the line runs on past the neatline and stops in the margin, where the reader is
  { const [ex, ey] = at(OUT); o.push(from(6, `<path d="M${f(at(EDGE)[0])},672 L${f(ex)},${f(ey)}" stroke="${ink}" stroke-width="1.7"/><circle cx="${f(ex - 3.2)}" cy="${f(ey + 3.4)}" r="4.4" fill="${paper}" stroke="${redDeep}" stroke-width="2"/><circle cx="${f(ex - 3.2)}" cy="${f(ey + 3.4)}" r="1.3" fill="${redDeep}"/><text x="${f(ex + 6)}" y="${f(ey + 6.6)}" ${sans} font-size="10" font-weight="700" fill="${redDeep}">you are here</text>`)); }
  // the folds of a map that has been in a pocket, and the paper's tooth
  o.push(`<g fill="none" opacity="0.5"><path d="M343,0 V${H} M657,0 V${H} M0,350 H${W}" stroke="#FFFDF6" stroke-width="1.2" opacity="0.5"/><path d="M344.2,0 V${H} M658.2,0 V${H} M0,351.2 H${W}" stroke="${P.plum}" stroke-width="0.6" opacity="0.16"/></g>`);
  o.push(grain(0, 0, W, H, GR(500, 350, 720, [[0, 0], [0.6, 0.05], [1, 0.3]]), '#B9A27C'));
  return { svg: `<defs>${L.defs.join('\n')}</defs>${o.join('\n')}`, vb: [0, 0, W, H], vbm: [262, 0, 640, 700], flat: true };
}
