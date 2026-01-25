-- Adicionar coluna custom_time na tabela tour_attendance
-- Permite que grupos escolham um horário diferente do original do passeio
-- Se NULL, significa que o grupo vai no horário original do passeio

ALTER TABLE tour_attendance 
ADD COLUMN IF NOT EXISTS custom_time TIME;

-- Comentário explicativo
COMMENT ON COLUMN tour_attendance.custom_time IS 'Horário personalizado escolhido pelo grupo. NULL = vai no horário original do passeio';

-- Verificar se a coluna foi criada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tour_attendance' 
  AND column_name = 'custom_time';
