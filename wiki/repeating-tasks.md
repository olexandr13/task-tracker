# Repeating tasks

A task that comes back. The whole feature turns on one idea: a repeating task is **one record**,
and whether it reads as done is derived from the occurrence currently in play rather than stored.

## The rules on offer

- **RPT-1** A task can repeat **daily**, **weekly** on chosen weekdays, or **monthly** on a chosen
  day of the month.
- **RPT-2** A repeating task is one task, not a fresh one each day. No completion history
  accumulates, and nothing is created in the background.
- **RPT-3** A rule stores no dates of its own. It answers one question — given a moment, which day
  is the occurrence in play? — and everything else follows from that answer and the single stored
  completion time.

## Which occurrence is in play

- **RPT-4** **Daily**: today, from local midnight, whatever the time of day.
- **RPT-5** **Weekly**: today when today is one of the chosen days, otherwise the most recent
  chosen day before it — reaching back into the previous week where it has to.
- **RPT-6** **Monthly**: this month's day once it has arrived, otherwise last month's — rolling
  back across the turn of the year on its own.
- **RPT-7** A monthly day past the end of a short month falls on that month's **last** day: the
  31st lands on the 30th of a 30-day month, and on the 28th or 29th of February.

## Done, and done again

- **RPT-8** Completing a repeating task stamps the time, like any other.
- **RPT-9** It reads as done while its completion sits at or after the start of the occurrence in
  play, and as todo once the next occurrence arrives — without anything rewriting it at midnight.
- **RPT-10** A weekly task ticked off on Monday stays done until its next chosen day comes round,
  not until Tuesday.
- **RPT-11** Un-completing undoes the occurrence in play only.

## Changing a rule

- **RPT-12** An existing task can be given a rule, swapped to another, or have its rule dropped,
  and the change is saved straight away — no separate confirm step.
- **RPT-13** Giving a rule to a one-off that was finished today keeps that completion: it is still
  done today.
- **RPT-14** Dropping the rule while the task is **not** currently done clears the stale completion
  with it, so a repeat that had already come round again does not reappear as a finished one-off. A
  completion that is still standing is kept.
- **RPT-15** A rule that could never come round is refused: a weekly rule needs at least one
  weekday, and a monthly day must be between 1 and 31.

## The picker

- **RPT-16** Repeat is **one control**, not a row of them: a small button that opens a panel
  holding every choice, so the add row stays a single line.
- **RPT-17** The button shows the rule in words when there is one, and is plain when there is not.
  On a task row a rule stays on show at rest, while a plain button appears only once the row is
  clicked into; in the add row it is always there.
- **RPT-18** Choosing the kind already chosen turns it back off, so the task happens once.
- **RPT-19** Weekly shows the seven days, Sunday first. The last selected day cannot be removed —
  it would leave a rule with no occurrences.
- **RPT-20** Monthly offers days 1–31, and warns from 29 up that shorter months fall back to their
  last day.
- **RPT-21** The weekday and month-day choices survive switching between kinds inside the panel, so
  flipping to Daily and back does not lose them.
- **RPT-22** The panel closes itself once there is nothing more to choose — on Daily, and on
  clearing the rule. Weekly and monthly open their own choices below and stay for them, closing on
  a click outside or Escape. There is no **OK**: every choice is already saved as it is made, so a
  confirm step would only have been a second way to do nothing.
- **RPT-23** Clicking outside the panel, or pressing Escape, closes it.

## How a rule reads

- **RPT-24** A daily rule reads "Daily"; a weekly rule reads "Every Mon, Wed"; a monthly rule reads
  "Every month on the 5th".
- **RPT-25** A weekly rule covering all seven days reads "Daily" — it is a daily rule under another
  name.
- **RPT-26** While a repeating task is done, the row says how long that holds — "done today", "done
  this week", "done this month". It is dropped on narrow screens, where the width is worth more.

---

**Where it lives:** `src/core/repeat.ts` (the rules), `src/core/task.ts` (`isComplete`,
`setRepeat`), `src/app/repeatDraft.ts` (what the picker holds while choosing),
`src/app/repeatLabels.ts` (wording), `src/app/components/RepeatPicker.tsx`.
**Tested in:** `src/core/repeat.test.ts`, `src/core/task.test.ts`.
