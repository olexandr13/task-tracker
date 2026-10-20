import { useState, type KeyboardEvent } from 'react'
import {
  canAfford,
  isAvailable,
  isPrizeName,
  MAX_PRIZE_MONEY,
  MAX_PRIZE_NAME_LENGTH,
  MAX_PRIZE_POINTS,
  pointsShort,
  priceIn,
  priceMoney,
  priceOf,
  pricePoints,
  priceUnit,
  type PointValue,
  type PriceUnit,
  type Prize,
  type PrizeId,
  type PrizeKind,
  type PrizePrice,
} from '../../core'
import { describeUncounted, PRIZE_WORDS, type PrizeKindWords } from '../prizeLabels'
import {
  describeAmount,
  describeBoughtOn,
  describeMoney,
  describeMoneyAmount,
  describePoints,
  describePointValue,
} from '../rewardLabels'
import { deleteControl } from '../rowControls'
import { VIEW_LABELS } from '../view'
import { ConfirmSheet, type Confirmation } from './ConfirmSheet'
import { GiftIcon } from './GiftIcon'
import { InfoButton } from './InfoButton'
import { RedeemForm } from './RedeemForm'
import { PencilIcon } from './PencilIcon'
import { TrophyIcon } from './TrophyIcon'

/**
 * The list is one grid, each row a share of its columns — the glyph, the name,
 * the price in points and in money, Redeem, what is still to go, and the two
 * controls — so the numbers stand in columns from row to row rather than
 * wherever each row's name leaves them (RWD-36). A column no row fills takes no
 * room: what sets the columns apart is each cell's own margin, not a gap.
 */
const list = 'grid grid-cols-[auto_minmax(0,1fr)_repeat(6,auto)] gap-y-1'
/**
 * A phone has no room for a column of what is still to go: it is written under
 * the price instead, a second line the rest of the row stands centred beside.
 */
const besideBoth = 'row-span-2 sm:row-span-1'
const item = 'col-span-full grid grid-cols-subgrid gap-y-1'
const row =
  'col-span-full grid grid-cols-subgrid items-center rounded-xl border border-neutral-200 bg-white py-2 pr-1.5 pl-3 transition-colors hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700'
/** A wish already bought: still listed, plainly behind us. */
const rowBought = 'border-dashed opacity-60'
const glyph = 'size-4 shrink-0 text-neutral-400 dark:text-neutral-500'
const smallControl =
  'flex size-6 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'
const field =
  'min-w-0 rounded-lg border border-neutral-300 bg-transparent px-2.5 py-2 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none md:px-2 md:py-1 md:text-sm dark:border-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-500'
const heading = 'text-sm font-medium text-neutral-700 dark:text-neutral-300'
const unitLabel = 'shrink-0 text-sm text-neutral-500 dark:text-neutral-400'
const link =
  'rounded-lg text-blue-600 underline-offset-2 transition-colors hover:underline dark:text-blue-400'
const redeemButton =
  'col-start-5 row-span-2 ml-3 shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-40 sm:row-span-1'
const addButton =
  'shrink-0 self-stretch rounded-lg px-3 text-base text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 active:bg-neutral-100 disabled:pointer-events-none disabled:opacity-40 md:self-auto md:px-2.5 md:py-1 md:text-sm dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 dark:active:bg-neutral-800'

/**
 * Asked before one is taken off its list, there being nothing to undo it from.
 * What it was already redeemed for stays in the history (RWD-34).
 */
function askDelete(prize: Prize, words: PrizeKindWords): Confirmation {
  return {
    question: `Delete the ${words.one} "${prize.name}"?`,
    lines: ['It comes off this list.', `The times you redeemed it stay in "${VIEW_LABELS['rewards/history']}".`],
    confirm: 'Delete',
  }
}

/**
 * What is typed as a price, or null where it is not one in that unit: nothing
 * typed, points that are not whole, money finer than a penny (RWD-33, RWD-47).
 */
function typedPrice(text: string, unit: PriceUnit): PrizePrice | null {
  return text.trim() === '' ? null : priceOf(Number(text), unit)
}

interface PriceBoxProps {
  unit: PriceUnit
  value: string
  onChange: (value: string) => void
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  /** What a screen reader calls it, which says what it is counted in. */
  label: string
  placeholder?: string
  className: string
}

/**
 * The box a price is typed in: a whole number of points, or money to the penny
 * with its currency written after it (RWD-47), so a number typed in it never
 * leaves a doubt what it is counted in.
 */
function PriceBox({ unit, value, onChange, onKeyDown, label, placeholder, className }: PriceBoxProps) {
  if (unit.in === 'points') {
    return (
      <input
        type="number"
        name="prize-points"
        inputMode="numeric"
        min={1}
        max={MAX_PRIZE_POINTS}
        step={1}
        value={value}
        onChange={(event) => { onChange(event.target.value) }}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        aria-label={label}
        enterKeyHint="done"
        className={`${field} ${className} tabular-nums`}
      />
    )
  }

  return (
    <>
      <input
        type="number"
        name="prize-money"
        inputMode="decimal"
        min={0.01}
        max={MAX_PRIZE_MONEY}
        step={0.01}
        value={value}
        onChange={(event) => { onChange(event.target.value) }}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        aria-label={label}
        enterKeyHint="done"
        className={`${field} ${className} tabular-nums`}
      />
      <span aria-hidden className={unitLabel}>
        {unit.currency}
      </span>
    </>
  )
}

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
  onAdd: (name: string, price: PrizePrice, kind: PrizeKind) => boolean
  /** Renames one. False when another is called that already. */
  onRename: (id: PrizeId, name: string) => boolean
  /** Changes what one costs, in points or in money (RWD-47). */
  onReprice: (id: PrizeId, price: PrizePrice) => void
  onDelete: (id: PrizeId) => void
  /** Spends its price on it: a prize stays for next time, a wish is bought (RWD-36, RWD-40). */
  onRedeem: (prize: Prize) => void
  /** Spends points on something that is on neither list (RWD-15). Only the prizes page offers it. */
  onRedeemOther?: (points: number, note: string) => void
  /** Opens Rules, where what a point is worth is set (RWD-31). */
  onOpenRules?: () => void
  now: Date
}

/** What is typed into an edit box, before it is anything that can be saved. */
interface Draft {
  id: PrizeId
  name: string
  price: string
  /** What the price box counts in (RWD-47). */
  unit: PriceUnit
  /** What the price box started out saying: left as it was, the price is left as it is. */
  startedAt: string
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
 * A wish is priced in money wherever a point has a value (RWD-47), and costs as
 * many points as that money comes to at the rate; a prize is priced in points.
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
  onOpenRules,
  now,
}: PrizeListPageProps) {
  const words = PRIZE_WORDS[kind]
  const Icon = kind === 'wish' ? TrophyIcon : GiftIcon
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  // The one being changed, and what has been typed over it so far.
  const [editing, setEditing] = useState<Draft | null>(null)
  // Where a name one of them has already was typed: under the box, or under the row.
  const [taken, setTaken] = useState<PrizeId | 'new' | null>(null)
  // The one asked about before it is taken off.
  const [asking, setAsking] = useState<PrizeId | null>(null)
  const asked = prizes.find((prize) => prize.id === asking)
  // Taken off elsewhere — on another device — while asked, there is nothing left to ask about.
  if (asking !== null && asked === undefined) setAsking(null)

  const worth = describeMoney(balance, pointValue)
  // What a new one is priced in: money for a wish once a point has a value (RWD-47).
  const unit = priceUnit(kind, pointValue)
  const typed = typedPrice(price, unit)
  const canAdd = isPrizeName(name) && typed !== null

  function handleAdd() {
    if (!canAdd) return

    if (onAdd(name, typed, kind)) {
      setName('')
      setPrice('')
      setTaken(null)
    } else {
      setTaken('new')
    }
  }

  function startEditing(prize: Prize) {
    // A wish is changed in money once a point has a value, whatever it was priced in before.
    const editUnit = priceUnit(prize.kind, pointValue, prize.price)
    const said = priceIn(prize.price, editUnit, pointValue)
    const text = said === null ? '' : String(said)
    setEditing({ id: prize.id, name: prize.name, price: text, unit: editUnit, startedAt: text })
    setTaken(null)
  }

  function commitEditing() {
    if (editing === null) return

    // A price box left as it started leaves the price as it is: a wish priced in
    // points keeps its points through a rename.
    const repriced = editing.price === editing.startedAt ? null : typedPrice(editing.price, editing.unit)
    // Anything that will not do leaves the boxes open as they are, to fix or give up on.
    if (!isPrizeName(editing.name) || (editing.price !== editing.startedAt && repriced === null)) return
    if (!onRename(editing.id, editing.name)) {
      setTaken(editing.id)
      return
    }

    if (repriced !== null) onReprice(editing.id, repriced)
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

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            <span className="font-medium text-neutral-900 tabular-nums dark:text-neutral-100">
              {describeAmount(balance)}
            </span>{' '}
            {Math.abs(balance) === 1 ? 'point' : 'points'} to spend
            {worth !== null && ` — worth ${worth}`}
          </p>
          {/* The rate the money is counted at, so a price in money can be checked
              against the points (RWD-32); it is set on Rules, a click away. */}
          {pointValue !== null && (
            <p className="text-xs text-neutral-500 tabular-nums dark:text-neutral-400">
              Rate: {describePointValue(pointValue)}
              {onOpenRules !== undefined && (
                <>
                  {' · '}
                  <button
                    type="button"
                    onClick={onOpenRules}
                    aria-label={`Change what a point is worth, on "${VIEW_LABELS['rewards/rules']}"`}
                    className={link}
                  >
                    Change
                  </button>
                </>
              )}
            </p>
          )}
        </div>
        <InfoButton label={VIEW_LABELS[kind === 'wish' ? 'rewards/wishlist' : 'rewards/prizes']}>
          <p>{words.hint}</p>
        </InfoButton>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            name="prize-name"
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
          <PriceBox
            unit={unit}
            value={price}
            onChange={setPrice}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                handleAdd()
              }
            }}
            placeholder={unit.in === 'points' ? 'Points' : 'Price'}
            label={unit.in === 'points' ? `Points the new ${words.one} costs` : `Price of the new ${words.one}, in ${unit.currency}`}
            className="w-24"
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
        <ul className={list}>
          {prizes.map((prize) => {
            const affordable = canAfford(prize, balance, pointValue)
            const bought = !isAvailable(prize)
            // What it costs in points at the rate, or null where no rate counts its money (RWD-47).
            const points = pricePoints(prize, pointValue)
            const inMoney = priceMoney(prize, pointValue)
            const money = inMoney === null ? null : describeMoneyAmount(inMoney)
            const toGo = pointsShort(prize, balance, pointValue)
            // Still to go: on a phone, said on a line of its own under the price,
            // which then sits on the first of the two lines rather than across both.
            const short = !bought && !affordable && toGo !== null
            const uncounted = !bought && points === null && prize.price.in === 'money' ? prize.price.currency : null
            const priceLines = short ? 'row-start-1 self-end sm:self-auto' : besideBoth
            return (
              <li key={prize.id} className={item}>
                <div className={bought ? `${row} ${rowBought}` : row}>
                  {editing?.id === prize.id ? (
                    // The name and the price are one change: it is kept once the
                    // caret leaves them both, not on the way from one to the other.
                    <div
                      onBlur={(event) => {
                        if (!event.currentTarget.contains(event.relatedTarget)) commitEditing()
                      }}
                      className="col-span-full flex min-w-0 items-center gap-2"
                    >
                      <Icon className={glyph} />
                      <input
                        type="text"
                        name="prize-name"
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
                      <PriceBox
                        unit={editing.unit}
                        value={editing.price}
                        onChange={(typedNow) => { setEditing({ ...editing, price: typedNow }) }}
                        onKeyDown={handleEditKeys}
                        label={
                          editing.unit.in === 'points'
                            ? `Points the ${words.one} "${prize.name}" costs`
                            : `Price of the ${words.one} "${prize.name}", in ${editing.unit.currency}`
                        }
                        className="w-24 shrink-0"
                      />
                    </div>
                  ) : (
                    <>
                      <Icon className={`col-start-1 ${besideBoth} ${glyph}`} />
                      <span
                        className={`col-start-2 ${besideBoth} ml-2 min-w-0 break-words text-sm text-neutral-900 dark:text-neutral-100${bought ? ' line-through' : ''}`}
                      >
                        {prize.name}
                      </span>
                      {/* The price spelled out in both, each with what it is counted in;
                          a phone has room for the points alone. */}
                      <span className={`col-start-3 ${priceLines} ml-3 text-right text-sm whitespace-nowrap text-neutral-700 tabular-nums dark:text-neutral-300`}>
                        {points === null ? (
                          // No rate counts its money in points: a phone, with no column of
                          // money, has the money here instead.
                          <>
                            <span className="sm:hidden">{money}</span>
                            <span className="hidden sm:inline">— points</span>
                          </>
                        ) : (
                          <>
                            {describeAmount(points)}
                            <span className="hidden sm:inline"> {points === 1 ? 'point' : 'points'}</span>
                          </>
                        )}
                      </span>
                      {money !== null && (
                        <span className="col-start-4 ml-3 hidden text-right text-sm whitespace-nowrap text-neutral-500 tabular-nums sm:block dark:text-neutral-400">
                          {money}
                        </span>
                      )}

                      {bought ? (
                        <span className={`col-span-2 col-start-5 ${besideBoth} ml-3 px-1 text-xs whitespace-nowrap text-neutral-500 dark:text-neutral-400`}>
                          {describeBoughtOn(prize.boughtAt ?? '', now)}
                        </span>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => { onRedeem(prize) }}
                            disabled={!affordable}
                            aria-label={points === null ? `Redeem ${prize.name}` : `Redeem ${prize.name} for ${describePoints(points)}`}
                            className={redeemButton}
                          >
                            Redeem
                          </button>

                          {short && (
                            <span className="col-start-3 row-start-2 ml-3 self-start text-right text-xs whitespace-nowrap sm:col-start-6 sm:row-start-1 sm:ml-2 sm:self-auto text-neutral-400 tabular-nums dark:text-neutral-500">
                              {describeAmount(toGo)} to go
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
                          className={`col-start-7 ${besideBoth} ml-2 ${smallControl}`}
                        >
                          <PencilIcon className="size-3.5 shrink-0" />
                        </button>
                      )}

                      <button
                        type="button"
                        // It goes for good, with nothing to undo it from, so it asks first.
                        onClick={() => { setAsking(prize.id) }}
                        aria-label={`Delete the ${words.one} "${prize.name}"`}
                        title={`Delete ${words.one}`}
                        className={`col-start-8 ${besideBoth} ml-1 flex h-6 shrink-0 items-center rounded-lg px-1.5 text-base leading-none ${deleteControl}`}
                      >
                        ×
                      </button>
                    </>
                  )}
                </div>

                {/* Why it cannot be bought, said under it rather than left to a dimmed
                    button (RWD-47): its money has no rate to count it in points. */}
                {uncounted !== null && editing?.id !== prize.id && (
                  <p className="col-span-full px-1 text-xs text-amber-700 dark:text-amber-400">
                    {describeUncounted(uncounted, pointValue)}
                    {pointValue === null && onOpenRules !== undefined && (
                      <>
                        {' '}
                        <button type="button" onClick={onOpenRules} className={link}>
                          Set what a point is worth
                        </button>
                      </>
                    )}
                  </p>
                )}

                {taken === prize.id && (
                  <p role="alert" className="col-span-full px-1 text-xs text-red-600 dark:text-red-400">
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

      {asked !== undefined && (
        <ConfirmSheet
          confirmation={askDelete(asked, words)}
          onCancel={() => { setAsking(null) }}
          onConfirm={() => {
            setAsking(null)
            onDelete(asked.id)
          }}
        />
      )}
    </div>
  )
}
