import { useCallback, useSyncExternalStore } from 'react'

/**
 * Subscribes to a CSS media query so layout decisions that cannot be made in
 * CSS alone (rendering a backdrop, marking the drawer inert) follow the same
 * breakpoints as the stylesheet.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    [query],
  )

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** Tailwind's `lg`: at and above this the sidebar is docked, below it drawers. */
export const DESKTOP_QUERY = '(min-width: 1024px)'
