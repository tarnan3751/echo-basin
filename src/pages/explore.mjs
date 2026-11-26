// The Explore page: the four landscapes, from the pass to the lake. The heading and intro are one scored block and
// each of the four ladder entries is another; the only markers are the two pictures' own.
// Each landscape's name leads to the trail page for it, Echo Lake's to the Lakeshore Loop, and under the ladder one
// link leads to the ranger programs (bible 12), in the footer's words for that page.
import { C } from '../content.mjs';
import { pageTitles, rewordings } from '../content/split.mjs';
import { TRAILS } from '../trail.mjs';
import { esc, el, t, plate, checked } from '../html.mjs';

// the trail for each landscape, in the ladder's order: Echo Pass, Halloran Meadows, Cathedral Stand, Echo Lake
const TO = [TRAILS[4], TRAILS[3], TRAILS[1], TRAILS[0]];
// Echo Lake's stage 5 line says the reader looked at the lake for a long time, so it is shown only if they did (bible
// 10.6, the test "lake"), with the copy's plain line otherwise.
const LAKE = C.zones.items[3].body, said = rewordings.find(r => r.new === LAKE[1][5]);
const body = (z, i) => i === 3 ? checked(LAKE, 5, 'lake', said.fallback) : z.body;

const zones = ctx => `<section class="sec zones" id="zones">
<div class="wrap zones__grid">
  <div class="zones__text">
    <div data-read="zones">
    ${el('h1', 'mis', C.zones.h2)}
    ${el('p', 'lede', C.zones.intro)}
    </div>
    <ol class="ladder">${C.zones.items.map((z, i) => `<li data-read="${['pass', 'meadows', 'stand', 'lake'][i]}"><div class="ladder__alt">${t(z.alt)}</div><div><h3><a href="${esc(ctx.url(TO[i]))}">${t(z.name)}</a></h3>${el('p', '', body(z, i))}</div></li>`).join('')}</ol>
    <p class="zones__go"><a class="lnk lnk--go" href="${esc(ctx.url('programs/'))}">Ranger programs</a></p>
  </div>
  <div class="zones__plates">
    ${plate('oldgrowth', { cls: 'plate--tall', ar: '4/5', cap: C.zones.capA })}
    ${plate('high', { cls: 'plate--over', ar: '5/3', arm: '700/560', cap: C.zones.capB })}
  </div>
</div>
</section>`;

export default {
  path: 'explore/index.html',
  titles: pageTitles.explore,
  description: 'The four landscapes of Echo Basin National Park, from the pass to the lake. A work of fiction.',
  main: ctx => zones(ctx),
};
