interface CustoChartAgrupadoProps {
  meses: string[]
  folha: number[]
  encargos: number[]
  beneficio: number[]
  rescisao: number[]
}

const CORES = { folha: 'var(--brand)', encargos: 'var(--azure-400)', beneficio: 'var(--success)', rescisao: 'var(--danger)' }

const brlCompacto = (n: number) => {
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `R$ ${(n / 1_000).toFixed(0)}mil`
  return `R$ ${n.toFixed(0)}`
}

export function CustoChartAgrupado({ meses, folha, encargos, beneficio, rescisao }: CustoChartAgrupadoProps) {
  const max = Math.max(1, ...folha, ...encargos, ...beneficio, ...rescisao)
  const alturaMax = 150

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, height: 200, overflowX: 'auto', padding: '4px 4px 0' }}>
      {meses.map((label, i) => (
        <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: alturaMax }}>
            {[
              ['Folha', folha[i], CORES.folha],
              ['Encargos', encargos[i], CORES.encargos],
              ['Benefícios', beneficio[i], CORES.beneficio],
              ['Rescisão', rescisao[i], CORES.rescisao],
            ].map(([nome, valor, cor]) => (
              <div
                key={nome as string}
                title={`${label} · ${nome}: ${brlCompacto(valor as number)}`}
                style={{ height: `${((valor as number) / max) * 100}%`, width: 7, background: cor as string, borderRadius: '2px 2px 0 0' }}
              />
            ))}
          </div>
          <span style={{ font: 'var(--fw-medium) var(--text-caption)/1 var(--font-sans)', color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}
