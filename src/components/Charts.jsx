// Hand-drawn SVG charts: no chart library, so nothing extra to download or cache.
import { fmt0, fmt1 } from '../lib/calc.js'

const W = 320
const H = 210
const LEFT = 38   // room for y-axis labels
const BOTTOM = 24 // room for x-axis labels
const TOP = 14

/** Weekly calories: one bar per day with a dashed goal line. */
export function BarChart({ days, goal }) {
  const max = Math.max(goal, ...days.map((d) => d.value), 1) * 1.15
  const plotH = H - TOP - BOTTOM
  const y = (v) => TOP + plotH * (1 - v / max)
  const slot = (W - LEFT) / days.length
  const barW = slot * 0.6

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full text-zinc-900 dark:text-white" role="img" aria-label="Calories per day this week">
      <defs>
        <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b58ff2" />
          <stop offset="1" stopColor="#7851a9" />
        </linearGradient>
        {/* Soft neon halo behind the bars. */}
        <filter id="bar-glow" filterUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComponentTransfer in="blur" result="halo"><feFuncA type="linear" slope="0.55" /></feComponentTransfer>
          <feMerge><feMergeNode in="halo" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {[0, 0.5, 1].map((t) => (
        <g key={t}>
          <line x1={LEFT} x2={W} y1={y(max * t)} y2={y(max * t)} stroke="currentColor" strokeOpacity=".08" />
          <text x={LEFT - 6} y={y(max * t) + 3} textAnchor="end" fontSize="9" fill="currentColor" fillOpacity=".6">
            {fmt0(max * t)}
          </text>
        </g>
      ))}

      {days.map((d, i) => {
        const x = LEFT + slot * i + (slot - barW) / 2
        const h = Math.max(y(0) - y(d.value), 0)
        return (
          <g key={i}>
            {h > 0 && <rect x={x} y={y(d.value)} width={barW} height={h} rx="5" fill="url(#bar)" filter="url(#bar-glow)" />}
            <text x={x + barW / 2} y={H - 7} textAnchor="middle" fontSize="10" fill="currentColor" fillOpacity=".6">
              {d.label}
            </text>
          </g>
        )
      })}

      {goal > 0 && (
        <g>
          <line x1={LEFT} x2={W} y1={y(goal)} y2={y(goal)} stroke="currentColor" strokeOpacity=".45" strokeDasharray="5 4" />
          <text x={W} y={y(goal) - 4} textAnchor="end" fontSize="9" fill="currentColor" fillOpacity=".6">
            Goal {fmt0(goal)}
          </text>
        </g>
      )}
    </svg>
  )
}

/** Weight trend: line with a soft fill. `points` are { date: 'YYYY-MM-DD', value }, oldest first. */
export function LineChart({ points }) {
  const values = points.map((p) => p.value)
  const lo = Math.min(...values) - 1.5
  const hi = Math.max(...values) + 1.5
  const times = points.map((p) => new Date(p.date).getTime())
  const t0 = times[0]
  const span = times[times.length - 1] - t0

  const plotH = H - TOP - BOTTOM
  const plotW = W - LEFT - 8
  const x = (t) => (span === 0 ? LEFT + plotW / 2 : LEFT + ((t - t0) / span) * plotW)
  const y = (v) => TOP + plotH * (1 - (v - lo) / (hi - lo))

  const coords = points.map((p, i) => [x(times[i]), y(p.value)])
  const line = coords.map(([px, py]) => `${px},${py}`).join(' ')
  const area = `${coords[0][0]},${y(lo)} ${line} ${coords[coords.length - 1][0]},${y(lo)}`
  const label = (date) => new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full text-zinc-900 dark:text-white" role="img" aria-label="Weight trend">
      <defs>
        <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7851a9" stopOpacity=".45" />
          <stop offset="1" stopColor="#7851a9" stopOpacity="0" />
        </linearGradient>
        {/* Soft neon halo behind the trend line. userSpaceOnUse keeps it
            working even when the line is perfectly flat. */}
        <filter id="line-glow" filterUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComponentTransfer in="blur" result="halo"><feFuncA type="linear" slope="0.55" /></feComponentTransfer>
          <feMerge><feMergeNode in="halo" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {[0, 0.5, 1].map((t) => {
        const v = lo + (hi - lo) * t
        return (
          <g key={t}>
            <line x1={LEFT} x2={W} y1={y(v)} y2={y(v)} stroke="currentColor" strokeOpacity=".08" />
            <text x={LEFT - 6} y={y(v) + 3} textAnchor="end" fontSize="9" fill="currentColor" fillOpacity=".6">
              {fmt1(v)}
            </text>
          </g>
        )
      })}

      <polygon points={area} fill="url(#area)" />
      <g filter="url(#line-glow)">
        <polyline points={line} fill="none" stroke="#b58ff2" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map(([px, py], i) => <circle key={i} cx={px} cy={py} r="3.5" fill="#b58ff2" />)}
      </g>

      <text x={LEFT} y={H - 7} fontSize="10" fill="currentColor" fillOpacity=".6">{label(points[0].date)}</text>
      {span > 0 && (
        <text x={W - 8} y={H - 7} textAnchor="end" fontSize="10" fill="currentColor" fillOpacity=".6">
          {label(points[points.length - 1].date)}
        </text>
      )}
    </svg>
  )
}
