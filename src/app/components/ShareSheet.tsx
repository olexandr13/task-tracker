import { useState } from 'react'
import { MAX_EMAIL_LENGTH, shareRefusal, type List, type ShareRefusal } from '../../core'
import { SHARE_REFUSALS } from '../shareLabels'
import { useRefusal } from '../useRefusal'
import { deleteControl } from '../rowControls'
import { BottomSheet } from './BottomSheet'

interface ShareSheetProps {
  /** One of the account's own lists, with whom it is shared already. */
  list: List
  /** The owner's own address, which there is no sharing a list with. */
  ownEmail: string
  /** Shares the list with one more person, by an address `shareRefusal` takes. */
  onShare: (email: string) => void
  /** Stops sharing the list with one person. */
  onUnshare: (email: string) => void
  onClose: () => void
}

const field =
  'min-w-0 flex-1 rounded-lg border border-neutral-300 bg-transparent px-2.5 py-2 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none md:px-2 md:py-1 md:text-sm dark:border-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-500'
const button =
  'h-11 rounded-xl px-4 text-base font-medium transition-colors md:h-9 md:rounded-lg md:text-sm'
const share = `${button} shrink-0 bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400`
const done = `${button} w-full bg-neutral-100 text-neutral-800 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700`
const person = 'flex min-h-9 items-center gap-2 rounded-lg px-2 text-sm text-neutral-800 dark:text-neutral-200'

/**
 * Sharing one of the account's own lists (LST-28): a box for an address, and
 * everyone the list is shared with, each with a button that stops sharing it
 * with them (LST-29). An address that will not do is answered under the box,
 * which shakes, rather than the button being dimmed with no reason given.
 */
export function ShareSheet({ list, ownEmail, onShare, onUnshare, onClose }: ShareSheetProps) {
  const [typed, setTyped] = useState('')
  // Why the last address tried was not added, until the box changes.
  const [refusal, setRefusal] = useState<ShareRefusal | null>(null)
  const { refused, refuse } = useRefusal()
  const heading = `Share "${list.name}"`

  function handleShare() {
    const why = shareRefusal(list, typed, ownEmail)
    if (why !== null) {
      setRefusal(why)
      refuse()
      return
    }

    onShare(typed)
    setTyped('')
    setRefusal(null)
  }

  return (
    <BottomSheet label={heading} onClose={onClose}>
      <div className="flex flex-col gap-4 px-4 pt-1 pb-1 md:px-5 md:pt-2">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-lg leading-6 text-neutral-900 dark:text-neutral-100">{heading}</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Type someone’s email address and press “Share”.
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            They see this list when they sign in to PickMe with Google using that address.
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            They can add tasks to it, change them, tick them off and delete them, just as you can.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <div className={`flex items-center gap-1.5${refused ? ' refusal-shake' : ''}`}>
            <input
              type="email"
              name="share-email"
              value={typed}
              onChange={(event) => {
                setTyped(event.target.value)
                setRefusal(null)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  handleShare()
                }
              }}
              maxLength={MAX_EMAIL_LENGTH}
              placeholder="Email address"
              aria-label="Email address to share the list with"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="send"
              className={field}
            />
            <button type="button" onClick={handleShare} className={share}>
              Share
            </button>
          </div>
          {refusal !== null && (
            <p role="alert" className="px-1 text-xs text-red-600 dark:text-red-400">
              {SHARE_REFUSALS[refusal]}
            </p>
          )}
        </div>

        <section aria-label="People with access" className="flex flex-col gap-1">
          <h3 className="px-2 text-xs font-medium tracking-wide text-neutral-400 uppercase dark:text-neutral-500">
            People with access
          </h3>
          <ul className="flex flex-col">
            <li className={person}>
              <span className="min-w-0 flex-1 truncate">{ownEmail}</span>
              <span className="shrink-0 text-xs text-neutral-400 dark:text-neutral-500">Owner</span>
            </li>
            {list.sharedWith.map((email) => (
              <li key={email} className={person}>
                <span className="min-w-0 flex-1 truncate">{email}</span>
                <button
                  type="button"
                  onClick={() => { onUnshare(email) }}
                  aria-label={`Stop sharing with ${email}`}
                  title="Stop sharing"
                  className={`flex h-6 shrink-0 items-center rounded-lg px-1.5 text-base leading-none ${deleteControl}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          {list.sharedWith.length === 0 && (
            <p className="px-2 text-sm text-neutral-500 dark:text-neutral-400">Only you can see this list.</p>
          )}
        </section>

        <button type="button" onClick={onClose} className={done}>
          Done
        </button>
      </div>
    </BottomSheet>
  )
}
