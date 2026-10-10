// Built-in food database. Values are per 100 g, from standard USDA-style
// reference figures; brands vary, so edit any row to match what you buy.
// [name, kcal, protein, carbs, fat]
const ROWS = [
  // Protein sources
  ['Whole Eggs', 143, 12.6, 0.7, 9.5],
  ['Egg Whites', 52, 10.9, 0.7, 0.2],
  ['Chicken Breast (raw)', 120, 22.5, 0, 2.6],
  ['Chicken Breast (cooked)', 165, 31, 0, 3.6],
  ['Lean Ground Beef 90% (raw)', 176, 20, 0, 10],
  ['Salmon (raw)', 208, 20.4, 0, 13.4],
  ['Tuna (canned in water)', 116, 25.5, 0, 0.8],
  ['Whey Protein Powder', 400, 80, 8, 6],
  // Dairy
  ['Whole Milk', 61, 3.2, 4.8, 3.3],
  ['Greek Yogurt (non-fat)', 59, 10.2, 3.6, 0.4],
  ['Cheddar Cheese', 403, 24.9, 1.3, 33.1],
  ['Butter', 717, 0.9, 0.1, 81.1],
  // Carbs
  ['White Bread', 265, 9, 49, 3.2],
  ['Oats', 389, 16.9, 66.3, 6.9],
  ['White Rice (raw)', 365, 7.1, 80, 0.7],
  ['White Rice (cooked)', 130, 2.7, 28.2, 0.3],
  ['Pasta (dry)', 371, 13, 74.7, 1.5],
  ['Potato (raw)', 77, 2, 17, 0.1],
  ['Sweet Potato (raw)', 86, 1.6, 20.1, 0.1],
  ['Lentils (cooked)', 116, 9, 20.1, 0.4],
  ['Fava Beans (cooked)', 110, 7.6, 19.7, 0.4],
  ['Honey', 304, 0.3, 82.4, 0],
  // Fats
  ['Olive Oil', 884, 0, 0, 100],
  ['Peanut Butter', 588, 25, 20, 50],
  ['Almonds', 579, 21.2, 21.6, 49.9],
  ['Avocado', 160, 2, 8.5, 14.7],
  // Fruit & veg
  ['Banana', 89, 1.1, 22.8, 0.3],
  ['Apple', 52, 0.3, 13.8, 0.2],
  ['Broccoli', 34, 2.8, 6.6, 0.4],
]

export const SEED_FOODS = ROWS.map(([name, calories, protein, carbs, fat], i) => ({
  id: `seed-${i}`, name, calories, protein, carbs, fat, custom: false,
}))
