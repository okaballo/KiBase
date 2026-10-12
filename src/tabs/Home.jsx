// Home tab: KiBase header, calorie ring (with the active day inside it),
// three macro rings, and the meals of the ACTIVE tracking day.
// The day only changes when the user confirms Start New Day.
import { useState } from 'react'
import { ZERO, add, mealTotals, mealGrams, mealDay, parseDay, num, fmt0 } from '../lib/calc.js'
import {
  Card, SectionTitle, PrimaryButton, CalorieRing, MiniRing, MacroSummary, Avatar,
  ConfirmDialog, NameDialog, muted, faint, accentText, divider,
} from '../components/ui.jsx'

export default function Home({
  profile, avatar, meals, activeDay,
  onAddMeal, onDeleteMeal, onStartNewDay, onSaveTemplate, onOpenProfile,
}) {
  const [confirming, setConfirming] = useState(false)
  const [savingMeal, setSavingMeal] = useState(null) // meal being saved as a template
  const [savedId, setSavedId] = useState(null)       // briefly highlights the save icon

  // Only the active day's meals count, and only they are listed, so the
  // dashboard AND the meal list both start empty after Start New Day.
  const dayMeals = meals.filter((m) => mealDay(m) === activeDay.date) // newest first
  const dayLabel = parseDay(activeDay.date).toLocaleDateString(undefined, {
    weekday: 'long', day: 'numeric', month: 'short',
  })
  const totals = dayMeals.reduce((t, m) => add(t, mealTotals(m)), ZERO)

  const goal = num(profile.calorieGoal)
  const progress = goal > 0 ? Math.min(totals.calories / goal, 1) : 0

  // Copies the meal's components (per-100 g values + grams) into a template.
  const saveTemplate = (name) => {
    onSaveTemplate({ id: crypto.randomUUID(), name, items: savingMeal.items.map((item) => ({ ...item })) })
    setSavedId(savingMeal.id)
    setTimeout(() => setSavedId(null), 2000)
    setSavingMeal(null)
  }

  return (
    <>
      {/* ---- Brand header ---- */}
      <header className="flex items-center justify-between pt-2">
        <h1 className="text-[30px] font-extrabold leading-none tracking-tight">
          <span className="bg-linear-to-br from-lilac to-royal bg-clip-text text-transparent">Ki</span>Base
        </h1>
        <button onClick={onOpenProfile} aria-label="Open profile" className="rounded-full transition active:scale-95">
          <Avatar src={avatar} name={profile.name} size={40} />
        </button>
      </header>

      {/* ---- Calories (active day shown inside the card) ---- */}
      <Card>
        <div className="flex items-baseline justify-between">
          <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${muted}`}>Current Day</p>
          <p className="text-sm font-semibold">{dayLabel}</p>
        </div>
        <div className="mt-3">
          <CalorieRing progress={progress} remaining={goal - totals.calories} />
        </div>
        <div className="mt-4 grid grid-cols-2 divide-x divide-black/5 text-center dark:divide-white/10">
          <div>
            <p className="text-xl font-semibold tabular-nums">{fmt0(totals.calories)}</p>
            <p className={`text-xs ${muted}`}>Eaten</p>
          </div>
          <div>
            <p className="text-xl font-semibold tabular-nums">{fmt0(goal)}</p>
            <p className={`text-xs ${muted}`}>Goal</p>
          </div>
        </div>
      </Card>

      {/* ---- Macros as three small rings ---- */}
      <Card>
        <SectionTitle>Macros</SectionTitle>
        <div className="mt-4 grid grid-cols-3">
          <MiniRing label="Protein" value={totals.protein} goal={num(profile.proteinGoal)} color="#9b6fe0" />
          <MiniRing label="Carbs" value={totals.carbs} goal={num(profile.carbsGoal)} color="#8c9eff" />
          <MiniRing label="Fats" value={totals.fat} goal={num(profile.fatGoal)} color="#ed85d9" />
        </div>
      </Card>

      {/* ---- Meals of the active day ---- */}
      <Card>
        <SectionTitle>Recent Meals</SectionTitle>
        {dayMeals.length === 0 ? (
          <div className="mt-3 space-y-3 text-center">
            <p className={muted}>No meals logged for this day yet.</p>
            <PrimaryButton onClick={onAddMeal}>Log a meal</PrimaryButton>
          </div>
        ) : (
          <ul className={`mt-1 divide-y ${divider}`}>
            {dayMeals.map((meal) => {
              const t = mealTotals(meal)
              const when = new Date(meal.date).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
              const saved = savedId === meal.id
              return (
                <li key={meal.id} className="flex items-start gap-2 py-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="line-clamp-2 text-sm font-semibold">{meal.name}</p>
                    <p className={`text-xs ${muted}`}>{when} · {fmt0(mealGrams(meal))} g</p>
                    <MacroSummary macros={t} glow />
                  </div>
                  <div className="text-right">
                    <p className={`glow-text font-semibold tabular-nums ${accentText}`}>{fmt0(t.calories)}</p>
                    <p className={`text-[11px] ${muted}`}>kcal</p>
                  </div>
                  <button
                    onClick={() => setSavingMeal(meal)}
                    aria-label={`Save ${meal.name} as a template`}
                    className={`p-1 transition ${saved ? `glow-text ${accentText}` : faint}`}
                  >
                    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill={saved ? 'currentColor' : 'none'}
                      stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
                      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDeleteMeal(meal.id)}
                    aria-label={`Delete ${meal.name}`}
                    className={`px-1 text-xl leading-none ${faint}`}
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
        className={`w-full rounded-2xl border border-royal py-3.5 font-semibold transition active:bg-royal/15 ${accentText}`}
      >
        Start New Day
      </button>
      <p className={`-mt-2 text-center text-xs ${faint}`}>
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
          }) and clears the dashboard and meal list. It can't be undone.`}
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
