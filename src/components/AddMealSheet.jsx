// Log Meal: pick foods or saved meals, adjust grams, and the totals update
// live from each item's per-100 g values.
//
//   Database - the built-in ingredients
//   My Items - saved meal templates and the user's own custom items
//
// Picking an item turns its "+" into a "− value +" counter:
//   foods     - each tap adds/removes STEP_GRAMS; going to 0 unselects it
//   templates - each tap adds/removes one serving (all components scale)
import { useState } from 'react'
import { ZERO, add, scale, num, fmt0, fmt1 } from '../lib/calc.js'
import { STEP_GRAMS, stepFood, scaleGroup } from '../lib/picked.js'
import {
  Card, SectionTitle, MacroSummary, Segmented, Sheet, TextInput, AddButton, Stepper, ChevronIcon,
  muted, faint, accentText, carbsText, fatText, fieldBg, divider,
} from './ui.jsx'

const newKey = () => crypto.randomUUID()

/** One list row: name (with optional ">" edit arrow), details, and a control. */
function ItemRow({ title, subtitle, meta, onEdit, control }) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center">
          <p className="truncate text-sm font-medium">{title}</p>
          {onEdit && (
            <button onClick={onEdit} aria-label={`Edit ${title}`} className={`ml-0.5 shrink-0 rounded-md p-1 ${faint}`}>
              <ChevronIcon />
            </button>
          )}
        </div>
        {subtitle && <p className={`truncate text-xs ${faint}`}>{subtitle}</p>}
        <div className={`flex flex-wrap gap-x-2 text-xs ${muted}`}>{meta}</div>
      </div>
      {control}
    </li>
  )
}

const SubHeading = ({ children }) => (
  <h3 className={`pt-1 text-xs font-semibold uppercase tracking-wide ${faint}`}>{children}</h3>
)

export default function AddMealSheet({
  foods, customFoods, templates, onSave, onClose, onCreateCustom, onEditCustom, onEditTemplate,
}) {
  const [name, setName] = useState('')
  const [search, setSearch] = useState('')
  const [view, setView] = useState('Database')
  const [picked, setPicked] = useState([])     // see lib/picked.js for the entry shape
  const [servings, setServings] = useState({}) // templateId -> servings currently picked

  const totals = picked.reduce((t, p) => add(t, scale(p.food, num(p.grams))), ZERO)
  const canSave = picked.length > 0 && picked.every((p) => num(p.grams) > 0)

  const query = search.trim().toLowerCase()
  const matches = (x) => x.name.toLowerCase().includes(query)

  // ---- single foods ----
  const entryFor = (food) => picked.find((p) => p.foodId === food.id)
  const addFood = (food) => setPicked((list) => [...list, { key: newKey(), food, grams: '100', foodId: food.id }])
  const foodControl = (food) => {
    const entry = entryFor(food)
    return entry ? (
      <Stepper
        label={food.name}
        value={`${fmt0(num(entry.grams))} g`}
        onMinus={() => setPicked((list) => stepFood(list, food.id, -STEP_GRAMS))}
        onPlus={() => setPicked((list) => stepFood(list, food.id, STEP_GRAMS))}
      />
    ) : (
      <AddButton label={`Add ${food.name}`} onClick={() => addFood(food)} />
    )
  }

  // ---- templates ----
  // Servings only count while the template still has items in the meal.
  const servingsOf = (t) => (picked.some((p) => p.group === t.id) ? servings[t.id] ?? 1 : 0)
  const loadTemplate = (t) => {
    setPicked((list) => [
      ...list,
      ...t.items.map((item) => ({ key: newKey(), food: item, grams: String(item.grams), group: t.id })),
    ])
    setServings((s) => ({ ...s, [t.id]: 1 }))
    setName((current) => current || t.name)
  }
  const stepTemplate = (t, delta) => {
    const from = servingsOf(t)
    const to = from + delta
    setPicked((list) => scaleGroup(list, t.id, from, to))
    setServings((s) => ({ ...s, [t.id]: Math.max(to, 0) }))
  }
  const templateControl = (t) => {
    const n = servingsOf(t)
    return n > 0 ? (
      <Stepper label={t.name} value={`${n}×`} onMinus={() => stepTemplate(t, -1)} onPlus={() => stepTemplate(t, 1)} />
    ) : (
      <AddButton label={`Add ${t.name}`} onClick={() => loadTemplate(t)} />
    )
  }

  const setGrams = (key, grams) => setPicked((list) => list.map((p) => (p.key === key ? { ...p, grams } : p)))

  const save = () => {
    onSave({
      id: newKey(),
      name: name.trim() || picked.map((p) => p.food.name).join(' + '),
      date: new Date().toISOString(),
      // Per-100 g values are copied in, so later edits never change history.
      items: picked.map(({ food, grams }) => ({
        name: food.name, grams: num(grams),
        calories: food.calories, protein: food.protein, carbs: food.carbs, fat: food.fat,
      })),
    })
    onClose()
  }

  const foodMeta = (food) => (
    <>
      <span className="tabular-nums">{fmt0(food.calories)} kcal / 100 g</span>
      <MacroSummary macros={food} />
    </>
  )

  return (
    <Sheet
      title="Log Meal"
      onClose={onClose}
      action={
        <button onClick={save} disabled={!canSave} className={`font-semibold disabled:opacity-35 ${accentText}`}>Save</button>
      }
    >
      <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Meal name (optional)" />

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
                      <span className={`tabular-nums ${accentText}`}>{fmt0(macros.calories)} kcal</span>
                      <MacroSummary macros={macros} />
                    </div>
                  </div>
                  <input
                    inputMode="decimal" value={p.grams}
                    onChange={(e) => setGrams(p.key, e.target.value)}
                    aria-label={`Grams of ${p.food.name}`}
                    className={`w-16 rounded-lg px-2 py-2 text-right tabular-nums outline-none ${fieldBg}`}
                  />
                  <span className={muted}>g</span>
                  <button
                    onClick={() => setPicked((list) => list.filter((x) => x.key !== p.key))}
                    aria-label={`Remove ${p.food.name}`}
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
              <SectionTitle>Meal Total</SectionTitle>
              <p className={`text-3xl font-bold tabular-nums ${accentText}`}>
                {fmt0(totals.calories)} <span className={`text-xs font-normal ${muted}`}>kcal</span>
              </p>
            </div>
            <div className="mt-3 grid grid-cols-3 text-center">
              {[['Protein', totals.protein, accentText], ['Carbs', totals.carbs, carbsText], ['Fats', totals.fat, fatText]].map(
                ([label, value, color]) => (
                  <div key={label}>
                    <p className={`font-semibold tabular-nums ${color}`}>{fmt1(value)} g</p>
                    <p className={`text-xs ${muted}`}>{label}</p>
                  </div>
                ),
              )}
            </div>
          </Card>
        </>
      )}

      <Card className="space-y-3">
        <Segmented options={['Database', 'My Items']} value={view} onChange={setView} />

        <button
          onClick={onCreateCustom}
          className={`flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-royal/50 py-2.5 text-sm font-semibold transition active:bg-royal/10 ${accentText}`}
        >
          <span className="text-lg leading-none">+</span> Create a custom meal
        </button>

        <TextInput
          value={search} onChange={(e) => setSearch(e.target.value)} autoCorrect="off"
          placeholder={view === 'Database' ? 'Search foods' : 'Search my items'}
        />

        {view === 'Database' ? (
          <ul className={`divide-y ${divider}`}>
            {foods.filter(matches).map((food) => (
              <ItemRow key={food.id} title={food.name} meta={foodMeta(food)} control={foodControl(food)} />
            ))}
            {foods.filter(matches).length === 0 && <p className={`py-3 text-sm ${muted}`}>No foods match your search.</p>}
          </ul>
        ) : (
          <>
            <SubHeading>Saved Meals</SubHeading>
            {templates.filter(matches).length === 0 ? (
              <p className={`text-sm ${muted}`}>
                {templates.length === 0
                  ? 'No saved meals yet. Tap the bookmark next to a meal on the Home tab to save it.'
                  : 'No saved meals match your search.'}
              </p>
            ) : (
              <ul className={`divide-y ${divider}`}>
                {templates.filter(matches).map((t) => {
                  const tt = t.items.reduce((sum, item) => add(sum, scale(item, item.grams)), ZERO)
                  return (
                    <ItemRow
                      key={t.id}
                      title={t.name}
                      subtitle={t.items.map((item) => `${fmt0(item.grams)} g ${item.name}`).join(' · ')}
                      meta={<><span className="tabular-nums">{fmt0(tt.calories)} kcal</span><MacroSummary macros={tt} /></>}
                      onEdit={() => onEditTemplate(t)}
                      control={templateControl(t)}
                    />
                  )
                })}
              </ul>
            )}

            <SubHeading>Custom Items</SubHeading>
            {customFoods.filter(matches).length === 0 ? (
              <p className={`text-sm ${muted}`}>
                {customFoods.length === 0
                  ? 'No custom items yet. Add your own, like a specific protein bar.'
                  : 'No custom items match your search.'}
              </p>
            ) : (
              <ul className={`divide-y ${divider}`}>
                {customFoods.filter(matches).map((food) => (
                  <ItemRow
                    key={food.id} title={food.name} meta={foodMeta(food)}
                    onEdit={() => onEditCustom(food)} control={foodControl(food)}
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </Card>
    </Sheet>
  )
}
