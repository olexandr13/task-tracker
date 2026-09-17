import { useEffect, useState } from 'react'
import { habitTasks, isComplete, isInToday, liveTasks, sortByOrder, toLocalDay, trashedTasks, type TaskId } from '../core'
import type { Account } from '../storage/authService'
import { firestore } from '../storage/firebaseApp'
import { createFirestoreTaskRepository } from '../storage/firestoreTaskRepository'
import { localStorageQuoteRepository } from '../storage/localStorageQuoteRepository'
import { importLocalTasks } from '../storage/localTaskImport'
import { quotableQuoteSource } from '../storage/quotableQuoteSource'
import { AccountMenu } from './components/AccountMenu'
import { AddTaskForm } from './components/AddTaskForm'
import { HabitList } from './components/HabitList'
import { ProgressPanel } from './components/ProgressPanel'
import { QuoteCard } from './components/QuoteCard'
import { SideNav } from './components/SideNav'
import { TaskList } from './components/TaskList'
import { TrashList } from './components/TrashList'
import { UndoToast } from './components/UndoToast'
import { useQuote } from './useQuote'
import { useTasks } from './useTasks'
import { useUndoToast } from './useUndoToast'
import { ALL_DONE_MESSAGES, EMPTY_MESSAGES, isListView, VIEW_LABELS, type View } from './view'

/**
 * Three areas once there is room for them: navigation down the left, the work —
 * adding tasks and the list — in the middle, and a rail holding today's quote
 * and how the periods are going. On a phone there is no room, so they stack:
 * the nav collapses to a single button, then the rail, then the work.
 *
 * The rail belongs to the lists of tasks, not to the app, so habits and the
 * trash do without it. The habits page is a record of progress already, and
 * how much of the week is cleared says nothing about what was thrown away —
 * nobody needs spurring on to empty a bin.
 *
 * Today and Tasks are one screen showing different tasks: the full list, or the
 * part of it due today. The bars count every live task either way, being about
 * the periods rather than about the list on screen.
 *
 * The account sits at the end of the heading rather than in the nav, so it is
 * one tap away on a phone too, where the nav is collapsed.
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
    restore,
    purge,
    emptyTrash,
  } = useTasks(repository)
  const [view, setView] = useState<View>('today')
  const undo = useUndoToast()

  // One `now` for the whole render, so the order of the list, what each row
  // draws, which period each bar counts and how long the trash has left all
  // agree with one another.
  const now = new Date()
  const live = liveTasks(tasks)
  const trashed = trashedTasks(tasks, now)

  // Done tasks sink to the bottom; sort is stable, so each group keeps the order
  // it was given. A repeating task is only done for its current occurrence.
  const shown = view === 'today' ? live.filter((task) => isInToday(task, now)) : live
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
    <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">{VIEW_LABELS[view]}</h1>
        <AccountMenu account={account} onSignOut={onSignOut} />
      </header>

      <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-6">
        <SideNav view={view} onChange={setView} />

        {/* Before the work in the markup so a phone, and a screen reader, meet it first. */}
        {isListView(view) && (
          <div className="flex flex-col gap-5 md:order-last md:w-64 md:shrink-0">
            <QuoteCard quote={quote} />

            <aside aria-label="Progress">{!isLoading && <ProgressPanel tasks={live} now={now} />}</aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          {isLoading ? (
            <p className="py-10 text-center text-neutral-400 dark:text-neutral-600">Loading…</p>
          ) : isListView(view) ? (
            <>
              {/* Keyed by the list, so switching lists starts the box on that list's day. */}
              <AddTaskForm
                key={view}
                now={now}
                defaultDueDate={view === 'today' ? toLocalDay(now) : null}
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
                  onAddSubtask={addChecklistItem}
                  onSetSubtaskDone={setChecklistItemDone}
                  onRenameSubtask={renameChecklistItem}
                  onRemoveSubtask={removeChecklistItem}
                />
              </section>
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
      </div>

      {undo.pending !== null && (
        <UndoToast title={undo.pending.title} onUndo={handleUndo} onDismiss={undo.dismiss} />
      )}
    </main>
  )
}
