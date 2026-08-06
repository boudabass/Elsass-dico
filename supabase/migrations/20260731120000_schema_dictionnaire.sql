-- ============================================
-- Modèle de données du dictionnaire (schéma uniquement, aucune donnée)
-- ============================================
-- Deux niveaux, conformes aux règles 1 à 4 de CLAUDE.md :
--   - attestations : ce qui est attesté dans UNE source, jamais retouché.
--   - entrees      : ce qui est retenu après recoupement multi-sources,
--                     en Orthal, avec validation humaine obligatoire.

-- ============================================
-- Extensions (schéma dédié "extensions")
-- ============================================

CREATE SCHEMA IF NOT EXISTS extensions;

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;

GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;

-- unaccent() n'est pas IMMUTABLE (dépend du dictionnaire de recherche
-- courant), donc inutilisable telle quelle dans un index fonctionnel.
-- Wrapper figé sur le dictionnaire 'extensions.unaccent' pour la rendre
-- déterministe.
CREATE OR REPLACE FUNCTION public.immutable_unaccent(text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
STRICT
AS $$
  SELECT extensions.unaccent('extensions.unaccent'::regdictionary, $1)
$$;

-- ============================================
-- Types ENUM
-- ============================================

CREATE TYPE public.statut_entree AS ENUM ('a_valider', 'valide', 'conflit', 'rejete');
CREATE TYPE public.type_terme AS ENUM ('mot', 'expression', 'proverbe');
CREATE TYPE public.region_alsace AS ENUM ('bas_rhin', 'haut_rhin', 'commun');

-- ============================================
-- TABLE sources — référentiel des sources consultables
-- ============================================

CREATE TABLE public.sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  nom TEXT NOT NULL,
  url TEXT,
  type TEXT NOT NULL CHECK (type IN ('site', 'ouvrage', 'contribution')),
  annee INTEGER,
  licence TEXT,
  fiabilite SMALLINT NOT NULL CHECK (fiabilite BETWEEN 1 AND 5),
  notes TEXT
);

COMMENT ON TABLE public.sources IS
  'Référentiel des sources consultables (ex: culture_alsace). fiabilite (1-5) sert de pondération manuelle lors de l''arbitrage.';

-- ============================================
-- TABLE attestations — un couple français/alsacien tel qu'il apparaît
-- dans UNE source, jamais retouché. Écriture réservée aux scripts
-- d'import (service_role, hors RLS) : aucune policy d'écriture n'est
-- créée pour les rôles anon/authenticated, y compris admin.
-- ============================================

CREATE TABLE public.attestations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES public.sources(id) ON DELETE RESTRICT,
  francais TEXT NOT NULL,
  alsacien TEXT NOT NULL,
  graphie_origine TEXT NOT NULL,
  type public.type_terme NOT NULL,
  contexte TEXT NOT NULL DEFAULT '',
  region public.region_alsace,
  reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_id, francais, alsacien, contexte)
);

COMMENT ON TABLE public.attestations IS
  'Couple français/alsacien tel qu''il apparaît dans une source, non normalisé. Jamais édité à la main : écriture réservée aux scripts d''import (service_role).';
COMMENT ON COLUMN public.attestations.graphie_origine IS
  'Graphie brute telle qu''elle apparaît dans la source, avant toute normalisation Orthal.';
COMMENT ON COLUMN public.attestations.reference IS
  'Localisation précise dans la source : ligne brute, page ou URL.';

-- Recherche floue et insensible aux accents sur le français des attestations,
-- nécessaire pour repérer les candidats au recoupement entre sources
-- (règle 2 de CLAUDE.md) sans full scan.
CREATE INDEX idx_attestations_francais_trgm
  ON public.attestations
  USING GIN (public.immutable_unaccent(lower(francais)) extensions.gin_trgm_ops);

-- ============================================
-- TABLE entrees — l'entrée retenue après recoupement, en Orthal
-- ============================================

CREATE TABLE public.entrees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  francais TEXT NOT NULL,
  contexte TEXT NOT NULL DEFAULT '',
  type public.type_terme NOT NULL,
  traductions JSONB NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(traductions) = 'array')
    CHECK (
      NOT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(traductions) elem
        WHERE elem ? 'region'
          AND elem->>'region' IS NOT NULL
          AND NOT (elem->>'region' = ANY (enum_range(NULL::public.region_alsace)::text[]))
      )
    ),
  nb_attestations INTEGER NOT NULL DEFAULT 0,
  statut public.statut_entree NOT NULL DEFAULT 'a_valider',
  notes_arbitrage TEXT,
  valide_par UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  valide_le TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (statut <> 'valide' OR jsonb_array_length(traductions) > 0)
);

COMMENT ON TABLE public.entrees IS
  'Entrée retenue après recoupement multi-sources, réécrite en Orthal. Statut "a_valider" par défaut, rien ne passe en production sans validation humaine.';
COMMENT ON COLUMN public.entrees.traductions IS
  'Tableau JSONB ordonné. Index 0 = traduction canonique ("Premier est Roi"). Chaque élément : {alsacien, region, niveau, note, nb_attestations}.';
COMMENT ON COLUMN public.entrees.nb_attestations IS
  'Somme des attestations toutes variantes confondues (pas seulement la traduction canonique). Score de confiance dénormalisé au sens de la règle 3 de CLAUDE.md : écrit par le script d''arbitrage au moment de la validation/révision, pas recalculé en direct depuis entree_attestations.';
COMMENT ON COLUMN public.entrees.contexte IS
  'Sépare les homonymes : (francais, contexte) est unique après normalisation (voir ux_entrees_francais_contexte_normalise).';

-- ============================================
-- TABLE entree_attestations — traçabilité entrée <-> sources
-- ============================================

CREATE TABLE public.entree_attestations (
  entree_id UUID NOT NULL REFERENCES public.entrees(id) ON DELETE CASCADE,
  attestation_id UUID NOT NULL REFERENCES public.attestations(id) ON DELETE RESTRICT,
  PRIMARY KEY (entree_id, attestation_id)
);

COMMENT ON TABLE public.entree_attestations IS
  'Lie chaque entrée validée aux attestations qui la justifient (traçabilité du recoupement).';

-- ============================================
-- Index
-- ============================================

-- Recherche floue et insensible aux accents sur le français des entrées
CREATE INDEX idx_entrees_francais_trgm
  ON public.entrees
  USING GIN (public.immutable_unaccent(lower(francais)) extensions.gin_trgm_ops);

-- Unicité (francais, contexte) normalisée casse/accents/espaces : l'audit
-- CLAUDE.md constate 227 doublons dans les données actuelles pour cette
-- raison précise, à ne pas reproduire dans le nouveau schéma.
CREATE UNIQUE INDEX ux_entrees_francais_contexte_normalise
  ON public.entrees (
    public.immutable_unaccent(lower(btrim(francais))),
    public.immutable_unaccent(lower(btrim(contexte)))
  );

CREATE INDEX idx_entrees_traductions_gin
  ON public.entrees
  USING GIN (traductions);

CREATE INDEX idx_entrees_statut
  ON public.entrees (statut);

-- ============================================
-- Trigger updated_at sur entrees
-- ============================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_entrees_set_updated_at
BEFORE UPDATE ON public.entrees
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- RLS
-- ============================================

ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entrees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entree_attestations ENABLE ROW LEVEL SECURITY;

-- entrees : lecture publique des entrées validées uniquement
CREATE POLICY "lecture_publique_entrees_validees"
ON public.entrees FOR SELECT
USING (statut = 'valide');

-- entrees : les admins gèrent le cycle de validation (statut, arbitrage...)
CREATE POLICY "admins_gestion_entrees"
ON public.entrees FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- sources : accès réservé aux admins, aucun accès public
CREATE POLICY "admins_gestion_sources"
ON public.sources FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- attestations : lecture admin uniquement. Pas de policy d'écriture :
-- seuls les scripts d'import via service_role (hors RLS) écrivent ici.
CREATE POLICY "admins_lecture_attestations"
ON public.attestations FOR SELECT TO authenticated
USING (public.is_admin());

-- entree_attestations : accès réservé aux admins, aucun accès public
CREATE POLICY "admins_gestion_entree_attestations"
ON public.entree_attestations FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================
-- Traçabilité publique — sans ouvrir le RLS des tables sensibles
-- ============================================
-- sources.fiabilite/notes sont internes à l'arbitrage, et attestations
-- contient du contenu brut d'une source unique non recoupée (doctrine
-- CLAUDE.md règle 2). Plutôt que d'ajouter une policy SELECT publique sur
-- ces tables, une fonction SECURITY DEFINER (même idiome que is_admin())
-- expose uniquement le nom et l'URL des sources qui justifient une entrée
-- validée : "nous ne supprimons rien, nous choisissons ce que nous
-- enseignons", et "traçabilité = défense contre l'accusation d'alsacien
-- artificiel".

CREATE OR REPLACE FUNCTION public.sources_entree(p_entree_id UUID)
RETURNS TABLE (nom TEXT, url TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT DISTINCT s.nom, s.url
  FROM public.entree_attestations ea
  JOIN public.attestations a ON a.id = ea.attestation_id
  JOIN public.sources s ON s.id = a.source_id
  JOIN public.entrees e ON e.id = ea.entree_id
  WHERE ea.entree_id = p_entree_id
    AND e.statut = 'valide';
$$;

COMMENT ON FUNCTION public.sources_entree(UUID) IS
  'Liste (nom, url) des sources justifiant une entrée validée. Ne renvoie rien pour une entrée non "valide" ni pour un id inexistant. N''expose ni le contenu brut des attestations ni la fiabilité éditoriale des sources.';

GRANT EXECUTE ON FUNCTION public.sources_entree(UUID) TO anon, authenticated;
