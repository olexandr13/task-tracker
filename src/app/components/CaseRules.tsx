import type { ReactNode } from 'react'
import { CASES_RULE_MAX, CASES_RULE_MIN, describeCasesRules, SOURCE_LABEL } from '../caseLabels'
import { CASE_STRIPE } from '../caseTones'

/** The arithmetic in a rule, set apart from the words between it. */
const OPERATOR = /(÷ \d+|\+)/

const label =
  'w-10 rounded-md bg-neutral-200/70 py-0.5 text-center text-[11px] font-semibold tracking-wider text-neutral-600 uppercase dark:bg-neutral-700/60 dark:text-neutral-300'

/**
 * How each case is worked out, behind the i on Cases (CHST-22): a card for each
 * case, banded down its side in the case's own colour as on the page (CHST-28),
 * with what it pays at least and at most beside "Min" and "Max". Tasks
 * without points are named only while they are counted (CHST-32).
 */
export function CaseRules({ countUnpaid }: { countUnpaid: boolean }) {
  return (
    <div className="flex flex-col gap-3 pt-1">
      {describeCasesRules(countUnpaid).map((rule) => (
        <section
          key={rule.source}
          aria-label={SOURCE_LABEL[rule.source]}
          className="relative overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 py-3 pr-3 pl-4 dark:border-neutral-800 dark:bg-neutral-800/40"
        >
          <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${CASE_STRIPE[rule.source]}`} />
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{SOURCE_LABEL[rule.source]}</h3>
          <dl className="mt-2 grid grid-cols-[auto_1fr] items-baseline gap-x-3 gap-y-2">
            <dt className={label}>{CASES_RULE_MIN}</dt>
            <dd>{formula(rule.min)}</dd>
            <dt className={label}>{CASES_RULE_MAX}</dt>
            <dd>{formula(rule.max)}</dd>
          </dl>
        </section>
      ))}
    </div>
  )
}

/** A rule with its ÷ and + drawn heavier, so the sum reads at a glance. */
function formula(text: string): ReactNode[] {
  return text.split(OPERATOR).map((part, index) =>
    index % 2 === 1 ? (
      <span key={index} className="font-semibold text-neutral-900 dark:text-neutral-100">
        {part}
      </span>
    ) : (
      part
    ),
  )
}
