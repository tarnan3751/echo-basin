import { startAt } from './lib.mjs';
import { lake } from './scene-lake.mjs';
import { oldgrowth } from './scene-forest.mjs';
import { rangers } from './scene-trailhead.mjs';
import { highcountry } from './scene-high.mjs';
import { meadow } from './scene-meadow.mjs';
import { portrait } from './scene-portrait.mjs';
import { finale } from './scene-dock.mjs';
import { map } from './scene-map.mjs';
import { conditions, daylight, tracks } from './scene-trailcards.mjs';
import { echo } from './scene-echo.mjs';
import { depth } from './scene-depth.mjs';
import { sitePlan } from './scene-siteplan.mjs';
import { profile } from './scene-profile.mjs';
import { survey } from './scene-survey.mjs';
import { sign } from './scene-sign.mjs';
import { vista } from './scene-vista.mjs';
import { mapLakeshore, mapCathedral, mapEchoPoint, mapHalloran, mapEchoPass } from './scene-mapwin.mjs';

const draw = {
  hero: () => lake({ pal: 'gold', layered: true, id: 'hero' }),
  lodge: () => { const s = lake({ pal: 'dusk', layered: false, id: 'stay' }); return { ...s, vb: [800, 318, 640, 400] }; },
  oldgrowth, rangers, meadow, map, portrait, finale, conditions, daylight, tracks, echo,
  depth, sitePlan, profile, survey, sign, vista, mapLakeshore, mapCathedral, mapEchoPoint, mapHalloran, mapEchoPass,
  high: () => highcountry({ pal: 'gold', id: 'high' }),
  night: () => highcountry({ pal: 'night', id: 'night' }),
};

// Where each picture starts counting: [ids, grain patterns]. A picture numbers its gradients, clips and stored paths
// from the first figure and its grain patterns from the second, so it comes out the same on any page and in any
// order, and two pictures on one page can never share an id. These are the places each one started at when the
// site was a single page, which is why the pictures have not changed. A picture may grow into the gap before the
// next one and no further; `node picture-check.mjs` says so if it does. A new picture takes the next free row.
export const START = {
  hero: [0, 0],
  oldgrowth: [160, 17],
  high: [245, 32],
  map: [481, 36],
  rangers: [491, 37],
  meadow: [602, 57],
  lodge: [1064, 64],
  night: [1191, 80],
  portrait: [1398, 84],
  finale: [1489, 88],
  echo: [1556, 95],
  tracks: [1709, 95],
  conditions: [1747, 95],
  daylight: [1747, 95],
  // The pictures made for the multi-page site. Each was given a round starting place with room to grow.
  depth: [1800, 100],
  sitePlan: [1900, 104],
  profile: [2000, 108],
  survey: [2100, 112],
  mapLakeshore: [2200, 116],
  mapCathedral: [2300, 118],
  mapEchoPoint: [2400, 120],
  mapHalloran: [2500, 122],
  mapEchoPass: [2600, 124],
  sign: [2700, 126],
  vista: [3000, 140],
};

export const scenes = Object.fromEntries(Object.keys(START).map(name => [name, () => { startAt(START[name]); return draw[name](); }]));
