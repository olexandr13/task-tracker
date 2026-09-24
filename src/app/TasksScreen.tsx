import { useEffect, useState } from 'react'
import {
  allTags,
  countInboxOpen,
  prizesOfKind,
  groupByCompletion,
  habitTasks,
  isComplete,
  liveTasks,
  pinFocusedFirst,
  sameTag,
  secondsSpent,
  setSubtaskDone,
  sortForDisplay,
  summarizeLists,
  summarizeTags,
  trashedTasks,
  type ListId,
  type LocalDay,
  type Prize,
  type RedemptionId,
  type Repeat,
  type RewardKey,
  type SubtaskId,
  type Task,
  type TaskId,
} from '../core'
import { createAccountStorage } from '../storage/accountStorage'
import type { Account } from '../storage/authService'
import { deviceStorage } from '../storage/deviceStorage'
import { quotableQuoteSource } from '../storage/quotableQuoteSource'
import type { Theme } from '../storage/themeRepository'
import { AddTaskForm } from './components/AddTaskForm'
import { AddTaskSheet } from './components/AddTaskSheet'
import { BottomNav } from './components/BottomNav'
import { FolderIcon } from './components/FolderIcon'
import { HabitList } from './components/HabitList'
import { HabitViewOptionsMenu } from './components/HabitViewOptionsMenu'
import { WarmUpNoticeToast } from './components/WarmUpNoticeToast'
import { WarmUpPanel } from './components/WarmUpPanel'
import { ProcrastinationPanel } from './components/ProcrastinationMode'
import { ListsPage } from './components/ListsPage'
import { ModePage } from './components/ModePage'
import { ModesNav } from './components/ModesNav'
import { ModesPage } from './components/ModesPage'
import { MorePage } from './components/MorePage'
import { ProgressPanel } from './components/ProgressPanel'
import { QuoteCard } from './components/QuoteCard'
import { RewardRulesPage } from './components/RewardRulesPage'
import { RewardsHistoryPage } from './components/RewardsHistoryPage'
import { RewardsNav } from './components/RewardsNav'
import { RewardsPage } from './components/RewardsPage'
import { PrizeListPage } from './components/PrizeListPage'
import { SettingsList } from './components/SettingsList'
import { SideNav } from './components/SideNav'
import { StorageProblemNotice } from './components/StorageProblemNotice'
import { SyncBadge } from './components/SyncBadge'
import { RunningTimerChip } from './components/RunningTimerChip'
import { GoalNoticeToast } from './components/GoalNoticeToast'
import { NudgeToast } from './components/NudgeToast'
import { TagList } from './components/TagList'
import { TaskDragAndDrop } from './components/TaskDragAndDrop'
import { TaskList } from './components/TaskList'
import { TrashIcon } from './components/TrashIcon'
import { TrashList } from './components/TrashList'
import { UndoToast } from './components/UndoToast'
import { ViewOptionsMenu } from './components/ViewOptionsMenu'
import { describeEarningTitle } from './rewardLabels'
import { POINTS_NOT_LOADED, TASKS_NOT_LOADED } from './storageProblem'
import type { TaskActions } from './taskActions'
import { useLetterShortcut } from './useLetterShortcut'
import { ABOVE_PHONE_BAR } from './usePhoneLayout'
import { useBackup } from './useBackup'
import { useDeviceSetting } from './useDeviceSetting'
import { useLists } from './useLists'
import { usePrizes } from './usePrizes'
import { useProcrastination } from './useProcrastination'
import { useWarmUp } from './useWarmUp'
import { useQuote } from './useQuote'
import { useRewards } from './useRewards'
import { useStorageProblem } from './useStorageProblem'
import { useSyncNotice } from './useSyncNotice'
import { useTags } from './useTags'
import { useTasks } from './useTasks'
import { useNudge } from './useNudge'
import { useTaskTimer } from './useTaskTimer'
import { useUndoToast } from './useUndoToast'
import { modeStates } from './modes'
import { useView } from './useView'
import {
  allDoneMessage,
  emptyMessage,
  doneSpans,
  isModesView,
  isRewardsView,
  isTaskView,
  newTaskDueDay,
  newTaskListId,
  newTaskTags,
  oneListView,
  showsTask,
  tagView,
  UNDER_MODES,
  VIEW_LABELS,
  viewLabel,
  viewShowingTask,
} from './view'

/** A way on from the foot of Tasks, where a phone's bar has no tab for it. */
const footLink =
  'flex min-h-11 items-center gap-2 rounded-lg px-3 text-base text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 active:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-100 dark:active:bg-neutral-800/60'

interface TasksScreenProps {
  account: Account
  onSignOut: () => void
  /** The theme on this device, kept above the account's screen since it outlives it (UI-63). */
  theme: Theme
  onThemeChange: (theme: Theme) => void
}

/**
 * Three areas once there is room for them: navigation down the left, the work —
 * adding tasks and the list — in the middle, and a rail holding how the periods
 * are going, with today's quote below. On a phone there is no room, so they stack:
 * the work, then the bars, then the quote at the very bottom, with the
 * navigation moved to a bar along the bottom of the screen.
 *
 * The rail belongs to the views that show tasks, not to the app, so habits, the
 * rewards pages, More, the lists, the tags, the trash and settings do without it. The habits page is a record of progress already,
 * and how much of the week is cleared says nothing about what was thrown away —
 * nobody needs spurring on to empty a bin.
 *
 * Today, Week, Month, Tasks, the Inbox, each list and each tag are one screen
 * showing different tasks: the part due today, this week or this month, all of
 * them, the ones filed nowhere, the ones filed under one list, or the ones
 * carrying a tag. The bars count every live task whichever it is, being about
 * the periods rather than about what is on screen.
 *
 * There is no view heading over the work: the navigation already marks which view
 * you are on, so a title would say it twice and cost a strip of the screen to do
 * it. The app's mark sits at the top of the sidebar on a wide screen; a phone
 * has none. The account lives on Settings, which has a place in the sidebar and
 * a tab in the phone's bar alike.
 *
 * The tasks, the lists they are filed under and the points they earn are the
 * account's — or, as guest, this browser's alone (`createAccountStorage`). The
 * screen is remade for each account (App), so one set of repositories serves it
 * for as long as it is up.
 */
export function TasksScreen({ account, onSignOut, theme, onThemeChange }: TasksScreenProps) {
  const [storage] = useState(() => createAccountStorage(account))

  // Tasks and other records kept as guest — or from before they belonged to an
  // account — join a signed-in account the first time it is open here online.
  useEffect(() => {
    void storage.moveBrowserDataIn()
  }, [storage])
  // A load or a save the service refused, said on screen until dismissed (STORE-13).
  const storageProblem = useStorageProblem()
  // The points come first: what clearing Today is worth is part of what a change
  // to the tasks earns (RWD-24), so the tasks are held knowing it.
  const rewards = useRewards(storage.rewards, storageProblem.report)
  const {
    tasks,
    isLoading,
    loadFailed: tasksNotLoaded,
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
  } = useTasks(storage.tasks, storage.rewards, storageProblem.report, rewards.bonuses, rewards.entries)
  const lists = useLists(storage.lists, storageProblem.report)
  const prizes = usePrizes(storage.prizes, storageProblem.report)
  const savedTags = useTags(storage.tags, isLoading ? null : tasks, storageProblem.report)
  const backup = useBackup(storage.backup)
  const [view, setView] = useView()
  // The detailed add sheet (UI-54): open from the Plus, from `N` on a task page
  // (UI-55), or from `H` for a habit (UI-56) — which opens Habits first if needed.
  // `R` opens Rewards (UI-57). `P` starts or ends Procrastination mode (UI-58).
  const [adding, setAdding] = useState(false)
  useLetterShortcut('n', isTaskView(view) && !adding, () => { setAdding(true) })
  useLetterShortcut('h', !adding, () => {
    if (view !== 'habits') setView('habits')
    setAdding(true)
  })
  useLetterShortcut('r', true, () => {
    setAdding(false)
    if (view !== 'rewards') setView('rewards')
  })
  // How the task views are shown: one set for all of them, kept on this device.
  const [viewOptions, setViewOptions] = useDeviceSetting(deviceStorage.viewOptions)
  // How the habits view is shown, kept on this device too, apart from the task views'.
  const [habitViewOptions, setHabitViewOptions] = useDeviceSetting(deviceStorage.habitViewOptions)
  // Which of the sidebar's groups are folded away, kept on this device too.
  const [sideNav, setSideNav] = useDeviceSetting(deviceStorage.sideNav)
  const undo = useUndoToast()
  const syncNotice = useSyncNotice(storage.sync)

  // One `now` for the whole render, so the order of the list, what each row
  // draws, which period each bar counts and how long the trash has left all
  // agree with one another.
  const now = new Date()
  const live = liveTasks(tasks)
  const trashed = trashedTasks(tasks, now)
  const todayTasks = live.filter((task) => showsTask('today', task, now, lists.lists))
  // Procrastination mode: the account's, so a mode turned on here is on wherever
  // else you are signed in (STORE-45); off tomorrow, and settled against Today's
  // tasks once they have loaded (JUST-7, JUST-10).
  const procrastination = useProcrastination(
    storage.procrastination,
    isLoading ? null : todayTasks,
    now,
    rewards,
    storageProblem.report,
  )
  // The nudge: nothing finished for a while says so and points at Today's leader
  // (NUDGE-1). The same set Procrastination mode works on, and null while it loads.
  const nudge = useNudge(deviceStorage.nudge, isLoading ? null : todayTasks)
  // Warm-up mode: the account's, so every device agrees which day it is on, and
  // measured against every habit there is — null while those are still loading
  // (WARM-1, WARM-4).
  const warmUp = useWarmUp(storage.warmUp, isLoading ? null : tasks, now, storageProblem.report)
  const taskTimer = useTaskTimer(
    deviceStorage.taskTimer,
    (taskId) => {
      const task = live.find((candidate) => candidate.id === taskId)
      if (task === undefined) return null
      return { title: task.title, goal: task.timeGoal, spentSeconds: secondsSpent(task, now) }
    },
    logTaskSeconds,
  )
  const runningTimerTaskId = taskTimer.state.status === 'running' ? taskTimer.state.taskId : null
  const runningTimerTask =
    runningTimerTaskId === null
      ? null
      : live.find((task) => task.id === runningTimerTaskId) ?? null
  // The task the nudge is pointing at, as it stands now: gone from the list,
  // there is nothing left to open.
  const nudgeNotice = nudge.notice
  const nudgeTask =
    nudgeNotice === null ? null : live.find((task) => task.id === nudgeNotice.taskId) ?? null
  const { stop: stopTaskTimer } = taskTimer
  // A timer whose task was deleted cannot be shown; stop it so it does not linger.
  useEffect(() => {
    if (isLoading) return
    if (runningTimerTaskId !== null && runningTimerTask === null) {
      stopTaskTimer()
    }
  }, [isLoading, runningTimerTaskId, runningTimerTask, stopTaskTimer])
  // The task being gone to from the timer's chip (TIME-20), until its row or card has
  // brought itself into view and opened — then let go of, so no row opening later,
  // on another view, takes it for a new request.
  const [revealId, setRevealId] = useState<TaskId | null>(null)
  const revealed = () => { setRevealId(null) }

  /** Going to a task: the view open if it shows the task, or one that does. */
  function revealTask(task: Task) {
    setView(viewShowingTask(task, view, now, lists.lists))
    setRevealId(task.id)
  }
  // Every tag there is: the kept ones, whether or not a task carries them, and
  // any a live task carries that is not kept yet.
  const tags = allTags(savedTags.tags, live)

  // Overdue float to the top — the run the list heads with Overdue — urgent to
  // the top of their run, and done sink to the bottom; sort is stable, so each
  // band keeps the order it was given. A repeating task is only done for its
  // current occurrence. A view dividing its done tasks by when they were
  // finished puts the most recent first, the order its headings come in.
  const shown = isTaskView(view) ? live.filter((task) => showsTask(view, task, now, lists.lists)) : live
  const spans = isTaskView(view) ? doneSpans(view) : null
  const ordered = spans !== null
    ? groupByCompletion(sortForDisplay(shown, now), spans, now).flatMap((group) => group.tasks)
    : sortForDisplay(shown, now)

  // Habits are the tasks themselves, in the order of the task list (HAB-2).
  const habits = habitTasks(tasks)
  // What a drag can pick up on the page open, in the order it is drawn: the habit
  // cards on Habits, the rows anywhere else. Which side of a target a dropped one
  // lands on is read from this order (`dropOutcome`), and it is the place a screen
  // reader hears as one is carried, so it has to be the order on screen.
  const draggable = view === 'habits' ? habits : ordered

  // Focus dims every other row; a win keeps the finished task highlighted until Rest / next.
  const focusId = view === 'today' ? procrastination.taskId : null
  // A finished focused task would sink with done work; keep it above the dimmed rows.
  const listed = pinFocusedFirst(ordered, focusId)
  const dimChrome = procrastination.phase !== 'off'

  // The modes, as the Modes pages read them: on or off, where each stands, and
  // the one way to turn it either way (MODE-2). Starting Procrastination opens
  // Today, there being nothing to focus on anywhere else (JUST-1).
  const modes = modeStates({
    procrastination: {
      phase: procrastination.phase,
      available: procrastination.available,
      loading: procrastination.isLoading,
      onStart: () => {
        procrastination.start()
        setView('today')
      },
      onEnd: procrastination.end,
    },
    warmUp: {
      progress: warmUp.progress,
      loading: warmUp.isLoading,
      onStart: warmUp.start,
      onEnd: warmUp.end,
    },
  })
  const modesOn = UNDER_MODES.filter((mode) => modes[mode].on).length

  // Same as the Procrastination switch on Modes (JUST-1, JUST-8): start when off, end when on.
  useLetterShortcut('p', view === 'today' && procrastination.available && !adding, () => {
    if (procrastination.phase === 'off') procrastination.start()
    else procrastination.end()
  })

  function handleComplete(id: TaskId) {
    const task = tasks.find((candidate) => candidate.id === id)
    const wasDone = task !== undefined && isComplete(task, now)
    complete(id)
    if (task !== undefined && !wasDone) {
      undo.show({ kind: 'completion', taskId: id })
    }
  }

  /**
   * Ticking a checklist item can finish the task (CHK-9). When it does, offer
   * the same completion undo as the box — without naming the task.
   */
  function handleSetChecklistItemDone(id: TaskId, subtaskId: SubtaskId, done: boolean) {
    const task = tasks.find((candidate) => candidate.id === id)
    const wasDone = task !== undefined && isComplete(task, now)
    setChecklistItemDone(id, subtaskId, done)
    if (task !== undefined && !wasDone && done && isComplete(setSubtaskDone(task, subtaskId, true, now), now)) {
      undo.show({ kind: 'completion', taskId: id })
    }
  }

  // The same `now` once more: which quote is today's is derived from the day it
  // falls in, so the quote and the bars can't disagree about which day it is.
  const quote = useQuote(quotableQuoteSource, deviceStorage.quote, now)
  /** What each ledger row is named after, the trash included: a purged task has no title left. */
  const taskTitles = new Map(tasks.map((task) => [task.id, task.title]))

  function handleRemove(id: TaskId) {
    const deleted = remove(id)
    if (deleted !== null) {
      undo.show({ kind: 'task', task: deleted })
    }
  }

  /**
   * A day picked for a repeating task ends its rule (DUE-12), which is easy to
   * do by accident from a row or a menu and lets go of more than the rule — the
   * ticks and sessions of occurrences gone by go with it. So it offers to put
   * the task back exactly as it was, for the few seconds the toast is up (DUE-17).
   */
  function handleChangeDueDate(id: TaskId, dueDate: LocalDay | null) {
    const was = changeDueDate(id, dueDate)
    if (was !== null) {
      undo.show({ kind: 'repeatEnded', task: was })
    }
  }

  function handleRemoveEarning(key: RewardKey) {
    const deleted = rewards.removeEarning(key)
    if (deleted === null) return
    undo.show({ kind: 'earning', entry: deleted, title: describeEarningTitle(deleted.taskId, taskTitles) })
  }

  function handleRemoveRedemption(id: RedemptionId) {
    const deleted = rewards.removeRedemption(id)
    if (deleted !== null) {
      undo.show({ kind: 'redemption', redemption: deleted })
    }
  }

  /**
   * Spends points on something that is on neither list (RWD-15). The toast is
   * the confirmation as well as the way back: nothing else on the page changes
   * but the balance.
   */
  function handleRedeem(points: number, note: string) {
    const spent = rewards.redeem(points, note)
    if (spent !== null) {
      undo.show({ kind: 'redeem', redemption: spent, wishId: null })
    }
  }

  /**
   * Spends a prize's or a wish's price on it (RWD-36): a prize is left to come
   * round again, a wish is marked bought and leaves what the points can buy
   * (RWD-40). Undoing gives the points back and puts a bought wish back with them.
   */
  function handleRedeemPrize(prize: Prize) {
    const spent = rewards.redeem(prize.points, prize.name)
    if (spent === null) return

    if (prize.kind === 'wish') prizes.buy(prize.id)
    undo.show({ kind: 'redeem', redemption: spent, wishId: prize.kind === 'wish' ? prize.id : null })
  }

  function handleUndo() {
    if (undo.pending === null) return
    switch (undo.pending.kind) {
      case 'task':
        restore(undo.pending.task.id)
        break
      case 'earning':
        rewards.saveEarning(undo.pending.entry)
        break
      case 'redemption':
        rewards.restoreRedemption(undo.pending.redemption)
        break
      case 'redeem':
        rewards.removeRedemption(undo.pending.redemption.id)
        if (undo.pending.wishId !== null) prizes.restore(undo.pending.wishId)
        break
      case 'completion':
        uncomplete(undo.pending.taskId)
        break
      case 'repeatEnded':
        putBack(undo.pending.task)
        break
    }
    undo.dismiss()
  }

  /**
   * Deleting a list is two changes: its tasks back to the Inbox, then the list
   * itself. The tasks go first, so a list is never left holding tasks nothing can
   * reach — and if the second write is lost, a task naming a list that is gone
   * reads as being in the Inbox anyway (`listOf`).
   */
  function handleDeleteList(id: ListId) {
    clearListEverywhere(id)
    lists.remove(id)
    // Leaving the view of a list that has gone: it would show as the Inbox otherwise.
    if (view === oneListView(id)) setView('lists')
  }

  /**
   * Deleting a tag is two changes, as deleting a list is: off every task, then
   * no longer kept. The tasks go first, so a tag no record keeps is never left on
   * a task to be kept all over again.
   */
  function handleDeleteTag(name: string) {
    removeTagEverywhere(name)
    savedTags.remove(name)
  }

  /** Makes a tag no task carries yet, unless there is one of that name already. */
  function handleAddTag(name: string): boolean {
    return !tags.some((tag) => sameTag(tag, name)) && savedTags.add(name) !== null
  }

  /**
   * What a row, a habit card or a task's sheet can do to its task: the rules
   * from useTasks, with completing, deleting and ending a repeat offering their
   * undo, and tags spelled the way they already are.
   */
  const taskActions: TaskActions = {
    complete: handleComplete,
    uncomplete,
    rename,
    changeDescription,
    changeDueDate: handleChangeDueDate,
    skip,
    // A rule that would make one habit more is held to the warm-up's allowance,
    // the same as adding one; turning a habit's own rule over is no new habit.
    changeRepeat: (id, repeat) => {
      const task = tasks.find((candidate) => candidate.id === id)
      if (warmUp.holdsBack(repeat, task?.repeat ?? null)) return
      changeRepeat(id, repeat)
    },
    changeReward,
    changeUrgent,
    changeTimeGoal,
    logTime: logTaskTime,
    removeTimeEntry: removeTaskTime,
    changeList,
    addTag: (id, name) => { tag(id, name, tags) },
    removeTag: untag,
    remove: handleRemove,
    // A copy of a habit is another habit (WARM-4).
    duplicate: (id) => {
      const task = tasks.find((candidate) => candidate.id === id)
      if (warmUp.holdsBack(task?.repeat ?? null)) return
      duplicate(id)
    },
    addSubtask: addChecklistItem,
    setSubtaskDone: handleSetChecklistItemDone,
    renameSubtask: renameChecklistItem,
    removeSubtask: removeChecklistItem,
  }

  /**
   * Adds a task, unless a warm-up holds the habit it would be back (WARM-4).
   * Every way of adding goes through here, so the one-line box, the detailed
   * sheet and Habits' own box are all held to the same allowance. Says whether
   * the task was added, so a sheet knows whether to close.
   */
  function handleAddTask(
    title: string,
    repeat: Repeat | null,
    dueDate: LocalDay | null,
    taskTags: readonly string[],
    listId: ListId | null,
    details?: Parameters<typeof addTask>[5],
  ): boolean {
    if (warmUp.holdsBack(repeat)) return false

    addTask(title, repeat, dueDate, taskTags, listId, details)
    return true
  }

  /** Makes a list and opens it, so the next thing typed goes into it. */
  function handleAddList(name: string): boolean {
    const made = lists.add(name)
    if (made === null) return false

    setView(oneListView(made.id))
    return true
  }

  // The pages with the add box also have the Plus floating in the corner (UI-54).
  const hasPlus = isTaskView(view) || view === 'habits'

  return (
    // On a phone the page keeps clear of the notch and the rounded corners (UI-61), and its
    // end scrolls clear of the bar — and of the Plus, where there is one — so nothing is left
    // under them (UI-4).
    <main
      className={`mx-auto flex min-h-dvh w-full max-w-6xl flex-col pt-[max(1.5rem,calc(env(safe-area-inset-top)+0.75rem))] pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))] md:px-4 md:pt-6 md:pb-8 ${
        hasPlus ? 'pb-[calc(10rem+env(safe-area-inset-bottom))]' : 'pb-[calc(6rem+env(safe-area-inset-bottom))]'
      }`}
    >
      {/* Which view this is, for a screen reader only: on screen the navigation marks it. */}
      <h1 className="sr-only">{viewLabel(view, lists.lists)}</h1>

      {/* Around the navigation as well as the rows: a task can be dropped on a list in the sidebar to file it. */}
      <TaskDragAndDrop tasks={draggable} onMove={move} onFile={changeList}>
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-6">
          <SideNav
            view={view}
            lists={lists.lists}
            listsOpen={sideNav.listsOpen}
            rewardsOpen={sideNav.rewardsOpen}
            dimmed={dimChrome}
            onChange={setView}
            onListsOpenChange={(listsOpen) => { setSideNav({ ...sideNav, listsOpen }) }}
            onRewardsOpenChange={(rewardsOpen) => { setSideNav({ ...sideNav, rewardsOpen }) }}
          />

          <div className="flex min-w-0 flex-1 flex-col gap-5">
            {view === 'settings' ? (
              <section aria-label="Settings">
                <SettingsList
                  account={account}
                  onSignOut={onSignOut}
                  backup={backup.status}
                  onExport={() => { void backup.exportAll() }}
                  onImport={(file) => { void backup.importFile(file) }}
                  theme={theme}
                  onThemeChange={onThemeChange}
                  nudge={nudge}
                />
              </section>
            ) : view === 'more' ? (
              <section aria-label="More">
                <MorePage onOpen={setView} modesOn={modesOn} />
              </section>
            ) : view === 'modes' ? (
              <section aria-label="Modes">
                <ModesPage modes={modes} onOpen={setView} />
              </section>
            ) : isModesView(view) ? (
              <section aria-label={viewLabel(view)} className="flex flex-col gap-5">
                {/* Neither the sidebar nor the bar lists the modes, so the way back is here (MODE-7). */}
                <ModesNav view={view} onChange={setView} />
                <ModePage mode={modes[view]} />
              </section>
            ) : isRewardsView(view) ? (
              <section aria-label={viewLabel(view)} className="flex flex-col gap-5">
                {/* A phone has no sidebar to list the pages under Rewards, so they are here (RWD-30). */}
                <RewardsNav view={view} onChange={setView} />
                {rewards.isLoading ? (
                  <p className="py-10 text-center text-neutral-400 dark:text-neutral-600">Loading…</p>
                ) : rewards.loadFailed ? (
                  // Zeros here would read as points lost, rather than as points unread (RWD-22).
                  <p className="py-10 text-center text-neutral-500 dark:text-neutral-400">{POINTS_NOT_LOADED}</p>
                ) : view === 'rewards/history' ? (
                  <RewardsHistoryPage
                    entries={rewards.entries}
                    redemptions={rewards.redemptions}
                    taskTitles={taskTitles}
                    now={now}
                    onRemoveEarning={handleRemoveEarning}
                    onRemoveRedemption={handleRemoveRedemption}
                  />
                ) : view === 'rewards/prizes' || view === 'rewards/wishlist' ? (
                  <PrizeListPage
                    // Keyed by the list, so the add box starts empty on each.
                    key={view}
                    kind={view === 'rewards/wishlist' ? 'wish' : 'prize'}
                    prizes={prizesOfKind(prizes.prizes, view === 'rewards/wishlist' ? 'wish' : 'prize')}
                    balance={rewards.balance}
                    pointValue={rewards.pointValue}
                    now={now}
                    onAdd={prizes.add}
                    onRename={prizes.rename}
                    onReprice={prizes.reprice}
                    onDelete={prizes.remove}
                    onRedeem={handleRedeemPrize}
                    onRedeemOther={view === 'rewards/prizes' ? handleRedeem : undefined}
                  />
                ) : view === 'rewards/rules' ? (
                  <RewardRulesPage
                    bonuses={rewards.bonuses}
                    pointValue={rewards.pointValue}
                    onChangeBonus={rewards.setBonus}
                    onChangePointValue={rewards.setPointValue}
                  />
                ) : (
                  <RewardsPage
                    entries={rewards.entries}
                    redemptions={rewards.redemptions}
                    prizes={prizes.prizes}
                    bonuses={rewards.bonuses}
                    pointValue={rewards.pointValue}
                    now={now}
                    onOpenPrizes={() => { setView('rewards/prizes') }}
                    onOpenWishlist={() => { setView('rewards/wishlist') }}
                    onOpenRules={() => { setView('rewards/rules') }}
                  />
                )}
              </section>
            ) : isLoading ? (
              <p className="py-10 text-center text-neutral-400 dark:text-neutral-600">Loading…</p>
            ) : isTaskView(view) ? (
              <>
                {/* The View button beside the box rather than in it: the box's own controls are
                    for the task being added, the button is for how the tasks below are shown. */}
                <div className="flex gap-2">
                  <div className="min-w-0 flex-1">
                    {/* Keyed by the view, so switching views starts the box on that view's day. */}
                    <AddTaskForm
                      key={view}
                      now={now}
                      defaultDueDate={newTaskDueDay(view, now)}
                      onOpenSheet={() => { setAdding(true) }}
                      onAdd={(title, repeat, dueDate) => {
                        handleAddTask(title, repeat, dueDate, newTaskTags(view), newTaskListId(view))
                      }}
                    />
                  </div>

                  <ViewOptionsMenu options={viewOptions} onChange={setViewOptions} />
                </div>

                {view === 'today' && procrastination.phase !== 'off' && (
                  <ProcrastinationPanel
                    phase={procrastination.phase}
                    wonTask={procrastination.wonTask}
                    canPick={procrastination.canPick}
                    hasOtherTask={procrastination.hasOtherTask}
                    pointsEarned={procrastination.pointsEarned}
                    onOtherTask={procrastination.pickNext}
                    onCreateTask={() => { setAdding(true) }}
                    onMoreInfo={() => { setView('modes/procrastination') }}
                    onEnd={procrastination.end}
                    onRest={procrastination.rest}
                    onGetOneMore={procrastination.pickNext}
                    onGrantPoints={procrastination.grantPoints}
                  />
                )}

                <section aria-label={viewLabel(view, lists.lists)}>
                  <TaskList
                    tasks={listed}
                    now={now}
                    knownTags={tags}
                    lists={lists.lists}
                    showDetails={viewOptions.showDetails}
                    focusId={focusId}
                    dimAll={procrastination.phase === 'idle'}
                    doneSpans={spans}
                    emptyMessage={tasksNotLoaded ? TASKS_NOT_LOADED : emptyMessage(view, lists.lists)}
                    allDoneMessage={allDoneMessage(view, lists.lists)}
                    actions={taskActions}
                    timer={taskTimer}
                    revealId={revealId}
                    onRevealed={revealed}
                  />
                </section>

                {/* A phone's bar has no room for the lists or the trash, so they are kept at
                    the foot of every task. The tags are on its More page. */}
                {view === 'tasks' && (
                  <nav aria-label="Under Tasks" className="flex flex-wrap gap-1 md:hidden">
                    <button type="button" onClick={() => { setView('lists') }} className={footLink}>
                      <FolderIcon />
                      {VIEW_LABELS.lists}
                    </button>
                    <button type="button" onClick={() => { setView('trash') }} className={footLink}>
                      <TrashIcon />
                      {VIEW_LABELS.trash}
                    </button>
                  </nav>
                )}
              </>
            ) : view === 'lists' ? (
              <section aria-label="Lists">
                {lists.isLoading ? (
                  <p className="py-10 text-center text-neutral-400 dark:text-neutral-600">Loading…</p>
                ) : (
                  <ListsPage
                    lists={summarizeLists(lists.lists, live, now)}
                    inboxOpen={countInboxOpen(live, lists.lists, now)}
                    onOpenInbox={() => { setView('inbox') }}
                    onOpen={(id) => { setView(oneListView(id)) }}
                    onAdd={handleAddList}
                    onRename={lists.rename}
                    onDelete={handleDeleteList}
                  />
                )}
              </section>
            ) : view === 'tags' ? (
              <section aria-label="Tags">
                {savedTags.isLoading ? (
                  <p className="py-10 text-center text-neutral-400 dark:text-neutral-600">Loading…</p>
                ) : (
                  <TagList
                    tags={summarizeTags(tags, live, now)}
                    onOpen={(name) => { setView(tagView(name)) }}
                    onAdd={handleAddTag}
                    onDelete={handleDeleteTag}
                  />
                )}
              </section>
            ) : view === 'habits' ? (
              <>
                {/* Where the warm-up is felt, so where it says where it stands (WARM-6). */}
                <WarmUpPanel
                  progress={warmUp.progress}
                  onMoreInfo={() => { setView('modes/warm-up') }}
                  onEnd={warmUp.end}
                />

                {/* The View button beside the box, as on the task views: the box is for a
                    new habit, the button is for how the cards below are shown. */}
                <div className="flex gap-2">
                  <div className="min-w-0 flex-1">
                    <AddTaskForm
                      now={now}
                      defaultDueDate={null}
                      defaultRepeat={{ kind: 'daily' }}
                      label="Add habit"
                      onOpenSheet={() => { setAdding(true) }}
                      onAdd={(title, repeat, dueDate) => {
                        handleAddTask(title, repeat ?? { kind: 'daily' }, dueDate, [], null)
                      }}
                    />
                  </div>

                  <HabitViewOptionsMenu options={habitViewOptions} onChange={setHabitViewOptions} />
                </div>

                <section aria-label="Habits">
                  <HabitList
                    habits={habits}
                    now={now}
                    showDetails={habitViewOptions.showDetails}
                    knownTags={tags}
                    lists={lists.lists}
                    actions={taskActions}
                    onSetDay={setHabitDay}
                    timer={taskTimer}
                    revealId={revealId}
                    onRevealed={revealed}
                  />
                </section>
              </>
            ) : (
              <section aria-label="Trash">
                <TrashList
                  tasks={trashed}
                  onRestore={restore}
                  onPurge={purge}
                  onEmpty={emptyTrash}
                />
              </section>
            )}
          </div>

          {/* The bars above the quote everywhere: on a phone the rail follows the work and the quote ends the page. */}
          {isTaskView(view) && (
            <div className="flex flex-col gap-5 md:w-64 md:shrink-0">
              <aside aria-label="Progress">
                {!isLoading && <ProgressPanel tasks={live} now={now} dimmed={dimChrome} />}
              </aside>

              <QuoteCard quote={quote} />
            </div>
          )}
        </div>
      </TaskDragAndDrop>

      <BottomNav view={view} lists={lists.lists} dimmed={dimChrome} onChange={setView} />

      {adding && (isTaskView(view) || view === 'habits') && (
        <AddTaskSheet
          key={view}
          now={now}
          label={view === 'habits' ? 'Add habit' : 'Add task'}
          defaultDueDate={isTaskView(view) ? newTaskDueDay(view, now) : null}
          defaultRepeat={view === 'habits' ? { kind: 'daily' } : undefined}
          defaultTags={isTaskView(view) ? newTaskTags(view) : []}
          defaultListId={isTaskView(view) ? newTaskListId(view) : null}
          knownTags={tags}
          lists={lists.lists}
          onClose={() => { setAdding(false) }}
          onAdd={(title, repeat, dueDate, taskTags, listId, details) => {
            // Held back by the warm-up, the sheet stays open with everything
            // typed still in it, so the rule can be changed instead (WARM-8).
            if (handleAddTask(title, repeat, dueDate, taskTags, listId, details)) setAdding(false)
          }}
        />
      )}

      {/* A habit held back is said at the top of the window, above the add sheet
          (z-40) rather than under it: the sheet is left open with everything
          typed still in it, so the notice has to be readable over it (WARM-8). */}
      {warmUp.notice !== null && (
        <div className="pointer-events-none fixed inset-x-0 top-[max(1rem,env(safe-area-inset-top))] z-50 flex justify-center px-4">
          <WarmUpNoticeToast progress={warmUp.notice} onDismiss={warmUp.dismissNotice} />
        </div>
      )}

      {/* What the screen has to say, stacked: above a phone's navigation bar — beside the Plus
          rather than under it — and at the foot of the window where there is no bar. */}
      <div
        className={`pointer-events-none fixed inset-x-0 ${ABOVE_PHONE_BAR} z-30 flex flex-col items-center gap-2 px-4 md:bottom-4 ${
          hasPlus ? 'pr-20 md:pr-4' : ''
        }`}
      >
        {storageProblem.problem !== null && (
          <StorageProblemNotice problem={storageProblem.problem} onDismiss={storageProblem.dismiss} />
        )}
        {syncNotice !== null && <SyncBadge notice={syncNotice} />}
        {runningTimerTask !== null && taskTimer.state.status === 'running' && (
          <RunningTimerChip
            title={runningTimerTask.title}
            startedAt={taskTimer.state.startedAt}
            clock={taskTimer.clock}
            onOpen={() => { revealTask(runningTimerTask) }}
            onStop={taskTimer.stop}
          />
        )}
        {taskTimer.goalNotice !== null && (
          <GoalNoticeToast
            title={taskTimer.goalNotice.title}
            onDismiss={taskTimer.dismissGoalNotice}
          />
        )}
        {nudgeTask !== null && nudgeNotice !== null && (
          <NudgeToast
            title={nudgeNotice.title}
            quietHours={nudgeNotice.quietHours}
            onOpen={() => { revealTask(nudgeTask); nudge.dismiss() }}
            onDismiss={nudge.dismiss}
          />
        )}
        {undo.pending !== null && (
          <UndoToast pending={undo.pending} onUndo={handleUndo} onDismiss={undo.dismiss} />
        )}
      </div>
    </main>
  )
}
