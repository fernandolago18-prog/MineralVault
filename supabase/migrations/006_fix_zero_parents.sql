-- ============================================================
-- MineralVault — Migración: Corrección de IDs de padres a nivel de base de datos
-- Convierte parent_mindat_id = 0 a NULL para restaurar los minerales ocultos en el catálogo
-- ============================================================

UPDATE public.minerals
   SET parent_mindat_id = NULL
 WHERE parent_mindat_id = 0;
