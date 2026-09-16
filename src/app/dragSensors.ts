import { MouseSensor, TouchSensor, type MouseSensorOptions, type TouchSensorOptions } from '@dnd-kit/core'
import type { MouseEvent, TouchEvent } from 'react'

/**
 * A press inside something being typed in is selecting text, not picking the
 * row up, so the sensors below leave it alone.
 */
function startsInText(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  return target.closest('input, textarea') !== null || (target instanceof HTMLElement && target.isContentEditable)
}

/** The mouse sensor, for a row that can be picked up anywhere except its text boxes. */
export class RowMouseSensor extends MouseSensor {
  static activators = [
    {
      eventName: 'onMouseDown' as const,
      handler: (event: MouseEvent, options: MouseSensorOptions) =>
        !startsInText(event.nativeEvent.target) && MouseSensor.activators[0].handler(event, options),
    },
  ]
}

/** The touch sensor, with the same exception. */
export class RowTouchSensor extends TouchSensor {
  static activators = [
    {
      eventName: 'onTouchStart' as const,
      handler: (event: TouchEvent, options: TouchSensorOptions) =>
        !startsInText(event.nativeEvent.target) && TouchSensor.activators[0].handler(event, options),
    },
  ]
}
