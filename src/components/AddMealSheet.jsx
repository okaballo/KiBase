// Meal entry: pick foods (or load a saved meal template), adjust the grams,
// and the totals update live from each item's per-100 g values.
//
// The picker has two views:
//   Database - the built-in ingredients
//   My Items - saved meal templates and the user's own custom items
import { useState } from 'react'
import { ZERO, add, scale, num, fmt0, fmt1 } from '../lib/calc.js'
import { Card, SectionTitle, MacroSummary, Segmented, Sheet } from './ui.jsx'

const newKey = () => crypto.randomUUID()

/** One tappable food line with an optional Delete button. */
function FoodRow({ food, onAdd, onDelete }) {
  return (
    <li className="flex items-center gap-2">
      <button onClick={onAdd} className="flex min-w-0 flex-1 items-center gap-2 py-2.5 text-left">
        <div className="min-w-0 flex-1">
          <p className="text-sm">{food.name}</p>
          <div className="flex flex-wrap gap-x-2 text-xs text-white/60">
            <span className="tabular-nums">{fmt0(food.calories)} kcal / 100 g</span>
            <MacroSummary macros={food} />
          </div>
        </div>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-royal text-lg leading-none">+</span>
      </button>
      {onDelete && (
        <button onClick={onDelete} aria-label={`Delete ${food.name}`} className="px-1 text-xs text-white/40">
          Delete
        </button>
      )}
    </li>
  )
}

export default function AddMealSheet({
  foods, customFoods, templates, onSave, onClose, onNewCustom, onDeleteFood, onDeleteTemplate,
}) {
  const [name, setName] = useState('')
  const [search, setSearch] = useState('')
  const [view, setView] = useState('Database')
  const [picked, setPicked] = useState([]) // [{ key, food, grams: '100' }]

  const totals = picked.reduce((t, p) => add(t, scale(p.food, num(p.grams))), ZERO)
  const canSave = picked.length > 0 && picked.every((p) => num(p.grams) > 0)

  const query = search.trim().toLowerCase()
  const matches = (x) => x.name.toLowerCase().includes(query)
  const dbResults = foods.filter(matches)
  const customResults = customFoods.filter(matches)
  const templateResults = templates.filter(matches)

  const addFood = (food) => setPicked((list) => [...list, { key: newKey(), food, grams: '100' }])

  // Loads every component of a template with its saved grams. Each one then
  // sits in "In This Meal" like any other item, so its grams can be changed.
  const loadTemplate = (template) => {
    setPicked((list) => [
      ...list,
      ...template.items.map((item) => ({ key: newKey(), food: item, grams: String(item.grams) })),
    ])
    setName((current) => current || template.name)
  }

  const setGrams = (key, grams) =>
    setPicked((list) => list.map((p) => (p.key === key ? { ...p, grams } : p)))

  const save = () => {
    onSave({
      id: newKey(),
      // No name given: build one from the foods.
      name: name.trim() || picked.map((p) => p.food.name).join(' + '),
      date: new Date().toISOString(),
      // Per-100 g values are copied in, so later food edits never change history.
      items: picked.map(({ food, grams }) => ({
        name: food.name, grams: num(grams),
        calories: food.calories, protein: food.protein, carbs: food.carbs, fat: food.fat,
      })),
    })
    onClose()
  }

  return (
    <Sheet
      title="Log Meal"
      onClose={onClose}
      action={
        <button onClick={save} disabled={!canSave} className="font-semibold text-lilac disabled:opacity-35">
          Save
        </button>
      }
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Meal name (optional)"
        className="w-full rounded-xl bg-field px-3.5 py-2.5 outline-none placeholder:text-white/30"
      />

      {picked.length > 0 && (
        <>
          <Card className="space-y-3.5">
            <SectionTitle>In This Meal</SectionTitle>
            {picked.map((p) => {
              const macros = scale(p.food, num(p.grams))
              return (
                <div key={p.key} className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.food.name}</p>
                    <div className="flex flex-wrap gap-x-2 text-xs">
                      <span className="tabular-nums text-lilac">{fmt0(macros.calories)} kcal</span>
                      <MacroSummary macros={macros} />
                    </div>
                  </div>
                  <input
                    inputMode="decimal"
                    value={p.grams}
                    onChange={(e) => setGrams(p.key, e.target.value)}
                    aria-label={`Grams of ${p.food.name}`}
                    className="w-16 rounded-lg bg-field px-2 py-2 text-right tabular-nums outline-none"
                  />
                  <span className="text-white/60">g</span>
                  <button
                    onClick={() => setPicked((list) => list.filter((x) => x.key !== p.key))}
                    aria-label={`Remove ${p.food.name}`}
                    className="px-1 text-xl leading-none text-white/50"
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </Card>

          <Card>
            <div className="flex items-baseline justify-between">
              <SectionTitle>Meal Total</SectionTitle>
              <p className="text-3xl font-bold tabular-nums text-lilac">
                {fmt0(totals.calories)} <span className="text-xs font-normal text-white/60">kcal</span>
              </p>
            </div>
            <div className="mt-3 grid grid-cols-3 text-center">
              {[['Protein', totals.protein, 'text-lilac'], ['Carbs', totals.carbs, 'text-carbs'], ['Fats', totals.fat, 'text-fat']].map(
                ([label, value, color]) => (
                  <div key={label}>
                    <p className={`font-semibold tabular-nums ${color}`}>{fmt1(value)} g</p>
                    <p className="text-xs text-white/60">{label}</p>
                  </div>
                ),
              )}
            </div>
          </Card>
        </>
      )}

      <Card className="space-y-3">
        <Segmented options={['Database', 'My Items']} value={view} onChange={setView} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={view === 'Database' ? 'Search foods' : 'Search my items'}
          autoCorrect="off"
          className="w-full rounded-xl bg-field px-3.5 py-2.5 outline-none placeholder:text-white/30"
        />

        {view === 'Database' ? (
          <>
            {dbResults.length === 0 && <p className="py-3 text-sm text-white/60">No foods match your search.</p>}
            <ul className="divide-y divide-white/5">
              {dbResults.map((food) => <FoodRow key={food.id} food={food} onAdd={() => addFood(food)} />)}
            </ul>
          </>
        ) : (
          <>
            {/* ---- Saved meal templates ---- */}
            <h3 className="pt-1 text-xs font-semibold uppercase tracking-wide text-white/45">Saved Meals</h3>
            {templateResults.length === 0 ? (
              <p className="text-sm text-white/60">
                {templates.length === 0
                  ? 'No saved meals yet. Tap the bookmark next to a meal on the Home tab to save it.'
                  : 'No saved meals match your search.'}
              </p>
            ) : (
              <ul className="divide-y divide-white/5">
                {templateResults.map((template) => {
                  const t = template.items.reduce((sum, item) => add(sum, scale(item, item.grams)), ZERO)
                  return (
                    <li key={template.id} className="flex items-center gap-2">
                      <button onClick={() => loadTemplate(template)} className="flex min-w-0 flex-1 items-center gap-2 py-2.5 text-left">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{template.name}</p>
                          <p className="truncate text-xs text-white/45">
                            {template.items.map((item) => `${fmt0(item.grams)} g ${item.name}`).join(' · ')}
                          </p>
                          <div className="flex flex-wrap gap-x-2 text-xs text-white/60">
                            <span className="tabular-nums">{fmt0(t.calories)} kcal</span>
                            <MacroSummary macros={t} />
                          </div>
                        </div>
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-royal text-lg leading-none">+</span>
                      </button>
                      <button
                        onClick={() => onDeleteTemplate(template.id)}
                        aria-label={`Delete ${template.name}`}
                        className="px-1 text-xs text-white/40"
                      >
                        Delete
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}

            {/* ---- Custom items ---- */}
            <div className="flex items-center justify-between pt-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-white/45">Custom Items</h3>
              <button onClick={onNewCustom} className="text-sm text-lilac">+ New Custom</button>
            </div>
            {customResults.length === 0 ? (
              <p className="text-sm text-white/60">
                {customFoods.length === 0
                  ? 'No custom items yet. Add your own, like a specific protein bar.'
                  : 'No custom items match your search.'}
              </p>
            ) : (
              <ul className="divide-y divide-white/5">
                {customResults.map((food) => (
                  <FoodRow key={food.id} food={food} onAdd={() => addFood(food)} onDelete={() => onDeleteFood(food.id)} />
                ))}
              </ul>
            )}
          </>
        )}
      </Card>
    </Sheet>
  )
}
