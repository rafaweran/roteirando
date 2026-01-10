# Executar SQL para Adicionar Coluna Tags

## ⚠️ IMPORTANTE
O sistema está funcionando mesmo sem a coluna `tags`, mas para usar as tags de categorias, você precisa executar o SQL abaixo no Supabase.

## 📋 Como Executar o SQL

### Opção 1: Via Dashboard do Supabase (Recomendado)

1. Acesse o [Dashboard do Supabase](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Clique em **New Query**
5. Cole o SQL abaixo:

```sql
-- Adicionar coluna tags na tabela tours
-- Permite categorizar passeios com tags como: Restaurante, Passeios, Shows, etc.

ALTER TABLE tours 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Comentário explicativo
COMMENT ON COLUMN tours.tags IS 'Array de tags/categorias do passeio (ex: Restaurante, Passeios, Shows, etc.)';

-- Verificar se a coluna foi criada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tours' 
  AND column_name = 'tags';
```

6. Clique em **Run** (ou pressione `Cmd+Enter` / `Ctrl+Enter`)
7. Verifique se a mensagem de sucesso aparece

### Opção 2: Via Arquivo SQL

O arquivo está em: `supabase/add_tags_to_tours.sql`

Você pode copiar o conteúdo desse arquivo e executar no SQL Editor.

## ✅ Verificação

Após executar o SQL, você pode verificar se funcionou:

1. No SQL Editor, execute:
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tours' 
  AND column_name = 'tags';
```

2. Deve retornar uma linha com informações sobre a coluna `tags`

## 🎯 Resultado

Depois de executar o SQL:
- ✅ O sistema poderá salvar tags nos passeios
- ✅ As tags aparecerão nos cards de passeios
- ✅ As tags aparecerão na página de detalhes do passeio
- ✅ Não haverá mais erros ao criar/editar passeios com tags

## 📝 Nota

O código já foi ajustado para funcionar **mesmo sem** a coluna tags, então o sistema continua funcionando normalmente. As tags simplesmente não serão salvas até você executar o SQL.
