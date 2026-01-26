-- Adicionar coluna companion_group_id à tabela groups
ALTER TABLE groups ADD COLUMN companion_group_id UUID REFERENCES groups(id);

-- Comentário explicativo
COMMENT ON COLUMN groups.companion_group_id IS 'ID de outro grupo com o qual este grupo compartilha a agenda (fazem passeios juntos)';
