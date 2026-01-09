-- Script para deletar TODAS as viagens e passeios
-- ATENÇÃO: Esta operação é IRREVERSÍVEL!
-- Execute apenas se tiver certeza que deseja apagar todos os dados

-- Deletar em ordem (respeitando foreign keys com CASCADE)
-- Como as tabelas têm CASCADE, deletar trips vai deletar automaticamente:
-- - tours (via trip_id)
-- - tour_links (via trip_id ou tour_id)
-- - groups (via trip_id)
-- - tour_attendance (via group_id ou tour_id)

-- Opção 1: Deletar tudo de uma vez (mais rápido)
DELETE FROM trips;

-- Opção 2: Deletar passo a passo (mais seguro para verificar)
-- Descomente as linhas abaixo se preferir deletar manualmente:

-- DELETE FROM tour_attendance;
-- DELETE FROM tour_links;
-- DELETE FROM tours;
-- DELETE FROM groups;
-- DELETE FROM trips;

-- Verificar se foi deletado
SELECT 
  (SELECT COUNT(*) FROM trips) as trips_count,
  (SELECT COUNT(*) FROM tours) as tours_count,
  (SELECT COUNT(*) FROM groups) as groups_count,
  (SELECT COUNT(*) FROM tour_attendance) as attendance_count,
  (SELECT COUNT(*) FROM tour_links) as links_count;

-- Se todos retornarem 0, tudo foi deletado com sucesso


