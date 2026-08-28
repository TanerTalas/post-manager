import { beforeEach, describe, expect, it } from 'vitest';
import { addChainPost, chainPosts, removeChainPost, setChainPost } from './chain';
import { createProject, activeProject, getState, hydrate, setState } from './store';
import { emptyState } from './storage';
import type { Project } from './types';

const KEYS = { body: 'twitter_body', thread: 'twitter_thread' };

function current(): Project {
  const project = activeProject(getState());
  if (!project) throw new Error('no active project');
  return project;
}

describe('chain posts', () => {
  beforeEach(() => {
    localStorage.clear();
    hydrate();
    setState(emptyState());
    createProject('Thread test');
  });

  it('treats the lead post as the plain body field', () => {
    setChainPost(current(), KEYS, 0, 'lead');
    expect(chainPosts(current(), KEYS)).toEqual(['lead']);
    expect(current().content.twitter_body).toBe('lead');
  });

  it('appends follow ups and keeps them addressable by index', () => {
    setChainPost(current(), KEYS, 0, 'lead');
    addChainPost(current(), KEYS);
    setChainPost(current(), KEYS, 1, 'second');

    expect(chainPosts(current(), KEYS)).toEqual(['lead', 'second']);
  });

  it('removes a follow up without disturbing the lead', () => {
    setChainPost(current(), KEYS, 0, 'lead');
    addChainPost(current(), KEYS);
    setChainPost(current(), KEYS, 1, 'second');
    addChainPost(current(), KEYS);
    setChainPost(current(), KEYS, 2, 'third');

    removeChainPost(current(), KEYS, 1);

    expect(chainPosts(current(), KEYS)).toEqual(['lead', 'third']);
  });

  it('refuses to remove the lead post', () => {
    setChainPost(current(), KEYS, 0, 'lead');
    removeChainPost(current(), KEYS, 0);

    expect(chainPosts(current(), KEYS)).toEqual(['lead']);
  });
});
