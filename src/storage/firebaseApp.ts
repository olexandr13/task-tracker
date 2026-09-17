import { initializeApp } from 'firebase/app'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'

/**
 * The Firebase project behind the app: project `task-tracker-a6e9e`, web app
 * "Task Tracker Web". Its settings are printed by
 * `npx -y firebase-tools@latest apps:sdkconfig WEB --project task-tracker-a6e9e`.
 *
 * They come from `VITE_FIREBASE_*` variables — `.env.local` in development, the
 * Vercel project's environment variables in production — so no key is kept in
 * the repository. Every browser that loads the app is still sent them: what
 * keeps one account's data from another is the project's security rules
 * (`firestore.rules`), not these values.
 */
const SETTINGS = {
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
}

const missing = Object.entries(SETTINGS)
  .filter(([, value]) => !value)
  .map(([name]) => name)

// Failing here names what to set; failing on first sign-in would not.
if (missing.length > 0) {
  throw new Error(`Firebase is not configured: set ${missing.join(', ')} (see .env.example).`)
}

export const firebaseApp = initializeApp({
  apiKey: SETTINGS.VITE_FIREBASE_API_KEY,
  authDomain: SETTINGS.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: SETTINGS.VITE_FIREBASE_PROJECT_ID,
  appId: SETTINGS.VITE_FIREBASE_APP_ID,
})

/**
 * The database, with a copy of what it holds kept in the browser and shared by
 * every open tab: the tasks open offline, and changes made offline are sent once
 * there is a connection. Set up here, once, because Firestore can only be set up
 * once per page.
 */
export const firestore = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})
