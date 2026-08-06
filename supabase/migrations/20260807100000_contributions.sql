-- ============================================
-- Contributions communautaires
-- ============================================
-- Un contributeur est une source (sources.type = 'contribution', valeur déjà
-- prévue par le schéma initial) : sa proposition entre dans attestations, au
-- même titre qu'un site ou un ouvrage, et non directement dans entrees.
--
-- La validation par les pairs est un VOTE, distinct de l'attestation : voter
-- ne crée pas d'attestation supplémentaire, donc le score n'est pas un
-- recoupement au sens de la règle 2. C'est une aide à l'arbitrage, rien de
-- plus : aucun seuil ne déclenche quoi que ce soit automatiquement.

-- ============================================
-- Lien contributeur <-> source
-- ============================================

ALTER TABLE public.sources
  ADD COLUMN IF NOT EXISTS profil_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE RESTRICT;

COMMENT ON COLUMN public.sources.profil_id IS
  'Renseigné uniquement pour les sources de type "contribution" : le contributeur dont cette source porte les propositions. Un contributeur = une source, pour que deux contributeurs proposant le même mot comptent comme deux attestations distinctes (la contrainte UNIQUE de attestations porte sur source_id).';

-- ============================================
-- Table des votes
-- ============================================

CREATE TABLE public.attestation_votes (
  attestation_id UUID NOT NULL REFERENCES public.attestations(id) ON DELETE CASCADE,
  profil_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (attestation_id, profil_id)
);

COMMENT ON TABLE public.attestation_votes IS
  'Validation par les pairs d''une contribution. Un vote n''est pas une attestation : il ne compte pas dans le recoupement, il ne fait que remonter la proposition dans la file d''arbitrage. La clé primaire garantit un vote par contributeur et par contribution.';

ALTER TABLE public.attestation_votes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Fonctions d'appui (SECURITY DEFINER)
-- ============================================
-- Indispensables, et pas seulement par confort : une sous-requête placée
-- directement dans une policy est elle-même soumise au RLS de la table
-- qu'elle interroge. Un « NOT EXISTS » sur entree_attestations, invisible au
-- contributeur, renverrait donc toujours vrai — la garde échouerait OUVERTE.
-- Passer par des fonctions SECURITY DEFINER contourne ce piège.

CREATE OR REPLACE FUNCTION public.est_ma_source(p_source_id UUID)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sources
    WHERE id = p_source_id AND profil_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.est_mon_attestation(p_attestation_id UUID)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.attestations a
    JOIN public.sources s ON s.id = a.source_id
    WHERE a.id = p_attestation_id AND s.profil_id = auth.uid()
  );
$$;

-- Une contribution déjà retenue dans une entrée se fige : la traçabilité
-- mentirait sur ce qui a fondé la décision si son contenu changeait après coup.
CREATE OR REPLACE FUNCTION public.attestation_est_retenue(p_attestation_id UUID)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.entree_attestations WHERE attestation_id = p_attestation_id
  );
$$;

-- Crée à la demande la source du contributeur courant, et renvoie son id.
-- Le nom est volontairement pseudonyme : sources_entree() expose nom et url
-- publiquement pour toute entrée validée, un e-mail y fuiterait. L'adresse
-- reste dans notes, que cette fonction publique ne renvoie pas.
CREATE OR REPLACE FUNCTION public.source_du_contributeur()
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_profil public.profiles;
  v_source_id UUID;
BEGIN
  SELECT * INTO v_profil FROM public.profiles WHERE id = auth.uid();

  IF v_profil.id IS NULL OR v_profil.role NOT IN ('contributeur', 'admin') THEN
    RAISE EXCEPTION 'Réservé aux contributeurs';
  END IF;

  SELECT id INTO v_source_id FROM public.sources WHERE profil_id = v_profil.id;
  IF v_source_id IS NOT NULL THEN
    RETURN v_source_id;
  END IF;

  INSERT INTO public.sources (code, nom, type, fiabilite, profil_id, notes)
  VALUES (
    'contrib_' || replace(v_profil.id::text, '-', ''),
    'Contributeur ' || left(replace(v_profil.id::text, '-', ''), 8),
    'contribution',
    3,
    v_profil.id,
    v_profil.email
  )
  RETURNING id INTO v_source_id;

  RETURN v_source_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.source_du_contributeur() TO authenticated;

-- ============================================
-- Policies : écriture des contributions
-- ============================================
-- Aucune policy SELECT large n'est ajoutée sur attestations : les lectures du
-- contributeur passent par les fonctions ci-dessous. Une policy SELECT
-- appelant une fonction par ligne serait évaluée sur les 7260+ attestations
-- importées, pour rien.

CREATE POLICY "contributeurs_creation_contributions"
ON public.attestations FOR INSERT TO authenticated
WITH CHECK (
  public.is_contributeur() AND public.est_ma_source(source_id)
);

CREATE POLICY "contributeurs_modification_contributions"
ON public.attestations FOR UPDATE TO authenticated
USING (
  public.is_contributeur()
  AND public.est_mon_attestation(attestations.id)
  AND NOT public.attestation_est_retenue(attestations.id)
)
WITH CHECK (
  public.is_contributeur() AND public.est_ma_source(source_id)
);

CREATE POLICY "contributeurs_suppression_contributions"
ON public.attestations FOR DELETE TO authenticated
USING (
  public.is_contributeur()
  AND public.est_mon_attestation(attestations.id)
  AND NOT public.attestation_est_retenue(attestations.id)
);

-- ============================================
-- Policies : votes
-- ============================================

-- On ne vote pas pour soi-même : l'auteur atteste déjà sa proposition.
CREATE POLICY "contributeurs_vote"
ON public.attestation_votes FOR INSERT TO authenticated
WITH CHECK (
  public.is_contributeur()
  AND profil_id = auth.uid()
  AND NOT public.est_mon_attestation(attestation_id)
);

CREATE POLICY "contributeurs_retrait_vote"
ON public.attestation_votes FOR DELETE TO authenticated
USING (profil_id = auth.uid());

CREATE POLICY "admins_lecture_votes"
ON public.attestation_votes FOR SELECT TO authenticated
USING (public.is_admin());

-- ============================================
-- Lectures du contributeur
-- ============================================

CREATE OR REPLACE FUNCTION public.mes_contributions()
RETURNS TABLE (
  id UUID,
  francais TEXT,
  alsacien TEXT,
  contexte TEXT,
  type public.type_terme,
  region public.region_alsace,
  created_at TIMESTAMPTZ,
  score INTEGER,
  retenue BOOLEAN
)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT
    a.id, a.francais, a.alsacien, a.contexte, a.type, a.region, a.created_at,
    (SELECT count(*) FROM public.attestation_votes v WHERE v.attestation_id = a.id)::INTEGER,
    public.attestation_est_retenue(a.id)
  FROM public.attestations a
  JOIN public.sources s ON s.id = a.source_id
  WHERE s.profil_id = auth.uid()
  ORDER BY a.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.contributions_a_valider()
RETURNS TABLE (
  id UUID,
  francais TEXT,
  alsacien TEXT,
  contexte TEXT,
  type public.type_terme,
  region public.region_alsace,
  auteur TEXT,
  score INTEGER,
  deja_vote BOOLEAN
)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT
    a.id, a.francais, a.alsacien, a.contexte, a.type, a.region,
    s.nom,
    (SELECT count(*) FROM public.attestation_votes v WHERE v.attestation_id = a.id)::INTEGER,
    EXISTS (
      SELECT 1 FROM public.attestation_votes v
      WHERE v.attestation_id = a.id AND v.profil_id = auth.uid()
    )
  FROM public.attestations a
  JOIN public.sources s ON s.id = a.source_id
  WHERE s.type = 'contribution'
    AND s.profil_id IS DISTINCT FROM auth.uid()
    AND (public.is_contributeur() OR public.is_admin())
  ORDER BY a.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.mes_contributions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.contributions_a_valider() TO authenticated;
