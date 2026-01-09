-- Script para corrigir o problema do admin raffiweran@gmail.com em produção
-- Execute este script no Supabase SQL Editor do projeto de PRODUÇÃO

-- ============================================
-- PASSO 1: Criar tabela admins se não existir
-- ============================================
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PASSO 2: Criar índice para busca rápida
-- ============================================
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- ============================================
-- PASSO 3: Criar função de trigger se não existir
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- PASSO 4: Criar trigger se não existir
-- ============================================
DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PASSO 5: Habilitar RLS
-- ============================================
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASSO 6: Remover políticas antigas e criar nova
-- ============================================
DROP POLICY IF EXISTS "Allow public read for admin check" ON admins;
DROP POLICY IF EXISTS "Allow public read" ON admins;
DROP POLICY IF EXISTS "Public read access" ON admins;

-- Criar política que permite leitura pública (necessário para verificar se é admin)
CREATE POLICY "Allow public read for admin check" ON admins
    FOR SELECT USING (true);

-- ============================================
-- PASSO 7: Inserir ou atualizar administradores
-- ============================================
INSERT INTO admins (email, name) 
VALUES 
  ('admin@travel.com', 'Administrador Principal'),
  ('raffiweran@gmail.com', 'Rafaelle Weran')
ON CONFLICT (email) DO UPDATE 
SET name = EXCLUDED.name, updated_at = NOW();

-- ============================================
-- PASSO 8: Verificar se foi adicionado corretamente
-- ============================================
SELECT 
  id,
  email,
  name,
  created_at,
  updated_at
FROM admins 
ORDER BY created_at;

-- ============================================
-- PASSO 9: Verificar políticas RLS
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'admins';

-- ============================================
-- FIM DO SCRIPT
-- ============================================
-- Após executar, verifique:
-- 1. Se os dois administradores aparecem na consulta do PASSO 8
-- 2. Se a política RLS está ativa (PASSO 9)
-- 3. Tente fazer login com raffiweran@gmail.com


