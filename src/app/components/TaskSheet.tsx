import type { ReactNode } from 'react'
import {
  canSkipOccurrence,
  currentEntries,
  dueDay,
  isComplete,
  isOverdue,
  isTimeGoalReached,
  skipOccurrence,
  type List,
  type ListId,
  type LocalDay,
  type SubtaskId,
  type Task,
  type TaskId,
  type TimeEntryId,
} from '../../core'
import type { SkipChoice } from '../dateChoices'
import type { RepeatDraft } from '../repeatDraft'
import {
  completionBoxOff,
  completionBoxOn,
  completionBoxReady,
  controlOff,
  deleteControl,
  rowControlLabel,
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
import { UrgentToggle } from './UrgentToggle'
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
  onComplete: (id: TaskId) => void
  onUncomplete: (id: TaskId) => void
  onChangeDescription: (id: TaskId, description: string) => void
  onChangeDueDate: (dueDate: LocalDay | null) => void
  onSkipOccurrence: (id: TaskId) => void
  onChangeRepeat: (draft: RepeatDraft) => void
  onChangeReward: (id: TaskId, reward: number | null) => void
  onChangeUrgent: (id: TaskId, urgent: boolean) => void
  onChangeTimeGoal: (id: TaskId, minutes: number | null) => void
  onLogTime: (id: TaskId, minutes: number) => void
  onRemoveTimeEntry: (id: TaskId, entryId: TimeEntryId) => void
  onChangeList: (id: TaskId, listId: ListId | null) => void
  onAddTag: (id: TaskId, name: string) => void
  onRemoveTag: (id: TaskId, name: string) => void
  onRemove: (id: TaskId) => void
  onDuplicate: (id: TaskId) => void
  onAddSubtask: (id: TaskId, index: number, title: string) => void
  onSetSubtaskDone: (id: TaskId, subtaskId: SubtaskId, done: boolean) => void
  onRenameSubtask: (id: TaskId, subtaskId: SubtaskId, title: string) => void
  onRemoveSubtask: (id: TaskId, subtaskId: SubtaskId) => void
  /** The screen's timer, when one is offered for logging time by running a clock. */
  timer?: Pick<TaskTimer, 'clock' | 'start' | 'stop' | 'isRunningFor' | 'state'>
}

const action = 'flex min-h-12 w-full min-w-0 items-center md:min-h-11'

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
  onComplete,
  onUncomplete,
  onChangeDescription,
  onChangeDueDate,
  onSkipOccurrence,
  onChangeRepeat,
  onChangeReward,
  onChangeUrgent,
  onChangeTimeGoal,
  onLogTime,
  onRemoveTimeEntry,
  onChangeList,
  onAddTag,
  onRemoveTag,
  onRemove,
  onDuplicate,
  onAddSubtask,
  onSetSubtaskDone,
  onRenameSubtask,
  onRemoveSubtask,
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
    skipTo === null ? undefined : { to: skipTo, onSkip: () => { onSkipOccurrence(task.id) } }

  return (
    <BottomSheet label={`Details of "${task.title}"`} onClose={onClose}>
      <div className="flex shrink-0 items-start gap-3 px-4 pt-1 pb-3">
        <button
          type="button"
          onClick={() => {
            if (done) onUncomplete(task.id)
            else onComplete(task.id)
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
        <div className="flex min-w-0 flex-1 items-center pt-1.5">{title}</div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="flex flex-col items-stretch gap-1 border-t border-neutral-200 px-4 py-2 md:gap-0.5 dark:border-neutral-800">
          <div className={action}>
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
              align="left"
            />
          </div>
          <div className={action}>
            <ListPicker
              listId={task.listId}
              lists={lists}
              onChange={(listId) => { onChangeList(task.id, listId) }}
              label={`List for "${task.title}"`}
              showName
              align="left"
            />
          </div>
          <div className={action}>
            <TimePicker
              goal={task.timeGoal}
              sessions={sessions}
              now={now}
              onLog={(minutes) => { onLogTime(task.id, minutes) }}
              onRemove={(entryId) => { onRemoveTimeEntry(task.id, entryId) }}
              onChangeGoal={(minutes) => { onChangeTimeGoal(task.id, minutes) }}
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
          <div className={action}>
            <TagPicker
              tags={task.tags}
              known={knownTags}
              onAdd={(name) => { onAddTag(task.id, name) }}
              onRemove={(name) => { onRemoveTag(task.id, name) }}
              label={`Tags for "${task.title}"`}
              showNames
              align="left"
            />
          </div>
          <div className={action}>
            <UrgentToggle
              urgent={task.urgent}
              onChange={(next) => { onChangeUrgent(task.id, next) }}
              label={`Urgent for "${task.title}"`}
              showName
            />
          </div>
          <div className={action}>
            <RewardPicker
              reward={task.reward}
              repeat={task.repeat}
              onChange={(reward) => { onChangeReward(task.id, reward) }}
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
            onAdd={(index, next) => { onAddSubtask(task.id, index, next) }}
            onSetDone={(subtaskId, next) => { onSetSubtaskDone(task.id, subtaskId, next) }}
            onRename={(subtaskId, next) => { onRenameSubtask(task.id, subtaskId, next) }}
            onRemove={(subtaskId) => { onRemoveSubtask(task.id, subtaskId) }}
          />
        </div>

        <div className="border-t border-neutral-200 px-4 py-1.5 dark:border-neutral-800">
          <TaskDescription
            description={task.description}
            title={task.title}
            tags={task.tags}
            knownTags={knownTags}
            onChange={(description) => { onChangeDescription(task.id, description) }}
            onAddTag={(name) => { onAddTag(task.id, name) }}
          />
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-neutral-200 px-4 py-2 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => { onDuplicate(task.id) }}
            className={`${rowControlLabel} min-h-12 md:min-h-11 ${controlOff}`}
          >
            <DuplicateIcon />
            Duplicate
          </button>
          <button
            type="button"
            onClick={() => { onRemove(task.id) }}
            aria-label={`Delete "${task.title}"`}
            className={`${rowControlLabel} min-h-12 md:min-h-11 ${deleteControl}`}
          >
            × Delete
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}
