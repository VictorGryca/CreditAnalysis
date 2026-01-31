import { useState } from 'react'

export default function TesteAPI() {
  const [cpf, setCpf] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<any>(null)
  const [erro, setErro] = useState('')

  const formatarCPF = (valor: string) => {
    const numeros = valor.replace(/\D/g, '')
    return numeros
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
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
        <h1>🧪 Teste de API - SCPC</h1>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Ambiente de homologação - dados fictícios
        </p>

        <form onSubmit={consultarAPI}>
          <input
            type="text"
            placeholder="Digite o CPF"
            value={cpf}
            onChange={(e) => setCpf(formatarCPF(e.target.value))}
            maxLength={14}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Consultando...' : 'Consultar SCPC'}
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

        {resultado && (
          <div style={{
            backgroundColor: '#f0f0f0',
            padding: '20px',
            borderRadius: '8px',
            marginTop: '20px',
            maxHeight: '500px',
            overflow: 'auto'
          }}>
            <h3>✅ Resposta da API:</h3>
            <pre style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontSize: '12px',
              backgroundColor: 'white',
              padding: '15px',
              borderRadius: '4px'
            }}>
              {JSON.stringify(resultado, null, 2)}
            </pre>
          </div>
        )}

        <div style={{
          marginTop: '30px',
          padding: '15px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '4px'
        }}>
          <strong>💡 Dica:</strong> Use CPF de teste da homologação. Ex: 07217318998
        </div>
      </div>
    </div>
  )
}
