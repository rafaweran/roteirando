-- Adicionar coluna password_changed na tabela groups
ALTER TABLE groups 
ADD COLUMN IF NOT EXISTS password_changed BOOLEAN DEFAULT FALSE;

-- Atualizar grupos existentes para ter password_changed = false
UPDATE groups 
SET password_changed = FALSE 
WHERE password_changed IS NULL;

-- Comentário explicativo
COMMENT ON COLUMN groups.password_changed IS 'Indica se o usuário já alterou a senha inicial (primeiro acesso)';

