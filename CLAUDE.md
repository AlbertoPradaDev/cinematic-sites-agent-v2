# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

```
cinematic-sites-agent-v2/
├── cinematic-site-components/   # 30 standalone HTML modules (no build step)
│   └── index.html               # Visual hub — open in browser to preview all modules
└── cinematic-sites-v2/
    └── SKILL.md                 # Full workflow spec for the /cinematic-sites skill
```

**`cinematic-site-components/`** is a static library. Each `.html` file is self-contained (GSAP + Vanilla JS via CDN). No npm, no build. Serve locally with `npx serve -p 3457` to make modules fetchable by the skill.

**`cinematic-sites-v2/SKILL.md`** defines the four-step workflow: brand analysis → AI video generation → React site build → Vercel deploy. This is the primary authoritative document for how generated sites are structured.

## Generated Site Stack

Every cinematic site produced by this skill is a **React + Vite + Tailwind CSS v4** project, deployed to Vercel. Key deps:

```bash
npm create vite@latest {slug} -- --template react
npm install gsap @gsap/react react-router-dom
npm install -D tailwindcss @tailwindcss/vite
```

GSAP plugins are registered once in `src/lib/gsap.js` — every component imports from there, never directly from `'gsap'`.

## Hard Rules (enforced on every build)

### Hero animation: canvas frame sequence only
Never use `<video>` + `video.currentTime` for scroll-driven animation — browsers can only seek to keyframes in compressed MP4s, causing stutter. Always extract JPEG frames with ffmpeg and draw on canvas via GSAP ScrollTrigger:

```bash
ffmpeg -i video.mp4 -vf "fps=24,scale=1280:720" -q:v 4 assets/frames/frame-%04d.jpg
```

Frames live in `public/assets/frames/` so Vite serves them as static assets at `/assets/frames/`.

### No dark vignettes, no wrapper containers
Never add gradient overlays that dim hero video edges. No `radial-gradient` or `linear-gradient` masks on hero media. For big headlines: `text-shadow` only. For small text over video: individual `backdrop-filter` pills on each element, never a shared wrapper container.

### Always inline SVGs, never emojis
Every icon must be an inline SVG or Lucide via CDN. No emoji characters anywhere in generated sites.

### Font contrast minimums
- Light themes: body text ≥ `#555`, labels ≥ `#444`
- Dark themes: body text ≥ `#999`, labels ≥ `#888`
- `--muted` is for captions only, never paragraph text
- Every button `color` must be set explicitly — never inherited

### Tailwind token naming (v4)
Brand colors are defined in `src/index.css` via `@theme`. They become CSS vars prefixed `--color-`: `var(--color-accent)`, `var(--color-primary)`. When porting vanilla CSS from modules, replace `var(--accent)` → `var(--color-accent)`.

## Component Patterns

### GSAP in React
All animation components follow: `useRef` → `useEffect` → `gsap.context(fn, rootRef)` → `return () => ctx.revert()`. This prevents memory leaks and ghost animations between renders.

### Hero split into three files
`Hero.jsx` — layout only, lazy-loads canvas  
`HeroCanvas.jsx` — canvas + JPEG frame sequence + ScrollTrigger (lazy-imported)  
`HeroText.jsx` — headline with SplitText animation + CTAs

`HeroCanvas` is wrapped in `React.lazy()` + `Suspense` to keep GSAP out of the main bundle.

### Mobile-first
Write base styles for 375px; scale up with `sm:`, `md:`, `lg:`. Never use `max-md:` to undo desktop styles. Key rules:
- `h-[100dvh]` not `h-screen` (iOS browser bar bug)
- `min-h-[44px]` on all interactive elements
- Buttons: `flex-col sm:flex-row` — never two buttons side-by-side on mobile
- Complex GSAP animations wrapped in `gsap.matchMedia()` — simplified or disabled on mobile

### Custom cursor
Check `window.matchMedia('(hover: none)').matches` before registering mouse events. Hidden on mobile with `max-md:hidden`.

## Cinematic Modules Integration

When using modules from `cinematic-site-components/` inside a React site:
1. Fetch the module HTML from the local server (`curl -sL http://localhost:{PORT}/{slug}`)
2. Extract its CSS and JS
3. Create a React component: move CSS into Tailwind classes or a `<style>` tag, move JS into `useEffect` + `gsap.context()` + cleanup
4. Replace `document.querySelector` with `useRef`, replace hex colors with Tailwind token classes

Module slugs match their filenames (e.g., `text-mask`, `spotlight-border`, `kinetic-marquee`). Full reference in `cinematic-sites-v2/SKILL.md`.

## Deployment

```bash
npm run build
npx vercel --yes --prod
```

`vercel.json` with SPA rewrites is required in every project root — without it, React Router paths return 404 in production:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```
