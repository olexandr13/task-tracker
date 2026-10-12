import { morePagesShown, useFeaturesOff } from '../features'
import { describeNoticeCount } from '../notificationLabels'
import type { FixedView } from '../view'
import { PageLinks } from './PageLinks'

interface MorePageProps {
  onOpen: (view: FixedView) => void
  /** How many notices are standing, said on the Notifications row (NOTIF-6). */
  notices?: number
}

/**
 * More's page: the pages a phone's bar has no tab for — Lists, Organize, which
 * holds Tags, the notes and Modes (UI-81), Balance (BAL-1), the activity log
 * (ACT-1), the journal (JRN-1) and Notifications (NOTIF-1), in the sidebar's
 * order. Lists is here as
 * well as behind the Tasks tab (UI-34), which takes a hold or a second tap to
 * open, so it is reached the same way as everything else on a phone. The
 * sidebar has an entry for each of them and none for More (UI-30), so this page
 * is reached from the bar. A page switched off on Settings is not listed, and
 * Organize not once all it holds is (FEAT-2).
 */
export function MorePage({ onOpen, notices = 0 }: MorePageProps) {
  return (
    <PageLinks
      pages={morePagesShown(useFeaturesOff())}
      notes={notices > 0 ? { notifications: describeNoticeCount(notices) } : {}}
      onOpen={onOpen}
    />
  )
}
