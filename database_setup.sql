-- ==================================================
-- CONFIGURAÇÃO DO BANCO DE DADOS
-- Execute este script no SQL Editor do Supabase
-- ==================================================

-- 1. Tabela de Administradores (usuários que podem fazer login)
CREATE TABLE administradores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  senha TEXT NOT NULL, -- Em produção, use hash (bcrypt)
  nome TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Tabela de Imóveis
CREATE TABLE imoveis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  endereco TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Tabela de Formulários preenchidos pelos inquilinos
CREATE TABLE formularios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  imovel_id UUID REFERENCES imoveis(id) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL,
  cpf TEXT NOT NULL,
  renda_mensal DECIMAL(10,2),
  telefone TEXT,
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ==================================================
-- SEGURANÇA (Row Level Security)
-- ==================================================

-- DESABILITAR RLS para simplificar (sistema interno simples)
-- Em produção, você deve configurar políticas adequadas
ALTER TABLE administradores DISABLE ROW LEVEL SECURITY;
ALTER TABLE imoveis DISABLE ROW LEVEL SECURITY;
ALTER TABLE formularios DISABLE ROW LEVEL SECURITY;

-- ==================================================
-- INSERIR ADMINISTRADOR PADRÃO (para teste)
-- ==================================================

-- IMPORTANTE: Troque o email e senha!
-- Senha aqui é "admin123" - EM PRODUÇÃO USE HASH!
INSERT INTO administradores (email, senha, nome) 
VALUES ('admin@exemplo.com', 'admin123', 'Administrador');

-- Para adicionar mais administradores:
-- INSERT INTO administradores (email, senha, nome) 
-- VALUES ('outro@exemplo.com', 'senha456', 'Outro Admin');
