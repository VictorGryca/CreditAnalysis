import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function FormularioPublico() {
  const { imovelId } = useParams()
  const [enviado, setEnviado] = useState(false)
  const [formData, setFormData] = useState({
    nome_completo: '',
    cpf: '',
    renda_mensal: '',
    telefone: '',
    email: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { error } = await supabase
      .from('formularios')
      .insert([{
        imovel_id: imovelId,
        ...formData,
        renda_mensal: parseFloat(formData.renda_mensal),
      }])

    if (error) {
      alert('Erro ao enviar formulário: ' + error.message)
    } else {
      setEnviado(true)
    }
  }

  if (enviado) {
    return (
      <div className="container">
        <div className="page">
          <h1>✓ Formulário Enviado com Sucesso!</h1>
          <p>Obrigado por preencher suas informações. Entraremos em contato em breve.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="page">
        <h1>Análise de Crédito - Seguro Imobiliário</h1>
        <p style={{ marginBottom: '20px', color: '#666' }}>
          Preencha suas informações para análise de crédito.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nome Completo"
            value={formData.nome_completo}
            onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="CPF (apenas números)"
            value={formData.cpf}
            onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="Renda Mensal (R$)"
            value={formData.renda_mensal}
            onChange={(e) => setFormData({ ...formData, renda_mensal: e.target.value })}
            required
          />
          <input
            type="tel"
            placeholder="Telefone"
            value={formData.telefone}
            onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <button type="submit">Enviar Informações</button>
        </form>
      </div>
    </div>
  )
}
