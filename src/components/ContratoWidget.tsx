const ORDEM = ['CLT', 'PJ', 'Estágio', 'Aprendiz', 'Diretor', 'Temporários', 'Outros'] as const
const CORES: Record<string, string> = {
  CLT: 'var(--brand)',
  PJ: 'var(--azure-400)',
  'Estágio': 'var(--neutral-300)',
  Aprendiz: 'var(--chart-5)',
  Diretor: 'var(--info)',
  'Temporários': 'var(--success)',
  Outros: 'var(--warning)',
}

export function ContratoWidget({ contratos, filtro }: { contratos: Record<string, number>; filtro: string[] }) {
  const total = ORDEM.reduce((s, k) => s + (contratos[k] || 0), 0) || 1
  let offset = 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ position: 'relative', height: 14, background: 'var(--surface-sunken)', borderRadius: 999, width: '100%', overflow: 'hidden' }}>
        {ORDEM.map((k) => {
          const pct = ((contratos[k] || 0) / total) * 100
          const dim = filtro.length > 0 && !filtro.includes(k)
          const style = { position: 'absolute' as const, left: `${offset}%`, width: `${pct}%`, top: 0, bottom: 0, background: CORES[k], opacity: dim ? 0.25 : 1 }
          offset += pct
          return <div key={k} style={style} />
        })}
      </div>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {ORDEM.map((k) => {
          const dim = filtro.length > 0 && !filtro.includes(k)
          const count = contratos[k] || 0
          return (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 7, opacity: dim ? 0.35 : 1 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: CORES[k], display: 'inline-block' }} />
              <span style={{ font: 'var(--fw-medium) var(--text-body-sm)/1 var(--font-sans)', color: 'var(--text-body)' }}>{k}</span>
              <span className="tabular" style={{ font: 'var(--fw-semibold) var(--text-body-sm)/1 var(--font-sans)', color: 'var(--text-strong)' }}>
                {count.toLocaleString('pt-BR')}
              </span>
              <span style={{ font: 'var(--fw-regular) var(--text-caption)/1 var(--font-sans)', color: 'var(--text-faint)' }}>
                ({((count / total) * 100).toFixed(0)}%)
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
