interface CustoChartRoscaProps {
  folha: number
  encargos: number
  beneficio: number
  rescisao: number
}

const brl = (n: number) => 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const CX = 100
const CY = 100
const R_OUT = 90
const R_IN = 56

function fatia(cx: number, cy: number, rOut: number, rIn: number, anguloIni: number, anguloFim: number): string {
  const p = (r: number, a: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)]
  const largo = anguloFim - anguloIni > Math.PI ? 1 : 0
  const [x1, y1] = p(rOut, anguloIni)
  const [x2, y2] = p(rOut, anguloFim)
  const [x3, y3] = p(rIn, anguloFim)
  const [x4, y4] = p(rIn, anguloIni)
  return `M ${x1} ${y1} A ${rOut} ${rOut} 0 ${largo} 1 ${x2} ${y2} L ${x3} ${y3} A ${rIn} ${rIn} 0 ${largo} 0 ${x4} ${y4} Z`
}

export function CustoChartRosca({ folha, encargos, beneficio, rescisao }: CustoChartRoscaProps) {
  const total = folha + encargos + beneficio + rescisao || 1
  const partes: [string, number, string][] = [
    ['Folha', folha, 'var(--brand)'],
    ['Encargos', encargos, 'var(--azure-400)'],
    ['Benefícios', beneficio, 'var(--success)'],
    ['Rescisão', rescisao, 'var(--danger)'],
  ]

  let anguloAtual = -Math.PI / 2
  const fatias = partes
    .filter(([, v]) => v > 0)
    .map(([nome, valor, cor]) => {
      const anguloVarredura = (valor / total) * Math.PI * 2
      const anguloIni = anguloAtual
      const anguloFim = anguloAtual + anguloVarredura
      anguloAtual = anguloFim
      return { nome, valor, cor, d: fatia(CX, CY, R_OUT, R_IN, anguloIni, anguloFim), pct: (valor / total) * 100 }
    })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap', padding: '4px 4px 0' }}>
      <svg viewBox="0 0 200 200" width={200} height={200} style={{ flexShrink: 0 }}>
        {fatias.map((f) => (
          <path key={f.nome} d={f.d} fill={f.cor}>
            <title>{`${f.nome}: ${brl(f.valor)} (${f.pct.toFixed(1)}%)`}</title>
          </path>
        ))}
        <text x={CX} y={CY - 6} textAnchor="middle" fontSize="13" fontWeight={700} fill="var(--text-strong)">
          {brl(total).replace(',00', '')}
        </text>
        <text x={CX} y={CY + 12} textAnchor="middle" fontSize="10" fill="var(--text-faint)">
          total do período
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {fatias.map((f) => (
          <div key={f.nome} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: f.cor, display: 'inline-block', flexShrink: 0 }} />
            <span style={{ font: 'var(--fw-medium) var(--text-body-sm)/1 var(--font-sans)', color: 'var(--text-body)', minWidth: 90 }}>{f.nome}</span>
            <span className="tabular" style={{ font: 'var(--fw-semibold) var(--text-body-sm)/1 var(--font-sans)', color: 'var(--text-strong)' }}>
              {brl(f.valor)}
            </span>
            <span style={{ font: 'var(--fw-regular) var(--text-caption)/1 var(--font-sans)', color: 'var(--text-faint)' }}>({f.pct.toFixed(0)}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}
