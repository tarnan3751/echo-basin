// Detail for mountain ranges drawn with lib.range(): the ribs, runnels and bright skyline that keep a big flat face
// from looking like card, and snow caps with a ragged lower edge. Used by the Pass Hut pictures and the lake.
import * as L from './lib.mjs';
const { f, lerp, poly } = L;

// Relief on the snow faces of a range. The big faces are one flat tone each, lit or shaded, which leaves them looking
// like card. Real faces are ribbed. So, hanging off each main ridge: small facets of shade on the lit side, where a rib
// running down the face turns its back to the sun, and deeper facets on the shaded side close under the ridge. Ribs
// that come down from the skyline throw a sliver of shade on the lit face, and on the shaded face they catch a
// little light from the sky. rim is the skyline on the sunward side of each summit, drawn as a bright edge.
export function ribs(peaks, seed, k = 1){
  const r = L.source(seed), out = { cut: '', deep: '', lift: '', rim: '', fluteLit: '', fluteSh: '' };
  const at = (line, t) => { const u = Math.max(0, Math.min(line.length - 1.001, t * (line.length - 1))), i = Math.floor(u), q = u - i; return [lerp(line[i][0], line[i + 1][0], q), lerp(line[i][1], line[i + 1][1], q)]; };
  const unit = (dx, dy) => { const l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; };
  for (const p of peaks) {
    const top = [p.x, p.y], ridge = [top, ...p.ridge], end = ridge[ridge.length - 1], down = unit(end[0] - top[0], end[1] - top[1]);
    const fl = p.edgeLit[p.edgeLit.length - 1], fs = p.edge[p.edge.length - 1], fallLit = unit(fl[0] - top[0], fl[1] - top[1]), fallSh = unit(fs[0] - top[0], fs[1] - top[1]);
    const facet = (S, B, dir, len, jag) => { const tip = [S[0] + dir[0] * len, S[1] + dir[1] * len], m1 = [lerp(S[0], tip[0], 0.5) + r(-1, 1) * jag, lerp(S[1], tip[1], 0.5) + r(-1, 1) * jag], m2 = [lerp(tip[0], B[0], 0.5) + r(-1, 1) * jag, lerp(tip[1], B[1], 0.5) + r(-1, 1) * jag]; return poly([S, m1, tip, m2, B]) + ' '; };
    const n = p.hgt > 230 * k ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const t0 = lerp(0.14, 0.78, (i + r(0.1, 0.9)) / n), t1 = Math.min(0.97, t0 + r(0.07, 0.14)), mL = r(0.4, 0.7);
      out.cut += facet(at(ridge, t0), at(ridge, t1), unit(lerp(down[0], fallLit[0], mL), lerp(down[1], fallLit[1], mL)), p.hgt * (1.05 - t0 * 0.5) * r(0.16, 0.28), 2.4 * k);
      if (r() < 0.75) { const t2 = lerp(0.1, 0.8, r()), t3 = Math.min(0.97, t2 + r(0.08, 0.16)), mS = r(0.35, 0.65); out.deep += facet(at(ridge, t2), at(ridge, t3), unit(lerp(down[0], fallSh[0], mS), lerp(down[1], fallSh[1], mS)), p.hgt * (1.05 - t2 * 0.5) * r(0.18, 0.3), 2.4 * k); }
    }
    for (let i = 0, m = p.edgeLit.length > 5 ? 2 : 1; i < m; i++) { const S = at(p.edgeLit, lerp(0.25, 0.75, (i + r(0.2, 0.8)) / m)), len = p.hgt * r(0.14, 0.24), dir = unit(down[0] + 0.25 * p.dir, down[1]); out.cut += facet(S, [S[0] + dir[0] * len * 0.5 + p.dir * len * r(0.1, 0.18), S[1] + dir[1] * len * 0.45], dir, len, 2 * k); }
    for (let i = 0, m = p.edge.length > 5 ? 2 : 1; i < m; i++) { const S = at(p.edge, lerp(0.2, 0.75, (i + r(0.2, 0.8)) / m)), len = p.hgt * r(0.16, 0.28), dir = unit(down[0] - 0.3 * p.dir, down[1]); out.lift += facet(S, [S[0] + dir[0] * len * 0.5 - p.dir * len * r(0.1, 0.2), S[1] + dir[1] * len * 0.45], dir, len, 2 * k); }
    // flutes: thin runnels the sliding snow has cut down the steep faces
    for (let i = 0, nf = 4 + Math.floor(r(0, 3)); i < nf; i++) {
      const lit = r() < 0.6, edge = lit ? p.edgeLit : p.edge, fall = lit ? fallLit : fallSh, t = r(0.28, 0.72), a = at(ridge, t), b = at(edge, Math.min(1, t * r(0.9, 1.3))), u = r(0.2, 0.7);
      const S = [lerp(a[0], b[0], u), lerp(a[1], b[1], u)], dir = unit(lerp(down[0], fall[0], u * 0.8), lerp(down[1], fall[1], u * 0.8)), len = p.hgt * r(0.06, 0.13), bend = r(-1, 1) * len * 0.06;
      const d = `M${f(S[0])},${f(S[1])} q${f(dir[0] * len * 0.5 + bend)},${f(dir[1] * len * 0.5)} ${f(dir[0] * len)},${f(dir[1] * len)} `;
      if (lit) out.fluteLit += d; else out.fluteSh += d;
    }
    out.rim += 'M' + p.edgeLit.slice(0, Math.max(2, Math.ceil(p.edgeLit.length * 0.6))).map(q => `${f(q[0])},${f(q[1])}`).join(' L') + ' ';
  }
  return out;
}

// Snow on the peaks that carry it (the ones range() was told about). It lies from the summit down both skylines and
// ends in a ragged hem: tongues of snow reaching down the gullies, ribs of rock standing up between them, no two
// alike, and a few patches left lower down where a gully holds it. One outline for all the peaks; the caller paints
// it and lays the shade of the dark faces over it.
export function snowcaps(peaks, seed, { depth = 0.29 } = {}){
  const r = L.source(seed), unit = (dx, dy) => { const l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; };
  let d = '';
  for (const p of peaks) {
    if (!p.snow) continue;
    const top = [p.x, p.y], ridge = [top, ...p.ridge], end = ridge[ridge.length - 1], down = unit(end[0] - top[0], end[1] - top[1]), capH = p.hgt * depth;
    // the point on a line running down from the summit where it has dropped by a given amount
    const drop = (line, dy) => { for (let i = 1; i < line.length; i++) if (line[i][1] - p.y >= dy) { const a = line[i - 1], b = line[i], t = (p.y + dy - a[1]) / ((b[1] - a[1]) || 1); return { i, pt: [lerp(a[0], b[0], t), p.y + dy] }; } return { i: line.length - 1, pt: line[line.length - 1] }; };
    const A = drop(p.edgeLit, capH * r(0.9, 1.2)), B = drop(p.edge, capH * r(0.75, 1.05)), M = drop(ridge, capH * r(0.75, 1)).pt;
    const fl = p.edgeLit[p.edgeLit.length - 1], fs = p.edge[p.edge.length - 1], fallLit = unit(down[0] + (fl[0] - top[0]) / p.hgt * 0.5, down[1]), fallSh = unit(down[0] + (fs[0] - top[0]) / p.hgt * 0.5, down[1]);
    // the hem between two points: rock standing up into the snow, then a tongue of snow running down a gully, by
    // turns. Tongues are different lengths, and the longer ones end square instead of in a point.
    const hem = (P0, P1, fall) => {
      const out = [], n = 3 + Math.floor(r(0, 2.6)), ax = (P1[0] - P0[0]) / n, ay = (P1[1] - P0[1]) / n;
      for (let j = 1; j <= n; j++) {
        const a = (j - r(0.38, 0.62)) / n, up = capH * r(0.05, 0.2); out.push([lerp(P0[0], P1[0], a) - fall[0] * up, lerp(P0[1], P1[1], a) - fall[1] * up]);
        if (j === n) break;
        const b = (j + r(-0.1, 0.1)) / n, dn = capH * r(0.08, 0.4), bx = lerp(P0[0], P1[0], b) + fall[0] * dn, by = lerp(P0[1], P1[1], b) + fall[1] * dn;
        if (dn > capH * 0.22) { const w = r(0.1, 0.2); out.push([bx - ax * w, by - ay * w - capH * r(0, 0.05)], [bx + ax * w, by + ay * w]); } else out.push([bx, by]);
      }
      return out;
    };
    d += poly([A.pt, ...p.edgeLit.slice(1, A.i).reverse(), top, ...p.edge.slice(1, B.i), B.pt, ...hem(B.pt, M, fallSh), [M[0] + down[0] * capH * 0.12, M[1] + down[1] * capH * 0.12], ...hem(M, A.pt, fallLit)]) + ' ';
    // a sliver or two of snow left in a gully just under the hem
    for (const [P0, fall] of [[B.pt, fallSh], [A.pt, fallLit]]) for (let j = 0, n = r() < 0.65 ? 1 : 0; j < n; j++) {
      const a = r(0.25, 0.75), S = [lerp(P0[0], M[0], a) + fall[0] * capH * r(0.42, 0.62), lerp(P0[1], M[1], a) + fall[1] * capH * r(0.42, 0.62)], len = capH * r(0.16, 0.34), w = capH * r(0.02, 0.04), nx = -fall[1], ny = fall[0];
      d += poly([S, [S[0] + fall[0] * len * 0.45 + nx * w, S[1] + fall[1] * len * 0.45 + ny * w], [S[0] + fall[0] * len, S[1] + fall[1] * len], [S[0] + fall[0] * len * 0.55 - nx * w, S[1] + fall[1] * len * 0.55 - ny * w]]) + ' ';
    }
  }
  return d;
}
