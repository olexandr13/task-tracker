# Balance

Ticking tasks off all day and never resting leaves nothing for the evening. **Balance** is a page
that shows where the logged time went, divided into **categories the owner names** — Work, Chores,
Rest, any number of them, called anything — so a day spent all on one of them is seen as that. It
shows the amounts and nothing else: no targets and no ratio to keep to, only the imbalance, plainly.

A category is **bound to tags** the app already has. A task is put in a category the way it is put
anywhere else, by tagging it: a walk with the dog tagged `walk`, with `walk` bound to Rest, is rest.

## The page

- **BAL-1** **Balance** is a page of its own, at `#/balance` (UI-36), with an entry in the sidebar
  between Rewards and Modes (UI-30) and a row on More's page (UI-45). It opens on the heading
  **Work–rest balance**, an **i** beside it (UI-73) saying what the page is for and how categories
  work; then the time spent (BAL-2 to BAL-6, BAL-13); then the categories themselves, made and
  changed in place (BAL-7 to BAL-10). It has no box for adding a task and no Plus: it is not a list
  of tasks.
- **BAL-2** The time spent is shown for **Today**, **Week** or **Month**, chosen with three segments
  at the head of the totals — the same periods as the progress bars (PROG-1): today from local
  midnight, the week Monday to Sunday, and the calendar month. The page opens on **Today** every
  time, since whether there has been any rest yet today is the question it is mostly asked; which
  one was chosen is not kept.

## What counts

- **BAL-3** Every **session** logged on a task (TIME-3) counts in the period it was **logged in**,
  to the second (TIME-22), whether or not the task has a time goal. A session logged by hand counts
  when it was logged, not over the time before it. Time on a task **in the trash** still counts,
  until the task is purged. Under a repeating task, the sessions of occurrences gone by still count
  where they fell, though they no longer count toward the task's goal (TIME-7): they are kept for
  thirty days, and never less than the calendar month, so the month on this page is always whole
  (TIME-8). Such a session is not listed in the clock's panel, so it cannot be taken back there; it
  drops out of the history by itself once old enough. Dropping a task's rule lets go of them early
  (TIME-8). A timer still running counts once it is stopped and logged (TIME-15). Time logged on a
  task finished before this week and this month counts once that task is loaded (STORE-55).
- **BAL-4** A task's time is **divided evenly** between the categories its tags are bound to. A
  30-minute walk to the office tagged `job` and `walk` counts 15 minutes toward Work and 15 toward
  Rest; a task bound to one category through two of its tags counts once. So the pieces always add
  up to the total, and every second is counted once.
- **BAL-5** Time on a task none of whose tags is bound to a category — or with no tags at all — is
  **Other**, the last piece of the chart, shown only when there is time in it. The **total** is
  every second logged in the period: the categories and Other added up.

## On screen

- **BAL-6** The time spent is **one chart**: the total, large, and under it a single bar divided
  into a piece per category with time in the period, in the order the categories were made, then
  Other. A piece's length is its time; its **share** in whole percent is written inside it when the
  piece is big enough to hold it (12% and up). Under the bar a **legend** names every piece — a
  swatch, its name, its time and its share — so the colours are never the only way to tell them
  apart. Shares add up to exactly 100: each is rounded down, and the points left over go to the
  largest remainders. Each category has a **colour of its own**, the same wherever it is drawn and
  whatever period is shown, given by its place in the order the categories were made — renaming one
  leaves its colour alone, deleting one moves the colours of those made after it up one — and Other
  is grey. The eight colours are chosen so neighbouring pieces stay apart for colour-blind eyes too.
  **Pressing a piece in the legend picks it out**: the other pieces fade, in this chart and the
  day-by-day one (BAL-13), until it is pressed again; pointing at a piece or a legend row, or
  focusing the row, picks it out for as long as it is pointed at. What is picked out stays across a
  change of period. Time spelled out is in whole minutes, `<1m` for less than one. A screen reader
  hears the bar as one sentence: the period, the total, and each piece with its time and share. With
  nothing logged in the period the chart gives way to **No time logged today.** (this week, this
  month). With no categories yet the whole bar is Other, and the page says to add one below.

## Categories

- **BAL-7** A box at the head of the categories, **Add a category**, makes one on Enter or its
  **Add** button, bound to no tag yet; the box empties and stays for the next. A name is anything on
  one line of up to 40 characters, its spaces squeezed. A name another category has already,
  whatever its case, makes nothing: the box says so and keeps what was typed. **Add** with nothing
  typed says to type a name first rather than being dimmed. There can be **at most eight**
  categories, one for each colour the chart has (BAL-6): a ninth is refused the same way, saying so.
  The categories are listed in the order they were made, a new one at the end.
- **BAL-8** Beside each category a pencil **renames it in place**, as a tag is renamed (TAG-24): the
  name turns into a box with the caret in it, and Enter or leaving the box renames it. Escape, or the
  name unchanged, leaves it as it was. A name another category has is refused, and the row says so
  and keeps what was typed.
- **BAL-9** Under its name each category shows the tags bound to it, as `#walk` chips, each with an
  **×** that unbinds it — or **No tags bound yet.** Its **tag button** opens the same panel a task's
  does (TAG-7): every tag there is, the bound ones ticked, a click binding or unbinding one, and a
  name typed and Entered binding it, making the tag first if there is none of that name. A tag made
  this way is kept (TAG-6), so it is there to give a task. A tag is bound once, spelled as it is
  spelled everywhere else (TAG-4), and the chips are in alphabetical order.
- **BAL-10** The **×** at a category's end deletes it, with the few seconds' **Undo** a deleted
  task has (UI-38), naming it: `Deleted the category “Rest”`. The tags and the time logged stay as
  they were; only the division into it goes.
- **BAL-11** A tag **renamed** on the Tags page (TAG-24) stays bound to its categories under the new
  name; a tag **deleted** (TAG-22) is unbound from every category. A category bound to both a tag
  and the name it is renamed to is left with it once.
- **BAL-12** The categories are the **account's**, kept as records of their own (STORE-50): every
  device signed in shows the same ones, a guest's are kept in the browser and moved in on signing in
  (STORE-38), and they are in the backup (BAK-2, BAK-17).

## Day by day

- **BAL-13** On **Week** and **Month**, under the legend, the period is drawn **day by day**: a
  column for each day — Monday to Sunday, or every day of the month, days with nothing logged
  included — divided between the categories as the bar is (BAL-4, BAL-6), in the same colours, so a
  day with no rest in it stands out. The columns stand against two gridlines in round hours, the top
  one the first of 1, 2, 3, 4, 6, 8, 12, 16 and 24 hours the busiest day fits under, labelled
  (`6h`, `3h`). Under them each day of a week is named (`Mon`); a month names the 1st, 8th, 15th,
  22nd and 29th, so the numbers never crowd; today's name is marked. **Pointing at a day**, or
  focusing it, says how its time divided in the line above the columns — `Tue, Sep 15 · 6h 15m`, then
  each piece with its swatch and time, or that nothing was logged — and **pressing it** keeps it
  said until it is pressed again or another is. A screen reader hears the same for each day. Today
  has no such chart: it is a single day. Nothing logged in the period draws neither chart.

---

**Where it lives:** `src/core/balance.ts` (categories, binding, following a tag renamed or deleted,
and the totals), `src/core/timeLog.ts` (how long sessions are kept), `src/app/useCategories.ts`,
`src/app/components/BalancePage.tsx`, `src/app/components/TimeSplitChart.tsx` (the bar and its
legend) and `src/app/components/DayColumnsChart.tsx` (day by day) — both shared with the
[Activity log](activity-log.md) — `src/app/balancePieces.ts` and `src/app/chartPieces.ts` (what each
chart is divided into), `src/app/chartColors.ts` (the colours), `src/app/components/BalanceIcon.tsx`,
`src/app/balanceLabels.ts` and `src/app/chartLabels.ts` (wording), `src/app/TasksScreen.tsx` (the page, and tags followed through), `src/app/view.ts`,
`src/app/components/SideNav.tsx`, `src/app/components/MorePage.tsx`, `src/app/useUndoToast.ts`;
saving: [Storage](storage.md).
**Tested in:** `src/core/balance.test.ts`, `src/core/timeLog.test.ts` (the history kept),
`src/app/useCategories.test.ts`, `src/app/components/BalancePage.test.tsx`, `src/app/chartLabels.test.ts`,
`src/app/components/UndoToast.test.tsx`, `src/storage/categorySchema.test.ts`,
`src/storage/localCategoryRepository.test.ts`, `src/app/components/MorePage.test.tsx`,
`src/app/components/SideNav.test.tsx`, `src/app/components/BottomNav.test.tsx`, `src/app/view.test.ts`,
`src/app/useView.test.ts`.
