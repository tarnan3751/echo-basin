// A trail sign in mist: the picture on the page shown for an address that does not exist (story bible, section 12,
// "New painted scenes"). One routed sign, the same make as the one at the Cathedral Stand trailhead, stands where a
// trail gives out, with ferns at its feet and the forest behind it going pale into the mist. The mist is the picture:
// what is near is at full strength, and each rank of trees behind is paler and bluer, the furthest barely there.
//
// By stage. 0 to 2: a friendly dead end. 3: the hung board's words change, the mist comes a little closer and the
// furthest trees are gone. 4 and 5: closer still, until at 5 only the sign and the nearest ground are clear. 6: the
// main board's words change, the hung board is gone and its two hooks hang empty, and the trail in front of the sign
// carries the far edge of one large round print, coming toward us, cut off by the bottom of the picture. It is never
// drawn: nothing stands in the mist at any stage.
//
// The words on the two boards are the page's own (src/content/not-found.mjs, notFound.sign), carried with their
// stage alternates as the track card carries its text, and set in the trailhead sign's lettering. The boards are
// sized from the longest wording at any stage, so a change of wording there cannot run off a board.
//
// The ground is placed with one simple camera, as at the trailhead: the viewer's eye is one eye-height above the
// ground, the horizon is EYE_Y, and a thing on the ground Z eye-heights away stands at EYE_Y + FOCAL / Z.
import * as L from './lib.mjs';
import { trunk, trunkD } from './scene-forest.mjs';
import { conifer } from './conifers.mjs';
import { hummock } from './groundcover.mjs';
import { notFound } from './content/not-found.mjs';
const { f, lerp, mix, poly, grain, GL, GR, from, until, linGrad, radGrad, clip } = L;

const W = 900, H = 480, EYE_Y = 160, FOCAL = 510, VPX = 450;
const proj = (X, Z, h = 0) => [VPX + X * FOCAL / Z, EYE_Y + (1 - h) * FOCAL / Z];      // ground position and height -> the picture
const baseAt = Z => EYE_Y + FOCAL / Z, pxAt = Z => FOCAL / Z;                            // where a thing Z away stands, and how big an eye-height is there
const SIGN_Z = 2.2, SIGN = [VPX, Math.round(baseAt(SIGN_Z))];                            // the sign stands on the trail's end, square to us

// ---------- the forest kit, from this picture's own random source ----------
// The boughs, ferns and grass of the forest pictures (bough and fern in scene-forest.mjs, the young tree in
// scene-trailhead.mjs, the tuft in groundcover.mjs) take their variation from the shared random sequence. This
// picture takes nothing from it, so the same shapes are made here the same way, from a source handed in.
function bough(r, x, y, len, dir, { sag = 0.26, hang = 0.22, lift = 0.07, n = 0, th = 0, bare = 0.1 } = {}){
  n = n || Math.max(5, Math.round(len / 24)); th = th || Math.max(2, len * 0.03);
  const sp = t => [x + dir * len * t, y + len * (sag * Math.pow(t, 1.5) - lift * Math.pow(t, 5))];
  const dep = t => { const u = Math.max(0, (t - bare) / (1 - bare)); return len * hang * Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(u, 0.72))), 0.8); };
  const thick = t => th * Math.pow(1 - t, 0.7), m = Math.max(5, Math.round(len / 9)), step = len / m;
  let d = `M${f(x)},${f(y - th)}`, px = x, py = y - th;
  for (let i = 1; i <= m; i++) {
    const t1 = i / m, [bx, by] = sp(t1), ey = i === m ? by : by - thick(t1), h = (len * 0.012 + dep(t1 - 0.5 / m) * 0.2) * r(0.45, 1.1), tipx = bx + dir * step * r(0.15, 0.5), tipy = ey - h;
    d += ` Q${f(lerp(px, tipx, 0.5))},${f(lerp(py, tipy, 0.62))} ${f(tipx)},${f(tipy)} L${f(bx)},${f(ey)}`; px = bx; py = ey;
  }
  const notch = t => { const [qx, qy] = sp(t); return [qx, qy + thick(t) + dep(t) * 0.26]; };
  for (let i = n - 1; i >= 0; i--) {
    const t0 = i / n, t1 = (i + 1) / n, dd = dep(lerp(t0, t1, 0.5)) * r(0.55, 1.25) + len * 0.03, [sx, sy] = sp(lerp(t0, t1, 0.8)), tx = sx + dir * dd * 0.14, ty = sy + thick(t0) + dd, [nx, ny] = notch(t0);
    const s1x = lerp(tx, nx, 0.46), s1y = ty - dd * r(0.4, 0.56), d2 = dd * r(0.22, 0.4), t2x = lerp(tx, nx, 0.5), t2y = Math.max(s1y + d2, ny + 2);
    d += ` Q${f(lerp(px, tx, 0.15))},${f(lerp(py, ty, 0.72))} ${f(tx)},${f(ty)} Q${f(lerp(tx, s1x, 0.55))},${f(ty - dd * 0.1)} ${f(s1x)},${f(s1y)} Q${f(lerp(s1x, t2x, 0.2))},${f(lerp(s1y, t2y, 0.7))} ${f(t2x)},${f(t2y)} Q${f(lerp(t2x, nx, 0.5))},${f(t2y - d2 * 0.25)} ${f(nx)},${f(ny)}`;
    px = nx; py = ny;
  }
  return d + 'Z';
}
function frond(r, x, y, len, a, { droop = 1, wide = 0.2, step = 3.6 } = {}){
  const dir = a >= 0 ? 1 : -1, N = 22, seg = len / N, R = [];
  let px = x, py = y, ang = a;
  for (let i = 0; i <= N; i++) { R.push([px, py, ang]); const t = i / N; ang += dir * droop * 0.055 * (0.3 + 2.3 * t * t); px += Math.sin(ang) * seg; py -= Math.cos(ang) * seg; }
  const at = t => { const u = Math.max(0, Math.min(N - 0.001, t * N)), i = Math.floor(u), k = u - i, A = R[i], B = R[i + 1]; return [lerp(A[0], B[0], k), lerp(A[1], B[1], k), lerp(A[2], B[2], k)]; };
  const n = Math.max(6, Math.round(len / step));
  const side = sgn => { const pts = [];
    for (let i = 0; i < n; i++) {
      const t = 0.07 + 0.9 * i / n, [qx, qy, qa] = at(t), l = len * wide * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.6)), 0.85) * r(0.85, 1.12) + 0.6, tx = Math.sin(qa), ty = -Math.cos(qa);
      pts.push([qx - ty * sgn * l + tx * l * 0.3, qy + tx * sgn * l + ty * l * 0.3]);
      const [rx, ry, ra] = at(t + 0.5 / n), l2 = l * 0.16; pts.push([rx + Math.cos(ra) * sgn * l2, ry + Math.sin(ra) * sgn * l2]);
    }
    return pts; };
  const [ex, ey] = at(1);
  return { d: poly([[x, y], ...side(-1), [ex, ey], ...side(1).reverse()]), rib: 'M' + R.filter((_, i) => i % 2 === 0).map(p => `${f(p[0])},${f(p[1])}`).join(' L') };
}
// A fern: a fan of fronds from one crown, the outer ones longer and lower, some behind in the shade tone. The fronds
// of one tone go in one path, and their ribs in another.
function fern(r, x, y, s, tone, shade, { n = 0, spread = 1.2, lean = 0, wide = 0.2, droop = 1, step = 3.6 } = {}){
  n = n || 5 + Math.floor(r(0, 4));
  const fr = [];
  for (let k = 0; k < n; k++) { const u = n === 1 ? 0 : (k / (n - 1)) * 2 - 1; fr.push({ a: u * spread + lean + r(-0.14, 0.14), len: s * (0.6 + 0.45 * Math.pow(Math.abs(u), 0.8)) * r(0.82, 1.15), droop: droop * (1 - 0.4 * Math.abs(u)) * r(0.7, 1.25), back: r() < 0.45 }); }
  const sw = f(Math.max(0.5, s * 0.016)), draw = (list, fill, rib) => { let d = '', ribs = ''; for (const q of list) { const g = frond(r, x + r(-1.5, 1.5), y, q.len, q.a, { droop: q.droop, wide: wide * r(0.85, 1.15), step }); d += g.d + ' '; ribs += g.rib + ' '; } return list.length ? `<path d="${d}" fill="${fill}"/><path d="${ribs}" fill="none" stroke="${rib}" stroke-width="${sw}" stroke-linecap="round" opacity="0.8"/>` : ''; };
  return draw(fr.filter(q => q.back), shade, tone) + draw(fr.filter(q => !q.back), tone, shade);
}
// a clump of grass: blades fanning from one root, a few of them catching the light
function tuft(r, x, y, s, dark, light){
  let a = '', b = '';
  for (let k = 0, n = 4 + Math.floor(r(0, 5)); k < n; k++) {
    const bx = x + r(-0.16, 0.16) * s, hh = s * r(0.42, 1), lean = r(-0.5, 0.5) * hh, bw = Math.max(0.8, s * r(0.03, 0.055));
    const d = `M${f(bx - bw)},${f(y)}Q${f(bx + lean * 0.15 - bw * 0.6)},${f(y - hh * 0.6)} ${f(bx + lean)},${f(y - hh)}Q${f(bx + lean * 0.3 + bw)},${f(y - hh * 0.5)} ${f(bx + bw)},${f(y)}Z`;
    if (r() < 0.3) b += d; else a += d;
  }
  return { a, b };
}
// A young tree of the same kind as the giants: a thin stem with tiers of drooping boughs, longest at the bottom, and a
// leader that nods at the top. Its boughs are one stored shape drawn three times: a deeper rank under, a lit edge, the body.
const SOFT = 'stroke-width="1.4" stroke-linejoin="round"';
function youngTree(r, x, baseY, h, { tone, rim, behind, stem }){
  const n = Math.max(5, Math.round(h / 27)), tw = Math.max(1.6, h * 0.02), top = baseY - h;
  let d = '';
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), y = baseY - h * (0.14 + 0.8 * t), len = h * 0.27 * (1 - 0.84 * t) + 4;
    for (const dir of [-1, 1]) { const l2 = len * r(0.78, 1.16); d += bough(r, x + dir * tw * (1 - t) * 0.6, y + r(-0.02, 0.02) * h, l2, dir, { sag: 0.44, hang: 0.36, lift: 0.03, n: Math.max(3, Math.round(l2 / 19)), bare: 0.03 }) + ' '; }
  }
  d += `M${f(x - 1.4)},${f(top + h * 0.07)} Q${f(x - 0.6)},${f(top + h * 0.02)} ${f(x + h * 0.03)},${f(top)} Q${f(x + 2.4)},${f(top + h * 0.03)} ${f(x + 1.6)},${f(top + h * 0.07)}Z`;
  const id = L.shared(d);
  return `<path d="M${f(x - tw)},${f(baseY + 2)} L${f(x + tw)},${f(baseY + 2)} L${f(x + 0.7)},${f(top + h * 0.05)} L${f(x - 0.7)},${f(top + h * 0.05)}Z" fill="${stem}"/>`
    + (behind ? `<use href="#${id}" fill="${behind}" transform="translate(2.4,${f(Math.max(3, h * 0.022))})"/>` : '') + (rim ? `<use href="#${id}" fill="${rim}" transform="translate(-0.6,-0.8)"/>` : '') + `<use href="#${id}" fill="${tone}" stroke="${tone}" ${SOFT} transform="translate(1,2)"/>`;
}
// One bough as the trailhead draws its near ones: a deeper rank of sprays showing beneath in a quieter tone, a thin lit
// edge, then the body.
function spray(r, x, y, len, dir, opt, tone, rim, behind){
  const b = bough(r, x + dir * len * 0.05, y + len * 0.02, len * 0.9, dir, { ...opt, hang: (opt.hang || 0.22) * 1.3, bare: 0.16 }), id = L.shared(bough(r, x, y, len, dir, opt));
  return `<path d="${b}" fill="${behind}"/><use href="#${id}" fill="${rim}" transform="translate(-0.6,-0.8)"/><use href="#${id}" fill="${tone}" stroke="${tone}" ${SOFT} transform="translate(0.8,1.8)"/>`;
}
// A dead limb: old conifers keep the broken stubs of their lower branches.
const stub = (x, y, len, dir, w0, tone, hi) => `<path d="M${f(x)},${f(y - w0)} L${f(x + dir * len)},${f(y - len * 0.3 - 0.7)} L${f(x + dir * (len - 1.6))},${f(y - len * 0.3 + 1.5)} L${f(x)},${f(y + w0)}Z" fill="${tone}"/><path d="M${f(x)},${f(y - w0)} L${f(x + dir * len)},${f(y - len * 0.3 - 0.7)}" stroke="${hi}" stroke-width="1" fill="none"/>`;

// ---------- the lettering ----------
// How wide each character from space to tilde is set, in hundredths of the type size, measured in the site's own
// fonts as the sign uses them: Fraunces at weight 700 (the main board) and Source Sans 3 at 600 (the hung board).
const ADV = {
  serif: '19,32,41,66,61,86,96,20,36,36,60,56,29,38,29,48,68,47,62,57,64,59,63,55,63,63,29,30,51,56,51,56,95,75,72,69,80,66,62,76,85,41,54,80,64,95,78,78,71,78,77,61,70,76,75,109,74,70,64,36,48,36,49,50,25,55,60,51,61,52,41,56,63,31,31,61,31,93,63,58,61,59,48,49,40,61,55,84,57,56,50,40,30,40,63',
  sans: '19,32,48,51,51,84,64,28,32,32,44,51,28,32,28,34,51,51,51,51,51,51,51,51,51,51,28,28,51,51,51,44,88,56,60,58,63,54,51,63,66,28,49,60,50,75,66,67,58,67,59,54,55,66,54,80,54,50,54,32,34,32,51,50,55,52,56,46,56,51,32,52,56,26,26,52,27,84,56,55,56,56,37,43,36,56,50,75,48,49,44,32,25,32,51',
};
for (const k in ADV) ADV[k] = ADV[k].split(',').map(Number);
const setWidth = (s, size, face, ls = 0) => [...s].reduce((a, c) => a + (ADV[face][c.charCodeAt(0) - 32] ?? 100) * size / 100 + ls, 0);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
// One board's words, as the content module gives them: [stage 0, { stage: words }]. A stage with no entry keeps the
// words before it, and empty words mean the board is not there from that stage on.
function staged(v){
  const [base, alt = {}] = Array.isArray(v) ? v : [v, {}], alts = {}, all = [base];
  let gone = 7;
  for (const [k, s] of Object.entries(alt)) if (s === '') gone = Math.min(gone, +k); else { alts[k] = s; all.push(s); }
  return { base, alts: Object.fromEntries(Object.entries(alts).filter(([k]) => +k < gone)), gone, all };
}
const words = (x, y, w, attrs) => `<text class="t" x="${x}" y="${y}" text-anchor="middle" ${attrs}${Object.entries(w.alts).map(([k, v]) => ` data-s${k}="${esc(v)}"`).join('')}>${esc(w.base)}</text>`;

// ---------- the sign ----------
// The trailhead sign rebuilt to the same design: a routed board bolted across two bevelled posts, the park's roundel
// on its top edge, and a smaller board beneath it, here hung on two S-hooks from eyes screwed into the board's
// underside. Both boards are as wide as their longest wording needs. Origin: the ground midway between the posts.
const BOARD_SIZE = 25, HUNG_SIZE = 15.6, HUNG_LS = 0.5;
function trailSign(P){
  const main = staged(notFound.sign.board), hung = staged(notFound.sign.hung);
  const BW = Math.max(112, Math.ceil(Math.max(...main.all.map(s => setWidth(s, BOARD_SIZE, 'serif'))) / 2 + 21)), PX = BW - 14;
  const HW = Math.max(60, Math.ceil(Math.max(...hung.all.map(s => setWidth(s, HUNG_SIZE, 'sans', HUNG_LS))) / 2 + 17)), HX = HW - 22;
  const wood = mix(P.plum, P.coralSh, 0.22), woodSh = P.plumDeep, face = P.plum, faceHi = mix(P.plum, P.peach, 0.4), metal = mix(P.haze, P.cream, 0.5), s = [];
  // soft shade where the posts and their stones meet the ground; no cast shadow, since the light is all mist
  s.push(`<g fill="${P.plumDeep}" opacity="0.32"><ellipse cx="${-PX + 2}" cy="7" rx="34" ry="6"/><ellipse cx="${PX + 2}" cy="7" rx="34" ry="6"/></g>`);
  for (const x of [-PX, PX]) s.push(`<path d="M${x - 8},5 V-178 L${x},-186 L${x + 8},-178 V5Z" fill="${woodSh}"/><path d="M${x - 8},5 V-178 L${x},-186 L${x + 4.4},-181.6 V5Z" fill="${wood}"/><path d="M${x - 8},5 V-178 L${x - 5.2},-180.8 V5Z" fill="${P.rim}" opacity="0.85"/><path d="M${x - 2},-150 v60 M${x + 1.4},-50 v46" stroke="${woodSh}" stroke-width="0.9" opacity="0.5"/>`);
  // the board: its thickness showing below and to the right, then the face, its grain, a chamfer of light along the top
  const bd = `M${-BW + 5},-171 H${BW - 5} Q${BW},-171 ${BW},-166 V-110 Q${BW},-105 ${BW - 5},-105 H${-BW + 5} Q${-BW},-105 ${-BW},-110 V-166 Q${-BW},-171 ${-BW + 5},-171Z`, bc = clip(bd), k = BW / 112;
  const grainD = [[-158, 50, -3, 110, 0, 114, -1], [-146, 60, 3, 120, 0, 104, 1], [-131, 40, -2, 96, 1, 128, -2], [-119, 70, 2, 130, 0, 94, 1]].map(([y, a, b, c, d, e, g]) => `M${-BW},${y} q${f(a * k)},${b} ${f(c * k)},${d} t${f(e * k)},${g}`).join(' ');
  s.push(`<path d="${bd}" fill="${woodSh}" transform="translate(3.4,5)"/><path d="${bd}" fill="${face}"/>`);
  s.push(`<g clip-path="url(#${bc})"><path d="${grainD}" stroke="${mix(face, P.haze, 0.4)}" stroke-width="0.9" fill="none" opacity="0.5"/><path d="M${-BW},-170 H${BW}" stroke="${faceHi}" stroke-width="2.2"/><path d="M${-BW + 1},-171 V-105" stroke="${P.rim}" stroke-width="2.4" opacity="0.8"/></g>`);
  s.push(`<rect x="${-BW + 7.5}" y="-163.5" width="${2 * BW - 15}" height="51" rx="3" fill="none" stroke="${P.cream}" stroke-width="1.5" opacity="0.55"/>`);
  for (const [x, y] of [[-PX, -160], [-PX, -116], [PX, -160], [PX, -116]]) s.push(`<circle cx="${x}" cy="${y}" r="3" fill="${woodSh}"/><circle cx="${x}" cy="${y}" r="2.1" fill="${metal}"/><circle cx="${x - 0.6}" cy="${y - 0.6}" r="0.8" fill="#FFFFFF" opacity="0.7"/>`);
  // the roundel
  s.push(`<circle cx="1.6" cy="-169" r="18" fill="${woodSh}"/><circle cx="0" cy="-171" r="18" fill="${P.cream}"/><circle cx="0" cy="-171" r="15.4" fill="${P.teal}"/><path d="M-11.4,-164.6 L-4.4,-177.4 L-0.6,-170.6 L3.4,-175.4 L11.4,-164.6Z" fill="${P.cream}"/><path d="M-12,-162 H12" stroke="${P.cream}" stroke-width="1.5"/><circle cx="6.6" cy="-179.4" r="2.4" fill="#F2B441"/>`);
  s.push(words(0, -124, main, `font-family="Fraunces, serif" font-size="${BOARD_SIZE}" font-weight="700" fill="${P.cream}" style="font-variation-settings:'SOFT' 100,'opsz' 60"`));
  // Two eyes screwed into the board's underside, an S-hook hanging from each. The hung board's own eyes ride in the
  // hooks' lower curls; when the board is gone the hooks still hang there, empty.
  const hook = x => `<circle cx="${x}" cy="-98.6" r="2.3" fill="none" stroke="${woodSh}" stroke-width="2.4"/><circle cx="${x}" cy="-98.6" r="2.3" fill="none" stroke="${metal}" stroke-width="1.2"/><path d="M${f(x - 0.6)},-96.4 C${f(x - 3.6)},-93 ${f(x - 3.4)},-89.6 ${x},-88.6 C${f(x + 3)},-87.8 ${f(x + 3.6)},-91 ${f(x + 1.4)},-92.4" fill="none" stroke="${woodSh}" stroke-width="2.4" stroke-linecap="round"/><path d="M${f(x - 0.6)},-96.4 C${f(x - 3.6)},-93 ${f(x - 3.4)},-89.6 ${x},-88.6 C${f(x + 3)},-87.8 ${f(x + 3.6)},-91 ${f(x + 1.4)},-92.4" fill="none" stroke="${metal}" stroke-width="1.2" stroke-linecap="round"/>`;
  const HT = -86.4, HB = -55.4, rd = `M${-HW + 4},${HT} H${HW - 4} Q${HW},${HT} ${HW},${HT + 4} V${HB - 4} Q${HW},${HB} ${HW - 4},${HB} H${-HW + 4} Q${-HW},${HB} ${-HW},${HB - 4} V${HT + 4} Q${-HW},${HT} ${-HW + 4},${HT}Z`;
  const eye = x => `<circle cx="${x}" cy="${HT - 2}" r="2" fill="none" stroke="${metal}" stroke-width="1.2"/>`;
  const board = `<path d="${rd}" fill="${woodSh}" transform="translate(2.6,3.6)"/><path d="${rd}" fill="${wood}"/><path d="M${-HW + 1},${HT + 1} H${HW - 1}" stroke="${mix(wood, P.peach, 0.4)}" stroke-width="1.6"/><path d="M${-HW + 0.6},${HT + 1} V${HB - 1}" stroke="${P.rim}" stroke-width="1.8" opacity="0.7"/>`
    + eye(-HX) + eye(HX) + words(0, f(HB - 11), hung, `font-family="'Source Sans 3', sans-serif" font-size="${HUNG_SIZE}" font-weight="600" fill="${P.window}" letter-spacing="${HUNG_LS}"`);
  s.push(hook(-HX) + hook(HX) + (hung.gone <= 6 ? until(hung.gone - 1, board) : board));
  // stones packed round the foot of each post
  const stone = mix(P.haze, P.plum, 0.3), stoneTop = mix(P.haze, P.cream, 0.45);
  s.push(L.rock(-PX - 14, 8, 22, 12, stone, stoneTop) + L.rock(-PX + 12, 9, 18, 9, stone, stoneTop) + L.rock(PX - 12, 8, 20, 11, stone, stoneTop) + L.rock(PX + 14, 9, 17, 9, stone, stoneTop));
  return { svg: s.join(''), half: BW + 8 };
}

// ---------- the picture ----------
export function sign(){
  L.usePalette('gold'); L.begin(); L.setSun({ x: -260, y: 250, r: 0 });
  const P = L.P, N = L.PAL.night, o = [];
  // The mist takes its colour from the night palette's pale sky, a little toward its blue snow, so that whatever
  // stands back in it goes paler and bluer the further off it is. Low down, where we look through the most of it, it
  // is lit, and warms toward the gold palette's cream.
  const MIST = mix(N.sun, N.snow, 0.18), GLOW = mix(P.cream, N.sun, 0.45), fog = (c, k) => mix(c, MIST, k);
  // how far toward the mist a thing Z eye-heights away has gone: a third at the nearest trees, nearly all of it at the furthest
  const fogK = Z => Math.max(0, Math.min(0.9, 0.3 + Math.log(Z / 3.8) / Math.log(28 / 3.8) * 0.56)), fogY = y => fogK(FOCAL / Math.max(1, y - EYE_Y));
  const trunkTone = mix(P.haze, P.plum, 0.38), trunkSh = mix(P.plum, P.plumDeep, 0.5), boughTone = mix(mix(P.tealDeep, P.teal, 0.55), P.haze, 0.2);
  const floorTone = mix(mix(P.tealLight, P.teal, 0.4), P.window, 0.1), moss = mix(P.tealLight, P.window, 0.16), litter = mix(floorTone, P.plum, 0.45);
  // The mist coming closer, stage by stage: it lies over everything above y1 at strength a and thins out to nothing by
  // y2, and a drift of loose streaks along that edge keeps it from reading as a line.
  const veil = (y1, y2, a) => `<rect x="-10" y="-10" width="${W + 20}" height="${f(y2 + 10)}" fill="url(#${linGrad(0, -10, 0, y2, [[0, MIST, a], [f((y1 + 10) / (y2 + 10)), MIST, a], [1, MIST, 0]])})"/>`;
  // drifting mist: loose streaks round height y, long and thin, as the clouds trail theirs
  const wisp = (x, y, len, th) => `M${f(x)},${f(y)} Q${f(x + len * 0.5)},${f(y - th)} ${f(x + len)},${f(y)} Q${f(x + len * 0.5)},${f(y + th * 0.7)} ${f(x)},${f(y)}Z`;
  const drift = (r, y, spread, n, tone, op) => { let d = ''; for (let i = 0; i < n; i++) { const len = r(110, 300); d += wisp(r(-80, W + 20 - len * 0.5), y + r(-spread, spread), len, len * r(0.03, 0.055)) + ' '; } return `<path d="${d}" fill="${tone}" opacity="${op}"/>`; };
  // The forest floor between two distances: litter and moss lying flat, grass and small ferns, each sized for its
  // distance and gone as pale as the trees standing there. keep(x, y) says where things may go.
  const floorBits = (r, z0, z1, n, keep = () => true) => {
    const k = fogK(Math.sqrt(z0 * z1)), gd = fog(mix(floorTone, P.tealDeep, 0.35), k), gl = fog(mix(P.tealLight, P.cream, 0.3), k), ft = fog(mix(P.tealLight, P.window, 0.12), k), fs = fog(P.teal, k);
    let mo = '', li = '', ga = '', gb = ''; const up = [];
    for (let i = 0; i < n; i++) {
      const Z = Math.exp(lerp(Math.log(z0), Math.log(z1), r())), y = baseAt(Z), s = pxAt(Z), x = r(-20, W + 20), kind = r();
      if (!keep(x, y)) continue;
      if (kind < 0.4) { const rx = s * r(0.08, 0.28), e = `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(Math.max(0.7, rx * 0.1))}"/>`; if (kind < 0.24) mo += e; else li += e; }
      else if (kind < 0.9 || z0 > 12) { const t = tuft(r, x, y, s * r(0.1, 0.17), gd, gl); ga += t.a; gb += t.b; }
      else up.push([y, fern(r, x, y, s * r(0.2, 0.3), ft, fs, { lean: r(-0.2, 0.2), spread: r(1, 1.3), step: Math.max(3, s * 0.05), n: 4 })]);
    }
    up.sort((a, b) => a[0] - b[0]);
    return `<g fill="${fog(moss, k)}" opacity="0.5">${mo}</g><g fill="${fog(litter, k)}" opacity="0.32">${li}</g><path d="${ga}" fill="${gd}"/><path d="${gb}" fill="${gl}"/>` + up.map(u => u[1]).join('');
  };

  // ---- the air: darker up under the canopy, brightest low down, and stippled
  o.push(`<rect x="-10" y="-10" width="${W + 20}" height="${H + 20}" fill="url(#${linGrad(0, 0, 0, 290, [[0, fog(P.haze, 0.58)], [0.45, MIST], [1, GLOW]])})"/>`);
  o.push(`<ellipse cx="470" cy="200" rx="520" ry="220" fill="url(#${radGrad(470, 200, 520, [[0, P.sun, 0.6], [0.45, GLOW, 0.3], [1, GLOW, 0]])})"/>`);
  o.push(grain(0, 0, W, 330, GR(470, 190, 560, [[0, 0.05], [0.55, 0.14], [1, 0.3]]), N.sun));
  // the forest floor, going into the mist with distance
  { const ys = [EYE_Y + 10, 180, 192, 206, 228, 260, 294, 340, 392, 440, H]; o.push(`<rect x="-10" y="${EYE_Y + 10}" width="${W + 20}" height="${H - EYE_Y}" fill="url(#${linGrad(0, ys[0], 0, H, ys.map((y, i) => [f((y - ys[0]) / (H - ys[0])), i ? fog(floorTone, fogY(y)) : MIST]))})"/>`); }

  // ---- the furthest rank: thin trunks and small firs, barely there. Gone from stage 3. (Plain firs only: a small pale
  // hemlock with its nodding leader, half hidden, can read as something standing in the mist.)
  { const Z = 28, k = fogK(Z) - 0.08, r = L.source(2701), by = baseAt(Z), px = pxAt(Z), tone = fog(trunkTone, k), C = { tone: fog(boughTone, k), lit: fog(boughTone, k - 0.04), mid: fog(boughTone, k), deep: fog(boughTone, k - 0.05), trunk: fog(trunkSh, k) };
    let s = '';
    for (const [x, w] of [[44, 1], [190, 0.9], [398, 1.1], [612, 0.9], [784, 1.05]]) s += trunk(x, w * px, by + r(-2, 2), tone, fog(trunkTone, k + 0.04), { rimW: 1, shape: { fl: 0.7, fh: w * px * 1.6 } });
    for (const [x, h] of [[100, 4.6], [258, 3.8], [334, 5], [518, 3.6], [600, 5.2], [742, 4.2], [858, 4.8]]) s += conifer(x, by + r(-1.5, 1.5), h * px, C, { kind: 'fir', seed: Math.round(x) });
    o.push(until(2, s)); }
  { const r = L.source(2711); o.push(floorBits(r, 15, 26, 12) + drift(r, 172, 8, 6, GLOW, 0.45)); }

  // ---- the next rank: trunks with a few boughs in one tone, and young trees
  { const Z = 15, k = fogK(Z), r = L.source(2702), by = baseAt(Z), px = pxAt(Z), tone = fog(trunkTone, k), bt = fog(boughTone, k);
    let s = '', fb = '';
    for (const [x, w, n] of [[64, 1.1, 2], [318, 1, 1], [560, 1.15, 2], [862, 1.05, 1]]) {
      const ww = w * px; s += trunk(x, ww, by + r(-2, 2), tone, fog(mix(trunkTone, P.peach, 0.5), k), { rimW: 1.4, shape: { fl: 0.75, fh: ww * 1.5 } });
      for (let j = 0; j < n; j++) { const dir = (j + Math.round(x)) % 2 ? 1 : -1; fb += bough(r, x + dir * ww * 0.45, r(30, 110) + j * 40, r(40, 62), dir, { sag: 0.34, hang: 0.3, n: 3 }) + ' '; }
    }
    s += `<path d="${fb}" fill="${bt}"/>`;
    for (const [x, h] of [[176, 4.2], [452, 3.6], [700, 4.6]]) s += youngTree(r, x, by + r(-1, 1), h * px, { tone: bt, stem: fog(trunkSh, k) });
    o.push(s); }
  { const r = L.source(2712); o.push(drift(r, 150, 40, 5, GLOW, 0.32) + floorBits(r, 7.6, 15, 22) + drift(r, 186, 10, 7, GLOW, 0.4)); }
  o.push(from(3, veil(196, 262, 0.5) + drift(L.source(2721), 200, 24, 7, MIST, 0.45)));

  // ---- the middle rank: two trunks with their boughs, and a young tree, half lost
  { const Z = 7.5, k = fogK(Z), r = L.source(2703), by = baseAt(Z), px = pxAt(Z), tone = fog(trunkTone, k), rim = fog(mix(trunkTone, P.peach, 0.6), k), sh = fog(trunkSh, k);
    const bt = fog(boughTone, k), br = fog(mix(boughTone, P.peach, 0.3), k), bb = fog(mix(boughTone, P.tealDeep, 0.45), k);
    let s = '';
    for (const [x, w] of [[250, 1.1], [668, 1.05]]) { const ww = w * px; s += trunk(x, ww, by + r(-2, 2), tone, rim, { rimW: 2, shape: { fl: 0.8, fh: ww * 1.1 } }) + stub(x + ww * 0.46, r(60, 120), ww * 0.3, 1, 2, sh, tone); }
    s += [[250 + 0.55 * px, 52, 86, 1], [250 - 0.55 * px, 104, 66, -1], [668 - 0.53 * px, 70, 80, -1], [668 + 0.53 * px, 30, 70, 1]].map(([x, y, len, dir]) => spray(r, x, y, len, dir, { sag: 0.36, hang: 0.3 }, bt, br, bb)).join('');
    s += youngTree(r, 560, by + 1, 3.3 * px, { tone: bt, rim: br, behind: bb, stem: sh });
    o.push(s); }
  { const r = L.source(2713); o.push(drift(r, 120, 50, 5, GLOW, 0.3) + floorBits(r, 3.9, 7.4, 26) + drift(r, 206, 14, 6, GLOW, 0.32)); }
  o.push(from(4, veil(232, 316, 0.55) + drift(L.source(2722), 236, 34, 8, MIST, 0.4)));

  // ---- the nearest rank behind the sign: two big trunks at the edges, a young hemlock at the sign's left
  { const Z = 3.8, k = fogK(Z), r = L.source(2704), by = baseAt(Z), px = pxAt(Z), tone = fog(trunkTone, k), rim = fog(mix(trunkTone, P.peach, 0.6), k), sh = fog(trunkSh, k);
    const bt = fog(boughTone, k), br = fog(mix(boughTone, P.peach, 0.3), k), bb = fog(mix(boughTone, P.tealDeep, 0.45), k);
    let s = '';
    for (const [x, w] of [[92, 1.2], [818, 1.15]]) {
      const ww = w * px, shape = { fl: 0.8, fh: ww * 0.8 }, cid = clip(trunkD(x, ww, by, shape));
      let furrows = ''; for (let j = 0; j < 7; j++) { const fx = x + r(-0.44, 0.46) * ww, fy = r(-30, by - 100), fh = r(50, 180); furrows += `M${f(fx)},${f(fy)} q${f(r(-3, 3))},${f(fh / 2)} ${f(r(-2, 2))},${f(fh)} `; }
      s += stub(x - ww * 0.5, r(90, 150), ww * 0.22, -1, 2.6, tone, rim) + stub(x + ww * 0.5, r(60, 140), ww * 0.2, 1, 2.4, sh, tone);
      s += trunk(x, ww, by, tone, rim, { rimW: 2.6, shape }) + `<g clip-path="url(#${cid})" transform="translate(2.6,0)"><path d="${furrows}" stroke="${sh}" stroke-width="2.2" stroke-linecap="round" fill="none" stroke-opacity="0.7"/>${grain(x, -40, ww * 0.6, by + 50, GL(x + ww * 0.55, 0, x + ww * 0.02, 0, [[0, 0.6], [0.5, 0.25], [1, 0]]), sh)}</g>`;
    }
    s += [[92 + 0.62 * px, 60, 150, 1], [818 - 0.6 * px, 40, 160, -1]].map(([x, y, len, dir]) => spray(r, x, y, len, dir, { sag: 0.34, hang: 0.28 }, bt, br, bb)).join('');
    s += youngTree(r, 334, baseAt(4.4), 1.9 * pxAt(4.4), { tone: bt, rim: br, behind: bb, stem: sh });
    o.push(s); }
  { const r = L.source(2714); o.push(drift(r, 210, 60, 4, GLOW, 0.26) + floorBits(r, 2.3, 3.8, 34, (x, y) => Math.abs(x - VPX) > 40 || y < 340) + drift(r, 252, 20, 5, GLOW, 0.22)); }
  o.push(from(5, veil(300, 392, 0.76) + drift(L.source(2723), 262, 36, 9, MIST, 0.4)));

  // ---- the near ground: the trail coming up to the sign and giving out there. Bare wet earth, worn paler down the
  // middle, with water standing in it that holds the pale of the mist.
  const r = L.source(2705), SX = SIGN[0], SY = SIGN[1];
  const earth = mix(P.plum, P.peach, 0.3), earthWet = mix(earth, P.plumDeep, 0.35), earthLit = mix(earth, P.cream, 0.22);
  const Xc = 0.04, Zc = 1.37, PA = 0.56, PB = 0.47;                         // the print: its middle, and its half-length and half-width, on the ground
  const inPrint = (x, y, m = 1.3) => { const Z = FOCAL / (y - EYE_Y), X = (x - VPX) * Z / FOCAL; return ((X - Xc) / (PB * m)) ** 2 + ((Z - Zc) / (PA * m)) ** 2 < 1; };
  { const edge = (k, jit) => { const Lf = [], Rt = [], n = 16; for (let i = 0; i <= n; i++) { const Z = lerp(2.42, 1.35, i / n), end = Math.max(0, Math.min(1, (2.42 - Z) / 0.16)), half = 0.27 * k * Math.sqrt(end) * (1 + 0.08 * Math.sin(Z * 9)), cx = 0.1 * (SIGN_Z - Z); Lf.push(proj(cx - half * jit(), Z)); Rt.push(proj(cx + half * jit(), Z)); } return poly([...Lf, ...Rt.reverse()]); };
    const path = edge(1, () => r(0.93, 1.06)), worn = edge(0.62, () => r(0.8, 1.15)), pc = clip(path);
    o.push(`<path d="${path}" fill="url(#${linGrad(0, 370, 0, H, [[0, fog(earth, 0.18)], [1, earthWet]])})"/><path d="${worn}" fill="url(#${linGrad(0, 370, 0, H, [[0, fog(earthLit, 0.2)], [1, earth]])})"/>`);
    let pud = '', sheen = '', ruts = '', bits = '';
    // the water lies in long stretches along the two ruts, so it reads as a wet trail and nothing else
    const rut = (X0, Z) => X0 + 0.01 + 0.05 * (2.34 - Z) / 0.98;
    for (const X of [-0.13, 0.11]) { const a = proj(rut(X, 2.34), 2.34), b = proj(rut(X, 1.36), 1.36); ruts += `M${f(a[0])},${f(a[1])} L${f(b[0])},${f(b[1])} `; }
    for (const [X, za, zb, w] of [[-0.13, 1.96, 1.8, 0.026], [0.11, 2.2, 2.08, 0.02], [0.11, 1.7, 1.54, 0.03]]) {
      const Lf = [], Rt = []; for (let k = 0; k <= 8; k++) { const Z = lerp(za, zb, k / 8), t = Math.pow(Math.sin(Math.PI * k / 8), 0.6) * (1 + 0.12 * Math.sin(k * 1.3)), x = rut(X, Z); Lf.push(proj(x - w * t, Z)); Rt.push(proj(x + w * t, Z)); }
      const d = poly([...Lf, ...Rt.reverse()]); pud += `${d} `; sheen += `${d} `;
    }
    for (let i = 0; i < 26; i++) { const Z = lerp(2.36, 1.5, r()), [x, y] = proj(0.1 * (SIGN_Z - Z) + r(-0.24, 0.24), Z), l = pxAt(Z) * r(0.02, 0.05), a = r(-0.6, 0.6); bits += `M${f(x)},${f(y)} l${f(Math.cos(a) * l)},${f(Math.sin(a) * l * 0.4)} `; }
    o.push(`<g clip-path="url(#${pc})"><path d="${ruts}" stroke="${earthWet}" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.45"/><path d="${bits}" stroke="${mix(P.plum, P.coralSh, 0.3)}" stroke-width="1" stroke-linecap="round" fill="none" opacity="0.7"/>${grain(300, 370, 300, 120, GL(0, 380, 0, H, [[0, 0.08], [1, 0.3]]), P.plumDeep)}<path d="${pud}" fill="${earthWet}" transform="translate(0,-1.2)"/><path d="${sheen}" fill="${mix(MIST, earth, 0.3)}" opacity="0.75"/></g>`);
  }
  // the ground either side, with a stipple that thickens toward us
  o.push(grain(0, 300, W, 190, GL(0, 310, 0, H, [[0, 0], [0.4, 0.06], [1, 0.2]]), P.tealDeep));

  // ---- what grows along the trail and round the sign, drawn from the back forward
  const G = [], put = (y, s) => G.push([y, s]);
  { const onTrail = (x, y) => { const Z = FOCAL / (y - EYE_Y), X = (x - VPX) * Z / FOCAL; return Z < 2.45 && Math.abs(X - 0.1 * (SIGN_Z - Z)) < 0.3; };
    const keep = (x, y) => !onTrail(x, y) && !inPrint(x, y);
    let mo = '', li = ''; for (let i = 0; i < 20; i++) { const Z = lerp(2.3, 1.45, r()), [x, y] = proj(r(-1.6, 1.6), Z), rx = pxAt(Z) * r(0.06, 0.2); if (!keep(x, y)) continue; const e = `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(rx * 0.1)}"/>`; if (i % 2) mo += e; else li += e; }
    o.push(`<g fill="${moss}" opacity="0.5">${mo}</g><g fill="${litter}" opacity="0.3">${li}</g>`);
    const grassDark = [P.teal, mix(P.teal, P.tealDeep, 0.5), mix(P.teal, P.tealLight, 0.5)], grassLit = mix(P.tealLight, P.cream, 0.4);
    for (let i = 0; i < 46; i++) {
      const verge = i < 30, side = i % 2 ? 1 : -1, Z = lerp(2.36, 1.42, r()), half = 0.27 * (1 + 0.08 * Math.sin(Z * 9)), X = verge ? 0.1 * (SIGN_Z - Z) + side * half * r(0.95, 1.35) : r(-1.6, 1.6), [x, y] = proj(X, Z);
      if (inPrint(x, y) || (!verge && onTrail(x, y))) continue;
      const t = tuft(r, x, y + 1, pxAt(Z) * r(0.08, 0.15), grassDark[i % 3], grassLit); put(y, `<path d="${t.a}" fill="${grassDark[i % 3]}"/>` + (t.b ? `<path d="${t.b}" fill="${grassLit}"/>` : ''));
    }
    const ft = mix(P.tealLight, P.window, 0.12), fs = P.teal;
    for (const [x, y, s2, ln] of [[296, 396, 54, -0.2], [612, 398, 50, 0.2], [252, 432, 46, 0.1], [676, 440, 42, -0.1], [354, 404, 30, 0.1], [150, 404, 40, 0], [760, 410, 38, 0.1]]) put(y, fern(r, x, y, s2, ft, fs, { lean: ln, spread: r(1, 1.3), wide: r(0.18, 0.23), step: 6, n: 6 }));
    // low mossy rises either side of the trail
    for (const [x, y, w, h] of [[128, 446, 150, 8], [792, 440, 160, 9]]) put(y - 8, hummock(x, y, w, h, mix(floorTone, P.cream, 0.16), P.teal));
    const stone = mix(P.haze, P.plum, 0.3), stoneTop = mix(P.haze, P.cream, 0.45);
    for (const [x, y, w] of [[222, 456, 30], [700, 414, 22], [318, 440, 16], [528, 404, 9], [418, 424, 7]]) put(y, `<ellipse cx="${f(x + w * 0.1)}" cy="${f(y + 1)}" rx="${f(w * 0.65)}" ry="${f(w * 0.12)}" fill="${P.tealDeep}" opacity="0.4"/>` + L.rock(x, y, w, w * 0.5, stone, stoneTop)); }
  const sg = trailSign(P);
  put(SY, `<g transform="translate(${SX},${SY})">${sg.svg}</g>`);
  G.sort((a, b) => a[0] - b[0]);
  o.push(G.map(g => g[1]).join('\n'));

  // ---- stage 5: the mist has come in over the ground either side of the sign as well, leaving the ground nearest us clear
  { const bank = radGrad(0, 0, 1, [[0, MIST, 0.85], [0.55, MIST, 0.55], [1, MIST, 0]]);
    o.push(from(5, [[-20, 1], [W + 20, -1]].map(([x, d]) => `<circle r="1" fill="url(#${bank})" transform="translate(${x + d * 40},338) scale(330,92)"/>`).join(''))); }

  // ---- stage 6: the far edge of one print, pressed into the wet earth of the trail and coming toward us, as the prints
  // in the other pictures are drawn: the mud it pushed out lying round it, a raised lip catching the light, the far wall
  // bare earth going dark as it goes down, the floor in shade with water standing in it that holds the pale of the
  // mist, and clods thrown out over the verge. The bottom of the picture cuts it off.
  { const pr = L.source(2706), p1 = pr(0, 6.28), p2 = pr(0, 6.28), wob = t => 1 + 0.03 * Math.sin(3 * t + p1) + 0.016 * Math.sin(7 * t + p2);
    const ring = (k, h, j = 1) => { const pts = []; for (let i = 0; i < 60; i++) { const t = i / 60 * Math.PI * 2, q = 1 + (wob(t) - 1) * j; pts.push(proj(Xc + PB * k * q * Math.sin(t), Zc + PA * k * q * Math.cos(t), h)); } return pts; };
    const yLip = EYE_Y + FOCAL / (Zc + PA), yFloor = EYE_Y + 1.08 * FOCAL / (Zc + PA * 0.95);
    const apron = poly(ring(1.22, 0, 2.2)), rim = poly(ring(1.05, 0.016, 1.3)), lip = poly(ring(1, 0)), floor = poly(ring(0.95, -0.08, 0.8)), pool = poly(ring(0.86, -0.08, 0.5)), lc = clip(lip);
    let clods = ''; for (let i = 0; i < 11; i++) { const t = lerp(-1.25, 1.25, i / 10) + pr(-0.08, 0.08), q = pr(1.12, 1.3) * wob(t), [x, y] = proj(Xc + PB * q * Math.sin(t), Zc + PA * q * Math.cos(t)), s2 = pr(1.4, 3.2); clods += `<ellipse cx="${f(x + s2 * 0.4)}" cy="${f(y + s2 * 0.5)}" rx="${f(s2 * 1.3)}" ry="${f(s2 * 0.5)}" fill="${P.tealDeep}" opacity="0.5"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s2)}" ry="${f(s2 * 0.62)}" fill="${earthWet}"/><ellipse cx="${f(x - s2 * 0.2)}" cy="${f(y - s2 * 0.25)}" rx="${f(s2 * 0.55)}" ry="${f(s2 * 0.32)}" fill="${earthLit}"/>`; }
    o.push(from(6, `<path d="${apron}" fill="${earthWet}" opacity="0.45"/><path d="${rim}" fill="url(#${linGrad(VPX - 200, 0, VPX + 220, 0, [[0, mix(earthLit, P.cream, 0.2)], [1, earth]])})"/><path d="${lip}" fill="${mix(earth, P.plumDeep, 0.2)}" transform="translate(0,1.4)"/><path d="${lip}" fill="url(#${linGrad(0, yLip, 0, yFloor + 4, [[0, earth], [0.55, earthWet], [1, mix(earthWet, P.plumDeep, 0.5)]])})" transform="translate(0,2.6)"/>`
      + `<g clip-path="url(#${lc})"><path d="${floor}" fill="${mix(P.plumDeep, P.teal, 0.2)}"/><path d="${pool}" fill="${mix(MIST, P.plumDeep, 0.45)}" opacity="0.75"/><path d="${pool}" fill="none" stroke="${GLOW}" stroke-width="1.4" opacity="0.5"/>${grain(240, yLip - 4, 440, H - yLip + 10, GL(0, yLip, 0, H, [[0, 0.1], [0.4, 0.34], [1, 0.2]]), P.ink)}</g>${clods}`)); }

  // ---- the nearest growth, in the bottom corners, at full strength
  o.push(fern(r, 46, 492, 84, mix(P.tealDeep, P.ink, 0.3), P.ink, { lean: 0.25, spread: 1.2, step: 11, n: 6 }) + fern(r, 862, 494, 78, mix(P.tealDeep, P.ink, 0.3), P.ink, { lean: -0.25, spread: 1.2, step: 11, n: 6 }));
  o.push(`<rect x="-10" y="-10" width="${W + 20}" height="${H + 20}" fill="url(#${radGrad(W / 2, H * 0.55, 620, [[0.6, '#2A1B33', 0], [1, '#2A1B33', 0.24]])})"/>`);

  // The phone layout is the middle of the same drawing, the sign and the trail in front of it, at the same scale, so
  // the lettering keeps its size. It widens, keeping its shape, if the boards ever do.
  const mw = Math.max(360, Math.ceil(sg.half * 2 + 70)), mh = Math.round(mw * 400 / 360);
  return { svg: `<defs>${L.defs.join('\n')}</defs>${o.join('\n')}`, vb: [0, 0, W, H], vbm: [Math.round(SX - mw / 2), H - mh, mw, mh] };
}
