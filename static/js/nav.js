/*!
 * nav.js — Scroll-aware nav + mobile hamburger
 * Transparent over hero (page-home), solid elsewhere
 */
(function () {
  'use strict';

  const nav        = document.getElementById('site-nav');
  const hamburger  = document.getElementById('nav-hamburger');
  const links      = document.getElementById('nav-links');
  const isHome     = document.body.classList.contains('page-home');

  /* ── Scroll behaviour ─────────────────────────────── */
  function updateNav() {
    const scrolled = window.scrollY > 60;
    nav.classList.toggle('scrolled', scrolled || !isHome);
  }

  // On non-home pages start solid immediately
  if (!isHome) nav.classList.add('scrolled');

  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  /* ── Mobile hamburger ─────────────────────────────── */
  hamburger.addEventListener('click', function () {
    const open = links.classList.toggle('open');
    hamburger.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // Close on link click (mobile)
  links.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      links.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });

  // Close on outside click
  document.addEventListener('click', function (e) {
    if (!nav.contains(e.target)) {
      links.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  });
})();
