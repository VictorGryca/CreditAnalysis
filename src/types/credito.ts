export type StatusRequisicao = 'reprovado' | 'aprovado' | 'em-andamento' | 'regular' | 'cancelado'

export interface RequisicaoCredito {
  id: string
  nome: string
  cpf: string
  aluguel: number
  condominio: number
  seguro: number
  valorTotal: number
  aprovado: boolean
  aprovacaoManual?: boolean
  status: StatusRequisicao
  numeroResposta?: string
  dadosCompletos?: string
  dataAnalise: string
}
