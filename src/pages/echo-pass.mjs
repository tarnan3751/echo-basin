// The Echo Pass page, trail 5, laid out by the trail template (src/trail.mjs). Its picture is the elevation profile,
// which needs the page's full width: it is shown in its wide layout above 1100 pixels, where the column is at least
// 1,004 pixels and from about 1,210 the full 1,100 it was drawn at, and in its phone layout, running down the screen,
// below that.
import { trailEchoPass as T } from '../content/trail-echo-pass.mjs';
import { trailMain } from '../trail.mjs';

export default {
  path: 'trails/echo-pass/index.html',
  titles: T.titles,
  description: 'Echo Pass trail, Echo Basin National Park. A work of fiction.',
  main: ctx => trailMain(ctx, { n: 5, copy: T, map: 'mapEchoPass', mapAr: '640/540',
    after: { name: 'profile', ar: '1100/516', arm: '360/658', narrow: 1100, width: 1100, cap: T.diagram.cap, label: T.diagram.alt } }),
};
