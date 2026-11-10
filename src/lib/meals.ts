import { scoreItem } from './scoring';
import type { Meal, MenuItem, Profile, Targets } from './types';

const EXTRA = /drink|side|dessert|starter|appetizer|soup/i;
const SWEET = /drink|dessert/i;

function total(items: MenuItem[]): Targets {
  return items.reduce(
    (t, i) => ({ calories: t.calories + i.calories, protein: t.protein + i.protein, carbs: t.carbs + i.carbs, fat: t.fat + i.fat }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

/** Scores a set of items as if it were one dish. */
function scoreCombo(items: MenuItem[], profile: Profile, targets: Targets, remainingCalories?: number) {
  const t = total(items);
  const sum = (k: 'fiber' | 'sugar' | 'sodium') => (items.some((i) => i[k] !== undefined) ? items.reduce((n, i) => n + (i[k] ?? 0), 0) : undefined);
  const combined: MenuItem = {
    id: items.map((i) => i.id).join('+'),
    name: items.map((i) => i.name).join(' + '),
    category: 'Meal',
    ...t,
    fiber: sum('fiber'),
    sugar: sum('sugar'),
    sodium: sum('sodium'),
    kind: 'vegan',
    contains: [],
  };
  return { totals: t, fit: scoreItem(combined, profile, targets, remainingCalories) };
}

/**
 * Builds the best complete orders from a menu: each main on its own and paired
 * with each savory side, keeping the highest-scoring version of each main.
 */
export function buildMeals(items: MenuItem[], profile: Profile, targets: Targets, remainingCalories?: number, count = 3): Meal[] {
  const ok = (i: MenuItem) => !scoreItem(i, profile, targets, remainingCalories).conflict;
  const mains = items.filter((i) => !EXTRA.test(i.category) && ok(i));
  const sides = items.filter((i) => EXTRA.test(i.category) && !SWEET.test(i.category) && ok(i));

  const meals: Meal[] = [];
  for (const main of mains) {
    let best: { items: MenuItem[]; totals: Targets; fit: Meal['fit'] } | null = null;
    for (const combo of [[main], ...sides.map((s) => [main, s])]) {
      const scored = scoreCombo(combo, profile, targets, remainingCalories);
      if (!best || scored.fit.score > best.fit.score) best = { items: combo, ...scored };
    }
    if (!best) continue;
    const howToOrder = best.items.flatMap((i) => (i.tip ? [i.tip] : []));
    if (!best.items.some((i) => /drink/i.test(i.category))) howToOrder.push('Drink water or something unsweetened with it.');
    meals.push({ id: best.items.map((i) => i.id).join('+'), ...best, howToOrder });
  }
  return meals.sort((a, b) => b.fit.score - a.fit.score).slice(0, count);
}

export { total as totalOf };
