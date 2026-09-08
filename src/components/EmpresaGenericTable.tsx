import type { ReactNode } from 'react'

export interface ColunaTabela<T> {
  header: string
  align?: 'left' | 'right'
  render: (row: T) => ReactNode
}

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 20px',
  font: 'var(--fw-semibold) var(--text-overline)/1 var(--font-sans)',
  letterSpacing: 'var(--tracking-wide)',
  textTransform: 'uppercase',
  color: 'var(--text-faint)',
  borderBottom: '1px solid var(--border-subtle)',
}
const td: React.CSSProperties = {
  padding: '12px 20px',
  borderBottom: '1px solid var(--border-subtle)',
  font: 'var(--fw-regular) var(--text-body-sm)/1.4 var(--font-sans)',
  color: 'var(--text-body)',
}

/** Tabela "por empresa" generica - mesmo visual da tabela original ("Por empresa / cliente"),
 * mas com colunas configuraveis - reaproveitar pra qualquer novo card que precise da mesma
 * quebra por empresa/periodo (pedido do Marcelo, 2026-09-06). */
export function EmpresaGenericTable<T extends { nome: string }>({ rows, colunas }: { rows: T[]; colunas: ColunaTabela<T>[] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={th}>Empresa</th>
          {colunas.map((c) => (
            <th key={c.header} style={{ ...th, textAlign: c.align ?? 'right' }}>
              {c.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.nome}>
            <td style={{ ...td, font: 'var(--fw-semibold) var(--text-body)/1.3 var(--font-sans)', color: 'var(--text-strong)' }}>{r.nome}</td>
            {colunas.map((c) => (
              <td key={c.header} className="tabular" style={{ ...td, textAlign: c.align ?? 'right' }}>
                {c.render(r)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
