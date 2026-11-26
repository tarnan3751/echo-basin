// The last picture: the lodge's pier at night, seen by somebody standing at its landward end and looking out along it.
// It is the same narrow pier that the lake picture shows side-on: a plank deck on pilings, a handrail along the
// landward stretch with a life ring on its end post, mooring posts further out, a ladder at the lake end.
//
// Everything is placed in metres and put through one camera, so that the pier, the people standing on it and the
// water all agree about where the horizon is. X is across the pier (0 down its middle), Z is distance out from the
// viewer, heights are above the deck. The viewer's eye is EYE above the deck and the water is DROP below it.
//
// Light: a lantern on a post behind the viewer, the same kind as the one at the far end of the pier. It lights the
// boards (strongly near us, hardly at all by the far end), the fronts of the people, the rail and the ring. The
// moon is low over the far ridge, in front of us, and puts a cold edge on heads and shoulders.
//
// Stages: the pier is empty until stage 5. At 5 the six people are standing on it, looking over our head, and our
// own shadow lies on the boards in the lantern light. At 6 a second shadow is there with ours: tall and without
// any shape you could name. It is drawn in a layer of its own so that the page can let it creep.
import * as L from './lib.mjs';
import { ribs, snowcaps } from './peaks.mjs';
import { figFront, standingOutline } from './figure.mjs';
import { smooth } from './snowkit.mjs';
import { dockPeople } from './dock-people.mjs';
const { f, lerp, mix, poly, grain, GL, GR, from, linGrad, radGrad, clip, nid, sliver } = L;

const W = 1600, H = 900, LOW = 1000, TOP = -700, WATER = 430;
// ---- the camera
const HZ = 428, F = 1300, EYE = 1.65, DROP = 0.95;
const px = (X, Z) => 800 + F * X / Z, py = (Z, h = 0) => HZ + F * (EYE - h) / Z, pt = (X, Z, h = 0) => [px(X, Z), py(Z, h)];
const quad = (a, b, c, d) => poly([a, b, c, d]);
// ---- the pier: half its width, where it ends, and the nearest part of it that the picture can show
const HW = 1.16, ZE = 19, ZN = F * EYE / (LOW - HZ), BW = 0.146;
// ---- the lantern behind us, and how much of its light reaches a place Z out along the boards (1 at the bottom edge)
const LAMP = '#FFC070', LZ = -3.2, LH = 2.6, Z1 = F * EYE / (H - HZ);
const light = Z => Math.min(1.15, Math.pow((Z1 - LZ) / (Z - LZ), 1.5));
// where the six stand: across the pier, and how far out. Two loose files, so that the middle of the boards stays open.
const PLACES = { attendant: [0.76, 5.6], dana: [-0.62, 7.2], guest: [0.62, 8.6], mark: [-0.3, 10.0], desk: [0.38, 12.0], cook: [-0.02, 14.2] };

export function finale(){
  L.usePalette('night'); L.begin(); L.reseed(97); L.setSun({ x: 800, y: 318, r: 0 }); L.setWater(WATER);
  const P = L.P, o = [], top = [], fg = [];
  const MOON = { x: 800, y: 316, r: 50 };

  // ================= SKY =================
  o.push(`<rect x="0" y="${TOP}" width="${W}" height="${-TOP + 2}" fill="${P.skyTop}"/><rect x="0" y="0" width="${W}" height="${WATER + 30}" fill="url(#${linGrad(0, 0, 0, WATER, [[0, P.skyTop], [0.4, P.skyMid], [0.8, P.skyLow], [1, P.skyHorizon]])})"/>`);
  o.push(grain(0, -60, W, 330, GL(0, 0, 0, 280, [[0, 0.5], [0.5, 0.2], [1, 0]]), P.grainSky));
  {
    // stars: thick overhead and thinning toward the horizon and toward the moon, which drowns them. A faint band of
    // the Milky Way crosses the upper left, made of many very small ones and a little haze.
    const r = L.source(4410); let st = '', band = '';
    const near = (x, y) => Math.hypot(x - MOON.x, (y - MOON.y) * 1.1);
    for (let k = 0; k < 520; k++) { const x = r(0, W), y = r(TOP, 400), d = near(x, y); if (d < 120 || (d < 260 && r() < 0.6) || (y > 250 && r() < (y - 250) / 190)) continue; st += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r() < 0.05 ? r(1.5, 2.1) : r(0.5, 1.2))}" opacity="${f(r(0.3, 1))}"/>`; }
    for (let k = 0; k < 620; k++) { const t = r(), across = (r() + r() + r() - 1.5) * 150, x = lerp(-60, 760, t) + across * 0.76, y = lerp(250, -520, t) + across * 0.65; if (near(x, y) < 250 || y > 330) continue; band += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r(0.35, 0.85))}" opacity="${f(r(0.25, 0.8))}"/>`; }
    o.push(grain(-80, -560, 900, 860, GL(60, 0, 420, -420, [[0, 0], [0.34, 0.03], [0.5, 0.16], [0.66, 0.03], [1, 0]]), '#9FB4C6', { opacity: 0.55, seed: 4411 }));
    o.push(`<g fill="${P.sun}">${st}<g opacity="0.8">${band}</g></g>`);
  }
  {
    // the moon, full and not long up: its glow, the disc, and the seas on it as a few soft patches
    const r = L.source(4420), sea = (cx, cy, rx, ry, n = 9) => { const pts = []; for (let i = 0; i < n; i++) { const a = i / n * 6.283, k = r(0.78, 1.16); pts.push([MOON.x + cx + Math.cos(a) * rx * k, MOON.y + cy + Math.sin(a) * ry * k]); } return smooth(pts, true); };
    const disc = `M${MOON.x - MOON.r},${MOON.y} a${MOON.r},${MOON.r} 0 1 0 ${MOON.r * 2},0 a${MOON.r},${MOON.r} 0 1 0 ${-MOON.r * 2},0Z`, tone = mix(P.sun, P.skyLow, 0.24);
    o.push(`<circle cx="${MOON.x}" cy="${MOON.y}" r="330" fill="url(#${radGrad(MOON.x, MOON.y, 330, [[0, P.sun, 0.36], [0.36, P.sun, 0.13], [1, P.sun, 0]])})"/><circle cx="${MOON.x}" cy="${MOON.y}" r="${MOON.r + 9}" fill="${P.sun}" opacity="0.16"/><path d="${disc}" fill="${P.sun}"/>`);
    o.push(`<g clip-path="url(#${clip(disc)})" fill="${tone}"><path d="${sea(-16, -16, 14, 11)}" opacity="0.5"/><path d="${sea(-1, -28, 9, 6)}" opacity="0.4"/><path d="${sea(13, -8, 11, 13)}" opacity="0.42"/><path d="${sea(-21, 12, 9, 8)}" opacity="0.36"/><path d="${sea(8, 24, 8, 5)}" opacity="0.32"/><circle cx="${MOON.x + 24}" cy="${MOON.y + 27}" r="3.4" opacity="0.4"/><circle cx="${MOON.x - 32}" cy="${MOON.y - 4}" r="2.2" opacity="0.4"/></g>`);
  }

  // ================= THE FAR SHORE (kept in <defs>, because the lake repeats it upside down) =================
  const shore = [];
  {
    // the range, with a low saddle in the middle for the moon to stand over
    const pts = [[-20, 404], [70, 372], [150, 390], [240, 332], [312, 358], [392, 296], [468, 340], [548, 326], [636, 374], [716, 396], [800, 404], [884, 396], [962, 368], [1040, 324], [1118, 352], [1200, 300], [1288, 346], [1380, 320], [1466, 362], [1540, 342], [1620, 378]];
    const r = L.range(pts, { baseY: WATER, lit: P.farLit, shadeColor: P.farShade, shadeOpacity: 0.5, snowPeaks: [3, 5, 13, 15, 17], amp: 5, seg: 30, caps: false });
    shore.push(r.svg);
    const caps = snowcaps(r.peaks, 61), rb = ribs(r.peaks, 47, 1), liftTone = mix(P.farLit, P.cream, 0.5);
    shore.push(`<g clip-path="url(#${r.cid})"><path d="${caps}" fill="${P.snow}"/><path d="${r.shadeD}" fill="${P.farShade}" fill-opacity="0.5" clip-path="url(#${clip(caps)})"/><path d="${rb.cut}" fill="${P.farShade}" fill-opacity="0.22"/><path d="${rb.deep}" fill="${P.farShade}" fill-opacity="0.26"/><path d="${rb.lift}" fill="${liftTone}" fill-opacity="0.16"/><path d="${rb.fluteLit}" fill="none" stroke="${P.farShade}" stroke-opacity="0.26" stroke-width="1.2" stroke-linecap="round"/><path d="${rb.fluteSh}" fill="none" stroke="${liftTone}" stroke-opacity="0.2" stroke-width="1.2" stroke-linecap="round"/></g>`);
    shore.push(grain(0, 280, W, 160, GL(0, 290, 0, 430, [[0, 0.4], [0.6, 0.16], [1, 0.02]]), P.farShade, { clipId: clip(r.shadeD), seed: 4430, opacity: 0.4 }));
    shore.push(`<path d="${rb.rim}" fill="none" stroke="${P.cream}" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round" opacity="0.3"/>`);
    shore.push(`<rect x="0" y="340" width="${W}" height="${WATER - 340}" fill="url(#${linGrad(0, 340, 0, WATER, [[0, P.cream, 0], [1, P.cream, 0.2]])})" clip-path="url(#${r.cid})"/>`);
  }
  // forest down to the water on either hand: firs, spruces and hemlocks mixed, as round the lake by day
  shore.push(L.hill(-20, 650, [[-20, 374], [150, 364], [320, 380], [470, 404], [600, 424], [650, 432]], 3, 15, P.haze, P.teal, { baseY: WATER + 2, mixed: true, share: true }));
  shore.push(L.hill(960, 1620, [[960, 432], [1010, 424], [1130, 404], [1290, 382], [1450, 368], [1620, 374]], 3, 15, P.haze, P.teal, { baseY: WATER + 2, mixed: true, share: true }));
  shore.push(`<rect x="0" y="386" width="${W}" height="${WATER + 2 - 386}" fill="url(#${linGrad(0, 386, 0, WATER + 2, [[0, P.cream, 0], [0.75, P.cream, 0.15], [1, P.cream, 0.05]])})"/>`);
  const shoreId = nid('shore');
  L.defs.push(`<g id="${shoreId}">${shore.join('')}</g>`);

  // ================= THE LAKE =================
  o.push(`<rect x="0" y="${WATER}" width="${W}" height="${LOW - WATER}" fill="url(#${linGrad(0, WATER, 0, 700, [[0, P.lake[0]], [0.22, P.lake[1]], [0.5, P.lake[2]], [1, P.lake[4]]])})"/>`);
  {
    // the far shore upside down in it, fading out toward us
    const fade = nid('fade');
    L.defs.push(`<mask id="${fade}" maskUnits="userSpaceOnUse" x="0" y="${WATER}" width="${W}" height="200"><rect x="0" y="${WATER}" width="${W}" height="200" fill="url(#${linGrad(0, WATER, 0, WATER + 170, [[0, '#fff', 0.72], [0.5, '#fff', 0.4], [1, '#fff', 0]])})"/></mask>`);
    o.push(`<g mask="url(#${fade})"><use href="#${shoreId}" transform="translate(0,${f(WATER * 1.8)}) scale(1,-0.8)"/><rect x="0" y="${WATER}" width="${W}" height="200" fill="${P.lake[3]}" opacity="0.3"/></g>`);
  }
  o.push(grain(0, WATER + 60, W, LOW - WATER - 60, GL(0, WATER + 60, 0, H, [[0, 0], [0.6, 0.14], [1, 0.36]]), P.ink, { seed: 4440 }));
  {
    // the surface: slits of darker water breaking the reflection, ripples bright on the crest and dark behind it,
    // long low swells. Everything is a sliver; nothing on the lake is a straight bar.
    const wr = L.source(4450), depth = y => (y - WATER) / (H - WATER);
    const slit = ['', ''];
    for (let k = 0; k < 40; k++) { const y = WATER + 8 + Math.pow(wr(), 1.2) * 150, w = wr(60, 260); slit[k % 2] += sliver(wr(-40, W), y, w, wr(1.4, 3), wr(-1, 1)); }
    const lit = ['', '', ''], dk = ['', ''];
    const ripple = (x, y, k) => { const t = depth(y), w = wr(26, 120) * (0.45 + t * 1.1), th = lerp(1.2, 3.8, t) * wr(0.8, 1.25), a = th * wr(-0.9, 0.9); lit[k % 3] += sliver(x, y, w, th, a); if (wr() < 0.55) dk[k % 2] += sliver(x + w * wr(0.05, 0.3), y + th * wr(1.3, 2.2), w * wr(0.6, 1.1), th * wr(0.8, 1.2), a); };
    for (let c = 0; c < 24; c++) { const cy = WATER + 12 + Math.pow(wr(), 1.3) * (H - WATER - 40), cx = wr(-20, W - 60), t = depth(cy); for (let j = 0, n = 2 + Math.floor(wr(0, 4)); j < n; j++) ripple(cx + wr(-60, 60) * (0.5 + t), cy + j * lerp(5, 15, t) * wr(0.8, 1.2), c + j); }
    for (let k = 0; k < 46; k++) ripple(wr(-40, W), WATER + 8 + Math.pow(wr(), 1.4) * (H - WATER - 20), k);
    for (let k = 0; k < 22; k++) { const y = WATER + 110 + wr() * (H - WATER - 120), t = depth(y), w = wr(40, 170) * (0.5 + t); dk[k % 2] += sliver(wr(-40, W), y, w, lerp(1.6, 4.4, t), wr(-1.5, 1.5)); }
    const swell = (x, y, w, th, amp, n) => { const seg = w / n; let d = `M${f(x)},${f(y)}`; for (let i = 0; i < n; i++) d += `Q${f(x + seg * (i + 0.5))},${f(y + (i % 2 ? amp : -amp))} ${f(x + seg * (i + 1))},${f(y)}`; for (let i = n - 1; i >= 0; i--) d += `Q${f(x + seg * (i + 0.5))},${f(y + (i % 2 ? amp : -amp) + th * 2 * Math.sin(Math.PI * (i + 0.5) / n))} ${f(x + seg * i)},${f(y + th * Math.sin(Math.PI * i / n))}`; return d + 'Z'; };
    const sw = ['', ''];
    for (let k = 0; k < 20; k++) { const y = WATER + 50 + Math.pow(wr(), 1.1) * (H - WATER - 70), t = depth(y), w = wr(150, 420) * (0.6 + t * 0.8); sw[k % 3 ? 0 : 1] += swell(wr(-80, W - 80), y, w, lerp(0.7, 1.9, t), lerp(0.9, 3.2, t) * wr(0.7, 1.2), 3 + Math.floor(wr(0, 3.99))); }
    o.push(`<g fill="${P.lake[3]}"><path d="${slit[0]}" opacity="0.4"/><path d="${slit[1]}" opacity="0.6"/></g><g fill="${P.cream}"><path d="${sw[0]}" opacity="0.1"/><path d="${lit[0]}" opacity="0.1"/><path d="${lit[1]}" opacity="0.16"/><path d="${lit[2]}" opacity="0.24"/></g><g fill="${P.ink}"><path d="${sw[1]}" opacity="0.24"/><path d="${dk[0]}" opacity="0.26"/><path d="${dk[1]}" opacity="0.4"/></g>`);
  }
  {
    // the moon on the water: a road of light from under the moon toward us. Close under the far shore it is nearly one
    // unbroken streak; toward us it widens and breaks into separate flashes, long in the middle and small at the edges.
    const gr = L.source(4460), sheen = (cx, cy, rx, ry, a0) => { const id = nid('rg'); L.defs.push(`<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="translate(${cx},${cy}) scale(${rx},${ry})"><stop offset="0" stop-color="${P.sun}" stop-opacity="${a0}"/><stop offset="0.5" stop-color="${P.sun}" stop-opacity="${f(a0 * 0.45)}"/><stop offset="1" stop-color="${P.sun}" stop-opacity="0"/></radialGradient>`); return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${id})"/>`; };
    o.push(`<g clip-path="url(#${L.clipRect(0, WATER, W, LOW - WATER)})">${sheen(MOON.x, WATER + 14, 60, 130, 0.42)}${sheen(MOON.x, WATER + 10, 420, 70, 0.14)}${sheen(MOON.x, H + 40, 330, 440, 0.16)}</g>`);
    const g = ['', '', ''];
    let y = WATER + 3;
    while (y < 730) {
      const t = (y - WATER) / (H - WATER), e = Math.pow(t, 1.2), th = lerp(2, 10, t) * gr(0.85, 1.15), len = lerp(26, 200, e) * gr(0.6, 1.15), spread = lerp(8, 128, e), x = MOON.x + gr(-1, 1) * spread * 0.22 - len / 2, a = th * gr(-0.5, 0.5);
      if (t > 0.2 && gr() < 0.42) { const cut = gr(0.3, 0.7), gap = lerp(5, 16, t); g[0] += sliver(x, y, len * cut - gap / 2, th, a) + sliver(x + len * cut + gap / 2, y + gr(-1, 1), len * (1 - cut) - gap / 2, th * gr(0.75, 1), -a); } else g[0] += sliver(x, y, len, th, a);
      for (let j = 0, n = Math.floor(gr(0.8, 2.8 + t * 2.6)); j < n; j++) { const side = gr() < 0.5 ? -1 : 1, l2 = len * gr(0.14, 0.42), off = len * 0.5 + gr(5, 12 + spread * 0.7); g[1] += sliver(MOON.x + side * off - l2 / 2, y + gr(-0.4, 0.6) * th, l2, th * gr(0.55, 0.85), gr(-0.4, 0.4) * th); }
      if (gr() < 0.5 + t * 0.4) { const side = gr() < 0.5 ? -1 : 1, l3 = lerp(5, 30, t) * gr(0.6, 1.3); g[2] += sliver(MOON.x + side * gr(spread * 0.9, spread * 1.7 + 18) - l3 / 2, y + gr(-0.5, 0.5) * th * 2, l3, th * gr(0.4, 0.6), 0); }
      y += th * 0.72 + lerp(2.2, 10.5, t) * gr(0.75, 1.3);
    }
    o.push(`<g fill="${P.sun}"><path d="${g[2]}" opacity="0.3"/><path d="${g[1]}" opacity="0.5"/><path d="${g[0]}" opacity="0.8"/></g>`);
  }
  // the far shore itself, and the line where it meets the water
  o.push(`<use href="#${shoreId}"/><path d="M0,${WATER + 1.2}H${W}" stroke="${P.cream}" stroke-width="1.2" opacity="0.22"/>`);
  // the rental canoe, still out there with nobody in it. From stage 2, when the lake picture first shows it adrift:
  // before that it is on the bank, and this page can be the first one a visitor opens.
  o.push(L.from(2, `<g transform="translate(420,${f(HZ + F * (EYE + DROP) / 34)}) rotate(-2) scale(0.8)">${L.canoe({ shadow: false, paddle: false, afloat: true })}</g>`));

  // ================= THE PIER =================
  const wood = { dark: '#1C2737', darkFar: '#141D2B', lit: '#BE8A4C', post: '#0A111B', postLit: '#8A6238' };
  const warm = (cold, hot, Z, k = 1) => mix(cold, hot, Math.min(1, light(Z) * k));
  const farGlow = Z => 0.34 * Math.exp(-Math.pow((ZE - Z) / 1.5, 2));                                       // the lantern at the far end
  const deck = quad(pt(-HW, ZN), pt(HW, ZN), pt(HW, ZE), pt(-HW, ZE)), dc = clip(deck);
  {
    // the deck: planks laid across, each its own tone, warm where the lantern reaches and cold where only the moon
    // does. Far out, where a plank is thinner than a hair, they are drawn two and three together.
    const r = L.source(4470); let boards = '', gaps = '', nails = '', knots = '';
    let Z = ZN;
    while (Z < ZE - 0.01) {
      const hpx = F * EYE * BW / (Z * Z), n = hpx > 3.4 ? 1 : hpx > 1.7 ? 2 : 4, Zb = Math.min(ZE, Z + BW * n), v = r(-1, 1), newer = r() < 0.07;
      const cold = mix(mix(wood.dark, wood.darkFar, Math.min(1, (Z - 4) / 10)), '#2A3950', 0.5 + v * 0.5 > 0.86 ? 0.5 : 0.12 + v * 0.1);
      const hot = mix(wood.lit, v > 0 ? '#D29D5C' : '#8E6233', Math.abs(v) * 0.5 + (newer ? 0.3 : 0));
      boards += `<path d="${quad(pt(-HW, Z), pt(HW, Z), pt(HW, Zb), pt(-HW, Zb))}" fill="${mix(cold, hot, Math.min(1, light(Z) * 0.92 + farGlow(Z)))}"/>`;
      const y = py(Z), lw = Math.max(0.5, Math.min(2.6, 1.9 * Math.pow(4.6 / Z, 1.4)));
      gaps += `<path d="M${f(px(-HW, Z))},${f(y)} H${f(px(HW, Z))}" stroke-width="${f(lw)}" opacity="${f(Math.min(0.85, 0.3 + 2.6 / Z))}"/>`;
      if (n === 1 && Z < 10.6) { const rr = Math.max(0.7, 9.4 / Z); for (const X of [-0.86, 0.86]) for (const dz of [0.036, BW - 0.036]) nails += `<circle cx="${f(px(X + r(-0.012, 0.012), Z + dz))}" cy="${f(py(Z + dz))}" r="${f(rr)}"/>`;
        if (r() < 0.16) { const X = r(-0.95, 0.95), Zk = Z + BW * r(0.3, 0.7); knots += `<ellipse cx="${f(px(X, Zk))}" cy="${f(py(Zk))}" rx="${f(26 / Zk)}" ry="${f(11 / Zk)}"/>`; } }
      Z = Zb;
    }
    o.push(`<path d="${deck}" fill="${wood.dark}"/>${boards}<g fill="#3A2A1C" opacity="0.42">${knots}</g>`);
    // (shadows are laid on the boards here, before the lines between the planks go on over them)
    o.push('@@SHADOWS@@');
    o.push(`<g stroke="#070B12" fill="none">${gaps}</g><g fill="#0B0F17" opacity="0.7">${nails}</g>`);
    // The edges. One kerb timber runs the whole length of each side, so each edge of the pier is a single straight
    // line from our feet to the far end. (The pilings are under the deck and cannot be seen from on top of it.) Each
    // face of a timber is one shape, and the lantern's light falls away along it without a step: the fill is a
    // gradient whose stops are placed where the camera puts each distance.
    const fall = (h, cold, hot, k) => { const y0 = py(ZE, h), y1 = py(ZN, h), stops = []; for (let i = 0; i <= 18; i++) { const Z = ZE * Math.pow(ZN / ZE, i / 18); stops.push([+((py(Z, h) - y0) / (y1 - y0)).toFixed(4), mix(cold, hot, Math.min(1, light(Z) * k + farGlow(Z)))]); } return `url(#${linGrad(0, y0, 0, y1, stops)})`; };
    const kerbFace = fall(0.065, '#101826', '#7A552F', 0.7), kerbTop = fall(0.13, '#26344A', '#C89658', 0.8);
    for (const k of [-1, 1]) { const xi = k * (HW - 0.15), xo = k * HW;
      o.push(`<path d="${quad(pt(xi, ZN), pt(xi, ZE), pt(xi, ZE, 0.13), pt(xi, ZN, 0.13))}" fill="${kerbFace}"/><path d="${quad(pt(xi, ZN, 0.13), pt(xi, ZE, 0.13), pt(xo, ZE, 0.13), pt(xo, ZN, 0.13))}" fill="${kerbTop}"/>`); }
  }
  // a square post: its near face, and the face turned toward the middle of the pier. base: the height it stands at
  // (the rail's posts stand on the kerb).
  const post = (k, X, Z, w, h, o2 = {}) => { const xi = X - k * w / 2, xo = X + k * w / 2, cold = o2.cold || wood.post, hot = o2.hot || wood.postLit, b = o2.base || 0;
    return `<path d="${quad(pt(xi, Z, b), pt(xi, Z + w, b), pt(xi, Z + w, h), pt(xi, Z, h))}" fill="${warm(mix(cold, '#000000', 0.2), mix(hot, '#000000', 0.45), Z, 0.6)}"/><path d="${quad(pt(xi, Z, b), pt(xo, Z, b), pt(xo, Z, h), pt(xi, Z, h))}" fill="${warm(cold, hot, Z)}"/>`; };
  {
    // mooring posts on the open side, each with a cap and two turns of line; a line from the outer one goes over the edge
    for (const Z of [ZE - 0.3, 12.4]) { const X = HW - 0.14, a = pt(X - 0.11, Z, 0.86), b = pt(X + 0.11, Z, 0.86), c = pt(X + 0.11, Z, 0.8), d = pt(X - 0.11, Z, 0.8);
      o.push(post(1, X, Z, 0.2, 0.84) + `<path d="${quad(a, b, c, d)}" fill="${warm('#2B3A52', '#C89658', Z)}"/><path d="M${f(d[0])},${f(py(Z, 0.5))} H${f(c[0])} M${f(d[0])},${f(py(Z, 0.42))} H${f(c[0])}" stroke="${P.cream}" stroke-width="${f(Math.max(1, 22 / Z))}" opacity="0.55"/>`); }
    const a = pt(HW - 0.03, ZE - 0.3, 0.44), b = pt(HW + 0.05, ZE - 0.34, 0.1), c2 = pt(HW + 0.07, ZE - 0.36, -0.3);
    o.push(`<path d="M${f(a[0])},${f(a[1])} Q${f(b[0] + 3)},${f(a[1] + 2)} ${f(b[0])},${f(b[1])} L${f(c2[0])},${f(c2[1])}" stroke="${P.cream}" stroke-width="1.1" fill="none" opacity="0.5" stroke-linecap="round"/>`);
    // the ladder at the lake end: the tops of its two rails, each hooped over onto the deck. We see the hoops almost
    // edge-on, so each is opened out a hand's breadth to let it read as a hoop.
    const lad = (X, k) => { const p0 = pt(X, ZE + 0.02, 0), p1 = pt(X, ZE + 0.02, 0.8), p2 = pt(X + k * 0.09, ZE - 0.3, 0.8), p3 = pt(X + k * 0.09, ZE - 0.3, 0), top = Math.min(p1[1], p2[1]) - 5; return `M${f(p0[0])},${f(p0[1])} L${f(p1[0])},${f(p1[1])} C${f(p1[0])},${f(top)} ${f(p2[0])},${f(top)} ${f(p2[0])},${f(p2[1])} L${f(p3[0])},${f(p3[1])}`; };
    o.push(`<path d="${lad(-0.06, -1)} ${lad(0.36, 1)}" stroke="${wood.post}" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${lad(-0.06, -1)} ${lad(0.36, 1)}" stroke="${P.rim}" stroke-width="0.7" fill="none" opacity="0.5" transform="translate(-0.7,-0.5)"/>`);
  }
  {
    // the lantern at the far end, on a tall post at the corner: the same lantern as the one behind us
    const X = -HW + 0.12, Z = ZE - 0.3, hp = 2.4, t = pt(X, Z, hp), s = F / Z;
    o.push(post(-1, X, Z, 0.11, hp));
    o.push(`<g transform="translate(${f(t[0])},${f(t[1])}) scale(${f(s / 76)})"><circle cx="0" cy="-15" r="64" fill="url(#${radGrad(0, -15, 64, [[0, LAMP, 0.5], [0.4, LAMP, 0.18], [1, LAMP, 0]])})"/><rect x="-9" y="-5" width="18" height="5" rx="1.4" fill="#0A0F18"/><rect x="-7" y="-27" width="14" height="22" rx="1.6" fill="${P.window}"/><rect x="-3.4" y="-23" width="6.8" height="14" rx="3" fill="#FFF1C9"/><path d="M-7,-27V-5 M7,-27V-5 M0,-27V-5" stroke="#0A0F18" stroke-width="1.5"/><path d="M-10,-27 h20 l-4,-6 h-12Z" fill="#0A0F18"/><path d="M-3,-33 q3,-7 6,0" stroke="#0A0F18" stroke-width="1.5" fill="none"/></g>`);
  }
  {
    // the handrail along the landward stretch of the other side: posts standing on the kerb, a top rail and a middle
    // rail, lit on the faces turned to the lantern. It ends at a post with the life ring hung on it.
    const X = -HW + 0.06, ZR = 4.8, posts = [1.6, 3.2, ZR], cold = '#0D1420', hot = '#7C5A36';
    const rail = (h, th, wd) => { let s = ''; for (let i = 0; i < posts.length - 1; i++) { const Za = posts[i], Zb = posts[i + 1], Zm = (Za + Zb) / 2, xi = X + wd / 2, xo = X - wd / 2;
      s += `<path d="${quad(pt(xi, Za, h - th), pt(xi, Zb, h - th), pt(xi, Zb, h), pt(xi, Za, h))}" fill="${warm(mix(cold, '#000000', 0.1), mix(hot, '#000000', 0.34), Zm, 0.75)}"/><path d="${quad(pt(xi, Za, h), pt(xi, Zb, h), pt(xo, Zb, h), pt(xo, Za, h))}" fill="${warm(mix(cold, P.rim, 0.34), '#A8804E', Zm, 0.8)}"/>`; } return s; };
    o.push(rail(0.56, 0.07, 0.05));
    for (const Z of posts) o.push(post(-1, X, Z, 0.1, 1.0, { cold, hot, base: 0.13 }));
    o.push(rail(1.05, 0.07, 0.13));
    // The ring hangs on the end post, flat against the inner side of the rail. So it lies in the rail's own plane, and
    // it is put through the same camera as the rail: from where we stand it is turned well away from us, with its
    // near rim toward us and the far side of the hole showing through the middle. It is built as a ring with some
    // thickness: a back circle against the rail, a front circle a hand's breadth out from it, and the rim between.
    // Coral, four pale bands that go right round the tube, and a grab line looped from band to band.
    const Zc = ZR + 0.05, hc = 0.66, R = 0.37, r2 = 0.215, ch = 0.022, Xb = X + 0.07, Xf = Xb + 0.075, Xm = (Xb + Xf) / 2, TAU = Math.PI * 2;
    const at = (Xp, rad, a) => pt(Xp, Zc + rad * Math.cos(a), hc + rad * Math.sin(a));
    const arc = (Xp, rad, a0 = 0, a1 = TAU, n = 48) => Array.from({ length: n + 1 }, (_, i) => at(Xp, rad, a0 + (a1 - a0) * i / n));
    const strip = (Xa, ra, Xc, rc, a0, a1, n = 8) => poly([...arc(Xa, ra, a0, a1, n), ...arc(Xc, rc, a1, a0, n)]);
    const hull = pts => { const q = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o2, a, b) => (a[0] - o2[0]) * (b[1] - o2[1]) - (a[1] - o2[1]) * (b[0] - o2[0]), lo = [], up = [];
      for (const v of q) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], v) <= 0) lo.pop(); lo.push(v); }
      for (const v of q.reverse()) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], v) <= 0) up.pop(); up.push(v); }
      return lo.slice(0, -1).concat(up.slice(0, -1)); };
    const lit = light(ZR), coral = mix(mix(P.coral, '#1A1420', 0.45), mix('#E4694F', LAMP, 0.16), lit), coralSh = mix(mix(P.coralSh, '#0E0E18', 0.5), '#A9443A', lit), band = mix(mix(P.cream, '#1A2430', 0.5), '#FBE9C9', lit);
    const rim = mix(coral, '#FFD9AC', 0.13), deep = mix(coralSh, '#0A0F18', 0.5), bandRim = mix(band, '#FFFFFF', 0.25), bandDeep = mix(band, '#0A0F18', 0.62);
    const bands = [0, 1, 2, 3].map(q => [q * Math.PI / 2 - 0.25, q * Math.PI / 2 + 0.25]), outer = R - ch, inner = r2 + ch, hole = poly(arc(Xf, inner));
    // the rim: everything of the ring that is not its front face, which from here is the near side of the tube
    let ring = `<path d="${poly(hull([...arc(Xb, outer), ...arc(Xm, R), ...arc(Xf, outer)]))}" fill="${rim}"/><path d="${bands.map(([a0, a1]) => strip(Xf, outer, Xm, R, a0, a1) + ' ' + strip(Xm, R, Xb, outer, a0, a1)).join(' ')}" fill="${bandRim}"/><path d="${strip(Xf, outer, Xb, outer, Math.PI, Math.PI * 1.5, 16)}" fill="#0A0F18" opacity="0.12"/>`;
    // the grab line, standing off the rim between each pair of bands
    { let d = ''; for (let q = 0; q < 4; q++) { const a0 = q * Math.PI / 2 + 0.25, a1 = (q + 1) * Math.PI / 2 - 0.25; for (let i = 0; i <= 12; i++) { const u = i / 12, v = at(Xm, R + 0.085 * Math.sin(Math.PI * u), a0 + (a1 - a0) * u); d += `${i ? 'L' : 'M'}${f(v[0])},${f(v[1])} `; } }
      ring += `<path d="${d}" fill="none" stroke="${band}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>`; }
    // through the hole, the inside of the tube on its far side; then the front face, its bands, and a little shade on its lower half
    ring += `<path d="${hole}" fill="${deep}"/><path d="${bands.map(([a0, a1]) => strip(Xf, inner, Xb, inner, a0, a1)).join(' ')}" fill="${bandDeep}" clip-path="url(#${clip(hole)})"/>`;
    ring += `<path d="${poly(arc(Xf, outer))} ${hole}" fill="${coral}" fill-rule="evenodd"/><path d="${bands.map(([a0, a1]) => strip(Xf, outer, Xf, inner, a0, a1)).join(' ')}" fill="${band}"/><path d="${strip(Xf, outer, Xf, inner, Math.PI, TAU, 24)}" fill="#0A0F18" opacity="0.14"/>`;
    o.push(ring);
  }

  // ================= LIGHT AND SHADOW ON THE BOARDS =================
  const SH = '#121A27', shadows = [];
  const people = dockPeople().map(p => ({ ...p, X: PLACES[p.name][0], Z: PLACES[p.name][1] }));
  {
    // behind each of the six, the shadow the lantern throws: their own outline laid out along the boards away from it.
    // We stand almost where the lantern is, so each of them hides most of their own.
    let s = '';
    for (const p of people) { const hk = p.h / 1.75; s += smooth(standingOutline(0.03).map(([u, v]) => { const k = LH / (LH - v * hk); return pt((p.X + u * hk * p.sp.build) * k, LZ + (p.Z + 0.05 - LZ) * k); }), true, 0.7) + ' '; }
    let under = '';
    for (const p of people) { const [x, y] = pt(p.X, p.Z), sc = F / p.Z * p.h / 484; for (const k of [-1, 1]) under += `<ellipse cx="${f(x + k * 21.5 * p.sp.build * sc)}" cy="${f(y + 0.6 * sc)}" rx="${f(16 * sc)}" ry="${f(Math.max(1, 3.4 * sc))}"/>`; }
    shadows.push(from(5, `<g fill="${SH}" clip-path="url(#${dc})"><path d="${s}" opacity="0.8"/><g opacity="0.7">${under}</g></g>`));
    // our own shadow, thrown up the boards ahead of us: it comes in at the bottom edge about the knee, and the head is
    // some eight metres out. It widens a little as it goes, as a shadow from a lamp does, and the pier's perspective
    // narrows it again. The lantern is a little to our right, so the shadow leans to the left as it goes.
    const zOf = v => { const tab = [[0.42, 3.9], [0.9, 5.0], [1.45, 6.5], [1.56, 6.9], [1.79, 8.05]]; for (let i = 1; i < tab.length; i++) if (v <= tab[i][0]) return lerp(tab[i - 1][1], tab[i][1], (v - tab[i - 1][0]) / (tab[i][0] - tab[i - 1][0])); return tab[tab.length - 1][1]; };
    const me = standingOutline(0.42).map(([u, v]) => { const Z = zOf(v); return pt(0.03 - 0.04 * (Z - 3.9) + u * (1.08 + 0.2 * v), Z); });
    shadows.push(from(5, `<path d="${smooth(me, true, 0.8)}" fill="${SH}" opacity="0.86"/>`));
  }
  const svg0 = `<defs>${L.defs.join('\n')}</defs>${o.join('\n').replace('@@SHADOWS@@', shadows.join(''))}`; L.begin();

  // ================= STAGE 6: THE OTHER SHADOW =================
  {
    // It lies up the boards from the bottom edge, between the two files of people, as far as the feet of the furthest:
    // broad where it comes in, leaning the way our own shadow leans, narrowing as the pier does. One smooth outline
    // with no part of it a head or an arm or a leg. It has no hard edge anywhere: the body of it is blurred, there
    // is a wider and fainter blur round that, and the whole of it thins out toward its far end, as the shadow of
    // something a long way above the lantern would.
    const left = [[1040, 590], [950, 594], [880, 606], [826, 632], [772, 690], [716, 734], [664, 764], [624, 788], [598, 801]], right = [[598, 819], [622, 836], [656, 846], [700, 862], [748, 890], [806, 904], [866, 910], [950, 922], [1040, 928]];
    const shape = grow => smooth([...left.map(([y, x]) => [x - grow, y]), [809, 586 - grow * 0.5], ...right.map(([y, x]) => [x + grow, y])], true, 1);
    const region = 'filterUnits="userSpaceOnUse" x="420" y="470" width="680" height="660"';
    top.push(`<defs><clipPath id="deck6"><path d="${deck}"/></clipPath><filter id="soft6" ${region}><feGaussianBlur stdDeviation="9"/></filter><filter id="softer6" ${region}><feGaussianBlur stdDeviation="24"/></filter><linearGradient id="fade6" gradientUnits="userSpaceOnUse" x1="0" y1="900" x2="0" y2="590"><stop offset="0" stop-color="${SH}" stop-opacity="0.84"/><stop offset="0.5" stop-color="${SH}" stop-opacity="0.76"/><stop offset="1" stop-color="${SH}" stop-opacity="0.4"/></linearGradient></defs>`);
    top.push(from(6, `<g clip-path="url(#deck6)"><path d="${shape(16)}" fill="${SH}" opacity="0.34" filter="url(#softer6)"/><path d="${shape(0)}" fill="url(#fade6)" filter="url(#soft6)"/></g>`));
  }

  // ================= THE SIX =================
  {
    // Each is lit from the front by the lantern, less the further out they stand, and has the moon behind them.
    const NIGHT = '#0C1626', relit = (sp, k) => {
      const lit = c => mix(mix(c, NIGHT, 0.52), mix(c, LAMP, 0.15), k), sh = c => mix(mix(c, NIGHT, 0.74), mix(mix(c, '#1A1420', 0.42), LAMP, 0.05), k), pair = t => t && { ...t, lit: lit(t.lit), sh: sh(t.sh), ...(t.band ? { band: lit(t.band) } : {}) };
      return { ...sp, skin: lit(sp.skin), skinSh: sh(sp.skinSh), hair: mix(sp.hair, NIGHT, lerp(0.5, 0.2, k)), brow: sp.brow && mix(sp.brow, NIGHT, 0.3), top: pair(sp.top), sleeve: pair(sp.sleeve), pants: pair(sp.pants), leaf: pair(sp.leaf), apron: pair(sp.apron), beanie: pair(sp.beanie),
        collar: sp.collar && lit(sp.collar), slipper: sp.slipper && lit(sp.slipper), pin: sp.pin && sh(sp.pin), boots: sp.boots && mix(sp.boots, '#05080E', 0.5) };
    };
    const face = { tilt: 4.2, gaze: [0, -1.2], whites: true, mouth: 'flat', rim: '#93AAC0' };
    const far = people.slice().sort((a, b) => b.Z - a.Z);
    fg.push(from(5, far.map(p => { const [x, y] = pt(p.X, p.Z), s = F / p.Z * p.h / 484, k = Math.min(1, Math.pow(light(p.Z), 0.62)); return `<g transform="translate(${f(x)},${f(y)}) scale(${f(s * 1000) / 1000})">${figFront({ ...face, ...relit(p.sp, k), lx: p.X < 0 ? 1 : -1 })}</g>`; }).join('')));
  }
  fg.push(`<rect x="0" y="${TOP}" width="${W}" height="${LOW - TOP}" fill="url(#${radGrad(W / 2, H * 0.5, 1040, [[0.5, '#02040A', 0], [1, '#02040A', 0.66]])})"/>`);
  const wrap = (inner, cls) => `<svg class="ly${cls}" viewBox="0 ${TOP} ${W} ${W}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${inner}</svg>`;
  return { layers: [wrap(svg0, ''), wrap(top.join(''), ' creep'), wrap(`<defs>${L.defs.join('\n')}</defs>${fg.join('\n')}`, '')], vb: [0, TOP, W, W], vbm: [320, -20, 960, 920] };
}
