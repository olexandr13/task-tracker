# Assistant

A language model to talk to, which **answers whatever it is asked**: what to do now, how yesterday
or the week went, how the habits are doing, a plan for tomorrow — or anything else at all. It knows
where things stand — the tasks open and done, the habits, the goals, the journal, the time logged
and the notes — and uses them when they bear on the question. It is asked through Google's Gemini —
Flash, or Flash-Lite when Flash is busy (AI-8) — on the owner's **own API key**, given on each device
by hand and kept there alone. Nothing is asked until a question is sent, and the app has no server:
the question goes straight from the browser to Google.

## The page

- **AI-1** **Assistant** is a page of its own, at `#/assistant` (UI-36), with sparkles for its
  glyph and an entry in the sidebar under **Reflect**, after the Journal (UI-30, UI-83), and a row
  on Reflect's page. It opens on the heading **Assistant** with an **i** beside it (UI-73), saying
  in plain sentences that it answers anything and what it knows, how the suggestions and follow-ups
  work, that the data and the conversation are sent to Google each time, that parts switched off are
  not, and that the conversation stays on the device. Under the heading is the conversation
  (AI-11) — before anything is asked, a line saying anything may be asked — then a box for a
  question, `Ask anything…`, with **Send** beside it, and the suggestions under them (AI-10).
  **Enter** in the box sends; **Shift+Enter** starts a new line. The box empties as a question is
  sent. While the answer is on its way the question shows in the conversation with `Thinking…`
  under it, the button says `Thinking…`, and nothing more is sent, so a double press costs one
  question. It has no box for adding a task, no Plus and no rail.

## The key

- **AI-2** The key is given under the **Assistant**'s switch on Settings (FEAT-10), in a box named
  **Gemini API key** that hides what is typed, with **Save key** beside it, and under it a line
  saying it is kept on this device only — not synced, not in the backup — and where to get one free
  (aistudio.google.com). Once saved, the box gives way to `Key saved on this device, ending in
  abcd` and a **Remove key** button: the key is never drawn back on screen. Removing asks nothing;
  it is pasted back as easily. The key is **this device's alone** (STORE-69): each device that is
  to ask is given it by hand, and it is never written into the app's code or the account. It goes
  to Google in a request header, not in the address.
- **AI-3** On a device with **no key**, the page says the assistant needs one and where to give it
  — Settings, Assistant under Features, the arrow in front of it — with an **Open Settings** button,
  in place of the box and the suggestions. A conversation kept from before still shows above it.

## What it knows

- **AI-4** With every question go the conversation so far (AI-11) and instructions made afresh for
  it, so they read things as they stand **at that moment**, a conversation left open overnight
  reading the new day. The instructions say what the assistant is for — answer anything, use the
  data where it bears on the question and general knowledge where it does not, never invent tasks,
  numbers or journal lines; for what to do, three to five specific things, the first small enough to
  start in ten minutes, minding what is overdue, urgent, put off, a streak at stake and a goal
  stalled; for a day or a week, what got done, where the time went, how the habits held, what the
  journal says and what was put off, then one or two things to do differently; for a plan, the day
  in order with the hardest thing early; about 200 words unless more is needed; in the language of
  the last message, or of the tasks and journal for the app's English suggestions — and then the
  data, in plain lines:
  - the day, its weekday and the time;
  - the **open tasks**, the most pressing first — overdue, then urgent, then by the day they are
    due, then the ones with no day, oldest first — each with what makes it pressing: overdue, urgent,
    its day and hour, how it repeats, how many times it was put off, its list, goal and tags, its
    checklist's open steps, its time goal and the start of its description. At most 120, and how
    many more there are;
  - the **habits**, each with its streak, its best, its share of the last 30 days (HAB-5, HAB-6,
    HAB-8), and each of the last 7 days as done, skipped, missed or not yet;
  - each **goal** with how many of its tasks are done (GOAL-7);
  - what was **finished in the last 14 days**, latest first, at the hour it was ticked off where
    that is known, a repeating task once for each day it was done (RPT-27), at most 100;
  - the **journal** the app still keeps (JRN-8), latest day first;
  - the **time logged** in the last 14 days, a day at a time, latest first, each activity's total
    that day, the most first;
  - the **notes**, newest first, each by its first line, at most 15.

  A part with nothing in it is left out. Tasks in the trash are never read.
- **AI-5** A part **switched off** on Settings (FEAT-1) is **not sent**: Lists, Goals, the Journal,
  the Activity log and Notes each go from the data with their switch, as they go from the screen.
  The tasks are always read, being what the app is (FEAT-7).

## The conversation

- **AI-6** An answer is drawn as a note is (NOTE-8): `- ` bullets, `1. ` numbers, **bold** and
  *italic*, never their markers. The model is asked for nothing else; what it sends anyway is put
  right as it arrives — `* ` and `•` bullets read as bullets, a heading as a bold line — and runs of
  blank lines close up to one.
- **AI-7** The **conversation is kept on this device** (STORE-69) and shown whenever the page is
  opened, oldest first: each question on the right in blue, each answer on the left in a card, each
  with its time under it — `14:05` today, `Oct 30, 09:12` on another day. A screen reader hears
  each as *You:* or *Assistant:* and what was said. As an answer arrives it is brought into view,
  its first line at the top, so a long one is read from its start. The latest 30 turns are kept,
  always starting on a question; older ones are let go of.
- **AI-8** Gemini is asked **model by model**: **Flash** first, and **Flash-Lite** when Flash turns
  the question away as busy or gives no answer within 30 seconds — on the free tier Flash is often
  busy for minutes at a time, while Flash-Lite answers in a second or two. Each is the newest of its
  line, so a model Google retires is not one the app is left asking. When no model answers, a red
  notice under the conversation says why in a sentence that says what to do — the key **not
  accepted** (check it on Settings; no other model is asked), Gemini **busy or the free quota used
  up** (try again in a minute), Gemini **too slow**, Flash-Lite too having given no answer within a
  minute (try again in a minute), Gemini **not reached** (check the connection), **no answer** to
  that (ask differently) — with what Google said under it, small, naming the model that said it.
  The question that brought nothing back is **not added** to the conversation, and goes back into
  the box, unless something new was typed there meanwhile, to be sent again.
- **AI-10** Under the box are **suggestions**, a row of pills, each a question asked **as it reads
  the moment it is pressed**: *What should I do now?*, *Plan my day*, *Analyze yesterday*, *Analyze
  this week*, *Plan tomorrow*, *How are my habits going?*, *What am I putting off?* and *Review my
  goals*. They are there whatever has been asked, so one can follow anything, and are pressed
  while an answer is on its way to no effect, as the button is.
- **AI-11** It is a **conversation**: each question is sent with the turns before it, so a
  follow-up — *Why that one first?*, *And tomorrow?* — is read in the light of what was said.
  **New chat**, beside the heading once anything has been asked, **starts over** at once, with no
  confirm: the conversation goes, and an answer still on its way belongs to the old one, and is
  dropped when it comes.

## Switching it off

- **AI-9** **Assistant** can be switched off on Settings (FEAT-1), in the Reflect group. Off, the
  page goes from the sidebar and from Reflect (FEAT-2), an address naming it opens Reflect, and its
  key box goes from under its switch (FEAT-3). The key and the conversation stay on the device, and
  are there when it is switched back on (FEAT-5).

---

**Where it lives:** `src/core/assistant.ts` (the instructions and the data, the conversation,
tidying an answer), `src/storage/assistantSource.ts` and `geminiAssistantSource.ts` (asking Gemini,
and why it failed), `src/storage/assistantDeviceRepository.ts`, `assistantDeviceSchema.ts` and
`localStorageAssistantDeviceRepository.ts` (the key and the conversation, on this device),
`src/app/useAssistant.ts` (holding them, and asking), `src/app/components/AssistantPage.tsx` (the
page), `src/app/components/AssistantSettings.tsx` (the key, under its switch),
`src/app/assistantLabels.ts` (wording and the suggestions), `src/app/components/AssistantIcon.tsx`,
`src/app/TasksScreen.tsx` (what is read, less the parts switched off), `src/app/view.ts`.
**Tested in:** `src/core/assistant.test.ts`, `src/storage/geminiAssistantSource.test.ts`,
`src/storage/assistantDeviceSchema.test.ts`, `src/app/useAssistant.test.ts`,
`src/app/components/AssistantPage.test.tsx`, `src/app/components/SettingsList.test.tsx`,
`src/app/features.test.ts`, `src/app/components/ReflectPage.test.tsx`,
`src/app/components/SideNav.test.tsx`, `src/app/components/SectionNav.test.tsx`.
