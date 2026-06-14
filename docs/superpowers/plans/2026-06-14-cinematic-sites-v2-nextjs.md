# cinematic-sites-v2 → Next.js Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the `cinematic-sites-v2` skill so generated sites are built with Next.js (App Router) + React + TypeScript + GSAP + Tailwind v4, with a consistent on-disk animation system, mobile-first/distinct-desktop layouts, and a fixed always-visible navbar.

**Architecture:** The skill becomes a lean `SKILL.md` orchestrator plus a `references/` folder containing markdown guides and copy-ready `.ts/.tsx` component templates. Templates are validated by compiling them inside a throwaway `create-next-app` project. The 30-module `cinematic-site-components/` library is read from disk (no localhost server) and ported to typed client components via one canonical recipe.

**Tech Stack:** Next.js 15 (App Router), TypeScript (strict), Tailwind CSS v4, GSAP 3.13+ (ScrollTrigger + SplitText ship free), Vercel.

> **Commit policy:** Alberto's standing rule is "commit only when asked." Commit steps below mark logical checkpoints — at execution, batch them and confirm before running `git commit`.

---

## File Structure

**Authoring home (source repo):** `/Users/cex/Documents/Skills/cinematic-sites-agent-v2/cinematic-sites-v2/`

```
cinematic-sites-v2/
├── SKILL.md                       # lean orchestrator (English)
├── flows-track.sh                 # Rubric Flows tracker (mirror v1)
└── references/
    ├── site-architecture.md       # Next.js structure, scaffold, server/client, deploy
    ├── mobile-desktop.md          # hybrid pattern, navbar, mobile non-negotiables
    ├── animation-system.md        # port recipe, import convention, custom GSAP, 30-module map
    └── component-templates/
        ├── lib-gsap.ts
        ├── lib-useMediaQuery.ts
        ├── types-brand.ts
        ├── ui-Button.tsx
        ├── ui-Cursor.tsx
        ├── Nav.tsx
        ├── Hero.tsx
        ├── HeroCanvas.tsx
        ├── HeroText.tsx
        └── AnimationModule.template.tsx
```

**Generated-site structure** (what the skill instructs Claude to build — documented in `site-architecture.md`):
```
app/{layout.tsx,page.tsx,globals.css}
lib/{gsap.ts,useMediaQuery.ts}
types/brand.ts
components/{Nav,Hero,Services,About,Gallery,Booking,Footer,ui,animations}/
public/assets/frames/
```

**Sync targets** (Task 11): repo-root `SKILL.md` + `references/`, installed `~/.claude/skills/cinematic-sites-v2/`, then `Rubric/sync-skills.sh`.

---

### Task 1: Validation harness (throwaway Next.js project)

Validates every template by compiling/building it in a real Next.js project. Not committed to the skill repo.

**Files:**
- Create: `/tmp/cs2-harness/` (scaffolded)

- [ ] **Step 1: Scaffold the project with the exact spec flags**

Run:
```bash
cd /tmp && rm -rf cs2-harness && \
npx --yes create-next-app@latest cs2-harness --ts --app --tailwind --eslint --no-src-dir --no-turbopack --import-alias "@/*" --use-npm
```
Expected: project created, `npm install` completes.

- [ ] **Step 2: Add GSAP**

Run: `cd /tmp/cs2-harness && npm install gsap`
Expected: `gsap@3.13` or newer in `package.json`.

- [ ] **Step 3: Define brand tokens so Tailwind utilities resolve**

Replace `/tmp/cs2-harness/app/globals.css` with:
```css
@import "tailwindcss";

@theme {
  --color-primary: #101010;
  --color-secondary: #1a1a1a;
  --color-text: #f5f0e8;
  --color-accent: #c8a45c;
  --color-muted: #8a8a8a;
}

html { scroll-behavior: smooth; scroll-padding-top: 5rem; }
body { background-color: var(--color-primary); color: var(--color-text); overflow-x: hidden; }
```

- [ ] **Step 4: Baseline build**

Run: `cd /tmp/cs2-harness && npm run build`
Expected: build succeeds. This proves the scaffold command in the spec is correct.

---

### Task 2: `lib/gsap.ts` — single GSAP registration point

**Files:**
- Create: `cinematic-sites-v2/references/component-templates/lib-gsap.ts`
- Validate in harness: `/tmp/cs2-harness/lib/gsap.ts`

- [ ] **Step 1: Write the template**

```ts
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText' // free since GSAP 3.13

// Registering plugins touches window — guard for SSR safety.
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText)
}

export { gsap, ScrollTrigger, SplitText }
```

- [ ] **Step 2: Validate it type-checks**

Run: `cp cinematic-sites-v2/references/component-templates/lib-gsap.ts /tmp/cs2-harness/lib/gsap.ts && cd /tmp/cs2-harness && npx tsc --noEmit`
Expected: no errors (creates `lib/` if absent: `mkdir -p /tmp/cs2-harness/lib` first).

---

### Task 3: `lib/useMediaQuery.ts` — post-mount breakpoint hook

**Files:**
- Create: `cinematic-sites-v2/references/component-templates/lib-useMediaQuery.ts`

- [ ] **Step 1: Write the template**

```ts
'use client'
import { useEffect, useState } from 'react'

// Returns false until mounted, so SSR always renders the mobile tree and the
// desktop variant swaps in after hydration — no hydration mismatch.
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}
```

- [ ] **Step 2: Validate**

Run: `cp .../lib-useMediaQuery.ts /tmp/cs2-harness/lib/useMediaQuery.ts && cd /tmp/cs2-harness && npx tsc --noEmit`
Expected: no errors.

---

### Task 4: `types/brand.ts` — typed brand model

**Files:**
- Create: `cinematic-sites-v2/references/component-templates/types-brand.ts`

- [ ] **Step 1: Write the template**

```ts
export interface BrandColors {
  primary: string
  secondary: string
  text: string
  accent: string
  muted: string
}

export interface Brand {
  name: string
  category: string
  colors: BrandColors
  fonts: { heading: string; body: string }
  tagline: string
  headline: string
  services: string[]
  cta: string
  contact: { phone?: string; email?: string; address?: string }
  logoUrl?: string
}
```

- [ ] **Step 2: Validate**

Run: `mkdir -p /tmp/cs2-harness/types && cp .../types-brand.ts /tmp/cs2-harness/types/brand.ts && cd /tmp/cs2-harness && npx tsc --noEmit`
Expected: no errors.

---

### Task 5: `ui/Button.tsx` — typed CTA

**Files:**
- Create: `cinematic-sites-v2/references/component-templates/ui-Button.tsx`

- [ ] **Step 1: Write the template**

```tsx
import Link from 'next/link'
import type { ComponentProps } from 'react'

type Variant = 'primary' | 'outline'
type Size = 'sm' | 'md'

const SIZES: Record<Size, string> = {
  sm: 'text-xs px-5 min-h-[44px]',
  md: 'text-sm px-8 min-h-[44px] md:min-h-[52px]',
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent/80 active:bg-accent/60',
  outline: 'border border-text/30 text-text hover:border-text hover:bg-text/5 active:bg-text/10',
}

interface ButtonProps extends ComponentProps<typeof Link> {
  variant?: Variant
  size?: Size
}

export default function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-bold uppercase tracking-widest transition-all duration-300 select-none'
  return (
    <Link className={`${base} ${SIZES[size]} ${VARIANTS[variant]} ${className}`} {...props}>
      {children}
    </Link>
  )
}
```

- [ ] **Step 2: Validate**

Run: `mkdir -p /tmp/cs2-harness/components/ui && cp .../ui-Button.tsx /tmp/cs2-harness/components/ui/Button.tsx && cd /tmp/cs2-harness && npx tsc --noEmit`
Expected: no errors.

---

### Task 6: `ui/Cursor.tsx` — desktop-only custom cursor

**Files:**
- Create: `cinematic-sites-v2/references/component-templates/ui-Cursor.tsx`

- [ ] **Step 1: Write the template**

```tsx
'use client'
import { useEffect, useRef } from 'react'
import { gsap } from '@/lib/gsap'

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(hover: none)').matches) return
    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return
    const SELECTOR = 'a, button, input, select, textarea'

    const onMove = (e: MouseEvent) => {
      gsap.to(dot, { x: e.clientX, y: e.clientY, duration: 0.1, ease: 'power2.out' })
      gsap.to(ring, { x: e.clientX, y: e.clientY, duration: 0.4, ease: 'power2.out' })
    }
    const onOver = (e: MouseEvent) => {
      if ((e.target as Element).closest(SELECTOR)) {
        gsap.to(ring, { scale: 2.5, opacity: 0.5, duration: 0.3 })
        gsap.to(dot, { scale: 0, duration: 0.3 })
      }
    }
    const onOut = (e: MouseEvent) => {
      if (!(e.relatedTarget as Element | null)?.closest(SELECTOR)) {
        gsap.to(ring, { scale: 1, opacity: 1, duration: 0.3 })
        gsap.to(dot, { scale: 1, duration: 0.3 })
      }
    }

    window.addEventListener('mousemove', onMove)
    document.addEventListener('mouseover', onOver)
    document.addEventListener('mouseout', onOut)
    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout', onOut)
    }
  }, [])

  return (
    <>
      <div ref={dotRef} className="max-md:hidden fixed top-0 left-0 w-2 h-2 bg-text rounded-full pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2" />
      <div ref={ringRef} className="max-md:hidden fixed top-0 left-0 w-8 h-8 border border-text/60 rounded-full pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2" />
    </>
  )
}
```

- [ ] **Step 2: Validate**

Run: `cp .../ui-Cursor.tsx /tmp/cs2-harness/components/ui/Cursor.tsx && cd /tmp/cs2-harness && npx tsc --noEmit`
Expected: no errors.

---

### Task 7: `Nav.tsx` — fixed navbar + hamburger drawer

**Files:**
- Create: `cinematic-sites-v2/references/component-templates/Nav.tsx`

- [ ] **Step 1: Write the template**

```tsx
'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { gsap } from '@/lib/gsap'

const NAV_LINKS = [
  { label: 'Services', href: '#services' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'About', href: '#about' },
  { label: 'Booking', href: '#booking' },
] as const

export default function Nav() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const drawer = drawerRef.current
    if (!drawer) return
    const ctx = gsap.context(() => {
      gsap.to(drawer, { xPercent: open ? 0 : 100, duration: 0.5, ease: 'power3.out' })
    })
    return () => ctx.revert()
  }, [open])

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-primary/60 backdrop-blur border-b border-text/10' : 'bg-transparent'}`}>
      <nav className="flex items-center justify-between px-4 sm:px-8 lg:px-16 h-16 md:h-20">
        <Link href="#hero" className="font-black uppercase tracking-widest text-lg">[Brand]</Link>

        <ul className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="text-sm uppercase tracking-widest hover:text-accent transition-colors">{l.label}</Link>
            </li>
          ))}
        </ul>

        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="md:hidden flex flex-col items-center justify-center gap-1.5 w-11 h-11"
        >
          <span className={`block h-0.5 w-6 bg-text transition-transform duration-300 ${open ? 'translate-y-2 rotate-45' : ''}`} />
          <span className={`block h-0.5 w-6 bg-text transition-opacity duration-300 ${open ? 'opacity-0' : ''}`} />
          <span className={`block h-0.5 w-6 bg-text transition-transform duration-300 ${open ? '-translate-y-2 -rotate-45' : ''}`} />
        </button>
      </nav>

      <div
        ref={drawerRef}
        className="md:hidden fixed top-0 right-0 h-[100dvh] w-3/4 max-w-xs translate-x-full bg-primary border-l border-text/10 z-50 flex flex-col gap-6 p-8 pt-24"
      >
        {NAV_LINKS.map((l) => (
          <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="flex items-center min-h-[44px] text-2xl font-black uppercase tracking-widest">{l.label}</Link>
        ))}
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Validate**

Run: `cp .../Nav.tsx /tmp/cs2-harness/components/Nav.tsx && cd /tmp/cs2-harness && npx tsc --noEmit`
Expected: no errors.

---

### Task 8: Hero trio (`Hero.tsx`, `HeroCanvas.tsx`, `HeroText.tsx`)

**Files:**
- Create: `cinematic-sites-v2/references/component-templates/{Hero,HeroCanvas,HeroText}.tsx`

- [ ] **Step 1: Write `Hero.tsx` — client component (required for `ssr:false`)**

> Next.js 15 forbids `dynamic(..., { ssr: false })` inside a Server Component, so `Hero` must be a client component.

```tsx
'use client'
import dynamic from 'next/dynamic'
import HeroText from './HeroText'

const HeroCanvas = dynamic(() => import('./HeroCanvas'), { ssr: false })

export default function Hero() {
  return (
    <section id="hero" style={{ height: '300vh' }} className="relative">
      <div className="sticky top-0 h-[100dvh] w-full overflow-hidden bg-primary">
        <HeroCanvas />
        {/* Stronger overlay on mobile only — keeps text legible, no vignette wrapper */}
        <div className="absolute inset-0 z-10 bg-primary/60 md:bg-transparent pointer-events-none" />
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <HeroText />
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Write `HeroCanvas.tsx`**

```tsx
'use client'
import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '@/lib/gsap'

// Set this to the real frame count after ffmpeg extraction:
//   ls public/assets/frames | wc -l
const TOTAL_FRAMES = 121

export default function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx2d = canvas.getContext('2d')
    if (!ctx2d) return

    const frames: HTMLImageElement[] = []
    let loaded = 0

    const drawFrame = (idx: number) => {
      const img = frames[idx]
      if (!img?.complete) return
      const r = Math.max(canvas.width / img.width, canvas.height / img.height)
      const w = img.width * r
      const h = img.height * r
      ctx2d.clearRect(0, 0, canvas.width, canvas.height)
      ctx2d.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h)
    }

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image()
      img.src = `/assets/frames/frame-${String(i).padStart(4, '0')}.jpg`
      img.onload = () => {
        loaded++
        if (loaded === 1) drawFrame(0)
      }
      frames.push(img)
    }

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
    }
    window.addEventListener('resize', resize)
    resize()

    const tween = gsap.to({ frame: 0 }, {
      frame: TOTAL_FRAMES - 1,
      snap: 'frame',
      ease: 'none',
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 0.3 },
      onUpdate() { drawFrame(Math.round(this.targets()[0].frame as number)) },
    })

    return () => {
      window.removeEventListener('resize', resize)
      tween.kill()
      ScrollTrigger.getAll().forEach((t) => t.kill())
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
}
```

- [ ] **Step 3: Write `HeroText.tsx`**

```tsx
'use client'
import { useEffect, useRef } from 'react'
import { gsap, SplitText } from '@/lib/gsap'
import Button from './ui/Button'

export default function HeroText() {
  const containerRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (!titleRef.current) return
      const split = new SplitText(titleRef.current, { type: 'chars' })
      gsap.from(split.chars, {
        y: -60, opacity: 0, rotationX: -90,
        duration: 0.5, stagger: 0.02, ease: 'back.out(1.4)', delay: 0.1,
      })
    }, containerRef)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={containerRef} className="hero-text flex flex-col items-center gap-4 px-6 text-center sm:px-10">
      <span className="text-xs uppercase tracking-[0.3em] text-accent">[Tagline]</span>
      <h1
        ref={titleRef}
        className="text-5xl font-black uppercase leading-none sm:text-6xl md:text-7xl lg:text-8xl"
        style={{ perspective: '400px', textShadow: '0 4px 30px rgba(0,0,0,.9), 0 2px 10px rgba(0,0,0,.7)' }}
      >
        [Brand Name]
      </h1>
      <p className="max-w-xs text-sm leading-relaxed text-text/60 sm:max-w-sm md:text-base">[Subtitle]</p>
      <div className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Button href="#booking" variant="primary">Book Now</Button>
        <Button href="#gallery" variant="outline">View Work</Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Validate the trio builds (catches the `ssr:false` rule)**

Run:
```bash
mkdir -p /tmp/cs2-harness/components/Hero && \
cp .../Hero.tsx /tmp/cs2-harness/components/Hero/Hero.tsx && \
cp .../HeroCanvas.tsx /tmp/cs2-harness/components/Hero/HeroCanvas.tsx && \
cp .../HeroText.tsx /tmp/cs2-harness/components/Hero/HeroText.tsx && \
mkdir -p /tmp/cs2-harness/components/Hero/ui && cp /tmp/cs2-harness/components/ui/Button.tsx /tmp/cs2-harness/components/Hero/ui/Button.tsx && \
printf "import Hero from '@/components/Hero/Hero'\nexport default function Page(){return <Hero/>}\n" > /tmp/cs2-harness/app/page.tsx && \
cd /tmp/cs2-harness && npm run build
```
Expected: build succeeds. If it errors on `ssr: false`, the `'use client'` directive in `Hero.tsx` is missing — fix and rebuild.

> Note: in a real generated site `HeroText` imports `Button` from `@/components/ui/Button`. The harness copies Button next to Hero only to keep the relative path simple — the template file ships with the `@/components/ui/Button` import.

---

### Task 9: `AnimationModule.template.tsx` — canonical port recipe (with worked example)

**Files:**
- Create: `cinematic-sites-v2/references/component-templates/AnimationModule.template.tsx`

- [ ] **Step 1: Write the template — a working scroll-reveal that compiles, with documented extension points**

```tsx
'use client'
// CANONICAL ANIMATION COMPONENT TEMPLATE
// Use this shape for BOTH ported cinematic-site-components modules AND custom GSAP work.
// Port recipe:
//   1. 'use client' at top.
//   2. One useRef per element the vanilla module reached via document.querySelector.
//   3. Module JS goes inside useEffect → gsap.context(fn, rootRef) → return () => ctx.revert().
//   4. Hex colors → Tailwind tokens; var(--accent) → var(--color-accent).
//   5. Wrap desktop-only heavy motion in gsap.matchMedia().
//   6. Typed props with explicit defaults.
import { useEffect, useRef } from 'react'
import { gsap } from '@/lib/gsap'

interface AnimationSectionProps {
  className?: string
  children?: React.ReactNode
}

export default function AnimationSection({ className = '', children }: AnimationSectionProps) {
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const mm = gsap.matchMedia()

    // Desktop: full motion
    mm.add('(min-width: 768px)', () => {
      const ctx = gsap.context(() => {
        gsap.from('[data-reveal]', {
          y: 60, opacity: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out',
          scrollTrigger: { trigger: rootRef.current, start: 'top 75%' },
        })
      }, rootRef)
      return () => ctx.revert()
    })

    // Mobile: simplified fade
    mm.add('(max-width: 767px)', () => {
      const ctx = gsap.context(() => {
        gsap.from('[data-reveal]', { opacity: 0, duration: 0.4, ease: 'power2.out',
          scrollTrigger: { trigger: rootRef.current, start: 'top 85%' } })
      }, rootRef)
      return () => ctx.revert()
    })

    return () => mm.revert()
  }, [])

  return (
    <section ref={rootRef} className={`relative px-4 py-16 sm:px-8 md:px-16 md:py-24 bg-primary ${className}`}>
      {children}
    </section>
  )
}
```

- [ ] **Step 2: Validate**

Run: `mkdir -p /tmp/cs2-harness/components/animations && cp .../AnimationModule.template.tsx /tmp/cs2-harness/components/animations/AnimationSection.tsx && cd /tmp/cs2-harness && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit all templates (confirm with Alberto first per commit policy)**

```bash
cd /Users/cex/Documents/Skills/cinematic-sites-agent-v2
git add cinematic-sites-v2/references/component-templates
git commit -m "feat(cinematic-sites-v2): add Next.js+TS component templates"
```

---

### Task 10: Reference markdown guides

Three guides. Content is the existing SKILL.md material, **translated to English**, reorganized, and updated for Next.js. No new concepts — these consolidate what the templates already encode.

**Files:**
- Create: `cinematic-sites-v2/references/site-architecture.md`
- Create: `cinematic-sites-v2/references/mobile-desktop.md`
- Create: `cinematic-sites-v2/references/animation-system.md`

- [ ] **Step 1: Write `site-architecture.md`**

Must contain, in order:
1. The `create-next-app` command from Task 1 Step 1 (verbatim) + `npm install gsap`.
2. The generated-site file tree (from this plan's File Structure section).
3. Server vs client rule: page shell is a server component; any component touching `window`/GSAP/canvas is `'use client'`; `Hero` is client because of `dynamic(..., {ssr:false})`.
4. `next/font` setup in `layout.tsx` and `next/image` for stock/gallery.
5. The Tailwind v4 `@theme` token block (the 5 `--color-*` tokens) mapped from Step-1 brand colors.
6. Deploy: `npm run build && npx vercel --yes --prod` — **no `vercel.json` SPA rewrite** (App Router routes natively).
7. JS conventions: constant data outside components, ordered imports, full cleanup in `useEffect` returns, one folder per component.

- [ ] **Step 2: Write `mobile-desktop.md`**

Must contain:
1. Mobile-first philosophy: base styles = 375px, scale up with `sm:`/`md:`/`lg:`, never `max-md:` to undo desktop.
2. Hybrid split: Tailwind breakpoints for layout/visual differences; `useMediaQuery('(min-width:768px)')` (Task 3) gating a structurally different desktop subtree; `gsap.matchMedia()` for heavy motion.
3. Navbar spec: fixed, always visible, frosted on scroll; `hidden md:flex` desktop links; hamburger drawer `< md`; 44px targets; `tel:`/`mailto:` clickable. Reference `Nav.tsx`.
4. Mobile non-negotiables: `h-[100dvh]`, `min-h-[44px]`, `flex-col sm:flex-row` CTAs, `px-4` minimum, `env(safe-area-inset-*)` on body, type from `text-4xl` up.

- [ ] **Step 3: Write `animation-system.md`**

Must contain:
1. Statement: `cinematic-site-components/` is the on-disk library — read module files directly, **no localhost server**. Module slugs = filenames (e.g. `text-mask`, `spotlight-border`).
2. The 6-step port recipe (from `AnimationModule.template.tsx` header).
3. Import convention: ported animations live in `components/animations/<Name>/<Name>.tsx`; GSAP imported only from `@/lib/gsap`; custom animations use the same template.
4. The full 30-module reference table + the industry → module selection guide (translated to English from current SKILL.md §Cinematic Modules).
5. The key implementation snippets currently in SKILL.md (3D tilt, magnetic button, cursor glow, spotlight border, text-mask, odometer, kinetic marquee, zoom parallax) kept as porting references.

- [ ] **Step 4: Verify no Spanish and links resolve**

Run:
```bash
cd /Users/cex/Documents/Skills/cinematic-sites-agent-v2/cinematic-sites-v2/references
grep -rniE '\b(siempre|cada|carpeta|botones|módulo|modulo|fuera|límpiar|limpiar|nunca|según|versión|añad)\b' . && echo "SPANISH FOUND — fix" || echo "clean"
ls site-architecture.md mobile-desktop.md animation-system.md
```
Expected: `clean` + all three files listed.

- [ ] **Step 5: Commit (confirm first)**

```bash
git add cinematic-sites-v2/references/*.md
git commit -m "docs(cinematic-sites-v2): add Next.js architecture/mobile/animation references"
```

---

### Task 11: `flows-track.sh` — Rubric Flows tracker

**Files:**
- Create: `cinematic-sites-v2/flows-track.sh`

- [ ] **Step 1: Write the script (mirror v1, workflowId `cinematic-sites-v2`)**

```bash
#!/usr/bin/env bash
# Rubric Flows live tracker for the cinematic-sites-v2 workflow.
# Emits progress events to the Rubric dashboard so the Flows tab animates in real time.
# Silently no-ops if the dashboard isn't running — the skill still works standalone.
#
# Usage:
#   flows-track.sh start
#   flows-track.sh step   <index> <skillId>
#   flows-track.sh action <index> "<text>"
#   flows-track.sh done   <index>
#   flows-track.sh error  <index> "<text>"
#   flows-track.sh complete
#   flows-track.sh reset

URL="${RUBRIC_URL:-http://localhost:5050}/api/workflow-events"
WF="cinematic-sites-v2"

esc() { printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'; }

emit() {
  curl -s --max-time 2 -X POST "$URL" \
    -H 'Content-Type: application/json' \
    -d "$1" >/dev/null 2>&1 || true
}

cmd="$1"; shift 2>/dev/null || true
case "$cmd" in
  start)    emit "{\"event\":\"workflow:start\",\"workflowId\":\"$WF\"}" ;;
  step)     emit "{\"event\":\"step:start\",\"stepIndex\":${1:-0},\"skillId\":\"${2:-}\"}" ;;
  action)   emit "{\"event\":\"step:action\",\"stepIndex\":${1:-0},\"text\":\"$(esc "${2:-}")\"}" ;;
  done)     emit "{\"event\":\"step:complete\",\"stepIndex\":${1:-0}}" ;;
  error)    emit "{\"event\":\"step:error\",\"stepIndex\":${1:-0},\"text\":\"$(esc "${2:-Step failed}")\"}" ;;
  complete) emit "{\"event\":\"workflow:complete\",\"workflowId\":\"$WF\"}" ;;
  reset)    emit "{\"event\":\"workflow:reset\"}" ;;
  *) echo "usage: flows-track.sh {start|step <i> <skillId>|action <i> <text>|done <i>|error <i> <text>|complete|reset}" >&2; exit 1 ;;
esac
```

- [ ] **Step 2: Make executable + syntax-check**

Run: `chmod +x cinematic-sites-v2/flows-track.sh && bash -n cinematic-sites-v2/flows-track.sh && echo OK`
Expected: `OK`.

---

### Task 12: Register the v2 flow + Run button in Rubric

Inspect the existing v1 wiring and replicate for v2 so the flow shows in the Flows tab with a Run button.

**Files:**
- Modify: `/Users/cex/Rubric/flows/data/workflows.json` (add a `cinematic-sites-v2` workflow entry)
- Verify: the scaffold Run endpoint (`POST /api/run-workflow`) accepts the v2 id

- [ ] **Step 1: Inspect current structure**

Run:
```bash
cat /Users/cex/Rubric/flows/data/workflows.json | head -80
grep -rn "run-workflow\|cinematic-sites" /Users/cex/Rubric/scaffold/server.js | head
```
Expected: shows the v1 `cinematic-sites` workflow shape (4 steps, skillIds `brand-analysis`/`scene-generation`/`website-build`/`deploy`) and the Run endpoint.

- [ ] **Step 2: Add the `cinematic-sites-v2` workflow entry**

Mirror the v1 entry exactly (same 4 steps/skillIds), with `id: "cinematic-sites-v2"` and an updated title/description noting the Next.js stack. Match the existing JSON shape discovered in Step 1.

- [ ] **Step 3: Verify the dashboard serves it**

Run: `curl -s http://localhost:5050/api/workflows | grep cinematic-sites-v2 && echo OK` (only if pm2 dashboard is up; skip if not running).
Expected: `OK` or skipped.

---

### Task 13: Rewrite `SKILL.md` as a lean orchestrator

**Files:**
- Rewrite: `cinematic-sites-v2/SKILL.md`

- [ ] **Step 1: Write the new SKILL.md**

Structure (English, concise — long code now lives in `references/`):
1. **Frontmatter** — keep `name: cinematic-sites-v2`; update `description` to say Next.js + React + TypeScript + GSAP.
2. **Intro** + one-command usage.
3. **Rubric Flows section** — how to call `flows-track.sh` (step index → skillId table: 0 brand-analysis, 1 scene-generation, 2 website-build, 3 deploy) + when to emit.
4. **HARD RULES** — canvas frames (never `video.currentTime`), no vignettes/wrapper containers, inline SVGs, contrast minimums, on-disk animation library.
5. **Setup** — ffmpeg, Google AI Studio, WaveSpeed, Vercel. Remove the "Cinematic Modules localhost port" prompt.
6. **Step 1 Brand Analysis** — unchanged (brand-card.html, pause).
7. **Step 2 Scene Generation** — unchanged (concepts, cost check, Nano Banana, Kling, frame extraction).
8. **Step 3 Website Build** — short: "Build a Next.js App Router + TS + GSAP site per `references/site-architecture.md`, `references/mobile-desktop.md`, `references/animation-system.md`, using the templates in `references/component-templates/`." List the section order and the fixed-navbar/hamburger requirement.
9. **Step 4 Deploy** — `npm run build && npx vercel --yes --prod`, no vercel.json.
10. **Pause points** table + **Run button** note.

- [ ] **Step 2: Verify forbidden patterns are gone + references exist**

Run:
```bash
cd /Users/cex/Documents/Skills/cinematic-sites-agent-v2/cinematic-sites-v2
grep -niE 'vite|video\.currentTime|vercel\.json|localhost:\{PORT\}|\.jsx' SKILL.md && echo "FORBIDDEN FOUND — fix" || echo "clean"
grep -niE '\b(siempre|cada|carpeta|módulo|modulo|añad|según)\b' SKILL.md && echo "SPANISH FOUND — fix" || echo "english-ok"
for f in references/site-architecture.md references/mobile-desktop.md references/animation-system.md references/component-templates/lib-gsap.ts; do test -f "$f" && echo "ok $f" || echo "MISSING $f"; done
head -4 SKILL.md
```
Expected: `clean`, `english-ok`, all `ok`, and frontmatter intact (`---` / `name: cinematic-sites-v2`).

- [ ] **Step 3: Commit (confirm first)**

```bash
git add cinematic-sites-v2/SKILL.md cinematic-sites-v2/flows-track.sh
git commit -m "feat(cinematic-sites-v2): rewrite SKILL.md for Next.js stack + Flows tracking"
```

---

### Task 14: Sync to all targets + housekeeping

**Files:**
- Modify: repo-root `SKILL.md` (+ copy `references/`, `flows-track.sh` to root)
- Modify: `~/.claude/skills/cinematic-sites-v2/` (install copy)
- Modify: `/Users/cex/Rubric/docs/files/Changelog.md`

- [ ] **Step 1: Mirror the skill folder to repo root and the installed skill**

Run:
```bash
cd /Users/cex/Documents/Skills/cinematic-sites-agent-v2
cp -r cinematic-sites-v2/references cinematic-sites-v2/flows-track.sh cinematic-sites-v2/SKILL.md . && echo "root synced"
rm -rf ~/.claude/skills/cinematic-sites-v2 && cp -r cinematic-sites-v2 ~/.claude/skills/cinematic-sites-v2 && echo "installed synced"
```

- [ ] **Step 2: Back up to Rubric**

Run: `bash /Users/cex/Rubric/sync-skills.sh | grep cinematic-sites-v2`
Expected: `✓ cinematic-sites-v2`.

- [ ] **Step 3: Log to Rubric Docs changelog**

Append a dated entry to `/Users/cex/Rubric/docs/files/Changelog.md` describing the v2 → Next.js rewrite (stack, on-disk animations, Flows wiring, file split).

- [ ] **Step 4: Final end-to-end verification**

Run:
```bash
test -f ~/.claude/skills/cinematic-sites-v2/SKILL.md && \
test -d ~/.claude/skills/cinematic-sites-v2/references/component-templates && \
test -x ~/.claude/skills/cinematic-sites-v2/flows-track.sh && echo "INSTALL OK"
cd /tmp/cs2-harness && npm run build >/dev/null 2>&1 && echo "HARNESS BUILD OK"
```
Expected: `INSTALL OK` and `HARNESS BUILD OK`.

- [ ] **Step 5: Commit (confirm first)**

```bash
cd /Users/cex/Documents/Skills/cinematic-sites-agent-v2
git add -A && git commit -m "chore(cinematic-sites-v2): sync skill to root + install, log changelog"
```

---

## Self-Review

**Spec coverage:**
- App Router + TS → Tasks 1, 13 (scaffold flags), `site-architecture.md`. ✓
- Tailwind v4 `@theme` → Task 1 Step 3, `site-architecture.md`. ✓
- Hybrid mobile/desktop → Tasks 3, 7, `mobile-desktop.md`. ✓
- Fixed navbar + hamburger → Task 7. ✓
- On-disk animation library + consistent recipe/imports → Tasks 9, 10. ✓
- Hero canvas frames, no `video.currentTime` → Task 8, Task 13 hard rules. ✓
- Flows tracking + Run button → Tasks 11, 12. ✓
- Lean SKILL.md + references split → Tasks 10, 13. ✓
- English normalization → Task 10 Step 4, Task 13 Step 2 greps. ✓
- Deploy without vercel.json → Tasks 8 (build), 13, `site-architecture.md`. ✓
- Sync to source/installed/Rubric → Task 14. ✓

**Placeholder scan:** Template files use `[Brand]`/`[Tagline]` as intended copy placeholders and `TOTAL_FRAMES = 121` with a documented "set after ffmpeg" comment — these are deliberate skill template tokens, not plan gaps. No `TBD`/`implement later` steps.

**Type consistency:** `useMediaQuery` (Task 3), `Brand`/`BrandColors` (Task 4), `Button` props (Task 5) referenced consistently. GSAP imported from `@/lib/gsap` in every client component (Tasks 2, 6, 7, 8, 9). `flows-track.sh` workflowId `cinematic-sites-v2` consistent across Tasks 11–12.

**Known risk:** Task 1/8 require network for `create-next-app` + `npm install`. If unavailable at execution, fall back to `npx tsc --noEmit` against a minimal hand-made `tsconfig`, accepting that the `ssr:false` build check (Task 8 Step 4) can't run — flag it then.
