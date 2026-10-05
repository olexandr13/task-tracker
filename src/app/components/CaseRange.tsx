import type { CaseOdds } from '../../core'
import { describeCaseUnit, describeCaseWin, RANGE_LABEL } from '../caseLabels'

/**
 * What one case can give (CHST-26), set inside that case, above the crate: a
 * small gold line of its own, as the stakes are written over a machine. The
 * number is that case's own range — Today from the cheapest task, the daily
 * case from yesterday — so it is never one range for every case at once.
 * The plate behind it is always dark, so the line is drawn for that plate.
 */
export function CaseRange({ odds }: { odds: CaseOdds }) {
  return (
    <span className="flex h-full w-full flex-col items-center justify-center rounded-lg border border-white/10 bg-neutral-800 px-1 text-center">
      <span className="text-[10px] leading-none font-semibold tracking-[0.08em] text-neutral-400 uppercase">
        {RANGE_LABEL}
      </span>
      <span className="mt-0.5 text-xs leading-none font-semibold text-amber-300 tabular-nums">
        {describeCaseWin(odds)}
        <span className="ml-0.5 text-[10px] font-normal text-neutral-400">{describeCaseUnit(odds)}</span>
      </span>
    </span>
  )
}
