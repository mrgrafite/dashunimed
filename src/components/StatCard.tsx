import type { CSSProperties, ReactNode } from 'react'

export type StatTone = 'brand' | 'success' | 'danger' | 'warning' | 'info' | 'accent' | 'neutral'

const TONE_STYLE: Record<StatTone, { bg: string; fg: string }> = {
  brand: { bg: 'var(--brand-soft)', fg: 'var(--brand)' },
  success: { bg: 'var(--success-soft)', fg: 'var(--success)' },
  danger: { bg: 'var(--danger-soft)', fg: 'var(--danger)' },
  warning: { bg: 'var(--warning-soft)', fg: 'var(--warning-600)' },
  info: { bg: 'var(--info-soft)', fg: 'var(--info)' },
  accent: { bg: 'var(--accent-soft)', fg: 'var(--accent-hover)' },
  neutral: { bg: 'var(--surface-sunken)', fg: 'var(--text-muted)' },
}

export interface StatCardTrend {
  /** variação percentual (ex.: 3.2 ou -1.4) — sinal define seta/cor a menos que `invert` esteja setado */
  value: number
  label: string
  /** quando true, negativo é o resultado desejável (ex.: turnover, desligamentos) — inverte as cores */
  invert?: boolean
}

interface StatCardProps {
  label: string
  value: string
  hint?: string
  icon: ReactNode
  tone?: StatTone
  trend?: StatCardTrend
}

export function StatCard({ label, value, hint, icon, tone = 'brand', trend }: StatCardProps) {
  const toneStyle = TONE_STYLE[tone]
  const isGood = trend ? (trend.invert ? trend.value <= 0 : trend.value >= 0) : null
  const trendFg = isGood === null ? undefined : isGood ? 'var(--success)' : 'var(--danger)'
  const trendBg = isGood === null ? undefined : isGood ? 'var(--success-soft)' : 'var(--danger-soft)'
  const trendUp = trend ? trend.value >= 0 : null

  const cardStyle: CSSProperties = {
    background: 'var(--surface-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-card)',
    boxShadow: 'var(--shadow-sm)',
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    minHeight: 116,
    transition: 'var(--transition-colors), box-shadow 0.15s ease',
  }

  return (
    <div
      style={cardStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-md)'
        e.currentTarget.style.borderColor = 'var(--border-default)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
        e.currentTarget.style.borderColor = 'var(--border-subtle)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <span
          style={{
            font: 'var(--fw-medium) var(--text-body-sm)/1.3 var(--font-sans)',
            color: 'var(--text-muted)',
          }}
        >
          {label}
        </span>
        <span
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: toneStyle.bg,
            color: toneStyle.fg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </span>
      </div>

      <span
        className="tabular"
        style={{
          font: 'var(--fw-extrabold) 24px/1.1 var(--font-display)',
          letterSpacing: 'var(--tracking-tight)',
          color: 'var(--text-strong)',
        }}
      >
        {value}
      </span>

      {trend ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span
            className="tabular"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 8px',
              borderRadius: 999,
              background: trendBg,
              color: trendFg,
              font: 'var(--fw-semibold) var(--text-caption)/1.4 var(--font-sans)',
            }}
          >
            {trendUp ? '▲' : '▼'} {trend.value > 0 ? '+' : ''}
            {trend.value.toFixed(1)}%
          </span>
          <span style={{ font: 'var(--fw-regular) var(--text-caption)/1.3 var(--font-sans)', color: 'var(--text-faint)' }}>
            {trend.label}
          </span>
        </div>
      ) : (
        hint && (
          <span style={{ font: 'var(--fw-regular) var(--text-caption)/1.3 var(--font-sans)', color: 'var(--text-faint)' }}>
            {hint}
          </span>
        )
      )}
    </div>
  )
}
