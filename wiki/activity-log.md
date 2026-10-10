# Activity log

The day as it was spent, hour by hour. Tasks say what was meant to be done and whether it was; the
**Activity log** says where the hours actually went — "Reading 15m" at two in the afternoon, "Work
1h 20m" at three — so a day can be looked back on, and a week of them compared, without anything
having to be a task first. The [Check-in](check-ins.md) asks for it at the top of every hour, and
time logged on a task fills it in by itself (ACT-21).

## The page

- **ACT-1** **Activity log** is a page of its own, at `#/activity` (UI-36), with an entry in the
  sidebar under Balance, the two of them a group of their own (UI-30), and a row on More's page (UI-45). It opens on the
  heading **Activity log** with an **i** beside it (UI-73), saying in plain sentences what the page
  is for and how each control is used; then the Check-in's row (ACT-19); then what the period shown
  adds up to (ACT-12 to ACT-18); and, on a day, the day itself — the form to add to it and its hours
  (ACT-2 to ACT-11, ACT-20). It has no box for adding a task and no Plus: it is not a list of tasks.

## Adding to it

- **ACT-2** A **record** is what was done, how long it took, and the **hour of a day** it is
  logged under — a local day and an hour of its clock, so two in the afternoon on the 2nd stays that
  wherever it is read (PRIN-1). A record may be longer than its hour: what was logged under the hour
  is what was logged there, caught up on later or not. A record made from a task's time also knows
  **when it began** in its hour (ACT-21); one typed does not.
- **ACT-3** What was done is typed into **What did you do?**: anything on one line of up to 40
  characters, its spaces squeezed. Two records name the **same activity** whatever case they are
  written in, so "Reading" and "reading" are added up together; a name already used, typed again in
  another case, keeps the spelling it already has.
- **ACT-4** While **What did you do?** has the caret, the **activities used before** are offered
  under it — the ones used most these last thirty days first, then the ones used most lately —
  narrowed as letters are typed to the one of that name, then those it starts, then those it is
  anywhere in. Down and up pick one out and **Enter** takes it, as a press on one does; **Enter**
  with none picked out keeps what was typed. Either way the caret moves on to how long. Escape puts
  the list away.
- **ACT-5** The hour a record goes under is the one **picked in the day's list** (ACT-7): pressing
  an hour, or its **Log**, picks it out there, and brings the form into view with the caret in what
  was done. There is no line above the boxes for it — the hour is picked out in the list, and named in
  the empty box itself, `What did you do 14:00–15:00?`. The form starts on the **hour just gone**
  while nothing is logged under it — what a check-in asks about (CHECKIN-3) — and otherwise on the
  **hour under way**; on a day gone by, on its first hour meant to be logged that is not (ACT-17); and
  opened from a check-in, on the hour it asked about (CHECKIN-4). An hour that has **not started** —
  listed only because something was logged under it ahead of this device's clock — cannot take a
  record: adding under it is refused under the boxes, saying so.
- **ACT-6** How long is typed into the box beside it: a bare number is **minutes** (`15`), and
  `1h`, `1h 20m`, `1.5h` and `1:30` read as they are written (TIME-11). **Enter** there, or **Add**,
  logs it, and the boxes empty for the next record under the same hour. A record is a whole number of
  minutes from one minute to **24 hours**. What will not do is refused **in place** — under the boxes,
  the box at fault marked, and what was typed kept to be put right — with the reason: nothing typed
  for what was done, a name too long, nothing typed for how long, something that is no length of
  time, more than a day, or an hour not started. **Add** is never dimmed.

## Time logged on a task

- **ACT-21** Every session logged on a task (TIME-3) is **written into the log too**, under the
  task's title: by hand from the clock's panel, by the timer (TIME-15), or with a task as it is
  added. A session is taken to be the time **up to the moment it was logged** — 30 minutes logged
  at 11:30 is 11:00–11:30 — and a timer's run is from Start to Stop, to the second. It is **cut at
  every hour it crosses**, a record under each, so each hour is given what was spent in it: an hour
  logged at 11:10 is `10:10–11:00` under 10:00 and `11:00–11:10` under 11:00, and a run past
  midnight goes under the day before as well. The name is the title on one line, cut with `…` to
  the 40 characters a name can be (ACT-3), and spelled as the activity already is.
  Each record **says when it was spent** (ACT-7), and is otherwise a record like any other: it can
  be changed, moved or deleted (ACT-10, ACT-11), and keeps beginning as far into its hour as it did,
  so `11:00–11:30` moved to 14:00 is `14:00–14:30`. Two sessions logged one after the other each
  end when they were logged, so `+15m` pressed twice is `11:15–11:30` twice. **Taking a session
  back** with its **×** (TIME-4) — logged by mistake — **deletes its records** from the log too, as
  changed or moved as they may be; a session let go of with time (TIME-8), or a task deleted, leaves
  them, the time having been spent. **Changing a session's length** (TIME-24) writes its records
  again: those it made go, as changed or moved as they may be, and the new length is cut into hours
  back from when it was logged, as if logged so then — 30 minutes logged at 11:30 changed to 45 is
  `10:45–11:00` and `11:00–11:30`. A session whose records were all deleted from the log stays out
  of it, and changing only its comment leaves the log alone. Time logged straight to a Balance category (BAL-14) is not
  written here. The records are written while the Activity log is switched off too (FEAT-5).

## The day

- **ACT-7** On **Day** the hours are listed under the form, in clock order: the hours **meant to be
  logged** (ACT-17) that have begun — all of them on a day gone by — and any other hour with something
  logged under it, so a record made at night is never hidden; today, on asking, every other hour so
  far as well (ACT-20). The hour under way is marked **now**, and the hour the form is pointed at is
  picked out. Each hour lists its records in the order they were written down, each as what and how
  long — `Work 45m` — after a swatch of its activity's colour, with when it was spent after that,
  fainter, when the record knows (ACT-21) — `Work 30m 11:00–11:30` — and ends with the hour's total. A long day **scrolls inside its own box** rather than pushing the
  page down, and the hour picked is kept in view in it, scrolled within the box alone.
- **ACT-8** Each hour carries a **bar the hour long**: a full bar is the whole hour, each record a
  piece of it in its activity's colour (ACT-16), so a day read down the list shows at a glance which
  hours were full, which half-empty and which were what. More than an hour logged under one hour
  fills the bar, and the total says how much more — `+20m`.
- **ACT-9** An hour meant to be logged with nothing under it says **not logged**, and a **Log**
  button beside it points the form at it (ACT-5). Any other hour listed with nothing under it says
  **nothing logged**.
- **ACT-10** Pressing a record **changes it** in the form: a line over the boxes names it and its
  hour — `Change “Work 45m” · 09:00–10:00` — and says **Press another hour to move it.**; the boxes hold
  what the record says, how long written out, `45m`. Pressing another hour in the list while changing
  it moves the record there, of the same day. **Save**, or Enter in how long, keeps the change;
  **Cancel** or Escape leaves it as it was. A refusal is the same as when adding (ACT-6).
- **ACT-11** A record's **×**, or **Delete** while changing it, takes it out of the log, with the
  few seconds' **Undo** a deleted task has (UI-38), naming it: `Deleted “Work 45m” at 10:00`.
- **ACT-20** **Today**, any hour that has begun can be logged, not only the hours meant to be logged.
  While some are not listed — the night before them, say, or the hour under way after them — a
  **Show every hour so far** button over the list lists every hour of today from 00:00 to the one
  under way, in clock order with the rest, the hour picked kept in view. Pressed again, as **Show
  only the hours to log**, it puts the others away; an hour picked or with something logged under it
  stays listed either way. A day gone by has no such button: it keeps to its hours meant to be logged.
  Which way it was left is not kept: the page, and each day stepped to, opens on the hours to log.

## What it adds up to

- **ACT-12** The log is read over a **Day**, a **Week** or a **Month**, chosen with three segments,
  the week Monday to Sunday and the month the calendar month (PROG-1). **‹** and **›** beside them
  step back a day, a week or a month at a time, and forward again as far as the one under way, and
  between them the period is named — `Today`, `Yesterday`, `Tue, Sep 29`; `This week`, `Last week`,
  `Sep 14 – 20`; `This month`, `September 2026`. Changing the period keeps the day it is read from.
  The page opens on **Today** every time; which period was chosen is not kept, as on Balance (BAL-2).
- **ACT-13** What the period adds up to is **one chart**, drawn as the Balance page draws its own
  (BAL-6): the total, large; a single bar divided into a piece per activity with time in the period,
  its share written inside it when it fits; and a legend naming every piece with its time and share,
  a press on one picking it out in this chart and the day-by-day one. A screen reader hears the bar
  as one sentence, the period in it — `Time spent yesterday, 1h: Work 1h, 100%`. With nothing logged
  the chart gives way to **Nothing logged today.** — this week, on Tue, Sep 29, in September 2026.
- **ACT-14** On **Week** and **Month** the period is drawn **day by day** under the legend, a column
  for each day divided between the activities, as Balance draws it (BAL-13). Pointing at a day, or
  focusing it, says how its time divided in the line above the columns; **pressing a day opens it**,
  on Day.
- **ACT-15** The records are the **account's**, kept a day at a time (STORE-51): every device signed
  in shows the same log, a change made on one appears on the others, a guest's is kept in the browser
  and moved in on signing in (STORE-37, STORE-38), and they are in the backup (BAK-2, BAK-18).
- **ACT-16** Each activity has a **colour of its own**, the same in the bar, the day-by-day chart
  and the hours: given in the order the activities were **first logged**, so an activity keeps its
  colour whatever period or day is shown. There are eight colours (BAL-6); past the eighth activity
  they come round again, and the legend names every piece either way.
- **ACT-17** Above the chart, how much of the day is **logged**: of the hours **meant to be
  logged** — the hours the Check-in keeps to, From to To, whether or not it is on (CHECKIN-2) — how
  many are over, and how many of those have something under them: `4 of 6 hours logged so far`
  today, `13 of 13 hours logged` on a day gone by, and before the first is over, `13 hours to log
  today`. A record under an hour outside them counts in the chart but not here.
- **ACT-18** A day is **logged in full** once every hour meant to be logged is over and has
  something under it. On **Week** and **Month** the line says how many of the period's days up to
  today were — `3 of 5 days logged in full`.
- **ACT-19** At the head of the page the **Check-in** has its row, as on the Modes page (MODE-3):
  its glyph, what it does, where it stands — `Every hour · 09:00–22:00` — and its switch, which
  turns it on or off here at once; the rest of the row opens its page, where its hours are set
  (CHECKIN-2).

---

**Where it lives:** `src/core/activity.ts` (a record, the names, the activities offered, what they
add up to, the periods, a task's session as records, and written again for a new length),
`src/core/timeLog.ts` (the sessions a change logs or resizes), `src/app/useTasks.ts` (telling of them), `src/core/checkIn.ts` (the hours meant to be logged, the other hours of today, how much of a
day is logged, the hour the form starts on), `src/app/useActivities.ts`,
`src/app/components/ActivityPage.tsx`, `src/app/components/ActivityForm.tsx` (adding and changing a
record), `src/app/components/ActivityHours.tsx` (the day, hour by hour),
`src/app/components/TimeSplitChart.tsx` and `src/app/components/DayColumnsChart.tsx` (the charts,
shared with [Balance](balance.md)), `src/app/activityPieces.ts` and `src/app/chartColors.ts` (the
pieces and their colours), `src/app/activityLabels.ts` and `src/app/chartLabels.ts` (wording),
`src/app/components/ActivityIcon.tsx`, `src/app/components/ModesPage.tsx` (the Check-in's row),
`src/app/useUndoToast.ts`, `src/app/TasksScreen.tsx`, `src/app/view.ts`,
`src/app/components/SideNav.tsx`, `src/app/components/MorePage.tsx`; saving: [Storage](storage.md).
**Tested in:** `src/core/activity.test.ts`, `src/core/checkIn.test.ts`, `src/core/timeLog.test.ts`,
`src/app/useActivities.test.ts`, `src/app/useTasks.test.ts`,
`src/app/components/ActivityPage.test.tsx`, `src/app/activityLabels.test.ts`,
`src/app/chartLabels.test.ts`, `src/storage/activitySchema.test.ts`,
`src/storage/localActivityRepository.test.ts`, `src/app/components/SideNav.test.tsx`,
`src/app/components/MorePage.test.tsx`, `src/app/components/BottomNav.test.tsx`, `src/app/view.test.ts`,
`src/app/useView.test.ts`.
