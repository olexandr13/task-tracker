import type { ReactElement } from 'react'
import { CalendarIcon } from './components/CalendarIcon'
import { FlameIcon } from './components/FlameIcon'
import { FolderIcon } from './components/FolderIcon'
import { InboxIcon } from './components/InboxIcon'
import { ListIcon } from './components/ListIcon'
import { MonthIcon } from './components/MonthIcon'
import { MoreIcon } from './components/MoreIcon'
import { SettingsIcon } from './components/SettingsIcon'
import { StarIcon } from './components/StarIcon'
import { TagIcon } from './components/TagIcon'
import { TrashIcon } from './components/TrashIcon'
import { WeekIcon } from './components/WeekIcon'
import type { FixedView } from './view'

export type ViewIcon = (props: { className?: string }) => ReactElement

/**
 * The glyph each view carries, wherever it is navigated to from: the sidebar or a
 * phone's bar. Every tag's view carries the same glyph as Tags, and every list's
 * the same as Lists. More is a phone's alone.
 */
export const VIEW_ICONS: Record<FixedView, ViewIcon> = {
  today: CalendarIcon,
  week: WeekIcon,
  month: MonthIcon,
  tasks: ListIcon,
  inbox: InboxIcon,
  habits: FlameIcon,
  rewards: StarIcon,
  lists: FolderIcon,
  tags: TagIcon,
  more: MoreIcon,
  trash: TrashIcon,
  settings: SettingsIcon,
}
