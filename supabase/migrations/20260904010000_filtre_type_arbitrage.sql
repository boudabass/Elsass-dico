-- Filtre par type dans la file d'arbitrage
-- ============================================================================
-- Signalé par John (04/09/2026) : dans l'onglet « File d'arbitrage », il ne
-- voyait que des toponymes. Mesuré avant d'écrire quoi que ce soit (lecture
-- seule, réplique candidats_arbitrage() côté client avec la clé service_role,
-- qui ne peut pas appeler la RPC elle-même — is_admin() n'a pas de auth.uid()
-- pour ce rôle) :
--
--   - 343 candidats ont 2 sources ou plus (le tri de candidats_arbitrage() les
--     place avant tout le reste) : 320 toponymes, 22 mots, 1 prénom.
--   - Le tri (nb_sources DESC, nb_attestations DESC) place donc mécaniquement
--     ~7 pages de 50 dominées par les toponymes avant qu'un seul candidat à
--     source unique n'apparaisse.
--   - Sur les 25 778 candidats au total : 18 850 mots, 5 881 expressions, 904
--     toponymes, 143 prénoms. Les toponymes ne sont que 3,5 % du stock, mais
--     ils occupent la quasi-totalité des 50 premières lignes affichées.
--
-- Ce n'est pas un bug de la garde de recoupement (règle 2), ni de l'onglet
-- Recoupées/Divergentes (qui paginent déjà jusqu'à épuisement du
-- multi-sources, cf. parcourirCandidatsMultiSources()) : c'est l'onglet
-- général « File d'arbitrage », plafonné à 50 lignes sans pagination, qui n'a
-- aucun moyen de filtrer par type — seule la recherche sur le français existe.
--
-- Signature changée (ajout de p_type) : DROP nécessaire, une simple
-- CREATE OR REPLACE créerait une seconde fonction surchargée au lieu de
-- remplacer l'existante, et les deux seraient ambiguës pour un appel RPC à
-- arguments nommés (précédent : DROP FUNCTION dans 20260903000000).
--
-- Coolify n'applique aucune migration : à passer à la main dans le SQL Editor.

DROP FUNCTION IF EXISTS public.candidats_arbitrage(TEXT, INTEGER, INTEGER);

CREATE FUNCTION public.candidats_arbitrage(
  p_terme TEXT DEFAULT NULL,
  p_limite INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_type public.type_terme DEFAULT NULL
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
      AND (p_type IS NULL OR a.type = p_type)
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

COMMENT ON FUNCTION public.candidats_arbitrage(TEXT, INTEGER, INTEGER, public.type_terme) IS
  'File d''arbitrage : attestations non encore retenues dans une entrée, groupées par (français en minuscules, contexte). p_type filtre sur le type dominant du groupe — sans lui, les candidats à 2+ sources (93 % de toponymes) saturent les 50 premières lignes et masquent le lexique général. Les diacritiques sont significatifs — sur et sûr sont deux candidats, pas un. nb_sources est le vrai score de recoupement au sens de la règle 2 (les votes n''y comptent pas).';

REVOKE EXECUTE ON FUNCTION public.candidats_arbitrage(TEXT, INTEGER, INTEGER, public.type_terme) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.candidats_arbitrage(TEXT, INTEGER, INTEGER, public.type_terme) TO authenticated;
