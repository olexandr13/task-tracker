/**
 * The assistant: a language model, asked on the owner's own key, that answers
 * whatever it is asked — what to do now, how yesterday or the week went, how
 * the habits are doing, or anything else at all — knowing where things stand:
 * the tasks open and done, the habits, the goals, the journal, the time
 * logged and the notes (AI-1).
 *
 * It is a conversation (AI-11): each question is sent with the ones before it
 * and their answers, so "and tomorrow?" means something. What it knows of the
 * owner's data is not one of the messages but part of its instructions, made
 * afresh for every question, so it always reads things as they stand now and
 * a long conversation does not carry a stale copy of them in every turn.
 *
 * What leaves the device is put together here, from plain data, so it is
 * decided in one place and can be read in a test (AI-4). The answer is the
 * model's: this file only says what it is for and how it should write, in
 * the Markdown a description is written in (./descriptionLists, ./emphasis),
 * so the page shows it the way it shows a note.
 */

import { pastCompletions } from './completed'
import { daysBetween, offsetDay, toLocalDay, toLocalTime, type LocalDay } from './day'
import { dueDay, isOverdue } from './due'
import { goalProgress, type Goal } from './goal'
import { habitLastDays, habitRate, habitStats, isHabit, type HabitDayState } from './habit'
import { JOURNAL_SECTIONS, type JournalEntry, type JournalSection } from './journal'
import { type List } from './list'
import { noteFirstLine, sortNotes, type Note } from './note'
import { isComplete, timesPutOff, type Task } from './task'
import { liveTasks } from './trash'
import type { ActivityEntry } from './activity'
import type { HabitRests } from './habitRest'

/** Everything the assistant may read. A part switched off on Settings comes empty (AI-5). */
export interface AssistantData {
  readonly tasks: readonly Task[]
  readonly lists: readonly List[]
  readonly goals: readonly Goal[]
  readonly journal: readonly JournalEntry[]
  readonly activities: readonly ActivityEntry[]
  readonly notes: readonly Note[]
  readonly rests: HabitRests
}

/** Who said it: the owner, or the model. */
export type AssistantRole = 'user' | 'model'

/** One turn of the conversation (AI-11). */
export interface AssistantMessage {
  readonly role: AssistantRole
  /** What was said: the owner's question as typed, the model's answer as Markdown bold, italic and lists. */
  readonly text: string
  /** ISO 8601: when it was asked, or when the answer came back. */
  readonly at: string
}

/** As long as a question can be. */
export const MAX_ASSISTANT_QUESTION_LENGTH = 2000

/** How many turns are kept, and sent with each question: the latest, enough to follow a thread (AI-11). */
export const MAX_ASSISTANT_MESSAGES = 30

/** How far back finished tasks and the time logged are read (AI-4). */
export const ASSISTANT_LOOKBACK_DAYS = 14

/** How many days of each habit are spelled out, day by day. */
export const ASSISTANT_HABIT_DAYS = 7

/** At most this many open tasks are listed, the most pressing first, so the brief stays a brief. */
export const MAX_ASSISTANT_OPEN_TASKS = 120

/** At most this many finished ones. */
export const MAX_ASSISTANT_DONE_TASKS = 100

/** At most this many notes, newest first, each by its first line. */
export const MAX_ASSISTANT_NOTES = 15

/** As much of a task's description as is read. */
const DESCRIPTION_LENGTH = 200

/**
 * What the model is told it is for and how to answer. Kept to the Markdown the
 * page draws — bullets, numbers, bold, italic, no headings or tables — so
 * nothing reaches the screen as markers.
 */
export const ASSISTANT_INSTRUCTIONS = [
  'You are the assistant inside PickMe, a personal task tracker built to beat procrastination.',
  'Answer whatever the owner asks. Their data is below: use it whenever it bears on the question, and answer from general knowledge when it does not. Never invent tasks, numbers or journal lines that are not in the data.',
  'When asked what to do: be specific, name the actual tasks and say why each now. Three to five things, the first small enough to start in the next ten minutes. Mind what is overdue, due today, urgent or put off many times, habits whose streak is at stake, and goals that have stalled. If something looks too big, suggest the first step; if the day looks overloaded, say what can wait.',
  'When asked to analyze a day or a week: say what got done, where the time went, how the habits held, what the journal says, and what was put off or missed; then one or two concrete things to do differently. Use the dates in the data to find the period.',
  'When asked to plan: lay out the day in order, the hardest thing early, with what is due first.',
  'Be warm and direct, never preachy. Keep answers short — about 200 words — unless the question needs more or asks for it.',
  'Write plain text. You may use "- " bullets, "1. " numbered lists, **bold** and *italic*. Do not use headings, tables, code or links.',
  'Answer in the language of the owner\'s last message. If it is one of the app\'s short English suggestions ("Analyze yesterday", "What should I do now?") and their tasks and journal are written in another language, answer in that language.',
].join('\n')

/** A question as it is sent: trimmed, and no longer than allowed. */
export function normalizeAssistantQuestion(question: string): string {
  return question.trim().slice(0, MAX_ASSISTANT_QUESTION_LENGTH)
}

/**
 * What the model is told for one question (AI-4): what it is for, then where
 * things stand at `now`. Made afresh for every question, so a conversation
 * left open overnight reads the new day.
 */
export function assistantInstructions(data: AssistantData, now: Date = new Date()): string {
  return [ASSISTANT_INSTRUCTIONS, '', "The owner's data:", '', assistantBrief(data, now)].join('\n')
}

/** The conversation with `question` asked at `now` added to it, the oldest turns let go of past the most kept. */
export function askAssistant(messages: readonly AssistantMessage[], question: string, now: Date = new Date()): AssistantMessage[] {
  return keepLatest([...messages, { role: 'user', text: normalizeAssistantQuestion(question), at: now.toISOString() }])
}

/** The conversation with the model's answer, tidied (AI-6), added to it. */
export function answerAssistant(messages: readonly AssistantMessage[], answer: string, now: Date = new Date()): AssistantMessage[] {
  return keepLatest([...messages, { role: 'model', text: tidyAssistantAnswer(answer), at: now.toISOString() }])
}

/** The latest turns, starting on a question: a model has to be asked before it answers. */
function keepLatest(messages: readonly AssistantMessage[]): AssistantMessage[] {
  const latest = messages.slice(-MAX_ASSISTANT_MESSAGES)
  const first = latest.findIndex((message) => message.role === 'user')
  return first === -1 ? [] : latest.slice(first)
}

/** Where things stand at `now`, a section a part, each left out when it has nothing in it. */
export function assistantBrief(data: AssistantData, now: Date = new Date()): string {
  const today = toLocalDay(now)
  const live = liveTasks(data.tasks)
  const sections = [
    `Now: ${weekday(today)} ${today}, ${toLocalTime(now)}.`,
    section('Open tasks', openTaskLines(live, data, now)),
    section('Habits', habitLines(live, data.rests, now)),
    section('Goals', goalLines(live, data.goals, now)),
    section(`Finished in the last ${String(ASSISTANT_LOOKBACK_DAYS)} days`, doneLines(live, now)),
    section('Journal', journalLines(data.journal)),
    section(`Time logged in the last ${String(ASSISTANT_LOOKBACK_DAYS)} days, by day`, activityLines(data.activities, today)),
    section('Notes', noteLines(data.notes)),
  ]
  return sections.filter((part) => part !== '').join('\n\n')
}

function section(title: string, lines: readonly string[]): string {
  return lines.length === 0 ? '' : [`${title}:`, ...lines].join('\n')
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const

function weekday(day: LocalDay): string {
  // Noon UTC is the same date everywhere, so the weekday is the day's own.
  return WEEKDAYS[new Date(`${day}T12:00:00Z`).getUTCDay()]
}

/** One line, its spaces squeezed, cut to `length` with an ellipsis. */
function oneLine(text: string, length: number): string {
  const line = text.trim().replace(/\s+/gu, ' ')
  return line.length > length ? `${line.slice(0, length - 1)}…` : line
}

/**
 * How pressing an open task is, smallest first: overdue, then urgent, then due
 * soonest, then the ones with no day, oldest first.
 */
function pressing(task: Task, now: Date): readonly [number, number, string] {
  const due = dueDay(task, now)
  const rank = isOverdue(task, now) ? 0 : task.urgent ? 1 : due !== null ? 2 : 3
  return [rank, due === null ? Number.MAX_SAFE_INTEGER : daysBetween(toLocalDay(now), due), task.createdAt]
}

function byPressing(now: Date) {
  return (a: Task, b: Task): number => {
    const [rankA, dueA, createdA] = pressing(a, now)
    const [rankB, dueB, createdB] = pressing(b, now)
    return rankA - rankB || dueA - dueB || createdA.localeCompare(createdB)
  }
}

function openTaskLines(live: readonly Task[], data: AssistantData, now: Date): string[] {
  const open = live.filter((task) => !isHabit(task) && !isComplete(task, now)).sort(byPressing(now))
  const lines = open.slice(0, MAX_ASSISTANT_OPEN_TASKS).map((task) => `- ${describeOpenTask(task, data, now)}`)
  const more = open.length - MAX_ASSISTANT_OPEN_TASKS
  return more > 0 ? [...lines, `- …and ${String(more)} more`] : lines
}

function describeOpenTask(task: Task, data: AssistantData, now: Date): string {
  const facts: string[] = []
  const due = dueDay(task, now)
  if (isOverdue(task, now)) facts.push('OVERDUE')
  if (task.urgent) facts.push('urgent')
  if (due !== null) facts.push(task.dueTime === null ? `due ${due}` : `due ${due} ${task.dueTime}`)
  if (task.repeat !== null) facts.push(`repeats ${task.repeat.kind}`)
  const putOff = timesPutOff(task)
  if (putOff > 0) facts.push(`put off ${String(putOff)}×`)
  const list = data.lists.find((candidate) => candidate.id === task.listId)
  if (list !== undefined) facts.push(`list: ${list.name}`)
  const goal = data.goals.find((candidate) => candidate.id === task.goalId)
  if (goal !== undefined) facts.push(`goal: ${goal.name}`)
  if (task.tags.length > 0) facts.push(`tags: ${task.tags.join(', ')}`)
  const steps = task.subtasks.filter((subtask) => subtask.completedAt === null)
  if (steps.length > 0) facts.push(`open steps: ${steps.map((subtask) => subtask.title).join('; ')}`)
  if (task.timeGoal !== null) facts.push(`time goal ${String(task.timeGoal)} min`)

  const description = task.description.trim() === '' ? '' : ` — ${oneLine(task.description, DESCRIPTION_LENGTH)}`
  return `${task.title}${facts.length === 0 ? '' : ` (${facts.join('; ')})`}${description}`
}

const HABIT_DAY_MARKS: Readonly<Record<HabitDayState, string>> = {
  done: 'done',
  skipped: 'skipped',
  missed: 'missed',
  pending: 'not yet',
  untracked: '-',
  future: '-',
}

function habitLines(live: readonly Task[], rests: HabitRests, now: Date): string[] {
  return live.filter(isHabit).map((habit) => {
    const { currentStreak, bestStreak } = habitStats(habit, now, rests)
    const rate = habitRate(habit, 30, now, rests)
    const days = habitLastDays(habit, ASSISTANT_HABIT_DAYS, now, rests)
      .map(({ day, state }) => `${day.slice(5)} ${HABIT_DAY_MARKS[state]}`)
      .join(', ')
    return `- ${habit.title} (streak ${String(currentStreak)}, best ${String(bestStreak)}; ${String(rate.percent)}% of the last 30 days; last ${String(ASSISTANT_HABIT_DAYS)} days: ${days})`
  })
}

function goalLines(live: readonly Task[], goals: readonly Goal[], now: Date): string[] {
  return goals.map((goal) => {
    const { done, total } = goalProgress(goal.id, live, now)
    return `- ${goal.name}: ${String(done)} of ${String(total)} tasks done`
  })
}

/**
 * What was finished since the lookback began, latest first, at the hour it was
 * ticked off where that is known: each task once, a repeat on each day it was
 * done.
 */
function doneLines(live: readonly Task[], now: Date): string[] {
  const since = offsetDay(toLocalDay(now), -ASSISTANT_LOOKBACK_DAYS)
  const done: { day: LocalDay; time: string; title: string }[] = []

  for (const task of live) {
    if (isComplete(task, now) && task.completedAt !== null) {
      const at = new Date(task.completedAt)
      done.push({ day: toLocalDay(at), time: toLocalTime(at), title: task.title })
    }
    for (const past of pastCompletions(task, now)) done.push({ day: past.day, time: '', title: task.title })
  }

  return done
    .filter((entry) => entry.day >= since)
    .sort((a, b) => `${b.day} ${b.time}`.localeCompare(`${a.day} ${a.time}`))
    .slice(0, MAX_ASSISTANT_DONE_TASKS)
    .map((entry) => `- ${entry.day}${entry.time === '' ? '' : ` ${entry.time}`}: ${entry.title}`)
}

const JOURNAL_NAMES: Readonly<Record<JournalSection, string>> = {
  insights: 'insight',
  good: 'good thing',
  achievements: 'achievement',
  gratitude: 'grateful for',
  improve: 'to change/improve',
}

/** The journal the app still keeps (JRN-8), a day at a time, latest first. */
function journalLines(entries: readonly JournalEntry[]): string[] {
  return [...entries]
    .sort(
      (a, b) =>
        b.day.localeCompare(a.day) ||
        JOURNAL_SECTIONS.indexOf(a.section) - JOURNAL_SECTIONS.indexOf(b.section) ||
        a.writtenAt.localeCompare(b.writtenAt),
    )
    .map((entry) => `- ${entry.day} ${JOURNAL_NAMES[entry.section]}: ${entry.text}`)
}

/** The time logged since the lookback began, a day at a time, latest first, each activity's total, the most first. */
function activityLines(activities: readonly ActivityEntry[], today: LocalDay): string[] {
  const since = offsetDay(today, -ASSISTANT_LOOKBACK_DAYS)
  const days = new Map<LocalDay, Map<string, { name: string; seconds: number }>>()
  for (const entry of activities) {
    if (entry.day < since) continue
    const totals = days.get(entry.day) ?? new Map<string, { name: string; seconds: number }>()
    const key = entry.activity.toLowerCase()
    const total = totals.get(key) ?? { name: entry.activity, seconds: 0 }
    totals.set(key, { ...total, seconds: total.seconds + entry.seconds })
    days.set(entry.day, totals)
  }

  return [...days.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([day, totals]) => {
      const spent = [...totals.values()]
        .sort((a, b) => b.seconds - a.seconds)
        .map(({ name, seconds }) => `${name} ${hoursAndMinutes(seconds)}`)
        .join(', ')
      return `- ${day}: ${spent}`
    })
}

function hoursAndMinutes(seconds: number): string {
  const minutes = Math.round(seconds / 60)
  const hours = Math.floor(minutes / 60)
  return hours === 0 ? `${String(minutes)} min` : `${String(hours)} h ${String(minutes % 60)} min`
}

function noteLines(notes: readonly Note[]): string[] {
  return sortNotes(notes)
    .slice(0, MAX_ASSISTANT_NOTES)
    .map((note) => `- ${oneLine(noteFirstLine(note.text), DESCRIPTION_LENGTH)}`)
}

/**
 * An answer put into the Markdown the page draws (AI-6), whatever the model
 * slipped into despite being asked not to: `* ` and `• ` bullets become `- `,
 * a heading becomes a bold line, and runs of blank lines close up to one.
 */
export function tidyAssistantAnswer(text: string): string {
  return text
    .replace(/\r\n?/gu, '\n')
    .split('\n')
    .map((line) => {
      const bullet = /^\s*[*•]\s+(.*)$/u.exec(line)
      if (bullet !== null) return `- ${bullet[1]}`
      const heading = /^\s*#{1,6}\s+(.*?)\s*#*\s*$/u.exec(line)
      if (heading !== null) return heading[1].startsWith('**') ? heading[1] : `**${heading[1]}**`
      return line.replace(/\s+$/u, '')
    })
    .join('\n')
    .replace(/\n{3,}/gu, '\n\n')
    .trim()
}
