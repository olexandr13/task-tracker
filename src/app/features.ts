import { createContext, useContext } from 'react'
import { ALL_FEATURES_ON, isFeatureOn, isModeAvailable, type Feature, type FeatureMode, type FeaturesOff } from '../core'
import {
  DEFAULT_VIEW,
  isModesView,
  isOneListView,
  isRewardsView,
  isTagView,
  ON_MORE,
  parentView,
  UNDER_MODES,
  UNDER_REWARDS,
  type FixedView,
  type ModeView,
  type View,
} from './view'

/**
 * The features switched off on Settings (FEAT-1), for whatever is drawn deep
 * inside a row, a card or a sheet — a picker, a chip, a menu entry — to ask
 * without every list between handing it down. The screen provides it; drawn
 * on its own, as in a test, everything is on.
 */
export const FeaturesContext = createContext<FeaturesOff>(ALL_FEATURES_ON)

/** The features switched off, as the screen it is drawn on has them. */
export function useFeaturesOff(): FeaturesOff {
  return useContext(FeaturesContext)
}

/** Whether a feature is in use, as the screen it is drawn on has it. */
export function useFeatureOn(feature: Feature): boolean {
  return isFeatureOn(useFeaturesOff(), feature)
}

/** The mode each mode's page is of, by the name core knows it under. */
const MODE_OF_VIEW: Readonly<Record<ModeView, FeatureMode>> = {
  'modes/procrastination': 'procrastination',
  'modes/warm-up': 'warmUp',
  'modes/nudge': 'nudge',
  'modes/check-in': 'checkIn',
}

/** Whether a mode is there at all: listed, reachable, and doing anything (FEAT-9). */
export function isModeViewOn(off: FeaturesOff, view: ModeView): boolean {
  return isModeAvailable(off, MODE_OF_VIEW[view])
}

/** The modes there are, in the order Modes lists them (MODE-2). */
export function modesShown(off: FeaturesOff): ModeView[] {
  return UNDER_MODES.filter((view) => isModeViewOn(off, view))
}

/** The pages under Rewards there are, in the order they are listed (RWD-30): Cases only while it is on. */
export function rewardsPagesShown(off: FeaturesOff): (typeof UNDER_REWARDS)[number][] {
  return UNDER_REWARDS.filter((page) => page !== 'rewards/cases' || isFeatureOn(off, 'cases'))
}

/** The feature each page on More belongs to. */
const MORE_FEATURE: Readonly<Record<(typeof ON_MORE)[number], Feature>> = {
  lists: 'lists',
  tags: 'tags',
  balance: 'balance',
  activity: 'activity',
  journal: 'journal',
  modes: 'modes',
}

/** The pages More lists (UI-45), less those switched off. */
export function morePagesShown(off: FeaturesOff): (typeof ON_MORE)[number][] {
  return ON_MORE.filter((page) => isFeatureOn(off, MORE_FEATURE[page]))
}

/**
 * Whether a view is there to go to (FEAT-2): a page of a feature switched off
 * is not, nor More once everything on it is, nor a mode whose feature is off.
 * The tasks, the trash and settings always are.
 */
export function isViewOn(view: View, off: FeaturesOff): boolean {
  const on = (feature: Feature) => isFeatureOn(off, feature)

  if (view === 'habits') return on('habits')
  if (view === 'rewards/cases') return on('cases')
  if (isRewardsView(view)) return on('rewards')
  if (view === 'lists' || view === 'inbox' || isOneListView(view)) return on('lists')
  if (view === 'tags' || isTagView(view)) return on('tags')
  if (view === 'balance') return on('balance')
  if (view === 'activity') return on('activity')
  if (view === 'journal') return on('journal')
  if (view === 'modes') return on('modes')
  if (isModesView(view)) return isModeViewOn(off, view)
  if (view === 'more') return morePagesShown(off).length > 0
  return true
}

/**
 * Where an address naming a page that is switched off lands (FEAT-2): the
 * nearest page above it that is on — the Rewards page for Cases, Tasks for
 * a list — or Today where nothing above it is.
 */
export function nearestViewOn(view: View, off: FeaturesOff): View {
  for (let at: View | null = view; at !== null; at = parentView(at)) {
    if (isViewOn(at, off)) return at
  }
  return DEFAULT_VIEW
}

/** Every fixed view there is to go to, for a list of them to be filtered by. */
export function fixedViewsOn(views: readonly FixedView[], off: FeaturesOff): FixedView[] {
  return views.filter((view) => isViewOn(view, off))
}
