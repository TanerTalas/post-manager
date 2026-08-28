import type { AppState, FieldValue, Project } from './types';
import { PLATFORM_IDS, type PlatformId } from '~/data/platforms';

export const STORAGE_KEY = 'post-manager';
export const SCHEMA_VERSION = 1;

export function emptyState(): AppState {
  return {
    version: SCHEMA_VERSION,
    order: [],
    active: null,
    homeTab: true,
    projects: {},
    neverConfirm: false,
    tourSeen: false,
    seq: 1,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readProject(id: string, raw: unknown): Project | null {
  if (!isRecord(raw)) return null;

  const selected = Array.isArray(raw.selected)
    ? (raw.selected.filter((p): p is PlatformId =>
        typeof p === 'string' && (PLATFORM_IDS as string[]).includes(p),
      ) as PlatformId[])
    : [];

  const open: Partial<Record<PlatformId, boolean>> = {};
  if (isRecord(raw.open)) {
    for (const id of PLATFORM_IDS) {
      if (raw.open[id] === true) open[id] = true;
    }
  }

  const content: Record<string, FieldValue> = {};
  if (isRecord(raw.content)) {
    for (const [key, value] of Object.entries(raw.content)) {
      if (typeof value === 'string' || typeof value === 'boolean') {
        content[key] = value;
      } else if (Array.isArray(value) && value.every((entry) => typeof entry === 'string')) {
        content[key] = value as string[];
      }
    }
  }

  return {
    id,
    name: typeof raw.name === 'string' ? raw.name : 'Untitled',
    selected,
    open,
    content,
  };
}

/**
 * Reads persisted state. Anything unreadable, from a missing key to a broken
 * payload or a schema we no longer understand, resolves to a blank slate
 * rather than a half loaded one.
 */
export function loadState(): AppState {
  if (typeof localStorage === 'undefined') return emptyState();

  let raw: unknown;
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    if (!text) return emptyState();
    raw = JSON.parse(text);
  } catch {
    return emptyState();
  }

  if (!isRecord(raw) || raw.version !== SCHEMA_VERSION) return emptyState();

  const projects: Record<string, Project> = {};
  if (isRecord(raw.projects)) {
    for (const [id, value] of Object.entries(raw.projects)) {
      const project = readProject(id, value);
      if (project) projects[id] = project;
    }
  }

  const order = Array.isArray(raw.order)
    ? raw.order.filter((id): id is string => typeof id === 'string' && id in projects)
    : [];

  for (const id of Object.keys(projects)) {
    if (!order.includes(id)) order.push(id);
  }

  const active =
    typeof raw.active === 'string' && raw.active in projects ? raw.active : (order[0] ?? null);

  return {
    version: SCHEMA_VERSION,
    order,
    active,
    homeTab: raw.homeTab !== false,
    projects,
    neverConfirm: raw.neverConfirm === true,
    tourSeen: raw.tourSeen === true,
    seq: typeof raw.seq === 'number' && raw.seq > 0 ? raw.seq : order.length + 1,
  };
}

export function writeState(state: AppState): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* Quota or a private window. Losing the write is better than losing the session. */
  }
}
