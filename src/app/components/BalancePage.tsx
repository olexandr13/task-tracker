import { useId, useState, type KeyboardEvent } from 'react'
import {
  balanceByDay,
  balanceSessions,
  balanceTotals,
  isCategoryLimitReached,
  isCategoryName,
  toLocalDay,
  type Category,
  type CategoryId,
  type Period,
  type Task,
  type TimeEntryChange,
  type TimeEntryId,
} from '../../core'
import {
  BALANCE_HEADING,
  BALANCE_INTRO,
  CATEGORIES_HELP,
  CATEGORY_LIMIT,
  CATEGORY_NAME_EMPTY,
  CATEGORY_NAME_TAKEN,
  CATEGORY_NAME_TOO_LONG,
  NO_CATEGORIES_HINT,
  NOTHING_LOGGED,
  PERIOD_CHOICES,
  PERIOD_IN_A_SENTENCE,
} from '../balanceLabels'
import { balancePieces, type PieceKey } from '../balancePieces'
import { deleteControl } from '../rowControls'
import { BalanceSessionList } from './BalanceSessionList'
import { CategoryTimePicker } from './CategoryTimePicker'
import { DayColumnsChart } from './DayColumnsChart'
import { InfoButton } from './InfoButton'
import { TimeSplitChart } from './TimeSplitChart'
import { PencilIcon } from './PencilIcon'
import { TagPicker } from './TagPicker'

const heading = 'text-sm font-medium text-neutral-700 dark:text-neutral-300'
const card = 'rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
const note = 'text-xs text-neutral-500 dark:text-neutral-400'
const field =
  'min-w-0 flex-1 rounded-lg border border-neutral-300 bg-transparent px-2.5 py-2 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none md:px-2 md:py-1 md:text-sm dark:border-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-500'
const warning = 'px-1 text-xs text-red-600 dark:text-red-400'
const smallControl =
  'flex size-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 md:size-6 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'
const chip =
  'flex max-w-40 min-w-0 items-center gap-0.5 rounded-full bg-neutral-100 py-0.5 pr-0.5 pl-2 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'

/** A segment of the period control; its radio is the one it wears the focus ring for (as ThemePicker). */
const segment =
  'flex min-h-10 cursor-pointer items-center justify-center rounded-md px-3 text-sm text-neutral-500 transition-colors outline-offset-2 hover:text-neutral-900 has-checked:bg-white has-checked:font-medium has-checked:text-neutral-900 has-checked:shadow-sm has-focus-visible:outline-2 has-focus-visible:outline-blue-500 md:min-h-8 dark:text-neutral-400 dark:hover:text-neutral-100 dark:has-checked:bg-neutral-700 dark:has-checked:text-neutral-100'

interface BalancePageProps {
  categories: readonly Category[]
  /** Every task, the trash too: time on a deleted task still counts until it is purged (BAL-3). */
  tasks: readonly Task[]
  /** Every tag there is, to bind. */
  knownTags: readonly string[]
  now: Date
  /** Makes a category. False when there is one of that name already, or as many as there can be. */
  onAdd: (name: string) => boolean
  /** Renames a category. False when another is called that already. */
  onRename: (id: CategoryId, name: string) => boolean
  onBind: (id: CategoryId, tag: string) => void
  onUnbind: (id: CategoryId, tag: string) => void
  /** Logs time straight to a category, with what it went on or null for nothing said (BAL-14). */
  onLogTime: (id: CategoryId, minutes: number, comment: string | null) => void
  /** Takes back a session logged straight to a category (BAL-15). */
  onRemoveTime: (id: CategoryId, entryId: TimeEntryId) => void
  /** Changes how long a session logged straight to a category was and what it went on (BAL-15). */
  onChangeTime: (id: CategoryId, entryId: TimeEntryId, change: TimeEntryChange) => void
  onDelete: (id: CategoryId) => void
}

/**
 * The Balance page (BAL-1): how the time logged in a period divides between the
 * categories the owner names, each bound to tags, so a day of nothing but work
 * shows as one. Above, the totals for Today, this week or this month; below,
 * the categories themselves, made, renamed, bound and deleted in place, and
 * time logged straight to one (BAL-14).
 *
 * The period is not kept: the page opens on Today, which is the one asked about
 * most — whether there has been any rest yet (BAL-2).
 */
export function BalancePage({
  categories,
  tasks,
  knownTags,
  now,
  onAdd,
  onRename,
  onBind,
  onUnbind,
  onLogTime,
  onRemoveTime,
  onChangeTime,
  onDelete,
}: BalancePageProps) {
  const [period, setPeriod] = useState<Period>('today')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-1.5">
        <h2 className="text-lg leading-6 text-neutral-900 dark:text-neutral-100">{BALANCE_HEADING}</h2>
        <InfoButton label={BALANCE_HEADING}>
          {BALANCE_INTRO.map((line) => (
            <p key={line}>{line}</p>
          ))}
          {CATEGORIES_HELP.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </InfoButton>
      </div>

      <Totals categories={categories} tasks={tasks} period={period} now={now} onPeriodChange={setPeriod} />

      <Categories
        categories={categories}
        knownTags={knownTags}
        now={now}
        onAdd={onAdd}
        onRename={onRename}
        onBind={onBind}
        onUnbind={onUnbind}
        onLogTime={onLogTime}
        onRemoveTime={onRemoveTime}
        onChangeTime={onChangeTime}
        onDelete={onDelete}
      />
    </div>
  )
}

interface TotalsProps {
  categories: readonly Category[]
  tasks: readonly Task[]
  period: Period
  now: Date
  onPeriodChange: (period: Period) => void
}

/**
 * The time spent in the period (BAL-6): its total and one bar divided between
 * the categories, with the legend under it, and on a week or a month the same
 * day by day (BAL-13). A piece pressed in the legend stays picked out across
 * both charts, and across a change of period, and its sessions are listed under
 * them (BAL-16) — only then, so the page does not open on a long list.
 */
function Totals({ categories, tasks, period, now, onPeriodChange }: TotalsProps) {
  const headingId = useId()
  const [pinned, setPinned] = useState<PieceKey | null>(null)
  const [pointed, setPointed] = useState<PieceKey | null>(null)

  const totals = balanceTotals(categories, tasks, period, now)
  const pieces = balancePieces(totals)
  // Picking out something the period has no time for would only fade everything.
  const wanted = pointed ?? pinned
  const active = pieces.some((piece) => piece.key === wanted) ? wanted : null
  // Only a press lists the sessions: pointing would push the page about under the pointer.
  const listed = pieces.find((piece) => piece.key === pinned) ?? null

  return (
    <section aria-labelledby={headingId} className={`${card} flex flex-col gap-3 px-4 py-3.5`}>
      <h2 id={headingId} className={heading}>
        Time spent
      </h2>

      <div
        role="radiogroup"
        aria-label="Period"
        className="grid grid-cols-3 gap-1 rounded-lg bg-neutral-100 p-1 md:max-w-xs dark:bg-neutral-800"
      >
        {PERIOD_CHOICES.map((choice) => (
          <label key={choice.period} className={segment}>
            <input
              type="radio"
              name="balance-period"
              value={choice.period}
              checked={period === choice.period}
              onChange={() => { onPeriodChange(choice.period) }}
              className="sr-only"
            />
            {choice.label}
          </label>
        ))}
      </div>

      {totals.total === 0 ? (
        <p className="py-2 text-sm text-neutral-500 dark:text-neutral-400">{NOTHING_LOGGED[period]}</p>
      ) : (
        <>
          <TimeSplitChart
            pieces={pieces}
            total={totals.total}
            when={PERIOD_IN_A_SENTENCE[period]}
            active={active}
            pinned={pinned}
            onPin={(key) => { setPinned(pinned === key ? null : key) }}
            onPreview={setPointed}
          />

          {period !== 'today' && (
            <DayColumnsChart
              // Keyed by the period, so a day chosen in a week is not looked for in a month.
              key={period}
              columns={balanceByDay(categories, tasks, period, now).map((day) => ({
                day: day.day,
                total: day.total,
                pieces: balancePieces(day),
              }))}
              period={period}
              today={toLocalDay(now)}
              active={active}
            />
          )}

          {listed !== null && (
            <BalanceSessionList
              piece={listed}
              sessions={balanceSessions(categories, tasks, listed.key === 'other' ? null : listed.key, period, now)}
              when={PERIOD_IN_A_SENTENCE[period]}
              now={now}
            />
          )}
        </>
      )}

      {categories.length === 0 && <p className={note}>{NO_CATEGORIES_HINT}</p>}
    </section>
  )
}

interface CategoriesProps {
  categories: readonly Category[]
  knownTags: readonly string[]
  now: Date
  onAdd: (name: string) => boolean
  onRename: (id: CategoryId, name: string) => boolean
  onBind: (id: CategoryId, tag: string) => void
  onUnbind: (id: CategoryId, tag: string) => void
  onLogTime: (id: CategoryId, minutes: number, comment: string | null) => void
  onRemoveTime: (id: CategoryId, entryId: TimeEntryId) => void
  onChangeTime: (id: CategoryId, entryId: TimeEntryId, change: TimeEntryChange) => void
  onDelete: (id: CategoryId) => void
}

/** Why a name typed for a category is refused, or a new one at all. */
type Refusal = 'empty' | 'invalid' | 'taken' | 'full'

const REFUSALS: Record<Refusal, string> = {
  empty: CATEGORY_NAME_EMPTY,
  invalid: CATEGORY_NAME_TOO_LONG,
  taken: CATEGORY_NAME_TAKEN,
  full: CATEGORY_LIMIT,
}

function checkName(name: string): Refusal | null {
  if (name.trim() === '') return 'empty'
  return isCategoryName(name) ? null : 'invalid'
}

/**
 * The categories, edited where they are listed (BAL-7 to BAL-10): a box on top
 * makes one, and each row renames itself in place, binds and unbinds its tags,
 * takes time logged straight to it (BAL-14), and deletes itself. A refused name
 * is said under its box rather than the button being dimmed, so the reason is
 * there when the click is.
 */
function Categories({
  categories,
  knownTags,
  now,
  onAdd,
  onRename,
  onBind,
  onUnbind,
  onLogTime,
  onRemoveTime,
  onChangeTime,
  onDelete,
}: CategoriesProps) {
  const headingId = useId()
  const [typed, setTyped] = useState('')
  const [refused, setRefused] = useState<Refusal | null>(null)
  // The category being renamed, what has been typed over its name, and why it was last refused.
  const [editing, setEditing] = useState<{ id: CategoryId; name: string; refused: Refusal | null } | null>(null)

  function handleAdd() {
    const refusal = checkName(typed) ?? (isCategoryLimitReached(categories) ? 'full' : null)
    if (refusal !== null) {
      setRefused(refusal)
      return
    }

    if (onAdd(typed)) {
      setTyped('')
      setRefused(null)
    } else {
      setRefused('taken')
    }
  }

  function commitRename() {
    if (editing === null) return

    const category = categories.find((candidate) => candidate.id === editing.id)
    if (category === undefined) {
      setEditing(null)
      return
    }

    const refusal = checkName(editing.name)
    // A name that will not do leaves the box open with it still in, to fix or give up on.
    if (refusal !== null) {
      setEditing({ ...editing, refused: refusal })
      return
    }

    if (editing.name.trim() === category.name || onRename(category.id, editing.name)) {
      setEditing(null)
    } else {
      setEditing({ ...editing, refused: 'taken' })
    }
  }

  function handleRenameKeys(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      commitRename()
    } else if (event.key === 'Escape') {
      // Giving up leaves the category named as it was, as dropping a title edit does.
      event.preventDefault()
      setEditing(null)
    }
  }

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h2 id={headingId} className={heading}>
        Categories
      </h2>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            name="category-name"
            value={typed}
            onChange={(event) => {
              setTyped(event.target.value)
              setRefused(null)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                handleAdd()
              }
            }}
            placeholder="Add a category"
            aria-label="Name of the new category"
            aria-invalid={refused !== null}
            autoComplete="off"
            enterKeyHint="done"
            className={field}
          />
          <button
            type="button"
            onClick={handleAdd}
            className="shrink-0 self-stretch rounded-lg px-3 text-base text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 active:bg-neutral-100 md:self-auto md:px-2.5 md:py-1 md:text-sm dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 dark:active:bg-neutral-800"
          >
            Add
          </button>
        </div>
        {refused !== null && (
          <p role="alert" className={warning}>
            {REFUSALS[refused]}
          </p>
        )}
      </div>

      {categories.length === 0 ? (
        <p className="py-4 text-center text-sm text-neutral-400 dark:text-neutral-600">
          No categories yet. Add one above, such as Work or Rest.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {categories.map((category) => (
            <li key={category.id} className={`${card} flex flex-col gap-2 py-2 pr-1.5 pl-3`}>
              <div className="flex items-center gap-1">
                {editing?.id === category.id ? (
                  <input
                    type="text"
                    name="category-name"
                    value={editing.name}
                    onChange={(event) => { setEditing({ id: category.id, name: event.target.value, refused: null }) }}
                    onKeyDown={handleRenameKeys}
                    onBlur={commitRename}
                    // Asking to rename is asking to type: the caret goes there, over the old name.
                    autoFocus
                    aria-label={`Name of the category "${category.name}"`}
                    aria-invalid={editing.refused !== null}
                    autoComplete="off"
                    enterKeyHint="done"
                    className={field}
                  />
                ) : (
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {category.name}
                  </span>
                )}

                {editing?.id !== category.id && (
                  <CategoryTimePicker
                    category={category}
                    now={now}
                    onLog={(minutes, comment) => { onLogTime(category.id, minutes, comment) }}
                    onRemove={(entryId) => { onRemoveTime(category.id, entryId) }}
                    onChange={(entryId, change) => { onChangeTime(category.id, entryId, change) }}
                  />
                )}

                {editing?.id !== category.id && (
                  <button
                    type="button"
                    onClick={() => { setEditing({ id: category.id, name: category.name, refused: null }) }}
                    aria-label={`Rename the category "${category.name}"`}
                    title="Rename category"
                    className={smallControl}
                  >
                    <PencilIcon className="size-3.5 shrink-0" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => { onDelete(category.id) }}
                  aria-label={`Delete the category "${category.name}"`}
                  title="Delete category"
                  className={`flex h-8 shrink-0 items-center rounded-lg px-2 text-base leading-none md:h-6 md:px-1.5 ${deleteControl}`}
                >
                  ×
                </button>
              </div>

              {editing?.id === category.id && editing.refused !== null && (
                <p role="alert" className={warning}>
                  {REFUSALS[editing.refused]}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-1.5">
                {category.tags.length === 0 ? (
                  <span className={note}>No tags bound yet.</span>
                ) : (
                  <ul aria-label={`Tags bound to ${category.name}`} className="flex min-w-0 flex-wrap gap-1">
                    {category.tags.map((tag) => (
                      <li key={tag} className={chip}>
                        <span className="min-w-0 truncate">#{tag}</span>
                        <button
                          type="button"
                          onClick={() => { onUnbind(category.id, tag) }}
                          aria-label={`Unbind "${tag}" from ${category.name}`}
                          title="Unbind tag"
                          className={`flex size-5 shrink-0 items-center justify-center rounded-full leading-none ${deleteControl}`}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <TagPicker
                  tags={category.tags}
                  known={knownTags}
                  onAdd={(tag) => { onBind(category.id, tag) }}
                  onRemove={(tag) => { onUnbind(category.id, tag) }}
                  label={`Tags bound to ${category.name}`}
                  align="left"
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
