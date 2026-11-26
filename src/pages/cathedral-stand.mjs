// The Cathedral Stand page, trail 2, laid out by the trail template (src/trail.mjs). Its picture is Sam's survey
// sheet, which is lettered to be read at its full 900 pixels: it is shown at that width wherever the page's column
// holds it, and in its phone layout, turned to run down the screen, below 1020 pixels, where the column is narrower.
import { trailCathedral as T } from '../content/trail-cathedral.mjs';
import { trailMain } from '../trail.mjs';

export default {
  path: 'trails/cathedral-stand/index.html',
  titles: T.titles,
  description: 'Cathedral Stand trail and boardwalk, Echo Basin National Park. A work of fiction.',
  main: ctx => trailMain(ctx, { n: 2, copy: T, map: 'mapCathedral', mapAr: '640/459',
    after: { name: 'survey', ar: '900/620', arm: '360/952', narrow: 1020, width: 900, cap: T.diagram.cap, label: T.diagram.alt } }),
};
