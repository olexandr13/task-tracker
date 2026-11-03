import { describe, expect, it } from 'vitest'
import {
  answerAssistant,
  askAssistant,
  assistantBrief,
  assistantInstructions,
  ASSISTANT_INSTRUCTIONS,
  MAX_ASSISTANT_MESSAGES,
  MAX_ASSISTANT_OPEN_TASKS,
  MAX_ASSISTANT_QUESTION_LENGTH,
  normalizeAssistantQuestion,
  tidyAssistantAnswer,
  type AssistantData,
  type AssistantMessage,
} from './assistant'
import { completeTask, createTask, deleteTask, setDueDate, type Task } from './task'
import { createGoal, linkToGoal } from './goal'
import { createList, moveToList } from './list'
import type { JournalEntry } from './journal'
import type { ActivityEntry } from './activity'
import { createNote } from './note'

/* AI ids refer to wiki/assistant.md. */

// Tuesday 3 November 2026, ten in the morning.
const NOW = new Date(2026, 10, 3, 10, 0)
const EARLIER = new Date(2026, 9, 20, 9, 0)

const NOTHING: AssistantData = { tasks: [], lists: [], goals: [], journal: [], activities: [], notes: [], rests: null }

function brief(data: Partial<AssistantData>): string {
  return assistantBrief({ ...NOTHING, ...data }, NOW)
}

function journalLine(overrides: Partial<JournalEntry>): JournalEntry {
  return { id: 'j', day: '2026-11-02', section: 'good', text: 'Long walk', writtenAt: '2026-11-02T18:00:00.000Z', ...overrides }
}

function activity(overrides: Partial<ActivityEntry>): ActivityEntry {
  return {
    id: 'a',
    activity: 'Reading',
    seconds: 1800,
    day: '2026-11-02',
    hour: 20,
    startSecond: null,
    session: null,
    loggedAt: '2026-11-02T20:30:00.000Z',
    ...overrides,
  }
}

describe('what the assistant is told (AI-4)', () => {
  it('starts with the day and the hour it is asked at', () => {
    expect(brief({})).toBe('Now: Tuesday 2026-11-03, 10:00.')
  })

  it('lists the open tasks, the most pressing first, with what makes them so', () => {
    const late = setDueDate(createTask('File taxes', null, EARLIER), '2026-11-01', EARLIER)
    const urgent = { ...createTask('Call the bank', null, EARLIER), urgent: true }
    const someday = createTask('Learn Spanish', null, EARLIER)
    const tomorrow = setDueDate(createTask('Buy flowers', null, EARLIER), '2026-11-04', EARLIER)

    const lines = brief({ tasks: [someday, tomorrow, urgent, late] }).split('\n')

    expect(lines.slice(2, 7)).toEqual([
      'Open tasks:',
      '- File taxes (OVERDUE; due 2026-11-01)',
      '- Call the bank (urgent)',
      '- Buy flowers (due 2026-11-04)',
      '- Learn Spanish',
    ])
  })

  it('names a task’s list, goal, tags, open steps and description', () => {
    const work = createList('Work', EARLIER)
    const launch = createGoal('Launch', EARLIER)
    const task: Task = {
      ...linkToGoal(moveToList(createTask('Write the spec', null, EARLIER), work.id), launch.id),
      tags: ['deep'],
      description: 'The  part\nabout billing',
      subtasks: [
        { id: 's1', title: 'Outline', createdAt: EARLIER.toISOString(), completedAt: EARLIER.toISOString() },
        { id: 's2', title: 'Draft', createdAt: EARLIER.toISOString(), completedAt: null },
      ],
    }

    expect(brief({ tasks: [task], lists: [work], goals: [launch] })).toContain(
      '- Write the spec (list: Work; goal: Launch; tags: deep; open steps: Draft) — The part about billing',
    )
  })

  it('reads no task in the trash', () => {
    const trashed = deleteTask(createTask('Gone', null, EARLIER), EARLIER)
    expect(brief({ tasks: [trashed] })).not.toContain('Gone')
  })

  it('lists at most so many open tasks, and says how many more there are', () => {
    const tasks = Array.from({ length: MAX_ASSISTANT_OPEN_TASKS + 3 }, (_, at) => createTask(`Task ${String(at)}`, null, EARLIER))
    expect(brief({ tasks })).toContain('- …and 3 more')
  })

  it('lists the habits with their streaks and their last week day by day, apart from the tasks', () => {
    const walk = completeTask(createTask('Walk', { kind: 'daily' }, new Date(2026, 9, 31, 9, 0)), NOW)
    const text = brief({ tasks: [walk] })

    expect(text).toContain('Habits:\n- Walk (streak 1, best 1;')
    expect(text).toContain('last 7 days: 10-28 -, 10-29 -, 10-30 -, 10-31 missed, 11-01 missed, 11-02 missed, 11-03 done)')
    expect(text).not.toContain('Open tasks')
  })

  it('lists what was finished in the last two weeks, latest first, at the hour it was ticked off', () => {
    const old = completeTask(createTask('Old thing', null, EARLIER), new Date(2026, 9, 1, 9, 0))
    const morning = completeTask(createTask('Paid rent', null, EARLIER), new Date(2026, 10, 2, 9, 5))
    const done = completeTask(createTask('Sent the invoice', null, EARLIER), new Date(2026, 10, 2, 15, 0))

    const text = brief({ tasks: [old, morning, done] })

    expect(text).toContain('Finished in the last 14 days:\n- 2026-11-02 15:00: Sent the invoice\n- 2026-11-02 09:05: Paid rent')
    expect(text).not.toContain('Old thing')
  })

  it('lists the goals with how far each has got', () => {
    const launch = createGoal('Launch', EARLIER)
    const tasks = [
      linkToGoal(completeTask(createTask('A', null, EARLIER), EARLIER), launch.id),
      linkToGoal(createTask('B', null, EARLIER), launch.id),
    ]
    expect(brief({ tasks, goals: [launch] })).toContain('Goals:\n- Launch: 1 of 2 tasks done')
  })

  it('reads the journal, latest day first, a section at a time', () => {
    const text = brief({
      journal: [
        journalLine({ id: '1', day: '2026-11-01', text: 'Sunny' }),
        journalLine({ id: '2', section: 'improve', text: 'Sleep earlier' }),
        journalLine({ id: '3', section: 'insights', text: 'Mornings work best' }),
      ],
    })

    expect(text).toContain(
      'Journal:\n- 2026-11-02 insight: Mornings work best\n- 2026-11-02 to change/improve: Sleep earlier\n- 2026-11-01 good thing: Sunny',
    )
  })

  it('adds up the time logged on each activity a day at a time, latest day first, the most first', () => {
    const text = brief({
      activities: [
        activity({ id: '1', activity: 'Reading', seconds: 1800 }),
        activity({ id: '2', activity: 'reading', seconds: 3600 }),
        activity({ id: '3', activity: 'Gym', seconds: 600 }),
        activity({ id: '4', activity: 'Gym', seconds: 1200, day: '2026-11-03', hour: 8 }),
        activity({ id: '5', activity: 'Long ago', day: '2026-10-01' }),
      ],
    })

    expect(text).toContain(
      'Time logged in the last 14 days, by day:\n- 2026-11-03: Gym 20 min\n- 2026-11-02: Reading 1 h 30 min, Gym 10 min',
    )
    expect(text).not.toContain('Long ago')
  })

  it('reads each note by its first line', () => {
    const note = createNote('**Films**\n- Dune', EARLIER)
    expect(brief({ notes: [note] })).toContain('Notes:\n- Films')
  })

  it('cuts a question to its longest', () => {
    expect(normalizeAssistantQuestion('x'.repeat(MAX_ASSISTANT_QUESTION_LENGTH + 10))).toHaveLength(MAX_ASSISTANT_QUESTION_LENGTH)
  })

  it('tells the model what it is for, then the data as it stands (AI-1)', () => {
    const text = assistantInstructions(NOTHING, NOW)
    expect(text.startsWith(ASSISTANT_INSTRUCTIONS)).toBe(true)
    expect(text).toContain("The owner's data:\n\nNow: Tuesday 2026-11-03, 10:00.")
    expect(ASSISTANT_INSTRUCTIONS).toContain('Answer whatever the owner asks')
    expect(ASSISTANT_INSTRUCTIONS).toContain('Do not use headings')
  })
})

describe('the conversation (AI-11)', () => {
  it('adds the question, then the answer tidied, each at its moment', () => {
    const asked = askAssistant([], '  Analyze yesterday ', NOW)
    const answered = answerAssistant(asked, '## Yesterday\n* Walked', new Date(2026, 10, 3, 10, 1))

    expect(answered).toEqual([
      { role: 'user', text: 'Analyze yesterday', at: NOW.toISOString() },
      { role: 'model', text: '**Yesterday**\n- Walked', at: new Date(2026, 10, 3, 10, 1).toISOString() },
    ])
  })

  it('keeps the latest turns only, starting on a question', () => {
    let messages: AssistantMessage[] = []
    for (let turn = 0; turn < MAX_ASSISTANT_MESSAGES; turn += 1) {
      messages = answerAssistant(askAssistant(messages, `Q${String(turn)}`, NOW), `A${String(turn)}`, NOW)
    }

    expect(messages.length).toBeLessThanOrEqual(MAX_ASSISTANT_MESSAGES)
    expect(messages[0]?.role).toBe('user')
    expect(messages.at(-1)?.text).toBe(`A${String(MAX_ASSISTANT_MESSAGES - 1)}`)
  })
})

describe('the answer as the page draws it (AI-6)', () => {
  it('turns other bullets into the ones a note is written with', () => {
    expect(tidyAssistantAnswer('* One\n  * Two\n• Three')).toBe('- One\n- Two\n- Three')
  })

  it('turns a heading into a bold line', () => {
    expect(tidyAssistantAnswer('## Next up\n- Walk')).toBe('**Next up**\n- Walk')
    expect(tidyAssistantAnswer('# **Today**')).toBe('**Today**')
  })

  it('leaves bold, italic and numbers as they are, and closes up blank lines', () => {
    expect(tidyAssistantAnswer('**Start** with *one*\n\n\n\n1. Walk\r\n2. Read  ')).toBe('**Start** with *one*\n\n1. Walk\n2. Read')
  })
})
