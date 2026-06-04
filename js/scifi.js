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

  /* ── Particle class ─────────────────────────────────────── */
  function rand(a, b) { return a + Math.random() * (b - a); }

  class Particle {
    constructor(type) {
      this.type = type;   // 'star' | 'drift' | 'bright'
      this.reset(true);
    }

    reset(init) {
      this.x  = rand(0, W);
      this.y  = init ? rand(0, H) : (Math.random() > 0.5 ? -10 : H + 10);
      this.vx = rand(-0.08, 0.08);
      this.vy = rand(-0.06, 0.12);

      if (this.type === 'star') {
        this.r = rand(0.5, 1.2);
        this.alpha = rand(0.3, 0.8);
        this.twinkle = rand(0.005, 0.018);
        this.twinkleDir = 1;
      } else if (this.type === 'drift') {
        this.r = rand(1.2, 2.2);
        this.alpha = rand(0.25, 0.55);
        this.vx = rand(-0.12, 0.12);
        this.vy = rand(-0.08, 0.08);
      } else {
        this.r = rand(2, 4);
        this.alpha = rand(0.4, 0.7);
        this.vx = rand(-0.06, 0.06);
        this.vy = rand(-0.04, 0.04);
        this.pulseSpeed = rand(0.012, 0.025);
        this.pulsePhase = rand(0, Math.PI * 2);
      }
    }

    update(i) {
      /* Repel from mouse */
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const repelR = this.type === 'star' ? 60 : 90;
      if (dist < repelR && dist > 0) {
        const force = (repelR - dist) / repelR;
        this.x += (dx / dist) * force * 1.2;
        this.y += (dy / dist) * force * 1.2;
      }

      this.x += this.vx;
      this.y += this.vy;

      /* Twinkle for stars */
      if (this.type === 'star') {
        this.alpha += this.twinkle * this.twinkleDir;
        if (this.alpha > 0.8 || this.alpha < 0.2) this.twinkleDir *= -1;
      }

      /* Wrap / reset */
      if (this.x < -10) this.x = W + 10;
      if (this.x > W + 10) this.x = -10;
      if (this.y < -10) this.y = H + 10;
      if (this.y > H + 10) this.y = -10;
    }

    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;

      if (this.type === 'star') {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = '#c8e8ff';
        ctx.fill();
      } else if (this.type === 'drift') {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = '#00d4ff';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#00d4ff';
        ctx.fill();
      } else {
        const pulse = 0.7 + 0.3 * Math.sin(tick * this.pulseSpeed + this.pulsePhase);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r * pulse, 0, Math.PI * 2);
        ctx.fillStyle = '#8b5cf6';
        ctx.shadowBlur = 16;
        ctx.shadowColor = '#8b5cf6';
        ctx.fill();
      }

      ctx.restore();
    }
  }

  function buildParticles() {
    particles = [];
    const starCount   = Math.min(140, Math.floor(W * H / 12000));
    const driftCount  = Math.min(50,  Math.floor(W * H / 20000));
    const brightCount = Math.min(20,  Math.floor(W * H / 40000));

    for (let i = 0; i < starCount;   i++) particles.push(new Particle('star'));
    for (let i = 0; i < driftCount;  i++) particles.push(new Particle('drift'));
    for (let i = 0; i < brightCount; i++) particles.push(new Particle('bright'));
  }

  function drawConnections() {
    const driftAndBright = particles.filter(p => p.type !== 'star');
    for (let i = 0; i < driftAndBright.length; i++) {
      for (let j = i + 1; j < driftAndBright.length; j++) {
        const a = driftAndBright[i], b = driftAndBright[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxD = 110;
        if (dist < maxD) {
          const alpha = (1 - dist / maxD) * 0.25;
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = '#00d4ff';
          ctx.lineWidth = 0.6;
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }

  function drawNebula() {
    const cx = W * 0.72, cy = H * 0.35;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.28);
    g.addColorStop(0,   'rgba(139,92,246,0.04)');
    g.addColorStop(0.5, 'rgba(0,212,255,0.02)');
    g.addColorStop(1,   'transparent');
    ctx.save();
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  function animate() {
    tick++;
    ctx.clearRect(0, 0, W, H);
    drawNebula();
    drawConnections();
    particles.forEach((p, i) => { p.update(i); p.draw(); });
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
    const CYAN = '#00d4ff';
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
      c.fillStyle = 'rgba(2,6,22,0.9)';
      c.fillRect(0, 0, W, H);

      /* edges */
      edges.forEach(([i, j]) => {
        const a = nodes[i], b = nodes[j];
        const alpha = 0.08 + 0.06 * Math.sin(t * 0.8 + i);
        c.beginPath();
        c.moveTo(a.x, a.y);
        c.lineTo(b.x, b.y);
        c.strokeStyle = `rgba(0,212,255,${alpha})`;
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
    const PURPLE = '#8b5cf6', CYAN = '#00d4ff';
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
      c.fillStyle = 'rgba(2,6,22,0.9)';
      c.fillRect(0, 0, W, H);

      /* orbit lines */
      for (let i = 0; i < N; i++) {
        const angle = (i / N) * Math.PI * 2;
        const ax = cx + orbitR * Math.cos(angle), ay = cy + orbitR * Math.sin(angle);
        c.beginPath(); c.moveTo(cx, cy); c.lineTo(ax, ay);
        c.strokeStyle = 'rgba(139,92,246,0.15)'; c.lineWidth = 0.8; c.stroke();
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
        c.fillStyle = 'rgba(139,92,246,0.25)';
        c.strokeStyle = PURPLE; c.lineWidth = 1.2;
        c.shadowBlur = 10; c.shadowColor = PURPLE;
        c.fill(); c.stroke(); c.shadowBlur = 0;
      }

      /* hub */
      const hubPulse = 1 + 0.12 * Math.sin(t * 2.5);
      c.beginPath(); c.arc(cx, cy, hubR * hubPulse, 0, Math.PI * 2);
      c.fillStyle = 'rgba(0,212,255,0.18)'; c.strokeStyle = CYAN;
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
      c.fillStyle = 'rgba(2,6,22,0.9)';
      c.fillRect(0, 0, W, H);

      /* concentric rings */
      [0.33, 0.66, 1].forEach(f => {
        c.beginPath(); c.arc(cx, cy, maxR * f, 0, Math.PI * 2);
        c.strokeStyle = `rgba(0,212,255,${0.06 + f * 0.06})`; c.lineWidth = 0.8; c.stroke();
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
      g.addColorStop(0,   'rgba(0,212,255,0.55)');
      g.addColorStop(0.4, 'rgba(0,212,255,0.12)');
      g.addColorStop(1,   'transparent');
      c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, maxR, -0.4, 0); c.closePath();
      c.fillStyle = g; c.fill();
      c.restore();

      /* crosshairs */
      const lw = 0.6, la = 0.15;
      [[cx, cy - maxR, cx, cy + maxR], [cx - maxR, cy, cx + maxR, cy]].forEach(([x1,y1,x2,y2]) => {
        c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2);
        c.strokeStyle = `rgba(0,212,255,${la})`; c.lineWidth = lw; c.stroke();
      });

      /* scanning dot on sweep edge */
      const dotX = cx + maxR * Math.cos(sweepAngle);
      const dotY = cy + maxR * Math.sin(sweepAngle);
      c.beginPath(); c.arc(dotX, dotY, 3, 0, Math.PI * 2);
      c.fillStyle = '#00d4ff'; c.shadowBlur = 12; c.shadowColor = '#00d4ff';
      c.fill(); c.shadowBlur = 0;

      /* heartbeat line at bottom */
      const lineY = H - 22, lx0 = 20;
      c.beginPath(); c.moveTo(lx0, lineY);
      for (let x = 0; x <= W - 40; x += 2) {
        const xr = x / (W - 40);
        const spike = Math.exp(-Math.pow(((xr - ((t * 0.3) % 1)) * 3), 2) * 20) * 18;
        c.lineTo(lx0 + x, lineY - spike);
      }
      c.strokeStyle = 'rgba(240,171,252,0.5)'; c.lineWidth = 1.2; c.stroke();

      requestAnimationFrame(frame);
    }
    frame();
  }

  /* Bar chart (Credit Risk) */
  function animBars(c, W, H) {
    const AMBER = '#fbbf24', CYAN = '#00d4ff';
    const heights = [0.88, 0.76, 0.65, 0.55, 0.45, 0.36, 0.28, 0.21, 0.15, 0.10];
    const n = heights.length;
    const barW = Math.floor((W - 48) / n) - 4;
    let t = 0, progress = 0;

    function frame() {
      t += 0.018;
      progress = Math.min(progress + 0.016, 1);
      c.clearRect(0, 0, W, H);
      c.fillStyle = 'rgba(2,6,22,0.9)';
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
      c.strokeStyle = 'rgba(0,212,255,0.3)'; c.lineWidth = 1; c.setLineDash([3,4]); c.stroke(); c.setLineDash([]);

      /* bars */
      heights.forEach((h, i) => {
        const x = 24 + i * (barW + 4);
        const bh = h * maxBarH * progress;
        const y = baseY - bh;

        const g = c.createLinearGradient(x, y, x, baseY);
        g.addColorStop(0, AMBER);
        g.addColorStop(1, 'rgba(251,191,36,0.15)');
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
    const CYAN = '#00d4ff', PURPLE = '#8b5cf6';
    const cols = 7, rows = 5;
    const cw = (W - 24) / cols, ch = (H - 16) / rows;
    let t = 0;
    const phases = Array.from({ length: cols * rows }, () => Math.random() * Math.PI * 2);

    function frame() {
      t += 0.025;
      c.clearRect(0, 0, W, H);
      c.fillStyle = 'rgba(2,6,22,0.9)';
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

    const TURNS = 1.7;        // how many rotations across the full scroll
    const n = cards.length;

    function position(progress) {
      const W = stage.clientWidth;
      const H = stage.clientHeight;
      const cx = W / 2;
      const amp = Math.min(W * 0.26, 320);   // horizontal swing of the helix
      const topPad = H * 0.20;
      const usableH = H * 0.60;
      const phase = progress * Math.PI * 2 * TURNS;

      cards.forEach((card, i) => {
        const frac = n > 1 ? i / (n - 1) : 0.5;     // 0 (top) .. 1 (bottom)
        const theta = frac * Math.PI * 2 + phase;   // one helix turn across column
        const depth = (Math.cos(theta) + 1) / 2;    // 0 back .. 1 front

        const scale = 0.55 + depth * 0.45;
        const opacity = 0.22 + depth * 0.78;
        const cw = card.offsetWidth || 320;
        const ch = card.offsetHeight || 320;
        const x = cx + Math.sin(theta) * amp - cw / 2;
        const y = topPad + frac * usableH - ch / 2;

        card.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${scale.toFixed(3)})`;
        card.style.opacity = opacity.toFixed(3);
        card.style.zIndex = String(Math.round(depth * 100));
        card.classList.toggle('helix-front', depth > 0.82);
      });
    }

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
