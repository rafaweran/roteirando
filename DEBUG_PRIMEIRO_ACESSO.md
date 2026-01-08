# 🔍 Debug: Primeiro Acesso não Funcionando

## Problema

O modal de alteração de senha não aparece após login com senha inicial.

## Passos para Debug

### 1. Verificar no Banco de Dados

Execute no Supabase SQL Editor:

```sql
SELECT 
  id, 
  name, 
  leader_email, 
  leader_password IS NOT NULL as tem_senha,
  password_changed,
  CASE 
    WHEN password_changed IS NULL THEN 'NULL (problema!)'
    WHEN password_changed = FALSE THEN 'FALSE (primeiro acesso)'
    WHEN password_changed = TRUE THEN 'TRUE (já alterou)'
  END as status
FROM groups
WHERE leader_email = 'SEU_EMAIL_AQUI@exemplo.com';
```

**O que esperar:**
- `password_changed` deve ser `FALSE` ou `NULL`
- Se for `NULL`, é o problema!

### 2. Corrigir Grupos Existentes

Execute o arquivo `supabase/fix_existing_groups_password.sql`:

```sql
-- Corrigir grupos que têm password_changed NULL
UPDATE groups 
SET password_changed = FALSE
WHERE password_changed IS NULL AND leader_password IS NOT NULL;
```

### 3. Verificar no Console do Navegador

Ao fazer login, abra o Console (F12) e procure por:

```
🔍 Grupo carregado após login:
   passwordChanged: false ou undefined
   
🔑 Precisa alterar senha? true ou false

✅ Mostrando modal de alteração de senha
```

**Se você não vê essas mensagens:**
- O grupo pode não estar sendo encontrado
- Verifique se o email está correto

**Se você vê mas o modal não aparece:**
- Verifique o overlay de debug no canto superior esquerdo
- Verifique se há erros no console

### 4. Verificar Estado do Modal

No Console, verifique:

```javascript
// Você deve ver no overlay de debug:
DEBUG: Modal deve estar visível
showChangePasswordModal: true
groupNeedingPasswordChange: sim
```

### 5. Possíveis Problemas e Soluções

#### Problema 1: password_changed é NULL no banco
**Solução:** Execute o SQL de correção acima

#### Problema 2: Grupo não está sendo carregado corretamente
**Solução:** Verifique se o email está correto e o grupo existe

#### Problema 3: Modal está renderizando mas não visível
**Solução:** Verifique o CSS - pode estar com z-index baixo ou display none

#### Problema 4: passwordChanged está vindo como undefined
**Solução:** Já foi corrigido no código - deve considerar undefined como primeiro acesso

### 6. Teste Manual

1. Crie um **NOVO** grupo com senha inicial
2. Faça login com esse grupo
3. O modal deve aparecer automaticamente

Se o novo grupo funciona mas o antigo não:
- O problema é o campo `password_changed` NULL no banco
- Execute o SQL de correção

## SQL de Diagnóstico

```sql
-- Ver TODOS os grupos e seus status
SELECT 
  id, 
  name, 
  leader_email, 
  CASE 
    WHEN leader_password IS NULL THEN '❌ Sem senha'
    ELSE '✅ Tem senha'
  END as senha,
  CASE 
    WHEN password_changed IS NULL THEN '❌ NULL - PRECISA CORRIGIR'
    WHEN password_changed = FALSE THEN '⚠️ FALSE - Primeiro acesso'
    WHEN password_changed = TRUE THEN '✅ TRUE - Já alterou'
  END as status
FROM groups
ORDER BY created_at DESC;
```

## Checklist

- [ ] Campo `password_changed` existe na tabela `groups`
- [ ] Grupo tem `leader_password` definido
- [ ] Grupo tem `password_changed = FALSE` ou `NULL`
- [ ] Console mostra mensagens de debug
- [ ] Modal está sendo renderizado (verificar no React DevTools)
- [ ] Não há erros no console

## Se Nada Funcionar

1. Delete o grupo no banco
2. Crie um novo grupo pelo formulário
3. Faça login novamente
4. O modal deve aparecer

