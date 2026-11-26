// The view down from Halloran Meadows, the painted scene on the Halloran Meadows trail page.
// The viewer stands at the lower edge of the meadows at golden hour and looks south-west down the straight line the
// story follows (bearing 222 degrees). Everything named stands on that line, so it runs straight down the middle of
// the picture: Echo Point below, Basin Lodge on its point, the crossing of the lake, Cedar Flats on the far shore,
// and the far ridge just left of Low Knob. The line is never drawn. The ground leads the eye down it: the wooded
// spurs on either hand close in on Echo Point, and the lit gable of the lodge and the clearing at Cedar Flats are the
// two pale marks one above the other in the middle of the lake.
// Through stage 3 nothing is wrong. At 4 a track of holes runs through the flowers from under our feet, aimed at the
// lodge, and the lodge is down to one small light. At 5 the lodge is dark, something is crossing the water (only
// the water's surface shows it), and there is a lane through the tents at Cedar Flats. At 6 the water is still and
// there is a gap in the trees on the far ridge where it left the park.
// Drawn as three parallax layers, like the lake picture: the sky and the far ranges; the basin; the meadow we stand on.
import * as L from './lib.mjs';
import { ribs, snowcaps } from './peaks.mjs';
import { conifer } from './conifers.mjs';
import { hummock } from './groundcover.mjs';
import { heightAt, onPath } from './scene-map.mjs';
const { f, lerp, mix, poly, curveFn, grain, GL, GR, from, until, between, linGrad, radGrad, clip, sliver } = L;

const W = 1200, H = 640, LOW = 720, YH = 190, CX = 600;     // LOW: layers overdraw below the frame so parallax never shows an edge

// ---------- where things are ----------
// The viewer stands on the line 140 map units (2.3 miles) from the pass, at the meadows' lower edge. A point on the
// map is placed on the page by how far ahead of the viewer it is and how far to the side, and by its height under the
// eye. The eye is lifted above the meadow's real 6,236 ft, the way a painter lifts it over a view he looks down into,
// so that Echo Point stands clear in front of the lodge instead of over it; and heights are drawn at a little under
// two thirds of the scale of distances across, so the lake lies across the view.
const V = onPath(140), DIR = [-0.669, 0.743], RT = [-DIR[1], DIR[0]], FT = 88, EYE = 7000, FX = 900, FY = 535;
// where on the page a place on the line stands: t is its distance from the pass in map units, h its height in feet
const onLine = (t, h) => { const p = onPath(t), fwd = (p[0] - V[0]) * DIR[0] + (p[1] - V[1]) * DIR[1]; return YH + FY * (EYE - h) / (fwd * FT); };
// the lake's long axis, carried on east past its head: ground south of it is on the far side of the water
const AXIS = [[-80, 500], [88, 470], [124, 465], [250, 440], [430, 385], [612, 318], [700, 284], [736, 268], [860, 218], [1100, 120]];
const axisY = x => { for (let i = 1; i < AXIS.length; i++) if (x <= AXIS[i][0]) { const a = AXIS[i - 1], b = AXIS[i]; return lerp(a[1], b[1], (x - a[0]) / (b[0] - a[0])); } return AXIS[AXIS.length - 1][1]; };
// distance bands, in miles: beyond the lake, and on this side of it
const BEYOND = [0, 2.6, 4.6, 6.3, 8.5, 99], NEAR = [0, 1.2, 1.9, 3.3, 99];
// Look along each column of the picture and walk out over the map's ground from near to far. For each band, the
// highest point of its ground on the page is its skyline in that column. The water seen in the column runs from the
// nearest stretch of lake in view to the farthest.
function survey(){
  const xs = [], B = BEYOND.slice(1).map(() => []), N = NEAR.slice(1).map(() => []), wT = [];
  for (let x = -12; x <= W + 12; x += 6) {
    const tn = (x - CX) / FX, n = Math.hypot(1, tn), d = [(DIR[0] + RT[0] * tn) / n, (DIR[1] + RT[1] * tn) / n];
    const b = B.map(() => null), nn = N.map(() => null); let low = 1e9, top = null;
    for (let u = 0.5; u < 1100; u += Math.max(0.2, u * 0.005)) {
      const px = V[0] + d[0] * u, py = V[1] + d[1] * u; if (px < -40 || py < -40 || px > 1040 || py > 740) break;
      let h = heightAt(px, py); const water = h < 3540; if (water) h = 3540;
      const y = YH + FY * (EYE - h) / (u / n * FT), mi = u / 60;
      if (!water) { const far = py > axisY(px), E = far ? BEYOND : NEAR, arr = far ? b : nn, k = E.findIndex((e, i) => mi >= e && mi < E[i + 1]); if (arr[k] === null || y < arr[k]) arr[k] = y; }
      if (y < low) { if (water) top = y; low = y; }
    }
    xs.push(x); b.forEach((v, i) => B[i].push(v)); nn.forEach((v, i) => N[i].push(v)); wT.push(top);
  }
  return { xs, B, N, wT };
}
// a skyline as runs of [x, y], smoothed, broken where the band has no ground in a column
function runs(xs, ys){
  const out = []; let cur = null;
  ys.forEach((y, i) => { if (y === null) { cur = null; return; } if (!cur) out.push(cur = []); cur.push([xs[i], y]); });
  return out.filter(run => run.length > 1).map(run => run.map(([x, y], i) => { const a = run[Math.max(0, i - 1)][1], c = run[Math.min(run.length - 1, i + 1)][1]; return [x, (a + 2 * y + c) / 4]; }));
}
const along = run => x => { if (x <= run[0][0]) return run[0][1]; for (let i = 1; i < run.length; i++) if (x <= run[i][0]) return lerp(run[i - 1][1], run[i][1], (x - run[i - 1][0]) / (run[i][0] - run[i - 1][0])); return run[run.length - 1][1]; };

// ---------- the kit's shapes, drawn from a random source of the picture's own ----------
// An outline through points, written as steps from one point to the next: a picture made of thousands of small trees
// takes about half the room this way.
const R1 = v => Math.round(v * 10) / 10;
function outline(pts){
  let px = R1(pts[0][0]), py = R1(pts[0][1]), d = `M${px},${py}l`;
  for (let i = 1; i < pts.length; i++) { const x = R1(pts[i][0]), y = R1(pts[i][1]); d += `${i > 1 ? ' ' : ''}${R1(x - px)},${R1(y - py)}`; px = x; py = y; }
  return d.replace(/ -/g, '-') + 'z';
}
// A small conifer seen from a long way off: a spire with a notch in each side; a taller, narrower one with two; or a
// round crown. Trees this small are drawn as outlines only; the whorl-by-whorl trees of conifers.mjs turn to wire at
// this size.
function spire(x, y, h, w, kind = 0){
  if (kind > 0.86) { const pts = []; for (let i = 0; i <= 6; i++) { const a = Math.PI * i / 6; pts.push([x - Math.cos(a) * w * 0.56, y - Math.sin(a) * h * (0.5 + 0.42 * Math.sin(a)) - (i && i < 6 ? h * 0.1 : 0)]); } return outline(pts); }
  if (kind > 0.6) { const hh = h * 1.3, ww = w * 0.8; return outline([[x - ww / 2, y], [x - ww * 0.2, y - hh * 0.36], [x - ww * 0.34, y - hh * 0.33], [x - ww * 0.1, y - hh * 0.66], [x - ww * 0.2, y - hh * 0.63], [x, y - hh], [x + ww * 0.2, y - hh * 0.63], [x + ww * 0.1, y - hh * 0.66], [x + ww * 0.34, y - hh * 0.33], [x + ww * 0.2, y - hh * 0.36], [x + ww / 2, y]]); }
  return outline([[x - w / 2, y], [x - w * 0.17, y - h * 0.5], [x - w * 0.36, y - h * 0.46], [x, y - h], [x + w * 0.36, y - h * 0.46], [x + w * 0.17, y - h * 0.5], [x + w / 2, y]]);
}
// A row of small trees along a line of ground, filled down to baseY, as lib's treeRow draws it. keep(x) false leaves
// a tree out.
function treeLine(x0, x1, yFn, { hMin, hMax, step, baseY = LOW, mixed = true, keep, r }){
  const ground = [[x0, baseY]]; for (let x = x0; x < x1; x += 8) ground.push([x, yFn(x)]); ground.push([x1, yFn(x1)], [x1, baseY]);
  let d = outline(ground);
  for (let x = x0 + r(0, step); x < x1; x += r(step * 0.6, step * 1.4)) {
    const h = r(hMin, hMax), w = h * r(0.4, 0.56), kind = mixed ? r() : 0.3;
    if ((keep && !keep(x)) || kind < 0.05) continue;
    const y = yFn(x) + 1.2;
    // trees only a few pixels high are plain points: the notches would not show
    d += hMax < 8 && kind > 0.16 ? outline([[x - w / 2, y], [x, y - h], [x + w / 2, y]]) : spire(x, y, h, w, kind < 0.16 ? 0.7 : kind < 0.26 ? 0.9 : 0.3);
  }
  return d;
}
// A mountain range with faceted lit and shaded sides, as lib's range draws it (the caps are left to snowcaps()).
function mountains(coarse, { baseY, lit, shadeColor, shadeOpacity, snowPeaks = [], amp = 5, seg = 30, ridgeZig = 12, r }){
  const SUN = L.SUN, jag = pts => { const out = [pts[0]]; for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / seg)); for (let k = 1; k < n; k++) { const t = k / n + r(-0.1, 0.1) / n; out.push([lerp(a[0], b[0], t) + r(-amp, amp) * 0.5, lerp(a[1], b[1], t) + r(-amp, amp)]); } out.push(b); } return out; };
  const sky = [], idx = [];
  for (let i = 0; i < coarse.length; i++) { if (i === 0) { sky.push(coarse[0]); idx.push(0); continue; } const part = jag([coarse[i - 1], coarse[i]]); for (let k = 1; k < part.length; k++) sky.push(part[k]); idx.push(sky.length - 1); }
  const body = poly([[sky[0][0], baseY], ...sky, [sky[sky.length - 1][0], baseY]]), cid = clip(body), peaks = [];
  let shadeD = '';
  for (let i = 1; i < coarse.length - 1; i++) {
    const [px, py] = coarse[i]; if (!(py < coarse[i - 1][1] && py < coarse[i + 1][1])) continue;
    const dir = px < SUN.x ? -1 : 1; let j = i; while (coarse[j + dir] && coarse[j + dir][1] > coarse[j][1]) j += dir;
    let edge = sky.slice(Math.min(idx[i], idx[j]), Math.max(idx[i], idx[j]) + 1); if (dir < 0) edge = edge.reverse();
    const valley = edge[edge.length - 1], hgt = baseY - py, ridge = [], steps = Math.max(2, Math.round(hgt / 58));
    for (let k = 1; k <= steps; k++) { const t = k / steps; ridge.push([px - dir * hgt * 0.10 * t + (k % 2 ? 1 : -1) * dir * ridgeZig * (0.4 + 0.5 * t) * r(0.6, 1.1), py + hgt * t]); }
    const gh = baseY - valley[1], gs = Math.max(2, Math.round(gh / 54)), gully = [];
    for (let k = 1; k <= gs; k++) { const t = k / gs; gully.push([valley[0] + dir * gh * 0.22 * t + (k % 2 ? 1 : -1) * ridgeZig * 0.4 * r(0.5, 1), valley[1] + gh * t]); }
    shadeD += poly([[px, py], ...edge.slice(1), ...gully, ...ridge.slice().reverse()]) + ' ';
    let j2 = i; while (coarse[j2 - dir] && coarse[j2 - dir][1] > coarse[j2][1]) j2 -= dir; let el = sky.slice(Math.min(idx[i], idx[j2]), Math.max(idx[i], idx[j2]) + 1); if (dir > 0) el = el.reverse();
    peaks.push({ x: px, y: py, dir, edge, edgeLit: el, ridge, hgt, snow: snowPeaks.includes(i) });
  }
  return { svg: `<path d="${body}" fill="${lit}"/><g clip-path="url(#${cid})"><path d="${shadeD}" fill="${shadeColor}" opacity="${shadeOpacity}"/></g>`, body, cid, peaks, shadeD };
}
// A smooth line through points [x, y, width].
const dense = (pts, n = 8) => { const out = [], at = i => pts[Math.max(0, Math.min(pts.length - 1, i))]; for (let i = 0; i < pts.length - 1; i++) for (let k = 0; k < n; k++) { const t = k / n, a = at(i - 1), b = at(i), c = at(i + 1), e = at(i + 2); out.push([0, 1, 2].map(j => 0.5 * (2 * b[j] + (c[j] - a[j]) * t + (2 * a[j] - 5 * b[j] + 4 * c[j] - e[j]) * t * t + (3 * b[j] - 3 * c[j] + e[j] - a[j]) * t * t * t))); } out.push(pts[pts.length - 1]); return out; };
// A blade of grass from its root at (x, y): hh high, its tip carried lean to the side, bw wide at the root. Written
// as steps from the root, which takes about two thirds of the room.
function blade(x, y, hh, lean, bw){
  const sx = R1(x - bw), sy = R1(y), ex = R1(x + lean), ey = R1(y - hh), q = (a, b) => `${R1(a)},${R1(b)}`;
  return `M${sx},${sy}q${q(x + lean * 0.15 - bw * 0.6 - sx, -hh * 0.6 + y - sy)} ${q(ex - sx, ey - sy)}q${q(x + lean * 0.3 + bw - ex, y - hh * 0.5 - ey)} ${q(x + bw - ex, y - ey)}z`.replace(/ -/g, '-');
}
// A clump of grass, and a wildflower, as the meadow picture draws them.
function tuft(x, y, s, r){
  let a = '', b = '';
  for (let k = 0, n = 4 + Math.floor(r(0, 5)); k < n; k++) {
    const bx = x + r(-0.16, 0.16) * s, hh = s * r(0.42, 1), lean = r(-0.5, 0.5) * hh, bw = Math.max(0.8, s * r(0.03, 0.055));
    const d = blade(bx, y, hh, lean, bw);
    if (r() < 0.3) b += d; else a += d;
  }
  return [a, b];
}
function flower(kind, x, y, s, C, r){
  const sw = f(Math.max(0.6, s * 0.035)), lean = r(-0.18, 0.18) * s, tx = x + lean, ty = y - s;
  const stem = `<path d="M${f(x)},${f(y)} Q${f(x + lean * 0.2)},${f(y - s * 0.6)} ${f(tx)},${f(ty)}" fill="none" stroke="${C.stem}" stroke-width="${sw}" stroke-linecap="round"/>`;
  const leaf = `<path d="M${f(x + lean * 0.3)},${f(y - s * 0.34)} q${f(s * 0.16)},${f(-s * 0.1)} ${f(s * 0.24)},${f(-s * 0.02)} q${f(-s * 0.1)},${f(s * 0.07)} ${f(-s * 0.24)},${f(s * 0.02)}Z" fill="${C.stem}"/>`;
  if (kind === 'daisy') { const rr = Math.max(2, s * 0.17), pts = []; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, k = i % 2 ? 0.42 : 1; pts.push([tx + Math.cos(a) * rr * k, ty + Math.sin(a) * rr * k * 0.72]); } return stem + leaf + `<path d="${poly(pts)}" fill="${C.cream}" stroke="${C.cream}" stroke-width="${f(rr * 0.3)}" stroke-linejoin="round"/><ellipse cx="${f(tx)}" cy="${f(ty)}" rx="${f(rr * 0.34)}" ry="${f(rr * 0.27)}" fill="${C.gold}"/>`; }
  if (kind === 'paintbrush') { let p = '', q = ''; for (let i = 0; i < 6; i++) { const t = i / 5, px = lerp(x + lean * 0.6, tx, t), py = lerp(y - s * 0.62, ty, t), w = s * 0.07 * (1 - 0.5 * t) + 0.7, e = `<ellipse cx="${f(px + (i % 2 ? -1 : 1) * w * 0.4)}" cy="${f(py)}" rx="${f(w)}" ry="${f(w * 1.3)}"/>`; if (i % 2) q += e; else p += e; } return stem + leaf + `<g fill="${C.coral}">${p}</g><g fill="${C.coralSh}">${q}</g>`; }
  if (kind === 'lupine') {
    let p = '', q = ''; const n = 7;
    for (let i = 0; i < n; i++) { const t = i / (n - 1), px = lerp(x + lean * 0.5, tx, t), py = lerp(y - s * 0.45, ty, t), w = s * 0.085 * (1 - 0.65 * t) + 0.7, e = `<ellipse cx="${f(px + (i % 2 ? -1 : 1) * w * 0.55)}" cy="${f(py)}" rx="${f(w)}" ry="${f(w * 0.72)}"/>`; if (i % 3 === 0) q += e; else p += e; }
    let lf = ''; for (let i = 0; i < 5; i++) { const a = lerp(-1.2, 1.2, i / 4); lf += `M${f(x + lean * 0.2)},${f(y - s * 0.28)} l${f(Math.sin(a) * s * 0.2)},${f(-Math.cos(a) * s * 0.13)} `; }
    return stem + `<path d="${lf}" stroke="${C.stem}" stroke-width="${f(Math.max(0.8, s * 0.05))}" stroke-linecap="round" fill="none"/><g fill="${C.violet}">${p}</g><g fill="${C.lilac}">${q}</g>`;
  }
  if (kind === 'umbel') { let rays = '', dots = ''; for (let i = 0; i < 5; i++) { const a = lerp(-0.9, 0.9, i / 4), rx = tx + Math.sin(a) * s * 0.26, ry = ty - Math.cos(a) * s * 0.1 + s * 0.02; rays += `M${f(tx)},${f(ty + s * 0.16)} L${f(rx)},${f(ry)} `; for (let j = 0; j < 3; j++) dots += `<circle cx="${f(rx + r(-1, 1) * s * 0.06)}" cy="${f(ry + r(-1, 0.4) * s * 0.035)}" r="${f(Math.max(0.9, s * 0.04))}"/>`; } return stem + `<path d="${rays}" stroke="${C.stem}" stroke-width="${f(Math.max(0.5, s * 0.022))}" fill="none"/><g fill="${C.cream}">${dots}</g>`; }
  let cups = '';
  for (const [dx, dy] of [[0, 0], [-0.2, 0.22], [0.22, 0.3]]) { const cx = tx + dx * s, cy = ty + dy * s, rr = Math.max(1.4, s * 0.11); cups += `<path d="M${f(x + lean * 0.4)},${f(y - s * 0.5)} L${f(cx)},${f(cy)}" stroke="${C.stem}" stroke-width="${sw}" fill="none"/><circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rr)}" fill="${C.gold}"/><circle cx="${f(cx)}" cy="${f(cy + rr * 0.15)}" r="${f(rr * 0.4)}" fill="${C.goldSh}"/>`; }
  return stem + leaf + cups;
}

// One of the holes along the track, seen from behind as we look down the line: punched through the turf, with the sod
// torn up round it in lumps and flaps that catch the low sun along their tops, the far wall of the hole facing us in
// its own shade with roots hanging out of it, the bottom dark, and clods thrown out round it. Drawn about a circle and
// flattened by k, the more so the farther off it is. Each hole is torn differently.
function hole(x, y, s, k, C, seed){
  const r = L.source(seed), ring = (rad, j) => { const pts = []; for (let i = 0; i < 20; i++) { const a = i / 20 * 6.2832; pts.push([Math.cos(a) * rad * (1 + r(-j, j)), Math.sin(a) * rad * (1 + r(-j, j))]); } return pts; };
  const rim = ring(28, 0.12), mouth = ring(20.5, 0.07), top = mouth.filter(p => p[1] <= 0.5).sort((a, b) => a[0] - b[0]);
  // the far wall: from the near edge of the mouth's far half down to a line across the hole
  const wall = poly([...top, ...top.slice().reverse().map(([px, py]) => [px * 0.9, py * 0.55 + 1])]);
  let flaps = '', flapSh = '', clods = '', roots = '';
  for (let i = 0; i < 5; i++) { const a = (i / 5 + r(-0.06, 0.06)) * 6.2832, c = Math.cos(a), sn = Math.sin(a), d0 = r(24, 28), d1 = d0 + r(7, 12), w = r(4, 7), q = [[c * d0 - sn * w, sn * d0 + c * w], [c * d1 - sn * w * 0.6, sn * d1 + c * w * 0.7], [c * d1 + sn * w * 0.7, sn * d1 - c * w * 0.6], [c * d0 + sn * w, sn * d0 - c * w]]; flaps += poly(q) + ' '; flapSh += poly([q[1], q[2], [q[2][0], q[2][1] + 2.6], [q[1][0], q[1][1] + 2.6]]) + ' '; }
  for (let i = 0; i < 9; i++) { const a = r(0, 6.2832), d = r(32, 46), cx = Math.cos(a) * d, cy = Math.sin(a) * d, rr = r(1.2, 2.8); clods += `<ellipse cx="${f(cx - rr * 0.7)}" cy="${f(cy + rr)}" rx="${f(rr * 1.3)}" ry="${f(rr * 0.9)}" fill="${C.cast}"/><path d="${poly([[cx - rr, cy], [cx - rr * 0.3, cy - rr], [cx + rr, cy - rr * 0.4], [cx + rr * 0.7, cy + rr * 0.6]])}" fill="${C.wall}"/><circle cx="${f(cx + rr * 0.2)}" cy="${f(cy - rr * 0.4)}" r="${f(rr * 0.5)}" fill="${C.clod}"/>`; }
  for (let i = 0; i < 6; i++) { const px = r(-15, 15), py = -Math.sqrt(Math.max(0, 420 - px * px)) * 0.95 + 1; roots += `M${f(px)},${f(py)} q${f(r(-2, 2))},${f(r(3, 6))} ${f(r(-3, 3))},${f(r(6, 12))} `; }
  return `<g transform="translate(${f(x)},${f(y)}) scale(${f(s)},${f(s * k)})"><ellipse cx="-7" cy="11" rx="36" ry="30" fill="${C.cast}"/><path d="${poly(rim)}" fill="${C.rimSh}"/><path d="${poly(rim.map(([px, py]) => [px, py - 3]).filter(p => p[1] < 4))}" fill="${C.rim}"/><path d="${flapSh}" fill="${C.wall}"/><path d="${flaps}" fill="${C.rim}"/><path d="${poly(mouth)}" fill="${C.deep}"/><path d="${wall}" fill="${C.wall}"/><path d="M${top.map(([px, py]) => `${f(px)},${f(py)}`).join(' L')}" fill="none" stroke="${C.wallLit}" stroke-width="1.4"/><path d="${roots}" fill="none" stroke="${C.clod}" stroke-width="0.8" opacity="0.7"/><ellipse cy="10" rx="12" ry="6" fill="${C.floor}"/>${clods}</g>`;
}

export function vista(){
  L.usePalette('gold'); L.begin(); L.setSun({ x: 1046, y: 134, r: 23 });
  const P = L.P, SUN = L.SUN, sky = [], mid = [], fg = [];
  const S = survey();
  // the places on the line, where the projection puts them: the rail at Echo Point (3.5 miles from the pass, 4,330 ft),
  // the lodge (4.0 miles, at the lake; its gable stands at the water's edge of its point) and Cedar Flats (5.75 miles)
  const EY = Math.round(onLine(208, 4330)), LX = CX, LY = Math.round(onLine(238, 3540)) - 4, FL = Math.round(onLine(345, 3575));
  // how thickly trees stand along the slope below the lip: in clumps, with gaps between
  const clump = x => 0.5 + 0.5 * Math.sin(x / 41) * Math.sin(x / 17 + 2);
  // an outline stored once and drawn twice: in a light tone nudged toward the sun, and in its own tone over that, so
  // a thin edge of light runs down the sunward side of everything
  const twice = (d, rim, tone, k = 1.4, op = 1) => { const id = L.shared(d); return `<use href="#${id}" fill="${rim}" transform="translate(${k},${f(-k * 0.4)})"${op !== 1 ? ` opacity="${op}"` : ''}/><use href="#${id}" fill="${tone}"/>`; };

  // ================= SKY =================
  sky.push(`<rect x="0" y="-60" width="${W}" height="${YH + 160}" fill="url(#${linGrad(0, -40, 0, YH + 24, [[0, P.skyTop], [0.36, P.skyMid], [0.74, P.skyLow], [1, P.skyHorizon]])})"/>`);
  sky.push(grain(0, -60, W, 280, GL(0, -40, 0, 200, [[0, 0.36], [0.5, 0.12], [1, 0]]), P.grainSky));
  sky.push(`<circle cx="${SUN.x}" cy="${SUN.y}" r="620" fill="url(#${radGrad(SUN.x, SUN.y, 620, [[0, P.sun, 0.85], [0.16, P.cream, 0.52], [0.5, P.cream, 0.18], [1, P.cream, 0]])})"/>`);
  sky.push(grain(SUN.x - 540, -60, 700, YH + 140, GR(SUN.x, SUN.y, 560, [[0, 0.24], [0.4, 0.14], [1, 0]]), P.sun, { opacity: 0.8 }));
  sky.push(L.cloud(316, 74, 0.9, [[0, 0, 200, 22], [44, 17, 290, 26], [-20, 37, 170, 20]]) + L.cloud(742, 50, 0.6, [[0, 0, 170, 20], [-24, 15, 240, 24]]) + L.cloud(92, 134, 0.48, [[0, 0, 180, 20], [30, 15, 230, 22]]) + L.cloud(886, 112, 0.46, [[0, 0, 210, 22], [36, 17, 250, 24]]));
  sky.push(`<g fill="${P.sun}"><circle cx="${SUN.x}" cy="${SUN.y}" r="${SUN.r + 58}" opacity="0.12"/><circle cx="${SUN.x}" cy="${SUN.y}" r="${SUN.r + 30}" opacity="0.2"/><circle cx="${SUN.x}" cy="${SUN.y}" r="${SUN.r + 12}" opacity="0.34"/><circle cx="${SUN.x}" cy="${SUN.y}" r="${SUN.r}"/></g>`);
  // birds going over, until the animals have gone
  { let b = ''; for (const [x, y, s] of [[452, 118, 1], [476, 108, 0.8], [430, 130, 0.85], [500, 122, 0.66], [410, 114, 0.6], [522, 102, 0.55]]) b += `M${f(x - 7 * s)},${f(y + 1 * s)} Q${f(x - 3.5 * s)},${f(y - 4.4 * s)} ${x},${y} Q${f(x + 3.5 * s)},${f(y - 4.4 * s)} ${f(x + 7 * s)},${f(y + 1 * s)} `;
    sky.push(until(3, `<path d="${b}" fill="none" stroke="${P.plum}" stroke-width="1.5" stroke-linecap="round" opacity="0.75"/>`)); }
  // ---- the ranges beyond the park: a far one under snow, and a lower one in front of it. Both drop out of sight
  // behind the south wall in the middle, so that the far ridge on the line stands against the sky.
  {
    const r = L.source(3101);
    const far = mountains([[-20, 170], [40, 138], [118, 162], [196, 122], [266, 158], [330, 144], [400, 178], [470, 172], [540, 214], [700, 218], [760, 184], [828, 164], [884, 186], [950, 156], [1010, 198], [1080, 190], [1150, 136], [1220, 172]], { baseY: YH + 70, lit: P.farLit, shadeColor: P.farShade, shadeOpacity: 0.34, snowPeaks: [3, 5, 13, 16], amp: 4, seg: 26, r });
    const caps = snowcaps(far.peaks, 3107), rb = ribs(far.peaks, 3109, 0.8), lift = mix(P.farLit, P.cream, 0.6);
    sky.push(far.svg + `<g clip-path="url(#${far.cid})"><path d="${caps}" fill="${P.snow}"/><path d="${far.shadeD}" fill="${P.farShade}" fill-opacity="0.34" clip-path="url(#${clip(caps)})"/><path d="${rb.cut}" fill="${P.farShade}" fill-opacity="0.17"/><path d="${rb.deep}" fill="${P.farShade}" fill-opacity="0.2"/><path d="${rb.lift}" fill="${lift}" fill-opacity="0.3"/><path d="${rb.fluteLit}" fill="none" stroke="${P.farShade}" stroke-opacity="0.22" stroke-width="1" stroke-linecap="round"/></g>`);
    sky.push(`<path d="${rb.rim}" fill="none" stroke="${P.sun}" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round" opacity="0.9"/>`);
    sky.push(`<rect x="0" y="110" width="${W}" height="${YH - 40}" fill="url(#${linGrad(0, 120, 0, YH + 20, [[0, P.cream, 0], [1, P.cream, 0.7]])})" clip-path="url(#${far.cid})"/>`);
    const near = mountains([[-20, 188], [70, 174], [150, 192], [236, 170], [318, 190], [400, 184], [470, 202], [540, 222], [700, 224], [790, 198], [870, 184], [960, 202], [1040, 194], [1130, 180], [1220, 194]], { baseY: YH + 70, lit: P.midLit, shadeColor: P.midShade, shadeOpacity: 0.4, amp: 3, seg: 24, ridgeZig: 8, r });
    const nb = ribs(near.peaks, 3111, 0.6);
    sky.push(near.svg + `<g clip-path="url(#${near.cid})"><path d="${nb.cut}" fill="${P.midShade}" fill-opacity="0.2"/><path d="${nb.lift}" fill="${mix(P.midLit, P.peach, 0.45)}" fill-opacity="0.22"/></g><path d="${nb.rim}" fill="none" stroke="${mix(P.midLit, P.cream, 0.5)}" stroke-width="1" stroke-linejoin="round" opacity="0.7"/>`);
    sky.push(`<rect x="0" y="160" width="${W}" height="100" fill="url(#${linGrad(0, 168, 0, YH + 26, [[0, P.peach, 0], [1, P.cream, 0.78]])})" clip-path="url(#${near.cid})"/>`);
  }

  // ================= THE BASIN =================
  // ---- the south wall of the lake, in bands that pale as they recede. Each band is its skyline from the survey with
  // a fringe of treetops along it, a lit edge toward the sun, and the evening haze gathering below it.
  const band = (run, tone, { hMin, hMax, step, seed, edge = 1.2, haze = 0.36, hazeTone = P.cream, keep, rows = 0, rowTone }) => {
    const yFn = along(run), x0 = run[0][0], x1 = run[run.length - 1][0], r = L.source(seed), d = treeLine(x0, x1, yFn, { hMin, hMax, step, keep, r }), id = L.shared(d), ya = Math.min(...run.map(p => p[1])) - hMax;
    const hz = linGrad(0, ya + hMax, 0, ya + hMax + 90, [[0, hazeTone, 0], [1, hazeTone, haze]]), cid = L.clipTo(id);
    // rows of treetops further down the slope, each a little larger, so the band reads as forest and not as card
    let more = '';
    for (let j = 1; j <= rows; j++) more += `<path d="${treeLine(x0, x1, x => yFn(x) + j * hMax * 1.3 + 3 * Math.sin(x * 0.02 + j * 2), { hMin: hMin * (1 + j * 0.25), hMax: hMax * (1 + j * 0.25), step: step * (1 + j * 0.2), keep, r })}" fill="${rowTone ?? mix(tone, P.ink, 0.12)}" opacity="0.55"/>`;
    return `<use href="#${id}" fill="${mix(tone, P.peach, 0.42)}" transform="translate(${edge},${f(-edge * 0.5)})"/><use href="#${id}" fill="${tone}"/><g clip-path="url(#${cid})">${more}<rect x="${x0}" y="${f(ya)}" width="${x1 - x0}" height="${f(LOW - ya)}" fill="url(#${hz})"/></g>`;
  };
  // Low Knob: the rounded summit just right of the line on the far ridge. NOTCH and NW: how deep the gap on the line
  // is at stage 6, and half its width.
  const NOTCH = 13, NW = 26, KNOB = [636, 17, 44], knobUp = x => KNOB[1] * Math.exp(-(((x - KNOB[0]) / KNOB[2]) ** 2));
  const farTone = [mix(P.haze, P.teal, 0.56), mix(P.haze, P.teal, 0.34), mix(P.haze, P.midLit, 0.32), mix(P.haze, P.farLit, 0.42), mix(P.haze, P.farLit, 0.6)];
  const farTrees = [[7, 13, 9], [5.4, 10, 7.5], [4.4, 8.4, 6.5], [3.8, 7, 5.4], [3.4, 6.4, 4.6]];
  let crest = null, crestTop = 0;
  // The trees on the far ridge where the line crosses it are drawn apart from the rest, so that at stage 6 they can
  // be gone. Drawn straight after the far ridge, before the nearer bands come in front of it.
  const notch = () => {
    const notchTrees = treeLine(CX - NW + 1, CX + NW - 1, crest, { hMin: 5.4, hMax: 8, step: 4.4, r: L.source(3260), mixed: false }).replace(/^M[^z]*z/, '');
    // Until stage 6 the gap is filled: the ground of the ridge, with its lit edge, and the trees standing on it. At 6
    // they are gone and the evening sky shows through, with bare ground and the pale of broken wood across its foot.
    { const c = crest(CX), V = x => crest(x) + NOTCH * Math.max(0, 1 - Math.abs(x - CX) / NW), fill = [], edge = [];
      for (let x = CX - NW - 1; x <= CX + NW + 1; x += 2) { fill.push([x, crest(x)]); edge.push(`${f(x)},${f(crest(x))}`); }
      for (let x = CX + NW + 1; x >= CX - NW - 1; x -= 2) fill.push([x, V(x) + 1.8]);
      mid.push(until(5, `<path d="M${edge.join(' L')}" fill="none" stroke="${mix(farTone[4], P.peach, 0.42)}" stroke-width="1.2" transform="translate(1.2,-0.6)"/><path d="${poly(fill)}" fill="url(#${linGrad(0, crestTop, 0, crestTop + 90, [[0, farTone[4]], [1, mix(farTone[4], P.cream, 0.26)]])})"/>` + twice(notchTrees, mix(farTone[4], P.peach, 0.42), farTone[4], 1.2)));
      const foot = c + NOTCH, wood = mix(P.cream, P.peach, 0.4);
      mid.push(from(6, `<path d="M${CX - 8},${f(V(CX - 8) + 0.6)} Q${CX},${f(foot - 2.6)} ${CX + 8},${f(V(CX + 8) + 0.6)} L${CX + 8},${f(V(CX + 8) + 1.6)} Q${CX},${f(foot + 0.4)} ${CX - 8},${f(V(CX - 8) + 1.6)}Z" fill="${mix(P.cream, P.peach, 0.55)}" opacity="0.75"/><path d="M${CX - 7},${f(foot - 2.4)} l5,1.4 M${CX - 1.6},${f(foot - 0.6)} l5,-1 M${CX + 3},${f(foot - 2.2)} l4.4,-1.6 M${CX - 10},${f(V(CX - 10) - 0.6)} l3,1.2" stroke="${wood}" stroke-width="0.8" stroke-linecap="round"/>`)); }
  };
  for (let k = S.B.length - 1; k >= 0; k--) runs(S.xs, S.B[k]).forEach((run, j) => {
    const top = k === S.B.length - 1;
    if (top) { run = run.map(([x, y]) => [x, y - knobUp(x)]); crest = along(run); crestTop = Math.min(...run.map(p => p[1])); run = run.map(([x, y]) => [x, y + NOTCH * Math.max(0, 1 - Math.abs(x - CX) / NW)]); }
    // the near shore under the east wall comes down in spurs, rising toward the head of the lake
    if (k === 0) run = run.map(([x, y]) => [x, y + 7 * Math.sin(x / 34) + 4 * Math.sin(x / 13 + 1) - 16 * Math.max(0, 1 - x / 460)]);
    const [hMin, hMax, step] = farTrees[k];
    mid.push(band(run, farTone[k], { hMin, hMax, step, seed: 3200 + k * 10 + j, haze: 0.46 - k * 0.05, rows: k === 1 ? 4 : k === 2 || k === 0 ? 1 : 0, rowTone: k === 1 ? mix(farTone[1], P.plum, 0.32) : undefined, keep: top ? (x => Math.abs(x - CX) > NW - 1) : null }));
    if (top) notch();
  });

  // ---- the lake. Seen from this high, the water gives back the sky above the far ridge, warm and pale toward the
  // far shore and bluer under us; brightest down the reach toward the sun.
  const lakeRuns = runs(S.xs, S.wT), shoreAt = x => { const i = Math.max(0, Math.min(S.wT.length - 1, Math.round((x + 12) / 6))); return S.wT[i]; };
  const lakeId = L.shared(lakeRuns.map(run => poly([...run, [run[run.length - 1][0], LOW], [run[0][0], LOW]])).join(' ')), lakeClip = L.clipTo(lakeId);
  const wk = y => Math.max(0.12, (y - YH) / 200);                 // how large a mark on the water is, by how near
  {
    const wg = linGrad(0, 220, 0, 600, [[0, mix(P.lake[0], P.skyHorizon, 0.4)], [0.16, mix(P.lake[0], P.lake[1], 0.6)], [0.3, mix(P.lake[1], P.lake[2], 0.45)], [0.5, mix(P.lake[2], P.lake[3], 0.35)], [0.75, mix(P.lake[3], P.teal, 0.4)], [1, mix(P.teal, P.tealDeep, 0.3)]]);
    const lk = [];
    lk.push(`<use href="#${lakeId}" fill="url(#${wg})"/>`);
    // the sheen down the reach under the sun
    const sheen = (cx, cy, rx, ry, a0) => { const id = L.nid('rg'); L.defs.push(`<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="translate(${cx},${cy}) scale(${rx},${ry})"><stop offset="0" stop-color="${P.sun}" stop-opacity="${a0}"/><stop offset="0.5" stop-color="${P.sun}" stop-opacity="${f(a0 * 0.4)}"/><stop offset="1" stop-color="${P.sun}" stop-opacity="0"/></radialGradient>`); return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${id})"/>`; };
    lk.push(sheen(1010, 236, 420, 60, 0.75) + sheen(1030, 232, 120, 14, 0.9));
    // the far shore given back upside down: a dark band under it, ragged where the treetops hang down, broken where
    // the clearing at Cedar Flats is
    { const r = L.source(3401); let d = '';
      for (const run of lakeRuns) { const top = run.map(([x, y]) => [x, y - 0.6]), bot = [];
        for (let x = run[run.length - 1][0]; x >= run[0][0]; x -= r(2.4, 4.4)) { const y = along(run)(x), flat = Math.abs(x - 603) < 46 ? 0.35 : 1; bot.push([x, y + (2 + 0.17 * (y - 200)) * r(0.55, 1) * flat]); }
        d += poly([...top, ...bot]) + ' '; }
      lk.push(`<path d="${d}" fill="${mix(P.lake[3], P.plum, 0.4)}" opacity="0.34"/>`); }
    // marks on the surface: long low swells, slits of open water, ripples bright on the crest and dark behind, and
    // two places where a breath of wind is on the water
    { const r = L.source(3403), lit = ['', ''], yAt = () => lerp(214, 580, Math.pow(r(), 1.3));
      let sw = '', dark = '', fleck = '';
      for (let k = 0; k < 230; k++) { const y = yAt(), x = r(-20, W), t = wk(y), w = r(8, 46) * t, th = Math.max(0.45, 1.1 * t * r(0.6, 1.2)); if (y < shoreAt(x) + 3) continue; lit[k % 2] += sliver(x, y, w, th, th * r(-0.6, 0.6)); if (r() < 0.5) dark += sliver(x + w * r(0.1, 0.3), y + th * 1.8, w * r(0.6, 1), th, 0); }
      for (let k = 0; k < 26; k++) { const y = yAt(), x = r(-60, W - 100), t = wk(y), w = r(120, 320) * t; if (y < shoreAt(x) + 5) continue; const n = 3 + Math.floor(r(0, 3)), seg = w / n, amp = 1.4 * t, th = 0.8 * t; let d = `M${f(x)},${f(y)}`; for (let i = 0; i < n; i++) d += `Q${f(x + seg * (i + 0.5))},${f(y + (i % 2 ? amp : -amp))} ${f(x + seg * (i + 1))},${f(y)}`; for (let i = n - 1; i >= 0; i--) d += `Q${f(x + seg * (i + 0.5))},${f(y + (i % 2 ? amp : -amp) + th * 2 * Math.sin(Math.PI * (i + 0.5) / n))} ${f(x + seg * i)},${f(y + th * Math.sin(Math.PI * i / n))}`; sw += d + 'Z'; }
      for (const [cx, cy, rx, ry, n] of [[250, 452, 130, 12, 40], [820, 300, 120, 7, 30]]) for (let k = 0; k < n; k++) { const a = r(0, 6.283), q = Math.sqrt(r()), x = cx + Math.cos(a) * rx * q, y = cy + Math.sin(a) * ry * q, t = wk(y); fleck += sliver(x, y, r(4, 12) * t, 0.7 * t + 0.3, 0); }
      lk.push(`<g fill="${P.cream}"><path d="${sw}" opacity="0.22"/><path d="${lit[0]}" opacity="0.3"/><path d="${lit[1]}" opacity="0.48"/><path d="${fleck}" opacity="0.4"/></g><path d="${dark}" fill="${P.tealDeep}" opacity="0.2"/>`);
      // the sun on the water far down the reach: a run of flashes under it
      let gl = ['', ''];
      for (let k = 0; k < 70; k++) { const y = lerp(222, 252, Math.pow(r(), 1.6)), spread = 18 + (y - 222) * 2.4, x = SUN.x - 6 + r(-1, 1) * spread, w = r(4, 16) * (1 - Math.abs(x - SUN.x) / (spread + 40)); if (y < shoreAt(x) + 1 || w < 1.5) continue; gl[k % 3 ? 0 : 1] += sliver(x - w / 2, y, w, r(0.5, 1.1), 0); }
      lk.push(`<g fill="${P.sun}"><path d="${gl[0]}" opacity="0.7"/><path d="${gl[1]}" opacity="1"/></g>`); }
    lk.push(grain(0, 300, W, 320, GL(0, 300, 0, 600, [[0, 0], [0.6, 0.1], [1, 0.3]]), P.ink));
    // stage 5: something is crossing the water on the line, from the lodge's shore out toward Cedar Flats. Only the
    // water shows it: a seam of broken water running straight out from the point, the sky in the water broken up
    // either side of it, and rings spreading from where it has stepped, oldest and widest near the shore. At the head
    // of the seam, part-way across, the rings are fresh and the water is still heaving.
    { const r = L.source(3410), y0 = LY - 15, y1 = Math.round(lerp(y0, FL + 6, 0.58)), flat = y => (y - YH) / FX, crestC = mix(P.cream, P.sun, 0.3), trough = mix(P.lake[3], P.tealDeep, 0.7);
      let chop = '', dark = '', rings = '', troughs = '';
      // the sky in the water broken up either side of the line: more dark than light, as broken water looks
      for (let k = 0; k < 120; k++) { const y = lerp(y1 - 2, y0 + 2, Math.pow(r(), 0.85)), t = wk(y), x = CX + (r() < 0.5 ? -1 : 1) * Math.pow(r(), 1.5) * (6 + 22 * t), w = r(3, 8) * t + 1, d = sliver(x - w / 2, y, w, 0.35 + 0.45 * t, r(-0.3, 0.3)); if (k % 3) dark += d; else chop += d; }
      // rings, each set a bright crest with its dark trough just behind it: wide and faint where it went in, small and
      // sharp at the head
      for (const u of [0.1, 0.34, 0.58, 0.8, 0.96]) { const y = lerp(y0, y1, u), a = 1 - u, t = wk(y); for (let i = 0; i < 2; i++) { const rx = (5 + 26 * a + i * (6 + 9 * a)) * t, ry = Math.max(0.9, rx * flat(y)), e = (dy, o) => '<ellipse cx="' + CX + '" cy="' + f(y + dy) + '" rx="' + f(rx) + '" ry="' + f(ry) + '" opacity="' + f(o) + '"/>'; rings += e(0, (0.95 - a * 0.4) * (1 - i * 0.25)); troughs += e(1 + 0.6 * t, (0.75 - a * 0.3) * (1 - i * 0.25)); } }
      const seam = `M${CX - 2.2},${y0} L${CX - 0.5},${y1} L${CX + 0.5},${y1} L${CX + 2.2},${y0}Z`;
      lk.push(between(5, 5, `<path d="${dark}" fill="${trough}" opacity="0.5"/><path d="${chop}" fill="${crestC}" opacity="0.5"/><path d="${seam}" fill="${trough}" opacity="0.45"/><path d="${seam}" fill="${crestC}" opacity="0.55" transform="translate(0,-1)"/><g fill="none" stroke-width="1.3"><g stroke="${trough}">${troughs}</g><g stroke="${crestC}">${rings}</g></g>`)); }
    mid.push(`<g clip-path="url(#${lakeClip})">${lk.join('')}</g>`);
    // the line where water meets the far shore, catching the light
    mid.push(`<path d="${lakeRuns.map(run => 'M' + run.map(([x, y]) => `${f(x)},${f(y + 0.4)}`).join(' L')).join(' ')}" fill="none" stroke="${P.cream}" stroke-width="0.9" opacity="0.55"/>`);
  }
  // ---- Cedar Flats: a clearing on the far shore with the campground's tents scattered over it, the south road
  // coming in along the shore, and through stage 2 a thread of smoke from somebody's fire
  {
    const r = L.source(3501), lit = mix(mix(P.cream, P.peach, 0.45), P.haze, 0.18), dry = mix(mix(P.cream, P.peach, 0.3), P.haze, 0.12), edge = mix(P.haze, P.teal, 0.55);
    // the clearing: open grass at the foot of the wooded slope, ragged along the forest edge above, ending in a
    // strip of beach at the water
    const top = [[558, FL + 5.6], [562, FL + 1], [568, FL - 1.4], [575, FL - 2.4], [583, FL - 4.6], [592, FL - 4], [600, FL - 5.6], [609, FL - 5], [617, FL - 6.4], [626, FL - 4.6], [634, FL - 5.2], [641, FL - 2.6], [646, FL + 0.6], [650, FL + 4.6]];
    const clearing = poly([...top, [648, FL + 6.4], [560, FL + 6.4]]);
    mid.push(`<path d="${clearing}" fill="${lit}"/><path d="M558,${FL + 5.4} C590,${FL + 4.4} 622,${FL + 4.6} 650,${FL + 5} L648,${FL + 6.4} L560,${FL + 6.4}Z" fill="${dry}"/>`);
    // the road along the shore, in and out of the trees
    mid.push(`<path d="M470,${FL + 9} C510,${FL + 7} 540,${FL + 6} 560,${FL + 4} M648,${FL + 3} C680,${FL - 1} 720,${FL - 6} 760,${FL - 13}" fill="none" stroke="${mix(P.cream, P.haze, 0.3)}" stroke-width="0.9" opacity="0.6"/>`);
    // the forest edge along the top of the clearing, and clumps of trees left standing in it
    let clumps = '';
    for (let i = 0; i < top.length - 1; i++) for (let x = top[i][0]; x < top[i + 1][0]; x += r(1.8, 3.2)) { const y = lerp(top[i][1], top[i + 1][1], (x - top[i][0]) / (top[i + 1][0] - top[i][0])) + 0.8, h = r(2.6, 4.6); clumps += spire(x, y, h, h * 0.5, r()); }
    for (const [x, y, n] of [[574, FL + 1, 3], [589, FL + 2.4, 2], [619, FL, 3], [636, FL + 1.6, 2]]) for (let k = 0; k < n; k++) { const h = r(2.4, 3.8); clumps += spire(x + k * 1.6 + r(-0.5, 0.5), y + r(-0.6, 0.6), h, h * 0.52, r()); }
    mid.push(`<path d="${clumps}" fill="${mix(P.haze, P.teal, 0.62)}"/>`);
    // the tents: little ridged triangles in the colours tents come in, each with its shaded side away from the sun
    const tones = [P.coral, P.cream, '#F2B441', P.tealLight, P.coralHi, mix(P.plum, P.haze, 0.3), P.window];
    let keep = '', lane = '';
    for (let k = 0; k < 36; k++) { const x = r(564, 644), y = FL + r(-2.6, 4), w = r(2, 3.1), c = tones[Math.floor(r(0, tones.length))]; if (y < along(top)(x) + 1.6) continue;
      const t = `<path d="M${f(x - w / 2)},${f(y)} L${f(x)},${f(y - w * 0.8)} L${f(x + w / 2)},${f(y)}Z" fill="${c}"/><path d="M${f(x - w / 2)},${f(y)} L${f(x)},${f(y - w * 0.8)} L${f(x - w * 0.05)},${f(y)}Z" fill="${mix(c, P.plum, 0.45)}"/>`;
      if (Math.abs(x - CX) < 5.5) lane += t; else keep += t; }
    mid.push(keep + until(4, lane));
    // stage 5: a lane through the tents on the line. They are flattened into it, and the grass is pressed pale.
    mid.push(from(5, `<path d="M597,${FL - 6} L603,${FL - 6} L604.5,${FL + 6.5} L595.5,${FL + 6.5}Z" fill="${mix(lit, P.cream, 0.6)}"/><path d="M596.5,${FL - 0.6} l4,0.8 l-0.4,1 l-4,-0.6Z M599.5,${FL + 3} l4.2,0.4 l-0.4,1 l-4.2,-0.3Z" fill="${P.coralSh}"/><path d="M598,${FL - 3.4} l3.6,0.6" stroke="${mix(P.cream, P.window, 0.3)}" stroke-width="0.9"/>`));
    mid.push(until(2, `<path d="M586,${FL - 3} C584,${FL - 12} 590,${FL - 18} 588,${FL - 26} C586,${FL - 34} 594,${FL - 40} 600,${FL - 44}" fill="none" stroke="${P.cream}" stroke-width="1.4" stroke-linecap="round" opacity="0.32"/>`));
  }

  // ---- this side of the lake: the spurs coming down from the north on the right, nearer and darker each one.
  // West of the lodge's point the shore draws back into a small bay, which is where the dock runs out.
  const bay = x => x > 608 && x < 690 ? LY - 27 + 17 * Math.pow(Math.sin(Math.PI * (x - 608) / 82), 0.7) : -1e9;
  const nearTone = [mix(P.ink, P.tealDeep, 0.5), mix(P.teal, P.tealDeep, 0.45), mix(P.haze, P.teal, 0.6), mix(P.haze, P.teal, 0.34)];
  const nearTrees = [[12, 22, 11], [7, 13, 8], [6, 11, 7], [4.4, 8, 6]];
  for (let k = S.N.length - 1; k >= 1; k--) runs(S.xs, S.N[k]).forEach((run, j) => {
    if (k === 1) run = run.map(([x, y]) => [x, Math.max(y, bay(x))]);
    const [hMin, hMax, step] = nearTrees[k];
    mid.push(band(run, nearTone[k], { hMin, hMax, step, seed: 3300 + k * 10 + j, haze: 0.3 - k * 0.05, edge: 1.5, rows: k === 1 ? 2 : 1, keep: k === 1 ? (x => x < 570 || x > 690) : null }));
  });

  // ---- Basin Lodge on its point: the same A-frame as in the lake picture, seen here from behind and above, very
  // small, with its wing on the far side of it from the dock. Its back gable is glass too, and through stage 3 the
  // whole building glows. At 4 there is one small light left in it, and at 5 it is dark. Six cabins in the trees
  // either side, lit through stage 3. The dock runs out west into the bay, with the rowboat tied at its end until it is
  // gone at 4, as in the lake picture.
  // small trees, drawn as outlines in two tones with a lit edge toward the sun
  const grove = (list, tone, rim, r) => { let d = ''; for (const [x, y, h] of list) d += spire(x, y, h, h * r(0.42, 0.52), r()); return twice(d, rim, tone, 1.1); };
  {
    const dark = P.plumDeep, wall = P.plum, roof = mix(P.plumDeep, '#000000', 0.25), unlit = mix(P.plumDeep, P.haze, 0.2), trim = mix(P.plum, P.haze, 0.5), rimLit = mix(P.peach, P.cream, 0.3), deck = mix(P.cream, P.haze, 0.35);
    const wg = linGrad(0, LY - 18, 0, LY, [[0, P.windowHot], [0.55, P.window], [1, '#FFE2A0']]), pr = L.source(3601);
    // the point: a low tongue of ground out into the water, with a pale beach along its edge
    const point = `M556,${LY + 8} C566,${LY - 4} 586,${LY - 12} 602,${LY - 14.6} C612,${LY - 15.8} 620,${LY - 13} 623,${LY - 8} C625,${LY - 3} 624,${LY + 3} 626,${LY + 8}Z`;
    mid.push(`<path d="${point}" fill="${nearTone[1]}"/><path d="M572,${LY - 6} C586,${LY - 12.6} 600,${LY - 15.4} 610,${LY - 15.6} C618,${LY - 15} 622,${LY - 11} 623.4,${LY - 6}" fill="none" stroke="${mix(P.cream, P.peach, 0.3)}" stroke-width="1.1" opacity="0.8"/>`);
    // the trees behind the lodge, standing against the water
    mid.push(grove([[578, LY - 6, 9], [584, LY - 8, 12], [590, LY - 10, 8], [614, LY - 11, 9], [619, LY - 8, 11]], mix(nearTone[1], P.tealDeep, 0.3), mix(P.tealLight, P.peach, 0.45), pr));
    // the dock: a plank deck on pilings running out into the bay, with its shadow on the water, and the rowboat at its end
    mid.push(`<path d="M621,${LY - 9.6} L645,${LY - 13.4} L645.4,${LY - 11.6} L621.4,${LY - 7.8}Z" fill="${deck}"/><path d="M621.4,${LY - 7.8} L645.4,${LY - 11.6} L645.4,${LY - 10.6} L621.4,${LY - 6.8}Z" fill="${dark}"/><path d="${[624, 628.5, 633, 637.5, 642, 645].map(x => `M${x},${f(LY - 7.6 - (x - 621) * 0.158)} v2.2`).join(' ')}" stroke="${dark}" stroke-width="0.7"/><path d="M621,${LY - 9.6} L645,${LY - 13.4}" stroke="${P.cream}" stroke-width="0.4" opacity="0.8"/><path d="M621,${LY - 4} L646,${LY - 8}" stroke="${P.cream}" stroke-width="0.5" opacity="0.35"/>`);
    mid.push(until(3, `<path d="M647.4,${LY - 14.6} q3.2,-0.9 6,0 q-0.6,1.5 -3,1.7 q-2.4,0 -3,-1.7Z" fill="${dark}"/><path d="M647.4,${LY - 14.6} q3.2,-0.9 6,0" stroke="${P.cream}" stroke-width="0.5" fill="none"/><path d="M645.2,${LY - 12.6} q1.2,-0.8 2.4,-1.6" stroke="${P.cream}" stroke-width="0.35" fill="none"/>`));
    // the wing, low under its single-pitch roof, with its chimney
    let b = `<rect x="574" y="${LY - 9}" width="14" height="9" fill="${wall}"/><path d="M572,${LY - 9} L589,${LY - 13} L589,${LY - 10.6} L572,${LY - 7}Z" fill="${roof}"/><path d="M572,${LY - 9} L589,${LY - 13}" stroke="${trim}" stroke-width="0.6"/><rect x="576" y="${LY - 17}" width="2.6" height="7" fill="${mix(P.plumDeep, P.haze, 0.34)}"/><rect x="577" y="${LY - 6}" width="2.6" height="3" fill="${unlit}"/><rect x="582" y="${LY - 6}" width="2.6" height="3" fill="${unlit}"/>`;
    // the A-frame: the two long roofs running back from the gable, and the gable itself, glass in a timber frame
    b += `<path d="M${LX},${LY - 22} L${LX},${LY - 27} L${LX + 13},${LY - 4} L${LX + 13},${LY + 0.6}Z" fill="${mix(roof, P.peach, 0.3)}"/><path d="M${LX},${LY - 22} L${LX},${LY - 27} L${LX - 13},${LY - 4} L${LX - 13},${LY + 0.6}Z" fill="${roof}"/>`;
    b += `<path d="M${LX},${LY - 22} L${LX - 13},${LY + 0.6} L${LX + 13},${LY + 0.6}Z" fill="${dark}"/><path d="M${LX},${LY - 18} L${LX - 9},${LY} L${LX + 9},${LY}Z" fill="${unlit}"/>`;
    const glass = `<path d="M${LX},${LY - 18} L${LX - 9},${LY} L${LX + 9},${LY}Z" fill="url(#${wg})"/>`, frame = `<path d="M${LX - 9},${LY - 9} H${LX + 9} M${LX - 3},${LY - 14} V${LY} M${LX + 3},${LY - 14} V${LY} M${LX},${LY - 18} V${LY - 9}" stroke="${dark}" stroke-width="0.7" fill="none"/>`;
    const glow = (r, a) => `<circle cx="${LX - 4}" cy="${LY - 6}" r="${r}" fill="url(#${radGrad(LX - 4, LY - 6, r, [[0, P.window, a], [1, P.window, 0]])})"/>`;
    // the cabins, each a roof and one window under the trees, four on this side of the lodge and two across the bay
    const CAB = [[551, LY + 9], [563, LY + 3], [539, LY + 15], [632, LY + 4], [692, LY - 16], [704, LY - 13]];
    let cab = '', cabLit = '';
    for (const [x, y] of CAB) { cab += `<path d="M${x - 3.4},${y} L${x},${y - 3} L${x + 3.4},${y}Z" fill="${roof}"/><path d="M${x},${y - 3} L${x + 3.4},${y}" stroke="${rimLit}" stroke-width="0.5"/><rect x="${x - 2.6}" y="${y}" width="5.2" height="2.6" fill="${wall}"/><rect x="${x - 1}" y="${y + 0.5}" width="1.6" height="1.5" fill="${unlit}"/>`; cabLit += `<rect x="${x - 1}" y="${y + 0.5}" width="1.6" height="1.5" fill="${P.window}"/>`; }
    mid.push(until(3, glow(36, 0.42)) + between(4, 4, glow(9, 0.34)) + b + until(3, glass + `<rect x="577" y="${LY - 6}" width="2.6" height="3" fill="${P.window}"/><rect x="582" y="${LY - 6}" width="2.6" height="3" fill="${P.window}"/>`) + frame + between(4, 4, `<rect x="${LX + 3.6}" y="${LY - 3.4}" width="2.6" height="3" fill="${P.window}"/>`));
    mid.push(`<path d="M${LX},${LY - 27} L${LX + 13},${LY - 4}" stroke="${rimLit}" stroke-width="0.8"/>` + cab + until(3, cabLit));
    // the trees of the point round the cabins and in front of the lodge, and along the shore of the bay
    const pts = [];
    for (let x = 530; x < 720; x += pr(4, 7)) { if (x > 586 && x < 616) continue; const inBay = x > 616 && x < 690, y = inBay ? Math.max(LY + 6 + pr(0, 6), bay(x) + 18) : LY + 4 + 14 * Math.pow(Math.abs(x - 606) / 90, 1.4) * (x < 606 ? 1 : -0.3) + pr(0, 7); pts.push([x, y, pr(9, 16) * (Math.abs(x - 600) < 80 ? 1 : 0.8)]); }
    mid.push(grove(pts, mix(nearTone[1], P.tealDeep, 0.45), mix(P.tealLight, P.peach, 0.4), pr));
  }

  // ---- the slope we look down over, and Echo Point. The Corrie spur has the sun off it now, so all of this lies in
  // its shadow, cool and dark; only the crown of the point stands up into the last of the light.
  const shadeTone = mix(P.tealDeep, P.ink, 0.45), shadeHaze = mix(P.plum, P.haze, 0.4), shadeRim = mix(P.tealLight, P.plum, 0.3);
  for (const run of runs(S.xs, S.N[0])) mid.push(band(run.map(([x, y]) => [x, y + 16 * Math.exp(-(((x - CX) / 120) ** 2))]), mix(P.tealDeep, P.teal, 0.3), { hMin: 10, hMax: 18, step: 10, seed: 3390, haze: 0.26, hazeTone: shadeHaze, edge: 1.2, rows: 2, rowTone: mix(shadeTone, P.ink, 0.3), keep: x => Math.abs(x - CX) > 100 && clump(x + 300) > 0.2 }));
  // Echo Point: a wooded knob at the end of the spur, its near face a wall of rock, with the overlook's rail along the
  // top of the wall facing us across the gully
  {
    const er = L.source(3701);
    const knob = `M514,${EY + 34} C528,${EY + 10} 552,${EY - 4} 580,${EY - 10} C600,${EY - 14} 624,${EY - 11} 646,${EY - 3} C666,${EY + 5} 680,${EY + 20} 688,${EY + 34}Z`;
    mid.push(twice(knob, mix(P.window, P.peach, 0.5), `url(#${linGrad(660, EY - 16, 570, EY + 30, [[0, mix(P.teal, P.tealLight, 0.45)], [0.45, mix(P.teal, P.tealDeep, 0.3)], [1, mix(P.tealDeep, P.ink, 0.3)]])})`, 1.8));
    // the trees on the knob, in rows from its crown down its flanks, their tops in the last of the light
    let crown = '', flank = '';
    for (let j = 0; j < 4; j++) for (let x = 520 + j * 6; x < 682 - j * 4; x += er(4.6, 7.6)) { const u = (x - 514) / 174, top = EY + 34 - 44 * Math.pow(Math.sin(Math.PI * u), 0.62), y = top + 4 + j * 6 + er(0, 3), h = er(9, 15) * (1 - j * 0.06); if (Math.abs(x - 600) < 16 && y > EY - 2) continue; if (y > EY + 30) continue; const t = spire(x, y, h, h * er(0.44, 0.54), er()); if (j < 2) crown += t; else flank += t; }
    mid.push(twice(crown, mix(P.window, P.peach, 0.45), mix(P.teal, P.tealDeep, 0.3), 1.4) + twice(flank, shadeRim, mix(P.tealDeep, P.ink, 0.25), 1));
    // the outcrop under the rail: a short wall of rock in shade, its foot broken into buttresses, the facets turned
    // toward the sun catching a little light
    { const rock = [[574, 6], [584, 4.6], [596, 4], [606, 4.2], [618, 5], [628, 7], [632, 12], [627, 16], [630, 21], [621, 23], [613, 19], [605, 24], [595, 21], [587, 25], [578, 20], [571, 14]].map(([x, y]) => [x, EY + y]);
      const lit = [[[606, 4.2], [618, 5], [613, 19]], [[618, 5], [628, 7], [632, 12], [627, 16], [621, 14]], [[627, 16], [630, 21], [621, 23]], [[584, 4.6], [590, 4.4], [588, 15]]].map(t => poly(t.map(([x, y]) => [x, EY + y]))).join(' ');
      mid.push(`<path d="${poly(rock)}" fill="${mix(P.plum, P.plumDeep, 0.3)}"/><path d="${lit}" fill="${mix(P.plum, P.haze, 0.55)}"/><path d="M579,${EY + 7} l2,7 l-2,6 M596,${EY + 5} l-1,8 l2,8 M611,${EY + 6} l2,6 M604,${EY + 12} l1,6" stroke="${P.plumDeep}" stroke-width="0.8" fill="none" opacity="0.7"/><path d="M574,${EY + 6} L584,${EY + 4.6} L596,${EY + 4} L606,${EY + 4.2} L618,${EY + 5} L628,${EY + 7}" fill="none" stroke="${mix(P.haze, P.peach, 0.4)}" stroke-width="0.9"/>`); }
    // the overlook: a stone apron at the top of the wall, and the rail along its edge
    mid.push(`<path d="M588,${EY + 7} C593,${EY + 3.6} 607,${EY + 3.6} 612,${EY + 7} C607,${EY + 8.8} 593,${EY + 8.8} 588,${EY + 7}Z" fill="${mix(P.cream, P.haze, 0.2)}"/><path d="M588.6,${EY + 6.8} C594,${EY + 8.8} 606,${EY + 8.8} 611.4,${EY + 6.8}" fill="none" stroke="${P.plumDeep}" stroke-width="0.8"/><path d="M588.6,${EY + 4.6} C594,${EY + 6.6} 606,${EY + 6.6} 611.4,${EY + 4.6}" fill="none" stroke="${P.plumDeep}" stroke-width="0.8"/><path d="M589,${EY + 4.8} v2 M593,${EY + 5.9} v2 M597.4,${EY + 6.5} v2 M602.6,${EY + 6.5} v2 M607,${EY + 5.9} v2 M611,${EY + 4.8} v2" stroke="${P.plumDeep}" stroke-width="0.6"/>`);
    // the gully at the foot of the wall, the ledge of the first cliff beyond it, and then the treetops of the slope
    // falling away toward us. They stand lower in the middle, where the gully runs down to the cliffs, so the point
    // and its rail are seen over them.
    mid.push(`<path d="M520,${EY + 36} C556,${EY + 24} 646,${EY + 24} 684,${EY + 36} L684,${EY + 60} L520,${EY + 60}Z" fill="${mix(shadeTone, P.plum, 0.25)}"/><path d="M540,${EY + 35} C566,${EY + 29} 636,${EY + 29} 662,${EY + 35} C640,${EY + 33} 562,${EY + 33} 540,${EY + 35}Z" fill="${mix(P.plum, P.haze, 0.45)}"/>`);
    const gr = L.source(3720);
    for (let j = 0; j < 3; j++) {
      const base = EY + 46 + j * 12, dip = 22 - j * 3, span = 120 + j * 60, hMin = 12 + j * 6, hMax = 20 + j * 9;
      const yFn = x => base - dip * Math.min(1, Math.pow(Math.abs(x - CX) / span, 1.2)) + 3 * Math.sin(x * 0.031 + j * 1.7), id = L.shared(treeLine(CX - span * 1.25, CX + span * 1.25, yFn, { hMin, hMax, step: 7 + j * 2.4, r: gr }));
      mid.push(`<use href="#${id}" fill="${shadeRim}" opacity="0.7" transform="translate(1.4,-0.6)"/><use href="#${id}" fill="${[mix(P.teal, P.tealDeep, 0.55), mix(P.tealDeep, P.ink, 0.15), mix(P.tealDeep, P.ink, 0.35)][j]}"/><rect x="${CX - span * 1.25}" y="${base - dip - hMax}" width="${span * 2.5}" height="${dip + hMax + 60}" fill="url(#${linGrad(0, base - hMax, 0, base + 12, [[0, shadeHaze, 0], [1, shadeHaze, 0.5 - j * 0.1]])})" clip-path="url(#${L.clipTo(id)})"/>`);
    }
  }

  // ================= THE MEADOW WE STAND ON =================
  // The lower edge of the bench: the ground runs gently down from our feet to a lip, and beyond the lip the slope
  // drops out of sight. Things on the meadow are drawn larger the farther below the lip they stand, which is how
  // much nearer they are.
  const lip = curveFn([[-20, 474], [140, 482], [330, 494], [500, 502], [600, 504], [720, 500], [880, 486], [1040, 468], [1220, 452]]);
  const fs = (x, y) => Math.max(0.14, (y - lip(x)) / 88 + 0.16);
  const ground = [[-20, LOW]]; for (let x = -20; x <= W + 20; x += 12) ground.push([x, lip(x)]); ground.push([W + 20, LOW]);
  const groundD = poly(ground), gc = clip(groundD);
  // The track (stage 4) runs from under our feet straight down the middle to the lip. Its holes are forty feet
  // apart on the ground, which brings each one closer to the last on the page the farther off it is.
  const YV = 490, HOLE = [40, 80, 120, 160].map(g => YV + 3600 / g), swathHalf = y => 0.7 * (y - YV) + 2;
  const inTrack = (x, y, pad = 0) => Math.abs(x - CX) < swathHalf(y) + pad;
  // Halloran Creek, coming across the meadow from the left and slipping over the lip: [x, y, half its width]
  const CR = dense([[226, 489, 1.4], [214, 494, 2.6], [236, 502, 3.8], [206, 516, 6.4], [178, 534, 9.6], [196, 560, 13], [152, 596, 19], [116, 640, 26], [98, 700, 34]], 8);
  const nearCreek = (x, y, pad = 0) => CR.some(q => Math.abs(y - q[1]) < q[2] * 0.4 + 3 + pad * 0.4 && Math.abs(x - q[0]) < q[2] * 1.2 + pad);
  const items = [], put = (y, s) => items.push([y, s]);
  const FC = { stem: mix(P.tealLight, P.teal, 0.3), cream: '#FFF8EA', gold: '#F2B441', goldSh: '#C98E2B', coral: P.coral, coralSh: P.coralSh, ink: P.plumDeep, violet: '#9C7DB8', lilac: '#D3B4D6' };
  const grassDark = [P.teal, mix(P.teal, P.tealDeep, 0.5), mix(P.teal, P.tealLight, 0.4)], grassLit = [mix(P.tealLight, P.cream, 0.5), mix(P.tealLight, P.window, 0.45)];

  // the tops of the trees growing on the slope just under the lip: on the left they stand up against the lake, and
  // either side of the middle they frame the view down to the point
  { const r = L.source(3801); let d = '';
    const stand = (x0, x1, hA, hB) => { for (let x = x0; x < x1; x += r(8, 18)) { const c = clump(x); if (c < 0.22) continue; const h = r(hA, hB) * (0.55 + 0.6 * c), y = lip(x) + r(6, 16); d += spire(x, y, h, h * r(0.34, 0.44), r() * 0.8); } };
    stand(-10, 440, 30, 56); stand(440, 520, 16, 26); stand(690, 790, 16, 28); stand(790, 1000, 24, 44);
    fg.push(twice(d, shadeRim, shadeTone, 1.6)); }
  fg.push(`<path d="${groundD}" fill="url(#${linGrad(0, 452, 0, 640, [[0, mix(P.tealLight, P.window, 0.4)], [0.14, mix(P.tealLight, P.cream, 0.24)], [0.45, mix(P.tealLight, P.teal, 0.34)], [1, mix(P.teal, P.tealDeep, 0.3)]])})"/>`);
  // the light coming through the grass along the lip, and the low rises of the ground catching it
  { const r = L.source(3803); let rise = '';
    for (let k = 0; k < 9; k++) { const x = r(60, 1140), y = lip(x) + r(14, 70), s = fs(x, y), w = r(90, 200) * s, h = r(4, 9) * s; if (nearCreek(x, y, w * 0.4) || Math.abs(x - CX) < w * 0.6 + 40) continue; rise += hummock(x, y, w, h, mix(P.tealLight, P.window, 0.22), P.teal); }
    fg.push(`<g clip-path="url(#${gc})">${rise}</g>`); }
  fg.push(grain(0, 470, W, 250, GL(0, 480, 0, 660, [[0, 0], [0.45, 0.16], [1, 0.42]]), P.teal, { clipId: gc }));
  // ---- the creek: dark banks, water that gives back the sky, a run of glints, and at the lip a white tongue where
  // it slips over, with a breath of spray above it
  {
    const up = [], dn = [];
    CR.forEach((q, i) => { const a = CR[Math.max(0, i - 1)], b = CR[Math.min(CR.length - 1, i + 1)], dx = b[0] - a[0], dy = (b[1] - a[1]) / 0.42, l = Math.hypot(dx, dy) || 1; let nx = -dy / l, ny = dx / l; if (ny > 0) { nx = -nx; ny = -ny; } up.push([q[0] + nx * q[2], q[1] + ny * q[2] * 0.42]); dn.push([q[0] - nx * q[2], q[1] - ny * q[2] * 0.42]); });
    const bed = poly([...up, ...dn.slice().reverse()]), water = poly([...up.map(([x, y]) => [x, y + 1.2]), ...dn.slice().reverse()]), wc = clip(water), r = L.source(3811);
    let glint = '', dk = '';
    for (let k = 0; k < 90; k++) { const q = CR[Math.floor(r(0.05, 1) * (CR.length - 1))], w = q[2], len = w * r(0.4, 1.3), th = Math.max(0.8, w * r(0.04, 0.08)), d = sliver(q[0] + r(-0.9, 0.5) * w - len / 2, q[1] + r(-0.3, 0.3) * w * 0.4, len, th, r(-0.4, 0.4) * th); if (k % 3) glint += d; else dk += d; }
    const wg = linGrad(0, 488, 0, 660, [[0, mix(P.sun, P.skyHorizon, 0.5)], [0.12, mix(P.tealLight, P.skyLow, 0.4)], [0.45, mix(P.tealLight, P.teal, 0.3)], [1, mix(P.teal, P.tealDeep, 0.25)]]);
    fg.push(`<path d="${bed}" fill="${mix(P.plum, P.teal, 0.5)}"/><path d="${water}" fill="url(#${wg})"/><g clip-path="url(#${wc})"><path d="M${dn.map(q => `${f(q[0])},${f(q[1] - 1)}`).join(' L')}" fill="none" stroke="${P.teal}" stroke-opacity="0.3" stroke-width="4"/><path d="${dk}" fill="${P.tealDeep}" fill-opacity="0.45"/><path d="${glint}" fill="${P.sun}"/></g>`);
    fg.push(`<path d="M218,${f(lip(222) + 1)} C222,${f(lip(222) - 2)} 230,${f(lip(222) - 2)} 236,${f(lip(222) + 0.6)} C230,${f(lip(222) + 2.6)} 222,${f(lip(222) + 2.6)} 218,${f(lip(222) + 1)}Z" fill="${P.cream}"/><ellipse cx="226" cy="${f(lip(226) - 6)}" rx="22" ry="9" fill="url(#${radGrad(226, lip(226) - 6, 22, [[0, P.cream, 0.42], [1, P.cream, 0]])})"/>`);
    // sedge along the banks
    for (let i = 4; i < CR.length - 2; i += 2) { const q = CR[i], side = i % 4 ? 1 : -1, x = q[0] + side * q[2] * r(0.85, 1.15), y = q[1] + r(0, 0.3) * q[2] * 0.4, [a, b] = tuft(x, y + 1, fs(x, y) * r(18, 30), r); put(y + 2, `<path d="${a}" fill="${grassDark[i % 3]}"/><path d="${b}" fill="${grassLit[i % 2]}"/>`); }
  }
  // ---- boulders: a lit face toward the sun, a shaded one away from it, lichen, grass grown up round the foot, and a
  // long shadow laid toward us on the left
  const rockSh = mix(P.plum, P.haze, 0.25), rockLit = mix(P.haze, P.peach, 0.55), rockTop = mix(P.haze, P.plum, 0.2);
  const stone = (x, y, w, h, sd) => { const r = L.source(3820 + sd), q = (a, b) => [x + w * a, y - h * b];
    let s = `<path d="M${f(x - w * 0.3)},${f(y + h * 0.1)} C${f(x - w * 0.9)},${f(y + h * 0.4)} ${f(x - w * 1.1)},${f(y + h * 1.2)} ${f(x - w * 0.7)},${f(y + h * 1.3)} C${f(x - w * 0.2)},${f(y + h * 1.1)} ${f(x + w * 0.3)},${f(y + h * 0.5)} ${f(x + w * 0.5)},${f(y)}Z" fill="${P.teal}" opacity="0.5"/>`;
    s += `<path d="${poly([q(-0.5, 0), q(-0.47, 0.42), q(-0.27, 0.86), q(0.05, 1), q(0.34, 0.8), q(0.5, 0.36), q(0.53, 0)])}" fill="${rockSh}"/><path d="${poly([q(-0.27, 0.86), q(0.05, 1), q(0.34, 0.8), q(0.1, 0.6), q(-0.16, 0.64)])}" fill="${rockTop}"/><path d="${poly([q(0.1, 0.6), q(0.34, 0.8), q(0.5, 0.36), q(0.53, 0), q(0.18, 0), q(0.2, 0.3)])}" fill="${rockLit}"/><path d="M${f(x + w * 0.05)},${f(y - h)} L${f(x + w * 0.34)},${f(y - h * 0.8)} L${f(x + w * 0.5)},${f(y - h * 0.36)}" fill="none" stroke="${P.sun}" stroke-width="${f(Math.max(0.8, w * 0.016))}" stroke-linejoin="round" opacity="0.8"/>`;
    for (let k = 0; k < 5; k++) s += `<circle cx="${f(x + w * r(-0.36, 0.1))}" cy="${f(y - h * r(0.2, 0.7))}" r="${f(Math.max(0.8, w * r(0.016, 0.034)))}" fill="${mix(P.haze, P.cream, 0.5)}" fill-opacity="0.7"/>`;
    for (const a of [-0.46, -0.2, 0.12, 0.42]) { const [g1, g2] = tuft(x + w * a, y + 1, h * r(0.35, 0.6), r); s += `<path d="${g1}" fill="${grassDark[0]}"/><path d="${g2}" fill="${grassLit[0]}"/>`; }
    return s; };
  for (const [x, y, w, h, sd] of [[912, 500, 84, 34, 1], [972, 488, 40, 15, 2], [404, 512, 40, 14, 3], [1080, 600, 150, 46, 4], [286, 628, 120, 36, 5]]) put(y, stone(x, y, w, h, sd));
  // ---- the meadow's own grass and flowers. Far off, at the lip, they are flecks; nearer they are plants, each
  // put in the list at its own distance. Anything rooted where the track will run is gone when it is there.
  {
    const r = L.source(3830); let ticks = '', ticksT = '';
    for (let k = 0; k < 220; k++) { const x = r(-10, W + 10), y = lip(x) + Math.pow(r(), 1.4) * 40 + 1, s = fs(x, y), h = 3 + s * 10; if (nearCreek(x, y, 2)) continue; const d = `M${f(x - h * 0.3)},${f(y)}l${f(h * 0.12)},${f(-h)}l${f(h * 0.2)},${f(h)}l${f(h * 0.24)},${f(-h * 0.8)}l${f(h * 0.16)},${f(h * 0.8)}Z`; if (inTrack(x, y, 2)) ticksT += d; else ticks += d; }
    fg.push(`<path d="${ticks}" fill="${P.teal}" fill-opacity="0.55"/>` + until(3, `<path d="${ticksT}" fill="${P.teal}" fill-opacity="0.55"/>`));
    // flowers come in drifts: [x, y below the lip, spread, kind, how many]
    const drifts = [[340, 14, 150, 'lupine', 28], [470, 30, 110, 'paintbrush', 15], [600, 22, 120, 'daisy', 20], [760, 18, 140, 'lupine', 24], [860, 40, 120, 'buttercup', 17], [1010, 30, 120, 'paintbrush', 13], [120, 34, 100, 'daisy', 13], [520, 70, 160, 'lupine', 17], [700, 80, 160, 'daisy', 15], [380, 96, 130, 'buttercup', 12], [880, 100, 140, 'lupine', 13], [600, 110, 200, 'paintbrush', 12], [1120, 70, 90, 'daisy', 9], [260, 60, 90, 'umbel', 5], [780, 54, 160, 'umbel', 5]];
    const tint = { lupine: FC.violet, daisy: FC.cream, paintbrush: FC.coral, buttercup: FC.gold, umbel: FC.cream }, dots = {}, dotsT = {};
    for (const [cx, dy, sp, kind, n] of drifts) for (let j = 0; j < n; j++) {
      const x = cx + r(-1, 1) * sp, y = lip(x) + dy + r(-1, 1) * (6 + dy * 0.3); if (y < lip(x) + 2 || nearCreek(x, y, 4)) continue;
      const tall = kind === 'lupine' || kind === 'umbel', size = fs(x, y) * (tall ? r(34, 50) : r(22, 34)), T = inTrack(x, y, 3);
      if (size < 11) { const c = tint[kind], rr = Math.max(0.9, size * 0.12), d = `M${f(x - rr)},${f(y - size * 0.7)}a${f(rr)},${f(rr * (tall ? 1.6 : 0.8))} 0 1 0 ${f(rr * 2)},0a${f(rr)},${f(rr * (tall ? 1.6 : 0.8))} 0 1 0 ${f(-rr * 2)},0Z`, set = T ? dotsT : dots; set[c] = (set[c] || '') + d; }
      else { const fl = flower(kind, x, y, size, FC, r); put(y, T ? until(3, fl) : fl); }
    }
    const paint = set => Object.entries(set).map(([c, d]) => `<path d="${d}" fill="${c}"/>`).join('');
    fg.push(paint(dots) + until(3, paint(dotsT)));
    // clumps of grass, more of them and taller toward us, their tips lit
    for (let k = 0; k < 96; k++) { const x = r(-10, W + 10), y = lip(x) + 4 + Math.pow(r(), 0.8) * 150; if (nearCreek(x, y, 6)) continue; const [a, b] = tuft(x, y, fs(x, y) * r(16, 30), r), g = `<path d="${a}" fill="${grassDark[k % 3]}"/><path d="${b}" fill="${grassLit[k % 2]}"/>`; put(y, inTrack(x, y, 4) ? until(3, g) : g); }
  }
  // ---- the trees at the edges of the view: a tall fir on the left, cut by the frame, and two on the right with the
  // sun behind them
  { const big = (d, rim) => { const tone = mix(P.ink, P.tealDeep, d); return { tone, lit: mix(tone, P.tealLight, 0.48), mid: mix(tone, P.tealLight, 0.18), deep: mix(tone, '#04141A', 0.55), trunk: mix(P.plumDeep, P.ink, 0.5), rim, rimW: 2.6 }; };
    put(LOW - 2, conifer(14, 668, 600, big(0.25, P.rim), { kind: 'fir', seed: 3841, grainy: true, lean: 0 }));
    put(LOW - 1, conifer(1176, 600, 430, big(0.3, mix(P.rim, P.sun, 0.3)), { kind: 'fir', seed: 3842, grainy: true, lean: 0.01 }) + conifer(1124, 560, 250, big(0.45, mix(P.rim, P.sun, 0.3)), { kind: 'spruce', seed: 3843, lean: 0 }));
    // with the sun low in front of us, their shadows come a long way across the grass toward us and to the left
    const lay = (x, y, len, w) => { const ex = x - len * 0.88, ey = y + len * 0.14, n = 8, up = [], dn = []; for (let i = 0; i <= n; i++) { const t = i / n, px = lerp(x, ex, t), py = lerp(y, ey, t), hw = w * (1 - t * 0.8) * (i % 2 ? 1 : 0.7) + 2; up.push([px - hw * 0.3, py - hw * 0.5]); dn.unshift([px + hw * 0.3, py + hw * 0.5]); } return poly([...up, ...dn]); };
    fg.push(`<path d="${lay(1176, 598, 420, 34)} ${lay(1124, 558, 260, 22)}" fill="${P.teal}" opacity="0.32" clip-path="url(#${gc})"/>`); }
  // ================= STAGE 4: THE TRACK =================
  // Something has gone down through the meadow in a dead straight line toward the lodge. Along it the grass is pressed
  // flat and combed the way it went; at every forty feet a hole is punched through the turf, and out of each one a
  // furrow is torn where it dragged free, running on toward the next.
  {
    const r = L.source(3850), flat = mix(mix(P.tealLight, P.cream, 0.3), P.window, 0.18), comb = mix(P.teal, P.tealDeep, 0.2), mud = mix(P.plum, P.peach, 0.42), earth = mix(mud, P.plumDeep, 0.42);
    const HC = { rim: mix(P.tealLight, P.window, 0.32), rimSh: mix(P.teal, P.tealDeep, 0.25), wall: mix(mud, P.plumDeep, 0.45), wallLit: mud, deep: mix(P.plumDeep, P.ink, 0.4), floor: '#06141A', cast: mix(P.teal, P.tealDeep, 0.4), clod: mix(P.plum, P.peach, 0.62) };
    const y0 = lip(CX) + 1, ys = []; for (let y = y0; y <= LOW; y += 4) ys.push(y);
    const wob = (y, p) => 1 + 0.12 * Math.sin(y * 0.09 + p);
    const swath = poly([...ys.map(y => [CX - swathHalf(y) * wob(y, 1), y]), ...ys.slice().reverse().map(y => [CX + swathHalf(y) * wob(y, 4), y])]), sc = clip(swath);
    // the grass lying in it: strokes running toward the far end, converging as it does
    let dark = '', pale = '';
    for (let k = 0; k < 200; k++) { const y = lerp(y0, LOW, Math.pow(r(), 0.7)), u = r(-0.9, 0.9), x = CX + u * swathHalf(y), len = (y - YV) * r(0.25, 0.6), th = Math.max(0.5, (y - YV) * r(0.006, 0.014)); const x2 = CX + u * swathHalf(y - len), y2 = y - len; const d = `M${f(x)},${f(y)} Q${f((x + x2) / 2 + th)},${f((y + y2) / 2)} ${f(x2)},${f(y2)} Q${f((x + x2) / 2 - th)},${f((y + y2) / 2)} ${f(x)},${f(y)}Z`; if (k % 3) dark += d; else pale += d; }
    // flowers torn out and lying along it
    let lying = '';
    for (let k = 0; k < 22; k++) { const y = lerp(y0 + 6, LOW, Math.pow(r(), 0.8)), x = CX + r(-0.8, 0.8) * swathHalf(y), s = (y - YV) / 90, len = 12 * s, c = [FC.violet, FC.cream, FC.coral, FC.gold, FC.lilac][Math.floor(r(0, 4.999))];
      lying += `<path d="M${f(x)},${f(y)} l${f(r(-0.3, 0.3) * len)},${f(-len)}" stroke="${P.teal}" stroke-width="${f(Math.max(0.6, s * 0.8))}" stroke-linecap="round"/><ellipse cx="${f(x)}" cy="${f(y - len)}" rx="${f(Math.max(0.9, s * 2.4))}" ry="${f(Math.max(0.7, s * 1.6))}" fill="${c}"/>`; }
    // the holes, and the furrow torn out of each toward the next
    let holes = '', torn = '', tornLit = '';
    HOLE.forEach((y, k) => {
      const rx = 53 * (y - YV) / 90, sc2 = rx / 27, kk = 0.24 + (y - YV) / 190;
      holes += hole(CX, y, sc2, kk, HC, 3860 + k);
      const yNext = k < HOLE.length - 1 ? HOLE[k + 1] : y0, ya = y - 22 * sc2 * kk, yb = lerp(ya, yNext, r(0.45, 0.6)), wA = rx * 0.4;
      const L1 = [], R1 = [], M1 = [];
      for (let i = 0; i <= 10; i++) { const t = i / 10, yy = lerp(ya, yb, t), w = wA * Math.pow(1 - t, 0.8) * (i === 0 || i === 10 ? 1 : r(0.7, 1.2)) * ((yy - YV) / (y - YV)); L1.push([CX - w + r(-0.4, 0.4), yy]); R1.push([CX + w, yy]); M1.push([CX + w * 0.2, yy]); }
      torn += poly([...L1, ...R1.slice().reverse()]) + ' '; tornLit += poly([...M1, ...R1.slice().reverse()]) + ' ';
    });
    // grass along both edges laid over the way it went
    let bent = '';
    for (let y = y0 + 4; y < LOW; y += r(5, 12)) { const h = (y - YV) / 90, side = r() < 0.5 ? -1 : 1, x = CX + side * swathHalf(y) * r(0.92, 1.08); for (let j = 0; j < 3; j++) { const len = 14 * h * r(0.8, 1.3), bx = x + r(-2, 2) * h, bw = Math.max(0.6, h * 1.2); bent += `M${f(bx - bw)},${f(y)} Q${f(bx - side * len * 0.2)},${f(y - len * 0.5)} ${f(bx - side * len * 0.12)},${f(y - len)} Q${f(bx + bw * 0.4)},${f(y - len * 0.4)} ${f(bx + bw)},${f(y)}Z `; } }
    put(HOLE[0] - 0.5, from(4, `<path d="${swath}" fill="${flat}"/><g clip-path="url(#${sc})"><path d="${dark}" fill="${comb}" fill-opacity="0.5"/><path d="${pale}" fill="${mix(P.cream, P.window, 0.3)}" fill-opacity="0.7"/>${lying}</g><path d="${torn}" fill="${earth}"/><path d="${tornLit}" fill="${mud}"/>${holes}<path d="${bent}" fill="${P.teal}"/>`));
  }
  items.sort((a, b) => a[0] - b[0]);
  fg.push(items.map(i => i[1]).join(''));
  // long grass along the bottom of the picture, dark against the light, a few blades catching it
  { const r = L.source(3870); let a = '', b = '', ma = '', mb = '';
    for (let x = -10; x < W + 10; x += r(7, 18)) { const inMid = Math.abs(x - CX) < 90, y = LOW - 60 + r(0, 30), n = 3 + Math.floor(r(0, 4)); for (let k = 0; k < n; k++) { const bx = x + r(-6, 6), hh = r(40, 110) * (inMid ? 0.6 : 1), lean = r(-0.4, 0.4) * hh, bw = r(1.4, 2.6), d = blade(bx, y, hh, lean, bw), lit = r() < 0.25; if (inMid) { if (lit) mb += d; else ma += d; } else if (lit) b += d; else a += d; } }
    // the grass in the middle stands until the track goes through it
    fg.push(`<path d="${b}" fill="${mix(P.tealLight, P.window, 0.3)}"/><path d="${a}" fill="${P.ink}"/>` + until(3, `<path d="${mb}" fill="${mix(P.tealLight, P.window, 0.3)}"/><path d="${ma}" fill="${P.ink}"/>`)); }
  const vig = `<rect x="0" y="-60" width="${W}" height="${LOW + 60}" fill="url(#${radGrad(W / 2, H * 0.5, 820, [[0.58, '#2A1B33', 0], [1, '#2A1B33', 0.34]])})"/>`;
  const vb = [0, 40, W, 560], wrap = (inner, depth) => `<svg class="ly" viewBox="${vb.join(' ')}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" data-depth="${depth}">${inner}</svg>`;
  return { layers: [wrap(`<defs>${L.defs.join('\n')}</defs>` + sky.join('\n'), 0.1), wrap(mid.join('\n'), 0.32), wrap(fg.join('\n') + vig, 0.7)], vb, vbm: [240, 20, 720, 620] };
}
