// Shared building blocks. Every colour is given for light mode first and for
// dark mode with a `dark:` variant, so the whole app follows the theme toggle.
import { useState } from 'react'
import { fmt0, fmt1 } from '../lib/calc.js'

// ---- Theme-aware class sets (used across screens) -------------------------

export const muted = 'text-zinc-500 dark:text-white/60'
export const faint = 'text-zinc-400 dark:text-white/40'
export const accentText = 'text-royal dark:text-lilac'
export const carbsText = 'text-carbs-deep dark:text-carbs'
export const fatText = 'text-fat-deep dark:text-fat'
export const fieldBg = 'bg-zinc-100 dark:bg-field'
export const divider = 'divide-black/5 dark:divide-white/10'
const placeholder = 'placeholder:text-zinc-400 dark:placeholder:text-white/30'

// ---- Layout ----------------------------------------------------------------

/** Rounded card. Backgrounds sit at 95% opacity so they blend into the page. */
export const Card = ({ children, className = '' }) => (
  <section
    className={`rounded-3xl border border-black/5 bg-white/95 p-[18px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-colors duration-300 dark:border-white/5 dark:bg-card/95 dark:shadow-none ${className}`}
  >
    {children}
  </section>
)

export const SectionTitle = ({ children }) => <h2 className="text-[17px] font-semibold">{children}</h2>

export const PageTitle = ({ children, action }) => (
  <header className="flex items-center justify-between pt-2">
    <h1 className="text-3xl font-bold tracking-tight">{children}</h1>
    {action}
  </header>
)

// ---- Inputs ----------------------------------------------------------------

export const PrimaryButton = ({ children, className = '', ...props }) => (
  <button
    {...props}
    className={`w-full rounded-2xl bg-royal py-3.5 font-semibold text-white transition active:opacity-80 disabled:opacity-35 ${className}`}
  >
    {children}
  </button>
)

export const TextInput = ({ className = '', ...props }) => (
  <input
    {...props}
    className={`w-full rounded-xl px-3.5 py-2.5 outline-none transition-colors ${fieldBg} ${placeholder} ${className}`}
  />
)

/** Labelled input row: "Protein ........ [ 0 ] g". */
export const FieldRow = ({ label, unit, ...input }) => (
  <label className={`flex items-center rounded-xl px-3.5 py-2.5 transition-colors ${fieldBg}`}>
    <span className="flex-1">{label}</span>
    <input
      inputMode="decimal"
      {...input}
      className={`w-24 bg-transparent text-right tabular-nums outline-none ${placeholder}`}
    />
    <span className={`w-10 pl-2 ${muted}`}>{unit}</span>
  </label>
)

/** iOS-style segmented control. */
export const Segmented = ({ options, value, onChange }) => (
  <div className={`flex rounded-xl p-1 ${fieldBg}`}>
    {options.map((option) => (
      <button
        key={option}
        onClick={() => onChange(option)}
        className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition ${
          value === option ? 'bg-royal text-white shadow-sm' : muted
        }`}
      >
        {option}
      </button>
    ))}
  </div>
)

/** Round "+" used to add an item to a meal. */
export const AddButton = ({ onClick, label }) => (
  <button
    onClick={onClick}
    aria-label={label}
    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-royal text-lg leading-none text-white transition active:scale-90"
  >
    +
  </button>
)

/** "−  value  +" counter that replaces the AddButton once an item is picked. */
export const Stepper = ({ value, onMinus, onPlus, label }) => (
  <div className="flex shrink-0 items-center rounded-full bg-royal/10 dark:bg-royal/25">
    <button
      onClick={onMinus}
      aria-label={`Less ${label}`}
      className={`flex h-8 w-8 items-center justify-center rounded-full text-lg leading-none transition active:scale-90 ${accentText}`}
    >
      −
    </button>
    <span className="min-w-12 text-center text-xs font-semibold tabular-nums">{value}</span>
    <button
      onClick={onPlus}
      aria-label={`More ${label}`}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-royal text-lg leading-none text-white transition active:scale-90"
    >
      +
    </button>
  </div>
)

export const ChevronIcon = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m9 6 6 6-6 6" />
  </svg>
)

// ---- Avatar ----------------------------------------------------------------

/** Circular profile picture; falls back to initials, then a person glyph. */
export function Avatar({ src, name = '', size = 40 }) {
  const initials = name.trim().split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-royal/15 ring-2 ring-royal/40 dark:bg-royal/25"
      style={{ width: size, height: size }}
    >
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : initials ? (
        <span className={`font-semibold ${accentText}`} style={{ fontSize: size * 0.38 }}>{initials}</span>
      ) : (
        <svg viewBox="0 0 24 24" className={accentText} style={{ width: size * 0.55 }} fill="currentColor" aria-hidden="true">
          <path d="M12 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM4 21a8 8 0 0 1 16 0z" />
        </svg>
      )}
    </span>
  )
}

// ---- Rings & bars ----------------------------------------------------------

/** Soft neon halo: a blurred, part-transparent copy drawn behind the shape.
 *  userSpaceOnUse keeps the halo from being clipped at the ring's edge. */
const GlowFilter = ({ id, extent, blur = 5 }) => (
  <filter id={id} filterUnits="userSpaceOnUse" x={-20} y={-20} width={extent + 40} height={extent + 40}>
    <feGaussianBlur stdDeviation={blur} result="blur" />
    <feComponentTransfer in="blur" result="halo"><feFuncA type="linear" slope="0.6" /></feComponentTransfer>
    <feMerge><feMergeNode in="halo" /><feMergeNode in="SourceGraphic" /></feMerge>
  </filter>
)

/** Main calorie ring. `progress` is 0..1. */
export function CalorieRing({ progress, remaining }) {
  const r = 82
  const c = 2 * Math.PI * r
  return (
    <div className="relative mx-auto h-[190px] w-[190px]">
      <svg viewBox="0 0 190 190" className="-rotate-90 overflow-visible">
        <defs>
          <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#b58ff2" />
            <stop offset="1" stopColor="#7851a9" />
          </linearGradient>
          <GlowFilter id="ring-glow" extent={190} />
        </defs>
        <circle cx="95" cy="95" r={r} fill="none" stroke="#7851a9" strokeOpacity=".18" strokeWidth="16" />
        <circle
          filter="url(#ring-glow)"
          cx="95" cy="95" r={r} fill="none" stroke="url(#ring)" strokeWidth="16" strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
          style={{ transition: 'stroke-dashoffset .6s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold tabular-nums">{fmt0(Math.abs(remaining))}</span>
        <span className={`text-sm ${remaining >= 0 ? muted : fatText}`}>
          {remaining >= 0 ? 'kcal left' : 'kcal over'}
        </span>
      </div>
    </div>
  )
}

/** Small macro ring: grams eaten in the middle, goal underneath. */
export function MiniRing({ label, value, goal, color }) {
  const size = 84
  const r = 34
  const c = 2 * Math.PI * r
  const progress = goal > 0 ? Math.min(Math.max(value / goal, 0), 1) : 0
  const id = `mini-glow-${label}`
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90 overflow-visible">
          <defs><GlowFilter id={id} extent={size} blur={3.5} /></defs>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeOpacity=".18" strokeWidth="8" />
          <circle
            filter={`url(#${id})`}
            cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - progress)}
            style={{ transition: 'stroke-dashoffset .6s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-tight">
          <span className="text-base font-bold tabular-nums">{fmt0(value)}</span>
          <span className={`text-[10px] tabular-nums ${muted}`}>/ {fmt0(goal)} g</span>
        </div>
      </div>
      <span className={`mt-2 text-xs font-medium ${muted}`}>{label}</span>
    </div>
  )
}

/** Linear macro progress bar (used in Analytics). `color` is a bg-* class. */
export function MacroBar({ label, value, goal, color }) {
  const pct = goal > 0 ? Math.min(Math.max(value / goal, 0), 1) * 100 : 0
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className={`tabular-nums ${muted}`}>{fmt0(value)} / {fmt0(goal)} g</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export const StatTile = ({ title, value, unit }) => (
  <Card className="flex-1">
    <p className={`text-xs ${muted}`}>{title}</p>
    <p className="mt-1.5 text-2xl font-bold tabular-nums">
      {value} <span className={`text-xs font-normal ${muted}`}>{unit}</span>
    </p>
  </Card>
)

/** Compact "P 24  C 3  F 18" line. `glow` makes each value a neon chip. */
export const MacroSummary = ({ macros, glow = false }) => {
  const chip = glow ? 'glow-text font-medium' : ''
  return (
    <span className={`flex gap-2.5 text-xs tabular-nums ${glow ? '' : muted}`}>
      <span className={glow ? `${chip} ${accentText}` : ''}><b className={accentText}>P</b> {fmt1(macros.protein)}</span>
      <span className={glow ? `${chip} ${carbsText}` : ''}><b className={carbsText}>C</b> {fmt1(macros.carbs)}</span>
      <span className={glow ? `${chip} ${fatText}` : ''}><b className={fatText}>F</b> {fmt1(macros.fat)}</span>
    </span>
  )
}

// ---- Sheets & dialogs ------------------------------------------------------

/** Full-screen modal sheet with close / title / action header. */
export function Sheet({ title, onClose, action, children, z = 'z-40', closeLabel = 'Cancel' }) {
  return (
    <div className={`fixed inset-0 ${z} flex flex-col bg-canvas text-zinc-900 dark:bg-black dark:text-white`}>
      <header
        className="flex items-center justify-between border-b border-black/5 px-4 pb-3 dark:border-white/10"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
      >
        <button onClick={onClose} className={`w-16 text-left ${accentText}`}>{closeLabel}</button>
        <h1 className="font-semibold">{title}</h1>
        <div className="w-16 text-right">{action}</div>
      </header>
      <div
        className="mx-auto w-full max-w-md flex-1 space-y-4 overflow-y-auto p-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
      >
        {children}
      </div>
    </div>
  )
}

const DialogShell = ({ title, onCancel, children, as: Tag = 'div', ...rest }) => (
  <div
    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm dark:bg-black/70"
    role="dialog" aria-modal="true" aria-label={title}
    onClick={onCancel}
  >
    <Tag
      {...rest}
      className="w-full max-w-xs rounded-3xl border border-black/5 bg-white p-5 text-center text-zinc-900 dark:border-white/10 dark:bg-card dark:text-white"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </Tag>
  </div>
)

/** Centered confirmation dialog. Cancel is the safe, default-looking choice. */
export function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel }) {
  return (
    <DialogShell title={title} onCancel={onCancel}>
      <h2 className="text-[17px] font-semibold">{title}</h2>
      <p className={`mt-2 text-sm ${muted}`}>{message}</p>
      <div className="mt-5 flex gap-3">
        <button onClick={onCancel} className={`flex-1 rounded-2xl py-3 font-medium ${fieldBg}`}>Cancel</button>
        <button onClick={onConfirm} className="flex-1 rounded-2xl bg-royal py-3 font-semibold text-white">{confirmLabel}</button>
      </div>
    </DialogShell>
  )
}

/** Dialog that asks for a name (used when saving a meal as a template). */
export function NameDialog({ title, message, initial = '', confirmLabel, onConfirm, onCancel }) {
  const [name, setName] = useState(initial)
  const trimmed = name.trim()
  return (
    <DialogShell
      as="form" title={title} onCancel={onCancel}
      onSubmit={(e) => { e.preventDefault(); if (trimmed) onConfirm(trimmed) }}
    >
      <h2 className="text-[17px] font-semibold">{title}</h2>
      {message && <p className={`mt-2 text-sm ${muted}`}>{message}</p>}
      <TextInput
        value={name} onChange={(e) => setName(e.target.value)}
        placeholder="Template name" aria-label="Template name" className="mt-4"
      />
      <div className="mt-4 flex gap-3">
        <button type="button" onClick={onCancel} className={`flex-1 rounded-2xl py-3 font-medium ${fieldBg}`}>Cancel</button>
        <button type="submit" disabled={!trimmed} className="flex-1 rounded-2xl bg-royal py-3 font-semibold text-white disabled:opacity-35">
          {confirmLabel}
        </button>
      </div>
    </DialogShell>
  )
}
