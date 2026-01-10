import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

interface Formulario {
  id: string
  nome_completo: string
  cpf: string
  renda_mensal: number
  telefone: string
  email: string
  created_at: string
}

export default function ImovelDetalhes() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [endereco, setEndereco] = useState('')
  const [formularios, setFormularios] = useState<Formulario[]>([])
  const [linkCopiado, setLinkCopiado] = useState(false)

  const linkPublico = `${window.location.origin}/preencher/${id}`

  useEffect(() => {
    checkUser()
    loadImovel()
    loadFormularios()
  }, [])

  const checkUser = async () => {
    const { data } = await supabase.auth.getUser()
    if (!data.user) {
      navigate('/')
    }
  }

  const loadImovel = async () => {
    const { data, error } = await supabase
      .from('imoveis')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      alert('Erro ao carregar imóvel: ' + error.message)
    } else {
      setEndereco(data.endereco)
    }
  }

  const loadFormularios = async () => {
    const { data, error } = await supabase
      .from('formularios')
      .select('*')
      .eq('imovel_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      alert('Erro ao carregar formulários: ' + error.message)
    } else {
      setFormularios(data || [])
    }
  }

  const copiarLink = () => {
    navigator.clipboard.writeText(linkPublico)
    setLinkCopiado(true)
    setTimeout(() => setLinkCopiado(false), 2000)
  }

  return (
    <div className="container">
      <div className="page">
        <button onClick={() => navigate('/dashboard')} style={{ width: 'auto', marginBottom: '20px' }}>
          ← Voltar
        </button>

        <h1>{endereco}</h1>

        <div className="link-box">
          <h3>Link para o Inquilino Preencher:</h3>
          <p style={{ margin: '10px 0', fontSize: '14px' }}>{linkPublico}</p>
          <button onClick={copiarLink} style={{ width: 'auto' }}>
            {linkCopiado ? '✓ Copiado!' : 'Copiar Link'}
          </button>
        </div>

        <h2 style={{ marginTop: '30px' }}>Formulários Recebidos ({formularios.length})</h2>
        
        {formularios.length === 0 ? (
          <p>Nenhum formulário preenchido ainda.</p>
        ) : (
          formularios.map((form) => (
            <div key={form.id} className="formulario-item">
              <p><strong>Nome:</strong> {form.nome_completo}</p>
              <p><strong>CPF:</strong> {form.cpf}</p>
              <p><strong>Renda Mensal:</strong> R$ {form.renda_mensal.toFixed(2)}</p>
              <p><strong>Telefone:</strong> {form.telefone}</p>
              <p><strong>Email:</strong> {form.email}</p>
              <p style={{ color: '#666', fontSize: '12px' }}>
                Enviado em: {new Date(form.created_at).toLocaleString('pt-BR')}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
