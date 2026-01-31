import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import './aws-config' // Configurar Amplify
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ImovelDetalhes from './pages/ImovelDetalhes'
import FormularioPublico from './pages/FormularioPublico'
import TesteAPI from './pages/TesteAPI'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/imovel/:id" element={<ImovelDetalhes />} />
        <Route path="/preencher/:imovelId" element={<FormularioPublico />} />
        <Route path="/teste-api" element={<TesteAPI />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
