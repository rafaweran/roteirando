-- Adicionar coluna tags na tabela tours
-- Permite categorizar passeios com tags como: Restaurante, Passeios, Shows, etc.

ALTER TABLE tours 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Comentário explicativo
COMMENT ON COLUMN tours.tags IS 'Array de tags/categorias do passeio (ex: Restaurante, Passeios, Shows, etc.)';

-- Verificar se a coluna foi criada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tours' 
  AND column_name = 'tags';
