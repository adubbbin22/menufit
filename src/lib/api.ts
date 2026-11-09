import type { ChatMessage, MenuItem, Profile, Swap, Targets } from './types';

/**
 * Client for the optional AI server in /server. When EXPO_PUBLIC_API_URL is
 * not set the app runs on its built-in engine and these calls are never made.
 */
const BASE = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');

export const aiEnabled = BASE.length > 0;

export class ApiError extends Error {}

async function post<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Could not reach the AI server. Check your connection and try again.');
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(data?.error ?? `The AI server returned an error (${res.status}).`);
  }
  return data as T;
}

export interface UserContext {
  goal: Profile['goal'];
  diet: Profile['diet'];
  avoid: Profile['avoid'];
  targets: Targets;
  remaining: Targets;
}

export type AiItem = Omit<MenuItem, 'id'>;

export interface AiMenu {
  name: string;
  cuisine: string;
  items: AiItem[];
}

export const lookupRestaurant = (name: string, location: string) =>
  post<AiMenu>('/api/restaurant', { name, location });

export const scanMenu = (imageBase64: string, mediaType: string) =>
  post<AiMenu>('/api/scan', { imageBase64, mediaType });

export const healthifyAi = (order: string, user: UserContext) =>
  post<{ swaps: Swap[]; tip: string }>('/api/healthify', { order, user });

export const chatAi = (messages: Pick<ChatMessage, 'role' | 'text'>[], user: UserContext) =>
  post<{ reply: string }>('/api/chat', { messages, user });
