import { UNDER_REWARDS, VIEW_LABELS, type RewardsView } from '../view'
import { VIEW_ICONS } from '../viewIcons'

const PAGES: readonly RewardsView[] = ['rewards', ...UNDER_REWARDS]

const pill =
  'flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-sm whitespace-nowrap transition-colors [-webkit-tap-highlight-color:transparent]'
const pillOn = 'bg-neutral-200/80 font-medium text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
const pillOff = 'text-neutral-500 hover:bg-neutral-100 active:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:active:bg-neutral-800/60'

/**
 * The way between the rewards pages on a phone: how the points stand, the
 * history, the wishlist and the rules, in a strip across the top of whichever
 * one is open, the one you are on marked (RWD-30). A wide screen has them in
 * the sidebar under Rewards (UI-30), so the strip is a phone's alone — the same
 * split as the buttons at the foot of Tasks (UI-34).
 *
 * It scrolls sideways rather than wrapping: four pills is one line on any phone
 * worth having, and a second line would push the points themselves down.
 */
export function RewardsNav({ view, onChange }: { view: RewardsView; onChange: (view: RewardsView) => void }) {
  return (
    <nav
      aria-label="Rewards"
      className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex gap-1">
        {PAGES.map((page) => {
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
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
