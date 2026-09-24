# Modes

The two parts of the app that are turned on and off rather than used:
[Procrastination](just-one.md), which puts one task in front of you and dims the rest, and the
[warm-up](warm-up.md), which allows one more habit with each of its thirty days. Both change how the rest of the
app behaves for a while, which is more than a name on a switch can carry — so they have a page,
and each mode a page of its own that says what it does.

## Where they are

- **MODE-1** **More** offers **Modes**, a page like Tags (UI-45). Its row says how many modes are
  on (`1 on`), or nothing at all while none is. **More** stays marked while the Modes page or one
  mode's page is open. The addresses are `#/modes` and, for a mode, `#/modes/procrastination` and
  `#/modes/warm-up` (UI-36).
- **MODE-2** The page **lists every mode there is** — Procrastination first, then Warm-up — each
  with its own glyph (🫠, 🌱), its name, and the one line it is summed up in: *One task out of
  Today, and everything else dimmed until it is done*, *One more habit allowed each day: one on day
  one, thirty on day thirty*.

## Turning one on

- **MODE-3** Each row says **where its mode stands** — `Off`, `On · resting`, `On · Day 3 of 30 ·
  27 days left` — and carries a **switch** that turns it on or off from this page, at once and with
  no confirm. Starting Procrastination opens **Today**, there being nothing to focus on anywhere
  else (JUST-1); starting or ending the warm-up stays where it is (WARM-2). A mode that is on takes
  the same sky tint its banner wears.
- **MODE-6** A mode with **nothing to do cannot be turned on**: with everything in Today ticked
  off, Procrastination's switch is dimmed and refuses (JUST-2), and says why — on the row (`Off ·
  nothing to do in Today`) and in a tooltip. The mode is still listed and its page still reads:
  what it does is worth knowing before there is something to do. Nothing ever blocks the warm-up,
  which is about the habits rather than about today.

- **MODE-9** A mode is **the account's**, not the device's: turned on at the laptop it is on at
  the phone, and turned off anywhere it is off everywhere (STORE-44, STORE-45). A mode is a way of
  working for a while, and it is the person who is working, not the machine.
- **MODE-8** While a mode's data is **still on its way** its row says `Loading…` rather than `Off`,
  and its switch waits. `Off` would be a guess, and on the warm-up a costly one: turning it on over
  a month already running would start a fresh one at day one (WARM-2). What the modes are measured
  against — the account's warm-up, Today's tasks — arrives a moment after the page does.

## What a mode does

- **MODE-4** A click **anywhere else on the row** opens that mode's own page. A chevron at the end
  of the row marks it as a page to go to, and a **tooltip** says so in words — *Open Warm-up for
  what it does* — so the switch is not the only thing the row looks like.
- **MODE-5** A **mode's own page** carries the mode at its head — glyph, name, the line it is
  summed up in, where it stands, and the same switch (MODE-3) — and under that **What it does**:
  what being on actually does, in **plain sentences, one thing each**, naming the controls they
  mean in quotes (*Press "Other task" to pick a different one*). Procrastination: what is picked,
  what is dimmed, what each control does, what finishing one wins, and the **P** shortcut. The
  warm-up: what each day allows, that only new habits are held back, what counts against the
  allowance, that nothing already there is touched, where it is shown, and how it ends. Short
  enough to read before the switch is touched, and said outright rather than hinted at.
- **MODE-10** Wherever a mode **shows itself at work** — the warm-up panel at the head of Habits
  (WARM-6), the focus and idle banners on Today (JUST-5) — the banner carries a **More info**
  button beside its way out, which opens that mode's own page. A banner has room for a line; the
  page is where the whole of it is written down, and there is no other way to it from the page the
  mode is being felt on. The win card (JUST-9) carries none: a win is not the moment to read.
- **MODE-7** A **strip across the top** of a mode's page — **Modes**, **Procrastination**,
  **Warm-up**, the one you are on marked — goes back to the list and on to the other mode. It is
  there on a wide screen as well as a phone, unlike the rewards strip (RWD-30): neither the sidebar
  nor the bar lists a mode, so without it there would be no one step back.

---

**Where it lives:** `src/app/view.ts` (`UNDER_MODES`, the views and their addresses),
`src/app/modes.ts` (a mode as both pages read it: on, where it stands, what blocks it, the switch),
`src/app/modeLabels.ts` (wording — the summaries, what each mode does, the statuses),
`src/app/components/ModesPage.tsx` (the list), `src/app/components/ModePage.tsx` (one mode's page),
`src/app/components/ModeSwitch.tsx` (the switch), `src/app/components/ModesNav.tsx` (the strip),
`src/app/components/ModesIcon.tsx`, `src/app/components/MorePage.tsx` (the way in),
`src/app/components/WarmUpPanel.tsx` and `src/app/components/ProcrastinationMode.tsx`
(**More info** on a mode's banner),
`src/app/TasksScreen.tsx` (the modes built from `useProcrastination` and `useWarmUp`).
**Tested in:** `src/app/modes.test.ts`, `src/app/components/ModesPage.test.tsx`,
`src/app/components/ModePage.test.tsx`, `src/app/components/MorePage.test.tsx`,
`src/app/components/WarmUpPanel.test.tsx` and `src/app/components/ProcrastinationMode.test.tsx`
(**More info**),
`src/app/useView.test.ts` (the addresses), `src/app/components/SideNav.test.tsx` and
`BottomNav.test.tsx` (More staying marked).
