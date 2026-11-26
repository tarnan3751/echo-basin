// The Halloran Meadows page, trail 4, laid out by the trail template (src/trail.mjs). Its picture is the one painted
// scene among the trail pages, the view down from the meadows, and it runs the full width of the screen as the elk
// do on the Wildlife page. The template draws it with plateOr(), so the page builds with a placeholder of the same
// shape, caption, label and marker whenever the painting is not registered in src/scenes.mjs.
import { trailHalloran as T } from '../content/trail-halloran.mjs';
import { trailMain } from '../trail.mjs';

export default {
  path: 'trails/halloran-meadows/index.html',
  titles: T.titles,
  description: 'Halloran Meadows trail, Echo Basin National Park. A work of fiction.',
  main: ctx => trailMain(ctx, { n: 4, copy: T, map: 'mapHalloran', mapAr: '640/491',
    after: { name: 'vista', bleed: true, ar: '1200/560', arm: '720/620', cap: T.picture.cap, label: T.picture.alt } }),
};
