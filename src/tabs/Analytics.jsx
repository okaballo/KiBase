// Analytics tab: calories over a chosen interval (Week / Month / 6 Months /
// Year), the period total and daily average, and average daily macros.
// Days are the manually finished tracking days, anchored on the active one.
//
// In the Week and Month views a day can be tapped on the chart to see its
// totals and delete it (all its meals). Deleting the current day also goes
// back to the previous day, which undoes an accidental Start New Day.
// A day can also be marked as a cheat day: its bar gets a red/blue gradient.
import { useState } from 'react'
import {
  INTERVALS, periodStats, tdee, num, fmt0, ZERO, add, mealDay, mealTotals, parseDay, previousDay,
} from '../lib/calc.js'
import {
  Card, SectionTitle, PageTitle, StatTile, MacroBar, MacroSummary, ConfirmDialog, muted, faint, accentText,
} from '../components/ui.jsx'
import { BarChart } from '../components/Charts.jsx'
import { t, locale } from '../lib/i18n.js'

const mealCount = (n) => (n === 1 ? t('1 meal') : t('{n} meals', { n }))
const longDate = (key) =>
  parseDay(key).toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' })

/** Totals for the selected day, a cheat day toggle, and Delete Day with a confirmation. */
function DayDetails({ dayKey, meals, activeDay, cheat, onToggleCheat, onDeleteDay, onClose }) {
  const [confirming, setConfirming] = useState(false)
  const dayMeals = meals.filter((m) => mealDay(m) === dayKey)
  const totals = dayMeals.reduce((sum, m) => add(sum, mealTotals(m)), ZERO)
  const isActive = dayKey === activeDay.date
  const prev = isActive ? previousDay(meals, dayKey) : null
  // Nothing to delete: a day without meals that isn't the current one.
  const canDelete = dayMeals.length > 0 || Boolean(prev)
  const day = longDate(dayKey)

  const message = isActive && prev
    ? t("This deletes {day} ({meals}) and makes {prev} your current day again, so you can keep logging there. It can't be undone.",
      { day, meals: mealCount(dayMeals.length), prev: longDate(prev) })
    : t("This permanently deletes {day} and the {meals} logged on it. It can't be undone.",
      { day, meals: mealCount(dayMeals.length) })

  return (
    <Card className="space-y-3 ring-1 ring-royal/30">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <SectionTitle>{day}</SectionTitle>
          <div className="flex flex-wrap gap-x-2 text-xs font-semibold">
            {isActive && <span className={accentText}>{t('Current Day')}</span>}
            {cheat && <span className="bg-gradient-to-r from-[#FF3547] to-[#B791FF] bg-clip-text text-transparent">{t('Cheat Day')}</span>}
          </div>
        </div>
        <button onClick={onClose} aria-label={t('Close')} className={`-me-1 px-1 text-xl leading-none ${faint}`}>×</button>
      </div>

      {dayMeals.length === 0 ? (
        <p className={`text-sm ${muted}`}>{t('No meals logged on this day.')}</p>
      ) : (
        <div className="flex items-end justify-between gap-3">
          <div className="space-y-1">
            <p className={`text-sm ${muted}`}>{mealCount(dayMeals.length)}</p>
            <MacroSummary macros={totals} />
          </div>
          <p className={`text-2xl font-bold tabular-nums ${accentText}`}>
            {fmt0(totals.calories)} <span className={`text-xs font-normal ${muted}`}>{t('kcal')}</span>
          </p>
        </div>
      )}

      {isActive && prev && (
        <p className={`text-xs ${faint}`}>
          {t('Started a new day by mistake? Deleting this day takes you back to {prev}.', { prev: longDate(prev) })}
        </p>
      )}

      <button
        onClick={onToggleCheat}
        aria-pressed={cheat}
        className={`w-full rounded-2xl py-3 text-sm font-semibold transition active:opacity-80 ${
          cheat
            ? 'border border-[#6A95D6]/50 text-[#4d7bc2] dark:text-[#8fb2e6]'
            : 'bg-gradient-to-r from-[#FF3547] to-[#6039AA] text-white shadow-[0_2px_12px_rgba(255,53,71,0.3)]'
        }`}
      >
        {t(cheat ? 'Unmark Cheat Day' : 'Mark as Cheat Day')}
      </button>

      {canDelete && (
        <button
          onClick={() => setConfirming(true)}
          className="w-full rounded-2xl border border-fat-deep/40 py-3 text-sm font-semibold text-fat-deep transition active:bg-fat/15 dark:border-fat/40 dark:text-fat"
        >
          {t('Delete Day')}
        </button>
      )}

      {confirming && (
        <ConfirmDialog
          title={t('Delete {name}?', { name: day })}
          message={message}
          confirmLabel={t('Delete')}
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            onDeleteDay(dayKey)
            setConfirming(false)
            onClose()
          }}
        />
      )}
    </Card>
  )
}

/** Small pill chips for the interval. */
const Chips = ({ options, value, onChange }) => (
  <div className="flex gap-2" role="tablist" aria-label={t('Time interval')}>
    {options.map((option) => (
      <button
        key={option}
        role="tab"
        aria-selected={value === option}
        onClick={() => onChange(option)}
        className={`flex-1 rounded-full py-1.5 text-[13px] font-medium transition ${
          value === option
            ? 'bg-royal text-white shadow-[0_2px_10px_rgba(120,81,169,0.45)]'
            : 'bg-black/5 text-zinc-500 dark:bg-white/10 dark:text-white/60'
        }`}
      >
        {t(option)}
      </button>
    ))}
  </div>
)

// `profile` already carries the latest logged weight (see App), so maintenance
// follows your weight as it changes.
export default function Analytics({ profile, meals, activeDay, onDeleteDay, cheatDays = [], onToggleCheatDay }) {
  const [interval, setPeriod] = useState('Week')
  const [selected, setSelected] = useState(null) // 'YYYY-MM-DD' of the tapped day
  const maintenance = tdee(profile).maintenance
  const { bars, total, logged, elapsed, range, monthly, burned, maintenanceTotal, finished } =
    periodStats(meals, activeDay.date, interval, maintenance)
  const chartBars = monthly ? bars : bars.map((b) => ({ ...b, cheat: cheatDays.includes(b.key) }))
  // Only days shown in the current chart can stay selected.
  const selectedKey = !monthly && bars.some((b) => b.key === selected) ? selected : null

  // Average over days that have data, so unlogged and future days
  // don't drag it towards zero.
  const avg = (value) => (logged > 0 ? value / logged : 0)

  return (
    <>
      <PageTitle>{t('Analytics')}</PageTitle>

      <Chips options={INTERVALS} value={interval} onChange={setPeriod} />
      <p className={`-mt-2 text-center text-xs ${muted}`}>{range}</p>

      <div className="flex gap-4">
        <StatTile title={t(interval === 'Week' ? 'Weekly Total' : 'Period Total')} value={fmt0(total.calories)} unit={t('kcal')} />
        <StatTile
          title={t('Calories Burned')}
          value={fmt0(burned)}
          unit={t('kcal')}
          sub={finished > 0 ? t('of {n} maintenance', { n: fmt0(maintenanceTotal) }) : t('No finished days yet')}
        />
      </div>

      <Card>
        <SectionTitle>{t(monthly ? 'Average Calories per Day, by Month' : 'Calories per Day')}</SectionTitle>
        <div className="mt-3">
          <BarChart
            bars={chartBars}
            goal={num(profile.calorieGoal)}
            label={`${t(monthly ? 'Average Calories per Day, by Month' : 'Calories per Day')}, ${range}`}
            selected={selectedKey}
            onSelect={monthly ? undefined : setSelected}
          />
        </div>
        {!monthly && !selectedKey && (
          <p className={`mt-2 text-center text-xs ${faint}`}>{t('Tap a day to see its details or delete it.')}</p>
        )}
      </Card>

      {selectedKey && (
        <DayDetails
          key={selectedKey}
          dayKey={selectedKey} meals={meals} activeDay={activeDay}
          cheat={cheatDays.includes(selectedKey)} onToggleCheat={() => onToggleCheatDay(selectedKey)}
          onDeleteDay={onDeleteDay} onClose={() => setSelected(null)}
        />
      )}

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionTitle>{t('Average Daily Macros')}</SectionTitle>
          <span className={`text-xs ${muted}`}>{t('{logged} of {elapsed} days logged', { logged, elapsed })}</span>
        </div>
        {logged === 0 ? (
          <p className={`text-sm ${muted}`}>{t('No meals logged in this period yet.')}</p>
        ) : (
          <>
            <MacroBar label={t('Protein')} value={avg(total.protein)} goal={num(profile.proteinGoal)} color="bg-lilac" />
            <MacroBar label={t('Carbs')} value={avg(total.carbs)} goal={num(profile.carbsGoal)} color="bg-carbs" />
            <MacroBar label={t('Fats')} value={avg(total.fat)} goal={num(profile.fatGoal)} color="bg-fat" />
          </>
        )}
      </Card>
    </>
  )
}
