/*!
 * animations.js — Elastic GSAP Scroll Entrances + Organic Transitions
 * Lusion-style: CustomEase physics on all section reveals + inter-page organic mask
 */
(function () {
  'use strict';

  if (typeof gsap === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  /* ══════════════════════════════════════════════════════════
     ELASTIC SCROLL ENTRANCE ANIMATIONS
     CustomEase elastic physics on every section reveal
  ══════════════════════════════════════════════════════════ */

  /* ── Section labels ─────────────────────────────────────── */
  gsap.utils.toArray('.section-label, .page-banner-label').forEach(function (el) {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 90%' },
      x: -20, opacity: 0, duration: 0.7,
      ease: 'power3.out'
    });
  });

  /* ── Section headings — elastic snap ────────────────────── */
  gsap.utils.toArray('.section-heading, .page-banner-title, .cta-heading').forEach(function (el) {
    // Split by words for staggered elastic entrance
    el.style.overflow = 'hidden';
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 88%' },
      y: 60, opacity: 0, duration: 1.4,
      ease: 'elastic.out(1, 0.65)',
      clearProps: 'all'
    });
  });

  /* ── Body text ───────────────────────────────────────────── */
  gsap.utils.toArray('.section-body').forEach(function (el) {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 90%' },
      y: 24, opacity: 0, duration: 0.9,
      ease: 'power2.out',
      delay: 0.18
    });
  });

  /* ── Service cards — staggered back.out ─────────────────── */
  const serviceCards = gsap.utils.toArray('.service-card');
  if (serviceCards.length) {
    gsap.from(serviceCards, {
      scrollTrigger: {
        trigger: '.services-grid',
        start: 'top 85%'
      },
      y: 50, opacity: 0, duration: 0.85,
      stagger: 0.09,
      ease: 'back.out(1.6)'
    });
  }

  /* ── Stat cards ─────────────────────────────────────────── */
  gsap.utils.toArray('.stat-card').forEach(function (el, i) {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 90%' },
      scale: 0.88, opacity: 0, duration: 0.75,
      ease: 'back.out(2)',
      delay: i * 0.1
    });
  });

  /* ── Pillar cards ───────────────────────────────────────── */
  gsap.utils.toArray('.pillar-card').forEach(function (el, i) {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 92%' },
      x: i % 2 === 0 ? -30 : 30, opacity: 0, duration: 0.8,
      ease: 'expo.out',
      delay: i * 0.08
    });
  });

  /* ── Industry pills — cascade ───────────────────────────── */
  gsap.utils.toArray('.industry-pill').forEach(function (el, i) {
    gsap.from(el, {
      scrollTrigger: { trigger: '.industries-strip', start: 'top 88%' },
      y: 20, opacity: 0, duration: 0.6,
      ease: 'power2.out',
      delay: i * 0.055
    });
  });

  /* ── FAQ items ───────────────────────────────────────────── */
  gsap.utils.toArray('.faq-item').forEach(function (el, i) {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 92%' },
      x: -20, opacity: 0, duration: 0.6,
      ease: 'power3.out',
      delay: i * 0.07
    });
  });

  /* ── Contact info cards ──────────────────────────────────── */
  gsap.utils.toArray('.contact-info-card').forEach(function (el, i) {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 90%' },
      x: -24, opacity: 0, duration: 0.7,
      ease: 'expo.out',
      delay: i * 0.1
    });
  });

  /* ── Gallery items ───────────────────────────────────────── */
  gsap.utils.toArray('.gallery-item').forEach(function (el, i) {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 95%' },
      scale: 0.9, opacity: 0, duration: 0.6,
      ease: 'back.out(1.4)',
      delay: (i % 4) * 0.06
    });
  });

  /* ── Specs table rows ────────────────────────────────────── */
  gsap.utils.toArray('.specs-table tr').forEach(function (el, i) {
    if (i === 0) return; // skip header
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 95%' },
      x: 20, opacity: 0, duration: 0.5,
      ease: 'power2.out',
      delay: i * 0.03
    });
  });

  /* ── Service detail cards ────────────────────────────────── */
  gsap.utils.toArray('.service-detail-card').forEach(function (el, i) {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 85%' },
      y: 40, opacity: 0, duration: 1.1,
      ease: 'elastic.out(1, 0.75)',
      delay: i * 0.05
    });
  });

  /* ══════════════════════════════════════════════════════════
     ORGANIC PAGE TRANSITIONS
     Noise-based SVG mask wipe on navigation
  ══════════════════════════════════════════════════════════ */

  // Select transition overlay from DOM (injected via base.html to prevent FOUC)
  var overlay = document.getElementById('page-transition');
  var panels = overlay ? overlay.querySelectorAll('.pt-panel') : [];

  if (overlay && panels.length) {
    function transitionOut(href) {
    gsap.set(overlay, { pointerEvents: 'all' });
    gsap.fromTo(panels,
      { scaleY: 0, transformOrigin: 'bottom center' },
      {
        scaleY: 1,
        duration: 0.55,
        ease: 'expo.in',
        stagger: 0.07,
        onComplete: function () {
          window.location.href = href;
        }
      }
    );
  }

  function transitionIn() {
    gsap.fromTo(panels,
      { scaleY: 1, transformOrigin: 'top center' },
      {
        scaleY: 0,
        duration: 0.6,
        ease: 'expo.out',
        stagger: 0.06,
        delay: 0.05,
        onComplete: function () {
          gsap.set(overlay, { pointerEvents: 'none' });
        }
      }
    );
  }

  // Intercept internal link clicks
  document.querySelectorAll('a[href]').forEach(function (link) {
    var href = link.getAttribute('href');
    // Only intercept same-origin, non-anchor links
    if (!href || href.startsWith('#') || href.startsWith('http') ||
        href.startsWith('mailto') || href.startsWith('tel')) return;

    // Do not intercept if it's a hash link to the current page
    if (link.hostname === window.location.hostname && 
        link.pathname.replace(/\/$/, '') === window.location.pathname.replace(/\/$/, '') && 
        link.hash) {
      return;
    }

    link.addEventListener('click', function (e) {
      e.preventDefault();
      transitionOut(href);
    });
  });

  // Run entrance transition on page load
  window.addEventListener('load', function () {
    // Brief delay to let hero preloader lead
    setTimeout(transitionIn, 10);
    
    // Ensure accurate scroll to hash after layout settles (for cross-page anchor links)
    if (window.location.hash) {
      setTimeout(function() {
        try {
          var target = document.querySelector(window.location.hash);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
          }
        } catch(e) {}
      }, 600); // Wait for transitionIn to mostly finish
    }
  });
  }

  /* ══════════════════════════════════════════════════════════
     HERO TITLE PARALLAX (desktop only)
  ══════════════════════════════════════════════════════════ */
  if (!window.matchMedia('(pointer: coarse)').matches) {
    var heroTitle = document.querySelector('.hero-title');
    var heroTagline = document.querySelector('.hero-tagline');
    if (heroTitle) {
      document.addEventListener('mousemove', function (e) {
        var xPct = (e.clientX / window.innerWidth - 0.5) * 14;
        var yPct = (e.clientY / window.innerHeight - 0.5) * 8;
        gsap.to(heroTitle, { x: xPct, y: yPct, duration: 1.8, ease: 'power1.out', overwrite: 'auto' });
        if (heroTagline) gsap.to(heroTagline, { x: xPct * 0.5, y: yPct * 0.5, duration: 2, ease: 'power1.out', overwrite: 'auto' });
      }, { passive: true });
    }
  }
})();
