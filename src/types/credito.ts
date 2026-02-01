export interface RequisicaoCredito {
  id: string
  cpf: string
  aluguel: number
  condominio: number
  seguro: number
  valorTotal: number
  aprovado: boolean
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
