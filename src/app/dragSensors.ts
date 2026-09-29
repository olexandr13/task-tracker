import { MouseSensor, TouchSensor, type MouseSensorOptions, type TouchSensorOptions } from '@dnd-kit/core'
import type { MouseEvent, TouchEvent } from 'react'
import { isInTextEntry } from './textEntry'

/**
 * Put on a list that sits inside a row and is dragged within itself — a task's
 * checklist. A press there belongs to that list, so the row around it stays
 * put: dragging an item must not carry the whole task off with it.
 */
export const nestedDragArea = { 'data-nested-drag': '' } as const

function isInNestedDragArea(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest('[data-nested-drag]') !== null
}

/**
 * The mouse sensor for a nested list's own item, picked up anywhere on it
 * except its text box: a press in one is selecting text, not picking the item
 * up.
 */
export class NestedMouseSensor extends MouseSensor {
  static activators = [
    {
      eventName: 'onMouseDown' as const,
      handler: (event: MouseEvent, options: MouseSensorOptions) =>
        !isInTextEntry(event.nativeEvent.target) && MouseSensor.activators[0].handler(event, options),
    },
  ]
}

/** The touch sensor for the same. */
export class NestedTouchSensor extends TouchSensor {
  static activators = [
    {
      eventName: 'onTouchStart' as const,
      handler: (event: TouchEvent, options: TouchSensorOptions) =>
        !isInTextEntry(event.nativeEvent.target) && TouchSensor.activators[0].handler(event, options),
    },
  ]
}

/** The row's own mouse sensor: the nested list's, plus a press inside such a list. */
export class RowMouseSensor extends NestedMouseSensor {
  static activators = [
    {
      eventName: 'onMouseDown' as const,
      handler: (event: MouseEvent, options: MouseSensorOptions) =>
        !isInNestedDragArea(event.nativeEvent.target) && NestedMouseSensor.activators[0].handler(event, options),
    },
  ]
}

/** The touch sensor, with the same two exceptions. */
export class RowTouchSensor extends NestedTouchSensor {
  static activators = [
    {
      eventName: 'onTouchStart' as const,
      handler: (event: TouchEvent, options: TouchSensorOptions) =>
        !isInNestedDragArea(event.nativeEvent.target) && NestedTouchSensor.activators[0].handler(event, options),
    },
  ]
}
