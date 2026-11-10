import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const FILE = process.env.CACHE_FILE ?? join(process.cwd(), '.cache', 'menus.json');
const TTL_MS = 14 * 24 * 60 * 60 * 1000;

interface Entry {
  at: number;
  value: unknown;
}

let store: Record<string, Entry> | null = null;
const pending = new Map<string, Promise<unknown>>();

async function load(): Promise<Record<string, Entry>> {
  if (store) return store;
  try {
    store = JSON.parse(await readFile(FILE, 'utf8')) as Record<string, Entry>;
  } catch {
    store = {};
  }
  return store;
}

/** Returns a stored result for the key, or runs `make` once and stores what it returns. */
export async function cached<T extends { items: unknown[] }>(rawKey: string, make: () => Promise<T>): Promise<T> {
  const key = rawKey.toLowerCase().replace(/\s+/g, ' ').trim();
  const data = await load();
  const hit = data[key];
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value as T;

  // Two people asking for the same restaurant at once share one lookup.
  const running = pending.get(key);
  if (running) return running as Promise<T>;

  const job = (async () => {
    const value = await make();
    // An empty result is not stored, so a failed search can be retried.
    if (value.items.length > 0) {
      data[key] = { at: Date.now(), value };
      await mkdir(dirname(FILE), { recursive: true });
      await writeFile(FILE, JSON.stringify(data));
    }
    return value;
  })().finally(() => pending.delete(key));
  pending.set(key, job);
  return job;
}
