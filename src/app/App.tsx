import { isComplete } from '../core'
import { localStorageTaskRepository } from '../storage/localStorageTaskRepository'
import { AddTaskForm } from './components/AddTaskForm'
import { TaskList } from './components/TaskList'
import { useTasks } from './useTasks'

export function App() {
  const { tasks, isLoading, addTask, complete, remove } = useTasks(localStorageTaskRepository)

  // Done tasks sink to the bottom; sort is stable, so the rest keep their order.
  const ordered = [...tasks].sort((a, b) => Number(isComplete(a)) - Number(isComplete(b)))

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>

      <AddTaskForm onAdd={addTask} />

      {isLoading ? (
        <p className="py-10 text-center text-neutral-400 dark:text-neutral-600">Loading…</p>
      ) : (
        <TaskList tasks={ordered} onComplete={complete} onRemove={remove} />
      )}
    </main>
  )
}
