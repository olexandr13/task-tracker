import type { ReactNode } from 'react'
import {
  CASES_RULE_MAX,
  CASES_RULE_MIN,
  CASES_RULE_WHEN,
  describeCasesRules,
  SOURCE_LABEL,
} from '../caseLabels'
import { CASE_STRIPE } from '../caseTones'

/** The arithmetic in a rule, set apart from the words between it. */
const OPERATOR = /(÷ \d+|\+)/

const label =
  'w-10 rounded-md bg-neutral-200/70 py-0.5 text-center text-[11px] font-semibold tracking-wider text-neutral-600 uppercase dark:bg-neutral-700/60 dark:text-neutral-300'

/**
 * How each case works, behind the i on Cases (CHST-22): a card for each case,
 * banded down its side in the case's own colour as on the page (CHST-28), with
 * when it comes beside "When", then what it pays at least and at most beside
 * "Min" and "Max". Each part of the Max says in brackets which tasks it takes,
 * so an average of the tasks with points is not read as a count of every task
 * (CHST-10). Tasks without points are named only while they are counted
 * (CHST-32).
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
            <dt className={label}>{CASES_RULE_WHEN}</dt>
            <dd>{emphasizeToday(rule.when)}</dd>
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

/** Sets the list name apart where a line names it, so it reads as the list. */
function emphasizeToday(text: string): ReactNode {
  const name = 'Today'
  const at = text.indexOf(name)
  if (at < 0) return text
  return (
    <>
      {text.slice(0, at)}
      <strong className="font-semibold text-neutral-800 dark:text-neutral-100">{name}</strong>
      {text.slice(at + name.length)}
    </>
  )
}
