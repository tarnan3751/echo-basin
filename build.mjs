// Builds dist/index.html: one self-contained file (inline CSS, JS, fonts, SVG illustrations).
import fs from 'fs';
import { scenes } from './src/scenes.mjs';
import { C } from './src/content.mjs';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const A = alts => Object.entries(alts || {}).map(([k, v]) => ` data-s${k}="${esc(v)}"`).join('');
// t(): inline text with per-stage alternates. el(): the same on a block element.
const t = (pair) => { const [base, alts] = Array.isArray(pair) ? pair : [pair, null]; return `<span class="t"${A(alts)}>${esc(base)}</span>`; };
const el = (tag, cls, pair, extra = '') => { const [base, alts] = Array.isArray(pair) ? pair : [pair, null]; return `<${tag} class="${cls ? cls + ' ' : ''}t"${A(alts)}${extra}>${esc(base)}</${tag}>`; };

// stage: [n, line] puts a stage marker inside the picture, 'line' of the way down it (0 the top edge, 1 the bottom).
// Stage n fires when that line goes under the page header, so it turns on how much of the picture has gone by.
// stage: [n, line, at] fires instead when the line has come up the window as far as 'at' (0 the top of the window,
// 1 the bottom): for the last picture on the page, which can never be scrolled up under the header.
// narrow: the widest window, in pixels, at which the picture's second layout is used (700 unless given).
// label: what the picture says, for readers who cannot see it (the drawings themselves are hidden from screen readers).
function plate(name, { cls = '', ar, arm, cap, eyes, stage, narrow, label } = {}){
  const sc = scenes[name](); const vb = sc.vb.join(' ');
  const svgs = sc.layers ? sc.layers.join('') : `<svg class="ly"${sc.flat ? ' data-flat' : ''} viewBox="${vb}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${sc.svg}</svg>`;
  const mark = stage ? `<i class="plate__mark" style="top:${stage[1] * 100}%" data-stage-at="${stage[0]}@${stage[2] ?? 'head'}" aria-hidden="true"></i>` : '';
  return `<figure class="plate ${cls}" data-scene="${name}"${eyes ? ` data-eyes="${eyes}"` : ''}${label ? ` aria-label="${esc(label)}"` : ''}><div class="plate__frame"><div class="plate__img" style="--ar:${ar};--arm:${arm || ar}" data-vb="${vb}"${sc.vbm ? ` data-vbm="${sc.vbm.join(' ')}"` : ''}${narrow ? ` data-vbm-max="${narrow}"` : ''}>${svgs}</div>${mark}</div>${cap ? el('figcaption', '', cap) : ''}</figure>`;
}
const b64 = f => fs.readFileSync(f).toString('base64');
const font = (family, file, extra) => `@font-face{font-family:"${family}";src:url(data:font/woff2;base64,${b64(file)}) format("woff2");font-display:swap;${extra}}`;

const css = fs.readFileSync('src/site.css', 'utf8');
const js = fs.readFileSync('src/grain.js', 'utf8') + '\n' + fs.readFileSync('src/sound.js', 'utf8') + '\n' + fs.readFileSync('src/runtime.js', 'utf8');

const nav = `<header class="top">
<nav class="nav" aria-label="Main">
  <a class="brand" href="#top"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M4,20.6 L15.5,4.6 L21.5,13.2 L25.5,9.4 L36,20.6Z" fill="currentColor"/><path d="M8.2,25.4 H31.8 M12.8,30 H27.2 M17.4,34.6 H22.6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><circle cx="31.6" cy="6.4" r="3.3" fill="#F2B441"/></svg><span class="brand__name">${t(C.brand)}</span><span class="brand__sub">${t(C.brandSub)}</span></a>
  <div class="nav__links">${C.nav.map(n => `<a href="${n[0]}">${t(n[1])}</a>`).join('')}</div>
  <button class="snd" id="snd" type="button" aria-pressed="false">Sound off</button>
  <a class="btn btn--sm" href="#zones" data-go="#zones">${t(C.cta)}</a>
</nav>
<div class="ticker" aria-label="Park alerts"><div class="ticker__run">${[0, 1].map(k => `<div class="ticker__set"${k ? ' aria-hidden="true"' : ''}>${C.ticker.map(i => `<span class="ticker__item"><i></i>${t(i)}</span>`).join('')}</div>`).join('')}</div></div>
</header>`;

const hero = `<section class="hero" id="top">
<div class="wrap hero__head">
  <div>
    <p class="kick">${t(C.hero.kick)}</p>
    ${el('h1', 'mis', C.hero.h1)}
  </div>
  <div class="hero__side">
    ${el('p', 'lede', C.hero.sub)}
    <div class="acts"><a class="btn" href="#zones" data-go="#zones">${t(C.cta)}</a><a class="lnk" href="#trails">${t(C.hero.link)}</a></div>
  </div>
</div>
<div class="wrap">${plate('hero', { cls: 'plate--hero', ar: '16/9', arm: '800/770', cap: C.hero.cap })}</div>
<div class="wrap glance">${C.glance.map(g => `<div><p class="glance__k">${t(g[0])}</p>${el('p', 'glance__v', g[1])}</div>`).join('')}</div>
</section>`;

const zones = `<section class="sec zones" id="zones" data-stage-at="1@0.62">
<div class="wrap zones__grid">
  <div class="zones__text">
    ${el('h2', 'mis', C.zones.h2)}
    ${el('p', 'lede', C.zones.intro)}
    <ol class="ladder">${C.zones.items.map(z => `<li><div class="ladder__alt">${t(z.alt)}</div><div><h3>${t(z.name)}</h3>${el('p', '', z.body)}</div></li>`).join('')}</ol>
  </div>
  <div class="zones__plates">
    ${plate('oldgrowth', { cls: 'plate--tall', ar: '4/5', cap: C.zones.capA })}
    ${plate('high', { cls: 'plate--over', ar: '5/3', arm: '700/560', cap: C.zones.capB })}
  </div>
</div>
</section>`;

const trails = `<section class="sec trails" id="trails">
<div class="wrap">
  <div class="split">
    ${el('h2', 'mis', C.trails.h2)}
    ${el('p', 'lede', C.trails.intro)}
  </div>
  <div class="tbl-wrap" data-stage-at="2@0.5"><table class="tbl">
    <thead><tr><th>Trail</th><th>Distance</th><th>Climb</th><th>Time</th><th>Status</th></tr></thead>
    <tbody>${C.trails.rows.map(r => `<tr><th scope="row"><b>${r[0]}</b>${t(r[1])}</th><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td class="status">${t(r[5])}</td></tr>`).join('')}</tbody>
  </table></div>
  ${el('p', 'note', C.trails.note)}
  ${plate('map', { cls: 'plate--map', ar: '10/7', arm: '640/700', cap: C.trails.cap })}
</div>
</section>`;

const rangers = `<section class="sec rangers" id="rangers">
<div class="wrap">
  <div class="split">
    ${el('h2', 'mis', C.rangers.h2)}
    ${el('p', 'lede', C.rangers.intro)}
  </div>
  ${plate('rangers', { ar: '1200/604', arm: '740/570', cap: C.rangers.cap, eyes: '2:cursor 4:up' })}
  <ul class="people">${C.rangers.people.map(p => `<li><h3>${t(p.name)}</h3><p class="role">${t(p.role)}</p>${el('p', '', p.bio)}</li>`).join('')}</ul>
</div>
</section>`;

// Stage 3 is hung on the elk picture itself, not on the top of the section. The picture is the first thing in the
// section and the herd stands in its lower half, so a marker at the top of the section fired before any of the
// animals had come into view. Now it fires when the top two fifths of the picture have gone under the page header.
// That is all sky, mountains and treetops: by then the reader has had the whole herd on screen, grazing, for about as
// long as the page allows, and every animal, antlers included, is still in view when they lift their heads.
const wildlife = `<section class="sec wildlife" id="wildlife">
${plate('meadow', { cls: 'plate--bleed', ar: '1200/520', arm: '720/530', cap: C.wildlife.cap, stage: [3, 0.4] })}
<div class="wrap wildlife__grid">
  <div>${el('h2', 'mis', C.wildlife.h2)}${el('p', 'lede', C.wildlife.intro)}</div>
  <dl class="species">${C.wildlife.items.map(s => `<div><dt>${t(s[0])}</dt>${el('dd', '', s[1])}</div>`).join('')}</dl>
</div>
</section>`;

const safety = `<section class="sec safety" id="safety">
<div class="wrap">
  ${el('h2', 'mis', C.safety.h2)}
  <div class="safety__grid">
    <div><ol class="rules">${C.safety.rules.map(r => `<li><h3>${t(r[0])}</h3>${el('p', '', r[1])}</li>`).join('')}</ol>
      <article class="doc doc--reg" aria-label="Trail register">
        <p class="doc__head">${t(C.reg.head)}</p>
        <table><thead><tr><th>Date</th><th>Name</th><th>Trail</th><th>In</th><th>Out</th></tr></thead><tbody>
        ${C.reg.rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td></tr>`).join('')}
        <tr id="you-row" data-from="5" style="display:none"><td class="r-date"></td><td>${t(C.reg.you)}</td><td>${t(C.reg.youTrail)}</td><td class="r-in"></td><td>&mdash;</td></tr>
        </tbody></table>
      </article>
    </div>
    <div class="docs" data-stage-at="4@0.3">
      <article class="doc doc--memo" aria-label="Staff memo">
        <p class="doc__head">${t(C.memo.head)}</p>
        <p class="doc__meta">${C.memo.meta.map(m => esc(m)).join('<br>')}</p>
        <ol>${C.memo.lines.map(l => `<li>${l.map(part => typeof part === 'string' ? esc(part) : `<span class="rd" data-lift="${part[0]}">${esc(part[1])}</span>`).join('')}</li>`).join('')}</ol>
        <p class="doc__hand" data-from="5" style="display:none">${esc(C.memo.hand)}</p>
        <span class="stamp">${t(C.memo.stamp)}</span>
      </article>
    </div>
  </div>
</div>
</section>`;

const stay = `<section class="sec stay dusk" id="stay">
<div class="wrap stay__grid">
  <div>${plate('lodge', { ar: '8/5', cap: C.stay.cap })}</div>
  <div>
    ${el('h2', 'mis', C.stay.h2)}
    ${el('p', 'lede', C.stay.intro)}
    <ul class="opts">${C.stay.opts.map(o => `<li><div class="opts__h"><h3>${t(o[0])}</h3><span>${t(o[1])}</span></div>${el('p', '', o[2])}</li>`).join('')}</ul>
  </div>
</div>
</section>`;

// Stage 5 is hung on the night picture, like stage 3 on the elk picture, and for the same reason: the picture comes
// first in its section and changes in two steps. The reader sees the hut with the snow gone from one side of its
// roof, and only when the top three tenths of the picture (all sky) have gone under the page header is the roof broken.
const night = `<section class="sec night dark" id="night">
<div class="wrap">
  ${plate('night', { ar: '5/3', arm: '700/560', cap: C.night.cap, stage: [5, 0.3] })}
  <div class="night__grid">
    ${el('h2', 'mis', C.night.h2)}
    <div>${el('p', 'lede', C.night.body)}<ul class="facts">${C.night.facts.map(x => `<li>${t(x)}</li>`).join('')}</ul></div>
  </div>
</div>
</section>`;

// The guest's testimonial. On the page it comes third, between the landscapes and the trails (see the order at the
// bottom of this file), so the reader meets her while the site is still an ordinary one and can watch her change.
// It is still built here, after the night section, so that every picture keeps the pattern numbers it has always had.
const voice = `<section class="sec voice dark" id="voice">
<div class="wrap voice__grid">
  ${plate('portrait', { cls: 'plate--portrait', ar: '7/8', eyes: '2:cursor 6:up' })}
  <figure class="quote"><blockquote>${el('p', 'mis', C.voice.quote)}</blockquote><figcaption>${t(C.voice.who)}</figcaption></figure>
</div>
</section>`;

// Stage 6 is hung on the pier picture: it fires when four fifths of the picture has come up into the window, so the
// reader has seen the people on the pier, and their own shadow in front of them, before the other shadow comes.
const plan = `<section class="plan dark" id="plan">
<div class="wrap plan__text">
  <div>
    ${el('h2', 'mis', C.plan.h2)}
    ${el('p', 'lede', C.plan.body)}
  </div>
  <div class="plan__end">
    <p class="typed" data-stage="6" data-text="${esc(C.plan.typed)}"><span></span></p>
    <a class="btn btn--big" id="final-cta" href="#top">${t(C.plan.cta)}</a>
    ${el('p', 'plan__cap', C.plan.cap)}
  </div>
</div>
${plate('finale', { cls: 'plate--bleed plate--finale', ar: '16/9', arm: '960/920', eyes: '5:up', stage: [6, 0.8, 0.9] })}
<footer class="foot">
<div class="wrap foot__grid">
  <p><b class="foot__brand">${t(C.brand)} ${t(C.brandSub)}</b> ${t(C.foot.by)}</p>
  <p>${C.foot.visit.map(x => `<span>${t(x)}</span>`).join(' ')}</p>
  <p>${C.foot.contact.map(x => `<span>${t(x)}</span>`).join(' ')}</p>
</div>
</footer>
</section>`;

// The two sections of information graphics: how the echo works (after the trails), and the three cards to check
// before going out (after the wildlife). Like the testimonial they are built here, after every picture that was on
// the page before them, so that those keep the pattern numbers they have always had. Each graphic is drawn in two
// layouts; the echo changes to its narrow one below 900 pixels, the cards below 700.
const echoSec = `<section class="sec echo" id="echo">
<div class="wrap">
  <div class="split">
    ${el('h2', 'mis', C.echo.h2)}
    ${el('p', 'lede', C.echo.intro)}
  </div>
  ${plate('echo', { cls: 'plate--info plate--echo', ar: '1200/640', arm: '420/632', cap: C.echo.cap, narrow: 900, label: C.echo.label })}
</div>
</section>`;
const field = `<section class="sec field" id="field">
<div class="wrap">
  <div class="split">
    ${el('h2', 'mis', C.field.h2)}
    ${el('p', 'lede', C.field.intro)}
  </div>
  <div class="tri">
    ${plate('tracks', { cls: 'plate--info', ar: '560/692', arm: '360/860', label: C.field.labels.tracks })}
    <div class="tri__side">
      ${plate('conditions', { cls: 'plate--info', ar: '560/330', arm: '360/566', label: C.field.labels.conditions })}
      ${plate('daylight', { cls: 'plate--info', ar: '560/330', arm: '360/400', label: C.field.labels.daylight })}
    </div>
  </div>
  ${el('p', 'tri__note', C.field.note)}
</div>
</section>`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(C.titles[0])}</title>
<link rel="icon" id="fav" href="data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2040%2040%27%3E%3Crect%20width=%2740%27%20height=%2740%27%20rx=%278%27%20fill=%27%2312303B%27/%3E%3Cg%20transform=%27translate%284.4,4.4%29%20scale%280.78%29%27%3E%3Cpath%20d=%27M4,20.6%20L15.5,4.6%20L21.5,13.2%20L25.5,9.4%20L36,20.6Z%27%20fill=%27%23F5F1E3%27/%3E%3Cpath%20d=%27M8.2,25.4%20H31.8%20M12.8,30%20H27.2%20M17.4,34.6%20H22.6%27%20fill=%27none%27%20stroke=%27%23F5F1E3%27%20stroke-width=%272.5%27%20stroke-linecap=%27round%27/%3E%3Ccircle%20cx=%2731.6%27%20cy=%276.4%27%20r=%273.3%27%20fill=%27%23F2B441%27/%3E%3C/g%3E%3C/svg%3E">
<meta name="description" content="Echo Basin National Park: a glacier lake, old-growth forest, alpine meadows and a snowbound pass. A work of fiction.">
<style>
${font('Fraunces', 'fonts/fraunces.woff2', 'font-weight:100 900;')}
${font('Source Sans 3', 'fonts/sourcesans3.woff2', 'font-weight:200 900;')}
${font('Special Elite', 'fonts/specialelite.woff2', 'font-weight:400;')}
${css}
</style>
</head>
<body data-stage="0">
<a class="skip" href="#main">Skip to content</a>
${nav}
<main id="main">
${hero}
${zones}
${voice}
${trails}
${echoSec}
${rangers}
${wildlife}
${field}
${safety}
${stay}
${night}
${plan}
</main>
<div id="cast" aria-hidden="true"></div>
<div id="tint" aria-hidden="true"></div>
<div id="flash" aria-hidden="true"></div>
<div id="paper" aria-hidden="true"></div>
<div id="grit" aria-hidden="true"></div>
<script>window.__TH=${JSON.stringify(C.thresholds)};window.__TITLES=${JSON.stringify(C.titles)};</script>
<script>
${js}
</script>
</body>
</html>`;
fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('dist/index.html', html);
console.log('dist/index.html', (html.length / 1024).toFixed(0) + ' KB');
