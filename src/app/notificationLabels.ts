import { toLocalTime } from '../core'
import type { NotifyPermission } from './browserNotification'
import { CASE_DAILY_NOTICE, CASE_NOTICE_ACTION, CASE_SHARE_NOTICE } from './caseLabels'
import { describeCheckInQuestion, describeOthersNotLogged } from './checkInLabels'
import { describeTimeOfDay } from './dueLabels'
import { describeNudgeNotice } from './nudgeLabels'
import type { StandingNotice } from './standingNotices'

/**
 * How the Notifications page reads (NOTIF-1): what this browser allows, and
 * each notice still standing in the words its own notice uses, so the same
 * thing is never said two ways.
 */

/** What the time goal's notice says (TIME-19, NOTIF-3). */
export function describeGoalReached(title: string): string {
  return `Time goal reached for “${title}”`
}

/** One notice as a row reads it: what it says, a line under that where it has one, and what its button does. */
export interface NoticeWords {
  readonly text: string
  readonly detail: string | null
  readonly action: string
}

const OPEN_TASK = 'Open task'

export function describeNotice(notice: StandingNotice): NoticeWords {
  switch (notice.kind) {
    case 'drop':
      return { text: CASE_DAILY_NOTICE, detail: null, action: CASE_NOTICE_ACTION }
    case 'haul':
      return { text: CASE_SHARE_NOTICE, detail: null, action: CASE_NOTICE_ACTION }
    case 'goal':
      return { text: describeGoalReached(notice.title), detail: null, action: OPEN_TASK }
    case 'reminder':
      return {
        text: `Due at ${describeTimeOfDay(toLocalTime(notice.at))} · “${notice.title}”`,
        detail: null,
        action: OPEN_TASK,
      }
    case 'check-in':
      return { text: describeCheckInQuestion(notice.slot), detail: describeOthersNotLogged(notice.others), action: 'Log it' }
    case 'nudge':
      return { text: describeNudgeNotice(notice.title, notice.quietHours), detail: null, action: OPEN_TASK }
  }
}

/** Where this browser stands on notifications (NOTIF-2): a heading, and what that means in a sentence or two. */
export function describeBrowserPermission(permission: NotifyPermission): { readonly heading: string; readonly text: string } {
  switch (permission) {
    case 'granted':
      return {
        heading: 'Notifications are on',
        text: 'This browser shows them while PickMe is open, even when you are in another tab or window.',
      }
    case 'default':
      return {
        heading: 'Notifications are not allowed yet',
        text: 'Everything still shows on screen. Press “Allow notifications” and say yes to the browser to also hear it in another tab or window.',
      }
    case 'denied':
      return {
        heading: 'This browser is blocking notifications',
        text: 'Everything still shows on screen. To hear it in another tab or window, allow notifications in the site’s settings: the icon at the left of the address bar.',
      }
    case 'home-screen':
      return {
        heading: 'Notifications need PickMe on the Home Screen',
        text: 'Everything still shows on screen. On an iPhone or iPad, Safari gives notifications only to apps opened from the Home Screen: press “Share”, then “Add to Home Screen”, open PickMe from there and press “Allow notifications”.',
      }
    case 'unavailable':
      return {
        heading: 'This browser has no notifications',
        text: 'Everything shows on screen only.',
      }
  }
}

export const ALLOW_NOTIFICATIONS = 'Allow notifications'

/**
 * Said under the browser's state whatever it is (PRIN-16): a notification needs
 * the app open to be posted, and a phone does not keep it open for long.
 */
export const NOTIFICATIONS_NEED_APP_OPEN =
  'Nothing reaches you while PickMe is closed. A phone pauses it soon after you switch to another app, and nothing more arrives until you come back.'

/** The page with nothing standing (NOTIF-3). */
export const NOTHING_STANDING =
  'Nothing is waiting. A reminder, a nudge, a check-in or a case shows here until you answer or dismiss it.'

/** How many notices are standing, beside the page's entry (NOTIF-6), and read out with it. */
export function describeNoticeCount(count: number): string {
  return count === 1 ? '1 waiting' : `${String(count)} waiting`
}
