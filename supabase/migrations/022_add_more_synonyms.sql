-- Add Oligisto as a synonym/variety of Hematite (mindat_id: 1856)
INSERT INTO minerals (
  id, mindat_id, name, name_es, chemical_formula,
  hardness_min, hardness_max, crystal_system, mineral_class,
  streak, is_rock, parent_mindat_id
)
SELECT 
  gen_random_uuid(), -110, 'Oligisto', 'Oligisto', 'Fe2O3',
  5, 6, 'Trigonal', 'Oxides', 'roja a marrón rojizo', false, 1856
WHERE NOT EXISTS (
  SELECT 1 FROM minerals WHERE mindat_id = -110
);

-- Add Pistacite as a variety of Epidote (mindat_id: 1389)
INSERT INTO minerals (
  id, mindat_id, name, name_es, chemical_formula,
  hardness_min, hardness_max, crystal_system, mineral_class,
  streak, is_rock, parent_mindat_id
)
SELECT 
  gen_random_uuid(), -111, 'Pistacite', 'Pistacita', 'Ca2(Al,Fe)3(SiO4)3(OH)',
  6, 7, 'Monoclinic', 'Silicates', 'gris a incolora', false, 1389
WHERE NOT EXISTS (
  SELECT 1 FROM minerals WHERE mindat_id = -111
);
