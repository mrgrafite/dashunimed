interface Row {
  nome: string
  atual: number
  custo: number
  adm: number
  deslig: number
}

const brl = (n: number) => 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const num = (n: number) => n.toLocaleString('pt-BR')

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

export function EmpresaTable({ rows }: { rows: Row[] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={th}>Empresa</th>
          <th style={{ ...th, textAlign: 'right' }}>Colaboradores</th>
          <th style={{ ...th, textAlign: 'right' }}>Custo de folha</th>
          <th style={{ ...th, textAlign: 'right' }}>Admissões</th>
          <th style={{ ...th, textAlign: 'right' }}>Desligamentos</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.nome}>
            <td style={{ ...td, font: 'var(--fw-semibold) var(--text-body)/1.3 var(--font-sans)', color: 'var(--text-strong)' }}>{r.nome}</td>
            <td className="tabular" style={{ ...td, textAlign: 'right' }}>{num(r.atual)}</td>
            <td className="tabular" style={{ ...td, textAlign: 'right', fontWeight: 500, color: 'var(--text-strong)' }}>{brl(r.custo)}</td>
            <td className="tabular" style={{ ...td, textAlign: 'right', color: 'var(--success)' }}>+{num(r.adm)}</td>
            <td className="tabular" style={{ ...td, textAlign: 'right', color: 'var(--danger)' }}>-{num(r.deslig)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
