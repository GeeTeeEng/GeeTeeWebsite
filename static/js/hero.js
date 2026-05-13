/*!
 * hero.js — Kinetic Engineering Hero
 * GSAP + ScrollTrigger canvas-based scroll sequence
 * Mobile-optimised: pinType:transform, normalizeScroll, dynamic viewport height
 */

(function () {
  'use strict';

  /* ── Config ─────────────────────────────────────────────── */
  const TOTAL_FRAMES  = 80;
  const PRELOAD_FIRST = 10;
  const SEQ_PATH      = '/static/images/sequence/';

  /* ── Device detection ────────────────────────────────────── */
  const isMobile  = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 769;
  const isIOS     = /iphone|ipad|ipod/i.test(navigator.userAgent);

  /* ── Dynamic viewport height fix ────────────────────────── */
  // iOS Safari and Android Chrome change viewport height when the browser
  // address bar shows/hides, causing 100vh to be taller than the visible area.
  function setVh() {
    document.documentElement.style.setProperty('--real-vh', window.innerHeight * 0.01 + 'px');
  }
  setVh();
  window.addEventListener('resize', setVh, { passive: true });

  /* ── State ───────────────────────────────────────────────── */
  const images    = new Array(TOTAL_FRAMES);
  let loadedCount = 0;
  let currentIdx  = 0;
  let tabVisible  = true;

  /* ── Pause canvas when tab is hidden ────────────────────── */
  document.addEventListener('visibilitychange', function () {
    tabVisible = !document.hidden;
  });

  /* ── DOM refs ────────────────────────────────────────────── */
  const canvas    = document.getElementById('hero-canvas');
  const ctx       = canvas.getContext('2d');
  const preloader = document.getElementById('preloader');
  const bar       = document.getElementById('preloader-bar');
  const counter   = document.getElementById('preloader-counter');

  /* ── Canvas: cover-fit draw ─────────────────────────────── */
  function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;  // matches --real-vh * 100 via CSS
    if (images[currentIdx]?.complete) drawFrame(images[currentIdx]);
  }

  function drawFrame(img) {
    if (!tabVisible) return;
    if (!img?.complete || !img.naturalWidth) return;
    const cw = canvas.width, ch = canvas.height;
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const scale = Math.max(cw / iw, ch / ih);
    const sw = iw * scale, sh = ih * scale;
    
    // Default to dead-center (0.5)
    let focalX = 0.5;
    
    // Shift focal point on mobile (<= 768px width)
    if (window.innerWidth <= 768) {
      // Python pixel analysis: shield center is at x=950 in a 1920px image = 0.4948.
      // At focalX=0.5 the shield sits at 48% of visible area.
      // focalX=0.495 places the shield tip at exactly 50% of the mobile screen.
      focalX = 0.54;
    }
    
    // Calculate raw X offset based on focal point
    let sx = (cw / 2) - (sw * focalX);
    
    // Clamp the offset to ensure we don't reveal the edge of the canvas
    sx = Math.min(0, Math.max(cw - sw, sx));
    
    const sy = (ch - sh) / 2; // Keep Y centered
    
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, sx, sy, sw, sh);
  }

  /* ── Frame path helper ───────────────────────────────────── */
  function framePath(n) {
    return `${SEQ_PATH}frame-${n + 1}.webp`;
  }

  /* ── Preloader ───────────────────────────────────────────── */
  function updateBar(pct) {
    bar.style.width     = `${pct}%`;
    counter.textContent = `${Math.round(pct)}%`;
  }

  function hidePreloader() {
    preloader.classList.add('hidden');
    loadRemainingFrames();
  }

  function loadFrame(index) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = img.onerror = () => {
        images[index] = img;
        loadedCount++;
        if (index < PRELOAD_FIRST) updateBar(Math.min((loadedCount / PRELOAD_FIRST) * 100, 100));
        resolve(img);
      };
      img.src = framePath(index);
    });
  }

  function loadRemainingFrames() {
    for (let i = PRELOAD_FIRST; i < TOTAL_FRAMES; i++) {
      if (!images[i]) loadFrame(i);
    }
  }

  /* ── First-batch preload ─────────────────────────────────── */
  async function preloadFirstBatch() {
    resizeCanvas();
    const promises = [];
    for (let i = 0; i < PRELOAD_FIRST; i++) promises.push(loadFrame(i));
    await Promise.all(promises);
    drawFrame(images[0]);
    currentIdx = 0;
    updateBar(100);
    await new Promise(r => setTimeout(r, 360));
    hidePreloader();
    initScrollAnimation();
  }

  /* ── GSAP scroll animation ───────────────────────────────── */
  function initScrollAnimation() {
    gsap.registerPlugin(ScrollTrigger);

    // On mobile: normalizeScroll smooths out iOS elastic bounce &
    // Android over-scroll so ScrollTrigger scrub stays in sync.
    if (isMobile) {
      ScrollTrigger.normalizeScroll(true);
    }

    gsap.to({}, {
      scrollTrigger: {
        trigger:  '#hero',
        start:    'top top',
        end:      isMobile ? '+=100%' : '+=150%',  // shorter pin on mobile = faster feel
        pin:      true,
        // pinType "transform" uses CSS transforms instead of position:fixed —
        // far more reliable on iOS Safari which has known bugs with fixed positioning.
        pinType:  isMobile ? 'transform' : 'fixed',
        scrub:    isMobile ? 0.3 : 0.5,            // snappier on mobile touch
        invalidateOnRefresh: true,                  // recalculate after orientation change
        onUpdate(self) {
          const idx = Math.max(0, Math.min(
            Math.round(self.progress * (TOTAL_FRAMES - 1)),
            TOTAL_FRAMES - 1
          ));
          if (idx !== currentIdx) {
            currentIdx = idx;
            if (images[idx]?.complete) {
              drawFrame(images[idx]);
            } else if (!images[idx]) {
              const img = new Image();
              img.onload = () => {
                images[idx] = img;
                if (currentIdx === idx) drawFrame(img);
              };
              img.src    = framePath(idx);
              images[idx] = img;
            }
          }
        }
      }
    });

    // Refresh ScrollTrigger after orientation change (portrait ↔ landscape)
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        setVh();
        resizeCanvas();
        ScrollTrigger.refresh();
      }, 300);
    });
  }

  /* ── Init ────────────────────────────────────────────────── */
  window.addEventListener('resize', resizeCanvas, { passive: true });
  resizeCanvas();
  preloadFirstBatch();

})();
