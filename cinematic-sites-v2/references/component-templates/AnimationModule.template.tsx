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
import type { ReactNode } from 'react'
import { gsap } from '@/lib/gsap'

interface AnimationSectionProps {
  className?: string
  children?: ReactNode
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
        gsap.from('[data-reveal]', {
          opacity: 0, duration: 0.4, ease: 'power2.out',
          scrollTrigger: { trigger: rootRef.current, start: 'top 85%' },
        })
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
