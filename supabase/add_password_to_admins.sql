-- Adicionar coluna password na tabela admins
-- Execute este SQL no Supabase SQL Editor

ALTER TABLE admins 
ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- Comentário explicativo
COMMENT ON COLUMN admins.password IS 'Senha hasheada do administrador para autenticação';

-- Verificar se a coluna foi criada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'admins' 
  AND column_name = 'password';
