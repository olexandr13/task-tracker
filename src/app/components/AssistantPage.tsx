import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { MAX_ASSISTANT_QUESTION_LENGTH, type AssistantMessage } from '../../core'
import {
  ASKING,
  ASSISTANT_EMPTY,
  ASSISTANT_FAILURES,
  ASSISTANT_HEADING,
  ASSISTANT_INTRO,
  ASSISTANT_SUGGESTIONS,
  describeMessageTime,
  MESSAGE_LABELS,
  NEW_CHAT,
  NO_KEY,
  OPEN_SETTINGS,
  QUESTION_LABEL,
  QUESTION_PLACEHOLDER,
  SEND,
} from '../assistantLabels'
import type { AssistantProblem } from '../useAssistant'
import { FormattedText, formattedLists } from './FormattedText'
import { InfoButton } from './InfoButton'

const card = 'rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'
const field =
  'w-full min-w-0 resize-none rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none md:text-sm dark:border-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-500'
const primary =
  'inline-flex min-h-10 shrink-0 items-center justify-center self-end rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700 active:bg-blue-700 disabled:pointer-events-none disabled:opacity-60 md:min-h-9 dark:bg-blue-500 dark:hover:bg-blue-400'
const quiet =
  'inline-flex min-h-9 items-center rounded-lg px-3 text-sm text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 active:bg-neutral-100 md:min-h-7 md:px-2 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 dark:active:bg-neutral-800'
const suggestion =
  'inline-flex min-h-9 items-center rounded-full border border-neutral-200 px-3 text-sm text-neutral-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 active:bg-blue-50 md:min-h-7 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-blue-800 dark:hover:bg-blue-950/40 dark:hover:text-blue-300'
const time = 'text-xs text-neutral-500 dark:text-neutral-400'

interface AssistantPageProps {
  /** Whether this device has been given a key (AI-3). */
  hasKey: boolean
  /** The conversation so far, oldest first (AI-11). */
  messages: readonly AssistantMessage[]
  /** The question on its way, or null. */
  pending: string | null
  problem: AssistantProblem | null
  now: Date
  /** Asks a question; resolves to whether an answer came. */
  onAsk: (question: string) => Promise<boolean>
  onNewChat: () => void
  onOpenSettings: () => void
}

/**
 * The assistant (AI-1): the conversation, the box to ask in, and the
 * suggestions under it (AI-10). Without a key it says where to give one
 * instead (AI-3).
 *
 * The box empties as a question is sent, and gets it back if no answer came,
 * so it can be sent again as it was. Enter sends, Shift+Enter starts a new
 * line. Each answer is brought into view as it arrives, its first line at the
 * top, so a long one is read from its start.
 */
export function AssistantPage({ hasKey, messages, pending, problem, now, onAsk, onNewChat, onOpenSettings }: AssistantPageProps) {
  const [draft, setDraft] = useState('')
  const questionId = useId()
  const latest = useRef<HTMLDivElement>(null)
  const shown = useRef(messages.length)

  useEffect(() => {
    if (messages.length > shown.current) latest.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' })
    shown.current = messages.length
  }, [messages.length])

  function send(question: string) {
    if (pending !== null || question.trim() === '') return
    setDraft('')
    void onAsk(question).then((answered) => {
      // Put back what was asked, unless something new was typed meanwhile.
      if (!answered) setDraft((typed) => (typed === '' ? question : typed))
    })
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
    event.preventDefault()
    send(draft)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-1.5">
        <h2 className="text-lg leading-6 text-neutral-900 dark:text-neutral-100">{ASSISTANT_HEADING}</h2>
        <InfoButton label={ASSISTANT_HEADING}>
          {ASSISTANT_INTRO.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </InfoButton>
        {(messages.length > 0 || pending !== null) && (
          <button type="button" onClick={onNewChat} className={`${quiet} ml-auto`}>
            {NEW_CHAT}
          </button>
        )}
      </div>

      {messages.length === 0 && pending === null && hasKey && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{ASSISTANT_EMPTY}</p>
      )}

      {(messages.length > 0 || pending !== null) && (
        <ol aria-label="Conversation" className="flex flex-col gap-3">
          {messages.map((message, index) => (
            <li key={`${message.at}-${String(index)}`}>
              <div ref={index === messages.length - 1 ? latest : undefined} className="scroll-mt-4">
                <Message message={message} now={now} />
              </div>
            </li>
          ))}
          {pending !== null && (
            <>
              <li>
                <Message message={{ role: 'user', text: pending, at: now.toISOString() }} now={now} />
              </li>
              <li aria-live="polite" className={`${card} self-start text-sm text-neutral-500 dark:text-neutral-400`}>
                {ASKING}
              </li>
            </>
          )}
        </ol>
      )}

      {problem !== null && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
          <p>{ASSISTANT_FAILURES[problem.failure]}</p>
          <p className="mt-1 text-xs text-red-700/80 dark:text-red-300/70">{problem.detail}</p>
        </div>
      )}

      {hasKey ? (
        <>
          <form
            className="flex items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              send(draft)
            }}
          >
            <label htmlFor={questionId} className="sr-only">
              {QUESTION_LABEL}
            </label>
            <textarea
              id={questionId}
              name="assistant-question"
              rows={2}
              maxLength={MAX_ASSISTANT_QUESTION_LENGTH}
              value={draft}
              placeholder={QUESTION_PLACEHOLDER}
              onChange={(event) => { setDraft(event.target.value) }}
              onKeyDown={handleKeyDown}
              className={field}
            />
            <button type="submit" disabled={pending !== null} className={primary}>
              {pending === null ? SEND : ASKING}
            </button>
          </form>

          <ul aria-label="Suggestions" className="flex flex-wrap gap-2">
            {ASSISTANT_SUGGESTIONS.map((question) => (
              <li key={question}>
                <button type="button" onClick={() => { send(question) }} className={suggestion}>
                  {question}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className={`${card} flex flex-col gap-3 text-sm text-neutral-700 dark:text-neutral-300`}>
          {NO_KEY.map((line) => (
            <p key={line}>{line}</p>
          ))}
          <button type="button" onClick={onOpenSettings} className={`${primary} self-start`}>
            {OPEN_SETTINGS}
          </button>
        </div>
      )}
    </div>
  )
}

/** One turn: the owner's on the right in blue, the assistant's on the left in a card, each with its time. */
function Message({ message, now }: { message: AssistantMessage; now: Date }) {
  const label = MESSAGE_LABELS[message.role]

  if (message.role === 'user') {
    return (
      <div className="flex flex-col items-end gap-1">
        <p className="max-w-[85%] rounded-2xl rounded-br-md bg-blue-600 px-3.5 py-2 text-sm whitespace-pre-wrap text-white dark:bg-blue-500">
          <span className="sr-only">{label}: </span>
          {message.text}
        </p>
        <span className={time}>{describeMessageTime(message.at, now)}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <div className={`${card} max-w-full text-sm leading-6 whitespace-pre-wrap text-neutral-900 dark:text-neutral-100 ${formattedLists}`}>
        <span className="sr-only">{label}: </span>
        <FormattedText text={message.text} />
      </div>
      <span className={time}>{describeMessageTime(message.at, now)}</span>
    </div>
  )
}
