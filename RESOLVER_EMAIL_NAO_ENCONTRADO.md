# Como Resolver: Email Não Encontrado

## 🔍 Problema
O email `elleafarnarew@gmail.com` foi deletado e recriado, mas agora diz que não encontrou.

## ✅ Soluções

### Opção 1: Verificar se o grupo existe no banco (RECOMENDADO)

1. Acesse o **Supabase Dashboard**: https://supabase.com/dashboard
2. Entre no seu projeto
3. Vá em **Table Editor** → **groups**
4. Procure por `leader_email = elleafarnarew@gmail.com`

**Se encontrar o grupo:**
- ✅ O grupo existe
- ✅ Verifique se tem senha (`leader_password` não está vazio)
- ✅ Tente fazer login novamente

**Se NÃO encontrar o grupo:**
- ❌ O grupo foi deletado mas não foi recriado
- 💡 **Solução**: Crie o grupo novamente pelo admin

---

### Opção 2: Criar o Grupo Novamente

1. **Faça login como ADMIN**
2. Vá em **"Todos os Grupos"** ou entre na viagem
3. Clique em **"+ Novo Grupo"**
4. Preencha os dados:
   - Nome do grupo
   - Email do responsável: `elleafarnarew@gmail.com`
   - Nome do responsável
   - Quantidade de pessoas
   - Selecione a viagem
5. Clique em **"Criar Grupo"**

✅ O sistema vai criar automaticamente:
- Senha aleatória
- Enviar credenciais por email (se configurado)

---

### Opção 3: Executar Script de Verificação

Execute este comando no terminal (na pasta do projeto):

```bash
# Defina as variáveis de ambiente
export VITE_SUPABASE_URL="sua-url-do-supabase"
export VITE_SUPABASE_ANON_KEY="sua-chave-anon"

# Execute o script
node scripts/check-email-simple.js
```

Ou edite o arquivo `scripts/check-email-simple.js` e adicione suas credenciais direto no código (temporariamente).

---

### Opção 4: Verificar Variações do Email

O email pode estar salvo com:
- Letras maiúsculas: `Elleafarnarew@gmail.com`
- Espaços extras: `elleafarnarew@gmail.com ` (com espaço no final)
- Caracteres especiais

**Como verificar:**

1. Acesse **Supabase Dashboard** → **SQL Editor**
2. Execute:

```sql
-- Buscar email exato
SELECT * FROM groups 
WHERE leader_email = 'elleafarnarew@gmail.com';

-- Buscar email (case-insensitive)
SELECT * FROM groups 
WHERE LOWER(leader_email) = LOWER('elleafarnarew@gmail.com');

-- Buscar emails similares
SELECT * FROM groups 
WHERE leader_email ILIKE '%ellea%';

-- Ver TODOS os emails para comparar
SELECT id, name, leader_name, leader_email 
FROM groups 
ORDER BY created_at DESC 
LIMIT 20;
```

---

## 🔧 Solução Rápida via SQL (SE O GRUPO EXISTE)

Se você encontrou o grupo no banco mas o login não funciona, pode resetar a senha:

```sql
-- 1. Ver o grupo
SELECT id, name, leader_email, leader_password 
FROM groups 
WHERE leader_email = 'elleafarnarew@gmail.com';

-- 2. Se leader_password estiver NULL, adicione uma senha:
-- Senha: Roteirando2024! (hash bcrypt)
UPDATE groups 
SET 
  leader_password = '$2b$10$YourBcryptHashHere',
  password_changed = false
WHERE leader_email = 'elleafarnarew@gmail.com';
```

**Ou gere uma nova senha:**

1. Acesse: https://bcrypt-generator.com/
2. Digite a senha: `Roteirando2024!`
3. Selecione **10 rounds**
4. Copie o hash gerado
5. Execute o UPDATE acima com o hash copiado

---

## 📝 Checklist de Verificação

- [ ] Email está escrito corretamente: `elleafarnarew@gmail.com`
- [ ] Grupo existe no banco de dados
- [ ] Campo `leader_password` não está vazio
- [ ] Campo `leader_email` está exatamente igual ao que você está tentando
- [ ] Você está usando a senha correta

---

## 🆘 Se nada funcionar

**Delete o grupo antigo e crie novamente:**

```sql
-- CUIDADO: Isso vai deletar TODOS os dados do grupo
DELETE FROM groups 
WHERE leader_email = 'elleafarnarew@gmail.com';
```

Depois crie o grupo novamente pelo painel admin.

---

## 💡 Dica

Use sempre **letras minúsculas** para emails ao criar grupos. Isso evita problemas de case sensitivity.
