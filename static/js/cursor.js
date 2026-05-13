/*!
 * cursor.js — Magnetic Elastic Cursor
 * Lusion-style: custom dot + ring with spring physics + magnetic pull on CTAs
 */
(function () {
  'use strict';

  // Only run on non-touch devices
  if (window.matchMedia('(pointer: coarse)').matches) return;

  /* ── Create DOM ─────────────────────────────────────────── */
  const dot  = document.createElement('div'); dot.id  = 'cursor-dot';
  const ring = document.createElement('div'); ring.id = 'cursor-ring';
  document.body.appendChild(dot);
  document.body.appendChild(ring);

  /* ── Mouse / spring state ───────────────────────────────── */
  let mx = -200, my = -200;
  let rx = -200, ry = -200;
  let rvx = 0,   rvy = 0;

  const SPRING  = 0.11;
  const DAMPING = 0.76;

  /* ── Track mouse ────────────────────────────────────────── */
  document.addEventListener('mousemove', function (e) {
    mx = e.clientX;
    my = e.clientY;
    dot.style.transform = `translate(${mx - 4}px, ${my - 4}px)`;
  });

  /* ── Spring animation loop ──────────────────────────────── */
  function tick() {
    const fx = (mx - rx) * SPRING;
    const fy = (my - ry) * SPRING;
    rvx = (rvx + fx) * DAMPING;
    rvy = (rvy + fy) * DAMPING;
    rx += rvx;
    ry += rvy;
    ring.style.transform = `translate(${rx - 20}px, ${ry - 20}px)`;
    requestAnimationFrame(tick);
  }
  tick();

  /* ── Hover state ─────────────────────────────────────────── */
  document.querySelectorAll('a, button, [role="button"], .service-card, .stat-card, .gallery-item').forEach(function (el) {
    el.addEventListener('mouseenter', function () {
      dot.classList.add('cursor-hover');
      ring.classList.add('cursor-hover');
    });
    el.addEventListener('mouseleave', function () {
      dot.classList.remove('cursor-hover');
      ring.classList.remove('cursor-hover');
    });
  });

  /* ── Magnetic pull on CTA elements ──────────────────────── */
  // Elements shift slightly toward the cursor when hovered
  const MAGNETIC_SELECTORS = '.btn-primary, .btn-outline, .nav-cta, .nav-logo';
  document.querySelectorAll(MAGNETIC_SELECTORS).forEach(function (el) {
    let animFrame;
    el.style.transition = 'transform 0.1s linear';

    el.addEventListener('mousemove', function (e) {
      cancelAnimationFrame(animFrame);
      animFrame = requestAnimationFrame(function () {
        const rect  = el.getBoundingClientRect();
        const cx    = rect.left + rect.width  / 2;
        const cy    = rect.top  + rect.height / 2;
        const dx    = (e.clientX - cx) * 0.28;
        const dy    = (e.clientY - cy) * 0.28;
        el.style.transform    = `translate(${dx}px, ${dy}px)`;
        el.style.transition   = 'transform 0.08s linear';
      });
    });

    el.addEventListener('mouseleave', function () {
      cancelAnimationFrame(animFrame);
      el.style.transform  = 'translate(0, 0)';
      el.style.transition = 'transform 0.55s cubic-bezier(0.23, 1, 0.32, 1)';
    });
  });

  /* ── Click burst ─────────────────────────────────────────── */
  document.addEventListener('mousedown', function () {
    dot.classList.add('cursor-click');
    ring.classList.add('cursor-click');
  });
  document.addEventListener('mouseup', function () {
    dot.classList.remove('cursor-click');
    ring.classList.remove('cursor-click');
  });

})();
