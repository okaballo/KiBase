// Root component: owns all saved data, the theme, and the tab layout.
//
// Saved in localStorage (see useLocalStorage):
//   mt.profile      name, body stats and daily goals
//   mt.avatar       profile picture as a base64 JPEG data URL (or null)
//   mt.theme        'dark' | 'light'
//   mt.lang         'en' | 'ar' (Arabic switches the layout to right-to-left)
//   mt.meals        logged meals, newest first, each tagged with its tracking day
//   mt.customFoods  the user's own items (per 100 g)
//   mt.templates    saved meal templates
//   mt.weights      weight entries, oldest first
//   mt.activeDay    the tracking day in progress
import { memo, startTransition, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion,
} from 'framer-motion'
import { useDrag } from '@use-gesture/react'
import { SPRING } from './components/ui.jsx'
import { useLocalStorage } from './lib/useLocalStorage.js'
import { SEED_FOODS } from './lib/foods.js'
import { dayKey, nextTrackingDay, mealDay, previousDay } from './lib/calc.js'
import { setLanguage, t } from './lib/i18n.js'
import Home from './tabs/Home.jsx'
import Analytics from './tabs/Analytics.jsx'
import Weight from './tabs/Weight.jsx'
import Profile from './tabs/Profile.jsx'
import AddMealSheet from './components/AddMealSheet.jsx'
import CustomFoodSheet from './components/CustomFoodSheet.jsx'
import TemplateEditSheet from './components/TemplateEditSheet.jsx'
import PlanSheet from './components/PlanSheet.jsx'
import MealDividerSheet from './components/MealDividerSheet.jsx'

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

/** Order of the bottom tabs, also the order for swiping between them. */
const TAB_ORDER = ['Home', 'Analytics', 'Weight', 'Profile']

/** Inserts a new item or replaces the one with the same id. */
const upsert = (list, item) =>
  list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item]

/**
 * Bottom bar: Home, Analytics, [ + ], Weight, Profile. Memoised and fed by a
 * motion value, so moving the highlight re-renders only this bar.
 *
 * Height is auto: the icon row plus pb-[max(inset, 8px)], so the bar's
 * background always reaches the physical screen edge. The row is then pulled
 * DOWN into that padding by min(inset, --tab-drop) with a negative margin,
 * closing the gap above the home indicator. iPhone 13 Pro Max: 34 px inset -
 * 18 px drop = 16 px under the labels. Tune --tab-drop.
 */
// `lang` is only passed so the memoised bar re-renders with new labels.
// eslint-disable-next-line no-unused-vars
const TabBar = memo(function TabBar({ navIndex, onTab, onAdd, lang }) {
  const [active, setActive] = useState(navIndex.get())
  useMotionValueEvent(navIndex, 'change', (i) => setActive(i))

  const tabButton = (name) => {
    const on = TAB_ORDER[active] === name
    return (
      <button
        key={name}
        onClick={() => onTab(name)}
        aria-current={on ? 'page' : undefined}
        className={`flex flex-col items-center gap-0.5 pt-2.5 pb-1 text-[10px] font-medium ${
          on ? 'text-royal dark:text-lilac' : 'text-zinc-400 dark:text-white/45'
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true"
          fill={on ? 'currentColor' : 'none'} fillRule="evenodd"
          stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
          <path d={ICONS[name]} />
        </svg>
        {t(name)}
      </button>
    )
  }

  return (
    <nav className="relative z-30 h-auto border-t border-black/5 bg-white pb-[max(env(safe-area-inset-bottom),8px)] [--tab-drop:18px] dark:border-white/10 dark:bg-card">
      <div className="grid grid-cols-5 items-end mb-[calc(-1*min(env(safe-area-inset-bottom),var(--tab-drop)))]">
        {tabButton('Home')}
        {tabButton('Analytics')}
        <div className="flex justify-center">
          <motion.button
            onClick={onAdd}
            aria-label={t('Log a meal')}
            whileTap={{ scale: 0.88 }}
            transition={{ type: 'spring', stiffness: 600, damping: 22 }}
            className="-mt-7 mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-b from-lilac to-royal text-white shadow-[0_6px_20px_rgba(120,81,169,0.55)] ring-4 ring-canvas dark:ring-black"
          >
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </motion.button>
        </div>
        {tabButton('Weight')}
        {tabButton('Profile')}
      </div>
    </nav>
  )
})

export default function App() {
  const [storedProfile, setProfile] = useLocalStorage('mt.profile', DEFAULT_PROFILE)
  const [avatar, setAvatar] = useLocalStorage('mt.avatar', null)
  const [theme, setTheme] = useLocalStorage('mt.theme', 'dark')
  const [lang, setLang] = useLocalStorage('mt.lang', 'en')
  // Set before any child renders, so every t() call below uses this language.
  setLanguage(lang)
  const rtl = lang === 'ar'
  const [meals, setMeals] = useLocalStorage('mt.meals', [])
  const [customFoods, setCustomFoods] = useLocalStorage('mt.customFoods', [])
  const [templates, setTemplates] = useLocalStorage('mt.templates', [])
  const [weights, setWeights] = useLocalStorage('mt.weights', [])
  const [cheatDays, setCheatDays] = useLocalStorage('mt.cheatDays', []) // 'YYYY-MM-DD' keys

  // Older saves have no `name`, so fill any missing fields from the defaults.
  const profile = useMemo(() => ({ ...DEFAULT_PROFILE, ...storedProfile }), [storedProfile])
  // The latest weigh-in drives every calculation that needs body weight
  // (Plan & Goals, maintenance in Analytics). Entries are sorted oldest first.
  // Before the first weigh-in, the weight saved in the profile is used.
  const weighIn = weights[weights.length - 1]
  const planProfile = useMemo(
    () => (weighIn ? { ...profile, weightKg: weighIn.kg } : profile),
    [profile, weighIn],
  )
  const updateProfile = (patch) => setProfile((p) => ({ ...p, ...patch }))

  // The tracking day in progress. Only startNewDay() changes it; the clock never does.
  const [activeDay, setActiveDay] = useLocalStorage('mt.activeDay', {
    date: dayKey(),
    startedAt: new Date().toISOString(),
  })
  const startNewDay = () =>
    setActiveDay((current) => ({ date: nextTrackingDay(current.date), startedAt: new Date().toISOString() }))

  // Deletes a tracking day: all of its meals. Deleting the day in progress
  // also goes back to the previous day that has meals, so an accidental
  // Start New Day can be undone and logging continues on that day.
  const deleteDay = (key) => {
    if (key === activeDay.date) {
      const prev = previousDay(meals, key)
      if (prev) setActiveDay({ date: prev, startedAt: new Date().toISOString() })
    }
    setMeals((list) => list.filter((m) => mealDay(m) !== key))
    setCheatDays((list) => list.filter((d) => d !== key))
  }
  const toggleCheatDay = (key) =>
    setCheatDays((list) => (list.includes(key) ? list.filter((d) => d !== key) : [...list, key]))

  // Theme: toggling the `dark` class on <html> switches every `dark:` variant.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#000000' : '#f2f2f7')
  }, [theme])

  // Language: Arabic flips the whole layout to right-to-left.
  useLayoutEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = rtl ? 'rtl' : 'ltr'
  }, [lang, rtl])

  // Screens and sheets
  const [tab, setTab] = useState('Home')
  const [mealOpen, setMealOpen] = useState(false)
  const [mealEditing, setMealEditing] = useState(null)         // null | logged meal being edited
  const [customEditing, setCustomEditing] = useState(null)     // null | 'new' | food being edited
  const [templateEditing, setTemplateEditing] = useState(null) // null | template being edited
  const [planOpen, setPlanOpen] = useState(false)
  const [dividerOpen, setDividerOpen] = useState(false)

  // ---- Tab pager ----------------------------------------------------------
  // All four tabs sit side by side on one track; `x` (a framer-motion value)
  // is the track's position. What happens on a swipe:
  //   finger down/move  use-gesture -> x.set(): pure transform, NO React render
  //   release           a spring takes over from x at the finger's speed
  //   spring finished   only now does React state (`tab`) change
  // The tab-bar highlight is its own tiny component fed by `navIndex`, so it
  // can switch instantly without re-rendering any page. Nothing is mounted,
  // unmounted, repainted or re-rendered while the track is moving; that work
  // landing mid-swipe is what caused the stall-then-jump in your recording.
  const reduce = useReducedMotion()
  const viewportRef = useRef(null)
  const paneRefs = useRef([])
  const width = useRef(390)
  const x = useMotionValue(0)            // logical position: 0, -w, -2w ... in both directions
  // In right-to-left the tabs are laid out from the right, so the track moves
  // the other way. trackX mirrors x and is what is actually drawn.
  const trackX = useMotionValue(0)
  const rtlRef = useRef(rtl)
  useMotionValueEvent(x, 'change', (v) => trackX.set(rtlRef.current ? -v : v))
  useLayoutEffect(() => {
    rtlRef.current = rtl
    trackX.set(rtl ? -x.get() : x.get())
  }, [rtl, x, trackX])
  const fade = useMotionValue(1)         // only for far jumps (Home -> Profile)
  const navIndex = useMotionValue(0)     // drives the tab bar highlight
  const index = useRef(0)                // settled tab as a number
  const anim = useRef(null)
  const g = useRef({ lock: null, active: false, start: 0, from: 0, shift: 0, pane: null, scroll0: 0 }) // gesture in progress
  const LAST = TAB_ORDER.length - 1
  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi)

  useLayoutEffect(() => {
    const el = viewportRef.current
    const fit = () => {
      width.current = el.clientWidth
      anim.current?.stop()
      x.set(-index.current * width.current)
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [x])

  // Spring the track to tab i, then commit React state once it has stopped.
  const settleTo = (i, velocity = 0) => {
    index.current = i
    navIndex.set(i)
    anim.current?.stop()
    const target = -i * width.current
    // Skipped if a new swipe grabbed the track before the spring finished.
    const commit = () => { if (index.current === i && !g.current.active) startTransition(() => setTab(TAB_ORDER[i])) }
    if (reduce) { x.set(target); return commit() }
    anim.current = animate(x, target, { ...SPRING, velocity })
    anim.current.then(commit)
  }

  const goTo = (name) => {
    const i = TAB_ORDER.indexOf(name)
    if (i === index.current) return paneRefs.current[i]?.scrollTo({ top: 0, behavior: 'smooth' }) // tap active tab = scroll to top
    if (Math.abs(i - index.current) === 1 || reduce) return settleTo(i)
    // Far jump: switch instantly with a short fade instead of racing past tabs.
    index.current = i
    navIndex.set(i)
    anim.current?.stop()
    x.set(-i * width.current)
    animate(fade, [0.4, 1], { duration: 0.22, ease: 'easeOut' })
    startTransition(() => setTab(name))
  }

  // iOS-style rubber band past the first / last tab.
  const rubber = (d) => (1 - 1 / ((d * 0.55) / width.current + 1)) * width.current

  // While a horizontal swipe is locked, stop the page from also scrolling
  // vertically under the finger (needs a non-passive listener to be allowed
  // to call preventDefault; React's touch listeners are passive).
  useEffect(() => {
    const el = viewportRef.current
    const block = (e) => { if (g.current.lock === true && e.cancelable) e.preventDefault() }
    const reset = () => { g.current.lock = null } // every touch starts undecided
    el.addEventListener('touchstart', reset, { passive: true })
    el.addEventListener('touchmove', block, { passive: false })
    return () => {
      el.removeEventListener('touchstart', reset)
      el.removeEventListener('touchmove', block)
    }
  }, [])

  const bind = useDrag(
    ({ first, last, movement: [rawMx, my], velocity: [vx], direction: [rawDx], event, cancel }) => {
      // Work in logical direction: in right-to-left, dragging right moves forward.
      const mx = rtl ? -rawMx : rawMx
      const dx = rtl ? -rawDx : rawDx
      const s = g.current
      if (first) {
        s.lock = null
        if (event.target.closest?.('input, textarea, select, [data-no-swipe]')) { s.lock = false; return cancel() }
        s.pane = paneRefs.current[index.current]
        s.scroll0 = s.pane?.scrollTop ?? 0
      }
      if (s.lock === false) return

      // ---- Direction lock: a vertical scroll must NEVER turn into a tab swipe.
      if (s.lock === null) {
        // 1. Never decide on the release event. If iOS was busy scrolling and
        //    held back the move events, the first thing we'd see is the lift
        //    with a big total movement: that is a scroll, not a swipe.
        if (last) return
        // 2. If the page has scrolled at all since the finger went down, the
        //    browser has already claimed this touch as a scroll.
        const scrolled = Math.abs((s.pane?.scrollTop ?? 0) - s.scroll0) > 1
        const ax = Math.abs(mx)
        const ay = Math.abs(my)
        if (!scrolled && ax < 10 && ay < 10) return
        // 3. Horizontal only if clearly sideways: within ~27 degrees of flat
        //    (|dx| > 2 x |dy|). A thumb scrolling up the screen moves in an
        //    arc, which a looser 1.2 x ratio was mistaking for a swipe.
        if (scrolled || ax <= ay * 2) { s.lock = false; return cancel() }
        s.lock = true
        s.active = true
        s.shift = mx                     // measure from here: no 10 px jump
        anim.current?.stop()             // grab the track mid-spring if it is still moving
        s.from = index.current
        s.start = x.get()
      }

      const w = width.current
      let pos = s.start + (mx - s.shift)
      const min = -LAST * w
      if (pos > 0) pos = rubber(pos)
      else if (pos < min) pos = min - rubber(min - pos)

      if (!last) {
        x.set(pos)
        // Highlight follows the page that is more than half in view (cheap: tab bar only).
        navIndex.set(clamp(Math.round(-pos / w), 0, LAST))
        return
      }

      // Release. use-gesture gives speed in px/ms (+ sign in `direction`);
      // springs want px/s. Capped so a twitchy last sample can't fling it.
      s.active = false
      s.lock = null
      const v = clamp(dx * vx * 1000, -4000, 4000)
      const moved = pos + s.from * w     // < 0 = dragged left
      const step = moved < -w * 0.25 || v < -450 ? 1 : moved > w * 0.25 || v > 450 ? -1 : 0
      settleTo(clamp(s.from + step, 0, LAST), v)
    },
    { filterTaps: true, pointer: { touch: true } },
  )

  const byName = (a, b) => a.name.localeCompare(b.name)
  const foods = [...SEED_FOODS].sort(byName)    // built-in database
  const myFoods = [...customFoods].sort(byName) // user's own items

  // Page content, memoised: opening a sheet or switching tabs re-renders App,
  // but the pages only re-render when their own data changes.
  const pages = useMemo(() => ({
    Home: (
      <Home
        profile={profile} avatar={avatar} meals={meals} activeDay={activeDay}
        onAddMeal={() => setMealOpen(true)}
        onEditMeal={(meal) => setMealEditing(meal)}
        onStartNewDay={startNewDay}
        onOpenProfile={() => goTo('Profile')}
        onSaveTemplate={(template) => setTemplates((list) => [template, ...list])}
        onDeleteMeal={(id) => setMeals((list) => list.filter((m) => m.id !== id))}
      />
    ),
    Analytics: <Analytics profile={planProfile} meals={meals} activeDay={activeDay} onDeleteDay={deleteDay}
      cheatDays={cheatDays} onToggleCheatDay={toggleCheatDay} />,
    Weight: (
      <Weight
        entries={weights}
        onAdd={(entry) => setWeights((list) => [...list, entry].sort((a, b) => a.date.localeCompare(b.date)))}
        onDelete={(id) => setWeights((list) => list.filter((e) => e.id !== id))}
      />
    ),
    Profile: (
      <Profile
        profile={profile} onChange={updateProfile}
        avatar={avatar} onAvatar={setAvatar}
        theme={theme} onTheme={setTheme}
        lang={lang} onLang={setLang}
        onOpenPlan={() => setPlanOpen(true)}
      />
    ),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [profile, planProfile, avatar, meals, activeDay, weights, cheatDays, theme, lang])

  return (
    // fixed + inset-0 pins the app to the real screen edges. A height of 100%
    // can come out shorter than the screen in an installed iOS web app, which
    // leaves a strip under the tab bar.
    <div className="fixed inset-0 mx-auto flex max-w-md flex-col overflow-hidden bg-canvas text-zinc-900 transition-colors duration-300 dark:bg-black dark:text-white">
      {/* Pager viewport: clips the track and receives the drag. */}
      <div ref={viewportRef} {...bind()} className="relative min-h-0 flex-1 overflow-hidden" style={{ touchAction: 'pan-y' }}>
        <motion.div className="flex h-full" style={{ x: trackX, opacity: fade, willChange: 'transform' }}>
          {TAB_ORDER.map((name, i) => (
            // Each tab scrolls on its own and stays mounted (mounting mid-swipe
            // caused hitches). touch-action MUST be on the scroll container
            // itself: the browser only reads it from the touched element up to
            // the nearest scroller, so on the viewport above it was ignored and
            // iOS kept claiming horizontal moves for itself.
            <section
              key={name}
              ref={(el) => { paneRefs.current[i] = el }}
              inert={tab !== name}
              className="h-full w-full flex-none space-y-4 overflow-y-auto overflow-x-hidden overscroll-contain px-4 pb-10"
              style={{ paddingTop: 'calc(env(safe-area-inset-top) + 8px)', touchAction: 'pan-y' }}
            >
              {pages[name]}
            </section>
          ))}
        </motion.div>
      </div>

      <TabBar navIndex={navIndex} onTab={goTo} onAdd={() => setMealOpen(true)} lang={lang} />

      {/* ---- Sheets (later ones stack on top). AnimatePresence keeps a sheet
          mounted until its slide-out spring has finished. ---- */}
      <AnimatePresence>
        {mealOpen && (
          <AddMealSheet
            key="meal"
            foods={foods} customFoods={myFoods} templates={templates}
            // Tag the meal with the active tracking day, whatever the clock says.
            onSave={(meal) => setMeals((list) => [{ ...meal, day: activeDay.date }, ...list])}
            onClose={() => setMealOpen(false)}
            onCreateCustom={() => setCustomEditing('new')}
            onEditCustom={(food) => setCustomEditing(food)}
            onEditTemplate={(template) => setTemplateEditing(template)}
            onOpenDivider={() => setDividerOpen(true)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {mealEditing && (
          // Same sheet as Log Meal, in edit mode. Saving replaces the meal in
          // place (same id / date / tracking day), so the Home ring, macros
          // and Analytics recompute from `meals` immediately.
          <AddMealSheet
            key="edit"
            meal={mealEditing}
            foods={foods} customFoods={myFoods} templates={templates}
            onSave={(updated) => setMeals((list) => list.map((m) => (m.id === updated.id ? updated : m)))}
            onClose={() => setMealEditing(null)}
            onCreateCustom={() => setCustomEditing('new')}
            onEditCustom={(food) => setCustomEditing(food)}
            onEditTemplate={(template) => setTemplateEditing(template)}
            onOpenDivider={() => setDividerOpen(true)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {customEditing && (
          <CustomFoodSheet
            key="custom"
            food={customEditing === 'new' ? null : customEditing}
            onSave={(food) => setCustomFoods((list) => upsert(list, food))}
            onDelete={(id) => setCustomFoods((list) => list.filter((f) => f.id !== id))}
            onClose={() => setCustomEditing(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {templateEditing && (
          <TemplateEditSheet
            key="template"
            foods={foods} customFoods={myFoods} templates={templates}
            template={templateEditing}
            onSave={(template) => setTemplates((list) => upsert(list, template))}
            onDelete={(id) => setTemplates((list) => list.filter((t) => t.id !== id))}
            onClose={() => setTemplateEditing(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {dividerOpen && (
          <MealDividerSheet
            key="divider"
            foods={foods} customFoods={myFoods} templates={templates}
            onSave={(food) => setCustomFoods((list) => [...list, food])}
            onClose={() => setDividerOpen(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {planOpen && (
          <PlanSheet key="plan" profile={planProfile} weighIn={weighIn} onChange={updateProfile} onClose={() => setPlanOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
