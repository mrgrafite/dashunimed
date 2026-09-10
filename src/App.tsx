import { useEffect, useMemo, useState } from 'react'
import { Download, X, Users, Wallet, UserPlus, UserMinus, CalendarClock, Thermometer, Gauge, Repeat, LogOut, UserX } from 'lucide-react'
import { StatCard } from './components/StatCard'
import { Card } from './components/Card'
import { BarRow } from './components/BarRow'
import { EvolutionChart } from './components/EvolutionChart'
import { AbsenteeismoChart } from './components/AbsenteeismoChart'
import { AfastamentosChart } from './components/AfastamentosChart'
import { EmpresaTable } from './components/EmpresaTable'
import { EmpresaGenericTable } from './components/EmpresaGenericTable'
import { ContratoWidget } from './components/ContratoWidget'
import { MultiSelect } from './components/MultiSelect'
import { PeriodoFilter } from './components/PeriodoFilter'
import { PeriodoBotoes } from './components/PeriodoBotoes'
import { CustoFolhaTab } from './components/CustoFolhaTab'
import type { Payload, Filters, Colaborador, Empresa, EventoContrato, CustoFolhaPayload, ProvisaoPayload } from './types'

const num = (n: number) => n.toLocaleString('pt-BR')
const brl = (n: number) => 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const FILTROS_PADRAO: Filters = {
  empresa: [], departamento: [], contrato: [], localizacao: [],
  periodoModo: 'meses', periodoMeses: 12, periodoInicio: null, periodoFim: null,
}

const MS_POR_DIA = 86400000

/** As 12 competencias ('AAAA-MM') da janela do payload, da mais antiga pra mais recente -
 * derivadas de `payload.competencia` (o ULTIMO mes). Alinhadas por indice com `payload.meses`
 * e com todos os arrays de 12 posicoes em `historico.*`. */
function competenciasDoPayload(ultimaCompetencia: string): string[] {
  const [ano, mes] = ultimaCompetencia.split('-').map(Number)
  const lista: string[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(ano, mes - 1 - i, 1))
    lista.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`)
  }
  return lista
}

/** Posicao do mes na janela de 12: -1 se for antes do primeiro, 12 se for depois do ultimo. */
function posicaoDaCompetencia(competencias: string[], comp: string): number {
  if (comp < competencias[0]) return -1
  if (comp > competencias[competencias.length - 1]) return competencias.length
  return competencias.indexOf(comp)
}

/** Recorte [ini, fim] (indices nos 12 meses) que a janela de datas cobre, com clamp na borda.
 * ANTES (bug reportado pelo Marcelo, 2026-09-09) todo widget mensal fatiava `slice(janela.ini, janela.fim + 1)`,
 * ou seja, sempre os ULTIMOS n meses - no modo Personalizado a data escolhida so mudava a
 * QUANTIDADE de meses, nunca QUAIS: dois recortes de mesmo tamanho em meses diferentes
 * mostravam exatamente os mesmos numeros. */
function janelaDeDatas(competencias: string[], inicio: string, fim: string): { ini: number; fim: number } {
  const ultimo = competencias.length - 1
  const brutoIni = posicaoDaCompetencia(competencias, inicio.slice(0, 7))
  const brutoFim = posicaoDaCompetencia(competencias, fim.slice(0, 7))
  const ini = Math.min(ultimo, Math.max(0, brutoIni))
  const fimIdx = Math.max(0, Math.min(ultimo, brutoFim))
  return { ini: Math.min(ini, fimIdx), fim: Math.max(ini, fimIdx) }
}

/** Todo filtro vazio ([]) significa "todos" - sem restricao nessa dimensao. */
function combina(valorSelecionado: string[], valor: string): boolean {
  return valorSelecionado.length === 0 || valorSelecionado.includes(valor)
}

/** Filtra a lista de colaboradores (bronze, aproximado) por Departamento/Contrato/Localizacao,
 * ignorando as dimensoes passadas em `ignorar` — usado pra cada widget nao se autofiltrar
 * pela propria dimensao, mas reagir as outras (é isso que deixa os 4 widgets cruzaveis). */
function filtrarColaboradores(
  pessoas: Colaborador[],
  filters: Filters,
  ignorar: Array<'departamento' | 'contrato' | 'localizacao'>
): Colaborador[] {
  return pessoas.filter((p) => {
    if (!ignorar.includes('departamento') && !combina(filters.departamento, p.centroCusto)) return false
    if (!ignorar.includes('contrato') && !combina(filters.contrato, p.contrato)) return false
    if (!ignorar.includes('localizacao') && !combina(filters.localizacao, p.filial)) return false
    return true
  })
}

function App() {
  const [aba, setAba] = useState<'headcount' | 'custo' | 'porEmpresa'>('headcount')
  const [payload, setPayload] = useState<Payload | null>(null)
  const [custoPayload, setCustoPayload] = useState<CustoFolhaPayload | null>(null)
  const [provisaoPayload, setProvisaoPayload] = useState<ProvisaoPayload | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>(FILTROS_PADRAO)

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}empresas.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(setPayload)
      .catch((e) => setErro(String(e)))

    fetch(`${import.meta.env.BASE_URL}custo_folha.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(setCustoPayload)
      .catch(() => {})

    fetch(`${import.meta.env.BASE_URL}provisao.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(setProvisaoPayload)
      .catch(() => {})
  }, [])

  const derivado = useMemo(() => {
    if (!payload) return null
    const empresas = payload.empresas
    const emps = empresas.filter((e) => combina(filters.empresa, e.id))

    // Periodo tem 3 modos (ver PeriodoModo em types.ts): preset em meses (como sempre foi),
    // "30 dias" ou "personalizado" (dia exato). Os 2 ultimos so tem granularidade diaria de
    // verdade pra admissoes (ver admissoesEventos abaixo) - pros widgets so-mensais
    // (desligamentos/grafico/tabela "Por empresa") a janela e arredondada pros meses que o
    // recorte cobre, mas agora respeitando QUAIS meses sao (ver janelaDeDatas).
    const competencias = competenciasDoPayload(payload.competencia)
    const hojeIso = new Date().toISOString().slice(0, 10)
    const janela =
      filters.periodoModo === 'meses'
        ? { ini: 12 - filters.periodoMeses, fim: 11 }
        : filters.periodoModo === '30dias'
          ? janelaDeDatas(competencias, new Date(Date.now() - 29 * MS_POR_DIA).toISOString().slice(0, 10), hojeIso)
          : filters.periodoInicio && filters.periodoFim
            ? janelaDeDatas(competencias, filters.periodoInicio, filters.periodoFim)
            : { ini: 11, fim: 11 }
    const n = janela.fim - janela.ini + 1
    const labels = payload.meses.slice(janela.ini, janela.fim + 1)
    const deslig = new Array(n).fill(0)
    const desligVoluntarios = new Array(n).fill(0)
    const desligInvoluntarios = new Array(n).fill(0)
    const headcountMensal = new Array(n).fill(0)
    const horasTrabalhadas = new Array(n).fill(0)
    const horasCurto = new Array(n).fill(0)
    const horasLongo = new Array(n).fill(0)
    const horasFaltas = new Array(n).fill(0)
    emps.forEach((e) => {
      e.historico.deslig.slice(janela.ini, janela.fim + 1).forEach((v, i) => (deslig[i] += v))
      e.historico.desligVoluntarios.slice(janela.ini, janela.fim + 1).forEach((v, i) => (desligVoluntarios[i] += v))
      e.historico.desligInvoluntarios.slice(janela.ini, janela.fim + 1).forEach((v, i) => (desligInvoluntarios[i] += v))
      e.historico.headcount.slice(janela.ini, janela.fim + 1).forEach((v, i) => (headcountMensal[i] += v))
      e.historico.horasTrabalhadas.slice(janela.ini, janela.fim + 1).forEach((v, i) => (horasTrabalhadas[i] += v))
      e.historico.horasAbsenteismoCurto.slice(janela.ini, janela.fim + 1).forEach((v, i) => (horasCurto[i] += v))
      e.historico.horasAbsenteismoLongo.slice(janela.ini, janela.fim + 1).forEach((v, i) => (horasLongo[i] += v))
      e.historico.horasFaltas.slice(janela.ini, janela.fim + 1).forEach((v, i) => (horasFaltas[i] += v))
    })
    const totalDeslig = deslig.reduce((s, v) => s + v, 0)
    const totalDesligVoluntarios = desligVoluntarios.reduce((s, v) => s + v, 0)
    const totalDesligInvoluntarios = desligInvoluntarios.reduce((s, v) => s + v, 0)
    // Denominador do Turnover: media do total_headcount mensal (gold) ao longo do periodo
    // selecionado - formula que o Marcelo passou por exemplo (media inicio/fim do mes,
    // generalizada pros N meses da janela), nao um snapshot unico (nem gold do fim do
    // periodo, nem bronze de hoje).
    const headcountMedioPeriodo = headcountMensal.reduce((s, v) => s + v, 0) / n
    // Turnover Voluntario/Involuntario (pedido do Marcelo, 2026-09-09, card no lugar do
    // grafico "Turnover mensal") - formula do design (turnover.png): Desligamentos [tipo] /
    // HC Medio x 100, SEM dividir por 2 (diferente do Turnover Geral acima, que e a media
    // entre admissoes e desligamentos). Classificacao via caudem (ver item 11 do docstring
    // do adapter) - aproximado, os dois juntos ficam abaixo do total de Desligamentos exato.
    const turnoverVoluntarioPct = headcountMedioPeriodo ? ((totalDesligVoluntarios / headcountMedioPeriodo) * 100).toFixed(1) : '0.0'
    const turnoverInvoluntarioPct = headcountMedioPeriodo ? ((totalDesligInvoluntarios / headcountMedioPeriodo) * 100).toFixed(1) : '0.0'

    // Absenteismo (pedido do Marcelo, 2026-09-05, refeito em 2026-09-08 com bronze_rhp_r066sit
    // - ver item 10 do docstring do adapter) - formula EXATA do dicionario oficial: horas
    // perdidas / horas previstas de trabalho x 100. "Horas previstas" = trabalhadas + tudo que
    // e "dia que deveria ter sido trabalhado" (curto+longo+faltas). "Curto"/"Total" mantidos
    // como ja eram (Faltas fica de fora dos dois, mostrada separada - pedido do Marcelo).
    const horasPrevistasMensal = horasTrabalhadas.map((v, i) => v + horasCurto[i] + horasLongo[i] + horasFaltas[i])
    const totalHorasPrevistas = horasPrevistasMensal.reduce((s, v) => s + v, 0)
    const absenteismoCurtoMensal = horasCurto.map((v, i) => (horasPrevistasMensal[i] ? (v / horasPrevistasMensal[i]) * 100 : 0))
    const absenteismoTotalMensal = horasCurto.map((v, i) => (horasPrevistasMensal[i] ? ((v + horasLongo[i]) / horasPrevistasMensal[i]) * 100 : 0))
    const faltasMensal = horasFaltas.map((v, i) => (horasPrevistasMensal[i] ? (v / horasPrevistasMensal[i]) * 100 : 0))
    const totalHorasCurto = horasCurto.reduce((s, v) => s + v, 0)
    const totalHorasLongo = horasLongo.reduce((s, v) => s + v, 0)
    const totalHorasFaltas = horasFaltas.reduce((s, v) => s + v, 0)
    const absenteismoCurtoPct = totalHorasPrevistas ? ((totalHorasCurto / totalHorasPrevistas) * 100).toFixed(1) : '0.0'
    const absenteismoTotalPct = totalHorasPrevistas ? (((totalHorasCurto + totalHorasLongo) / totalHorasPrevistas) * 100).toFixed(1) : '0.0'
    const faltasPct = totalHorasPrevistas ? ((totalHorasFaltas / totalHorasPrevistas) * 100).toFixed(1) : '0.0'

    // "Afastamentos" (KPI do dicionario oficial, pedido do Marcelo 2026-09-06) - volume +
    // "taxa complementar = afastados / HC medio", e composicao "Motivos de ausencia". Ao
    // contrario do Absenteismo acima, aqui entram TODOS os tipos de afastamento (ferias,
    // licencas, etc) - ver item 9 do docstring do adapter. Taxa e a MEDIA das taxas mensais
    // (nao soma/soma) porque "afastados" e contagem de pessoas distintas por mes, nao dias -
    // somar pessoas ao longo de meses diferentes nao tem significado (a mesma pessoa conta de
    // novo em cada mes que ficou afastada).
    const afastadosDistintosMensal = new Array(n).fill(0)
    emps.forEach((e) => {
      e.historico.afastadosDistintos.slice(janela.ini, janela.fim + 1).forEach((v, i) => (afastadosDistintosMensal[i] += v))
    })
    const taxaAfastadosMensal = afastadosDistintosMensal.map((v, i) => (headcountMensal[i] ? (v / headcountMensal[i]) * 100 : 0))
    const taxaAfastadosPct = taxaAfastadosMensal.length
      ? (taxaAfastadosMensal.reduce((s, v) => s + v, 0) / taxaAfastadosMensal.length).toFixed(1)
      : '0.0'

    const motivoMap = new Map<string, number>()
    emps.forEach((e) =>
      e.afastamentosPorMotivo.forEach((m) => {
        const soma = m.valores.slice(janela.ini, janela.fim + 1).reduce((s, v) => s + v, 0)
        motivoMap.set(m.motivo, (motivoMap.get(m.motivo) ?? 0) + soma)
      })
    )
    const motivoList = [...motivoMap.entries()].map(([motivo, dias]) => ({ motivo, dias })).sort((a, b) => b.dias - a.dias)
    const totalDiasMotivos = motivoList.reduce((s, m) => s + m.dias, 0)
    const maxMotivo = Math.max(1, ...motivoList.map((m) => m.dias))

    // "Afastamentos e Absenteismo" por empresa (pedido do Marcelo, 2026-09-06: mesmo formato
    // "por empresa/periodo" da tabela "Por empresa / cliente" - reaproveitar esse padrao pros
    // proximos cards tambem). Cada linha usa SO os dados daquela empresa, no mesmo periodo (n
    // meses) selecionado no filtro.
    const empresaAfastamentoRows = emps.map((e) => {
      const hcMensalEmpresa = e.historico.headcount.slice(janela.ini, janela.fim + 1)
      const afastadosMensalEmpresa = e.historico.afastadosDistintos.slice(janela.ini, janela.fim + 1)
      const taxasMensais = afastadosMensalEmpresa.map((v, i) => (hcMensalEmpresa[i] ? (v / hcMensalEmpresa[i]) * 100 : 0))
      const taxaAfastamento = taxasMensais.length ? taxasMensais.reduce((s, v) => s + v, 0) / taxasMensais.length : 0

      const horasTrabalhadasEmpresa = e.historico.horasTrabalhadas.slice(janela.ini, janela.fim + 1).reduce((s, v) => s + v, 0)
      const horasCurtoEmpresa = e.historico.horasAbsenteismoCurto.slice(janela.ini, janela.fim + 1).reduce((s, v) => s + v, 0)
      const horasLongoEmpresa = e.historico.horasAbsenteismoLongo.slice(janela.ini, janela.fim + 1).reduce((s, v) => s + v, 0)
      const horasFaltasEmpresa = e.historico.horasFaltas.slice(janela.ini, janela.fim + 1).reduce((s, v) => s + v, 0)
      const horasPrevistasEmpresa = horasTrabalhadasEmpresa + horasCurtoEmpresa + horasLongoEmpresa + horasFaltasEmpresa
      const absenteismoCurto = horasPrevistasEmpresa ? (horasCurtoEmpresa / horasPrevistasEmpresa) * 100 : 0
      const absenteismoTotal = horasPrevistasEmpresa ? ((horasCurtoEmpresa + horasLongoEmpresa) / horasPrevistasEmpresa) * 100 : 0
      const faltas = horasPrevistasEmpresa ? (horasFaltasEmpresa / horasPrevistasEmpresa) * 100 : 0

      const diasTodosMotivos = e.afastamentosPorMotivo.reduce((s, m) => s + m.valores.slice(janela.ini, janela.fim + 1).reduce((s2, v) => s2 + v, 0), 0)

      return { nome: e.nome, taxaAfastamento, diasTodosMotivos, absenteismoCurto, absenteismoTotal, faltas }
    })

    // KPIs "Colaboradores ativos" / "Custo de folha" / "Tempo medio de casa" e os widgets
    // "Headcount por departamento" / "Cargo" / "Tipo de contrato" / "Localizacao" -> todos vem
    // da MESMA lista de colaboradores (bronze, aproximado - ver docstring do adapter), por isso
    // sao cruzaveis entre si e reagem ao filtro de Tipo de Contrato (pedido do Marcelo,
    // 2026-09-03) - cada widget aplica os filtros das OUTRAS dimensoes, mas nao se autofiltra
    // pela propria (senao a barra do proprio filtro selecionado desapareceria).
    const pessoasBase = emps.flatMap((e) => e.colaboradores)
    const pessoasFiltradas = filtrarColaboradores(pessoasBase, filters, [])

    const totalColabDept = pessoasFiltradas.length
    // Custo de folha (pedido 2026-09-06): mesma fonte/dedup da aba "Custo de Folha" e do card
    // "Por empresa" (silver_senior_rh_folha_pagamento), somado no periodo (n meses) - antes
    // vinha de `colaboradores[].salario` (bronze, snapshot atual, sem somar periodo). So reage
    // a Empresa/Periodo (a fonte nao tem centro de custo/contrato/filial pra cruzar com os
    // outros filtros - mesma limitacao ja documentada na tabela "Por empresa").
    const custoFolhaDept = emps.reduce((s, e) => {
      const empresaCusto = custoPayload?.empresas.find((c) => c.id === e.id)
      return s + (empresaCusto ? empresaCusto.historico.folha.slice(janela.ini, janela.fim + 1).reduce((s2, v) => s2 + v, 0) : 0)
    }, 0)
    const colabParaMediaCusto = emps.reduce((s, e) => s + e.colaboradores.length, 0)

    const comIdade = pessoasFiltradas.filter((p) => p.idade != null)
    const idadeMedia = comIdade.length ? Math.round(comIdade.reduce((s, p) => s + (p.idade as number), 0) / comIdade.length) : 0
    const comTempo = pessoasFiltradas.filter((p) => p.tempoCasaMeses != null)
    const tempoCasaMeses = comTempo.length ? Math.round(comTempo.reduce((s, p) => s + (p.tempoCasaMeses as number), 0) / comTempo.length) : 0
    const tempoAnos = Math.floor(tempoCasaMeses / 12)
    const tempoMesesResto = tempoCasaMeses % 12

    // Admissoes: regra exata (tipadm=2), reage ao filtro de Contrato - ver docstring do adapter
    // (fonte c). Desligamentos NAO tem regra exata equivalente - continua vindo so do historico
    // gold acima, sem reagir ao filtro de Contrato.
    const competenciasRaw = [...new Set(emps.flatMap((e) => e.admissoesContrato.map((a) => a.competencia)))].sort()
    const competenciasJanela = competenciasRaw.slice(janela.ini, janela.fim + 1)
    const adm = new Array(n).fill(0)
    emps.forEach((e) => {
      e.admissoesContrato.forEach((ev) => {
        if (!combina(filters.contrato, ev.contrato)) return
        const idx = competenciasJanela.indexOf(ev.competencia)
        if (idx >= 0) adm[idx] += ev.adm
      })
    })
    const totalAdm = adm.reduce((s, v) => s + v, 0)

    // Turnover (formula padrao pedida pelo Marcelo, 2026-09-04/05): media entre admissoes e
    // desligamentos no periodo, dividida pela media mensal de colaboradores no MESMO periodo
    // (headcountMedioPeriodo, gold) - ex.: 5 admissoes + 5 desligamentos = media 5; 5/100
    // colaboradores (media do periodo) = 5% de turnover.
    const turnoverPct = headcountMedioPeriodo ? (((totalAdm + totalDeslig) / 2 / headcountMedioPeriodo) * 100).toFixed(1) : '0.0'

    // Turnover MENSAL (mesma formula acima, mes a mes) - alimenta o grafico de linha com
    // baseline de 3% (pedido do Marcelo, 2026-09-05). Admissoes aqui reagem ao filtro de
    // Contrato (mesmo `adm` usado no resto do painel); headcount de cada mes como base
    // (nao a media do periodo inteiro, que so faz sentido pro numero agregado do KPI).
    // Turnover por empresa (pedido 2026-09-07, mesmo padrao "por empresa/periodo" da tabela
    // "Afastamentos e Absenteismo por empresa") - cada linha usa so as admissoes/desligamentos/
    // headcount DAQUELA empresa, mesma formula do KPI agregado acima.
    const empresaTurnoverRows = emps.map((e) => {
      const admEmpresa = new Array(n).fill(0)
      e.admissoesContrato.forEach((ev) => {
        if (!combina(filters.contrato, ev.contrato)) return
        const idx = competenciasJanela.indexOf(ev.competencia)
        if (idx >= 0) admEmpresa[idx] += ev.adm
      })
      const totalAdmEmpresa = admEmpresa.reduce((s, v) => s + v, 0)
      const totalDesligEmpresa = e.historico.deslig.slice(janela.ini, janela.fim + 1).reduce((s, v) => s + v, 0)
      const headcountMedioEmpresa = e.historico.headcount.slice(janela.ini, janela.fim + 1).reduce((s, v) => s + v, 0) / n
      const turnover = headcountMedioEmpresa ? ((totalAdmEmpresa + totalDesligEmpresa) / 2 / headcountMedioEmpresa) * 100 : 0
      return { nome: e.nome, totalAdmEmpresa, totalDesligEmpresa, turnover }
    })

    // KPIs "Admissoes no periodo" / "Desligamentos": nos modos 30dias/custom ficam exatas, via
    // `admissoesEventos`/`desligamentosEventos` (data exata, item 7 do adapter). No modo "meses",
    // continuam usando totalAdm/totalDeslig mensais de sempre.
    function contarEventosExatos(eventos: (e: Empresa) => EventoContrato[]) {
      if (filters.periodoModo === 'meses') return null
      let inicioStr: string | null
      let fimStr: string | null
      if (filters.periodoModo === '30dias') {
        fimStr = new Date().toISOString().slice(0, 10)
        inicioStr = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10)
      } else {
        inicioStr = filters.periodoInicio
        fimStr = filters.periodoFim
      }
      if (!inicioStr || !fimStr) return { total: 0, label: 'selecione as datas' }
      const total = emps
        .flatMap((e) => eventos(e) ?? [])
        .filter((ev) => combina(filters.contrato, ev.contrato) && ev.data >= inicioStr! && ev.data <= fimStr!).length
      const label =
        filters.periodoModo === '30dias' ? 'últimos 30 dias · dia exato' : `${inicioStr.split('-').reverse().join('/')} – ${fimStr.split('-').reverse().join('/')} · dia exato`
      return { total, label }
    }

    const exatoAdm = contarEventosExatos((e) => e.admissoesEventos)
    const totalAdmKpi = exatoAdm ? exatoAdm.total : totalAdm
    const admissoesJanelaLabel = exatoAdm ? exatoAdm.label : `${n} ${n === 1 ? 'mês' : 'meses'}`

    // Desligamentos continua so mensal (sem o filtro fino de dia que Admissoes tem).
    // Desde 2026-09-09 `historico.deslig` vem do BRONZE (Voluntarios+Involuntarios por
    // caudem, item 11 do adapter), nao mais do gold - decisao do Marcelo, o bronze e
    // espelho direto do HCM (mais atual) e o gold so e recalculado em lote.
    const totalDesligKpi = totalDeslig
    const desligamentosJanelaLabel = `${n} ${n === 1 ? 'mês' : 'meses'}`

    const contratoMap: Record<string, number> = { CLT: 0, PJ: 0, 'Estágio': 0, Aprendiz: 0, Diretor: 0, 'Temporários': 0, Outros: 0 }
    filtrarColaboradores(pessoasBase, filters, ['contrato']).forEach((p) => {
      contratoMap[p.contrato] = (contratoMap[p.contrato] ?? 0) + 1
    })

    const locMap = new Map<string, number>()
    filtrarColaboradores(pessoasBase, filters, ['localizacao']).forEach((p) => locMap.set(p.filial, (locMap.get(p.filial) ?? 0) + 1))
    let locList = [...locMap.entries()].map(([nome, count]) => ({ nome, count })).sort((a, b) => b.count - a.count)
    locList = locList.filter((l) => combina(filters.localizacao, l.nome))
    const maxLoc = Math.max(1, ...locList.map((l) => l.count))

    const empresaRows = emps.map((e) => {
      // "Colaboradores" usa a mesma contagem bronze do KPI "Colaboradores ativos" (pedido do
      // Marcelo, 2026-09-05) - antes vinha do gold (departamentosOficiais), que fica preso a
      // competencia pedida e nao reconciliava com o snapshot atual (ver reconciliacao 666/669
      // no docstring do adapter). "Custo de folha" (pedido 2026-09-06) trocou de fonte tambem -
      // era o gold `departamentosOficiais.custo` (uma foto fixa da competencia pedida, nao
      // reagia ao filtro de Periodo); agora vem da mesma fonte/dedup da aba "Custo de Folha"
      // (silver_senior_rh_folha_pagamento, ver custo_folha_adapter.py) e soma pelo MESMO
      // periodo (n meses) que Admissoes/Desligamentos abaixo - so tem dado real a partir de
      // Jan/2026 (custoPayload.primeiroMesComDado), meses antes disso somam 0.
      const atual = e.colaboradores.length
      const empresaCusto = custoPayload?.empresas.find((c) => c.id === e.id)
      const custo = empresaCusto ? empresaCusto.historico.folha.slice(janela.ini, janela.fim + 1).reduce((s, v) => s + v, 0) : 0
      const admN = e.historico.adm.slice(janela.ini, janela.fim + 1).reduce((s, v) => s + v, 0)
      const desligN = e.historico.deslig.slice(janela.ini, janela.fim + 1).reduce((s, v) => s + v, 0)
      return { nome: e.nome, atual, custo, adm: admN, deslig: desligN }
    })

    // Custo por empresa detalhado (aba "Por Empresa", pedido 2026-09-07) - mesma fonte/janela
    // do `custo` acima, mas com a quebra Folha/Encargos/Beneficios/Rescisao (nao so Folha).
    const empresaCustoDetalhado = emps.map((e) => {
      const empresaCusto = custoPayload?.empresas.find((c) => c.id === e.id)
      const folhaEmpresa = empresaCusto ? empresaCusto.historico.folha.slice(janela.ini, janela.fim + 1).reduce((s, v) => s + v, 0) : 0
      const encargosEmpresa = empresaCusto ? empresaCusto.historico.encargos.slice(janela.ini, janela.fim + 1).reduce((s, v) => s + v, 0) : 0
      const beneficioEmpresa = empresaCusto ? empresaCusto.historico.beneficio.slice(janela.ini, janela.fim + 1).reduce((s, v) => s + v, 0) : 0
      const rescisaoEmpresa = empresaCusto ? empresaCusto.historico.rescisao.slice(janela.ini, janela.fim + 1).reduce((s, v) => s + v, 0) : 0
      const totalEmpresa = folhaEmpresa + encargosEmpresa + beneficioEmpresa + rescisaoEmpresa
      return { nome: e.nome, folhaEmpresa, encargosEmpresa, beneficioEmpresa, rescisaoEmpresa, totalEmpresa }
    })

    // Provisao de Ferias/13o/PLR por empresa (aba "Por Empresa", pedido 2026-09-08) - "saldo"
    // usa o ULTIMO mes da janela selecionada (sldatu e um saldo acumulado, ponto-no-tempo, nao
    // soma como as outras metricas) - ver docstring do provisao_adapter.py.
    const empresaProvisaoRows = emps.map((e) => {
      const empresaProvisao = provisaoPayload?.empresas.find((p) => p.id === e.id)
      const saldoPorTipo: Record<string, number> = {}
      ;(provisaoPayload?.tipos ?? []).forEach((tipo) => {
        const serie = empresaProvisao?.provisao[tipo]?.sldatu.slice(janela.ini, janela.fim + 1)
        saldoPorTipo[tipo] = serie && serie.length ? serie[serie.length - 1] : 0
      })
      return { nome: e.nome, saldoPorTipo }
    })

    // GPS por empresa (pedido 2026-09-10, fonte bronze_rhp_r054grp) - virou serie mensal de
    // verdade no mesmo dia (a fonte foi atualizada pelo time da Unimed, passou a ter dado
    // ate 2026-08) - agora reage ao Periodo igual aos outros cards "por empresa", somando a
    // janela selecionada. Cobertura ainda e parcial (so 1 empresa, dado real a partir de
    // Dez/2025 - ver item 12 do docstring do adapter) - `semDadoNoPeriodo` sinaliza quando a
    // janela escolhida cai inteira ANTES do primeiro mes com dado daquela empresa, pra nao
    // mostrar "R$ 0,00" como se fosse GPS zero de verdade.
    // "Alíquota efetiva" (total/basemp) foi tentada e descartada (2026-09-10) - dava >100%
    // porque basemp (base da parte Empresa) e basou1 (base da parte Terceiros, com perou1%)
    // são bases DIFERENTES somadas na mesma linha - dividir o total combinado por só uma
    // delas mistura bases incompatíveis. Fica só valores absolutos até confirmar a fórmula
    // certa do índice com o Marcelo/time da Unimed.
    const empresaGpsRows = emps.map((e) => {
      const valorEmpresa = e.historico.gpsValorEmpresa.slice(janela.ini, janela.fim + 1).reduce((s, v) => s + v, 0)
      const valorTerceiros = e.historico.gpsValorTerceiros.slice(janela.ini, janela.fim + 1).reduce((s, v) => s + v, 0)
      const valorSegurados = e.historico.gpsValorSegurados.slice(janela.ini, janela.fim + 1).reduce((s, v) => s + v, 0)
      const valorDeducao = e.historico.gpsValorDeducao.slice(janela.ini, janela.fim + 1).reduce((s, v) => s + v, 0)
      const totalGps = valorEmpresa + valorTerceiros + valorSegurados - valorDeducao
      const semDadoNoPeriodo = e.gpsPrimeiroMesComDado > janela.fim
      const primeiroMesLabel = e.gpsPrimeiroMesComDado < 12 ? payload.meses[e.gpsPrimeiroMesComDado] : null
      return { nome: e.nome, valorEmpresa, valorTerceiros, valorSegurados, valorDeducao, totalGps, semDadoNoPeriodo, primeiroMesLabel }
    })

    const empresaOptionsMulti = empresas.map((e) => ({ value: e.id, label: e.nome }))
    const departamentoOptionsMulti = [...new Set(empresas.flatMap((e) => e.colaboradores.map((c) => c.centroCusto)))]
      .sort()
      .map((d) => ({ value: d, label: d }))
    const localizacaoOptionsMulti = [...new Set(empresas.flatMap((e) => e.colaboradores.map((c) => c.filial)))]
      .sort()
      .map((l) => ({ value: l, label: l }))

    const nMesesLabel =
      filters.periodoModo === 'meses'
        ? `${n} meses`
        : `${labels[0]}–${labels[labels.length - 1]} (${n} ${n === 1 ? 'mês' : 'meses'}, aprox. p/ este recorte)`

    // Limites do seletor de data: a janela de 12 meses que o payload cobre (evita escolher
    // um recorte fora do dado, que nao teria como ser respondido).
    const [anoFim, mesFim] = competencias[11].split('-').map(Number)
    const dataMin = `${competencias[0]}-01`
    const dataMax = `${competencias[11]}-${String(new Date(Date.UTC(anoFim, mesFim, 0)).getUTCDate()).padStart(2, '0')}`

    return {
      n, nMesesLabel, totalColabDept, custoFolhaDept, colabParaMediaCusto, idadeMedia, tempoAnos, tempoMesesResto,
      labels, adm, deslig, totalAdm, totalAdmKpi, admissoesJanelaLabel, headcountMedioPeriodo,
      totalDeslig, totalDesligKpi, desligamentosJanelaLabel, turnoverPct, empresaTurnoverRows,
      totalDesligVoluntarios, totalDesligInvoluntarios, turnoverVoluntarioPct, turnoverInvoluntarioPct,
      absenteismoCurtoPct, absenteismoTotalPct, absenteismoCurtoMensal, absenteismoTotalMensal, faltasPct, faltasMensal,
      taxaAfastadosPct, taxaAfastadosMensal, motivoList, totalDiasMotivos, maxMotivo, empresaAfastamentoRows,
      contratoMap, locList, maxLoc, empresaRows, empresaCustoDetalhado, empresaProvisaoRows, empresaGpsRows,
      empresaOptionsMulti, departamentoOptionsMulti, localizacaoOptionsMulti, dataMin, dataMax,
    }
  }, [payload, filters, custoPayload, provisaoPayload])

  if (erro) {
    return <div style={{ padding: 48, color: 'var(--danger)' }}>Erro ao carregar dados: {erro}</div>
  }
  if (!payload || !derivado) {
    return <div style={{ padding: 48, color: 'var(--text-muted)' }}>Carregando dados do datalake…</div>
  }

  const setFilter = (key: keyof Filters, values: string[]) => setFilters((f) => ({ ...f, [key]: values }))

  return (
    <div style={{ minHeight: '100vh', padding: '40px 48px 64px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ font: 'var(--fw-semibold) var(--text-overline)/1 var(--font-sans)', letterSpacing: 'var(--tracking-wide)', textTransform: 'uppercase', color: 'var(--brand)' }}>
            DEPARTAMENTO PESSOAL · VALIDAÇÃO INTERNA
          </span>
          <span style={{ font: 'var(--fw-extrabold) var(--text-h1)/1.1 var(--font-display)', letterSpacing: 'var(--tracking-tight)', color: 'var(--text-strong)' }}>
            Headcount de colaboradores
          </span>
          <span style={{ font: 'var(--fw-regular) var(--text-body)/1.4 var(--font-sans)', color: 'var(--text-muted)' }}>
            Dados reais do datalake · competência de referência {payload.competencia}
          </span>
        </div>
        <button
          style={{
            height: 40, padding: '0 16px', borderRadius: 'var(--radius-control)', border: '1px solid var(--border-subtle)',
            background: 'var(--surface-card)', color: 'var(--text-body)', display: 'flex', alignItems: 'center', gap: 8,
            font: 'var(--fw-medium) var(--text-body-sm)/1 var(--font-sans)', cursor: 'pointer',
          }}
          onClick={() => window.print()}
        >
          <Download size={16} strokeWidth={1.75} /> Exportar
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border-subtle)' }}>
        {(
          [
            ['headcount', 'Headcount'],
            ['custo', 'Custo de Folha'],
            ['porEmpresa', 'Por Empresa'],
          ] as [typeof aba, string][]
        ).map(([valor, rotulo]) => (
          <button
            key={valor}
            onClick={() => setAba(valor)}
            style={{
              padding: '10px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
              font: 'var(--fw-semibold) var(--text-body-sm)/1 var(--font-sans)',
              color: aba === valor ? 'var(--brand)' : 'var(--text-muted)',
              borderBottom: aba === valor ? '2px solid var(--brand)' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {rotulo}
          </button>
        ))}
      </div>

      {aba === 'custo' && (
        custoPayload
          ? <CustoFolhaTab payload={custoPayload} provisaoPayload={provisaoPayload} />
          : <div style={{ padding: 24, color: 'var(--text-muted)' }}>Carregando dados de custo de folha…</div>
      )}

      {aba === 'porEmpresa' && (
      <>
      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-sm)', padding: '16px 20px', display: 'flex', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap' }}>
        <MultiSelect label="Empresa" values={filters.empresa} options={derivado.empresaOptionsMulti} onChange={(v) => setFilter('empresa', v)} width={220} placeholderTodos="Todas as empresas" />
        <PeriodoBotoes
          modo={filters.periodoModo}
          meses={filters.periodoMeses}
          inicio={filters.periodoInicio}
          fim={filters.periodoFim}
          onChange={(modo, meses, inicio, fim) => setFilters((f) => ({ ...f, periodoModo: modo, periodoMeses: meses, periodoInicio: inicio, periodoFim: fim }))}
          dataMin={derivado.dataMin}
          dataMax={derivado.dataMax}
          rotulosMeses={payload.meses}
        />
        <MultiSelect label="Tipo de contrato" values={filters.contrato} options={[{ value: 'CLT', label: 'CLT' }, { value: 'PJ', label: 'PJ' }, { value: 'Estágio', label: 'Estágio' }, { value: 'Aprendiz', label: 'Aprendiz' }, { value: 'Diretor', label: 'Diretor' }, { value: 'Temporários', label: 'Temporários' }, { value: 'Outros', label: 'Outros' }]} onChange={(v) => setFilter('contrato', v)} width={170} placeholderTodos="Todos os contratos" />
        <button
          style={{ marginLeft: 'auto', height: 36, padding: '0 12px', borderRadius: 'var(--radius-control)', border: 'none', background: 'transparent', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, font: 'var(--fw-medium) var(--text-body-sm)/1 var(--font-sans)', cursor: 'pointer' }}
          onClick={() => setFilters(FILTROS_PADRAO)}
        >
          <X size={16} strokeWidth={1.75} /> Limpar filtros
        </button>
      </div>

      <Card title="Por empresa / cliente" subtitle={`Colaboradores aproximado (mesma base do KPI de Headcount) · Custo de folha e Admissões/Desligamentos somados no período (${derivado.nMesesLabel}) · Custo de folha só tem dado real a partir de Jan/2026`} bodyPadding="0">
        <EmpresaTable rows={derivado.empresaRows} />
      </Card>

      <Card
        title="Turnover por empresa"
        subtitle={`${derivado.nMesesLabel} · cada linha usa só os dados daquela empresa no período selecionado · admissões reagem ao contrato`}
        bodyPadding="0"
      >
        <EmpresaGenericTable
          rows={derivado.empresaTurnoverRows}
          colunas={[
            { header: 'Admissões', render: (r) => <span style={{ color: 'var(--success)' }}>+{num(r.totalAdmEmpresa)}</span> },
            { header: 'Desligamentos', render: (r) => <span style={{ color: 'var(--danger)' }}>-{num(r.totalDesligEmpresa)}</span> },
            { header: 'Turnover', render: (r) => `${r.turnover.toFixed(1)}%` },
          ]}
        />
      </Card>

      <Card
        title="Afastamentos e Absenteísmo por empresa"
        subtitle={`${derivado.nMesesLabel} · cada linha usa só os dados daquela empresa no período selecionado`}
        bodyPadding="0"
      >
        <EmpresaGenericTable
          rows={derivado.empresaAfastamentoRows}
          colunas={[
            { header: 'Taxa de afastamento', render: (r) => `${r.taxaAfastamento.toFixed(1)}%` },
            { header: 'Dias afastados (todos os tipos)', render: (r) => num(Math.round(r.diasTodosMotivos)) },
            { header: 'Absenteísmo curto', render: (r) => `${r.absenteismoCurto.toFixed(1)}%` },
            { header: 'Absenteísmo total', render: (r) => `${r.absenteismoTotal.toFixed(1)}%` },
            { header: 'Faltas não justificadas', render: (r) => `${r.faltas.toFixed(1)}%` },
          ]}
        />
      </Card>

      <Card
        title="Custo por empresa"
        subtitle={`${derivado.nMesesLabel} · cada linha usa só os dados daquela empresa no período selecionado · fonte: folha de pagamento (silver), deduplicado · só tem dado real a partir de Jan/2026`}
        bodyPadding="0"
      >
        <EmpresaGenericTable
          rows={derivado.empresaCustoDetalhado}
          colunas={[
            { header: 'Folha', render: (r) => brl(r.folhaEmpresa) },
            { header: 'Encargos', render: (r) => brl(r.encargosEmpresa) },
            { header: 'Benefícios', render: (r) => brl(r.beneficioEmpresa) },
            { header: 'Rescisão', render: (r) => brl(r.rescisaoEmpresa) },
            { header: 'Total', render: (r) => <span style={{ fontWeight: 600, color: 'var(--text-strong)' }}>{brl(r.totalEmpresa)}</span> },
          ]}
        />
      </Card>

      <Card
        title="Provisão por empresa"
        subtitle={`Saldo no último mês do período selecionado (${derivado.labels[derivado.labels.length - 1] ?? ''}) · fonte: bronze_rhp_r146prv, módulo de Provisão`}
        bodyPadding="0"
      >
        <EmpresaGenericTable
          rows={derivado.empresaProvisaoRows}
          colunas={(provisaoPayload?.tipos ?? []).map((tipo) => ({
            header: tipo,
            render: (r: { saldoPorTipo: Record<string, number> }) => brl(r.saldoPorTipo[tipo] ?? 0),
          }))}
        />
      </Card>

      <Card
        title="GPS por empresa"
        subtitle={`Guia da Previdência Social · ${derivado.nMesesLabel} · fonte: bronze_rhp_r054grp · cobertura ainda parcial na fonte (por ora só 1 empresa) — ver nota por linha`}
        bodyPadding="0"
      >
        <EmpresaGenericTable
          rows={derivado.empresaGpsRows}
          colunas={[
            { header: 'Valor Empresa', render: (r) => brl(r.valorEmpresa) },
            { header: 'Valor Terceiros', render: (r) => brl(r.valorTerceiros) },
            { header: 'Valor Segurados', render: (r) => brl(r.valorSegurados) },
            { header: 'Dedução', render: (r) => brl(r.valorDeducao) },
            {
              header: 'Total GPS',
              render: (r) =>
                r.semDadoNoPeriodo ? (
                  <span style={{ color: 'var(--text-faint)' }}>
                    sem dado {r.primeiroMesLabel ? `(fonte começa em ${r.primeiroMesLabel})` : 'na fonte'}
                  </span>
                ) : (
                  <span style={{ fontWeight: 600, color: 'var(--text-strong)' }}>{brl(r.totalGps)}</span>
                ),
            },
          ]}
        />
      </Card>
      </>
      )}

      {aba === 'headcount' && (
      <>
      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-sm)', padding: '16px 20px', display: 'flex', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap' }}>
        <MultiSelect label="Empresa" values={filters.empresa} options={derivado.empresaOptionsMulti} onChange={(v) => setFilter('empresa', v)} width={220} placeholderTodos="Todas as empresas" />
        <MultiSelect label="Departamento" values={filters.departamento} options={derivado.departamentoOptionsMulti} onChange={(v) => setFilter('departamento', v)} width={220} placeholderTodos="Todos os departamentos" />
        <PeriodoFilter
          modo={filters.periodoModo}
          meses={filters.periodoMeses}
          inicio={filters.periodoInicio}
          fim={filters.periodoFim}
          onChange={(modo, meses, inicio, fim) => setFilters((f) => ({ ...f, periodoModo: modo, periodoMeses: meses, periodoInicio: inicio, periodoFim: fim }))}
          dataMin={derivado.dataMin}
          dataMax={derivado.dataMax}
          rotulosMeses={payload.meses}
        />
        <MultiSelect label="Tipo de contrato" values={filters.contrato} options={[{ value: 'CLT', label: 'CLT' }, { value: 'PJ', label: 'PJ' }, { value: 'Estágio', label: 'Estágio' }, { value: 'Aprendiz', label: 'Aprendiz' }, { value: 'Diretor', label: 'Diretor' }, { value: 'Temporários', label: 'Temporários' }, { value: 'Outros', label: 'Outros' }]} onChange={(v) => setFilter('contrato', v)} width={170} placeholderTodos="Todos os contratos" />
        <MultiSelect label="Localização" values={filters.localizacao} options={derivado.localizacaoOptionsMulti} onChange={(v) => setFilter('localizacao', v)} width={220} placeholderTodos="Todas as localizações" />
        <button
          style={{ marginLeft: 'auto', height: 36, padding: '0 12px', borderRadius: 'var(--radius-control)', border: 'none', background: 'transparent', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, font: 'var(--fw-medium) var(--text-body-sm)/1 var(--font-sans)', cursor: 'pointer' }}
          onClick={() => setFilters(FILTROS_PADRAO)}
        >
          <X size={16} strokeWidth={1.75} /> Limpar filtros
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16 }}>
        <StatCard label="Colaboradores ativos" value={num(derivado.totalColabDept)} hint="aproximado, reage a todos os filtros" icon={<Users size={18} strokeWidth={1.75} />} />
        <StatCard label="Custo de folha" value={brl(derivado.custoFolhaDept)} hint={derivado.colabParaMediaCusto ? `${derivado.nMesesLabel} · média ${brl(derivado.custoFolhaDept / derivado.colabParaMediaCusto)}/colab.` : ''} icon={<Wallet size={18} strokeWidth={1.75} />} />
        <StatCard label="Admissões no período" value={num(derivado.totalAdmKpi)} hint={`${derivado.admissoesJanelaLabel} · reage ao contrato`} icon={<UserPlus size={18} strokeWidth={1.75} />} />
        <StatCard label="Desligamentos" value={num(derivado.totalDesligKpi)} hint={derivado.desligamentosJanelaLabel} icon={<UserMinus size={18} strokeWidth={1.75} />} />
        <StatCard label="Tempo médio de casa" value={`${derivado.tempoAnos}a ${derivado.tempoMesesResto}m`} hint={`${derivado.idadeMedia} anos de idade média`} icon={<CalendarClock size={18} strokeWidth={1.75} />} />
        <StatCard label="Absenteísmo" value={`${derivado.absenteismoTotalPct}%`} hint={`curto ${derivado.absenteismoCurtoPct}% · ${derivado.nMesesLabel}`} icon={<Thermometer size={18} strokeWidth={1.75} />} />
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ width: 260 }}>
          <StatCard
            label="HC Médio"
            value={num(Math.round(derivado.headcountMedioPeriodo))}
            hint={`(HC inicial + HC final do mês) / 2 · ${derivado.nMesesLabel}`}
            icon={<Gauge size={18} strokeWidth={1.75} />}
          />
        </div>
        <div style={{ width: 260 }}>
          <StatCard
            label="Turnover Geral"
            value={`${derivado.turnoverPct}%`}
            hint="(Admissões + Desligamentos) / 2 ÷ HC Médio"
            icon={<Repeat size={18} strokeWidth={1.75} />}
          />
        </div>
      </div>

      <Card
        title="Evolução — admissões x desligamentos"
        subtitle={`${derivado.nMesesLabel} · admissões reagem ao contrato, desligamentos não · fonte bronze (espelho do HCM)`}
        right={
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--fw-medium) var(--text-body-sm)/1 var(--font-sans)', color: 'var(--text-muted)' }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--success)', display: 'inline-block' }} />
              Admissões · <span className="tabular" style={{ color: 'var(--text-strong)', fontWeight: 600 }}>{num(derivado.totalAdm)}</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--fw-medium) var(--text-body-sm)/1 var(--font-sans)', color: 'var(--text-muted)' }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--danger)', display: 'inline-block' }} />
              Desligamentos · <span className="tabular" style={{ color: 'var(--text-strong)', fontWeight: 600 }}>{num(derivado.totalDeslig)}</span>
            </span>
            <span style={{ font: 'var(--fw-medium) var(--text-body-sm)/1 var(--font-sans)', color: 'var(--text-muted)' }}>
              Turnover · <span className="tabular" style={{ color: 'var(--text-strong)', fontWeight: 600 }}>{derivado.turnoverPct}%</span>
            </span>
          </div>
        }
      >
        <EvolutionChart meses={derivado.labels} adm={derivado.adm} deslig={derivado.deslig} />
      </Card>

      <Card title="Turnover Voluntário x Involuntário" subtitle={`${derivado.nMesesLabel} · Desligamentos [tipo] ÷ HC Médio × 100 · classificação oficial por causa de demissão (planilha "Motivo Desligamentos") · os dois somam exatamente o KPI "Desligamentos"`} bodyPadding="18px 20px">
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 260px' }}>
            <StatCard
              label="Turnover Voluntário"
              value={`${derivado.turnoverVoluntarioPct}%`}
              hint={`Pedido de demissão do colaborador · ${num(derivado.totalDesligVoluntarios)} desligamentos`}
              icon={<LogOut size={18} strokeWidth={1.75} />}
            />
          </div>
          <div style={{ flex: '1 1 260px' }}>
            <StatCard
              label="Turnover Involuntário"
              value={`${derivado.turnoverInvoluntarioPct}%`}
              hint={`Desligamento por decisão da empresa · ${num(derivado.totalDesligInvoluntarios)} desligamentos`}
              icon={<UserX size={18} strokeWidth={1.75} />}
            />
          </div>
        </div>
      </Card>

      <Card
        title="Absenteísmo mensal"
        subtitle={`${derivado.nMesesLabel} · horas perdidas ÷ horas previstas de trabalho × 100 (fórmula oficial) · fonte: bronze_rhp_r066sit · não reage a filtros`}
        right={
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--fw-medium) var(--text-body-sm)/1 var(--font-sans)', color: 'var(--text-muted)' }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--brand)', display: 'inline-block' }} />
              Curto (atestado) · <span className="tabular" style={{ color: 'var(--text-strong)', fontWeight: 600 }}>{derivado.absenteismoCurtoPct}%</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--fw-medium) var(--text-body-sm)/1 var(--font-sans)', color: 'var(--text-muted)' }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--danger)', display: 'inline-block' }} />
              Total (+ auxílio doença/acidente) · <span className="tabular" style={{ color: 'var(--text-strong)', fontWeight: 600 }}>{derivado.absenteismoTotalPct}%</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--fw-medium) var(--text-body-sm)/1 var(--font-sans)', color: 'var(--text-muted)' }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--warning)', display: 'inline-block' }} />
              Faltas não justificadas · <span className="tabular" style={{ color: 'var(--text-strong)', fontWeight: 600 }}>{derivado.faltasPct}%</span>
            </span>
          </div>
        }
      >
        <AbsenteeismoChart meses={derivado.labels} curto={derivado.absenteismoCurtoMensal} total={derivado.absenteismoTotalMensal} faltas={derivado.faltasMensal} />
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20, alignItems: 'start' }}>
        <Card
          title="Afastamentos — taxa por headcount"
          subtitle="Média mensal · afastados (pessoas distintas, qualquer tipo) ÷ headcount médio × 100 · não reage a filtros"
          right={
            <span style={{ font: 'var(--fw-medium) var(--text-body-sm)/1 var(--font-sans)', color: 'var(--text-muted)' }}>
              Média do período · <span className="tabular" style={{ color: 'var(--text-strong)', fontWeight: 600 }}>{derivado.taxaAfastadosPct}%</span>
            </span>
          }
        >
          <AfastamentosChart meses={derivado.labels} taxa={derivado.taxaAfastadosMensal} />
        </Card>
        <Card title="Motivos de ausência" subtitle={`${derivado.nMesesLabel} · composição de todos os dias de afastamento (inclui férias/licenças)`} bodyPadding="18px 20px">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 340, overflow: 'auto' }}>
            {derivado.motivoList.map((m) => (
              <BarRow
                key={m.motivo}
                label={m.motivo}
                valueLabel={`${num(m.dias)} dias (${derivado.totalDiasMotivos ? ((m.dias / derivado.totalDiasMotivos) * 100).toFixed(0) : 0}%)`}
                fraction={m.dias / derivado.maxMotivo}
                color="var(--info)"
              />
            ))}
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        <Card title="Tipo de contrato" subtitle="Aproximado, reage ao filtro de departamento/localização — ver nota de qualidade de dado">
          <ContratoWidget contratos={derivado.contratoMap} filtro={filters.contrato} />
        </Card>
        <Card title="Localização / filial" subtitle="Aproximado, reage ao filtro de departamento/contrato — ver nota de qualidade de dado">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {derivado.locList.map((l) => (
              <BarRow key={l.nome} label={l.nome} valueLabel={num(l.count)} fraction={l.count / derivado.maxLoc} />
            ))}
          </div>
        </Card>
      </div>
      </>
      )}
    </div>
  )
}

export default App
