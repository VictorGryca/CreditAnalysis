import { RequisicaoCredito } from '../types/credito'
import { supabase } from '../supabaseClient'

export const salvarRequisicao = async (requisicao: RequisicaoCredito) => {
  const { error } = await supabase
    .from('requisicoes_credito')
    .insert([{
      id: requisicao.id,
      nome: requisicao.nome,
      cpf: requisicao.cpf,
      aluguel: requisicao.aluguel,
      condominio: requisicao.condominio,
      seguro: requisicao.seguro,
      valor_total: requisicao.valorTotal,
      aprovado: requisicao.aprovado,
      aprovacao_manual: requisicao.aprovacaoManual,
      status: requisicao.status,
      numero_resposta: requisicao.numeroResposta,
      dados_completos: requisicao.dadosCompletos,
      data_analise: requisicao.dataAnalise
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
    nome: item.nome || '',
    cpf: item.cpf,
    aluguel: parseFloat(item.aluguel),
    condominio: parseFloat(item.condominio),
    seguro: parseFloat(item.seguro),
    valorTotal: parseFloat(item.valor_total),
    aprovado: item.aprovado,
    aprovacaoManual: item.aprovacao_manual,
    status: item.status || (item.aprovado ? 'aprovado' : 'reprovado'),
    numeroResposta: item.numero_resposta,
    dadosCompletos: item.dados_completos,
    dataAnalise: item.data_analise
  }))
}

export const atualizarRequisicao = async (id: string, dados: Partial<RequisicaoCredito>) => {
  const updateData: any = {}
  
  if (dados.status !== undefined) updateData.status = dados.status
  if (dados.aprovacaoManual !== undefined) updateData.aprovacao_manual = dados.aprovacaoManual
  if (dados.numeroResposta !== undefined) updateData.numero_resposta = dados.numeroResposta
  if (dados.dadosCompletos !== undefined) updateData.dados_completos = dados.dadosCompletos
  
  const { error } = await supabase
    .from('requisicoes_credito')
    .update(updateData)
    .eq('id', id)
  
  if (error) {
    console.error('Erro ao atualizar requisição:', error)
    throw error
  }
}
