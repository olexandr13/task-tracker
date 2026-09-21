import { useEffect, useState } from 'react'
import type { Task } from '../../core'
import { describePoints, describeReward } from '../rewardLabels'
import { CelebrateIcon } from './CelebrateIcon'
import { ProcrastinationIcon } from './ProcrastinationIcon'
import { RestingIcon } from './RestingIcon'

/**
 * As tall as the add box beside it (View menu), padded to a square.
 */
const iconButton =
  'grid place-items-center rounded-lg border px-3.5 outline-offset-2 transition-colors focus-visible:outline-2 focus-visible:outline-blue-500'

const iconOff =
  'border-neutral-300 bg-white text-neutral-400 hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-500 dark:hover:border-neutral-600 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-100'

const iconOn =
  'border-sky-400/60 bg-sky-50 text-sky-700 dark:border-sky-500/40 dark:bg-sky-950/40 dark:text-sky-200'

const action =
  'rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'

const actionSmall =
  'rounded-md border border-neutral-200 px-2 py-0.5 text-xs text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'

const actionPrimary =
  'rounded-lg border border-sky-400/50 bg-sky-50 px-3 py-1.5 text-sm text-sky-900 transition-colors hover:bg-sky-100 dark:border-sky-500/40 dark:bg-sky-950/50 dark:text-sky-100 dark:hover:bg-sky-900/60'

/** Calm banner for Procrastination mode — not a warning colour. */
const modeBanner =
  'flex flex-col gap-2 rounded-xl border border-sky-200/90 bg-sky-50/90 px-3 py-2.5 dark:border-sky-700/40 dark:bg-sky-950/25'

const modeTitle = 'text-sm font-medium text-sky-950 dark:text-sky-100'
const modeHint = 'text-xs text-sky-800/70 dark:text-sky-200/65'

const pointsChip =
  'rounded-lg border border-green-400/50 bg-white px-2.5 py-1 text-sm tabular-nums text-green-800 transition-colors hover:bg-green-50 dark:border-green-500/40 dark:bg-green-950/40 dark:text-green-100 dark:hover:bg-green-950'

export type ProcrastinationPhase = 'off' | 'idle' | 'focus' | 'won'

/** Melting-face control beside View — starts mode, or asks to walk away while it is on. */
export function ProcrastinationEntryButton({
  phase,
  disabled,
  onStart,
  onRequestLeave,
}: {
  phase: ProcrastinationPhase
  disabled?: boolean
  onStart: () => void
  /** While mode is on: begin the walk-away confirm (gamified exit). */
  onRequestLeave: () => void
}) {
  const active = phase !== 'off'

  return (
    <button
      type="button"
      onClick={() => {
        if (phase === 'off') onStart()
        else onRequestLeave()
      }}
      disabled={disabled}
      aria-pressed={active}
      aria-label={active ? 'Procrastination mode on' : 'Procrastination mode'}
      title={active ? 'Procrastination mode on' : 'Procrastination mode'}
      className={`${iconButton} ${active ? iconOn : iconOff} disabled:pointer-events-none disabled:opacity-50`}
    >
      <ProcrastinationIcon />
    </button>
  )
}

interface ProcrastinationPanelProps {
  phase: ProcrastinationPhase
  /** Walk-away confirm is open (from the mode button). */
  confirmingLeave: boolean
  wonTask: Task | null
  canPick: boolean
  /** Points already on the ledger for this completion, or 0. */
  pointsEarned: number
  onOtherTask: () => void
  onCancelLeave: () => void
  onWalkAway: () => void
  /** Dismiss the win card but keep the mode on (idle). */
  onRest: () => void
  /** Pick and focus another open task immediately. */
  onGetOneMore: () => void
  /** Set the ledger total for this completion (each Reward +1 click adds one). */
  onGrantPoints: (total: number) => void
}

/**
 * Banner while in mode, idle rest, walk-away confirm, and the win card after a
 * focused task is completed.
 */
export function ProcrastinationPanel({
  phase,
  confirmingLeave,
  wonTask,
  canPick,
  pointsEarned,
  onOtherTask,
  onCancelLeave,
  onWalkAway,
  onRest,
  onGetOneMore,
  onGrantPoints,
}: ProcrastinationPanelProps) {
  if (phase === 'off') return null

  if (confirmingLeave) {
    return (
      <div
        role="dialog"
        aria-label="End procrastination mode"
        className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-3 dark:border-neutral-700 dark:bg-neutral-900"
      >
        <p className="text-sm text-neutral-800 dark:text-neutral-200">
          End Procrastination mode?
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Tasks go back to normal. You can start the mode again later today.
        </p>
        <div className="mt-1 flex flex-wrap gap-2">
          <button type="button" onClick={onCancelLeave} className={actionPrimary}>
            Stay in mode
          </button>
          <button type="button" onClick={onWalkAway} className={action}>
            End mode
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'idle') {
    return (
      <div role="status" className={modeBanner}>
        <div className="flex items-center gap-2">
          <RestingIcon className="inline-flex size-4 shrink-0 items-center justify-center self-start text-base leading-none" />
          <div className="min-w-0 flex-1">
            <p className={modeTitle}>Resting</p>
            <p className={modeHint}>
              No rush — pick another only if you want to.
            </p>
          </div>
          {canPick && (
            <button type="button" onClick={onGetOneMore} className={`shrink-0 ${actionSmall}`}>
              Choose another task
            </button>
          )}
        </div>
      </div>
    )
  }

  if (phase === 'focus') {
    return (
      <div role="status" className={modeBanner}>
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className={modeTitle}>Procrastination mode</p>
            <p className={modeHint}>Some functionality dimmed to prevent distraction. Do just one highlighted task</p>
          </div>
          <button type="button" onClick={onOtherTask} className={`shrink-0 ${actionSmall}`}>
            Other task
          </button>
        </div>
      </div>
    )
  }

  if (wonTask === null) return null

  return (
    <ProcrastinationWin
      canPick={canPick}
      pointsEarned={pointsEarned}
      onRest={onRest}
      onGetOneMore={onGetOneMore}
      onGrantPoints={onGrantPoints}
    />
  )
}

function ProcrastinationWin({
  canPick,
  pointsEarned,
  onRest,
  onGetOneMore,
  onGrantPoints,
}: {
  canPick: boolean
  pointsEarned: number
  onRest: () => void
  onGetOneMore: () => void
  onGrantPoints: (total: number) => void
}) {
  const [tip, setTip] = useState<string | null>(null)

  useEffect(() => {
    if (tip === null) return
    const clear = window.setTimeout(() => { setTip(null) }, 1200)
    return () => { window.clearTimeout(clear) }
  }, [tip])

  return (
    <div
      role="status"
      aria-live="polite"
      className="procrastination-win flex flex-col gap-3 rounded-xl border border-green-300/60 bg-green-50/90 px-4 py-4 dark:border-green-500/30 dark:bg-green-950/40"
    >
      <div className="procrastination-win-burst flex items-center gap-2">
        <CelebrateIcon className="size-6 text-amber-500 dark:text-amber-300" />
        <p className="text-sm font-medium text-green-900 dark:text-green-100">Well done!</p>
      </div>

      <div className="relative flex w-full items-stretch gap-2">
        <button
          type="button"
          onClick={() => {
            const total = pointsEarned + 1
            onGrantPoints(total)
            setTip(describeReward(total))
          }}
          className={`inline-flex flex-1 items-center justify-center gap-1.5 ${pointsChip}`}
          aria-label={
            pointsEarned > 0
              ? `Reward +1, ${describePoints(pointsEarned)} so far`
              : 'Reward +1'
          }
        >
          <span aria-hidden="true">⭐</span>
          Reward +1
          {pointsEarned > 0 && (
            <span className="tabular-nums text-green-700/75 dark:text-green-200/70">
              · {describePoints(pointsEarned)}
            </span>
          )}
        </button>
        {tip !== null && (
          <span
            role="status"
            className="absolute -top-8 left-0 rounded-md bg-neutral-900 px-2 py-1 text-xs text-white dark:bg-neutral-100 dark:text-neutral-900"
          >
            {tip}
          </span>
        )}
        {canPick && (
          <button
            type="button"
            onClick={onGetOneMore}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 ${action}`}
            aria-label="Get one more task"
          >
            <span aria-hidden="true">➕</span>
            Get one more task
          </button>
        )}
        <button
          type="button"
          onClick={onRest}
          className={`inline-flex flex-1 items-center justify-center gap-1.5 ${actionPrimary}`}
          aria-label="Rest"
        >
          <RestingIcon />
          Rest
        </button>
      </div>
    </div>
  )
}
