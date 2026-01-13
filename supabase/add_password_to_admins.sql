-- Script para adicionar coluna password e password_changed na tabela admins
-- Execute este script no Supabase SQL Editor

-- Adicionar coluna password se não existir
ALTER TABLE admins ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- Adicionar coluna password_changed se não existir
ALTER TABLE admins ADD COLUMN IF NOT EXISTS password_changed BOOLEAN DEFAULT FALSE;

-- Atualizar registros existentes para ter password_changed = false se for NULL
UPDATE admins 
SET password_changed = FALSE 
WHERE password_changed IS NULL;

-- Verificar estrutura da tabela
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'admins' 
ORDER BY ordinal_position;
