import { useId, useState } from 'react'
import { describeSavedKey, KEY_DESCRIPTION, KEY_LABEL, REMOVE_KEY, SAVE_KEY } from '../assistantLabels'

const field =
  'w-full min-w-0 rounded-lg border border-neutral-300 bg-transparent px-2.5 py-2 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none md:px-2 md:py-1 md:text-sm dark:border-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-500'
const action =
  'inline-flex min-h-10 shrink-0 items-center rounded-lg border border-neutral-200 px-4 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900 active:bg-neutral-100 md:min-h-0 md:px-3 md:py-1 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 dark:active:bg-neutral-800'

interface AssistantSettingsProps {
  /** The key this device holds, or null. */
  apiKey: string | null
  onChange: (apiKey: string | null) => void
}

/**
 * The assistant's own settings, folded under its switch in Features on
 * Settings (FEAT-10): the Gemini key, given on this device alone (AI-2).
 *
 * A saved key is never drawn back into the box, only named by its last four
 * characters, so it is not on screen for anyone looking over a shoulder.
 * Removing it asks nothing: it is pasted back as easily.
 */
export function AssistantSettings({ apiKey, onChange }: AssistantSettingsProps) {
  const [draft, setDraft] = useState('')
  const keyId = useId()
  const descriptionId = useId()

  return (
    <div className="flex flex-col gap-2 py-2">
      {apiKey === null ? (
        <label htmlFor={keyId} className="text-sm text-neutral-900 dark:text-neutral-100">
          {KEY_LABEL}
        </label>
      ) : (
        <p className="text-sm text-neutral-900 dark:text-neutral-100">{KEY_LABEL}</p>
      )}
      {apiKey === null ? (
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            if (draft.trim() === '') return
            onChange(draft)
            setDraft('')
          }}
        >
          <input
            id={keyId}
            name="assistant-key"
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={draft}
            onChange={(event) => { setDraft(event.target.value) }}
            aria-describedby={descriptionId}
            className={field}
          />
          <button type="submit" className={action}>
            {SAVE_KEY}
          </button>
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <p className="min-w-0 flex-1 text-sm text-neutral-700 dark:text-neutral-300">
            {describeSavedKey(apiKey)}
          </p>
          <button type="button" onClick={() => { onChange(null) }} className={action}>
            {REMOVE_KEY}
          </button>
        </div>
      )}
      <p id={descriptionId} className="text-xs text-neutral-500 dark:text-neutral-400">
        {KEY_DESCRIPTION}
      </p>
    </div>
  )
}
