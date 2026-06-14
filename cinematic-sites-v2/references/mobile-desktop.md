# Mobile-First, Distinct Desktop

Design the **mobile layout first** (375px base), then branch for desktop. Desktop is a
*different* design, not just a scaled-up phone.

## Philosophy

Write base styles for the smallest screen and override upward with Tailwind prefixes. Never
start from desktop and undo it with `max-md:`.

```jsx
// ✅ base = mobile, scales up
<section className="py-16 px-4 sm:px-8 md:py-32 md:px-16 lg:px-24">
<h2 className="text-4xl sm:text-5xl md:text-6xl">
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// ❌ desktop-first, then shrink
<section className="py-32 px-24 max-md:py-16 max-md:px-4">
```

## The hybrid split (how to make desktop genuinely different)

One component per section with shared data/logic. Use two tools to diverge the layout:

1. **Visual / layout differences** → Tailwind breakpoints (`md:` / `lg:`). Different grid,
   spacing, type scale, ordering.
2. **Structurally different desktop DOM** → the `useMediaQuery` hook (`lib/useMediaQuery.ts`).
   It returns `false` until mounted, so SSR always renders the mobile tree and the desktop
   variant swaps in after hydration — no hydration mismatch.

   ```tsx
   'use client'
   import { useMediaQuery } from '@/lib/useMediaQuery'

   export default function Showcase() {
     const isDesktop = useMediaQuery('(min-width: 768px)')
     return isDesktop ? <ShowcaseDesktop /> : <ShowcaseMobile />
   }
   ```

3. **Heavy GSAP** → `gsap.matchMedia()` to run complex motion only on desktop and a simplified
   version (or none) on mobile.

   ```js
   const mm = gsap.matchMedia()
   mm.add('(min-width: 768px)', () => { /* full 3D / split-text motion */ })
   mm.add('(max-width: 767px)', () => { /* simple fade */ })
   return () => mm.revert()
   ```

Prefer Tailwind breakpoints for most sections; reserve `useMediaQuery` for sections whose
desktop and mobile structure genuinely differ (different element trees, not just styling).

## Navbar — the house signature

Fixed, always visible, frosted-glass on scroll. See `component-templates/Nav.tsx`.

- `fixed top-0 inset-x-0 z-50`, transparent at top, `bg-primary/60 backdrop-blur` after scroll.
- Desktop links: `hidden md:flex`.
- Mobile: hamburger button (`md:hidden`, 44×44px) toggling a slide-in drawer animated with GSAP
  (`xPercent` 100 → 0). Drawer links are 44px tall and close the drawer on tap.
- `tel:` and `mailto:` links are clickable.

## Mobile non-negotiables

- `h-[100dvh]` for fullscreen — never `h-screen`/`100vh` (iOS browser-bar bug).
- `min-h-[44px]` on every interactive element (buttons, nav links, hamburger).
- CTAs stack with `flex-col sm:flex-row` — never two buttons side-by-side at 375px.
- Minimum `px-4` side padding on every section so content never touches the edge.
- `env(safe-area-inset-*)` on the body for notches and gesture bars.
- Type scales up from `text-4xl` (h1 minimum on mobile). `text-8xl` only at `lg:` and above.
- Custom cursor only on devices with hover: `max-md:hidden` + an early return on
  `window.matchMedia('(hover: none)').matches`. See `component-templates/ui-Cursor.tsx`.
