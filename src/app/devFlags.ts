/**
 * Parts of the app kept in the code but offered to nobody: each is switched on
 * for a build by a `VITE_*` variable (`.env.local`, see `.env.example`), and is
 * off everywhere else. Unlike the features on Settings (FEAT-1), nobody using
 * the app can turn one on.
 */
export const DEV_FLAGS = {
  /** Cases practice (CHST-21): its switch under Cases on Settings. */
  casesPractice: import.meta.env.VITE_CASES_PRACTICE === 'true',
} as const
