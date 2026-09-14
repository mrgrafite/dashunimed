const ORDEM = ['Física', 'Auditiva', 'Visual', 'Intelectual/Mental', 'Outra', 'Reabilitado'] as const
const CORES: Record<string, string> = {
  'Física': 'var(--brand)',
  Auditiva: 'var(--info)',
  Visual: 'var(--azure-400)',
  'Intelectual/Mental': 'var(--chart-5)',
  Outra: 'var(--warning)',
  Reabilitado: 'var(--success)',
}

// Mesma geometria/raios do CustoChartRosca (aba Custo de Folha) - padrão de gráfico de
// proporção do painel inteiro, pra não ter dois visuais diferentes pra mesma ideia.
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

export function PcdWidget({ pcdMap }: { pcdMap: Record<string, number> }) {
  const total = ORDEM.reduce((s, k) => s + (pcdMap[k] || 0), 0)

  if (total === 0) {
    return <span style={{ font: 'var(--fw-regular) var(--text-body-sm)/1.4 var(--font-sans)', color: 'var(--text-muted)' }}>Nenhum colaborador PcD no recorte atual.</span>
  }

  let anguloAtual = -Math.PI / 2
  const fatias = ORDEM.filter((k) => (pcdMap[k] || 0) > 0).map((k) => {
    const valor = pcdMap[k] || 0
    const anguloVarredura = (valor / total) * Math.PI * 2
    const anguloIni = anguloAtual
    const anguloFim = anguloAtual + anguloVarredura
    anguloAtual = anguloFim
    return { nome: k, valor, cor: CORES[k], d: fatia(CX, CY, R_OUT, R_IN, anguloIni, anguloFim), pct: (valor / total) * 100 }
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap', padding: '4px 4px 0' }}>
      <svg viewBox="0 0 200 200" width={200} height={200} style={{ flexShrink: 0 }}>
        {fatias.map((f) => (
          <path key={f.nome} d={f.d} fill={f.cor}>
            <title>{`${f.nome}: ${f.valor} (${f.pct.toFixed(1)}%)`}</title>
          </path>
        ))}
        <text x={CX} y={CY - 6} textAnchor="middle" fontSize="24" fontWeight={800} fill="var(--text-strong)">
          {total}
        </text>
        <text x={CX} y={CY + 14} textAnchor="middle" fontSize="11" fill="var(--text-faint)">
          colaboradores PcD
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {fatias.map((f) => (
          <div key={f.nome} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: f.cor, display: 'inline-block', flexShrink: 0 }} />
            <span style={{ font: 'var(--fw-medium) var(--text-body-sm)/1 var(--font-sans)', color: 'var(--text-body)', minWidth: 130 }}>{f.nome}</span>
            <span className="tabular" style={{ font: 'var(--fw-semibold) var(--text-body-sm)/1 var(--font-sans)', color: 'var(--text-strong)' }}>
              {f.valor.toLocaleString('pt-BR')}
            </span>
            <span style={{ font: 'var(--fw-regular) var(--text-caption)/1 var(--font-sans)', color: 'var(--text-faint)' }}>({f.pct.toFixed(0)}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}
