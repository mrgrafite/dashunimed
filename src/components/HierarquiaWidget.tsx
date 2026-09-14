const ORDEM = ['Conselho Administrativo', 'Superintendencia', 'Diretoria', 'Gerencia', 'Coordenação/Supervisão', 'Operacional', 'Sem nível cadastrado'] as const
const CORES: Record<string, string> = {
  'Conselho Administrativo': 'var(--chart-5)',
  Superintendencia: 'var(--danger)',
  Diretoria: 'var(--warning)',
  Gerencia: 'var(--info)',
  'Coordenação/Supervisão': 'var(--azure-400)',
  Operacional: 'var(--brand)',
  'Sem nível cadastrado': 'var(--neutral-400)',
}

// Mesma geometria/raios do CustoChartRosca e do PcdWidget - padrão de gráfico de proporção do
// painel inteiro.
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

export function HierarquiaWidget({ niveisMap }: { niveisMap: Record<string, number> }) {
  const ordemComDado = ORDEM.filter((k) => (niveisMap[k] || 0) > 0)
  const total = ordemComDado.reduce((s, k) => s + (niveisMap[k] || 0), 0)

  if (total === 0) {
    return <span style={{ font: 'var(--fw-regular) var(--text-body-sm)/1.4 var(--font-sans)', color: 'var(--text-muted)' }}>Sem dados de hierarquia no recorte atual.</span>
  }

  let anguloAtual = -Math.PI / 2
  const fatias = ordemComDado.map((k) => {
    const valor = niveisMap[k] || 0
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
          cargos ativos
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {fatias.map((f) => (
          <div key={f.nome} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: f.cor, display: 'inline-block', flexShrink: 0 }} />
            <span style={{ font: 'var(--fw-medium) var(--text-body-sm)/1 var(--font-sans)', color: 'var(--text-body)', minWidth: 170 }}>{f.nome}</span>
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
