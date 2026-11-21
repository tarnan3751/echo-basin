// Front-facing standing figure, feet at y=0, about 505 tall with a hat.
// spec: { skin, skinSh, hair, brow, hairStyle:'short'|'bob'|'long'|'bun'|'beanie'|'hat', long, top:{lit,sh}, sleeve:{lit,sh},
//         pants:{lit,sh}, boots, kind:'uniform'|'jacket'|'vest', stripe, beard, build, lx:±1 (the side the light is on),
//         mouth:'smile'|'flat', smileUntil, tilt, gaze:[x,y], whites, hatCol, hatSh, hatBand,
//         sleeves:'long'|'rolled' (rolled = to above the elbow, forearms bare), over:{lit,sh} (a work vest worn over the shirt), pose, radio, tape, gloves, earrings, pins }
// People who are not rangers (the lodge's guests and staff) also use:
//         kind:'sweater' (no zip, ribbed at the neck and hem) | 'robe' (a dressing gown to the shin, wrapped and tied),
//         neck:'roll' (a ribbed roll-neck under the jacket), leaf:{lit,sh} (the collar in its own colour), collar (what shows at the throat),
//         apron:{lit,sh}, straps (makes a vest a life vest: webbing round it, and a scooped neck with no collar), tag (a name badge), glasses (their colour),
//         beanie:{lit,sh,band}, feet:'bare'|'slippers' (slipper: colour), pin (pinstripe colour of pyjama trousers),
//         rim (a colour: light from behind and above, drawn as a thin edge on the head and shoulders)
// pose: 'sides' (default) | 'clasp' (hands folded in front) | 'mug' (one hand on the hip, a mug in the other) |
//       'board' (a clipboard held against the body)
// Eyes are emitted as <g class="eye"> so the page can steer every gaze at once.
import * as L from './lib.mjs';
const { f, mix, part, capsule, softShade, clip, until, from } = L;

const unit = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; };
const along = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
// a bar across a limb: from p0 to p1 along its axis, hw to either side
const band = (p0, p1, hw) => { const [ux, uy] = unit(p0, p1), nx = -uy * hw, ny = ux * hw; return `M${f(p0[0] + nx)},${f(p0[1] + ny)} L${f(p1[0] + nx)},${f(p1[1] + ny)} L${f(p1[0] - nx)},${f(p1[1] - ny)} L${f(p0[0] - nx)},${f(p0[1] - ny)}Z`; };

// like a capsule, but cut square at p1 (round at p0)
const tube = (p0, r0, p1, r1) => { const [ux, uy] = unit(p0, p1), nx = -uy, ny = ux; return `M${f(p0[0] + nx * r0)},${f(p0[1] + ny * r0)} L${f(p1[0] + nx * r1)},${f(p1[1] + ny * r1)} L${f(p1[0] - nx * r1)},${f(p1[1] - ny * r1)} L${f(p0[0] - nx * r0)},${f(p0[1] - ny * r0)} A${f(r0)},${f(r0)} 0 0 0 ${f(p0[0] + nx * r0)},${f(p0[1] + ny * r0)}Z`; };

// Hands, drawn hanging from a wrist at the origin with the thumb on +x. Each narrows to the wrist, so that it meets
// a bare forearm without a step.
const HAND = {
  // relaxed: the back of the hand, fingers together, thumb lying forward (the thumb is wound the same way as the hand, so
  // the two merge where they overlap)
  rest: { d: 'M-6.8,-2 C-9.2,4 -9.8,15 -8.8,22.5 C-8,29.4 -5,34.6 -0.6,35 C4.2,35.4 7.6,31.2 8.6,24.6 C9.6,16 9.2,4 6.8,-2Z M7.6,19.6 C8.6,22.8 11.6,22.6 12.6,18.4 C13.8,12 12.2,5.6 7.4,3Z', ln: 'M-3.8,25 L-3.4,33.2 M0.6,25.8 L0.8,34 M4.8,25 L4.4,32 M7.9,8 C8.6,11.4 8.7,15 8.2,18.6' },
  // closed round something
  fist: { d: 'M-7,-2 C-9.6,3 -10.6,10 -9.2,16 C-7.6,21.6 -2.4,24 3.2,23.2 C9,22.2 11.2,17.4 11,11 C10.8,5.4 9.6,1 7,-2Z', ln: 'M-6,15.4 L-5.4,22 M-1.6,16.6 L-1.4,23.4 M3,16.2 L3.4,22.8 M9.6,7.4 C4.4,9.4 -0.6,9 -4.6,6.6' },
};
// dir is the way the fingers point. k = -1 for the arm on the viewer's left, +1 for the right; s scales it.
function handBits(W, dir, k, kind, s){
  const h = HAND[kind], rot = -Math.atan2(dir[0], dir[1]) * 180 / Math.PI;
  return { d: h.d, ln: h.ln, at: dx => `transform="translate(${f(W[0] + dx)},${f(W[1])}) rotate(${f(rot)}) scale(${f(-k * s)},${s})"` };
}
function hand(W, dir, k, kind, skin, sh, lx, s = 1){
  const h = handBits(W, dir, k, kind, s);
  return `<path d="${h.d}" fill="${sh}" ${h.at(0)}/><path d="${h.d}" fill="${skin}" ${h.at(lx * 1.5)}/><path d="${h.ln}" fill="none" stroke="${sh}" stroke-width="1.2" stroke-linecap="round" ${h.at(lx * 0.8)}/>`;
}
// A sleeve from shoulder S through elbow E to wrist Wr.
// Long: the whole arm, with a cuff over the wrist; the hand goes underneath it.
// Rolled: the sleeve stops in a roll on the upper arm, above the elbow. It returns `stub`, the bare arm from under the
// roll down to the elbow, for the caller to join to the forearm and hand; the roll is drawn over that.
function sleeveOf(S, E, Wr, rs, re, rw, tone, lx, { rolled = false } = {}){
  const ax = unit(E, Wr), We = [Wr[0] - ax[0] * rw, Wr[1] - ax[1] * rw], upper = capsule(S, rs, E, re);
  if (rolled) {
    const up = unit(S, E), Lu = Math.hypot(E[0] - S[0], E[1] - S[1]), at = g => [E[0] - up[0] * g, E[1] - up[1] * g], r = g => rs + (re - rs) * (1 - g / Lu);
    const d = tube(S, rs, at(19), r(19)), hw = r(20) + 1.8;
    return { d, stub: tube(E, re, at(21), r(21)),
      svg: part(d, tone.lit, tone.sh, 2.4, lx)
        + `<path d="${band(at(26), at(15), hw)}" fill="${tone.sh}" stroke="${tone.sh}" stroke-width="1.6" stroke-linejoin="round"/><path d="${band(at(24.4), at(21.6), hw)}" fill="${tone.lit}" opacity="0.5"/><path d="${band(at(18.4), at(17.4), hw)}" fill="${tone.lit}" opacity="0.3"/>` };
  }
  const C0 = [Wr[0] - ax[0] * 11.5, Wr[1] - ax[1] * 11.5], C1 = [Wr[0] + ax[0] * 1.2, Wr[1] + ax[1] * 1.2], nx = -ax[1], ny = ax[0];
  return { d: upper,
    svg: part(upper + ' ' + capsule(E, re, We, rw), tone.lit, tone.sh, 2.4, lx)
      + `<path d="${band(C0, C1, rw + 1.3)}" fill="${tone.sh}" stroke="${tone.sh}" stroke-width="1.6" stroke-linejoin="round"/><path d="${band(C0, [C0[0] + ax[0] * 2.2, C0[1] + ax[1] * 2.2], rw + 1.3)}" fill="${tone.lit}" opacity="0.45"/><circle cx="${f(Wr[0] - ax[0] * 5 + nx * (rw - 3))}" cy="${f(Wr[1] - ax[1] * 5 + ny * (rw - 3))}" r="1.3" fill="${tone.lit}"/>` };
}

// Flat-brimmed campaign hat. Origin: centre of the brim. The crown is pinched front and sides, so it shows a ridge
// down the middle with a hollow either side of it.
export function hatShape(col, sh, band, lx = 1){
  const hi = mix(col, '#FFFFFF', 0.2), d = -lx;                    // d: the side away from the light
  return `<ellipse cx="0" cy="2.4" rx="46" ry="6.6" fill="${sh}"/><ellipse cx="0" cy="0" rx="46" ry="5.4" fill="${col}"/><path d="M${-46 * d},0 A46,5.4 0 0 ${d > 0 ? 1 : 0} ${-12 * d},-5.2" fill="none" stroke="${hi}" stroke-width="1.2" stroke-linecap="round"/>
<path d="M-22.5,-1.5 C-23.5,-15 -19.5,-27 -11,-32.5 C-6.5,-35.4 6.5,-35.4 11,-32.5 C19.5,-27 23.5,-15 22.5,-1.5 C10,1.8 -10,1.8 -22.5,-1.5Z" fill="${col}"/>
<path d="M${5 * d},-34.2 C${13 * d},-32 ${21.5 * d},-22 ${22.5 * d},-1.5 C${18 * d},-0.2 ${13 * d},0.6 ${8.5 * d},1 C${10 * d},-12 ${8.6 * d},-25 ${5 * d},-34.2Z" fill="${sh}" opacity="0.55"/>
<path d="M-3,-33 C-9,-27 -11,-17 -9,-8 C-6.4,-15 -4.4,-24 -3,-33Z M3,-33 C9,-27 11,-17 9,-8 C6.4,-15 4.4,-24 3,-33Z" fill="${sh}" opacity="0.5"/>
<path d="M0,-34.4 C-1.6,-26 -1.6,-17 0,-9 C1.6,-17 1.6,-26 0,-34.4Z" fill="${hi}" opacity="0.7"/>
<path d="M-22.6,-8 C-10,-4.4 10,-4.4 22.6,-8 L22.5,-1.5 C10,1.8 -10,1.8 -22.5,-1.5Z" fill="${band}"/><path d="M-22.6,-8 C-10,-4.4 10,-4.4 22.6,-8" fill="none" stroke="${hi}" stroke-width="0.8" opacity="0.5"/><circle cx="0" cy="-2.9" r="2.5" fill="#F2B441"/><circle cx="${0.6 * lx}" cy="-3.4" r="1" fill="#FBE3A0"/>`;
}

export function figFront(sp){
  const P = L.P;
  const { skin, skinSh, hair, lx = 1, build = 1 } = sp;
  const B = v => v * build, s = [], top = sp.top, pants = sp.pants, sleeve = sp.sleeve || top, brow = sp.brow || hair;
  const kind = sp.kind || (sp.uniform ? 'uniform' : sp.vest ? 'vest' : 'jacket'), uni = kind === 'uniform', robe = kind === 'robe', sweater = kind === 'sweater', lifevest = !!sp.straps;
  const gold = '#F2B441', goldSh = '#C98E2B', lip = mix(skin, '#9B3F3F', 0.5), dark = '#1B1420';
  const h = sp.hairStyle, hat = h === 'hat', long = h === 'long' || sp.long, hairSh = mix(hair, '#000000', 0.2), hairHi = mix(hair, '#FFFFFF', 0.18);
  // ---- hair that falls behind the neck and shoulders
  if (long) s.push(`<path d="M-35,-470 C-41,-440 -42,-410 -40,-384 L40,-384 C42,-410 41,-440 35,-470Z" fill="${hairSh}"/>`);
  // ---- legs: trousers up to the waist, creases, pockets, boots
  for (const k of [-1, 1]) {
    const leg = `M${f(k * B(40))},-277 L0,-277 L0,-236 L${k * 3},-222 C${f(k * B(5))},-190 ${f(k * B(6))},-160 ${f(k * B(6))},-134 L${f(k * B(8))},-34 L${f(k * B(35))},-34 L${f(k * B(37))},-134 C${f(k * B(40))},-180 ${f(k * B(42))},-228 ${f(k * B(40))},-277Z`;
    s.push(part(leg, pants.lit, pants.sh, 2.6, lx));
    if (sp.pin) { let st = ''; for (let x = 4; x < 44; x += 5.4) st += `M${f(k * B(x))},-280 V-30 `; s.push(`<path d="${st}" stroke="${sp.pin}" stroke-width="1.1" opacity="0.6" fill="none" clip-path="url(#${clip(leg)})"/>`); }
    // the front of the leg, from the seam under the waistband down: a pleat that opens into the crease running to the
    // cuff, and a slash pocket that starts near the pleat and runs down and out to the side seam
    s.push(`<path d="M${f(k * B(18.5))},-263.4 L${f(k * B(21.5))},-238" stroke="${pants.sh}" stroke-width="1.5" stroke-linecap="round"/><path d="M${f(k * B(21.5))},-238 L${f(k * B(21.5))},-42" stroke="${pants.sh}" stroke-width="1.2" opacity="0.5"/><path d="M${f(k * B(27))},-263.4 Q${f(k * B(30.5))},-249 ${f(k * B(39.8))},-241" fill="none" stroke="${pants.sh}" stroke-width="1.5" stroke-linecap="round"/>`);
    const ax = k * B(21.5), bt = sp.boots || P.ink;
    s.push(`<rect x="${f(ax - B(13.5))}" y="-42" width="${f(B(27))}" height="8" fill="${pants.sh}"/>`);
    if (sp.feet === 'bare' || sp.feet === 'slippers') {
      // an ankle, and under it either the foot itself, toes toward us, or a slipper it has been pushed into
      const foot = `M${f(ax - 7.4)},-35 L${f(ax + 7.4)},-35 L${f(ax + 8.4)},-16 C${f(ax + 12.6)},-9 ${f(ax + 12.4)},0 ${f(ax + 6.4)},0 L${f(ax - 6.4)},0 C${f(ax - 12.4)},0 ${f(ax - 12.6)},-9 ${f(ax - 8.4)},-16Z`;
      s.push(part(foot, skin, skinSh, 1.8, lx));
      if (sp.feet === 'bare') s.push(`<path d="M${f(ax - 6.2)},-4.4 v3.4 M${f(ax - 2.2)},-5.2 v4.2 M${f(ax + 1.8)},-5.2 v4.2 M${f(ax + 5.8)},-4.4 v3.4" stroke="${skinSh}" stroke-width="1.1" stroke-linecap="round" fill="none"/><path d="M${f(ax - 6.6)},-33 h13.2" stroke="${skinSh}" stroke-width="1.6" opacity="0.6"/>`);
      else { const sl = sp.slipper || P.haze, slSh = mix(sl, '#000000', 0.34), d = `M${f(ax - 12.4)},-15 C${f(ax - 14)},-5 ${f(ax - 11.6)},0 ${f(ax - 5.4)},0 L${f(ax + 5.4)},0 C${f(ax + 11.6)},0 ${f(ax + 14)},-5 ${f(ax + 12.4)},-15 Q${f(ax)},-21.6 ${f(ax - 12.4)},-15Z`; s.push(part(d, sl, slSh, 1.8, lx) + `<path d="M${f(ax - 12.2)},-14.6 Q${f(ax)},-8.4 ${f(ax + 12.2)},-14.6" stroke="${slSh}" stroke-width="1.5" fill="none"/><rect x="${f(ax - 12)}" y="-2.4" width="24" height="2.4" rx="1.2" fill="${slSh}"/>`); }
      continue;
    }
    s.push(`<path d="M${f(ax - 12)},-35 L${f(ax + 12)},-35 L${f(ax + 13.5)},-12 C${f(ax + 15)},-3 ${f(ax + 11)},0 ${f(ax + 5)},0 L${f(ax - 5)},0 C${f(ax - 11)},0 ${f(ax - 15)},-3 ${f(ax - 13.5)},-12Z" fill="${bt}"/><path d="M${f(ax - 10.5)},-11 Q${f(ax)},-17 ${f(ax + 10.5)},-11" stroke="${mix(bt, P.haze, 0.55)}" stroke-width="1.4" fill="none"/><path d="M${f(ax - 4)},-30 h8 M${f(ax - 4.6)},-25 h9.2 M${f(ax - 5.2)},-20 h10.4" stroke="${P.cream}" stroke-width="1.1" opacity="0.55"/><rect x="${f(ax - 13.5)}" y="-3" width="27" height="3" rx="1.5" fill="${mix(bt, P.haze, 0.7)}"/>`);
  }
  // the seam under the waistband, the fly (a centre seam, with its line of stitching curving in to meet it on the
  // wearer's left), and a crease either side where the cloth pulls at the fork
  s.push(`<path d="M${f(-B(39.6))},-263.4 H${f(B(39.6))}" stroke="${pants.sh}" stroke-width="1" opacity="0.7"/><path d="M0,-263.4 V-235" stroke="${pants.sh}" stroke-width="1.4"/><path d="M6.4,-263.4 V-249 Q6.4,-239 0.5,-235.4" fill="none" stroke="${pants.sh}" stroke-width="1" opacity="0.75"/><path d="M-3,-231.6 q-4.6,1.8 -7.4,6.6 M3,-231.6 q4.6,1.8 7.4,6.6" fill="none" stroke="${pants.sh}" stroke-width="1" stroke-linecap="round" opacity="0.45"/>`);
  // ---- torso. The shoulders slope away from the neck and round over into the arms.
  const hem = uni ? -266 : kind === 'vest' ? -230 : robe ? -124 : sweater ? -232 : -226, skirt = robe ? B(46) : B(42.5);
  const side = k => `C${f(k * B(50))},-348 ${f(k * B(45))},-316 ${f(k * B(41))},-292 L${f(k * B(40.5))},-272` + (uni || robe ? '' : ` L${f(k * skirt)},${hem + 14}`) + ` L${f(k * (uni ? B(40.5) : skirt))},${hem}`;
  const torso = `M${f(-B(48))},-372 C${f(-B(48))},-382 ${f(-B(44))},-388 ${f(-B(38))},-391 L-13,-406 L13,-406 L${f(B(38))},-391 C${f(B(44))},-388 ${f(B(48))},-382 ${f(B(48))},-372 ${side(1)}`
    + ` L${f(-(uni ? B(40.5) : skirt))},${hem}` + (uni || robe ? '' : ` L${f(-skirt)},${hem + 14}`) + ` L${f(-B(40.5))},-272 L${f(-B(41))},-292 C${f(-B(45))},-316 ${f(-B(50))},-348 ${f(-B(48))},-372Z`;
  const tc = clip(torso);
  s.push(part(torso, top.lit, top.sh, 3, lx));
  s.push(softShade(torso, -lx * B(54), lx * B(10), -410, hem + 2, top.sh, 0.22));
  if (uni) {
    const hi = mix(top.lit, '#FFFFFF', 0.16);
    s.push(`<rect x="-4.5" y="-398" width="9" height="${f(398 + hem)}" fill="${hi}"/><path d="M-4.5,-398 V${hem} M4.5,-398 V${hem}" stroke="${top.sh}" stroke-width="0.9" opacity="0.7"/>`);
    s.push([-374, -349, -324, -299, -279].map(y => `<circle cx="0" cy="${y}" r="1.7" fill="${top.sh}"/>`).join(''));
    for (const k of [-1, 1]) {
      const x0 = k > 0 ? B(9) : -B(9) - 20;
      s.push(`<path d="M${f(x0)},-352 v20 h20 v-20" fill="none" stroke="${top.sh}" stroke-width="1.2"/><path d="M${f(x0 - 0.6)},-358 h21.2 v6 l-10.6,5 l-10.6,-5Z" fill="${top.sh}" opacity="0.75"/><circle cx="${f(x0 + 10)}" cy="-351" r="1.3" fill="${top.lit}"/>`);
    }
    s.push(`<path d="M${f(B(13.5))},-381 h11 v6.4 q0,5.6 -5.5,8 q-5.5,-2.4 -5.5,-8Z" fill="${gold}"/><path d="M${f(B(19))},-381 h5.5 v6.4 q0,5.6 -5.5,8Z" fill="${goldSh}"/><rect x="${f(-B(27))}" y="-374" width="16" height="4.6" rx="1" fill="${gold}"/><path d="M${f(-B(27) + 2)},-371.7 h12" stroke="${goldSh}" stroke-width="1"/>`);
    // belt
    // It goes right round: it is as wide as the whole waist, including the edge of the shirt that the light picks out
    // on one side. Loops of the trouser cloth hold it, and past the buckle its end runs through a keeper.
    { const x0 = -B(40.5) + Math.min(0, 3 * lx) - 0.6, x1 = B(40.5) + Math.max(0, 3 * lx) + 0.6, sheen = mix(dark, '#FFFFFF', 0.2), loop = mix(pants.lit, pants.sh, 0.3);
      s.push(`<rect x="${f(x0)}" y="-278" width="${f(x1 - x0)}" height="12.5" fill="${dark}"/><path d="M${f(x0)},-277.4 H${f(x1)}" stroke="${sheen}" stroke-width="0.9"/>${[-31, -15, 15, 31].map(x => `<rect x="${f(B(x) - 1.6)}" y="-279.4" width="3.2" height="15.6" rx="0.8" fill="${loop}"/>`).join('')}<rect x="10.6" y="-279" width="2.6" height="14.5" rx="0.8" fill="${sheen}"/><path d="M21.4,-276.4 q3.2,4.7 0,9.4" fill="none" stroke="${sheen}" stroke-width="1"/><rect x="-8" y="-280" width="16" height="16.5" rx="2.2" fill="${gold}"/><rect x="-4.4" y="-276.4" width="8.8" height="9.3" rx="1" fill="${dark}"/><path d="M-4.4,-271.8 h6.4" stroke="${gold}" stroke-width="1.6"/>`); }
    if (sp.radio) s.push(`<rect x="${f(-B(38))}" y="-296" width="11" height="24" rx="2.2" fill="${dark}"/><path d="M${f(-B(38) + 2.4)},-296 v-21" stroke="${dark}" stroke-width="2" stroke-linecap="round"/><rect x="${f(-B(38) + 2.2)}" y="-291" width="6.6" height="5" rx="1" fill="${P.haze}"/><circle cx="${f(-B(38) + 8)}" cy="-280" r="1.2" fill="${P.coral}"/>`);
    if (sp.tape) s.push(`<rect x="${f(B(22))}" y="-279" width="13" height="13" rx="2.6" fill="${P.coral}"/><rect x="${f(B(22))}" y="-279" width="13" height="4.4" rx="2.2" fill="${P.coralSh}"/><circle cx="${f(B(28.5))}" cy="-271" r="2.6" fill="${P.cream}"/><rect x="${f(B(34))}" y="-270" width="5" height="2.6" fill="${gold}"/>`);
    if (sp.gloves) { const g = mix('#F2B441', P.peach, 0.45), gs = mix('#C98E2B', P.plum, 0.3), gd = 'M-7,-4 L-8.4,17 C-8.6,23 -5,26 -1.2,24.4 L0.6,9 L2.6,23.6 C5.4,25.8 9.4,23 9.2,17.6 L8,-4Z'; s.push(`<g transform="translate(${f(-B(26))},-266)"><path d="${gd}" fill="${gs}"/><path d="${gd}" fill="${g}" transform="translate(${1.6 * lx},0)" clip-path="url(#${clip(gd)})"/><rect x="-8" y="-5" width="17" height="6" rx="1.4" fill="${gs}"/></g>`); }
  } else if (robe) {
    // a dressing gown: the left front wrapped over the right and held by a sash, a shawl collar down both edges of the
    // opening with whatever is worn underneath showing between them, one patch pocket, and a deep hem
    const inner = sp.collar || P.cream, edge = mix(top.lit, '#FFFFFF', 0.14);
    s.push(`<path d="M-15,-410 L15,-410 L7,-300Z" fill="${inner}"/><path d="M-9,-398 Q0,-388 9,-398" fill="none" stroke="${mix(inner, dark, 0.3)}" stroke-width="1.2"/>`);
    s.push(`<path d="M7,-300 L9,-276 L11,${hem}" fill="none" stroke="${top.sh}" stroke-width="1.6"/>`);
    s.push(`<path d="M17.4,-416 C24,-406 27,-392 23,-372 L15,-280 L6,-280 L11,-374 C13,-390 13,-402 10,-412Z" fill="${top.sh}"/><path d="M-17.4,-416 C-24,-406 -27,-392 -24,-372 L7,-280 L17,-280 L-12,-374 C-14,-390 -13,-402 -10,-412Z" fill="${edge}"/><path d="M-24,-372 L7,-280" stroke="${top.sh}" stroke-width="1" opacity="0.6" fill="none"/>`);
    s.push(`<g clip-path="url(#${tc})"><rect x="-70" y="-286" width="140" height="13" fill="${top.sh}"/><path d="M-70,-285.4 H70" stroke="${edge}" stroke-width="0.9" opacity="0.6"/></g><path d="M4,-286 h12 v13 h-12Z" fill="${mix(top.sh, dark, 0.3)}"/><path d="M6,-274 L2,-232 L9,-231 L11,-274Z M13,-274 L17,-240 L23,-242 L17,-274Z" fill="${top.sh}"/>`);
    s.push(`<path d="M${f(B(14))},-236 h22 v30 h-22Z" fill="none" stroke="${top.sh}" stroke-width="1.5"/><path d="M${f(B(14))},-229 h22" stroke="${top.sh}" stroke-width="1.5"/><g clip-path="url(#${tc})"><rect x="-70" y="${hem - 9}" width="140" height="9" fill="${top.sh}" opacity="0.7"/></g>`);
  } else if (sweater) {
    // a pullover: ribbing at the hem, and two soft folds where it hangs from the chest
    s.push(`<g clip-path="url(#${tc})"><rect x="-70" y="${hem - 11}" width="140" height="11" fill="${top.sh}"/><path d="${[-36, -27, -18, -9, 0, 9, 18, 27, 36].map(x => `M${f(B(x))},${hem - 10} v10`).join(' ')}" stroke="${top.lit}" stroke-width="1" opacity="0.4"/></g><path d="M${f(-B(26))},-330 Q${f(-B(20))},-300 ${f(-B(27))},-262 M${f(B(27))},-322 Q${f(B(21))},-296 ${f(B(26))},-270" fill="none" stroke="${top.sh}" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>`);
  } else {
    if (sp.stripe) s.push(`<g clip-path="url(#${tc})"><rect x="-70" y="-348" width="140" height="15" fill="${P.coral}"/><rect x="-70" y="-333" width="140" height="5" fill="${P.cream}"/></g>`);
    if (kind === 'vest') s.push(`<g clip-path="url(#${tc})" stroke="${top.sh}" stroke-width="1.7" opacity="0.9"><path d="M-70,-366 H70 M-70,-342 H70 M-70,-318 H70 M-70,-294 H70 M-70,-270 H70 M-70,-246 H70"/></g>`);
    const zipTop = lifevest ? -374 : -400;                                      // a life vest's zip starts below its scooped neck
    s.push(`<path d="M${lx},${zipTop} V${hem}" stroke="${P.cream}" stroke-width="1.8" opacity="0.85"/><rect x="${lx - 2.2}" y="${zipTop + 4}" width="4.4" height="8" rx="1.2" fill="${P.cream}"/>`);
    if (kind === 'jacket') s.push(`<rect x="${f(-B(42.5))}" y="${hem - 10}" width="${f(B(85))}" height="10" fill="${top.sh}"/><path d="M${f(-B(33))},-288 L${f(-B(24))},-258 M${f(B(33))},-288 L${f(B(24))},-258" stroke="${top.sh}" stroke-width="2"/><path d="M${f(B(12))},-364 h18" stroke="${top.sh}" stroke-width="1.8"/>`);
    // a life vest: two bands of webbing right round it, each closed with a buckle beside the zip
    if (sp.straps) s.push(`<g clip-path="url(#${tc})">${[-352, -300].map(y => `<rect x="-70" y="${y}" width="140" height="9" fill="${dark}"/><path d="M-70,${y + 0.6} H70" stroke="${mix(dark, '#FFFFFF', 0.22)}" stroke-width="0.8"/>`).join('')}</g>${[-352, -300].map(y => `<rect x="${f(lx - 9)}" y="${y - 2}" width="18" height="13" rx="2" fill="${mix(dark, '#FFFFFF', 0.3)}"/><rect x="${f(lx - 5)}" y="${y + 1.4}" width="10" height="6.2" rx="1" fill="${dark}"/>`).join('')}`);
  }
  if (sp.tag && !uni) s.push(`<rect x="${f(B(13))}" y="-362" width="20" height="9" rx="1.6" fill="${P.cream}"/><path d="M${f(B(13) + 3)},-357.5 h11" stroke="${mix(P.cream, dark, 0.55)}" stroke-width="1.5"/>`);
  // ---- neck and collar. The collar is one piece that goes right round the neck. Its back half stands up behind the
  // neck, where we look at the inside of it, so that part is drawn first and the neck goes on in front of it. Its
  // two leaves fold down over the chest and lie on top of whatever else is worn there, so they are held back and
  // drawn after the vest, the arms and the shoulder straps (see "the collar leaves" below). Each leaf starts exactly
  // where the band behind the neck ends, which is what joins them into one collar.
  const colW = uni ? 19.4 : 20.6, colY = uni ? -415 : -415.6;                     // where the collar comes round the side of the neck
  const leaf = k => uni
    ? `M${f(k * colW)},${colY} L${f(k * 1.6)},-402 L${f(k * 8)},-385.6 L${f(k * 24.4)},-397.4 Q${f(k * 24.8)},-408 ${f(k * colW)},${colY}Z`
    : `M${f(k * colW)},${colY} C${f(k * 14)},-410.6 ${f(k * 8)},-406.6 ${f(k * 3)},-396 L${f(k * 22)},-394 Q${f(k * 23.6)},-406 ${f(k * colW)},${colY}Z`;
  if (!robe && !sweater && !lifevest) s.push(`<path d="M${-colW},${colY} C-13,${colY - 6.4} 13,${colY - 6.4} ${colW},${colY} L16,-405 L-16,-405Z" fill="${mix(top.sh, dark, 0.3)}"/>`);
  s.push(`<path d="M-10.5,-432 L-11.9,-402.4 L11.9,-402.4 L10.5,-432Z" fill="${skin}"/><path d="M-10.5,-430 C-4,-420 4,-420 10.5,-430 L11.4,-408 C4,-403 -4,-403 -11.4,-408Z" fill="${skinSh}"/>`);
  // what shows inside the open collar: the neck of an undershirt under the uniform, a shirt under a vest or jacket
  if (robe) { /* the gown's own opening shows what is under it */ }
  else if (sweater) s.push(`<path d="M-17.6,-409 C-9,-398 9,-398 17.6,-409 L15,-414.6 C8,-405.4 -8,-405.4 -15,-414.6Z" fill="${top.sh}"/><path d="M-11,-405.4 v4 M-5.6,-402.8 v4 M0,-402 v4 M5.6,-402.8 v4 M11,-405.4 v4" stroke="${top.lit}" stroke-width="1" opacity="0.4"/>`);
  else if (sp.neck === 'roll') {
    // a roll-neck: ribbed, folded over, standing up round the throat as far as the jaw
    const rc = sp.collar || P.cream, rs = mix(rc, P.plum, 0.3), roll = 'M-13.6,-398 L-12.4,-424.6 C-6,-420 6,-420 12.4,-424.6 L13.6,-398Z';
    s.push(part(roll, rc, rs, 1.8, lx) + `<path d="M-8.4,-421.4 V-399 M-4.2,-420.4 V-399 M0,-420 V-399 M4.2,-420.4 V-399 M8.4,-421.4 V-399" stroke="${rs}" stroke-width="1" opacity="0.6" fill="none"/><path d="M-12.4,-424.6 C-6,-420 6,-420 12.4,-424.6" fill="none" stroke="${rs}" stroke-width="1.2"/>`);
  }
  else if (uni) s.push(`<path d="M-11,-412 Q0,-402.6 11,-412 L12,-402 L0,-400.8 L-12,-402Z" fill="${P.cream}"/><path d="M-10.4,-409.8 Q0,-400.8 10.4,-409.8" fill="none" stroke="${P.creamSh}" stroke-width="1.1" opacity="0.8"/>`);
  else if (lifevest) {
    // a life vest has no collar. Its neck is a scoop bound with tape, and in the scoop is whatever is worn under it,
    // which comes up round the base of the neck
    const scoop = 'M-21.5,-401 C-18,-385 -9,-375.6 0,-375.6 C9,-375.6 18,-385 21.5,-401 L13,-406 Q0,-399.4 -13,-406Z';
    s.push(`<path d="${scoop}" fill="${sleeve.sh}"/><path d="${scoop}" fill="${sleeve.lit}" transform="translate(${1.8 * lx},0)" clip-path="url(#${clip(scoop)})"/><path d="M-13,-406 Q0,-399.4 13,-406" fill="none" stroke="${sleeve.sh}" stroke-width="2.4" stroke-linecap="round"/><path d="M-21.5,-401 C-18,-385 -9,-375.6 0,-375.6 C9,-375.6 18,-385 21.5,-401" fill="none" stroke="${top.sh}" stroke-width="2.4" stroke-linecap="round"/>`);
  }
  else if (kind === 'vest') s.push(`<path d="M-15,-408 C-8,-400 8,-400 15,-408 L16,-398 L-16,-398Z" fill="${sleeve.lit}"/>`);
  else s.push(`<path d="M-14,-409 C-7,-401 7,-401 14,-409 L15,-398 L-15,-398Z" fill="${sp.collar || P.cream}"/>`);
  // ---- a work vest over the shirt: two panels, open down the front
  if (sp.over) {
    const v = sp.over, panel = k => `M${f(k * B(40))},-390 L${f(k * 15)},-404.5 C${f(k * 9)},-392 ${f(k * 7.5)},-380 ${f(k * 7.5)},-366 L${f(k * 9)},${hem - 14} L${f(k * B(41))},${hem - 14} L${f(k * B(41.5))},-292 C${f(k * B(45))},-316 ${f(k * B(49))},-348 ${f(k * B(47))},-374 C${f(k * B(46.5))},-382 ${f(k * B(43.5))},-388 ${f(k * B(40))},-390Z`;
    for (const k of [-1, 1]) {
      s.push(part(panel(k), v.lit, v.sh, 2.4, lx));
      s.push(`<path d="M${f(k * 7.5)},-366 L${f(k * 9)},${hem - 14}" stroke="${v.sh}" stroke-width="1.6"/><rect x="${f(k > 0 ? B(13) : -B(13) - 19)}" y="-356" width="19" height="17" rx="1.6" fill="none" stroke="${v.sh}" stroke-width="1.4"/><path d="M${f(k > 0 ? B(13) : -B(13) - 19)},-350 h19" stroke="${v.sh}" stroke-width="1.4"/><rect x="${f(k > 0 ? B(11) : -B(11) - 24)}" y="-318" width="24" height="24" rx="2" fill="none" stroke="${v.sh}" stroke-width="1.4"/><path d="M${f(k > 0 ? B(11) : -B(11) - 24)},-311 h24" stroke="${v.sh}" stroke-width="1.4"/>`);
    }
    s.push(`<path d="M${f(B(15))},-380 h9 v5.4 q0,4.6 -4.5,6.6 q-4.5,-2 -4.5,-6.6Z" fill="${gold}"/>`);
  }
  // ---- an apron: a bib held by a strap round the neck, tied at the waist, the skirt of it down over the thighs
  if (sp.apron) {
    const a = sp.apron, bib = `M${f(-B(21))},-374 L${f(B(21))},-374 L${f(B(27))},-282 L${f(-B(27))},-282Z`, sk = `M${f(-B(41.5))},-284 L${f(B(41.5))},-284 L${f(B(40))},-146 L${f(-B(40))},-146Z`;
    s.push(`<path d="M${f(-B(20))},-373 L-12,-407 M${f(B(20))},-373 L12,-407" stroke="${a.sh}" stroke-width="3" fill="none"/>` + part(sk, a.lit, a.sh, 2.6, lx) + part(bib, a.lit, a.sh, 2.2, lx));
    s.push(`<path d="M${f(-B(41.5))},-283 H${f(B(41.5))}" stroke="${a.sh}" stroke-width="3.4"/><path d="M${f(-B(17))},-250 h${f(B(34))} v30 h${f(-B(34))}Z M0,-250 v30" fill="none" stroke="${a.sh}" stroke-width="1.5"/><path d="M${f(-B(21))},-374 H${f(B(21))}" stroke="${a.sh}" stroke-width="1.6"/><path d="M${f(B(22))},-200 Q${f(B(26))},-176 ${f(B(22))},-150" fill="none" stroke="${a.sh}" stroke-width="1.4" opacity="0.6"/>`);
  }
  // ---- arms. Each goes on over the torso: a line of shade where it lies against the body, the hand, then the sleeve
  // with its cuff over the wrist, then the shoulder patch, which faces sideways and so shows only its front half.
  const rs = B(12.6), re = B(11), rw = B(9.6), HS = 1.08 * Math.min(1.08, Math.max(0.94, build));
  const rolled = sp.sleeves === 'rolled', pose = sp.pose || 'sides', mid = [];                    // mid: things held, drawn between the arms and the hands
  const joint = k => [k * B(47.5), -376];
  const arm = (k, E, Wr, { kindOfHand = 'rest', dir = null } = {}) => {
    const S = joint(k), sl = sleeveOf(S, E, Wr, rs, re, rw, sleeve, lx, { rolled }), d2 = dir || unit(E, Wr);
    const bare = rolled ? sl.stub + ' ' + capsule(E, re - 0.6, Wr, 7.2 * HS) : '';
    let out = `<path d="${rolled ? sl.d + ' ' + bare : capsule(S, rs, E, re) + ' ' + capsule(E, re, Wr, rw)}" fill="${top.sh}" opacity="0.55" transform="translate(${f(-k * 2.4)},1.6)" clip-path="url(#${tc})"/>`;
    if (rolled) {
      // the bare arm is one shape (elbow, forearm, wrist, hand) and is shaded as one, so nothing shows where its parts meet
      const skinD = bare, h = handBits(Wr, d2, k, kindOfHand, HS), sx = lx * 1.8;
      out += `<path d="${skinD}" fill="${skinSh}"/><path d="${h.d}" fill="${skinSh}" ${h.at(0)}/><path d="${skinD}" fill="${skin}" transform="translate(${sx},0)"/><path d="${h.d}" fill="${skin}" ${h.at(sx)}/><path d="${h.ln}" fill="none" stroke="${skinSh}" stroke-width="1.2" stroke-linecap="round" ${h.at(sx * 0.5)}/>` + sl.svg;
    } else out += hand(Wr, d2, k, kindOfHand, skin, skinSh, lx, HS) + sl.svg;      // the cuff lies over the heel of the hand
    if (uni) {
      const c = along(S, E, 0.36), ux = unit(S, E), rr = rs + (re - rs) * 0.36, cx = c[0] + k * rr * ux[1] * (ux[1] > 0 ? 1 : -1), cy = c[1] - k * rr * ux[0] * (ux[1] > 0 ? 1 : -1);
      const rot = -Math.atan2(ux[0], ux[1]) * 180 / Math.PI, shift = k * lx > 0 ? lx * 2.4 : 0;
      out += `<g transform="translate(${shift},0)" clip-path="url(#${clip(sl.d)})"><g transform="translate(${f(cx)},${f(cy)}) rotate(${f(rot)}) scale(0.62,1)"><path d="M-11,-12 H11 V1 C11,9 5,13.6 0,16 C-5,13.6 -11,9 -11,1Z" fill="${P.cream}"/><path d="M-8.6,-9.6 H8.6 V0.6 C8.6,7 4,10.8 0,12.8 C-4,10.8 -8.6,7 -8.6,0.6Z" fill="${P.teal}"/><path d="M-7,5 L-2.6,-3 L0.2,1.4 L3,-2 L7,5Z" fill="${P.cream}"/><circle cx="${f(-k * 4.6)}" cy="-5.4" r="1.7" fill="${gold}"/></g></g>`;
    }
    return out;
  };
  const arms = [];
  // Anything held is drawn first and the whole arm after it, so the hand closes over it.
  if (pose === 'clasp') {
    // forearms come together below the belt; the far hand lies under the near one
    arms.push(arm(-1, [-B(57), -306], [-B(11), -263], { dir: [0.92, 0.4] }), arm(1, [B(57), -306], [B(11), -263], { dir: [-0.92, 0.4] }));
  } else if (pose === 'mug') {
    // one hand on the hip with the elbow out; the other holds a mug in front of the stomach, forearm level
    const E = [-B(57), -302], Wr = [-B(16), -310], d = unit(E, Wr);
    const mx = Wr[0] + d[0] * 10 + 21, my = Wr[1] + d[1] * 10 - 2, enamel = '#FFF8EA', body = `M${f(mx - 10)},${f(my - 12)} h20 l-1.3,20.6 q-0.2,3.4 -3.6,3.4 h-10.2 q-3.4,0 -3.6,-3.4Z`;
    const mug = `<path d="M${f(mx - 10.4)},${f(my + 3)} a7.6,7.6 0 1 0 0,-0.1" fill="none" stroke="${enamel}" stroke-width="3.4"/><path d="${body}" fill="${mix(enamel, P.haze, 0.34)}"/><path d="${body}" fill="${enamel}" transform="translate(${2 * lx},0)" clip-path="url(#${clip(body)})"/><path d="M${f(mx - 10.6)},${f(my - 12)} h21.2" stroke="${P.tealDeep}" stroke-width="2.6" stroke-linecap="round"/><path d="M${f(mx - 3.4)},${f(my - 3.6)} l3.4,5 l3.4,-5" fill="none" stroke="${P.coral}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>`;
    arms.push(arm(1, [B(80), -318], [B(47), -287], { dir: [-0.86, 0.5] }), mug + arm(-1, E, Wr, { kindOfHand: 'fist' }));
  } else if (pose === 'board') {
    // a clipboard hugged to the body: the forearm lies across it and the hand wraps its inner edge
    const bx = B(16), by = -327, wood = mix(P.plum, P.peach, 0.3);
    const board = `<g transform="translate(${f(bx)},${by}) rotate(-5)"><rect x="-22" y="-29" width="44" height="58" rx="2.6" fill="${P.plumDeep}"/><rect x="-22" y="-29" width="44" height="58" rx="2.6" fill="${wood}" transform="translate(${1.8 * lx},0)" clip-path="url(#${clip('M-22,-29 h44 v58 h-44Z')})"/><rect x="-18" y="-22" width="36" height="46" fill="#FFF8EA"/><path d="M-14,-13 h20 M-14,-6.6 h27 M-14,-0.2 h24 M-14,6.2 h27 M-14,12.6 h16" stroke="${P.haze}" stroke-width="1.6" stroke-linecap="round"/><path d="M-14,18.4 l2.2,2.4 l4,-5" fill="none" stroke="${P.coral}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><rect x="-9" y="-33" width="18" height="9" rx="2" fill="${mix(P.haze, P.cream, 0.5)}"/><rect x="-5" y="-35.4" width="10" height="4.6" rx="2.3" fill="${P.plumDeep}"/></g>`;
    arms.push(arm(-1, [-B(54), -306], [-B(46), -242]), board + arm(1, [B(57), -305], [B(4), -313], { kindOfHand: 'fist' }));
  } else arms.push(arm(-1, [-B(54), -306], [-B(46), -242]), arm(1, [B(54), -306], [B(46), -242]));
  // the handset hangs below the shoulder strap, far enough out that the collar leaf does not lie across it
  const mx = -B(27) - 6;
  if (sp.radio && uni) s.push(`<path d="M${f(mx + 5)},-378 c-6,8 4,12 -2,20 c-6,8 4,12 -2,20 c-6,8 3,12 -2,20 c-4,6 -1,11 -1.6,17" fill="none" stroke="${dark}" stroke-width="1.5" stroke-linecap="round"/>`);
  s.push(arms.join(''));
  if (sp.radio && uni) s.push(`<rect x="${f(mx)}" y="-390.6" width="10" height="14" rx="2.4" fill="${dark}"/><path d="M${f(mx + 2.4)},-386.6 h5.2 M${f(mx + 2.4)},-384 h5.2 M${f(mx + 2.4)},-381.4 h5.2" stroke="${P.haze}" stroke-width="1"/>`);
  // shoulder straps, over everything on the shoulder
  // (their inner ends run in under the collar leaves, so the button sits a little way out along the strap)
  if (uni && !sp.over) for (const k of [-1, 1]) s.push(`<path d="M${f(k * 20.5)},-401.6 L${f(k * B(39.5))},-391.2 L${f(k * B(39.5))},-385.4 L${f(k * 20.5)},-395.8Z" fill="${top.sh}" opacity="0.55"/><circle cx="${f(k * 29)}" cy="${f(-398.7 + 8.5 / (B(39.5) - 20.5) * 10.4)}" r="1.4" fill="${top.lit}"/>`);
  // ---- the collar leaves, over everything else that is worn. The leaf toward the light is a touch brighter than the
  // cloth it lies on and the other is in shade; each lays a thin shadow on the chest below it, so it reads as lying
  // on top. Pins go on last.
  {
    const leafHi = sp.leaf ? sp.leaf.lit : mix(top.lit, '#FFFFFF', 0.16), leafSh = sp.leaf ? sp.leaf.sh : top.sh;
    if (!robe && !sweater && !lifevest) for (const k of [-1, 1]) {
      const lit = k * lx > 0;
      s.push(`<path d="${leaf(k)}" fill="${dark}" opacity="0.22" transform="translate(${f(-lx * 1.2)},2.2)" clip-path="url(#${tc})"/><path d="${leaf(k)}" fill="${lit ? leafHi : leafSh}"/>`);
      if (uni) s.push(`<path d="M${f(k * 1.6)},-402 L${f(k * 8)},-385.6" stroke="${top.sh}" stroke-width="0.9" opacity="${lit ? 0.7 : 0}"/>`);
    }
    if (uni && sp.pins) s.push(`<circle cx="-15.8" cy="-399.8" r="2" fill="${gold}"/><circle cx="15.8" cy="-399.8" r="2" fill="${gold}"/>`);
  }
  // ---- head
  const head = 'M0,-484 C17,-484 27,-471 27,-455 C27,-440 20,-424 0,-421 C-20,-424 -27,-440 -27,-455 C-27,-471 -17,-484 0,-484Z';
  const hc = clip(head);
  const ears = `<ellipse cx="-27.8" cy="-450" rx="4.5" ry="6.9" fill="${skinSh}"/><ellipse cx="27.8" cy="-450" rx="4.5" ry="6.9" fill="${skinSh}"/><ellipse cx="${f(-27.8 + lx * 0.9)}" cy="-450" rx="3.1" ry="5.3" fill="${skin}"/><ellipse cx="${f(27.8 + lx * 0.9)}" cy="-450" rx="3.1" ry="5.3" fill="${skin}"/>` + (sp.earrings ? `<circle cx="-28.4" cy="-442.6" r="1.9" fill="${gold}"/><circle cx="28.4" cy="-442.6" r="1.9" fill="${gold}"/>` : '');
  s.push(part(head, skin, skinSh, 2.2, lx));
  if (hat) s.push(`<path d="M-32,-490 H32 V-464 C16,-460 -16,-460 -32,-464Z" fill="${skinSh}" opacity="0.6" clip-path="url(#${hc})"/>`);
  if (sp.beard) {
    const bd = 'M-30.6,-463 C-31.4,-444 -26,-426 -13,-417.4 C-5,-412.6 5,-412.6 13,-417.4 C26,-426 31.4,-444 30.6,-463 C28,-452 24,-445 18.6,-441.2 C13.4,-438 7,-438.6 3.5,-440.2 L0,-441 L-3.5,-440.2 C-7,-438.6 -13.4,-438 -18.6,-441.2 C-24,-445 -28,-452 -30.6,-463Z';
    s.push(`<path d="${bd}" fill="${hairSh}"/><path d="${bd}" fill="${hair}" transform="translate(${1.6 * lx},0)" clip-path="url(#${clip(bd)})"/><ellipse cx="0" cy="-431.6" rx="5.4" ry="2" fill="${lip}"/>`);
  }
  s.push(`<g transform="translate(0,${-(sp.tilt || 0)})">`);
  const gz = sp.gaze || [0, 0];
  if (sp.whites) s.push(`<g fill="#E4E8E2"><ellipse cx="-9.5" cy="-453" rx="4" ry="2.9"/><ellipse cx="9.5" cy="-453" rx="4" ry="2.9"/></g>`);
  s.push(`<g class="eye" data-r="1.6" transform="translate(${gz[0]},${gz[1]})"><circle cx="-9.5" cy="-453" r="${sp.whites ? 1.9 : 2.5}" fill="${dark}"/><circle cx="9.5" cy="-453" r="${sp.whites ? 1.9 : 2.5}" fill="${dark}"/></g>`);
  const by = sp.whites ? -2.4 : 0;
  s.push(`<g fill="${brow}" transform="translate(0,${by})"><path d="M-16,-459.2 C-12.6,-463 -7.4,-463.4 -3.4,-461 L-3.6,-458.4 C-7.4,-460.2 -12.4,-460 -15.6,-457.2Z"/><path d="M16,-459.2 C12.6,-463 7.4,-463.4 3.4,-461 L3.6,-458.4 C7.4,-460.2 12.4,-460 15.6,-457.2Z"/></g>`);
  s.push(`<path d="M${lx * 0.6},-452 C${lx * 1.6},-447 ${lx * 3.4},-444 ${lx * 4.2},-441.4 C${lx * 2.6},-440 ${lx * 0.2},-440 ${-lx * 2},-441.2 C${-lx * 0.6},-442 ${lx * 0.4},-443.2 ${lx * 0.5},-445Z" fill="${skinSh}" transform="scale(-1,1)"/>`);
  if (!sp.beard) s.push(`<circle cx="-15" cy="-441" r="5" fill="${P.coral}" opacity="0.18"/><circle cx="15" cy="-441" r="5" fill="${P.coral}" opacity="0.18"/>`);
  if (sp.glasses) s.push(`<g fill="none" stroke="${sp.glasses}" stroke-width="1.5"><circle cx="-9.8" cy="-452.6" r="7.2"/><circle cx="9.8" cy="-452.6" r="7.2"/><path d="M-2.6,-453.4 Q0,-455.4 2.6,-453.4 M-17,-453.4 L-27,-455.4 M17,-453.4 L27,-455.4"/></g><path d="M-14.4,-456.6 l3,-2.6 M5.2,-456.6 l3,-2.6" stroke="#FFFFFF" stroke-width="1" opacity="0.4" stroke-linecap="round"/>`);
  const smile = `<path d="M-6.2,-434.4 q6.2,4.4 12.4,0" stroke="${sp.beard ? dark : lip}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  const flat = `<path d="M-5.2,-433.4 h10.4" stroke="${sp.beard ? dark : lip}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  if (sp.mouth === 'flat') s.push(flat);
  else s.push(until(sp.smileUntil ?? 2, smile) + from((sp.smileUntil ?? 2) + 1, flat));
  s.push('</g>');
  // ---- hair and headwear. Hair is drawn a little wider than the skull so no skin shows outside it; ears go on after
  // short hair and are covered by long hair.
  if (h === 'bob') s.push(`<path d="M-33,-420 C-37,-446 -35,-470 -22,-482 C-10,-493 12,-493 23,-482 C36,-470 37,-446 33,-420 C28,-414 22,-416 21,-424 C24,-440 22,-456 14,-464 C2,-470 -12,-468 -18,-460 C-23,-450 -24,-438 -21,-424 C-22,-416 -28,-414 -33,-420Z" fill="${hair}"/><path d="M-22,-474 C-12,-486 8,-487 20,-478" stroke="${hairHi}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`);
  if (h === 'short') s.push(`<path d="M-31,-447 C-35,-476 -17,-493.6 1,-493.6 C19,-493.6 35,-478 31,-447 L26.4,-460 C23,-470 15,-476 3,-477 C-10,-477 -21,-471 -26.4,-460Z" fill="${hair}"/><path d="M-16,-484 C-8,-490 8,-490 17,-484" stroke="${hairHi}" stroke-width="2.2" fill="none" stroke-linecap="round"/>` + ears);
  if (h === 'long') s.push(`<path d="M-34,-390 C-39,-430 -37,-472 -22,-484.6 C-10,-494.6 12,-494.6 23,-484.6 C38,-472 39,-430 34,-390 L22,-394 C26,-426 24,-456 14,-466 C2,-472 -12,-470 -18,-462 C-25,-452 -26,-426 -22,-394Z" fill="${hair}"/><path d="M-4,-490 C-14,-486 -22,-476 -24,-462 M-31,-440 C-32,-424 -31,-408 -29,-396" stroke="${hairHi}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`);
  if (h === 'bun') s.push(`<circle cx="0" cy="-497" r="11" fill="${hair}"/><path d="M-31,-449 C-34,-476 -15,-491.6 0,-491.6 C15,-491.6 34,-476 31,-449 C25,-466 14,-473 0,-473 C-14,-473 -25,-466 -31,-449Z" fill="${hair}"/>` + ears);
  const bn = sp.beanie || { lit: P.coral, sh: P.coralSh, band: P.cream }, bnRib = sp.beanie ? mix(bn.band, dark, 0.3) : P.creamSh;
  if (h === 'beanie') s.push(ears + part('M-30.6,-462 C-32.6,-487 -14,-499 0,-499 C14,-499 32.6,-487 30.6,-462Z', bn.lit, bn.sh, 2.2, lx) + `<rect x="-32.4" y="-471" width="64.8" height="12" rx="3.5" fill="${bn.band}"/><path d="M-21,-471V-459 M-10.5,-471V-459 M0,-471V-459 M10.5,-471V-459 M21,-471V-459" stroke="${bnRib}" stroke-width="1.2"/><path d="M-31,-459 C-31.6,-452 -30,-446 -27.6,-442 L-24.6,-459Z M31,-459 C31.6,-452 30,-446 27.6,-442 L24.6,-459Z" fill="${hair}"/>`);
  if (hat) {
    if (long) {
      // loose hair from under the hat, down in front of the ears to the collarbone
      const lock = k => `M${k * 32.4},-472 L${k * 19.6},-472 C${k * 23.4},-460 ${k * 24.6},-446 ${k * 23.4},-432 C${k * 22.4},-420 ${k * 24.4},-408 ${k * 28.6},-396 C${k * 31.6},-387 ${k * 37},-382 ${k * 41.4},-385 C${k * 38.6},-398 ${k * 39},-412 ${k * 39.4},-426 C${k * 39.8},-444 ${k * 36.4},-460 ${k * 32.4},-472Z`;
      s.push(`<path d="${lock(-1)} ${lock(1)}" fill="${hairSh}"/><path d="${lock(-1)} ${lock(1)}" fill="${hair}" transform="translate(${1.8 * lx},0)" clip-path="url(#${clip(lock(-1) + ' ' + lock(1))})"/><path d="M-33,-452 C-36,-434 -35,-414 -33,-398 M-28,-440 C-30,-424 -30,-410 -31.6,-398 M33,-452 C36,-434 35,-414 33,-398 M28,-440 C30,-424 30,-410 31.6,-398" stroke="${hairHi}" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.8"/>`);
    } else s.push(`<path d="M-32,-474 L-19,-474 C-21.6,-465 -22.6,-456 -21.6,-449 L-25.6,-446.4 C-30,-451 -32,-461 -32,-474Z M32,-474 L19,-474 C21.6,-465 22.6,-456 21.6,-449 L25.6,-446.4 C30,-451 32,-461 32,-474Z" fill="${hair}"/>` + ears);
    s.push(`<g transform="translate(0,-474)">${hatShape(sp.hatCol || P.haze, sp.hatSh || P.plumDeep, sp.hatBand || P.plumDeep, lx)}</g>`);
  }
  if (sp.rim) {
    const top0 = h === 'beanie' ? -499 : h === 'bun' ? -491.6 : -493.6, hw = h === 'bob' || h === 'long' ? 23 : 20;
    s.push(`<g fill="none" stroke="${sp.rim}" stroke-linecap="round"><path d="M${-hw},${top0 + 11} C${-hw * 0.56},${top0 + 0.6} ${hw * 0.56},${top0 + 0.6} ${hw},${top0 + 11}" stroke-width="2" opacity="0.8"/><path d="M${f(-B(47.4))},-374 C${f(-B(47.4))},-382 ${f(-B(43.6))},-387.4 ${f(-B(38))},-390.2 L-22,-399.4 M${f(B(47.4))},-374 C${f(B(47.4))},-382 ${f(B(43.6))},-387.4 ${f(B(38))},-390.2 L22,-399.4" stroke-width="1.8" opacity="0.7"/></g>`);
  }
  return s.join('');
}

// The outline of a person standing with the arms at the sides, as one shape and nothing else: for shadows.
// In metres: u across (0 at the middle of the body), v up from the ground. from: the height at which it starts,
// for a shadow that comes into the picture part of the way up the body.
export function standingOutline(from = 0){
  const half = [[0.012, 0.8], [0.045, from], [0.158, from], [0.17, 0.55], [0.184, 0.9], [0.174, 1.04], [0.19, 1.22], [0.212, 0.98], [0.22, 0.82], [0.232, 0.73], [0.26, 0.75], [0.268, 0.86], [0.262, 1.1], [0.256, 1.3], [0.238, 1.41], [0.17, 1.465], [0.07, 1.49], [0.056, 1.535], [0.082, 1.585], [0.092, 1.66], [0.078, 1.735], [0.036, 1.775]];
  return [...half, [0, 1.782], ...half.slice().reverse().map(([u, v]) => [-u, v])];
}
