/* Listen: reads a blog post aloud with the device's own voice (Web Speech API).
   No account, no cost, no audio files. Hidden on browsers without speech support.
   Reads one short chunk at a time (Chrome stops long utterances), highlights the
   paragraph being read, and keeps its place on pause. */
(function () {
  var box = document.querySelector('[data-listen]');
  var body = document.querySelector('.wx-body');
  var synth = window.speechSynthesis;
  if (!box || !body || !synth || typeof SpeechSynthesisUtterance === 'undefined') return;

  // what to read: the headline, the dek, then the article body in order
  var els = [];
  var h1 = document.querySelector('article h1'); if (h1) els.push(h1);
  var dek = document.querySelector('.wx-dek'); if (dek) els.push(dek);
  [].forEach.call(body.querySelectorAll('h2,h3,h4,p,li,blockquote'), function (el) {
    if (el.closest('figure,pre,code,.wx-sub,[aria-hidden="true"]')) return;
    if (el.tagName === 'P' && el.closest('li,blockquote')) return;
    if ((el.textContent || '').trim().length < 2) return;
    els.push(el);
  });

  // split each element into chunks of whole sentences, about 220 characters at most
  var chunks = [];
  els.forEach(function (el) {
    var t = el.textContent.replace(/\s+/g, ' ').trim();
    var parts = t.match(/[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g) || [t];
    var cur = '';
    parts.forEach(function (s) {
      if ((cur + s).length > 220 && cur) { chunks.push({ el: el, text: cur.trim() }); cur = ''; }
      cur += s;
    });
    if (cur.trim()) chunks.push({ el: el, text: cur.trim() });
  });
  if (!chunks.length) return;

  var words = chunks.reduce(function (n, c) { return n + c.text.split(' ').length; }, 0);
  var RATES = [1, 1.25, 1.5, 0.85];
  var ri = 0, idx = 0, playing = false, voice = null, gen = 0;

  var PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>';
  var PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4h4.5v16H6zM13.5 4H18v16h-4.5z"/></svg>';
  box.innerHTML =
    '<button class="ls-play" type="button" aria-label="Listen to this article">' + PLAY + '</button>' +
    '<div class="ls-meta"><p class="ls-t">Listen to this article</p><p class="ls-s"></p></div>' +
    '<div class="ls-ctl"><button type="button" class="ls-rate" aria-label="Reading speed">1&times;</button>' +
    '<button type="button" class="ls-stop" hidden>Restart</button></div>' +
    '<div class="ls-bar" aria-hidden="true"><i></i></div>';
  var btn = box.querySelector('.ls-play'), sub = box.querySelector('.ls-s'),
      rateBtn = box.querySelector('.ls-rate'), stopBtn = box.querySelector('.ls-stop'), bar = box.querySelector('.ls-bar i');

  function mins() { return Math.max(1, Math.round(words / (165 * RATES[ri]))); }
  function status() {
    if (playing) sub.textContent = 'Reading · ' + Math.round(100 * idx / chunks.length) + '%';
    else sub.textContent = (idx ? 'Paused · ' : '') + 'About ' + mins() + ' min · your device’s voice';
    bar.style.width = (100 * idx / chunks.length) + '%';
  }
  function pickVoice() {
    var vs = synth.getVoices().filter(function (v) { return /^en(-|_|$)/i.test(v.lang); });
    if (!vs.length) return null;
    var pref = [/natural/i, /premium/i, /enhanced/i, /google us english/i, /samantha/i, /ava/i, /allison/i, /daniel/i, /aria/i, /jenny/i, /guy/i];
    for (var i = 0; i < pref.length; i++) {
      for (var j = 0; j < vs.length; j++) if (pref[i].test(vs[j].name) && /en-US|en_US/i.test(vs[j].lang)) return vs[j];
      for (var k = 0; k < vs.length; k++) if (pref[i].test(vs[k].name)) return vs[k];
    }
    var us = vs.filter(function (v) { return /US/i.test(v.lang); });
    return (us[0] || vs[0]);
  }
  function mark(el) {
    [].forEach.call(document.querySelectorAll('.ls-on'), function (x) { x.classList.remove('ls-on'); });
    if (el) el.classList.add('ls-on');
  }
  function speak() {
    if (idx >= chunks.length) { stop(true); return; }
    var my = ++gen, c = chunks[idx], u = new SpeechSynthesisUtterance(c.text);
    if (!voice) voice = pickVoice();
    if (voice) u.voice = voice;
    u.lang = (voice && voice.lang) || 'en-US';
    u.rate = RATES[ri];
    u.onend = function () { if (my !== gen || !playing) return; idx++; status(); speak(); };
    u.onerror = function (e) { if (my !== gen || (e && (e.error === 'interrupted' || e.error === 'canceled'))) return; playing = false; ui(); };
    mark(c.el);
    // follow along inside the article only, and only once the reading moves below the screen;
    // never jump back up to the headline when someone taps play
    if (body.contains(c.el)) {
      var r = c.el.getBoundingClientRect();
      if (r.bottom > innerHeight - 40) c.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    synth.speak(u);
  }
  function ui() {
    btn.innerHTML = playing ? PAUSE : PLAY;
    btn.setAttribute('aria-label', playing ? 'Pause' : (idx ? 'Resume' : 'Listen to this article'));
    stopBtn.hidden = !idx && !playing;
    status();
  }
  function play() { gen++; playing = true; synth.cancel(); ui(); setTimeout(speak, 60); }
  function pause() { gen++; playing = false; synth.cancel(); ui(); }
  function stop(done) { gen++; playing = false; synth.cancel(); idx = 0; mark(null); ui(); if (done) sub.textContent = 'Finished · tap play to hear it again'; }

  btn.addEventListener('click', function () { playing ? pause() : play(); });
  stopBtn.addEventListener('click', function () { stop(false); });
  rateBtn.addEventListener('click', function () {
    ri = (ri + 1) % RATES.length;
    rateBtn.innerHTML = (RATES[ri] + '').replace(/^0/, '') + '&times;';
    if (playing) { gen++; synth.cancel(); setTimeout(speak, 60); } else status();
  });
  if (synth.onvoiceschanged !== undefined) synth.onvoiceschanged = function () { voice = pickVoice(); };
  addEventListener('pagehide', function () { synth.cancel(); });
  box.hidden = false;
  ui();
})();
