# Journal

The day's good side, written down while it is still fresh: what **went well**, what was
**achieved**, and what there is to be **grateful** for — about five lines of each. The tasks say
what was meant to be done; the journal says what was good about the day, so an evening ends on what
went right rather than on what is left.

## The page

- **JRN-1** **Journal** is a page of its own, at `#/journal` (UI-36), with an entry in the sidebar
  under the Activity log, in the group that looks back at the day (UI-30), and a row on More's page
  (UI-45). It opens on the heading **Journal** with an **i** beside it (UI-73), saying in plain
  sentences what the page is for and how it is used, and under the heading the day it is writing
  about — `Saturday, October 10`. Then come three cards, one for each **section**, in this order:
  ☀️ **Good things today**, 🏆 **Achievements** and 🙏 **Gratitude**; then the button to the week
  gone by (JRN-6). It has no box for adding a task, no Plus and no rail: it is not a list of tasks.

## Writing it

- **JRN-2** A **line** is one thing, on one line, of up to 200 characters, its spaces — line breaks
  pasted in too — squeezed to one. Under a section's lines one more is always **waiting** for the
  next, its placeholder saying what goes there — *Something good that happened*, *Something you got
  done*, *Something you’re grateful for*. **Enter** writes what was typed and leaves the caret on the
  waiting line for the one after, so five can be written straight down; clicking away keeps what was
  typed, as a rename does; Enter on an empty line does nothing, and **Escape** empties it. A line is
  saved once, as it is left, not a keystroke at a time.
- **JRN-3** Each section asks for **five**: its lines are **numbered**, and until there are five
  the numbers still to fill are drawn faint under the waiting line, a press on one putting the caret
  there. Five **dots** beside the heading fill blue as lines are written and turn **green** at five;
  past five, they say how many more — `+2`. Five is something to aim at, **not a limit**: there is
  always a waiting line, and fewer is fine too. A screen reader hears the dots as `3 of 5 written`,
  or `6 written, 5 reached`.
- **JRN-4** A line written **reads as text and is changed in place**: pressing it puts the caret in
  it. What is typed is kept as the caret leaves — by a click elsewhere, **Enter** or **↓**, which
  move to the line below, or **↑**, which moves to the line above. **Escape** puts the line back as
  it was. A line keeps its place among the others however it is changed.
- **JRN-5** A line is **deleted** by its **×** — on a wide screen shown on the line pointed at or
  being written, on a phone always there (UI-47) — or by **emptying it** and leaving it.
  **Backspace** in an empty line moves the caret to the end of the line above, so a line emptied
  that way goes too. Either way the few seconds' **Undo** a deleted task has (UI-38) names it:
  `Deleted “Coffee with Anna”`.

## Looking back

- **JRN-6** Under the cards, **Show the last 7 days** shows the week gone by, and **Hide the last 7
  days** puts it away again. It is **hidden** whenever the page is opened: which way it was left is
  not kept. Each day with anything written is a card of its own, **latest first** — `Yesterday`,
  then `Thu, Oct 8` — holding its sections' lines in the order they were written, a section with
  nothing in it left out. The days gone by are **read, not changed**. With nothing written all week
  it says `Nothing written in the last 7 days.`

## What is kept

- **JRN-7** The journal is the **account's** (STORE-60): every device signed in shows the same
  lines, a line written on one appears on the others, a guest's is kept in the browser and moved in
  on signing in (STORE-37, STORE-38), and it is in the backup (BAK-21).
- **JRN-8** The journal keeps **today and the 7 days before it**, and **deletes the days older
  than that**, whole: it is a habit of noticing, not an archive. They are let go of as the journal
  loads, and again each day the app stays open, on every device — while **Journal** is switched off
  too (FEAT-5). A backup imported later does not bring them back (BAK-21).
- **JRN-9** The page is always **today's**: what is written goes under the local day it is written
  on (PRIN-1). Nothing moves at midnight; a page left open starts the new day's cards empty on its
  next render, and the day before is in the history (JRN-6). Anything half typed on a line not yet
  left is let go of with the old day.
- **JRN-10** **Journal** can be switched off on Settings (FEAT-1). Off, the page goes from the
  sidebar and from More (FEAT-2), and an address naming it opens More (UI-37); what was written
  stays, the week kept as ever (JRN-8).

---

**Where it lives:** `src/core/journal.ts` (a line, the sections, the goal, which days are kept, the
history), `src/app/useJournal.ts` (holding it, and letting the old days go),
`src/app/components/JournalPage.tsx` (the page and the history),
`src/app/components/JournalSection.tsx` (a section's lines, the waiting line, the dots),
`src/app/journalLabels.ts` (wording), `src/app/components/JournalIcon.tsx`, `src/app/useUndoToast.ts`,
`src/app/TasksScreen.tsx`, `src/app/view.ts`, `src/app/components/SideNav.tsx`,
`src/app/components/MorePage.tsx`; saving: [Storage](storage.md).
**Tested in:** `src/core/journal.test.ts`, `src/app/useJournal.test.ts`,
`src/app/components/JournalPage.test.tsx`, `src/storage/journalSchema.test.ts`,
`src/storage/backupFile.test.ts`, `src/storage/backupRepository.test.ts`, `src/app/features.test.ts`,
`src/app/components/SideNav.test.tsx`, `src/app/components/MorePage.test.tsx`,
`src/app/components/BottomNav.test.tsx`.
