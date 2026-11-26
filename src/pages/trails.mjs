// The Trails page: the heading and intro, the table of trails, and the note with the park map. Each is a scored block.
// The table's marker and the map's own are the page's two. Each row's name leads to that trail's page; the column
// heads and the pages' addresses are shared with the trail pages (src/trail.mjs).
import { C } from '../content.mjs';
import { pageTitles } from '../content/split.mjs';
import { HEAD, TRAILS } from '../trail.mjs';
import { esc, el, t, plate } from '../html.mjs';

const trails = ctx => `<section class="sec trails" id="trails">
<div class="wrap">
  <div class="split" data-read="trails">
    ${el('h1', 'mis', C.trails.h2)}
    ${el('p', 'lede', C.trails.intro)}
  </div>
  <div class="tbl-wrap" data-read="table" data-mark="0.5"><table class="tbl">
    <thead><tr>${HEAD.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
    <tbody>${C.trails.rows.map((r, i) => `<tr><th scope="row"><b>${r[0]}</b><a href="${esc(ctx.url(TRAILS[i]))}">${t(r[1])}</a></th><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td class="status">${t(r[5])}</td></tr>`).join('')}</tbody>
  </table></div>
  <div data-read="map">
  ${el('p', 'note', C.trails.note)}
  ${plate('map', { cls: 'plate--map', ar: '10/7', arm: '640/700', cap: C.trails.cap })}
  </div>
</div>
</section>`;

export default {
  path: 'trails/index.html',
  titles: pageTitles.trails,
  description: 'Day hikes and the park map for Echo Basin National Park. A work of fiction.',
  main: ctx => trails(ctx),
};
