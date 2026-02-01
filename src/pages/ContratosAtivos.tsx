import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RequisicaoCredito } from '../types/credito'
import { listarRequisicoes } from '../utils/storage'

export default function ContratosAtivos() {
  const [contratos, setContratos] = useState<RequisicaoCredito[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    carregarContratos()
  }, [])

  const carregarContratos = async () => {
    const todasRequisicoes = await listarRequisicoes()
    // Filtrar apenas as requisições com status "regular"
    const contratosRegulares = todasRequisicoes.filter(req => req.status === 'regular')
    setContratos(contratosRegulares)
  }

  const valorTotalAssegurado = contratos.reduce((total, c) => total + c.valorTotal, 0)

  return (
    <div className="container">
      <div className="page">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1>📄 Contratos Ativos</h1>
          <button 
            onClick={() => navigate('/dashboard')}
            style={{ padding: '10px 20px' }}
          >
            ← Voltar ao Dashboard
          </button>
        </div>

        {/* Card de Resumo */}
        <div style={{
          backgroundColor: '#2563eb',
          color: 'white',
          borderRadius: '12px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginBottom: '15px', fontSize: '18px', opacity: 0.9 }}>
            Valor Total Assegurado
          </h2>
          <p style={{ fontSize: '42px', fontWeight: 'bold', margin: 0 }}>
            {valorTotalAssegurado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <p style={{ marginTop: '15px', opacity: 0.9 }}>
            {contratos.length} {contratos.length === 1 ? 'contrato ativo' : 'contratos ativos'}
          </p>
        </div>

        {/* Lista de Contratos */}
        {contratos.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
            border: '2px dashed #d1d5db'
          }}>
            <p style={{ fontSize: '18px', color: '#6b7280' }}>
              Nenhum contrato ativo no momento.
            </p>
          </div>
        ) : (
          <div>
            <h2 style={{ marginBottom: '20px' }}>Lista de Contratos</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {contratos.map((contrato) => (
                <div
                  key={contrato.id}
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: '#111' }}>
                        {contrato.nome}
                      </p>
                      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                        CPF: {contrato.cpf}
                      </p>
                      <p style={{ color: '#6b7280', fontSize: '14px' }}>
                        Data de Início: {new Date(contrato.dataAnalise).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div style={{
                      backgroundColor: '#10b981',
                      color: 'white',
                      padding: '12px 20px',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      fontSize: '18px'
                    }}>
                      {contrato.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
