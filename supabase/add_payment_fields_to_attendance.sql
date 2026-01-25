-- Adicionar colunas de pagamento na tabela tour_attendance
ALTER TABLE tour_attendance 
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_date DATE,
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100),
ADD COLUMN IF NOT EXISTS document_url TEXT;

-- Comentários explicativos
COMMENT ON COLUMN tour_attendance.is_paid IS 'Indica se o passeio já foi pago pelo grupo';
COMMENT ON COLUMN tour_attendance.payment_date IS 'Data em que o pagamento foi realizado';
COMMENT ON COLUMN tour_attendance.payment_method IS 'Forma de pagamento utilizada (ex: Pix, Cartão, etc)';
COMMENT ON COLUMN tour_attendance.document_url IS 'URL do comprovante de pagamento ou documento relacionado';

-- INSTRUÇÕES PARA ARMAZENAMENTO (Supabase Storage):
-- 1. Crie um bucket chamado 'documents' no painel do Supabase.
-- 2. Defina o bucket como PUBLIC (ou configure as políticas de RLS apropriadas).
-- 3. Crie uma pasta chamada 'payment_proofs' dentro do bucket (opcional, o sistema criará automaticamente).

-- Políticas sugeridas para o bucket 'documents':
-- INSERT: allow for authenticated users
-- SELECT: allow for anyone (public read)
