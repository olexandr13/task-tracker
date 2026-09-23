import type { ReactElement } from 'react'
import { CalendarIcon } from './components/CalendarIcon'
import { FlameIcon } from './components/FlameIcon'
import { FolderIcon } from './components/FolderIcon'
import { GiftIcon } from './components/GiftIcon'
import { HistoryIcon } from './components/HistoryIcon'
import { InboxIcon } from './components/InboxIcon'
import { ListIcon } from './components/ListIcon'
import { MonthIcon } from './components/MonthIcon'
import { MoreIcon } from './components/MoreIcon'
import { SettingsIcon } from './components/SettingsIcon'
import { SlidersIcon } from './components/SlidersIcon'
import { StarIcon } from './components/StarIcon'
import { TagIcon } from './components/TagIcon'
import { TrashIcon } from './components/TrashIcon'
import { TrophyIcon } from './components/TrophyIcon'
import { WeekIcon } from './components/WeekIcon'
import type { FixedView } from './view'

export type ViewIcon = (props: { className?: string }) => ReactElement

/**
 * The glyph each view carries, wherever it is navigated to from: the sidebar, a
 * phone's bar, or the strip across the rewards pages. Every tag's view carries
 * the same glyph as Tags, and every list's the same as Lists. The pages under
 * Rewards each carry their own, so the star stays Rewards itself.
 */
export const VIEW_ICONS: Record<FixedView, ViewIcon> = {
  today: CalendarIcon,
  week: WeekIcon,
  month: MonthIcon,
  tasks: ListIcon,
  inbox: InboxIcon,
  habits: FlameIcon,
  rewards: StarIcon,
  'rewards/history': HistoryIcon,
  'rewards/prizes': GiftIcon,
  'rewards/wishlist': TrophyIcon,
  'rewards/rules': SlidersIcon,
  lists: FolderIcon,
  tags: TagIcon,
  more: MoreIcon,
  trash: TrashIcon,
  settings: SettingsIcon,
}
