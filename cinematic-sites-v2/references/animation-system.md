# Animation System

One consistent way to create and import every animation, whether it comes from the module
library or you build it from scratch with GSAP.

## The library (read from disk — no server)

The 30 cinematic modules live in the `cinematic-site-components/` folder as self-contained
vanilla HTML + GSAP files. Canonical path:
`/Users/cex/Documents/Skills/cinematic-sites-agent-v2/cinematic-site-components/` (it sits beside
this skill in the source repo). **Read the module files directly from disk** — there is no
localhost server and no port to ask for. Module slugs match filenames, e.g. `text-mask`,
`spotlight-border`, `kinetic-marquee` → `cinematic-site-components/text-mask.html`.

## Canonical port recipe

Each module becomes one **typed client component** at
`components/animations/<ModuleName>/<ModuleName>.tsx`, following
`component-templates/AnimationModule.template.tsx`:

1. `'use client'` at the top.
2. One `useRef` per element the vanilla module reached via `document.querySelector`.
3. The module's JS goes inside `useEffect` → `gsap.context(fn, rootRef)` →
   `return () => ctx.revert()`.
4. Hex colors → Tailwind tokens; `var(--accent)` → `var(--color-accent)`.
5. Wrap desktop-only heavy motion in `gsap.matchMedia()`; provide a simplified mobile branch.
6. Typed props with explicit defaults.

Vanilla → React mapping:
- `document.querySelector('.x')` → `useRef` + ref on the element.
- `classList.add/remove` → React state or `gsap.set`.
- `addEventListener` → inside `useEffect`, removed in the cleanup return.
- inline `<style>`/CSS → Tailwind classes (or a scoped `<style>` inside the component).

## Import convention (consistency rule)

- Ported animations are imported from `@/components/animations/<Name>/<Name>`.
- GSAP and its plugins are imported **only** from `@/lib/gsap` — never from `'gsap'` directly.
- Custom animations you write yourself use the **same** template shape, so the codebase stays
  uniform regardless of where the animation came from.

## Module selection by industry

| Industry | Recommended modules |
|----------|--------------------|
| Luxury (jewelry, watches, perfume) | Text Mask Reveal, Curtain Reveal, Spotlight Border Cards, Zoom Parallax |
| Food (pizza, bakery, sushi, chocolate) | Color Shift, Zoom Parallax, Kinetic Marquee, Accordion Slider |
| Tech (keyboard, camera, laptop, SaaS) | Glitch Effect, Text Scramble, Magnetic Grid, 3D Flip Cards |
| Creative (florist, architecture, music) | SVG Draw, Image Trail, Mesh Gradient, Curtain Reveal |
| Service (cleaning, moving, consulting) | Odometer Counter, Sticky Stack, Particle Button, Kinetic Marquee |
| Furniture / Interior | Text Mask Reveal, Odometer Counter, Sticky Stack, Spotlight Border Cards, Kinetic Marquee |
| Portfolio / Agency | Accordion Slider, Cursor-Reactive, Zoom Parallax, Horizontal Scroll |

## Full module reference (30)

**Scroll-Driven (9):** `text-mask` (headline fills on scroll), `sticky-stack` (pinned visual,
features scroll past), `zoom-parallax` (depth layers, foreground zooms), `horizontal-scroll`
(vertical → horizontal gallery), `sticky-cards` (cards pin and stack), `svg-draw` (lines draw on
scroll), `curtain-reveal` (hero splits open), `split-scroll` (halves scroll opposite),
`color-shift` (background changes per section).

**Cursor & Hover (8):** `cursor-reactive` (glow + 3D tilt + magnetic buttons + ripples),
`accordion-slider` (strips expand on hover), `cursor-reveal` (before/after wipe), `image-trail`
(cursor leaves image ghosts), `flip-cards` (3D card flip), `magnetic-grid` (tiles repel cursor),
`spotlight-border` (borders illuminate under cursor), `drag-pan` (infinite draggable canvas).

**Click & Tap (6):** `view-transitions` (elements morph between states), `particle-button`
(CTA bursts on click), `odometer` (digit wheels roll to target), `coverflow` (3D carousel),
`dynamic-island` (pill morphs for notifications), `dock-nav` (macOS dock magnify).

**Ambient & Auto (7):** `text-scramble` (Matrix decode), `kinetic-marquee` (infinite text bands,
scroll-reactive), `mesh-gradient` (animated color blobs), `circular-text` (text on spinning
circle), `glitch-effect` (RGB channel split), `typewriter` (text types itself), `gradient-stroke`
(animated gradient on outlined text).

## Key implementation snippets (porting references)

**3D tilt + spotlight (from cursor-reactive):**
```js
const x = (e.clientX - rect.left) / rect.width - 0.5
const y = (e.clientY - rect.top) / rect.height - 0.5
card.style.transform = `perspective(600px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) scale(1.02)`
```

**Magnetic button:**
```js
btn.style.transform = `translate(${(e.clientX - cx) * 0.3}px, ${(e.clientY - cy) * 0.3}px)`
// reset to translate(0,0) on mouseleave
```

**Cursor glow (lerp follow):**
```js
gx += (mx - gx) * 0.12; gy += (my - gy) * 0.12
glow.style.transform = `translate(${gx - 250}px, ${gy - 250}px)`
requestAnimationFrame(moveGlow)
```

**Spotlight border cards:**
```css
.spot-card::before {
  content: ''; position: absolute; inset: -1px; opacity: 0; transition: opacity .3s;
  background: radial-gradient(circle 180px at var(--mx,50%) var(--my,50%), var(--color-accent), transparent);
}
.spot-card:hover::before { opacity: 1; }
```

**Text mask reveal:**
```js
gsap.to('.mask-reveal', { clipPath: 'inset(0% 0 0 0)', ease: 'none',
  scrollTrigger: { trigger: section, start: 'top top', end: '60% bottom', scrub: 0.3 } })
```

**Kinetic marquee:** clone `.marquee-content` for a seamless loop; track ScrollTrigger velocity
and add it to a base speed in a `requestAnimationFrame` loop.

**Zoom parallax:** 3 depth layers — bg (scale 1→1.15), mid (scale 1→1.6, y −100), fg (scale
1→6, opacity→0); product card fades in at 40–60% scroll, out at 75–90%.

**Odometer:** build 0–9 digit strips, `translateY` to `target * stripHeight` with a staggered
`transitionDelay` per digit, triggered once via ScrollTrigger.

## One easing curve

Use `cubic-bezier(.16, 1, .3, 1)` for all interactive transitions across the site.
