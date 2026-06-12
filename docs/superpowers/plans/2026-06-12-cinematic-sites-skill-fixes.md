# Cinematic Sites v2 — Skill Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 8 bugs in `cinematic-sites-v2/SKILL.md` so the skill reliably produces cinematic, premium-looking sites without breaking for new users.

**Architecture:** All changes are edits to a single markdown file (`SKILL.md`). Each task targets one section of that file. Tasks are independent and can be done in any order, but Tasks 1–6 touch `HeroCanvas.jsx` code so do those before Task 7 to avoid re-reading the file repeatedly.

**Tech Stack:** SKILL.md (markdown with embedded JSX/JS code blocks), React, GSAP (free tier only after fixes), Tailwind CSS v4.

**Spec:** `docs/superpowers/specs/2026-06-12-cinematic-sites-skill-fixes-design.md`

---

## File Map

| File | Action | What changes |
|------|--------|-------------|
| `cinematic-sites-v2/SKILL.md` | Modify | All 8 fixes — see tasks below |

---

## Task 1: Remove destructive ScrollTrigger.getAll() kill

**Files:**
- Modify: `cinematic-sites-v2/SKILL.md` (HeroCanvas cleanup block, around line 608–613)

- [ ] **Step 1: Locate and delete the offending line**

Find this block in SKILL.md:

```js
    return () => {
      window.removeEventListener('resize', resize)
      tween.kill()
      textFade.kill()
      ScrollTrigger.getAll().forEach(t => t.kill())
    }
```

Replace with:

```js
    return () => {
      window.removeEventListener('resize', resize)
      tween.kill()
      textFade.kill()
    }
```

- [ ] **Step 2: Verify**

Search the file for `ScrollTrigger.getAll()` — it must return zero matches:
```bash
grep -n "ScrollTrigger.getAll" cinematic-sites-v2/SKILL.md
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add cinematic-sites-v2/SKILL.md
git commit -m "fix: remove ScrollTrigger.getAll kill from HeroCanvas cleanup"
```

---

## Task 2: Replace SplitText with free manual split

**Files:**
- Modify: `cinematic-sites-v2/SKILL.md` (gsap.js block + HeroText.jsx block)

- [ ] **Step 1: Fix gsap.js — remove SplitText import**

Find:
```js
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(ScrollTrigger, SplitText)

export { gsap, ScrollTrigger, SplitText }
```

Replace with:
```js
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export { gsap, ScrollTrigger }
```

- [ ] **Step 2: Fix HeroText.jsx — remove SplitText import**

Find:
```js
import { gsap, SplitText } from '../../lib/gsap'
```

Replace with:
```js
import { gsap } from '../../lib/gsap'
```

- [ ] **Step 3: Fix HeroText.jsx — replace SplitText usage with splitChars**

Find the entire `useEffect` block in HeroText.jsx:
```js
  useEffect(() => {
    const ctx = gsap.context(() => {
      const split = new SplitText(titleRef.current, { type: 'chars,words' })
      const tl = gsap.timeline({ delay: 0.1 })

      tl.fromTo(taglineRef.current,
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }
      )
      tl.fromTo(split.chars,
        { y: -60, opacity: 0, rotationX: -90 },
        { y: 0, opacity: 1, rotationX: 0, duration: 0.5, stagger: 0.02, ease: 'back.out(1.4)' },
        '-=0.1'
      )
      tl.fromTo(subtitleRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out' },
        '-=0.2'
      )
      tl.fromTo(buttonsRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
        '-=0.3'
      )
    }, containerRef)

    return () => ctx.revert()
  }, [])
```

Replace with:
```js
  useEffect(() => {
    const ctx = gsap.context(() => {
      const chars = splitChars(titleRef.current)
      const tl = gsap.timeline({ delay: 0.1 })

      tl.fromTo(taglineRef.current,
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }
      )
      tl.fromTo(chars,
        { y: -60, opacity: 0, rotationX: -90 },
        { y: 0, opacity: 1, rotationX: 0, duration: 0.5, stagger: 0.02, ease: 'back.out(1.4)', clearProps: 'all' },
        '-=0.1'
      )
      tl.fromTo(subtitleRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out' },
        '-=0.2'
      )
      tl.fromTo(buttonsRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
        '-=0.3'
      )
    }, containerRef)

    return () => ctx.revert()
  }, [])
```

- [ ] **Step 4: Add splitChars helper above the HeroText component**

Find the line:
```js
export default function HeroText() {
```

Insert directly above it:
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

export default function HeroText() {
```

- [ ] **Step 5: Verify SplitText is gone**

```bash
grep -n "SplitText" cinematic-sites-v2/SKILL.md
```
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add cinematic-sites-v2/SKILL.md
git commit -m "fix: replace paid SplitText with free splitChars helper"
```

---

## Task 3: Add FRAME_COUNT guard

**Files:**
- Modify: `cinematic-sites-v2/SKILL.md` (HeroCanvas useEffect, first few lines)

- [ ] **Step 1: Add guard after totalFrames declaration**

Find:
```js
    const totalFrames = FRAME_COUNT // set after ffmpeg extraction
    let loaded = 0
```

Replace with:
```js
    const totalFrames = FRAME_COUNT // replace with actual count: ls public/assets/frames/ | wc -l
    if (!Number.isFinite(totalFrames) || totalFrames < 1) {
      console.error('[HeroCanvas] FRAME_COUNT not set. Run ffmpeg, count frames: ls public/assets/frames/ | wc -l, then replace FRAME_COUNT.')
      return
    }
    let loaded = 0
```

- [ ] **Step 2: Verify**

```bash
grep -n "FRAME_COUNT" cinematic-sites-v2/SKILL.md
```
Expected: 2 matches — the declaration line and the guard condition.

- [ ] **Step 3: Commit**

```bash
git add cinematic-sites-v2/SKILL.md
git commit -m "fix: add FRAME_COUNT guard — explicit error if placeholder not replaced"
```

---

## Task 4: Fix canvas fade-in, loader hide timing, and progress bar

**Files:**
- Modify: `cinematic-sites-v2/SKILL.md` (HeroCanvas — refs, onload handler, return JSX)

- [ ] **Step 1: Add loaderRef and progressRef to the component refs**

Find the opening of HeroCanvas:
```js
export default function HeroCanvas() {
  const canvasRef = useRef(null)
```

Replace with:
```js
export default function HeroCanvas() {
  const canvasRef   = useRef(null)
  const loaderRef   = useRef(null)
  const progressRef = useRef(null)
```

- [ ] **Step 2: Replace the onload handler**

Find:
```js
      img.onload = () => {
        loaded++
        if (loaded === 1) drawFrame(0)
      }
```

Replace with:
```js
      img.onload = () => {
        loaded++
        if (loaded === 1) {
          drawFrame(0)
          gsap.to(canvas, { opacity: 1, duration: 0.6, ease: 'power2.out' })
          if (loaderRef.current) gsap.to(loaderRef.current, { opacity: 0, duration: 0.4,
            onComplete: () => { if (loaderRef.current) loaderRef.current.style.display = 'none' }
          })
        }
        if (progressRef.current) {
          progressRef.current.style.width = (loaded / totalFrames * 100) + '%'
        }
      }
```

- [ ] **Step 3: Replace the canvas return with canvas + progress bar**

Find:
```jsx
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ opacity: 0 }} />
```

Replace with:
```jsx
  return (
    <>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ opacity: 0 }} />
      <div ref={loaderRef} className="absolute inset-0 z-10 flex items-end justify-end p-8 pointer-events-none">
        <div className="w-48 h-px bg-text/20 overflow-hidden">
          <div ref={progressRef} style={{ width: '0%', height: '100%', backgroundColor: 'var(--color-accent)', transition: 'width 0.2s ease' }} />
        </div>
      </div>
    </>
  )
```

- [ ] **Step 4: Verify**

```bash
grep -n "loaderRef\|progressRef\|opacity: 1" cinematic-sites-v2/SKILL.md
```
Expected: at least 4 matches (loaderRef declaration, loaderRef usage x2, progressRef x2, opacity: 1 in fade-in).

- [ ] **Step 5: Commit**

```bash
git add cinematic-sites-v2/SKILL.md
git commit -m "fix: canvas fade-in on first frame, progress bar, loader hides immediately"
```

---

## Task 5: Add Nav.jsx component

**Files:**
- Modify: `cinematic-sites-v2/SKILL.md` (after Button.jsx section, before App Assembly section)

- [ ] **Step 1: Find the insertion point**

Locate the end of the Button section — the line right before `### App Assembly`:
```md
### App Assembly
```

- [ ] **Step 2: Insert the Nav.jsx section directly before ### App Assembly**

Insert this entire block before `### App Assembly`:

````md
### Nav Component

```jsx
// src/components/Nav/Nav.jsx
import { useState, useEffect } from 'react'

const NAV_LINKS = [
  { label: 'Servicios', href: '#services' },
  { label: 'Galería',   href: '#gallery'  },
  { label: 'Nosotros',  href: '#about'    },
  { label: 'Contacto',  href: '#booking'  },
]

export default function Nav() {
  const [isOpen,   setIsOpen]   = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setIsOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const close = () => setIsOpen(false)

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-primary/85 backdrop-blur-md border-b border-text/10' : 'bg-transparent'
    }`}>
      <div className="flex items-center justify-between px-6 md:px-12 h-16">
        {/* Logo */}
        <a href="#hero" className="text-xl font-black uppercase tracking-widest text-text">
          [Brand]
        </a>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(link => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-xs font-bold uppercase tracking-widest text-text/70 hover:text-text transition-colors min-h-[44px] flex items-center"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2 min-h-[44px] min-w-[44px] items-center justify-center"
          onClick={() => setIsOpen(o => !o)}
          aria-label="Menú"
        >
          <span className={`block w-6 h-px bg-text transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-2.5' : ''}`} />
          <span className={`block w-6 h-px bg-text transition-all duration-300 ${isOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-6 h-px bg-text transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-2.5' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-64 border-b border-text/10' : 'max-h-0'}`}>
        <ul className="flex flex-col px-6 pb-6 pt-2 gap-1 bg-primary/95 backdrop-blur-md">
          {NAV_LINKS.map(link => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={close}
                className="block text-sm font-bold uppercase tracking-widest text-text/70 hover:text-text py-3 min-h-[44px] flex items-center transition-colors"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
```

**Personalización:** reemplaza `NAV_LINKS` con los links reales del negocio (de Step 1), y `[Brand]` con el nombre real. Los links son anclas a sección IDs (`#services`, etc.) — asegúrate de que los `id` de las secciones coincidan.

````

- [ ] **Step 3: Verify**

```bash
grep -n "Nav.jsx\|hamburger\|isOpen\|setScrolled" cinematic-sites-v2/SKILL.md
```
Expected: at least 4 matches confirming the Nav component is present.

- [ ] **Step 4: Commit**

```bash
git add cinematic-sites-v2/SKILL.md
git commit -m "fix: add complete Nav.jsx with hamburger menu and scroll-aware background"
```

---

## Task 6: Add Section Planning (Step 3a)

**Files:**
- Modify: `cinematic-sites-v2/SKILL.md` (Step 3 intro, before Architecture section)

- [ ] **Step 1: Find the insertion point**

Locate this line in SKILL.md:
```md
### Architecture — React + Vite + Tailwind CSS v4
```

- [ ] **Step 2: Insert Step 3a block directly before the Architecture heading**

Insert this entire block:

```md
### Step 3a: Section Planning

Before writing any code, decide which sections this specific site needs. Use the brand data from Step 1 — the business category determines the structure.

**Present a section proposal like this:**

> Based on [Business Name] — a [category], I suggest these sections:
>
> `Nav → Hero → [Section A] → [Section B] → [Section C] → Footer`
>
> Rationale: [1–2 sentences on why this structure fits this business]
>
> Want to add, remove, or reorder any sections?

**Common patterns by category:**

| Category | Suggested sections |
|----------|-------------------|
| Barbershop / Salon / Spa | Nav · Hero · Services · Gallery · About · Booking · Footer |
| Restaurant / Bar | Nav · Hero · Menu · About · Reservations · Location · Footer |
| Photography / Creative Studio | Nav · Hero · Portfolio · Services · Process · Contact · Footer |
| SaaS / Tech Product | Nav · Hero · Features · Pricing · Testimonials · CTA · Footer |
| Personal Brand / Coach | Nav · Hero · About · Offerings · Testimonials · Contact · Footer |
| Fitness / Gym | Nav · Hero · Programs · Trainers · Schedule · Pricing · Footer |

Wait for the user to confirm or adjust the section list before scaffolding the project. The approved sections drive what components get built in Step 3.

---

```

- [ ] **Step 3: Verify**

```bash
grep -n "Step 3a\|Section Planning\|section proposal" cinematic-sites-v2/SKILL.md
```
Expected: at least 3 matches.

- [ ] **Step 4: Commit**

```bash
git add cinematic-sites-v2/SKILL.md
git commit -m "fix: add section planning step so template adapts to business type"
```

---

## Task 7: Final verification — all 8 fixes present

- [ ] **Step 1: Run all verification checks in one pass**

```bash
echo "=== Fix 1: ScrollTrigger.getAll gone ===" && \
grep -c "ScrollTrigger.getAll" cinematic-sites-v2/SKILL.md && \
echo "=== Fix 3: SplitText gone ===" && \
grep -c "SplitText" cinematic-sites-v2/SKILL.md && \
echo "=== Fix 8: FRAME_COUNT guard present ===" && \
grep -c "Number.isFinite" cinematic-sites-v2/SKILL.md && \
echo "=== Fix 6: canvas fade-in present ===" && \
grep -c "opacity: 1, duration: 0.6" cinematic-sites-v2/SKILL.md && \
echo "=== Fix 2: progress bar present ===" && \
grep -c "progressRef" cinematic-sites-v2/SKILL.md && \
echo "=== Fix 4: Nav component present ===" && \
grep -c "isOpen" cinematic-sites-v2/SKILL.md && \
echo "=== Fix 5: Section Planning present ===" && \
grep -c "Step 3a" cinematic-sites-v2/SKILL.md && \
echo "=== Fix 7: splitChars present ===" && \
grep -c "splitChars" cinematic-sites-v2/SKILL.md
```

Expected output for each check:
- Fix 1 (`ScrollTrigger.getAll`): `0`
- Fix 3 (`SplitText`): `0`
- Fix 8 (`Number.isFinite`): `1`
- Fix 6 (`opacity: 1, duration: 0.6`): `1`
- Fix 2 (`progressRef`): `2` or more
- Fix 4 (`isOpen`): `2` or more
- Fix 5 (`Step 3a`): `1`
- Fix 7 (`splitChars`): `2` (definition + usage)

If any check fails, go back to the corresponding task and re-apply the fix.

- [ ] **Step 2: Final commit**

```bash
git add cinematic-sites-v2/SKILL.md
git commit -m "docs: cinematic-sites skill — all 8 devil fixes applied"
```
