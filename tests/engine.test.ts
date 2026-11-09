import assert from 'node:assert/strict';
import { test } from 'node:test';

import { CATALOG } from '../src/lib/catalog';
import { estimateDish, parseMenuText } from '../src/lib/estimate';
import { healthifyLocal } from '../src/lib/healthify';
import { computeTargets, remaining, sumEntries } from '../src/lib/nutrition';
import { rankItems, scoreItem } from '../src/lib/scoring';
import type { Profile } from '../src/lib/types';

const base: Profile = {
  name: 'Sam', goal: 'lose', sex: 'male', age: 30, heightCm: 180, weightKg: 85,
  activity: 'moderate', diet: 'none', avoid: [], units: 'metric',
};

test('targets follow Mifflin-St Jeor with a goal adjustment', () => {
  // BMR = 10*85 + 6.25*180 - 5*30 + 5 = 1830; TDEE = 1830*1.55 = 2836.5; -20% = 2269 -> 2270
  const t = computeTargets(base);
  assert.equal(t.calories, 2270);
  assert.equal(t.protein, 170);
  const kcal = t.protein * 4 + t.carbs * 4 + t.fat * 9;
  assert.ok(Math.abs(kcal - t.calories) < 15, `macros add up (${kcal})`);
  assert.ok(computeTargets({ ...base, goal: 'gain' }).calories > computeTargets({ ...base, goal: 'maintain' }).calories);
});

test('calorie floor protects small users', () => {
  const t = computeTargets({ ...base, sex: 'female', weightKg: 45, heightCm: 150, age: 60, activity: 'sedentary' });
  assert.equal(t.calories, 1200);
});

test('every sample dish has macros consistent with its calories', () => {
  for (const r of CATALOG) {
    for (const it of r.items) {
      const kcal = it.protein * 4 + it.carbs * 4 + it.fat * 9;
      const tolerance = /Drinks/.test(it.category) ? 0.35 : 0.15; // alcohol-free drinks only, but allow rounding
      assert.ok(Math.abs(kcal - it.calories) / Math.max(it.calories, 60) <= tolerance, `${r.name} / ${it.name}: ${kcal} vs ${it.calories}`);
    }
  }
});

test('lean dishes outrank heavy ones for a fat-loss goal', () => {
  const t = computeTargets(base);
  const ember = CATALOG.find((r) => r.id === 'ember')!;
  const ranked = rankItems(ember.items, base, t);
  const pos = (n: string) => ranked.findIndex((r) => r.item.name === n);
  assert.ok(pos('Grilled Chicken Sandwich') < pos('Double Smokehouse Burger'));
  assert.ok(pos('Side Garden Salad') < pos('Sea-Salt Fries'));
  assert.equal(ranked.find((r) => r.item.name === 'Double Smokehouse Burger')!.fit.verdict, 'skip');
  assert.equal(ranked.find((r) => r.item.name === 'Grilled Chicken Sandwich')!.fit.verdict, 'great');
});

test('diet rules and allergens are hard conflicts', () => {
  const t = computeTargets(base);
  const burger = CATALOG[0].items[0];
  assert.equal(scoreItem(burger, { ...base, diet: 'vegetarian' }, t).conflict, true);
  assert.deepEqual(scoreItem(burger, { ...base, avoid: ['dairy'] }, t).reasons, ['Contains dairy']);
  const vegan = rankItems(CATALOG[1].items, { ...base, diet: 'vegan' }, t).filter((r) => !r.fit.conflict);
  assert.ok(vegan.length > 0 && vegan.every((r) => r.item.kind === 'vegan'));
});

test('a nearly spent day tightens the meal budget', () => {
  const t = computeTargets(base);
  const bowl = CATALOG[1].items[0];
  assert.ok(scoreItem(bowl, base, t, 350).score < scoreItem(bowl, base, t, 2000).score);
});

test('keto penalises carbs', () => {
  const keto = { ...base, diet: 'keto' as const };
  const t = computeTargets(keto);
  const pasta = CATALOG[2].items[1];
  const salmon = CATALOG[2].items[3];
  assert.ok(scoreItem(salmon, keto, t).score > scoreItem(pasta, keto, t).score + 20);
});

test('estimator recognises dishes and modifiers', () => {
  const grilled = estimateDish('Grilled Chicken Salad');
  const fried = estimateDish('Crispy Fried Chicken Sandwich with fries');
  assert.equal(grilled.kind, 'meat');
  assert.ok(fried.calories > grilled.calories + 300);
  assert.ok(fried.contains.includes('gluten'));
  assert.equal(estimateDish('Vegan Burger').kind, 'vegan');
  assert.ok(estimateDish('Shrimp Pad Thai', 'peanuts, egg').contains.includes('nuts'));
  assert.ok(estimateDish('Small Fries').calories < estimateDish('Large Fries').calories);
});

test('menu text parsing handles headings, prices and descriptions', () => {
  const items = parseMenuText(`STARTERS
Miso Soup 4.50
Edamame ..... $6

MAINS
1. Chicken Teriyaki Bowl - grilled chicken, rice, vegetables  $14.95
Tonkotsu Ramen
x`);
  assert.deepEqual(items.map((i) => i.name), ['Miso Soup', 'Edamame', 'Chicken Teriyaki Bowl', 'Tonkotsu Ramen']);
  assert.equal(items[0].category, 'Starters');
  assert.equal(items[2].description, 'grilled chicken, rice, vegetables');
});

test('healthify suggests swaps and totals the savings', () => {
  const r = healthifyLocal('Double cheeseburger, large fries and a cola', 'lose');
  assert.ok(r.swaps.length >= 3);
  assert.equal(r.totalSaved, r.swaps.reduce((n, s) => n + s.saves, 0));
  assert.equal(healthifyLocal('Grilled salmon with vegetables', 'lose').swaps.length, 0);
});

test('day totals and remaining', () => {
  const eaten = sumEntries([
    { id: 'a', date: 'd', at: 0, restaurantName: 'r', itemName: 'i', calories: 500, protein: 40, carbs: 30, fat: 20 },
    { id: 'b', date: 'd', at: 0, restaurantName: 'r', itemName: 'j', calories: 300, protein: 10, carbs: 40, fat: 10 },
  ]);
  assert.deepEqual(remaining({ calories: 2000, protein: 150, carbs: 200, fat: 60 }, eaten), { calories: 1200, protein: 100, carbs: 130, fat: 30 });
});
