import { useMemo } from 'react';

import { dateKey, remaining, sumEntries, targetsFor } from './nutrition';
import { useProfile, useStore } from './store';
import type { UserContext } from './api';

/** Today's numbers for the signed-in profile. */
export function useDay() {
  const profile = useProfile();
  const log = useStore((s) => s.log);
  return useMemo(() => {
    const today = dateKey();
    const entries = log.filter((e) => e.date === today);
    const targets = targetsFor(profile);
    const eaten = sumEntries(entries);
    const left = remaining(targets, eaten);
    const user: UserContext = { goal: profile.goal, diet: profile.diet, avoid: profile.avoid, targets, remaining: left };
    return { profile, entries, targets, eaten, left, user };
  }, [profile, log]);
}
