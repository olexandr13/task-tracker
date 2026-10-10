import { sameTag, type FeaturesOff, type List } from '../core'
import { isViewOn } from './features'
import { isOneListView, isTagView, viewFromHash, viewHash, viewListId, viewTag, type View } from './view'

/**
 * The pinned tabs across the top of a wide screen (UI-75), as views: each saved
 * address (STORE-59) read back as the page it names, in order, once each. An
 * address that names no page — one from a version since changed — is read past.
 */
export function pinnedViews(addresses: readonly string[]): View[] {
  const views: View[] = []
  for (const address of addresses) {
    const view = viewFromHash(address)
    if (view !== null && !views.includes(view)) views.push(view)
  }
  return views
}

/** The pinned tabs as they are saved: each page's address (UI-36). */
export function pinnedAddresses(views: readonly View[]): string[] {
  return views.map(viewHash)
}

/** The tabs with `view` pinned at the end, where a browser opens a new tab — or as they were, if it is already pinned. */
export function pinTab(pinned: readonly View[], view: View): View[] {
  return pinned.includes(view) ? [...pinned] : [...pinned, view]
}

/** The tabs with `view` unpinned (UI-76). */
export function unpinTab(pinned: readonly View[], view: View): View[] {
  return pinned.filter((tab) => tab !== view)
}

/**
 * The tabs with `from` dragged to where `over` is (UI-78): before it when
 * carried leftwards, after it when carried rightwards, as a browser's tabs make
 * way. Either not being pinned leaves them as they were.
 */
export function moveTab(pinned: readonly View[], from: View, over: View): View[] {
  const start = pinned.indexOf(from)
  const end = pinned.indexOf(over)
  if (start === -1 || end === -1 || start === end) return [...pinned]

  const moved = pinned.filter((tab) => tab !== from)
  moved.splice(end, 0, from)
  return moved
}

interface TabsShownOptions {
  readonly pinned: readonly View[]
  /** The page open. */
  readonly view: View
  readonly off: FeaturesOff
  /** Every list there is: a list's tab is drawn only while its list is. */
  readonly lists: readonly List[]
  /** Every tag there is: a tag's tab is drawn only while its tag is. */
  readonly tags: readonly string[]
}

interface TabsShown {
  /** The pinned tabs drawn, in order. */
  readonly tabs: View[]
  /** The page open, when it is not among them: drawn after them, unpinned, with a pin (UI-76). */
  readonly current: View | null
}

/**
 * What the strip draws (UI-75, UI-77): the pinned tabs whose pages are there to
 * go to, and the page open when it is not one of them, so the strip always
 * says where you are and exactly one tab is marked.
 *
 * A tab is left out while its page is switched off (FEAT-2), or its list or tag
 * is gone — and kept, so it is back once the page is. Nothing is unpinned for
 * it: the lists arrive after the strip is first drawn, and unpinning what was
 * not there yet would lose every list's tab on every visit. The page open is
 * always drawn, so its tab does not wait for its list to arrive.
 */
export function tabsShown({ pinned, view, off, lists, tags }: TabsShownOptions): TabsShown {
  const isThere = (tab: View) => {
    if (tab === view) return true
    if (!isViewOn(tab, off)) return false
    if (isOneListView(tab)) return lists.some((list) => list.id === viewListId(tab))
    if (isTagView(tab)) return tags.some((tag) => sameTag(tag, viewTag(tab)))
    return true
  }

  const tabs = pinned.filter(isThere)
  return { tabs, current: tabs.includes(view) ? null : view }
}
