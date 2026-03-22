import * as React from "react"

const MOBILE_BREAKPOINT = 768

const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

/**
 * SSR-safe: до гидрации считаем desktop, чтобы не мигать мобильным Sheet.
 * После mount — только `matchMedia` (без лишних чтений layout).
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const mql = window.matchMedia(QUERY)
    const sync = () => {
      setIsMobile(mql.matches)
    }
    sync()
    mql.addEventListener("change", sync)
    return () => mql.removeEventListener("change", sync)
  }, [])

  return isMobile
}
