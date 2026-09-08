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

function variacaoMensal(valores: number[]): string {
  if (valores.length < 2) return ''
  const atual = valores[valores.length - 1]
  const anterior = valores[valores.length - 2]
  if (!anterior) return ''
  const pct = ((atual - anterior) / anterior) * 100
  const sinal = pct >= 0 ? '+' : ''
  return `${sinal}${pct.toFixed(1)}% vs mês anterior`
}

const OPCOES_MESES = [3, 6, 12]

export function CustoFolhaTab({ payload, provisaoPayload }: { payload: CustoFolhaPayload; provisaoPayload: ProvisaoPayload | null }) {
  const [empresaSel, setEmpresaSel] = useState<string[]>([])
  const [nMeses, setNMeses] = useState(12)
  const [tipoGrafico, setTipoGrafico] = useState<TipoGrafico>('empilhado')

  const empresaOptions = payload.empresas.map((e) => ({ value: e.id, label: e.nome }))
  const emps = payload.empresas.filter((e) => empresaSel.length === 0 || empresaSel.includes(e.id))

  const inicioJanela = Math.max(12 - nMeses, payload.primeiroMesComDado)
  const labels = payload.meses.slice(inicioJanela)
  const cobreturaLimitada = inicioJanela > 12 - nMeses

  const folha = new Array(labels.length).fill(0)
  const encargos = new Array(labels.length).fill(0)
  const beneficio = new Array(labels.length).fill(0)
  const rescisao = new Array(labels.length).fill(0)
  emps.forEach((e) => {
    e.historico.folha.slice(inicioJanela).forEach((v, i) => (folha[i] += v))
    e.historico.encargos.slice(inicioJanela).forEach((v, i) => (encargos[i] += v))
    e.historico.beneficio.slice(inicioJanela).forEach((v, i) => (beneficio[i] += v))
    e.historico.rescisao.slice(inicioJanela).forEach((v, i) => (rescisao[i] += v))
  })

  const totalFolha = folha.reduce((s, v) => s + v, 0)
  const totalEncargos = encargos.reduce((s, v) => s + v, 0)
  const totalBeneficio = beneficio.reduce((s, v) => s + v, 0)
  const totalRescisao = rescisao.reduce((s, v) => s + v, 0)
  const totalGeral = totalFolha + totalEncargos + totalBeneficio + totalRescisao

  const clcMap = new Map<string, number>()
  emps.forEach((e) =>
    e.clc.forEach((c) => {
      const soma = c.valores.slice(inicioJanela).reduce((s, v) => s + v, 0)
      clcMap.set(c.nome, (clcMap.get(c.nome) ?? 0) + soma)
    })
  )
  const clcList = [...clcMap.entries()].map(([nome, valor]) => ({ nome, valor })).sort((a, b) => b.valor - a.valor)
  const maxClc = Math.max(1, ...clcList.map((c) => c.valor))

  // Provisao de Ferias/13o/PLR (pedido 2026-09-08, resolvido com a chegada de
  // bronze_rhp_r146prv) - fonte separada do custo_folha, cobre os 12 meses completos (sem o
  // corte de Jan/2026 que a silver tem), por isso usa `payload.meses` (nao `labels`, que ja
  // vem cortado por `primeiroMesComDado` do custo). `sldatu` e saldo acumulado (ponto no
  // tempo) - o "saldo atual" do KPI usa so o ULTIMO mes da janela, nao soma.
  const labelsProvisao = payload.meses.slice(12 - nMeses)
  const empsProvisao = (provisaoPayload?.empresas ?? []).filter((e) => empresaSel.length === 0 || empresaSel.includes(e.id))
  const tipos = provisaoPayload?.tipos ?? []
  const saldoPorTipoMensal = new Map<string, number[]>()
  tipos.forEach((tipo) => {
    const serie = new Array(labelsProvisao.length).fill(0)
    empsProvisao.forEach((e) => {
      e.provisao[tipo]?.sldatu.slice(12 - nMeses).forEach((v, i) => (serie[i] += v))
    })
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
          <div style={{ display: 'flex', gap: 6 }}>
            {OPCOES_MESES.map((m) => (
              <button
                key={m}
                onClick={() => setNMeses(m)}
                style={{
                  height: 36, padding: '0 14px', borderRadius: 'var(--radius-control)',
                  border: m === nMeses ? '1px solid var(--brand)' : '1px solid var(--border-subtle)',
                  background: m === nMeses ? 'var(--brand-soft)' : 'var(--surface-card)',
                  color: m === nMeses ? 'var(--brand)' : 'var(--text-body)',
                  font: 'var(--fw-medium) var(--text-body-sm)/1 var(--font-sans)', cursor: 'pointer',
                }}
              >
                {m} meses
              </button>
            ))}
          </div>
        </div>
      </div>

      {cobreturaLimitada && (
        <div style={{ font: 'var(--fw-medium) var(--text-body-sm)/1.4 var(--font-sans)', color: 'var(--warning)', background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-card)', padding: '10px 16px' }}>
          Dado de custo de folha só está disponível a partir de {payload.meses[payload.primeiroMesComDado]} — período ajustado automaticamente.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <StatCard label="Custo de folha" value={brl(totalFolha)} hint={variacaoMensal(folha)} icon={<Wallet size={18} strokeWidth={1.75} />} />
        <StatCard label="Encargos" value={brl(totalEncargos)} hint={variacaoMensal(encargos)} icon={<Landmark size={18} strokeWidth={1.75} />} />
        <StatCard label="Benefícios" value={brl(totalBeneficio)} hint={variacaoMensal(beneficio)} icon={<HeartHandshake size={18} strokeWidth={1.75} />} />
        <StatCard label="Rescisão" value={brl(totalRescisao)} hint={variacaoMensal(rescisao)} icon={<DoorOpen size={18} strokeWidth={1.75} />} />
      </div>

      <Card
        title="Custo total de pessoal"
        subtitle={`${labels.length} meses · Folha + Encargos + Benefícios + Rescisão · fonte: folha de pagamento (silver), deduplicado`}
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

      <Card title="Custo de folha por classificação (CLC)" subtitle={`${labels.length} meses · só dentro de "Folha" (a categoria com detalhamento mais rico) — ver Encargos/Benefícios/Rescisão nos KPIs acima`}>
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
            subtitle={`${labelsProvisao.length} meses · saldo acumulado (não é custo mensal, é o passivo provisionado) · fonte: bronze_rhp_r146prv, módulo de Provisão`}
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
