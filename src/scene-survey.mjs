// Sam's bark survey sheet, on the Cathedral Stand page. Two things on one sheet of paper.
//
// The first is printed: the trail crew's plan of the boardwalk loop, seen from above, on the same paper and in the same
// ink, symbols and lettering as the park map and the cards. Lakeshore Rd along the bottom, the trailhead and parking off
// it, the boardwalk going straight in under the trees and making one loop, the dirt trail that leaves it to climb to
// the upper loop and comes back down across Cathedral Creek, the numbered posts, and the big trees drawn as circles,
// their trunks seen from above. Five are numbered to match the posts and named in a key beside the plan; the legend
// names the boardwalk and the dirt trail. North is up, as on the park map, and the stand lies the way trail 2 does
// there: parking at the bottom off the road, the creek down the east side. Below the road the sheet is plain paper, and
// at its foot there are faint printed rules for field notes. At stage 0 that is all there is.
//
// The second is Sam's pencil, on top of it. He is the trail crew lead, and from late August he has gone round every
// Monday ringing the trees with bark torn off forty feet up. Pencil is graphite, not ink: a soft grey whose lines
// swell and thin with the pressure of the hand and break up over the tooth of the paper. Each ring is one quick loop
// that overshoots where it started. His words are set in the site's handwriting, the italic serif of the note on the
// memo and of the pen note on the lake depth diagram. His notes go where there is room: the paper below the road, and
// the rules at the foot of the sheet.
//
// By stage (the stages come from the copy, see below):
//   2  a few rings, nearly all on the west side of the stand. "bark off, 40 ft, wind?" with an arrow to one of them,
//      "same height, all of them", and a tally of Mondays in the margin.
//   3  many more rings, and the ringed trees stand in four straight rows across the loop on a bearing of 042 and 222,
//      the bearing of the line on the park map. "wind?" is struck through with one stroke. A note at the big fir. In
//      the corner, a sketch to scale: a trunk with a tick forty feet up, and Sam beside it, six feet tall.
//   4  every standing tree on the plan is ringed, in a hurry. The nurse log is not: it is lying down. The tally has a
//      line for Monday the 16th with nothing beside it.
//   5  the note beside the sketch says what forty feet is. Nothing is added to the sketch.
// It is never drawn. The sketch has the trunk, the tick and the man, and nothing else, at any stage.
//
// Every word on the sheet is the copy's own (trailCathedral.diagram in src/content/trail-cathedral.mjs), with its stage
// versions, set on more than one line where the room needs it but never reworded.
import * as L from './lib.mjs';
import { T, twoLayouts, sheet, tooth, rule, PAPER, INK, INK2, BROWN } from './infokit.mjs';
import { trailCathedral } from './content/trail-cathedral.mjs';
const { f, mix, lerp, from, clip, grain, GL } = L;

const D = trailCathedral.diagram, LB = D.labels;
const word = v => Array.isArray(v) ? v[0] : v, altsOf = v => Array.isArray(v) ? v[1] : undefined;
const firstAt = v => Math.min(...Object.keys(altsOf(v)).map(Number));
// Every pencil mark takes its stage from the copy. The three Mondays' worth of rings follow it too: the first rings
// come with the first note, the rows with the word struck out, and every tree with the empty line for the 16th.
const FIRST = firstAt(LB.ring), ROWS = D.struck.ring.from, ALL = Math.max(...D.tally.map(r => r.from));

// Graphite is the printing ink thinned by the paper showing through it. The forest tint is the map's.
const PENCIL = mix(INK, PAPER, 0.2), WHITE = mix(PAPER, '#FFFFFF', 0.55);
const TINT = mix(L.PAL.gold.tealLight, PAPER, 0.8), WATER = L.PAL.gold.teal, RED = L.PAL.gold.coral, CLEAR = mix(PAPER, '#FFFFFF', 0.3);

// ---------- the stand, in feet: x east and y south from the top left corner of the plan ----------
const PW = 1064, PH = 1024;
const TAU = Math.PI * 2;
// a smooth line through control points, open or closed, as points about `step` feet apart
function spline(pts, closed = false, step = 6){
  const n = pts.length, out = [], at = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2), m = Math.max(1, Math.round(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
    for (let k = 0; k < m; k++) { const t = k / m, t2 = t * t, t3 = t2 * t; out.push([0, 1].map(c => 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3))); }
  }
  out.push(closed ? out[0].slice() : pts[n - 1].slice());
  return out;
}
const distTo = (p, line) => { let b = 1e9; for (let i = 1; i < line.length; i++) { const [ax, ay] = line[i - 1], vx = line[i][0] - ax, vy = line[i][1] - ay, t = Math.max(0, Math.min(1, ((p[0] - ax) * vx + (p[1] - ay) * vy) / (vx * vx + vy * vy || 1))); b = Math.min(b, Math.hypot(p[0] - ax - vx * t, p[1] - ay - vy * t)); } return b; };
const nearestOn = (p, line) => { let b = 1e9, q = line[0]; for (const r of line) { const d = Math.hypot(p[0] - r[0], p[1] - r[1]); if (d < b) { b = d; q = r; } } return q; };

// Lakeshore Rd, rising a little to the east as it does on the park map, and the drive up to the lot. Below the road
// the sheet is left as plain paper.
const roadY = x => 846 - x * 0.047, ROAD_W = 22;
const LOT = { x: 412, y: 662, w: 186, h: 84 }, DRIVE_X = 505;
// the boardwalk: straight in from the lot, then one loop, walked clockwise past posts 1 to 5
const JUNCTION = [505, 522];
const STEM = [[505, LOT.y], JUNCTION];
const LOOP = spline([JUNCTION, [392, 514], [298, 466], [248, 376], [258, 282], [312, 212], [416, 168], [544, 158], [662, 186], [738, 258], [762, 358], [730, 446], [640, 504]], true, 8);
// the dirt trail: up from the north-west of the loop and off the top of the plan, and back down from the north-east
// across the creek to the boardwalk
const UP = spline([nearestOn([312, 212], LOOP), [300, 150], [322, 92], [296, 40], [306, -20]], false, 8);
const DOWN = spline([[948, -20], [920, 30], [860, 66], [792, 104], [736, 150], nearestOn([700, 214], LOOP)], false, 8);
// Cathedral Creek, down the east side of the stand and under the road
const CREEK = spline([[842, -20], [828, 50], [806, 110], [820, 190], [860, 260], [872, 350], [850, 450], [866, 560], [848, 680], [858, 800], [850, 1140]], false, 9);
const BRIDGE = (() => { let b = [1e9]; for (const p of DOWN) { const d = distTo(p, CREEK); if (d < b[0]) b = [d, p]; } return b[1]; })();

// ---------- the trees ----------
// The rows lie on the bearing of the line on the park map, 042 one way and 222 the other. NE is along them, SE across.
const NE = [0.669, -0.743], SE = [0.743, 0.669], MID = [520, 360];
// The five named trees, in the order of the posts. The fir stands on a row; it is ringed with the rows.
const FIR = [404, 578];
const NAMED = [
  { at: FIR, r: 19, kind: 'fir' },
  { at: [192, 316], r: 16, kind: 'cedar' },
  { at: [470, 108], r: 11, kind: 'twins' },
  { at: [800, 226], r: 15, kind: 'hollow' },
  { at: [646, 400], r: 6, kind: 'log' },
];
const across = p => (p[0] - MID[0]) * SE[0] + (p[1] - MID[1]) * SE[1];
const ROW_D = [1, 0, -1, -2].map(i => across(FIR) + 170 * i);
// ground kept clear of trees under the trailhead's label and the creek's, in both layouts
const OPEN = [[598, 656, 900, 760], [856, 330, 946, 600]];
function stand(){
  const r = L.source(4270), trees = [];
  const forest = p => p[0] > 16 && p[0] < PW - 16 && p[1] > 16 && p[1] < roadY(p[0]) - ROAD_W / 2 - 22 && !(p[0] > LOT.x - 34 && p[0] < LOT.x + LOT.w + 34 && p[1] > LOT.y - 34);
  const clear = (p, rad) => forest(p) && distTo(p, LOOP) > 28 + rad && distTo(p, STEM) > 26 + rad && distTo(p, UP) > 18 + rad && distTo(p, DOWN) > 18 + rad && distTo(p, CREEK) > 22 + rad
    && !OPEN.some(([a, b, c, d]) => p[0] > a - rad && p[0] < c + rad && p[1] > b - rad && p[1] < d + rad);
  const roomy = (p, rad, gap) => trees.every(t => Math.hypot(t.at[0] - p[0], t.at[1] - p[1]) > t.r + rad + gap);
  NAMED.forEach((t, i) => trees.push({ ...t, post: i + 1, row: t.kind === 'fir' ? 1 : -1 }));
  // the rows: trees along four straight lines, set a little off them and at uneven gaps, so that on the printed plan
  // they read as nothing more than the stand
  ROW_D.forEach((d, row) => { for (let s = -760 + r(0, 30); s < 760; s += r(44, 70)) {
    const off = r(-5.5, 5.5), p = [MID[0] + SE[0] * (d + off) + NE[0] * s, MID[1] + SE[1] * (d + off) + NE[1] * s], rad = r(7, 12.5);
    if (clear(p, rad) && roomy(p, rad, 14)) trees.push({ at: p, r: rad, row });
  } });
  // and the rest of the big trees, kept off the rows so that the rows are only ever the trees Sam rings
  for (let k = 0, n = 0; k < 6000 && n < 17; k++) {
    const p = [r(20, PW - 20), r(20, PH - 20)], rad = r(8, 15);
    if (!clear(p, rad) || !roomy(p, rad, 40) || ROW_D.some(d => Math.abs(across(p) - d) < 46)) continue;
    trees.push({ at: p, r: rad, row: -1 }); n++;
  }
  // which Monday each was first found marked: a few on the west side first (and one on the far side), then the rest
  // of the rows, then everything standing
  const west = trees.filter(t => t.row >= 0 && t.kind !== 'fir').sort((a, b) => a.at[0] - b.at[0]);
  for (const t of trees) t.when = t.kind === 'log' ? 0 : t.row >= 0 ? ROWS : ALL;
  west.slice(0, 6).forEach(t => { t.when = FIRST; });
  west[west.length - 3].when = FIRST;
  return trees;
}
const TREES = stand();

// ---------- pencil ----------
// A pencil line is a ribbon along its path whose width follows the pressure of the hand: w(t) for t from 0 at the
// start to 1 at the end. It is written as one filled outline, in steps from the point before.
function ribbon(pts, w){
  const n = pts.length, A = [], B = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, h = Math.max(0.15, w(i / (n - 1)) / 2);
    A.push([pts[i][0] - dy / d * h, pts[i][1] + dx / d * h]); B.push([pts[i][0] + dy / d * h, pts[i][1] - dx / d * h]);
  }
  const all = [...A, ...B.reverse()];
  let px = f(all[0][0]), py = f(all[0][1]), out = `M${px},${py}l`;
  for (const [x, y] of all.slice(1)) { const qx = f(x), qy = f(y); out += `${f(qx - px)},${f(qy - py)} `; px = qx; py = qy; }
  return out.trim().replace(/ -/g, '-') + 'Z';
}
// pressure: thin where the point touches down and lifts off, and never quite even between
const pressure = (r, wmax, inn = 0.12, out = 0.24) => { const ph = r(0, TAU), q = r(4, 10); return t => wmax * Math.pow(Math.min(1, t / inn), 0.55) * Math.pow(Math.min(1, (1 - t) / out), 0.75) * (0.72 + 0.28 * Math.sin(t * q + ph)); };
// A ring round a tree, drawn in one go. The point comes down a little outside the circle and hooks in, goes round
// once and a bit, oval and lopsided, and drifts outward as it goes, so the end passes the start and lifts off wide of
// it. haste: 0 for a ring drawn with some care, 1 for one dashed off, which goes further round, comes out flatter or
// rounder, and is pressed harder.
function ring(cx, cy, rad, r, haste = 0){
  const a0 = r(0, TAU), sweep = TAU * (1.04 + r(0, 0.2) + haste * r(0, 0.5)), ex = 1 + r(-0.16, 0.16) * (1 + haste * 0.7), rot = r(0, Math.PI);
  const p1 = r(0, TAU), p2 = r(0, TAU), k1 = r(0.05, 0.11) * (1 + haste * 0.6), hook = r(0.12, 0.3), drift = r(0.14, 0.26) * (1 + haste * 0.5) * rad, n = Math.ceil(sweep * rad / 2.4);
  const pts = [];
  for (let i = 0; i <= n; i++) { const t = i / n, a = a0 - sweep * t, rr = rad * (1 + k1 * Math.cos(a + p1) + 0.05 * Math.sin(2 * a + p2) + hook * Math.max(0, 1 - t / 0.09) ** 2) + drift * Math.max(0, t - 0.55), x = Math.cos(a) * rr * ex, y = Math.sin(a) * rr / ex; pts.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]); }
  return ribbon(pts, pressure(r, 1.9 + 0.6 * haste + r(-0.25, 0.3), 0.06, 0.2));
}
// a stroke along a gentle curve from a to b, bowed by `bend` (a share of its length, to the left of the way it goes)
function stroke(a, b, r, { bend = 0, w = 1.5, n = 0, inn, out } = {}){
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]), cx = (a[0] + b[0]) / 2 - (b[1] - a[1]) * bend, cy = (a[1] + b[1]) / 2 + (b[0] - a[0]) * bend, m = n || Math.max(4, Math.ceil(len / 5)), pts = [];
  for (let i = 0; i <= m; i++) { const t = i / m, u = 1 - t, j = i && i < m ? 0.18 : 0; pts.push([u * u * a[0] + 2 * u * t * cx + t * t * b[0] + r(-j, j), u * u * a[1] + 2 * u * t * cy + t * t * b[1] + r(-j, j)]); }
  return { d: ribbon(pts, pressure(r, w, inn ?? 0.08, out ?? 0.3)), pts };
}
// an arrow from a note to a tree: one stroke, and the head as two flicks of the pencil back from its point
function arrow(a, b, r, bend = 0.18, gap = 3){
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]), e = [b[0] - (b[0] - a[0]) / len * gap, b[1] - (b[1] - a[1]) / len * gap], s = stroke(a, e, r, { bend, w: 1.9 });
  const [p, , q] = s.pts.slice(-3), ang = Math.atan2(q[1] - p[1], q[0] - p[0]), flick = da => { const t = ang + Math.PI + da, l = r(8, 10.5); return stroke(e, [e[0] + Math.cos(t) * l, e[1] + Math.sin(t) * l], r, { w: 1.9, n: 5, inn: 0.02, out: 0.5 }).d; };
  return s.d + flick(0.55 + r(-0.08, 0.08)) + flick(-0.5 + r(-0.08, 0.08));
}
// Pencil marks for one Monday: stored once, drawn in graphite, and stippled with the paper's colour so that they break
// up the way pencil does over the tooth of the paper. The stipple sits in the same staged group, so nothing of it
// shows before the marks do. Each Monday's pencil is a little darker than the last: pressed harder, and fresher.
function graphite(d, box, seed, tone){
  const id = L.shared(d), cp = L.nid('cu'); L.defs.push(`<clipPath id="${cp}"><use href="#${id}"/></clipPath>`);
  return `<use href="#${id}" fill="${PENCIL}" opacity="${tone}"/>` + grain(box[0], box[1], box[2], box[3], GL(box[0], box[1], box[0], box[1] + box[3], [[0, 0.1], [1, 0.08]]), PAPER, { clipId: cp, seed });
}
// Sam's handwriting: the italic serif of the note on the staff memo, at the memo's weight, in graphite. It is set apart
// from the printed lettering, which hardens stage by stage with the page's type: this is his hand, and it does not.
// fit: the width the word is held to, where a stroke has to run through it.
const HAND_W = 500, esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
function script(x, y, s, o = {}){
  const { size = 16, rot = 0, alts, fit, anchor } = o;
  return `<text${alts ? ' class="t"' : ''} x="${f(x)}" y="${f(y)}"${anchor ? ` text-anchor="${anchor}"` : ''} font-family="Fraunces, serif" font-style="italic" font-weight="${HAND_W}" style="font-variation-settings:'SOFT' 100,'opsz' ${Math.round(size * 1.4)}" font-size="${size}" fill="${PENCIL}"`
    + (fit ? ` textLength="${f(fit)}" lengthAdjust="spacingAndGlyphs"` : '') + (rot ? ` transform="rotate(${rot} ${f(x)} ${f(y)})"` : '') + (alts ? Object.entries(alts).map(([k, v]) => ` data-s${k}="${esc(v)}"`).join('') : '') + `>${esc(s)}</text>`;
}

// ---------- lettering ----------
// Staged copy set on as many lines as its longest version needs: each line carries its own wording for every stage.
function block(x, y, lh, v, split, o = {}, put = T){
  const vs = [['0', word(v)], ...Object.entries(altsOf(v) || {})].map(([s, t]) => [s, t ? split(t) : []]), n = Math.max(...vs.map(([, ls]) => ls.length));
  let out = '';
  for (let i = 0; i < n; i++) { const alts = {}; for (const [s, ls] of vs.slice(1)) alts[s] = ls[i] || ''; out += put(x, y + i * lh, vs[0][1][i] || '', { ...o, alts: vs.length > 1 ? alts : undefined }); }
  return out;
}
const wrap = max => s => { const out = []; let ln = ''; for (const w of s.split(' ')) { if (ln && ln.length + 1 + w.length > max) { out.push(ln); ln = w; } else ln = ln ? ln + ' ' + w : w; } if (ln) out.push(ln); return out; };
// A tree's name in the key, set in two parts: the name, broken where its own punctuation breaks it, and the rest.
const nameParts = s => { const i = s.indexOf('. '), j = s.indexOf(', '), k = i > 0 ? i + 1 : j + 1; return [s.slice(0, k), s.slice(k + 1)]; };

// ---------- the sheet ----------
function draw(c, seed){
  const { W, H, m, k } = c, RX = W - m, o = [sheet(W, H)];
  const X = x => c.px + x * k, Y = y => c.py + y * k, P = ([x, y]) => [X(x), Y(y)], tk = c.tk;
  const pline = pts => 'M' + pts.map(p => `${f(X(p[0]))},${f(Y(p[1]))}`).join(' L');
  const PX1 = X(PW), PY1 = Y(c.ph), box = clip(`M${c.px},${c.py} H${f(PX1)} V${f(PY1)} H${c.px}Z`);

  // ---- the head of the sheet
  if (c.wide) o.push(T(m, c.titleY, D.title, { font: 'serif', size: c.title, cls: false }) + T(RX, c.titleY - 2, LB.sub, { anchor: 'end', size: c.small, fill: INK2, cls: false }));
  else o.push(wrap(c.titleMax)(D.title).map((s, i) => T(m, c.titleY + i * c.titleLh, s, { font: 'serif', size: c.title, cls: false })).join('') + T(m, c.subY, LB.sub, { size: c.small, fill: INK2, cls: false }));
  o.push(rule(m, c.ruleY, RX, c.ruleY));

  // ---- the plan. The ground is the map's forest tint, cleared round the lot; below the road it is plain paper.
  const g = [];
  g.push(`<rect x="${c.px}" y="${c.py}" width="${f(PX1 - c.px)}" height="${f(PY1 - c.py)}" fill="${TINT}"/>`);
  g.push(`<path d="M${c.px},${f(Y(roadY(0)))} L${f(PX1)},${f(Y(roadY(PW)))} V${f(PY1)} H${c.px}Z" fill="${PAPER}"/>`);
  g.push(`<rect x="${f(X(LOT.x - 26))}" y="${f(Y(LOT.y - 26))}" width="${f((LOT.w + 52) * k)}" height="${f(220 * k)}" rx="${f(30 * k)}" fill="${CLEAR}"/>`);
  // the ground rising toward the upper loop: faint contours across the top of the plan, bending upstream at the creek.
  // The boardwalk is flat, so none of them reach it.
  { let d = ''; const cr = L.source(31);
    for (const y0 of [12, 42, 76, 112]) { const ph = cr(0, TAU), pts = []; for (let x = -10; x <= PW + 10; x += 16) { const cx = nearestOn([x, y0], CREEK)[0]; pts.push([x, y0 + 9 * Math.sin(x / 140 + ph) - 34 * Math.exp(-(((x - cx) / 44) ** 2)) + (y0 > 100 ? 0.04 * (x - 500) : 0)]); } d += pline(spline(pts, false, 10)) + ' '; }
    g.push(`<path d="${d}" fill="none" stroke="${BROWN}" stroke-width="0.7" opacity="0.6"/>`); }
  g.push(`<path d="${pline(CREEK)}" fill="none" stroke="${WATER}" stroke-width="${c.creekW}" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>`);
  // the road, cased like the map's, and the drive and the lot
  { const rd = `M${c.px - 4},${f(Y(roadY(0)))} L${f(PX1 + 4)},${f(Y(roadY(PW)))}`, dr = `M${f(X(DRIVE_X))},${f(Y(LOT.y + LOT.h))} V${f(Y(roadY(DRIVE_X)))}`;
    g.push(`<g fill="none"><path d="${rd}" stroke="${INK}" stroke-width="${f(ROAD_W * k + 2.4)}"/><path d="${dr}" stroke="${INK}" stroke-width="${f(16 * k + 2.2)}"/><path d="${rd}" stroke="#FFFDF6" stroke-width="${f(ROAD_W * k)}"/><path d="${dr}" stroke="#FFFDF6" stroke-width="${f(16 * k)}"/><path d="${rd}" stroke="${INK2}" stroke-width="0.8" stroke-dasharray="7 6" opacity="0.6"/></g>`);
    let stalls = ''; for (let x = LOT.x + 12; x < LOT.x + LOT.w - 6; x += 13) stalls += `M${f(X(x))},${f(Y(LOT.y))} v${f(20 * k)} M${f(X(x))},${f(Y(LOT.y + LOT.h))} v${f(-20 * k)} `;
    g.push(`<rect x="${f(X(LOT.x))}" y="${f(Y(LOT.y))}" width="${f(LOT.w * k)}" height="${f(LOT.h * k)}" rx="${f(10 * k)}" fill="#FFFDF6" stroke="${INK}" stroke-width="1.1"/><path d="${stalls}" stroke="${INK2}" stroke-width="0.7" opacity="0.7"/>`);
    // the map's parking symbol, a pale P on a dark tile, in the middle of the lot
    g.push(`<g transform="translate(${f(X(LOT.x + LOT.w / 2))},${f(Y(LOT.y + LOT.h / 2))}) scale(${c.pScale})"><rect x="-7.4" y="-7.4" width="14.8" height="14.8" rx="2.6" fill="#FFFDF6"/><rect x="-6.3" y="-6.3" width="12.6" height="12.6" rx="2" fill="${INK}"/><path d="M-2.6,4.6 V-4.6 H1 A3,3 0 0 1 1,1.4 H-0.9 V4.6Z M-0.9,-3 V-0.2 H0.8 A1.4,1.4 0 0 0 0.8,-3Z" fill-rule="evenodd" fill="${PAPER}"/></g>`); }
  // the dirt trail, in the map's trail line, with a footbridge where it crosses the creek
  { const tr = pline(UP) + ' ' + pline(DOWN), [bx, by] = P(BRIDGE), bl = 9 * tk;
    g.push(`<g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="${tr}" stroke="${PAPER}" stroke-width="${c.trailW + 2}" opacity="0.85"/><path d="${tr}" stroke="${RED}" stroke-width="${c.trailW}" stroke-dasharray="${c.dash}"/></g>`
      + `<g transform="translate(${f(bx)},${f(by)}) rotate(-40)"><rect x="${f(-bl)}" y="-3" width="${f(bl * 2)}" height="6" fill="${WHITE}" stroke="${INK}" stroke-width="1"/></g>`); }
  // the boardwalk: two edges and the boards across between them
  { const bw = c.bw, id = L.shared(pline(LOOP) + 'Z ' + pline(STEM));
    g.push(`<g fill="none" stroke-linejoin="round"><use href="#${id}" stroke="${INK}" stroke-width="${bw + 2.2}"/><use href="#${id}" stroke="${WHITE}" stroke-width="${bw}"/><use href="#${id}" stroke="${mix(INK, WHITE, 0.62)}" stroke-width="${bw}" stroke-dasharray="0.7 ${c.board}"/></g>`); }

  // ---- the trees: the trunk of each seen from above, as a circle about twice the width it would be to scale, as plans
  // draw them, so that it can be seen. The named ones have their own shapes: the Twins two trunks on one root, the
  // hollow cedar open on one side, the nurse log lying down with young trees along it.
  // Each trunk is shaded on the side away from a light in the north-west, the same light as the relief on the map: a
  // darker disc, and a lighter one set toward the light inside it, which leaves a crescent of shade to the south-east.
  const trunk = mix(BROWN, PAPER, 0.62), shade = mix(BROWN, PAPER, 0.42), heart = mix(BROWN, PAPER, 0.3);
  const disc = (x, y, rr) => `M${f(x - rr)},${f(y)}a${f(rr)},${f(rr)} 0 1 0 ${f(rr * 2)},0a${f(rr)},${f(rr)} 0 1 0 ${f(-rr * 2)},0Z`;
  const lit = (x, y, rr) => disc(x - rr * 0.15, y - rr * 0.15, rr * 0.76);
  const stem = (x, y, rr, w = 1.5) => `<path d="${disc(x, y, rr)}" fill="${shade}" stroke="${INK}" stroke-width="${w}"/><path d="${lit(x, y, rr)}" fill="${trunk}"/>`;
  { let outer = '', inner = '';
    for (const t of TREES) if (!t.kind) { const [x, y] = P(t.at), rr = t.r * tk; outer += disc(x, y, rr); inner += lit(x, y, rr); }
    g.push(`<path d="${outer}" fill="${shade}" stroke="${INK}" stroke-width="1"/><path d="${inner}" fill="${trunk}"/>`); }
  for (const t of TREES) if (t.kind) {
    const [x, y] = P(t.at), rr = t.r * tk;
    if (t.kind === 'fir' || t.kind === 'cedar') g.push(stem(x, y, rr) + `<circle cx="${f(x - rr * 0.1)}" cy="${f(y - rr * 0.1)}" r="${f(rr * 0.4)}" fill="none" stroke="${heart}" stroke-width="0.9"/>`);
    if (t.kind === 'twins') g.push(`<ellipse cx="${f(x)}" cy="${f(y + rr * 0.1)}" rx="${f(rr * 1.9)}" ry="${f(rr * 0.9)}" fill="${heart}" opacity="0.5"/>` + stem(x - rr * 0.82, y, rr) + stem(x + rr * 0.9, y + rr * 0.15, rr * 0.92));
    if (t.kind === 'hollow') g.push(stem(x, y, rr) + `<path d="M${f(x + rr * 0.15)},${f(y - rr * 0.55)} a${f(rr * 0.55)},${f(rr * 0.55)} 0 1 0 ${f(rr * 0.4)},${f(rr * 1.05)} l${f(rr * 0.6)},${f(-rr * 0.3)} l${f(-rr * 0.1)},${f(-rr * 0.5)}Z" fill="${INK}" opacity="0.8"/>`);
    if (t.kind === 'log') { const len = 92 * tk, w = 10 * tk, rot = -24; let young = ''; for (const [u, sc] of [[-0.3, 1], [0.05, 0.8], [0.32, 1.1]]) young += stem(u * len, -w * 0.1, 3.4 * tk * sc, 0.9);
      g.push(`<g transform="translate(${f(x)},${f(y)}) rotate(${rot})"><rect x="${f(-len / 2)}" y="${f(-w / 2)}" width="${f(len)}" height="${f(w)}" rx="${f(w / 2)}" fill="${heart}" stroke="${INK}" stroke-width="1.3"/><path d="M${f(-len / 2 + w)},${f(-w * 0.1)} H${f(len / 2 - w)}" stroke="${trunk}" stroke-width="0.8"/>${young}</g>`); }
  }
  // ---- the posts: a dark tile on the boardwalk beside each named tree, as on the map's point symbols
  const tile = (x, y, n, s = 1) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(c.post * s + 1.4)}" fill="${PAPER}"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(c.post * s)}" fill="${INK}"/>` + (n ? T(x, y + c.post * s * 0.5, String(n), { anchor: 'middle', size: f(c.post * s * 1.45), weight: 700, fill: PAPER, cls: false }) : '');
  const posts = TREES.filter(t => t.post).map(t => ({ t, at: nearestOn(t.at, t.kind === 'fir' ? [...LOOP, ...spline(STEM)] : LOOP) }));
  g.push(posts.map(({ t, at }) => tile(...P(at), t.post)).join(''));

  // ---- the plan's own lettering. Every label is backed by the colour it lies on, as on the map.
  const lab = (x, y, s, o = {}) => T(x, y, s, { size: c.label, weight: 650, halo: o.on || TINT, cls: false, ...o });
  { const [x, y] = c.roadAt, a = Math.atan(-0.047) * 180 / Math.PI; g.push(lab(X(x), Y(roadY(x)) + c.label * 0.36, LB.road, { anchor: 'middle', rot: f(a), on: '#FFFDF6', ls: 0.6, size: c.label - 0.5 })); }
  { const [x, y] = c.parkAt; g.push(block(X(x), Y(y), c.label + 3, LB.parking, wrap(c.parkMax), { size: c.label, weight: 650, halo: CLEAR, cls: false })); }
  { const [x, y, rot] = c.creekAt; g.push(T(X(x), Y(y), LB.creek, { size: c.label - 0.5, weight: 600, italic: true, fill: WATER, halo: TINT, rot, ls: 0.4, cls: false })); }
  // where the dirt trail leaves the plan, a small head on each end of it pointing on up the hill
  {
    // the head sits a little inside the top edge, pointing the way the trail goes uphill
    const head = line => { const up = line[0][1] > line[line.length - 1][1] ? line : line.slice().reverse(), i = up.findIndex(p => p[1] < 22), p = up[i - 2], q = up[i], [x2, y2] = P(q), a = Math.atan2(Y(q[1]) - Y(p[1]), X(q[0]) - X(p[0])) * 180 / Math.PI;
      return `<path d="M-5,-4.4 L4,0 L-5,4.4Z" transform="translate(${f(x2)},${f(y2)}) rotate(${f(a)})" fill="${RED}" stroke="${PAPER}" stroke-width="1" paint-order="stroke"/>`; };
    g.push(head(UP) + head(DOWN)); }
  // ---- north and the scale, on the paper below the road
  { const [nx, ny] = c.northAt, [sx, sy] = c.scaleAt, s200 = 200 * k; g.push( `<path d="M0,-12 L4.4,7.4 L0,3.8 L-4.4,7.4Z" transform="translate(${f(nx)},${f(ny)})" fill="${INK}"/>` + T(nx, ny - 15, LB.north, { anchor: 'middle', size: 11, weight: 700, cls: false })
    + `<rect x="${f(sx)}" y="${f(sy)}" width="${f(s200 / 2)}" height="4.6" fill="${INK}" stroke="${INK}" stroke-width="0.9"/><rect x="${f(sx + s200 / 2)}" y="${f(sy)}" width="${f(s200 / 2)}" height="4.6" fill="${PAPER}" stroke="${INK}" stroke-width="0.9"/>`
    + T(sx + s200 + 6, sy + 5.4, LB.scale, { size: c.small - 1, weight: 600, cls: false })); }
  o.push(`<g clip-path="url(#${box})">${g.join('')}</g><rect x="${c.px}" y="${c.py}" width="${f(PX1 - c.px)}" height="${f(PY1 - c.py)}" fill="none" stroke="${INK}" stroke-width="1.2"/>`);

  // ---- the key: the five posts, the note under them, and the legend
  { const [kx, ky] = c.keyAt, lh = c.keyLh, tx = kx + c.post * 2 + 9;
    NAMED.forEach((t, i) => { const y = ky + i * c.keyPitch, [a, b] = nameParts(LB['tree' + (i + 1)]);
      o.push(tile(kx + c.post * 1.15, y - c.key * 0.34, i + 1, 1.15) + T(tx, y, a, { size: c.key, weight: 700, cls: false }) + T(tx, y + lh, b, { size: c.key - 0.5, weight: 600, fill: INK2, cls: false })); });
    const ny = ky + 5 * c.keyPitch - 6;
    o.push(block(kx, ny, c.small + 4, D.notes[0], wrap(c.noteMax), { size: c.small, weight: 600, fill: INK2, cls: false }));
    const ly = ny + c.legendDy, rr = 11 * tk, sw = c.post * 2.3, row = (i, sym, words) => { const y = ly + i * c.legendLh; return `<g transform="translate(${f(kx)},${f(y - 4.6)})">${sym}</g>` + T(tx, y, words, { size: c.small, weight: 600, cls: false }); };
    o.push(rule(kx, ly - 24, c.keyRight, ly - 24, { opacity: 0.35 }));
    o.push(row(0, `<path d="M0,0 H${f(sw)}" stroke="${INK}" stroke-width="${f(c.bw + 2.2)}"/><path d="M0,0 H${f(sw)}" stroke="${WHITE}" stroke-width="${c.bw}"/><path d="M0,0 H${f(sw)}" stroke="${mix(INK, WHITE, 0.62)}" stroke-width="${c.bw}" stroke-dasharray="0.7 ${c.board}"/>`, LB.boardwalk));
    o.push(row(1, `<path d="M0,0 H${f(sw)}" stroke="${RED}" stroke-width="${c.trailW}" stroke-dasharray="${c.dash}"/>`, LB.upper));
    o.push(row(2, stem(sw / 2, 0, rr, 1), LB.legendTree));
    o.push(row(3, tile(sw / 2, 0, 0), LB.legendPost)); }
  // ---- room for field notes: faint printed rules across the foot of the sheet, as on a crew's field form. The tally
  // is written on them later; the sketch is drawn across them.
  { const [x0, x1, y0, n, gap] = c.rules; let d = ''; for (let i = 0; i < n; i++) d += `M${x0},${f(y0 + i * gap)} H${x1} `;
    o.push(`<path d="${d}" stroke="${INK}" stroke-width="0.7" stroke-dasharray="1.2 2.2" opacity="0.42" fill="none"/>`); }

  // ================= Sam's pencil =================
  // Marks and words are gathered by the stage they first appear at, and each stage's are drawn as one group.
  const pr = L.source(seed + 40), marks = {}, txt = {}, mark = (n, d) => { marks[n] = (marks[n] || '') + d; }, say = (n, t) => { txt[n] = (txt[n] || '') + t; };
  const pen = (x, y, s, o = {}) => script(x, y, s, { size: c.hand, ...o }), penV = (x, y, v, o = {}) => script(x, y, word(v), { size: c.hand, alts: altsOf(v), ...o });
  // the rings, each on the Monday its tree was first found marked. The later ones are drawn faster.
  for (const t of TREES) if (t.when) { const [x, y] = P(t.at), rr = (t.kind === 'twins' ? t.r * 2.05 : t.r) * tk + c.ringGap + pr(0, 2.2);
    const off = t.when === ALL ? 3 : 1.8; mark(t.when, ring(x + (t.kind === 'twins' ? 0.6 : 0) + pr(-off, off), y + pr(-off, off), rr, pr, t.when === FIRST ? 0 : t.when === ROWS ? 0.4 : 1)); }
  // 2: the first note, broken before the word he strikes out later, with an arrow to one of the first rings; the
  // second note under it
  { const [nx, ny] = c.ringAt, lh = c.hand + 3, rot = -2.5, tan = Math.tan(rot * Math.PI / 180);
    const full = word(altsOf(LB.ring)[FIRST]), cut = full.indexOf(D.struck.ring.text), A = full.slice(0, cut).trim(), B = full.slice(cut);
    const ww = c.hand * c.windEm;
    say(FIRST, pen(nx, ny, '', { rot, alts: { [FIRST]: A } }) + pen(nx + c.windDx, ny + lh, '', { rot, alts: { [FIRST]: B }, fit: ww }));
    const target = TREES.filter(t => t.when === FIRST).sort((a, b) => Math.hypot(a.at[0] - c.ringTo[0], a.at[1] - c.ringTo[1]) - Math.hypot(b.at[0] - c.ringTo[0], b.at[1] - c.ringTo[1]))[0];
    mark(FIRST, arrow(c.ringArrow(nx, ny), P(target.at), pr, c.ringBend, target.r * tk + c.ringGap + 4));
    // 3: "wind?" struck through with one stroke, not rubbed out
    const wx = nx + c.windDx, wy = ny + lh - c.hand * 0.3;
    mark(D.struck.ring.from, stroke([wx - 3, wy + 1.4], [wx + ww + 5, wy + ww * tan - 1], pr, { w: 2.1, bend: -0.03, inn: 0.03, out: 0.1 }).d);
    const [sx, sy] = c.sameAt; say(firstAt(LB.same), block(sx, sy, lh, LB.same, wrap(c.sameMax), { size: c.hand, rot: 1.5 }, script)); }
  // 3: the fir's top, with an arrow to its ring
  { const [nx, ny] = c.firAt, n = firstAt(LB.fir); say(n, penV(nx, ny, LB.fir, { rot: -2 }));
    mark(n, arrow(c.firArrow(nx, ny), P(FIR), pr, c.firBend, NAMED[0].r * tk + c.ringGap + 5)); }
  // the tally, in the margin: a heading, a line for each Monday, the count in a column of its own
  { const [x, y] = c.tallyAt, lh = c.hand + 5, col = x + c.tallyCol, n = firstAt(LB.tallyHead);
    say(n, penV(x, y, LB.tallyHead, { rot: -1.5 }));
    mark(n, stroke([x - 2, y + 5.5], [x + c.tallyW, y + 3], pr, { w: 1.4, bend: 0.03 }).d);
    const rowY = i => y + lh * (i + 1) + 6;
    for (const [i, row] of D.tally.entries()) {
      const ry = rowY(i);
      say(row.from, pen(x + pr(-1.5, 1.5), ry, row.date, { size: c.hand - 0.5 }) + (row.count ? pen(col + 8 + pr(-1, 1.5), ry, row.count, { size: c.hand - 0.5 }) : ''));
      // the line between the dates and the counts, carried down beside each line as it is written
      mark(row.from, stroke([col + 0.3 * i + pr(-0.3, 0.3), i ? rowY(i - 1) + 2 : y + 11], [col + 0.3 * i + 0.4, ry + 5], pr, { w: 1.2, n: 5, inn: 0.1, out: 0.2 }).d);
    } }
  // 3: the sketch, to scale: a trunk, a tick forty feet up it, and Sam beside it, six feet tall. Nothing else, ever.
  { const [gx, gy] = c.sketchAt, u = c.sketchFt, tw = c.trunkW, top = gy - c.sketchH;
    let d = '';
    // the trunk: two long strokes up from the ground, flaring at the foot and closing a little toward the top, each
    // drawn in two goes
    for (const s of [-1, 1]) { const x0 = gx + s * tw / 2, x1 = gx + s * tw * 0.4, mid = lerp(gy, top, 0.52);
      d += stroke([x0 + s * tw * 0.35, gy + 0.5], [x0, gy - tw * 0.6], pr, { w: 1.8, bend: s * 0.12, n: 6 }).d
        + stroke([x0 + pr(-0.4, 0.4), gy - tw * 0.5], [lerp(x0, x1, 0.52), mid], pr, { w: 1.9, bend: s * 0.01 }).d + stroke([lerp(x0, x1, 0.5) + s * 0.4, mid + 4], [x1, top], pr, { w: 1.7, bend: -s * 0.008, out: 0.5 }).d; }
    // a few furrows of bark low on the trunk, so it reads as a tree and not a post
    for (const [dx, y0, len] of [[-0.22, 0.08, 0.2], [0.08, 0.05, 0.26], [0.24, 0.12, 0.16]]) d += stroke([gx + dx * tw, gy - y0 * c.sketchH], [gx + dx * tw + pr(-0.6, 0.6), gy - (y0 + len) * c.sketchH], pr, { w: 1, n: 6 }).d;
    // the ground, and the tick
    d += stroke([gx - tw * 1.5, gy + 1], [gx + tw * 2.7, gy + 0.2], pr, { w: 1.5, bend: 0.01 }).d;
    const ty = gy - 40 * u; d += stroke([gx - tw * 0.85, ty + 1], [gx + tw * 0.95, ty - 0.8], pr, { w: 2, inn: 0.03, out: 0.15 }).d;
    // Sam: six feet tall, standing a step off the trunk
    const fx = gx + tw * 1.55, fh = 6 * u, hr = Math.max(1.8, fh * 0.11), neck = gy - fh + hr * 2.1, hip = gy - fh * 0.46;
    d += ring(fx, gy - fh + hr, hr, pr, 0) + stroke([fx, neck], [fx + 0.3, hip], pr, { w: 1.5, n: 5 }).d + stroke([fx + 0.3, hip], [fx - fh * 0.17, gy], pr, { w: 1.5, n: 5 }).d + stroke([fx + 0.3, hip], [fx + fh * 0.18, gy], pr, { w: 1.5, n: 5 }).d
      + stroke([fx - fh * 0.24, neck + fh * 0.3], [fx + fh * 0.24, neck + fh * 0.26], pr, { w: 1.4, n: 5 }).d;
    const n = firstAt(LB.sketch); mark(n, d);
    say(n, block(gx + tw + c.sketchDx, ty + c.hand * 0.32, c.hand + 3, LB.sketch, wrap(c.sketchMax), { size: c.hand, rot: -1.5 }, script));
    say(firstAt(LB.sketchPerson), penV(fx + fh * 0.3 + 6, gy - fh * 0.3, LB.sketchPerson, { rot: -3 })); }

  const all = [0, 0, W, H];
  [...new Set([...Object.keys(marks), ...Object.keys(txt)].map(Number))].sort((a, b) => a - b).forEach((n, i) => o.push(from(n, (marks[n] ? graphite(marks[n], all, seed + 51 + i, Math.min(0.95, 0.86 + 0.045 * i)) : '') + (txt[n] || ''))));
  o.push(tooth(W, H, seed + 9, 0.7));
  return o.join('\n');
}

export function survey(){
  L.usePalette('gold'); L.begin();
  const wide = draw({ wide: true, W: 900, H: 620, m: 28, title: 25, titleY: 49, small: 14, ruleY: 64,
    px: 28, py: 80, k: 0.5, tk: 0.5, ph: 1024, bw: 6.4, board: 2.2, post: 6.6, trailW: 1.9, dash: '5.5 3', creekW: 2, pScale: 1,
    label: 13, roadAt: [800, 0], parkAt: [612, 696], parkMax: 30, creekAt: [888, 560, -84],
    northAt: [544, 572], scaleAt: [400, 577],
    keyAt: [584, 98], key: 14.5, keyLh: 18, keyPitch: 44, keyRight: 872, noteMax: 38, legendDy: 52, legendLh: 22,
    hand: 17, ringGap: 4.5, windDx: 14, windEm: 2.75,
    ringAt: [44, 532], ringTo: [113, 699], ringArrow: (x, y) => [x + 50, y - 16], ringBend: -0.12,
    sameAt: [44, 577], sameMax: 30, firAt: [236, 541], firArrow: (x, y) => [x + 28, y - 17], firBend: -0.12,
    tallyAt: [590, 472], rules: [584, 872, 503, 4, 22], tallyW: 70, tallyCol: 42, sketchAt: [722, 590], sketchFt: 2.6, sketchH: 146, trunkW: 19, sketchDx: 8, sketchMax: 14 }, 2101);
  const tall = draw({ wide: false, W: 360, H: 952, m: 18, title: 22, titleY: 42, titleLh: 25, titleMax: 18, subY: 90, small: 13.5, ruleY: 104,
    px: 18, py: 118, k: 0.3045, tk: 0.36, ph: 1180, bw: 4.6, board: 1.8, post: 5.4, trailW: 1.6, dash: '4.5 2.6', creekW: 1.6, pScale: 0.75,
    label: 12.5, roadAt: [820, 0], parkAt: [612, 690], parkMax: 12, creekAt: [900, 600, -84],
    northAt: [334, 404], scaleAt: [226, 398],
    keyAt: [18, 502], key: 14.5, keyLh: 18, keyPitch: 42, keyRight: 342, noteMax: 44, legendDy: 40, legendLh: 21,
    hand: 15.5, ringGap: 3.2, windDx: 12, windEm: 2.75,
    ringAt: [24, 402], ringTo: [113, 699], ringArrow: (x, y) => [x + 44, y - 15], ringBend: -0.12,
    sameAt: [24, 456], sameMax: 30, firAt: [150, 432], firArrow: (x, y) => [x + 12, y - 15], firBend: -0.22,
    tallyAt: [24, 840], rules: [18, 342, 869.5, 4, 20.5], tallyW: 64, tallyCol: 40, sketchAt: [198, 934], sketchFt: 2.2, sketchH: 114, trunkW: 15, sketchDx: 7, sketchMax: 14 }, 2151);
  return twoLayouts(wide, tall, [900, 620], [360, 952]);
}
