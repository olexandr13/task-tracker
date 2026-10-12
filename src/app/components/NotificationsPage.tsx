import type { ReactElement } from 'react'
import type { NotifyPermission } from '../browserNotification'
import {
  ALLOW_NOTIFICATIONS,
  describeBrowserPermission,
  describeNotice,
  NOTHING_STANDING,
  NOTIFICATIONS_NEED_APP_OPEN,
} from '../notificationLabels'
import { noticeKey, type StandingNotice } from '../standingNotices'
import { BellIcon } from './BellIcon'
import { CasesIcon } from './CasesIcon'
import { CheckInIcon } from './CheckInIcon'
import { ClockIcon } from './ClockIcon'
import { NudgeIcon } from './NudgeIcon'

const heading = 'text-sm font-medium text-neutral-700 dark:text-neutral-300'

const card =
  'flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900'

const glyph = 'size-5 shrink-0 text-neutral-400 dark:text-neutral-500'

/** The emoji a mode wears, in a box the size of the drawn glyphs beside it. */
const emoji = 'inline-flex size-5 shrink-0 items-center justify-center text-base leading-none'

const button =
  'shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 active:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/15 dark:active:bg-blue-500/15'

const dismissButton =
  'shrink-0 rounded-lg px-2 py-1 text-lg leading-none text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'

/** Each notice by the glyph of the part of the app it came from. */
function NoticeGlyph({ notice }: { notice: StandingNotice }): ReactElement {
  switch (notice.kind) {
    case 'drop':
    case 'haul':
      return <CasesIcon className={glyph} />
    case 'goal':
      return <ClockIcon className={glyph} />
    case 'reminder':
      return <BellIcon className={glyph} />
    case 'check-in':
      return <CheckInIcon className={emoji} />
    case 'nudge':
      return <NudgeIcon className={emoji} />
  }
}

interface NotificationsPageProps {
  /** What this browser allows (NOTIF-2). */
  permission: NotifyPermission
  /** Asks the browser, while it has not been asked yet. */
  onAllow: () => void
  /** Every notice standing, in the order the screen shows them (NOTIF-3). */
  notices: readonly StandingNotice[]
  /** Does what the notice's own button does: opens the task, the hour to log, or Cases (NOTIF-4). */
  onOpen: (notice: StandingNotice) => void
  /** Puts the notice away, as its × at the foot of the screen does (NOTIF-4). */
  onDismiss: (notice: StandingNotice) => void
}

/**
 * The Notifications page (NOTIF-1): whether this browser will post the app's
 * notifications, with the one thing that can be done about it here, and every
 * notice still standing, each with what its own notice offers. Nothing is kept
 * for it: what is listed is what the notices already hold, so a notice answered
 * anywhere leaves here too, and one answered here leaves the screen.
 */
export function NotificationsPage({ permission, onAllow, notices, onOpen, onDismiss }: NotificationsPageProps) {
  const browser = describeBrowserPermission(permission)

  return (
    <div className="flex flex-col gap-6">
      <section aria-label="This browser" className="flex flex-col gap-2">
        <h2 className={heading}>This browser</h2>
        <div className={card}>
          <BellIcon className={glyph} />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-base text-neutral-900 dark:text-neutral-100">{browser.heading}</span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">{browser.text}</span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">{NOTIFICATIONS_NEED_APP_OPEN}</span>
          </div>
          {permission === 'default' && (
            <button type="button" onClick={onAllow} className={button}>
              {ALLOW_NOTIFICATIONS}
            </button>
          )}
        </div>
      </section>

      <section aria-label="Waiting" className="flex flex-col gap-2">
        <h2 className={heading}>Waiting</h2>
        {notices.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-400 dark:text-neutral-500">{NOTHING_STANDING}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {notices.map((notice) => {
              const words = describeNotice(notice)
              return (
                <li key={noticeKey(notice)} className={card}>
                  <NoticeGlyph notice={notice} />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="break-words text-neutral-900 dark:text-neutral-100">{words.text}</span>
                    {words.detail !== null && (
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">{words.detail}</span>
                    )}
                  </div>
                  <button type="button" onClick={() => { onOpen(notice) }} className={button}>
                    {words.action}
                  </button>
                  <button
                    type="button"
                    onClick={() => { onDismiss(notice) }}
                    aria-label={`Dismiss: ${words.text}`}
                    className={dismissButton}
                  >
                    ×
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
