-- ============================================
-- Propositions de graphie ORTHAL, signées par un automate
-- ============================================
-- ORTHAL 2023 est un système de graphie : il s'applique en sortie, sur une
-- forme DÉJÀ attestée. Un transcodage n'apporte donc aucune attestation
-- nouvelle — il réécrit une forme existante.
--
-- D'où la table séparée. Verser une proposition Orthal dans attestations
-- gonflerait nb_attestations et nb_sources d'un recoupement fictif : l'entrée
-- afficherait « 2 sources » là où il n'y en a qu'une, lue deux fois. C'est
-- exactement ce que les règles 2 et 3 de CLAUDE.md interdisent. Une
-- proposition Orthal est une AIDE À L'ARBITRAGE, au même titre qu'un vote de
-- pair (migration contributions) : elle ne compte jamais dans le score.
--
-- Elle est en outre produite par une machine. La décision du 08/08/2026 est
-- que cette machine signe sous une identité propre, explicitement désignée
-- comme automatique, pour que personne — arbitre ou visiteur — ne prenne un
-- transcodage pour le témoignage d'un locuteur.

-- ============================================
-- TABLE automates — registre des signataires non humains
-- ============================================
-- Un registre plutôt qu'un compte dans profiles : profiles.id référence
-- auth.users, et créer un utilisateur authentifiable pour un programme
-- reviendrait à poser des identifiants dont personne ne se sert. Ici
-- l'identité est déclarative et sans pouvoir : un automate ne se connecte pas,
-- ne vote pas, ne valide rien.

CREATE TABLE public.automates (
  code TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  description TEXT NOT NULL,
  version TEXT NOT NULL,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.automates IS
  'Registre des signataires automatiques. Un automate n''est pas un utilisateur : il n''a ni compte auth, ni rôle, ni droit de vote ou de validation. Sa seule fonction est de rendre traçable et visible le fait qu''un contenu a été produit par un programme.';
COMMENT ON COLUMN public.automates.nom IS
  'Nom affiché tel quel dans l''interface, précédé d''un marqueur machine. Doit rester explicite : personne ne doit pouvoir le confondre avec un pseudonyme humain.';
COMMENT ON COLUMN public.automates.version IS
  'Version du jeu de règles appliqué. Deux passages sous des versions différentes sont deux propositions distinctes, comparables entre elles.';

INSERT INTO public.automates (code, nom, description, version) VALUES (
  'orthal_bot',
  '🤖 Transcodeur ORTHAL (automatique)',
  'Système automatisé de transcodage graphique. Applique les règles ORTHAL 2023 (association AGATE) à une forme alsacienne déjà attestée dans une source. Ne traduit rien, n''invente aucune forme, ne valide aucune entrée. Ses propositions n''ont de valeur qu''après arbitrage humain.',
  'orthal-2023'
);

-- ============================================
-- TABLE propositions_orthal
-- ============================================

CREATE TABLE public.propositions_orthal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attestation_id UUID NOT NULL REFERENCES public.attestations(id) ON DELETE CASCADE,
  automate_code TEXT NOT NULL REFERENCES public.automates(code) ON DELETE RESTRICT,
  graphie_orthal TEXT NOT NULL,
  regles_appliquees TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (attestation_id, automate_code, graphie_orthal)
);

COMMENT ON TABLE public.propositions_orthal IS
  'Graphie ORTHAL proposée pour une attestation existante. N''est pas une attestation : ne compte ni dans nb_attestations ni dans nb_sources. Écriture réservée aux scripts (service_role), comme attestations.';
COMMENT ON COLUMN public.propositions_orthal.regles_appliquees IS
  'Les règles ORTHAL invoquées, en clair. Sans elles la proposition est invérifiable, donc inutilisable en arbitrage : l''arbitre doit pouvoir contester la règle, pas seulement le résultat.';

CREATE INDEX idx_propositions_orthal_attestation
  ON public.propositions_orthal (attestation_id);

-- ============================================
-- RLS
-- ============================================
-- Même régime qu'attestations : lecture admin, aucune policy d'écriture. Seuls
-- les scripts d'ingestion (service_role, hors RLS) alimentent cette table.
-- Rien n'est exposé publiquement ici : une proposition non arbitrée est du
-- transcodage brut, et la publier reviendrait à diffuser de l'alsacien que
-- personne n'a relu.

ALTER TABLE public.automates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.propositions_orthal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lecture_publique_automates"
ON public.automates FOR SELECT
USING (true);

CREATE POLICY "admins_lecture_propositions_orthal"
ON public.propositions_orthal FOR SELECT TO authenticated
USING (public.is_admin());

-- ============================================
-- Lecture pour l'écran d'arbitrage
-- ============================================
-- detail_candidat() renvoie les variantes d'un candidat ; cette fonction
-- renvoie les propositions Orthal qui s'y rapportent, dans le même idiome
-- (SECURITY DEFINER gardé par is_admin()). Volontairement séparée plutôt
-- qu'intégrée aux variantes : une proposition doit rester visuellement
-- distincte d'une forme attestée, jamais mélangée à elle.

CREATE OR REPLACE FUNCTION public.propositions_orthal_candidat(
  p_cle TEXT,
  p_contexte TEXT DEFAULT ''
)
RETURNS TABLE (
  attestation_id UUID,
  graphie_origine TEXT,
  graphie_orthal TEXT,
  regles_appliquees TEXT,
  automate_nom TEXT,
  automate_version TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_contexte TEXT := btrim(coalesce(p_contexte, ''));
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Arbitrage réservé aux administrateurs';
  END IF;

  RETURN QUERY
  SELECT
    p.attestation_id,
    a.graphie_origine,
    p.graphie_orthal,
    p.regles_appliquees,
    m.nom,
    m.version,
    p.created_at
  FROM public.propositions_orthal p
  JOIN public.attestations a ON a.id = p.attestation_id
  JOIN public.automates m ON m.code = p.automate_code
  WHERE public.immutable_unaccent(lower(btrim(a.francais))) = p_cle
    AND btrim(a.contexte) = v_contexte
  ORDER BY a.created_at, p.created_at;
END;
$$;

COMMENT ON FUNCTION public.propositions_orthal_candidat(TEXT, TEXT) IS
  'Propositions de graphie ORTHAL rattachées aux attestations d''un candidat à l''arbitrage. Aide à la décision, jamais une source : l''arbitre humain reste seul signataire de l''entrée via arbitrer_entree().';

REVOKE EXECUTE ON FUNCTION public.propositions_orthal_candidat(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.propositions_orthal_candidat(TEXT, TEXT) TO authenticated;

-- ============================================
-- Traçabilité publique d'une graphie retenue
-- ============================================
-- Si l'arbitre retient une graphie proposée par un automate, c'est lui qui
-- signe l'entrée (entrees.valide_par) — la responsabilité éditoriale reste
-- humaine. Mais l'origine machine de la graphie ne doit pas disparaître au
-- moment où elle devient publique : l'élément concerné du tableau
-- traductions porte alors la clé "orthal_par".

COMMENT ON COLUMN public.entrees.traductions IS
  'Tableau JSONB ordonné. Index 0 = traduction canonique ("Premier est Roi"). Chaque élément : {alsacien, region, niveau, note, nb_attestations}, plus la clé facultative "orthal_par" = automates.code lorsque la graphie retenue provient d''une proposition automatique (transparence : le visiteur doit pouvoir savoir qu''une machine a réécrit la graphie, même si un humain l''a validée).';
