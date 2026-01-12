# Executar SQL para Adicionar Coluna Endereço

## ⚠️ IMPORTANTE
O sistema está funcionando mesmo sem a coluna `address`, mas para usar o campo de endereço nos passeios, você precisa executar o SQL abaixo no Supabase.

## 📋 Como Executar o SQL

### Opção 1: Via Dashboard do Supabase (Recomendado)

1. Acesse o [Dashboard do Supabase](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Clique em **New Query**
5. Cole o SQL abaixo:

```sql
-- Adicionar coluna 'address' na tabela tours
-- Esta coluna armazena o endereço completo do passeio

ALTER TABLE tours 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Comentário na coluna para documentação
COMMENT ON COLUMN tours.address IS 'Endereço completo do passeio (ex: Rua das Flores, 123 - Centro, Cidade - Estado)';
```

6. Clique em **Run** (ou pressione `Cmd+Enter` / `Ctrl+Enter`)
7. Verifique se a mensagem de sucesso aparece

### Opção 2: Via Arquivo SQL

O arquivo está em: `supabase/add_address_to_tours.sql`

Você pode copiar o conteúdo desse arquivo e executar no SQL Editor.

## ✅ Verificação

Após executar o SQL, você pode verificar se funcionou:

1. No SQL Editor, execute:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tours' 
  AND column_name = 'address';
```

2. Deve retornar uma linha com informações sobre a coluna `address`

## 🎯 Resultado

Depois de executar o SQL:
- ✅ O campo "Endereço" aparecerá no formulário de novo passeio
- ✅ O endereço será salvo no banco de dados
- ✅ O endereço aparecerá na página de detalhes do passeio
- ✅ O endereço poderá ser editado ao editar um passeio existente

## 📝 Nota

O código já foi ajustado para funcionar **mesmo sem** a coluna address, então o sistema continua funcionando normalmente. O endereço simplesmente não será salvo até você executar o SQL.
