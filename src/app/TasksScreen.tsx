import { useEffect, useState } from 'react'
import { habitTasks, isComplete, liveTasks, sortByOrder, trashedTasks, type TaskId } from '../core'
import type { Account } from '../storage/authService'
import { firestore } from '../storage/firebaseApp'
import { createFirestoreTaskRepository } from '../storage/firestoreTaskRepository'
import { localStorageQuoteRepository } from '../storage/localStorageQuoteRepository'
import { importLocalTasks } from '../storage/localTaskImport'
import { quotableQuoteSource } from '../storage/quotableQuoteSource'
import { AccountMenu } from './components/AccountMenu'
import { AddTaskForm } from './components/AddTaskForm'
import { BottomNav } from './components/BottomNav'
import { HabitList } from './components/HabitList'
import { ProgressPanel } from './components/ProgressPanel'
import { QuoteCard } from './components/QuoteCard'
import { SettingsList } from './components/SettingsList'
import { SideNav } from './components/SideNav'
import { TaskList } from './components/TaskList'
import { TrashIcon } from './components/TrashIcon'
import { TrashList } from './components/TrashList'
import { UndoToast } from './components/UndoToast'
import { useQuote } from './useQuote'
import { useTasks } from './useTasks'
import { useUndoToast } from './useUndoToast'
import { useView } from './useView'
import { ALL_DONE_MESSAGES, EMPTY_MESSAGES, isInList, isListView, listDueDay, VIEW_LABELS } from './view'

/**
 * Three areas once there is room for them: navigation down the left, the work —
 * adding tasks and the list — in the middle, and a rail holding how the periods
 * are going, with today's quote below. On a phone there is no room, so they stack:
 * the work, then the bars, then the quote at the very bottom, with the
 * navigation moved to a bar along the bottom of the screen.
 *
 * The rail belongs to the lists of tasks, not to the app, so habits, the trash
 * and settings do without it. The habits page is a record of progress already,
 * and how much of the week is cleared says nothing about what was thrown away —
 * nobody needs spurring on to empty a bin.
 *
 * Today, Week, Month and Tasks are one screen showing different tasks: the part
 * of the list due today, this week or this month, or all of it. The bars count every
 * live task either way, being about the periods rather than about the list on
 * screen.
 *
 * The account sits at the end of the heading rather than in the nav, so it is
 * one tap away on a phone too, where the nav has room for four tabs only.
 *
 * The tasks are the account's. The screen is remade for each account (App), so
 * one repository serves it for as long as it is up.
 */
export function TasksScreen({ account, onSignOut }: { account: Account; onSignOut: () => void }) {
  const [repository] = useState(() => createFirestoreTaskRepository(firestore, account.id))

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
    changeRepeat,
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
  } = useTasks(repository)
  const [view, setView] = useView()
  const undo = useUndoToast()

  // One `now` for the whole render, so the order of the list, what each row
  // draws, which period each bar counts and how long the trash has left all
  // agree with one another.
  const now = new Date()
  const live = liveTasks(tasks)
  const trashed = trashedTasks(tasks, now)

  // Done tasks sink to the bottom; sort is stable, so each group keeps the order
  // it was given. A repeating task is only done for its current occurrence.
  const shown = isListView(view) ? live.filter((task) => isInList(view, task, now)) : live
  const ordered = sortByOrder(shown).sort((a, b) => Number(isComplete(a, now)) - Number(isComplete(b, now)))

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

  return (
    // The bottom padding on a phone keeps the end of the page clear of the bar.
    <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-6 px-4 pt-8 pb-24 md:pb-8">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">{VIEW_LABELS[view]}</h1>
        <AccountMenu account={account} onSignOut={onSignOut} />
      </header>

      <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-6">
        <SideNav view={view} onChange={setView} />

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          {view === 'settings' ? (
            <section aria-label="Settings">
              <SettingsList />
            </section>
          ) : isLoading ? (
            <p className="py-10 text-center text-neutral-400 dark:text-neutral-600">Loading…</p>
          ) : isListView(view) ? (
            <>
              {/* Keyed by the list, so switching lists starts the box on that list's day. */}
              <AddTaskForm
                key={view}
                now={now}
                defaultDueDate={listDueDay(view, now)}
                onAdd={addTask}
              />

              <section aria-label={VIEW_LABELS[view]}>
                <TaskList
                  tasks={ordered}
                  now={now}
                  emptyMessage={EMPTY_MESSAGES[view]}
                  allDoneMessage={ALL_DONE_MESSAGES[view]}
                  onMove={move}
                  onComplete={complete}
                  onUncomplete={uncomplete}
                  onRename={rename}
                  onChangeDescription={changeDescription}
                  onChangeDueDate={changeDueDate}
                  onChangeRepeat={changeRepeat}
                  onRemove={handleRemove}
                  onDuplicate={duplicate}
                  onAddSubtask={addChecklistItem}
                  onSetSubtaskDone={setChecklistItemDone}
                  onRenameSubtask={renameChecklistItem}
                  onRemoveSubtask={removeChecklistItem}
                />
              </section>

              {/* A phone's bar has no room for the trash, so it is kept at the foot of every task. */}
              {view === 'tasks' && (
                <button
                  type="button"
                  onClick={() => { setView('trash') }}
                  className="flex items-center gap-2 self-start rounded-lg px-3 py-2 text-sm text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 md:hidden dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-100"
                >
                  <TrashIcon />
                  {VIEW_LABELS.trash}
                </button>
              )}
            </>
          ) : view === 'habits' ? (
            <section aria-label="Habits">
              <HabitList
                habits={habitTasks(tasks)}
                now={now}
                onComplete={complete}
                onUncomplete={uncomplete}
                onSetDay={setHabitDay}
              />
            </section>
          ) : (
            <section aria-label="Trash">
              <TrashList
                tasks={trashed}
                now={now}
                onRestore={restore}
                onPurge={purge}
                onEmpty={emptyTrash}
              />
            </section>
          )}
        </div>

        {/* The bars above the quote everywhere: on a phone the rail follows the work and the quote ends the page. */}
        {isListView(view) && (
          <div className="flex flex-col gap-5 md:w-64 md:shrink-0">
            <aside aria-label="Progress">{!isLoading && <ProgressPanel tasks={live} now={now} />}</aside>

            <QuoteCard quote={quote} />
          </div>
        )}
      </div>

      <BottomNav view={view} onChange={setView} />

      {undo.pending !== null && (
        <UndoToast title={undo.pending.title} onUndo={handleUndo} onDismiss={undo.dismiss} />
      )}
    </main>
  )
}
