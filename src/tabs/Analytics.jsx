// Analytics tab: this week's calories, weekly total and daily average.
import { ZERO, add, currentWeek, num, fmt0 } from '../lib/calc.js'
import { Card, SectionTitle, PageTitle, StatTile, MacroBar, muted } from '../components/ui.jsx'
import { BarChart } from '../components/Charts.jsx'

export default function Analytics({ profile, meals, activeDay }) {
  // Days are the manually finished tracking days, anchored on the active one.
  const days = currentWeek(meals, activeDay.date)
  const total = days.reduce((t, d) => add(t, d.totals), ZERO)

  // Average over days that have data, so unlogged and future days
  // don't drag it towards zero.
  const logged = days.filter((d) => d.totals.calories > 0).length
  const avg = (value) => (logged > 0 ? value / logged : 0)

  return (
    <>
      <PageTitle>This Week</PageTitle>

      <div className="flex gap-4">
        <StatTile title="Weekly Total" value={fmt0(total.calories)} unit="kcal" />
        <StatTile title="Daily Average" value={fmt0(avg(total.calories))} unit="kcal" />
      </div>

      <Card>
        <SectionTitle>Calories per Day</SectionTitle>
        <div className="mt-3">
          <BarChart
            days={days.map((d) => ({ label: d.label, value: d.totals.calories }))}
            goal={num(profile.calorieGoal)}
          />
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionTitle>Average Daily Macros</SectionTitle>
          <span className={`text-xs ${muted}`}>{logged} of 7 days logged</span>
        </div>
        {logged === 0 ? (
          <p className={`text-sm ${muted}`}>Log a meal to see your weekly averages.</p>
        ) : (
          <>
            <MacroBar label="Protein" value={avg(total.protein)} goal={num(profile.proteinGoal)} color="bg-lilac" />
            <MacroBar label="Carbs" value={avg(total.carbs)} goal={num(profile.carbsGoal)} color="bg-carbs" />
            <MacroBar label="Fats" value={avg(total.fat)} goal={num(profile.fatGoal)} color="bg-fat" />
          </>
        )}
      </Card>
    </>
  )
}
