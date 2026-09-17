import { describe, expect, it } from 'vitest'
import {
  addTag,
  deleteTag,
  hasTag,
  InvalidTagError,
  isTagName,
  matchTags,
  normalizeTag,
  removeTag,
  summarizeTags,
  suggestTags,
  tagsInUse,
  typedTag,
} from './tag'
import { completeTask, createTask, deleteTask } from './task'

/* The rules of tags. TAG ids refer to wiki/tags.md. */

const NOW = new Date('2026-09-15T10:00:00.000Z')

function tagged(...tags: string[]) {
  return tags.reduce((task, tag) => addTag(task, tag), createTask('pack', null, NOW))
}

describe('tag names', () => {
  it('are one word, holding none of \\ / " # : * ? < > | or commas (TAG-3)', () => {
    expect(isTagName('work')).toBe(true)
    expect(isTagName('дім')).toBe(true)
    expect(isTagName('q3-plan_2')).toBe(true)

    for (const name of ['', 'two words', 'a/b', 'a\\b', 'a"b', 'a#b', 'a:b', 'a*b', 'a?b', 'a<b', 'a>b', 'a|b', 'a,b']) {
      expect(isTagName(name)).toBe(false)
    }
  })

  it('are trimmed and lose the # they are typed with (TAG-3)', () => {
    expect(normalizeTag('  #work ')).toBe('work')
    expect(() => normalizeTag('#')).toThrow(InvalidTagError)
    expect(() => normalizeTag('two words')).toThrow(InvalidTagError)
  })
})

describe('addTag', () => {
  it('puts tags on a task in the order they were given, each once (TAG-1)', () => {
    const task = tagged('work', 'home', 'work')

    expect(task.tags).toEqual(['work', 'home'])
  })

  it('treats a tag in another case as the same tag (TAG-4)', () => {
    const task = tagged('work')

    expect(addTag(task, 'WORK')).toBe(task)
    expect(hasTag(task, 'Work')).toBe(true)
  })

  it('spells a known tag the way it is already spelled (TAG-4)', () => {
    expect(addTag(createTask('pack', null, NOW), 'work', ['Work']).tags).toEqual(['Work'])
  })

  it('changes nothing else about the task (TAG-5)', () => {
    const task = createTask('pack', null, NOW)

    expect(addTag(task, 'work')).toEqual({ ...task, tags: ['work'] })
    expect(task.tags).toEqual([])
  })

  it('refuses a name no tag can have', () => {
    expect(() => addTag(createTask('pack', null, NOW), 'two words')).toThrow(InvalidTagError)
  })
})

describe('removeTag', () => {
  it('takes a tag off whatever case it is named in, leaving the rest (TAG-2)', () => {
    expect(removeTag(tagged('work', 'home'), 'WORK').tags).toEqual(['home'])
  })

  it('leaves a task without the tag as it is', () => {
    const task = tagged('home')

    expect(removeTag(task, 'work')).toBe(task)
  })
})

describe('deleteTag', () => {
  it('takes the tag off every task carrying it, in any case and in the trash, keeping the tasks (TAG-22)', () => {
    const trashed = deleteTask(tagged('work'), NOW)
    const kept = deleteTag([tagged('Work', 'home'), trashed, tagged('home')], 'work')

    expect(kept.map((task) => task.tags)).toEqual([['home'], [], ['home']])
    expect(kept[1].deletedAt).toBe(trashed.deletedAt)
  })

  it('leaves a task without the tag as the very same task, so only the tagged ones are saved', () => {
    const untagged = tagged('home')

    expect(deleteTag([untagged], 'work')[0]).toBe(untagged)
  })
})

describe('tagsInUse', () => {
  it('is every tag the tasks carry, once each, alphabetically (TAG-6)', () => {
    expect(tagsInUse([tagged('work', 'home'), tagged('errands', 'work'), tagged()])).toEqual([
      'errands',
      'home',
      'work',
    ])
  })

  it('counts a tag written two ways as one', () => {
    expect(tagsInUse([tagged('Work'), tagged('work')])).toHaveLength(1)
  })
})

describe('summarizeTags', () => {
  it('counts the tasks still to do under each tag, in any case (TAG-19)', () => {
    const done = completeTask(tagged('work'), NOW)

    expect(summarizeTags([tagged('Work', 'home'), tagged('work'), done], NOW)).toEqual([
      { name: 'home', open: 1 },
      { name: 'work', open: 2 },
    ])
  })

  it('keeps a tag whose tasks are all done, with nothing open', () => {
    expect(summarizeTags([completeTask(tagged('work'), NOW)], NOW)).toEqual([{ name: 'work', open: 0 }])
  })
})

describe('matchTags', () => {
  const tags = ['errands', 'homework', 'work', 'workout']

  it('puts the tag of that name first, then those starting with it, then the rest (TAG-10)', () => {
    expect(matchTags(tags, 'work')).toEqual(['work', 'workout', 'homework'])
  })

  it('ignores case, and matches every tag when nothing is typed', () => {
    expect(matchTags(tags, 'WO')).toEqual(['work', 'workout', 'homework'])
    expect(matchTags(tags, '')).toEqual(tags)
  })
})

describe('suggestTags', () => {
  it('leaves out the tags the task already carries (TAG-10)', () => {
    expect(suggestTags(['home', 'work'], '', ['work'])).toEqual([{ name: 'home', isNew: false }])
  })

  it('offers a new tag for a name no tag has yet, after the matches (TAG-11)', () => {
    expect(suggestTags(['workout'], 'work', [])).toEqual([
      { name: 'workout', isNew: false },
      { name: 'work', isNew: true },
    ])
  })

  it('offers no new tag for a known name, in any case, or for nothing typed', () => {
    expect(suggestTags(['work'], 'WORK', [])).toEqual([{ name: 'work', isNew: false }])
    expect(suggestTags([], 'work', ['Work'])).toEqual([])
    expect(suggestTags([], '', [])).toEqual([])
  })
})

describe('typedTag', () => {
  it('is the name typed after a # starting a word (TAG-8)', () => {
    expect(typedTag('#')).toBe('')
    expect(typedTag('call mom #fam')).toBe('fam')
    expect(typedTag('first line\n#wo')).toBe('wo')
  })

  it('is nothing once the word has ended, or for a # inside a word', () => {
    expect(typedTag('call mom #fam ')).toBeNull()
    expect(typedTag('#home, #')).toBe('')
    expect(typedTag('#home,')).toBeNull()
    expect(typedTag('learn C#')).toBeNull()
    expect(typedTag('no tag here')).toBeNull()
  })
})
