-- 1. Adicionar nova coluna document_urls (Array de TEXT)
ALTER TABLE tour_attendance 
ADD COLUMN IF NOT EXISTS document_urls TEXT[] DEFAULT '{}';

-- 2. Migrar dados da coluna antiga (singular) para a nova (plural) se houver
UPDATE tour_attendance 
SET document_urls = ARRAY[document_url] 
WHERE document_url IS NOT NULL AND (document_urls IS NULL OR cardinality(document_urls) = 0);

-- 3. Comentário explicativo
COMMENT ON COLUMN tour_attendance.document_urls IS 'Lista de URLs dos comprovantes de pagamento (máx 2 sugerido via UI)';

-- 4. Opcional: Remover a coluna antiga singular no futuro após validar a migração
-- ALTER TABLE tour_attendance DROP COLUMN document_url;
