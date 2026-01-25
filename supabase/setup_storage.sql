-- 1. Criar o bucket 'documents' se ele não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Permitir que qualquer pessoa leia os arquivos (Bucket Público)
CREATE POLICY "Allow public select" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'documents' );

-- 3. Permitir que qualquer pessoa faça upload (Necessário pois não usamos Supabase Auth)
CREATE POLICY "Allow public insert" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'documents' );

-- 4. Permitir que qualquer pessoa delete (opcional, para quando o usuário remove o comprovante)
CREATE POLICY "Allow public delete" 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'documents' );
