import { organizePagesShown, useFeaturesOff } from '../features'
import type { FixedView } from '../view'
import { PageLinks } from './PageLinks'

interface OrganizePageProps {
  onOpen: (view: FixedView) => void
  /** How many modes are on, for the note on the Modes row (MODE-1). */
  modesOn?: number
}

/**
 * Organize's page (UI-81): Tags (TAG-18), the notes (NOTE-1) and Modes
 * (MODE-1), in the sidebar's order, each a row to go to. The Modes row says how
 * many modes are on, so whether any is can be seen without opening it. A page
 * switched off on Settings is not listed (FEAT-2).
 */
export function OrganizePage({ onOpen, modesOn = 0 }: OrganizePageProps) {
  return (
    <PageLinks
      pages={organizePagesShown(useFeaturesOff())}
      notes={modesOn > 0 ? { modes: `${String(modesOn)} on` } : {}}
      onOpen={onOpen}
    />
  )
}
