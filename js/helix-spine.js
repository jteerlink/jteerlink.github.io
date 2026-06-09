/* ============================================================
   EPHEMERAL HELIX SPINE · live WebGL (Three.js)
   ------------------------------------------------------------
   A glittering, semi-transparent particle double-helix held in
   faint structural rings (quantum-chamber vibe). Rotation is
   SCROLL-DRIVEN, not on a timer; only the per-particle shimmer
   is time-based. Ice + steel palette. Falls back to a static 2D
   helix when WebGL is unavailable / reduced-motion / mobile.
   ============================================================ */

import * as THREE from "https://esm.sh/three@0.169.0";

(function () {
  "use strict";

  const canvas = document.getElementById("helix-spine");
  const outer = document.querySelector(".helix-outer");
  if (!canvas || !outer) return;

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isSmall = () => window.innerWidth <= 768;

  // ── Geometry constants ───────────────────────────────────
  const HEIGHT = 11;      // vertical span
  const RADIUS = 1.7;     // strand radius
  const TURNS = 3;        // helix turns top→bottom
  const PER_STRAND = 1500;
  const GLITTER = 1100;
  const SPINE_TURNS = 0.95; // rotations across the full scroll — tracks the cards' tower sweep
                            // ((n-1)*ANG_STEP)/2π = (4*1.5)/2π ≈ 0.95 (see js/scifi.js)

  const ICE = 0x38e1ff;    // aqua strand
  const STEEL = 0x43e0a0;  // emerald strand
  const WHITE = 0xeaf6ff;  // spark rungs
  const AMBER = 0xffd27a;  // rare warm motes

  // ── Scroll progress (same model as the cards) ────────────
  function scrollProgress() {
    const rect = outer.getBoundingClientRect();
    const total = outer.offsetHeight - window.innerHeight;
    const scrolled = Math.min(Math.max(-rect.top, 0), total);
    return total > 0 ? scrolled / total : 0;
  }

  /* ---------- 2D fallback (no WebGL / reduced-motion) ------- */
  function fallback2D() {
    let ctx;
    try { ctx = canvas.getContext("2d"); } catch (e) { return; }
    if (!ctx) return;
    function draw() {
      const w = (canvas.width = canvas.clientWidth);
      const h = (canvas.height = canvas.clientHeight);
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, R = Math.min(w * 0.12, 120), steps = 140;
      const phase = scrollProgress() * Math.PI * 2 * SPINE_TURNS;
      for (let s = 0; s < 2; s++) {
        for (let i = 0; i < steps; i++) {
          const t = i / (steps - 1);
          const a = t * TURNS * Math.PI * 2 + phase + s * Math.PI;
          const depth = (Math.cos(a) + 1) / 2;
          const x = cx + Math.sin(a) * R;
          const y = h * 0.1 + t * h * 0.8;
          ctx.beginPath();
          ctx.arc(x, y, 1 + depth * 1.6, 0, Math.PI * 2);
          ctx.fillStyle = s === 0
            ? `rgba(56,225,255,${0.15 + depth * 0.5})`
            : `rgba(67,224,160,${0.12 + depth * 0.45})`;
          ctx.fill();
        }
      }
    }
    draw();
    window.addEventListener("scroll", draw, { passive: true });
    window.addEventListener("resize", draw);
  }

  if (reduceMotion || isSmall()) { fallback2D(); return; }

  // ── WebGL setup ──────────────────────────────────────────
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch (e) {
    fallback2D();
    return;
  }
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 13);

  // Soft round glowing point sprite
  function makeSprite() {
    const s = 64, c = document.createElement("canvas");
    c.width = c.height = s;
    const g = c.getContext("2d");
    const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grd.addColorStop(0, "rgba(255,255,255,1)");
    grd.addColorStop(0.35, "rgba(255,255,255,0.55)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, s, s);
    return new THREE.CanvasTexture(c);
  }
  const sprite = makeSprite();

  const group = new THREE.Group();
  group.rotation.z = 0.05; // faint structural tilt
  scene.add(group);

  // Strand point cloud (two strands + spark rungs) with glitter jitter
  function buildStrands() {
    const pos = [], col = [];
    const cIce = new THREE.Color(ICE);
    const cSteel = new THREE.Color(STEEL);
    const cWhite = new THREE.Color(WHITE);

    function strand(phase, color) {
      for (let i = 0; i < PER_STRAND; i++) {
        const t = i / (PER_STRAND - 1);
        const a = t * TURNS * Math.PI * 2 + phase;
        const jr = (Math.random() - 0.5) * 0.22;      // radial glitter jitter
        const ja = (Math.random() - 0.5) * 0.22;
        const rr = RADIUS + jr;
        pos.push(
          Math.cos(a + ja) * rr,
          (t - 0.5) * HEIGHT + (Math.random() - 0.5) * 0.07,
          Math.sin(a + ja) * rr
        );
        const b = 0.55 + Math.random() * 0.45;        // brightness twinkle
        col.push(color.r * b, color.g * b, color.b * b);
      }
    }
    strand(0, cIce);
    strand(Math.PI, cSteel);

    // spark rungs between strands
    const RUNGS = 26;
    for (let i = 0; i < RUNGS; i++) {
      const t = (i + 0.5) / RUNGS;
      const a = t * TURNS * Math.PI * 2;
      const y = (t - 0.5) * HEIGHT;
      const ax = Math.cos(a) * RADIUS, az = Math.sin(a) * RADIUS;
      const bx = Math.cos(a + Math.PI) * RADIUS, bz = Math.sin(a + Math.PI) * RADIUS;
      const SEG = 7;
      for (let k = 0; k <= SEG; k++) {
        const f = k / SEG;
        pos.push(ax + (bx - ax) * f, y, az + (bz - az) * f);
        const b = 0.5 + Math.random() * 0.5;
        col.push(cWhite.r * b, cWhite.g * b, cWhite.b * b);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.07,
      map: sprite,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      opacity: 0.92,
    });
    return new THREE.Points(geo, mat);
  }

  // Sparkling particle mass drifting around the column (ephemeral)
  function buildGlitter() {
    const pos = [], col = [];
    const cIce = new THREE.Color(ICE);
    const cSteel = new THREE.Color(STEEL);
    const cAmber = new THREE.Color(AMBER);
    for (let i = 0; i < GLITTER; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.pow(Math.random(), 0.7) * RADIUS * 1.35;
      pos.push(Math.cos(a) * r, (Math.random() - 0.5) * HEIGHT * 1.02, Math.sin(a) * r);
      const roll = Math.random();
      const c = roll < 0.03 ? cAmber : (roll < 0.5 ? cIce : cSteel);  // amber very sparse
      const b = 0.3 + Math.random() * 0.6;
      col.push(c.r * b, c.g * b, c.b * b);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.045,
      map: sprite,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      opacity: 0.5,
    });
    return new THREE.Points(geo, mat);
  }

  // Faint structural rings (the "cage" around the column)
  function buildRings() {
    const g = new THREE.Group();
    const ys = [-HEIGHT / 2 + 0.3, -HEIGHT / 6, HEIGHT / 6, HEIGHT / 2 - 0.3];
    ys.forEach((y, i) => {
      const torus = new THREE.TorusGeometry(RADIUS * 1.16, 0.012, 8, 90);
      const mat = new THREE.MeshBasicMaterial({
        color: i % 2 ? STEEL : ICE,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const ring = new THREE.Mesh(torus, mat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = y;
      g.add(ring);
    });
    return g;
  }

  const strands = buildStrands();
  const glitter = buildGlitter();
  const rings = buildRings();
  group.add(strands, glitter, rings);

  // ── Sizing ───────────────────────────────────────────────
  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  // ── Render loop (only while section is on screen) ────────
  const clock = new THREE.Clock();
  let running = false;

  function renderFrame() {
    const p = scrollProgress();
    group.rotation.y = p * Math.PI * 2 * SPINE_TURNS;     // SCROLL-DRIVEN
    const tt = clock.getElapsedTime();
    strands.material.size = 0.066 + Math.sin(tt * 1.5) * 0.006;   // ambient shimmer
    glitter.material.opacity = 0.42 + Math.sin(tt * 0.8) * 0.13;
    glitter.rotation.y = tt * 0.04;                       // gentle drift of the haze
    renderer.render(scene, camera);
  }

  function loop() {
    if (!running) return;
    renderFrame();
    requestAnimationFrame(loop);
  }

  const io = new IntersectionObserver(
    (entries) => {
      const vis = entries[0].isIntersecting;
      if (vis && !running) { running = true; loop(); }
      else if (!vis) { running = false; }
    },
    { threshold: 0 }
  );
  io.observe(outer);

  // expose for debugging / verification
  window.__helixSpine = { renderer, scrollProgress };
})();
