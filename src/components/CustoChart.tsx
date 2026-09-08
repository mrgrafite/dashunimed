interface CustoChartProps {
  meses: string[]
  folha: number[]
  encargos: number[]
  beneficio: number[]
  rescisao: number[]
}

const CORES = {
  folha: 'var(--brand)',
  encargos: 'var(--azure-400)',
  beneficio: 'var(--success)',
  rescisao: 'var(--danger)',
}

const brlCompacto = (n: number) => {
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `R$ ${(n / 1_000).toFixed(0)}mil`
  return `R$ ${n.toFixed(0)}`
}

export function CustoChart({ meses, folha, encargos, beneficio, rescisao }: CustoChartProps) {
  const totais = meses.map((_, i) => folha[i] + encargos[i] + beneficio[i] + rescisao[i])
  const max = Math.max(1, ...totais)

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 200, overflowX: 'auto', padding: '4px 4px 0' }}>
      {meses.map((label, i) => {
        const total = totais[i]
        const alturaTotal = 150
        return (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div
              title={`${label}: ${brlCompacto(total)} (Folha ${brlCompacto(folha[i])} · Encargos ${brlCompacto(encargos[i])} · Benefícios ${brlCompacto(beneficio[i])} · Rescisão ${brlCompacto(rescisao[i])})`}
              style={{ display: 'flex', flexDirection: 'column-reverse', width: 22, height: (total / max) * alturaTotal, borderRadius: '3px 3px 0 0', overflow: 'hidden' }}
            >
              <div style={{ height: `${(folha[i] / (total || 1)) * 100}%`, background: CORES.folha }} />
              <div style={{ height: `${(encargos[i] / (total || 1)) * 100}%`, background: CORES.encargos }} />
              <div style={{ height: `${(beneficio[i] / (total || 1)) * 100}%`, background: CORES.beneficio }} />
              <div style={{ height: `${(rescisao[i] / (total || 1)) * 100}%`, background: CORES.rescisao }} />
            </div>
            <span style={{ font: 'var(--fw-medium) var(--text-caption)/1 var(--font-sans)', color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
