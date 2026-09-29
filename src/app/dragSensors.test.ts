// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { NestedMouseSensor, NestedTouchSensor, RowMouseSensor, RowTouchSensor } from './dragSensors'

/*
 * Which presses pick a row up, and which belong to something inside it. TASK-38
 * and CHK-28 refer to wiki/tasks.md and wiki/checklists.md.
 */

afterEach(() => {
  document.body.innerHTML = ''
})

/** A row holding a control, a text box, and a checklist with a control of its own. */
function row() {
  document.body.innerHTML = `
    <li id="row">
      <button id="control"></button>
      <input id="box" />
      <div data-nested-drag>
        <ul><li><button id="item"></button></li></ul>
      </div>
    </li>
  `

  return (id: string) => {
    const target = document.getElementById(id)
    if (target === null) throw new Error(`no ${id}`)
    return target
  }
}

function pressedWithMouse(target: Element): { row: boolean; nested: boolean } {
  const event = { nativeEvent: { target, button: 0 } }
  return {
    row: RowMouseSensor.activators[0].handler(event as never, {}),
    nested: NestedMouseSensor.activators[0].handler(event as never, {}),
  }
}

function touched(target: Element): { row: boolean; nested: boolean } {
  const event = { nativeEvent: { target, touches: [{}] } }
  return {
    row: RowTouchSensor.activators[0].handler(event as never, {}),
    nested: NestedTouchSensor.activators[0].handler(event as never, {}),
  }
}

describe('what a press picks up', () => {
  it('picks the row up from anywhere on it (TASK-38)', () => {
    const at = row()

    expect(pressedWithMouse(at('control')).row).toBe(true)
    expect(touched(at('control')).row).toBe(true)
  })

  it('leaves a press in a text box to the text (TASK-38)', () => {
    const at = row()

    expect(pressedWithMouse(at('box')).row).toBe(false)
    expect(pressedWithMouse(at('box')).nested).toBe(false)
    expect(touched(at('box')).row).toBe(false)
    expect(touched(at('box')).nested).toBe(false)
  })

  it('leaves a press on a checklist to the checklist, so the task stays put (CHK-28)', () => {
    const at = row()

    expect(pressedWithMouse(at('item')).row).toBe(false)
    expect(pressedWithMouse(at('item')).nested).toBe(true)
    expect(touched(at('item')).row).toBe(false)
    expect(touched(at('item')).nested).toBe(true)
  })

  it('does not pick a row up with the right button', () => {
    const at = row()
    const rightClick = { nativeEvent: { target: at('control'), button: 2 } }

    expect(RowMouseSensor.activators[0].handler(rightClick as never, {})).toBe(false)
  })
})
