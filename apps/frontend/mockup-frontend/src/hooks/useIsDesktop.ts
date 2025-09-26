import { useEffect, useState } from 'react'

export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    return window.matchMedia('(min-width: 768px)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia('(min-width: 768px)')
    const listener = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    if ('addEventListener' in mql) {
      mql.addEventListener('change', listener)
    } else {
      // @ts-ignore older Safari
      mql.addListener(listener)
    }
    return () => {
      if ('removeEventListener' in mql) {
        mql.removeEventListener('change', listener)
      } else {
        // @ts-ignore older Safari
        mql.removeListener(listener)
      }
    }
  }, [])

  return isDesktop
}


