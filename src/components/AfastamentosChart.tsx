interface AfastamentosChartProps {
  meses: string[]
  taxa: number[]
}

const W = 720
const H = 160
const PAD_L = 34
const PAD_R = 12
const PAD_T = 12
const PAD_B = 26
const INSET = 16

export function AfastamentosChart({ meses, taxa }: AfastamentosChartProps) {
  const max = Math.max(1, ...taxa) * 1.2
  const plotW = W - PAD_L - PAD_R
  const plotH = H - PAD_T - PAD_B
  const n = taxa.length

  const x = (i: number) => PAD_L + INSET + (n <= 1 ? (plotW - 2 * INSET) / 2 : (i / (n - 1)) * (plotW - 2 * INSET))
  const y = (v: number) => PAD_T + plotH - (v / max) * plotH

  const pontos = taxa.map((v, i) => `${x(i)},${y(v)}`).join(' ')

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: 480, display: 'block' }}>
        <polyline points={pontos} fill="none" stroke="var(--info)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

        {taxa.map((v, i) => (
          <circle key={i} cx={x(i)} cy={y(v)} r={4} fill="var(--info)" stroke="var(--surface-card)" strokeWidth={1.5}>
            <title>{`${meses[i]}: ${v.toFixed(1)}%`}</title>
          </circle>
        ))}

        {meses.map((label, i) => (
          <text key={label} x={x(i)} y={H - 6} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'} fontSize="10" fill="var(--text-faint)">
            {label}
          </text>
        ))}

        {[0, max / 2, max].map((v, i) => (
          <text key={i} x={PAD_L - 6} y={y(v) + 3} textAnchor="end" fontSize="10" fill="var(--text-faint)">
            {v.toFixed(0)}%
          </text>
        ))}
      </svg>
    </div>
  )
}
