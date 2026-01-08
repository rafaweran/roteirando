-- Migração: Adicionar campos de senha na tabela groups
-- Execute este SQL no Supabase SQL Editor

-- 1. Adicionar coluna leader_password (se não existir)
ALTER TABLE groups 
ADD COLUMN IF NOT EXISTS leader_password VARCHAR(255);

-- 2. Adicionar coluna password_changed (se não existir)
ALTER TABLE groups 
ADD COLUMN IF NOT EXISTS password_changed BOOLEAN DEFAULT FALSE;

-- 3. Atualizar registros existentes (definir password_changed como FALSE para grupos sem senha)
UPDATE groups 
SET password_changed = FALSE 
WHERE password_changed IS NULL;

-- 4. Comentários explicativos
COMMENT ON COLUMN groups.leader_password IS 'Senha hasheada do líder do grupo para autenticação';
COMMENT ON COLUMN groups.password_changed IS 'Indica se o usuário já alterou a senha inicial (primeiro acesso)';

-- Verificar se as colunas foram criadas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'groups' 
  AND column_name IN ('leader_password', 'password_changed');

