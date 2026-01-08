-- Script para adicionar raffiweran@gmail.com como administrador
-- Execute este script no Supabase SQL Editor

-- Primeiro, criar a tabela se não existir
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice se não existir
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- Adicionar função de trigger se não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir ou atualizar o administrador
INSERT INTO admins (email, name) 
VALUES ('raffiweran@gmail.com', 'Rafaelle Weran')
ON CONFLICT (email) DO UPDATE 
SET name = EXCLUDED.name, updated_at = NOW();

-- Também garantir que admin@travel.com existe
INSERT INTO admins (email, name) 
VALUES ('admin@travel.com', 'Administrador Principal')
ON CONFLICT (email) DO NOTHING;

-- Verificar se foi adicionado
SELECT * FROM admins ORDER BY created_at;

-- Habilitar RLS se ainda não estiver habilitado
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Criar policy para leitura pública (necessário para verificar se é admin)
DROP POLICY IF EXISTS "Allow public read for admin check" ON admins;
CREATE POLICY "Allow public read for admin check" ON admins
    FOR SELECT USING (true);

