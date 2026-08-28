import { readField, readList, setField } from './store';
import type { Project } from './types';

/**
 * Twitter and Threads both write a chain: one lead post plus any number of
 * follow-ups. The lead lives in `<platform>_body` so it reads like every other
 * field, and the follow-ups live in `<platform>_thread` as plain text. Both
 * persist. Attachments stay in memory, one media bucket per post index.
 */
export interface ChainKeys {
  body: string;
  thread: string;
}

export function chainPosts(project: Project, keys: ChainKeys): string[] {
  return [readField(project, keys.body), ...readList(project, keys.thread)];
}

export function setChainPost(project: Project, keys: ChainKeys, index: number, text: string): void {
  if (index === 0) {
    setField(keys.body, text);
    return;
  }
  const rest = readList(project, keys.thread).slice();
  rest[index - 1] = text;
  setField(keys.thread, rest);
}

export function addChainPost(project: Project, keys: ChainKeys): number {
  const rest = readList(project, keys.thread);
  setField(keys.thread, [...rest, '']);
  return rest.length + 1;
}

export function removeChainPost(project: Project, keys: ChainKeys, index: number): void {
  if (index === 0) return;
  const rest = readList(project, keys.thread).filter((_, position) => position !== index - 1);
  setField(keys.thread, rest);
}

/** Media bucket name for one post in a chain. */
export function bucketFor(platform: string, index: number): string {
  return `${platform}#${index}`;
}
