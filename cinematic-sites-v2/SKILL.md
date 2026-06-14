---
name: cinematic-sites-v2
description: Transform any website into a cinematic experience — brand analysis, AI-generated 3D hero animations (Nano Banana Pro + Kling), cinematic modules, and free Vercel deployment. Generates a Next.js (App Router) + React + TypeScript + GSAP + Tailwind CSS v4 project, mobile-first with a distinct desktop design. Four steps, one command. Triggers on "cinematic site", "cinematic-sites", "cinematic-sites-v2", "cinematic website", "transform this site", "make this site cinematic".
---

# Cinematic Sites v2

Transform any website into a cinematic experience with AI-generated 3D animations, scroll-driven
effects, and premium design — then deploy live. The generated site is a **Next.js + React +
TypeScript + GSAP** project: mobile-first, with a genuinely different desktop layout, and a fixed
always-visible navbar.

**Four steps. One command. Any business.**

```
/cinematic-sites https://example.com
```

## How this skill is organized

`SKILL.md` is the orchestrator. The detailed build guidance lives in `references/`:

- `references/site-architecture.md` — Next.js structure, scaffold, server/client rules, deploy.
- `references/mobile-desktop.md` — mobile-first → distinct desktop, the navbar, mobile rules.
- `references/animation-system.md` — module port recipe, import convention, 30-module map.
- `references/component-templates/` — copy-ready `.ts`/`.tsx`: `lib-gsap.ts`,
  `lib-useMediaQuery.ts`, `types-brand.ts`, `Nav.tsx`, `Hero.tsx`, `HeroCanvas.tsx`,
  `HeroText.tsx`, `ui-Button.tsx`, `ui-Cursor.tsx`, `AnimationModule.template.tsx`.

Read the references during Step 3. Don't inline their content here.

---

## Rubric Flows — live tracking (run during every build)

This skill is wired to the **Rubric Flows** dashboard. As you execute, emit progress so the
`cinematic-sites-v2` flow animates live. Use the helper in this skill folder:

```
bash ~/.claude/skills/cinematic-sites-v2/flows-track.sh <cmd>
```

It silently no-ops if the dashboard isn't running, so it never blocks a standalone build.

Step index → skillId:

| Step | index | skillId |
|------|-------|---------|
| Brand Analysis   | 0 | brand-analysis   |
| Scene Generation | 1 | scene-generation |
| Website Build    | 2 | website-build    |
| Deploy           | 3 | deploy           |

Emit `start` once, then per step `step <i> <skillId>`, `action <i> "<text>"` for notable
actions, `done <i>` when a step finishes, and `complete` at the end (`error <i> "<text>"` on
failure).

---

## HARD RULES (enforce every build)

These override any defaults. No exceptions.

### 1. No dark vignettes — no hero wrapper containers — backdrop pills on individual small elements only
Never add gradient overlays that darken hero edges. No radial gradient dimming the media. Never
wrap all hero content in a single backdrop container.

- **Big headlines (h1):** strong text-shadow only, no background:
  `text-shadow: 0 4px 30px rgba(0,0,0,.9), 0 2px 10px rgba(0,0,0,.7), 0 0 60px rgba(0,0,0,.5);`
- **Smaller text over video (subtitles, taglines, CTAs, scroll hints):** an individual solid
  pill on EACH element (`bg-[rgba(12,10,8,0.7)] px-3.5 py-1 backdrop-blur-sm`), never a shared
  wrapper.

### 2. Hero is scroll-driven via canvas frame sequence (never `video.currentTime`)
The hero scrubs with scroll position via canvas + preloaded JPEG frames. **Never** use
`<video>` + `video.currentTime` — browsers only seek to keyframes in compressed MP4s, causing
stutter. This has failed twice. Use `components/Hero/HeroCanvas.tsx` (canvas + ScrollTrigger).
The MP4 is a source artifact only; the site renders frames on canvas.

Extract frames: `ffmpeg -i video.mp4 -vf "fps=24,scale=1280:720" -q:v 4 public/assets/frames/frame-%04d.jpg`
Then set `TOTAL_FRAMES` in `HeroCanvas.tsx` to `ls public/assets/frames | wc -l`.

### 3. Always inline SVGs, never emojis
Every icon/illustration is an inline SVG (Lucide for standard UI icons). Never emoji characters.

### 4. Font + button contrast minimums
- Light themes: body text ≥ `#555`, labels ≥ `#444`. Dark themes: body ≥ `#999`, labels ≥ `#888`.
- `--color-muted` is for captions/metadata only — never primary paragraph text.
- Section labels (uppercase, letter-spaced) are `font-weight: 600` minimum.
- Set `color` explicitly on every button. White on dark/accent, dark (`#111`) on light/yellow.

### 5. Animations come from the on-disk library
The module library is the `cinematic-site-components/` folder — canonical path
`/Users/cex/Documents/Skills/cinematic-sites-agent-v2/cinematic-site-components/` (it sits beside
this skill in the source repo). Read module files directly from disk — there is no localhost
server and no port to ask for. Port modules to typed client components per
`references/animation-system.md`. You may also build custom GSAP animations, but follow the same
component template so the codebase stays consistent.

### 6. Next.js, TypeScript, mobile-first
The generated site is Next.js App Router + TypeScript + Tailwind v4 + GSAP. Mobile layout first,
then a distinct desktop design. Fixed always-visible navbar; hamburger drawer on mobile. Full
rules in `references/site-architecture.md` and `references/mobile-desktop.md`.

---

## Setup (first time only)

- **ffmpeg** — extracts JPEG frames. `brew install ffmpeg` (Mac).
- **Google AI Studio** — Nano Banana Pro images (free). Key at https://aistudio.google.com/apikey
  → `export GOOGLE_AI_STUDIO_KEY="AIza..."`.
- **WaveSpeed** — Kling video (~$0.42–0.56 / 5s). Key at https://wavespeed.ai/settings →
  `export WAVESPEED_API_KEY="..."`.
- **Vercel** — free deploy. `npm i -g vercel && vercel login`.

**Already have a hero video?** Skip Steps 1–2: place the MP4, extract frames (rule 2), go to Step 3.

---

## Step 1: Brand Analysis

Fetch the target site and extract brand identity.

```bash
curl -sL -o site_raw.html "<URL>" -A "Mozilla/5.0"
```

Extract: business name + category; color palette (primary/secondary/accent/bg/text hex); heading
+ body fonts; key copy (headline, tagline, services, CTA, contact); logo URL. Store structured in
`extract.json` (typed by `types/brand.ts`).

**Output:** generate `brand-card.html` (color swatches, font samples, copy, logo, suggested theme),
open it in the browser.

**Pause:** show the brand card. Ask "Does this look right? Any corrections?"

---

## Step 2: Scene Generation

### 2a. Suggest 3 concepts
A visual table — each with ONE hero object, a distinct style, and a clear animation description.
Rules: one subject + one action; cinematic not catalog (close-ups, shallow DoF, dramatic angles,
contextual environments); no default white backgrounds; only generate the FIRST FRAME (Kling
animates better from a single image + prompt).

### Cost check (ALWAYS show before any paid call)
- Image (Nano Banana Pro): **free**. Video (Kling/WaveSpeed): **~$0.42–0.56 / 5s** (10s = double).
  Deploy (Vercel): free. Typical total per site: **~$0.50–1.50**.
- Ask: "Ready to proceed? This will cost approximately $X on WaveSpeed." Wait for confirmation.

### 2b. Generate image (Nano Banana Pro)
`POST https://generativelanguage.googleapis.com/v1beta/models/nano-banana-pro-preview:generateContent?key=$KEY`
with `contents:[{parts:[{text: prompt}]}]` and `generationConfig:{responseModalities:['TEXT','IMAGE']}`.

### 2c. Animate (Kling via WaveSpeed)
Default **Kling O3 Pro** (`kwaivgi/kling-video-o3-pro/image-to-video`, ~$0.56). Output resolution
matches the input image — resize the source to **1920×1080** for 1080p (default) before uploading.
Upload to litterbox (24h), submit with `{ image, prompt, duration: 5, cfg_scale: 0.7, sound: false }`,
poll `…/predictions/{id}/result` every 15s, download to `public/assets/`.

### Extract frames
`ffmpeg -i video.mp4 -vf "fps=24,scale=1280:720" -q:v 4 public/assets/frames/frame-%04d.jpg`

### Error handling
Never silently skip a failed step. If Nano Banana fails, retry with a simpler prompt (3×, then ask
for the user's own image). If Kling fails (expired litterbox URL, image <300px, rate limit),
re-upload and retry (3×, then ask for the user's own video).

**Pause:** show the generated image and video. Wait for approval.

---

## Step 3: Website Build

Build a **Next.js App Router + TypeScript + Tailwind v4 + GSAP** site. Follow the references:

1. **Scaffold + architecture** → `references/site-architecture.md` (scaffold command, file
   structure, server/client rules, GSAP registration, `next/font`/`next/image`, `@theme` tokens,
   deploy). Map the Step-1 brand colors into the five `@theme` tokens.
2. **Mobile-first + navbar** → `references/mobile-desktop.md`. Author the mobile layout first,
   then a distinct desktop layout (Tailwind breakpoints + `useMediaQuery` for structurally
   different DOM). Fixed always-visible navbar with a mobile hamburger drawer.
3. **Animations** → `references/animation-system.md`. Pick 2–4 modules for the industry, port them
   to typed client components via the canonical recipe, import consistently from
   `@/components/animations/...` and GSAP only from `@/lib/gsap`.
4. **Templates** → copy from `references/component-templates/` and adapt: `lib/gsap.ts`,
   `lib/useMediaQuery.ts`, `types/brand.ts`, `Nav`, `Hero` trio, `ui/Button`, `ui/Cursor`,
   `AnimationModule.template.tsx`.

Section order: `Nav → Hero → Services → Gallery → About → Booking → Footer`, with `Cursor` mounted
in `layout.tsx`. Verify Unsplash URLs return 200 before using them.

**Pause:** run `npm run dev`, open the site in the browser for review.

---

## Step 4: Deploy

```bash
npm run build
npx vercel --yes --prod
```

Output: `https://{slug}.vercel.app`. No `vercel.json` — the App Router routes natively.

---

## Pause points

| After | Action |
|-------|--------|
| Step 1 | Show brand card. Confirm colors/copy. |
| Step 2 | Show generated image + video. Wait for approval. |
| Step 3 | Open the site in the browser for review. |

## Run button

This flow has a **Run** button in the Rubric Flows tab (workflow `cinematic-sites-v2`). It launches
an interactive Claude session in Terminal with the input you provide and tracks progress live via
`flows-track.sh`.
