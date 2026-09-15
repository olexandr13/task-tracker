import { useState, type FormEvent } from 'react'

interface AddTaskFormProps {
  onAdd: (title: string) => void
}

export function AddTaskForm({ onAdd }: AddTaskFormProps) {
  const [title, setTitle] = useState('')
  const trimmed = title.trim()
  const canAdd = trimmed.length > 0

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canAdd) return
    onAdd(trimmed)
    setTitle('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={title}
        onChange={(event) => { setTitle(event.target.value) }}
        placeholder="What needs doing?"
        aria-label="Task title"
        autoComplete="off"
        className="min-w-0 flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-neutral-400"
      />
      <button
        type="submit"
        disabled={!canAdd}
        className="shrink-0 rounded-lg bg-neutral-900 px-4 py-2.5 text-base font-medium text-white transition-opacity disabled:opacity-30 dark:bg-neutral-100 dark:text-neutral-900"
      >
        Add
      </button>
    </form>
  )
}
