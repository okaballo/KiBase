// Meal Divider: build a big batch (foods and/or saved meals), divide it into
// X portions, and save one portion as a custom item for quick logging.
//
// State
//   picked       batch ingredients (same shape as Log Meal, lib/picked.js)
//   portionsText "Divide by" value as typed
//   name         name for the saved portion
// Everything else (totals, per-portion macros) is derived on each render, so
// the result updates instantly as any input changes.
import { useState } from 'react'
import { ZERO, add, scale, num, fmt0, fmt1, divideBatch } from '../lib/calc.js'
import {
  Card, SectionTitle, Sheet, TextInput, PrimaryButton, MacroSummary,
  muted, faint, accentText, carbsText, fatText, fieldBg,
} from './ui.jsx'
import { FoodPicker, PickedList } from './FoodPicker.jsx'
import { t } from '../lib/i18n.js'

const round1 = (n) => Math.round(n * 10) / 10

const MacroTile = ({ label, value, color }) => (
  <div className={`flex-1 rounded-xl py-2.5 text-center ${fieldBg}`}>
    <p className={`font-semibold tabular-nums ${color}`}>{fmt1(value)} {t('g')}</p>
    <p className={`text-xs ${muted}`}>{label}</p>
  </div>
)

export default function MealDividerSheet({ foods, customFoods, templates, onSave, onClose }) {
  const [picked, setPicked] = useState([])
  const [portionsText, setPortionsText] = useState('4')
  const [name, setName] = useState('')
  const [saved, setSaved] = useState(false)

  const totals = picked.reduce((sum, p) => add(sum, scale(p.food, num(p.grams))), ZERO)
  const rawGrams = picked.reduce((g, p) => g + num(p.grams), 0)
  const portions = Math.round(num(portionsText))
  const valid = picked.length > 0 && rawGrams > 0 && portions >= 1
  const { weight, portionGrams, perPortion, per100g } = divideBatch(totals, rawGrams, portions)

  const stepPortions = (delta) => setPortionsText(String(Math.max((portions || 1) + delta, 1)))

  // Saved as a normal custom item (per 100 g, like every other item) plus a
  // default portion size, so logging it later starts at exactly one portion.
  const save = () => {
    onSave({
      id: crypto.randomUUID(),
      name: name.trim(),
      calories: round1(per100g.calories),
      protein: round1(per100g.protein),
      carbs: round1(per100g.carbs),
      fat: round1(per100g.fat),
      custom: true,
      servingGrams: Math.round(portionGrams),
      batch: { portions, weight: Math.round(weight) },
    })
    setSaved(true)
    setTimeout(onClose, 700)
  }

  return (
    <Sheet title={t('Meal Divider')} onClose={onClose} z="z-50" closeLabel="Close">
      {/* ---- 1. The batch ---- */}
      <Card className="space-y-3.5">
        <SectionTitle>{t('Batch Ingredients')}</SectionTitle>
        {picked.length === 0 ? (
          <p className={`text-sm ${muted}`}>
            {t('Add everything that went into the pot from the list below, with the weights you used. A saved meal adds all of its items.')}
          </p>
        ) : (
          <>
            <PickedList picked={picked} setPicked={setPicked} />
            <div className="flex items-baseline justify-between border-t border-black/5 pt-3 dark:border-white/10">
              <span className={`text-sm ${muted}`}>{t('Whole batch · {n} g', { n: fmt0(rawGrams) })}</span>
              <span className="text-end">
                <span className="font-semibold tabular-nums">{fmt0(totals.calories)} {t('kcal')}</span>
                <span className="block"><MacroSummary macros={totals} /></span>
              </span>
            </div>
          </>
        )}
      </Card>

      {/* ---- 2. Divide by ---- */}
      <Card className="space-y-3.5">
        <SectionTitle>{t('Divide By')}</SectionTitle>
        <div className="flex items-center justify-center gap-5">
          <button
            onClick={() => stepPortions(-1)} aria-label={t('Fewer portions')}
            className={`flex h-11 w-11 items-center justify-center rounded-full bg-royal/10 text-2xl leading-none dark:bg-royal/25 ${accentText}`}
          >
            −
          </button>
          <div className="text-center">
            <input
              inputMode="numeric" value={portionsText}
              onChange={(e) => setPortionsText(e.target.value.replace(/[^\d]/g, ''))}
              aria-label={t('Number of portions')}
              className="w-20 bg-transparent text-center text-4xl font-bold tabular-nums outline-none"
            />
            <p className={`text-xs ${muted}`}>{t(portions === 1 ? 'portion' : 'portions')}</p>
          </div>
          <button
            onClick={() => stepPortions(1)} aria-label={t('More portions')}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-royal text-2xl leading-none text-white"
          >
            +
          </button>
        </div>
      </Card>

      {/* ---- 3. Per portion (updates instantly) ---- */}
      <Card className="space-y-3.5 ring-1 ring-royal/30">
        <div className="flex items-baseline justify-between">
          <SectionTitle>{t('Per Portion')}</SectionTitle>
          {valid && <span className={`text-sm tabular-nums ${muted}`}>{t('≈ {n} g each', { n: fmt0(portionGrams) })}</span>}
        </div>
        {valid ? (
          <>
            <p>
              <span className={`glow-text text-[44px] font-bold leading-none tabular-nums ${accentText}`}>{fmt0(perPortion.calories)}</span>{' '}
              <span className={`text-sm ${muted}`}>{t('kcal')}</span>
            </p>
            <div className="flex gap-2">
              <MacroTile label={t('Protein')} value={perPortion.protein} color={accentText} />
              <MacroTile label={t('Carbs')} value={perPortion.carbs} color={carbsText} />
              <MacroTile label={t('Fats')} value={perPortion.fat} color={fatText} />
            </div>
            <p className={`text-xs ${faint}`}>
              {t('Per 100 g: {kcal} kcal · P {p} · C {c} · F {f}', {
                kcal: fmt0(per100g.calories), p: fmt1(per100g.protein), c: fmt1(per100g.carbs), f: fmt1(per100g.fat),
              })}
            </p>
            <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder={t('Name, e.g. Chicken & Rice prep')} />
            <PrimaryButton onClick={save} disabled={!name.trim() || saved}>
              {t(saved ? 'Saved to My Items ✓' : 'Save as New Custom Meal')}
            </PrimaryButton>
          </>
        ) : (
          <p className={`text-sm ${muted}`}>
            {t(picked.length === 0 ? 'Add ingredients to see the macros per portion.' : 'Enter at least 1 portion.')}
          </p>
        )}
      </Card>

      {/* ---- Picker ---- */}
      <Card className="space-y-3">
        <SectionTitle>{t('Add Ingredients')}</SectionTitle>
        <FoodPicker foods={foods} customFoods={customFoods} templates={templates} picked={picked} setPicked={setPicked} />
      </Card>
    </Sheet>
  )
}
