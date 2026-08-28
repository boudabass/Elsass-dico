-- ============================================
-- Parcours alphabétique public (écran "Dictionnaire A-Z" du handoff mobile
-- design_handoff_mobile_app/, 28/08/2026)
-- ============================================
-- rechercher_entrees() sert la recherche floue, pas le parcours par lettre :
-- aucune fonction n'existe encore pour lister les entrées valides groupées
-- par initiale, ni pour savoir quelles lettres ont au moins une entrée
-- (rail alphabet : active / disponible / pas encore peuplée).
--
-- Même politique que rechercher_entrees() : PAS SECURITY DEFINER, le RLS
-- lecture_publique_entrees_validees est la barrière, et statut='valide' est
-- répété explicitement pour qu'un contributeur connecté ne voie pas de
-- brouillon ici.

CREATE OR REPLACE FUNCTION public.lettres_disponibles()
RETURNS TABLE (lettre TEXT)
LANGUAGE sql
STABLE
SET search_path = public, extensions
AS $$
  SELECT DISTINCT upper(left(public.immutable_unaccent(e.francais), 1)) AS lettre
  FROM public.entrees e
  WHERE e.statut = 'valide'
    AND e.francais <> ''
  ORDER BY lettre;
$$;

COMMENT ON FUNCTION public.lettres_disponibles() IS
  'Initiales (désaccentuées) ayant au moins une entrée valide. Alimente le rail alphabet de l''écran Dictionnaire A-Z : une lettre absente du résultat n''a encore aucune entrée publiée.';

CREATE OR REPLACE FUNCTION public.entrees_par_lettre(p_lettre TEXT)
RETURNS TABLE (
  id UUID,
  francais TEXT,
  contexte TEXT,
  type public.type_terme,
  traductions JSONB,
  nb_attestations INTEGER
)
LANGUAGE sql
STABLE
SET search_path = public, extensions
AS $$
  SELECT e.id, e.francais, e.contexte, e.type, e.traductions, e.nb_attestations
  FROM public.entrees e
  WHERE e.statut = 'valide'
    AND upper(left(public.immutable_unaccent(e.francais), 1)) = upper(left(public.immutable_unaccent(coalesce(p_lettre, '')), 1))
  ORDER BY public.immutable_unaccent(lower(e.francais)), e.francais;
$$;

COMMENT ON FUNCTION public.entrees_par_lettre(TEXT) IS
  'Entrées valides dont le français commence par la lettre donnée (comparaison désaccentuée). Non SECURITY DEFINER : le RLS reste la barrière, comme rechercher_entrees().';

REVOKE EXECUTE ON FUNCTION public.lettres_disponibles() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.entrees_par_lettre(TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.lettres_disponibles() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.entrees_par_lettre(TEXT) TO anon, authenticated;
