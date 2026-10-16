// The food picker shared by Log Meal and the Meal Divider.
//
//   PickedList  - the chosen items, each with an editable grams field
//   FoodPicker  - Database / My Items lists with "+" buttons that turn into
//                 "− value +" counters once an item is picked
//
// The picked list itself is owned by the parent screen (see lib/picked.js for
// the entry shape), so both screens share the same behaviour.
import { useState } from 'react'
import { ZERO, add, scale, num, fmt0 } from '../lib/calc.js'
import { STEP_GRAMS, stepFood, scaleGroup } from '../lib/picked.js'
import {
  MacroSummary, Segmented, TextInput, AddButton, Stepper, ChevronIcon,
  muted, faint, accentText, fieldBg, divider,
} from './ui.jsx'
import { t } from '../lib/i18n.js'

const newKey = () => crypto.randomUUID()

/** Default grams for a newly picked food: its saved portion size, else 100 g. */
const defaultGrams = (food) => String(food.servingGrams > 0 ? food.servingGrams : 100)

/** Chosen items with editable grams and a remove button. */
export function PickedList({ picked, setPicked }) {
  const setGrams = (key, grams) => setPicked((list) => list.map((p) => (p.key === key ? { ...p, grams } : p)))
  return picked.map((p) => {
    const macros = scale(p.food, num(p.grams))
    return (
      <div key={p.key} className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{t(p.food.name)}</p>
          <div className="flex flex-wrap gap-x-2 text-xs">
            <span className={`tabular-nums ${accentText}`}>{fmt0(macros.calories)} {t('kcal')}</span>
            <MacroSummary macros={macros} />
          </div>
        </div>
        <input
          inputMode="decimal" value={p.grams}
          onChange={(e) => setGrams(p.key, e.target.value)}
          aria-label={t('Grams of {name}', { name: t(p.food.name) })}
          className={`w-16 rounded-lg px-2 py-2 text-end tabular-nums outline-none ${fieldBg}`}
        />
        <span className={muted}>{t('g')}</span>
        <button
          onClick={() => setPicked((list) => list.filter((x) => x.key !== p.key))}
          aria-label={t('Remove {name}', { name: t(p.food.name) })}
          className={`px-1 text-xl leading-none ${faint}`}
        >
          ×
        </button>
      </div>
    )
  })
}

/** One list row: name (with optional ">" edit arrow), details, and a control. */
function ItemRow({ title, subtitle, meta, onEdit, control }) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center">
          <p className="truncate text-sm font-medium">{title}</p>
          {onEdit && (
            <button onClick={onEdit} aria-label={t('Edit {name}', { name: title })} className={`ms-0.5 shrink-0 rounded-md p-1 ${faint}`}>
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

export function FoodPicker({
  foods, customFoods, templates, picked, setPicked,
  onEditCustom, onEditTemplate, onTemplateLoaded, actions,
}) {
  const [search, setSearch] = useState('')
  const [view, setView] = useState('Database')
  const [servings, setServings] = useState({}) // templateId -> servings currently picked

  const query = search.trim().toLowerCase()
  // Matches the stored (English) name or the name as shown in the current language.
  const matches = (x) => x.name.toLowerCase().includes(query) || t(x.name).toLowerCase().includes(query)

  // ---- single foods: each tap of + / − changes the grams by STEP_GRAMS ----
  const foodControl = (food) => {
    const entry = picked.find((p) => p.foodId === food.id)
    return entry ? (
      <Stepper
        label={t(food.name)}
        value={`${fmt0(num(entry.grams))} ${t('g')}`}
        onMinus={() => setPicked((list) => stepFood(list, food.id, -STEP_GRAMS))}
        onPlus={() => setPicked((list) => stepFood(list, food.id, STEP_GRAMS))}
      />
    ) : (
      <AddButton
        label={t('Add {name}', { name: t(food.name) })}
        onClick={() => setPicked((list) => [...list, { key: newKey(), food, grams: defaultGrams(food), foodId: food.id }])}
      />
    )
  }

  // ---- saved meals: each tap adds/removes one serving (all items scale) ----
  const servingsOf = (tpl) => (picked.some((p) => p.group === tpl.id) ? servings[tpl.id] ?? 1 : 0)
  const loadTemplate = (tpl) => {
    setPicked((list) => [
      ...list,
      ...tpl.items.map((item) => ({ key: newKey(), food: item, grams: String(item.grams), group: tpl.id })),
    ])
    setServings((s) => ({ ...s, [tpl.id]: 1 }))
    onTemplateLoaded?.(tpl)
  }
  const stepTemplate = (tpl, delta) => {
    const from = servingsOf(tpl)
    const to = from + delta
    setPicked((list) => scaleGroup(list, tpl.id, from, to))
    setServings((s) => ({ ...s, [tpl.id]: Math.max(to, 0) }))
  }
  const templateControl = (tpl) => {
    const n = servingsOf(tpl)
    return n > 0 ? (
      <Stepper label={tpl.name} value={`${n}×`} onMinus={() => stepTemplate(tpl, -1)} onPlus={() => stepTemplate(tpl, 1)} />
    ) : (
      <AddButton label={t('Add {name}', { name: tpl.name })} onClick={() => loadTemplate(tpl)} />
    )
  }

  const foodMeta = (food) => (
    <>
      <span className="tabular-nums">{t('{n} kcal / 100 g', { n: fmt0(food.calories) })}</span>
      <MacroSummary macros={food} />
      {food.servingGrams > 0 && <span className="tabular-nums">{t('· 1 portion {n} g', { n: fmt0(food.servingGrams) })}</span>}
    </>
  )

  const dbResults = foods.filter(matches)
  const templateResults = templates.filter(matches)
  const customResults = customFoods.filter(matches)

  return (
    <>
      <Segmented options={['Database', 'My Items']} value={view} onChange={setView} />
      {actions}
      <TextInput
        value={search} onChange={(e) => setSearch(e.target.value)} autoCorrect="off"
        placeholder={t(view === 'Database' ? 'Search foods' : 'Search my items')}
      />

      {view === 'Database' ? (
        <ul className={`divide-y ${divider}`}>
          {dbResults.map((food) => (
            <ItemRow key={food.id} title={t(food.name)} meta={foodMeta(food)} control={foodControl(food)} />
          ))}
          {dbResults.length === 0 && <p className={`py-3 text-sm ${muted}`}>{t('No foods match your search.')}</p>}
        </ul>
      ) : (
        <>
          <SubHeading>{t('Saved Meals')}</SubHeading>
          {templateResults.length === 0 ? (
            <p className={`text-sm ${muted}`}>
              {t(templates.length === 0
                ? 'No saved meals yet. Tap the bookmark next to a meal on the Home tab to save it.'
                : 'No saved meals match your search.')}
            </p>
          ) : (
            <ul className={`divide-y ${divider}`}>
              {templateResults.map((tpl) => {
                const tt = tpl.items.reduce((sum, item) => add(sum, scale(item, item.grams)), ZERO)
                return (
                  <ItemRow
                    key={tpl.id}
                    title={tpl.name}
                    subtitle={tpl.items.map((item) => `${fmt0(item.grams)} ${t('g')} ${t(item.name)}`).join(' · ')}
                    meta={<><span className="tabular-nums">{fmt0(tt.calories)} {t('kcal')}</span><MacroSummary macros={tt} /></>}
                    onEdit={onEditTemplate && (() => onEditTemplate(tpl))}
                    control={templateControl(tpl)}
                  />
                )
              })}
            </ul>
          )}

          <SubHeading>{t('Custom Items')}</SubHeading>
          {customResults.length === 0 ? (
            <p className={`text-sm ${muted}`}>
              {t(customFoods.length === 0
                ? 'No custom items yet. Add your own, like a specific protein bar.'
                : 'No custom items match your search.')}
            </p>
          ) : (
            <ul className={`divide-y ${divider}`}>
              {customResults.map((food) => (
                <ItemRow
                  key={food.id} title={t(food.name)} meta={foodMeta(food)}
                  onEdit={onEditCustom && (() => onEditCustom(food))} control={foodControl(food)}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </>
  )
}
