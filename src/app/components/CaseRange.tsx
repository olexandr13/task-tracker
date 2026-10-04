import type { CaseOdds } from '../../core'
import { describeCaseUnit, describeCaseWin, RANGE_LABEL } from '../caseLabels'

/**
 * What one case can give (CHST-26), set in front of that case: a small gold
 * line of its own, as the stakes are written over a machine. The number is
 * that case's own range — Today from the cheapest task, the daily case from
 * yesterday — so it is never one range for every case at once.
 */
export function CaseRange({ odds }: { odds: CaseOdds }) {
  return (
    <span className="flex w-full flex-col items-center rounded-lg border border-neutral-200 bg-white px-1 py-1 text-center dark:border-neutral-700 dark:bg-neutral-900">
      <span className="text-[10px] leading-none font-semibold tracking-[0.08em] text-neutral-500 uppercase dark:text-neutral-400">
        {RANGE_LABEL}
      </span>
      <span className="mt-0.5 text-xs leading-none font-semibold text-amber-700 tabular-nums dark:text-amber-300">
        {describeCaseWin(odds)}
        <span className="ml-0.5 text-[10px] font-normal text-neutral-500 dark:text-neutral-400">{describeCaseUnit(odds)}</span>
      </span>
    </span>
  )
}
