import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CheckInDeviceState } from '../storage/checkInDeviceRepository'
import type { PushRepository } from '../storage/pushRepository'
import { askToNotify, notifyPermission } from './browserNotification'
import { deviceTimeZone, pushSupport, subscribeToPush, unsubscribeFromPush, type PushSupport } from './browserPush'
import { ignoreProblems, type ReportProblem } from './storageProblem'

/** How long signing out waits for this device's registration to go before going ahead anyway. */
const FORGET_WAIT_MS = 3000

/** What came of the last thing asked of push on this device, for the mode's page to say. */
export type PushOutcome = 'blocked' | 'failed' | 'test-sent' | 'test-failed' | null

export interface PushDeviceControl {
  /** Whether this browser can be pushed check-ins — `checking` until it is known (CHECKIN-11). */
  readonly support: PushSupport | 'checking' | 'guest'
  /** Whether this device is to be pushed check-ins when the app is closed. */
  readonly on: boolean
  /** Something is under way: turning it on or off, or a test. */
  readonly busy: boolean
  readonly outcome: PushOutcome
  readonly turnOn: () => Promise<boolean>
  readonly turnOff: () => Promise<void>
  /** Has the sender push a test to this device (CHECKIN-12). */
  readonly sendTest: () => void
  /** Lets this device's registration go before signing out, waiting a little at most (CHECKIN-13). */
  readonly forget: () => Promise<void>
}

/**
 * Whether this device is pushed check-ins when the app is closed, and the way
 * to turn that on and off here (CHECKIN-11). A push reaches a device rather
 * than an account, so this is each device's own: what it is kept as is the
 * device's (STORE-54), and the registration the sender reads is the account's
 * (STORE-53).
 *
 * Opened with it on, the device says again where it is — its subscription,
 * made again if the browser let it go, and its time zone — so the sender's
 * hours are the device's own wherever it has travelled.
 */
export function usePushDevice(
  repository: PushRepository,
  device: CheckInDeviceState,
  updateDevice: (change: (state: CheckInDeviceState) => CheckInDeviceState) => void,
  onProblem: ReportProblem = ignoreProblems,
): PushDeviceControl {
  const [support, setSupport] = useState<PushSupport | 'checking'>('checking')
  const [busy, setBusy] = useState(false)
  const [outcome, setOutcome] = useState<PushOutcome>(null)
  // The device as of right now, for handlers that outlive the render they were made in.
  const current = useRef(device)
  useLayoutEffect(() => {
    current.current = device
  })
  const refreshed = useRef(false)

  useEffect(() => {
    if (!repository.available) return
    let live = true
    void pushSupport().then((found) => {
      if (live) setSupport(found)
    })
    return () => { live = false }
  }, [repository])

  const save = useCallback(
    (deviceId: string, subscription: Awaited<ReturnType<typeof subscribeToPush>>) => {
      repository.register({ deviceId, subscription, timeZone: deviceTimeZone() }).catch((error: unknown) => {
        console.error('Could not keep this device’s push registration.', error)
        onProblem('save')
      })
    },
    [repository, onProblem],
  )

  // Opened with push on: say again where this device is, once.
  useEffect(() => {
    if (refreshed.current || support !== 'supported' || !current.current.pushOn) return
    refreshed.current = true
    const deviceId = current.current.pushDeviceId
    // Notifications blocked since: the browser has let the subscription go with
    // them, and the sender lets the registration go the next time it is refused.
    if (deviceId === null || notifyPermission() !== 'granted') return
    subscribeToPush()
      .then((subscription) => { save(deviceId, subscription) })
      .catch((error: unknown) => { console.warn('Could not renew this device’s push subscription.', error) })
  }, [support, save])

  const turnOn = useCallback(async (): Promise<boolean> => {
    if (!repository.available || support !== 'supported') return false
    setBusy(true)
    setOutcome(null)
    try {
      if ((await askToNotify()) !== 'granted') {
        setOutcome('blocked')
        return false
      }
      const subscription = await subscribeToPush()
      const deviceId = current.current.pushDeviceId ?? crypto.randomUUID()
      save(deviceId, subscription)
      updateDevice((state) => ({ ...state, pushDeviceId: deviceId, pushOn: true }))
      return true
    } catch (error) {
      console.error('Could not turn on check-ins for this device.', error)
      setOutcome('failed')
      return false
    } finally {
      setBusy(false)
    }
  }, [repository, support, save, updateDevice])

  const turnOff = useCallback(async () => {
    const deviceId = current.current.pushDeviceId
    setBusy(true)
    setOutcome(null)
    updateDevice((state) => ({ ...state, pushOn: false }))
    try {
      await unsubscribeFromPush()
    } catch (error) {
      console.warn('Could not let go of this device’s push subscription.', error)
    } finally {
      setBusy(false)
    }
    if (deviceId !== null) {
      repository.forget(deviceId).catch((error: unknown) => {
        console.error('Could not let go of this device’s push registration.', error)
        onProblem('save')
      })
    }
  }, [repository, updateDevice, onProblem])

  const sendTest = useCallback(() => {
    const deviceId = current.current.pushDeviceId
    if (deviceId === null) return
    setBusy(true)
    setOutcome(null)
    repository
      .sendTest(deviceId)
      .then(() => { setOutcome('test-sent') })
      .catch((error: unknown) => {
        console.error('Could not send a test check-in.', error)
        setOutcome('test-failed')
      })
      .finally(() => { setBusy(false) })
  }, [repository])

  const forget = useCallback(async () => {
    const { pushDeviceId, pushOn } = current.current
    if (!pushOn || pushDeviceId === null) return
    updateDevice((state) => ({ ...state, pushOn: false }))
    const letGo = Promise.allSettled([unsubscribeFromPush(), repository.forget(pushDeviceId)])
    await Promise.race([letGo, new Promise((resolve) => setTimeout(resolve, FORGET_WAIT_MS))])
  }, [repository, updateDevice])

  // Blocked since it was turned on, it is on in name only: nothing can be shown.
  const blocked = device.pushOn && notifyPermission() === 'denied'

  return {
    support: repository.available ? support : 'guest',
    on: device.pushOn && !blocked,
    busy,
    outcome: blocked ? 'blocked' : outcome,
    turnOn,
    turnOff,
    sendTest,
    forget,
  }
}
