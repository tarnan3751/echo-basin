// Optional ambient sound, synthesised with Web Audio. Off until the visitor presses the toggle.
// Wind and water early on. From stage 2 a two-note call with its echoes: four, the way the brochure
// promises. From stage 4 there is a fifth, late and a little low, from the other side.
// From stage 5 the fifth comes first. At stage 6 the wind stops.
(function () {
  var btn = document.getElementById('snd'), ctx = null, on = false, stage = 0, master, wind, windGain, drone, droneGain, timer = 0;
  function noiseBuffer() {
    var len = ctx.sampleRate * 3, b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0), last = 0;
    for (var i = 0; i < len; i++) { var w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2; }
    return b;
  }
  function build() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    wind = ctx.createBufferSource(); wind.buffer = noiseBuffer(); wind.loop = true;
    var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 420; bp.Q.value = 0.5;
    windGain = ctx.createGain(); windGain.gain.value = 0.5;
    var lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 0.22; lfo.connect(lg); lg.connect(windGain.gain);
    wind.connect(bp); bp.connect(windGain); windGain.connect(master); wind.start(); lfo.start();
    drone = ctx.createOscillator(); drone.type = 'sine'; drone.frequency.value = 46;
    var d2 = ctx.createOscillator(); d2.type = 'sine'; d2.frequency.value = 69.4;
    droneGain = ctx.createGain(); droneGain.gain.value = 0;
    drone.connect(droneGain); d2.connect(droneGain); droneGain.connect(master); drone.start(); d2.start();
  }
  function note(t, f0, f1, dur, gain, pan) {
    var o = ctx.createOscillator(), g = ctx.createGain(), p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    o.type = 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); if (p) { p.pan.value = pan; g.connect(p); p.connect(master); } else g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function call(t, gain, pan, shift) { note(t, 560 * shift, 540 * shift, 0.32, gain, pan); note(t + 0.34, 430 * shift, 400 * shift, 0.5, gain, pan); }
  function phrase() {
    if (!on || stage < 2) return;
    var t = ctx.currentTime + 0.2, i;
    if (stage >= 5) call(t, 0.05, 0.75, 0.92);              // the answer, before anyone has called
    var t1 = t + (stage >= 5 ? 1.5 : 0);
    if (stage < 6) { call(t1, 0.07, -0.5, 1); for (i = 1; i <= 4; i++) call(t1 + i * 1.15, 0.07 * Math.pow(0.5, i), -0.5 + i * 0.12, 1); }
    if (stage === 4) call(t1 + 7.4, 0.045, 0.7, 0.94);       // a fifth
    if (stage >= 6) call(t + 0.4, 0.085, 0, 0.9);            // close, and not from the mountains
  }
  function apply() {
    if (!ctx) return;
    var t = ctx.currentTime;
    master.gain.linearRampToValueAtTime(on ? 0.9 : 0, t + 0.6);
    windGain.gain.linearRampToValueAtTime(stage >= 6 ? 0 : stage >= 4 ? 0.26 : 0.5, t + 2.5);
    droneGain.gain.linearRampToValueAtTime(stage >= 6 ? 0.2 : stage >= 3 ? 0.03 + stage * 0.022 : 0, t + 3);
  }
  function schedule() { clearTimeout(timer); if (!on) return; timer = setTimeout(function () { phrase(); schedule(); }, (stage >= 5 ? 11000 : 17000) + Math.random() * 9000); }
  if (btn) btn.addEventListener('click', function () {
    // a host page may refuse audio; if it does, the toggle just stays off
    try { if (!ctx) build(); } catch (e) { ctx = null; btn.textContent = 'Sound unavailable'; btn.disabled = true; return; }
    on = !on; if (on && ctx.state === 'suspended') { var r = ctx.resume(); if (r && r.catch) r.catch(function () {}); }
    btn.setAttribute('aria-pressed', on ? 'true' : 'false'); btn.textContent = on ? 'Sound on' : 'Sound off';
    apply(); schedule(); if (on) setTimeout(phrase, 2500);
  });
  // The sound belongs to the visit: pages swapped in place (bible 10.8) leave it playing. context() and on() are for
  // walk.mjs, which checks that it does.
  window.__sound = { stage: function (n) { stage = n; apply(); if (on && n >= 4) setTimeout(phrase, 1200); }, context: function () { return ctx; }, on: function () { return on; } };
})();
