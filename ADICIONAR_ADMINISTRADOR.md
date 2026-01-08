# Como Adicionar Administradores

## Opção 1: Via Banco de Dados (Recomendado)

### Passo 1: Executar o Script SQL

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Execute o script: `supabase/add_raffiweran_admin.sql`

Este script irá:
- Criar a tabela `admins` se não existir
- Adicionar `raffiweran@gmail.com` como administrador
- Garantir que `admin@travel.com` também está na lista

### Passo 2: Verificar

Após executar o script, você pode verificar se foi adicionado:

```sql
SELECT * FROM admins;
```

## Opção 2: Adicionar Outros Administradores

Para adicionar novos administradores, execute no SQL Editor:

```sql
INSERT INTO admins (email, name) 
VALUES ('seu-email@exemplo.com', 'Nome do Administrador')
ON CONFLICT (email) DO UPDATE 
SET name = EXCLUDED.name, updated_at = NOW();
```

## Como Funciona

O sistema verifica administradores em duas etapas:

1. **Primeiro**: Verifica no banco de dados (tabela `admins`)
2. **Fallback**: Se a tabela não existir, usa a lista hardcoded:
   - `admin@travel.com`
   - `raffiweran@gmail.com`

## Remover Administrador

Para remover um administrador:

```sql
DELETE FROM admins WHERE email = 'email@exemplo.com';
```

## Listar Todos os Administradores

```sql
SELECT id, email, name, created_at FROM admins ORDER BY created_at;
```

## Notas Importantes

- O email é case-insensitive (não diferencia maiúsculas/minúsculas)
- O sistema faz trim automático dos espaços
- A tabela `admins` tem RLS habilitado, mas permite leitura pública para verificação
- A senha ainda não é verificada (será implementada futuramente)

