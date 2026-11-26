// Echo Basin decay engine. Story bible section 10 is the authority for everything here.
//
// The whole site has one stage, 0 to 6. It is saved in the browser along with the reader's other facts (the score,
// which sections have been read, how long each picture has been on screen, the pages opened, when they first arrived),
// and it only goes up. Reading earns points: a section whose middle passes the middle of the screen, a picture that has
// been on screen for twelve seconds, up to seven from any one page (see RULES). Points make the next stage due, and a
// due stage fires at the next marker the reader reaches, one stage per marker. Pictures run one stage behind the words
// and catch up at their own marker, so that most pictures change while somebody is looking at them. When a picture's
// marker is also the one that fires a stage, the picture catches up first and the stage follows a few seconds later, so
// that no picture ever skips a stage in front of the reader.
//
// Where a due stage fires. The pages are short, so most of their markers are on screen when the page arrives, and a
// due stage has to find somewhere to fire on any page the reader actually reads, without ever firing in the first
// moments of arriving (bible 10.3: the reader sees the thing in its earlier state first). So:
//  - Nothing on a page changes in its first RULES.settle seconds. A marker reached sooner, including one already past
//    its line when the page arrives, waits, and is taken when the time is up if what it marks is still on screen. A
//    marker above the screen when the page arrives is spent without being taken.
//  - A marker that has been reached stays armed for as long as what it marks (its picture, or its block) is on screen:
//    a stage that is due, or becomes due while the reader is still looking at it, fires there. It is spent when it has
//    fired one, or when what it marks has gone off the top of the screen.
//  - Every page also has a marker at its end, where the content gives way to the footer. It is reached once the reader
//    has been to the bottom of the page and has been on the page for RULES.read seconds, so on a page too short to
//    scroll it is reached after that time alone. It stays armed until it has fired a stage, so a stage that becomes due
//    while the reader is still on a page they have read to the end fires there.
//  - One stage per marker and per page end, and never two stages within RULES.space seconds of each other, across
//    pages as well. A marker reached too soon stays armed, as above, and fires when the time is up.
// So a page the reader scrolls through, or stays on long enough to read, always has somewhere for a due stage to fire.
//
// The code is in two parts:
//  - the visit: the save, the score, the header, ticker and footer, the tab, the sound and the wear (darkening, colour
//    drain, misregistration, grain). These last as long as the browser tab does.
//  - the page: the words, pictures, markers, observers and timers inside <main>. startPage() takes them up and
//    stopPage() lets go of every one of them, so that one page can be swapped for another in place.
// Words that change on screen scramble letter by letter into their new version; words off screen swap silently.
// A few lines at stages 5 and 6 tell the reader what they did. Each is shown only if it is true (see SAID).
//
// Moving between pages (bible 10.8). Served from a web address, a link to another page of the site fetches that page
// and puts its content in place of this one's, so the visit (header, ticker, sound, wear) carries on unbroken; the
// address, the tab, the history and the reader's place in each page behave as they would for an ordinary link. If the
// fetch fails, is slow, or brings back anything but one of this site's pages, the link is followed the ordinary way.
// Opened from disk, with ?stage=N, or without scripts, links are ordinary links. See "moving between pages" below.
//
// For development: ?stage=N shows everything at stage N, pictures included, scores nothing and saves nothing; only
// the ending moves it on from stage 5. It holds for one page load, so its links load the ordinary way. ?reset clears
// the save. ?nosave runs the real clock without reading or writing the save. ?fast=N runs the clock's timers N times
// faster. ?wear=0 leaves the wear off, so that the screenshot script shows only words and drawings. Those last three
// stay in force for pages swapped in after it. window.__echo says where things stand.
(function () {
  'use strict';
  // ---------- the rules, together in one place because they will be tuned ----------
  // The pacing agreed in bible 10.2: the home page alone leaves a reader at stage 2, or 3 if they stop at its two
  // pictures; stage 4 comes during the third page and stage 5 by about the fifth, and from stage 5 the dock on the Plan
  // page fires stage 6. On the finished site of seventeen pages no thresholds alone could hold that, because pages
  // are worth anything from two points (Lost and found) to nine (each trail page), and the long ones lie together: the
  // home page and the Plan page made 16 by the end of the second page, and two trail pages in a row 18. So a page
  // adds at most RULES.cap points, however much there is on it, and with a cap of 7 (the home page's 8 less one, so
  // that its pictures still decide between stages 2 and 3) the thresholds become counts of whole pages: stage 3 at 7
  // is one page read through; stage 4 at 15 is more than any two pages can give, so it comes on the third page at
  // the soonest; stage 5 at 22 is more than any three can give, so it comes on the fourth at the soonest, and with the
  // shorter pages most orders have in them it comes on the fourth to the sixth. Tuned with walk.mjs on the orders
  // listed at the top of that file.
  var RULES = {
    version: 3,                                      // raise it when a change here makes old saves mean something else
    due: [2, 4, 7, 15, 22],                          // the points at which stages 1 to 5 become due
    cap: 7,                                          // the most points one page can add to the score
    dwell: 12,                                       // seconds on screen before a picture earns its point
    glance: 4,                                       // seconds on screen before a picture with no marker to reach catches up
    settle: 5,                                       // seconds on a page before anything on it changes
    gap: 3,                                          // seconds between a picture catching up at its marker and the stage that marker fires
    space: 8,                                        // the fewest seconds between two stages
    read: 10,                                        // seconds on a page before its end can fire a stage
    line: 0.6,                                       // where a marker that names no line of its own is reached
    floor: [0, 0.12, 0.28, 0.46, 0.60, 0.74, 0.90],  // the wear each stage starts from: see wear()
    span: 0.12,                                      // the wear that scrolling the whole length of a page adds to that
    stare: 30                                        // seconds on screen in all that make a look at a picture a long one
  };
  // Lines that say what the reader did (bible 10.6). Such a line is shown only if it is true, and a plain line in its
  // place otherwise. The page carries both and names the test that decides between them (data-if5="lake", with the
  // plain line in data-else5: see checked() in src/html.mjs). A test is asked when the stage that shows its line is
  // applied to the line (when the page opens at that stage, or when the stage fires while the line is on the page),
  // from what the save knows then, and the answer stays with the line for as long as it shows that stage's words, so a
  // line never changes in front of the reader except with a stage. Seconds are clock seconds, as everywhere here.
  var SAID = {
    // the lake at the top of the home page has been on screen for RULES.stare seconds in all, over every visit
    lake: function () { return (S.seen.hero || 0) >= RULES.stare; },
    // every picture the reader has reached has been on screen long enough to earn its point, and they have reached one
    every: function () { var k, n = 0; for (k in S.seen) if (S.seen[k] > 0) { if (S.seen[k] < RULES.dwell) return false; n++; } return n > 0; },
    // the park map (Trails page) or the Cedar Flats site plan (Lodging page) has been on screen at all
    map: function () { return S.seen.map > 0 || S.seen.sitePlan > 0; }
  };
  var KEY = 'echo-basin';
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)');
  var MOBILE = window.matchMedia('(max-width: 700px)');
  // small or touch-first devices skip the full-screen backdrop filter; everything else still decays
  var LIGHT = window.matchMedia('(max-width: 900px), (pointer: coarse)').matches || /[?&]light=1/.test(location.search);
  var doc = document.documentElement, body = document.body;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var smooth = function (a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  // ---------- developer overrides ----------
  function arg(name) { var m = new RegExp('[?&]' + name + '(=[^&]*)?(&|$)').exec(location.search); return m ? decodeURIComponent((m[1] || '=').slice(1)) : null; }
  var FORCED = /^[0-6]$/.test(arg('stage')) ? +arg('stage') : null;
  var NOSAVE = FORCED !== null || arg('nosave') !== null;
  var FAST = Math.max(1, +arg('fast') || 1);
  var STILL = arg('wear') === '0';
  if (arg('reset') !== null) try { localStorage.removeItem(KEY); } catch (e) {}

  // ---------- the save ----------
  // v: the rules' version. stage. read: the sections read, as 'page path#section'. seen: seconds each picture has been
  // on screen, by picture. looks: the points earned by looking, by the name each picture scores under (several small
  // cards seen together share one: see plate() in html.mjs), as 'page path#name' like the sections, so that the score
  // can tell which page each came from. pages: the pages opened, in order, as [path, time].
  // first: the time of first arrival. last: when the last stage fired, so that the next keeps its distance.
  function blank() { return { v: RULES.version, stage: 0, read: {}, seen: {}, looks: {}, pages: [], first: Date.now(), last: 0 }; }
  function stored() {
    try { var s = JSON.parse(localStorage.getItem(KEY)); return s && s.v === RULES.version && s.read && s.seen && s.looks && s.pages ? s : null; } catch (e) { return null; }
  }
  var S = (!NOSAVE && stored()) || blank();
  if (FORCED !== null) S.stage = FORCED;
  // Another tab on the site keeps its own copy of the save. Whatever either has learnt is kept: the earlier first
  // arrival, every section read in either, the longer look at each picture, both lists of pages. (The stage is not
  // taken here: a higher one has to be shown as well as stored, and the callers do that.)
  function learn(o) {
    var k, seen = {}, all;
    if (o.first < S.first) S.first = o.first;
    if (o.last > S.last) S.last = o.last;
    for (k in o.read) S.read[k] = 1;
    for (k in o.looks) S.looks[k] = 1;
    for (k in o.seen) if (!(S.seen[k] >= o.seen[k])) S.seen[k] = o.seen[k];
    all = S.pages.concat(o.pages).filter(function (p) { var id = p[0] + ' ' + p[1]; if (seen[id]) return false; seen[id] = 1; return true; });
    S.pages = all.sort(function (a, b) { return a[1] - b[1]; }).slice(-100);
  }
  function save() {
    if (NOSAVE) return;
    try {
      var o = stored(), out = {}, k;
      if (o) learn(o);
      for (k in S) out[k] = S[k];
      if (o && o.stage > out.stage) out.stage = o.stage;   // never written back lower than another tab left it
      localStorage.setItem(KEY, JSON.stringify(out));
    } catch (e) {}
  }
  window.addEventListener('storage', function (e) {
    if (NOSAVE || e.key !== KEY) return;
    var o = stored(); if (!o) return;
    learn(o);
    // the reader moved the story on in another tab: this one catches up the way a page opened at that stage would
    if (o.stage > S.stage) setStage(o.stage, { quiet: true, why: 'another tab' });
  });

  // ---------- the score ----------
  // A section read and a picture looked at are a point each, and each page adds at most RULES.cap of them (see RULES).
  // Every one is still kept in the save, so what the reader did is known even where it no longer adds anything.
  function score() {
    var by = {}, n = 0, k, p;
    for (k in S.read) { p = k.slice(0, k.lastIndexOf('#')); by[p] = (by[p] || 0) + 1; }
    for (k in S.looks) { p = k.slice(0, k.lastIndexOf('#')); by[p] = (by[p] || 0) + 1; }
    for (p in by) n += Math.min(by[p], RULES.cap);
    return n;
  }
  function due() { var n = 0, p = score(); while (n < RULES.due.length && p >= RULES.due[n]) n++; return n; }
  // Everything the clock does, numbered, for window.__echo and the scripted reader (walk.mjs).
  var LOG = [], seq = 0;
  // age: clock seconds the reader had been on the page.
  function note(o) { o.n = ++seq; o.t = Date.now(); o.page = P ? P.path : null; o.age = P ? Math.round(P.age * 10) / 10 : null; o.y = Math.round(window.scrollY); LOG.push(o); if (LOG.length > 500) LOG.shift(); }

  // ---------- the reader's own facts ----------
  // {m} is how long since they first arrived on the site; {date} and {time} are when that was; {now} is the date and
  // time the words are put on the page. Written the way the park writes dates and times: "Sept. 13", "7:42 pm".
  var MONTHS = ['Jan.', 'Feb.', 'March', 'April', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];
  function dateOf(d) { return MONTHS[d.getMonth()] + ' ' + d.getDate(); }
  function timeOf(d) { var h = d.getHours(); return ((h + 11) % 12 + 1) + ':' + ('0' + d.getMinutes()).slice(-2) + (h < 12 ? ' am' : ' pm'); }
  function fill(s) {
    if (s.indexOf('{') < 0) return s;
    var a = new Date(S.first), now = new Date(), mins = Math.max(1, Math.round((now - a) / 60000));
    return s.replace(/\{m\}/g, mins === 1 ? 'a minute' : mins + ' minutes').replace(/\{date\}/g, dateOf(a)).replace(/\{time\}/g, timeOf(a)).replace(/\{now\}/g, dateOf(now) + ', ' + timeOf(now));
  }

  // ---------- words ----------
  // A piece of text keeps what it said at stage 0 and what it says now on itself, and whose stage it follows: the
  // site's, or that of the picture it is the caption of.
  function adopt(el, owner) {
    if (el.__base === undefined) { el.__base = el.textContent; el.__cur = el.textContent; }
    el.__owner = owner || null;
    return el;
  }
  function versionFor(el, stage) {
    for (var s = stage; s >= 1; s--) { var v = el.getAttribute('data-s' + s); if (v !== null) return fill(said(el, s) ? v : el.getAttribute('data-else' + s)); }
    return fill(el.__base);
  }
  // Whether a piece's words for stage s are true of the reader: always, unless they name a test (SAID). The answer is
  // kept on the piece, so it is asked once, when that stage first reaches it. Pieces inside <main> are new with every
  // page; the header's last the visit.
  function said(el, s) {
    var name = el.getAttribute('data-if' + s), ok;
    if (name === null) return true;
    if (!el.__said) el.__said = {};
    if (!(s in el.__said)) {
      ok = el.__said[s] = !!(SAID[name] && SAID[name]());
      note({ type: 'said', test: name, stage: s, ok: ok, text: ok ? el.getAttribute('data-s' + s) : el.getAttribute('data-else' + s) });
    }
    return el.__said[s];
  }
  var GLYPHS = 'abcdefghijklmnopqrstuvwxyz';
  function scramble(el, to, done) {
    var from = el.textContent, len = Math.max(from.length, to.length), frame = 0;
    var total = Math.round(clamp(20 + len * 0.55, 24, 80));
    if (el.__raf) cancelAnimationFrame(el.__raf);
    (function tick() {
      frame++;
      var prog = frame / total, out = '', i, a, b, th;
      for (i = 0; i < len; i++) {
        a = from.charAt(i); b = to.charAt(i); th = (i / len) * 0.72;
        if (prog >= th + 0.28) out += b;
        else if (prog < th) out += a;
        else out += (b === ' ' || b === '' || a === ' ') ? (b || ' ') : GLYPHS.charAt((Math.random() * 26) | 0);
      }
      el.textContent = out;
      if (frame < total) el.__raf = requestAnimationFrame(tick); else { el.textContent = to; el.__raf = 0; if (done) done(); }
    })();
  }
  // Changing copy changes heights. Three cases keep the reader's place steady:
  //  - blocks above the viewport: swap, then scroll by exactly the height they lost (manual scroll anchoring)
  //  - blocks on screen: hold their height through the scramble, then ease to the new height
  //  - blocks below the viewport: just swap
  function blockOf(el) { return (el.tagName === 'SPAN' || el instanceof SVGElement) ? null : el; }
  function settle(blk, h0) {
    blk.style.transition = ''; blk.style.minHeight = '';
    var h1 = blk.getBoundingClientRect().height;
    if (h1 >= h0 - 1 || RM.matches) return;
    blk.style.minHeight = h0.toFixed(1) + 'px'; void blk.offsetHeight;
    blk.style.transition = 'min-height .7s cubic-bezier(.3,.7,.2,1)'; blk.style.minHeight = h1.toFixed(1) + 'px';
    later(function () { blk.style.transition = ''; blk.style.minHeight = ''; }, 760);
  }
  function stageOf(owner) { return owner ? owner.stage : S.stage; }
  function applyCopy(els, animate) {
    var changes = [], vh = window.innerHeight;
    els.forEach(function (el) {
      var to = versionFor(el, stageOf(el.__owner));
      if (to === el.__cur) return;
      var blk = blockOf(el), r = (blk || el).getBoundingClientRect();
      changes.push({ el: el, to: to, blk: blk, h: r.height, where: r.bottom <= 0 ? 'above' : r.top >= vh ? 'below' : 'in' });
    });
    changes.forEach(function (c) {
      c.el.__cur = c.to;
      if (animate && !RM.matches && c.where === 'in' && c.el.getClientRects().length) {
        if (c.blk) c.blk.style.minHeight = c.h.toFixed(1) + 'px';
        scramble(c.el, c.to, c.blk ? function () { settle(c.blk, c.h); } : null);
      } else { if (c.el.__raf) { cancelAnimationFrame(c.el.__raf); c.el.__raf = 0; } c.el.textContent = c.to; }
    });
  }

  // ---------- the tab ----------
  var titleTimer = 0;
  function setTitle(to, animate) {
    clearInterval(titleTimer);
    if (!animate || RM.matches) { document.title = to; return; }
    var from = document.title, n = 0, total = 22;
    titleTimer = setInterval(function () {
      n++; var out = '', len = Math.max(from.length, to.length), i;
      for (i = 0; i < len; i++) out += (i / len < n / total) ? to.charAt(i) : (from.charAt(i) === ' ' ? ' ' : GLYPHS.charAt((Math.random() * 26) | 0));
      document.title = out;
      if (n >= total) { clearInterval(titleTimer); document.title = to; }
    }, 45);
  }
  // the tab icon loses its sun at stage 4 and goes dark at stage 6
  function favicon(n) {
    var l = $('#fav'); if (!l || n < 4) return;
    var svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><rect width='40' height='40' rx='8' fill='" + (n >= 6 ? '#05090F' : '#12303B') + "'/>" + (n >= 6 ? '' : "<g transform='translate(4.4,4.4) scale(0.78)'><path d='M4,20.6 L15.5,4.6 L21.5,13.2 L25.5,9.4 L36,20.6Z' fill='#F5F1E3'/><path d='M8.2,25.4 H31.8 M12.8,30 H27.2 M17.4,34.6 H22.6' fill='none' stroke='#F5F1E3' stroke-width='2.5' stroke-linecap='round'/></g>") + '</svg>';
    l.href = 'data:image/svg+xml,' + encodeURIComponent(svg);
  }

  // ---------- putting a stage on the page ----------
  // A picture that has not yet been caught up shows the stage before the site's; one that has, or never lags (the
  // dock), shows the site's.
  function want(pl) { return pl.stepped ? S.stage : Math.max(0, S.stage - 1); }
  // the words and the staged parts outside the page: header, ticker, and the footer when it is not part of the page
  var FURN = [], FSTAGED = [];
  function staged(el, owner) { return { el: el, owner: owner, a: +(el.getAttribute('data-from') || 0), b: el.hasAttribute('data-until') ? +el.getAttribute('data-until') : 9 }; }
  function show(s) { var n = stageOf(s.owner); s.el.style.display = (n >= s.a && n <= s.b) ? '' : 'none'; }
  function render(animate) {
    body.setAttribute('data-stage', S.stage);
    if (P) P.plates.forEach(function (pl) { pl.stage = want(pl); });
    applyCopy(P ? FURN.concat(P.texts) : FURN, animate);
    FSTAGED.forEach(show);
    if (!P) return;
    P.staged.forEach(show);
    P.redact.forEach(function (el) { el.classList.toggle('lift', S.stage >= +el.getAttribute('data-lift')); });
    // The header button goes where the page says it goes at this stage (bible 11), and so does every other button that
    // carries its words (data-go), so that "Check conditions" never leads to the Plan page.
    var go = P.data.go && P.data.go[S.stage];
    if (go) $$('a[data-go]').forEach(function (a) { a.setAttribute('href', go); });
    register();
  }
  function slip() {
    // the "plate slip": a registration jump that covers the moment things change
    if (RM.matches) return;
    var main = $('#main'), flash = $('#flash');
    main.classList.remove('slip'); void main.offsetWidth; main.classList.add('slip');
    flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go');
  }
  // Something on screen to hold still while words change: the thing that set the change off if it is in view,
  // otherwise whatever is in the middle of the screen.
  function holdFor(near) {
    var vh = window.innerHeight, i, r;
    if (near) { r = near.getBoundingClientRect(); if (r.top > -vh * 0.25 && r.top < vh) return near; }
    var el = document.elementFromPoint(window.innerWidth / 2, vh / 2), kids, next;
    while (el && !(el instanceof HTMLElement)) el = el.parentElement;        // not a shape inside a picture: a stage may take it away
    // if that is a container which starts above the screen, go down to the part of it that is on screen
    while (el && el.getBoundingClientRect().top < 0) {
      kids = el.children; next = null;
      for (i = 0; i < kids.length; i++) if (kids[i] instanceof HTMLElement && kids[i].getClientRects().length && kids[i].getBoundingClientRect().bottom > vh * 0.3) { next = kids[i]; break; }
      if (!next) break;
      el = next;
    }
    return el;
  }
  // Changing the words changes how tall the page is, above the screen as well as on it, and what the reader is looking
  // at must not jump when that happens. So one thing on screen is noted beforehand, and afterwards the page is
  // scrolled by however far that thing was pushed. (The browser's own scroll anchoring is switched off in the
  // stylesheet; not every browser has it, and this way all of them behave alike.)
  function change(near, animate, work) {
    var hold = animate ? holdFor(near) : null, y0 = hold ? hold.getBoundingClientRect().top : 0;
    work();
    if (hold) { var moved = hold.getBoundingClientRect().top - y0; if (Math.abs(moved) > 0.5) window.scrollBy(0, moved); }
    if (animate) slip();
  }
  // how: { mark: the marker that fired it, near: what to hold still, why: for the log, quiet: no animation }
  function setStage(n, how) {
    n = Math.min(6, n); how = how || {};
    if (n <= S.stage) return;
    var from = S.stage, animate = !how.quiet, was = P ? P.plates.map(function (pl) { return pl.stage; }) : [];
    change(how.mark ? how.mark.el : how.near, animate, function () {
      S.stage = n;
      if (animate) S.last = Date.now();
      save();
      render(animate);
      // the log also says which pictures moved with the stage, and from what to what
      var moved = [], i;
      if (P) for (i = 0; i < P.plates.length; i++) if (P.plates[i].stage !== was[i]) moved.push([P.plates[i].name, was[i], P.plates[i].stage]);
      note({ type: 'stage', from: from, to: n, why: how.why || '', mark: how.mark ? how.mark.i : null, at: how.mark ? how.mark.name : null, score: score(), due: due(), pictures: moved });
    });
    if (P && P.data.titles) setTitle(P.data.titles[n], animate);
    favicon(n);
    if (window.__sound) window.__sound.stage(n);
    wear();
  }
  // A picture catching up on its own, at its marker m or after a look, with the slip. Says whether it moved.
  function step(pl, how, m) {
    var from = pl.stage;
    pl.stepped = true;
    if (want(pl) === from) return false;
    change(pl.el, true, function () { render(true); });
    note({ type: 'step', name: pl.name, from: from, to: pl.stage, how: how, mark: m ? m.i : null });
    return true;
  }

  // ---------- the page ----------
  var P = null;
  // The page's words, pictures, markers and scored sections are found under root (normally <main>), with what the
  // build put in its <script type="application/json" data-page>: its path, its seven tab titles, where the header
  // button goes at each stage, and score: false on a page that adds nothing to the score and is not counted as a page
  // opened (the "not found" and credits pages). The stage applies to every page alike.
  function startPage(root) {
    stopPage();
    root = root || $('#main');
    var data = {}, d = $('script[data-page]', root);
    try { if (d) data = JSON.parse(d.textContent); } catch (e) {}
    // age: clock seconds on the page so far, counted only while it can be seen. calm: the moment (performance.now())
    // before which no stage fires, while a picture that has just caught up is looked at.
    P = {
      root: root, data: data, path: data.path || location.pathname, scores: FORCED === null && data.score !== false,
      plates: [], texts: [], staged: [], marks: [], sections: [], ending: null, close: null, settled: false, age: 0, calm: 0,
      redact: $$('.rd', root), misEls: $$('.mis', root), frames: $$('.plate__frame', root),
      typed: $$('.typed', root).map(function (el) { return { el: el, full: '', shown: 0 }; }),
      inView: new Set(), timers: [], raf: 0, timer: 0, last: performance.now(), saved: 0
    };
    $$('.plate', root).forEach(function (el) {
      var pl = { el: el, name: el.getAttribute('data-scene'), img: $('.plate__img', el), layers: $$('.ly', el), eyes: $$('.eye', el), gaze: el.getAttribute('data-eyes'),
        point: el.getAttribute('data-point') || el.getAttribute('data-scene'),
        stepped: FORCED !== null || el.getAttribute('data-lag') === '0', stage: 0, look: 0, glance: true, mark: null };
      el.__plate = pl; P.plates.push(pl);
    });
    var owner = function (el) { var p = el.closest('.plate'); return p ? p.__plate : null; };
    var outside = function (el) { return !root.contains(el); };
    FURN = $$('.t').filter(outside).map(function (el) { return adopt(el, null); });
    FSTAGED = $$('[data-from],[data-until]').filter(outside).map(function (el) { return staged(el, null); });
    P.texts = $$('.t', root).map(function (el) { return adopt(el, owner(el)); });
    P.staged = $$('[data-from],[data-until]', root).map(function (el) { return staged(el, owner(el)); });
    // A marker is data-mark="f": reached when its top edge rises past fraction f of the screen height. Or "head":
    // reached when it goes under the page header, which is as late as something can be and still be in view. what is
    // the thing it marks, which has to be on screen when it is taken: the picture, or the marked block itself.
    P.marks = $$('[data-mark]', root).map(function (el, i) {
      var v = el.getAttribute('data-mark'), pl = el.classList.contains('plate__mark') ? owner(el) : null, near = el.closest('[id]');
      var m = { el: el, what: pl ? (pl.img || pl.el) : el, i: i, at: v === 'head' ? 'head' : (v === '' ? RULES.line : +v), end: el.hasAttribute('data-ending'), plate: pl,
        spent: false, shown: false, early: false, waiting: false,
        name: pl ? 'picture "' + pl.name + '"' : el.id ? '#' + el.id : (el.className ? '.' + String(el.className).split(' ')[0] : el.tagName.toLowerCase()) + (near ? ' in #' + near.id : '') };
      if (pl) { pl.mark = m; pl.glance = false; }
      if (m.end && pl) P.ending = pl;
      return m;
    });
    // and the page's own end, last in the list: it has no element (see check()). A page that scores nothing (the credits
    // and "not found" pages) carries no markers (bible 12), so its end is spent from the start.
    P.close = { el: null, what: null, i: P.marks.length, at: 'end', end: false, close: true, plate: null, spent: data.score === false, shown: true, early: false, waiting: false, reached: false, name: 'the end of the page' };
    P.marks.push(P.close);
    P.sections = $$('[data-read]', root).map(function (el, i) { var name = el.getAttribute('data-read') || el.id || String(i); return { el: el, name: name, key: P.path + '#' + name }; });
    note({ type: 'page', path: P.path, stage: S.stage, score: score(), due: due() });
    // arriving: the words at the site's stage and the pictures a stage behind, all without animation
    crops();
    render(false);
    if (data.titles) setTitle(data.titles[S.stage], false);
    favicon(S.stage);
    P.io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { P.inView.add(e.target); e.target.classList.add('in'); } else P.inView.delete(e.target); });
    }, { rootMargin: '10% 0px 10% 0px' });
    P.gio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { window.Grain.fillAll(e.target); P.gio.unobserve(e.target); } });
    }, { rootMargin: '140% 0px 140% 0px' });
    P.plates.forEach(function (pl) { P.io.observe(pl.el); P.gio.observe(pl.el); });
    P.timer = setInterval(watch, 250);
    if (data.score !== false) { S.pages.push([P.path, Date.now()]); if (S.pages.length > 100) S.pages.splice(0, S.pages.length - 100); }
    save();
    last.mis = -1;
    // Markers are weighed once the page has finished arriving, since a browser puts a reader back where they were in a
    // page, or at the place a link points to, only once it has loaded. Whatever is above the screen then is spent.
    var p = P, settle = function () { p.raf = requestAnimationFrame(function () { if (P !== p) return; p.settled = true; check(); }); };
    if (document.readyState === 'complete') settle(); else { P.onload = settle; window.addEventListener('load', settle); }
    check(); wear();
  }
  function stopPage() {
    if (!P) return;
    P.io.disconnect(); P.gio.disconnect();
    clearInterval(P.timer); cancelAnimationFrame(P.raf); P.timers.forEach(clearTimeout);
    if (P.onload) window.removeEventListener('load', P.onload);
    P.texts.forEach(function (el) { if (el.__raf) { cancelAnimationFrame(el.__raf); el.__raf = 0; el.textContent = el.__cur; } });
    save();
    P = null;
  }
  function later(fn, ms) { var id = setTimeout(fn, ms); if (P) P.timers.push(id); return id; }

  // ---------- reading: sections, markers, pictures ----------
  // Called on every scroll and four times a second, so that a marker waiting for its time is taken when the time is up.
  function check() {
    if (!P) return;
    var vh = window.innerHeight, head = topBar ? topBar.getBoundingClientRect().bottom : 0, i, r, w, s, m, was, end = null;
    var bottom = window.scrollY + vh >= doc.scrollHeight - 2;
    // A section counts the first time its middle is above the middle of the screen while some of it is still on
    // screen; one jumped over is not read. When the bottom of the page is reached, every section whose middle is on
    // screen counts as well, since the page cannot bring it any higher, and so does the last one showing at this
    // stage. One that is not on the page at this stage (the memo before stage 3) does not count at all.
    if (P.scores) {
      for (i = P.sections.length - 1; i >= 0 && !end; i--) if (P.sections[i].el.getClientRects().length) end = P.sections[i];
      for (i = 0; i < P.sections.length; i++) {
        s = P.sections[i];
        if (S.read[s.key] || !s.el.getClientRects().length) continue;
        r = s.el.getBoundingClientRect();
        if ((r.top + r.height / 2 < vh / 2 && r.bottom > head) || (bottom && (s === end || r.top + r.height / 2 < vh))) {
          was = score(); S.read[s.key] = 1;
          // over: the page had already added all it can, so the point is kept and the score stays where it was
          note({ type: 'point', why: 'section', name: s.name, score: score(), due: due(), over: score() === was });
          save();
        }
      }
    }
    if (!P.settled) return;
    if (bottom) P.close.reached = true;
    var ready = P.age >= RULES.settle;
    // Markers in page order. One first seen above the screen (when the page has arrived, or later when a stage brings
    // it in) is spent, and its picture catches up by being looked at instead. At the bottom of the page, one on screen
    // counts as reached even short of its line, since the page cannot bring it any higher. One reached in the page's
    // first moments waits for them to pass. One whose picture or block has gone off the top of the screen is spent.
    for (i = 0; i < P.marks.length; i++) {
      m = P.marks[i];
      if (m.spent || m.close || !m.el.getClientRects().length) continue;
      r = m.el.getBoundingClientRect(); w = m.what.getBoundingClientRect();
      if (!m.shown) { m.shown = true; if (w.bottom <= head) { m.early = true; spend(m); continue; } }
      if (w.bottom <= head) { spend(m); continue; }
      if (r.top >= (m.at === 'head' ? head + 2 : vh * m.at) && !(bottom && r.top < vh)) { m.waiting = false; continue; }
      if (ready) take(m);
    }
    // the page's end: the bottom has been reached and the reader has been on the page long enough to have read it
    if (!P.close.spent && P.close.reached && P.age >= RULES.read) take(P.close);
  }
  // a marker used up without firing: its picture, if it has not caught up yet, catches up by being looked at instead
  function spend(m) { m.spent = true; m.waiting = false; if (m.plate && !m.plate.stepped) m.plate.glance = true; }
  // The stage a marker would fire now. The ending's marker fires stage 6 at stage 5 and nothing below it (bible 10.5).
  function stageAt(m) {
    if (m.end) return S.stage === 5 ? 6 : 0;
    return FORCED === null && S.stage < 5 && due() > S.stage ? S.stage + 1 : 0;
  }
  // A marker taken, which happens on every check while it is reached and what it marks is on screen. A picture's
  // marker catches the picture up the first time. If a stage is due, the marker fires it and is spent; if none is, or
  // it is too soon, the marker stays armed (waiting) and is taken again on the next check. The ending's marker waits
  // like this until the reader reaches stage 5.
  // When one marker does both, doing them together would take the picture two stages at once, past a drawing the
  // reader never sees (the herd standing with their heads up). So the picture catches up first and the stage waits
  // RULES.gap seconds, during which no marker on the page fires one. A stage also waits until RULES.space seconds
  // have passed since the last. If the reader leaves the page first, the stage is still due.
  function take(m) {
    var pl = m.plate, now = performance.now(), to;
    if (pl && !pl.stepped && step(pl, 'marker', m)) P.calm = now + RULES.gap * 1000 / FAST;
    to = stageAt(m);
    if (!to || now < P.calm || Date.now() < S.last + RULES.space * 1000 / FAST) { m.waiting = true; return; }
    m.spent = true; m.waiting = false;
    setStage(to, { mark: m, why: m.end ? 'the ending' : m.close ? 'the end of the page' : 'marker' });
  }
  // Four times a second: how long the reader has been on the page, and how long each picture has been on screen. Half
  // of a picture in view counts, or half the screen for one taller than that. Time in a hidden tab does not count.
  function watch() {
    if (!P) return;
    var now = performance.now(), dt = Math.min(1, (now - P.last) / 1000) * FAST, vh = window.innerHeight, head = topBar ? topBar.getBoundingClientRect().bottom : 0, dirty = false;
    P.last = now;
    if (document.hidden || !dt) return;
    P.age += dt;
    P.plates.forEach(function (pl) {
      if (!P.inView.has(pl.el) || !pl.img) return;
      var r = pl.img.getBoundingClientRect(), shown = Math.min(r.bottom, vh) - Math.max(r.top, head);
      if (r.height <= 0 || shown < 0.5 * Math.min(r.height, vh - head)) return;
      pl.look += dt;
      if (P.scores) {
        var had = S.seen[pl.name] || 0;
        S.seen[pl.name] = Math.round((had + dt) * 100) / 100; dirty = true;
        // the point goes to the name the picture scores under on this page, once, whichever picture of a set earns it
        // first
        var key = P.path + '#' + pl.point, was;
        if (had < RULES.dwell && S.seen[pl.name] >= RULES.dwell && !S.looks[key]) { was = score(); S.looks[key] = 1; note({ type: 'point', why: 'picture', name: pl.point, score: score(), due: due(), over: score() === was }); save(); P.saved = now; }
      }
      if (pl.glance && !pl.stepped && pl.look >= RULES.glance && P.age >= RULES.settle) step(pl, 'look');
    });
    if (dirty && now - P.saved > 2000) { save(); P.saved = now; }
    check();
  }

  // ---------- the wear ----------
  // The darkening, the colour drain, the misregistration and the grain were made for one long page, where they followed
  // the scroll position p from 0 at the top to 1 at the bottom. Now the stage stands for a place on that page (its
  // floor), and scrolling down whatever page this is adds a little more on top. The formulas are the ones made then.
  // What scrolling adds is measured against the page's length or two screens, whichever is longer, so that a page
  // that barely scrolls stays at its floor instead of taking the whole span in one flick of the wheel.
  var state = { dark: 0, pal: 0, mis: 0, grain: 0, grit: 0 }, target = { dark: 0, pal: 0, mis: 0, grain: 0, grit: 0 };
  var tint = $('#tint'), cast = $('#cast'), paper = $('#paper'), grit = $('#grit'), topBar = $('.top');
  function wear() {
    var vh = window.innerHeight, along = clamp(window.scrollY / Math.max(vh * 2, doc.scrollHeight - vh), 0, 1);
    var p = STILL ? 0 : clamp(RULES.floor[S.stage] + RULES.span * along, 0, 1), clear = 0;
    // the darkening eases off while the dock fills the screen, so that the last picture stays legible
    if (P && P.ending && P.ending.img) { var r = P.ending.img.getBoundingClientRect(); clear = smooth(0.2, 0.9, (Math.min(r.bottom, vh) - Math.max(r.top, 0)) / vh); }
    target.dark = smooth(0.5, 0.82, p) * (1 - 0.7 * clear);
    target.pal = smooth(0.56, 1.0, p);
    target.mis = smooth(0.2, 1.0, p);
    target.grain = smooth(0.1, 0.8, p) * 0.7;   // fine paper grain: none at first, levelling off at 70% strength
    target.grit = smooth(0.6, 1.0, p) * 0.5;    // coarse specks and dust: only late on, and kept light
  }
  // eased values -> a handful of composited layers
  var last = { dark: -1, pal: -1, mis: -1, grain: -1, grit: -1 };
  function ease() {
    var k = RM.matches ? 1 : 0.08;
    state.dark += (target.dark - state.dark) * k;
    state.pal += (target.pal - state.pal) * k;
    state.mis += (target.mis - state.mis) * k;
    state.grain += (target.grain - state.grain) * k;
    state.grit += (target.grit - state.grit) * k;
    if (Math.abs(state.grain - last.grain) > 0.004) { last.grain = state.grain; paper.style.opacity = state.grain.toFixed(3); paper.style.display = state.grain < 0.01 ? 'none' : 'block'; }
    if (Math.abs(state.grit - last.grit) > 0.004) { last.grit = state.grit; grit.style.opacity = (state.grit * 0.9).toFixed(3); grit.style.display = state.grit < 0.01 ? 'none' : 'block'; }
    if (Math.abs(state.dark - last.dark) > 0.004) { last.dark = state.dark; tint.style.opacity = (state.dark * 0.2).toFixed(3); tint.style.display = state.dark < 0.01 ? 'none' : ''; }
    if (Math.abs(state.pal - last.pal) > 0.006) {
      last.pal = state.pal;
      cast.style.display = (state.pal < 0.01 || LIGHT) ? 'none' : '';
      var f = 'saturate(' + (1 - state.pal * 0.5).toFixed(3) + ') hue-rotate(' + (-state.pal * 14).toFixed(1) + 'deg) contrast(' + (1 + state.pal * 0.1).toFixed(3) + ')';
      cast.style.backdropFilter = f; cast.style.webkitBackdropFilter = f;
    }
    var q = Math.round(state.mis * 24) / 24; // quantised: text repaints only on a step
    if (q !== last.mis && P) {
      last.mis = q;
      var m = (q * 5.5).toFixed(2);
      P.misEls.forEach(function (el) { el.style.setProperty('--mis', m); });
      P.frames.forEach(function (el) { el.style.setProperty('--slip', (q * 15).toFixed(1) + 'px'); });
    }
  }

  // ---------- eyes ----------
  var mouse = { x: window.innerWidth / 2, y: window.innerHeight * 0.3, seen: false };
  window.addEventListener('pointermove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; mouse.seen = true; }, { passive: true });
  function gazeMode(pl) {
    // "a:b" pairs: from the picture's stage a use mode b
    var mode = 'rest', parts = pl.gaze.split(' ');
    for (var i = 0; i < parts.length; i++) { var kv = parts[i].split(':'); if (pl.stage >= +kv[0]) mode = kv[1]; }
    return mode;
  }
  function eyes() {
    P.plates.forEach(function (pl) {
      if (!pl.gaze || !P.inView.has(pl.el)) return;
      var mode = gazeMode(pl);
      pl.eyes.forEach(function (e) {
        var r = +e.getAttribute('data-r') || 2, dx = 0, dy = 0;
        if (mode === 'cursor' && mouse.seen) {     // with no pointer yet (a phone before the first touch), eyes stay at rest
          var b = e.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + b.height / 2;
          var vx = mouse.x - cx, vy = mouse.y - cy, d = Math.sqrt(vx * vx + vy * vy) || 1, k = Math.min(1, d / 160);
          dx = vx / d * r * k; dy = vy / d * r * k;
        } else if (mode === 'up') { dx = 0; dy = -r * 0.85; }
        else if (mode === 'away') { dx = -r * 0.7; dy = -r * 0.5; }
        if (e.__dx === undefined) { e.__dx = 0; e.__dy = 0; }
        e.__dx += (dx - e.__dx) * 0.12; e.__dy += (dy - e.__dy) * 0.12;
        e.style.transform = 'translate(' + e.__dx.toFixed(2) + 'px,' + e.__dy.toFixed(2) + 'px)';
      });
    });
  }

  // ---------- parallax ----------
  function parallax() {
    if (RM.matches) return;
    var vh = window.innerHeight;
    P.plates.forEach(function (pl) {
      if (!pl.img || !P.inView.has(pl.el)) return;
      var r = pl.img.getBoundingClientRect(), c = (r.top + r.height / 2 - vh / 2) / vh; // -1..1 through the viewport
      pl.layers.forEach(function (ly) {
        if (ly.hasAttribute('data-flat')) return;            // a printed sheet (the map) is shown whole: no drift, no zoom
        var depth = +(ly.getAttribute('data-depth') || 0.2);
        var y = pl.layers.length > 1 ? -c * depth * 34 : -c * 16;
        ly.style.transform = 'translate3d(0,' + y.toFixed(2) + 'px,0)' + (pl.layers.length > 1 ? '' : ' scale(1.05)');
      });
    });
  }

  // ---------- scroll-typed text ----------
  function typeTick() {
    P.typed.forEach(function (ty) {
      var need = +(ty.el.getAttribute('data-stage') || 0);
      if (S.stage < need) return;
      if (!ty.full) { ty.full = fill(ty.el.getAttribute('data-text')); ty.el.classList.add('on'); }
      var r = ty.el.getBoundingClientRect(), vh = window.innerHeight;
      var prog = RM.matches ? 1 : clamp((vh * 0.92 - r.top) / (vh * 0.5), 0, 1);
      var n = Math.max(ty.shown, Math.round(prog * ty.full.length));
      if (n !== ty.shown) { ty.shown = n; ty.el.firstChild.textContent = ty.full.slice(0, n); ty.el.classList.toggle('done', n >= ty.full.length); }
    });
  }

  // ---------- the trail register knows when you arrived ----------
  function register() {
    // the reader's mark on the daylight chart: at the hour they first arrived on the site
    var d = new Date(S.first), hr = d.getHours() + d.getMinutes() / 60;
    $$('.you-mark', P.root).forEach(function (g) {
      var ha = +g.getAttribute('data-ha'), hb = +g.getAttribute('data-hb'), ya = +g.getAttribute('data-ya'), yb = +g.getAttribute('data-yb'), h = clamp(hr, ha + 1.3, hb - 1.3);
      g.setAttribute('transform', 'translate(' + g.getAttribute('data-x') + ',' + (ya + (h - ha) / (hb - ha) * (yb - ya)).toFixed(1) + ')');
    });
    var row = $('#you-row', P.root); if (!row) return;
    var mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    $('.r-date', row).textContent = mon[d.getMonth()] + ' ' + d.getDate();
    $('.r-in', row).textContent = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }

  // ---------- phone crops ----------
  function crops() {
    P.plates.forEach(function (pl) {
      var img = pl.img; if (!img) return;
      // a picture's second layout is used on phones, or below a width of its own if it names one
      var max = img.getAttribute('data-vbm-max'), small = max ? window.matchMedia('(max-width:' + max + 'px)').matches : MOBILE.matches;
      var vb = (small && img.getAttribute('data-vbm')) || img.getAttribute('data-vb');
      pl.layers.forEach(function (s) { if (s.getAttribute('viewBox') !== vb) s.setAttribute('viewBox', vb); });
    });
  }

  // ---------- page finish: two small tiles, generated once, faded in with the wear ----------
  // #paper is fine grain. #grit is coarser: dark specks that show on the light sections and pale
  // dust that shows on the dark ones. Both start invisible, so a page at stage 0 is clean.
  (function () {
    function tile(n, px) {
      var c = document.createElement('canvas'); c.width = c.height = n;
      var x = c.getContext('2d'), im = x.createImageData(n, n), d = im.data, s = 99 + n;
      for (var i = 0; i < n * n; i++) { s = (s * 1664525 + 1013904223) >>> 0; px(d, i * 4, s / 4294967296); }
      x.putImageData(im, 0, 0); return 'url(' + c.toDataURL() + ')';
    }
    paper.style.backgroundImage = tile(180, function (d, q, v) { d[q] = 30; d[q + 1] = 24; d[q + 2] = 40; d[q + 3] = v * v * 44; });
    grit.style.backgroundImage = tile(128, function (d, q, v) {
      if (v > 0.87) { d[q] = 22; d[q + 1] = 18; d[q + 2] = 32; d[q + 3] = (v - 0.87) / 0.13 * 150; }
      else if (v < 0.07) { d[q] = 245; d[q + 1] = 241; d[q + 2] = 227; d[q + 3] = (0.07 - v) / 0.07 * 52; }
    });
  })();

  // ---------- links ----------
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a') : null;
    if (!a) return;
    if (a.id === 'final-cta') { lastButton(e, a); if (e.defaultPrevented) return; }
    // a "plan your visit" control that points somewhere on this page takes you there smoothly
    var h = a.getAttribute('href') || '', to = a.hasAttribute('data-go') && h.charAt(0) === '#' && h.length > 1 ? document.getElementById(h.slice(1)) : null;
    if (to) { e.preventDefault(); to.scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth', block: 'start' }); return; }
    follow(e, a);
  });
  // The call to action that does not do what it says. Below stage 5 it is an ordinary link, since on a page of its own
  // it could be the first thing a visitor presses (bible 9.6); from stage 5 it ends the story (10.5).
  function lastButton(e, cta) {
    if (S.stage < 5) return;
    e.preventDefault();
    if (cta.classList.contains('spent')) return;
    setStage(6, { near: cta, why: 'the last button' });
    var label = $('.t', cta) || cta, to = 'Your visit is already in progress.';
    if (P) P.texts = P.texts.filter(function (el) { return el !== label; });   // it keeps saying this from now on
    label.__cur = to;
    if (RM.matches) label.textContent = to; else scramble(label, to);
    cta.classList.add('spent');
    later(function () { window.scrollTo({ top: 0, behavior: RM.matches ? 'auto' : 'smooth' }); }, RM.matches ? 0 : 1700);
  }

  // ---------- moving between pages (bible 10.8) ----------
  // Every page is a whole file that works by itself, and every link is an ordinary link. On top of that, when the site
  // is served from a web address, following a link to another of its pages fetches that page and puts its content in
  // place of this one's: stopPage() lets go of this page, its <main> is replaced by the new page's (with the page's data
  // inside it), and so is the footer where it follows <main>, and startPage() takes the new page up exactly as if it
  // had been loaded: at the saved stage, its pictures a stage behind, nothing changing in its first moments, recorded as
  // opened. Everything else in the document is the visit and stays: the header and its ticker, the sound, the wear,
  // the clock. The header's links are written relative to each page, so they are pointed again from the new page's own
  // copy of the header, current-page mark (aria-current) included; the tab title and the header button follow the new
  // page's data in startPage(). There is no transition beyond the content changing: the slip means a stage.
  // The address bar shows the new page's real address. Back and Forward go through the same swap and put the reader
  // back where they were, and a reload loads whatever address is showing, so the browser's own scroll restoring is
  // switched off and done here, for every entry, since it would otherwise move the page that is leaving. A link that
  // names a place (plan/#fees) lands there. If anything goes wrong (the fetch fails, takes longer than WAIT, or brings
  // back something that is not one of this site's pages, the "not found" page and its 404 included), the link is
  // followed the ordinary way. ?stage=N is for one page load, so under it links are always ordinary.
  var SITE = (document.currentScript && document.currentScript.src) || '', BASE = SITE.replace(/assets\/site\.js(\?[^#]*)?$/, '');
  var SWAP = /^https?:$/.test(location.protocol) && FORCED === null && BASE !== SITE && !!(window.fetch && window.DOMParser && window.URL && history.pushState);
  var WAIT = 5000;   // milliseconds to wait for the next page before following the link the ordinary way
  // ENTRY: the id of the history entry being shown (each entry this document makes carries one, with the reader's place
  // in it, y). Y: the latest place in each entry, kept here as well, since by the time Back is pressed the entry that
  // is being left can no longer be written to. SHOWN: the address of the page on screen, without its #place. going: the
  // fetch on its way, if any. told: a line only a screen reader hears, which says the new page's name.
  var ENTRY = '', Y = {}, yTimer = 0, SHOWN = '', going = null, told = null;
  function fresh() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function pageKey(u) { return u.split('#')[0]; }
  function keep() { clearTimeout(yTimer); Y[ENTRY] = window.scrollY; try { history.replaceState({ echo: ENTRY, y: Y[ENTRY] }, ''); } catch (e) {} }
  if (SWAP) {
    history.scrollRestoration = 'manual';
    var was = history.state;
    if (was && was.echo) {
      ENTRY = was.echo;
      // a reload, or a return to this entry from another site: back to where the reader was once the page has loaded,
      // before its markers are weighed (startPage() waits for the same moment)
      if (typeof was.y === 'number') window.addEventListener('load', function () { window.scrollTo(0, was.y); });
    } else { ENTRY = fresh(); try { history.replaceState({ echo: ENTRY }, ''); } catch (e) {} }
    SHOWN = pageKey(location.href);
    told = document.createElement('div'); told.className = 'vh'; told.setAttribute('aria-live', 'polite'); told.setAttribute('aria-atomic', 'true');
    body.appendChild(told);
  }
  // A click that can be swapped in: the main button with no key held (those open a new tab or window, or save), on a
  // link with no target or download, to a page under the site's own address, and not to a place on the page already
  // shown (the browser does that itself). A link to the page already shown, with no place named, reloads it in place.
  function follow(e, a) {
    if (!SWAP || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (!(a instanceof HTMLAnchorElement) || a.hasAttribute('download') || (a.target && a.target !== '_self')) return;
    var url = a.href;
    if (!url || url.indexOf(BASE) !== 0 || !/(\/|\.html)$/.test(a.pathname) || (a.hash && pageKey(url) === SHOWN)) return;
    e.preventDefault();
    go(url, {});
  }
  // Fetches the page at url and swaps it in. how: { pop: true, y } when Back or Forward has already moved the address,
  // with where the reader was in that entry. A later click, or Back, while one is on its way, replaces it.
  function go(url, how) {
    if (going) going.stop();
    var ctl = window.AbortController ? new AbortController() : null, me = going = {}, timer = 0;
    me.stop = function () { clearTimeout(timer); if (going === me) { going = null; doc.classList.remove('going'); } if (ctl) ctl.abort(); };
    // the ordinary way: load the link; or, when Back or Forward has moved the address already, load that
    var plain = function () { if (going !== me) return; me.stop(); if (how.pop) location.reload(); else location.assign(url); };
    timer = setTimeout(plain, WAIT);
    doc.classList.add('going');
    fetch(url, { credentials: 'same-origin', signal: ctl ? ctl.signal : undefined, headers: { Accept: 'text/html' } }).then(function (r) {
      // only a page: not the "not found" page (sent with a 404), not a redirect off the site, not anything but HTML
      if (r.status !== 200 || !/^text\/html/.test(r.headers.get('content-type') || '') || (r.url && r.url.indexOf(BASE) !== 0)) throw new Error('not a page');
      return r.text().then(function (html) { return read(html, r.url || url); });
    }).then(function (g) {
      if (going !== me) return;
      if (!g) return plain();
      me.stop();
      try { arrive(g, url, how); } catch (e) { if (window.console) console.error(e); if (how.pop) location.reload(); else location.assign(url); }
    }).catch(plain);
  }
  // The fetched document, if it is one of this site's pages: it runs this same script (so it is this build, at this
  // base), its <main> carries the page's data, and its header's links line up with this one's. Otherwise null.
  function read(html, url) {
    try {
      var d = new DOMParser().parseFromString(html, 'text/html'), main = d.getElementById('main'), top = $('header.top', d), js = $('script[src]', d);
      var info = main && $('script[data-page]', main), data = info && JSON.parse(info.textContent), desc = $('meta[name="description"]', d), links = top ? $$('a', top) : [];
      if (!data || typeof data.path !== 'string' || !data.titles || data.titles.length !== 7 || !js || new URL(js.getAttribute('src'), url).href !== SITE) return null;
      if (!links.length || links.length !== $$('a', topBar).length) return null;
      // url: where the page came from, after any redirect, without the #place (fetch drops it; arrive() puts it back)
      return { url: url, main: main, foot: $('body > footer.foot', d), links: links, desc: desc ? desc.getAttribute('content') : null };
    } catch (e) { return null; }
  }
  // The swap. how.pop: the address has moved already (Back or Forward); how.y: where to put the reader.
  function arrive(g, url, how) {
    var old = $('#main'), oldFoot = $('body > footer.foot'), desc = $('meta[name="description"]'), at = null, f;
    var hash = url.indexOf('#') < 0 ? '' : url.slice(url.indexOf('#')), to = pageKey(g.url) + hash;
    stopPage();
    // the reader's place in the page they are leaving is kept with its entry, and the new page gets an entry of its own
    // (a link to the page already shown replaces its entry, as an ordinary link to it would)
    if (!how.pop) { keep(); ENTRY = fresh(); history[to === location.href ? 'replaceState' : 'pushState']({ echo: ENTRY }, '', to); }
    SHOWN = pageKey(location.href);
    // the header stays: its links are pointed again from the new page's depth, and the current-page mark moves
    $$('a', topBar).forEach(function (a, k) {
      var b = g.links[k], c = b.getAttribute('aria-current');
      a.setAttribute('href', b.getAttribute('href'));
      if (c === null) a.removeAttribute('aria-current'); else a.setAttribute('aria-current', c);
    });
    // what leaves stops: words still scrambling in a footer that goes (those in <main> stopPage() has finished), and
    // the grain made or being made for its pictures
    if (oldFoot) $$('.t', oldFoot).forEach(function (el) { if (el.__raf) cancelAnimationFrame(el.__raf); el.__raf = 0; });
    window.Grain.release(old);
    old.parentNode.replaceChild(g.main = document.adoptNode(g.main), old);
    if (oldFoot) oldFoot.parentNode.removeChild(oldFoot);
    if (g.foot) g.main.parentNode.insertBefore(document.adoptNode(g.foot), g.main.nextSibling);
    if (desc && g.desc !== null) desc.setAttribute('content', g.desc);
    // where the reader lands: where they were, coming back; the place the link names; or the top
    try { if (hash.length > 1) at = document.getElementById(decodeURIComponent(hash.slice(1))); } catch (e) {}
    if (typeof how.y === 'number') window.scrollTo(0, how.y); else if (at) at.scrollIntoView(); else window.scrollTo(0, 0);
    Y[ENTRY] = window.scrollY;
    startPage(g.main);
    // for a keyboard or a screen reader: focus goes to the heading of what arrived (the place named, or the page's
    // own heading), and the new page's tab title is said
    f = at ? (/^H[1-3]$/.test(at.tagName) ? at : $('h1,h2,h3', at) || at) : $('h1', g.main) || g.main;
    if (!f.hasAttribute('tabindex')) f.setAttribute('tabindex', '-1');
    f.focus({ preventScroll: true });
    told.textContent = '';
    setTimeout(function () { told.textContent = document.title; }, 80);
  }
  window.addEventListener('popstate', function (e) {
    if (!SWAP) return;
    if (going) going.stop();
    clearTimeout(yTimer);
    var st = e.state && e.state.echo ? e.state : null, y = null;
    if (st) { ENTRY = st.echo; y = Y[ENTRY] !== undefined ? Y[ENTRY] : typeof st.y === 'number' ? st.y : null; }
    // an entry the browser made for a place on this page (a #link): it gets an id, and its place as the reader scrolls
    else { ENTRY = fresh(); try { history.replaceState({ echo: ENTRY }, ''); } catch (err) {} }
    if (pageKey(location.href) === SHOWN) { if (y !== null) window.scrollTo(0, y); return; }
    go(location.href, { pop: true, y: y });
  });

  // ---------- the visit ----------
  window.addEventListener('scroll', function () {
    wear(); check();
    // the reader's place in this entry: noted at once, and written into the entry once the scrolling stops
    if (SWAP) { Y[ENTRY] = window.scrollY; clearTimeout(yTimer); yTimer = setTimeout(keep, 400); }
  }, { passive: true });
  window.addEventListener('resize', function () { if (P) crops(); wear(); check(); });
  // a stage that is waiting for its marker's time stays due while the tab is hidden: the page's clock stops with it
  window.addEventListener('pagehide', function () { save(); if (SWAP) keep(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) save(); });
  function loop() { ease(); if (P) { eyes(); parallax(); typeTick(); } requestAnimationFrame(loop); }
  startPage($('#main'));
  // arriving shows the wear at once; only changes after that are eased
  wear(); for (var k in state) state[k] = target[k];
  loop();
  if (window.__sound) window.__sound.stage(S.stage);

  // For looking at from the console, and for walk.mjs.
  window.__echo = {
    rules: RULES, state: S, log: LOG,
    get stage() { return S.stage; },
    get score() { return score(); },
    get due() { return due(); },
    status: function () {
      var d = due();
      return {
        stage: S.stage, score: score(), due: d, next: d < RULES.due.length ? RULES.due[d] : null, fast: FAST, swap: SWAP,
        mode: FORCED !== null ? 'forced' : NOSAVE ? 'nosave' : 'saved', first: S.first, read: Object.keys(S.read), seen: S.seen, looks: Object.keys(S.looks), pages: S.pages,
        page: P && {
          path: P.path, settled: P.settled, scores: P.scores, age: Math.round(P.age * 10) / 10,
          // a stage is due and a marker the reader has reached is waiting for its time
          coming: d > S.stage && P.marks.some(function (m) { return m.waiting && !m.spent; }),
          pictures: P.plates.map(function (pl) { return { name: pl.name, point: pl.point, stage: pl.stage, stepped: pl.stepped, glance: pl.glance, look: Math.round(pl.look * 10) / 10, mark: pl.mark ? pl.mark.i : null }; }),
          marks: P.marks.map(function (m) { return { i: m.i, name: m.name, at: m.at, end: m.end, close: !!m.close, spent: m.spent, early: m.early, waiting: m.waiting }; }),
          sections: P.sections.map(function (s) { return { name: s.name, read: !!S.read[s.key] }; })
        }
      };
    },
    since: function (n) { return LOG.filter(function (e) { return e.n > n; }); },
    setStage: function (n) { setStage(n, { why: 'console' }); },
    start: startPage, stop: stopPage
  };
})();
