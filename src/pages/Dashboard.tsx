import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAuthSession, signOut, updatePassword } from 'aws-amplify/auth'
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
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      alert('As senhas não conferem!')
      return
    }

    if (newPassword.length < 8) {
      alert('A nova senha deve ter pelo menos 8 caracteres!')
      return
    }

    try {
      await updatePassword({
        oldPassword: oldPassword,
        newPassword: newPassword
      })
      
      alert('Senha alterada com sucesso!')
      setShowPasswordModal(false)
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      console.error('Erro ao trocar senha:', error)
      if (error.name === 'NotAuthorizedException') {
        alert('Senha atual incorreta!')
      } else {
        alert('Erro ao trocar senha: ' + error.message)
      }
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>Dashboard - Imóveis</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setShowPasswordModal(true)} style={{ width: 'auto', padding: '10px 20px', backgroundColor: '#666' }}>
              Trocar Senha
            </button>
            <button onClick={handleLogout} style={{ width: 'auto', padding: '10px 20px' }}>
              Sair
            </button>
          </div>
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

        {/* Modal de Trocar Senha */}
        {showPasswordModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '8px',
              maxWidth: '400px',
              width: '90%'
            }}>
              <h2>Trocar Senha</h2>
              <form onSubmit={handleChangePassword}>
                <input
                  type="password"
                  placeholder="Senha atual"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Nova senha"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <small style={{ display: 'block', marginBottom: '15px', color: '#666' }}>
                  Mínimo 8 caracteres, com letras maiúsculas, minúsculas, números e símbolos
                </small>
                <input
                  type="password"
                  placeholder="Confirmar nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button type="submit" style={{ flex: 1 }}>
                    Confirmar
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowPasswordModal(false)
                      setOldPassword('')
                      setNewPassword('')
                      setConfirmPassword('')
                    }}
                    style={{ flex: 1, backgroundColor: '#ccc' }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  )
}
