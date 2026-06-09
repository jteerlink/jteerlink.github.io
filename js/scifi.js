/* ============================================================
   SCIFI PORTFOLIO · PARTICLE SYSTEM + INTERACTIVE EFFECTS
   ============================================================ */

(function () {
  'use strict';

  /* ── Particle Canvas ────────────────────────────────────── */
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, mouse = { x: -999, y: -999 };
  let particles = [];
  let rafId;
  let tick = 0;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', () => { resize(); buildParticles(); });
  resize();

  /* Track mouse for repulsion */
  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    moveCursorGlow(e);
  });

  window.addEventListener('mouseleave', () => { mouse.x = -999; mouse.y = -999; });

  /* ── Background swarm (Bioluminal) ──────────────────────────
     Dense, fine particles grouped into a few swarms. Each swarm is a
     Gaussian blob (dense core → tapering edges); ~half ORBIT the screen
     centre so they swirl around the helix column. No per-particle trails —
     the swarm's accumulation is what tapers. Swarm homes stay fairly central
     (limited dispersion) rather than spreading across the whole screen. */
  function rand(a, b) { return a + Math.random() * (b - a); }
  function gauss() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  const SWARM_HUES = ['#38e1ff', '#38e1ff', '#43e0a0', '#43e0a0', '#9be9ff', '#7ad6ff'];
  let clusters = [];

  // ── Billowing fog / steam (eerie volumetric haze behind the swarm) ──
  // A handful of large, soft, low-alpha blobs that slowly rise, drift and
  // pulse — overlapping radial gradients read as morphing cloud banks.
  const FOG_TONES = [
    'rgba(46, 92, 96, ALPHA)',   // cold teal-grey
    'rgba(70, 96, 84, ALPHA)',   // sickly green-grey
    'rgba(40, 66, 88, ALPHA)',   // cold blue-grey
    'rgba(58, 80, 92, ALPHA)'    // pale steel haze
  ];
  let fog = [];

  function buildFog() {
    fog = [];
    const COUNT = W < 760 ? 6 : 10;
    const big = Math.max(W, H);
    for (let i = 0; i < COUNT; i++) {
      fog.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: (0.26 + Math.random() * 0.32) * big,            // large, soft masses
        rise: 0.10 + Math.random() * 0.22,                  // slow upward billow (steam)
        swayAmp: W * (0.03 + Math.random() * 0.05),
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: 0.003 + Math.random() * 0.004,
        pulsePhase: Math.random() * Math.PI * 2,
        alpha: 0.055 + Math.random() * 0.06,                // faint but perceptible
        tone: FOG_TONES[i % FOG_TONES.length]
      });
    }
  }

  function updateFog() {
    for (const f of fog) {
      f.y -= f.rise;                                         // rise like steam
      if (f.y < -f.r * 0.6) { f.y = H + f.r * 0.6; f.x = Math.random() * W; }
    }
  }

  function drawFog() {
    const t = tick;
    ctx.globalCompositeOperation = 'screen';
    for (const f of fog) {
      const x = f.x + Math.sin(t * f.swaySpeed + f.swayPhase) * f.swayAmp;
      const r = f.r * (0.82 + 0.18 * Math.sin(t * 0.006 + f.pulsePhase));
      const a = f.alpha * (0.7 + 0.3 * Math.sin(t * 0.004 + f.swayPhase));
      const g = ctx.createRadialGradient(x, f.y, 0, x, f.y, r);
      g.addColorStop(0, f.tone.replace('ALPHA', a.toFixed(3)));
      g.addColorStop(0.5, f.tone.replace('ALPHA', (a * 0.55).toFixed(3)));
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  function updateClusters() {
    const cx = W / 2, cy = H / 2, t = tick * 0.013;
    clusters.forEach(c => {
      if (c.orbit) {
        c.ang += c.angVel * 0.024;                          // faster swirl
        c.x = cx + Math.cos(c.ang) * c.rad;
        c.y = cy + Math.sin(c.ang) * c.rad * 0.72;        // elliptical swirl around the column
      } else {
        c.x = c.bx + Math.sin(t * 0.7 + c.wpx) * W * 0.10; // quicker, wider wander across the screen
        c.y = c.by + Math.cos(t * 0.6 + c.wpy) * H * 0.10;
      }
    });
  }

  function buildParticles() {
    clusters = [];
    particles = [];
    const cx = W / 2, cy = H / 2, minWH = Math.min(W, H);
    const SWARMS = W < 760 ? 5 : 7;

    for (let s = 0; s < SWARMS; s++) {
      const orbit = s % 3 === 0;                            // a few orbit the column; the rest roam
      clusters.push({
        orbit,
        bx: W * (0.06 + 0.88 * Math.random()),              // home bases spread across the WHOLE screen
        by: H * (0.08 + 0.84 * Math.random()),
        ang: Math.random() * Math.PI * 2,
        rad: minWH * (0.18 + Math.random() * 0.34),         // wide swirl — reaches toward the edges
        angVel: (0.10 + Math.random() * 0.06) * (Math.random() > 0.5 ? 1 : -1),
        wpx: Math.random() * Math.PI * 2,
        wpy: Math.random() * Math.PI * 2,
        x: cx, y: cy
      });
    }

    const N = Math.min(1500, Math.floor(W * H / 1400));     // very dense, fine, perf-bounded
    for (let i = 0; i < N; i++) {
      const ci = i % clusters.length;
      const tight = clusters[ci].orbit ? 30 : 64;           // Gaussian blob spread
      particles.push({
        ci,
        ox: gauss() * tight,
        oy: gauss() * tight * (clusters[ci].orbit ? 0.7 : 1),
        x: 0, y: 0, vx: 0, vy: 0,
        hue: Math.random() < 0.012 ? '#ffd27a' : SWARM_HUES[(Math.random() * SWARM_HUES.length) | 0],
        r: 0.5 + Math.random() * 0.7,
        tw: Math.random() * Math.PI * 2
      });
    }

    updateClusters();   // seed homes so particles don't fly in from origin
    particles.forEach(p => { const c = clusters[p.ci]; p.x = c.x + p.ox; p.y = c.y + p.oy; });
    buildFog();
  }

  function updateSwarm() {
    const t = tick * 0.014;
    updateClusters();
    for (const p of particles) {
      const c = clusters[p.ci];
      const homeX = c.x + p.ox, homeY = c.y + p.oy;
      const a = (Math.sin(p.x * 0.011 + t) + Math.cos(p.y * 0.013 - t * 0.8)) * Math.PI;
      p.vx += Math.cos(a) * 0.085;                           // organic flow jitter (faster)
      p.vy += Math.sin(a) * 0.085;
      p.vx += (homeX - p.x) * 0.014;                         // cohesion keeps the taper as the blob drifts
      p.vy += (homeY - p.y) * 0.014;
      const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
      if (d2 < 9000 && d2 > 1) {                             // light mouse repulsion
        const dist = Math.sqrt(d2), f = (1 - dist / 95) * 1.1;
        p.vx += (dx / dist) * f; p.vy += (dy / dist) * f;
      }
      p.vx *= 0.90; p.vy *= 0.90;                            // a touch less damping → livelier motion
      p.x += p.vx; p.y += p.vy;
    }
  }

  function drawNebula() {
    const cx = W * 0.62, cy = H * 0.4;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.3);
    g.addColorStop(0,   'rgba(56,225,255,0.035)');
    g.addColorStop(0.5, 'rgba(67,224,160,0.02)');
    g.addColorStop(1,   'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function drawSwarm() {
    ctx.globalCompositeOperation = 'lighter';
    for (const p of particles) {
      ctx.globalAlpha = 0.4 + 0.35 * (0.5 + 0.5 * Math.sin(tick * 0.05 + p.tw));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.283);
      ctx.fillStyle = p.hue;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function animate() {
    tick++;
    ctx.clearRect(0, 0, W, H);          // full clear → no trails
    drawNebula();
    updateFog();
    drawFog();                          // eerie billowing haze behind the swarm
    updateSwarm();
    drawSwarm();
    rafId = requestAnimationFrame(animate);
  }

  buildParticles();
  animate();

  /* ── Custom cursor glow ─────────────────────────────────── */
  const cursorEl = document.querySelector('.cursor-glow');

  function moveCursorGlow(e) {
    if (!cursorEl) return;
    cursorEl.style.left = e.clientX + 'px';
    cursorEl.style.top  = e.clientY + 'px';
  }

  document.querySelectorAll('a, button, .project-card, .metric-card').forEach(el => {
    el.addEventListener('mouseenter', () => cursorEl && cursorEl.classList.add('large'));
    el.addEventListener('mouseleave', () => cursorEl && cursorEl.classList.remove('large'));
  });

  /* ── Intersection observer reveals ─────────────────────── */
  const revealEls = document.querySelectorAll('.reveal-up, .reveal-right');

  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  revealEls.forEach(el => revealObs.observe(el));

  /* ── Metric scan line trigger ───────────────────────────── */
  const metricCards = document.querySelectorAll('.metric-card');
  const metricObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
        metricObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });

  metricCards.forEach(c => metricObs.observe(c));

  /* ── Count-up for metric numbers ───────────────────────── */
  function countUp(el, target, duration, prefix, suffix, decimals) {
    const start = performance.now();
    function frame(now) {
      const pct = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - pct, 3);
      const val = Math.round(ease * target * (decimals ? 10 : 1)) / (decimals ? 10 : 1);
      el.textContent = val;
      if (pct < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  const countObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseFloat(el.dataset.count);
      if (!isNaN(target)) countUp(el, target, 1600, '', '', false);
      countObs.unobserve(el);
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-count]').forEach(el => countObs.observe(el));

  /* ── Card 3D tilt (grid cards only — helix cards are JS-positioned) ── */
  document.querySelectorAll('.project-card:not(.helix-card)').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      const rotX = ((e.clientY - cy) / rect.height) * -6;
      const rotY = ((e.clientX - cx) / rect.width)  *  6;
      card.style.transform = `translateY(-4px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
      setTimeout(() => { card.style.transition = ''; }, 500);
    });
  });

  /* ── Mini project canvas animations ────────────────────── */
  function initProjectCanvases() {
    document.querySelectorAll('.project-vis').forEach(canvas => {
      const type = canvas.dataset.vis;
      if (!type) return;
      const c = canvas.getContext('2d');
      const W = canvas.width  = canvas.offsetWidth  || 400;
      const H = canvas.height = canvas.offsetHeight || 160;

      switch (type) {
        case 'network':   animNetwork(c, W, H);   break;
        case 'agents':    animAgents(c, W, H);    break;
        case 'scanner':   animScanner(c, W, H);   break;
        case 'bars':      animBars(c, W, H);      break;
        case 'grid':      animGrid(c, W, H);      break;
      }
    });
  }

  /* Network graph (Reddit Signal) */
  function animNetwork(c, W, H) {
    const CYAN = '#38e1ff';
    const nodes = Array.from({ length: 14 }, () => ({
      x: 20 + Math.random() * (W - 40),
      y: 10 + Math.random() * (H - 20),
      r: 2 + Math.random() * 3,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      pulse: Math.random() * Math.PI * 2,
    }));
    const edges = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
        if (Math.hypot(dx, dy) < 90 && Math.random() > 0.4) edges.push([i, j, 0]);
      }
    }

    let t = 0;
    function frame() {
      t += 0.016;
      c.clearRect(0, 0, W, H);
      c.fillStyle = 'rgba(4,12,16,0.9)';
      c.fillRect(0, 0, W, H);

      /* edges */
      edges.forEach(([i, j]) => {
        const a = nodes[i], b = nodes[j];
        const alpha = 0.08 + 0.06 * Math.sin(t * 0.8 + i);
        c.beginPath();
        c.moveTo(a.x, a.y);
        c.lineTo(b.x, b.y);
        c.strokeStyle = `rgba(56,225,255,${alpha})`;
        c.lineWidth = 0.7;
        c.stroke();
      });

      /* traveling pulse on a random edge */
      if (edges.length) {
        const ei = Math.floor(t * 0.6) % edges.length;
        const [i, j] = edges[ei];
        const p = (t * 0.6) % 1;
        const px = nodes[i].x + (nodes[j].x - nodes[i].x) * p;
        const py = nodes[i].y + (nodes[j].y - nodes[i].y) * p;
        c.beginPath();
        c.arc(px, py, 2.5, 0, Math.PI * 2);
        c.fillStyle = CYAN;
        c.shadowBlur = 10; c.shadowColor = CYAN;
        c.fill(); c.shadowBlur = 0;
      }

      /* nodes */
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 5 || n.x > W - 5) n.vx *= -1;
        if (n.y < 5 || n.y > H - 5) n.vy *= -1;
        n.pulse += 0.04;
        const r = n.r * (0.85 + 0.15 * Math.sin(n.pulse));
        c.beginPath(); c.arc(n.x, n.y, r, 0, Math.PI * 2);
        c.fillStyle = '#fff'; c.globalAlpha = 0.7;
        c.shadowBlur = 8; c.shadowColor = CYAN;
        c.fill(); c.shadowBlur = 0; c.globalAlpha = 1;
      });

      requestAnimationFrame(frame);
    }
    frame();
  }

  /* Hub-spoke agents (AI Newsletter) */
  function animAgents(c, W, H) {
    const cx = W / 2, cy = H / 2, hubR = 14, agentR = 7, orbitR = Math.min(W, H) * 0.34;
    const N = 5;
    const PURPLE = '#43e0a0', CYAN = '#38e1ff';
    const packets = [];
    let t = 0;

    function addPacket(i) {
      const angle = (i / N) * Math.PI * 2;
      packets.push({ ax: cx + orbitR * Math.cos(angle), ay: cy + orbitR * Math.sin(angle), p: 0, i, dir: Math.random() > 0.5 ? 1 : -1 });
    }

    setInterval(() => { if (packets.length < 8) addPacket(Math.floor(Math.random() * N)); }, 900);
    addPacket(0); addPacket(2);

    function frame() {
      t += 0.018;
      c.clearRect(0, 0, W, H);
      c.fillStyle = 'rgba(4,12,16,0.9)';
      c.fillRect(0, 0, W, H);

      /* orbit lines */
      for (let i = 0; i < N; i++) {
        const angle = (i / N) * Math.PI * 2;
        const ax = cx + orbitR * Math.cos(angle), ay = cy + orbitR * Math.sin(angle);
        c.beginPath(); c.moveTo(cx, cy); c.lineTo(ax, ay);
        c.strokeStyle = 'rgba(67,224,160,0.15)'; c.lineWidth = 0.8; c.stroke();
      }

      /* packets */
      for (let pk = packets.length - 1; pk >= 0; pk--) {
        const pkt = packets[pk];
        pkt.p += 0.018;
        if (pkt.p >= 1) { packets.splice(pk, 1); continue; }
        const px = (pkt.dir === 1) ? cx + (pkt.ax - cx) * pkt.p : pkt.ax + (cx - pkt.ax) * pkt.p;
        const py = (pkt.dir === 1) ? cy + (pkt.ay - cy) * pkt.p : pkt.ay + (cy - pkt.ay) * pkt.p;
        c.beginPath(); c.arc(px, py, 3, 0, Math.PI * 2);
        c.fillStyle = CYAN; c.shadowBlur = 10; c.shadowColor = CYAN;
        c.fill(); c.shadowBlur = 0;
      }

      /* agents */
      for (let i = 0; i < N; i++) {
        const angle = (i / N) * Math.PI * 2 + t * 0.08;
        const ax = cx + orbitR * Math.cos(angle), ay = cy + orbitR * Math.sin(angle);
        c.beginPath(); c.arc(ax, ay, agentR, 0, Math.PI * 2);
        c.fillStyle = 'rgba(67,224,160,0.25)';
        c.strokeStyle = PURPLE; c.lineWidth = 1.2;
        c.shadowBlur = 10; c.shadowColor = PURPLE;
        c.fill(); c.stroke(); c.shadowBlur = 0;
      }

      /* hub */
      const hubPulse = 1 + 0.12 * Math.sin(t * 2.5);
      c.beginPath(); c.arc(cx, cy, hubR * hubPulse, 0, Math.PI * 2);
      c.fillStyle = 'rgba(56,225,255,0.18)'; c.strokeStyle = CYAN;
      c.lineWidth = 1.5; c.shadowBlur = 20; c.shadowColor = CYAN;
      c.fill(); c.stroke(); c.shadowBlur = 0;

      requestAnimationFrame(frame);
    }
    frame();
  }

  /* Radial scanner (Medical) */
  function animScanner(c, W, H) {
    const cx = W / 2, cy = H / 2 + 10, maxR = Math.min(W, H) * 0.38;
    let t = 0;

    function frame() {
      t += 0.022;
      c.clearRect(0, 0, W, H);
      c.fillStyle = 'rgba(4,12,16,0.9)';
      c.fillRect(0, 0, W, H);

      /* concentric rings */
      [0.33, 0.66, 1].forEach(f => {
        c.beginPath(); c.arc(cx, cy, maxR * f, 0, Math.PI * 2);
        c.strokeStyle = `rgba(56,225,255,${0.06 + f * 0.06})`; c.lineWidth = 0.8; c.stroke();
      });

      /* rotating sweep */
      const sweepAngle = t * 1.5;
      const gradient = c.createConicalGradient
        ? null
        : null;
      c.save();
      c.translate(cx, cy);
      c.rotate(sweepAngle);
      const g = c.createLinearGradient(0, 0, maxR, 0);
      g.addColorStop(0,   'rgba(56,225,255,0.55)');
      g.addColorStop(0.4, 'rgba(56,225,255,0.12)');
      g.addColorStop(1,   'transparent');
      c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, maxR, -0.4, 0); c.closePath();
      c.fillStyle = g; c.fill();
      c.restore();

      /* crosshairs */
      const lw = 0.6, la = 0.15;
      [[cx, cy - maxR, cx, cy + maxR], [cx - maxR, cy, cx + maxR, cy]].forEach(([x1,y1,x2,y2]) => {
        c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2);
        c.strokeStyle = `rgba(56,225,255,${la})`; c.lineWidth = lw; c.stroke();
      });

      /* scanning dot on sweep edge */
      const dotX = cx + maxR * Math.cos(sweepAngle);
      const dotY = cy + maxR * Math.sin(sweepAngle);
      c.beginPath(); c.arc(dotX, dotY, 3, 0, Math.PI * 2);
      c.fillStyle = '#38e1ff'; c.shadowBlur = 12; c.shadowColor = '#38e1ff';
      c.fill(); c.shadowBlur = 0;

      /* heartbeat line at bottom */
      const lineY = H - 22, lx0 = 20;
      c.beginPath(); c.moveTo(lx0, lineY);
      for (let x = 0; x <= W - 40; x += 2) {
        const xr = x / (W - 40);
        const spike = Math.exp(-Math.pow(((xr - ((t * 0.3) % 1)) * 3), 2) * 20) * 18;
        c.lineTo(lx0 + x, lineY - spike);
      }
      c.strokeStyle = 'rgba(158,199,224,0.5)'; c.lineWidth = 1.2; c.stroke();

      requestAnimationFrame(frame);
    }
    frame();
  }

  /* Bar chart (Credit Risk) */
  function animBars(c, W, H) {
    const AMBER = '#ffd27a', CYAN = '#38e1ff';
    const heights = [0.88, 0.76, 0.65, 0.55, 0.45, 0.36, 0.28, 0.21, 0.15, 0.10];
    const n = heights.length;
    const barW = Math.floor((W - 48) / n) - 4;
    let t = 0, progress = 0;

    function frame() {
      t += 0.018;
      progress = Math.min(progress + 0.016, 1);
      c.clearRect(0, 0, W, H);
      c.fillStyle = 'rgba(4,12,16,0.9)';
      c.fillRect(0, 0, W, H);

      const baseY = H - 20;
      const maxBarH = H - 40;

      /* ROC curve */
      c.beginPath();
      heights.forEach((h, i) => {
        const x = 24 + i * (barW + 4) + barW / 2;
        const y = baseY - h * maxBarH * progress;
        i === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
      });
      c.strokeStyle = 'rgba(56,225,255,0.3)'; c.lineWidth = 1; c.setLineDash([3,4]); c.stroke(); c.setLineDash([]);

      /* bars */
      heights.forEach((h, i) => {
        const x = 24 + i * (barW + 4);
        const bh = h * maxBarH * progress;
        const y = baseY - bh;

        const g = c.createLinearGradient(x, y, x, baseY);
        g.addColorStop(0, AMBER);
        g.addColorStop(1, 'rgba(255,210,122,0.15)');
        c.fillStyle = g;
        c.shadowBlur = i < 3 ? 12 : 0;
        c.shadowColor = AMBER;
        c.fillRect(x, y, barW, bh);
        c.shadowBlur = 0;

        /* floating particles above tall bars */
        if (i < 4 && Math.random() > 0.97) {
          const px = x + Math.random() * barW;
          const py = y - Math.random() * 10;
          c.beginPath(); c.arc(px, py, 1, 0, Math.PI * 2);
          c.fillStyle = AMBER; c.globalAlpha = 0.7; c.fill(); c.globalAlpha = 1;
        }
      });

      /* AUC label */
      c.font = `600 10px 'JetBrains Mono', monospace`;
      c.fillStyle = CYAN;
      c.shadowBlur = 6; c.shadowColor = CYAN;
      c.fillText('AUC 0.72', W - 68, 18);
      c.shadowBlur = 0;

      requestAnimationFrame(frame);
    }
    frame();
  }

  /* Activation grid (Deep Learning) */
  function animGrid(c, W, H) {
    const CYAN = '#38e1ff', PURPLE = '#43e0a0';
    const cols = 7, rows = 5;
    const cw = (W - 24) / cols, ch = (H - 16) / rows;
    let t = 0;
    const phases = Array.from({ length: cols * rows }, () => Math.random() * Math.PI * 2);

    function frame() {
      t += 0.025;
      c.clearRect(0, 0, W, H);
      c.fillStyle = 'rgba(4,12,16,0.9)';
      c.fillRect(0, 0, W, H);

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const idx = row * cols + col;
          const wave = 0.5 + 0.5 * Math.sin(t * 1.8 + phases[idx] + col * 0.4);
          const cx = 12 + col * cw + cw / 2;
          const cy = 8  + row * ch + ch / 2;
          const r  = Math.min(cw, ch) * 0.28 * (0.5 + wave * 0.5);
          const alpha = 0.15 + wave * 0.85;
          const color = col < 3 ? CYAN : PURPLE;

          c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2);
          c.fillStyle = color;
          c.globalAlpha = alpha * 0.25;
          c.shadowBlur = wave > 0.7 ? 14 : 0;
          c.shadowColor = color;
          c.fill();

          c.beginPath(); c.arc(cx, cy, r * 0.4, 0, Math.PI * 2);
          c.globalAlpha = alpha;
          c.fill();
          c.shadowBlur = 0; c.globalAlpha = 1;

          /* connection to next column */
          if (col < cols - 1) {
            const nx = 12 + (col + 1) * cw + cw / 2;
            c.beginPath(); c.moveTo(cx + r, cy); c.lineTo(nx - r, cy);
            c.strokeStyle = color;
            c.globalAlpha = alpha * 0.18;
            c.lineWidth = 0.7; c.stroke(); c.globalAlpha = 1;
          }
        }
      }

      requestAnimationFrame(frame);
    }
    frame();
  }

  /* Delay init of mini canvases until DOM is ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProjectCanvases);
  } else {
    initProjectCanvases();
  }

  /* Resize mini canvases on window resize */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(initProjectCanvases, 300);
  });

  /* ── HUD live UTC clock ─────────────────────────────────── */
  const hudTime = document.getElementById('hud-time');
  if (hudTime) {
    const pad = n => String(n).padStart(2, '0');
    const tickClock = () => {
      const d = new Date();
      hudTime.textContent =
        `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
    };
    tickClock();
    setInterval(tickClock, 1000);
  }

  /* ── Decrypt / scramble text (21st.dev-inspired) ────────── */
  (function initScramble() {
    const GLYPHS = '!<>-_\\/[]{}=+*^?#·:0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const els = document.querySelectorAll('[data-scramble]');
    if (!els.length) return;

    function scramble(el) {
      const target = el.getAttribute('data-scramble-text');
      const len = target.length;
      const dur = 240 + len * 24;
      const start = performance.now();
      function frame(now) {
        const p = Math.min((now - start) / dur, 1);
        const reveal = p * len;
        let out = '';
        for (let i = 0; i < len; i++) {
          const ch = target[i];
          if (ch === ' ' || i < reveal) out += ch;
          else out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }
        el.textContent = out;
        if (p < 1) requestAnimationFrame(frame);
        else el.textContent = target;
      }
      requestAnimationFrame(frame);
    }

    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { scramble(e.target); obs.unobserve(e.target); }
      });
    }, { threshold: 0.6 });

    els.forEach((el) => {
      el.setAttribute('data-scramble-text', el.textContent.trim());
      obs.observe(el);
    });
  })();

  /* ── DNA helix carousel (scroll-driven) ─────────────────── */
  (function initHelix() {
    const outer = document.querySelector('.helix-outer');
    const stage = document.getElementById('helix-stage');
    if (!outer || !stage) return;

    const cards = Array.from(stage.querySelectorAll('.helix-card'));
    if (!cards.length) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* Small screens / reduced-motion → static vertical stack */
    function stackedMode() {
      return window.innerWidth <= 768 || reduceMotion;
    }

    function clearInline() {
      cards.forEach(c => { c.style.transform = ''; c.style.opacity = ''; c.style.zIndex = ''; c.classList.remove('helix-front'); });
    }

    const n = cards.length;
    const ANG_STEP = 1.5;      // azimuth (rad) between consecutive cards — loose → gaps between focuses
    const RAD_FRAC = 0.38;     // tower radius as a fraction of stage width — WIDE orbit around the pillar
    const PITCH_FRAC = 0.28;   // vertical descent per card-step as a fraction of stage height
    const SPIN_MAX = 200;      // cap (deg) on each card's independent entry/exit self-spin
    let lastProgress = 0;
    let hoveredCard = null;

    /* TOWER CAROUSEL geometry. The cards are windows on a cylindrical tower,
       set along the spiral staircase (the WebGL spine). As `progress` advances
       the tower ROTATES about its vertical axis while the view DESCENDS, so each
       card rises into frame, swings to face the viewer at centre, then winds
       around and sinks away. `f` = signed distance (in card-steps) from this
       card's focus: f=0 → facing & vertically centred. */
    function place(i, progress) {
      const W = stage.clientWidth, H = stage.clientHeight;
      const cx = W / 2, cy = H / 2;
      const radX = Math.min(W * RAD_FRAC, 560);
      const pitch = H * PITCH_FRAC;
      const cw = cards[i].offsetWidth || 300;
      const ch = cards[i].offsetHeight || 340;

      const f = (n - 1) * progress - i;            // 0 at this card's focus moment
      const angle = f * ANG_STEP;                  // azimuth around the tower (position)
      const depth = (Math.cos(angle) + 1) / 2;     // 1 = near/front, 0 = far/back of tower
      // Each card spins about its OWN vertical axis as it transits the central
      // view: rotateY = 0 (facing) at focus, ±180° by the time it has wound a
      // full step away — an independent flip on entry/exit (backface-hidden →
      // the card flips edge-on → face → edge-on as it passes through centre).
      const spin = Math.max(-SPIN_MAX, Math.min(SPIN_MAX, f * 180));
      return {
        f, depth, spin,
        x: cx + Math.sin(angle) * radX - cw / 2,
        y: cy + f * pitch - ch / 2,               // VERTICAL DESCENT with scroll
        scale: 0.5 + depth * 0.45,                // far cards small, focus card large
        opacity: Math.max(0.18, Math.min(1, 0.18 + depth * 0.82))  // floor → far side faintly visible
      };
    }

    function position(progress) {
      lastProgress = progress;
      cards.forEach((card, i) => {
        if (card === hoveredCard) return;          // hover owns this card until mouseleave
        const p = place(i, progress);
        card.style.transform =
          `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) ` +
          `rotateY(${p.spin.toFixed(2)}deg) scale(${p.scale.toFixed(3)})`;
        card.style.opacity = p.opacity.toFixed(3);
        card.style.zIndex = String(Math.round(p.depth * 100));
        card.style.pointerEvents = Math.abs(p.f) < 0.5 ? 'auto' : 'none';
        card.classList.toggle('helix-front', Math.abs(p.f) < 0.3);
      });
    }

    /* Hover: snap the focused window flat to face the viewer (freeze the wind)
       at its current tower position until mouseleave. */
    function applyHover(card) {
      const i = cards.indexOf(card);
      const p = place(i, lastProgress);
      card.style.transition = 'transform .4s cubic-bezier(.16,1,.3,1), opacity .3s ease';
      card.style.transform =
        `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) rotateY(0deg) scale(1.0)`;
      card.style.opacity = '1';
      card.style.zIndex = '200';
      card.style.pointerEvents = 'auto';
      card.classList.add('helix-front', 'helix-hover');
    }

    cards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        if (stackedMode()) return;
        hoveredCard = card;
        applyHover(card);
      });
      card.addEventListener('mouseleave', () => {
        if (stackedMode()) return;
        if (hoveredCard === card) hoveredCard = null;
        card.classList.remove('helix-hover');
        setTimeout(() => { if (card !== hoveredCard) card.style.transition = ''; }, 400);
        position(lastProgress);
      });
    });

    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        if (stackedMode()) return;
        const rect = outer.getBoundingClientRect();
        const total = outer.offsetHeight - window.innerHeight;
        const scrolled = Math.min(Math.max(-rect.top, 0), total);
        const progress = total > 0 ? scrolled / total : 0;
        position(progress);
      });
    }

    function setup() {
      if (stackedMode()) {
        outer.classList.add('helix-stacked');
        clearInline();
      } else {
        outer.classList.remove('helix-stacked');
        onScroll();
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    let helixResizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(helixResizeTimer);
      helixResizeTimer = setTimeout(setup, 200);
    });
    setup();
  })();

})();
