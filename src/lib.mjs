// Shared drawing helpers for the Echo Basin illustrations.
// Everything is authored as flat SVG paths. Grain shading is NOT an SVG filter:
// each stippled area is an <image data-g> placeholder that the page fills at runtime
// with a small canvas (see runtime.js, "grain engine"), so phones never run feTurbulence.

// ---------- utils ----------
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
let R = mulberry32(11);
export const reseed = n => { R = mulberry32(n); };
export let drawn = 0;                                   // how many numbers have been taken from the shared sequence
export const rnd = (a = 1, b) => { drawn++; return b === undefined ? R() * a : a + R() * (b - a); };
// Step the shared sequence on by n numbers without using them.
export const skip = n => { for (let i = 0; i < n; i++) R(); drawn += n; };
export const pick = arr => { drawn++; return arr[Math.floor(R() * arr.length)]; };
// A random source of one's own, for anything that must not move the shared sequence: r() or r(lo, hi).
export const source = seed => { const g = mulberry32(seed); return (lo = 0, hi = 1) => lo + g() * (hi - lo); };
export const f = n => Math.round(n * 10) / 10;
export const lerp = (a, b, t) => a + (b - a) * t;
const hex2 = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
export const mix = (h1, h2, t) => { const a = hex2(h1), b = hex2(h2); return '#' + a.map((v, i) => Math.round(lerp(v, b[i], t)).toString(16).padStart(2, '0')).join(''); };
export const poly = pts => 'M' + pts.map(p => `${f(p[0])},${f(p[1])}`).join(' L') + 'Z';
export function curveFn(pts){
  return x => {
    if (x <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) {
      if (x <= pts[i][0]) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; const t = (x - x0) / (x1 - x0); const s = (1 - Math.cos(t * Math.PI)) / 2; return y0 + (y1 - y0) * s; }
    }
    return pts[pts.length - 1][1];
  };
}

// ---------- palettes (one world, three times of day) ----------
export const PAL = {
  gold: {
    skyTop: '#D8877A', skyMid: '#EFAA86', skyLow: '#F8D0A2', skyHorizon: '#FDE8C2',
    sun: '#FFF8E6', cream: '#FDE9C8', peach: '#F4BA92', coral: '#E4694F', coralSh: '#B4473F', coralHi: '#F2906F',
    farLit: '#E7B49E', farShade: '#7A4F72', snow: '#FFF3DE',
    midLit: '#B47C86', midShade: '#5A3D62',
    haze: '#8C6F84', teal: '#1E4B54', tealDeep: '#153841', tealLight: '#2F6B68',
    ink: '#0D2730', plum: '#3A2D45', plumDeep: '#281F33',
    window: '#FFC96B', windowHot: '#FF9F4E', grainSky: '#BF6C68', creamSh: '#DDBB98',
    lake: ['#FBDDB0', '#F3B892', '#C48E90', '#5F7083', '#1D4B56'], rim: '#EC9070',
  },
  dusk: {
    skyTop: '#3D3358', skyMid: '#7B5276', skyLow: '#CF8277', skyHorizon: '#F2B48A',
    sun: '#FBE3C4', cream: '#F1D2B4', peach: '#D9937F', coral: '#D85F4C', coralSh: '#9E3F3C', coralHi: '#E88468',
    farLit: '#8F6884', farShade: '#35284C', snow: '#D5BDC6',
    midLit: '#63496E', midShade: '#2A2040',
    haze: '#54456A', teal: '#17394A', tealDeep: '#102B39', tealLight: '#22505A',
    ink: '#091B26', plum: '#2A2140', plumDeep: '#1B152B',
    window: '#FFC96B', windowHot: '#FF9F4E', grainSky: '#2A2346', creamSh: '#C2A08C',
    lake: ['#EFAE8A', '#C97F7C', '#7B5878', '#3A4666', '#122C3C'], rim: '#D07A68',
  },
  night: {
    skyTop: '#070D18', skyMid: '#0E1A2B', skyLow: '#17293D', skyHorizon: '#243C52',
    sun: '#DCE6E4', cream: '#C9D3CE', peach: '#33495E', coral: '#C9553F', coralSh: '#8C3A33', coralHi: '#DD7558',
    farLit: '#22364C', farShade: '#0A1322', snow: '#5F7890',
    midLit: '#18283C', midShade: '#070E1A',
    haze: '#1B2A3C', teal: '#0D222E', tealDeep: '#091822', tealLight: '#16343F',
    ink: '#040A10', plum: '#151726', plumDeep: '#0C0E19',
    window: '#FFC96B', windowHot: '#FF9F4E', grainSky: '#02050B', creamSh: '#8E9C9C',
    lake: ['#2B4459', '#1E3348', '#14253A', '#0C1929', '#060E18'], rim: '#4C6A80',
  },
};
export let P = PAL.gold;
export const usePalette = name => { P = PAL[name]; };

// ---------- per-scene state ----------
export let defs = [];
let uid = 0;
export const nid = p => p + (++uid);
export let SUN = { x: 575, y: 352, r: 43 };
export let WATER = 564;
export const setSun = s => { SUN = s; };
export const setWater = w => { WATER = w; };
export const begin = () => { defs = []; };
export function linGrad(x1, y1, x2, y2, stops){
  const id = nid('lg');
  defs.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}">${stops.map(s => `<stop offset="${s[0]}" stop-color="${s[1]}"${s[2] !== undefined ? ` stop-opacity="${s[2]}"` : ''}/>`).join('')}</linearGradient>`);
  return id;
}
export function radGrad(cx, cy, r, stops){
  const id = nid('rg');
  defs.push(`<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}">${stops.map(s => `<stop offset="${s[0]}" stop-color="${s[1]}"${s[2] !== undefined ? ` stop-opacity="${s[2]}"` : ''}/>`).join('')}</radialGradient>`);
  return id;
}
// A path stored once and drawn or clipped with as often as needed.
export const shared = d => { const id = nid('sh'); defs.push(`<path id="${id}" d="${d}"/>`); return id; };
export const clipTo = id => { const c = nid('cu'); defs.push(`<clipPath id="${c}"><use href="#${id}"/></clipPath>`); return c; };
export const clipRect = (x, y, w, h) => { const c = nid('cr'); defs.push(`<clipPath id="${c}"><rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}"/></clipPath>`); return c; };
export function clip(d){ const id = nid('cp'); defs.push(`<clipPath id="${id}"><path d="${d}"/></clipPath>`); return id; }

// ---------- grain (runtime-filled stipple) ----------
// Density specs: linear {t:'l',p:[x1,y1,x2,y2],s:[[offset,alpha]..]} or radial {t:'r',p:[cx,cy,r],s:[..]}
export const GL = (x1, y1, x2, y2, stops) => ({ t: 'l', p: [x1, y1, x2, y2].map(f), s: stops });
export const GR = (cx, cy, r, stops) => ({ t: 'r', p: [cx, cy, r].map(f), s: stops });
let gseed = 0;
// Step past n of the automatic grain patterns, for a stippled thing that is left out of a picture, so that
// everything stippled after it keeps the pattern it had.
export const grainSkip = n => { gseed += n; };
export function grain(x, y, w, h, spec, color, { clipId, opacity = 1, seed } = {}){
  if (w < 0) { x += w; w = -w; }
  const g = { ...spec, c: color, n: seed ?? (++gseed) };
  return `<image class="gr" data-g='${JSON.stringify(g)}' x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" preserveAspectRatio="none"${clipId ? ` clip-path="url(#${clipId})"` : ''}${opacity !== 1 ? ` opacity="${opacity}"` : ''}/>`;
}

// ---------- staging (in-world changes at irreversible stages) ----------
export const from = (n, s) => `<g data-from="${n}" style="display:none">${s}</g>`;
export const until = (n, s) => `<g data-until="${n}">${s}</g>`;
export const between = (a, b, s) => `<g data-from="${a}" data-until="${b}" style="display:none">${s}</g>`;

// ---------- trees ----------
export function pineGeo(x, yb, h, w, tiers = 5, asym = 0.14, rag = 0){
  const trunkH = h * 0.07, fb = yb - trunkH, top = yb - h, th = (fb - top) / tiers;
  const right = [], left = [], ys = [];
  for (let i = 1; i <= tiers; i++) {
    const t = i / tiers;
    const y = top + (fb - top) * Math.pow(t, 0.94);
    const r = (w / 2) * (0.14 + 0.86 * Math.pow(t, 1.08)) * (1 + rnd(-rag, rag * 0.6));
    const jr = 1 + rnd(-asym, asym), jl = 1 + rnd(-asym, asym);
    const yr = y + rnd(-1, 1) * th * 0.16, yl = y + rnd(-1, 1) * th * 0.16;
    right.push({ ox: x + r * jr, oy: yr, ix: x + r * jr * 0.46, iy: yr - th * 0.16 });
    left.push({ ox: x - r * jl, oy: yl, ix: x - r * jl * 0.46, iy: yl - th * 0.16 });
    ys.push((yr + yl) / 2);
  }
  let d = `M${f(x)},${f(top)}`, px = x, py = top;
  for (let i = 0; i < tiers; i++) {
    const p = right[i];
    d += ` Q${f(px + (p.ox - px) * 0.4)},${f(py + (p.oy - py) * 0.78)} ${f(p.ox)},${f(p.oy)}`;
    if (i < tiers - 1) { d += ` Q${f(lerp(p.ox, p.ix, 0.5))},${f(p.oy + th * 0.03)} ${f(p.ix)},${f(p.iy)}`; px = p.ix; py = p.iy; }
  }
  const br = right[tiers - 1], bl = left[tiers - 1];
  d += ` Q${f(x)},${f(Math.max(br.oy, bl.oy) - th * 0.3)} ${f(bl.ox)},${f(bl.oy)}`;
  for (let i = tiers - 1; i >= 0; i--) {
    const p = left[i];
    const tx = i > 0 ? left[i - 1].ix : x, ty = i > 0 ? left[i - 1].iy : top;
    d += ` Q${f(tx + (p.ox - tx) * 0.4)},${f(ty + (p.oy - ty) * 0.78)} ${f(tx)},${f(ty)}`;
    if (i > 0) { const q = left[i - 1]; d += ` Q${f(lerp(q.ox, q.ix, 0.5))},${f(q.oy + th * 0.03)} ${f(q.ox)},${f(q.oy)}`; }
  }
  d += 'Z';
  const tw = Math.max(2, w * 0.045);
  d += ` M${f(x - tw)},${f(fb - th * 0.4)} L${f(x + tw)},${f(fb - th * 0.4)} L${f(x + tw * 1.25)},${f(yb + 2)} L${f(x - tw * 1.25)},${f(yb + 2)}Z`;
  return { d, ys, top, fb, th };
}
export const pinePath = (...a) => pineGeo(...a).d;
// Pine with a lit edge facing the sun (light copy under a dark copy nudged away from it).
export function pine(x, yb, h, w, tiers, dark, rim, rimW = 3){
  const d = pinePath(x, yb, h, w, tiers);
  const dir = x < SUN.x ? -1 : 1;
  return `<path d="${d}" fill="${rim}"/><path d="${d}" fill="${dark}" transform="translate(${f(dir * rimW)},${f(rimW * 0.35)})"/>`;
}
// Large foreground pine: two-tone, stippled shadow under every bough, thin warm rim.
export function bigPine(x, yb, h, w, tiers, tone, litTone, rim){
  const g = pineGeo(x, yb, h, w, tiers, 0.2, 0.16);
  const s = x < SUN.x ? 1 : -1;
  const cid = clip(g.d);
  const half = [[x, g.top - 6]];
  g.ys.forEach((y, i) => half.push([x + s * (i % 2 ? w * 0.012 : w * 0.05 + i * 0.6), y - g.th * (i % 2 ? 0.5 : 0.1)]));
  half.push([x + s * w * 0.03, yb + 6], [x + s * w, yb + 6], [x + s * w, g.top - 6]);
  const stops = [[0, 0]]; const y0 = g.top, yr = yb - g.top;
  g.ys.forEach(y => { const a = (y - y0) / yr, b = (y + g.th * 0.5 - y0) / yr; stops.push([+(Math.max(0, a - 0.001)).toFixed(3), 0], [+a.toFixed(3), 0.82], [+Math.min(1, b).toFixed(3), 0]); });
  const bx = Math.min(x, x + s * w * 0.34);
  return `<path d="${g.d}" fill="${rim}"/><g transform="translate(${f(-s * 2.6)},1)"><path d="${g.d}" fill="${tone}"/><g clip-path="url(#${cid})"><path d="${poly(half)}" fill="${litTone}"/>${grain(bx, g.top, w * 0.34, yb - g.top + 4, GL(x, 0, x + s * w * 0.34, 0, [[0, 0.9], [0.45, 0.4], [1, 0]]), tone)}${grain(x - w * 0.75, g.top, w * 1.5, yb - g.top + 4, GL(0, y0, 0, yb, stops), mix(tone, '#04141A', 0.55))}</g></g>`;
}
// Row of small trees along a ridge, filled down to baseY.
// mixed: now and then a taller, narrower tree standing above its neighbours, a round-topped one, or a gap. The choice
// is made from where the tree stands, so it takes nothing from the shared random sequence.
export function treeRow(x0, x1, yFn, { hMin, hMax, step, baseY, notch = false, mixed = false }){
  const yy = x => Math.min(yFn(x), baseY);
  let d = `M${f(x0)},${baseY} L${f(x0)},${f(yy(x0))}`;
  for (let x = x0; x <= x1; x += 8) d += ` L${f(x)},${f(yy(x))}`;
  d += ` L${f(x1)},${f(yy(x1))} L${f(x1)},${baseY}Z`;
  let x = x0 + rnd(0, step);
  while (x < x1) {
    const y = yFn(x) + 1.5;
    if (y < baseY + 1) {
      const h = rnd(hMin, hMax), w = h * rnd(0.4, 0.56);
      const kind = mixed ? (v => v - Math.floor(v))(Math.sin(x * 12.9898 + hMax * 3.1) * 43758.5453) : 1;
      if (kind < 0.07) { /* a gap */ }
      else if (kind < 0.2) { const hh = h * 1.5, ww = w * 0.72; d += ` M${f(x - ww / 2)},${f(y)} L${f(x - ww * 0.2)},${f(y - hh * 0.36)} L${f(x - ww * 0.36)},${f(y - hh * 0.33)} L${f(x - ww * 0.1)},${f(y - hh * 0.68)} L${f(x - ww * 0.24)},${f(y - hh * 0.65)} L${f(x)},${f(y - hh)} L${f(x + ww * 0.24)},${f(y - hh * 0.65)} L${f(x + ww * 0.1)},${f(y - hh * 0.68)} L${f(x + ww * 0.36)},${f(y - hh * 0.33)} L${f(x + ww * 0.2)},${f(y - hh * 0.36)} L${f(x + ww / 2)},${f(y)}Z`; }
      else if (kind < 0.32) { const ww = w * 1.1, hh = h * 0.92; d += ` M${f(x - ww * 0.5)},${f(y)} Q${f(x - ww * 0.66)},${f(y - hh * 0.62)} ${f(x - ww * 0.08)},${f(y - hh)} Q${f(x + ww * 0.7)},${f(y - hh * 0.6)} ${f(x + ww * 0.5)},${f(y)}Z`; }
      else if (notch) d += ` M${f(x - w / 2)},${f(y)} L${f(x - w * 0.17)},${f(y - h * 0.5)} L${f(x - w * 0.36)},${f(y - h * 0.46)} L${f(x)},${f(y - h)} L${f(x + w * 0.36)},${f(y - h * 0.46)} L${f(x + w * 0.17)},${f(y - h * 0.5)} L${f(x + w / 2)},${f(y)}Z`;
      else d += ` M${f(x - w / 2)},${f(y)} L${f(x)},${f(y - h)} L${f(x + w / 2)},${f(y)}Z`;
    }
    x += rnd(step * 0.6, step * 1.4);
  }
  return d;
}
export function hill(x0, x1, top, nRows, spacing, farTone, nearTone, opts = {}){
  const topFn = curveFn(top);
  let s = '';
  for (let k = 0; k < nRows; k++) {
    const t = nRows === 1 ? 1 : k / (nRows - 1);
    const wob = rnd(0, 6.28), yFn = x => topFn(x) + k * spacing + Math.sin(x * 0.011 + wob) * 4 * (k > 0);
    const tone = mix(farTone, nearTone, Math.pow(t, 0.85));
    const sc = opts.scale || 1;
    const d = treeRow(x0, x1, yFn, { hMin: (11 + k * 2.8) * sc, hMax: (21 + k * 4.4) * sc, step: (8.5 + k * 1.6) * sc, baseY: opts.baseY ?? WATER, notch: k >= 1, mixed: !!opts.mixed });
    const dir = (x0 + x1) / 2 < SUN.x ? 1 : -1, edge = opts.edge ?? 1.6;      // edge: how far the lit copy of each row stands out toward the sun
    // share: the row's outline is stored once and used for its lit edge, its body and the haze over it
    const id = opts.share ? shared(d) : null, draw = (fill, tf = '') => id ? `<use href="#${id}" fill="${fill}"${tf}/>` : `<path d="${d}" fill="${fill}"${tf}/>`;
    s += (edge ? draw(mix(tone, P.peach, 0.34), ` transform="translate(${f(dir * edge)},${f(-0.375 * edge)})"`) : '') + draw(tone);
    const cid = id ? clipTo(id) : clip(d);
    const ya = Math.min(...top.map(p => p[1])) + k * spacing;
    const hz = linGrad(0, ya + 6, 0, ya + 120, [[0, P.peach, 0], [1, P.peach, 0.34 * (1 - t)]]);
    s += `<rect x="${x0}" y="${f(ya)}" width="${x1 - x0}" height="${f((opts.baseY ?? WATER) - ya)}" fill="url(#${hz})" clip-path="url(#${cid})"/>`;
  }
  return s;
}

// ---------- mountains ----------
function jag(pts, amp, seg){
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / seg));
    for (let k = 1; k < n; k++) { const t = k / n + rnd(-0.1, 0.1) / n; out.push([lerp(a[0], b[0], t) + rnd(-amp, amp) * 0.5, lerp(a[1], b[1], t) + rnd(-amp, amp)]); }
    out.push(b);
  }
  return out;
}
// Range with faceted lit/shadow sides (shadow faces away from SUN) and optional snow caps.
// caps: false leaves the snow caps undrawn (the peaks returned say which ones carry snow, for a caller that draws its own).
export function range(coarse, { baseY, lit, shadeColor, shadeOpacity, snowPeaks = [], amp = 5, seg = 34, ridgeZig = 12, caps = true }){
  const sky = [], idx = [];
  for (let i = 0; i < coarse.length; i++) {
    if (i === 0) { sky.push(coarse[0]); idx.push(0); continue; }
    const part = jag([coarse[i - 1], coarse[i]], amp, seg);
    for (let k = 1; k < part.length; k++) sky.push(part[k]);
    idx.push(sky.length - 1);
  }
  const body = poly([[sky[0][0], baseY], ...sky, [sky[sky.length - 1][0], baseY]]);
  let out = `<path d="${body}" fill="${lit}"/>`;
  const cid = clip(body);
  let snow = '', shade = '', shadeD = ''; const peaks = [];
  for (let i = 1; i < coarse.length - 1; i++) {
    const [px, py] = coarse[i];
    if (!(py < coarse[i - 1][1] && py < coarse[i + 1][1])) continue;
    const dir = px < SUN.x ? -1 : 1;
    let j = i; while (coarse[j + dir] && coarse[j + dir][1] > coarse[j][1]) j += dir;
    const a = Math.min(idx[i], idx[j]), b = Math.max(idx[i], idx[j]);
    let edge = sky.slice(a, b + 1); if (dir < 0) edge = edge.reverse();
    const valley = edge[edge.length - 1];
    const hgt = baseY - py;
    const ridge = []; const steps = Math.max(2, Math.round(hgt / 58));
    for (let k = 1; k <= steps; k++) { const t = k / steps; ridge.push([px - dir * hgt * 0.10 * t + (k % 2 ? 1 : -1) * dir * ridgeZig * (0.4 + 0.5 * t) * rnd(0.6, 1.1), py + hgt * t]); }
    const gh = baseY - valley[1], gs = Math.max(2, Math.round(gh / 54)); const gully = [];
    for (let k = 1; k <= gs; k++) { const t = k / gs; gully.push([valley[0] + dir * gh * 0.22 * t + (k % 2 ? 1 : -1) * ridgeZig * 0.4 * rnd(0.5, 1), valley[1] + gh * t]); }
    { const sdp = poly([[px, py], ...edge.slice(1), ...gully, ...ridge.slice().reverse()]); shade += `<path d="${sdp}"/>`; shadeD += sdp + ' '; }
    { let j2 = i; while (coarse[j2 - dir] && coarse[j2 - dir][1] > coarse[j2][1]) j2 -= dir; let el = sky.slice(Math.min(idx[i], idx[j2]), Math.max(idx[i], idx[j2]) + 1); if (dir > 0) el = el.reverse(); peaks.push({ x: px, y: py, dir, edge, edgeLit: el, ridge, hgt, snow: snowPeaks.includes(i) }); }
    if (snowPeaks.includes(i)) {
      const capH = hgt * 0.34;
      const side = (step) => { const pts = []; let k = idx[i]; while (sky[k + step] && sky[k + step][1] - py < capH && sky[k + step][1] >= sky[k][1] - 4) { k += step; pts.push(sky[k]); } return pts; };
      const l = side(-1).reverse(), r = side(1);
      if (l.length && r.length) {
        const lx = l[0], rx = r[r.length - 1]; const zig = []; const n = 7;
        for (let k = 1; k < n; k++) { const t = k / n; zig.push([lerp(rx[0], lx[0], t), lerp(rx[1], lx[1], t) + (k % 2 ? -capH * 0.42 : capH * 0.18) * rnd(0.7, 1.15)]); }
        if (caps) snow += `<path d="${poly([...l, [px, py], ...r, ...zig])}"/>`;
      }
    }
  }
  out += `<g clip-path="url(#${cid})"><g fill="${P.snow}">${snow}</g><g fill="${shadeColor}" opacity="${shadeOpacity}">${shade}</g></g>`;
  return { svg: out, body, cid, peaks, shadeD };
}

// A mark on water: a sliver that swells in the middle, comes to a point at each end and rides a slight wave, the
// way a ripple catches light along its crest.
export const sliver = (x, y, w, th, a = 0) => `M${f(x)},${f(y)}C${f(x + w * 0.3)},${f(y - a)} ${f(x + w * 0.7)},${f(y + a)} ${f(x + w)},${f(y)}C${f(x + w * 0.7)},${f(y + a + th)} ${f(x + w * 0.3)},${f(y - a + th)} ${f(x)},${f(y)}Z`;

// ---------- small props ----------
// A cloud at sunset: a bank of heaped vapour on a level base, lit from underneath and from the sun's side, so its
// underside glows and its top and far side are in soft shade. bars is the old list of stacked bars and is used only
// for its outline, so every cloud keeps the place and size it had. The heaps come from a random source of the
// cloud's own, seeded by where it is: two clouds given the same bars still come out different, and the shared
// sequence the rest of a picture draws on is left alone.
export function cloud(cx, cy, s, bars){
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const [dx, dy, w, h] of bars) { x0 = Math.min(x0, cx + (dx - w / 2) * s); x1 = Math.max(x1, cx + (dx + w / 2) * s); y0 = Math.min(y0, cy + dy * s); y1 = Math.max(y1, cy + (dy + h) * s); }
  const W = x1 - x0, T = y1 - y0, base = y1, mx = (x0 + x1) / 2, cr = mulberry32(Math.round(cx * 7 + cy * 13 + s * 1000 + bars.length * 31)), r = (lo = 0, hi = 1) => lo + cr() * (hi - lo);
  const dir = mx < SUN.x ? 1 : -1;                                     // the side the sun is on
  // tones: the sky at this height, pushed toward mauve for the shaded tops and toward the sun's colour for the lit undersides
  const t = Math.max(0, Math.min(1, cy / 480)), sky = t < 0.4 ? mix(P.skyTop, P.skyMid, t / 0.4) : t < 0.8 ? mix(P.skyMid, P.skyLow, (t - 0.4) / 0.4) : mix(P.skyLow, P.skyHorizon, (t - 0.8) / 0.2);
  const shade = mix(sky, P.haze, 0.3), lit = mix(P.cream, P.sun, 0.45), mid = mix(shade, lit, 0.52);
  // the heaps: a row of wide flat domes along a level base, taller toward one point, with a swelling or two riding on top
  const n = Math.max(3, Math.min(6, Math.round(W / (T * 1.25)))), peak = r(0.32, 0.68), tallness = r(0.85, 1.2), lobes = [];
  const hgt = u => T * tallness * (0.3 + 0.9 * Math.pow(Math.max(0, Math.sin(Math.PI * (u < peak ? u / peak / 2 : 0.5 + (u - peak) / (1 - peak) / 2))), 0.85));
  for (let i = 0; i < n; i++) { const u = (i + 0.5 + r(-0.22, 0.22)) / n, h = hgt(u) * r(0.8, 1.1), ry = Math.max(h * r(0.85, 1.1), W * 0.84 / n * 0.5); lobes.push({ x: x0 + W * (0.08 + 0.84 * u), y: base - h + ry, rx: Math.max(ry * r(1.15, 1.5), W * 0.84 / n * 0.74), ry, h }); }
  const tall = lobes.slice().sort((a, b) => b.h - a.h);
  for (let j = 0, m = 1 + Math.floor(r(0, 2.2)); j < m && j < tall.length; j++) { const k = tall[j], ry = k.ry * r(0.5, 0.68); lobes.push({ x: k.x + r(-0.4, 0.4) * k.rx, y: base - k.h + ry * r(0.34, 0.6), rx: ry * r(1.2, 1.5), ry, h: 0 }); }
  // three bands of tone, each the same heaps slid a little further toward the sun and down: shade shows along the
  // top and the side away from the sun, then a half-tone, then the lit underside. One smaller heap is drawn again in
  // front of the rest on the side away from the sun, so its shaded shoulder cuts across the light and the cloud has a near side.
  const disc = (q, kx, ky, kr) => { const x = q.x + dir * q.rx * kx, y = q.y + q.ry * ky, rx = q.rx * kr, ry = q.ry * kr; return `M${f(x - rx)},${f(y)}a${f(rx)},${f(ry)} 0 1 0 ${f(rx * 2)},0a${f(rx)},${f(ry)} 0 1 0 ${f(-rx * 2)},0Z`; };
  const hf = T * tallness * r(0.4, 0.56), fry = hf * r(0.85, 1.05), front = { x: tall[0].x - dir * tall[0].rx * r(0.62, 0.95), y: base - hf + fry, rx: fry * r(1.25, 1.6), ry: fry };
  const band = (list, kx, ky, kr) => shared(list.map(q => disc(q, kx, ky, kr)).join(''));
  const A = [band(lobes, 0, 0, 1), band(lobes, 0.16, 0.22, 0.98), band(lobes, 0.34, 0.46, 0.94)], B = [band([front], 0, 0, 1), band([front], 0.16, 0.22, 0.98), band([front], 0.34, 0.46, 0.94)];
  const paint = ids => ids.map((id, i) => `<use href="#${id}" fill="${[shade, mid, lit][i]}"/>`).join('');
  // a stipple of the shade tone over the whole cloud, dense along the top and gone by the base, so the bands of
  // tone grade into one another the way everything else in these pictures is shaded
  const all = nid('cu'); defs.push(`<clipPath id="${all}">${[...A, ...B].map(id => `<use href="#${id}"/>`).join('')}</clipPath>`);
  const top = Math.min(...lobes.map(q => q.y - q.ry)), speck = grain(x0 - W * 0.2, top - 2, W * 1.4, base - top + 6, GL(0, top, 0, base, [[0, 0.5], [0.45, 0.22], [0.8, 0.05], [1, 0]]), shade, { clipId: all, seed: 7000 + Math.round(cx * 3 + cy * 5 + s * 100) % 900 });
  const body = paint(A) + paint(B) + speck;
  // the base is level but not ruled: it rises and falls a little, and lifts toward both ends
  const xa = x0 - W * 0.3, xb = x1 + W * 0.3, ph = r(0, 6.28), cut = [[xa, y0 - T * 2.2], [xb, y0 - T * 2.2]];
  for (let k = 0; k <= 24; k++) { const x = lerp(xb, xa, k / 24), e = Math.abs(x - mx) / (W / 2); cut.push([x, base + T * 0.03 * Math.sin(x / (T * 0.9) + ph) - T * 0.2 * Math.max(0, e - 0.72) ** 2 * 4]); }
  // loose streaks trailing off the ends
  const streak = (x, y, len, th, tone) => `<path d="M${f(x)},${f(y)} Q${f(x + len * 0.5)},${f(y - th)} ${f(x + len)},${f(y)} Q${f(x + len * 0.5)},${f(y + th * 0.7)} ${f(x)},${f(y)}Z" fill="${tone}"/>`;
  let wisps = streak(mx - W * 0.5 * dir - (dir > 0 ? W * r(0.16, 0.3) : 0), base + T * r(0.1, 0.2), W * r(0.3, 0.46), T * 0.05, mid) + streak(mx + dir * W * r(0.0, 0.16) - (dir < 0 ? W * 0.4 : 0), base + T * r(0.24, 0.36), W * r(0.36, 0.5), T * 0.045, lit);
  if (r() < 0.75) { const len = W * r(0.2, 0.34); wisps += streak(dir > 0 ? x0 - len - W * r(0.02, 0.12) : x1 + W * r(0.02, 0.12), base - T * r(0.3, 0.7), len, T * 0.04, shade); }
  return `<g clip-path="url(#${clip(poly(cut))})">${body}</g>${wisps}`;
}
export function rock(x, y, w, h, body, top){
  const pts = [[x - w / 2, y], [x - w * 0.45, y - h * 0.46], [x - w * 0.2, y - h * 0.94], [x + w * 0.12, y - h], [x + w * 0.38, y - h * 0.62], [x + w / 2, y - h * 0.16], [x + w / 2, y]];
  const lit = [[x - w * 0.45, y - h * 0.46], [x - w * 0.2, y - h * 0.94], [x + w * 0.12, y - h], [x + w * 0.38, y - h * 0.62], [x + w * 0.04, y - h * 0.6], [x - w * 0.24, y - h * 0.36]];
  return `<path d="${poly(pts)}" fill="${body}"/><path d="${poly(lit)}" fill="${top}"/>`;
}
// A paddle lying along +x: a palm grip at the origin, a shaft, and a long blade that widens from the throat and
// rounds off at the tip, with a spine down its middle, its lower edge in shade and a painted band near the tip.
export function paddleShape(len = 90){
  const x0 = len * 0.58, B = len - x0, wood = mix(P.cream, P.peach, 0.3), shade = mix(wood, P.plum, 0.34), q = (k, y) => `${f(x0 + B * k)},${y}`;
  const blade = `M${q(0, -1.5)} C${q(0.28, -1.8)} ${q(0.42, -6.6)} ${q(0.7, -6.6)} C${q(0.9, -6.6)} ${q(1, -4)} ${q(1, 0)} C${q(1, 4)} ${q(0.9, 6.6)} ${q(0.7, 6.6)} C${q(0.42, 6.6)} ${q(0.28, 1.8)} ${q(0, 1.5)}Z`;
  const cid = clip(blade);
  return `<path d="M5,-1.25 L${f(x0)},-1.5 L${f(x0)},1.5 L5,1.25Z" fill="${wood}"/><path d="M5,0.2 L${f(x0)},0.3 L${f(x0)},1.5 L5,1.25Z" fill="${shade}"/><path d="M0,-0.9 C-1.2,-4.3 3.4,-4.5 5.4,-1.25 L5.4,1.25 C3.4,4.5 -1.2,4.3 0,0.9Z" fill="${wood}"/><path d="M0,0.9 C-1.2,4.3 3.4,4.5 5.4,1.25 L5.4,0.2 C3,1.2 1,1.3 0,0.9Z" fill="${shade}"/>`
    + `<path d="${blade}" fill="${wood}"/><g clip-path="url(#${cid})"><rect x="${f(x0)}" y="0.4" width="${f(B)}" height="8" fill="${shade}"/><rect x="${f(x0 + B * 0.78)}" y="-8" width="${f(B * 0.09)}" height="16" fill="${P.coralSh}"/><rect x="${f(x0 + B * 0.9)}" y="-8" width="${f(B * 0.03)}" height="16" fill="${P.coralSh}"/></g><path d="M${f(x0)},0 H${f(x0 + B * 0.72)}" stroke="${shade}" stroke-width="0.8" stroke-linecap="round"/>`;
}
// An open canoe seen from the side and a little from above, so the far gunwale shows over the near one and the
// inside can be seen between them: thwarts, two cane seats, ribs on the far wall. Outside: a pale strake under the
// rail, a pinstripe, the turn of the bilge in shade, banded stems that curve back on themselves. About 220 long,
// origin at the middle on the keel line.
// shadow: lying on the ground. paddle: one propped inside, leaning on the far gunwale. rope: a painter trailing from
// the bow. afloat: sitting in the water, so only what is above the waterline shows, with its reflection under it.
export function canoe({ shadow = true, paddle = true, rope = shadow, afloat = false } = {}){
  const HL = 110, yN = x => -3 - 16 * Math.pow(Math.abs(x) / HL, 2.3), yF = x => -12.4 - 6.6 * Math.pow(Math.abs(x) / HL, 2.3), yK = x => 8.6 + 4.6 * (1 - Math.pow(Math.abs(x) / 82, 2)), yC = x => 7.4 - 12.5 * Math.pow(Math.abs(x) / 104, 2.2);
  const xs = []; for (let x = -HL; x <= HL; x += 10) xs.push(x);
  const line = fn => xs.map(x => `${x},${f(fn(x))}`).join(' L'), back = fn => xs.slice().reverse().map(x => `${x},${f(fn(x))}`).join(' L');
  const keel = []; for (let x = 82; x >= -82; x -= 10.25) keel.push(`${f(x)},${f(yK(x))}`);
  // near side of the hull: along the rail, down the bow stem, back along the keel, up the stern stem
  const hull = `M${line(yN)} C114,-12 109,-3 97,3.4 L${keel.join(' L')} L-97,3.4 C-109,-3 -114,-12 -110,-19Z`;
  const inside = `M${line(yF)} L${back(yN)}Z`;
  const hc = clip(hull), ic = clip(inside), dark = mix(P.coralSh, P.plumDeep, 0.62), wall = mix(P.coralSh, P.plumDeep, 0.3), wood = mix(P.cream, P.peach, 0.3), woodSh = mix(wood, P.plum, 0.4);
  const out = [];
  if (shadow) out.push(`<ellipse cx="4" cy="15" rx="104" ry="6" fill="#06181E" opacity="0.6"/>`);
  // the inside: the far wall catching a little light under its rail, the floor dark
  let ribs = ''; for (let x = -90; x <= 90; x += 12) ribs += `M${x},${f(yF(x))} l${f(-x * 0.012)},4.4 `;
  const thwart = x => `M${f(x + 1.6)},${f(yF(x) + 0.6)} L${f(x - 1.6)},${f(yN(x) + 1)}`;
  const seat = x => `<path d="M${f(x - 9)},${f(yF(x - 9) + 1.6)} L${f(x + 9)},${f(yF(x + 9) + 1.6)} L${f(x + 6.4)},${f(yN(x + 6.4) + 1)} L${f(x - 11.6)},${f(yN(x - 11.6) + 1)}Z" fill="${wood}"/><path d="M${f(x - 5)},${f(yF(x) + 1.6)} l-2.6,8 M${f(x + 1)},${f(yF(x) + 1.6)} l-2.6,8 M${f(x + 7)},${f(yF(x) + 1.6)} l-2.6,8" stroke="${woodSh}" stroke-width="0.6"/>`;
  out.push(`<path d="${inside}" fill="${dark}"/><g clip-path="url(#${ic})"><path d="M${line(x => yF(x) + 4.2)} L${back(yF)}Z" fill="${wall}"/><path d="${ribs}" stroke="${dark}" stroke-width="0.8" fill="none"/>${seat(-64)}${seat(62)}<path d="${thwart(-30)} ${thwart(4)} ${thwart(34)}" stroke="${wood}" stroke-width="2.4" fill="none"/></g>`);
  out.push(`<path d="M${line(yF)}" fill="none" stroke="${mix(P.cream, P.coralSh, 0.45)}" stroke-width="1.3" stroke-linecap="round"/>`);
  // the paddle stands in the canoe, grip down on the floor, leaning on the far rail
  if (paddle) out.push(`<g transform="translate(6,-4) rotate(-33)">${paddleShape(92)}</g>`);
  // the near side
  out.push(`<path d="${hull}" fill="${P.coral}"/><g clip-path="url(#${hc})"><path d="M-110,${f(yC(-104))} L${xs.map(x => `${x},${f(yC(x))}`).join(' L')} L110,30 L-110,30Z" fill="${P.coralSh}"/><path d="M${line(x => yN(x) + 3.4)} L${back(yN)}Z" fill="${P.coralHi}"/><path d="M${line(x => yN(x) + 5.6)}" fill="none" stroke="${P.cream}" stroke-width="0.8" stroke-opacity="0.85"/><path d="M-84,7.6 L${keel.slice().reverse().join(' L')}" fill="none" stroke="${mix(P.coralSh, P.plumDeep, 0.45)}" stroke-width="1.6"/></g>`);
  // brass bands on the stems, little decks at the ends, and the rail
  out.push(`<path d="M110,-19 C114,-12 109,-3 97,3.4 M-110,-19 C-114,-12 -109,-3 -97,3.4" fill="none" stroke="${woodSh}" stroke-width="1.5" stroke-linecap="round"/><path d="M110,-19 L92,${f(yF(92))} L90,${f(yN(90))}Z M-110,-19 L-92,${f(yF(-92))} L-90,${f(yN(-90))}Z" fill="${wood}"/><path d="M${line(yN)}" fill="none" stroke="${P.cream}" stroke-width="2" stroke-linecap="round"/>`);
  if (rope) out.push(`<path d="M108,-17 C118,-6 112,8 122,14 S140,15 146,19" fill="none" stroke="${P.cream}" stroke-width="1" stroke-linecap="round" opacity="0.85"/>`);
  if (!afloat) return out.join('');
  // afloat: the water hides the hull below the waterline, and carries a short dark reflection of the rest
  const WL = 7.2, wc = nid('cp'); defs.push(`<clipPath id="${wc}"><rect x="-130" y="-120" width="260" height="${120 + WL}"/></clipPath>`);
  return `<path d="${hull}" fill="${mix(P.coralSh, P.plumDeep, 0.35)}" opacity="0.42" transform="translate(0,${f(WL * 1.5)}) scale(1,-0.5)"/><g clip-path="url(#${wc})">${out.join('')}</g><path d="M-99,${WL} H99" stroke="${P.cream}" stroke-width="1.1" stroke-linecap="round" opacity="0.6"/>`;
}
// A-frame lodge with a side wing, seen square-on from across the lake. Origin at the foot of the glass front, on
// the deck. Returned in two parts, because the deck stands out in front of the bank the building sits behind:
// body is the building, deck is the platform on its posts with the railing along it.
// Lights are staged: everything lit through stage 3; at 4 the wing and its porch lamp are dark; at 5 the whole
// building is dark and the side door is standing open.
export function lodge(){
  const B = [], D = [];
  const dark = P.plumDeep, wall = P.plum, roof = mix(P.plumDeep, '#000000', 0.25), unlit = mix(P.plumDeep, P.haze, 0.18), trim = mix(P.plum, P.haze, 0.5), door = mix(P.plum, P.coralSh, 0.55), stone = mix(P.plumDeep, P.haze, 0.34);
  const wg = linGrad(0, -90, 0, 0, [[0, P.windowHot], [0.55, P.window], [1, '#FFE2A0']]), glow = (x, y, r, a) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${radGrad(x, y, r, [[0, P.window, a], [1, P.window, 0]])})"/>`;
  // ---- the wing: a low room under a single-pitch roof, boarded upright, with a stone chimney behind
  const eave = x => -52 + (x - 34) * (11.5 / 78);                       // underside of the roof at x
  B.push(`<rect x="87" y="-77" width="10" height="34" fill="${stone}"/><rect x="92.6" y="-77" width="4.4" height="34" fill="${dark}" fill-opacity="0.45"/><path d="M87,-67.5 h10 M87,-58.5 h10 M87,-49.5 h10 M91,-77 v9.5 M93.4,-67.5 v9 M90,-58.5 v9" stroke="${dark}" stroke-width="0.6" stroke-opacity="0.6" fill="none"/><rect x="87" y="-77" width="1.3" height="34" fill="${P.peach}" fill-opacity="0.75"/><rect x="85.2" y="-80.2" width="13.6" height="3.6" rx="0.6" fill="${roof}"/>`);
  B.push(`<path d="M34,0 L34,-52 L112,-40.5 L112,0Z" fill="${wall}"/>`);
  { let boards = ''; for (let x = 40.5; x < 111; x += 6.5) boards += `M${f(x)},${f(eave(x) + 1)} V0 `; B.push(`<path d="${boards}" stroke="${dark}" stroke-width="0.7" stroke-opacity="0.5" fill="none"/><path d="M34,-52 L112,-40.5 L112,-35.6 L34,-47.1Z" fill="${dark}" fill-opacity="0.5"/>`); }
  B.push(`<path d="M29,-57.4 L119.4,-44 L119.4,-38.4 L29,-51.2Z" fill="${roof}"/><path d="M29,-57.4 L119.4,-44 L119.4,-42.6 L29,-56Z" fill="${trim}"/>`);
  // two windows with trim, sills and boxes of flowers under them
  const win = x => `<rect x="${x - 1.3}" y="-36.3" width="16.6" height="23.6" fill="${trim}"/><rect x="${x}" y="-35" width="14" height="21" fill="${unlit}"/>`;
  const pane = x => `<rect x="${x}" y="-35" width="14" height="21" fill="url(#${wg})"/>`;
  const bars = x => `<path d="M${x + 7},-35 V-14 M${x},-24.5 H${x + 14}" stroke="${dark}" stroke-width="1.3" fill="none"/><rect x="${x - 2.4}" y="-12.9" width="18.8" height="1.7" fill="${trim}"/><rect x="${x - 1.4}" y="-11.2" width="16.8" height="3.4" rx="0.6" fill="${roof}"/><g fill="${P.coral}"><circle cx="${x + 1.6}" cy="-11.6" r="1.1"/><circle cx="${x + 8.4}" cy="-11.9" r="1.1"/><circle cx="${x + 12.6}" cy="-11.5" r="1"/></g><g fill="${P.cream}"><circle cx="${x + 4.8}" cy="-11.8" r="1"/><circle cx="${x + 10.6}" cy="-11.4" r="0.9"/></g>`;
  B.push(win(50) + win(69.5) + until(3, pane(50) + pane(69.5)) + bars(50) + bars(69.5));
  // the side door: a boarded door with a small pane, and a lamp over it
  B.push(`<rect x="91.6" y="-30.6" width="12.8" height="30.6" fill="${trim}"/><rect x="93" y="-29.2" width="10" height="29.2" fill="${door}"/><path d="M96.4,-16.6 V0 M99.7,-16.6 V0" stroke="${dark}" stroke-width="0.6" stroke-opacity="0.5" fill="none"/><rect x="95" y="-26.4" width="6" height="7.6" fill="${unlit}"/>`);
  B.push(until(3, `<rect x="95" y="-26.4" width="6" height="7.6" fill="url(#${wg})"/>`) + `<path d="M98,-26.4 V-18.8" stroke="${dark}" stroke-width="0.8"/><circle cx="101.3" cy="-12.6" r="0.9" fill="${P.window}"/>`);
  B.push(`<rect x="96.9" y="-36.6" width="2.2" height="3.2" rx="0.5" fill="${unlit}"/><path d="M96.2,-36.8 h3.6 l-0.6,-1.5 h-2.4Z" fill="${roof}"/>` + until(3, glow(98, -34.6, 10, 0.55) + `<rect x="96.9" y="-36.6" width="2.2" height="3.2" rx="0.5" fill="${P.window}"/>`));
  B.push(from(5, `<rect x="93" y="-29.2" width="10" height="29.2" fill="#000"/><path d="M93,-29.2 L86.4,-27.2 L86.4,2 L93,0Z" fill="${door}"/><path d="M86.4,-27.2 V2" stroke="${dark}" stroke-width="0.9"/>`));
  // ---- the A-frame: two long roofs meeting at the ridge, and a front that is all glass in a timber frame
  const glass = 'M0,-75 L-38.5,0 L38.5,0Z', gc = clip(glass);
  B.push(`<path d="M0,-84 L-46.5,2 L46.5,2Z" fill="${dark}"/><path d="${glass}" fill="${unlit}"/>`);
  // lit: the room inside. A gallery across at the level of the loft, a lamp hanging in the peak, a lamp and a chair below.
  const inside = mix(P.windowHot, P.coralSh, 0.55);
  B.push(until(4, `<g clip-path="url(#${gc})"><path d="${glass}" fill="url(#${wg})"/>${glow(0, -57, 15, 0.9)}<path d="M-22,-40 V-46.4 M-18,-40 V-46.4 M-14,-40 V-46.4 M-10,-40 V-46.4 M-6,-40 V-46.4 M-2,-40 V-46.4 M2,-40 V-46.4 M6,-40 V-46.4 M10,-40 V-46.4 M14,-40 V-46.4 M18,-40 V-46.4 M22,-40 V-46.4 M-24,-46.6 H24" stroke="${inside}" stroke-width="0.7" stroke-opacity="0.75" fill="none"/><path d="M0,-75 V-60.4" stroke="${inside}" stroke-width="0.6"/><path d="M-2.6,-57.6 Q0,-62.4 2.6,-57.6Z" fill="${inside}"/><circle cx="0" cy="-56.6" r="1.4" fill="#FFF8E2"/><g fill="${inside}" fill-opacity="0.6"><path d="M25.4,0 V-13.6 h-2.4 l1.8,-5 h3.6 l1.8,5 h-2.4 V0Z"/><path d="M-31,0 v-8.6 q0,-2.6 2.6,-2.6 h9 q2.6,0 2.6,2.6 V0Z"/></g></g>`));
  // the timber frame, cut to the glass so every member meets the rafters cleanly
  B.push(`<g clip-path="url(#${gc})" stroke="${dark}" fill="none"><path d="M-40,-40 H40" stroke-width="3.2"/><path d="M-13,-80 V2 M13,-80 V2" stroke-width="2.2"/><path d="M0,-80 V-40" stroke-width="1.8"/><path d="M-13,-27 H13" stroke-width="1.8"/><path d="M0,-27 V2" stroke-width="1.3"/><path d="M-40,-19 H-13 M13,-19 H40" stroke-width="1.6"/></g><circle cx="-1.9" cy="-13" r="0.7" fill="${trim}"/><circle cx="1.9" cy="-13" r="0.7" fill="${trim}"/>`);
  B.push(`<path d="M0,-102 L-58,4 L-47.6,4 L0,-83.4 L47.6,4 L58,4Z" fill="${roof}"/><path d="M-47.6,4 L0,-83.4 L47.6,4" fill="none" stroke="${trim}" stroke-width="1.3" stroke-linejoin="miter"/><path d="M0,-102 L-58,4 L-54.4,4 L0,-95.6Z" fill="${P.peach}" fill-opacity="0.9"/>`);
  // ---- the deck: a platform on posts with a railing all the way along it, and steps down at the wing end
  { let posts = '', bal = '', legs = '';
    for (let x = -72; x <= 121; x += 24.1) { posts += `<rect x="${f(x - 1.1)}" y="-11" width="2.2" height="13.4"/>`; legs += `<rect x="${f(x - 1.3)}" y="6.2" width="2.6" height="7.4"/>`; }
    for (let x = -68; x < 120; x += 4.02) bal += `M${f(x)},-9 V2 `;
    D.push(`<g fill="${roof}">${legs}</g><path d="M-70.5,6.4 L-48,13 M-48,6.4 L-70.5,13 M98.3,6.4 L120.7,13 M120.7,6.4 L98.3,13" stroke="${roof}" stroke-width="0.8" fill="none"/>`);
    D.push(`<path d="M124,2 h4.6 v3.4 h4.6 v3.4 h4.6 v3.6 H124Z" fill="${roof}"/><rect x="-75" y="2" width="199.6" height="4.6" fill="${roof}"/><rect x="-75" y="2" width="199.6" height="1.1" fill="${trim}"/>`);
    D.push(`<path d="${bal}" stroke="${roof}" stroke-width="0.8" fill="none"/><g fill="${roof}">${posts}<rect x="-73.4" y="-10.6" width="196" height="1.8"/><rect x="-73.4" y="-0.6" width="196" height="1"/></g>`); }
  return { body: B.join(''), deck: D.join('') };
}

// ---------- figures ----------
export function capsule(p0, r0, p1, r1){
  const dx = p1[0] - p0[0], dy = p1[1] - p0[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  return `M${f(p0[0] + nx * r0)},${f(p0[1] + ny * r0)} L${f(p1[0] + nx * r1)},${f(p1[1] + ny * r1)} A${r1},${r1} 0 0 0 ${f(p1[0] - nx * r1)},${f(p1[1] - ny * r1)} L${f(p0[0] - nx * r0)},${f(p0[1] - ny * r0)} A${r0},${r0} 0 0 0 ${f(p0[0] + nx * r0)},${f(p0[1] + ny * r0)}Z`;
}
export const limb = (a, ra, b, rb, c, rc) => capsule(a, ra, b, rb) + ' ' + capsule(b, rb, c, rc);
// Shape with a shade band on the side away from the light. lx = +1 light from +x, -1 from -x.
export const part = (d, lit, shade, k = 2.6, lx = 1) => `<path d="${d}" fill="${shade}"/><path d="${d}" fill="${lit}" transform="translate(${k * lx},0)"/>`;
export function softShade(d, x0, x1, y0, y1, color, strength = 0.8){
  const cid = clip(d);
  return grain(Math.min(x0, x1), y0, Math.abs(x1 - x0), y1 - y0, GL(x0, 0, lerp(x0, x1, 0.62), 0, [[0, strength], [0.5, strength * 0.4], [1, 0]]), color, { clipId: cid });
}
function bootSide(ax, ay, tone, sole){
  return `<path d="M${ax - 10},${ay - 13} L${ax + 9},${ay - 13} L${ax + 10},${ay + 5} C${ax + 25},${ay + 6} ${ax + 37},${ay + 11} ${ax + 38},${ay + 19} L${ax + 38},${ay + 22} L${ax - 11},${ay + 22}Z" fill="${tone}"/><rect x="${ax - 11}" y="${ay + 18.5}" width="49" height="3.5" rx="1" fill="${sole}"/><path d="M${ax + 1},${ay - 5} h7 M${ax + 2},${ay + 1} h7" stroke="${sole}" stroke-width="1.3" opacity="0.7"/>`;
}

// ---------- ground detail and cast shadows ----------
// Blades of grass along a ground line, in two tones.
export function grass(x0, x1, yFn, { step = [9, 30], h = [14, 46], dark, light, skip } = {}){
  let a = '', b = '';
  for (let x = x0; x < x1; x += rnd(step[0], step[1])) {
    if (skip && skip(x)) continue;
    const y = yFn(x) + 5, n = 3 + Math.floor(rnd(0, 5));
    for (let k = 0; k < n; k++) {
      const bx = x + rnd(-7, 7), hh = rnd(h[0], h[1]) * (rnd() < 0.12 ? 1.8 : 1), lean = rnd(-0.5, 0.5) * hh, bw = rnd(1.3, 2.3) * (h[1] / 46);
      const d = `M${f(bx - bw)},${f(y)} Q${f(bx + lean * 0.15 - bw * 0.6)},${f(y - hh * 0.6)} ${f(bx + lean)},${f(y - hh)} Q${f(bx + lean * 0.3 + bw)},${f(y - hh * 0.5)} ${f(bx + bw)},${f(y)}Z `;
      if (rnd() < 0.24) b += d; else a += d;
    }
  }
  return `<path d="${b}" fill="${light}"/><path d="${a}" fill="${dark}"/>`;
}
// Wildflowers on stems. pos() returns [x, y, scale] or null.
export function flowers(n, pos, colors, stem){
  let s = '';
  for (let k = 0; k < n; k++) {
    const p = pos(); if (!p) continue; const [x, y, sc] = p, r = rnd(1.5, 3.1) * sc, c = pick(colors);
    s += `<path d="M${f(x)},${f(y)} v${f(rnd(5, 11) * sc)}" stroke="${stem}" stroke-width="${f(Math.max(0.8, sc))}"/>`;
    if (rnd() < 0.3) { for (let j = 0; j < 4; j++) s += `<circle cx="${f(x + rnd(-1, 1) * sc)}" cy="${f(y - j * 2.6 * sc)}" r="${f(r * (0.95 - j * 0.16))}" fill="${c}"/>`; }
    else s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${c}"/>`;
  }
  return s;
}
// Long cast shadow of a conifer on open ground. dir +1 falls to the right; slope is how fast it drops toward the viewer.
export function pineShadow(x, yb, h, w, dir, color, op, slope = 0.12, k = 1.4){
  const len = h * k, n = 7, up = [], dn = [];
  for (let i = 0; i <= n; i++) { const t = i / n, px = x + dir * len * t, py = yb + len * slope * t, hw = w * 0.36 * (1 - t) * (i % 2 ? 1 : 0.55) + 0.8; up.push([px, py - hw * 0.5]); dn.unshift([px + dir * len / n * 0.45, py + hw * 0.5]); }
  return `<path d="${poly([...up, ...dn])}" fill="${color}" opacity="${op}"/>`;
}
// Cast shadow of a standing person lying along the ground.
export function figShadow(x, y, s, dir, color, op, len = 200, slope = 0.1){
  const Ln = len * s, w = 30 * s, q = (t, o) => `${f(x + dir * Ln * t)},${f(y + Ln * slope * t + o)}`;
  return `<g fill="${color}" opacity="${op}"><path d="M${f(x - dir * w * 0.5)},${f(y - 4 * s)} L${q(0.42, -w * 0.5)} L${q(0.8, -w * 0.62)} L${q(0.84, w * 0.5)} L${q(0.42, w * 0.42)} L${f(x - dir * w * 0.5)},${f(y + 5 * s)}Z"/><ellipse cx="${f(x + dir * Ln * 0.93)}" cy="${f(y + Ln * slope * 0.93)}" rx="${f(Ln * 0.085)}" ry="${f(w * 0.36)}"/></g>`;
}
// Conifer carrying snow on the top of every bough.
export function snowPine(x, yb, h, w, tiers, tone, snow, lit){
  const g = pineGeo(x, yb, h, w, tiers, 0.2, 0.1), dir = x < SUN.x ? -1 : 1, cid = clip(g.d);
  return `<path d="${g.d}" fill="${snow}"/><g clip-path="url(#${cid})"><path d="${g.d}" fill="${lit}" transform="translate(${dir * 2.4},${f(h * 0.028 + 2)})"/><path d="${g.d}" fill="${tone}" transform="translate(${dir * 5},${f(h * 0.04 + 3.5)})"/></g>`;
}

// Three-quarter figures from the style test (kept for scenes where people talk to each other).
export function figWoman34(){
  const skin = '#EDB08C', skinSh = '#C98A70', hair = P.plumDeep;
  const jk = P.tealLight, jkSh = P.teal, jkFar = P.teal, jkFarSh = P.tealDeep;
  const pant = P.plum, pantSh = P.plumDeep, pantFar = mix(P.plum, P.plumDeep, 0.55);
  const s = [];
  s.push(part(limb([30, -390], 11, [50, -326], 10, [64, -353], 8.5), jkFar, jkFarSh));
  s.push(`<path d="M68,-392 q-4,-7 0,-13 M75,-394 q4,-7 0,-14" stroke="${P.cream}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.7"/>`);
  s.push(`<path d="M80,-380 q9,6 0,13" stroke="${P.cream}" stroke-width="3" fill="none"/><rect x="62" y="-386" width="19" height="22" rx="3.5" fill="${P.cream}"/><rect x="62" y="-378" width="19" height="4" fill="${P.coral}"/>`);
  s.push(`<circle cx="66" cy="-361" r="8" fill="${skin}"/>`);
  s.push(part(limb([17, -244], 19, [22, -128], 14.5, [27, -30], 11), pantFar, pantSh));
  s.push(`<rect x="15" y="-40" width="24" height="9" rx="2" fill="${P.haze}"/>` + bootSide(27, -22, P.ink, P.haze));
  const nl = limb([-17, -244], 20, [-21, -128], 15, [-25, -30], 11.5);
  s.push(part(nl, pant, pantSh) + softShade(nl, -46, 4, -266, -14, pantSh, 0.7));
  s.push(`<path d="M-37,-246 H40 V-214 Q22,-198 2,-206 Q-18,-198 -37,-214Z" fill="${pant}"/>`);
  s.push(`<rect x="-38" y="-40" width="26" height="9" rx="2" fill="${mix(P.haze, P.cream, 0.25)}"/>` + bootSide(-25, -22, P.ink, P.haze));
  const torso = 'M-46,-392 C-40,-404 -16,-409 -2,-409 C14,-409 30,-405 38,-394 C44,-360 40,-320 36,-290 C36,-262 40,-240 40,-226 L-40,-226 C-42,-250 -40,-280 -40,-300 C-42,-330 -50,-360 -46,-392Z';
  const tc = clip(torso);
  s.push(part(torso, jk, jkSh, 3));
  s.push(softShade(torso, -50, 44, -412, -224, jkSh));
  s.push(`<g clip-path="url(#${tc})" transform="translate(3,0)"><rect x="-60" y="-356" width="120" height="15" fill="${P.coral}"/><rect x="-60" y="-341" width="120" height="5" fill="${P.cream}"/><rect x="-60" y="-356" width="22" height="15" fill="${P.coralSh}"/><rect x="-60" y="-341" width="22" height="5" fill="${P.creamSh}"/></g>`);
  s.push(`<path d="M13,-406 L15,-226" stroke="${jkSh}" stroke-width="1.6"/><path d="M-37,-226 H43" stroke="${jkSh}" stroke-width="3"/>`);
  s.push(`<path d="${capsule([4, -428], 9, [1, -402], 10)}" fill="${skinSh}"/>`);
  s.push(part('M-12,-418 h26 a5,5 0 0 1 5,5 v8 h-36 v-8 a5,5 0 0 1 5,-5Z', P.cream, P.creamSh, 2));
  const head = 'M2,-482 C20,-482 31,-469 31,-453 C31,-447 34,-443 35,-439 C34,-435 31,-434 30,-433 C30,-429 28,-424 22,-421 C14,-417 4,-419 -6,-426 C-18,-436 -22,-446 -22,-455 C-22,-471 -14,-482 2,-482Z';
  s.push(part(head, skin, skinSh, 2.2));
  s.push(`<circle cx="9" cy="-440" r="6" fill="${P.coral}" opacity="0.22"/>`);
  s.push(`<g class="eye" data-r="1.4" fill="#241B2E"><circle cx="13" cy="-450" r="2.3"/><circle cx="27" cy="-450" r="2"/></g><path d="M17,-431 q5,2.4 10,-0.4" stroke="#A9483F" stroke-width="1.7" fill="none" stroke-linecap="round"/>`);
  s.push(`<path d="M32,-465 C32,-482 16,-492 0,-492 C-19,-492 -33,-480 -34,-460 C-36,-444 -36,-430 -33,-419 C-31,-411 -22,-408 -13,-412 C-10,-420 -13,-432 -10,-442 C-8,-451 -3,-457 6,-460 C14,-463 24,-464 32,-465Z" fill="${hair}"/><path d="M-26,-466 C-22,-480 -6,-486 10,-484" stroke="#4A3857" stroke-width="2.6" fill="none" stroke-linecap="round"/>`);
  const na = limb([-36, -388], 12.5, [-47, -318], 11, [-39, -256], 9.5);
  s.push(`<ellipse cx="-37.5" cy="-241" rx="8" ry="11" fill="${skin}" transform="rotate(-8 -37.5 -241)"/>`);
  s.push(part(na, jk, jkSh) + softShade(na, -62, -24, -402, -244, jkSh, 0.7));
  return s.join('');
}
