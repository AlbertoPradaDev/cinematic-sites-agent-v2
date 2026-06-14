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
