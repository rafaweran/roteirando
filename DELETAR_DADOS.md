# Como Deletar Todas as Viagens e Passeios

## ⚠️ ATENÇÃO
**Esta operação é IRREVERSÍVEL!** Todos os dados serão permanentemente apagados.

## Opção 1: Deletar Apenas Viagens e Passeios (Recomendado)

### Passo 1: Acessar Supabase
1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Clique em **New Query**

### Passo 2: Executar Script
Copie e cole o conteúdo do arquivo `supabase/delete_all_trips_tours.sql`:

```sql
-- Deletar todas as viagens (isso deleta automaticamente tours, groups, etc. via CASCADE)
DELETE FROM trips;

-- Verificar se foi deletado
SELECT 
  (SELECT COUNT(*) FROM trips) as trips_count,
  (SELECT COUNT(*) FROM tours) as tours_count,
  (SELECT COUNT(*) FROM groups) as groups_count,
  (SELECT COUNT(*) FROM tour_attendance) as attendance_count,
  (SELECT COUNT(*) FROM tour_links) as links_count;
```

### Passo 3: Confirmar
Todos os valores devem retornar `0` se tudo foi deletado.

---

## Opção 2: Deletar Tudo (Incluindo Grupos)

Se você também quiser deletar os grupos:

```sql
-- Deletar tudo passo a passo
DELETE FROM tour_attendance;
DELETE FROM tour_links;
DELETE FROM tours;
DELETE FROM groups;
DELETE FROM trips;
```

---

## Opção 3: Deletar Apenas Passeios (Mantém Viagens)

Se você quiser manter as viagens mas deletar apenas os passeios:

```sql
DELETE FROM tour_attendance;
DELETE FROM tour_links;
DELETE FROM tours;
```

---

## Verificar Antes de Deletar

Para ver quantos registros existem antes de deletar:

```sql
SELECT 
  (SELECT COUNT(*) FROM trips) as total_viagens,
  (SELECT COUNT(*) FROM tours) as total_passeios,
  (SELECT COUNT(*) FROM groups) as total_grupos,
  (SELECT COUNT(*) FROM tour_attendance) as total_presencas,
  (SELECT COUNT(*) FROM tour_links) as total_links;
```

---

## Backup (Recomendado)

Antes de deletar, faça um backup:

1. No Supabase Dashboard, vá em **Database** → **Backups**
2. Crie um backup manual
3. Ou exporte os dados via SQL:

```sql
-- Exportar viagens
SELECT * FROM trips;

-- Exportar passeios
SELECT * FROM tours;

-- Exportar grupos
SELECT * FROM groups;
```

---

## Após Deletar

Após deletar, você pode:
1. Criar novas viagens e passeios normalmente
2. Os IDs serão gerados automaticamente do zero
3. Não haverá conflitos com dados antigos

