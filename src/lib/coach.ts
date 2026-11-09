import { CATALOG } from './catalog';
import { rankItems } from './scoring';
import type { Profile, Targets } from './types';

/**
 * Offline stand-in for the AI coach. It answers the handful of questions it
 * can answer truthfully from local data and says so when it cannot.
 */

const CUISINE_TIPS: [RegExp, string][] = [
  [/burger|fast food|drive/, 'At a burger place: single patty, grilled over crispy, skip the mayo-based sauce, and swap fries for a side salad. A lettuce wrap saves about 150 kcal.'],
  [/mexican|taco|burrito/, 'At a Mexican spot: a bowl beats a burrito (the tortilla is ~300 kcal). Pick one of cheese, sour cream or guac, load up fajita vegetables, and go easy on the chips.'],
  [/italian|pasta|pizza/, 'At an Italian place: tomato-based sauces over cream, grilled fish or chicken mains, and share the pasta or pizza with a salad to start.'],
  [/sushi|japanese|ramen/, 'For Japanese: sashimi, edamame and miso soup are high protein and light. Limit tempura and mayo-topped rolls, and ask for sauces on the side.'],
  [/chinese|wok|takeout/, 'For Chinese: steamed or stir-fried dishes with vegetables (chicken and broccoli, steamed shrimp), sauce on the side, and half the rice. Battered, glazed dishes carry the most sugar.'],
  [/breakfast|brunch|pancake/, 'At breakfast: lead with eggs or Greek yogurt for protein, add fruit or oats, and treat pancakes and pastries as the shared extra.'],
  [/mediterranean|greek|kebab|shawarma/, 'Mediterranean menus are friendly: grilled kebabs or fish with salad, hummus in moderation, and one starch (rice or pita, not both).'],
  [/salad|sandwich|deli|sub/, 'At a deli: a 6-inch on whole grain with lean protein and double vegetables. For salads, dressing on the side and skip the candied or fried toppings.'],
  [/drink|alcohol|beer|wine|cocktail/, 'Drinks: a light beer or a glass of wine is roughly 100-130 kcal; sugary cocktails run 250+. Alternate with water and decide your number before you sit down.'],
  [/dessert|sweet/, 'Dessert: share it. Two or three bites give you most of the pleasure for a quarter of the calories.'],
];

export function localCoachReply(question: string, profile: Profile, targets: Targets, remaining: Targets): string {
  const q = question.toLowerCase();

  if (/(left|remaining|how (much|many)|budget|macros?|calories?) .*(today|left|have)|what.*left/.test(q)) {
    const cals = Math.round(remaining.calories);
    return cals >= 0
      ? `You have about ${cals} kcal left today, with ${Math.max(0, Math.round(remaining.protein))} g of protein still to hit. Your daily targets are ${targets.calories} kcal, ${targets.protein} g protein, ${targets.carbs} g carbs and ${targets.fat} g fat.`
      : `You are about ${Math.abs(cals)} kcal over today's ${targets.calories} kcal target. One day does not undo your progress: keep the next meal light and protein-first.`;
  }

  const sample = CATALOG.find((r) => q.includes(r.name.toLowerCase()) || q.includes(r.cuisine.toLowerCase().split(' ')[0]));
  for (const [re, tip] of CUISINE_TIPS) {
    if (!re.test(q)) continue;
    if (!sample) return tip;
    const best = rankItems(sample.items, profile, targets, remaining.calories).filter((r) => !r.fit.conflict).slice(0, 2);
    const picks = best.map((b) => `${b.item.name} (${b.item.calories} kcal, ${b.item.protein} g protein)`).join(' or ');
    return `${tip}\n\nFrom the sample ${sample.cuisine.toLowerCase()} menu, your best matches right now are ${picks}.`;
  }

  if (/protein/.test(q)) {
    return `Your protein target is ${targets.protein} g a day, so aim for roughly ${Math.round(targets.protein / 3)} g per meal. When eating out that usually means grilled chicken, fish, steak, eggs, tofu or beans as the centre of the plate.`;
  }

  return 'I am running in offline mode, so I can only answer from built-in guidance: ask me what is left in your day, or what to order at a type of restaurant (burgers, Mexican, Italian, sushi, Chinese, breakfast, Mediterranean, deli). Connect the AI server for open-ended questions.';
}
