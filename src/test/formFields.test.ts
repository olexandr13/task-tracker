import { describe, expect, it } from 'vitest'
import { describeUnnamedFormFields, unnamedFormFields } from './formFields'

/*
 * Every form field in the app carries a name for the browser (UI-69 in
 * wiki/interface.md). The check reads the components' source rather than
 * rendering them, so it needs no props and misses no box, however deep in a
 * panel it opens — the same way the browser's own Issues panel would find it.
 */

/** Every component's source: the app's screens, and the components under them. Tests are not components. */
const components = import.meta.glob<string>(['../app/**/*.tsx', '!../app/**/*.test.tsx'], {
  query: '?raw',
  import: 'default',
  eager: true,
})

describe('unnamedFormFields', () => {
  it('finds an input, a select and a textarea with neither a name nor an id', () => {
    const source = [
      'export function Boxes() {',
      '  return (',
      '    <div>',
      '      <input type="text" value="" onChange={() => {}} />',
      '      <select value="1" onChange={(event) => { console.log(event.target.value) }}>',
      '        <option value="1">1</option>',
      '      </select>',
      '      <textarea />',
      '    </div>',
      '  )',
      '}',
    ].join('\n')

    expect(unnamedFormFields('Boxes.tsx', source)).toEqual([
      { file: 'Boxes.tsx', line: 4, tag: 'input' },
      { file: 'Boxes.tsx', line: 5, tag: 'select' },
      { file: 'Boxes.tsx', line: 8, tag: 'textarea' },
    ])
  })

  it('passes a field named either way, and one whose props are spread on it', () => {
    const source = [
      'export function Boxes(props: object) {',
      '  return (',
      '    <>',
      '      <input name="task-title" />',
      '      <select id={useId()}><option>1</option></select>',
      '      <textarea {...props} />',
      '    </>',
      '  )',
      '}',
    ].join('\n')

    expect(unnamedFormFields('Boxes.tsx', source)).toEqual([])
  })

  it('leaves everything that is not a form field alone, a component called Input included', () => {
    const source = [
      'export function Row() {',
      '  return (',
      '    <label>',
      '      <Input />',
      '      <button type="button">Add</button>',
      '    </label>',
      '  )',
      '}',
    ].join('\n')

    expect(unnamedFormFields('Row.tsx', source)).toEqual([])
  })

  it('is not thrown off by a handler between the tag and its name', () => {
    const source = [
      '<input',
      '  type="text"',
      '  onKeyDown={(event) => {',
      '    if (event.key === "Enter") { event.preventDefault() }',
      '  }}',
      '  // name="commented-out"',
      '  aria-label="Points"',
      '/>',
    ].join('\n')

    expect(unnamedFormFields('Box.tsx', source)).toEqual([{ file: 'Box.tsx', line: 1, tag: 'input' }])
  })

  it('reads as file, line and tag', () => {
    expect(describeUnnamedFormFields([{ file: 'src/app/components/Box.tsx', line: 12, tag: 'input' }])).toEqual([
      'src/app/components/Box.tsx:12 <input>',
    ])
  })
})

describe("the app's form fields", () => {
  it('are all looked at: the components are found, and some of them have fields', () => {
    const files = Object.keys(components)

    expect(files.length).toBeGreaterThan(10)
    expect(files.some((file) => file.endsWith('/AddTaskForm.tsx'))).toBe(true)
    expect(files.some((file) => /\.test\.tsx$/.test(file))).toBe(false)
    expect(files.some((file) => components[file]?.includes('<input'))).toBe(true)
  })

  it('every one carries a name or an id, so the browser can tell them apart (UI-69)', () => {
    const unnamed = Object.entries(components).flatMap(([file, source]) => unnamedFormFields(file, source))

    expect(describeUnnamedFormFields(unnamed)).toEqual([])
  })
})
