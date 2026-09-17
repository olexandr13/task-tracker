import { MouseSensor, TouchSensor, type MouseSensorOptions, type TouchSensorOptions } from '@dnd-kit/core'
import type { MouseEvent, TouchEvent } from 'react'
import { isInTextEntry } from './textEntry'

/**
 * The mouse sensor, for a row that can be picked up anywhere except its text
 * boxes: a press in one is selecting text, not picking the row up.
 */
export class RowMouseSensor extends MouseSensor {
  static activators = [
    {
      eventName: 'onMouseDown' as const,
      handler: (event: MouseEvent, options: MouseSensorOptions) =>
        !isInTextEntry(event.nativeEvent.target) && MouseSensor.activators[0].handler(event, options),
    },
  ]
}

/** The touch sensor, with the same exception. */
export class RowTouchSensor extends TouchSensor {
  static activators = [
    {
      eventName: 'onTouchStart' as const,
      handler: (event: TouchEvent, options: TouchSensorOptions) =>
        !isInTextEntry(event.nativeEvent.target) && TouchSensor.activators[0].handler(event, options),
    },
  ]
}
