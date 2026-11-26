// The page shown at any address that is not on the site (bible 12, "Not found"): the heading, a line or two, the way
// to the trail map, and a trail sign in mist whose wording carries the page's own short ladder. It adds nothing to the
// score and carries no markers, so the sign has none either: it catches up to the site's stage once it has been
// looked at for a few seconds.
// It is written to dist/404.html, which the server sends for a bad address at any depth. An address relative to the
// page would then point somewhere else for every depth, so its addresses are written from the site's base path
// (absolute: true; the path is the build's --base, see build.mjs), the only page whose are.
// The sign is drawn by plateOr(), which leaves a placeholder of the same shape until it is registered in src/scenes.mjs.
import { notFound as N } from '../content/not-found.mjs';
import { esc, el, t, plateOr } from '../html.mjs';

const notFound = ctx => `<section class="sec lost404" id="nowhere">
<div class="wrap lost404__grid">
  <div class="lost404__text">
    ${el('h1', 'mis', N.h1)}
    ${el('p', 'lede', N.body)}
    <p class="lost404__go"><a class="lnk lnk--go" href="${esc(ctx.url('trails/'))}">${t(N.link)}</a></p>
  </div>
  ${plateOr('sign', { ar: '900/480', arm: '360/400', mark: false, label: N.alt })}
</div>
</section>`;

export default {
  path: '404.html',
  absolute: true,
  score: false,
  titles: N.titles,
  description: 'Page not found, Echo Basin National Park. A work of fiction.',
  main: ctx => notFound(ctx),
};
