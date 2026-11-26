// The Programs page: the heading and intro, the table of programs, June's stopwatch sheet, and the dark sky section
// with the night picture. Four scored blocks (programs, table, sheet, night). Markers: the table, the sheet, and the
// night picture's own (bible 12).
// The night picture's marker is placed like the elk picture's on the Wildlife page, and for the same reason: the
// picture comes first in its section and the change is in its lower part. It is reached when the top three tenths of
// the picture (all sky) have gone under the page header, so the hut is still in full view when its roof changes.
// A table row's `until` is the first stage it is gone (src/content/programs.mjs), so from stage 5 the table is down to
// its head row.
import { C } from '../content.mjs';
import { programs } from '../content/programs.mjs';
import { esc, el, t, w, plate, during } from '../html.mjs';
import { tally } from '../docs.mjs';

const { table, sheet } = programs;

// On a phone the rows are laid out as grids, each program's facts on one line and its note under them, which can cost
// a table its meaning to a screen reader in some browsers; the roles keep it a table.
const progTable = () => `<div class="tbl-wrap progs" data-read="table" data-mark="0.5"><table class="tbl tbl--progs" role="table">
    <thead role="rowgroup"><tr role="row">${table.head.map(h => `<th scope="col" role="columnheader">${esc(h)}</th>`).join('')}</tr></thead>
    <tbody role="rowgroup">${table.rows.map(r => `<tr role="row"${during({ until: r.until - 1 })}><th scope="row" role="rowheader">${w(r.name)}</th><td role="cell">${w(r.when)}</td><td role="cell">${w(r.where)}</td><td role="cell">${w(r.who)}</td><td role="cell" class="progs__note">${w(r.note)}</td></tr>`).join('')}</tbody>
  </table></div>`;

// June's stopwatch sheet: a printed form, filled in by hand. The form, its heading and its column heads are print;
// everything in the rows is June's ink, and the fifth column, its head and what is in it are pencil, added from stage 2.
// Rows and margin notes come on at their `from` stage. The form has the same number of ruled lines at every stage:
// blank ones below the last row, one fewer for each row written, so the paper never changes size.
// The reader's line (stage 6) is written in the red the register uses for theirs. The line from the 14th stops after
// its one entry, a fifth that came before the shout, and the pencil runs off after it (bible 9.9 and 9.13). The margin
// notes that came with the pencil column (stage 2) are in pencil too; the rest are ink.
const LINES = 14;
const filled = s => sheet.rows.filter(r => (r.from || 0) <= s).length;
const blanks = Array.from({ length: LINES - filled(0) }, (_, i) => { let u = 0; for (let s = 0; s <= 6; s++) if (filled(s) + i < LINES) u = s; return u; });
const sheetRow = r => {
  const you = r.who === 'you', off = r.times.every(x => x === '') && typeof r.fifth === 'string' && r.fifth.startsWith('-');
  return `<tr${you ? ' class="sheet__you"' : ''}${during({ from: r.from })}><td>${w(r.date)}</td><td>${w(r.time)}</td><td>${w(r.who)}</td>${r.times.map(x => `<td>${w(x)}</td>`).join('')}<td class="pencil">${w(r.fifth)}${off ? '<i class="sheet__off" aria-hidden="true"></i>' : ''}</td></tr>`;
};
const stopwatch = () => `<figure class="docfig sheetfig" data-read="sheet" data-mark aria-label="${esc(sheet.label)}">
  <div class="doc doc--sheet">
    <div class="sheet__form">
      <p class="sheet__head">${esc(sheet.head)}</p>
      <p class="sheet__sub">${esc(sheet.sub)}</p>
      <div class="sheet__scroll"><table class="sheet__tbl">
        <colgroup><col class="c-date"><col class="c-time"><col class="c-who"><col span="4" class="c-cliff"><col class="c-fifth"></colgroup>
        <thead><tr>${sheet.cols.map((c, i) => `<th scope="col"${i === sheet.cols.length - 1 ? ' class="pencil"' : ''}>${w(c)}</th>`).join('')}</tr></thead>
        <tbody>${sheet.rows.map(sheetRow).join('')}${blanks.map(u => `<tr class="sheet__blank" aria-hidden="true"${during({ until: u })}>${'<td></td>'.repeat(sheet.cols.length)}</tr>`).join('')}</tbody>
      </table></div>
    </div>
    <ul class="sheet__notes">${sheet.margin.map(m => `<li class="hand${m.from === 2 ? ' pencil' : ''}"${during({ from: m.from })}>${w(m.text)}${m.tally ? ` ${tally(m.tally)}` : ''}</li>`).join('')}</ul>
  </div>
  ${el('figcaption', '', sheet.cap)}
</figure>`;

const programsSec = () => `<section class="sec programs" id="programs">
<div class="wrap">
  <div class="split" data-read="programs">
    ${el('h1', 'mis', programs.h1)}
    ${el('p', 'lede', programs.intro)}
  </div>
  ${progTable()}
  ${el('p', 'note', table.note)}
  ${stopwatch()}
</div>
</section>`;

const night = () => `<section class="sec night dark" id="night" data-read="night">
<div class="wrap">
  ${plate('night', { ar: '5/3', arm: '700/560', cap: C.night.cap, mark: [0.3, 'head'] })}
  <div class="night__grid">
    ${el('h2', 'mis', C.night.h2)}
    <div>${el('p', 'lede', C.night.body)}<ul class="facts">${C.night.facts.map(x => `<li>${t(x)}</li>`).join('')}</ul></div>
  </div>
</div>
</section>`;

export default {
  path: 'programs/index.html',
  titles: programs.titles,
  description: 'Ranger programs and dark sky programs at Echo Basin National Park. A work of fiction.',
  main: () => [programsSec(), night()].join('\n'),
};
