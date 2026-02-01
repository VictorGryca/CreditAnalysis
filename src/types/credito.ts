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
  dataAnalise: string
  contratoAssinado?: boolean
  dataAssinatura?: string
}

export interface ContratoAtivo {
  id: string
  cpf: string
  valorAssegurado: number
  dataAssinatura: string
}
