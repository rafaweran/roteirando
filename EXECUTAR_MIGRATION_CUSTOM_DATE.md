# Executar Migration: Adicionar coluna custom_date

## Problema
A coluna `custom_date` não existe na tabela `tour_attendance` no banco de dados de produção, causando erro ao confirmar presença.

## Solução

### Opção 1: Executar via Supabase Dashboard (Recomendado)

1. Acesse o SQL Editor do Supabase:
   https://supabase.com/dashboard/project/dmsawbzaaftdtiggyfxd/sql/new

2. Cole o seguinte SQL:

```sql
-- Adicionar coluna custom_date na tabela tour_attendance
-- Permite que grupos escolham ir em uma data diferente da data original do passeio
-- Se NULL, significa que o grupo vai junto com o grupo na data original
-- Se preenchido, é a data escolhida pelo grupo

ALTER TABLE tour_attendance 
ADD COLUMN IF NOT EXISTS custom_date DATE;

-- Comentário explicativo
COMMENT ON COLUMN tour_attendance.custom_date IS 'Data personalizada escolhida pelo grupo. NULL = vai na data original do passeio';

-- Verificar se a coluna foi criada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tour_attendance' 
  AND column_name = 'custom_date';
```

3. Clique em "Run" (ou pressione Cmd+Enter / Ctrl+Enter)

4. Verifique se a coluna foi criada corretamente (a última query deve retornar uma linha com os dados da coluna)

### Opção 2: Executar via Script Node.js

Execute no terminal:
```bash
node scripts/execute-sql.js supabase/add_custom_date_to_attendance.sql
```

## Verificação

Após executar, verifique se a coluna foi criada:
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'tour_attendance' 
  AND column_name = 'custom_date';
```

Se retornar uma linha, a coluna foi criada com sucesso!
