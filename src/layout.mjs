// The parts every page carries: the header with the alert ticker in it, and the footer. Each is given the page's
// context, whose url() turns an address on the site into one relative to the page, for when these link to other pages,
// and whose path is where the page itself is written ('trails/echo-point/index.html').
import { C } from './content.mjs';
import { credits } from './content/credits.mjs';
import { rewordings } from './content/split.mjs';
import { t, esc, checked } from './html.mjs';

// How a link to a page stands to the page it is on: aria-current="page" for the page itself, "true" for a page under
// it (Trails, on the Echo Point page), nothing otherwise. The stylesheet marks both the same way, with a rule under the
// link rather than anything in its words, so the mark stays put when the menu becomes a sentence at stage 6.
// When pages are swapped in place (bible 10.8) the header stays, so the swap has to move this mark itself.
const current = (ctx, to) => !ctx.path || !to ? '' : ctx.path === to + 'index.html' ? ' aria-current="page"' : ctx.path.startsWith(to) ? ' aria-current="true"' : '';

// Where the footer's four entries lead (bible 11): three sections of the Plan page and the Lost and found page.
const VISIT = ['plan/#hours', 'plan/#fees', 'plan/#access', 'lost-and-found/'];
// The quiet second row of the footer: the pages that have no menu entry. The first three labels are the only words the
// layout adds of its own, approved with the split; the credits link's words come with that page's copy. They are plain
// links and do not change by stage.
const MORE = [['conditions/', 'Conditions'], ['programs/', 'Ranger programs'], ['rangers/', 'Meet the rangers'], ['credits/', credits.footerLink]];
// an address on the site with a place on its page, as an href relative to this page
const link = (ctx, to) => { const [page, hash] = to.split('#'); return esc(ctx.url(page) + (hash ? '#' + hash : '')); };

// Where the header button goes at each stage, 0 to 6 (bible 11): the Plan page at stages 0 to 2, the Conditions page at
// 3 and 4 (when it reads "Check conditions"), and the Plan page again from 5 (when it reads "Do not visit"). A page may
// name its own two places in ctx.go; one that starts with # is a place on that page. The script moves the button as
// the stage changes, so the list also goes into the page's data.
const place = (ctx, a) => a.startsWith('#') ? a : ctx.url(a);
export const goes = ctx => {
  const plan = ctx.go?.plan ?? 'plan/', conditions = ctx.go?.conditions ?? 'conditions/';
  return [plan, plan, plan, conditions, conditions, plan, plan].map(a => place(ctx, a));
};
// Where the last button (#final-cta) leads below stage 5, while it is still an ordinary link: ctx.go.last, named the
// same way, and the top of the page unless given. From stage 5 the script makes it the ending instead (bible 10.5).
// The build hands it to the page as ctx.last.
export const lastGo = ctx => place(ctx, ctx.go?.last ?? '#top');

// The ticker's second item says at stage 6 that Cedar Flats wasn't empty when the reader looked at the map, so that
// part is shown only if they have had the park map or the Cedar Flats site plan on screen (bible 10.6, the test "map"),
// with the copy's shorter line otherwise. The ticker is in the header, which stays when pages are swapped in place, so
// the answer is kept for the rest of the visit once it has been given.
const CEDAR = rewordings.find(r => r.new === C.ticker[1][1][6]);
const items = C.ticker.map((x, i) => i === 1 ? checked(x, 6, 'map', CEDAR.fallback) : x);
export const ticker = () => `<div class="ticker" aria-label="Park alerts"><div class="ticker__run">${[0, 1].map(k => `<div class="ticker__set"${k ? ' aria-hidden="true"' : ''}>${items.map(i => `<span class="ticker__item"><i></i>${t(i)}</span>`).join('')}</div>`).join('')}</div></div>`;

export const header = ctx => `<header class="top">
<nav class="nav" aria-label="Main">
  <a class="brand" href="${esc(ctx.url(''))}"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M4,20.6 L15.5,4.6 L21.5,13.2 L25.5,9.4 L36,20.6Z" fill="currentColor"/><path d="M8.2,25.4 H31.8 M12.8,30 H27.2 M17.4,34.6 H22.6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><circle cx="31.6" cy="6.4" r="3.3" fill="#F2B441"/></svg><span class="brand__name">${t(C.brand)}</span><span class="brand__sub">${t(C.brandSub)}</span></a>
  <div class="nav__links">${C.nav.map(n => `<a href="${esc(ctx.url(n[0]))}"${current(ctx, n[0])}>${t(n[1])}</a>`).join('')}</div>
  <button class="snd" id="snd" type="button" aria-pressed="false">Sound off</button>
  <a class="btn btn--sm" id="go" href="${esc(goes(ctx)[0])}" data-go>${t(C.cta)}</a>
</nav>
${ticker(ctx)}
</header>`;

// The footer is drawn to lie along the bottom of a closing screen, over its picture, the way it does on the Plan page.
// A page that ends in one puts the footer in that screen itself; on any other page the build puts it straight after
// the content, where the stylesheet makes it a band in the night tone the closing screens use. Under the usual three
// columns, a quiet row of links to the pages the menu does not carry.
export const footer = ctx => `<footer class="foot">
<div class="wrap foot__grid">
  <p><b class="foot__brand">${t(C.brand)} ${t(C.brandSub)}</b> ${t(C.foot.by)}</p>
  <p class="foot__visit">${C.foot.visit.map((x, i) => `<a href="${link(ctx, VISIT[i])}">${t(x)}</a>`).join(' ')}</p>
  <p>${C.foot.contact.map(x => `<span>${t(x)}</span>`).join(' ')}</p>
</div>
<div class="wrap foot__more">${MORE.map(([to, words]) => `<a href="${link(ctx, to)}"${current(ctx, to)}>${esc(words)}</a>`).join(' ')}</div>
</footer>`;
