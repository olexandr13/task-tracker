import { isGoalView, isOneListView, isTagView, type View } from '../view'
import { VIEW_ICONS } from '../viewIcons'
import { FolderIcon } from './FolderIcon'
import { TagIcon } from './TagIcon'
import { TargetIcon } from './TargetIcon'

/**
 * The glyph a page carries wherever it is navigated to from — a pinned tab
 * (UI-75), the strip across a section's pages (UI-84): a list's the folder Lists
 * has, a tag's the mark Tags has, a goal's the target Goals has, any other page its own.
 */
export function ViewGlyph({ view }: { view: View }) {
  if (isOneListView(view)) return <FolderIcon />
  if (isTagView(view)) return <TagIcon />
  if (isGoalView(view)) return <TargetIcon />
  const Icon = VIEW_ICONS[view]
  return <Icon />
}
