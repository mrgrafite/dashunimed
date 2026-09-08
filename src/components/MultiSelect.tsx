import { useEffect, useRef, useState } from 'react'

interface Option {
  value: string
  label: string
}

interface MultiSelectProps {
  label: string
  values: string[]
  options: Option[]
  onChange: (values: string[]) => void
  width?: number
  placeholderTodos: string
}

export function MultiSelect({ label, values, options, onChange, width = 180, placeholderTodos }: MultiSelectProps) {
  const [aberto, setAberto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickFora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', onClickFora)
    return () => document.removeEventListener('mousedown', onClickFora)
  }, [])

  const resumo = values.length === 0 ? placeholderTodos : values.length === 1 ? values[0] : `${values.length} selecionados`

  function toggle(value: string) {
    onChange(values.includes(value) ? values.filter((v) => v !== value) : [...values, value])
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 4, width }}>
      <span style={{ font: 'var(--fw-medium) var(--text-caption)/1 var(--font-sans)', color: 'var(--text-muted)' }}>{label}</span>
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        style={{
          height: 36,
          borderRadius: 'var(--radius-control)',
          border: '1px solid var(--border-subtle)',
          padding: '0 10px',
          font: 'var(--fw-regular) var(--text-body-sm)/1 var(--font-sans)',
          color: values.length ? 'var(--text-strong)' : 'var(--text-body)',
          background: 'var(--surface-card)',
          textAlign: 'left',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
          width: '100%',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{resumo}</span>
        <span style={{ color: 'var(--text-faint)', flexShrink: 0 }}>▾</span>
      </button>
      {aberto && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 4,
            zIndex: 20,
            background: 'var(--surface-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-control)',
            boxShadow: 'var(--shadow-md)',
            padding: 6,
            minWidth: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', font: 'var(--fw-medium) var(--text-body-sm)/1 var(--font-sans)', color: 'var(--text-body)' }}>
            <input type="checkbox" checked={values.length === 0} onChange={() => onChange([])} />
            {placeholderTodos}
          </label>
          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '2px 0' }} />
          {options.map((o) => (
            <label
              key={o.value}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', font: 'var(--fw-regular) var(--text-body-sm)/1 var(--font-sans)', color: 'var(--text-body)' }}
            >
              <input type="checkbox" checked={values.includes(o.value)} onChange={() => toggle(o.value)} />
              {o.label}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
