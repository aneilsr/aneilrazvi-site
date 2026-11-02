/* Page menu that follows you (v3, Nov 2026).
   Scrolling down past the page menu (.p-jump, the home hero's .jump, or a course page's ul.jump) docks a copy of it at the top. Scrolling up brings the
   site menus back. Rule: at most two bars on a computer, one bar while reading on a phone.
   - Computer, no section menu: main nav + page menu (both directions).
   - Computer, with section menu (nav.subnav): down = main nav + page menu (section menu tucks away);
     up = main nav + section menu (page menu tucks away).
   - Phone: down = page menu alone at the top; up = main nav + page menu, or main nav + section menu.
   Also: current section underlined, a reading-progress line, and taps land below whatever bars show. */
(function () {
  // the page's own section menu: v3 pages (.p-jump), the home hero (.h-hero .jump), the course pages (ul.jump)
  var jump = document.querySelector('.p-jump') || document.querySelector('.h-hero .jump') || document.querySelector('ul.jump');
  if (!jump) return;
  var nav = document.querySelector('nav.site-nav');
  var sub = document.querySelector('nav.subnav');
  var root = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // the docked copy
  var dock = document.createElement('nav');
  dock.className = 'pj-dock';
  dock.setAttribute('aria-label', 'On this page');
  // rebuild the links in one format: <a href="#id"><span>01</span>Label</a>
  var src = [].slice.call(jump.querySelectorAll('a[href^="#"]'));
  dock.innerHTML = '<div class="in">' + src.map(function (a, i) {
    var c = a.cloneNode(true); [].forEach.call(c.querySelectorAll('span'), function (x) { x.remove(); });
    var n = i + 1;
    return '<a href="' + a.getAttribute('href') + '"><span>' + (n < 10 ? '0' + n : n) + '</span>' + c.textContent.trim() + '</a>';
  }).join('') + '</div><i class="pj-prog" aria-hidden="true"></i>';
  dock.setAttribute('aria-hidden', 'true');
  document.body.appendChild(dock);
  root.classList.add('pj');
  if (sub) root.classList.add('pj-sub');

  var links = [].slice.call(dock.querySelectorAll('a[href^="#"]'));
  var targets = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
  var prog = dock.querySelector('.pj-prog');
  var inner = dock.querySelector('.in');

  var lastY = window.scrollY, dir = 'down', ticking = false;
  function phone() { return window.innerWidth <= 900; }
  function navH() { return nav ? nav.offsetHeight : 68; }
  function subH() { return sub ? sub.offsetHeight : 0; }
  function dockH() { return dock.offsetHeight || 46; }
  function menuOpen() { return nav && nav.classList.contains('open'); }

  function align() {
    var first = src[0]; if (!first) return;
    var x = Math.max(16, Math.round(first.getBoundingClientRect().left));
    inner.style.maxWidth = 'none'; inner.style.margin = '0'; inner.style.paddingLeft = x + 'px'; inner.style.paddingRight = x + 'px';
  }
  function state() {
    var y = window.scrollY, d = y - lastY;
    if (Math.abs(d) > 6) { dir = d > 0 ? 'down' : 'up'; lastY = y; }
    var pinned = navH() + subH();
    var past = jump.getBoundingClientRect().bottom < pinned + 2;
    var mode = 'top';
    if (past && !menuOpen()) mode = dir === 'down' ? 'down' : 'up';
    root.classList.toggle('pj-down', mode === 'down');
    root.classList.toggle('pj-up', mode === 'up');
    root.classList.toggle('pj-phone', phone());
    var show = mode === 'down' || (mode === 'up' && !sub);
    dock.classList.toggle('on', show);
    dock.setAttribute('aria-hidden', show ? 'false' : 'true');
    links.forEach(function (a) { a.tabIndex = show ? 0 : -1; });
    dock.style.top = (phone() && mode === 'down') ? '0px' : navH() + 'px';

    // current section and progress
    var line = visibleTop() + 48, cur = -1;
    targets.forEach(function (t, i) { if (t && t.getBoundingClientRect().top <= line) cur = i; });
    links.forEach(function (a, i) { a.classList.toggle('on', i === cur); if (i === cur) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
    var max = document.documentElement.scrollHeight - innerHeight;
    prog.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
    if (cur >= 0 && show) {
      var on = links[cur], l = on.offsetLeft - inner.scrollLeft;
      if (l < 0 || l + on.offsetWidth > inner.clientWidth) inner.scrollTo({ left: on.offsetLeft - 16, behavior: reduce ? 'auto' : 'smooth' });
    }
    ticking = false;
  }
  // height of the bars covering the top of the screen right now
  function visibleTop() {
    var h = 0;
    if (root.classList.contains('pj-down')) return phone() ? dockH() : navH() + dockH();
    if (root.classList.contains('pj-up')) return navH() + (sub ? subH() : dockH());
    return navH() + subH();
  }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(state); } }, { passive: true });
  addEventListener('resize', function () { align(); state(); });

  // taps land just below the bars that will be showing when the scroll ends
  function go(e) {
    var a = e.target.closest('a[href^="#"]'); if (!a) return;
    var t = document.getElementById(a.getAttribute('href').slice(1)); if (!t) return;
    e.preventDefault();
    var top = t.getBoundingClientRect().top + window.scrollY;
    var goingDown = top > window.scrollY;
    var off = goingDown ? (phone() ? dockH() : navH() + dockH()) : navH() + (sub ? subH() : dockH());
    window.scrollTo({ top: Math.max(0, top - off - 12), behavior: reduce ? 'auto' : 'smooth' });
    if (history.replaceState) history.replaceState(null, '', a.getAttribute('href'));
  }
  dock.addEventListener('click', go);
  jump.addEventListener('click', go);
  align();
  state();
})();
