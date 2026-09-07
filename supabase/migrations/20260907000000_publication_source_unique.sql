-- ============================================
-- Publication sur source unique : la garde devient l'affichage (07/09/2026)
-- ============================================
-- CLAUDE.md, règle 2 révisée le 02/09/2026 (décision de John) : une entrée peut
-- être publiée à partir d'une source unique **à condition d'afficher son niveau
-- de confiance** — 1 source = rouge, 2 = jaune, 3 et plus = vert. Le seuil
-- binaire « 2 sources ou rien » est remplacé par cette déclaration visible. Ce
-- qui reste interdit : présenter une entrée à 1 source comme si elle était
-- recoupée.
--
-- Cette révision n'avait été appliquée qu'à moitié. 20260903000000 a bien
-- ajouté entrees.nb_sources, l'a exposé aux trois écrans publics et créé
-- BadgeConfiance — son en-tête écrit même « l'affichage devient la garde qui
-- reste » — mais son corps a conservé intacte la garde héritée de l'exception
-- du 07/08/2026 : publier sous 2 sources exigeait une note d'arbitrage rédigée.
--
-- Résultat mesuré en base le 07/09/2026 : 335 entrées publiées, dont ZÉRO à une
-- source (189 à 2, 145 à 3, 1 à 4+), et 331 des 335 sont des toponymes contre
-- 4 mots. Les ~25 700 candidats lexicaux à source unique restaient inatteignables
-- autrement qu'en rédigeant une justification une par une — exactement le
-- blocage que la décision du 02/09 devait lever, et ce qui empêche la cible v1
-- (seuil de lexique courant).
--
-- Décision de John du 07/09/2026 : retirer la garde tout court, sans la
-- remplacer par un drapeau. nb_sources reste persisté et alimente le badge ;
-- c'est lui, désormais, qui porte la doctrine.
--
-- Ce que cette migration NE fait PAS : ouvrir la publication en lot au
-- mono-source. L'interdiction de la « reprise en masse d'une source scrapée »
-- (périmètre des GATE, 10/08/2026) n'est pas levée. Les deux chemins de lot
-- (arbitrerLotAction, arbitrerDivergenceAction) constituent leurs files via
-- parcourirCandidatsMultiSources(), qui écarte tout candidat sous
-- SOURCES_MINIMUM (src/app/actions/arbitrage.ts). Après cette migration, ce
-- filtre TypeScript devient le SEUL endroit qui empêche un lot de publier du
-- mono-source : à traiter comme tel si quelqu'un y touche.

-- ============================================
-- arbitrer_entree() : retrait de la garde nb_sources < 2
-- ============================================
-- Signature inchangée (8 paramètres), seul le corps bouge : CREATE OR REPLACE
-- suffit et conserve les privilèges. p_notes reste dans la signature et v_notes
-- continue d'alimenter notes_arbitrage — la note devient facultative et
-- documentaire, elle ne disparaît pas.
--
-- Toutes les autres gardes sont conservées telles quelles : is_admin()
-- (règle 4), français non vide, p_traductions tableau JSON, chaque traduction
-- porteuse d'une forme alsacienne, au moins une attestation (règle 3),
-- attestation inconnue dans la sélection.

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

  -- Ici se trouvait la garde « publication sur source unique : une note
  -- d'arbitrage est obligatoire ». Elle est retirée (règle 2 révisée du
  -- 02/09/2026). v_nb_sources reste calculé et persisté : il n'est plus une
  -- condition de publication, il est ce qui s'affiche au visiteur.

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
  'Crée ou met à jour une entrée, remplace ses liens de traçabilité et recalcule nb_attestations ET nb_sources, en une transaction. Ne refuse plus la publication sous 2 sources distinctes (règle 2 révisée du 02/09/2026) : nb_sources est persisté et affiché comme niveau de confiance, la note d''arbitrage est facultative. Le seuil de 2 sources ne subsiste que dans les chemins de LOT, côté TypeScript (SOURCES_MINIMUM).';

-- ============================================
-- entrees_par_statut() : la clé cesse (de nouveau) d'unaccenter
-- ============================================
-- Régression introduite le 03/09/2026. La migration 20260824120000 avait retiré
-- immutable_unaccent de la clé d'arbitrage dans les quatre fonctions qui la
-- produisent ou la comparent, parce qu'elle fusionnait des mots français
-- distincts (sur/sûr, ou/où, ville/Villé — 31 groupes). 20260903000000 a
-- redéfini entrees_par_statut() pour y exposer nb_sources, et a recopié au
-- passage l'ANCIENNE expression de clé, annulant la correction pour cette
-- fonction seule.
--
-- Cette clé n'est pas décorative : elle sert de lien vers l'écran de détail
-- (admin/arbitrage/page.tsx, onglet « Entrées existantes » -> lienArbitrage()
-- -> detail_candidat(p_cle), qui compare lower(btrim(a.francais)) = p_cle). Une
-- entrée dont le français porte un accent (« épreuve », « été ») rendait donc
-- une clé désaccentuée qui ne retrouve pas son candidat. Invisible jusqu'ici —
-- 331 des 335 entrées publiées sont des toponymes sans accent — mais bloquant
-- dès la première publication de lexique, c'est-à-dire dès maintenant.
--
-- CREATE OR REPLACE et non DROP + CREATE : la liste de colonnes est identique à
-- celle en vigueur, donc les GRANT posés en 20260903000000 sont conservés (un
-- DROP les retirerait).

CREATE OR REPLACE FUNCTION public.entrees_par_statut(
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
  -- Le filtre de recherche, lui, garde unaccent : chercher « epreuve » doit
  -- trouver « épreuve ». C'est la CLÉ qui ne doit pas désaccentuer, pas le
  -- terme (même distinction qu'en 20260824120000).
  v_terme TEXT := public.immutable_unaccent(lower(btrim(coalesce(p_terme, ''))));
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Arbitrage réservé aux administrateurs';
  END IF;

  RETURN QUERY
  SELECT
    e.id,
    lower(btrim(e.francais)),
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

COMMENT ON FUNCTION public.entrees_par_statut(public.statut_entree, TEXT, INTEGER, INTEGER) IS
  'Entrées existantes filtrées par statut et par terme, pour l''écran d''arbitrage. La clé rendue est lower(btrim(francais)) — SANS unaccent, comme candidats_arbitrage() et detail_candidat() depuis le 24/08/2026 : c''est elle qui sert de lien vers l''écran de détail. Le filtre p_terme reste désaccentué, lui.';
