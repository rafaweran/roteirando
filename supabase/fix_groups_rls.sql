-- Script para verificar e corrigir políticas RLS da tabela groups
-- Execute este script no Supabase SQL Editor para permitir DELETE

-- 1. Verificar se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'groups';

-- 2. Listar todas as políticas existentes
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'groups';

-- 3. Remover TODAS as políticas antigas
DROP POLICY IF EXISTS "Allow all for authenticated users" ON groups;
DROP POLICY IF EXISTS "Allow public read" ON groups;
DROP POLICY IF EXISTS "Allow all operations on groups" ON groups;
DROP POLICY IF EXISTS "Allow public read for groups" ON groups;

-- 4. Criar política que permite TODAS as operações (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Allow all operations on groups" ON groups
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- 5. Verificar se a política foi criada corretamente
SELECT 
  policyname, 
  cmd,
  CASE 
    WHEN cmd = 'ALL' THEN 'Todas as operações (incluindo DELETE)'
    WHEN cmd = 'SELECT' THEN 'Apenas leitura'
    WHEN cmd = 'DELETE' THEN 'Apenas exclusão'
    ELSE cmd::text
  END as descricao
FROM pg_policies 
WHERE tablename = 'groups';

-- 6. Testar se DELETE está funcionando (opcional - descomente para testar)
-- DELETE FROM groups WHERE id = 'ID_DO_GRUPO_AQUI';
