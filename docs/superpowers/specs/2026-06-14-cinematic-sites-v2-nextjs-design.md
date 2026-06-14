# Design: cinematic-sites-v2 → Next.js + TypeScript + GSAP

_Date: 2026-06-14 · Status: approved, pre-implementation_

## Goal

Rewrite the `cinematic-sites-v2` skill so that the **generated websites** are built with
the architecture used for Next.js projects — **Next.js (App Router) + React + TypeScript +
GSAP + Tailwind CSS v4** — instead of the current React + Vite + JavaScript stack.

The skill keeps the same four-step sequence and AI pipeline. Only the *Website Build* step
and the supporting reference material change, plus housekeeping (Flows wiring, English
normalization, file split).

Sites must be **mobile-first with a distinct desktop design**, cinematic, and read as
high-end ("thousand-dollar") work. The author's house style is a **fixed, always-visible top
navbar** with a **hamburger menu on mobile**.

## Scope

### Stays unchanged
- The four-step sequence: Brand Analysis → Scene Generation → Website Build → Deploy.
- AI pipeline: Nano Banana Pro (image, free) + Kling via WaveSpeed (video, paid).
- Cost-check + pause points before any paid API call and at each review gate.
- All HARD RULES: canvas frame sequence for the hero (never `video.currentTime`),
  no dark vignettes / no hero wrapper containers, inline SVGs (never emojis), font/button
  contrast minimums.

### Changes
1. Website Build rebuilt for Next.js App Router + TypeScript + Tailwind v4 + GSAP.
2. Animation library consumed **from disk** (no localhost server / port prompt).
3. **Flows live-tracking + Run button** added (workspace rule `flows-new-flow-standard`).
4. SKILL.md split into a lean orchestrator + a `references/` folder.
5. Whole skill normalized to **English** (currently mixed English/Spanish).
6. Deploy simplified — native Vercel, no SPA `vercel.json` rewrites.

## Decisions (locked)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Router | **App Router** (`app/`) | Current Next.js 15 standard; server/client split; SEO. |
| Language | **TypeScript (strict)** | Typed brand tokens, props, module config. |
| Styling | **Tailwind v4 `@theme`** | Keep parity with existing module port recipe. |
| Mobile vs desktop | **Hybrid** | Shared logic; layout branches by breakpoint + conditional render for structurally different desktop. |
| Animation source | **On-disk `cinematic-site-components/`** | Drop fragile localhost server; read module files directly; port to typed components. |
| Work location | **Source repo** `Documents/Skills/cinematic-sites-agent-v2/` | Has git history; then sync to installed skill + Rubric backup. |

## Generated-site architecture

```
app/
  layout.tsx          # <html>/<body>, next/font, Nav + Cursor mounted once
  page.tsx            # server component — assembles the sections
  globals.css         # Tailwind @theme tokens + global styles + safe-area insets
lib/
  gsap.ts             # single GSAP plugin-registration point (typed export)
  useMediaQuery.ts    # post-mount breakpoint hook for the desktop/mobile branch
types/
  brand.ts            # Brand + extract.json schema types
components/
  Nav/Nav.tsx                 # fixed top, always visible; hamburger drawer < md
  Hero/
    Hero.tsx                  # layout only; dynamic-imports the canvas
    HeroCanvas.tsx            # canvas + JPEG frame sequence + ScrollTrigger (ssr:false)
    HeroText.tsx              # SplitText headline + CTAs
  Services/Services.tsx
  About/About.tsx
  Gallery/Gallery.tsx
  Booking/Booking.tsx
  Footer/Footer.tsx
  ui/
    Button.tsx
    Cursor.tsx                # desktop-only custom cursor
  animations/                 # ported cinematic modules (one folder each)
public/
  assets/frames/              # hero JPEG frames (served statically)
```

**Rules:**
- Sections that touch `window` / GSAP / canvas are `'use client'`. The page shell
  (`page.tsx`) stays a server component.
- `HeroCanvas` is loaded with `next/dynamic(() => import('./HeroCanvas'), { ssr: false })`
  so GSAP/canvas never run during SSR and stay out of the initial bundle.
- `next/font` for typography; `next/image` for stock/gallery imagery.
- One folder per component; the main file repeats the folder name (e.g. `Hero/Hero.tsx`).
  Sub-components of the same feature live in the same folder.
- Constant data declared outside the component body. Imports ordered: React → libs →
  components → assets. Every listener / rAF / ScrollTrigger / tween cleaned up in the
  `useEffect` return.

### Scaffolding
```bash
npx create-next-app@latest {business-slug} --ts --app --tailwind --eslint --src-dir=false --import-alias "@/*"
cd {business-slug}
npm install gsap @gsap/react
```
GSAP plugins registered once in `lib/gsap.ts`; every component imports from there, never
directly from `'gsap'`.

## Mobile-first → distinct desktop (hybrid)

Author the **mobile layout first** (375px base), then branch for desktop:
- **Visual/layout differences** → Tailwind breakpoints (`md:` / `lg:`).
- **Structurally different desktop DOM** → `useMediaQuery('(min-width: 768px)')` gating which
  subtree renders. The hook returns `false` until after mount to avoid hydration mismatch
  (server renders the mobile tree; desktop swaps in on the client after hydration).
- **Heavy GSAP** gated with `gsap.matchMedia()` — simplified or disabled below `md`.

**Navbar (house signature):** fixed, always visible, frosted-glass on scroll
(`backdrop-blur`, `bg-primary/60`). Desktop links `hidden md:flex`; hamburger drawer for
`< md` with 44px tap targets and `tel:` / `mailto:` links clickable.

Mobile non-negotiables: `h-[100dvh]` (not `h-screen`), `min-h-[44px]` interactive targets,
`flex-col sm:flex-row` CTA stacks, `px-4` minimum side padding, type scaled up from
`text-4xl`, `env(safe-area-inset-*)` on the body.

## Animation system (consistency is the priority)

`cinematic-site-components/` (the 30 vanilla HTML+GSAP modules) is the **on-disk library**.
The skill reads module files directly by path — no localhost server, no port prompt.

**Canonical port recipe** — every module becomes a typed client component at
`components/animations/<ModuleName>/<ModuleName>.tsx`:
1. `'use client'` at the top.
2. `useRef` for every element the vanilla JS reached via `document.querySelector`.
3. JS logic inside `useEffect` → `gsap.context(fn, rootRef)` → `return () => ctx.revert()`.
4. Hex colors → Tailwind tokens (`var(--accent)` → `var(--color-accent)`).
5. `gsap.matchMedia()` for any desktop-only heavy motion.
6. Typed props with explicit defaults.

**Import convention:** all ported animations imported from `components/animations/`; GSAP
imported only from `lib/gsap.ts`. Custom (non-module) animations follow the **same** template
so the codebase stays consistent regardless of source.

The 30-module reference table and the industry → module selection guide are kept (translated
to English).

## Skill file structure

`SKILL.md` becomes a **lean orchestrator**: the four steps, hard rules, cost checks, pause
points, and the Flows/Run section. Long code blocks move to `references/`:
- `site-architecture.md` — Next.js structure, scaffolding, server/client rules, deploy.
- `animation-system.md` — port recipe, import convention, custom-GSAP guidelines, 30-module map.
- `mobile-desktop.md` — hybrid pattern, navbar, mobile non-negotiables.
- `component-templates/` — Nav, Hero trio, Button, Cursor, animation template (TSX).

Add `flows-track.sh` and the Flows tracking section (mirroring v1), wire the Run button.

## Deploy

```bash
npm run build
npx vercel --yes --prod
```
No `vercel.json` SPA rewrite file — the App Router handles routing natively.

## Sync & housekeeping

After editing the source repo:
1. Sync to installed skill `~/.claude/skills/cinematic-sites-v2/`.
2. Back up via `Rubric/sync-skills.sh`.
3. Log the change in Rubric Docs `Changelog.md`; add/update memory.

## Out of scope
- Changing the AI pipeline or providers.
- Modifying the `cinematic-site-components` HTML modules themselves.
- Building an actual client site (this is skill work, not a site build).
