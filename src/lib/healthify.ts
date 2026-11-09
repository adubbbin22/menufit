import type { Goal, Swap } from './types';

interface Rule {
  re: RegExp;
  to: string;
  why: string;
  saves: number;
}

const RULES: Rule[] = [
  { re: /\b(fries|tots|onion rings|chips)\b/, to: 'a side salad or steamed vegetables', why: 'Swaps deep-fried starch for fiber and volume.', saves: 280 },
  { re: /\b(soda|cola|coke|sprite|lemonade|sweet tea|juice)\b/, to: 'sparkling water, unsweetened tea or a diet soda', why: 'Liquid sugar adds calories without filling you up.', saves: 150 },
  { re: /\b(milkshake|shake|frappe)\b/, to: 'an iced coffee with a splash of milk', why: 'A shake can carry as many calories as the meal itself.', saves: 500 },
  { re: /\b(fried|crispy|breaded|battered|tempura|katsu)\b/, to: 'the grilled or roasted version', why: 'Breading and frying oil add fat without adding protein.', saves: 180 },
  { re: /\b(alfredo|carbonara|cream sauce|creamy)\b/, to: 'a tomato- or broth-based sauce', why: 'Cream sauces are mostly fat; marinara is a fraction of the calories.', saves: 250 },
  { re: /\b(mayo|aioli|ranch|special sauce)\b/, to: 'mustard, salsa or sauce on the side', why: 'You control the amount when it is on the side.', saves: 100 },
  { re: /\b(double|triple)\b/, to: 'a single', why: 'One patty usually still covers your protein for the meal.', saves: 250 },
  { re: /\b(large|jumbo|xl)\b/, to: 'the regular size', why: 'Portion size is the easiest calorie lever on a menu.', saves: 200 },
  { re: /\b(burrito|chimichanga)\b/, to: 'a burrito bowl, no tortilla', why: 'A large flour tortilla is about 300 calories on its own.', saves: 300 },
  { re: /\b(extra cheese|queso|loaded|smothered)\b/, to: 'regular or light cheese', why: 'Keeps the flavor with far less saturated fat.', saves: 120 },
  { re: /\b(bacon)\b/, to: 'grilled chicken, or skip the bacon', why: 'More protein, less fat and sodium.', saves: 90 },
  { re: /\b(white rice|fried rice)\b/, to: 'half rice, extra vegetables', why: 'Halving the starch trims carbs while the plate stays full.', saves: 150 },
  { re: /\b(pasta|spaghetti|penne|linguine|noodles)\b/, to: 'a half portion with extra protein or vegetables', why: 'Restaurant pasta servings are often two to three portions.', saves: 300 },
  { re: /\b(caesar)\b/, to: 'dressing on the side, light on croutons', why: 'Dressing is where most salad calories hide.', saves: 180 },
  { re: /\b(cake|cheesecake|brownie|sundae|ice cream|dessert)\b/, to: 'sharing it, or fruit / a coffee', why: 'A few bites usually satisfy the craving.', saves: 300 },
  { re: /\b(beer|cocktail|margarita|wine)\b/, to: 'a light beer, spritzer, or one drink with water alongside', why: 'Alcohol calories do not count toward any macro you want.', saves: 120 },
  { re: /\b(bun|brioche)\b/, to: 'a lettuce wrap or open-faced', why: 'Cuts refined carbs while keeping the main event.', saves: 150 },
];

const GOAL_TIP: Record<Goal, string> = {
  lose: 'Start with protein and vegetables, and box half of anything oversized before you begin.',
  maintain: 'Balance the plate: a palm of protein, a fist of carbs, the rest vegetables.',
  gain: 'Keep the protein and add a quality carb side so the meal still helps you grow.',
};

export interface HealthifyResult {
  swaps: Swap[];
  totalSaved: number;
  tip: string;
}

export function healthifyLocal(order: string, goal: Goal): HealthifyResult {
  const swaps: Swap[] = [];
  const lines = order
    .split(/\r?\n|,|;| and /i)
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    const lower = line.toLowerCase();
    for (const rule of RULES) {
      const m = lower.match(rule.re);
      if (!m) continue;
      // One suggestion per rule per order keeps the list readable.
      if (swaps.some((s) => s.to === rule.to)) continue;
      swaps.push({ from: line, to: rule.to, why: rule.why, saves: rule.saves });
    }
  }
  return {
    swaps,
    totalSaved: swaps.reduce((n, s) => n + s.saves, 0),
    tip: GOAL_TIP[goal],
  };
}
