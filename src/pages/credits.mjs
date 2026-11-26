// The Site credits page (bible 12 and 14, decision 4). It is outside the fiction: plain, short, no pictures, and nothing
// on it changes by stage, so it has one tab title for all seven stages. It adds nothing to the score and carries no
// markers. The header, ticker and footer around it are the same as on any page and follow the stage as they do there.
import { credits as K } from '../content/credits.mjs';
import { esc } from '../html.mjs';

const credits = () => `<section class="sec credits" id="credits">
<div class="wrap credits__text">
  <h1>${esc(K.h1)}</h1>
  ${K.body.map(p => `<p>${esc(p)}</p>`).join('')}
  <h2>${esc(K.fontsHead)}</h2>
  <ul>${K.fonts.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
</div>
</section>`;

export default {
  path: 'credits/index.html',
  score: false,
  titles: Array(7).fill(K.title),
  description: 'Site credits for Echo Basin National Park, a work of fiction.',
  main: () => credits(),
};
