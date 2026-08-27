import type { PlatformId } from '~/data/platforms';

/** Every value a field can hold. Media never lands here, it is not persisted. */
export type FieldValue = string | boolean;

export interface Project {
  id: string;
  name: string;
  selected: PlatformId[];
  open: Partial<Record<PlatformId, boolean>>;
  content: Record<string, FieldValue>;
}

export interface AppState {
  /** Bumped whenever the persisted shape changes. */
  version: number;
  /** Tab order, project ids only. The home tab is tracked separately. */
  order: string[];
  active: string | null;
  homeTab: boolean;
  projects: Record<string, Project>;
  lang: 'EN' | 'TR';
  neverConfirm: boolean;
  tourSeen: boolean;
  seq: number;
}
