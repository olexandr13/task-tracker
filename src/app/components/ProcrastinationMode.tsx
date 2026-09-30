import { useEffect, useState, type ReactNode } from 'react'
import type { Task } from '../../core'
import { describePoints, describeReward } from '../rewardLabels'
import { CalmIcon } from './CalmIcon'
import { CelebrateIcon } from './CelebrateIcon'

const action =
  'rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'

/** The quiet outline every small control in here wears; what it is worn with says how tall and how wide. */
const actionSmallSkin =
  'rounded-md border border-neutral-200 px-2 text-xs text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'

/** Beside the win card's title, in a row of its own. */
const actionSmall = `py-0.5 ${actionSmallSkin}`

/**
 * A banner's side door. On a phone the doors share the width of the banner and
 * stand tall enough for a thumb; from `sm` up they shrink back to their own
 * width and line up at the end of the row.
 */
const bannerAction = `grow py-1.5 sm:grow-0 sm:py-0.5 ${actionSmallSkin}`

const actionPrimary =
  'rounded-lg border border-sky-400/50 bg-sky-50 px-3 py-1.5 text-sm text-sky-900 transition-colors hover:bg-sky-100 dark:border-sky-500/40 dark:bg-sky-950/50 dark:text-sky-100 dark:hover:bg-sky-900/60'

/**
 * Calm banner for Procrastination mode — not a warning colour. Its two halves sit
 * side by side where there is room and stack below `sm`: a narrow screen given
 * one row squeezes the words into a column three to a line and leaves an empty
 * band under the buttons, which is neither readable nor worth the height.
 */
const modeBanner =
  'flex flex-col gap-2.5 rounded-xl border border-sky-200/90 bg-sky-50/90 px-3.5 py-3 sm:flex-row sm:items-center sm:gap-3 dark:border-sky-700/40 dark:bg-sky-950/25'

const modeTitle = 'text-sm font-medium text-sky-950 dark:text-sky-100'
const modeHint = 'text-xs leading-5 text-sky-800/70 dark:text-sky-200/65'

const pointsChip =
  'rounded-lg border border-green-400/50 bg-white px-2.5 py-1 text-sm tabular-nums text-green-800 transition-colors hover:bg-green-50 dark:border-green-500/40 dark:bg-green-950/40 dark:text-green-100 dark:hover:bg-green-950'

export type ProcrastinationPhase = 'off' | 'idle' | 'focus' | 'won'

interface ProcrastinationPanelProps {
  phase: ProcrastinationPhase
  wonTask: Task | null
  canPick: boolean
  /** Another open Today task exists to switch to (JUST-6). */
  hasOtherTask: boolean
  /** Points already on the ledger for this completion, or 0. */
  pointsEarned: number
  onOtherTask: () => void
  /** Only open task in play: open the add-task sheet (JUST-6). */
  onCreateTask: () => void
  /** Opens Procrastination's own page, where what it does is written out (MODE-10). */
  onMoreInfo: () => void
  /** Turn the mode off immediately, from the idle banner or the win card (JUST-8). */
  onEnd: () => void
  /** Dismiss the win card but keep the mode on (idle). */
  onRest: () => void
  /** Pick and focus another open task immediately. */
  onGetOneMore: () => void
  /** Set the ledger total for this completion (each Reward +1 click adds one). */
  onGrantPoints: (total: number) => void
}

/**
 * Banner while in mode, idle rest, and the win card after a focused task is
 * completed.
 */
export function ProcrastinationPanel({
  phase,
  wonTask,
  canPick,
  hasOtherTask,
  pointsEarned,
  onOtherTask,
  onCreateTask,
  onMoreInfo,
  onEnd,
  onRest,
  onGetOneMore,
  onGrantPoints,
}: ProcrastinationPanelProps) {
  if (phase === 'off') return null

  if (phase === 'idle') {
    return (
      <ModeBanner
        icon={<CalmIcon className="inline-flex size-4 shrink-0 items-center justify-center text-base leading-none" />}
        title="Resting"
        hint="No rush — pick another only if you want to."
      >
        {canPick && (
          <button type="button" onClick={onGetOneMore} className={bannerAction}>
            Choose another task
          </button>
        )}
        <button type="button" onClick={onMoreInfo} className={bannerAction}>
          More info
        </button>
        <button type="button" onClick={onEnd} className={bannerAction}>
          End mode
        </button>
      </ModeBanner>
    )
  }

  if (phase === 'focus') {
    return (
      <ModeBanner
        title="Procrastination mode"
        hint="Do just the highlighted task"
      >
        {hasOtherTask ? (
          <button type="button" onClick={onOtherTask} className={bannerAction}>
            Other task
          </button>
        ) : (
          <button type="button" onClick={onCreateTask} className={bannerAction}>
            Create new task
          </button>
        )}
        <button type="button" onClick={onMoreInfo} className={bannerAction}>
          More info
        </button>
      </ModeBanner>
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
      onEnd={onEnd}
    />
  )
}

interface ModeBannerProps {
  /** Resting wears one; focusing wears none, the mode being at work rather than at rest (JUST-5). */
  icon?: ReactNode
  title: string
  hint: string
  /** The side doors, in the order they are offered. */
  children: ReactNode
}

/**
 * What both banners are: what the mode is doing on the left, the ways out of it
 * on the right — and stacked instead, the doors spread across the width, once
 * the screen is too narrow to hold the two side by side.
 */
function ModeBanner({ icon, title, hint, children }: ModeBannerProps) {
  return (
    <div role="status" className={modeBanner}>
      <div className="flex min-w-0 flex-1 items-start gap-2">
        {icon}
        <div className="min-w-0">
          <p className={modeTitle}>{title}</p>
          <p className={modeHint}>{hint}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 sm:shrink-0 sm:justify-end">{children}</div>
    </div>
  )
}

function ProcrastinationWin({
  canPick,
  pointsEarned,
  onRest,
  onGetOneMore,
  onGrantPoints,
  onEnd,
}: {
  canPick: boolean
  pointsEarned: number
  onRest: () => void
  onGetOneMore: () => void
  onGrantPoints: (total: number) => void
  onEnd: () => void
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
        <CelebrateIcon className="size-6 shrink-0 text-amber-500 dark:text-amber-300" />
        <p className="min-w-0 flex-1 text-sm font-medium text-green-900 dark:text-green-100">
          Well done!
        </p>
        <button type="button" onClick={onEnd} className={`shrink-0 ${actionSmall}`}>
          End mode
        </button>
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
            className={`inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 ${action}`}
            aria-label="Get one more task"
          >
            <span aria-hidden="true">➕</span>
            <span className="truncate">Get one more task</span>
          </button>
        )}
        <button
          type="button"
          onClick={onRest}
          className={`inline-flex flex-1 items-center justify-center gap-1.5 ${actionPrimary}`}
          aria-label="Rest"
        >
          <CalmIcon />
          Rest
        </button>
      </div>
    </div>
  )
}
