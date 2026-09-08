import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string
  hint?: string
  icon: ReactNode
}

export function StatCard({ label, value, hint, icon }: StatCardProps) {
  return (
    <div
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-sm)',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        minHeight: 110,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'var(--brand-soft)',
            color: 'var(--brand)',
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
          font: 'var(--fw-extrabold) 22px/1.1 var(--font-display)',
          color: 'var(--text-strong)',
        }}
      >
        {value}
      </span>
      {hint && (
        <span style={{ font: 'var(--fw-regular) var(--text-caption)/1.3 var(--font-sans)', color: 'var(--text-faint)' }}>
          {hint}
        </span>
      )}
    </div>
  )
}
