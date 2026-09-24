import { UNDER_MODES, VIEW_LABELS, type ModesView } from '../view'
import { VIEW_ICONS } from '../viewIcons'

const PAGES: readonly ModesView[] = ['modes', ...UNDER_MODES]

const pill =
  'flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-sm whitespace-nowrap transition-colors [-webkit-tap-highlight-color:transparent]'
const pillOn = 'bg-neutral-200/80 font-medium text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
const pillOff = 'text-neutral-500 hover:bg-neutral-100 active:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:active:bg-neutral-800/60'

/**
 * The way between a mode's page and the list it came from, and on to the other
 * mode: a strip across the top of each mode's own page, the one you are on
 * marked (MODE-7).
 *
 * Unlike the rewards strip (RWD-30) it is on a wide screen too: neither the
 * sidebar nor the bar lists the modes — they are two levels under More — so
 * without it there would be no one step back.
 */
export function ModesNav({ view, onChange }: { view: ModesView; onChange: (view: ModesView) => void }) {
  return (
    <nav aria-label="Modes" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden">
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
                <Icon className="inline-flex size-4 shrink-0 items-center justify-center text-sm leading-none" />
                {VIEW_LABELS[page]}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
