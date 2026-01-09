-- Adicionar coluna leader_password na tabela groups
ALTER TABLE groups 
ADD COLUMN IF NOT EXISTS leader_password VARCHAR(255);

-- Comentário explicativo
COMMENT ON COLUMN groups.leader_password IS 'Senha hasheada do líder do grupo para autenticação';


