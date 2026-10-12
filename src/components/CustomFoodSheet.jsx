// Create or edit a custom item. Values are per 100 g; when logging later you
// only type the grams. Pass `food` to edit an existing item.
import { useState } from 'react'
import { num, fmt0 } from '../lib/calc.js'
import { Card, SectionTitle, FieldRow, PrimaryButton, Sheet, TextInput, ConfirmDialog, muted } from './ui.jsx'

const text = (n) => (n === undefined || n === null ? '' : String(n))

export default function CustomFoodSheet({ food, onSave, onDelete, onClose }) {
  const editing = Boolean(food)
  const [form, setForm] = useState(() => ({
    name: food?.name ?? '',
    protein: text(food?.protein),
    carbs: text(food?.carbs),
    fat: text(food?.fat),
    calories: text(food?.calories),
  }))
  const [confirmDelete, setConfirmDelete] = useState(false)
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
    onSave({ id: food?.id ?? crypto.randomUUID(), name: form.name.trim(), calories, protein, carbs, fat, custom: true })
    onClose()
  }

  return (
    <Sheet title={editing ? 'Edit Custom Item' : 'Custom Meal'} onClose={onClose} z="z-50">
      <Card className="space-y-3.5">
        <SectionTitle>{editing ? food.name : 'Create a custom meal'}</SectionTitle>
        <p className={`text-[13px] ${muted}`}>
          Enter the values per 100 g. When you log it later you only type the grams.
        </p>
        <TextInput value={form.name} onChange={set('name')} placeholder="Name (e.g. Chicken Rice Bowl)" />
        <FieldRow label="Protein" unit="g" placeholder="0" value={form.protein} onChange={set('protein')} />
        <FieldRow label="Carbs" unit="g" placeholder="0" value={form.carbs} onChange={set('carbs')} />
        <FieldRow label="Fats" unit="g" placeholder="0" value={form.fat} onChange={set('fat')} />
        <FieldRow
          label="Calories" unit="kcal"
          placeholder={estimated > 0 ? fmt0(estimated) : '0'}
          value={form.calories} onChange={set('calories')}
        />
        <p className={`text-xs ${muted}`}>Leave calories empty to calculate them from the macros.</p>
      </Card>

      <PrimaryButton onClick={save} disabled={!canSave}>{editing ? 'Save Changes' : 'Save Custom Meal'}</PrimaryButton>
      {editing && (
        <button onClick={() => setConfirmDelete(true)} className="w-full py-2 text-sm font-medium text-fat-deep dark:text-fat">
          Delete item
        </button>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={`Delete ${food.name}?`}
          message="Meals you already logged with it are not affected."
          confirmLabel="Delete"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => { onDelete(food.id); onClose() }}
        />
      )}
    </Sheet>
  )
}
