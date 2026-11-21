// An elk, seen from the side. It is built from the animal's own landmarks (withers, croup, stifle, hock, poll) so
// that it has a shoulder, a haunch and jointed legs, and so that the same animal can stand alert, graze, hold its
// head level or lie down. Everything is drawn facing left, about 100 tall at the shoulder, with the ground at y = 0
// under the middle of the body; the picture flips and scales it.
// Like the people and the trees elsewhere, each part is a shaded shape with a lit copy slid toward the sun over
// it, and a thin warm rim shows on the sunward edge.
import * as L from './lib.mjs';
import { smooth } from './snowkit.mjs';
const { f, lerp, mix, poly, grain, GL } = L;

// A limb from a list of joints [x, y, width]: one outline running down one side and back up the other.
const limb = j => { const a = [], b = []; for (let i = 0; i < j.length; i++) { const p = j[Math.max(0, i - 1)], q = j[Math.min(j.length - 1, i + 1)], dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1, w = j[i][2] / 2; a.push([j[i][0] - dy / l * w, j[i][1] + dx / l * w]); b.unshift([j[i][0] + dy / l * w, j[i][1] - dx / l * w]); } return poly([...a, ...b]); };
// A curve that tapers from one width to another: an antler beam or a tine.
const taper = (pts, w0, w1) => limb(pts.map((p, i) => [p[0], p[1], lerp(w0, w1, i / (pts.length - 1))]));
const quad = (A, B, C, n = 6) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n; return [(1 - t) * (1 - t) * A[0] + 2 * t * (1 - t) * B[0] + t * t * C[0], (1 - t) * (1 - t) * A[1] + 2 * t * (1 - t) * B[1] + t * t * C[1]]; });
const cubic = (A, B, C, D, n = 9) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n, s = 1 - t; return [s * s * s * A[0] + 3 * s * s * t * B[0] + 3 * s * t * t * C[0] + t * t * t * D[0], s * s * s * A[1] + 3 * s * s * t * B[1] + 3 * s * t * t * C[1] + t * t * t * D[1]]; });

// Where the head is carried: the poll (the top of the skull, between the ears) and how far the face is tipped down.
const POSE = { alert: { poll: [-61, -150], a: 14, ear: [-15, -15] }, level: { poll: [-76, -119], a: 6, ear: [-17, -11] }, graze: { poll: [-84, -47], a: 72, ear: [-18, -7] }, bed: { poll: [-58, -104], a: 12, ear: [-15, -15] } };

// Colours for an elk in this light. P is the picture's palette.
export const elkColours = P => { const body = mix(mix(P.peach, P.window, 0.26), P.haze, 0.3), dark = mix(P.plum, P.coralSh, 0.3), neck = mix(dark, P.haze, 0.16);
  return { body, bodySh: mix(body, P.plum, 0.36), bodyDeep: mix(body, P.plumDeep, 0.6), neck, neckLit: mix(neck, P.peach, 0.3), leg: dark, legLit: mix(dark, P.peach, 0.3), legFar: mix(dark, P.plumDeep, 0.6), head: mix(neck, P.peach, 0.16), nose: P.plumDeep, patch: mix(P.cream, body, 0.22), patchSh: mix(mix(P.cream, body, 0.5), P.haze, 0.3), tail: mix(P.cream, body, 0.62), antler: mix(P.cream, P.haze, 0.3), antlerSh: mix(P.haze, P.plum, 0.35), hoof: P.plumDeep, rim: P.rim, eye: P.ink }; };

// kind: 'bull', 'spike' (a young bull with small antlers), 'cow' or 'calf'. pose: see POSE. lx: +1 when the sun is
// on the animal's tail side, -1 when it is on the side it faces. stride: how far each hoof stands back (+) or
// forward (-) of square, for the near fore, far fore, near hind and far hind legs. detail: false for an animal far
// off. Returns the drawing and the id of its outline, which the picture uses again to lay the animal's shadow.
export function elk(C, o = {}){
  const { kind = 'cow', pose = 'alert', lx = 1, seed = 1, stride = [0, -8, 0, -9], detail = true, tip = 0, lift = 0 } = o;
  const r = L.source(seed * 977 + 5), bull = kind === 'bull', male = bull || kind === 'spike', calf = kind === 'calf', bed = pose === 'bed', dy = bed ? 47 : 0, ps = POSE[pose] || POSE.alert;
  const Y = y => y + dy, sil = [], out = [];
  // ---- the trunk
  const deep = bull ? 3 : calf ? -3 : 0, hump = bull ? 3 : 0;
  const T = [[-30, -103 - hump], [-13, -97.6], [8, -96], [30, -99], [46, -95], [55, -86], [58, -73], [55, -60], [49, -51], [36, -48 + (bed ? 3 : 0)], [23, -55 + deep * 0.3 + (bed ? 7 : 0)], [0, -47.6 + deep], [-22, -44.6 + deep], [-38, -46 + deep], [-51, -58], [-55, -76], [-46, -94]].map(([x, y]) => [x, Y(y)]);
  const torso = smooth(T, true, 0.9);
  // ---- legs: near and far, fore and hind. The hock is the joint that points backward halfway down the hind leg.
  const fore = d => [[-40, -60, 17], [-39.5 + d * 0.3, -34, 9.6], [-39 + d * 0.48, -29, 7.6], [-38.6 + d * 0.56, -24, 5.8], [-38.2 + d, -10, 5.2], [-38.4 + d, -4.4, 6.6]];
  const hind = d => [[44, -62, 26], [47 + d * 0.3, -41, 13.5], [49 + d * 0.46, -35.5, 9.4], [46.8 + d * 0.58, -28, 6.6], [45.6 + d, -10, 5.6], [45 + d, -4.4, 7]];
  const foreHoof = d => poly([[-42.8 + d, -5], [-34.6 + d, -5], [-34 + d, 0], [-45.4 + d, 0]]), hindHoof = d => poly([[40.8 + d, -5], [49.4 + d, -5], [50 + d, 0], [38.4 + d, 0]]);
  let legNear = '', legFar = '', hoofs = '';
  if (!bed) { legFar = limb(fore(stride[1])) + ' ' + limb(hind(stride[3])); legNear = limb(fore(stride[0])) + ' ' + limb(hind(stride[2])); hoofs = foreHoof(stride[0]) + foreHoof(stride[1]) + hindHoof(stride[2]) + hindHoof(stride[3]); }
  else { legNear = poly([[-36, -14], [-56, -13], [-66, -8], [-66, -2], [-58, 0], [-34, 0]]) + ' ' + poly([[24, -10], [50, -15], [62, -8], [61, -1], [52, 0], [26, 0]]); hoofs = poly([[-46, -4.6], [-37, -4], [-37, 0], [-48, 0]]) + poly([[60, -6], [66, -5.4], [67, 0], [58, 0]]); }
  // ---- head and neck
  const hk = calf ? 0.9 : bull ? 1.04 : 0.97, a = (ps.a + tip) * Math.PI / 180, PL = [ps.poll[0], ps.poll[1] - lift + (calf && !bed ? 6 : 0)], ux = -Math.cos(a), uy = Math.sin(a), vx = Math.sin(a), vy = Math.cos(a);
  const M = (u, v) => [PL[0] + (u * ux + v * vx) * hk, PL[1] + (u * uy + v * vy) * hk], MM = pts => pts.map(([u, v]) => M(u, v));
  const head = smooth(MM([[-5, -1], [-1, -6.4], [10, -8], [22, -6.8], [33, -5.2], [40.6, -3.6], [44.4, 0.6], [43.6, 6.2], [38.6, 9.8], [30, 9.8], [20, 10.6], [10, 14.4], [1, 13.2], [-5, 6]]), true, 0.7);
  const nose = poly(MM([[38.6, -4], [41.6, -3.2], [44.6, 0.6], [43.6, 6.2], [40, 9], [38.2, 2.6]]));
  const ear = (tipUV, k) => { const el = Math.hypot(tipUV[0], tipUV[1]), px = -tipUV[1] / el, py = tipUV[0] / el, b1 = M(1.6, -5.6), b2 = M(-5, 0.4), t = M(tipUV[0], tipUV[1]), m1 = M(tipUV[0] * 0.5 + px * 5.4 + 1, tipUV[1] * 0.5 + py * 5.4 - 2.6), m2 = M(tipUV[0] * 0.56 - px * 4.6 - 2, tipUV[1] * 0.56 - py * 4.6 + 1.6); return `M${f(b1[0])},${f(b1[1])} Q${f(m1[0])},${f(m1[1])} ${f(t[0])},${f(t[1])} Q${f(m2[0])},${f(m2[1])} ${f(b2[0])},${f(b2[1])}Z`; };
  const earNear = ear(ps.ear, 1), earFar = ear([ps.ear[0] + 8, ps.ear[1] - 4.5], 1);
  // The neck. W is the withers, Pt the back of the skull, J the throat under the jaw, Cf where the underside of the
  // neck meets the chest, Br the bottom of the dark hair on the chest.
  const maneK = bull ? 1 : calf ? 0 : 0.5, graze = pose === 'graze';
  const W = [-23, Y(-101.6 - hump)], Br = [-45, Y(-50 + deep)], Pt = M(-4, -3), J = M(3, 13), Cf = graze ? [-55.8, Y(-65 + deep * 0.5)] : [-55.4, Y(-76)];
  const side = (A, B) => { const dx = B[0] - A[0], dy = B[1] - A[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; };      // the outward side of a line from A to B
  // the top of the neck. Head up, it rises from the withers in a slight outward curve. Head down, it carries on
  // forward from the line of the back, over the point of the shoulder, and then bends down to the skull, so the
  // neck leaves the body across the whole front of the shoulder and nothing of the chest shows above it.
  let crest;
  if (graze) crest = cubic(W, [W[0] - 29, W[1] - 11], [Pt[0] + 15.6, Pt[1] - 23.4], Pt, 10);
  else { const n = side(W, Pt), dx = Pt[0] - W[0], dy = Pt[1] - W[1]; crest = cubic(W, [W[0] + dx * 0.33 + n[0] * 6, W[1] + dy * 0.33 + n[1] * 6], [W[0] + dx * 0.67 + n[0] * 6, W[1] + dy * 0.67 + n[1] * 6], Pt, 8); }
  // the underside of the neck, fuller on a bull, with the long hair of the mane hanging from it in locks
  const nT = side(J, Cf), kT = graze ? 2 + 3 * maneK : 6 + 7 * maneK;
  const throat = quad(J, [(J[0] + Cf[0]) / 2 + nT[0] * kT, (J[1] + Cf[1]) / 2 + nT[1] * kT], Cf, 10);
  const chest = graze ? [[-52.6, Y(-57 + deep)]] : [[-55.8, Y(-66 + deep * 0.5)], [-52.6, Y(-57 + deep)]];
  let locks = '';
  if (maneK && !(graze && !bull)) for (let i = 3; i <= 10; i += bull ? 1 : 2) { const p = throat[i], q = throat[i - 1], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, len = (2.4 + 4.6 * maneK) * r(0.45, 1.4) * (graze ? 0.7 : 1); if (r() < 0.22) continue; locks += poly([q, [mx + nT[0] * len * 0.5 + r(-0.6, 0.6), my + nT[1] * len * 0.5 + len * 0.7], p, [mx - nT[0] * 3, my - nT[1] * 3]]) + ' '; }
  // Where the dark hair of the neck gives way to the coat of the body. It is not a ruled line: it comes down from
  // the withers behind the shoulder and swings forward round it to the chest, and it wavers along the way, as the
  // edge of a patch of longer hair does. The wavering dies out at both ends so the line still meets them cleanly.
  const nE = side(Br, W), ph1 = r(0, 6.283), ph2 = r(0, 6.283), amp = calf ? 0.9 : bull ? 2.6 : 2;
  const edge = cubic(Br, [Br[0] + 15, Br[1] - 12], [W[0] + 9, W[1] + 24], W, 24).map((q, i) => { const t = i / 24, w = Math.sin(Math.PI * t) * amp * (0.7 * Math.sin(t * 15 + ph1) + 0.45 * Math.sin(t * 31 + ph2)); return [q[0] + nE[0] * w, q[1] + nE[1] * w]; });
  const neck = poly([...crest, ...throat, ...chest, ...edge.slice(0, -1)]);
  // the edge of the neck that the light catches: its top when the sun is behind the animal, its front when the sun is ahead
  const neckLit = 'M' + (lx > 0 ? crest : [...throat, ...chest, Br]).map(q => `${f(q[0])},${f(q[1])}`).join(' L');
  // ---- antlers: a long beam sweeping up and back, with tines standing forward off it
  let antNear = '', antFar = '';
  if (male) {
    const A = bull ? 0.94 : 0.54, ant = (du, dv, turn) => {
      const ca = Math.cos(turn), sa = Math.sin(turn), Q = (u, v) => { const x = u * A, y = v * A; return M(4 + du + x * ca - y * sa, -7 + dv + x * sa + y * ca); }, QQ = pts => pts.map(([u, v]) => Q(u, v));
      const beamUV = cubic([0, 0], [-2, -26], [-20, -52], [-50, -58], 10), at = t => beamUV[Math.round(t * 10)];
      let d = taper(QQ(beamUV), 5 * A + 0.6, 1.3) + ' ';
      const tine = (t, e, c, w = 3.2) => { const b = at(t); d += taper(QQ(quad(b, [b[0] + c[0], b[1] + c[1]], [b[0] + e[0], b[1] + e[1]], 4)), w * A + 0.4, 0.8) + ' '; };
      tine(0, [23, -13], [15, -1]); tine(0.1, [19, -25], [14, -8]);
      if (bull) { tine(0.4, [14, -25], [12, -6]); tine(0.6, [5, -31], [8, -11], 3.6); tine(0.8, [-5, -21], [3, -9], 2.6); }
      else tine(0.5, [8, -16], [6, -5]);
      return d;
    };
    antNear = ant(0, 0, 0); antFar = ant(3.4, -0.6, -0.16);
  }
  // the tail: short and thick at the root, hanging from the croup down the middle of the pale rump and lying close
  // against it, tapering to a blunt tip that stands just clear of the outline
  const tail = smooth([[49.6, Y(-93)], [54.6, Y(-92.2)], [58.8, Y(-87.4)], [61, Y(-80.4)], [61.5, Y(-74)], [60.3, Y(-69.4)], [58.7, Y(-72.6)], [57.2, Y(-79)], [54.2, Y(-85.6)], [50.6, Y(-89.6)]], true, 0.9);
  // ---- every outline is stored once. Together they are the animal's silhouette, which gives the rim of light here
  // and which the picture uses again, laid flat, for the shadow.
  const S = d => d && d.trim() ? L.shared(d) : null, use = (id, fill, extra = '') => id ? `<use href="#${id}" fill="${fill}"${extra}/>` : '';
  const iLF = S(legFar), iLN = S(legNear), iHf = S(hoofs), iT = S(torso), iTl = S(tail), iN = S(neck), iM = S(locks), iHd = S(head), iEN = S(earNear), iEF = S(earFar), iAN = S(antNear), iAF = S(antFar);
  const silId = L.nid('elk');
  L.defs.push(`<g id="${silId}">${[iLF, iLN, iHf, iT, iTl, iN, iM, iHd, iEN, iEF, iAN, iAF].filter(Boolean).map(i => `<use href="#${i}"/>`).join('')}</g>`);
  // ---- painting, back to front. A part is laid in its shade tone, then its lit tone is slid toward the sun over it.
  const shift = ` transform="translate(${f(lx * 2.6)},-1.8)"`, legs = () => use(iLN, C.leg) + `<g clip-path="url(#${L.clipTo(iLN)})">${use(iLN, C.legLit, ` transform="translate(${f(lx * 1.5)},-0.6)"`)}${use(iLN, C.leg, ` transform="translate(${f(lx * -1.2)},0)"`)}</g>`;
  out.push(use(iAF, C.antlerSh) + use(iEF, C.legFar) + use(iLF, C.legFar));
  if (!bed) out.push(legs() + use(iHf, C.hoof));
  // the trunk: shade, then the lit coat, the pale rump, the dark of the belly, and the build of shoulder and haunch
  out.push(use(iT, C.bodySh) + `<g clip-path="url(#${L.clipTo(iT)})">${use(iT, C.body, shift)}`
    + `<path d="${smooth([[41, Y(-99)], [56, Y(-96)], [64, Y(-80)], [62, Y(-58)], [54, Y(-49)], [50.6, Y(-58)], [50.4, Y(-72)], [47.6, Y(-86)]], true, 0.9)}" fill="${lx > 0 ? C.patch : C.patchSh}"/>`
    + (detail ? grain(-60, Y(-78), 126, 40, GL(0, Y(-72), 0, Y(-43), [[0, 0], [0.5, 0.16], [1, 0.6]]), C.bodySh, { seed: 8800 + seed }) : `<path d="M-56,${Y(-56)} Q-4,${Y(-52)} 40,${Y(-56)} L60,${Y(-40)} L-60,${Y(-40)}Z" fill="${C.bodySh}" fill-opacity="0.5"/>`)
    + (detail ? `<path d="M27,${Y(-93)} Q17,${Y(-74)} 30,${Y(-54)} M-12,${Y(-93)} Q-4,${Y(-75)} -20,${Y(-55)}" fill="none" stroke="${C.bodySh}" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.55"/>` : '') + `</g>`);
  out.push(use(iTl, C.bodySh) + `<g clip-path="url(#${L.clipTo(iTl)})">${use(iTl, C.tail, ` transform="translate(${f(lx * 1.5)},-0.6)"`)}</g>`);
  if (bed) out.push(use(iLN, C.leg) + use(iHf, C.hoof));
  out.push(use(iN, C.neck) + `<path d="${neckLit}" fill="none" stroke="${C.neckLit}" stroke-width="3.8" stroke-linejoin="round" clip-path="url(#${L.clipTo(iN)})"/>` + use(iM, C.neck));
  out.push(use(iHd, C.head) + `<path d="${nose}" fill="${C.nose}"/>` + use(iEN, C.neck));
  if (detail) { const e = M(13.6, -2.4), ei = M(ps.ear[0] * 0.7, ps.ear[1] * 0.7), eb = M(-1, -2.4); out.push(`<circle cx="${f(e[0])}" cy="${f(e[1])}" r="${f(1.5 * hk)}" fill="${C.eye}"/><path d="M${f(eb[0])},${f(eb[1])} L${f(ei[0])},${f(ei[1])}" stroke="${C.neckLit}" stroke-width="2.2" stroke-linecap="round"/>`); }
  out.push(use(iAN, C.antler));
  const rim = detail ? 1.5 : 1;
  return { id: silId, svg: `<use href="#${silId}" fill="${C.rim}"/><g transform="translate(${f(-lx * rim)},0.4)">${out.join('')}</g>` };
}
