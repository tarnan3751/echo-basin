// The three graphics in "Out on the trail": the track card (tall), and beside it the conditions panel and the
// daylight chart. All three are printed cards on the map's paper. Each is drawn twice, once for a wide column and
// once for a phone, where the same things are stacked and the lettering is larger for the width.
//
// Every figure on them is one the site already gives somewhere else:
//   the lodge at 3,540 ft and the pass at 8,560 ft; snow above 7,500 ft; fire danger moderate; dusk at 7:42 pm;
//   the pass 4.0 miles from the lodge on a bearing of 042 (the map's straight line runs the other way, 222), with
//   the Pass Hut 2.9 and Halloran Meadows 1.7 miles out along it, and Echo Point half a mile out;
//   holes in the snow at the Pass Hut forty feet apart, in one line; unidentified tracks above 7,500 ft;
//   bears gone in the last week of August; no elk since Sept. 14; the pass silent since 5:30 am on the 15th;
//   the five people in the trail register who signed in and have not signed out, and the times they signed in.
import * as L from './lib.mjs';
import { T, lines2, twoLayouts, sheet, tooth, rule, span, PAPER, INK, INK2, DEEP } from './infokit.mjs';
const { f, mix, lerp, poly, from, until, between, clip, grain, GL } = L;

const CORAL = '#E4694F', CORAL_D = '#B4473F', TEAL = '#2F6B68', SUN = '#F2B441';
const rad = d => d * Math.PI / 180;
// a point on a compass dial: bearing in degrees clockwise from north
const onDial = (cx, cy, r, brg) => [cx + r * Math.sin(rad(brg)), cy - r * Math.cos(rad(brg))];
const WHITE = mix(PAPER, '#FFFFFF', 0.55);

// ================= CURRENT CONDITIONS =================
// By day it is a small weather station: a wind compass, the temperature at the lodge and at the pass, the fire
// danger. Staff use "conditions" for the thing they will not name, and from stage 3 the panel reports that instead:
// the compass becomes a bearing-and-distance plot centred on the lodge, with a mark for where conditions were last
// reported. The mark comes in along the map's line: 4.0 miles out at the pass, then 0.4, then at the lodge. At
// stage 6 the plot is centred on the reader.
function drawConditions(c, seed){
  const { W, H, m, cx, cy, R } = c, RX = W - m, o = [sheet(W, H)];
  o.push(T(m, c.titleY, 'Current conditions', { font: 'serif', size: c.title, alts: { 3: 'Where conditions are', 4: 'Conditions advisory', 5: 'Conditions' } }));
  o.push(T(c.status[0], c.status[1], 'Good. Updated 6:00 am', { anchor: c.status[2], size: c.small, fill: INK2, alts: { 1: 'Fair. Updated 6:00 am', 2: 'Quiet. Updated 6:00 am', 3: 'Updated hourly, in daylight', 4: 'Updated Sept. 16', 5: 'No longer updated', 6: 'Updated just now' } }));
  o.push(rule(m, c.ruleY, RX, c.ruleY));

  // ---- the dial
  const MI = R / 4.3;                                             // from stage 3: the dial's edge is 4.3 miles out
  let ticks = '';
  for (let k = 0; k < 32; k++) { const a = k * 11.25, r0 = k % 8 === 0 ? R - 13 : k % 4 === 0 ? R - 9 : R - 5, [x1, y1] = onDial(cx, cy, r0, a), [x2, y2] = onDial(cx, cy, R, a); ticks += `M${f(x1)},${f(y1)} L${f(x2)},${f(y2)} `; }
  o.push(`<circle cx="${cx}" cy="${cy}" r="${R}" fill="${WHITE}" stroke="${INK}" stroke-width="1.6"/><path d="${ticks}" stroke="${INK}" stroke-width="1.1" fill="none"/>`);
  o.push([['N', 0], ['E', 90], ['S', 180], ['W', 270]].map(([s, a]) => { const [x, y] = onDial(cx, cy, R - 25, a); return T(x, y + 5.4, s, { anchor: 'middle', size: 15, weight: 700, cls: false }); }).join(''));
  // stages 0-1: the wind, from the west
  const needle = (brg, long, short, fill) => { const [hx, hy] = onDial(cx, cy, long, brg), [tx, ty] = onDial(cx, cy, short, brg + 180), [lx, ly] = onDial(cx, cy, 6.5, brg + 90), [rx, ry] = onDial(cx, cy, 6.5, brg - 90); return `<path d="${poly([[hx, hy], [lx, ly], [tx, ty], [rx, ry]])}" fill="${fill}"/><path d="${poly([[hx, hy], [lx, ly], [cx, cy]])}" fill="#000" opacity="0.16"/>`; };
  o.push(until(1, needle(270, R - 32, 30, DEEP) + `<circle cx="${cx}" cy="${cy}" r="4.4" fill="${PAPER}" stroke="${DEEP}" stroke-width="1.6"/>`));
  // stage 2: no wind at all
  o.push(between(2, 2, `<circle cx="${cx}" cy="${cy}" r="4.4" fill="${DEEP}"/><circle cx="${cx}" cy="${cy}" r="13" fill="none" stroke="${DEEP}" stroke-width="1.1" stroke-dasharray="2 4"/>`));
  // stages 3-6: range rings a mile apart, and the mark
  { let rings = ''; for (let k = 1; k <= 4; k++) rings += `<circle cx="${cx}" cy="${cy}" r="${f(k * MI)}" fill="none" stroke="${INK}" stroke-width="0.8" stroke-dasharray="1.5 4" opacity="0.6"/>`;
    const at = mi => onDial(cx, cy, mi * MI, 42), [ax, ay] = at(4), [bx, by] = at(0.4), [ex, ey] = onDial(cx, cy, R, 42);
    const blip = (x, y, r = 6.4) => `<circle cx="${f(x)}" cy="${f(y)}" r="${r + 4.6}" fill="${CORAL}" opacity="0.25"/><circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${CORAL}" stroke="${PAPER}" stroke-width="1.4"/>`;
    const past = mi => { const [x, y] = at(mi); return `<circle cx="${f(x)}" cy="${f(y)}" r="3.4" fill="${PAPER}" stroke="${CORAL_D}" stroke-width="1.4"/>`; };
    const lodge = `<path d="M${cx - 5.6},${cy + 4.6} v-6 l5.6,-5 l5.6,5 v6Z" fill="${INK}" stroke="${PAPER}" stroke-width="1.2" stroke-linejoin="round" paint-order="stroke"/>`;
    o.push(from(3, rings + [1, 2, 3, 4].map(k => { const [x, y] = onDial(cx, cy, k * MI, 148); return T(x + 3, y + 1, k === 1 ? '1 mi' : String(k), { size: 11.5, fill: INK2, cls: false, halo: WHITE }); }).join('')));
    // 3: one report, at the pass, heading in
    o.push(between(3, 3, `<path d="M${f(ax)},${f(ay)} L${f(lerp(ax, cx, 0.3))},${f(lerp(ay, cy, 0.3))}" stroke="${CORAL_D}" stroke-width="2" fill="none"/><path d="M-6,-4 L4,0 L-6,4Z" fill="${CORAL_D}" transform="translate(${f(lerp(ax, cx, 0.3))},${f(lerp(ay, cy, 0.3))}) rotate(${42 + 90})"/>` + lodge + blip(ax, ay)));
    // 4: four reports (the pass, the hut, the meadows), the last one under half a mile out
    o.push(between(4, 4, `<path d="M${f(ax)},${f(ay)} L${f(bx)},${f(by)}" stroke="${CORAL_D}" stroke-width="2" fill="none"/>` + past(4) + past(2.9) + past(1.7) + lodge + blip(bx, by)));
    // 5 and 6: at the middle of the plot
    o.push(from(5, `<path d="M${f(ex)},${f(ey)} L${cx},${cy}" stroke="${CORAL_D}" stroke-width="2" fill="none"/>` + past(4) + past(2.9) + past(1.7) + past(0.4)
      + `<circle cx="${cx}" cy="${cy}" r="27" fill="none" stroke="${CORAL}" stroke-width="1.2" opacity="0.45"/><circle cx="${cx}" cy="${cy}" r="18" fill="none" stroke="${CORAL}" stroke-width="1.4" opacity="0.7"/>` + blip(cx, cy, 8)));
    o.push(between(3, 5, T(cx - 11, cy + 22, 'lodge', { size: 13, weight: 700, anchor: 'end', cls: false, halo: WHITE })) + from(6, T(cx - 14, cy + 22, 'you', { size: 14, weight: 700, fill: CORAL_D, anchor: 'end', cls: false, halo: WHITE })));
  }
  o.push(T(cx, c.dialLabelY, 'Wind W, 8 mph', { anchor: 'middle', size: c.body, weight: 650, alts: { 2: 'No wind', 3: '4.0 mi NE of the lodge', 4: '0.4 mi NE of the lodge', 5: 'At the lodge', 6: '0 ft from you' } }));

  // ---- the stations, each headed by its symbol from the map: the lodge, and the pass
  const X = c.sx, VX = c.sx + c.noteDx;
  const sym = { lodge: `<path d="M-5,4.6 v-5.4 l5,-4.6 l5,4.6 v5.4Z"/>`, pass: `<path d="M-6,4.4 L-1.4,-4.6 L1.6,0.4 L3.4,-1.8 L6,4.4Z"/>` };
  const station = (y, icon, label, value, note) => `<g transform="translate(${X + 9},${y - 5})"><rect x="-9" y="-9" width="18" height="18" rx="3.4" fill="${INK}"/><g fill="${PAPER}">${sym[icon]}</g></g>`
    + T(X + 26, y, label[0], { size: c.small, fill: INK2, alts: label[1] }) + T(X, y + 34, value[0], { font: 'serif', size: c.value, alts: value[1], num: true }) + T(VX, y + 33, note[0], { size: c.body, alts: note[1] });
  o.push(station(c.s1, 'lodge', ['Basin Lodge, 3,540 ft', { 6: 'Where you are' }], ['61°F', { 5: '—', 6: '0 ft' }], ['clear, light wind', { 2: 'clear, no wind', 3: 'clear', 4: 'one light on, in the lobby', 5: 'no report since the 16th', 6: 'behind you' }]));
  o.push(rule(X, c.s1 + 48, RX, c.s1 + 48, { opacity: 0.3 }));
  o.push(station(c.s2, 'pass', ['Echo Pass, 8,560 ft', { 6: 'Echo Basin' }], ['38°F', { 4: '—' }], ['snow above 7,500 ft', { 2: 'no wind', 3: 'last seen here', 4: 'no report since Sept. 15', 6: 'it left last night' }]));
  o.push(rule(X, c.s2 + 48, RX, c.s2 + 48, { opacity: 0.3 }));
  // fire danger, until there are other things to say about lights
  const fy = c.s2 + 68;
  o.push(T(X, fy, 'Fire danger', { size: c.small, fill: INK2, alts: { 3: 'Lights', 4: 'Advisory', 5: 'Lights', 6: 'If you want to check' } }));
  { const cols = [TEAL, SUN, '#EE8E3E', CORAL, CORAL_D], sw = (RX - X - 16) / 5; let g = '';
    cols.forEach((col, i) => { g += `<rect x="${f(X + i * (sw + 4))}" y="${fy + 19}" width="${f(sw)}" height="11" rx="2" fill="${col}"${i === 1 ? '' : ' opacity="0.45"'}/>`; });
    o.push(until(2, g + `<path d="M${f(X + sw + 4 + sw / 2)},${fy + 17} l-5.4,-7 h10.8Z" fill="${INK}"/>`)); }
  o.push(from(3, T(X, fy + 29, 'No fires, lanterns or headlamps.', { size: c.body, alts: { 4: 'Whole basin, tonight. Stay inside.', 5: 'No lights.', 6: "Don't." } })));
  o.push(T(X, fy + 54, 'Moderate. Campfires in rings only.', { size: c.body, alts: { 3: 'Under half a mile: stay inside.', 4: 'Curtains closed on the lake side.', 5: 'It came to the windows.', 6: 'It comes toward people who look.' } }));
  o.push(tooth(W, H, seed, 0.7));
  return o.join('\n');
}
export function conditions(){
  L.usePalette('gold'); L.begin();
  const wide = drawConditions({ W: 560, H: 330, m: 28, title: 25, titleY: 49, status: [532, 47, 'end'], small: 15, body: 16, value: 30, ruleY: 64, cx: 126, cy: 180, R: 86, dialLabelY: 300, sx: 252, noteDx: 92, s1: 92, s2: 164 }, 9101);
  const tall = drawConditions({ W: 360, H: 566, m: 18, title: 24, titleY: 45, status: [18, 68, 'start'], small: 14.5, body: 15.5, value: 29, ruleY: 82, cx: 180, cy: 184, R: 88, dialLabelY: 302, sx: 18, noteDx: 92, s1: 342, s2: 416 }, 9111);
  return twoLayouts(wide, tall, [560, 330], [360, 566]);
}

// ================= DAYLIGHT =================
// The hiking season, May to October, across; the hours of the day up the side. The pale band is daylight, with a
// thin band of twilight either side of it, and a mark for today: sunrise 6:58 am, sunset 7:42 pm. From stage 2 the
// chart carries the park's rules as well as the sun: the gate, then indoors by 7:42. At stage 4 it also carries the
// trail register: a dot for each of the five people who signed in and have not signed out, at the time they signed
// in. Two of the dots are in daylight. After that nobody posts anything, and at stage 6 the reader is on it.
const REGISTER = [[257, 6 + 20 / 60], [257, 13 + 55 / 60], [258, 5.5], [258, 19 + 50 / 60], [259, 7]];     // day of the year, hour
function drawDaylight(c, seed){
  const { W, H, m, wide } = c, RX = W - m, o = [sheet(W, H)];
  o.push(T(m, c.titleY, 'Daylight', { font: 'serif', size: c.title }));
  o.push(T(c.status[0], c.status[1], 'Today, mid-September', { anchor: c.status[2], size: c.small, fill: INK2, alts: { 4: 'Today, Sept. 16', 5: 'Not posted since Sept. 16', 6: 'Right now' } }));
  o.push(rule(m, c.ruleY, RX, c.ruleY));
  const cell = (x, label, value) => T(x, c.cellY, label[0], { size: c.small - 0.5, fill: INK2, alts: label[1] }) + T(x, c.cellY + 26, value[0], { font: 'serif', size: c.value, alts: value[1], num: true });
  o.push(cell(c.cells[0], ['Sunrise', {}], ['6:58 am', { 5: 'not posted' }]) + cell(c.cells[1], ['Sunset', { 1: 'Dusk', 5: 'Dusk was' }], ['7:42 pm', {}])
    + cell(c.cells[2], ['Daylight', { 2: 'Quiet hours', 3: 'Be indoors by', 5: 'Daylight' }], ['12 h 44 min', { 2: 'from dusk', 3: '7:42 pm', 5: 'not posted', 6: "doesn't help" }]));

  // ---- the chart
  const X0 = c.X0, X1 = RX, Y0 = c.Y0, Y1 = c.Y1, D0 = 121, D1 = 305, H0 = 4, H1 = 22.5;
  const xOf = d => X0 + (d - D0) / (D1 - D0) * (X1 - X0), yOf = h => Y1 - (h - H0) / (H1 - H0) * (Y1 - Y0);
  const len = d => 12.32 + 3.78 * Math.cos(2 * Math.PI * (d - 172) / 365), NOON = 13 + 1 / 3, TW = 0.55;
  const rise = d => NOON - len(d) / 2, set = d => NOON + len(d) / 2;
  const band = (lo, hi) => { const up = [], dn = []; for (let d = D0; d <= D1; d += 4) { up.push([xOf(d), yOf(hi(d))]); dn.push([xOf(d), yOf(lo(d))]); } return poly([...up, ...dn.reverse()]); };
  const NIGHT = '#2A2140', TWI = '#C9797A', DAY = '#F8D8A0', DAYHI = '#FCE9C4', frame = `M${X0},${Y0} H${X1} V${Y1} H${X0}Z`, fc = clip(frame);
  const g = [`<rect x="${X0}" y="${Y0}" width="${X1 - X0}" height="${Y1 - Y0}" fill="${NIGHT}"/>`];
  g.push(`<path d="${band(d => rise(d) - TW, d => set(d) + TW)}" fill="${TWI}"/><path d="${band(d => rise(d) - TW * 0.4, d => set(d) + TW * 0.4)}" fill="${mix(TWI, DAY, 0.55)}"/><path d="${band(rise, set)}" fill="${DAY}"/><path d="${band(d => rise(d) + 3.2, d => set(d) - 3.2)}" fill="${DAYHI}"/>`);
  g.push(grain(X0, Y0, X1 - X0, Y1 - Y0, GL(0, Y0, 0, Y1, [[0, 0.34], [0.22, 0.05], [0.78, 0.05], [1, 0.34]]), '#B9824E', { seed, opacity: 0.55 }));
  const months = [['May', 121], ['Jun', 152], ['Jul', 182], ['Aug', 213], ['Sep', 244], ['Oct', 274], ['', 305]];
  g.push(`<path d="${months.slice(1, 6).map(([, d]) => `M${f(xOf(d))},${Y0} V${Y1}`).join(' ')} ${[6, 12, 18].map(h => `M${X0},${f(yOf(h))} H${X1}`).join(' ')}" stroke="${PAPER}" stroke-width="0.8" opacity="0.28" fill="none"/>`);
  o.push(`<g clip-path="url(#${fc})">${g.join('')}</g>`);
  o.push(months.slice(0, 6).map(([mo, d], i) => T((xOf(d) + xOf(months[i + 1][1])) / 2, Y1 + 17, mo, { anchor: 'middle', size: 14, fill: INK2, cls: false })).join(''));
  o.push([[6, '6 am'], [12, 'noon'], [18, '6 pm']].map(([h, s]) => T(X0 - 7, yOf(h) + 4.6, s, { anchor: 'end', size: 13.5, fill: INK2, cls: false })).join(''));

  // ---- today, and what the park adds to the chart
  const DT = 259, xT = xOf(DT), yS = yOf(19.7), yR = yOf(6 + 58 / 60);
  { const hid = L.nid('ht'); L.defs.push(`<pattern id="${hid}" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(-45)"><rect width="7" height="7" fill="${CORAL_D}" opacity="0.5"/><rect width="2.6" height="7" fill="${CORAL}"/></pattern>`);
    // 2: the gate
    o.push(between(2, 2, `<path d="M${f(xT)},${f(yS)} H${X1}" stroke="${PAPER}" stroke-width="1.4" stroke-dasharray="5 4" fill="none"/>` + T(X1 - 6, yS - 7, wide ? 'gate locks 7:42' : 'gate locks', { size: 13, weight: 700, fill: PAPER, anchor: 'end', cls: false })));
    // 3 and 4: indoors by 7:42, from today on
    const tag = wide ? ['indoors by 7:42', 112] : ['indoors', 58];
    o.push(between(3, 4, `<g clip-path="url(#${fc})"><path d="M${f(xT)},${Y0} H${X1} V${f(yS)} H${f(xT)}Z" fill="url(#${hid})"/></g><path d="M${f(xT)},${f(yS)} H${X1}" stroke="${CORAL}" stroke-width="2" fill="none"/>`
      + `<rect x="${f(X1 - 6 - tag[1])}" y="${f(yS + 8)}" width="${tag[1]}" height="22" rx="4" fill="${PAPER}"/>` + T(X1 - 6 - tag[1] / 2, yS + 23.4, tag[0], { size: 13.5, weight: 700, fill: CORAL_D, anchor: 'middle', cls: false })));
    // 5 and 6: nothing is posted after today
    o.push(from(5, `<g clip-path="url(#${fc})"><rect x="${f(xT)}" y="${Y0}" width="${f(X1 - xT)}" height="${Y1 - Y0}" fill="#17122A"/></g>`) + between(5, 5, T((xT + X1) / 2, yOf(12.6), 'not posted', { size: 13, weight: 700, fill: mix(PAPER, NIGHT, 0.35), anchor: 'middle', cls: false })));
  }
  o.push(`<path d="M${f(xT)},${Y0} V${Y1}" stroke="${PAPER}" stroke-width="1.5" fill="none"/><circle cx="${f(xT)}" cy="${f(yS)}" r="4.4" fill="${PAPER}" stroke="${INK}" stroke-width="1.5"/><circle cx="${f(xT)}" cy="${f(yR)}" r="4.4" fill="${PAPER}" stroke="${INK}" stroke-width="1.5"/>`);
  o.push(T(xT - 24, Y1 - 6, 'today', { size: 13.5, weight: 700, fill: PAPER, anchor: 'end', alts: { 6: 'now' } }));
  // 4 on: the register. Each day's dots are set a little apart from the next day's, so they can be told from each other.
  o.push(from(4, REGISTER.map(([d, h]) => `<circle cx="${f(xT - (DT - d) * 8)}" cy="${f(yOf(h))}" r="4.2" fill="${CORAL}" stroke="${INK}" stroke-width="1.3"/>`).join('')));
  // 6: the reader, at the hour they opened the page (the page moves this mark; noon until it does)
  o.push(from(6, `<g class="you-mark" data-x="${f(xT)}" data-ya="${f(yOf(H0))}" data-yb="${f(yOf(H1))}" data-ha="${H0}" data-hb="${H1}" transform="translate(${f(xT)},${f(yOf(12))})"><circle r="10.5" fill="none" stroke="${CORAL}" stroke-width="1.6" opacity="0.6"/><circle r="5.4" fill="${CORAL}" stroke="${PAPER}" stroke-width="1.5"/>`
    + T(15, 5, 'you', { size: 14.5, weight: 700, fill: PAPER, cls: false }) + `</g>`));
  o.push(`<path d="${frame}" fill="none" stroke="${INK}" stroke-width="1.3"/>`);
  const note = ['We lose about three minutes of light a day in September.', { 2: 'The Lakeshore Rd gate locks at dusk now. Quiet hours start then too.', 3: 'Trails close at dusk and rangers sweep at 6. Be indoors by 7:42.', 4: "Each dot is someone who hasn't signed out. Two went out in daylight.", 5: "It's after 7:42.", 6: 'That mark is the time on your clock.' }];
  o.push(wide ? T(m, c.noteY, note[0], { size: 14.5, fill: INK2, alts: note[1] }) : lines2(m, c.noteY, 19, note[0], { size: 14.5, fill: INK2, alts: note[1] }, 46));
  o.push(tooth(W, H, seed + 1, 0.7));
  return o.join('\n');
}
export function daylight(){
  L.usePalette('gold'); L.begin();
  const wide = drawDaylight({ wide: true, W: 560, H: 330, m: 28, title: 25, titleY: 49, status: [532, 47, 'end'], small: 15, value: 23, ruleY: 64, cellY: 85, cells: [28, 204, 380], X0: 64, Y0: 128, Y1: 274, noteY: 311 }, 9201);
  const tall = drawDaylight({ wide: false, W: 360, H: 400, m: 18, title: 24, titleY: 45, status: [18, 68, 'start'], small: 14.5, value: 19, ruleY: 82, cellY: 104, cells: [18, 122, 222], X0: 52, Y0: 146, Y1: 316, noteY: 357 }, 9211);
  return twoLayouts(wide, tall, [560, 330], [360, 400]);
}

// ================= THE TRACK CARD =================
// A field-guide card: four animals, each with its print drawn to one scale, two lines about it, and a strip of its
// trail drawn to another. The slot at the bottom asks for tracks that are not on the card. From stage 2 it holds
// one: reported above the snowline, then measured at the Pass Hut. It is about six feet long and the prints are
// forty feet apart in one line, so at the card's two scales the print will not go in its box and the trail will not
// go on the card.
const PRINT = '#4B3E56', PRINT_DEEP = mix(PRINT, '#1D1626', 0.62), PRINT_LIT = mix(PRINT, PAPER, 0.4), PRINT_PAD = mix(PRINT, PAPER, 0.17);
// ---- the prints. Each is drawn toes up at 11 units to the inch, as lists of shapes:
//   body   what presses deep: pads, toes, the walls of a hoof
//   soft   what only shows in soft ground: claw tips, dew claws
//   pads   the sole of a hoof, which sits a little higher than its rim and so prints a little lighter
// `track` draws one as a dent in the ground lit from the upper left: the near wall in shadow, the far wall catching
// the light, the floor between them, and a stipple of grit over the lot.
const E = (cx, cy, rx, ry, rot = 0, tf = '') => ({ e: [cx, cy, rx, ry, rot], tf });
const D = (d, tf = '') => ({ d, tf });
const els = (list, pre = '') => list.map(s => { const tf = `${pre} ${s.tf || ''}`.trim(); return s.d ? `<path d="${s.d}"${tf ? ` transform="${tf}"` : ''}/>` : `<ellipse cx="${s.e[0]}" cy="${s.e[1]}" rx="${s.e[2]}" ry="${s.e[3]}" transform="${`${tf} rotate(${s.e[4]} ${s.e[0]} ${s.e[1]})`.trim()}"/>`; }).join('');
const TRACKS = {
  // Right hind foot. It is shaped a little like a person's bare foot: a broad pad that narrows to the heel, and five
  // toes in an arc ahead of it with a strip of fur between. The smallest toe is the inside one. Claw tips just ahead.
  bear: () => {
    const toes = [[-19.4, -20, 3.6, 4.7, -24], [-10.2, -26.1, 4.3, 5.8, -11], [-0.2, -28.6, 4.6, 6.3, -1], [9.9, -26.5, 4.4, 6, 9], [18.9, -21, 4.1, 5.3, 21]];
    const pad = 'M-17,-12 C-10,-16.5 4,-17 17.5,-11.5 C20.8,-10 21.8,-5.5 21.2,-1 C20,9 16.5,22 11.5,31.5 C8.6,37.2 3.6,40.6 -1.6,40 C-6.6,39.4 -10,35.4 -11.2,29.6 C-12.6,21.6 -13.4,12 -17.6,2.4 C-19.6,-2.2 -20.4,-8.4 -17,-12Z';
    const claws = toes.map(([x, y, rx, ry, rot]) => { const a = rad(rot), d = ry + 2.8; return D('M-1.05,0.5 Q-0.5,-2.8 0,-4.4 Q0.5,-2.8 1.05,0.5 Q0,1.3 -1.05,0.5Z', `translate(${f(x + Math.sin(a) * d)},${f(y - Math.cos(a) * d)}) rotate(${rot})`); });
    return { body: [D(pad), ...toes.map(t => E(...t))], soft: claws, mid: -0.75 };
  },
  // A cloven hoof: two halves that come to blunt, rounded tips, widest behind the middle, the whole print the shape
  // of an upside-down heart. Behind it the two dew claws, which only reach the ground when it is soft.
  elk: () => {
    const half = 'M-2.8,-25 C-9.6,-21.4 -15.8,-12 -17.4,-1.8 C-18.8,6.8 -17.4,15.8 -13.2,20.6 C-9.8,24.5 -4.6,24.6 -2.2,20.8 C-0.9,18.6 -1.2,14 -1.5,9 C-1.9,-1.6 -2.9,-12 -1.7,-19.4 C-1.5,-21.6 -1.9,-23.6 -2.8,-25Z';
    const sole = 'M-5,-16.4 C-9.6,-12 -13.4,-5.6 -14.3,-0.6 C-15.2,6 -14.4,12.8 -11.5,16.6 C-9.4,19.3 -6,19.1 -4.8,16.4 C-4,14.4 -4.3,9 -4.5,4 C-4.7,-4 -5.4,-10.6 -5,-16.4Z';
    const other = 'translate(0.3,-0.7) scale(-0.985,1.015)';
    return { body: [D(half), D(half, other)], pads: [D(sole), D(sole, other)], soft: [E(-10.6, 33.2, 2.6, 3.8, -18), E(10.9, 32.6, 2.6, 3.8, 18)], mid: 6 };
  },
  // The same foot at a little over half the size, narrower, and drawn out to sharp tips.
  deer: () => {
    const half = 'M-1.3,-16.2 C-4,-12.4 -8.8,-5.4 -10,1.8 C-10.8,7.2 -9.8,12 -6.8,13.5 C-4.4,14.7 -2,13.5 -1.3,10.9 C-0.8,6 -0.9,-1 -1.6,-6.6 C-1.9,-10.2 -1.2,-13.6 -1.3,-16.2Z';
    const sole = 'M-3.2,-8.6 C-5.6,-5 -7.7,-0.6 -7.9,3.6 C-8.1,7.4 -7.3,10.3 -5.6,10.9 C-4.3,11.3 -3.3,10.4 -3.1,8.9 C-2.9,4 -3.1,-3 -3.2,-8.6Z';
    const other = 'translate(0.2,-0.4) scale(-0.98,1.02)';
    return { body: [D(half), D(half, other)], pads: [D(sole), D(sole, other)], mid: -0.8 };
  },
  // One bound. The two long hind feet land side by side, toes spread, and ahead of where the forefeet came down:
  // those are the two small prints behind, one after the other.
  hare: () => {
    const hind = (px, py, a) => { const tf = `translate(${px},${py}) rotate(${a})`; return [D('M0,-22.4 C7.8,-22.4 11.4,-13 11,-3.5 C10.6,6 9,17 6.2,23.4 C4.4,27.4 -4.4,27.4 -6.2,23.4 C-9,17 -10.6,6 -11,-3.5 C-11.4,-13 -7.8,-22.4 0,-22.4Z', tf), E(-7.7, -17.6, 2.8, 4.3, -17, tf), E(-2.7, -22, 2.8, 4.6, -5, tf), E(2.7, -22, 2.8, 4.6, 5, tf), E(7.7, -17.6, 2.8, 4.3, 17, tf)]; };
    const fore = (px, py, a) => { const tf = `translate(${px},${py}) rotate(${a})`; return [E(0, 1.5, 5.6, 6.2, 0, tf), E(-4.2, -4.4, 1.9, 2.7, -16, tf), E(-1.5, -6.6, 1.9, 2.9, -5, tf), E(1.5, -6.6, 1.9, 2.9, 5, tf), E(4.2, -4.4, 1.9, 2.7, 16, tf)]; };
    return { body: [...hind(-14, -15.5, -8), ...hind(14, -15.5, 8), ...fore(-6.5, 24, -8), ...fore(6.5, 29.5, 9)], mid: -2.5 };
  },
};
// one print, centred on (cx, cy) at k times its drawn size; box is the frame it sits in, for the stipple
function track(name, cx, cy, k, seed, box){
  const t = TRACKS[name](), tf = `translate(${f(cx)},${f(cy - t.mid * k)}) scale(${Math.round(k * 1000) / 1000})`, DX = 1.1, DY = 1.5, a = L.nid('tk'), b = L.nid('tk'), g = L.nid('tk'), body = `<use href="#${g}"/>`;
  // the shapes are written out once for drawing, and once for each of the two outlines the shading is cut to
  L.defs.push(`<g id="${g}">${els(t.body)}</g><clipPath id="${a}" transform="${tf}">${els(t.body)}</clipPath><clipPath id="${b}" transform="${tf} translate(${DX},${DY})">${els(t.body)}</clipPath>`);
  return `<g transform="${tf}">` + (t.soft ? `<g fill="${PRINT}" opacity="0.6">${els(t.soft)}</g>` : '') + `<g fill="${PRINT_DEEP}">${body}</g></g>`
    + `<g clip-path="url(#${a})"><g transform="${tf} translate(${DX},${DY})" fill="${PRINT_LIT}">${body}</g>`
    + `<g clip-path="url(#${b})"><g transform="${tf}"><g transform="translate(${-DX},${-DY})" fill="${PRINT}">${body}</g>` + (t.pads ? `<g fill="${PRINT_PAD}">${els(t.pads)}</g>` : '') + `</g></g>`
    + grain(box[0], box[1], box[2], box[3], GL(box[0], box[1], box[0] + box[2], box[1] + box[3], [[0, 0.1], [1, 0.4]]), PRINT_DEEP, { seed }) + `</g>`;
}
// ---- the same feet as marks along a trail, heading right, in inches
const circ = (cx, cy, r) => `M${f(cx - r)},${f(cy)} C${f(cx - r)},${f(cy - r * 0.55)} ${f(cx - r * 0.55)},${f(cy - r)} ${f(cx)},${f(cy - r)} C${f(cx + r * 0.55)},${f(cy - r)} ${f(cx + r)},${f(cy - r * 0.55)} ${f(cx + r)},${f(cy)} C${f(cx + r)},${f(cy + r * 0.55)} ${f(cx + r * 0.55)},${f(cy + r)} ${f(cx)},${f(cy + r)} C${f(cx - r * 0.55)},${f(cy + r)} ${f(cx - r)},${f(cy + r * 0.55)} ${f(cx - r)},${f(cy)}Z`;
const shift = (d, dx, dy) => d.replace(/(-?\d+\.?\d*),(-?\d+\.?\d*)/g, (_, x, y) => `${f(+x + dx)},${f(+y + dy)}`);
const HOOF = 'M-2.2,-0.22 C-2.4,-1.3 -1.3,-1.75 -0.2,-1.6 C0.9,-1.45 1.9,-0.75 2.3,-0.18 C1,-0.34 -1,-0.34 -2.2,-0.22Z M-2.2,0.22 C-2.4,1.3 -1.3,1.75 -0.2,1.6 C0.9,1.45 1.9,0.75 2.3,0.18 C1,0.34 -1,0.34 -2.2,0.22Z';
const HARE_HIND = 'M-2.6,0 C-2.4,-0.6 -0.6,-1 0.9,-1 C2,-1 2.5,-0.5 2.5,0 C2.5,0.5 2,1 0.9,1 C-0.6,1 -2.4,0.6 -2.6,0Z';
const MARKS = {
  bear: 'M-3.3,0 C-3.3,-1 -1.6,-1.8 -0.1,-1.9 C1,-1.95 1.5,-1.1 1.5,0 C1.5,1.1 1,1.95 -0.1,1.9 C-1.6,1.8 -3.3,1 -3.3,0Z ' + [[2.3, -1.9, 0.5], [2.9, -1, 0.55], [3.1, 0, 0.58], [2.9, 1, 0.55], [2.3, 1.9, 0.5]].map(c => circ(...c)).join(' '),
  elk: [HOOF, 1], deer: [HOOF, 0.62],
  hare: shift(HARE_HIND, 2.6, -1.5) + ' ' + shift(HARE_HIND, 2.6, 1.5) + ' ' + circ(-2.4, 0.5, 0.8) + ' ' + circ(-4.8, -0.4, 0.8),
  boot: 'M-1.4,-1.9 C0.8,-2.3 3.8,-2.2 5,-1.5 C5.9,-1 5.9,1 5,1.5 C3.8,2.2 0.8,2.2 -1.4,1.7 C-1.8,0.6 -1.8,-0.8 -1.4,-1.9Z M-5.4,-1.5 C-4.4,-1.8 -3.2,-1.8 -2.5,-1.6 C-2.3,-0.6 -2.3,0.6 -2.5,1.5 C-3.2,1.7 -4.4,1.7 -5.4,1.4 C-5.8,0.6 -5.8,-0.7 -5.4,-1.5Z',
};
function drawTracks(c, seed){
  const { W, H, m, BW, IN, FT, wide } = c, RX = W - m, BX = m, TX = m + BW + (wide ? 18 : 14), o = [sheet(W, H)], card = clip(`M10,10 H${W - 10} V${H - 10} H10Z`);
  // a strip of trail: marks at the trail's scale, the way each animal sets its feet down
  // The distance between marks is to the trails' scale. The marks themselves are drawn half as large again as that
  // (the boots at stage 6 a quarter), or they would be specks. step: feet from one mark to the next; wide: inches each
  // lands to the side of the trail's middle.
  const inch = FT / 12, mk = L.nid('mk');
  for (const [name, v] of Object.entries(MARKS)) { const [d, k] = Array.isArray(v) ? v : [v, 1]; L.defs.push(`<path id="${mk}${name}" d="${d}" transform="scale(${Math.round(inch * k * (name === 'boot' ? 1.25 : 1.5) * 1000) / 1000})"/>`); }
  const walk = (name, x0, x1, y, step, wide, lead = 8) => { let d = ''; for (let x = x0 + lead, n = 0; x < x1 - 6; x += step * FT, n++) d += `<use href="#${mk}${name}" x="${f(x)}" y="${f(y + (n % 2 ? 1 : -1) * wide * inch)}"/>`; return d; };

  // ---- stages 4 and 5: the print at the card's own scale, lying under the lower half of it
  { const big = `<ellipse cx="${f(W * 0.37)}" cy="${f(H * 0.8)}" rx="${f(36 * IN)}" ry="${f(21 * IN)}"/>`;
    o.push(from(4, `<g clip-path="url(#${card})"><g fill="${PRINT}" opacity="0.1">${big}</g><g fill="none" stroke="${PRINT}" stroke-width="1.2" opacity="0.4" stroke-dasharray="1.5 5" stroke-linecap="round">${big}</g></g>`) + from(5, `<g clip-path="url(#${card})" fill="${PRINT}" opacity="0.1">${big}</g>`)); }

  // ---- the head of the card
  o.push(T(m, c.titleY, 'Whose track is that?', { font: 'serif', size: c.title, alts: { 5: 'One track left', 6: 'The track behind yours' } }));
  o.push(T(m, c.titleY + 25, "The four you're most likely to find.", { size: c.body, fill: INK2, alts: { 2: 'The usual four, and one new one.', 4: 'No sign of the first four since Sept. 14.', 5: 'The other four are gone.', 6: 'Yours are the small ones.' } }));
  if (wide) o.push(span(RX - 6 * IN, RX, 46) + T(RX - 6 * IN - 8, 51, 'prints, 6 in', { anchor: 'end', size: 13.5, fill: INK2, cls: false }) + span(RX - 10 * FT, RX, 72) + T(RX - 10 * FT - 8, 77, 'trails, 10 ft', { anchor: 'end', size: 13.5, fill: INK2, cls: false }));
  else o.push(span(m, m + 6 * IN, c.headY - 16) + T(m + 6 * IN + 8, c.headY - 11, 'prints, 6 in', { size: 13.5, fill: INK2, cls: false }) + span(RX - 10 * FT, RX, c.headY - 16) + T(RX - 10 * FT - 8, c.headY - 11, 'trails, 10 ft', { anchor: 'end', size: 13.5, fill: INK2, cls: false }));
  o.push(rule(m, c.headY, RX, c.headY));

  // ---- the four animals
  const rows = [
    { art: 'bear', name: 'Black bear', l2: 'Hind print 7 in. About 2 ft apart.', l3: ['Five toes, and a claw mark ahead of each.', { 2: 'No fresh sign since late August.', 3: 'Left in late August, along the highway.', 4: 'None.', 5: 'No longer listed.' }], strip: (x, y) => walk('bear', x, RX, y, 2, 3.4) },
    { art: 'elk', name: 'Roosevelt elk', l2: 'Print 4½ in. About 3 ft apart.', l3: ['Heart-shaped, with rounded tips.', { 2: "The bulls haven't bugled once this year.", 3: "All facing the east trees. Don't look there.", 4: 'Not seen since Sept. 14.', 5: 'No longer listed.' }], strip: (x, y) => walk('elk', x, RX, y, 3, 2.2) },
    { art: 'deer', name: 'Black-tailed deer', l2: 'Print 2¾ in. About 2 ft apart.', l3: ['Like an elk print, smaller and pointed.', { 4: 'None counted on Sept. 14.', 5: 'No longer listed.' }], strip: (x, y) => walk('deer', x, RX, y, 2, 1.6) },
    { art: 'hare', name: 'Snowshoe hare', l2: 'Hind print 5 in. Sets 3 to 6 ft apart.', l3: ['The big hind feet land ahead of the front.', { 4: 'None counted on Sept. 14.', 5: 'No longer listed.' }], strip: (x, y) => walk('hare', x, RX, y, 4.5, 0, 12) },
  ];
  rows.forEach((r, i) => {
    const y = c.headY + 6 + i * c.pitch, art = track(r.art, BX + BW / 2, y + 4 + BW / 2, IN / 11, seed + 20 + i, [BX, y + 4, BW, BW]);
    const sx = wide ? TX : m, sy = y + c.stripDy;
    o.push(`<rect x="${BX}" y="${y + 4}" width="${BW}" height="${BW}" rx="5" fill="${WHITE}" stroke="${INK}" stroke-width="1"/>`);
    // the print stays through stage 4, when it is faded back to show nothing has been found; the trail goes a stage sooner
    o.push(until(4, art) + between(4, 4, `<rect x="${BX + 1}" y="${y + 5}" width="${BW - 2}" height="${BW - 2}" rx="4" fill="${WHITE}" opacity="0.76"/>`)
      + until(3, `<path d="M${sx},${sy} H${RX}" stroke="${INK}" stroke-width="0.7" stroke-dasharray="1 5" opacity="0.3"/><g fill="${PRINT}">${r.strip(sx, sy)}</g>`));
    o.push(T(TX, y + c.nameDy, r.name, { font: 'serif', size: c.name, cls: false }) + T(TX, y + c.l2Dy, r.l2, { size: c.body, weight: 650, cls: false }) + T(wide ? TX : m, y + c.l3Dy, r.l3[0], { size: c.body - 0.5, fill: INK2, alts: r.l3[1] }));
    o.push(rule(m, y + c.pitch + 1, RX, y + c.pitch + 1, { opacity: 0.3 }));
  });

  // ---- the slot at the bottom
  const by = c.headY + 6 + 4 * c.pitch + 12;
  const qbox = (x) => `<rect x="${x}" y="${by}" width="${BW}" height="${BW}" rx="5" fill="none" stroke="${INK}" stroke-width="1.1" stroke-dasharray="5 4"/>` + T(x + BW / 2, by + BW / 2 + 16, '?', { font: 'serif', size: 46, anchor: 'middle', fill: INK2, cls: false });
  const ask = 'Put a boot or a water bottle beside it for scale, take a photo, and show it to any ranger.';
  if (wide) o.push(until(1, T(m, by + 30, "Found one that isn't here?", { font: 'serif', size: c.name, cls: false }) + lines2(m, by + 56, 21, ask, { size: c.body, fill: INK2, cls: false }, 49) + qbox(RX - BW)));
  else o.push(until(1, qbox(BX) + T(TX, by + 30, 'Found one that', { font: 'serif', size: c.name, cls: false }) + T(TX, by + 54, "isn't here?", { font: 'serif', size: c.name, cls: false }) + lines2(m, by + BW + 24, 20, ask, { size: c.body, fill: INK2, cls: false }, 46)));
  // where to look, in the space the last line of the card will need later
  const where = 'Best places to look: mud along the Lakeshore Loop, and snow above 7,500 ft.';
  o.push(until(2, wide ? T(m, H - 36, where, { size: c.body - 0.5, fill: INK2, cls: false }) : lines2(m, H - 54, 20, where, { size: c.body - 0.5, fill: INK2, cls: false }, 46)));
  // 2: reported, not identified
  o.push(between(2, 2, qbox(BX)));
  // 3: measured. At the scale of the other prints only its edge will go in the box.
  { const bc = clip(`M${BX},${by} h${BW} v${BW} h${-BW}Z`), erx = 36 * IN, ery = 21 * IN, es = 0.852, edge = `<ellipse cx="${f(BX + BW * 0.42 - es * erx)}" cy="${f(by + BW * 0.6 + ery * Math.sqrt(1 - es * es))}" rx="${f(erx)}" ry="${f(ery)}"/>`;
    o.push(from(3, `<rect x="${BX}" y="${by}" width="${BW}" height="${BW}" rx="5" fill="${WHITE}"/>`));
    o.push(between(3, 3, `<g clip-path="url(#${bc})"><g fill="${PRINT}">${edge}</g><g fill="none" stroke="${mix(PRINT, PAPER, 0.42)}" stroke-width="6" transform="translate(-9,9)">${edge}</g></g>` + grain(BX, by, BW, BW, GL(BX + BW, by, BX, by + BW, [[0, 0], [0.45, 0.1], [1, 0.5]]), '#1D1626', { seed: seed + 3, clipId: bc })));
    o.push(from(4, `<rect x="${BX}" y="${by}" width="${BW}" height="${BW}" rx="5" fill="${PRINT}"/>` + grain(BX, by, BW, BW, GL(BX, by, BX + BW, by + BW, [[0, 0.1], [1, 0.5]]), '#1D1626', { seed: seed + 2, clipId: bc })));
    o.push(from(3, `<rect x="${BX}" y="${by}" width="${BW}" height="${BW}" rx="5" fill="none" stroke="${INK}" stroke-width="1"/>`)); }
  const lx = wide ? TX : m, ly = wide ? by + 50 : by + BW + 24;
  o.push(from(2, T(TX, by + (wide ? 27 : 42), 'Not listed yet', { font: 'serif', size: c.name, alts: { 3: 'Not listed', 6: 'Behind you' } })
    + T(lx, ly, 'Reported above 7,500 ft on the pass trail.', { size: c.body, weight: 650, alts: { 3: 'About 6 ft long. 40 ft apart, in one line.', 6: 'Its last print is 38 ft behind you.' } })
    + T(lx, ly + 21, 'Round. No toes that we can make out.', { size: c.body - 0.5, fill: INK2, alts: { 3: "Don't follow it. Don't stand in it.", 4: 'Straight from the pass, and through the lake.', 5: 'It is the only track left in the park.', 6: 'Its stride is 40 ft.' } })));
  // its trail, at the scale of the other trails: two prints, and the second one does not fit on the card
  { const sy = H - 43, dy = sy - 31, x1 = m + 3 * FT, x2 = x1 + 40 * FT, hrx = 3 * FT, hry = 1.8 * FT;
    const oval = (x, y) => `M${f(x - hrx)},${f(y)} a${f(hrx)},${f(hry)} 0 1 0 ${f(hrx * 2)},0 a${f(hrx)},${f(hry)} 0 1 0 ${f(-hrx * 2)},0Z`;
    // a hole, shaded like the prints above it: the near wall dark, the far wall catching the light
    const hole = (x, dash) => { if (dash) return `<ellipse cx="${f(x)}" cy="${sy}" rx="${f(hrx)}" ry="${f(hry)}" fill="none" stroke="${CORAL_D}" stroke-width="1.6" stroke-dasharray="5 4"/>`;
      const ca = clip(oval(x, sy)), cb = clip(oval(x + 2.2, sy + 2.8)); return `<path d="${oval(x, sy)}" fill="${PRINT_DEEP}"/><g clip-path="url(#${ca})"><path d="${oval(x + 2.2, sy + 2.8)}" fill="${PRINT_LIT}"/><g clip-path="url(#${cb})"><path d="${oval(x - 2.2, sy - 2.8)}" fill="${PRINT}"/></g></g>`; };
    const measure = (xa, xb, label) => span(xa, xb, dy) + T((xa + xb) / 2, dy - 7, label, { anchor: 'middle', size: 14.5, weight: 700, cls: false });
    o.push(from(3, `<g clip-path="url(#${card})">${hole(x1)}` + between(3, 5, hole(x2)) + `</g>` + between(3, 5, measure(x1, RX - 6, '40 ft')
      + `<path d="M${f(x1 + 3 * FT + 6)},${sy} H${f(x2 - 3 * FT - 6)}" stroke="${PRINT}" stroke-width="1" stroke-dasharray="1 6" stroke-linecap="round" opacity="0.6"/>`)));
    // 6: your own prints lead away from its last one and stop. The broken outline is where its next one comes down.
    const you = x2 - 2 * FT, boots = walk('boot', x1 + 4.5 * FT, you - 2, sy, 2.5, 3.6, 0);
    o.push(from(6, `<g fill="${INK}" opacity="0.85">${boots}</g><g clip-path="url(#${card})">${hole(x2, true)}</g><circle cx="${f(you)}" cy="${sy}" r="4.6" fill="${PAPER}" stroke="${CORAL_D}" stroke-width="2"/><circle cx="${f(you)}" cy="${sy}" r="1.5" fill="${CORAL_D}"/>` + T(you - 9, sy - 9, 'you', { anchor: 'end', size: 14.5, weight: 700, fill: CORAL_D, cls: false, halo: PAPER }) + measure(x1, you, '38 ft'))); }
  o.push(tooth(W, H, seed + 1, 0.7));
  return o.join('\n');
}
export function tracks(){
  L.usePalette('gold'); L.begin();
  const wide = drawTracks({ wide: true, W: 560, H: 692, m: 28, BW: 92, IN: 10.4, FT: 12, title: 27, titleY: 52, body: 15.5, name: 21, headY: 92, pitch: 100, nameDy: 30, l2Dy: 52, l3Dy: 72, stripDy: 89 }, 9300);
  const tall = drawTracks({ wide: false, W: 360, H: 860, m: 18, BW: 72, IN: 7.8, FT: 7.9, title: 24, titleY: 45, body: 15, name: 20, headY: 116, pitch: 124, nameDy: 34, l2Dy: 58, l3Dy: 98, stripDy: 113 }, 9310);
  return twoLayouts(wide, tall, [560, 692], [360, 860]);
}
