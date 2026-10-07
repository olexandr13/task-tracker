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
  forgetRestsAhead,
  hasRewardChanges,
  hasDueDay,
  historyStart,
  insertSubtask,
  insertTask,
  isDeleted,
  isHabit,
  liveTasks,
  logSeconds,
  logTime,
  moveSubtask,
  moveTask,
  moveToEndOfHabits,
  moveToList,
  purgeExpired,
  removeSubtask,
  removeTag,
  removeTimeEntry,
  renameSubtask,
  renameTag,
  renameTask,
  restoreTask,
  rewardChanges,
  scheduleOn,
  setDescription,
  setDoneOnDay,
  setDueTime,
  setRepeat,
  setReward,
  setSubtaskDone,
  setTimeGoal,
  setUrgent,
  skipOccurrence,
  tagsInUse,
  uncompleteTask,
  unskipToday,
  withPeriodBonuses,
  NO_BONUSES,
  type ListId,
  type LocalDay,
  type LocalTime,
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
import type { TaskChanges, TaskRepository, TaskScope, TaskSubscription } from '../storage/taskRepository'
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
  // The day from which every finished task is held, null once every task is, and
  // undefined until the tasks have loaded (STORE-55) — as state for the screen, and
  // as it stands this moment for `everywhere`.
  const [heldSince, setHeldSince] = useState<LocalDay | null | undefined>(undefined)
  const held = useRef<LocalDay | null | undefined>(undefined)
  const subscription = useRef<TaskSubscription | null>(null)
  // What `everywhere` was asked to do once every task is held.
  const waiting = useRef<(() => void)[]>([])

  useEffect(() => {
    const opened = repository.subscribe(
      historyStart(new Date()),
      (saved, since) => {
        // Anything whose time in the trash ran out, while the app was closed or on
        // another device, goes now, and so does a habit's rest for a day still to
        // come (HAB-33); both are written back so storage stops carrying them.
        const now = new Date()
        const kept = purgeExpired(saved, now).map((task) => forgetRestsAhead(task, now))
        latest.current = kept
        held.current = since
        setTasks(kept)
        setHeldSince(since)
        setStatus('loaded')
        persist(repository, changesBetween(saved, kept), onProblem)
      },
      (error) => {
        console.error('Could not load tasks.', error)
        setStatus('failed')
        onProblem('load')
      },
    )
    subscription.current = opened

    return () => {
      opened.stop()
      subscription.current = null
      waiting.current = []
    }
  }, [repository, onProblem])

  // Every task is held at last: what was waiting on that goes now.
  useEffect(() => {
    if (heldSince !== null || waiting.current.length === 0) return

    const actions = waiting.current
    waiting.current = []
    for (const action of actions) action()
  }, [heldSince])

  /** Holds history too, from `day` on or all of it with null (STORE-55); asking twice asks once. */
  const reachBack = useCallback((day: LocalDay | null) => {
    subscription.current?.reachBack(day)
  }, [])

  /** How many tasks in `scope` are not held, as the server counts them, or null when it cannot be asked. */
  const unheld = useCallback(
    (scope: TaskScope): Promise<number | null> => subscription.current?.unheld(scope) ?? Promise.resolve(null),
    [],
  )

  /**
   * Runs `action` once every task is held: at once when it is, or else once the
   * history, asked for here, has arrived. A change that has to reach every task —
   * a tag deleted or renamed (TAG-22, TAG-24) — goes through this, or the history
   * would go on carrying what was changed away, and bring it back when loaded.
   */
  const everywhere = useCallback((action: () => void) => {
    if (held.current === null) {
      action()
      return
    }
    waiting.current.push(action)
    subscription.current?.reachBack(null)
  }, [])

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
      day: LocalDay | null = null,
      time: LocalTime | null = null,
      tags: readonly string[] = [],
      listId: ListId | null = null,
      details: {
        description?: string
        reward?: number | null
        urgent?: boolean
        timeGoal?: number | null
        timeLog?: readonly { minutes: number; comment: string | null }[]
        subtasks?: readonly { title: string; done: boolean }[]
      } = {},
    ) => {
      apply((current) => {
        const known = tagsInUse(liveTasks(current))
        // The hour goes on after the day, which is what it hangs on (`setDueTime`):
        // a new task with an hour and no day of any kind would have no moment to
        // be due at, so the hour is simply not taken.
        let task = moveToList(scheduleOn(createTask(title, repeat), day, new Date()), listId)
        if (time !== null && hasDueDay(task)) {
          task = setDueTime(task, time)
        }
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
        for (const entry of details.timeLog ?? []) {
          task = logTime(task, entry.minutes, new Date(), entry.comment)
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
   * The day picked for a task, or taken away: the task is due on it, a repeating
   * task's rule carrying on after it (DUE-18). The rule itself is left alone, and
   * a day the task cannot be given now changes nothing (DUE-27).
   */
  const changeDay = useCallback(
    (id: TaskId, day: LocalDay | null) => {
      apply((current) => {
        const now = new Date()
        return current.map((task) => (task.id === id ? scheduleOn(task, day, now) : task))
      })
    },
    [apply],
  )

  /**
   * The hour picked for a task, or taken away: it is due at that hour on the day
   * it already falls on (DUE-19), which is what the reminder goes off at. The
   * day and the rule are both left alone.
   */
  const changeTime = useCallback(
    (id: TaskId, time: LocalTime | null) => {
      apply((current) => current.map((task) => (task.id === id ? setDueTime(task, time) : task)))
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

  /** Takes a skip of today back, so the task is due today again (HAB-31). */
  const unskip = useCallback(
    (id: TaskId) => {
      apply((current) => current.map((task) => (task.id === id ? unskipToday(task) : task)))
    },
    [apply],
  )

  /**
   * Changes a task's rule. A task taken on as a habit joins the habits at the
   * end (HAB-30), where one added on the page itself lands; a habit whose rule
   * changes while it stays a habit keeps its place.
   */
  const changeRepeat = useCallback(
    (id: TaskId, repeat: Repeat | null) => {
      apply((current) => {
        const before = current.find((task) => task.id === id)
        const next = current.map((task) => (task.id === id ? setRepeat(task, repeat) : task))
        return before !== undefined && !isHabit(before) ? moveToEndOfHabits(next, id) : next
      })
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

  /** Logs a session of time spent on a task, and what it went on (TIME-23). Whether the task is done is left to its box. */
  const logTaskTime = useCallback(
    (id: TaskId, minutes: number, comment: string | null) => {
      apply((current) => current.map((task) => (task.id === id ? logTime(task, minutes, new Date(), comment) : task)))
    },
    [apply],
  )

  /** Logs a timer's run to the second, so short runs add up (TIME-22), and what it went on (TIME-23). */
  const logTaskSeconds = useCallback(
    (id: TaskId, seconds: number, comment: string | null) => {
      apply((current) =>
        current.map((task) => (task.id === id ? logSeconds(task, seconds, new Date(), comment) : task)),
      )
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

  /**
   * Deletes a tag: off every task held that carries it, the tasks themselves
   * staying. Every task, once asked for through `everywhere`.
   */
  const removeTagEverywhere = useCallback(
    (name: string) => {
      apply((current) => deleteTag(current, name))
    },
    [apply],
  )

  /**
   * Renames a tag on every task held that carries it, the tasks themselves
   * staying (TAG-24). Every task, once asked for through `everywhere`.
   */
  const renameTagEverywhere = useCallback(
    (from: string, to: string) => {
      apply((current) => renameTag(current, from, to))
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
   * The ways a checklist changes. Each one is a rule in ../core that also
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

  const moveChecklistItem = useCallback(
    (id: TaskId, subtaskId: SubtaskId, targetId: SubtaskId, placement: Placement) => {
      apply((current) =>
        current.map((task) => (task.id === id ? moveSubtask(task, subtaskId, targetId, placement) : task)),
      )
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
    /** The day from which every finished task is held, or null once every task is (STORE-55). */
    heldSince: heldSince ?? null,
    reachBack,
    unheld,
    everywhere,
    isLoading: status === 'loading',
    /** The repository refused to read the tasks: an empty list then is not an empty account. */
    loadFailed: status === 'failed',
    addTask,
    move,
    complete,
    uncomplete,
    rename,
    changeDescription,
    changeDay,
    changeTime,
    skip,
    unskip,
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
    renameTagEverywhere,
    changeList,
    clearListEverywhere,
    setHabitDay,
    addChecklistItem,
    setChecklistItemDone,
    renameChecklistItem,
    removeChecklistItem,
    moveChecklistItem,
    remove,
    duplicate,
    restore,
    purge,
    emptyTrash,
  }
}
