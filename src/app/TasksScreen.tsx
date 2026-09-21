import { useEffect, useState } from 'react'
import {
  allTags,
  countInboxOpen,
  groupByCompletion,
  habitTasks,
  liveTasks,
  sameTag,
  sortForDisplay,
  summarizeLists,
  summarizeTags,
  trashedTasks,
  type ListId,
  type TaskId,
} from '../core'
import type { Account } from '../storage/authService'
import { firestore } from '../storage/firebaseApp'
import { createFirestoreBackupRepository } from '../storage/firestoreBackupRepository'
import { createFirestoreListRepository } from '../storage/firestoreListRepository'
import { createFirestoreRewardRepository } from '../storage/firestoreRewardRepository'
import { createFirestoreSyncMonitor } from '../storage/firestoreSyncMonitor'
import { createFirestoreTagRepository } from '../storage/firestoreTagRepository'
import { createFirestoreTaskRepository } from '../storage/firestoreTaskRepository'
import { localStorageHabitViewOptionsRepository } from '../storage/localStorageHabitViewOptionsRepository'
import { localStorageQuoteRepository } from '../storage/localStorageQuoteRepository'
import { localStorageSideNavRepository } from '../storage/localStorageSideNavRepository'
import { localStorageViewOptionsRepository } from '../storage/localStorageViewOptionsRepository'
import { importLocalTasks } from '../storage/localTaskImport'
import { quotableQuoteSource } from '../storage/quotableQuoteSource'
import { AddTaskForm } from './components/AddTaskForm'
import { BottomNav } from './components/BottomNav'
import { FolderIcon } from './components/FolderIcon'
import { HabitList } from './components/HabitList'
import { HabitViewOptionsMenu } from './components/HabitViewOptionsMenu'
import { ListsPage } from './components/ListsPage'
import { MorePage } from './components/MorePage'
import { ProgressPanel } from './components/ProgressPanel'
import { QuoteCard } from './components/QuoteCard'
import { RewardsPage } from './components/RewardsPage'
import { SettingsList } from './components/SettingsList'
import { SideNav } from './components/SideNav'
import { SyncBadge } from './components/SyncBadge'
import { TagList } from './components/TagList'
import { TaskDragAndDrop } from './components/TaskDragAndDrop'
import { TaskList } from './components/TaskList'
import { TrashIcon } from './components/TrashIcon'
import { TrashList } from './components/TrashList'
import { UndoToast } from './components/UndoToast'
import { ViewOptionsMenu } from './components/ViewOptionsMenu'
import { useBackup } from './useBackup'
import { useLists } from './useLists'
import { useQuote } from './useQuote'
import { useRewards } from './useRewards'
import { useSideNav } from './useSideNav'
import { useSyncNotice } from './useSyncNotice'
import { useTags } from './useTags'
import { useTasks } from './useTasks'
import { useUndoToast } from './useUndoToast'
import { useView } from './useView'
import { useHabitViewOptions } from './useHabitViewOptions'
import { useViewOptions } from './useViewOptions'
import {
  allDoneMessage,
  emptyMessage,
  doneSpans,
  isTaskView,
  newTaskDueDay,
  newTaskListId,
  newTaskTags,
  oneListView,
  showsTask,
  tagView,
  VIEW_LABELS,
  viewLabel,
} from './view'

/** A way on from the foot of Tasks, where a phone's bar has no tab for it. */
const footLink =
  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-100'

/**
 * Three areas once there is room for them: navigation down the left, the work —
 * adding tasks and the list — in the middle, and a rail holding how the periods
 * are going, with today's quote below. On a phone there is no room, so they stack:
 * the work, then the bars, then the quote at the very bottom, with the
 * navigation moved to a bar along the bottom of the screen.
 *
 * The rail belongs to the views that show tasks, not to the app, so habits,
 * rewards, More, the lists, the tags, the trash and settings do without it. The habits page is a record of progress already,
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
 * account's. The screen is remade for each account (App), so one repository of
 * each serves it for as long as it is up.
 */
export function TasksScreen({ account, onSignOut }: { account: Account; onSignOut: () => void }) {
  const [repository] = useState(() => createFirestoreTaskRepository(firestore, account.id))
  const [rewardRepository] = useState(() => createFirestoreRewardRepository(firestore, account.id))
  const [listRepository] = useState(() => createFirestoreListRepository(firestore, account.id))
  const [tagRepository] = useState(() => createFirestoreTagRepository(firestore, account.id))
  const [syncMonitor] = useState(() => createFirestoreSyncMonitor(firestore, account.id))
  const [backupRepository] = useState(() => createFirestoreBackupRepository(firestore, account.id))

  // Tasks kept in this browser from before they belonged to the account join it
  // the first time it is open here with a connection.
  useEffect(() => {
    importLocalTasks(repository).catch((error: unknown) => {
      console.warn('Could not move the tasks kept in this browser into the account; will try again next time.', error)
    })
  }, [repository])

  const {
    tasks,
    isLoading,
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
    purge,
    emptyTrash,
  } = useTasks(repository, rewardRepository)
  const rewards = useRewards(rewardRepository)
  const lists = useLists(listRepository)
  const savedTags = useTags(tagRepository, isLoading ? null : tasks)
  const backup = useBackup(backupRepository)
  const [view, setView] = useView()
  // How the task views are shown: one set for all of them, kept on this device.
  const [viewOptions, setViewOptions] = useViewOptions(localStorageViewOptionsRepository)
  // How the habits view is shown, kept on this device too, apart from the task views'.
  const [habitViewOptions, setHabitViewOptions] = useHabitViewOptions(localStorageHabitViewOptionsRepository)
  // Which of the sidebar's groups are folded away, kept on this device too.
  const [sideNav, setSideNav] = useSideNav(localStorageSideNavRepository)
  const undo = useUndoToast()
  const syncNotice = useSyncNotice(syncMonitor)

  // One `now` for the whole render, so the order of the list, what each row
  // draws, which period each bar counts and how long the trash has left all
  // agree with one another.
  const now = new Date()
  const live = liveTasks(tasks)
  const trashed = trashedTasks(tasks, now)
  // Every tag there is: the kept ones, whether or not a task carries them, and
  // any a live task carries that is not kept yet.
  const tags = allTags(savedTags.tags, live)

  // Overdue float to the top and done sink to the bottom; sort is stable, so
  // each band keeps the order it was given. A repeating task is only done for
  // its current occurrence. A view dividing its done tasks by when they were
  // finished puts the most recent first, the order its headings come in.
  const shown = isTaskView(view) ? live.filter((task) => showsTask(view, task, now, lists.lists)) : live
  const spans = isTaskView(view) ? doneSpans(view) : null
  const ordered = spans !== null
    ? groupByCompletion(sortForDisplay(shown, now), spans, now).flatMap((group) => group.tasks)
    : sortForDisplay(shown, now)

  // The same `now` once more: which quote is today's is derived from the day it
  // falls in, so the quote and the bars can't disagree about which day it is.
  const quote = useQuote(quotableQuoteSource, localStorageQuoteRepository, now)

  function handleRemove(id: TaskId) {
    const deleted = remove(id)
    if (deleted !== null) {
      undo.show(deleted)
    }
  }

  function handleUndo() {
    if (undo.pending === null) return
    restore(undo.pending.id)
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

  /** Makes a list and opens it, so the next thing typed goes into it. */
  function handleAddList(name: string): boolean {
    const made = lists.add(name)
    if (made === null) return false

    setView(oneListView(made.id))
    return true
  }

  return (
    // The bottom padding on a phone keeps the end of the page clear of the bar.
    <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 pt-6 pb-24 md:pb-8">
      {/* Which view this is, for a screen reader only: on screen the navigation marks it. */}
      <h1 className="sr-only">{viewLabel(view, lists.lists)}</h1>

      {/* Around the navigation as well as the rows: a task can be dropped on a list in the sidebar to file it. */}
      <TaskDragAndDrop tasks={ordered} onMove={move} onFile={changeList}>
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-6">
          <SideNav
            view={view}
            lists={lists.lists}
            listsOpen={sideNav.listsOpen}
            onChange={setView}
            onListsOpenChange={(listsOpen) => { setSideNav({ ...sideNav, listsOpen }) }}
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
                />
              </section>
            ) : view === 'more' ? (
              <section aria-label="More">
                <MorePage onOpen={setView} />
              </section>
            ) : view === 'rewards' ? (
              <section aria-label="Rewards">
                {rewards.isLoading ? (
                  <p className="py-10 text-center text-neutral-400 dark:text-neutral-600">Loading…</p>
                ) : (
                  <RewardsPage
                    entries={rewards.entries}
                    redemptions={rewards.redemptions}
                    now={now}
                    onRedeem={rewards.redeem}
                    onRemoveRedemption={rewards.removeRedemption}
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
                      onAdd={(title, repeat, dueDate) => {
                        addTask(title, repeat, dueDate, newTaskTags(view), newTaskListId(view))
                      }}
                    />
                  </div>

                  <ViewOptionsMenu options={viewOptions} onChange={setViewOptions} />
                </div>

                <section aria-label={viewLabel(view, lists.lists)}>
                  <TaskList
                    tasks={ordered}
                    now={now}
                    knownTags={tags}
                    lists={lists.lists}
                    showDetails={viewOptions.showDetails}
                    doneSpans={spans}
                    emptyMessage={emptyMessage(view, lists.lists)}
                    allDoneMessage={allDoneMessage(view, lists.lists)}
                    onComplete={complete}
                    onUncomplete={uncomplete}
                    onRename={rename}
                    onChangeDescription={changeDescription}
                    onChangeDueDate={changeDueDate}
                    onSkipOccurrence={skip}
                    onChangeRepeat={changeRepeat}
                    onChangeReward={changeReward}
                    onChangeUrgent={changeUrgent}
                    onChangeTimeGoal={changeTimeGoal}
                    onLogTime={logTaskTime}
                    onRemoveTimeEntry={removeTaskTime}
                    onChangeList={changeList}
                    onAddTag={(id, name) => { tag(id, name, tags) }}
                    onRemoveTag={untag}
                    onRemove={handleRemove}
                    onDuplicate={duplicate}
                    onAddSubtask={addChecklistItem}
                    onSetSubtaskDone={setChecklistItemDone}
                    onRenameSubtask={renameChecklistItem}
                    onRemoveSubtask={removeChecklistItem}
                  />
                </section>

                {/* A phone's bar has no room for the lists or the trash, so they are kept at
                    the foot of every task. The tags and the rewards are on its More page. */}
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
                {/* The View button beside the box, as on the task views: the box is for a
                    new habit, the button is for how the cards below are shown. */}
                <div className="flex gap-2">
                  <div className="min-w-0 flex-1">
                    <AddTaskForm
                      now={now}
                      defaultDueDate={null}
                      defaultRepeat={{ kind: 'daily' }}
                      onAdd={(title, repeat, dueDate) => {
                        addTask(title, repeat ?? { kind: 'daily' }, dueDate, [], null)
                      }}
                    />
                  </div>

                  <HabitViewOptionsMenu options={habitViewOptions} onChange={setHabitViewOptions} />
                </div>

                <section aria-label="Habits">
                  <HabitList
                    habits={habitTasks(tasks)}
                    now={now}
                    showDetails={habitViewOptions.showDetails}
                    knownTags={tags}
                    lists={lists.lists}
                    onComplete={complete}
                    onUncomplete={uncomplete}
                    onSetDay={setHabitDay}
                    onRename={rename}
                    onChangeDescription={changeDescription}
                    onChangeDueDate={changeDueDate}
                    onSkipOccurrence={skip}
                    onChangeRepeat={changeRepeat}
                    onChangeReward={changeReward}
                    onChangeUrgent={changeUrgent}
                    onChangeTimeGoal={changeTimeGoal}
                    onLogTime={logTaskTime}
                    onRemoveTimeEntry={removeTaskTime}
                    onChangeList={changeList}
                    onAddTag={(id, name) => { tag(id, name, tags) }}
                    onRemoveTag={untag}
                    onRemove={handleRemove}
                    onDuplicate={duplicate}
                    onAddSubtask={addChecklistItem}
                    onSetSubtaskDone={setChecklistItemDone}
                    onRenameSubtask={renameChecklistItem}
                    onRemoveSubtask={removeChecklistItem}
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
              <aside aria-label="Progress">{!isLoading && <ProgressPanel tasks={live} now={now} />}</aside>

              <QuoteCard quote={quote} />
            </div>
          )}
        </div>
      </TaskDragAndDrop>

      <BottomNav view={view} lists={lists.lists} onChange={setView} />

      {/* What the screen has to say, stacked: above a phone's navigation bar, at the foot of the window where there is none. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-30 flex flex-col items-center gap-2 px-4 md:bottom-4">
        {syncNotice !== null && <SyncBadge notice={syncNotice} />}
        {undo.pending !== null && (
          <UndoToast title={undo.pending.title} onUndo={handleUndo} onDismiss={undo.dismiss} />
        )}
      </div>
    </main>
  )
}
