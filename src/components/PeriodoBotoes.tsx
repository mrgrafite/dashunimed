import type { PeriodoModo } from '../types'

interface PeriodoBotoesProps {
  modo: PeriodoModo
  meses: number
  inicio: string | null
  fim: string | null
  onChange: (modo: PeriodoModo, meses: number, inicio: string | null, fim: string | null) => void
  /** Limites da janela de 12 meses que o payload cobre. */
  dataMin: string
  dataMax: string
  /** Rotulos dos 12 meses da janela (payload.meses), mesmo indice de dataMin->dataMax. */
  rotulosMeses: string[]
}

const OPCOES_MESES = [3, 6, 12]

/** Indice (0-based) do mes de `iso` dentro da janela, contando a partir do mes de `dataMin`. */
function indiceDoMes(dataMin: string, iso: string): number {
  const [anoMin, mesMin] = dataMin.split('-').map(Number)
  const [ano, mes] = iso.split('-').map(Number)
  return (ano - anoMin) * 12 + (mes - mesMin)
}

/** ISO (primeiro dia) do mes de indice `idx` dentro da janela, a partir de `dataMin`. */
function dataDoIndice(dataMin: string, idx: number): string {
  const [anoMin, mesMin] = dataMin.split('-').map(Number)
  const d = new Date(Date.UTC(anoMin, mesMin - 1 + idx, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`
}

/** Mesmo estilo "botoes" ja usado em CustoFolhaTab.tsx (aprovado pelo cliente,
 * 2026-09-10) - reaproveitado aqui na aba Por Empresa em vez do dropdown de
 * PeriodoFilter.tsx (usado so pela aba Headcount). So 4 modos (3/6/12 meses +
 * Mes especifico) - "Ultimos 30 dias"/"Personalizado" ficaram de fora por decisao
 * do Marcelo (nenhuma tabela da aba Por Empresa usa granularidade diaria).
 * "Mes especifico" reaproveita o modo 'custom' com inicio===fim (mesma logica de
 * janela do App.tsx, ja validada) - so muda a apresentacao visual. */
export function PeriodoBotoes({ modo, meses, inicio, fim, onChange, dataMin, dataMax, rotulosMeses }: PeriodoBotoesProps) {
  const especifico = modo === 'custom' && inicio !== null && inicio === fim
  const idxEspecifico = especifico && inicio ? indiceDoMes(dataMin, inicio) : null

  function selecionarMeses(m: number) {
    onChange('meses', m, inicio, fim)
  }

  function selecionarEspecifico() {
    const dataAlvo = especifico && inicio ? inicio : dataDoIndice(dataMin, indiceDoMes(dataMin, dataMax))
    onChange('custom', meses, dataAlvo, dataAlvo)
  }

  function mudarMesEspecifico(idx: number) {
    const iso = dataDoIndice(dataMin, idx)
    onChange('custom', meses, iso, iso)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ font: 'var(--fw-medium) var(--text-caption)/1 var(--font-sans)', color: 'var(--text-muted)' }}>Período</span>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {OPCOES_MESES.map((m) => (
          <button
            key={m}
            onClick={() => selecionarMeses(m)}
            style={{
              height: 36, padding: '0 14px', borderRadius: 'var(--radius-control)',
              border: modo === 'meses' && meses === m ? '1px solid var(--brand)' : '1px solid var(--border-subtle)',
              background: modo === 'meses' && meses === m ? 'var(--brand-soft)' : 'var(--surface-card)',
              color: modo === 'meses' && meses === m ? 'var(--brand)' : 'var(--text-body)',
              font: 'var(--fw-medium) var(--text-body-sm)/1 var(--font-sans)', cursor: 'pointer',
            }}
          >
            {m} meses
          </button>
        ))}
        <button
          onClick={selecionarEspecifico}
          style={{
            height: 36, padding: '0 14px', borderRadius: 'var(--radius-control)',
            border: especifico ? '1px solid var(--brand)' : '1px solid var(--border-subtle)',
            background: especifico ? 'var(--brand-soft)' : 'var(--surface-card)',
            color: especifico ? 'var(--brand)' : 'var(--text-body)',
            font: 'var(--fw-medium) var(--text-body-sm)/1 var(--font-sans)', cursor: 'pointer',
          }}
        >
          Mês específico
        </button>
        {especifico && (
          <select
            value={idxEspecifico ?? ''}
            onChange={(e) => mudarMesEspecifico(Number(e.target.value))}
            style={{
              height: 36, padding: '0 10px', borderRadius: 'var(--radius-control)',
              border: '1px solid var(--border-subtle)', background: 'var(--surface-card)',
              color: 'var(--text-strong)', font: 'var(--fw-medium) var(--text-body-sm)/1 var(--font-sans)', cursor: 'pointer',
            }}
          >
            {rotulosMeses.map((r, i) => (
              <option key={r} value={i}>
                {r}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  )
}
