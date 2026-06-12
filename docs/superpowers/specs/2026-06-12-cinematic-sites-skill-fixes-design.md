# Cinematic Sites v2 — Skill Fixes Design

**Date:** 2026-06-12  
**Scope:** Fix 5 critical bugs + 3 robustness improvements identified by devil red-team  
**File to edit:** `cinematic-sites-v2/SKILL.md`

---

## Context

The cinematic-sites skill generates React + Vite + Tailwind CSS v4 sites with scroll-driven canvas hero animations and AI-generated video. A devil red-team identified 5 critical failures that break the skill for most users.

---

## Fix 1 — ScrollTrigger global kill (critical)

**Location:** `HeroCanvas.jsx` cleanup block (line ~612 in SKILL.md)

**Problem:** `ScrollTrigger.getAll().forEach(t => t.kill())` kills every ScrollTrigger on the page — Services fade, About reveal, all of them — whenever HeroCanvas unmounts (HMR, React Strict Mode double-mount, route change).

**Fix:** Remove that line entirely. The specific tweens (`tween` and `textFade`) are already killed individually on the lines above it. The `getAll` call is redundant and destructive.

```js
// REMOVE this line from the cleanup:
ScrollTrigger.getAll().forEach(t => t.kill())

// Keep only:
tween.kill()
textFade.kill()
window.removeEventListener('resize', resize)
```

---

## Fix 2 — Progressive frame loading (critical)

**Location:** `HeroCanvas.jsx` preload loop

**Problem:** All 121 frames (~40-60MB) must finish downloading before anything renders. On a 10Mbps connection that's 30-50 seconds of blank page.

**Fix:** 
- Canvas fades in (`opacity 0→1`) as soon as frame 0 loads (already triggered by `if (loaded === 1) drawFrame(0)`, just needs the fade-in added)
- Add a loading progress bar: a `<div>` overlay that tracks `loaded/totalFrames` and shrinks as frames load, disappearing when all are ready
- The hero is never a blank page — frame 0 appears immediately, remaining frames load in background

**Progress bar structure:**
```jsx
<div ref={loaderRef} className="absolute inset-0 z-10 flex flex-col items-center justify-end pb-8 gap-2">
  <div className="w-48 h-px bg-text/20 overflow-hidden">
    <div ref={progressRef} className="h-full bg-accent transition-all duration-200" style={{ width: '0%' }} />
  </div>
</div>
```

Progress updates on each frame load: `progressRef.current.style.width = (loaded / totalFrames * 100) + '%'`  
Loader hides when `loaded === totalFrames`.

---

## Fix 3 — SplitText → free manual split (critical)

**Location:** `src/lib/gsap.js` and `HeroText.jsx`

**Problem:** `SplitText` is a paid GSAP Club plugin (~$150/yr). `npm install gsap` does not include it. Anyone following setup sees `SplitText is not a constructor` at runtime. Setup docs never mention this.

**Fix:** Replace with `splitChars(el)` — a 10-line vanilla JS function that wraps each character in an `inline-block` span. Animate the spans with standard GSAP. Same visual result, zero cost.

```js
function splitChars(el) {
  const text = el.textContent
  el.textContent = ''
  return [...text].map(char => {
    const span = document.createElement('span')
    span.textContent = char === ' ' ? ' ' : char
    span.style.display = 'inline-block'
    el.appendChild(span)
    return span
  })
}
```

Usage in `HeroText.jsx`:
```js
useEffect(() => {
  const ctx = gsap.context(() => {
    const chars = splitChars(titleRef.current)
    gsap.fromTo(chars,
      { y: -60, opacity: 0, rotationX: -90 },
      { y: 0, opacity: 1, rotationX: 0, duration: 0.5, stagger: 0.02, ease: 'back.out(1.4)',
        clearProps: 'all' }
    )
  }, containerRef)
  return () => ctx.revert()
}, [])
```

Remove `SplitText` from `gsap.js` imports and `gsap.registerPlugin()` call.

---

## Fix 4 — Nav.jsx implementation (critical)

**Location:** Referenced in `App.jsx` but never defined in the skill

**Problem:** The skill imports `Nav` everywhere but never provides the component code. Every user has to invent it.

**Fix:** Add complete `Nav.jsx` to the skill. Spec:

- **Desktop:** logo left, nav links right (`hidden md:flex`), min-height 44px links
- **Mobile:** logo + hamburger button (`md:hidden`), dropdown menu with links in vertical stack
- **Scroll-aware:** transparent background at top → `rgba(primary, 0.85)` + `backdrop-filter: blur(12px)` after scrolling past 50px. Detected via `scroll` event listener with cleanup.
- **Auto-close:** menu closes on link click and on `Escape` keydown
- **State:** `useState` for `isOpen` (menu) and `scrolled` (background), single `useEffect` for scroll listener

Nav links come from a `NAV_LINKS` constant defined outside the component (same pattern as Services). The actual links are filled from the brand analysis in Step 1.

---

## Fix 5 — Section planning step (critical)

**Location:** Beginning of Step 3 in the skill

**Problem:** The skill always generates the same 7-section template (Nav → Hero → Services → Gallery → About → Booking → Footer) regardless of what business the target site is. A law firm and a restaurant get the same skeleton.

**Fix:** Add **Step 3a: Section Planning** before scaffolding. Using the brand data from Step 1, the skill:

1. Identifies the business category (restaurant, spa, studio, SaaS, etc.)
2. Proposes a section list tailored to that category with a rationale
3. Asks the user to approve or adjust before writing any code

**Example proposals:**
- Barbershop: `[Nav, Hero, Services, Gallery, About, Booking, Footer]`
- SaaS: `[Nav, Hero, Features, Pricing, Testimonials, CTA, Footer]`
- Restaurant: `[Nav, Hero, Menu, About, Reservations, Location, Footer]`
- Photography studio: `[Nav, Hero, Portfolio, Services, Process, Contact, Footer]`

The approved section list drives what components get generated in Step 3.

---

## Fix 6 — Canvas fade-in (robustness)

**Location:** `HeroCanvas.jsx`, frame 0 load handler

**Problem:** Canvas has `style={{ opacity: 0 }}` but opacity never changes — the hero appears as a sudden pop when frame 0 loads.

**Fix:** After `drawFrame(0)`, animate opacity in:
```js
if (loaded === 1) {
  drawFrame(0)
  gsap.to(canvas, { opacity: 1, duration: 0.6, ease: 'power2.out' })
}
```

---

## Fix 7 — Loader hides on first frame, not last (robustness)

**Location:** `HeroCanvas.jsx`, loader hide logic

**Problem:** Loader currently hides only when `loaded === totalFrames`. With Fix 2, the canvas is visible from frame 0, so the loader should disappear when the canvas fades in — not after all frames download.

**Fix:** Hide loader when `loaded === 1` (together with the canvas fade-in). Keep the progress bar showing background load status separately so the user knows loading is ongoing.

---

## Fix 8 — Guard against unreplaced FRAME_COUNT (robustness)

**Location:** `HeroCanvas.jsx`, top of `useEffect`

**Problem:** If the user copies the component without replacing the `FRAME_COUNT` placeholder, the loop runs 0 iterations silently. Canvas stays black with no error.

**Fix:** Add explicit guard at the top of the useEffect:
```js
const totalFrames = FRAME_COUNT
if (!Number.isFinite(totalFrames) || totalFrames < 1) {
  console.error('[HeroCanvas] FRAME_COUNT not set. Run ffmpeg, count frames with: ls public/assets/frames/ | wc -l, then replace FRAME_COUNT.')
  return
}
```

---

## Summary of changes to SKILL.md

| Fix | Location in SKILL.md | Type |
|-----|----------------------|------|
| 1. Remove ScrollTrigger.getAll() | HeroCanvas.jsx cleanup | Delete 1 line |
| 2. Progressive frame loading | HeroCanvas.jsx preload loop | Rewrite preload + add progress bar JSX |
| 3. Replace SplitText | gsap.js + HeroText.jsx | Replace import + add splitChars fn |
| 4. Add Nav.jsx | Step 3 component patterns | Add ~70 lines of new component code |
| 5. Add section planning | Step 3 intro | Add Step 3a with examples |
| 6. Canvas fade-in | HeroCanvas.jsx frame 0 handler | Add 1 gsap.to() call |
| 7. Loader hide timing | HeroCanvas.jsx loader logic | Move hide to loaded===1 |
| 8. FRAME_COUNT guard | HeroCanvas.jsx useEffect top | Add 4-line guard |

---

## Out of scope

- Changing the overall 4-step flow (brand → video → build → deploy)
- Adding new AI models or APIs
- Restructuring existing sections (Services, Gallery, About, etc.)
- Three.js integration changes
