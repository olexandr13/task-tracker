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

- **PRIN-4** Nothing is shown without a Google account (AUTH-1), but the tasks themselves are
  still kept on the device, with no sync between devices — a refresh or a closed browser loses
  nothing, but a second device knows nothing.
- **PRIN-5** Saved data is versioned and migrated on load. Changing the stored shape never silently
  breaks what is already saved. See [Storage](storage.md).
- **PRIN-6** Ids are UUIDs and timestamps are ISO 8601, so records written on two devices could
  merge if sync ever happens.
- **PRIN-7** History is not kept. A task stores its **most recent** completion and nothing more,
  which is why progress counts tasks rather than occurrences and why streaks are not possible yet.

## Behaviour

- **PRIN-8** Destructive actions are reversible, or they ask first. Deleting is reversible twice
  over; the two actions that genuinely end a task say so.
- **PRIN-9** The app works offline. Signing in for the first time needs a connection; after that
  the session is remembered (AUTH-7). The daily quote is the only other thing that reaches the
  network, and it falls back to a bundled pack rather than failing.
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
