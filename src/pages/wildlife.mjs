// The Wildlife page: the heading and intro, the species list and the fall count sheet are the three scored blocks. The
// elk picture's marker is reached when the top two fifths of the picture have gone under the page header, not at the
// usual middle of the window. The picture is the first thing in the section and the herd stands in its lower half.
// The top two fifths are all sky, mountains and treetops: by then the reader has had the whole herd on screen, grazing,
// for about as long as the page allows, and every animal, antlers included, is still in view when they lift their
// heads. The last species entry carries a marker too, and so does the count sheet (bible 12).
//
// The fall count sheet is the park's printed survey form. The groups, the column heads and the totals line are print;
// the figures, the notes and the margin are written in by hand. A row with `struck` is struck through by hand from that
// stage, with one ruled line across every cell. The copy's description of the sheet holds only until stage 3 (it says
// the fall column is blank), so it is read out before the sheet only through stage 3; the sheet is real text after that.
import { C } from '../content.mjs';
import { pageTitles, fallCount as F, rewordings } from '../content/split.mjs';
import { esc, el, t, w, plate, during, checked } from '../html.mjs';

// The last entry's stage 5 line says the reader has been looking for it in every picture, so it is shown only if every
// picture they have reached has been on screen long enough (bible 10.6, the test "every"), with the copy's plain line
// otherwise.
const LAST = C.wildlife.items.length - 1, said = rewordings.find(r => r.new === C.wildlife.items[LAST][1][1][5]);
const about = (s, i) => i === LAST ? checked(s[1], 5, 'every', said.fallback) : s[1];

// the rows after the totals line (the elk) stand apart from the table above them
const TOTAL = F.rows.findIndex(r => r.total);
const strike = r => r.struck ? `<i class="strike"${during({ from: r.struck })} aria-hidden="true"></i>` : '';
const countRow = (r, i) => (i === TOTAL + 1 ? `<tr class="count__gap" aria-hidden="true"><td colspan="${F.cols.length}"></td></tr>` : '') + `<tr${r.total ? ' class="count__total"' : ''}>`
  + `<th scope="row">${w(r.group)}${strike(r)}</th><td class="hand">${w(r.spring)}${strike(r)}</td><td class="hand">${w(r.fall)}${strike(r)}</td><td class="hand count__note">${w(r.note)}${strike(r)}</td></tr>`;

const count = () => `<figure class="docfig countfig" data-read="count" data-mark aria-labelledby="count-title">
  <div class="doc doc--count">
    <p class="vh"${during({ until: 3 })}>${esc(F.alt)}</p>
    <p class="count__head" id="count-title">${esc(F.title)}</p>
    <p class="count__sub">${esc(F.sub)}</p>
    <div class="count__scroll"><table class="count__tbl">
      <thead><tr>${F.cols.map(c => `<th scope="col">${w(c)}</th>`).join('')}</tr></thead>
      <tbody>${F.rows.map(countRow).join('')}</tbody>
    </table></div>
    <ul class="count__notes">${F.margin.map(m => `<li class="hand"${during({ from: m.from })}>${w(m.text)}</li>`).join('')}</ul>
  </div>
  ${el('figcaption', '', F.cap)}
</figure>`;

const wildlife = () => `<section class="sec wildlife" id="wildlife">
${plate('meadow', { cls: 'plate--bleed', ar: '1200/520', arm: '720/530', cap: C.wildlife.cap, mark: [0.4, 'head'] })}
<div class="wrap wildlife__grid">
  <div data-read="wildlife">${el('h1', 'mis', C.wildlife.h2)}${el('p', 'lede', C.wildlife.intro)}</div>
  <dl class="species" data-read="species">${C.wildlife.items.map((s, i, all) => `<div${i === all.length - 1 ? ' data-mark' : ''}><dt>${t(s[0])}</dt>${el('dd', '', about(s, i))}</div>`).join('')}</dl>
  ${count()}
</div>
</section>`;

export default {
  path: 'wildlife/index.html',
  titles: pageTitles.wildlife,
  description: 'Wildlife in Echo Basin National Park. A work of fiction.',
  main: () => wildlife(),
};
