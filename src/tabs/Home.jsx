// Home tab: calorie ring, macro bars and recent meals.
import { ZERO, add, mealTotals, mealGrams, num, fmt0, dayKey } from '../lib/calc.js'
import { Card, SectionTitle, PageTitle, PrimaryButton, CalorieRing, MacroBar, MacroSummary } from '../components/ui.jsx'

export default function Home({ profile, meals, onAddMeal, onDeleteMeal }) {
  const today = dayKey()
  const totals = meals
    .filter((m) => dayKey(m.date) === today)
    .reduce((t, m) => add(t, mealTotals(m)), ZERO)

  const goal = num(profile.calorieGoal)
  const progress = goal > 0 ? Math.min(totals.calories / goal, 1) : 0
  const recent = meals.slice(0, 8) // meals are stored newest first

  return (
    <>
      <PageTitle
        action={
          <button
            onClick={onAddMeal}
            aria-label="Log a meal"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-royal text-2xl leading-none"
          >
            +
          </button>
        }
      >
        Today
      </PageTitle>

      <Card>
        <CalorieRing progress={progress} remaining={goal - totals.calories} />
        <div className="mt-4 grid grid-cols-2 divide-x divide-white/10 text-center">
          <div>
            <p className="text-xl font-semibold tabular-nums">{fmt0(totals.calories)}</p>
            <p className="text-xs text-white/60">Eaten</p>
          </div>
          <div>
            <p className="text-xl font-semibold tabular-nums">{fmt0(goal)}</p>
            <p className="text-xs text-white/60">Goal</p>
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionTitle>Macros</SectionTitle>
        <MacroBar label="Protein" value={totals.protein} goal={num(profile.proteinGoal)} color="bg-lilac" />
        <MacroBar label="Carbs" value={totals.carbs} goal={num(profile.carbsGoal)} color="bg-carbs" />
        <MacroBar label="Fats" value={totals.fat} goal={num(profile.fatGoal)} color="bg-fat" />
      </Card>

      <Card>
        <SectionTitle>Recent Meals</SectionTitle>
        {recent.length === 0 ? (
          <div className="mt-3 space-y-3 text-center">
            <p className="text-white/60">Nothing logged yet.</p>
            <PrimaryButton onClick={onAddMeal}>Log your first meal</PrimaryButton>
          </div>
        ) : (
          <ul className="mt-1 divide-y divide-white/10">
            {recent.map((meal) => {
              const t = mealTotals(meal)
              const when = new Date(meal.date).toLocaleString(undefined, {
                weekday: 'short', hour: 'numeric', minute: '2-digit',
              })
              return (
                <li key={meal.id} className="flex items-start gap-3 py-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="line-clamp-2 text-sm font-semibold">{meal.name}</p>
                    <p className="text-xs text-white/60">{when} · {fmt0(mealGrams(meal))} g</p>
                    <MacroSummary macros={t} />
                  </div>
                  <div className="text-right">
                    <p className="font-semibold tabular-nums text-lilac">{fmt0(t.calories)}</p>
                    <p className="text-[11px] text-white/60">kcal</p>
                  </div>
                  <button
                    onClick={() => onDeleteMeal(meal.id)}
                    aria-label={`Delete ${meal.name}`}
                    className="px-1 text-xl leading-none text-white/40"
                  >
                    ×
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </>
  )
}
