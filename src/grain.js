// Grain engine. Fills every <image class="gr" data-g='…'> with a stippled canvas.
// data-g: {t:'l'|'r', p:[…], s:[[offset,alpha]…], c:'#rrggbb', n:seed}
// One shared, equalised noise tile is thresholded against the density gradient, which gives
// the same look as a turbulence filter at a fraction of the cost, and only once per image.
(function () {
  var N = 256, noise = null, pending = 0, queue = [], busy = false;
  function makeNoise() {
    var n = N * N, a = new Float32Array(n), b = new Float32Array(n), i, x, y, s = 1234567;
    function rand() { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }
    for (i = 0; i < n; i++) a[i] = rand();
    for (var pass = 0; pass < 1; pass++) {
      for (y = 0; y < N; y++) for (x = 0; x < N; x++) { i = y * N + x; b[i] = (a[y * N + ((x + N - 1) & 255)] + 2 * a[i] + a[y * N + ((x + 1) & 255)]) / 4; }
      for (y = 0; y < N; y++) for (x = 0; x < N; x++) { i = y * N + x; a[i] = (b[((y + N - 1) & 255) * N + x] + 2 * b[i] + b[((y + 1) & 255) * N + x]) / 4; }
    }
    var idx = new Uint32Array(n); for (i = 0; i < n; i++) idx[i] = i;
    idx.sort(function (p, q) { return a[p] - a[q]; });
    var out = new Float32Array(n); for (i = 0; i < n; i++) out[idx[i]] = (i + 0.5) / n;
    return out;
  }
  function scaleFor(el) {
    var m = el.getScreenCTM && el.getScreenCTM();
    var k = m ? Math.sqrt(m.a * m.a + m.b * m.b) : 1;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    return Math.max(0.3, Math.min(1.6, k * dpr * 1.35));
  }
  function fill(el, done) {
    var g; try { g = JSON.parse(el.getAttribute('data-g')); } catch (e) { return done(); }
    var x = +el.getAttribute('x'), y = +el.getAttribute('y'), w = +el.getAttribute('width'), h = +el.getAttribute('height');
    var k = scaleFor(el), cap = 1.1e6; if (w * h * k * k > cap) k = Math.sqrt(cap / (w * h));
    var cw = Math.max(2, Math.round(w * k)), ch = Math.max(2, Math.round(h * k));
    var cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    var ctx = cv.getContext('2d'), im = ctx.createImageData(cw, ch), d = im.data;
    var R = parseInt(g.c.slice(1, 3), 16), G = parseInt(g.c.slice(3, 5), 16), B = parseInt(g.c.slice(5, 7), 16);
    var lut = new Float32Array(258), st = g.s, i, j;
    for (i = 0; i <= 257; i++) { var t = i / 256, a = st[st.length - 1][1]; if (t <= st[0][0]) a = st[0][1]; else for (j = 1; j < st.length; j++) if (t <= st[j][0]) { var u = (t - st[j - 1][0]) / ((st[j][0] - st[j - 1][0]) || 1); a = st[j - 1][1] + (st[j][1] - st[j - 1][1]) * u; break; } lut[i] = a; }
    var ox = (g.n * 73) & 255, oy = (g.n * 151) & 255, px, py, ux, uy, tt, al, v, q;
    var lin = g.t === 'l', p = g.p, dx = lin ? p[2] - p[0] : 0, dy = lin ? p[3] - p[1] : 0, L2 = (dx * dx + dy * dy) || 1;
    for (py = 0; py < ch; py++) {
      uy = y + (py + 0.5) / k;
      for (px = 0; px < cw; px++) {
        ux = x + (px + 0.5) / k;
        tt = lin ? ((ux - p[0]) * dx + (uy - p[1]) * dy) / L2 : Math.sqrt((ux - p[0]) * (ux - p[0]) + (uy - p[1]) * (uy - p[1])) / p[2];
        tt = tt < 0 ? 0 : tt > 1 ? 1 : tt;
        al = lut[(tt * 256) | 0]; if (al < 0.004) continue;
        v = (al - noise[((px + ox) & 255) + (((py + oy) & 255) << 8)]) * 5; if (v <= 0) continue;
        q = (py * cw + px) << 2; d[q] = R; d[q + 1] = G; d[q + 2] = B; d[q + 3] = v >= 1 ? 255 : v * 255;
      }
    }
    ctx.putImageData(im, 0, 0);
    cv.toBlob(function (bl) { if (bl) el.setAttribute('href', URL.createObjectURL(bl)); done(); });
  }
  function pump() {
    if (busy) return; var el = queue.shift(); if (!el) return;
    busy = true;
    if (!noise) noise = makeNoise();
    fill(el, function () { pending--; busy = false; (window.requestIdleCallback || setTimeout)(pump, { timeout: 60 }); });
  }
  window.Grain = {
    // Queue every unfilled grain image under root.
    fillAll: function (root) {
      var els = (root || document).querySelectorAll('image.gr:not([data-q])');
      for (var i = 0; i < els.length; i++) { els[i].setAttribute('data-q', '1'); queue.push(els[i]); pending++; }
      pump();
    },
    pending: function () { return pending; }
  };
})();
