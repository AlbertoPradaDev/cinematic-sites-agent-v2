'use client'
import { useEffect, useState } from 'react'

// Returns false until mounted, so SSR always renders the mobile tree and the
// desktop variant swaps in after hydration — no hydration mismatch.
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}
