interface ModeSwitchProps {
  /** What it turns on, for a screen reader: the mode's name. */
  label: string
  /** Whether it is on, in a word under the switch: `Enabled`, `Disabled` (MODE-3). */
  state: string
  checked: boolean
  /** Why it cannot be turned on just now, or null while it can (MODE-6). */
  blocked: string | null
  onChange: (checked: boolean) => void
}

const track = 'relative h-6 w-11 shrink-0 rounded-full transition-colors'
const knob = 'absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform'

/**
 * A mode's own switch: the track, its knob, and under them the word for which
 * way it is — so it can sit at the end of a row whose rest goes to the mode's
 * page (MODE-3). Off while there is nothing for the mode to do, and saying why
 * (MODE-6).
 *
 * The word sits with the switch rather than with the mode's name, because it is
 * the switch it explains: a track and a knob say on or off only to someone who
 * already knows which side is which.
 */
export function ModeSwitch({ label, state, checked, blocked, onChange }: ModeSwitchProps) {
  return (
    <span className="flex shrink-0 flex-col items-center">
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

      {/* For eyes only: a screen reader is told which way the switch is by the switch itself. */}
      <span aria-hidden="true" className="text-[11px] leading-none text-neutral-500 dark:text-neutral-400">
        {state}
      </span>
    </span>
  )
}
