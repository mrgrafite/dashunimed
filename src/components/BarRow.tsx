interface BarRowProps {
  label: string
  valueLabel: string
  fraction: number
  height?: number
  color?: string
  markerFraction?: number
}

export function BarRow({ label, valueLabel, fraction, height = 8, color = 'var(--brand)', markerFraction }: BarRowProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ font: 'var(--fw-medium) var(--text-body-sm)/1.3 var(--font-sans)', color: 'var(--text-body)' }}>
          {label}
        </span>
        <span className="tabular" style={{ font: 'var(--fw-semibold) var(--text-body-sm)/1.3 var(--font-sans)', color: 'var(--text-strong)' }}>
          {valueLabel}
        </span>
      </div>
      <div style={{ position: 'relative', height, background: 'var(--surface-sunken)', borderRadius: 999, width: '100%' }}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${Math.min(fraction, 1) * 100}%`,
            background: color,
            borderRadius: 999,
          }}
        />
        {markerFraction != null && (
          <div
            style={{
              position: 'absolute',
              left: `${Math.min(markerFraction, 1) * 100}%`,
              top: -4,
              bottom: -4,
              width: 2,
              background: 'var(--text-muted)',
            }}
          />
        )}
      </div>
    </div>
  )
}
