# Plan: DNA Helix Carousel + Creative Portfolio Redesign (v2)

## Context
The `scifi-redesign` branch has a solid dark holographic aesthetic but still uses conventional grid layouts. Two new assets are now available that upgrade the original plan significantly:

1. **Magic MCP (21st.dev)** — real component code from 21st.dev's registry, searchable via MCP tools. ⚠️ Requires session restart to activate. Plan is to use it for aurora background, glassmorphism card effects, and animated borders sourced from actual components rather than manually ported.
2. **Remotion skill** — `@remotion/three` + React Three Fiber support means the DNA helix can be rendered as a **cinema-quality looping WebM video** rather than a Canvas 2D approximation. The rendered file embeds as a `<video>` background — no React conversion needed for the portfolio itself.

User answers from prior session:
- Portrait → "Replace with abstract self" (no headshot, Unsplash abstract bg)
- Helix default → "All 5 visible in helix shape" (no active state until hover/scroll)
- Card images → "Keep animated mini-canvases"

---

## What Changes vs. v1

| Section | v1 Approach | v2 Upgrade |
|---------|-------------|------------|
| DNA Helix strands | Canvas 2D sine wave | **Remotion + Three.js** → rendered WebM video background |
| 21st.dev components | Manually ported Aceternity patterns | **Magic MCP** pulls real component code (aurora, border, cards) |
| Hero background | Unsplash image + CSS aurora | Unsplash + **Magic MCP aurora component** |
| Card borders | CSS `@property --angle` hand-coded | **Magic MCP moving-border component** |

---

## Files Created / Modified

| Path | Action | Purpose |
|------|--------|---------|
| `remotion-helix/` | **Create new** | Remotion sub-project for helix video |
| `remotion-helix/src/HelixComposition.tsx` | Create | Three.js DNA helix animation |
| `remotion-helix/src/Root.tsx` | Create | Remotion composition registration |
| `assets/video/helix-loop.webm` | **Rendered output** | The video embedded in the portfolio |
| `index.html` | Modify | New hero, video-based helix section, no portrait |
| `assets/css/scifi.css` | Modify | Video container, aurora, hud-corners, metric stagger |
| `js/scifi.js` | Modify | Remove Canvas helix code, keep particle system + card tilt |

---

## Phase 1: Remotion Helix Video

### Setup

```bash
cd remotion-helix
npx create-video@latest --yes --blank --no-tailwind .
npx remotion add @remotion/three
npm install @react-three/fiber three @types/three
```

### `src/HelixComposition.tsx`

Key animation parameters:
- **Duration**: 180 frames at 30fps = 6-second seamless loop
- **Resolution**: 1920×1080 (scaled down on embed)
- **Background**: `#030208` (matches `--bg`)
- Two intertwining helical strands in Three.js tube geometry
- Cyan strand (`#00d4ff`) + purple strand (`#8b5cf6`)
- 5 glowing node spheres at base-pair positions (one per project)
- Connecting rungs rendered as `CylinderGeometry`
- Camera: slight orbital rotation over the 6 seconds
- Glow: `@react-three/postprocessing` Bloom effect

```tsx
import { ThreeCanvas } from "@remotion/three";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import * as THREE from "three";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber"; // FORBIDDEN — drive via useCurrentFrame instead

export const HelixComposition = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const { width, height } = useVideoConfig();
  
  // Loop progress 0→1→0 for seamless loop
  const t = interpolate(frame, [0, durationInFrames], [0, Math.PI * 2], {
    extrapolateRight: "clamp",
  });

  return (
    <ThreeCanvas width={width} height={height}>
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 0, 5]} intensity={1.5} color="#00d4ff" />
      <pointLight position={[0, 0, -5]} intensity={1} color="#8b5cf6" />
      <HelixStrands rotationY={t} />
      {/* 5 project nodes */}
      {[0,1,2,3,4].map(i => <HelixNode key={i} index={i} totalNodes={5} rotationY={t} />)}
    </ThreeCanvas>
  );
};
```

**Helix geometry approach:**
- Use `THREE.TubeGeometry` with a `THREE.CatmullRomCurve3` path
- Compute path points: for each t ∈ [0, 2π×3], x=R·cos(t), z=R·sin(t), y=t·step
- Render two tubes offset by π radians
- Add `THREE.CylinderGeometry` rungs at each node position
- Node spheres: `THREE.SphereGeometry` with emissive glow material

### Render command

```bash
cd remotion-helix
npx remotion render HelixComposition out/helix-loop.webm \
  --codec webm --fps 30 --frames 0-179 \
  --width 1920 --height 1080 --jpeg-quality 90
cp out/helix-loop.webm ../assets/video/helix-loop.webm
```

---

## Phase 2: Magic MCP Components

⚠️ **Requires session restart** for Magic MCP to be active.

Once active, use MCP tool to search and pull:

```
Search: "aurora background dark gradient animated"
→ Pull aurora component CSS/JS → adapt for .aurora-layer

Search: "moving border conic gradient animated card"  
→ Pull moving-border component → adapt for .helix-front::before

Search: "glassmorphism card dark neon border"
→ Pull glassmorphism card → compare with existing .glass-card, enhance
```

If Magic MCP is not yet active when implementing: fall back to the v1 manual CSS patterns (already well-defined in the original plan — `@property --angle`, `conic-gradient`, etc.).

---

## Phase 3: HTML/CSS/JS Updates

### Hero (no portrait)

```html
<section class="hero-section">
  <div class="aurora-layer" aria-hidden="true"></div>
  
  <!-- HUD corner readouts -->
  <div class="hud-corner hud-corner--tl" aria-hidden="true">
    <div>LAT 32.7767° N</div>
    <div>LON 96.7970° W</div>
    <div id="hud-time" class="mono">--:--:-- UTC</div>
  </div>
  <div class="hud-corner hud-corner--tr" aria-hidden="true">
    <div>VOL.04 · 2026</div>
    <div>BUILD ACTIVE</div>
  </div>

  <!-- Centered content -->
  <div class="hero-content hero-content--centered">
    <div class="hero-eyebrow mono">↳ PORTFOLIO · VOL.04 · 2026</div>
    <h1 class="hero-title hero-glitch">
      Building <em>AI powered</em> systems that compound...
    </h1>
    <div class="hero-status glass-card">...</div>
    <a href="#work" class="hud-btn">INITIALIZE SYSTEMS →</a>
  </div>
</section>
```

**JS**: `setInterval` updates `#hud-time` with live UTC clock.

### Helix section (video background + card overlay)

```html
<section class="helix-outer" id="work">
  <div class="helix-sticky">
    
    <!-- Video replaces Canvas helix drawing -->
    <video class="helix-video" autoplay loop muted playsinline aria-hidden="true">
      <source src="/assets/video/helix-loop.webm" type="video/webm">
    </video>
    
    <!-- Particle canvas still runs on top for depth -->
    <!-- (particle canvas is already fixed/fullscreen - no change needed) -->

    <div class="helix-header">
      <div class="section-tag mono">§ 01 · SELECTED WORK</div>
      <div class="helix-hint mono">↕ SCROLL TO ROTATE</div>
    </div>

    <div class="helix-stage" id="helix-stage">
      <!-- 5 .helix-card elements, same glass-card structure -->
    </div>
  </div>
</section>
```

```css
.helix-outer  { height: 600vh; position: relative; }
.helix-sticky { position: sticky; top: 0; height: 100vh; overflow: hidden; }

.helix-video {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  object-fit: cover;
  opacity: 0.55;            /* blend with particle canvas */
  mix-blend-mode: screen;   /* glows composite naturally over dark bg */
  z-index: 2;
  pointer-events: none;
}
```

**JS** (`positionHelixCards` stays unchanged) — scroll still drives card positions using the same parametric math as v1. The video provides the visual helix strands; JS positions the cards on top.

### Metrics — staggered depth (unchanged from v1)

```css
.metrics-grid { perspective: 800px; }
.metric-card:nth-child(1) { transform: translateY(0px)   rotateX(2deg); }
.metric-card:nth-child(2) { transform: translateY(12px)  rotateX(-1deg); }
.metric-card:nth-child(3) { transform: translateY(-8px)  rotateX(2deg); }
.metric-card:nth-child(4) { transform: translateY(18px)  rotateX(-2deg); }
```

### About — generative art canvas (unchanged from v1)

Left column: `<canvas class="about-art-canvas">` drawing neural/network pattern.

---

## Implementation Order

1. **Remotion sub-project** → scaffold project → write helix Three.js composition → render → copy WebM to `assets/video/`
2. **Magic MCP** → (after session restart) search and pull aurora + moving-border components
3. **CSS** → aurora-layer, hud-corners, helix-video, hero-centered, metric stagger
4. **HTML** → hero restructure, helix section with `<video>`, about art canvas
5. **JS** → remove old canvas helix draw functions, add UTC clock, keep `positionHelixCards`

---

## Fallback

If Remotion render fails or takes too long (>10min):
- Fall back to Canvas 2D helix from v1 plan (fully specified, ready to implement)
- Mark Remotion video as a future enhancement

---

## Verification

```python
# Re-run /tmp/scifi-verify.py with additional checks:
# - helix-video element present + playing
# - helix-stage has 5 .helix-card elements
# - scroll to 30% of helix-outer → cards have shifted position
# - hud-corner elements visible with live clock
# - aurora-layer visible
# - 0 JS console errors
```
