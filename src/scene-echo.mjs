// How the echo works: the large graphic in the section about Echo Point.
//
// The top half is a picture: Echo Point, and the ground beyond it, cut along one line and seen from the side. The
// bottom half is a strip of sound: your shout, and what comes back. Both halves share one scale across the page.
// Sound covers about 1,100 feet a second up here and has to go there and back, so a cliff's distance fixes the
// moment its echo arrives, and each echo is drawn directly under its cliff. An echo is the shout again, smaller:
// every one has the shout's own shape.
//
// WHERE THIS IS. The line of the cut is the park map's own straight line: from Basin Lodge through Echo Point and
// Halloran Meadows to Echo Pass, bearing 042 from the lodge. The picture looks north-west across it, so the lodge
// and the lake are half a mile off the left edge and 790 ft down, and the meadows are 1.2 miles up the slope to the
// right. The ground follows the map's contours (scene-map's heightAt, sampled along that line): Echo Point is a knob
// at 4,330 ft, the ground behind it sags about 350 ft into a saddle a third of a mile out, and from there the long
// slope climbs to the meadows at 6,230 ft. The four cliffs, the gully under the rail and the benches between them
// are finer than 200 ft contours can show; each is drawn within one contour of the map's ground. On the wide
// layout heights and distances are at one scale. On a phone heights are half as tall again, to keep the cliffs
// readable. People, the rail and the trees are larger than life in both.
//
// Each cliff has to be in sight of the rail to send anything back, so the scene works out how far down each face
// the nearer ground lets you see, and aims the sound at the part that shows.
//
// The shared scale is what the later stages lean on.
//   2  a fifth return is logged at 6.9 seconds, which puts it 3,800 feet out, on the wooded slope above the last
//      cliff, where there is nothing to send a sound back. Its shape is not the shout's.
//   3  Echo Point is closed to shouting. The shout and its four echoes are shown as outlines.
//   4  the fifth arrives 1.3 seconds before the shout. On this scale that is about 700 feet behind the rail, which
//      on the map is the slope between Echo Point and the lodge. The conditions card says the same: 0.4 miles.
//   5  nobody shouts, so the cliffs send nothing back. What is heard has voices in it.
//   6  the shout is the reader, reading. The other one is a tenth of a second behind, and has its shape now.
//
// Two layouts are drawn, one for wide screens and one for phones, in two parts of the same drawing; the page shows
// whichever fits (the picture's two viewBoxes). The wide one carries a small piece of the park map to show where
// the cut runs. On a phone the cliffs are numbered and named in a table underneath.
import * as L from './lib.mjs';
import { ribs, snowcaps } from './peaks.mjs';
import { conifer } from './conifers.mjs';
import { onPath, sheetPart } from './scene-map.mjs';
import { T, PAPER, INK, INK2, BONE, DEEP, sheet, tooth, rule } from './infokit.mjs';
const { f, lerp, mix, poly, grain, GL, from, until, between, linGrad, radGrad, clip } = L;

const V = 1100;                                                        // feet a second
// The ground along the line, in feet: distance from the rail (toward the meadows is positive, toward the lodge
// negative), and height above or below the rail, which stands at 4,330 ft.
const BEHIND = [[-1500, -630], [-1300, -520], [-1150, -445], [-900, -335], [-600, -175], [-330, -60], [-170, -10], [-70, 0], [0, 0]];
const GULLY = [[8, -6], [22, -44], [40, -108], [70, -156], [120, -178], [300, -186], [470, -182], [556, -173]];
// each cliff: where its face stands, the height of its foot and its top, and the ground from its top to the next foot
const WALLS = [
  { name: 'The Step', d: 600, base: -170, top: -95, bench: [[700, -112], [800, -138], [1000, -228], [1160, -296], [1236, -318]] },
  { name: 'Organ Wall', d: 1300, base: -320, top: -170, bench: [[1420, -184], [1600, -250], [1800, -284], [1960, -296], [2040, -294]] },
  { name: 'Gray Wall', d: 2100, base: -292, top: -160, bench: [[2250, -158], [2500, -140], [2750, -95], [2916, -50]] },
  { name: 'Halloran Face', d: 3000, base: -44, top: 150, bench: [[3120, 168], [3400, 285], [3600, 410], [3800, 560], [4100, 800], [4400, 1040], [4700, 1260], [5100, 1560]] },
];
const FIFTH = 3800, EARLY = -1.3;
const secs = d => 2 * d / V, sLabel = t => t.toFixed(1) + ' s', ftLabel = d => d.toLocaleString('en-US') + ' ft';
const GOLD = '#F2B441', CORAL = '#E4694F', CORAL_D = '#B4473F', PANEL = '#102B35';
// the shape of a shout, as twelve bars; and other shapes, for sounds that are not that shout
const CALL = [0.28, 0.55, 0.8, 0.62, 0.4, 0.3, 0.5, 0.86, 1, 0.78, 0.5, 0.26];
const OTHER = [0.5, 0.92, 0.6, 0.3, 0.72, 1, 0.74, 0.34, 0.22, 0.56, 0.82, 0.4];
const VOICES = [[0.34, 0.7, 1, 0.66, 0.3, 0.2, 0.46, 0.9, 0.72, 0.4, 0.6, 0.3], [0.6, 1, 0.5, 0.24, 0.5, 0.86, 0.9, 0.5, 0.3, 0.7, 0.44, 0.2], [0.3, 0.5, 0.76, 1, 0.8, 0.4, 0.2, 0.5, 0.94, 0.6, 0.36, 0.22]];
const ORD = ['1st', '2nd', '3rd', '4th'];

// a ragged edge of small trees standing along a line of ground. Kept spare: there are a great many of them.
function fringe(xa, xb, yFn, { hMin, hMax, step, thick, r }){
  if (xb - xa < step) return '';
  const n1 = v => Math.round(v * 10) / 10, top = [], bot = [];
  for (let x = xa; x < xb; x += 9) { top.push([x, yFn(x) - 0.6]); bot.push([x, yFn(x) + thick]); }
  top.push([xb, yFn(xb) - 0.6]); bot.push([xb, yFn(xb) + thick]);
  let d = poly([...top, ...bot.reverse()]);
  for (let x = xa + r(0, step); x < xb; x += r(0.6, 1.4) * step) { const y = yFn(x) + 1, h = r(hMin, hMax), w = h * r(0.42, 0.58);
    d += r(0, 1) < 0.22 ? `M${f(x - w * 0.5)},${f(y)}q${n1(-w * 0.16)},${n1(-h * 0.6)} ${n1(w * 0.5)},${n1(-h * 0.9)}q${n1(w * 0.66)},${n1(h * 0.3)} ${n1(w * 0.5)},${n1(h * 0.9)}z` : `M${f(x - w / 2)},${f(y)}l${n1(w / 2)},${n1(-h)}l${n1(w / 2)},${n1(h)}z`; }
  return d;
}

// A piece of the park map, to show where the cut runs: the same shore, contours, trails and symbols, with the line
// from Echo Point out to the four cliffs drawn on it. From stage 2 it also carries the fifth.
function locator(x, y, w, h){
  const P = L.P, water = P.teal, waterFill = mix(P.tealLight, '#FFFFFF', 0.6), red = P.coral, brown = '#A8755F', U = 60 / 5280;
  const mx0 = 588, s = w / 190, my0 = 293 - h / s, tx = px => x + (px - mx0) * s, ty = py => y + (py - my0) * s;
  const part = sheetPart(mx0 - 8, my0 - 8, mx0 + 198, my0 + h / s + 8);
  const line = pts => { const out = [pts[0]]; for (let i = 1; i < pts.length; i++) { const l = out[out.length - 1]; if (i === pts.length - 1 || Math.hypot(pts[i][0] - l[0], pts[i][1] - l[1]) > 3.4) out.push(pts[i]); } return 'M' + out.map(p => `${f(tx(p[0]))},${f(ty(p[1]))}`).join(' L'); };
  let thin = '', heavy = ''; for (const [lv, run] of part.lines) { if (lv % 1000 === 0) heavy += line(run) + ' '; else thin += line(run) + ' '; }
  const shore = part.shore.map(l => line(l) + 'Z').join(' '), cid = clip(`M${x},${y} h${w} v${h} h${-w}Z`);
  const LODGE = onPath(238), POINT = onPath(208), MEADOW = onPath(138), along = ft => onPath(208 - ft * U), q = p => [tx(p[0]), ty(p[1])];
  // the trails, by the same turns the map gives them: 3 from the lodge to the point, 4 on to the meadows, 5 toward the pass
  const trails = [[LODGE, [LODGE[0] + 10, LODGE[1] - 4], [LODGE[0] + 6, LODGE[1] - 12], [POINT[0] + 5, POINT[1] + 6], POINT],
    [POINT, [POINT[0] - 7, POINT[1] - 9], [POINT[0] + 6, POINT[1] - 14], [POINT[0] - 4, POINT[1] - 23], [POINT[0] + 12, POINT[1] - 27], [POINT[0] + 6, POINT[1] - 37], [696, 206], [708, 204], MEADOW],
    [MEADOW, [733, 196], [747, 188], [749, 172], [763, 168], [765, 151]]].map(t => 'M' + t.map(p => q(p).map(f).join(',')).join(' L')).join(' ');
  const tile = (p, d) => `<g transform="translate(${f(tx(p[0]))},${f(ty(p[1]))}) scale(0.92)"><rect x="-7.4" y="-7.4" width="14.8" height="14.8" rx="2.6" fill="${PAPER}"/><rect x="-6.3" y="-6.3" width="12.6" height="12.6" rx="2" fill="${INK}"/><g fill="${PAPER}">${d}</g></g>`;
  const dot = (ft, rr = 4) => { const [a, b] = q(along(ft)); return `<circle cx="${f(a)}" cy="${f(b)}" r="${rr + 3.4}" fill="${CORAL}" opacity="0.28"/><circle cx="${f(a)}" cy="${f(b)}" r="${rr}" fill="${CORAL}" stroke="${PAPER}" stroke-width="1.3"/>`; };
  const o = [`<rect x="${x - 3}" y="${y - 3}" width="${w + 6}" height="${h + 6}" rx="5" fill="${PAPER}"/>`];
  o.push(`<g clip-path="url(#${cid})"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${mix(P.tealLight, PAPER, 0.74)}"/>`
    + `<g fill="none" stroke="${brown}" stroke-linejoin="round"><path d="${thin}" stroke-width="0.6" opacity="0.6"/><path d="${heavy}" stroke-width="1.2" opacity="0.82"/></g>`
    + `<path d="${shore}" fill="${waterFill}" fill-rule="evenodd" stroke="${water}" stroke-width="1.2"/>`
    + `<g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="${trails}" stroke="${PAPER}" stroke-width="3.6" opacity="0.85"/><path d="${trails}" stroke="${red}" stroke-width="1.8" stroke-dasharray="5 2.6"/></g>`);
  // the cut: from the point out to the last cliff, with a mark at each cliff
  const [ax, ay] = q(POINT), [bx, by] = q(along(3000));
  o.push(`<path d="M${f(ax)},${f(ay)} L${f(bx)},${f(by)}" stroke="${PAPER}" stroke-width="5.4" stroke-linecap="round"/><path d="M${f(ax)},${f(ay)} L${f(bx)},${f(by)}" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>`
    + WALLS.map(wl => { const [a, b] = q(along(wl.d)); return `<circle cx="${f(a)}" cy="${f(b)}" r="2.9" fill="${PAPER}" stroke="${INK}" stroke-width="1.3"/>`; }).join(''));
  o.push(tile(LODGE, `<path d="M-4.6,4.6 V-0.6 L0,-4.8 L4.6,-0.6 V4.6 H1.4 V1.2 H-1.4 V4.6Z"/>`) + tile(POINT, `<circle cx="0" cy="1.6" r="1.7"/><path d="M-4.8,1.6 A4.8,4.8 0 0 1 4.8,1.6" fill="none" stroke="${PAPER}" stroke-width="1.5"/>`));
  o.push(between(2, 3, dot(FIFTH)) + between(4, 4, dot(EARLY * V / 2)) + between(5, 5, dot(EARLY * V / 2 * 0.58, 5)) + from(6, dot(0, 5.4)));
  const lab = (px, py, t, o2 = {}) => T(px, py, t, { size: 13, weight: 650, halo: o2.on || PAPER, cls: false, ...o2 });
  o.push(lab(tx(POINT[0]) + 11, ty(POINT[1]) + 6, 'Echo Point') + lab(tx(LODGE[0]) + 2, ty(LODGE[1]) + 21, 'Basin Lodge', { anchor: 'middle', on: waterFill }) + lab(tx(MEADOW[0]) + 4, ty(MEADOW[1]) + 4, 'Halloran Meadows', { anchor: 'middle' }));
  o.push(`</g><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${INK}" stroke-width="1.3"/>`);
  return o.join('');
}

function draw(c, seed){
  const P = L.P, o = [], { W, H, SH, x0, pps, u, wide, plat, ps } = c;
  const X = t => x0 + t * pps, xw = WALLS.map(w => X(secs(w.d))), x5 = X(secs(FIFTH)), xE = X(EARLY);
  const sx = W / 1200, sy = SH / 410, up = u * ps;                                    // up: the size of the people and the rail
  const k = pps * 2 / V, Xf = d => x0 + d * k, Yf = h => plat - h * k * c.vz;         // feet into the picture
  const treeC = (tone) => ({ tone, lit: mix(tone, P.tealLight, 0.5), mid: mix(tone, P.tealLight, 0.2), deep: mix(tone, P.ink, 0.5), trunk: mix(P.plumDeep, P.ink, 0.45), rim: mix(P.tealLight, P.cream, 0.3), rimW: 1.2 * u });
  const kinds = ['fir', 'spruce', 'fir', 'hemlock'];

  // ---- the ground line
  const leanOf = w => 2 * u + 0.13 * (Yf(w.base) - Yf(w.top));
  const groundFt = [...BEHIND, ...GULLY]; WALLS.forEach((w, i) => { const lf = leanOf(w) / k, stop = i < 3 ? WALLS[i + 1].d - leanOf(WALLS[i + 1]) / k - 14 : 1e9; groundFt.push([w.d - lf, w.base], [w.d + lf, w.top], ...w.bench.filter(([d]) => d > w.d + lf + 14 && d < stop)); });
  const G = groundFt.map(([d, h]) => [Xf(d), Yf(h)]);
  const gY = x => { if (x <= G[0][0]) return G[0][1]; for (let i = 1; i < G.length; i++) if (x <= G[i][0]) { const a = G[i - 1], b = G[i]; return lerp(a[1], b[1], (x - a[0]) / (b[0] - a[0] || 1)); } return G[G.length - 1][1]; };
  // what the rail can see of each cliff: the nearer ground hides the foot of the ones in the saddle
  const eye = 6, hitFt = WALLS.map(w => { let lim = w.base; for (const [d, h] of groundFt) if (d > 20 && d < w.d - 40) lim = Math.max(lim, eye + (h - eye) * w.d / d); if (lim > w.top - 14) throw new Error('echo: ' + w.name + ' is out of sight of the rail'); return lerp(lim, w.top, 0.5); });

  // ================= THE PICTURE =================
  o.push(`<rect x="0" y="0" width="${W}" height="${SH}" fill="url(#${linGrad(0, 0, 0, SH * 0.92, [[0, P.skyTop], [0.42, P.skyMid], [0.8, P.skyLow], [1, P.skyHorizon]])})"/>`);
  o.push(grain(0, 0, W, SH * 0.62, GL(0, 0, 0, SH * 0.62, [[0, 0.42], [0.5, 0.15], [1, 0]]), P.grainSky, { seed: seed + 1 }));
  // the sun, low in the west-south-west: on the left, which is the lodge's side. The cliffs face it.
  const sun = { x: c.sun[0], y: c.sun[1], r: 22 * u };
  L.setSun(sun);
  o.push(`<circle cx="${f(sun.x)}" cy="${f(sun.y)}" r="${f(SH * 0.7)}" fill="url(#${radGrad(sun.x, sun.y, SH * 0.7, [[0, P.cream, 0.6], [0.3, P.cream, 0.32], [1, P.cream, 0]])})"/><g fill="${P.sun}"><circle cx="${f(sun.x)}" cy="${f(sun.y)}" r="${f(sun.r + 20 * u)}" opacity="0.16"/><circle cx="${f(sun.x)}" cy="${f(sun.y)}" r="${f(sun.r + 9 * u)}" opacity="0.3"/><circle cx="${f(sun.x)}" cy="${f(sun.y)}" r="${f(sun.r)}"/></g>`);
  o.push(L.cloud(W * 0.5, SH * 0.1, 0.5 * u, [[0, 0, 200, 22], [44, 17, 290, 26], [-20, 37, 170, 20]]) + L.cloud(W * 0.68, SH * 0.2, 0.3 * u, [[0, 0, 180, 22], [-30, 17, 260, 24]]));

  // ---- the divide, far off to the north: snow above 7,500 ft
  {
    const pts = [[-20, 178], [70, 160], [150, 170], [240, 146], [330, 160], [430, 112], [520, 140], [610, 88], [700, 124], [790, 80], [880, 112], [960, 78], [1060, 108], [1220, 70]].map(([x, y]) => [x * sx, y * sy]);
    const far = L.range(pts, { baseY: SH, lit: P.farLit, shadeColor: P.farShade, shadeOpacity: 0.3, snowPeaks: [5, 7, 9, 11], amp: 4 * u, seg: 28 * u, caps: false });
    const caps = snowcaps(far.peaks, seed + 3), rb = ribs(far.peaks, seed + 4, 0.8), lift = mix(P.farLit, P.cream, 0.6);
    o.push(far.svg + `<g clip-path="url(#${far.cid})"><path d="${caps}" fill="${P.snow}"/><path d="${far.shadeD}" fill="${P.farShade}" fill-opacity="0.3" clip-path="url(#${clip(caps)})"/><path d="${rb.cut}" fill="${P.farShade}" fill-opacity="0.15"/><path d="${rb.deep}" fill="${P.farShade}" fill-opacity="0.18"/><path d="${rb.lift}" fill="${lift}" fill-opacity="0.3"/></g>`);
    o.push(`<path d="${rb.rim}" fill="none" stroke="${P.sun}" stroke-width="${f(1.4 * u)}" stroke-linejoin="round" stroke-linecap="round" opacity="0.9"/><rect x="0" y="${f(SH * 0.3)}" width="${W}" height="${f(SH * 0.7)}" fill="url(#${linGrad(0, SH * 0.2, 0, SH * 0.6, [[0, P.cream, 0], [1, P.cream, 0.7]])})" clip-path="url(#${far.cid})"/>`);
  }
  // ---- the same mountainside farther back: the slope under Halloran Meadows runs on behind the cut, and climbs to the right
  {
    const r = L.source(seed + 10), pts = [[-20, 152], [120, 150], [260, 146], [400, 137], [540, 122], [680, 98], [800, 68], [900, 32], [980, -2], [1050, -32], [1130, -70], [1230, -120]].map(([x, y]) => [x * sx, y * sy]);
    const yS = x => { for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) return lerp(pts[i - 1][1], pts[i][1], (x - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0])); return pts[pts.length - 1][1]; };
    const d = poly([...pts, [W + 30, SH + 20], [-20, SH + 20]]), tone = mix(P.farLit, P.midLit, 0.22);
    // forest on it, in bands that fade with distance down into the haze, and a few gullies running down the fall line
    let bands = ''; [[30, 0.86, 0.5], [64, 0.9, 0.42], [104, 0.93, 0.34]].forEach(([dy, hz, op]) => { let bd = ''; for (let x = -10; x <= W + 24; x += 24) bd += (bd ? ' L' : 'M') + f(x) + ',' + f(yS(x) + dy * u + 6 * u * Math.sin(x * 0.013 + dy));
      bands += `<g fill="none" stroke="${mix(P.teal, P.haze, hz)}" opacity="${op}" stroke-linecap="round" stroke-linejoin="round"><path d="${bd}" stroke-width="${f(1.6 * u)}"/><path d="${bd}" stroke-width="${f(4.4 * u)}" stroke-dasharray="0.1 ${f(5.2 * u)}" transform="translate(0,${f(-1.6 * u)})"/></g>`; });
    let gullies = ''; for (let n = 0; n < 11; n++) { const gx0 = r(40, W - 60), gy0 = yS(gx0) + r(8, 30) * u, len = r(50, 120) * u; gullies += `M${f(gx0)},${f(gy0)} q${f(-len * 0.1)},${f(len * 0.5)} ${f(-len * 0.34)},${f(len)} `; }
    o.push(`<path d="${d}" fill="${tone}"/><path d="${fringe(-10, Math.min(W + 10, 1046 * sx), yS, { hMin: 3 * u, hMax: 6.5 * u, step: 4.6 * u, thick: 2.2 * u, r })}" fill="${mix(P.teal, P.haze, 0.8)}"/>`
      + `<g clip-path="url(#${clip(d)})">${bands}<path d="${gullies}" fill="none" stroke="${P.farShade}" stroke-width="${f(1.3 * u)}" stroke-linecap="round" opacity="0.14"/></g>`
      + `<g clip-path="url(#${clip(d)})">` + grain(0, 0, W, SH, GL(0, 0, W, SH * 0.4, [[0, 0], [0.5, 0.04], [1, 0.12]]), P.farShade, { seed: seed + 11 })
      + `<rect x="0" y="0" width="${W}" height="${SH}" fill="url(#${linGrad(0, SH * 0.3, 0, SH * 0.8, [[0, P.cream, 0], [1, P.cream, 0.6]])})"/></g>`);
  }

  // ---- the caller, and the line of sound to each cliff
  const xc = x0 - 4 * up, M = [xc + 7 * up, plat - 30.5 * up];
  const hit = WALLS.map((w, i) => { const t = (hitFt[i] - w.base) / (w.top - w.base); return [xw[i] + leanOf(w) * (2 * t - 1) - 1.4 * u, Yf(hitFt[i])]; });
  const lineY = (i, x) => M[1] + (x - M[0]) / (hit[i][0] - M[0]) * (hit[i][1] - M[1]);

  // ---- the ground: one piece from the lodge side to the meadows side, cut along the line
  const lits = [mix(P.peach, P.midLit, 0.12), P.peach, mix(P.peach, P.cream, 0.4), mix(P.peach, P.cream, 0.75)];
  const faces = WALLS.map((w, i) => { const x = xw[i], b = Yf(w.base), t = Yf(w.top), lean = leanOf(w); return [[x - lean, b + 2 * u], [x - lean * 0.55, lerp(b, t, 0.3)], [x - lean * 0.2 + 1.4 * u, lerp(b, t, 0.34)], [x + lean * 0.1, lerp(b, t, 0.68)], [x + lean * 0.5 + 1.4 * u, lerp(b, t, 0.72)], [x + lean, t]]; });
  const rj = L.source(seed + 19);
  const surface = [...BEHIND, ...GULLY].map(([d, h]) => [Xf(d), Yf(h)]);
  const tops = WALLS.map((w, i) => { const x = xw[i], lean = leanOf(w), xEnd = i < 3 ? xw[i + 1] - leanOf(WALLS[i + 1]) : 1e9; return G.filter(p => p[0] > x + lean + 1 && p[0] < xEnd - 1).map(([px, py], n) => [px, py + rj(-1, 1) * u * (n ? 1 : 0)]); });
  WALLS.forEach((w, i) => surface.push(...faces[i], ...tops[i]));
  const GD = poly([[surface[0][0], SH + 20], ...surface, [surface[surface.length - 1][0], SH + 20]]), gc = clip(GD);
  {
    const litc = mix(P.peach, P.midLit, 0.5), body = mix(P.midLit, P.midShade, 0.3), shade = mix(P.midShade, P.plumDeep, 0.2), sunny = mix(P.midLit, P.farLit, 0.36);
    const xa = -20, xb = W + 20, at = x => Math.max(0, Math.min(1, (x - xa) / (xb - xa)));
    // lit where it faces the sun (the lodge side of the knob, and the long slope), in shade where it faces away (the gully and the saddle)
    o.push(`<path d="${GD}" fill="url(#${linGrad(xa, 0, xb, 0, [[0, litc], [at(x0 - 80 * u), body], [at(x0 + 12 * u), shade], [at(xw[1]), mix(shade, body, 0.45)], [at(xw[2]), body], [at(xw[3] + 40 * u), sunny], [1, mix(sunny, P.farLit, 0.3)]])})"/>`);
    const r = L.source(seed + 80);
    let beds = ''; for (let n = 0; n < 16; n++) { const x1 = r(-10, W * 0.9), y1 = lerp(plat + 20 * u, SH - 30 * u, r(0, 1)), len = r(110, 320) * u; beds += `M${f(x1)},${f(y1)} q${f(len * 0.5)},${f(r(-3, 3) * u - 0.02 * len)} ${f(len)},${f(-0.04 * len)} `; }
    for (let n = 0; n < 9; n++) { const x1 = r(xw[3] + 30 * u, W), y1 = gY(x1) + r(16, 150) * u, len = r(60, 180) * u; beds += `M${f(x1)},${f(y1)} q${f(len * 0.5)},${f(r(-3, 3) * u - 0.3 * len)} ${f(len)},${f(-0.56 * len)} `; }
    let cracks = ''; for (let n = 0; n < 8; n++) { const xx = r(10 * u, x0 + 20 * u), y1 = gY(xx) + r(8, 30) * u; cracks += `M${f(xx)},${f(y1)} l${f(r(-5, 7) * u)},${f(r(20, 56) * u)} `; }
    o.push(`<g clip-path="url(#${gc})"><rect x="-20" y="-20" width="${W + 40}" height="${SH + 40}" fill="url(#${linGrad(0, plat - 30 * u, 0, SH, [[0, P.midShade, 0], [1, P.midShade, 0.36]])})"/>`
      + `<path d="${beds}" stroke="${mix(body, P.midShade, 0.7)}" stroke-width="${f(1 * u)}" fill="none" opacity="0.2" stroke-linecap="round"/><path d="${cracks}" stroke="${shade}" stroke-width="${f(1.2 * u)}" fill="none" opacity="0.45" stroke-linecap="round"/>`
      + grain(x0 - 90 * u, -10, xw[2] - x0 + 120 * u, SH + 10, GL(x0 - 70 * u, 0, xw[2] + 20 * u, 0, [[0, 0], [0.16, 0.4], [0.5, 0.3], [1, 0.06]]), P.plumDeep, { seed: seed + 81 })
      + grain(xw[2], -10, W - xw[2] + 20, SH + 10, GL(0, 0, 0, SH, [[0, 0.03], [0.5, 0.08], [1, 0.2]]), P.midShade, { seed: seed + 82 }) + `</g>`);
    // the lit ground along the top of the knob, and the trampled patch at the rail
    o.push(`<path d="${poly(surface.filter(p => p[0] < x0 + 1)).replace(/Z$/, '')}" fill="none" stroke="${P.cream}" stroke-width="${f(1.6 * u)}" stroke-linejoin="round" opacity="0.7"/><path d="M${f(x0 - 64 * up)},${f(gY(x0 - 64 * up))} L${f(x0)},${plat} l${f(3 * u)},${f(4 * u)} L${f(x0 - 64 * up)},${f(gY(x0 - 64 * up) + 4 * u)}Z" fill="${P.cream}" opacity="0.8"/>`);
    // the forest behind the point, thinning toward the rail; and trees in the gully, kept under the first line of sound
    o.push(`<path d="${fringe(-10, x0 - 70 * up, gY, { hMin: 6 * u, hMax: 13 * u, step: 6 * u, thick: 3 * u, r })}" fill="${mix(P.teal, P.tealDeep, 0.1)}"/>`);
    c.knob.forEach(([xx, h, kind], n) => o.push(conifer(xx, gY(xx) + 3 * u, h, treeC(mix(P.teal, P.tealDeep, 0.3)), { kind, seed: seed + 90 + n })));
    const ga = Xf(140), gb = xw[0] - leanOf(WALLS[0]) - 12 * u;
    o.push(`<path d="${fringe(ga, gb, gY, { hMin: 5 * u, hMax: 10 * u, step: 6 * u, thick: 2.6 * u, r })}" fill="${mix(P.teal, P.tealDeep, 0.3)}"/>`);
    for (let xx = ga + r(4, 14) * u, n = 0; xx < gb; xx += r(15, 26) * u, n++) { const yb = gY(xx) + 2.4 * u, room = yb - lineY(0, xx) - 7 * u, h = Math.min(r(18, 30) * u, room); if (h > 9 * u) o.push(conifer(xx, yb, h, treeC(mix(P.teal, P.tealDeep, 0.2)), { kind: kinds[n % 4], seed: seed + 70 + n })); }
  }
  // ---- the four cliffs: a lit face each, with its own rock, and forest on the ground behind it
  for (let i = 3; i >= 0; i--) {
    const w = WALLS[i], x = xw[i], b = Yf(w.base), t = Yf(w.top), fh = b - t, lean = leanOf(w), r = L.source(seed + 20 + i), face = faces[i], top = tops[i];
    const xEnd = i < 3 ? xw[i + 1] - leanOf(WALLS[i + 1]) : W + 40, fw = 16 * u + 0.5 * fh, dark = mix(P.midLit, P.midShade, 0.8);
    // the face catches the light, and the light dies away into the rock behind it
    const band = poly([...face, ...top.filter(p => p[0] < x + fw + 30 * u), [x + fw + 30 * u, lerp(t, b, 0.3)], [x + fw * 0.5, b + 3 * u], [x - lean, b + 3 * u]]), bc = clip(band);
    let joints = '';
    if (i === 1) { for (let xx = x - lean + 3 * u; xx < x + fw + 26 * u; xx += r(4.4, 6.2) * u) { const cut = r(0, 0.3); joints += `M${f(xx)},${f(b + 3 * u)} L${f(xx + lean * 1.9 * (1 - cut))},${f(lerp(b, t, 1 - cut) + 2 * u)} `; } }      // Organ Wall: columns, like pipes
    else for (let n = 0, nn = 3 + i; n < nn; n++) { const xx = x - lean + r(3, 12 + fw / u) * u, a = r(0.05, 0.5), e = r(0.6, 1); joints += `M${f(xx + lean * 1.9 * a)},${f(lerp(b, t, a))} L${f(xx + lean * 1.9 * e + r(-3, 3) * u)},${f(lerp(b, t, e) + 2 * u)} `; }
    let ledges = ''; for (let n = 0; n < 2; n++) { const yy = lerp(b, t, r(0.25, 0.8)), xq = x + r(4, 14) * u; ledges += `M${f(xq)},${f(yy)} h${f(r(12, 12 + fw / u * 0.7) * u)} `; }
    o.push(`<g clip-path="url(#${gc})"><g clip-path="url(#${bc})"><rect x="${f(x - lean - 2)}" y="${f(t - 6)}" width="${f(fw + lean + 34 * u)}" height="${f(fh + 12)}" fill="url(#${linGrad(x - lean, 0, x + fw + 26 * u, 0, [[0, lits[i], 1], [0.22, lits[i], 0.72], [1, lits[i], 0]])})"/>`
      + `<path d="${joints}" stroke="${dark}" stroke-width="${f(1.1 * u)}" fill="none" opacity="${i === 1 ? 0.55 : 0.45}" stroke-linecap="round"/><path d="${ledges}" stroke="${P.cream}" stroke-width="${f(1.2 * u)}" fill="none" opacity="0.5" stroke-linecap="round"/></g></g>`);
    o.push(`<path d="${poly([face[0], face[1], face[2], face[3], face[4], face[5], ...top.slice(0, 2)]).replace(/Z$/, '')}" fill="none" stroke="${P.cream}" stroke-width="${f(1.5 * u)}" stroke-linejoin="round" stroke-linecap="round" opacity="0.85"/>`);
    // fallen rock at the foot of the face
    const tw = 8 * u + 0.3 * fh; o.push(`<path d="M${f(x - lean - tw)},${f(b + 3 * u)} L${f(x - lean * 0.7)},${f(lerp(b, t, 0.24))} L${f(x + 6 * u)},${f(b + 3 * u)}Z" fill="${mix(P.midLit, lits[i], 0.4)}"/><path d="M${f(x - lean - tw)},${f(b + 3 * u)} L${f(x - lean * 0.7)},${f(lerp(b, t, 0.24))} L${f(x - lean - 2 * u)},${f(b + 3 * u)}Z" fill="${lits[i]}" opacity="0.7"/>`);
    // forest along the ground behind it: a ragged edge, and taller trees kept under the line of sound that passes over
    const xa = x + lean + 8 * u, xb = Math.min(xEnd - 10 * u, W + 20), tone = mix(P.teal, P.haze, [0.06, 0.12, 0.2, 0.26][i]);
    o.push(`<path d="${fringe(xa, xb, gY, { hMin: 5 * u, hMax: 11 * u, step: (i === 3 ? 4.4 : 5.4) * u, thick: 2.6 * u, r })}" fill="${mix(P.teal, P.haze, [0.16, 0.22, 0.3, 0.36][i])}"/>`);
    for (let xx = xa + r(10, 22) * u, n = 0; xx < xb; xx += r(i === 3 ? 11 : 17, i === 3 ? 24 : 38) * u, n++) {
      const yb = gY(xx) + 2.4 * u, room = i < 3 ? yb - lineY(i + 1, xx) - 6 * u : 60 * u, h = Math.min(r(15, 27) * u, room);
      if (h > 8 * u) o.push(conifer(xx, yb, h, treeC(tone), { kind: kinds[(n + i) % 4], seed: seed + i * 50 + n }));
    }
  }
  // the forest in front of everything, along the bottom edge
  o.push(L.hill(-20, W + 20, [[-20, SH - 14 * u], [W * 0.3, SH - 22 * u], [W * 0.62, SH - 30 * u], [W + 20, SH - 24 * u]], 2, 24 * u, mix(P.teal, P.haze, 0.3), P.tealDeep, { mixed: true, baseY: SH + 10, share: true, scale: 1.15 * u }));

  // ---- the rail, and the people at it: seen from the side, facing the cliffs
  { const rx0 = x0 - 62 * up, rx1 = x0 + 4 * up, ry = plat - 14 * up; let posts = '';
    for (let n = 0; n <= 4; n++) { const xx = lerp(rx0, rx1, n / 4); posts += `<rect x="${f(xx - 1.2 * up)}" y="${f(ry + (gY(xx) - plat))}" width="${f(2.4 * up)}" height="${f(14 * up)}"/>`; }
    const y0 = gY(rx0) - plat;
    o.push(`<g fill="${P.plumDeep}">${posts}</g><g fill="none" stroke="${P.plumDeep}" stroke-linecap="round"><path d="M${f(rx0 - 2 * up)},${f(ry + y0)} L${f(rx1 + 2 * up)},${f(ry)}" stroke-width="${f(2.8 * up)}"/><path d="M${f(rx0)},${f(ry + y0 + 6 * up)} L${f(rx1)},${f(ry + 6 * up)}" stroke-width="${f(1.5 * up)}"/></g><path d="M${f(rx0 - 2 * up)},${f(ry + y0 - 1.2 * up)} L${f(rx1 + 2 * up)},${f(ry - 1.2 * up)}" stroke="${P.cream}" stroke-width="${f(0.9 * up)}" opacity="0.6"/>`); }
  const person = (x, pose, jacket, skin = '#E9B08C', hair = '#2B2136') => { const y = gY(x), s = [];
    s.push(`<rect x="-4.6" y="-13.4" width="4" height="13.4" rx="1.4" fill="#2A2438"/><rect x="0.4" y="-13.4" width="4" height="13.4" rx="1.4" fill="#3A3148"/><rect x="-1" y="-1.6" width="7" height="1.8" rx="0.9" fill="#1B1420"/>`);
    s.push(`<path d="M-5.6,-27.6 Q-6,-13 -5,-12.6 H5 Q6,-13 5.6,-27.6 Q0,-30.4 -5.6,-27.6Z" fill="${jacket}"/><path d="M-5.6,-27.6 Q-6,-13 -5,-12.6 H-1.6 Q-2.4,-20 -2,-28.8Z" fill="#000" opacity="0.2"/>`);
    s.push(`<circle cx="0.8" cy="-33.4" r="4.6" fill="${skin}"/><path d="M-3.9,-32.6 A4.7,4.7 0 0 1 3.4,-37.4 Q0.4,-36.6 -1,-34 Q-2,-31.6 -3.9,-32.6Z" fill="${hair}"/>`);
    if (pose === 'call') s.push(`<path d="M0.6,-25.6 L7.2,-24.6 L6.8,-30.6" fill="none" stroke="${jacket}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6.9" cy="-31.6" r="1.9" fill="${skin}"/><path d="M-1,-25.4 L5.8,-26.4 L6.2,-31.4" fill="none" stroke="${mix(jacket, '#000000', 0.2)}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>`);
    else if (pose === 'listen') s.push(`<path d="M0.4,-25.6 L5.4,-22 L3.8,-32.4" fill="none" stroke="${jacket}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="3.6" cy="-33.4" r="1.8" fill="${skin}"/>`);
    else s.push(`<path d="M0.6,-25.6 L1.6,-15" fill="none" stroke="${mix(jacket, '#000000', 0.16)}" stroke-width="3.5" stroke-linecap="round"/><circle cx="1.7" cy="-13.6" r="1.8" fill="${skin}"/>`);
    return `<g transform="translate(${f(x)},${f(y)}) scale(${f(up * 100) / 100})">${s.join('')}</g>`; };
  o.push(until(2, person(x0 - 32 * up, 'listen', P.tealLight, '#C68A6A', '#241B2E') + person(xc, 'call', P.coral)));
  // 3 to 5: nobody, and a closed sign on the rail
  o.push(between(3, 5, `<g transform="translate(${f(x0 - 24 * up)},${f(plat - 19 * up)}) rotate(-4) scale(${f(up * 100) / 100})"><rect x="-13" y="-7" width="26" height="14" rx="2" fill="${CORAL}" stroke="${PAPER}" stroke-width="1.2"/><path d="M-8,-1.6 h16 M-8,2.6 h11" stroke="${PAPER}" stroke-width="1.7" stroke-linecap="round"/></g>`));

  // ---- the sound: the shout going out, a line to the part of each cliff that the rail can see, and the bounce
  const wave = (cx, cy, a0, a1, radii, color, w) => radii.map(R => { const p0 = [cx + R * Math.cos(a0), cy + R * Math.sin(a0)], p1 = [cx + R * Math.cos(a1), cy + R * Math.sin(a1)]; return `<path d="M${f(p0[0])},${f(p0[1])} A${f(R)},${f(R)} 0 0 1 ${f(p1[0])},${f(p1[1])}" fill="none" stroke="${color}" stroke-width="${f(w)}" stroke-linecap="round"/>`; }).join('');
  const paths = hit.map(([hx, hy], i) => { const a = Math.atan2(hy - M[1], hx - M[0]), sxx = M[0] + Math.cos(a) * 40 * up, syy = M[1] + Math.sin(a) * 40 * up, rr = Math.max(6 * u, Math.min(13 * u, 0.3 * (Yf(WALLS[i].base) - Yf(WALLS[i].top))));
    return `<path d="M${f(sxx)},${f(syy)} L${f(hx)},${f(hy)}" stroke="${DEEP}" stroke-width="${f(1.3 * u)}" fill="none" opacity="0.85"/><path d="M-6,-3 L0,0 L-6,3" transform="translate(${f(hx)},${f(hy)}) rotate(${f(a * 180 / Math.PI)}) scale(${u})" fill="none" stroke="${DEEP}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`
      + wave(hx, hy, Math.PI * 0.74, Math.PI * 1.26, [rr * 0.62, rr], DEEP, 1.3 * u); }).join('');
  o.push(until(2, wave(M[0], M[1], -0.62, 0.62, [13 * up, 22 * up, 31 * up], CORAL, 2 * u) + paths) + between(3, 4, `<g opacity="0.3">${paths}</g>`));
  // a dotted line down from the foot of each cliff to the scale
  o.push(`<path d="${xw.map((x, i) => `M${f(x)},${f(Yf(WALLS[i].base) + 7 * u)} V${SH}`).join(' ')}" stroke="${BONE}" stroke-width="${f(1.4 * u)}" stroke-dasharray="${f(2 * u)} ${f(4.4 * u)}" stroke-linecap="round" fill="none" opacity="0.9"/>`);

  // ---- where the fifth one comes from
  const mark = (x, y, ring) => `<g transform="translate(${f(x)},${f(y)}) scale(${u})">${ring ? `<circle r="25" fill="none" stroke="${CORAL}" stroke-width="1.4" opacity="0.45"/><circle r="18" fill="none" stroke="${CORAL}" stroke-width="1.6" opacity="0.7"/>` : ''}<circle r="11.5" fill="${PAPER}" stroke="${CORAL}" stroke-width="2.2"/></g>` + T(x, y + 5.6 * u, '?', { font: 'serif', size: 16.5 * u, anchor: 'middle', fill: CORAL_D, cls: false });
  const dots = (xa, ya, xb, yb) => `<path d="M${f(xa)},${f(ya)} L${f(xb)},${f(yb)}" stroke="${CORAL_D}" stroke-width="${f(1.7 * u)}" stroke-dasharray="${f(1 * u)} ${f(5 * u)}" stroke-linecap="round" fill="none"/>`;
  const drop = x => `<path d="M${f(x)},${f(SH - 4)} V${SH}" stroke="${CORAL}" stroke-width="${f(1.4 * u)}"/>`;
  { // 2 and 3: at the distance its timing gives, 3,800 ft, there is no cliff: it is the wooded slope above the last one
    const y5 = gY(x5) - 30 * u; o.push(between(2, 3, dots(M[0] + 36 * up, M[1] - 9 * up, x5 - 13 * u, y5 + 3 * u) + mark(x5, y5)));
    // 4: before the shout. On the picture's scale that is behind the point, on the slope down to the lodge.
    const yb = gY(xE) - 30 * u; o.push(between(4, 4, dots(xE + 13 * u, yb - 2 * u, x0 - 30 * up, plat - 24 * up) + mark(xE, yb)));
    // 5: nearer, and loud
    const xn = lerp(xE, x0, 0.42), yn = gY(xn) - 30 * u; o.push(between(5, 5, wave(xn, yn, -0.62, 0.62, [24 * u, 33 * u, 42 * u], CORAL, 2 * u) + mark(xn, yn, true)));
    // 6: the reader stands at the rail, and it is at their back
    o.push(from(6, mark(x0 - 40 * up, plat - 19 * up, true) + person(xc, 'stand', '#3A3148') + T(x0 + 12 * up, plat - 14 * up, 'you', { size: wide ? 15.5 : 14.5, weight: 700, fill: CORAL_D, halo: PAPER, cls: false })));
  }

  // ---- names on the picture: the point, and the way to the two places on the map that are off its edges
  const arrow = (x, y, rot) => `<path d="M-7,0 H6 M1,-4.6 L6.6,0 L1,4.6" transform="translate(${f(x)},${f(y)}) rotate(${rot})" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`;
  if (wide) {
    o.push(T(x0 - 6, plat - 64, 'Echo Point', { font: 'serif', size: 21, fill: INK, anchor: 'end', cls: false }) + T(x0 - 6, plat - 45, '4,330 ft', { size: 15.5, fill: mix(INK, P.skyLow, 0.2), anchor: 'end', num: true, cls: false }));
    o.push(arrow(22, plat + 110, 155) + T(36, plat + 115, 'Basin Lodge, 0.5 mi', { size: 15.5, weight: 650, fill: INK, cls: false }));
    o.push(T(W - 122, 40, 'Halloran Meadows', { font: 'serif', size: 19, fill: INK, anchor: 'end', cls: false }) + T(W - 122, 60, '6,230 ft', { size: 15.5, fill: mix(INK, P.midLit, 0.2), anchor: 'end', num: true, cls: false }) + arrow(W - 106, 34, -40));
    o.push(locator(c.map[0], c.map[1], c.map[2], c.map[3]));
  } else {
    o.push(T(14, plat - 30, 'Echo Point', { font: 'serif', size: 14.5, fill: INK, cls: false }));
    o.push(arrow(14, plat + 62, 155) + T(25, plat + 66.6, 'lodge', { size: 13.5, weight: 650, fill: INK, cls: false }));
    o.push(T(W - 54, 21, 'meadows', { size: 13.5, weight: 650, fill: INK, anchor: 'end', cls: false }) + arrow(W - 42, 15, -40));
  }

  // ================= THE STRIP OF SOUND =================
  const PH = c.PH, CY = c.CY, pitch = c.pitch, bw = c.bw, A = c.amp, PW = pitch * 12;
  o.push(`<rect x="0" y="${SH}" width="${W}" height="${PH}" fill="${PANEL}"/>` + grain(0, SH, W, PH, GL(0, SH, 0, SH + PH, [[0, 0.3], [0.5, 0.1], [1, 0.34]]), '#06141A', { seed: seed + 5 }) + `<path d="M0,${SH} H${W}" stroke="${BONE}" stroke-width="1" opacity="0.3"/>`);
  const packet = (x, amp, shape, fill, ghost) => shape.map((h, i) => { const hh = Math.max(1.4, amp * h * A); return `<rect x="${f(x + i * pitch)}" y="${f(CY - hh)}" width="${bw}" height="${f(hh * 2)}" rx="${f(bw / 2)}" ${ghost ? `fill="${PANEL}" stroke="${fill}" stroke-width="${f(0.9 * u)}"` : `fill="${fill}"`}/>`; }).join('');
  // the line of quiet the bars stand on, with a tick for each second. From stage 4 it runs back past the call.
  const quiet = (t0, t1) => { let d = `M${f(X(t0))},${CY} H${f(Math.min(W - 14, X(t1)))} `; for (let t = Math.ceil(t0); t <= t1 && X(t) < W - 14; t++) d += `M${f(X(t))},${f(CY - 4 * u)} v${f(8 * u)} `; return `<path d="${d}" stroke="${BONE}" stroke-width="1" opacity="0.26" fill="none"/>`; };
  o.push(quiet(0, 7.6) + from(4, quiet(-2.2, 0)));
  o.push(`<path d="${xw.map(x => `M${f(x)},${SH} v${f(10 * u)}`).join(' ')} M${f(x0)},${SH} v${f(10 * u)}" stroke="${BONE}" stroke-width="${f(1.4 * u)}" fill="none" opacity="0.9"/>`);
  const EAMP = [0.64, 0.45, 0.31, 0.22];
  // the call: solid, then an outline while nobody calls, then solid again when the caller is the reader
  o.push(until(2, packet(x0, 1, CALL, GOLD)) + between(3, 5, packet(x0, 1, CALL, GOLD, true)));
  // the four echoes: the call's shape, smaller each time
  o.push(until(2, xw.map((x, i) => packet(x, EAMP[i], CALL, BONE)).join('')) + between(3, 4, xw.map((x, i) => packet(x, EAMP[i], CALL, BONE, true)).join('')));
  // the fifth: not the call's shape, and louder than the fourth
  o.push(between(2, 3, packet(x5, 0.34, OTHER, CORAL)) + between(4, 4, packet(xE, 0.42, OTHER, CORAL)));
  // 5: voices, at no wall's distance
  const vt = [EARLY, 1.72, 4.55];
  o.push(between(5, 5, vt.map((t, k) => packet(X(t), [0.74, 0.8, 0.9][k], VOICES[k], CORAL)).join('')));
  // 6: the reader's own, and close behind it the other, which has taken its shape
  o.push(from(6, packet(x0 + pitch * 1.5, 1.16, CALL, CORAL) + packet(x0, 1, CALL, GOLD)));

  const fs = c.fs, yName = SH + c.rowName, ySub = SH + c.rowSub, yTag = CY - c.tagUp, yTime = CY + c.timeDown;
  const dim = mix(BONE, PANEL, 0.3);
  if (wide) {
    // each wall's name and distance, under its foot; under those its echo; under that the time
    o.push(T(x0 + 8, yName, 'Your shout', { font: 'serif', size: fs.name, fill: BONE, alts: { 1: 'Your call', 3: 'No shout', 6: 'You' } }) + T(x0 + 8, ySub, 'at the rail', { size: fs.sub, fill: dim, alts: { 3: 'not allowed', 4: 'point closed', 6: 'reading this' } }));
    WALLS.forEach((w, i) => o.push(T(xw[i] + 8, yName, w.name, { font: 'serif', size: fs.name, fill: BONE, cls: false }) + T(xw[i] + 8, ySub, ftLabel(w.d), { size: fs.sub, fill: dim, num: true, cls: false })));
    o.push(until(4, WALLS.map((w, i) => T(xw[i], yTag, `${ORD[i]} echo`, { size: fs.tag, fill: dim, alts: { 1: `${ORD[i]} answer` } })).join('')));
    WALLS.forEach((w, i) => o.push(T(xw[i], yTime, sLabel(secs(w.d)), { size: fs.time, weight: 700, fill: BONE, num: true, alts: { 5: 'silent' } })));
    o.push(T(x0, yTime, '0 s', { size: fs.time, weight: 700, fill: GOLD, num: true }));
    o.push(until(3, T(28, CY - 20, 'The farther the cliff,', { font: 'serif', size: 19.5, fill: BONE, alts: { 3: 'A normal shout and' } }) + T(28, CY + 5, 'the later and fainter', { font: 'serif', size: 19.5, fill: BONE, alts: { 3: 'its four echoes, for' } }) + T(28, CY + 30, 'the echo.', { font: 'serif', size: 19.5, fill: BONE, alts: { 1: 'the answer.', 3: 'reference.' } })));
    // the fifth, in the same three rows
    o.push(between(2, 3, drop(x5) + T(x5 + 8, yName, 'No cliff', { font: 'serif', size: fs.name, fill: CORAL, cls: false }) + T(x5 + 8, ySub, ftLabel(FIFTH), { size: fs.sub, fill: dim, num: true, cls: false })
      + T(x5, yTag, 'a fifth?', { size: fs.tag, weight: 700, fill: CORAL, alts: { 3: "don't answer" } }) + T(x5, yTime, sLabel(secs(FIFTH)), { size: fs.time, weight: 700, fill: CORAL, num: true, cls: false })));
    o.push(between(4, 4, drop(xE) + T(28, yName, 'Behind the point', { font: 'serif', size: fs.name, fill: CORAL, cls: false }) + T(28, ySub, 'toward the lodge', { size: fs.sub, fill: dim, cls: false })
      + T(xE, yTag, 'the fifth', { size: fs.tag, weight: 700, fill: CORAL, cls: false }) + T(xE, yTime, '1.3 s early', { size: fs.time, weight: 700, fill: CORAL, num: true, cls: false })));
    o.push(between(5, 5, ["Tomás's voice", "June's voice", 'not one we know'].map((s, k) => T(X(vt[k]), yTag, s, { size: fs.tag, weight: 700, fill: CORAL, cls: false })).join('')
      + T(28, yName, 'Heard Sept. 15', { font: 'serif', size: fs.name, fill: CORAL, cls: false }) + T(28, ySub, 'nobody at the rail', { size: fs.sub, fill: dim, cls: false })));
    o.push(from(6, T(x0 + PW + 26, CY - 12, "It's a tenth of a second", { font: 'serif', size: 21, fill: CORAL, cls: false }) + T(x0 + PW + 26, CY + 15, 'behind you.', { font: 'serif', size: 21, fill: CORAL, cls: false })
      + T(28, yName, 'Behind you', { font: 'serif', size: fs.name, fill: CORAL, cls: false }) + T(28, ySub, '0 ft', { size: fs.sub, fill: dim, num: true, cls: false })));
  } else {
    // on a phone: a numbered tag at each wall's foot, the times under the echoes, and a table of names below
    const badge = (x, y, n, color = BONE, ink = PANEL) => `<circle cx="${f(x)}" cy="${f(y)}" r="10" fill="${color}"/>` + T(x, y + 5, String(n), { anchor: 'middle', size: 14.5, weight: 700, fill: ink, cls: false });
    const by = SH + 22;
    WALLS.forEach((w, i) => o.push(badge(xw[i] + 14, by, i + 1) + T(xw[i], yTime, secs(w.d).toFixed(1), { size: fs.time, weight: 700, fill: BONE, num: true, alts: { 5: '—' } })));
    o.push(`<circle cx="${f(x0 + 14)}" cy="${by}" r="10" fill="${GOLD}"/>` + T(x0, yTime, '0 s', { size: fs.time, weight: 700, fill: GOLD, num: true }));
    o.push(between(2, 3, drop(x5) + badge(x5 + 14, by, 5, CORAL, PAPER) + T(x5, yTime, secs(FIFTH).toFixed(1), { size: fs.time, weight: 700, fill: CORAL, num: true, cls: false })));
    o.push(between(4, 4, drop(xE) + badge(xE + 14, by, 5, CORAL, PAPER) + T(14, yTime, 'early', { size: fs.time, weight: 700, fill: CORAL, cls: false })));
    o.push(between(5, 5, vt.map((t, k) => badge(X(t) + 14, CY - 46, 5, CORAL, PAPER)).join('')));
    o.push(from(6, badge(x0 + 52, CY - 30, 5, CORAL, PAPER)));
    // the table
    const TY = SH + PH, rowH = 36, y1 = TY + 64, cA = 300, cB = W - 18;
    o.push(`<rect x="0" y="${TY}" width="${W}" height="${H - TY}" fill="${PAPER}"/>`);
    o.push(T(50, TY + 27, 'Cliff', { size: 14.5, fill: INK2, cls: false }) + T(cA, TY + 27, 'How far', { size: 14.5, fill: INK2, anchor: 'end', cls: false }) + T(cB, TY + 27, 'Back in', { size: 14.5, fill: INK2, anchor: 'end', cls: false }) + rule(18, TY + 37, cB, TY + 37));
    WALLS.forEach((w, i) => { const y = y1 + i * rowH; o.push(`<circle cx="30" cy="${y - 6}" r="11" fill="${DEEP}"/>` + T(30, y - 0.8, String(i + 1), { anchor: 'middle', size: 15, weight: 700, fill: PAPER, cls: false }) + T(50, y, w.name, { font: 'serif', size: 19.5, cls: false })
      + T(cA, y, ftLabel(w.d), { size: 16.5, anchor: 'end', num: true, cls: false }) + T(cB, y, sLabel(secs(w.d)), { size: 16.5, weight: 700, anchor: 'end', num: true, alts: { 5: 'silent' } }) + rule(18, y + 12, cB, y + 12, { opacity: 0.3 })); });
    const y5 = y1 + 4 * rowH;
    o.push(until(1, T(18, y5 + 1, 'The farther the cliff, the later the echo.', { size: 15.5, fill: INK2, alts: { 1: 'The farther the cliff, the later the answer.' } })));
    o.push(from(2, `<circle cx="30" cy="${y5 - 6}" r="11" fill="${CORAL}"/>` + T(30, y5 - 0.8, '5', { anchor: 'middle', size: 15, weight: 700, fill: PAPER, cls: false })
      + T(50, y5, 'No cliff there', { font: 'serif', size: 19.5, fill: CORAL_D, alts: { 3: "Don't answer it", 4: 'Behind the point', 5: 'Staff voices', 6: 'Behind you' } })
      + T(cA, y5, ftLabel(FIFTH), { size: 16.5, anchor: 'end', num: true, fill: CORAL_D, alts: { 4: 'lodge side', 5: 'not known', 6: '0 ft' } }) + T(cB, y5, sLabel(secs(FIFTH)), { size: 16.5, weight: 700, anchor: 'end', num: true, fill: CORAL_D, alts: { 4: '1.3 s early', 5: 'on its own', 6: '0.1 s' } })));
  }
  return o.join('\n');
}

export function echo(){
  L.usePalette('gold'); L.begin(); L.reseed(141);
  const wide = draw({ wide: true, W: 1200, H: 640, SH: 410, PH: 230, x0: 250, pps: 120, u: 1, plat: 236, vz: 1, ps: 0.66, sun: [322, 100], map: [22, 16, 236, 130],
    knob: [[20, 46, 'fir'], [52, 38, 'hemlock'], [88, 52, 'spruce'], [122, 40, 'fir'], [152, 46, 'spruce'], [180, 34, 'fir']],
    CY: 410 + 136, pitch: 6.5, bw: 4, amp: 40, rowName: 38, rowSub: 61, tagUp: 50, timeDown: 70, fs: { name: 21, sub: 17, tag: 16, time: 18 } }, 9400);
  L.reseed(142);
  const tall = draw({ wide: false, W: 420, H: 632, SH: 250, PH: 150, x0: 78, pps: 42, u: 0.54, plat: 142, vz: 1.5, ps: 0.85, sun: [150, 62],
    knob: [[9, 30, 'fir'], [27, 24, 'hemlock'], [44, 28, 'spruce']],
    CY: 250 + 84, pitch: 2.4, bw: 1.5, amp: 30, rowName: 0, rowSub: 0, tagUp: 0, timeDown: 52, fs: { time: 15.5 } }, 9500);
  return { svg: `<defs>${L.defs.join('\n')}</defs><g>${wide}</g><g transform="translate(0,1000)">${tall}</g>`, vb: [0, 0, 1200, 640], vbm: [0, 1000, 420, 632], flat: true };
}
