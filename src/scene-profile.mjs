// The elevation profile on the Echo Pass trail page: the long trail from Basin Lodge to Echo Pass, seen from the side.
//
// It is printed on the same card as the map and the conditions cards, and drawn like the echo diagram: the ground is
// cut along the trail and filled beneath the line, with small trees standing on it that thin out with height, the
// meadows open on their bench, and snow from the snowline to the pass. At its left end it starts at the lake.
//
// THE GROUND IS THE MAP'S. The trail is the map's trails 3, 4 and 5 joined end to end (the lodge to Echo Point, on to
// Halloran Meadows, up the Halloran Creek valley past the Pass Hut to the pass). The three lines are rebuilt here from
// the map's own control points with the map's own smoothing, and the ground under them is read off the map's terrain
// (heightAt), so the climb, the saddle behind Echo Point and the dip where the trail crosses the creek above the
// meadows are the map's. Left of the lodge the ground carries on along the map's straight line, under the lake.
// Where the map and the site's stated figures differ, the figures win, because they are what the site prints: each
// leg is stretched or shrunk to the one-way length the trail table gives (half of each round trip), and the heights
// are nudged a few feet, evenly along each leg, so the stops stand at their stated heights. The map draws the trail
// shorter than the walk between Echo Point and the meadows, and longer below the point and above the meadows;
// profile-check.mjs prints how far off it is, stop by stop. The Pass Hut is marked by name only. Its height is never
// printed (story bible 9.15).
//
// Every word on it is from the trail page's copy (src/content/trail-echo-pass.mjs, diagram).
//
// The later stages lean on its scale:
//   2  where the unidentified tracks were reported: the trail above the snowline.
//   3  the ground above 7,500 ft is hatched as closed, as on the map, and a pin marks the last report, at the pass.
//   4  the hatching comes down to 3,760 ft, just above the lodge, and the pin is 0.4 miles from the lodge. The stops
//      carry the map's own additions to their names.
//   5  the pin is at the lodge.
//   6  no pin. The profile's line carries on past the lodge, down under the lake, and off the edge of the card.
//
// Two layouts, as on the other cards. Wide, the stops are lettered on the line, and a mile of height is drawn about 1.7
// times as long as a mile along the trail. On a phone the heights are drawn twice as steep again, about 3.5 times, and
// the stops are listed beneath under the same symbols.
import * as L from './lib.mjs';
import { heightAt, onPath } from './scene-map.mjs';
import { C } from './content.mjs';
import { trailEchoPass } from './content/trail-echo-pass.mjs';
import { T, lines2, twoLayouts, sheet, tooth, rule, PAPER, INK, INK2, BROWN } from './infokit.mjs';
const { f, mix, lerp, poly, from, between, clip, grain, GL, linGrad } = L;

const DG = trailEchoPass.diagram, LB = DG.labels, ST = LB.stops;
const CORAL = '#E4694F', CORAL_D = '#B4473F', SNOW = '#FFFDF6', SNOW_EDGE = '#9DA9C4';
// copy is a string or [base, { stage: alternate }]; at() is what it says at a given stage
const base = v => Array.isArray(v) ? v[0] : v, alt = v => Array.isArray(v) ? v[1] : undefined;
const at = (v, s) => { if (!Array.isArray(v)) return v; let out = v[0]; for (let k = 1; k <= s; k++) if (v[1][k] !== undefined) out = v[1][k]; return out; };
const num = s => +String(s).replace(/[^\d.]/g, '');

// ================= THE GROUND =================
// The map's smoothing: a Catmull-Rom line through the control points, resampled about every `step` map units.
function smoothLine(pts, step){
  const out = [], n = pts.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
    const m = Math.max(1, Math.round(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
    for (let k = 0; k < m; k++) { const t = k / m, t2 = t * t, t3 = t2 * t, q = []; for (let c = 0; c < 2; c++) q.push(0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3)); out.push(q); }
  }
  out.push(pts[n - 1].slice());
  return out;
}
const MI = 60;                                                                       // map units to the mile
// The named places on the map's line, in map units from the pass, and the three trails between them, exactly as the
// map lays them out (scene-map.mjs: PLACE, and trails 3, 4 and 5 of T).
const PLACE = { pass: 0, hut: 60, meadows: 138, point: 208, lodge: 238 };
const [LODGE, POINT, MEADOW, HUT, PASS] = ['lodge', 'point', 'meadows', 'hut', 'pass'].map(k => onPath(PLACE[k]));
const LEGS = [
  ['lodge', 'point', smoothLine([LODGE, [LODGE[0] + 10, LODGE[1] - 4], [LODGE[0] + 6, LODGE[1] - 12], [POINT[0] + 5, POINT[1] + 6], POINT], 3)],
  ['point', 'meadows', smoothLine([POINT, [POINT[0] - 7, POINT[1] - 9], [POINT[0] + 6, POINT[1] - 14], [POINT[0] - 4, POINT[1] - 23], [POINT[0] + 12, POINT[1] - 27], [POINT[0] + 6, POINT[1] - 37], [696, 206], [708, 204], MEADOW], 3)],
  ['meadows', 'pass', smoothLine([MEADOW, [733, 196], [747, 188], [749, 172], [763, 168], [765, 151], HUT, [786, 138], [779, 127], [796, 123], [789, 112], [806, 108], PASS], 3)],
];
// The meadows where the map draws them: open ground within about 21 units of this line, near 6,240 ft.
const MEADOW_LINE = smoothLine([[733, 184], [720, 200], [713, 224]], 4);
const nearD = (x, y, pts) => { let bd = 1e9; for (let i = 0; i < pts.length - 1; i++) { const [ax, ay] = pts[i], vx = pts[i + 1][0] - ax, vy = pts[i + 1][1] - ay, t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy))); bd = Math.min(bd, Math.hypot(x - ax - vx * t, y - ay - vy * t)); } return bd; };
const TREELINE = 6750;                                                               // where the map's forest ends, on average

// The figures the site states. Miles are one way along the trail, half of each round trip in the trail table; the
// heights are the ones lettered on the stops.
const ROW = name => C.trails.rows.find(r => r[1] === name);
export const STATED = {
  mi: { lodge: 0, point: num(ROW('Echo Point')[2]) / 2, meadows: num(ROW('Halloran Meadows')[2]) / 2, pass: num(ROW('Echo Pass')[2]) / 2 },
  ft: { lodge: num(ST.lodge.ft), point: num(ST.point.ft), meadows: num(ST.meadows.ft), snowline: num(ST.snowline.ft), pass: num(ST.pass.ft) },
};
export const LAST_MI = 0.4;                                                          // stage 4: "0.4 mi NE of the lodge"
const CLOSED = [STATED.ft.snowline, 3760];                                            // the closure on the 13th, and from the 14th

// The profile: miles from the lodge and feet, all the way along, and what the map said before it was made to agree.
let memo = null;
export function profileData(){
  if (memo) return memo;
  const pts = [], raw = { mi: {}, ft: {} }, nudge = {};
  let run = 0;
  for (const [a, b, line] of LEGS) {
    let len = 0; const d = [0]; for (let i = 1; i < line.length; i++) d.push(len += Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]));
    const run0 = run; raw.mi[a] = run / MI; raw.mi[b] = (run += len) / MI;
    raw.ft[a] = heightAt(...line[0]); raw.ft[b] = heightAt(...line[line.length - 1]);
    nudge[a] = STATED.ft[a] - raw.ft[a]; nudge[b] = STATED.ft[b] - raw.ft[b];
    line.forEach((p, i) => { if (i === 0 && pts.length) return; const t = d[i] / len, e = heightAt(...p);
      pts.push({ mi: lerp(STATED.mi[a], STATED.mi[b], t), ft: e + lerp(nudge[a], nudge[b], t), rawMi: (run0 + d[i]) / MI, rawFt: e, meadow: 21 - nearD(p[0], p[1], MEADOW_LINE) - Math.abs(e - 6240) / 26 > 0, hut: a === 'meadows' && Math.hypot(p[0] - HUT[0], p[1] - HUT[1]) < 2 }); });
  }
  raw.mi.hut = pts.find(p => p.hut).rawMi;
  // where the trail first reaches the snowline, on the profile and on the map
  const reach = (h, m) => { for (let i = 1; i < pts.length; i++) if (pts[i - 1][h] < STATED.ft.snowline && pts[i][h] >= STATED.ft.snowline) return lerp(pts[i - 1][m], pts[i][m], (STATED.ft.snowline - pts[i - 1][h]) / (pts[i][h] - pts[i - 1][h])); return null; };
  const snow = reach('ft', 'mi'); raw.mi.snowline = reach('rawFt', 'rawMi');
  // past the lodge: the map's straight line, out over the bottom of the lake, with the lodge's nudge carried on
  const lake = []; for (let u = 0; u <= 1.4 * MI; u += 2) lake.push({ mi: -u / MI, ft: heightAt(...onPath(PLACE.lodge + u)) + nudge.lodge });
  return memo = { pts, lake, hut: pts.find(p => p.hut).mi, snow, raw, nudge };
}

// ================= THE DRAWING =================
// the map's point symbols, pale pictograms on dark tiles (the pass is the conditions card's)
const PIC = {
  lodge: `<path d="M-4.6,4.6 V-0.6 L0,-4.8 L4.6,-0.6 V4.6 H1.4 V1.2 H-1.4 V4.6Z"/>`,
  point: `<circle cx="0" cy="1.6" r="1.7"/><path d="M-4.8,1.6 A4.8,4.8 0 0 1 4.8,1.6" fill="none" stroke="${PAPER}" stroke-width="1.5"/>`,
  hut: `<path d="M-5,2 L0,-4.4 L5,2 H3.4 V4.6 H-3.4 V2Z"/>`,
  pass: `<path d="M-6,4.4 L-1.4,-4.6 L1.6,0.4 L3.4,-1.8 L6,4.4Z"/>`,
};
const tile = (x, y, k, s = 1) => `<g transform="translate(${f(x)},${f(y)})${s !== 1 ? ` scale(${s})` : ''}"><rect x="-7.4" y="-7.4" width="14.8" height="14.8" rx="2.6" fill="${PAPER}"/><rect x="-6.3" y="-6.3" width="12.6" height="12.6" rx="2" fill="${INK}"/><g fill="${PAPER}">${PIC[k]}</g></g>`;
const ring = (x, y, s = 1) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(4.8 * s)}" fill="${PAPER}" stroke="${INK}" stroke-width="${f(2 * s)}"/>`;
const snowMark = (x, y, w) => `<path d="M${f(x)},${f(y)} h${w}" stroke="${SNOW_EDGE}" stroke-width="1.6" stroke-dasharray="5 3.4"/>`;
// The last-reported mark: a plain map pin, in the conditions card's coral with its paper rim and soft halo, standing
// with its tip at (x, y). Its head is `PIN` above the tip.
const PIN = 20.6;
const pin = (x, y, s = 1) => `<g transform="translate(${f(x)},${f(y)})${s !== 1 ? ` scale(${s})` : ''}"><ellipse rx="7" ry="2.4" fill="${CORAL}" opacity="0.35"/><circle cy="-${PIN}" r="12.4" fill="${CORAL}" opacity="0.25"/><path d="M0,0 C-1.6,-5.4 -7.6,-11.6 -7.6,-${PIN} A7.6,7.6 0 1 1 7.6,-${PIN} C7.6,-11.6 1.6,-5.4 0,0Z" fill="${CORAL}" stroke="${PAPER}" stroke-width="1.4" stroke-linejoin="round"/><circle cy="-${PIN}" r="2.7" fill="${PAPER}"/></g>`;
const leader = (x, y0, y1) => `<path d="M${f(x)},${f(y0)} V${f(y1)}" stroke="${CORAL_D}" stroke-width="1.2" stroke-dasharray="2 2.6" fill="none"/>`;

function draw(c, seed, hatch){
  const P = L.P, { W, H, m, X0, X1, M0, M1, PT, PB, F0, F1, wide } = c, o = [sheet(W, H)];
  const X = mi => X0 + (mi - M0) / (M1 - M0) * (X1 - X0), Y = ft => PB - (ft - F0) / (F1 - F0) * (PB - PT);
  const D = profileData(), S = STATED, line = D.pts.map(p => [X(p.mi), Y(p.ft)]);
  const bed = D.lake.filter(p => p.mi >= M0 - 0.04).map(p => [X(p.mi), Y(p.ft)]).reverse();
  const yAt = x => { for (let i = 1; i < line.length; i++) if (x <= line[i][0]) return lerp(line[i - 1][1], line[i][1], (x - line[i - 1][0]) / (line[i][0] - line[i - 1][0] || 1)); return line[line.length - 1][1]; };
  const ptAt = x => D.pts[Math.max(0, line.findIndex(q => q[0] >= x))];
  const pt = k => [X(S.mi[k]), Y(S.ft[k])], [lx, ly] = pt('lodge'), [px, py] = pt('point'), [mx, my] = pt('meadows'), [ex, ey] = pt('pass'), hx = X(D.hut), hy = yAt(hx), sx = X(D.snow);
  const r = L.source(seed), s = c.sym;
  // the sky's two colours, and the colour of the sky at a given height, to back lettering laid over it
  const skyTop = mix(P.skyLow, PAPER, 0.7), skyFoot = mix(P.skyHorizon, PAPER, 0.35), sky = y => mix(skyTop, skyFoot, Math.max(0, Math.min(1, (y - PT) / (PB - PT))));

  // ---- the head of the card: the title, what it is, and when it was last revised
  o.push(T(m, c.titleY, DG.title, { font: 'serif', size: c.title, cls: false }) + T(c.sub[0], c.sub[1], LB.sub, { size: c.small, fill: INK2, cls: false }));
  const [n1, n2, n3] = DG.notes;
  o.push(T(W - m, c.sub[1], base(n3), { anchor: 'end', size: c.small, fill: INK2, alts: alt(n3) }) + rule(m, c.ruleY, W - m, c.ruleY));

  // ---- the sky, a line every 1,000 ft with its height, and the snowline across the whole sheet
  const lv = []; for (let ft = Math.floor(F0 / 1000) * 1000 + 1000; ft < F1; ft += 1000) lv.push(ft);
  o.push(`<rect x="${X0}" y="${PT}" width="${X1 - X0}" height="${PB - PT}" fill="url(#${linGrad(0, PT, 0, PB, [[0, skyTop], [1, skyFoot]])})"/>`);
  o.push(`<path d="${lv.map(ft => `M${X0},${f(Y(ft))} H${X1}`).join(' ')}" stroke="${INK}" stroke-width="0.8" stroke-dasharray="1.5 4" opacity="0.5" fill="none"/>`);
  o.push(lv.map(ft => T(X0 - 6, Y(ft) + c.tick * 0.33, ft.toLocaleString('en-US'), { anchor: 'end', size: c.tick, fill: INK2, num: true, cls: false })).join('') + T(X0 - 6, PT + c.tick * 0.33, LB.feet, { anchor: 'end', size: c.tick, fill: INK2, cls: false }));
  o.push(`<path d="M${X0},${f(Y(S.ft.snowline))} H${X1}" stroke="${SNOW_EDGE}" stroke-width="1.3" stroke-dasharray="5 3.4" fill="none"/>`);

  // ---- the ground, cut along the trail: the lake's floor left of the lodge, then the trail to the pass. It is lit
  // from above, darkening and stippled toward its foot.
  const G = [[X0, PB], ...bed, ...line, [X1, line[line.length - 1][1]], [X1, PB]], GD = poly(G), gc = clip(GD);
  o.push(`<path d="${GD}" fill="url(#${linGrad(0, Y(S.ft.pass), 0, PB, [[0, mix(P.peach, PAPER, 0.45)], [0.45, mix(P.midLit, PAPER, 0.55)], [1, mix(P.midLit, PAPER, 0.3)]])})"/>`
    + grain(X0, PT, X1 - X0, PB - PT, GL(0, Y(S.ft.pass), 0, PB, [[0, 0], [0.4, 0.05], [1, 0.22]]), P.plum, { seed: seed + 1, clipId: gc }));
  // faint bedding in the rock, running with the slope
  { let beds = ''; for (let k = 0; k < c.beds; k++) { const x1 = r(X(0), X1 - 40), len = r(60, 200) * c.u, y1 = yAt(x1) + r(14, 26) * c.u + r(0, 1) * (PB - yAt(x1)) * 0.6, slope = (yAt(x1 + len) - yAt(x1)) * 0.7;
      if (y1 < PB - 6) beds += `M${f(x1)},${f(y1)} q${f(len * 0.5)},${f(slope * 0.5 + r(-3, 3))} ${f(len)},${f(slope)} `; }
    o.push(`<path d="${beds}" stroke="${P.midShade}" stroke-width="${f(1.1 * c.u)}" fill="none" opacity="0.13" stroke-linecap="round" clip-path="url(#${gc})"/>`); }
  // the lake, over its floor, up to the lodge's shore
  { const wl = Y(S.ft.lodge), shore = bed.filter(([x]) => x <= lx + 0.5);
    o.push(`<path d="${poly([[X0, wl], [lx, wl], ...shore.slice().reverse()])}" fill="${mix(P.tealLight, '#FFFFFF', 0.58)}"/><path d="M${X0},${f(wl)} H${f(lx)}" stroke="${P.teal}" stroke-width="1.3"/>`); }

  // the skin of the ground: forest floor, the meadow, open ground above the trees, and snow, thickening toward the pass
  const zone = p => p.mi >= D.snow - 0.002 ? 'snow' : p.meadow ? 'meadow' : p.ft > TREELINE ? 'open' : 'forest';
  const tint = { forest: mix(P.tealLight, PAPER, 0.46), meadow: mix(P.tealLight, P.cream, 0.66), open: mix(BROWN, PAPER, 0.5), snow: SNOW };
  const depth = (p, z) => z === 'snow' ? c.band * Math.min(1, 0.25 + (p.mi - D.snow) / 0.3) * lerp(1.1, 1.6, (p.mi - D.snow) / (S.mi.pass - D.snow)) : c.band;
  { const runs = []; D.pts.forEach((p, i) => { const z = zone(p); if (!runs.length || runs[runs.length - 1].z !== z) runs.push({ z, a: Math.max(0, i - 1), b: i }); else runs[runs.length - 1].b = i; });
    for (const { z, a, b } of runs) { const seg = line.slice(a, b + 1), dp = D.pts.slice(a, b + 1).map(p => depth(p, z)); o.push(`<path d="${poly([...seg, ...seg.map(([x, y], i) => [x, y + dp[i]]).reverse()])}" fill="${tint[z]}"/>`); }
    const sn = line.map((q, i) => [q[0], q[1] + depth(D.pts[i], 'snow')]).filter(([x]) => x >= sx);
    o.push(`<path d="M${sn.map(([x, y]) => `${f(x)},${f(y)}`).join(' L')}" stroke="${SNOW_EDGE}" stroke-width="1" stroke-dasharray="4 3" fill="none"/>`); }

  // ---- the closures, hatched and outlined as on the map, between the ground's surface and the closure's height
  const closed = ft => { const yl = Y(ft); let d = '', run = [];
    const cross = i => { const [ax, ay] = line[i - 1], [bx, by] = line[i]; return [lerp(ax, bx, (yl - ay) / (by - ay)), yl]; };
    for (let i = 0; i < line.length; i++) { if (line[i][1] < yl) { if (!run.length && i) run.push(cross(i)); run.push(line[i]); } else if (run.length) { run.push(cross(i)); d += poly(run); run = []; } }
    if (run.length) d += poly([...run, [X1, run[run.length - 1][1]], [X1, yl]]);
    return `<path d="${d}" fill="url(#${hatch})"/><path d="${d}" fill="none" stroke="${P.coralSh}" stroke-width="1.3" stroke-dasharray="7 2.4 1.4 2.4" stroke-linejoin="round"/>`; };
  o.push(between(3, 3, closed(CLOSED[0])) + from(4, closed(CLOSED[1])));

  // ---- trees, standing on the line: close together low down, fewer and smaller toward the treeline, a few stunted
  // ones above it, and none in the meadow, on the snow, or at the stops
  { let back = '', front = '';
    const tree = (x, y, h, w) => `M${f(x - w / 2)},${f(y)} L${f(x - w * 0.12)},${f(y - h * 0.36)} L${f(x - w * 0.33)},${f(y - h * 0.33)} L${f(x - w * 0.07)},${f(y - h * 0.66)} L${f(x - w * 0.2)},${f(y - h * 0.63)} L${f(x)},${f(y - h)} L${f(x + w * 0.2)},${f(y - h * 0.63)} L${f(x + w * 0.07)},${f(y - h * 0.66)} L${f(x + w * 0.33)},${f(y - h * 0.33)} L${f(x + w * 0.12)},${f(y - h * 0.36)} L${f(x + w / 2)},${f(y)}Z`;
    const clear = [lx, px, hx].map(x => [x - c.clear, x + c.clear]);
    for (let x = lx + c.clear; x < sx - 4; x += r(0.65, 1.35) * c.treeStep) {
      const p = ptAt(x), up = Math.max(0, (p.ft - S.ft.lodge) / (TREELINE - S.ft.lodge));
      if (p.meadow || clear.some(([a, b]) => x > a && x < b)) continue;
      const hi = Math.min(1, (p.ft - TREELINE) / (S.ft.snowline - TREELINE));
      const keep = p.ft < TREELINE ? 1 - 0.55 * Math.pow(Math.max(0, up - 0.5) / 0.5, 1.4) : lerp(0.75, 0.1, hi), size = p.ft < TREELINE ? lerp(1, 0.62, up) : lerp(0.62, 0.34, hi);
      if (r() > keep) continue;
      const y = yAt(x) + 1.6 * c.u, h = c.treeH * size * r(0.78, 1.22);
      front += tree(x, y, h, h * r(0.4, 0.5));
      if (p.ft < TREELINE - 250 && r() < 0.8) { const bx = x + r(0.3, 0.7) * c.treeStep, bh = h * r(0.6, 0.9); back += tree(bx, yAt(bx) - 0.6 * c.u, bh, bh * 0.5); }
    }
    const id = L.shared(front);
    o.push(`<path d="${back}" fill="${mix(P.tealLight, PAPER, 0.42)}"/><use href="#${id}" fill="${mix(P.tealLight, P.peach, 0.42)}" transform="translate(${f(-1.1 * c.u)},0)"/><use href="#${id}" fill="${P.teal}"/>`); }
  // the meadow's flowers
  { let dots = ''; const cols = [CORAL, '#F2B441', P.cream];
    D.pts.forEach((p, i) => { if (!p.meadow || Math.abs(line[i][0] - mx) < c.clear) return; const [x, y] = line[i]; for (let k = 0; k < c.flowers; k++) dots += `<circle cx="${f(x + r(-2, 2) * c.u)}" cy="${f(y - r(0.8, 3.4) * c.u)}" r="${f(c.flower * r(0.75, 1.2))}" fill="${cols[Math.floor(r(0, 3))]}"/>`; });
    o.push(dots); }

  // ---- 6: the line carries on past the lodge, along the bottom of the lake, and off the edge of the card
  // past the edge of the drawing it keeps the heading it had there
  const tail = D.lake.filter(p => p.mi >= M0).map(p => [X(p.mi), Y(p.ft)]), [qa, qb] = tail.slice(-2), yEdge = qb[1] + (qb[1] - qa[1]) / (qa[0] - qb[0]) * qb[0];
  const tD = 'M' + tail.map(([x, y]) => `${f(x)},${f(y)}`).join(' L') + ` L0,${f(yEdge)}`;
  o.push(from(6, `<path d="${tD}" fill="none" stroke="${INK}" stroke-width="${c.lineW}" stroke-linejoin="round"/>` + T(c.endX, yEdge + c.endDy, base(LB.end), { size: c.endSize, weight: 700, fill: CORAL_D, halo: PAPER, alts: alt(LB.end) })));
  // ---- the line itself, and the stops on it
  o.push(`<path d="M${line.map(([x, y]) => `${f(x)},${f(y)}`).join(' L')}" fill="none" stroke="${INK}" stroke-width="${c.lineW}" stroke-linejoin="round" stroke-linecap="round"/>`);
  o.push(tile(lx, ly, 'lodge', s) + tile(px, py, 'point', s) + ring(mx, my, s) + tile(hx, hy, 'hut', s) + tile(ex, ey, 'pass', s));

  // ---- 2: the stretch above the snowline where the unidentified tracks were reported
  o.push(between(2, 2, `<path d="M${line.filter(([x]) => x >= sx + 4 * c.u && x <= ex - 9 * c.u).map(([x, y]) => `${f(x)},${f(y - c.trackUp)}`).join(' L')}" fill="none" stroke="${CORAL}" stroke-width="${f(2.2 * c.dot)}" stroke-dasharray="0.1 ${f(5.4 * c.dot)}" stroke-linecap="round"/>`));
  // ---- the pin, where conditions were last reported: at the pass on the 13th, 0.4 miles out on the 16th, then here
  const top = 7.4 * s, pinX = X(LAST_MI), pinY = yAt(pinX);
  o.push(between(3, 3, pin(ex, ey - top, c.pinS)) + between(4, 4, pin(pinX, pinY, c.pinS)) + between(5, 5, pin(lx, ly - top, c.pinS)));
  const head = { 3: [ex, ey - top - PIN * c.pinS], 4: [pinX, pinY - PIN * c.pinS], 5: [lx, ly - top - PIN * c.pinS] };

  // ---- lettering on the drawing
  // red for the closure, as on the map; coral for the reports, as on the conditions card. Lettering on the ground is
  // backed with paper, lettering in the sky with the sky.
  const red = { size: c.small, weight: 700, fill: P.coralSh, halo: PAPER }, coral = { size: c.small, weight: 700, fill: CORAL_D, halo: PAPER, cls: false }, aloft = y => ({ ...coral, halo: sky(y) });
  if (wide) {
    // each stop's name, and its height under it
    const name = (x, y, k, anchor) => T(x, y, base(ST[k].name), { font: 'serif', size: c.name, anchor, halo: sky(y), alts: alt(ST[k].name), cls: !!alt(ST[k].name) });
    const ft = (x, y, k, anchor) => T(x, y, ST[k].ft, { size: c.small, fill: INK2, anchor, halo: sky(y), num: true, cls: false });
    const gap = c.small + 3.6;
    o.push(name(lx - 13, ly - 34, 'lodge', 'end') + ft(lx - 13, ly - 34 + gap, 'lodge', 'end'));
    o.push(name(px + 12, py - 44, 'point', 'start') + ft(px + 12, py - 44 + gap, 'point', 'start'));
    o.push(name(mx - 12, my - 40, 'meadows', 'end') + ft(mx - 12, my - 40 + gap, 'meadows', 'end'));
    o.push(name(X0 + 10, Y(S.ft.snowline) - 7, 'snowline', 'start') + ft(X0 + 10, Y(S.ft.snowline) + gap - 2, 'snowline', 'start'));
    o.push(name(hx - 13, hy - 11, 'hut', 'end'));
    // the pass on one line, its height after its name, so the pin's note can stand over it
    o.push(T(ex - 13, ey - 7, ST.pass.ft, { size: c.small, fill: INK2, anchor: 'end', halo: sky(ey), num: true, cls: false }) + T(ex - 13 - c.passGap, ey - 7, base(ST.pass.name), { font: 'serif', size: c.name, anchor: 'end', halo: sky(ey), cls: false }));
    // 2: the tracks, lettered under the stretch they were reported on
    o.push(between(2, 2, T(X(5.15), yAt(X(5.15)) + 38, at(LB.tracks, 2), { ...coral, anchor: 'middle' })));
    // 3 on: the closure, lettered on the closed ground
    o.push(between(3, 3, T(ex - 8, Y(CLOSED[0]) + 30, at(LB.closure, 3), { ...red, anchor: 'end', cls: false })) + from(4, T(X(3.75), Y(4560), at(LB.closure, 4), { ...red, anchor: 'middle', alts: { 5: at(LB.closure, 5) } })));
    // the pin's note: beside its head at the pass, above it once it is down by the lodge
    o.push(between(3, 3, T(head[3][0] - 17, head[3][1] - 2, at(LB.pin, 3), { ...aloft(head[3][1]), anchor: 'end' })));
    o.push(between(4, 4, leader(head[4][0], head[4][1] - 10, py - 74) + lines2(head[4][0] + 6, py - 99, c.small + 4, at(LB.pin, 4), { ...aloft(py - 90), anchor: 'end' }, 24)));
    o.push(between(5, 5, leader(head[5][0], head[5][1] - 10, py - 74) + T(head[5][0] + 6, py - 80, at(LB.pin, 5), { ...aloft(py - 80), anchor: 'end' })));
  } else {
    // on a phone the stops are listed under the profile, so the drawing carries only what changes
    o.push(between(2, 2, T(sx - 6, Y(8100), at(LB.tracks, 2), { ...aloft(Y(8100)), anchor: 'end' })));
    o.push(between(3, 3, T(X0 + 6, Y(CLOSED[0]) - 6, at(LB.closure, 3), { ...red, halo: sky(Y(CLOSED[0])), cls: false })) + from(4, lines2(X1 - 6, Y(5400), c.small + 3, at(LB.closure, 4), { ...red, anchor: 'end', alts: { 5: at(LB.closure, 5) } }, 17)));
    o.push(between(3, 3, T(head[3][0] - 15, head[3][1] + 4.6, at(LB.pin, 3), { ...aloft(head[3][1]), anchor: 'end' })));
    o.push(between(4, 4, leader(head[4][0], head[4][1] - 9, Y(7650)) + lines2(X0 + 6, Y(8350), c.small + 3.6, at(LB.pin, 4), aloft(Y(8100)), 24)));
    o.push(between(5, 5, leader(head[5][0], head[5][1] - 9, Y(5250)) + T(X0 + 6, Y(5450), at(LB.pin, 5), aloft(Y(5450)))));
  }

  // ---- the miles along the bottom
  let ticks = ''; for (let mi = 0; mi <= M1; mi++) ticks += `M${f(X(mi))},${PB} v6 `;
  for (let mi = 0.5; mi < M1; mi += 1) ticks += `M${f(X(mi))},${PB} v3.4 `;
  o.push(`<path d="M${X0},${PB} H${X1}" stroke="${INK}" stroke-width="1.3"/><path d="${ticks}" stroke="${INK}" stroke-width="1.1" fill="none"/>`);
  for (let mi = 0; mi <= M1; mi++) o.push(T(X(mi), PB + c.tickDy, String(mi), { anchor: 'middle', size: c.tick, fill: INK2, num: true, cls: false }));
  o.push(T((X(0) + X(S.mi.pass)) / 2, PB + c.tickDy + c.tick + 8, LB.miles, { anchor: 'middle', size: c.tick, fill: INK2, cls: false }));

  // ---- the stops listed under the profile (phone), and the notes at the foot
  if (wide) o.push(T(m, c.noteY, base(n1), { size: c.small, fill: INK2, cls: false }) + T(m, c.noteY + c.small + 6, base(n2), { size: c.small, fill: INK2, alts: alt(n2) }));
  else {
    const rows = [['lodge', tile(30, 0, 'lodge', 1.1)], ['point', tile(30, 0, 'point', 1.1)], ['meadows', ring(30, 0, 1.1)], ['snowline', snowMark(19, 0, 22)], ['hut', tile(30, 0, 'hut', 1.1)], ['pass', tile(30, 0, 'pass', 1.1)]];
    rows.forEach(([k, sym], i) => { const y = c.tableY + i * c.rowH;
      o.push(`<g transform="translate(0,${f(y - 6)})">${sym}</g>` + T(50, y, base(ST[k].name), { font: 'serif', size: c.name, alts: alt(ST[k].name), cls: !!alt(ST[k].name) }) + (ST[k].ft ? T(W - m, y, ST[k].ft, { size: c.small, anchor: 'end', num: true, cls: false }) : '') + rule(m, y + 11, W - m, y + 11, { opacity: 0.3 })); });
    const y0 = c.tableY + rows.length * c.rowH + 6, lh = c.small + 5;
    // the round trips, a sentence a line
    base(n1).split(/(?<=\.) /).forEach((l, i) => o.push(T(m, y0 + i * lh, l, { size: c.small, fill: INK2, cls: false })));
    o.push(lines2(m, y0 + 3 * lh + 6, lh, base(n2), { size: c.small, fill: INK2, alts: alt(n2) }, 44));
  }
  o.push(tooth(W, H, seed + 2, 0.7));
  return o.join('\n');
}

export function profile(){
  L.usePalette('gold'); L.begin();
  // the map's closure hatching, once for both layouts
  const hatch = L.nid('ph');
  L.defs.push(`<pattern id="${hatch}" width="7.2" height="7.2" patternUnits="userSpaceOnUse" patternTransform="rotate(-42)"><rect width="1" height="7.2" fill="${L.P.coralSh}" opacity="0.36"/></pattern>`);
  const wide = draw({ wide: true, W: 1100, H: 516, m: 28, title: 26, titleY: 50, sub: [354, 50], small: 15, name: 18, tick: 14, ruleY: 66, u: 1,
    X0: 84, X1: 1052, M0: -0.7, M1: 5.96, PT: 82, PB: 404, F0: 3000, F1: 9800,
    band: 7, treeStep: 6.4, treeH: 25, clear: 11, flowers: 2, flower: 1.7, beds: 26, lineW: 2.2, sym: 1.05, trackUp: 9, dot: 1, pinS: 1, passGap: 66,
    endX: 14, endDy: -11, endSize: 16, tickDy: 21, noteY: 476 }, 9600, hatch);
  const tall = draw({ wide: false, W: 360, H: 658, m: 18, title: 23, titleY: 42, sub: [18, 66], small: 14, name: 17.5, tick: 12.5, ruleY: 80, u: 0.6,
    X0: 50, X1: 344, M0: -0.7, M1: 5.96, PT: 96, PB: 300, F0: 3000, F1: 9800,
    band: 4.6, treeStep: 4.2, treeH: 15, clear: 7, flowers: 1, flower: 1.2, beds: 12, lineW: 1.8, sym: 0.82, trackUp: 6, dot: 0.8, pinS: 0.82,
    endX: 12, endDy: -10, endSize: 14.5, tickDy: 18, tableY: 368, rowH: 30 }, 9700, hatch);
  return twoLayouts(wide, tall, [1100, 516], [360, 658]);
}
