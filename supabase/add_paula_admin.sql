-- Script para adicionar paulapgcferreira2@gmail.com como administrador
-- Execute este script no Supabase SQL Editor

-- Primeiro, criar a tabela se não existir
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  password VARCHAR(255),
  password_changed BOOLEAN DEFAULT FALSE,
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

-- Adicionar colunas se não existirem
ALTER TABLE admins ADD COLUMN IF NOT EXISTS password VARCHAR(255);
ALTER TABLE admins ADD COLUMN IF NOT EXISTS password_changed BOOLEAN DEFAULT FALSE;

-- Inserir ou atualizar o administrador com senha inicial 12345678 (hasheada em base64)
-- A senha "12345678" em base64 é "MTIzNDU2Nzg="
INSERT INTO admins (email, name, password, password_changed) 
VALUES ('paulapgcferreira2@gmail.com', 'Paula Ferreira', 'MTIzNDU2Nzg=', FALSE)
ON CONFLICT (email) DO UPDATE 
SET 
  name = EXCLUDED.name, 
  password = COALESCE(EXCLUDED.password, admins.password, 'MTIzNDU2Nzg='),
  password_changed = COALESCE(EXCLUDED.password_changed, admins.password_changed, FALSE),
  updated_at = NOW();

-- Verificar se foi adicionado
SELECT * FROM admins WHERE email = 'paulapgcferreira2@gmail.com';

-- Listar todos os admins
SELECT email, name, created_at FROM admins ORDER BY created_at;

-- Habilitar RLS se ainda não estiver habilitado
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Criar policy para leitura pública (necessário para verificar se é admin)
DROP POLICY IF EXISTS "Allow public read for admin check" ON admins;
CREATE POLICY "Allow public read for admin check" ON admins
    FOR SELECT USING (true);
