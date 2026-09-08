interface AbsenteeismoChartProps {
  meses: string[]
  curto: number[]
  total: number[]
  faltas?: number[]
}

const W = 720
const H = 160
const PAD_L = 34
const PAD_R = 12
const PAD_T = 12
const PAD_B = 26
// Espaco reservado nas pontas pra o primeiro/ultimo ponto (e seu marcador) nao ficarem
// colados na borda do grafico - distribui os pontos gradualmente dentro dessa margem.
const INSET = 16

export function AbsenteeismoChart({ meses, curto, total, faltas }: AbsenteeismoChartProps) {
  const max = Math.max(...total, ...curto, ...(faltas ?? [0])) * 1.2 || 1
  const plotW = W - PAD_L - PAD_R
  const plotH = H - PAD_T - PAD_B
  const n = total.length

  const x = (i: number) => PAD_L + INSET + (n <= 1 ? (plotW - 2 * INSET) / 2 : (i / (n - 1)) * (plotW - 2 * INSET))
  const y = (v: number) => PAD_T + plotH - (v / max) * plotH

  const linha = (valores: number[]) => valores.map((v, i) => `${x(i)},${y(v)}`).join(' ')

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: 480, display: 'block' }}>
        <polyline points={linha(total)} fill="none" stroke="var(--danger)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" strokeDasharray="4 3" />
        <polyline points={linha(curto)} fill="none" stroke="var(--brand)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {faltas && <polyline points={linha(faltas)} fill="none" stroke="var(--warning)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" strokeDasharray="1 4" />}

        {total.map((v, i) => (
          <circle key={`t${i}`} cx={x(i)} cy={y(v)} r={3} fill="var(--danger)">
            <title>{`${meses[i]} · afastamento total: ${v.toFixed(1)}%`}</title>
          </circle>
        ))}
        {curto.map((v, i) => (
          <circle key={`c${i}`} cx={x(i)} cy={y(v)} r={3.5} fill="var(--brand)" stroke="var(--surface-card)" strokeWidth={1}>
            <title>{`${meses[i]} · absenteísmo curto: ${v.toFixed(1)}%`}</title>
          </circle>
        ))}
        {faltas?.map((v, i) => (
          <circle key={`f${i}`} cx={x(i)} cy={y(v)} r={2.5} fill="var(--warning)">
            <title>{`${meses[i]} · faltas não justificadas: ${v.toFixed(1)}%`}</title>
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
