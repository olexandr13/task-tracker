import { useState, type KeyboardEvent } from 'react'
import {
  canAfford,
  isAvailable,
  isPrizeName,
  isPrizePoints,
  MAX_PRIZE_NAME_LENGTH,
  MAX_PRIZE_POINTS,
  pointsShort,
  type PointValue,
  type Prize,
  type PrizeId,
  type PrizeKind,
} from '../../core'
import { PRIZE_WORDS } from '../prizeLabels'
import { describeBoughtOn, describeMoney, describePoints } from '../rewardLabels'
import { deleteControl } from '../rowControls'
import { GiftIcon } from './GiftIcon'
import { RedeemForm } from './RedeemForm'
import { PencilIcon } from './PencilIcon'
import { TrophyIcon } from './TrophyIcon'

const row =
  'flex items-center gap-2 rounded-xl border border-neutral-200 bg-white py-2 pr-1.5 pl-3 transition-colors hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700'
/** A wish already bought: still listed, plainly behind us. */
const rowBought = 'border-dashed opacity-60'
const glyph = 'size-4 shrink-0 text-neutral-400 dark:text-neutral-500'
const smallControl =
  'flex size-6 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'
const field =
  'min-w-0 rounded-lg border border-neutral-300 bg-transparent px-2.5 py-2 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none md:px-2 md:py-1 md:text-sm dark:border-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-500'
const heading = 'text-sm font-medium text-neutral-700 dark:text-neutral-300'
const redeemButton =
  'shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-40'
const addButton =
  'shrink-0 self-stretch rounded-lg px-3 text-base text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 active:bg-neutral-100 disabled:pointer-events-none disabled:opacity-40 md:self-auto md:px-2.5 md:py-1 md:text-sm dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 dark:active:bg-neutral-800'

interface PrizeListPageProps {
  /** Which list this is: the prizes that come round again, or the wishlist (RWD-40). */
  kind: PrizeKind
  /** This kind's records, as `prizesOfKind` gives them: what can still be bought first, cheapest first. */
  prizes: readonly Prize[]
  /** The points there are to spend. */
  balance: number
  /** What one point is worth, for pricing in money too (RWD-32). */
  pointValue: PointValue | null
  /** Puts one on the list. False when another prize or wish is called that already. */
  onAdd: (name: string, points: number, kind: PrizeKind) => boolean
  /** Renames one. False when another is called that already. */
  onRename: (id: PrizeId, name: string) => boolean
  onReprice: (id: PrizeId, points: number) => void
  onDelete: (id: PrizeId) => void
  /** Spends its price on it: a prize stays for next time, a wish is bought (RWD-36, RWD-40). */
  onRedeem: (prize: Prize) => void
  /** Spends points on something that is on neither list (RWD-15). Only the prizes page offers it. */
  onRedeemOther?: (points: number, note: string) => void
  now: Date
}

/** What is typed into an edit box, before it is anything that can be saved. */
interface Draft {
  id: PrizeId
  name: string
  points: string
}

/**
 * One of the two lists of what points are spent on (RWD-40): the **prizes**,
 * small and bought again and again, or the **wishlist**, the big ones bought
 * once. They are the same page with different rules, so they read and work the
 * same way — each row a name, a price and **Redeem**.
 *
 * What can still be bought comes first, cheapest first (RWD-35), so what is
 * within reach heads the list and what is being saved up for follows it. A row
 * out of reach says how many points are still to earn rather than going quiet:
 * that is the point of writing it down. A wish already bought stays at the
 * end, marked as bought (RWD-40).
 *
 * The prizes page ends with a box for spending points on something that is on
 * neither list — a one-off treat — which is the same redemption by another name
 * (RWD-15).
 */
export function PrizeListPage({
  kind,
  prizes,
  balance,
  pointValue,
  onAdd,
  onRename,
  onReprice,
  onDelete,
  onRedeem,
  onRedeemOther,
  now,
}: PrizeListPageProps) {
  const words = PRIZE_WORDS[kind]
  const Icon = kind === 'wish' ? TrophyIcon : GiftIcon
  const [name, setName] = useState('')
  const [points, setPoints] = useState('')
  // The one being changed, and what has been typed over it so far.
  const [editing, setEditing] = useState<Draft | null>(null)
  // Where a name one of them has already was typed: under the box, or under the row.
  const [taken, setTaken] = useState<PrizeId | 'new' | null>(null)

  const typedPoints = Number(points)
  const canAdd = isPrizeName(name) && points.trim() !== '' && isPrizePoints(typedPoints)

  function handleAdd() {
    if (!canAdd) return

    if (onAdd(name, typedPoints, kind)) {
      setName('')
      setPoints('')
      setTaken(null)
    } else {
      setTaken('new')
    }
  }

  function startEditing(prize: Prize) {
    setEditing({ id: prize.id, name: prize.name, points: String(prize.points) })
    setTaken(null)
  }

  function commitEditing() {
    if (editing === null) return

    const price = Number(editing.points)
    // Anything that will not do leaves the boxes open as they are, to fix or give up on.
    if (!isPrizeName(editing.name) || !isPrizePoints(price)) return
    if (!onRename(editing.id, editing.name)) {
      setTaken(editing.id)
      return
    }

    onReprice(editing.id, price)
    setEditing(null)
    setTaken(null)
  }

  function handleEditKeys(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      commitEditing()
    } else if (event.key === 'Escape') {
      // Giving up leaves it as it was, as dropping a title edit does.
      event.preventDefault()
      setEditing(null)
      setTaken(null)
    }
  }

  function handleDelete(prize: Prize) {
    // It goes for good, with nothing to undo it from, so it asks first. What it
    // was already redeemed for stays in the history.
    if (window.confirm(`Take "${prize.name}" off the list? What it was redeemed for stays in the history.`)) {
      onDelete(prize.id)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          <span className="font-medium text-neutral-900 tabular-nums dark:text-neutral-100">{balance}</span>{' '}
          {Math.abs(balance) === 1 ? 'point' : 'points'} to spend
          {describeMoney(balance, pointValue) !== null && ` — worth ${String(describeMoney(balance, pointValue))}`}
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">{words.hint}</p>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              if (taken === 'new') setTaken(null)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                handleAdd()
              }
            }}
            maxLength={MAX_PRIZE_NAME_LENGTH}
            placeholder={words.addPlaceholder}
            aria-label={`Name of the new ${words.one}`}
            autoComplete="off"
            className={`${field} flex-1`}
          />
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_PRIZE_POINTS}
            step={1}
            value={points}
            onChange={(event) => { setPoints(event.target.value) }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                handleAdd()
              }
            }}
            placeholder="Points"
            aria-label={`Points the new ${words.one} costs`}
            enterKeyHint="done"
            className={`${field} w-24 tabular-nums`}
          />
          <button type="button" onClick={handleAdd} disabled={!canAdd} className={addButton}>
            Add
          </button>
        </div>
        {taken === 'new' && (
          <p role="alert" className="px-1 text-xs text-red-600 dark:text-red-400">
            {words.taken}
          </p>
        )}
      </div>

      {prizes.length === 0 ? (
        <p className="py-6 text-center text-neutral-400 dark:text-neutral-600">{words.empty}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {prizes.map((prize) => {
            const affordable = canAfford(prize, balance)
            const bought = !isAvailable(prize)
            const money = describeMoney(prize.points, pointValue)
            return (
              <li key={prize.id} className="flex flex-col gap-1">
                <div className={bought ? `${row} ${rowBought}` : row}>
                  {editing?.id === prize.id ? (
                    // The name and the price are one change: it is kept once the
                    // caret leaves them both, not on the way from one to the other.
                    <div
                      onBlur={(event) => {
                        if (!event.currentTarget.contains(event.relatedTarget)) commitEditing()
                      }}
                      className="flex min-w-0 flex-1 items-center gap-2"
                    >
                      <Icon className={glyph} />
                      <input
                        type="text"
                        value={editing.name}
                        onChange={(event) => {
                          setEditing({ ...editing, name: event.target.value })
                          if (taken === prize.id) setTaken(null)
                        }}
                        onKeyDown={handleEditKeys}
                        maxLength={MAX_PRIZE_NAME_LENGTH}
                        // Asking to change one is asking to type: the caret goes there, over its name.
                        autoFocus
                        aria-label={`Name of the ${words.one} "${prize.name}"`}
                        autoComplete="off"
                        className={`${field} min-w-0 flex-1`}
                      />
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={MAX_PRIZE_POINTS}
                        step={1}
                        value={editing.points}
                        onChange={(event) => { setEditing({ ...editing, points: event.target.value }) }}
                        onKeyDown={handleEditKeys}
                        aria-label={`Points the ${words.one} "${prize.name}" costs`}
                        enterKeyHint="done"
                        className={`${field} w-20 shrink-0 tabular-nums`}
                      />
                    </div>
                  ) : (
                    <>
                      <Icon className={glyph} />
                      <span
                        className={`min-w-0 flex-1 break-words text-sm text-neutral-900 dark:text-neutral-100${bought ? ' line-through' : ''}`}
                      >
                        {prize.name}
                      </span>
                      <span className="shrink-0 text-xs text-neutral-500 tabular-nums dark:text-neutral-400">
                        {prize.points}
                        {money !== null && <span className="hidden sm:inline"> · {money}</span>}
                      </span>

                      {bought ? (
                        <span className="shrink-0 px-1 text-xs text-neutral-500 dark:text-neutral-400">
                          {describeBoughtOn(prize.boughtAt ?? '', now)}
                        </span>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => { onRedeem(prize) }}
                            disabled={!affordable}
                            aria-label={`Redeem ${prize.name} for ${describePoints(prize.points)}`}
                            className={redeemButton}
                          >
                            Redeem
                          </button>

                          {!affordable && (
                            <span className="shrink-0 text-xs text-neutral-400 tabular-nums dark:text-neutral-500">
                              {pointsShort(prize, balance)} to go
                            </span>
                          )}
                        </>
                      )}

                      {!bought && (
                        <button
                          type="button"
                          onClick={() => { startEditing(prize) }}
                          aria-label={`Change the ${words.one} "${prize.name}"`}
                          title={`Change ${words.one}`}
                          className={smallControl}
                        >
                          <PencilIcon className="size-3.5 shrink-0" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => { handleDelete(prize) }}
                        aria-label={`Delete the ${words.one} "${prize.name}"`}
                        title={`Delete ${words.one}`}
                        className={`flex h-6 shrink-0 items-center rounded-lg px-1.5 text-base leading-none ${deleteControl}`}
                      >
                        ×
                      </button>
                    </>
                  )}
                </div>

                {taken === prize.id && (
                  <p role="alert" className="px-1 text-xs text-red-600 dark:text-red-400">
                    {words.taken}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {onRedeemOther !== undefined && (
        <section
          aria-label="Something else"
          className="flex flex-col gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-800"
        >
          <h2 className={heading}>Something else</h2>
          <RedeemForm balance={balance} onRedeem={onRedeemOther} />
        </section>
      )}
    </div>
  )
}
