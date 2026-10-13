import { organizePagesShown, useFeaturesOff } from '../features'
import type { FixedView } from '../view'
import { PageLinks } from './PageLinks'

interface OrganizePageProps {
  onOpen: (view: FixedView) => void
}

/**
 * Organize's page (UI-81): Tags (TAG-18) and the notes (NOTE-1), in the
 * sidebar's order, each a row to go to. A page switched off on Settings is not
 * listed (FEAT-2).
 */
export function OrganizePage({ onOpen }: OrganizePageProps) {
  return <PageLinks pages={organizePagesShown(useFeaturesOff())} onOpen={onOpen} />
}
