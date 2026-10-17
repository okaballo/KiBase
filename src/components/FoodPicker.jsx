// The food picker shared by Log Meal, the Meal Divider and the saved meal editor.
//
//   PickedList      - the chosen items. Single foods are rows with an editable
//                     grams field; a saved meal is ONE card (edit + remove)
//   GroupEditSheet  - opened from a card's pencil: change its ingredients'
//                     grams, remove some, or add more
//   FoodPicker      - Database / My Items lists with "+" buttons that turn
//                     into "− value +" counters once an item is picked
//
// The picked list itself is owned by the parent screen (see lib/picked.js for
// the entry shape), so every screen shares the same behaviour.
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence } from 'framer-motion'
import { ZERO, add, scale, num, fmt0 } from '../lib/calc.js'
import { STEP_GRAMS, stepFood, scaleGroup, replaceGroup } from '../lib/picked.js'
import {
  Card, SectionTitle, Sheet, MacroSummary, Segmented, TextInput, AddButton, Stepper, ChevronIcon, PencilIcon,
  muted, faint, accentText, fieldBg, divider,
} from './ui.jsx'
import { t } from '../lib/i18n.js'

const newKey = () => crypto.randomUUID()

/** Default grams for a newly picked food: its saved portion size, else 100 g. */
const defaultGrams = (food) => String(food.servingGrams > 0 ? food.servingGrams : 100)

const totalsOf = (entries) => entries.reduce((sum, p) => add(sum, scale(p.food, num(p.grams))), ZERO)

/**
 * Chosen items. Single foods are rows with an editable grams field; the
 * items of a saved meal are grouped into one card with edit and remove
 * buttons. `flat` lists every item as a row (used inside the card editor).
 * `picker` ({ foods, customFoods, templates }) feeds the card editor's own
 * picker, so more items can be added to a saved meal.
 */
export function PickedList({ picked, setPicked, picker, flat = false }) {
  const [editing, setEditing] = useState(null) // group id of the card being edited

  // Rows in list order; a saved meal appears once, where its first item is.
  const rows = []
  const seen = new Set()
  for (const p of picked) {
    if (flat || !p.group) rows.push({ key: p.key, entry: p })
    else if (!seen.has(p.group)) {
      seen.add(p.group)
      rows.push({ key: `group-${p.group}`, group: p.group, entries: picked.filter((x) => x.group === p.group) })
    }
  }
  const editingEntries = editing ? picked.filter((p) => p.group === editing) : []

  return (
    <>
      {rows.map((row) =>
        row.group ? (
          <SavedMealCard
            key={row.key} entries={row.entries}
            onEdit={() => setEditing(row.group)}
            onRemove={() => setPicked((list) => list.filter((p) => p.group !== row.group))}
          />
        ) : (
          <PickedRow key={row.key} entry={row.entry} setPicked={setPicked} />
        ),
      )}
      {/* Portal: this list sits inside a sliding sheet, and a fixed-position
          sheet inside a transformed parent would be clipped to it. */}
      {createPortal(
        <AnimatePresence>
          {editingEntries.length > 0 && (
            <GroupEditSheet
              key={editing}
              groupId={editing} entries={editingEntries} picker={picker}
              onSave={(next) => setPicked((list) => replaceGroup(list, editing, next))}
              onClose={() => setEditing(null)}
            />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}

/** A saved meal in the picked list: name, ingredients, totals, edit and remove. */
function SavedMealCard({ entries, onEdit, onRemove }) {
  const name = entries[0].groupName || t('Saved meal')
  const totals = totalsOf(entries)
  const grams = entries.reduce((g, p) => g + num(p.grams), 0)
  return (
    <div className={`rounded-2xl p-3 ${fieldBg}`}>
      <div className="flex items-start gap-1">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className={`text-xs ${muted}`}>
            {t('Saved meal')} · {entries.length === 1 ? t('1 ingredient') : t('{n} ingredients', { n: entries.length })}
            {' · '}{fmt0(grams)} {t('g')}
          </p>
        </div>
        <button onClick={onEdit} aria-label={t('Edit {name}', { name })} className={`p-1 transition active:scale-90 ${accentText}`}>
          <PencilIcon />
        </button>
        <button onClick={onRemove} aria-label={t('Remove {name}', { name })} className={`px-1 text-xl leading-none ${faint}`}>
          ×
        </button>
      </div>
      <p className={`mt-1.5 line-clamp-2 text-xs ${faint}`}>
        {entries.map((p) => `${fmt0(num(p.grams))} ${t('g')} ${t(p.food.name)}`).join(' · ')}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-x-2 text-xs">
        <span className={`font-semibold tabular-nums ${accentText}`}>{fmt0(totals.calories)} {t('kcal')}</span>
        <MacroSummary macros={totals} />
      </div>
    </div>
  )
}

/**
 * Edits one saved meal card: ingredient grams, removing ingredients and
 * adding more from the Database / My Items. Works on a copy and only writes
 * back on Done. It changes this meal only, not the saved meal in My Items.
 */
function GroupEditSheet({ groupId, entries, picker, onSave, onClose }) {
  const name = entries[0].groupName || t('Saved meal')
  // foodId is dropped so the single-food +/− counters outside never grab a
  // saved meal's ingredient; inside, added foods get their own foodId.
  const [items, setItems] = useState(() => entries.map(({ key, food, grams }) => ({ key, food, grams })))
  const totals = totalsOf(items)
  const canSave = items.every((p) => num(p.grams) > 0)

  const done = () => {
    onSave(items.map(({ key, food, grams }) => ({ key, food, grams, group: groupId, groupName: entries[0].groupName })))
    onClose()
  }

  return (
    <Sheet
      title={name} onClose={onClose} z="z-[55]"
      action={<button onClick={done} disabled={!canSave} className={`font-semibold disabled:opacity-35 ${accentText}`}>{t('Done')}</button>}
    >
      <Card className="space-y-3.5">
        <SectionTitle>{t('Ingredients')}</SectionTitle>
        {items.length === 0
          ? <p className={`text-sm ${muted}`}>{t('No ingredients left. Tap Done to remove this meal.')}</p>
          : <PickedList picked={items} setPicked={setItems} flat />}
      </Card>

      <Card>
        <div className="flex items-baseline justify-between">
          <SectionTitle>{t('Total')}</SectionTitle>
          <p className={`text-2xl font-bold tabular-nums ${accentText}`}>
            {fmt0(totals.calories)} <span className={`text-xs font-normal ${muted}`}>{t('kcal')}</span>
          </p>
        </div>
        <div className="mt-2"><MacroSummary macros={totals} /></div>
      </Card>

      <p className={`-mb-1 px-1 text-xs ${muted}`}>
        {t('Changes apply to this meal only. To change the saved meal itself, use the arrow next to it in My Items.')}
      </p>
      {picker && (
        <Card className="space-y-3">
          <SectionTitle>{t('Add Ingredients')}</SectionTitle>
          <FoodPicker
            foods={picker.foods} customFoods={picker.customFoods}
            templates={picker.templates.filter((x) => x.id !== groupId)}
            picked={items} setPicked={setItems}
          />
        </Card>
      )}
    </Sheet>
  )
}

/** A single food in the picked list: name, macros, grams field and remove. */
function PickedRow({ entry: p, setPicked }) {
  const setGrams = (grams) => setPicked((list) => list.map((x) => (x.key === p.key ? { ...x, grams } : x)))
  const macros = scale(p.food, num(p.grams))
  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{t(p.food.name)}</p>
        <div className="flex flex-wrap gap-x-2 text-xs">
          <span className={`tabular-nums ${accentText}`}>{fmt0(macros.calories)} {t('kcal')}</span>
          <MacroSummary macros={macros} />
        </div>
      </div>
      <input
        inputMode="decimal" value={p.grams}
        onChange={(e) => setGrams(e.target.value)}
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
  onEditCustom, onEditTemplate, actions,
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
      ...tpl.items.map((item) => ({ key: newKey(), food: item, grams: String(item.grams), group: tpl.id, groupName: tpl.name })),
    ])
    setServings((s) => ({ ...s, [tpl.id]: 1 }))
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
