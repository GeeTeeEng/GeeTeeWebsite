/*!
 * webgl-bg.js — Atmospheric WebGL Fluid Background
 * Raw WebGL — no library dependency.
 * Creates a dark, reactive noise field that responds to mouse movement.
 * Layered fBm (Fractal Brownian Motion) with mouse-driven vortex ripple.
 *
 * Performance guards:
 *   - Runs at ~30fps (frame skipping)
 *   - Pauses when tab is hidden (visibilitychange)
 *   - Pauses when canvas is off-screen (IntersectionObserver)
 *   - Cleans up WebGL resources on page unload
 */
(function () {
  'use strict';

  // Only on homepage (hero canvas exists)
  if (!document.getElementById('hero-canvas')) return;
  // Skip on touch devices for performance
  if (window.matchMedia('(pointer: coarse)').matches) return;

  /* ── Canvas setup ───────────────────────────────────────── */
  const canvas = document.createElement('canvas');
  canvas.id = 'webgl-bg';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(canvas, document.body.firstChild);

  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) { canvas.remove(); return; }

  /* ── Shaders ─────────────────────────────────────────────── */
  const VS_SRC = `
    attribute vec2 a_pos;
    void main() {
      gl_Position = vec4(a_pos, 0.0, 1.0);
    }
  `;

  const FS_SRC = `
    precision mediump float;

    uniform vec2  u_res;
    uniform vec2  u_mouse;
    uniform float u_time;
    uniform float u_scroll;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash(i),
            b = hash(i + vec2(1.0, 0.0)),
            c = hash(i + vec2(0.0, 1.0)),
            d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    float fbm(vec2 p) {
      float v = 0.0, amp = 0.5;
      for (int i = 0; i < 5; i++) {
        v   += amp * noise(p);
        p   *= 2.1;
        amp *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_res;
      vec2 mouse = vec2(u_mouse.x / u_res.x, 1.0 - u_mouse.y / u_res.y);
      float t = u_time * 0.06;

      vec2 q = vec2(
        fbm(uv * 2.8 + t),
        fbm(uv * 2.8 + vec2(5.2, 1.3) + t)
      );
      vec2 r = vec2(
        fbm(uv * 2.5 + 4.0 * q + vec2(1.7, 9.2) + 0.15 * t),
        fbm(uv * 2.5 + 4.0 * q + vec2(8.3, 2.8) + 0.15 * t)
      );
      float n = fbm(uv * 1.8 + 3.5 * r + t * 0.5);

      float dist  = distance(uv, mouse);
      float ripple = exp(-dist * 6.0) * sin(dist * 22.0 - u_time * 2.2) * 0.18;
      float glow   = smoothstep(0.55, 0.0, dist) * 0.22;

      vec3 darkNavy  = vec3(0.018, 0.035, 0.085);
      vec3 deepTeal  = vec3(0.025, 0.12,  0.22);
      vec3 accentBlue = vec3(0.0,  0.38,  0.72);

      vec3 col = mix(darkNavy, deepTeal, clamp(n + ripple, 0.0, 1.0));
      col += accentBlue * glow * (0.6 + 0.4 * sin(u_time * 0.7));

      float vig = smoothstep(0.0, 0.6, distance(uv, vec2(0.5)));
      col *= 1.0 - vig * 0.65;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  /* ── Compile helper ─────────────────────────────────────── */
  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('[webgl-bg] Shader error:', gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  const vs = compile(gl.VERTEX_SHADER,   VS_SRC);
  const fs = compile(gl.FRAGMENT_SHADER, FS_SRC);
  if (!vs || !fs) { canvas.remove(); return; }

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('[webgl-bg] Link error:', gl.getProgramInfoLog(prog));
    canvas.remove(); return;
  }
  gl.useProgram(prog);

  /* ── Geometry — full-screen quad ────────────────────────── */
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,  1, -1, -1,  1,
     1, -1,  1,  1, -1,  1
  ]), gl.STATIC_DRAW);

  const aPosLoc = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(aPosLoc);
  gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, 0, 0);

  /* ── Uniform locations ───────────────────────────────────── */
  const uRes    = gl.getUniformLocation(prog, 'u_res');
  const uMouse  = gl.getUniformLocation(prog, 'u_mouse');
  const uTime   = gl.getUniformLocation(prog, 'u_time');
  const uScroll = gl.getUniformLocation(prog, 'u_scroll');

  /* ── State ───────────────────────────────────────────────── */
  let mx = 0, my = 0;
  let smx = 0, smy = 0;
  let startTime = performance.now();
  let isVisible = true;
  let isOnScreen = true;
  let rafId = null;

  document.addEventListener('mousemove', function (e) {
    mx = e.clientX;
    my = e.clientY;
  }, { passive: true });

  /* ── Visibility change: pause when tab is hidden ─────────── */
  document.addEventListener('visibilitychange', function () {
    isVisible = !document.hidden;
    if (isVisible && isOnScreen) startRender();
  });

  /* ── IntersectionObserver: pause when off-screen ──────────── */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      isOnScreen = entries[0].isIntersecting;
      if (isOnScreen && isVisible) startRender();
    }, { threshold: 0 }).observe(canvas);
  }

  /* ── Resize ──────────────────────────────────────────────── */
  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  /* ── Render loop ─────────────────────────────────────────── */
  let frame = 0;
  function render() {
    if (!isVisible || !isOnScreen) { rafId = null; return; }

    frame++;
    // Run at ~30fps to save GPU (every other frame)
    if (frame % 2 === 0) {
      rafId = requestAnimationFrame(render);
      return;
    }

    const t = (performance.now() - startTime) / 1000;

    smx += (mx - smx) * 0.06;
    smy += (my - smy) * 0.06;

    gl.uniform2f(uRes,   canvas.width, canvas.height);
    gl.uniform2f(uMouse, smx, smy);
    gl.uniform1f(uTime,  t);
    gl.uniform1f(uScroll, window.scrollY / (document.body.scrollHeight - window.innerHeight || 1));

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    rafId = requestAnimationFrame(render);
  }

  function startRender() {
    if (rafId) return; // already running
    rafId = requestAnimationFrame(render);
  }

  startRender();

  /* ── Cleanup on page unload ──────────────────────────────── */
  window.addEventListener('beforeunload', function () {
    if (rafId) cancelAnimationFrame(rafId);
    gl.deleteBuffer(buf);
    gl.deleteProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    canvas.remove();
  });

})();
