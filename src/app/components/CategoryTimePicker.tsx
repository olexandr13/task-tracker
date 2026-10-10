import { useRef, useState } from 'react'
import { recentCategoryTime, type Category, type TimeEntryId } from '../../core'
import { CATEGORY_TIME_BUTTON, CATEGORY_TIME_COMMENT_HINT, CATEGORY_TIME_LIST, describeCategoryTimeTitle } from '../balanceLabels'
import { controlOff, rowControlLabel } from '../rowControls'
import { ClockIcon } from './ClockIcon'
import { PickerPanel } from './PickerPanel'
import { LogTimeFields, SessionList } from './TimeLogFields'

interface CategoryTimePickerProps {
  category: Category
  /** The moment the sessions are read for, to say when each was logged. */
  now: Date
  /** A session logged straight to the category, with the comment typed for it or null for none. */
  onLog: (minutes: number, comment: string | null) => void
  onRemove: (entryId: TimeEntryId) => void
  /** Which edge of the button the panel lines up with: the one nearer the middle of the screen. */
  align?: 'left' | 'right'
}

/**
 * Time logged straight to a Balance category, with no task behind it (BAL-14):
 * a **Log time** button on the category that opens a panel laid out as a
 * task's clock is (TIME-3) — a comment, the quick sessions and a box for any
 * other length — and under it the sessions logged here, each with its **×**
 * (BAL-15). The panel stays open after logging, so the new session is in view.
 */
export function CategoryTimePicker({ category, now, onLog, onRemove, align = 'right' }: CategoryTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  // What the next session logged here went on; spaces alone say nothing.
  const [comment, setComment] = useState('')
  const root = useRef<HTMLDivElement>(null)
  const title = describeCategoryTimeTitle(category.name)
  const sessions = recentCategoryTime(category, now)

  function toggle() {
    if (!isOpen) setComment('')
    setIsOpen(!isOpen)
  }

  /** Logs a session with the comment typed, which then goes: it was this session's. */
  function log(minutes: number) {
    onLog(minutes, comment.trim() === '' ? null : comment.trim())
    setComment('')
  }

  return (
    <div
      ref={root}
      className="relative shrink-0"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && isOpen) {
          event.stopPropagation()
          setIsOpen(false)
        }
      }}
    >
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={title}
        title={title}
        className={`${rowControlLabel} ${controlOff} gap-1 text-sm md:text-xs`}
      >
        <ClockIcon className="size-4 shrink-0 md:size-3.5" />
        {CATEGORY_TIME_BUTTON}
      </button>

      {isOpen && (
        <PickerPanel
          anchor={root}
          label={title}
          align={align}
          width="w-[min(22rem,calc(100vw-2rem))] md:w-60"
          content="gap-3 rounded-2xl p-3 md:gap-2 md:rounded-xl md:p-2"
          showing={sessions.length}
          onClose={() => { setIsOpen(false) }}
        >
          <p className="truncate px-1 text-base font-semibold text-neutral-900 md:text-sm dark:text-neutral-100">
            {title}
          </p>

          <LogTimeFields
            comment={comment}
            onCommentChange={setComment}
            onLog={log}
            commentHint={CATEGORY_TIME_COMMENT_HINT}
          />

          {sessions.length > 0 && (
            <SessionList sessions={sessions} now={now} onRemove={onRemove} label={CATEGORY_TIME_LIST} />
          )}
        </PickerPanel>
      )}
    </div>
  )
}
