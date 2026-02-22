import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { salvarRequisicao } from '../utils/storage'

interface ScoreModel {
  PROBABILIDADE?: string
  TEXTO?: string
  CODIGONATUREZAMODELO?: string
  DESCRICAONATUREZA?: string
}

interface Decisao {
  APROVA?: string
  TEXTO?: string
}

interface ResultadoFormatado {
  nome?: string
  numeroResposta?: string
  score?: ScoreModel
  rendaPresumida?: ScoreModel
  limiteParcela?: ScoreModel
  decisao?: Decisao
}

export default function ConsultaCredito() {
  const [cpf, setCpf] = useState('')
  const [aluguel, setAluguel] = useState('')
  const [condominio, setCondominio] = useState('')
  const [seguro, setSeguro] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<any>(null)
  const [erro, setErro] = useState('')
  const navigate = useNavigate()

  const formatarCPF = (valor: string) => {
    const numeros = valor.replace(/\D/g, '')
    return numeros
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  }

  const formatarMoeda = (valor: string) => {
    const numeros = valor.replace(/\D/g, '')
    const numero = parseFloat(numeros) / 100
    return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const parseMoeda = (valor: string): number => {
    const numeros = valor.replace(/\D/g, '')
    return parseFloat(numeros) / 100
  }

  const parseJsonRecursive = (obj: any): any => {
    if (typeof obj === 'string') {
      try {
        // Tenta fazer parse se for string JSON
        const parsed = JSON.parse(obj)
        return parseJsonRecursive(parsed)
      } catch {
        return obj
      }
    } else if (Array.isArray(obj)) {
      return obj.map(item => parseJsonRecursive(item))
    } else if (obj !== null && typeof obj === 'object') {
      const result: any = {}
      for (const key in obj) {
        result[key] = parseJsonRecursive(obj[key])
      }
      return result
    }
    return obj
  }

  const extrairDadosFormatados = (data: any): ResultadoFormatado => {
    
    const bodyData = data?.body || data
    
    // Navegando pelo caminho: SPCA-XML/RESPOSTA/ACERTA
    const acerta = bodyData?.['SPCA-XML']?.RESPOSTA?.ACERTA || bodyData
    const scores = acerta?.['SCORE-CLASSIFICACAO-VARIOS-MODELOS'] || []
    
    // Extrair nome do inquilino
    const nome = acerta?.IDENTIFICACAO?.NOME || ''
    
    // Extrair número da resposta
    const numeroResposta = bodyData?.['SPCA-XML']?.RESPOSTA?.['NUMERO-RESPOSTA'] || ''
    
    // Buscar Score (POSITIVO PF - código 115)
    const score = scores.find((s: ScoreModel) => 
      s.CODIGONATUREZAMODELO === '115' 
    )
    
    // Buscar Renda Presumida (código 116)
    const rendaPresumida = scores.find((s: ScoreModel) => 
      s.CODIGONATUREZAMODELO === '116' 
    )
    
    // Buscar Limite de Parcela (código 109)
    const limiteParcela = scores.find((s: ScoreModel) => 
      s.CODIGONATUREZAMODELO === '109' 
    )
    
    // Buscar Decisão
    const decisao = acerta?.DECISAO
    
    return { nome, numeroResposta, score, rendaPresumida, limiteParcela, decisao }
  }

  const calcularRendaMedia = (textoRenda?: string): number => {
    if (!textoRenda) return 0
    
    // Extrai valores do tipo "De R$ 2.001 ate R$ 3.000"
    const valores = textoRenda.match(/R\$\s*([\d.]+)/g)
    if (!valores || valores.length !== 2) return 0
    
    const min = parseFloat(valores[0].replace(/[^\d]/g, ''))
    const max = parseFloat(valores[1].replace(/[^\d]/g, ''))
    
    return (min + max) / 2
  }

  const salvarResultado = async (aprovado: boolean, nomeInquilino: string, numeroResposta: string, dadosCompletos: string) => {
    const totalImovel = parseMoeda(aluguel) + parseMoeda(condominio) + parseMoeda(seguro)
    
    try {
      await salvarRequisicao({
        id: Date.now().toString(),
        nome: nomeInquilino,
        cpf: cpf,
        aluguel: parseMoeda(aluguel),
        condominio: parseMoeda(condominio),
        seguro: parseMoeda(seguro),
        valorTotal: totalImovel,
        aprovado: aprovado,
        status: aprovado ? 'aprovado' : 'reprovado',
        numeroResposta: numeroResposta,
        dadosCompletos: dadosCompletos,
        dataAnalise: new Date().toISOString()
      })
      
      // Redirecionar para dashboard após salvar
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
    } catch (error: any) {
      console.error('Erro ao salvar requisição:', error)
      console.error('Detalhes:', { message: error?.message, code: error?.code, details: error?.details, hint: error?.hint })
      alert('Erro ao salvar requisição: ' + (error?.message || 'Erro desconhecido'))
    }
  }

  const consultarAPI = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErro('')
    setResultado(null)

    try {
      // Remover formatação do CPF
      const cpfLimpo = cpf.replace(/\D/g, '')

      if (cpfLimpo.length !== 11) {
        setErro('CPF deve ter 11 dígitos')
        setLoading(false)
        return
      }

      // Validar campos de valores
      if (!aluguel || !condominio || !seguro) {
        setErro('Preencha todos os valores (aluguel, condomínio e seguro)')
        setLoading(false)
        return
      }

      // Corpo da requisição simplificado (Lambda faz o resto)
      const body = {
        cpf: cpfLimpo
      }

      console.log('Enviando para Lambda:', body)

      // Chamar Lambda proxy (não mais API SCPC direta)
      const response = await fetch(import.meta.env.VITE_SCPC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      console.log('Status Lambda:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`)
      }

      const data = await response.json()
      console.log('Resposta da Lambda:', data)
      setResultado(data)

    } catch (error: any) {
      console.error('Erro ao consultar API:', error)
      setErro('Erro ao consultar API: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="page">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>📊 Nova Análise de Crédito</h1>
          <button 
            onClick={() => navigate('/dashboard')}
            style={{ padding: '10px 20px' }}
          >
            ← Voltar ao Dashboard
          </button>
        </div>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Ambiente de homologação - dados fictícios
        </p>

        <form onSubmit={consultarAPI}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              CPF do Cliente
            </label>
            <input
              type="text"
              placeholder="Digite o CPF"
              value={cpf}
              onChange={(e) => setCpf(formatarCPF(e.target.value))}
              maxLength={14}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Aluguel
              </label>
              <input
                type="text"
                placeholder="R$ 0,00"
                value={aluguel}
                onChange={(e) => setAluguel(formatarMoeda(e.target.value))}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Condomínio
              </label>
              <input
                type="text"
                placeholder="R$ 0,00"
                value={condominio}
                onChange={(e) => setCondominio(formatarMoeda(e.target.value))}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Seguro
              </label>
              <input
                type="text"
                placeholder="R$ 0,00"
                value={seguro}
                onChange={(e) => setSeguro(formatarMoeda(e.target.value))}
                required
              />
            </div>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Consultando...' : 'Analisar Crédito'}
          </button>
        </form>

        {erro && (
          <div style={{
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            padding: '15px',
            borderRadius: '4px',
            marginTop: '20px',
            color: '#c33'
          }}>
            <strong>❌ Erro:</strong> {erro}
          </div>
        )}

        {resultado && (() => {
          const resultadoParsed = parseJsonRecursive(resultado)
          const dados = extrairDadosFormatados(resultadoParsed)
          
          // Usa apenas APROVA da API para decisão
          const aprovaAPI = dados.decisao?.APROVA || 'N'
          const creditoAprovado = aprovaAPI === 'S'
          const creditoCautela = aprovaAPI === 'C' 
          const totalImovel = parseMoeda(aluguel) + parseMoeda(condominio) + parseMoeda(seguro)
          const rendaMedia = calcularRendaMedia(dados.rendaPresumida?.TEXTO)
          
          // Salvar resultado automaticamente
          if (!resultado._salvo) {
            const dadosCompletosString = JSON.stringify(resultadoParsed)
            salvarResultado(
              creditoAprovado, 
              dados.nome || 'Nome não informado',
              dados.numeroResposta || '',
              dadosCompletosString
            )
            resultado._salvo = true
          }
          
          return (
            <div style={{ marginTop: '30px' }}>
              <h2 style={{ marginBottom: '20px', color: '#2563eb' }}>Resultado da Análise</h2>
              
              {/* Decisão Final */}
              <div style={{
                backgroundColor: creditoAprovado ? '#d1fae5' : creditoCautela ? '#fef3c7' : '#fee2e2',
                border: `2px solid ${creditoAprovado ? '#10b981' : creditoCautela ? '#f59e0b' : '#ef4444'}`,
                borderRadius: '12px',
                padding: '25px',
                marginBottom: '20px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                <h2 style={{ 
                  color: creditoAprovado ? '#065f46' : creditoCautela ? '#92400e' : '#991b1b', 
                  marginBottom: '15px',
                  fontSize: '24px'
                }}>
                  {creditoAprovado ? '✅ CRÉDITO APROVADO' : creditoCautela ? '⚠️ ANALISAR COM CAUTELA' : '❌ CRÉDITO REPROVADO'}
                </h2>
                <div style={{ 
                  fontSize: '16px', 
                  color: creditoAprovado ? '#047857' : creditoCautela ? '#b45309' : '#dc2626',
                  lineHeight: '1.8'
                }}>
                  <p><strong>CPF:</strong> {cpf}</p>
                  <p><strong>Valor Total do Imóvel:</strong> {totalImovel.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  
                  <p><strong>Renda Média Estimada:</strong> {rendaMedia.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  <p><strong></strong> {dados.decisao?.TEXTO}</p>
                  <p style={{ marginTop: '15px', fontStyle: 'italic', fontSize: '14px' }}>
                    Redirecionando para o dashboard em 2 segundos...
                  </p>
                </div>
              </div>

              {/* Detalhes Adicionais */}
              <details style={{ marginTop: '20px' }}>
                <summary style={{ 
                  cursor: 'pointer', 
                  fontWeight: 'bold',
                  color: '#4b5563',
                  padding: '10px',
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}>
                  📋 Ver detalhes da análise de crédito
                </summary>
                
                <div style={{ marginTop: '15px' }}>
              
              {/* Score Card */}
              {dados.score && (
                <div style={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '20px',
                  marginBottom: '15px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <h3 style={{ color: '#1f2937', marginBottom: '10px' }}>
                    🎯 {dados.score.DESCRICAONATUREZA}
                  </h3>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    <p><strong>Probabilidade:</strong> {dados.score.PROBABILIDADE}</p>
                    <p><strong>Descrição:</strong> {dados.score.TEXTO}</p>
                  </div>
                </div>
              )}

              {/* Renda Presumida Card */}
              {dados.rendaPresumida && (
                <div style={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '20px',
                  marginBottom: '15px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <h3 style={{ color: '#1f2937', marginBottom: '10px' }}>
                    💰 {dados.rendaPresumida.DESCRICAONATUREZA}
                  </h3>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    <p><strong>Faixa de Renda:</strong> {dados.rendaPresumida.TEXTO}</p>
                  </div>
                </div>
              )}

              {/* Limite de Parcela Card */}
              {dados.limiteParcela && (
                <div style={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '20px',
                  marginBottom: '15px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <h3 style={{ color: '#1f2937', marginBottom: '10px' }}>
                    💳 {dados.limiteParcela.DESCRICAONATUREZA}
                  </h3>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    <p><strong>Valor Sugerido:</strong> {dados.limiteParcela.TEXTO}</p>
                  </div>
                </div>
              )}

              {/* Decisão API Card */}
              {dados.decisao && (
                <div style={{
                  backgroundColor: dados.decisao.APROVA === 'S' ? '#dbeafe' : dados.decisao.APROVA === 'C' ? '#fef3c7' : '#fee2e2',
                  border: `1px solid ${dados.decisao.APROVA === 'S' ? '#93c5fd' : dados.decisao.APROVA === 'C' ? '#fbbf24' : '#fca5a5'}`,
                  borderRadius: '8px',
                  padding: '20px',
                  marginBottom: '15px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <h3 style={{ 
                    color: dados.decisao.APROVA === 'S' ? '#1e40af' : dados.decisao.APROVA === 'C' ? '#92400e' : '#991b1b', 
                    marginBottom: '10px' 
                  }}>
                    {dados.decisao.APROVA === 'S' ? '✅' : dados.decisao.APROVA === 'C' ? '⚠️' : '❌'} 
                  </h3>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: 'bold',
                    color: dados.decisao.APROVA === 'S' ? '#1e40af' : dados.decisao.APROVA === 'C' ? '#b45309' : '#dc2626'
                  }}>
                    {dados.decisao.TEXTO}
                  </div>
                </div>
              )}
              
              </div>
              </details>

              {/* Dados Completos (Expandível) */}
              <details style={{
                marginTop: '20px',
                padding: '15px',
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}>
                <summary style={{ 
                  cursor: 'pointer', 
                  fontWeight: 'bold',
                  color: '#4b5563'
                }}>
                  🔍 Ver dados completos da API
                </summary>
                <pre style={{
                  marginTop: '15px',
                  whiteSpace: 'pre',
                  fontSize: '13px',
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                  backgroundColor: '#1e293b',
                  color: '#e2e8f0',
                  padding: '20px',
                  borderRadius: '6px',
                  overflowX: 'auto',
                  overflowY: 'auto',
                  maxHeight: '500px',
                  lineHeight: '1.6',
                  border: '1px solid #334155'
                }}>
                  {JSON.stringify(resultadoParsed, null, 2)}
                </pre>
              </details>
            </div>
          )
        })()}

       
      </div>
    </div>
  )
}
