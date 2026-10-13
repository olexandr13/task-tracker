# Notes

Somewhere to write down what is worth keeping and is not a task: an idea, the films to watch, what
the dentist said, a list to read through later. A task is something to do and be done with; a note
is something to keep, and read again. It is written the way a task's description is — bold, italic,
bulleted and numbered lists — with buttons for each, so it can be laid out on a phone as well.

## The page

- **NOTE-1** **Notes** is a page of its own, at `#/notes` (UI-36), with an entry in the sidebar
  after Tags, under **Organize** (UI-30, UI-81), and a row on Organize's page, which a phone
  reaches from More's (UI-45). It opens on the heading **Notes** with an **i** beside it (UI-73), saying in plain
  sentences what the page is for and how it is used, and at the other end of the heading a **New
  note** button (NOTE-3). Under them come the notes, each a card of its own. With none it says
  `No notes yet. Press "New note" to write your first one.` It has no box for adding a task, no Plus
  and no rail: it is not a list of tasks.
- **NOTE-2** The notes are listed **newest first**, by when each was first written. Changing a note
  does **not** move it: the note being read stays where the eye left it. At the foot of each card is
  when it last changed — the time for today (`9:41 AM`), `Yesterday`, the day this year (`Oct 8`),
  and the year as well before that (`Oct 8, 2025`).

## Writing

- **NOTE-3** **New note** opens an empty box at the top of the list, the caret already in it and
  *Write something…* waiting there until something is written; the button goes while it is open.
  **Done**, **clicking away**, or **Cmd/Ctrl+Enter** keeps what was written as a new note, at the
  top of the list. **Enter** makes a new line, as in a description (TASK-25). A note is any length;
  blank lines inside it are kept, and space around the whole of it is trimmed (TASK-27).
- **NOTE-4** A note needs **words**. A box left holding nothing — or only spaces, or a list with
  nothing in its items — makes no note, and simply goes.
- **NOTE-5** A note is **changed in place**: pressing it turns its card into the box, holding the
  note as it reads, the caret at the end. What is typed is kept on **Done**, on **clicking away**, on
  **Cmd/Ctrl+Enter**, and when the box goes without being left — the page changed, the tab closed or
  reloaded. **Escape** drops the change, and the note reads as it did. One note is written at a
  time: pressing another keeps the first and opens that one. A change keeps the note's place
  (NOTE-2) and is the note's alone — same note, same place, a new time at its foot.
- **NOTE-6** A note is **deleted** by its **×** — at the foot of its card, on a wide screen shown on
  the note pointed at, on a phone always there (UI-47) — or by **emptying it** and leaving it. Either
  way the few seconds' **Undo** a deleted task has (UI-38) names it by its first line: `Deleted the
  note “Films to watch”`. There is no trash for notes: once the offer has gone, so has the note.

## Formatting

- **NOTE-7** A note can be **bold**, *italic*, and hold **bulleted** and **numbered lists**, exactly
  as a description can (TASK-32 to TASK-36, TASK-44 to TASK-49): Cmd/Ctrl+B and Cmd/Ctrl+I, `- ` or
  `1. ` typed at the start of a line, Enter carrying a list on and ending it, pasted text arriving as
  text. Over the box is a row of **buttons** doing the same — **B**, **I**, **Bulleted list** and
  **Numbered list** — and then **Done**. A button is **pressed** while what it does is at the caret:
  **B** over bold words, **Bulleted list** inside a bulleted list. A press works on the words
  selected, or what is typed next, and **never takes the caret out of the box**, so on a phone the
  keyboard stays up. Pointed at, **B** and **I** name their keys as the keyboard spells them —
  `Bold (⌘B)` on a Mac, `Bold (Ctrl+B)` elsewhere.
- **NOTE-8** A note **reads as it was written**, at rest as in the box: bold words bold and lists
  with their bullets and numbers, never the markers they are saved as (TASK-33, TASK-48).

## What is kept

- **NOTE-9** The notes are the **account's** (STORE-62): every device signed in shows the same
  notes, a note written on one appears on the others, and when two change the same note the later
  change wins. A guest's are kept in the browser and moved in on signing in (STORE-37, STORE-38), and
  they are in the backup (BAK-22).
- **NOTE-10** **Notes** can be switched off on Settings (FEAT-1). Off, the page goes from the
  sidebar and from Organize (FEAT-2), and an address naming it opens Organize — or More, once Tags
  is off too (UI-37, UI-81); the notes stay as they are (FEAT-5).

---

**Where it lives:** `src/core/note.ts` (a note, what makes one blank, the order, its first line),
`src/app/useNotes.ts` (holding them), `src/app/components/NotesPage.tsx` (the page and a note's
card), `src/app/components/NoteEditor.tsx` (the box and its formatting buttons),
`src/app/components/FormattedText.tsx` (a note as it reads, shared with the description),
`src/app/descriptionBox.ts` (the box's contents read back as text, shared with the description),
`src/app/notesLabels.ts` (wording), `src/app/components/NotesIcon.tsx`,
`src/app/components/BulletListIcon.tsx`, `src/app/components/NumberedListIcon.tsx`,
`src/app/useUndoToast.ts`, `src/app/TasksScreen.tsx`, `src/app/view.ts`,
`src/app/components/SideNav.tsx`, `src/app/components/OrganizePage.tsx`; saving: [Storage](storage.md).
**Tested in:** `src/core/note.test.ts`, `src/app/useNotes.test.ts`,
`src/app/components/NotesPage.test.tsx`, `src/storage/noteSchema.test.ts`,
`src/storage/backupFile.test.ts`, `src/storage/backupRepository.test.ts`, `src/app/features.test.ts`,
`src/app/view.test.ts`, `src/app/components/SideNav.test.tsx`, `src/app/components/OrganizePage.test.tsx`,
`src/app/components/BottomNav.test.tsx`.
