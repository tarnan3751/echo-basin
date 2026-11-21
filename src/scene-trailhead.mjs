// The Cathedral Stand trailhead: the staff photo. It is the same forest as the boardwalk picture, seen from the
// clearing where the loop starts: the same giant trunks with their lowest limbs far overhead, the same drooping
// boughs, the same planked boardwalk. Everything on the ground is placed with one simple camera so that sizes agree:
// the viewer's eye is one "eye-height" above the ground, the horizon is EYE_Y, and a thing standing on the ground at
// screen height y is (y - EYE_Y) pixels per eye-height.
import * as L from './lib.mjs';
import { figFront, hatShape } from './figure.mjs';
import { trunk, trunkD, trunkHalf, moss, fern, bough, shared, clipTo, spline, hash } from './scene-forest.mjs';
import { bush, fernlet, tuft, rosette, flower, clover, toadstools, hummock } from './groundcover.mjs';
const { f, rnd, pick, lerp, mix, poly, curveFn, grain, GL, GR, from, until, between, linGrad, radGrad, clip } = L;

const W = 1200, H = 720, EYE_Y = 412, FOCAL = 1000, VPX = 690, DECK_H = 0.08, FEET = 690;
const proj = (X, Z, h = 0) => [VPX + X * FOCAL / Z, EYE_Y + (1 - h) * FOCAL / Z];      // ground position (X across, Z away) and height -> screen
const unitAt = y => y - EYE_Y;                                                          // pixels per eye-height on the ground at screen height y

// ---------- the staff ----------
const UNI = P => ({ kind: 'uniform', top: { lit: mix(P.haze, P.cream, 0.56), sh: mix(P.haze, P.plum, 0.12) }, pants: { lit: mix(P.teal, P.tealLight, 0.35), sh: P.tealDeep }, boots: P.plumDeep, hairStyle: 'hat', hatCol: mix(P.haze, P.plum, 0.14), hatSh: mix(P.plum, P.plumDeep, 0.5), hatBand: P.plumDeep, lx: -1 });
// Ines runs the place and carries the radio; Tomás has his camp coffee; June has the notes for her talk; Sam built the
// boardwalk and has his work vest, gloves and tape measure on.
export const RANGERS = P => [
  { name: 'ines', x: 446, s: 0.6, sp: { ...UNI(P), skin: '#8E5A47', skinSh: '#6C4135', hair: '#1B1420', build: 0.96, pose: 'clasp', radio: true, earrings: true, pins: true } },
  { name: 'tomas', x: 572, s: 0.65, sp: { ...UNI(P), skin: '#C68A6A', skinSh: '#A26B54', hair: '#2B2136', beard: true, build: 1.08, pose: 'mug', sleeves: 'rolled' } },
  { name: 'june', x: 808, s: 0.58, sp: { ...UNI(P), skin: '#EDB08C', skinSh: '#C98A70', hair: '#B98A5E', brow: '#8A6240', build: 0.92, long: true, pose: 'board' } },
  { name: 'sam', x: 934, s: 0.62, sp: { ...UNI(P), skin: '#D9A07C', skinSh: '#B57E62', hair: '#3A2D45', build: 1.0, over: { lit: mix(P.teal, P.tealLight, 0.5), sh: P.tealDeep }, tape: true, gloves: true } },
];
// what is left on the boards where three of them stood
const groundHat = (x, y, s, P) => `<g transform="translate(${x},${y}) scale(${s}) rotate(-7)"><ellipse cx="30" cy="8" rx="60" ry="6.5" fill="${P.plumDeep}" opacity="0.28"/>${hatShape(mix(P.haze, P.plum, 0.14), mix(P.plum, P.plumDeep, 0.5), P.plumDeep, -1)}</g>`;
const droppedMug = (x, y, s, P) => `<g transform="translate(${x},${y}) scale(${s})"><ellipse cx="16" cy="3" rx="26" ry="4" fill="${P.plumDeep}" opacity="0.26"/><path d="M-36,2 C-22,-1 -6,-1 4,2 C-8,5.4 -24,5.6 -36,2Z" fill="${mix(P.plum, P.coralSh, 0.4)}" opacity="0.6"/><g transform="rotate(96)"><path d="M-10,-12 h20 l-1.3,20.6 q-0.2,3.4 -3.6,3.4 h-10.2 q-3.4,0 -3.6,-3.4Z" fill="${mix('#FFF8EA', P.haze, 0.34)}"/><path d="M-10,-12 h18 l-1.3,20.6 q-0.2,3.4 -3.6,3.4 h-8.2 q-3.4,0 -3.6,-3.4Z" fill="#FFF8EA"/><path d="M-10.6,-12 h21.2" stroke="${P.tealDeep}" stroke-width="2.6" stroke-linecap="round"/></g></g>`;
const droppedBoard = (x, y, s, P) => `<g transform="translate(${x},${y}) scale(${s})"><path d="M-34,-8 L30,-12 L40,6 L-28,11Z" fill="${P.plumDeep}" opacity="0.28" transform="translate(7,4)"/><path d="M-34,-8 L30,-12 L40,6 L-28,11Z" fill="${mix(P.plum, P.peach, 0.3)}"/><path d="M-27,-5.6 L26,-9 L33,4 L-22,8Z" fill="#FFF8EA"/><path d="M-20,-3.6 L16,-6 M-18,-0.2 L22,-2.8 M-16,3.2 L10,1.6" stroke="${P.haze}" stroke-width="1.3" stroke-linecap="round"/><path d="M40,-4 l10,-2 l2,6 l-9,3Z" fill="#FFF8EA"/></g>`;

// ---------- trees ----------
// A dead limb: old conifers keep the broken stubs of their lower branches.
const stub = (x, y, len, dir, w0, tone, hi) => `<path d="M${f(x)},${f(y - w0)} L${f(x + dir * len)},${f(y - len * 0.3 - 0.7)} L${f(x + dir * (len - 1.6))},${f(y - len * 0.3 + 1.5)} L${f(x)},${f(y + w0)}Z" fill="${tone}"/><path d="M${f(x)},${f(y - w0)} L${f(x + dir * len)},${f(y - len * 0.3 - 0.7)}" stroke="${hi}" stroke-width="1" fill="none"/>`;
// A young tree of the same kind as the giants: a thin stem with tiers of drooping boughs, longest at the bottom, and a
// leader that nods at the top. All its boughs are one stored shape, drawn three times: a deeper rank underneath, a lit
// edge, and the body.
function youngTree(x, baseY, h, { tone, rim, behind, stem }){
  const n = Math.max(5, Math.round(h / 27)), tw = Math.max(1.6, h * 0.02), top = baseY - h;
  let d = '';
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), y = baseY - h * (0.14 + 0.8 * t), len = h * 0.27 * (1 - 0.84 * t) + 4;
    for (const dir of [-1, 1]) { const l2 = len * rnd(0.78, 1.16); d += bough(x + dir * tw * (1 - t) * 0.6, y + rnd(-0.02, 0.02) * h, l2, dir, { sag: 0.44, hang: 0.36, lift: 0.03, n: Math.max(3, Math.round(l2 / 19)), bare: 0.03 }) + ' '; }
  }
  d += `M${f(x - 1.4)},${f(top + h * 0.07)} Q${f(x - 0.6)},${f(top + h * 0.02)} ${f(x + h * 0.03)},${f(top)} Q${f(x + 2.4)},${f(top + h * 0.03)} ${f(x + 1.6)},${f(top + h * 0.07)}Z`;
  const id = shared(d), soft = 'stroke-width="1.4" stroke-linejoin="round"';
  return `<path d="M${f(x - tw)},${f(baseY + 2)} L${f(x + tw)},${f(baseY + 2)} L${f(x + 0.7)},${f(top + h * 0.05)} L${f(x - 0.7)},${f(top + h * 0.05)}Z" fill="${stem}"/>`
    + `<use href="#${id}" fill="${behind}" transform="translate(2.4,${f(Math.max(3, h * 0.022))})"/><use href="#${id}" fill="${rim}" transform="translate(-0.6,-0.8)"/><use href="#${id}" fill="${tone}" stroke="${tone}" ${soft} transform="translate(1,2)"/>`;
}

// ---------- the boardwalk ----------
// Laid out on the ground and projected, like the one in the boardwalk picture, and built the same way: a raised deck
// of cross-planks with a curb down each edge. It starts as a wide landing, where the staff are standing, and narrows
// to the walk itself, which runs back between the two big trees and away into the haze.
function boardwalk(P){
  const STEP = 5, HW_LANDING = 1.0, HW_WALK = 0.34, CURB = 0.07, CURB_H = 0.05, PLANK = 0.22;
  const route = [[0, 2.4], [0, 5], [0, 9], [-0.55, 16], [0.2, 26], [1.6, 40], [3.6, 62], [6.5, 90]];
  const sideways = spline(route.map(([X, Z]) => [Math.log(Z), X]));
  const sec = (Z, hw, along) => {
    const q = Math.log(Z), X = sideways(q), turn = (sideways(q + 0.002) - sideways(q - 0.002)) / 0.004 / Z, k = 1 / Math.hypot(1, turn), nx = k, nz = -turn * k;
    const at = (off, h, dX = 0, dZ = 0) => proj(X + nx * off + dX, Z + nz * off + dZ, h);
    const top = DECK_H + CURB_H * Math.max(0, Math.min(1, (25 - Z) / 7));        // full height near to; sinks to nothing by the time it is too small to see
    return { Z, hw, along, L: at(-hw, DECK_H), R: at(hw, DECK_H), l: at(-hw + CURB, DECK_H), r: at(hw - CURB, DECK_H), ls: at(-hw + CURB + 0.08, DECK_H),
      Lt: at(-hw, top), lt: at(-hw + CURB, top), Rt: at(hw, top), rt: at(hw - CURB, top),
      gl: at(-hw, 0), gr: at(hw, 0), sl: at(-hw, 0, 0.16, -0.1), sr: at(hw, 0, 0.16, -0.1) };
  };
  const landing = [], walk = [];
  for (let i = 0; i <= 6; i++) { const Z = lerp(2.4, STEP, i / 6); landing.push(sec(Z, HW_LANDING, Z - 2.4)); }
  { let along = STEP - 2.4, pX = 0, pZ = STEP; const q0 = Math.log(STEP), q1 = Math.log(90), n = 84;
    for (let i = 0; i <= n; i++) { const Z = Math.exp(q0 + (q1 - q0) * i / n), X = sideways(Math.log(Z)); along += Math.hypot(X - pX, Z - pZ); pX = X; pZ = Z; walk.push(sec(Z, HW_WALK, along)); } }
  const band = (part, a, b) => poly([...part.map(p => p[a]), ...part.map(p => p[b]).reverse()]);
  const deckTone = mix(P.peach, P.haze, 0.34), seam = mix(P.haze, P.plum, 0.5), under = mix(P.plum, P.plumDeep, 0.5), curbTone = mix(deckTone, P.plum, 0.36);
  const curbTop = mix(curbTone, P.cream, 0.3), curbShade = mix(curbTone, P.plumDeep, 0.5), curbLit = mix(curbTone, P.peach, 0.35);
  const nearWalk = walk.filter(p => p.Z <= 10.5), midWalk = walk.filter(p => p.Z >= 9.8 && p.Z <= 24), farWalk = walk.filter(p => p.Z >= 22);
  // the far stretch thins into the haze
  const hazeTone = mix(P.peach, P.haze, 0.42);
  const far = `<path d="${band(farWalk, 'L', 'gl')} ${band(farWalk, 'R', 'gr')}" fill="${mix(P.plum, hazeTone, 0.5)}"/><path d="${band(farWalk, 'L', 'R')}" fill="url(#${linGrad(0, 424, 0, 456, [[0, mix(deckTone, hazeTone, 0.6)], [1, mix(deckTone, hazeTone, 0.25)]])})"/><path d="${band(farWalk, 'L', 'l')} ${band(farWalk, 'R', 'r')}" fill="url(#${linGrad(0, 424, 0, 456, [[0, mix(curbTop, hazeTone, 0.7)], [1, mix(curbTop, hazeTone, 0.2)]])})"/>`;
  // one line per plank, as far as they can be told apart; a few boards a shade lighter or darker
  const planks = (part, sw = [0.6, 2.2]) => {
    let lines = '', tints = '', next = Math.ceil(part[0].along / PLANK) * PLANK, prev = null, count = Math.round(next / PLANK);
    for (let i = 1; i < part.length; i++) while (part[i].along >= next) {
      const a = part[i - 1], b = part[i], t = (next - a.along) / ((b.along - a.along) || 1), Z = lerp(a.Z, b.Z, t);
      const p0 = [lerp(a.l[0], b.l[0], t), lerp(a.l[1], b.l[1], t)], p1 = [lerp(a.r[0], b.r[0], t), lerp(a.r[1], b.r[1], t)];
      const gap = PLANK * FOCAL / (Z * Z), show = Math.max(0, Math.min(1, (gap - 1.4) / 2.6));
      if (show > 0) {
        lines += `<path d="M${f(p0[0])},${f(p0[1])} L${f(p1[0])},${f(p1[1])}" stroke-width="${f(Math.max(sw[0], Math.min(sw[1], gap * 0.12)))}" opacity="${f(show * 0.8)}"/>`;
        const h = hash(count + 40);
        if (prev && gap > 3.4 && h < 0.46) tints += `<path d="${poly([prev[0], prev[1], p1, p0])}" fill="${h < 0.22 ? P.cream : P.plum}" opacity="${h < 0.22 ? 0.18 : 0.08}"/>`;
      }
      prev = [p0, p1]; count++; next += PLANK;
    }
    return tints + `<g stroke="${seam}" fill="none">${lines}</g>`;
  };
  const curbs = part => `<path d="${band(part, 'l', 'ls')}" fill="${under}" opacity="0.22"/><path d="${band(part, 'lt', 'l')}" fill="${curbShade}"/><path d="${band(part, 'Lt', 'lt')}" fill="${curbTop}"/><path d="${band(part, 'rt', 'r')}" fill="${curbLit}"/><path d="${band(part, 'Rt', 'rt')}" fill="${curbTop}"/>`;
  const mid = `<path d="${band(midWalk, 'gl', 'gr')} ${band(midWalk, 'sl', 'sr')}" fill="${P.tealDeep}" opacity="0.4"/><path d="${band(midWalk, 'L', 'gl')} ${band(midWalk, 'R', 'gr')}" fill="${under}"/><path d="${band(midWalk, 'L', 'R')}" fill="${deckTone}"/>`
    + `<g clip-path="url(#${clip(band(midWalk, 'L', 'R'))})">${planks(midWalk)}</g>` + curbs(midWalk);
  // the near stretch and the landing. shadows: shapes that fall across the boards from things standing beside them
  const near = (shadows = '') => {
    const all = [...landing, ...nearWalk], did = shared(band(landing, 'L', 'R') + ' ' + band(nearWalk, 'L', 'R')), dc = clipTo(did);
    let s = `<path d="${band(all, 'gl', 'gr')} ${band(all, 'sl', 'sr')}" fill="${P.tealDeep}" opacity="0.45"/><path d="${band(all, 'L', 'gl')} ${band(all, 'R', 'gr')}" fill="${under}"/><use href="#${did}" fill="${deckTone}"/>`;
    // the grain of the boards, and their nails
    let streaks = '', pale = '', nails = '', knots = '';
    for (let i = 0; i < 64; i++) { const Z = rnd(2.5, STEP - 0.05), X = rnd(-0.9, 0.86), len = rnd(0.08, 0.34), a = proj(X, Z, DECK_H), b = proj(Math.min(0.92, X + len), Z, DECK_H), e = `M${f(a[0])},${f(a[1])} L${f(b[0])},${f(b[1])} `; if (i % 3) streaks += e; else pale += e; }
    for (let i = 0; i < 9; i++) { const Z = rnd(2.6, STEP - 0.2), [x, y] = proj(rnd(-0.85, 0.85), Z, DECK_H); knots += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(9 / Z)}" ry="${f(3.4 / Z)}"/>`; }
    for (let Zc = Math.ceil(2.5 / PLANK) * PLANK + PLANK / 2; Zc < STEP; Zc += PLANK) for (const X of [-0.87, -0.31, 0.31, 0.87]) { const [x, y] = proj(X, Zc, DECK_H); nails += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(Math.max(0.55, 3.4 / Zc))}"/>`; }
    s += `<g clip-path="url(#${dc})">${planks(landing, [0.8, 2.4])}${planks(nearWalk)}<path d="${streaks}" stroke="${seam}" stroke-width="0.9" fill="none" stroke-opacity="0.4"/><path d="${pale}" stroke="${P.cream}" stroke-width="0.9" fill="none" stroke-opacity="0.4"/><g fill="${seam}" fill-opacity="0.5">${knots}</g><g fill="${under}" fill-opacity="0.7">${nails}</g>`
      + (shadows ? `<path d="${shadows}" fill="${mix(P.plum, P.tealDeep, 0.5)}" fill-opacity="0.26"/>` : '') + `</g>`;
    s += grain(330, 500, 720, 240, GL(0, 520, 0, 720, [[0, 0.1], [0.5, 0.07], [1, 0.2]]), mix(P.haze, P.plum, 0.4), { clipId: dc });
    // curbs: down both edges of the walk and the landing, and along the back of the landing either side of the walk
    // The landing's back curb, either side of the walk. It runs in as far as the inner face of the walk's curb and
    // turns the corner with it: its end is drawn in line with that face, so the two curbs join and nothing shows
    // between them. It throws a narrow shadow on the boards in front of it, as the side curbs do.
    const zc = STEP - CURB, xi = HW_WALK - CURB, lo = DECK_H, hi = DECK_H + CURB_H;
    const backCurb = [-1, 1].map(k => { const q = (X, Z, h) => proj(k * X, Z, h);
      return `<path d="${poly([q(HW_LANDING - CURB, zc - 0.09, lo), q(xi, zc - 0.09, lo), q(xi, zc, lo), q(HW_LANDING - CURB, zc, lo)])}" fill="${under}" opacity="0.22"/>`
        + `<path d="${poly([q(HW_LANDING, zc, hi), q(xi, zc, hi), q(xi, STEP, hi), q(HW_LANDING, STEP, hi)])}" fill="${curbTop}"/>`
        + `<path d="${poly([q(HW_LANDING, zc, lo), q(xi, zc, lo), q(xi, zc, hi), q(HW_LANDING, zc, hi)])}" fill="${mix(curbTone, P.peach, 0.14)}"/>`
        + `<path d="${poly([q(xi, zc, lo), q(xi, STEP, lo), q(xi, STEP, hi), q(xi, zc, hi)])}" fill="${k < 0 ? curbShade : curbLit}"/>`; }).join('');
    return { svg: s + curbs(nearWalk) + backCurb + curbs(landing), clipId: dc };
  };
  // is this point of the picture on the boards (or close beside them)?
  const onBoards = (x, y, margin = 14) => { if (y < EYE_Y + 14) return false; const Z = (1 - DECK_H) * FOCAL / (y - EYE_Y), hw = Z < STEP ? HW_LANDING : HW_WALK; return Math.abs(x - (VPX + sideways(Math.log(Math.max(2.4, Z))) * FOCAL / Z)) < hw * FOCAL / Z + margin; };
  return { far, mid, near, onBoards };
}

// ---------- what stands at the trailhead ----------
// The trailhead sign: a routed board bolted across two bevelled posts, the park's roundel on its top edge, and a
// smaller board hung beneath it. Origin: the ground midway between the posts.
function trailSign(P){
  const wood = mix(P.plum, P.coralSh, 0.22), woodSh = P.plumDeep, face = P.plum, faceHi = mix(P.plum, P.peach, 0.4), metal = mix(P.haze, P.cream, 0.5), s = [];
  for (const x of [-98, 98]) s.push(`<path d="M${x - 8},5 V-178 L${x},-186 L${x + 8},-178 V5Z" fill="${woodSh}"/><path d="M${x - 8},5 V-178 L${x},-186 L${x + 4.4},-181.6 V5Z" fill="${wood}"/><path d="M${x - 8},5 V-178 L${x - 5.2},-180.8 V5Z" fill="${P.rim}" opacity="0.85"/><path d="M${x - 2},-150 v60 M${x + 1.4},-70 v52" stroke="${woodSh}" stroke-width="0.9" opacity="0.5"/>`);
  // the board: its thickness showing below and to the right, then the face, its grain, a chamfer of light along the top
  const bd = 'M-107,-171 H107 Q112,-171 112,-166 V-110 Q112,-105 107,-105 H-107 Q-112,-105 -112,-110 V-166 Q-112,-171 -107,-171Z', bc = clip(bd);
  s.push(`<path d="${bd}" fill="${woodSh}" transform="translate(3.4,5)"/><path d="${bd}" fill="${face}"/>`);
  s.push(`<g clip-path="url(#${bc})"><path d="M-112,-158 q50,-3 110,0 t114,-1 M-112,-146 q60,3 120,0 t104,1 M-112,-131 q40,-2 96,1 t128,-2 M-112,-119 q70,2 130,0 t94,1" stroke="${mix(face, P.haze, 0.4)}" stroke-width="0.9" fill="none" opacity="0.5"/><path d="M-112,-170 H112" stroke="${faceHi}" stroke-width="2.2"/><path d="M-111,-171 V-105" stroke="${P.rim}" stroke-width="2.4" opacity="0.8"/></g>`);
  s.push(`<rect x="-104.5" y="-163.5" width="209" height="51" rx="3" fill="none" stroke="${P.cream}" stroke-width="1.5" opacity="0.55"/>`);
  for (const [x, y] of [[-98, -160], [-98, -116], [98, -160], [98, -116]]) s.push(`<circle cx="${x}" cy="${y}" r="3" fill="${woodSh}"/><circle cx="${x}" cy="${y}" r="2.1" fill="${metal}"/><circle cx="${x - 0.6}" cy="${y - 0.6}" r="0.8" fill="#FFFFFF" opacity="0.7"/>`);
  // the roundel
  s.push(`<circle cx="1.6" cy="-169" r="18" fill="${woodSh}"/><circle cx="0" cy="-171" r="18" fill="${P.cream}"/><circle cx="0" cy="-171" r="15.4" fill="${P.teal}"/><path d="M-11.4,-164.6 L-4.4,-177.4 L-0.6,-170.6 L3.4,-175.4 L11.4,-164.6Z" fill="${P.cream}"/><path d="M-12,-162 H12" stroke="${P.cream}" stroke-width="1.5"/><circle cx="6.6" cy="-179.4" r="2.4" fill="#F2B441"/>`);
  s.push(`<text class="t" x="0" y="-124" text-anchor="middle" font-family="Fraunces, serif" font-size="25" font-weight="700" fill="${P.cream}" style="font-variation-settings:'SOFT' 100,'opsz' 60" data-s5="Do not enter">Cathedral Stand</text>`);
  // the rider board, on two straps, with the trail's number as it appears on the map
  const rd = 'M-86,-97 H86 Q90,-97 90,-93 V-73 Q90,-69 86,-69 H-86 Q-90,-69 -90,-73 V-93 Q-90,-97 -86,-97Z';
  s.push(`<rect x="-62" y="-106" width="4" height="11" fill="${metal}"/><rect x="58" y="-106" width="4" height="11" fill="${metal}"/><path d="${rd}" fill="${woodSh}" transform="translate(2.6,3.6)"/><path d="${rd}" fill="${wood}"/><path d="M-89,-96 H89" stroke="${mix(wood, P.peach, 0.4)}" stroke-width="1.6"/><path d="M-89.4,-96 V-70" stroke="${P.rim}" stroke-width="1.8" opacity="0.7"/>`);
  s.push(`<circle cx="-74" cy="-83" r="8.4" fill="${P.cream}"/><circle cx="-74" cy="-83" r="6.8" fill="${P.coral}"/><text x="-74" y="-78.8" text-anchor="middle" font-family="'Source Sans 3', sans-serif" font-size="11.6" font-weight="700" fill="${P.cream}">2</text>`);
  s.push(`<text class="t" x="12" y="-78.2" text-anchor="middle" font-family="'Source Sans 3', sans-serif" font-size="13.4" font-weight="600" fill="${P.window}" letter-spacing="0.5" data-s3="Trail closes at 5 pm" data-s4="Trail closed" data-s5="That is not June calling">Trailhead. 2.8 mile loop.</text>`);
  // stones packed round the foot of each post
  const stone = mix(P.haze, P.plum, 0.3), stoneTop = mix(P.haze, P.cream, 0.45);
  s.push(L.rock(-112, 8, 22, 12, stone, stoneTop) + L.rock(-86, 9, 18, 9, stone, stoneTop) + L.rock(86, 8, 20, 11, stone, stoneTop) + L.rock(110, 9, 17, 9, stone, stoneTop));
  // its shadow: both posts and the two boards, lying away to the right
  const sh = (x, h) => [x + h * 0.6, 4 + h * 0.085];
  const shadow = [-98, 98].map(x => poly([[x - 8, 3], [x + 8, 6], [sh(x + 8, 186)[0], sh(x, 186)[1] + 3], [sh(x - 8, 186)[0], sh(x, 186)[1] - 3]])).join(' ') + ' ' + poly([sh(-112, 69), sh(112, 69), sh(112, 171), sh(-112, 171)]);
  return { svg: s.join(''), shadow };
}
// The information board: a shingled roof on two posts, a framed panel with the park map and the day's notices, a
// leaflet box. Origin: the ground midway between the posts.
function infoBoard(P){
  const wood = mix(P.plum, P.coralSh, 0.22), woodSh = P.plumDeep, woodHi = mix(wood, P.peach, 0.45), paper = '#FFF8EA', cork = mix(P.cream, P.peach, 0.6), ink = P.haze, k = [];
  for (const x of [-88, 88]) k.push(`<rect x="${x - 7}" y="-206" width="14" height="211" fill="${woodSh}"/><rect x="${x - 7}" y="-206" width="10.4" height="211" fill="${wood}"/><rect x="${x - 7}" y="-206" width="2.6" height="211" fill="${P.rim}" opacity="0.85"/><path d="M${x - 1},-70 v50 M${x + 2},-40 v36" stroke="${woodSh}" stroke-width="0.9" opacity="0.5"/>`);
  // the panel in its frame, shaded along the top by the roof
  k.push(`<rect x="-83" y="-188" width="166" height="118" fill="${woodSh}"/><rect x="-78" y="-183" width="156" height="108" fill="${cork}"/>` + grain(-78, -183, 156, 108, GL(0, -183, 0, -75, [[0, 0.3], [1, 0.12]]), mix(P.peach, P.haze, 0.5)) + `<rect x="-78" y="-183" width="156" height="22" fill="url(#${linGrad(0, -183, 0, -161, [[0, P.plumDeep, 0.4], [1, P.plumDeep, 0]])})"/><path d="M-83,-188 V-70" stroke="${P.rim}" stroke-width="2" opacity="0.7"/>`);
  // the map: the lake, the forest, the loop in red, and the dot that says where you are standing
  k.push(`<g transform="translate(-72,-177)"><rect x="1.6" y="2" width="62" height="80" fill="${P.plumDeep}" opacity="0.25"/><rect width="62" height="80" fill="#F3EAD3"/><rect width="62" height="11" fill="${P.teal}"/><path d="M5,5.6 h22" stroke="${P.cream}" stroke-width="2"/><path d="M0,34 C14,26 30,30 62,20 V80 H0Z" fill="${mix(P.tealLight, '#F3EAD3', 0.7)}"/><path d="M4,56 C16,50 34,44 56,34 C58,36 58,38 55,40 C36,50 18,56 6,60 C3,60 2,58 4,56Z" fill="${mix(P.tealLight, '#FFFFFF', 0.55)}" stroke="${P.teal}" stroke-width="0.7"/><path d="M6,22 q12,-6 22,-2 t26,-6 M8,28 q14,-5 24,-2" stroke="#A8755F" stroke-width="0.6" fill="none" opacity="0.8"/><path d="M27,44 C24,38 28,33 32,36 C35,39 32,43 28,45" fill="none" stroke="${P.coral}" stroke-width="1.2" stroke-dasharray="2.4 1.4"/><circle cx="27.6" cy="46.4" r="3" fill="${paper}"/><circle cx="27.6" cy="46.4" r="1.9" fill="${P.coral}"/><path d="M5,68 h20 M5,73 h30" stroke="${ink}" stroke-width="1.1"/></g>`);
  // notices, each held by its pin
  const lines = (x, y, ws) => ws.map((w, i) => `M${x},${y + i * 4.6} h${w}`).join(' '), pin = (x, y, c = P.coral) => `<circle cx="${x + 0.7}" cy="${y + 0.9}" r="1.9" fill="${P.plumDeep}" opacity="0.4"/><circle cx="${x}" cy="${y}" r="1.9" fill="${c}"/>`;
  k.push(`<g transform="translate(-3,-177)"><rect x="1.4" y="1.8" width="42" height="50" fill="${P.plumDeep}" opacity="0.22"/><rect width="42" height="50" fill="${paper}"/><rect width="42" height="9" fill="${P.coral}"/><path d="M4,4.6 h16" stroke="${paper}" stroke-width="1.8"/><path d="${lines(4, 16, [34, 30, 34, 26, 32, 18])}" stroke="${ink}" stroke-width="1.2"/></g>` + pin(18, -174, '#F2B441'));
  k.push(`<g transform="translate(45,-177)"><rect x="1.4" y="1.8" width="28" height="34" fill="${P.plumDeep}" opacity="0.22"/><rect width="28" height="34" fill="${paper}"/><path d="M14,6 l6,9 h-4 l5,8 h-14 l5,-8 h-4Z" fill="${P.tealLight}"/><rect x="12.6" y="23" width="2.8" height="4" fill="${wood}"/><path d="M5,30.4 h18" stroke="${ink}" stroke-width="1.2"/></g>` + pin(59, -174));
  k.push(`<g transform="translate(-2,-121) rotate(-4)"><rect x="1.2" y="1.6" width="30" height="36" fill="${P.plumDeep}" opacity="0.22"/><rect width="30" height="36" fill="${mix(paper, P.window, 0.3)}"/><path d="${lines(4, 8, [22, 18, 22, 14, 20])}" stroke="${ink}" stroke-width="1.2"/></g>` + pin(12, -118, P.teal));
  k.push(`<g transform="translate(36,-136) rotate(3)"><rect x="1.4" y="1.8" width="38" height="28" fill="${P.plumDeep}" opacity="0.22"/><rect width="38" height="28" fill="${paper}"/><rect x="2.6" y="2.6" width="32.8" height="19" fill="${P.peach}"/><path d="M2.6,21.6 V14 L11,7 L17,13 L23,5 L35.4,17 V21.6Z" fill="${P.haze}"/><path d="M2.6,21.6 V17 q10,-4 18,0 t14.8,-1 V21.6Z" fill="${P.tealLight}"/></g>` + pin(55, -133, '#F2B441'));
  // stage 3: a red notice goes up. stage 4: so do the faces of the people it is about
  k.push(from(3, `<g transform="translate(-38,-113) rotate(-4)"><rect x="1.4" y="1.8" width="30" height="28" fill="${P.plumDeep}" opacity="0.25"/><rect width="30" height="28" fill="${P.coral}"/><path d="${lines(4, 7, [22, 22, 16, 20])}" stroke="${paper}" stroke-width="1.5"/></g>` + pin(-24, -111, paper)));
  k.push(from(4, [[-70, -150, -5], [-22, -168, 3], [6, -138, -3]].map(([x, y, a]) => `<g transform="translate(${x},${y}) rotate(${a})"><rect x="1.4" y="1.8" width="26" height="33" fill="${P.plumDeep}" opacity="0.28"/><rect width="26" height="33" fill="${paper}"/><rect x="5" y="4" width="16" height="15" fill="${P.haze}"/><circle cx="13" cy="10" r="3.6" fill="${mix(P.haze, P.cream, 0.5)}"/><path d="M6.6,19 q6.4,-8 12.8,0Z" fill="${mix(P.haze, P.cream, 0.5)}"/><path d="M4,24 h18 M4,28.4 h12" stroke="${P.plumDeep}" stroke-width="1.3"/></g>` + pin(x + 13, y + 3)).join('')));
  // the rail under the panel, and a box of leaflets on the post
  k.push(`<rect x="-82" y="-70" width="164" height="7" fill="${woodSh}"/><rect x="-82" y="-70" width="164" height="2.4" fill="${woodHi}" opacity="0.6"/>`);
  k.push(`<g transform="translate(72,-112)"><rect x="2" y="2.6" width="30" height="32" fill="${P.plumDeep}" opacity="0.3"/><path d="M5,-6 h20 v14 h-20Z" fill="${paper}" transform="rotate(-5 15 0)"/><path d="M8,-4 h18 v12 h-18Z" fill="${mix(paper, P.peach, 0.4)}" transform="rotate(4 17 0)"/><rect width="30" height="32" rx="1.6" fill="${wood}"/><rect width="2.6" height="32" fill="${P.rim}" opacity="0.7"/><rect x="5" y="9" width="20" height="9" rx="1" fill="${paper}"/><path d="M8,13.6 h14" stroke="${P.teal}" stroke-width="1.8"/></g>`);
  // the roof: its front slope in three courses of shingles, the ridge, the board along the eave, moss where it stays damp
  const eaveY = -203, ridgeY = -236, ex = 118, rx = 107, edge = t => lerp(ex, rx, t), rowY = t => lerp(eaveY, ridgeY, t), tones = [mix(wood, P.plumDeep, 0.25), wood, mix(wood, P.haze, 0.22)];
  let roof = '', joints = '';
  for (let r = 0; r < 3; r++) {
    const t0 = r / 3, t1 = (r + 1) / 3; roof += `<path d="${poly([[-edge(t0), rowY(t0)], [edge(t0), rowY(t0)], [edge(t1), rowY(t1)], [-edge(t1), rowY(t1)]])}" fill="${tones[r]}"/>`;
    for (let x = -edge(t0) + (r % 2 ? 9 : 17); x < edge(t0) - 6; x += 17 + (hash(r * 31 + x) - 0.5) * 6) joints += `M${f(x)},${f(rowY(t0))} L${f(x * rx / ex * 0.02 + x * 0.985)},${f(rowY(t1))} `;
    roof += `<path d="M${-edge(t0)},${rowY(t0)} H${edge(t0)}" stroke="${woodSh}" stroke-width="1.5" opacity="0.6"/>`;
  }
  k.push(`<path d="${poly([[-ex, eaveY], [ex, eaveY], [ex - 1, eaveY + 9], [-ex + 1, eaveY + 9]])}" fill="${woodSh}"/>${roof}<path d="${joints}" stroke="${woodSh}" stroke-width="1" opacity="0.55" fill="none"/><path d="M${-rx - 1},${ridgeY} H${rx + 1}" stroke="${woodHi}" stroke-width="3.4" stroke-linecap="round"/><path d="M${-ex},${eaveY} L${-rx},${ridgeY}" stroke="${P.rim}" stroke-width="2.6" stroke-linecap="round"/><path d="M${-ex + 1},${eaveY + 1.2} H${ex - 1}" stroke="${woodHi}" stroke-width="1.6" opacity="0.7"/>`);
  { const mt = mix(P.tealLight, P.window, 0.18), md = mix(P.tealDeep, P.plumDeep, 0.3); let m = ''; for (const [x, y, r] of [[52, -214, 7], [63, -211, 8.5], [76, -209, 7], [88, -207, 8], [99, -206, 6], [70, -220, 5.6], [-96, -207, 6], [-86, -208, 4.6]]) m += `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${f(r * 0.62)}"/>`; k.push(`<g fill="${md}" transform="translate(1.2,1.6)">${m}</g><g fill="${mt}">${m}</g>`); }
  const stone = mix(P.haze, P.plum, 0.3), stoneTop = mix(P.haze, P.cream, 0.45);
  k.push(L.rock(-100, 8, 20, 11, stone, stoneTop) + L.rock(-76, 9, 16, 8, stone, stoneTop) + L.rock(98, 8, 20, 10, stone, stoneTop));
  const sh = (x, h) => [x + h * 0.6, 4 + h * 0.085];
  const shadow = [-88, 88].map(x => poly([[x - 7, 3], [x + 7, 6], [sh(x + 7, 204)[0], sh(x, 204)[1] + 3], [sh(x - 7, 204)[0], sh(x, 204)[1] - 3]])).join(' ') + ' ' + poly([sh(-83, 64), sh(83, 64), sh(83, 188), sh(-83, 188)]) + ' ' + poly([sh(-ex, 196), sh(ex, 196), sh(rx, 236), sh(-rx, 236)]);
  return { svg: k.join(''), shadow };
}

// ---------- the picture ----------
export function rangers(){
  L.usePalette('gold'); L.begin(); L.reseed(31); L.setSun({ x: -260, y: 250, r: 0 }); L.setWater(470);
  const P = L.P, o = [], deck = boardwalk(P), marks = [], mark = name => marks.push([name, o.length]);      // the drawing is kept in named parts, back to front
  const lean = (x, y, a, s) => a ? `<g transform="rotate(${a} ${x} ${y})">${s}</g>` : s;
  // one bough = a deeper rank of sprays showing beneath in a quieter tone, a thin lit edge, then the body
  const soft = 'stroke-width="1.6" stroke-linejoin="round"';
  const spray = (x, y, len, dir, opt, tone, rim, behind) => {
    const b = bough(x + dir * len * 0.05, y + len * 0.02, len * 0.9, dir, { ...opt, hang: (opt.hang || 0.22) * 1.3, bare: 0.16 }), id = shared(bough(x, y, len, dir, opt));
    return `<path d="${b}" fill="${behind}"/><use href="#${id}" fill="${rim}" transform="translate(-0.6,-0.8)"/><use href="#${id}" fill="${tone}" stroke="${tone}" ${soft} transform="translate(0.8,1.8)"/>`;
  };
  const plain = (x, y, len, dir, opt, tone, rim) => { const id = shared(bough(x, y, len, dir, opt)); return `<use href="#${id}" fill="${rim}" transform="translate(-0.6,-0.8)"/><use href="#${id}" fill="${tone}" transform="translate(0.8,1.8)"/>`; };
  // the long shadow of something tall, lying on the ground: off to the right and a little toward us
  const streak = (x, baseY, wpx, len = 9) => {
    const Z0 = FOCAL / (baseY - EYE_Y), X0 = (x - VPX) * Z0 / FOCAL, D = wpx * Z0 / FOCAL, near = [], far = [];
    for (let i = 0; i <= 8; i++) { const t = len * i / 8, Z = Z0 - 0.36 * t; if (Z < 2.9) break; near.push(proj(X0 + t - D * 0.2, Z - D * 0.5)); far.unshift(proj(X0 + t + D * 0.2, Z + D * 0.5)); }
    return poly([...near, ...far]);
  };

  // ---- light and air
  mark('air');
  o.push(`<rect x="0" y="0" width="${W}" height="560" fill="url(#${linGrad(0, 90, 0, 540, [[0, P.skyHorizon], [0.42, P.peach], [0.8, mix(P.haze, P.peach, 0.34)], [1, mix(P.haze, P.teal, 0.3)]])})"/>`);
  o.push(`<circle cx="200" cy="170" r="640" fill="url(#${radGrad(200, 170, 640, [[0, P.sun, 0.9], [0.4, P.cream, 0.42], [1, P.cream, 0]])})"/>`);
  o.push(grain(0, 60, W, 520, GR(200, 170, 760, [[0, 0.3], [0.5, 0.18], [1, 0]]), P.sun));

  // ---- the farthest trunks dissolve into the haze
  mark('far');
  const farTone = mix(P.peach, P.haze, 0.42), farRim = mix(farTone, P.cream, 0.5), farAt = [];
  for (const [x, w] of [[36, 16], [92, 22], [148, 14], [192, 19], [262, 24], [314, 15], [350, 21], [424, 17], [470, 23], [644, 15], [680, 21], [722, 16], [926, 18], [968, 24], [1014, 15], [1088, 21], [1134, 16]]) {
    const by = 430 + rnd(-4, 5), a = f(rnd(-1.4, 1.4)); farAt.push([x, w]);
    o.push(lean(x, by, a, trunk(x, w, by, farTone, farRim, { rimW: 1.4, shape: { fl: 0.7, fh: 34 } })));
  }
  { const tone = mix(farTone, P.teal, 0.16); let fb = '';
    farAt.forEach(([x, w], i) => { for (let k = 0; k < (i % 2 ? 1 : 2); k++) { const dir = (i + k) % 2 ? 1 : -1; fb += `<path d="${bough(x + dir * w * 0.3, rnd(120, 176) + k * 70, rnd(36, 64), dir, { sag: 0.34, hang: 0.3, n: 3 })}"/>`; } });
    o.push(`<g fill="${tone}">${fb}</g>`); }
  o.push(`<rect x="0" y="250" width="${W}" height="230" fill="url(#${linGrad(0, 250, 0, 470, [[0, P.cream, 0], [0.7, P.cream, 0.5], [1, P.cream, 0.3]])})"/>`);
  // the far floor, hazy, with the boardwalk thinning away across it
  const gA = curveFn([[0, 437], [200, 432], [420, 438], [640, 433], [860, 438], [1040, 433], [1200, 437]]), under = (g, to = H + 40) => { const p = [[0, to]]; for (let x = 0; x <= W; x += 12) p.push([x, g(x)]); p.push([W, to]); return poly(p); };
  const floorFar = mix(farTone, P.teal, 0.3), floorMid = mix(P.teal, P.haze, 0.25);
  o.push(`<path d="${under(gA, 560)}" fill="url(#${linGrad(0, 432, 0, 480, [[0, floorFar], [1, mix(floorMid, farTone, 0.35)]])})"/>` + deck.far);
  // light at the far end of the walk
  o.push(`<ellipse cx="706" cy="436" rx="96" ry="150" fill="url(#${radGrad(706, 436, 150, [[0, P.sun, 0.8], [0.5, P.cream, 0.34], [1, P.cream, 0]])})" transform="translate(${f(706 * 0.36)},0) scale(0.64,1)"/>`);

  // ---- trunks at a middle distance, paler than the near ones
  mark('farmid');
  const midTone = mix(P.haze, P.plum, 0.38), midSh = mix(P.plum, P.plumDeep, 0.5), fmTone = mix(farTone, midTone, 0.55), fmRim = mix(fmTone, P.cream, 0.45);
  const farMid = [[120, 40, 452, -1], [300, 46, 450, 0.8], [452, 36, 448, 0], [738, 42, 452, 1.2], [1004, 42, 450, -0.7], [1124, 38, 454, 0]];
  for (const [x, w, by, a] of farMid) { let fur = ''; for (let k = 0; k < 4; k++) { const fx = x + rnd(-0.34, 0.4) * w, fy = rnd(120, 300), fh = rnd(50, 150); fur += `M${f(fx)},${f(fy)} q${f(rnd(-2, 2))},${f(fh / 2)} ${f(rnd(-1.5, 1.5))},${f(fh)} `; } o.push(lean(x, by, a, trunk(x, w, by, fmTone, fmRim, { rimW: 2, shape: { fl: 0.8, fh: 50 } }) + `<path d="${fur}" stroke="${mix(fmTone, P.plum, 0.4)}" stroke-width="1.3" stroke-linecap="round" fill="none" opacity="0.55"/>`)); }
  { const tone = mix(mix(P.tealDeep, P.teal, 0.55), farTone, 0.42), rim = mix(tone, P.peach, 0.3), behind = mix(tone, P.tealDeep, 0.3);
    o.push([[100, 150, 70, -1], [140, 196, 56, 1], [323, 138, 64, 1], [277, 204, 50, -1], [470, 150, 58, 1], [717, 170, 52, -1], [759, 130, 60, 1], [1025, 150, 66, 1], [983, 206, 48, -1], [1105, 160, 54, -1]].map(([x, y, len, dir]) => plain(x, y, len, dir, { sag: 0.36, hang: 0.3 }, tone, rim)).join('')); }
  // light coming down between the trunks
  const shaft = (x0, w0, x1, w1, a) => `<path d="M${x0},60 L${x0 + w0},60 L${x1 + w1},540 L${x1},540Z" fill="url(#${linGrad(0, 80, 0, 540, [[0, P.sun, a], [0.7, P.sun, a * 0.8], [1, P.sun, 0]])})"/>`;
  o.push(shaft(40, 70, 300, 130, 0.2) + shaft(250, 44, 470, 86, 0.15) + shaft(520, 50, 700, 90, 0.17) + shaft(830, 40, 1010, 80, 0.1));
  // the middle floor
  mark('floor');
  const gB = curveFn([[0, 474], [160, 468], [330, 476], [520, 470], [690, 477], [880, 469], [1060, 476], [1200, 470]]);
  { const fc = clip(under(gB, 600));
    o.push(`<path d="${under(gB, 600)}" fill="url(#${linGrad(0, 468, 0, 540, [[0, mix(mix(P.teal, P.haze, 0.5), P.peach, 0.14)], [0.5, mix(P.teal, P.plum, 0.26)], [1, mix(P.teal, P.plum, 0.18)]])})"/>`);
    let sh = '', pools = '';
    for (const [x, w, by] of [[205, 96, 512], [372, 62, 506], [1062, 104, 510], [992, 54, 500], [120, 40, 474], [300, 46, 474], [452, 36, 474], [738, 42, 476], [1004, 42, 474]]) sh += `M${f(x - w * 0.5)},${by - 6} L${f(x + w * 0.5)},${by - 6} L${f(x + w * 0.5 + 250)},560 L${f(x - w * 0.3 + 190)},560Z `;
    for (const [x, y, w, h] of [[84, 492, 44, 4], [280, 500, 50, 5], [470, 488, 34, 3.4], [612, 506, 30, 4], [780, 496, 26, 3], [930, 510, 34, 4], [1130, 498, 40, 4]]) pools += `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${h}"/>`;
    o.push(`<g clip-path="url(#${fc})"><path d="${sh}" fill="${P.tealDeep}" fill-opacity="0.34"/><g fill="${P.sun}" fill-opacity="0.2">${pools}</g></g>` + deck.mid);
    // undergrowth on the forest floor: ferns and low shrubs, hazed with distance
    const ut = mix(mix(P.teal, P.tealLight, 0.45), P.haze, 0.2), uh = mix(mix(P.tealLight, P.cream, 0.25), P.haze, 0.15), ud = mix(P.tealDeep, P.haze, 0.1), U = [];
    for (const [x, y, w, h] of [[60, 498, 70, 22], [262, 492, 46, 16], [330, 512, 60, 20], [600, 496, 36, 13], [792, 492, 36, 13], [900, 500, 56, 18], [1120, 494, 66, 20], [420, 500, 44, 14], [760, 512, 44, 15], [624, 518, 40, 14]]) U.push([y, bush(x, y, w, h, ut, uh, ud)]);
    for (const [x, y, sz, ln] of [[150, 506, 24, 0.1], [240, 520, 30, -0.2], [440, 516, 26, 0.2], [622, 508, 18, -0.2], [748, 502, 18, 0.2], [920, 520, 28, -0.1], [1020, 516, 26, 0.2], [1160, 514, 28, -0.1], [560, 508, 18, 0], [786, 522, 24, 0.1], [596, 522, 22, -0.1]]) U.push([y, fernlet(x, y, sz, mix(P.tealLight, P.haze, 0.12), mix(P.teal, P.haze, 0.1))]);
    U.sort((a, b) => a[0] - b[0]); o.push(U.map(u => u[1]).join('')); }

  // ---- the big trunks behind the clearing. Each one is different: girth, lean, bark, dead limbs, moss
  mark('mids');
  const mids = [[205, 96, 512, -0.8, 7], [372, 62, 506, 1, 5], [1062, 104, 510, 0.6, 8], [992, 54, 500, -1.2, 5]];
  for (const [x, w, by, a, n] of mids) {
    const shape = { fl: 0.8, fh: 70 }, edge = y => trunkHalf(w, by, y, shape);
    let s = stub(x - edge(300), 300 + rnd(-40, 40), w * rnd(0.22, 0.4), -1, 2.6, midTone, mix(midTone, P.peach, 0.6)) + stub(x + edge(240), 240 + rnd(-40, 40), w * rnd(0.2, 0.36), 1, 2.4, midSh, midTone) + stub(x + edge(390), 390 + rnd(-20, 20), w * rnd(0.14, 0.26), 1, 2, midSh, midTone);
    s += trunk(x, w, by, midTone, mix(midTone, P.peach, 0.6), { bark: n, shade: midSh, rimW: 2.6, shape, barkLen: [60, 220], flat: true, litGrain: false });
    const mt = mix(mix(P.tealLight, P.window, 0.14), P.haze, 0.2), md = mix(P.tealDeep, P.haze, 0.2); let sk = '';
    for (let q = -1; q <= 1.01; q += 0.2) { const r = w * rnd(0.09, 0.15); sk += `<ellipse cx="${f(x + q * w * 0.78)}" cy="${f(by - r * 0.5 + 2)}" rx="${f(r * 1.3)}" ry="${f(r * (0.8 + 0.9 * Math.max(0, -q)))}"/>`; }
    s += `<g clip-path="url(#${clip(trunkD(x, w, by, shape))})"><g fill="${md}" transform="translate(1.4,2)">${sk}</g><g fill="${mt}">${sk}</g></g>`;
    o.push(lean(x, by, a, s));
  }
  { const tone = mix(mix(P.tealDeep, P.teal, 0.55), P.haze, 0.2), rim = mix(tone, P.peach, 0.3), behind = mix(tone, P.tealDeep, 0.45);
    o.push([[253, 150, 96, 1], [157, 196, 70, -1], [403, 140, 80, 1], [341, 210, 56, -1], [1010, 160, 74, -1], [1114, 150, 84, 1], [965, 196, 60, -1]].map(([x, y, len, dir]) => spray(x, y, len, dir, { sag: 0.36, hang: 0.3 }, tone, rim, behind)).join('')); }
  o.push(shaft(140, 50, 380, 110, 0.12) + shaft(596, 36, 742, 70, 0.14));

  // ---- the clearing: in the shade of the trees at the back, in the sun nearer to us
  mark('clearing');
  const gC = curveFn([[0, 530], [150, 524], [320, 532], [500, 526], [690, 534], [880, 526], [1060, 532], [1200, 526]]);
  const lit = mix(P.tealLight, P.cream, 0.46), mid = mix(P.tealLight, P.cream, 0.22), clearing = under(gC), cc = clip(clearing);
  o.push(`<path d="${clearing}" fill="url(#${linGrad(0, 524, 0, H, [[0, mix(P.teal, P.tealLight, 0.55)], [0.2, mid], [0.46, lit], [0.8, mid], [1, P.tealLight]])})"/>`);
  o.push(`<path d="${under(gC, 546)}" fill="${mix(P.tealLight, P.cream, 0.3)}" opacity="0.5" transform="translate(0,-2.4)" clip-path="url(#${clip(under(x => gC(x) - 2.4, 536))})"/>`);
  o.push(grain(0, 520, W, 240, GL(0, 560, 0, H + 40, [[0, 0.1], [0.4, 0.04], [1, 0.34]]), P.teal, { clipId: cc }));
  // sun on the grass where it gets between the trees, and the rise and fall of the ground
  { let pools = ''; for (const [x, y, w, h] of [[150, 606, 150, 15], [330, 688, 120, 12], [1010, 640, 110, 12], [1100, 700, 120, 13], [70, 668, 90, 11], [390, 598, 70, 8]]) pools += `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${h}"/>`; o.push(`<g fill="${mix(lit, P.sun, 0.4)}" fill-opacity="0.26">${pools}</g>`); }
  const CEDAR = 546, FIR = 848, giants = [[CEDAR, 140, 547], [FIR, 150, 552]];      // each stands clear of the walk, so its curbs never cross their roots
  const shadowTone = mix(P.teal, P.tealDeep, 0.4), casts = [];                           // shapes that lie on the ground, and across the boards where they reach them
  casts.push(streak(CEDAR, 549, 130), streak(FIR, 554, 140), streak(318, 534, 26, 3.4), streak(944, 532, 30, 3.6));

  // ---- everything standing on the clearing is put in one list and drawn from the back to the front
  const G = [], put = (y, s) => G.push([y, s]);
  const C = { stem: P.teal, cream: '#FFF8EA', gold: '#F2B441', goldSh: '#C98E2B', coral: P.coral, coralSh: P.coralSh, ink: P.plumDeep, violet: '#9C7DB8', lilac: '#D3B4D6', leaf: mix(P.tealLight, P.cream, 0.34), leafDark: P.teal, clover: '#F6DDE0' };
  const sign = trailSign(P), board = infoBoard(P), SIGN = [236, 644], BOARD = [1090, 590], BS = 0.92;
  // every outline wound the same way, so that drawn as one path they merge instead of cancelling where they cross
  const merged = list => list.join(' ').split('Z').map(t => (t.match(/-?[\d.]+/g) || []).map(Number)).filter(n => n.length >= 6).map(n => { const pts = []; for (let i = 0; i < n.length; i += 2) pts.push([n[i], n[i + 1]]); let a = 0; for (let i = 0; i < pts.length; i++) { const q = pts[(i + 1) % pts.length]; a += pts[i][0] * q[1] - q[0] * pts[i][1]; } return poly(a < 0 ? pts.reverse() : pts); }).join(' ');
  const shift = (d, dx, dy) => d.replace(/(-?[\d.]+),(-?[\d.]+)/g, (m, a, b) => `${f(+a + dx)},${f(+b + dy)}`);
  casts.push(shift(sign.shadow, SIGN[0], SIGN[1]), board.shadow.replace(/(-?[\d.]+),(-?[\d.]+)/g, (m, a, b) => `${f(+a * BS + BOARD[0])},${f(+b * BS + BOARD[1])}`));
  put(SIGN[1], `<g transform="translate(${SIGN[0]},${SIGN[1]})">${sign.svg}</g>`);
  put(BOARD[1], `<g transform="translate(${BOARD[0]},${BOARD[1]}) scale(${BS})">${board.svg}</g>`);
  // young trees and shrubs along the edge of the forest
  { const tone = mix(P.tealDeep, P.teal, 0.5), yt = (x, y, h, k = 0) => put(y, youngTree(x, y, h, { tone: mix(tone, P.haze, k), rim: mix(mix(tone, P.haze, k), P.tealLight, 0.55), behind: mix(mix(P.ink, P.tealDeep, 0.5), P.haze, k), stem: midSh }));
    yt(318, 534, 156, 0.06); yt(944, 532, 252); yt(126, 542, 118, 0.1); yt(1152, 538, 176, 0.06);
    const bt = mix(P.teal, P.tealLight, 0.3), bh = mix(P.tealLight, P.cream, 0.3), bd = P.tealDeep;
    for (const [x, y, w, h] of [[150, 552, 96, 36], [286, 548, 62, 26], [444, 544, 54, 22], [1012, 550, 84, 34], [1128, 556, 92, 40], [690 - 132, 556, 0, 0]]) if (w) put(y, bush(x, y, w, h, bt, bh, bd)); }
  // a stump by the information board, cut clean
  put(664, `<g transform="translate(1004,664)"><ellipse cx="14" cy="6" rx="50" ry="8" fill="${shadowTone}" opacity="0.5"/><path d="M-28,-34 L-33,4 C-12,12 12,12 33,4 L28,-34Z" fill="${midSh}"/><path d="M-28,-34 L-33,4 C-22,8 -12,10 -4,10 L-6,-34Z" fill="${mix(P.plum, P.haze, 0.25)}"/><ellipse cx="0" cy="-34" rx="28" ry="8.4" fill="${mix(P.peach, P.haze, 0.26)}"/><ellipse cx="-1" cy="-34.4" rx="19" ry="5.6" fill="none" stroke="${mix(P.haze, P.plum, 0.3)}" stroke-width="1"/><ellipse cx="-2" cy="-34.6" rx="10.4" ry="3.1" fill="none" stroke="${mix(P.haze, P.plum, 0.3)}" stroke-width="1"/><ellipse cx="-2.6" cy="-34.8" rx="3" ry="1" fill="${mix(P.haze, P.plum, 0.3)}"/><path d="M12,-33 L27,-31" stroke="${mix(P.haze, P.plum, 0.3)}" stroke-width="1"/><path d="M-33,4 C-40,6 -46,5 -50,9 M33,4 C40,7 45,6 50,10" stroke="${midSh}" stroke-width="5" stroke-linecap="round" fill="none"/></g>`);
  // the small growth: where it may go, and how big it is at that distance
  const free = (x, y, m = 14) => !deck.onBoards(x, y, m) && !(y < 562 && (Math.abs(x - CEDAR) < 104 || Math.abs(x - FIR) < 110)) && x > 60 && x < 1150;
  const spot = (y0 = 544, y1 = 716, bias = 0.8) => { for (let i = 0; i < 40; i++) { const y = lerp(y0, y1, Math.pow(rnd(), bias)), x = rnd(70, 1140); if (free(x, y)) return [x, y, unitAt(y)]; } return null; };
  const grassDark = [P.teal, mix(P.teal, P.tealDeep, 0.5), mix(P.teal, P.tealLight, 0.5)], grassLit = [mix(P.tealLight, P.cream, 0.5), mix(P.tealLight, P.window, 0.4)], straw = mix(P.peach, P.cream, 0.5);
  { for (const [x, y, w, h] of [[120, 596, 150, 13], [330, 610, 120, 11], [1040, 626, 130, 12], [210, 668, 170, 15], [1100, 684, 120, 13], [390, 676, 90, 9], [990, 578, 110, 8], [80, 560, 120, 8]]) put(y - 20, hummock(x, y, w, h, mix(lit, P.cream, 0.1), P.teal)); }
  for (let i = 0; i < 60; i++) { const p = spot(); if (p) put(p[1], tuft(p[0], p[1], p[2] * rnd(0.09, 0.19), pick(grassDark), pick(grassLit), straw)); }
  for (let i = 0; i < 12; i++) { const p = spot(560); if (p) put(p[1], rosette(p[0], p[1], p[2] * rnd(0.07, 0.11), C.leaf, P.teal)); }
  for (let i = 0; i < 8; i++) { const p = spot(566); if (p) put(p[1], clover(p[0], p[1], p[2] * 0.07, C)); }
  for (const kind of ['daisy', 'poppy', 'lupine', 'buttercup', 'umbel', 'daisy', 'lupine', 'poppy', 'buttercup', 'daisy', 'umbel']) {
    const c = spot(556, 712, 0.7); if (!c) continue;
    for (let j = 0, n = 3 + Math.floor(rnd(0, 4)); j < n; j++) { const x = c[0] + rnd(-0.22, 0.22) * c[2], y = c[1] + rnd(-0.05, 0.05) * c[2]; if (free(x, y)) put(y, flower(kind, x, y, unitAt(y) * (kind === 'lupine' || kind === 'umbel' ? rnd(0.15, 0.22) : rnd(0.09, 0.15)), C)); }
  }
  { const ft = mix(P.tealLight, P.window, 0.12), fs = P.teal;
    for (const [x, y, k, ln] of [[598, 564, 0.2, 0.2], [790, 568, 0.22, -0.2], [102, 600, 0.26, 0], [356, 568, 0.2, 0.1], [1146, 612, 0.26, -0.1], [330, 650, 0.2, -0.1]]) put(y, fern(x, y, unitAt(y) * k, ft, fs, { lean: ln, spread: rnd(0.95, 1.35), wide: rnd(0.17, 0.24), droop: rnd(0.8, 1.15), step: 9, n: 5 })); }
  { const stone = mix(P.haze, P.plum, 0.3), stoneTop = mix(P.haze, P.cream, 0.45);
    for (const [x, y, w] of [[392, 632, 30], [124, 644, 40], [1124, 650, 34], [1060, 706, 46], [300, 580, 22]]) put(y, `<ellipse cx="${x + w * 0.3}" cy="${y + 1}" rx="${w * 0.7}" ry="${w * 0.12}" fill="${shadowTone}" opacity="0.45"/>` + L.rock(x, y, w, w * 0.5, stone, stoneTop)); }
  put(672, toadstools(1050, 674, 13, C)); put(566, toadstools(742, 568, 9, C));
  for (const [x, y, sz] of [[486, 560, 30], [908, 566, 30], [176, 566, 28], [1042, 600, 32]]) put(y, fernlet(x, y, sz, mix(P.tealLight, P.window, 0.12), P.teal));

  // shadows on the grass, all one tone so that where two cross they do not darken twice
  mark('casts');
  const castD = merged(casts);
  o.push(`<path d="${castD}" fill="${shadowTone}" fill-opacity="0.36"/>`);

  // ---- the two trees the walk goes between: a cedar, fluted at the foot, and a fir with a hollow in it
  mark('giants');
  const cedar = mix(mix(P.plum, P.haze, 0.2), P.coralSh, 0.16), fir = mix(P.plum, P.haze, 0.15), deep = mix(P.plumDeep, '#000000', 0.3);
  { const [x, w, by] = giants[0], shape = { fl: 0.3, fh: 110 }, edge = y => trunkHalf(w, by, y, shape), hi = mix(cedar, P.peach, 0.5);
    let s = stub(x - edge(250), 250, 36, -1, 3.4, cedar, P.rim) + stub(x + edge(190), 190, 30, 1, 3, deep, cedar) + stub(x - edge(160), 162, 22, -1, 2.6, cedar, P.rim);
    s += trunk(x, w, by, cedar, P.rim, { bark: 22, shade: deep, rimW: 4, shape, barkLen: [90, 300], barkW: [0.9, 2], flat: true });
    let fl = ''; for (const dx of [-0.3, -0.04, 0.24, 0.44]) { const fx = x + dx * w; fl += `<path d="M${f(fx - 5)},${by + 8} C${f(fx - 7)},${by - 40} ${f(fx - 2)},${by - 90} ${f(fx + 1)},${by - 130} C${f(fx + 4)},${by - 90} ${f(fx + 8)},${by - 40} ${f(fx + 9)},${by + 8}Z"/>`; }
    s += `<g clip-path="url(#${clip(trunkD(x, w, by, shape))})"><g fill="${deep}" opacity="0.5">${fl}</g><g fill="${hi}" opacity="0.3" transform="translate(-9,0)">${fl}</g><g fill="${deep}">${[[18, 262, 3.4], [26, 284, 2.6], [10, 300, 3]].map(([dx, y, r]) => `<ellipse cx="${x + dx}" cy="${y}" rx="${r}" ry="${r * 1.3}"/>`).join('')}</g></g>`;
    o.push(s); }
  { const [x, w, by] = giants[1], shape = { fl: 0.3, fh: 110 }, edge = y => trunkHalf(w, by, y, shape), hi = mix(fir, P.peach, 0.5);
    let s = stub(x + edge(230), 230, 40, 1, 3.6, deep, fir) + stub(x - edge(300), 300, 26, -1, 3, fir, P.rim);
    s += trunk(x, w, by, fir, P.rim, { bark: 15, shade: deep, rimW: 4, shape, barkLen: [50, 170], barkW: [2, 4.6], flat: true });
    s += `<g clip-path="url(#${clip(trunkD(x, w, by, shape))})"><path d="M${x - 2},${by + 8} C${x - 8},${by - 30} ${x - 2},${by - 76} ${x + 16},${by - 84} C${x + 34},${by - 76} ${x + 42},${by - 30} ${x + 40},${by + 8}Z" fill="${P.rim}" opacity="0.5" transform="translate(-3.4,0)"/><path d="M${x - 2},${by + 8} C${x - 8},${by - 30} ${x - 2},${by - 76} ${x + 16},${by - 84} C${x + 34},${by - 76} ${x + 42},${by - 30} ${x + 40},${by + 8}Z" fill="${deep}"/></g>`;
    o.push(s); }
  mark('moss');
  { const tone = mix(P.tealLight, P.window, 0.16), dark = mix(P.tealDeep, P.plumDeep, 0.35), hi = mix(P.tealLight, P.window, 0.4), shape = { fl: 0.3, fh: 110 };
    o.push(moss(CEDAR, 140, 547, x => gC(x) + 28, { top: 150, lean: -1, size: 0.6, tone, dark, hi, seed: 9310, shape, xmax: 1220, twin: false, carpetGrain: false }) + moss(FIR, 150, 552, x => gC(x) + 32, { top: 140, lean: 1, size: 0.6, tone, dark, hi, seed: 9311, shape, xmax: 1220, twin: false, carpetGrain: false })); }

  mark('ground');
  G.sort((a, b) => a[0] - b[0]);
  o.push(G.map(g => g[1]).join('\n'));

  // ---- the landing and the near boards, with the shadows that reach them
  mark('boards');
  const boards = deck.near(castD);
  o.push(boards.svg);
  // ---- the staff. Their shadows first, all in one layer; then, later, the hats where three of them stood
  mark('staff');
  const R = RANGERS(P);
  const cast = (x, s) => { const h = 300 * s; return `<path d="M${f(x - 20 * s)},${FEET - 4} L${f(x + h * 0.24)},${f(FEET + h * 0.01 - 13 * s)} L${f(x + h * 0.44)},${f(FEET + h * 0.04 - 15 * s)} L${f(x + h * 0.47)},${f(FEET + h * 0.066 + 9 * s)} L${f(x + h * 0.24)},${f(FEET + h * 0.05 + 12 * s)} L${f(x - 16 * s)},${FEET + 6}Z"/><ellipse cx="${f(x + h * 0.53)}" cy="${f(FEET + h * 0.062)}" rx="${f(h * 0.12)}" ry="${f(9 * s)}"/>`; };
  o.push(`<g fill="${P.plumDeep}" opacity="0.28" clip-path="url(#${boards.clipId})">${R.map(g => g.name === 'ines' ? cast(g.x, g.s) : until(3, cast(g.x, g.s))).join('')}</g>`);
  for (const g of R) {
    const fig = `<g transform="translate(${g.x},${FEET}) scale(${g.s})">${figFront(g.sp)}</g>`;
    if (g.name === 'ines') o.push(fig);
    else o.push(until(3, fig) + from(4, groundHat(g.x + 6, FEET - 2, g.s * 1.05, P) + (g.name === 'tomas' ? droppedMug(g.x - 44, FEET + 8, g.s * 1.2, P) : g.name === 'june' ? droppedBoard(g.x + 62, FEET + 6, g.s * 1.1, P) : '')));
  }

  // ---- foreground: the trunks that frame the view, the boughs across the top, ferns in the corners
  mark('frame');
  const nearTone = mix(P.plum, P.plumDeep, 0.35), nearSh = mix(P.plumDeep, '#000000', 0.3);
  o.push(trunk(-8, 176, 860, nearTone, P.rim, { bark: 14, shade: nearSh, rimW: 4, flat: true }) + trunk(1216, 190, 880, nearTone, P.rim, { bark: 15, shade: nearSh, rimW: 4, flat: true }));
  mark('canopy');
  { const backTone = mix(P.tealDeep, P.teal, 0.4), backRim = mix(backTone, P.tealLight, 0.45), backBehind = mix(backTone, P.haze, 0.3), frontRim = mix(P.ink, P.teal, 0.55), frontBehind = mix(P.ink, P.tealDeep, 0.6);
    const back = [[-30, 116, 230, 1, 0.12, 0.22], [1230, 118, 250, -1, 0.12, 0.22], [250, 104, 190, 1, 0.14, 0.2], [930, 102, 200, -1, 0.15, 0.2]];
    const front = [[-40, 100, 200, 1, 0.1, 0.19], [1240, 98, 230, -1, 0.09, 0.19], [80, 146, 140, 1, 0.3, 0.24], [1132, 156, 150, -1, 0.3, 0.24]];
    o.push(back.map(([x, y, len, dir, sag, hang]) => spray(x, y, len, dir, { sag, hang }, backTone, backRim, backBehind)).join('')
      + `<rect x="-20" y="0" width="${W + 40}" height="96" fill="${P.ink}"/>`
      + front.map(([x, y, len, dir, sag, hang]) => plain(x, y, len, dir, { sag, hang }, P.ink, frontRim)).join('')); }
  mark('corner');
  o.push(fern(150, 730, 86, mix(P.tealDeep, P.ink, 0.3), P.ink, { lean: 0.2, spread: 1.2, step: 11, n: 6 }) + fern(1096, 734, 80, mix(P.tealDeep, P.ink, 0.3), P.ink, { lean: -0.2, spread: 1.2, step: 11, n: 6 }));
  o.push(`<rect x="0" y="0" width="${W}" height="${H + 60}" fill="url(#${radGrad(W / 2, H * 0.56, 800, [[0.6, '#2A1B33', 0], [1, '#2A1B33', 0.34]])})"/>`);
  const body = marks.map(([name, i], k) => `<g data-part="${name}">${o.slice(i, k + 1 < marks.length ? marks[k + 1][1] : o.length).join('\n')}</g>`).join('\n');
  return { svg: `<defs>${L.defs.join('\n')}</defs>${body}`, vb: [0, 116, W, 604], vbm: [330, 150, 740, 570] };
}
