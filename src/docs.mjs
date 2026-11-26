// Small pieces the paper documents share (the stopwatch sheet, the fall count sheet, the vehicle pass and the tag
// board). The documents themselves are ordinary markup on the pages that carry them, styled under .doc in site.css:
// their words are real text and follow the stages like any other.

// A tally of n marks, drawn by hand in fives: four strokes and one across them. It is drawn in the colour of the words
// around it (pencil, ink) and says its number to a screen reader. The strokes lean and wander a little, the same way
// on every build.
export function tally(n){
  let s = '', x = 3, k = 0;
  const j = () => { k = (k * 7 + 3) % 11; return (k - 5) / 5; };   // a small steady wobble, -1 to 1
  for (let g = 0; g < n; g += 5) {
    const m = Math.min(5, n - g);
    for (let i = 0; i < Math.min(m, 4); i++) { const a = x + i * 6; s += `M${(a + j() * 0.6).toFixed(1)},${(3 + j()).toFixed(1)} L${(a + 1 + j() * 0.8).toFixed(1)},${(23 + j()).toFixed(1)} `; }
    if (m === 5) s += `M${(x - 3).toFixed(1)},${(19 + j()).toFixed(1)} L${(x + 22).toFixed(1)},${(7 + j()).toFixed(1)} `;
    x += m === 5 ? 32 : m * 6;
  }
  const W = Math.ceil(x + 2);
  return `<svg class="tally" viewBox="0 0 ${W} 26" width="${W}" height="26" role="img" aria-label="${n}"><path d="${s.trim()}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`;
}
