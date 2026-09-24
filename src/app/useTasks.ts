import { useCallback, useEffect, useRef, useState } from 'react'
import {
  addTag,
  appendTask,
  clearList,
  completeTask,
  createTask,
  deleteTag,
  deleteTask,
  duplicateTask,
  hasRewardChanges,
  insertSubtask,
  insertTask,
  isDeleted,
  liveTasks,
  logSeconds,
  logTime,
  moveTask,
  moveToList,
  purgeExpired,
  removeSubtask,
  removeTag,
  removeTimeEntry,
  renameSubtask,
  renameTask,
  restoreTask,
  rewardChanges,
  scheduleOnce,
  setDescription,
  setDoneOnDay,
  setDueDate,
  setRepeat,
  setReward,
  setSubtaskDone,
  setTimeGoal,
  setUrgent,
  skipOccurrence,
  tagsInUse,
  uncompleteTask,
  withPeriodBonuses,
  NO_BONUSES,
  type ListId,
  type LocalDay,
  type PeriodBonuses,
  type Placement,
  type Repeat,
  type RewardChanges,
  type RewardEntry,
  type SubtaskId,
  type Task,
  type TaskId,
  type TimeEntryId,
} from '../core'
import type { RewardRepository } from '../storage/rewardRepository'
import { changesBetween, hasChanges } from '../storage/recordChanges'
import type { TaskChanges, TaskRepository } from '../storage/taskRepository'
import { ignoreProblems, type ReportProblem } from './storageProblem'

function persist(repository: TaskRepository, changes: TaskChanges, onProblem: ReportProblem): void {
  if (!hasChanges(changes)) return

  repository.save(changes).catch((error: unknown) => {
    console.error('Could not save tasks.', error)
    onProblem('save')
  })
}

function record(rewards: RewardRepository, changes: RewardChanges, onProblem: ReportProblem): void {
  if (!hasRewardChanges(changes)) return

  rewards.save(changes).catch((error: unknown) => {
    console.error('Could not save rewards.', error)
    onProblem('save')
  })
}

/**
 * Holds the task list on screen and keeps it and the repository in step both
 * ways: a change made here is saved, and one saved elsewhere — another tab,
 * another device — comes back through the subscription and is shown.
 * The rules themselves live in ../core; this only wires them to React.
 *
 * What a change here earns or takes back is recorded in `rewards` alongside it,
 * the period bonuses included: a change that leaves Today, this week or this
 * month clear earns that period's bonus, and one that leaves it unclear again
 * takes it back (RWD-24, RWD-29). Taking one back needs to know where in the
 * period it was earned, which is what `earned` is for. A change arriving from
 * elsewhere is not recorded: the device that made it recorded it.
 *
 * A load or a save the repository refuses is told to `onProblem` (STORE-13),
 * which is expected to stay the same function from render to render.
 */
export function useTasks(
  repository: TaskRepository,
  rewards: RewardRepository,
  onProblem: ReportProblem = ignoreProblems,
  /** What clearing each period earns as things stand (RWD-24, RWD-29), null where nothing does. */
  bonuses: PeriodBonuses = NO_BONUSES,
  /** What the ledger holds already, so a bonus is taken back off the day it was earned on. */
  earned: readonly RewardEntry[] = [],
) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [status, setStatus] = useState<'loading' | 'loaded' | 'failed'>('loading')
  // The list as the last change left it, ahead of the render that draws it. Every
  // change builds on this rather than on the list last drawn, so two changes made
  // in one go — a title and a description kept together — each build on the one
  // before instead of the second quietly putting back what the first changed.
  const latest = useRef<Task[]>([])

  useEffect(() => {
    return repository.subscribe(
      (saved) => {
        // Anything whose time in the trash ran out, while the app was closed or on
        // another device, goes now, and is written back so storage stops carrying it.
        const kept = purgeExpired(saved)
        latest.current = kept
        setTasks(kept)
        setStatus('loaded')
        persist(repository, changesBetween(saved, kept), onProblem)
      },
      (error) => {
        console.error('Could not load tasks.', error)
        setStatus('failed')
        onProblem('load')
      },
    )
  }, [repository, onProblem])

  const apply = useCallback(
    (change: (current: Task[]) => Task[]) => {
      // Expiry is a matter of elapsed time, so any moment the list is touched is
      // a fair one to take the trash out too. Only the tasks the change touched are
      // written, so nothing another device changed meanwhile is written back over.
      const before = latest.current
      const next = purgeExpired(change(before))
      latest.current = next
      setTasks(next)
      persist(repository, changesBetween(before, next), onProblem)
      // The moment of the change, which says whose day the bonus is for.
      record(
        rewards,
        withPeriodBonuses(rewardChanges(before, next), before, next, bonuses, earned, new Date()),
        onProblem,
      )
    },
    [repository, rewards, onProblem, bonuses, earned],
  )

  const addTask = useCallback(
    (
      title: string,
      repeat: Repeat | null = null,
      dueDate: LocalDay | null = null,
      tags: readonly string[] = [],
      listId: ListId | null = null,
      details: {
        description?: string
        reward?: number | null
        urgent?: boolean
        timeGoal?: number | null
        timeLogMinutes?: readonly number[]
        subtasks?: readonly { title: string; done: boolean }[]
      } = {},
    ) => {
      apply((current) => {
        const known = tagsInUse(liveTasks(current))
        let task = moveToList(setDueDate(createTask(title, repeat), dueDate), listId)
        task = tags.reduce((tagged, tag) => addTag(tagged, tag, known), task)
        if (details.description !== undefined && details.description.length > 0) {
          task = setDescription(task, details.description)
        }
        if (details.reward !== undefined) {
          task = setReward(task, details.reward)
        }
        if (details.urgent === true) {
          task = setUrgent(task, true)
        }
        if (details.timeGoal !== undefined) {
          task = setTimeGoal(task, details.timeGoal)
        }
        for (const minutes of details.timeLogMinutes ?? []) {
          task = logTime(task, minutes)
        }
        for (const item of details.subtasks ?? []) {
          task = insertSubtask(task, task.subtasks.length, item.title)
          if (item.done) {
            const added = task.subtasks[task.subtasks.length - 1]
            if (added !== undefined) {
              task = setSubtaskDone(task, added.id, true)
            }
          }
        }
        return appendTask(current, task)
      })
    },
    [apply],
  )

  /** Puts a task just before or just after another — what a drag and drop asks for. */
  const move = useCallback(
    (id: TaskId, targetId: TaskId, placement: Placement) => {
      apply((current) => moveTask(current, id, targetId, placement))
    },
    [apply],
  )

  const complete = useCallback(
    (id: TaskId) => {
      apply((current) => current.map((task) => (task.id === id ? completeTask(task) : task)))
    },
    [apply],
  )

  const uncomplete = useCallback(
    (id: TaskId) => {
      apply((current) => current.map((task) => (task.id === id ? uncompleteTask(task) : task)))
    },
    [apply],
  )

  const rename = useCallback(
    (id: TaskId, title: string) => {
      apply((current) => current.map((task) => (task.id === id ? renameTask(task, title) : task)))
    },
    [apply],
  )

  const changeDescription = useCallback(
    (id: TaskId, description: string) => {
      apply((current) => current.map((task) => (task.id === id ? setDescription(task, description) : task)))
    },
    [apply],
  )

  /**
   * A day picked for a repeating task ends its rule: only a one-off carries a
   * date. Hands back the task it was when a rule ended this way, so the caller
   * can offer to put it back (DUE-17); null when no rule ended, there being
   * nothing to take back.
   */
  const changeDueDate = useCallback(
    (id: TaskId, dueDate: LocalDay | null): Task | null => {
      const target = latest.current.find((task) => task.id === id)
      apply((current) =>
        current.map((task) =>
          task.id !== id ? task : dueDate === null ? setDueDate(task, null) : scheduleOnce(task, dueDate),
        ),
      )
      return target === undefined || target.repeat === null || dueDate === null ? null : target
    },
    [apply],
  )

  /** Passes over a repeating task's occurrence, so it is due on the rule's next day. It earns nothing. */
  const skip = useCallback(
    (id: TaskId) => {
      apply((current) => current.map((task) => (task.id === id ? skipOccurrence(task) : task)))
    },
    [apply],
  )

  const changeRepeat = useCallback(
    (id: TaskId, repeat: Repeat | null) => {
      apply((current) => current.map((task) => (task.id === id ? setRepeat(task, repeat) : task)))
    },
    [apply],
  )

  /** Gives a task a reward, changes it, or takes it away with null. Later completions earn it. */
  const changeReward = useCallback(
    (id: TaskId, reward: number | null) => {
      apply((current) => current.map((task) => (task.id === id ? setReward(task, reward) : task)))
    },
    [apply],
  )

  /** Marks a task urgent, or clears the mark. */
  const changeUrgent = useCallback(
    (id: TaskId, urgent: boolean) => {
      apply((current) => current.map((task) => (task.id === id ? setUrgent(task, urgent) : task)))
    },
    [apply],
  )

  /** Gives a task a time goal, changes it, or takes it away with null. */
  const changeTimeGoal = useCallback(
    (id: TaskId, minutes: number | null) => {
      apply((current) => current.map((task) => (task.id === id ? setTimeGoal(task, minutes) : task)))
    },
    [apply],
  )

  /** Logs a session of time spent on a task. Whether the task is done is left to its box. */
  const logTaskTime = useCallback(
    (id: TaskId, minutes: number) => {
      apply((current) => current.map((task) => (task.id === id ? logTime(task, minutes) : task)))
    },
    [apply],
  )

  /** Logs a timer's run to the second, so short runs add up (TIME-22). */
  const logTaskSeconds = useCallback(
    (id: TaskId, seconds: number) => {
      apply((current) => current.map((task) => (task.id === id ? logSeconds(task, seconds) : task)))
    },
    [apply],
  )

  const removeTaskTime = useCallback(
    (id: TaskId, entryId: TimeEntryId) => {
      apply((current) => current.map((task) => (task.id === id ? removeTimeEntry(task, entryId) : task)))
    },
    [apply],
  )

  /**
   * Puts a tag on a task, spelled the way the tag already is — in `known`, every
   * tag there is, or wherever another live task carries it — so one tag is never
   * written two ways.
   */
  const tag = useCallback(
    (id: TaskId, name: string, known: readonly string[] = []) => {
      apply((current) => {
        const spellings = [...known, ...tagsInUse(liveTasks(current))]
        return current.map((task) => (task.id === id ? addTag(task, name, spellings) : task))
      })
    },
    [apply],
  )

  const untag = useCallback(
    (id: TaskId, name: string) => {
      apply((current) => current.map((task) => (task.id === id ? removeTag(task, name) : task)))
    },
    [apply],
  )

  /** Deletes a tag: off every task that carries it, the tasks themselves staying. */
  const removeTagEverywhere = useCallback(
    (name: string) => {
      apply((current) => deleteTag(current, name))
    },
    [apply],
  )

  /** Files a task under a list, or in no list — the Inbox — with null. */
  const changeList = useCallback(
    (id: TaskId, listId: ListId | null) => {
      apply((current) => current.map((task) => (task.id === id ? moveToList(task, listId) : task)))
    },
    [apply],
  )

  /**
   * Empties a list: every task in it goes back to the Inbox, the tasks themselves
   * staying. The list record is deleted separately (useLists).
   */
  const clearListEverywhere = useCallback(
    (listId: ListId) => {
      apply((current) => clearList(current, listId))
    },
    [apply],
  )

  /** Marks a habit done on a day up to today, or not done. */
  const setHabitDay = useCallback(
    (id: TaskId, day: LocalDay, done: boolean) => {
      apply((current) => current.map((task) => (task.id === id ? setDoneOnDay(task, day, done) : task)))
    },
    [apply],
  )

  /**
   * The four ways a checklist changes. Each one is a rule in ../core that also
   * settles whether the task itself is done, so there is nothing to decide here.
   */
  const addChecklistItem = useCallback(
    (id: TaskId, index: number, title: string) => {
      apply((current) => current.map((task) => (task.id === id ? insertSubtask(task, index, title) : task)))
    },
    [apply],
  )

  const setChecklistItemDone = useCallback(
    (id: TaskId, subtaskId: SubtaskId, done: boolean) => {
      apply((current) => current.map((task) => (task.id === id ? setSubtaskDone(task, subtaskId, done) : task)))
    },
    [apply],
  )

  const renameChecklistItem = useCallback(
    (id: TaskId, subtaskId: SubtaskId, title: string) => {
      apply((current) => current.map((task) => (task.id === id ? renameSubtask(task, subtaskId, title) : task)))
    },
    [apply],
  )

  const removeChecklistItem = useCallback(
    (id: TaskId, subtaskId: SubtaskId) => {
      apply((current) => current.map((task) => (task.id === id ? removeSubtask(task, subtaskId) : task)))
    },
    [apply],
  )

  /**
   * Moves the task to the trash, and hands back the task it was so the caller
   * can offer to undo it. Null when there was nothing there to delete.
   */
  const remove = useCallback(
    (id: TaskId): Task | null => {
      const target = latest.current.find((task) => task.id === id)
      if (target === undefined || isDeleted(target)) {
        return null
      }

      apply((current) => current.map((task) => (task.id === id ? deleteTask(task) : task)))
      return target
    },
    [apply],
  )

  /** Puts a fresh copy of the task just below it. */
  const duplicate = useCallback(
    (id: TaskId) => {
      apply((current) => {
        const original = current.find((task) => task.id === id)
        return original === undefined ? current : insertTask(current, duplicateTask(original), id, 'after')
      })
    },
    [apply],
  )

  const restore = useCallback(
    (id: TaskId) => {
      apply((current) => current.map((task) => (task.id === id ? restoreTask(task) : task)))
    },
    [apply],
  )

  /**
   * Puts a record back exactly as it was, for an undo its own rules cannot
   * rebuild: ending a repeat lets go of the ticks and sessions of occurrences
   * gone by (DUE-17), which setting the rule again would not bring back.
   */
  const putBack = useCallback(
    (was: Task) => {
      apply((current) => current.map((task) => (task.id === was.id ? was : task)))
    },
    [apply],
  )

  /** The end of the line: gone from storage, with nothing left to restore. */
  const purge = useCallback(
    (id: TaskId) => {
      apply((current) => current.filter((task) => task.id !== id))
    },
    [apply],
  )

  const emptyTrash = useCallback(() => {
    apply(liveTasks)
  }, [apply])

  return {
    tasks,
    isLoading: status === 'loading',
    /** The repository refused to read the tasks: an empty list then is not an empty account. */
    loadFailed: status === 'failed',
    addTask,
    move,
    complete,
    uncomplete,
    rename,
    changeDescription,
    changeDueDate,
    skip,
    changeRepeat,
    changeReward,
    changeUrgent,
    changeTimeGoal,
    logTaskTime,
    logTaskSeconds,
    removeTaskTime,
    tag,
    untag,
    removeTagEverywhere,
    changeList,
    clearListEverywhere,
    setHabitDay,
    addChecklistItem,
    setChecklistItemDone,
    renameChecklistItem,
    removeChecklistItem,
    remove,
    duplicate,
    restore,
    putBack,
    purge,
    emptyTrash,
  }
}
