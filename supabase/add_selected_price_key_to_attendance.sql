-- Adicionar coluna selected_price_key à tabela tour_attendance
-- Execute este script no Supabase SQL Editor

ALTER TABLE tour_attendance 
ADD COLUMN IF NOT EXISTS selected_price_key VARCHAR(100);

-- Comentário na coluna
COMMENT ON COLUMN tour_attendance.selected_price_key IS 'Chave do tipo de ingresso selecionado pelo grupo (ex: "inteira", "meia", "price_0", etc.)';
