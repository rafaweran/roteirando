-- Adicionar coluna price_quantities à tabela tour_attendance
-- Esta coluna armazena um objeto JSON com as quantidades de cada tipo de ingresso
-- Exemplo: { "adulto": 2, "crianca": 3, "idoso": 1 }

-- Adicionar coluna se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'tour_attendance' 
    AND column_name = 'price_quantities'
  ) THEN
    ALTER TABLE tour_attendance 
    ADD COLUMN price_quantities JSONB DEFAULT NULL;
    
    RAISE NOTICE 'Coluna price_quantities adicionada com sucesso!';
  ELSE
    RAISE NOTICE 'Coluna price_quantities já existe!';
  END IF;
END $$;

-- Criar índice para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_tour_attendance_price_quantities 
ON tour_attendance USING GIN (price_quantities);

-- Comentário descritivo
COMMENT ON COLUMN tour_attendance.price_quantities IS 'Quantidades de cada tipo de ingresso selecionado (JSONB). Exemplo: {"adulto": 2, "crianca": 3}';
