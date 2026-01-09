-- Script COMPLETO para deletar TODOS os dados do sistema
-- ATENÇÃO: Esta operação é IRREVERSÍVEL!
-- Execute apenas se tiver certeza absoluta

-- Deletar em ordem (respeitando foreign keys)
-- A ordem importa devido às relações de foreign key

-- 1. Deletar participações em tours (tour_attendance)
DELETE FROM tour_attendance;
SELECT 'tour_attendance deletado' as status;

-- 2. Deletar links de tours
DELETE FROM tour_links;
SELECT 'tour_links deletado' as status;

-- 3. Deletar tours
DELETE FROM tours;
SELECT 'tours deletado' as status;

-- 4. Deletar grupos
DELETE FROM groups;
SELECT 'groups deletado' as status;

-- 5. Deletar viagens (isso também deleta tours e groups via CASCADE, mas já deletamos acima)
DELETE FROM trips;
SELECT 'trips deletado' as status;

-- 6. Verificar se tudo foi deletado
SELECT 
  'Verificação Final' as status,
  (SELECT COUNT(*) FROM trips) as trips_restantes,
  (SELECT COUNT(*) FROM tours) as tours_restantes,
  (SELECT COUNT(*) FROM groups) as groups_restantes,
  (SELECT COUNT(*) FROM tour_attendance) as attendance_restante,
  (SELECT COUNT(*) FROM tour_links) as links_restantes;

-- Se todos os valores forem 0, tudo foi deletado com sucesso!


