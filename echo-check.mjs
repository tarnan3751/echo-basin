// node echo-check.mjs : the ground drawn in the echo diagram against the park map's own heights, along the map's line
// (lodge, Echo Point, Halloran Meadows, pass). Prints both every 100 ft and the largest gap between them. The cliffs,
// the gully under the rail and the benches are finer than the map's 200 ft contours, so gaps up to one contour are
// expected; anything larger means the two have drifted apart.
import { heightAt, onPath } from './src/scene-map.mjs';
import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('./src/scene-echo.mjs', import.meta.url), 'utf8');
const grab = name => JSON.parse(src.match(new RegExp('const ' + name + ' = (\\[\\[.*?\\]\\]);'))[1]);
const BEHIND = grab('BEHIND'), GULLY = grab('GULLY');
const walls = [...src.matchAll(/\{ name: '([^']+)', d: (\d+), base: (-?\d+), top: (-?\d+), bench: (\[\[.*?\]\]) \}/g)].map(m => ({ name: m[1], d: +m[2], base: +m[3], top: +m[4], bench: JSON.parse(m[5]) }));
const pts = [...BEHIND, ...GULLY]; walls.forEach(w => pts.push([w.d - 12, w.base], [w.d + 12, w.top], ...w.bench));
const mine = d => { for (let i = 1; i < pts.length; i++) if (d <= pts[i][0]) { const a = pts[i - 1], b = pts[i]; return a[1] + (b[1] - a[1]) * (d - a[0]) / (b[0] - a[0]); } return pts[pts.length - 1][1]; };
const U = 60 / 5280, map = d => heightAt(...onPath(208 - d * U));
let worst = [0, 0]; const rows = [];
for (let d = -1300; d <= 4700; d += 100) { const a = Math.round(map(d)), b = Math.round(4330 + mine(d)), gap = b - a; if (Math.abs(gap) > Math.abs(worst[1])) worst = [d, gap]; rows.push(`${String(d).padStart(6)} ft   map ${a}   drawn ${b}   ${gap > 0 ? '+' : ''}${gap}`); }
console.log(rows.join('\n'));
console.log(`\nlargest gap: ${worst[1]} ft, ${worst[0]} ft from the rail` + (Math.abs(worst[1]) > 200 ? '   MORE THAN ONE CONTOUR' : '   (within one 200 ft contour)'));
console.log('lodge on the map: ' + Math.round(map(-2640)) + ' ft, 2,640 ft behind the rail.   meadows: ' + Math.round(map(6160)) + ' ft, 6,160 ft ahead.');
