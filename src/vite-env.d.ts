/// <reference types="vite/client" />

/** The app's version from `package.json` (`MAJOR.MINOR.PATCH`), set by Vite at build time. */
declare const __APP_VERSION__: string

/** Settings read from `.env.local` (or the host's environment) at build time. */
interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string
  readonly VITE_FIREBASE_PROJECT_ID?: string
  readonly VITE_FIREBASE_APP_ID?: string
}
