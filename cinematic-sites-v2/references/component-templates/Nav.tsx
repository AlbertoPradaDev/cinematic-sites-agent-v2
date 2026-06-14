'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { gsap } from '@/lib/gsap'

const NAV_LINKS = [
  { label: 'Services', href: '#services' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'About', href: '#about' },
  { label: 'Booking', href: '#booking' },
] as const

export default function Nav() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const drawer = drawerRef.current
    if (!drawer) return
    const ctx = gsap.context(() => {
      gsap.to(drawer, { xPercent: open ? 0 : 100, duration: 0.5, ease: 'power3.out' })
    })
    return () => ctx.revert()
  }, [open])

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-primary/60 backdrop-blur border-b border-text/10' : 'bg-transparent'}`}>
      <nav className="flex items-center justify-between px-4 sm:px-8 lg:px-16 h-16 md:h-20">
        <Link href="#hero" className="font-black uppercase tracking-widest text-lg">[Brand]</Link>

        <ul className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="text-sm uppercase tracking-widest hover:text-accent transition-colors">{l.label}</Link>
            </li>
          ))}
        </ul>

        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="md:hidden flex flex-col items-center justify-center gap-1.5 w-11 h-11"
        >
          <span className={`block h-0.5 w-6 bg-text transition-transform duration-300 ${open ? 'translate-y-2 rotate-45' : ''}`} />
          <span className={`block h-0.5 w-6 bg-text transition-opacity duration-300 ${open ? 'opacity-0' : ''}`} />
          <span className={`block h-0.5 w-6 bg-text transition-transform duration-300 ${open ? '-translate-y-2 -rotate-45' : ''}`} />
        </button>
      </nav>

      <div
        ref={drawerRef}
        className="md:hidden fixed top-0 right-0 h-[100dvh] w-3/4 max-w-xs translate-x-full bg-primary border-l border-text/10 z-50 flex flex-col gap-6 p-8 pt-24"
      >
        {NAV_LINKS.map((l) => (
          <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="flex items-center min-h-[44px] text-2xl font-black uppercase tracking-widest">{l.label}</Link>
        ))}
      </div>
    </header>
  )
}
