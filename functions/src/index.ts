/**
 * PickMe's one server-side part (PRIN-16): the sender that pushes a check-in to
 * a device while the app is closed (CHECKIN-10), and the test it pushes when
 * asked for one from the Check-in page (CHECKIN-12).
 *
 * What it decides is `src/storage/checkInSender.ts`, bundled in with the shapes
 * it reads; this file only joins it to Firestore, read with the project's own
 * rights, and to the push services, reached with the keys kept in Secret
 * Manager (`scripts/setupPushKeys.js`). Deployed with `npm run deploy:functions`.
 */

import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import webpush, { WebPushError } from 'web-push'
import { CHECK_IN } from '../../src/storage/checkInSchema'
import { FEATURES_RECORD } from '../../src/storage/featureSchema'
import { sendDueCheckIns, TEST_PUSH, type PushResult, type SenderStore, type SendPush } from '../../src/storage/checkInSender'
import { readPushRegistration } from '../../src/storage/pushSchema'

initializeApp()
const db = getFirestore()

/** Beside the database, in Europe, as the app's callable expects (`firestorePushRepository.ts`). */
const REGION = 'europe-west1'

/** Who the push services may contact about these pushes: the app itself. */
const SUBJECT = 'https://task-tracker-pi-virid-63.vercel.app'

/** How long a push may wait for a device that is off: past the hour after it, it is stale. */
const TTL_SECONDS = 45 * 60

const vapidPublicKey = defineSecret('VAPID_PUBLIC_KEY')
const vapidPrivateKey = defineSecret('VAPID_PRIVATE_KEY')

/** A push through the browser's push service; a device the service no longer knows is `gone`. */
const send: SendPush = async (subscription, push): Promise<PushResult> => {
  try {
    await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { ...subscription.keys } }, JSON.stringify(push), {
      TTL: TTL_SECONDS,
      urgency: 'normal',
      // A newer check-in waiting for the device takes the place of an older one.
      topic: 'check-in',
      vapidDetails: { subject: SUBJECT, publicKey: vapidPublicKey.value(), privateKey: vapidPrivateKey.value() },
    })
    return 'sent'
  } catch (error) {
    if (error instanceof WebPushError && (error.statusCode === 404 || error.statusCode === 410)) return 'gone'
    throw error
  }
}

const store: SenderStore = {
  async registrations() {
    const saved = await db.collectionGroup('pushSubscriptions').get()
    return saved.docs.flatMap((registration) => {
      const accountId = registration.ref.parent.parent?.id
      return accountId === undefined ? [] : [{ accountId, deviceId: registration.id, data: registration.data() }]
    })
  },
  async checkIn(accountId) {
    return (await db.doc(`users/${accountId}/checkIn/${CHECK_IN}`).get()).data()
  },
  async features(accountId) {
    return (await db.doc(`users/${accountId}/features/${FEATURES_RECORD}`).get()).data()
  },
  async activityDay(accountId, day) {
    return (await db.doc(`users/${accountId}/activityDays/${day}`).get()).data()
  },
  async markSent(accountId, deviceId, slot) {
    await db.doc(`users/${accountId}/pushSubscriptions/${deviceId}`).update({ lastSentSlot: slot })
  },
  async forget(accountId, deviceId) {
    await db.doc(`users/${accountId}/pushSubscriptions/${deviceId}`).delete()
  },
}

/**
 * Every quarter of an hour: a device whose clock has just reached the hour is
 * asked about the one that ended, where it is still to log. A quarter of an
 * hour rather than an hour, so a time zone whose hours fall on the half hour
 * is reached on its own hour too.
 */
export const sendCheckIns = onSchedule(
  { schedule: '*/15 * * * *', timeZone: 'Etc/UTC', region: REGION, secrets: [vapidPublicKey, vapidPrivateKey], retryCount: 0 },
  async () => {
    const run = await sendDueCheckIns(store, send, new Date())
    if (run.sent > 0 || run.forgotten > 0) logger.info('Check-ins sent.', run)
  },
)

/** A test pushed to the device asking, now, so it can be seen to arrive (CHECKIN-12). */
export const sendTestCheckIn = onCall({ region: REGION, secrets: [vapidPublicKey, vapidPrivateKey] }, async (request) => {
  const accountId = request.auth?.uid
  if (accountId === undefined) throw new HttpsError('unauthenticated', 'Sign in to send a test check-in.')

  const deviceId: unknown = (request.data as { deviceId?: unknown } | null)?.deviceId
  if (typeof deviceId !== 'string' || deviceId === '' || deviceId.includes('/')) {
    throw new HttpsError('invalid-argument', 'A test is sent to one device, named by its id.')
  }

  const saved = await db.doc(`users/${accountId}/pushSubscriptions/${deviceId}`).get()
  const registration = saved.exists ? readPushRegistration(saved.data()) : null
  if (registration === null) throw new HttpsError('not-found', 'This device is not set up for check-ins.')

  if ((await send(registration.subscription, TEST_PUSH)) === 'gone') {
    await saved.ref.delete()
    throw new HttpsError('failed-precondition', 'This device no longer receives notifications. Turn it on again.')
  }
  return { sent: true }
})
