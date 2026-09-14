interface EvolutionAreaChartProps {
  meses: string[]
  adm: number[]
  deslig: number[]
}

const W = 760
const H = 240
const PAD_L = 34
const PAD_R = 12
const PAD_T = 16
const PAD_B = 26
const INSET = 14

/** Catmull-Rom → Bézier cúbica (tensão uniforme) - curva suave passando por todos os pontos,
 * mesmo visual de "clipped area chart" usado em dashboards de analytics modernos. */
function smoothPath(points: [number, number][]): string {
  if (points.length < 2) return points.map((p) => `M${p[0]},${p[1]}`).join(' ')
  let d = `M${points[0][0]},${points[0][1]}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`
  }
  return d
}

export function EvolutionAreaChart({ meses, adm, deslig }: EvolutionAreaChartProps) {
  const max = Math.max(1, ...adm, ...deslig) * 1.15
  const plotW = W - PAD_L - PAD_R
  const plotH = H - PAD_T - PAD_B
  const n = meses.length
  const baselineY = PAD_T + plotH

  const x = (i: number) => PAD_L + INSET + (n <= 1 ? (plotW - 2 * INSET) / 2 : (i / (n - 1)) * (plotW - 2 * INSET))
  const y = (v: number) => PAD_T + plotH - (v / max) * plotH

  const series: [string, number[], string, string][] = [
    ['Admissões', adm, 'var(--success)', 'grad-adm'],
    ['Desligamentos', deslig, 'var(--danger)', 'grad-deslig'],
  ]

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: 480, display: 'block' }}>
        <defs>
          <linearGradient id="grad-adm" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--success)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--success)" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="grad-deslig" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--danger)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--danger)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {[0, 0.5, 1].map((f) => (
          <line key={f} x1={PAD_L} x2={W - PAD_R} y1={PAD_T + plotH * f} y2={PAD_T + plotH * f} stroke="var(--border-subtle)" strokeWidth={1} />
        ))}

        {series.map(([nome, valores, cor, gradId]) => {
          const points: [number, number][] = valores.map((v, i) => [x(i), y(v)])
          const linePath = smoothPath(points)
          const areaPath = `${linePath} L${x(n - 1)},${baselineY} L${x(0)},${baselineY} Z`
          return (
            <g key={nome}>
              <path d={areaPath} fill={`url(#${gradId})`} stroke="none" />
              <path d={linePath} fill="none" stroke={cor} strokeWidth={2.25} strokeLinecap="round" />
              {valores.map((v, i) => (
                <circle key={i} cx={x(i)} cy={y(v)} r={3.5} fill={cor} stroke="var(--surface-card)" strokeWidth={1.5}>
                  <title>{`${meses[i]} · ${nome}: ${v}`}</title>
                </circle>
              ))}
            </g>
          )
        })}

        {meses.map((label, i) => (
          <text key={label} x={x(i)} y={H - 6} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'} fontSize="10" fill="var(--text-faint)">
            {label}
          </text>
        ))}
      </svg>
    </div>
  )
}
