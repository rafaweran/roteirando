# ⚡ CRIAR TABELAS RAPIDAMENTE

## 🚀 MÉTODO MAIS RÁPIDO (Recomendado):

### 1️⃣ Obtenha a Connection String:
1. Acesse: https://supabase.com/dashboard/project/dmsawbzaaftdtiggyfxd/settings/database
2. Role até a seção "Connection string"
3. Selecione "URI" mode
4. **Copie a connection string completa** (formato: `postgresql://postgres:[PASSWORD]@db.dmsawbzaaftdtiggyfxd.supabase.co:5432/postgres`)

### 2️⃣ Execute o script:
```bash
DATABASE_URL="sua_connection_string_aqui" node scripts/create-all-tables.js
```

## 📋 OU: Execute no SQL Editor (Mais Fácil!)

1. Acesse: https://supabase.com/dashboard/project/dmsawbzaaftdtiggyfxd/sql/new
2. Clique em "New Query"
3. Abra o arquivo `supabase/schema.sql` no seu editor
4. Copie TODO o conteúdo
5. Cole no SQL Editor do Supabase
6. Clique em "Run" (ou Cmd+Enter)

**Isso levará menos de 2 minutos e criará todas as tabelas!**


