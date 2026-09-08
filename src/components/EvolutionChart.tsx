interface EvolutionChartProps {
  meses: string[]
  adm: number[]
  deslig: number[]
}

export function EvolutionChart({ meses, adm, deslig }: EvolutionChartProps) {
  const max = Math.max(1, ...adm, ...deslig)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, height: 180, overflowX: 'auto', padding: '4px 4px 0' }}>
      {meses.map((label, i) => (
        <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 130 }}>
            <div
              title={`Admissões: ${adm[i]}`}
              style={{ height: `${(adm[i] / max) * 100}%`, width: 9, background: 'var(--success)', borderRadius: '3px 3px 0 0' }}
            />
            <div
              title={`Desligamentos: ${deslig[i]}`}
              style={{ height: `${(deslig[i] / max) * 100}%`, width: 9, background: 'var(--danger)', borderRadius: '3px 3px 0 0' }}
            />
          </div>
          <span style={{ font: 'var(--fw-medium) var(--text-caption)/1 var(--font-sans)', color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}
