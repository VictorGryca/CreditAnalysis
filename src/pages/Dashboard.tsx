import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAuthSession, signOut } from 'aws-amplify/auth'
import { RequisicaoCredito } from '../types/credito'
import { listarRequisicoes, atualizarRequisicao, salvarContrato } from '../utils/storage'

export default function Dashboard() {
  const [requisicoes, setRequisicoes] = useState<RequisicaoCredito[]>([])
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    checkUser()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isCheckingAuth) {
      carregarRequisicoes()
    }
  }, [isCheckingAuth])

  const carregarRequisicoes = async () => {
    const dados = await listarRequisicoes()
    setRequisicoes(dados)
  }

  const checkUser = async () => {
    try {
      // Aguardar um pouco para o Amplify inicializar
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const session = await fetchAuthSession({ forceRefresh: false })
      console.log('Sessão Dashboard:', session)
      
      if (!session.tokens) {
        console.log('Sem tokens, redirecionando para login...')
        navigate('/')
        return
      }
      
      // Sessão válida!
      console.log('Sessão válida, carregando dados...')
      setIsCheckingAuth(false)
    } catch (error) {
      console.error('Erro ao verificar sessão:', error)
      // Não redirecionar em caso de erro, pode ser temporário
      setIsCheckingAuth(false)
    }
  }

  const marcarContratoAssinado = async (requisicao: RequisicaoCredito, assinado: boolean) => {
    const dataAssinatura = assinado ? new Date().toISOString() : undefined
    
    try {
      await atualizarRequisicao(requisicao.id, { 
        contratoAssinado: assinado,
        dataAssinatura 
      })
      
      if (assinado) {
        // Criar contrato ativo
        await salvarContrato({
          id: requisicao.id,
          cpf: requisicao.cpf,
          valorAssegurado: requisicao.valorTotal,
          dataAssinatura: dataAssinatura!
        })
      }
      
      await carregarRequisicoes()
    } catch (error) {
      console.error('Erro ao marcar contrato:', error)
      alert('Erro ao atualizar contrato')
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="container">
        <div className="page">
          <p>Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="page">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1>📋 Requisições de Crédito</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => navigate('/consulta-credito')} 
              style={{ width: 'auto', padding: '12px 24px', backgroundColor: '#2563eb', fontSize: '16px' }}
            >
              ➕ Nova Análise
            </button>
            <button 
              onClick={() => navigate('/contratos-ativos')} 
              style={{ width: 'auto', padding: '12px 24px', backgroundColor: '#10b981', fontSize: '16px' }}
            >
              📄 Contratos Ativos
            </button>
            <button onClick={handleLogout} style={{ width: 'auto', padding: '12px 24px' }}>
              🚪 Sair
            </button>
          </div>
        </div>

        {requisicoes.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
            border: '2px dashed #d1d5db'
          }}>
            <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '20px' }}>
              Nenhuma requisição de crédito registrada ainda.
            </p>
            <button 
              onClick={() => navigate('/consulta-credito')}
              style={{ padding: '12px 24px', fontSize: '16px' }}
            >
              Fazer Primeira Análise
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {requisicoes.map((req) => (
              <div
                key={req.id}
                style={{
                  backgroundColor: req.aprovado ? '#d1fae5' : '#fee2e2',
                  border: `2px solid ${req.aprovado ? '#10b981' : '#ef4444'}`,
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ 
                      color: req.aprovado ? '#065f46' : '#991b1b',
                      marginBottom: '10px',
                      fontSize: '20px'
                    }}>
                      {req.aprovado ? '✅ APROVADO' : '❌ REPROVADO'}
                    </h3>
                    <div style={{ 
                      color: req.aprovado ? '#047857' : '#dc2626',
                      fontSize: '14px',
                      lineHeight: '1.8'
                    }}>
                      <p><strong>CPF:</strong> {req.cpf}</p>
                      <p><strong>Valor Total:</strong> {req.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                      <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>
                        Aluguel: {req.aluguel.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} | 
                        Condomínio: {req.condominio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} | 
                        Seguro: {req.seguro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                      <p style={{ fontSize: '12px', color: '#6b7280' }}>
                        Data: {new Date(req.dataAnalise).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  <div style={{ marginLeft: '20px' }}>
                    {req.contratoAssinado === undefined ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <p style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                          Contrato assinado?
                        </p>
                        <button
                          onClick={() => marcarContratoAssinado(req, true)}
                          style={{ 
                            padding: '8px 16px',
                            backgroundColor: '#10b981',
                            color: 'white',
                            fontSize: '14px'
                          }}
                        >
                          ✓ Sim
                        </button>
                        <button
                          onClick={() => marcarContratoAssinado(req, false)}
                          style={{ 
                            padding: '8px 16px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            fontSize: '14px'
                          }}
                        >
                          ✗ Não
                        </button>
                      </div>
                    ) : req.contratoAssinado ? (
                      <div style={{
                        padding: '12px 16px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        borderRadius: '8px',
                        textAlign: 'center',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}>
                        ✓ Contrato Assinado
                        {req.dataAssinatura && (
                          <p style={{ fontSize: '11px', marginTop: '5px', opacity: 0.9 }}>
                            {new Date(req.dataAssinatura).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
