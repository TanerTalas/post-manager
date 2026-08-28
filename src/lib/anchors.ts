/**
 * The tour points at elements that live in different islands, so the nodes are
 * registered here rather than passed around as refs.
 */
export type AnchorName = 'plus' | 'help' | 'naming' | 'pencil' | 'delete' | 'twitter';

const nodes = new Map<AnchorName, HTMLElement>();
const listeners = new Set<() => void>();

export function setAnchor(name: AnchorName, node: HTMLElement | null): void {
  if (node) nodes.set(name, node);
  else nodes.delete(name);
  for (const listener of listeners) listener();
}

export function getAnchor(name: AnchorName): HTMLElement | null {
  return nodes.get(name) ?? null;
}

export function onAnchorChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
