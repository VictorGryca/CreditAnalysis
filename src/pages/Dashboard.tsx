import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

interface Imovel {
  id: string
  endereco: string
  created_at: string
}

export default function Dashboard() {
  const [imoveis, setImoveis] = useState<Imovel[]>([])
  const [novoEndereco, setNovoEndereco] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    checkUser()
    loadImoveis()
  }, [])

  const checkUser = async () => {
    // Verificar se tem admin logado no localStorage
    const adminId = localStorage.getItem('adminId')
    if (!adminId) {
      navigate('/')
    }
  }

  const loadImoveis = async () => {
    const { data, error } = await supabase
      .from('imoveis')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      alert('Erro ao carregar imóveis: ' + error.message)
    } else {
      setImoveis(data || [])
    }
  }

  const handleCriarImovel = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { error } = await supabase
      .from('imoveis')
      .insert([{ endereco: novoEndereco }])

    if (error) {
      alert('Erro ao criar imóvel: ' + error.message)
    } else {
      setNovoEndereco('')
      loadImoveis()
    }
  }

  const handleLogout = async () => {
    // Limpar dados do localStorage
    localStorage.removeItem('adminId')
    localStorage.removeItem('adminEmail')
    localStorage.removeItem('adminNome')
    navigate('/')
  }

  return (
    <div className="container">
      <div className="page">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>Dashboard - Imóveis</h1>
          <button onClick={handleLogout} style={{ width: 'auto', padding: '10px 20px' }}>
            Sair
          </button>
        </div>

        <form onSubmit={handleCriarImovel} style={{ marginBottom: '30px' }}>
          <h2>Adicionar Novo Imóvel</h2>
          <input
            type="text"
            placeholder="Endereço do imóvel"
            value={novoEndereco}
            onChange={(e) => setNovoEndereco(e.target.value)}
            required
          />
          <button type="submit">Criar Imóvel</button>
        </form>

        <h2>Imóveis Cadastrados</h2>
        {imoveis.length === 0 ? (
          <p>Nenhum imóvel cadastrado ainda.</p>
        ) : (
          imoveis.map((imovel) => (
            <div
              key={imovel.id}
              className="imovel-card"
              onClick={() => navigate(`/imovel/${imovel.id}`)}
            >
              <strong>{imovel.endereco}</strong>
              <p style={{ color: '#666', fontSize: '14px', marginTop: '5px' }}>
                Criado em: {new Date(imovel.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
