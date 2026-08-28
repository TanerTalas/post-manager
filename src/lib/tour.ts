import { useEffect, useState } from 'preact/hooks';
import type { AnchorName } from './anchors';

export interface TourStep {
  anchor: AnchorName;
  title: string;
  body: string;
}

export const TOUR: TourStep[] = [
  {
    anchor: 'plus',
    title: 'Projects start here',
    body: 'Every campaign or idea gets its own tab. The plus button is how you make one.',
  },
  {
    anchor: 'naming',
    title: 'Give it a name',
    body: 'I have filled in an example. Do not worry, you can delete a project whenever you like.',
  },
  {
    anchor: 'pencil',
    title: 'Renaming later',
    body: 'The pencil under the selected tab reopens this box, so a rushed name is never a problem.',
  },
  {
    anchor: 'twitter',
    title: 'The composers',
    body: 'I rebuilt each platform layout almost exactly, so you never have to wonder which box is which. Twitter is the simplest one, so it goes first.',
  },
  {
    anchor: 'delete',
    title: 'Getting rid of a project',
    body: 'This removes the tab and everything drafted inside it. You get one confirmation first.',
  },
  {
    anchor: 'help',
    title: 'When you need me',
    body: 'Questions about storage, or a second run through this tour: both are behind the question mark.',
  },
];

/** The example name the tour types into the naming box for you. */
export const TOUR_PROJECT_NAME = 'Merge Migration Recap';

/**
 * The tour drives real controls that live in other islands, so those islands
 * hand their actions over here rather than the tour reaching into their DOM.
 */
export interface TourCommands {
  openNaming: (preset: string) => void;
  commitNaming: () => void;
}

let commands: TourCommands | null = null;
let step = 0;
const listeners = new Set<(value: number) => void>();

export function registerTourCommands(next: TourCommands | null): void {
  commands = next;
}

function set(next: number): void {
  step = next;
  if (typeof document !== 'undefined') {
    if (next > 0) document.body.dataset.tour = 'on';
    else delete document.body.dataset.tour;
  }
  for (const listener of listeners) listener(step);
}

export function startTour(): void {
  set(1);
}

export function endTour(): void {
  set(0);
}

export function prevStep(): void {
  if (step > 1) set(step - 1);
}

export function currentStep(): TourStep | null {
  return TOUR[step - 1] ?? null;
}

/**
 * Reports that the thing a step was describing has just happened, whether the
 * tour's own button caused it or the reader pressed the real control. Both
 * paths land in the same place, and the tour never ends up pointing at a dialog
 * that has already closed.
 */
export function stepCompleted(anchor: AnchorName): void {
  if (step > 0 && currentStep()?.anchor === anchor) advance();
}

function advance(): void {
  set(step >= TOUR.length ? 0 : step + 1);
}

/**
 * Advancing does not only move the pointer: on the steps that demonstrate
 * something, it performs the action it is describing and lets the action report
 * back through stepCompleted. Those branches deliberately do not move the step
 * themselves, or pressing the real control would skip one.
 */
export function nextStep(onOpenTwitter: () => void): void {
  const current = currentStep();
  if (!current) return;

  if (current.anchor === 'plus' && commands) {
    commands.openNaming(TOUR_PROJECT_NAME);
    return;
  }

  if (current.anchor === 'naming' && commands) {
    commands.commitNaming();
    return;
  }

  if (current.anchor === 'pencil') {
    onOpenTwitter();
  }

  advance();
}

export function useTourStep(): number {
  const [value, setValue] = useState(step);
  useEffect(() => {
    setValue(step);
    listeners.add(setValue);
    return () => {
      listeners.delete(setValue);
    };
  }, []);
  return value;
}
