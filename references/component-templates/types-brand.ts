export interface BrandColors {
  primary: string
  secondary: string
  text: string
  accent: string
  muted: string
}

export interface Brand {
  name: string
  category: string
  colors: BrandColors
  fonts: { heading: string; body: string }
  tagline: string
  headline: string
  services: string[]
  cta: string
  contact: { phone?: string; email?: string; address?: string }
  logoUrl?: string
}
