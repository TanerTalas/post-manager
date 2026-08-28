import { beforeEach, describe, expect, it } from 'vitest';
import { STORAGE_KEY, emptyState, loadState, writeState } from './storage';
import type { AppState } from './types';

function seeded(): AppState {
  return {
    ...emptyState(),
    order: ['p1'],
    active: 'p1',
    projects: {
      p1: {
        id: 'p1',
        name: 'Q3 Launch',
        selected: ['twitter', 'reddit'],
        open: { twitter: true },
        content: {
          twitter_body: 'zero downtime, mostly',
          twitter_thread: ['what broke anyway'],
          reddit_nsfw: false,
        },
      },
    },
  };
}

describe('loadState', () => {
  beforeEach(() => localStorage.clear());

  it('returns a blank slate when nothing is stored', () => {
    expect(loadState()).toEqual(emptyState());
  });

  it('round trips a project with its text, platforms and open rows', () => {
    writeState(seeded());
    const loaded = loadState();

    expect(loaded.active).toBe('p1');
    expect(loaded.projects.p1?.name).toBe('Q3 Launch');
    expect(loaded.projects.p1?.selected).toEqual(['twitter', 'reddit']);
    expect(loaded.projects.p1?.open).toEqual({ twitter: true });
    expect(loaded.projects.p1?.content.twitter_body).toBe('zero downtime, mostly');
    expect(loaded.projects.p1?.content.twitter_thread).toEqual(['what broke anyway']);
  });

  it('falls back to a blank slate on unreadable payloads', () => {
    localStorage.setItem(STORAGE_KEY, '{ this is not json');
    expect(loadState()).toEqual(emptyState());
  });

  it('discards state written under a schema it does not know', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...seeded(), version: 99 }));
    expect(loadState()).toEqual(emptyState());
  });

  it('drops unknown platform ids rather than carrying them forward', () => {
    const state = seeded();
    state.projects.p1!.selected = ['twitter', 'devto' as never];
    writeState(state);

    expect(loadState().projects.p1?.selected).toEqual(['twitter']);
  });

  it('repairs an active id that points at a project that is gone', () => {
    const state = seeded();
    state.active = 'p9';
    writeState(state);

    expect(loadState().active).toBe('p1');
  });

  it('keeps tab order and appends projects missing from it', () => {
    const state = seeded();
    state.projects.p2 = { id: 'p2', name: 'Later', selected: [], open: {}, content: {} };
    writeState(state);

    expect(loadState().order).toEqual(['p1', 'p2']);
  });
});
