-- Adicionar colunas de forma de pagamento à tabela tours

-- Adiciona coluna payment_method (forma de pagamento)
ALTER TABLE tours 
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('guide', 'website'));

-- Adiciona coluna payment_website_url (URL do site de pagamento)
ALTER TABLE tours 
ADD COLUMN IF NOT EXISTS payment_website_url TEXT;

-- Comentários para documentação
COMMENT ON COLUMN tours.payment_method IS 'Forma de pagamento: guide (pagar à guia) ou website (pagar no site)';
COMMENT ON COLUMN tours.payment_website_url IS 'URL do site de pagamento (quando payment_method = website)';
