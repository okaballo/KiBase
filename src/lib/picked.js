// Pure helpers for the "In This Meal" list in Log Meal.
// Each entry: { key, food, grams (string, as typed), foodId?, group? }
//   foodId - set for single foods picked from Database / Custom Items
//   group  - set for items that came from a saved meal template (its id)
import { num } from './calc.js'

/** Grams added or removed by one tap on a food's + / − control. */
export const STEP_GRAMS = 25

const round1 = (n) => Math.round(n * 10) / 10

/** Saved meal/template items -> picker entries, so they can be edited. */
export const toPicked = (items) =>
  items.map((item) => ({ key: crypto.randomUUID(), food: item, grams: String(item.grams) }))

/** Picker entries -> saved items. Per-100 g values are COPIED in, so later
 *  edits to a custom food never change meals already logged. */
export const toItems = (picked) =>
  picked.map(({ food, grams }) => ({
    name: food.name, grams: num(grams),
    calories: food.calories, protein: food.protein, carbs: food.carbs, fat: food.fat,
  }))

/** Changes one food's grams by `delta`; removes it when it reaches 0. */
export const stepFood = (list, foodId, delta) =>
  list.flatMap((p) => {
    if (p.foodId !== foodId) return [p]
    const grams = round1(num(p.grams) + delta)
    return grams > 0 ? [{ ...p, grams: String(grams) }] : []
  })

/**
 * Changes a template from `from` to `to` servings by scaling all of its
 * items' grams proportionally (so any grams you edited keep their ratio).
 * `to` of 0 removes the template's items.
 */
export const scaleGroup = (list, groupId, from, to) =>
  to <= 0
    ? list.filter((p) => p.group !== groupId)
    : list.map((p) =>
        p.group === groupId ? { ...p, grams: String(round1((num(p.grams) * to) / from)) } : p,
      )
