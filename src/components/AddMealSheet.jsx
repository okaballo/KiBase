// Meal entry: pick foods, type the grams, and the totals update live from
// each food's per-100 g values.
import { useState } from 'react'
import { ZERO, add, scale, num, fmt0, fmt1 } from '../lib/calc.js'
import { Card, SectionTitle, MacroSummary, Sheet } from './ui.jsx'

export default function AddMealSheet({ foods, onSave, onClose, onNewCustom, onDeleteFood }) {
  const [name, setName] = useState('')
  const [search, setSearch] = useState('')
  const [picked, setPicked] = useState([]) // [{ key, food, grams: '100' }]

  const totals = picked.reduce((t, p) => add(t, scale(p.food, num(p.grams))), ZERO)
  const canSave = picked.length > 0 && picked.every((p) => num(p.grams) > 0)
  const results = foods.filter((f) => f.name.toLowerCase().includes(search.trim().toLowerCase()))

  const setGrams = (key, grams) =>
    setPicked((list) => list.map((p) => (p.key === key ? { ...p, grams } : p)))

  const save = () => {
    onSave({
      id: crypto.randomUUID(),
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

      <Card>
        <div className="flex items-center justify-between">
          <SectionTitle>Food Database</SectionTitle>
          <button onClick={onNewCustom} className="text-sm text-lilac">+ New Custom</button>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search foods"
          autoCorrect="off"
          className="mt-3 w-full rounded-xl bg-field px-3.5 py-2.5 outline-none placeholder:text-white/30"
        />
        {results.length === 0 && <p className="py-4 text-sm text-white/60">No foods match your search.</p>}
        <ul className="mt-1 divide-y divide-white/5">
          {results.map((food) => (
            <li key={food.id} className="flex items-center gap-2">
              <button
                onClick={() => setPicked((list) => [...list, { key: crypto.randomUUID(), food, grams: '100' }])}
                className="flex min-w-0 flex-1 items-center gap-2 py-2.5 text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    {food.name}
                    {food.custom && (
                      <span className="ml-1.5 rounded-full bg-royal/35 px-1.5 py-0.5 text-[9px] font-bold text-lilac">
                        CUSTOM
                      </span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-x-2 text-xs text-white/60">
                    <span className="tabular-nums">{fmt0(food.calories)} kcal / 100 g</span>
                    <MacroSummary macros={food} />
                  </div>
                </div>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-royal text-lg leading-none">+</span>
              </button>
              {food.custom && (
                <button
                  onClick={() => onDeleteFood(food.id)}
                  aria-label={`Delete ${food.name}`}
                  className="px-1 text-xs text-white/40"
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </Sheet>
  )
}
