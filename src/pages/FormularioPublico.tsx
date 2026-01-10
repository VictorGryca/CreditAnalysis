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

  // Função para formatar CPF: 000.000.000-00
  const formatarCPF = (valor: string) => {
    const numeros = valor.replace(/\D/g, '') // Remove tudo que não é número
    if (numeros.length <= 11) {
      return numeros
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    }
    return numeros.slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  // Função para formatar telefone: (00) 00000-0000
  const formatarTelefone = (valor: string) => {
    const numeros = valor.replace(/\D/g, '')
    if (numeros.length <= 11) {
      return numeros
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
    }
    return numeros.slice(0, 11)
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
  }

  // Função para formatar renda: R$ 0.000,00
  const formatarRenda = (valor: string) => {
    const numeros = valor.replace(/\D/g, '')
    if (!numeros) return ''
    const valorNumerico = parseInt(numeros) / 100
    return valorNumerico.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Limpar formatação antes de enviar
    const cpfLimpo = formData.cpf.replace(/\D/g, '')
    const telefoneLimpo = formData.telefone.replace(/\D/g, '')
    const rendaLimpa = formData.renda_mensal.replace(/\D/g, '')
    const rendaDecimal = parseInt(rendaLimpa) / 100

    const { error } = await supabase
      .from('formularios')
      .insert([{
        imovel_id: imovelId,
        nome_completo: formData.nome_completo,
        cpf: cpfLimpo,
        telefone: telefoneLimpo,
        renda_mensal: rendaDecimal,
        email: formData.email,
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
            placeholder="CPF"
            value={formData.cpf}
            onChange={(e) => setFormData({ ...formData, cpf: formatarCPF(e.target.value) })}
            maxLength={14}
            required
          />
          <input
            type="text"
            placeholder="Renda Mensal"
            value={formData.renda_mensal ? `R$ ${formData.renda_mensal}` : ''}
            onChange={(e) => {
              const valor = e.target.value.replace('R$ ', '')
              setFormData({ ...formData, renda_mensal: formatarRenda(valor) })
            }}
            required
          />
          <input
            type="text"
            placeholder="Telefone"
            value={formData.telefone}
            onChange={(e) => setFormData({ ...formData, telefone: formatarTelefone(e.target.value) })}
            maxLength={15}
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
