import type { ReactElement } from 'react'
import { CalendarIcon } from './components/CalendarIcon'
import { FlameIcon } from './components/FlameIcon'
import { ListIcon } from './components/ListIcon'
import { MonthIcon } from './components/MonthIcon'
import { SettingsIcon } from './components/SettingsIcon'
import { StarIcon } from './components/StarIcon'
import { TagIcon } from './components/TagIcon'
import { TrashIcon } from './components/TrashIcon'
import { WeekIcon } from './components/WeekIcon'
import type { FixedView } from './view'

export type ViewIcon = (props: { className?: string }) => ReactElement

/**
 * The glyph each view carries, wherever it is navigated to from: the sidebar or a
 * phone's bar. Every tag's list carries the same glyph as Tags.
 */
export const VIEW_ICONS: Record<FixedView, ViewIcon> = {
  today: CalendarIcon,
  week: WeekIcon,
  month: MonthIcon,
  tasks: ListIcon,
  habits: FlameIcon,
  rewards: StarIcon,
  tags: TagIcon,
  trash: TrashIcon,
  settings: SettingsIcon,
}
