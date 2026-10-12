// Edit a saved meal template: rename it, change each ingredient's grams,
// or remove ingredients. Opened from the ">" arrow in Log Meal > My Items.
import { useState } from 'react'
import { ZERO, add, scale, num, fmt0 } from '../lib/calc.js'
import {
  Card, SectionTitle, Sheet, TextInput, MacroSummary, ConfirmDialog,
  muted, faint, accentText, fieldBg,
} from './ui.jsx'

export default function TemplateEditSheet({ template, onSave, onDelete, onClose }) {
  const [name, setName] = useState(template.name)
  const [items, setItems] = useState(() =>
    template.items.map((item) => ({ ...item, key: crypto.randomUUID(), gramsText: String(item.grams) })),
  )
  const [confirmDelete, setConfirmDelete] = useState(false)

  const totals = items.reduce((t, i) => add(t, scale(i, num(i.gramsText))), ZERO)
  const canSave = name.trim() && items.length > 0 && items.every((i) => num(i.gramsText) > 0)

  const save = () => {
    onSave({
      ...template,
      name: name.trim(),
      items: items.map(({ key, gramsText, ...item }) => ({ ...item, grams: num(gramsText) })),
    })
    onClose()
  }

  return (
    <Sheet
      title="Edit Saved Meal" onClose={onClose} z="z-50"
      action={<button onClick={save} disabled={!canSave} className={`font-semibold disabled:opacity-35 ${accentText}`}>Save</button>}
    >
      <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Template name" aria-label="Template name" />

      <Card className="space-y-3.5">
        <SectionTitle>Ingredients</SectionTitle>
        {items.length === 0 && <p className={`text-sm ${muted}`}>Add at least one ingredient to keep this meal.</p>}
        {items.map((item) => {
          const m = scale(item, num(item.gramsText))
          return (
            <div key={item.key} className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.name}</p>
                <div className="flex flex-wrap gap-x-2 text-xs">
                  <span className={`tabular-nums ${accentText}`}>{fmt0(m.calories)} kcal</span>
                  <MacroSummary macros={m} />
                </div>
              </div>
              <input
                inputMode="decimal" value={item.gramsText}
                onChange={(e) => setItems((list) => list.map((x) => (x.key === item.key ? { ...x, gramsText: e.target.value } : x)))}
                aria-label={`Grams of ${item.name}`}
                className={`w-16 rounded-lg px-2 py-2 text-right tabular-nums outline-none ${fieldBg}`}
              />
              <span className={muted}>g</span>
              <button
                onClick={() => setItems((list) => list.filter((x) => x.key !== item.key))}
                aria-label={`Remove ${item.name}`}
                className={`px-1 text-xl leading-none ${faint}`}
              >
                ×
              </button>
            </div>
          )
        })}
      </Card>

      <Card>
        <div className="flex items-baseline justify-between">
          <SectionTitle>Total</SectionTitle>
          <p className={`text-2xl font-bold tabular-nums ${accentText}`}>
            {fmt0(totals.calories)} <span className={`text-xs font-normal ${muted}`}>kcal</span>
          </p>
        </div>
        <div className="mt-2"><MacroSummary macros={totals} /></div>
      </Card>

      <button onClick={() => setConfirmDelete(true)} className="w-full py-2 text-sm font-medium text-fat-deep dark:text-fat">
        Delete saved meal
      </button>

      {confirmDelete && (
        <ConfirmDialog
          title={`Delete ${template.name}?`}
          message="Meals you already logged from it are not affected."
          confirmLabel="Delete"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => { onDelete(template.id); onClose() }}
        />
      )}
    </Sheet>
  )
}
