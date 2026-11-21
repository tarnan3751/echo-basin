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
export const scenes = {
  hero: () => lake({ pal: 'gold', layered: true, id: 'hero' }),
  lodge: () => { const s = lake({ pal: 'dusk', layered: false, id: 'stay' }); return { ...s, vb: [800, 318, 640, 400] }; },
  oldgrowth, rangers, meadow, map, portrait, finale, conditions, daylight, tracks, echo,
  high: () => highcountry({ pal: 'gold', id: 'high' }),
  night: () => highcountry({ pal: 'night', id: 'night' }),
};
