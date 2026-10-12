// Root component: owns all saved data, the theme, and the tab layout.
//
// Saved in localStorage (see useLocalStorage):
//   mt.profile      name, body stats and daily goals
//   mt.avatar       profile picture as a base64 JPEG data URL (or null)
//   mt.theme        'dark' | 'light'
//   mt.meals        logged meals, newest first, each tagged with its tracking day
//   mt.customFoods  the user's own items (per 100 g)
//   mt.templates    saved meal templates
//   mt.weights      weight entries, oldest first
//   mt.activeDay    the tracking day in progress
import { useEffect, useState } from 'react'
import { useLocalStorage } from './lib/useLocalStorage.js'
import { SEED_FOODS } from './lib/foods.js'
import { dayKey, nextTrackingDay } from './lib/calc.js'
import Home from './tabs/Home.jsx'
import Analytics from './tabs/Analytics.jsx'
import Weight from './tabs/Weight.jsx'
import Profile from './tabs/Profile.jsx'
import AddMealSheet from './components/AddMealSheet.jsx'
import CustomFoodSheet from './components/CustomFoodSheet.jsx'
import TemplateEditSheet from './components/TemplateEditSheet.jsx'
import PlanSheet from './components/PlanSheet.jsx'

// Testing placeholders: 2,100 kcal = 140 g protein + 250 g carbs + 60 g fat.
const DEFAULT_PROFILE = {
  name: '', sex: 'Male', age: 25, heightCm: 175, weightKg: 70,
  activity: 'Lightly active', goal: 'Maintain',
  calorieGoal: 2100, proteinGoal: 140, carbsGoal: 250, fatGoal: 60,
}

// Tab icons: one closed shape each, drawn as an outline when inactive and
// filled when active. evenodd keeps the cut-outs (e.g. the scale dial) open.
const ICONS = {
  Home: 'M3.5 10.2 12 3l8.5 7.2V20a1 1 0 0 1-1 1H15v-6.5H9V21H4.5a1 1 0 0 1-1-1z',
  Analytics: 'M4 13.5h4V21H4zM10 3.5h4V21h-4zM16 8.5h4V21h-4z',
  Weight: 'M6 3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zm2 8.5a4 4 0 0 1 8 0z',
  Profile: 'M12 3a4.25 4.25 0 1 1 0 8.5A4.25 4.25 0 0 1 12 3zM4 21a8 8 0 0 1 16 0z',
}

/** Inserts a new item or replaces the one with the same id. */
const upsert = (list, item) =>
  list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item]

export default function App() {
  const [storedProfile, setProfile] = useLocalStorage('mt.profile', DEFAULT_PROFILE)
  const [avatar, setAvatar] = useLocalStorage('mt.avatar', null)
  const [theme, setTheme] = useLocalStorage('mt.theme', 'dark')
  const [meals, setMeals] = useLocalStorage('mt.meals', [])
  const [customFoods, setCustomFoods] = useLocalStorage('mt.customFoods', [])
  const [templates, setTemplates] = useLocalStorage('mt.templates', [])
  const [weights, setWeights] = useLocalStorage('mt.weights', [])

  // Older saves have no `name`, so fill any missing fields from the defaults.
  const profile = { ...DEFAULT_PROFILE, ...storedProfile }
  const updateProfile = (patch) => setProfile((p) => ({ ...p, ...patch }))

  // The tracking day in progress. Only startNewDay() changes it; the clock never does.
  const [activeDay, setActiveDay] = useLocalStorage('mt.activeDay', {
    date: dayKey(),
    startedAt: new Date().toISOString(),
  })
  const startNewDay = () =>
    setActiveDay((current) => ({ date: nextTrackingDay(current.date), startedAt: new Date().toISOString() }))

  // Theme: toggling the `dark` class on <html> switches every `dark:` variant.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#000000' : '#f2f2f7')
  }, [theme])

  // Screens and sheets
  const [tab, setTab] = useState('Home')
  const [mealOpen, setMealOpen] = useState(false)
  const [customEditing, setCustomEditing] = useState(null)     // null | 'new' | food being edited
  const [templateEditing, setTemplateEditing] = useState(null) // null | template being edited
  const [planOpen, setPlanOpen] = useState(false)

  const byName = (a, b) => a.name.localeCompare(b.name)
  const foods = [...SEED_FOODS].sort(byName)    // built-in database
  const myFoods = [...customFoods].sort(byName) // user's own items

  const tabButton = (name) => {
    const active = tab === name
    return (
      <button
        key={name}
        onClick={() => setTab(name)}
        aria-current={active ? 'page' : undefined}
        className={`flex flex-col items-center gap-0.5 pt-2 pb-1.5 text-[10px] font-medium transition-colors ${
          active ? 'text-royal dark:text-lilac' : 'text-zinc-400 dark:text-white/45'
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true"
          fill={active ? 'currentColor' : 'none'} fillRule="evenodd"
          stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
          <path d={ICONS[name]} />
        </svg>
        {name}
      </button>
    )
  }

  return (
    <div className="mx-auto flex h-full max-w-md flex-col bg-canvas text-zinc-900 transition-colors duration-300 dark:bg-black dark:text-white">
      <main
        className="flex-1 space-y-4 overflow-y-auto px-4 pb-8"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 8px)' }}
      >
        {tab === 'Home' && (
          <Home
            profile={profile} avatar={avatar} meals={meals} activeDay={activeDay}
            onAddMeal={() => setMealOpen(true)}
            onStartNewDay={startNewDay}
            onOpenProfile={() => setTab('Profile')}
            onSaveTemplate={(template) => setTemplates((list) => [template, ...list])}
            onDeleteMeal={(id) => setMeals((list) => list.filter((m) => m.id !== id))}
          />
        )}
        {tab === 'Analytics' && <Analytics profile={profile} meals={meals} activeDay={activeDay} />}
        {tab === 'Weight' && (
          <Weight
            entries={weights}
            onAdd={(entry) => setWeights((list) => [...list, entry].sort((a, b) => a.date.localeCompare(b.date)))}
            onDelete={(id) => setWeights((list) => list.filter((e) => e.id !== id))}
          />
        )}
        {tab === 'Profile' && (
          <Profile
            profile={profile} onChange={updateProfile}
            avatar={avatar} onAvatar={setAvatar}
            theme={theme} onTheme={setTheme}
            onOpenPlan={() => setPlanOpen(true)}
          />
        )}
      </main>

      {/* ---- Bottom bar: Home, Analytics, [ + ], Weight, Profile ---- */}
      <nav
        className="grid grid-cols-5 items-end border-t border-black/5 bg-white/90 backdrop-blur-xl transition-colors duration-300 dark:border-white/10 dark:bg-card/90"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {tabButton('Home')}
        {tabButton('Analytics')}
        <div className="flex justify-center">
          <button
            onClick={() => setMealOpen(true)}
            aria-label="Log a meal"
            className="-mt-7 mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-b from-lilac to-royal text-white shadow-[0_6px_20px_rgba(120,81,169,0.55)] ring-4 ring-canvas transition active:scale-95 dark:ring-black"
          >
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
        {tabButton('Weight')}
        {tabButton('Profile')}
      </nav>

      {/* ---- Sheets (later ones stack on top) ---- */}
      {mealOpen && (
        <AddMealSheet
          foods={foods} customFoods={myFoods} templates={templates}
          // Tag the meal with the active tracking day, whatever the clock says.
          onSave={(meal) => setMeals((list) => [{ ...meal, day: activeDay.date }, ...list])}
          onClose={() => setMealOpen(false)}
          onCreateCustom={() => setCustomEditing('new')}
          onEditCustom={(food) => setCustomEditing(food)}
          onEditTemplate={(template) => setTemplateEditing(template)}
        />
      )}
      {customEditing && (
        <CustomFoodSheet
          food={customEditing === 'new' ? null : customEditing}
          onSave={(food) => setCustomFoods((list) => upsert(list, food))}
          onDelete={(id) => setCustomFoods((list) => list.filter((f) => f.id !== id))}
          onClose={() => setCustomEditing(null)}
        />
      )}
      {templateEditing && (
        <TemplateEditSheet
          template={templateEditing}
          onSave={(template) => setTemplates((list) => upsert(list, template))}
          onDelete={(id) => setTemplates((list) => list.filter((t) => t.id !== id))}
          onClose={() => setTemplateEditing(null)}
        />
      )}
      {planOpen && <PlanSheet profile={profile} onChange={updateProfile} onClose={() => setPlanOpen(false)} />}
    </div>
  )
}
