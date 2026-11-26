// The Echo Point page, trail 3: the trail template's header (src/trail.mjs), with the card and the map window side by
// side since this trail has no walk of its own written up, and under it the information graphic of how the echo
// works, as it was. That section's heading is now an h2, the trail's name being the page's h1; its words, its picture
// and its marker are unchanged. The graphic is drawn in two layouts and changes to its narrow one below 900 pixels.
import { C } from '../content.mjs';
import { trailEchoPoint as T } from '../content/trail-echo-point.mjs';
import { trailMain } from '../trail.mjs';
import { el, plate } from '../html.mjs';

const echoSec = () => `<section class="echo" id="echo" data-read="echo">
<div class="wrap">
  <div class="split">
    ${el('h2', 'mis', C.echo.h2)}
    ${el('p', 'lede', C.echo.intro)}
  </div>
  ${plate('echo', { cls: 'plate--info plate--echo', ar: '1200/640', arm: '420/632', cap: C.echo.cap, narrow: 900, label: C.echo.label })}
</div>
</section>`;

export default {
  path: 'trails/echo-point/index.html',
  titles: T.titles,
  description: 'The Echo Point trail and how the echo works, Echo Basin National Park. A work of fiction.',
  main: ctx => trailMain(ctx, { n: 3, copy: T, map: 'mapEchoPoint', mapAr: '640/441', after: echoSec() }),
};
