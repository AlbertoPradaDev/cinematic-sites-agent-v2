import Link from 'next/link'
import type { ComponentProps } from 'react'

type Variant = 'primary' | 'outline'
type Size = 'sm' | 'md'

const SIZES: Record<Size, string> = {
  sm: 'text-xs px-5 min-h-[44px]',
  md: 'text-sm px-8 min-h-[44px] md:min-h-[52px]',
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent/80 active:bg-accent/60',
  outline: 'border border-text/30 text-text hover:border-text hover:bg-text/5 active:bg-text/10',
}

interface ButtonProps extends ComponentProps<typeof Link> {
  variant?: Variant
  size?: Size
}

export default function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-bold uppercase tracking-widest transition-all duration-300 select-none'
  return (
    <Link className={`${base} ${SIZES[size]} ${VARIANTS[variant]} ${className}`} {...props}>
      {children}
    </Link>
  )
}
