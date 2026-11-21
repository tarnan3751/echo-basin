// High country above the snowline: Pass Hut at golden hour for the zones section, and at night for the dark-sky
// section. Trees, drifts, boulders and the two walkers come from snowkit.mjs.
import * as L from './lib.mjs';
const { f, rnd, pick, lerp, mix, poly, curveFn, grain, GL, GR, from, until, between, linGrad, radGrad, clip } = L;
import { ribs } from './peaks.mjs';
import { source, smooth, snowTree, spireShadow, snowGhost, snag, mound, boulder, winterBack, snowshoes, figureShadow } from './snowkit.mjs';

// One deep print in snow, built from several shapes so it reads as a hole: a pushed-up rim that catches
// the light, the far wall lit, the near wall and floor in shadow, a cast shadow outside, and crumbs.
function printHole(x, y, s, C){
  return `<g transform="translate(${f(x)},${f(y)}) scale(${f(s)}) rotate(-21)">
<ellipse cx="10" cy="5.5" rx="31" ry="9.5" fill="${C.cast}" opacity="0.7"/>
<ellipse cx="0" cy="0" rx="25.5" ry="8.4" fill="${C.rim}"/>
<path d="M-25.5,0 A25.5,8.4 0 0 0 25.5,0 A25.5,6 0 0 1 -25.5,0Z" fill="${C.rimSh}"/>
<ellipse cx="0.5" cy="0.4" rx="22" ry="6.6" fill="${C.wall}"/>
<path d="M-21.5,0.4 A22,6.6 0 0 1 16.5,-4.4 C10,-2 6,1.6 5,6.4 A22,6.6 0 0 1 -21.5,0.4Z" fill="${C.deep}"/>
<ellipse cx="-4" cy="1.3" rx="14" ry="3.8" fill="${C.floor}"/>
${[[32, -5, 2.2], [-31, 5, 1.9], [24, 9, 1.5]].map(([cx, cy, r]) => `<ellipse cx="${cx + r * 0.9}" cy="${cy + r * 0.7}" rx="${r * 1.3}" ry="${r * 0.6}" fill="${C.cast}" opacity="0.7"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.rim}"/>`).join('')}
</g>`;
}
// Prints on one dead-straight line, spaced far too far apart. t0..t1 picks a stretch of the line.
// The line comes over the pass at the top right, crosses in front of the hut door and carries on toward us.
function prints(C, t0, t1, n){
  let d = '';
  for (let k = 0; k < n; k++) { const t = lerp(t0, t1, n === 1 ? 0 : k / (n - 1)), e = Math.pow(t, 1.7), y = lerp(372, 700, e); d += printHole(1212 - (y - 372) / 0.405, y, lerp(0.4, 1.8, e), C); }
  return d;
}
// Rock on a snow peak. A summit keeps its cap of snow and the gentler ground below holds snow too; between them
// the mountain is too steep for it, and that band is where the rock shows. So each peak gets a cliff band on the
// shaded side of its ridge and a smaller one on the lit side. The upper edge of a band is the hem of the snow cap;
// the lower edge is broken into short blocky steps where the snow slope laps up against it. One or two couloirs
// (narrow chutes of snow) run up through the band, and thin pale lines cross it where snow sits on ledges.
function rocks(peaks, k, seed){
  const r = source(seed);
  const at = (line, t) => { const u = Math.max(0, Math.min(line.length - 1.001, t * (line.length - 1))), i = Math.floor(u), q = u - i; return [lerp(line[i][0], line[i + 1][0], q), lerp(line[i][1], line[i + 1][1], q)]; };
  const out = { lit: '', dark: '', bands: '', chuteLit: '', chuteDark: '' };
  for (const p of peaks) {
    const d = p.dir, ridge = [[p.x, p.y], ...p.ridge], capDepth = r(0.07, 0.11) + 4 / p.hgt, depth = capDepth + r(0.16, 0.26);
    // sky: the skyline from the summit down this side. cover: how far along it the band runs. low: how far down the
    // ridge. lean: which way the ground falls on this face. Returns the band and its couloirs.
    const band = (sky, cover, low, lean) => {
      const n = sky.length - 1; if (n < 3) return ['', ''];
      const cap = Math.max(1, Math.min(n - 2, Math.round(r(0.12, 0.2) * n))), cut = Math.max(cap + 1, Math.min(n, Math.round(cover * n)));
      const head = at(ridge, capDepth), heel = at(ridge, low), foot = sky[cut], fl = Math.hypot(lean, 1), fx = lean / fl, fy = 1 / fl;
      const hem = t => [lerp(head[0], sky[cap][0], t), lerp(head[1], sky[cap][1], t)], chord = t => [lerp(foot[0], heel[0], t), lerp(foot[1], heel[1], t)];
      const span = Math.hypot(heel[0] - foot[0], heel[1] - foot[1]), pts = [head];
      for (let j = 1; j <= 2; j++) { const q = hem(j / 3 + r(-0.08, 0.08)), dip = p.hgt * r(0.012, 0.04) * (j % 2 ? 1 : -0.5); pts.push([q[0] + fx * dip, q[1] + fy * dip]); }     // the hem dips and lifts
      pts.push(...sky.slice(cap, cut + 1));
      const m = Math.max(3, Math.min(8, Math.round(span / (15 * k))));
      let lvl = p.hgt * r(0, 0.05);
      for (let j = 1; j < m; j++) {                                                    // the foot of the cliff, in level runs with a step between
        if (r() < 0.6) lvl = p.hgt * r(-0.012, 0.062);
        const c = chord((j + r(-0.3, 0.3)) / m); pts.push([c[0] + fx * lvl, c[1] + fy * lvl]);
      }
      pts.push(heel);
      for (let i = ridge.length - 2; i >= 1; i--) { const t = i / (ridge.length - 1); if (t < low && t > capDepth) pts.push(ridge[i]); }       // back up the ridge itself, so both bands meet on it exactly
      let chutes = '';
      for (let i = 0, cn = span > 46 * k ? (r() < 0.55 ? 2 : 1) : (r() < 0.6 ? 1 : 0); i < cn; i++) {
        const t = cn === 2 ? (i ? r(0.58, 0.8) : r(0.2, 0.42)) : r(0.3, 0.7), b = chord(t), w = Math.max(1.6, p.hgt * r(0.011, 0.02)), h = hem(Math.min(0.92, Math.max(0.08, 1 - t + r(-0.15, 0.15)))), reach = r(0.62, 1.05);
        const base = [b[0] + fx * p.hgt * 0.08, b[1] + fy * p.hgt * 0.08], apex = [lerp(b[0], h[0], reach), lerp(b[1], h[1], reach)], mid = [lerp(base[0], apex[0], 0.5) + r(-1, 1) * w * 1.4, lerp(base[1], apex[1], 0.5)];
        chutes += poly([[base[0] - w * 1.3, base[1]], [mid[0] - w * 0.8, mid[1]], [apex[0] - w * 0.2, apex[1]], [apex[0] + w * 0.2, apex[1]], [mid[0] + w * 0.8, mid[1]], [base[0] + w * 1.3, base[1]]]) + ' ';
      }
      return [poly(pts) + ' ', chutes];
    };
    const [dk, cd] = band(p.edge, r(0.42, 0.66), depth, d * 0.3), [lt, cl] = band(p.edgeLit, r(0.28, 0.46), capDepth + (depth - capDepth) * r(0.6, 0.95), -d * 0.5);
    out.dark += dk; out.chuteDark += cd; out.lit += lt; out.chuteLit += cl;
    for (let i = 0, m = 2 + Math.floor(r(0, 2)); i < m; i++) { const y = p.y + p.hgt * lerp(capDepth, depth, r(0.15, 1)), w = p.hgt * 0.55; out.bands += `<path d="M${f(p.x - w)},${f(y - w * 0.13)} L${f(p.x + w)},${f(y + w * 0.13)}" stroke-width="${f(r(1, 2) * k)}"/>`; }
  }
  return out;
}

export function highcountry({ pal = 'gold', id = 'high' } = {}){
  L.usePalette(pal); L.begin(); L.reseed(47); L.setSun({ x: -260, y: 250, r: 0 }); L.setWater(520);
  const P = L.P, W = 1200, H = 720, o = [], night = pal === 'night';
  const snow = night ? '#3E5670' : '#FFF6E6', snowLit = night ? '#5C7B98' : '#FFFFFF', snowSh = night ? '#1C2E44' : mix(P.farShade, '#FFF6E6', 0.6), snowDeep = night ? '#111E30' : mix(P.farShade, '#FFF6E6', 0.4);
  const rockD = night ? '#0A1422' : mix(P.farShade, P.midShade, 0.6), rockL = night ? '#1B2E44' : mix(P.midLit, P.farLit, 0.3), rockBand = mix(rockD, snow, 0.5);
  // the rock used to be drawn from the scene's shared random sequence; stepping past the numbers it took, at the two
  // places it took them, keeps the ridge, firs and boulders drawn afterwards exactly where they were
  const SPENT = night ? [373, 111] : [356, 111];
  // rock, its ledge lines and its couloirs. litSnow and shadeSnow are the snow tones on the two faces; glow is whatever is
  // washed over the snow afterwards, repeated over the couloirs so they match the snow around them
  const rockLayer = (rk, cid, litSnow, shadeSnow, glow = '') => `<g clip-path="url(#${cid})"><path d="${rk.lit}" fill="${rockL}"/><path d="${rk.dark}" fill="${rockD}"/><g clip-path="url(#${clip(rk.lit + rk.dark)})"><g stroke="${rockBand}" fill="none" opacity="0.5">${rk.bands}</g><path d="${rk.chuteLit}" fill="${litSnow}"/><path d="${rk.chuteDark}" fill="${shadeSnow}"/>${glow ? `<g clip-path="url(#${clip(rk.chuteLit + rk.chuteDark)})">${glow}</g>` : ''}</g></g>`;
  const C = night ? { rim: '#4E6A86', rimSh: '#263A52', wall: '#3A546E', deep: '#0B1626', floor: '#060D18', cast: '#0C1626' } : { rim: '#FFFFFF', rimSh: mix(P.farShade, '#FFF6E6', 0.5), wall: mix('#FFF6E6', P.peach, 0.16), deep: mix(P.farShade, '#FFF6E6', 0.16), floor: mix(P.farShade, P.plumDeep, 0.45), cast: snowSh };
  const snowMid = mix(snow, snowSh, 0.5), firTone = mix(P.tealDeep, P.ink, 0.3);
  // colours handed to the winter kit: trees and snags, boulders
  const TC = { fol: firTone, snow: snowLit, shade: night ? mix(snowSh, snowLit, 0.36) : mix(snowSh, '#FFFFFF', 0.25), trunk: mix(P.plumDeep, P.ink, 0.5), ground: snow, wood: night ? '#40546A' : mix(P.haze, P.cream, 0.45), woodSh: night ? '#141E2C' : mix(P.haze, P.plumDeep, 0.4) };
  const TCfar = { ...TC, fol: mix(firTone, mix(P.farShade, snow, 0.5), 0.2) };
  const BC = { rock: P.plumDeep, rockLit: night ? '#1E2C40' : mix(P.plumDeep, P.haze, 0.5), snow: snowLit, shade: TC.shade, ground: snow };
  const tarnShade = night ? '#152B42' : mix(mix(P.tealLight, '#FFFFFF', 0.46), P.farShade, 0.34);
  const slope = curveFn([[0, 520], [180, 506], [380, 470], [560, 430], [760, 392], [940, 372], [1200, 344]]);
  const bench = curveFn([[0, 540], [200, 532], [380, 520], [520, 505], [640, 484], [740, 466], [820, 459], [900, 455], [1005, 442], [1085, 434], [1200, 422]]);
  const roll = curveFn([[0, 600], [300, 598], [520, 612], [760, 600], [1000, 560], [1200, 528]]);
  // the picture is put out in named parts, so that the cost of drawing each can be measured
  let open = false; const part = name => { o.push(`${open ? '</g>' : ''}<g data-part="${name}">`); open = true; };
  part('sky');
  // ---- sky
  o.push(`<rect x="0" y="-50" width="${W}" height="620" fill="url(#${linGrad(0, 0, 0, 520, [[0, P.skyTop], [0.4, P.skyMid], [0.8, P.skyLow], [1, P.skyHorizon]])})"/>`);
  o.push(grain(0, -50, W, 320, GL(0, 0, 0, 270, [[0, 0.4], [0.5, 0.14], [1, 0]]), P.grainSky));
  if (!night) {
    o.push(`<circle cx="40" cy="330" r="560" fill="url(#${radGrad(40, 330, 560, [[0, P.sun, 0.75], [0.4, P.cream, 0.3], [1, P.cream, 0]])})"/>`);
    o.push(grain(0, 40, 640, 480, GR(40, 330, 620, [[0, 0.3], [0.5, 0.14], [1, 0]]), P.sun));
    o.push(L.cloud(760, 84, 0.8, [[0, 0, 200, 22], [44, 17, 290, 26], [-20, 37, 170, 20]]) + L.cloud(330, 150, 0.6, [[0, 0, 170, 20], [-24, 15, 240, 24]]) + L.cloud(1040, 176, 0.5, [[0, 0, 180, 20], [30, 15, 230, 22]]));
  } else {
    let st = '';
    for (let k = 0; k < 620; k++) { const x = rnd(0, W), y = rnd(-40, 470), r = rnd() < 0.06 ? rnd(1.6, 2.4) : rnd(0.5, 1.3); st += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" opacity="${f(rnd(0.35, 1))}"/>`; }
    o.push(grain(0, -50, W, 560, GL(240, 520, 620, -40, [[0, 0], [0.32, 0.05], [0.5, 0.34], [0.68, 0.05], [1, 0]]), '#9FB4C6', { opacity: 0.9 }));
    o.push(`<g fill="${P.sun}">${st}</g>`);
    for (const [x, y, r] of [[212, 96, 7], [640, 58, 6], [1010, 150, 8], [468, 210, 5]]) o.push(`<path d="M${x},${y - r} L${x + r * 0.2},${y - r * 0.2} L${x + r},${y} L${x + r * 0.2},${y + r * 0.2} L${x},${y + r} L${x - r * 0.2},${y + r * 0.2} L${x - r},${y} L${x - r * 0.2},${y - r * 0.2}Z" fill="${P.sun}"/>`);
    // the moon: a few days short of full (it is full over the lodge dock at the end of the page)
    o.push(`<g transform="translate(1040,92) rotate(-28)"><path d="M0,-17 A17,17 0 0,1 0,17 A11.6,17 0 0,1 0,-17Z" fill="${P.sun}" opacity="0.92"/><path d="M2,-9 q5,-3 8,1 q1,5 -4,6 q-5,0 -4,-7Z M-3,3 q4,-2 6,1 q0,4 -4,4 q-3,-1 -2,-5Z" fill="${mix(P.sun, P.skyLow, 0.3)}" opacity="0.5"/></g>`);
  }
  part('peaks');
  // ---- a pale range far behind, then the main peaks
  o.push(`<path d="${poly([[-20, 560], [-20, 372], [90, 330], [200, 300], [300, 344], [440, 296], [530, 336], [650, 276], [740, 316], [900, 246], [1010, 300], [1110, 262], [1220, 312], [1220, 560]])}" fill="${mix(P.farLit, P.skyLow, night ? 0.4 : 0.62)}"/>`);
  const pk = [[-20, 420], [60, 350], [130, 300], [190, 330], [270, 214], [340, 280], [400, 250], [470, 310], [560, 196], [640, 270], [700, 240], [790, 150], [860, 230], [930, 204], [1010, 282], [1090, 230], [1160, 290], [1220, 260]];
  const r = L.range(pk, { baseY: 560, lit: snow, shadeColor: night ? '#060D18' : P.farShade, shadeOpacity: night ? 0.55 : 0.36, amp: 6, seg: 26, ridgeZig: 14 });
  o.push(r.svg);
  const shadeTone = night ? '#060D18' : P.farShade, glow = night ? '' : `<rect x="0" y="140" width="${W}" height="260" fill="url(#${linGrad(0, 150, 0, 400, [[0, P.peach, 0.42], [1, P.peach, 0]])})"/>`;
  if (glow) o.push(`<g clip-path="url(#${r.cid})">${glow}</g>`);
  const relief = (rg, seed, k, op, litSnow) => { const rb = ribs(rg.peaks, seed, k); return `<g clip-path="url(#${rg.cid})"><path d="${rb.cut}" fill="${shadeTone}" fill-opacity="${f(op * 0.5)}"/><path d="${rb.deep}" fill="${shadeTone}" fill-opacity="${f(op * 0.55)}"/><path d="${rb.lift}" fill="${litSnow}" fill-opacity="${night ? 0.16 : 0.3}"/><path d="${rb.fluteLit}" fill="none" stroke="${shadeTone}" stroke-opacity="${f(op * 0.62)}" stroke-width="${f(1.2 * k)}" stroke-linecap="round"/><path d="${rb.fluteSh}" fill="none" stroke="${litSnow}" stroke-opacity="${night ? 0.14 : 0.3}" stroke-width="${f(1.2 * k)}" stroke-linecap="round"/></g>` + grain(0, 120, W, 440, GL(0, 150, 0, 540, [[0, 0.4], [0.5, 0.18], [1, 0.02]]), shadeTone, { clipId: clip(rg.shadeD), seed: 9600 + seed, opacity: night ? 0.4 : 0.3 }) + `<path d="${rb.rim}" fill="none" stroke="${snowLit}" stroke-width="${f(1.7 * k)}" stroke-linejoin="round" stroke-linecap="round"/>`; };
  o.push(relief(r, 5, 1, night ? 0.55 : 0.36, snow));
  o.push(rockLayer(rocks(r.peaks, 1, 211), r.cid, snow, mix(snow, shadeTone, night ? 0.55 : 0.36), glow)); L.skip(SPENT[0]);
  o.push(`<rect x="0" y="360" width="${W}" height="200" fill="url(#${linGrad(0, 380, 0, 560, [[0, P.cream, 0], [1, P.cream, night ? 0.12 : 0.62]])})" clip-path="url(#${r.cid})"/>`);
  // ---- a nearer ridge on the left
  const r2 = L.range([[-20, 470], [70, 424], [150, 452], [236, 398], [320, 440], [404, 418], [480, 462], [600, 486]], { baseY: 560, lit: mix(snow, snowSh, 0.2), shadeColor: night ? '#060D18' : P.farShade, shadeOpacity: night ? 0.5 : 0.3, amp: 4, seg: 24, ridgeZig: 8 });
  const nearSnow = mix(snow, snowSh, 0.2);
  o.push(r2.svg + relief(r2, 9, 0.7, night ? 0.5 : 0.3, nearSnow) + rockLayer(rocks(r2.peaks, 0.7, 223), r2.cid, nearSnow, mix(nearSnow, shadeTone, night ? 0.5 : 0.3))); L.skip(SPENT[1]);
  o.push(`<rect x="0" y="440" width="620" height="120" fill="url(#${linGrad(0, 450, 0, 540, [[0, P.cream, 0], [1, P.cream, night ? 0.1 : 0.5]])})" clip-path="url(#${r2.cid})"/>`);
  part('slope');
  // ---- a belt of forest down in the valley beyond the lip of the snowfield: only the tops show over it
  {
    const wr = source(91), far = mix(firTone, mix(P.farShade, snow, 0.5), 0.62), near = mix(firTone, mix(P.farShade, snow, 0.5), 0.36);
    let a = '', b = '';
    for (let x = -12; x < 470; x += wr(4, 8)) { if (wr() > 1.25 - x / 520) continue; const y = slope(x) + 6, h = wr(9, 17) * (1 - x / 1100); a += `M${f(x - h * 0.27)},${f(y)} L${f(x + wr(-0.6, 0.6))},${f(y - h)} L${f(x + h * 0.27)},${f(y)}Z `; }
    for (let x = -12; x < 400; x += wr(5, 10)) { if (wr() > 1.15 - x / 420) continue; const y = slope(x) + 6, h = wr(6, 11) * (1 - x / 1000); b += `M${f(x - h * 0.3)},${f(y)} L${f(x + wr(-0.6, 0.6))},${f(y - h)} L${f(x + h * 0.3)},${f(y)}Z `; }
    o.push(`<path d="${a}" fill="${far}"/><path d="${b}" fill="${near}"/>`);
  }
  // ---- the snowfield. It rises to the pass on the right, so it faces the low sun and is lit. It is drawn as three
  // rolls of ground, one behind another: the slope up to the pass, the bench the hut stands on, and a nearer swell.
  // Each roll has a bright lip where it catches the light, and the ground behind it darkens as it drops out of sight
  // behind that lip. That is what makes the ground read as rolling instead of flat.
  const under = fn => { const p = [[0, H + 60]]; for (let x = 0; x <= W; x += 12) p.push([x, fn(x)]); p.push([W, H + 60]); return poly(p); };
  const sd = under(slope), sc = clip(sd), bId = L.shared(under(bench)), bc = L.clipTo(bId), rId = L.shared(under(roll)), rc = L.clipTo(rId);
  const fbank = curveFn([[0, 668], [200, 690], [460, 722], [760, 722], [1000, 692], [1200, 660]]), fId = L.shared(under(fbank)), fc = L.clipTo(fId);
  const lip = (idd, tone, drop = 4) => `<use href="#${idd}" fill="${snowLit}"/><use href="#${idd}" fill="${tone}" transform="translate(0,${drop})"/>`;
  // the ground darkening as it dips behind the next roll: a band of shade lying along that roll's lip and fading
  // upward. It is laid in strips, each with its own gradient square to the lip, so the fade follows the curve.
  const dip = (fn, clipId, depth = 46, a = 0.36) => {
    let s = ''; const step = 50, base = linGrad(0, 0, 0, 1, [[0, snowSh, 0], [0.4, snowSh, f(a * 0.16)], [0.75, snowSh, f(a * 0.52)], [1, snowSh, a]]);
    for (let x = 0; x < W; x += step) {
      const xm = x + step / 2, y0 = fn(x), y1 = fn(x + step), ym = fn(xm), sl = (y1 - y0) / step, nl = Math.hypot(sl, 1), nx = -sl / nl, ny = 1 / nl, g = L.nid('lg');
      L.defs.push(`<linearGradient id="${g}" href="#${base}" x1="${f(xm - nx * depth)}" y1="${f(ym - ny * depth)}" x2="${xm}" y2="${f(ym)}"/>`);
      s += `<path d="M${x},${f(y0 + 3)} L${x + step},${f(y1 + 3)} L${x + step},${f(y1 - depth - 16)} L${x},${f(y0 - depth - 16)}Z" fill="url(#${g})"/>`;
    }
    return `<g clip-path="url(#${clipId})" shape-rendering="crispEdges">${s}</g>`;
  };
  // a shadow lies along the ground to the right of whatever throws it, and a little toward us
  const SH = [1.3, 0.19];
  const unitAt = y => (y - 250) / 330;                                  // how big things are drawn at that depth (1 where the walkers stand, roughly)
  // the line the prints follow, so that nothing else is put on it
  const printX = y => 1212 - (y - 372) / 0.405;

  // --- the slope up to the pass
  o.push(`<path d="${sd}" fill="${snowLit}"/><path d="${sd}" fill="${snow}" transform="translate(0,5)"/>`);
  if (!night) o.push(`<rect x="0" y="340" width="${W}" height="440" fill="url(#${linGrad(300, 0, 1200, 0, [[0, P.peach, 0], [1, P.peach, 0.2]])})" clip-path="url(#${sc})"/>`);
  {
    // long wind-packed streaks lying along the slope, a few small firs at the edge of the trees, and the track on to the pass
    const wr = source(17); let lit = '', shd = '';
    for (let k = 0; k < 16; k++) {
      const x = wr(40, 1150), y = lerp(slope(x) + 9, bench(x) - 8, wr(0.05, 0.9)), len = wr(26, 70) * (0.6 + x / 1700), dy = (slope(x + len) - slope(x)) * 0.9, h = wr(1.6, 3.2);
      if (Math.abs(x + len / 2 - printX(y)) < 40 || (x + len > 570 && x < 960)) continue;
      lit += `M${f(x)},${f(y)} Q${f(x + len * 0.5)},${f(y + dy * 0.5 - h)} ${f(x + len)},${f(y + dy)} Q${f(x + len * 0.5)},${f(y + dy * 0.5 - h * 0.3)} ${f(x)},${f(y)}Z `;
      shd += `M${f(x + len * 0.1)},${f(y + dy * 0.1 + 0.6)} Q${f(x + len * 0.55)},${f(y + dy * 0.55 + h * 0.2)} ${f(x + len)},${f(y + dy + 0.4)} Q${f(x + len * 0.6)},${f(y + dy * 0.6 + h * 1.5)} ${f(x + len * 0.1)},${f(y + dy * 0.1 + 0.6)}Z `;
    }
    o.push(`<g clip-path="url(#${sc})"><path d="${shd}" fill="${snowSh}" fill-opacity="0.5"/><path d="${lit}" fill="${snowLit}"/></g>`);
    o.push(dip(bench, sc, 40, 0.34));
    const farTrees = [[462, 489, 15, 1], [480, 484, 11, 2], [530, 473, 13, 3], [553, 467, 9, 4]];
    o.push(`<path d="${farTrees.map(([x, y, h]) => spireShadow(x, y, h, h * 0.36, SH)).join(' ')} ${[[1008, 430, 0.56], [1092, 376, 0.46]].map(([x, y, s]) => `M${x},${f(y - 1.2 * s)} L${f(x + 62 * s)},${f(y + 8 * s)} L${f(x + 62 * s)},${f(y + 10.6 * s)} L${x},${f(y + 1.6 * s)}Z`).join(' ')}" fill="${snowSh}"/>`);
    o.push(farTrees.map(([x, y, h, seed]) => snowTree(x, y, h, TCfar, { seed, tiers: 3, w: h * 0.2 })).join(''));
    o.push(`<path d="M996,443 C1030,424 1070,400 1120,362" fill="none" stroke="${mix(snow, snowSh, 0.5)}" stroke-width="2" stroke-linecap="round" stroke-dasharray="5 1.6"/><path d="M996.8,444.4 C1030.8,425.4 1070.8,401.4 1120.8,363.4" fill="none" stroke="${snowLit}" stroke-width="0.8" stroke-linecap="round"/>`);
  }
  part('bench');
  // --- the bench
  o.push(lip(bId, snow));
  if (!night) o.push(`<rect x="0" y="400" width="${W}" height="380" fill="url(#${linGrad(300, 0, 1200, 0, [[0, P.peach, 0], [1, P.peach, 0.14]])})" clip-path="url(#${bc})"/>`);
  o.push(dip(roll, bc, 54, 0.36));
  // every shadow on a roll is one flat tone in one group, so where two overlap they do not darken twice
  const S1 = [], S2 = [], B1 = [], B2 = [];
  const MC = { lit: snowLit };
  const drift = (S, B, x, y, w, ht) => { const m = mound(x, y, w, ht, MC); S.push(`<path d="${m.shadow}"/>`); B.push(m.body); };
  drift(S1, B1, 962, 541, 40, 13);
  drift(S2, B2, 236, 633, 40, 13); drift(S2, B2, 690, 663, 58, 19); drift(S2, B2, 852, 635, 44, 14); drift(S2, B2, 806, 695, 50, 16);

  // --- the tarn. It lies in a hollow, so its ice sits lower than the snow around it: the far bank shows as a low
  // wall above the ice, shaded at the end the sun cannot reach and bright at the end that faces it, and the near
  // bank cuts across the near edge of the ice and hides it. The bank on the sunward side lays its shadow on the ice.
  let tarn;
  {
    const cx = 250, cy = 566, rx = 152, ry = 19.5, n = 28, rim = [], tr = source(77);
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, wob = 1 + 0.05 * Math.sin(3 * a + 0.6) + 0.035 * Math.sin(5 * a + 2.1) + tr(-0.012, 0.012); rim.push([cx + Math.cos(a) * rx * wob, cy + Math.sin(a) * ry * wob * (Math.sin(a) > 0 ? 1 : 0.92)]); }
    const rimD = smooth(rim), rimC = clip(rimD), drop = 6.5, ice = rim.map(([x, y]) => [cx + (x - cx) * 0.957, cy + (y - cy) * 0.96 + drop]), iceD = smooth(ice), iceC = clip(iceD);
    const iceFar = night ? '#2F5674' : mix(mix(P.tealLight, '#FFFFFF', 0.74), P.peach, 0.14), iceNear = night ? '#1C3A56' : mix(P.tealLight, '#FFFFFF', 0.46), iceDark = night ? '#12283E' : mix(P.teal, '#FFFFFF', 0.36), iceSh = night ? '#152B42' : mix(mix(P.tealLight, '#FFFFFF', 0.46), P.farShade, 0.34);
    const wall = `url(#${linGrad(98, 0, 402, 0, [[0, snowSh], [0.16, snowSh], [0.34, snowMid], [0.7, mix(snow, snowMid, 0.4)], [0.9, snowLit], [1, snowLit]])})`;
    // cracks: each a line of pale ice with a thin dark line beside it where the crack goes down into the ice
    const crack = (pts, n = 4) => { let d = ''; pts.forEach(([x, y], i) => { if (!i) { d += `M${f(x)},${f(y)}`; return; } const [x0, y0] = pts[i - 1]; for (let k = 1; k <= n; k++) { const t = k / n, e = k === n ? 0 : 1; d += ` L${f(lerp(x0, x, t) + e * tr(-2.2, 2.2))},${f(lerp(y0, y, t) + e * tr(-0.8, 0.8))}`; } }); return d + ' '; };
    const cr = crack([[150, 561], [198, 565], [246, 571], [292, 573.5], [336, 579], [374, 583]]) + crack([[246, 571], [262, 578], [270, 588]], 3) + crack([[292, 573.5], [312, 567], [330, 560.5]], 3) + crack([[198, 565], [186, 573], [180, 584]], 3);
    const hair = crack([[336, 579], [352, 572], [372, 569]], 3) + crack([[214, 558], [232, 562], [246, 571]], 3) + crack([[262, 578], [240, 581], [222, 587]], 3) + crack([[312, 567], [300, 562], [296, 557]], 2);
    const patch = (x, y, w, h) => `M${f(x - w / 2)},${f(y)} Q${f(x - w * 0.1)},${f(y - h * 1.5)} ${f(x + w / 2)},${f(y - h * 0.2)} Q${f(x + w * 0.1)},${f(y + h * 1.3)} ${f(x - w / 2)},${f(y)}Z `;
    let s = `<g clip-path="url(#${rimC})"><path d="${rimD}" fill="${wall}"/><path d="${iceD}" fill="url(#${linGrad(0, 554, 0, 590, [[0, iceFar], [1, iceNear]])})"/><g clip-path="url(#${iceC})">`;
    s += `<path d="${smooth([[196, 566], [226, 571], [262, 577], [300, 575.5], [322, 571.5], [300, 568], [258, 569], [222, 565.5]])}" fill="${iceDark}" fill-opacity="0.6"/>`;
    s += `<path d="${smooth([[98, 552], [146, 552], [170, 558], [158, 572], [150, 594], [96, 594]])}" fill="${iceSh}"/>`;
    s += '<!--shadows-->';
    s += `<path d="${patch(304, 586, 96, 4.4)}${patch(180, 590, 70, 3.4)}${patch(356, 562.5, 54, 2.6)}${patch(232, 559.5, 62, 2.4)}${patch(140, 580, 30, 2.2)}${patch(330, 579, 34, 2)}" fill="${night ? snow : mix(snow, '#FFFFFF', 0.4)}" fill-opacity="0.92"/>`;
    s += `<path d="${hair}" fill="none" stroke="${night ? '#7C9BB6' : '#FFFFFF'}" stroke-width="0.6" stroke-linejoin="round" stroke-opacity="0.6"/><path d="${cr}" fill="none" stroke="${iceDark}" stroke-width="0.9" stroke-opacity="0.7" transform="translate(0.7,1)"/><path d="${cr}" fill="none" stroke="${night ? '#7C9BB6' : '#FFFFFF'}" stroke-width="0.9" stroke-linejoin="round" stroke-opacity="0.9"/>`;
    s += `<g fill="${night ? '#7C9BB6' : '#FFFFFF'}" fill-opacity="0.8">${[[236, 572.6, 1], [252, 574.4, 0.8], [270, 573, 1.1], [284, 574.6, 0.7], [246, 570.6, 0.6]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>`;
    s += `<path d="${iceD}" fill="none" stroke="${night ? '#6A8CA8' : '#FFFFFF'}" stroke-width="3" stroke-opacity="0.75"/><path d="M${ice.slice(15, 28).map(([x, y]) => `${f(x)},${f(y + 0.9)}`).join(' L')}" fill="none" stroke="${iceSh}" stroke-width="1.1" stroke-opacity="0.8"/>`;
    s += `</g></g>`;
    // the lip of the near bank, catching the light
    s += `<path d="M${rim.slice(1, 14).map(([x, y]) => `${f(x)},${f(y + 0.4)}`).join(' L')}" fill="none" stroke="${snowLit}" stroke-width="1.8" stroke-linecap="round"/>`;
    // dead sedge standing out of the snow at the water's edge
    const reeds = (x, y, k) => { let d = ''; for (let i = 0; i < k; i++) { const bx = x + tr(-7, 7), h = tr(5, 12), lean = tr(-2.6, 3.4); d += `M${f(bx)},${f(y + tr(-1, 1))} q${f(lean * 0.3)},${f(-h * 0.6)} ${f(lean)},${f(-h)} `; } return d; };
    s += `<path d="${reeds(382, 556, 6)}${reeds(118, 557, 5)}${reeds(302, 549.5, 4)}" fill="none" stroke="${night ? '#22344A' : mix(P.haze, P.peach, 0.3)}" stroke-width="1" stroke-linecap="round"/>`;
    tarn = s + boulder(118, 583, 36, 13, BC, { seed: 3 }) + boulder(398, 574, 26, 10, BC, { seed: 4 });
    S1.push(`<path d="M106,583 L142,580 L176,586 L150,590Z M388,574 L416,572 L438,577 L414,580Z"/>`);
  }
  // --- the trodden track up from the trees to the hut door: a shallow trench of packed snow. We look along it more
  // than across it, so what shows is the far wall as a thin shaded band, the packed floor a shade darker than the
  // snow around it, a bright lip along the near edge, and the line of prints down the middle.
  const dense = (pts, n = 8) => { const out = [], at = i => pts[Math.max(0, Math.min(pts.length - 1, i))]; for (let i = 0; i < pts.length - 1; i++) for (let k = 0; k < n; k++) { const t = k / n, a = at(i - 1), b = at(i), c = at(i + 1), e = at(i + 2); out.push([0, 1, 2].map(j => 0.5 * (2 * b[j] + (c[j] - a[j]) * t + (2 * a[j] - 5 * b[j] + 4 * c[j] - e[j]) * t * t + (3 * b[j] - 3 * c[j] + e[j] - a[j]) * t * t * t))); } out.push(pts[pts.length - 1]); return out; };
  const track = line => {
    const pts = dense(line, 6), tr2 = source(41), up = [], dn = [], edge = []; let pr = '', dist = 0, nextP = 0;
    for (let i = 1; i < pts.length; i++) {
      const q = pts[i], p0 = pts[i - 1], dx = q[0] - p0[0], dy = q[1] - p0[1], l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, w = q[2], ka = 0.3 + tr2(-0.06, 0.07), kb = 0.3 + tr2(-0.06, 0.07); dist += l;
      up.push([q[0] + uy * w * ka, q[1] - ux * w * ka * 0.46]); dn.push([q[0] - uy * w * kb, q[1] + ux * w * kb * 0.46]); edge.push([q[0] - uy * w * 0.3, q[1] + ux * w * 0.3 * 0.46 + w * 0.1]);
      // the heel of each print, as a short curved mark on the side the sun comes from
      if (w > 7 && dist >= nextP) { const k = (Math.round(dist / (w * 0.55)) % 2 ? 1 : -1) * 0.16, px = q[0] - uy * w * k, py = q[1] + ux * w * k * 0.46, r2 = w * 0.17; pr += `M${f(px - ux * r2 * 0.4)},${f(py - r2 * 0.42)}q${f(-r2 * 0.9)},${f(r2 * 0.4)} ${f(ux * r2 * 0.3)},${f(r2 * 0.84)}`; nextP = dist + w * 0.55; }
    }
    return `<path d="M${edge.map(q => `${f(q[0])},${f(q[1])}`).join(' L')}" fill="none" stroke="${snowLit}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="${poly([...up, ...dn.reverse()])}" fill="${mix(snow, snowSh, 0.5)}" stroke="${mix(snow, snowSh, 0.5)}" stroke-width="1" stroke-linejoin="round"/><path d="${pr}" fill="none" stroke="${snowSh}" stroke-width="1" stroke-linecap="round"/>`;
  };
  const T1 = [[428, 612, 15.5], [462, 594, 14], [500, 577, 12.4], [540, 560, 11], [620, 532, 9], [700, 506, 7.4], [770, 487, 6.2], [808, 480, 5.6]];
  const T2 = [[60, 742, 30], [150, 708, 27], [250, 672, 23], [340, 640, 19.5], [405, 614, 17], [434, 602, 15.5]];
  const onTrack = (x, y, pad) => [...T1, ...T2].some((q, i, a) => { const b = a[i + 1]; if (!b || b[0] < q[0]) return false; if (x < q[0] - pad || x > b[0] + pad) return false; const t = Math.max(0, Math.min(1, (x - q[0]) / (b[0] - q[0]))); return Math.abs(y - lerp(q[1], b[1], t)) < pad * 0.6 + q[2] * 0.4; });
  // --- wind-carved ripples: short bright crests, each with a sliver of shade under its lee side
  const ripples = (seed, n, top, bottom, x0 = 190, x1 = 1040) => {
    const wr = source(seed); let lit = '', shd = '';
    for (let k = 0; k < n; k++) {
      const x = wr(x0, x1), y = lerp(top(x) + 12, bottom(x) - 10, wr()), u = unitAt(y), len = wr(12, 30) * u, h = wr(1.4, 2.6) * u;
      if (Math.abs(x - printX(y)) < 46 * u || onTrack(x + len / 2, y, 26) || (x > 80 && x < 420 && y > 540 && y < 594) || (x > 690 && x < 1080 && y < 528) || (x > 560 && x < 700 && y < 560)) continue;
      lit += `M${f(x)},${f(y)} Q${f(x + len * 0.45)},${f(y - h * 1.5)} ${f(x + len)},${f(y + h * 0.2)} Q${f(x + len * 0.45)},${f(y - h * 0.5)} ${f(x)},${f(y)}Z `;
      shd += `M${f(x + len * 0.25)},${f(y - h * 0.5)} Q${f(x + len * 0.6)},${f(y - h * 0.5)} ${f(x + len * 1.05)},${f(y + h * 0.3)} Q${f(x + len * 0.7)},${f(y + h * 1.2)} ${f(x + len * 0.25)},${f(y - h * 0.5)}Z `;
    }
    return `<path d="${shd}" fill="${snowSh}" fill-opacity="0.6"/><path d="${lit}" fill="${snowLit}"/>`;
  };
  // --- trees at the edge of the trees: a stand on the far bank of the tarn, a few more beside it
  const stand = [[164, 542, 58, 'snag', { seed: 3 }], [206, 540, 54, 'tree', { seed: 22, tiers: 3 }], [184, 545, 78, 'tree', { seed: 21 }], [252, 541, 40, 'tree', { seed: 24, tiers: 3, w: 9 }], [228, 546, 92, 'tree', { seed: 23, w: 16, taper: 0.95 }], [274, 546, 22, 'tree', { seed: 25, tiers: 2, bury: 0.3, load: 1.3 }],
    [452, 556, 52, 'snag', { seed: 5, lean: -0.05 }], [430, 554, 64, 'tree', { seed: 26, w: 12 }], [412, 558, 24, 'tree', { seed: 27, tiers: 2, bury: 0.3, load: 1.4 }]];
  const draw = ([x, y, h, kind, opt], C2) => kind === 'snag' ? snag(x, y, h, C2, opt) : kind === 'ghost' ? snowGhost(x, y, h, C2, opt) : snowTree(x, y, h, C2, opt);
  const shadowOf = ([x, y, h, kind, opt]) => kind === 'snag' ? `M${x - 1.5},${y - 0.6} L${f(x + SH[0] * h)},${f(y + SH[1] * h - 0.6)} L${f(x + SH[0] * h)},${f(y + SH[1] * h + 1)} L${x - 1.5},${y + 1.6}Z` : spireShadow(x, y, h * (opt.bury ? 0.8 : 1), (opt.w || h * 0.15) * 2, SH);
  const standShadows = stand.map(shadowOf).join(' ');
  S1.push(`<path d="${standShadows}"/>`);
  // the shadows of that stand carry on across the ice, a little lower, because the ice lies lower
  tarn = tarn.replace('<!--shadows-->', `<path d="${stand.slice(0, 6).map(shadowOf).join(' ')}" transform="translate(7,6.5)" fill="${tarnShade}" fill-opacity="0.85"/>`);
  // --- marker poles along the route
  const marker = (x, y, s) => `<g transform="translate(${x},${y}) scale(${s})"><rect x="-1.7" y="-48" width="3.4" height="49" fill="${P.plumDeep}"/><path d="M1.7,-48 L17,-43 L1.7,-37Z" fill="${P.coral}"/><path d="M1.7,-42.5 L17,-43 L1.7,-37Z" fill="${P.coralSh}"/><path d="M-6,1.4 Q0,-3.4 6.4,1.4Z" fill="${snowLit}"/></g>`;
  const markerShadow = (x, y, s) => `<path d="M${x},${f(y - 1.4 * s)} L${f(x + 62 * s)},${f(y + 8 * s)} L${f(x + 62 * s)},${f(y + 11 * s)} L${x},${f(y + 2 * s)}Z"/>`;
  S1.push(markerShadow(470, 580, 1)); S2.push(markerShadow(322, 634, 1.2));
  // ---- the hut, with a woodpile under a lean-to on its right
  const hx = 800, hy = 474, hs = 1.45;
  S1.push(`<path d="M${hx - 60},${hy + 6} L${hx + 86},${hy + 3} L${hx + 206},${hy + 20} L${hx + 268},${hy + 42} L${hx + 206},${hy + 48} L${hx + 84},${hy + 26}Z"/>`);
  let hut;
  {
    const wg = `url(#${linGrad(0, -37, 0, -19, [[0, P.windowHot], [1, P.window]])})`, log = mix(P.plum, P.haze, 0.22), logSh = P.plumDeep, stone = mix(P.haze, P.plumDeep, 0.45), door = mix(P.plum, P.coralSh, 0.45), endg = night ? '#6C7C88' : mix(P.peach, P.cream, 0.45);
    // the woodpile: rounds stacked in staggered rows, with smaller ones tucked in at the ends and a split piece on
    // top. Each end is pale wood inside a thin ring of bark, with two faint growth rings and a short crack in from the rim.
    // Nothing dark sits in the middle, so they read as cut wood.
    const wr = source(31), bark = mix(logSh, P.haze, 0.32), ringTone = mix(endg, logSh, 0.24);
    const round = (cx, cy, rr) => { const a = wr(0, 6.28), g = mix(endg, P.peach, wr(0, 0.34)), ox = wr(-0.3, 0.3), oy = wr(-0.3, 0.3);
      return `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rr)}" fill="${bark}"/><circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rr - 0.75)}" fill="${g}"/>`
        + `<g fill="none" stroke="${ringTone}" stroke-width="0.4"><circle cx="${f(cx + ox)}" cy="${f(cy + oy)}" r="${f(rr * 0.56)}" opacity="0.8"/><circle cx="${f(cx + ox * 1.6)}" cy="${f(cy + oy * 1.6)}" r="${f(rr * 0.27)}" opacity="0.6"/>`
        + `<path d="M${f(cx + Math.cos(a) * rr * 0.5)},${f(cy + Math.sin(a) * rr * 0.5)} L${f(cx + Math.cos(a) * (rr - 0.8))},${f(cy + Math.sin(a) * (rr - 0.8))}" stroke-linecap="round"/></g>`; };
    // the dark back of the shelter runs on behind the posts and up under the roof, so no sliver of snow shows at its edges
    const backing = `<path d="M61.4,2 L61.4,-33 L99.4,-27.2 L99.4,2Z" fill="${mix(logSh, P.haze, 0.12)}"/>`;
    let logs = '';
    for (const x of [67.2, 75.6, 84, 92.4]) logs += round(x + wr(-0.3, 0.3), -3.9, wr(3.7, 4.1));
    logs += round(65.2, -9.7, 2.2) + round(95.1, -9.9, 2.7);
    for (const x of [71.4, 79.8, 88.2]) logs += round(x + wr(-0.3, 0.3), -10.9, wr(3.7, 4.1));
    const third = [];
    for (const x of [67.2, 75.6, 84, 92.4]) { const jx = x + wr(-0.3, 0.3), rr = wr(3.6, 4); third.push([jx, rr]); logs += round(jx, -17.9, rr); }
    // the top course sits in the hollows of the row beneath it: each piece is lowered until it just touches both
    // neighbours, so nothing floats and nothing cuts into anything
    const seat = (i, x, rr) => Math.min(...[third[i], third[i + 1]].map(([nx, nr]) => -17.9 - Math.sqrt(Math.max(0, (nr + rr + 0.1) ** 2 - (x - nx) ** 2))));
    let topLogs = round(71.5, seat(0, 71.5, 3.3), 3.3) + round(79.7, seat(1, 79.7, 3.1), 3.1);
    {
      // one split piece, a quarter of a round, point down in the next hollow with its bark on the curved side
      const [x1, r1] = third[2], [x2, r2] = third[3], ax = (x1 + x2) / 2 + 0.7071 * (r1 - r2), ay = -17.9 - (1.4142 * (r1 + 0.15) - (ax - x1)), R = 5;
      const arc = k => `M${f(ax - R * k * 0.7071)},${f(ay - R * k * 0.7071)} A${f(R * k)},${f(R * k)} 0 0 1 ${f(ax + R * k * 0.7071)},${f(ay - R * k * 0.7071)}`;
      topLogs += `<path d="${arc(1)} L${f(ax)},${f(ay)}Z" fill="${mix(endg, P.peach, 0.2)}"/><path d="${arc(1)}" fill="none" stroke="${bark}" stroke-width="0.9"/><path d="${arc(0.58)}" fill="none" stroke="${ringTone}" stroke-width="0.4" opacity="0.8"/><path d="${arc(0.3)}" fill="none" stroke="${ringTone}" stroke-width="0.4" opacity="0.6"/>`;
    }
    const underRoof = `<path d="M61.4,-33 L99.4,-27.2 L99.4,-19.3 L61.4,-25.1Z" fill="${logSh}" opacity="0.26"/>`;       // shade under the roof
    // ---- the roof, the chimney and the woodpile shelter. By day these never change. In the night picture something
    // comes down on the hut from above, on the side toward the woodpile. At stage 4 the snow has gone off that side
    // of the roof all at once and lies on the shelter and the ground. From stage 5 that side of the roof is pressed
    // in, with the ridge pulled down toward it and snapped timber showing; the chimney is broken off and lying in
    // the snow; and the shelter's roof has been knocked down onto the stack, with logs spilled in front. The other
    // side of the roof, the walls and the snow round the hut are not touched.
    const roofBoard = mix(logSh, '#000000', 0.3), frost = mix(logSh, snowLit, 0.42);
    const gable = `<path d="M-66,-48 L0,-94 L66,-48Z" fill="${logSh}"/><path d="M-22,-62 h44 M-10,-72 h20" stroke="${log}" stroke-width="1.2" opacity="0.7"/>`;
    const eaves = `<path d="M-62,-45 L0,-88 L62,-45 L58,-41 L0,-81 L-58,-41Z" fill="#000" opacity="0.3"/>`;
    const chimney = `<rect x="26" y="-98" width="11" height="26" fill="${logSh}"/><rect x="24" y="-102" width="15" height="5.5" rx="2" fill="${snowLit}"/>`;
    const roofWhole = gable + `<path d="M-74,-45 L0,-100 L74,-45 L62,-45 L0,-88 L-62,-45Z" fill="${snowLit}"/><path d="M0,-100 L74,-45 L62,-45 L0,-88Z" fill="${snowSh}"/>` + eaves
      + `<path d="M-70,-45 l2,9 l2,-9Z M-62,-45 l1.6,6 l1.6,-6Z M66,-45 l2,10 l2,-10Z" fill="${snowLit}"/>` + chimney;
    const shelterRoof = `<path d="M58,-36 L104,-29 L104,-25.5 L58,-32.5Z" fill="${logSh}"/><path d="M56,-41 L106,-33.5 L106,-29 L56,-36.5Z" fill="${snowLit}"/>`;
    const post60 = `<rect x="60" y="-33" width="2.8" height="36" fill="${logSh}"/>`, post98 = `<rect x="98" y="-28" width="2.8" height="31" fill="${logSh}"/>`;
    let roofPart = roofWhole, shelter = backing + post60 + post98 + logs + topLogs + underRoof + shelterRoof;
    if (night) {
      // the snow still on the untouched side, broken off ragged at the ridge, and the two icicles under its eave
      const leftSnow = (tx, ty) => `<path d="M-74,-45 L${tx},${ty} L${f(tx + 4.4)},${f(ty + 3.4)} L${f(tx + 1.4)},${f(ty + 6.6)} L${tx},${f(ty + 12)} L-62,-45Z" fill="${snowLit}"/><path d="M-70,-45 l2,9 l2,-9Z M-62,-45 l1.6,6 l1.6,-6Z" fill="${snowLit}"/>`;
      // a block of the slab that came off the roof: flat-sided, lit on top, in shade on the face turned from the moon
      const chunk = (x, y, w, h, t = 0) => `<g transform="translate(${x},${y}) rotate(${t})"><path d="M${f(-w)},0 L${f(-w * 0.86)},${f(-h * 0.8)} L${f(-w * 0.2)},${f(-h)} L${f(w * 0.62)},${f(-h * 0.86)} L${f(w)},${f(-h * 0.1)} L${f(w * 0.9)},0Z" fill="${snowLit}"/><path d="M${f(w * 0.3)},${f(-h * 0.915)} L${f(w * 0.62)},${f(-h * 0.86)} L${f(w)},${f(-h * 0.1)} L${f(w * 0.9)},0 L${f(w * 0.42)},0Z" fill="${snowSh}"/></g>`;
      // stage 4: the bare roof on that side with frost along its top edge, and the chimney still up
      const swept = gable + `<path d="M0,-96.4 L71,-46.9 L67,-44.6 L0,-91Z" fill="${roofBoard}"/><path d="M0.8,-95.9 L70.4,-47.4" stroke="${frost}" stroke-width="0.7" fill="none"/>` + eaves + leftSnow(0, -100) + chimney;
      // ...and the slab where it landed: broken up on the shelter roof under the eave, the rest gone on down the
      // shelter's slope and off its far end
      const heap = `<path d="M60,-40.4 L62.6,-44.6 L68,-45.4 L71,-48.6 L78,-48.2 L82,-45 L88.6,-44.6 L92,-40 L99,-34.6Z" fill="${snowLit}"/><path d="M78,-48.2 L82,-45 L88.6,-44.6 L92,-40 L99,-34.6 L88,-36.2 L86,-41.2 L80.4,-43Z" fill="${snowSh}"/><path d="M68,-45.4 L70.6,-41 M71,-48.6 L75.6,-43.8 L74.6,-39.4" stroke="${snowSh}" stroke-width="0.6" opacity="0.75" fill="none"/><path d="M66,-39.5 L66.8,-34.8 L70.4,-33.4 L73,-34.6 L74,-38.3Z" fill="${snowLit}"/>`;
      // stage 5: the roof pressed in. It has broken a third of the way down and folded into the hut: the upper piece
      // still hangs from the ridge, the lower piece has dropped at its top end and lies on the corner of the wall.
      // The gable's edge follows them down into the fold...
      const broken = `<path d="M-66,-48 L0,-93 L13.8,-69 L15.4,-63.4 L18.2,-61.6 L19,-57.8 L23.9,-56.6 L57,-48Z" fill="${logSh}"/><path d="M-22,-62 h38 M-10,-72 h20" stroke="${log}" stroke-width="1.2" opacity="0.7"/>`
        // ...the stump of the chimney, snapped off on a slant, standing where it always stood while the roof has gone down round it
        + `<path d="M26,-56 L26,-70.6 L29.4,-72.2 L31.2,-69.2 L34.6,-69.6 L37,-66.4 L37,-54Z" fill="${logSh}"/><path d="M26,-70.6 L29.4,-72.2 L31.2,-69.2 L34.6,-69.6 L37,-66.4" stroke="${frost}" stroke-width="0.7" stroke-linejoin="round" fill="none"/>`
        // ...the two pieces of the roof, frost along the top of each
        + `<path d="M0.6,-96 L17.5,-71.6 L13.8,-69.04 L-3.1,-93.44Z" fill="${roofBoard}"/><path d="M25,-61 L72,-48.9 L70.9,-44.5 L23.9,-56.6Z" fill="${roofBoard}"/><path d="M1.6,-94.6 L17.1,-72.2 M26.4,-60.7 L71.6,-49" stroke="${frost}" stroke-width="0.9" fill="none"/>`
        // ...and the wood where it broke, pale and in long splinters
        + `<path d="M17.5,-71.6 L20.4,-66.2 L17,-68.9 L17.8,-64.6 L15,-67.6 L14.2,-65.4 L13.8,-69.04Z M25,-61 L20.4,-62.9 L23.6,-59.9 L19.6,-59.4 L23.2,-58.2 L21.2,-56.2 L23.9,-56.6Z" fill="${endg}"/>`
        // ...the shade under what is left of the eaves, and the snow on the untouched side
        + `<path d="M-62,-45 L0,-88 L0,-81 L-58,-41Z" fill="#000" opacity="0.3"/><path d="M23.9,-56.6 L56,-48.3 L55,-44.4 L24.6,-52.2Z" fill="#000" opacity="0.3"/>` + leftSnow(1, -98.6);
      roofPart = until(3, roofWhole) + between(4, 4, swept) + from(5, broken);
      // the shelter at stage 5. The chimney came down the roof and through it: the post by the wall is snapped, the
      // roof is down on the stack at that end, and the top course of logs has been pushed out the front
      const shelterDown = `<path d="M56.6,-21.4 L104,-29.8 L104,-26.3 L56.6,-17.9Z" fill="${logSh}"/><path d="M56.8,-21.6 l-2.6,1.2 l2.2,1.2 l-1.8,1.6 l2.2,-0.4Z" fill="${endg}"/><path d="M82,-25.9 L84.6,-30.4 L91,-31.4 L95,-33.4 L101,-32.6 L105.6,-30.1 L104,-29.8Z" fill="${snowLit}"/><path d="M95,-33.4 L101,-32.6 L105.6,-30.1 L104,-29.8 L97,-28.6Z" fill="${snowSh}"/>`;
      shelter = until(4, backing + post60) + from(5, `<path d="M61.4,2 L61.4,-19.8 L99.4,-27.2 L99.4,2Z" fill="${mix(logSh, P.haze, 0.12)}"/><path d="M60,3 L60,-13.8 L61.3,-11 L62.8,-15.2 L62.8,3Z" fill="${logSh}"/>`) + post98 + logs
        + until(4, topLogs + underRoof + shelterRoof) + between(4, 4, heap) + from(5, shelterDown);
      // on the ground: the rest of the slab past the end of the shelter; from stage 5 the snow tipped off the shelter
      // roof with the three logs of the top course in it, and the chimney where it stopped, its own cap of snow beside it
      const lying = (x, y, rot, len) => `<g transform="translate(${x},${y}) rotate(${rot})"><rect x="${-len / 2}" y="-3" width="${len}" height="6" rx="2.6" fill="${bark}"/><ellipse cx="${f(-len / 2 + 1.2)}" cy="0" rx="1.9" ry="2.9" fill="${endg}"/><path d="M${f(-len / 2 + 3.4)},-2.9 H${f(len / 2 - 2.4)}" stroke="${frost}" stroke-width="0.6" fill="none"/></g>`;
      shelter += from(4, chunk(112, 6.4, 8.6, 7.4, -4) + chunk(102.6, 7.6, 5, 4.2, 8) + chunk(122, 8.8, 4.4, 3.4, -10) + chunk(93, 8.4, 3, 2.4, 0))
        + from(5, chunk(67, 6.6, 9, 5.6, 3) + chunk(84.6, 7, 5.4, 3.6, -6)
          + lying(75.6, 5.2, 8, 14) + round(60.6, 5, 3.2)
          + `<path d="M88.6,7.8 L91.2,1.2 A6.6,6.6 0 0 1 95.6,6.6Z" fill="${mix(endg, P.peach, 0.2)}"/><path d="M91.2,1.2 A6.6,6.6 0 0 1 95.6,6.6" fill="none" stroke="${bark}" stroke-width="0.9"/>`
          + `<g transform="translate(139,7.4) rotate(-11)"><path d="M-11,-5.5 H9.4 L11.6,-3.2 L9.4,-0.6 L12,2.4 L9.6,5.5 H-11Z" fill="${logSh}"/><path d="M-10.6,-5.2 H9.2" stroke="${frost}" stroke-width="0.8" fill="none"/></g><path d="M122,13 Q127,9.4 132,10.8 Q138,9.6 143,11.4 Q148,11 152.4,13.2 Q137,17 122,13Z" fill="${snowLit}"/><path d="M143,11.4 Q148,11 152.4,13.2 Q146,15 139.6,15.5 Q144,13.6 143,11.4Z" fill="${snowSh}"/>`
          + chunk(155.6, 9.4, 4.2, 2.6, 4));
    }
    hut = `<rect x="-58" y="-9" width="116" height="12" fill="${stone}"/><path d="M-40,-9 v12 M-14,-9 v12 M12,-9 v12 M38,-9 v12 M-58,-3 h116" stroke="${logSh}" stroke-width="1" opacity="0.55"/>
<rect x="-54" y="-52" width="108" height="44" fill="${log}"/><rect x="20" y="-52" width="34" height="44" fill="${logSh}" opacity="0.5"/>
<path d="M-54,-44 H54 M-54,-35 H54 M-54,-26 H54 M-54,-17 H54" stroke="${logSh}" stroke-width="1.3" opacity="0.75"/>
${[-48.5, -39.5, -30.5, -21.5, -12.5].map(y => `<circle cx="-54" cy="${y}" r="3.7" fill="${log}" stroke="${logSh}" stroke-width="1"/><circle cx="54" cy="${y}" r="3.7" fill="${logSh}"/>`).join('')}
${roofPart}
<rect x="-42" y="-40" width="28" height="24" fill="${logSh}"/><rect x="-39" y="-37" width="22" height="18" fill="${mix(logSh, P.haze, 0.3)}"/>${until(3, `<rect x="-39" y="-37" width="22" height="18" fill="${wg}"/>`)}<path d="M-28,-37 V-19 M-39,-28 H-17" stroke="${logSh}" stroke-width="1.6"/><rect x="-44" y="-16" width="32" height="3.4" rx="1.4" fill="${snowLit}"/>
<rect x="-4" y="-42" width="24" height="44" fill="${logSh}"/><rect x="-1" y="-39" width="18" height="41" fill="${door}"/><path d="M8,-39 V2 M-1,-20 H17" stroke="${logSh}" stroke-width="1" opacity="0.55"/><circle cx="13.6" cy="-16" r="1.5" fill="${P.window}"/>
${until(3, `<rect x="-9" y="1" width="34" height="4.4" rx="1.6" fill="${snowLit}"/>`)}
${from(4, `<rect x="-1" y="-39" width="18" height="41" fill="#000"/><path d="M17.4,5.4 L18.8,1 H23.4 Q25,1 25,2.6 V3.8 Q25,5.4 23.4,5.4Z" fill="${snowLit}"/><path d="M-1,-39 L-15,-35 L-15,6 L-1,2Z" fill="${door}"/><path d="M-15,-35 L-15,6" stroke="${logSh}" stroke-width="1"/><path d="M-23.6,8 Q-21.6,5 -17.8,4.4 Q-13.6,4.4 -11.2,7.6 L-11,8.4Z" fill="${snowLit}"/><path d="M-17,4.4 Q-13.4,4.6 -11.2,7.6 L-11,8.4 L-15.2,8.3 Q-15,5.8 -17,4.4Z" fill="${snowSh}"/>`)}
${shelter}`;
  }
  // snow drifted against the windward wall, up over the footing
  const bank = mound(708, 481, 30, 12, MC, { solid: snow }); S1.push(`<path d="${bank.shadow}"/>`);
  const banked = bank.body;
  // ---- two people on the route below the hut, out on snowshoes: one has stopped, the other is pointing a pole up at
  // the pass. At night they have left their packs inside and come out to the telescope.
  const FA = { jacket: P.coral, jacketSh: P.coralSh, legs: P.plum, legsSh: P.plumDeep, boot: P.ink, cuff: mix(P.ink, P.haze, 0.5), mitt: P.tealDeep, mittSh: P.ink, pole: P.plumDeep, frame: P.plumDeep, deck: night ? '#55697C' : mix(P.haze, P.cream, 0.55), scarf: P.cream, scarfSh: P.creamSh, hair: P.plumDeep, hat: P.tealLight, hatSh: P.teal, hatBand: mix(P.tealLight, P.cream, 0.5), pom: P.cream, bag: P.tealDeep, bagSh: P.ink, lid: P.teal, strap: mix(P.tealLight, P.cream, 0.3), belt: P.ink, roll: P.cream, rollSh: P.creamSh };
  const FB = { ...FA, jacket: P.tealLight, jacketSh: P.teal, bag: mix(P.plum, P.coralSh, 0.35), bagSh: P.plumDeep, lid: mix(P.plum, P.coralSh, 0.6), strap: P.peach, mitt: P.coral, mittSh: P.coralSh };
  const who = [[654, 527, 0.8, FA, { raise: true, pack: night ? false : { roll: 'bottom' }, poles: !night, shoes: !night }], [604, 540, 0.76, FB, { head: 'hood', pack: night ? false : { roll: 'top', small: true }, poles: !night, shoes: !night }]];
  const stay = night ? 4 : 3;
  const poleShadow = (x, y, len) => `M${f(x)},${f(y - 0.6)} L${f(x + SH[0] * len)},${f(y + SH[1] * len - 0.5)} L${f(x + SH[0] * len)},${f(y + SH[1] * len + 0.7)} L${f(x)},${f(y + 0.8)}Z `;
  S1.push(`<g data-until="${stay}"><path d="${who.map(([x, y, s, , opt]) => figureShadow(x, y, s, SH, { pack: !!opt.pack })).join(' ')}${night ? '' : poleShadow(604 - 23.4 * 0.76, 540.3, 38) + poleShadow(604 + 24 * 0.76, 540.2, 38) + poleShadow(654 - 23.4 * 0.8, 527.3, 40)}"/></g>`);
  let people = until(stay, who.map(([x, y, s, C2, opt]) => `<g transform="translate(${x},${y}) scale(${s})">${winterBack(C2, opt)}</g>`).join(''));
  if (!night) {
    // stage 4: nobody. Both pairs of snowshoes are still standing where they stood, and the poles are where they fell.
    S1.push(`<g data-from="4" style="display:none"><path d="${poleShadow(586, 540.6, 36)}${poleShadow(635.4, 527.6, 36)}${poleShadow(624, 541, 30)}"/></g>`);
    const shoe = (x, y, rot, C2) => `<g transform="translate(${x},${y}) rotate(${rot})"><path d="M-10,0 C-10,-3.8 -3,-4.2 2.4,-3.6 C6.4,-3.2 10,-1.6 14.6,0 C10,1.6 6.4,3.2 2.4,3.6 C-3,4.2 -10,3.8 -10,0Z" fill="${C2.frame}"/><path d="M-8.2,0 C-8.2,-2.6 -3,-2.9 2,-2.5 C5,-2.2 7.6,-1.2 10,0 C7.6,1.2 5,2.2 2,2.5 C-3,2.9 -8.2,2.6 -8.2,0Z" fill="${C2.deck}"/><path d="M-5,-2.7 L-2,2.8 M-1.4,-2.8 L1.6,2.7 M2.4,-2.5 L5,2.1" stroke="${C2.frame}" stroke-width="0.7"/><rect x="-3.6" y="-1.3" width="4.4" height="2.6" rx="0.8" fill="${C2.frame}"/></g>`;
    people += from(4, shoe(646, 529.4, -8, FA) + shoe(662, 526.6, 12, FA) + shoe(596, 541.6, 4, FB) + shoe(612, 543.4, -14, FB)
      + `<path d="M586,540.6 L582.4,505 M635.4,527.6 L637.6,492 M624,541 L633,512" stroke="${P.plumDeep}" stroke-width="1.5" stroke-linecap="round" fill="none"/><path d="M690.4,550.6 L724.4,544.6" stroke="${snowSh}" stroke-width="1.6" stroke-linecap="round"/><path d="M688,549 L722,543" stroke="${P.plumDeep}" stroke-width="1.5" stroke-linecap="round"/>`);
  } else {
    const scope = `<path d="M0,0 L-14,34 M0,0 L14,34 M0,0 L0,36" stroke="${P.plumDeep}" stroke-width="2.2" stroke-linecap="round"/><rect x="-22" y="-9" width="46" height="11" rx="4" fill="${P.cream}" transform="rotate(-32)"/><rect x="-22" y="-9" width="46" height="4.4" rx="2.2" fill="${mix(P.cream, '#FFFFFF', 0.5)}" transform="rotate(-32)"/><rect x="18" y="-22" width="8" height="8" rx="2" fill="${P.plumDeep}" transform="rotate(-32)"/>`;
    people += until(4, `<g transform="translate(554,553)">${scope}</g>`) + from(5, `<g transform="translate(566,584) rotate(82)">${scope}</g>`);
  }
  part('benchStuff');
  // ---- compose the bench: shadows first, then what lies on the snow, then what stands on it
  o.push(`<g fill="${snowSh}" clip-path="url(#${bc})">${S1.join('')}</g>`);
  o.push(grain(0, 440, W, 300, GL(0, 500, 0, 700, [[0, 0], [1, 0.16]]), snowDeep, { clipId: bc }));
  o.push(tarn + `<g clip-path="url(#${bc})">${track(T1)}${ripples(5, 52, bench, roll)}</g>` + B1.join(''));
  part('stand');
  o.push(stand.map(t => draw(t, TC)).join('') + marker(470, 580, 1) + marker(1008, 430, 0.56) + marker(1092, 376, 0.46));
  part('hut');
  o.push(`<g transform="translate(${hx},${hy}) scale(${hs})">${hut}</g>` + banked);
  o.push(until(3, `<g fill="${P.cream}" opacity="0.7">${[[848, 322, 10, 6], [855, 309, 17, 8], [868, 294, 25, 10], [886, 278, 32, 11], [908, 264, 25, 9], [928, 254, 15, 6]].map(([x, y, w, h]) => `<rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="${h / 2}"/>`).join('')}</g>`));
  o.push(people);
  // --- the nearer swell
  const young = [[934, 664, 40, 'tree', { seed: 31, tiers: 3, bury: 0.24, load: 1.3, w: 11 }], [958, 672, 26, 'tree', { seed: 32, tiers: 2, bury: 0.3, load: 1.4, w: 9 }], [612, 692, 22, 'ghost', { seed: 2 }]];
  S2.push(`<path d="${young.map(t => t[3] === 'ghost' ? `M${t[0]},${t[1] - 1} L${f(t[0] + SH[0] * t[2])},${f(t[1] + SH[1] * t[2] - 2)} L${f(t[0] + SH[0] * t[2] * 0.9)},${f(t[1] + SH[1] * t[2] + 3)} L${t[0]},${t[1] + 2}Z` : shadowOf(t)).join(' ')}"/>`);
  part('swell');
  o.push(lip(rId, snow));
  o.push(dip(fbank, rc, 60, 0.4));
  o.push(`<g fill="${snowSh}" clip-path="url(#${rc})">${S2.join('')}</g>`);
  o.push(grain(0, 520, W, 260, GL(0, 600, 0, H + 40, [[0, 0.02], [1, 0.24]]), snowDeep, { clipId: rc, seed: 9601 }));
  o.push(`<g clip-path="url(#${rc})">${track(T2)}${ripples(6, 40, roll, fbank)}</g>` + B2.join('') + marker(322, 634, 1.2) + young.map(t => draw(t, TC)).join(''));
  // ---- stage 3: prints come over the pass in a straight line and reach the hut door. Stage 4: they carry on toward us.
  o.push(from(3, prints(C, 0, 0.56, 6)) + from(4, prints(C, 0.67, 1, 4)));
  part('fore');
  // ---- foreground: a bank in shade, boulders under snow, and big firs framing the view
  o.push(lip(fId, snowSh, 5));
  o.push(grain(0, 660, W, 120, GL(0, 670, 0, H + 40, [[0, 0], [1, 0.4]]), snowDeep, { clipId: fc }));
  const big = [[1040, 152, { seed: 41, flag: 0.35, lean: 0.03 }], [1178, 214, { seed: 42, w: 40, taper: 0.95 }], [990, 44, { seed: 45, tiers: 3, bury: 0.22, load: 1.3, w: 12 }], [1108, 330, { seed: 43 }], [152, 168, { seed: 44, w: 23 }], [24, 236, { seed: 46, w: 44, taper: 0.95 }], [208, 50, { seed: 48, tiers: 3, bury: 0.22, load: 1.3, w: 13 }], [84, 310, { seed: 47 }]];
  const TCn = { ...TC, ground: snowSh, groundLit: mix(snowSh, snowLit, 0.4) };
  o.push(`<g clip-path="url(#${fc})"><path d="${big.map(([x, h, opt]) => spireShadow(x, fbank(x) + 10, h * 0.5, (opt.w || h * 0.15) * 2, SH)).join(' ')}" fill="${snowDeep}" fill-opacity="0.55"/>`
    + `<path d="${[[300, 14, 60], [560, 10, 80], [760, 12, 70], [900, 9, 46]].map(([x, up, w]) => { const y = fbank(x) + 5; return `M${x - w},${f(fbank(x - w) + 7)} Q${x - w * 0.3},${f(y - up * 0.2)} ${x + w * 0.2},${f(y + up * 0.5)} Q${x - w * 0.2},${f(y + up * 1.6)} ${x - w},${f(fbank(x - w) + 7)}Z`; }).join(' ')}" fill="${mix(snowSh, snowLit, 0.34)}"/></g>`);
  o.push(boulder(930, fbank(930) + 14, 96, 36, { ...BC, ground: snowSh }, { seed: 1 }) + boulder(262, fbank(262) + 14, 74, 28, { ...BC, ground: snowSh }, { seed: 2 }));
  part('bigTrees');
  o.push(big.map(([x, h, opt]) => snowTree(x, fbank(x) + 10, h, TCn, opt)).join(''));
  o.push(`<rect x="0" y="-50" width="${W}" height="${H + 110}" fill="url(#${radGrad(W / 2, H * 0.46, 800, [[0.6, '#2A1B33', 0], [1, '#2A1B33', night ? 0.5 : 0.3]])})"/>`);
  o.push('</g>');
  return { svg: `<defs>${L.defs.join('\n')}</defs>${o.join('\n')}`, vb: [0, 0, W, H], vbm: [420, 130, 700, 560] };
}
