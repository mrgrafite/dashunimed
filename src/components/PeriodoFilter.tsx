import { useEffect, useRef, useState } from 'react'
import type { PeriodoModo } from '../types'

interface PeriodoFilterProps {
  modo: PeriodoModo
  meses: number
  inicio: string | null
  fim: string | null
  onChange: (modo: PeriodoModo, meses: number, inicio: string | null, fim: string | null) => void
  width?: number
  /** Limites da janela de 12 meses que o payload cobre - fora disso nao ha dado pra responder. */
  dataMin: string
  dataMax: string
}

const fmtBr = (iso: string) => {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

const OPCOES_MESES = [3, 6, 12]

export function PeriodoFilter({ modo, meses, inicio, fim, onChange, width = 190, dataMin, dataMax }: PeriodoFilterProps) {
  const [aberto, setAberto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickFora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', onClickFora)
    return () => document.removeEventListener('mousedown', onClickFora)
  }, [])

  const resumo =
    modo === 'meses' ? `Últimos ${meses} meses` : modo === '30dias' ? 'Últimos 30 dias' : inicio && fim ? `${fmtBr(inicio)} — ${fmtBr(fim)}` : 'Personalizado'

  function selecionarMeses(m: number) {
    onChange('meses', m, inicio, fim)
  }

  function selecionar30Dias() {
    onChange('30dias', meses, inicio, fim)
  }

  function selecionarCustom() {
    // Comeca no ultimo mes COM DADO (dataMax), nao em "hoje" - o payload e fechado por
    // competencia e o mes corrente normalmente ainda nao entrou nele.
    const fimPadrao = fim ?? dataMax
    const trintaDiasAntes = new Date(new Date(fimPadrao).getTime() - 29 * 86400000).toISOString().slice(0, 10)
    const inicioPadrao = inicio ?? (trintaDiasAntes < dataMin ? dataMin : trintaDiasAntes)
    onChange('custom', meses, inicioPadrao, fimPadrao)
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 4, width }}>
      <span style={{ font: 'var(--fw-medium) var(--text-caption)/1 var(--font-sans)', color: 'var(--text-muted)' }}>Período</span>
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        style={{
          height: 36,
          borderRadius: 'var(--radius-control)',
          border: '1px solid var(--border-subtle)',
          padding: '0 10px',
          font: 'var(--fw-regular) var(--text-body-sm)/1 var(--font-sans)',
          color: 'var(--text-strong)',
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
            minWidth: 240,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {OPCOES_MESES.map((m) => (
            <label
              key={m}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', font: 'var(--fw-medium) var(--text-body-sm)/1 var(--font-sans)', color: 'var(--text-body)' }}
            >
              <input type="radio" name="periodo-modo" checked={modo === 'meses' && meses === m} onChange={() => selecionarMeses(m)} />
              Últimos {m} meses
            </label>
          ))}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', font: 'var(--fw-medium) var(--text-body-sm)/1 var(--font-sans)', color: 'var(--text-body)' }}>
            <input type="radio" name="periodo-modo" checked={modo === '30dias'} onChange={selecionar30Dias} />
            Últimos 30 dias
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', font: 'var(--fw-medium) var(--text-body-sm)/1 var(--font-sans)', color: 'var(--text-body)' }}>
            <input type="radio" name="periodo-modo" checked={modo === 'custom'} onChange={selecionarCustom} />
            Personalizado
          </label>
          {modo === 'custom' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 8px 4px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 3, font: 'var(--fw-medium) var(--text-caption)/1 var(--font-sans)', color: 'var(--text-muted)' }}>
                De
                <input
                  type="date"
                  value={inicio ?? ''}
                  min={dataMin}
                  max={fim ?? dataMax}
                  onChange={(e) => onChange('custom', meses, e.target.value, fim)}
                  style={{ height: 30, borderRadius: 'var(--radius-control)', border: '1px solid var(--border-subtle)', padding: '0 8px', font: 'var(--fw-regular) var(--text-body-sm)/1 var(--font-sans)' }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 3, font: 'var(--fw-medium) var(--text-caption)/1 var(--font-sans)', color: 'var(--text-muted)' }}>
                Até
                <input
                  type="date"
                  value={fim ?? ''}
                  min={inicio ?? dataMin}
                  max={dataMax}
                  onChange={(e) => onChange('custom', meses, inicio, e.target.value)}
                  style={{ height: 30, borderRadius: 'var(--radius-control)', border: '1px solid var(--border-subtle)', padding: '0 8px', font: 'var(--fw-regular) var(--text-body-sm)/1 var(--font-sans)' }}
                />
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
