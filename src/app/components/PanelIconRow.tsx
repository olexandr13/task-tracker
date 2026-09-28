import { Children, type CSSProperties, type ReactNode } from 'react'
import { panelIconRow } from '../panelControls'

interface PanelIconRowProps {
  /**
   * The icons, one button each: the quick date choices, wherever a panel draws
   * them, and the **i** that spells them out where a row has one (DUE-25). Every
   * child takes a slot and is counted — a list of them and a button after it
   * alike — so nothing conditional belongs here: a `false` would be counted too.
   */
  children: ReactNode
}

/**
 * A row of icon choices in a panel — the Date row of the schedule panel and of a
 * task's menu (DUE-14). It spreads them across the panel, and no further apart
 * than one of them is wide, a short row keeping to the right: the row counts what
 * it holds and tells its style, which caps its width by that count (panelIconRow).
 */
export function PanelIconRow({ children }: PanelIconRowProps) {
  // A custom property, which React passes through to the element's style and its types leave out.
  const style = { '--icons': Children.count(children) } as CSSProperties

  return (
    <div className={panelIconRow} style={style}>
      {children}
    </div>
  )
}
