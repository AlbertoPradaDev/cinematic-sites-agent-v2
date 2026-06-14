'use client'
import { useEffect, useRef } from 'react'
import { gsap, SplitText } from '@/lib/gsap'
import Button from '@/components/ui/Button'

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
