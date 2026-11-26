// The Conditions page: the heading and intro, and the three cards to check before going out; then the current alerts
// and the log of updates (bible 12). Each is a scored block: field, cards, alerts and log. The markers are the cards'
// own and one a third of the way down the log, wherever that falls at the stage the log is at. Each card is drawn in
// two layouts and they change to their narrow ones below 700 pixels.
// The alerts are the six ticker items, the same pieces of text, so the list and the ticker always say the same thing
// (bible 12: the ticker is the top of the alerts list). Log entries come newest first, and one that has a `from` is
// not on the page before that stage. The stage 6 entry is dated with the moment the words are put on the page ({now}).
import { C } from '../content.mjs';
import { conditions } from '../content/conditions.mjs';
import { el, t, w, plate, during } from '../html.mjs';

const field = () => `<section class="sec field" id="field">
<div class="wrap">
  <div class="split" data-read="field">
    ${el('h1', 'mis', C.field.h2)}
    ${el('p', 'lede', C.field.intro)}
  </div>
  <div class="tri" data-read="cards">
    ${plate('tracks', { cls: 'plate--info', ar: '560/692', arm: '360/860', label: C.field.labels.tracks, point: 'cards' })}
    <div class="tri__side">
      ${plate('conditions', { cls: 'plate--info', ar: '560/330', arm: '360/566', label: C.field.labels.conditions, point: 'cards' })}
      ${plate('daylight', { cls: 'plate--info', ar: '560/330', arm: '360/400', label: C.field.labels.daylight, point: 'cards' })}
    </div>
  </div>
  ${el('p', 'tri__note', C.field.note)}
</div>
</section>`;

const { alerts, log } = conditions;
const alertsSec = () => `<section class="sec alerts" id="alerts" data-read="alerts">
<div class="wrap">
  <div class="split">
    ${el('h2', 'mis', alerts.h2)}
    ${el('p', 'lede', alerts.intro)}
  </div>
  <ul class="alerts__list">${C.ticker.map(i => `<li><i aria-hidden="true"></i>${t(i)}</li>`).join('')}</ul>
</div>
</section>`;

// The marker is its own small mark a third of the way down the list, so it stays a third of the way down however
// many entries the stage has added.
const logSec = () => `<section class="sec log" id="log" data-read="log">
<div class="wrap">
  <div class="split">
    ${el('h2', 'mis', log.h2)}
    ${el('p', 'lede', log.note)}
  </div>
  <div class="log__body">
  <ol class="log__list">${log.entries.map(e => `<li${during({ from: e.from })}><span class="log__date">${w(e.date)}</span>${Array.isArray(e.text) ? el('p', '', e.text) : `<p>${w(e.text)}</p>`}</li>`).join('')}</ol>
  <i class="log__mark" data-mark aria-hidden="true"></i>
  </div>
</div>
</section>`;

export default {
  path: 'conditions/index.html',
  titles: conditions.titles,
  description: "Today's conditions and alerts for Echo Basin National Park. A work of fiction.",
  main: () => [field(), alertsSec(), logSec()].join('\n'),
};
