import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAuthSession, signOut } from 'aws-amplify/auth'
import { RequisicaoCredito, StatusRequisicao } from '../types/credito'
import { listarRequisicoes, atualizarRequisicao, salvarContrato } from '../utils/storage'

export default function Dashboard() {
  const [requisicoes, setRequisicoes] = useState<RequisicaoCredito[]>([])
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const navigate = useNavigate()

  const colunas: { status: StatusRequisicao, titulo: string, cor: string }[] = [
    { status: 'reprovado', titulo: 'Reprovado', cor: '#ef4444' },
    { status: 'aprovado', titulo: 'Aprovado', cor: '#10b981' },
    { status: 'em-andamento', titulo: 'Em Andamento', cor: '#3b82f6' },
    { status: 'regular', titulo: 'Regular', cor: '#f59e0b' },
    { status: 'cancelado', titulo: 'Cancelado', cor: '#6b7280' }
  ]

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

  const mudarStatus = async (requisicao: RequisicaoCredito, novoStatus: StatusRequisicao) => {
    try {
      await atualizarRequisicao(requisicao.id, { status: novoStatus })
      await carregarRequisicoes()
    } catch (error) {
      console.error('Erro ao mudar status:', error)
      alert('Erro ao atualizar status')
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
      <div className="page" style={{ maxWidth: '100%', padding: '20px' }}>
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
          <div style={{ 
            display: 'flex', 
            gap: '20px', 
            overflowX: 'auto',
            paddingBottom: '20px'
          }}>
            {colunas.map(coluna => {
              const requisicoesDaColuna = requisicoes.filter(req => req.status === coluna.status)
              
              return (
                <div 
                  key={coluna.status}
                  style={{ 
                    minWidth: '300px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '12px',
                    padding: '15px',
                    flex: '1'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '15px',
                    paddingBottom: '10px',
                    borderBottom: `3px solid ${coluna.cor}`
                  }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
                      {coluna.titulo}
                    </h3>
                    <span style={{
                      backgroundColor: coluna.cor,
                      color: 'white',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {requisicoesDaColuna.length}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {requisicoesDaColuna.map(req => (
                      <div
                        key={req.id}
                        style={{
                          backgroundColor: 'white',
                          border: `2px solid ${coluna.cor}`,
                          borderRadius: '8px',
                          padding: '12px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                          <p style={{ fontWeight: 'bold', marginBottom: '8px', color: '#111' }}>
                            CPF: {req.cpf}
                          </p>
                          <p style={{ color: '#374151' }}>
                            <strong>Valor:</strong> {req.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                          <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px' }}>
                            {new Date(req.dataAnalise).toLocaleDateString('pt-BR')}
                          </p>
                          
                          {req.contratoAssinado && (
                            <div style={{
                              marginTop: '8px',
                              padding: '6px',
                              backgroundColor: '#d1fae5',
                              borderRadius: '4px',
                              fontSize: '11px',
                              color: '#065f46',
                              fontWeight: 'bold',
                              textAlign: 'center'
                            }}>
                              ✓ Contrato Assinado
                            </div>
                          )}
                          
                          <select
                            value={req.status}
                            onChange={(e) => mudarStatus(req, e.target.value as StatusRequisicao)}
                            style={{
                              marginTop: '10px',
                              width: '100%',
                              padding: '6px',
                              fontSize: '12px',
                              borderRadius: '4px',
                              border: '1px solid #d1d5db',
                              backgroundColor: 'white',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="reprovado">Reprovado</option>
                            <option value="aprovado">Aprovado</option>
                            <option value="em-andamento">Em Andamento</option>
                            <option value="regular">Regular</option>
                            <option value="cancelado">Cancelado</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
