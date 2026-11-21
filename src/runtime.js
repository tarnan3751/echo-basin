// Echo Basin decay engine.
// 1. Scroll progress p (0..1) drives three eased values: dark, pal, mis. They follow p both ways.
// 2. Six irreversible stages at fixed thresholds. Stages only go up. Each stage swaps copy
//    (data-s1..data-s6), page title, and staged groups inside the illustrations (data-from / data-until).
// 3. On-screen copy scrambles letter by letter into its new version; off-screen copy swaps silently.
(function () {
  'use strict';
  var TH = window.__TH || [0.12, 0.28, 0.46, 0.60, 0.74, 0.88];
  var TITLES = window.__TITLES;
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)');
  var MOBILE = window.matchMedia('(max-width: 700px)');
  // small or touch-first devices skip the full-screen backdrop filter; everything else still decays
  var LIGHT = window.matchMedia('(max-width: 900px), (pointer: coarse)').matches || /[?&]light=1/.test(location.search);
  var doc = document.documentElement, body = document.body;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var smooth = function (a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  var t0 = Date.now();

  var state = { p: 0, stage: 0, dark: 0, pal: 0, mis: 0, grain: 0, grit: 0 };
  var target = { dark: 0, pal: 0, mis: 0, grain: 0, grit: 0 };
  var tint = $('#tint'), cast = $('#cast'), flash = $('#flash'), main = $('#main'), paper = $('#paper'), grit = $('#grit');
  var texts = $$('.t'), staged = $$('[data-from],[data-until]'), misEls = $$('.mis'), frames = $$('.plate__frame');
  var redact = $$('.rd');
  // A marker is 'n@f': stage n fires when the marker's top edge rises past fraction f of the screen height. Or 'n@head':
  // it fires when the marker goes under the page header, which is as late as something can be and still be in view.
  var marks = $$('[data-stage-at]').map(function (el) { var v = el.getAttribute('data-stage-at').split('@'); return { el: el, n: +v[0], at: v[1] === 'head' ? 'head' : +(v[1] || 0.6) }; });
  var topBar = $('.top');
  var inView = new Set();

  // ---------- copy ----------
  function versionFor(el, stage) {
    for (var s = stage; s >= 1; s--) { var v = el.getAttribute('data-s' + s); if (v !== null) return v; }
    return el.__base;
  }
  texts.forEach(function (el) { el.__base = el.textContent; });
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
  function visible(el) {
    var r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight && r.width > 0;
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
    setTimeout(function () { blk.style.transition = ''; blk.style.minHeight = ''; }, 760);
  }
  function applyCopy(stage, animate) {
    var changes = [], vh = window.innerHeight;
    texts.forEach(function (el) {
      var to = versionFor(el, stage);
      if (to === (el.__cur === undefined ? el.__base : el.__cur)) return;
      var blk = blockOf(el), r = (blk || el).getBoundingClientRect();
      changes.push({ el: el, to: to, blk: blk, h: r.height, where: r.bottom <= 0 ? 'above' : r.top >= vh ? 'below' : 'in' });
    });
    changes.forEach(function (c) {
      c.el.__cur = c.to;
      if (animate && !RM.matches && c.where === 'in' && c.el.getClientRects().length) {
        if (c.blk) c.blk.style.minHeight = c.h.toFixed(1) + 'px';
        scramble(c.el, c.to, c.blk ? function () { settle(c.blk, c.h); } : null);
      } else c.el.textContent = c.to;
    });
  }
  var titleTimer = 0;
  function setTitle(to) {
    if (RM.matches) { document.title = to; return; }
    var from = document.title, n = 0, total = 22;
    clearInterval(titleTimer);
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

  // ---------- stages ----------
  function applyStaged(stage) {
    staged.forEach(function (el) {
      var a = +(el.getAttribute('data-from') || 0), b = el.hasAttribute('data-until') ? +el.getAttribute('data-until') : 9;
      el.style.display = (stage >= a && stage <= b) ? '' : 'none';
    });
    redact.forEach(function (el) { el.classList.toggle('lift', stage >= +el.getAttribute('data-lift')); });
    body.setAttribute('data-stage', stage);
  }
  function slip() {
    // the "plate slip": a registration jump that covers the moment things change
    if (RM.matches) return;
    main.classList.remove('slip'); void main.offsetWidth; main.classList.add('slip');
    flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go');
  }
  // Something on screen to hold still while a stage changes: the marker that set the stage off if it is in view,
  // otherwise whatever is in the middle of the screen.
  function holdFor(n) {
    var vh = window.innerHeight, i, r;
    for (i = 0; i < marks.length; i++) if (marks[i].n === n) { r = marks[i].el.getBoundingClientRect(); if (r.top > -vh * 0.25 && r.top < vh) return marks[i].el; }
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
  function setStage(n, animate) {
    if (n <= state.stage) return;
    // Changing the words changes how tall the page is, above the screen as well as on it, and what the reader is
    // looking at must not jump when that happens. So one thing on screen is noted beforehand, and afterwards the
    // page is scrolled by however far that thing was pushed. (The browser's own scroll anchoring is switched off in
    // the stylesheet; not every browser has it, and this way all of them behave alike.)
    var hold = animate ? holdFor(n) : null, y0 = hold ? hold.getBoundingClientRect().top : 0;
    state.stage = n;
    applyCopy(n, animate);
    applyStaged(n);
    if (hold) { var moved = hold.getBoundingClientRect().top - y0; if (Math.abs(moved) > 0.5) window.scrollBy(0, moved); }
    if (TITLES && TITLES[n]) setTitle(TITLES[n]);
    favicon(n);
    if (animate) slip();
    if (window.__sound) window.__sound.stage(n);
    register(n);
  }

  // ---------- scroll ----------
  function measure() {
    var max = Math.max(1, doc.scrollHeight - window.innerHeight);
    state.p = clamp(window.scrollY / max, 0, 1);
    var p = state.p;
    target.dark = smooth(0.5, 0.82, p) * (1 - 0.7 * smooth(0.9, 1, p)); // eases off for the last screen so the dock stays legible
    target.pal = smooth(0.56, 1.0, p);
    target.mis = smooth(0.2, 1.0, p);
    target.grain = smooth(0.1, 0.8, p) * 0.7;   // fine paper grain: none at the top, levelling off at 70% strength
    target.grit = smooth(0.6, 1.0, p) * 0.5;    // coarse specks and dust: only in the last stretch, and kept light
    // Stages fire at fixed places in the document: marker n crossing its line in the viewport.
    // (Markers keep the stages aligned with the same content on every screen size.)
    var n = 0, vh = window.innerHeight, i, head = topBar ? topBar.getBoundingClientRect().bottom : 0;
    if (marks.length) { for (i = 0; i < marks.length; i++) if (marks[i].el.getBoundingClientRect().top < (marks[i].at === 'head' ? head + 2 : vh * marks[i].at)) n = Math.max(n, marks[i].n); }
    else for (i = 0; i < TH.length; i++) if (p >= TH[i]) n = i + 1;
    if (n > state.stage) setStage(n, true);
  }

  // ---------- eased values -> a handful of composited layers ----------
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
    if (q !== last.mis) {
      last.mis = q;
      var m = (q * 5.5).toFixed(2);
      misEls.forEach(function (el) { el.style.setProperty('--mis', m); });
      frames.forEach(function (el) { el.style.setProperty('--slip', (q * 15).toFixed(1) + 'px'); });
    }
  }

  // ---------- eyes ----------
  var mouse = { x: window.innerWidth / 2, y: window.innerHeight * 0.3, seen: false };
  window.addEventListener('pointermove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; mouse.seen = true; }, { passive: true });
  var eyeScenes = $$('.plate[data-eyes]').map(function (pl) { return { el: pl, eyes: $$('.eye', pl), mode: pl.getAttribute('data-eyes') }; });
  function gazeMode(sc) {
    // "a>b" pairs: from stage a use mode b
    var mode = 'rest', parts = sc.mode.split(' ');
    for (var i = 0; i < parts.length; i++) { var kv = parts[i].split(':'); if (state.stage >= +kv[0]) mode = kv[1]; }
    return mode;
  }
  function eyes() {
    eyeScenes.forEach(function (sc) {
      if (!inView.has(sc.el)) return;
      var mode = gazeMode(sc);
      sc.eyes.forEach(function (e) {
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
  var par = $$('.plate__img').map(function (img) { return { img: img, layers: $$('.ly', img) }; });
  function parallax() {
    if (RM.matches) return;
    var vh = window.innerHeight;
    par.forEach(function (pp) {
      if (!inView.has(pp.img.closest('.plate'))) return;
      var r = pp.img.getBoundingClientRect(), c = (r.top + r.height / 2 - vh / 2) / vh; // -1..1 through the viewport
      pp.layers.forEach(function (ly, i) {
        if (ly.hasAttribute('data-flat')) return;            // a printed sheet (the map) is shown whole: no drift, no zoom
        var depth = +(ly.getAttribute('data-depth') || 0.2);
        var y = pp.layers.length > 1 ? -c * depth * 34 : -c * 16;
        ly.style.transform = 'translate3d(0,' + y.toFixed(2) + 'px,0)' + (pp.layers.length > 1 ? '' : ' scale(1.05)');
      });
    });
  }

  // ---------- scroll-typed text ----------
  var typed = $$('.typed').map(function (el) { return { el: el, full: '', shown: 0 }; });
  function typeTick() {
    typed.forEach(function (ty) {
      var need = +(ty.el.getAttribute('data-stage') || 0);
      if (state.stage < need) return;
      if (!ty.full) { var mins = Math.max(1, Math.round((Date.now() - t0) / 60000)); ty.full = ty.el.getAttribute('data-text').replace('{m}', mins === 1 ? 'a minute' : mins + ' minutes'); ty.el.classList.add('on'); }
      var r = ty.el.getBoundingClientRect(), vh = window.innerHeight;
      var prog = RM.matches ? 1 : clamp((vh * 0.92 - r.top) / (vh * 0.5), 0, 1);
      var n = Math.max(ty.shown, Math.round(prog * ty.full.length));
      if (n !== ty.shown) { ty.shown = n; ty.el.firstChild.textContent = ty.full.slice(0, n); ty.el.classList.toggle('done', n >= ty.full.length); }
    });
  }

  // ---------- the trail register knows when you arrived ----------
  function register(stage) {
    // the reader's mark on the daylight chart: at the hour they opened the page
    var d0 = new Date(t0), hr = d0.getHours() + d0.getMinutes() / 60;
    $$('.you-mark').forEach(function (g) {
      var ha = +g.getAttribute('data-ha'), hb = +g.getAttribute('data-hb'), ya = +g.getAttribute('data-ya'), yb = +g.getAttribute('data-yb'), h = clamp(hr, ha + 1.3, hb - 1.3);
      g.setAttribute('transform', 'translate(' + g.getAttribute('data-x') + ',' + (ya + (h - ha) / (hb - ha) * (yb - ya)).toFixed(1) + ')');
    });
    var row = $('#you-row'); if (!row) return;
    var d = new Date(t0), mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var hh = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    $('.r-date', row).textContent = mon[d.getMonth()] + ' ' + d.getDate();
    $('.r-in', row).textContent = hh;
  }

  // ---------- observers ----------
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) { inView.add(e.target); e.target.classList.add('in'); } else inView.delete(e.target);
    });
  }, { rootMargin: '10% 0px 10% 0px' });
  var gio = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { window.Grain.fillAll(e.target); gio.unobserve(e.target); } });
  }, { rootMargin: '140% 0px 140% 0px' });
  $$('.plate').forEach(function (p) { io.observe(p); gio.observe(p); });

  // ---------- phone crops ----------
  function crops() {
    $$('.plate__img').forEach(function (img) {
      // a picture's second layout is used on phones, or below a width of its own if it names one
      var max = img.getAttribute('data-vbm-max'), small = max ? window.matchMedia('(max-width:' + max + 'px)').matches : MOBILE.matches;
      var vb = (small && img.getAttribute('data-vbm')) || img.getAttribute('data-vb');
      $$('.ly', img).forEach(function (s) { if (s.getAttribute('viewBox') !== vb) s.setAttribute('viewBox', vb); });
    });
  }

  // ---------- page finish: two small tiles, generated once, faded in by scroll ----------
  // #paper is fine grain. #grit is coarser: dark specks that show on the light sections and pale
  // dust that shows on the dark ones. Both start invisible, so the top of the page is clean.
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

  // ---------- the call to action that does not do what it says ----------
  var cta = $('#final-cta');
  if (cta) cta.addEventListener('click', function (e) {
    e.preventDefault();
    setStage(6, true);
    var label = $('.t', cta) || cta;
    label.__cur = 'Your visit is already in progress.';
    if (RM.matches) label.textContent = label.__cur; else scramble(label, label.__cur);
    cta.classList.add('spent');
    setTimeout(function () { window.scrollTo({ top: 0, behavior: RM.matches ? 'auto' : 'smooth' }); }, RM.matches ? 0 : 1700);
  });
  // every other "plan your visit" control simply takes you further in
  $$('[data-go]').forEach(function (a) { a.addEventListener('click', function (e) { var tEl = $(a.getAttribute('data-go')); if (tEl) { e.preventDefault(); tEl.scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth', block: 'start' }); } }); });

  // ---------- loop ----------
  var ticking = false;
  window.addEventListener('scroll', function () { measure(); }, { passive: true });
  window.addEventListener('resize', function () { crops(); measure(); });
  function loop() { ease(); eyes(); parallax(); typeTick(); requestAnimationFrame(loop); }
  crops(); applyStaged(0); measure(); loop();
  // debugging hook used by the screenshot script: ?stage=N forces a stage without scrolling
  var forced = /[?&]stage=(\d)/.exec(location.search); if (forced) setStage(+forced[1], false);
  window.__echo = { state: state, setStage: setStage };
})();
