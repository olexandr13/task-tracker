import { useState } from 'react'
import {
  BONUS_PERIODS,
  createPointValue,
  DEFAULT_BONUS,
  DEFAULT_CURRENCY,
  DEFAULT_POINT_AMOUNT,
  isCurrency,
  isPointAmount,
  MAX_CURRENCY_LENGTH,
  MAX_POINT_AMOUNT,
  type Period,
  type PeriodBonuses,
  type PointValue,
} from '../../core'
import { BONUS_HINTS, BONUS_LABELS, describeMoney, PERIOD_NAMES } from '../rewardLabels'
import { deleteControl } from '../rowControls'
import { RewardPicker } from './RewardPicker'

interface RewardRulesPageProps {
  /** What clearing each period earns (RWD-24, RWD-29). */
  bonuses: PeriodBonuses
  /** What one point is worth, or null while nothing says (RWD-31). */
  pointValue: PointValue | null
  /** Sets what clearing the period earns from here on, or takes its bonus away with null. */
  onChangeBonus: (period: Period, points: number | null) => void
  /** Sets what one point is worth, or forgets it with null. */
  onChangePointValue: (value: PointValue | null) => void
}

const heading = 'text-sm font-medium text-neutral-700 dark:text-neutral-300'
const card = 'rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
const field =
  'min-w-0 rounded-lg border border-neutral-300 bg-transparent px-2.5 py-2 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none md:px-2 md:py-1 md:text-sm dark:border-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-500'

/**
 * What earns points and what they are worth: the bonus for clearing Today, this
 * week and this month (RWD-27, RWD-29), and the rate points are counted in
 * money at (RWD-31).
 *
 * What a *task* earns is not here — it is set on the task, with its star
 * (RWD-5), because it is that task's own. Everything on this page is one amount
 * for the whole account.
 *
 * Nothing is confirmed: every step and every number typed is saved as it is
 * made, as in the other pickers (RPT-22), and only what happens from then on
 * is affected.
 */
export function RewardRulesPage({ bonuses, pointValue, onChangeBonus, onChangePointValue }: RewardRulesPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <section aria-label="Bonuses" className="flex flex-col gap-2">
        <h2 className={heading}>Clearing a period</h2>
        <ul className="flex flex-col gap-1">
          {BONUS_PERIODS.map((period) => (
            <li key={period} className={`${card} flex items-center justify-between gap-3 px-4 py-3`}>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm text-neutral-900 dark:text-neutral-100">{BONUS_LABELS[period]}</span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">{BONUS_HINTS[period]}</span>
              </div>
              <div className="w-32 shrink-0">
                <RewardPicker
                  reward={bonuses[period]}
                  startAt={DEFAULT_BONUS[period]}
                  onChange={(points) => { onChangeBonus(period, points) }}
                  label={`Bonus for clearing ${PERIOD_NAMES[period]}`}
                  hint={`Points for clearing ${PERIOD_NAMES[period]}`}
                  showAmount
                  addLabel="Add bonus"
                  noneLabel="No bonus"
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="What a point is worth" className="flex flex-col gap-2">
        <h2 className={heading}>What a point is worth</h2>
        <PointValueRow value={pointValue} onChange={onChangePointValue} />
      </section>
    </div>
  )
}

/** Whether two rates are the same rate, either of them being nothing set. */
function sameValue(a: PointValue | null, b: PointValue | null): boolean {
  if (a === null || b === null) return a === b
  return a.amount === b.amount && a.currency === b.currency
}

/** What is typed, as a rate, or null while it is not one yet. */
function typedValue(amount: string, currency: string): PointValue | null {
  const number = Number(amount)
  if (amount.trim() === '' || !isPointAmount(number) || !isCurrency(currency)) return null
  return createPointValue(number, currency)
}

/**
 * The rate: a number of money for one point, and what that money is called.
 * Saved as it is typed, like every other picker, and only once both boxes say
 * something that can be a rate — half a number is not a rate, and is not saved.
 * The × forgets it, which leaves the points counted in points alone (RWD-32).
 */
function PointValueRow({ value, onChange }: { value: PointValue | null; onChange: (value: PointValue | null) => void }) {
  const [amount, setAmount] = useState(value === null ? '' : String(value.amount))
  const [currency, setCurrency] = useState(value?.currency ?? DEFAULT_CURRENCY)

  // A rate set on another device, or forgotten here, lands in the boxes — unless
  // what is in them already says the very same thing, which typing `2.50` over
  // `2.5` does.
  const [seen, setSeen] = useState(value)
  if (!sameValue(seen, value) && !sameValue(typedValue(amount, currency), value)) {
    setSeen(value)
    setAmount(value === null ? '' : String(value.amount))
    setCurrency(value?.currency ?? DEFAULT_CURRENCY)
  }

  function save(nextAmount: string, nextCurrency: string) {
    const next = typedValue(nextAmount, nextCurrency)
    if (next !== null && !sameValue(next, value)) onChange(next)
  }

  /** A box left saying something that is not a rate goes back to what is saved. */
  function settle() {
    if (typedValue(amount, currency) !== null) return
    setAmount(value === null ? '' : String(value.amount))
    setCurrency(value?.currency ?? DEFAULT_CURRENCY)
  }

  return (
    <div className={`${card} flex flex-col gap-2 px-4 py-3.5`}>
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-sm text-neutral-500 dark:text-neutral-400">1 point =</span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          max={MAX_POINT_AMOUNT}
          step={0.01}
          value={amount}
          onChange={(event) => {
            setAmount(event.target.value)
            save(event.target.value, currency)
          }}
          onBlur={settle}
          placeholder={String(DEFAULT_POINT_AMOUNT)}
          aria-label="Money one point is worth"
          className={`${field} w-24 tabular-nums`}
        />
        <input
          type="text"
          value={currency}
          onChange={(event) => {
            setCurrency(event.target.value)
            save(amount, event.target.value)
          }}
          onBlur={settle}
          maxLength={MAX_CURRENCY_LENGTH}
          placeholder={DEFAULT_CURRENCY}
          aria-label="What that money is"
          autoComplete="off"
          enterKeyHint="done"
          className={`${field} w-24`}
        />
        {value !== null && (
          <button
            type="button"
            onClick={() => { onChange(null) }}
            aria-label="Forget what a point is worth"
            title="Forget what a point is worth"
            className={`flex h-8 shrink-0 items-center rounded-lg px-2 text-base leading-none ${deleteControl}`}
          >
            ×
          </button>
        )}
      </div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        {value === null
          ? 'Nothing set: points are counted in points alone.'
          : `100 points are ${String(describeMoney(100, value))}. It counts nothing — it only says what the points come to.`}
      </p>
    </div>
  )
}
