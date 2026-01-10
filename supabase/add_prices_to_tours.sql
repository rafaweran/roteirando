-- Adicionar coluna prices na tabela tours
-- Permite armazenar múltiplos preços por tipo de ingresso (Inteira, Meia, Sênior)
-- Formato JSON: {"inteira": {"value": 100.00, "description": "..."}, "meia": {...}, "senior": {...}}

ALTER TABLE tours 
ADD COLUMN IF NOT EXISTS prices JSONB;

-- Comentário explicativo
COMMENT ON COLUMN tours.prices IS 'JSON com preços por tipo de ingresso: {"inteira": {"value": number, "description": "string"}, "meia": {...}, "senior": {...}}';

-- Verificar se a coluna foi criada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tours' 
  AND column_name = 'prices';
