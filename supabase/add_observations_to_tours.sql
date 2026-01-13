-- Adicionar coluna observations à tabela tours
-- Execute este script no Supabase SQL Editor

ALTER TABLE tours 
ADD COLUMN IF NOT EXISTS observations TEXT;

-- Comentário na coluna
COMMENT ON COLUMN tours.observations IS 'Observações importantes sobre o passeio (instruções especiais, recomendações, avisos, etc.)';
