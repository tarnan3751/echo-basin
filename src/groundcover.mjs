// Small things that grow or lie on the ground: shrubs, far-off ferns, grass, broad-leaved weeds, flowers, clover,
// toadstools and low rises. Each takes a position on the picture and a size in pixels, so a scene can size them by
// distance. Used by the trailhead picture and the boardwalk picture.
import * as L from './lib.mjs';
const { f, rnd, pick, lerp, poly, shared } = L;

// A low shrub: overlapping rounds with a lumpy top, a dark underside, a lit edge and a few leaves picked out.
export function bush(x, y, w, h, tone, hi, dark){
  const blobs = [], n = Math.max(3, Math.round(w / 15));
  for (let i = 0; i < n; i++) { const t = n === 1 ? 0.5 : i / (n - 1), bx = x - w / 2 + w * t + rnd(-3, 3), r = (w / n) * rnd(0.75, 1.2), by = y - h * (0.3 + 0.55 * Math.sin(Math.PI * (0.08 + 0.84 * t))) * rnd(0.8, 1.05); blobs.push([bx, by, r, r * rnd(0.72, 0.95)], [bx + rnd(-4, 4), y - r * 0.45, r * 1.15, r * 0.7]); }
  const ell = ([cx, cy, rx, ry]) => `M${f(cx - rx)},${f(cy)} a${f(rx)},${f(ry)} 0 1,0 ${f(rx * 2)},0 a${f(rx)},${f(ry)} 0 1,0 ${f(-rx * 2)},0Z`, id = shared(blobs.map(ell).join(' '));
  let leaves = '';
  for (let i = 0, m = Math.round(w / 11); i < m; i++) { const b = pick(blobs), a = rnd(-2.6, -0.5), ls = Math.max(1.4, w * 0.024); leaves += `<ellipse cx="${f(b[0] + Math.cos(a) * b[2] * rnd(0.2, 0.8))}" cy="${f(b[1] + Math.sin(a) * b[3] * rnd(0.2, 0.8))}" rx="${f(ls * 1.5)}" ry="${f(ls * 0.8)}"/>`; }
  return `<use href="#${id}" fill="${dark}" transform="translate(${f(w * 0.02)},${f(h * 0.06)})"/><use href="#${id}" fill="${hi}"/><use href="#${id}" fill="${tone}" transform="translate(${f(w * 0.014)},${f(h * 0.035)})"/><g fill="${hi}" fill-opacity="0.8">${leaves}</g>`;
}

// A thicket of willow seen from across a meadow: a clump of upright leafy shoots, tallest toward the middle, each one
// dark with the side toward the sun lit. Tall shoots are drawn first, so the shorter ones stand in front of them.
// Drawn about the middle of its foot. sun: +1 when the light comes from the right. Returns the drawing, and the
// outline of the whole clump for laying its shadow. Uses a random source of its own.
export function thicket(w, h, C, { seed = 1, sun = 1 } = {}){
  const r = L.source(seed * 613 + 29), n = Math.max(5, Math.round(w / 4.4)), shoots = [];
  for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; shoots.push({ cx: -w / 2 + w * t + r(-0.3, 0.3) * w / n, hh: h * (0.4 + 0.6 * Math.sin(Math.PI * (0.1 + 0.8 * t))) * r(0.6, 1.15), bw: w / n * r(0.95, 1.5), by: r(-0.5, 0.7) }); }
  shoots.sort((a, b) => b.hh - a.hh);
  let all = '', out = '';
  for (const q of shoots) {
    // a shoot: a leafy plume, widest a third of the way up, with a tip that leans a little
    const tx = q.cx + r(-0.7, 0.7) * q.bw, ty = q.by - q.hh, wide = q.by - q.hh * 0.4;
    const d = `M${f(q.cx - q.bw * 0.6)},${f(q.by)}C${f(q.cx - q.bw * 1.5)},${f(wide)} ${f(tx - q.bw * 0.7)},${f(ty + q.hh * 0.2)} ${f(tx)},${f(ty)}C${f(tx + q.bw * 0.7)},${f(ty + q.hh * 0.2)} ${f(q.cx + q.bw * 1.5)},${f(wide)} ${f(q.cx + q.bw * 0.6)},${f(q.by)}Z`;
    all += d;
    // light on the sunward flank, a narrow crescent that does not reach the foot
    out += `<path d="${d}" fill="${C.tone}"/><path d="M${f(tx)},${f(ty)}C${f(tx + sun * q.bw * 0.7)},${f(ty + q.hh * 0.2)} ${f(q.cx + sun * q.bw * 1.5)},${f(wide)} ${f(q.cx + sun * q.bw * 0.75)},${f(q.by - q.hh * 0.14)}C${f(q.cx + sun * q.bw * 0.95)},${f(wide)} ${f(tx + sun * q.bw * 0.3)},${f(ty + q.hh * 0.3)} ${f(tx)},${f(ty)}Z" fill="${C.lit}"/>`;
  }
  return { svg: out, shape: `<path d="${all}"/>` };
}

// A fern seen from far enough off that its leaflets cannot be made out: each frond is one arching blade.
export function fernlet(x, y, s, tone, shade){
  let a = '', b = ''; const r = Math.round;
  for (let k = 0; k < 6; k++) { const ang = lerp(-1.25, 1.25, k / 5) + rnd(-0.1, 0.1), len = s * rnd(0.75, 1.1), tx = x + Math.sin(ang) * len, ty = y - Math.cos(ang) * len * 0.62, bw = s * 0.13, d = `M${r(x)},${r(y)}Q${r(lerp(x, tx, 0.45) - bw * 0.3)},${r(lerp(y, ty, 0.9) - bw)} ${r(tx)},${r(ty)}Q${r(lerp(x, tx, 0.6) + bw * 0.5)},${r(lerp(y, ty, 0.5))} ${r(x)},${r(y)}Z`; if (k % 2) b += d; else a += d; }
  return `<path d="${b}" fill="${shade}"/><path d="${a}" fill="${tone}"/>`;
}

// a clump of grass: blades fanning from one root, a few of them catching the light, now and then a seed head
export function tuft(x, y, s, dark, light, seed){
  let a = '', b = '', extra = ''; const r = Math.round;
  for (let k = 0, n = 4 + Math.floor(rnd(0, 5)); k < n; k++) {
    const bx = x + rnd(-0.16, 0.16) * s, hh = s * rnd(0.42, 1), lean = rnd(-0.5, 0.5) * hh, bw = Math.max(0.8, s * rnd(0.03, 0.055));
    const d = `M${f(bx - bw)},${r(y)}Q${r(bx + lean * 0.15 - bw * 0.6)},${r(y - hh * 0.6)} ${r(bx + lean)},${r(y - hh)}Q${r(bx + lean * 0.3 + bw)},${r(y - hh * 0.5)} ${f(bx + bw)},${r(y)}Z`;
    if (rnd() < 0.3) b += d; else a += d;
  }
  if (seed && rnd() < 0.3) { const hh = s * rnd(1.05, 1.5), lean = rnd(-0.25, 0.25) * hh, tx = x + lean, ty = y - hh; extra = `<path d="M${r(x)},${r(y)}Q${r(x + lean * 0.2)},${r(y - hh * 0.6)} ${r(tx)},${r(ty)}" fill="none" stroke="${seed}" stroke-width="${f(Math.max(0.6, s * 0.022))}"/><ellipse cx="${f(tx + lean * 0.06)}" cy="${f(ty - s * 0.06)}" rx="${f(Math.max(0.9, s * 0.035))}" ry="${f(Math.max(2, s * 0.12))}" fill="${seed}" transform="rotate(${r(lean / hh * 50)} ${r(tx)} ${r(ty)})"/>`; }
  return `<path d="${a}" fill="${dark}"/>` + (b ? `<path d="${b}" fill="${light}"/>` : '') + extra;
}
// a broad-leaved weed: a rosette of pointed leaves lying out from the middle, each with its midrib
export function rosette(x, y, s, tone, rib){
  let d = '', r = '';
  for (let k = 0, n = 5 + Math.floor(rnd(0, 3)); k < n; k++) {
    const a = lerp(-1.4, 1.4, k / (n - 1)) + rnd(-0.12, 0.12), len = s * rnd(0.7, 1), tx = x + Math.sin(a) * len, ty = y - Math.cos(a) * len * 0.62 - s * 0.05, wx = Math.cos(a) * len * 0.2, wy = Math.sin(a) * len * 0.13;
    d += `M${f(x)},${f(y)} Q${f((x + tx) / 2 - wx)},${f((y + ty) / 2 - wy - 1)} ${f(tx)},${f(ty)} Q${f((x + tx) / 2 + wx)},${f((y + ty) / 2 + wy)} ${f(x)},${f(y)}Z `;
    r += `M${f(x)},${f(y)} L${f(lerp(x, tx, 0.86))},${f(lerp(y, ty, 0.86))} `;
  }
  return `<path d="${d}" fill="${tone}"/><path d="${r}" stroke="${rib}" stroke-width="${f(Math.max(0.5, s * 0.03))}" fill="none" opacity="0.7"/>`;
}
// Flowers, each drawn as what it is. s is the height of the plant in pixels.
export function flower(kind, x, y, s, C){
  const sw = f(Math.max(0.6, s * 0.035)), lean = rnd(-0.18, 0.18) * s, tx = x + lean, ty = y - s;
  const stem = `<path d="M${f(x)},${f(y)} Q${f(x + lean * 0.2)},${f(y - s * 0.6)} ${f(tx)},${f(ty)}" fill="none" stroke="${C.stem}" stroke-width="${sw}" stroke-linecap="round"/>`;
  const leaf = `<path d="M${f(x + lean * 0.3)},${f(y - s * 0.34)} q${f(s * 0.16)},${f(-s * 0.1)} ${f(s * 0.24)},${f(-s * 0.02)} q${f(-s * 0.1)},${f(s * 0.07)} ${f(-s * 0.24)},${f(s * 0.02)}Z" fill="${C.stem}"/>`;
  if (kind === 'daisy') {
    // eight petals as one star, seen a little from above, round a gold eye
    const r = Math.max(2, s * 0.17), pts = [];
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, k = i % 2 ? 0.42 : 1; pts.push([tx + Math.cos(a) * r * k, ty + Math.sin(a) * r * k * 0.72]); }
    return stem + leaf + `<path d="${poly(pts)}" fill="${C.cream}" stroke="${C.cream}" stroke-width="${f(r * 0.3)}" stroke-linejoin="round"/><ellipse cx="${f(tx)}" cy="${f(ty)}" rx="${f(r * 0.34)}" ry="${f(r * 0.27)}" fill="${C.gold}"/>`;
  }
  if (kind === 'poppy') {
    const r = Math.max(2, s * 0.2);
    return stem + leaf + `<path d="M${f(tx - r)},${f(ty)} C${f(tx - r)},${f(ty - r * 1.1)} ${f(tx - r * 0.1)},${f(ty - r * 1.2)} ${f(tx)},${f(ty - r * 0.3)} C${f(tx + r * 0.1)},${f(ty - r * 1.2)} ${f(tx + r)},${f(ty - r * 1.1)} ${f(tx + r)},${f(ty)} C${f(tx + r)},${f(ty + r * 0.7)} ${f(tx - r)},${f(ty + r * 0.7)} ${f(tx - r)},${f(ty)}Z" fill="${C.coral}"/><path d="M${f(tx - r)},${f(ty)} C${f(tx - r * 0.5)},${f(ty + r * 0.5)} ${f(tx + r * 0.5)},${f(ty + r * 0.5)} ${f(tx + r)},${f(ty)} C${f(tx + r)},${f(ty + r * 0.7)} ${f(tx - r)},${f(ty + r * 0.7)} ${f(tx - r)},${f(ty)}Z" fill="${C.coralSh}"/><circle cx="${f(tx)}" cy="${f(ty - r * 0.1)}" r="${f(r * 0.22)}" fill="${C.ink}"/>`;
  }
  if (kind === 'lupine') {
    let p = '', q = ''; const n = 7;
    for (let i = 0; i < n; i++) { const t = i / (n - 1), px = lerp(x + lean * 0.5, tx, t), py = lerp(y - s * 0.45, ty, t), w = s * 0.085 * (1 - 0.65 * t) + 0.7, e = `<ellipse cx="${f(px + (i % 2 ? -1 : 1) * w * 0.55)}" cy="${f(py)}" rx="${f(w)}" ry="${f(w * 0.72)}"/>`; if (i % 3 === 0) q += e; else p += e; }
    let lf = ''; for (let i = 0; i < 5; i++) { const a = lerp(-1.2, 1.2, i / 4); lf += `M${f(x + lean * 0.2)},${f(y - s * 0.28)} l${f(Math.sin(a) * s * 0.2)},${f(-Math.cos(a) * s * 0.13)} `; }
    return stem + `<path d="${lf}" stroke="${C.stem}" stroke-width="${f(Math.max(0.8, s * 0.05))}" stroke-linecap="round" fill="none"/><g fill="${C.violet}">${p}</g><g fill="${C.lilac}">${q}</g>`;
  }
  if (kind === 'umbel') {
    let rays = '', dots = '';
    for (let i = 0; i < 5; i++) { const a = lerp(-0.9, 0.9, i / 4), rx = tx + Math.sin(a) * s * 0.26, ry = ty - Math.cos(a) * s * 0.1 + s * 0.02; rays += `M${f(tx)},${f(ty + s * 0.16)} L${f(rx)},${f(ry)} `; for (let j = 0; j < 3; j++) dots += `<circle cx="${f(rx + rnd(-1, 1) * s * 0.06)}" cy="${f(ry + rnd(-1, 0.4) * s * 0.035)}" r="${f(Math.max(0.9, s * 0.04))}"/>`; }
    return stem + `<path d="${rays}" stroke="${C.stem}" stroke-width="${f(Math.max(0.5, s * 0.022))}" fill="none"/><g fill="${C.cream}">${dots}</g>`;
  }
  // buttercup: a few small gold cups on one branching stem
  let cups = '';
  for (const [dx, dy] of [[0, 0], [-0.2, 0.22], [0.22, 0.3]]) { const cx = tx + dx * s, cy = ty + dy * s, r = Math.max(1.4, s * 0.11); cups += `<path d="M${f(x + lean * 0.4)},${f(y - s * 0.5)} L${f(cx)},${f(cy)}" stroke="${C.stem}" stroke-width="${sw}" fill="none"/><circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${C.gold}"/><circle cx="${f(cx)}" cy="${f(cy + r * 0.15)}" r="${f(r * 0.4)}" fill="${C.goldSh}"/>`; }
  return stem + leaf + cups;
}
// a patch of clover: small round leaves in two greens with a few pale heads
export function clover(x, y, s, C){
  let a = '', b = '', hd = '';
  for (let i = 0; i < 10; i++) { const e = `<circle cx="${f(x + rnd(-1, 1) * s)}" cy="${f(y + rnd(-0.26, 0.2) * s)}" r="${f(Math.max(1, s * rnd(0.07, 0.12)))}"/>`; if (i % 3) a += e; else b += e; }
  for (let i = 0; i < 3; i++) hd += `<circle cx="${f(x + rnd(-0.8, 0.8) * s)}" cy="${f(y + rnd(-0.34, 0) * s)}" r="${f(Math.max(1.2, s * 0.11))}"/>`;
  return `<g fill="${C.leafDark}">${a}</g><g fill="${C.leaf}">${b}</g><g fill="${C.clover}">${hd}</g>`;
}
// three toadstools
export const toadstools = (x, y, s, C) => [[0, 0, 1], [-0.9, 0.12, 0.7], [0.8, 0.2, 0.55]].map(([dx, dy, k]) => { const cx = x + dx * s, cy = y + dy * s * 0.5, r = s * 0.42 * k; return `<path d="M${f(cx - r * 0.2)},${f(cy)} L${f(cx - r * 0.16)},${f(cy - r * 1.1)} h${f(r * 0.32)} L${f(cx + r * 0.2)},${f(cy)}Z" fill="${C.cream}"/><path d="M${f(cx - r)},${f(cy - r * 1.05)} C${f(cx - r)},${f(cy - r * 2)} ${f(cx + r)},${f(cy - r * 2)} ${f(cx + r)},${f(cy - r * 1.05)}Z" fill="${C.coral}"/><path d="M${f(cx)},${f(cy - r * 1.75)} C${f(cx + r * 0.7)},${f(cy - r * 1.7)} ${f(cx + r)},${f(cy - r * 1.4)} ${f(cx + r)},${f(cy - r * 1.05)} H${f(cx + r * 0.2)}Z" fill="${C.coralSh}"/><circle cx="${f(cx - r * 0.4)}" cy="${f(cy - r * 1.42)}" r="${f(Math.max(0.7, r * 0.13))}" fill="${C.cream}"/><circle cx="${f(cx + r * 0.1)}" cy="${f(cy - r * 1.6)}" r="${f(Math.max(0.6, r * 0.1))}" fill="${C.cream}"/>`; }).join('');
// a low rise in the ground: lit along its crest on the side the light comes from, darker in its lee
export function hummock(x, y, w, h, lit, shade){
  return `<path d="M${f(x - w / 2)},${f(y)} C${f(x - w * 0.3)},${f(y - h * 1.2)} ${f(x + w * 0.1)},${f(y - h * 1.25)} ${f(x + w / 2)},${f(y)} C${f(x + w * 0.2)},${f(y + h * 0.3)} ${f(x - w * 0.2)},${f(y + h * 0.3)} ${f(x - w / 2)},${f(y)}Z" fill="${lit}"/><path d="M${f(x - w * 0.02)},${f(y - h * 0.92)} C${f(x + w * 0.24)},${f(y - h * 0.86)} ${f(x + w * 0.4)},${f(y - h * 0.5)} ${f(x + w / 2)},${f(y)} C${f(x + w * 0.28)},${f(y + h * 0.26)} ${f(x + w * 0.02)},${f(y + h * 0.26)} ${f(x - w * 0.16)},${f(y + h * 0.18)} C${f(x + w * 0.06)},${f(y - h * 0.1)} ${f(x + w * 0.08)},${f(y - h * 0.5)} ${f(x - w * 0.02)},${f(y - h * 0.92)}Z" fill="${shade}" opacity="0.3"/>`;
}
