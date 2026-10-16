// Home tab: KiBase header, calorie ring (with the active day inside it),
// three macro rings, and the meals of the ACTIVE tracking day.
// The day only changes when the user confirms Start New Day.
import { useState } from 'react'
import { ZERO, add, mealTotals, mealGrams, mealDay, parseDay, num, fmt0 } from '../lib/calc.js'
import {
  Card, SectionTitle, PrimaryButton, CalorieRing, MiniRing, MacroSummary, Avatar,
  ConfirmDialog, NameDialog, muted, faint, accentText, divider,
} from '../components/ui.jsx'
import { t, locale } from '../lib/i18n.js'

export default function Home({
  profile, avatar, meals, activeDay,
  onAddMeal, onEditMeal, onDeleteMeal, onStartNewDay, onSaveTemplate, onOpenProfile,
}) {
  const [confirming, setConfirming] = useState(false)
  const [savingMeal, setSavingMeal] = useState(null) // meal being saved as a template
  const [savedId, setSavedId] = useState(null)       // briefly highlights the save icon

  // Only the active day's meals count, and only they are listed, so the
  // dashboard AND the meal list both start empty after Start New Day.
  const dayMeals = meals.filter((m) => mealDay(m) === activeDay.date) // newest first
  const dayLabel = parseDay(activeDay.date).toLocaleDateString(locale(), {
    weekday: 'long', day: 'numeric', month: 'short',
  })
  const totals = dayMeals.reduce((sum, m) => add(sum, mealTotals(m)), ZERO)

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
        <h1 dir="ltr" className="text-[30px] font-extrabold leading-none tracking-tight">
          <span className="bg-linear-to-br from-lilac to-royal bg-clip-text text-transparent">Ki</span>Base
        </h1>
        <button onClick={onOpenProfile} aria-label={t('Open profile')} className="rounded-full transition active:scale-95">
          <Avatar src={avatar} name={profile.name} size={40} />
        </button>
      </header>

      {/* ---- Calories (active day shown inside the card) ---- */}
      <Card>
        <div className="flex items-baseline justify-between">
          <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${muted}`}>{t('Current Day')}</p>
          <p className="text-sm font-semibold">{dayLabel}</p>
        </div>
        <div className="mt-3">
          <CalorieRing progress={progress} remaining={goal - totals.calories} />
        </div>
        <div className="mt-4 grid grid-cols-2 divide-x divide-black/5 text-center dark:divide-white/10">
          <div>
            <p className="text-xl font-semibold tabular-nums">{fmt0(totals.calories)}</p>
            <p className={`text-xs ${muted}`}>{t('Eaten')}</p>
          </div>
          <div>
            <p className="text-xl font-semibold tabular-nums">{fmt0(goal)}</p>
            <p className={`text-xs ${muted}`}>{t('Goal')}</p>
          </div>
        </div>
      </Card>

      {/* ---- Macros as three small rings ---- */}
      <Card>
        <SectionTitle>{t('Macros')}</SectionTitle>
        <div className="mt-4 grid grid-cols-3">
          <MiniRing label={t('Protein')} value={totals.protein} goal={num(profile.proteinGoal)} color="#9b6fe0" />
          <MiniRing label={t('Carbs')} value={totals.carbs} goal={num(profile.carbsGoal)} color="#8c9eff" />
          <MiniRing label={t('Fats')} value={totals.fat} goal={num(profile.fatGoal)} color="#ed85d9" />
        </div>
      </Card>

      {/* ---- Meals of the active day ---- */}
      <Card>
        <SectionTitle>{t('Recent Meals')}</SectionTitle>
        {dayMeals.length === 0 ? (
          <div className="mt-3 space-y-3 text-center">
            <p className={muted}>{t('No meals logged for this day yet.')}</p>
            <PrimaryButton onClick={onAddMeal}>{t('Log a meal')}</PrimaryButton>
          </div>
        ) : (
          <ul className={`mt-1 divide-y ${divider}`}>
            {dayMeals.map((meal) => {
              const mt = mealTotals(meal)
              const when = new Date(meal.date).toLocaleTimeString(locale(), { hour: 'numeric', minute: '2-digit' })
              const saved = savedId === meal.id
              return (
                <li key={meal.id} className="flex items-start gap-2 py-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="line-clamp-2 text-sm font-semibold">{meal.name}</p>
                    <p className={`text-xs ${muted}`}>{when} · {fmt0(mealGrams(meal))} {t('g')}</p>
                    <MacroSummary macros={mt} glow />
                  </div>
                  <div className="text-end">
                    <p className={`glow-text font-semibold tabular-nums ${accentText}`}>{fmt0(mt.calories)}</p>
                    <p className={`text-[11px] ${muted}`}>{t('kcal')}</p>
                  </div>
                  <button
                    onClick={() => onEditMeal(meal)}
                    aria-label={t('Edit {name}', { name: meal.name })}
                    className={`p-1 transition active:scale-90 ${faint}`}
                  >
                    {/* pencil */}
                    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" />
                      <path d="m13.5 6.5 4 4" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setSavingMeal(meal)}
                    aria-label={t('Save {name} as a template', { name: meal.name })}
                    className={`p-1 transition ${saved ? `glow-text ${accentText}` : faint}`}
                  >
                    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill={saved ? 'currentColor' : 'none'}
                      stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
                      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDeleteMeal(meal.id)}
                    aria-label={t('Delete {name}', { name: meal.name })}
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
        {t('Start New Day')}
      </button>
      <p className={`-mt-2 text-center text-xs ${faint}`}>
        {t('Meals keep counting towards {day} until you start a new day.', { day: dayLabel })}
      </p>

      {savingMeal && (
        <NameDialog
          title={t('Save as meal template')}
          message={t(
            savingMeal.items.length === 1
              ? '1 item. Find it under My Items when you log a meal.'
              : '{n} items. Find it under My Items when you log a meal.',
            { n: savingMeal.items.length },
          )}
          initial={savingMeal.name}
          confirmLabel={t('Save')}
          onCancel={() => setSavingMeal(null)}
          onConfirm={saveTemplate}
        />
      )}

      {confirming && (
        <ConfirmDialog
          title={t('Start a new day?')}
          message={t(
            dayMeals.length === 1
              ? "This finishes {day} ({kcal} kcal, 1 meal) and clears the dashboard and meal list. It can't be undone."
              : "This finishes {day} ({kcal} kcal, {n} meals) and clears the dashboard and meal list. It can't be undone.",
            { day: dayLabel, kcal: fmt0(totals.calories), n: dayMeals.length },
          )}
          confirmLabel={t('Start New Day')}
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
