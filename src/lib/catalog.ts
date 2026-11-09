import type { Allergen, DishKind, MenuItem, Restaurant } from './types';

/**
 * Built-in sample restaurants so the app works with no network. The places are
 * invented and the nutrition figures are typical values for each kind of dish.
 */

// [name, category, kcal, protein, carbs, fat, fiber, sugar, sodium, kind, contains, description, tip?]
type Row = [string, string, number, number, number, number, number, number, number, DishKind, Allergen[], string, string?];

function build(id: string, name: string, cuisine: string, emoji: string, blurb: string, rows: Row[]): Restaurant {
  const items: MenuItem[] = rows.map((r, i) => ({
    id: `${id}-${i}`,
    name: r[0],
    category: r[1],
    calories: r[2],
    protein: r[3],
    carbs: r[4],
    fat: r[5],
    fiber: r[6],
    sugar: r[7],
    sodium: r[8],
    kind: r[9],
    contains: r[10],
    description: r[11],
    tip: r[12],
  }));
  return { id, name, cuisine, emoji, blurb, source: 'sample', items };
}

export const CATALOG: Restaurant[] = [
  build('ember', 'Ember & Bun', 'Burgers', '🍔', 'Flame-grilled burgers and shakes', [
    ['Classic Cheeseburger', 'Burgers', 740, 38, 46, 44, 2, 9, 1280, 'meat', ['gluten', 'dairy'], 'Beef patty, cheddar, pickles, house sauce', 'Ask for sauce on the side to save about 100 kcal.'],
    ['Double Smokehouse Burger', 'Burgers', 1180, 64, 52, 78, 3, 14, 2150, 'meat', ['gluten', 'dairy'], 'Two patties, bacon, cheddar, BBQ sauce, crispy onions'],
    ['Grilled Chicken Sandwich', 'Burgers', 520, 41, 44, 19, 3, 8, 1120, 'meat', ['gluten'], 'Grilled chicken breast, lettuce, tomato, mustard'],
    ['Lettuce-Wrap Turkey Burger', 'Burgers', 390, 36, 9, 23, 3, 5, 780, 'meat', [], 'Turkey patty, avocado, tomato in butter lettuce'],
    ['Black Bean Burger', 'Burgers', 560, 22, 68, 22, 13, 9, 1050, 'vegetarian', ['gluten', 'egg'], 'House black bean patty, pico, chipotle mayo', 'Swap the mayo for salsa to make it lighter.'],
    ['Crispy Chicken Tenders', 'Mains', 860, 46, 58, 49, 3, 2, 1980, 'meat', ['gluten', 'egg'], 'Five tenders with ranch'],
    ['Grilled Chicken Cobb Salad', 'Salads', 540, 46, 16, 33, 7, 6, 1190, 'meat', ['dairy', 'egg'], 'Chicken, egg, bacon, avocado, blue cheese', 'Dressing on the side keeps this under 450 kcal.'],
    ['Sea-Salt Fries', 'Sides', 420, 5, 54, 21, 5, 0, 540, 'vegan', [], 'Regular order'],
    ['Side Garden Salad', 'Sides', 90, 3, 10, 5, 3, 5, 150, 'vegan', [], 'Greens, tomato, cucumber, vinaigrette'],
    ['Vanilla Malt Shake', 'Drinks', 680, 14, 96, 27, 0, 82, 360, 'vegetarian', ['dairy'], '16 oz'],
  ]),
  build('verde', 'Casa Verde', 'Mexican', '🌮', 'Build-your-own burritos, bowls and tacos', [
    ['Chicken Burrito Bowl', 'Bowls', 610, 46, 62, 19, 12, 5, 1380, 'meat', ['dairy'], 'Grilled chicken, brown rice, black beans, salsa, cheese', 'Go half rice and double fajita veggies.'],
    ['Steak Burrito', 'Burritos', 1040, 52, 112, 41, 14, 6, 2320, 'meat', ['gluten', 'dairy'], 'Steak, rice, pinto beans, cheese, sour cream in a flour tortilla'],
    ['Carnitas Tacos (3)', 'Tacos', 630, 33, 54, 31, 6, 3, 1210, 'meat', ['dairy'], 'Corn tortillas, braised pork, onion, cilantro, cotija'],
    ['Grilled Fish Tacos (3)', 'Tacos', 480, 34, 48, 16, 7, 4, 940, 'fish', ['fish'], 'Corn tortillas, grilled white fish, cabbage slaw, lime'],
    ['Veggie Fajita Salad', 'Salads', 410, 14, 44, 20, 14, 9, 890, 'vegan', [], 'Romaine, fajita vegetables, black beans, corn salsa, guacamole'],
    ['Sofritas Bowl', 'Bowls', 540, 22, 68, 20, 14, 8, 1420, 'vegan', ['soy'], 'Spiced tofu, rice, beans, salsa verde'],
    ['Cheese Quesadilla', 'Mains', 890, 36, 68, 52, 4, 3, 1760, 'vegetarian', ['gluten', 'dairy'], 'Flour tortilla, three-cheese blend, crema'],
    ['Chips & Queso', 'Sides', 780, 18, 76, 45, 6, 4, 1340, 'vegetarian', ['dairy'], 'Large chips with warm cheese dip'],
    ['Chips & Salsa', 'Sides', 330, 5, 46, 14, 5, 3, 520, 'vegan', [], 'House tortilla chips, roasted tomato salsa'],
    ['Horchata', 'Drinks', 260, 2, 54, 4, 0, 42, 60, 'vegetarian', ['dairy'], '16 oz'],
  ]),
  build('nonna', "Nonna's Table", 'Italian', '🍝', 'Red-sauce classics and wood-fired pizza', [
    ['Fettuccine Alfredo', 'Pasta', 1220, 34, 108, 72, 5, 6, 1490, 'vegetarian', ['gluten', 'dairy', 'egg'], 'Cream, butter, parmesan'],
    ['Spaghetti Pomodoro', 'Pasta', 640, 20, 104, 16, 8, 14, 980, 'vegan', ['gluten'], 'Tomato, basil, garlic, olive oil', 'Add grilled chicken for 35 g more protein.'],
    ['Chicken Parmesan', 'Mains', 1060, 68, 82, 50, 6, 13, 2480, 'meat', ['gluten', 'dairy', 'egg'], 'Breaded chicken, mozzarella, marinara, side of spaghetti'],
    ['Grilled Salmon Piccata', 'Mains', 560, 44, 14, 36, 4, 3, 890, 'fish', ['fish', 'dairy'], 'Lemon-caper sauce, broccolini'],
    ['Chicken Marsala', 'Mains', 610, 48, 24, 30, 2, 6, 1140, 'meat', ['gluten', 'dairy'], 'Mushroom marsala sauce, roasted potatoes'],
    ['Margherita Pizza', 'Pizza', 820, 34, 98, 30, 5, 8, 1620, 'vegetarian', ['gluten', 'dairy'], '12 inch, tomato, mozzarella, basil', 'Split it and add a salad.'],
    ['Minestrone', 'Starters', 190, 8, 30, 4, 8, 7, 890, 'vegan', ['gluten'], 'Bowl, vegetables, beans, small pasta'],
    ['Caprese Salad', 'Starters', 310, 16, 9, 23, 2, 6, 420, 'vegetarian', ['dairy'], 'Tomato, fresh mozzarella, basil, balsamic'],
    ['Garlic Bread', 'Sides', 380, 8, 44, 19, 2, 2, 640, 'vegetarian', ['gluten', 'dairy'], 'Four pieces'],
    ['Tiramisu', 'Desserts', 470, 7, 48, 28, 1, 32, 110, 'vegetarian', ['gluten', 'dairy', 'egg'], 'Espresso-soaked ladyfingers, mascarpone'],
  ]),
  build('umi', 'Umi Sushi Bar', 'Japanese', '🍣', 'Sushi, ramen and izakaya plates', [
    ['Salmon Sashimi (8 pc)', 'Sushi', 320, 34, 0, 20, 0, 0, 90, 'fish', ['fish'], 'Sliced raw salmon'],
    ['Spicy Tuna Roll', 'Sushi', 310, 20, 38, 9, 2, 6, 720, 'fish', ['fish', 'egg', 'soy'], '8 pieces, spicy mayo'],
    ['Shrimp Tempura Roll', 'Sushi', 520, 16, 66, 21, 3, 11, 980, 'fish', ['shellfish', 'gluten', 'egg', 'soy'], '8 pieces, eel sauce'],
    ['Chicken Teriyaki Bowl', 'Mains', 680, 44, 86, 16, 3, 24, 1890, 'meat', ['soy', 'gluten'], 'Grilled chicken, teriyaki glaze, rice, vegetables', 'Ask for the sauce on the side to cut sugar and sodium.'],
    ['Tonkotsu Ramen', 'Mains', 940, 42, 92, 44, 5, 8, 2890, 'meat', ['gluten', 'egg', 'soy'], 'Pork broth, chashu, noodles, soft egg'],
    ['Tofu Poke Bowl', 'Mains', 510, 24, 68, 16, 8, 9, 1090, 'vegan', ['soy'], 'Marinated tofu, rice, edamame, seaweed, cucumber'],
    ['Tuna Poke Bowl', 'Mains', 560, 38, 66, 14, 6, 10, 1240, 'fish', ['fish', 'soy'], 'Ahi tuna, rice, avocado, edamame'],
    ['Edamame', 'Starters', 190, 17, 14, 8, 8, 3, 380, 'vegan', ['soy'], 'Steamed, sea salt'],
    ['Miso Soup', 'Starters', 60, 5, 6, 2, 1, 2, 760, 'vegan', ['soy'], 'Tofu, wakame, scallion'],
    ['Pork Gyoza (6)', 'Starters', 340, 14, 34, 16, 2, 3, 820, 'meat', ['gluten', 'soy'], 'Pan-fried dumplings'],
  ]),
  build('sunrise', 'Sunrise Griddle', 'Breakfast', '🥞', 'All-day breakfast and coffee', [
    ['Buttermilk Pancake Stack', 'Griddle', 920, 18, 148, 28, 4, 62, 1890, 'vegetarian', ['gluten', 'dairy', 'egg'], 'Three pancakes, butter, maple syrup'],
    ['Veggie Egg-White Omelet', 'Eggs', 340, 32, 12, 18, 4, 6, 780, 'vegetarian', ['egg', 'dairy'], 'Spinach, peppers, mushrooms, feta, side of fruit'],
    ['Farmhouse Scramble', 'Eggs', 760, 38, 42, 48, 4, 4, 1640, 'meat', ['egg', 'dairy'], 'Three eggs, sausage, cheddar, hash browns'],
    ['Avocado Toast with Egg', 'Toasts', 430, 18, 38, 23, 9, 4, 620, 'vegetarian', ['gluten', 'egg'], 'Sourdough, smashed avocado, poached egg, chili flakes'],
    ['Steel-Cut Oatmeal', 'Bowls', 320, 10, 58, 6, 8, 16, 150, 'vegan', [], 'Berries, cinnamon, brown sugar on the side'],
    ['Greek Yogurt Parfait', 'Bowls', 360, 22, 48, 9, 5, 28, 110, 'vegetarian', ['dairy', 'nuts'], 'Yogurt, granola, berries, honey'],
    ['Breakfast Burrito', 'Mains', 840, 36, 72, 44, 6, 5, 1780, 'meat', ['gluten', 'egg', 'dairy'], 'Eggs, bacon, potatoes, cheese, salsa'],
    ['Smoked Salmon Bagel', 'Toasts', 520, 28, 58, 19, 3, 7, 1280, 'fish', ['gluten', 'fish', 'dairy'], 'Everything bagel, cream cheese, capers'],
    ['Turkey Bacon (3)', 'Sides', 110, 9, 1, 8, 0, 0, 480, 'meat', [], 'Three slices'],
    ['Caramel Iced Latte', 'Drinks', 290, 8, 46, 8, 0, 42, 150, 'vegetarian', ['dairy'], '16 oz, whole milk'],
  ]),
  build('wok', 'Lucky Wok', 'Chinese', '🥡', 'Wok-fired plates and noodles', [
    ['Orange Chicken', 'Mains', 820, 36, 96, 32, 3, 44, 1640, 'meat', ['gluten', 'soy', 'egg'], 'Battered chicken, sweet citrus glaze, steamed rice'],
    ['Chicken & Broccoli', 'Mains', 440, 40, 28, 18, 5, 8, 1380, 'meat', ['soy', 'gluten'], 'Stir-fried in garlic sauce', 'Ask for steamed rice on the side and eat half.'],
    ['Beef Lo Mein', 'Noodles', 880, 36, 104, 34, 6, 12, 2460, 'meat', ['gluten', 'soy', 'egg'], 'Egg noodles, beef, vegetables'],
    ['Steamed Shrimp & Vegetables', 'Mains', 310, 32, 22, 9, 6, 7, 980, 'fish', ['shellfish', 'soy'], 'Light ginger-soy sauce on the side'],
    ['Mapo Tofu', 'Mains', 480, 26, 20, 33, 4, 5, 1520, 'meat', ['soy'], 'Silken tofu, minced pork, chili-bean sauce'],
    ["Buddha's Delight", 'Mains', 360, 16, 34, 18, 9, 9, 1090, 'vegan', ['soy'], 'Tofu and mixed vegetables in light sauce'],
    ['Pork Fried Rice', 'Rice', 760, 24, 98, 29, 3, 4, 1720, 'meat', ['egg', 'soy'], 'Large portion'],
    ['Hot & Sour Soup', 'Starters', 130, 8, 12, 5, 2, 3, 990, 'vegetarian', ['egg', 'soy'], 'Bowl'],
    ['Vegetable Spring Rolls (2)', 'Starters', 290, 5, 34, 15, 3, 4, 560, 'vegan', ['gluten'], 'Fried, sweet chili sauce'],
    ['Steamed Brown Rice', 'Sides', 220, 5, 46, 2, 4, 0, 10, 'vegan', [], 'One cup'],
  ]),
  build('olive', 'Olive & Thyme', 'Mediterranean', '🥙', 'Grill plates, wraps and mezze', [
    ['Chicken Shawarma Plate', 'Plates', 690, 52, 58, 27, 8, 6, 1420, 'meat', ['gluten', 'dairy'], 'Chicken, rice, salad, hummus, pita'],
    ['Grilled Chicken Kebab Salad', 'Salads', 430, 44, 18, 20, 6, 8, 880, 'meat', ['dairy'], 'Greek salad, two chicken skewers, tzatziki'],
    ['Lamb Gyro Wrap', 'Wraps', 760, 34, 62, 41, 4, 7, 1690, 'meat', ['gluten', 'dairy'], 'Lamb, tomato, onion, tzatziki in pita'],
    ['Falafel Wrap', 'Wraps', 640, 20, 82, 26, 13, 8, 1310, 'vegan', ['gluten'], 'Falafel, pickles, tahini, pita'],
    ['Grilled Salmon Plate', 'Plates', 620, 42, 44, 30, 7, 5, 760, 'fish', ['fish'], 'Salmon, lemon rice, roasted vegetables'],
    ['Lentil Soup', 'Starters', 230, 14, 36, 4, 12, 4, 820, 'vegan', [], 'Bowl, lemon wedge'],
    ['Hummus & Pita', 'Starters', 460, 14, 56, 21, 9, 2, 890, 'vegan', ['gluten'], 'House hummus, warm pita'],
    ['Tabbouleh', 'Sides', 180, 4, 22, 9, 5, 3, 320, 'vegan', ['gluten'], 'Parsley, bulgur, tomato, lemon'],
    ['Baklava', 'Desserts', 340, 5, 40, 19, 2, 24, 180, 'vegetarian', ['gluten', 'nuts', 'dairy'], 'Two pieces'],
  ]),
  build('fresh', 'Fresh Press Deli', 'Sandwiches & Salads', '🥗', 'Made-to-order sandwiches, salads and smoothies', [
    ['Turkey & Avocado on Wheat', 'Sandwiches', 510, 34, 48, 21, 9, 7, 1260, 'meat', ['gluten'], 'Roast turkey, avocado, greens, mustard'],
    ['Italian Sub (12 in)', 'Sandwiches', 1140, 52, 96, 60, 5, 12, 3120, 'meat', ['gluten', 'dairy'], 'Salami, ham, provolone, oil & vinegar', 'A 6-inch with extra vegetables halves everything.'],
    ['Tuna Melt', 'Sandwiches', 720, 38, 46, 42, 3, 6, 1390, 'fish', ['gluten', 'fish', 'dairy', 'egg'], 'Tuna salad, cheddar, grilled sourdough'],
    ['Chicken Caesar Wrap', 'Wraps', 680, 40, 52, 34, 4, 4, 1540, 'meat', ['gluten', 'dairy', 'egg', 'fish'], 'Chicken, romaine, parmesan, caesar dressing'],
    ['Harvest Grain Bowl', 'Bowls', 520, 18, 72, 19, 12, 14, 690, 'vegan', ['nuts'], 'Quinoa, roasted squash, kale, cranberries, almonds'],
    ['Grilled Chicken Power Salad', 'Salads', 420, 42, 24, 18, 8, 9, 720, 'meat', ['egg'], 'Chicken, egg, chickpeas, greens, lemon vinaigrette'],
    ['Tomato Basil Soup', 'Soups', 260, 5, 28, 15, 4, 16, 940, 'vegetarian', ['dairy'], 'Bowl'],
    ['Green Protein Smoothie', 'Drinks', 290, 24, 38, 5, 6, 26, 180, 'vegetarian', ['dairy'], 'Spinach, banana, whey, almond milk'],
    ['Kettle Chips', 'Sides', 220, 3, 24, 13, 2, 0, 210, 'vegan', [], 'Single bag'],
    ['Chocolate Chunk Cookie', 'Desserts', 420, 5, 56, 21, 2, 34, 310, 'vegetarian', ['gluten', 'dairy', 'egg'], 'Bakery size'],
  ]),
];

export function findSample(id: string): Restaurant | undefined {
  return CATALOG.find((r) => r.id === id);
}
