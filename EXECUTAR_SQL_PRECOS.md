# 💰 Adicionar Suporte a Múltiplos Preços de Ingressos

O sistema agora suporta diferentes tipos de ingresso (Inteira, Meia Entrada, Sênior) com descrições personalizadas.

## ⚠️ IMPORTANTE: 
Para usar os múltiplos preços, você precisa executar o SQL abaixo no Supabase.

## 📋 PASSO A PASSO RÁPIDO:

### 1. Abra o SQL Editor do Supabase:
👉 **LINK DIRETO:** https://supabase.com/dashboard/project/[SEU_PROJETO]/sql/new

### 2. Copie TODO o SQL abaixo:

```sql
-- Adicionar coluna prices na tabela tours
-- Permite armazenar múltiplos preços por tipo de ingresso (Inteira, Meia, Sênior)
-- Formato JSON: {"inteira": {"value": 100.00, "description": "..."}, "meia": {...}, "senior": {...}}

ALTER TABLE tours 
ADD COLUMN IF NOT EXISTS prices JSONB;

-- Comentário explicativo
COMMENT ON COLUMN tours.prices IS 'JSON com preços por tipo de ingresso: {"inteira": {"value": number, "description": "string"}, "meia": {...}, "senior": {...}}';

-- Verificar se a coluna foi criada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tours' 
  AND column_name = 'prices';
```

### 3. Execute o SQL

### 4. Verifique se funcionou:
O resultado deve mostrar a coluna `prices` com tipo `jsonb`.

---

## ✅ Funcionalidades Adicionadas:

1. **Campos de Preço por Tipo:**
   - Ingresso Inteira (padrão)
   - Meia Entrada (50% desconto)
   - Ingresso Sênior (60+ anos)

2. **Descrições Personalizadas:**
   - Cada tipo de ingresso pode ter uma descrição sobre idade, condições, etc.

3. **Exibição Inteligente:**
   - Se houver múltiplos preços, mostra faixa (ex: "R$ 50,00 - R$ 100,00")
   - Se houver apenas um preço, mostra o valor único
   - Detalhes completos aparecem nos cards dos passeios

4. **Compatibilidade:**
   - O campo `price` antigo continua funcionando para compatibilidade
   - Se não houver preços múltiplos, usa o preço padrão

---

## 📝 Notas:

- O sistema funciona mesmo sem a coluna `prices`, usando apenas o campo `price` padrão
- Para usar os múltiplos preços, execute o SQL acima
- Os preços são armazenados como JSON no banco de dados
- Cada passeio pode ter qualquer combinação dos três tipos de ingresso
