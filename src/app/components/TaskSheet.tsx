import type { ReactNode } from 'react'
import {
  canSkipOccurrence,
  currentEntries,
  defaultReward,
  dueDay,
  isComplete,
  isOverdue,
  isTimeGoalReached,
  skipOccurrence,
  type List,
  type LocalDay,
  type Task,
} from '../../core'
import type { SkipChoice } from '../dateChoices'
import type { RepeatDraft } from '../repeatDraft'
import {
  completionBoxOff,
  completionBoxOn,
  completionBoxReady,
  controlOff,
  deleteAction,
  rowControlLabel,
  sheetAction,
} from '../rowControls'
import { BottomSheet } from './BottomSheet'
import { DuplicateIcon } from './DuplicateIcon'
import { ListPicker } from './ListPicker'
import { RewardPicker } from './RewardPicker'
import { SchedulePicker } from './SchedulePicker'
import { SubtaskList } from './SubtaskList'
import { TagPicker } from './TagPicker'
import { TaskDescription } from './TaskDescription'
import { TimePicker } from './TimePicker'
import { TrashIcon } from './TrashIcon'
import { UrgentToggle } from './UrgentToggle'
import type { TaskActions } from '../taskActions'
import type { TaskTimer } from '../useTaskTimer'

interface TaskSheetProps {
  task: Task
  now: Date
  knownTags: readonly string[]
  lists: readonly List[]
  draft: RepeatDraft
  /** The title, already the box or the words that open it. */
  title: ReactNode
  onClose: () => void
  /** What can be done to the task; a day and a rule go through the two below, which keep the row's draft in step. */
  actions: TaskActions
  onChangeDueDate: (dueDate: LocalDay | null) => void
  onChangeRepeat: (draft: RepeatDraft) => void
  /** The screen's timer, when one is offered for logging time by running a clock. */
  timer?: Pick<TaskTimer, 'clock' | 'start' | 'stop' | 'isRunningFor' | 'state'>
}

/**
 * A phone's look at a task: the title to edit, what the task holds, and the
 * buttons that act on it, in a sheet over the bar.
 */
export function TaskSheet({
  task,
  now,
  knownTags,
  lists,
  draft,
  title,
  onClose,
  actions,
  onChangeDueDate,
  onChangeRepeat,
  timer,
}: TaskSheetProps) {
  const done = isComplete(task, now)
  const ready = !done && isTimeGoalReached(task, now)
  const overdue = isOverdue(task, now)
  const sessions = currentEntries(task.timeLog, task.repeat, now)
  const timerRunning = timer?.isRunningFor(task.id) ?? false
  const timerStartedAt =
    timerRunning && timer !== undefined && timer.state.status === 'running'
      ? timer.state.startedAt
      : null
  const skipTo = canSkipOccurrence(task, now) ? dueDay(skipOccurrence(task, now), now) : null
  const skip: SkipChoice | undefined =
    skipTo === null ? undefined : { to: skipTo, onSkip: () => { actions.skip(task.id) } }

  return (
    <BottomSheet label={`Details of "${task.title}"`} onClose={onClose}>
      <div className="flex shrink-0 items-start gap-3 px-4 pb-3">
        <button
          type="button"
          onClick={() => {
            if (done) actions.uncomplete(task.id)
            else actions.complete(task.id)
          }}
          aria-pressed={done}
          aria-label={
            done
              ? `Mark "${task.title}" as not done`
              : ready
                ? `Mark "${task.title}" as done: its time goal is reached`
                : `Mark "${task.title}" as done`
          }
          title={ready ? 'Time goal reached: ready to tick off' : undefined}
          className={done ? completionBoxOn : ready ? completionBoxReady : completionBoxOff}
        >
          ✓
        </button>
        <div className="flex min-h-8 min-w-0 flex-1 items-center">{title}</div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="flex flex-col items-stretch gap-1 border-t border-neutral-200 px-4 py-2 md:gap-0.5 dark:border-neutral-800">
          <div className={sheetAction}>
            <SchedulePicker
              dueDate={dueDay(task, now)}
              draft={draft}
              now={now}
              overdue={overdue}
              onChangeDueDate={onChangeDueDate}
              onChangeRepeat={onChangeRepeat}
              skip={skip}
              label={`Schedule for "${task.title}"`}
              showSummary
              fill
              align="left"
            />
          </div>
          <div className={sheetAction}>
            <ListPicker
              listId={task.listId}
              lists={lists}
              onChange={(listId) => { actions.changeList(task.id, listId) }}
              label={`List for "${task.title}"`}
              showName
              align="left"
            />
          </div>
          <div className={sheetAction}>
            <TimePicker
              goal={task.timeGoal}
              sessions={sessions}
              now={now}
              onLog={(minutes) => { actions.logTime(task.id, minutes) }}
              onRemove={(entryId) => { actions.removeTimeEntry(task.id, entryId) }}
              onChangeGoal={(minutes) => { actions.changeTimeGoal(task.id, minutes) }}
              label={`Time for "${task.title}"`}
              showAmount
              align="left"
              timer={
                timer === undefined
                  ? undefined
                  : {
                      running: timerRunning,
                      startedAt: timerStartedAt,
                      clock: timer.clock,
                      onStart: () => { timer.start(task.id) },
                      onStop: () => { timer.stop() },
                    }
              }
            />
          </div>
          <div className={sheetAction}>
            <TagPicker
              tags={task.tags}
              known={knownTags}
              onAdd={(name) => { actions.addTag(task.id, name) }}
              onRemove={(name) => { actions.removeTag(task.id, name) }}
              label={`Tags for "${task.title}"`}
              showNames
              align="left"
            />
          </div>
          <div className={sheetAction}>
            <UrgentToggle
              urgent={task.urgent}
              onChange={(next) => { actions.changeUrgent(task.id, next) }}
              label={`Urgent for "${task.title}"`}
              showName
            />
          </div>
          <div className={sheetAction}>
            <RewardPicker
              reward={task.reward}
              startAt={defaultReward(task.repeat)}
              onChange={(reward) => { actions.changeReward(task.id, reward) }}
              label={`Reward for "${task.title}"`}
              showAmount
              align="left"
            />
          </div>
        </div>

        <div className="border-t border-neutral-200 px-4 py-1 dark:border-neutral-800">
          <SubtaskList
            subtasks={task.subtasks}
            repeat={task.repeat}
            now={now}
            taskTitle={task.title}
            onAdd={(index, next) => { actions.addSubtask(task.id, index, next) }}
            onSetDone={(subtaskId, next) => { actions.setSubtaskDone(task.id, subtaskId, next) }}
            onRename={(subtaskId, next) => { actions.renameSubtask(task.id, subtaskId, next) }}
            onRemove={(subtaskId) => { actions.removeSubtask(task.id, subtaskId) }}
          />
        </div>

        <div className="border-t border-neutral-200 px-4 py-1.5 dark:border-neutral-800">
          <TaskDescription
            description={task.description}
            title={task.title}
            tags={task.tags}
            knownTags={knownTags}
            onChange={(description) => { actions.changeDescription(task.id, description) }}
            onAddTag={(name) => { actions.addTag(task.id, name) }}
          />
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-neutral-200 px-4 py-2 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => { actions.duplicate(task.id) }}
            className={`${rowControlLabel} min-h-12 md:min-h-11 ${controlOff}`}
          >
            <DuplicateIcon />
            Duplicate
          </button>
          <button
            type="button"
            onClick={() => { actions.remove(task.id) }}
            aria-label={`Delete "${task.title}"`}
            className={`${rowControlLabel} min-h-12 md:min-h-11 ${deleteAction}`}
          >
            <TrashIcon />
            Delete
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}
