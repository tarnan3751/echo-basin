// node picture-check.mjs : checks that no picture has changed, and that none depends on what was drawn before it.
// Every picture is drawn four times, in four different orders (as listed, reversed, and two shuffles), and each
// drawing is compared with the fingerprint in pictures.lock.json. It also checks that no picture has used more ids
// or grain patterns than the gap before the next one in src/scenes.mjs allows, since two pictures that overlap could
// share an id on a page that shows both.
//
// node picture-check.mjs --write : records the fingerprints again. Do this after changing a picture on purpose, and
// read the list it prints: it names every picture whose fingerprint moved, so a change that reached further than it
// was meant to shows up here.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { scenes, START } from './src/scenes.mjs';
import { counters } from './src/lib.mjs';

const LOCK = new URL('./pictures.lock.json', import.meta.url);
const names = Object.keys(START);
const print = sc => createHash('sha256').update(JSON.stringify(sc)).digest('hex');
const drawOne = name => { const sc = scenes[name](), [ids, grains] = counters(); return { hash: print(sc), bytes: JSON.stringify(sc).length, ids: ids - START[name][0], grains: grains - START[name][1] }; };
// a shuffle that is the same every run
const shuffled = seed => { const a = [...names]; let s = seed; for (let i = a.length - 1; i > 0; i--) { s = (s * 1664525 + 1013904223) >>> 0; const j = s % (i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const orders = [names, [...names].reverse(), shuffled(7), shuffled(2024)];

const runs = orders.map(order => Object.fromEntries(order.map(n => [n, drawOne(n)])));
const first = runs[0];
let bad = 0;
const fail = msg => { bad++; console.log('  ' + msg); };

// 1. the same in every order
for (const n of names) if (runs.some(r => r[n].hash !== first[n].hash)) fail(`${n}: comes out differently depending on what was drawn before it`);

// 2. room before the next picture. Pictures that start at the same place may share it only if neither uses any.
const byStart = [...names].sort((a, b) => START[a][0] - START[b][0] || START[a][1] - START[b][1]);
for (const [k, label] of [[0, 'ids'], [1, 'grain patterns']]) {
  const key = k ? 'grains' : 'ids', sorted = [...names].sort((a, b) => START[a][k] - START[b][k]);
  for (let i = 0; i < sorted.length; i++) for (let j = i + 1; j < sorted.length; j++) {
    const a = sorted[i], b = sorted[j], endA = START[a][k] + first[a][key];
    if (first[a][key] > 0 && first[b][key] > 0 && endA > START[b][k]) fail(`${a} uses ${first[a][key]} ${label} from ${START[a][k]}, which runs into ${b} at ${START[b][k]}`);
  }
}

if (process.argv.includes('--write')) {
  const old = existsSync(LOCK) ? JSON.parse(readFileSync(LOCK, 'utf8')) : {};
  const moved = names.filter(n => old[n] && old[n].hash !== first[n].hash), added = names.filter(n => !old[n]);
  writeFileSync(LOCK, JSON.stringify(Object.fromEntries(byStart.map(n => [n, first[n]])), null, 2) + '\n');
  console.log(`pictures.lock.json written: ${names.length} pictures` + (moved.length ? `\n  changed: ${moved.join(', ')}` : '') + (added.length ? `\n  new: ${added.join(', ')}` : '') + (!moved.length && !added.length ? ', none changed' : ''));
} else {
  if (!existsSync(LOCK)) { console.log('no pictures.lock.json yet: run  node picture-check.mjs --write'); process.exit(1); }
  const lock = JSON.parse(readFileSync(LOCK, 'utf8'));
  for (const n of names) {
    if (!lock[n]) fail(`${n}: not in pictures.lock.json`);
    else if (lock[n].hash !== first[n].hash) fail(`${n}: has changed (${lock[n].bytes} bytes then, ${first[n].bytes} now)`);
  }
  for (const n of Object.keys(lock)) if (!START[n]) fail(`${n}: in pictures.lock.json but no longer drawn`);
}
const free = [Math.max(...names.map(n => START[n][0] + first[n].ids)), Math.max(...names.map(n => START[n][1] + first[n].grains))];
console.log(bad ? `\n${bad} problem${bad > 1 ? 's' : ''}` : `${names.length} pictures, each drawn in ${orders.length} orders: all unchanged. Next free start: [${free.join(', ')}]`);
process.exit(bad ? 1 : 0);
