# Principles

Requirements that are not about one feature. Everything else on this wiki is written on top of
these, so a feature page only mentions them where the feature bends them.

## Time

- **PRIN-1** Days are **local** days — the owner's today, not UTC's. A day starts at local
  midnight, and a task ticked off at 23:59 belongs to the day it was ticked off in.
- **PRIN-2** Nothing runs on a timer to change what is true. Whether a repeating task is due,
  whether a deleted task has expired, and which quote is today's are all **derived** from the
  moment being asked about. A page left open across midnight picks the new day up on its next
  render; nothing has to rewrite the saved data at midnight for it to be right.
- **PRIN-3** One moment per render. The list order, each row, the three bars, the trash countdown
  and the quote all answer to the same `now`, so they can never disagree about which day it is.

## Data

- **PRIN-4** Nothing is shown without a Google account (AUTH-1), and the tasks are the account's:
  every device signed into it shows the same ones, kept in step as they change (STORE-2).
- **PRIN-5** Saved data is versioned and migrated on load. Changing the stored shape never silently
  breaks what is already saved. See [Storage](storage.md).
- **PRIN-6** Ids are UUIDs and timestamps are ISO 8601, so records written on two devices merge one
  by one rather than colliding.
- **PRIN-7** A task stores its **most recent** completion time. A repeating task also stores the
  **days** it was done on (RPT-27), which is what habits and their streaks are read from
  ([Habits](habits.md)). Nothing else is kept: a one-off has no history, and neither does a
  checklist item.

## Behaviour

- **PRIN-8** Destructive actions are reversible, or they ask first. Deleting is reversible twice
  over; the two actions that genuinely end a task say so.
- **PRIN-9** The app works offline. Signing in for the first time needs a connection; after that
  the session is remembered (AUTH-7). The tasks open from the browser's copy and changes wait for
  a connection (STORE-18). The daily quote falls back to a bundled pack rather than failing.
- **PRIN-10** Nothing is lost by a mis-click: an abandoned edit leaves no trace, and a deletion can
  be taken straight back.

## Presentation

- **PRIN-11** It works on a phone. Below `md` the three areas stack into one column and the
  navigation collapses; nothing is only reachable on a wide screen.
- **PRIN-12** Dark mode follows the system; there is no theme switch.
- **PRIN-13** Every control carries a name for a screen reader, toggles report whether they are on,
  the current view is marked, and the quote says which language it is in.

## Code

These are enforced rather than merely intended, and `CLAUDE.md` is the authority on them:

- **PRIN-14** The rules live in a framework-free layer, as pure functions over plain data that
  never mutate their arguments. `npm run lint` fails if that layer reaches out to React, storage or
  the UI.
- **PRIN-15** Anything time-dependent in that layer takes an injectable `now`, so tests are
  deterministic and future time-based rules have a seam.
