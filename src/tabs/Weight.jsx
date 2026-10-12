// Weight tab: log a weight with a date and see the trend line.
import { useState } from 'react'
import { num, fmt1, dayKey } from '../lib/calc.js'
import {
  Card, SectionTitle, PageTitle, PrimaryButton, StatTile, FieldRow, muted, faint, accentText, fieldBg,
} from '../components/ui.jsx'
import { LineChart } from '../components/Charts.jsx'

export default function Weight({ entries, onAdd, onDelete }) {
  const [weight, setWeight] = useState('')
  const [date, setDate] = useState(dayKey())

  const kg = num(weight)
  const canSave = kg > 20 && kg < 400 && date && date <= dayKey()

  // entries are kept sorted oldest first
  const latest = entries[entries.length - 1]
  const change = entries.length > 1 ? latest.kg - entries[0].kg : null

  const save = () => {
    onAdd({ id: crypto.randomUUID(), date, kg })
    setWeight('')
    setDate(dayKey())
  }

  return (
    <>
      <PageTitle>Weight</PageTitle>

      <div className="flex gap-4">
        <StatTile title="Current" value={latest ? fmt1(latest.kg) : '–'} unit="kg" />
        <StatTile title="Change" value={change === null ? '–' : (change > 0 ? '+' : '') + fmt1(change)} unit="kg" />
      </div>

      <Card className="space-y-3.5">
        <SectionTitle>Log Weight</SectionTitle>
        <FieldRow label="Weight" unit="kg" placeholder="0.0" value={weight} onChange={(e) => setWeight(e.target.value)} />
        <label className={`flex items-center rounded-xl px-3.5 py-2.5 ${fieldBg}`}>
          <span className="flex-1">Date</span>
          <input
            type="date" value={date} max={dayKey()}
            onChange={(e) => setDate(e.target.value)}
            className={`bg-transparent text-right outline-none ${accentText}`}
          />
        </label>
        <PrimaryButton onClick={save} disabled={!canSave}>Save Entry</PrimaryButton>
      </Card>

      <Card>
        <SectionTitle>Trend</SectionTitle>
        {entries.length === 0 ? (
          <p className={`py-10 text-center text-sm ${muted}`}>Your trend line appears after your first entry.</p>
        ) : (
          <div className="mt-3">
            <LineChart points={entries.map((e) => ({ date: e.date, value: e.kg }))} />
          </div>
        )}
      </Card>

      {entries.length > 0 && (
        <Card>
          <SectionTitle>History</SectionTitle>
          <ul className="mt-2">
            {[...entries].reverse().map((entry) => (
              <li key={entry.id} className="flex items-center py-1.5">
                <span className="flex-1">
                  {new Date(entry.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <span className={`tabular-nums ${accentText}`}>{fmt1(entry.kg)} kg</span>
                <button onClick={() => onDelete(entry.id)} aria-label="Delete entry" className={`pl-3 text-xl leading-none ${faint}`}>
                  ×
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  )
}
