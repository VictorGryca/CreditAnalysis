import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAuthSession, signOut } from 'aws-amplify/auth'
import { supabase } from '../supabaseClient'

interface Imovel {
  id: string
  endereco: string
  created_at: string
}

export default function Dashboard() {
  const [imoveis, setImoveis] = useState<Imovel[]>([])
  const [novoEndereco, setNovoEndereco] = useState('')
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const navigate = useNavigate()

  // Converter UTC para horário de São Paulo
  const formatarDataBR = (dataUTC: string) => {
    const data = new Date(dataUTC + 'Z') // Garante que seja interpretada como UTC
    return data.toLocaleDateString('pt-BR')
  }

  useEffect(() => {
    const initAuth = async () => {
      await checkUser()
      if (!isCheckingAuth) {
        loadImoveis()
      }
    }
    initAuth()
  }, [])

  const checkUser = async () => {
    try {
      // Aguardar um pouco para o Amplify inicializar
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const session = await fetchAuthSession({ forceRefresh: false })
      console.log('Sessão:', session)
      
      if (!session.tokens) {
        console.log('Sem tokens, redirecionando...')
        navigate('/')
        return
      }
      
      // Sessão válida!
      setIsCheckingAuth(false)
      loadImoveis()
    } catch (error) {
      console.error('Erro ao verificar sessão:', error)
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
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  return (
    <div className="container">
      {isCheckingAuth ? (
        <div className="page">
          <p>Carregando...</p>
        </div>
      ) : (
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
                Criado em: {formatarDataBR(imovel.created_at)}
              </p>
            </div>
          ))
        )}
      </div>
      )}
    </div>
  )
}
