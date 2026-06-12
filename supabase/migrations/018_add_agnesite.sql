-- Add Agnesite as a synonym/variety of Bismutite (mindat_id: 687)
INSERT INTO minerals (
  id, mindat_id, name, name_es, chemical_formula,
  hardness_min, hardness_max, crystal_system, mineral_class,
  streak, is_rock, parent_mindat_id
)
SELECT 
  gen_random_uuid(), -108, 'Agnesite', 'Agnesita', 'Bi2(CO3)O2',
  4, 4.5, 'Orthorhombic', 'Carbonates', 'gris clara', false, 687
WHERE NOT EXISTS (
  SELECT 1 FROM minerals WHERE mindat_id = -108
);
