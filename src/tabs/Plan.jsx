// Plan tab: TDEE calculator, daily goals and shortcuts into meal entry.
import { useState } from 'react'
import { tdee, ACTIVITY, GOALS, fmt0 } from '../lib/calc.js'
import { Card, SectionTitle, PageTitle, PrimaryButton, FieldRow, Segmented } from '../components/ui.jsx'

export default function Plan({ profile, onChange, onAddMeal, onNewCustom }) {
  const [applied, setApplied] = useState(false)
  const result = tdee(profile)
  const set = (key) => (e) => onChange({ [key]: e.target.value })

  const apply = () => {
    onChange({
      calorieGoal: Math.round(result.target),
      proteinGoal: Math.round(result.protein),
      carbsGoal: Math.round(result.carbs),
      fatGoal: Math.round(result.fat),
    })
    setApplied(true)
    setTimeout(() => setApplied(false), 2000)
  }

  const Tile = ({ label, value, unit, color = '' }) => (
    <div className="flex-1 rounded-xl bg-field py-2.5 text-center">
      <p className={`text-sm font-semibold tabular-nums ${color}`}>{fmt0(value)} {unit}</p>
      <p className="text-xs text-white/60">{label}</p>
    </div>
  )

  return (
    <>
      <PageTitle>Plan</PageTitle>

      <Card className="space-y-3">
        <SectionTitle>Meal Entry</SectionTitle>
        <PrimaryButton onClick={onAddMeal}>Log a Meal</PrimaryButton>
        <button onClick={onNewCustom} className="w-full py-1.5 text-sm font-medium text-lilac">
          Create Custom Meal
        </button>
      </Card>

      <Card className="space-y-3.5">
        <SectionTitle>TDEE Calculator</SectionTitle>
        <Segmented options={['Male', 'Female']} value={profile.sex} onChange={(sex) => onChange({ sex })} />
        <FieldRow label="Age" unit="yrs" inputMode="numeric" value={profile.age} onChange={set('age')} />
        <FieldRow label="Height" unit="cm" value={profile.heightCm} onChange={set('heightCm')} />
        <FieldRow label="Weight" unit="kg" value={profile.weightKg} onChange={set('weightKg')} />
        <label className="flex items-center rounded-xl bg-field px-3.5 py-2.5">
          <span className="flex-1">Activity</span>
          <select value={profile.activity} onChange={set('activity')} className="bg-transparent text-right text-lilac outline-none">
            {ACTIVITY.map(([name]) => <option key={name}>{name}</option>)}
          </select>
        </label>
        <p className="text-sm text-white/60">Goal</p>
        <Segmented options={Object.keys(GOALS)} value={profile.goal} onChange={(goal) => onChange({ goal })} />
      </Card>

      <Card className="space-y-3.5">
        <SectionTitle>Your Numbers</SectionTitle>
        <p>
          <span className="text-[44px] font-bold leading-none tabular-nums text-lilac">{fmt0(result.target)}</span>{' '}
          <span className="text-sm text-white/60">kcal / day to {profile.goal.toLowerCase()}</span>
        </p>
        <div className="flex gap-2">
          <Tile label="BMR" value={result.bmr} unit="kcal" />
          <Tile label="Maintenance" value={result.maintenance} unit="kcal" />
        </div>
        <div className="flex gap-2">
          <Tile label="Protein" value={result.protein} unit="g" color="text-lilac" />
          <Tile label="Carbs" value={result.carbs} unit="g" color="text-carbs" />
          <Tile label="Fats" value={result.fat} unit="g" color="text-fat" />
        </div>
        <PrimaryButton onClick={apply}>{applied ? 'Goals Updated' : 'Use as My Daily Goals'}</PrimaryButton>
      </Card>

      <Card className="space-y-3.5">
        <SectionTitle>Current Daily Goals</SectionTitle>
        <p className="text-[13px] text-white/60">
          These drive the Home and Analytics tabs. Edit them directly or apply the calculator above.
        </p>
        <FieldRow label="Calories" unit="kcal" inputMode="numeric" value={profile.calorieGoal} onChange={set('calorieGoal')} />
        <FieldRow label="Protein" unit="g" inputMode="numeric" value={profile.proteinGoal} onChange={set('proteinGoal')} />
        <FieldRow label="Carbs" unit="g" inputMode="numeric" value={profile.carbsGoal} onChange={set('carbsGoal')} />
        <FieldRow label="Fats" unit="g" inputMode="numeric" value={profile.fatGoal} onChange={set('fatGoal')} />
      </Card>
    </>
  )
}
