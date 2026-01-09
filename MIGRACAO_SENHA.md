# 🔧 Migração: Adicionar Campos de Senha

## Erro Encontrado

O erro `Could not find the 'leader_password' column of 'groups' in the schema cache` indica que a coluna não existe no banco de dados.

## Solução: Executar Migração SQL

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Clique em **New Query**
5. Copie e cole o conteúdo do arquivo `supabase/migrate_add_password_fields.sql`
6. Clique em **Run** ou pressione `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

### Opção 2: Via Script Node.js

Se preferir, você pode executar via script:

```bash
node scripts/execute-sql.js
```

(Precisa ser adaptado para executar o arquivo de migração)

### SQL para Executar

```sql
-- Adicionar coluna leader_password
ALTER TABLE groups 
ADD COLUMN IF NOT EXISTS leader_password VARCHAR(255);

-- Adicionar coluna password_changed
ALTER TABLE groups 
ADD COLUMN IF NOT EXISTS password_changed BOOLEAN DEFAULT FALSE;

-- Atualizar registros existentes
UPDATE groups 
SET password_changed = FALSE 
WHERE password_changed IS NULL;
```

### Verificar Migração

Após executar, verifique se as colunas foram criadas:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'groups' 
  AND column_name IN ('leader_password', 'password_changed');
```

Deve retornar 2 linhas com as informações das colunas.

## Depois da Migração

1. **Limpe o cache do Supabase** (se necessário):
   - No Supabase Dashboard, vá em **Settings** > **API**
   - Clique em **Refresh Schema Cache**

2. **Teste novamente**:
   - Recarregue a aplicação
   - Tente criar um novo grupo
   - O erro não deve mais aparecer

## Notas

- A migração é **idempotente** (pode executar várias vezes sem problema)
- `IF NOT EXISTS` garante que não dará erro se as colunas já existirem
- Grupos existentes terão `password_changed = FALSE` por padrão
- Grupos existentes terão `leader_password = NULL` (podem precisar ser atualizados manualmente)


