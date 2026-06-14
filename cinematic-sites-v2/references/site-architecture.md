# Site Architecture — Next.js + TypeScript + GSAP

Every cinematic site is a **Next.js (App Router) + TypeScript + Tailwind CSS v4 + GSAP**
project, deployed to Vercel. Component-per-folder, mobile-first, fully typed.

## Scaffold

```bash
npx create-next-app@latest {business-slug} --ts --app --tailwind --eslint --no-src-dir --import-alias "@/*" --use-npm
cd {business-slug}
npm install gsap
```

GSAP 3.13+ ships `ScrollTrigger` and `SplitText` for free — `npm install gsap` is all you need.
No `src/` directory: `app/`, `components/`, `lib/`, `types/` live at the project root and the
`@/*` alias resolves to root (`@/lib/gsap`, `@/components/Hero/Hero`).

## File structure

```
app/
  layout.tsx          # <html>/<body>, next/font, mounts Nav + Cursor once
  page.tsx            # SERVER component — assembles the sections in order
  globals.css         # Tailwind @theme tokens + global styles + safe-area insets
lib/
  gsap.ts             # single GSAP plugin-registration point (import from here only)
  useMediaQuery.ts    # post-mount breakpoint hook for the desktop/mobile branch
types/
  brand.ts            # Brand + extract.json schema types
components/
  Nav/Nav.tsx
  Hero/{Hero.tsx, HeroCanvas.tsx, HeroText.tsx}
  Services/Services.tsx
  About/About.tsx
  Gallery/Gallery.tsx
  Booking/Booking.tsx
  Footer/Footer.tsx
  ui/{Button.tsx, Cursor.tsx}
  animations/<ModuleName>/<ModuleName>.tsx   # ported cinematic modules
public/
  assets/frames/      # hero JPEG frames (served at /assets/frames/)
```

One folder per component; the main file repeats the folder name. Sub-components of the same
feature live in the same folder (`Hero/HeroCanvas.tsx`, `Hero/HeroText.tsx`).

## Server vs client components

- `app/page.tsx` and `app/layout.tsx` stay **server components** (no `'use client'`).
- Any component that touches `window`, GSAP, canvas, or browser events is a **client
  component** — first line `'use client'`. That covers `Nav`, `Hero`, `HeroCanvas`,
  `HeroText`, `Cursor`, and every animation component.
- **`Hero.tsx` must be a client component** because it uses
  `dynamic(() => import('./HeroCanvas'), { ssr: false })` — Next.js forbids `ssr: false`
  inside a server component. `HeroCanvas` is dynamically imported (canvas/GSAP never run
  during SSR and stay out of the initial bundle).

## GSAP registration

Register plugins once in `lib/gsap.ts`; every component imports from there, never from
`'gsap'` directly. Registration is guarded with `typeof window !== 'undefined'` for SSR.

## Fonts & images

- **`next/font`** in `layout.tsx` for the brand's heading/body fonts — self-hosted, no layout
  shift, no extra network request.
- **`next/image`** for stock and gallery imagery — automatic sizing, lazy loading, modern
  formats. Verify each Unsplash URL returns 200 before using it.

## Design tokens — Tailwind v4 `@theme`

Map every brand color from Step 1 into five tokens in `app/globals.css`. They become utility
classes automatically (`bg-primary`, `text-accent`, ...):

```css
@import "tailwindcss";

@theme {
  --color-primary: [brand bg, e.g. #101010];
  --color-secondary: [slightly off bg];
  --color-text: [high contrast];
  --color-accent: [brand primary color];
  --color-muted: [captions only — never body text];
}

html { scroll-behavior: smooth; scroll-padding-top: 5rem; }
body {
  background-color: var(--color-primary);
  color: var(--color-text);
  overflow-x: hidden;
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
  padding-bottom: env(safe-area-inset-bottom);
}
```

Never write hex values inline in JSX — always use the token classes. When porting vanilla CSS
from a module, rewrite `var(--accent)` as `var(--color-accent)` (Tailwind v4 prefixes `@theme`
vars with `--color-`).

## JavaScript conventions

- Constant data (arrays, config) declared **outside** the component body so it is not recreated
  per render. `UPPER_CASE` for fixed values (`const TOTAL_FRAMES = 121`).
- Import order: React → libraries (`@/lib/gsap`) → components → assets.
- Every `addEventListener`, `requestAnimationFrame`, `ResizeObserver`, GSAP tween, and
  ScrollTrigger created in `useEffect` is cleaned up in the return (`ctx.revert()`, `.kill()`,
  `removeEventListener`).
- One component = one responsibility. If a component passes ~100 lines, split it into
  sub-components in the same folder.
- Guard refs before use in async callbacks (`if (canvasRef.current) { ... }`).

## Deploy

```bash
npm run build
npx vercel --yes --prod
```

No `vercel.json` — the App Router handles routing natively (the SPA rewrite file from the
Vite era is not needed and must not be added).
