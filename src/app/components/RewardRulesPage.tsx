import { useState, type KeyboardEvent } from 'react'
import {
  bonusEarned,
  BONUS_PERIODS,
  createPointValue,
  type CurrencyRate,
  defaultReward,
  DEFAULT_BONUS,
  DEFAULT_CURRENCY,
  DEFAULT_POINT_AMOUNT,
  InvalidPointValueError,
  isCurrency,
  isCurrencyRate,
  isPointAmount,
  knownCurrency,
  MAX_CURRENCY_LENGTH,
  MAX_CURRENCY_RATE,
  MAX_OTHER_CURRENCIES,
  MAX_POINT_AMOUNT,
  type Period,
  type PeriodBonuses,
  type PointValue,
  type RewardEntry,
  withOtherCurrencies,
} from '../../core'
import {
  BONUS_EARNED_TAGS,
  BONUS_HINTS,
  BONUS_LABELS,
  currencySign,
  describeMoney,
  NEW_TASK_REWARD_HINT,
  PERIOD_NAMES,
} from '../rewardLabels'
import { deleteControl } from '../rowControls'
import { RewardPicker } from './RewardPicker'
import { TickIcon } from './TickIcon'

interface RewardRulesPageProps {
  /** What clearing each period earns (RWD-24, RWD-29). */
  bonuses: PeriodBonuses
  /** What the ledger holds, for whether each bonus has been earned yet (RWD-39). */
  entries: readonly RewardEntry[]
  /** Which day, week and month it is. */
  now: Date
  /** What one point is worth, or null while nothing says (RWD-31). */
  pointValue: PointValue | null
  /** The reward a new task starts with, or null where it starts with none (RWD-45). */
  newTaskReward: number | null
  /** Sets what clearing the period earns from here on, or takes its bonus away with null. */
  onChangeBonus: (period: Period, points: number | null) => void
  /** Sets the reward a new task starts with, or has new tasks start with none with null. */
  onChangeNewTaskReward: (points: number | null) => void
  /** Sets what one point is worth, or forgets it with null. */
  onChangePointValue: (value: PointValue | null) => void
}

const heading = 'text-sm font-medium text-neutral-700 dark:text-neutral-300'
const card = 'rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
const link = 'rounded-lg text-blue-600 underline-offset-2 transition-colors hover:underline dark:text-blue-400'
const field =
  'min-w-0 rounded-lg border border-neutral-300 bg-transparent px-2.5 py-2 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none md:px-2 md:py-1 md:text-sm dark:border-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-500'

/**
 * What earns points and what they are worth: the reward a new task starts with
 * (RWD-45), the bonus for clearing Today, this week and this month (RWD-27,
 * RWD-29), each row marked once its period has paid it (RWD-39), and
 * the rate points are counted in money at (RWD-31).
 *
 * What a task earns once it is made is not here — it is set on the task, with
 * its star (RWD-5), because it is that task's own. Everything on this page is
 * one amount for the whole account.
 *
 * Nothing is confirmed: every step and every number typed is saved as it is
 * made, as in the other pickers (RPT-22), and only what happens from then on
 * is affected.
 */
export function RewardRulesPage({
  bonuses,
  entries,
  now,
  pointValue,
  newTaskReward,
  onChangeBonus,
  onChangePointValue,
  onChangeNewTaskReward,
}: RewardRulesPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <section aria-label="New tasks" className="flex flex-col gap-2">
        <h2 className={heading}>New tasks</h2>
        <div className={`${card} flex items-center justify-between gap-3 px-4 py-3`}>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm text-neutral-900 dark:text-neutral-100">Reward for a new task</span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">{NEW_TASK_REWARD_HINT}</span>
          </div>
          <div className="w-32 shrink-0">
            <RewardPicker
              reward={newTaskReward}
              startAt={defaultReward(null)}
              onChange={onChangeNewTaskReward}
              label="Reward for a new task"
              hint="Points a new task starts with"
              showAmount
              noneLabel="No reward"
              removeLabel="Remove reward for new tasks"
            />
          </div>
        </div>
      </section>

      <section aria-label="Bonuses" className="flex flex-col gap-2">
        <h2 className={heading}>Finish everything, earn extra</h2>
        <ul className="flex flex-col gap-1">
          {BONUS_PERIODS.map((period) => (
            <li key={period} className={`${card} flex items-center justify-between gap-3 px-4 py-3`}>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="text-sm text-neutral-900 dark:text-neutral-100">{BONUS_LABELS[period]}</span>
                  {bonuses[period] !== null && bonusEarned(entries, period, now) !== null && (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      <TickIcon className="size-3 shrink-0" />
                      {BONUS_EARNED_TAGS[period]}
                    </span>
                  )}
                </span>
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
                  removeLabel="Remove bonus"
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

/** Whether two rates are the same rate, either of them being nothing set. The other currencies have rows of their own. */
function sameValue(a: PointValue | null, b: PointValue | null): boolean {
  if (a === null || b === null) return a === b
  return a.amount === b.amount && a.currency === b.currency
}

/**
 * What is typed, as a rate beside the other currencies there are, or null while
 * it is not one yet — a currency one of the others has already included.
 */
function typedValue(amount: string, currency: string, others: readonly CurrencyRate[]): PointValue | null {
  const number = Number(amount)
  if (amount.trim() === '' || !isPointAmount(number) || !isCurrency(currency)) return null
  try {
    return createPointValue(number, currency, others)
  } catch (error) {
    if (error instanceof InvalidPointValueError) return null
    throw error
  }
}

/**
 * The rate: a number of money for one point, and what that money is called —
 * the main currency. Saved as it is typed, like every other picker, and only
 * once both boxes say something that can be a rate — half a number is not a
 * rate, and is not saved. The × forgets it, which leaves the points counted in
 * points alone (RWD-32). Under it, once there is a rate, are the other
 * currencies prices can be set in (RWD-49).
 */
function PointValueRow({ value, onChange }: { value: PointValue | null; onChange: (value: PointValue | null) => void }) {
  const [amount, setAmount] = useState(value === null ? '' : String(value.amount))
  const [currency, setCurrency] = useState(value?.currency ?? DEFAULT_CURRENCY)
  const others = value?.otherCurrencies ?? []

  // A rate set on another device, or forgotten here, lands in the boxes — unless
  // what is in them already says the very same thing, which typing `2.50` over
  // `2.5` does.
  const [seen, setSeen] = useState(value)
  if (!sameValue(seen, value) && !sameValue(typedValue(amount, currency, others), value)) {
    setSeen(value)
    setAmount(value === null ? '' : String(value.amount))
    setCurrency(value?.currency ?? DEFAULT_CURRENCY)
  }

  function save(nextAmount: string, nextCurrency: string) {
    const next = typedValue(nextAmount, nextCurrency, others)
    if (next !== null && !sameValue(next, value)) onChange(next)
  }

  /** A box left saying something that is not a rate goes back to what is saved. */
  function settle() {
    if (typedValue(amount, currency, others) !== null) return
    setAmount(value === null ? '' : String(value.amount))
    setCurrency(value?.currency ?? DEFAULT_CURRENCY)
  }

  return (
    <div className={`${card} flex flex-col gap-2 px-4 py-3.5`}>
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-sm text-neutral-500 dark:text-neutral-400">1 point =</span>
        <input
          type="number"
          name="point-amount"
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
          name="point-currency"
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
          ? 'Nothing set: points are counted in points alone, and prizes and wishes are priced in points.'
          : `100 points are ${String(describeMoney(100, value))}. A prize or a wish priced in money costs as many points as its money comes to.`}
      </p>

      {value !== null && <OtherCurrencies value={value} onChange={onChange} />}
    </div>
  )
}

/**
 * The currencies besides the main one that prices can be set in (RWD-49), each
 * a row saying what one of it is worth in the main one: `1 USD = 41.50 ₴`.
 * A row is saved as it is typed, as the rate above is; a new one is saved once,
 * whole, from its own Add, since a rate saved a keystroke at a time would leave
 * a row of its own behind every one.
 */
function OtherCurrencies({ value, onChange }: { value: PointValue; onChange: (value: PointValue) => void }) {
  const [adding, setAdding] = useState(false)
  const others = value.otherCurrencies

  function replace(index: number, rate: CurrencyRate | null): boolean {
    const next = withOtherCurrencies(
      value,
      rate === null ? others.filter((_, at) => at !== index) : others.map((other, at) => (at === index ? rate : other)),
    )
    if (next === null) return false
    onChange(next)
    return true
  }

  return (
    <section aria-label="Other currencies" className="flex flex-col gap-2 border-t border-neutral-200 pt-3 dark:border-neutral-800">
      <h3 className="text-sm text-neutral-700 dark:text-neutral-300">Other currencies</h3>
      {others.map((rate, index) => (
        <OtherCurrencyRow
          // By place, so typing over a currency's name keeps the row and its caret.
          key={index}
          number={index + 1}
          rate={rate}
          main={value.currency}
          onChange={(next) => replace(index, next)}
          onRemove={() => { replace(index, null) }}
        />
      ))}
      {adding ? (
        <NewCurrencyRow
          value={value}
          onAdd={(rate) => {
            const next = withOtherCurrencies(value, [...others, rate])
            if (next === null) return false
            onChange(next)
            setAdding(false)
            return true
          }}
          onCancel={() => { setAdding(false) }}
        />
      ) : (
        others.length < MAX_OTHER_CURRENCIES && (
          <button type="button" onClick={() => { setAdding(true) }} className={`${link} self-start text-sm`}>
            Add a currency
          </button>
        )
      )}
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        {others.length === 0
          ? `To price prizes and wishes in another currency too, add it and say what one of it is worth in ${currencySign(value.currency)}.`
          : `Prizes and wishes can be priced in any of these. Each costs as many points as its money comes to in ${currencySign(value.currency)}.`}
      </p>
    </section>
  )
}

interface OtherCurrencyRowProps {
  /** Which row it is, from 1, for a screen reader. */
  number: number
  rate: CurrencyRate
  /** The main currency, which the rate is said in. */
  main: string
  /** Saves the row as typed. False where it will not do: a currency there already, a rate that is no rate. */
  onChange: (rate: CurrencyRate) => boolean
  onRemove: () => void
}

/** What one of another currency is worth, saved as it is typed, like the rate above it. */
function OtherCurrencyRow({ number, rate, main, onChange, onRemove }: OtherCurrencyRowProps) {
  const [currency, setCurrency] = useState(rate.currency)
  const [amount, setAmount] = useState(String(rate.amount))

  // Changed on another device: the boxes follow, unless they say it already.
  const [seen, setSeen] = useState(rate)
  if ((seen.currency !== rate.currency || seen.amount !== rate.amount) && !sameRate(typedRate(currency, amount), rate)) {
    setSeen(rate)
    setCurrency(rate.currency)
    setAmount(String(rate.amount))
  }

  function save(nextCurrency: string, nextAmount: string) {
    const next = typedRate(nextCurrency, nextAmount)
    if (next !== null && !sameRate(next, rate)) onChange(next)
  }

  /** A box left saying something that will not do goes back to what is saved. */
  function settle() {
    if (sameRate(typedRate(currency, amount), rate)) return
    setCurrency(rate.currency)
    setAmount(String(rate.amount))
  }

  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0 text-sm text-neutral-500 dark:text-neutral-400">1</span>
      <input
        type="text"
        name="other-currency"
        value={currency}
        onChange={(event) => {
          setCurrency(event.target.value)
          save(event.target.value, amount)
        }}
        onBlur={settle}
        maxLength={MAX_CURRENCY_LENGTH}
        aria-label={`Other currency ${String(number)}`}
        autoComplete="off"
        className={`${field} w-20`}
      />
      <span className="shrink-0 text-sm text-neutral-500 dark:text-neutral-400">=</span>
      <input
        type="number"
        name="currency-rate"
        inputMode="decimal"
        min={0}
        max={MAX_CURRENCY_RATE}
        step={0.0001}
        value={amount}
        onChange={(event) => {
          setAmount(event.target.value)
          save(currency, event.target.value)
        }}
        onBlur={settle}
        aria-label={`What one ${rate.currency} is worth in ${main}`}
        className={`${field} w-24 tabular-nums`}
      />
      <span title={main} className="shrink-0 text-sm text-neutral-500 dark:text-neutral-400">
        {currencySign(main)}
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${rate.currency}`}
        title={`Remove ${rate.currency}`}
        className={`flex h-8 shrink-0 items-center rounded-lg px-2 text-base leading-none ${deleteControl}`}
      >
        ×
      </button>
    </div>
  )
}

/** What is typed, as another currency's rate, or null while it is not one yet. */
function typedRate(currency: string, amount: string): CurrencyRate | null {
  const number = Number(amount)
  if (amount.trim() === '' || !isCurrencyRate(number) || !isCurrency(currency)) return null
  return { currency: currency.trim(), amount: number }
}

function sameRate(a: CurrencyRate | null, b: CurrencyRate): boolean {
  return a !== null && a.currency === b.currency && a.amount === b.amount
}

interface NewCurrencyRowProps {
  value: PointValue
  /** Adds it. False where it will not do: a currency there already. */
  onAdd: (rate: CurrencyRate) => boolean
  onCancel: () => void
}

/**
 * A currency being added: its name and what one of it is worth, kept with
 * **Add** or Enter, given up with Escape. What will not do is said under it
 * rather than left to a button that does nothing.
 */
function NewCurrencyRow({ value, onAdd, onCancel }: NewCurrencyRowProps) {
  const [currency, setCurrency] = useState('')
  const [amount, setAmount] = useState('')
  const [problem, setProblem] = useState<string | null>(null)

  function add() {
    const rate = typedRate(currency, amount)
    if (!isCurrency(currency)) {
      setProblem('Name the currency: USD, EUR, or however you write it.')
    } else if (knownCurrency(value, currency) !== null) {
      setProblem(`There is ${currency.trim()} here already.`)
    } else if (rate === null) {
      setProblem(`Say what one ${currency.trim()} is worth in ${currencySign(value.currency)}: more than nothing, to four decimal places.`)
    } else if (!onAdd(rate)) {
      setProblem(`There is ${currency.trim()} here already.`)
    }
  }

  function handleKeys(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      add()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      onCancel()
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-sm text-neutral-500 dark:text-neutral-400">1</span>
        <input
          type="text"
          name="other-currency"
          value={currency}
          onChange={(event) => {
            setCurrency(event.target.value)
            setProblem(null)
          }}
          onKeyDown={handleKeys}
          maxLength={MAX_CURRENCY_LENGTH}
          placeholder="USD"
          aria-label="New currency"
          autoComplete="off"
          // Asking to add one is asking to name it.
          autoFocus
          className={`${field} w-20`}
        />
        <span className="shrink-0 text-sm text-neutral-500 dark:text-neutral-400">=</span>
        <input
          type="number"
          name="currency-rate"
          inputMode="decimal"
          min={0}
          max={MAX_CURRENCY_RATE}
          step={0.0001}
          value={amount}
          onChange={(event) => {
            setAmount(event.target.value)
            setProblem(null)
          }}
          onKeyDown={handleKeys}
          aria-label={`What one of it is worth in ${value.currency}`}
          enterKeyHint="done"
          className={`${field} w-24 tabular-nums`}
        />
        <span title={value.currency} className="shrink-0 text-sm text-neutral-500 dark:text-neutral-400">
          {currencySign(value.currency)}
        </span>
        <button type="button" onClick={add} className={`${link} shrink-0 text-sm`}>
          Add
        </button>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Don't add a currency"
          title="Don't add a currency"
          className={`flex h-8 shrink-0 items-center rounded-lg px-2 text-base leading-none ${deleteControl}`}
        >
          ×
        </button>
      </div>
      {problem !== null && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {problem}
        </p>
      )}
    </div>
  )
}
