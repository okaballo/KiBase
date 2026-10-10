// Small reusable building blocks shared by every screen.
import { fmt0, fmt1 } from '../lib/calc.js'

export const Card = ({ children, className = '' }) => (
  <section className={`rounded-3xl border border-white/5 bg-card p-[18px] ${className}`}>
    {children}
  </section>
)

export const SectionTitle = ({ children }) => (
  <h2 className="text-[17px] font-semibold">{children}</h2>
)

export const PageTitle = ({ children, action }) => (
  <header className="flex items-center justify-between pt-2">
    <h1 className="text-3xl font-bold">{children}</h1>
    {action}
  </header>
)

export const PrimaryButton = ({ children, className = '', ...props }) => (
  <button
    {...props}
    className={`w-full rounded-2xl bg-royal py-3.5 font-semibold text-white transition active:opacity-80 disabled:opacity-35 ${className}`}
  >
    {children}
  </button>
)

/** Circular calorie progress ring. `progress` is 0..1. */
export function CalorieRing({ progress, remaining }) {
  const r = 82
  const c = 2 * Math.PI * r
  return (
    <div className="relative mx-auto h-[190px] w-[190px]">
      <svg viewBox="0 0 190 190" className="-rotate-90">
        <defs>
          <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#b58ff2" />
            <stop offset="1" stopColor="#7851a9" />
          </linearGradient>
        </defs>
        <circle cx="95" cy="95" r={r} fill="none" stroke="#7851a9" strokeOpacity=".2" strokeWidth="16" />
        <circle
          cx="95" cy="95" r={r} fill="none" stroke="url(#ring)" strokeWidth="16" strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
          style={{ transition: 'stroke-dashoffset .6s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold tabular-nums">{fmt0(Math.abs(remaining))}</span>
        <span className={`text-sm ${remaining >= 0 ? 'text-white/60' : 'text-fat'}`}>
          {remaining >= 0 ? 'kcal left' : 'kcal over'}
        </span>
      </div>
    </div>
  )
}

/** Linear macro progress bar. `color` is a Tailwind background class. */
export function MacroBar({ label, value, goal, color }) {
  const pct = goal > 0 ? Math.min(Math.max(value / goal, 0), 1) * 100 : 0
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-white/60">{fmt0(value)} / {fmt0(goal)} g</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export const StatTile = ({ title, value, unit }) => (
  <Card className="flex-1">
    <p className="text-xs text-white/60">{title}</p>
    <p className="mt-1.5 text-2xl font-bold tabular-nums">
      {value} <span className="text-xs font-normal text-white/60">{unit}</span>
    </p>
  </Card>
)

/** Compact "P 24  C 3  F 18" line. */
export const MacroSummary = ({ macros }) => (
  <span className="flex gap-2.5 text-xs tabular-nums text-white/60">
    <span><b className="text-lilac">P</b> {fmt1(macros.protein)}</span>
    <span><b className="text-carbs">C</b> {fmt1(macros.carbs)}</span>
    <span><b className="text-fat">F</b> {fmt1(macros.fat)}</span>
  </span>
)

/** Labelled input row: "Protein ........ [ 0 ] g". */
export const FieldRow = ({ label, unit, ...input }) => (
  <label className="flex items-center rounded-xl bg-field px-3.5 py-2.5">
    <span className="flex-1">{label}</span>
    <input
      inputMode="decimal"
      {...input}
      className="w-24 bg-transparent text-right tabular-nums outline-none placeholder:text-white/30"
    />
    <span className="w-10 pl-2 text-white/60">{unit}</span>
  </label>
)

/** iOS-style segmented control. */
export const Segmented = ({ options, value, onChange }) => (
  <div className="flex rounded-xl bg-field p-1">
    {options.map((option) => (
      <button
        key={option}
        onClick={() => onChange(option)}
        className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition ${
          value === option ? 'bg-royal text-white' : 'text-white/60'
        }`}
      >
        {option}
      </button>
    ))}
  </div>
)

/** Full-screen modal sheet with Cancel / title / action header. */
export function Sheet({ title, onClose, action, children, z = 'z-40' }) {
  return (
    <div className={`fixed inset-0 ${z} flex flex-col bg-black`}>
      <header
        className="flex items-center justify-between border-b border-white/10 px-4 pb-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
      >
        <button onClick={onClose} className="w-16 text-left text-lilac">Cancel</button>
        <h1 className="font-semibold">{title}</h1>
        <div className="w-16 text-right">{action}</div>
      </header>
      <div
        className="flex-1 space-y-4 overflow-y-auto p-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
      >
        {children}
      </div>
    </div>
  )
}
