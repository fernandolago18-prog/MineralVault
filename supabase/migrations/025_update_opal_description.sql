-- Fix truncated Opal description
UPDATE minerals
SET description = 'Aunque se considera una especie mineral por razones históricas, el ópalo es en realidad un mineraloide. Consiste en sílice amorfa o poco cristalina hidratada (SiO2·nH2O), a menudo con un 3-21% de agua en su estructura. Es famoso por su juego de colores iridiscentes (opalescencia) en las variedades nobles, causado por la difracción de la luz en las esferas microscópicas de sílice que lo componen.'
WHERE mindat_id = 3004;
