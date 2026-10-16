// Plan & Goals: TDEE calculator and daily goals (opened from the Profile tab).
import { useState } from 'react'
import { tdee, ACTIVITY, GOALS, fmt0, fmt1, parseDay } from '../lib/calc.js'
import {
  Card, SectionTitle, PrimaryButton, FieldRow, Segmented, Sheet,
  muted, faint, accentText, carbsText, fatText, fieldBg,
} from './ui.jsx'
import { t, locale } from '../lib/i18n.js'

const Tile = ({ label, value, unit, color = '' }) => (
  <div className={`flex-1 rounded-xl py-2.5 text-center ${fieldBg}`}>
    <p className={`text-sm font-semibold tabular-nums ${color}`}>{fmt0(value)} {unit}</p>
    <p className={`text-xs ${muted}`}>{label}</p>
  </div>
)

// `profile.weightKg` is the latest entry from the Weight tab (App passes it
// in), so it is shown read-only here and the numbers follow every new weigh-in.
// `weighIn` is that entry, or undefined if nothing has been logged yet.
export default function PlanSheet({ profile, weighIn, onChange, onClose }) {
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
    <Sheet title={t('Plan & Goals')} onClose={onClose} closeLabel="Close">
      <Card className="space-y-3.5">
        <SectionTitle>{t('TDEE Calculator')}</SectionTitle>
        <Segmented options={['Male', 'Female']} value={profile.sex} onChange={(sex) => onChange({ sex })} />
        <FieldRow label={t('Age')} unit={t('yrs')} inputMode="numeric" value={profile.age} onChange={set('age')} />
        <FieldRow label={t('Height')} unit={t('cm')} value={profile.heightCm} onChange={set('heightCm')} />
        <div className={`rounded-xl px-3.5 py-2.5 ${fieldBg}`} aria-live="polite">
          <div className="flex items-center">
            <span className="flex-1">{t('Weight')}</span>
            <span className="tabular-nums font-medium">{fmt1(profile.weightKg)} <span className={muted}>{t('kg')}</span></span>
          </div>
          <p className={`mt-0.5 text-xs ${faint}`}>
            {weighIn
              ? t('Latest weigh-in, {date}. Log new weights in the Weight tab.', {
                date: parseDay(weighIn.date).toLocaleDateString(locale(), { day: 'numeric', month: 'short' }),
              })
              : t('No weight logged yet. Log one in the Weight tab and it will appear here.')}
          </p>
        </div>
        <label className={`flex items-center rounded-xl px-3.5 py-2.5 ${fieldBg}`}>
          <span className="flex-1">{t('Activity')}</span>
          <select value={profile.activity} onChange={set('activity')} className={`bg-transparent text-end outline-none ${accentText}`}>
            {ACTIVITY.map(([name]) => <option key={name} value={name}>{t(name)}</option>)}
          </select>
        </label>
        <p className={`text-sm ${muted}`}>{t('Goal')}</p>
        <Segmented options={Object.keys(GOALS)} value={profile.goal} onChange={(goal) => onChange({ goal })} />
      </Card>

      <Card className="space-y-3.5">
        <SectionTitle>{t('Your Numbers')}</SectionTitle>
        <p>
          <span className={`text-[44px] font-bold leading-none tabular-nums ${accentText}`}>{fmt0(result.target)}</span>{' '}
          <span className={`text-sm ${muted}`}>{t(`kcal / day to ${profile.goal.toLowerCase()}`)}</span>
        </p>
        <div className="flex gap-2">
          <Tile label={t('BMR')} value={result.bmr} unit={t('kcal')} />
          <Tile label={t('Maintenance')} value={result.maintenance} unit={t('kcal')} />
        </div>
        <div className="flex gap-2">
          <Tile label={t('Protein')} value={result.protein} unit={t('g')} color={accentText} />
          <Tile label={t('Carbs')} value={result.carbs} unit={t('g')} color={carbsText} />
          <Tile label={t('Fats')} value={result.fat} unit={t('g')} color={fatText} />
        </div>
        <PrimaryButton onClick={apply}>{t(applied ? 'Goals Updated' : 'Use as My Daily Goals')}</PrimaryButton>
      </Card>

      <Card className="space-y-3.5">
        <SectionTitle>{t('Current Daily Goals')}</SectionTitle>
        <p className={`text-[13px] ${muted}`}>
          {t('These drive the Home and Analytics tabs. Edit them directly or apply the calculator above.')}
        </p>
        <FieldRow label={t('Calories')} unit={t('kcal')} inputMode="numeric" value={profile.calorieGoal} onChange={set('calorieGoal')} />
        <FieldRow label={t('Protein')} unit={t('g')} inputMode="numeric" value={profile.proteinGoal} onChange={set('proteinGoal')} />
        <FieldRow label={t('Carbs')} unit={t('g')} inputMode="numeric" value={profile.carbsGoal} onChange={set('carbsGoal')} />
        <FieldRow label={t('Fats')} unit={t('g')} inputMode="numeric" value={profile.fatGoal} onChange={set('fatGoal')} />
      </Card>
    </Sheet>
  )
}
