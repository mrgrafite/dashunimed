export interface DepartamentoOficial {
  nome: string
  atual: number
  custo: number
}

export interface Colaborador {
  centroCusto: string
  cargo: string
  contrato: string
  filial: string
  salario: number
  idade: number | null
  tempoCasaMeses: number | null
}

export interface AdmissaoContrato {
  competencia: string
  contrato: string
  adm: number
}

/** Uma linha por evento (admissao ou desligamento), com data exata - alimenta so o filtro
 * fino (30 dias / personalizado) das KPIs "Admissoes no periodo"/"Desligamentos",
 * independente do preset mensal (que continua vindo de AdmissaoContrato/Historico). */
export interface EventoContrato {
  data: string
  contrato: string
}

export interface Historico {
  adm: number[]
  deslig: number[]
  headcount: number[]
  /** Desligamentos por mes classificados como Voluntario (caudem 3/4/14, planilha oficial "Motivo Desligamentos") - aproximado, soma com Involuntarios fica ABAIXO do `deslig` (gold, exato): "Nao usar" (6/7/12) e caudem fora da planilha ficam de fora dos dois. */
  desligVoluntarios: number[]
  /** Desligamentos por mes classificados como Involuntario (caudem 1/2/13) - mesma aproximacao acima. */
  desligInvoluntarios: number[]
  /** Horas trabalhadas por mes (codsit=1, "Trabalhando") - base do denominador "horas previstas". */
  horasTrabalhadas: number[]
  /** Horas perdidas por mes (codsit: Atestado/Atestado Acompanhante/Horas Justificadas/Falta a Descontar). */
  horasAbsenteismoCurto: number[]
  /** Horas perdidas por mes (codsit: Auxilio Doenca/Acidente Trabalho - mais longos). Somar com o curto pro "afastamento total". */
  horasAbsenteismoLongo: number[]
  /** Horas perdidas por mes com Falta NAO justificada (codsit=15) - categoria separada, nao entra no curto/longo. */
  horasFaltas: number[]
  /** Contagem de pessoas DISTINTAS com algum afastamento (qualquer tipo, inclusive ferias/licencas)
   * sobrepondo o mes - KPI "Afastamentos" do dicionario oficial (taxa = isso / HC medio). */
  afastadosDistintos: number[]
}

/** Composicao de dias de afastamento por motivo (TODOS os tipos - ferias, licencas, atestado,
 * etc - nao so os que contam pra taxa de absenteismo) - KPI "Motivos de ausencia". */
export interface AfastamentoMotivo {
  motivo: string
  valores: number[]
}

export interface Empresa {
  id: string
  nome: string
  departamentosOficiais: DepartamentoOficial[]
  colaboradores: Colaborador[]
  historico: Historico
  admissoesContrato: AdmissaoContrato[]
  admissoesEventos: EventoContrato[]
  desligamentosEventos: EventoContrato[]
  afastamentosPorMotivo: AfastamentoMotivo[]
}

export interface Payload {
  competencia: string
  meses: string[]
  diasNoMes: number[]
  empresas: Empresa[]
}

/** 'meses' = preset 3/6/12 (janela mensal, como sempre foi). '30dias'/'custom' = janela em
 * dias corridos - so a KPI "Admissoes no periodo" fica exata nesses 2 modos (via
 * AdmissaoEvento); os widgets mensais (desligamentos, "Por empresa", grafico de evolucao)
 * caem pro mes/meses mais proximo que cobre a janela, ver docstring do App.tsx. */
export type PeriodoModo = 'meses' | '30dias' | 'custom'

export interface HistoricoCusto {
  folha: number[]
  encargos: number[]
  beneficio: number[]
  rescisao: number[]
}

export interface ClcItem {
  nome: string
  valores: number[]
}

export interface EmpresaCusto {
  id: string
  nome: string
  historico: HistoricoCusto
  clc: ClcItem[]
}

export interface CustoFolhaPayload {
  competencia: string
  meses: string[]
  /** Indice (0-based) do primeiro mes com dado real - a fonte (silver_senior_rh_folha_pagamento)
   * so cobre a partir de 2026-01 por ora, meses antes disso vem zerados (nao e custo zero de
   * verdade, e ausencia de dado). */
  primeiroMesComDado: number
  empresas: EmpresaCusto[]
}

export interface ProvisaoTipo {
  prvmes: number[]
  valpag: number[]
  sldatu: number[]
}

export interface EmpresaProvisao {
  id: string
  nome: string
  provisao: Record<string, ProvisaoTipo>
}

export interface ProvisaoPayload {
  competencia: string
  meses: string[]
  tipos: string[]
  empresas: EmpresaProvisao[]
}

export interface Filters {
  empresa: string[]
  departamento: string[]
  periodoModo: PeriodoModo
  periodoMeses: number
  periodoInicio: string | null
  periodoFim: string | null
  contrato: string[]
  localizacao: string[]
}
