import { morePagesShown, useFeaturesOff } from '../features'
import { describeNoticeCount } from '../notificationLabels'
import type { FixedView } from '../view'
import { PageLinks } from './PageLinks'
import { TelegramLink } from './TelegramLink'

interface MorePageProps {
  onOpen: (view: FixedView) => void
  /** How many notices are standing, said on the Notifications row (NOTIF-6). */
  notices?: number
  /** How many modes are on, for the note on the Modes row (MODE-1). */
  modesOn?: number
}

/**
 * More's page: the pages a phone's bar has no tab for — Lists, the Level,
 * Modes, with a page for each mode (MODE-1), Organize, which holds Tags and the
 * notes (UI-81), Reflect, which holds Balance, the activity log and the journal
 * (UI-83), and Notifications (NOTIF-1), in the sidebar's order. Lists is here as
 * well as behind the Tasks tab (UI-34), which takes a hold or a second tap to
 * open, so it is reached the same way as everything else on a phone. The
 * sidebar has an entry for each of them and none for More (UI-30), so this page
 * is reached from the bar. The Modes row says how many modes are on, so whether
 * any is can be seen without opening it. A page switched off on Settings is not
 * listed, and Organize or Reflect not once all it holds is (FEAT-2). Under the
 * links, the speech bubble to the author's Telegram, which a phone has no sidebar
 * to carry (UI-87).
 */
export function MorePage({ onOpen, notices = 0, modesOn = 0 }: MorePageProps) {
  return (
    <div className="flex flex-col gap-4">
      <PageLinks
        pages={morePagesShown(useFeaturesOff())}
        notes={{
          ...(modesOn > 0 && { modes: `${String(modesOn)} on` }),
          ...(notices > 0 && { notifications: describeNoticeCount(notices) }),
        }}
        onOpen={onOpen}
      />
      <TelegramLink className="self-center" />
    </div>
  )
}
