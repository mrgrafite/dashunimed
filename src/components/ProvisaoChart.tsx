interface ProvisaoChartProps {
  meses: string[]
  series: { nome: string; valores: number[]; cor: string }[]
}

const W = 720
const H = 200
const PAD_L = 60
const PAD_R = 12
const PAD_T = 12
const PAD_B = 26
const INSET = 16

const brlCompacto = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `R$ ${(n / 1_000).toFixed(0)}mil`
  return `R$ ${n.toFixed(0)}`
}

export function ProvisaoChart({ meses, series }: ProvisaoChartProps) {
  const todosValores = series.flatMap((s) => s.valores)
  const max = Math.max(1, ...todosValores) * 1.15
  const plotW = W - PAD_L - PAD_R
  const plotH = H - PAD_T - PAD_B
  const n = meses.length

  const x = (i: number) => PAD_L + INSET + (n <= 1 ? (plotW - 2 * INSET) / 2 : (i / (n - 1)) * (plotW - 2 * INSET))
  const y = (v: number) => PAD_T + plotH - (v / max) * plotH
  const linha = (valores: number[]) => valores.map((v, i) => `${x(i)},${y(v)}`).join(' ')

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: 480, display: 'block' }}>
        {series.map((s) => (
          <g key={s.nome}>
            <polyline points={linha(s.valores)} fill="none" stroke={s.cor} strokeWidth={2.25} strokeLinejoin="round" strokeLinecap="round" />
            {s.valores.map((v, i) => (
              <circle key={i} cx={x(i)} cy={y(v)} r={3} fill={s.cor} stroke="var(--surface-card)" strokeWidth={1}>
                <title>{`${meses[i]} · ${s.nome}: ${brlCompacto(v)}`}</title>
              </circle>
            ))}
          </g>
        ))}

        {meses.map((label, i) => (
          <text key={label} x={x(i)} y={H - 6} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'} fontSize="10" fill="var(--text-faint)">
            {label}
          </text>
        ))}

        {[0, max / 2, max].map((v, i) => (
          <text key={i} x={PAD_L - 8} y={y(v) + 3} textAnchor="end" fontSize="10" fill="var(--text-faint)">
            {brlCompacto(v)}
          </text>
        ))}
      </svg>
    </div>
  )
}
