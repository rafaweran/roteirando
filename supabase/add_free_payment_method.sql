-- Adicionar opção 'free' (gratuito) à constraint de payment_method na tabela tours
-- Esta migration atualiza a constraint para aceitar: 'guide', 'website' e 'free'

-- Remover a constraint antiga
ALTER TABLE tours DROP CONSTRAINT IF EXISTS tours_payment_method_check;

-- Adicionar nova constraint com a opção 'free'
ALTER TABLE tours 
ADD CONSTRAINT tours_payment_method_check 
CHECK (payment_method IN ('guide', 'website', 'free'));

-- Comentário descritivo
COMMENT ON COLUMN tours.payment_method IS 'Forma de pagamento do passeio: guide (à guia), website (no site) ou free (gratuito)';
