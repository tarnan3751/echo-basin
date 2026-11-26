// node profile-check.mjs : the elevation profile on the Echo Pass page (src/scene-profile.mjs) against the figures the
// site states. For each named stop it prints where the profile puts it, in miles from the lodge along the trail and in
// feet, beside the stated figure and beside what the park map's own terrain gave before the profile was made to
// agree. It exits with 1 if any stop on the profile is more than 10 ft or 0.02 mi from its stated figure, if the
// snowline is not crossed between the meadows and the hut, or if the hut is not above the snowline and about a mile
// below the pass. The hut's height is not printed: the site never states it (story bible 9.15).
import { profileData, STATED, LAST_MI } from './src/scene-profile.mjs';
import { C } from './src/content.mjs';
import { trailEchoPass } from './src/content/trail-echo-pass.mjs';

const TOL_FT = 10, TOL_MI = 0.02, D = profileData(), S = STATED, ST = trailEchoPass.diagram.labels.stops;
const name = k => Array.isArray(ST[k].name) ? ST[k].name[0] : ST[k].name;
const ft = v => Math.round(v).toLocaleString('en-US') + ' ft', mi = v => v.toFixed(2) + ' mi', sign = v => (Math.round(v) > 0 ? '+' : '') + Math.round(v);
const dmi = v => (v >= 0.005 ? '+' : '') + v.toFixed(2) + ' mi';
// the profile's height at a given mile, read off the line as it is drawn
const at = m => { const p = D.pts; for (let i = 1; i < p.length; i++) if (m <= p[i].mi) return p[i - 1].ft + (p[i].ft - p[i - 1].ft) * (m - p[i - 1].mi) / (p[i].mi - p[i - 1].mi || 1); return p[p.length - 1].ft; };
const bad = [], rows = [];
const pad = (s, n) => String(s).padEnd(n);

console.log('Echo Pass elevation profile, one way, against the figures the site states\n');
console.log(pad('', 18) + pad('profile', 22) + pad('stated', 28) + 'park map before it was made to agree');
for (const k of ['lodge', 'point', 'meadows', 'pass']) {
  const m = S.mi[k], h = at(m), dh = h - S.ft[k], dm = m - S.mi[k];
  if (Math.abs(dh) > TOL_FT || Math.abs(dm) > TOL_MI) bad.push(name(k));
  rows.push(pad(name(k), 18) + pad(`${mi(m)}  ${ft(h)}`, 22) + pad(`${mi(S.mi[k])}  ${ft(S.ft[k])}`, 28) + `${mi(D.raw.mi[k])}  ${ft(D.raw.ft[k])}   (${dmi(D.raw.mi[k] - S.mi[k])}, ${sign(D.raw.ft[k] - S.ft[k])} ft)`);
}
// the snowline: where the trail first reaches 7,500 ft
const snowOK = D.snow !== null && D.snow > S.mi.meadows && D.snow <= D.hut && Math.abs(at(D.snow) - S.ft.snowline) <= TOL_FT;
if (!snowOK) bad.push(name('snowline'));
rows.splice(3, 0, pad(name('snowline'), 18) + pad(`${D.snow === null ? 'never' : mi(D.snow)}  ${ft(S.ft.snowline)}`, 22) + pad(`         ${ft(S.ft.snowline)}`, 28) + `${mi(D.raw.mi.snowline)}  (where the trail first reaches it)`);
// the hut: above the snowline, below the pass, about a mile below the top
const hutUp = S.mi.pass - D.hut, hutOK = at(D.hut) > S.ft.snowline && at(D.hut) < S.ft.pass && Math.abs(hutUp - 1) <= 0.5;
if (!hutOK) bad.push(name('hut'));
rows.splice(4, 0, pad(name('hut'), 18) + pad(`${mi(D.hut)}  (not given)`, 22) + pad(`about 1 mi below the pass`, 28) + `${mi(D.raw.mi.hut)}   (${mi(hutUp)} below the pass on the profile, ${at(D.hut) > S.ft.snowline ? 'above' : 'NOT above'} the snowline)`);
console.log(rows.join('\n'));

// the three legs, as the map draws them and as the trail table gives them
console.log('\nlegs, one way:');
for (const [a, b] of [['lodge', 'point'], ['point', 'meadows'], ['meadows', 'pass']]) {
  const r = D.raw.mi[b] - D.raw.mi[a], s = S.mi[b] - S.mi[a];
  console.log(`  ${pad(name(a) + ' to ' + name(b), 34)} map ${mi(r)}   stated ${mi(s)}   drawn ${(s / r).toFixed(2)} times the map's length`);
}
console.log(`  ${pad('whole trail', 34)} map ${mi(D.raw.mi.pass)}   stated ${mi(S.mi.pass)}   (${((D.raw.mi.pass / S.mi.pass - 1) * 100).toFixed(1)}%)`);
console.log(`heights: the map's are moved by ${Object.entries(D.nudge).map(([k, v]) => `${sign(v)} ft at ${name(k)}`).join(', ')}, and by a share of that between stops`);

// the trail table: round trips and climbs, against the profile
console.log('\ntrail table:');
for (const [k, row] of [['point', 'Echo Point'], ['meadows', 'Halloran Meadows'], ['pass', 'Echo Pass']]) {
  const r = C.trails.rows.find(x => x[1] === row), climb = at(S.mi[k]) - at(0), stated = +r[3].replace(/\D/g, '');
  if (Math.abs(climb - stated) > TOL_FT) bad.push(row + ' climb');
  console.log(`  ${pad(row, 18)} round trip ${pad(r[2], 8)} = 2 x ${mi(S.mi[k])}.   climb ${pad(r[3], 9)} profile ${ft(climb)} from the lodge`);
}
// the stage 4 pin, which the copy places about 700 ft short of the rail at Echo Point
const short = (S.mi.point - LAST_MI) * 5280;
console.log(`\nstage 4 pin: ${mi(LAST_MI)} from the lodge, ${Math.round(short)} ft short of Echo Point along the trail (the copy and the echo diagram: about 700 ft)`);
if (!(LAST_MI > 0 && LAST_MI < S.mi.point)) bad.push('the stage 4 pin');

console.log('\n' + (bad.length ? `OFF: ${bad.join(', ')}` : `every stop within ${TOL_FT} ft and ${TOL_MI} mi of the stated figures`));
process.exit(bad.length ? 1 : 0);
