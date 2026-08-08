-- ============================================
-- type_terme : toponymes et prénoms
-- ============================================
-- Les rubriques « villes et villages » et « prénoms alsaciens » de la source
-- culture_alsace ne sont ni des mots, ni des expressions, ni des proverbes.
-- Elles entrent malgré tout dans entrees : ce sont des couples français /
-- alsacien attestés, arbitrés et cherchés comme les autres. Seul le type les
-- distingue.
--
-- Les toponymes sont par ailleurs la première donnée du projet qui remplira
-- réellement entrees.traductions -> region : le code postal de la commune
-- (67xxx / 68xxx) porte l'information, alors que le champ est vide à 100 %
-- dans le dossier Dictionnaire (audit du 31/07/2026).
--
-- ⚠ Migration volontairement seule dans son fichier. Postgres refuse
-- d'utiliser une valeur d'enum dans la même transaction que son ADD VALUE
-- (« unsafe use of new value of enum type »). Toute insertion ou toute
-- fonction qui référence 'toponyme'/'prenom' doit donc vivre dans une
-- migration ultérieure.

ALTER TYPE public.type_terme ADD VALUE IF NOT EXISTS 'toponyme';
ALTER TYPE public.type_terme ADD VALUE IF NOT EXISTS 'prenom';
