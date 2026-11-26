// The lake depth diagram, on the Lakeshore Loop page. Echo Lake is cut straight down off the end of the lodge dock and
// seen from the side, on the same paper as the track card and the daylight chart, drawn to scale: heights, depths and
// widths all at one scale (k units to the foot), the dock and the tree included.
//
// On the left is the bank the lodge stands on. It goes on under the dock as a shelf, and past the end of the dock it
// drops away as a steep wall of rock to a flat floor 260 ft down. The 259 ft Douglas fir from Cathedral Stand is
// stood on the floor for scale, the way the old firs grow: a long bare trunk with the stubs of old limbs on it, and a
// ragged crown on the top two thirds. Its top is a foot under the surface. A foot is about one unit at this scale, so
// a ring round the top of the tree is drawn again beside it, ten times larger, where the foot can be seen. A staff up
// the right-hand side measures feet above the bottom, in blocks of ten.
//
// Every word on the card is the copy's own (trailLakeshore.diagram in src/content/trail-lakeshore.mjs), with its stage
// versions. The three figures the drawing depends on, the depth, the tree and the foot to spare, are read from that
// same copy, and the module will not draw if they stop agreeing. Nothing gives the dock's length or the shape of the
// bank under the water; they are drawn to look like a lodge dock on a steep shore, at the same scale as the rest.
//
// By stage:
//   3  the fir's top section was lost on Sept. 12, and the drawn tree has lost it too. The part that is gone is left
//      as a broken outline, so the foot to spare is still measured to where its top was.
//   4  one tick in pen at the waterline on the staff, and a note beside it in the same hand. Nothing else changes.
//   5  the staff carries on above the water, past the card's border and off the top of it. Nothing is drawn at those
//      heights. The empty paper above the water is the point.
//   6  only the note changes. Nothing is in the water.
// It is never drawn, in any form, at any stage. The diagram only measures.
import * as L from './lib.mjs';
import { conifer } from './conifers.mjs';
import { T, twoLayouts, sheet, tooth, rule, PAPER, INK, INK2, BROWN, DEEP, BONE } from './infokit.mjs';
import { trailLakeshore } from './content/trail-lakeshore.mjs';
const { f, mix, lerp, poly, curveFn, from, until, clip, grain, GL, linGrad } = L;

const D = trailLakeshore.diagram, LB = D.labels;
const word = v => Array.isArray(v) ? v[0] : v, altsOf = v => Array.isArray(v) ? v[1] : undefined;
const DEPTH = parseFloat(LB.depth), FIR = parseFloat(word(LB.fir)), SPARE = parseFloat(LB.spare);
if (!(DEPTH > 0 && FIR > 0 && Math.abs(DEPTH - FIR - SPARE) < 1e-9)) throw new Error(`depth: ${LB.depth} of water and a ${word(LB.fir)} do not leave ${LB.spare}`);
const ABOVE = D.scaleMarks.above, KNEES = Math.min(...Object.keys(altsOf(LB.knees)).map(Number));      // the stages the staff grows and the pen appears
const LOST = 27;                        // feet gone from the top of the fir from stage 3: drawn, never stated
const CORAL = '#E4694F', CORAL_D = '#B4473F', WHITE = mix(PAPER, '#FFFFFF', 0.55);
// The ground along the cut, the same in both layouts: feet out from the end of the dock (landward is negative), and
// feet below the surface (above it is negative). The bank, then the shelf the dock stands on, then the wall.
const DOCK = 52, OFF = 47;              // the dock's length; where the depth is measured, off its end
const BANK = [[-140, -16], [-110, -15.5], [-84, -13], [-66, -8], [-54, -3], [-45, 0], [-35, 5], [-22, 11], [-9, 17], [0, 21.5]];
const WALL = [[0, 21.5], [3.5, 50], [6, 90], [8.7, 140], [12.2, 190], [16.5, 224], [22.6, 246], [31.3, 256], [41.7, 260]];

// ---- lettering
// Staged copy, set on as many lines as its longest version needs. Every version is broken by `split`, and each line
// carries its own wording for every stage ('' where that stage's version is shorter), so the page can reword it.
function block(x, y, lh, v, split, o = {}){
  const vs = [['0', word(v)], ...Object.entries(altsOf(v) || {})].map(([s, t]) => [s, t ? split(t) : []]), n = Math.max(...vs.map(([, ls]) => ls.length));
  let out = '';
  for (let i = 0; i < n; i++) { const alts = {}; for (const [s, ls] of vs.slice(1)) alts[s] = ls[i] || ''; out += T(x, y + i * lh, vs[0][1][i] || '', { ...o, alts: vs.length > 1 ? alts : undefined }); }
  return out;
}
// a plain word-wrap at most `max` characters wide
const wrap = max => s => { const out = []; let ln = ''; for (const w of s.split(' ')) { if (ln && ln.length + 1 + w.length > max) { out.push(ln); ln = w; } else ln = ln ? ln + ' ' + w : w; } if (ln) out.push(ln); return out; };
// The tree's label is a figure and a name. The figure ("259 ft") is set on its own; the name breaks where its own
// punctuation does, after the comma or before the bracket, and wraps if a part is still too long.
const FIG = /^(\d[\d,.]* ft) /;
const figOf = v => word(v).match(FIG)[1];
const nameOf = v => { const cut = s => s.replace(FIG, ''); const a = altsOf(v); return a ? [cut(word(v)), Object.fromEntries(Object.entries(a).map(([s, t]) => [s, cut(t)]))] : cut(word(v)); };
const parts = max => s => { if (s.length <= max) return [s]; const b = s.indexOf(' ('), c = s.indexOf(', '); return (b > 0 ? [s.slice(0, b), s.slice(b + 1)] : c > 0 ? [s.slice(0, c + 1), s.slice(c + 2)] : [s]).flatMap(wrap(max)); };

// The tip of the fir's leader as it shows in the ring: a slender shoot with its needles all round it, standing up
// from below the ring to a point under the surface. m is the ring's units to the foot. The needles toward the light
// (the left) are lit.
function shoot(x, tipY, baseY, m, C){
  const len = baseY - tipY, hw = y => 0.3 * m * (0.2 + 0.8 * (y - tipY) / len), r = L.source(77);
  let stem = `M${f(x)},${f(tipY - 0.7 * m)}`, back = '';
  for (let y = tipY; y <= baseY + 1; y += len / 8) { stem += ` L${f(x + hw(y))},${f(y)}`; back = ` L${f(x - hw(y))},${f(y)}` + back; }
  let lit = '', dark = '';
  for (let y = tipY + 0.25 * m; y < baseY + 2; y += 0.16 * m) for (const s of [-1, 1]) {
    const t = (y - tipY) / len, l = m * (0.28 + 0.34 * Math.min(1, t * 1.6)) * r(0.8, 1.15), a = (52 + r(-10, 10)) * Math.PI / 180, x0 = x + s * hw(y) * 0.6;
    const d = `M${f(x0)},${f(y)} l${f(s * l * Math.sin(a))},${f(-l * Math.cos(a))} `;
    if (s < 0) lit += d; else dark += d;
  }
  const bud = `M${f(x)},${f(tipY)} q${f(0.16 * m)},${f(-0.3 * m)} 0,${f(-0.62 * m)} q${f(-0.16 * m)},${f(0.32 * m)} 0,${f(0.62 * m)}Z`;
  return `<path d="${stem}${back}Z" fill="${mix(C.tone, C.trunk, 0.35)}"/><path d="${dark}" stroke="${C.tone}" stroke-width="${f(0.11 * m)}" stroke-linecap="round" fill="none"/><path d="${lit}" stroke="${C.lit}" stroke-width="${f(0.11 * m)}" stroke-linecap="round" fill="none"/><path d="${bud}" fill="${C.tone}"/>`;
}

function draw(c, seed){
  const P = L.P, { W, H, m, k, Ys, PX0, PX1 } = c, RX = W - m;
  const Yb = Ys + DEPTH * k, PY1 = Yb + c.bed, yAt = ft => Yb - ft * k, below = d => Ys + d * k;
  const o = [sheet(W, H)];

  // ---- the head of the card
  if (c.wide) o.push(T(m, c.titleY, D.title, { font: 'serif', size: c.title }));
  else { const i = D.title.indexOf(': ') + 1; o.push(T(m, c.titleY, D.title.slice(0, i), { font: 'serif', size: c.title }) + T(m, c.titleY + c.titleLh, D.title.slice(i + 1), { font: 'serif', size: c.title })); }
  o.push(rule(m, c.ruleY, RX, c.ruleY));

  // ---- the ground along the cut. The bank rolls down to the water and carries on under the dock as a shelf; past
  // the end of the dock a wall of rock drops to the floor, rough with ledges and with a fan of fallen rock at its foot;
  // the floor is level, so the depth off the end of the dock is the depth under the tree.
  const r = L.source(seed + 1), prof = [];
  const out = ft => c.dockEnd + ft * k, cBank = BANK.map(([x, d]) => [out(x), d]), cWall = WALL.map(([x, d]) => [out(x), d]);
  const bank = curveFn(cBank.map(([x, d]) => [x, below(d)]));
  const shoreX = cBank.find(([, d]) => d === 0)[0], lipX = cBank[cBank.length - 1][0];
  for (let x = PX0; x < lipX; x += 3) prof.push([x, bank(x)]);
  for (let i = 1; i < cWall.length; i++) {
    const [xa, da] = cWall[i - 1], [xb, db] = cWall[i], n = Math.max(1, Math.round((db - da) / 12));
    for (let j = 0; j < n; j++) { const t = j / n, rough = i > 1 && i < cWall.length - 2; prof.push([lerp(xa, xb, t) + (rough ? r(-1, 1.2) * k + (j % 2 ? r(0.8, 2) * k : 0) : 0), below(lerp(da, db, t))]); }
  }
  const footX = cWall[cWall.length - 1][0];
  prof.push([footX, Yb], [PX1, Yb]);
  const shoreAt = prof.findIndex(([x]) => x >= shoreX);
  prof.splice(shoreAt, 0, [shoreX, Ys]);
  const ground = poly([...prof, [PX1, PY1], [PX0, PY1]]), water = poly([[shoreX, Ys], [PX1, Ys], ...prof.slice(shoreAt).reverse()]);
  const gc = clip(ground), wc = clip(water);

  // The ground in section. Under the grass, a band of soil that carries on under the dock as the shelf and gives out
  // where the wall begins. Below it rock, grey-plum and darkening with depth, with beds running across it and joints
  // opening off the face of the wall. Along the floor, a lens of silt, thick out in the basin and thinning against the
  // foot of the wall, with the stones that have come off the wall lying on it.
  const soil = mix(BROWN, PAPER, 0.16), rockTop = mix(P.haze, BROWN, 0.4), rockDeep = mix(P.midShade, P.plum, 0.25), seam = mix(rockDeep, P.plumDeep, 0.45), ledge = mix(rockTop, PAPER, 0.4);
  const silt = mix(P.haze, P.plum, 0.25), rock = mix(rockTop, rockDeep, 0.3);
  o.push(`<path d="${ground}" fill="url(#${linGrad(0, Ys, 0, PY1, [[0, rockTop], [1, rockDeep]])})"/>`);
  { let beds = '', lits = ''; for (let n = 0; n < c.beds; n++) { const y = lerp(Ys + 26 * k, Yb - 8, n / (c.beds - 1)) + r(-4, 4), x0 = PX0 + r(-30, 20), len = r(50, 150), dip = len * r(0.04, 0.1);
      beds += `M${f(x0)},${f(y)} q${f(len * 0.5)},${f(r(-2, 2))} ${f(len)},${f(dip)} `; lits += `M${f(x0 + 6)},${f(y + 1.6)} q${f(len * 0.4)},${f(r(-1, 1))} ${f(len * 0.8)},${f(dip * 0.8)} `; }
    let joints = ''; for (const [x, y] of prof.filter(([x, y]) => y > Ys + 26 * k && y < Yb - 6 && x < footX)) if (r() < 0.75) { const len = r(5, 16) * k; joints += `M${f(x - 1)},${f(y)} l${f(-len)},${f(r(-0.3, 0.6) * len)} `; }
    o.push(`<g clip-path="url(#${gc})"><path d="${lits}" stroke="${ledge}" stroke-width="1" fill="none" opacity="0.4" stroke-linecap="round"/><path d="${beds}" stroke="${seam}" stroke-width="1.1" fill="none" opacity="0.55" stroke-linecap="round"/><path d="${joints}" stroke="${seam}" stroke-width="1" fill="none" opacity="0.6" stroke-linecap="round"/></g>`); }
  { const top = prof.filter(([x]) => x < lipX), th = x => c.soil * k * Math.min(1, (lipX - x) / (16 * k)) + r(-0.6, 0.6);
    o.push(`<path d="${poly([...top, [lipX, below(cBank[cBank.length - 1][1])], ...top.slice().reverse().map(([x, y]) => [x, y + th(x)])])}" fill="url(#${linGrad(0, below(-16), 0, below(c.soil + 20), [[0, soil], [1, mix(BROWN, P.plum, 0.2)]])})"/>`); }
  { const lens = poly([[footX - 6 * k, Yb], [PX1, Yb], [PX1, PY1], [footX - 18 * k, PY1]]); let lines = ''; for (let n = 0; n < c.stones; n++) { const y = lerp(Yb + 4, PY1 - 3, r()), x = lerp(footX, PX1 - 20, r()); lines += `M${f(x)},${f(y)} h${f(r(6, 22))} `; }
    o.push(`<path d="${lens}" fill="${silt}"/><path d="${lines}" stroke="${mix(silt, PAPER, 0.3)}" stroke-width="0.9" fill="none" opacity="0.5" stroke-linecap="round"/><path d="M${f(footX - 6 * k)},${f(Yb)} L${f(footX - 18 * k)},${f(PY1)}" stroke="${seam}" stroke-width="1" opacity="0.6"/>`); }
  o.push(`<g clip-path="url(#${gc})">` + grain(PX0, below(-18), PX1 - PX0, PY1 - below(-18), GL(0, Ys, 0, PY1, [[0, 0.08], [0.5, 0.16], [1, 0.28]]), P.plumDeep, { seed: seed + 2 }) + `</g>`);
  { let stones = '', tops = ''; for (let n = 0; n < c.stones; n++) { const x = footX - 8 * k + Math.pow(r(), 1.7) * 44 * k, w = r(1.4, 3.6) * k * (1 - (x - footX) / (60 * k)), y = Yb + 0.6;
      stones += `M${f(x - w)},${f(y)} q${f(w * 0.15)},${f(-w * 1.2)} ${f(w * 1.1)},${f(-w)} q${f(w * 0.85)},${f(w * 0.1)} ${f(w * 0.9)},${f(w)}Z `; tops += `M${f(x - w * 0.7)},${f(y - w * 0.55)} q${f(w * 0.3)},${f(-w * 0.55)} ${f(w * 0.9)},${f(-w * 0.45)} `; }
    o.push(`<path d="M${f(footX - 3)},${f(Yb + 1.1)} H${PX1}" stroke="${mix(silt, PAPER, 0.4)}" stroke-width="2" opacity="0.8"/><path d="${stones}" fill="${rock}"/><path d="${tops}" stroke="${ledge}" stroke-width="0.9" fill="none" stroke-linecap="round"/>`); }
  // grass along the top of the bank
  { let blades = ''; for (let x = PX0 + 2; x < shoreX - 2; x += r(2.2, 4.5)) { const y = bank(x) + 0.8, h = r(1.8, 3.8) * k; blades += `M${f(x - 0.8)},${f(y)} L${f(x + r(-1, 1))},${f(y - h)} L${f(x + 0.8)},${f(y)}Z `; }
    o.push(`<path d="M${PX0},${f(bank(PX0))} ${prof.filter(([x]) => x <= shoreX).map(([x, y]) => `L${f(x)},${f(y)}`).join(' ')}" stroke="${mix(P.tealLight, BROWN, 0.3)}" stroke-width="2.6" fill="none" stroke-linejoin="round"/><path d="${blades}" fill="${P.tealLight}"/>`); }

  // ---- the water: pale under the surface and darkening all the way down, with light coming in from the upper left
  const wTop = mix(P.tealLight, PAPER, 0.66), wDeep = mix(P.tealDeep, P.ink, 0.3);
  o.push(`<path d="${water}" fill="url(#${linGrad(0, Ys, 0, Yb, [[0, wTop], [0.05, mix(P.tealLight, PAPER, 0.5)], [0.32, mix(P.tealLight, PAPER, 0.08)], [0.66, P.teal], [1, wDeep]])})"/>`);
  { const deep = DEPTH * k * 0.55, fade = linGrad(0, Ys, 0, Ys + deep, [[0, PAPER, 0.3], [1, PAPER, 0]]); let rays = '';
    for (const [x, w] of c.rays) rays += `M${f(x)},${Ys} h${f(w)} L${f(x + w * 0.5 + deep * 0.32)},${f(Ys + deep)} h${f(-w * 0.3)}Z `;
    o.push(`<g clip-path="url(#${wc})"><path d="${rays}" fill="url(#${fade})"/>` + grain(shoreX, Ys, PX1 - shoreX, Yb - Ys, GL(0, Ys, 0, Yb, [[0, 0], [0.35, 0.08], [1, 0.36]]), P.ink, { seed: seed + 3 }) + `</g>`);
    // ripples catching the light just under the surface
    let rip = ''; for (let x = shoreX + 8 + r(0, 20); x < PX1 - 20; x += r(26, 64)) rip += L.sliver(x, Ys + r(2.5, 6) * k, r(10, 30), r(0.8, 1.4), r(-0.4, 0.4));
    o.push(`<path d="${rip}" fill="${PAPER}" opacity="0.6"/><path d="M${f(shoreX)},${f(Ys + 1.6)} H${PX1}" stroke="${PAPER}" stroke-width="1.4" opacity="0.55"/>`); }

  // ---- the dock: a plank deck three feet above the water on pilings that stand on the shelf, a handrail along the
  // landward stretch, a post with a life ring at the lake end and a ladder down from it
  { const xa = out(-DOCK), xb = out(0), dk = P.plumDeep, wood = mix(P.plum, P.haze, 0.55), top = Ys - 3 * k, th = Math.max(2, 1.6 * k), wetDk = mix(dk, P.teal, 0.4);
    let dry = '', wet = '', brace = '';
    const piles = []; for (let x = xa + 9 * k; x <= xb - 1.5 * k; x += (xb - xa - 10 * k) / Math.round((xb - xa) / (12 * k))) piles.push(x);
    const floorAt = x => { const seg = prof.findIndex(([px]) => px >= x); const [x0, y0] = prof[seg - 1], [x1, y1] = prof[seg]; return lerp(y0, y1, (x - x0) / (x1 - x0 || 1)); };
    piles.forEach((x, i) => { const fl = floorAt(x); dry += `M${f(x)},${f(top + th)} V${Ys} `; wet += `M${f(x)},${Ys} V${f(fl + 1.5)} `; if (i && fl > Ys + 8 * k) { const p = piles[i - 1]; brace += `M${f(p)},${f(Ys + 2)} L${f(x)},${f(Math.min(fl, floorAt(p)) - 1)} `; } });
    o.push(`<path d="${brace}" stroke="${wetDk}" stroke-width="0.7" fill="none" opacity="0.7"/><path d="${wet}" stroke="${wetDk}" stroke-width="${f(1.8 * k)}" fill="none"/><path d="${dry}" stroke="${dk}" stroke-width="${f(1.8 * k)}" fill="none"/>`);
    o.push(`<path d="M${f(xb + 1.2)},${f(top - 0.5)} V${f(Ys + 5 * k)} M${f(xb + 3.4)},${f(top + 1.5)} V${f(Ys + 5 * k)} M${f(xb + 1.2)},${f(top + 3)} h2.2 M${f(xb + 1.2)},${f(Ys + 1.6 * k)} h2.2 M${f(xb + 1.2)},${f(Ys + 3.6 * k)} h2.2" stroke="${dk}" stroke-width="0.8" fill="none" stroke-linecap="round"/>`);
    const ra = xa + 3 * k, rb = lerp(xa, xb, 0.45); let up = ''; for (let x = ra; x <= rb + 0.1; x += (rb - ra) / 3) up += `M${f(x)},${f(top)} v${f(-3.4 * k)} `;
    o.push(`<path d="${up}M${f(ra - 0.5)},${f(top - 3.4 * k)} H${f(rb + 0.5)}" stroke="${dk}" stroke-width="0.75" fill="none"/>`);
    o.push(`<rect x="${f(xb - 5 * k)}" y="${f(top - 4.6 * k)}" width="${f(1.5 * k)}" height="${f(4.6 * k)}" fill="${dk}"/><circle cx="${f(xb - 5 * k - 2.2)}" cy="${f(top - 2.4 * k)}" r="${f(1.9 * k)}" fill="none" stroke="${CORAL}" stroke-width="${f(0.95 * k)}"/>`);
    o.push(`<rect x="${f(xa)}" y="${f(top)}" width="${f(xb - xa + 0.6)}" height="${f(th)}" fill="${dk}"/><path d="M${f(xa)},${f(top + 0.3)} H${f(xb + 0.6)}" stroke="${wood}" stroke-width="0.9"/>`);
  }
  o.push(`<path d="M${f(shoreX)},${Ys} H${PX1}" stroke="${mix(DEEP, P.tealLight, 0.35)}" stroke-width="1.3"/>`);

  // ---- the fir
  const xT = c.treeX, crownY = yAt(FIR * c.bare), tipY = yAt(FIR), bark = mix(BROWN, P.plumDeep, 0.56), barkLit = mix(BROWN, P.plum, 0.12);
  const tone = mix(P.tealDeep, P.ink, 0.35), C = { tone, lit: mix(tone, P.tealLight, 0.62), mid: mix(tone, P.tealLight, 0.3), deep: mix(tone, '#04141A', 0.5), trunk: bark, rim: P.tealLight, rimW: 0.8 };
  const fid = L.nid('fir');
  { const hw = y => lerp(2.4, 4.4, (y - crownY) / (Yb - crownY)) * k, ys = []; for (let y = crownY + 4; y <= Yb - 7 * k; y += 8) ys.push(y);
    // the trunk, flaring into roots where it meets the floor
    const R = [[xT + 1.2 * k, crownY], ...ys.map(y => [xT + hw(y), y]), [xT + 5.2 * k, Yb - 2.4 * k], [xT + 8.4 * k, Yb + 0.6], [xT - 8.2 * k, Yb + 0.6], [xT - 5 * k, Yb - 2.4 * k], ...ys.slice().reverse().map(y => [xT - hw(y), y]), [xT - 1.2 * k, crownY]];
    const trunk = poly(R), lit = poly([[xT - 1.2 * k, crownY], ...ys.map(y => [xT - hw(y) * 0.1, y]), [xT - 1 * k, Yb - 2.4 * k], [xT - 5 * k, Yb - 2.4 * k], ...ys.slice().reverse().map(y => [xT - hw(y), y])]);
    const tc = clip(trunk), rr = L.source(seed + 5);
    let furrows = ''; for (let n = 0; n < 6; n++) { const x = xT + rr(-3.2, 3.2) * k, y0 = rr(crownY + 10, Yb - 40), len = rr(20, 60); furrows += `M${f(x)},${f(y0)} v${f(len)} `; }
    let stubs = ''; for (let n = 0; n < 6; n++) { const y = lerp(crownY + 6, Yb - 36 * k, (n + rr(0.2, 0.8)) / 6), s = n % 2 ? 1 : -1, len = rr(3, 8) * k; stubs += `M${f(xT + s * hw(y) * 0.8)},${f(y)} l${f(s * len)},${f(len * rr(0.15, 0.6))} `; }
    const ref = {}, crown = conifer(xT, crownY + 2, crownY + 2 - tipY, C, { kind: 'spruce', seed: c.fseed, grainy: true, w: c.crownW * k, lean: 0, sun: -1, ref });
    // the water over the tree, deepening toward the floor, so the tree stands in it rather than in front of it
    const shape = ref.shape.replace(/\/>/g, ` transform="translate(${f(xT)},${f(crownY + 2)})"/>`), vc = L.nid('cu'); L.defs.push(`<clipPath id="${vc}">${shape}<path d="${trunk}"/></clipPath>`);
    const veil = `<rect x="${f(xT - c.crownW * k * 1.5 - 12)}" y="${f(tipY - 2)}" width="${f(c.crownW * k * 3 + 24)}" height="${f(Yb - tipY + 4)}" fill="url(#${linGrad(0, tipY, 0, Yb, [[0, wTop, 0], [0.4, P.teal, 0.12], [1, wDeep, 0.5]])})" clip-path="url(#${vc})"/>`;
    L.defs.push(`<g id="${fid}"><path d="${stubs}" stroke="${bark}" stroke-width="${f(1.1 * k)}" fill="none" stroke-linecap="round"/><path d="${trunk}" fill="${bark}"/><g clip-path="url(#${tc})"><path d="${lit}" fill="${barkLit}"/><path d="${furrows}" stroke="${mix(bark, P.ink, 0.4)}" stroke-width="0.7" fill="none" opacity="0.7"/></g>${crown}${veil}</g>`);
  }
  // 3 on: the top section gone, broken off ragged, and where it was left as a broken outline
  { const yB = tipY + LOST * k, rB = c.crownW * k * (0.15 + 0.85 * Math.pow(LOST / (FIR * (1 - c.bare)), 0.9)) + 1.5, rr = L.source(seed + 6);
    const cut = [[xT - 80, yB + 2]]; for (let x = xT - 9; x <= xT + 9; x += 3) cut.push([x, yB + rr(-2.2, 2.2) * k]); cut.push([xT + 80, yB + 2], [xT + 80, PY1], [xT - 80, PY1]);
    const bc = clip(poly(cut)), hl = yB - tipY;
    const ghost = [[xT - rB, yB], [xT - rB * 0.42, yB - hl * 0.34], [xT - rB * 0.66, yB - hl * 0.36], [xT - rB * 0.24, yB - hl * 0.66], [xT - rB * 0.36, yB - hl * 0.68], [xT, tipY], [xT + rB * 0.36, yB - hl * 0.68], [xT + rB * 0.24, yB - hl * 0.66], [xT + rB * 0.66, yB - hl * 0.36], [xT + rB * 0.42, yB - hl * 0.34], [xT + rB, yB]];
    o.push(until(2, `<use href="#${fid}"/>`) + from(3, `<use href="#${fid}" clip-path="url(#${bc})"/><path d="${poly(ghost).replace(/Z$/, '')}" stroke="${INK}" stroke-width="1.1" stroke-dasharray="2.6 2" fill="none" opacity="0.85"/>`));
  }

  // ---- off the end of the dock: the surface to the floor
  { const x = out(OFF), a = 4.6, hd = (y, s) => `M${f(x - 3)},${f(y + s * a * 1.5)} L${f(x)},${f(y)} L${f(x + 3)},${f(y + s * a * 1.5)}Z`;
    o.push(`<path d="M${f(x)},${f(Ys + 2)} V${f(Yb - 2)}" stroke="${PAPER}" stroke-width="3" opacity="0.5"/><path d="M${f(x)},${f(Ys + 4)} V${f(Yb - 4)}" stroke="${INK}" stroke-width="1.1"/><path d="${hd(Ys + 0.8, 1)} ${hd(Yb - 0.8, -1)}" fill="${INK}" stroke="${PAPER}" stroke-width="0.6" paint-order="stroke"/>`);
    const ty = lerp(Ys, Yb, c.depthTag), tw = c.tagW;
    o.push(`<rect x="${f(x - tw / 2)}" y="${f(ty - 13)}" width="${tw}" height="22" rx="4" fill="${PAPER}" stroke="${INK}" stroke-width="1"/>` + T(x, ty + 3.4, LB.depth, { size: c.tagSize, weight: 700, anchor: 'middle', num: true })); }

  // ---- the foot to spare: a ring round the top of the tree, and the same place ten times larger, joined to it
  { const { R, M, at: [lx, ly] } = c.loupe, r0 = 6.5, cx0 = xT, cy0 = Ys + 0.5 * k, Lx = lx - cx0, Ly = ly - cy0, Ld = Math.hypot(Lx, Ly), vx = Lx / Ld, vy = Ly / Ld, cs = (r0 - R) / Ld;
    let links = ''; for (const s of [-1, 1]) { const sn = s * Math.sqrt(1 - cs * cs), nx = vx * cs - vy * sn, ny = vx * sn + vy * cs; links += `M${f(cx0 + r0 * nx)},${f(cy0 + r0 * ny)} L${f(lx + R * nx)},${f(ly + R * ny)} `; }
    const sY = ly - R * 0.32, tY = sY + SPARE * M, lc = L.nid('cu'), sx = lx - R * 0.12; L.defs.push(`<clipPath id="${lc}"><circle cx="${f(lx)}" cy="${f(ly)}" r="${R}"/></clipPath>`);
    const inner = `<rect x="${f(lx - R)}" y="${f(ly - R)}" width="${R * 2}" height="${f(sY - ly + R)}" fill="${WHITE}"/><rect x="${f(lx - R)}" y="${f(sY)}" width="${R * 2}" height="${f(ly + R - sY)}" fill="url(#${linGrad(0, sY, 0, ly + R, [[0, wTop], [1, mix(P.tealLight, PAPER, 0.42)]])})"/>`
      + `<path d="${L.sliver(lx - R * 0.9, sY + 4, R * 0.5, 1.6, 0.3)} ${L.sliver(lx + R * 0.3, sY + 6.5, R * 0.45, 1.4, -0.3)}" fill="${PAPER}" opacity="0.7"/><path d="M${f(lx - R)},${f(sY + 2.2)} H${f(lx + R)}" stroke="${PAPER}" stroke-width="2" opacity="0.55"/>`;
    const tip = until(2, shoot(sx, tY, ly + R + 2, M, C)) + from(3, `<path d="M${f(sx - 0.62 * M)},${f(ly + R + 2)} L${f(sx)},${f(tY)} L${f(sx + 0.62 * M)},${f(ly + R + 2)}" stroke="${INK}" stroke-width="1" stroke-dasharray="2.4 2.4" fill="none" opacity="0.7"/>`);
    // the foot itself: the level of the top carried across to a mark between it and the surface
    const mx = lx + R * 0.36, gap = `<path d="M${f(sx + 3)},${f(tY)} H${f(mx + 5)}" stroke="${INK}" stroke-width="0.8" stroke-dasharray="1 2" fill="none"/><path d="M${f(mx)},${f(sY + 1)} V${f(tY - 1)} M${f(mx - 3.4)},${f(sY)} h6.8 M${f(mx - 3.4)},${f(tY)} h6.8" stroke="${INK}" stroke-width="1.2" fill="none"/>`;
    o.push(`<circle cx="${f(cx0)}" cy="${f(cy0)}" r="${r0}" fill="none" stroke="${INK}" stroke-width="1.1"/><path d="${links}" stroke="${INK}" stroke-width="0.8" fill="none"/>`
      + `<circle cx="${f(lx)}" cy="${f(ly)}" r="${R + 2.6}" fill="${PAPER}"/><g clip-path="url(#${lc})">${inner}${tip}<path d="M${f(lx - R)},${f(sY)} H${f(lx + R)}" stroke="${mix(DEEP, P.tealLight, 0.35)}" stroke-width="1.3"/>${gap}</g><circle cx="${f(lx)}" cy="${f(ly)}" r="${R}" fill="none" stroke="${INK}" stroke-width="1.3"/>`);
    o.push(T(c.spare[0], c.spare[1], LB.spare, { size: c.label, weight: 650, anchor: c.spare[2] || 'start' })); }

  // ---- the staff: feet above the bottom, in blocks of ten, numbered every fifty. It stands against the cut edge of
  // the water and ends at the surface. From stage 5 it carries on above the water, as many blocks and numbers as the
  // card has room for and on past its edge, where the last of them is cut off.
  const SX = PX1, SW = c.sw, card = clip(`M0,0 H${W} V${H} H0Z`);
  const blocks = (f0, f1) => { let d = ''; for (let ft = f0; ft < f1; ft += 10) if ((ft / 10) % 2 === 0) d += `M${SX},${f(yAt(Math.min(ft + 10, f1)))} h${SW} V${f(yAt(ft))} h${-SW}Z `; return `<rect x="${SX}" y="${f(yAt(f1))}" width="${SW}" height="${f((f1 - f0) * k)}" fill="${WHITE}"/><path d="${d}" fill="${INK}"/><path d="M${SX},${f(yAt(f0))} V${f(yAt(f1))} M${SX + SW},${f(yAt(f0))} V${f(yAt(f1))}" stroke="${INK}" stroke-width="1"/>`; };
  const marks = list => list.map(s => { const y = yAt(+s); return `<path d="M${SX + SW},${f(y)} h5" stroke="${INK}" stroke-width="1"/>` + T(SX + SW + 8, y + c.markSize * 0.34, s, { size: c.markSize, weight: 600, fill: INK2, num: true }); }).join('');
  o.push(blocks(0, DEPTH) + `<path d="M${SX},${f(Yb)} h${SW}" stroke="${INK}" stroke-width="1"/>` + marks(D.scaleMarks.marks));
  { const topFt = Math.ceil((Yb + 4) / k / 10) * 10, shown = ABOVE.marks.filter(s => yAt(+s) + c.markSize > 0);
    o.push(from(ABOVE.from, `<g clip-path="url(#${card})">${blocks(DEPTH, topFt)}${marks(shown)}</g>`)); }
  o.push(`<path d="M${SX},${f(Ys)} h${SW}" stroke="${INK}" stroke-width="1"/>`);
  o.push(T(c.scaleX, Yb, LB.scale, { size: c.small, fill: INK2, rot: -90 }));

  // ---- the frame of the cut: down the left edge and along the bottom, and the line of the ground over everything
  o.push(`<path d="M${PX0},${f(prof[0][1])} V${f(PY1)} H${SX}" stroke="${INK}" stroke-width="1.3" fill="none"/><path d="M${f(PX0)},${f(prof[0][1])} ${prof.map(([x, y]) => `L${f(x)},${f(y)}`).join(' ')}" stroke="${INK}" stroke-width="1.1" fill="none" stroke-linejoin="round"/>`);

  // ---- the labels
  o.push(T(c.dockAt[0], c.dockAt[1], LB.dock, { size: c.label, weight: 650, anchor: c.dockAt[2] || 'middle' }));
  // the surface: the level mark sits on the water by the staff, its name beside it (above it, where the card is narrow)
  { const [ax, ay, anchor] = c.surf, vx = c.vee; o.push(`<path d="M${f(vx - 4.6)},${f(Ys - 7.4)} h9.2 L${f(vx)},${f(Ys - 0.8)}Z" fill="${WHITE}" stroke="${INK}" stroke-width="1.1" stroke-linejoin="round"/><path d="M${f(vx - 4)},${f(Ys + 3.4)} h8 M${f(vx - 2.4)},${f(Ys + 6.2)} h4.8" stroke="${INK}" stroke-width="1" opacity="0.8"/>`
    + T(ax, ay, LB.surface, { size: c.label, weight: 650, anchor })); }
  // the tree: its figure, and its name under it
  { const [fx, fy] = c.firAt, lh = c.label + 4;
    o.push(T(fx, fy, figOf(LB.fir), { size: c.label + 2, weight: 700, fill: BONE, num: true }) + block(fx, fy + lh + 1, lh, nameOf(LB.fir), parts(c.firMax), { size: c.label, weight: 600, fill: BONE }));
    if (c.firLead) { const ly = fy - c.label * 0.36; o.push(`<path d="M${f(fx - 6)},${f(ly)} H${f(xT + 3.4 * k)}" stroke="${BONE}" stroke-width="0.9" fill="none" opacity="0.85"/><circle cx="${f(xT + 3 * k)}" cy="${f(ly)}" r="1.7" fill="${BONE}"/>`); } }
  o.push(T(c.bottomAt[0], Yb + c.bed * 0.5 + c.small * 0.36, LB.bottom, { size: c.small, weight: 650, fill: BONE, anchor: c.bottomAt[1] || 'start' }));

  // ---- 4 on: one tick in pen across the staff at the waterline, and the guest's report written above it in the same
  // hand, with a stroke down to the tick from the end of its last line
  { const [kx, ky] = c.knees, ex = SX + SW + 8, lh = c.hand + 3, n = Math.max(1, ...Object.values(altsOf(LB.knees)).map(t => wrap(c.kneesMax)(t).length)), ly = ky + (n - 1) * lh;
    const pen = `<path d="M${f(SX - 4)},${f(Ys + 0.8)} Q${f(SX + 4)},${f(Ys - 0.1)} ${f(ex)},${f(Ys - 1.4)}" stroke="${CORAL_D}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`
      + `<path d="M${f(kx + 3)},${f(ly - 4)} C${f(kx + 7)},${f(ly - 2)} ${f(SX - 1)},${f(lerp(ly, Ys, 0.5))} ${f(SX - 2)},${f(Ys - 3.2)}" stroke="${CORAL_D}" stroke-width="1.1" fill="none" stroke-linecap="round"/>`;
    o.push(from(KNEES, pen) + block(kx, ky, lh, LB.knees, wrap(c.kneesMax), { font: 'serif', size: c.hand, fill: CORAL_D, italic: true, anchor: 'end', rot: -1.6 })); }

  // ---- the notes. The first gets shorter as the stages go on; the second follows straight on from wherever the
  // first ends at each stage, so no hole is left between them.
  { const split = wrap(c.noteMax), lines = s => { let v = word(D.notes[0]); for (const [a, t] of Object.entries(altsOf(D.notes[0]) || {})) if (+a <= s) v = t; return split(v).length; };
    o.push(block(m, c.noteY, c.noteLh, D.notes[0], split, { size: c.note, weight: 600 }));
    const second = n => block(m, c.noteY + n * c.noteLh + 6, c.noteLh, D.notes[1], split, { size: c.note - 0.5, weight: 600, fill: INK2 });
    for (let s = 0; s <= 6;) { let e = s; while (e < 6 && lines(e + 1) === lines(s)) e++; o.push(s === 0 && e === 6 ? second(lines(0)) : s === 0 ? until(e, second(lines(s))) : e === 6 ? from(s, second(lines(s))) : L.between(s, e, second(lines(s)))); s = e + 1; } }
  o.push(tooth(W, H, seed + 9, 0.7));
  return o.join('\n');
}

export function depth(){
  L.usePalette('gold'); L.begin();
  const wide = draw({ wide: true, W: 760, H: 520, m: 28, k: 1, Ys: 140, soil: 7, bed: 20, PX0: 28, PX1: 684, sw: 7,
    title: 25, titleY: 49, ruleY: 64, label: 14.5, small: 13.5, markSize: 13.5, note: 15, noteY: 446, noteLh: 20, noteMax: 84, hand: 16.5,
    dockEnd: 156, beds: 9, stones: 16, rays: [[240, 22], [312, 14], [420, 28], [520, 16], [600, 24]],
    dockAt: [130, 124], depthTag: 0.5, tagW: 52, tagSize: 15,
    treeX: 372, crownW: 24, bare: 0.36, fseed: 21,
    loupe: { R: 42, M: 10, at: [478, 210] }, spare: [530, 214],
    firAt: [396, 338], firMax: 34, firLead: true, bottomAt: [670, 'end'], scaleX: 744,
    surf: [650, 136, 'end'], vee: 663, knees: [670, 115], kneesMax: 60 }, 9800);
  // On a phone the scale is a little larger, and the name of the surface stands above the ring round the treetop
  // instead of beside it.
  const tall = draw({ wide: false, W: 360, H: 640, m: 18, k: 1.15, Ys: 161, soil: 6, bed: 22, PX0: 18, PX1: 290, sw: 6,
    title: 22, titleY: 42, titleLh: 25, ruleY: 82, label: 13.5, small: 13.5, markSize: 13.5, note: 15, noteY: 510, noteLh: 20, noteMax: 42, hand: 15,
    dockEnd: 86, beds: 7, stones: 10, rays: [[150, 16], [210, 12], [262, 16]],
    dockAt: [24, 138, 'start'], depthTag: 0.62, tagW: 50, tagSize: 14.5,
    treeX: 254, crownW: 21, bare: 0.36, fseed: 21,
    loupe: { R: 30, M: 10, at: [196, 222] }, spare: [196, 270, 'middle'],
    firAt: [148, 394], firMax: 17, firLead: false, bottomAt: [24, 'start'], scaleX: 346,
    surf: [266, 145, 'end'], vee: 274, knees: [281, 103], kneesMax: 24 }, 9850);
  return twoLayouts(wide, tall, [760, 520], [360, 640]);
}
