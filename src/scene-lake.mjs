// The lake vista. Drawn once as three parallax layers for the hero (golden hour) and once,
// flattened and cropped, for the lodging section (dusk). Same seed, so it is the same place.
import * as L from './lib.mjs';
import { ribs, snowcaps } from './peaks.mjs';
import { conifer, pineTree, aspen } from './conifers.mjs';
const { f, rnd, pick, lerp, mix, poly, curveFn, grain, GL, GR, from, until, between, linGrad, radGrad, clip, nid } = L;

const W = 1600, H = 900, LOW = 990; // LOW: layers overdraw below the frame so parallax never shows an edge

// A mark on the water: a sliver that swells in the middle, comes to a point at each end and rides a slight wave,
// the way a ripple catches light along its crest. Nothing on the lake is a straight bar.
const sliver = L.sliver;

// The reflection of something standing in the trees. Only ever drawn in the water.
function thing(x, len, wb, op, lean){
  const P = L.P, WATER = L.WATER, y0 = WATER + 2;
  const pts = [[x - wb * 0.5, y0], [x - wb * 0.62, y0 + len * 0.3], [x - wb * 0.95, y0 + len * 0.56], [x - wb * 1.5, y0 + len * 0.7], [x - wb * 1.25, y0 + len * 0.8], [x - wb * 0.5, y0 + len * 0.9], [x + lean, y0 + len], [x + wb * 0.6, y0 + len * 0.88], [x + wb * 1.35, y0 + len * 0.79], [x + wb * 1.45, y0 + len * 0.69], [x + wb * 0.9, y0 + len * 0.55], [x + wb * 0.6, y0 + len * 0.3], [x + wb * 0.5, y0]];
  const g = linGrad(0, y0, 0, y0 + len, [[0, mix(P.ink, P.plumDeep, 0.5), op], [1, mix(P.ink, P.plumDeep, 0.5), op * 0.62]]);
  const arm = (s) => `M${f(x + s * wb * 1.4)},${f(y0 + len * 0.7)} C${f(x + s * wb * 2.5)},${f(y0 + len * 0.56)} ${f(x + s * wb * 2.3)},${f(y0 + len * 0.3)} ${f(x + s * wb * 2.05)},${f(y0 + len * 0.1)}`;
  let slit = '';
  for (let yy = y0 + 9; yy < y0 + len; yy += rnd(9, 24)) { const w = wb * rnd(3.4, 6.5); const sx = x - w / 2 + rnd(-wb, wb), th = rnd(2, 4.6); slit += `<path d="${sliver(sx, yy, w, th * 1.2, th * 0.3)}"/>`; }
  return `<path d="${poly(pts)}" fill="url(#${g})"/><path d="${arm(-1)}" stroke="${mix(P.ink, P.plumDeep, 0.5)}" stroke-width="${f(wb * 0.17)}" fill="none" stroke-linecap="round" stroke-dasharray="${f(len * 0.07)} ${f(len * 0.03)} ${f(len * 0.12)} ${f(len * 0.05)}" opacity="${f(op * 0.7)}"/><path d="M${f(x + wb * 1.4)},${f(y0 + len * 0.7)} C${f(x + wb * 2.3)},${f(y0 + len * 0.6)} ${f(x + wb * 2.2)},${f(y0 + len * 0.5)} ${f(x + wb * 2.0)},${f(y0 + len * 0.4)}" stroke="${mix(P.ink, P.plumDeep, 0.5)}" stroke-width="${f(wb * 0.17)}" fill="none" stroke-linecap="round" opacity="${f(op * 0.6)}"/><g fill="${P.lake[2]}" opacity="0.9">${slit}</g>`;
}

// The lodge's dock, seen side-on from across the lake: a plank deck on two rows of pilings, running out from the bank
// below the lodge. Mooring posts stand up through the deck, there is a ladder at the lake end and a handrail with a
// life ring along the landward stretch. Through stage 3 a rowboat is tied up at the end; from stage 4 the boat is
// gone and its line hangs straight down into the water.
function dock(P){
  const WATER = L.WATER, dark = P.plumDeep, far = mix(P.plumDeep, P.haze, 0.42), wood = mix(P.plum, P.haze, 0.55), x0 = 800, x1 = 914, top = 556.6, o = [];
  const piles = [803, 819.5, 836, 852.5, 869, 885.5, 902], posts = [803, 852.5];
  // the far row of pilings, paler, and the braces between the near ones
  o.push(`<g fill="${far}">${piles.map(x => `<rect x="${f(x + 4.6)}" y="${top + 2}" width="2.2" height="${f(WATER + 1.2 - top - 2)}"/>`).join('')}</g>`);
  o.push(`<path d="${piles.slice(0, -1).map((x, i) => `M${f(x + 1.3)},${f(i % 2 ? WATER - 0.4 : top + 3.2)} L${f(piles[i + 1] + 1.3)},${f(i % 2 ? top + 3.2 : WATER - 0.4)}`).join(' ')}" stroke="${dark}" stroke-width="0.8" fill="none"/>`);
  // the near pilings, standing in the water, each with the glint of the water round its foot
  o.push(`<g fill="${dark}">${piles.map(x => `<rect x="${f(x)}" y="${top + 2}" width="2.8" height="${f(WATER + 3.4 - top - 2)}"/>`).join('')}${posts.map(x => `<rect x="${f(x - 0.1)}" y="${f(top - 7.2)}" width="3" height="8"/>`).join('')}</g>`);
  o.push(`<g fill="${wood}">${posts.map(x => `<rect x="${f(x - 0.5)}" y="${f(top - 8.2)}" width="3.8" height="1.3" rx="0.5"/>`).join('')}</g>`);
  o.push(`<path d="${piles.map(x => `M${f(x - 1.6)},${f(WATER + 3.5)} h6`).join(' ')}" stroke="${P.cream}" stroke-width="0.8" stroke-linecap="round" opacity="0.6" fill="none"/>`);
  // the deck: a dark edge with the ends of the planks showing, and its top catching the light
  let ticks = ''; for (let x = x0 + 2.4; x < x1 - 1; x += 3.7) ticks += `M${f(x)},${f(top + 0.5)} v2 `;
  o.push(`<rect x="${x0 - 1.2}" y="${top}" width="${x1 - x0 + 1.2}" height="2.9" fill="${dark}"/><path d="${ticks}" stroke="${wood}" stroke-width="0.45" opacity="0.55" fill="none"/><rect x="${x0 - 1.2}" y="${f(top - 1)}" width="${x1 - x0 + 1.2}" height="1.2" fill="${wood}"/><path d="M${x0 - 1.2},${f(top - 1)} H${x1}" stroke="${P.cream}" stroke-width="0.7" opacity="0.85"/>`);
  // the handrail along the landward stretch, with a life ring hung on its end post
  { const ra = 866, rb = x1 - 0.6; let up = ''; for (let x = ra; x <= rb + 0.1; x += (rb - ra) / 4) up += `M${f(x)},${f(top - 1)} V${f(top - 9.6)} `;
    o.push(`<path d="${up}" stroke="${dark}" stroke-width="1.3" fill="none"/><path d="M${ra - 0.6},${f(top - 9.6)} H${f(rb + 0.6)}" stroke="${dark}" stroke-width="1.4" fill="none"/><path d="M${ra},${f(top - 5.2)} H${f(rb)}" stroke="${dark}" stroke-width="0.7" fill="none"/><circle cx="${ra}" cy="${f(top - 5.4)}" r="2.3" fill="none" stroke="${P.coral}" stroke-width="1.3"/><path d="M${ra - 2.3},${f(top - 5.4)} h1.3 M${ra + 1},${f(top - 5.4)} h1.3 M${ra},${f(top - 7.7)} v1.3 M${ra},${f(top - 4.4)} v1.3" stroke="${P.cream}" stroke-width="1" fill="none"/>`); }
  // the ladder down into the water at the lake end
  o.push(`<path d="M${x0 - 3.6},${f(WATER + 3)} V${f(top - 3)} q0,-1.6 1.6,-1.6 M${x0 - 1.2},${f(WATER + 3)} V${f(top - 1)} M${x0 - 3.6},${f(top + 3.4)} h2.4 M${x0 - 3.6},${f(top + 5.8)} h2.4 M${x0 - 3.6},${f(top + 8.2)} h2.4" stroke="${dark}" stroke-width="0.8" fill="none" stroke-linecap="round"/>`);
  // the rowboat, and the line that held it
  const hull = `M763.4,${f(WATER - 2.8)} C764.6,${f(WATER + 2.6)} 768,${f(WATER + 4.6)} 774,${f(WATER + 4.8)} L788,${f(WATER + 4.8)} C792.6,${f(WATER + 4.6)} 794.8,${f(WATER + 1.6)} 795.6,${f(WATER - 3.6)} C785,${f(WATER - 1.2)} 774,${f(WATER - 1)} 763.4,${f(WATER - 2.8)}Z`;
  o.push(until(3, `<path d="${hull}" fill="${dark}"/><path d="M763.4,${f(WATER - 2.8)} C774,${f(WATER - 1)} 785,${f(WATER - 1.2)} 795.6,${f(WATER - 3.6)}" stroke="${P.cream}" stroke-width="0.9" fill="none" stroke-linecap="round" opacity="0.9"/><path d="M766,${f(WATER + 2.2)} Q780,${f(WATER + 3.6)} 794,${f(WATER + 1.4)}" stroke="${wood}" stroke-width="0.6" fill="none" opacity="0.7"/><path d="M781,${f(WATER - 1.5)} L766.6,${f(WATER - 5.4)}" stroke="${dark}" stroke-width="0.8" fill="none" stroke-linecap="round"/><path d="M768.4,${f(WATER - 4.9)} L763.2,${f(WATER - 6.5)}" stroke="${dark}" stroke-width="1.9" fill="none" stroke-linecap="round"/><path d="M795.4,${f(WATER - 3.2)} Q800,${f(WATER - 2.6)} 803.6,${f(top - 5)}" stroke="${P.cream}" stroke-width="0.45" fill="none" opacity="0.8"/>`));
  o.push(from(4, `<path d="M803.4,${f(top - 5)} q-1.8,7 -0.8,${f(WATER + 3 - top + 5)}" stroke="${P.cream}" stroke-width="0.45" fill="none" opacity="0.8"/>`));
  return o.join('');
}

export function lake({ pal = 'gold', layered = true, id = 'hero' } = {}){
  L.usePalette(pal); L.begin(); L.reseed(11);
  L.setSun({ x: 575, y: 352, r: 43 }); L.setWater(564);
  const P = L.P, SUN = L.SUN, WATER = L.WATER;
  const dusk = pal !== 'gold';
  const sky = [], mid = [], fg = [], land = [];
  // ---- trees. A stand is a mixture: firs, spruces, hemlocks, pines, and a few aspens down at the water.
  const treeC = (tone, rimW) => ({ tone, lit: mix(tone, P.tealLight, 0.5), mid: mix(tone, P.tealLight, 0.2), deep: mix(tone, P.ink, 0.5), trunk: mix(P.plumDeep, P.ink, 0.45), rim: P.tealLight, rimW });
  const gold = mix(mix(P.window, P.coral, 0.18), P.haze, 0.22), aspenOf = g => { const c = mix(gold, P.tealLight, g); return { bark: mix(P.cream, P.haze, 0.3), barkSh: mix(P.haze, P.plumDeep, 0.3), leaf: c, leafLit: mix(c, P.cream, 0.4), leafSh: mix(c, P.plum, 0.42) }; };
  const tree = (kind, x, y, h, tone, rimW, seed) => kind === 'pine' ? pineTree(x, y, h * 1.06, treeC(tone, rimW), { seed }) : conifer(x, y, h, treeC(tone, rimW), { kind, seed });
  // the lodge view is a crop of this picture, and trees wholly outside the crop are left out of it. They still take
  // their numbers from the shared sequence, so the trees that are drawn stand where they stand in the full picture.
  const seen = (x, half) => layered || (x + half > 780 && x - half < 1460);
  const kindFrom = v => v < 0.32 ? 'fir' : v < 0.64 ? 'spruce' : v < 0.86 ? 'hemlock' : 'pine';

  // ================= SKY =================
  sky.push(`<rect x="0" y="-90" width="${W}" height="${WATER + 100}" fill="url(#${linGrad(0, 0, 0, WATER, [[0, P.skyTop], [0.34, P.skyMid], [0.68, P.skyLow], [1, P.skyHorizon]])})"/>`);
  sky.push(grain(0, -90, W, 420, GL(0, 0, 0, 330, [[0, 0.4], [0.5, 0.14], [1, 0]]), P.grainSky));
  if (!dusk) {
    sky.push(`<circle cx="${SUN.x}" cy="${SUN.y}" r="360" fill="url(#${radGrad(SUN.x, SUN.y, 360, [[0, P.cream, 0.5], [0.22, P.cream, 0.4], [0.6, P.cream, 0.14], [1, P.cream, 0]])})"/>`);
    sky.push(grain(SUN.x - 470, SUN.y - 470, 940, 940, GR(SUN.x, SUN.y, 470, [[0, 0.24], [0.3, 0.2], [0.7, 0.08], [1, 0]]), P.sun, { opacity: 0.8 }));
  } else {
    // afterglow where the sun went down, and the first stars
    sky.push(`<ellipse cx="${SUN.x}" cy="${WATER - 150}" rx="560" ry="230" fill="url(#${radGrad(SUN.x, WATER - 150, 560, [[0, P.sun, 0.5], [0.5, P.sun, 0.16], [1, P.sun, 0]])})" transform="translate(0,${(WATER - 150) * 0.59}) scale(1,0.41)"/>`);
    let st = ''; for (let k = 0; k < 90; k++) { const x = rnd(0, W), y = rnd(-60, 300); st += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rnd(0.7, 1.7))}" opacity="${f(rnd(0.3, 0.9) * (1 - y / 360))}"/>`; }
    sky.push(`<g fill="${P.cream}">${st}</g>`);
  }
  sky.push(`<path d="M0,-17 A17,17 0 0,0 0,17 A10,17 0 0,1 0,-17Z" transform="translate(1262,118) rotate(-35)" fill="${P.cream}" opacity="0.85"/>`);
  sky.push(L.cloud(330, 150, 1.15, [[0, 0, 230, 24], [-40, 18, 300, 26], [50, 38, 190, 22]]));
  sky.push(L.cloud(935, 196, 1.0, [[0, 0, 200, 22], [44, 17, 290, 26], [-20, 37, 170, 20]]));
  sky.push(L.cloud(1200, 262, 0.7, [[0, 0, 180, 22], [-30, 17, 260, 24]]));
  sky.push(L.cloud(150, 268, 0.66, [[0, 0, 210, 22], [36, 17, 250, 24]]));
  sky.push(L.cloud(700, 92, 0.62, [[0, 0, 170, 20], [-24, 15, 240, 24]]));
  if (!dusk) sky.push(`<g fill="${P.sun}"><circle cx="${SUN.x}" cy="${SUN.y}" r="${SUN.r + 62}" opacity="0.13"/><circle cx="${SUN.x}" cy="${SUN.y}" r="${SUN.r + 34}" opacity="0.2"/><circle cx="${SUN.x}" cy="${SUN.y}" r="${SUN.r + 14}" opacity="0.34"/><circle cx="${SUN.x}" cy="${SUN.y}" r="${SUN.r}"/></g>`);
  {
    let b = '';
    for (const [x, y, s] of [[742, 232, 1], [768, 218, 0.8], [716, 250, 0.9], [796, 236, 0.7], [690, 228, 0.65], [822, 208, 0.6], [760, 262, 0.55]])
      b += `<path d="M${f(x - 8 * s)},${f(y + 1 * s)} Q${f(x - 4 * s)},${f(y - 5 * s)} ${x},${y} Q${f(x + 4 * s)},${f(y - 5 * s)} ${f(x + 8 * s)},${f(y + 1 * s)}"/>`;
    sky.push(until(1, `<g fill="none" stroke="${P.plum}" stroke-width="1.7" stroke-linecap="round" opacity="0.8">${b}</g>`));
  }
  {
    const pts = [[-20, 432], [60, 396], [118, 352], [176, 374], [242, 302], [300, 340], [350, 320], [422, 262], [470, 302], [505, 318], [540, 372], [585, 390], [632, 376], [682, 330], [742, 292], [800, 320], [862, 254], [916, 294], [960, 278], [1030, 336], [1092, 312], [1150, 354], [1232, 300], [1300, 346], [1372, 318], [1440, 366], [1522, 336], [1620, 382]];
    const r = L.range(pts, { baseY: WATER, lit: P.farLit, shadeColor: P.farShade, shadeOpacity: 0.34, snowPeaks: [4, 7, 16, 22], amp: 5, seg: 30, caps: false });
    sky.push(r.svg);
    // relief: snow with a ragged hem on the four high peaks, the shade of the dark faces carried across it, ribs
    // and runnels on every face, a stipple in the shade, and the skyline toward the sun picked out in light
    const caps = snowcaps(r.peaks, 31), rb = ribs(r.peaks, 17, 1), liftTone = mix(P.farLit, P.cream, 0.6);
    sky.push(`<g clip-path="url(#${r.cid})"><path d="${caps}" fill="${P.snow}"/><path d="${r.shadeD}" fill="${P.farShade}" fill-opacity="0.34" clip-path="url(#${clip(caps)})"/><path d="${rb.cut}" fill="${P.farShade}" fill-opacity="0.17"/><path d="${rb.deep}" fill="${P.farShade}" fill-opacity="0.2"/><path d="${rb.lift}" fill="${liftTone}" fill-opacity="0.3"/><path d="${rb.fluteLit}" fill="none" stroke="${P.farShade}" stroke-opacity="0.22" stroke-width="1.2" stroke-linecap="round"/><path d="${rb.fluteSh}" fill="none" stroke="${liftTone}" stroke-opacity="0.3" stroke-width="1.2" stroke-linecap="round"/></g>`);
    sky.push(grain(0, 230, W, 340, GL(0, 250, 0, 520, [[0, 0.42], [0.5, 0.2], [1, 0.02]]), P.farShade, { clipId: clip(r.shadeD), seed: 9710, opacity: 0.3 }));
    sky.push(`<path d="${rb.rim}" fill="none" stroke="${dusk ? P.cream : P.sun}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" opacity="${dusk ? 0.55 : 0.95}"/>`);
    sky.push(`<rect x="0" y="330" width="${W}" height="${WATER - 330}" fill="url(#${linGrad(0, 330, 0, 480, [[0, P.cream, 0], [1, P.cream, dusk ? 0.3 : 0.6]])})" clip-path="url(#${r.cid})"/>`);
    sky.push(grain(0, 300, W, 180, GL(0, 300, 0, 470, [[0, 0], [1, 0.2]]), P.cream, { clipId: r.cid }));
  }

  // ================= LAND (reflected in the lake, so it lives in <defs>) =================
  {
    const pts = [[-20, 468], [70, 430], [150, 454], [232, 402], [310, 440], [380, 416], [450, 456], [540, 474], [640, 466], [720, 440], [802, 404], [880, 446], [950, 420], [1042, 372], [1110, 410], [1182, 388], [1260, 430], [1342, 396], [1420, 440], [1502, 410], [1620, 452]];
    const r = L.range(pts, { baseY: WATER, lit: P.midLit, shadeColor: P.midShade, shadeOpacity: 0.42, amp: 4, seg: 28, ridgeZig: 9 });
    land.push(r.svg);
    { const rb = ribs(r.peaks, 23, 0.8), lift = mix(P.midLit, P.peach, 0.45); land.push(`<g clip-path="url(#${r.cid})"><path d="${rb.cut}" fill="${P.midShade}" fill-opacity="0.2"/><path d="${rb.deep}" fill="${P.midShade}" fill-opacity="0.24"/><path d="${rb.lift}" fill="${lift}" fill-opacity="0.22"/><path d="${rb.fluteLit}" fill="none" stroke="${P.midShade}" stroke-opacity="0.24" stroke-width="1" stroke-linecap="round"/></g><path d="${rb.rim}" fill="none" stroke="${mix(P.midLit, P.cream, 0.5)}" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round" opacity="0.7"/>`); }
    land.push(`<rect x="0" y="440" width="${W}" height="${WATER - 440}" fill="url(#${linGrad(0, 440, 0, WATER, [[0, P.peach, 0], [1, P.cream, dusk ? 0.34 : 0.7]])})" clip-path="url(#${r.cid})"/>`);
    land.push(`<path d="${L.treeRow(440, 720, curveFn([[440, 556], [560, 558], [720, 555]]), { hMin: 5, hMax: 11, step: 6, baseY: WATER })}" fill="${mix(P.midLit, P.haze, 0.55)}"/>`);
  }
  land.push(L.hill(-20, 520, [[-20, 452], [110, 438], [230, 450], [330, 486], [420, 530], [500, 566], [520, 582]], 5, 21, P.haze, P.teal, { mixed: true }));
  land.push(L.hill(620, 1620, [[620, 582], [650, 566], [760, 528], [900, 490], [1060, 462], [1220, 440], [1380, 428], [1500, 432], [1620, 446]], 6, 21, P.haze, P.teal, { mixed: true }));
  {
    const topFn = curveFn([[-20, 538], [120, 532], [260, 540], [360, 552], [430, 562], [452, 566]]);
    const pts = [[-20, WATER + 2]]; for (let x = -20; x <= 452; x += 8) pts.push([x, topFn(x)]); pts.push([452, WATER + 2]);
    let trees = '';
    const xs = []; for (let x = -10; x < 430; x += rnd(13, 26)) xs.push(x);
    xs.sort(() => rnd() - 0.5);
    // each tree takes from the shared sequence exactly what the old single kind of pine took, so nothing after it moves
    const kr = L.source(4201); let n = 0;
    for (const x of xs) { const k = 1 - Math.max(0, (x - 200) / 260); const h = rnd(38, 78) * (0.55 + 0.6 * k); rnd(0.36, 0.46); const tiers = 4 + Math.round(rnd(0, 2)), tone = pick([P.tealDeep, mix(P.tealDeep, P.teal, 0.5)]); L.skip(5 * tiers); const kind = kindFrom(kr()), sd = 100 + n++; if (seen(x, h * 0.3)) trees += tree(kind, x, topFn(x) + 3, h, tone, 1.8, sd); }
    // three aspens at the water's edge, in front of the dark trees
    const aspens = !seen(324, 60) ? '' : [[296, 60, 1, 0.1], [324, 46, 2, 0], [352, 56, 3, 0.2]].map(([x, h, sd, g]) => aspen(x, topFn(x) + 4, h, aspenOf(g), { seed: sd })).join('');
    land.push(trees + aspens + `<path d="${poly(pts)}" fill="${P.tealDeep}"/>`);
  }
  {
    const topFn = curveFn([[884, 566], [910, 559], [985, 550], [1080, 546], [1200, 545], [1340, 540], [1480, 534], [1620, 530]]);
    const pts = [[884, WATER + 2]]; for (let x = 884; x <= 1620; x += 8) pts.push([x, topFn(x)]); pts.push([1620, WATER + 2]);
    let back = '';
    const xs = []; for (let x = 1000; x < 1620; x += rnd(15, 30)) xs.push(x);
    xs.sort(() => rnd() - 0.5);
    const tall = [];
    const kr = L.source(4202); let n = 0;
    for (const x of xs) { const near = Math.exp(-Math.pow((x - 1150) / 150, 2)); const h = rnd(70, 120) + near * rnd(40, 80); tall.push([x, topFn(x) + 3 - h]); rnd(0.34, 0.44); const tiers = 5 + Math.round(rnd(0, 2)), tone = pick([P.tealDeep, mix(P.tealDeep, P.teal, 0.45), mix(P.tealDeep, P.ink, 0.4)]); L.skip(5 * tiers); back += tree(kindFrom(kr()), x, topFn(x) + 3, h, tone, 2.2, 200 + n++); }
    // From stage 3 every tall crown behind the lodge ends at the same height.
    const snapY = 456; const sp = [[980, 700]]; for (let x = 980; x <= 1640; x += 7) sp.push([x, snapY + rnd(-5, 5)]); sp.push([1640, 700]);
    const sc = clip(poly(sp));
    let splinter = '';
    for (const [x, ty] of tall) if (ty < snapY - 12 && rnd() < 0.5) { const w = rnd(1.8, 3.8), h = rnd(5, 19), l = rnd(-3, 3); splinter += `<path d="M${f(x - w)},${snapY + 5} L${f(x - w * 0.4 + l)},${f(snapY - h)} L${f(x + l * 0.5)},${f(snapY - h * 0.45)} L${f(x + w * 0.5)},${f(snapY - h * 0.8)} L${f(x + w)},${snapY + 5}Z"/>`; }
    // the stand is stored once and shown twice: whole, and from stage 3 cut off at the line
    const standId = id + 'Stand'; L.defs.push(`<g id="${standId}">${back}</g>`);
    land.push(until(2, `<use href="#${standId}"/>`) + from(3, `<use href="#${standId}" clip-path="url(#${sc})"/><g fill="${P.cream}" opacity="0.9">${splinter}</g>`));
    const lodge = L.lodge();
    land.push(`<g transform="translate(1128,548) scale(1.28)">${lodge.body}</g>`);
    land.push(`<path d="${poly(pts)}" fill="${P.tealDeep}"/>`);
    let front = '';
    for (const [x, h, kind, sd] of [[925, 34, 'fir', 1], [948, 52, 'spruce', 2], [972, 40, 'aspen', 4], [1004, 64, 'hemlock', 3], [1030, 46, 'fir', 4], [1300, 70, 'aspen', 5], [1330, 96, 'spruce', 5], [1362, 78, 'pine', 6], [1396, 110, 'fir', 7]]) { L.skip(20); front += kind === 'aspen' ? aspen(x, topFn(x) + 4, h * 0.9, aspenOf(sd === 5 ? 0.12 : 0), { seed: sd }) : tree(kind, x, topFn(x) + 4, h, P.ink, 1.8, 300 + sd); }
    // the small trees along the shore stand on the bank, behind the deck, so the deck and its railing go on after them
    land.push(front);
    land.push(`<g transform="translate(1128,548) scale(1.28)">${lodge.deck}</g>`);
  }
  const landId = id + 'Land';
  L.defs.push(`<g id="${landId}">${land.join('\n')}</g>`);
  // the dock is kept apart from the rest of the land, because it stands in front of the far shoreline and is drawn after it
  const dockId = id + 'Dock';
  L.defs.push(`<g id="${dockId}">${dock(P)}</g>`);

  // ================= LAKE =================
  mid.push(`<rect x="0" y="${WATER}" width="${W}" height="${LOW - WATER}" fill="url(#${linGrad(0, WATER, 0, H, [[0, P.lake[0]], [0.16, P.lake[1]], [0.4, P.lake[2]], [0.68, P.lake[3]], [1, P.lake[4]]])})"/>`);
  const fadeId = id + 'Fade';
  L.defs.push(`<mask id="${fadeId}" maskUnits="userSpaceOnUse" x="0" y="${WATER}" width="${W}" height="${H - WATER}"><rect x="0" y="${WATER}" width="${W}" height="${H - WATER}" fill="url(#${linGrad(0, WATER, 0, WATER + 250, [[0, '#fff', 0.7], [0.5, '#fff', 0.42], [1, '#fff', 0]])})"/></mask>`);
  mid.push(`<g mask="url(#${fadeId})"><use href="#${landId}" transform="translate(0,${f(WATER * 1.86)}) scale(1,-0.86)"/><rect x="0" y="${WATER}" width="${W}" height="260" fill="${P.lake[3]}" opacity="0.28"/></g>`);
  mid.push(`<g mask="url(#${fadeId})"><use href="#${dockId}" transform="translate(0,${f(WATER * 1.86)}) scale(1,-0.86)"/></g>`);
  // the thing: stage 3 faint and far, 4 unmistakable, 5 nearer the open water; gone at 6 (it has left the park)
  mid.push(between(3, 3, thing(1040, 150, 13, 0.34, 4)) + between(4, 4, thing(1034, 262, 16, 0.62, 7)) + between(5, 5, thing(952, 344, 21, 0.74, -9)));
  mid.push(grain(0, WATER + 110, W, H - WATER - 110, GL(0, WATER + 110, 0, H, [[0, 0], [0.6, 0.11], [1, 0.34]]), P.ink));
  // ---- the surface of the water, drawn with slivers (see the top of the file) and not with straight bars
  {
    L.skip(654);                                       // what the old ripples took from the shared sequence, so the shore and foreground stay as they were
    const wr = L.source(1907), depth = y => (y - WATER) / (H - WATER);
    // slits of open water that break the reflection into bands
    let slit = ['', ''];
    for (let k = 0; k < 44; k++) { const y = WATER + 10 + Math.pow(wr(), 1.2) * 190, w = wr(60, 280); slit[k % 2] += sliver(wr(-40, W), y, w, wr(1.6, 3.4), wr(-1, 1)); }
    // ripples: bright along the crest, dark in the trough behind it. They come in patches where a breath of wind
    // has touched the water, a few stacked one behind another, and singly in between.
    const lit = ['', '', ''], dk = ['', ''];
    const ripple = (x, y, k) => { const t = depth(y), w = wr(26, 120) * (0.45 + t * 1.1), th = lerp(1.3, 3.8, t) * wr(0.8, 1.25), a = th * wr(-0.9, 0.9); lit[k % 3] += sliver(x, y, w, th, a); if (wr() < 0.55) dk[k % 2] += sliver(x + w * wr(0.05, 0.3), y + th * wr(1.3, 2.2), w * wr(0.6, 1.1), th * wr(0.8, 1.2), a); };
    for (let c = 0; c < 22; c++) { const cy = WATER + 14 + Math.pow(wr(), 1.3) * (H - WATER - 80), cx = wr(-20, W - 60), t = depth(cy); for (let j = 0, n = 2 + Math.floor(wr(0, 4)); j < n; j++) ripple(cx + wr(-60, 60) * (0.5 + t), cy + j * lerp(5, 15, t) * wr(0.8, 1.2), c + j); }
    for (let k = 0; k < 44; k++) ripple(wr(-40, W), WATER + 8 + Math.pow(wr(), 1.4) * (H - WATER - 60), k);
    for (let k = 0; k < 20; k++) { const y = WATER + 130 + wr() * (H - WATER - 160), t = depth(y), w = wr(40, 170) * (0.5 + t); dk[k % 2] += sliver(wr(-40, W), y, w, lerp(1.6, 4.4, t), wr(-1.5, 1.5)); }
    // long low swells: a ribbon that rises and falls several times along its length and thickens between the turns
    const swell = (x, y, w, th, amp, n) => { const seg = w / n; let d = `M${f(x)},${f(y)}`; for (let i = 0; i < n; i++) d += `Q${f(x + seg * (i + 0.5))},${f(y + (i % 2 ? amp : -amp))} ${f(x + seg * (i + 1))},${f(y)}`; for (let i = n - 1; i >= 0; i--) d += `Q${f(x + seg * (i + 0.5))},${f(y + (i % 2 ? amp : -amp) + th * 2 * Math.sin(Math.PI * (i + 0.5) / n))} ${f(x + seg * i)},${f(y + th * Math.sin(Math.PI * i / n))}`; return d + 'Z'; };
    const sw = ['', ''];
    for (let k = 0; k < 22; k++) { const y = WATER + 60 + Math.pow(wr(), 1.1) * (H - WATER - 100), t = depth(y), w = wr(150, 420) * (0.6 + t * 0.8); sw[k % 3 ? 0 : 1] += swell(wr(-80, W - 80), y, w, lerp(0.7, 1.9, t), lerp(0.9, 3.2, t) * wr(0.7, 1.2), 3 + Math.floor(wr(0, 3.99))); }
    // two places where the wind is on the water: a scatter of short bright flecks
    let fleck = '';
    for (const [cx, cy, rx, ry, n] of [[300, 668, 190, 15, 46], [1270, 742, 230, 22, 52]]) for (let k = 0; k < n; k++) { const an = wr(0, 6.283), q = Math.sqrt(wr()), x = cx + Math.cos(an) * rx * q, y = cy + Math.sin(an) * ry * q, t = depth(y); fleck += sliver(x, y, wr(7, 20) * (0.6 + t), lerp(0.9, 1.8, t), 0); }
    // and a fish has risen out in the middle
    const rise = `<g fill="none" stroke="${P.cream}" stroke-width="1.2" opacity="${dusk ? 0.22 : 0.4}"><ellipse cx="1012" cy="676" rx="20" ry="2.4"/><ellipse cx="1012" cy="676" rx="38" ry="4.4" opacity="0.6"/></g>`;
    mid.push(`<g fill="${P.lake[2]}"><path d="${slit[0]}" opacity="0.34"/><path d="${slit[1]}" opacity="0.54"/></g><g fill="${P.cream}" opacity="${dusk ? 0.5 : 1}"><path d="${sw[0]}" opacity="0.26"/><path d="${lit[0]}" opacity="0.26"/><path d="${lit[1]}" opacity="0.38"/><path d="${lit[2]}" opacity="0.52"/><path d="${fleck}" opacity="0.42"/></g><g fill="${P.tealDeep}"><path d="${sw[1]}" opacity="0.2"/><path d="${dk[0]}" opacity="0.22"/><path d="${dk[1]}" opacity="0.34"/></g>${rise}`);
  }
  if (!dusk) {
    // ---- the sun on the water: a road of light from the far shore to our feet. Close under the sun it is nearly one
    // unbroken bright streak; toward us it widens and breaks into separate flashes, long in the middle of the
    // road and small and scattered at its edges, with a soft sheen under all of it.
    L.skip(164);
    const gr = L.source(733);
    // the sheen: light with no edge to it, narrow and strong under the sun, wide and faint by the time it reaches us
    const sheen = (cx, cy, rx, ry, a0) => { const id = nid('rg'); L.defs.push(`<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="translate(${cx},${cy}) scale(${rx},${ry})"><stop offset="0" stop-color="${P.sun}" stop-opacity="${a0}"/><stop offset="0.5" stop-color="${P.sun}" stop-opacity="${f(a0 * 0.45)}"/><stop offset="1" stop-color="${P.sun}" stop-opacity="0"/></radialGradient>`); return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${id})"/>`; };
    mid.push(`<g clip-path="url(#${L.clipRect(0, WATER, W, LOW - WATER)})">${sheen(SUN.x, WATER + 20, 30, 190, 0.6)}${sheen(SUN.x, H + 60, 250, 470, 0.34)}</g>`);
    const g = ['', '', ''];
    let y = WATER + 3.5;
    while (y < 884) {
      const t = (y - WATER) / (H - WATER), e = Math.pow(t, 1.2), th = lerp(2.4, 11.5, t) * gr(0.85, 1.15), len = lerp(26, 210, e) * gr(0.6, 1.15), spread = lerp(8, 128, e), x = SUN.x + gr(-1, 1) * spread * 0.22 - len / 2, a = th * gr(-0.5, 0.5);
      // the long flash in the middle of the road, sometimes broken in two
      if (t > 0.22 && gr() < 0.42) { const cut = gr(0.3, 0.7), gap = lerp(5, 16, t); g[0] += sliver(x, y, len * cut - gap / 2, th, a) + sliver(x + len * cut + gap / 2, y + gr(-1, 1), len * (1 - cut) - gap / 2, th * gr(0.75, 1), -a); } else g[0] += sliver(x, y, len, th, a);
      // shorter ones beside it, and small ones out at the edge
      for (let j = 0, n = Math.floor(gr(0.8, 2.8 + t * 2.6)); j < n; j++) { const side = gr() < 0.5 ? -1 : 1, l2 = len * gr(0.14, 0.42), off = len * 0.5 + gr(5, 12 + spread * 0.7); g[1] += sliver(SUN.x + side * off - l2 / 2, y + gr(-0.4, 0.6) * th, l2, th * gr(0.55, 0.85), gr(-0.4, 0.4) * th); }
      if (gr() < 0.5 + t * 0.4) { const side = gr() < 0.5 ? -1 : 1, l3 = lerp(5, 30, t) * gr(0.6, 1.3); g[2] += sliver(SUN.x + side * gr(spread * 0.9, spread * 1.7 + 18) - l3 / 2, y + gr(-0.5, 0.5) * th * 2, l3, th * gr(0.4, 0.6), 0); }
      y += th * 0.72 + lerp(2.2, 10.5, t) * gr(0.75, 1.3);
    }
    mid.push(`<g fill="${P.sun}"><path d="${g[2]}" opacity="0.45"/><path d="${g[1]}" opacity="0.72"/><path d="${g[0]}" opacity="0.96"/></g>`);
  }
  {
    let wl = '', y = WATER + 9;
    while (y < WATER + 120) { const t = (y - WATER) / 120; const w = rnd(16, 52) * (1 - t * 0.4); wl += `<path d="${sliver(1128 + rnd(-14, 14) - w / 2, y, w, 2.2 + t * 2.4, (1 - t) * 0.6)}" opacity="${f(0.85 * (1 - t))}"/>`; y += rnd(5, 9); }
    mid.push(until(4, `<g fill="${P.window}">${wl}</g>`));
  }
  // from stage 2 the canoe is no longer on the bank; it sits out on the water with nobody in it
  mid.push(from(2, `<g transform="translate(742,690) rotate(4) scale(0.62)"><ellipse cx="0" cy="12" rx="132" ry="6" fill="${P.cream}" opacity="0.3"/>${L.canoe({ shadow: false, paddle: false, afloat: true })}</g>`));
  mid.push(`<use href="#${landId}"/>`);
  mid.push(until(3, `<g fill="${P.cream}">${[[1246, 437, 9, 5, 0.75], [1251, 426, 15, 7, 0.66], [1261, 413, 22, 9, 0.55], [1275, 398, 30, 11, 0.42], [1294, 383, 24, 9, 0.3], [1312, 371, 15, 6, 0.2]].map(([x, y, w, h, o]) => `<rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="${h / 2}" opacity="${o}"/>`).join('')}</g>`));
  mid.push(`<g stroke="${P.cream}" stroke-linecap="round" fill="none"><path d="M0,${WATER + 1.5}H448" stroke-width="2" opacity="0.6"/><path d="M886,${WATER + 1.5}H${W}" stroke-width="2" opacity="0.6"/><path d="M452,${WATER + 0.5}H884" stroke-width="1.4" opacity="0.5"/></g>`);
  mid.push(`<use href="#${dockId}"/>`);
  mid.push(L.rock(470, WATER + 3, 30, 10, P.plum, P.haze) + L.rock(498, WATER + 4, 15, 5, P.plum, P.haze) + L.rock(706, WATER + 4, 18, 6, P.plumDeep, P.haze));

  // ================= FOREGROUND =================
  {
    const bankFn = curveFn([[0, 776], [120, 776], [230, 796], [340, 826], [470, 852], [600, 872], [760, 884], [900, 884], [1020, 872], [1140, 852], [1260, 828], [1400, 794], [1600, 760]]);
    fg.push(`<g fill="none" stroke="${P.cream}" stroke-width="1.6" opacity="0.45"><ellipse cx="790" cy="846" rx="74" ry="6"/><ellipse cx="790" cy="846" rx="104" ry="9.5" opacity="0.55"/></g>`);
    fg.push(L.rock(772, 849, 96, 27, P.plumDeep, mix(P.haze, P.peach, 0.3)) + L.rock(838, 850, 44, 13, P.plumDeep, mix(P.haze, P.peach, 0.18)));
    // the six big trees that frame the view, no two sides alike: a ragged spruce, a fir and a hemlock on the left;
    // a hemlock, a spruce and a pine with its crown held clear of its trunk on the right
    const fgp = (x, h, w, tiers, depth, kind, seed) => {
      L.skip(5 * tiers);                                // what the old pine took from the shared sequence
      if (!seen(x, w * 0.56)) { L.grainSkip(2); return ''; }
      const tone = mix(P.ink, P.tealDeep, depth), C = { tone, lit: mix(tone, P.tealLight, 0.48), mid: mix(tone, P.tealLight, 0.18), deep: mix(tone, '#04141A', 0.55), trunk: mix(P.plumDeep, P.ink, 0.5), rim: P.rim, rimW: 2.6 }, yb = bankFn(Math.max(0, Math.min(W, x))) + 14;
      return kind === 'pine' ? pineTree(x, yb, h * 1.08, C, { seed, grainy: true, crown: 0.5, lean: 0.02 }) : conifer(x, yb, h, C, { kind, seed, grainy: true, w: w / 2 * ({ spruce: 1.04, hemlock: 0.95, fir: 0.74 })[kind], lean: 0 });
    };
    fg.push(fgp(206, 430, 172, 10, 0.6, 'hemlock', 51) + fgp(1404, 400, 162, 10, 0.6, 'pine', 52) + fgp(-34, 560, 232, 12, 0.3, 'fir', 53) + fgp(1634, 600, 246, 12, 0.3, 'spruce', 54) + fgp(64, 668, 258, 14, 0, 'spruce', 55) + fgp(1532, 706, 276, 14, 0, 'hemlock', 56));
    const pts = [[0, LOW]]; for (let x = 0; x <= W; x += 10) pts.push([x, bankFn(x)]); pts.push([W, LOW]);
    const bank = poly(pts);
    fg.push(`<path d="${bank}" fill="${P.tealLight}"/><path d="${bank}" fill="${P.ink}" transform="translate(0,4)"/>`);
    fg.push(grain(0, 756, W, H - 756, GL(0, 760, 0, H, [[0, 0.4], [0.45, 0.12], [1, 0]]), P.teal, { clipId: clip(bank) }));
    fg.push(until(1, `<g transform="translate(1110,${f(bankFn(1110) - 4)}) rotate(-8) scale(1.22)">${L.canoe()}</g>`));
    // the keel mark it left
    fg.push(from(2, `<path d="M1012,${f(bankFn(1012) + 12)} Q1100,${f(bankFn(1100) + 4)} 1210,${f(bankFn(1210) + 9)}" stroke="${P.tealLight}" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.5"/>`));
    let gr = '', gr2 = '', cat = '';
    for (let x = 250; x < 1420; x += rnd(9, 30)) {
      if (x > 990 && x < 1240) continue;
      const y = bankFn(x) + 5, n = 3 + Math.floor(rnd(0, 5));
      for (let k = 0; k < n; k++) {
        const bx = x + rnd(-7, 7), h = rnd(14, 46) * (rnd() < 0.12 ? 1.8 : 1), lean = rnd(-0.5, 0.5) * h, bw = rnd(1.3, 2.3);
        const d = `<path d="M${f(bx - bw)},${f(y)} Q${f(bx + lean * 0.15 - bw * 0.6)},${f(y - h * 0.6)} ${f(bx + lean)},${f(y - h)} Q${f(bx + lean * 0.3 + bw)},${f(y - h * 0.5)} ${f(bx + bw)},${f(y)}Z"/>`;
        if (rnd() < 0.24) gr2 += d; else gr += d;
      }
      if (rnd() < 0.13) { const h = rnd(48, 86), lean = rnd(-8, 8); cat += `<path d="M${f(x)},${f(y)} Q${f(x + lean * 0.3)},${f(y - h * 0.5)} ${f(x + lean)},${f(y - h)}" stroke="${P.ink}" stroke-width="1.6" fill="none"/><rect x="${f(x + lean - 2.6)}" y="${f(y - h - 4)}" width="5.2" height="15" rx="2.6" fill="${P.plumDeep}" transform="rotate(${f(lean * 0.9)} ${f(x + lean)} ${f(y - h + 4)})"/>`; }
    }
    fg.push(`<g fill="${P.tealLight}">${gr2}</g><g fill="${P.ink}">${gr}</g>${cat}`);
    let fl = '';
    for (let k = 0; k < 64; k++) {
      const x = rnd(240, 1440), y = bankFn(x) + rnd(10, 44); if (y > H - 4) continue;
      if (Math.abs(x - 1110) < 150 && y < bankFn(x) + 34) continue;
      const r = rnd(1.5, 3.1), c = pick([P.cream, P.cream, P.coral, P.peach, P.window]);
      fl += `<path d="M${f(x)},${f(y)} v${f(rnd(5, 11))}" stroke="${P.tealLight}" stroke-width="1"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${c}"/>`;
    }
    fg.push(fl);
    // stage 6: it has left the water on our side. Rings where it stepped, and one print pressed into the bank.
    fg.push(from(6, `<g fill="none" stroke="${P.cream}" stroke-width="1.6" opacity="0.6"><ellipse cx="930" cy="742" rx="60" ry="7"/><ellipse cx="930" cy="742" rx="98" ry="12" opacity="0.6"/><ellipse cx="930" cy="742" rx="140" ry="18" opacity="0.35"/></g><ellipse cx="930" cy="743" rx="34" ry="4.5" fill="${P.ink}" opacity="0.55"/>
<g transform="translate(900,${f(bankFn(900) + 4)}) rotate(-8)"><ellipse cx="0" cy="-3" rx="92" ry="17" fill="${P.tealLight}"/><ellipse cx="2" cy="1" rx="84" ry="14" fill="${P.ink}"/><ellipse cx="10" cy="3" rx="58" ry="8" fill="#02080C"/><path d="M-84,-2 q10,-18 24,-22 M-60,-10 q8,-16 22,-18 M70,-6 q-4,-16 -18,-22" stroke="${P.tealLight}" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>`));
  }
  const vig = `<rect x="0" y="-90" width="${W}" height="${LOW + 90}" fill="url(#${radGrad(W / 2, H * 0.46, 1020, [[0.55, '#2A1B33', 0], [1, '#2A1B33', 0.36]])})"/>`;

  const wrap = (inner, extra = '') => `<svg class="ly" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"${extra}>${inner}</svg>`;
  const d = `<defs>${L.defs.join('\n')}</defs>`;
  if (!layered) return { svg: `<defs>${L.defs.join('\n')}</defs>${sky.join('\n')}${mid.join('\n')}${fg.join('\n')}${vig}`, vb: [0, 0, W, H] };
  return { layers: [wrap(d + sky.join('\n'), ' data-depth="0.1"'), wrap(mid.join('\n'), ' data-depth="0.32"'), wrap(fg.join('\n') + vig, ' data-depth="0.7"')], vb: [0, 0, W, H], vbm: [520, 130, 800, 770] };
}
