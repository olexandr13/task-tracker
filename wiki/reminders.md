# Reminders

The app saying something when the hour a task was set for comes round. Where a [due date](due-dates.md)
puts a task in front of you on the right day, an hour on that day (DUE-19) puts it in front of you at
the right moment — so a task written down at nine in the morning is not remembered at nine at night.

## When it says something

- **REM-1** A task due at an **hour** (DUE-19) is reminded of when that hour **strikes** and the task
  is **still to do**. Nothing else is: a task due on a day with no hour to it has no moment to be
  reminded at, and one already done, or in the trash, has nothing left to say.
- **REM-2** An hour is said **once**. The app measures the stretch since it last read the clock and
  asks what fell inside it, so an hour is never announced twice however often the clock is read, and
  never missed for reading it a moment late. The stretch is only spent once there are tasks to read
  against it: an hour that struck while they were still loading is still said once they arrive.
- **REM-3** The stretch runs from **when this device started watching** — from opening the app, not
  from whenever the hour was set. An hour that went by while the app was closed is **not** announced
  on opening: it has been overdue all along, which the list says on its own (DUE-10), and a morning's
  worth of notifications at six in the evening would be noise rather than news.

## How it arrives

- **REM-4** On screen it is a **notice at the foot of the app**, with the other notices: the task
  whose hour has come round, named. A tap on it **goes to that task** and opens it, as the nudge
  (NUDGE-8) and the running timer's chip (TIME-20) do, so the next step is one move rather than a
  decision. Where several hours struck together the first is named and the rest counted — "and 2
  more" — a list of titles at the foot of the screen being a second screen.
- **REM-5** The notice **stands until it is answered**. It goes when it is **dismissed**, and when
  its task is **done, deleted or gone** — read from the tasks as they are, so finishing the task on
  another device takes the notice away here too, and a task renamed meanwhile is named as it is now.
  It is held on this device only, so a refresh clears it: unlike a nudge, nothing was spent on it —
  the task is still there, still overdue, and still says so on the list.
- **REM-6** Where the browser allows notifications there is also a **browser notification**, so the
  reminder lands while the app is in another tab: one task by name, or the count with them where
  several struck together. It reaches the owner **only while the app is open** — a tab, or the
  installed app running — since nothing wakes it once it is closed; that is the whole of what a
  reminder promises. Everything it has to say is on screen as well, so a browser that has no
  notifications, or is blocking them, loses nothing but the reach.
- **REM-7** Setting an hour on a task is what **asks the browser for permission** to notify, once —
  that being what setting one is implicitly asking for. It is the same permission the nudge asks for
  (NUDGE-9) and is the browser's to give, so it is granted per device rather than per account.

---

**Where it lives:** `src/core/due.ts` (the moment a task is due — `dueMoment` — the hours that struck
in a stretch — `dueReminders` — and what a standing notice still has to say — `standingReminders`),
`src/core/day.ts` (`LocalTime`, `atLocalTime`), `src/core/task.ts` (`setDueTime`),
`src/app/useReminders.ts` (the watching, and what is said), `src/app/browserNotification.ts` (the
browser's notification and its permission, shared with [Nudges](nudges.md) and
[Time goals](time-goals.md)), `src/app/components/ReminderToast.tsx` (the notice),
`src/app/components/DueTimeChoices.tsx` (setting the hour), `src/app/TasksScreen.tsx` (asking to
notify when an hour is set).
**Tested in:** `src/core/due.test.ts`, `src/core/day.test.ts`, `src/core/task.test.ts`,
`src/app/useReminders.test.ts`, `src/app/components/SchedulePicker.test.tsx` (setting the hour).
