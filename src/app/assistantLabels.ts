import type { AssistantFailure } from '../storage/assistantSource'

/**
 * How the assistant reads (AI-1). What it is asked lives in ../core/assistant;
 * wording is presentation, so it stays here.
 */

export const ASSISTANT_HEADING = 'Assistant'

/** What the page is for and how it is used, in plain sentences, one thing each (UI-73). */
export const ASSISTANT_INTRO = [
  'Ask the assistant anything. It knows your open and finished tasks, habits, goals, journal, logged time and notes, and answers other questions too.',
  'Press one of the suggestions under the box to ask it straight away, or type your own question and press Enter.',
  'It remembers the conversation, so you can ask a follow-up such as "Why that one first?". Press "New chat" to start over.',
  'It is asked through Google Gemini, with your own API key. Your data and the conversation are sent to Google each time you ask, and nowhere else.',
  'Parts of the app you have switched off in Settings are not sent.',
  'The conversation stays on this device until you start a new one.',
] as const

/** What the page says before anything is asked. */
export const ASSISTANT_EMPTY = 'Ask anything: about your tasks, habits and journal, or anything else.'

export const QUESTION_LABEL = 'Your question'
export const QUESTION_PLACEHOLDER = 'Ask anything…'
export const SEND = 'Send'
export const ASKING = 'Thinking…'
export const NEW_CHAT = 'New chat'

/**
 * The questions offered under the box (AI-10), each asked as it reads when
 * pressed: the ones the app is most often opened for.
 */
export const ASSISTANT_SUGGESTIONS = [
  'What should I do now?',
  'Plan my day',
  'Analyze yesterday',
  'Analyze this week',
  'Plan tomorrow',
  'How are my habits going?',
  'What am I putting off?',
  'Review my goals',
] as const

/** How each side of the conversation is named to a screen reader. */
export const MESSAGE_LABELS = { user: 'You', model: 'Assistant' } as const

/** Shown instead of the box until the device has a key (AI-3). */
export const NO_KEY = [
  'The assistant needs a Gemini API key on this device.',
  'Open Settings, find "Assistant" under Features, press the arrow in front of it, and paste your key there.',
] as const
export const OPEN_SETTINGS = 'Open Settings'

/** Why no answer came (AI-8), in a sentence that says what to do about it. */
export const ASSISTANT_FAILURES: Readonly<Record<AssistantFailure, string>> = {
  key: 'Gemini did not accept the API key. Check it in Settings, under "Assistant".',
  busy: 'Gemini is busy or your free quota is used up. Try again in a minute.',
  slow: 'Gemini took too long to answer. Try again in a minute.',
  offline: 'Gemini could not be reached. Check your connection and try again.',
  refused: 'Gemini gave no answer to that. Try asking differently.',
  other: 'Something went wrong asking Gemini.',
}

/** When a turn was said: `14:05` today, `Oct 30, 09:12` on another day. */
export function describeMessageTime(at: string, now: Date): string {
  const moment = new Date(at)
  const time = moment.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  return moment.toDateString() === now.toDateString()
    ? time
    : `${moment.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${time}`
}

/** The settings under Assistant's switch (FEAT-10). */
export const KEY_LABEL = 'Gemini API key'
export const KEY_DESCRIPTION =
  'Kept on this device only: it is not synced to your other devices and not in the backup. Get a free key at aistudio.google.com.'
export const SAVE_KEY = 'Save key'
export const REMOVE_KEY = 'Remove key'

/** A saved key, shown by its last four characters only. */
export function describeSavedKey(apiKey: string): string {
  return `Key saved on this device, ending in ${apiKey.slice(-4)}`
}
