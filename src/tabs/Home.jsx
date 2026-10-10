// Home tab: calorie ring, macro bars and recent meals for the ACTIVE tracking
// day. The day only changes when the user confirms Start New Day; midnight
// does nothing.
import { useState } from 'react'
import { ZERO, add, mealTotals, mealGrams, mealDay, parseDay, num, fmt0 } from '../lib/calc.js'
import {
  Card, SectionTitle, PageTitle, PrimaryButton, CalorieRing, MacroBar, MacroSummary,
  ConfirmDialog, NameDialog,
} from '../components/ui.jsx'

export default function Home({
  profile, meals, activeDay, onAddMeal, onDeleteMeal, onStartNewDay, onSaveTemplate,
}) {
  const [confirming, setConfirming] = useState(false)
  const [savingMeal, setSavingMeal] = useState(null) // meal being saved as a template
  const [savedId, setSavedId] = useState(null)       // briefly highlights the save icon

  const dayMeals = meals.filter((m) => mealDay(m) === activeDay.date)
  const dayLabel = parseDay(activeDay.date).toLocaleDateString(undefined, {
    weekday: 'long', day: 'numeric', month: 'short',
  })
  const totals = dayMeals.reduce((t, m) => add(t, mealTotals(m)), ZERO)

  const goal = num(profile.calorieGoal)
  const progress = goal > 0 ? Math.min(totals.calories / goal, 1) : 0
  const recent = meals.slice(0, 8) // meals are stored newest first

  // Copies the meal's components (with their per-100 g values and grams)
  // into a reusable template under the chosen name.
  const saveTemplate = (name) => {
    onSaveTemplate({
      id: crypto.randomUUID(),
      name,
      items: savingMeal.items.map((item) => ({ ...item })),
    })
    setSavedId(savingMeal.id)
    setTimeout(() => setSavedId(null), 2000)
    setSavingMeal(null)
  }

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
        Current Day
      </PageTitle>
      <p className="-mt-3 text-sm text-white/60">{dayLabel}</p>

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
                <li key={meal.id} className="flex items-start gap-2 py-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="line-clamp-2 text-sm font-semibold">{meal.name}</p>
                    <p className="text-xs text-white/60">{when} · {fmt0(mealGrams(meal))} g</p>
                    <MacroSummary macros={t} glow />
                  </div>
                  <div className="text-right">
                    <p className="glow-text font-semibold tabular-nums text-lilac">{fmt0(t.calories)}</p>
                    <p className="text-[11px] text-white/60">kcal</p>
                  </div>
                  <button
                    onClick={() => setSavingMeal(meal)}
                    aria-label={`Save ${meal.name} as a template`}
                    className={`p-1 transition ${savedId === meal.id ? 'glow-text text-lilac' : 'text-white/40'}`}
                  >
                    {/* bookmark icon */}
                    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill={savedId === meal.id ? 'currentColor' : 'none'}
                      stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
                      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1z" />
                    </svg>
                  </button>
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

      {/* Outlined and at the very bottom, so it is hard to hit by accident. */}
      <button
        onClick={() => setConfirming(true)}
        className="w-full rounded-2xl border border-royal py-3.5 font-semibold text-lilac transition active:bg-royal/20"
      >
        Start New Day
      </button>
      <p className="-mt-2 text-center text-xs text-white/45">
        Meals keep counting towards {dayLabel} until you start a new day.
      </p>

      {savingMeal && (
        <NameDialog
          title="Save as meal template"
          message={`${savingMeal.items.length} ${savingMeal.items.length === 1 ? 'item' : 'items'}. Find it under My Items when you log a meal.`}
          initial={savingMeal.name}
          confirmLabel="Save"
          onCancel={() => setSavingMeal(null)}
          onConfirm={saveTemplate}
        />
      )}

      {confirming && (
        <ConfirmDialog
          title="Start a new day?"
          message={`This finishes ${dayLabel} (${fmt0(totals.calories)} kcal, ${dayMeals.length} ${
            dayMeals.length === 1 ? 'meal' : 'meals'
          }) and resets the dashboard to zero. It can't be undone.`}
          confirmLabel="Start New Day"
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            onStartNewDay()
            setConfirming(false)
          }}
        />
      )}
    </>
  )
}
