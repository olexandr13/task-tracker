import { describe, expect, it, vi } from 'vitest'
import { createActivityEntry, type HourSlot } from '../core'
import { toStoredActivityDays } from './activitySchema'
import { checkInPush, devicesToReach, sendDueCheckIns, type SenderStore, type SendPush } from './checkInSender'
import { toStoredCheckIn } from './checkInSchema'
import { toStoredFeatures } from './featureSchema'
import { toStoredPushRegistration } from './pushSchema'

/* The sender that pushes check-ins while the app is closed. CHECKIN ids refer to wiki/check-ins.md. */

// 15:00 in Kyiv on Friday 2 October 2026 (UTC+3).
const AT_15_KYIV = new Date(Date.UTC(2026, 9, 2, 12, 0))
const FOURTEEN: HourSlot = { day: '2026-10-02', hour: 14 }

function registration(deviceId: string, timeZone = 'Europe/Kyiv', endpoint = `https://push.example/${deviceId}`, at = AT_15_KYIV) {
  return toStoredPushRegistration({ deviceId, subscription: { endpoint, keys: { p256dh: 'p', auth: 'a' } }, timeZone }, at)
}

function fakeStore(over: {
  registrations?: { accountId: string; deviceId: string; data: unknown }[]
  checkIn?: unknown
  features?: unknown
  day?: unknown
} = {}) {
  const store = {
    registrations: vi.fn(() => Promise.resolve(over.registrations ?? [{ accountId: 'me', deviceId: 'phone', data: registration('phone') }])),
    checkIn: vi.fn(() =>
      Promise.resolve('checkIn' in over ? over.checkIn : toStoredCheckIn({ on: true, window: { from: '09:00', to: '22:00' } })),
    ),
    features: vi.fn(() => Promise.resolve(over.features)),
    activityDay: vi.fn(() => Promise.resolve(over.day)),
    markSent: vi.fn(() => Promise.resolve()),
    forget: vi.fn(() => Promise.resolve()),
  } satisfies SenderStore
  return store
}

describe('sendDueCheckIns (CHECKIN-10)', () => {
  it('pushes the hour just ended to a device whose account asks, and writes it down', async () => {
    const store = fakeStore()
    const send = vi.fn<SendPush>(() => Promise.resolve('sent'))

    expect(await sendDueCheckIns(store, send, AT_15_KYIV)).toEqual({ sent: 1, forgotten: 0 })
    expect(send).toHaveBeenCalledExactlyOnceWith(
      { endpoint: 'https://push.example/phone', keys: { p256dh: 'p', auth: 'a' } },
      checkInPush(FOURTEEN),
    )
    expect(store.activityDay).toHaveBeenCalledWith('me', '2026-10-02')
    expect(store.markSent).toHaveBeenCalledExactlyOnceWith('me', 'phone', '2026-10-02T14')
  })

  it('reads each device in its own time zone', async () => {
    const store = fakeStore({ registrations: [{ accountId: 'me', deviceId: 'laptop', data: registration('laptop', 'America/New_York') }] })
    const send = vi.fn<SendPush>(() => Promise.resolve('sent'))

    // 08:00 in New York: the 07:00 hour is before the hours kept to.
    expect(await sendDueCheckIns(store, send, AT_15_KYIV)).toEqual({ sent: 0, forgotten: 0 })
    expect(send).not.toHaveBeenCalled()
  })

  it('says nothing of an hour logged already, or while the check-in is off or unset', async () => {
    const logged = toStoredActivityDays([createActivityEntry('Work', 3600, FOURTEEN, AT_15_KYIV)])[0]
    const send = vi.fn<SendPush>(() => Promise.resolve('sent'))

    await sendDueCheckIns(fakeStore({ day: logged }), send, AT_15_KYIV)
    await sendDueCheckIns(fakeStore({ checkIn: toStoredCheckIn({ on: false, window: { from: '08:00', to: '22:00' } }) }), send, AT_15_KYIV)
    await sendDueCheckIns(fakeStore({ checkIn: undefined }), send, AT_15_KYIV)

    expect(send).not.toHaveBeenCalled()
  })

  it('says nothing while the modes or the activity log are switched off (FEAT-9)', async () => {
    const send = vi.fn<SendPush>(() => Promise.resolve('sent'))

    await sendDueCheckIns(fakeStore({ features: toStoredFeatures(['modes']) }), send, AT_15_KYIV)
    await sendDueCheckIns(fakeStore({ features: toStoredFeatures(['activity']) }), send, AT_15_KYIV)
    expect(send).not.toHaveBeenCalled()

    // Something else switched off, or switches it cannot read, stand in nobody's way.
    await sendDueCheckIns(fakeStore({ features: toStoredFeatures(['rewards']) }), send, AT_15_KYIV)
    await sendDueCheckIns(fakeStore({ features: { version: 99 } }), send, AT_15_KYIV)
    expect(send).toHaveBeenCalledTimes(2)
  })

  it('does not push an hour twice', async () => {
    const data = { ...registration('phone'), lastSentSlot: '2026-10-02T14' }
    const send = vi.fn<SendPush>(() => Promise.resolve('sent'))

    await sendDueCheckIns(fakeStore({ registrations: [{ accountId: 'me', deviceId: 'phone', data }] }), send, AT_15_KYIV)

    expect(send).not.toHaveBeenCalled()
  })

  it('lets go of a device the push service no longer knows', async () => {
    const store = fakeStore()

    expect(await sendDueCheckIns(store, () => Promise.resolve('gone'), AT_15_KYIV)).toEqual({ sent: 0, forgotten: 1 })
    expect(store.forget).toHaveBeenCalledExactlyOnceWith('me', 'phone')
    expect(store.markSent).not.toHaveBeenCalled()
  })

  it('reads a day of the log once for every device asking about it', async () => {
    const store = fakeStore({
      registrations: [
        { accountId: 'me', deviceId: 'phone', data: registration('phone') },
        { accountId: 'me', deviceId: 'laptop', data: registration('laptop') },
      ],
    })

    expect(await sendDueCheckIns(store, () => Promise.resolve('sent'), AT_15_KYIV)).toEqual({ sent: 2, forgotten: 0 })
    expect(store.activityDay).toHaveBeenCalledTimes(1)
    expect(store.checkIn).toHaveBeenCalledTimes(1)
  })
})

describe('devicesToReach', () => {
  it('keeps the latest of two registrations of one browser, and lets the other go', () => {
    const older = registration('old', 'Europe/Kyiv', 'https://push.example/same', new Date(Date.UTC(2026, 9, 1)))
    const newer = registration('new', 'Europe/Kyiv', 'https://push.example/same', new Date(Date.UTC(2026, 9, 2)))

    const { reach, stale } = devicesToReach([
      { accountId: 'before', deviceId: 'old', data: older },
      { accountId: 'now', deviceId: 'new', data: newer },
      { accountId: 'now', deviceId: 'broken', data: { version: 99 } },
    ])

    expect(reach.map((device) => [device.accountId, device.registration.deviceId])).toEqual([['now', 'new']])
    expect(stale).toEqual([{ accountId: 'before', deviceId: 'old' }])
  })
})

describe('checkInPush', () => {
  it('asks about the hour as the app does, one notification per hour', () => {
    expect(checkInPush(FOURTEEN)).toEqual({
      title: 'What did you do 14:00–15:00?',
      body: 'Tap to log it in PickMe.',
      tag: 'check-in-2026-10-02T14',
      url: '/#/activity',
      slot: FOURTEEN,
    })
    expect(checkInPush({ day: '2026-10-02', hour: 23 }).title).toBe('What did you do 23:00–00:00?')
  })
})
