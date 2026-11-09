import type { Activity, Goal, LogEntry, Profile, Targets } from './types';

const ACTIVITY_FACTOR: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

const GOAL_ADJUST: Record<Goal, number> = { lose: -0.2, maintain: 0, gain: 0.12 };
// grams of protein per kg of body weight
const PROTEIN_PER_KG: Record<Goal, number> = { lose: 2.0, maintain: 1.6, gain: 1.8 };

/** Mifflin-St Jeor resting energy expenditure, kcal/day. */
export function bmr(p: Pick<Profile, 'sex' | 'age' | 'heightCm' | 'weightKg'>): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  return p.sex === 'male' ? base + 5 : base - 161;
}

export function computeTargets(p: Profile): Targets {
  const tdee = bmr(p) * ACTIVITY_FACTOR[p.activity];
  const floor = p.sex === 'male' ? 1500 : 1200;
  const calories = Math.max(floor, Math.round((tdee * (1 + GOAL_ADJUST[p.goal])) / 10) * 10);

  let protein = Math.round(p.weightKg * PROTEIN_PER_KG[p.goal]);
  // Protein never takes more than 35% of calories.
  protein = Math.min(protein, Math.round((calories * 0.35) / 4));

  const fatShare = p.diet === 'keto' ? 0.65 : p.diet === 'lowcarb' ? 0.4 : 0.28;
  const fat = Math.round((calories * fatShare) / 9);
  const carbs = Math.max(20, Math.round((calories - protein * 4 - fat * 9) / 4));
  return { calories, protein, carbs, fat };
}

export function targetsFor(p: Profile): Targets {
  return p.customTargets ?? computeTargets(p);
}

export function dateKey(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function sumEntries(entries: LogEntry[]): Targets {
  return entries.reduce(
    (t, e) => ({
      calories: t.calories + e.calories,
      protein: t.protein + e.protein,
      carbs: t.carbs + e.carbs,
      fat: t.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export function remaining(targets: Targets, eaten: Targets): Targets {
  return {
    calories: targets.calories - eaten.calories,
    protein: targets.protein - eaten.protein,
    carbs: targets.carbs - eaten.carbs,
    fat: targets.fat - eaten.fat,
  };
}

export const kgToLb = (kg: number) => kg * 2.20462;
export const lbToKg = (lb: number) => lb / 2.20462;
export const cmToFtIn = (cm: number) => {
  const totalIn = Math.round(cm / 2.54);
  return { ft: Math.floor(totalIn / 12), inch: totalIn % 12 };
};
export const ftInToCm = (ft: number, inch: number) => (ft * 12 + inch) * 2.54;
