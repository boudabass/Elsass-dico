-- ============================================
-- Compteur de votes propres (écran "Mon espace" du handoff mobile
-- design_handoff_mobile_app/, 28/08/2026 — variantes contributeur/admin)
-- ============================================
-- attestation_votes n'a aucune policy de lecture pour son propre profil
-- (seulement "contributeurs_retrait_vote" en DELETE et "admins_lecture_votes"
-- en SELECT réservée aux admins, cf. 20260807100000_contributions.sql) :
-- compter ses propres votes exige donc une fonction SECURITY DEFINER, même
-- raisonnement que mes_contributions(). Les deux autres compteurs de l'écran
-- (propositions, promotions) se dérivent côté client de mes_contributions()
-- déjà existante — pas de fonction supplémentaire nécessaire pour eux.

CREATE OR REPLACE FUNCTION public.mes_votes_count()
RETURNS INTEGER
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT count(*)::INTEGER
  FROM public.attestation_votes v
  WHERE v.profil_id = auth.uid();
$$;

COMMENT ON FUNCTION public.mes_votes_count() IS
  'Nombre de votes de validation posés par l''utilisateur courant. SECURITY DEFINER requis : attestation_votes n''expose aucune lecture directe du profil sur ses propres votes.';

GRANT EXECUTE ON FUNCTION public.mes_votes_count() TO authenticated;
