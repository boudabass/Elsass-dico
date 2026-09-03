-- ============================================
-- Modèle de confiance à trois niveaux (décision de John, 02/09/2026)
-- ============================================
-- CLAUDE.md, règle 2 révisée : une entrée peut être publiée à partir d'une
-- source unique à condition d'afficher son niveau de confiance — 1 source =
-- rouge, 2 = jaune, 3 et plus = vert. Le seuil binaire ne suffit plus de
-- barrière, l'affichage devient la garde qui reste : "publier peu recoupé
-- est permis, le faire passer pour recoupé ne l'est pas" (règles de travail).
--
-- Le piège relevé dans le journal du 02/09 : entrees.nb_attestations n'est
-- PAS un nombre de sources (une source peut fournir plusieurs attestations
-- pour la même entrée). Afficher nb_attestations en croyant afficher des
-- sources surestimerait la confiance — exactement ce que le badge doit
-- empêcher. arbitrer_entree() calcule déjà v_nb_sources (count(DISTINCT
-- source_id)) pour la garde de la règle 2, mais ne le persistait jamais :
-- cette migration ajoute la colonne qui le porte.

ALTER TABLE public.entrees
  ADD COLUMN IF NOT EXISTS nb_sources INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.entrees.nb_sources IS
  'Nombre de sources DISTINCTES (source_id) fondant l''entrée — distinct de nb_attestations, qui compte les attestations. C''est ce nombre qui détermine le niveau de confiance affiché (1 = rouge, 2 = jaune, 3+ = vert). Écrit par arbitrer_entree() au moment de la validation/révision, comme nb_attestations.';

-- Rétro-remplissage des 332 entrées déjà publiées, recompté depuis la
-- traçabilité réelle (entree_attestations), pas depuis un score déclaratif.
UPDATE public.entrees e
SET nb_sources = sub.n
FROM (
  SELECT ea.entree_id, count(DISTINCT a.source_id) AS n
  FROM public.entree_attestations ea
  JOIN public.attestations a ON a.id = ea.attestation_id
  GROUP BY ea.entree_id
) sub
WHERE sub.entree_id = e.id;

-- ============================================
-- arbitrer_entree() : persiste nb_sources
-- ============================================
-- Signature inchangée, seul le corps change : v_nb_sources était déjà calculé
-- pour la garde de la règle 2, il ne restait qu'à l'écrire.

CREATE OR REPLACE FUNCTION public.arbitrer_entree(
  p_francais TEXT,
  p_contexte TEXT,
  p_type public.type_terme,
  p_traductions JSONB,
  p_attestation_ids UUID[],
  p_statut public.statut_entree,
  p_notes TEXT DEFAULT NULL,
  p_entree_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entree_id UUID;
  v_nb_sources INTEGER;
  v_nb_attestations INTEGER;
  v_notes TEXT := nullif(btrim(coalesce(p_notes, '')), '');
  v_francais TEXT := btrim(coalesce(p_francais, ''));
  v_contexte TEXT := btrim(coalesce(p_contexte, ''));
  v_valide_par UUID;
  v_valide_le TIMESTAMPTZ;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Arbitrage réservé aux administrateurs';
  END IF;

  IF v_francais = '' THEN
    RAISE EXCEPTION 'Le français est obligatoire';
  END IF;

  IF jsonb_typeof(p_traductions) <> 'array' THEN
    RAISE EXCEPTION 'traductions doit être un tableau JSON';
  END IF;

  -- Une traduction sans forme alsacienne n'est pas une traduction. Le CHECK de
  -- la table ne vérifie que la forme du tableau et les régions.
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_traductions) elem
    WHERE nullif(btrim(coalesce(elem->>'alsacien', '')), '') IS NULL
  ) THEN
    RAISE EXCEPTION 'Chaque traduction doit porter une forme alsacienne';
  END IF;

  IF coalesce(array_length(p_attestation_ids, 1), 0) = 0 THEN
    RAISE EXCEPTION 'Une entrée doit être fondée sur au moins une attestation (règle 3)';
  END IF;

  SELECT count(DISTINCT a.source_id)::INTEGER, count(*)::INTEGER
    INTO v_nb_sources, v_nb_attestations
  FROM public.attestations a
  WHERE a.id = ANY (p_attestation_ids);

  IF v_nb_attestations <> array_length(p_attestation_ids, 1) THEN
    RAISE EXCEPTION 'Attestation inconnue dans la sélection';
  END IF;

  -- Règle 2 de CLAUDE.md, avec l'exception décidée le 07/08/2026 : un admin
  -- peut publier depuis une source unique s'il en juge ainsi, mais alors il
  -- doit écrire pourquoi. La justification est exigée ici, pas seulement dans
  -- l'interface : c'est ce qui distingue le témoignage arbitré d'un locuteur
  -- de la reprise en masse d'une source scrapée.
  IF p_statut = 'valide' AND v_nb_sources < 2 AND v_notes IS NULL THEN
    RAISE EXCEPTION
      'Publication sur source unique : une note d''arbitrage est obligatoire (règle 2)';
  END IF;

  IF p_statut = 'valide' THEN
    v_valide_par := auth.uid();
    v_valide_le := now();
  END IF;

  IF p_entree_id IS NULL THEN
    INSERT INTO public.entrees (
      francais, contexte, type, traductions,
      nb_attestations, nb_sources, statut, notes_arbitrage, valide_par, valide_le
    )
    VALUES (
      v_francais, v_contexte, p_type, p_traductions,
      v_nb_attestations, v_nb_sources, p_statut, v_notes, v_valide_par, v_valide_le
    )
    RETURNING id INTO v_entree_id;
  ELSE
    UPDATE public.entrees SET
      francais = v_francais,
      contexte = v_contexte,
      type = p_type,
      traductions = p_traductions,
      nb_attestations = v_nb_attestations,
      nb_sources = v_nb_sources,
      statut = p_statut,
      notes_arbitrage = v_notes,
      valide_par = v_valide_par,
      valide_le = v_valide_le
    WHERE id = p_entree_id
    RETURNING id INTO v_entree_id;

    IF v_entree_id IS NULL THEN
      RAISE EXCEPTION 'Entrée introuvable : %', p_entree_id;
    END IF;
  END IF;

  -- Traçabilité : on remplace intégralement l'ensemble des liens, pour que
  -- entree_attestations décrive toujours la décision courante et non un
  -- empilement d'arbitrages successifs.
  DELETE FROM public.entree_attestations
  WHERE entree_id = v_entree_id
    AND attestation_id <> ALL (p_attestation_ids);

  INSERT INTO public.entree_attestations (entree_id, attestation_id)
  SELECT v_entree_id, unnest(p_attestation_ids)
  ON CONFLICT DO NOTHING;

  RETURN v_entree_id;
END;
$$;

COMMENT ON FUNCTION public.arbitrer_entree(TEXT, TEXT, public.type_terme, JSONB, UUID[], public.statut_entree, TEXT, UUID) IS
  'Crée ou met à jour une entrée, remplace ses liens de traçabilité et recalcule nb_attestations ET nb_sources, en une transaction. Refuse la validation sous 2 sources distinctes sans note d''arbitrage (règle 2 + exception du 07/08/2026).';

-- ============================================
-- Fonctions de lecture : exposer nb_sources
-- ============================================
-- Postgres n'autorise pas CREATE OR REPLACE quand la liste de colonnes de
-- RETURNS TABLE change : DROP puis CREATE, et re-GRANT (DROP retire les
-- privilèges accordés séparément).

DROP FUNCTION IF EXISTS public.rechercher_entrees(TEXT, INTEGER);

CREATE FUNCTION public.rechercher_entrees(
  p_terme TEXT,
  p_limite INTEGER DEFAULT 30
)
RETURNS TABLE (
  id UUID,
  francais TEXT,
  contexte TEXT,
  type public.type_terme,
  traductions JSONB,
  nb_attestations INTEGER,
  nb_sources INTEGER,
  score REAL
)
LANGUAGE sql
STABLE
SET search_path = public, extensions
AS $$
  WITH terme AS (
    SELECT public.immutable_unaccent(lower(btrim(coalesce(p_terme, '')))) AS q
  )
  SELECT
    e.id,
    e.francais,
    e.contexte,
    e.type,
    e.traductions,
    e.nb_attestations,
    e.nb_sources,
    greatest(
      similarity(public.immutable_unaccent(lower(e.francais)), terme.q),
      similarity(public.immutable_unaccent(lower(e.alsacien_recherche)), terme.q)
    ) AS pertinence
  FROM public.entrees e, terme
  WHERE terme.q <> ''
    AND e.statut = 'valide'
    AND (
      public.immutable_unaccent(lower(e.francais)) LIKE terme.q || '%'
      OR public.immutable_unaccent(lower(e.alsacien_recherche)) LIKE '%' || terme.q || '%'
      OR public.immutable_unaccent(lower(e.francais)) % terme.q
      OR public.immutable_unaccent(lower(e.alsacien_recherche)) % terme.q
    )
  ORDER BY pertinence DESC, e.francais
  LIMIT least(coalesce(p_limite, 30), 100);
$$;

COMMENT ON FUNCTION public.rechercher_entrees(TEXT, INTEGER) IS
  'Recherche floue dans les deux sens sur les entrées validées uniquement. Non SECURITY DEFINER : le RLS reste la barrière. Expose nb_sources pour le badge de confiance à trois niveaux (02/09/2026).';

GRANT EXECUTE ON FUNCTION public.rechercher_entrees(TEXT, INTEGER) TO anon, authenticated;

DROP FUNCTION IF EXISTS public.entrees_par_lettre(TEXT);

CREATE FUNCTION public.entrees_par_lettre(p_lettre TEXT)
RETURNS TABLE (
  id UUID,
  francais TEXT,
  contexte TEXT,
  type public.type_terme,
  traductions JSONB,
  nb_attestations INTEGER,
  nb_sources INTEGER
)
LANGUAGE sql
STABLE
SET search_path = public, extensions
AS $$
  SELECT e.id, e.francais, e.contexte, e.type, e.traductions, e.nb_attestations, e.nb_sources
  FROM public.entrees e
  WHERE e.statut = 'valide'
    AND upper(left(public.immutable_unaccent(e.francais), 1)) = upper(left(public.immutable_unaccent(coalesce(p_lettre, '')), 1))
  ORDER BY public.immutable_unaccent(lower(e.francais)), e.francais;
$$;

COMMENT ON FUNCTION public.entrees_par_lettre(TEXT) IS
  'Entrées valides dont le français commence par la lettre donnée (comparaison désaccentuée). Non SECURITY DEFINER : le RLS reste la barrière, comme rechercher_entrees(). Expose nb_sources pour le badge de confiance (02/09/2026).';

REVOKE EXECUTE ON FUNCTION public.entrees_par_lettre(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.entrees_par_lettre(TEXT) TO anon, authenticated;

DROP FUNCTION IF EXISTS public.entrees_par_statut(public.statut_entree, TEXT, INTEGER, INTEGER);

CREATE FUNCTION public.entrees_par_statut(
  p_statut public.statut_entree DEFAULT NULL,
  p_terme TEXT DEFAULT NULL,
  p_limite INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  cle TEXT,
  francais TEXT,
  contexte TEXT,
  type public.type_terme,
  traductions JSONB,
  nb_attestations INTEGER,
  nb_sources INTEGER,
  statut public.statut_entree,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_terme TEXT := public.immutable_unaccent(lower(btrim(coalesce(p_terme, ''))));
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Arbitrage réservé aux administrateurs';
  END IF;

  RETURN QUERY
  SELECT
    e.id,
    public.immutable_unaccent(lower(btrim(e.francais))),
    e.francais,
    e.contexte,
    e.type,
    e.traductions,
    e.nb_attestations,
    e.nb_sources,
    e.statut,
    e.updated_at
  FROM public.entrees e
  WHERE (p_statut IS NULL OR e.statut = p_statut)
    AND (
      v_terme = ''
      OR public.immutable_unaccent(lower(e.francais)) LIKE '%' || v_terme || '%'
    )
  ORDER BY e.updated_at DESC
  LIMIT least(coalesce(p_limite, 50), 200)
  OFFSET greatest(coalesce(p_offset, 0), 0);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.entrees_par_statut(public.statut_entree, TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.entrees_par_statut(public.statut_entree, TEXT, INTEGER, INTEGER) TO authenticated;
