import { useEffect, useState } from 'preact/hooks';
import type { AnchorName } from './anchors';
import type { StringKey } from '~/i18n/en';

/** A step points at a control and carries the keys for its two lines. */
export interface TourStep {
  anchor: AnchorName;
  title: StringKey;
  body: StringKey;
}

export const TOUR: TourStep[] = [
  { anchor: 'plus', title: 'tour.step1.title', body: 'tour.step1.body' },
  { anchor: 'naming', title: 'tour.step2.title', body: 'tour.step2.body' },
  { anchor: 'pencil', title: 'tour.step3.title', body: 'tour.step3.body' },
  { anchor: 'twitter', title: 'tour.step4.title', body: 'tour.step4.body' },
  { anchor: 'delete', title: 'tour.step5.title', body: 'tour.step5.body' },
  { anchor: 'help', title: 'tour.step6.title', body: 'tour.step6.body' },
];

/**
 * The tour drives real controls that live in other islands, so those islands
 * hand their actions over here rather than the tour reaching into their DOM.
 */
export interface TourCommands {
  openNaming: () => void;
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
    commands.openNaming();
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
