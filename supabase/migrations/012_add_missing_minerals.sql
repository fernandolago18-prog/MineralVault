-- Fix Dumortierite streak
UPDATE minerals
SET streak = 'blanca'
WHERE name ILIKE '%dumortierite%' OR name_es ILIKE '%dumortierita%';

-- Add Chabasita (General) if it doesn't exist
INSERT INTO minerals (
  id, mindat_id, name, name_es, chemical_formula,
  hardness_min, hardness_max, crystal_system, mineral_class,
  streak, is_rock
)
SELECT 
  gen_random_uuid(), 934, 'Chabazite', 'Chabasita', '(Ca,Na2,K2,Mg)Al2Si4O12·6H2O',
  4, 5, 'Triclinic', 'Silicates', 'blanca', false
WHERE NOT EXISTS (
  SELECT 1 FROM minerals WHERE name_es ILIKE '%chabasita%' OR mindat_id = 934
);

-- Associate existing Chabazites to the new parent
UPDATE minerals
SET parent_mindat_id = 934
WHERE name ILIKE '%chabazite-%' OR name_es ILIKE '%cabazite-%';

-- Add Garnierite if it doesn't exist
INSERT INTO minerals (
  id, mindat_id, name, name_es, chemical_formula,
  hardness_min, hardness_max, crystal_system, mineral_class,
  streak, is_rock
)
SELECT 
  gen_random_uuid(), 1656, 'Garnierite', 'Garnierita', 'Ni-bearing silicate',
  2, 3, 'Amorphous', 'Silicates', 'verde claro', false
WHERE NOT EXISTS (
  SELECT 1 FROM minerals WHERE name_es ILIKE '%garnierita%' OR mindat_id = 1656
);
