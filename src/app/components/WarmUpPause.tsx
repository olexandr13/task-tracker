import { OptionSwitch } from './OptionSwitch'

interface WarmUpPauseProps {
  /** Whether the allowance is frozen (WARM-11). */
  paused: boolean
  onChange: (paused: boolean) => void
}

/**
 * Pause on the warm-up's own page (WARM-11). Days on pause add no habit, and
 * the habits already there stay. It is offered only while a warm-up is under
 * way: there is nothing to pause before one has begun.
 */
export function WarmUpPause({ paused, onChange }: WarmUpPauseProps) {
  return (
    <section
      aria-label="Pause"
      className="rounded-xl border border-neutral-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <OptionSwitch
        label="Pause"
        description="Days on pause add no habit. The habits you have stay, and a later day you resume allows one more."
        checked={paused}
        onChange={onChange}
      />
    </section>
  )
}
