-- Adicionar coluna custom_date na tabela tour_attendance
-- Permite que grupos escolham ir em uma data diferente da data original do passeio
-- Se NULL, significa que o grupo vai junto com o grupo na data original
-- Se preenchido, é a data escolhida pelo grupo

ALTER TABLE tour_attendance 
ADD COLUMN IF NOT EXISTS custom_date DATE;

-- Comentário explicativo
COMMENT ON COLUMN tour_attendance.custom_date IS 'Data personalizada escolhida pelo grupo. NULL = vai na data original do passeio';

-- Verificar se a coluna foi criada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tour_attendance' 
  AND column_name = 'custom_date';
