import type { Allergen, Diet, Fit, MenuItem, Profile, Targets, Verdict } from './types';

const ALLERGEN_LABEL: Record<Allergen, string> = {
  gluten: 'gluten',
  dairy: 'dairy',
  nuts: 'nuts',
  shellfish: 'shellfish',
  egg: 'egg',
  soy: 'soy',
  fish: 'fish',
};

function dietConflict(item: MenuItem, diet: Diet): string | null {
  switch (diet) {
    case 'vegan':
      return item.kind === 'vegan' ? null : 'Not vegan';
    case 'vegetarian':
      return item.kind === 'vegan' || item.kind === 'vegetarian' ? null : 'Not vegetarian';
    case 'pescatarian':
      return item.kind === 'meat' ? 'Contains meat' : null;
    default:
      return null;
  }
}

/**
 * The calorie budget for one meal: about a third of the day, shrunk to what is
 * actually left today when that is less, but never below a small sane meal.
 */
export function mealBudget(targets: Targets, remainingCalories?: number): number {
  const third = targets.calories * 0.35;
  if (remainingCalories === undefined) return third;
  return Math.max(300, Math.min(third, remainingCalories));
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function verdictFor(score: number): Verdict {
  if (score >= 75) return 'great';
  if (score >= 55) return 'good';
  if (score >= 35) return 'careful';
  return 'skip';
}

export function scoreItem(
  item: MenuItem,
  profile: Profile,
  targets: Targets,
  remainingCalories?: number,
): Fit {
  const reasons: string[] = [];

  const conflicts: string[] = [];
  const diet = dietConflict(item, profile.diet);
  if (diet) conflicts.push(diet);
  for (const a of profile.avoid) {
    if (item.contains.includes(a)) conflicts.push(`Contains ${ALLERGEN_LABEL[a]}`);
  }
  const text = `${item.name} ${item.description ?? ''}`.toLowerCase();
  for (const d of profile.dislikes ?? []) {
    const word = d.trim().toLowerCase();
    // Match the word and its simple plural/singular so "mushrooms" catches "mushroom".
    const stem = word.replace(/e?s$/, '');
    if (stem.length >= 3 && text.includes(stem)) conflicts.push(`Has ${word}, which you dislike`);
  }
  if (conflicts.length) {
    return { score: 0, verdict: 'skip', conflict: true, reasons: conflicts };
  }

  const budget = mealBudget(targets, remainingCalories);
  const isDrinkOrSide = /drink|side|dessert|starter|appetizer/i.test(item.category);
  // Sides, drinks and desserts get a much smaller slice of the meal.
  const itemBudget = isDrinkOrSide ? budget * 0.3 : budget;
  const ratio = item.calories / itemBudget;

  // 1. Calories: 40 points.
  let calPts: number;
  if (ratio <= 1) {
    // Full marks up to 60% of the budget, easing to 28 for a dish that uses all of it.
    calPts = ratio <= 0.6 ? 40 : 40 - ((ratio - 0.6) / 0.4) * 12;
    if (profile.goal === 'gain' && ratio < 0.5 && !isDrinkOrSide) {
      calPts = 28;
      reasons.push('Light for a muscle-gain meal');
    } else if (ratio <= 0.8) {
      reasons.push(`${Math.round(item.calories)} kcal leaves room in your day`);
    } else {
      reasons.push('Fits your meal budget');
    }
  } else {
    calPts = clamp(40 - (ratio - 1) * 100, 0, 40);
    const over = Math.round(item.calories - itemBudget);
    reasons.push(`About ${over} kcal over your budget for this ${isDrinkOrSide ? 'extra' : 'meal'}`);
  }

  // 2. Protein density: 30 points. Compared with the density the day's targets imply.
  const density = item.calories > 0 ? (item.protein * 4) / item.calories : 0;
  const wantDensity = (targets.protein * 4) / targets.calories;
  let proteinPts: number;
  if (isDrinkOrSide) {
    proteinPts = 15 + clamp(density / wantDensity, 0, 1) * 15;
  } else {
    proteinPts = clamp(density / wantDensity, 0, 1.1) * (30 / 1.1);
    if (density >= wantDensity) reasons.push(`Strong protein: ${Math.round(item.protein)} g`);
    else if (density < wantDensity * 0.5) reasons.push(`Low protein for the calories (${Math.round(item.protein)} g)`);
  }

  // 3. Quality: 30 points, lost to sodium, sugar, and carbs on carb-restricted diets.
  // With no sodium, sugar or fiber data (estimated menus) a dish cannot earn full quality marks.
  const noDetail = item.sodium === undefined && item.sugar === undefined && item.fiber === undefined;
  let quality = noDetail ? 24 : 30;
  if (item.sodium !== undefined) {
    if (item.sodium > 2300) {
      quality -= 12;
      reasons.push('Very high sodium');
    } else if (item.sodium > 1500) {
      quality -= 6;
      reasons.push('High sodium');
    }
  }
  if (item.sugar !== undefined) {
    if (item.sugar > 45) {
      quality -= 14;
      reasons.push(`${Math.round(item.sugar)} g sugar`);
    } else if (item.sugar > 22) {
      quality -= 7;
      reasons.push('Sugary');
    }
  }
  if (item.fiber !== undefined && item.fiber >= 7) {
    quality += 4;
    reasons.push(`${Math.round(item.fiber)} g fiber keeps you full`);
  }
  if (profile.diet === 'keto' || profile.diet === 'lowcarb') {
    const cap = profile.diet === 'keto' ? 15 : 40;
    if (item.carbs > cap) {
      quality -= clamp(((item.carbs - cap) / cap) * 18, 0, 30);
      reasons.push(`${Math.round(item.carbs)} g carbs is a lot for ${profile.diet === 'keto' ? 'keto' : 'low-carb'}`);
    } else {
      reasons.push('Carbs are in range');
    }
  } else if (item.calories > 0 && (item.fat * 9) / item.calories > 0.45 && item.calories > 400) {
    quality -= 6;
    reasons.push('Most of the calories come from fat');
  }
  quality = clamp(quality, 0, 30);

  let score = Math.round(clamp(calPts + proteinPts + quality, 0, 100));
  // Far past the meal budget is a skip no matter how good the rest looks.
  if (ratio > 1.4) score = Math.min(score, 34);
  return { score, verdict: verdictFor(score), conflict: false, reasons: reasons.slice(0, 4) };
}

export interface RankedItem {
  item: MenuItem;
  fit: Fit;
}

export function rankItems(
  items: MenuItem[],
  profile: Profile,
  targets: Targets,
  remainingCalories?: number,
): RankedItem[] {
  return items
    .map((item) => ({ item, fit: scoreItem(item, profile, targets, remainingCalories) }))
    .sort((a, b) => Number(a.fit.conflict) - Number(b.fit.conflict) || b.fit.score - a.fit.score);
}

export const VERDICT_LABEL: Record<Verdict, string> = {
  great: 'Great pick',
  good: 'Solid choice',
  careful: 'Go easy',
  skip: 'Skip it',
};
