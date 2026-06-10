-- ============================================================
-- MineralVault — Migración: Limpieza de valores vacíos/cero
-- Convierte strings vacías "" → NULL y ceros en dureza/densidad → NULL
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Limpiar campos de texto con string vacía → NULL
UPDATE public.minerals SET description      = NULL WHERE description      = '';
UPDATE public.minerals SET chemical_formula = NULL WHERE chemical_formula = '';
UPDATE public.minerals SET streak           = NULL WHERE streak           = '';
UPDATE public.minerals SET transparency     = NULL WHERE transparency     = '';
UPDATE public.minerals SET cleavage         = NULL WHERE cleavage         = '';
UPDATE public.minerals SET fracture         = NULL WHERE fracture         = '';
UPDATE public.minerals SET tenacity         = NULL WHERE tenacity         = '';
UPDATE public.minerals SET magnetism        = NULL WHERE magnetism        = '';
UPDATE public.minerals SET radioactivity    = NULL WHERE radioactivity    = '';
UPDATE public.minerals SET fluorescence     = NULL WHERE fluorescence     = '';
UPDATE public.minerals SET mineral_class    = NULL WHERE mineral_class    = '';
UPDATE public.minerals SET strunz_number    = NULL WHERE strunz_number    = '';
UPDATE public.minerals SET dana_number      = NULL WHERE dana_number      = '';
UPDATE public.minerals SET mindat_url       = NULL WHERE mindat_url       = '';
UPDATE public.minerals SET thumbnail_url    = NULL WHERE thumbnail_url    = '';
UPDATE public.minerals SET name_es          = NULL WHERE name_es          = '';
UPDATE public.minerals SET crystal_system   = NULL WHERE crystal_system   = '';

-- 2. Limpiar arrays vacíos → NULL
UPDATE public.minerals SET color             = NULL WHERE color             = '{}' OR array_length(color, 1) IS NULL;
UPDATE public.minerals SET luster            = NULL WHERE luster            = '{}' OR array_length(luster, 1) IS NULL;
UPDATE public.minerals SET crystal_habits    = NULL WHERE crystal_habits    = '{}' OR array_length(crystal_habits, 1) IS NULL;
UPDATE public.minerals SET associated_minerals = NULL WHERE associated_minerals = '{}' OR array_length(associated_minerals, 1) IS NULL;
UPDATE public.minerals SET localities        = NULL WHERE localities        = '{}' OR array_length(localities, 1) IS NULL;

-- 3. Limpiar dureza cero → NULL (ningún mineral tiene dureza 0)
UPDATE public.minerals SET hardness_min = NULL WHERE hardness_min = 0;
UPDATE public.minerals SET hardness_max = NULL WHERE hardness_max = 0;
-- Sincronizar: si hardness_min es NULL, hardness_max debe serlo también
UPDATE public.minerals SET hardness_max = NULL WHERE hardness_min IS NULL AND hardness_max IS NOT NULL;

-- 4. Limpiar densidad cero → NULL
UPDATE public.minerals SET density_min = NULL WHERE density_min = 0;
UPDATE public.minerals SET density_max = NULL WHERE density_max = 0;
UPDATE public.minerals SET density_max = NULL WHERE density_min IS NULL AND density_max IS NOT NULL;

-- 5. Verificación: mostrar estadísticas de datos útiles por campo
SELECT
  COUNT(*) AS total,
  COUNT(description)      FILTER (WHERE description IS NOT NULL AND description != '')      AS con_descripcion,
  COUNT(chemical_formula) FILTER (WHERE chemical_formula IS NOT NULL)                       AS con_formula,
  COUNT(hardness_min)     FILTER (WHERE hardness_min IS NOT NULL)                           AS con_dureza,
  COUNT(density_min)      FILTER (WHERE density_min IS NOT NULL)                            AS con_densidad,
  COUNT(color)            FILTER (WHERE color IS NOT NULL)                                  AS con_color,
  COUNT(crystal_system)   FILTER (WHERE crystal_system IS NOT NULL)                         AS con_sistema_cristalino,
  COUNT(mineral_class)    FILTER (WHERE mineral_class IS NOT NULL)                          AS con_clase
FROM public.minerals;
