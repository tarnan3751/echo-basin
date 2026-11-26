// The Lodging page: the heading and intro, the list of ways to stay and the Cedar Flats site plan are the three scored
// blocks. The lodge picture has its own marker, the list has one, and the site plan has its own (bible 12).
// The site plan belongs with the campsite entry, and goes under the list at the width it was drawn for, about 900
// pixels. Below that it is shown in its phone layout, turned to run down the screen, at a phone's width. It is drawn
// by plateOr(), which leaves a placeholder of the same shape until the picture is registered in src/scenes.mjs.
import { C } from '../content.mjs';
import { pageTitles, sitePlan } from '../content/split.mjs';
import { el, t, plate, plateOr } from '../html.mjs';

const stay = () => `<section class="sec stay dusk" id="stay">
<div class="wrap stay__grid">
  <div>${plate('lodge', { ar: '8/5', cap: C.stay.cap })}</div>
  <div>
    <div data-read="stay">
    ${el('h1', 'mis', C.stay.h2)}
    ${el('p', 'lede', C.stay.intro)}
    </div>
    <ul class="opts" data-read="options" data-mark>${C.stay.opts.map(o => `<li><div class="opts__h"><h3>${t(o[0])}</h3><span>${t(o[1])}</span></div>${el('p', '', o[2])}</li>`).join('')}</ul>
  </div>
</div>
<div class="wrap stay__plan" data-read="siteplan">
  ${plateOr('sitePlan', { cls: 'plate--info plate--siteplan', ar: '900/560', arm: '360/868', narrow: 900, cap: sitePlan.cap, label: sitePlan.alt })}
</div>
</section>`;

export default {
  path: 'lodging/index.html',
  titles: pageTitles.lodging,
  description: 'Lodging and camping in Echo Basin National Park. A work of fiction.',
  main: () => stay(),
};
