// Custom meal template: saved once as per-100 g values, then logged later
// by typing only the grams.
import { useState } from 'react'
import { num, fmt0 } from '../lib/calc.js'
import { Card, SectionTitle, FieldRow, PrimaryButton, Sheet } from './ui.jsx'

export default function CustomFoodSheet({ onSave, onClose }) {
  const [form, setForm] = useState({ name: '', protein: '', carbs: '', fat: '', calories: '' })
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const protein = num(form.protein)
  const carbs = num(form.carbs)
  const fat = num(form.fat)
  // Calories left empty are derived from the macros (4 / 4 / 9 kcal per gram).
  const estimated = protein * 4 + carbs * 4 + fat * 9
  const calories = form.calories.trim() ? num(form.calories) : estimated

  // No upper limits: any non-negative numbers are accepted.
  const canSave = form.name.trim() && Math.min(calories, protein, carbs, fat) >= 0

  const save = () => {
    onSave({ id: crypto.randomUUID(), name: form.name.trim(), calories, protein, carbs, fat, custom: true })
    onClose()
  }

  return (
    <Sheet title="New Custom Meal" onClose={onClose} z="z-50">
      <Card className="space-y-3.5">
        <SectionTitle>Custom Meal</SectionTitle>
        <p className="text-[13px] text-white/60">
          Enter the values per 100 g. When you log it later you only type the grams.
        </p>
        <input
          value={form.name}
          onChange={set('name')}
          placeholder="Name (e.g. Chicken Rice Bowl)"
          className="w-full rounded-xl bg-field px-3.5 py-2.5 outline-none placeholder:text-white/30"
        />
        <FieldRow label="Protein" unit="g" placeholder="0" value={form.protein} onChange={set('protein')} />
        <FieldRow label="Carbs" unit="g" placeholder="0" value={form.carbs} onChange={set('carbs')} />
        <FieldRow label="Fats" unit="g" placeholder="0" value={form.fat} onChange={set('fat')} />
        <FieldRow
          label="Calories" unit="kcal"
          placeholder={estimated > 0 ? fmt0(estimated) : '0'}
          value={form.calories} onChange={set('calories')}
        />
        <p className="text-xs text-white/60">Leave calories empty to calculate them from the macros.</p>
      </Card>
      <PrimaryButton onClick={save} disabled={!canSave}>Save Custom Meal</PrimaryButton>
    </Sheet>
  )
}
