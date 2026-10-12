// Plan & Goals: TDEE calculator and daily goals (opened from the Profile tab).
import { useState } from 'react'
import { tdee, ACTIVITY, GOALS, fmt0 } from '../lib/calc.js'
import {
  Card, SectionTitle, PrimaryButton, FieldRow, Segmented, Sheet,
  muted, accentText, carbsText, fatText, fieldBg,
} from './ui.jsx'

const Tile = ({ label, value, unit, color = '' }) => (
  <div className={`flex-1 rounded-xl py-2.5 text-center ${fieldBg}`}>
    <p className={`text-sm font-semibold tabular-nums ${color}`}>{fmt0(value)} {unit}</p>
    <p className={`text-xs ${muted}`}>{label}</p>
  </div>
)

export default function PlanSheet({ profile, onChange, onClose }) {
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

  return (
    <Sheet title="Plan & Goals" onClose={onClose} closeLabel="Close">
      <Card className="space-y-3.5">
        <SectionTitle>TDEE Calculator</SectionTitle>
        <Segmented options={['Male', 'Female']} value={profile.sex} onChange={(sex) => onChange({ sex })} />
        <FieldRow label="Age" unit="yrs" inputMode="numeric" value={profile.age} onChange={set('age')} />
        <FieldRow label="Height" unit="cm" value={profile.heightCm} onChange={set('heightCm')} />
        <FieldRow label="Weight" unit="kg" value={profile.weightKg} onChange={set('weightKg')} />
        <label className={`flex items-center rounded-xl px-3.5 py-2.5 ${fieldBg}`}>
          <span className="flex-1">Activity</span>
          <select value={profile.activity} onChange={set('activity')} className={`bg-transparent text-right outline-none ${accentText}`}>
            {ACTIVITY.map(([name]) => <option key={name}>{name}</option>)}
          </select>
        </label>
        <p className={`text-sm ${muted}`}>Goal</p>
        <Segmented options={Object.keys(GOALS)} value={profile.goal} onChange={(goal) => onChange({ goal })} />
      </Card>

      <Card className="space-y-3.5">
        <SectionTitle>Your Numbers</SectionTitle>
        <p>
          <span className={`text-[44px] font-bold leading-none tabular-nums ${accentText}`}>{fmt0(result.target)}</span>{' '}
          <span className={`text-sm ${muted}`}>kcal / day to {profile.goal.toLowerCase()}</span>
        </p>
        <div className="flex gap-2">
          <Tile label="BMR" value={result.bmr} unit="kcal" />
          <Tile label="Maintenance" value={result.maintenance} unit="kcal" />
        </div>
        <div className="flex gap-2">
          <Tile label="Protein" value={result.protein} unit="g" color={accentText} />
          <Tile label="Carbs" value={result.carbs} unit="g" color={carbsText} />
          <Tile label="Fats" value={result.fat} unit="g" color={fatText} />
        </div>
        <PrimaryButton onClick={apply}>{applied ? 'Goals Updated' : 'Use as My Daily Goals'}</PrimaryButton>
      </Card>

      <Card className="space-y-3.5">
        <SectionTitle>Current Daily Goals</SectionTitle>
        <p className={`text-[13px] ${muted}`}>
          These drive the Home and Analytics tabs. Edit them directly or apply the calculator above.
        </p>
        <FieldRow label="Calories" unit="kcal" inputMode="numeric" value={profile.calorieGoal} onChange={set('calorieGoal')} />
        <FieldRow label="Protein" unit="g" inputMode="numeric" value={profile.proteinGoal} onChange={set('proteinGoal')} />
        <FieldRow label="Carbs" unit="g" inputMode="numeric" value={profile.carbsGoal} onChange={set('carbsGoal')} />
        <FieldRow label="Fats" unit="g" inputMode="numeric" value={profile.fatGoal} onChange={set('fatGoal')} />
      </Card>
    </Sheet>
  )
}
