import { useState } from 'react'
import type { PushSupport } from '../browserPush'
import { describePushOutcome, describePushSupport, PUSH_SWITCH } from '../checkInLabels'
import type { PushOutcome } from '../usePushDevice'
import { NudgeIcon } from './NudgeIcon'
import { OptionSwitch } from './OptionSwitch'

const button =
  'self-start rounded-lg px-3 py-2 text-base text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 active:bg-neutral-100 md:px-2.5 md:py-1 md:text-sm dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 dark:active:bg-neutral-800'

interface CheckInDeviceProps {
  support: PushSupport | 'checking' | 'guest'
  on: boolean
  busy: boolean
  outcome: PushOutcome
  onTurnOn: () => void
  onTurnOff: () => void
  onSendTest: () => void
}

/**
 * Whether this device is reached while the app is closed (CHECKIN-11): a switch
 * of its own, since a push reaches a device and not an account, and once it is
 * on a way to have a test sent now (CHECKIN-12). Where this browser cannot be
 * reached, it says why and what would do — a press on the switch says it again,
 * rather than the switch being dimmed with nothing said.
 */
export function CheckInDevice({ support, on, busy, outcome, onTurnOn, onTurnOff, onSendTest }: CheckInDeviceProps) {
  const [refused, setRefused] = useState(false)
  const reason = support === 'checking' || support === 'supported' ? null : describePushSupport(support)
  const said = describePushOutcome(outcome)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="-mx-2">
        <OptionSwitch
          icon={<NudgeIcon className="text-base leading-none" />}
          label={PUSH_SWITCH.label}
          description={PUSH_SWITCH.description}
          checked={on}
          onChange={(wanted) => {
            if (busy) return
            if (!wanted) {
              onTurnOff()
              return
            }
            if (reason !== null) {
              setRefused(true)
              return
            }
            onTurnOn()
          }}
        />
      </div>

      {reason !== null && (
        <p role={refused ? 'alert' : undefined} className="text-xs text-neutral-600 dark:text-neutral-300">
          {reason}
        </p>
      )}

      {on && (
        <button type="button" onClick={onSendTest} disabled={busy} className={button}>
          {busy ? 'Sending…' : 'Send a test'}
        </button>
      )}

      {said !== null && (
        <p
          role="status"
          className={`text-xs ${outcome === 'test-sent' ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}`}
        >
          {said}
        </p>
      )}
    </div>
  )
}
