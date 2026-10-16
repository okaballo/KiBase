// Analytics tab: calories over a chosen interval (Week / Month / 6 Months /
// Year), the period total and daily average, and average daily macros.
// Days are the manually finished tracking days, anchored on the active one.
import { useState } from 'react'
import { INTERVALS, periodStats, tdee, num, fmt0 } from '../lib/calc.js'
import { Card, SectionTitle, PageTitle, StatTile, MacroBar, muted } from '../components/ui.jsx'
import { BarChart } from '../components/Charts.jsx'
import { t } from '../lib/i18n.js'

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
export default function Analytics({ profile, meals, activeDay }) {
  const [interval, setPeriod] = useState('Week')
  const maintenance = tdee(profile).maintenance
  const { bars, total, logged, elapsed, range, monthly, burned, maintenanceTotal, finished } =
    periodStats(meals, activeDay.date, interval, maintenance)

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
            bars={bars}
            goal={num(profile.calorieGoal)}
            label={`${t(monthly ? 'Average Calories per Day, by Month' : 'Calories per Day')}, ${range}`}
          />
        </div>
      </Card>

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
