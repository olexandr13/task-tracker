import { useEffect, useState } from 'react'

/**
 * Below Tailwind's `md`, where the app is a phone: one column and the bottom
 * bar. `max-md` is this query, so the layout and the behaviour stay in step.
 */
export const PHONE_QUERY = '(width < 48rem)'

export function isPhoneLayout(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(PHONE_QUERY).matches
}

/** Whether the screen is a phone's, kept in step as it is resized. */
export function usePhoneLayout(): boolean {
  const [phone, setPhone] = useState(isPhoneLayout)

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return

    const media = window.matchMedia(PHONE_QUERY)
    function sync() {
      setPhone(media.matches)
    }
    sync()
    media.addEventListener('change', sync)
    return () => { media.removeEventListener('change', sync) }
  }, [])

  return phone
}
