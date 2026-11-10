import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { CATALOG } from './catalog';
import { dateKey } from './nutrition';
import type { ChatMessage, LogEntry, MenuItem, Profile, Restaurant, UserLocation } from './types';

let counter = 0;
export const uid = () => `${Date.now().toString(36)}${(counter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

interface State {
  profile: Profile | null;
  log: LogEntry[];
  /** Restaurants the user added through AI search, a menu scan, or pasted text. */
  saved: Restaurant[];
  favorites: string[];
  chat: ChatMessage[];
  location: UserLocation | null;

  setLocation: (l: UserLocation) => void;
  setProfile: (p: Profile) => void;
  logItem: (restaurantName: string, item: Pick<MenuItem, 'name' | 'calories' | 'protein' | 'carbs' | 'fat'>) => void;
  removeEntry: (id: string) => void;
  saveRestaurant: (r: Omit<Restaurant, 'id' | 'items' | 'savedAt'> & { items: Omit<MenuItem, 'id'>[] }) => string;
  removeRestaurant: (id: string) => void;
  toggleFavorite: (id: string) => void;
  addChat: (m: Omit<ChatMessage, 'id'>) => void;
  clearChat: () => void;
  reset: () => void;
}

export const useStore = create<State>()(
  persist(
    (set) => ({
      profile: null,
      log: [],
      saved: [],
      favorites: [],
      chat: [],
      location: null,

      setLocation: (location) => set({ location }),
      setProfile: (profile) => set({ profile }),
      logItem: (restaurantName, item) =>
        set((s) => ({
          log: [
            {
              id: uid(),
              date: dateKey(),
              at: Date.now(),
              restaurantName,
              itemName: item.name,
              calories: item.calories,
              protein: item.protein,
              carbs: item.carbs,
              fat: item.fat,
            },
            ...s.log,
          ],
        })),
      removeEntry: (id) => set((s) => ({ log: s.log.filter((e) => e.id !== id) })),
      saveRestaurant: (r) => {
        const id = `u-${uid()}`;
        const items = r.items.map((it, i) => ({ ...it, id: `${id}-${i}` }));
        set((s) => ({ saved: [{ ...r, id, items, savedAt: Date.now() }, ...s.saved] }));
        return id;
      },
      removeRestaurant: (id) =>
        set((s) => ({ saved: s.saved.filter((r) => r.id !== id), favorites: s.favorites.filter((f) => f !== id) })),
      toggleFavorite: (id) =>
        set((s) => ({
          favorites: s.favorites.includes(id) ? s.favorites.filter((f) => f !== id) : [id, ...s.favorites],
        })),
      addChat: (m) => set((s) => ({ chat: [...s.chat, { ...m, id: uid() }] })),
      clearChat: () => set({ chat: [] }),
      reset: () => set({ profile: null, log: [], saved: [], favorites: [], chat: [], location: null }),
    }),
    { name: 'tablewise-v1', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

export function findRestaurant(id: string, saved: Restaurant[]): Restaurant | undefined {
  return saved.find((r) => r.id === id) ?? CATALOG.find((r) => r.id === id);
}

// Screens behind onboarding can render once more while the app is navigating
// away after "Erase all my data"; this keeps that last render from crashing.
const PLACEHOLDER: Profile = {
  name: '', goal: 'maintain', sex: 'female', age: 30, heightCm: 168, weightKg: 70,
  activity: 'light', diet: 'none', avoid: [], units: 'imperial',
};

export function useProfile(): Profile {
  return useStore((s) => s.profile) ?? PLACEHOLDER;
}
