// Root component: owns all saved data and the four-tab layout.
import { useState } from 'react'
import { useLocalStorage } from './lib/useLocalStorage.js'
import { SEED_FOODS } from './lib/foods.js'
import Home from './tabs/Home.jsx'
import Plan from './tabs/Plan.jsx'
import Analytics from './tabs/Analytics.jsx'
import Weight from './tabs/Weight.jsx'
import AddMealSheet from './components/AddMealSheet.jsx'
import CustomFoodSheet from './components/CustomFoodSheet.jsx'

// Testing placeholders: 2,100 kcal = 140 g protein + 250 g carbs + 60 g fat.
const DEFAULT_PROFILE = {
  sex: 'Male', age: 25, heightCm: 175, weightKg: 70,
  activity: 'Lightly active', goal: 'Maintain',
  calorieGoal: 2100, proteinGoal: 140, carbsGoal: 250, fatGoal: 60,
}

const TABS = [
  ['Home', 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z'],
  ['Plan', 'M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm1 3v4h10V5zm0 7v2h2v-2zm4 0v2h2v-2zm4 0v2h2v-2zm-8 4v2h2v-2zm4 0v2h2v-2zm4 0v2h2v-2z'],
  ['Analytics', 'M4 13h4v8H4zm6-10h4v18h-4zm6 6h4v12h-4z'],
  ['Weight', 'M12 3a3 3 0 0 1 2.8 4H17a2 2 0 0 1 2 1.7l1.5 10A2 2 0 0 1 18.5 21h-13a2 2 0 0 1-2-2.3L5 8.7A2 2 0 0 1 7 7h2.2A3 3 0 0 1 12 3zm0 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2z'],
]

export default function App() {
  // Everything below is saved on the device (see useLocalStorage).
  const [profile, setProfile] = useLocalStorage('mt.profile', DEFAULT_PROFILE)
  const [meals, setMeals] = useLocalStorage('mt.meals', [])               // newest first
  const [customFoods, setCustomFoods] = useLocalStorage('mt.customFoods', [])
  const [weights, setWeights] = useLocalStorage('mt.weights', [])         // oldest first

  const [tab, setTab] = useState('Home')
  const [mealOpen, setMealOpen] = useState(false)
  const [customOpen, setCustomOpen] = useState(false)

  const foods = [...SEED_FOODS, ...customFoods].sort((a, b) => a.name.localeCompare(b.name))
  const openMeal = () => setMealOpen(true)
  const openCustom = () => setCustomOpen(true)

  return (
    <div className="mx-auto flex h-full max-w-md flex-col">
      <main
        className="flex-1 space-y-4 overflow-y-auto px-4 pb-6"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 8px)' }}
      >
        {tab === 'Home' && (
          <Home
            profile={profile} meals={meals} onAddMeal={openMeal}
            onDeleteMeal={(id) => setMeals((list) => list.filter((m) => m.id !== id))}
          />
        )}
        {tab === 'Plan' && (
          <Plan
            profile={profile} onAddMeal={openMeal} onNewCustom={openCustom}
            onChange={(patch) => setProfile((p) => ({ ...p, ...patch }))}
          />
        )}
        {tab === 'Analytics' && <Analytics profile={profile} meals={meals} />}
        {tab === 'Weight' && (
          <Weight
            entries={weights}
            onAdd={(entry) => setWeights((list) => [...list, entry].sort((a, b) => a.date.localeCompare(b.date)))}
            onDelete={(id) => setWeights((list) => list.filter((e) => e.id !== id))}
          />
        )}
      </main>

      <nav
        className="grid grid-cols-4 border-t border-white/10 bg-card/95 backdrop-blur"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {TABS.map(([name, icon]) => (
          <button
            key={name}
            onClick={() => setTab(name)}
            aria-current={tab === name ? 'page' : undefined}
            className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
              tab === name ? 'text-lilac' : 'text-white/45'
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" fillRule="evenodd" aria-hidden="true">
              <path d={icon} />
            </svg>
            {name}
          </button>
        ))}
      </nav>

      {mealOpen && (
        <AddMealSheet
          foods={foods}
          onSave={(meal) => setMeals((list) => [meal, ...list])}
          onClose={() => setMealOpen(false)}
          onNewCustom={openCustom}
          onDeleteFood={(id) => setCustomFoods((list) => list.filter((f) => f.id !== id))}
        />
      )}
      {customOpen && (
        <CustomFoodSheet
          onSave={(food) => setCustomFoods((list) => [...list, food])}
          onClose={() => setCustomOpen(false)}
        />
      )}
    </div>
  )
}
