import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Buscar administrador no banco de dados
      const { data, error } = await supabase
        .from('administradores')
        .select('*')
        .eq('email', email)
        .eq('senha', password)
        .single()

      if (error || !data) {
        alert('Email ou senha incorretos!')
        setLoading(false)
        return
      }

      // Login bem-sucedido! Salvar dados do admin no localStorage
      localStorage.setItem('adminId', data.id)
      localStorage.setItem('adminEmail', data.email)
      localStorage.setItem('adminNome', data.nome)
      
      navigate('/dashboard')
    } catch (err) {
      alert('Erro ao fazer login. Verifique suas credenciais.')
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="page">
        <h1>Login - Administrador</h1>
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
        <p style={{ marginTop: '20px', color: '#666', fontSize: '14px' }}>
          Usuário padrão: admin@exemplo.com | Senha: admin123
        </p>
      </div>
    </div>
  )
}
