interface ModeSwitchProps {
  /** What it turns on, for a screen reader: the mode's name. */
  label: string
  checked: boolean
  /** Why it cannot be turned on just now, or null while it can (MODE-6). */
  blocked: string | null
  onChange: (checked: boolean) => void
}

const track = 'relative h-6 w-11 shrink-0 rounded-full transition-colors'
const knob = 'absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform'

/**
 * A mode's own switch: the track and its knob alone, so it can sit at the end
 * of a row whose rest goes to the mode's page (MODE-3). Off while there is
 * nothing for the mode to do, and saying why (MODE-6).
 */
export function ModeSwitch({ label, checked, blocked, onChange }: ModeSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-description={blocked ?? undefined}
      title={blocked ?? undefined}
      disabled={blocked !== null && !checked}
      onClick={() => { onChange(!checked) }}
      // Large enough for a thumb on its own, whatever the row around it does (UI-49).
      className="grid size-11 shrink-0 place-items-center rounded-full transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:hover:bg-neutral-800/60"
    >
      <span
        aria-hidden="true"
        className={`${track} ${checked ? 'bg-blue-600 dark:bg-blue-500' : 'bg-neutral-300 dark:bg-neutral-700'}`}
      >
        <span className={`${knob} ${checked ? 'translate-x-5' : ''}`} />
      </span>
    </button>
  )
}
