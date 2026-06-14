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
