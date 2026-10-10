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

// ---- Manual tracking days ---------------------------------------------------
// A "tracking day" is a label ("YYYY-MM-DD") that only changes when the user
// taps Start New Day. The clock never changes it.

/** "YYYY-MM-DD" -> local Date (avoids the UTC shift of new Date(string)). */
export const parseDay = (key) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** The tracking day a meal belongs to. Meals logged before this feature
 *  existed have no `day`, so they fall back to their calendar date. */
export const mealDay = (meal) => meal.day ?? dayKey(meal.date)

/**
 * Label for the day that starts when the user taps Start New Day:
 * today's calendar date, or the day after the current one if that is later.
 * This keeps every tracking day unique, e.g. finishing Saturday at 1 AM on
 * Sunday starts "Sunday"; finishing Saturday early at 10 PM also starts "Sunday".
 */
export const nextTrackingDay = (activeDate, now = new Date()) => {
  const next = parseDay(activeDate)
  next.setDate(next.getDate() + 1)
  const dayAfter = dayKey(next)
  const today = dayKey(now)
  return dayAfter > today ? dayAfter : today
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

/**
 * Seven { date, label, totals } entries for the week containing the active
 * tracking day. Meals are grouped by their tracking day, not by the clock.
 */
export const currentWeek = (meals, activeDate = dayKey()) => {
  const start = parseDay(activeDate)
  start.setDate(start.getDate() - ((start.getDay() - firstWeekday() + 7) % 7))

  const byDay = {}
  for (const meal of meals) {
    const key = mealDay(meal)
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
