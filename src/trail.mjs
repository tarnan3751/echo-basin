// The five trail pages share one template, so that they read as a set (bible 12, "Four trail pages", and the Echo
// Point page's header). Each page module gives its copy (src/content/trail-*.mjs), its row of the trail table, its
// map window and its own picture, and this lays them out the same way every time:
//
//   the heading and intro    the trail's name, with its number from the park map, beside the intro (scored: trail)
//   the hiker's card         the status, then distance, climb and time, then the page's own facts (scored: facts).
//                            The status box carries a marker: it is the thing on the page that changes.
//   the map window           the trail on its piece of the park map, with its caption (scored: map, and its marker)
//   the walk                 the description, with no heading of its own: it carries on from the intro (scored: walk)
//   what to look for         and before you go, each under its heading (scored: look, know)
//   the page's picture       under all of that, at the width it was drawn for (scored under its own name, marker)
//   the way on               the trails either side of this one in the table's order, and all of them
//
// That is seven scored sections and two pictures, of which a page adds at most seven points to the score (RULES.cap
// in src/runtime.js), as any page does.
// The card and the map sit in the left-hand column, under the heading; the walk and the two lists in the right-hand
// one, under the intro, so the reading runs straight on down. The Echo Point page has no walk or lists: its card and
// map stand side by side, and the existing "How the echo works" section follows in place of the picture.
// Distance, climb, time and status are the trail table's own, row for row and stage for stage, under the table's
// own column heads, which are kept here for both. The only words this adds are the trail names and "All trails" in
// the way on.
import { C } from './content.mjs';
import { esc, el, w, plate, plateOr } from './html.mjs';

// the trail table's column heads, here and on the Trails page
export const HEAD = ['Trail', 'Distance', 'Climb', 'Time', 'Status'];
// each trail's page, in the order of the table's rows (trail 1 to trail 5)
export const TRAILS = ['trails/lakeshore-loop/', 'trails/cathedral-stand/', 'trails/echo-point/', 'trails/halloran-meadows/', 'trails/echo-pass/'];
const ALL = 'All trails';

// The card: the status first and largest, then the three numbers in a row, then start and terrain one to a line.
// It is one list of terms, so a screen reader hears each figure with its name.
const card = (row, facts) => `<dl class="trail__card" data-read="facts">
    <div class="trail__status" data-mark><dt>${esc(HEAD[4])}</dt>${el('dd', '', row[5])}</div>
    ${[2, 3, 4].map(k => `<div class="trail__num"><dt>${esc(HEAD[k - 1])}</dt><dd>${w(row[k])}</dd></div>`).join('')}
    ${facts.map(([k, v]) => `<div class="trail__fact"><dt>${w(k)}</dt>${el('dd', '', v)}</div>`).join('')}
  </dl>`;

// what to look for: the things by name, each with its note under it
const look = l => `<div class="trail__look" data-read="look">
      ${el('h2', 'mis', l.h2)}
      <dl>${l.items.map(([k, v]) => `<div><dt>${w(k)}</dt>${el('dd', '', v)}</div>`).join('')}</dl>
    </div>`;
const know = k => `<div class="trail__know" data-read="know">
      ${el('h2', 'mis', k.h2)}
      <ul>${k.items.map(x => el('li', '', x)).join('')}</ul>
    </div>`;

// The trails either side of this one in the table, and the Trails page. The first trail has nothing before it and the
// last nothing after, so each keeps its place in the row whether or not it is there.
const onward = (ctx, i) => {
  const to = j => j < 0 || j >= TRAILS.length ? '<span></span>' : `<a class="lnk ${j < i ? 'lnk--back' : 'lnk--go'}" href="${esc(ctx.url(TRAILS[j]))}" rel="${j < i ? 'prev' : 'next'}">${esc(C.trails.rows[j][1])}</a>`;
  return `<div class="wrap"><nav class="onward">${to(i - 1)}<a class="lnk" href="${esc(ctx.url('trails/'))}">${ALL}</a>${to(i + 1)}</nav></div>`;
};

// The page's own picture, at most as wide as it was drawn (bleed: the full width of the screen, as the elk are).
// pic: { name, ar, arm, narrow, width, bleed, cap, label }. The pictures that have to be seen at their full width
// change to their phone layout below their own narrow width, and the stylesheet changes their shape there too
// (plate--survey, plate--profile). It is drawn by plateOr(), so a painting not yet registered in src/scenes.mjs is
// a placeholder of its shape, with its caption, label and marker, and the page needs no change when it arrives.
const picture = pic => {
  const fig = plateOr(pic.name, { cls: pic.bleed ? 'plate--bleed' : `plate--info plate--${pic.name}`, ar: pic.ar, arm: pic.arm, narrow: pic.narrow, cap: pic.cap, label: pic.label });
  return `<div class="trail__pic${pic.bleed ? ' trail__pic--bleed' : ''}" data-read="${esc(pic.name)}"${pic.width ? ` style="--w:${pic.width}px"` : ''}>${pic.bleed ? fig : `<div class="wrap">${fig}</div>`}</div>`;
};

// One trail page's <main>. n is the trail's number in the table (1 to 5), copy its content file, map the name of its
// map window and mapAr that window's shape, and after either the page's picture ({ name, ... }, as above) or HTML of
// the page's own to go in its place (the Echo Point page's echo section).
export const trailMain = (ctx, { n, copy, map, mapAr, after }) => {
  const i = n - 1, row = C.trails.rows[i], full = !!copy.walk;
  return `<section class="sec trail" id="trail">
<div class="wrap">
  <div class="split trail__head" data-read="trail">
    <h1 class="mis"><b class="trail__no" aria-hidden="true">${esc(row[0])}</b>${esc(copy.name)}</h1>
    ${el('p', 'lede', copy.intro)}
  </div>
  <div class="trail__grid${full ? '' : ' trail__grid--short'}">
    <div class="trail__side">
      ${card(row, copy.facts)}
      <div class="trail__map" data-read="map">${plate(map, { cls: 'plate--info', ar: mapAr, cap: copy.mapCap })}</div>
    </div>
    ${full ? `<div class="trail__main">
      <div class="trail__walk" data-read="walk">${copy.walk.map(p => el('p', '', p)).join('')}</div>
      ${look(copy.look)}
      ${know(copy.know)}
    </div>` : ''}
  </div>
</div>
${typeof after === 'string' ? after : picture(after)}
${onward(ctx, i)}
</section>`;
};
