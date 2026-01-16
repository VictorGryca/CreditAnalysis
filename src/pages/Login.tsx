import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn, confirmSignIn } from 'aws-amplify/auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [needsNewPassword, setNeedsNewPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [userName, setUserName] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    console.log('Tentando fazer login com:', email)
    
    try {
      const result = await signIn({
        username: email,
        password: password,
      })
      
      console.log('Resultado do login:', result)
      
      // Verificar se precisa trocar senha
      if (result.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        setNeedsNewPassword(true)
        setLoading(false)
        return
      }
      
      // Login bem-sucedido!
      if (result.isSignedIn) {
        navigate('/dashboard')
      }
    } catch (error: any) {
      console.error('Erro ao fazer login:', error)
      
      if (error.name === 'UserNotFoundException') {
        alert('Usuário não encontrado!')
      } else if (error.name === 'NotAuthorizedException') {
        alert('Email ou senha incorretos!')
      } else if (error.name === 'UserNotConfirmedException') {
        alert('Email não verificado. Verifique seu email.')
      } else {
        alert('Erro ao fazer login: ' + error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleNewPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const result = await confirmSignIn({
        challengeResponse: newPassword,
        options: {
          userAttributes: {
            name: userName
          }
        }
      })
      
      console.log('Senha alterada com sucesso:', result)
      
      if (result.isSignedIn) {
        navigate('/dashboard')
      }
    } catch (error: any) {
      console.error('Erro ao trocar senha:', error)
      alert('Erro ao trocar senha: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="page">
        <h1>Login - Administrador</h1>
        
        {!needsNewPassword ? (
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleNewPassword}>
            <p style={{ marginBottom: '20px', color: '#666' }}>
              É necessário criar uma nova senha permanente.
            </p>
            <input
              type="text"
              placeholder="Nome completo"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
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
            <button type="submit" disabled={loading}>
              {loading ? 'Alterando senha...' : 'Confirmar nova senha'}
            </button>
          </form>
        )}
        
        <p style={{ marginTop: '20px', color: '#666', fontSize: '14px' }}>
          Sistema protegido por AWS Cognito
        </p>
      </div>
    </div>
  )
}
