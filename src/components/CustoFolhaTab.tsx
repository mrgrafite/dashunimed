import { useState } from 'react'
import { Wallet, Landmark, HeartHandshake, DoorOpen, PiggyBank } from 'lucide-react'
import { StatCard } from './StatCard'
import { Card } from './Card'
import { BarRow } from './BarRow'
import { CustoChart } from './CustoChart'
import { CustoChartLinhas } from './CustoChartLinhas'
import { CustoChartAgrupado } from './CustoChartAgrupado'
import { CustoChartRosca } from './CustoChartRosca'
import { ProvisaoChart } from './ProvisaoChart'
import { MultiSelect } from './MultiSelect'
import type { CustoFolhaPayload, ProvisaoPayload } from '../types'

const CORES_PROVISAO = ['var(--brand)', 'var(--danger)', 'var(--success)', 'var(--azure-400)', 'var(--info)']

type TipoGrafico = 'empilhado' | 'linhas' | 'agrupado' | 'rosca'
const OPCOES_GRAFICO: [TipoGrafico, string][] = [
  ['empilhado', 'Barras empilhadas'],
  ['linhas', 'Linhas'],
  ['agrupado', 'Barras agrupadas'],
  ['rosca', 'Rosca (% do período)'],
]

const brl = (n: number) => 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const OPCOES_MESES = [3, 6, 12]
type ModoPeriodo = 'meses' | 'especifico'

export function CustoFolhaTab({ payload, provisaoPayload }: { payload: CustoFolhaPayload; provisaoPayload: ProvisaoPayload | null }) {
  const [empresaSel, setEmpresaSel] = useState<string[]>([])
  const [nMeses, setNMeses] = useState(12)
  const [modoPeriodo, setModoPeriodo] = useState<ModoPeriodo>('meses')
  const [mesEspecificoIdx, setMesEspecificoIdx] = useState(payload.meses.length - 1)
  const [tipoGrafico, setTipoGrafico] = useState<TipoGrafico>('empilhado')

  const empresaOptions = payload.empresas.map((e) => ({ value: e.id, label: e.nome }))
  const emps = payload.empresas.filter((e) => empresaSel.length === 0 || empresaSel.includes(e.id))

  // "Mes especifico" (pedido do Marcelo 2026-09-08, 4a opcao de Periodo): reduz a janela a
  // 1 unico indice (mesEspecificoIdx) em vez de uma faixa de N meses - todo o resto da aba
  // (KPIs, grafico, CLC, Provisao) usa os MESMOS `indices` computados aqui, entao passa a
  // refletir so aquele mes automaticamente.
  const inicioJanela = Math.max(12 - nMeses, payload.primeiroMesComDado)
  const indices = modoPeriodo === 'especifico' ? [mesEspecificoIdx] : Array.from({ length: Math.max(0, 12 - inicioJanela) }, (_, i) => inicioJanela + i)
  const labels = indices.map((i) => payload.meses[i])
  const cobreturaLimitada = modoPeriodo === 'meses' && inicioJanela > 12 - nMeses
  const semDadoMesEspecifico = modoPeriodo === 'especifico' && mesEspecificoIdx < payload.primeiroMesComDado

  const totalNoIndice = (campo: 'folha' | 'encargos' | 'beneficio' | 'rescisao', idx: number) =>
    idx < 0 ? 0 : emps.reduce((s, e) => s + e.historico[campo][idx], 0)

  const folha = indices.map((idx) => emps.reduce((s, e) => s + e.historico.folha[idx], 0))
  const encargos = indices.map((idx) => emps.reduce((s, e) => s + e.historico.encargos[idx], 0))
  const beneficio = indices.map((idx) => emps.reduce((s, e) => s + e.historico.beneficio[idx], 0))
  const rescisao = indices.map((idx) => emps.reduce((s, e) => s + e.historico.rescisao[idx], 0))

  const totalFolha = folha.reduce((s, v) => s + v, 0)
  const totalEncargos = encargos.reduce((s, v) => s + v, 0)
  const totalBeneficio = beneficio.reduce((s, v) => s + v, 0)
  const totalRescisao = rescisao.reduce((s, v) => s + v, 0)
  const totalGeral = totalFolha + totalEncargos + totalBeneficio + totalRescisao

  // Variacao "vs mes anterior" compara sempre o ULTIMO mes da selecao contra o mes
  // imediatamente antes dele no calendario (nao contra o inicio da janela) - assim funciona
  // igual em qualquer tamanho de janela, inclusive no modo "mes especifico" (1 so indice).
  const idxUltimo = indices[indices.length - 1] ?? -1
  const idxAnterior = idxUltimo - 1
  const variacao = (campo: 'folha' | 'encargos' | 'beneficio' | 'rescisao') => {
    const atual = totalNoIndice(campo, idxUltimo)
    const anterior = totalNoIndice(campo, idxAnterior)
    if (!anterior) return ''
    const pct = ((atual - anterior) / anterior) * 100
    const sinal = pct >= 0 ? '+' : ''
    return `${sinal}${pct.toFixed(1)}% vs mês anterior`
  }

  // CLC vem da contabilizacao real (bronze_rhp_r048ctb), que cobre os 12 meses cheios -
  // ao contrario de folha/encargos/beneficio/rescisao (silver, so a partir de Jan/2026),
  // por isso usa os mesmos `indices` (ja sem o corte de `inicioJanela`/`primeiroMesComDado`
  // no modo "meses", e o mesmo mes unico no modo "especifico").
  const indicesClc = modoPeriodo === 'especifico' ? [mesEspecificoIdx] : Array.from({ length: nMeses }, (_, i) => 12 - nMeses + i)
  const clcMap = new Map<string, number>()
  emps.forEach((e) =>
    e.clc.forEach((c) => {
      const soma = indicesClc.reduce((s, idx) => s + c.valores[idx], 0)
      clcMap.set(c.nome, (clcMap.get(c.nome) ?? 0) + soma)
    })
  )
  const clcList = [...clcMap.entries()].map(([nome, valor]) => ({ nome, valor })).sort((a, b) => b.valor - a.valor)
  const maxClc = Math.max(1, ...clcList.map((c) => c.valor))

  // Provisao de Ferias/13o/PLR (pedido 2026-09-08, resolvido com a chegada de
  // bronze_rhp_r146prv) - fonte separada do custo_folha, cobre os 12 meses completos (sem o
  // corte de Jan/2026 que a silver tem), por isso usa os mesmos `indicesClc` (mesma logica de
  // janela cheia). `sldatu` e saldo acumulado (ponto no tempo) - o "saldo atual" do KPI usa
  // so o ULTIMO mes da janela (ou o mes especifico escolhido), nunca soma.
  const labelsProvisao = indicesClc.map((i) => payload.meses[i])
  const empsProvisao = (provisaoPayload?.empresas ?? []).filter((e) => empresaSel.length === 0 || empresaSel.includes(e.id))
  const tipos = provisaoPayload?.tipos ?? []
  const saldoPorTipoMensal = new Map<string, number[]>()
  tipos.forEach((tipo) => {
    const serie = indicesClc.map((idx) => empsProvisao.reduce((s, e) => s + (e.provisao[tipo]?.sldatu[idx] ?? 0), 0))
    saldoPorTipoMensal.set(tipo, serie)
  })
  const saldoAtualPorTipo = new Map<string, number>()
  tipos.forEach((tipo) => {
    const serie = saldoPorTipoMensal.get(tipo) ?? []
    saldoAtualPorTipo.set(tipo, serie.length ? serie[serie.length - 1] : 0)
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-sm)', padding: '16px 20px', display: 'flex', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap' }}>
        <MultiSelect label="Empresa" values={empresaSel} options={empresaOptions} onChange={setEmpresaSel} width={220} placeholderTodos="Todas as empresas" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ font: 'var(--fw-medium) var(--text-caption)/1 var(--font-sans)', color: 'var(--text-muted)' }}>Período</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {OPCOES_MESES.map((m) => (
              <button
                key={m}
                onClick={() => {
                  setModoPeriodo('meses')
                  setNMeses(m)
                }}
                style={{
                  height: 36, padding: '0 14px', borderRadius: 'var(--radius-control)',
                  border: modoPeriodo === 'meses' && m === nMeses ? '1px solid var(--brand)' : '1px solid var(--border-subtle)',
                  background: modoPeriodo === 'meses' && m === nMeses ? 'var(--brand-soft)' : 'var(--surface-card)',
                  color: modoPeriodo === 'meses' && m === nMeses ? 'var(--brand)' : 'var(--text-body)',
                  font: 'var(--fw-medium) var(--text-body-sm)/1 var(--font-sans)', cursor: 'pointer',
                }}
              >
                {m} meses
              </button>
            ))}
            <button
              onClick={() => setModoPeriodo('especifico')}
              style={{
                height: 36, padding: '0 14px', borderRadius: 'var(--radius-control)',
                border: modoPeriodo === 'especifico' ? '1px solid var(--brand)' : '1px solid var(--border-subtle)',
                background: modoPeriodo === 'especifico' ? 'var(--brand-soft)' : 'var(--surface-card)',
                color: modoPeriodo === 'especifico' ? 'var(--brand)' : 'var(--text-body)',
                font: 'var(--fw-medium) var(--text-body-sm)/1 var(--font-sans)', cursor: 'pointer',
              }}
            >
              Mês específico
            </button>
            {modoPeriodo === 'especifico' && (
              <select
                value={mesEspecificoIdx}
                onChange={(e) => setMesEspecificoIdx(Number(e.target.value))}
                style={{
                  height: 36, padding: '0 10px', borderRadius: 'var(--radius-control)',
                  border: '1px solid var(--border-subtle)', background: 'var(--surface-card)',
                  color: 'var(--text-strong)', font: 'var(--fw-medium) var(--text-body-sm)/1 var(--font-sans)', cursor: 'pointer',
                }}
              >
                {payload.meses.map((m, i) => (
                  <option key={m} value={i}>
                    {m}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {cobreturaLimitada && (
        <div style={{ font: 'var(--fw-medium) var(--text-body-sm)/1.4 var(--font-sans)', color: 'var(--warning)', background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-card)', padding: '10px 16px' }}>
          Dado de custo de folha só está disponível a partir de {payload.meses[payload.primeiroMesComDado]} — período ajustado automaticamente.
        </div>
      )}
      {semDadoMesEspecifico && (
        <div style={{ font: 'var(--fw-medium) var(--text-body-sm)/1.4 var(--font-sans)', color: 'var(--warning)', background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-card)', padding: '10px 16px' }}>
          Custo de folha (Folha/Encargos/Benefícios/Rescisão) sem dado para {payload.meses[mesEspecificoIdx]} — a fonte só cobre a partir de {payload.meses[payload.primeiroMesComDado]}. A quebra por CLC abaixo cobre esse mês normalmente (fonte diferente).
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <StatCard label="Custo de folha" value={brl(totalFolha)} hint={variacao('folha')} icon={<Wallet size={18} strokeWidth={1.75} />} />
        <StatCard label="Encargos" value={brl(totalEncargos)} hint={variacao('encargos')} icon={<Landmark size={18} strokeWidth={1.75} />} />
        <StatCard label="Benefícios" value={brl(totalBeneficio)} hint={variacao('beneficio')} icon={<HeartHandshake size={18} strokeWidth={1.75} />} />
        <StatCard label="Rescisão" value={brl(totalRescisao)} hint={variacao('rescisao')} icon={<DoorOpen size={18} strokeWidth={1.75} />} />
      </div>

      <Card
        title="Custo total de pessoal"
        subtitle={`${modoPeriodo === 'especifico' ? `referência: ${payload.meses[mesEspecificoIdx]}` : `${labels.length} meses`} · Folha + Encargos + Benefícios + Rescisão · fonte: folha de pagamento (silver), deduplicado`}
        right={
          <span style={{ font: 'var(--fw-medium) var(--text-body-sm)/1 var(--font-sans)', color: 'var(--text-muted)' }}>
            Total do período · <span className="tabular" style={{ color: 'var(--text-strong)', fontWeight: 600 }}>{brl(totalGeral)}</span>
          </span>
        }
      >
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {OPCOES_GRAFICO.map(([valor, rotulo]) => (
            <button
              key={valor}
              onClick={() => setTipoGrafico(valor)}
              style={{
                height: 32, padding: '0 12px', borderRadius: 'var(--radius-control)',
                border: valor === tipoGrafico ? '1px solid var(--brand)' : '1px solid var(--border-subtle)',
                background: valor === tipoGrafico ? 'var(--brand-soft)' : 'var(--surface-card)',
                color: valor === tipoGrafico ? 'var(--brand)' : 'var(--text-body)',
                font: 'var(--fw-medium) var(--text-caption)/1 var(--font-sans)', cursor: 'pointer',
              }}
            >
              {rotulo}
            </button>
          ))}
        </div>

        {tipoGrafico === 'empilhado' && <CustoChart meses={labels} folha={folha} encargos={encargos} beneficio={beneficio} rescisao={rescisao} />}
        {tipoGrafico === 'linhas' && <CustoChartLinhas meses={labels} folha={folha} encargos={encargos} beneficio={beneficio} rescisao={rescisao} />}
        {tipoGrafico === 'agrupado' && <CustoChartAgrupado meses={labels} folha={folha} encargos={encargos} beneficio={beneficio} rescisao={rescisao} />}
        {tipoGrafico === 'rosca' && <CustoChartRosca folha={totalFolha} encargos={totalEncargos} beneficio={totalBeneficio} rescisao={totalRescisao} />}

        {tipoGrafico !== 'rosca' && (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12 }}>
            {[
              ['Folha', 'var(--brand)'],
              ['Encargos', 'var(--azure-400)'],
              ['Benefícios', 'var(--success)'],
              ['Rescisão', 'var(--danger)'],
            ].map(([label, cor]) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--fw-medium) var(--text-body-sm)/1 var(--font-sans)', color: 'var(--text-muted)' }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: cor, display: 'inline-block' }} />
                {label}
              </span>
            ))}
          </div>
        )}
      </Card>

      <Card title="Custo de folha por classificação (CLC)" subtitle={`${modoPeriodo === 'especifico' ? `referência: ${payload.meses[mesEspecificoIdx]}` : `${nMeses} meses`} · contabilização real (lançamentos a débito) · fonte: bronze_rhp_r048ctb + r048clc`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 480, overflow: 'auto' }}>
          {clcList.map((c) => (
            <BarRow key={c.nome} label={c.nome} valueLabel={brl(c.valor)} fraction={c.valor / maxClc} />
          ))}
          {clcList.length === 0 && <span style={{ color: 'var(--text-muted)' }}>Sem dados para o período/empresa selecionados.</span>}
        </div>
      </Card>

      {tipos.length > 0 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${tipos.length}, 1fr)`, gap: 16 }}>
            {tipos.map((tipo, i) => (
              <StatCard
                key={tipo}
                label={`Provisão · ${tipo}`}
                value={brl(saldoAtualPorTipo.get(tipo) ?? 0)}
                hint={`saldo em ${labelsProvisao[labelsProvisao.length - 1] ?? ''}`}
                icon={<PiggyBank size={18} strokeWidth={1.75} color={CORES_PROVISAO[i % CORES_PROVISAO.length]} />}
              />
            ))}
          </div>

          <Card
            title="Provisão de Férias/13º/PLR"
            subtitle={`${modoPeriodo === 'especifico' ? `referência: ${payload.meses[mesEspecificoIdx]}` : `${labelsProvisao.length} meses`} · saldo acumulado (não é custo mensal, é o passivo provisionado) · fonte: bronze_rhp_r146prv, módulo de Provisão`}
          >
            <ProvisaoChart
              meses={labelsProvisao}
              series={tipos.map((tipo, i) => ({ nome: tipo, valores: saldoPorTipoMensal.get(tipo) ?? [], cor: CORES_PROVISAO[i % CORES_PROVISAO.length] }))}
            />
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12 }}>
              {tipos.map((tipo, i) => (
                <span key={tipo} style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--fw-medium) var(--text-body-sm)/1 var(--font-sans)', color: 'var(--text-muted)' }}>
                  <span style={{ width: 9, height: 9, borderRadius: 2, background: CORES_PROVISAO[i % CORES_PROVISAO.length], display: 'inline-block' }} />
                  {tipo}
                </span>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
