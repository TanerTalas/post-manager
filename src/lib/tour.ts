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
    anchor: 'plus',
    title: 'Watch me press it',
    body: 'Nothing is permanent, so feel free to poke at everything afterwards.',
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

/**
 * Advancing does not only move the pointer: on the steps that demonstrate
 * something, it performs the action it is describing.
 */
export function nextStep(onOpenTwitter: () => void): void {
  if (step === 2) {
    commands?.openNaming(TOUR_PROJECT_NAME);
    set(3);
    return;
  }
  if (step === 3) {
    commands?.commitNaming();
    set(4);
    return;
  }
  if (step === 4) {
    onOpenTwitter();
    set(5);
    return;
  }
  if (step >= TOUR.length) {
    set(0);
    return;
  }
  set(step + 1);
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
