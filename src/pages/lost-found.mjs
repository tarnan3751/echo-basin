// The Lost and found page (bible 12): the heading, what has been handed in and how to claim it, then the board of
// tagged items and the note under it. Two scored blocks (lost, board) and one marker, halfway down the board.
// The heading follows the footer link: "Lost and found", then "Lost" at stage 4, "Found" at stage 5. The intro and how
// to claim are empty at stage 6 and not shown.
//
// The board is a cork board in a frame with paper tags hung on it, each from a pin by a loop of string through its
// punched hole: the item, where it was found, the date stamped on, and sometimes a line in pen. A tag is on the board
// from its `from` stage through its `until` stage (both counted as shown, in this file), so the board holds ten tags
// through stage 3, nine at 4, three at 5 and one at 6; the tags sit in rows from the middle out, and the board keeps a
// height of its own, so it looks pinned up whatever is left on it. Each tag hangs at its own small angle, the same at
// every stage, so a tag does not move when others are taken down. The marker is its own small mark halfway down the
// board, which moves with the board's height.
import { lostFound as L } from '../content/lost-found.mjs';
import { el, w, during } from '../html.mjs';

// a steady scatter for the tags, by their place in the copy: an angle, a drop below the row's line, a pin colour
const hang = i => { const a = [-4.5, 3, -1.5, 5, -3, 1.5, -5.5, 2.5, -2, 4][i % 10], d = [4, 0, 10, 2, 7, 12, 1, 6, 9, 3][(i * 3) % 10]; return `--r:${a}deg;--d:${d}px;--pin:var(--pin${i % 4})`; };
const tag = (g, i) => `<li class="tag" style="${hang(i)}"${during({ from: g.from, until: g.until })}>
  <div class="tag__hang"><div class="tag__paper">
    <p class="tag__item">${w(g.item)}</p>
    <p class="tag__where">${w(g.where)}</p>
    <p class="tag__date">${w(g.date)}</p>
    ${g.pen ? (Array.isArray(g.pen) ? el('p', 'tag__pen hand', g.pen) : `<p class="tag__pen hand">${w(g.pen)}</p>`) : ''}
  </div></div>
  <i class="tag__pin" aria-hidden="true"></i>
</li>`;

const lost = () => `<section class="sec lost" id="lost">
<div class="wrap">
  <div class="split" data-read="lost">
    ${el('h1', 'mis', L.h1, ' id="lost-title"')}
    <div>
      ${el('p', 'lede lost__intro', L.intro)}
      ${el('p', 'lost__claim', L.claim)}
    </div>
  </div>
  <div data-read="board">
    <div class="board__box">
      <ul class="board" aria-labelledby="lost-title">${L.tags.map(tag).join('')}</ul>
      <i class="board__mark" data-mark aria-hidden="true"></i>
    </div>
    ${el('p', 'note board__note', L.note)}
  </div>
</div>
</section>`;

export default {
  path: 'lost-and-found/index.html',
  titles: L.titles,
  description: 'Lost and found at Echo Basin National Park. A work of fiction.',
  main: () => lost(),
};
