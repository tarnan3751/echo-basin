// The visitor's portrait: Dana K., who stayed in Cabin 3. A head-and-shoulders photograph of the kind a park puts
// beside a guest's quote: taken toward the end of a day, the sun low behind her on her right, the range behind her.
//
// The light is the picture. The sun is behind her and to our left, so her face is in open shade (gently modelled,
// darker on the side away from the sun) and the sun shows as a bright edge along the left of her hair and along the
// tops of her shoulders. Each stage the sun stands lower. At 4 it is half behind the ridge and she is no longer
// smiling. At 5 it has gone: the sky is the dusk sky of the lodge picture, the land has gone dark under it, and she
// is drawn again in that light with no bright edge. At 6 it is night, with the full moon of the last picture where
// the sun was, and she is lit from in front and below, as the people on the pier are. A shadow lies across the top of
// her head and comes down as far as her cheeks. It falls on her and on nothing behind her, and it has no hard edge.
// Her eyes are open in it, looking up over our head.
//
// She is the same woman who stands on the pier in the last picture: the bob, the teal jacket with the coral collar,
// the cream roll-neck (see dock-people.mjs).
import * as L from './lib.mjs';
import { ribs, snowcaps } from './peaks.mjs';
import { smooth } from './snowkit.mjs';
const { f, lerp, mix, poly, curveFn, grain, GL, from, until, between, linGrad, radGrad, clip, nid } = L;

const W = 560, H = 640;
// Move a path that is written only as absolute x,y pairs.
const shift = (d, dx, dy) => d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (m, x, y) => `${f(+x + dx)},${f(+y + dy)}`);
// The thin edge of a shape that faces a light: the shape, less the same shape moved away from the light. keep is the
// part of the picture the light can reach; outside it nothing is drawn, so no hairline shows along the far side.
const edge = (d, dx, dy, color, cid, keep) => `<g clip-path="url(#${clip(keep)})"><path d="${d} ${shift(d, dx, dy)}" fill-rule="evenodd" fill="${color}" clip-path="url(#${cid})"/></g>`;
// Stipple shading inside a shape, dense at x0 and gone by about two thirds of the way to x1. Every pattern here is
// given its own number, so this picture takes none of the automatic ones the other pictures use.
const stipple = (cid, x0, x1, y0, y1, color, strength, seed) => grain(Math.min(x0, x1), y0, Math.abs(x1 - x0), y1 - y0, GL(x0, 0, lerp(x0, x1, 0.62), 0, [[0, strength], [0.5, strength * 0.4], [1, 0]]), color, { clipId: cid, seed });

// ---------- her ----------
// Drawn about the middle of her face: the origin is between her eyes, and her face is 208 wide.
const FACE = 'M0,-152 C62,-152 104,-108 104,-36 C104,18 98,62 76,104 C58,136 30,154 0,154 C-30,154 -58,136 -76,104 C-98,62 -104,18 -104,-36 C-104,-108 -62,-152 0,-152Z';
const HAIR_OUT = 'M-118,124 C-136,96 -132,34 -134,-30 C-144,-120 -86,-186 0,-186 C86,-186 144,-120 134,-30 C132,34 136,96 118,124 C80,131 -80,131 -118,124Z';   // the whole head of hair as one shape
const HAIR = 'M-118,124 C-136,96 -132,34 -134,-30 C-144,-120 -86,-186 0,-186 C86,-186 144,-120 134,-30 C132,34 136,96 118,124 C106,132 94,128 86,116 C96,70 100,22 98,-28 C74,-82 16,-104 -34,-112 C-68,-106 -96,-78 -100,-34 C-102,12 -98,70 -90,116 C-98,128 -110,132 -118,124Z';
const HAIR_BACK = 'M-110,-40 L-112,114 C-100,125 -84,127 -64,121 L64,121 C84,127 100,125 112,114 L110,-40Z';
const NECK = 'M-40,100 L-38,240 L38,240 L40,100Z';
const ROLL = 'M-52,176 C-30,196 30,196 52,176 L60,250 C30,266 -30,266 -60,250Z';
const JACKET = 'M-60,226 C-110,236 -176,258 -206,286 C-228,304 -238,340 -242,400 L-250,560 L250,560 L242,400 C238,340 228,304 206,286 C176,258 110,236 60,226 L0,312Z';
const leaf = k => `M${-56 * k},206 C${-74 * k},212 ${-94 * k},226 ${-104 * k},242 C${-86 * k},274 ${-64 * k},304 ${-38 * k},332 L${-11 * k},300 C${-30 * k},272 ${-46 * k},240 ${-56 * k},206Z`;

const NIGHT = '#0C1626', LAMP = '#FFC070';
// The three lights she is seen in. lit and sh take a colour as it is by day and give it as it is in that light.
const LIGHTS = {
  day: { lit: c => c, sh: c => c, hair: c => c, rim: { c: '#FFD9A6', dx: 4, dy: 2, jx: 4, jy: 6 }, open: 1, brow: [0, 0] },
  dusk: { lit: c => mix(c, '#3B3560', 0.36), sh: c => mix(c, '#2A2548', 0.46), hair: c => mix(c, '#1B1830', 0.3), rim: null, open: 1.04, brow: [6, -2] },
  night: { lit: c => mix(mix(c, NIGHT, 0.52), mix(c, LAMP, 0.15), 0.8), sh: c => mix(mix(c, NIGHT, 0.74), mix(mix(c, '#1A1420', 0.42), LAMP, 0.05), 0.8), hair: c => mix(c, NIGHT, 0.4), rim: { c: '#93AAC0', dx: 3, dy: 1.5, jx: 3, jy: 4.4 }, open: 1.22, brow: [8, -5] },
};

function dana(kind){
  const G = L.PAL.gold, T = LIGHTS[kind], s = [];
  const skin = T.lit('#EDB08C'), skinSh = T.sh('#CF8E76'), deep = T.sh('#B5745F');
  const hair = T.hair('#2B2136'), hairHi = T.hair('#4A3857'), hairSh = T.hair('#1D1627');
  const knit = T.lit('#FBEBD0'), knitSh = T.sh('#E2C19E'), knitRib = T.sh('#CFA985');
  const jk = T.lit(G.tealLight), jkSh = T.sh(G.teal), jkDeep = T.sh(G.tealDeep), jkPale = T.lit(mix(G.tealLight, G.cream, 0.3));
  const col = T.lit(G.coral), colSh = T.sh(G.coralSh), colHi = T.lit(G.coralHi);
  const lipUp = T.sh('#B4473F'), lipLow = T.lit('#D9705F'), white = T.lit('#FBF1E4'), iris = '#261A28', zip = T.lit(G.cream);
  const fc = clip(FACE), hc = clip(HAIR), ho = clip(HAIR_OUT), nc = clip(NECK), rc = clip(ROLL), jc = clip(JACKET);
  const seed = { day: 8310, dusk: 8330, night: 8350 }[kind];

  // ---- the hair that hangs behind her neck
  s.push(`<path d="${HAIR_BACK}" fill="${hairSh}"/>`);

  // ---- the jumper where it shows in the neck of the jacket, then the jacket
  s.push(`<path d="M-62,224 L62,224 L0,318Z" fill="${knit}"/><path d="M-62,248 C-30,266 30,266 62,248 L54,268 C28,282 -28,282 -54,268Z" fill="${knitSh}"/>`);
  s.push(`<path d="${JACKET}" fill="${jk}"/><g clip-path="url(#${jc})"><path d="M12,220 C32,300 36,420 26,560 L300,560 L300,220Z" fill="${jkSh}"/></g>`);
  s.push(stipple(jc, 300, -120, 200, 560, jkDeep, 0.7, seed) + stipple(jc, -290, -120, 200, 560, jkPale, 0.5, seed + 1));
  if (T.rim) s.push(edge(JACKET, T.rim.jx, T.rim.jy, T.rim.c, jc, 'M-300,200 H-64 V600 H-300Z M64,200 H300 V600 H64Z'));
  // seams: the sleeve set into the shoulder, the yoke across it; the zip with its teeth and its pull; a chest pocket
  s.push(`<g fill="none" stroke="${jkDeep}" stroke-linecap="round"><path d="M-180,264 C-170,320 -172,400 -180,560 M180,264 C170,320 172,400 180,560" stroke-width="2.4" opacity="0.7"/><path d="M-70,252 C-108,266 -150,274 -178,276 M70,252 C108,266 150,274 178,276" stroke-width="1.8" opacity="0.5"/><path d="M0,312 L0,560" stroke-width="3.6"/><path d="M70,352 L128,352" stroke-width="3"/></g>`);
  s.push(`<path d="M3.4,326 L3.4,560" stroke="${zip}" stroke-width="1.5" opacity="0.6" stroke-dasharray="3 3" fill="none"/><rect x="-4.5" y="312" width="9" height="19" rx="3" fill="${zip}"/><rect x="-2" y="316" width="4" height="7" rx="1.6" fill="${jkDeep}" opacity="0.5"/><rect x="66" y="347" width="8" height="10" rx="2" fill="${zip}"/>`);

  // ---- the roll-neck: the far side of it behind her neck, her neck, then the roll itself in front
  s.push(`<path d="M-52,176 C-30,158 30,158 52,176 C30,196 -30,196 -52,176Z" fill="${knitRib}"/>`);
  s.push(`<path d="${NECK}" fill="${skin}"/><g clip-path="url(#${nc})"><path d="M10,96 L44,96 L44,244 L16,244 C20,200 18,150 10,96Z" fill="${skinSh}"/><path d="${FACE}" fill="${deep}" transform="translate(7,38)"/></g>`);
  {
    // ribs follow the roll round: straight down the front, closing up and leaning as they go round the sides
    const top = x => 176 + 15 * (1 - (x / 52) ** 2), bot = x => 250 + 12 * (1 - (x / 60) ** 2); let ribs = '';
    for (let k = -5; k <= 5; k++) { const a = k * 0.27, xt = 52 * Math.sin(a), xb = 60 * Math.sin(a); ribs += `M${f(xt)},${f(top(xt) + 1)} Q${f((xt + xb) / 2 + Math.sin(a) * 2.4)},${f((top(xt) + bot(xb)) / 2)} ${f(xb)},${f(bot(xb) - 1)} `; }
    s.push(`<path d="${ROLL}" fill="${knit}"/><g clip-path="url(#${rc})"><path d="M16,150 C26,190 26,236 18,280 L90,280 L90,150Z" fill="${knitSh}"/><path d="${ribs}" fill="none" stroke="${knitRib}" stroke-width="1.7" stroke-linecap="round" opacity="0.75"/><path d="M-52,176 C-30,196 30,196 52,176 L52,186 C30,208 -30,208 -52,186Z" fill="${knitRib}" opacity="0.55"/><path d="M-60,243 C-30,259 30,259 60,243" fill="none" stroke="${knitRib}" stroke-width="1.4" opacity="0.5"/></g>`);
    s.push(stipple(rc, 70, -30, 170, 270, knitRib, 0.5, seed + 2));
  }

  // ---- the jacket's collar: two leaves lying on the chest either side of the roll, each with its shadow under it
  s.push(`<g clip-path="url(#${jc})" fill="${jkDeep}" opacity="0.55"><path d="${leaf(1)}" transform="translate(4,8)"/><path d="${leaf(-1)}" transform="translate(4,8)"/></g>`);
  s.push(`<path d="${leaf(1)}" fill="${col}"/><path d="${leaf(-1)}" fill="${colSh}"/>`);
  s.push(`<path d="M-56,206 C-74,212 -94,226 -104,242 L-97,253 C-88,239 -72,227 -53,221Z" fill="${colHi}"/><path d="M-38,332 L-11,300" stroke="${colSh}" stroke-width="1.6" stroke-linecap="round" opacity="0.6"/><path d="M38,332 L11,300" stroke="${T.sh('#8C3A33')}" stroke-width="1.6" stroke-linecap="round" opacity="0.7"/>`);

  // ---- her face. The side away from the sun is in a little more shade, and her hair shades her forehead.
  s.push(`<path d="${FACE}" fill="${skin}"/><g clip-path="url(#${fc})"><path d="M44,-156 C72,-122 86,-72 85,-30 C85,2 89,26 84,54 C78,98 52,134 12,156 L120,164 L120,-156Z" fill="${skinSh}"/><path d="${HAIR}" fill="${skinSh}" transform="translate(5,13)"/></g>`);
  s.push(stipple(fc, 112, 34, -150, 160, skinSh, 0.55, seed + 3));
  if (kind === 'day') s.push(until(3, `<g clip-path="url(#${fc})"><circle cx="-58" cy="50" r="34" fill="url(#${radGrad(-58, 50, 34, [[0, G.coral, 0.24], [1, G.coral, 0]])})"/><circle cx="58" cy="50" r="32" fill="url(#${radGrad(58, 50, 32, [[0, G.coralSh, 0.22], [1, G.coralSh, 0]])})"/></g>`));
  // nose, seen from in front: the side of the bridge that is turned from the sun, a crescent of shade under the
  // tip, and the wings either side
  s.push(`<path d="M6,-14 C7,6 8,24 13,38 C17,42 20,46 21,50 C17,47 12,45 8,45 C6,28 5,8 6,-14Z" fill="${skinSh}"/><path d="M-15,54 C-9,61 -4,63.4 1,63.4 C7,63.4 13,61 18,54 C13,57.8 7,59.4 1,59.4 C-5,59.4 -10,57.8 -15,54Z" fill="${skinSh}"/><path d="M-17,53.4 C-22.4,50 -22.4,43 -17.4,40 M20,53.4 C25.4,50 25.4,43 20.4,40" fill="none" stroke="${skinSh}" stroke-width="2" stroke-linecap="round"/>`);
  // eyes: the white, the iris (which the page can turn), the upper lid as a line that thins to a point at each end,
  // the fold above it and the lid below
  const o = T.open;
  const eye = (cx, k) => { const white_ = `M${cx - k * 21},3 Q${cx},${f(-16 * o)} ${cx + k * 21},1 Q${cx},${f(12 * o)} ${cx - k * 21},3Z`;
    return `<path d="${white_}" fill="${white}"/><g clip-path="url(#${clip(white_)})"><g class="eye" data-r="5"><circle cx="${cx}" cy="0" r="9.4" fill="${iris}"/><circle cx="${cx - 3}" cy="-3" r="2.3" fill="${T.lit('#FFF6E4')}"/></g><path d="M${cx - k * 22},1 Q${cx},${f(-19.4 * o)} ${cx + k * 22},-1 L${cx + k * 22},-14 L${cx - k * 22},-14Z" fill="${skinSh}" opacity="0.3" transform="translate(0,${f(4.4 * o)})"/></g>`
      + `<path d="M${cx - k * 22},4 Q${cx},${f(-21 * o)} ${cx + k * 26},-2 Q${cx},${f(-14 * o)} ${cx - k * 22},4Z" fill="${hair}"/>`
      + `<path d="M${cx - k * 19},-10 Q${cx},${f(-28 * o)} ${cx + k * 23},-11" fill="none" stroke="${skinSh}" stroke-width="2.1" stroke-linecap="round"/><path d="M${cx - k * 16},${f(9 * o)} Q${cx},${f(14.4 * o)} ${cx + k * 18},${f(7 * o)}" fill="none" stroke="${skinSh}" stroke-width="1.8" stroke-linecap="round" opacity="0.85"/>`; };
  s.push(eye(-46, -1) + eye(46, 1));
  // brows: thick toward the nose, thinning to a point. In the later lights their inner ends lift.
  const brow = k => `<path d="M${20 * k},-36 C${36 * k},-45 ${56 * k},-45 ${75 * k},-31 C${58 * k},-38.4 ${38 * k},-37.4 ${22 * k},-28Z" fill="${hair}" transform="translate(0,${T.brow[1]}) rotate(${T.brow[0] * k} ${46 * k} -36)"/>`;
  s.push(brow(-1) + brow(1));
  // mouth: a closed smile, then a level mouth, then lips a little apart with nothing glad in them
  const smile = `<path d="M-33,93 C-22,88 -12,88 -5,91 Q0,89.4 5,91 C12,88 22,88 33,93 C20,100.4 -20,100.4 -33,93Z" fill="${lipUp}"/><path d="M-27,98 C-12,102.4 12,102.4 27,98 C18,111.4 -18,111.4 -27,98Z" fill="${lipLow}"/>`;
  const level = `<path d="M-30,96 C-20,91.4 -11,91 -5,93.4 Q0,92 5,93.4 C11,91 20,91.4 30,96 C18,99.6 -18,99.6 -30,96Z" fill="${lipUp}"/><path d="M-24,99.6 C-10,102 10,102 24,99.6 C16,109.4 -16,109.4 -24,99.6Z" fill="${lipLow}"/>`;
  const gap = kind === 'night' ? 6.2 : 4.4;
  const parted = `<path d="M-27,97.4 C-18,91.4 -10,90.6 -4.4,93 Q0,91.6 4.4,93 C10,90.6 18,91.4 27,97.4 C17,96.4 -17,96.4 -27,97.4Z" fill="${lipUp}"/><path d="M-17,97 C-8,95.4 8,95.4 17,97 C12,${f(97 + gap * 1.5)} -12,${f(97 + gap * 1.5)} -17,97Z" fill="#2A1620"/><path d="M-19,${f(99 + gap)} C-9,${f(102.4 + gap)} 9,${f(102.4 + gap)} 19,${f(99 + gap)} C12,${f(108.6 + gap)} -12,${f(108.6 + gap)} -19,${f(99 + gap)}Z" fill="${lipLow}"/>`;
  s.push(kind === 'day' ? until(3, smile) + between(4, 4, level) : parted);

  // ---- her hair: the bob, the side of it that is turned from the sun, the sheen on the side that is toward it,
  // strands that follow the way it is combed, and the parting
  s.push(`<path d="${HAIR}" fill="${hair}"/><g clip-path="url(#${hc})"><path d="M74,-190 C104,-150 116,-80 108,-20 C104,40 108,90 100,134 L170,134 L170,-190Z" fill="${hairSh}"/><path d="M-112,-36 C-128,-120 -74,-172 -14,-178 C-62,-160 -100,-116 -103,-36Z" fill="${hairHi}"/></g>`);
  s.push(`<g fill="none" stroke="${hairHi}" stroke-linecap="round"><path d="M-28,-132 C22,-124 80,-98 110,-44" stroke-width="3" opacity="0.85"/><path d="M-10,-154 C40,-148 98,-120 122,-58" stroke-width="2.4" opacity="0.55"/><path d="M-117,-14 C-121,34 -118,82 -110,116 M122,-6 C125,40 123,84 113,118" stroke-width="2.2" opacity="0.5"/></g><path d="M-34,-112 C-29,-140 -19,-166 -4,-185" fill="none" stroke="${hairSh}" stroke-width="2.4" stroke-linecap="round"/>`);
  if (T.rim) s.push(edge(HAIR_OUT, T.rim.dx, T.rim.dy, T.rim.c, ho, 'M-200,-220 H80 V-100 L-104,140 H-200Z'));

  if (kind === 'night') {
    // the shadow. It covers her from the crown down to her cheeks, and only her: it is cut to her outline. Then
    // the light in her eyes, drawn over it, moving with them.
    const all = nid('cp'), blur = nid('fb');
    L.defs.push(`<clipPath id="${all}">${[HAIR_OUT, FACE, NECK, ROLL, JACKET, leaf(1), leaf(-1)].map(d => `<path d="${d}"/>`).join('')}</clipPath><filter id="${blur}" filterUnits="userSpaceOnUse" x="-330" y="-330" width="660" height="520"><feGaussianBlur stdDeviation="9"/></filter>`);
    s.push(`<g clip-path="url(#${all})"><path d="M-320,-320 L320,-320 L320,26 C200,50 80,22 -40,40 C-140,54 -240,36 -320,48Z" fill="#03060C" opacity="0.66" filter="url(#${blur})"/></g>`);
    s.push([-46, 46].map(cx => `<g class="eye" data-r="5"><circle cx="${cx - 3}" cy="-3" r="2.6" fill="#FFF3D6"/><circle cx="${cx + 3.4}" cy="2.6" r="1.1" fill="#FFF3D6" opacity="0.6"/></g>`).join(''));
  }
  return s.join('');
}

// ---------- the picture ----------
export function portrait(){
  L.usePalette('gold'); L.begin(); L.reseed(83); L.setSun({ x: 150, y: 262, r: 52 }); L.setWater(H);
  const P = L.P, D = L.PAL.dusk, N = L.PAL.night, SX = 150, R = 52, o = [];

  // ---- sky. By day; redder each stage as the sun goes down; the dusk sky from stage 5; the night sky at 6.
  o.push(`<rect width="${W}" height="${H}" fill="url(#${linGrad(0, 0, 0, 470, [[0, P.skyTop], [0.36, P.skyMid], [0.74, P.skyLow], [1, P.skyHorizon]])})"/>`);
  o.push(grain(0, 0, W, 300, GL(0, 0, 0, 300, [[0, 0.4], [0.5, 0.14], [1, 0]]), P.grainSky, { seed: 8301 }));
  for (const n of [2, 3, 4]) o.push(from(n, `<rect width="${W}" height="${H}" fill="url(#${linGrad(0, 0, 0, 470, [[0, '#8E4468', 0.1], [0.6, P.coral, 0.07], [1, P.coral, 0.1]])})"/>`));
  {
    const r = L.source(8303); let few = '';
    for (let k = 0; k < 7; k++) few += `<circle cx="${f(r(20, W - 20))}" cy="${f(r(14, 150))}" r="${f(r(0.7, 1.3))}" opacity="${f(r(0.4, 0.8))}"/>`;
    o.push(from(5, `<rect width="${W}" height="${H}" fill="url(#${linGrad(0, 0, 0, 470, [[0, D.skyTop], [0.4, D.skyMid], [0.8, D.skyLow], [1, D.skyHorizon]])})"/><circle cx="${SX}" cy="436" r="330" fill="url(#${radGrad(SX, 436, 330, [[0, D.sun, 0.5], [0.5, D.sun, 0.16], [1, D.sun, 0]])})" transform="translate(0,${f(436 * 0.64)}) scale(1,0.36)"/><g fill="${D.cream}">${few}</g>`));
  }
  // the ranges are needed first for the night sky, so that no star is put where a mountain is
  const farPts = [[-20, 470], [40, 442], [92, 456], [150, 424], [212, 446], [268, 404], [326, 432], [392, 412], [446, 354], [492, 390], [534, 338], [580, 394]];
  const midPts = [[-20, 512], [44, 490], [100, 502], [160, 478], [220, 496], [300, 486], [360, 492], [420, 468], [470, 484], [520, 460], [580, 476]];
  {
    const skyline = curveFn(farPts), r = L.source(8304), MOON = { x: SX, y: 318, r: 30 }; let st = '';
    for (let k = 0; k < 150; k++) { const x = r(0, W), y = r(0, 430), d = Math.hypot(x - MOON.x, y - MOON.y); if (y > skyline(x) - 10 || d < 70 || (d < 150 && r() < 0.6)) continue; st += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r() < 0.06 ? r(1.4, 1.9) : r(0.5, 1.15))}" opacity="${f(r(0.3, 1))}"/>`; }
    // the moon: the same full moon as stands over the lake in the last picture
    const rs = L.source(8305), sea = (cx, cy, rx, ry, n = 8) => { const pts = []; for (let i = 0; i < n; i++) { const a = i / n * 6.283, k = rs(0.78, 1.16); pts.push([MOON.x + cx + Math.cos(a) * rx * k, MOON.y + cy + Math.sin(a) * ry * k]); } return smooth(pts, true); };
    const disc = `M${MOON.x - MOON.r},${MOON.y} a${MOON.r},${MOON.r} 0 1 0 ${MOON.r * 2},0 a${MOON.r},${MOON.r} 0 1 0 ${-MOON.r * 2},0Z`;
    o.push(from(6, `<rect width="${W}" height="${H}" fill="url(#${linGrad(0, 0, 0, 470, [[0, N.skyTop], [0.4, N.skyMid], [0.8, N.skyLow], [1, N.skyHorizon]])})"/><g fill="${N.sun}">${st}</g><circle cx="${MOON.x}" cy="${MOON.y}" r="210" fill="url(#${radGrad(MOON.x, MOON.y, 210, [[0, N.sun, 0.36], [0.36, N.sun, 0.13], [1, N.sun, 0]])})"/><circle cx="${MOON.x}" cy="${MOON.y}" r="${MOON.r + 6}" fill="${N.sun}" opacity="0.16"/><path d="${disc}" fill="${N.sun}"/><g clip-path="url(#${clip(disc)})" fill="${mix(N.sun, N.skyLow, 0.24)}"><path d="${sea(-10, -9, 9, 7)}" opacity="0.5"/><path d="${sea(8, -4, 7, 8)}" opacity="0.42"/><path d="${sea(-12, 8, 6, 5)}" opacity="0.36"/><path d="${sea(5, 14, 5, 3.4)}" opacity="0.32"/></g>`));
  }

  // ---- the sun, a little lower each stage, and half behind the ridge at stage 4. It is drawn before the ranges, so it sets behind them.
  const sunAt = y => `<circle cx="${SX}" cy="${y}" r="300" fill="url(#${radGrad(SX, y, 300, [[0, P.cream, 0.52], [0.3, P.cream, 0.32], [1, P.cream, 0]])})"/><g fill="${P.sun}"><circle cx="${SX}" cy="${y}" r="${R + 44}" opacity="0.13"/><circle cx="${SX}" cy="${y}" r="${R + 24}" opacity="0.2"/><circle cx="${SX}" cy="${y}" r="${R + 10}" opacity="0.34"/><circle cx="${SX}" cy="${y}" r="${R}"/></g>`;
  const SUNY = [262, 292, 324, 362, 418];
  o.push(until(0, sunAt(SUNY[0])) + [1, 2, 3, 4].map(k => between(k, k, sunAt(SUNY[k]))).join(''));

  // ---- clouds: the same two by day and at dusk
  {
    const clouds = () => L.cloud(432, 96, 0.6, [[0, 0, 200, 22], [44, 17, 290, 26], [-20, 37, 170, 20]]) + L.cloud(92, 104, 0.34, [[0, 0, 180, 22], [-30, 17, 260, 24]]);
    const day = clouds(); L.usePalette('dusk'); const dusk = clouds(); L.usePalette('gold');
    o.push(until(4, day) + between(5, 5, dusk));                     // the night is clear, as it is over the lake in the last picture
  }

  // ---- the far range: snow on its two high peaks, ribs and runnels on its faces, its sunward skyline picked out
  const far = L.range(farPts, { baseY: H, lit: P.farLit, shadeColor: P.farShade, shadeOpacity: 0.34, snowPeaks: [8, 10], amp: 4, seg: 26, caps: false });
  const caps = snowcaps(far.peaks, 83), rb = ribs(far.peaks, 29, 0.8), liftTone = mix(P.farLit, P.cream, 0.6);
  o.push(far.svg);
  o.push(`<g clip-path="url(#${far.cid})"><path d="${caps}" fill="${P.snow}"/><path d="${far.shadeD}" fill="${P.farShade}" fill-opacity="0.34" clip-path="url(#${clip(caps)})"/><path d="${rb.cut}" fill="${P.farShade}" fill-opacity="0.17"/><path d="${rb.deep}" fill="${P.farShade}" fill-opacity="0.2"/><path d="${rb.lift}" fill="${liftTone}" fill-opacity="0.3"/><path d="${rb.fluteLit}" fill="none" stroke="${P.farShade}" stroke-opacity="0.22" stroke-width="1.1" stroke-linecap="round"/><path d="${rb.fluteSh}" fill="none" stroke="${liftTone}" stroke-opacity="0.3" stroke-width="1.1" stroke-linecap="round"/></g>`);
  o.push(grain(0, 330, W, 310, GL(0, 340, 0, 600, [[0, 0.42], [0.5, 0.2], [1, 0.02]]), P.farShade, { clipId: clip(far.shadeD), seed: 8306, opacity: 0.3 }));
  o.push(until(4, `<path d="${rb.rim}" fill="none" stroke="${P.sun}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" opacity="0.95"/>`));
  o.push(`<rect x="0" y="380" width="${W}" height="${H - 380}" fill="url(#${linGrad(0, 380, 0, 520, [[0, P.cream, 0], [1, P.cream, 0.6]])})" clip-path="url(#${far.cid})"/>`);
  // ---- a nearer ridge, and the forest in front of it
  const mid = L.range(midPts, { baseY: H, lit: P.midLit, shadeColor: P.midShade, shadeOpacity: 0.42, amp: 4, seg: 26, ridgeZig: 8 });
  o.push(mid.svg);
  { const rm = ribs(mid.peaks, 23, 0.7), lift = mix(P.midLit, P.peach, 0.45); o.push(`<g clip-path="url(#${mid.cid})"><path d="${rm.cut}" fill="${P.midShade}" fill-opacity="0.2"/><path d="${rm.deep}" fill="${P.midShade}" fill-opacity="0.24"/><path d="${rm.lift}" fill="${lift}" fill-opacity="0.22"/></g>` + until(4, `<path d="${rm.rim}" fill="none" stroke="${mix(P.midLit, P.cream, 0.5)}" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round" opacity="0.7"/>`)); }
  o.push(`<rect x="0" y="470" width="${W}" height="${H - 470}" fill="url(#${linGrad(0, 470, 0, 580, [[0, P.peach, 0], [1, P.cream, 0.6]])})" clip-path="url(#${mid.cid})"/>`);
  const nDefs = L.defs.length;
  o.push(L.hill(-20, 580, [[-20, 548], [90, 536], [190, 546], [300, 540], [400, 530], [500, 542], [580, 532]], 2, 26, P.haze, P.teal, { mixed: true, baseY: H + 10, share: true, scale: 1.25 }));
  const treeIds = L.defs.slice(nDefs).map(d => (d.match(/^<path id="(sh\d+)"/) || [])[1]).filter(Boolean);
  // ---- the land after the sun has gone: each range darker than the one behind it. Then again for the night, with
  // the moon on the far skyline.
  const dark = (a, b, c) => `<path d="${far.body}" fill="${a[0]}" opacity="${a[1]}"/><path d="${mid.body}" fill="${b[0]}" opacity="${b[1]}"/>${treeIds.map(id => `<use href="#${id}" fill="${c[0]}" opacity="${c[1]}"/>`).join('')}`;
  o.push(from(5, dark(['#35284C', 0.5], ['#2A2040', 0.5], ['#102B39', 0.5])));
  o.push(from(6, dark(['#1B2C40', 0.84], ['#0E1A2A', 0.86], ['#060D16', 0.9]) + `<g clip-path="url(#${far.cid})"><path d="${caps}" fill="${N.snow}" opacity="0.6"/><path d="${far.shadeD}" fill="${N.farShade}" opacity="0.4"/></g><path d="${rb.rim}" fill="none" stroke="${N.cream}" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round" opacity="0.4"/>`));

  // ---- her, in each of the three lights
  const place = s => `<g transform="translate(280,282) scale(0.88)">${s}</g>`;
  o.push(until(4, place(dana('day'))) + between(5, 5, place(dana('dusk'))) + from(6, place(dana('night'))));
  o.push(`<rect width="${W}" height="${H}" fill="url(#${radGrad(W / 2, H * 0.44, 560, [[0.6, '#2A1B33', 0], [1, '#2A1B33', 0.32]])})"/>`);
  L.grainSkip(4);          // the patterns the old portrait took, so the pier picture, which is made after this one, keeps its own
  return { svg: `<defs>${L.defs.join('\n')}</defs>${o.join('\n')}`, vb: [0, 0, W, H] };
}
