-- Adicionar coluna 'address' na tabela tours
-- Esta coluna armazena o endereço completo do passeio

ALTER TABLE tours 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Comentário na coluna para documentação
COMMENT ON COLUMN tours.address IS 'Endereço completo do passeio (ex: Rua das Flores, 123 - Centro, Cidade - Estado)';
