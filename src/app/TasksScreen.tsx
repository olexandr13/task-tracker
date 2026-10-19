import { useEffect, useState } from 'react'
import {
  allTags,
  canSkipOccurrence,
  countInboxOpen,
  featuresOn,
  findGoal,
  goalProgress,
  isModeAvailable,
  prizesOfKind,
  groupByCompletion,
  habitTasks,
  isComplete,
  liveTasks,
  pinFocusedFirst,
  sameTag,
  secondsSpent,
  skipPenalty,
  sortForDisplay,
  summarizeGoals,
  summarizeLists,
  summarizeTags,
  trashedTasks,
  type ActivityEntry,
  type JournalEntry,
  type Note,
  type CategoryId,
  type GoalId,
  type HourSlot,
  type ListId,
  type LocalDay,
  type LocalTime,
  type Prize,
  type RedemptionId,
  type Repeat,
  type RewardKey,
  type Task,
  type TaskId,
} from '../core'
import { createAccountStorage } from '../storage/accountStorage'
import type { Account } from '../storage/authService'
import { deviceStorage } from '../storage/deviceStorage'
import { quotableQuoteSource } from '../storage/quotableQuoteSource'
import type { Theme } from '../storage/themeRepository'
import { ActivityPage } from './components/ActivityPage'
import { AddTaskForm } from './components/AddTaskForm'
import { AddTaskSheet } from './components/AddTaskSheet'
import { BalancePage } from './components/BalancePage'
import { BottomNav } from './components/BottomNav'
import { CheckInSettings } from './components/CheckInSettings'
import { CheckInToast } from './components/CheckInToast'
import { FolderIcon } from './components/FolderIcon'
import { HabitList } from './components/HabitList'
import { JournalPage } from './components/JournalPage'
import { LevelPage } from './components/LevelPage'
import { LevelToast } from './components/LevelToast'
import { NotesPage } from './components/NotesPage'
import { WarmUpNoticeToast } from './components/WarmUpNoticeToast'
import { CaseNoticeToast } from './components/CaseNoticeToast'
import { CasesPage } from './components/CasesPage'
import { WarmUpPanel } from './components/WarmUpPanel'
import { WarmUpPause } from './components/WarmUpPause'
import { ProcrastinationPanel } from './components/ProcrastinationMode'
import { GoalHeader } from './components/GoalHeader'
import { GoalsPage } from './components/GoalsPage'
import { ListsPage } from './components/ListsPage'
import { ModePage } from './components/ModePage'
import { ModesPage } from './components/ModesPage'
import { MorePage } from './components/MorePage'
import { NotificationsPage } from './components/NotificationsPage'
import { OrganizePage } from './components/OrganizePage'
import { ReflectPage } from './components/ReflectPage'
import { PinnedTabs } from './components/PinnedTabs'
import { ProgressPanel } from './components/ProgressPanel'
import { QuoteCard } from './components/QuoteCard'
import { RewardRulesPage } from './components/RewardRulesPage'
import { useCases } from './useCases'
import { RewardsHistoryPage } from './components/RewardsHistoryPage'
import { RewardsPage } from './components/RewardsPage'
import { PrizeListPage } from './components/PrizeListPage'
import { SectionNav } from './components/SectionNav'
import { SettingsList } from './components/SettingsList'
import { SideNav } from './components/SideNav'
import { StorageProblemNotice } from './components/StorageProblemNotice'
import { SyncBadge } from './components/SyncBadge'
import { RunningTimerChip } from './components/RunningTimerChip'
import { GoalNoticeToast } from './components/GoalNoticeToast'
import { NudgeSettings } from './components/NudgeSettings'
import { NudgeToast } from './components/NudgeToast'
import { ReminderToast } from './components/ReminderToast'
import { TagList } from './components/TagList'
import { TaskDragAndDrop } from './components/TaskDragAndDrop'
import { TaskList, type ListHistory } from './components/TaskList'
import { TrashIcon } from './components/TrashIcon'
import { TrashList } from './components/TrashList'
import { UndoToast } from './components/UndoToast'
import { UpLink } from './components/UpLink'
import { ViewOptionsMenu } from './components/ViewOptionsMenu'
import { footLink } from './footControls'
import { CASE_DAILY_NOTICE, CASE_SHARE_NOTICE } from './caseLabels'
import { DEV_FLAGS } from './devFlags'
import { describeEarningTitle } from './rewardLabels'
import { POINTS_NOT_LOADED, TASKS_NOT_LOADED } from './storageProblem'
import { changePinned, moveTab, pinnedViews, pinTab, unpinTab } from './pinnedTabs'
import type { SkipOutcome, TaskActions } from './taskActions'
import { useLetterShortcut } from './useLetterShortcut'
import { ABOVE_PHONE_BAR, usePhoneLayout } from './usePhoneLayout'
import { useActivities } from './useActivities'
import { useBackup } from './useBackup'
import { useCheckIn } from './useCheckIn'
import { useCategories } from './useCategories'
import { FeaturesContext, modesShown, nearestViewOn } from './features'
import { GoalsContext } from './goals'
import { HabitRestsContext } from './habitRests'
import { useFeatures } from './useFeatures'
import { useHabitRests } from './useHabitRests'
import { useJournal } from './useJournal'
import { useLevelChange } from './useLevelChange'
import { useNotes } from './useNotes'
import { useDeviceSetting } from './useDeviceSetting'
import { useGoalHistory } from './useGoalHistory'
import { useGoals } from './useGoals'
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
import { useReminders } from './useReminders'
import { useTaskTimer } from './useTaskTimer'
import { useUndoToast } from './useUndoToast'
import { useLevel, useXp } from './useXp'
import { askToNotify } from './browserNotification'
import { standingNotices, type StandingNotice } from './standingNotices'
import { useNotifyPermission } from './useNotifyPermission'
import { modeStates } from './modes'
import { useView } from './useView'
import { useUnheldHistory } from './useUnheldHistory'
import {
  allDoneMessage,
  emptyMessage,
  doneSpans,
  foldedSpans,
  goalView,
  historyScope,
  isGoalView,
  isModesView,
  isPeriodView,
  isRewardsView,
  isTaskView,
  newTaskDueDay,
  newTaskGoalId,
  newTaskListId,
  newTaskTags,
  oneListView,
  sectionOf,
  showsTask,
  tagView,
  upLinkOf,
  VIEW_LABELS,
  viewGoalId,
  viewLabel,
  viewShowingTask,
  type Reveal,
  type RevealPart,
  type View,
} from './view'

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
  // XP, ahead of everything that gives it: a change to the tasks, the time or
  // the journal says what it gave and took (LVL-1), Levels switched off or not.
  const xp = useXp(storage.xp, storageProblem.report)
  // The activity log, hour by hour (ACT-1), ahead of the tasks: time logged on
  // a task is written into it as well (ACT-21), switched off or not (FEAT-5).
  const activities = useActivities(storage.activities, storageProblem.report, xp.record)
  // Today's good things, achievements and gratitude, and the week before (JRN-1).
  const journal = useJournal(storage.journal, storageProblem.report, xp.record)
  // Anything written down to keep (NOTE-1).
  const notes = useNotes(storage.notes, storageProblem.report)
  const {
    tasks,
    heldSince,
    reachBack,
    unheld,
    everywhere,
    isLoading,
    loadFailed: tasksNotLoaded,
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
    changeTaskTime,
    tag,
    untag,
    removeTagEverywhere,
    renameTagEverywhere,
    changeList,
    clearListEverywhere,
    changeGoal,
    clearGoalEverywhere,
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
  } = useTasks(
    storage.tasks,
    storage.rewards,
    storageProblem.report,
    rewards.bonuses,
    rewards.entries,
    activities.addSessions,
    activities.resizeSessions,
    xp.recordTasks,
  )
  const lists = useLists(storage.lists, storageProblem.report)
  // What tasks are done for, each with how far it has got (GOAL-1).
  const goals = useGoals(storage.goals, storageProblem.report)
  const prizes = usePrizes(storage.prizes, storageProblem.report)
  const savedTags = useTags(storage.tags, isLoading ? null : tasks, storageProblem.report)
  // The Balance page's categories, each bound to tags (BAL-1).
  const categories = useCategories(storage.categories, storageProblem.report, xp.record)
  const backup = useBackup(storage.backup)
  // Which parts of the app are in use, switched on Settings (FEAT-1): the
  // account's, so a feature turned off at the laptop is off at the phone.
  const features = useFeatures(storage.features, storageProblem.report)
  const featuresOff = features.off
  const on = featuresOn(featuresOff)
  // The limit on habits' rests (HAB-36), the account's. It goes with Habits, as
  // the warm-up does (FEAT-9): switched off, nothing says what a rest is, so
  // nothing is held back for want of one.
  const habitRests = useHabitRests(storage.habitSettings, storageProblem.report)
  const restLimit = on.habits ? habitRests.rests : null
  // Where XP stands, once the tasks, the points and the limit on rests are in
  // (LVL-3), and the toast when it moves while the app is open (LVL-11).
  const level = useLevel(
    xp,
    isLoading || tasksNotLoaded ? null : tasks,
    rewards.isLoading || rewards.loadFailed ? null : rewards.entries,
    habitRests.isLoading ? undefined : restLimit,
  )
  const levelChange = useLevelChange(on.levels && level !== null ? level.level.level : null)
  // The view the address names, and the one shown: a page switched off is not
  // there to show, so its address lands on the nearest page above it that is
  // (FEAT-2), and the address is put right to match below.
  const [addressed, setView] = useView()
  const view = nearestViewOn(addressed, featuresOff)
  useEffect(() => {
    if (view !== addressed) setView(view)
  }, [view, addressed, setView])
  // The hour the activity log opens on — the one a check-in asked about — and a
  // count that starts the page afresh each time it is gone to that way (CHECKIN-4).
  const [activityOpen, setActivityOpen] = useState<{ slot: HourSlot | null; times: number }>({ slot: null, times: 0 })
  // Left, the log is opened on today again the next time it is gone to some other way.
  if (view !== 'activity' && activityOpen.slot !== null) {
    setActivityOpen({ ...activityOpen, slot: null })
  }
  /** Goes to the activity log, on the hour asked about. */
  function openActivityLog(slot: HourSlot) {
    setActivityOpen((open) => ({ slot, times: open.times + 1 }))
    setView('activity')
  }
  // The detailed add sheet (UI-54): open from the Plus, from `N` on a task page
  // (UI-55), or from `H` for a habit (UI-56) — which opens Habits first if needed.
  // `R` opens Rewards (UI-57) and `C` Cases under it (UI-72). `P` starts or
  // ends Procrastination mode (UI-58).
  const [adding, setAdding] = useState(false)
  useLetterShortcut('n', isTaskView(view) && !adding, () => { setAdding(true) })
  // A letter for a page switched off on Settings does nothing (FEAT-2).
  useLetterShortcut('h', on.habits && !adding, () => {
    if (view !== 'habits') setView('habits')
    setAdding(true)
  })
  useLetterShortcut('r', on.rewards, () => {
    setAdding(false)
    if (view !== 'rewards') setView('rewards')
  })
  useLetterShortcut('c', on.cases, () => {
    setAdding(false)
    if (view !== 'rewards/cases') setView('rewards/cases')
  })
  // How the task views are shown: one set for all of them, kept on this device.
  const [viewOptions, setViewOptions] = useDeviceSetting(deviceStorage.viewOptions)
  // How the habits view is shown, set on Settings (HAB-23) and kept on this
  // device too, apart from the task views'.
  const [habitViewOptions, setHabitViewOptions] = useDeviceSetting(deviceStorage.habitViewOptions)
  // Which of the sidebar's groups are folded away, kept on this device too.
  const [sideNav, setSideNav] = useDeviceSetting(deviceStorage.sideNav)
  // The pages pinned as tabs across the top of a wide screen (UI-75), kept on
  // this device as their addresses (STORE-59). Each change is made to the
  // latest tabs (STORE-39), those another window pinned among them (STORE-61).
  const [pinnedTabs, setPinnedTabs] = useDeviceSetting(deviceStorage.pinnedTabs)
  const pinned = pinnedViews(pinnedTabs.pinned)
  function changeTabs(change: (latest: View[]) => View[]) {
    setPinnedTabs((latest) => ({ pinned: changePinned(latest.pinned, change) }))
  }
  const [settingsLayout, setSettingsLayout] = useDeviceSetting(deviceStorage.settingsLayout)
  // A phone has no add box and no task View settings (UI-54, UI-41): both are a
  // wide screen's, where a row of details has room under every task.
  const phone = usePhoneLayout()
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
  // (NUDGE-1). The same set Procrastination mode works on, and null while it
  // loads. Its setting is the account's (STORE-46); what it has already said
  // here is the device's (NUDGE-6).
  // A mode whose feature is switched off on Settings does nothing, whatever its
  // own switch says, and carries on when the feature is back (FEAT-9).
  const procrastinationOn = isModeAvailable(featuresOff, 'procrastination')
  const warmUpOn = isModeAvailable(featuresOff, 'warmUp')
  const nudgeOn = isModeAvailable(featuresOff, 'nudge')
  const checkInOn = isModeAvailable(featuresOff, 'checkIn')
  const nudge = useNudge(
    storage.nudge,
    deviceStorage.nudge,
    isLoading || !nudgeOn ? null : todayTasks,
    storageProblem.report,
  )
  // The check-in: the top of every hour asks what was done in the hour that
  // just ended, unless it is logged already (CHECKIN-1). Its setting is the
  // account's (STORE-52); what it keeps here is the device's (STORE-54).
  const checkIn = useCheckIn(
    storage.checkIn,
    deviceStorage.checkIn,
    activities.isLoading || !checkInOn ? null : activities.entries,
    storageProblem.report,
    { onOpen: openActivityLog },
  )
  // Cases a cleared day earns the key to (CHST-2). Every live task, since
  // "everything in Today" is asked of the whole set the way the bars ask it;
  // what it asks and plays for is the account's (CHST-7), and the noise, the
  // last opening and the notice already given are this device's (CHST-24). The
  // Drop's moment is the account's own (CHST-29).
  const cases = useCases(live, rewards, deviceStorage.cases, account.id, now, !rewards.isLoading && !isLoading, {
    watching: on.cases,
    onOpen: () => { setView('rewards/cases') },
  })
  // Cases practice, switched on Settings where the build offers it, and played
  // on Cases' page (CHST-21). Kept nowhere, so it is off whenever the app is opened.
  const [casesPractice, setCasesPractice] = useState(false)
  // A key nobody notices earns nothing, so wherever Cases is navigated from
  // says one is waiting (CHST-22) — while there is a case to open (FEAT-3).
  const keyWaiting = on.cases && cases.blocked === null
  // The hours tasks are due at, watched against the clock: one that comes round
  // on a task still to do says so (REM-1). Every live task, not just Today's —
  // an hour is due at its moment wherever the task is filed — and null while
  // they load.
  const reminders = useReminders(isLoading ? null : live, on.reminders)
  // Whether this browser posts notifications, for the Notifications page (NOTIF-2).
  const notifyPermission = useNotifyPermission()
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
  // The first standing reminder and the task it points at, as it stands now:
  // `standingReminders` has already dropped any whose task was finished or went.
  const reminderNotice = reminders.notices[0] ?? null
  const reminderTask =
    reminderNotice === null ? null : live.find((task) => task.id === reminderNotice.taskId) ?? null
  const { stop: stopTaskTimer } = taskTimer
  // A timer whose task was deleted cannot be shown; stop it so it does not linger.
  useEffect(() => {
    if (isLoading) return
    if (runningTimerTaskId !== null && runningTimerTask === null) {
      stopTaskTimer(null)
    }
  }, [isLoading, runningTimerTaskId, runningTimerTask, stopTaskTimer])
  // The task being gone to from the timer's chip (TIME-20), until its row or card has
  // brought itself into view and opened — then let go of, so no row opening later,
  // on another view, takes it for a new request.
  const [reveal, setReveal] = useState<Reveal | null>(null)
  const revealed = () => { setReveal(null) }

  /** Going to a task: the view open if it shows the task, or one that does. */
  function revealTask(task: Task, part: RevealPart = 'task') {
    setView(viewShowingTask(task, view, now, lists.lists))
    setReveal({ taskId: task.id, part })
  }

  // Every notice standing, for the Notifications page and the count beside its
  // entry (NOTIF-3, NOTIF-6). Read from the notices themselves, so nothing is
  // kept for it, and one answered anywhere leaves the page too.
  const notices = standingNotices({
    tasks: live,
    drop: cases.dailyNotice,
    haul: cases.shareNotice,
    goal: taskTimer.goalNotice,
    reminders: reminders.notices,
    checkIn: checkIn.notice,
    nudge: nudgeNotice,
    on: { cases: on.cases, checkIn: checkInOn, nudge: nudgeOn },
  })
  // On the Notifications page they are listed, so they are not said over it as
  // well — as the check-in is not over the Activity log (NOTIF-5, CHECKIN-4).
  const noticesOnPage = view === 'notifications'

  /** A notice's row on Notifications does what its own notice's button does (NOTIF-4). */
  function openNotice(notice: StandingNotice) {
    switch (notice.kind) {
      case 'drop':
        cases.dismissDailyNotice()
        setView('rewards/cases')
        return
      case 'haul':
        cases.announceShare()
        setView('rewards/cases')
        return
      case 'check-in':
        openActivityLog(notice.slot)
        return
      case 'goal':
      case 'reminder':
      case 'nudge': {
        const task = live.find((candidate) => candidate.id === notice.taskId)
        dismissNotice(notice)
        if (task !== undefined) revealTask(task, notice.kind === 'goal' ? 'time' : 'task')
        return
      }
    }
  }

  /** A notice's × on Notifications, the same as its × on the notice (NOTIF-4): one reminder at a time. */
  function dismissNotice(notice: StandingNotice) {
    switch (notice.kind) {
      case 'drop':
        cases.dismissDailyNotice()
        return
      case 'haul':
        cases.announceShare()
        return
      case 'goal':
        taskTimer.dismissGoalNotice()
        return
      case 'reminder':
        reminders.dismissOne(notice.taskId)
        return
      case 'check-in':
        checkIn.dismiss()
        return
      case 'nudge':
        nudge.dismiss()
        return
    }
  }
  // Every tag there is: the kept ones, whether or not a task carries them, and
  // any a live task carries that is not kept yet.
  const tags = allTags(savedTags.tags, live)
  // Whether the done work the view folds away includes history not loaded yet
  // (STORE-55), and with it what the view's list needs to load it (TASK-74).
  const unheldHere = useUnheldHistory(isTaskView(view) ? historyScope(view, tags) : null, heldSince, !isLoading, unheld)
  const history: ListHistory | null =
    heldSince === null || unheldHere === 'none' ? null : { heldSince, unheld: unheldHere, onReachBack: reachBack }
  // The done work long ago that each goal on screen counts too (GOAL-9): every goal on Goals, the one on its own view.
  const goalsOnScreen = view === 'goals' ? goals.goals.map((goal) => goal.id) : isGoalView(view) ? [viewGoalId(view)] : null
  const goalHistory = useGoalHistory(goalsOnScreen, heldSince, !isLoading, unheld)
  // The goal whose view is open, if it is one there is (GOAL-10).
  const openGoal = isGoalView(view) ? findGoal(goals.goals, viewGoalId(view)) : null

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

  // Procrastination as Today feels it: off, whatever the account says, while the
  // modes are switched off (FEAT-9).
  const focusPhase = procrastinationOn ? procrastination.phase : 'off'
  // Focus dims every other row; a win keeps the finished task highlighted until Rest / next.
  const focusId = view === 'today' && focusPhase !== 'off' ? procrastination.taskId : null
  // A finished focused task would sink with done work; keep it above the dimmed rows.
  const listed = pinFocusedFirst(ordered, focusId)
  const dimChrome = focusPhase !== 'off'

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
    nudge: {
      on: nudge.preference.on,
      quietHours: nudge.preference.quietHours,
      window: nudge.preference.window,
      loading: nudge.isLoading,
      onTurnOn: nudge.turnOn,
    },
    checkIn: {
      on: checkIn.preference.on,
      window: checkIn.preference.window,
      loading: checkIn.isLoading,
      onTurnOn: checkIn.turnOn,
    },
  })
  // Only the modes there are count: one hidden with its feature is not on to anyone (FEAT-9).
  const modesOn = modesShown(featuresOff).filter((mode) => modes[mode].on).length
  // The section whose strip runs across the top of this page, if it is in one (UI-84).
  const section = sectionOf(view)
  const upLink = upLinkOf(view)

  // Same as the Procrastination switch on Modes (JUST-1, JUST-8): start when off, end when on.
  useLetterShortcut('p', procrastinationOn && view === 'today' && procrastination.available && !adding, () => {
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
   * A habit skipped costs twice its reward (HAB-34), and the toast says how much,
   * with the way back: undoing takes the skip back and the points with it. A skip
   * that costs nothing — no reward, or not a habit — says nothing, and neither
   * does one while Rewards is switched off, which still costs (FEAT-5) but shows
   * no points anywhere (FEAT-3). A skip turned down for want of a rest (HAB-38)
   * changed nothing, so there is nothing to undo: the control pressed says why.
   */
  function handleSkip(id: TaskId): SkipOutcome {
    const task = tasks.find((candidate) => candidate.id === id)
    const cost = task !== undefined && canSkipOccurrence(task, now) ? skipPenalty(task) : 0
    const outcome = skip(id, restLimit)
    if (outcome === 'skipped' && task !== undefined && cost > 0 && on.rewards) {
      undo.show({ kind: 'skip', taskId: id, title: task.title, points: cost })
    }
    return outcome
  }

  // The same `now` once more: which quote is today's is derived from the day it
  // falls in, so the quote and the bars can't disagree about which day it is.
  const quote = useQuote(quotableQuoteSource, deviceStorage.quote, now, on.quote)
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
      case 'skip':
        unskip(undo.pending.taskId)
        break
      case 'category':
        categories.restore(undo.pending.category)
        break
      case 'activity':
        activities.restore(undo.pending.entry)
        break
      case 'journal':
        journal.restore(undo.pending.entry)
        break
      case 'note':
        notes.restore(undo.pending.note)
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
   * Leaving a list someone else shared (LST-30) takes it out of the lists and
   * no more: its tasks are its owner's, and stay filed under it, so they go
   * from here with it rather than back into this account's Inbox.
   */
  function handleLeaveList(id: ListId) {
    lists.remove(id)
    if (view === oneListView(id)) setView('lists')
  }

  /**
   * Deleting a goal is two changes, as deleting a list is: its tasks unlinked,
   * then the goal itself (GOAL-17). The tasks go first, and a task left naming a
   * goal that is gone serves none anyway (`goalOf`).
   */
  function handleDeleteGoal(id: GoalId) {
    clearGoalEverywhere(id)
    goals.remove(id)
    // Leaving the view of a goal that has gone: nothing would serve it.
    if (view === goalView(id)) setView('goals')
  }

  /** Makes a goal and opens it, so the next thing typed goes into it (GOAL-18). */
  function handleAddGoal(name: string): boolean {
    const made = goals.add(name)
    if (made === null) return false

    setView(goalView(made.id))
    return true
  }

  /**
   * Deleting a tag is two changes, as deleting a list is: off every task, then
   * no longer kept. The tasks go first, so a tag no record keeps is never left on
   * a task to be kept all over again — the history too, which is why both wait
   * until every task is held (`everywhere`, STORE-55).
   */
  function handleDeleteTag(name: string) {
    everywhere(() => {
      removeTagEverywhere(name)
      savedTags.remove(name)
      // Unbound from every Balance category too, rather than left naming a tag that has gone (BAL-11).
      categories.removeTag(name)
    })
  }

  /** Makes a tag no task carries yet, unless there is one of that name already. */
  function handleAddTag(name: string): boolean {
    return !tags.some((tag) => sameTag(tag, name)) && savedTags.add(name) !== null
  }

  /**
   * Renaming a tag is two changes, as deleting one is: on every task carrying
   * it, then its record (TAG-24). The tasks go first for the same reason. A name
   * another tag has is refused, and the page says so; the old name in another
   * case is the same tag respelled, which is allowed (TAG-4).
   */
  function handleRenameTag(from: string, to: string): boolean {
    if (tags.some((tag) => sameTag(tag, to) && !sameTag(tag, from))) return false

    // On every task, the history too, so the change waits until every task is held (STORE-55).
    everywhere(() => {
      renameTagEverywhere(from, to)
      // The categories bound to it stay bound under the new name (BAL-11).
      categories.renameTag(from, to)
      savedTags.rename(from, to)
    })
    return true
  }

  /**
   * Binds a tag to a Balance category (BAL-9). A tag named for the first time
   * here is kept, as one made on the Tags page is, so it is there to give a task.
   */
  function handleBindTag(id: CategoryId, name: string) {
    if (!tags.some((tag) => sameTag(tag, name))) savedTags.add(name)
    categories.bind(id, name, tags)
  }

  /** Deletes a Balance category, with a few seconds to take it back (BAL-10). */
  function handleDeleteCategory(id: CategoryId) {
    const deleted = categories.categories.find((category) => category.id === id)
    if (deleted === undefined) return

    categories.remove(id)
    undo.show({ kind: 'category', category: deleted })
  }

  /** Takes a record out of the activity log, with a few seconds to take it back (ACT-11). */
  function handleRemoveActivity(entry: ActivityEntry) {
    activities.remove(entry.id)
    undo.show({ kind: 'activity', entry })
  }

  /** Takes a line out of the journal, with a few seconds to take it back (JRN-5). */
  function handleRemoveJournalLine(entry: JournalEntry) {
    journal.remove(entry.id)
    undo.show({ kind: 'journal', entry })
  }

  /** Deletes a note, with a few seconds to take it back (NOTE-6). */
  function handleRemoveNote(note: Note) {
    notes.remove(note.id)
    undo.show({ kind: 'note', note })
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
    changeDay,
    // Setting an hour is asking to be told when it comes round, so that is the
    // moment to ask the browser whether it may say so (REM-7).
    changeTime: (id, time) => {
      if (time !== null && on.reminders) reminders.ask()
      changeTime(id, time)
    },
    skip: handleSkip,
    unskip,
    // A rule that would make one habit more is held to the warm-up's allowance,
    // the same as adding one; turning a habit's own rule over is no new habit.
    changeRepeat: (id, repeat) => {
      const task = tasks.find((candidate) => candidate.id === id)
      if (warmUpOn && warmUp.holdsBack(repeat, task?.repeat ?? null)) return
      changeRepeat(id, repeat)
    },
    changeReward,
    changeUrgent,
    changeTimeGoal,
    logTime: logTaskTime,
    // A session taken back was logged by mistake, so the hours it filled in the
    // activity log were not spent on it either (ACT-21).
    removeTimeEntry: (id, entryId) => {
      removeTaskTime(id, entryId)
      activities.removeSession(entryId)
    },
    // A length changed rewrites the session's hours in the activity log, as
    // useTasks tells it (TIME-24, ACT-21).
    changeTimeEntry: changeTaskTime,
    changeList,
    changeGoal,
    addTag: (id, name) => { tag(id, name, tags) },
    removeTag: untag,
    remove: handleRemove,
    // A copy of a habit is another habit (WARM-4).
    duplicate: (id) => {
      const task = tasks.find((candidate) => candidate.id === id)
      if (warmUpOn && warmUp.holdsBack(task?.repeat ?? null)) return
      duplicate(id)
    },
    addSubtask: addChecklistItem,
    setSubtaskDone: setChecklistItemDone,
    renameSubtask: renameChecklistItem,
    removeSubtask: removeChecklistItem,
    moveSubtask: moveChecklistItem,
    goTo: (id) => {
      const task = live.find((candidate) => candidate.id === id)
      if (task !== undefined) revealTask(task)
    },
  }

  /**
   * Adds a task, unless a warm-up holds the habit it would be back (WARM-4).
   * Every way of adding goes through here, so the one-line box, the detailed
   * sheet and Habits' own box are all held to the same allowance, and all start
   * a task at the reward set for new tasks (RWD-45) — unless the sheet says what
   * it is worth, none included. Says whether the task was added, so a sheet
   * knows whether to close.
   */
  function handleAddTask(
    title: string,
    repeat: Repeat | null,
    day: LocalDay | null,
    time: LocalTime | null,
    taskTags: readonly string[],
    listId: ListId | null,
    details?: Parameters<typeof addTask>[6],
  ): boolean {
    if (warmUpOn && warmUp.holdsBack(repeat)) return false

    if (time !== null && on.reminders) reminders.ask()
    addTask(title, repeat, day, time, taskTags, listId, { reward: rewards.newTaskReward, ...details })
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
    // What is switched off on Settings, for whatever is drawn below to ask (FEAT-3),
    // and the limit on habits' rests, for every card, row and sheet that reads it (HAB-36).
    <FeaturesContext value={featuresOff}>
    <GoalsContext value={goals.goals}>
    <HabitRestsContext value={restLimit}>
      {/* On a phone the page keeps clear of the notch and the rounded corners (UI-61), and its
          end scrolls clear of the bar — and of the Plus, where there is one — so nothing is left
          under them (UI-4). */}
      <main
        className={`mx-auto flex min-h-dvh w-full max-w-6xl flex-col pt-[max(1.5rem,calc(env(safe-area-inset-top)+0.75rem))] pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))] md:px-4 md:pt-6 md:pb-8 ${
          hasPlus ? 'pb-[calc(10rem+env(safe-area-inset-bottom))]' : 'pb-[calc(6rem+env(safe-area-inset-bottom))]'
        }`}
      >
        {/* Which view this is, for a screen reader only: on screen the navigation marks it. */}
        <h1 className="sr-only">{viewLabel(view, lists.lists, goals.goals)}</h1>

        {/* Around the navigation as well as the rows: a task can be dropped on a list in the sidebar to file it. */}
        <TaskDragAndDrop tasks={draggable} onMove={move} onFile={changeList}>
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-6">
            <SideNav
              view={view}
              lists={lists.lists}
              listsOpen={sideNav.listsOpen}
              rewardsOpen={sideNav.rewardsOpen}
              modesOpen={sideNav.modesOpen}
              organizeOpen={sideNav.organizeOpen}
              reflectOpen={sideNav.reflectOpen}
              keyWaiting={keyWaiting}
              notices={notices.length}
              dimmed={dimChrome}
              onChange={setView}
              onListsOpenChange={(listsOpen) => { setSideNav({ ...sideNav, listsOpen }) }}
              onRewardsOpenChange={(rewardsOpen) => { setSideNav({ ...sideNav, rewardsOpen }) }}
              onModesOpenChange={(modesOpen) => { setSideNav({ ...sideNav, modesOpen }) }}
              onOrganizeOpenChange={(organizeOpen) => { setSideNav({ ...sideNav, organizeOpen }) }}
              onReflectOpenChange={(reflectOpen) => { setSideNav({ ...sideNav, reflectOpen }) }}
            />

            {/* The work and its rail under the pinned tabs, which only a wide screen has (UI-75). */}
            <div className="flex min-w-0 flex-1 flex-col gap-5">
              <PinnedTabs
                view={view}
                pinned={pinned}
                lists={lists.lists}
                tags={tags}
                keyWaiting={keyWaiting}
                dimmed={dimChrome}
                onChange={setView}
                onPin={(tab) => { changeTabs((latest) => pinTab(latest, tab)) }}
                onUnpin={(tab) => { changeTabs((latest) => unpinTab(latest, tab)) }}
                onMove={(from, over) => { changeTabs((latest) => moveTab(latest, from, over)) }}
              />

              <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-6">
                <div className="flex min-w-0 flex-1 flex-col gap-5">
                  {/* The pages of the section this one is in, to step between them without the sidebar (UI-84). */}
                  {section !== null && (
                    <SectionNav
                      section={section}
                      view={view}
                      lists={lists.lists}
                      keyWaiting={keyWaiting}
                      onChange={setView}
                    />
                  )}
                  {/* A goal's or a tag's tasks have no strip: a link back to the page they were opened from (UI-85). */}
                  {upLink !== null && <UpLink to={upLink} onChange={setView} />}
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
                        habitView={habitViewOptions}
                        onHabitViewChange={setHabitViewOptions}
                        habitRests={{ on: habitRests.rests !== null, loading: habitRests.isLoading }}
                        onHabitRestsChange={habitRests.turn}
                        casesCounting={{ countUnpaid: cases.settings.countUnpaid, loading: rewards.isLoading }}
                        onCasesCountUnpaidChange={(countUnpaid) => { cases.setSettings({ ...cases.settings, countUnpaid }) }}
                        casesPractice={
                          DEV_FLAGS.casesPractice ? { practising: casesPractice, onChange: setCasesPractice } : undefined
                        }
                        features={{ off: featuresOff, loading: features.isLoading }}
                        onFeatureChange={features.turn}
                        layout={settingsLayout}
                        onFoldChange={(part, open) => { setSettingsLayout((latest) => ({ ...latest, [part]: open })) }}
                      />
                    </section>
                  ) : view === 'level' ? (
                    <section aria-label={viewLabel(view)}>
                      <LevelPage
                        standing={level}
                        failed={xp.status === 'failed'}
                        startedOn={xp.progress?.startedOn ?? null}
                        now={now}
                      />
                    </section>
                  ) : view === 'more' ? (
                    <section aria-label="More">
                      <MorePage onOpen={setView} notices={notices.length} modesOn={modesOn} />
                    </section>
                  ) : view === 'organize' ? (
                    <section aria-label="Organize">
                      <OrganizePage onOpen={setView} />
                    </section>
                  ) : view === 'reflect' ? (
                    <section aria-label="Reflect">
                      <ReflectPage onOpen={setView} />
                    </section>
                  ) : view === 'modes' ? (
                    <section aria-label="Modes">
                      <ModesPage modes={modes} onOpen={setView} />
                    </section>
                  ) : isModesView(view) ? (
                    <section aria-label={viewLabel(view)} className="flex flex-col gap-5">
                      <ModePage
                        mode={modes[view]}
                        settings={
                          // The nudge is the one mode with something to set (MODE-12),
                          // and it is set whether it is on or off: a span and the hours
                          // to keep to are what someone decides before turning it on.
                          view === 'modes/nudge' ? (
                            <NudgeSettings
                              quietHours={nudge.preference.quietHours}
                              window={nudge.preference.window}
                              permission={nudge.permission}
                              now={now}
                              onQuietHoursChange={nudge.changeQuietHours}
                              onWindowChange={nudge.changeWindow}
                            />
                          ) : view === 'modes/check-in' ? (
                            // The check-in's hours, set whether it is on or off: they are also
                            // the hours the activity log counts as meant to be logged (ACT-17).
                            <CheckInSettings
                              window={checkIn.preference.window}
                              permission={checkIn.permission}
                              now={now}
                              onWindowChange={checkIn.changeWindow}
                            />
                          ) : undefined
                        }
                      />
                      {/* Pause only while one is under way: there is nothing to freeze before it starts (WARM-11). */}
                      {view === 'modes/warm-up' && warmUp.progress !== null && (
                        <WarmUpPause paused={warmUp.progress.paused} onChange={warmUp.setPaused} />
                      )}
                    </section>
                  ) : isRewardsView(view) ? (
                    <section aria-label={viewLabel(view)} className="flex flex-col gap-5">
                      {rewards.isLoading ? (
                        <p className="py-10 text-center text-neutral-400 dark:text-neutral-600">Loading…</p>
                      ) : rewards.loadFailed ? (
                        // Zeros here would read as points lost, rather than as points unread (RWD-22).
                        <p className="py-10 text-center text-neutral-500 dark:text-neutral-400">{POINTS_NOT_LOADED}</p>
                      ) : view === 'rewards/cases' ? (
                        <CasesPage cases={cases} practising={casesPractice} onPractisingChange={setCasesPractice} />
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
                          onOpenRules={() => { setView('rewards/rules') }}
                        />
                      ) : view === 'rewards/rules' ? (
                        <RewardRulesPage
                          bonuses={rewards.bonuses}
                          entries={rewards.entries}
                          now={now}
                          pointValue={rewards.pointValue}
                          newTaskReward={rewards.newTaskReward}
                          onChangeBonus={rewards.setBonus}
                          onChangePointValue={rewards.setPointValue}
                          onChangeNewTaskReward={rewards.setNewTaskReward}
                        />
                      ) : (
                        <RewardsPage
                          entries={rewards.entries}
                          redemptions={rewards.redemptions}
                          prizes={prizes.prizes}
                          bonuses={rewards.bonuses}
                          pointValue={rewards.pointValue}
                          now={now}
                          cases={
                            on.cases
                              ? {
                                  today: cases.spans.today,
                                  daily: cases.spans.daily,
                                  share: cases.slots.some((slot) => slot.source === 'week' && slot.state !== 'waiting')
                                    ? cases.spans.week
                                    : null,
                                  waiting: cases.blocked === null,
                                  gave: cases.opened?.points ?? null,
                                }
                              : null
                          }
                          onOpenPrizes={() => { setView('rewards/prizes') }}
                          onOpenWishlist={() => { setView('rewards/wishlist') }}
                          onOpenCases={() => { setView('rewards/cases') }}
                          onOpenRules={() => { setView('rewards/rules') }}
                        />
                      )}
                    </section>
                  ) : isLoading ? (
                    <p className="py-10 text-center text-neutral-400 dark:text-neutral-600">Loading…</p>
                  ) : isTaskView(view) ? (
                    <>
                      {/* A goal's view is headed with the goal and how far it has got (GOAL-10). */}
                      {openGoal !== null && (
                        <GoalHeader
                          goal={openGoal}
                          progress={goalProgress(openGoal.id, live, now, goalHistory.get(openGoal.id) ?? 0)}
                        />
                      )}
                      {/* The View button beside the box rather than in it: the box's own controls are
                          for the task being added, the button is for how the tasks below are shown.
                          A phone has neither — it adds from the Plus (UI-54), and its details belong
                          to the sheet (UI-42) — so only the Plus is left of the form.
                          Keyed by the view, so switching views starts the box on that view's day. */}
                      <AddTaskForm
                        key={view}
                        now={now}
                        defaultDueDate={newTaskDueDay(view, now)}
                        onOpenSheet={() => { setAdding(true) }}
                        viewButton={phone ? null : <ViewOptionsMenu options={viewOptions} onChange={setViewOptions} />}
                        onAdd={(title, repeat, dueDate, dueTime) => {
                          handleAddTask(title, repeat, dueDate, dueTime, newTaskTags(view), newTaskListId(view), {
                            goalId: newTaskGoalId(view),
                          })
                        }}
                      />

                      {view === 'today' && focusPhase !== 'off' && (
                        <ProcrastinationPanel
                          phase={focusPhase}
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

                      <section aria-label={viewLabel(view, lists.lists, goals.goals)}>
                        <TaskList
                          tasks={listed}
                          now={now}
                          knownTags={tags}
                          lists={lists.lists}
                          showDetails={viewOptions.showDetails}
                          focusId={focusId}
                          dimAll={focusPhase === 'idle'}
                          doneSpans={spans}
                          foldedSpans={foldedSpans(view)}
                          history={history}
                          emptyMessage={tasksNotLoaded ? TASKS_NOT_LOADED : emptyMessage(view, lists.lists, goals.goals)}
                          allDoneMessage={allDoneMessage(view, lists.lists, goals.goals)}
                          actions={taskActions}
                          timer={taskTimer}
                          reveal={reveal}
                          onRevealed={revealed}
                        />
                      </section>

                      {/* A phone's bar has no room for the lists or the trash, so they are kept at
                          the foot of every task. The tags are on its More page. */}
                      {view === 'tasks' && (
                        <nav aria-label="Under Tasks" className="flex flex-wrap gap-1 md:hidden">
                          {on.lists && (
                            <button type="button" onClick={() => { setView('lists') }} className={footLink}>
                              <FolderIcon />
                              {VIEW_LABELS.lists}
                            </button>
                          )}
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
                          ownEmail={storage.canShare ? account.email : null}
                          onShare={lists.share}
                          onUnshare={lists.unshare}
                          onLeave={handleLeaveList}
                        />
                      )}
                    </section>
                  ) : view === 'goals' ? (
                    <section aria-label="Goals">
                      {goals.isLoading ? (
                        <p className="py-10 text-center text-neutral-400 dark:text-neutral-600">Loading…</p>
                      ) : (
                        <GoalsPage
                          goals={summarizeGoals(goals.goals, live, now, goalHistory)}
                          onOpen={(id) => { setView(goalView(id)) }}
                          onAdd={handleAddGoal}
                          onRename={goals.rename}
                          onDelete={handleDeleteGoal}
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
                          onRename={handleRenameTag}
                          onDelete={handleDeleteTag}
                        />
                      )}
                    </section>
                  ) : view === 'balance' ? (
                    <section aria-label="Balance">
                      {categories.isLoading ? (
                        <p className="py-10 text-center text-neutral-400 dark:text-neutral-600">Loading…</p>
                      ) : (
                        <BalancePage
                          categories={categories.categories}
                          // Every task, the trash too: deleted time still counts until it is purged (BAL-3).
                          tasks={tasks}
                          knownTags={tags}
                          now={now}
                          onAdd={categories.add}
                          onRename={categories.rename}
                          onBind={handleBindTag}
                          onUnbind={categories.unbind}
                          onLogTime={categories.logTime}
                          onRemoveTime={categories.removeTime}
                          onChangeTime={categories.changeTime}
                          onDelete={handleDeleteCategory}
                        />
                      )}
                    </section>
                  ) : view === 'activity' ? (
                    <section aria-label="Activity log">
                      {activities.isLoading || checkIn.isLoading ? (
                        <p className="py-10 text-center text-neutral-400 dark:text-neutral-600">Loading…</p>
                      ) : (
                        <ActivityPage
                          // Opened afresh from a check-in, on the hour it asked about.
                          key={activityOpen.times}
                          entries={activities.entries}
                          window={checkIn.preference.window}
                          now={now}
                          checkIn={checkInOn ? modes['modes/check-in'] : null}
                          initialSlot={activityOpen.slot}
                          onAdd={(activity, seconds, slot) => { activities.add(activity, seconds, slot) }}
                          onChange={activities.change}
                          onRemove={handleRemoveActivity}
                          onOpenCheckIn={() => { setView('modes/check-in') }}
                        />
                      )}
                    </section>
                  ) : view === 'notes' ? (
                    <section aria-label="Notes">
                      {notes.isLoading ? (
                        <p className="py-10 text-center text-neutral-400 dark:text-neutral-600">Loading…</p>
                      ) : (
                        <NotesPage
                          notes={notes.notes}
                          now={now}
                          onAdd={(text) => { notes.add(text) }}
                          onChange={notes.change}
                          onRemove={handleRemoveNote}
                        />
                      )}
                    </section>
                  ) : view === 'journal' ? (
                    <section aria-label="Journal">
                      {journal.isLoading ? (
                        <p className="py-10 text-center text-neutral-400 dark:text-neutral-600">Loading…</p>
                      ) : (
                        <JournalPage
                          entries={journal.entries}
                          now={now}
                          onAdd={(section, text, day) => { journal.add(section, text, day) }}
                          onChange={journal.change}
                          onRemove={handleRemoveJournalLine}
                        />
                      )}
                    </section>
                  ) : view === 'notifications' ? (
                    <section aria-label="Notifications">
                      <NotificationsPage
                        permission={notifyPermission}
                        onAllow={() => { void askToNotify() }}
                        notices={notices}
                        onOpen={openNotice}
                        onDismiss={dismissNotice}
                      />
                    </section>
                  ) : view === 'habits' ? (
                    <>
                      {/* Where the warm-up is felt, so where it says where it stands (WARM-6). */}
                      {warmUpOn && (
                        <WarmUpPanel
                          progress={warmUp.progress}
                          onMoreInfo={() => { setView('modes/warm-up') }}
                        />
                      )}

                      {/* The box alone, for a new habit: how the cards below start is set on
                          Settings (HAB-23), so no View button stands beside it. */}
                      <AddTaskForm
                        now={now}
                        defaultDueDate={null}
                        defaultRepeat={{ kind: 'daily' }}
                        label="Add habit"
                        onOpenSheet={() => { setAdding(true) }}
                        onAdd={(title, repeat, dueDate, dueTime) => {
                          handleAddTask(title, repeat ?? { kind: 'daily' }, dueDate, dueTime, [], null)
                        }}
                      />

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
                          reveal={reveal}
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

                {/* Only beside Today, Tomorrow, Week and Month, the views a period's bars speak to (UI-2).
                    The bars above the quote everywhere: on a phone the rail follows the work and the quote ends the page.
                    With both switched off on Settings there is no rail, and the work takes its width (FEAT-3). */}
                {isPeriodView(view) && (on.progress || on.quote) && (
                  <div className="flex flex-col gap-5 md:w-64 md:shrink-0">
                    {on.progress && (
                      <aside aria-label="Progress">
                        {!isLoading && <ProgressPanel tasks={live} now={now} dimmed={dimChrome} />}
                      </aside>
                    )}

                    {on.quote && <QuoteCard quote={quote} dimmed={dimChrome} />}
                  </div>
                )}
              </div>
            </div>
          </div>
        </TaskDragAndDrop>

        <BottomNav view={view} lists={lists.lists} keyWaiting={keyWaiting} dimmed={dimChrome} onChange={setView} />

        {adding && (isTaskView(view) || view === 'habits') && (
          <AddTaskSheet
            key={view}
            now={now}
            label={view === 'habits' ? 'Add habit' : 'Add task'}
            defaultDueDate={isTaskView(view) ? newTaskDueDay(view, now) : null}
            defaultRepeat={view === 'habits' ? { kind: 'daily' } : undefined}
            defaultTags={isTaskView(view) ? newTaskTags(view) : []}
            defaultListId={isTaskView(view) ? newTaskListId(view) : null}
            defaultGoalId={isTaskView(view) ? newTaskGoalId(view) : null}
            newTaskReward={rewards.newTaskReward}
            knownTags={tags}
            lists={lists.lists}
            onClose={() => { setAdding(false) }}
            onAdd={(title, repeat, dueDate, dueTime, taskTags, listId, details) => {
              // Held back by the warm-up, the sheet stays open with everything
              // typed still in it, so the rule can be changed instead (WARM-8).
              if (handleAddTask(title, repeat, dueDate, dueTime, taskTags, listId, details)) setAdding(false)
            }}
          />
        )}

        {/* A habit held back is said at the top of the window, above the add sheet
            (z-40) rather than under it: the sheet is left open with everything
            typed still in it, so the notice has to be readable over it (WARM-8). */}
        {warmUpOn && warmUp.notice !== null && (
          <div className="pointer-events-none fixed inset-x-0 top-[max(1rem,env(safe-area-inset-top))] z-50 flex justify-center px-4">
            <WarmUpNoticeToast progress={warmUp.notice} onDismiss={warmUp.dismissNotice} />
          </div>
        )}

        {/* The daily case's timer ran out (CHST-29), or Monday brought the Haul
            (CHST-30). At the top like the warm-up's
            notice rather than in the stack below: each is an offer to go
            somewhere, and the moment it happens is the moment it is worth most. */}
        {!noticesOnPage && on.cases && (cases.dailyNotice || cases.shareNotice) && (
          <div className="pointer-events-none fixed inset-x-0 top-[max(1rem,env(safe-area-inset-top))] z-50 flex flex-col items-center gap-2 px-4">
            {cases.dailyNotice && (
              <CaseNoticeToast
                message={CASE_DAILY_NOTICE}
                onOpen={() => {
                  cases.dismissDailyNotice()
                  setView('rewards/cases')
                }}
                onDismiss={cases.dismissDailyNotice}
              />
            )}
            {cases.shareNotice && (
              <CaseNoticeToast
                message={CASE_SHARE_NOTICE}
                onOpen={() => {
                  cases.announceShare()
                  setView('rewards/cases')
                }}
                onDismiss={cases.announceShare}
              />
            )}
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
              onOpen={() => { revealTask(runningTimerTask, 'time') }}
              onStop={() => { taskTimer.stop(null) }}
            />
          )}
          {!noticesOnPage && taskTimer.goalNotice !== null && (
            <GoalNoticeToast
              title={taskTimer.goalNotice.title}
              onDismiss={taskTimer.dismissGoalNotice}
            />
          )}
          {!noticesOnPage && reminderTask !== null && reminderNotice !== null && (
            <ReminderToast
              title={reminderNotice.title}
              more={reminders.notices.length - 1}
              onOpen={() => { revealTask(reminderTask); reminders.dismiss() }}
              onDismiss={reminders.dismiss}
            />
          )}
          {!noticesOnPage && checkInOn && checkIn.notice !== null && view !== 'activity' && (
            <CheckInToast
              checkIn={checkIn.notice}
              onLog={() => {
                const asked = checkIn.notice
                if (asked !== null) openActivityLog(asked.slot)
              }}
              onDismiss={checkIn.dismiss}
            />
          )}
          {!noticesOnPage && nudgeOn && nudgeTask !== null && nudgeNotice !== null && (
            <NudgeToast
              title={nudgeNotice.title}
              quietHours={nudgeNotice.quietHours}
              onOpen={() => { revealTask(nudgeTask); nudge.dismiss() }}
              onDismiss={nudge.dismiss}
            />
          )}
          {!noticesOnPage && levelChange.change !== null && view !== 'level' && (
            <LevelToast
              from={levelChange.change.from}
              to={levelChange.change.to}
              onOpen={() => { setView('level'); levelChange.dismiss() }}
              onDismiss={levelChange.dismiss}
            />
          )}
          {undo.pending !== null && (
            // In the middle of the screen, not of the room beside the Plus: it gives back on the
            // right what the Plus takes, and keeps as clear of the left edge as of the Plus.
            <div className={hasPlus ? '-mr-16 max-w-[calc(100%-4rem)] md:mr-0 md:max-w-full' : 'max-w-full'}>
              <UndoToast pending={undo.pending} onUndo={handleUndo} onDismiss={undo.dismiss} />
            </div>
          )}
        </div>
      </main>
    </HabitRestsContext>
    </GoalsContext>
    </FeaturesContext>
  )
}
