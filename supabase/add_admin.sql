-- Script para adicionar um novo administrador
-- Uso: Execute este script no Supabase SQL Editor substituindo o email

-- Adicionar administrador
INSERT INTO admins (email, name) 
VALUES ('raffiweran@gmail.com', 'Rafaelle Weran')
ON CONFLICT (email) DO UPDATE 
SET name = EXCLUDED.name, updated_at = NOW();

-- Verificar se foi adicionado
SELECT * FROM admins WHERE email = 'raffiweran@gmail.com';


