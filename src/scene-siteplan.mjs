// The Cedar Flats site plan, on the Lodging page beside the campsite entry: the sheet the entrance station hands
// you, printed on the map's paper in the map's line work. 80 numbered sites on three loops on the south shore of
// Echo Lake, with the water taps, restrooms, fire rings and bear lockers, and the sites booked for the weekend.
//
// Everything is laid out in feet, north up, and drawn twice through a projection: once for a wide column, and once
// for a phone, where the plan is turned a quarter turn (north to the left) so that its long side runs down the
// screen and the site numbers stay large enough to read. Lettering and pictograms stay upright in both.
//
// WHERE THIS IS. The park map puts Cedar Flats on its straight line, 0.15 mi (about 790 ft) past the point where the
// line comes ashore on the south side of the lake, by the delta of the creek that comes down from Cedar Gap. The
// shore there runs up to the north-east as far as the delta and then lies level, and the ground rises gently away
// from the water. The lodge is 1.8 mi off across the lake on a bearing of 042, which is the line run backwards.
// The plan's own scale (the scale bar) is the one the marks are drawn to: forty feet apart, six feet across.
//
// By stage:
//   0  an ordinary plan: 66 of the 80 sites (82%, the ticker's figure) carry a filled tent, booked for the weekend.
//   1  the legend says "Taken" for "Booked".
//   2, 3  the notes change: quiet hours at dusk, then everyone in tents by 7:42 and no fires.
//   4  closed. The same 66 tents are drawn in outline, the legend calls them tents still standing, and the entrance
//      road is barred.
//   5  the line comes out of the lake and across the plan: round marks about six feet across and forty feet apart
//      at the plan's own scale, overprinted the way the park map overprints its observed path. The sites it goes
//      through have lost their tents.
//   6  one site on the line is marked again, and ringed.
// It is never drawn: only the marks.
import * as L from './lib.mjs';
import { T, twoLayouts, sheet, tooth, rule, PAPER, INK, INK2, BROWN } from './infokit.mjs';
import { sitePlan as SP } from './content/split.mjs';
const { f, mix, from, until, between, clip } = L;

const PL = L.PAL.gold;
// the park map's water, roads and revision red; its forest tint a shade lighter, so the site numbers stand off it
const WATER = PL.teal, WATER_FILL = mix(PL.tealLight, '#FFFFFF', 0.6), FOREST = mix(PL.tealLight, PAPER, 0.78), ROAD = '#FFFDF6', RED_D = PL.coralSh;
const RAD = Math.PI / 180;
// Words the brief does not give yet, lettered on the scale bar. Placeholders, to be approved.
const PLACEHOLDER = { scale: ['0', '100', '200 ft'] };
const pair = v => Array.isArray(v) ? v : [v, undefined];
// Lettering on up to two lines, as infokit's lines2 does it, but broken where the two lines come out most even, and
// after a full stop where there is one, so that a short note does not leave one word on a line of its own.
function lines2(x, y, lh, s, o = {}, max = 48){
  const split = str => { if (str.length <= max) return [str, '']; let best = null;
    for (let i = 0; i < str.length; i++) if (str[i] === ' ') { const a = str.slice(0, i), b = str.slice(i + 1), score = Math.max(a.length, b.length) - (/\.$/.test(a) ? 6 : 0); if (a.length <= max && b.length <= max && (!best || score < best[0])) best = [score, a, b]; }
    return best ? [best[1], best[2]] : [str, '']; };
  const [a, b] = split(s), A = {}, B = {};
  for (const [k, v] of Object.entries(o.alts || {})) { const [va, vb] = split(v); A[k] = va; B[k] = vb; }
  return T(x, y, a, { ...o, alts: A }) + T(x, y + lh, b, { ...o, alts: B });
}

// ---------------------------------------------------------------------------------------------------------------
// The ground, in feet: x east, y south.
// a smooth line through control points (closed: joined back to its start), sampled every `step` feet
function smooth(pts, step = 12, closed = false){
  const n = pts.length, out = [], get = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    const m = Math.max(1, Math.round(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
    for (let k = 0; k < m; k++) { const t = k / m, t2 = t * t, t3 = t2 * t; out.push([0, 1].map(c => 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3))); }
  }
  if (!closed) out.push(pts[n - 1].slice());
  return out;
}
// The shore: rising to the north-east as far as the creek's delta, then level.
const SHORE = smooth([[-1100, -2], [-850, -20], [-600, -40], [-380, -60], [-180, -80], [0, -100], [110, -118], [180, -142], [240, -152], [292, -132], [370, -114], [460, -108]], 20);
const shoreY = x => { for (let i = 1; i < SHORE.length; i++) if (SHORE[i][0] >= x) { const a = SHORE[i - 1], b = SHORE[i], t = (x - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * t; } return SHORE[SHORE.length - 1][1]; };
// Cedar Creek, from the south edge down to its mouth on the delta.
const CREEK = smooth([[330, 900], [304, 760], [282, 660], [268, 580], [252, 500], [250, 420], [232, 340], [234, 250], [218, 160], [222, 70], [226, -20], [234, -100], [240, -152]], 20);

// ---------------------------------------------------------------------------------------------------------------
// The loops. Each is a one-way loop road entered from the main road. Its shape is a rounded rectangle (a
// superellipse) of half-sizes a and b, turned to the bearing `brg` and bent by `bend`. Sites are spaced evenly
// round the outside, leaving room where the road comes in, and along the inside of the two long sides: `inner`
// gives where each run starts and ends, as fractions of the way round from the entrance, and how many it holds.
const LOOPS = [
  { c: [-792, 300], a: 120, b: 188, p: 2.6, brg: -9, bend: 0, outer: 20, inner: [[0.13, 0.37, 4], [0.63, 0.87, 4]], gap: 52, first: 1 },
  { c: [-420, 286], a: 104, b: 194, p: 3.3, brg: 2, bend: 12, outer: 18, inner: [[0.13, 0.37, 4], [0.63, 0.87, 4]], gap: 52, first: 29 },
  { c: [-52, 290], a: 112, b: 168, p: 2.5, brg: 13, bend: -20, outer: 18, inner: [[0.13, 0.37, 4], [0.63, 0.87, 4]], gap: 52, first: 55 },
];
const MAIN_Y = x => 548 + 8 * Math.sin((x + 200) / 240);                  // the main road
const PAD_D = 28;                                                             // a pad's middle, out from the middle of the road
function loopGeo(lp){
  const a = lp.brg * RAD, u = [Math.sin(a), -Math.cos(a)], v = [Math.cos(a), Math.sin(a)], q = 2 / lp.p;
  const at = (X, Y) => [lp.c[0] + X * v[0] + Y * u[0], lp.c[1] + X * v[1] + Y * u[1]];
  const raw = [];
  for (let i = 0; i < 720; i++) { const t = i / 720 * 2 * Math.PI, c = Math.cos(t), s = Math.sin(t), X = lp.a * Math.sign(c) * Math.abs(c) ** q, Y = lp.b * Math.sign(s) * Math.abs(s) ** q; raw.push(at(X, Y - lp.bend * (X / lp.a) ** 2)); }
  // start at the point nearest the main road, and go round anticlockwise as the page shows it
  let i0 = 0; raw.forEach((p, i) => { if (MAIN_Y(p[0]) - p[1] < MAIN_Y(raw[i0][0]) - raw[i0][1]) i0 = i; });
  let ring = [...raw.slice(i0), ...raw.slice(0, i0)];
  const area = ring.reduce((s, p, i) => { const n = ring[(i + 1) % ring.length]; return s + p[0] * n[1] - n[0] * p[1]; }, 0);
  if (area > 0) ring = [ring[0], ...ring.slice(1).reverse()];
  const cum = [0]; for (let i = 1; i <= ring.length; i++) cum.push(cum[i - 1] + Math.hypot(ring[i % ring.length][0] - ring[i - 1][0], ring[i % ring.length][1] - ring[i - 1][1]));
  const P = cum[ring.length];
  // the road at a distance s round it: the point, and the normal pointing out of the loop
  const road = s => { s = ((s % P) + P) % P; let i = 1; while (cum[i] < s) i++; const A = ring[i - 1], B = ring[i % ring.length], t = (s - cum[i - 1]) / (cum[i] - cum[i - 1]), d = Math.hypot(B[0] - A[0], B[1] - A[1]);
    return { p: [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t], n: [-(B[1] - A[1]) / d, (B[0] - A[0]) / d], s }; };
  const sites = [];
  for (let i = 0; i < lp.outer; i++) sites.push({ ...road(lp.gap + (i + 0.5) * (P - 2 * lp.gap) / lp.outer), inner: false });
  for (const [f0, f1, n] of lp.inner) for (let i = 0; i < n; i++) { const r = road(P * (f0 + (f1 - f0) * (i + 0.5) / n)); sites.push({ ...r, n: [-r.n[0], -r.n[1]], inner: true }); }
  sites.sort((p, q) => p.s - q.s).forEach((st, i) => { st.no = lp.first + i; });
  const entry = ring[0];
  // Inside the loop, a restroom toward the far end, water taps down the middle (a tap every few sites, as the lodging
  // page says), and the loop's name: across the near end where the loop stands upright, and in the middle where it
  // lies on its side (the phone), between the sites' numbers.
  return { ...lp, ring, P, road, sites, entry, stem: [entry, [entry[0], MAIN_Y(entry[0])]], centre: at(0, 0), near: at(0, -lp.b + 40), restroom: at(-20, lp.b - 52), taps: [at(20, lp.b - 52), at(0, lp.b * 0.45), at(0, -lp.b * 0.45)] };
}
const GEO = LOOPS.map(loopGeo);
const SITES = GEO.flatMap(g => g.sites);
SITES.forEach(st => { st.pad = [st.p[0] + st.n[0] * PAD_D, st.p[1] + st.n[1] * PAD_D]; });

// The main road comes in from the east over the creek, past the entrance station, and runs west along the foot
// of the loops to the last of them.
const MAIN = []; for (let x = 640; x >= GEO[0].entry[0] - 1; x -= 20) MAIN.push([x, MAIN_Y(x)]);
const KIOSK = [150, MAIN_Y(150) - 34];
const BRIDGE = (() => { let b = CREEK[0]; for (const p of CREEK) if (Math.abs(p[1] - MAIN_Y(p[0])) < Math.abs(b[1] - MAIN_Y(b[0]))) b = p; return [b[0], MAIN_Y(b[0])]; })();
// Water taps: three in each loop, and one at the entrance station.
const TAPS = [...GEO.flatMap(g => g.taps), [KIOSK[0] - 34, KIOSK[1]]];

// The straight line: bearing 222 degrees. It comes ashore a little west of the delta, crosses Loop B and the corner
// of Loop A, and leaves across the south edge.
const DIR = [Math.sin(222 * RAD), -Math.cos(222 * RAD)];
const LANDING = (() => { const x0 = GEO[1].c[0] - 110, y0 = GEO[1].c[1]; let lo = -1500, hi = 0; for (let k = 0; k < 60; k++) { const t = (lo + hi) / 2, x = x0 + DIR[0] * t, y = y0 + DIR[1] * t; if (y > shoreY(x)) hi = t; else lo = t; } return [x0 + DIR[0] * lo, y0 + DIR[1] * lo]; })();
const onLine = d => [LANDING[0] + DIR[0] * d, LANDING[1] + DIR[1] * d];     // d: feet on from the water's edge
const STRIDE = 40, PRINT = 6;

// Which sites the line goes through, and which are booked: 66 of the 80. The 14 that are free are picked once,
// from a random source of this picture's own, and kept off the line so that every site it crosses has a tent to lose.
const lineDist = p => { const dx = p[0] - LANDING[0], dy = p[1] - LANDING[1]; return { along: dx * DIR[0] + dy * DIR[1], off: Math.abs(dx * DIR[1] - dy * DIR[0]) }; };
SITES.forEach(st => { const d = lineDist(st.pad); st.onLine = d.along > 0 && d.off < 22; });
{ const rnd = L.source(5309), free = new Set();
  while (free.size < 14) { const k = Math.floor(rnd() * 80); if (!SITES[k].onLine && ![...free].some(j => Math.abs(j - k) < 2)) free.add(k); }
  SITES.forEach((st, k) => { st.booked = !free.has(k); }); }
// The one marked again at stage 6: the last site on the line before it leaves the campground.
const MARKED = SITES.filter(st => st.onLine).sort((a, b) => lineDist(b.pad).along - lineDist(a.pad).along)[0];

// ---------------------------------------------------------------------------------------------------------------
// Drawing. c: the layout. c.pj turns feet into the layout's units, c.k is units to the foot, and c.rot is true for
// the phone, where north is to the left.
// a tent: the map's campground pictogram, door and all, while someone is in it; once they are gone, its outline
const camp = 'M-5,4.4 L0,-4.6 L5,4.4 H1.9 L0,0.6 L-1.9,4.4Z', left = 'M-4.6,4 L0,-4.2 L4.6,4Z';
const PIC = {
  tap: '<path d="M0,-4.9 C1.6,-2.4 3.7,-0.4 3.7,1.6 A3.7,3.7 0 0 1 -3.7,1.6 C-3.7,-0.4 -1.6,-2.4 0,-4.9Z"/>',
  restroom: '<circle cx="-2.5" cy="-3.3" r="1.35"/><circle cx="2.5" cy="-3.3" r="1.35"/><path d="M-4.3,-1.3 H-0.7 V1.6 H-1.4 V4.8 H-3.6 V1.6 H-4.3Z M2.5,-1.4 L4.8,2.4 H3.6 V4.8 H1.4 V2.4 H0.2Z"/>',
  gate: '<path d="M-4.6,4.6 V-1.4 H4.6 V4.6 H2.4 V1 H-2.4 V4.6Z M-5.4,-1.4 L0,-4.8 L5.4,-1.4Z"/>',
};
const tile = (x, y, d, s = 1) => `<g transform="translate(${f(x)},${f(y)})${s !== 1 ? ` scale(${s})` : ''}"><rect x="-7.4" y="-7.4" width="14.8" height="14.8" rx="2.6" fill="${PAPER}"/><rect x="-6.3" y="-6.3" width="12.6" height="12.6" rx="2" fill="${INK}"/><g fill="${PAPER}">${d}</g></g>`;
const dot = (p, r) => `M${f(p[0] - r)},${f(p[1])}a${f(r)},${f(r)} 0 1 0 ${f(2 * r)},0a${f(r)},${f(r)} 0 1 0 ${f(-2 * r)},0`;

// the symbols one layout draws its sites and tents with, stored once
function symbols(c){
  const k = c.k, pw = 19 * k, ph = 19 * k, pd = PAD_D * k, side = 16.5 * k, ids = { pad: L.nid('sp'), tf: L.nid('sp'), to: L.nid('sp') }, ts = c.tent;
  // a pad for the tent at the end of the drive, a fire ring on one side of it and a bear locker on the other
  L.defs.push(`<g id="${ids.pad}"><rect x="${f(-pw / 2)}" y="${f(pd - ph / 2)}" width="${f(pw)}" height="${f(ph)}" rx="${f(2.4 * k)}" fill="${ROAD}" stroke="${INK}" stroke-width="0.8"/><circle cx="${f(-side)}" cy="${f(pd)}" r="${f(c.ring)}" fill="${ROAD}" stroke="${INK}" stroke-width="0.9"/><rect x="${f(side - c.locker / 2)}" y="${f(pd - c.locker / 2)}" width="${f(c.locker)}" height="${f(c.locker)}" fill="${INK}"/></g>`);
  L.defs.push(`<path id="${ids.tf}" d="${camp}" transform="scale(${ts})" fill="${INK}"/><path id="${ids.to}" d="${left}" transform="scale(${ts})" fill="${ROAD}" stroke="${INK}" stroke-width="${f(1.15 / ts)}" stroke-linejoin="round"/>`);
  return { ...ids, pw, ph, pd };
}

function drawPlan(c, S){
  const { pj, k, rot, box } = c, [BX, BY, BW, BH] = box, o = [];
  const P = p => pj(p), path = pts => 'M' + pts.map(p => { const [x, y] = P(p); return `${f(x)},${f(y)}`; }).join(' L');
  // a smooth line through points. r: how coordinates are rounded (whole units are plenty for the ground)
  const curve = (pts, closed, r = f) => { const q = pts.map(P); if (closed) q.push(q[0], q[1]); let d = `M${r(closed ? (q[0][0] + q[1][0]) / 2 : q[0][0])},${r(closed ? (q[0][1] + q[1][1]) / 2 : q[0][1])}`; for (let i = 1; i < q.length - 1; i++) d += `Q${r(q[i][0])},${r(q[i][1])} ${r((q[i][0] + q[i + 1][0]) / 2)},${r((q[i][1] + q[i + 1][1]) / 2)}`; if (!closed) { const e = q[q.length - 1]; d += `L${r(e[0])},${r(e[1])}`; } return d; };
  const ground = (pts, closed) => curve(pts, closed, Math.round);
  const vec = ([x, y]) => rot ? [y, -x] : [x, y];                      // a direction in feet, turned as the layout is
  const ang = v => { const [x, y] = vec(v); return Math.atan2(y, x) / RAD; };
  const upright = a => { a = ((a + 540) % 360) - 180; return a > 90 ? a - 180 : a < -90 ? a + 180 : a; };
  const panel = clip(`M${BX},${BY} h${BW} v${BH} h${-BW}Z`), far = 3000;

  // ---- the ground: paper, the trees as a tint back from the beach, and form lines for the rise from the shore
  const land = [];
  const treeEdge = SHORE.map(([x, y]) => [x, y + 40 + 14 * Math.sin(x / 61) + 8 * Math.sin(x / 23 + 1)]);
  land.push(`<path d="${ground(treeEdge)}${path([[far, treeEdge[treeEdge.length - 1][1]], [far, far], [-far, far], [-far, treeEdge[0][1]]]).replace('M', 'L')}Z" fill="${FOREST}"/>`);
  { let d = ''; for (const [off, amp] of [[150, 50], [320, 74], [500, 100], [700, 120]]) { const pts = []; for (let x = -1080; x <= 440; x += 40) { const y0 = shoreY(x) + off, cx = CREEK.reduce((b, p) => Math.abs(p[1] - y0) < Math.abs(b[1] - y0) ? p : b)[0]; pts.push([x, y0 + amp * Math.exp(-(((x - cx) / 80) ** 2)) + 12 * Math.sin(x / 110 + off)]); } d += ground(pts); }
    land.push(`<path d="${d}" fill="none" stroke="${BROWN}" stroke-width="0.7" opacity="0.45"/>`); }
  // ---- the lake, with two depth lines, and the creek
  land.push(`<path d="${path([[-far, SHORE[0][1]], ...SHORE, [far, SHORE[SHORE.length - 1][1]], [far, -far], [-far, -far]])}Z" fill="${WATER_FILL}"/><g fill="none" stroke="${WATER}" stroke-width="0.6" opacity="0.4"><path d="${ground(SHORE.map(([x, y]) => [x, y - 60 - 12 * Math.sin(x / 140)]))}${ground(SHORE.map(([x, y]) => [x, y - 140 + 16 * Math.sin(x / 170)]))}"/></g><path d="${curve(SHORE)}" fill="none" stroke="${WATER}" stroke-width="1.2"/>`);
  land.push(`<path d="${ground(CREEK)}" fill="none" stroke="${WATER}" stroke-width="1.5" stroke-linecap="round"/>`);

  // ---- roads: the main road, the loops, and a short drive into each site. Casings first, then the pale middles,
  // so that every junction runs together.
  const roads = L.nid('sp'), drives = L.nid('sp');
  L.defs.push(`<path id="${roads}" d="${curve(MAIN)} ${GEO.map(g => path(g.stem)).join(' ')} ${GEO.map(g => curve(g.ring.filter((_, i) => i % 10 === 0), true)).join(' ')}"/>`);
  L.defs.push(`<path id="${drives}" d="${SITES.map(st => path([st.p, [st.p[0] + st.n[0] * (PAD_D - 6), st.p[1] + st.n[1] * (PAD_D - 6)]])).join(' ')}"/>`);
  const rw = c.road;
  o.push(`<g fill="none" stroke-linecap="round" stroke-linejoin="round"><use href="#${drives}" stroke="${INK}" stroke-width="${rw[2]}"/><use href="#${roads}" stroke="${INK}" stroke-width="${rw[0]}"/><use href="#${drives}" stroke="${ROAD}" stroke-width="${rw[3]}"/><use href="#${roads}" stroke="${ROAD}" stroke-width="${rw[1]}"/></g>`);
  // the bridge where the main road crosses the creek
  { const side = s => path([[BRIDGE[0] - 18, MAIN_Y(BRIDGE[0] - 18) + s], [BRIDGE[0] + 18, MAIN_Y(BRIDGE[0] + 18) + s]]);
    o.push(`<path d="${side(14)} ${side(-14)}" stroke="${INK}" stroke-width="1.2" fill="none"/>`); }
  // stage 4 on: the entrance road barred, in the revision red the park map marks its closures in
  { const x = BRIDGE[0] - 46, a = P([x, MAIN_Y(x) - 20]), b = P([x, MAIN_Y(x) + 20]);
    o.push(from(4, `<path d="M${f(a[0])},${f(a[1])}L${f(b[0])},${f(b[1])}" stroke="${PAPER}" stroke-width="6" stroke-linecap="round"/><path d="M${f(a[0])},${f(a[1])}L${f(b[0])},${f(b[1])}" stroke="${RED_D}" stroke-width="3" stroke-linecap="round"/>`)); }

  // ---- the sites, each drawn once at its own turn
  o.push(SITES.map(st => { const [x, y] = P(st.p); return `<use href="#${S.pad}" transform="translate(${f(x)},${f(y)}) rotate(${f(ang(st.n) - 90)})"/>`; }).join(''));

  // ---- stage 5: the marks. They start at the water's edge and run on, forty feet apart, until they leave the
  // plan. Over the lake the line can only be inferred, and is broken, as on the park map.
  const marks = [];
  for (let d = 0; ; d += STRIDE) { const p = P(onLine(d)); if (p[0] < BX - 9 || p[0] > BX + BW + 9 || p[1] < BY - 9 || p[1] > BY + BH + 9) break; marks.push(p); }
  // Like the map's path, it is printed over a pale band, so it reads through everything it crosses.
  const r6 = PRINT / 2 * k, back = P(onLine(-far)), last = marks[marks.length - 1], wet = `M${f(back[0])},${f(back[1])}L${f(marks[0][0])},${f(marks[0][1])}`, all = `M${f(back[0])},${f(back[1])}L${f(last[0] + (last[0] - back[0]) * 0.1)},${f(last[1] + (last[1] - back[1]) * 0.1)}`;
  const rev = from(5, `<path d="${all}" stroke="${PAPER}" stroke-width="5.4" opacity="0.85" fill="none"/><path d="${wet}" stroke="${INK}" stroke-width="1.5" stroke-dasharray="4.2 3.2" fill="none"/><path d="${marks.map(p => dot(p, r6)).join('')}" fill="${INK}"/>`);

  // ---- point symbols: a restroom and water taps in each loop, and the entrance station with its own tap
  const sym = [];
  for (const g of GEO) sym.push(tile(...P(g.restroom), PIC.restroom, c.tile));
  for (const t of TAPS) sym.push(tile(...P(t), PIC.tap, c.tile * 0.78));
  sym.push(tile(...P(KIOSK), PIC.gate, c.tile));

  // ---- tents. Filled while the site is booked; in outline from stage 4, when the sites are empty and the tents
  // are still there. From stage 5 the sites on the line have none.
  const tentAt = (st, id) => { const [x, y] = P(st.pad); return `<use href="#${id}" x="${f(x)}" y="${f(y)}"/>`; };
  const booked = SITES.filter(st => st.booked);
  const tents = until(3, booked.map(st => tentAt(st, S.tf)).join('')) + from(4, booked.filter(st => !st.onLine).map(st => tentAt(st, S.to)).join('')) + between(4, 4, booked.filter(st => st.onLine).map(st => tentAt(st, S.to)).join(''));

  // ---- the site numbers, upright, set off the far end of each pad
  // (hw and hh are half the size of the number, so it stands clear of the pad whichever way the site faces)
  const nums = SITES.map(st => { const [nx, ny] = vec(st.n), [px, py] = P(st.pad), hw = c.num * 0.29 * String(st.no).length + 1, hh = c.num * 0.36 + 0.8, out = S.ph / 2 + 1.4 + Math.abs(nx) * hw + Math.abs(ny) * hh, x = px + nx * out, y = py + ny * out;
    return `<text x="${f(x)}" y="${f(y + c.num * 0.36)}">${st.no}</text>`; }).join('');

  // ---- the stride, measured between two of the marks, and the site marked again at stage 6
  const lv = vec(DIR), ln = [-lv[1], lv[0]], off = c.measureSide * 9;
  const [ma, mb] = [P(onLine(c.measure * STRIDE)), P(onLine((c.measure + 1) * STRIDE))].map(p => [p[0] + ln[0] * off, p[1] + ln[1] * off]);
  const tick = p => `M${f(p[0] - ln[0] * 3.5)},${f(p[1] - ln[1] * 3.5)}l${f(ln[0] * 7)},${f(ln[1] * 7)}`;
  const lab = [(ma[0] + mb[0]) / 2 + ln[0] * c.measureSide * 7, (ma[1] + mb[1]) / 2 + ln[1] * c.measureSide * 7];
  const stride = from(SP.labels.stride.from, `<path d="M${f(ma[0])},${f(ma[1])}L${f(mb[0])},${f(mb[1])}${tick(ma)}${tick(mb)}" stroke="${INK}" stroke-width="1.2" fill="none"/>` + T(lab[0], lab[1] + c.small * 0.34, SP.labels.stride.text, { size: c.small, weight: 700, anchor: 'middle', rot: f(upright(Math.atan2(lv[1], lv[0]) / RAD)), halo: c.strideOn, cls: false }));
  // Its label is led off to open ground; on the phone, out past the edge of the plan into the margin.
  const [mx, my] = P(MARKED.pad), ml = c.mark, lead = ml.lead.map(([dx, dy]) => [mx + dx, my + dy]), end = lead[lead.length - 1];
  const marked = from(SP.labels.marked.from, `<circle cx="${f(mx)}" cy="${f(my)}" r="${ml.r + 2.6}" fill="none" stroke="${PAPER}" stroke-width="3" opacity="0.85"/><circle cx="${f(mx)}" cy="${f(my)}" r="${ml.r}" fill="none" stroke="${RED_D}" stroke-width="2"/>` + tentAt(MARKED, S.tf));
  const markedLabel = from(SP.labels.marked.from, `<path d="${lead.map((p, i) => `${i ? 'L' : 'M'}${f(p[0])},${f(p[1])}`).join('')}" stroke="${PAPER}" stroke-width="3.4" opacity="0.85" fill="none" stroke-linejoin="round"/><path d="${lead.map((p, i) => `${i ? 'L' : 'M'}${f(p[0])},${f(p[1])}`).join('')}" stroke="${RED_D}" stroke-width="1.3" fill="none" stroke-linejoin="round"/>`
    + lines2(end[0] + ml.text[0], end[1] + ml.text[1], c.small + 4, SP.labels.marked.text, { size: c.small + 0.5, weight: 700, fill: RED_D, anchor: ml.anchor, halo: ml.on, cls: false }, ml.max));

  // ---- lettering on the ground
  const txt = [];
  txt.push(`<g font-family="'Source Sans 3', sans-serif" font-size="${c.num}" font-weight="700" fill="${INK}" text-anchor="middle" stroke="${FOREST}" stroke-width="2.6" stroke-linejoin="round" paint-order="stroke">${nums}</g>`);
  GEO.forEach((g, i) => { const [x, y] = P(rot ? g.centre : g.near); txt.push(T(x, y + c.small * 0.34, SP.labels.loops[i], { size: c.small, weight: 700, anchor: 'middle', halo: FOREST, cls: false })); });
  { const [x, y] = P(KIOSK); txt.push(T(x + c.entrance[0], y + c.entrance[1], SP.labels.entrance, { size: c.small, weight: 700, anchor: c.entrance[2], halo: FOREST, cls: false })); }
  // on the water: the lake's name, and which way the lodge is (on a bearing of 042, back along the line)
  { const lk = c.lake, [x, y] = P(lk.name), a = upright(ang([1, -0.07]));
    txt.push(T(x, y, SP.labels.lake, { font: 'serif', size: lk.size, fill: WATER, italic: true, ls: 4, rot: f(a), anchor: 'middle', cls: false }));
    const t0 = lk.lodge, t1 = [t0[0] - DIR[0] * 110, t0[1] - DIR[1] * 110], [ax, ay] = P(t0), [bx, by] = P(t1), hv = vec([-DIR[0], -DIR[1]]), ha = Math.atan2(hv[1], hv[0]) / RAD;
    txt.push(`<path d="M${f(ax)},${f(ay)}L${f(bx)},${f(by)}" stroke="${INK}" stroke-width="1.3" fill="none"/><path d="M-6,-4 L3,0 L-6,4Z" transform="translate(${f(bx)},${f(by)}) rotate(${f(ha)})" fill="${INK}"/>`);
    const [lx, ly] = P(lk.lodgeText);
    txt.push(T(lx, ly, SP.labels.lodge, { size: c.small, weight: 700, anchor: lk.anchor, rot: lk.rot, halo: WATER_FILL, cls: false })); }

  o.unshift(`<g clip-path="url(#${panel})"><rect x="${BX}" y="${BY}" width="${BW}" height="${BH}" fill="${PAPER}"/>${land.join('')}`);
  o.push(rev, tents, sym.join(''), stride, txt.join(''), marked, '</g>');
  o.push(`<rect x="${BX}" y="${BY}" width="${BW}" height="${BH}" fill="none" stroke="${INK}" stroke-width="1.3"/>`, markedLabel);
  return o.join('\n');
}

// ---------------------------------------------------------------------------------------------------------------
// The legend, the notes, and the scale bar and north arrow: in a column beside the plan on the wide layout, and
// under it on the phone.
function drawKey(c, S){
  const o = [], k = c.k, sw = 34, K = c.key;
  const swatch = {
    site: `<use href="#${S.pad}" transform="translate(0,${f(-S.pd)})"/>`,
    booked: `<use href="#${S.pad}" transform="translate(0,${f(-S.pd)})"/>` + until(3, `<use href="#${S.tf}" x="0" y="0"/>`) + from(4, `<use href="#${S.to}" x="0" y="0"/>`),
    fire: `<circle r="${f(c.ring)}" fill="${ROAD}" stroke="${INK}" stroke-width="0.9"/>`,
    locker: `<rect x="${f(-c.locker / 2)}" y="${f(-c.locker / 2)}" width="${f(c.locker)}" height="${f(c.locker)}" fill="${INK}"/>`,
    tap: tile(0, 0, PIC.tap, c.tile * 0.78),
    restroom: tile(0, 0, PIC.restroom, c.tile),
    marks: `<path d="${[-1, 0, 1].map(i => dot([i * STRIDE * k, 0], PRINT / 2 * k + 1.5)).join('')}" fill="${PAPER}"/><path d="${[-1, 0, 1].map(i => dot([i * STRIDE * k, 0], PRINT / 2 * k)).join('')}" fill="${INK}"/>`,
  };
  SP.legend.forEach((e, i) => {
    const [x, y] = K.at(i), [tb, ta] = pair(e.text);
    const row = `<g transform="translate(${f(x + sw / 2)},${f(y)})">${swatch[e.key]}</g>` + T(x + sw + 8, y + K.size * 0.35, tb, { size: K.size, alts: ta });
    o.push(e.from ? from(e.from, row) : row);
  });
  // the notes
  const N = c.notes;
  SP.notes.forEach((n, i) => { const [tb, ta] = pair(n); o.push(lines2(N.at[0], N.at[1] + i * N.pitch, N.lh, tb, { size: N.size, alts: ta }, N.max)); });
  // the scale bar, in fifty-foot steps, and the north arrow
  { const [sx, sy] = c.scale, step = 50 * k; let bar = '';
    for (let i = 0; i < 4; i++) bar += `<rect x="${f(sx + i * step)}" y="${sy}" width="${f(step)}" height="4.6" fill="${i % 2 ? PAPER : INK}" stroke="${INK}" stroke-width="0.9"/>`;
    o.push(bar + T(sx, sy - 5, PLACEHOLDER.scale[0], { size: 12, anchor: 'middle', cls: false }) + T(sx + 2 * step, sy - 5, PLACEHOLDER.scale[1], { size: 12, anchor: 'middle', cls: false }) + T(sx + 4 * step - 10, sy - 5, PLACEHOLDER.scale[2], { size: 12, cls: false }));
    const [nx, ny] = c.north;
    o.push(`<path d="M0,-13 L4.6,8 L0,4.2 L-4.6,8Z" transform="translate(${nx},${ny}) rotate(${c.rot ? -90 : 0})" fill="${INK}"/>` + T(nx + (c.rot ? -21 : 0), ny + (c.rot ? 4.6 : -17), SP.labels.north, { size: 13, weight: 700, anchor: 'middle', cls: false }));
  }
  return o.join('\n');
}

function drawSheet(c, seed){
  const { W, H, m } = c, o = [sheet(W, H)], S = symbols(c);
  const [tb, ta] = pair(SP.title);
  o.push(T(m, c.titleY, tb, { font: 'serif', size: c.title, alts: ta }));
  o.push(T(m, c.titleY + c.subDy, SP.sub, { size: c.body, fill: INK2 }));
  o.push(rule(m, c.ruleY, W - m, c.ruleY));
  o.push(drawPlan(c, S));
  o.push(drawKey(c, S));
  o.push(tooth(W, H, seed, 0.7));
  return o.join('\n');
}

export function sitePlan(){
  L.usePalette('gold'); L.begin();
  const base = { ring: 1.9, locker: 2.8, tile: 0.84, measure: 1, measureSide: 1, strideOn: FOREST };
  // wide: the plan in a panel on the left, the key in a column on the right
  const kw = 0.5, cw = [-994, -200];
  const wide = drawSheet({ ...base, W: 900, H: 560, m: 28, title: 26, titleY: 50, subDy: 24, body: 15, ruleY: 88, small: 12.5, num: 10, tent: 0.72, road: [5, 3, 2.8, 1.2],
    k: kw, rot: false, box: [28, 100, 646, 432], pj: ([x, y]) => [28 + (x - cw[0]) * kw, 100 + (y - cw[1]) * kw],
    entrance: [12, 4.4, 'start'],
    mark: { r: 10.5, lead: [[7, 7], [30, 44]], text: [5, 6], anchor: 'start', on: FOREST, max: 30 },
    lake: { name: [-800, -146], size: 20, lodge: [-344, -92], lodgeText: [-358, -84], anchor: 'end', rot: 0 },
    key: { size: 13.5, at: i => [694, 122 + i * 26] }, notes: { size: 13, at: [694, 334], lh: 17, pitch: 44, max: 27 }, scale: [700, 514], north: [858, 512] }, 9400);
  // phone: the plan turned a quarter turn, north to the left, with the key underneath
  const kp = 0.42, cp = [300, -176];
  const tall = drawSheet({ ...base, W: 360, H: 868, m: 18, title: 20, titleY: 44, subDy: 23, body: 14.5, ruleY: 82, small: 12, num: 9.6, tent: 0.64, road: [4.6, 2.8, 2.6, 1.1],
    k: kp, rot: true, box: [18, 94, 324, 548], pj: ([x, y]) => [18 + (y - cp[1]) * kp, 94 + (cp[0] - x) * kp],
    entrance: [-13, 4.4, 'end'],
    mark: { r: 10, lead: [[8, 6], [34, 22], [34, 140]], text: [8, 15], anchor: 'end', on: PAPER, max: 28 },
    lake: { name: [-850, -64], size: 17, lodge: [-336, -78], lodgeText: [-570, -84], anchor: 'middle', rot: -90 },
    key: { size: 13, at: i => [18 + (i > 3 ? 168 : 0), 710 + (i % 4) * 24] }, notes: { size: 13.5, at: [18, 820], lh: 18, pitch: 26, max: 48 }, scale: [24, 670], north: [178, 668] }, 9410);
  return twoLayouts(wide, tall, [900, 560], [360, 868]);
}
