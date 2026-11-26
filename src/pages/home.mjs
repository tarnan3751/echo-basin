// The home page: the hero with the at-a-glance row, a teaser for the landscapes, the guest's testimonial, and a teaser
// for each of Today and Plan. Six scored blocks (hero, glance, landscapes, voice, today, plan). Markers: the hero
// picture's own, the at-a-glance row, the landscapes teaser, the portrait's own, and the plan teaser.
// The hero's button and the plan teaser's carry the header button's words, so they go where it goes at each stage
// (data-go): to Conditions while they read "Check conditions".
import { C } from '../content.mjs';
import { homeTeasers } from '../content/split.mjs';
import { goes } from '../layout.mjs';
import { esc, t, el, plate, checked } from '../html.mjs';

// A teaser line that says what the reader did carries a check in the copy: Echo Lake's stage 5 line, the same line as
// on the Explore page with the same test ("lake", bible 10.6) and the copy's own fallback.
const line = z => z.check ? checked(z.line, z.check.stage, 'lake', z.check.fallback) : z.line;

const hero = ctx => `<section class="hero" id="top">
<div data-read="hero">
<div class="wrap hero__head">
  <div>
    <p class="kick">${t(C.hero.kick)}</p>
    ${el('h1', 'mis', C.hero.h1)}
  </div>
  <div class="hero__side">
    ${el('p', 'lede', C.hero.sub)}
    <div class="acts"><a class="btn" href="${esc(goes(ctx)[0])}" data-go>${t(C.cta)}</a><a class="lnk" href="${esc(ctx.url('trails/'))}">${t(C.hero.link)}</a></div>
  </div>
</div>
<div class="wrap">${plate('hero', { cls: 'plate--hero', ar: '16/9', arm: '800/770', cap: C.hero.cap })}</div>
</div>
<div class="wrap glance" data-read="glance" data-mark>${C.glance.map(g => `<div><p class="glance__k">${t(g[0])}</p>${el('p', 'glance__v', g[1])}</div>`).join('')}</div>
</section>`;

// The three teasers each say less than the page they point to (src/content/split.mjs, homeTeasers), and each ends in
// the way to that page. The landscapes teaser is the elevation ladder in brief, with its heading and link beside it.
const landscapes = ctx => `<section class="sec teaser" id="landscapes" data-read="landscapes" data-mark>
<div class="wrap teaser__grid">
  <div class="teaser__head">
    ${el('h2', 'mis', homeTeasers.landscapes.h2)}
    <p class="teaser__go"><a class="lnk lnk--go" href="${esc(ctx.url('explore/'))}">${t(homeTeasers.landscapes.link)}</a></p>
  </div>
  <ol class="ladder">${homeTeasers.landscapes.items.map(z => `<li><div class="ladder__alt">${t(z.alt)}</div><div><h3>${t(z.name)}</h3>${el('p', '', line(z))}</div></li>`).join('')}</ol>
</div>
</section>`;

// Today and Plan sit side by side as two panels after the testimonial, the way a park's front page offers the day's
// conditions and the trip. Each is its own scored block; the plan panel carries the marker.
const today = ctx => `<section class="panel" id="today" data-read="today">
  ${el('h2', 'mis', homeTeasers.today.h2)}
  ${el('p', 'lede', homeTeasers.today.body)}
  <p class="panel__go"><a class="lnk lnk--go" href="${esc(ctx.url('conditions/'))}">${t(homeTeasers.today.link)}</a></p>
</section>`;

const planTeaser = ctx => `<section class="panel" id="plan" data-read="plan" data-mark>
  ${el('h2', 'mis', homeTeasers.plan.h2)}
  ${el('p', 'lede', homeTeasers.plan.body)}
  <p class="panel__go"><a class="btn" href="${esc(goes(ctx)[0])}" data-go>${t(homeTeasers.plan.cta)}</a></p>
</section>`;

const panels = ctx => `<div class="sec panels"><div class="wrap panels__grid">
${today(ctx)}
${planTeaser(ctx)}
</div></div>`;

// The guest's testimonial. It comes between the landscapes and the Today teaser, so the reader meets her while the
// site is still an ordinary one and can watch her change.
const voice = () => `<section class="sec voice dark" id="voice" data-read="voice">
<div class="wrap voice__grid">
  ${plate('portrait', { cls: 'plate--portrait', ar: '7/8', eyes: '2:cursor 6:up' })}
  <figure class="quote"><blockquote>${el('p', 'mis', C.voice.quote)}</blockquote><figcaption>${t(C.voice.who)}</figcaption></figure>
</div>
</section>`;

export default {
  path: 'index.html',
  titles: C.titles,
  description: 'Echo Basin National Park: a glacier lake, old-growth forest, alpine meadows and a snowbound pass. A work of fiction.',
  main: ctx => [hero(ctx), landscapes(ctx), voice(), panels(ctx)].join('\n'),
};
