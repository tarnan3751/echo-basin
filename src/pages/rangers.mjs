// The Rangers page: the heading and intro and the list of four people are the two scored blocks. The photo has its
// own marker and the second person carries one.
import { C } from '../content.mjs';
import { pageTitles } from '../content/split.mjs';
import { el, t, plate } from '../html.mjs';

const rangers = () => `<section class="sec rangers" id="rangers">
<div class="wrap">
  <div class="split" data-read="rangers">
    ${el('h1', 'mis', C.rangers.h2)}
    ${el('p', 'lede', C.rangers.intro)}
  </div>
  ${plate('rangers', { ar: '1200/604', arm: '740/570', cap: C.rangers.cap, eyes: '2:cursor 4:up' })}
  <ul class="people" data-read="people">${C.rangers.people.map((p, i) => `<li${i === 1 ? ' data-mark' : ''}><h3>${t(p.name)}</h3><p class="role">${t(p.role)}</p>${el('p', '', p.bio)}</li>`).join('')}</ul>
</div>
</section>`;

export default {
  path: 'rangers/index.html',
  titles: pageTitles.rangers,
  description: 'The rangers of Echo Basin National Park. A work of fiction.',
  main: () => rangers(),
};
