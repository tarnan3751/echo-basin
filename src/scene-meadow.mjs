// Halloran Meadows at about seven in the evening: the elk picture in the wildlife section.
// Through stage 2 the herd is grazing. At 3 every animal is standing with its head up, facing the same way. At 4
// they are gone and a straight track runs through the flowers.
// The meadow is drawn in perspective from a low rise at its edge: Y0 is the height of the eye, and the size of
// anything standing on the grass follows from how far below that line its feet are. Whatever stands on the meadow
// (animals, trees, boulders, grass, flowers) goes into one list and is painted from the far side to the near side,
// so nothing that is behind an animal is ever drawn over it.
import * as L from './lib.mjs';
import { ribs, snowcaps } from './peaks.mjs';
import { conifer, pineTree, aspen } from './conifers.mjs';
import { elk, elkColours } from './elk.mjs';
import { tuft, flower, rosette, thicket, hummock } from './groundcover.mjs';
import { smooth } from './snowkit.mjs';
const { f, rnd, pick, lerp, mix, poly, curveFn, grain, GL, GR, from, until, between, linGrad, radGrad, clip, sliver } = L;

const W = 1200, H = 640, Y0 = 372;
const unit = y => (y - Y0) / 150;                         // 1 where the nearest animals stand
// Shadows. The sun is low on the right, so a shadow lies to the left of what throws it and a little toward us. A
// shadow is the thing's own outline laid over on the grass, hinged at its foot, so it always starts exactly where
// the thing stands. How far it comes toward us on the page depends on distance: far off, the ground is seen almost
// edge-on, and a shadow lies flatter along it.
const SHX = 1.1, SHY = 0.26;
const lie = y => SHY * Math.max(0.66, Math.min(1, 0.66 + 0.34 * unit(y)));
const laid = (x, y) => `translate(${f(x)},${f(y)}) matrix(1 0 ${SHX} ${-Math.round(lie(y) * 1000) / 1000} 0 0)`;

// One of the marks along the track: a hole punched through the turf. The sod is pushed up round it in a rim that
// catches the light, the wall on the far side is bare earth, the near wall and the floor are in shadow, and clods
// lie thrown out round it. Drawn for light from the left and mirrored, because here the sun is on the right.
function hole(x, y, s, C){
  return `<g transform="translate(${f(x)},${f(y)}) scale(${f(-s)},${f(s * 0.74)}) rotate(-9)">
<ellipse cx="11" cy="5.5" rx="32" ry="9.5" fill="${C.cast}"/>
<ellipse cx="0" cy="0" rx="26" ry="8.6" fill="${C.rim}"/>
<path d="M-26,0 A26,8.6 0 0 0 26,0 A26,6 0 0 1 -26,0Z" fill="${C.rimSh}"/>
<ellipse cx="0.5" cy="0.4" rx="22" ry="6.6" fill="${C.wall}"/>
<path d="M-21.5,0.4 A22,6.6 0 0 1 16.5,-4.4 C10,-2 6,1.6 5,6.4 A22,6.6 0 0 1 -21.5,0.4Z" fill="${C.deep}"/>
<ellipse cx="-4" cy="1.3" rx="14" ry="3.8" fill="${C.floor}"/>
${[[33, -5, 2.4], [-32, 5, 2], [25, 9.4, 1.6], [-22, -9, 1.5], [38, 3, 1.3]].map(([cx, cy, r]) => `<ellipse cx="${cx + r * 0.9}" cy="${cy + r * 0.7}" rx="${r * 1.3}" ry="${r * 0.6}" fill="${C.cast}"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.wall}"/><circle cx="${f(cx - r * 0.25)}" cy="${f(cy - r * 0.3)}" r="${f(r * 0.55)}" fill="${C.clod}"/>`).join('')}
</g>`;
}
// A smooth line through points [x, y, width].
const dense = (pts, n = 8) => { const out = [], at = i => pts[Math.max(0, Math.min(pts.length - 1, i))]; for (let i = 0; i < pts.length - 1; i++) for (let k = 0; k < n; k++) { const t = k / n, a = at(i - 1), b = at(i), c = at(i + 1), e = at(i + 2); out.push([0, 1, 2].map(j => 0.5 * (2 * b[j] + (c[j] - a[j]) * t + (2 * a[j] - 5 * b[j] + 4 * c[j] - e[j]) * t * t + (3 * b[j] - 3 * c[j] + e[j] - a[j]) * t * t * t))); } out.push(pts[pts.length - 1]); return out; };

export function meadow(){
  L.usePalette('gold'); L.begin(); L.reseed(59); L.setSun({ x: 1500, y: 240, r: 0 }); L.setWater(Y0 + 10);
  const P = L.P, o = [];
  // ================= sky =================
  o.push(`<rect x="0" y="-50" width="${W}" height="470" fill="url(#${linGrad(0, 0, 0, 380, [[0, P.skyTop], [0.4, P.skyMid], [0.8, P.skyLow], [1, P.skyHorizon]])})"/>`);
  o.push(grain(0, -50, W, 300, GL(0, 0, 0, 250, [[0, 0.4], [0.5, 0.14], [1, 0]]), P.grainSky));
  o.push(`<circle cx="1170" cy="260" r="540" fill="url(#${radGrad(1170, 260, 540, [[0, P.sun, 0.8], [0.4, P.cream, 0.3], [1, P.cream, 0]])})"/>`);
  o.push(grain(560, -20, 640, 440, GR(1170, 260, 600, [[0, 0.3], [0.5, 0.14], [1, 0]]), P.sun));
  o.push(L.cloud(330, 98, 0.8, [[0, 0, 200, 22], [44, 17, 290, 26], [-20, 37, 170, 20]]) + L.cloud(850, 122, 0.6, [[0, 0, 170, 20], [-24, 15, 240, 24]]) + L.cloud(118, 150, 0.5, [[0, 0, 180, 20], [30, 15, 230, 22]]));
  { let b = ''; for (const [x, y, s] of [[640, 150, 1], [668, 138, 0.8], [614, 166, 0.85], [700, 158, 0.65], [586, 146, 0.6]]) b += `<path d="M${f(x - 8 * s)},${f(y + 1 * s)} Q${f(x - 4 * s)},${f(y - 5 * s)} ${x},${y} Q${f(x + 4 * s)},${f(y - 5 * s)} ${f(x + 8 * s)},${f(y + 1 * s)}"/>`;
    o.push(until(3, `<g fill="none" stroke="${P.plum}" stroke-width="1.7" stroke-linecap="round" opacity="0.8">${b}</g>`)); }
  // ================= mountains: the far range under snow, a nearer and lower one in front of it =================
  {
    const r = L.range([[-20, 322], [60, 250], [130, 286], [230, 178], [310, 244], [400, 214], [500, 274], [600, 192], [690, 252], [780, 224], [870, 280], [975, 206], [1070, 268], [1140, 236], [1220, 262]], { baseY: 388, lit: P.farLit, shadeColor: P.farShade, shadeOpacity: 0.34, snowPeaks: [3, 7, 11], amp: 5, seg: 30, caps: false });
    const caps = snowcaps(r.peaks, 41), rb = ribs(r.peaks, 19, 1), lift = mix(P.farLit, P.cream, 0.6);
    o.push(r.svg + `<g clip-path="url(#${r.cid})"><path d="${caps}" fill="${P.snow}"/><path d="${r.shadeD}" fill="${P.farShade}" fill-opacity="0.34" clip-path="url(#${clip(caps)})"/><path d="${rb.cut}" fill="${P.farShade}" fill-opacity="0.17"/><path d="${rb.deep}" fill="${P.farShade}" fill-opacity="0.2"/><path d="${rb.lift}" fill="${lift}" fill-opacity="0.3"/><path d="${rb.fluteLit}" fill="none" stroke="${P.farShade}" stroke-opacity="0.22" stroke-width="1.2" stroke-linecap="round"/><path d="${rb.fluteSh}" fill="none" stroke="${lift}" stroke-opacity="0.3" stroke-width="1.2" stroke-linecap="round"/></g>`);
    o.push(grain(0, 160, W, 230, GL(0, 180, 0, 370, [[0, 0.42], [0.5, 0.2], [1, 0.02]]), P.farShade, { clipId: clip(r.shadeD), opacity: 0.3 }));
    o.push(`<path d="${rb.rim}" fill="none" stroke="${P.sun}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" opacity="0.95"/>`);
    o.push(`<rect x="0" y="240" width="${W}" height="150" fill="url(#${linGrad(0, 240, 0, 380, [[0, P.cream, 0], [1, P.cream, 0.62]])})" clip-path="url(#${r.cid})"/>`);
    const m = L.range([[-20, 346], [80, 312], [170, 334], [262, 298], [350, 326], [450, 310], [540, 340], [640, 322], [724, 300], [820, 332], [900, 312], [1000, 338], [1096, 306], [1220, 328]], { baseY: 388, lit: P.midLit, shadeColor: P.midShade, shadeOpacity: 0.42, amp: 4, seg: 28, ridgeZig: 9 });
    const mb = ribs(m.peaks, 23, 0.8);
    o.push(m.svg + `<g clip-path="url(#${m.cid})"><path d="${mb.cut}" fill="${P.midShade}" fill-opacity="0.2"/><path d="${mb.deep}" fill="${P.midShade}" fill-opacity="0.24"/><path d="${mb.lift}" fill="${mix(P.midLit, P.peach, 0.45)}" fill-opacity="0.22"/></g><path d="${mb.rim}" fill="none" stroke="${mix(P.midLit, P.cream, 0.5)}" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round" opacity="0.7"/>`);
    o.push(`<rect x="0" y="300" width="${W}" height="90" fill="url(#${linGrad(0, 304, 0, 384, [[0, P.peach, 0], [1, P.cream, 0.72]])})" clip-path="url(#${m.cid})"/>`);
  }
  // ================= the forest beyond the meadow =================
  // Wooded slopes left and right, a low gap between them, and along the foot of both a front rank of separate trees
  const edge = curveFn([[0, 384], [200, 382], [420, 380], [620, 381], [840, 380], [1040, 382], [1200, 384]]);   // where the meadow ends
  const far0 = mix(P.haze, P.farLit, 0.3), far1 = mix(P.teal, P.haze, 0.4);
  o.push(`<path d="${L.treeRow(500, 760, curveFn([[500, 376], [640, 377], [760, 375]]), { hMin: 7, hMax: 15, step: 6, baseY: 386, mixed: true })}" fill="${mix(P.midLit, P.haze, 0.55)}"/>`);
  o.push(L.hill(-20, 590, [[-20, 330], [130, 320], [290, 336], [440, 358], [540, 372], [590, 380]], 4, 12, far0, far1, { baseY: 388, mixed: true, edge: 0.9, scale: 1.25, share: true }));
  o.push(L.hill(690, 1220, [[690, 380], [760, 368], [880, 350], [1010, 334], [1130, 324], [1220, 320]], 4, 12, far0, far1, { baseY: 388, mixed: true, edge: 0.9, scale: 1.25, share: true }));
  o.push(`<rect x="0" y="330" width="${W}" height="60" fill="url(#${linGrad(0, 336, 0, 388, [[0, P.cream, 0], [1, P.cream, 0.4]])})"/>`);
  const treeC = (tone, rimW, rim = P.tealLight) => ({ tone, lit: mix(tone, P.tealLight, 0.5), mid: mix(tone, P.tealLight, 0.2), deep: mix(tone, P.ink, 0.5), trunk: mix(P.plumDeep, P.ink, 0.45), rim, rimW });
  const gold = mix(mix(P.window, P.coral, 0.18), P.haze, 0.22), aspenOf = g => { const c = mix(gold, P.tealLight, g); return { bark: mix(P.cream, P.haze, 0.3), barkSh: mix(P.haze, P.plumDeep, 0.3), leaf: c, leafLit: mix(c, P.cream, 0.4), leafSh: mix(c, P.plum, 0.42) }; };
  const kindFrom = v => v < 0.34 ? 'fir' : v < 0.66 ? 'spruce' : v < 0.88 ? 'hemlock' : 'pine';
  // A tree standing on the grass is drawn about its own foot and cut off level there, so that boughs which droop
  // lower than the foot do not hang down over the ground in front of it. Its shadow is cut the same way.
  const above = L.clipRect(-1000, -1000, 2000, 1000.8), stand = (x, y, svg) => `<g transform="translate(${f(x)},${f(y)})" clip-path="url(#${above})">${svg}</g>`;
  const tree = (kind, x, y, h, C, seed, ref) => stand(x, y, kind === 'pine' ? pineTree(0, 0, h * 1.06, C, { seed, ref, sun: 1 }) : conifer(0, 0, h, C, { kind, seed, ref, sun: 1 }));
  // what stands on the meadow, to be painted from far to near, and the shadow of each thing: [how far down the page
  // it stands, its outline, where to lay it]
  const items = [], put = (y, svg) => items.push([y, svg]), shadows = [], shade = (x, y, shape) => shadows.push([y, shape, laid(x, y)]);
  // the front rank of the forest. These trees stand on the grass at its far edge, so they are painted with everything
  // else on the meadow, over the grass and over their own shadows.
  {
    const tr = L.source(611); let n = 0;
    for (let x = -6; x < W + 10; x += tr(15, 40)) {
      const gap = x > 566 && x < 700, h = (gap ? tr(26, 40) : tr(48, 86)) * (x > 430 && x < 566 ? 0.8 : 1), y = edge(x) + tr(0, 2.4), tone = mix(mix(P.tealDeep, P.teal, tr(0, 0.6)), P.haze, tr(0.2, 0.34)), kind = kindFrom(tr());
      if (gap && tr() < 0.4) continue;
      const ref = {}; put(y, tree(kind, x, y, h, treeC(tone, 1.5, mix(P.tealLight, P.peach, 0.3)), 400 + n++, ref)); shade(x, y, ref.shape);
    }
    // aspens at the forest's edge, gone gold
    for (const [x, h, sd, g] of [[236, 46, 11, 0.1], [252, 38, 12, 0], [272, 50, 13, 0.18], [786, 44, 14, 0], [806, 36, 15, 0.12], [1060, 48, 16, 0.05], [1078, 40, 17, 0.2]]) { const ref = {}, y = edge(x) + 2.6; put(y, stand(x, y, aspen(0, 0, h, aspenOf(g), { seed: sd, ref, sun: 1 }))); shade(x, y, ref.shape); }
  }
  // ================= the meadow floor =================
  const farLit = mix(mix(P.tealLight, P.cream, 0.58), P.window, 0.16), midG = mix(P.tealLight, P.cream, 0.3), nearG = mix(P.tealLight, P.teal, 0.2), shadeTone = mix(midG, P.teal, 0.72), shadeFar = mix(mix(midG, P.teal, 0.72), mix(mix(P.tealLight, P.cream, 0.58), P.window, 0.16), 0.12), goldG = mix(P.tealLight, P.window, 0.42);
  const floor = [[0, H + 40]]; for (let x = 0; x <= W; x += 24) floor.push([x, edge(x)]); floor.push([W, H + 40]);
  const fd = poly(floor), fc = clip(fd);
  o.push(`<path d="${fd}" fill="url(#${linGrad(0, 380, 0, H, [[0, farLit], [0.3, mix(farLit, midG, 0.7)], [0.62, midG], [1, nearG]])})"/>`);
  o.push(`<rect x="0" y="370" width="${W}" height="${H - 330}" fill="url(#${linGrad(360, 0, 1200, 0, [[0, P.peach, 0], [1, P.peach, 0.2]])})" clip-path="url(#${fc})"/>`);
  o.push(`<rect x="0" y="376" width="${W}" height="40" fill="url(#${linGrad(0, 378, 0, 412, [[0, P.cream, 0.5], [1, P.cream, 0]])})" clip-path="url(#${fc})"/>`);
  // ---- the stream: [x, y, half its width], from the trees toward us
  const SP = [[470, 382, 1], [500, 385, 1.5], [455, 389, 2.2], [410, 394, 3], [462, 401, 4.2], [520, 409, 6], [470, 420, 8], [392, 432, 11], [350, 448, 14], [396, 468, 18], [414, 492, 23], [352, 516, 30], [262, 540, 38], [204, 572, 48], [236, 610, 60], [250, 650, 74]].map(([x, y, w]) => [x, y, w * 0.74]), SD = dense(SP, 8);
  const nearStream = (x, y, pad = 0) => SD.some(q => Math.abs(y - q[1]) < q[2] * 0.5 + 3 + pad * 0.4 && Math.abs(x - q[0]) < q[2] * 1.15 + pad);
  // ---- the track, a straight line on the ground. Marks along it are the same distance apart on the ground, which
  // puts them closer together on the page the farther off they are.
  const TA = [60, 420], TB = [1150, 566], gnd = ([x, y]) => { const Z = 1 / (y - Y0); return [(x - 600) * Z, Z]; }, GA = gnd(TA), GB = gnd(TB);
  const trackAt = t => { const X = lerp(GA[0], GB[0], t), Z = lerp(GA[1], GB[1], t); return [600 + X / Z, Y0 + 1 / Z]; };
  const trackY = x => TA[1] + (x - TA[0]) * (TB[1] - TA[1]) / (TB[0] - TA[0]), halfT = y => 14 * Math.pow((y - Y0) / 194, 1.7) + 1;
  const inTrack = (x, y, k = 1) => Math.abs(y - trackY(x)) < halfT(y) * k + 1.5;
  // ---- the lie of the ground: low rises that catch the light on the side toward the sun, and two long dips
  {
    const hr = L.source(77); let rise = '';
    for (let k = 0; k < 13; k++) { const y = 400 + Math.pow(hr(), 0.9) * 150, x = hr(40, W - 40), u = unit(y), w = hr(130, 300) * (0.4 + u * 0.7), h = hr(7, 14) * (0.3 + u); if (nearStream(x, y, w * 0.3)) continue; rise += `<g transform="translate(${f(2 * x)},0) scale(-1,1)">${hummock(x, y, w, h, mix(farLit, P.window, 0.05), P.teal)}</g>`; }
    const dip = (fn, depth, a) => { let s = ''; const step = 60, base = linGrad(0, 0, 0, 1, [[0, P.teal, 0], [0.5, P.teal, f(a * 0.3)], [1, P.teal, a]]); for (let x = 0; x < W; x += step) { const y0 = fn(x), y1 = fn(x + step), g = L.nid('lg'); L.defs.push(`<linearGradient id="${g}" href="#${base}" x1="0" y1="${f((y0 + y1) / 2 - depth)}" x2="0" y2="${f((y0 + y1) / 2)}"/>`); s += `<path d="M${x},${f(y0)} L${x + step},${f(y1)} L${x + step},${f(y1 - depth - 4)} L${x},${f(y0 - depth - 4)}Z" fill="url(#${g})"/>`; } return `<g shape-rendering="crispEdges">${s}</g>`; };
    const lip1 = curveFn([[0, 438], [260, 444], [560, 434], [860, 440], [1200, 430]]), lip2 = curveFn([[0, 506], [300, 498], [640, 510], [940, 500], [1200, 508]]);
    const lipLine = fn => { let d = `M0,${f(fn(0))}`; for (let x = 40; x <= W; x += 40) d += ` L${x},${f(fn(x))}`; return d; };
    o.push(`<g clip-path="url(#${fc})">${dip(lip1, 22, 0.2)}${dip(lip2, 40, 0.22)}<path d="${lipLine(lip1)}" fill="none" stroke="${mix(farLit, P.cream, 0.3)}" stroke-width="1.6" stroke-opacity="0.7"/><path d="${lipLine(lip2)}" fill="none" stroke="${mix(farLit, P.cream, 0.2)}" stroke-width="2.2" stroke-opacity="0.7"/>${rise}</g>`);
  }
  // ---- grass seen from a distance: pale streaks where seed heads catch the sun, darker ones where it lies in shade
  {
    const gr = L.source(313); let a = '', b = '', c = '';
    for (let k = 0; k < 190; k++) { const y = 388 + Math.pow(gr(), 1.25) * 190, x = gr(-20, W), u = unit(y), w = gr(14, 60) * (0.25 + u * 1.1), th = gr(0.8, 1.8) * (0.4 + u); if (nearStream(x + w / 2, y, w * 0.5)) continue; const d = sliver(x, y, w, th, gr(-0.5, 0.5) * th); if (k % 3 === 0) b += d; else if (k % 3 === 1) a += d; else c += d; }
    o.push(`<path d="${a}" fill="${mix(farLit, P.cream, 0.45)}" fill-opacity="0.7"/><path d="${c}" fill="${goldG}" fill-opacity="0.5"/><path d="${b}" fill="${P.teal}" fill-opacity="0.22"/>`);
  }
  o.push(grain(0, 430, W, H - 390, GL(0, 450, 0, H + 30, [[0, 0], [1, 0.3]]), P.teal, { clipId: fc }));
  let waterClip = '';
  // ---- the stream itself. Its far bank shows as a strip of dark earth above the water wherever the stream runs across
  // our view; its near bank hides the water's edge. The water takes the colour of the sky far off and darkens toward us.
  {
    const up = [], dn = [], upW = [], lipA = [];
    SD.forEach((q, i) => { const a = SD[Math.max(0, i - 1)], b = SD[Math.min(SD.length - 1, i + 1)], dx = b[0] - a[0], dy = (b[1] - a[1]) / 0.38, l = Math.hypot(dx, dy) || 1; let nx = -dy / l, ny = dx / l; if (ny > 0) { nx = -nx; ny = -ny; }       // n points to the far side
      const w = q[2], A = [q[0] + nx * w, q[1] + ny * w * 0.38], B = [q[0] - nx * w, q[1] - ny * w * 0.38], face = w * 0.17 * Math.abs(ny);
      up.push(A); dn.push(B); upW.push([A[0], A[1] + face]); lipA.push(B); });
    const bed = poly([...up, ...dn.slice().reverse()]), water = poly([...upW, ...dn.slice().reverse()]), wc = clip(water), sr = L.source(907); waterClip = wc;
    let glint = '', ripple = '';
    for (let k = 0; k < 64; k++) { const q = SD[Math.floor(sr(0.12, 1) * (SD.length - 1))], w = q[2], len = w * sr(0.5, 1.5), th = Math.max(0.9, w * sr(0.04, 0.09)); const d = sliver(q[0] + sr(-1, 0.6) * w - len / 2, q[1] + sr(-0.3, 0.3) * w * 0.4, len, th, sr(-0.4, 0.4) * th); if (k % 3) glint += d; else ripple += d; }
    const wg = `url(#${linGrad(0, 384, 0, 640, [[0, mix(P.skyHorizon, '#FFFFFF', 0.45)], [0.25, mix(P.tealLight, '#FFFFFF', 0.72)], [0.55, mix(P.tealLight, '#FFFFFF', 0.5)], [0.8, mix(P.tealLight, P.cream, 0.22)], [1, P.teal]])})`;
    o.push(`<path d="${bed}" fill="${mix(P.plum, P.teal, 0.5)}"/><path d="${water}" fill="${wg}"/>`
      + `<g clip-path="url(#${wc})"><path d="M${dn.map(q => `${f(q[0])},${f(q[1] - 1)}`).join(' L')}" fill="none" stroke="${P.teal}" stroke-opacity="0.34" stroke-width="5" stroke-linejoin="round"/>`
      + `<path d="${ripple}" fill="${P.teal}" fill-opacity="0.34"/><path d="${glint}" fill="${P.sun}" fill-opacity="0.95"/></g>`
      + `<path d="M${lipA.slice(10).map(q => `${f(q[0])},${f(q[1])}`).join(' L')}" fill="none" stroke="${mix(farLit, P.cream, 0.3)}" stroke-width="1.4" stroke-linejoin="round" stroke-opacity="0.8"/>`);
  }
  // ================= what stands on the meadow =================
  const grassDark = [P.teal, mix(P.teal, P.tealDeep, 0.5), mix(P.teal, P.tealLight, 0.5)], grassLit = [mix(P.tealLight, P.cream, 0.5), goldG], straw = mix(P.peach, P.cream, 0.5);
  const FC = { stem: P.teal, cream: '#FFF8EA', gold: '#F2B441', goldSh: '#C98E2B', coral: P.coral, coralSh: P.coralSh, ink: P.plumDeep, violet: '#9C7DB8', lilac: '#D3B4D6', leaf: mix(P.tealLight, P.cream, 0.34), leafDark: P.teal, clover: '#F6DDE0' };
  // ---- islands of young fir out in the grass, far enough off to fit in the picture
  for (const [x, y, h, kind, sd] of [[70, 405, 112, 'spruce', 1], [108, 409, 84, 'fir', 2], [38, 411, 70, 'fir', 3], [136, 402, 54, 'hemlock', 4], [1150, 403, 116, 'fir', 5], [1114, 399, 82, 'spruce', 6], [1184, 407, 94, 'hemlock', 7], [1090, 404, 44, 'fir', 8]]) {
    const ref = {}; put(y, tree(kind, x, y, h, treeC(mix(P.tealDeep, P.teal, sd % 3 * 0.25), 2), 500 + sd, ref)); shade(x, y, ref.shape);
  }
  // ---- willow thickets along the far side of the meadow and by the head of the stream
  { const wt = mix(mix(P.teal, P.tealLight, 0.42), P.haze, 0.16), WC = { tone: wt, lit: mix(wt, mix(P.tealLight, P.window, 0.45), 0.62) };
    for (const [x, y, w, h, sd] of [[300, 392, 46, 16, 1], [1024, 396, 42, 15, 2], [392, 388, 34, 12, 3], [722, 387, 30, 11, 4], [556, 387, 26, 10, 5], [884, 390, 24, 10, 6]]) { const t = thicket(w, h, WC, { seed: sd }); put(y, stand(x, y, t.svg)); shade(x, y, t.shape); } }
  // ---- boulders: a lit face toward the sun, a shaded one away from it, lichen, grass grown up round the foot
  const rockSh = mix(P.plum, P.haze, 0.25), rockLit = mix(P.haze, P.peach, 0.55), rockTop = mix(P.haze, P.plum, 0.2);
  const stone = (x, y, w, h, sd) => { const sr = L.source(sd * 71), q = (a, b) => [x + w * a, y - h * b];
    let s = `<path d="${poly([q(-0.5, 0), q(-0.47, 0.42), q(-0.27, 0.86), q(0.05, 1), q(0.34, 0.8), q(0.5, 0.36), q(0.53, 0)])}" fill="${rockSh}"/><path d="${poly([q(-0.27, 0.86), q(0.05, 1), q(0.34, 0.8), q(0.1, 0.6), q(-0.16, 0.64)])}" fill="${rockTop}"/><path d="${poly([q(0.1, 0.6), q(0.34, 0.8), q(0.5, 0.36), q(0.53, 0), q(0.18, 0), q(0.2, 0.3)])}" fill="${rockLit}"/>`;
    for (let k = 0; k < 4; k++) s += `<circle cx="${f(x + w * sr(-0.36, 0.1))}" cy="${f(y - h * sr(0.2, 0.7))}" r="${f(Math.max(0.8, w * sr(0.018, 0.04)))}" fill="${mix(P.haze, P.cream, 0.5)}" fill-opacity="0.7"/>`;
    for (const a of [-0.46, -0.2, 0.1, 0.4]) s += tuft(x + w * a, y + 1, h * sr(0.3, 0.55), pick(grassDark), pick(grassLit));
    shade(x, y, `<path d="${poly([[-w * 0.5, 0.6], [-w * 0.47, -h * 0.42], [-w * 0.27, -h * 0.86], [w * 0.05, -h], [w * 0.34, -h * 0.8], [w * 0.5, -h * 0.36], [w * 0.53, 0.6]])}"/>`);
    return s; };
  for (const [x, y, w, h, sd] of [[160, 498, 62, 24, 1], [646, 548, 50, 18, 2], [1168, 492, 44, 16, 3], [868, 478, 26, 9, 4], [448, 462, 22, 8, 5]]) put(y, stone(x, y, w, h, sd));
  // ---- the herd. Each animal: where it stands, how big it is for its kind, what it is doing through stage 2 and
  // how it stands at stage 3. facing: -1 looks left, 1 looks right.
  const EC = elkColours(P);
  const herd = [
    { x: 790, y: 541, k: 1, kind: 'bull', a: { pose: 'alert', face: 1, stride: [0, -9, 2, -8] }, b: { stride: [0, -8, 0, -9], lift: 3 } },
    { x: 534, y: 531, k: 0.9, kind: 'cow', a: { pose: 'graze', face: -1, stride: [4, -9, -5, 7] }, b: { stride: [0, -7, 3, -8] } },
    { x: 968, y: 508, k: 0.88, kind: 'cow', a: { pose: 'graze', face: 1, stride: [-3, 8, 6, -6] }, b: { stride: [2, -8, 0, -10], tip: 3 } },
    { x: 1136, y: 532, k: 0.56, kind: 'calf', a: { pose: 'level', face: -1, stride: [0, -7, 3, -6] }, b: { stride: [0, -7, 0, -7], tip: -4 } },
    { x: 642, y: 462, k: 0.9, kind: 'cow', a: { pose: 'bed', face: 1 }, b: { stride: [0, -9, 2, -7] } },
    { x: 316, y: 441, k: 0.9, kind: 'cow', a: { pose: 'graze', face: 1, stride: [-4, 6, 2, -8] }, b: { stride: [0, -9, 4, -6] } },
    { x: 1150, y: 446, k: 0.9, kind: 'cow', a: { pose: 'level', face: -1, stride: [5, -8, -4, 8] }, b: { tip: 2 } },
    { x: 164, y: 409, k: 0.9, kind: 'cow', a: { pose: 'graze', face: 1 }, b: {} },
    { x: 226, y: 414, k: 0.95, kind: 'spike', a: { pose: 'level', face: -1 }, b: {} },
    { x: 278, y: 407, k: 0.88, kind: 'cow', a: { pose: 'graze', face: -1 }, b: {} },
  ];
  const shadeA = [], shadeB = [], far = y => y < 425 ? ` fill="${shadeFar}"` : '';      // shadows far off are paler, with the haze of the distance on them
  herd.forEach((e, i) => {
    const s = 0.0072 * (e.y - Y0) * e.k, detail = s > 0.34;
    const one = (st, list) => { const face = st.face ?? -1, lx = face < 0 ? 1 : -1, d = elk(EC, { kind: e.kind, pose: st.pose || 'alert', lx, seed: i + 1, stride: st.stride, tip: st.tip || 0, lift: st.lift || 0, detail }), tf = `translate(${e.x},${e.y})`, r3 = n => Math.round(n * 1000) / 1000, sc = `scale(${r3(face < 0 ? s : -s)},${r3(s)})`; list.push(`<use href="#${d.id}" transform="${laid(e.x, e.y)} ${sc}"${far(e.y)}/>`); return `<g transform="${tf} ${sc}">${d.svg}</g>`; };
    let g = until(2, one(e.a, shadeA)) + between(3, 3, one({ ...e.b, pose: 'alert', face: -1 }, shadeB));
    // grass grown up round the hooves
    if (detail) for (const dx of [-42, -30, 40, 50]) g += until(3, tuft(e.x + dx * s + rnd(-3, 3), e.y + 1.5, s * rnd(12, 20), pick(grassDark), pick(grassLit)));
    put(e.y, g);
  });
  // ---- grass and flowers. Far off they are flecks, laid straight on the ground; nearer they are plants, each put
  // in the list at its own distance. Anything rooted where the track will run is gone when the track is there.
  {
    let ticks = '', ticksT = ''; const dots = {}, dotsT = {};
    for (let k = 0; k < 150; k++) { const y = 388 + rnd() * 78, x = rnd(0, W), h = 3 + unit(y) * 9; if (nearStream(x, y, 2)) continue; const d = `M${f(x - h * 0.3)},${f(y)}l${f(h * 0.12)},${f(-h)}l${f(h * 0.2)},${f(h)}l${f(h * 0.24)},${f(-h * 0.8)}l${f(h * 0.16)},${f(h * 0.8)}Z`; if (inTrack(x, y)) ticksT += d; else ticks += d; }
    // flowers come in drifts: [x, y, spread, kind, how many]
    const drifts = [[250, 428, 150, 'lupine', 26], [700, 410, 190, 'daisy', 30], [960, 440, 150, 'poppy', 22], [560, 436, 120, 'buttercup', 24], [1090, 470, 110, 'lupine', 13], [820, 500, 150, 'daisy', 13], [640, 506, 120, 'lupine', 10], [140, 470, 110, 'buttercup', 11], [420, 548, 130, 'poppy', 9], [920, 548, 160, 'buttercup', 9], [1120, 545, 90, 'daisy', 7], [300, 505, 60, 'umbel', 4], [690, 470, 200, 'umbel', 5]];
    const tint = { lupine: FC.violet, daisy: FC.cream, poppy: FC.coral, buttercup: FC.gold, umbel: FC.cream };
    for (const [cx, cy, sp, kind, n] of drifts) for (let j = 0; j < n; j++) {
      const y = cy + rnd(-1, 1) * sp * 0.2 * (0.5 + unit(cy)), x = cx + rnd(-1, 1) * sp; if (y < 390 || y > 556 || nearStream(x, y, 3)) continue;
      const tall = kind === 'lupine' || kind === 'umbel', size = unit(y) * (tall ? rnd(20, 30) : rnd(12, 19)), T = inTrack(x, y);
      if (size < 9) { const c = tint[kind], r = Math.max(0.9, size * 0.14), d = tall ? `M${f(x - r)},${f(y - size)}a${f(r)},${f(r * 1.7)} 0 1 0 ${f(r * 2)},0a${f(r)},${f(r * 1.7)} 0 1 0 ${f(-r * 2)},0Z` : `M${f(x - r)},${f(y - size * 0.8)}a${f(r)},${f(r * 0.8)} 0 1 0 ${f(r * 2)},0a${f(r)},${f(r * 0.8)} 0 1 0 ${f(-r * 2)},0Z`; (T ? dotsT : dots)[c] = ((T ? dotsT : dots)[c] || '') + d; }
      else { const fl = flower(kind, x, y, size, FC); put(y, T ? until(3, fl) : fl); }
    }
    const paint = set => Object.entries(set).map(([c, d]) => `<path d="${d}" fill="${c}"/>`).join('');
    o.push(`<path d="${ticks}" fill="${P.teal}" fill-opacity="0.5"/>` + paint(dots) + until(3, `<path d="${ticksT}" fill="${P.teal}" fill-opacity="0.5"/>` + paint(dotsT)));
    for (let k = 0; k < 96; k++) { const y = 452 + Math.pow(rnd(), 0.85) * 104, x = rnd(0, W); if (nearStream(x, y, 4)) continue; const t = tuft(x, y, unit(y) * rnd(13, 25), pick(grassDark), pick(grassLit), straw); put(y, inTrack(x, y) ? until(3, t) : t); }
    for (let k = 0; k < 10; k++) { const y = 470 + rnd() * 80, x = rnd(0, W); if (!nearStream(x, y, 4) && !inTrack(x, y)) put(y, rosette(x, y, unit(y) * rnd(9, 14), FC.leaf, P.teal)); }
    // sedge along the banks of the stream
    for (let i = 26; i < SD.length - 6; i += 3) { const q = SD[i], side = i % 2 ? 1 : -1, x = q[0] + side * q[2] * rnd(1.02, 1.2), y = q[1] + rnd(-0.1, 0.3) * q[2] * 0.4; if (y < 556) { const t = tuft(x, y + 1, unit(y) * rnd(14, 24), pick(grassDark), pick(grassLit), straw); put(y + 2, inTrack(x, y, 2.6) ? until(3, t) : t); } }
  }
  // ---- shadows, in one tone so that where two cross they do not darken twice
  shadows.sort((a, b) => a[0] - b[0]);
  o.push(`<g fill="${shadeTone}" clip-path="url(#${fc})">${shadows.map(([y, shape, tf]) => `<g transform="${tf}" clip-path="url(#${above})"${far(y)}>${shape}</g>`).join('')}${until(2, shadeA.join(''))}${between(3, 3, shadeB.join(''))}</g>`);
  // ---- stage 4: the track. Something has gone through the meadow in a dead straight line. It left holes at even
  // spacing; out of each hole a furrow is torn through the turf where it dragged free, deep at the hole and running
  // out toward the next one; and along the whole line the grass is pressed flat and combed over in the direction it
  // went. Where the line meets the stream both banks are broken down into the water and the stream runs brown below.
  {
    L.skip(32);                                         // what the old track took from the shared sequence, so the foreground drawn after it stays as it was
    const tr = L.source(1213), m = (TB[1] - TA[1]) / (TB[0] - TA[0]), X0 = TA[0], X1 = TB[0] + 70;
    const at = (x, v) => { const y = trackY(x); return [x, y + v * halfT(y)]; };          // a point on the swath: v is -1 at its far edge, 1 at its near edge
    const lens = (x, v, len, th) => { const a = at(x, v), bx = a[0] + len, by = a[1] + len * m; return `M${f(a[0])},${f(a[1])}Q${f((a[0] + bx) / 2)},${f((a[1] + by) / 2 - th)} ${f(bx)},${f(by)}Q${f((a[0] + bx) / 2)},${f((a[1] + by) / 2 + th)} ${f(a[0])},${f(a[1])}Z`; };
    const p1 = tr(0, 6.28), p2 = tr(0, 6.28), p3 = tr(0, 6.28), wob = (x, p) => 1 + 0.16 * Math.sin(x * 0.019 + p) + 0.09 * Math.sin(x * 0.053 + p * 2);
    const flat = mix(mix(farLit, P.cream, 0.5), P.window, 0.14), comb = mix(midG, P.teal, 0.42), mud = mix(P.plum, P.peach, 0.42), earth = mix(mud, P.plumDeep, 0.42), clodLit = mix(P.plum, P.peach, 0.62);
    // the pressed swath, with a line of shade along its far side where the standing grass begins again
    const up = [], dn = [], upIn = [];
    for (let x = X0; x <= X1; x += 12) { up.push(at(x, -wob(x, p1))); upIn.unshift(at(x, -0.58)); dn.unshift(at(x, wob(x, p2))); }
    const swath = poly([...up, ...dn]), sc = clip(swath);
    // the grass lying in it, combed along the line: long dark and pale strokes
    let dark = '', pale = '';
    for (let k = 0; k < 170; k++) { const x = lerp(X0, X1, Math.pow(tr(), 0.75)), h = halfT(trackY(x)), d = lens(x, tr(-0.85, 0.85), h * tr(2.5, 8), Math.max(0.45, h * tr(0.045, 0.1))); if (k % 3) dark += d; else pale += d; }
    // flowers torn out and left lying along it
    let lying = '';
    for (let k = 0; k < 16; k++) { const x = lerp(X0 + 120, X1 - 40, tr()), h = halfT(trackY(x)), a = at(x, tr(-0.6, 0.7)), len = h * tr(1.5, 2.6), bx = a[0] + len, by = a[1] + len * m + tr(-0.2, 0.2) * h, c = [FC.violet, FC.cream, FC.coral, FC.gold, FC.lilac][Math.floor(tr(0, 4.999))];
      lying += `<path d="M${f(a[0])},${f(a[1])}L${f(bx)},${f(by)}" stroke="${P.teal}" stroke-width="${f(Math.max(0.6, h * 0.07))}" stroke-linecap="round"/><ellipse cx="${f(bx)}" cy="${f(by)}" rx="${f(Math.max(1, h * 0.24))}" ry="${f(Math.max(0.7, h * 0.14))}" fill="${c}"/><ellipse cx="${f(bx - h * 0.3)}" cy="${f(by - h * 0.05)}" rx="${f(Math.max(0.8, h * 0.16))}" ry="${f(Math.max(0.6, h * 0.1))}" fill="${c}"/>`; }
    // the holes, and the furrow out of each
    const HC = { rim: mix(farLit, P.cream, 0.25), rimSh: mix(midG, P.teal, 0.45), wall: mud, deep: mix(P.plumDeep, P.teal, 0.25), floor: P.ink, cast: shadeTone, clod: clodLit };
    const H = []; for (let k = 0; k <= 7; k++) { const [x, y] = trackAt(k / 7); H.push([x, y, (y - Y0) / 104]); }
    let marks = '', torn = '', tornLit = '', tornLip = '', clods = '';
    H.forEach(([x, y, sc2], k) => {
      marks += hole(x, y, sc2, HC);
      const x0 = x + 13 * sc2, gapTo = k < 7 ? H[k + 1][0] - 30 * H[k + 1][2] : X1, x1 = lerp(x0, gapTo, tr(0.5, 0.66)), n = 14, top = [], bot = [], midl = [], lipT = [], lipB = [];
      for (let i = 0; i <= n; i++) {
        const u = i / n, xx = lerp(x0, x1, u), vc = 0.12 * Math.sin(xx * 0.021 + p3) + 0.05, g = 0.46 * Math.pow(1 - u, 0.8) * (i === 0 || i === n ? 1 : tr(0.62, 1.2)), lip = 0.13 * Math.pow(1 - u, 0.5) + 0.03;
        top.push(at(xx, vc - g)); midl.push(at(xx, vc - g * 0.15)); bot.push(at(xx, vc + g * tr(0.85, 1.1))); lipT.push(at(xx, vc - g - lip)); lipB.push(at(xx, vc + g * 1.1 + lip * 1.6));
      }
      torn += poly([...top, ...bot.slice().reverse()]) + ' '; tornLit += poly([...top, ...midl.slice().reverse()]) + ' '; tornLip += poly([...lipT, ...lipB.slice().reverse()]) + ' ';
      // sods thrown out to either side
      for (let j = 0, c = 5 + Math.floor(tr(0, 4)); j < c; j++) { const u = Math.pow(tr(), 1.4) * 0.9, xx = lerp(x0, x1, u), h = halfT(trackY(xx)), side = tr() < 0.5 ? -1 : 1, q = at(xx, side * tr(0.7, 1.25)), r = Math.max(0.9, h * tr(0.09, 0.17)); clods += `<ellipse cx="${f(q[0] - r * 0.9)}" cy="${f(q[1] + r * 0.6)}" rx="${f(r * 1.3)}" ry="${f(r * 0.55)}" fill="${shadeTone}"/><circle cx="${f(q[0])}" cy="${f(q[1])}" r="${f(r)}" fill="${earth}"/><circle cx="${f(q[0] + r * 0.25)}" cy="${f(q[1] - r * 0.3)}" r="${f(r * 0.58)}" fill="${clodLit}"/>`; }
    });
    // grass along both sides of it, laid over the way it went: blades with their tips carried far downwind of their roots
    let bentA = '', bentB = '';
    for (let x = X0 + 170; x < X1; x += tr(22, 54)) { const y = trackY(x), h = halfT(y); if (h < 3.6 || nearStream(x, y, 8)) continue; const side = tr() < 0.6 ? 1 : -1, r0 = at(x, side * wob(x, side > 0 ? p2 : p1) * 1.02);
      for (let j = 0, c = 3 + Math.floor(tr(0, 2.99)); j < c; j++) { const len = h * tr(1.2, 2.1), rise = len * tr(0.1, 0.2), bx = r0[0] + tr(-0.4, 0.4) * h, by = r0[1] + tr(-0.1, 0.1) * h, bw = Math.max(0.8, h * 0.13), d = `M${f(bx - bw)},${f(by)}Q${f(bx + len * 0.35)},${f(by - rise * 1.6)} ${f(bx + len)},${f(by - rise * 0.2 + len * m)}Q${f(bx + len * 0.45)},${f(by - rise * 0.5)} ${f(bx + bw)},${f(by + bw * 0.4)}Z`; if (j % 3 === 0) bentB += d; else bentA += d; } }
    // ---- the crossing. The line goes straight through the stream. Both banks are broken down into bare earth for the
    // width of the swath; between them the water is thick with mud; and below the crossing a plume of it is carried
    // down the middle of the stream, thinning as it goes, with clear water still running along either side.
    let ci = 0; SD.forEach((q, i) => { if (Math.abs(q[1] - trackY(q[0])) < Math.abs(SD[ci][1] - trackY(SD[ci][0]))) ci = i; });
    const cq = SD[ci], ch = halfT(cq[1]), wet = x => { const y = trackY(x); return SD.some(q => Math.abs(y - q[1]) < 3 && Math.abs(x - q[0]) < q[2]); };
    let xl = cq[0], xr = cq[0]; while (wet(xl - 1) && xl > cq[0] - 80) xl--; while (wet(xr + 1) && xr < cq[0] + 80) xr++;
    const wide = xr - xl, ym = trackY((xl + xr) / 2), muddy = mix(mud, mix(P.tealLight, '#FFFFFF', 0.6), 0.3);
    // The banks have been trodden in, so at the crossing the stream has spread into a wallow wider than itself: churned
    // wet earth round the outside, muddy water standing in the middle. The shape lies along the line of the track.
    const wallow = k => { const pts = [], n = 18, wr2 = L.source(77); for (let i = 0; i < n; i++) { const an = i / n * 6.283, q = wr2(0.8, 1.2), cx = Math.cos(an) * wide * 0.66 * k * q, cy = Math.sin(an) * ch * 2.1 * k * q; pts.push([(xl + xr) / 2 + cx, ym + cx * m + cy + ch * 0.2]); } return smooth(pts, true, 0.7); };
    const endI = Math.min(SD.length - 1, ci + 44), pl = [], prr = [];
    for (let i = ci; i <= endI; i += 2) { const q = SD[i], u = (i - ci) / (endI - ci), k = lerp(0.6, 0.16, u); pl.push([q[0] - q[2] * k + q[2] * 0.14 * Math.sin(i * 0.7), q[1]]); prr.unshift([q[0] + q[2] * k + q[2] * 0.14 * Math.sin(i * 0.5 + 2), q[1]]); }
    const plumeG = linGrad(0, cq[1], 0, SD[endI][1], [[0, mud, 0.58], [0.4, mud, 0.3], [1, mud, 0]]);
    let swirl = ''; for (let i = ci + 2; i < endI; i += 5) { const q = SD[i], len = q[2] * tr(0.5, 0.9); swirl += sliver(q[0] - len / 2 + tr(-0.2, 0.2) * q[2], q[1], len, Math.max(0.9, q[2] * 0.07), tr(-1, 1)); }
    let lap = ''; for (const v of [-0.6, 0.3, 1.1]) { const len = wide * tr(0.36, 0.6); lap += sliver((xl + xr) / 2 - len / 2 + tr(-0.1, 0.1) * wide, ym + ch * v, len, Math.max(0.8, ch * 0.2), 0); }
    const crossing = `<path d="${wallow(1.2)}" fill="${mud}"/><g clip-path="url(#${clip(wallow(1.2))})"><path d="${wallow(0.84)}" fill="${earth}" transform="translate(0,${f(-ch * 0.55)})"/></g><g clip-path="url(#${waterClip})"><path d="${wallow(1.3)}" fill="${muddy}"/></g><path d="${wallow(0.84)}" fill="${muddy}"/><path d="${lap}" fill="${mix(P.cream, mud, 0.25)}" fill-opacity="0.85"/>`
      + `<g clip-path="url(#${waterClip})"><path d="${poly([...pl, ...prr])}" fill="url(#${plumeG})"/><path d="${swirl}" fill="${mix(P.cream, mud, 0.35)}" fill-opacity="0.5"/></g>`
      + [[xl - wide * 0.3, ym + ch * 2.6, 1], [xr + wide * 0.34, ym - ch * 2.2, 0.8], [xl - wide * 0.4, ym - ch * 1.9, 0.7], [xr + wide * 0.2, ym + ch * 3, 0.9], [xl + wide * 0.2, ym - ch * 3.1, 0.6]].map(([x, y, k]) => { const r = Math.max(1, ch * 0.3 * k); return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${earth}"/><circle cx="${f(x + r * 0.25)}" cy="${f(y - r * 0.3)}" r="${f(r * 0.58)}" fill="${clodLit}"/>`; }).join('');
    o.push(from(4, `<path d="${swath}" fill="${flat}" fill-opacity="0.82"/><g clip-path="url(#${sc})"><path d="${poly([...up, ...upIn])}" fill="${P.teal}" fill-opacity="0.3"/><path d="${dark}" fill="${comb}" fill-opacity="0.6"/><path d="${pale}" fill="${mix(P.cream, farLit, 0.25)}" fill-opacity="0.9"/>${lying}</g>`
      + `<path d="${tornLip}" fill="${HC.rim}"/><path d="${torn}" fill="${earth}"/><path d="${tornLit}" fill="${mud}"/>${clods}`
      + crossing + marks
      + `<path d="${bentA}" fill="${P.teal}"/><path d="${bentB}" fill="${mix(P.tealLight, P.cream, 0.45)}"/>`));
  }
  items.sort((a, b) => a[0] - b[0]);
  o.push(items.map(i => i[1]).join(''));
  // ================= the rise we are standing on =================
  const fy = x => 594 - 12 * Math.sin((x + 120) / 210) - (x < 200 ? (200 - x) * 0.1 : 0);
  const fpts = [[0, H + 40]]; for (let x = 0; x <= W; x += 12) fpts.push([x, fy(x)]); fpts.push([W, H + 40]);
  const bank = poly(fpts);
  o.push(`<path d="${bank}" fill="${P.tealLight}"/><path d="${bank}" fill="${P.tealDeep}" transform="translate(0,4)"/>`);
  o.push(grain(0, 570, W, 110, GL(0, 580, 0, H + 30, [[0, 0.4], [0.5, 0.12], [1, 0]]), P.teal, { clipId: clip(bank) }));
  { const big = d => { const tone = mix(P.ink, P.tealDeep, d); return { tone, lit: mix(tone, P.tealLight, 0.48), mid: mix(tone, P.tealLight, 0.18), deep: mix(tone, '#04141A', 0.55), trunk: mix(P.plumDeep, P.ink, 0.5), rim: P.rim, rimW: 2.6 }; };
    o.push(conifer(12, 668, 610, big(0.3), { kind: 'hemlock', seed: 61, grainy: true, lean: 0 })); }
  o.push(L.grass(110, 1140, fy, { dark: P.ink, light: P.tealLight, h: [16, 50], step: [8, 22] }));
  for (let k = 0; k < 36; k++) { const x = rnd(120, 1130), y = fy(x) + rnd(0, 10), kind = pick(['lupine', 'lupine', 'daisy', 'poppy', 'buttercup', 'umbel']); o.push(flower(kind, x, y, kind === 'lupine' || kind === 'umbel' ? rnd(40, 62) : rnd(26, 44), { ...FC, stem: P.tealLight })); }
  o.push(`<rect x="0" y="-50" width="${W}" height="${H + 100}" fill="url(#${radGrad(W / 2, H * 0.46, 800, [[0.6, '#2A1B33', 0], [1, '#2A1B33', 0.32]])})"/>`);
  return { svg: `<defs>${L.defs.join('\n')}</defs>${o.join('\n')}`, vb: [0, 0, W, H], vbm: [404, 52, 776, 571.2] };
}
