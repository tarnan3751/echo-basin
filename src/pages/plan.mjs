// The Plan page: the page heading, then hours and seasons, fees and passes (with the vehicle pass), getting here,
// accessibility and common questions, and last the closing screen with the pier. Scored blocks: hours, fees, pass,
// getting, access, faq and plan. Markers: the pass, the ways in under Getting here, and the pier (bible 12).
// The footer's links to plan/#hours, plan/#fees and plan/#access land on the first three of those sections.
// The page heading is the page's name, the plan heading's stage 0 words. It does not change by stage, as the last
// button's words do not: the heading that changes is the closing screen's, which keeps its words and is now an h2.
//
// The pier picture is the ending (bible 10.5). It always shows the site's stage, and its marker is the ending's: at
// stage 5 it fires stage 6 when four fifths of the picture has come up into the window, so the reader has seen the
// people on the pier, and their own shadow in front of them, before the other shadow comes. Below stage 5 it is an
// empty pier and the marker does nothing.
// That is the page's closing screen, so the site's footer goes in it, along the bottom over the near boards. Below
// stage 5 the last button is an ordinary link to where the page's go.last says (the Trails page, here).
import { C } from '../content.mjs';
import { planPage as P } from '../content/plan.mjs';
import { esc, t, el, w, plate } from '../html.mjs';

// the park's mark, as in the header, printed on the pass
const MARK = '<svg class="pass__mark" viewBox="0 0 40 40" aria-hidden="true"><path d="M4,20.6 L15.5,4.6 L21.5,13.2 L25.5,9.4 L36,20.6Z" fill="currentColor"/><path d="M8.2,25.4 H31.8 M12.8,30 H27.2 M17.4,34.6 H22.6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><circle cx="31.6" cy="6.4" r="3.3" fill="#F2B441"/></svg>';

// The seven-day vehicle pass: a printed card made to hang from a mirror, with the hanger cut out of its top. Its
// fields are blank and it is overprinted SAMPLE until stage 6, when the overprint is gone and the fields are filled in
// by hand with the reader's own date and time. From stage 2 a rubber stamp is across it, its words changing by stage.
// To a screen reader the card is one picture, named by the label the copy gives it followed by the stamp's words.
const pass = () => { const p = P.pass; return `<div class="pass" data-read="pass" data-mark>
  ${el('span', '', p.label, ' id="pass-label" hidden')}
  <div class="pass__card" role="img" aria-labelledby="pass-label pass-stamp"><div class="pass__paper">
    <p class="pass__band">${MARK}<span>${esc(p.head)}</span></p>
    <p class="pass__title">${esc(p.title)}</p>
    <p class="pass__price">${esc(p.price)}</p>
    <ul class="pass__lines">${p.lines.map(l => `<li>${esc(l)}</li>`).join('')}</ul>
    <dl class="pass__fields">${[...p.issued, p.number].map(([k, v]) => `<div><dt>${esc(k)}</dt>${el('dd', 'hand', v)}</div>`).join('')}</dl>
    <p class="pass__small">${esc(p.small)}</p>
    ${el('span', 'pass__sample', p.sample)}
    ${el('span', 'pass__stamp', p.stamp, ' id="pass-stamp"')}
  </div></div>
</div>`; };

const hours = () => `<section class="info" id="hours" data-read="hours">
  ${el('h2', 'mis', P.hours.h2)}
  <div class="info__body">
    ${el('p', 'lede', P.hours.intro)}
    <dl class="hours">${P.hours.rows.map(([k, v]) => `<div><dt>${w(k)}</dt>${el('dd', '', v)}</div>`).join('')}</dl>
    ${el('p', 'note', P.hours.note)}
  </div>
</section>`;

const fees = () => `<section class="info info--fees" id="fees">
  <h2 class="mis">${w(P.fees.h2)}</h2>
  <div class="info__body" data-read="fees">
    ${el('p', 'lede', P.fees.intro)}
    <ul class="opts">${P.fees.rows.map(([k, price, note]) => `<li><div class="opts__h"><h3>${w(k)}</h3><span>${w(price)}</span></div>${el('p', '', note)}</li>`).join('')}</ul>
    <p class="note">${w(P.fees.note)}</p>
  </div>
  ${pass()}
</section>`;

const getting = () => `<section class="info" id="getting" data-read="getting">
  <h2 class="mis">${w(P.getting.h2)}</h2>
  <div class="info__body">
    ${el('p', 'lede', P.getting.intro)}
    <ul class="opts" data-mark>${P.getting.routes.map(r => `<li><h3>${w(r.name)}</h3>${el('p', '', r.body)}</li>`).join('')}</ul>
    ${el('p', 'note', P.getting.note)}
  </div>
</section>`;

const access = () => `<section class="info" id="access" data-read="access">
  <h2 class="mis">${w(P.access.h2)}</h2>
  <div class="info__body">
    <ul class="info__list">${P.access.items.map(x => el('li', '', x)).join('')}</ul>
  </div>
</section>`;

const faq = () => `<section class="info" id="faq" data-read="faq">
  <h2 class="mis">${w(P.faq.h2)}</h2>
  <div class="info__body faq">${P.faq.items.map(([q, a]) => `<div class="faq__item"><h3>${w(q)}</h3>${el('p', '', a)}</div>`).join('')}</div>
</section>`;

const visit = () => `<section class="sec visit" id="visit">
<div class="wrap">
  <h1 class="mis">${esc(C.plan.h2[0])}</h1>
  ${[hours(), fees(), getting(), access(), faq()].join('\n')}
</div>
</section>`;

const plan = ({ foot, last }) => `<section class="plan dark" id="plan" data-read="plan">
<div class="wrap plan__text">
  <div>
    ${el('h2', 'mis', C.plan.h2)}
    ${el('p', 'lede', C.plan.body)}
  </div>
  <div class="plan__end">
    <p class="typed" data-stage="6" data-text="${esc(C.plan.typed)}"><span></span></p>
    <a class="btn btn--big" id="final-cta" href="${esc(last)}">${t(C.plan.cta)}</a>
    ${el('p', 'plan__cap', C.plan.cap)}
  </div>
</div>
${plate('finale', { cls: 'plate--bleed plate--finale', ar: '16/9', arm: '960/920', eyes: '5:up', mark: [0.8, 0.9], lag: false, ending: true })}
${foot}
</section>`;

export default {
  path: 'plan/index.html',
  titles: P.titles,
  go: { last: 'trails/' },
  description: 'Hours, fees and directions for Echo Basin National Park. A work of fiction.',
  main: ctx => [visit(), plan(ctx)].join('\n'),
};
