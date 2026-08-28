import { useEffect, useState } from 'preact/hooks';

export interface MediaItem {
  id: string;
  kind: 'image' | 'video';
  name: string;
  url: string;
}

/**
 * Media lives here and nowhere else: object URLs are tied to this document, so
 * persisting them would only ever restore broken references. Everything in this
 * map dies with the page, which is what the privacy and cookie pages promise.
 *
 * Keyed per project and bucket, so switching tabs never carries one project's
 * attachments into another. A bucket is a platform id, or a platform id plus a
 * post index for the chained composers.
 */
const store = new Map<string, MediaItem[]>();
const listeners = new Set<(key: string) => void>();

let seq = 0;

function keyFor(projectId: string, bucket: string): string {
  return `${projectId}:${bucket}`;
}

function emit(key: string): void {
  for (const listener of listeners) listener(key);
}

export function getMedia(projectId: string, bucket: string): MediaItem[] {
  return store.get(keyFor(projectId, bucket)) ?? [];
}

export function setMedia(projectId: string, bucket: string, items: MediaItem[]): void {
  const key = keyFor(projectId, bucket);
  store.set(key, items);
  emit(key);
}

export function addMedia(
  projectId: string,
  bucket: string,
  files: FileList | File[],
  kind: MediaItem['kind'],
  limit = Infinity,
): void {
  const current = getMedia(projectId, bucket);
  const room = limit - current.length;
  if (room <= 0) return;

  const added = Array.from(files)
    .slice(0, room)
    .map((file) => ({
      id: `m${++seq}`,
      kind,
      name: file.name,
      url: URL.createObjectURL(file),
    }));

  if (added.length) setMedia(projectId, bucket, [...current, ...added]);
}

export function removeMedia(projectId: string, bucket: string, id: string): void {
  const current = getMedia(projectId, bucket);
  const item = current.find((entry) => entry.id === id);
  if (item) URL.revokeObjectURL(item.url);
  setMedia(
    projectId,
    bucket,
    current.filter((entry) => entry.id !== id),
  );
}

export function useMedia(projectId: string, bucket: string): MediaItem[] {
  const [items, setItems] = useState<MediaItem[]>(() => getMedia(projectId, bucket));

  useEffect(() => {
    setItems(getMedia(projectId, bucket));
    const listener = (key: string) => {
      if (key === keyFor(projectId, bucket)) setItems(getMedia(projectId, bucket));
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, [projectId, bucket]);

  return items;
}
