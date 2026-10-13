import type { LocalDay } from '../../core'
import {
  describeLevel,
  describeLevelProgress,
  describeXpAmount,
  describeXpBegan,
  LEVEL_HEADING,
  XP_GAINS,
  XP_LOSSES,
  XP_NOT_LOADED,
  XP_NOTES,
  XP_RULES_HEADING,
  type XpRule,
} from '../levelLabels'
import type { XpStanding } from '../useXp'
import { InfoButton } from './InfoButton'
import { LevelIcon } from './LevelIcon'

const card = 'rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
interface LevelPageProps {
  /** Null while the ledger, the tasks or the points are still loading. */
  standing: XpStanding | null
  /** The ledger could not be loaded. */
  failed: boolean
  /** The day XP began, once known. */
  startedOn: LocalDay | null
  now: Date
}

/**
 * The Level page (LVL-10): the level, the XP in all and how far into the level
 * it is. No history is kept, so there is none to show. The **i** beside the
 * heading says what gives XP and what takes it away, and how much (LVL-15).
 */
export function LevelPage({ standing, failed, startedOn, now }: LevelPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-1.5">
        <h2 className="text-lg leading-6 text-neutral-900 dark:text-neutral-100">{LEVEL_HEADING}</h2>
        <InfoButton label={LEVEL_HEADING} heading={XP_RULES_HEADING}>
          <p>Almost everything you get done gives a little XP, and more for bigger tasks. XP adds up to your level.</p>
          <XpRuleTable caption="What gives XP" rules={XP_GAINS} tone="gain" />
          <XpRuleTable caption="What takes XP away" rules={XP_LOSSES} tone="loss" />
          {XP_NOTES.map((line) => (
            <p key={line}>{line}</p>
          ))}
          {startedOn !== null && <p>{describeXpBegan(startedOn, now)}</p>}
        </InfoButton>
      </div>

      {failed ? (
        <p className="py-10 text-center text-neutral-500 dark:text-neutral-400">{XP_NOT_LOADED}</p>
      ) : standing === null ? (
        <p className="py-10 text-center text-neutral-400 dark:text-neutral-600">Loading…</p>
      ) : (
        <section aria-label="Your level" className={`${card} flex flex-col gap-3 px-4 py-4`}>
          <div className="flex items-center gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
              <LevelIcon className="size-6" />
            </span>
            <div className="flex min-w-0 flex-col">
              <p className="text-2xl font-semibold text-neutral-900 tabular-nums dark:text-neutral-100">
                {describeLevel(standing.level.level)}
              </p>
              <p className="text-sm text-neutral-500 tabular-nums dark:text-neutral-400">
                {describeXpAmount(standing.total)} in all
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div
              role="progressbar"
              aria-label={`Progress to level ${String(standing.level.level + 1)}`}
              aria-valuenow={standing.level.into}
              aria-valuemin={0}
              aria-valuemax={standing.level.step}
              aria-valuetext={describeLevelProgress(standing.level)}
              className="h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800"
            >
              <div
                className="h-full rounded-full bg-amber-500 transition-[width] duration-300"
                style={{ width: `${String(Math.min(100, (standing.level.into / standing.level.step) * 100))}%` }}
              />
            </div>
            <p className="text-xs text-neutral-500 tabular-nums dark:text-neutral-400">
              {describeLevelProgress(standing.level)}
            </p>
          </div>
        </section>
      )}
    </div>
  )
}

/** One side of what XP is given and taken for, as a two-column table: what is done, and what it is worth. */
function XpRuleTable({ caption, rules, tone }: { caption: string; rules: readonly XpRule[]; tone: 'gain' | 'loss' }) {
  return (
    <table className="w-full text-left">
      <caption className="pb-1 text-left text-sm font-medium text-neutral-900 dark:text-neutral-100">{caption}</caption>
      <tbody>
        {rules.map((rule) => (
          <tr key={rule.what} className="border-t border-neutral-100 align-top dark:border-neutral-800">
            <td className="py-1 pr-3">{rule.what}</td>
            <td
              className={`py-1 text-right whitespace-nowrap tabular-nums ${
                tone === 'gain' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
              }`}
            >
              {rule.xp}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
