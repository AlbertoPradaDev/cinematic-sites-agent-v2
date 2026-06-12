---
name: cinematic-sites-v2
description: Transform any website into a cinematic experience — brand analysis, AI-generated 3D hero animations (Nano Banana Pro + Kling 3.0 Pro), cinematic modules from the library, and free Vercel deployment. Built with React + Vite + Tailwind CSS v4, mobile-first, component-based architecture. Four steps, one command. Triggers on "cinematic site", "cinematic-sites", "cinematic-sites-v2", "cinematic website", "transform this site", "make this site cinematic".
---

# Cinematic Sites v2

Transform any website into a cinematic experience with AI-generated 3D animations, scroll-driven effects, and premium design — then deploy live.

**Four steps. One command. Any business.**

```
/cinematic-sites https://example.com
```

---

## HARD RULES (ENFORCE EVERY BUILD)

These override any defaults. No exceptions.

### 1. No dark vignettes — no wrapper containers — backdrop pills on INDIVIDUAL small elements only
Never add gradient overlays that darken the edges of hero sections. No radial gradients that dim the video. No `linear-gradient(to bottom, var(--bg), transparent)` masks on hero media. **Never wrap all hero content in a single backdrop container** (no background, border, border-radius, or backdrop-filter on `.hero-content`).

**For big headlines (h1):** Strong text-shadow ONLY, no background:
```css
text-shadow: 0 4px 30px rgba(0,0,0,.9), 0 2px 10px rgba(0,0,0,.7), 0 0 60px rgba(0,0,0,.5);
```

**For smaller text over video (subtitles, taglines, labels, scroll hints, CTAs):** Individual solid background pills on EACH element — not a shared wrapper:
```css
.hero .subtitle,
.hero .tagline,
.hero .cta,
.hero .scroll-hint {
  background: rgba(12,10,8,0.7);
  padding: 4px 14px;
  display: inline-block;
  backdrop-filter: blur(4px);
}
```
Apply this to EACH individual small text element. Never group them inside a single rounded rectangle container.

### 2. Hero is scroll-driven via canvas frame sequence (NEVER video.currentTime)
The hero MUST scrub with scroll position. Never autoplay loop. **Never use `<video>` + `video.currentTime`** — browsers can only seek to keyframes in compressed MP4s, causing visible lag/stutter on every build. This has failed twice. Canvas + JPEG frames is the only approach.

The `<video>` element and `hero-loop.mp4` are NOT used in the final site. Only `assets/frames/` matters. Keep the MP4 as a source artifact but the website renders frames on canvas.

```html
<section class="hero" style="height:300vh">
  <div class="hero-sticky" style="position:sticky;top:0;height:100vh;overflow:hidden">
    <canvas id="heroCanvas" style="position:absolute;top:0;left:0;display:block;z-index:1"></canvas>
    <!-- content overlaid here, z-index:2 -->
  </div>
</section>
```
```javascript
var canvas = document.getElementById('heroCanvas');
var ctx = canvas.getContext('2d');
var frames = [];
// IMPORTANT: set this to the actual frame count from ffmpeg extraction
// After running ffmpeg, count with: ls assets/frames/ | wc -l
var totalFrames = FRAME_COUNT; // e.g. 121 for 5s@24fps, 241 for 10s@24fps
var loaded = 0;

// Preload all frames
for (var i = 1; i <= totalFrames; i++) {
  var img = new Image();
  img.src = 'assets/frames/frame-' + String(i).padStart(4, '0') + '.jpg';
  img.onload = function() {
    loaded++;
    if (loaded === 1) drawFrame(0); // draw first frame immediately
    if (loaded === totalFrames) {
      var loader = document.getElementById('loader');
      if (loader) { loader.style.opacity = '0'; setTimeout(function() { loader.style.display = 'none'; }, 600); }
    }
  };
  frames.push(img);
}

// Size canvas to viewport (call on resize too)
function resize() {
  var w = window.innerWidth;
  var h = window.innerHeight;
  canvas.width = w;
  canvas.height = h;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
}
window.addEventListener('resize', resize);
resize();

// Draw a frame with cover-fit
function drawFrame(idx) {
  if (!frames[idx] || !frames[idx].complete) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  var r = Math.max(canvas.width / frames[idx].width, canvas.height / frames[idx].height);
  var w = frames[idx].width * r, h = frames[idx].height * r;
  ctx.drawImage(frames[idx], (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
}

// GSAP tween with snap for smooth frame stepping
gsap.to({ frame: 0 }, {
  frame: totalFrames - 1,
  snap: 'frame',
  ease: 'none',
  scrollTrigger: {
    trigger: '.hero',
    start: 'top top',
    end: 'bottom top',
    scrub: 0.3
  },
  onUpdate: function() {
    drawFrame(Math.round(this.targets()[0].frame));
  }
});
```

**Why `gsap.to` with `snap: 'frame'`** instead of `ScrollTrigger.create` with `onUpdate`: The snap ensures we always land on whole frame indices (no sub-frame interpolation), and the tween approach gives GSAP more control over the animation timing, resulting in smoother scrub.

Extract frames: `ffmpeg -i video.mp4 -vf "fps=24,scale=1280:720" -q:v 4 assets/frames/frame-%04d.jpg`

### 3. Always inline SVGs, never emojis
Every icon, illustration, and visual placeholder must be an inline SVG. Never use emoji characters. For standard UI icons, use Lucide via CDN. For custom visuals in mockups/cards, draw inline SVGs:
```html
<!-- Good -->
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <rect x="3" y="3" width="18" height="18" rx="2"/>
</svg>

<!-- Bad -->
&#x1f4d0;
```

### 4. Font contrast minimums
Body/paragraph text must meet these minimums:
- **Light themes:** body text minimum `#555`, labels minimum `#444`
- **Dark themes:** body text minimum `#999`, labels minimum `#888`
- `--muted` is for captions, metadata, and timestamps only — never for primary paragraph text
- Section labels (uppercase, letter-spaced) must be `font-weight: 600` minimum
- **Buttons:** text on colored backgrounds must always be explicitly high-contrast. White text (`#fff`) on dark/accent backgrounds, dark text (`#111`) on light/yellow backgrounds. Never inherit or assume — always set `color` explicitly on every button class. Test: if the background is darker than `#666`, text must be white.

### 5. Cinematic Modules is the library name
The interactive effects library is called **Cinematic Modules**. It is a separate package the user installs independently. On first run, ask the user: "Do you have Cinematic Modules installed? If so, what localhost port is it running on?" Store the answer and use it for all module fetches. If the user doesn't have it, the site can still be built — just skip the module integration step and use standard GSAP scroll animations instead.

---

## Setup (First Time Only)

### Prerequisites
- **ffmpeg** — required for extracting JPEG frames from video (the core of scroll animation). Install: `brew install ffmpeg` (Mac), `choco install ffmpeg` (Windows), or `apt install ffmpeg` (Linux).

### 1. Google AI Studio (for Nano Banana Pro image generation)
- Go to: https://aistudio.google.com/apikey
- Sign in with your Google account
- Click "Create API key" → select any Google Cloud project (or create one)
- Copy the key (starts with `AIza...`)
- Set as environment variable: `export GOOGLE_AI_STUDIO_KEY="AIza...your-key"`
- Free tier: generous daily quota, no credit card required

### 2. WaveSpeed (for Kling video generation)
- Go to: https://wavespeed.ai and sign up
- Add credits: https://wavespeed.ai/billing — $5 gets you ~10 videos
- Get your API key: https://wavespeed.ai/settings → API Keys → Create
- Set as environment variable: `export WAVESPEED_API_KEY="your-key"`
- Cost: ~$0.42-0.56 per 5s video depending on model

### 3. Vercel (for free deployment — optional)
- Install: `npm i -g vercel`
- Run: `vercel login` (creates a free Hobby account if you don't have one)
- Free tier: unlimited static sites, custom domains, SSL included
- No API key needed — the CLI handles auth via browser login

### 4. Cinematic Modules (optional, enhances output)
- Clone: `git clone https://github.com/robonuggets/cinematic-site-components.git`
- Serve locally: `cd cinematic-site-components && npx serve -p 3457` (or any port)
- The skill will ask for the port on first run
- Without this, sites still work — they just use standard GSAP scroll animations instead of the premium module effects

### Already have a hero video?
If you already have a video (from Kling, Veo, or anything else), skip Steps 1-2 entirely. Just place the MP4 in your project folder and jump to frame extraction:
```bash
ffmpeg -i your-video.mp4 -vf "fps=24,scale=1280:720" -q:v 4 assets/frames/frame-%04d.jpg
```
Then go straight to Step 3 (Website Build).

---

## Step 1: Brand Analysis

Fetch the target website and extract brand identity.

### What to Extract
- Business name and category
- Color palette (primary, secondary, accent, background, text — hex codes)
- Typography (heading and body fonts)
- Key copy (headline, tagline, services, CTA, contact info)
- Logo URL
- Screenshots (if JS-rendered, try fetching with a browser user-agent or use WebFetch)

### How
```bash
curl -sL -o site_raw.html "<URL>" -A "Mozilla/5.0"
```

### Output: Visual Brand Card
Generate `brand-card.html` showing color swatches, font samples, extracted copy, logo preview, suggested theme. Open in browser for review.

### Pause Point
Show the brand card. Ask: "Does this look right? Any corrections?"

---

## Step 2: Scene Generation

### 2a. Suggest 3 Concepts
Present a visual table — each with ONE hero object, distinct visual style, clear animation description with motion words.

### Scene Design Rules
- **One subject, one action.** Single hero item, 2-3 supporting elements max.
- **Cinematic, not catalog.** Close-ups, shallow depth of field, dramatic angles. Contextual environments.
- **NO default white backgrounds.** Match environment to industry.
- **Only generate the FIRST FRAME.** Kling animates better from a single image + descriptive prompt.

### Cost Check (ALWAYS show before proceeding)
Before generating anything, tell the user the expected cost:
- **Image generation (Nano Banana Pro):** Free — no cost
- **Video generation (Kling via WaveSpeed):** ~$0.42-0.56 per 5s video depending on model. 10s video costs double.
- **Deployment (Vercel):** Free
- **Total per site:** Typically ~$0.50-1.50

Ask: "Ready to proceed? This will cost approximately $X on WaveSpeed." Wait for confirmation before making any paid API call.

### 2b. Generate Image (Nano Banana Pro)
```javascript
const res = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/nano-banana-pro-preview:generateContent?key=${KEY}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
    })
  }
);
```

### 2c. Animate (Kling via WaveSpeed)

**Model options (ask the user which to use):**
| Model | Endpoint slug | Cost/5s | Notes |
|-------|--------------|---------|-------|
| **Kling O3 Pro** (latest) | `kwaivgi/kling-video-o3-pro/image-to-video` | $0.56 | Best quality, latest model |
| Kling v3.0 Pro | `kwaivgi/kling-v3.0-pro/image-to-video` | $0.56 | Previous gen, proven reliable |
| Kling O3 Standard | `kwaivgi/kling-video-o3-std/image-to-video` | $0.42 | Budget option, still good |
| Kling v3.0 Standard | `kwaivgi/kling-v3.0-std/image-to-video` | $0.42 | Budget previous gen |

**Default: Kling O3 Pro** unless the user specifies otherwise.

**Resolution control (720p vs 1080p):**
WaveSpeed has NO resolution parameter — output resolution matches the INPUT IMAGE dimensions. To control output resolution:
- **1080p (default):** Generate or resize the source image to **1920x1080** before uploading
- **720p:** Resize source image to **1280x720** before uploading

Always default to 1080p. Resize with:
```bash
ffmpeg -i input.jpg -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" -q:v 2 input_1080p.jpg
```

Upload to litterbox (NOT catbox):
```bash
curl -s -F "reqtype=fileupload" -F "time=24h" -F "fileToUpload=@image.jpg" https://litterbox.catbox.moe/resources/internals/api.php
```

Submit:
```javascript
await fetch('https://api.wavespeed.ai/api/v3/kwaivgi/kling-video-o3-pro/image-to-video', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ image: litterboxUrl, prompt, duration: 5, cfg_scale: 0.7, sound: false })
});
```

**Available params:**
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `image` | string (URL) | required | Source image (litterbox URL) |
| `prompt` | string | optional | Motion description |
| `negative_prompt` | string | optional | What to exclude |
| `end_image` | string (URL) | optional | End frame (only for specific transitions) |
| `duration` | int | 5 | 3-15 seconds |
| `cfg_scale` | float | 0.5 | 0-1, higher = stricter prompt adherence |
| `sound` | bool | false | Generate audio (adds ~25-50% cost) |
| `shot_type` | string | "customize" | "customize" or "intelligent" |
| `multi_prompt` | array | optional | Multiple shots with per-shot prompts |
| `element_list` | array | optional | Visual element consistency (max 3) |

Poll `https://api.wavespeed.ai/api/v3/predictions/{id}/result` every 15s. Download to the project's `assets/` folder.

### Error Handling
- **Nano Banana Pro fails:** Tell the user the image generation failed and suggest retrying with a simpler prompt. If it fails 3 times, ask if they have their own image to use instead.
- **WaveSpeed/Kling fails:** Tell the user the video generation failed. Common causes: image URL expired (litterbox has 24hr expiry), image too small (<300px), or rate limit. Suggest re-uploading the image and retrying. If it fails 3 times, ask if they have their own video.
- **Never silently skip a failed step.** Always inform the user what happened and what the options are.

### Extract Frames
```bash
# For 1080p source video — extract at full res
ffmpeg -i video.mp4 -vf "fps=24" -q:v 3 assets/frames/frame-%04d.jpg

# For scroll animation (lighter files) — downscale to 720p
ffmpeg -i video.mp4 -vf "fps=24,scale=1280:720" -q:v 4 assets/frames/frame-%04d.jpg
```

---

## Step 3: Website Build

### Architecture — React + Vite + Tailwind CSS v4

Every cinematic site is built as a **React + Vite** project. No single-file HTML. No CDN scripts. This gives code splitting, lazy loading for heavy components (Three.js), and clean component isolation per section.

**Setup: scaffold the project**
```bash
npm create vite@latest {business-slug} -- --template react
cd {business-slug}
npm install gsap @gsap/react react-router-dom
npm install -D tailwindcss @tailwindcss/vite
```

**`vite.config.js`** — siempre incluir code splitting para GSAP y Three.js (si se usa):
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/three')) return 'three'
          if (id.includes('node_modules/gsap')) return 'gsap'
        },
      },
    },
  },
})
```

**`vercel.json`** — required for SPA client-side routing:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### File Structure

### File Structure

Cada componente en su propia carpeta, siguiendo el modelo barbershop. El nombre del archivo repite el nombre de la carpeta:

```
src/
├── App.jsx                         # Ensambla todas las secciones
├── main.jsx                        # BrowserRouter + Routes
├── index.css                       # Tailwind @theme + tokens + estilos globales
├── lib/
│   └── gsap.js                     # Registro de plugins — importar siempre desde aquí
├── assets/
│   └── images/                     # Imágenes locales (logo, about, etc.)
└── components/
    ├── Cursor/
    │   └── Cursor.jsx              # Cursor personalizado (solo desktop)
    ├── Button/
    │   └── Button.jsx              # CTA reutilizable
    ├── Nav/
    │   └── Nav.jsx                 # Navbar fija con hamburger en mobile
    ├── Hero/
    │   ├── Hero.jsx                # Layout del hero + lazy-load del canvas
    │   ├── HeroCanvas.jsx          # Canvas + secuencia de frames JPEG (lazy)
    │   └── HeroText.jsx            # Headline animado + CTA
    ├── Services/
    │   └── Services.jsx
    ├── About/
    │   └── About.jsx
    ├── Gallery/
    │   └── Gallery.jsx
    ├── Booking/
    │   └── Booking.jsx
    └── Footer/
        └── Footer.jsx
```

**Regla:** cada carpeta tiene exactamente un archivo principal con el mismo nombre que la carpeta. Los subcomponentes del mismo feature van en la misma carpeta (ej: `HeroCanvas.jsx` y `HeroText.jsx` dentro de `Hero/`).

### Design System — Tailwind `@theme`

Define brand tokens in `src/index.css` using Tailwind v4's `@theme` directive. These become utility classes automatically (`bg-primary`, `text-accent`, etc.):

```css
@import "tailwindcss";

@theme {
  --color-primary: [brand bg, e.g. #101010];
  --color-secondary: [slightly off bg, e.g. #1A1A1A];
  --color-text: [high contrast, e.g. #F5F0E8];
  --color-accent: [brand primary color];
  --color-muted: [for captions only, NOT body text];
}

html {
  scroll-behavior: smooth;
  scroll-padding-top: 5rem;
}

body {
  background-color: theme(--color-primary);
  color: theme(--color-text);
  font-family: 'Outfit', sans-serif;
  overflow-x: hidden;
}

h1, h2, h3, h4 {
  font-family: 'Outfit', sans-serif;
  letter-spacing: 0.02em;
}
```

Map every brand color from Step 1 into these five tokens. Use Tailwind classes throughout — never inline hex values in JSX.

### GSAP Library Setup

Always register plugins in one place. Every component imports from here, never directly from `'gsap'`:

**`src/lib/gsap.js`**
```js
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(ScrollTrigger, SplitText)

export { gsap, ScrollTrigger, SplitText }
```

### GSAP Component Pattern

### GSAP Component Pattern

Todas las animaciones siguen este patrón: `useRef` → `useEffect` → `gsap.context()` → cleanup con `ctx.revert()`. Previene memory leaks y bleeding de animaciones entre renders.

```jsx
// src/components/Services/Services.jsx
import { useEffect, useRef } from 'react'
import { gsap } from '../../lib/gsap'

// Datos fuera del componente — no se recrean en cada render
const SERVICES = [
  { id: 'corte', label: 'Corte', description: '...', price: 'Desde €15' },
  { id: 'barba', label: 'Barba', description: '...', price: 'Desde €10' },
]

export default function Services() {
  const sectionRef = useRef(null)
  const titleRef  = useRef(null)
  const cardsRef  = useRef([])

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(titleRef.current,
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: titleRef.current, start: 'top 80%' }
        }
      )

      gsap.fromTo(cardsRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.15, ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 65%' }
        }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    // Mobile-first: base = mobile, md: = tablet, lg: = desktop
    <section ref={sectionRef} id="services" className="py-16 px-4 sm:px-8 md:py-32 md:px-16 lg:px-24 bg-primary">
      <h2 ref={titleRef} className="text-4xl sm:text-5xl md:text-6xl font-black uppercase leading-none">
        Nossos Serviços
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-10 md:mt-16">
        {SERVICES.map((service, i) => (
          <div
            key={service.id}
            ref={(el) => { if (el) cardsRef.current[i] = el }}
            className="p-6 sm:p-8 md:p-10 border border-text/10 bg-secondary"
          >
            <h3 className="text-2xl sm:text-3xl font-black uppercase mb-3">{service.label}</h3>
            <p className="text-sm text-text/50 leading-relaxed mb-6">{service.description}</p>
            <span className="text-lg font-bold">{service.price}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
```

### Hero Component Pattern

El hero se divide en tres archivos dentro de `Hero/`: `Hero.jsx` gestiona el layout y lazy-carga el canvas; `HeroCanvas.jsx` tiene toda la lógica del canvas; `HeroText.jsx` tiene el headline animado.

**`src/components/Hero/Hero.jsx`** — layout only:
```jsx
import { lazy, Suspense } from 'react'
import HeroText from './HeroText'

const HeroCanvas = lazy(() => import('./HeroCanvas'))

export default function Hero() {
  return (
    // h-[100dvh] usa dynamic viewport height — evita el bug del browser bar en mobile
    <section id="hero" style={{ height: '300vh' }} className="relative">
      <div className="sticky top-0 h-[100dvh] w-full overflow-hidden bg-primary">
        <Suspense fallback={null}>
          <HeroCanvas />
        </Suspense>
        {/* Overlay más fuerte en mobile para que el texto sea legible */}
        <div className="absolute inset-0 bg-primary/70 md:bg-transparent pointer-events-none z-10" />
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <HeroText />
        </div>
      </div>
    </section>
  )
}
```

**`src/components/Hero/HeroCanvas.jsx`** — canvas + secuencia de frames JPEG:
```jsx
import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '../../lib/gsap'

export default function HeroCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const frames = []
    const totalFrames = FRAME_COUNT // set after ffmpeg extraction
    let loaded = 0

    // Preload all frames
    for (let i = 1; i <= totalFrames; i++) {
      const img = new Image()
      img.src = `/assets/frames/frame-${String(i).padStart(4, '0')}.jpg`
      img.onload = () => {
        loaded++
        if (loaded === 1) drawFrame(0)
      }
      frames.push(img)
    }

    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      canvas.style.width = window.innerWidth + 'px'
      canvas.style.height = window.innerHeight + 'px'
    }
    window.addEventListener('resize', resize)
    resize()

    function drawFrame(idx) {
      if (!frames[idx]?.complete) return
      const r = Math.max(canvas.width / frames[idx].width, canvas.height / frames[idx].height)
      const w = frames[idx].width * r, h = frames[idx].height * r
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(frames[idx], (canvas.width - w) / 2, (canvas.height - h) / 2, w, h)
    }

    const tween = gsap.to({ frame: 0 }, {
      frame: totalFrames - 1,
      snap: 'frame',
      ease: 'none',
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 0.3,
      },
      onUpdate() { drawFrame(Math.round(this.targets()[0].frame)) },
    })

    // Hero text fade-out on scroll (always include)
    const textFade = gsap.to('.hero-text', {
      opacity: 0, y: -60, ease: 'none',
      scrollTrigger: { trigger: '#hero', start: '10% top', end: '35% top', scrub: true }
    })

    return () => {
      window.removeEventListener('resize', resize)
      tween.kill()
      textFade.kill()
      ScrollTrigger.getAll().forEach(t => t.kill())
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ opacity: 0 }} />
}
```

**`src/components/Hero/HeroText.jsx`** — headline animado con SplitText, mobile-first:
```jsx
import { useEffect, useRef } from 'react'
import { gsap, SplitText } from '../../lib/gsap'
import Button from '../Button/Button'

export default function HeroText() {
  const containerRef = useRef(null)
  const taglineRef   = useRef(null)
  const titleRef     = useRef(null)
  const subtitleRef  = useRef(null)
  const buttonsRef   = useRef(null)

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

  return (
    // Mobile: centrado y stack vertical. md: alineado a la izquierda si aplica
    <div ref={containerRef} className="hero-text flex flex-col gap-4 items-center text-center px-6 sm:px-10">
      <span ref={taglineRef} className="text-xs tracking-[0.3em] uppercase text-accent">
        [brand tagline]
      </span>
      {/* Mobile: text-5xl. Escala hacia arriba en breakpoints mayores */}
      <h1
        ref={titleRef}
        className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase leading-none"
        style={{ perspective: '400px', textShadow: '0 4px 30px rgba(0,0,0,.9), 0 2px 10px rgba(0,0,0,.7)' }}
      >
        [Brand Name]
      </h1>
      <p ref={subtitleRef} className="text-sm md:text-base text-text/60 max-w-xs sm:max-w-sm leading-relaxed">
        [tagline]
      </p>
      {/* Stack vertical en mobile, horizontal en sm+ */}
      <div ref={buttonsRef} className="flex flex-col sm:flex-row gap-3 mt-2 w-full sm:w-auto">
        <Button href="#contact" variant="primary">CTA Principal</Button>
        <Button href="#gallery" variant="outline">Ver Trabalhos</Button>
      </div>
    </div>
  )
}
```

### Custom Cursor

Siempre incluir en `App.jsx`. Se oculta en dispositivos táctiles vía CSS y no registra eventos en touch:

```jsx
// src/components/Cursor/Cursor.jsx
import { useEffect, useRef } from 'react'
import { gsap } from '../../lib/gsap'

export default function Cursor() {
  const dotRef  = useRef(null)
  const ringRef = useRef(null)

  useEffect(() => {
    // No registrar nada en dispositivos táctiles
    if (window.matchMedia('(hover: none)').matches) return

    const dot  = dotRef.current
    const ring = ringRef.current
    const SELECTOR = 'a, button, input, select, textarea'

    const onMove = (e) => {
      gsap.to(dot,  { x: e.clientX, y: e.clientY, duration: 0.1, ease: 'power2.out' })
      gsap.to(ring, { x: e.clientX, y: e.clientY, duration: 0.4, ease: 'power2.out' })
    }
    const onOver = (e) => {
      if (e.target.closest(SELECTOR)) {
        gsap.to(ring, { scale: 2.5, opacity: 0.5, duration: 0.3 })
        gsap.to(dot,  { scale: 0, duration: 0.3 })
      }
    }
    const onOut = (e) => {
      if (!e.relatedTarget?.closest(SELECTOR)) {
        gsap.to(ring, { scale: 1, opacity: 1, duration: 0.3 })
        gsap.to(dot,  { scale: 1, duration: 0.3 })
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

  // max-md:hidden lo oculta en pantallas pequeñas incluso si hay ratón
  return (
    <>
      <div ref={dotRef}  className="max-md:hidden fixed top-0 left-0 w-2 h-2 bg-text rounded-full pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2" />
      <div ref={ringRef} className="max-md:hidden fixed top-0 left-0 w-8 h-8 border border-text/60 rounded-full pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2" />
    </>
  )
}
```

### Reusable Button Component

```jsx
// src/components/Button/Button.jsx

// Tamaño mínimo de tap target: 44px (recomendación WCAG / Apple HIG)
const SIZES = {
  sm: 'text-xs px-5 min-h-[44px]',
  md: 'text-sm px-8 min-h-[44px] md:min-h-[52px]',
}

const VARIANTS = {
  primary: 'bg-accent text-white hover:bg-accent/80 active:bg-accent/60',
  outline: 'border border-text/30 text-text hover:border-text hover:bg-text/5 active:bg-text/10',
}

export default function Button({ href, variant = 'primary', size = 'md', children, className = '', ...props }) {
  const base = 'inline-flex items-center justify-center font-bold uppercase tracking-widest transition-all duration-300 select-none'

  return (
    <a
      href={href}
      className={`${base} ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </a>
  )
}
```

### App Assembly

```jsx
// src/App.jsx
import Nav     from './components/Nav/Nav'
import Hero    from './components/Hero/Hero'
import Services from './components/Services/Services'
import Gallery from './components/Gallery/Gallery'
import About   from './components/About/About'
import Booking from './components/Booking/Booking'
import Footer  from './components/Footer/Footer'
import Cursor  from './components/Cursor/Cursor'

export default function App() {
  return (
    <main className="bg-primary text-text">
      <Cursor />
      <Nav />
      <Hero />
      <Services />
      <Gallery />
      <About />
      <Booking />
      <Footer />
    </main>
  )
}
```

### Mobile-First

**Filosofía:** escribe los estilos base para la pantalla más pequeña (375px) y usa prefijos de Tailwind para sobreescribir hacia arriba. Nunca al revés.

```jsx
// ✅ Correcto — base mobile, escala hacia arriba
<section className="py-16 px-4 sm:px-8 md:py-32 md:px-16 lg:px-24">
<h2 className="text-4xl sm:text-5xl md:text-6xl">
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
<div className="flex flex-col sm:flex-row gap-3">

// ❌ Incorrecto — empieza desde desktop y intenta reducir
<section className="py-32 px-24 max-md:py-16 max-md:px-4">
```

**Reglas obligatorias mobile:**

`h-[100dvh]` en lugar de `h-screen` — `100dvh` se adapta a la barra del navegador en iOS/Android; `100vh` no lo hace y causa scroll inesperado.

Tap targets mínimo 44×44px en todos los elementos interactivos — botones, links de nav, hamburger. Usar `min-h-[44px]` y padding generoso.

Hamburger menu en la Nav para pantallas `< md`. El menú de escritorio se oculta con `hidden md:flex`.

Padding lateral mínimo `px-4` en todas las secciones para que el contenido nunca toque el borde de pantalla.

Fuentes: `text-4xl` como mínimo para h1 en mobile (nunca inferior). Los `text-8xl` son solo para `lg:` o superiores.

Botones en stack vertical en mobile con `flex-col sm:flex-row` — no dos botones en fila que se aplanen en 375px.

`padding: env(safe-area-inset-*)` en el body para soportar notches y gestos de iOS:
```css
body {
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
  padding-bottom: env(safe-area-inset-bottom);
}
```

GSAP y animaciones pesadas: desactivar en mobile con `gsap.matchMedia`:
```js
// Dentro de useEffect + gsap.context
const mm = gsap.matchMedia()
mm.add('(min-width: 768px)', () => {
  // Animaciones complejas solo en desktop
  gsap.fromTo(element, { rotationX: -90 }, { rotationX: 0, ... })
})
mm.add('(max-width: 767px)', () => {
  // Versión simplificada para mobile
  gsap.fromTo(element, { opacity: 0 }, { opacity: 1, duration: 0.4 })
})
return () => mm.revert()
```

---

### Buenas Prácticas JavaScript

**Datos fuera del componente** — los arrays y objetos constantes se declaran fuera de la función del componente para que no se recreen en cada render:
```js
// ✅ Fuera del componente
const NAV_LINKS = [
  { label: 'Servicios', href: '#services' },
  { label: 'Sobre', href: '#about' },
]
export default function Nav() { ... }

// ❌ Dentro del componente — se recrea en cada render
export default function Nav() {
  const links = [{ label: 'Servicios', href: '#services' }]
}
```

**Constantes en UPPER_CASE** para valores que no cambian: `const TOTAL_FRAMES = 121`, `const EASING = 'power3.out'`.

**Un componente = una responsabilidad** — si un componente supera ~100 líneas, separar en subcomponentes dentro de la misma carpeta. `Hero.jsx` solo hace layout; `HeroCanvas.jsx` hace canvas; `HeroText.jsx` hace animación de texto.

**Limpiar siempre** — todo `addEventListener`, `requestAnimationFrame`, GSAP tween, o ScrollTrigger creado en `useEffect` debe tener su correspondiente cleanup en el return:
```js
useEffect(() => {
  const ctx = gsap.context(...)
  window.addEventListener('resize', handleResize)
  const observer = new ResizeObserver(handleResize)
  observer.observe(canvas)

  return () => {
    ctx.revert()
    window.removeEventListener('resize', handleResize)
    observer.disconnect()
  }
}, [])
```

**Importaciones ordenadas** — primero librerías externas, luego imports internos:
```js
// 1. React
import { useEffect, useRef, useState } from 'react'
// 2. Librerías
import { gsap } from '../../lib/gsap'
// 3. Componentes propios
import Button from '../Button/Button'
// 4. Assets
import heroImg from '../../assets/images/hero.jpg'
```

**Props explícitas con defaults** — nunca dejar props sin valor por defecto cuando sean opcionales:
```js
export default function Button({ href, variant = 'primary', size = 'md', className = '', children, ...props }) {
```

**Evitar `null` y `undefined` en refs sin guardia** — antes de usar `ref.current` en callbacks asincrónicos, comprobar que existe:
```js
// ✅
if (canvasRef.current) {
  canvasRef.current.width = window.innerWidth
}
// Al asignar a arrays de refs:
ref={(el) => { if (el) cardsRef.current[i] = el }}
```

---
Use this cubic-bezier for all interactive transitions throughout the site:
```css
transition: all 0.4s cubic-bezier(.16, 1, .3, 1);
```

### Stock Photos
Search Unsplash: `https://unsplash.com/s/photos/{search-term}`
Use format: `https://images.unsplash.com/photo-{ID}?w={width}&h={height}&fit=crop&q=80`
Verify each loads (200 status) before using. Use as `<img src="...">` in JSX.

### Quality Standards

**Animaciones:**
- GSAP `gsap.context()` + `ctx.revert()` en todos los componentes con animaciones
- `SplitText` en headlines del hero
- `gsap.matchMedia()` para desactivar o simplificar animaciones en mobile
- Magnetic button en CTAs principales (solo desktop via `matchMedia`)

**Mobile-first:**
- `h-[100dvh]` para fullscreen — nunca `h-screen` en mobile
- Tap targets `min-h-[44px]` en todos los elementos interactivos
- Hamburger menu funcional en Nav para `< md`
- Botones CTAs en `flex-col sm:flex-row` — nunca fila forzada en mobile
- `env(safe-area-inset-*)` en el body del CSS global
- Padding mínimo `px-4` en todas las secciones
- Tipografía escalada: `text-4xl md:text-6xl lg:text-8xl` — nunca empezar desde tamaños grandes

**Estructura:**
- Datos constantes fuera del cuerpo del componente
- Un componente = una responsabilidad (Hero / HeroCanvas / HeroText separados)
- Imports ordenados: React → librerías → componentes → assets
- Limpieza de todos los listeners y tweens en el return del `useEffect`

**UI/UX:**
- Cursor custom solo en desktop (`max-md:hidden` + `matchMedia hover:none`)
- Navbar: frosted glass (`backdrop-blur`, `bg-primary/60`), scroll transition
- Links `tel:` y `mailto:` clicables
- Imágenes Unsplash verificadas con fetch antes de incluirlas
- Nunca colores hex inline en JSX — siempre clases Tailwind (`text-accent`, `bg-primary`)

---

### Cinematic Modules Integration

### Source
The Cinematic Modules library is a separate package (`cinematic-site-components`) that the user installs and runs locally. It contains 30 standalone HTML modules organized into 4 categories. The port varies per user — ask on first run if not already known.

### How to Use Modules in React
1. **Pick 2-4 modules** that match the brand's industry and vibe
2. **Fetch the module HTML**: `curl -sL http://localhost:{PORT}/{module-name}` (no .html extension — it redirects). Use the port the user provided.
3. **Read the CSS and JS** from the fetched HTML
4. **Create a React component** for each module. Move the CSS into Tailwind classes or a `<style>` tag inside the component, and move the JS into `useEffect` + `gsap.context()` + cleanup. Remap all colors to Tailwind tokens (`text-accent`, `bg-primary`, etc.) — never hardcode hex values.

**Module → React component template:**
```jsx
// src/components/[ModuleName]/[ModuleName].jsx
import { useEffect, useRef } from 'react'
import { gsap } from '../../lib/gsap'

export default function ModuleName() {
  const sectionRef = useRef(null)

  useEffect(() => {
    const mm = gsap.matchMedia()

    mm.add('(min-width: 768px)', () => {
      const ctx = gsap.context(() => {
        // JS del módulo adaptado — solo en desktop
        // Reemplazar document.querySelector por refs
        // var(--accent) → var(--color-accent)
      }, sectionRef)
      return () => ctx.revert()
    })

    mm.add('(max-width: 767px)', () => {
      const ctx = gsap.context(() => {
        // Versión simplificada para mobile si aplica
      }, sectionRef)
      return () => ctx.revert()
    })

    return () => mm.revert()
  }, [])

  return (
    // Mobile-first: base = mobile, escalado hacia arriba
    <section ref={sectionRef} id="module-section" className="relative py-16 px-4 sm:px-8 md:py-24 md:px-16 bg-primary">
      {/* HTML del módulo convertido a JSX */}
    </section>
  )
}
```

**Key adaptation rules when porting vanilla JS to React:**
- `document.querySelector('.class')` → use `useRef` + ref
- `var(--accent)` → `var(--color-accent)` (Tailwind v4 token prefix)
- `classList.add` → React state or `gsap.set`
- `addEventListener` → inside `useEffect`, removed in cleanup return
- All `var`, `let`, `const` → valid inside `useEffect` closure

### Module Selection Guide by Industry

| Industry | Recommended Modules |
|----------|-------------------|
| Luxury (jewelry, watches, perfume) | Text Mask Reveal, Curtain Reveal, Spotlight Border Cards, Zoom Parallax |
| Food (pizza, bakery, sushi, chocolate) | Color Shift, Zoom Parallax, Kinetic Marquee, Accordion Slider |
| Tech (keyboard, camera, laptop, SaaS) | Glitch Effect, Text Scramble, Magnetic Grid, 3D Tilt Cards |
| Creative (florist, architecture, music) | SVG Draw, Image Trail, Mesh Gradient, Curtain Reveal |
| Service (cleaning, moving, consulting) | Odometer Counter, Sticky Stack, Particle Button, Kinetic Marquee |
| Furniture / Interior (IKEA, décor) | Text Mask Reveal, Odometer Counter, Sticky Stack, Spotlight Border Cards, Kinetic Marquee |
| Portfolio / Agency | Accordion Slider, Cursor-Reactive Environment, Zoom Parallax, Horizontal Scroll |

### Full Module Reference (30 modules)

**Scroll-Driven (9):**
| Module | Slug | Best For |
|--------|------|----------|
| Text Mask Reveal | `text-mask` | Brand name reveal, hero headlines |
| Sticky Stack | `sticky-stack` | How-it-works, feature sections with pinned visual |
| Zoom Parallax | `zoom-parallax` | Cinematic depth, product reveal after scroll-through |
| Horizontal Scroll Hijack | `horizontal-scroll` | Portfolio galleries, case study showcases |
| Sticky Cards | `sticky-cards` | Step-by-step processes, stacking narratives |
| SVG Draw | `svg-draw` | Logo reveals, architectural line art |
| Curtain Reveal | `curtain-reveal` | Before/after, dramatic brand reveals |
| Split Screen | `split-scroll` | Two-column scrolling content (images vs text) |
| Color Shift | `color-shift` | Background mood transitions between sections |

**Cursor & Hover (8):**
| Module | Slug | Best For |
|--------|------|----------|
| Cursor-Reactive Environment | `cursor-reactive` | Full-page cursor glow + 3D tilt cards + magnetic buttons + click ripples |
| Accordion Slider | `accordion-slider` | Service showcases, portfolio panels (horiz + vertical) |
| Cursor Reveal | `cursor-reveal` | Before/after image comparison |
| Image Trail | `image-trail` | Portfolio hover, cursor following image ghosts |
| 3D Flip Cards | `flip-cards` | Feature cards with front/back content |
| Magnetic Grid | `magnetic-grid` | Dot grid that reacts to cursor proximity |
| Spotlight Border Cards | `spotlight-border` | Service/feature grids with cursor-tracking border glow |
| Drag-to-Pan | `drag-pan` | Mood boards, gallery exploration |

**Click & Tap (6):**
| Module | Slug | Best For |
|--------|------|----------|
| View Transition Morphing | `view-transitions` | Page transitions, card-to-detail expansion |
| Particle Button | `particle-button` | CTA buttons with burst effect on click |
| Odometer Counter | `odometer` | Stats sections, rolling mechanical number counters |
| 3D Coverflow Carousel | `coverflow` | Testimonial or portfolio carousels |
| Dynamic Island | `dynamic-island` | Notification bars, status indicators |
| macOS Dock | `dock-nav` | Navigation bars with magnification effect |

**Ambient & Auto (7):**
| Module | Slug | Best For |
|--------|------|----------|
| Text Scramble | `text-scramble` | Headlines that decode character-by-character (Matrix-style) |
| Kinetic Marquee | `kinetic-marquee` | Brand strips, tech stacks, service lists — scroll-reactive speed |
| Mesh Gradient | `mesh-gradient` | Animated background blobs, ambient atmosphere |
| Circular Text | `circular-text` | Spinning badge/stamp elements |
| Glitch Effect | `glitch-effect` | Tech/hacker aesthetic headlines |
| Typewriter | `typewriter` | Sequential text reveal with blinking cursor |
| Gradient Stroke Text | `gradient-stroke` | Outlined text with animated gradient fill |

### Key Implementation Patterns (from the modules)

**3D Tilt Cards (from cursor-reactive):**
```javascript
card.addEventListener('mousemove', function(e) {
  var rect = card.getBoundingClientRect();
  var x = (e.clientX - rect.left) / rect.width - 0.5;
  var y = (e.clientY - rect.top) / rect.height - 0.5;
  card.style.transform = 'perspective(600px) rotateY(' + (x * 12) + 'deg) rotateX(' + (-y * 12) + 'deg) scale(1.02)';
  // Spotlight gradient follows cursor
  spot.style.background = 'radial-gradient(circle at ' + (e.clientX - rect.left) + 'px ' + (e.clientY - rect.top) + 'px, rgba(COLOR,0.06) 0%, transparent 60%)';
});
```

**Magnetic Button (from cursor-reactive):**
```javascript
btn.addEventListener('mousemove', function(e) {
  var rect = btn.getBoundingClientRect();
  var cx = rect.left + rect.width / 2;
  var cy = rect.top + rect.height / 2;
  btn.style.transform = 'translate(' + ((e.clientX - cx) * 0.3) + 'px,' + ((e.clientY - cy) * 0.3) + 'px)';
});
btn.addEventListener('mouseleave', function() { btn.style.transform = 'translate(0,0)'; });
```

**Cursor Glow (from cursor-reactive):**
```javascript
var glow = document.getElementById('glow');
var mx = 0, my = 0, gx = 0, gy = 0;
document.addEventListener('mousemove', function(e) { mx = e.clientX; my = e.clientY; });
function moveGlow() {
  gx += (mx - gx) * 0.12; gy += (my - gy) * 0.12;
  glow.style.transform = 'translate(' + (gx - 250) + 'px,' + (gy - 250) + 'px)';
  requestAnimationFrame(moveGlow);
}
moveGlow();
```

**Spotlight Border Cards (from spotlight-border):**
```javascript
grid.addEventListener('mousemove', function(e) {
  grid.querySelectorAll('.spot-card').forEach(function(c) {
    var r = c.getBoundingClientRect();
    c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    c.style.setProperty('--my', (e.clientY - r.top) + 'px');
  });
});
```
```css
.spot-card::before {
  content: ''; position: absolute; inset: -1px;
  background: radial-gradient(circle 180px at var(--mx,50%) var(--my,50%), rgba(COLOR,.06), transparent);
  opacity: 0; transition: opacity .3s; pointer-events: none;
}
.spot-card:hover::before { opacity: 1; }
```

**Text Mask Reveal (from text-mask):**
```javascript
gsap.to('.mask-reveal', {
  clipPath: 'inset(0% 0 0 0)',
  ease: 'none',
  scrollTrigger: { trigger: section, start: 'top top', end: '60% bottom', scrub: 0.3 }
});
```

**Odometer Counter (from odometer):**
```javascript
// Build digit strips with 0-9, use ScrollTrigger once: true to trigger
// translateY to the target digit * strip height, with staggered transitionDelay per digit
strip.style.transform = 'translateY(-' + (target * h) + 'px)';
strip.style.transitionDelay = (i * 0.12) + 's';
```

**Kinetic Marquee (from kinetic-marquee):**
```javascript
// Clone .marquee-content for seamless loop
// Track ScrollTrigger velocity, add to base speed
// requestAnimationFrame loop: x -= (baseSpeed + scrollVelocity * 0.15) * speedMult / 60
```

**Zoom Parallax (from zoom-parallax):**
```javascript
// 3 depth layers: bg (scale 1→1.15), mid (scale 1→1.6, y -100), fg (scale 1→6, opacity→0)
// Product card fades in at 40-60% scroll, fades out at 75-90%
```

**Accordion Slider (from accordion-slider):**
```css
.accordion-panel { flex: 1; transition: flex 0.6s cubic-bezier(.16, 1, .3, 1); }
.accordion-panel:hover, .accordion-panel.active { flex: 5; }
/* Content inside: opacity 0 + translateY(10px) → revealed on hover with staggered delays */
```

**Text Scramble (from text-scramble):**
```javascript
// For each character: cycle through random chars (A-Z, 0-9, symbols) at intervals
// Resolve characters left-to-right with staggered timing
// Use JetBrains Mono for the mechanical/terminal feel
```

---

## Step 4: Deploy to Vercel

```bash
cd {business-slug}
npm run build
npx vercel --yes --prod
```

Output: `https://{slug}.vercel.app`

The `vercel.json` (created in Step 3) handles SPA routing so all React Router paths resolve correctly on production.

---

## Output Structure

```
cinematic-sites/{business-slug}/          # Raíz del proyecto Vite + React
├── index.html                            # Entry point de Vite
├── vercel.json                           # SPA routing config
├── vite.config.js
├── package.json
├── brand-card.html                       # Visual brand analysis (archivo independiente)
├── extract.json                          # Datos estructurados de la marca
├── public/
│   └── assets/
│       ├── hero.jpg                      # Imagen generada (fuente)
│       ├── hero-loop.mp4                 # Video animado (fuente, no se carga en el site)
│       └── frames/                       # Frames JPEG que renderiza HeroCanvas
│           ├── frame-0001.jpg
│           └── ... (~121 frames a 24fps)
└── src/
    ├── App.jsx
    ├── main.jsx
    ├── index.css                         # Tailwind @theme + tokens + estilos globales
    ├── lib/
    │   └── gsap.js                       # Registro de plugins GSAP
    ├── assets/
    │   └── images/                       # Imágenes locales (logo, about, gallery)
    └── components/
        ├── Cursor/
        │   └── Cursor.jsx
        ├── Button/
        │   └── Button.jsx
        ├── Nav/
        │   └── Nav.jsx
        ├── Hero/
        │   ├── Hero.jsx
        │   ├── HeroCanvas.jsx
        │   └── HeroText.jsx
        ├── Services/
        │   └── Services.jsx
        ├── About/
        │   └── About.jsx
        ├── Gallery/
        │   └── Gallery.jsx
        ├── Booking/
        │   └── Booking.jsx
        └── Footer/
            └── Footer.jsx
```

**Los frames van en `public/assets/frames/`** — Vite los sirve como estáticos en `/assets/frames/`, accesibles en runtime sin ser procesados ni bundleados. El MP4 solo se mantiene como fuente; el site nunca lo carga.

Directorio de trabajo: el directorio actual del proyecto, o una subcarpeta `cinematic-sites/` dentro de él.

---

## Pause Points

| After | Action |
|-------|--------|
| **Step 1** | Show brand card. Confirm colors/copy. |
| **Step 2** | Show the user the generated image and video. Wait for approval. |
| **Step 3** | Open site in browser for review. |

---

## Example Output: IKEA RoomCraft

A cinematic microsite for a fictional IKEA room design service. Built with this skill.

**What it includes:**
- **Text Mask Reveal** as the opening section — "ROOM CRAFT" outlined text fills with IKEA yellow on scroll, with the flat-pack explosion video playing frame-by-frame behind it via canvas
- **Kinetic Marquee** — dark band scrolling room types (LIVING ROOMS, BEDROOMS, HOME OFFICES...) that speeds up with scroll velocity
- **Odometer Counter** — stats section with mechanical rolling digits (2,400K+ rooms, 96% satisfaction, 48hr delivery, $0 consultation)
- **Sticky Stack** — how-it-works section with a pinned mockup on the left that updates as 3 step cards scroll past on the right
- **Spotlight Border Cards** with 3D tilt — service cards (Single Room $1,499, Whole Home $5,999, Room Refresh $499, Commercial) where borders illuminate and cards tilt under the cursor
- **Cursor glow** — subtle blue radial gradient following the mouse across the entire page
- **Magnetic CTA buttons** — pull toward cursor and snap back

**Theme:** Light (IKEA brand). Outfit + JetBrains Mono fonts. IKEA blue (#0058A3) accent, IKEA yellow (#FFDB00) CTAs.

This is the quality bar. Every cinematic site should feel this polished.

---

## Lessons Learned

1. **No vignettes, no wrapper containers.** Never darken hero edges with gradients. Use strong text-shadow on h1, individual backdrop pills on smaller elements.
2. **Canvas frames, not video.currentTime.** Always extract JPEG frames with ffmpeg and draw on canvas via ScrollTrigger. Smooth and reliable across all browsers.
3. **Siempre `gsap.context()` + `ctx.revert()`.** Cada componente con GSAP debe hacer cleanup en el return del `useEffect`. Sin esto hay memory leaks y animaciones fantasma al re-montar.
4. **Lazy-load HeroCanvas.** Wrappear con `React.lazy()` + `Suspense`. Three.js pesa mucho — no bloquear el bundle principal.
5. **Importar GSAP solo desde `lib/gsap.js`.** Garantiza que los plugins se registren una sola vez.
6. **Frames en `public/`**. `public/assets/frames/` → se sirven en `/assets/frames/` sin ser procesados por Vite.
7. **`vercel.json` es obligatorio.** Sin él, las rutas de React Router devuelven 404 en producción.
8. **`h-[100dvh]` en lugar de `h-screen`**. En iOS el `100vh` no descuenta la barra del navegador. `dvh` sí lo hace.
9. **Mobile-first en Tailwind.** Las clases sin prefijo apuntan al móvil. `md:` y `lg:` sobreescriben hacia arriba. Nunca usar `max-md:` para deshacer estilos de escritorio.
10. **Tap targets mínimo 44px.** Todos los botones, links de nav y el hamburger deben tener `min-h-[44px]`. Targets pequeños son inutilizables en móvil.
11. **`gsap.matchMedia()` para animaciones complejas.** Desactivar o simplificar en mobile. Las animaciones 3D y los splits de texto pesados consumen CPU en gama baja.
12. **Cursor solo si hay hover.** Comprobar `window.matchMedia('(hover: none)').matches` antes de registrar eventos del cursor.
13. **Datos constantes fuera del componente.** Arrays y objetos que no cambian deben estar fuera del cuerpo de la función. De lo contrario se recrean en cada render.
14. **Carpeta por componente.** Cada componente vive en `ComponentName/ComponentName.jsx`. Los subcomponentes del mismo feature van en la misma carpeta.
15. **Limpiar todo en useEffect.** `addEventListener`, `requestAnimationFrame`, `ResizeObserver`, GSAP tweens — todo tiene su correspondiente cleanup.
16. **Texto escalado mobile-first.** Empezar desde `text-4xl` en mobile, escalar con `sm:text-5xl md:text-6xl lg:text-8xl`. Nunca poner `text-8xl` como base.
17. **Tailwind token prefix en v4.** Los tokens de `@theme` generan vars con `--color-`: usar `var(--color-accent)` al adaptar CSS de módulos vanilla.
18. **Unsplash verification.** Siempre fetch-check cada URL antes de incluirla. Broken images destruyen la sensación premium.
19. **Cultural adaptation.** Cuando el negocio tiene identidad cultural, integrarla: tipografías nativas, texto en el idioma local, motivos SVG culturales.
20. **One easing curve.** `cubic-bezier(.16, 1, .3, 1)` para todas las transiciones interactivas.
