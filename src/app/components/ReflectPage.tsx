import { reflectPagesShown, useFeaturesOff } from '../features'
import type { FixedView } from '../view'
import { PageLinks } from './PageLinks'

interface ReflectPageProps {
  onOpen: (view: FixedView) => void
}

/**
 * Reflect's page (UI-83): Balance (BAL-1), the activity log (ACT-1) and the
 * journal (JRN-1), in the sidebar's order, each a row to go to. A page
 * switched off on Settings is not listed (FEAT-2).
 */
export function ReflectPage({ onOpen }: ReflectPageProps) {
  return <PageLinks pages={reflectPagesShown(useFeaturesOff())} onOpen={onOpen} />
}
