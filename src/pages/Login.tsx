import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn, confirmSignIn, fetchAuthSession, signOut, resetPassword, confirmResetPassword } from 'aws-amplify/auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [needsNewPassword, setNeedsNewPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [userName, setUserName] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetCode, setResetCode] = useState('')
  const [resetNewPassword, setResetNewPassword] = useState('')
  const [resetStep, setResetStep] = useState<'email' | 'code'>('email')
  const navigate = useNavigate()

  // Verificar se já está logado ao carregar a página
  useEffect(() => {
    checkExistingSession()
  }, [])

  const checkExistingSession = async () => {
    try {
      const session = await fetchAuthSession()
      if (session.tokens) {
        console.log('Sessão ativa encontrada, redirecionando...')
        navigate('/dashboard')
      }
    } catch (error) {
      // Não está logado, tudo bem
      console.log('Nenhuma sessão ativa')
    } finally {
      setIsCheckingAuth(false)
    }
  }

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
      
      // Se já existe usuário logado, fazer logout primeiro
      if (error.message?.includes('already a signed in user')) {
        try {
          await signOut()
          alert('Sessão anterior encerrada. Tente fazer login novamente.')
          setLoading(false)
          return
        } catch (signOutError) {
          console.error('Erro ao fazer logout:', signOutError)
        }
      }
      
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await resetPassword({ username: email })
      alert('Código de recuperação enviado para seu email!')
      setResetStep('code')
    } catch (error: any) {
      console.error('Erro ao solicitar recuperação:', error)
      alert('Erro ao solicitar recuperação: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await confirmResetPassword({
        username: email,
        confirmationCode: resetCode,
        newPassword: resetNewPassword
      })
      
      alert('Senha recuperada com sucesso! Faça login com a nova senha.')
      setShowForgotPassword(false)
      setResetStep('email')
      setResetCode('')
      setResetNewPassword('')
    } catch (error: any) {
      console.error('Erro ao confirmar recuperação:', error)
      alert('Erro ao confirmar recuperação: ' + error.message)
    } finally {
      setLoading(false)
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
      <div className="page">
        <h1>Login - Administrador</h1>
        
        {showForgotPassword ? (
          // Formulário de recuperação de senha
          resetStep === 'email' ? (
            <form onSubmit={handleForgotPassword}>
              <p style={{ marginBottom: '15px', color: '#666' }}>
                Digite seu email para receber o código de recuperação
              </p>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar código'}
              </button>
              <button 
                type="button" 
                onClick={() => setShowForgotPassword(false)}
                style={{ marginTop: '10px', backgroundColor: '#ccc' }}
              >
                Voltar ao login
              </button>
            </form>
          ) : (
            <form onSubmit={handleConfirmReset}>
              <p style={{ marginBottom: '15px', color: '#666' }}>
                Digite o código recebido no email e sua nova senha
              </p>
              <input
                type="text"
                placeholder="Código de recuperação"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Nova senha"
                value={resetNewPassword}
                onChange={(e) => setResetNewPassword(e.target.value)}
                required
                minLength={8}
              />
              <small style={{ display: 'block', marginBottom: '15px', color: '#666' }}>
                Mínimo 8 caracteres, com letras maiúsculas, minúsculas, números e símbolos
              </small>
              <button type="submit" disabled={loading}>
                {loading ? 'Confirmando...' : 'Confirmar nova senha'}
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setShowForgotPassword(false)
                  setResetStep('email')
                }}
                style={{ marginTop: '10px', backgroundColor: '#ccc' }}
              >
                Cancelar
              </button>
            </form>
          )
        ) : !needsNewPassword ? (
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
            <button 
              type="button" 
              onClick={() => setShowForgotPassword(true)}
              style={{ marginTop: '10px', backgroundColor: '#666' }}
            >
              Esqueci minha senha
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
