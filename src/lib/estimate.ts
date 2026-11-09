import type { Allergen, DishKind, MenuItem } from './types';

/**
 * Offline nutrition estimator. It guesses a dish from keywords in its name and
 * description, so results are rough ballparks, not lab values. The AI server
 * gives better numbers when it is configured.
 */

interface Base {
  re: RegExp;
  cal: number;
  p: number;
  c: number;
  f: number;
  kind: DishKind;
  contains?: Allergen[];
  category?: string;
}

// First match wins, so more specific dishes come first.
const BASES: Base[] = [
  { re: /\b(soda|cola|lemonade|sweet tea|juice)\b/, cal: 150, p: 0, c: 39, f: 0, kind: 'vegan', category: 'Drinks' },
  { re: /\b(milkshake|shake|frappe)\b/, cal: 620, p: 12, c: 90, f: 24, kind: 'vegetarian', contains: ['dairy'], category: 'Drinks' },
  { re: /\b(smoothie)\b/, cal: 310, p: 6, c: 65, f: 3, kind: 'vegetarian', category: 'Drinks' },
  { re: /\b(latte|cappuccino|mocha)\b/, cal: 190, p: 9, c: 20, f: 8, kind: 'vegetarian', contains: ['dairy'], category: 'Drinks' },
  { re: /\b(beer|wine|cocktail|margarita)\b/, cal: 180, p: 1, c: 14, f: 0, kind: 'vegan', category: 'Drinks' },
  { re: /\b(coffee|espresso|tea|water)\b/, cal: 5, p: 0, c: 1, f: 0, kind: 'vegan', category: 'Drinks' },
  { re: /\b(cheesecake|brownie|cake|sundae|ice cream|tiramisu|churros?|cookie|donut|doughnut|pie)\b/, cal: 480, p: 6, c: 62, f: 24, kind: 'vegetarian', contains: ['gluten', 'dairy', 'egg'], category: 'Desserts' },
  { re: /\b(fries|chips|tots|onion rings)\b/, cal: 400, p: 5, c: 50, f: 20, kind: 'vegan', category: 'Sides' },
  { re: /\b(side salad|house salad|garden salad|coleslaw|slaw)\b/, cal: 120, p: 3, c: 10, f: 8, kind: 'vegetarian', category: 'Sides' },
  { re: /\b(edamame)\b/, cal: 190, p: 17, c: 14, f: 8, kind: 'vegan', contains: ['soy'], category: 'Sides' },
  { re: /\b(soup|chowder|bisque|pho|ramen)\b/, cal: 420, p: 22, c: 48, f: 14, kind: 'meat', contains: ['gluten'] },
  { re: /\b(caesar)\b/, cal: 470, p: 14, c: 22, f: 36, kind: 'vegetarian', contains: ['dairy', 'egg', 'fish', 'gluten'] },
  { re: /\b(salad)\b/, cal: 380, p: 12, c: 26, f: 26, kind: 'vegetarian' },
  { re: /\b(poke|sashimi)\b/, cal: 520, p: 34, c: 58, f: 15, kind: 'fish', contains: ['fish', 'soy'] },
  { re: /\b(sushi|roll|nigiri|maki)\b/, cal: 360, p: 14, c: 52, f: 10, kind: 'fish', contains: ['fish', 'soy'] },
  { re: /\b(burrito bowl|grain bowl|rice bowl|bowl)\b/, cal: 640, p: 34, c: 72, f: 22, kind: 'meat' },
  { re: /\b(burrito|chimichanga)\b/, cal: 950, p: 42, c: 105, f: 38, kind: 'meat', contains: ['gluten', 'dairy'] },
  { re: /\b(quesadilla|nachos)\b/, cal: 980, p: 40, c: 78, f: 56, kind: 'meat', contains: ['gluten', 'dairy'] },
  { re: /\b(tacos?|fajitas?|enchiladas?)\b/, cal: 620, p: 30, c: 56, f: 30, kind: 'meat', contains: ['dairy'] },
  { re: /\b(cheeseburger|burger|patty melt)\b/, cal: 780, p: 38, c: 48, f: 46, kind: 'meat', contains: ['gluten', 'dairy'] },
  { re: /\b(hot dog|bratwurst|sausage)\b/, cal: 520, p: 18, c: 34, f: 34, kind: 'meat', contains: ['gluten'] },
  { re: /\b(wings|tenders|nuggets|strips)\b/, cal: 720, p: 44, c: 34, f: 44, kind: 'meat', contains: ['gluten'] },
  { re: /\b(pizza|calzone|flatbread)\b/, cal: 760, p: 32, c: 86, f: 30, kind: 'vegetarian', contains: ['gluten', 'dairy'] },
  { re: /\b(alfredo|carbonara|mac (and|&|n) cheese)\b/, cal: 1050, p: 34, c: 98, f: 56, kind: 'vegetarian', contains: ['gluten', 'dairy', 'egg'] },
  { re: /\b(lasagna|pasta|spaghetti|penne|linguine|ravioli|gnocchi|noodles?|pad thai|lo mein)\b/, cal: 820, p: 30, c: 104, f: 30, kind: 'vegetarian', contains: ['gluten'] },
  { re: /\b(fried rice|risotto|biryani|paella)\b/, cal: 760, p: 24, c: 100, f: 28, kind: 'meat' },
  { re: /\b(curry|tikka masala|korma|butter chicken)\b/, cal: 720, p: 36, c: 52, f: 40, kind: 'meat', contains: ['dairy'] },
  { re: /\b(club|blt|panini|sandwich|sub|hoagie|wrap|gyro|banh mi)\b/, cal: 640, p: 32, c: 58, f: 30, kind: 'meat', contains: ['gluten'] },
  { re: /\b(pancakes?|waffles?|french toast)\b/, cal: 760, p: 16, c: 110, f: 28, kind: 'vegetarian', contains: ['gluten', 'dairy', 'egg'] },
  { re: /\b(omelet(te)?|scramble|eggs? benedict|frittata)\b/, cal: 520, p: 30, c: 8, f: 40, kind: 'vegetarian', contains: ['egg', 'dairy'] },
  { re: /\b(oatmeal|porridge|granola|parfait|acai)\b/, cal: 380, p: 12, c: 62, f: 10, kind: 'vegetarian' },
  { re: /\b(avocado toast|bagel|toast)\b/, cal: 420, p: 12, c: 48, f: 20, kind: 'vegetarian', contains: ['gluten'] },
  { re: /\b(ribeye|prime rib|ribs|brisket)\b/, cal: 920, p: 62, c: 12, f: 68, kind: 'meat' },
  { re: /\b(sirloin|filet|steak|lamb|pork chop)\b/, cal: 560, p: 52, c: 4, f: 36, kind: 'meat' },
  { re: /\b(shrimp|prawns?|scallops?|lobster|crab|calamari|mussels)\b/, cal: 420, p: 34, c: 20, f: 20, kind: 'fish', contains: ['shellfish'] },
  { re: /\b(salmon)\b/, cal: 520, p: 42, c: 8, f: 34, kind: 'fish', contains: ['fish'] },
  { re: /\b(tuna|cod|halibut|tilapia|sea bass|mahi|trout|fish)\b/, cal: 420, p: 40, c: 10, f: 22, kind: 'fish', contains: ['fish'] },
  { re: /\b(turkey)\b/, cal: 480, p: 40, c: 26, f: 20, kind: 'meat' },
  { re: /\b(chicken|pollo)\b/, cal: 520, p: 44, c: 24, f: 24, kind: 'meat' },
  { re: /\b(tofu|tempeh|seitan)\b/, cal: 440, p: 26, c: 34, f: 22, kind: 'vegan', contains: ['soy'] },
  { re: /\b(falafel|hummus|lentil|chickpea|bean)\b/, cal: 540, p: 20, c: 64, f: 22, kind: 'vegan' },
  { re: /\b(veggie|vegetable|vegetarian|mushroom|eggplant|cauliflower)\b/, cal: 460, p: 14, c: 52, f: 22, kind: 'vegetarian' },
];

const FALLBACK: Base = { re: /./, cal: 600, p: 26, c: 60, f: 26, kind: 'meat' };

interface Modifier {
  re: RegExp;
  cal?: number;
  p?: number;
  c?: number;
  f?: number;
  scale?: number;
  contains?: Allergen[];
  kind?: DishKind;
}

const MODIFIERS: Modifier[] = [
  { re: /\b(fried|crispy|breaded|battered|tempura|katsu|schnitzel)\b/, cal: 180, c: 16, f: 13, contains: ['gluten'] },
  { re: /\b(creamy|cream sauce|alfredo|queso|cheesy|smothered|loaded)\b/, cal: 190, p: 5, c: 4, f: 17, contains: ['dairy'] },
  { re: /\b(cheese|cheddar|mozzarella|parmesan|feta|swiss)\b/, cal: 100, p: 6, f: 8, contains: ['dairy'] },
  { re: /\b(bacon|pepperoni|chorizo)\b/, cal: 110, p: 7, f: 9, kind: 'meat' },
  { re: /\b(avocado|guacamole|guac)\b/, cal: 120, p: 1, c: 6, f: 11 },
  { re: /\b(mayo|aioli|ranch|special sauce)\b/, cal: 110, f: 12, contains: ['egg'] },
  { re: /\b(bbq|teriyaki|honey|glazed|sweet (and|&) sour|maple|syrup)\b/, cal: 90, c: 22 },
  { re: /\b(peanuts?|almonds?|cashews?|walnuts?|pecans?|pesto)\b/, cal: 90, p: 3, f: 8, contains: ['nuts'] },
  { re: /\b(with fries|and fries|& fries|w\/ fries)\b/, cal: 380, p: 4, c: 48, f: 18 },
  { re: /\b(with rice|over rice|and rice)\b/, cal: 200, p: 4, c: 44 },
  { re: /\b(double|large|jumbo|xl|family)\b/, scale: 1.4 },
  { re: /\b(triple)\b/, scale: 1.8 },
  { re: /\b(small|mini|half|junior|kids|cup of|lite|light)\b/, scale: 0.6 },
  { re: /\b(grilled|steamed|roasted|baked|seared|poached)\b/, scale: 0.92 },
  { re: /\b(chicken|beef|steak|pork|turkey|ham|lamb|carnitas|barbacoa)\b/, kind: 'meat' },
  { re: /\b(shrimp|prawn|crab|lobster)\b/, kind: 'fish', contains: ['shellfish'] },
  { re: /\b(salmon|tuna|anchov|fish)\b/, kind: 'fish', contains: ['fish'] },
  { re: /\b(eggs?)\b/, contains: ['egg'] },
  { re: /\b(soy|miso|teriyaki)\b/, contains: ['soy'] },
  { re: /\b(bun|bread|tortilla|flour|crouton|panko)\b/, contains: ['gluten'] },
];

const KIND_RANK: Record<DishKind, number> = { vegan: 0, vegetarian: 1, fish: 2, meat: 3 };

export function estimateDish(name: string, description = '', category?: string): Omit<MenuItem, 'id'> {
  const text = `${name} ${description}`.toLowerCase();
  const base = BASES.find((b) => b.re.test(text)) ?? FALLBACK;

  let { cal, p, c, f, kind } = base;
  const contains = new Set<Allergen>(base.contains ?? []);
  let scale = 1;

  for (const m of MODIFIERS) {
    if (!m.re.test(text)) continue;
    cal += m.cal ?? 0;
    p += m.p ?? 0;
    c += m.c ?? 0;
    f += m.f ?? 0;
    if (m.scale) scale *= m.scale;
    m.contains?.forEach((a) => contains.add(a));
    // A dish only ever gets "less plant-based" from its modifiers.
    if (m.kind && KIND_RANK[m.kind] > KIND_RANK[kind]) kind = m.kind;
  }
  if (/\b(vegan|plant[- ]based)\b/.test(text)) {
    kind = 'vegan';
    contains.delete('dairy');
    contains.delete('egg');
  } else if (/\b(vegetarian|veggie)\b/.test(text) && KIND_RANK[kind] > 1) {
    kind = 'vegetarian';
  }
  if (/\b(gluten[- ]free|gf)\b/.test(text)) contains.delete('gluten');

  const r = (n: number) => Math.round(n * scale);
  return {
    name: name.trim(),
    description: description.trim() || undefined,
    category: category ?? base.category ?? 'Mains',
    calories: Math.round((cal * scale) / 10) * 10,
    protein: r(p),
    carbs: r(c),
    fat: r(f),
    kind,
    contains: [...contains],
  };
}

const PRICE = /\s*[.·…_-]*\s*[$€£]?\s*\d{1,3}([.,]\d{2})?\s*$/;

/**
 * Turns pasted menu text into dishes. Lines in ALL CAPS or ending in a colon
 * are treated as section headings; "Name - description" splits on the dash.
 */
export function parseMenuText(text: string): Omit<MenuItem, 'id'>[] {
  const items: Omit<MenuItem, 'id'>[] = [];
  let category: string | undefined;
  const seen = new Set<string>();

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/^[\s•*\-–\d.)]+/, '').replace(PRICE, '').trim();
    if (line.length < 3 || line.length > 160) continue;

    const letters = line.replace(/[^a-zA-Z]/g, '');
    const isHeading = line.endsWith(':') || (letters.length >= 3 && letters === letters.toUpperCase() && line.split(' ').length <= 4);
    if (isHeading) {
      const h = line.replace(/:$/, '').toLowerCase();
      category = h.charAt(0).toUpperCase() + h.slice(1);
      continue;
    }

    const [name, ...rest] = line.split(/\s+[-–—:|]\s+/);
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(estimateDish(name, rest.join(' '), category && !/^(mains?|entrees?|specials?)$/i.test(category) ? category : undefined));
  }
  return items;
}
