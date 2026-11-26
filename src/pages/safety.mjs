// The Safety page: the rules, the trail register and the staff memo are its three scored blocks, and the memo scores
// only once it is there. The third rule carries a marker and so do the documents, on the register, which is there at
// every stage.
// The three are one grid. Until the memo exists the register stands in the right-hand column beside the rules; from
// stage 3 the memo takes that column and the register goes under the rules, as it was on the long page (site.css).
// The register shows only the lines its stage can know (bible 9.4), always seven. The seven ordinary early lines
// (registerEarly) drop off one or more at a time as the later lines arrive: Sep 5 is gone from stage 2, Sep 6 from
// stage 3, and Sep 7 to 11 from stage 4. R. Castellanos signs out on the 12th and is there from stage 2, the Kesslers'
// walk on the 13th from stage 3, and the five people who have not signed out from stage 4, when "Seven people signed
// in last week. Five of them haven't signed out" is said. The memo is dated the 13th and is not there before stage 3
// (bible 9.3).
import { C } from '../content.mjs';
import { pageTitles, registerEarly } from '../content/split.mjs';
import { esc, t, el, during, row } from '../html.mjs';

const EARLY_UNTIL = [1, 2, 3, 3, 3, 3, 3];
const REG_FROM = { 'R. Castellanos': 2, 'D. Kessler +1': 3 };
const regRows = [
  ...registerEarly.map((r, i) => [r, { until: EARLY_UNTIL[i] }]),
  ...C.reg.rows.map(r => [r, { from: REG_FROM[r[1]] ?? 4 }]),
];
const safety = () => `<section class="sec safety" id="safety">
<div class="wrap">
  ${el('h1', 'mis', C.safety.h2)}
  <div class="safety__grid">
    <ol class="rules" data-read="rules">${C.safety.rules.map((r, i) => `<li${i === 2 ? ' data-mark' : ''}><h3>${t(r[0])}</h3>${el('p', '', r[1])}</li>`).join('')}</ol>
    <article class="doc doc--reg" data-read="register" data-mark="0.3" aria-label="Trail register">
      <p class="doc__head">${t(C.reg.head)}</p>
      <table><thead><tr><th>Date</th><th>Name</th><th>Trail</th><th>In</th><th>Out</th></tr></thead><tbody>
      ${regRows.map(r => row(r)).join('\n      ')}
      <tr id="you-row" data-from="5" style="display:none"><td class="r-date"></td><td>${t(C.reg.you)}</td><td>${t(C.reg.youTrail)}</td><td class="r-in"></td><td>&mdash;</td></tr>
      </tbody></table>
    </article>
    <article class="doc doc--memo" data-read="memo" aria-label="Staff memo"${during({ from: 3 })}>
      <p class="doc__head">${t(C.memo.head)}</p>
      <p class="doc__meta">${C.memo.meta.map(m => esc(m)).join('<br>')}</p>
      <ol>${C.memo.lines.map(l => `<li>${l.map(part => typeof part === 'string' ? esc(part) : `<span class="rd" data-lift="${part[0]}">${esc(part[1])}</span>`).join('')}</li>`).join('')}</ol>
      <p class="doc__hand" data-from="5" style="display:none">${esc(C.memo.hand)}</p>
      <span class="stamp">${t(C.memo.stamp)}</span>
    </article>
  </div>
</div>
</section>`;

export default {
  path: 'safety/index.html',
  titles: pageTitles.safety,
  description: 'Safety rules and the trail register for Echo Basin National Park. A work of fiction.',
  main: () => safety(),
};
