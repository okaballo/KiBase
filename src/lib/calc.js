// All the maths and formatting lives here, so components only display results.

export const ZERO = { calories: 0, protein: 0, carbs: 0, fat: 0 }

export const add = (a, b) => ({
  calories: a.calories + b.calories,
  protein: a.protein + b.protein,
  carbs: a.carbs + b.carbs,
  fat: a.fat + b.fat,
})

/** The dynamic macro calculator: per-100 g values scaled to any weight. */
export const scale = (per100, grams) => {
  const f = Math.max(grams, 0) / 100
  return {
    calories: per100.calories * f,
    protein: per100.protein * f,
    carbs: per100.carbs * f,
    fat: per100.fat * f,
  }
}

export const mealTotals = (meal) =>
  meal.items.reduce((t, item) => add(t, scale(item, item.grams)), ZERO)

export const mealGrams = (meal) => meal.items.reduce((g, item) => g + item.grams, 0)

/** Parses typed numbers, accepting "." or "," decimals. Invalid input is 0. */
export const num = (value) => {
  const n = parseFloat(String(value ?? '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

export const fmt0 = (n) => Math.round(n).toLocaleString()
export const fmt1 = (n) => (Math.round(n * 10) / 10).toLocaleString()

/** Local calendar day as "YYYY-MM-DD". */
export const dayKey = (date = new Date()) => {
  const d = new Date(date)
  const p = (x) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// ---- TDEE ----------------------------------------------------------------

export const ACTIVITY = [
  ['Sedentary', 1.2],
  ['Lightly active', 1.375],
  ['Moderately active', 1.55],
  ['Very active', 1.725],
  ['Athlete', 1.9],
]

export const GOALS = { Cut: -500, Maintain: 0, Bulk: 300 }

/**
 * Mifflin-St Jeor BMR x activity multiplier, adjusted for the goal.
 * Macro split: protein 2 g per kg, fat 25% of calories, carbs the rest.
 */
export const tdee = (profile) => {
  const weight = num(profile.weightKg)
  const base = 10 * weight + 6.25 * num(profile.heightCm) - 5 * num(profile.age)
  const bmr = profile.sex === 'Female' ? base - 161 : base + 5
  const multiplier = (ACTIVITY.find(([name]) => name === profile.activity) || ACTIVITY[1])[1]
  const maintenance = bmr * multiplier
  const target = Math.max(maintenance + (GOALS[profile.goal] ?? 0), 1200)
  const protein = weight * 2
  const fat = (target * 0.25) / 9
  const carbs = Math.max((target - protein * 4 - fat * 9) / 4, 0)
  return { bmr, maintenance, target, protein, carbs, fat }
}

// ---- Weekly analytics ----------------------------------------------------

/** First day of the week for the device's region (0 = Sunday), Monday if unknown. */
const firstWeekday = () => {
  try {
    const locale = new Intl.Locale(navigator.language)
    const info = locale.getWeekInfo?.() ?? locale.weekInfo
    return info ? info.firstDay % 7 : 1
  } catch {
    return 1
  }
}

/** Seven { date, label, totals } entries for the current week. */
export const currentWeek = (meals, now = new Date()) => {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  start.setDate(start.getDate() - ((start.getDay() - firstWeekday() + 7) % 7))

  const byDay = {}
  for (const meal of meals) {
    const key = dayKey(meal.date)
    byDay[key] = add(byDay[key] || ZERO, mealTotals(meal))
  }

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    return {
      date,
      label: date.toLocaleDateString(undefined, { weekday: 'short' }),
      totals: byDay[dayKey(date)] || ZERO,
    }
  })
}
