import type { Feature } from '../core'

/**
 * How the switches on Settings read (FEAT-1). The rules live in ../core/feature;
 * wording is presentation, so it stays here.
 *
 * Each switch says what it shows in a plain sentence, as a mode's page says what
 * it does (MODE-5): someone deciding whether to turn a part of the app off has
 * to know what it is first.
 */
export const FEATURE_LABELS: Readonly<Record<Feature, { readonly name: string; readonly description: string }>> = {
  habits: { name: 'Habits', description: 'The Habits page, where daily tasks are kept as habits with streaks.' },
  rewards: { name: 'Rewards', description: 'Points for finished tasks, and prizes and a wishlist to spend them on.' },
  cases: { name: 'Cases', description: 'A case for every cleared day, and another that arrives once a day.' },
  lists: { name: 'Lists', description: 'The Lists page and the Inbox, and putting a task in a list.' },
  tags: { name: 'Tags', description: 'The Tags page, and tags on tasks.' },
  balance: { name: 'Balance', description: 'How the time you log splits between your categories.' },
  activity: { name: 'Activity log', description: 'Your day hour by hour: what you did and for how long.' },
  modes: { name: 'Modes', description: 'Procrastination, Warm-up, Nudge and Check-in.' },
  progress: { name: 'Progress bars', description: 'How today, this week and this month are going, beside your tasks.' },
  quote: { name: 'Daily quote', description: 'A new quote every day, beside your tasks.' },
  reminders: { name: 'Reminders', description: 'A notice when the hour a task is due at comes round.' },
}

/** What the card is for, in the sheet its **i** opens (UI-73): one thing a sentence. */
export const FEATURES_HINT = [
  'Turn off the parts of the app you don’t use. They disappear everywhere.',
  'Nothing is deleted: turn a part back on and it is as you left it.',
  'The switches are the same on every device.',
] as const
