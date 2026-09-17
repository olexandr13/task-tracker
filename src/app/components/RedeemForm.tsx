import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { isRedemptionAmount, isRedemptionNote, MAX_REDEMPTION_NOTE } from '../../core'
import { describePoints } from '../rewardLabels'

interface RedeemFormProps {
  /** The points there are to spend. */
  balance: number
  onRedeem: (points: number, note: string) => void
}

const field =
  'min-w-0 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500'

/**
 * Spending points: how many, and what on. **Redeem** only does anything once
 * both say something that can be redeemed and the points are there to spend;
 * until then it stays off, and a line under the form says what is missing
 * where that is not plain from the empty boxes.
 */
export function RedeemForm({ balance, onRedeem }: RedeemFormProps) {
  const [points, setPoints] = useState('')
  const [note, setNote] = useState('')

  const amount = Number(points)
  const isAmount = points.trim() !== '' && isRedemptionAmount(amount)
  const canRedeem = isAmount && amount <= balance && isRedemptionNote(note)
  const hint =
    balance < 1
      ? 'Nothing to redeem yet: complete a task that has a reward to earn points.'
      : points.trim() !== '' && !isAmount
        ? 'Points are redeemed in whole numbers.'
        : isAmount && amount > balance
          ? `You have ${describePoints(balance)}.`
          : null

  function redeem() {
    if (!canRedeem) return

    onRedeem(amount, note)
    setPoints('')
    setNote('')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    redeem()
  }

  // Enter in either box is handled directly, as in AddTaskForm, rather than left to
  // the form's implicit submission.
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    redeem()
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Redeem points" className="flex flex-col gap-1.5">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          value={points}
          onChange={(event) => { setPoints(event.target.value) }}
          onKeyDown={handleKeyDown}
          placeholder="Points"
          aria-label="Points to redeem"
          className={`${field} tabular-nums sm:w-28`}
        />
        <input
          type="text"
          value={note}
          onChange={(event) => { setNote(event.target.value) }}
          onKeyDown={handleKeyDown}
          maxLength={MAX_REDEMPTION_NOTE}
          placeholder="What for?"
          aria-label="What for"
          autoComplete="off"
          enterKeyHint="done"
          className={`${field} sm:flex-1`}
        />
        <button
          type="submit"
          disabled={!canRedeem}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-40"
        >
          Redeem
        </button>
      </div>

      {hint !== null && <p className="text-xs text-neutral-500 dark:text-neutral-400">{hint}</p>}
    </form>
  )
}
