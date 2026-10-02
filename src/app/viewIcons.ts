import type { ReactElement } from 'react'
import { BalanceIcon } from './components/BalanceIcon'
import { CalendarIcon } from './components/CalendarIcon'
import { CalmIcon } from './components/CalmIcon'
import { ChestIcon } from './components/ChestIcon'
import { FlameIcon } from './components/FlameIcon'
import { FolderIcon } from './components/FolderIcon'
import { GiftIcon } from './components/GiftIcon'
import { HistoryIcon } from './components/HistoryIcon'
import { InboxIcon } from './components/InboxIcon'
import { ListIcon } from './components/ListIcon'
import { ModesIcon } from './components/ModesIcon'
import { MonthIcon } from './components/MonthIcon'
import { MoreIcon } from './components/MoreIcon'
import { NudgeIcon } from './components/NudgeIcon'
import { ProcrastinationIcon } from './components/ProcrastinationIcon'
import { SettingsIcon } from './components/SettingsIcon'
import { SlidersIcon } from './components/SlidersIcon'
import { StarIcon } from './components/StarIcon'
import { TagIcon } from './components/TagIcon'
import { TrashIcon } from './components/TrashIcon'
import { TrophyIcon } from './components/TrophyIcon'
import { WarmUpIcon } from './components/WarmUpIcon'
import { WeekIcon } from './components/WeekIcon'
import type { FixedView, ModeView } from './view'

export type ViewIcon = (props: { className?: string }) => ReactElement

/**
 * The glyph each view carries, wherever it is navigated to from: the sidebar, a
 * phone's bar, or the strip across the rewards pages. Every tag's view carries
 * the same glyph as Tags, and every list's the same as Lists. The pages under
 * Rewards each carry their own, so the star stays Rewards itself. Each mode
 * carries the glyph it already wears wherever it speaks — the melting face, the
 * seedling — so the mode is recognised before its name is read. On a mode's own
 * page the head may say more than which mode it is (`MODE_PAGE_ICONS`).
 */
export const VIEW_ICONS: Record<FixedView, ViewIcon> = {
  today: CalendarIcon,
  week: WeekIcon,
  month: MonthIcon,
  tasks: ListIcon,
  inbox: InboxIcon,
  habits: FlameIcon,
  rewards: StarIcon,
  'rewards/chest': ChestIcon,
  'rewards/history': HistoryIcon,
  'rewards/prizes': GiftIcon,
  'rewards/wishlist': TrophyIcon,
  'rewards/rules': SlidersIcon,
  lists: FolderIcon,
  tags: TagIcon,
  balance: BalanceIcon,
  more: MoreIcon,
  modes: ModesIcon,
  'modes/procrastination': ProcrastinationIcon,
  'modes/warm-up': WarmUpIcon,
  'modes/nudge': NudgeIcon,
  trash: TrashIcon,
  settings: SettingsIcon,
}

/**
 * The two faces a mode wears at the head of its own page, off and on, which say
 * where the mode stands and not only which mode it is (MODE-11):
 * Procrastination melts while it is off and is calm while it is on, one task in
 * front of you instead of all of them. Elsewhere — the sidebar, the Modes list
 * — a mode wears the one glyph it is navigated by (MODE-2), which is the face it
 * wears here while off; a mode with a single face, like the warm-up, has it on
 * both sides.
 *
 * Nothing here needs to know whether the mode is still loading (MODE-8): off
 * wears the mode's own glyph, so the head says nothing untrue before the state
 * arrives, and turns calm when it does.
 */
export const MODE_PAGE_ICONS: Record<ModeView, { readonly off: ViewIcon; readonly on: ViewIcon }> = {
  'modes/procrastination': { off: ProcrastinationIcon, on: CalmIcon },
  'modes/warm-up': { off: WarmUpIcon, on: WarmUpIcon },
  'modes/nudge': { off: NudgeIcon, on: NudgeIcon },
}
