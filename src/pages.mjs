// Every page on the site, one line each. A page is one module in src/pages/ whose default export gives:
//   path         where it is written under dist/, such as 'index.html' or 'trails/echo-point/index.html'
//   titles       its seven tab titles, one for each stage
//   description  its meta description
//   main(ctx)    the HTML inside <main>. ctx.url(to) makes an address on the site ('assets/x.css', 'trails/', '' for
//                home) relative to this page. ctx.foot is the site's footer: a page that ends in a closing screen puts
//                it in that screen, and on any other the build puts it after <main>. ctx.last is the address for the
//                last button's href (see go.last).
//   go           optional: { plan, conditions, last }. plan and conditions are the two places the header button leads
//                to, 'plan/' and 'conditions/' unless given. last is where the last button (#final-cta) leads below
//                stage 5, while it is an ordinary link, '#top' unless given. One that starts with # is a place on the
//                page (see goes() and lastGo() in layout.mjs).
//   score        optional: false for a page that adds nothing to the score and is not recorded as a page opened (the
//                "not found" and credits pages). The stage still applies to it and its pictures behave as anywhere,
//                markers included: those two pages carry none (bible 12), so their pictures take mark: false.
//   absolute     optional: true for a page whose addresses are written from the site's base path ('/echo-basin/', the
//                build's --base) instead of relative to itself. Only the "not found" page, which the server sends for
//                a bad address at any depth. ctx.url() gives such addresses, so the page is written as any other.
// The build gives every page the same header, ticker, footer, stylesheet, script and fonts around that, and puts the
// path, titles, header button's places and a score: false in a <script type="application/json" data-page> at the top
// of <main> (see src/site.mjs). When pages are swapped in place (bible 10.8) the script takes <main>, that data with
// it, and the footer where it follows <main>, from the next page's file, and keeps everything else, so nothing a page
// needs of its own may sit outside <main> but its footer, and the header must be the same on every page apart from
// where its links lead and which one is marked current.
//
// What the stage engine (src/runtime.js, bible section 10) reads in main():
//   data-read="name"  a section. It scores a point the first time its middle is above the middle of the screen while
//                     some of it is still on screen. When the bottom of the page is reached, every section whose middle
//                     is on screen scores too, and so does the last one showing. One hidden at this stage scores
//                     nothing. The name is unique on the page (the save keeps "path#name"); with no value the id is used.
//   data-mark         a marker: it is reached when the element's top edge rises past 0.6 of the window height, or, at
//                     the bottom of the page, if it is on screen at all. data-mark="0.3" names another line;
//                     data-mark="head" is reached when it goes under the page header. A reached marker fires a stage
//                     that is due, and stays armed while the element is on screen until it has fired one. One stage per
//                     marker, each marker once per page view. Nothing fires in a page's first RULES.settle seconds, so
//                     a marker in the first screen is allowed: it waits for them, and fires then if it is past its
//                     line. A marker above the screen when the page has loaded is spent. Every page also has a marker
//                     of its own at its end, reached once the reader has been to the bottom and stayed RULES.read
//                     seconds; it needs no markup. See the top of runtime.js.
//   plate(name, {...})  every picture has a marker: mark: [line, at], [0.5, 0.5] unless given; mark: false for none.
//                     lag: false and ending: true are for the dock alone. point: 'name' makes small cards read together
//                     share one point. See plate() in html.mjs. A picture's marker catches the picture up; if it also
//                     fires a due stage, that follows about three seconds later.
//   plateOr(name, {...})  the same for a picture that may not be registered in src/scenes.mjs yet: until it is, a
//                     placeholder of its shape with the same caption, label and marker (html.mjs).
//   during({ from, until })  the attributes for an element that is only there from one stage to another (html.mjs).
//   el() and t()      words that change by stage. Inside a picture's <figure> they follow the picture's own stage.
//   checked(piece, stage, test, fallback)  a piece whose words at that stage say what the reader did (bible 10.6):
//                     shown only if the named test in SAID (src/runtime.js) is true when the stage reaches it, and the
//                     fallback otherwise. Both go into the page (data-ifN, data-elseN). Used for Echo Lake on the
//                     Explore page and in the home page's teaser, the last Wildlife entry, and the ticker.
//   data-go on a link  it goes where the header button goes at each stage: any button carrying the header button's
//                     words (C.cta) needs it, with goes(ctx)[0] from layout.mjs as its href for the page without script.
//   Ids it looks for: #final-cta (the last button), #you-row (the reader's line in the register); in the header, #go.
// The page's heading is its one h1 (the home page's is the hero's), and its first section is a .sec, which the
// stylesheet starts as far under the header as the home page's hero.
// The five trail pages are laid out by one template, src/trail.mjs, which says what each of their parts scores.
export { default as home } from './pages/home.mjs';
export { default as explore } from './pages/explore.mjs';
export { default as trails } from './pages/trails.mjs';
export { default as echoPoint } from './pages/echo-point.mjs';
export { default as lakeshoreLoop } from './pages/lakeshore-loop.mjs';
export { default as cathedralStand } from './pages/cathedral-stand.mjs';
export { default as halloranMeadows } from './pages/halloran-meadows.mjs';
export { default as echoPass } from './pages/echo-pass.mjs';
export { default as wildlife } from './pages/wildlife.mjs';
export { default as safety } from './pages/safety.mjs';
export { default as lodging } from './pages/lodging.mjs';
export { default as conditions } from './pages/conditions.mjs';
export { default as programs } from './pages/programs.mjs';
export { default as rangers } from './pages/rangers.mjs';
export { default as plan } from './pages/plan.mjs';
export { default as lostFound } from './pages/lost-found.mjs';
export { default as credits } from './pages/credits.mjs';
export { default as notFound } from './pages/not-found.mjs';
