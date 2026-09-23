# Wiki

What the app does, feature by feature. These are the requirements **as built** — behaviour that
exists today, written from the owner's side of the screen rather than the code's.

Anything planned and not built stays in the backlog in `CLAUDE.md`. Keeping it out of here is what
lets this be read as a description of the app rather than a wish list.

## Pages

| Page | What it covers |
|---|---|
| [Account](account.md) | Signing in with Google, continuing as guest, staying signed in, signing out |
| [Principles](principles.md) | The rules that hold everywhere: local days, derived time, what is saved, what is not |
| [Tasks](tasks.md) | The record itself — adding, renaming, completing, ordering |
| [Checklists](checklists.md) | Subtasks: ticking them off, and the rule that finishes the task |
| [Due dates](due-dates.md) | The day a task is due, setting it, and overdue |
| [Tags](tags.md) | Names a task carries, tagging by picker or by typing `#`, the Tags page and each tag's list |
| [Lists](lists.md) | Somewhere to put a task: one list at a time, the Inbox, and the Lists page |
| [Views](views.md) | Views of the tasks — Today, Week and Month, and what belongs in them |
| [Just one](just-one.md) | Procrastination mode on Today: one task, a win, then rest or the next |
| [Repeating tasks](repeating-tasks.md) | Daily, weekly and monthly rules, and how a repeat reads as done |
| [Trash](trash.md) | Deleting, the undo window, retention and purging |
| [Progress](progress.md) | The three bars: today, this week, this month |
| [Habits](habits.md) | Daily tasks as habits: streaks, rates and the grid of days |
| [Rewards](rewards.md) | Points a task earns on every completion, the bonus for clearing a period, the prizes and the wishlist they are spent on, and the Rewards pages |
| [Time goals](time-goals.md) | A length of time a task asks for, sessions logged against it, and the hint to tick it off |
| [Daily quote](daily-quote.md) | One quote a day, from the quote service, cached for the day |
| [Interface](interface.md) | Layout, navigation, popovers, phone behaviour, accessibility |
| [Offline](offline.md) | Opening with no connection, changes kept and synced later, the sync notice, installing |
| [Storage](storage.md) | Where data lives, schema versions and migrations |
| [Backup](backup.md) | Exporting the whole account to a file, and importing one back |

## How requirements are written

- Each one has an id — `TASK-3`, `RPT-11` — so a commit, a test or a later change can point at it.
- **Ids are stable.** Add new ones at the end of their section; when a requirement goes, leave the
  gap rather than renumbering, so older references keep meaning what they said.
- A requirement says what is true for whoever is using the app. The **Where it lives** line at the
  foot of each page is the bridge to the source, and the only place file paths belong.

## Keeping it current

A change to behaviour is not finished until this wiki matches it: new behaviour gets new ids,
changed behaviour is rewritten in place, removed behaviour is deleted. The same goes for anything
the owner decides *not* to build — that belongs in the `CLAUDE.md` backlog, not here.
