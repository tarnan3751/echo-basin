// The Lakeshore Loop page, trail 1, laid out by the trail template (src/trail.mjs). Its picture is the lake depth
// diagram, drawn 760 wide and in a phone layout of its own below 700 pixels.
import { trailLakeshore as T } from '../content/trail-lakeshore.mjs';
import { trailMain } from '../trail.mjs';

export default {
  path: 'trails/lakeshore-loop/index.html',
  titles: T.titles,
  description: 'Lakeshore Loop trail, Echo Basin National Park. A work of fiction.',
  main: ctx => trailMain(ctx, { n: 1, copy: T, map: 'mapLakeshore', mapAr: '640/366',
    after: { name: 'depth', ar: '760/520', arm: '360/640', width: 760, cap: T.diagram.cap, label: T.diagram.alt } }),
};
