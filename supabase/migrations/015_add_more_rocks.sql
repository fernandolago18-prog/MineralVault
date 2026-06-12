-- Add Desert Rose (Rosa del desierto) as a variety of Gypsum (mindat_id: 1784)
INSERT INTO minerals (
  id, mindat_id, name, name_es, chemical_formula,
  hardness_min, hardness_max, crystal_system, mineral_class,
  streak, is_rock, parent_mindat_id
)
SELECT 
  gen_random_uuid(), -102, 'Desert Rose', 'Rosa del desierto', 'CaSO4·2H2O',
  2, 2, 'Monoclinic', 'Sulfates', 'blanca', false, 1784
WHERE NOT EXISTS (
  SELECT 1 FROM minerals WHERE mindat_id = -102
);

-- Add Radiolarite (Lydite / Radiolarita) as a Rock
INSERT INTO minerals (
  id, mindat_id, name, name_es, chemical_formula,
  hardness_min, hardness_max, crystal_system, mineral_class,
  streak, is_rock, parent_mindat_id
)
SELECT 
  gen_random_uuid(), -103, 'Radiolarite (Lydite)', 'Radiolarita (Lidita)', 'SiO2 (Roca biosilícea)',
  6, 7, 'Amorphous', 'Roca Sedimentaria', 'blanca', true, null
WHERE NOT EXISTS (
  SELECT 1 FROM minerals WHERE mindat_id = -103
);

-- Add Zeolite (Grupo de las Zeolitas)
INSERT INTO minerals (
  id, mindat_id, name, name_es, chemical_formula,
  hardness_min, hardness_max, crystal_system, mineral_class,
  streak, is_rock, parent_mindat_id
)
SELECT 
  gen_random_uuid(), -104, 'Zeolite Group', 'Zeolita (Grupo)', 'Aluminosilicatos hidratados',
  3, 5, 'Various', 'Silicates', 'blanca', false, null
WHERE NOT EXISTS (
  SELECT 1 FROM minerals WHERE mindat_id = -104
);
