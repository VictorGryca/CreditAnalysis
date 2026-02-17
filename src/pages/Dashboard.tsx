import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAuthSession, signOut } from 'aws-amplify/auth'
import { RequisicaoCredito, StatusRequisicao } from '../types/credito'
import { listarRequisicoes, atualizarRequisicao } from '../utils/storage'

export default function Dashboard() {
  const [requisicoes, setRequisicoes] = useState<RequisicaoCredito[]>([])
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [modalConfirmacao, setModalConfirmacao] = useState<{
    aberto: boolean
    requisicao: RequisicaoCredito | null
    novoStatus: StatusRequisicao | null
  }>({ aberto: false, requisicao: null, novoStatus: null })
  const [modalAviso, setModalAviso] = useState<{
    aberto: boolean
    mensagem: string
  }>({ aberto: false, mensagem: '' })
  const [modalDetalhes, setModalDetalhes] = useState<{
    aberto: boolean
    requisicao: RequisicaoCredito | null
  }>({ aberto: false, requisicao: null })
  const [jsonCopiado, setJsonCopiado] = useState(false)
  const [draggedItem, setDraggedItem] = useState<RequisicaoCredito | null>(null)
  const [buscaPorColuna, setBuscaPorColuna] = useState<Record<StatusRequisicao, string>>({
    'reprovado': '',
    'aprovado': '',
    'em-andamento': '',
    'regular': '',
    'cancelado': ''
  })
  const navigate = useNavigate()

  const colunas: { status: StatusRequisicao, titulo: string, cor: string }[] = [
    { status: 'reprovado', titulo: 'Reprovado', cor: '#ef4444' },
    { status: 'aprovado', titulo: 'Aprovado', cor: '#10b981' },
    { status: 'em-andamento', titulo: 'Em Andamento', cor: '#3b82f6' },
    { status: 'regular', titulo: 'Regular', cor: '#f59e0b' },
    { status: 'cancelado', titulo: 'Cancelado', cor: '#6b7280' }
  ]

  const statusNomes: Record<StatusRequisicao, string> = {
    'reprovado': 'Reprovado',
    'aprovado': 'Aprovado',
    'em-andamento': 'Em Andamento',
    'regular': 'Regular',
    'cancelado': 'Cancelado'
  }

  useEffect(() => {
    checkUser()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isCheckingAuth) {
      carregarRequisicoes()
    }
  }, [isCheckingAuth])

  // Detectar tecla ESC para fechar modal
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && modalDetalhes.aberto) {
        setModalDetalhes({ aberto: false, requisicao: null })
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [modalDetalhes.aberto])

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

  const validarTransicaoStatus = (statusAtual: StatusRequisicao, novoStatus: StatusRequisicao): { valido: boolean, mensagem?: string } => {
    // Cancelado pode receber de qualquer coluna
    if (novoStatus === 'cancelado') {
      return { valido: true }
    }

    // Definir fluxo permitido
    const fluxoPermitido: Record<StatusRequisicao, StatusRequisicao[]> = {
      'reprovado': ['aprovado', 'cancelado'],
      'aprovado': ['em-andamento', 'cancelado'],
      'em-andamento': ['regular', 'cancelado'],
      'regular': ['cancelado'],
      'cancelado': [] // Não pode sair de cancelado
    }

    const statusPermitidos = fluxoPermitido[statusAtual] || []
    
    if (!statusPermitidos.includes(novoStatus)) {
      const proximosValidos = statusPermitidos.filter(s => s !== 'cancelado').map(s => statusNomes[s]).join(', ')
      return { 
        valido: false, 
        mensagem: `Não é possível mover de "${statusNomes[statusAtual]}" para "${statusNomes[novoStatus]}" diretamente.\n\nPróximos status permitidos: ${proximosValidos || 'Nenhum (somente Cancelado)'}`
      }
    }

    return { valido: true }
  }

  const mudarStatus = (requisicao: RequisicaoCredito, novoStatus: StatusRequisicao) => {
    if (requisicao.status === novoStatus) return
    
    // Validar transição
    const validacao = validarTransicaoStatus(requisicao.status, novoStatus)
    if (!validacao.valido) {
      setModalAviso({ aberto: true, mensagem: validacao.mensagem || '' })
      carregarRequisicoes() // Recarregar para resetar o select
      return
    }
    
    setModalConfirmacao({
      aberto: true,
      requisicao,
      novoStatus
    })
  }

  const confirmarMudancaStatus = async () => {
    const { requisicao, novoStatus } = modalConfirmacao
    if (!requisicao || !novoStatus) return
    
    const dadosAtualizacao: Partial<RequisicaoCredito> = { status: novoStatus }
    
    // Se estava reprovado pelo sistema e está sendo movido para aprovado, marcar como aprovação manual
    if (!requisicao.aprovado && novoStatus === 'aprovado') {
      dadosAtualizacao.aprovacaoManual = true
    }
    
    try {
      await atualizarRequisicao(requisicao.id, dadosAtualizacao)
      await carregarRequisicoes()
      setModalConfirmacao({ aberto: false, requisicao: null, novoStatus: null })
    } catch (error) {
      console.error('Erro ao mudar status:', error)
      alert('Erro ao atualizar status')
    }
  }

  const handleDragStart = (requisicao: RequisicaoCredito) => {
    setDraggedItem(requisicao)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (novoStatus: StatusRequisicao) => {
    if (!draggedItem || draggedItem.status === novoStatus) {
      setDraggedItem(null)
      return
    }

    mudarStatus(draggedItem, novoStatus)
    setDraggedItem(null)
  }

  const cancelarMudancaStatus = async () => {
    setModalConfirmacao({ aberto: false, requisicao: null, novoStatus: null })
    await carregarRequisicoes()
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
        {/* Modal de Confirmação */}
        {modalConfirmacao.aberto && modalConfirmacao.requisicao && modalConfirmacao.novoStatus && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '30px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
              animation: 'slideIn 0.2s ease-out'
            }}>
              <h2 style={{ 
                margin: '0 0 20px 0', 
                fontSize: '22px',
                color: '#111',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                ⚠️ Confirmar Alteração
              </h2>
              
              <p style={{ fontSize: '16px', color: '#374151', lineHeight: '1.6', marginBottom: '20px' }}>
                Tem certeza que deseja alterar o status desta requisição?
              </p>

              <div style={{
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '25px',
                border: '1px solid #e5e7eb'
              }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6b7280' }}>
                  <strong>CPF:</strong> {modalConfirmacao.requisicao.cpf}
                </p>
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6b7280' }}>
                  <strong>Valor:</strong> {modalConfirmacao.requisicao.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  marginTop: '15px',
                  fontSize: '15px',
                  fontWeight: 'bold'
                }}>
                  <span style={{ 
                    padding: '6px 12px', 
                    borderRadius: '6px', 
                    backgroundColor: '#e5e7eb',
                    color: '#374151'
                  }}>
                    {statusNomes[modalConfirmacao.requisicao.status]}
                  </span>
                  <span style={{ fontSize: '18px' }}>→</span>
                  <span style={{ 
                    padding: '6px 12px', 
                    borderRadius: '6px', 
                    backgroundColor: colunas.find(c => c.status === modalConfirmacao.novoStatus)?.cor || '#6b7280',
                    color: 'white'
                  }}>
                    {statusNomes[modalConfirmacao.novoStatus]}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={cancelarMudancaStatus}
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    backgroundColor: '#e5e7eb',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#d1d5db'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarMudancaStatus}
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Aviso */}
        {modalAviso.aberto && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '30px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
              animation: 'slideIn 0.2s ease-out'
            }}>
              <h2 style={{ 
                margin: '0 0 20px 0', 
                fontSize: '22px',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                🚫 Ação Não Permitida
              </h2>
              
              <div style={{
                backgroundColor: '#fef2f2',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '25px',
                border: '1px solid #fecaca'
              }}>
                <p style={{ 
                  fontSize: '15px', 
                  color: '#374151', 
                  lineHeight: '1.6', 
                  margin: 0,
                  whiteSpace: 'pre-line'
                }}>
                  {modalAviso.mensagem}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setModalAviso({ aberto: false, mensagem: '' })}
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                >
                  Entendi
                </button>
              </div>
            </div>
          </div>
        )}

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
              const termoBusca = buscaPorColuna[coluna.status].toLowerCase()
              const requisicoesDaColuna = requisicoes
                .filter(req => req.status === coluna.status)
                .filter(req => 
                  termoBusca === '' || req.nome.toLowerCase().includes(termoBusca)
                )
              
              return (
                <div 
                  key={coluna.status}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(coluna.status)}
                  style={{ 
                    minWidth: '200px',
                    backgroundColor: draggedItem && draggedItem.status !== coluna.status ? '#e0f2fe' : '#f9fafb',
                    borderRadius: '12px',
                    padding: '15px',
                    flex: '1',
                    transition: 'background-color 0.2s'
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

                  {/* Barra de busca */}
                  <div style={{ marginBottom: '15px' }}>
                    <input
                      type="text"
                      placeholder="🔍 Buscar por nome..."
                      value={buscaPorColuna[coluna.status]}
                      onChange={(e) => setBuscaPorColuna({
                        ...buscaPorColuna,
                        [coluna.status]: e.target.value
                      })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        fontSize: '13px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: 'white',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = coluna.cor}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {requisicoesDaColuna.map(req => (
                      <div
                        key={req.id}
                        draggable
                        onDragStart={() => handleDragStart(req)}
                        onClick={() => setModalDetalhes({ aberto: true, requisicao: req })}
                        style={{
                          backgroundColor: 'white',
                          border: `2px solid ${coluna.cor}`,
                          borderRadius: '8px',
                          padding: '12px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          cursor: 'pointer',
                          opacity: draggedItem?.id === req.id ? 0.5 : 1,
                          transition: 'opacity 0.2s, transform 0.2s',
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        {req.aprovacaoManual && (
                          <div style={{
                            marginBottom: '8px',
                            padding: '6px 8px',
                            backgroundColor: '#fef3c7',
                            border: '1px solid #fbbf24',
                            borderRadius: '4px',
                            fontSize: '11px',
                            color: '#92400e',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            ⚠️ Aprovação Manual
                            <span style={{ fontSize: '10px', fontWeight: 'normal' }}>
                              (Reprovado pelo sistema)
                            </span>
                          </div>
                        )}
                        
                        <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                          <p style={{ fontWeight: 'bold', marginBottom: '4px', color: '#111', fontSize: '14px' }}>
                            {req.nome}
                          </p>
                          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                            CPF: {req.cpf}
                          </p>
                          <p style={{ color: '#374151' }}>
                            <strong>Valor:</strong> {req.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                          <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px' }}>
                            {new Date(req.dataAnalise).toLocaleDateString('pt-BR')}
                          </p>
                          
                          <select
                            value={req.status}
                            onChange={(e) => mudarStatus(req, e.target.value as StatusRequisicao)}
                            onClick={(e) => e.stopPropagation()}
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

        {/* Modal de Detalhes */}
        {modalDetalhes.aberto && modalDetalhes.requisicao && (() => {
          const req = modalDetalhes.requisicao
          let dadosParsed: any = null
          
          if (req.dadosCompletos) {
            try {
              dadosParsed = JSON.parse(req.dadosCompletos)
            } catch (e) {
              console.error('Erro ao fazer parse dos dados:', e)
            }
          }

          const bodyData = dadosParsed?.body || dadosParsed
          const acerta = bodyData?.['SPCA-XML']?.RESPOSTA?.ACERTA
          const scores = acerta?.['SCORE-CLASSIFICACAO-VARIOS-MODELOS'] || []
          
          const score = scores.find((s: any) => s.CODIGONATUREZAMODELO === '115' || s.CODIGONATUREZAMODELO === 115)
          const rendaPresumida = scores.find((s: any) => s.CODIGONATUREZAMODELO === '116' || s.CODIGONATUREZAMODELO === 116)
          const limiteParcela = scores.find((s: any) => s.CODIGONATUREZAMODELO === '109' || s.CODIGONATUREZAMODELO === 109)
          const decisao = acerta?.DECISAO
          const identificacao = acerta?.IDENTIFICACAO
          const localizacao = acerta?.LOCALIZACAO

          // Mapear estado civil
          const estadoCivilMap: Record<string, string> = {
            '0': 'NÃO INFORMADO',
            '1': 'CASADO',
            '2': 'SOLTEIRO',
            '3': 'VIÚVO',
            '4': 'DIVORCIADO/DESQUITADO',
            '5': 'SEPARADO',
            '6': 'COMPANHEIRO / UNIÃO ESTÁVEL',
            '9': 'OUTROS'
          }

          // Calcular idade
          const calcularIdade = (dataNascimento: string) => {
            if (!dataNascimento) return null
            const [dia, mes, ano] = dataNascimento.split('/').map(Number)
            const nascimento = new Date(ano, mes - 1, dia)
            const hoje = new Date()
            let idade = hoje.getFullYear() - nascimento.getFullYear()
            const mesAtual = hoje.getMonth()
            const diaAtual = hoje.getDate()
            if (mesAtual < mes - 1 || (mesAtual === mes - 1 && diaAtual < dia)) {
              idade--
            }
            return idade
          }

          return (
            <div 
              onClick={() => setModalDetalhes({ aberto: false, requisicao: null })}
              style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px'
            }}>
              <div 
                onClick={(e) => e.stopPropagation()}
                style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '30px',
                maxWidth: '700px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ margin: 0, color: '#1f2937' }}>📊 Detalhes da Análise</h2>
                  <button
                    onClick={() => setModalDetalhes({ aberto: false, requisicao: null })}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '24px',
                      cursor: 'pointer',
                      color: '#6b7280',
                      padding: '0',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '4px'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#374151' }}>{req.nome}</h3>
                  <p style={{ margin: '5px 0', fontSize: '14px', color: '#6b7280' }}>CPF: {req.cpf}</p>
                  <p style={{ margin: '5px 0', fontSize: '14px', color: '#6b7280' }}>
                    Data da Análise: {new Date(req.dataAnalise).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p style={{ margin: '5px 0', fontSize: '14px', color: '#6b7280' }}>
                    Valor Total: {req.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                  {req.numeroResposta && (
                    <p style={{ margin: '5px 0', fontSize: '12px', color: '#9ca3af' }}>
                      Nº Resposta: {req.numeroResposta}
                    </p>
                  )}
                </div>

                {!dadosParsed ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                    ℹ️ Dados completos não disponíveis para esta requisição
                  </div>
                ) : (
                  <>
                    {/* Identificação Card */}
                    {identificacao && (
                      <div style={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '20px',
                        marginBottom: '15px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}>
                        <h3 style={{ color: '#1f2937', marginBottom: '15px', fontSize: '16px', fontWeight: 'bold' }}>
                          👤 Identificação
                        </h3>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                          {identificacao['DATANASCIMENTO'] && (
                            <div style={{ display: 'flex', gap: '20px', marginBottom: '8px' }}>
                              <p style={{ margin: 0 }}>
                                <strong>Data de Nascimento:</strong> {identificacao['DATANASCIMENTO']}
                              </p>
                              <p style={{ margin: 0 }}>
                                <strong>Idade:</strong> {calcularIdade(identificacao['DATANASCIMENTO'])} anos
                              </p>
                            </div>
                          )}
                          {identificacao['NOMEMAE'] && (
                            <p style={{ margin: '8px 0' }}>
                              <strong>Nome da Mãe:</strong> {identificacao['NOMEMAE']}
                            </p>
                          )}
                          {identificacao['ESTADOCIVIL'] && (
                            <p style={{ margin: '8px 0' }}>
                              <strong>Estado Civil:</strong> {estadoCivilMap[identificacao['ESTADOCIVIL']] || identificacao['ESTADO-CIVIL']}
                            </p>
                          )}
                          {localizacao['NOMELOGRADOURO'] && (
                            <p style={{ margin: '8px 0' }}>
                              <strong>Endereço:</strong>{' '}
                              {localizacao['TIPOLOGRADOURO']}.{' '}
                              {localizacao['NOMELOGRADOURO']}, {localizacao['NUMEROLOGRADOURO']} - {' '}
                              {localizacao['BAIRRO']}, {localizacao['CIDADE']} - {' '}
                              {localizacao['UNIDADEFEDERATIVA']}, {localizacao['CEP']}
                            </p>
                          )}
                          

                        </div>
                      </div>
                    )}



                    {/* Score Card */}
                    {score && (
                      <div style={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '20px',
                        marginBottom: '15px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}>
                        <h3 style={{ color: '#1f2937', marginBottom: '10px' }}>
                          📊 {'Classificação'}
                        </h3>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                          <p><strong>Score:</strong> {score.SCORE}</p>
                          <p><strong>Taxa Inadimplência:</strong> {score.PROBABILIDADE/100}%</p>
                          <p><strong>Classificação:</strong> {score.TEXTO}</p>
                          
                        </div>
                      </div>
                    )}

                    {/* Renda Presumida Card */}
                    {rendaPresumida && (
                      <div style={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '20px',
                        marginBottom: '15px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}>
                        <h3 style={{ color: '#1f2937', marginBottom: '10px' }}>
                          💰 {'Renda Presumida'}
                        </h3>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                          <p><strong>Faixa de Renda:</strong> {rendaPresumida.TEXTO}</p>
                        </div>
                      </div>
                    )}

                    {/* Limite de Parcela Card */}
                    {limiteParcela && (
                      <div style={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '20px',
                        marginBottom: '15px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}>
                        <h3 style={{ color: '#1f2937', marginBottom: '10px' }}>
                          💳 {'Limite de Parcelas'}
                        </h3>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                          <p><strong>Valor Sugerido:</strong> {limiteParcela.TEXTO}</p>
                        </div>
                      </div>
                    )}

                    {/* Resumo de Títulos Protestados Card */}
                    {(() => {
                      const resumoProtestados = bodyData?.['SPCA-XML']?.RESPOSTA?.ACERTA?.['RESUMO-TITULOS-PROTESTADOS'];
                      if (!resumoProtestados) return null;

                      // Se não há registro válido, mostra que não há dados
                      if (resumoProtestados.REGISTRO !== 'S') {
                        return (
                          <div style={{
                            backgroundColor: '#f3f4f6',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            padding: '20px',
                            marginBottom: '15px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                          }}>
                            <h3 style={{ color: '#6b7280', marginBottom: '10px' }}>
                              📋 Títulos Protestados
                            </h3>
                            <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                              <p>Sem informações de protestos disponíveis</p>
                            </div>
                          </div>
                        );
                      }

                      // Há registro válido - mostra os dados
                      const total = parseInt(resumoProtestados.TOTAL) || 0;
                      return (
                        <div style={{
                          backgroundColor: total > 0 ? '#fef3c7' : '#d1fae5',
                          border: `1px solid ${total > 0 ? '#fbbf24' : '#6ee7b7'}`,
                          borderRadius: '8px',
                          padding: '20px',
                          marginBottom: '15px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}>
                          <h3 style={{ 
                            color: total > 0 ? '#92400e' : '#065f46',
                            marginBottom: '10px' 
                          }}>
                            {total > 0 ? '⚠️' : '✅'} Títulos Protestados
                          </h3>
                          <div style={{ fontSize: '14px', color: '#6b7280' }}>
                            <p><strong>Total de Protestos:</strong> {total}</p>
                            {total > 0 && (
                              <>
                                <p><strong>Período:</strong> {resumoProtestados.PERIODOINICIAL} a {resumoProtestados.PERIODOFINAL}</p>
                                <p><strong>Valor Acumulado:</strong> {resumoProtestados.MOEDA} {resumoProtestados.VALORACUMULADO}</p>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Decisão API Card */}
                    {decisao && (
                      <div style={{
                        backgroundColor: decisao.APROVA === 'S' ? '#dbeafe' : decisao.APROVA === 'C' ? '#fef3c7' : '#fee2e2',
                        border: `1px solid ${decisao.APROVA === 'S' ? '#93c5fd' : decisao.APROVA === 'C' ? '#fbbf24' : '#fca5a5'}`,
                        borderRadius: '8px',
                        padding: '20px',
                        marginBottom: '15px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}>
                        <h3 style={{ 
                          color: decisao.APROVA === 'S' ? '#1e40af' : decisao.APROVA === 'C' ? '#92400e' : '#991b1b', 
                        }}>
                           
                        </h3>
                        <div style={{ 
                          fontSize: '20px', 
                          fontWeight: 'bold',
                          color: decisao.APROVA === 'S' ? '#1e40af' : decisao.APROVA === 'C' ? '#b45309' : '#dc2626'
                        }}>
                          {decisao.APROVA === 'S' ? '✅' : decisao.APROVA === 'C' ? '⚠️' : '❌'} {decisao.TEXTO}
                          
                        </div>
                      </div>
                    )}


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
                        color: '#4b5563',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        listStyle: 'none',
                        position: 'relative',
                        paddingLeft: '20px'
                      }}>
                        <span style={{ position: 'relative' }}>
                          <span className="arrow" style={{
                            position: 'absolute',
                            left: '-20px',
                            transition: 'transform 0.2s',
                            display: 'inline-block'
                          }}>▶</span>
                          🔍 Dados completos
                        </span>
                        
                        {dadosParsed && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              navigator.clipboard.writeText(JSON.stringify(dadosParsed, null, 2))
                              setJsonCopiado(true)
                              setTimeout(() => setJsonCopiado(false), 2000)
                            }}
                            style={{
                              padding: '4px 8px',
                              fontSize: '14px',
                              backgroundColor: jsonCopiado ? '#10b981' : '#6366f1',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              whiteSpace: 'nowrap',
                              transition: 'background-color 0.2s',
                              lineHeight: '1',
                              minWidth: 'auto',
                              width: 'fit-content'
                            }}
                            onMouseOver={(e) => {
                              if (!jsonCopiado) e.currentTarget.style.backgroundColor = '#4f46e5'
                            }}
                            onMouseOut={(e) => {
                              if (!jsonCopiado) e.currentTarget.style.backgroundColor = '#6366f1'
                            }}
                          >
                            {jsonCopiado ? '✓' : 'Copiar'}
                          </button>
                        )}
                      </summary>
                      
                      <pre style={{
                        marginTop: '15px',
                        whiteSpace: 'pre-wrap',
                        fontSize: '11px',
                        fontFamily: 'Consolas, Monaco, monospace',
                        backgroundColor: '#1e293b',
                        color: '#e2e8f0',
                        padding: '15px',
                        borderRadius: '6px',
                        maxHeight: '300px',
                        overflow: 'auto'
                      }}>
                        {JSON.stringify(dadosParsed, null, 2)}
                      </pre>
                    </details>
                  </>
                )}

                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                  <button
                    onClick={() => setModalDetalhes({ aberto: false, requisicao: null })}
                    style={{
                      padding: '10px 20px',
                      fontSize: '14px',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
