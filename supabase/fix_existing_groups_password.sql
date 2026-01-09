-- Corrigir grupos existentes que não têm password_changed definido
-- Execute este SQL no Supabase SQL Editor

-- 1. Verificar grupos que precisam correção
SELECT 
  id, 
  name, 
  leader_email, 
  leader_password,
  password_changed,
  CASE 
    WHEN password_changed IS NULL THEN 'Precisa atualizar'
    WHEN password_changed = FALSE THEN 'Senha inicial (OK)'
    WHEN password_changed = TRUE THEN 'Senha alterada (OK)'
  END as status
FROM groups
ORDER BY created_at DESC;

-- 2. Atualizar todos os grupos que têm password_changed NULL
-- Se tem senha mas password_changed é NULL, definir como FALSE (primeiro acesso)
UPDATE groups 
SET password_changed = FALSE
WHERE password_changed IS NULL AND leader_password IS NOT NULL;

-- 3. Grupos sem senha - marcar como NULL (precisarão definir senha manualmente)
UPDATE groups 
SET password_changed = NULL
WHERE password_changed IS NULL AND leader_password IS NULL;

-- 4. Verificar novamente após correção
SELECT 
  id, 
  name, 
  leader_email, 
  CASE 
    WHEN leader_password IS NULL THEN 'Sem senha'
    WHEN LENGTH(leader_password) > 0 THEN 'Tem senha'
  END as tem_senha,
  password_changed,
  CASE 
    WHEN password_changed IS NULL THEN 'Não definido'
    WHEN password_changed = FALSE THEN 'Primeiro acesso (precisa alterar)'
    WHEN password_changed = TRUE THEN 'Já alterou senha'
  END as status
FROM groups
ORDER BY created_at DESC;


