import { RequisicaoCredito, ContratoAtivo } from '../types/credito'
import { supabase } from '../supabaseClient'

export const salvarRequisicao = async (requisicao: RequisicaoCredito) => {
  const { error } = await supabase
    .from('requisicoes_credito')
    .insert([{
      id: requisicao.id,
      cpf: requisicao.cpf,
      aluguel: requisicao.aluguel,
      condominio: requisicao.condominio,
      seguro: requisicao.seguro,
      valor_total: requisicao.valorTotal,
      aprovado: requisicao.aprovado,
      aprovacao_manual: requisicao.aprovacaoManual,
      status: requisicao.status,
      data_analise: requisicao.dataAnalise,
      contrato_assinado: requisicao.contratoAssinado,
      data_assinatura: requisicao.dataAssinatura
    }])
  
  if (error) {
    console.error('Erro ao salvar requisição:', error)
    console.error('Detalhes:', { message: error.message, code: error.code, details: error.details, hint: error.hint })
    throw error
  }
}

export const listarRequisicoes = async (): Promise<RequisicaoCredito[]> => {
  const { data, error } = await supabase
    .from('requisicoes_credito')
    .select('*')
    .order('data_analise', { ascending: false })
  
  if (error) {
    console.error('Erro ao listar requisições:', error)
    return []
  }
  
  return (data || []).map(item => ({
    id: item.id,
    cpf: item.cpf,
    aluguel: parseFloat(item.aluguel),
    condominio: parseFloat(item.condominio),
    seguro: parseFloat(item.seguro),
    valorTotal: parseFloat(item.valor_total),
    aprovado: item.aprovado,
    aprovacaoManual: item.aprovacao_manual,
    status: item.status || (item.aprovado ? 'aprovado' : 'reprovado'),
    dataAnalise: item.data_analise,
    contratoAssinado: item.contrato_assinado,
    dataAssinatura: item.data_assinatura
  }))
}

export const atualizarRequisicao = async (id: string, dados: Partial<RequisicaoCredito>) => {
  const updateData: any = {}
  
  if (dados.contratoAssinado !== undefined) updateData.contrato_assinado = dados.contratoAssinado
  if (dados.dataAssinatura !== undefined) updateData.data_assinatura = dados.dataAssinatura
  if (dados.status !== undefined) updateData.status = dados.status
  if (dados.aprovacaoManual !== undefined) updateData.aprovacao_manual = dados.aprovacaoManual
  
  const { error } = await supabase
    .from('requisicoes_credito')
    .update(updateData)
    .eq('id', id)
  
  if (error) {
    console.error('Erro ao atualizar requisição:', error)
    throw error
  }
}

export const salvarContrato = async (contrato: ContratoAtivo) => {
  const { error } = await supabase
    .from('contratos_ativos')
    .insert([{
      id: contrato.id,
      cpf: contrato.cpf,
      valor_assegurado: contrato.valorAssegurado,
      data_assinatura: contrato.dataAssinatura
    }])
  
  if (error) {
    console.error('Erro ao salvar contrato:', error)
    throw error
  }
}

export const listarContratos = async (): Promise<ContratoAtivo[]> => {
  const { data, error } = await supabase
    .from('contratos_ativos')
    .select('*')
    .order('data_assinatura', { ascending: false })
  
  if (error) {
    console.error('Erro ao listar contratos:', error)
    return []
  }
  
  return (data || []).map(item => ({
    id: item.id,
    cpf: item.cpf,
    valorAssegurado: parseFloat(item.valor_assegurado),
    dataAssinatura: item.data_assinatura
  }))
}

export const removerContrato = async (id: string) => {
  const { error } = await supabase
    .from('contratos_ativos')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Erro ao remover contrato:', error)
    throw error
  }
}
