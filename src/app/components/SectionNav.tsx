import { rewardsPagesShown, useFeaturesOff } from '../features'
import { VIEW_LABELS, type RewardsView } from '../view'
import { VIEW_ICONS } from '../viewIcons'
import { KeyWaitingMark } from './KeyWaitingMark'

const pill =
  'flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-sm whitespace-nowrap transition-colors [-webkit-tap-highlight-color:transparent] md:min-h-8 md:px-3'
const pillOn = 'bg-neutral-200/80 font-medium text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
const pillOff = 'text-neutral-500 hover:bg-neutral-100 active:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:active:bg-neutral-800/60'

/**
 * The way between the rewards pages: how the points stand, the cases, the
 * history, the prizes, the wishlist and the rules, in a strip across the top of
 * whichever one is open, the one you are on marked (RWD-30). A phone has no
 * sidebar, so it is the way there; a wide screen has them under Rewards in the
 * sidebar too (UI-30), and the strip saves going back to it to step from one to
 * the next. Its pills are a thumb's height on a phone and compact on a wide
 * screen (UI-49).
 *
 * It scrolls sideways rather than wrapping: a pill or two beyond the width of a
 * phone is a sideways nudge away, and a second line would push the points
 * themselves down. Cases has no pill while it is switched off (FEAT-2).
 */
export function RewardsNav({
  view,
  keyWaiting = false,
  onChange,
}: {
  view: RewardsView
  /** Whether a key is waiting, which marks the Cases pill (CHST-22). */
  keyWaiting?: boolean
  onChange: (view: RewardsView) => void
}) {
  const pages: readonly RewardsView[] = ['rewards', ...rewardsPagesShown(useFeaturesOff())]

  return (
    <nav
      aria-label="Rewards"
      className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex gap-1">
        {pages.map((page) => {
          const Icon = VIEW_ICONS[page]
          const active = view === page
          return (
            <li key={page}>
              <button
                type="button"
                onClick={() => { onChange(page) }}
                aria-current={active ? 'page' : undefined}
                className={`${pill} ${active ? pillOn : pillOff}`}
              >
                <Icon className="size-4 shrink-0" />
                {VIEW_LABELS[page]}
                {page === 'rewards/cases' && keyWaiting && <KeyWaitingMark />}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
