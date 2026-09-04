-- Exposer l'article défini collé dans les écrans d'arbitrage
-- ============================================================================
-- Migration 20260903010000 : article et alsacien_sans_article existent sur
-- attestations pour 8 886 des 23 851 attestations lexicales culture_alsace
-- (d'r lohn -> article "d'r ", alsacien_sans_article "lohn"), mais aucun écran
-- ne les affichait encore — l'admin qui arbitre "salaire" voyait "d'r lohn"
-- sans indice que l'article est isolable.
--
-- Mesuré avant d'écrire quoi que ce soit (service_role, lecture seule) :
-- décomposer l'article ne débloque AUCUN recoupement actuellement en file —
-- seuls 25 candidats lexicaux ont 2 sources distinctes ou plus, et aucun
-- n'est unifié par le retrait de l'article. La quasi-totalité des 8 886
-- attestations décomposées restent à 1 source sur N (culture_alsace seule).
-- Ce correctif reste donc un pur affichage, jamais un changement de la clé de
-- recoupement : cleDeForme()/grouperParForme() (src/lib/dictionnaire.ts) ne
-- sont pas touchées, et cette migration ne touche pas non plus la clé de
-- groupement SQL (lower(btrim(francais)), contexte). Confondre l'article pour
-- décider d'un recoupement serait exactement l'erreur du « +13 » du
-- 24/08/2026 (accents) : ça n'a pas sa place ici tant qu'aucune mesure ne le
-- justifie.
--
-- article/alsacien_sans_article restent NULL pour la grande majorité des
-- attestations (autres sources, ou culture_alsace non décomposée) : les deux
-- champs sont ajoutés dans les deux fonctions, à titre d'annotation optionnelle
-- affichée uniquement quand présente. La forme reprise dans une entrée reste
-- toujours v.alsacien tel quel (règle 1) — l'article isolé n'est ni publié ni
-- proposé comme forme canonique séparée, cf. réserve doctrinale du
-- 02/09/2026 (« piste à confirmer ») non tranchée par ce correctif.
--
-- Coolify n'applique aucune migration : à passer à la main dans le SQL Editor.

CREATE OR REPLACE FUNCTION public.candidats_arbitrage(
  p_terme TEXT DEFAULT NULL,
  p_limite INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  cle TEXT,
  francais TEXT,
  contexte TEXT,
  type public.type_terme,
  nb_sources INTEGER,
  nb_attestations INTEGER,
  variantes JSONB,
  entree_id UUID
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
  WITH groupes AS (
    SELECT
      lower(btrim(a.francais)) AS cle,
      mode() WITHIN GROUP (ORDER BY a.francais) AS francais,
      a.contexte AS contexte,
      mode() WITHIN GROUP (ORDER BY a.type) AS type,
      count(DISTINCT a.source_id)::INTEGER AS nb_sources,
      count(*)::INTEGER AS nb_attestations,
      jsonb_agg(
        jsonb_build_object(
          'attestation_id', a.id,
          'alsacien', a.alsacien,
          'article', a.article,
          'alsacien_sans_article', a.alsacien_sans_article,
          'graphie_origine', a.graphie_origine,
          'region', a.region,
          'type', a.type,
          'source_id', s.id,
          'source_nom', s.nom,
          'source_type', s.type,
          'fiabilite', s.fiabilite,
          'reference', a.reference,
          'votes', (
            SELECT count(*)
            FROM public.attestation_votes v
            WHERE v.attestation_id = a.id
          )
        )
        ORDER BY a.created_at
      ) AS variantes
    FROM public.attestations a
    JOIN public.sources s ON s.id = a.source_id
    WHERE NOT EXISTS (
        SELECT 1 FROM public.entree_attestations ea WHERE ea.attestation_id = a.id
      )
      AND (
        v_terme = ''
        OR public.immutable_unaccent(lower(a.francais)) LIKE '%' || v_terme || '%'
      )
    GROUP BY lower(btrim(a.francais)), a.contexte
  )
  SELECT
    g.cle,
    g.francais,
    g.contexte,
    g.type,
    g.nb_sources,
    g.nb_attestations,
    g.variantes,
    (
      SELECT e.id
      FROM public.entrees e
      WHERE lower(btrim(e.francais)) = g.cle
        AND public.immutable_unaccent(lower(btrim(e.contexte)))
              = public.immutable_unaccent(lower(btrim(g.contexte)))
      LIMIT 1
    )
  FROM groupes g
  ORDER BY g.nb_sources DESC, g.nb_attestations DESC, g.francais
  LIMIT least(coalesce(p_limite, 50), 200)
  OFFSET greatest(coalesce(p_offset, 0), 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.detail_candidat(
  p_cle TEXT,
  p_contexte TEXT DEFAULT ''
)
RETURNS TABLE (
  cle TEXT,
  francais TEXT,
  contexte TEXT,
  type public.type_terme,
  nb_sources INTEGER,
  nb_attestations INTEGER,
  variantes JSONB,
  entree_id UUID,
  entree JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_contexte TEXT := btrim(coalesce(p_contexte, ''));
  v_entree public.entrees;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Arbitrage réservé aux administrateurs';
  END IF;

  SELECT * INTO v_entree
  FROM public.entrees e
  WHERE lower(btrim(e.francais)) = p_cle
    AND public.immutable_unaccent(lower(btrim(e.contexte))) = public.immutable_unaccent(lower(v_contexte));

  RETURN QUERY
  SELECT
    p_cle,
    coalesce(v_entree.francais, mode() WITHIN GROUP (ORDER BY a.francais)),
    v_contexte,
    coalesce(v_entree.type, mode() WITHIN GROUP (ORDER BY a.type)),
    count(DISTINCT a.source_id)::INTEGER,
    count(*)::INTEGER,
    jsonb_agg(
      jsonb_build_object(
        'attestation_id', a.id,
        'alsacien', a.alsacien,
        'article', a.article,
        'alsacien_sans_article', a.alsacien_sans_article,
        'graphie_origine', a.graphie_origine,
        'region', a.region,
        'type', a.type,
        'source_id', s.id,
        'source_nom', s.nom,
        'source_type', s.type,
        'fiabilite', s.fiabilite,
        'reference', a.reference,
        'votes', (
          SELECT count(*)
          FROM public.attestation_votes v
          WHERE v.attestation_id = a.id
        ),
        'retenue', EXISTS (
          SELECT 1
          FROM public.entree_attestations ea
          WHERE ea.attestation_id = a.id
            AND ea.entree_id IS NOT DISTINCT FROM v_entree.id
        )
      )
      ORDER BY a.created_at
    ),
    v_entree.id,
    CASE WHEN v_entree.id IS NULL THEN NULL ELSE jsonb_build_object(
      'traductions', v_entree.traductions,
      'statut', v_entree.statut,
      'notes_arbitrage', v_entree.notes_arbitrage
    ) END
  FROM public.attestations a
  JOIN public.sources s ON s.id = a.source_id
  WHERE lower(btrim(a.francais)) = p_cle
    AND btrim(a.contexte) = v_contexte
    AND (
      NOT EXISTS (
        SELECT 1 FROM public.entree_attestations ea WHERE ea.attestation_id = a.id
      )
      OR EXISTS (
        SELECT 1 FROM public.entree_attestations ea
        WHERE ea.attestation_id = a.id AND ea.entree_id = v_entree.id
      )
    )
  HAVING count(*) > 0;
END;
$$;
