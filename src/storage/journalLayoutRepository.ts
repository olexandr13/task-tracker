import { isJournalSection, JOURNAL_SECTIONS, type JournalSection } from '../core'

/**
 * How the journal's page is laid out on this device (JRN-11, JRN-12): the
 * order its sections' cards come in, and which of them are folded down to
 * their heading.
 */
export interface JournalLayout {
  /** Every section, each once, in the order the page draws them. */
  readonly order: readonly JournalSection[]
  /** The sections folded away, in no order that matters. */
  readonly folded: readonly JournalSection[]
}

/** As the page starts: the sections in the order the journal asks for them, none folded. */
export const DEFAULT_JOURNAL_LAYOUT: JournalLayout = { order: JOURNAL_SECTIONS, folded: [] }

/**
 * Every section, each once, in the order `order` gives: anything that is not a
 * section is read past, and a section it never mentions — one added since the
 * order was kept — goes after the rest, in the journal's own order.
 */
export function arrangeJournalSections(order: readonly unknown[]): JournalSection[] {
  const arranged = [...new Set(order)].filter(isJournalSection)
  return [...arranged, ...JOURNAL_SECTIONS.filter((section) => !arranged.includes(section))]
}

/** The layout with `section` moved to where `over` is, the others closing up behind it (JRN-11). */
export function moveJournalSection(layout: JournalLayout, section: JournalSection, over: JournalSection): JournalLayout {
  const from = layout.order.indexOf(section)
  const to = layout.order.indexOf(over)
  if (from === -1 || to === -1 || from === to) return layout
  const order = layout.order.filter((other) => other !== section)
  order.splice(to, 0, section)
  return { ...layout, order }
}

export function isJournalSectionFolded(layout: JournalLayout, section: JournalSection): boolean {
  return layout.folded.includes(section)
}

/** The layout with `section` folded away or brought back (JRN-12). */
export function foldJournalSection(layout: JournalLayout, section: JournalSection, folded: boolean): JournalLayout {
  if (isJournalSectionFolded(layout, section) === folded) return layout
  return {
    ...layout,
    folded: folded ? [...layout.folded, section] : layout.folded.filter((other) => other !== section),
  }
}

/**
 * Where the journal's layout is kept between visits (STORE-70).
 *
 * It belongs to the device rather than the account, as Settings' folds do
 * (STORE-57): how much of a page someone wants open is the screen's business.
 * Kept in the browser, it is there the moment the page opens, so no card moves
 * or folds once it is drawn.
 */
export interface JournalLayoutRepository {
  load(): JournalLayout
  save(layout: JournalLayout): void
  /** Calls `listener` when another window on this device saves it (STORE-61); returns how to stop. */
  subscribe(listener: () => void): () => void
}
