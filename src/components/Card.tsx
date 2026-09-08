import type { ReactNode } from 'react'

interface CardProps {
  title: string
  subtitle?: ReactNode
  right?: ReactNode
  children: ReactNode
  bodyPadding?: string
}

export function Card({ title, subtitle, right, children, bodyPadding = '18px 20px' }: CardProps) {
  return (
    <div
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ font: 'var(--fw-semibold) var(--text-h4)/1.3 var(--font-display)', color: 'var(--text-strong)' }}>
            {title}
          </span>
          {subtitle && (
            <span style={{ font: 'var(--fw-regular) var(--text-body-sm)/1.4 var(--font-sans)', color: 'var(--text-muted)' }}>
              {subtitle}
            </span>
          )}
        </div>
        {right}
      </div>
      <div style={{ padding: bodyPadding }}>{children}</div>
    </div>
  )
}
