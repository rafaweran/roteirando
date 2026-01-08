# 🔧 Corrigir Admin raffiweran@gmail.com em Produção

## Problema
O usuário `raffiweran@gmail.com` não está funcionando como administrador em produção.

## Solução Rápida

### Opção 1: Executar Script SQL (Recomendado)

1. **Acesse o Supabase Dashboard de PRODUÇÃO**
   - Vá em **SQL Editor**
   - Clique em **New Query**

2. **Execute o script completo:**
   - Abra o arquivo `supabase/fix_producao_admin.sql`
   - Copie TODO o conteúdo
   - Cole no SQL Editor
   - Clique em **Run** (ou pressione Cmd+Enter / Ctrl+Enter)

3. **Verifique o resultado:**
   - O script deve mostrar os administradores cadastrados
   - Deve aparecer `admin@travel.com` e `raffiweran@gmail.com`

4. **Teste o login:**
   - Acesse a aplicação em produção
   - Tente fazer login com `raffiweran@gmail.com`
   - Qualquer senha funciona (o sistema não valida senha para admins)

### Opção 2: Verificar Manualmente

Se o script não funcionar, verifique manualmente:

```sql
-- 1. Verificar se a tabela existe
SELECT * FROM admins;

-- 2. Verificar se o email está lá
SELECT * FROM admins WHERE email = 'raffiweran@gmail.com';

-- 3. Se não estiver, adicionar:
INSERT INTO admins (email, name) 
VALUES ('raffiweran@gmail.com', 'Rafaelle Weran')
ON CONFLICT (email) DO UPDATE 
SET name = EXCLUDED.name;

-- 4. Verificar políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'admins';

-- 5. Se não houver política de leitura pública, criar:
CREATE POLICY "Allow public read for admin check" ON admins
    FOR SELECT USING (true);
```

## Como o Sistema Funciona

O sistema verifica administradores em **duas etapas**:

1. **Primeiro:** Verifica na tabela `admins` do banco de dados
2. **Fallback:** Se não encontrar no banco, verifica na lista hardcoded:
   - `admin@travel.com`
   - `raffiweran@gmail.com`

**IMPORTANTE:** O fallback hardcoded está no código (`components/LoginForm.tsx`), então mesmo se a tabela não existir, esses emails devem funcionar.

## Possíveis Causas do Problema

### 1. Tabela `admins` não existe em produção
**Solução:** Execute o script `supabase/fix_producao_admin.sql`

### 2. Políticas RLS bloqueando a leitura
**Solução:** O script cria a política correta. Se ainda não funcionar:
```sql
DROP POLICY IF EXISTS "Allow public read for admin check" ON admins;
CREATE POLICY "Allow public read for admin check" ON admins
    FOR SELECT USING (true);
```

### 3. Email com espaços ou maiúsculas
**Solução:** O código normaliza o email (lowercase + trim), mas verifique se não há caracteres especiais

### 4. Variáveis de ambiente incorretas
**Solução:** Verifique se as variáveis estão configuradas:
- `VITE_SUPABASE_URL` - URL do projeto Supabase de PRODUÇÃO
- `VITE_SUPABASE_ANON_KEY` - Chave anon do Supabase de PRODUÇÃO

## Debug

### No Console do Navegador (F12)

Ao tentar fazer login, você deve ver logs como:

```
🔍 Verificando se é administrador: raffiweran@gmail.com
📊 Resultado da verificação no banco: true/false
📋 É admin na lista de fallback: true/false
✅ É administrador? true/false
```

**Se aparecer:**
- `✅ É administrador? true` → O login deve funcionar
- `✅ É administrador? false` → Há um problema

### Verificar no Supabase

```sql
-- Ver todos os admins
SELECT * FROM admins;

-- Verificar políticas
SELECT * FROM pg_policies WHERE tablename = 'admins';

-- Testar consulta direta
SELECT * FROM admins WHERE email = 'raffiweran@gmail.com';
```

## Checklist

- [ ] Script SQL executado no Supabase de PRODUÇÃO
- [ ] Tabela `admins` existe e tem os registros
- [ ] Política RLS "Allow public read for admin check" existe
- [ ] Variáveis de ambiente configuradas corretamente
- [ ] Código em produção está atualizado
- [ ] Testado login com `raffiweran@gmail.com`

## Contato

Se o problema persistir após seguir todos os passos:
1. Verifique os logs do console do navegador
2. Verifique os logs do Supabase (Dashboard → Logs)
3. Verifique se há erros de rede no DevTools (Network tab)

