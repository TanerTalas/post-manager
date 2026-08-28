import { useEffect, useState } from 'preact/hooks';
import type { AppState, FieldValue, Project } from './types';
import { emptyState, loadState, writeState } from './storage';
import type { PlatformId } from '~/data/platforms';

type Listener = (state: AppState) => void;

const WRITE_DELAY = 250;

let state: AppState = emptyState();
let hydrated = false;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<Listener>();

/**
 * Pulls persisted state in once, on the first island that asks for it. Pages
 * are static, so the first paint has no stored data by definition and every
 * island renders the empty shell until this runs.
 */
export function hydrate(): void {
  if (hydrated) return;
  hydrated = true;
  state = loadState();

  // Writes are debounced, so a reload or a closed tab could otherwise land
  // between the last keystroke and the write that would have saved it.
  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush();
    });
  }

  emit();
}

function emit(): void {
  for (const listener of listeners) listener(state);
}

function scheduleWrite(): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    writeState(state);
  }, WRITE_DELAY);
}

/** The single write path. Every mutation in the app funnels through here. */
export function setState(patch: Partial<AppState> | ((current: AppState) => Partial<AppState>)): void {
  const next = typeof patch === 'function' ? patch(state) : patch;
  state = { ...state, ...next };
  emit();
  scheduleWrite();
}

export function getState(): AppState {
  return state;
}

export function isHydrated(): boolean {
  return hydrated;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Flushes any pending write. Used before a full page navigation. */
export function flush(): void {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  writeState(state);
}

export function useStore(): AppState {
  const [local, setLocal] = useState<AppState>(state);

  useEffect(() => {
    hydrate();
    setLocal(state);
    return subscribe(setLocal);
  }, []);

  return local;
}

/** True once the browser has taken over and stored state is in hand. */
export function useHydrated(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready;
}

export function activeProject(current: AppState = state): Project | null {
  return current.active ? (current.projects[current.active] ?? null) : null;
}

export function patchProject(id: string, fn: (project: Project) => Project): void {
  setState((current) => {
    const project = current.projects[id];
    if (!project) return {};
    return { projects: { ...current.projects, [id]: fn({ ...project }) } };
  });
}

/** Writes one content field on the active project. */
export function setField(key: string, value: FieldValue): void {
  const id = state.active;
  if (!id) return;
  patchProject(id, (project) => ({
    ...project,
    content: { ...project.content, [key]: value },
  }));
}

export function readField(project: Project | null, key: string): string {
  const value = project?.content[key];
  return typeof value === 'string' ? value : '';
}

export function readFlag(project: Project | null, key: string): boolean {
  return project?.content[key] === true;
}

/** Reads a chain field: the follow-up posts after the first one. */
export function readList(project: Project | null, key: string): string[] {
  const value = project?.content[key];
  return Array.isArray(value) ? value : [];
}

export function createProject(name: string): string {
  const id = `p${state.seq}`;
  setState((current) => ({
    seq: current.seq + 1,
    order: [...current.order, id],
    active: id,
    // A new project opens with the simplest composer already active, so the
    // screen is never blank on arrival.
    projects: {
      ...current.projects,
      [id]: { id, name, selected: ['twitter'], open: {}, content: {} },
    },
  }));
  return id;
}

export function renameProject(id: string, name: string): void {
  patchProject(id, (project) => ({ ...project, name }));
}

export function deleteProject(id: string): void {
  setState((current) => {
    const projects = { ...current.projects };
    delete projects[id];
    const order = current.order.filter((entry) => entry !== id);
    return {
      projects,
      order,
      active: current.active === id ? (order[0] ?? null) : current.active,
    };
  });
}

export function selectProject(id: string): void {
  setState({ active: id });
}

export function togglePlatform(id: PlatformId): void {
  const projectId = state.active;
  if (!projectId) return;
  patchProject(projectId, (project) => {
    const on = project.selected.includes(id);
    const selected = on
      ? project.selected.filter((entry) => entry !== id)
      : [...project.selected, id];
    const open = { ...project.open };
    if (on) delete open[id];
    return { ...project, selected, open };
  });
}

export function toggleRow(id: PlatformId): void {
  const projectId = state.active;
  if (!projectId) return;
  patchProject(projectId, (project) => ({
    ...project,
    open: { ...project.open, [id]: !project.open[id] },
  }));
}

export function setAllRows(open: boolean): void {
  const projectId = state.active;
  if (!projectId) return;
  patchProject(projectId, (project) => {
    const next: Partial<Record<PlatformId, boolean>> = {};
    if (open) for (const id of project.selected) next[id] = true;
    return { ...project, open: next };
  });
}
